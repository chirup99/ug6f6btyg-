import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Google Translate (unofficial free API) — fast, reliable, no key required
// Handles all 8 Indian languages perfectly, much higher limits than MyMemory
// ─────────────────────────────────────────────────────────────────────────────

// Language code mapping: our internal codes → Google Translate codes
const GOOGLE_LANG_MAP: Record<string, string> = {
  hi: 'hi',   // Hindi
  bn: 'bn',   // Bengali
  ta: 'ta',   // Tamil
  te: 'te',   // Telugu
  mr: 'mr',   // Marathi
  gu: 'gu',   // Gujarati
  kn: 'kn',   // Kannada
  ml: 'ml',   // Malayalam
};

// Translate a single chunk via Google Translate free API (fast, no key needed)
async function translateChunkGoogle(chunk: string, targetLang: string): Promise<string> {
  const googleLang = GOOGLE_LANG_MAP[targetLang] || targetLang;
  
  try {
    // Use the @vitalets/google-translate-api package
    const { translate } = await import('@vitalets/google-translate-api');
    const result = await translate(chunk.trim(), { from: 'en', to: googleLang });
    const translated = result?.text;
    if (translated && translated.trim().length > 0 && translated !== chunk) {
      return translated;
    }
    return chunk;
  } catch (googleErr: any) {
    // If Google Translate fails, try MyMemory as fallback
    console.warn(`⚠️ [TTS] Google Translate failed for chunk, trying MyMemory: ${googleErr?.message}`);
    try {
      return await translateChunkMyMemory(chunk, targetLang);
    } catch {
      return chunk; // Final fallback: return original
    }
  }
}

