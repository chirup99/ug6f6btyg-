// import { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

interface RecursiveCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface RecursivePointAB {
  pointA: {
    price: number;
    timestamp: number;
    exactTime: string;
    candleBlock: string;
    candleNumber: number;
  };
  pointB: {
    price: number;
    timestamp: number;
    exactTime: string;
    candleBlock: string;
    candleNumber: number;
  };
  patternLabel: string;
  slope: number;
  duration: number;
  timeframe: string;
  level: number;
}

interface RecursiveLevelAnalysis {
  level: number;
  timeframe: string;
  candleDuration: number;
  timeRange: {
    start: string;
    end: string;
    startTimestamp: number;
    endTimestamp: number;
  };
  fourCandles: RecursiveCandle[];
  uptrend: RecursivePointAB | null;
  downtrend: RecursivePointAB | null;
}

interface RecursiveAnalysisResult {
  symbol: string;
  date: string;
  totalLevels: number;
  levelAnalyses: RecursiveLevelAnalysis[];
  uptrendList: (string | null)[];
  downtrendList: (string | null)[];
  summary: {
    uptrendPatterns: number;
    downtrendPatterns: number;
    finalEndTime: string;
    totalRecursiveDepth: number;
  };
}

export class RecursivePointABAnalyzer {
  private fyersAPI: FyersAPI;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * RECURSIVE POINT A/B ANALYSIS - 80min to 5min
   * Implements fractal timeframe drilling with 4-candle rule at each level
   * Uses REAL TIME WINDOWS from the actual 80min analysis
   */
  async performRecursiveAnalysis(
    symbol: string,
    date: string,
    oneMinuteData: RecursiveCandle[]
  ): Promise<RecursiveAnalysisResult> {
    console.log('🔄 [RECURSIVE-ANALYSIS] Starting fractal Point A/B analysis...');
    console.log(`📊 Symbol: ${symbol}, Date: ${date}, 1-min candles: ${oneMinuteData.length}`);

    if (oneMinuteData.length < 320) {
      console.log('❌ [RECURSIVE-ANALYSIS] Insufficient data for 80min recursive analysis');
      return this.createEmptyResult(symbol, date);
    }

    const levelAnalyses: RecursiveLevelAnalysis[] = [];
    const uptrendList: (string | null)[] = [];
    const downtrendList: (string | null)[] = [];

    // Use first 320 minutes for 80min analysis (4 x 80min candles)
    const first320Minutes = oneMinuteData.slice(0, 320);
    
    // Level 1: 80min timeframe - ALL 320 minutes (4 x 80min candles)
    console.log(`🔍 [LEVEL-1] Processing 320 minutes for 80min timeframe analysis`);
    const level1Result = await this.analyzeDataSlice(
      first320Minutes,
      1,
      '80min',
      80,
      4
    );
    levelAnalyses.push(level1Result);
    uptrendList.push(level1Result.uptrend?.patternLabel || null);
    downtrendList.push(level1Result.downtrend?.patternLabel || null);

    // Level 2: 40min timeframe - Last 160 minutes (4 x 40min candles from C2A+C2B)
    const last160Minutes = first320Minutes.slice(160); // Last 2 x 80min periods = 160 minutes
    console.log(`🔍 [LEVEL-2] Processing last 160 minutes for 40min timeframe analysis`);
    const level2Result = await this.analyzeDataSlice(
      last160Minutes,
      2,
      '40min',
      40,
      4
    );
    levelAnalyses.push(level2Result);
    uptrendList.push(level2Result.uptrend?.patternLabel || null);
    downtrendList.push(level2Result.downtrend?.patternLabel || null);

    // Level 3: 20min timeframe - Last 80 minutes (4 x 20min candles from C2A+C2B of Level 2)
    const last80Minutes = last160Minutes.slice(80); // Last 2 x 40min periods = 80 minutes
    console.log(`🔍 [LEVEL-3] Processing last 80 minutes for 20min timeframe analysis`);
    const level3Result = await this.analyzeDataSlice(
      last80Minutes,
      3,
      '20min',
      20,
      4
    );
    levelAnalyses.push(level3Result);
    uptrendList.push(level3Result.uptrend?.patternLabel || null);
    downtrendList.push(level3Result.downtrend?.patternLabel || null);

    // Level 4: 10min timeframe - Last 40 minutes (4 x 10min candles from C2A+C2B of Level 3)
    const last40Minutes = last80Minutes.slice(40); // Last 2 x 20min periods = 40 minutes
    console.log(`🔍 [LEVEL-4] Processing last 40 minutes for 10min timeframe analysis`);
    const level4Result = await this.analyzeDataSlice(
      last40Minutes,
      4,
      '10min',
      10,
      4
    );
    levelAnalyses.push(level4Result);
    uptrendList.push(level4Result.uptrend?.patternLabel || null);
    downtrendList.push(level4Result.downtrend?.patternLabel || null);

    // Level 5: 5min timeframe - Last 20 minutes (4 x 5min candles from C2A+C2B of Level 4)
    const last20Minutes = last40Minutes.slice(20); // Last 2 x 10min periods = 20 minutes
    console.log(`🔍 [LEVEL-5] Processing last 20 minutes for 5min timeframe analysis`);
    const level5Result = await this.analyzeDataSlice(
      last20Minutes,
      5,
      '5min',
      5,
      4
    );
    levelAnalyses.push(level5Result);
    uptrendList.push(level5Result.uptrend?.patternLabel || null);
    downtrendList.push(level5Result.downtrend?.patternLabel || null);

    console.log('✅ [RECURSIVE-ANALYSIS] Fractal analysis complete - 5 levels analyzed');
    console.log(`📈 [RECURSIVE-UPTREND] Pattern sequence: [${uptrendList.join(', ')}]`);
    console.log(`📉 [RECURSIVE-DOWNTREND] Pattern sequence: [${downtrendList.join(', ')}]`);

    return {
      symbol,
      date,
      totalLevels: 5,
      levelAnalyses,
      uptrendList,
      downtrendList,
      summary: {
        uptrendPatterns: uptrendList.filter(p => p !== null).length,
        downtrendPatterns: downtrendList.filter(p => p !== null).length,
        finalEndTime: this.timestampToTimeString(last20Minutes[last20Minutes.length - 1]?.timestamp || 0),
        totalRecursiveDepth: 5
      }
    };
  }

