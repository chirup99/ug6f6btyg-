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
  ExternalLink,
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
  url?: string;
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

  // Nifty 50 news + stock prices
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsStockPrices, setNewsStockPrices] = useState<{ [symbol: string]: StockPrice }>({});
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [newsLoading, setNewsLoading] = useState(false);

  // Top Nifty 50 stocks to pull news from (same list as home.tsx)
  const BANNER_NIFTY50 = [
    { symbol: 'RELIANCE',   name: 'Reliance' },
    { symbol: 'HDFCBANK',   name: 'HDFC Bank' },
    { symbol: 'ICICIBANK',  name: 'ICICI Bank' },
    { symbol: 'INFY',       name: 'Infosys' },
    { symbol: 'TCS',        name: 'TCS' },
    { symbol: 'SBIN',       name: 'SBI' },
    { symbol: 'BHARTIARTL', name: 'Airtel' },
    { symbol: 'LT',         name: 'L&T' },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
    { symbol: 'HCLTECH',    name: 'HCL Tech' },
  ];

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

  // Fetch real Nifty 50 news — same approach as home.tsx fetchNifty50News
  const fetchNifty50BannerNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const allNews: NewsItem[] = [];
      const seenUrls = new Set<string>();

      await Promise.all(
        BANNER_NIFTY50.map(async (stock) => {
          try {
            const res = await fetch(`/api/stock-news/${stock.symbol}`);
            if (!res.ok) return;
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.news || []);
            items.forEach((item: any) => {
              if (!item.url || seenUrls.has(item.url)) return;
              if (!item.title) return;
              const published = new Date(item.publishedAt || item.date || 0);
              if (published < oneWeekAgo) return;
              seenUrls.add(item.url);
              allNews.push({
                title: item.title,
                url: item.url,
                sector: stock.name,
                source: item.source || stock.name,
                publishedAt: item.publishedAt || item.date || new Date().toISOString(),
                symbol: stock.symbol,
                displayName: stock.name,
              });
            });
          } catch {}
        })
      );

      // Sort latest first
      allNews.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
      const top = allNews.slice(0, 20);
      setNewsItems(top);

      // Fetch live stock prices for symbols shown
      const symbols = [...new Set(top.map(i => i.symbol).filter(Boolean))] as string[];
      if (symbols.length > 0) {
        fetch(`/api/news-stock-prices?symbols=${symbols.slice(0, 10).join(',')}`)
          .then(r => r.json())
          .then((priceData: any) => {
            if (priceData && typeof priceData === 'object') setNewsStockPrices(priceData);
          })
          .catch(() => {});
      }
    } catch {}
    finally { setNewsLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNifty50BannerNews();
  }, [fetchNifty50BannerNews]);

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

  // Relative time helper — same logic as home.tsx getWatchlistNewsRelativeTime
  const getRelativeTime = (publishedAt?: string) => {
    if (!publishedAt) return '';
    const diffMs = Date.now() - new Date(publishedAt).getTime();
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMs / 3600000);
    const d = Math.floor(diffMs / 86400000);
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };

  // Single active news item (rotates one at a time)
  const activeNewsItem = newsItems.length > 0
    ? newsItems[activeNewsIndex % newsItems.length]
    : null;
  const visibleNews = activeNewsItem ? [activeNewsItem] : [];

  return (
    <Card className="w-full h-36 md:h-40 relative overflow-hidden bg-card border border-border">
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

        {/* === SLIDE 1: Nifty 50 chart + Live News === */}
        {currentIndex === 1 && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-violet-950/80 to-purple-950 flex items-stretch px-2 py-2 gap-2">

            {/* Left: Nifty 50 chart — hidden on mobile to give news full width */}
            <div className="hidden sm:flex flex-col w-[36%] shrink-0 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm px-2.5 py-1.5 relative overflow-hidden">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-violet-500/20 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-1.5 mb-0.5 relative z-10">
                <span className="text-[9px] font-bold text-violet-300 uppercase tracking-widest px-1.5 py-0.5 bg-violet-500/20 border border-violet-500/30 rounded-md">
                  Nifty 50
                </span>
                <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 font-semibold">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="text-sm font-bold text-white tabular-nums leading-none relative z-10">
                {niftyCurrentPrice > 0 ? `₹${priceFormatted}` : '—'}
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-semibold relative z-10 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span>{isUp ? '+' : ''}{niftyChangePct.toFixed(2)}%</span>
              </div>
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

            {/* Right (full-width on mobile): News panel — home.tsx-style items */}
            <div className="flex-1 min-w-0 flex flex-col rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm px-2 py-1.5 relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

              {/* Header row */}
              <div className="flex items-center gap-1.5 mb-1 relative z-10 shrink-0">
                <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-md leading-none">
                  Nifty 50 News
                </span>
                {newsLoading
                  ? <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                }
              </div>

              {/* Single featured news item */}
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative z-10 justify-center">
                {newsLoading || visibleNews.length === 0 ? (
                  <div className="flex flex-col gap-1.5 px-1">
                    <div className="h-2.5 bg-white/10 rounded animate-pulse w-4/5" />
                    <div className="h-2.5 bg-white/10 rounded animate-pulse w-3/5" />
                    <div className="h-2 bg-white/8 rounded animate-pulse w-2/5 mt-0.5" />
                  </div>
                ) : (() => {
                  const item = visibleNews[0];
                  const stockData = item.symbol ? newsStockPrices[item.symbol] : null;
                  const isItemUp = stockData ? stockData.changePercent >= 0 : null;
                  const pts = stockData?.chartData ?? [];
                  let sparkPath = '';
                  if (pts.length >= 2) {
                    const prices = pts.map((p: any) => p.price);
                    const mn = Math.min(...prices), mx = Math.max(...prices);
                    const rng = mx - mn || 1;
                    const W = 48, H = 16;
                    sparkPath = prices.map((p: number, idx: number) => {
                      const x = (idx / (prices.length - 1)) * W;
                      const y = H - ((p - mn) / rng) * H;
                      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(' ');
                  }
                  return (
                    <div
                      key={activeNewsIndex}
                      className="flex flex-col gap-1 px-1 cursor-pointer group"
                      onClick={() => item.url && window.open(item.url, '_blank', 'noopener,noreferrer')}
                    >
                      {/* Row 1: badge + time */}
                      <div className="flex items-center gap-1.5">
                        {item.displayName && (
                          <span className="shrink-0 text-[8px] font-semibold text-purple-300 px-1 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded leading-none">
                            {item.displayName}
                          </span>
                        )}
                        {item.publishedAt && (
                          <span className="text-[8px] text-slate-500">{getRelativeTime(item.publishedAt)}</span>
                        )}
                      </div>
                      {/* Row 2: full headline — 2 lines allowed */}
                      <p className="text-[10px] leading-snug text-slate-200 font-medium line-clamp-2 group-hover:text-white transition-colors">
                        {item.title}
                        <ExternalLink className="inline w-2 h-2 ml-0.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </p>
                      {/* Row 3: price + change + sparkline */}
                      {stockData && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">
                            {stockData.currency === 'USD'
                              ? `$${stockData.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                              : `₹${stockData.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                          </span>
                          <span className={`text-[9px] font-semibold shrink-0 ${isItemUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isItemUp ? '▲' : '▼'} {Math.abs(stockData.changePercent).toFixed(2)}%
                          </span>
                          {sparkPath && (
                            <svg width="48" height="16" viewBox="0 0 48 16" className="shrink-0">
                              <path d={sparkPath} fill="none" stroke={isItemUp ? '#22c55e' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        )}

        {/* === SLIDE 2: Insurance Awareness — Journal-style with full details === */}
        {currentIndex === 2 && (
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-r from-slate-950 via-emerald-950/60 to-slate-950">
            {/* Glow accents */}
            <div className="absolute -top-6 right-6 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 left-4 w-20 h-20 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            <div className="absolute inset-0 flex items-stretch px-2.5 py-2 gap-2.5">

              {/* Left: Shield icon block */}
              <div className="flex flex-col items-center justify-center w-12 shrink-0 gap-1.5">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-10 h-10 rounded-full bg-emerald-500/15 animate-pulse" />
                  <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/40 to-teal-600/30 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-300" strokeWidth={1.75} style={{ width: '18px', height: '18px' }} />
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                  <Users className="w-3 h-3 text-emerald-400/70" />
                </div>
              </div>

              {/* Center: Message */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/25 rounded-md leading-none">
                    Insurance Awareness
                  </span>
                  <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400 shrink-0" />
                </div>
                <p className="text-[9px] leading-snug text-white/90 font-medium italic line-clamp-4">
                  "One health emergency can wipe out years of savings — insurance is not a choice, it's a shield."
                </p>
              </div>

              {/* Right: CTA */}
              <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
                <a
                  href="https://irdai.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400/50 transition-all active:scale-95 group shadow-sm"
                  data-testid="button-insurance-portal"
                >
                  <span className="text-[9px] font-bold text-emerald-200 group-hover:text-white whitespace-nowrap transition-colors">More Details</span>
                  <span className="text-[7px] text-emerald-500/70 whitespace-nowrap">irdai.gov.in</span>
                </a>
                <span className="text-[8px] font-semibold text-emerald-400/80 whitespace-nowrap px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md leading-none">
                  IRDAI Regulated
                </span>
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
