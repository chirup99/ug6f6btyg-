import { useState } from 'react';
import { X, Play, Pause } from 'lucide-react';
import type { SelectedTextSnippet } from '@/contexts/AudioModeContext';
import { useToast } from '@/hooks/use-toast';

interface SelectedTextSnippetCardProps {
  snippet: SelectedTextSnippet;
  onRemove: () => void;
  index: number;
}

export function SelectedTextSnippetCard({ snippet, onRemove, index }: SelectedTextSnippetCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

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

  const gradient = getGradient(index);
  const authorName = snippet.authorDisplayName || snippet.authorUsername || 'Trading Insight';

  const removeEmojis = (text: string): string => {
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]/gu, '');
  };

  const handleReadNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!snippet.text || snippet.text.trim().length === 0) {
      toast({
        description: "No content to read",
        variant: "destructive"
      });
      return;
    }

    try {
      const cleanText = removeEmojis(snippet.text);
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
        setIsPlaying(true);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        toast({
          description: "Failed to play audio. Please try again.",
          variant: "destructive"
        });
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      toast({
        description: "Audio playback not supported in this browser",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="relative flex-shrink-0 w-48 h-60 group"
      data-testid={`snippet-card-${snippet.id}`}
    >
      {/* Stacked card effect - bottom layers */}
      <div className="absolute top-2 left-2 right-2 bottom-0 bg-gray-400 dark:bg-gray-600 rounded-xl opacity-30" />
      <div className="absolute top-1 left-1 right-1 bottom-1 bg-gray-300 dark:bg-gray-700 rounded-xl opacity-50" />
      
      {/* Main card */}
      <div 
        className={`relative w-full h-full rounded-xl bg-gradient-to-br ${gradient.from} ${gradient.to} p-4 text-white shadow-2xl flex flex-col justify-between`}
      >
        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110 z-10"
          data-testid={`button-remove-snippet-${snippet.id}`}
        >
          <X className="w-3 h-3" />
        </button>
        
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{gradient.icon}</span>
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">
              {gradient.label}
            </p>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold leading-tight">
            Latest in {authorName.toLowerCase()}
          </h3>
          
          {/* Content preview */}
          <p className="text-xs leading-relaxed opacity-90 line-clamp-4">
            {truncateText(snippet.text, 100)}
          </p>
        </div>
        
        {/* Action Button */}
        <button 
          type="button"
          className={`inline-flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors w-full shadow-md ${
            isPlaying 
              ? 'text-blue-600 hover:bg-gray-100' 
              : 'text-gray-800 hover:bg-gray-100'
          }`}
          onClick={handleReadNow}
          data-testid={`button-read-now-snippet-${snippet.id}`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Read Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
