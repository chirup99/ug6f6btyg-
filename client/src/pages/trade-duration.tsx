import { useState } from 'react';
import React from 'react';
import { Timer, TrendingUp, Zap, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface TradeDurationAnalysisProps {
  filteredHeatmapData: Record<string, any>;
  theme: string;
}

export function TradeDurationAnalysis({ filteredHeatmapData, theme }: TradeDurationAnalysisProps) {
  const [durFilterMonth, setDurFilterMonth] = useState<string>('all');
  const [durFilterYear, setDurFilterYear] = useState<string>('all');
  const [durExpandedRows, setDurExpandedRows] = useState<Set<string>>(new Set());
  const [durTableOpen, setDurTableOpen] = useState<boolean>(false);
  const [chartCarouselIndex, setChartCarouselIndex] = useState<number>(0);
  const [patternCarouselIndex, setPatternCarouselIndex] = useState<number>(0);
  const [insightCarouselIndex, setInsightCarouselIndex] = useState<number>(0);

  const parseDurMs = (dur: string): number => {
    if (!dur || dur === '-') return 0;
    const h = dur.match(/(\d+)h/);
    const m = dur.match(/(\d+)m/);
    const s = dur.match(/(\d+)s/);
    return (parseInt(h?.[1]||'0')*3600+parseInt(m?.[1]||'0')*60+parseInt(s?.[1]||'0'))*1000;
  };
  const fmtDur = (ms: number): string => {
    if (ms <= 0) return '-';
    const ts = Math.floor(ms/1000);
    const h = Math.floor(ts/3600), min = Math.floor((ts%3600)/60), sec = ts%60;
    if (h > 0) return `${h}h ${min}m`;
    if (min > 0) return `${min}m ${sec}s`;
    return `${sec}s`;
  };
  const fmtDurMin = (ms: number): number => ms > 0 ? Math.round(ms/60000*10)/10 : 0;

  interface DTrade { date:string; pnl:number; durationMs:number; durationLabel:string; symbol?:string; entryHour?:number; }
  interface DSum { date:string; label:string; avgLossDurMs:number; avgProfitDurMs:number; totalPnL:number; lossCount:number; profitCount:number; totalDurMs:number; efficiencyRpM:number; }
  const allTrades: DTrade[] = [];
  const sums: DSum[] = [];

  // Duration bucket counts
  const buckets: Record<string,{wins:number;losses:number;pnl:number}> = {
    '0–5m': {wins:0,losses:0,pnl:0},
    '5–15m': {wins:0,losses:0,pnl:0},
    '15–30m': {wins:0,losses:0,pnl:0},
    '30m+': {wins:0,losses:0,pnl:0},
  };
  const bucketKey = (ms:number) => ms<300000?'0–5m':ms<900000?'5–15m':ms<1800000?'15–30m':'30m+';

  Object.entries(filteredHeatmapData).sort(([a],[b])=>a.localeCompare(b)).forEach(([dateStr, dayData]:any) => {
    const raw = dayData?.tradingData || dayData;
    const trades: any[] = raw?.tradeHistory || raw?.trades || [];
    const lbl = new Date(dateStr).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    let lossDMs=0,lossN=0,profDMs=0,profN=0,dayPnL=0,totalDMs=0;
    trades.forEach((t:any)=>{
      let pnl = typeof t.pnl==='number' ? t.pnl : parseFloat((t.pnl||'0').replace(/[₹,+\s]/g,''))||0;
      const dMs = parseDurMs(t.duration||'');
      dayPnL+=pnl; if(dMs>0) totalDMs+=dMs;
      const rawTime = t.entryTime || t.time || t.entry || t.buyTime || '';
      const entryHour = rawTime && typeof rawTime === 'string' ? parseInt(rawTime.split(':')[0]) : -1;
      allTrades.push({date:dateStr,pnl,durationMs:dMs,durationLabel:t.duration||'-',symbol:t.symbol||t.stock||'',entryHour:entryHour>=0&&entryHour<=23?entryHour:undefined});
      if(pnl<0&&dMs>0){lossDMs+=dMs;lossN++;}
      if(pnl>0&&dMs>0){profDMs+=dMs;profN++;}
      if(dMs>0){const bk=bucketKey(dMs);if(pnl>0)buckets[bk].wins++;else if(pnl<0)buckets[bk].losses++;buckets[bk].pnl+=pnl;}
    });
    const totalDurMin = totalDMs/60000;
    const effRpM = totalDurMin>0 ? dayPnL/totalDurMin : 0;
    if(trades.length>0) sums.push({date:dateStr,label:lbl,avgLossDurMs:lossN>0?lossDMs/lossN:0,avgProfitDurMs:profN>0?profDMs/profN:0,totalPnL:dayPnL,lossCount:lossN,profitCount:profN,totalDurMs:totalDMs,efficiencyRpM:effRpM});
  });

  const withDur = allTrades.filter(t=>t.durationMs>0);
  const lossTrades = withDur.filter(t=>t.pnl<0);
  const profTrades = withDur.filter(t=>t.pnl>0);
  const avgLossDurMs = lossTrades.length>0?lossTrades.reduce((s,t)=>s+t.durationMs,0)/lossTrades.length:0;
  const avgProfDurMs = profTrades.length>0?profTrades.reduce((s,t)=>s+t.durationMs,0)/profTrades.length:0;
  const longestLoss = lossTrades.reduce((mx,t)=>t.durationMs>mx.durationMs?t:mx, lossTrades[0]||{durationMs:0,date:'-',durationLabel:'-',pnl:0,symbol:''});
  const shortestProfit = profTrades.reduce((mn,t)=>t.durationMs<mn.durationMs?t:mn, profTrades[0]||{durationMs:0,date:'-',durationLabel:'-',pnl:0,symbol:''});
  const overHoldRatio = avgProfDurMs>0 ? avgLossDurMs/avgProfDurMs : 0;
  const isOverHolding = avgLossDurMs > avgProfDurMs;
  const grade = overHoldRatio<=0?'-':overHoldRatio<1.2?'A':overHoldRatio<1.8?'B':overHoldRatio<2.5?'C':'D';
  const gradeColor = grade==='A'?'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30':grade==='B'?'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30':grade==='C'?'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30':'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
  const hasDur = withDur.length>0;

  // Line/bar chart data — last 30 trading days only
  const recentSums = sums.slice(-30);
  const lineData = recentSums.map(d=>({
    date: d.label,
    lossDurMin: fmtDurMin(d.avgLossDurMs),
    profDurMin: fmtDurMin(d.avgProfitDurMs),
    pnl: Math.round(d.totalPnL),
    effRpM: Math.round(d.efficiencyRpM),
  }));
  const barData = lineData;
  const chartXInterval = Math.max(0, Math.ceil(lineData.length / 6) - 1);

  // Day-of-week pattern analysis (using all sums, not just recent 30)
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dowStats: Record<number,{wins:number;losses:number;pnl:number;name:string}> = {};
  sums.forEach(d => {
    const dow = new Date(d.date).getDay();
    if(!dowStats[dow]) dowStats[dow]={wins:0,losses:0,pnl:0,name:dayNames[dow]};
    if(d.totalPnL>0) dowStats[dow].wins++;
    else if(d.totalPnL<0) dowStats[dow].losses++;
    dowStats[dow].pnl+=d.totalPnL;
  });
  const riskDays = Object.values(dowStats).filter(d=>{
    const total=d.wins+d.losses;
    return total>=2 && d.losses/total>0.55 && d.pnl<0;
  }).sort((a,b)=>(b.losses/(b.wins+b.losses))-(a.losses/(a.wins+a.losses)));
  const strongDays = Object.values(dowStats).filter(d=>{
    const total=d.wins+d.losses;
    return total>=2 && d.wins/total>=0.6 && d.pnl>0;
  }).sort((a,b)=>(b.wins/(b.wins+b.losses))-(a.wins/(a.wins+a.losses)));

  // Time-of-day pattern analysis
  const hourSlots: Record<number,{wins:number;losses:number;pnl:number}> = {};
  allTrades.filter(t=>t.entryHour!==undefined).forEach(t=>{
    const h=t.entryHour!;
    if(!hourSlots[h]) hourSlots[h]={wins:0,losses:0,pnl:0};
    if(t.pnl>0) hourSlots[h].wins++;
    else if(t.pnl<0) hourSlots[h].losses++;
    hourSlots[h].pnl+=t.pnl;
  });
  const hasTimeData = Object.keys(hourSlots).length > 0;
  const fmtHour = (h:number) => h===0?'12 AM':h<12?`${h} AM`:h===12?'12 PM':`${h-12} PM`;
  const avoidSlots = Object.entries(hourSlots).filter(([,d])=>{
    const total=d.wins+d.losses;
    return total>=2 && d.losses/total>0.55 && d.pnl<0;
  }).map(([h,d])=>({hour:parseInt(h),label:`${fmtHour(parseInt(h))}–${fmtHour(parseInt(h)+1)}`,lossRate:d.losses/(d.wins+d.losses),pnl:d.pnl,total:d.wins+d.losses}))
    .sort((a,b)=>b.lossRate-a.lossRate);
  const bestSlots = Object.entries(hourSlots).filter(([,d])=>{
    const total=d.wins+d.losses;
    return total>=2 && d.wins/total>=0.6 && d.pnl>0;
  }).map(([h,d])=>({hour:parseInt(h),label:`${fmtHour(parseInt(h))}–${fmtHour(parseInt(h)+1)}`,winRate:d.wins/(d.wins+d.losses),pnl:d.pnl,total:d.wins+d.losses}))
    .sort((a,b)=>b.winRate-a.winRate);

  const hasPatternInsights = riskDays.length>0 || strongDays.length>0 || (hasTimeData && (avoidSlots.length>0 || bestSlots.length>0));

  // Best duration bucket
  const bestBucket = Object.entries(buckets).reduce((best,[k,v])=>{
    const wr = (v.wins+v.losses)>0?v.wins/(v.wins+v.losses):0;
    const bestWr = (best[1].wins+best[1].losses)>0?best[1].wins/(best[1].wins+best[1].losses):0;
    return wr>bestWr?[k,v]:best;
  },Object.entries(buckets)[0]||['0–5m',{wins:0,losses:0,pnl:0}]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800/80 dark:to-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Timer className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">Trade Duration Analysis</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Holding time patterns — see exactly where time costs you money</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {hasDur && grade !== '-' && (
            <div className={`px-2.5 py-1 rounded-xl text-xs font-black border ${gradeColor}`}>
              Grade: {grade}
            </div>
          )}
          {hasDur && (
            <div className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${isOverHolding?'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400':'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400'}`}>
              {isOverHolding?'⚠️ Over-holding':'✅ Disciplined'}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 md:p-6 space-y-5 md:space-y-7">
        {!hasDur ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Timer className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium text-sm">No duration data in trade history yet</p>
            <p className="text-xs mt-1 opacity-70">Duration analysis appears once trades have timing information</p>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl md:rounded-2xl p-3 md:p-4">
                <p className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-red-400 mb-1">Avg Loss Hold</p>
                <p className="text-lg md:text-2xl font-bold text-red-600 dark:text-red-400">{fmtDur(avgLossDurMs)}</p>
                <p className="text-[10px] text-slate-400 mt-1">{lossTrades.length} losses</p>
              </div>
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-xl md:rounded-2xl p-3 md:p-4">
                <p className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-green-500 mb-1">Avg Profit Hold</p>
                <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">{fmtDur(avgProfDurMs)}</p>
                <p className="text-[10px] text-slate-400 mt-1">{profTrades.length} profits</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl md:rounded-2xl p-3 md:p-4">
                <p className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-orange-500 mb-1">Longest Loss Hold</p>
                <p className="text-lg md:text-2xl font-bold text-orange-600 dark:text-orange-400">{longestLoss.durationLabel||'-'}</p>
                <p className="text-[10px] text-slate-400 mt-1">{longestLoss.date!=='-'?new Date(longestLoss.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'-'}</p>
              </div>
              <div className={`rounded-xl md:rounded-2xl p-3 md:p-4 border ${overHoldRatio>1.5?'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20':'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                <p className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Over-hold Ratio</p>
                <p className={`text-lg md:text-2xl font-bold ${overHoldRatio>1.5?'text-red-600 dark:text-red-400':'text-slate-700 dark:text-slate-300'}`}>{overHoldRatio>0?`${overHoldRatio.toFixed(1)}x`:'-'}</p>
                <p className="text-[10px] text-slate-400 mt-1">{overHoldRatio>1?'losses > wins':'balanced'}</p>
              </div>
            </div>

            {/* Dual chart panel */}
            {lineData.length > 0 && (() => {
              const chartItems = [
                {
                  key: 'trend',
                  icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
                  title: 'Duration Trend Over Time',
                  hint: '↓ Red line falling = you\'re cutting losses faster over time ✅',
                  chart: (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{top:4,right:8,left:-14,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme==='dark'?'#1e293b':'#f1f5f9'} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94a3b8',fontWeight:600}} interval={chartXInterval} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94a3b8'}} tickFormatter={v=>`${v}m`} />
                        <Tooltip
                          contentStyle={{background:theme==='dark'?'#1e293b':'#fff',border:`1px solid ${theme==='dark'?'#334155':'#e2e8f0'}`,borderRadius:'10px',fontSize:'11px'}}
                          formatter={(val:any,name:string)=>[`${val} min`,name==='lossDurMin'?'Avg Loss Hold':'Avg Profit Hold']}
                          labelFormatter={(label:any,payload:any)=>{
                            if(payload?.[0]?.payload){const d=payload[0].payload;return `${label} • P&L: ₹${d.pnl.toLocaleString()}`;}
                            return label;
                          }}
                        />
                        <Line type="monotone" dataKey="lossDurMin" stroke="#f87171" strokeWidth={2.5} dot={{r:4,fill:'#f87171',stroke:'white',strokeWidth:2}} activeDot={{r:6}} />
                        <Line type="monotone" dataKey="profDurMin" stroke="#34d399" strokeWidth={2.5} dot={{r:4,fill:'#34d399',stroke:'white',strokeWidth:2}} activeDot={{r:6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  ),
                },
                {
                  key: 'daily',
                  icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
                  title: 'Daily Hold Time Comparison',
                  hint: 'Green taller than red on a day = disciplined exits that day ✅',
                  chart: (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{top:4,right:8,left:-14,bottom:0}} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme==='dark'?'#1e293b':'#f1f5f9'} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94a3b8',fontWeight:600}} interval={chartXInterval} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94a3b8'}} tickFormatter={v=>`${v}m`} />
                        <Tooltip
                          contentStyle={{background:theme==='dark'?'#1e293b':'#fff',border:`1px solid ${theme==='dark'?'#334155':'#e2e8f0'}`,borderRadius:'10px',fontSize:'11px'}}
                          formatter={(val:any,name:string)=>[`${val} min`,name==='lossDurMin'?'Avg Loss Hold':'Avg Profit Hold']}
                          labelFormatter={(label:any,payload:any)=>{
                            if(payload?.[0]?.payload){const d=payload[0].payload;return `${label} • P&L: ₹${d.pnl.toLocaleString()}`;}
                            return label;
                          }}
                        />
                        <Bar dataKey="lossDurMin" fill="#f87171" radius={[4,4,0,0]} maxBarSize={28} />
                        <Bar dataKey="profDurMin" fill="#34d399" radius={[4,4,0,0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  ),
                },
              ];
              const legend = (
                <div className="flex gap-3 text-[10px] font-bold uppercase">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Loss</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Profit</span>
                </div>
              );
              return (
                <>
                  {/* ── Mobile carousel ── */}
                  <div className="md:hidden">
                    <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          {chartItems[chartCarouselIndex].icon}
                          {chartItems[chartCarouselIndex].title}
                        </h4>
                        {legend}
                      </div>
                      {/* Chart */}
                      <div className="h-48">
                        {chartItems[chartCarouselIndex].chart}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 text-center">{chartItems[chartCarouselIndex].hint}</p>
                      {/* Carousel controls */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                          data-testid="button-chart-carousel-prev"
                          onClick={() => setChartCarouselIndex(i => (i - 1 + chartItems.length) % chartItems.length)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Prev
                        </button>
                        {/* Dot indicators */}
                        <div className="flex gap-1.5">
                          {chartItems.map((_, i) => (
                            <button
                              key={i}
                              data-testid={`button-chart-dot-${i}`}
                              onClick={() => setChartCarouselIndex(i)}
                              className={`w-2 h-2 rounded-full transition-colors ${i === chartCarouselIndex ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            />
                          ))}
                        </div>
                        <button
                          data-testid="button-chart-carousel-next"
                          onClick={() => setChartCarouselIndex(i => (i + 1) % chartItems.length)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Desktop grid ── */}
                  <div className="hidden md:grid md:grid-cols-2 gap-5">
                    {chartItems.map(item => (
                      <div key={item.key} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            {item.icon}
                            {item.title}
                          </h4>
                          {legend}
                        </div>
                        <div className="h-48">
                          {item.chart}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">{item.hint}</p>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

            {/* Duration Bands — win rate per hold time bucket */}
            <div>
              <h4 className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 md:mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-500" />
                <span className="hidden sm:inline">Win Rate by Holding Duration — Find Your Sweet Spot</span>
                <span className="sm:hidden">Win Rate by Hold Duration</span>
              </h4>
              {/* Mobile: flat 2×2 grid */}
              <div className="md:hidden grid grid-cols-2 gap-2">
                {Object.entries(buckets).map(([label, data]) => {
                  const total = data.wins + data.losses;
                  const wr = total > 0 ? (data.wins / total) * 100 : 0;
                  const isBest = label === bestBucket[0] && total > 0;
                  const wrColor = wr>=60?'text-green-600 dark:text-green-400':wr>=40?'text-amber-500':'text-red-500';
                  const barColor = wr>=60?'bg-green-500':wr>=40?'bg-amber-500':'bg-red-500';
                  const bg = isBest?'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/40':'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                  return (
                    <div key={label} className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 relative ${bg}`}>
                      {isBest && <span className="absolute -top-1.5 right-2 text-[8px] font-black px-1 py-0 bg-purple-500 text-white rounded-full leading-4">BEST</span>}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">{label}</span>
                        <span className={`text-base font-black leading-none ${wrColor}`}>{total>0?`${wr.toFixed(0)}%`:'-'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] text-slate-400">{data.wins}W·{data.losses}L</span>
                        <div className="h-1 w-14 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{width:`${wr}%`}} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop: 4-col grid */}
              <div className="hidden md:grid md:grid-cols-4 gap-3">
                {Object.entries(buckets).map(([label, data]) => {
                  const total = data.wins + data.losses;
                  const wr = total > 0 ? (data.wins / total) * 100 : 0;
                  const isBest = label === bestBucket[0] && total > 0;
                  return (
                    <div key={label} className={`rounded-2xl p-4 border relative ${isBest ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                      {isBest && <span className="absolute -top-2 right-3 text-[10px] font-black px-2 py-0.5 bg-purple-500 text-white rounded-full">BEST</span>}
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">{label}</p>
                      <p className={`text-xl font-black ${wr>=60?'text-green-600 dark:text-green-400':wr>=40?'text-amber-600 dark:text-amber-400':'text-red-600 dark:text-red-400'}`}>{total>0?`${wr.toFixed(0)}%`:'-'}</p>
                      <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${wr>=60?'bg-green-500':wr>=40?'bg-amber-500':'bg-red-500'}`} style={{width:`${wr}%`}} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{data.wins}W / {data.losses}L</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date breakdown table */}
            {sums.length > 0 && (() => {
              const allYears = Array.from(new Set(sums.map(d => d.date.slice(0,4)))).sort((a,b)=>b.localeCompare(a));
              const allMonths = Array.from(new Set(sums.map(d => d.date.slice(0,7)))).sort((a,b)=>b.localeCompare(a));
              const monthNames: Record<string,string> = {'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'};
              const filteredSums = sums.slice().reverse().filter(d => {
                const [yr, mo] = d.date.split('-');
                const yearOk = durFilterYear==='all' || yr===durFilterYear;
                const monthOk = durFilterMonth==='all' || `${yr}-${mo}`===durFilterMonth;
                return yearOk && monthOk;
              });
              return (
                <div>
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 mb-3 cursor-pointer select-none"
                    onClick={() => setDurTableOpen(prev => !prev)}
                  >
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-amber-500" />
                      Date-wise Duration Breakdown
                      <span className="text-[10px] font-normal text-slate-400 ml-1">· tap row to see trades</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${durTableOpen ? 'rotate-180' : ''}`} />
                    </h4>
                    {durTableOpen && (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <select
                          value={durFilterYear}
                          onChange={e => { setDurFilterYear(e.target.value); setDurFilterMonth('all'); }}
                          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer"
                        >
                          <option value="all">All Years</option>
                          {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select
                          value={durFilterMonth}
                          onChange={e => setDurFilterMonth(e.target.value)}
                          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer"
                        >
                          <option value="all">All Months</option>
                          {allMonths
                            .filter(m => durFilterYear==='all' || m.startsWith(durFilterYear))
                            .map(m => {
                              const [y, mo] = m.split('-');
                              return <option key={m} value={m}>{monthNames[mo]} {y}</option>;
                            })}
                        </select>
                        {(durFilterMonth!=='all'||durFilterYear!=='all') && (
                          <button onClick={() => { setDurFilterMonth('all'); setDurFilterYear('all'); }} className="text-[10px] text-amber-500 hover:text-amber-600 font-semibold underline">
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {durTableOpen && (
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                      {filteredSums.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-400 text-xs">No data for selected filter</div>
                      ) : (
                        <>
                          {/* ── Mobile card list ── */}
                          <div className="md:hidden max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredSums.map((d) => {
                              const overHold = d.avgLossDurMs>0&&d.avgProfitDurMs>0&&d.avgLossDurMs>d.avgProfitDurMs*1.3;
                              const isProfitDay = d.totalPnL >= 0;
                              const effColor = d.efficiencyRpM>0?'text-green-600 dark:text-green-400':d.efficiencyRpM<0?'text-red-500':'text-slate-400';
                              const isExpanded = durExpandedRows.has(d.date);
                              const dayTrades = allTrades.filter(t => t.date === d.date);
                              const toggleRow = () => setDurExpandedRows(prev => {
                                const next = new Set(prev);
                                if (next.has(d.date)) next.delete(d.date); else next.add(d.date);
                                return next;
                              });
                              return (
                                <React.Fragment key={d.date}>
                                  <div
                                    className="px-3 py-2.5 cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition-colors"
                                    onClick={toggleRow}
                                  >
                                    {/* Row 1: date + signal + chevron */}
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded?'rotate-180':''}`} />
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{d.label}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-xs font-bold ${isProfitDay?'text-emerald-600':'text-red-500'}`}>
                                          {isProfitDay?'+':'-'}₹{Math.abs(d.totalPnL).toLocaleString('en-IN')}
                                        </span>
                                        {overHold
                                          ? <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold">⚠️</span>
                                          : d.lossCount===0
                                          ? <span className="px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-bold">✅</span>
                                          : <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold">✓</span>
                                        }
                                      </div>
                                    </div>
                                    {/* Row 2: loss/profit hold + efficiency */}
                                    <div className="flex items-center gap-3 text-[11px] pl-5 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-500 font-medium">{d.lossCount>0?`${d.lossCount}L`:'—'}</span>
                                        {d.avgLossDurMs>0&&<span className="text-slate-400">·{fmtDur(d.avgLossDurMs)}</span>}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-emerald-600 font-medium">{d.profitCount>0?`${d.profitCount}P`:'—'}</span>
                                        {d.avgProfitDurMs>0&&<span className="text-slate-400">·{fmtDur(d.avgProfitDurMs)}</span>}
                                      </div>
                                      {d.efficiencyRpM!==0&&(
                                        <span className={`font-bold ${effColor}`}>{d.efficiencyRpM>=0?'+':''}₹{Math.abs(d.efficiencyRpM).toFixed(0)}/m</span>
                                      )}
                                    </div>
                                  </div>
                                  {isExpanded && (
                                    <div className="px-3 pb-2.5 pt-0 bg-slate-50 dark:bg-slate-800/30">
                                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700">
                                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trades on {d.label}</span>
                                        </div>
                                        {dayTrades.length === 0 ? (
                                          <div className="px-3 py-3 text-xs text-slate-400 text-center">No trade duration data</div>
                                        ) : (
                                          <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {dayTrades.map((t, ti) => {
                                              const isWin = t.pnl >= 0;
                                              return (
                                                <div key={ti} className="px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors">
                                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{t.symbol||'—'}</span>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] text-slate-500">{t.durationLabel&&t.durationLabel!=='-'?t.durationLabel:fmtDur(t.durationMs)||'—'}</span>
                                                    <span className={`text-[11px] font-semibold ${isWin?'text-emerald-600':'text-red-500'}`}>
                                                      {isWin?'+':'-'}₹{Math.abs(t.pnl).toLocaleString('en-IN')}
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          {/* ── Desktop table ── */}
                          <div className="hidden md:block overflow-x-auto">
                            <div className="max-h-[264px] overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead className="sticky top-0 z-10">
                                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                                    <th className="px-4 py-3 text-left w-8"></th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-center">Loss / Avg Hold</th>
                                    <th className="px-4 py-3 text-center">Profit / Avg Hold</th>
                                    <th className="px-4 py-3 text-center">₹/min</th>
                                    <th className="px-4 py-3 text-right">Day P&L</th>
                                    <th className="px-4 py-3 text-center">Signal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredSums.map((d, i) => {
                                    const overHold = d.avgLossDurMs>0&&d.avgProfitDurMs>0&&d.avgLossDurMs>d.avgProfitDurMs*1.3;
                                    const isProfitDay = d.totalPnL >= 0;
                                    const effColor = d.efficiencyRpM>0?'text-green-600 dark:text-green-400':d.efficiencyRpM<0?'text-red-500':'text-slate-400';
                                    const isExpanded = durExpandedRows.has(d.date);
                                    const dayTrades = allTrades.filter(t => t.date === d.date);
                                    const rowBg = i%2===0?'bg-white dark:bg-slate-900':'bg-slate-50/50 dark:bg-slate-800/30';
                                    return (
                                      <React.Fragment key={d.date}>
                                        <tr
                                          className={`${rowBg} cursor-pointer hover:bg-amber-50/40 dark:hover:bg-amber-500/5 transition-colors border-t border-slate-100 dark:border-slate-800`}
                                          onClick={() => setDurExpandedRows(prev => {
                                            const next = new Set(prev);
                                            if (next.has(d.date)) next.delete(d.date); else next.add(d.date);
                                            return next;
                                          })}
                                        >
                                          <td className="px-3 py-3 text-center">
                                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded?'rotate-180':''}`} />
                                          </td>
                                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{d.label}</td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="text-red-500 font-medium">{d.lossCount>0?d.lossCount:'—'}</span>
                                            {d.avgLossDurMs>0&&<span className="text-slate-400"> · {fmtDur(d.avgLossDurMs)}</span>}
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className="text-emerald-600 font-medium">{d.profitCount>0?d.profitCount:'—'}</span>
                                            {d.avgProfitDurMs>0&&<span className="text-slate-400"> · {fmtDur(d.avgProfitDurMs)}</span>}
                                          </td>
                                          <td className={`px-4 py-3 text-center font-bold ${effColor}`}>
                                            {d.efficiencyRpM!==0?`${d.efficiencyRpM>=0?'+':''}₹${Math.abs(d.efficiencyRpM).toFixed(0)}`:'—'}
                                          </td>
                                          <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${isProfitDay?'text-emerald-600':'text-red-500'}`}>
                                            {isProfitDay?'+':'-'}₹{Math.abs(d.totalPnL).toLocaleString('en-IN')}
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            {overHold?<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold">⚠️ Over-held</span>
                                            :d.lossCount===0?<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-bold">✅ No losses</span>
                                            :<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold">✓ OK</span>}
                                          </td>
                                        </tr>
                                        {isExpanded && (
                                          <tr className={rowBg}>
                                            <td colSpan={7} className="px-4 pb-3 pt-0">
                                              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 overflow-hidden">
                                                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700">
                                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trades on {d.label}</span>
                                                </div>
                                                {dayTrades.length === 0 ? (
                                                  <div className="px-4 py-3 text-xs text-slate-400 text-center">No trade duration data available</div>
                                                ) : (
                                                  <div className="max-h-48 overflow-y-auto">
                                                    <table className="w-full text-xs">
                                                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700/80">
                                                        <tr className="text-[10px] uppercase text-slate-400 font-bold">
                                                          <th className="px-3 py-2 text-left">Symbol</th>
                                                          <th className="px-3 py-2 text-center">Duration</th>
                                                          <th className="px-3 py-2 text-right">P&L</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                        {dayTrades.map((t, ti) => {
                                                          const isWin = t.pnl >= 0;
                                                          return (
                                                            <tr key={ti} className="hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors">
                                                              <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{t.symbol||'—'}</td>
                                                              <td className="px-3 py-2 text-center text-slate-500 dark:text-slate-400">{t.durationLabel&&t.durationLabel!=='-'?t.durationLabel:fmtDur(t.durationMs)||'—'}</td>
                                                              <td className={`px-3 py-2 text-right font-semibold ${isWin?'text-emerald-600':'text-red-500'}`}>
                                                                {isWin?'+':''}{t.pnl>=0?'':'-'}₹{Math.abs(t.pnl).toLocaleString('en-IN')}
                                                              </td>
                                                            </tr>
                                                          );
                                                        })}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Smart Pattern Alerts — time-of-day & day-of-week */}
            {hasPatternInsights && (() => {
              const patternItems: {key:string; card: React.ReactNode}[] = [
                ...avoidSlots.slice(0,3).map(slot=>({
                  key: `avoid-${slot.hour}`,
                  card: (
                    <div className="flex gap-2 items-center rounded-lg p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                      <span className="text-base shrink-0">🚫</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-red-700 dark:text-red-400 leading-tight">Avoid {slot.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{Math.round(slot.lossRate*100)}% loss · {slot.total} trades · avg ₹{Math.abs(Math.round(slot.pnl/slot.total)).toLocaleString('en-IN')} loss</p>
                      </div>
                    </div>
                  )
                })),
                ...bestSlots.slice(0,2).map(slot=>({
                  key: `best-${slot.hour}`,
                  card: (
                    <div className="flex gap-2 items-center rounded-lg p-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30">
                      <span className="text-base shrink-0">✅</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-green-700 dark:text-green-400 leading-tight">Best: {slot.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{Math.round(slot.winRate*100)}% win rate · {slot.total} trades</p>
                      </div>
                    </div>
                  )
                })),
                ...riskDays.map(d=>({
                  key: `risk-${d.name}`,
                  card: (
                    <div className="flex gap-2 items-center rounded-lg p-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30">
                      <span className="text-base shrink-0">⚠️</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-orange-700 dark:text-orange-400 leading-tight">Careful on {d.name}s</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{d.losses}L vs {d.wins}P · Net {d.pnl<0?'-':''}₹{Math.abs(Math.round(d.pnl)).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  )
                })),
                ...strongDays.slice(0,2).map(d=>({
                  key: `strong-${d.name}`,
                  card: (
                    <div className="flex gap-2 items-center rounded-lg p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                      <span className="text-base shrink-0">💪</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight">{d.name} is strong</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{d.wins}P vs {d.losses}L · +₹{Math.round(d.pnl).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  )
                })),
              ];
              const safePatternIdx = patternCarouselIndex % Math.max(patternItems.length, 1);
              return (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-500/20 flex items-center gap-2">
                    <span className="text-lg">🧠</span>
                    <h4 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">Best Time to Trade — Pattern Alerts</h4>
                  </div>
                  {/* Mobile carousel */}
                  <div className="md:hidden px-3 py-2">
                    {patternItems.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">Add entry time to unlock time-of-day analysis.</p>
                    ) : (
                      <>
                        {patternItems[safePatternIdx].card}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-amber-200 dark:border-amber-500/20">
                          <button data-testid="button-pattern-carousel-prev"
                            onClick={() => setPatternCarouselIndex(i => (i - 1 + patternItems.length) % patternItems.length)}
                            className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5" />Prev
                          </button>
                          <span className="text-[10px] text-slate-400">{safePatternIdx + 1}/{patternItems.length}</span>
                          <button data-testid="button-pattern-carousel-next"
                            onClick={() => setPatternCarouselIndex(i => (i + 1) % patternItems.length)}
                            className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            Next<ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Desktop grid */}
                  <div className="hidden md:block p-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {patternItems.map(item => <div key={item.key}>{item.card}</div>)}
                      {!hasTimeData && riskDays.length===0 && strongDays.length===0 && (
                        <div className="col-span-2 text-center text-xs text-slate-400 py-4">Add entry time to your trades to unlock time-of-day pattern analysis.</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Insight cards — 6 cards, carousel on mobile */}
            {(() => {
              const ohDays = sums.filter(d=>d.avgLossDurMs>0&&d.avgProfitDurMs>0&&d.avgLossDurMs>d.avgProfitDurMs*1.3);
              const insightCards = [
                {
                  key: 'exits',
                  node: (
                    <div className={`rounded-lg p-2 border flex gap-2 items-start h-full ${isOverHolding?'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30':'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'}`}>
                      <span className="text-base shrink-0">{isOverHolding?'🚨':'✅'}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 leading-tight">{isOverHolding?'Holding Losses Too Long':'Exits Are Disciplined'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {isOverHolding?`Losing trades held ${fmtDur(avgLossDurMs-avgProfDurMs)} longer than winners. Set a time stop.`:`Losses avg ${fmtDur(avgLossDurMs)}, equal or shorter than profit holds.`}
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'profit-window',
                  node: (
                    <div className="rounded-lg p-2 border bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 flex gap-2 items-start h-full">
                      <span className="text-base shrink-0">⏱️</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 leading-tight">Your Profit Window</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Winners avg {fmtDur(avgProfDurMs)}.{shortestProfit?.durationLabel&&shortestProfit.durationLabel!=='-'?` Fastest: ${shortestProfit.durationLabel}.`:''} Book near {fmtDur(avgProfDurMs)}.
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'overhold-days',
                  node: (
                    <div className={`rounded-lg p-2 border flex gap-2 items-start h-full ${ohDays.length>sums.length/2?'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30':'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'}`}>
                      <span className="text-base shrink-0">📅</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 leading-tight">Over-holding Days</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {ohDays.length===0?'No over-holding. Strong discipline!':`${ohDays.length} day${ohDays.length>1?'s':''} held losses 30%+ longer: ${ohDays.slice(0,3).map(d=>d.label).join(', ')}.`}
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'sweet-spot',
                  node: (
                    <div className={`rounded-lg p-2 border flex gap-2 items-start h-full ${bestBucket[1].wins>0?'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30':'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                      <span className="text-base shrink-0">🎯</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 leading-tight">Best Holding Sweet Spot</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {(bestBucket[1].wins+bestBucket[1].losses)>0
                            ?`Best win rate in ${bestBucket[0]} (${((bestBucket[1].wins/(bestBucket[1].wins+bestBucket[1].losses))*100).toFixed(0)}%). Target exits here.`
                            :'Add more trades to find your optimal holding duration.'}
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'time-stop',
                  node: (
                    <div className="rounded-lg p-2 border bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 flex gap-2 items-start h-full">
                      <span className="text-base shrink-0">💡</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 leading-tight">Time-based Stop Rule</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          If no move within {fmtDur(avgProfDurMs)}, exit. Winners resolve quickly in your data.
                        </p>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'grade',
                  node: (
                    <div className={`rounded-lg p-2 border flex gap-2 items-start h-full ${grade==='A'||grade==='B'?'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30':'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30'}`}>
                      <span className="text-base shrink-0">{grade==='A'?'🏆':grade==='B'?'⭐':grade==='C'?'📈':'🚨'}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 leading-tight">Exit Grade: {grade}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {grade==='A'?'Excellent! Losses cut as fast as profits.'
                          :grade==='B'?'Good discipline. Minor over-holding tendency.'
                          :grade==='C'?'Moderate over-holding. Use time-based exits.'
                          :'Critical over-holding. Implement strict time stops.'}
                        </p>
                      </div>
                    </div>
                  )
                },
              ];
              const safeInsightIdx = insightCarouselIndex % insightCards.length;
              return (
                <>
                  {/* Mobile carousel */}
                  <div className="md:hidden border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trade Insights</span>
                      <span className="text-[10px] text-slate-400">{safeInsightIdx + 1}/{insightCards.length}</span>
                    </div>
                    <div className="px-3 py-2">{insightCards[safeInsightIdx].node}</div>
                    <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      <button data-testid="button-insight-carousel-prev"
                        onClick={() => setInsightCarouselIndex(i => (i - 1 + insightCards.length) % insightCards.length)}
                        className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" />Prev
                      </button>
                      <div className="flex gap-1">
                        {insightCards.map((_, i) => (
                          <button key={i} data-testid={`button-insight-dot-${i}`} onClick={() => setInsightCarouselIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === safeInsightIdx ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        ))}
                      </div>
                      <button data-testid="button-insight-carousel-next"
                        onClick={() => setInsightCarouselIndex(i => (i + 1) % insightCards.length)}
                        className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        Next<ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Desktop 3-col grid */}
                  <div className="hidden md:grid md:grid-cols-3 gap-4">
                    {insightCards.map(c => (
                      <div key={c.key} className="[&>*]:!rounded-2xl [&>*]:!p-4">{c.node}</div>
                    ))}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
  
}
