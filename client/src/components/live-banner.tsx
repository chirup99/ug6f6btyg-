import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Play, 
  Pause,
  ChevronLeft,
  ChevronRight,
  Tv,
  Link as LinkIcon,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Zap
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

interface NewsItem {
  title: string;
  sector: string;
  source?: string;
  publishedAt?: string;
}

interface NiftyPoint {
  price: number;
  time: number;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function SparklineChart({ points, isUp }: { points: NiftyPoint[]; isUp: boolean }) {
  if (points.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full h-px bg-muted-foreground/20" />
      </div>
    );
  }

  const prices = points.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const pad = 6;

  const toX = (i: number) => pad + ((i / (points.length - 1)) * (w - pad * 2));
  const toY = (price: number) => h - pad - ((price - min) / range) * (h - pad * 2);

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.price).toFixed(1)}`).join(' ');
  const fillD = `${d} L ${toX(points.length - 1).toFixed(1)} ${h} L ${toX(0).toFixed(1)} ${h} Z`;

  const color = isUp ? '#22c55e' : '#ef4444';
  const fillColor = isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <path d={fillD} fill={fillColor} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlashNewsBanner({ newsItems }: { newsItems: NewsItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (newsItems.length === 0) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % newsItems.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [newsItems.length]);

  if (newsItems.length === 0) {
    return (
      <div className="flex flex-col gap-1 justify-center h-full px-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-3 bg-muted/40 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 h-full overflow-hidden justify-center">
      {newsItems.slice(activeIndex, activeIndex + 3).concat(
        activeIndex + 3 > newsItems.length ? newsItems.slice(0, (activeIndex + 3) % newsItems.length) : []
      ).map((item, i) => (
        <div key={`${activeIndex}-${i}`} className={`flex items-start gap-1.5 transition-opacity duration-500 ${i === 0 ? 'opacity-100' : 'opacity-60'}`}>
          <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-primary/70" />
          <p className="text-[10px] leading-tight text-foreground/80 line-clamp-2">{item.title}</p>
        </div>
      ))}
    </div>
  );
}

export function LiveBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [youtubeUrl, setYoutubeUrl] = useState<string>(
    'https://www.youtube.com/embed/P857H4ej-MQ?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&pp=ygUJY25iYyBsaXZl'
  );

  // News state
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  // Nifty 50 state
  const [niftyPoints, setNiftyPoints] = useState<NiftyPoint[]>([]);
  const [niftyPrice, setNiftyPrice] = useState<number | null>(null);
  const [niftyChange, setNiftyChange] = useState<number>(0);

  // Carousel auto-rotate (2 slides: youtube + flash news)
  const bannerCount = 2;
  useEffect(() => {
    if (isVideoPlaying) return;
    const t = setInterval(() => setCurrentIndex(p => (p + 1) % bannerCount), 6000);
    return () => clearInterval(t);
  }, [isVideoPlaying]);

  // Fetch market news on mount
  useEffect(() => {
    fetch('/api/general-market-news')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setNewsItems(data.slice(0, 30).map(d => ({
            title: d.title || d.headline || '',
            sector: d.displayName || d.sector || 'Market',
            source: d.source,
            publishedAt: d.publishedAt,
          })).filter(n => n.title));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Nifty 50 price periodically
  const fetchNifty = useCallback(() => {
    fetch('/api/live-quotes/NIFTY50')
      .then(r => r.json())
      .then((data: any) => {
        const price = data?.ltp || data?.lastPrice || data?.price || data?.close;
        if (price && !isNaN(Number(price))) {
          const p = Number(price);
          setNiftyPrice(p);
          setNiftyPoints(prev => {
            const next = [...prev, { price: p, time: Date.now() }].slice(-30);
            if (next.length >= 2) {
              setNiftyChange(((next[next.length - 1].price - next[0].price) / next[0].price) * 100);
            }
            return next;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNifty();
    const t = setInterval(fetchNifty, 15000);
    return () => clearInterval(t);
  }, [fetchNifty]);

  // Scroll pause
  useEffect(() => {
    const handleScroll = () => {
      if (isVideoPlaying && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        setIsVideoPlaying(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVideoPlaying]);

  // Expose pause API
  const pauseYouTube = () => {
    iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  };
  (window as any).pauseBannerYouTube = pauseYouTube;

  const handleCnbcStream = () => updateStreamUrl('https://www.youtube.com/embed/P857H4ej-MQ?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0');

  const handleCustomUrlSubmit = () => {
    if (!customUrl) return;
    let url = customUrl.trim();
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const id = new URL(url).searchParams.get('v');
        if (id) url = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
        if (id) url = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes('youtube.com/live/')) {
        const id = url.split('live/')[1]?.split(/[?#]/)[0];
        if (id) url = `https://www.youtube.com/embed/${id}`;
      }
    } catch {}
    updateStreamUrl(url);
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
    window.dispatchEvent(new CustomEvent('livestream-url-updated', { detail: { url: cleanUrl } }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('youtube_banner_url');
    if (saved) setYoutubeUrl(saved.includes('?') ? `${saved}&modestbranding=1&controls=0&showinfo=0&rel=0` : `${saved}?modestbranding=1&controls=0&showinfo=0&rel=0`);
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const url = e.detail.url;
      if (url) {
        setYoutubeUrl(url.includes('?') ? `${url}&modestbranding=1&controls=0&showinfo=0&rel=0` : `${url}?modestbranding=1&controls=0&showinfo=0&rel=0`);
      } else {
        setYoutubeUrl('https://www.youtube.com/embed/P857H4ej-MQ?enablejsapi=1&modestbranding=1&controls=0&showinfo=0&rel=0&pp=ygUJY25iYyBsaXZl');
      }
      setCurrentIndex(0);
      setIsVideoPlaying(false);
    };
    window.addEventListener('livestream-url-updated', handler as EventListener);
    return () => window.removeEventListener('livestream-url-updated', handler as EventListener);
  }, []);

  const navigate = (dir: 1 | -1) => {
    setIsVideoPlaying(false);
    setCurrentIndex(p => (p + dir + bannerCount) % bannerCount);
  };

  const videoId = extractYouTubeId(youtubeUrl);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  const isUp = niftyChange >= 0;
  const priceFormatted = niftyPrice ? niftyPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
  const changeFormatted = Math.abs(niftyChange).toFixed(2);

  return (
    <Card className="w-full h-40 md:h-52 relative overflow-hidden bg-card border border-border">
      <div className="absolute inset-0">

        {/* === SLIDE 0: YouTube Live Stream === */}
        {currentIndex === 0 && (
          <div className="relative w-full h-full bg-black">
            <iframe
              ref={iframeRef}
              className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              src={youtubeUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="youtube-iframe"
            />

            {/* Thumbnail + play (not playing) */}
            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                {thumbnailUrl && (
                  <img src={thumbnailUrl} alt="Stream thumbnail" className="absolute inset-0 w-full h-full object-cover" data-testid="youtube-thumbnail" />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <button
                  onClick={() => {
                    iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                    setIsVideoPlaying(true);
                  }}
                  className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all active:scale-95"
                  data-testid="button-youtube-play"
                >
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </button>

                {/* LIVE + menu — top right */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                  <div className="flex items-center gap-1 bg-red-600/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-[10px] font-semibold tracking-wide">LIVE</span>
                  </div>
                  <StreamMenu onCnbc={handleCnbcStream} onCustom={() => setIsUrlDialogOpen(true)} />
                </div>
              </div>
            )}

            {/* Pause button (playing) */}
            {isVideoPlaying && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                <button
                  onClick={() => {
                    iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                    setIsVideoPlaying(false);
                  }}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all"
                  data-testid="button-youtube-pause"
                >
                  <Pause className="w-3.5 h-3.5 text-white" />
                </button>
                <StreamMenu onCnbc={handleCnbcStream} onCustom={() => setIsUrlDialogOpen(true)} />
              </div>
            )}
          </div>
        )}

        {/* === SLIDE 1: Nifty 50 + Flash News === */}
        {currentIndex === 1 && (
          <div className="absolute inset-0 flex items-stretch">
            {/* Left: Nifty 50 chart */}
            <div className="flex flex-col justify-between p-3 md:p-4 w-2/5 shrink-0 border-r border-border/40">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nifty 50</span>
                  <Zap className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
                <div className="text-base md:text-xl font-bold text-foreground tabular-nums">{priceFormatted}</div>
                <div className={`flex items-center gap-0.5 text-[11px] font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isUp ? '+' : '-'}{changeFormatted}%</span>
                </div>
              </div>
              {/* Sparkline */}
              <div className="h-12 md:h-16 w-full mt-1">
                <SparklineChart points={niftyPoints} isUp={isUp} />
              </div>
            </div>

            {/* Right: Flash news */}
            <div className="flex-1 flex flex-col justify-between p-3 md:p-4 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Flash News</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <FlashNewsBanner newsItems={newsItems} />
              </div>
            </div>
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
              onChange={e => setCustomUrl(e.target.value)}
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
          onClick={() => navigate(-1)}
          className="pointer-events-auto h-7 w-7 bg-background/60 backdrop-blur-sm hover:bg-background/80 text-foreground shadow-sm"
          data-testid="button-banner-left"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate(1)}
          className="pointer-events-auto h-7 w-7 bg-background/60 backdrop-blur-sm hover:bg-background/80 text-foreground shadow-sm"
          data-testid="button-banner-right"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {Array.from({ length: bannerCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => { setIsVideoPlaying(false); setCurrentIndex(i); }}
            className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-5 bg-foreground/70' : 'w-1 bg-foreground/20 hover:bg-foreground/40'}`}
            data-testid={`button-indicator-${i}`}
          />
        ))}
      </div>
    </Card>
  );
}

function StreamMenu({ onCnbc, onCustom }: { onCnbc: () => void; onCustom: () => void }) {
  return (
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
        <DropdownMenuItem onClick={onCnbc} className="cursor-pointer">
          <Tv className="w-4 h-4 mr-2" />
          <span>CNBC-TV18 Live</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCustom} className="cursor-pointer">
          <LinkIcon className="w-4 h-4 mr-2" />
          <span>Custom Stream</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