  private createEmptyResult(symbol: string, date: string): RecursiveAnalysisResult {
    return {
      symbol,
      date,
      totalLevels: 5,
      levelAnalyses: [],
      uptrendList: [null, null, null, null, null],
      downtrendList: [null, null, null, null, null],
      summary: {
        uptrendPatterns: 0,
        downtrendPatterns: 0,
        finalEndTime: '14:35',
        totalRecursiveDepth: 5
      }
    };
  }

  private async analyzeDataSlice(
    dataSlice: RecursiveCandle[],
    level: number,
    timeframeName: string,
    candleDurationMins: number,
    numCandles: number
  ): Promise<RecursiveLevelAnalysis> {
    console.log(`🔍 [LEVEL-${level}] Analyzing ${timeframeName} timeframe with ${dataSlice.length} minutes of data`);

    if (dataSlice.length === 0) {
      console.log(`❌ [LEVEL-${level}] No data available for ${timeframeName} analysis`);
      return this.createEmptyLevelAnalysis(level, timeframeName, candleDurationMins);
    }

    const startTime = this.timestampToTimeString(dataSlice[0].timestamp);
    const endTime = this.timestampToTimeString(dataSlice[dataSlice.length - 1].timestamp);

    // Apply AUTHENTIC Point A/B Analysis (4 Candle Rule Methodology) directly to real 1-minute data
    const authenticAnalysis = await this.applyAuthenticPointABAnalysis(dataSlice, level, timeframeName);
    
    if (!authenticAnalysis.uptrend && !authenticAnalysis.downtrend) {
      console.log(`❌ [LEVEL-${level}] No patterns found using authentic Point A/B methodology`);
      return this.createEmptyLevelAnalysis(level, timeframeName, candleDurationMins);
    }
    
    const uptrend = authenticAnalysis.uptrend;
    const downtrend = authenticAnalysis.downtrend;

    console.log(`📊 [LEVEL-${level}] ${uptrend ? 'Found' : 'No'} uptrend pattern, ${downtrend ? 'Found' : 'No'} downtrend pattern`);

    return {
      level,
      timeframe: timeframeName,
      candleDuration: candleDurationMins,
      timeRange: {
        start: startTime,
        end: endTime,
        startTimestamp: dataSlice[0].timestamp,
        endTimestamp: dataSlice[dataSlice.length - 1].timestamp
      },
      fourCandles: [], // No longer creating virtual candles, using authentic analysis
      uptrend,
      downtrend
    };
  }

