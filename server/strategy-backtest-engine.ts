// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed

export interface BacktestPeriod {
  fromDate: string;
  toDate: string;
}

export interface IndicatorConfig {
  enabled: boolean;
  period?: number;
  oversold?: number;
  overbought?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  multiplier?: number;
}

export interface StrategyConfig {
  symbol: string;
  timeframe: string;
  backtestPeriod: BacktestPeriod;
  indicators: {
    rsi: IndicatorConfig;
    macd: IndicatorConfig;
    ema: IndicatorConfig;
    sma: IndicatorConfig;
    bollinger: IndicatorConfig;
  };
  entryConditions: {
    primary: string;
    secondary?: string;
    operator: 'AND' | 'OR';
  };
  exitConditions: {
    primary: string;
    secondary?: string;
    operator: 'AND' | 'OR';
  };
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
  };
}

export interface Trade {
  id: string;
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  pnl?: number;
  pnlPercent?: number;
  status: 'OPEN' | 'CLOSED';
  entryReason: string;
  exitReason?: string;
}

export interface BacktestSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  profitFactor: number;
  avgTradeDuration: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface BacktestResults {
  trades: Trade[];
  summary: BacktestSummary;
  equity: Array<{ timestamp: string; value: number }>;
}

export class StrategyBacktestEngine {
  private config: StrategyConfig;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  async runBacktest(): Promise<BacktestResults> {
    console.log('🚀 [STRATEGY-BACKTEST] Starting backtest for', this.config.symbol);
    
    try {
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData();
      
      // Calculate indicators
      const indicators = this.calculateIndicators(historicalData);
      
      // Execute strategy
      const trades = this.executeStrategy(historicalData, indicators);
      
      // Calculate summary statistics
      const summary = this.calculateSummary(trades);
      
      // Generate equity curve
      const equity = this.generateEquityCurve(trades);
      
      return {
        trades,
        summary,
        equity
      };
      
    } catch (error) {
      console.error('❌ [STRATEGY-BACKTEST] Error:', error);
      throw error;
    }
  }

  private async fetchHistoricalData() {
    console.log('📊 [STRATEGY-BACKTEST] Fetching historical data...');
    
    const fromDate = new Date(this.config.backtestPeriod.fromDate);
    const toDate = new Date(this.config.backtestPeriod.toDate);
    
    // Convert timeframe to appropriate format
    const timeframeMap: { [key: string]: string } = {
      '1': '1',
      '5': '5',
      '15': '15',
      '60': '60',
      '1D': 'D'
    };
    
    const resolution = timeframeMap[this.config.timeframe] || '1';
    
    try {
      const data = await fyersApi.getHistoricalData({
        symbol: this.config.symbol,
        resolution: resolution,
        date_format: '1',
        range_from: fromDate.toISOString().split('T')[0],
        range_to: toDate.toISOString().split('T')[0],
        cont_flag: '1'
      });
      
      console.log(`✅ [STRATEGY-BACKTEST] Fetched ${data.length} candles`);
      return data;
      
    } catch (error) {
      console.log('⚠️ [STRATEGY-BACKTEST] Fyers API unavailable, using mock data');
      
      // Generate mock historical data for demo
      const mockData = this.generateMockData(fromDate, toDate);
      console.log(`📈 [STRATEGY-BACKTEST] Generated ${mockData.length} mock candles`);
      return mockData;
    }
  }

  private generateMockData(fromDate: Date, toDate: Date) {
    const candles = [];
    const currentDate = new Date(fromDate);
    let basePrice = 3000; // Starting price
    
    while (currentDate <= toDate) {
      // Skip weekends for stock data
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const timestamp = Math.floor(currentDate.getTime() / 1000);
        
        // Generate realistic OHLC data with some volatility
        const volatility = 0.02; // 2% volatility
        const change = (Math.random() - 0.5) * 2 * volatility;
        
        const open = basePrice;
        const close = open * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.floor(Math.random() * 1000000) + 100000;
        
        candles.push([timestamp, open, high, low, close, volume]);
        basePrice = close;
      }
      
      // Increment by timeframe
      const timeframeMinutes = parseInt(this.config.timeframe) || 1;
      currentDate.setMinutes(currentDate.getMinutes() + timeframeMinutes);
    }
    
