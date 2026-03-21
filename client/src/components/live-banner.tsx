import { useState, useEffect, useRef, useCallback } from 'react';
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
  ShieldCheck,
  Heart,
  Users,
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
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface NewsItem {
  title: string;
  sector: string;
  source?: string;
  publishedAt?: string;
  symbol?: string;
  displayName?: string;
}

interface ChartPoint {
  price: number;
  time: string;
}

interface StockPrice {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  chartData: ChartPoint[];
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function MiniSparkline({ chartData, isUp }: { chartData: ChartPoint[]; isUp: boolean }) {
  const prices = chartData.map(d => d.price).filter(p => p > 0);
  if (prices.length < 2) return null;
  const mn = Math.min(...prices);
  const mx = Math.max(...prices);
  const rng = mx - mn || 1;
  const W = 48, H = 18;
  const path = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * W;
    const y = H - ((p - mn) / rng) * H;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <path d={path} fill="none" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NiftyAreaChart({ chartData, isUp }: { chartData: ChartPoint[]; isUp: boolean }) {
  const color = isUp ? '#10b981' : '#ef4444';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="bannerNiftyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" hide />
        <YAxis domain={['auto', 'auto']} hide />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 shadow-lg">
                ₹{Number(payload[0].value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#bannerNiftyGrad)"
          dot={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
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

  // Nifty 50 real chart data
  const [niftyChartData, setNiftyChartData] = useState<ChartPoint[]>([]);
  const [niftyLoading, setNiftyLoading] = useState(false);

  // News + stock prices (same as home.tsx)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsStockPrices, setNewsStockPrices] = useState<{ [symbol: string]: StockPrice }>({});
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);

  const bannerCount = 3;

  // Auto-rotate carousel
  useEffect(() => {
    if (isVideoPlaying) return;
    const t = setInterval(() => setCurrentIndex(p => (p + 1) % bannerCount), 7000);
    return () => clearInterval(t);
  }, [isVideoPlaying]);

  // Rotate news every 3.5s
  useEffect(() => {
    if (newsItems.length === 0) return;
    const t = setInterval(() => setActiveNewsIndex(p => (p + 1) % newsItems.length), 3500);
    return () => clearInterval(t);
  }, [newsItems.length]);

  // Fetch Nifty 50 real chart data — same API as home.tsx
  const fetchNiftyChart = useCallback(() => {
    setNiftyLoading(true);
    fetch('/api/stock-chart-data/NSE:NIFTY50-INDEX?timeframe=1D')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setNiftyChartData(data);
        }
      })
      .catch(() => {})
      .finally(() => setNiftyLoading(false));
  }, []);

  useEffect(() => {
    fetchNiftyChart();
    const t = setInterval(fetchNiftyChart, 60000);
    return () => clearInterval(t);
  }, [fetchNiftyChart]);

  // Fetch market news + stock prices — same API as home.tsx
  useEffect(() => {
    fetch('/api/general-market-news')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const items: NewsItem[] = data.slice(0, 20).map(d => ({
            title: d.title || d.headline || '',
            sector: d.displayName || d.sector || 'Market',
            source: d.source || d.displayName || 'News',
            publishedAt: d.publishedAt,
            symbol: d.symbol,
            displayName: d.displayName,
          })).filter(n => n.title);
          setNewsItems(items);
          // Fetch stock prices for symbols — same as home.tsx fetchNewsStockPrices
          const symbols = [...new Set(items.map(i => i.symbol).filter(Boolean))] as string[];
          if (symbols.length > 0) {
            fetch(`/api/news-stock-prices?symbols=${symbols.slice(0, 10).join(',')}`)
              .then(r => r.json())
              .then((priceData: any) => {
                if (priceData && typeof priceData === 'object') {
                  setNewsStockPrices(priceData);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

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

  // Nifty computed values — same pattern as home.tsx
  const niftyCurrentPrice = niftyChartData.length > 0
    ? (niftyChartData[niftyChartData.length - 1]?.price || 0)
    : 0;
  const niftyBaseline = niftyChartData.length > 0
    ? (niftyChartData[0]?.price || 0)
    : 0;
  const niftyChange = niftyCurrentPrice - niftyBaseline;
  const niftyChangePct = niftyBaseline > 0 ? (niftyChange / niftyBaseline) * 100 : 0;
  const isUp = niftyChange >= 0;
  const priceFormatted = niftyCurrentPrice > 0
    ? niftyCurrentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : '—';

  const videoId = extractYouTubeId(youtubeUrl);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  // Visible news items (rotate 2 at a time)
  const visibleNews = newsItems.length > 0
    ? [
        newsItems[activeNewsIndex % newsItems.length],
        newsItems[(activeNewsIndex + 1) % newsItems.length],
      ]
    : [];

  return (
    <Card className="w-full h-28 md:h-32 relative overflow-hidden bg-card border border-border">
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

            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                {thumbnailUrl && (
                  <img src={thumbnailUrl} alt="Stream thumbnail" className="absolute inset-0 w-full h-full object-cover" data-testid="youtube-thumbnail" />
                )}
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  <div className="flex items-center gap-1 bg-red-600/90 backdrop-blur-sm rounded-full px-2 py-0.5 w-fit">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-[10px] font-bold tracking-widest uppercase">Live</span>
                  </div>
                  <span className="text-white/70 text-[9px] font-medium tracking-wide">CNBC-TV18</span>
                </div>
                <button
                  onClick={() => {
                    iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                    setIsVideoPlaying(true);
                  }}
                  className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all active:scale-95"
                  data-testid="button-youtube-play"
                >
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </button>
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  <StreamMenu onCnbc={handleCnbcStream} onCustom={() => setIsUrlDialogOpen(true)} />
                </div>
              </div>
            )}

            {isVideoPlaying && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                <button
                  onClick={() => {
                    iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                    setIsVideoPlaying(false);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all"
                  data-testid="button-youtube-pause"
                >
                  <Pause className="w-3 h-3 text-white" />
                </button>
                <StreamMenu onCnbc={handleCnbcStream} onCustom={() => setIsUrlDialogOpen(true)} />
              </div>
            )}
          </div>
        )}

        {/* === SLIDE 1: Nifty 50 real chart + News — journal-style dark gradient UI === */}
        {currentIndex === 1 && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-violet-950/80 to-purple-950 flex items-stretch px-2 py-2 gap-2">

            {/* Left: Nifty 50 chart panel — journal glass card */}
            <div className="flex flex-col w-[38%] shrink-0 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm px-2.5 py-1.5 relative overflow-hidden">
              {/* subtle glow accent */}
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-violet-500/20 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-0.5 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-violet-300 uppercase tracking-widest px-1.5 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-md">
                    Nifty 50
                  </span>
                  <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 font-semibold">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
              <div className="text-sm font-bold text-white tabular-nums leading-none relative z-10">
                {niftyCurrentPrice > 0 ? `₹${priceFormatted}` : '—'}
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-semibold relative z-10 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span>{isUp ? '+' : ''}{niftyChangePct.toFixed(2)}%</span>
              </div>
              {/* Real area chart */}
              <div className="flex-1 min-h-0 w-full mt-1 relative z-10">
                {niftyLoading || niftyChartData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-full h-px bg-white/20 animate-pulse" />
                  </div>
                ) : (
                  <NiftyAreaChart chartData={niftyChartData} isUp={isUp} />
                )}
              </div>
            </div>

            {/* Right: News panel — journal-style glass card */}
            <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm px-2.5 py-1.5 relative overflow-hidden">
              {/* subtle glow accent */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-1.5 mb-1 relative z-10">
                <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-md">
                  Market News
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden justify-center relative z-10">
                {visibleNews.length === 0 ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="h-3 bg-white/10 rounded animate-pulse" style={{ width: `${55 + i * 15}%` }} />
                    ))}
                  </div>
                ) : (
                  visibleNews.map((item, i) => {
                    const stockData = item.symbol ? newsStockPrices[item.symbol] : null;
                    const isItemUp = stockData ? stockData.changePercent >= 0 : null;
                    return (
                      <div
                        key={`${activeNewsIndex}-${i}`}
                        className={`transition-opacity duration-500 ${i === 0 ? 'opacity-100' : 'opacity-40'} rounded-lg px-1.5 py-1 ${i === 0 ? 'bg-white/8' : ''}`}
                      >
                        {/* Source badge + title */}
                        <div className="flex items-start gap-1 mb-0.5">
                          {item.displayName && (
                            <span className="shrink-0 text-[8px] font-bold text-purple-300 px-1 py-0.5 bg-purple-500/25 border border-purple-500/30 rounded leading-none mt-px">
                              {item.displayName}
                            </span>
                          )}
                          <p className="text-[10px] leading-tight text-slate-200 font-medium line-clamp-1">
                            {item.title}
                          </p>
                        </div>
                        {/* Price + change + sparkline */}
                        {stockData && (
                          <div className="flex items-center gap-1.5 pl-0.5">
                            <span className="text-slate-400 text-[10px] font-mono">
                              {stockData.currency === 'USD'
                                ? `$${stockData.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                                : `₹${stockData.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                            </span>
                            <span className={`text-[10px] font-semibold ${isItemUp ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isItemUp ? '▲' : '▼'} {Math.abs(stockData.changePercent).toFixed(2)}%
                            </span>
                            {stockData.chartData?.length >= 2 && (
                              <MiniSparkline chartData={stockData.chartData} isUp={!!isItemUp} />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* === SLIDE 2: Term Insurance Emotional Promotion === */}
        {currentIndex === 2 && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 flex items-stretch px-3 py-2 gap-3 overflow-hidden">
            {/* Background decorative rings */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border border-blue-400/10 pointer-events-none" />
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full border border-blue-400/15 pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

            {/* Left: Shield Icon Block */}
            <div className="flex flex-col items-center justify-center w-16 shrink-0 gap-1.5">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full bg-blue-500/20 animate-pulse" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                <Users className="w-3 h-3 text-blue-300" />
              </div>
            </div>

            {/* Center: Emotional message */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[8px] font-bold text-blue-300 uppercase tracking-widest px-1.5 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded-md">
                  Insurance Awareness
                </span>
                <span className="flex items-center gap-0.5 text-[8px] text-rose-300 font-semibold">
                  <Heart className="w-2 h-2 fill-rose-400 text-rose-400" />
                  Protect Your Family
                </span>
              </div>
              <p className="text-[10px] leading-snug text-slate-200 font-medium italic line-clamp-2">
                "Term insurance is the promise that even if you're not there tomorrow, your love will still take care of your family."
              </p>
              <p className="text-[9px] leading-tight text-slate-400 mt-0.5">
                Secure your family's future today — because love means planning ahead.
              </p>
            </div>

            {/* Right: CTA — Government portal */}
            <div className="flex flex-col items-center justify-center gap-1 shrink-0">
              <a
                href="https://www.irdai.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:from-blue-400 hover:to-indigo-500 transition-all active:scale-95"
                data-testid="button-insurance-portal"
              >
                <span className="text-[9px] font-bold text-white whitespace-nowrap">More Details</span>
                <span className="text-[7px] text-blue-200 whitespace-nowrap">irdai.gov.in</span>
              </a>
              <span className="text-[7px] text-slate-500 text-center leading-tight">Govt. of India<br />Official Portal</span>
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
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1 pointer-events-none z-20">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate(-1)}
          className="pointer-events-auto h-6 w-6 bg-background/60 backdrop-blur-sm hover:bg-background/80 text-foreground shadow-sm"
          data-testid="button-banner-left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate(1)}
          className="pointer-events-auto h-6 w-6 bg-background/60 backdrop-blur-sm hover:bg-background/80 text-foreground shadow-sm"
          data-testid="button-banner-right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {Array.from({ length: bannerCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => { setIsVideoPlaying(false); setCurrentIndex(i); }}
            className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-foreground/60' : 'w-1 bg-foreground/20 hover:bg-foreground/40'}`}
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
          className="h-6 w-6 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white"
          data-testid="button-stream-dropdown"
        >
          <MoreVertical className="w-3 h-3" />
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
