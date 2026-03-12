// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed

interface CandleTimestamp {
  timestamp: number;
  time: string;
  open: number;
  high: number; 
  low: number;
  close: number;
  minute: number;
}

export class OneMinuteTimestampAnalyzer {
  async analyzeExactTimestamps(symbol: string, date: string) {
    console.log(`🔍 Analyzing exact timestamps for ${symbol} on ${date}...`);
    
    // Fetch 1-minute data
    // const response = null; // fyersApi.getHistoricalData({
      symbol,
      resolution: '1',
      range_from: date,
      range_to: date,
      date_format: 1,
      cont_flag: 1
    });

    if (!response || response.length === 0) {
      throw new Error('No 1-minute data available');
    }

    console.log(`📊 Total 1-minute candles: ${response.length}`);

    // Convert to analysis format - first 40 minutes only
    const first40Minutes = response.slice(0, 40).map((candle: any, index: number) => ({
      timestamp: candle[0],
      time: new Date(candle[0] * 1000).toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Kolkata',
        hour12: true 
      }),
      open: candle[1],
      high: candle[2],
      low: candle[3], 
      close: candle[4],
      minute: index + 1
    }));

    // Target values from 10-minute candles
    const targets = {
      c1a_high: 24994.85,
      c1a_low: 24907.6,
      c1b_high: 24993.85,
      c1b_low: 24924.35,
      c2a_high: 24978.75,
      c2a_low: 24924.6,
      c2b_high: 24943.35,
      c2b_low: 24912.7
    };

    console.log(`🎯 Searching for exact timestamps of target values...`);

    const results = {
      c1a_high: this.findExactTimestamp(first40Minutes, targets.c1a_high, 'high', 1, 10),
      c1a_low: this.findExactTimestamp(first40Minutes, targets.c1a_low, 'low', 1, 10),
      c1b_high: this.findExactTimestamp(first40Minutes, targets.c1b_high, 'high', 11, 20),
      c1b_low: this.findExactTimestamp(first40Minutes, targets.c1b_low, 'low', 11, 20),
      c2a_high: this.findExactTimestamp(first40Minutes, targets.c2a_high, 'high', 21, 30),
      c2a_low: this.findExactTimestamp(first40Minutes, targets.c2a_low, 'low', 21, 30),
      c2b_high: this.findExactTimestamp(first40Minutes, targets.c2b_high, 'high', 31, 40),
      c2b_low: this.findExactTimestamp(first40Minutes, targets.c2b_low, 'low', 31, 40)
    };

    // Calculate exact slopes using 1-minute timestamps
    const c1_high_timestamp = results.c1a_high?.timestamp || results.c1b_high?.timestamp;
    const c1_low_timestamp = results.c1a_low?.timestamp || results.c1b_low?.timestamp;
    const c2_high_timestamp = results.c2a_high?.timestamp || results.c2b_high?.timestamp;
    const c2_low_timestamp = results.c2a_low?.timestamp || results.c2b_low?.timestamp;

    const slopeAnalysis = {
      uptrend_1_3: {
        point_a: { price: targets.c1a_low, timestamp: c1_low_timestamp },
        point_b: { price: targets.c2a_high, timestamp: c2_high_timestamp },
        duration_minutes: c2_high_timestamp && c1_low_timestamp ? 
          Math.abs(c2_high_timestamp - c1_low_timestamp) / 60 : null,
        slope: c2_high_timestamp && c1_low_timestamp ?
          (targets.c2a_high - targets.c1a_low) / ((c2_high_timestamp - c1_low_timestamp) / 60) : null
      },
      downtrend_1_4: {
        point_a: { price: targets.c1a_high, timestamp: c1_high_timestamp },
        point_b: { price: targets.c2b_low, timestamp: c2_low_timestamp },
        duration_minutes: c2_low_timestamp && c1_high_timestamp ?
          Math.abs(c2_low_timestamp - c1_high_timestamp) / 60 : null,
        slope: c2_low_timestamp && c1_high_timestamp ?
          (targets.c2b_low - targets.c1a_high) / ((c2_low_timestamp - c1_high_timestamp) / 60) : null
      }
    };

    return {
      total_candles: first40Minutes.length,
      target_values: targets,
      exact_timestamps: results,
      slope_analysis: slopeAnalysis,
      raw_data: first40Minutes
    };
  }

  private findExactTimestamp(
    candles: CandleTimestamp[], 
    targetValue: number, 
    field: 'high' | 'low', 
    startMinute: number, 
    endMinute: number
  ) {
    console.log(`🔍 Searching for ${field} = ${targetValue} between minutes ${startMinute}-${endMinute}`);
    
    const relevantCandles = candles.filter(c => c.minute >= startMinute && c.minute <= endMinute);
    
    // Look for exact match first
    const exactMatch = relevantCandles.find(c => c[field] === targetValue);
    if (exactMatch) {
      console.log(`✅ EXACT MATCH: ${field} ${targetValue} found at ${exactMatch.time} (minute ${exactMatch.minute})`);
      return {
        timestamp: exactMatch.timestamp,
        time: exactMatch.time,  
        minute: exactMatch.minute,
        value: exactMatch[field],
        match_type: 'exact'
      };
    }

    // If no exact match, find closest value
    const closest = relevantCandles.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev[field] - targetValue);
      const currDiff = Math.abs(curr[field] - targetValue);
      return currDiff < prevDiff ? curr : prev;
    });

    console.log(`⚠️  CLOSEST MATCH: ${field} ${targetValue} closest to ${closest[field]} at ${closest.time} (minute ${closest.minute})`);
    
    return {
      timestamp: closest.timestamp,
      time: closest.time,
      minute: closest.minute, 
      value: closest[field],
      match_type: 'closest',
      difference: Math.abs(closest[field] - targetValue)
    };
  }
}

export const oneMinuteAnalyzer = new OneMinuteTimestampAnalyzer();