  private createEmptyLevelAnalysis(level: number, timeframeName: string, candleDurationMins: number): RecursiveLevelAnalysis {
    return {
      level,
      timeframe: timeframeName,
      candleDuration: candleDurationMins,
      timeRange: {
        start: '00:00',
        end: '00:00',
        startTimestamp: 0,
        endTimestamp: 0
      },
      fourCandles: [],
      uptrend: null,
      downtrend: null
    };
  }

  private timestampToTimeString(timestamp: number): string {
    if (!timestamp) return '00:00';
    return new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
  }

  private async analyzeTimeframeLevel(
    oneMinuteData: RecursiveCandle[],
    level: number,
    timeframeName: string,
    candleDurationMins: number,
    startTime: string,
    endTime: string,
    symbol: string,
    date: string
  ): Promise<RecursiveLevelAnalysis> {
    console.log(`🔍 [LEVEL-${level}] Analyzing ${timeframeName} timeframe (${startTime} - ${endTime})`);

    // Convert time strings to timestamps for the given date
    const startTimestamp = this.timeStringToTimestamp(date, startTime);
    const endTimestamp = this.timeStringToTimestamp(date, endTime);

    // Filter 1-minute data for this time range
    const timeRangeData = oneMinuteData.filter(candle => 
      candle.timestamp >= startTimestamp && candle.timestamp <= endTimestamp
    );

    console.log(`📊 [LEVEL-${level}] Found ${timeRangeData.length} 1-minute candles for analysis`);

    // Create 4 equal-duration candles from the time range
    const fourCandles = this.createAuthenticFourCandles(timeRangeData, candleDurationMins);

    console.log(`🕐 [LEVEL-${level}] Created 4 x ${candleDurationMins}min candles:`);
    fourCandles.forEach((candle, idx) => {
      const candleTime = new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
      console.log(`   C${idx + 1}: ${candleTime} - O:${candle.open} H:${candle.high} L:${candle.low} C:${candle.close}`);
    });

    // Apply 4-candle rule methodology to identify Point A/B
    const uptrend = this.extractUptrendPointAB(fourCandles, timeRangeData, level, timeframeName);
    const downtrend = this.extractDowntrendPointAB(fourCandles, timeRangeData, level, timeframeName);

    return {
      level,
      timeframe: timeframeName,
      candleDuration: candleDurationMins,
      timeRange: {
        start: startTime,
        end: endTime,
        startTimestamp,
        endTimestamp
      },
      fourCandles,
      uptrend,
      downtrend
    };
  }

