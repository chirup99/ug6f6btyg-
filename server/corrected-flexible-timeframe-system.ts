// import { FyersAPI, CandleData, HistoricalDataRequest } from './fyers-api'; // Removed: Fyers API removed

export interface FlexibleTimeframeConfig {
  symbol: string;
  baseTimeframe: number; // Starting timeframe in minutes
  riskAmount: number;
  maxTimeframe: number; // Maximum timeframe (e.g., 320min)
  enableTrading: boolean;
}

export interface TrendlineRule {
  pattern: string;
  pointA: string;
  pointB: string;
  trendlineEndpoint: string;
  breakoutLevel: string;
  isFlexible: boolean;
  specialRule?: string;
}

export interface TimeframeAnalysis {
  timeframe: number;
  candles: CandleData[];
  fourCandleAnalysis: any;
  trendlines: any[];
  patterns: string[];
  trades: TradeResult[];
  status: 'COLLECTING' | 'ANALYZING' | 'COMPLETED' | 'DOUBLED';
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

export class CorrectedFlexibleTimeframeSystem {
  private fyersAPI: FyersAPI;
  private config: FlexibleTimeframeConfig;
  private timeframeLevels: Map<number, TimeframeAnalysis> = new Map();
  private activeTrades: Map<string, TradeResult> = new Map();
  private currentTimeframe: number;
  private systemRunning: boolean = false;
  private marketOpen: boolean = false;

  // Flexible trendline rules as per attached specification
  private trendlineRules: TrendlineRule[] = [
    {
      pattern: '1-3',
      pointA: 'C1A',
      pointB: 'C2A',
      trendlineEndpoint: 'C2A',
      breakoutLevel: 'C2A',
      isFlexible: true
    },
    {
      pattern: '1-4',
      pointA: 'C1A',
      pointB: 'C2B',
      trendlineEndpoint: 'C2B',
      breakoutLevel: 'C2B',
      isFlexible: true
    },
    {
      pattern: '2-4',
      pointA: 'C1B',
      pointB: 'C2B',
      trendlineEndpoint: 'C2B',
      breakoutLevel: 'C2B',
      isFlexible: true
    },
    {
      pattern: '2-3',
      pointA: 'C1B',
      pointB: 'C2A',
      trendlineEndpoint: 'C2B', // SPECIAL: Extended to 4th candle
      breakoutLevel: 'C2A', // SPECIAL: Breakout remains at 3rd candle
      isFlexible: false,
      specialRule: 'Side-by-side pattern - trendline extends beyond natural endpoint'
    }
  ];

  constructor(fyersAPI: FyersAPI, config: FlexibleTimeframeConfig) {
    this.fyersAPI = fyersAPI;
    this.config = config;
    this.currentTimeframe = config.baseTimeframe;
  }

  async startSystem(): Promise<void> {
    console.log('🚀 CORRECTED FLEXIBLE TIMEFRAME SYSTEM STARTED');
    console.log(`📊 Symbol: ${this.config.symbol}, Base: ${this.config.baseTimeframe}min → Max: ${this.config.maxTimeframe}min`);
    console.log('🎯 METHODOLOGY: 6 candles → timeframe doubling (NOT block expansion)');
    
    this.systemRunning = true;
    this.marketOpen = await this.checkMarketStatus();
    
    if (!this.marketOpen) {
      console.log('⏰ Market closed - System ready for next session');
      return;
    }

    // Start timeframe progression loop
    await this.executeTimeframeProgression();
  }

