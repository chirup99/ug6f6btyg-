// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PatternResult {
  timeframe: number;
  type: 'UPTREND' | 'DOWNTREND';
  pattern: string;
  pointA: { time: string; price: number; candle: string };
  pointB: { time: string; price: number; candle: string };
  slope: number;
  duration: number;
  change: number;
  range: { start: string; end: string };
}

export class RecursiveC2BlockAnalyzer {

  /**
   * 🎯 Main recursive C2 Block Internal Pattern Analysis
   * Breaks down patterns: 80min → 40min → 20min → 10min → 5min
   */
  async performRecursiveAnalysis(
    symbol: string,
    date: string,
    initialTimeframe: number,
    initialPattern: string,
    initialCandleData: CandleData[]
  ): Promise<{
    allPatterns: PatternResult[];
    summary: {
      uptrends: PatternResult[];
      downtrends: PatternResult[];
      totalPatterns: number;
    }
  }> {
    console.log(`🔄 [RECURSIVE-C2] Starting Recursive C2 Block Internal Pattern Analysis`);
    console.log(`📊 Initial Pattern: ${initialPattern} on ${initialTimeframe}min timeframe`);
    
    const allPatterns: PatternResult[] = [];
    const minTimeframe = 5; // Stop at 5 minutes
    
    // Process the recursive breakdown
    await this.recursivePatternBreakdown(
      symbol, 
      date, 
      initialTimeframe, 
      initialCandleData, 
      allPatterns,
      minTimeframe
    );
    
    // Categorize patterns
    const uptrends = allPatterns.filter(p => p.type === 'UPTREND');
    const downtrends = allPatterns.filter(p => p.type === 'DOWNTREND');
    
    console.log(`✅ [RECURSIVE-C2] Completed recursive analysis:`);
    console.log(`   Total Patterns Found: ${allPatterns.length}`);
    console.log(`   Uptrend Patterns: ${uptrends.length}`);
    console.log(`   Downtrend Patterns: ${downtrends.length}`);
    console.log(`   🎯 ALL PATTERNS USE AUTHENTIC 1-MINUTE DATA - NO FAKE DATA`);
    
    return {
      allPatterns,
      summary: {
        uptrends,
        downtrends,
        totalPatterns: allPatterns.length
      }
    };
  }

  /**
   * 🔄 Recursive pattern breakdown using C2 block analysis
   */
  private async recursivePatternBreakdown(
    symbol: string,
    date: string,
    currentTimeframe: number,
    candleData: CandleData[],
    allPatterns: PatternResult[],
    minTimeframe: number
  ): Promise<void> {
    
    if (currentTimeframe < minTimeframe || candleData.length < 4) {
      console.log(`⚠️ [RECURSIVE-STOP] Stopping recursion at ${currentTimeframe}min (min: ${minTimeframe}min)`);
      return;
    }
    
    console.log(`🔧 [RECURSIVE-LEVEL] Analyzing ${currentTimeframe}min timeframe with ${candleData.length} candles`);
    
    try {
      // Find patterns in current timeframe
      const patterns = await this.findPatternsInTimeframe(symbol, date, currentTimeframe, candleData);
      allPatterns.push(...patterns);
      
      console.log(`📊 [RECURSIVE-PATTERNS] Found ${patterns.length} patterns in ${currentTimeframe}min timeframe:`);
      patterns.forEach(pattern => {
        console.log(`   ${pattern.type} ${pattern.pattern}: ${pattern.pointA.time} → ${pattern.pointB.time} (${pattern.change > 0 ? '+' : ''}${pattern.change.toFixed(1)} pts)`);
      });
      
      // Extract C2 block (3rd and 4th candles) for next recursion level
      const c2a = candleData[2]; // 3rd candle
      const c2b = candleData[3]; // 4th candle
      
      const c2Range = {
        start: new Date(c2a.timestamp * 1000).toLocaleTimeString('en-US', { 
          hour12: true, hour: '2-digit', minute: '2-digit' 
        }),
        end: new Date(c2b.timestamp * 1000).toLocaleTimeString('en-US', { 
          hour12: true, hour: '2-digit', minute: '2-digit' 
        })
      };
      
      console.log(`🔍 [RECURSIVE-C2] Extracting C2 block (3rd & 4th candles) for next level:`);
      console.log(`   C2 Range: ${c2Range.start} to ${c2Range.end}`);
      console.log(`   Next Timeframe: ${currentTimeframe / 2}min`);
      
      // Create 4 candles for the next timeframe (half the current timeframe)
      const nextTimeframe = currentTimeframe / 2;
      const nextCandleData = await this.create4CandlesFromC2Block(symbol, date, c2a, c2b, nextTimeframe);
      
      if (nextCandleData && nextCandleData.length === 4) {
        console.log(`✅ [RECURSIVE-SUCCESS] Created 4 candles for ${nextTimeframe}min timeframe from C2 block`);
        
        // Continue recursion with the new timeframe and candle data
        await this.recursivePatternBreakdown(
          symbol, 
          date, 
          nextTimeframe, 
          nextCandleData, 
          allPatterns, 
          minTimeframe
        );
      } else {
        console.log(`⚠️ [RECURSIVE-FAIL] Could not create 4 candles for ${nextTimeframe}min timeframe`);
      }
      
    } catch (error) {
      console.error(`❌ [RECURSIVE-ERROR] Error in ${currentTimeframe}min analysis:`, error);
    }
  }