// MyMemory fallback (kept as secondary option)
async function translateChunkMyMemory(chunk: string, targetLanguage: string): Promise<string> {
  const encoded = encodeURIComponent(chunk.trim());
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${targetLanguage}`;
  const response = await axios.get(url, { timeout: 8000 });
  const translated = response.data?.responseData?.translatedText;
  if (
    translated &&
    translated !== chunk &&
    !translated.toLowerCase().includes('mymemory') &&
    !translated.toLowerCase().includes('quota') &&
    !translated.toLowerCase().includes('select two distinct')
  ) {
    return translated;
  }
  return chunk;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main translateText — splits into chunks and translates ALL in PARALLEL
// (previously sequential, which was slow and caused more failures)
// ─────────────────────────────────────────────────────────────────────────────
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const supportedLangs = ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml'];
  if (!supportedLangs.includes(targetLanguage)) return text;

  try {
    console.log(`🌐 [TTS] Translating to ${targetLanguage} (${text.length} chars) via Google Translate...`);

    // Split into sentence-level chunks (≤420 chars each)
    const sentences = text.split(/(?<=[.!?।])\s+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).trim().length <= 420) {
        current = (current + ' ' + sentence).trim();
      } else {
        if (current) chunks.push(current);
        // If a single sentence is itself too long, split at commas
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

    // If no chunks (text was too short to split), treat whole text as one chunk
    if (chunks.length === 0 && text.trim().length > 0) {
      chunks.push(text.trim());
    }

    console.log(`🌐 [TTS] Translating ${chunks.length} chunk(s) to ${targetLanguage} in parallel...`);

    // ── PARALLEL translation — all chunks fire at once ────────────────────
    const translatedChunks = await Promise.all(
      chunks.map(chunk => translateChunkGoogle(chunk, targetLanguage).catch(() => chunk))
    );

    const result = translatedChunks.join(' ');
    console.log(`✅ [TTS] Translated to ${targetLanguage}: "${result.substring(0, 100)}..."`);
    return result;
  } catch (err: any) {
    console.error('[TTS] Translation error:', err?.message || err);
    return text; // Return original text as final fallback
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
// Reference: https://github.com/travisvn/openai-edge-tts
export const sarvamTTSService = {
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const voiceName = this.getVoiceNameForLanguage(request.language, request.speaker);
      const speed = request.speed || 1.0;

      // Convert speed to SSML rate percentage format
      // openai-edge-tts maps: speed 1.0 = "+0%", speed 1.5 = "+50%", speed 0.5 = "-50%"
      const ratePercent = Math.round((speed - 1.0) * 100);
      const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

      console.log(`🎤 [TTS] Generating speech via Edge TTS WebSocket: voice=${voiceName}, rate=${rateStr}`);

      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {});

        const { audioStream } = tts.toStream(request.text, { rate: rateStr });

        // Collect audio chunks into a buffer
        const chunks: Buffer[] = [];

        // Wrap in a race with a 25-second timeout to prevent WebSocket hangs
        // under high load or network issues (critical for 1M users in production)
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

        return {
          audioBase64: `data:audio/mpeg;base64,${audioBase64}`
        };
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

  // Voice mapping following openai-edge-tts voice choices
  // Reference: https://github.com/travisvn/openai-edge-tts
  getVoiceNameForLanguage(language: string, speakerId?: string): string {
    // If speakerId is already a full voice ID (contains "-Neural"), use it only if it matches the target language
    if (speakerId && speakerId.includes('Neural')) {
      // Extract the language prefix from the voice ID (e.g. "hi" from "hi-IN-MadhurNeural", "en" from "en-US-AriaNeural")
      const voiceLangPrefix = speakerId.split('-')[0].toLowerCase();
      const targetLangPrefix = language.toLowerCase();
      if (voiceLangPrefix === targetLangPrefix) {
        console.log(`🎤 [TTS] Using speaker ID directly (language match): ${speakerId}`);
        return speakerId;
      }
      // Voice language doesn't match target language — fall through to language map
      console.log(`🎤 [TTS] Speaker ${speakerId} doesn't match language ${language}, using language-mapped voice`);
    } else if (speakerId && speakerId.includes('-') && !speakerId.includes('Neural')) {
      // Partial voice ID with dashes but not a Neural voice — use directly
      console.log(`🎤 [TTS] Using speaker ID directly: ${speakerId}`);
      return speakerId;
    }

    // OpenAI voice equivalents — same mapping as openai-edge-tts reference
    const openaiVoiceMapping: { [key: string]: string } = {
      'alloy':   'en-US-JennyNeural',    // Female, young professional
      'ash':     'en-US-AndrewNeural',   // Male, young professional
      'ballad':  'en-GB-ThomasNeural',   // British male, classic
      'coral':   'en-AU-NatashaNeural',  // Australian female, warm
      'echo':    'en-US-GuyNeural',      // Male, conversational
      'fable':   'en-GB-SoniaNeural',    // British female, storyteller
      'nova':    'en-US-AriaNeural',     // Female, confident
      'onyx':    'en-US-EricNeural',     // Male, professional
      'sage':    'en-US-JennyNeural',    // Female, wise
      'shimmer': 'en-US-EmmaNeural',     // Female, bright & energetic
      'verse':   'en-US-BrianNeural',    // Male, deep & warm
    };

    // Speaker profile mapping to premium voices
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

    // Language-specific voice mapping for Indian languages + English
    const languageVoiceMap: { [key: string]: string } = {
      'en': 'en-IN-NeerjaNeural',   // English (Indian)
      'hi': 'hi-IN-MadhurNeural',   // Hindi
      'bn': 'bn-IN-BashkarNeural',  // Bengali
      'ta': 'ta-IN-ValluvarNeural', // Tamil
      'te': 'te-IN-MohanNeural',    // Telugu
      'mr': 'mr-IN-ManoharNeural',  // Marathi
      'gu': 'gu-IN-DhwaniNeural',   // Gujarati
      'kn': 'kn-IN-GaganNeural',    // Kannada
      'ml': 'ml-IN-MidhunNeural',   // Malayalam
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
  }
};
