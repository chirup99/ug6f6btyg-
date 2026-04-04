import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, Loader2 } from 'lucide-react';
import type { SelectedTextSnippet } from '@/contexts/AudioModeContext';
import { useToast } from '@/hooks/use-toast';

interface StackedSwipeableCardsProps {
  snippets: SelectedTextSnippet[];
  onRemove: (id: string) => void;
}

interface CardWithColor extends SelectedTextSnippet {
  colorIndex: number;
}

export function StackedSwipeableCards({ snippets, onRemove }: StackedSwipeableCardsProps) {
  const [cards, setCards] = useState<CardWithColor[]>([]);
  const [nextColorIndex, setNextColorIndex] = useState(0);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const pendingAutoPlayRef = useRef<CardWithColor | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const audioInflightRef = useRef<Map<string, Promise<string | null>>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    const currentIds = cards.map(c => c.id);
    const newSnippetIds = snippets.map(s => s.id);
    const addedSnippets = snippets.filter(s => !currentIds.includes(s.id));

    if (addedSnippets.length > 0) {
      setIsAnimatingIn(true);
      const newCards: CardWithColor[] = addedSnippets.map((snippet, idx) => ({
        ...snippet,
        colorIndex: (nextColorIndex + idx) % 5
      }));
      setCards(prev => [...newCards, ...prev.filter(c => newSnippetIds.includes(c.id))]);
      setNextColorIndex((nextColorIndex + addedSnippets.length) % 5);
      setTimeout(() => setIsAnimatingIn(false), 600);
    } else if (currentIds.length !== newSnippetIds.length) {
      setCards(prev => prev.filter(c => newSnippetIds.includes(c.id)));
    }
  }, [snippets]);

  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/www\.[^\s]+/gi, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setPlayingCardId(null);
    setLoadingCardId(null);
  }, []);

  const fetchAndCacheTTS = useCallback(async (
    card: CardWithColor,
    cancelled: { value: boolean }
  ): Promise<string | null> => {
    const savedVoiceProfileId = localStorage.getItem('activeVoiceProfileId') || 'en-IN-NeerjaNeural';
    const voiceLanguage = localStorage.getItem('voiceLanguage') || 'en';
    const cacheKey = `${card.id}::${voiceLanguage}::${savedVoiceProfileId}`;

    // 1. Already cached → instant return
    const cached = audioCacheRef.current.get(cacheKey);
    if (cached) return cached;

    // 2. Already in-flight → join the existing promise instead of firing a duplicate
    const inflight = audioInflightRef.current.get(cacheKey);
    if (inflight) return inflight;

    const textToSpeak = cleanTextForSpeech(card.text || '');
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
        if (err?.name !== 'AbortError') console.error('[SwipeCard] TTS fetch error:', err?.message);
        return null;
      } finally {
        audioInflightRef.current.delete(cacheKey);
      }
    })();

    audioInflightRef.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, []);

  // Preload top card audio and auto-play after swipe
  useEffect(() => {
    if (cards.length === 0) return;
    const cancelled = { value: false };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const topCard = cards[0];
    const pendingCard = pendingAutoPlayRef.current;
    // Check shouldAutoPlay but do NOT clear the ref yet — the ref is cleared only
    // after the fetch succeeds and we are about to play. This prevents the race where:
    // 1) effect runs → shouldAutoPlay=true → ref cleared
    // 2) async fetch in progress (800ms)
    // 3) cards change (news refresh etc.) → cleanup runs → effect re-runs
    // 4) ref is null → shouldAutoPlay=false → no auto-play
    const shouldAutoPlay = pendingCard !== null && pendingCard.id === topCard.id;

    const cacheKey = `${topCard.id}::${localStorage.getItem('voiceLanguage') || 'en'}::${localStorage.getItem('activeVoiceProfileId') || 'en-IN-NeerjaNeural'}`;
    const alreadyCached = audioCacheRef.current.has(cacheKey);
    if (!alreadyCached) setIsPreloading(true);

    (async () => {
      const audioUrl = await fetchAndCacheTTS(topCard, cancelled);
      if (cancelled.value) return;
      setIsPreloading(false);

      if (shouldAutoPlay && audioUrl) {
        // Clear the ref HERE — only when we are certain we are going to play,
        // so if we were cancelled mid-flight the next effect run still sees the ref.
        pendingAutoPlayRef.current = null;
        if (currentAudioRef.current) currentAudioRef.current.pause();
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.onended = () => setPlayingCardId(null);
        audio.onerror = () => setPlayingCardId(null);
        try { await audio.play(); setPlayingCardId(topCard.id); } catch { setPlayingCardId(null); }
      }
    })();

    // Stagger preload remaining cards
    cards.slice(1).forEach((card, i) => {
      timers.push(setTimeout(() => {
        if (!cancelled.value) fetchAndCacheTTS(card, cancelled);
      }, (i + 1) * 1500));
    });

    return () => {
      cancelled.value = true;
      timers.forEach(clearTimeout);
      setIsPreloading(false);
    };
  }, [cards, fetchAndCacheTTS]);

  // Revoke URLs on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      audioCacheRef.current.forEach(url => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
      audioInflightRef.current.clear();
    };
  }, []);

  const swipeCard = (direction: 'left' | 'right') => {
    stopCurrentAudio();
    setCards((prevCards) => {
      const newCards = [...prevCards];
      if (direction === 'right') {
        const firstCard = newCards.shift();
        if (firstCard) newCards.push(firstCard);
      } else {
        const lastCard = newCards.pop();
        if (lastCard) newCards.unshift(lastCard);
      }
      pendingAutoPlayRef.current = newCards[0] || null;
      return newCards;
    });
  };

  const handlePlayPause = async (card: CardWithColor, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingCardId === card.id) {
      stopCurrentAudio();
      return;
    }

    if (loadingCardId === card.id) return;

    if (!card.text || card.text.trim().length === 0) {
      toast({ description: 'No content to play', variant: 'destructive' });
      return;
    }

    stopCurrentAudio();
    setLoadingCardId(card.id);

    const cancelled = { value: false };
    const audioUrl = await fetchAndCacheTTS(card, cancelled);
    setLoadingCardId(null);
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    audio.onended = () => setPlayingCardId(null);
    audio.onerror = () => setPlayingCardId(null);
    try {
      await audio.play();
      setPlayingCardId(card.id);
    } catch {
      setPlayingCardId(null);
    }
  };

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600' },
      { from: 'from-purple-500', to: 'to-purple-600' },
      { from: 'from-pink-500', to: 'to-pink-600' },
      { from: 'from-indigo-500', to: 'to-indigo-600' },
      { from: 'from-cyan-500', to: 'to-cyan-600' },
    ];
    return gradients[idx % gradients.length];
  };

  if (cards.length === 0) return null;

  return (
    <div className="relative w-28 h-40 mx-auto" style={{ perspective: '1000px' }}>
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

        const initialTransform = isAnimatingIn && isTop
          ? 'translateY(-100px) scale(0.8) rotate(-10deg)'
          : stackTransform;

        return (
          <div
            key={card.id}
            data-card-index={index}
            style={{
              transform: initialTransform,
              transition: isAnimatingIn && isTop
                ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease-out'
                : 'transform 0.3s ease-out, opacity 0.3s ease-out',
              opacity: isAnimatingIn && isTop ? 0.3 : stackOpacity,
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
                if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) isDragging = true;
                if (isDragging) {
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(Math.max(0.3, 1 - Math.abs(deltaX) / 300));
                  setSwipeOffset(deltaX);
                }
              };

              const handleMouseUp = (e: MouseEvent) => {
                if (isDragging) {
                  const deltaX = e.clientX - startX;
                  setSwipeOffset(0);
                  if (Math.abs(deltaX) > 40) {
                    const dir = deltaX > 0 ? 'right' : 'left';
                    if (dir === 'right') {
                      cardElement.style.transform = `translate(150%, ${deltaX * 0.5}px) rotate(30deg)`;
                      cardElement.style.opacity = '0';
                      setTimeout(() => { cardElement.style.transform = ''; cardElement.style.opacity = ''; swipeCard(dir); }, 300);
                    } else {
                      cardElement.style.transform = '';
                      cardElement.style.opacity = '';
                      swipeCard(dir);
                      setTimeout(() => {
                        const newTop = cardElement.parentElement?.querySelector('[data-card-index="0"]') as HTMLElement;
                        if (newTop) {
                          newTop.style.transform = 'translate(150%, 0) rotate(30deg)';
                          newTop.style.opacity = '0';
                          setTimeout(() => {
                            newTop.style.transform = '';
                            newTop.style.opacity = '';
                            newTop.style.transition = 'transform 300ms ease-out, opacity 300ms ease-out';
                            setTimeout(() => { newTop.style.transition = ''; }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    cardElement.style.transform = '';
                    cardElement.style.opacity = '';
                  }
                }
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
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
                if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) isDragging = true;
                if (isDragging) {
                  e.preventDefault();
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(Math.max(0.3, 1 - Math.abs(deltaX) / 300));
                  setSwipeOffset(deltaX);
                }
              };

              const handleTouchEnd = (e: TouchEvent) => {
                if (isDragging) {
                  const deltaX = e.changedTouches[0].clientX - startX;
                  setSwipeOffset(0);
                  if (Math.abs(deltaX) > 40) {
                    const dir = deltaX > 0 ? 'right' : 'left';
                    if (dir === 'right') {
                      cardElement.style.transform = `translate(150%, ${deltaX * 0.5}px) rotate(30deg)`;
                      cardElement.style.opacity = '0';
                      setTimeout(() => { cardElement.style.transform = ''; cardElement.style.opacity = ''; swipeCard(dir); }, 300);
                    } else {
                      cardElement.style.transform = '';
                      cardElement.style.opacity = '';
                      swipeCard(dir);
                      setTimeout(() => {
                        const newTop = cardElement.parentElement?.querySelector('[data-card-index="0"]') as HTMLElement;
                        if (newTop) {
                          newTop.style.transform = 'translate(150%, 0) rotate(30deg)';
                          newTop.style.opacity = '0';
                          setTimeout(() => {
                            newTop.style.transform = '';
                            newTop.style.opacity = '';
                            newTop.style.transition = 'transform 300ms ease-out, opacity 300ms ease-out';
                            setTimeout(() => { newTop.style.transition = ''; }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    cardElement.style.transform = '';
                    cardElement.style.opacity = '';
                  }
                }
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
              };

              document.addEventListener('touchmove', handleTouchMove, { passive: false });
              document.addEventListener('touchend', handleTouchEnd);
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
                {/* Top label */}
                <div className="text-[7px] text-white/60 uppercase tracking-widest font-medium">
                  minicast
                </div>

                <div />

                {/* Bottom play button */}
                <button
                  type="button"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-2.5 py-1 rounded-full text-[8px] font-medium transition-all disabled:opacity-60"
                  onClick={(e) => { if (isTop) handlePlayPause(card, e); }}
                  disabled={isTop && loadingCardId === card.id}
                  data-testid={`button-play-minicast-${card.id}`}
                >
                  <div className="flex items-center gap-0.5">
                    {isTop && loadingCardId === card.id ? (
                      <Loader2 className="w-1.5 h-1.5 animate-spin" />
                    ) : isTop && playingCardId === card.id ? (
                      <Pause className="w-1.5 h-1.5 fill-white" />
                    ) : isTop && isPreloading ? (
                      <Loader2 className="w-1.5 h-1.5 animate-spin opacity-70" />
                    ) : (
                      <Play className="w-1.5 h-1.5 fill-white" />
                    )}
                    <span>
                      {isTop && loadingCardId === card.id
                        ? 'Loading...'
                        : isTop && playingCardId === card.id
                        ? 'Pause'
                        : isTop && isPreloading
                        ? 'Preparing...'
                        : 'Play Now'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Remove button - top card only */}
              {isTop && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(card.id); }}
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110 z-30"
                  data-testid={`button-remove-snippet-${card.id}`}
                >
                  <X className="w-2 h-2 text-white" />
                </button>
              )}

              {/* Dim non-top cards */}
              {!isTop && (
                <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