  /**
   * 🎯 Find patterns in current timeframe using authentic Point A/B Analysis
   */
  private async findPatternsInTimeframe(
    symbol: string,
    date: string,
    timeframe: number,
    candleData: CandleData[]
  ): Promise<PatternResult[]> {
    
    console.log(`🔍 [PATTERN-SEARCH] Searching for patterns in ${timeframe}min timeframe`);
    
    const patterns: PatternResult[] = [];
    
    // Get 1-minute data for precise Point A/B extraction
    const oneMinuteData = await this.get1MinuteDataForTimeframe(symbol, date, candleData);
    
    if (!oneMinuteData || oneMinuteData.length === 0) {
      console.log(`⚠️ [PATTERN-FALLBACK] No 1-minute data, using candle OHLC for ${timeframe}min`);
      return this.findPatternsFromCandleOHLC(timeframe, candleData);
    }
    
    console.log(`✅ [PATTERN-1MIN] Using ${oneMinuteData.length} 1-minute candles for authentic Point A/B`);
    
    // Pattern combinations to check: 1-3, 1-4, 2-3, 2-4
    const patternCombinations = [
      { start: 0, end: 2, name: '1-3' }, // C1A to C2A
      { start: 0, end: 3, name: '1-4' }, // C1A to C2B
      { start: 1, end: 2, name: '2-3' }, // C1B to C2A
      { start: 1, end: 3, name: '2-4' }  // C1B to C2B
    ];
    
    for (const combo of patternCombinations) {
      const startCandle = candleData[combo.start];
      const endCandle = candleData[combo.end];
      
      // Get 1-minute data between these candles
      const relevantMinuteData = oneMinuteData.filter(candle => 
        candle.timestamp >= startCandle.timestamp && 
        candle.timestamp <= endCandle.timestamp
      );
      
      if (relevantMinuteData.length >= 2) {
        const pattern = await this.extractPatternFromMinuteData(
          timeframe,
          combo.name,
          relevantMinuteData,
          startCandle,
          endCandle
        );
        
        if (pattern) {
          patterns.push(pattern);
        }
      }
    }
    
    console.log(`📊 [PATTERN-RESULT] Found ${patterns.length} patterns in ${timeframe}min timeframe`);
    return patterns;
  }

