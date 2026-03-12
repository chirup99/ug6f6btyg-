// import { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

interface RecursiveCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PointAB {
  price: number;
  timestamp: number;
  exactTime: string;
  candleName: string;
  candleNumber: number;
}

interface PatternAnalysis {
  patternLabel: string; // 1-3, 1-4, 2-3, 2-4
  slope: number;
  duration: number;
  pointA: PointAB;
  pointB: PointAB;
  breakoutLevel: number;
  confidence: number;
  level: string; // "MAIN", "L1", "L2", "L3"
  timeframe: string;
}

interface RecursiveC2Analysis {
  mainPattern: {
    uptrend: PatternAnalysis | null;
    downtrend: PatternAnalysis | null;
  };
  subLevels: {
    level1: {
      uptrend: PatternAnalysis | null;
      downtrend: PatternAnalysis | null;
    };
    level2: {
      uptrend: PatternAnalysis | null;
      downtrend: PatternAnalysis | null;
    };
    level3: {
      uptrend: PatternAnalysis | null;
      downtrend: PatternAnalysis | null;
    };
  };
  selectedPattern: {
    uptrend: PatternAnalysis | null;
    downtrend: PatternAnalysis | null;
    reason: string;
  };
}

export class AdvancedRecursiveC2BlockAnalyzer {
  private fyersAPI: FyersAPI;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * ADVANCED RECURSIVE C2 BLOCK DRILLING METHODOLOGY
   * Enhanced BATTU API with multi-level fractal analysis within C2 block
   */
  async performAdvancedRecursiveC2Analysis(
    symbol: string,
    date: string,
    fourCandles: RecursiveCandle[],
    baseTimeframe: number
  ): Promise<RecursiveC2Analysis> {
    console.log('🔄 [ADVANCED-C2-RECURSIVE] Starting enhanced C2 block drilling analysis');
    console.log(`📊 Symbol: ${symbol}, Date: ${date}, Base Timeframe: ${baseTimeframe}min`);

    if (fourCandles.length < 4) {
      throw new Error('Insufficient candles for C2 recursive analysis');
    }

    // Step 1: Main BATTU Analysis (C1 → C2)
    console.log('🎯 [MAIN-ANALYSIS] Performing main C1→C2 BATTU analysis');
    const mainAnalysis = await this.performMainBattuAnalysis(fourCandles, baseTimeframe, 'MAIN');

    // Step 2: Get C2 Block (3rd and 4th candles)
    const c2Block = fourCandles.slice(2, 4); // C2A and C2B
    console.log('🔍 [C2-BLOCK] Extracting C2 block for recursive drilling');
    console.log(`   C2A: ${this.formatCandle(c2Block[0])}`);
    console.log(`   C2B: ${this.formatCandle(c2Block[1])}`);

    // Step 3: Recursive C2 Block Drilling
    const subLevels = await this.performC2BlockDrilling(symbol, date, c2Block, baseTimeframe);

    // Step 4: Pattern Comparison and Selection
    const selectedPattern = this.selectOptimalPattern(mainAnalysis, subLevels);

    return {
      mainPattern: mainAnalysis,
      subLevels,
      selectedPattern
    };
  }

  private async performC2BlockDrilling(
    symbol: string,
    date: string,
    c2Block: RecursiveCandle[],
    baseTimeframe: number
  ) {
    console.log('🔄 [C2-DRILLING] Starting recursive C2 block analysis');

    const results = {
      level1: { uptrend: null as PatternAnalysis | null, downtrend: null as PatternAnalysis | null },
      level2: { uptrend: null as PatternAnalysis | null, downtrend: null as PatternAnalysis | null },
      level3: { uptrend: null as PatternAnalysis | null, downtrend: null as PatternAnalysis | null }
    };

    // Level 1: Split C2 block into 4 sub-candles (half duration each)
    const level1Timeframe = baseTimeframe / 2;
    if (level1Timeframe >= 5) {
      console.log(`🔍 [LEVEL-1] Drilling C2 block at ${level1Timeframe}min timeframe`);
      const level1Candles = await this.splitC2BlockIntoSubCandles(symbol, date, c2Block, level1Timeframe);
      if (level1Candles.length >= 4) {
        results.level1 = await this.performMainBattuAnalysis(level1Candles, level1Timeframe, 'L1');
      }

      // Level 2: Further split if possible
      const level2Timeframe = level1Timeframe / 2;
      if (level2Timeframe >= 5 && level1Candles.length >= 4) {
        console.log(`🔍 [LEVEL-2] Drilling deeper at ${level2Timeframe}min timeframe`);
        const newC2Block = level1Candles.slice(2, 4);
        const level2Candles = await this.splitC2BlockIntoSubCandles(symbol, date, newC2Block, level2Timeframe);
        if (level2Candles.length >= 4) {
          results.level2 = await this.performMainBattuAnalysis(level2Candles, level2Timeframe, 'L2');
        }

        // Level 3: Final drill if possible
        const level3Timeframe = level2Timeframe / 2;
        if (level3Timeframe >= 5 && level2Candles.length >= 4) {
          console.log(`🔍 [LEVEL-3] Final drill at ${level3Timeframe}min timeframe`);
          const newC2Block2 = level2Candles.slice(2, 4);
          const level3Candles = await this.splitC2BlockIntoSubCandles(symbol, date, newC2Block2, level3Timeframe);
          if (level3Candles.length >= 4) {
            results.level3 = await this.performMainBattuAnalysis(level3Candles, level3Timeframe, 'L3');
          }
        }
      }
    }

    return results;
  }

