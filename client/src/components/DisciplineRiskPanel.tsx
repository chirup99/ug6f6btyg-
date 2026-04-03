import { useState, useEffect } from "react";
import { Shield, Brain, Flame, Clock } from "lucide-react";

interface DisciplineRiskPanelProps {
  tradingDataByDate: Record<string, any>;
  filteredHeatmapData: Record<string, any>;
}

const BRUCE_LEE_QUOTES = [
  {
    quote: "Be like water making its way through cracks. Do not be assertive, but adjust to the object, and you shall find a way round or through it.",
    mindset: "The market is like water — it flows where it flows. Don't fight it, adapt to it. Rigid traders break. Flexible traders profit.",
  },
  {
    quote: "Empty your mind, be formless, shapeless — like water. You put water into a cup, it becomes the cup.",
    mindset: "Enter each trade with no bias. A bull or bear? Whatever the market is — become it. Your opinion is irrelevant; price action is truth.",
  },
  {
    quote: "The successful warrior is the average man, with laser-like focus.",
    mindset: "You don't need to catch every move. One perfect setup, full focus, clean execution — that beats 10 impulsive trades every time.",
  },
  {
    quote: "Notice that the stiffest tree is most easily cracked, while the bamboo or willow survives by bending with the wind.",
    mindset: "A trader who clings to a losing position because he 'knows' he's right will break. The one who accepts the market and adapts will survive.",
  },
  {
    quote: "Knowing is not enough, we must apply. Willing is not enough, we must do.",
    mindset: "You've read all the books. You know the rules. But do you follow your stop-loss when the trade goes against you? Execution is everything.",
  },
];

