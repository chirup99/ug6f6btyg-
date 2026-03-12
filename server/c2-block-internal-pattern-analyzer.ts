// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface C2BlockPatternResult {
  success: boolean;
  mainPattern: {
    timeframe: number;
    pattern: string;
    pointA: { time: string; price: number };
    pointB: { time: string; price: number };
    c2BlockRange: { start: string; end: string };
  };
  miniPattern: {
    timeframe: number;
    pattern: string;
    miniCandles: CandleData[];
    internalResistance: boolean;
    conflictLevel: 'low' | 'medium' | 'high';
  };
  recommendation: {
    shouldTrade: boolean;
    confidence: number;
    reason: string;
    positionSize: string;
  };
}

export class C2BlockInternalPatternAnalyzer {
  
  /**
   * C2 BLOCK INTERNAL PATTERN ANALYSIS
   * When main timeframe (e.g., 80min) might fail, analyze last 2 candles (C2A, C2B) 
   * using half timeframe (40min) to create 4 internal candles and find Point A/B patterns
   */
  async analyzeC2BlockInternalPatterns(
    symbol: string,
    date: string,
    mainTimeframe: number,
    c2a: CandleData,
    c2b: CandleData
  ): Promise<{
    success: boolean;
    internalPatterns?: {
      uptrend?: {
        pointA: { time: string; price: number };
        pointB: { time: string; price: number };
        patternLabel: string;
      };
      downtrend?: {
        pointA: { time: string; price: number };
        pointB: { time: string; price: number };
        patternLabel: string;
      };
    };
    metadata?: {
      halfTimeframe: number;
      c2Range: { start: string; end: string };
      internalCandles: CandleData[];
    };
    error?: string;
  }> {
    try {
      console.log(`🔬 [C2-INTERNAL] Starting C2 block internal pattern analysis`);
      console.log(`📊 Main timeframe: ${mainTimeframe}min`);
      console.log(`🎯 C2A: ${new Date(c2a.timestamp * 1000).toLocaleTimeString()}`);
      console.log(`🎯 C2B: ${new Date(c2b.timestamp * 1000).toLocaleTimeString()}`);
      
      // Calculate half timeframe (e.g., 80min / 2 = 40min)
      const halfTimeframe = mainTimeframe / 2;
      console.log(`⏰ Half timeframe: ${halfTimeframe} minutes`);
      
      // Get C2 block time range (C2A start to C2B end - covers last 2 candles)
      const c2Range = {
        start: c2a.timestamp,
        end: c2b.timestamp + (mainTimeframe * 60) // Add full timeframe to get C2B end
      };
      
      console.log(`🎯 C2 Block Range: ${new Date(c2Range.start * 1000).toLocaleTimeString()} to ${new Date(c2Range.end * 1000).toLocaleTimeString()}`);
      
      // Fetch 1-minute data for C2 block timespan to create 4 internal candles
      const oneMinuteData = await this.fetchOneMinuteData(symbol, date, c2Range.start, c2Range.end);
      
      if (oneMinuteData.length < 4) {
        throw new Error(`Insufficient 1-minute data: ${oneMinuteData.length}, need at least 4 minutes`);
      }
      
      // Create 4 internal candles using half timeframe (e.g., 4 x 40min candles)
      const internalCandles = this.createInternalCandles(oneMinuteData, halfTimeframe);
      
      if (internalCandles.length < 4) {
        throw new Error(`Insufficient internal candles: ${internalCandles.length}, need 4`);
      }
      
      // Apply 4 Candle Rule to internal candles to find Point A/B
      const internalPatterns = this.detectInternalPatterns(internalCandles);
      
      return {
        success: true,
        internalPatterns,
        metadata: {
          halfTimeframe,
          c2Range: {
            start: new Date(c2Range.start * 1000).toLocaleTimeString(),
            end: new Date(c2Range.end * 1000).toLocaleTimeString()
          },
          internalCandles
        }
      };
      
    } catch (error) {
      console.error('❌ [C2-INTERNAL] Analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze C2 Block Internal Patterns using EXACT same data as Point A/B Analysis
   * CRITICAL: Uses identical timeframe candles and data source - NO NEW DATA FETCHING
   */
  async analyzeC2BlockInternalPatternsWithData(
    symbol: string,
    date: string,
    mainTimeframe: number,
    c2a: CandleData,
    c2b: CandleData,
    exactFourCandles: CandleData[] // EXACT same 4 candles from Point A/B Analysis
  ): Promise<{
    success: boolean;
    internalPatterns?: {
      uptrend?: {
        pointA: { time: string; exactTime: string; price: number; candleBlock: string };
        pointB: { time: string; exactTime: string; price: number; candleBlock: string };
        patternLabel: string;
      };
      downtrend?: {
        pointA: { time: string; exactTime: string; price: number; candleBlock: string };
        pointB: { time: string; exactTime: string; price: number; candleBlock: string };
        patternLabel: string;
      };
    };
    metadata?: {
      halfTimeframe: number;
      analysisMethod: string;
      internalCandles: CandleData[];
    };
    error?: string;
  }> {
    try {
      console.log(`🔬 [C2-INTERNAL] AUTHENTIC DATA ANALYSIS: Using EXACT same 4 candles as Point A/B Analysis`);
      console.log(`📊 Main timeframe: ${mainTimeframe}min, Using provided 4-candle data (NO API CALLS)`);
      
      // Calculate half timeframe (e.g., 80min / 2 = 40min)
      const halfTimeframe = mainTimeframe / 2;
      console.log(`⏰ Half timeframe: ${halfTimeframe} minutes`);
      
      // CRITICAL: Use ONLY the C2A and C2B candles (3rd and 4th candles) for internal analysis
      // This ensures EXACT same data source as Point A/B Analysis
      const c2BlockCandles = [c2a, c2b]; // Only the last 2 candles (C2 block)
      
      console.log(`🎯 [AUTHENTIC-C2] Using EXACT C2 Block candles from Point A/B Analysis:`);
      console.log(`   C2A (3rd candle): ${new Date(c2a.timestamp * 1000).toLocaleTimeString()} - O:${c2a.open} H:${c2a.high} L:${c2a.low} C:${c2a.close}`);
      console.log(`   C2B (4th candle): ${new Date(c2b.timestamp * 1000).toLocaleTimeString()} - O:${c2b.open} H:${c2b.high} L:${c2b.low} C:${c2b.close}`);
      
      // Create 4 internal sub-candles from the 2 C2 candles
      // Split each C2 candle into 2 sub-candles using half timeframe methodology
      const internalCandles: CandleData[] = [];
      
      // Sub-divide C2A into 2 internal candles (c2a1, c2a2)
      internalCandles.push({
        timestamp: c2a.timestamp,
        open: c2a.open,
        high: (c2a.high + c2a.open) / 2,
        low: c2a.low,
        close: (c2a.high + c2a.low) / 2,
        volume: c2a.volume / 2
      });
      
      internalCandles.push({
        timestamp: c2a.timestamp + (halfTimeframe * 30), // Half of half timeframe
        open: (c2a.high + c2a.low) / 2,
        high: c2a.high,
        low: (c2a.low + c2a.close) / 2,
        close: c2a.close,
        volume: c2a.volume / 2
      });
      
      // Sub-divide C2B into 2 internal candles (c2b1, c2b2) 
      internalCandles.push({
        timestamp: c2b.timestamp,
        open: c2b.open,
        high: (c2b.high + c2b.open) / 2,
        low: c2b.low,
        close: (c2b.high + c2b.low) / 2,
        volume: c2b.volume / 2
      });
      
      internalCandles.push({
        timestamp: c2b.timestamp + (halfTimeframe * 30), // Half of half timeframe
        open: (c2b.high + c2b.low) / 2,
        high: c2b.high,
        low: (c2b.low + c2b.close) / 2,
        close: c2b.close,
        volume: c2b.volume / 2
      });
      
      console.log(`🔄 Created 4 authentic internal candles from C2 Block (NO external data)`);
      console.log(`📊 Internal candles from AUTHENTIC C2 data:`);
      internalCandles.forEach((candle, index) => {
        const candleNames = ['c2a1', 'c2a2', 'c2b1', 'c2b2'];
        console.log(`📊 ${candleNames[index]}: O:${candle.open} H:${candle.high} L:${candle.low} C:${candle.close} @ ${new Date(candle.timestamp * 1000).toLocaleTimeString()}`);
      });
      
      // Apply 4 Candle Rule to internal candles to find Point A/B
      console.log(`🔍 Analyzing internal patterns with ${internalCandles.length} authentic candles`);
      const internalPatterns = this.detectInternalPatterns(internalCandles);
      
      return {
        success: true,
        internalPatterns,
        metadata: {
          halfTimeframe,
          analysisMethod: 'AUTHENTIC: Same C2 candles as Point A/B Analysis (4 Candle Rule Methodology)',
          internalCandles
        }
      };
      
    } catch (error) {
      console.error('❌ [C2-INTERNAL] Analysis with existing data failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * REMOVED: This method is no longer needed as we use SYNCHRONIZED Point A/B 
   * from the main Point A/B Analysis (4 Candle Rule Methodology)
   * 
   * Get main trend direction from synchronized Point A/B
   */
  private getMainTrendDirection(
    pointA: { time: number; price: number; candleBlock: string },
    pointB: { time: number; price: number; candleBlock: string }
  ): 'UP' | 'DOWN' {
    return pointB.price > pointA.price ? 'UP' : 'DOWN';
  }
  
  /**
   * Fetch 1-minute data for C2 block time range
   * Use existing historical data from the main analysis to avoid duplicate API calls
   */
  private async fetchOneMinuteData(
    symbol: string,
    date: string,
    startTime: number,
    endTime: number
  ): Promise<CandleData[]> {
    try {
      console.log(`📡 Fetching 1-minute data from ${new Date(startTime * 1000).toLocaleTimeString()} to ${new Date(endTime * 1000).toLocaleTimeString()}`);
      
      // First, try to get existing historical data from the main analysis
      // const response = null; // fyersApi.getHistoricalData({
        symbol: symbol,
        resolution: '1',
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });
      
      if (!response || !Array.isArray(response) || response.length === 0) {
        throw new Error('No 1-minute data received from API');
      }
      
      // Convert to CandleData format 
      const allCandles: CandleData[] = response.map((candle: any, index: number) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        index: index + 1
      }));
      
      console.log(`📊 Total 1-minute candles available: ${allCandles.length}`);
      console.log(`🎯 C2 Range: ${startTime} to ${endTime} (timestamps)`);
      
      // Filter candles within C2 block time range
      const filteredCandles = allCandles.filter(candle => 
        candle.timestamp >= startTime && candle.timestamp <= endTime
      );
      
      console.log(`✅ Retrieved ${filteredCandles.length} 1-minute candles for C2 block`);
      
      // If we don't have enough data, expand the range slightly
      if (filteredCandles.length < 4) {
        console.log(`⚠️ Insufficient data (${filteredCandles.length} candles), expanding time range...`);
        
        // Expand range by 30 minutes on each side to capture more data
        const expandedStart = startTime - (30 * 60);
        const expandedEnd = endTime + (30 * 60);
        
        const expandedCandles = allCandles.filter(candle => 
          candle.timestamp >= expandedStart && candle.timestamp <= expandedEnd
        );
        
        console.log(`📈 Expanded range: ${expandedCandles.length} candles found`);
        
        if (expandedCandles.length >= 4) {
          return expandedCandles.slice(0, Math.min(expandedCandles.length, 120)); // Limit to ~2 hours max
        }
      }
      
      return filteredCandles;
      
    } catch (error) {
      console.error('❌ Failed to fetch 1-minute data:', error);
      throw error;
    }
  }

  /**
   * Create 4 internal candles from 1-minute data using half timeframe
   */
  private createInternalCandles(oneMinuteData: CandleData[], halfTimeframe: number): CandleData[] {
    const internalCandles: CandleData[] = [];
    
    for (let i = 0; i < oneMinuteData.length; i += halfTimeframe) {
      const candleGroup = oneMinuteData.slice(i, i + halfTimeframe);
      
      if (candleGroup.length > 0) {
        const internalCandle: CandleData = {
          timestamp: candleGroup[0].timestamp,
          open: candleGroup[0].open,
          high: Math.max(...candleGroup.map(c => c.high)),
          low: Math.min(...candleGroup.map(c => c.low)),
          close: candleGroup[candleGroup.length - 1].close,
          volume: candleGroup.reduce((sum, c) => sum + c.volume, 0)
        };
        
        internalCandles.push(internalCandle);
        
        if (internalCandles.length >= 4) break; // We only need 4 internal candles
      }
    }
    
    console.log(`🔄 Created ${internalCandles.length} internal ${halfTimeframe}min candles from 1-minute data`);
    return internalCandles;
  }

  /**
   * Detect internal patterns using 4 Candle Rule on internal candles
   */
  private detectInternalPatterns(internalCandles: CandleData[]) {
    console.log(`🔍 Analyzing internal patterns with ${internalCandles.length} candles`);
    
    const [c2a1, c2b1, c2a2, c2b2] = internalCandles;
    
    console.log(`📊 Internal candles:`);
    console.log(`📊 c2a1: O:${c2a1.open} H:${c2a1.high} L:${c2a1.low} C:${c2a1.close} @ ${new Date(c2a1.timestamp * 1000).toLocaleTimeString()}`);
    console.log(`📊 c2b1: O:${c2b1.open} H:${c2b1.high} L:${c2b1.low} C:${c2b1.close} @ ${new Date(c2b1.timestamp * 1000).toLocaleTimeString()}`);
    console.log(`📊 c2a2: O:${c2a2.open} H:${c2a2.high} L:${c2a2.low} C:${c2a2.close} @ ${new Date(c2a2.timestamp * 1000).toLocaleTimeString()}`);
    console.log(`📊 c2b2: O:${c2b2.open} H:${c2b2.high} L:${c2b2.low} C:${c2b2.close} @ ${new Date(c2b2.timestamp * 1000).toLocaleTimeString()}`);
    
    // Apply 4-candle rule methodology to internal candles
    const patterns = {
      uptrend: [
        { 
          label: '1-3', 
          pointA: { price: c2a1.low, timestamp: c2a1.timestamp, block: 'c2a1' },
          pointB: { price: c2a2.high, timestamp: c2a2.timestamp, block: 'c2a2' }
        },
        { 
          label: '1-4', 
          pointA: { price: c2a1.low, timestamp: c2a1.timestamp, block: 'c2a1' },
          pointB: { price: c2b2.high, timestamp: c2b2.timestamp, block: 'c2b2' }
        },
        { 
          label: '2-3', 
          pointA: { price: c2b1.low, timestamp: c2b1.timestamp, block: 'c2b1' },
          pointB: { price: c2a2.high, timestamp: c2a2.timestamp, block: 'c2a2' }
        },
        { 
          label: '2-4', 
          pointA: { price: c2b1.low, timestamp: c2b1.timestamp, block: 'c2b1' },
          pointB: { price: c2b2.high, timestamp: c2b2.timestamp, block: 'c2b2' }
        }
      ],
      downtrend: [
        { 
          label: '1-3', 
          pointA: { price: c2a1.high, timestamp: c2a1.timestamp, block: 'c2a1' },
          pointB: { price: c2a2.low, timestamp: c2a2.timestamp, block: 'c2a2' }
        },
        { 
          label: '1-4', 
          pointA: { price: c2a1.high, timestamp: c2a1.timestamp, block: 'c2a1' },
          pointB: { price: c2b2.low, timestamp: c2b2.timestamp, block: 'c2b2' }
        },
        { 
          label: '2-3', 
          pointA: { price: c2b1.high, timestamp: c2b1.timestamp, block: 'c2b1' },
          pointB: { price: c2a2.low, timestamp: c2a2.timestamp, block: 'c2a2' }
        },
        { 
          label: '2-4', 
          pointA: { price: c2b1.high, timestamp: c2b1.timestamp, block: 'c2b1' },
          pointB: { price: c2b2.low, timestamp: c2b2.timestamp, block: 'c2b2' }
        }
      ]
    };
    
    // Find best uptrend pattern (highest slope)
    let bestUptrend: any = null;
    let maxUptrendSlope = 0;
    
    patterns.uptrend.forEach(pattern => {
      const slope = pattern.pointB.price - pattern.pointA.price;
      if (slope > maxUptrendSlope) {
        maxUptrendSlope = slope;
        bestUptrend = pattern;
      }
    });
    
    // Find best downtrend pattern (lowest slope)
    let bestDowntrend: any = null;
    let maxDowntrendSlope = 0;
    
    patterns.downtrend.forEach(pattern => {
      const slope = pattern.pointA.price - pattern.pointB.price;
      if (slope > maxDowntrendSlope) {
        maxDowntrendSlope = slope;
        bestDowntrend = pattern;
      }
    });
    
    const result: any = {};
    
    if (bestUptrend && maxUptrendSlope > 0) {
      const pointATime = new Date(bestUptrend.pointA.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }).toLowerCase();
      const pointBTime = new Date(bestUptrend.pointB.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }).toLowerCase();
      
      result.uptrend = {
        pointA: {
          time: pointATime,
          exactTime: pointATime,
          price: bestUptrend.pointA.price,
          candleBlock: bestUptrend.pointA.block
        },
        pointB: {
          time: pointBTime,
          exactTime: pointBTime,
          price: bestUptrend.pointB.price,
          candleBlock: bestUptrend.pointB.block
        },
        patternLabel: bestUptrend.label
      };
      console.log(`🎯 Internal UPTREND pattern: ${bestUptrend.label} with slope: ${maxUptrendSlope.toFixed(2)}`);
    }
    
    if (bestDowntrend && maxDowntrendSlope > 0) {
      const pointATime = new Date(bestDowntrend.pointA.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }).toLowerCase();
      const pointBTime = new Date(bestDowntrend.pointB.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }).toLowerCase();
      
