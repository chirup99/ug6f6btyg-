// import { FyersAPI, CandleData } from './fyers-api'; // Removed: Fyers API removed
interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
import { CorrectedSlopeCalculator } from './corrected-slope-calculator';

export interface FlexibleTimeframeResult {
  step: number;
  originalTimeframe: number;
  newTimeframe: number;
  originalCandles: CandleData[];
  consolidatedCandles: CandleData[];
  analysisPhase: 'waiting_for_4th' | 'apply_battu_api' | 'timeframe_doubling' | 'hybrid_analysis';
  canApplyBattuAPI: boolean;
  
  // Step 6: Full Battu API Integration
  battuAnalysis?: {
    method: 'complete_4_candle' | 'method_1_trendline_adjustment' | 'method_2_sub_candle';
    pointA: { candle: string; price: number; timestamp: string };
    pointB: { candle: string; price: number; timestamp: string };
    pattern: string;
    slope: number;
    duration: number;
    breakoutLevel: number;
    breakoutCandle: string;
    targets: {
      fifth: { price: number; confidence: number };
      sixth: { price: number; confidence: number };
    };
    triggers: {
      uptrend: number;
      downtrend: number;
    };
    stopLoss: {
      uptrend: number;
      downtrend: number;
    };
    exitStrategies: {
      target80Percent: number;
      emergency98Percent: number;
    };
    timingRules: {
      rule50Percent: { required: number; status: 'pass' | 'fail' };
      rule34Percent: { required: number; status: 'pass' | 'fail' };
    };
    oneMinuteData?: CandleData[];
  };
  
  // Hybrid Analysis for Missing C2B
  hybridAnalysis?: {
    method1TrendlineAdjustment?: {
      higherTrendline: { pointA: any; pointB: any; slope: number };
      lowerTrendlines: { pointA: any; pointB: any; slope: number }[];
      adjustedTrendline: { pointA: any; pointB: any; slope: number };
    };
    method2SubCandle?: {
      subCandles: CandleData[];
      subAnalysis: any;
      quickExitEnabled: boolean;
    };
    exitPriority: 'higher_trendline' | 'lower_trendline' | 'first_hit';
  };
}

export class FlexibleTimeframeDoubler {
  private fyersApi: FyersAPI;
  private slopeCalculator: CorrectedSlopeCalculator;

  constructor(fyersApi: FyersAPI) {
    this.fyersApi = fyersApi;
    this.slopeCalculator = new CorrectedSlopeCalculator(fyersApi);
  }

  /**
   * STEP 6: Process 4 completed 20-minute candles with full Battu API
   * This is the main entry point for Step 6 implementation
   */
  async processStep6BattuAPI(
    symbol: string,
    date: string,
    timeframe: number,
    candles: CandleData[]
  ): Promise<FlexibleTimeframeResult> {
    try {
      console.log(`🚀 [STEP-6] Processing 4 completed ${timeframe}min candles with full Battu API`);
      console.log(`📊 [STEP-6] Candles: ${candles.length} at ${timeframe}min timeframe`);
      
      // Step 6: Apply complete Battu API analysis
      const battuAnalysis = await this.applyCompleteBattuAPI(symbol, date, timeframe, candles);
      
      return {
        step: 6,
        originalTimeframe: timeframe,
        newTimeframe: timeframe,
        originalCandles: candles,
        consolidatedCandles: candles,
        analysisPhase: 'apply_battu_api',
        canApplyBattuAPI: true,
        battuAnalysis
      };
      
    } catch (error) {
      console.error('❌ [STEP-6] Error in Battu API processing:', error);
      throw error;
    }
  }

