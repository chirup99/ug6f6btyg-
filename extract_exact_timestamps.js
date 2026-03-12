/**
 * Extract Exact Timestamps for C1A, C1B, C2A, C2B High/Low Values
 * Using July 25th NIFTY 1-minute data
 */

import axios from 'axios';

const TARGET_VALUES = {
  C1A_HIGH: 24994.85,
  C1A_LOW: 24907.6,
  C1B_HIGH: 24993.85,
  C1B_LOW: 24924.35,
  C2A_HIGH: 24978.75,
  C2A_LOW: 24924.6,
  C2B_HIGH: 24943.35,
  C2B_LOW: 24912.7
};

async function extractExactTimestamps() {
  try {
    console.log('🔍 Fetching July 25th NIFTY 1-minute data...');
    
    const response = await axios.post('http://localhost:5000/api/battu-scan/intraday/fetch-one-minute-data', {
      symbol: 'NSE:NIFTY50-INDEX',
      analysisDate: '2025-07-25'
    });
    
    const candles = response.data.baseData.candles;
    console.log(`📊 Fetched ${candles.length} 1-minute candles`);
    
    const results = {};
    
    // Search for each target value
    for (const [key, targetValue] of Object.entries(TARGET_VALUES)) {
      console.log(`\n🎯 Searching for ${key}: ${targetValue}`);
      
      const isHigh = key.includes('HIGH');
      const matchingCandles = candles.filter(candle => {
        const candleValue = isHigh ? candle.high : candle.low;
        return Math.abs(candleValue - targetValue) < 0.01; // Allow small floating point differences
      });
      
      if (matchingCandles.length > 0) {
        const match = matchingCandles[0];
        const time = new Date(match.timestamp * 1000);
        const timeStr = time.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        });
        
        results[key] = {
          value: targetValue,
          timestamp: match.timestamp,
          time: timeStr,
          candle: match
        };
        
        console.log(`✅ FOUND ${key}: ${targetValue} at ${timeStr}`);
      } else {
        console.log(`❌ NOT FOUND: ${key}: ${targetValue}`);
      }
    }
    
    console.log('\n📋 COMPLETE TIMESTAMP RESULTS:');
    console.log('================================');
    
    Object.entries(results).forEach(([key, data]) => {
      console.log(`${key}: ${data.value} at ${data.time}`);
    });
    
    // Calculate precise slopes if we have the data
    if (results.C1A_LOW && results.C2A_HIGH) {
      const uptrend = {
        pointA: results.C1A_LOW,
        pointB: results.C2A_HIGH,
        priceChange: results.C2A_HIGH.value - results.C1A_LOW.value,
        timeChange: (results.C2A_HIGH.timestamp - results.C1A_LOW.timestamp) / 60,
      };
      uptrend.slope = uptrend.priceChange / uptrend.timeChange;
      
      console.log('\n📈 UPTREND CALCULATION (1-3):');
      console.log(`Point A: ${uptrend.pointA.value} at ${uptrend.pointA.time}`);
      console.log(`Point B: ${uptrend.pointB.value} at ${uptrend.pointB.time}`);
      console.log(`Duration: ${uptrend.timeChange} minutes`);
      console.log(`Slope: ${uptrend.slope.toFixed(3)} points/minute`);
    }
    
    if (results.C1A_HIGH && results.C2B_LOW) {
      const downtrend = {
        pointA: results.C1A_HIGH,
        pointB: results.C2B_LOW,
        priceChange: results.C2B_LOW.value - results.C1A_HIGH.value,
        timeChange: (results.C2B_LOW.timestamp - results.C1A_HIGH.timestamp) / 60,
      };
      downtrend.slope = downtrend.priceChange / downtrend.timeChange;
      
      console.log('\n📉 DOWNTREND CALCULATION (1-4):');
      console.log(`Point A: ${downtrend.pointA.value} at ${downtrend.pointA.time}`);
      console.log(`Point B: ${downtrend.pointB.value} at ${downtrend.pointB.time}`);
      console.log(`Duration: ${downtrend.timeChange} minutes`);
      console.log(`Slope: ${downtrend.slope.toFixed(3)} points/minute`);
    }
    
  } catch (error) {
    console.error('❌ Error extracting timestamps:', error.message);
  }
}

// Run the extraction
extractExactTimestamps();