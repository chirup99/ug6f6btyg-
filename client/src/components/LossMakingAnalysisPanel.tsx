import {
  AlertTriangle,
  TrendingDown,
  Lightbulb,
  Timer,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface LossMakingAnalysisPanelProps {
  filteredHeatmapData: Record<string, any>;
  tradeHistoryData: any[];
  theme: string;
  formatDuration: (durationMs: number) => string;
}

export default function LossMakingAnalysisPanel({
  filteredHeatmapData,
  tradeHistoryData,
  theme,
  formatDuration,
}: LossMakingAnalysisPanelProps) {
  return (
    <>
                        {/* Full Width Loss Making Analysis - Extended Like Discipline Window */}
                        <div className="col-span-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-8 text-white shadow-2xl mt-6">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                              <TrendingDown className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">
                                Loss Making Analysis
                              </h3>
                              <p className="opacity-80">
                                Identify and fix problematic patterns
                              </p>
                            </div>
                          </div>

                          {(() => {
                            const allData = Object.values(
                              filteredHeatmapData
                            ).filter(
                              (data: any) =>
                                data &&
                                data.tradingTags &&
                                Array.isArray(data.tradingTags) &&
                                data.performanceMetrics
                            );

                            if (allData.length === 0) {
                              return (
                                <div className="bg-white/10 rounded-2xl p-6 text-center">
                                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8" />
                                  </div>
                                  <p className="text-lg font-medium mb-2">
                                    No Data Available
                                  </p>
                                  <p className="opacity-80">
                                    Start trading and tagging to identify loss
                                    patterns!
                                  </p>
                                </div>
                              );
                            }

                            // Analyze loss-making patterns
                            const tagLossAnalysis: any = {};
                            const riskMetrics: any = {
                              consecutiveLosses: 0,
                              maxConsecutiveLosses: 0,
                              emotionalTradingDays: 0,
                              impulsiveTrades: 0,
                              totalLossingDays: 0,
                            };

                            // New metrics for deeper analysis
                            const analysisInsights: any[] = [];
                            let last7DaysTrades = 0;
                            let last7DaysPnL = 0;
                            let last7DaysDrawdown = 0;
                            let fridayTrades = 0;
                            let fridayPnL = 0;
                            let consecutiveLossDays = 0;
                            let maxConsecutiveLossDays = 0;
                            
                            // Track max/min loss % and durations
                            let maxLossPercent = 0;
                            let minLossPercent = 0; // "minimum" loss is actually the smallest loss (closest to 0)
                            let maxLossDuration = "-";
                            let minLossDuration = "-";
                            let totalProfitDurationMs = 0;
                            let totalLossDurationMs = 0;
                            let profitTradeCount = 0;
                            let lossTradeCount = 0;

                            // Helper to parse duration "1h 20m" to ms
                            const durationToMs = (duration: string) => {
                              if (!duration || duration === "-") return 0;
                              const hMatch = duration.match(/(\d+)h/);
                              const mMatch = duration.match(/(\d+)m/);
                              const sMatch = duration.match(/(\d+)s/);
                              return (parseInt(hMatch?.[1] || "0") * 3600 + parseInt(mMatch?.[1] || "0") * 60 + parseInt(sMatch?.[1] || "0")) * 1000;
                            };

                            const sortedDates = Object.keys(filteredHeatmapData).sort();
                            const last7Dates = sortedDates.slice(-7);
                            
                            allData.forEach((data: any) => {
                              const pnl = data.performanceMetrics.netPnL;
                              const trades = data.performanceMetrics.totalTrades;
                              const date = data.date; // assuming date is available

                              // Analyze last 7 days
                              if (last7Dates.includes(date)) {
                                last7DaysTrades += trades;
                                last7DaysPnL += pnl;
                                if (pnl < 0) last7DaysDrawdown += Math.abs(pnl);
                              }

                              // Friday analysis
                              if (date) {
                                const d = new Date(date);
                                if (d.getDay() === 5) {
                                  fridayTrades += trades;
                                  fridayPnL += pnl;
                                }
                              }

                              // Consecutive loss days
                              if (pnl < 0) {
                                consecutiveLossDays++;
                                maxConsecutiveLossDays = Math.max(maxConsecutiveLossDays, consecutiveLossDays);
                              } else if (pnl > 0) {
                                consecutiveLossDays = 0;
                              }

                              // Max/Min loss % and durations from individual trades if available
                              // Since data here is daily summary, we look at the daily performanceMetrics
                              // But the request asks for trade-level max/min loss %
                              // We'll use the daily summary as a proxy or assume tradeHistoryData is used elsewhere
                              // For this specific view, we'll calculate based on the available trades in tradeHistoryData filtered for this day
                            });

                            // Calculate trade-level metrics from global tradeHistoryData
                            tradeHistoryData.forEach(trade => {
                              const pnlStr = (trade.pnl || "").replace(/[₹,+\s]/g, "");
                              const pnlValue = parseFloat(pnlStr) || 0;
                              const price = parseFloat(trade.price) || 0;
                              const qty = parseInt(trade.qty) || 0;
                              const margin = price * qty;
                              const durationMs = durationToMs(trade.duration);

                              if (pnlValue > 0) {
                                totalProfitDurationMs += durationMs;
                                profitTradeCount++;
                              } else if (pnlValue < 0) {
                                totalLossDurationMs += durationMs;
                                lossTradeCount++;
                                const lossPercent = Math.abs((pnlValue / margin) * 100);
                                if (lossPercent > maxLossPercent) {
                                  maxLossPercent = lossPercent;
                                  maxLossDuration = trade.duration || "-";
                                }
                                if (minLossPercent === 0 || lossPercent < minLossPercent) {
                                  minLossPercent = lossPercent;
                                  minLossDuration = trade.duration || "-";
                                }
                              }
                            });

                            const avgProfitDuration = profitTradeCount > 0 ? formatDuration(totalProfitDurationMs / profitTradeCount) : "-";
                            const avgLossDuration = lossTradeCount > 0 ? formatDuration(totalLossDurationMs / lossTradeCount) : "-";

                            // Generate actionable insights
                            if (last7DaysTrades > 10 && last7DaysPnL > 0) {
                              analysisInsights.push({
                                title: "Good Week!",
                                message: `You made ${last7DaysTrades} trades with ₹${last7DaysPnL.toLocaleString()} profit. Quality over quantity is working.`,
                                type: "success"
                              });
                            } else if (last7DaysTrades > 15) {
                                analysisInsights.push({
                                title: "Overtrading Warning",
                                message: `You made ${last7DaysTrades} trades this week. High frequency often leads to low quality setups.`,
                                type: "warning"
                              });
                            }

                            if (last7DaysTrades > 0 && last7DaysPnL > 0 && (last7DaysPnL / last7DaysDrawdown) > 2) {
                                analysisInsights.push({
                                title: "Low Drawdown Hero",
                                message: "Excellent risk management this week! Your profit is significantly higher than your drawdown.",
                                type: "success"
                              });
                            }

                            if (fridayPnL < 0 && fridayTrades > 0) {
                              analysisInsights.push({
                                title: "Friday Flaw",
                                message: "You tend to lose on Fridays. Consider avoiding trading or reducing size on Fridays.",
                                type: "warning"
                              });
                            }
                            
                            if (maxConsecutiveLossDays >= 4) {
                              analysisInsights.push({
                                title: "Take a Break!",
                                message: `You've had ${maxConsecutiveLossDays} consecutive losing days. Take a 2-day rest to reset your mind and analyze if it's a bad market condition.`,
                                type: "danger"
                              });
                            }

                            if (lossTradeCount > 0 && (totalLossDurationMs / lossTradeCount) > (totalProfitDurationMs / Math.max(1, profitTradeCount))) {
                                analysisInsights.push({
                                title: "Holding Losers",
                                message: "Your average loss duration is higher than profit duration. Cut losses faster!",
                                type: "danger"
                              });
                            }

                            allData.forEach((data: any) => {
                              const rawTags = data.tradingTags || [];
                              const pnl = data.performanceMetrics.netPnL;
                              const trades =
                                data.performanceMetrics.totalTrades;

                              if (pnl < 0) {
                                riskMetrics.totalLossingDays++;

                                // ✅ Improved: Check for emotional trading patterns with array validation
                                if (Array.isArray(rawTags) && rawTags.length > 0) {
                                  const emotionalTags = [
                                    "fomo",
                                    "fear",
                                    "greedy",
                                    "revenge",
                                    "impatient",
                                  ];
                                  const hasEmotionalTag = rawTags.some((tag: string) =>
                                    emotionalTags.includes(tag.toLowerCase().trim())
                                  );

                                  if (hasEmotionalTag) {
                                    riskMetrics.emotionalTradingDays++;
                                    console.log(`🚨 Loss Analysis: Emotional trading detected with tags: [${rawTags.join(', ')}] | P&L: ₹${pnl.toFixed(2)}`);
                                  }
                                }

                                // Check for impulsive trading (high number of trades with losses)
                                if (trades > 5 && pnl < 0) {
                                  riskMetrics.impulsiveTrades += trades;
                                }
                              }

                              // ✅ Improved: Normalize tags to lowercase for consistent counting
                              if (Array.isArray(rawTags) && rawTags.length > 0) {
                                rawTags.forEach((rawTag: string) => {
                                  // Normalize tag: trim and lowercase for dictionary key
                                  const normalizedTag = rawTag.trim().toLowerCase();

                                  if (!tagLossAnalysis[normalizedTag]) {
                                    tagLossAnalysis[normalizedTag] = {
                                      tag: normalizedTag,
                                      displayTag: rawTag, // Keep original for display
                                      totalPnL: 0,
                                      lossDays: 0,
                                      totalDays: 0,
                                      avgLoss: 0,
                                      lossFrequency: 0,
                                    };
                                  }

                                  const analysis = tagLossAnalysis[normalizedTag];
                                  analysis.totalPnL += pnl;
                                  analysis.totalDays++;

                                  if (pnl < 0) {
                                    analysis.lossDays++;
                                    console.log(`📊 Tag '${normalizedTag}': Loss day detected | P&L: ₹${pnl.toFixed(2)} | Total losses: ${analysis.lossDays}/${analysis.totalDays} days`);
                                  }
                                });
                              }
                            });

                            // Calculate loss metrics
                            Object.values(tagLossAnalysis).forEach(
                              (analysis: any) => {
                                analysis.lossFrequency =
                                  (analysis.lossDays / analysis.totalDays) *
                                  100;
                                analysis.avgLoss =
                                  analysis.totalPnL / analysis.totalDays;
                              }
                            );

                            // Get worst performing tags
                            const worstTags = Object.values(tagLossAnalysis)
                              .filter((tag: any) => tag.totalPnL < 0)
                              .sort((a: any, b: any) => a.totalPnL - b.totalPnL)
                              .slice(0, 4);

                            return (
                              <div className="space-y-6">
                                {/* Risk Metrics Summary */}
                                <div className="grid md:grid-cols-4 gap-4">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">
                                      {riskMetrics.totalLossingDays}
                                    </div>
                                    <div className="text-sm opacity-80">
                                      Losing Days
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">
                                      {riskMetrics.emotionalTradingDays}
                                    </div>
                                    <div className="text-sm opacity-80">
                                      Emotional Trading Days
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">
                                      {riskMetrics.impulsiveTrades}
                                    </div>
                                    <div className="text-sm opacity-80">
                                      Impulsive Trades
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">
                                      {allData.length > 0
                                        ? (
                                            (riskMetrics.totalLossingDays /
                                              allData.length) *
                                            100
                                          ).toFixed(0)
                                        : 0}
                                      %
                                    </div>
                                    <div className="text-sm opacity-80">
                                      Loss Rate
                                    </div>
                                  </div>
                                </div>

                                {/* Actionable Insights & Recommendations */}
                                <div className="space-y-4">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-400" />
                                    Smart Trading Recommendations
                                  </h4>
                                  <div className="grid md:grid-cols-3 gap-3">
                                    {/* Core Actionable Insights */}
                                    {analysisInsights.map((insight: any, i: number) => (
                                      <div key={i} className={`p-4 rounded-xl border flex gap-3 items-start ${
                                        insight.type === 'danger' ? 'bg-red-500/10 border-red-500/30' :
                                        insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                                        'bg-green-500/10 border-green-500/30'
                                      }`}>
                                        <div className="text-xl">{insight.type === 'danger' ? '🛑' : insight.type === 'warning' ? '⚠️' : '✅'}</div>
                                        <div>
                                          <p className="font-bold text-sm">{insight.title}</p>
                                          <p className="text-xs opacity-80 leading-relaxed">{insight.message}</p>
                                        </div>
                                      </div>
                                    ))}

                                    {/* Default Psychology & Habit Cards */}
                                    <div className="p-4 rounded-xl border bg-indigo-500/10 border-indigo-500/30 flex gap-3 items-start">
                                      <div className="text-xl">🧘</div>
                                      <div>
                                        <p className="font-bold text-sm">Mind Control</p>
                                        <p className="text-xs opacity-80 leading-relaxed">If you're trading continuously, take 15-minute breaks every 2 hours to maintain focus and emotional balance.</p>
                                      </div>
                                    </div>

                                    <div className="p-4 rounded-xl border bg-purple-500/10 border-purple-500/30 flex gap-3 items-start">
                                      <div className="text-xl">📅</div>
                                      <div>
                                        <p className="font-bold text-sm">Weekend Prep</p>
                                        <p className="text-xs opacity-80 leading-relaxed">Use Saturdays to review your weekly journal. Identifying 1 mistake now prevents 5 losses next week.</p>
                                      </div>
                                    </div>

                                    <div className="p-4 rounded-xl border bg-orange-500/10 border-orange-500/30 flex gap-3 items-start">
                                      <div className="text-xl">🛡️</div>
                                      <div>
                                        <p className="font-bold text-sm">Risk Shield</p>
                                        <p className="text-xs opacity-80 leading-relaxed">If you lose more than 2% of your capital in a single day, stop trading immediately. Live to trade another day.</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Worst Performing Tags */}
                                <div>
                                  <h4 className="text-lg font-semibold mb-4">
                                    🚨 Most Problematic Tags
                                  </h4>
                                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar -mx-2 px-2 scroll-smooth">
                                    {worstTags.length > 0 ? (
                                      worstTags.map((tag: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex-shrink-0 w-[280px] snap-start bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                              <AlertTriangle className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                              <div className="font-semibold text-lg">
                                                {(tag.displayTag || tag.tag).toUpperCase()}
                                              </div>
                                              <div className="text-sm opacity-90 mb-2">
                                                Avg Loss: ₹
                                                {Math.abs(tag.avgLoss).toFixed(
                                                  0
                                                )}{" "}
                                                • {tag.lossFrequency.toFixed(0)}
                                                % loss rate
                                              </div>
                                              <div className="text-xs bg-red-500/30 rounded-lg p-2">
                                                Total Loss: ₹
                                                {Math.abs(
                                                  tag.totalPnL
                                                ).toLocaleString("en-IN")}{" "}
                                                across {tag.totalDays} days
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="col-span-2 text-center py-8">
                                        <div className="text-4xl mb-2">🎉</div>
                                        <p className="font-medium">
                                          No consistent loss-making patterns
                                          detected!
                                        </p>
                                        <p className="text-sm opacity-80">
                                          Your trading discipline is on track.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* [MOVED] Trade Duration Analysis Window — now rendered above Funds Analysis */}
                        <div className="mt-6 hidden">
                          {(() => {
                            // Parse duration string "13m 3s" / "2h 30m 15s" / "45s" → milliseconds
                            const parseDurationToMs = (dur: string): number => {
                              if (!dur || dur === '-') return 0;
                              const h = dur.match(/(\d+)h/);
                              const m = dur.match(/(\d+)m/);
                              const s = dur.match(/(\d+)s/);
                              return (
                                (parseInt(h?.[1] || '0') * 3600 +
                                  parseInt(m?.[1] || '0') * 60 +
                                  parseInt(s?.[1] || '0')) *
                                1000
                              );
                            };

                            const fmtDuration = (ms: number): string => {
                              if (ms <= 0) return '-';
                              const totalSec = Math.floor(ms / 1000);
                              const h = Math.floor(totalSec / 3600);
                              const min = Math.floor((totalSec % 3600) / 60);
                              const sec = totalSec % 60;
                              if (h > 0) return `${h}h ${min}m`;
                              if (min > 0) return `${min}m ${sec}s`;
                              return `${sec}s`;
                            };

                            // Collect all trades across filtered heatmap dates
                            interface DurationTrade {
                              date: string;
                              pnl: number;
                              durationMs: number;
                              durationLabel: string;
                              symbol?: string;
                            }
                            const allTrades: DurationTrade[] = [];
                            interface DateSummary {
                              date: string;
                              label: string;
                              avgLossDurationMs: number;
                              avgProfitDurationMs: number;
                              totalPnL: number;
                              lossCount: number;
                              profitCount: number;
                            }
                            const dateSummaries: DateSummary[] = [];

                            Object.entries(filteredHeatmapData).sort(([a], [b]) => a.localeCompare(b)).forEach(([dateStr, dayData]: [string, any]) => {
                              const rawData = dayData?.tradingData || dayData;
                              const trades: any[] = rawData?.tradeHistory || rawData?.trades || [];
                              const dateLabel = new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                              let lossDurMs = 0, lossCount = 0, profitDurMs = 0, profitCount = 0, dayPnL = 0;

                              trades.forEach((t: any) => {
                                let pnl = typeof t.pnl === 'number' ? t.pnl : parseFloat((t.pnl || '0').replace(/[₹,+\s]/g, '')) || 0;
                                const durMs = parseDurationToMs(t.duration || '');
                                dayPnL += pnl;

                                allTrades.push({
                                  date: dateStr,
                                  pnl,
                                  durationMs: durMs,
                                  durationLabel: t.duration || '-',
                                  symbol: t.symbol || t.stock || '',
                                });

                                if (pnl < 0 && durMs > 0) { lossDurMs += durMs; lossCount++; }
                                if (pnl > 0 && durMs > 0) { profitDurMs += durMs; profitCount++; }
                              });

                              if (trades.length > 0) {
                                dateSummaries.push({
                                  date: dateStr,
                                  label: dateLabel,
                                  avgLossDurationMs: lossCount > 0 ? lossDurMs / lossCount : 0,
                                  avgProfitDurationMs: profitCount > 0 ? profitDurMs / profitCount : 0,
                                  totalPnL: dayPnL,
                                  lossCount,
                                  profitCount,
                                });
                              }
                            });

                            const tradesWithDuration = allTrades.filter(t => t.durationMs > 0);
                            const lossTradesAll = tradesWithDuration.filter(t => t.pnl < 0);
                            const profitTradesAll = tradesWithDuration.filter(t => t.pnl > 0);

                            const avgLossDurMs = lossTradesAll.length > 0
                              ? lossTradesAll.reduce((s, t) => s + t.durationMs, 0) / lossTradesAll.length : 0;
                            const avgProfitDurMs = profitTradesAll.length > 0
                              ? profitTradesAll.reduce((s, t) => s + t.durationMs, 0) / profitTradesAll.length : 0;

                            const longestLoss = lossTradesAll.reduce((max, t) => t.durationMs > max.durationMs ? t : max, lossTradesAll[0] || { durationMs: 0, date: '-', durationLabel: '-', pnl: 0, symbol: '' });
                            const shortestProfit = profitTradesAll.reduce((min, t) => t.durationMs < min.durationMs ? t : min, profitTradesAll[0] || { durationMs: 0, date: '-', durationLabel: '-', pnl: 0, symbol: '' });

                            // Over-holding ratio: how much longer losses are held vs profits
                            const overHoldRatio = avgProfitDurMs > 0 ? avgLossDurMs / avgProfitDurMs : 0;
                            const isOverHolding = avgLossDurMs > avgProfitDurMs;

                            // Chart data: per-date avg loss vs profit duration (in minutes)
                            const durationChartData = dateSummaries.map(d => ({
                              date: d.label,
                              lossDurMin: d.avgLossDurationMs > 0 ? Math.round(d.avgLossDurationMs / 60000 * 10) / 10 : 0,
                              profitDurMin: d.avgProfitDurationMs > 0 ? Math.round(d.avgProfitDurationMs / 60000 * 10) / 10 : 0,
                              pnl: Math.round(d.totalPnL),
                              lossCount: d.lossCount,
                              profitCount: d.profitCount,
                            }));

                            const hasDurationData = tradesWithDuration.length > 0;

                            return (
                              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                                      <Timer className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-slate-800 dark:text-white text-base">Trade Duration Analysis</h3>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Loss vs Profit holding time — find where time hurts your trades</p>
                                    </div>
                                  </div>
                                  {hasDurationData && (
                                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${isOverHolding ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400'}`}>
                                      {isOverHolding ? '⚠️ Over-holding losses' : '✅ Good exit discipline'}
                                    </div>
                                  )}
                                </div>

                                <div className="p-6 space-y-6">
                                  {!hasDurationData ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                                      <Timer className="w-12 h-12 mb-3 opacity-40" />
                                      <p className="font-medium text-sm">No trade duration data yet</p>
                                      <p className="text-xs mt-1">Duration analysis appears once trade history has timing data</p>
                                    </div>
                                  ) : (
                                    <>
                                      {/* KPI Row */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4">
                                          <p className="text-[10px] uppercase tracking-wider font-bold text-red-400 mb-1">Avg Loss Duration</p>
                                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{fmtDuration(avgLossDurMs)}</p>
                                          <p className="text-[10px] text-slate-400 mt-1">{lossTradesAll.length} losing trades</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-2xl p-4">
                                          <p className="text-[10px] uppercase tracking-wider font-bold text-green-500 mb-1">Avg Profit Duration</p>
                                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmtDuration(avgProfitDurMs)}</p>
                                          <p className="text-[10px] text-slate-400 mt-1">{profitTradesAll.length} profitable trades</p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-4">
                                          <p className="text-[10px] uppercase tracking-wider font-bold text-orange-500 mb-1">Longest Losing Hold</p>
                                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{longestLoss.durationLabel || '-'}</p>
                                          <p className="text-[10px] text-slate-400 mt-1">{longestLoss.date !== '-' ? new Date(longestLoss.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}</p>
                                        </div>
                                        <div className={`rounded-2xl p-4 border ${overHoldRatio > 1.5 ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Over-hold Ratio</p>
                                          <p className={`text-2xl font-bold ${overHoldRatio > 1.5 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {overHoldRatio > 0 ? `${overHoldRatio.toFixed(1)}x` : '-'}
                                          </p>
                                          <p className="text-[10px] text-slate-400 mt-1">{overHoldRatio > 1 ? 'losses held longer than wins' : 'balanced holding'}</p>
                                        </div>
                                      </div>

                                      {/* Duration Chart */}
                                      {durationChartData.length > 1 && (
                                        <div>
                                          <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                              <BarChart3 className="w-4 h-4 text-orange-500" />
                                              Daily Holding Time — Loss vs Profit (minutes)
                                            </h4>
                                            <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider">
                                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Loss</span>
                                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Profit</span>
                                            </div>
                                          </div>
                                          <div className="h-52 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                              <BarChart data={durationChartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barGap={2}>
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}m`} />
                                                <Tooltip
                                                  contentStyle={{ background: theme === 'dark' ? '#1e293b' : '#fff', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '11px' }}
                                                  formatter={(value: any, name: string) => [`${value} min`, name === 'lossDurMin' ? 'Avg Loss Hold' : 'Avg Profit Hold']}
                                                  labelFormatter={(label, payload) => {
                                                    if (payload?.[0]?.payload) {
                                                      const d = payload[0].payload;
                                                      return `${label} • P&L: ₹${d.pnl.toLocaleString()}`;
                                                    }
                                                    return label;
                                                  }}
                                                />
                                                <Bar dataKey="lossDurMin" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                                <Bar dataKey="profitDurMin" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={28} />
                                              </BarChart>
                                            </ResponsiveContainer>
                                          </div>
                                        </div>
                                      )}

                                      {/* Per-date breakdown table */}
                                      {dateSummaries.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-amber-500" />
                                            Date-wise Duration Breakdown
                                          </h4>
                                          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <table className="w-full text-xs">
                                              <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                                                  <th className="px-4 py-3 text-left">Date</th>
                                                  <th className="px-4 py-3 text-center">Losing Trades</th>
                                                  <th className="px-4 py-3 text-center">Avg Loss Hold</th>
                                                  <th className="px-4 py-3 text-center">Profitable Trades</th>
                                                  <th className="px-4 py-3 text-center">Avg Profit Hold</th>
                                                  <th className="px-4 py-3 text-right">Day P&L</th>
                                                  <th className="px-4 py-3 text-center">Signal</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {dateSummaries.slice().reverse().map((d, i) => {
                                                  const overHold = d.avgLossDurationMs > 0 && d.avgProfitDurationMs > 0 && d.avgLossDurationMs > d.avgProfitDurationMs * 1.3;
                                                  const isProfitDay = d.totalPnL >= 0;
                                                  return (
                                                    <tr key={i} className={`transition-colors ${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                                                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{d.label}</td>
                                                      <td className="px-4 py-3 text-center text-red-500 font-medium">{d.lossCount > 0 ? d.lossCount : '—'}</td>
                                                      <td className="px-4 py-3 text-center font-bold text-red-500">{d.avgLossDurationMs > 0 ? fmtDuration(d.avgLossDurationMs) : '—'}</td>
                                                      <td className="px-4 py-3 text-center text-emerald-600 font-medium">{d.profitCount > 0 ? d.profitCount : '—'}</td>
                                                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{d.avgProfitDurationMs > 0 ? fmtDuration(d.avgProfitDurationMs) : '—'}</td>
                                                      <td className={`px-4 py-3 text-right font-bold ${isProfitDay ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {isProfitDay ? '+' : '-'}₹{Math.abs(d.totalPnL).toLocaleString('en-IN')}
                                                      </td>
                                                      <td className="px-4 py-3 text-center">
                                                        {overHold ? (
                                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold">⚠️ Over-held</span>
                                                        ) : d.avgLossDurationMs === 0 && d.lossCount === 0 ? (
                                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-bold">✅ No losses</span>
                                                        ) : (
                                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold">✓ OK</span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}

                                      {/* Insight cards */}
                                      <div className="grid md:grid-cols-3 gap-4">
                                        <div className={`rounded-2xl p-4 border flex gap-3 items-start ${isOverHolding ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'}`}>
                                          <span className="text-2xl">{isOverHolding ? '🚨' : '✅'}</span>
                                          <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                              {isOverHolding ? 'You Hold Losses Too Long' : 'Exits Are Well-Timed'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                              {isOverHolding
                                                ? `On average you hold losing trades ${fmtDuration(avgLossDurMs - avgProfitDurMs)} longer than winners. This erodes profit.`
                                                : `Your losing trades average ${fmtDuration(avgLossDurMs)}, shorter than or equal to winning trade holds.`}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="rounded-2xl p-4 border bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 flex gap-3 items-start">
                                          <span className="text-2xl">⏱️</span>
                                          <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Optimal Profit Window</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                              Your profitable trades average {fmtDuration(avgProfitDurMs)}.
                                              {shortestProfit?.durationLabel && shortestProfit.durationLabel !== '-'
                                                ? ` Your fastest win was ${shortestProfit.durationLabel}.`
                                                : ''}
                                              {' '}Use this as your target exit window.
                                            </p>
                                          </div>
                                        </div>

                                        <div className={`rounded-2xl p-4 border flex gap-3 items-start ${dateSummaries.filter(d => d.avgLossDurationMs > d.avgProfitDurationMs * 1.3).length > dateSummaries.length / 2 ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'}`}>
                                          <span className="text-2xl">📅</span>
                                          <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Over-holding Days</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                              {(() => {
                                                const overHoldDays = dateSummaries.filter(d => d.avgLossDurationMs > 0 && d.avgProfitDurationMs > 0 && d.avgLossDurationMs > d.avgProfitDurationMs * 1.3);
                                                if (overHoldDays.length === 0) return 'No days where you significantly over-held losses. Strong exit discipline!';
                                                return `${overHoldDays.length} trading day${overHoldDays.length > 1 ? 's' : ''} where losses were held 30%+ longer than profits: ${overHoldDays.slice(0, 3).map(d => d.label).join(', ')}.`;
                                              })()}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
    </>
  );
}
