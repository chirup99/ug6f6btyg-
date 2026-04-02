import { RotateCcw, BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerformanceTrendChartProps {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  isProfitable: boolean;
  tradingDataByDate: Record<string, any>;
  filteredHeatmapData: Record<string, any>;
  theme: string;
}

export function PerformanceTrendChart({
  selectedDate,
  setSelectedDate,
  isProfitable,
  tradingDataByDate,
  filteredHeatmapData,
  theme,
}: PerformanceTrendChartProps) {
  return (
    <div className="md:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-8 shadow-lg border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Performance Trend
          </h3>
          {selectedDate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedDate ? (
            <button
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 border border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 ${isProfitable ? "bg-emerald-400" : "bg-red-400"} rounded-full`}></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {isProfitable ? "Profitable" : "Not Profitable"}
              </span>
            </div>
          )}
        </div>
      </div>

      {selectedDate ? (
        (() => {
          const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
          const selectedDateLabel = selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          // Read directly from tradingDataByDate to stay in sync with tradebook
          const todayData = tradingDataByDate[selectedDateStr] || filteredHeatmapData[selectedDateStr];
          const raw = todayData?.tradingData || todayData;
          const allTodayTrades: any[] = raw?.tradeHistory || raw?.trades || [];

          const parseTimeToMin = (timeStr: string): number => {
            if (!timeStr) return -1;
            const match = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)/i);
            if (!match) return -1;
            let h = parseInt(match[1]);
            const m = parseInt(match[2]);
            const ampm = match[4].toUpperCase();
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return h * 60 + m;
          };

          // Include ALL trades regardless of time/symbol (equity, commodity, currency etc)
          const sortedTrades = [...allTodayTrades]
            .map((t, idx) => ({
              ...t,
              pnl: typeof t.pnl === 'number' ? t.pnl : parseFloat((t.pnl || '0').replace(/[₹,+\s]/g, '')) || 0,
              timeMin: parseTimeToMin(t.time || ''),
              tradeIdx: idx,
            }))
            .sort((a, b) => {
              if (a.timeMin !== -1 && b.timeMin !== -1) return a.timeMin - b.timeMin;
              if (a.timeMin !== -1) return -1;
              if (b.timeMin !== -1) return 1;
              return a.tradeIdx - b.tradeIdx;
            });

          if (sortedTrades.length === 0) {
            return (
              <div className="flex items-center justify-center h-56 text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No trades on {selectedDateLabel}</p>
                  <p className="text-xs mt-1 opacity-60">Select a date with trades from the tradebook</p>
                </div>
              </div>
            );
          }

          let cumulative = 0;
          const firstLabel = sortedTrades[0].timeMin !== -1
            ? `${Math.floor(sortedTrades[0].timeMin / 60)}:${(sortedTrades[0].timeMin % 60).toString().padStart(2,'0')}`
            : 'Start';
          const intradayData: any[] = [{ label: firstLabel, cumPnL: 0, timeMin: sortedTrades[0]?.timeMin ?? 0 }];
          sortedTrades.forEach((t, idx) => {
            cumulative += t.pnl;
            const label = t.timeMin !== -1
              ? `${Math.floor(t.timeMin / 60)}:${(t.timeMin % 60).toString().padStart(2, '0')}`
              : `T${idx + 1}`;
            intradayData.push({ label, cumPnL: cumulative, timeMin: t.timeMin, pnl: t.pnl, symbol: t.symbol || t.stock || '' });
          });

          const finalPnL = cumulative;
          const isPos = finalPnL >= 0;
          const strokeColor = isPos ? '#10b981' : '#ef4444';
          const fillId = isPos ? 'intraDayGradPos' : 'intraDayGradNeg';
          const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
          const tooltipText2 = theme === 'dark' ? '#e2e8f0' : '#1e293b';

          return (
            <div className="h-56 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {sortedTrades.length} trade{sortedTrades.length !== 1 ? 's' : ''}
                </span>
                <span className={`text-sm font-bold ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPos ? '+' : ''}₹{Math.abs(finalPnL).toLocaleString()}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={intradayData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="intraDayGradPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="intraDayGradNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme === 'dark' ? '#cbd5e1' : '#64748b' }} tickFormatter={v => `${v >= 0 ? '' : '-'}${(Math.abs(v) / 1000).toFixed(1)}K`} domain={['dataMin - 500', 'dataMax + 500']} />
                  <ReferenceLine y={0} stroke={theme === 'dark' ? '#475569' : '#cbd5e1'} strokeDasharray="4 4" />
                  <Tooltip
                    contentStyle={{ background: tooltipBg, border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, borderRadius: '10px', color: tooltipText2, fontSize: '12px', padding: '8px 12px' }}
                    formatter={(v: any) => [`${v >= 0 ? '₹' : '-₹'}${Math.abs(v).toLocaleString()}`, 'Cumulative P&L']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.symbol ? `${label} • ${payload[0].payload.symbol}` : label}
                  />
                  <Area type="monotone" dataKey="cumPnL" stroke={strokeColor} strokeWidth={2.5} fill={`url(#${fillId})`}
                    dot={(p: any) => p.payload.pnl !== undefined ? <circle key={`dot-${p.payload.timeMin}`} cx={p.cx} cy={p.cy} r={3.5} fill={p.payload.pnl >= 0 ? '#10b981' : '#ef4444'} stroke="white" strokeWidth={1.5} /> : <g key={`dot-empty-${p.payload.timeMin}`} />}
                    activeDot={{ r: 5, fill: strokeColor, stroke: 'white', strokeWidth: 2 }} animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })()
      ) : (
        (() => {
          // Full heatmap performance trend — only the active heatmap's dates
          // filteredHeatmapData is derived from getFilteredHeatmapData() which
          // uses tradingDataByDate (already mode-aware: demo / personal-1 / personal-2)
          const sourceData = filteredHeatmapData;
          const allDates = Object.keys(sourceData)
            .filter(date => {
              const d = sourceData[date];
              const metrics = d?.tradingData?.performanceMetrics || d?.performanceMetrics;
              return (metrics?.totalTrades || 0) > 0 || (d?.tradingData?.tradeHistory || d?.tradeHistory || d?.trades || []).length > 0;
            })
            .sort();

          const chartData = allDates.map((dateStr) => {
            const date = new Date(dateStr);
            const dayData = sourceData[dateStr];
            const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
            const trades: any[] = dayData?.tradingData?.tradeHistory || dayData?.tradeHistory || dayData?.trades || [];
            const computedPnL = trades.reduce((sum: number, t: any) => {
              const p = typeof t.pnl === 'number' ? t.pnl : parseFloat((t.pnl || '0').replace(/[₹,+\s]/g, '')) || 0;
              return sum + p;
            }, 0);
            const netPnL = metrics?.netPnL ?? computedPnL;
            const totalTrades = metrics?.totalTrades || trades.length;
            return {
              day: `${date.getDate()}/${date.getMonth() + 1}`,
              value: netPnL,
              date: dateStr,
              trades: totalTrades,
              formattedDate: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            };
          }).filter(item => item.trades > 0);

          if (chartData.length === 0) {
            return (
              <div className="flex items-center justify-center h-56 text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No trading data available</p>
                  <p className="text-xs mt-1 opacity-60">Load data from the tradebook to see your trend</p>
                </div>
              </div>
            );
          }

          const chartStrokeColor = theme === 'dark' ? '#ffffff' : '#000000';
          const tooltipBg2 = theme === 'dark' ? '#1e293b' : '#ffffff';
          const tooltipText3 = theme === 'dark' ? '#e2e8f0' : '#1e293b';

          return (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaGradientPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(107, 114, 128)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="rgb(107, 114, 128)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={false} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme === 'dark' ? '#cbd5e1' : '#64748b' }} tickFormatter={v => `${v >= 0 ? '' : '-'}${(Math.abs(v) / 1000).toFixed(0)}K`} domain={['dataMin - 1000', 'dataMax + 1000']} />
                  <Tooltip
                    contentStyle={{ background: tooltipBg2, border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', color: tooltipText3, fontSize: '12px', padding: '8px 12px' }}
                    formatter={(v: any) => [`${v >= 0 ? '₹' : '-₹'}${Math.abs(v).toLocaleString()}`, 'Daily P&L']}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? `${data.formattedDate} • ${data.trades} trade${data.trades !== 1 ? 's' : ''}` : label;
                    }}
                  />
                  <Area type="natural" dataKey="value" stroke={chartStrokeColor} strokeWidth={3} fill="url(#areaGradientPositive)" dot={false} activeDot={{ r: 6, fill: chartStrokeColor, stroke: 'white', strokeWidth: 2 }} isAnimationActive={true} animationDuration={600} animationEasing="ease-in-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })()
      )}
    </div>
  );
}