  /**
   * AUTHENTIC POINT A/B ANALYSIS (4 CANDLE RULE METHODOLOGY)
   * Uses the SAME methodology as authentic-c2-block-analyzer.ts
   * Directly applies 4-candle rule to real 1-minute data without virtual candle creation
   */
  private async applyAuthenticPointABAnalysis(
    real1MinuteData: RecursiveCandle[],
    level: number,
    timeframeName: string
  ): Promise<{ uptrend: RecursivePointAB | null; downtrend: RecursivePointAB | null }> {
    console.log(`🎯 [AUTHENTIC-L${level}] Applying Point A/B Analysis (4 Candle Rule) to ${real1MinuteData.length} real 1-min candles`);
    
    // Group real 1-minute candles into 4 equal groups (same as authentic-c2-block-analyzer.ts)
    const candlesPerGroup = Math.floor(real1MinuteData.length / 4);
    if (candlesPerGroup < 1) {
      console.log(`❌ [AUTHENTIC-L${level}] Insufficient data for 4-candle grouping: ${real1MinuteData.length} candles`);
      return { uptrend: null, downtrend: null };
    }
    
    // Create 4 real candle groups from 1-minute data (AUTHENTIC METHOD)
    const candle1Data = real1MinuteData.slice(0, candlesPerGroup);
    const candle2Data = real1MinuteData.slice(candlesPerGroup, candlesPerGroup * 2);
    const candle3Data = real1MinuteData.slice(candlesPerGroup * 2, candlesPerGroup * 3);
    const candle4Data = real1MinuteData.slice(candlesPerGroup * 3);
    
    // Create real OHLC candles from 1-minute data (same as authentic analyzer)
    const realCandle1 = this.createRealCandle(candle1Data);
    const realCandle2 = this.createRealCandle(candle2Data);
    const realCandle3 = this.createRealCandle(candle3Data);
    const realCandle4 = this.createRealCandle(candle4Data);
    
    console.log(`✅ [AUTHENTIC-L${level}] Created 4 real candles from authentic 1-minute data`);
    console.log(`   Real C1: O:${realCandle1.open} H:${realCandle1.high} L:${realCandle1.low} C:${realCandle1.close}`);
    console.log(`   Real C2: O:${realCandle2.open} H:${realCandle2.high} L:${realCandle2.low} C:${realCandle2.close}`);
    console.log(`   Real C3: O:${realCandle3.open} H:${realCandle3.high} L:${realCandle3.low} C:${realCandle3.close}`);
    console.log(`   Real C4: O:${realCandle4.open} H:${realCandle4.high} L:${realCandle4.low} C:${realCandle4.close}`);
    
    // Apply 4 Candle Rule patterns (SAME as authentic-c2-block-analyzer.ts)
    const patterns = [
      // Uptrend patterns
      { 
        name: '2-3', 
        pointA: { price: realCandle2.low, timestamp: realCandle2.timestamp, candle: 2 },
        pointB: { price: realCandle3.high, timestamp: realCandle3.timestamp, candle: 3 },
        trend: 'UP' as const 
      },
      { 
        name: '2-4', 
        pointA: { price: realCandle2.low, timestamp: realCandle2.timestamp, candle: 2 },
        pointB: { price: realCandle4.high, timestamp: realCandle4.timestamp, candle: 4 },
        trend: 'UP' as const 
      },
      { 
        name: '1-3', 
        pointA: { price: realCandle1.low, timestamp: realCandle1.timestamp, candle: 1 },
        pointB: { price: realCandle3.high, timestamp: realCandle3.timestamp, candle: 3 },
        trend: 'UP' as const 
      },
      { 
        name: '1-4', 
        pointA: { price: realCandle1.low, timestamp: realCandle1.timestamp, candle: 1 },
        pointB: { price: realCandle4.high, timestamp: realCandle4.timestamp, candle: 4 },
        trend: 'UP' as const 
      },
      // Downtrend patterns
      { 
        name: '1-3', 
        pointA: { price: realCandle1.high, timestamp: realCandle1.timestamp, candle: 1 },
        pointB: { price: realCandle3.low, timestamp: realCandle3.timestamp, candle: 3 },
        trend: 'DOWN' as const 
      },
      { 
        name: '1-4', 
        pointA: { price: realCandle1.high, timestamp: realCandle1.timestamp, candle: 1 },
        pointB: { price: realCandle4.low, timestamp: realCandle4.timestamp, candle: 4 },
        trend: 'DOWN' as const 
      },
      { 
        name: '2-3', 
        pointA: { price: realCandle2.high, timestamp: realCandle2.timestamp, candle: 2 },
        pointB: { price: realCandle3.low, timestamp: realCandle3.timestamp, candle: 3 },
        trend: 'DOWN' as const 
      },
      { 
        name: '2-4', 
        pointA: { price: realCandle2.high, timestamp: realCandle2.timestamp, candle: 2 },
        pointB: { price: realCandle4.low, timestamp: realCandle4.timestamp, candle: 4 },
        trend: 'DOWN' as const 
      }
    ];

    // Find strongest uptrend pattern
    let bestUptrend: RecursivePointAB | null = null;
    let maxUptrendSlope = 0;
    
    // Find strongest downtrend pattern  
    let bestDowntrend: RecursivePointAB | null = null;
    let minDowntrendSlope = 0;
    
    for (const pattern of patterns) {
      const duration = (pattern.pointB.timestamp - pattern.pointA.timestamp) / 60; // minutes
      const slope = (pattern.pointB.price - pattern.pointA.price) / duration;
      
      if (pattern.trend === 'UP' && pattern.pointB.price > pattern.pointA.price && slope > maxUptrendSlope) {
        maxUptrendSlope = slope;
        bestUptrend = {
          pointA: {
            price: pattern.pointA.price,
            timestamp: pattern.pointA.timestamp,
            exactTime: this.timestampToTimeString(pattern.pointA.timestamp),
            candleBlock: pattern.pointA.candle < 3 ? 'C1A' : 'C2A',
            candleNumber: pattern.pointA.candle
          },
          pointB: {
            price: pattern.pointB.price,
            timestamp: pattern.pointB.timestamp,
            exactTime: this.timestampToTimeString(pattern.pointB.timestamp),
            candleBlock: pattern.pointB.candle < 3 ? 'C2A' : 'C2B',
            candleNumber: pattern.pointB.candle
          },
          patternLabel: pattern.name,
          slope,
          duration,
          timeframe: timeframeName,
          level
        };
      } else if (pattern.trend === 'DOWN' && pattern.pointB.price < pattern.pointA.price && slope < minDowntrendSlope) {
        minDowntrendSlope = slope;
        bestDowntrend = {
          pointA: {
            price: pattern.pointA.price,
            timestamp: pattern.pointA.timestamp,
            exactTime: this.timestampToTimeString(pattern.pointA.timestamp),
            candleBlock: pattern.pointA.candle < 3 ? 'C1A' : 'C2A',
            candleNumber: pattern.pointA.candle
          },
          pointB: {
            price: pattern.pointB.price,
            timestamp: pattern.pointB.timestamp,
            exactTime: this.timestampToTimeString(pattern.pointB.timestamp),
            candleBlock: pattern.pointB.candle < 3 ? 'C2A' : 'C2B',
            candleNumber: pattern.pointB.candle
          },
          patternLabel: pattern.name,
          slope,
          duration,
          timeframe: timeframeName,
          level
        };
      }
    }

    if (bestUptrend) {
      console.log(`📈 [AUTHENTIC-L${level}] Uptrend ${bestUptrend.patternLabel}: ${bestUptrend.pointA.exactTime} @ ${bestUptrend.pointA.price} → ${bestUptrend.pointB.exactTime} @ ${bestUptrend.pointB.price} (Slope: ${bestUptrend.slope.toFixed(4)})`);
    }
    
    if (bestDowntrend) {
      console.log(`📉 [AUTHENTIC-L${level}] Downtrend ${bestDowntrend.patternLabel}: ${bestDowntrend.pointA.exactTime} @ ${bestDowntrend.pointA.price} → ${bestDowntrend.pointB.exactTime} @ ${bestDowntrend.pointB.price} (Slope: ${bestDowntrend.slope.toFixed(4)})`);
    }

    return { uptrend: bestUptrend, downtrend: bestDowntrend };
  }

