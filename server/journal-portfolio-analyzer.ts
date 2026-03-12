export interface TradeEntry {
  id?: string;
  date: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  tradeType: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  pnl?: number;
  pnlPercentage?: number;
  stopLoss?: number;
  target?: number;
  notes?: string;
  strategy?: string;
  timeframe?: string;
  status?: 'open' | 'closed' | 'pending';
}

export interface RiskMetrics {
  totalCapital: number;
  totalExposure: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentDrawdown: number;
  riskPerTrade: number;
  averageRiskReward: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  valueAtRisk: number;
  beta: number;
  volatility: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  lossRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  avgHoldingPeriod: string;
  netPnL: number;
  grossProfit: number;
  grossLoss: number;
  roi: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
}

export interface StockAnalysis {
  symbol: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  averagePnL: number;
  bestTrade: number;
  worstTrade: number;
}

export interface TimeAnalysis {
  byDayOfWeek: Record<string, { trades: number; wins: number; pnl: number }>;
  byTimeOfDay: Record<string, { trades: number; wins: number; pnl: number }>;
  byMonth: Record<string, { trades: number; wins: number; pnl: number }>;
  bestDay: string;
  worstDay: string;
  bestMonth: string;
}

export interface StrategyAnalysis {
  strategy: string;
  trades: number;
  wins: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  profitFactor: number;
}

export interface ComprehensiveJournalAnalysis {
  summary: {
    period: string;
    totalTrades: number;
    activeStocks: number;
    tradingDays: number;
  };
  performance: PerformanceMetrics;
  risk: RiskMetrics;
  stockBreakdown: StockAnalysis[];
  timeAnalysis: TimeAnalysis;
  strategyAnalysis: StrategyAnalysis[];
  insights: string[];
  recommendations: string[];
  aiSummary: string;
}

export class JournalPortfolioAnalyzer {
  
  analyzeJournal(trades: TradeEntry[], initialCapital: number = 100000): ComprehensiveJournalAnalysis {
    console.log(`[JOURNAL-ANALYZER] Analyzing ${trades.length} trades`);

    const closedTrades = trades.filter(t => t.status !== 'open' && t.pnl !== undefined);
    
    const performance = this.calculatePerformanceMetrics(closedTrades);
    const risk = this.calculateRiskMetrics(closedTrades, initialCapital);
    const stockBreakdown = this.analyzeByStock(closedTrades);
    const timeAnalysis = this.analyzeByTime(closedTrades);
    const strategyAnalysis = this.analyzeByStrategy(closedTrades);
    const insights = this.generateInsights(performance, risk, stockBreakdown);
    const recommendations = this.generateRecommendations(performance, risk, stockBreakdown, timeAnalysis);
    
    const uniqueDates = new Set(trades.map(t => t.date.split('T')[0]));
    const uniqueStocks = new Set(trades.map(t => t.symbol));
    
    const earliestDate = trades.length > 0 ? trades.reduce((min, t) => t.date < min ? t.date : min, trades[0].date) : '';
    const latestDate = trades.length > 0 ? trades.reduce((max, t) => t.date > max ? t.date : max, trades[0].date) : '';
    
    const aiSummary = this.generateAISummary(performance, risk, stockBreakdown, timeAnalysis, strategyAnalysis);

    return {
      summary: {
        period: earliestDate && latestDate ? `${earliestDate.split('T')[0]} to ${latestDate.split('T')[0]}` : 'No data',
        totalTrades: trades.length,
        activeStocks: uniqueStocks.size,
        tradingDays: uniqueDates.size
      },
      performance,
      risk,
      stockBreakdown,
      timeAnalysis,
      strategyAnalysis,
      insights,
      recommendations,
      aiSummary
    };
  }

