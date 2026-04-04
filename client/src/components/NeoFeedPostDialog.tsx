import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DemoHeatmap } from "@/components/DemoHeatmap";

interface NeoFeedPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportPostMode: 'today' | 'selected' | 'range' | null;
  setReportPostMode: (mode: 'today' | 'selected' | 'range' | null) => void;
  reportPostDescription: string;
  setReportPostDescription: (desc: string) => void;
  reportPostSelectedDate: string;
  setReportPostSelectedDate: (date: string) => void;
  rangePostOverrideData: Record<string, any> | null;
  setRangePostOverrideData: (data: Record<string, any> | null) => void;
  tradingDataByDate: Record<string, any>;
  getFilteredHeatmapData: () => Record<string, any>;
  currentUser: any;
  isPostingReport: boolean;
  setIsPostingReport: (posting: boolean) => void;
  isDemoMode: boolean;
}

export function NeoFeedPostDialog({
  open,
  onOpenChange,
  reportPostMode,
  setReportPostMode,
  reportPostDescription,
  setReportPostDescription,
  reportPostSelectedDate,
  setReportPostSelectedDate,
  rangePostOverrideData,
  setRangePostOverrideData,
  tradingDataByDate,
  getFilteredHeatmapData,
  currentUser,
  isPostingReport,
  setIsPostingReport,
  isDemoMode,
}: NeoFeedPostDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rangePostTagHighlight, setRangePostTagHighlight] = useState<{ tag: string; dates: string[] } | null>(null);
  const rangePostFomoButtonRef = useRef<HTMLButtonElement>(null);
  const rangePostOvertradingButtonRef = useRef<HTMLButtonElement>(null);
  const rangePostHeatmapContainerRef = useRef<HTMLDivElement>(null);
  const [rangePostScrollTrigger, setRangePostScrollTrigger] = useState(0);

  useEffect(() => {
    if (!rangePostTagHighlight) return;
    const container = rangePostHeatmapContainerRef.current;
    if (!container) return;
    const scrollableElement = container;
    let rafId: number | null = null;
    const handleScroll = () => {
      setRangePostScrollTrigger(prev => prev + 1);
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setRangePostScrollTrigger(prev => prev + 1);
        rafId = null;
      });
    };
    scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [rangePostTagHighlight]);

  const handlePostToNeoFeed = async () => {
    setIsPostingReport(true);
    try {
      let metadata: any = {};
      const content = reportPostDescription.trim() || 'Shared my trading report';

      let postTotalPnL = 0;

      if (reportPostMode === 'today' || reportPostMode === 'selected') {
        const dateKey = reportPostMode === 'today'
          ? new Date().toISOString().split('T')[0]
          : reportPostSelectedDate;
        const dayData = tradingDataByDate[dateKey] || {};
        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
        const tradeHistory: any[] = dayData?.tradeHistory || [];

        let cumulative = 0;
        const chartData = tradeHistory.map((trade: any) => {
          const pnl = typeof trade.pnl === 'number'
            ? trade.pnl
            : parseFloat(String(trade.pnl || '0').replace(/[₹+,]/g, '')) || 0;
          cumulative += pnl;
          return cumulative;
        });

        const totalPnL = metrics?.netPnL ?? dayData?.profitLossAmount ?? 0;
        postTotalPnL = totalPnL;
        const totalTrades = metrics?.totalTrades ?? dayData?.totalTrades ?? tradeHistory.length;
        const winRate = totalTrades > 0 ? ((metrics?.winningTrades || 0) / totalTrades * 100) : 0;

        const dateObj = new Date(dateKey);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        }).toUpperCase();

        metadata = {
          type: 'trade_insight',
          date: dateKey,
          dateLabel: formattedDate,
        };
      } else if (reportPostMode === 'range') {
        const filteredData = rangePostOverrideData || getFilteredHeatmapData();
        const dates = Object.keys(filteredData).sort();
        let totalPnL = 0, totalTrades = 0, winningTrades = 0;
        let fomoCount = 0, currentStreak = 0, maxStreak = 0;
        const trendData: number[] = [];
        const fomoDates: string[] = [];

        const tradingDays: { date: string; pnl: number; isFomo: boolean }[] = [];
        dates.forEach(dateKey => {
          const dayData = filteredData[dateKey];
          const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
          const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
          if (metrics) {
            const netPnL = metrics.netPnL || 0;
            totalPnL += netPnL;
            totalTrades += metrics.totalTrades || 0;
            winningTrades += metrics.winningTrades || 0;
            trendData.push(netPnL);
            if (netPnL > 0) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
            else { currentStreak = 0; }
            let dayFomo = false;
            if (Array.isArray(tags)) {
              tags.forEach((tag: string) => {
                if (tag.toLowerCase().includes('fomo') && !fomoDates.includes(dateKey)) {
                  fomoDates.push(dateKey);
                  fomoCount++;
                  dayFomo = true;
                }
              });
            }
            tradingDays.push({ date: dateKey, pnl: netPnL, isFomo: dayFomo });
          }
        });

        postTotalPnL = totalPnL;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;

        metadata = {
          type: 'range_report',
          fromDate: dates[0] || '',
          toDate: dates[dates.length - 1] || '',
          dateCount: dates.length,
        };
      }

      const username = currentUser?.username || currentUser?.email?.split('@')[0] || 'anonymous';
      const displayName = currentUser?.displayName || currentUser?.username || 'Anonymous User';

      const { getCognitoUser } = await import('@/cognito');
      const user = await getCognitoUser();
      if (!user?.userId) throw new Error('Not authenticated');

      if (metadata.type === 'range_report' || metadata.type === 'trade_insight') {
        metadata.ownerUserId = user.userId;
      }

      const response = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorUsername: username,
          authorDisplayName: displayName,
          stockMentions: [],
          sentiment: postTotalPnL > 0 ? 'bullish' : postTotalPnL < 0 ? 'bearish' : 'neutral',
          tags: ['trading-report'],
          hasImage: false,
          metadata,
          userId: user.userId,
        }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to post');

      toast({ title: 'Posted to NeoFeed!', description: 'Your trading report has been shared.' });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts/news'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts/audio'] });
      onOpenChange(false);
      setReportPostDescription('');
      setReportPostMode(null);
      setReportPostSelectedDate('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to post', variant: 'destructive' });
    } finally {
      setIsPostingReport(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(openVal) => {
        onOpenChange(openVal);
        if (!openVal) {
          setReportPostDescription('');
          setReportPostMode(null);
          setReportPostSelectedDate('');
          setRangePostTagHighlight(null);
          setRangePostOverrideData(null);
        }
      }}
    >
      <DialogContent className={reportPostMode === 'range' ? "w-[calc(100vw-16px)] sm:w-full sm:max-w-sm max-h-[88dvh] overflow-hidden flex flex-col gap-0 p-0 rounded-2xl" : "w-[calc(100vw-16px)] sm:w-full sm:max-w-sm p-0 overflow-hidden flex flex-col max-h-[88dvh] bg-white dark:bg-zinc-950 rounded-2xl"}>
        {reportPostMode === 'range' && (
        <DialogHeader className="flex-shrink-0 px-3 pt-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0 bg-white dark:bg-slate-800 shadow-sm">
              <img src="/logo.png" alt="PERALA" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xs font-semibold leading-none">Trade Book Post</DialogTitle>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {currentUser?.displayName || currentUser?.email || currentUser?.userId || 'Guest'}
              </p>
            </div>
          </div>
        </DialogHeader>
        )}

        <div className={reportPostMode === 'range' ? "flex-1 overflow-auto px-3 py-2 space-y-2" : "flex-1 overflow-auto"}>
          {/* Selected date display for Selected mode - only for range */}
          {reportPostMode === 'selected' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
              <span className="text-sm">🗓️</span>
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                {reportPostSelectedDate
                  ? new Date(reportPostSelectedDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'No date selected on heatmap'}
              </span>
            </div>
          )}

          {/* Trade card preview for Today / Selected */}
          {(reportPostMode === 'today' || reportPostMode === 'selected') && (() => {
            const dateKey = reportPostMode === 'today'
              ? new Date().toISOString().split('T')[0]
              : reportPostSelectedDate;
            if (!dateKey && reportPostMode === 'selected') return null;
            const dayData = tradingDataByDate[dateKey] || {};
            const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
            const tradeHistory: any[] = dayData?.tradeHistory || dayData?.tradingData?.tradeHistory || [];
            let cumulative = 0;
            const chartPoints = tradeHistory.map((t: any) => {
              const p = typeof t.pnl === 'number' ? t.pnl : parseFloat(String(t.pnl || '0').replace(/[₹+,]/g, '')) || 0;
              cumulative += p;
              return cumulative;
            });
            const totalPnL = metrics?.netPnL ?? dayData?.profitLossAmount ?? 0;
            const totalTrades = metrics?.totalTrades ?? dayData?.totalTrades ?? tradeHistory.length;
            const winRate = totalTrades > 0 ? ((metrics?.winningTrades || 0) / totalTrades * 100) : 0;
            const isProfit = totalPnL >= 0;
            const dateObj = dateKey ? new Date(dateKey) : new Date();
            const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

            const maxVal = Math.max(...chartPoints, 0);
            const minVal = Math.min(...chartPoints, 0);
            const range = maxVal - minVal || 1;
            const svgW = 160, svgH = 60;
            const pathD = chartPoints.length > 1
              ? chartPoints.map((v, i) => {
                  const x = (i / (chartPoints.length - 1)) * svgW;
                  const y = svgH - ((v - minVal) / range) * svgH;
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')
              : `M 0 ${svgH / 2} L ${svgW} ${svgH / 2}`;

            const ordDay = (() => {
              const d = dateObj.getDate();
              const sfx = (d >= 11 && d <= 13) ? 'TH' : ['TH','ST','ND','RD','TH'][Math.min(d % 10, 4)];
              return `${dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} ${d}${sfx} ${dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${dateObj.getFullYear()}`;
            })();

            return (
              <div className={reportPostMode === 'range' ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden" : "border-b border-gray-100 dark:border-zinc-800"}>
                <div className="flex h-[160px]">
                  <div className="flex-1 px-3 pt-3 pb-2 flex flex-col">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide mb-2">{ordDay}</div>
                    <div className="flex-1 w-full min-h-0">
                      {chartPoints.length > 0 ? (
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
                          <path d={pathD} fill="none" stroke={isProfit ? '#22c55e' : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No chart data</div>
                      )}
                    </div>
                  </div>
                  <div className="w-px bg-slate-100 dark:bg-slate-700 self-stretch my-3" />
                  <div className="w-[130px] px-4 flex flex-col justify-center space-y-3">
                    <div>
                      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">TOTAL P&L</div>
                      <div className={`text-lg font-bold leading-tight ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{Math.abs(totalPnL).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">TRADES</div>
                      <div className="text-base font-bold text-slate-800 dark:text-slate-100">{totalTrades}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">WIN RATE</div>
                      <div className="text-base font-bold text-slate-800 dark:text-slate-100">{winRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Range Report Preview */}
          {reportPostMode === 'range' && (() => {
            const filteredData = rangePostOverrideData || getFilteredHeatmapData();
            const dates = Object.keys(filteredData).sort();
            let totalPnL = 0, totalTrades = 0, winningTrades = 0;
            let fomoCount = 0, currentStreak = 0, maxStreak = 0, overTradeCount = 0;
            const trendData: number[] = [];

            dates.forEach(dateKey => {
              const dayData = filteredData[dateKey];
              const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
              const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
              if (metrics) {
                const netPnL = metrics.netPnL || 0;
                totalPnL += netPnL;
                totalTrades += metrics.totalTrades || 0;
                winningTrades += metrics.winningTrades || 0;
                trendData.push(netPnL);
                if (netPnL > 0) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
                else { currentStreak = 0; }
                if ((metrics.totalTrades || 0) > 10) overTradeCount++;
                if (Array.isArray(tags)) {
                  tags.forEach((tag: string) => {
                    if (tag.toLowerCase().includes('fomo')) fomoCount++;
                    if (tag.toLowerCase().includes('overtrading')) overTradeCount++;
                  });
                }
              }
            });

            const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;
            const isProfit = totalPnL >= 0;
            const fromLabel = dates[0] ? new Date(dates[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '-';
            const toLabel = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

            const maxTrend = Math.max(...trendData, 0);
            const minTrend = Math.min(...trendData, 0);
            const rangeT = maxTrend - minTrend || 1;
            const svgW = 40, svgH = 20;
            const trendPath = trendData.length > 1
              ? trendData.map((v, i) => {
                  const x = (i / (trendData.length - 1)) * svgW;
                  const y = svgH - ((v - minTrend) / rangeT) * svgH;
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')
              : `M 0 ${svgH / 2} L ${svgW} ${svgH / 2}`;

            const smoothTrendPath = (() => {
              if (trendData.length < 2) return `M 0 ${svgH / 2} L ${svgW} ${svgH / 2}`;
              const pts = trendData.map((v, i) => ({
                x: (i / (trendData.length - 1)) * svgW,
                y: svgH - ((v - minTrend) / rangeT) * svgH,
              }));
              let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
              for (let i = 1; i < pts.length; i++) {
                const prev = pts[i - 1];
                const curr = pts[i];
                const cpx = (curr.x - prev.x) / 2.5;
                const cp1x = (prev.x + cpx).toFixed(1);
                const cp2x = (curr.x - cpx).toFixed(1);
                d += ` C ${cp1x} ${prev.y.toFixed(1)}, ${cp2x} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
              }
              return d;
            })();

            return (
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {dates.length} days · {fromLabel} – {toLabel}
                </div>

                {/* Heatmap Calendar */}
                <div className="relative">
                  <div
                    ref={rangePostHeatmapContainerRef}
                    className="max-h-52 sm:max-h-72 overflow-auto border border-slate-200 scrollbar-hide dark:border-slate-700 rounded-lg"
                  >
                    <DemoHeatmap
                      tradingDataByDate={rangePostOverrideData || getFilteredHeatmapData()}
                      onDateSelect={() => {}}
                      selectedDate={null}
                      onDataUpdate={() => {}}
                      isPublicView={true}
                      disableAutoScroll={true}
                      onSelectDateForHeatmap={() => {}}
                      hideNavigation={true}
                      initialDate={dates.length > 0 ? new Date(dates[dates.length - 1] + 'T12:00:00') : new Date()}
                    />
                  </div>

                  {/* OverTrading Curved Lines Overlay */}
                  {rangePostTagHighlight?.tag === 'overtrading' && rangePostTagHighlight.dates.length > 0 && (() => {
                    void rangePostScrollTrigger;
                    if (!rangePostOvertradingButtonRef.current || !rangePostHeatmapContainerRef.current) return null;
                    const scrollableEl = rangePostHeatmapContainerRef.current;
                    const scrollWidth = scrollableEl.scrollWidth || 0;
                    const scrollHeight = scrollableEl.scrollHeight || 0;
                    const scrollLeft = scrollableEl.scrollLeft || 0;
                    const scrollTop = scrollableEl.scrollTop || 0;
                    const containerRect = scrollableEl.getBoundingClientRect();
                    const buttonRect = rangePostOvertradingButtonRef.current.getBoundingClientRect();
                    const buttonCenterX = buttonRect.left - containerRect.left + scrollLeft + buttonRect.width / 2;
                    const buttonCenterY = buttonRect.top - containerRect.top + scrollTop + buttonRect.height / 2;
                    const otPaths: JSX.Element[] = [];
                    rangePostTagHighlight.dates.forEach((date, index) => {
                      const cellEl = scrollableEl.querySelector(`[data-date="${date}"]`);
                      if (cellEl) {
                        const cellRect = cellEl.getBoundingClientRect();
                        const cellCenterX = cellRect.left - containerRect.left + scrollLeft + cellRect.width / 2;
                        const cellCenterY = cellRect.top - containerRect.top + scrollTop + cellRect.height / 2;
                        const controlX = (buttonCenterX + cellCenterX) / 2;
                        const controlY = Math.min(buttonCenterY, cellCenterY) - 50;
                        const pathD = `M ${buttonCenterX} ${buttonCenterY} Q ${controlX} ${controlY}, ${cellCenterX} ${cellCenterY}`;
                        otPaths.push(
                          <g key={`ot-${date}-${index}`}>
                            <path d={pathD} fill="none" stroke="url(#otGradient)" strokeWidth="2.5" strokeDasharray="6,4" opacity="0.95" />
                            <circle cx={cellCenterX} cy={cellCenterY} r="4" fill="#fb923c" opacity="0.9" />
                            <circle cx={cellCenterX} cy={cellCenterY} r="3" fill="#f97316" className="animate-pulse" />
                          </g>
                        );
                      }
                    });
                    return (
                      <svg style={{ position: 'absolute', top: 0, left: 0, width: `${scrollWidth}px`, height: `${scrollHeight}px`, pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="otGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="1" />
                            <stop offset="50%" stopColor="#fb923c" stopOpacity="1" />
                            <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                          </linearGradient>
                        </defs>
                        {otPaths}
                      </svg>
                    );
                  })()}

                  {/* FOMO Curved Lines Overlay */}
                  {rangePostTagHighlight?.tag === 'fomo' && rangePostTagHighlight.dates.length > 0 && (() => {
                    void rangePostScrollTrigger;
                    if (!rangePostFomoButtonRef.current || !rangePostHeatmapContainerRef.current) return null;
                    const scrollableEl = rangePostHeatmapContainerRef.current;
                    const scrollWidth = scrollableEl.scrollWidth || 0;
                    const scrollHeight = scrollableEl.scrollHeight || 0;
                    const scrollLeft = scrollableEl.scrollLeft || 0;
                    const scrollTop = scrollableEl.scrollTop || 0;
                    const containerRect = scrollableEl.getBoundingClientRect();
                    const buttonRect = rangePostFomoButtonRef.current.getBoundingClientRect();
                    const buttonCenterX = buttonRect.left - containerRect.left + scrollLeft + buttonRect.width / 2;
                    const buttonCenterY = buttonRect.top - containerRect.top + scrollTop + buttonRect.height / 2;
                    const rpPaths: JSX.Element[] = [];
                    rangePostTagHighlight.dates.forEach((date, index) => {
                      const cellEl = scrollableEl.querySelector(`[data-date="${date}"]`);
                      if (cellEl) {
                        const cellRect = cellEl.getBoundingClientRect();
                        const cellCenterX = cellRect.left - containerRect.left + scrollLeft + cellRect.width / 2;
                        const cellCenterY = cellRect.top - containerRect.top + scrollTop + cellRect.height / 2;
                        const controlX = (buttonCenterX + cellCenterX) / 2;
                        const controlY = Math.min(buttonCenterY, cellCenterY) - 50;
                        const pathD = `M ${buttonCenterX} ${buttonCenterY} Q ${controlX} ${controlY}, ${cellCenterX} ${cellCenterY}`;
                        rpPaths.push(
                          <g key={`rp-${date}-${index}`}>
                            <path d={pathD} fill="none" stroke="url(#rpGradient)" strokeWidth="2.5" strokeDasharray="6,4" opacity="0.95" />
                            <circle cx={cellCenterX} cy={cellCenterY} r="4" fill="#fcd34d" opacity="0.9" />
                            <circle cx={cellCenterX} cy={cellCenterY} r="3" fill="#fbbf24" className="animate-pulse" />
                          </g>
                        );
                      }
                    });
                    return (
                      <svg style={{ position: 'absolute', top: 0, left: 0, width: `${scrollWidth}px`, height: `${scrollHeight}px`, pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="rpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
                            <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
                            <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                          </linearGradient>
                        </defs>
                        {rpPaths}
                      </svg>
                    );
                  })()}
                </div>

                {/* Stats Bar */}
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg px-2 py-1">
                  <div className="flex items-center justify-around text-white">
                    <div className="flex flex-col items-center gap-0 px-0.5">
                      <div className="text-[7px] font-medium opacity-75 uppercase tracking-wide">P&L</div>
                      <div className="text-[10px] font-bold leading-none">{isProfit ? '+' : ''}₹{(totalPnL / 1000).toFixed(1)}K</div>
                    </div>
                    <div className="w-px h-5 bg-white/20" />
                    <div className="flex flex-col items-center gap-0 px-0.5">
                      <div className="text-[7px] font-medium opacity-75 uppercase tracking-wide">Trend</div>
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-7 h-3">
                        <path d={smoothTrendPath} fill="none" stroke="white" strokeWidth="1.8" opacity="0.95" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="w-px h-5 bg-white/20" />
                    <button
                      ref={rangePostFomoButtonRef}
                      className={`flex flex-col items-center gap-0 px-0.5 transition-opacity ${rangePostTagHighlight?.tag === 'fomo' ? 'opacity-100' : 'opacity-75 hover:opacity-100'}`}
                      onClick={() => {
                        if (rangePostTagHighlight?.tag === 'fomo') {
                          setRangePostTagHighlight(null);
                        } else {
                          const fd = rangePostOverrideData || getFilteredHeatmapData();
                          const fomoDates: string[] = [];
                          Object.keys(fd).sort().forEach(dateKey => {
                            const dayData = fd[dateKey];
                            const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
                            if (Array.isArray(tags)) {
                              tags.forEach((tag: string) => {
                                if (tag.toLowerCase().includes('fomo') && !fomoDates.includes(dateKey)) {
                                  fomoDates.push(dateKey);
                                }
                              });
                            }
                          });
                          setRangePostTagHighlight({ tag: 'fomo', dates: fomoDates });
                        }
                      }}
                      title={`Click to ${rangePostTagHighlight?.tag === 'fomo' ? 'hide' : 'show'} FOMO dates on calendar`}
                    >
                      <div className="text-[7px] font-medium uppercase tracking-wide">{rangePostTagHighlight?.tag === 'fomo' ? '●' : ''}FOMO</div>
                      <div className="text-[10px] font-bold leading-none">{fomoCount}</div>
                    </button>
                    <div className="w-px h-5 bg-white/20" />
                    <div className="flex flex-col items-center gap-0 px-0.5">
                      <div className="text-[7px] font-medium opacity-75 uppercase tracking-wide">Win%</div>
                      <div className="text-[10px] font-bold leading-none">{winRate.toFixed(0)}%</div>
                    </div>
                    <div className="w-px h-5 bg-white/20" />
                    <div className="flex flex-col items-center gap-0 px-0.5">
                      <div className="text-[7px] font-medium opacity-75 uppercase tracking-wide">Streak</div>
                      <div className="text-[10px] font-bold leading-none">{maxStreak}</div>
                    </div>
                    <div className="w-px h-5 bg-white/20" />
                    <button
                      ref={rangePostOvertradingButtonRef}
                      className={`flex flex-col items-center gap-0 px-0.5 transition-opacity ${rangePostTagHighlight?.tag === 'overtrading' ? 'opacity-100' : 'opacity-75 hover:opacity-100'}`}
                      onClick={() => {
                        if (rangePostTagHighlight?.tag === 'overtrading') {
                          setRangePostTagHighlight(null);
                        } else {
                          const fd = rangePostOverrideData || getFilteredHeatmapData();
                          const otDates: string[] = [];
                          Object.keys(fd).sort().forEach(dateKey => {
                            const dayData = fd[dateKey];
                            const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
                            const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
                            const hasTag = Array.isArray(tags) && tags.some((t: string) => t.toLowerCase().includes('overtrading'));
                            const hasHighVolume = (metrics?.totalTrades || 0) > 10;
                            if ((hasTag || hasHighVolume) && !otDates.includes(dateKey)) {
                              otDates.push(dateKey);
                            }
                          });
                          setRangePostTagHighlight({ tag: 'overtrading', dates: otDates });
                        }
                      }}
                      title={`Click to ${rangePostTagHighlight?.tag === 'overtrading' ? 'hide' : 'show'} overtrading dates on calendar`}
                    >
                      <div className="text-[7px] font-medium uppercase tracking-wide">{rangePostTagHighlight?.tag === 'overtrading' ? '●' : ''}OvTrd</div>
                      <div className="text-[10px] font-bold leading-none">{overTradeCount}</div>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Description textarea - only for range mode */}
          {reportPostMode === 'range' && (
            <textarea
              value={reportPostDescription}
              onChange={(e) => setReportPostDescription(e.target.value)}
              placeholder="Describe your trades — what worked, what didn't, your key takeaways..."
              rows={4}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
              data-testid="textarea-post-description"
            />
          )}
        </div>

        {/* Plain textarea for selected/today - DemoHeatmap style */}
        {(reportPostMode === 'today' || reportPostMode === 'selected') && (
          <div className="px-4 py-3 flex flex-col min-h-[100px]">
            <textarea
              value={reportPostDescription}
              onChange={(e) => setReportPostDescription(e.target.value)}
              placeholder="Describe your trades — what worked, what didn't, your key takeaways..."
              rows={5}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-gray-600 dark:text-zinc-400 resize-none placeholder:text-gray-400 leading-relaxed"
              data-testid="textarea-post-description"
            />
          </div>
        )}

        {/* Footer with POST button */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={currentUser?.profilePicUrl ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold text-[9px]">
                {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium text-gray-700 dark:text-zinc-300 leading-none truncate">
                {currentUser?.displayName || currentUser?.email || 'Guest'}
              </span>
              <span className="text-[9px] text-gray-400 dark:text-zinc-500 leading-none mt-0.5">Posts to Social Feed</span>
            </div>
          </div>
          <Button
            onClick={handlePostToNeoFeed}
            disabled={isPostingReport || isDemoMode || (reportPostMode === 'selected' && !reportPostSelectedDate)}
            className="h-7 px-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold shadow-sm flex items-center gap-1 flex-shrink-0"
            data-testid="button-submit-post"
          >
            {isPostingReport ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            <span>{isPostingReport ? 'Posting...' : 'POST'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
