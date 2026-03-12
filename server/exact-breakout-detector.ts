/**
 * Exact Breakout Timestamp Detector
 * Uses existing 1-minute data from Point A/B analysis - identical methodology
 * Scans 1-minute candles within 5th/6th candle timeframes for exact breakout timing
 */

export interface BreakoutResult {
  broke: boolean;
  exactTimestamp: number | null;
  breakoutPrice: number | null;
}

export interface BreakoutDetectionParams {
  symbol: string;
  candleStartTime: number;
  candleEndTime: number;
  breakoutLevel: number;
  isUptrend: boolean;
  oneMinuteCandles?: any[]; // 1-minute data already fetched from Point A/B analysis
}

export class ExactBreakoutDetector {
  
  /**
   * Detects exact breakout timestamp using existing 1-minute data
   * Same methodology as Point A/B detection - scan 1-minute candles for exact timing
   */
  static detectExactBreakout(params: BreakoutDetectionParams): BreakoutResult {
    const { symbol, candleStartTime, candleEndTime, breakoutLevel, isUptrend, oneMinuteCandles } = params;
    
    console.log(`🎯 Point A/B Method: Exact breakout detection using existing 1-minute data`);
    console.log(`📊 ${symbol}, Level: ${breakoutLevel}, Uptrend: ${isUptrend}`);
    console.log(`⏰ Scanning window: ${new Date(candleStartTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} - ${new Date(candleEndTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}`);
    
    // ONLY use Point A/B methodology with existing 1-minute data
    if (oneMinuteCandles && oneMinuteCandles.length > 0) {
      return this.scanOneMinuteDataForBreakout(candleStartTime, candleEndTime, breakoutLevel, isUptrend, oneMinuteCandles);
    }
    
    // No fallback - require real 1-minute data from Point A/B analysis
    console.log(`❌ No 1-minute data available - Point A/B method requires existing analysis data`);
    return { broke: false, exactTimestamp: null, breakoutPrice: null };
  }
  
  /**
   * Scan 1-minute candles for exact breakout timing - Point A/B methodology
   */
  private static scanOneMinuteDataForBreakout(
    candleStartTime: number, 
    candleEndTime: number, 
    breakoutLevel: number, 
    isUptrend: boolean, 
    oneMinuteCandles: any[]
  ): BreakoutResult {
    
    console.log(`🔍 Scanning ${oneMinuteCandles.length} 1-minute candles for exact breakout timing...`);
    
    // Filter 1-minute candles within the target candle timeframe
    const relevantCandles = oneMinuteCandles.filter(candle => 
      candle.timestamp >= candleStartTime && candle.timestamp < candleEndTime
    );
    
    console.log(`📊 Found ${relevantCandles.length} 1-minute candles in target timeframe`);
    
    if (relevantCandles.length === 0) {
      console.log(`❌ No 1-minute candles found in timeframe`);
      return { broke: false, exactTimestamp: null, breakoutPrice: null };
    }
    
    // Scan each 1-minute candle for breakout
    for (const candle of relevantCandles) {
      const candleTime = new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
      
      if (isUptrend) {
        // Uptrend breakout: candle high must exceed breakout level
        if (candle.high > breakoutLevel) {
          console.log(`🎯 UPTREND BREAKOUT DETECTED!`);
          console.log(`💰 Candle high ${candle.high} > breakout level ${breakoutLevel} at ${candleTime}`);
          return {
            broke: true,
            exactTimestamp: candle.timestamp * 1000, // Convert to milliseconds
            breakoutPrice: candle.high
          };
        }
      } else {
        // Downtrend breakout: candle low must fall below breakout level
        if (candle.low < breakoutLevel) {
          console.log(`🎯 DOWNTREND BREAKOUT DETECTED!`);
          console.log(`💰 Candle low ${candle.low} < breakout level ${breakoutLevel} at ${candleTime}`);
          return {
            broke: true,
            exactTimestamp: candle.timestamp * 1000, // Convert to milliseconds
            breakoutPrice: candle.low
          };
        }
      }
    }
    
    // No breakout found in any 1-minute candle
    console.log(`❌ No breakout detected in any 1-minute candle within timeframe`);
    return { broke: false, exactTimestamp: null, breakoutPrice: null };
  }
  

}