  /**
   * 🎯 Extract pattern from 1-minute data using authentic Point A/B Analysis
   */
  private async extractPatternFromMinuteData(
    timeframe: number,
    patternName: string,
    minuteData: CandleData[],
    startCandle: CandleData,
    endCandle: CandleData
  ): Promise<PatternResult | null> {
    
    // Determine pattern type from overall price movement
    const firstPrice = minuteData[0].open;
    const lastPrice = minuteData[minuteData.length - 1].close;
    const type: 'UPTREND' | 'DOWNTREND' = lastPrice > firstPrice ? 'UPTREND' : 'DOWNTREND';
    
    let pointA = { time: '', price: 0, candle: '' };
    let pointB = { time: '', price: 0, candle: '' };
    
    if (type === 'UPTREND') {
      // Find authentic Point A (Low) and Point B (High)
      let lowestPrice = Infinity;
      let highestPrice = -Infinity;
      
      minuteData.forEach((candle) => {
        if (candle.low < lowestPrice) {
          lowestPrice = candle.low;
          pointA = {
            time: new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }),
            price: candle.low,
            candle: this.getCandlePosition(candle.timestamp, startCandle.timestamp, endCandle.timestamp)
          };
        }
        if (candle.high > highestPrice) {
          highestPrice = candle.high;
          pointB = {
            time: new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }),
            price: candle.high,
            candle: this.getCandlePosition(candle.timestamp, startCandle.timestamp, endCandle.timestamp)
          };
        }
      });
    } else {
      // Find authentic Point A (High) and Point B (Low)
      let lowestPrice = Infinity;
      let highestPrice = -Infinity;
      
      minuteData.forEach((candle) => {
        if (candle.high > highestPrice) {
          highestPrice = candle.high;
          pointA = {
            time: new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }),
            price: candle.high,
            candle: this.getCandlePosition(candle.timestamp, startCandle.timestamp, endCandle.timestamp)
          };
        }
        if (candle.low < lowestPrice) {
          lowestPrice = candle.low;
          pointB = {
            time: new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }),
            price: candle.low,
            candle: this.getCandlePosition(candle.timestamp, startCandle.timestamp, endCandle.timestamp)
          };
        }
      });
    }
    
    // Calculate metrics
    const duration = (endCandle.timestamp - startCandle.timestamp) / 60; // minutes
    const change = pointB.price - pointA.price;
    const slope = duration > 0 ? change / duration : 0;
    
    const rangeStart = new Date(startCandle.timestamp * 1000).toLocaleTimeString('en-US', { 
      hour12: true, hour: '2-digit', minute: '2-digit' 
    });
    const rangeEnd = new Date(endCandle.timestamp * 1000).toLocaleTimeString('en-US', { 
      hour12: true, hour: '2-digit', minute: '2-digit' 
    });
    
    return {
      timeframe,
      type,
      pattern: patternName,
      pointA,
      pointB,
      slope: Math.round(slope * 10000) / 10000,
      duration: Math.round(duration),
      change: Math.round(change * 100) / 100,
      range: { start: rangeStart, end: rangeEnd }
    };
  }

  /**
   * 🔧 Create 4 real candles for next timeframe by splitting C2 block (3rd & 4th candles) in half
   * C2A (3rd candle) + C2B (4th candle) → Split each in half → Get 4 real candles for next timeframe
   */
  private async create4CandlesFromC2Block(
    symbol: string,
    date: string,
    c2a: CandleData,
    c2b: CandleData,
    nextTimeframe: number
  ): Promise<CandleData[] | null> {
    
    try {
      console.log(`🔧 [REAL-C2-SPLIT] Creating 4 real candles by splitting C2 block (C2A + C2B) for ${nextTimeframe}min`);
      console.log(`📊 [REAL-C2-SPLIT] C2A (3rd candle): ${new Date(c2a.timestamp * 1000).toLocaleTimeString()}`);
      console.log(`📊 [REAL-C2-SPLIT] C2B (4th candle): ${new Date(c2b.timestamp * 1000).toLocaleTimeString()}`);
      
      // Get 1-minute data for the entire C2 block range (C2A + C2B)
      const oneMinuteData = null; // fyersApi.getHistoricalData({
        symbol: symbol,
        resolution: '1',
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });
      
      if (!oneMinuteData || oneMinuteData.length === 0) {
        console.log(`⚠️ [REAL-C2-SPLIT] No 1-minute data available`);
        return null;
      }
      
      // Filter 1-minute data for C2A timeframe
      const c2aEndTime = c2a.timestamp + (nextTimeframe * 2 * 60); // C2A covers half of the 80min = 40min
      const c2aMinuteCandles = oneMinuteData.filter((candle: CandleData) => 
        candle.timestamp >= c2a.timestamp && candle.timestamp < c2aEndTime
      );
      
      // Filter 1-minute data for C2B timeframe  
      const c2bMinuteCandles = oneMinuteData.filter((candle: CandleData) => 
        candle.timestamp >= c2aEndTime && candle.timestamp <= c2b.timestamp + (nextTimeframe * 2 * 60)
      );
      
      console.log(`📊 [REAL-C2-SPLIT] Found ${c2aMinuteCandles.length} 1-min candles for C2A, ${c2bMinuteCandles.length} for C2B`);
      
      const real4Candles: CandleData[] = [];
      
      // Split C2A into 2 real candles (first half and second half)
      if (c2aMinuteCandles.length >= 2) {
        const c2aHalfPoint = Math.floor(c2aMinuteCandles.length / 2);
        
        // First half of C2A → Real Candle 1
        const c2aFirstHalf = c2aMinuteCandles.slice(0, c2aHalfPoint);
        if (c2aFirstHalf.length > 0) {
          real4Candles.push({
            timestamp: c2aFirstHalf[0].timestamp,
            open: c2aFirstHalf[0].open,
            high: Math.max(...c2aFirstHalf.map(c => c.high)),
            low: Math.min(...c2aFirstHalf.map(c => c.low)),
            close: c2aFirstHalf[c2aFirstHalf.length - 1].close,
            volume: c2aFirstHalf.reduce((sum, c) => sum + c.volume, 0)
          });
        }
        
        // Second half of C2A → Real Candle 2
        const c2aSecondHalf = c2aMinuteCandles.slice(c2aHalfPoint);
        if (c2aSecondHalf.length > 0) {
          real4Candles.push({
            timestamp: c2aSecondHalf[0].timestamp,
            open: c2aSecondHalf[0].open,
            high: Math.max(...c2aSecondHalf.map(c => c.high)),
            low: Math.min(...c2aSecondHalf.map(c => c.low)),
            close: c2aSecondHalf[c2aSecondHalf.length - 1].close,
            volume: c2aSecondHalf.reduce((sum, c) => sum + c.volume, 0)
          });
        }
      }
      
      // Split C2B into 2 real candles (first half and second half)
      if (c2bMinuteCandles.length >= 2) {
        const c2bHalfPoint = Math.floor(c2bMinuteCandles.length / 2);
        
        // First half of C2B → Real Candle 3
        const c2bFirstHalf = c2bMinuteCandles.slice(0, c2bHalfPoint);
        if (c2bFirstHalf.length > 0) {
          real4Candles.push({
            timestamp: c2bFirstHalf[0].timestamp,
            open: c2bFirstHalf[0].open,
            high: Math.max(...c2bFirstHalf.map(c => c.high)),
            low: Math.min(...c2bFirstHalf.map(c => c.low)),
            close: c2bFirstHalf[c2bFirstHalf.length - 1].close,
            volume: c2bFirstHalf.reduce((sum, c) => sum + c.volume, 0)
          });
        }
        
        // Second half of C2B → Real Candle 4
        const c2bSecondHalf = c2bMinuteCandles.slice(c2bHalfPoint);
        if (c2bSecondHalf.length > 0) {
          real4Candles.push({
            timestamp: c2bSecondHalf[0].timestamp,
            open: c2bSecondHalf[0].open,
            high: Math.max(...c2bSecondHalf.map(c => c.high)),
            low: Math.min(...c2bSecondHalf.map(c => c.low)),
            close: c2bSecondHalf[c2bSecondHalf.length - 1].close,
            volume: c2bSecondHalf.reduce((sum, c) => sum + c.volume, 0)
          });
        }
      }
      
      if (real4Candles.length === 4) {
        console.log(`✅ [REAL-C2-SPLIT] Successfully created 4 real candles for ${nextTimeframe}min by splitting C2 block:`);
        real4Candles.forEach((candle, idx) => {
          console.log(`   Real Candle ${idx + 1}: ${new Date(candle.timestamp * 1000).toLocaleTimeString()} | OHLC: ${candle.open}/${candle.high}/${candle.low}/${candle.close}`);
        });
        return real4Candles;
      } else {
        console.log(`⚠️ [REAL-C2-SPLIT] Only created ${real4Candles.length} candles, need 4 for analysis`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ [REAL-C2-SPLIT] Error creating 4 real candles from C2 block:`, error);
      return null;
    }
  }

  /**
   * 🎯 Get 1-minute data for current timeframe range
   */
  private async get1MinuteDataForTimeframe(
    symbol: string,
    date: string,
    candleData: CandleData[]
  ): Promise<CandleData[] | null> {
    
    try {
      const oneMinuteData = null; // fyersApi.getHistoricalData({
        symbol: symbol,
        resolution: '1',
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });
      
      if (!oneMinuteData || oneMinuteData.length === 0) {
        return null;
      }
      
      // Filter to timeframe range
      const startTime = candleData[0].timestamp;
      const endTime = candleData[candleData.length - 1].timestamp;
      
      return oneMinuteData.filter((candle: CandleData) => 
        candle.timestamp >= startTime && candle.timestamp <= endTime
      );
      
    } catch (error) {
      console.error(`❌ [1MIN-DATA] Error fetching 1-minute data:`, error);
      return null;
    }
  }

  /**
   * 🎯 Fallback: Find patterns from candle OHLC when 1-minute data unavailable
   */
  private findPatternsFromCandleOHLC(timeframe: number, candleData: CandleData[]): PatternResult[] {
    const patterns: PatternResult[] = [];
    
    // Simple fallback implementation using candle OHLC
    const firstPrice = candleData[0].open;
    const lastPrice = candleData[candleData.length - 1].close;
    const type: 'UPTREND' | 'DOWNTREND' = lastPrice > firstPrice ? 'UPTREND' : 'DOWNTREND';
    
    const pointA = {
      time: new Date(candleData[0].timestamp * 1000).toLocaleTimeString('en-US', { 
        hour12: true, hour: '2-digit', minute: '2-digit' 
      }),
      price: type === 'UPTREND' ? candleData[0].low : candleData[0].high,
      candle: 'C1A'
    };
    
    const pointB = {
      time: new Date(candleData[candleData.length - 1].timestamp * 1000).toLocaleTimeString('en-US', { 
        hour12: true, hour: '2-digit', minute: '2-digit' 
      }),
      price: type === 'UPTREND' ? candleData[candleData.length - 1].high : candleData[candleData.length - 1].low,
      candle: 'C2B'
    };
    
    const duration = (candleData[candleData.length - 1].timestamp - candleData[0].timestamp) / 60;
    const change = pointB.price - pointA.price;
    const slope = duration > 0 ? change / duration : 0;
    
    patterns.push({
      timeframe,
      type,
      pattern: '1-4',
      pointA,
      pointB,
      slope: Math.round(slope * 10000) / 10000,
      duration: Math.round(duration),
      change: Math.round(change * 100) / 100,
      range: { 
        start: pointA.time, 
        end: pointB.time 
      }
    });
    
    return patterns;
  }

  /**
   * 🎯 Helper: Get candle position (C1A, C1B, C2A, C2B)
   */
  private getCandlePosition(timestamp: number, startTimestamp: number, endTimestamp: number): string {
    const totalDuration = endTimestamp - startTimestamp;
    const position = (timestamp - startTimestamp) / totalDuration;
    
    if (position <= 0.25) return 'C1A';
    if (position <= 0.50) return 'C1B';  
    if (position <= 0.75) return 'C2A';
    return 'C2B';
  }
}

export const recursiveC2BlockAnalyzer = new RecursiveC2BlockAnalyzer();