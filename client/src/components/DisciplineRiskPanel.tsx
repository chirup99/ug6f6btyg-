import { Shield } from "lucide-react";

interface DisciplineRiskPanelProps {
  tradingDataByDate: Record<string, any>;
  filteredHeatmapData: Record<string, any>;
}

export function DisciplineRiskPanel({
  tradingDataByDate,
  filteredHeatmapData,
}: DisciplineRiskPanelProps) {
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
          <p className="font-medium">
            Ready for Discipline Analysis
          </p>
          <p className="opacity-80 text-sm">
            Start building your trading history!
          </p>
        </div>
      );
    }

    // Calculate discipline metrics
    const last7Dates = Object.keys(filteredHeatmapData).sort().slice(-7);
    let last7DaysTrades = 0;
    allData.forEach((data: any) => {
      if (last7Dates.includes(data.date)) {
        last7DaysTrades += data.performanceMetrics.totalTrades;
      }
    });

    const disciplineMetrics = {
      plannedTrades: 0,
      emotionalTrades: 0,
      consistentDays: 0,
      riskManagedTrades: 0,
      totalDays: allData.length,
      avgTradesPerDay: 0,
      winStreaks: 0,
      lossStreaks: 0,
    };

    const disciplineInsights: any[] = [];
    let totalTrades = 0;
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    allData.forEach((data: any, idx: number) => {
      const tags = data.tradingTags;
      const pnl = data.performanceMetrics.netPnL;
      const trades =
        data.performanceMetrics.totalTrades;
      totalTrades += trades;

      // Check for planned trading
      if (
        tags.includes("planned") ||
        tags.includes("setup") ||
        tags.includes("strategy")
      ) {
        disciplineMetrics.plannedTrades++;
      }

      // Check for emotional trading
      const emotionalTags = [
        "fomo",
        "fear",
        "greedy",
        "revenge",
        "impatient",
        "unplanned",
      ];
      if (
        tags.some((tag: string) =>
          emotionalTags.includes(tag.toLowerCase()),
        )
      ) {
        disciplineMetrics.emotionalTrades++;
      }

      // Track win/loss streaks
      if (pnl > 0) {
        consecutiveWins++;
        consecutiveLosses = 0;
        maxWinStreak = Math.max(
          maxWinStreak,
          consecutiveWins,
        );
      } else if (pnl < 0) {
        consecutiveLosses++;
        consecutiveWins = 0;
        maxLossStreak = Math.max(
          maxLossStreak,
          consecutiveLosses,
        );
      }

      // Check for consistent trade size (discipline indicator)
      if (trades <= 5) {
        // Not overtrading
        disciplineMetrics.consistentDays++;
      }
    });

    disciplineMetrics.avgTradesPerDay =
      totalTrades / disciplineMetrics.totalDays;
    disciplineMetrics.winStreaks = maxWinStreak;
    disciplineMetrics.lossStreaks = maxLossStreak;

    // Generate discipline insights
    const plannedRatio =
      (disciplineMetrics.plannedTrades /
        disciplineMetrics.totalDays) *
      100;
    const emotionalRatio =
      (disciplineMetrics.emotionalTrades /
        disciplineMetrics.totalDays) *
      100;
    const consistencyRatio =
      (disciplineMetrics.consistentDays /
        disciplineMetrics.totalDays) *
      100;

    if (plannedRatio > 70) {
      disciplineInsights.push({
        type: "success",
        icon: "🎯",
        title: "Excellent Planning",
        message: `${plannedRatio.toFixed(
          0,
        )}% of your trades are well-planned. Keep this discipline!`,
      });
    } else if (plannedRatio < 30) {
      disciplineInsights.push({
        type: "warning",
        icon: "⚠️",
        title: "Planning Needed",
        message: `Only ${plannedRatio.toFixed(
          0,
        )}% planned trades. Create setups before trading.`,
      });
    }

    if (emotionalRatio > 40) {
      disciplineInsights.push({
        type: "danger",
        icon: "🚨",
        title: "Emotional Trading Alert",
        message: `${emotionalRatio.toFixed(
          0,
        )}% emotional trades detected. Practice mindfulness.`,
      });
    }

    if (disciplineMetrics.avgTradesPerDay > 8) {
      disciplineInsights.push({
        type: "warning",
        icon: "⚡",
        title: "Overtrading Risk",
        message: `Avg ${disciplineMetrics.avgTradesPerDay.toFixed(
          1,
        )} trades/day. Consider quality over quantity.`,
      });
    }

    if (maxLossStreak > 3) {
      disciplineInsights.push({
        type: "danger",
        icon: "🛑",
        title: "Loss Streak Warning",
        message: `Max loss streak: ${maxLossStreak} days. Implement strict stop-loss rules.`,
      });
    }

    if (consistencyRatio > 80) {
      disciplineInsights.push({
        type: "success",
        icon: "⭐",
        title: "Great Consistency",
        message: `${consistencyRatio.toFixed(
          0,
        )}% consistent trading days. Excellent discipline!`,
      });
    }

    // Add professional recommendations
    const recommendations = [
      {
        icon: "📝",
        title: "Pre-Market Planning",
        tip: "Plan 3 trades max before market open with clear entry/exit rules",
      },
      {
        icon: "💰",
        title: "Risk Management",
        tip: "Never risk more than 2% of capital per trade",
      },
      {
        icon: "⏰",
        title: "Trading Hours",
        tip: "Trade only during high-volume hours (9:30-11:30 AM, 2:00-3:15 PM)",
      },
      {
        icon: "📊",
        title: "Position Sizing",
        tip: "Use consistent position sizes based on account balance",
      },
    ];

    return (
      <div className="space-y-4 md:space-y-6">
        {/* Discipline Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold">
              {plannedRatio.toFixed(0)}%
            </div>
            <div className="text-xs md:text-sm opacity-80">
              Planned Trades
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold">
              {disciplineMetrics.avgTradesPerDay.toFixed(
                1,
              )}
            </div>
            <div className="text-xs md:text-sm opacity-80">
              Avg Trades/Day
            </div>
          </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/5">
            <div className="text-lg md:text-2xl font-bold text-red-400">
              {maxLossStreak}
            </div>
            <div className="text-xs md:text-sm opacity-80">
              Max Loss Streak
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/5">
            <div className="text-lg md:text-2xl font-bold text-green-400">
              {maxWinStreak}
            </div>
            <div className="text-xs md:text-sm opacity-80">
              Max Win Streak
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/5">
            <div className="text-lg md:text-2xl font-bold text-blue-400">
              {last7DaysTrades}
            </div>
            <div className="text-xs md:text-sm opacity-80">
              Trades (7D)
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/5">
            <div className="text-lg md:text-2xl font-bold">
              {consistencyRatio.toFixed(0)}%
            </div>
            <div className="text-xs md:text-sm opacity-80">
              Consistent Days
            </div>
          </div>
        </div>

        {/* Discipline Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-4">
              📈 Performance Insights
            </h4>
            <div className="space-y-1">
              {disciplineInsights.length > 0 ? (
                disciplineInsights
                  .slice(0, 4)
                  .map((insight, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        insight.type === "success"
                          ? "bg-emerald-500/20 border-emerald-400/30"
                          : insight.type === "warning"
                            ? "bg-amber-500/20 border-amber-400/30"
                            : "bg-red-500/20 border-red-400/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl">
                          {insight.icon}
                        </div>
                        <div>
                          <div className="font-medium">
                            {insight.title}
                          </div>
                          <div className="text-sm opacity-90">
                            {insight.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">
                    📊
                  </div>
                  <p className="opacity-80">
                    Insights will appear as you build
                    trading history
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">
              🎯 Professional Tips
            </h4>
            <div className="space-y-1">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">
                      {rec.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {rec.title}
                      </div>
                      <div className="text-xs opacity-90 mt-1">
                        {rec.tip}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="col-span-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl mt-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold">
            Discipline & Risk Management
          </h3>
          <p className="opacity-80">
            Build consistent, profitable trading habits
          </p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