export function DisciplineRiskPanel({
  tradingDataByDate,
  filteredHeatmapData,
}: DisciplineRiskPanelProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [marketStatus, setMarketStatus] = useState<{
    label: string;
    color: string;
    session: string;
    tip: string;
  }>({ label: "", color: "", session: "", tip: "" });

  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const h = ist.getHours();
      const m = ist.getMinutes();
      const totalMin = h * 60 + m;
      const day = ist.getDay();
      const isWeekday = day >= 1 && day <= 5;

      if (!isWeekday) {
        setMarketStatus({ label: "Market Closed", color: "text-slate-300", session: "Weekend", tip: "Use the weekend to review your journal, study setups, and plan next week." });
        return;
      }

      // NSE/BSE timings
      const preOpen = 9 * 60;           // 9:00 AM
      const marketOpen = 9 * 60 + 15;   // 9:15 AM
      const primeEnd = 11 * 60 + 30;    // 11:30 AM
      const lunchStart = 11 * 60 + 30;  // 11:30 AM
      const lunchEnd = 13 * 60 + 30;    // 1:30 PM
      const afternoonEnd = 15 * 60 + 15;// 3:15 PM
      const closingStart = 15 * 60 + 15;// 3:15 PM
      const marketClose = 15 * 60 + 30; // 3:30 PM

      if (totalMin < preOpen) {
        setMarketStatus({ label: "Pre-Market", color: "text-amber-300", session: "Preparation", tip: "Review yesterday's trades, mark key levels, plan max 3 setups for today." });
      } else if (totalMin < marketOpen) {
        setMarketStatus({ label: "Pre-Open Session", color: "text-amber-300", session: "9:00–9:15 AM", tip: "Pre-open order matching. Don't trade yet — watch bid/ask to gauge sentiment." });
      } else if (totalMin < primeEnd) {
        setMarketStatus({ label: "🟢 Prime Session", color: "text-emerald-300", session: "9:15–11:30 AM", tip: "Highest volume & volatility. Best time for momentum and breakout trades." });
      } else if (totalMin < lunchEnd) {
        setMarketStatus({ label: "⚠️ Lunch Lull", color: "text-amber-300", session: "11:30 AM–1:30 PM", tip: "Low volume & choppy price action. Avoid new entries. Review open positions." });
      } else if (totalMin < afternoonEnd) {
        setMarketStatus({ label: "🟡 Afternoon Session", color: "text-yellow-300", session: "1:30–3:15 PM", tip: "Moderate volume picks up. Good for trend continuation trades. Stay disciplined." });
      } else if (totalMin < marketClose) {
        setMarketStatus({ label: "🔴 Closing Volatility", color: "text-red-300", session: "3:15–3:30 PM", tip: "High volatility in final 15 min. Institutional squaring-off. Avoid new trades." });
      } else {
        setMarketStatus({ label: "Market Closed", color: "text-slate-300", session: "After Close", tip: "Log all trades, note emotions, review what worked and what didn't." });
      }
    };

    updateMarketStatus();
    const timer = setInterval(updateMarketStatus, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(i => (i + 1) % BRUCE_LEE_QUOTES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const allData = Object.values(tradingDataByDate).filter(
    (data: any) =>
      data &&
      data.tradingTags &&
      Array.isArray(data.tradingTags) &&
      data.performanceMetrics,
  );

  const renderContent = () => {
    if (allData.length === 0) {
      return (
        <div className="bg-white/10 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-medium">Ready for Discipline Analysis</p>
          <p className="opacity-80 text-sm">Start building your trading history!</p>
        </div>
      );
    }

    const last7Dates = Object.keys(filteredHeatmapData).sort().slice(-7);
    let last7DaysTrades = 0;
    allData.forEach((data: any) => {
      if (last7Dates.includes(data.date)) {
        last7DaysTrades += data.performanceMetrics.totalTrades;
      }
    });

    const disciplineMetrics = {
      plannedTrades: 0, emotionalTrades: 0, consistentDays: 0,
      riskManagedTrades: 0, totalDays: allData.length, avgTradesPerDay: 0,
      winStreaks: 0, lossStreaks: 0,
    };

    const disciplineInsights: any[] = [];
    let totalTrades = 0, consecutiveWins = 0, consecutiveLosses = 0;
    let maxWinStreak = 0, maxLossStreak = 0;

    allData.forEach((data: any) => {
      const tags = data.tradingTags;
      const pnl = data.performanceMetrics.netPnL;
      const trades = data.performanceMetrics.totalTrades;
      totalTrades += trades;

      if (tags.includes("planned") || tags.includes("setup") || tags.includes("strategy")) {
        disciplineMetrics.plannedTrades++;
      }

      const emotionalTags = ["fomo", "fear", "greedy", "revenge", "impatient", "unplanned", "overtrading"];
      if (tags.some((tag: string) => emotionalTags.includes(tag.toLowerCase()))) {
        disciplineMetrics.emotionalTrades++;
      }

      if (pnl > 0) {
        consecutiveWins++;
        consecutiveLosses = 0;
        maxWinStreak = Math.max(maxWinStreak, consecutiveWins);
      } else if (pnl < 0) {
        consecutiveLosses++;
        consecutiveWins = 0;
        maxLossStreak = Math.max(maxLossStreak, consecutiveLosses);
      }

      if (trades <= 5) disciplineMetrics.consistentDays++;
    });

    disciplineMetrics.avgTradesPerDay = totalTrades / disciplineMetrics.totalDays;
    disciplineMetrics.winStreaks = maxWinStreak;
    disciplineMetrics.lossStreaks = maxLossStreak;

    const plannedRatio = (disciplineMetrics.plannedTrades / disciplineMetrics.totalDays) * 100;
    const emotionalRatio = (disciplineMetrics.emotionalTrades / disciplineMetrics.totalDays) * 100;
    const consistencyRatio = (disciplineMetrics.consistentDays / disciplineMetrics.totalDays) * 100;

    if (plannedRatio > 70) {
      disciplineInsights.push({ type: "success", icon: "🎯", title: "Excellent Planning", message: `${plannedRatio.toFixed(0)}% planned trades. Keep this discipline — most retail traders don't have a plan at all.` });
    } else if (plannedRatio < 30) {
      disciplineInsights.push({ type: "warning", icon: "⚠️", title: "Planning Needed", message: `Only ${plannedRatio.toFixed(0)}% planned trades. Tag trades with "planned" or "setup" when you follow your system.` });
    }

    if (emotionalRatio > 40) {
      disciplineInsights.push({ type: "danger", icon: "🚨", title: "Emotional Trading Alert", message: `${emotionalRatio.toFixed(0)}% emotional sessions detected (FOMO, revenge, greed). The enemy is within — pause and breathe before entering.` });
    } else if (emotionalRatio < 15 && allData.length >= 5) {
      disciplineInsights.push({ type: "success", icon: "🧠", title: "Strong Mental Discipline", message: `Only ${emotionalRatio.toFixed(0)}% emotional sessions. You're keeping the enemy within in check.` });
    }

    if (disciplineMetrics.avgTradesPerDay > 8) {
      disciplineInsights.push({ type: "warning", icon: "⚡", title: "Overtrading Risk", message: `Avg ${disciplineMetrics.avgTradesPerDay.toFixed(1)} trades/day is too many. Fewer, higher-quality setups beats volume every time.` });
    }

    if (maxLossStreak > 3) {
      disciplineInsights.push({ type: "danger", icon: "🛑", title: "Loss Streak Warning", message: `Max ${maxLossStreak}-day loss streak detected. After 3 consecutive losses, reduce position size by 50% and review your edge.` });
    }

    if (consistencyRatio > 80) {
      disciplineInsights.push({ type: "success", icon: "⭐", title: "Great Consistency", message: `${consistencyRatio.toFixed(0)}% consistent trading days. You're not overtrading. That's a professional edge.` });
    }

    const tips = [
      { icon: "📝", title: "Pre-Market Routine (9:00–9:15 AM)", tip: "Before market opens: check global cues, mark support/resistance, write down max 3 trade setups. No plan = no trade." },
      { icon: "💰", title: "Risk Per Trade (2% Rule)", tip: "Never risk more than 1–2% of your capital on a single trade. One big loss should never end your trading day." },
      { icon: "🕐", title: "Indian Market Prime Hours", tip: "Best entries: 9:15–11:30 AM (momentum) and 1:30–3:15 PM (trend continuation). Avoid 11:30 AM–1:30 PM lunch lull — choppy and trappy." },
      { icon: "🛑", title: "Daily Loss Limit (Circuit Breaker)", tip: "Set a hard stop at -2% of capital for the day. If hit, close everything and log out. Tomorrow is always another trade." },
      { icon: "📏", title: "Position Sizing Formula", tip: "Quantity = (Capital × Risk%) ÷ (Entry − Stop Loss). Never size based on conviction — always size based on risk." },
      { icon: "🔁", title: "The Revenge Trade Trap", tip: "Lost ₹5,000? Don't immediately trade again to 'recover it'. This is your ego talking, not your edge. Walk away for 15 minutes." },
      { icon: "📓", title: "End-of-Day Journal", tip: "After market close, rate your discipline (1–10), note emotions felt, and tag every trade with a reason. Data beats memory." },
      { icon: "⚖️", title: "Wait for Confirmation", tip: "Don't anticipate, wait for confirmation. A candle close above resistance is worth more than guessing. FOMO kills accounts." },
    ];

    const currentQuote = BRUCE_LEE_QUOTES[quoteIndex];

    return (
      <div className="space-y-5">
        {/* Live Market Clock */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 opacity-70" />
            <div>
              <div className={`text-sm font-bold ${marketStatus.color}`}>{marketStatus.label}</div>
              <div className="text-xs opacity-60">{marketStatus.session} · NSE/BSE</div>
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-xs opacity-80 leading-snug">{marketStatus.tip}</p>
          </div>
        </div>

        {/* Discipline Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold">{plannedRatio.toFixed(0)}%</div>
            <div className="text-xs md:text-sm opacity-80">Planned Trades</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold">{disciplineMetrics.avgTradesPerDay.toFixed(1)}</div>
            <div className="text-xs md:text-sm opacity-80">Avg Trades/Day</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold">{consistencyRatio.toFixed(0)}%</div>
            <div className="text-xs md:text-sm opacity-80">Consistent Days</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/5">
            <div className="text-lg md:text-2xl font-bold text-red-400">{maxLossStreak}</div>
            <div className="text-xs md:text-sm opacity-80">Max Loss Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/5">
            <div className="text-lg md:text-2xl font-bold text-green-400">{maxWinStreak}</div>
            <div className="text-xs md:text-sm opacity-80">Max Win Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/5">
            <div className="text-lg md:text-2xl font-bold text-blue-400">{last7DaysTrades}</div>
            <div className="text-xs md:text-sm opacity-80">Trades (7D)</div>
          </div>
        </div>

        {/* Performance Insights + Tips */}
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Performance Insights
            </h4>
            <div className="space-y-2">
              {disciplineInsights.length > 0 ? (
                disciplineInsights.slice(0, 4).map((insight, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${
                    insight.type === "success" ? "bg-emerald-500/20 border-emerald-400/30"
                    : insight.type === "warning" ? "bg-amber-500/20 border-amber-400/30"
                    : "bg-red-500/20 border-red-400/30"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="text-lg">{insight.icon}</div>
                      <div>
                        <div className="font-medium text-sm">{insight.title}</div>
                        <div className="text-xs opacity-90 mt-0.5 leading-snug">{insight.message}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="opacity-80 text-sm">Insights will appear as you build trading history</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Discipline Tips
            </h4>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tips.map((rec, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className="text-lg">{rec.icon}</div>
                    <div>
                      <div className="font-medium text-xs">{rec.title}</div>
                      <div className="text-[11px] opacity-90 mt-0.5 leading-snug">{rec.tip}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bruce Lee — Trading Mindset / Enemy Within */}
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🥋</span>
            <div>
              <h4 className="text-sm font-bold">Bruce Lee · Trading Mindset</h4>
              <p className="text-[10px] opacity-60 uppercase tracking-wider">Be Like Water · The Enemy Within</p>
            </div>
            <div className="ml-auto flex gap-1">
              {BRUCE_LEE_QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuoteIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === quoteIndex ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </div>
          <blockquote className="border-l-2 border-white/40 pl-4 mb-3">
            <p className="text-sm italic opacity-90 leading-relaxed">"{currentQuote.quote}"</p>
            <footer className="text-[10px] opacity-50 mt-1">— Bruce Lee</footer>
          </blockquote>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[11px] opacity-90 leading-snug">
              <span className="font-bold text-amber-300">⚔️ Enemy Within: </span>
              {currentQuote.mindset}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="col-span-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-2xl mt-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Discipline & Risk Management</h3>
          <p className="opacity-80">Build consistent, profitable trading habits</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