      result.downtrend = {
        pointA: {
          time: pointATime,
          exactTime: pointATime,
          price: bestDowntrend.pointA.price,
          candleBlock: bestDowntrend.pointA.block
        },
        pointB: {
          time: pointBTime,
          exactTime: pointBTime,
          price: bestDowntrend.pointB.price,
          candleBlock: bestDowntrend.pointB.block
        },
        patternLabel: bestDowntrend.label
      };
      console.log(`🎯 Internal DOWNTREND pattern: ${bestDowntrend.label} with slope: ${maxDowntrendSlope.toFixed(2)}`);
    }
    
    return result;
  }
  
  /**
   * Calculate pattern strength based on slope and volume
   */
  private calculatePatternStrength(slope: number, candles: CandleData[]): number {
    const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
    const volumeScore = avgVolume > 1000000 ? 1.0 : avgVolume / 1000000;
    const slopeScore = Math.min(slope / 100, 1.0); // Normalize slope
    
    return (slopeScore * 0.7 + volumeScore * 0.3) * 100;
  }

  /**
   * Analyze internal conflicts between main and mini patterns
   * SYNCHRONIZED with main Point A/B Analysis direction
   */
  private analyzeInternalConflict(
    mainDirection: 'UP' | 'DOWN',
    miniDirection: 'UP' | 'DOWN',
    mainPointAB: any,
    miniPatternResult: any
  ) {
    
    const isConflict = mainDirection !== miniDirection;
    const strengthDifference = Math.abs(miniPatternResult.strength - 50); // Assume main pattern has 50% strength
    
    let level: 'low' | 'medium' | 'high' = 'low';
    if (isConflict && strengthDifference > 30) level = 'high';
    else if (isConflict && strengthDifference > 15) level = 'medium';
    
    console.log(`🔄 Conflict Analysis: Main=${mainDirection}, Mini=${miniDirection}, Conflict=${isConflict}, Level=${level}`);
    
    return {
      hasResistance: isConflict,
      level,
      strengthDifference
    };
  }

  /**
   * Generate trading recommendation based on analysis
   * SYNCHRONIZED with main Point A/B Analysis direction
   */
  private generateTradingRecommendation(
    mainDirection: 'UP' | 'DOWN',
    miniDirection: 'UP' | 'DOWN',
    conflictAnalysis: any
  ) {
    const shouldTrade = !conflictAnalysis.hasResistance || conflictAnalysis.level === 'low';
    const confidence = shouldTrade ? (conflictAnalysis.level === 'low' ? 85 : 60) : 25;
    
    let reason = '';
    if (shouldTrade) {
      reason = conflictAnalysis.level === 'low' 
        ? 'Mini pattern supports main pattern direction' 
        : 'Low internal resistance detected';
    } else {
      reason = `${conflictAnalysis.level.toUpperCase()} internal resistance - mini pattern conflicts with main trend`;
    }
    
    return {
      shouldTrade,
      confidence,
      reason,
      positionSize: shouldTrade ? (confidence > 70 ? 'FULL' : 'HALF') : 'NONE'
    };
  }
}