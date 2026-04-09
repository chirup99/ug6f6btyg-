import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Translation cache — avoid re-translating identical text/language pairs
// Keyed as "lang:text", max 500 entries (simple LRU eviction)
// ─────────────────────────────────────────────────────────────────────────────
const translationCache = new Map<string, string>();
const TRANSLATION_CACHE_MAX = 500;

function getTranslationCache(lang: string, text: string): string | undefined {
  return translationCache.get(`${lang}:${text}`);
}

function setTranslationCache(lang: string, text: string, translated: string) {
  if (translationCache.size >= TRANSLATION_CACHE_MAX) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(`${lang}:${text}`, translated);
}

// ─────────────────────────────────────────────────────────────────────────────
// Concurrency limiter — max 2 simultaneous translation requests to avoid
// rate-limiting from the background preload system firing 54 clips at once
// ─────────────────────────────────────────────────────────────────────────────
let activeTranslations = 0;
const MAX_CONCURRENT_TRANSLATIONS = 2;
const translationQueue: Array<() => void> = [];

function acquireTranslationSlot(): Promise<void> {
  return new Promise(resolve => {
    if (activeTranslations < MAX_CONCURRENT_TRANSLATIONS) {
      activeTranslations++;
      resolve();
    } else {
      translationQueue.push(() => {
        activeTranslations++;
        resolve();
      });
    }
  });
}

