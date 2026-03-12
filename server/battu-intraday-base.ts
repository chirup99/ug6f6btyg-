/**
 * Battu Intraday Base - Fundamental 1-Minute Data Fetcher
 * All Battu intraday analysis starts with fetching 1-minute data for the selected date
 */

// import { FyersAPI } from './fyers-api'; // Removed: Fyers API removed
import type { CandleData } from './intraday-patterns';

export interface OneMinuteBaseData {
  symbol: string;
  analysisDate: string;
  candlesCount: number;
  firstCandleTime: number;
  lastCandleTime: number;
  marketHours: {
    start: string;
    end: string;
  };
  oneMinuteCandles: CandleData[];
  fetchTimestamp: number;
}

export interface BattuIntradayRequest {
  symbol: string;
  analysisDate: string; // YYYY-MM-DD format
}

export class BattuIntradayBase {
  private fyersApi: FyersAPI;

  constructor(fyersApi?: FyersAPI) {
    if (fyersApi) {
      this.fyersApi = fyersApi;
    } else {
      this.fyersApi = new FyersAPI();
    }
  }

  /**
   * Step 1: Fetch 1-minute data for selected date (Fundamental first step for all Battu intraday analysis)
   */
  async fetchOneMinuteBaseData(request: BattuIntradayRequest): Promise<OneMinuteBaseData> {
    console.log(`🟦 [BATTU-BASE] Step 1: Fetching 1-minute data for ${request.symbol} on ${request.analysisDate}`);
    
    try {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(request.analysisDate)) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
      }

      // Fetch 1-minute candles for the entire selected date
      const historicalData = await this.fyersApi.getHistoricalData({
        symbol: request.symbol,
        resolution: '1', // Always 1-minute resolution as base
        date_format: '1',
        range_from: request.analysisDate,
        range_to: request.analysisDate,
        cont_flag: '1'
      });

      if (!historicalData || !historicalData.candles || historicalData.candles.length === 0) {
        console.warn(`⚠️ [BATTU-BASE] No candles in historicalData response for ${request.symbol} on ${request.analysisDate}`);
        console.log(`🔍 [BATTU-BASE] Historical data response:`, JSON.stringify(historicalData, null, 2));
        throw new Error(`No 1-minute data available for ${request.symbol} on ${request.analysisDate}`);
      }

      console.log(`📊 [BATTU-BASE] Raw candles received: ${historicalData.candles.length}`);
      console.log(`🔍 [BATTU-BASE] First candle sample:`, historicalData.candles[0]);
      console.log(`🔍 [BATTU-BASE] Last candle sample:`, historicalData.candles[historicalData.candles.length - 1]);

      // Convert to CandleData format
      const oneMinuteCandles: CandleData[] = historicalData.candles.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));

      // Calculate market hours from actual data
      const firstCandle = oneMinuteCandles[0];
      const lastCandle = oneMinuteCandles[oneMinuteCandles.length - 1];
      
      const marketStart = new Date(firstCandle.timestamp * 1000).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false
      });
      
      const marketEnd = new Date(lastCandle.timestamp * 1000).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false
      });

      const baseData: OneMinuteBaseData = {
        symbol: request.symbol,
        analysisDate: request.analysisDate,
        candlesCount: oneMinuteCandles.length,
        firstCandleTime: firstCandle.timestamp,
        lastCandleTime: lastCandle.timestamp,
        marketHours: {
          start: marketStart,
          end: marketEnd
        },
        oneMinuteCandles: oneMinuteCandles,
        fetchTimestamp: Date.now()
      };

      console.log(`✅ [BATTU-BASE] Successfully fetched ${baseData.candlesCount} 1-minute candles`);
      console.log(`📊 [BATTU-BASE] Market Hours: ${marketStart} to ${marketEnd}`);
      console.log(`🕘 [BATTU-BASE] First candle: ${new Date(firstCandle.timestamp * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`🕘 [BATTU-BASE] Last candle: ${new Date(lastCandle.timestamp * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

      return baseData;

    } catch (error) {
      console.error(`❌ [BATTU-BASE] Failed to fetch 1-minute base data:`, error);
      throw new Error(`Failed to fetch 1-minute base data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Utility: Get candles within specific time range from base data
   */
  getCandlesInRange(baseData: OneMinuteBaseData, startTime: number, endTime: number): CandleData[] {
    return baseData.oneMinuteCandles.filter(candle => 
      candle.timestamp >= startTime && candle.timestamp <= endTime
    );
  }

  /**
   * Utility: Get candles for specific time window (e.g., get 20 minutes from start time)
   */
  getCandlesForDuration(baseData: OneMinuteBaseData, startTime: number, durationMinutes: number): CandleData[] {
    const endTime = startTime + (durationMinutes * 60);
    return this.getCandlesInRange(baseData, startTime, endTime);
  }

  /**
   * Utility: Get market session statistics
   */
  getSessionStats(baseData: OneMinuteBaseData): {
    totalMinutes: number;
    totalVolume: number;
    sessionHigh: number;
    sessionLow: number;
    openPrice: number;
    closePrice: number;
  } {
    const candles = baseData.oneMinuteCandles;
    
    return {
      totalMinutes: candles.length,
      totalVolume: candles.reduce((sum, candle) => sum + candle.volume, 0),
      sessionHigh: Math.max(...candles.map(c => c.high)),
      sessionLow: Math.min(...candles.map(c => c.low)),
      openPrice: candles[0].open,
      closePrice: candles[candles.length - 1].close
    };
  }
}

// Factory function to create instance with existing FyersAPI
export function createBattuIntradayBase(fyersApi?: FyersAPI): BattuIntradayBase {
  return new BattuIntradayBase(fyersApi);
}