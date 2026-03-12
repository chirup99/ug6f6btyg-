import { useState, useEffect } from 'react';
import type { SelectedTextSnippet } from '@/contexts/AudioModeContext';
import { useAudioMode } from '@/contexts/AudioModeContext';
import { X } from 'lucide-react';

interface AudioSelectedPostsPreviewProps {
  snippets: SelectedTextSnippet[];
  onTap: () => void;
  onDeactivate: () => void;
}

interface CardWithColor extends SelectedTextSnippet {
  colorIndex: number;
}

export function AudioSelectedPostsPreview({ snippets, onTap, onDeactivate }: AudioSelectedPostsPreviewProps) {
  const [cards, setCards] = useState<CardWithColor[]>([]);
  const [nextColorIndex, setNextColorIndex] = useState(0);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const { isAudioMode } = useAudioMode();

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

  const hasNoSnippets = cards.length === 0;

  if (!isAudioMode) return null;

  return (
    <div 
      className="fixed bottom-24 right-4 z-40 cursor-pointer transition-all duration-300 md:bottom-4"
      onClick={() => {
        if (hasNoSnippets) {
          onDeactivate();
        } else {
          onTap();
        }
      }}
      data-testid="audio-selected-preview"
    >
      <div className="relative w-16 h-20" style={{ perspective: '1000px' }}>
        {/* If no snippets are selected, show the deactivation icon */}
        {hasNoSnippets ? (
          <div 
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover:scale-105 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onDeactivate();
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <X className="w-6 h-6 text-red-500" />
              <span className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase">Close</span>
            </div>
          </div>
        ) : (
          cards.slice(0, 5).map((card, index) => {
            const isTop = index === 0;
            const gradient = getGradient(card.colorIndex);
            
            let stackTransform = '';
            let stackOpacity = 1;
            let stackZ = 40;
            
            if (!isTop) {
              const rotationDeg = index * 4;
              const yOffset = index * 4;
              const scale = 1 - (index * 0.05);
              const xOffset = index * -2;
              
              stackTransform = `translateY(${yOffset}px) translateX(${xOffset}px) rotate(${rotationDeg}deg) scale(${scale})`;
              stackOpacity = 1 - (index * 0.15);
              stackZ = 40 - (index * 10);
            }
            
            const initialTransform = isAnimatingIn && isTop 
              ? 'translateY(-50px) scale(0.5) rotate(-15deg)'
              : stackTransform;

            return (
              <div
                key={card.id}
                className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-lg shadow-lg border-2 border-white dark:border-gray-800 transition-all hover:scale-105`}
                style={{
                  transform: initialTransform,
                  opacity: stackOpacity,
                  zIndex: stackZ,
                  transition: isAnimatingIn && isTop 
                    ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease-out'
                    : 'transform 0.3s ease-out, opacity 0.3s ease-out',
                }}
              >
                {/* Card count badge */}
                {isTop && cards.length > 1 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {cards.length}
                  </div>
                )}
                
                {/* Card content - minimal for tiny size */}
                <div className="p-2 h-full flex flex-col justify-center items-center">
                  <div className="text-white text-xs font-bold text-center leading-tight">
                    {isTop ? '🎙️' : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Pulse animation hint - only when snippets are present */}
      {!hasNoSnippets && (
        <div className="absolute inset-0 rounded-lg animate-pulse opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-purple-500 rounded-lg"></div>
        </div>
      )}
    </div>
  );
}