  private async executeTimeframeProgression(): Promise<void> {
    console.log('\n🔄 STARTING TIMEFRAME PROGRESSION LOOP');
    
    while (this.systemRunning && this.currentTimeframe <= this.config.maxTimeframe) {
      console.log(`\n📈 CURRENT TIMEFRAME: ${this.currentTimeframe} minutes`);
      
      // Initialize analysis for current timeframe
      const analysis: TimeframeAnalysis = {
        timeframe: this.currentTimeframe,
        candles: [],
        fourCandleAnalysis: null,
        trendlines: [],
        patterns: [],
        trades: [],
        status: 'COLLECTING'
      };
      
      this.timeframeLevels.set(this.currentTimeframe, analysis);
      
      // Wait for 6 candles at current timeframe
      const sixCandles = await this.waitForSixCandles(this.currentTimeframe);
      
      if (sixCandles.length >= 6) {
        console.log(`✅ 6 candles completed at ${this.currentTimeframe}min`);
        
        // Apply 4-candle Battu analysis on first 4 candles
        await this.performFourCandleAnalysis(analysis, sixCandles.slice(0, 4));
        
        // Apply flexible trendline rules
        await this.applyFlexibleTrendlines(analysis);
        
        // Execute recursive drilling if needed
        await this.executeRecursiveDrilling(analysis, sixCandles);
        
        // Mark level as completed
        analysis.status = 'COMPLETED';
        
        // Double timeframe for next iteration
        console.log(`🔄 TIMEFRAME DOUBLING: ${this.currentTimeframe}min → ${this.currentTimeframe * 2}min`);
        this.currentTimeframe = this.currentTimeframe * 2;
        analysis.status = 'DOUBLED';
        
      } else {
        console.log(`⏳ Waiting for more candles at ${this.currentTimeframe}min...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
    
    console.log(`🏁 TIMEFRAME PROGRESSION COMPLETE - Maximum ${this.config.maxTimeframe}min reached`);
  }

  private async waitForSixCandles(timeframe: number): Promise<CandleData[]> {
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
        const candles: CandleData[] = response.map((candleArray: number[]) => ({
          timestamp: candleArray[0],
          open: candleArray[1],
          high: candleArray[2],
          low: candleArray[3],
          close: candleArray[4],
          volume: candleArray[5]
        }));
        
        console.log(`📊 ${timeframe}min: ${candles.length} candles available (need 6 for progression)`);
        return candles;
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error fetching ${timeframe}min candles:`, error);
      return [];
    }
  }

  private async performFourCandleAnalysis(analysis: TimeframeAnalysis, fourCandles: CandleData[]): Promise<void> {
    console.log(`🔍 PERFORMING 4-CANDLE BATTU ANALYSIS at ${analysis.timeframe}min timeframe`);
    
    try {
      // Import slope calculator
      const { CorrectedSlopeCalculator } = await import('./corrected-slope-calculator');
      const calculator = new CorrectedSlopeCalculator(this.fyersAPI);
      
      const today = new Date().toISOString().split('T')[0];
      const result = await calculator.calculateSlopes(
        this.config.symbol,
        today,
        analysis.timeframe
      );
      
      analysis.fourCandleAnalysis = result;
      analysis.candles = fourCandles;
      
      console.log(`✅ 4-candle analysis completed for ${analysis.timeframe}min`);
      console.log(`   Patterns found: ${result.slopes?.length || 0}`);
      
    } catch (error) {
      console.error('❌ Error in 4-candle analysis:', error);
    }
  }

  private async applyFlexibleTrendlines(analysis: TimeframeAnalysis): Promise<void> {
    console.log(`🎯 APPLYING FLEXIBLE TRENDLINE RULES at ${analysis.timeframe}min`);
    
    if (!analysis.fourCandleAnalysis?.slopes) return;
    
    for (const slope of analysis.fourCandleAnalysis.slopes) {
      const rule = this.trendlineRules.find(r => r.pattern === slope.patternName);
      
      if (rule) {
        const trendline = {
          pattern: rule.pattern,
          pointA: rule.pointA,
          pointB: rule.pointB,
          trendlineEndpoint: rule.trendlineEndpoint,
          breakoutLevel: rule.breakoutLevel,
          isFlexible: rule.isFlexible,
          specialRule: rule.specialRule,
          timeframe: analysis.timeframe,
          slope: slope.slope,
          trendType: slope.trendType
        };
        
        analysis.trendlines.push(trendline);
        analysis.patterns.push(rule.pattern);
        
        if (rule.specialRule) {
          console.log(`🔸 SPECIAL RULE APPLIED: ${rule.pattern} - ${rule.specialRule}`);
        } else {
          console.log(`🔹 FLEXIBLE RULE: ${rule.pattern} - Trendline: ${rule.pointA}→${rule.trendlineEndpoint}, Breakout: ${rule.breakoutLevel}`);
        }
      }
    }
  }

  private async executeRecursiveDrilling(analysis: TimeframeAnalysis, sixCandles: CandleData[]): Promise<void> {
    console.log(`🔄 EXECUTING RECURSIVE DRILLING from ${analysis.timeframe}min`);
    
    // Apply recursive drilling rules based on candle availability
    const fifthCandle = sixCandles[4];
    const sixthCandle = sixCandles[5];
    
    if (fifthCandle && sixthCandle) {
      // 5th/6th candle methods - drill to 10min minimum
      await this.applyFifthSixthCandleMethods(analysis, [fifthCandle, sixthCandle]);
    }
    
    // Check for missing 4th candle scenarios
    if (sixCandles.length === 3) {
      // Missing 4th candle - drill to 20min minimum
      await this.applyMissingFourthCandleMethod(analysis, sixCandles);
    }
  }

  private async applyFifthSixthCandleMethods(analysis: TimeframeAnalysis, candles: CandleData[]): Promise<void> {
    const minimumTimeframe = 10;
    let drillTimeframe = Math.floor(analysis.timeframe / 2);
    
    console.log(`🔽 5th/6th CANDLE DRILLING: ${analysis.timeframe}min → ${drillTimeframe}min (minimum: ${minimumTimeframe}min)`);
    
    while (drillTimeframe >= minimumTimeframe) {
      console.log(`   Drilling to ${drillTimeframe}min level...`);
      
      // Apply Battu analysis at drill level
      await this.performDrillAnalysis(drillTimeframe, candles);
      
      // Continue drilling
      drillTimeframe = Math.floor(drillTimeframe / 2);
    }
  }

  private async applyMissingFourthCandleMethod(analysis: TimeframeAnalysis, candles: CandleData[]): Promise<void> {
    const minimumTimeframe = 20;
    let drillTimeframe = Math.floor(analysis.timeframe / 2);
    
    console.log(`🔽 MISSING 4th CANDLE DRILLING: ${analysis.timeframe}min → ${drillTimeframe}min (minimum: ${minimumTimeframe}min)`);
    
    while (drillTimeframe >= minimumTimeframe) {
      console.log(`   Drilling to ${drillTimeframe}min level for missing 4th candle...`);
      
      // Apply 3-candle analysis at drill level
      await this.performDrillAnalysis(drillTimeframe, candles);
      
      drillTimeframe = Math.floor(drillTimeframe / 2);
    }
  }

  private async performDrillAnalysis(timeframe: number, candles: CandleData[]): Promise<void> {
    try {
      // Apply appropriate analysis at drill timeframe
      console.log(`   📊 Performing drill analysis at ${timeframe}min with ${candles.length} candles`);
      
      // This would connect to specific drill methodologies
      // Implementation would call appropriate processors based on timeframe and candle count
      
    } catch (error) {
      console.error(`❌ Error in drill analysis at ${timeframe}min:`, error);
    }
  }

  private async checkMarketStatus(): Promise<boolean> {
    // Check if market is open
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketOpen = 9 * 60 + 15; // 555 minutes
    const marketClose = 15 * 60 + 30; // 930 minutes
    
    return totalMinutes >= marketOpen && totalMinutes <= marketClose;
  }

  async getSystemStatus(): Promise<any> {
    const activeTrades = Array.from(this.activeTrades.values());
    const totalProfitLoss = activeTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    
    return {
      running: this.systemRunning,
      currentTimeframe: this.currentTimeframe,
      activeTrades: activeTrades.length,
      totalTrades: activeTrades.length,
      totalProfitLoss,
      timeframeLevels: Array.from(this.timeframeLevels.entries()).map(([timeframe, analysis]) => ({
        timeframe,
        candles: analysis.candles.length,
        trades: analysis.trades.length,
        status: analysis.status,
        patterns: analysis.patterns
      }))
    };
  }

  async stopSystem(): Promise<void> {
    console.log('🛑 FLEXIBLE TIMEFRAME SYSTEM STOPPED');
    this.systemRunning = false;
  }

  getAllTrades(): TradeResult[] {
    return Array.from(this.activeTrades.values());
  }
}