function releaseTranslationSlot() {
  activeTranslations--;
  const next = translationQueue.shift();
  if (next) next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Translate — using the reliable `gtx` client endpoint
// No API key needed, high limits, officially available publicly
// URL: translate.googleapis.com (different from the rate-limited translate.google.com)
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_LANG_MAP: Record<string, string> = {
  hi: 'hi', bn: 'bn', ta: 'ta', te: 'te',
  mr: 'mr', gu: 'gu', kn: 'kn', ml: 'ml',
  pa: 'pa', or: 'or',
};

async function translateChunkGoogle(chunk: string, targetLang: string): Promise<string> {
  const googleLang = GOOGLE_LANG_MAP[targetLang] || targetLang;
  const encoded = encodeURIComponent(chunk.trim());

  // gtx endpoint — much more reliable than client=at, no rate-limit issues
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${googleLang}&dt=t&q=${encoded}`;

  const response = await axios.get(url, {
    timeout: 12000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
    },
  });

  // Response format: [[["translated","original",null,null,null,null,null,null,null,[]],...],...]
  const data = response.data;
  if (Array.isArray(data) && Array.isArray(data[0])) {
    const translated = data[0]
      .filter((item: any) => Array.isArray(item) && item[0])
      .map((item: any) => item[0])
      .join('');
    if (translated && translated.trim().length > 0) {
      return translated.trim();
    }
  }
  return chunk; // fallback to original if response malformed
}

// ─────────────────────────────────────────────────────────────────────────────
// Main translateText — splits text, uses translation cache, concurrency limiter
// ─────────────────────────────────────────────────────────────────────────────
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const supportedLangs = ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or'];
  if (!supportedLangs.includes(targetLanguage)) return text;

  // Check translation cache first (avoids duplicate API calls entirely)
  const cached = getTranslationCache(targetLanguage, text);
  if (cached) {
    console.log(`🎯 [TTS TRANSLATE CACHE HIT] ${targetLanguage} (${text.length} chars)`);
    return cached;
  }

  // Acquire concurrency slot (max 2 simultaneous to avoid rate limits)
  await acquireTranslationSlot();

  try {
    console.log(`🌐 [TTS] Translating to ${targetLanguage} (${text.length} chars) via Google Translate gtx...`);

    // Split into sentence-level chunks (≤420 chars each)
    const sentences = text.split(/(?<=[.!?।])\s+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).trim().length <= 420) {
        current = (current + ' ' + sentence).trim();
      } else {
        if (current) chunks.push(current);
        if (sentence.length > 420) {
          const parts = sentence.split(/,\s*/);
          let part = '';
          for (const p of parts) {
            if ((part + ', ' + p).trim().length <= 420) {
              part = (part + ', ' + p).trim();
            } else {
              if (part) chunks.push(part);
              part = p.trim();
            }
          }
          if (part) chunks.push(part);
          current = '';
        } else {
          current = sentence.trim();
        }
      }
    }
    if (current) chunks.push(current);
    if (chunks.length === 0 && text.trim().length > 0) chunks.push(text.trim());

    console.log(`🌐 [TTS] Translating ${chunks.length} chunk(s) to ${targetLanguage}...`);

    // Translate chunks in parallel (all chunks within one request are fine — it's
    // the concurrent requests from different preload jobs that cause rate limits,
    // which the concurrency slot above handles)
    const translatedChunks = await Promise.all(
      chunks.map(chunk =>
        translateChunkGoogle(chunk, targetLanguage).catch(err => {
          console.warn(`⚠️ [TTS] Chunk translation failed (${targetLanguage}): ${err?.message}`);
          return chunk; // keep original on error
        })
      )
    );

    const result = translatedChunks.join(' ');
    console.log(`✅ [TTS] Translated to ${targetLanguage}: "${result.substring(0, 100)}..."`);

    // Cache the translation
    setTranslationCache(targetLanguage, text, result);
    return result;
  } catch (err: any) {
    console.error(`❌ [TTS] Translation error (${targetLanguage}):`, err?.message || err);
    return text; // return original as final fallback
  } finally {
    releaseTranslationSlot();
  }
}

export interface TTSRequest {
  text: string;
  language: string;
  speaker?: string;
  speed?: number;
}

export interface TTSResponse {
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
}

// Free, open-source TTS Service using Microsoft Edge TTS (same tech as openai-edge-tts reference)
// Uses msedge-tts which connects to Microsoft's Edge Read Aloud API via WebSocket
export const sarvamTTSService = {
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const voiceName = this.getVoiceNameForLanguage(request.language, request.speaker);
      const speed = request.speed || 1.0;

      const ratePercent = Math.round((speed - 1.0) * 100);
      const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

      console.log(`🎤 [TTS] Generating speech via Edge TTS WebSocket: voice=${voiceName}, rate=${rateStr}`);

      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {});

        const { audioStream } = tts.toStream(request.text, { rate: rateStr });

        const chunks: Buffer[] = [];

        await Promise.race([
          new Promise<void>((resolve, reject) => {
            audioStream.on('data', (chunk: Buffer | Uint8Array) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            audioStream.on('end', resolve);
            audioStream.on('error', reject);
            audioStream.on('close', resolve);
          }),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('TTS WebSocket timeout after 25s')), 25000)
          ),
        ]);

        if (chunks.length === 0) {
          console.warn(`⚠️ [TTS] Empty audio buffer for: "${request.text.substring(0, 50)}..."`);
          return { error: 'TTS generation returned empty audio' };
        }

        const audioBuffer = Buffer.concat(chunks);
        const audioBase64 = audioBuffer.toString('base64');

        console.log(`✅ [TTS] Generated ${audioBuffer.length} bytes for "${request.text.substring(0, 50)}..." using ${voiceName}`);

        return { audioBase64: `data:audio/mpeg;base64,${audioBase64}` };
      } catch (streamError) {
        const streamErrorMsg = streamError instanceof Error ? streamError.message : String(streamError);
        console.error(`❌ [TTS] Stream error:`, streamErrorMsg);
        return { error: `Audio stream processing failed: ${streamErrorMsg}` };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [TTS] Error generating speech:`, errorMsg);
      return { error: `TTS generation failed: ${errorMsg}` };
    }
  },

  getVoiceNameForLanguage(language: string, speakerId?: string): string {
    if (speakerId && speakerId.includes('Neural')) {
      const voiceLangPrefix = speakerId.split('-')[0].toLowerCase();
      const targetLangPrefix = language.toLowerCase();
      if (voiceLangPrefix === targetLangPrefix) {
        console.log(`🎤 [TTS] Using speaker ID directly (language match): ${speakerId}`);
        return speakerId;
      }
      // Speaker language doesn't match content language — correctly falling back to language-mapped voice
    } else if (speakerId && speakerId.includes('-') && !speakerId.includes('Neural')) {
      console.log(`🎤 [TTS] Using speaker ID directly: ${speakerId}`);
      return speakerId;
    }

    const openaiVoiceMapping: { [key: string]: string } = {
      'alloy':   'en-US-JennyNeural',
      'ash':     'en-US-AndrewNeural',
      'ballad':  'en-GB-ThomasNeural',
      'coral':   'en-AU-NatashaNeural',
      'echo':    'en-US-GuyNeural',
      'fable':   'en-GB-SoniaNeural',
      'nova':    'en-US-AriaNeural',
      'onyx':    'en-US-EricNeural',
      'sage':    'en-US-JennyNeural',
      'shimmer': 'en-US-EmmaNeural',
      'verse':   'en-US-BrianNeural',
    };

    const speakerVoiceMap: { [key: string]: string } = {
      'en-US-AriaNeural':  'en-US-AriaNeural',
      'en-US-EmmaNeural':  'en-US-EmmaNeural',
      'en-US-EricNeural':  'en-US-EricNeural',
      'aria':     'en-US-AriaNeural',
      'emma':     'en-US-EmmaNeural',
      'eric':     'en-US-EricNeural',
      'samantha': 'en-US-EmmaNeural',
      'liam':     'en-US-EricNeural',
      'sophia':   'en-US-AriaNeural',
    };

    if (speakerId) {
      const mapped = speakerVoiceMap[speakerId.toLowerCase()];
      if (mapped) return mapped;
      const openaiMapped = openaiVoiceMapping[speakerId.toLowerCase()];
      if (openaiMapped) return openaiMapped;
    }

    const languageVoiceMap: { [key: string]: string } = {
      'en': 'en-IN-NeerjaNeural',
      'hi': 'hi-IN-MadhurNeural',
      'bn': 'bn-IN-BashkarNeural',
      'ta': 'ta-IN-ValluvarNeural',
      'te': 'te-IN-MohanNeural',
      'mr': 'mr-IN-ManoharNeural',
      'gu': 'gu-IN-DhwaniNeural',
      'kn': 'kn-IN-GaganNeural',
      'ml': 'ml-IN-MidhunNeural',
      'pa': 'pa-IN-GurdipNeural',
      'or': 'or-IN-SukantNeural',
    };

    return languageVoiceMap[language] || 'en-US-AriaNeural';
  },

  supportedLanguages: [
    { code: 'en', name: 'English (Indian)' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  ],

  voicesByLanguage: {
    'en': [
      { name: 'Neerja', voice: 'en-IN-NeerjaNeural', gender: 'Female', accent: 'Indian', description: 'Natural Indian English' },
      { name: 'Prabhat', voice: 'en-IN-PrabhatNeural', gender: 'Male', accent: 'Indian', description: 'Clear Indian English' },
      { name: 'Neerja Expressive', voice: 'en-IN-NeerjaExpressiveNeural', gender: 'Female', accent: 'Indian', description: 'Expressive Indian English' },
    ],
    'hi': [
      { name: 'Madhur', voice: 'hi-IN-MadhurNeural', gender: 'Male', accent: 'India', description: 'Natural Indian accent' },
      { name: 'Gaurav', voice: 'hi-IN-GauravNeural', gender: 'Male', accent: 'India', description: 'Clear articulation' },
    ],
    'bn': [
      { name: 'Bashkar', voice: 'bn-IN-BashkarNeural', gender: 'Male', accent: 'India', description: 'Natural Bengali' },
    ],
    'ta': [
      { name: 'Valluvar', voice: 'ta-IN-ValluvarNeural', gender: 'Male', accent: 'India', description: 'Natural Tamil' },
    ],
    'te': [
      { name: 'Mohan', voice: 'te-IN-MohanNeural', gender: 'Male', accent: 'India', description: 'Natural Telugu' },
    ],
    'mr': [
      { name: 'Manohar', voice: 'mr-IN-ManoharNeural', gender: 'Male', accent: 'India', description: 'Natural Marathi' },
    ],
    'gu': [
      { name: 'Dhwani', voice: 'gu-IN-DhwaniNeural', gender: 'Female', accent: 'India', description: 'Natural Gujarati' },
    ],
    'kn': [
      { name: 'Gagan', voice: 'kn-IN-GaganNeural', gender: 'Male', accent: 'India', description: 'Natural Kannada' },
      { name: 'Sapna', voice: 'kn-IN-SapnaNeural', gender: 'Female', accent: 'India', description: 'Natural Kannada' },
    ],
    'ml': [
      { name: 'Midhun', voice: 'ml-IN-MidhunNeural', gender: 'Male', accent: 'India', description: 'Natural Malayalam' },
      { name: 'Sobhana', voice: 'ml-IN-SobhanaNeural', gender: 'Female', accent: 'India', description: 'Natural Malayalam' },
    ],
    'pa': [
      { name: 'Gurdip', voice: 'pa-IN-GurdipNeural', gender: 'Male', accent: 'India', description: 'Natural Punjabi' },
      { name: 'Ojas', voice: 'pa-IN-OjasNeural', gender: 'Female', accent: 'India', description: 'Natural Punjabi' },
    ],
    'or': [
      { name: 'Sukant', voice: 'or-IN-SukantNeural', gender: 'Male', accent: 'India', description: 'Natural Odia' },
      { name: 'Subhasini', voice: 'or-IN-SubhasiniNeural', gender: 'Female', accent: 'India', description: 'Natural Odia' },
    ],
  }
};