  /**
   * Create real OHLC candle from 1-minute data (same as authentic-c2-block-analyzer.ts)
   */
  private createRealCandle(candleData: RecursiveCandle[]): RecursiveCandle {
    if (candleData.length === 0) {
      throw new Error('Cannot create candle from empty data');
    }
    
    const open = candleData[0].open;
    const close = candleData[candleData.length - 1].close;
    const high = Math.max(...candleData.map(c => c.high));
    const low = Math.min(...candleData.map(c => c.low));
    const volume = candleData.reduce((sum, c) => sum + c.volume, 0);
    const timestamp = candleData[0].timestamp;

    return {
      timestamp,
      open,
      high,
      low,
      close,
      volume
    };
  }

  private extractUptrendPointAB(
    fourCandles: RecursiveCandle[],
    oneMinuteData: RecursiveCandle[],
    level: number,
    timeframe: string
  ): RecursivePointAB | null {
    if (fourCandles.length < 4) return null;

    // Test all uptrend patterns: 1-3, 1-4, 2-3, 2-4
    const patterns = [
      { start: 0, end: 2, label: '1-3' }, // C1A → C2A
      { start: 0, end: 3, label: '1-4' }, // C1A → C2B  
      { start: 1, end: 2, label: '2-3' }, // C1B → C2A
      { start: 1, end: 3, label: '2-4' }  // C1B → C2B
    ];

    let bestPattern: RecursivePointAB | null = null;
    let bestSlope = 0;

    for (const pattern of patterns) {
      const startCandle = fourCandles[pattern.start];
      const endCandle = fourCandles[pattern.end];

      // Find exact Point A (low) and Point B (high) using 1-minute data
      const pointA = this.findExactLowInCandle(oneMinuteData, startCandle.timestamp, startCandle.low);
      const pointB = this.findExactHighInCandle(oneMinuteData, endCandle.timestamp, endCandle.high);

      if (pointA && pointB && pointB.price > pointA.price) {
        const duration = (pointB.timestamp - pointA.timestamp) / 60; // minutes
        const slope = (pointB.price - pointA.price) / duration;

        if (slope > bestSlope) {
          bestSlope = slope;
          bestPattern = {
            pointA: {
              ...pointA,
              candleBlock: pattern.start < 2 ? 'C1A' : 'C1B',
              candleNumber: pattern.start + 1
            },
            pointB: {
              ...pointB,
              candleBlock: pattern.end < 2 ? 'C2A' : 'C2B',
              candleNumber: pattern.end + 1
            },
            patternLabel: pattern.label,
            slope,
            duration,
            timeframe,
            level
          };
        }
      }
    }

    if (bestPattern) {
      console.log(`📈 [LEVEL-${level}] Uptrend ${bestPattern.patternLabel}: ${bestPattern.pointA.exactTime} @ ${bestPattern.pointA.price} → ${bestPattern.pointB.exactTime} @ ${bestPattern.pointB.price} (Slope: ${bestPattern.slope.toFixed(4)})`);
    }

    return bestPattern;
  }

