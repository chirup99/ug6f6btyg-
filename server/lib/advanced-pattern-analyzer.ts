import { CandleData } from '../types';

interface PatternScore {
  '1-3': number;
  '2-4': number;
  '1-4': number;
  '2-3': number;
}

interface InternalPattern {
  timeframe: number;
  downtrend: string;
  uptrend: string;
  downtrendScore: number;
  uptrendScore: number;
}

interface TrendAnalysis {
  trend: 'uptrend' | 'downtrend';
  patterns: InternalPattern[];
  totalScore: number;
  strongestTimeframe: number;
  recommendation: string;
}

export class AdvancedPatternAnalyzer {
  private static readonly PATTERN_SCORES: PatternScore = {
    '1-3': 100,  // Highest power
    '2-4': 75,   // Medium-high power  
    '1-4': 50,   // Medium power
    '2-3': 25    // Weakest pattern
  };

  /**
   * Analyzes internal patterns using real 1-minute data from Cycle 1 Point A/B Analysis
   * This uses the actual OHLC values already available in the system
   */
  static analyzeInternalPatterns(
    candleData: CandleData[], 
    baseTimeframe: number,
    oneMinuteData: CandleData[]
  ): TrendAnalysis {
    console.log(`🔍 [INTERNAL-PATTERN] Using real 1-minute data for ${baseTimeframe}min analysis`);
    console.log(`📊 [INTERNAL-PATTERN] Available 1-minute candles: ${oneMinuteData.length}`);
    
    const internalPatterns: InternalPattern[] = [];
    
    // 1. Analyze base timeframe (e.g., 80min) using original 4 candles
    const basePattern = this.detectPatternInTimeframe(candleData.slice(0, 4), baseTimeframe);
    internalPatterns.push(basePattern);
    
    // 2. Extract C2 block from 1-minute data and create 40min candles
    const halfTimeframe = baseTimeframe / 2;
    const c2StartMinute = baseTimeframe * 2; // C2 block starts at timeframe*2
    const c2OneMinuteData = oneMinuteData.slice(c2StartMinute, c2StartMinute + (baseTimeframe * 2));
    
    if (c2OneMinuteData.length >= halfTimeframe * 4) {
      const halfCandles = this.createRealCandlesFromOneMinute(c2OneMinuteData, halfTimeframe);
      if (halfCandles.length >= 4) {
        const halfPattern = this.detectPatternInTimeframe(halfCandles, halfTimeframe);
        internalPatterns.push(halfPattern);
        
        // 3. Extract C2 block of 40min and create 20min candles  
        const quarterTimeframe = baseTimeframe / 4;
        const c2Of40Start = halfTimeframe * 2; // C2 of 40min data
        const c2Of40OneMinute = c2OneMinuteData.slice(c2Of40Start, c2Of40Start + (halfTimeframe * 2));
        
        if (c2Of40OneMinute.length >= quarterTimeframe * 4) {
          const quarterCandles = this.createRealCandlesFromOneMinute(c2Of40OneMinute, quarterTimeframe);
          if (quarterCandles.length >= 4) {
            const quarterPattern = this.detectPatternInTimeframe(quarterCandles, quarterTimeframe);
            internalPatterns.push(quarterPattern);
          }
        }
      }
    }
    
    console.log(`📊 [INTERNAL-PATTERN] Real OHLC analysis results:`);
    internalPatterns.forEach(pattern => {
      console.log(`   ${pattern.timeframe}min: Downtrend ${pattern.downtrend} (${pattern.downtrendScore}), Uptrend ${pattern.uptrend} (${pattern.uptrendScore})`);
    });
    
    return this.compareTrendStrength(internalPatterns, baseTimeframe);
  }

  /**
   * Creates accurate timeframe candles from real 1-minute OHLC data
   */
  private static createRealCandlesFromOneMinute(
    oneMinuteData: CandleData[],
    targetTimeframe: number
  ): CandleData[] {
    const candles: CandleData[] = [];
    
    for (let i = 0; i < oneMinuteData.length; i += targetTimeframe) {
      const chunk = oneMinuteData.slice(i, i + targetTimeframe);
      if (chunk.length === targetTimeframe) {
        // Use real OHLC aggregation from 1-minute data
        candles.push({
          timestamp: chunk[0].timestamp,
          open: chunk[0].open,
          high: Math.max(...chunk.map(c => c.high)),
          low: Math.min(...chunk.map(c => c.low)),
          close: chunk[chunk.length - 1].close,
          volume: chunk.reduce((sum, c) => sum + c.volume, 0)
        });
      }
    }
    
    console.log(`📊 [REAL-OHLC] Created ${candles.length} ${targetTimeframe}min candles from real 1-minute data`);
    return candles;
  }

