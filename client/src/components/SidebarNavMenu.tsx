import React from "react";
import {
  User,
  X,
  ChevronDown,
  CheckCircle,
  Pencil,
  Mic,
  Check,
  BarChart3,
  Bug,
  MessageCircle,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cognitoSignOut } from "@/cognito";

interface AuthorizedUser {
  email: string;
  role: string;
}

interface SidebarNavMenuProps {
  isEditingUsername: boolean;
  setIsEditingUsername: (v: boolean) => void;
  isEditingDisplayName: boolean;
  setIsEditingDisplayName: (v: boolean) => void;
  isEditingDob: boolean;
  setIsEditingDob: (v: boolean) => void;
  isEditingLocation: boolean;
  setIsEditingLocation: (v: boolean) => void;
  isProfileActive: boolean;
  setIsProfileActive: (v: boolean) => void;
  newUsername: string;
  setNewUsername: (v: string) => void;
  checkUsernameAvailability: (v: string) => void;
  isCheckingUsername: boolean;
  isUsernameAvailable: boolean | null;
  setIsUsernameAvailable: (v: boolean | null) => void;
  handleUpdateProfile: (data: any) => Promise<void>;
  currentUser: any;
  newDisplayName: string;
  setNewDisplayName: (v: string) => void;
  newDob: string;
  setNewDob: (v: string) => void;
  newLocation: string;
  setNewLocation: (v: string) => void;
  isVoiceActive: boolean;
  setIsVoiceActive: (v: boolean) => void;
  voiceLanguage: string;
  setVoiceLanguage: (v: string) => void;
  activeVoiceProfileId: string;
  setActiveVoiceProfileId: (v: string) => void;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  voiceAudioCacheRef: React.MutableRefObject<{ [key: string]: string }>;
  voiceRate: number;
  setVoiceRate: (v: number) => void;
  voicePitch: number;
  setVoicePitch: (v: number) => void;
  prefetchVoiceAudio: (lang: string) => void;
  voiceLangLoading: boolean;
  voiceLangProgress: number;
  isVoiceSettingsOpen: boolean;
  setIsVoiceSettingsOpen: (v: boolean) => void;
  voiceBreakTime: number;
  setVoiceBreakTime: (v: number) => void;
  voicePitchVariation: number;
  setVoicePitchVariation: (v: number) => void;
  voiceTemperature: number;
  setVoiceTemperature: (v: number) => void;
  voiceNoiseScale: number;
  setVoiceNoiseScale: (v: number) => void;
  voiceCommaPause: number;
  setVoiceCommaPause: (v: number) => void;
  voicePeriodPause: number;
  setVoicePeriodPause: (v: number) => void;
  voiceEnergyDynamic: number;
  setVoiceEnergyDynamic: (v: number) => void;
  voiceNounDuration: number;
  setVoiceNounDuration: (v: number) => void;
  voiceFunctionDuration: number;
  setVoiceFunctionDuration: (v: number) => void;
  voiceMicroJitter: number;
  setVoiceMicroJitter: (v: number) => void;
  voiceEmphasis: string;
  setVoiceEmphasis: (v: string) => void;
  authorizedUsers: AuthorizedUser[];
  setTabWithAuthCheck: (tab: string) => void;
  setIsNavOpen: (v: boolean) => void;
  setShowReportBugDialog: (v: boolean) => void;
  setShowAdminDashboardDialog: (v: boolean) => void;
  setIsFeedbackDialogOpen: (v: boolean) => void;
  toggleTheme: () => void;
  theme: string;
  setLocation: (path: string) => void;
}