  private extractDowntrendPointAB(
    fourCandles: RecursiveCandle[],
    oneMinuteData: RecursiveCandle[],
    level: number,
    timeframe: string
  ): RecursivePointAB | null {
    if (fourCandles.length < 4) return null;

    // Test all downtrend patterns: 1-3, 1-4, 2-3, 2-4
    const patterns = [
      { start: 0, end: 2, label: '1-3' }, // C1A → C2A
      { start: 0, end: 3, label: '1-4' }, // C1A → C2B
      { start: 1, end: 2, label: '2-3' }, // C1B → C2A
      { start: 1, end: 3, label: '2-4' }  // C1B → C2B
    ];

    let bestPattern: RecursivePointAB | null = null;
    let bestSlope = 0; // Most negative slope

    for (const pattern of patterns) {
      const startCandle = fourCandles[pattern.start];
      const endCandle = fourCandles[pattern.end];

      // Find exact Point A (high) and Point B (low) using 1-minute data
      const pointA = this.findExactHighInCandle(oneMinuteData, startCandle.timestamp, startCandle.high);
      const pointB = this.findExactLowInCandle(oneMinuteData, endCandle.timestamp, endCandle.low);

      if (pointA && pointB && pointB.price < pointA.price) {
        const duration = (pointB.timestamp - pointA.timestamp) / 60; // minutes
        const slope = (pointB.price - pointA.price) / duration; // Negative slope

        if (slope < bestSlope) {
          bestSlope = slope;
          bestPattern = {
            pointA: {
              ...pointA,
              candleBlock: pattern.start < 2 ? 'C1A' : 'C1B',
              candleNumber: pattern.start + 1
            },
            pointB: {
              ...pointB,
              candleBlock: pattern.end < 2 ? 'C2A' : 'C2B',
              candleNumber: pattern.end + 1
            },
            patternLabel: pattern.label,
            slope,
            duration,
            timeframe,
            level
          };
        }
      }
    }

    if (bestPattern) {
      console.log(`📉 [LEVEL-${level}] Downtrend ${bestPattern.patternLabel}: ${bestPattern.pointA.exactTime} @ ${bestPattern.pointA.price} → ${bestPattern.pointB.exactTime} @ ${bestPattern.pointB.price} (Slope: ${bestPattern.slope.toFixed(4)})`);
    }

    return bestPattern;
  }