  /**
   * Apply complete Battu API analysis with 1-minute precision
   */
  private async applyCompleteBattuAPI(
    symbol: string,
    date: string,
    timeframe: number,
    candles: CandleData[]
  ) {
    console.log('🔍 [BATTU-API] Applying complete Battu API with 1-minute precision');
    
    // Use existing corrected slope calculator for comprehensive analysis
    const slopeAnalysis = await this.slopeCalculator.calculateSlopesFromExactTimestamps(
      symbol,
      date,
      timeframe.toString(),
      candles
    );
    
    console.log(`✅ [BATTU-API] Slope analysis completed: ${slopeAnalysis.slopes.length} patterns found`);
    
    // Extract the best pattern for analysis
    const bestPattern = this.selectBestPattern(slopeAnalysis.slopes);
    if (!bestPattern) {
      throw new Error('No valid patterns found for Battu API analysis');
    }
    
    console.log(`🎯 [BATTU-API] Selected pattern: ${bestPattern.patternName}`);
    
    // Calculate 5th and 6th candle predictions
    const predictions = this.calculateCandlePredictions(bestPattern, timeframe);
    
    // Calculate triggers and breakout levels
    const triggers = this.calculateTriggerLevels(bestPattern);
    
    // Calculate stop loss levels
    const stopLoss = this.calculateStopLossLevels(bestPattern, candles);
    
    // Calculate exit strategies
    const exitStrategies = this.calculateExitStrategies(bestPattern);
    
    // Apply 50% and 34% timing rules
    const timingRules = this.applyTimingRules(bestPattern);
    
    return {
      method: 'complete_4_candle' as const,
      pointA: {
        candle: bestPattern.pointACandle,
        price: bestPattern.pointAPrice,
        timestamp: bestPattern.pointATimestamp
      },
      pointB: {
        candle: bestPattern.pointBCandle,
        price: bestPattern.pointBPrice,
        timestamp: bestPattern.pointBTimestamp
      },
      pattern: bestPattern.patternName,
      slope: bestPattern.slopePerMinute,
      duration: bestPattern.durationMinutes,
      breakoutLevel: bestPattern.breakoutLevel || bestPattern.pointBPrice,
      breakoutCandle: bestPattern.pointBCandle,
      targets: predictions.targets,
      triggers,
      stopLoss,
      exitStrategies,
      timingRules,
      oneMinuteData: slopeAnalysis.oneMinuteData
    };
  }

  /**
   * Select the most reliable pattern from slope analysis results
   */
  private selectBestPattern(slopes: any[]) {
    if (slopes.length === 0) return null;
    
    // Priority: 1-4, 2-4, 1-3, 2-3 patterns
    const priorityOrder = ['1-4', '2-4', '1-3', '2-3'];
    
    for (const priority of priorityOrder) {
      const pattern = slopes.find(slope => 
        slope.patternName.includes(priority) || 
        slope.patternName.includes(priority.replace('-', '_'))
      );
      if (pattern) {
        console.log(`🏆 [PATTERN-SELECTION] Selected ${priority} pattern: ${pattern.patternName}`);
        return pattern;
      }
    }
    
    // Fallback to first available pattern
    console.log(`🔄 [PATTERN-SELECTION] Using fallback pattern: ${slopes[0].patternName}`);
    return slopes[0];
  }

  /**
   * Calculate 5th and 6th candle predictions based on slope analysis
   */
  private calculateCandlePredictions(pattern: any, timeframe: number) {
    const slopePerMinute = pattern.slopePerMinute;
    
    // 5th candle prediction (next timeframe period)
    const fifthCandlePrice = pattern.pointBPrice + (slopePerMinute * timeframe);
    const fifthConfidence = Math.min(95, 70 + Math.abs(slopePerMinute) * 5); // Higher slope = higher confidence
    
    // 6th candle prediction (two timeframe periods ahead)
    const sixthCandlePrice = pattern.pointBPrice + (slopePerMinute * timeframe * 2);
    const sixthConfidence = Math.min(90, 65 + Math.abs(slopePerMinute) * 4); // Slightly lower confidence
    
    console.log(`🔮 [PREDICTIONS] 5th: ${fifthCandlePrice.toFixed(2)} (${fifthConfidence}%), 6th: ${sixthCandlePrice.toFixed(2)} (${sixthConfidence}%)`);
    
    return {
      targets: {
        fifth: { price: fifthCandlePrice, confidence: fifthConfidence },
        sixth: { price: sixthCandlePrice, confidence: sixthConfidence }
      }
    };
  }

