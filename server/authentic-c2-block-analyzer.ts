// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed
import { CandleData } from '../shared/schema';

/**
 * AUTHENTIC C2 Block Internal Pattern Analyzer
 * Integration with Point A/B Analysis (4 Candle Rule Methodology)
 * Uses REAL 1-minute data - NO virtual candle creation
 */
export class AuthenticC2BlockAnalyzer {
  
  /**
   * Main analysis method - Integrates with authentic Point A/B Analysis
   */
  async analyzeC2BlockInternalPattern(
    symbol: string,
    date: string,
    mainTimeframe: number,
    mainPattern: string,
    mainPointA: { time: number; price: number; candleBlock: string },
    mainPointB: { time: number; price: number; candleBlock: string },
    c2BlockStart: number,
    c2BlockEnd: number
  ) {
    try {
      console.log(`🎯 [AUTHENTIC-C2] Starting real C2 Block analysis using Point A/B methodology`);
      console.log(`   Symbol: ${symbol} | Date: ${date} | Main TF: ${mainTimeframe}min`);
      console.log(`   C2 Block Range: ${c2BlockStart} to ${c2BlockEnd}`);
      
      // Step 1: Fetch REAL 1-minute data for C2 block timeframe
      const real1MinuteData = await this.fetchReal1MinuteData(symbol, date, c2BlockStart, c2BlockEnd);
      
      if (real1MinuteData.length < 4) {
        throw new Error(`Insufficient real data: ${real1MinuteData.length} candles, need minimum 4`);
      }
      
      console.log(`✅ [AUTHENTIC-C2] Retrieved ${real1MinuteData.length} real 1-minute candles`);
      
      // Step 2: Apply authentic Point A/B Analysis to real 1-minute data
      const miniTimeframe = mainTimeframe / 2;
      const miniPatternResult = await this.applyAuthenticPointABAnalysis(real1MinuteData, miniTimeframe);
      
      // Step 3: Analyze conflict with main pattern using SAME Point A/B methodology
      const mainTrendDirection = this.getMainTrendDirection(mainPointA, mainPointB);
      const conflictAnalysis = this.analyzePatternConflict(
        mainTrendDirection, 
        miniPatternResult.trendDirection,
        mainPointA,
        mainPointB,
        miniPatternResult
      );
      
      // Step 4: Generate trading recommendation
      const recommendation = this.generateTradingRecommendation(
        mainTrendDirection,
        miniPatternResult.trendDirection,
        conflictAnalysis
      );
      
      return {
        success: true,
        mainPattern: {
          timeframe: mainTimeframe,
          type: mainTrendDirection === 'UP' ? 'UPTREND' : 'DOWNTREND',
          strength: this.calculatePatternStrength(mainPointA, mainPointB),
          pointA: { 
            time: new Date(mainPointA.time * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }).toLowerCase(),
            price: mainPointA.price 
          },
          pointB: { 
            time: new Date(mainPointB.time * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }).toLowerCase(),
            price: mainPointB.price 
          },
          slope: this.calculateSlope(mainPointA, mainPointB)
        },
        miniPattern: {
          timeframe: miniTimeframe,
          type: miniPatternResult.trendDirection === 'UP' ? 'UPTREND' : 'DOWNTREND',
          strength: miniPatternResult.strength,
          pointA: {
            time: new Date(miniPatternResult.pointA.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: false, hour: '2-digit', minute: '2-digit' 
            }),
            price: miniPatternResult.pointA.price
          },
          pointB: {
            time: new Date(miniPatternResult.pointB.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: false, hour: '2-digit', minute: '2-digit' 
            }),
            price: miniPatternResult.pointB.price
          },
          slope: miniPatternResult.slope,
          conflictLevel: conflictAnalysis.level.toUpperCase(),
          internalResistance: conflictAnalysis.hasResistance
        },
        recommendation,
        metadata: {
          methodology: 'AUTHENTIC_POINT_AB_ANALYSIS_C2_BLOCK_INTEGRATION',
          symbol,
          date,
          mainTimeframe,
          miniTimeframe,
          conflictLevel: conflictAnalysis.level.toUpperCase(),
          internalResistance: conflictAnalysis.hasResistance,
          realDataCandles: real1MinuteData.length
        }
      };
      
    } catch (error) {
      console.error('❌ [AUTHENTIC-C2] Analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Fetch REAL 1-minute data from Fyers API - NO virtual creation
   */
  private async fetchReal1MinuteData(symbol: string, date: string, startTimestamp: number, endTimestamp: number): Promise<CandleData[]> {
    try {
      console.log(`📡 [AUTHENTIC-DATA] Fetching real 1-minute data from Fyers API`);
      console.log(`   Range: ${startTimestamp} to ${endTimestamp} (${date})`);
      
      // const response = null; // fyersApi.getHistoricalData({
        symbol,
        resolution: '1',  // Always 1-minute - authentic data only
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });
      
      if (!response || !Array.isArray(response)) {
        throw new Error('No authentic data received from Fyers API');
      }
      
      // Convert to CandleData format and filter to exact timeframe
      const allCandles: CandleData[] = response.map((candle: any) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
      
      // Filter to exact C2 block range
      const filteredCandles = allCandles.filter(candle => 
        candle.timestamp >= startTimestamp && candle.timestamp <= endTimestamp
      );
      
      console.log(`✅ [AUTHENTIC-DATA] Retrieved ${filteredCandles.length} real 1-minute candles`);
      console.log(`🔍 [AUTHENTIC-DATA] Range verification: ${filteredCandles[0]?.timestamp} to ${filteredCandles[filteredCandles.length-1]?.timestamp}`);
      
      return filteredCandles;
      
    } catch (error) {
      console.error('❌ [AUTHENTIC-DATA] Failed to fetch real 1-minute data:', error);
      throw error;
    }
  }
  
  /**
   * Apply authentic Point A/B Analysis (4 Candle Rule Methodology) to real data
   */
  private async applyAuthenticPointABAnalysis(real1MinuteData: CandleData[], miniTimeframe: number) {
    console.log(`🎯 [POINT-AB] Applying authentic 4 Candle Rule methodology to ${real1MinuteData.length} real candles`);
    
    // Group real 1-minute candles into mini timeframe groups
    const candlesPerGroup = Math.floor(real1MinuteData.length / 4);
    if (candlesPerGroup < 1) {
      throw new Error('Insufficient data for 4-candle grouping');
    }
    
    // Create 4 real candle groups from 1-minute data
    const candle1Data = real1MinuteData.slice(0, candlesPerGroup);
    const candle2Data = real1MinuteData.slice(candlesPerGroup, candlesPerGroup * 2);
    const candle3Data = real1MinuteData.slice(candlesPerGroup * 2, candlesPerGroup * 3);
    const candle4Data = real1MinuteData.slice(candlesPerGroup * 3);
    
    // Create real OHLC candles from 1-minute data
    const realCandle1 = this.createRealCandle(candle1Data);
    const realCandle2 = this.createRealCandle(candle2Data);
    const realCandle3 = this.createRealCandle(candle3Data);
    const realCandle4 = this.createRealCandle(candle4Data);
    
    console.log(`✅ [POINT-AB] Created 4 real candles from authentic 1-minute data`);
    console.log(`   Real Candle 1: O:${realCandle1.open} H:${realCandle1.high} L:${realCandle1.low} C:${realCandle1.close}`);
    console.log(`   Real Candle 2: O:${realCandle2.open} H:${realCandle2.high} L:${realCandle2.low} C:${realCandle2.close}`);
    console.log(`   Real Candle 3: O:${realCandle3.open} H:${realCandle3.high} L:${realCandle3.low} C:${realCandle3.close}`);
    console.log(`   Real Candle 4: O:${realCandle4.open} H:${realCandle4.high} L:${realCandle4.low} C:${realCandle4.close}`);
    
    // Apply 4 Candle Rule methodology to real candles
    const patterns = [
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
        pointA: { price: realCandle2.low, timestamp: realCandle2.timestamp, candle: 2 },
        pointB: { price: realCandle3.high, timestamp: realCandle3.timestamp, candle: 3 },
        trend: 'UP' as const 
      },
      { 
        name: '2-4', 
        pointA: { price: realCandle2.low, timestamp: realCandle2.timestamp, candle: 2 },
        pointB: { price: realCandle4.high, timestamp: realCandle4.timestamp, candle: 4 },
        trend: 'UP' as const 
      }
    ];
    
    // Find strongest pattern using authentic Point A/B methodology
    let strongestPattern = patterns[0];
    let maxSlope = 0;
    
    patterns.forEach(pattern => {
      const slope = Math.abs(pattern.pointB.price - pattern.pointA.price);
      if (slope > maxSlope) {
        maxSlope = slope;
        strongestPattern = pattern;
      }
    });
    
    console.log(`🎯 [POINT-AB] Strongest pattern: ${strongestPattern.name} (${strongestPattern.trend})`);
    console.log(`   Point A: Candle ${strongestPattern.pointA.candle} @ ${strongestPattern.pointA.price}`);
    console.log(`   Point B: Candle ${strongestPattern.pointB.candle} @ ${strongestPattern.pointB.price}`);
    console.log(`   Slope: ${maxSlope.toFixed(4)} points`);
    
    return {
      patternName: strongestPattern.name,
      trendDirection: strongestPattern.trend,
      pointA: strongestPattern.pointA,
      pointB: strongestPattern.pointB,
      slope: this.calculateSlope(strongestPattern.pointA, strongestPattern.pointB),
      strength: this.calculatePatternStrength(strongestPattern.pointA, strongestPattern.pointB)
    };
  }
  
  /**
   * Create real OHLC candle from 1-minute data group
   */
  private createRealCandle(minuteData: CandleData[]): CandleData {
    if (minuteData.length === 0) {
      throw new Error('Cannot create candle from empty data');
    }
    
    const open = minuteData[0].open;
    const close = minuteData[minuteData.length - 1].close;
    const high = Math.max(...minuteData.map(c => c.high));
    const low = Math.min(...minuteData.map(c => c.low));
    const volume = minuteData.reduce((sum, c) => sum + c.volume, 0);
    const timestamp = minuteData[0].timestamp;
    
    return { timestamp, open, high, low, close, volume };
  }
  
  /**
   * Get trend direction from Point A/B
   */
  private getMainTrendDirection(pointA: any, pointB: any): 'UP' | 'DOWN' {
    return pointB.price > pointA.price ? 'UP' : 'DOWN';
  }
  
  /**
   * Calculate slope between two points
   */
  private calculateSlope(pointA: any, pointB: any): number {
    const priceChange = pointB.price - pointA.price;
    const timeChange = (pointB.timestamp || pointB.time) - (pointA.timestamp || pointA.time);
    const timeChangeMinutes = timeChange / 60; // Convert to minutes
    
    return timeChangeMinutes > 0 ? priceChange / timeChangeMinutes : 0;
  }
  
  /**
   * Calculate pattern strength
   */
  private calculatePatternStrength(pointA: any, pointB: any): number {
    const priceChange = Math.abs(pointB.price - pointA.price);
    const avgPrice = (pointA.price + pointB.price) / 2;
    return (priceChange / avgPrice) * 100; // Percentage strength
  }
  
  /**
   * Analyze conflict between main and mini patterns
   */
  private analyzePatternConflict(mainDirection: 'UP' | 'DOWN', miniDirection: 'UP' | 'DOWN', mainPointA: any, mainPointB: any, miniResult: any) {
    const isConflict = mainDirection !== miniDirection;
    const strengthDifference = Math.abs(miniResult.strength - this.calculatePatternStrength(mainPointA, mainPointB));
    
    let level: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (isConflict) {
      if (strengthDifference > 0.5) level = 'high';
      else if (strengthDifference > 0.25) level = 'medium';
      else level = 'low';
    }
    
    console.log(`🔍 [CONFLICT] Main=${mainDirection}, Mini=${miniDirection}, Conflict=${isConflict}, Level=${level}`);
    
    return {
      hasResistance: isConflict,
      level,
      strengthDifference
    };
  }
  
  /**
   * Generate trading recommendation
   */
  private generateTradingRecommendation(mainDirection: 'UP' | 'DOWN', miniDirection: 'UP' | 'DOWN', conflictAnalysis: any) {
    const isAligned = mainDirection === miniDirection;
    const shouldTrade = isAligned || conflictAnalysis.level === 'low';
    
    let confidence = 85;
    let reason = 'Mini pattern aligns with main pattern direction';
    let positionSize = 'FULL';
    
    if (!isAligned) {
      confidence = conflictAnalysis.level === 'low' ? 60 : 25;
      reason = conflictAnalysis.level === 'low' 
        ? 'Low internal resistance - proceed with reduced position'
        : `${conflictAnalysis.level.toUpperCase()} internal resistance - mini pattern conflicts with main trend`;
      positionSize = conflictAnalysis.level === 'low' ? 'HALF' : 'NONE';
    }
    
    return {
      shouldTrade,
      confidence,
      reason,
      positionSize
    };
  }
}

export const authenticC2BlockAnalyzer = new AuthenticC2BlockAnalyzer();