  private findExactLowInCandle(
    oneMinuteData: RecursiveCandle[],
    candleStartTimestamp: number,
    targetLow: number
  ): { price: number; timestamp: number; exactTime: string } | null {
    // Find the 1-minute candle that contains this low price
    const matchingCandle = oneMinuteData.find(candle => 
      candle.low === targetLow && 
      Math.abs(candle.timestamp - candleStartTimestamp) < 7200 // Within 2 hour range
    );

    if (matchingCandle) {
      return {
        price: matchingCandle.low,
        timestamp: matchingCandle.timestamp,
        exactTime: this.timestampToTimeString(matchingCandle.timestamp)
      };
    }

    return null;
  }

  private findExactHighInCandle(
    oneMinuteData: RecursiveCandle[],
    candleStartTimestamp: number,
    targetHigh: number
  ): { price: number; timestamp: number; exactTime: string } | null {
    // Find the 1-minute candle that contains this high price
    const matchingCandle = oneMinuteData.find(candle => 
      candle.high === targetHigh && 
      Math.abs(candle.timestamp - candleStartTimestamp) < 7200 // Within 2 hour range
    );

    if (matchingCandle) {
      return {
        price: matchingCandle.high,
        timestamp: matchingCandle.timestamp,
        exactTime: this.timestampToTimeString(matchingCandle.timestamp)
      };
    }

    return null;
  }

  private timeStringToTimestamp(date: string, time: string): number {
    // Convert "14:35" format to timestamp for given date in IST
    const [hours, minutes] = time.split(':').map(Number);
    
    // Parse date components
    const [year, month, day] = date.split('-').map(Number);
    
    // Create date in IST (we need to match the timezone of the actual market data)
    // Market data from Fyers is already in IST timestamps
    const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Convert to UTC seconds (matching the format of our 1-minute data)
    return Math.floor(dateObj.getTime() / 1000);
  }
}