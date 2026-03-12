import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause } from 'lucide-react';
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
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const prevTopCardIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Update cards when snippets change - new cards added to TOP with different colors
  useEffect(() => {
    const currentIds = cards.map(c => c.id);
    const newSnippetIds = snippets.map(s => s.id);
    
    // Find newly added snippets
    const addedSnippets = snippets.filter(s => !currentIds.includes(s.id));
    
    if (addedSnippets.length > 0) {
      // Trigger animation when new card is added
      setIsAnimatingIn(true);
      
      // Add new cards to the TOP of the stack with rotating colors
      const newCards: CardWithColor[] = addedSnippets.map((snippet, idx) => ({
        ...snippet,
        colorIndex: (nextColorIndex + idx) % 5
      }));
      
      setCards(prev => [...newCards, ...prev.filter(c => newSnippetIds.includes(c.id))]);
      setNextColorIndex((nextColorIndex + addedSnippets.length) % 5);
      
      // Reset animation after it completes
      setTimeout(() => setIsAnimatingIn(false), 600);
    } else if (currentIds.length !== newSnippetIds.length) {
      // Cards were removed
      setCards(prev => prev.filter(c => newSnippetIds.includes(c.id)));
    }
  }, [snippets]);

  const playCard = useCallback((card: CardWithColor) => {
    if (!card.text || card.text.trim().length === 0) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      
      const cleanText = removeEmojis(card.text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const savedVoiceProfileId = localStorage.getItem('activeVoiceProfileId') || 'ravi';
      const voiceProfileMap: Record<string, string[]> = {
        ravi: ["Google UK English Male", "Microsoft Ravi Online (Natural) - English (India)", "en-IN-Wavenet-B", "en-IN-Standard-B", "ravi", "moira"],
        vaib: ["Google US English", "Microsoft Vaibhav Online (Natural) - English (India)", "en-IN-Wavenet-A", "en-IN-Standard-A", "samantha", "aria"],
        kids: ["Google UK English Female", "Microsoft Heera Online (Natural) - English (India)", "en-IN-Wavenet-D", "en-IN-Standard-D", "ava", "samantha"],
      };
      const priorityKeywords = voiceProfileMap[savedVoiceProfileId as keyof typeof voiceProfileMap] || voiceProfileMap.ravi;
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => 
        priorityKeywords.some(keyword => v.name.toLowerCase().includes(keyword.toLowerCase()))
      );
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setPlayingCardId(card.id);
      };
      
      utterance.onend = () => {
        setPlayingCardId(null);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setPlayingCardId(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingCardId(null);
    }
  }, []);

  // Auto-play current (top) card when it changes
  useEffect(() => {
    if (shouldAutoPlay && cards.length > 0 && cards[0].id !== prevTopCardIdRef.current) {
      prevTopCardIdRef.current = cards[0].id;
      // Small delay to ensure card is rendered
      const timer = setTimeout(() => {
        playCard(cards[0]);
      }, 100);
      return () => clearTimeout(timer);
    } else if (cards.length > 0) {
      prevTopCardIdRef.current = cards[0].id;
    }
  }, [cards, shouldAutoPlay, playCard]);

  const swipeCard = (direction: 'left' | 'right') => {
    // Stop any currently playing audio when swiping
    window.speechSynthesis.cancel();
    setPlayingCardId(null);
    setShouldAutoPlay(true); // Enable auto-play for next card
    
    setCards((prevCards) => {
      const newCards = [...prevCards];
      if (direction === 'right') {
        // Move first card to end (swipe right = next card)
        const firstCard = newCards.shift();
        if (firstCard) newCards.push(firstCard);
      } else {
        // Move last card to front (swipe left = previous card)
        const lastCard = newCards.pop();
        if (lastCard) newCards.unshift(lastCard);
      }
      return newCards;
    });
  };

  const [swipeOffset, setSwipeOffset] = useState(0);

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600', label: 'TECH NEWS', icon: '💻' },
      { from: 'from-purple-500', to: 'to-purple-600', label: 'MARKET UPDATE', icon: '📊' },
      { from: 'from-pink-500', to: 'to-pink-600', label: 'TRADING ALERT', icon: '📈' },
      { from: 'from-indigo-500', to: 'to-indigo-600', label: 'FINANCE NEWS', icon: '💡' },
      { from: 'from-cyan-500', to: 'to-cyan-600', label: 'INSIGHT', icon: '🎯' },
    ];
    return gradients[idx % gradients.length];
  };

  const removeEmojis = (text: string): string => {
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]/gu, '');
  };

  const handleReadNow = (card: CardWithColor, e: React.MouseEvent) => {
    e.stopPropagation();
    setShouldAutoPlay(false); // Disable auto-play for manual interactions
    
    if (playingCardId === card.id) {
      window.speechSynthesis.cancel();
      setPlayingCardId(null);
      return;
    }

    if (!card.text || card.text.trim().length === 0) {
      toast({
        description: "No content to read",
        variant: "destructive"
      });
      return;
    }

    try {
      playCard(card);
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingCardId(null);
      toast({
        description: "Audio playback not supported in this browser",
        variant: "destructive"
      });
    }
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
        const authorName = card.authorDisplayName || card.authorUsername || 'Trading';
        
        // Enhanced stacking effect - more visible depth like the image
        let stackTransform = '';
        let stackOpacity = 1;
        let stackZ = 40;
        
        if (!isTop) {
          // Calculate rotation and offset for stacked cards
          const rotationDeg = index * 3; // Slight rotation for each card
          const yOffset = index * 8; // Vertical offset
          const scale = 1 - (index * 0.03); // Slight scale reduction
          const xOffset = index * -2; // Slight horizontal shift for depth
          
          stackTransform = `translateY(${yOffset}px) translateX(${xOffset}px) rotate(${rotationDeg}deg) scale(${scale})`;
          stackOpacity = isSecond ? 0.95 : (isThird ? 0.85 : (isFourth ? 0.75 : (isFifth ? 0.65 : 0.5)));
          stackZ = isSecond ? 30 : (isThird ? 20 : (isFourth ? 15 : (isFifth ? 10 : 5)));
        }
        
        // Initial animation for new cards
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
                  
                  // Show preview of next card by updating swipe offset
                  setSwipeOffset(deltaX);
                }
              };

              const handleMouseUp = (e: MouseEvent) => {
                if (isDragging) {
                  const deltaX = e.clientX - startX;
                  setSwipeOffset(0); // Reset preview
                  
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
                  
                  // Show preview of next card
                  setSwipeOffset(deltaX);
                }
              };

              const handleTouchEnd = (e: TouchEvent) => {
                if (isDragging) {
                  const deltaX = e.changedTouches[0].clientX - startX;
                  setSwipeOffset(0); // Reset preview
                  
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
              <div className="relative z-10">
                <div className="text-[8px] text-white/80 mb-1 uppercase tracking-wide font-medium">
                  {gradient.label}
                </div>
                <h3 className="text-xs font-bold text-white mb-2 leading-tight">
                  Latest in
                  <br />
                  {authorName.toLowerCase()}
                </h3>
                <button
                  type="button"
                  className={`bg-white px-2 py-1 rounded-full text-[10px] font-medium shadow-lg transition-colors ${
                    playingCardId === card.id
                      ? 'text-blue-600 hover:bg-gray-100'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                  onClick={(e) => handleReadNow(card, e)}
                  data-testid={`button-read-now-card-${card.id}`}
                >
                  <div className="flex items-center gap-1">
                    {playingCardId === card.id ? (
                      <>
                        <Pause className="w-2 h-2 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2 h-2" />
                        <span>Read Now</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Icon */}
              <div className="absolute top-2 right-2 text-sm filter drop-shadow-lg">
                {gradient.icon}
              </div>

              {/* Remove button - only show on top card */}
              {isTop && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(card.id);
                  }}
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110 z-30"
                  data-testid={`button-remove-snippet-${card.id}`}
                >
                  <X className="w-2 h-2 text-white" />
                </button>
              )}

              {/* Stack indicator for non-top cards */}
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