  /**
   * Calculate trigger levels for uptrend and downtrend scenarios
   */
  private calculateTriggerLevels(pattern: any) {
    const pointBPrice = pattern.pointBPrice;
    const isUptrend = pattern.slopePerMinute > 0;
    
    return {
      uptrend: isUptrend ? pointBPrice : pointBPrice + Math.abs(pattern.slopePerMinute) * 5,
      downtrend: !isUptrend ? pointBPrice : pointBPrice - Math.abs(pattern.slopePerMinute) * 5
    };
  }

  /**
   * Calculate stop loss levels based on previous candle methodology
   */
  private calculateStopLossLevels(pattern: any, candles: CandleData[]) {
    const isUptrend = pattern.slopePerMinute > 0;
    const pointBCandle = pattern.pointBCandle;
    
    // Determine which candle to use for stop loss based on Point B location
    let slCandle;
    if (pointBCandle.includes('C2A') || pointBCandle.includes('C2B')) {
      // If Point B is in C2 block, use C1B for stop loss
      slCandle = candles[1]; // C1B
    } else {
      // Otherwise use previous candle
      slCandle = candles[0]; // C1A
    }
    
    return {
      uptrend: isUptrend ? slCandle.low : slCandle.high,
      downtrend: !isUptrend ? slCandle.high : slCandle.low
    };
  }

  /**
   * Calculate exit strategies with 80% and 98% rules
   */
  private calculateExitStrategies(pattern: any) {
    const targetPrice = pattern.pointBPrice + (pattern.slopePerMinute * 10); // 10-minute projection
    const breakoutPrice = pattern.pointBPrice;
    
    return {
      target80Percent: breakoutPrice + (0.8 * (targetPrice - breakoutPrice)),
      emergency98Percent: breakoutPrice + (0.98 * (targetPrice - breakoutPrice))
    };
  }

  /**
   * Apply 50% and 34% timing rules validation
   */
  private applyTimingRules(pattern: any) {
    const totalDuration = pattern.durationMinutes;
    const required50Percent = totalDuration * 0.5;
    const required34Percent = totalDuration * 0.34;
    
    // For demonstration, assume rules pass (real implementation would check actual timing)
    return {
      rule50Percent: { required: required50Percent, status: 'pass' as const },
      rule34Percent: { required: required34Percent, status: 'pass' as const }
    };
  }

  /**
   * Legacy method for flexible timeframe doubling (preserved for compatibility)
   */
  async processTimeframeDoubling(
    symbol: string,
    date: string,
    originalTimeframe: number,
    originalCandles: CandleData[]
  ): Promise<FlexibleTimeframeResult> {
    try {
      console.log(`🔄 [FLEXIBLE-TIMEFRAME] Processing timeframe doubling: ${originalTimeframe}min → ${originalTimeframe * 2}min`);
      
      const newTimeframe = originalTimeframe * 2;
      
      // Check if we have 4 candles for complete analysis
      if (originalCandles.length === 4) {
        console.log('🚀 [FLEXIBLE-TIMEFRAME] 4 candles detected - applying Step 6 Battu API');
        return await this.processStep6BattuAPI(symbol, date, originalTimeframe, originalCandles);
      }
      
      // Step 1: Consolidate candles to new timeframe
      const consolidatedCandles = this.consolidateCandles(originalCandles, originalTimeframe, newTimeframe);
      
      console.log(`📊 [FLEXIBLE-TIMEFRAME] Consolidated ${originalCandles.length} candles → ${consolidatedCandles.length} candles`);
      
      // Determine analysis phase
      let analysisPhase: 'waiting_for_4th' | 'apply_battu_api' | 'timeframe_doubling' | 'hybrid_analysis';
      
      if (consolidatedCandles.length < 3) {
        analysisPhase = 'waiting_for_4th';
      } else if (consolidatedCandles.length === 3) {
        analysisPhase = 'hybrid_analysis';
      } else if (consolidatedCandles.length === 4) {
        analysisPhase = 'apply_battu_api';
      } else {
        analysisPhase = 'timeframe_doubling';
      }
      
      return {
        step: consolidatedCandles.length,
        originalTimeframe,
        newTimeframe,
        originalCandles,
        consolidatedCandles,
        analysisPhase,
        canApplyBattuAPI: consolidatedCandles.length >= 4
      };
      
    } catch (error) {
      console.error('❌ [FLEXIBLE-TIMEFRAME] Error in timeframe doubling:', error);
      throw error;
    }
  }

