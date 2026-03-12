import { useState } from 'react';
import { X, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface SelectedPostMiniCardProps {
  post: {
    id: string | number;
    authorUsername?: string;
    authorDisplayName?: string;
    content: string;
  };
  onRemove: () => void;
  index: number;
}

export function SelectedPostMiniCard({ post, onRemove, index }: SelectedPostMiniCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600', icon: '💼' },
      { from: 'from-purple-500', to: 'to-purple-600', icon: '📊' },
      { from: 'from-pink-500', to: 'to-pink-600', icon: '📈' },
      { from: 'from-indigo-500', to: 'to-indigo-600', icon: '💡' },
      { from: 'from-cyan-500', to: 'to-cyan-600', icon: '🎯' },
    ];
    return gradients[idx % gradients.length];
  };

  const gradient = getGradient(index);
  const authorName = post.authorDisplayName || post.authorUsername || 'Trading Insight';

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

    if (!post.content || post.content.trim().length === 0) {
      toast({
        description: "No content to read",
        variant: "destructive"
      });
      return;
    }

    try {
      const cleanText = removeEmojis(post.content);
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
      className={`relative w-full rounded-xl bg-gradient-to-br ${gradient.from} ${gradient.to} p-6 text-white shadow-xl hover:shadow-2xl transition-shadow`}
      data-testid={`mini-card-${post.id}`}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110"
        data-testid={`button-remove-card-${post.id}`}
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col space-y-4">
        {/* Header with icon */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{gradient.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
              {authorName}
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold leading-tight">
            Latest in Trading
          </h3>
          <p className="text-sm leading-relaxed opacity-95 line-clamp-3">
            {truncateText(post.content, 120)}
          </p>
        </div>
        
        {/* Action Button */}
        <button 
          type="button"
          className={`inline-flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors w-fit shadow-md ${
            isPlaying 
              ? 'text-blue-600 hover:bg-gray-100' 
              : 'text-gray-800 hover:bg-gray-100'
          }`}
          onClick={handleReadNow}
          data-testid={`button-read-now-${post.id}`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Read Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
