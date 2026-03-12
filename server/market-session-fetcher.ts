// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

interface MarketSessionData {
  symbol: string;
  date: string;
  sessionStart: number; // timestamp
  sessionEnd: number; // timestamp
  totalMinutes: number;
  oneMinuteCandles: OneMinuteCandle[];
  marketHours: {
    openTime: string;
    closeTime: string;
    duration: string;
  };
}

interface OneMinuteCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeString: string;
}

export class MarketSessionFetcher {
  private fyersAPI: FyersAPI;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * Fetch complete market session 1-minute data from open to close
   * For precise Point A/B timestamp extraction across entire trading day
   */
  async fetchCompleteMarketSession(
    symbol: string,
    date: string
  ): Promise<MarketSessionData> {
    console.log(`🕘 [MARKET-SESSION] Fetching complete market session for ${symbol} on ${date}`);
    
    // Calculate market hours for the date (9:15 AM to 3:30 PM IST)
    const dateObj = new Date(date);
    const sessionStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 9, 15, 0).getTime();
    const sessionEnd = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 15, 30, 0).getTime();
    const totalMinutes = (sessionEnd - sessionStart) / (1000 * 60); // 375 minutes

    console.log(`📅 [MARKET-SESSION] Session: ${new Date(sessionStart).toLocaleTimeString()} to ${new Date(sessionEnd).toLocaleTimeString()}`);
    console.log(`⏱️ [MARKET-SESSION] Total duration: ${totalMinutes} minutes`);

    try {
      // Fetch 1-minute data for entire session
      const historicalData = await this.fyersAPI.getHistoricalData({
        symbol,
        resolution: '1', // 1-minute candles
        date_format: '1',
        range_from: Math.floor(sessionStart / 1000).toString(),
        range_to: Math.floor(sessionEnd / 1000).toString(),
        cont_flag: '1'
      });

      if (!historicalData?.candles || historicalData.candles.length === 0) {
        throw new Error('No 1-minute data available for the specified session');
      }

      console.log(`📊 [MARKET-SESSION] Retrieved ${historicalData.candles.length} 1-minute candles`);

      // Convert to structured format
      const oneMinuteCandles: OneMinuteCandle[] = historicalData.candles.map((candle: any[]) => ({
        timestamp: candle[0] * 1000, // Convert to milliseconds
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5] || 0,
        timeString: new Date(candle[0] * 1000).toLocaleTimeString()
      }));

      // Filter to market hours only (9:15 AM - 3:30 PM)
      const filteredCandles = oneMinuteCandles.filter(candle => {
        const candleTime = new Date(candle.timestamp);
        const hours = candleTime.getHours();
        const minutes = candleTime.getMinutes();
        
        // Market hours: 9:15 AM to 3:30 PM
        if (hours < 9 || hours > 15) return false;
        if (hours === 9 && minutes < 15) return false;
        if (hours === 15 && minutes > 30) return false;
        
        return true;
      });

      console.log(`🎯 [MARKET-SESSION] Filtered to ${filteredCandles.length} candles within market hours`);

      const sessionData: MarketSessionData = {
        symbol,
        date,
        sessionStart,
        sessionEnd,
        totalMinutes: filteredCandles.length,
        oneMinuteCandles: filteredCandles,
        marketHours: {
          openTime: new Date(sessionStart).toLocaleTimeString(),
          closeTime: new Date(sessionEnd).toLocaleTimeString(),
          duration: `${filteredCandles.length} minutes`
        }
      };

      console.log(`✅ [MARKET-SESSION] Complete session data fetched: ${filteredCandles.length} candles`);
      
      return sessionData;

    } catch (error) {
      console.error(`❌ [MARKET-SESSION] Failed to fetch session data:`, error);
      throw new Error(`Failed to fetch market session data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find exact timestamp where specific price occurred during the session
   */
  findExactPriceTimestamp(
    sessionData: MarketSessionData,
    targetPrice: number,
    priceType: 'high' | 'low' | 'open' | 'close',
    tolerance: number = 0.1
  ): {
    timestamp: number;
    price: number;
    timeString: string;
    candleIndex: number;
  } | null {
    
    console.log(`🔍 [PRICE-SEARCH] Looking for ${priceType} price ${targetPrice} (tolerance: ±${tolerance})`);

    for (let i = 0; i < sessionData.oneMinuteCandles.length; i++) {
      const candle = sessionData.oneMinuteCandles[i];
      const candlePrice = candle[priceType];
      
      if (Math.abs(candlePrice - targetPrice) <= tolerance) {
        console.log(`🎯 [PRICE-FOUND] ${priceType} ${candlePrice} found at ${candle.timeString} (candle ${i+1})`);
        
        return {
          timestamp: candle.timestamp,
          price: candlePrice,
          timeString: candle.timeString,
          candleIndex: i
        };
      }
    }

    // If no exact match, find closest
    let closest = sessionData.oneMinuteCandles[0];
    let closestIndex = 0;
    let minDiff = Math.abs(closest[priceType] - targetPrice);

    for (let i = 1; i < sessionData.oneMinuteCandles.length; i++) {
      const candle = sessionData.oneMinuteCandles[i];
      const diff = Math.abs(candle[priceType] - targetPrice);
      
      if (diff < minDiff) {
        minDiff = diff;
        closest = candle;
        closestIndex = i;
      }
    }

    console.log(`📍 [CLOSEST-FOUND] Closest ${priceType} ${closest[priceType]} at ${closest.timeString} (diff: ${minDiff.toFixed(2)})`);

    return {
      timestamp: closest.timestamp,
      price: closest[priceType],
      timeString: closest.timeString,
      candleIndex: closestIndex
    };
  }

  /**
   * Extract Point A and Point B from session data with exact timestamps
   */
  extractSessionPointAB(
    sessionData: MarketSessionData,
    startTime: number,
    endTime: number
  ): {
    pointA: { timestamp: number; price: number; timeString: string; priceType: 'low'; };
    pointB: { timestamp: number; price: number; timeString: string; priceType: 'high'; };
    sessionRange: { start: string; end: string; duration: number; };
    slope: number;
    trendDirection: 'uptrend' | 'downtrend';
  } {
    
    console.log(`🔍 [SESSION-POINT-AB] Extracting Point A/B from ${new Date(startTime).toLocaleTimeString()} to ${new Date(endTime).toLocaleTimeString()}`);

    // Filter candles within the specified time range
    const rangeCandles = sessionData.oneMinuteCandles.filter(candle => 
      candle.timestamp >= startTime && candle.timestamp <= endTime
    );

    if (rangeCandles.length === 0) {
      throw new Error('No candles found in the specified time range');
    }

    // Find highest high and lowest low in the range
    let highestHigh = rangeCandles[0].high;
    let lowestLow = rangeCandles[0].low;
    let highCandle = rangeCandles[0];
    let lowCandle = rangeCandles[0];

    for (const candle of rangeCandles) {
      if (candle.high > highestHigh) {
        highestHigh = candle.high;
        highCandle = candle;
      }
      if (candle.low < lowestLow) {
        lowestLow = candle.low;
        lowCandle = candle;
      }
    }

    // Point A = Low, Point B = High
    const pointA = {
      timestamp: lowCandle.timestamp,
      price: lowestLow,
      timeString: lowCandle.timeString,
      priceType: 'low' as const
    };

    const pointB = {
      timestamp: highCandle.timestamp,
      price: highestHigh,
      timeString: highCandle.timeString,
      priceType: 'high' as const
    };

    // Calculate slope and trend direction
    const durationMinutes = Math.abs(pointB.timestamp - pointA.timestamp) / (1000 * 60);
    const priceDiff = pointB.price - pointA.price;
    const slope = priceDiff / durationMinutes;
    const trendDirection: 'uptrend' | 'downtrend' = pointB.timestamp > pointA.timestamp ? 'uptrend' : 'downtrend';

    console.log(`📍 [POINT-A] Low ${pointA.price} at ${pointA.timeString}`);
    console.log(`📍 [POINT-B] High ${pointB.price} at ${pointB.timeString}`);
    console.log(`📈 [SLOPE] ${slope.toFixed(4)} points/minute (${trendDirection})`);

    return {
      pointA,
      pointB,
      sessionRange: {
        start: new Date(startTime).toLocaleTimeString(),
        end: new Date(endTime).toLocaleTimeString(),
        duration: durationMinutes
      },
      slope,
      trendDirection
    };
  }

  /**
   * Get session statistics
   */
  getSessionStatistics(sessionData: MarketSessionData): {
    totalCandles: number;
    sessionHigh: number;
    sessionLow: number;
    sessionOpen: number;
    sessionClose: number;
    totalVolume: number;
    priceRange: number;
    averagePrice: number;
  } {
    
    if (sessionData.oneMinuteCandles.length === 0) {
      throw new Error('No candles available for statistics');
    }

    const candles = sessionData.oneMinuteCandles;
    const sessionHigh = Math.max(...candles.map(c => c.high));
    const sessionLow = Math.min(...candles.map(c => c.low));
    const sessionOpen = candles[0].open;
    const sessionClose = candles[candles.length - 1].close;
    const totalVolume = candles.reduce((sum, c) => sum + c.volume, 0);
    const priceRange = sessionHigh - sessionLow;
    const averagePrice = candles.reduce((sum, c) => sum + c.close, 0) / candles.length;

    return {
      totalCandles: candles.length,
      sessionHigh,
      sessionLow,
      sessionOpen,
      sessionClose,
      totalVolume,
      priceRange,
      averagePrice
    };
  }
}