import { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Play, 
  Pause,
  ChevronLeft,
  ChevronRight,
  Tv,
  Link as LinkIcon,
  MoreVertical,
  Radio
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BannerContent {
  id: string;
  type: 'live_stream' | 'ad' | 'update' | 'content';
  title: string;
  description: string;
  imageUrl?: string;
  youtubeEmbedUrl?: string;
  date?: string;
  isLive?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const getDefaultBannerContent = (youtubeUrl?: string | null): BannerContent[] => {
  return [
    {
      id: '1', 
      type: 'live_stream',
      title: 'CNBC Live Stream',
      description: 'Watch live market analysis and trading strategies',
      youtubeEmbedUrl: youtubeUrl || 'https://www.youtube.com/embed/P857H4ej-MQ?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&pp=ygUJY25iYyBsaXZl',
      isLive: true,
      priority: 'high'
    },
    {
      id: '2',
      type: 'content',
      title: 'Market Analysis Update',
      description: 'Latest market trends and analysis',
      date: '9 Sep 2024'
    },
    {
      id: '3',
      type: 'update',
      title: 'Important Trading Update',
      description: 'New features and market alerts now available',
      priority: 'high'
    },
    {
      id: '4',
      type: 'ad',
      title: 'Premium Trading Tools',
      description: 'Upgrade to access advanced analytics and insights',
      priority: 'medium'
    }
  ];
};

export function LiveBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/embed/P857H4ej-MQ?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&pp=ygUJY25iYyBsaXZl');

  const handleCnbcStream = () => {
    const cnbcUrl = 'https://www.youtube.com/embed/P857H4ej-MQ?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0';
    updateStreamUrl(cnbcUrl);
  };

  const handleCustomUrlSubmit = () => {
    if (!customUrl) return;
    
    let processedUrl = customUrl.trim();
    
    try {
      if (processedUrl.includes('youtube.com/watch?v=')) {
        const urlObj = new URL(processedUrl);
        const videoId = urlObj.searchParams.get('v');
        if (videoId) processedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (processedUrl.includes('youtu.be/')) {
        const videoId = processedUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
        if (videoId) processedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (processedUrl.includes('youtube.com/live/')) {
        const videoId = processedUrl.split('live/')[1]?.split(/[?#]/)[0];
        if (videoId) processedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (processedUrl.includes('youtube.com/embed/')) {
        if (processedUrl.startsWith('//')) processedUrl = 'https:' + processedUrl;
      }
    } catch (e) {
      console.error('Error processing URL:', e);
    }

    updateStreamUrl(processedUrl);
    setIsUrlDialogOpen(false);
    setCustomUrl('');
  };

  const updateStreamUrl = (url: string) => {
    const origin = window.location.origin;
    const cleanUrl = url.includes('?') 
      ? `${url}&enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&origin=${encodeURIComponent(origin)}`
      : `${url}?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&origin=${encodeURIComponent(origin)}`;
    setYoutubeUrl(cleanUrl);
    setCurrentIndex(0);
    setIsVideoPlaying(false);
    localStorage.setItem('youtube_banner_url', cleanUrl);
    
    const event = new CustomEvent('livestream-url-updated', { detail: { url: cleanUrl } });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const savedUrl = localStorage.getItem('youtube_banner_url');
    if (savedUrl) {
      const cleanUrl = savedUrl.includes('?') 
        ? `${savedUrl}&modestbranding=1&controls=0&showinfo=0&rel=0`
        : `${savedUrl}?modestbranding=1&controls=0&showinfo=0&rel=0`;
      setYoutubeUrl(cleanUrl);
    }
  }, []);

  useEffect(() => {
    const handleUrlUpdate = (event: CustomEvent) => {
      const newUrl = event.detail.url;
      if (newUrl) {
        const cleanUrl = newUrl.includes('?') 
          ? `${newUrl}&modestbranding=1&controls=0&showinfo=0&rel=0`
          : `${newUrl}?modestbranding=1&controls=0&showinfo=0&rel=0`;
        setYoutubeUrl(cleanUrl);
        setCurrentIndex(0);
        setIsVideoPlaying(false);
      } else {
        setYoutubeUrl('https://www.youtube.com/embed/P857H4ej-MQ?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&pp=ygUJY25iYyBsaXZl');
        setCurrentIndex(0);
        setIsVideoPlaying(false);
      }
    };

    window.addEventListener('livestream-url-updated', handleUrlUpdate as EventListener);
    return () => {
      window.removeEventListener('livestream-url-updated', handleUrlUpdate as EventListener);
    };
  }, []);

  const bannerContent = useMemo(() => {
    return getDefaultBannerContent(youtubeUrl);
  }, [youtubeUrl]);
  
  const currentContent = bannerContent[currentIndex];

  useEffect(() => {
    if (!isCarouselPlaying) return;
    if (isVideoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerContent.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isCarouselPlaying, isVideoPlaying, bannerContent.length]);

  useEffect(() => {
    if (!currentContent.youtubeEmbedUrl) return;

    const handleScroll = () => {
      if (isVideoPlaying && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}', 
          '*'
        );
        setIsVideoPlaying(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentContent.youtubeEmbedUrl, isVideoPlaying]);

  const pauseYouTube = () => {
    if (iframeRef.current && currentContent.youtubeEmbedUrl) {
      iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
  };

  (window as any).pauseBannerYouTube = pauseYouTube;

  const navigateLeft = () => {
    setIsVideoPlaying(false);
    setCurrentIndex((prev) => prev > 0 ? prev - 1 : bannerContent.length - 1);
  };

  const navigateRight = () => {
    setIsVideoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % bannerContent.length);
  };

  const handlePlayClick = () => {
    if (!iframeRef.current || !currentContent.youtubeEmbedUrl) return;
    iframeRef.current.contentWindow?.postMessage(
      '{"event":"command","func":"playVideo","args":""}', 
      '*'
    );
    setIsVideoPlaying(true);
  };

  const handlePauseClick = () => {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage(
      '{"event":"command","func":"pauseVideo","args":""}', 
      '*'
    );
    setIsVideoPlaying(false);
  };

  const getAdAccentColor = (type: string, priority?: string) => {
    if (type === 'update' && priority === 'high') return 'from-orange-500/10 to-amber-500/10 border-orange-500/20';
    if (type === 'ad') return 'from-violet-500/10 to-purple-500/10 border-violet-500/20';
    if (type === 'content') return 'from-blue-500/10 to-cyan-500/10 border-blue-500/20';
    return 'from-muted/50 to-muted/30 border-border';
  };

  const getAdDot = (type: string, priority?: string) => {
    if (type === 'update' && priority === 'high') return 'bg-orange-500';
    if (type === 'ad') return 'bg-violet-500';
    if (type === 'content') return 'bg-blue-500';
    return 'bg-muted-foreground';
  };

  const videoId = currentContent.youtubeEmbedUrl ? extractYouTubeId(currentContent.youtubeEmbedUrl) : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  return (
    <Card className="w-full h-40 md:h-52 relative overflow-hidden bg-card border border-border">

      {/* Main Content Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentContent.youtubeEmbedUrl ? (
          <div className="relative w-full h-full bg-black">
            {/* Always-mounted iframe (hidden until playing) */}
            <iframe
              ref={iframeRef}
              className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              src={currentContent.youtubeEmbedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="youtube-iframe"
            />

            {/* Thumbnail + centered play button (shown when not playing) */}
            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt="Stream thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                    data-testid="youtube-thumbnail"
                  />
                )}
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Centered play button */}
                <button
                  onClick={handlePlayClick}
                  className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all active:scale-95"
                  data-testid="button-youtube-play"
                >
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </button>

                {/* LIVE badge + stream selector — top right */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                  {currentContent.isLive && (
                    <div className="flex items-center gap-1 bg-red-600/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-[10px] font-semibold tracking-wide">LIVE</span>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
                        data-testid="button-stream-dropdown"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={handleCnbcStream} className="cursor-pointer">
                        <Tv className="w-4 h-4 mr-2" />
                        <span>CNBC-TV18 Live</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsUrlDialogOpen(true)} className="cursor-pointer">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        <span>Custom Stream</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Pause button overlay (shown when playing) */}
            {isVideoPlaying && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                <button
                  onClick={handlePauseClick}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all"
                  data-testid="button-youtube-pause"
                >
                  <Pause className="w-3.5 h-3.5 text-white" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
                      data-testid="button-stream-dropdown-playing"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={handleCnbcStream} className="cursor-pointer">
                      <Tv className="w-4 h-4 mr-2" />
                      <span>CNBC-TV18 Live</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsUrlDialogOpen(true)} className="cursor-pointer">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      <span>Custom Stream</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        ) : (
          /* Non-YouTube slides — minimal ad/update/content cards */
          <div className={`absolute inset-0 bg-gradient-to-br ${getAdAccentColor(currentContent.type, currentContent.priority)} flex flex-col items-center justify-center px-6 text-center`}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${getAdDot(currentContent.type, currentContent.priority)}`} />
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                {currentContent.type === 'live_stream' ? 'Live' : currentContent.type}
              </span>
              {currentContent.date && (
                <span className="text-[11px] text-muted-foreground">· {currentContent.date}</span>
              )}
            </div>
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-1 leading-snug">
              {currentContent.title}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 max-w-xs">
              {currentContent.description}
            </p>
          </div>
        )}
      </div>

      {/* URL Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Live Stream</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="stream-url" className="mb-2 block">YouTube URL</Label>
            <Input
              id="stream-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUrlDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCustomUrlSubmit}>Set Stream</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1.5 pointer-events-none z-20">
        <Button
          size="icon"
          variant="ghost"
          onClick={navigateLeft}
          className="pointer-events-auto h-7 w-7 bg-background/60 backdrop-blur-sm hover:bg-background/80 text-foreground shadow-sm"
          data-testid="button-banner-left"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={navigateRight}
          className="pointer-events-auto h-7 w-7 bg-background/60 backdrop-blur-sm hover:bg-background/80 text-foreground shadow-sm"
          data-testid="button-banner-right"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {bannerContent.map((_, index) => (
          <button
            key={index}
            onClick={() => { setIsVideoPlaying(false); setCurrentIndex(index); }}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'w-5 bg-foreground/70' 
                : 'w-1 bg-foreground/20 hover:bg-foreground/40'
            }`}
            data-testid={`button-indicator-${index}`}
          />
        ))}
      </div>
    </Card>
  );
}
