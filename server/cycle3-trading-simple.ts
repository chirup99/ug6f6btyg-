/**
 * SIMPLIFIED CYCLE 3: TRADING EXECUTION ENGINE
 * Basic implementation without complex imports
 */

export interface TradingSignal {
  symbol: string;
  patternType: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  targets: {
    target80: number; // 80% target
    target100: number; // 100% target
    targetExtended: number; // Extended target
  };
  quantity: number;
  riskAmount: number;
  confidence: number;
  timestamp: string;
  pointA: { price: number; timestamp: string };
  pointB: { price: number; timestamp: string };
  slope: number;
  breakoutLevel: number;
}

export interface SimulatedOrder {
  orderId: string;
  signal: TradingSignal;
  entryPrice: number;
  currentPrice: number;
  status: 'ACTIVE' | 'CLOSED_SL' | 'CLOSED_80_TARGET' | 'CLOSED_6TH_CANDLE';
  pnl: number;
  exitPrice?: number;
  exitReason?: string;
  exitTimestamp?: string;
}

export interface MarketCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export class Cycle3TradingExecutionEngineSimple {
  private riskPerTrade: number = 1000;
  private capital: number = 10000;
  private activeOrders: Map<string, SimulatedOrder> = new Map();
  private fyersApi: any;

  constructor(fyersApiInstance?: any) {
    this.fyersApi = fyersApiInstance;
  }

  setRiskParameters(riskAmount: number): void {
    this.riskPerTrade = riskAmount;
    console.log(`✅ CYCLE 3: Risk parameters updated - Risk per trade: ₹${riskAmount}`);
  }

  setCapital(capitalAmount: number): void {
    this.capital = capitalAmount;
    console.log(`💰 CYCLE 3: Capital updated - Total capital: ₹${capitalAmount}`);
  }

  calculateTargetsFromPatterns(cycle2Analysis: any): any {
    console.log('📊 CYCLE 3: Calculating targets from pattern analysis...');
    
    if (!cycle2Analysis?.analysis?.patterns) {
      throw new Error('Invalid cycle 2 analysis data');
    }

    const patterns = cycle2Analysis.analysis.patterns;
    const signals: TradingSignal[] = [];

    for (const pattern of patterns) {
      if (!pattern.validity.isValid) continue;

      // Calculate quantity based on capital allocation
      const riskDistance = Math.abs(pattern.breakoutLevel - pattern.sl);
      const quantity = Math.floor(this.capital * 0.02 / riskDistance); // 2% risk per trade

      // Calculate targets based on slope and breakout level
      const slopeProjection = Math.abs(pattern.slope) * 10; // 10-minute projection
      const target80 = pattern.direction === 'BUY' 
        ? pattern.breakoutLevel + (slopeProjection * 0.8)
        : pattern.breakoutLevel - (slopeProjection * 0.8);
      
      const target100 = pattern.direction === 'BUY'
        ? pattern.breakoutLevel + slopeProjection
        : pattern.breakoutLevel - slopeProjection;

      const targetExtended = pattern.direction === 'BUY'
        ? pattern.breakoutLevel + (slopeProjection * 1.5)
        : pattern.breakoutLevel - (slopeProjection * 1.5);

      const signal: TradingSignal = {
        symbol: cycle2Analysis.symbol,
        patternType: pattern.pattern,
        direction: pattern.trend === 'UPTREND' ? 'BUY' : 'SELL',
        entryPrice: pattern.breakoutLevel,
        stopLoss: pattern.sl,
        targets: {
          target80,
          target100,
          targetExtended
        },
        quantity,
        riskAmount: quantity * riskDistance,
        confidence: Math.min(85 + Math.abs(pattern.slope) * 2, 95),
        timestamp: new Date().toISOString(),
        pointA: pattern.pointA,
        pointB: pattern.pointB,
        slope: pattern.slope,
        breakoutLevel: pattern.breakoutLevel
      };

      signals.push(signal);
    }

    const summary = {
      buySignals: signals.filter(s => s.direction === 'BUY').length,
      sellSignals: signals.filter(s => s.direction === 'SELL').length,
      averageConfidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length || 0,
      totalCapitalAtRisk: signals.reduce((sum, s) => sum + s.riskAmount, 0)
    };

    console.log(`✅ CYCLE 3: Generated ${signals.length} trading signals with total capital at risk: ₹${summary.totalCapitalAtRisk}`);

    return {
      signalsGenerated: signals.length,
      signals,
      summary,
      timestamp: new Date().toISOString()
    };
  }

