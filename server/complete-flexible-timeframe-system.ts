// import { FyersAPI, CandleData, HistoricalDataRequest } from './fyers-api'; // Removed: Fyers API removed

export interface FlexibleTimeframeConfig {
  symbol: string;
  baseTimeframe: number; // Starting timeframe in minutes
  riskAmount: number;
  maxTimeframe: number; // Maximum timeframe (e.g., 320min)
  enableTrading: boolean;
}

export interface TradeResult {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: number;
  pattern: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  quantity: number;
  status: 'ACTIVE' | 'PROFIT' | 'LOSS' | 'INVALID';
  exitPrice?: number;
  profitLoss?: number;
  duration?: number;
  validationResults: {
    fiftyPercentRule: boolean;
    thirtyFourPercentRule: boolean;
    patternValid: boolean;
    timingValid: boolean;
  };
}

export interface TimeframeLevel {
  timeframe: number;
  candles: CandleData[];
  analysis: any;
  missingCandleMethod?: any;
  fifthCandleMethod?: any;
  sixthCandleMethod?: any;
  trades: TradeResult[];
}

export class CompleteFlexibleTimeframeSystem {
  private fyersAPI: FyersAPI;
  private config: FlexibleTimeframeConfig;
  private timeframeLevels: Map<number, TimeframeLevel> = new Map();
  private activeTrades: Map<string, TradeResult> = new Map();
  private marketOpen: boolean = false;
  private currentLevel: number = 0;
  private systemRunning: boolean = false;

  constructor(fyersAPI: FyersAPI, config: FlexibleTimeframeConfig) {
    this.fyersAPI = fyersAPI;
    this.config = config;
  }

  async startSystem(): Promise<void> {
    console.log('🚀 STARTING COMPLETE FLEXIBLE TIMEFRAME SYSTEM');
    console.log(`📊 Symbol: ${this.config.symbol}, Base: ${this.config.baseTimeframe}min, Risk: ₹${this.config.riskAmount}`);
    
    this.systemRunning = true;
    this.marketOpen = await this.checkMarketStatus();
    
    if (!this.marketOpen) {
      console.log('⏰ Market is closed. System will wait for market open.');
      return;
    }

    // Start with base timeframe
    await this.initializeBaseLevel();
    
    // Start main processing loop
    await this.processMarketProgression();
  }

  private async checkMarketStatus(): Promise<boolean> {
    const now = new Date();
    const marketOpenTime = new Date();
    marketOpenTime.setHours(9, 15, 0, 0);
    const marketCloseTime = new Date();
    marketCloseTime.setHours(15, 30, 0, 0);
    
    return now >= marketOpenTime && now <= marketCloseTime;
  }

  private async initializeBaseLevel(): Promise<void> {
    console.log(`🔄 INITIALIZING BASE LEVEL: ${this.config.baseTimeframe}min`);
    
    const candles = await this.fetchCandleData(this.config.baseTimeframe, 10);
    
    if (candles.length < 4) {
      console.log('⏳ Waiting for minimum 4 candles...');
      return;
    }

    const level: TimeframeLevel = {
      timeframe: this.config.baseTimeframe,
      candles: candles.slice(0, 4), // Initial 4 candles
      analysis: null,
      trades: []
    };

    this.timeframeLevels.set(this.config.baseTimeframe, level);
    this.currentLevel = this.config.baseTimeframe;
    
    console.log(`✅ Base level initialized with 4×${this.config.baseTimeframe}min candles`);
  }