  private async splitC2BlockIntoSubCandles(
    symbol: string,
    date: string,
    c2Block: RecursiveCandle[],
    newTimeframe: number
  ): Promise<RecursiveCandle[]> {
    console.log(`🔧 [SPLIT-C2] Splitting C2 block into ${newTimeframe}min sub-candles`);

    // Calculate time range for C2 block
    const startTime = c2Block[0].timestamp;
    const endTime = c2Block[c2Block.length - 1].timestamp + (newTimeframe * 2 * 60); // C2A + C2B duration

    // Fetch 1-minute data for the C2 block time range
    const oneMinuteData = await this.fetch1MinuteDataForRange(symbol, date, startTime, endTime);
    
    if (oneMinuteData.length === 0) {
      console.log('❌ [SPLIT-C2] No 1-minute data available for splitting');
      return [];
    }

    // Create 4 equal duration sub-candles
    const subCandleDuration = newTimeframe; // Each sub-candle duration
    const subCandles: RecursiveCandle[] = [];

    for (let i = 0; i < 4; i++) {
      const subStartIndex = i * subCandleDuration;
      const subEndIndex = Math.min((i + 1) * subCandleDuration, oneMinuteData.length);
      
      if (subStartIndex < oneMinuteData.length) {
        const subCandleData = oneMinuteData.slice(subStartIndex, subEndIndex);
        if (subCandleData.length > 0) {
          const subCandle = this.createCandleFromMinuteData(subCandleData);
          subCandles.push(subCandle);
        }
      }
    }

    console.log(`✅ [SPLIT-C2] Created ${subCandles.length} sub-candles from C2 block`);
    return subCandles;
  }

  private async performMainBattuAnalysis(
    fourCandles: RecursiveCandle[],
    timeframe: number,
    level: string
  ): Promise<{uptrend: PatternAnalysis | null, downtrend: PatternAnalysis | null}> {
    console.log(`🎯 [${level}-BATTU] Performing BATTU analysis at ${timeframe}min timeframe`);

    if (fourCandles.length < 4) {
      return { uptrend: null, downtrend: null };
    }

    // C1 Block = C1A + C1B (first 2 candles)
    const c1Block = fourCandles.slice(0, 2);
    // C2 Block = C2A + C2B (last 2 candles)  
    const c2Block = fourCandles.slice(2, 4);

    // Find Point A/B for uptrend (C1 low → C2 high)
    const uptrendAnalysis = this.findUptrendPattern(c1Block, c2Block, timeframe, level);
    
    // Find Point A/B for downtrend (C1 high → C2 low)
    const downtrendAnalysis = this.findDowntrendPattern(c1Block, c2Block, timeframe, level);

    console.log(`📊 [${level}-RESULT] Uptrend: ${uptrendAnalysis ? 'Found' : 'None'}, Downtrend: ${downtrendAnalysis ? 'Found' : 'None'}`);

    return {
      uptrend: uptrendAnalysis,
      downtrend: downtrendAnalysis
    };
  }