  private calculatePerformanceMetrics(trades: TradeEntry[]): PerformanceMetrics {
    if (trades.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    const breakEvenTrades = trades.filter(t => (t.pnl || 0) === 0);

    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const netPnL = grossProfit - grossLoss;

    const averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0;

    const winRate = (winningTrades.length / trades.length) * 100;
    const lossRate = (losingTrades.length / trades.length) * 100;
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    const expectancy = (winRate / 100 * averageWin) - (lossRate / 100 * averageLoss);

    const { consecutiveWins, consecutiveLosses, currentStreak } = this.calculateStreaks(trades);

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      lossRate: Math.round(lossRate * 100) / 100,
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      largestWin: Math.round(largestWin * 100) / 100,
      largestLoss: Math.round(largestLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      avgHoldingPeriod: 'N/A',
      netPnL: Math.round(netPnL * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossLoss: Math.round(grossLoss * 100) / 100,
      roi: 0,
      consecutiveWins,
      consecutiveLosses,
      currentStreak
    };
  }

  private calculateStreaks(trades: TradeEntry[]): { consecutiveWins: number; consecutiveLosses: number; currentStreak: { type: 'win' | 'loss' | 'none'; count: number } } {
    let maxWins = 0, maxLosses = 0;
    let currentWins = 0, currentLosses = 0;

    for (const trade of trades) {
      if ((trade.pnl || 0) > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else if ((trade.pnl || 0) < 0) {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    }

    let currentStreakType: 'win' | 'loss' | 'none' = 'none';
    let currentStreakCount = 0;

    for (let i = trades.length - 1; i >= 0; i--) {
      const pnl = trades[i].pnl || 0;
      if (i === trades.length - 1) {
        currentStreakType = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'none';
        if (currentStreakType !== 'none') currentStreakCount = 1;
      } else {
        const prevType = pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'none';
        if (prevType === currentStreakType && prevType !== 'none') {
          currentStreakCount++;
        } else {
          break;
        }
      }
    }

    return {
      consecutiveWins: maxWins,
      consecutiveLosses: maxLosses,
      currentStreak: { type: currentStreakType, count: currentStreakCount }
    };
  }

  private calculateRiskMetrics(trades: TradeEntry[], initialCapital: number): RiskMetrics {
    if (trades.length === 0) {
      return this.getEmptyRiskMetrics();
    }

    const returns = trades.map(t => ((t.pnl || 0) / initialCapital) * 100);
    
    let equity = initialCapital;
    let peak = initialCapital;
    let maxDrawdown = 0;
    const equityCurve: number[] = [initialCapital];

    for (const trade of trades) {
      equity += (trade.pnl || 0);
      equityCurve.push(equity);
      peak = Math.max(peak, equity);
      const drawdown = peak - equity;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    const currentDrawdown = peak - equity;
    const maxDrawdownPercent = (maxDrawdown / peak) * 100;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const volatility = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);

    const riskFreeRate = 0.06 / 252;
    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;

    const negativeReturns = returns.filter(r => r < 0);
    const downsideDeviation = negativeReturns.length > 0 
      ? Math.sqrt(negativeReturns.map(r => Math.pow(r, 2)).reduce((a, b) => a + b, 0) / negativeReturns.length)
      : 0;
    const sortinoRatio = downsideDeviation > 0 ? (avgReturn - riskFreeRate) / downsideDeviation : 0;

    const annualizedReturn = avgReturn * 252;
    const calmarRatio = maxDrawdownPercent > 0 ? annualizedReturn / maxDrawdownPercent : 0;

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(returns.length * 0.05);
    const valueAtRisk = returns.length > 0 ? Math.abs(sortedReturns[var95Index] || 0) : 0;

    const totalExposure = trades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
    const avgRiskReward = trades
      .filter(t => t.stopLoss && t.target && t.entryPrice)
      .map(t => {
        const risk = Math.abs(t.entryPrice - (t.stopLoss || t.entryPrice));
        const reward = Math.abs((t.target || t.entryPrice) - t.entryPrice);
        return risk > 0 ? reward / risk : 0;
      })
      .reduce((sum, rr, _, arr) => sum + rr / arr.length, 0);

    return {
      totalCapital: initialCapital,
      totalExposure: Math.round(totalExposure),
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
      currentDrawdown: Math.round(currentDrawdown * 100) / 100,
      riskPerTrade: Math.round((initialCapital * 0.02) * 100) / 100,
      averageRiskReward: Math.round(avgRiskReward * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      calmarRatio: Math.round(calmarRatio * 100) / 100,
      valueAtRisk: Math.round(valueAtRisk * 100) / 100,
      beta: 1,
      volatility: Math.round(volatility * 100) / 100
    };
  }

  private analyzeByStock(trades: TradeEntry[]): StockAnalysis[] {
    const stockMap = new Map<string, TradeEntry[]>();
    
    for (const trade of trades) {
      if (!stockMap.has(trade.symbol)) {
        stockMap.set(trade.symbol, []);
      }
      stockMap.get(trade.symbol)!.push(trade);
    }

    return Array.from(stockMap.entries()).map(([symbol, stockTrades]) => {
      const wins = stockTrades.filter(t => (t.pnl || 0) > 0);
      const losses = stockTrades.filter(t => (t.pnl || 0) < 0);
      const totalPnL = stockTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const pnls = stockTrades.map(t => t.pnl || 0);

      return {
        symbol,
        trades: stockTrades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: Math.round((wins.length / stockTrades.length) * 10000) / 100,
        totalPnL: Math.round(totalPnL * 100) / 100,
        averagePnL: Math.round((totalPnL / stockTrades.length) * 100) / 100,
        bestTrade: Math.round(Math.max(...pnls) * 100) / 100,
        worstTrade: Math.round(Math.min(...pnls) * 100) / 100
      };
    }).sort((a, b) => b.totalPnL - a.totalPnL);
  }

  private analyzeByTime(trades: TradeEntry[]): TimeAnalysis {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const byDayOfWeek: Record<string, { trades: number; wins: number; pnl: number }> = {};
    const byTimeOfDay: Record<string, { trades: number; wins: number; pnl: number }> = {};
    const byMonth: Record<string, { trades: number; wins: number; pnl: number }> = {};

    for (const day of dayNames) {
      byDayOfWeek[day] = { trades: 0, wins: 0, pnl: 0 };
    }

    for (const trade of trades) {
      const date = new Date(trade.date);
      const dayName = dayNames[date.getDay()];
      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const hour = date.getHours();
      const timeSlot = hour < 10 ? 'Morning (9-10)' : hour < 12 ? 'Late Morning (10-12)' : hour < 14 ? 'Afternoon (12-2)' : 'Late Afternoon (2-4)';

      if (!byDayOfWeek[dayName]) byDayOfWeek[dayName] = { trades: 0, wins: 0, pnl: 0 };
      byDayOfWeek[dayName].trades++;
      if ((trade.pnl || 0) > 0) byDayOfWeek[dayName].wins++;
      byDayOfWeek[dayName].pnl += (trade.pnl || 0);

      if (!byTimeOfDay[timeSlot]) byTimeOfDay[timeSlot] = { trades: 0, wins: 0, pnl: 0 };
      byTimeOfDay[timeSlot].trades++;
      if ((trade.pnl || 0) > 0) byTimeOfDay[timeSlot].wins++;
      byTimeOfDay[timeSlot].pnl += (trade.pnl || 0);

      if (!byMonth[month]) byMonth[month] = { trades: 0, wins: 0, pnl: 0 };
      byMonth[month].trades++;
      if ((trade.pnl || 0) > 0) byMonth[month].wins++;
      byMonth[month].pnl += (trade.pnl || 0);
    }

    const bestDay = Object.entries(byDayOfWeek).reduce((best, [day, data]) => 
      data.pnl > (byDayOfWeek[best]?.pnl || -Infinity) ? day : best, 'Monday');
    
    const worstDay = Object.entries(byDayOfWeek).reduce((worst, [day, data]) => 
      data.pnl < (byDayOfWeek[worst]?.pnl || Infinity) ? day : worst, 'Monday');
    
    const bestMonth = Object.entries(byMonth).reduce((best, [month, data]) => 
      data.pnl > (byMonth[best]?.pnl || -Infinity) ? month : best, Object.keys(byMonth)[0] || 'N/A');

    return { byDayOfWeek, byTimeOfDay, byMonth, bestDay, worstDay, bestMonth };
  }

  private analyzeByStrategy(trades: TradeEntry[]): StrategyAnalysis[] {
    const strategyMap = new Map<string, TradeEntry[]>();
    
    for (const trade of trades) {
      const strategy = trade.strategy || 'Unclassified';
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, []);
      }
      strategyMap.get(strategy)!.push(trade);
    }

    return Array.from(strategyMap.entries()).map(([strategy, strategyTrades]) => {
      const wins = strategyTrades.filter(t => (t.pnl || 0) > 0);
      const losses = strategyTrades.filter(t => (t.pnl || 0) < 0);
      const totalPnL = strategyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

      return {
        strategy,
        trades: strategyTrades.length,
        wins: wins.length,
        winRate: Math.round((wins.length / strategyTrades.length) * 10000) / 100,
        totalPnL: Math.round(totalPnL * 100) / 100,
        avgPnL: Math.round((totalPnL / strategyTrades.length) * 100) / 100,
        profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? Infinity : 0
      };
    }).sort((a, b) => b.totalPnL - a.totalPnL);
  }

  private generateInsights(performance: PerformanceMetrics, risk: RiskMetrics, stocks: StockAnalysis[]): string[] {
    const insights: string[] = [];

    if (performance.winRate >= 60) {
      insights.push(`Strong win rate of ${performance.winRate}% - your trading strategy is working well`);
    } else if (performance.winRate >= 50) {
      insights.push(`Average win rate of ${performance.winRate}% - there's room for improvement in entry/exit timing`);
    } else {
      insights.push(`Low win rate of ${performance.winRate}% - consider reviewing your trading criteria`);
    }

    if (performance.profitFactor > 2) {
      insights.push(`Excellent profit factor of ${performance.profitFactor} - your winners significantly outweigh losers`);
    } else if (performance.profitFactor > 1.5) {
      insights.push(`Good profit factor of ${performance.profitFactor} - profitable trading strategy`);
    } else if (performance.profitFactor > 1) {
      insights.push(`Marginal profit factor of ${performance.profitFactor} - focus on improving risk management`);
    } else {
      insights.push(`Negative profit factor - losses exceed profits, needs strategy review`);
    }

    if (risk.maxDrawdownPercent > 20) {
      insights.push(`High maximum drawdown of ${risk.maxDrawdownPercent}% - consider tighter stop losses`);
    }

    if (performance.averageWin > Math.abs(performance.averageLoss) * 1.5) {
      insights.push(`Great risk-reward ratio - average wins are ${Math.round((performance.averageWin / Math.abs(performance.averageLoss)) * 100) / 100}x larger than losses`);
    }

    if (stocks.length > 0) {
      const bestStock = stocks[0];
      if (bestStock.winRate > 70) {
        insights.push(`${bestStock.symbol} is your best performer with ${bestStock.winRate}% win rate`);
      }
      const worstStock = stocks[stocks.length - 1];
      if (worstStock.totalPnL < 0) {
        insights.push(`Consider reducing exposure to ${worstStock.symbol} (loss of ₹${Math.abs(worstStock.totalPnL)})`);
      }
    }

    if (performance.consecutiveLosses >= 3) {
      insights.push(`Had ${performance.consecutiveLosses} consecutive losses - ensure you're not revenge trading`);
    }

    if (performance.currentStreak.type === 'win' && performance.currentStreak.count >= 3) {
      insights.push(`On a ${performance.currentStreak.count}-trade winning streak! Stay disciplined.`);
    }

    return insights;
  }

  private generateRecommendations(
    performance: PerformanceMetrics, 
    risk: RiskMetrics, 
    stocks: StockAnalysis[],
    time: TimeAnalysis
  ): string[] {
    const recommendations: string[] = [];

    if (performance.winRate < 50) {
      recommendations.push('Focus on improving entry criteria - wait for stronger confirmations');
      recommendations.push('Review losing trades to identify common patterns');
    }

    if (risk.maxDrawdownPercent > 15) {
      recommendations.push(`Reduce position sizes to limit drawdown (current max: ${risk.maxDrawdownPercent}%)`);
      recommendations.push('Consider using trailing stop losses to protect profits');
    }

    if (performance.averageLoss > performance.averageWin) {
      recommendations.push('Let winners run longer or tighten stop losses to improve risk-reward');
    }

    const bestStock = stocks.find(s => s.winRate > 60 && s.trades >= 5);
    if (bestStock) {
      recommendations.push(`Focus more on ${bestStock.symbol} where you have a ${bestStock.winRate}% edge`);
    }

    const bestDay = time.bestDay;
    const worstDay = time.worstDay;
    if (time.byDayOfWeek[worstDay]?.pnl < 0 && time.byDayOfWeek[worstDay]?.trades > 3) {
      recommendations.push(`Consider reducing trading on ${worstDay}s - historically your worst day`);
    }
    if (time.byDayOfWeek[bestDay]?.pnl > 0) {
      recommendations.push(`${bestDay}s are your most profitable day - focus more trades here`);
    }

    if (performance.consecutiveLosses >= 3) {
      recommendations.push('Implement a rule: Stop trading after 3 consecutive losses and review');
    }

    recommendations.push('Keep maintaining your trading journal for continued improvement');

    return recommendations.slice(0, 6);
  }

  private generateAISummary(
    performance: PerformanceMetrics,
    risk: RiskMetrics,
    stocks: StockAnalysis[],
    time: TimeAnalysis,
    strategies: StrategyAnalysis[]
  ): string {
    let summary = `## Trading Journal Analysis Summary\n\n`;

    summary += `### Overall Performance\n`;
    summary += `You have made **${performance.totalTrades} trades** with a **${performance.winRate}% win rate**. `;
    
    if (performance.netPnL >= 0) {
      summary += `Your net profit is **₹${performance.netPnL.toLocaleString()}** with a profit factor of ${performance.profitFactor}.\n\n`;
    } else {
      summary += `Your net loss is **₹${Math.abs(performance.netPnL).toLocaleString()}**. Focus on improving risk management.\n\n`;
    }

    summary += `### Risk Assessment\n`;
    summary += `- Maximum Drawdown: ${risk.maxDrawdownPercent}%\n`;
    summary += `- Current Drawdown: ${risk.currentDrawdown > 0 ? `₹${risk.currentDrawdown.toLocaleString()}` : 'None'}\n`;
    summary += `- Risk-Adjusted Return (Sharpe): ${risk.sharpeRatio}\n\n`;

    if (stocks.length > 0) {
      summary += `### Top Performing Stocks\n`;
      const topStocks = stocks.slice(0, 3);
      topStocks.forEach((s, i) => {
        summary += `${i + 1}. **${s.symbol}**: ${s.trades} trades, ${s.winRate}% win rate, ₹${s.totalPnL.toLocaleString()} P&L\n`;
      });
      summary += `\n`;
    }

    if (strategies.length > 0 && strategies[0].strategy !== 'Unclassified') {
      summary += `### Strategy Performance\n`;
      strategies.slice(0, 2).forEach(s => {
        summary += `- **${s.strategy}**: ${s.winRate}% win rate, ₹${s.totalPnL.toLocaleString()} P&L\n`;
      });
      summary += `\n`;
    }

    summary += `### Key Takeaways\n`;
    summary += `- Best trading day: **${time.bestDay}**\n`;
    summary += `- Best trading month: **${time.bestMonth}**\n`;
    summary += `- Longest winning streak: ${performance.consecutiveWins} trades\n`;
    summary += `- Average win: ₹${performance.averageWin.toLocaleString()} | Average loss: ₹${performance.averageLoss.toLocaleString()}\n`;

    return summary;
  }

  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      lossRate: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      avgHoldingPeriod: 'N/A',
      netPnL: 0,
      grossProfit: 0,
      grossLoss: 0,
      roi: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      currentStreak: { type: 'none', count: 0 }
    };
  }

  private getEmptyRiskMetrics(): RiskMetrics {
    return {
      totalCapital: 100000,
      totalExposure: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      currentDrawdown: 0,
      riskPerTrade: 2000,
      averageRiskReward: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      valueAtRisk: 0,
      beta: 1,
      volatility: 0
    };
  }

  formatAnalysisForAI(analysis: ComprehensiveJournalAnalysis): string {
    return analysis.aiSummary + '\n\n' + 
      '### Insights\n' + analysis.insights.map(i => `- ${i}`).join('\n') + '\n\n' +
      '### Recommendations\n' + analysis.recommendations.map(r => `- ${r}`).join('\n');
  }
}

export const journalPortfolioAnalyzer = new JournalPortfolioAnalyzer();