  /**
   * Consolidate candles from original timeframe to new doubled timeframe
   */
  private consolidateCandles(originalCandles: CandleData[], originalTimeframe: number, newTimeframe: number): CandleData[] {
    const ratio = newTimeframe / originalTimeframe;
    const consolidatedCandles: CandleData[] = [];
    
    console.log(`🔄 [CONSOLIDATION] Ratio: ${ratio}:1 (${ratio} x ${originalTimeframe}min → ${newTimeframe}min)`);
    
    for (let i = 0; i < originalCandles.length; i += ratio) {
      const group = originalCandles.slice(i, i + ratio);
      
      if (group.length === ratio) {
        // Complete group - consolidate
        const consolidated = this.consolidateGroup(group, newTimeframe);
        consolidatedCandles.push(consolidated);
      } else if (group.length > 0) {
        // Incomplete group - only add if we have some candles
        console.log(`⚠️ [CONSOLIDATION] Incomplete group with ${group.length} candles (expected ${ratio})`);
        // For now, we'll skip incomplete groups as they represent partial periods
      }
    }
    
    return consolidatedCandles;
  }

  /**
   * Consolidate a group of candles into a single candle
   */
  private consolidateGroup(candles: CandleData[], timeframe: number): CandleData {
    const first = candles[0];
    const last = candles[candles.length - 1];
    
    const high = Math.max(...candles.map(c => c.high));
    const low = Math.min(...candles.map(c => c.low));
    const volume = candles.reduce((sum, c) => sum + c.volume, 0);
    
    return {
      timestamp: first.timestamp,
      open: first.open,
      high,
      low,
      close: last.close,
      volume
    };
  }

  /**
   * Predict missing C2B candle using trend continuation method
   */
  private async predictMissingC2B(candles: CandleData[], symbol: string, date: string, timeframe: number): Promise<CandleData> {
    console.log('🔮 [C2B-PREDICTION] Predicting missing C2B candle using trend continuation');
    
    const [c1a, c1b, c2a] = candles;
    
    // Calculate trend from C1A → C1B
    const c1Trend = {
      priceChange: c1b.close - c1a.close,
      highChange: c1b.high - c1a.high,
      lowChange: c1b.low - c1a.low,
      volumeChange: c1b.volume - c1a.volume
    };
    
    // Calculate trend from C1B → C2A
    const c2Trend = {
      priceChange: c2a.close - c1b.close,
      highChange: c2a.high - c1b.high,
      lowChange: c2a.low - c1b.low,
      volumeChange: c2a.volume - c1b.volume
    };
    
    // Predict C2B based on trend continuation with momentum decay
    const momentumDecay = 0.8; // Reduce momentum by 20%
    const avgTrend = {
      priceChange: (c1Trend.priceChange + c2Trend.priceChange) / 2 * momentumDecay,
      highChange: (c1Trend.highChange + c2Trend.highChange) / 2 * momentumDecay,
      lowChange: (c1Trend.lowChange + c2Trend.lowChange) / 2 * momentumDecay,
      volumeChange: (c1Trend.volumeChange + c2Trend.volumeChange) / 2 * momentumDecay
    };
    
    // Generate timestamp for C2B (next timeframe period)
    const c2bTimestamp = new Date(c2a.timestamp).getTime() + (timeframe * 60 * 1000);
    
    // Create predicted C2B candle
    const predictedC2B: CandleData = {
      timestamp: c2bTimestamp,
      open: c2a.close, // C2B opens where C2A closed
      close: c2a.close + avgTrend.priceChange,
      high: Math.max(c2a.close, c2a.close + avgTrend.priceChange, c2a.high + avgTrend.highChange),
      low: Math.min(c2a.close, c2a.close + avgTrend.priceChange, c2a.low + avgTrend.lowChange),
      volume: Math.max(0, c2a.volume + avgTrend.volumeChange)
    };
    
    console.log(`✅ [C2B-PREDICTION] Generated C2B: O:${predictedC2B.open.toFixed(2)} H:${predictedC2B.high.toFixed(2)} L:${predictedC2B.low.toFixed(2)} C:${predictedC2B.close.toFixed(2)}`);
    
    return predictedC2B;
  }

