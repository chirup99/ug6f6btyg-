// TTS Utility for calling Microsoft Edge TTS backend service

export interface TTSRequest {
  text: string;
  language: string;
  speaker?: string;
  speed?: number;
}

export const ttsUtils = {
  async generateAndPlaySpeech(request: TTSRequest): Promise<void> {
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('❌ TTS Error:', data.error);
        throw new Error(data.error);
      }

      if (data.audioBase64) {
        const audio = new Audio(data.audioBase64);
        audio.play();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('🎤 [Frontend] TTS Generation Failed:', errorMsg);
      throw error;
    }
  },

  // Voice profiles using real Microsoft Edge TTS voices
  voiceProfiles: {
    samantha: {
      name: 'Samantha',
      speaker: 'samantha',
      voiceId: 'en-US-EmmaNeural',
      description: 'Bright & energetic',
      color: 'from-pink-500 to-rose-500'
    },
    liam: {
      name: 'Liam',
      speaker: 'liam',
      voiceId: 'en-US-EricNeural',
      description: 'Professional & warm',
      color: 'from-blue-500 to-cyan-500'
    },
    sophia: {
      name: 'Sophia',
      speaker: 'sophia',
      voiceId: 'en-US-AriaNeural',
      description: 'Confident & clear',
      color: 'from-purple-500 to-pink-500'
    },
  },

  // Get voice profile by ID
  getVoiceProfile(profileId: string) {
    return this.voiceProfiles[profileId as keyof typeof this.voiceProfiles] || this.voiceProfiles.samantha;
  },

  // Supported languages for TTS
  languages: {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    bn: 'বাংলা (Bengali)',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)',
    mr: 'मराठी (Marathi)',
    gu: 'ગુજરાતી (Gujarati)',
    kn: 'ಕನ್ನಡ (Kannada)',
  },
};