  private async processMarketProgression(): Promise<void> {
    console.log('🔄 STARTING MARKET PROGRESSION LOOP');
    
    while (this.systemRunning && this.marketOpen) {
      try {
        const currentTimeframe = this.currentLevel;
        const level = this.timeframeLevels.get(currentTimeframe);
        
        if (!level) continue;

        // STEP 1: Apply Complete Battu API Analysis
        await this.applyCompleteBattuAnalysis(level);
        
        // STEP 2: Apply Advanced Methods (if timeframe allows)
        await this.applyAdvancedMethods(level);
        
        // STEP 3: Wait for 6th candle completion
        const sixthCandleCompleted = await this.waitForSixthCandle(level);
        
        if (sixthCandleCompleted) {
          // STEP 4: Timeframe Doubling
          await this.doubleTimeframe();
        }
        
        // STEP 5: Monitor active trades
        await this.monitorActiveTrades();
        
        // Wait before next iteration
        await this.sleep(30000); // 30 seconds
        
      } catch (error) {
        console.error('❌ Error in market progression:', error);
        await this.sleep(60000); // Wait 1 minute on error
      }
    }
  }

  private async applyCompleteBattuAnalysis(level: TimeframeLevel): Promise<void> {
    console.log(`📊 APPLYING COMPLETE BATTU ANALYSIS - ${level.timeframe}min`);
    
    try {
      // Apply Battu analysis (simplified for now)
      const analysis = {
        slopes: [
          {
            patternName: '1-3_UPTREND',
            slopeValue: 2.5,
            breakoutLevel: 23050,
            duration: 15,
            pointB: { timestamp: Date.now() - 600000 }
          }
        ]
      };
      
      level.analysis = analysis;
      
      if (analysis.slopes && analysis.slopes.length > 0) {
        console.log(`✅ Found ${analysis.slopes.length} patterns:`);
        
        for (const slope of analysis.slopes) {
          console.log(`   ${slope.patternName}: ${slope.slopeValue.toFixed(4)} pts/min`);
          
          // Generate trade signals
          await this.generateTradeFromPattern(slope, level);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in Battu analysis:', error);
    }
  }

  private async applyAdvancedMethods(level: TimeframeLevel): Promise<void> {
    console.log(`🎯 APPLYING ADVANCED METHODS - ${level.timeframe}min`);
    
    // Method 1: Missing 4th Candle (≥20min)
    if (level.timeframe >= 20) {
      await this.applyMissingFourthCandleMethod(level);
    }
    
    // Method 2: 5th Candle Enhancement (≥10min)
    if (level.timeframe >= 10) {
      await this.applyFifthCandleMethod(level);
    }
    
    // Method 3: 6th Candle Enhancement (≥10min)
    if (level.timeframe >= 10) {
      await this.applySixthCandleMethod(level);
    }
  }

  private async applyMissingFourthCandleMethod(level: TimeframeLevel): Promise<void> {
    console.log(`🔍 MISSING 4TH CANDLE METHOD - ${level.timeframe}min (Drill to 20min)`);
    
    if (level.candles.length < 3) return;
    
    try {
      // Recursive drilling from current timeframe down to 20min
      const drillLevels = this.calculateDrillLevels(level.timeframe, 20);
      
      console.log(`   Drill path: ${level.timeframe}min → ${drillLevels.join('min → ')}min`);
      
      // Split C2A (3rd candle) and drill down
      const thirdCandle = level.candles[2];
      const subCandles = await this.recursiveDrillDown(thirdCandle, level.timeframe, 20);
      
      // Apply Battu API to sub-candles to predict 4th candle
      if (subCandles.length >= 4) {
        const subAnalysis = await this.applyBattuToSubCandles(subCandles);
        level.missingCandleMethod = {
          drillLevels,
          subCandles,
          analysis: subAnalysis,
          predictedFourthCandle: this.predictFourthCandle(subAnalysis)
        };
        
        console.log(`✅ Missing 4th candle predicted using ${drillLevels.length} drill levels`);
      }
      
    } catch (error) {
      console.error('❌ Error in missing 4th candle method:', error);
    }
  }

  private async applyFifthCandleMethod(level: TimeframeLevel): Promise<void> {
    console.log(`🎯 5TH CANDLE METHOD - ${level.timeframe}min (Drill to 10min)`);
    
    if (level.candles.length < 4) return;
    
    try {
      // Extract C2 block (C2A + C2B)
      const c2Block = level.candles.slice(2, 4); // 3rd and 4th candles
      
      // Recursive drilling from current timeframe down to 10min
      const drillLevels = this.calculateDrillLevels(level.timeframe, 10);
      
      console.log(`   C2 Block drill path: ${level.timeframe}min → ${drillLevels.join('min → ')}min`);
      
      // Drill down C2 block
      const c2SubCandles = await this.recursiveDrillDownBlock(c2Block, level.timeframe, 10);
      
      if (c2SubCandles.length >= 4) {
        const subAnalysis = await this.applyBattuToSubCandles(c2SubCandles);
        
        level.fifthCandleMethod = {
          drillLevels,
          c2Block,
          subCandles: c2SubCandles,
          analysis: subAnalysis,
          higherTrendline: level.analysis?.slopes || [],
          lowerTrendlines: subAnalysis.slopes || []
        };
        
        console.log(`✅ 5th candle method applied with ${drillLevels.length} drill levels`);
      }
      
    } catch (error) {
      console.error('❌ Error in 5th candle method:', error);
    }
  }

  private async applySixthCandleMethod(level: TimeframeLevel): Promise<void> {
    console.log(`🎯 6TH CANDLE METHOD - ${level.timeframe}min (Drill to 10min)`);
    
    if (level.candles.length < 5) return;
    
    try {
      // Extract C2B + 5th candle
      const c2bAnd5th = level.candles.slice(3, 5); // 4th and 5th candles
      
      // Recursive drilling
      const drillLevels = this.calculateDrillLevels(level.timeframe, 10);
      
      console.log(`   C2B+5th drill path: ${level.timeframe}min → ${drillLevels.join('min → ')}min`);
      
      const subCandles = await this.recursiveDrillDownBlock(c2bAnd5th, level.timeframe, 10);
      
      if (subCandles.length >= 4) {
        const subAnalysis = await this.applyBattuToSubCandles(subCandles);
        
        level.sixthCandleMethod = {
          drillLevels,
          c2bAnd5th,
          subCandles,
          analysis: subAnalysis,
          higherTrendline: level.analysis?.slopes || [],
          lowerTrendlines: subAnalysis.slopes || []
        };
        
        console.log(`✅ 6th candle method applied with ${drillLevels.length} drill levels`);
      }
      
    } catch (error) {
      console.error('❌ Error in 6th candle method:', error);
    }
  }

  private calculateDrillLevels(currentTimeframe: number, minTimeframe: number): number[] {
    const levels: number[] = [];
    let current = currentTimeframe;
    
    while (current > minTimeframe) {
      current = Math.max(Math.floor(current / 2), minTimeframe);
      levels.push(current);
    }
    
    return levels;
  }

  private async recursiveDrillDown(candle: CandleData, currentTimeframe: number, minTimeframe: number): Promise<CandleData[]> {
    // Simulate drilling down by fetching higher resolution data
    const subTimeframe = Math.max(Math.floor(currentTimeframe / 4), minTimeframe);
    
    // Fetch sub-candles for the time period of the original candle
    const subCandles = await this.fetchCandleDataForPeriod(
      candle.timestamp,
      candle.timestamp + (currentTimeframe * 60 * 1000),
      subTimeframe
    );
    
    return subCandles.slice(0, 4); // Return first 4 sub-candles
  }

  private async recursiveDrillDownBlock(block: CandleData[], currentTimeframe: number, minTimeframe: number): Promise<CandleData[]> {
    const allSubCandles: CandleData[] = [];
    
    for (const candle of block) {
      const subCandles = await this.recursiveDrillDown(candle, currentTimeframe, minTimeframe);
      allSubCandles.push(...subCandles);
    }
    
    return allSubCandles.slice(0, 4); // Return first 4 for Battu analysis
  }

  private async generateTradeFromPattern(slope: any, level: TimeframeLevel): Promise<void> {
    console.log(`💰 GENERATING TRADE FROM PATTERN: ${slope.patternName}`);
    
    try {
      // Validate pattern timing rules
      const validation = await this.validateTimingRules(slope, level);
      
      if (!validation.valid) {
        console.log(`❌ Pattern invalid: ${validation.reason}`);
        return;
      }
      
      // Calculate trade parameters
      const tradeParams = this.calculateTradeParameters(slope, level);
      
      // Create trade result
      const trade: TradeResult = {
        id: `${Date.now()}_${level.timeframe}_${slope.patternName}`,
        timestamp: Date.now(),
        symbol: this.config.symbol,
        timeframe: level.timeframe,
        pattern: slope.patternName,
        direction: slope.slopeValue > 0 ? 'BUY' : 'SELL',
        entryPrice: tradeParams.entryPrice,
        targetPrice: tradeParams.targetPrice,
        stopLoss: tradeParams.stopLoss,
        quantity: tradeParams.quantity,
        status: 'ACTIVE',
        validationResults: {
          fiftyPercentRule: validation.fiftyPercent,
          thirtyFourPercentRule: validation.thirtyFourPercent,
          patternValid: validation.patternValid,
          timingValid: validation.timingValid
        }
      };
      
      // Place order if trading enabled
      if (this.config.enableTrading) {
        await this.placeOrder(trade);
      }
      
      // Add to active trades
      this.activeTrades.set(trade.id, trade);
      level.trades.push(trade);
      
      console.log(`✅ Trade generated: ${trade.direction} ${trade.quantity} @ ${trade.entryPrice}`);
      console.log(`   Target: ${trade.targetPrice}, SL: ${trade.stopLoss}`);
      
    } catch (error) {
      console.error('❌ Error generating trade:', error);
    }
  }

  private async validateTimingRules(slope: any, level: TimeframeLevel): Promise<{
    valid: boolean;
    reason?: string;
    fiftyPercent: boolean;
    thirtyFourPercent: boolean;
    patternValid: boolean;
    timingValid: boolean;
  }> {
    
    // 50% Rule: Point A → Point B duration ≥ 50% of 4-candle duration
    const fourCandleDuration = level.timeframe * 4; // in minutes
    const pointABDuration = slope.duration || 0;
    const fiftyPercent = pointABDuration >= (fourCandleDuration * 0.5);
    
    // 34% Rule: Point B → trigger duration ≥ 34% of Point A → Point B duration  
    const triggerDuration = this.calculateTriggerDuration(slope);
    const thirtyFourPercent = triggerDuration >= (pointABDuration * 0.34);
    
    // Pattern validation
    const patternValid = this.validatePattern(slope);
    
    // Overall timing validation
    const timingValid = fiftyPercent && thirtyFourPercent;
    
    const valid = patternValid && timingValid;
    
    let reason = '';
    if (!patternValid) reason = 'Invalid pattern structure';
    else if (!fiftyPercent) reason = '50% rule failed';
    else if (!thirtyFourPercent) reason = '34% rule failed';
    
    return {
      valid,
      reason,
      fiftyPercent,
      thirtyFourPercent,
      patternValid,
      timingValid
    };
  }

  private calculateTriggerDuration(slope: any): number {
    // Calculate time from Point B to current moment
    const currentTime = Date.now();
    const pointBTime = slope.pointB?.timestamp || currentTime;
    return Math.max(0, (currentTime - pointBTime) / (1000 * 60)); // Convert to minutes
  }

  private validatePattern(slope: any): boolean {
    // Validate pattern structure and requirements
    if (!slope.patternName || !slope.slopeValue) return false;
    if (Math.abs(slope.slopeValue) < 0.1) return false; // Minimum slope threshold
    return true;
  }

  private calculateTradeParameters(slope: any, level: TimeframeLevel): {
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    quantity: number;
  } {
    const currentPrice = this.getCurrentPrice();
    const slopeValue = slope.slopeValue;
    const timeframe = level.timeframe;
    
    // Entry price (current breakout level)
    const entryPrice = slope.breakoutLevel || currentPrice;
    
    // Target price (slope × 10min projection)
    const targetPrice = entryPrice + (slopeValue * 10);
    
    // Stop loss (previous candle high/low)
    const stopLoss = this.calculateStopLoss(slope, level);
    
    // Quantity based on risk amount
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const quantity = Math.floor(this.config.riskAmount / riskPerShare);
    
    return {
      entryPrice,
      targetPrice,
      stopLoss,
      quantity: Math.max(1, quantity)
    };
  }

  private calculateStopLoss(slope: any, level: TimeframeLevel): number {
    // Use previous candle for stop loss calculation
    const direction = slope.slopeValue > 0 ? 'BUY' : 'SELL';
    const previousCandle = level.candles[level.candles.length - 2];
    
    if (!previousCandle) return slope.breakoutLevel || this.getCurrentPrice();
    
    return direction === 'BUY' ? previousCandle.low : previousCandle.high;
  }

  private getCurrentPrice(): number {
    // Fetch current market price
    return 23000; // Placeholder - implement live price fetching
  }

  private async waitForSixthCandle(level: TimeframeLevel): Promise<boolean> {
    // Check if 6th candle is completed
    const requiredCandles = 6;
    const currentCandles = await this.fetchCandleData(level.timeframe, requiredCandles + 2);
    
    if (currentCandles.length >= requiredCandles) {
      console.log(`✅ 6th candle completed at ${level.timeframe}min timeframe`);
      level.candles = currentCandles.slice(0, requiredCandles);
      return true;
    }
    
    return false;
  }

  private async doubleTimeframe(): Promise<void> {
    const newTimeframe = this.currentLevel * 2;
    
    if (newTimeframe > this.config.maxTimeframe) {
      console.log(`⚠️ Maximum timeframe reached: ${this.config.maxTimeframe}min`);
      return;
    }
    
    console.log(`📈 TIMEFRAME DOUBLING: ${this.currentLevel}min → ${newTimeframe}min`);
    
    // Fetch candles for new timeframe
    const newCandles = await this.fetchCandleData(newTimeframe, 4);
    
    const newLevel: TimeframeLevel = {
      timeframe: newTimeframe,
      candles: newCandles,
      analysis: null,
      trades: []
    };
    
    this.timeframeLevels.set(newTimeframe, newLevel);
    this.currentLevel = newTimeframe;
    
    console.log(`✅ New timeframe level created: ${newTimeframe}min with ${newCandles.length} candles`);
  }

  private async monitorActiveTrades(): Promise<void> {
    const currentPrice = this.getCurrentPrice();
    
    for (const [id, trade] of Array.from(this.activeTrades.entries())) {
      if (trade.status !== 'ACTIVE') continue;
      
      // Check for target hit
      const targetHit = (trade.direction === 'BUY' && currentPrice >= trade.targetPrice) ||
                       (trade.direction === 'SELL' && currentPrice <= trade.targetPrice);
      
      // Check for stop loss hit
      const stopLossHit = (trade.direction === 'BUY' && currentPrice <= trade.stopLoss) ||
                         (trade.direction === 'SELL' && currentPrice >= trade.stopLoss);
      
      if (targetHit) {
        await this.exitTrade(trade, currentPrice, 'PROFIT');
      } else if (stopLossHit) {
        await this.exitTrade(trade, currentPrice, 'LOSS');
      }
      
      // Check for 80% target (partial exit)
      const eightyPercentTarget = trade.entryPrice + ((trade.targetPrice - trade.entryPrice) * 0.8);
      const eightyPercentHit = (trade.direction === 'BUY' && currentPrice >= eightyPercentTarget) ||
                              (trade.direction === 'SELL' && currentPrice <= eightyPercentTarget);
      
      if (eightyPercentHit && !trade.exitPrice) {
        console.log(`📈 80% target hit for trade ${trade.id} - Consider partial exit`);
      }
    }
  }

  private async exitTrade(trade: TradeResult, exitPrice: number, status: 'PROFIT' | 'LOSS'): Promise<void> {
    trade.exitPrice = exitPrice;
    trade.status = status;
    trade.duration = Date.now() - trade.timestamp;
    trade.profitLoss = (exitPrice - trade.entryPrice) * trade.quantity * (trade.direction === 'BUY' ? 1 : -1);
    
    console.log(`🎯 TRADE EXIT: ${trade.id}`);
    console.log(`   Status: ${status}, P&L: ₹${trade.profitLoss?.toFixed(2)}`);
    console.log(`   Duration: ${Math.floor((trade.duration || 0) / 60000)} minutes`);
    
    if (this.config.enableTrading) {
      await this.exitOrder(trade);
    }
  }

  private async fetchCandleData(timeframe: number, count: number): Promise<CandleData[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await this.fyersAPI.getHistoricalData({
        symbol: this.config.symbol,
        resolution: timeframe.toString(),
        date_format: '1',
        range_from: today,
        range_to: today,
        cont_flag: '1'
      });
      
      if (response && Array.isArray(response)) {
        return response.slice(-count).map((candle: number[]) => ({
          timestamp: candle[0],
          open: candle[1],
          high: candle[2], 
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ Error fetching candle data:', error);
      return [];
    }
  }

  private async fetchCandleDataForPeriod(startTime: number, endTime: number, timeframe: number): Promise<CandleData[]> {
    // Fetch candles for specific time period
    // This is a simplified implementation
    return [];
  }

  private async applyBattuToSubCandles(candles: CandleData[]): Promise<any> {
    // Apply Battu API analysis to sub-candles
    // Simplified implementation
    return {
      slopes: [],
      patterns: []
    };
  }

  private predictFourthCandle(analysis: any): CandleData | null {
    // Predict 4th candle based on sub-analysis
    return null;
  }

  private async placeOrder(trade: TradeResult): Promise<void> {
    console.log(`📋 PLACING ORDER: ${trade.direction} ${trade.quantity} ${trade.symbol}`);
    // Implement actual order placement via Fyers API
  }

  private async exitOrder(trade: TradeResult): Promise<void> {
    console.log(`📋 EXITING ORDER: ${trade.id}`);
    // Implement actual order exit via Fyers API
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for UI integration
  async getSystemStatus(): Promise<{
    running: boolean;
    currentTimeframe: number;
    activeTrades: number;
    totalTrades: number;
    totalProfitLoss: number;
    timeframeLevels: { timeframe: number; candles: number; trades: number }[];
  }> {
    let totalProfitLoss = 0;
    let totalTrades = 0;
    
    Array.from(this.activeTrades.values()).forEach(trade => {
      totalTrades++;
      totalProfitLoss += trade.profitLoss || 0;
    });
    
    const timeframeLevels = Array.from(this.timeframeLevels.entries()).map(([timeframe, level]) => ({
      timeframe,
      candles: level.candles.length,
      trades: level.trades.length
    }));
    
    return {
      running: this.systemRunning,
      currentTimeframe: this.currentLevel,
      activeTrades: Array.from(this.activeTrades.values()).filter(t => t.status === 'ACTIVE').length,
      totalTrades,
      totalProfitLoss,
      timeframeLevels
    };
  }

  async getTradeHistory(): Promise<TradeResult[]> {
    return Array.from(this.activeTrades.values());
  }

  async stopSystem(): Promise<void> {
    console.log('🛑 STOPPING FLEXIBLE TIMEFRAME SYSTEM');
    this.systemRunning = false;
  }
}