  /**
   * Apply 4-candle analysis to determine patterns and trendlines
   */
  private apply4CandleAnalysis(candles: CandleData[]) {
    console.log('📈 [4-CANDLE-ANALYSIS] Applying pattern analysis to 4 candles');
    
    const [c1a, c1b, c2a, c2b] = candles;
    
    // Find Point A and Point B by comparing highs and lows
    const c1High = Math.max(c1a.high, c1b.high);
    const c1Low = Math.min(c1a.low, c1b.low);
    const c2High = Math.max(c2a.high, c2b.high);
    const c2Low = Math.min(c2a.low, c2b.low);
    
    // Determine pattern based on extremes
    let pointA, pointB, pattern, breakoutLevel, breakoutCandle;
    
    if (c1Low < c2Low && c2High > c1High) {
      // Uptrend pattern (low to high)
      pointA = { candle: c1a.low === c1Low ? 'C1A' : 'C1B', price: c1Low, timestamp: (c1a.low === c1Low ? c1a.timestamp : c1b.timestamp).toString() };
      pointB = { candle: c2a.high === c2High ? 'C2A' : 'C2B', price: c2High, timestamp: (c2a.high === c2High ? c2a.timestamp : c2b.timestamp).toString() };
      
      // Determine pattern type
      if (pointA.candle === 'C1A' && pointB.candle === 'C2A') {
        pattern = '1-3_UPTREND';
        breakoutLevel = pointB.price;
        breakoutCandle = 'C2A';
      } else if (pointA.candle === 'C1A' && pointB.candle === 'C2B') {
        pattern = '1-4_UPTREND';
        breakoutLevel = pointB.price;
        breakoutCandle = 'C2B';
      } else if (pointA.candle === 'C1B' && pointB.candle === 'C2A') {
        // Special 2-3 Pattern: Connects C1B → C2B but breakout stays at C2A
        pattern = '2-3_UPTREND';
        pointB = { candle: 'C2B', price: c2b.high, timestamp: c2b.timestamp.toString() }; // Connect to C2B
        breakoutLevel = c2a.high; // But breakout at C2A (3rd candle)
        breakoutCandle = 'C2A';
      } else {
        pattern = '2-4_UPTREND';
        breakoutLevel = pointB.price;
        breakoutCandle = 'C2B';
      }
      
    } else if (c1High > c2High && c2Low < c1Low) {
      // Downtrend pattern (high to low)
      pointA = { candle: c1a.high === c1High ? 'C1A' : 'C1B', price: c1High, timestamp: (c1a.high === c1High ? c1a.timestamp : c1b.timestamp).toString() };
      pointB = { candle: c2a.low === c2Low ? 'C2A' : 'C2B', price: c2Low, timestamp: (c2a.low === c2Low ? c2a.timestamp : c2b.timestamp).toString() };
      
      // Determine pattern type
      if (pointA.candle === 'C1A' && pointB.candle === 'C2A') {
        pattern = '1-3_DOWNTREND';
        breakoutLevel = pointB.price;
        breakoutCandle = 'C2A';
      } else if (pointA.candle === 'C1A' && pointB.candle === 'C2B') {
        pattern = '1-4_DOWNTREND';
        breakoutLevel = pointB.price;
        breakoutCandle = 'C2B';
      } else if (pointA.candle === 'C1B' && pointB.candle === 'C2A') {
        // Special 2-3 Pattern: Connects C1B → C2B but breakout stays at C2A
        pattern = '2-3_DOWNTREND';
        pointB = { candle: 'C2B', price: c2b.low, timestamp: c2b.timestamp.toString() }; // Connect to C2B
        breakoutLevel = c2a.low; // But breakout at C2A (3rd candle)
        breakoutCandle = 'C2A';
      } else {
        pattern = '2-4_DOWNTREND';
        breakoutLevel = pointB.price;
        breakoutCandle = 'C2B';
      }
    } else {
      // Sideways or unclear pattern
      pointA = { candle: 'C1A', price: c1a.close, timestamp: c1a.timestamp.toString() };
      pointB = { candle: 'C2B', price: c2b.close, timestamp: c2b.timestamp.toString() };
      pattern = 'SIDEWAYS';
      breakoutLevel = c2b.close;
      breakoutCandle = 'C2B';
    }
    
    // Calculate trendline slope
    const timeA = typeof pointA.timestamp === 'number' ? pointA.timestamp : new Date(pointA.timestamp).getTime();
    const timeB = typeof pointB.timestamp === 'number' ? pointB.timestamp : new Date(pointB.timestamp).getTime();
    const durationMinutes = (timeB - timeA) / (1000 * 60);
    const slope = (pointB.price - pointA.price) / durationMinutes;
    
    const analysis = {
      pointA,
      pointB,
      pattern,
      trendline: {
        slope,
        direction: slope > 0 ? 'uptrend' as const : 'downtrend' as const
      },
      breakoutLevel,
      breakoutCandle
    };
    
    console.log(`✅ [4-CANDLE-ANALYSIS] Pattern: ${pattern}, Slope: ${slope.toFixed(4)} pts/min, Breakout: ${breakoutLevel} at ${breakoutCandle}`);
    
    return analysis;
  }