    return candles;
  }

  private calculateIndicators(data: any[]) {
    console.log('📈 [STRATEGY-BACKTEST] Calculating technical indicators...');
    
    const closes = data.map(candle => candle[4]); // Close prices
    const indicators: any = {};
    
    // Calculate RSI
    if (this.config.indicators.rsi.enabled) {
      indicators.rsi = this.calculateRSI(closes, this.config.indicators.rsi.period || 14);
    }
    
    // Calculate MACD
    if (this.config.indicators.macd.enabled) {
      indicators.macd = this.calculateMACD(
        closes,
        this.config.indicators.macd.fastPeriod || 12,
        this.config.indicators.macd.slowPeriod || 26,
        this.config.indicators.macd.signalPeriod || 9
      );
    }
    
    // Calculate EMA
    if (this.config.indicators.ema.enabled) {
      const emaValues = this.calculateEMA(closes, this.config.indicators.ema.period || 21);
      indicators.ema = emaValues.filter(v => v !== null) as number[];
    }
    
    // Calculate SMA
    if (this.config.indicators.sma.enabled) {
      indicators.sma = this.calculateSMA(closes, this.config.indicators.sma.period || 20);
    }
    
    console.log('✅ [STRATEGY-BACKTEST] Indicators calculated');
    return indicators;
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const rsi = [];
    
    for (let i = period; i < prices.length; i++) {
      let gains = 0;
      let losses = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const change = prices[j] - prices[j - 1];
        if (change > 0) {
          gains += change;
        } else {
          losses -= change;
        }
      }
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      
      rsi.push(rsiValue);
    }
    
    return rsi;
  }

  private calculateMACD(prices: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    
    const macdLine: number[] = [];
    const minLength = Math.min(ema12.length, ema26.length);
    
    for (let i = 0; i < minLength; i++) {
      const fast = ema12[i];
      const slow = ema26[i];
      if (fast !== null && slow !== null) {
        macdLine.push(fast - slow);
      }
    }
    
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    return {
      macd: macdLine,
      signal: signalLine.filter(v => v !== null) as number[],
      histogram: macdLine.map((val, i) => val - ((signalLine[i] as number) || 0))
    };
  }

  private calculateEMA(prices: number[], period: number): (number | null)[] {
    const k = 2 / (period + 1);
    const emaArray: (number | null)[] = [];
    
    if (prices.length === 0) return emaArray;
    
    // Fill initial values with null
    for (let i = 0; i < period - 1; i++) {
      emaArray.push(null);
    }
    
    // First EMA value is simple average of first 'period' values
    if (prices.length >= period) {
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += prices[i];
      }
      emaArray.push(sum / period);
      
      // Calculate EMA for the rest
      for (let i = period; i < prices.length; i++) {
        const prevEMA = emaArray[i - 1] as number;
        emaArray.push(prices[i] * k + prevEMA * (1 - k));
      }
    }
    
    return emaArray;
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      sma.push(sum / period);
    }
    
    return sma;
  }

  private executeStrategy(data: any[], indicators: any): Trade[] {
    console.log('🎯 [STRATEGY-BACKTEST] Executing trading strategy...');
    
    const trades: Trade[] = [];
    let currentTrade: Trade | null = null;
    let tradeId = 1;
    
    for (let i = 1; i < data.length; i++) {
      const candle = data[i];
      const timestamp = new Date(candle[0] * 1000).toISOString();
      const price = candle[4]; // Close price
      
      // Check entry conditions
      if (!currentTrade && this.checkEntryConditions(i, indicators)) {
        currentTrade = {
          id: `trade_${tradeId++}`,
          entryTime: timestamp,
          entryPrice: price,
          quantity: this.config.riskManagement.positionSize,
          side: 'BUY',
          status: 'OPEN',
          entryReason: 'Strategy signal'
        };
        
        console.log(`📥 [STRATEGY-BACKTEST] Entry: ${timestamp} @ ₹${price}`);
      }
      
      // Check exit conditions
      if (currentTrade && this.checkExitConditions(i, indicators, currentTrade, price)) {
        currentTrade.exitTime = timestamp;
        currentTrade.exitPrice = price;
        currentTrade.status = 'CLOSED';
        currentTrade.pnl = (currentTrade.exitPrice! - currentTrade.entryPrice) * currentTrade.quantity;
        currentTrade.pnlPercent = ((currentTrade.exitPrice! - currentTrade.entryPrice) / currentTrade.entryPrice) * 100;
        currentTrade.exitReason = 'Strategy exit signal';
        
        trades.push(currentTrade);
        console.log(`📤 [STRATEGY-BACKTEST] Exit: ${timestamp} @ ₹${price}, P&L: ₹${currentTrade.pnl?.toFixed(2)}`);
        currentTrade = null;
      }
    }
    
    console.log(`✅ [STRATEGY-BACKTEST] Strategy executed: ${trades.length} trades`);
    return trades;
  }

  private checkEntryConditions(index: number, indicators: any): boolean {
    // Simple RSI oversold entry condition as example
    if (indicators.rsi && indicators.rsi[index - 14]) {
      return indicators.rsi[index - 14] < (this.config.indicators.rsi.oversold || 30);
    }
    
    // Fallback to random entry for demo (20% probability)
    return Math.random() < 0.2;
  }

  private checkExitConditions(index: number, indicators: any, trade: Trade, currentPrice: number): boolean {
    // Stop loss check
    if (currentPrice <= trade.entryPrice * (1 - this.config.riskManagement.stopLoss / 100)) {
      return true;
    }
    
    // Take profit check
    if (currentPrice >= trade.entryPrice * (1 + this.config.riskManagement.takeProfit / 100)) {
      return true;
    }
    
    // RSI overbought exit
    if (indicators.rsi && indicators.rsi[index - 14]) {
      return indicators.rsi[index - 14] > (this.config.indicators.rsi.overbought || 70);
    }
    
    // Fallback to random exit for demo (10% probability)
    return Math.random() < 0.1;
  }

  private calculateSummary(trades: Trade[]): BacktestSummary {
    console.log('📊 [STRATEGY-BACKTEST] Calculating performance summary...');
    
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0).length;
    const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalPnLPercent = trades.reduce((sum, trade) => sum + (trade.pnlPercent || 0), 0);
    
    const pnlValues = trades.map(trade => trade.pnl || 0);
    const maxDrawdown = Math.min(...pnlValues, 0);
    const maxDrawdownPercent = trades.length > 0 ? (maxDrawdown / trades[0].entryPrice) * 100 : 0;
    
    const profitFactor = losingTrades > 0 ? 
      Math.abs(trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0)) /
      Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0)) : 0;
    
    const bestTrade = Math.max(...pnlValues, 0);
    const worstTrade = Math.min(...pnlValues, 0);
    
    // Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    trades.forEach(trade => {
      if ((trade.pnl || 0) > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        consecutiveWins = Math.max(consecutiveWins, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
      }
    });
    
    const avgTradeDuration = trades.length > 0 ? 
      trades.reduce((sum, trade) => {
        if (trade.exitTime) {
          const duration = new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime();
          return sum + duration;
        }
        return sum;
      }, 0) / trades.length / (1000 * 60 * 60) : 0; // Convert to hours
    
    const sharpeRatio = this.calculateSharpeRatio(trades);
    
    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnL,
      totalPnLPercent,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      profitFactor,
      avgTradeDuration,
      bestTrade,
      worstTrade,
      consecutiveWins,
      consecutiveLosses
    };
  }

  private calculateSharpeRatio(trades: Trade[]): number {
    if (trades.length < 2) return 0;
    
    const returns = trades.map(trade => trade.pnlPercent || 0);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  private generateEquityCurve(trades: Trade[]): Array<{ timestamp: string; value: number }> {
    const equity = [];
    let cumulativePnL = 100000; // Starting capital
    
    equity.push({
      timestamp: new Date().toISOString(),
      value: cumulativePnL
    });
    
    trades.forEach(trade => {
      if (trade.exitTime) {
        cumulativePnL += (trade.pnl || 0);
        equity.push({
          timestamp: trade.exitTime,
          value: cumulativePnL
        });
      }
    });
    
    return equity;
  }
}