export function SidebarNavMenu({
  isEditingUsername,
  setIsEditingUsername,
  isEditingDisplayName,
  setIsEditingDisplayName,
  isEditingDob,
  setIsEditingDob,
  isEditingLocation,
  setIsEditingLocation,
  isProfileActive,
  setIsProfileActive,
  newUsername,
  setNewUsername,
  checkUsernameAvailability,
  isCheckingUsername,
  isUsernameAvailable,
  setIsUsernameAvailable,
  handleUpdateProfile,
  currentUser,
  newDisplayName,
  setNewDisplayName,
  newDob,
  setNewDob,
  newLocation,
  setNewLocation,
  isVoiceActive,
  setIsVoiceActive,
  voiceLanguage,
  setVoiceLanguage,
  activeVoiceProfileId,
  setActiveVoiceProfileId,
  currentAudioRef,
  voiceAudioCacheRef,
  voiceRate,
  setVoiceRate,
  voicePitch,
  setVoicePitch,
  prefetchVoiceAudio,
  voiceLangLoading,
  voiceLangProgress,
  isVoiceSettingsOpen,
  setIsVoiceSettingsOpen,
  voiceBreakTime,
  setVoiceBreakTime,
  voicePitchVariation,
  setVoicePitchVariation,
  voiceTemperature,
  setVoiceTemperature,
  voiceNoiseScale,
  setVoiceNoiseScale,
  voiceCommaPause,
  setVoiceCommaPause,
  voicePeriodPause,
  setVoicePeriodPause,
  voiceEnergyDynamic,
  setVoiceEnergyDynamic,
  voiceNounDuration,
  setVoiceNounDuration,
  voiceFunctionDuration,
  setVoiceFunctionDuration,
  voiceMicroJitter,
  setVoiceMicroJitter,
  voiceEmphasis,
  setVoiceEmphasis,
  authorizedUsers,
  setTabWithAuthCheck,
  setIsNavOpen,
  setShowReportBugDialog,
  setShowAdminDashboardDialog,
  setIsFeedbackDialogOpen,
  toggleTheme,
  theme,
  setLocation,
}: SidebarNavMenuProps) {
  return (
    <div className="space-y-3 flex flex-col">
      <button
        onClick={() => { if (isEditingUsername || isEditingDisplayName || isEditingDob || isEditingLocation) { setIsEditingUsername(false); setIsEditingDisplayName(false); setIsEditingDob(false); setIsEditingLocation(false); } else { setIsProfileActive(!isProfileActive); } }}
        className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center justify-start"
        data-testid="nav-profile"
      >
        <User className="h-4 w-4 mr-2" />
            <span>profile</span>
        {isEditingUsername || isEditingDisplayName || isEditingDob || isEditingLocation ? ( <X className="h-4 w-4" /> ) : ( <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileActive ? "rotate-180" : ""}`} /> )}
      </button>
      
      {isProfileActive && (
        <div className="px-4 py-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col group relative">
            <span className="text-xs text-gray-400 uppercase tracking-wider">username</span>
            {isEditingUsername ? (
              <div className="relative flex flex-col gap-2 w-full">
                <div className="relative w-full">
                  <Input 
                    value={newUsername} 
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      checkUsernameAvailability(e.target.value);
                    }} 
                    className="h-8 bg-gray-800 border-gray-700 text-white pr-10 w-full" 
                    autoFocus
                    data-testid="input-username-edit"
                  />
                  {isCheckingUsername ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                      <div className="h-4 w-4 border-2 border-gray-500 border-t-blue-400 rounded-full animate-spin" />
                    </div>
                  ) : isUsernameAvailable === true ? (
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        await handleUpdateProfile({ username: newUsername }); 
                        setIsEditingUsername(false);
                        setIsUsernameAvailable(null);
                      }} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-all z-10"
                      data-testid="button-save-username"
                    >
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </button>
                  ) : isUsernameAvailable === false ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-not-allowed">
                      <X className="h-4 w-4 text-red-400" />
                    </div>
                  ) : null}
                </div>
                {isUsernameAvailable === false && (
                  <span className="text-xs text-red-400">Username taken</span>
                )}
                {isUsernameAvailable === true && newUsername.length >= 3 && (
                  <span className="text-xs text-green-400">Available now</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="text-white font-medium">{currentUser?.username || "Not available"}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewUsername(currentUser?.username || "");
                    setIsUsernameAvailable(null);
                    setIsEditingUsername(true);
                  }}
                  className="p-1 hover:bg-white/10 rounded-md transition-all"
                  data-testid="button-edit-username"
                >
                  <Pencil className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100" />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col group relative">
            <span className="text-xs text-gray-400 uppercase tracking-wider">display name</span>
            {isEditingDisplayName ? (
              <div className="relative flex items-center gap-2">
                <div className="relative w-full">
                  <Input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} className="h-8 bg-gray-800 border-gray-700 text-white pr-10 w-full" autoFocus />
                  <button onClick={async (e) => { e.stopPropagation(); await handleUpdateProfile({ displayName: newDisplayName }); setIsEditingDisplayName(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-all z-10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="text-white font-medium">{currentUser?.displayName && currentUser.displayName !== "Not available" ? currentUser.displayName : ""}</span>
                <button onClick={(e) => { e.stopPropagation(); setNewDisplayName(currentUser?.displayName || ""); setIsEditingDisplayName(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wider">email id</span>
            <span className="text-white font-medium">{currentUser?.email && currentUser.email !== "empty" ? currentUser.email : ""}</span>
          </div>
          <div className="flex flex-col group relative">
            <span className="text-xs text-gray-400 uppercase tracking-wider">dob</span>
            {isEditingDob ? (
              <div className="relative flex items-center group">
                <Input
                  type="date"
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                  className="h-9 bg-gray-800 border-gray-700 text-white pr-10 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      await handleUpdateProfile({ dob: newDob });
                      setIsEditingDob(false);
                    } else if (e.key === "Escape") {
                      setIsEditingDob(false);
                    }
                  }}
                />
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleUpdateProfile({ dob: newDob });
                    setIsEditingDob(false);
                  }}
                  className="absolute right-2 p-1 hover:bg-white/10 rounded-md transition-all"
                  data-testid="button-save-dob"
                >
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="text-white font-medium">{currentUser?.dob ? currentUser.dob.split("-").reverse().join("-") : "empty"}</span>
                <button onClick={(e) => { e.stopPropagation(); setNewDob(currentUser?.dob || ""); setIsEditingDob(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
              </div>
            )}
          </div>
          <div className="flex flex-col group relative">
            <span className="text-xs text-gray-400 uppercase tracking-wider">location</span>
            {isEditingLocation ? (
              <div className="relative flex items-center group">
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="h-9 bg-gray-800 border-gray-700 text-white pr-10 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      await handleUpdateProfile({ location: newLocation });
                      setIsEditingLocation(false);
                    } else if (e.key === "Escape") {
                      setIsEditingLocation(false);
                    }
                  }}
                />
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleUpdateProfile({ location: newLocation });
                    setIsEditingLocation(false);
                  }}
                  className="absolute right-2 p-1 hover:bg-white/10 rounded-md transition-all"
                  data-testid="button-save-location"
                >
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="text-white font-medium">{currentUser?.location && currentUser.location !== "empty" ? currentUser.location : ""}</span>
                <button onClick={(e) => { e.stopPropagation(); setNewLocation(currentUser?.location || ""); setIsEditingLocation(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!isProfileActive && (
        <>
          <button
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center justify-start"
            data-testid="nav-voice"
          >
            <Mic className="h-4 w-4 mr-2" />
            <span>Voice</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isVoiceActive ? "rotate-180" : ""}`} />
          </button>


          {isVoiceActive && (
            <div className="px-4 py-6 bg-gray-800/50 border border-gray-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200 no-scrollbar max-h-[400px] overflow-y-auto pl-[0px] pr-[0px] pt-[10px] pb-[10px] mt-[2px] mb-[2px]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex flex-col items-center gap-4">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">voice profiles</span>
                <div className="flex items-center justify-start gap-4 py-2 overflow-x-auto no-scrollbar scroll-smooth pl-[10px] pr-[10px]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {(() => {
                    const voicesByLanguage: { [key: string]: any[] } = {
                      'en': [
                        { id: 'en-IN-PrabhatNeural', name: 'Prabhat', description: 'Indian English', gender: 'Male' },
                        { id: 'en-IN-NeerjaNeural', name: 'Neerja', description: 'Indian English', gender: 'Female' }
                      ],
                      'hi': [
                        { id: 'hi-IN-MadhurNeural', name: 'Madhur', description: 'Natural Hindi', gender: 'Male' },
                        { id: 'hi-IN-SwaraNeural', name: 'Swara', description: 'Natural Hindi', gender: 'Female' }
                      ],
                      'bn': [
                        { id: 'bn-IN-BashkarNeural', name: 'Bashkar', description: 'Natural Bengali', gender: 'Male' },
                        { id: 'bn-IN-TanishaaNeural', name: 'Tanishaa', description: 'Natural Bengali', gender: 'Female' }
                      ],
                      'ta': [
                        { id: 'ta-IN-ValluvarNeural', name: 'Valluvar', description: 'Natural Tamil', gender: 'Male' },
                        { id: 'ta-IN-PallaviNeural', name: 'Pallavi', description: 'Natural Tamil', gender: 'Female' }
                      ],
                      'te': [
                        { id: 'te-IN-MohanNeural', name: 'Mohan', description: 'Natural Telugu', gender: 'Male' },
                        { id: 'te-IN-ShrutiNeural', name: 'Shruti', description: 'Natural Telugu', gender: 'Female' }
                      ],
                      'mr': [
                        { id: 'mr-IN-ManoharNeural', name: 'Manohar', description: 'Natural Marathi', gender: 'Male' },
                        { id: 'mr-IN-AarohiNeural', name: 'Aarohi', description: 'Natural Marathi', gender: 'Female' }
                      ],
                      'gu': [
                        { id: 'gu-IN-NiranjanNeural', name: 'Niranjan', description: 'Natural Gujarati', gender: 'Male' },
                        { id: 'gu-IN-DhwaniNeural', name: 'Dhwani', description: 'Natural Gujarati', gender: 'Female' }
                      ],
                      'kn': [
                        { id: 'kn-IN-GaganNeural', name: 'Gagan', description: 'Natural Kannada', gender: 'Male' },
                        { id: 'kn-IN-SapnaNeural', name: 'Sapna', description: 'Natural Kannada', gender: 'Female' }
                      ],
                      'ml': [
                        { id: 'ml-IN-MidhunNeural', name: 'Midhun', description: 'Natural Malayalam', gender: 'Male' },
                        { id: 'ml-IN-SobhanaNeural', name: 'Sobhana', description: 'Natural Malayalam', gender: 'Female' }
                      ]
                    };
                    const languageScripts: { [key: string]: string } = {
                      'en': 'A',
                      'hi': 'हि',
                      'bn': 'বা',
                      'ta': 'த',
                      'te': 'తె',
                      'mr': 'मर',
                      'gu': 'ગુ',
                      'kn': 'ಕ',
                      'ml': 'മ'
                    };
                    
                    const currentLanguageVoices = voicesByLanguage[voiceLanguage] || voicesByLanguage['en'];
                    return currentLanguageVoices.map((profile) => {
                      const isSelected = activeVoiceProfileId === profile.id;
                      const isMale = profile.gender === 'Male';
                      const languageText = languageScripts[voiceLanguage] || 'A';
                    return (
                      <div 
                        key={profile.id} 
                        className="flex flex-col items-center gap-1.5 group cursor-pointer" 
                        onClick={async () => {
                          setActiveVoiceProfileId(profile.id);
                          if (currentAudioRef.current) {
                            currentAudioRef.current.pause();
                            currentAudioRef.current = null;
                          }
                          // Use cached audio for instant playback
                          const cacheKey = `${profile.id}_${voiceLanguage}`;
                          if (voiceAudioCacheRef.current[cacheKey]) {
                            const audio = new Audio(voiceAudioCacheRef.current[cacheKey]);
                            currentAudioRef.current = audio;
                            audio.play().catch(err => console.error('🎤 [TTS] Cache play error:', err));
                            return;
                          }
                          // Greetings match prefetch format exactly so server cache is warm on first click
                          const voiceGreetings: { [key: string]: (p: string) => string } = {
                                en: (p) => `Hello! I am ${p}. Welcome to Perala!`,
                                hi: (p) => `नमस्ते! मैं ${p} हूँ। पेरला में आपका स्वागत है!`,
                                bn: (p) => `নমস্কার! আমি ${p}। পেরলায় আপনাকে স্বাগত!`,
                                ta: (p) => `வணக்கம்! நான் ${p}. பெரலாவில் உங்களை வரவேற்கிறோம்!`,
                                te: (p) => `నమస్కారం! నేను ${p}. పెరలాలో మీకు స్వాగతం!`,
                                mr: (p) => `नमस्कार! मी ${p} आहे. पेरलामध्ये तुमचे स्वागत आहे!`,
                                gu: (p) => `નમસ્તે! હું ${p} છું. પేरలామాం తమారూ స్వాగత ছে!`,
                                kn: (p) => `ನಮಸ್ಕಾರ! ನಾನು ${p}. ಪೆರಲಾದಲ್ಲಿ ನಿಮಗೆ ಸ್ವಾಗತ!`,
                                ml: (p) => `നമസ്കാരം! ഞാൻ ${p} ആണ്. പെരലയിലേക്ക് സ്വാഗതം!`,
                          };
                          const baseText = voiceGreetings[voiceLanguage] ? voiceGreetings[voiceLanguage](profile.name) : `Hello! I am ${profile.name}. Welcome to Perala!`;
                          
                          // Use Microsoft Edge TTS (backend only)
                          try {
                            const response = await fetch('/api/tts/generate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                text: baseText,
                                language: voiceLanguage || 'en',
                                speaker: profile.id,
                                speed: voiceRate || 1.0,
                                pitch: voicePitch || 1.0
                              })
                            });

                            if (response.ok) {
                              const data = await response.json();
                              if (data.audioBase64) {
                                // Convert base64 data URL to Blob for proper playback
                                const base64Data = data.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
                                const binaryString = atob(base64Data);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let i = 0; i < binaryString.length; i++) {
                                  bytes[i] = binaryString.charCodeAt(i);
                                }
                                const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                                const audioUrl = URL.createObjectURL(audioBlob);
                                // Cache for instant playback on repeat taps
                                voiceAudioCacheRef.current[cacheKey] = audioUrl;
                                const audio = new Audio(audioUrl);
                                currentAudioRef.current = audio;
                                audio.play().catch(err => console.error('🎤 [TTS] Audio play error:', err));
                                console.log('🎤 [TTS] Playing voice using Microsoft Edge TTS');
                              }
                            } else {
                              const errorData = await response.json();
                              console.error('🎤 [TTS] Backend error:', errorData.error);
                            }
                          } catch (error) {
                            console.error('🎤 [TTS] Error calling Microsoft Edge TTS:', error);
                          }
                        }}
                      >
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-105 ${isSelected ? (isMale ? "border-blue-500 ring-2 ring-blue-500/50" : "border-pink-500 ring-2 ring-pink-500/50") : "border-transparent"} active:scale-95 overflow-hidden ${isMale ? 'bg-gradient-to-br from-blue-600 to-blue-400' : 'bg-gradient-to-br from-pink-600 to-pink-400'} shadow-lg`}>
                          <span className="text-xs font-bold text-white">{languageText}</span>
                        </div>
                        <span className={`text-[10px] font-medium transition-colors flex items-center gap-1 ${isSelected ? (isMale ? "text-blue-400" : "text-pink-400") + " font-bold" : "text-gray-300 group-hover:" + (isMale ? "text-blue-400" : "text-pink-400")}`}>
                          {profile.name} {isSelected && <Check className="h-2.5 w-2.5" />}
                        </span>
                      </div>
                    );
                    });
                  })()}
                </div>
                {voiceLangLoading && (
                  <div className="w-full px-1 animate-in fade-in duration-200">
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-100" style={{ width: `${voiceLangProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-blue-400 text-center mt-1 animate-pulse">Setting up {voiceLanguage !== 'en' ? 'new language' : 'English'} voices…</p>
                  </div>
                )}
                <div className="w-full h-px bg-gray-700/50 my-1" />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-500 italic mb-2">Language & Voice</p>
                    <select 
                      value={voiceLanguage}
                      onChange={(e) => { const l = e.target.value; setVoiceLanguage(l); prefetchVoiceAudio(l); }}
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="en">English (Indian)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="mr">मराठी (Marathi)</option>
                      <option value="gu">ગુજરાતી (Gujarati)</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      <option value="ml">മലയാളം (Malayalam)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[11px] text-gray-500 italic">Select a voice for your audio post</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVoiceSettingsOpen(!isVoiceSettingsOpen);
                    }}
                    className={`p-1 rounded-full hover:bg-white/10 transition-transform ${isVoiceSettingsOpen ? 'rotate-180 text-blue-400' : 'text-gray-500'}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {isVoiceSettingsOpen && (
                    <div className="px-6 py-6 bg-gray-800/80 border border-gray-700/50 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-md">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                          {/* Pitch Slider */}
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-bold">Pitch</span>
                              <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full">{(voicePitch || 1.0).toFixed(1)}</span>
                            </div>
                            <div className="relative w-full h-6 flex items-center group">
                              <div className="absolute h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 transition-all duration-300" 
                                  style={{ width: `${((voicePitch - 0.5) / 1.5) * 100}%` }}
                                />
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={voicePitch || 1.0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setVoicePitch(val);
                                }}
                                className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                              />
                            </div>
                          </div>

                          {/* Speed Rate Slider */}
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-bold">Speed</span>
                              <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full">{(voiceRate || 1.0).toFixed(1)}x</span>
                            </div>
                            <div className="relative w-full h-6 flex items-center group">
                              <div className="absolute h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 transition-all duration-300" 
                                  style={{ width: `${((voiceRate - 0.5) / 1.5) * 100}%` }}
                                />
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={voiceRate || 1.0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setVoiceRate(val);
                                }}
                                className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                              />
                            </div>
                          </div>

                          {/* Break Time Slider */}
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-bold">Break</span>
                              <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full">{voiceBreakTime}ms</span>
                            </div>
                            <div className="relative w-full h-6 flex items-center group">
                              <div className="absolute h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 transition-all duration-300" 
                                  style={{ width: `${((voiceBreakTime - 0) / 1000) * 100}%` }}
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1000"
                                step="50"
                                value={voiceBreakTime}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setVoiceBreakTime(val);
                                }}
                                className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                              />
                            </div>
                          </div>

                          {/* Noise Scale Slider */}
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-bold">Noise Scale</span>
                              <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full">{voiceNoiseScale}</span>
                            </div>
                            <div className="relative w-full h-6 flex items-center group">
                              <div className="absolute h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 transition-all duration-300" 
                                  style={{ width: `${((voiceNoiseScale - 0.5) / 0.3) * 100}%` }}
                                />
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="0.8"
                                step="0.01"
                                value={voiceNoiseScale}
                                onChange={(e) => setVoiceNoiseScale(parseFloat(e.target.value))}
                                className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                              />
                            </div>
                          </div>

                        </div>

                        <div className="space-y-3 mt-2">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-blue-400/80 font-bold">Emphasis</span>
                            <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full capitalize">{voiceEmphasis}</span>
                          </div>
                          <div className="flex p-1 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                            {['none', 'moderate', 'strong'].map((level) => (
                              <button
                                key={level}
                                onClick={() => setVoiceEmphasis(level)}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                  voiceEmphasis === level 
                                    ? 'bg-white text-blue-600 shadow-md scale-[1.02]' 
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </div>
              {/* Login button - shown below voice profiles for guests */}
              {!localStorage.getItem('currentUserId') || localStorage.getItem('currentUserId') === 'null' ? (
                <div className="pt-2 pb-1">
                  <button
                    onClick={() => { setLocation('/landing'); setIsNavOpen(false); }}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                    data-testid="button-sidebar-login"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                    Login
                  </button>
                </div>
              ) : null}
            </div>
          )}
          {!isVoiceActive && (
            <>
              {localStorage.getItem('currentUserEmail') === 'chiranjeevi.perala99@gmail.com' && (
                <button
                  onClick={() => {
                    setTabWithAuthCheck("dashboard");
                    setIsNavOpen(false);
                  }}
                  className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                  data-testid="nav-dashboard"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>dashboard</span>
                </button>
              )}
              <button
                onClick={() => setShowReportBugDialog(true)}
                className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-2"
                data-testid="nav-report-bug"
              >
                <Bug className="h-4 w-4" />
                <span>report bug</span>
              </button>
              {(() => {
                const userEmail = currentUser?.email?.toLowerCase();
                const isAuthorizedAdmin = authorizedUsers.some(u => u.email.toLowerCase() === userEmail);
                if (isAuthorizedAdmin) {
                  return (
                    <button onClick={() => setShowAdminDashboardDialog(true)}
                      className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-2"
                      data-testid="nav-admin-dashboard"
                    >
                      <Bug className="h-4 w-4" />
                      <span>Admin -dashboard</span>
                    </button>
                  );
                }
                return null;
              })()}
              <button
                onClick={() => setIsFeedbackDialogOpen(true)}
                className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-2"
                data-testid="nav-feedback"
              >
                <MessageCircle className="h-4 w-4" />
                <span>feedback or request feature</span>
              </button>
              <button
                onClick={toggleTheme}
                className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                data-testid="nav-dark-theme"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-4 w-4" />
                    <span>light mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    <span>dark mode</span>
                  </>
                )}
              </button>
              <button
                onClick={async () => {
                  try {
                    await cognitoSignOut();
                    localStorage.clear();
                    window.location.href = "/login";
                  } catch (error) {
                    console.error("Logout error:", error);
                  }
                }}
                className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                data-testid="nav-logout"
              >
                <LogOut className="h-4 w-4" />
                <span>logout</span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