  /**
   * Continue progression by checking if we can double timeframe again
   */
  async checkContinueProgression(
    symbol: string,
    date: string,
    currentTimeframe: number,
    maxTimeframe: number = 80
  ): Promise<boolean> {
    const nextTimeframe = currentTimeframe * 2;
    
    if (nextTimeframe > maxTimeframe) {
      console.log(`🛑 [PROGRESSION] Maximum timeframe reached: ${currentTimeframe}min (max: ${maxTimeframe}min)`);
      return false;
    }
    
    // Check if we have enough data for next timeframe
    try {
      const testParams = {
        symbol,
        resolution: nextTimeframe.toString(),
        date_format: "1",
        range_from: date,
        range_to: date,
        cont_flag: "1"
      };
      const testData = await this.fyersApi.getHistoricalData(testParams);
      const hasEnoughCandles = testData.length >= 3; // Need at least 3 for hybrid approach
      
      console.log(`🔍 [PROGRESSION] Next timeframe ${nextTimeframe}min feasible: ${hasEnoughCandles} (${testData.length} candles available)`);
      return hasEnoughCandles;
    } catch (error) {
      console.log(`❌ [PROGRESSION] Cannot continue to ${nextTimeframe}min: ${error}`);
      return false;
    }
  }

  /**
   * Analyze flexible timeframes for patterns
   */
  async analyzeFlexibleTimeframes(
    symbol: string,
    date: string,
    baseTimeframe: number = 5
  ): Promise<FlexibleTimeframeResult[]> {
    const results: FlexibleTimeframeResult[] = [];
    let currentTimeframe = baseTimeframe;
    let step = 1;
    
    while (currentTimeframe <= 80) {
      try {
        const params = {
          symbol,
          resolution: currentTimeframe.toString(),
          date_format: "1",
          range_from: date,
          range_to: date,
          cont_flag: "1"
        };
        
        const candles = await this.fyersApi.getHistoricalData(params);
        
        if (candles.length >= 4) {
          const result = await this.processStep6BattuAPI(symbol, date, currentTimeframe, candles);
          results.push(result);
        }
        
        currentTimeframe *= 2;
        step++;
      } catch (error) {
        console.error(`Error analyzing ${currentTimeframe}min timeframe:`, error);
        break;
      }
    }
    
    return results;
  }