  /**
   * Detects pattern type (1-3, 1-4, 2-3, 2-4) for given 4 candles
   */
  private static detectPatternInTimeframe(
    candles: CandleData[], 
    timeframe: number
  ): InternalPattern {
    if (candles.length < 4) {
      return {
        timeframe,
        downtrend: '2-3', // Default to weakest
        uptrend: '2-3',   // Default to weakest
        downtrendScore: this.PATTERN_SCORES['2-3'],
        uptrendScore: this.PATTERN_SCORES['2-3']
      };
    }

    // Extract C1 and C2 blocks
    const c1Block = candles.slice(0, 2); // 1st, 2nd candles
    const c2Block = candles.slice(2, 4); // 3rd, 4th candles
    
    // For downtrend: Find highest in C1, lowest in C2
    const c1High = Math.max(c1Block[0].high, c1Block[1].high);
    const c1HighIndex = c1Block[0].high >= c1Block[1].high ? 1 : 2;
    const c2Low = Math.min(c2Block[0].low, c2Block[1].low);
    const c2LowIndex = c2Block[0].low <= c2Block[1].low ? 3 : 4;
    
    // For uptrend: Find lowest in C1, highest in C2
    const c1Low = Math.min(c1Block[0].low, c1Block[1].low);
    const c1LowIndex = c1Block[0].low <= c1Block[1].low ? 1 : 2;
    const c2High = Math.max(c2Block[0].high, c2Block[1].high);
    const c2HighIndex = c2Block[0].high >= c2Block[1].high ? 3 : 4;
    
    // Determine pattern types
    const downtrendPattern = `${c1HighIndex}-${c2LowIndex}` as keyof PatternScore;
    const uptrendPattern = `${c1LowIndex}-${c2HighIndex}` as keyof PatternScore;
    
    return {
      timeframe,
      downtrend: downtrendPattern,
      uptrend: uptrendPattern,
      downtrendScore: this.PATTERN_SCORES[downtrendPattern] || this.PATTERN_SCORES['2-3'],
      uptrendScore: this.PATTERN_SCORES[uptrendPattern] || this.PATTERN_SCORES['2-3']
    };
  }



  /**
   * Compares uptrend vs downtrend strength across all internal timeframes
   */
  private static compareTrendStrength(
    patterns: InternalPattern[], 
    baseTimeframe: number
  ): TrendAnalysis {
    let uptrendTotal = 0;
    let downtrendTotal = 0;
    let strongestTimeframe = baseTimeframe;
    let maxScore = 0;
    
    // Calculate weighted scores (higher timeframes get more weight)
    patterns.forEach(pattern => {
      const weight = pattern.timeframe / baseTimeframe; // Higher timeframe = higher weight
      const weightedUptrendScore = pattern.uptrendScore * weight;
      const weightedDowntrendScore = pattern.downtrendScore * weight;
      
      uptrendTotal += weightedUptrendScore;
      downtrendTotal += weightedDowntrendScore;
      
      // Track strongest individual timeframe
      const maxPatternScore = Math.max(pattern.uptrendScore, pattern.downtrendScore);
      if (maxPatternScore > maxScore) {
        maxScore = maxPatternScore;
        strongestTimeframe = pattern.timeframe;
      }
    });
    
    const isUptrendStronger = uptrendTotal > downtrendTotal;
    const strongerTrend = isUptrendStronger ? 'uptrend' : 'downtrend';
    const totalScore = Math.max(uptrendTotal, downtrendTotal);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(patterns, strongerTrend, strongestTimeframe);
    
    console.log(`🎯 [TREND-ANALYSIS] Result: ${strongerTrend.toUpperCase()} stronger`);
    console.log(`   Uptrend Total: ${uptrendTotal.toFixed(1)}`);
    console.log(`   Downtrend Total: ${downtrendTotal.toFixed(1)}`);
    console.log(`   Strongest Timeframe: ${strongestTimeframe}min`);
    console.log(`   Recommendation: ${recommendation}`);
    
    return {
      trend: strongerTrend,
      patterns,
      totalScore,
      strongestTimeframe,
      recommendation
    };
  }

  /**
   * Generates trading recommendation based on pattern analysis
   */
  private static generateRecommendation(
    patterns: InternalPattern[], 
    strongerTrend: 'uptrend' | 'downtrend',
    strongestTimeframe: number
  ): string {
    const strongestPattern = patterns.find(p => p.timeframe === strongestTimeframe);
    if (!strongestPattern) return 'No clear recommendation';
    
    const trendScore = strongerTrend === 'uptrend' 
      ? strongestPattern.uptrendScore 
      : strongestPattern.downtrendScore;
    
    const trendPattern = strongerTrend === 'uptrend'
      ? strongestPattern.uptrend
      : strongestPattern.downtrend;
    
    if (trendScore >= 75) {
      return `Strong ${strongerTrend} signal (${trendPattern}) at ${strongestTimeframe}min - High confidence entry`;
    } else if (trendScore >= 50) {
      return `Moderate ${strongerTrend} signal (${trendPattern}) at ${strongestTimeframe}min - Caution advised`;
    } else {
      return `Weak ${strongerTrend} signal (${trendPattern}) at ${strongestTimeframe}min - Avoid entry`;
    }
  }

  /**
   * Main entry point for enhanced pattern analysis
   */
  static analyzeAdvancedPatterns(
    symbol: string,
    candleData: CandleData[],
    baseTimeframe: number
  ) {
    console.log(`🚀 [ADVANCED-PATTERN] Starting enhanced analysis for ${symbol} at ${baseTimeframe}min`);
    
    const analysis = this.analyzeInternalPatterns(candleData, baseTimeframe);
    
    console.log(`✅ [ADVANCED-PATTERN] Analysis complete for ${baseTimeframe}min timeframe`);
    console.log(`   Selected Trend: ${analysis.trend.toUpperCase()}`);
    console.log(`   Best Timeframe for 5th/6th Candle: ${analysis.strongestTimeframe}min`);
    
    return analysis;
  }
}