  placeOrders(signals: TradingSignal[], autoApprove: boolean): any {
    console.log(`📋 CYCLE 3: Placing ${signals.length} orders (Auto-approve: ${autoApprove})`);

    const results = signals.map((signal, index) => {
      // Simulate order placement at breakout level
      const success = signal.confidence >= 75 || autoApprove;
      const orderId = success ? `ORD_${Date.now()}_${index}` : null;

      if (success) {
        // Create simulated order
        const simulatedOrder: SimulatedOrder = {
          orderId: orderId!,
          signal,
          entryPrice: signal.entryPrice,
          currentPrice: signal.entryPrice,
          status: 'ACTIVE',
          pnl: 0
        };
        
        this.activeOrders.set(orderId!, simulatedOrder);
        console.log(`📈 CYCLE 3: Order ${orderId} activated at breakout level ₹${signal.entryPrice}`);
      }

      return {
        signal: signal.symbol,
        pattern: signal.patternType,
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        quantity: signal.quantity,
        success,
        orderId,
        error: success ? null : 'Confidence below threshold for manual approval'
      };
    });

    const ordersPlaced = results.filter(r => r.success).length;
    const ordersFailed = results.filter(r => !r.success).length;

    console.log(`✅ CYCLE 3: Orders placed: ${ordersPlaced}, Failed: ${ordersFailed}`);

    return {
      ordersPlaced,
      ordersFailed,
      results,
      summary: {
        successRate: (ordersPlaced / signals.length) * 100,
        activeOrders: this.activeOrders.size
      },
      timestamp: new Date().toISOString()
    };
  }