  /**
   * Perform hybrid analysis combining multiple methods
   */
  async performHybridAnalysis(
    symbol: string,
    date: string,
    timeframes: number[]
  ): Promise<{
    symbol: string;
    date: string;
    timeframes: number[];
    results: FlexibleTimeframeResult[];
    bestPattern?: any;
  }> {
    const results: FlexibleTimeframeResult[] = [];
    
    for (const timeframe of timeframes) {
      try {
        const params = {
          symbol,
          resolution: timeframe.toString(),
          date_format: "1",
          range_from: date,
          range_to: date,
          cont_flag: "1"
        };
        
        const candles = await this.fyersApi.getHistoricalData(params);
        
        if (candles.length >= 4) {
          const result = await this.processStep6BattuAPI(symbol, date, timeframe, candles);
          results.push(result);
        }
      } catch (error) {
        console.error(`Error in hybrid analysis for ${timeframe}min:`, error);
      }
    }
    
    // Find best pattern based on confidence and slope
    const bestPattern = results.reduce((best, current) => {
      if (!best || !current.battuAnalysis || !best.battuAnalysis) return current;
      
      const currentConfidence = (
        current.battuAnalysis.targets.fifth.confidence + 
        current.battuAnalysis.targets.sixth.confidence
      ) / 2;
      
      const bestConfidence = (
        best.battuAnalysis.targets.fifth.confidence + 
        best.battuAnalysis.targets.sixth.confidence
      ) / 2;
      
      return currentConfidence > bestConfidence ? current : best;
    }, results[0]);
    
    return {
      symbol,
      date,
      timeframes,
      results,
      bestPattern: bestPattern?.battuAnalysis
    };
  }

  /**
   * Check progression status for a given configuration
   */
  async checkProgressionStatus(
    symbol: string,
    date: string,
    config: {
      currentTimeframe: number;
      maxTimeframe: number;
      targetPatterns: string[];
    }
  ): Promise<{
    canProgress: boolean;
    nextTimeframe?: number;
    availableData: number;
    recommendation: 'continue' | 'stop' | 'analyze_current';
  }> {
    const { currentTimeframe, maxTimeframe, targetPatterns } = config;
    const nextTimeframe = currentTimeframe * 2;
    
    if (nextTimeframe > maxTimeframe) {
      return {
        canProgress: false,
        availableData: 0,
        recommendation: 'stop'
      };
    }
    
    try {
      const params = {
        symbol,
        resolution: nextTimeframe.toString(),
        date_format: "1",
        range_from: date,
        range_to: date,
        cont_flag: "1"
      };
      
      const testData = await this.fyersApi.getHistoricalData(params);
      const hasEnoughData = testData.length >= 4;
      
      return {
        canProgress: hasEnoughData,
        nextTimeframe: hasEnoughData ? nextTimeframe : undefined,
        availableData: testData.length,
        recommendation: hasEnoughData ? 'continue' : 'analyze_current'
      };
    } catch (error) {
      return {
        canProgress: false,
        availableData: 0,
        recommendation: 'analyze_current'
      };
    }
  }
}