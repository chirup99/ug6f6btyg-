import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import axios from 'axios';

// MyMemory free translation API — no API key required
// Supports 500 words/day free, sufficient for post-length texts
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const supportedLangs = ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml'];
  if (!supportedLangs.includes(targetLanguage)) return text;

  try {
    console.log(`🌐 [TTS] Translating to ${targetLanguage} via MyMemory...`);
    const encoded = encodeURIComponent(text.substring(0, 500)); // MyMemory limit
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${targetLanguage}`;
    const response = await axios.get(url, { timeout: 8000 });
    const translated = response.data?.responseData?.translatedText;
    if (translated && translated !== text) {
      console.log(`✅ [TTS] Translated to ${targetLanguage}: "${translated.substring(0, 60)}..."`);
      return translated;
    }
    console.warn(`⚠️ [TTS] Translation returned same text, using original`);
    return text;
  } catch (err: any) {
    console.error('[TTS] MyMemory translation error:', err?.message || err);
    return text;
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

        await new Promise<void>((resolve, reject) => {
          audioStream.on('data', (chunk: Buffer | Uint8Array) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          audioStream.on('end', resolve);
          audioStream.on('error', reject);
          audioStream.on('close', resolve);
        });

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
    // If speakerId is already a full voice ID (contains "-Neural" or language code), use it directly
    if (speakerId && (speakerId.includes('-') || speakerId.includes('Neural'))) {
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
