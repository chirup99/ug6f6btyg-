import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DemoHeatmap } from "@/components/DemoHeatmap";
import { Link2, Copy, ExternalLink, X } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ShareReportTradebookDialogProps {
  open: boolean;
  handleShareDialogClose: () => void;
  setShowShareDialog: (open: boolean) => void;
  setShareDialogTagHighlight: (highlight: { tag: string; dates: string[] } | null) => void;
  shareableUrl: string | null;
  isCreatingShareableLink: boolean;
  handleCreateShareableLink: () => void;
  isSharedReportMode: boolean;
  sharedReportData: any;
  currentUser: any;
  getFilteredHeatmapData: () => Record<string, any>;
  setJournalChartMode: (mode: string) => void;
  fetchHeatmapChartData: (symbol: string, date: string) => void;
  toast: (options: { title: string; description?: string; variant?: string }) => void;
}

export function ShareReportTradebookDialog({
  open,
  handleShareDialogClose,
  setShowShareDialog,
  setShareDialogTagHighlight,
  shareableUrl,
  isCreatingShareableLink,
  handleCreateShareableLink,
  isSharedReportMode,
  sharedReportData,
  currentUser,
  getFilteredHeatmapData,
  setJournalChartMode,
  fetchHeatmapChartData,
  toast,
}: ShareReportTradebookDialogProps) {
  const [reportDialogTagHighlight, setReportDialogTagHighlight] = useState<{
    tag: string;
    dates: string[];
  } | null>(null);

  const reportDialogFomoButtonRef = useRef<HTMLButtonElement>(null);
  const reportDialogHeatmapContainerRef = useRef<HTMLDivElement>(null);
  const [reportDialogScrollTrigger, setReportDialogScrollTrigger] = useState(0);

  useEffect(() => {
    if (!reportDialogTagHighlight || reportDialogTagHighlight.tag !== "fomo") return;

    const heatmapWrapper = reportDialogHeatmapContainerRef.current;
    if (!heatmapWrapper) return;

    const scrollableElement = heatmapWrapper.querySelector(".overflow-x-auto");
    if (!scrollableElement) {
      const retryTimeout = setTimeout(() => {
        const element = heatmapWrapper.querySelector(".overflow-x-auto");
        if (element) {
          attachScrollListener(element);
        }
      }, 10);
      return () => clearTimeout(retryTimeout);
    }

    let rafId: number | null = null;

    const handleScroll = () => {
      setReportDialogScrollTrigger((prev) => prev + 1);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        setReportDialogScrollTrigger((prev) => prev + 1);
        rafId = null;
      });
    };

    const attachScrollListener = (element: Element) => {
      element.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll, { passive: true });
      console.log("⚡ Attached scroll listener to report dialog heatmap");
    };

    attachScrollListener(scrollableElement);

    return () => {
      scrollableElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [reportDialogTagHighlight]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleShareDialogClose();
          setShareDialogTagHighlight(null);
          setReportDialogTagHighlight(null);
          console.log("🔄 Share Dialog closed - reset tag highlighting and shareable URL");
        } else {
          setShowShareDialog(isOpen);
        }
      }}
    >
      <DialogContent
        className="w-full sm:max-w-xl max-h-[95dvh] sm:max-h-[88vh] overflow-hidden flex flex-col gap-0 p-0 rounded-lg"
        data-testid="dialog-share-tradebook"
      >
        {/* Compact header */}
        <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            {/* Brand mark */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 bg-white dark:bg-slate-800 shadow-sm">
                <img src="/logo.png" alt="PERALA" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold leading-none">Trading Report</DialogTitle>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {isSharedReportMode && sharedReportData?.reportData?.username
                    ? sharedReportData.reportData.username
                    : currentUser?.displayName || currentUser?.email || currentUser?.userId || "Guest"}
                </p>
              </div>
            </div>

            {/* Right side: share actions + close button side by side */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Share actions */}
              {!isSharedReportMode && (
                <>
                  {!shareableUrl ? (
                    <Button
                      size="icon"
                      onClick={handleCreateShareableLink}
                      disabled={isCreatingShareableLink}
                      className="bg-green-600 hover:bg-green-700 h-7 w-7"
                      data-testid="button-create-shareable-link"
                    >
                      {isCreatingShareableLink ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Link2 className="w-3 h-3" />
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="outline"
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600 h-7 w-7"
                        onClick={() => {
                          navigator.clipboard.writeText(shareableUrl);
                          toast({ title: "Link copied!", description: "Shareable URL copied to clipboard" });
                        }}
                        data-testid="button-copy-shareable-url"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => window.open(shareableUrl, "_blank")}
                        data-testid="button-open-shareable-url"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Close button */}
              <DialogClose asChild>
                <button
                  className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  data-testid="button-close-report-dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto scrollbar-hide px-4 py-3 space-y-3">
          {/* Heatmap Container with ref for curved lines */}
          <div className="relative">
            <div
              ref={reportDialogHeatmapContainerRef}
              className="max-h-52 sm:max-h-72 overflow-auto border border-slate-200 scrollbar-hide dark:border-slate-700 rounded-lg"
            >
              <DemoHeatmap
                tradingDataByDate={
                  isSharedReportMode && sharedReportData?.reportData?.tradingDataByDate
                    ? sharedReportData.reportData.tradingDataByDate
                    : getFilteredHeatmapData()
                }
                onDateSelect={() => {}}
                selectedDate={null}
                onDataUpdate={() => {}}
                isPublicView={true}
                onSelectDateForHeatmap={(symbol, date) => {
                  console.log(`📊 [REPORT] Switching to heatmap mode - Symbol: ${symbol}, Date: ${date}`);
                  setJournalChartMode("heatmap");
                  fetchHeatmapChartData(symbol, date);
                }}
              />
            </div>

            {/* Curved Lines Overlay for FOMO button */}
            {reportDialogTagHighlight?.tag === "fomo" &&
              reportDialogTagHighlight.dates.length > 0 &&
              (() => {
                void reportDialogScrollTrigger;

                const paths: JSX.Element[] = [];

                if (!reportDialogFomoButtonRef.current || !reportDialogHeatmapContainerRef.current) {
                  return null;
                }

                const scrollWidth = reportDialogHeatmapContainerRef.current.scrollWidth || 0;
                const scrollHeight = reportDialogHeatmapContainerRef.current.scrollHeight || 0;
                const scrollLeft = reportDialogHeatmapContainerRef.current.scrollLeft || 0;
                const scrollTop = reportDialogHeatmapContainerRef.current.scrollTop || 0;

                const containerRect = reportDialogHeatmapContainerRef.current.getBoundingClientRect();
                const buttonRect = reportDialogFomoButtonRef.current.getBoundingClientRect();

                const buttonCenterX = buttonRect.left - containerRect.left + scrollLeft + buttonRect.width / 2;
                const buttonCenterY = buttonRect.top - containerRect.top + scrollTop + buttonRect.height / 2;

                reportDialogTagHighlight.dates.forEach((date, index) => {
                  const cellElement = reportDialogHeatmapContainerRef.current?.querySelector(
                    `[data-date="${date}"]`
                  );

                  if (cellElement) {
                    const cellRect = cellElement.getBoundingClientRect();

                    const cellCenterX = cellRect.left - containerRect.left + scrollLeft + cellRect.width / 2;
                    const cellCenterY = cellRect.top - containerRect.top + scrollTop + cellRect.height / 2;

                    const controlX = (buttonCenterX + cellCenterX) / 2;
                    const controlY = Math.min(buttonCenterY, cellCenterY) - 50;

                    const pathD = `M ${buttonCenterX} ${buttonCenterY} Q ${controlX} ${controlY}, ${cellCenterX} ${cellCenterY}`;

                    paths.push(
                      <g key={`connection-${date}-${index}`}>
                        {/* Bright colored line with dashed pattern */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="url(#reportDialogCurvedLineGradient)"
                          strokeWidth="2.5"
                          strokeDasharray="6,4"
                          opacity="0.95"
                        />
                        {/* Glowing dot at the end of each line */}
                        <circle cx={cellCenterX} cy={cellCenterY} r="4" fill="#fcd34d" opacity="0.9" />
                        <circle cx={cellCenterX} cy={cellCenterY} r="3" fill="#fbbf24" className="animate-pulse" />
                      </g>
                    );
                  }
                });

                return (
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: `${scrollWidth}px`,
                      height: `${scrollHeight}px`,
                      pointerEvents: "none",
                      zIndex: 10,
                    }}
                  >
                    {/* Define bright gradient for the curved lines */}
                    <defs>
                      <linearGradient id="reportDialogCurvedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
                        <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    {paths}
                  </svg>
                );
              })()}
          </div>

          {/* Stats Bar - Purple metrics from journal tab */}
          {(() => {
            const filteredData =
              isSharedReportMode && sharedReportData?.reportData?.tradingDataByDate
                ? sharedReportData.reportData.tradingDataByDate
                : getFilteredHeatmapData();
            const dates = Object.keys(filteredData).sort();

            let totalPnL = 0;
            let totalTrades = 0;
            let winningTrades = 0;
            let currentStreak = 0;
            let maxWinStreak = 0;
            let fomoTrades = 0;
            const trendData: number[] = [];

            dates.forEach((dateKey) => {
              const dayData = filteredData[dateKey];
              const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
              const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];

              if (metrics) {
                const netPnL = metrics.netPnL || 0;
                totalPnL += netPnL;
                totalTrades += metrics.totalTrades || 0;
                winningTrades += metrics.winningTrades || 0;
                trendData.push(netPnL);

                if (netPnL > 0) {
                  currentStreak++;
                  maxWinStreak = Math.max(maxWinStreak, currentStreak);
                } else {
                  currentStreak = 0;
                }

                if (Array.isArray(tags)) {
                  tags.forEach((tag: string) => {
                    if (tag.toLowerCase().includes("fomo")) {
                      fomoTrades++;
                    }
                  });
                }
              }
            });

            const isProfitable = totalPnL >= 0;
            const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

            const createTrendPath = (data: number[]) => {
              if (data.length === 0) return "";
              const max = Math.max(...data, 0);
              const min = Math.min(...data, 0);
              const range = max - min || 1;
              const width = 40;
              const height = 20;

              const points = data
                .map((val, i) => {
                  const x = (i / (data.length - 1 || 1)) * width;
                  const y = height - ((val - min) / range) * height;
                  return `${x},${y}`;
                })
                .join(" L ");

              return `M ${points}`;
            };

            return (
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-md px-2 py-1.5">
                <div className="flex items-center justify-around text-white gap-1">
                  {/* P&L */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-[10px] opacity-80">P&L</div>
                    <div className="text-xs font-bold">
                      {isProfitable ? "+" : ""}₹{(totalPnL / 1000).toFixed(1)}K
                    </div>
                  </div>

                  {/* Trend */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-[10px] opacity-80">Trend</div>
                    <div className="w-8 h-4">
                      <svg viewBox="0 0 40 20" className="w-full h-full">
                        <path
                          d={createTrendPath(trendData)}
                          fill="none"
                          stroke="white"
                          strokeWidth="1.5"
                          opacity="0.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* FOMO - Clickable button with curved lines */}
                  <button
                    ref={reportDialogFomoButtonRef}
                    className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${
                      reportDialogTagHighlight?.tag === "fomo" ? "bg-white/30 ring-2 ring-white/50" : ""
                    }`}
                    onClick={() => {
                      if (reportDialogTagHighlight?.tag === "fomo") {
                        setReportDialogTagHighlight(null);
                        console.log("📍 Deactivated FOMO tag highlighting in report dialog");
                      } else {
                        const fd =
                          isSharedReportMode && sharedReportData?.reportData?.tradingDataByDate
                            ? sharedReportData.reportData.tradingDataByDate
                            : getFilteredHeatmapData();
                        const fdDates = Object.keys(fd).sort();

                        const fomoDates: string[] = [];
                        fdDates.forEach((dateKey) => {
                          const dayData = fd[dateKey];
                          const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];

                          if (Array.isArray(tags)) {
                            tags.forEach((tag: string) => {
                              if (tag.toLowerCase().includes("fomo") && !fomoDates.includes(dateKey)) {
                                fomoDates.push(dateKey);
                              }
                            });
                          }
                        });

                        setReportDialogTagHighlight({ tag: "fomo", dates: fomoDates });
                        console.log(
                          `📍 Activated FOMO tag highlighting in report dialog for ${fomoDates.length} dates:`,
                          fomoDates
                        );
                      }
                    }}
                    title={`Click to ${reportDialogTagHighlight?.tag === "fomo" ? "hide" : "show"} FOMO dates on heatmap`}
                  >
                    <div className="text-[10px] opacity-80">FOMO</div>
                    <div className="text-xs font-bold">{fomoTrades}</div>
                  </button>

                  {/* Win% */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-[10px] opacity-80">Win%</div>
                    <div className="text-xs font-bold">{winRate.toFixed(0)}%</div>
                  </div>

                  {/* Streak */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-[10px] opacity-80">Streak</div>
                    <div className="text-xs font-bold">{maxWinStreak}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Analytics Row: Total P&L, Performance Trend, Top Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(() => {
              const filteredData =
                isSharedReportMode && sharedReportData?.reportData?.tradingDataByDate
                  ? sharedReportData.reportData.tradingDataByDate
                  : getFilteredHeatmapData();
              const dates = Object.keys(filteredData).sort();

              let totalPnL = 0;
              let totalTrades = 0;
              let winningTrades = 0;
              const trendData: number[] = [];
              const lossTagsMap = new Map<string, number>();

              dates.forEach((dateKey) => {
                const dayData = filteredData[dateKey];
                const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
                const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];

                if (metrics) {
                  const netPnL = metrics.netPnL || 0;
                  totalPnL += netPnL;
                  totalTrades += metrics.totalTrades || 0;
                  winningTrades += metrics.winningTrades || 0;
                  trendData.push(netPnL);

                  if (netPnL < 0 && Array.isArray(tags) && tags.length > 0) {
                    tags.forEach((tag: string) => {
                      const normalizedTag = tag.trim().toLowerCase();
                      lossTagsMap.set(normalizedTag, (lossTagsMap.get(normalizedTag) || 0) + Math.abs(netPnL));
                    });
                  }
                }
              });

              const isProfitable = totalPnL >= 0;
              const successRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

              const lossTags = Array.from(lossTagsMap.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([tag, lossAmount]) => ({ tag, lossAmount }));

              const createTrendPath = (data: number[]) => {
                if (data.length === 0) return "";
                const max = Math.max(...data, 0);
                const min = Math.min(...data, 0);
                const range = max - min || 1;
                const width = 100;
                const height = 45;

                if (data.length === 1) {
                  const x = width / 2;
                  const y = height - ((data[0] - min) / range) * height;
                  return `M ${x} ${y}`;
                }

                let path = "";
                const points = data.map((val, i) => {
                  const x = (i / (data.length - 1)) * width;
                  const y = height - ((val - min) / range) * height;
                  return { x, y };
                });

                path += `M ${points[0].x} ${points[0].y}`;

                for (let i = 1; i < points.length; i++) {
                  const current = points[i];
                  const prev = points[i - 1];
                  const cpX = (prev.x + current.x) / 2;
                  const cpY = (prev.y + current.y) / 2;
                  path += ` Q ${cpX} ${cpY}, ${current.x} ${current.y}`;
                }

                return path;
              };

              const strokeColor = isProfitable ? "#16a34a" : "#dc2626";
              const gradientColor = isProfitable ? "rgb(22, 163, 74)" : "rgb(220, 38, 38)";

              return (
                <>
                  {/* Column 1: Total P&L - Minimalistic Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                    <div className="mb-2.5">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">
                        Total P&L
                      </div>
                      <div
                        className={`text-xl font-bold ${
                          isProfitable
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isProfitable ? "+" : ""}₹{(Math.abs(totalPnL) / 1000).toFixed(1)}K
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Trades</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{totalTrades}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Win Rate</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isProfitable ? "bg-emerald-500" : "bg-red-500"
                            }`}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Performance Trend */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">
                      Trend
                    </div>
                    {trendData.length > 0 ? (
                      <div className="h-24 w-full">
                        {(() => {
                          const chartData = trendData.map((pnl, idx) => ({
                            day: `${idx + 1}`,
                            value: pnl,
                          }));

                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
                                <defs>
                                  <linearGradient id="reportTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={gradientColor} stopOpacity={0.35} />
                                    <stop offset="100%" stopColor={gradientColor} stopOpacity={0.03} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={false} hide />
                                <YAxis hide domain={["auto", "auto"]} />
                                <Tooltip
                                  contentStyle={{
                                    background: "var(--background)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    padding: "6px 10px",
                                  }}
                                  formatter={(value: any) => [
                                    `${value >= 0 ? "+₹" : "-₹"}${Math.abs(value).toLocaleString()}`,
                                    "P&L",
                                  ]}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke={strokeColor}
                                  strokeWidth={2}
                                  fill="url(#reportTrendGradient)"
                                  dot={false}
                                  activeDot={{
                                    r: 4,
                                    fill: strokeColor,
                                    stroke: "white",
                                    strokeWidth: 2,
                                  }}
                                  isAnimationActive={true}
                                  animationDuration={600}
                                  animationEasing="ease-in-out"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-gray-400 text-xs">No data</div>
                    )}
                  </div>

                  {/* Column 3: Loss Tags */}
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col min-h-0">
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2 flex-shrink-0">
                      Loss Tags
                    </div>
                    {lossTags.length > 0 ? (
                      <div
                        className="flex-1 overflow-y-auto space-y-1 min-h-0 pr-0.5"
                        style={{ maxHeight: "120px" }}
                      >
                        {lossTags.map(({ tag, lossAmount }) => (
                          <div
                            key={tag}
                            className="flex items-center justify-between px-2 py-0.5 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 rounded"
                            data-testid={`tag-loss-${tag}`}
                          >
                            <span className="text-[10px] font-medium text-red-700 dark:text-red-300 capitalize truncate">
                              {tag}
                            </span>
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 ml-1.5 flex-shrink-0">
                              {"-₹"}
                              {lossAmount >= 100000
                                ? `${(lossAmount / 100000).toFixed(1)}L`
                                : lossAmount >= 1000
                                ? `${(lossAmount / 1000).toFixed(1)}K`
                                : lossAmount.toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 italic py-2">No loss tags</div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Promotional Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800 mt-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">★</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Advanced Trading Journal</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Tracks emotional decisions • Works on all brokers • NSE, Crypto, Commodity, Forex
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