  async fetchRealCandles(symbol: string, startTime: string, endTime: string): Promise<MarketCandle[]> {
    if (!this.fyersApi) {
      console.log('⚠️ Fyers API not available, using simulated candles');
      return this.generateSimulatedCandles(startTime, endTime);
    }

    try {
      console.log(`📊 CYCLE 3: Fetching real 5th & 6th candle data for ${symbol}`);
      
      // Convert to Unix timestamps
      const fromDate = Math.floor(new Date(startTime).getTime() / 1000);
      const toDate = Math.floor(new Date(endTime).getTime() / 1000);

      const response = await this.fyersApi.getHistoricalData({
        symbol,
        resolution: '5', // 5-minute candles
        date_format: '1',
        range_from: fromDate,
        range_to: toDate,
        cont_flag: '1'
      });

      if (response && response.candles) {
        return response.candles.map((candle: any[]) => ({
          timestamp: new Date(candle[0] * 1000).toISOString(),
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4]
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching real candles:', error);
    }

    return this.generateSimulatedCandles(startTime, endTime);
  }

  private generateSimulatedCandles(startTime: string, endTime: string): MarketCandle[] {
    const candles: MarketCandle[] = [];
    const start = new Date(startTime);
    const end = new Date(endTime);
    let currentTime = new Date(start);
    let currentPrice = 24850; // Base price

    while (currentTime < end) {
      const volatility = 0.002; // 0.2% volatility
      const change = (Math.random() - 0.5) * currentPrice * volatility;
      
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * currentPrice * 0.001;
      const low = Math.min(open, close) - Math.random() * currentPrice * 0.001;

      candles.push({
        timestamp: currentTime.toISOString(),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100
      });

      currentPrice = close;
      currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000); // 5 minutes
    }

    return candles;
  }

  async simulateTrade(orderId: string, candles: MarketCandle[]): Promise<any> {
    const order = this.activeOrders.get(orderId);
    if (!order || order.status !== 'ACTIVE') {
      return { error: 'Order not found or not active' };
    }

    console.log(`🎯 CYCLE 3: Simulating trade for order ${orderId} with ${candles.length} candles`);

    const signal = order.signal;
    const isBuy = signal.direction === 'BUY';
    
    let exitPrice: number | null = null;
    let exitReason = '';
    let exitTimestamp = '';

    // Check each candle for exit conditions
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const isLastCandle = i === candles.length - 1;

      // Update current price
      order.currentPrice = candle.close;

      // Check stop loss hit
      if (isBuy && candle.low <= signal.stopLoss) {
        exitPrice = signal.stopLoss;
        exitReason = 'Stop Loss Hit';
        exitTimestamp = candle.timestamp;
        order.status = 'CLOSED_SL';
        break;
      } else if (!isBuy && candle.high >= signal.stopLoss) {
        exitPrice = signal.stopLoss;
        exitReason = 'Stop Loss Hit';
        exitTimestamp = candle.timestamp;
        order.status = 'CLOSED_SL';
        break;
      }

      // Check 80% target reached
      if (isBuy && candle.high >= signal.targets.target80) {
        exitPrice = signal.targets.target80;
        exitReason = '80% Target Reached';
        exitTimestamp = candle.timestamp;
        order.status = 'CLOSED_80_TARGET';
        break;
      } else if (!isBuy && candle.low <= signal.targets.target80) {
        exitPrice = signal.targets.target80;
        exitReason = '80% Target Reached';
        exitTimestamp = candle.timestamp;
        order.status = 'CLOSED_80_TARGET';
        break;
      }

      // If last candle (6th candle close), exit at close price
      if (isLastCandle) {
        exitPrice = candle.close;
        exitReason = '6th Candle Close';
        exitTimestamp = candle.timestamp;
        order.status = 'CLOSED_6TH_CANDLE';
        break;
      }
    }

    if (exitPrice !== null) {
      order.exitPrice = exitPrice;
      order.exitReason = exitReason;
      order.exitTimestamp = exitTimestamp;

      // Calculate P&L
      const priceDiff = isBuy 
        ? exitPrice - signal.entryPrice 
        : signal.entryPrice - exitPrice;
      
      order.pnl = priceDiff * signal.quantity;

      console.log(`📊 CYCLE 3: Trade completed - ${exitReason}, P&L: ₹${order.pnl.toFixed(2)}`);
    }

    return {
      orderId,
      status: order.status,
      entryPrice: signal.entryPrice,
      exitPrice,
      exitReason,
      pnl: order.pnl,
      quantity: signal.quantity,
      direction: signal.direction,
      symbol: signal.symbol,
      pattern: signal.patternType
    };
  }

  getTradeResults(): any {
    const trades = Array.from(this.activeOrders.values());
    const closedTrades = trades.filter(t => t.status !== 'ACTIVE');
    
    const totalPnL = closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winningTrades = closedTrades.filter(t => t.pnl > 0).length;
    const losingTrades = closedTrades.filter(t => t.pnl < 0).length;

    return {
      totalTrades: closedTrades.length,
      activeTrades: trades.filter(t => t.status === 'ACTIVE').length,
      totalPnL: Math.round(totalPnL * 100) / 100,
      winningTrades,
      losingTrades,
      winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
      trades: closedTrades.map(trade => ({
        orderId: trade.orderId,
        symbol: trade.signal.symbol,
        pattern: trade.signal.patternType,
        direction: trade.signal.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        pnl: Math.round(trade.pnl * 100) / 100,
        status: trade.status,
        exitReason: trade.exitReason,
        quantity: trade.signal.quantity
      }))
    };
  }
}

export const createCycle3Engine = () => {
  return new Cycle3TradingExecutionEngineSimple();
};