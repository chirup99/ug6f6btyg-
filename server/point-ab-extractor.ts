// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed
import { MarketSessionFetcher } from './market-session-fetcher.js';

interface OneMinuteCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PointAB {
  pointA: {
    timestamp: number;
    price: number;
    priceType: 'high' | 'low';
    exactTime: string;
    candleBlock: string;
  };
  pointB: {
    timestamp: number;
    price: number;
    priceType: 'high' | 'low';
    exactTime: string;
    candleBlock: string;
  };
  duration: {
    milliseconds: number;
    minutes: number;
    seconds: number;
  };
  slope: number;
  trendDirection: 'uptrend' | 'downtrend';
}

interface TimingRules {
  pointAToPointB: {
    duration: number; // minutes
    percentage50: number; // 50% of Point A to Point B duration
    percentage34: number; // 34% of Point A to Point B duration
  };
  triggerValidation: {
    rule1_50percent: boolean; // Point A→B ≥ 50% of total duration
    rule2_34percent: boolean; // Point B→trigger ≥ 34% of A→B duration
  };
  targetCalculation: {
    slopeExtension: number; // slope × time for target
    trigger80percent: number; // 80% of projected target
    stopLoss: number; // previous candle high/low
  };
}

export class PointABExtractor {
  private fyersAPI: FyersAPI;
  private sessionFetcher: MarketSessionFetcher;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
    this.sessionFetcher = new MarketSessionFetcher(fyersAPI);
  }

  /**
   * Extract exact Point A and Point B from full market session using 1-minute data
   * Enhanced to use complete market open to close data for precise calculations
   */
  async extractPointABFromSession(
    symbol: string,
    date: string,
    methodology: 'T-RULE' | 'MINI-4-RULE',
    timeRangeStart?: number,
    timeRangeEnd?: number
  ): Promise<{
    pointAB: PointAB;
    timingRules: TimingRules;
    sessionData: any;
    analysis: string;
  }> {
    console.log(`🔍 [${methodology}] Extracting Point A/B from complete market session`);
    console.log(`📊 [${methodology}] Symbol: ${symbol}, Date: ${date}`);

    // Step 1: Fetch complete market session data (9:15 AM - 3:30 PM)
    console.log(`⏰ [${methodology}] Fetching complete market session data...`);
    const sessionData = await this.sessionFetcher.fetchCompleteMarketSession(symbol, date);
    
    console.log(`📈 [${methodology}] Retrieved ${sessionData.oneMinuteCandles.length} 1-minute candles for full session`);

    // Step 2: Determine analysis time range
    let analysisStart = timeRangeStart || sessionData.sessionStart;
    let analysisEnd = timeRangeEnd || sessionData.sessionEnd;

    // If specific time range provided, use it; otherwise use full session
    if (timeRangeStart && timeRangeEnd) {
      console.log(`🎯 [${methodology}] Using custom time range: ${new Date(analysisStart).toLocaleTimeString()} to ${new Date(analysisEnd).toLocaleTimeString()}`);
    } else {
      console.log(`🎯 [${methodology}] Using full market session: ${sessionData.marketHours.openTime} to ${sessionData.marketHours.closeTime}`);
    }

    // Step 3: Extract Point A/B from session data
    const pointABResult = this.sessionFetcher.extractSessionPointAB(
      sessionData,
      analysisStart,
      analysisEnd
    );

    // Step 4: Build Point A/B structure
    const pointAB: PointAB = {
      pointA: {
        timestamp: pointABResult.pointA.timestamp,
        price: pointABResult.pointA.price,
        exactTime: pointABResult.pointA.timeString,
        priceType: pointABResult.pointA.priceType,
        candleBlock: 'SESSION_LOW'
      },
      pointB: {
        timestamp: pointABResult.pointB.timestamp,
        price: pointABResult.pointB.price,
        exactTime: pointABResult.pointB.timeString,
        priceType: pointABResult.pointB.priceType,
        candleBlock: 'SESSION_HIGH'
      },
      slope: pointABResult.slope,
      duration: {
        milliseconds: Math.abs(pointABResult.pointB.timestamp - pointABResult.pointA.timestamp),
        minutes: pointABResult.sessionRange.duration,
        seconds: Math.abs(pointABResult.pointB.timestamp - pointABResult.pointA.timestamp) / 1000
      },
      trendDirection: pointABResult.trendDirection
    };

    // Step 5: Calculate timing rules
    const timingRules = this.calculateTimingRules(
      pointAB.pointA,
      pointAB.pointB,
      pointAB.duration,
      pointAB.slope
    );

    // Step 6: Generate analysis
    const sessionStats = this.sessionFetcher.getSessionStatistics(sessionData);
    const analysis = `${methodology} Point A/B extraction from full market session (${sessionData.marketHours.duration}). ` +
      `Session range: ${sessionStats.sessionLow}-${sessionStats.sessionHigh} (${sessionStats.priceRange.toFixed(2)} points). ` +
      `Point A: ${pointAB.pointA.price} at ${pointAB.pointA.exactTime}, Point B: ${pointAB.pointB.price} at ${pointAB.pointB.exactTime}. ` +
      `Duration: ${pointAB.duration.minutes.toFixed(2)} minutes, Slope: ${pointAB.slope.toFixed(4)} points/minute.`;

    console.log(`✅ [${methodology}] Point A/B extraction completed from session data`);

    return {
      pointAB,
      timingRules,
      sessionData,
      analysis
    };
  }

  /**
   * Fetch 1-minute candles for exact time period
   */
  private async fetch1MinuteData(
    symbol: string,
    date: string,
    startTime: number,
    endTime: number
  ): Promise<OneMinuteCandle[]> {
    try {
      const historicalData = await this.fyersAPI.getHistoricalData({
        symbol,
        resolution: '1', // 1-minute candles
        date_format: '1',
        range_from: Math.floor(startTime / 1000).toString(),
        range_to: Math.floor(endTime / 1000).toString(),
        cont_flag: '1'
      });

      if (!historicalData || historicalData.length === 0) {
        return [];
      }

      // If historicalData is already CandleData[], return as is
      if (typeof historicalData[0] === 'object' && 'timestamp' in historicalData[0]) {
        return historicalData.map(candle => ({
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || 0
        }));
      }

      // If historicalData is array of arrays, convert to CandleData format
      return (historicalData as any[]).map((candle: any[]) => ({
        timestamp: candle[0] * 1000, // Convert to milliseconds
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5] || 0
      }));

    } catch (error) {
      console.error('❌ Failed to fetch 1-minute data:', error);
      return [];
    }
  }

  /**
   * Find exact timestamp where price extreme occurred in 1-minute data
   */
  private findExactTimestamp(
    oneMinuteData: OneMinuteCandle[],
    targetPrice: number,
    priceType: 'high' | 'low',
    candleBlock: string
  ): { timestamp: number; price: number; priceType: 'high' | 'low'; candleBlock: string } | null {
    
    for (const candle of oneMinuteData) {
      const candlePrice = priceType === 'high' ? candle.high : candle.low;
      
      // Find exact match (within 0.1 point tolerance)
      if (Math.abs(candlePrice - targetPrice) < 0.1) {
        console.log(`🎯 Found exact ${priceType} ${targetPrice} at ${new Date(candle.timestamp).toLocaleTimeString()}`);
        return {
          timestamp: candle.timestamp,
          price: candlePrice,
          priceType,
          candleBlock
        };
      }
    }

    // If no exact match, find closest
    let closest = oneMinuteData[0];
    let minDiff = Math.abs((priceType === 'high' ? closest.high : closest.low) - targetPrice);

    for (const candle of oneMinuteData) {
      const candlePrice = priceType === 'high' ? candle.high : candle.low;
      const diff = Math.abs(candlePrice - targetPrice);
      
      if (diff < minDiff) {
        minDiff = diff;
        closest = candle;
      }
    }

    const closestPrice = priceType === 'high' ? closest.high : closest.low;
    console.log(`📍 Found closest ${priceType} ${closestPrice} (target: ${targetPrice}) at ${new Date(closest.timestamp).toLocaleTimeString()}`);

    return {
      timestamp: closest.timestamp,
      price: closestPrice,
      priceType,
      candleBlock
    };
  }

  /**
   * Calculate timing rules for 50% and 34% validation
   */
  private calculateTimingRules(
    pointA: any,
    pointB: any,
    duration: { minutes: number },
    slope: number
  ): TimingRules {
    
    const pointAToPointB = {
      duration: duration.minutes,
      percentage50: duration.minutes * 0.5, // 50% of Point A→B duration
      percentage34: duration.minutes * 0.34  // 34% of Point A→B duration
    };

    // These will be validated against actual trigger timing
    const triggerValidation = {
      rule1_50percent: false, // Will be validated when trigger occurs
      rule2_34percent: false  // Will be validated when trigger occurs
    };

    const targetCalculation = {
      slopeExtension: slope * 10, // Slope × 10 minutes for target
      trigger80percent: (slope * 10) * 0.8, // 80% of projected target
      stopLoss: 0 // Will be set based on previous candle
    };

    console.log(`⏱️ Timing Rules - 50%: ${pointAToPointB.percentage50.toFixed(2)} min, 34%: ${pointAToPointB.percentage34.toFixed(2)} min`);
    console.log(`🎯 Target Extension: ${targetCalculation.slopeExtension.toFixed(2)} points, 80%: ${targetCalculation.trigger80percent.toFixed(2)} points`);

    return {
      pointAToPointB,
      triggerValidation, 
      targetCalculation
    };
  }

  /**
   * Validate timing rules when trigger occurs
   */
  validateTriggerTiming(
    pointAB: PointAB,
    triggerTimestamp: number,
    totalCandleDuration: number
  ): {
    rule1_50percent: boolean;
    rule2_34percent: boolean;
    validation: string;
  } {
    
    // Rule 1: Point A→Point B duration ≥ 50% of total candle duration
    const rule1_50percent = pointAB.duration.minutes >= (totalCandleDuration * 0.5);
    
    // Rule 2: Point B→Trigger duration ≥ 34% of Point A→Point B duration
    const pointBToTriggerMinutes = Math.abs(triggerTimestamp - pointAB.pointB.timestamp) / (1000 * 60);
    const rule2_34percent = pointBToTriggerMinutes >= (pointAB.duration.minutes * 0.34);

    const validation = `Rule 1 (50%): ${rule1_50percent ? 'PASS' : 'FAIL'} - A→B ${pointAB.duration.minutes.toFixed(2)}min vs required ${(totalCandleDuration * 0.5).toFixed(2)}min | Rule 2 (34%): ${rule2_34percent ? 'PASS' : 'FAIL'} - B→Trigger ${pointBToTriggerMinutes.toFixed(2)}min vs required ${(pointAB.duration.minutes * 0.34).toFixed(2)}min`;

    console.log(`✅ Timing Validation: ${validation}`);

    return {
      rule1_50percent,
      rule2_34percent,
      validation
    };
  }
}