  private findUptrendPattern(
    c1Block: RecursiveCandle[], 
    c2Block: RecursiveCandle[], 
    timeframe: number,
    level: string
  ): PatternAnalysis | null {
    // Find lowest point in C1 block
    let pointA: PointAB | null = null;
    c1Block.forEach((candle, index) => {
      if (!pointA || candle.low < pointA.price) {
        pointA = {
          price: candle.low,
          timestamp: candle.timestamp,
          exactTime: new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN'),
          candleName: `C1${index === 0 ? 'A' : 'B'}`,
          candleNumber: index + 1
        };
      }
    });

    // Find highest point in C2 block
    let pointB: PointAB | null = null;
    c2Block.forEach((candle, index) => {
      if (!pointB || candle.high > pointB.price) {
        pointB = {
          price: candle.high,
          timestamp: candle.timestamp,
          exactTime: new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN'),
          candleName: `C2${index === 0 ? 'A' : 'B'}`,
          candleNumber: index + 3
        };
      }
    });

    if (!pointA || !pointB || pointB.price <= pointA.price) {
      return null;
    }

    // Calculate pattern details
    const duration = (pointB.timestamp - pointA.timestamp) / 60; // in minutes
    const slope = (pointB.price - pointA.price) / duration;
    const patternLabel = `${pointA.candleNumber}-${pointB.candleNumber}`;

    // Calculate confidence based on slope strength and duration
    const confidence = this.calculatePatternConfidence(slope, duration, timeframe);

    return {
      patternLabel,
      slope,
      duration,
      pointA,
      pointB,
      breakoutLevel: pointB.price,
      confidence,
      level,
      timeframe: `${timeframe}min`
    };
  }

  private findDowntrendPattern(
    c1Block: RecursiveCandle[], 
    c2Block: RecursiveCandle[], 
    timeframe: number,
    level: string
  ): PatternAnalysis | null {
    // Find highest point in C1 block
    let pointA: PointAB | null = null;
    c1Block.forEach((candle, index) => {
      if (!pointA || candle.high > pointA.price) {
        pointA = {
          price: candle.high,
          timestamp: candle.timestamp,
          exactTime: new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN'),
          candleName: `C1${index === 0 ? 'A' : 'B'}`,
          candleNumber: index + 1
        };
      }
    });

    // Find lowest point in C2 block
    let pointB: PointAB | null = null;
    c2Block.forEach((candle, index) => {
      if (!pointB || candle.low < pointB.price) {
        pointB = {
          price: candle.low,
          timestamp: candle.timestamp,
          exactTime: new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN'),
          candleName: `C2${index === 0 ? 'A' : 'B'}`,
          candleNumber: index + 3
        };
      }
    });

    if (!pointA || !pointB || pointB.price >= pointA.price) {
      return null;
    }

    // Calculate pattern details
    const duration = (pointB.timestamp - pointA.timestamp) / 60; // in minutes
    const slope = (pointB.price - pointA.price) / duration; // Will be negative
    const patternLabel = `${pointA.candleNumber}-${pointB.candleNumber}`;

    // Calculate confidence
    const confidence = this.calculatePatternConfidence(Math.abs(slope), duration, timeframe);

    return {
      patternLabel,
      slope,
      duration,
      pointA,
      pointB,
      breakoutLevel: pointB.price,
      confidence,
      level,
      timeframe: `${timeframe}min`
    };
  }

  private selectOptimalPattern(
    mainAnalysis: {uptrend: PatternAnalysis | null, downtrend: PatternAnalysis | null},
    subLevels: any
  ): {uptrend: PatternAnalysis | null, downtrend: PatternAnalysis | null, reason: string} {
    console.log('🏆 [PATTERN-SELECTION] Comparing all patterns to select optimal ones');

    // Collect all patterns
    const allUptrendPatterns: PatternAnalysis[] = [];
    const allDowntrendPatterns: PatternAnalysis[] = [];

    // Add main patterns
    if (mainAnalysis.uptrend) allUptrendPatterns.push(mainAnalysis.uptrend);
    if (mainAnalysis.downtrend) allDowntrendPatterns.push(mainAnalysis.downtrend);

    // Add sub-level patterns
    Object.values(subLevels).forEach((level: any) => {
      if (level.uptrend) allUptrendPatterns.push(level.uptrend);
      if (level.downtrend) allDowntrendPatterns.push(level.downtrend);
    });

    // Select best uptrend pattern
    const selectedUptrend = this.selectBestPattern(allUptrendPatterns);
    
    // Select best downtrend pattern
    const selectedDowntrend = this.selectBestPattern(allDowntrendPatterns);

    let reason = 'Selected based on: ';
    if (selectedUptrend) reason += `Uptrend(${selectedUptrend.level}-${selectedUptrend.timeframe}) `;
    if (selectedDowntrend) reason += `Downtrend(${selectedDowntrend.level}-${selectedDowntrend.timeframe})`;

    console.log(`✅ [SELECTION-COMPLETE] ${reason}`);

    return {
      uptrend: selectedUptrend,
      downtrend: selectedDowntrend,
      reason
    };
  }

