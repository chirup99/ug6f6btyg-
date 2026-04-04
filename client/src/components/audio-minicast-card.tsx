import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Radio, Play, Pause, Heart, MessageCircle, Share, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getCognitoToken } from '@/cognito';
import { ttsUtils } from '@/lib/tts-utils';

interface SelectedPost {
  id: string | number;
  content: string;
}

interface AudioMinicastCardProps {
  content: string;
  author: {
    displayName: string;
    username: string;
    avatar?: string;
  };
  selectedPostIds?: (string | number)[];
  selectedPosts?: SelectedPost[];
  timestamp: Date;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  postId?: string;
  isOwner?: boolean;
}

interface AudioCard {
  id: string;
  type: 'main' | 'post';
  content: string;
  postId?: string | number;
  colorIndex: number;
}

export const AudioMinicastCard = memo(function AudioMinicastCard({
  content,
  author,
  selectedPostIds = [],
  selectedPosts = [],
  timestamp,
  likes = 0,
  comments = 0,
  isLiked = false,
  postId,
  isOwner = false
}: AudioMinicastCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLikeCount(likes);
  }, [likes]);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  // Holds the card that should auto-play after the next cards state update
  const pendingAutoPlayRef = useRef<AudioCard | null>(null);
  // Cache of pre-generated audio URLs keyed by card id
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  // In-flight promise map — prevents duplicate TTS fetches for the same card/voice/lang combination
  const audioInflightRef = useRef<Map<string, Promise<string | null>>>(new Map());
  // Root element ref — used by IntersectionObserver to pause when scrolled away
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cards, setCards] = useState<AudioCard[]>(() => {
    const allCards: AudioCard[] = [];
    if (selectedPosts.length > 0) {
      selectedPosts.forEach((post, idx) => {
        const hasRealContent = post.content && 
                               post.content.trim().length > 0 && 
                               !post.content.startsWith('Selected Post');
        if (hasRealContent) {
          allCards.push({
            id: `post-${post.id}`,
            type: 'post',
            content: post.content,
            postId: post.id,
            colorIndex: idx % 5
          });
        }
      });
    }
    return allCards;
  });

  // Clean text for speech: remove emojis, links, and control chars
  // IMPORTANT: preserve all Unicode language scripts (Hindi, Tamil, Telugu, etc.)
  // We only strip emoji/pictographic symbols — NOT the entire non-ASCII range
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/www\.[^\s]+/gi, '')
      // Use Unicode property escapes to remove only emoji/pictographic symbols
      // This preserves Devanagari, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam etc.
      .replace(/\p{Extended_Pictographic}/gu, '')
      // Remove ASCII control characters only
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper: fetch TTS and return an object URL (or null on failure)
  const fetchAndCacheTTS = async (card: AudioCard, cancelled: { value: boolean }): Promise<string | null> => {
    const savedVoiceProfileId = localStorage.getItem('activeVoiceProfileId') || 'en-IN-NeerjaNeural';
    const voiceLanguage = localStorage.getItem('voiceLanguage') || 'en';

    // Cache key includes voice + language so switching voice/language automatically gets new audio
    const cacheKey = `${card.id}::${voiceLanguage}::${savedVoiceProfileId}`;

    // 1. Already cached → instant return
    const cached = audioCacheRef.current.get(cacheKey);
    if (cached) return cached;

    // 2. Already in-flight → join the existing promise instead of firing a duplicate
    const inflight = audioInflightRef.current.get(cacheKey);
    if (inflight) return inflight;

    const textToSpeak = cleanTextForSpeech(card.content);
    if (!textToSpeak) return null;

    const fetchPromise = (async (): Promise<string | null> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSpeak, language: voiceLanguage, speaker: savedVoiceProfileId }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok || cancelled.value) return null;
        const data = await response.json();
        if (cancelled.value || !data.audioBase64) return null;

        const base64String = data.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        const binary = atob(base64String);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        audioCacheRef.current.set(cacheKey, url);
        return url;
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error('[AudioMinicast] TTS fetch error:', err?.message);
        return null;
      } finally {
        audioInflightRef.current.delete(cacheKey);
      }
    })();

    audioInflightRef.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  };

  // Track the last known voiceLanguage so we can detect changes
  const lastVoiceLanguageRef = useRef(localStorage.getItem('voiceLanguage') || 'en');

  // Unified effect: preload top card audio, show "Preparing..." while fetching,
  // and auto-play the new top card after a swipe (pendingAutoPlayRef is set in swipeCard).
  // Remaining cards are staggered so the server is not overloaded.
  // Single [cards] effect avoids duplicate TTS fetches that raced each other.
  useEffect(() => {
    if (cards.length === 0) return;
    const cancelled = { value: false };
    const postCards = cards.filter(c => c.type === 'post');
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (postCards.length > 0) {
      const topCard = postCards[0];
      const pendingCard = pendingAutoPlayRef.current;
      const shouldAutoPlay = pendingCard !== null && pendingCard.id === topCard.id;
      if (shouldAutoPlay) pendingAutoPlayRef.current = null;

      const cacheKey = `${topCard.id}::${localStorage.getItem('voiceLanguage') || 'en'}::${localStorage.getItem('activeVoiceProfileId') || 'en-IN-NeerjaNeural'}`;
      const alreadyCached = audioCacheRef.current.has(cacheKey);
      if (!alreadyCached) setIsPreloading(true);

      (async () => {
        const audioUrl = await fetchAndCacheTTS(topCard, cancelled);
        if (cancelled.value) return;
        setIsPreloading(false);

        if (shouldAutoPlay && audioUrl) {
          if (currentAudioRef.current) currentAudioRef.current.pause();
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          audio.onended = () => setIsPlaying(false);
          audio.onerror = () => setIsPlaying(false);
          try { await audio.play(); setIsPlaying(true); } catch { setIsPlaying(false); }
        }
      })();
    }

    // Remaining cards: stagger by 1.5s each to avoid server overload
    postCards.slice(1).forEach((card, i) => {
      timers.push(setTimeout(() => {
        if (!cancelled.value) fetchAndCacheTTS(card, cancelled);
      }, (i + 1) * 1500));
    });
    return () => { cancelled.value = true; timers.forEach(clearTimeout); setIsPreloading(false); };
  }, [cards]);

  // When the user changes voice language, revoke stale blob URLs and re-preload.
  // Uses 'perala-voice-lang-change' custom event dispatched by home.tsx on language change.
  useEffect(() => {
    const handleLangChange = () => {
      const newLang = localStorage.getItem('voiceLanguage') || 'en';
      if (newLang === lastVoiceLanguageRef.current) return;
      lastVoiceLanguageRef.current = newLang;

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setIsPlaying(false);

      audioCacheRef.current.forEach(url => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
      audioInflightRef.current.clear();

      const cancelled = { value: false };
      const postCards = cards.filter(c => c.type === 'post');
      if (postCards.length > 0) {
        setIsPreloading(true);
        fetchAndCacheTTS(postCards[0], cancelled).then(() => {
          if (!cancelled.value) setIsPreloading(false);
        });
        postCards.slice(1).forEach(card => fetchAndCacheTTS(card, cancelled));
      }
    };

    window.addEventListener('perala-voice-lang-change', handleLangChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'voiceLanguage') handleLangChange();
    });
    return () => {
      window.removeEventListener('perala-voice-lang-change', handleLangChange);
    };
  }, [cards]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  // Unified stop: halts both TTS API audio element and browser speechSynthesis
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsLoadingAudio(false);
  }, []);

  // Stop audio when the browser tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAudio();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stopAudio]);

  // Pause audio when the card scrolls out of view (user swipes past it in the feed).
  // Fires as soon as less than 30% of the card is visible — same pattern used for
  // video auto-pause in Twitter/Instagram-style feeds.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.3) {
          stopAudio();
        }
      },
      { threshold: [0, 0.3] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stopAudio]);

  // Stop audio and revoke all cached URLs when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      window.speechSynthesis.cancel();
      audioCacheRef.current.forEach(url => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
      audioInflightRef.current.clear();
    };
  }, []);

  const swipeCard = (direction: 'left' | 'right') => {
    // Stop any currently playing audio (TTS API + speechSynthesis) when swiping
    stopAudio();

    setCards((prevCards) => {
      const newCards = [...prevCards];
      if (direction === 'right') {
        const firstCard = newCards.shift();
        if (firstCard) newCards.push(firstCard);
      } else {
        const lastCard = newCards.pop();
        if (lastCard) newCards.unshift(lastCard);
      }
      // Queue the new top card for auto-play once state updates
      pendingAutoPlayRef.current = newCards[0] || null;
      return newCards;
    });
  };

  const [swipeOffset, setSwipeOffset] = useState(0);

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600', label: 'AUDIO MINICAST', icon: '🎙️' },
      { from: 'from-purple-500', to: 'to-purple-600', label: 'MINICAST 1', icon: '📊' },
      { from: 'from-pink-500', to: 'to-pink-600', label: 'MINICAST 2', icon: '📈' },
      { from: 'from-indigo-500', to: 'to-indigo-600', label: 'MINICAST 3', icon: '💡' },
      { from: 'from-cyan-500', to: 'to-cyan-600', label: 'MINICAST 4', icon: '🎯' },
    ];
    return gradients[idx % gradients.length];
  };

  // Helper: Map language + voice profile to proper language-specific voice
  const getLanguageAwareVoiceName = (voiceProfileId: string, language: string): string => {
    // Voice name to voice ID mappings by language
    const voicesByLanguage: { [lang: string]: { [voiceName: string]: string } } = {
      'en': {
        'prabhat': 'en-IN-PrabhatNeural',
        'neerja': 'en-IN-NeerjaNeural',
        'neerja-expressive': 'en-IN-NeerjaExpressiveNeural',
      },
      'hi': {
        'prabhat': 'hi-IN-GauravNeural', // Fallback to Gaurav for Hindi
        'neerja': 'hi-IN-MadhurNeural', // Fallback to Madhur for Hindi
        'madhur': 'hi-IN-MadhurNeural',
        'gaurav': 'hi-IN-GauravNeural',
      },
      'bn': {
        'prabhat': 'bn-IN-BashkarNeural',
        'neerja': 'bn-IN-BashkarNeural',
        'bashkar': 'bn-IN-BashkarNeural',
      },
      'ta': {
        'prabhat': 'ta-IN-ValluvarNeural',
        'neerja': 'ta-IN-ValluvarNeural',
        'valluvar': 'ta-IN-ValluvarNeural',
      },
      'te': {
        'prabhat': 'te-IN-MohanNeural',
        'neerja': 'te-IN-MohanNeural',
        'mohan': 'te-IN-MohanNeural',
      },
      'mr': {
        'prabhat': 'mr-IN-ManoharNeural',
        'neerja': 'mr-IN-ManoharNeural',
        'manohar': 'mr-IN-ManoharNeural',
      },
      'gu': {
        'prabhat': 'gu-IN-DhwaniNeural',
        'neerja': 'gu-IN-DhwaniNeural',
        'dhwani': 'gu-IN-DhwaniNeural',
      },
      'kn': {
        'prabhat': 'kn-IN-GaganNeural',
        'neerja': 'kn-IN-SapnaNeural',
        'gagan': 'kn-IN-GaganNeural',
        'sapna': 'kn-IN-SapnaNeural',
      },
      'ml': {
        'prabhat': 'ml-IN-MidhunNeural',
        'neerja': 'ml-IN-SobhanaNeural',
        'midhun': 'ml-IN-MidhunNeural',
        'sobhana': 'ml-IN-SobhanaNeural',
      },
    };

    // Extract voice name from full voice ID (e.g., "Prabhat" from "en-IN-PrabhatNeural")
    const voiceNameMatch = voiceProfileId.match(/([A-Za-z]+)Neural$/);
    const voiceName = voiceNameMatch ? voiceNameMatch[1].toLowerCase() : voiceProfileId.toLowerCase();

    // Get language-specific mapping
    const languageVoices = voicesByLanguage[language] || voicesByLanguage['en'];
    const mappedVoice = languageVoices[voiceName];

    console.log('🗣️ Voice Mapping:', {
      originalProfile: voiceProfileId,
      extractedName: voiceName,
      selectedLanguage: language,
      mappedVoice: mappedVoice || 'using language fallback'
    });

    return mappedVoice || voicesByLanguage[language]?.[Object.keys(languageVoices)[0]] || 'en-IN-PrabhatNeural';
  };

  const togglePlay = async () => {
    if (isPlaying) {
      stopAudio();
    } else {
      const currentCard = cards[0];
      if (currentCard && currentCard.type === 'post') {
        try {
          setIsLoadingAudio(true);
          const cancelled = { value: false };
          const audioUrl = await fetchAndCacheTTS(currentCard, cancelled);
          setIsLoadingAudio(false);
          if (!audioUrl) return;

          if (currentAudioRef.current) currentAudioRef.current.pause();
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          audio.onended = () => { setIsPlaying(false); };
          audio.onerror = () => { setIsPlaying(false); };
          audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('🎤 [AudioMinicast] TTS playback failed:', error);
          setIsPlaying(false);
          setIsLoadingAudio(false);
        }
      }
    }
  }

  const handleLike = async () => {
    if (!postId || isLiking) return;

    const wasLiked = localLiked;
    const previousCount = likeCount;

    setLocalLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    setIsLiking(true);

    try {
      const userId = localStorage.getItem('currentUsername') || 'anonymous';
      const method = wasLiked ? 'DELETE' : 'POST';
      const url = wasLiked
        ? `/api/social-posts/${postId}/like-v2?userId=${encodeURIComponent(userId)}`
        : `/api/social-posts/${postId}/like-v2`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ userId }) : undefined
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      setLikeCount(data.likes ?? (wasLiked ? previousCount - 1 : previousCount + 1));
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
    } catch (error) {
      setLocalLiked(wasLiked);
      setLikeCount(previousCount);
      toast({ description: 'Failed to update like', variant: 'destructive' });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) {
      toast({ description: 'Unable to delete post', variant: 'destructive' });
      return;
    }

    setIsDeleting(true);
    try {
      const idToken = await getCognitoToken();
      if (!idToken) throw new Error('Not authenticated');

      const response = await fetch(`/api/social-posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete post');

      toast({ description: 'Audio post deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('❌ Error deleting audio post:', error);
      toast({ 
        description: error.message || 'Failed to delete post', 
        variant: 'destructive' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card ref={cardRef} className="mb-4 border border-gray-100 dark:border-zinc-800/50 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
      <CardContent className="p-0">
        {/* Author Header */}
        <div className="p-4 flex items-center gap-3 bg-gray-50 dark:bg-zinc-900">
          {(() => {
            const avatarUrl = author.avatar;
            const isValidAvatar = avatarUrl &&
              (avatarUrl.startsWith('http') || avatarUrl.startsWith('/')) &&
              !avatarUrl.includes('ui-avatars.com');
            const initials = (author.displayName || author.username || '?').charAt(0).toUpperCase();
            return (
              <Avatar className="w-10 h-10 border border-border flex-shrink-0">
                {isValidAvatar && <AvatarImage src={avatarUrl} alt={author.displayName} className="object-cover" />}
                <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
            );
          })()}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">{author.displayName}</span>
              <Radio className="h-3 w-3 text-purple-500" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>@{author.username}</span>
              <span>·</span>
              <span>{formatTimeAgo(timestamp)}</span>
            </div>
          </div>
          
          {/* Delete Menu - Only show for owner */}
          {isOwner && postId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  data-testid="button-audio-post-menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 dark:text-red-400 cursor-pointer"
                  data-testid="menu-item-delete-audio"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Swipeable Cards Container */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 pb-6 flex items-center justify-center">
          <div className="relative w-28 h-40" style={{ perspective: '1000px' }}>
            {cards.slice(0, 5).map((card, index) => {
              const isTop = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isFourth = index === 3;
              const isFifth = index === 4;
              const gradient = getGradient(card.colorIndex);
              
              let stackTransform = '';
              let stackOpacity = 1;
              let stackZ = 40;
              
              if (!isTop) {
                const rotationDeg = index * 3;
                const yOffset = index * 8;
                const scale = 1 - (index * 0.03);
                const xOffset = index * -2;
                
                stackTransform = `translateY(${yOffset}px) translateX(${xOffset}px) rotate(${rotationDeg}deg) scale(${scale})`;
                stackOpacity = isSecond ? 0.95 : (isThird ? 0.85 : (isFourth ? 0.75 : (isFifth ? 0.65 : 0.5)));
                stackZ = isSecond ? 30 : (isThird ? 20 : (isFourth ? 15 : (isFifth ? 10 : 5)));
              }

              return (
                <div
                  key={card.id}
                  data-card-index={index}
                  style={{
                    transform: stackTransform,
                    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                    opacity: stackOpacity,
                    zIndex: stackZ,
                  }}
                  className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (!isTop) return;

                    const startX = e.clientX;
                    const startY = e.clientY;
                    const cardElement = e.currentTarget as HTMLElement;
                    let isDragging = false;

                    const handleMouseMove = (e: MouseEvent) => {
                      const deltaX = e.clientX - startX;
                      const deltaY = e.clientY - startY;

                      if (
                        !isDragging &&
                        (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                      ) {
                        isDragging = true;
                      }

                      if (isDragging) {
                        const rotation = deltaX * 0.1;
                        cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                        cardElement.style.opacity = String(
                          Math.max(0.3, 1 - Math.abs(deltaX) / 300)
                        );
                        setSwipeOffset(deltaX);
                      }
                    };

                    const handleMouseUp = (e: MouseEvent) => {
                      if (isDragging) {
                        const deltaX = e.clientX - startX;
                        setSwipeOffset(0);
                        
                        if (Math.abs(deltaX) > 40) {
                          const swipeDirection = deltaX > 0 ? "right" : "left";

                          if (swipeDirection === "right") {
                            const direction = "150%";
                            const rotation = "30deg";
                            cardElement.style.transform = `translate(${direction}, ${
                              deltaX * 0.5
                            }px) rotate(${rotation})`;
                            cardElement.style.opacity = "0";

                            setTimeout(() => {
                              cardElement.style.transform = "";
                              cardElement.style.opacity = "";
                              swipeCard(swipeDirection);
                            }, 300);
                          } else {
                            cardElement.style.transform = "";
                            cardElement.style.opacity = "";
                            swipeCard(swipeDirection);

                            setTimeout(() => {
                              const newTopCard =
                                cardElement.parentElement?.querySelector(
                                  '[data-card-index="0"]'
                                ) as HTMLElement;
                              if (newTopCard) {
                                newTopCard.style.transform =
                                  "translate(150%, 0) rotate(30deg)";
                                newTopCard.style.opacity = "0";

                                setTimeout(() => {
                                  newTopCard.style.transform = "";
                                  newTopCard.style.opacity = "";
                                  newTopCard.style.transition =
                                    "transform 300ms ease-out, opacity 300ms ease-out";

                                  setTimeout(() => {
                                    newTopCard.style.transition = "";
                                  }, 300);
                                }, 10);
                              }
                            }, 10);
                          }
                        } else {
                          cardElement.style.transform = "";
                          cardElement.style.opacity = "";
                        }
                      }

                      document.removeEventListener("mousemove", handleMouseMove);
                      document.removeEventListener("mouseup", handleMouseUp);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                  }}
                  onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
                    if (!isTop) return;

                    const startX = e.touches[0].clientX;
                    const startY = e.touches[0].clientY;
                    const cardElement = e.currentTarget as HTMLElement;
                    let isDragging = false;

                    const handleTouchMove = (e: TouchEvent) => {
                      const deltaX = e.touches[0].clientX - startX;
                      const deltaY = e.touches[0].clientY - startY;

                      if (
                        !isDragging &&
                        (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                      ) {
                        isDragging = true;
                      }

                      if (isDragging) {
                        e.preventDefault();
                        const rotation = deltaX * 0.1;
                        cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                        cardElement.style.opacity = String(
                          Math.max(0.3, 1 - Math.abs(deltaX) / 300)
                        );
                        setSwipeOffset(deltaX);
                      }
                    };

                    const handleTouchEnd = (e: TouchEvent) => {
                      if (isDragging) {
                        const deltaX = e.changedTouches[0].clientX - startX;
                        setSwipeOffset(0);
                        
                        if (Math.abs(deltaX) > 40) {
                          const swipeDirection = deltaX > 0 ? "right" : "left";

                          if (swipeDirection === "right") {
                            const direction = "150%";
                            const rotation = "30deg";
                            cardElement.style.transform = `translate(${direction}, ${
                              deltaX * 0.5
                            }px) rotate(${rotation})`;
                            cardElement.style.opacity = "0";

                            setTimeout(() => {
                              cardElement.style.transform = "";
                              cardElement.style.opacity = "";
                              swipeCard(swipeDirection);
                            }, 300);
                          } else {
                            cardElement.style.transform = "";
                            cardElement.style.opacity = "";
                            swipeCard(swipeDirection);

                            setTimeout(() => {
                              const newTopCard =
                                cardElement.parentElement?.querySelector(
                                  '[data-card-index="0"]'
                                ) as HTMLElement;
                              if (newTopCard) {
                                newTopCard.style.transform =
                                  "translate(150%, 0) rotate(30deg)";
                                newTopCard.style.opacity = "0";

                                setTimeout(() => {
                                  newTopCard.style.transform = "";
                                  newTopCard.style.opacity = "";
                                  newTopCard.style.transition =
                                    "transform 300ms ease-out, opacity 300ms ease-out";

                                  setTimeout(() => {
                                    newTopCard.style.transition = "";
                                  }, 300);
                                }, 10);
                              }
                            }, 10);
                          }
                        } else {
                          cardElement.style.transform = "";
                          cardElement.style.opacity = "";
                        }
                      }

                      document.removeEventListener("touchmove", handleTouchMove);
                      document.removeEventListener("touchend", handleTouchEnd);
                    };

                    document.addEventListener("touchmove", handleTouchMove, { passive: false });
                    document.addEventListener("touchend", handleTouchEnd);
                  }}
                >
                  <div
                    className={`bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-xl p-3 h-full relative overflow-hidden border-2 border-white/10`}
                    style={{
                      boxShadow: isTop 
                        ? '0 20px 40px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.3)' 
                        : `0 ${8 + index * 4}px ${16 + index * 8}px rgba(0,0,0,${0.3 + index * 0.1})`
                    }}
                  >
                    {/* Background decoration */}
                    <div className="absolute bottom-0 right-0 w-16 h-16 opacity-30">
                      <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 rounded-full"></div>
                    </div>

                    {/* Card content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-between py-2">
                      {/* Top - tiny label */}
                      <div className="text-[7px] text-white/60 uppercase tracking-widest font-medium">
                        minicast
                      </div>

                      {/* Spacer */}
                      <div />

                      {/* Bottom - Play button */}
                      <button
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-2.5 py-1 rounded-full text-[8px] font-medium transition-all disabled:opacity-60"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isTop && !isLoadingAudio) {
                            togglePlay();
                          }
                        }}
                        disabled={isTop && isLoadingAudio}
                        data-testid="button-play-audio-card"
                      >
                        <div className="flex items-center gap-0.5">
                          {isTop && isLoadingAudio ? (
                            <Loader2 className="w-1.5 h-1.5 animate-spin" />
                          ) : isTop && isPlaying ? (
                            <Pause className="w-1.5 h-1.5 fill-white" />
                          ) : isTop && isPreloading ? (
                            <Loader2 className="w-1.5 h-1.5 animate-spin opacity-70" />
                          ) : (
                            <Play className="w-1.5 h-1.5 fill-white" />
                          )}
                          <span>
                            {isTop && isLoadingAudio ? 'Loading...' : isTop && isPlaying ? 'Pause' : isTop && isPreloading ? 'Preparing...' : 'Play Now'}
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Stack indicator for non-top cards */}
                    {!isTop && (
                      <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            data-testid="button-comment-audio"
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            <span className="text-sm">{comments}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`${
              localLiked
                ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
            data-testid="button-like-audio"
          >
            <Heart className={`h-5 w-5 mr-1 ${localLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            data-testid="button-share-audio"
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-[280px] w-[calc(100vw-2rem)] rounded-2xl p-0 overflow-hidden border border-border shadow-xl">
            <div className="flex flex-col items-center px-5 pt-5 pb-4 gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Delete post?</p>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowDeleteDialog(false)}
                  data-testid="button-cancel-delete-audio"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  data-testid="button-confirm-delete-audio"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
});