  private selectBestPattern(patterns: PatternAnalysis[]): PatternAnalysis | null {
    if (patterns.length === 0) return null;
    if (patterns.length === 1) return patterns[0];

    // Selection criteria (in order of priority):
    // 1. Highest confidence score
    // 2. Strongest slope (absolute value)
    // 3. Optimal duration (not too short, not too long)
    // 4. Lower timeframe (more precise)

    return patterns.reduce((best, current) => {
      // Priority 1: Confidence
      if (current.confidence > best.confidence) return current;
      if (current.confidence < best.confidence) return best;

      // Priority 2: Slope strength
      const currentSlopeStrength = Math.abs(current.slope);
      const bestSlopeStrength = Math.abs(best.slope);
      if (currentSlopeStrength > bestSlopeStrength) return current;
      if (currentSlopeStrength < bestSlopeStrength) return best;

      // Priority 3: Duration optimization (prefer 10-30 minute range)
      const currentDurationScore = this.getDurationScore(current.duration);
      const bestDurationScore = this.getDurationScore(best.duration);
      if (currentDurationScore > bestDurationScore) return current;
      if (currentDurationScore < bestDurationScore) return best;

      // Priority 4: Lower timeframe (more precise)
      const currentTimeframe = parseInt(current.timeframe);
      const bestTimeframe = parseInt(best.timeframe);
      if (currentTimeframe < bestTimeframe) return current;

      return best;
    });
  }

  private calculatePatternConfidence(slope: number, duration: number, timeframe: number): number {
    let confidence = 50; // Base confidence

    // Slope strength factor (0-30 points)
    const slopeStrength = Math.abs(slope);
    if (slopeStrength >= 3) confidence += 30;
    else if (slopeStrength >= 2) confidence += 20;
    else if (slopeStrength >= 1) confidence += 10;

    // Duration factor (0-20 points)
    if (duration >= 10 && duration <= 30) confidence += 20;
    else if (duration >= 5 && duration <= 40) confidence += 10;

    // Timeframe factor (0-20 points)
    if (timeframe === 5) confidence += 20; // Most precise
    else if (timeframe === 10) confidence += 15;
    else if (timeframe === 20) confidence += 10;

    return Math.min(confidence, 95); // Cap at 95%
  }

  private getDurationScore(duration: number): number {
    // Optimal range: 10-30 minutes
    if (duration >= 10 && duration <= 30) return 100;
    if (duration >= 5 && duration <= 40) return 80;
    if (duration >= 40 && duration <= 60) return 60;
    return 40;
  }

  private async fetch1MinuteDataForRange(
    symbol: string, 
    date: string, 
    startTimestamp: number, 
    endTimestamp: number
  ): Promise<RecursiveCandle[]> {
    try {
      const response = await this.fyersAPI.getHistoricalData(
        symbol,
        '1',
        date,
        date
      );

      if (response.candles && response.candles.length > 0) {
        return response.candles
          .filter(candle => candle.timestamp >= startTimestamp && candle.timestamp <= endTimestamp)
          .map(candle => ({
            timestamp: candle.timestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume
          }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching 1-minute data for range:', error);
      return [];
    }
  }

  private createCandleFromMinuteData(minuteData: RecursiveCandle[]): RecursiveCandle {
    if (minuteData.length === 0) {
      throw new Error('Cannot create candle from empty minute data');
    }

    const open = minuteData[0].open;
    const close = minuteData[minuteData.length - 1].close;
    const high = Math.max(...minuteData.map(d => d.high));
    const low = Math.min(...minuteData.map(d => d.low));
    const volume = minuteData.reduce((sum, d) => sum + (d.volume || 0), 0);
    const timestamp = minuteData[0].timestamp;

    return { timestamp, open, high, low, close, volume };
  }

  private formatCandle(candle: RecursiveCandle): string {
    const time = new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN');
    return `${time} O:${candle.open} H:${candle.high} L:${candle.low} C:${candle.close}`;
  }
}