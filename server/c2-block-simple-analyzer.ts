// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface C2BlockResult {
  success: boolean;
  mainPattern: {
    timeframe: number;
    type: string;
    strength: number;
    pointA: { time: string; price: number };
    pointB: { time: string; price: number };
    slope: number;
  };
  miniPattern: {
    timeframe: number;
    type: string;
    strength: number;
    conflictLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    internalResistance: boolean;
    pointA: { time: string; price: number };
    pointB: { time: string; price: number };
    slope: number;
  };
  recommendation: {
    shouldTrade: boolean;
    confidence: number;
    positionSize: string;
    reason: string;
  };
}

export class C2BlockSimpleAnalyzer {
  
  async analyzeC2Block(
    symbol: string,
    date: string,
    timeframe: number,
    mainPattern: string,
    candleData: CandleData[],
    authenticPointAB?: {
      pointA: { time: string; price: number };
      pointB: { time: string; price: number };
    }
  ): Promise<C2BlockResult> {
    try {
      console.log(`🔬 [C2-BLOCK-AUTHENTIC] Starting C2 Block Internal Pattern Analysis for ${symbol} on ${timeframe}min`);
      console.log(`📋 [C2-BLOCK-AUTHENTIC] Purpose: Find accurate patterns from main pattern (Point A/B Analysis - 4 Candle Rule Methodology)`);
      console.log(`📊 [C2-BLOCK-AUTHENTIC] Main Pattern Found: ${mainPattern} on ${timeframe}min timeframe`);
      
      if (authenticPointAB) {
        console.log(`🎯 [C2-AUTHENTIC] Using REAL Point A/B from main 4 Candle Rule analysis:`);
        console.log(`   Point A: ${authenticPointAB.pointA.time} @ ₹${authenticPointAB.pointA.price}`);
        console.log(`   Point B: ${authenticPointAB.pointB.time} @ ₹${authenticPointAB.pointB.price}`);
        console.log(`   🔍 Breaking down existing ${timeframe}min pattern to get more accurate patterns`);
        console.log(`   📈 Will analyze C2A (3rd candle) and C2B (4th candle) for internal patterns`);
        console.log(`   ❌ NO MORE FAKE TIMESTAMPS - Using authentic 4 Candle Rule methodology data`);
      }
      
      if (candleData.length < 4) {
        throw new Error('Need at least 4 candles for C2 block analysis');
      }
      
      // Extract C2 block (3rd and 4th candles) for internal pattern analysis
      const c2a = candleData[2];
      const c2b = candleData[3];
      
      console.log(`🔧 [C2-BLOCK-BREAKDOWN] Extracting C2A (3rd candle) and C2B (4th candle):`);
      console.log(`   C2A Timestamp: ${new Date(c2a.timestamp * 1000).toLocaleTimeString()}`);
      console.log(`   C2B Timestamp: ${new Date(c2b.timestamp * 1000).toLocaleTimeString()}`);
      console.log(`   📌 These 2 candles will be used to find internal patterns within main ${timeframe}min pattern`);
      
      // Analyze main pattern using authentic Point A/B if provided
      const mainPatternAnalysis = authenticPointAB 
        ? this.createMainPatternFromAuthenticPoints(mainPattern, timeframe, authenticPointAB, candleData)
        : this.analyzeMainPattern(mainPattern, timeframe, candleData);
      
      // Analyze mini pattern (half timeframe) using authentic 1-minute data if available
      const miniTimeframe = timeframe / 2;
      console.log(`🔀 [C2-MINI-TIMEFRAME] Creating mini pattern with ${miniTimeframe}min timeframe (half of ${timeframe}min)`);
      
      const miniPatternAnalysis = authenticPointAB 
        ? await this.analyzeMiniPatternWithAuthentic1MinuteData(c2a, c2b, miniTimeframe, symbol, date)
        : this.analyzeMiniPattern(c2a, c2b, miniTimeframe);
      
      // Determine conflict level between main pattern and internal C2 mini pattern
      const conflictAnalysis = this.analyzeConflict(mainPatternAnalysis, miniPatternAnalysis);
      
      console.log(`🔍 [C2-CONFLICT-ANALYSIS] Analyzing internal resistance between patterns:`);
      console.log(`   Main Pattern: ${mainPatternAnalysis.type} (${timeframe}min)`);
      console.log(`   Mini Pattern: ${miniPatternAnalysis.type} (${miniTimeframe}min)`);
      console.log(`   Conflict Level: ${conflictAnalysis.level}`);
      console.log(`   Has Internal Resistance: ${conflictAnalysis.hasResistance ? 'YES' : 'NO'}`);
      
      // Generate trading recommendation based on conflict analysis
      const recommendation = this.generateRecommendation(conflictAnalysis);
      
      console.log(`💡 [C2-TRADING-RECOMMENDATION] Based on C2 Block Internal Pattern Analysis:`);
      console.log(`   Should Trade: ${recommendation.shouldTrade ? 'YES' : 'NO'}`);
      console.log(`   Confidence: ${recommendation.confidence}%`);
      console.log(`   Position Size: ${recommendation.positionSize}`);
      console.log(`   Reason: ${recommendation.reason}`);
      console.log(`✅ [C2-BLOCK-COMPLETE] C2 Block Internal Pattern Analysis completed successfully`);
      console.log(`🎯 AUTHENTIC Point A/B Analysis (4 Candle Rule Methodology) integration COMPLETE`);
      
      return {
        success: true,
        mainPattern: mainPatternAnalysis,
        miniPattern: {
          ...miniPatternAnalysis,
          conflictLevel: conflictAnalysis.level,
          internalResistance: conflictAnalysis.hasResistance
        },
        recommendation
      };
      
    } catch (error) {
      console.error('❌ [C2-SIMPLE] Analysis failed:', error);
      return {
        success: false,
        mainPattern: { timeframe: 0, type: '', strength: 0, pointA: { time: '', price: 0 }, pointB: { time: '', price: 0 }, slope: 0 },
        miniPattern: { timeframe: 0, type: '', strength: 0, conflictLevel: 'NONE', internalResistance: false, pointA: { time: '', price: 0 }, pointB: { time: '', price: 0 }, slope: 0 },
        recommendation: { shouldTrade: false, confidence: 0, positionSize: 'NONE', reason: 'Analysis failed' }
      };
    }
  }
  
  private analyzeMainPattern(pattern: string, timeframe: number, candles: CandleData[]) {
    const type = pattern.includes('UPTREND') ? 'UPTREND' : 'DOWNTREND';
    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];
    
    const priceChange = Math.abs(lastCandle.close - firstCandle.open);
    const strength = Math.round((priceChange / firstCandle.open) * 10000) / 100; // Percentage with 2 decimals
    
    // Calculate Point A and Point B based on pattern type with exact timestamps
    const pointA = {
      time: new Date(firstCandle.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      price: type === 'UPTREND' ? firstCandle.low : firstCandle.high
    };
    
    const pointB = {
      time: new Date(lastCandle.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      price: type === 'UPTREND' ? lastCandle.high : lastCandle.low
    };
    
    // Calculate slope (points per minute)
    const timeDifferenceMinutes = (lastCandle.timestamp - firstCandle.timestamp) / 60;
    const slope = timeDifferenceMinutes > 0 ? (pointB.price - pointA.price) / timeDifferenceMinutes : 0;
    
    return {
      timeframe,
      type,
      strength,
      pointA,
      pointB,
      slope: Math.round(slope * 10000) / 10000 // 4 decimal places
    };
  }
  
  private analyzeMiniPattern(c2a: CandleData, c2b: CandleData, miniTimeframe: number) {
    const priceChange = c2b.close - c2a.open;
    const type = priceChange > 0 ? 'UPTREND' : 'DOWNTREND';
    const strength = Math.round(Math.abs(priceChange / c2a.open) * 10000) / 100;
    
    console.log(`⚠️ [C2-MINI-FALLBACK] Using FALLBACK candle OHLC data for mini pattern (not authentic 1-minute)`);
    console.log(`   C2A: ${new Date(c2a.timestamp * 1000).toLocaleTimeString()} | OHLC: ${c2a.open}/${c2a.high}/${c2a.low}/${c2a.close}`);
    console.log(`   C2B: ${new Date(c2b.timestamp * 1000).toLocaleTimeString()} | OHLC: ${c2b.open}/${c2b.high}/${c2b.low}/${c2b.close}`);
    
    // Calculate Point A and Point B for mini pattern with exact timestamps
    const pointA = {
      time: new Date(c2a.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      price: type === 'UPTREND' ? c2a.low : c2a.high
    };
    
    const pointB = {
      time: new Date(c2b.timestamp * 1000).toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      price: type === 'UPTREND' ? c2b.high : c2b.low
    };
    
    // Calculate slope (points per minute)
    const timeDifferenceMinutes = (c2b.timestamp - c2a.timestamp) / 60;
    const slope = timeDifferenceMinutes > 0 ? (pointB.price - pointA.price) / timeDifferenceMinutes : 0;
    
    return {
      timeframe: miniTimeframe,
      type,
      strength,
      pointA,
      pointB,
      slope: Math.round(slope * 10000) / 10000 // 4 decimal places
    };
  }

  /**
   * 🎯 Analyze mini pattern using AUTHENTIC 1-minute data for exact Point A/B extraction
   */
  private async analyzeMiniPatternWithAuthentic1MinuteData(
    c2a: CandleData, 
    c2b: CandleData, 
    miniTimeframe: number, 
    symbol: string, 
    date: string
  ) {
    try {
      console.log(`🔬 [C2-MINI-AUTHENTIC] Analyzing mini pattern using REAL 1-minute data for C2 block:`);
      console.log(`   C2A Start: ${new Date(c2a.timestamp * 1000).toLocaleTimeString()}`);
      console.log(`   C2B End: ${new Date(c2b.timestamp * 1000).toLocaleTimeString()}`);
      console.log(`   📊 PROBLEM: We only have 2 candles (C2A, C2B) but need 4 for patterns`);
      console.log(`   💡 SOLUTION: Use 1-minute data to create mini 4-candle structure within C2 block range`);
      console.log(`   Fetching 1-minute data between these timestamps for authentic Point A/B extraction...`);
      
      // Fetch 1-minute data for the C2 block timeframe
      const oneMinuteData = null; // fyersApi.getHistoricalData({
        symbol: symbol,
        resolution: '1',
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });
      
      if (!oneMinuteData || oneMinuteData.length === 0) {
        console.log(`⚠️ [C2-MINI-FALLBACK] No 1-minute data available, falling back to candle OHLC`);
        return this.analyzeMiniPattern(c2a, c2b, miniTimeframe);
      }
      
      // Filter 1-minute data within C2 block timeframe
      const c2BlockStart = c2a.timestamp;
      const c2BlockEnd = c2b.timestamp + (miniTimeframe * 60); // Add timeframe duration
      
      const relevantMinuteCandles = oneMinuteData.filter((candle: CandleData) => 
        candle.timestamp >= c2BlockStart && candle.timestamp <= c2BlockEnd
      );
      
      if (relevantMinuteCandles.length < 2) {
        console.log(`⚠️ [C2-MINI-FALLBACK] Insufficient 1-minute candles (${relevantMinuteCandles.length}), using candle OHLC`);
        return this.analyzeMiniPattern(c2a, c2b, miniTimeframe);
      }
      
      console.log(`✅ [C2-MINI-AUTHENTIC] Found ${relevantMinuteCandles.length} 1-minute candles for C2 block analysis`);
      console.log(`🔧 [C2-4CANDLE-CREATION] Creating 4-candle structure from ${relevantMinuteCandles.length} 1-minute candles:`);
      
      // Group 1-minute candles into 4 equal groups to create 4-candle structure
      const candlesPerGroup = Math.floor(relevantMinuteCandles.length / 4);
      console.log(`   📊 Dividing ${relevantMinuteCandles.length} 1-minute candles into 4 groups (${candlesPerGroup} candles each)`);
      
      if (candlesPerGroup < 1) {
        console.log(`⚠️ [C2-MINI-FALLBACK] Insufficient candles for 4-group division, using direct Point A/B extraction`);
      }
      
      // Find authentic Point A and Point B using 1-minute precision
      let pointA = { time: '', price: 0 };
      let pointB = { time: '', price: 0 };
      
      // Determine pattern type from overall price movement
      const firstPrice = relevantMinuteCandles[0].open;
      const lastPrice = relevantMinuteCandles[relevantMinuteCandles.length - 1].close;
      const type = lastPrice > firstPrice ? 'UPTREND' : 'DOWNTREND';
      
      console.log(`📈 [C2-PATTERN-TYPE] Determined pattern type: ${type} based on price movement`);
      console.log(`   First Price: ₹${firstPrice} | Last Price: ₹${lastPrice}`);
      
      // Create 4-candle structure from 1-minute data if we have enough candles
      if (candlesPerGroup >= 1) {
        console.log(`🔧 [C2-4CANDLE-STRUCTURE] Creating virtual 4-candle structure for pattern analysis:`);
        
        // Create 4 virtual candles by grouping 1-minute candles
        const virtual4Candles = [];
        for (let i = 0; i < 4; i++) {
          const startIdx = i * candlesPerGroup;
          const endIdx = i === 3 ? relevantMinuteCandles.length : (i + 1) * candlesPerGroup;
          const group = relevantMinuteCandles.slice(startIdx, endIdx);
          
          if (group.length > 0) {
            const virtualCandle = {
              timestamp: group[0].timestamp,
              open: group[0].open,
              high: Math.max(...group.map(c => c.high)),
              low: Math.min(...group.map(c => c.low)),
              close: group[group.length - 1].close,
              volume: group.reduce((sum, c) => sum + c.volume, 0)
            };
            virtual4Candles.push(virtualCandle);
            
            console.log(`   Virtual Candle ${i + 1}: ${new Date(virtualCandle.timestamp * 1000).toLocaleTimeString()} | OHLC: ${virtualCandle.open}/${virtualCandle.high}/${virtualCandle.low}/${virtualCandle.close}`);
          }
        }
        
        if (virtual4Candles.length === 4) {
          console.log(`✅ [C2-4CANDLE-SUCCESS] Created 4 virtual candles for Point A/B analysis`);
          
          // Apply 4 Candle Rule methodology to virtual candles
          if (type === 'UPTREND') {
            // Find lowest point (Point A) across all 4 virtual candles
            let lowestPrice = Infinity;
            let lowestCandleIdx = 0;
            virtual4Candles.forEach((candle, idx) => {
              if (candle.low < lowestPrice) {
                lowestPrice = candle.low;
                lowestCandleIdx = idx;
              }
            });
            
            // Find highest point (Point B) across all 4 virtual candles  
            let highestPrice = -Infinity;
            let highestCandleIdx = 0;
            virtual4Candles.forEach((candle, idx) => {
              if (candle.high > highestPrice) {
                highestPrice = candle.high;
                highestCandleIdx = idx;
              }
            });
            
            pointA = {
              time: new Date(virtual4Candles[lowestCandleIdx].timestamp * 1000).toLocaleTimeString('en-US', { 
                hour12: true, hour: '2-digit', minute: '2-digit' 
              }),
              price: lowestPrice
            };
            
            pointB = {
              time: new Date(virtual4Candles[highestCandleIdx].timestamp * 1000).toLocaleTimeString('en-US', { 
                hour12: true, hour: '2-digit', minute: '2-digit' 
              }),
              price: highestPrice
            };
            
            console.log(`📈 [C2-UPTREND-POINTS] Point A (Low): Virtual Candle ${lowestCandleIdx + 1} | Point B (High): Virtual Candle ${highestCandleIdx + 1}`);
            
          } else {
            // DOWNTREND: Find highest point (Point A) and lowest point (Point B)
            let highestPrice = -Infinity;
            let highestCandleIdx = 0;
            virtual4Candles.forEach((candle, idx) => {
              if (candle.high > highestPrice) {
                highestPrice = candle.high;
                highestCandleIdx = idx;
              }
            });
            
            let lowestPrice = Infinity;
            let lowestCandleIdx = 0;
            virtual4Candles.forEach((candle, idx) => {
              if (candle.low < lowestPrice) {
                lowestPrice = candle.low;
                lowestCandleIdx = idx;
              }
            });
            
            pointA = {
              time: new Date(virtual4Candles[highestCandleIdx].timestamp * 1000).toLocaleTimeString('en-US', { 
                hour12: true, hour: '2-digit', minute: '2-digit' 
              }),
              price: highestPrice
            };
            
            pointB = {
              time: new Date(virtual4Candles[lowestCandleIdx].timestamp * 1000).toLocaleTimeString('en-US', { 
                hour12: true, hour: '2-digit', minute: '2-digit' 
              }),
              price: lowestPrice
            };
            
            console.log(`📉 [C2-DOWNTREND-POINTS] Point A (High): Virtual Candle ${highestCandleIdx + 1} | Point B (Low): Virtual Candle ${lowestCandleIdx + 1}`);
          }
        } else {
          console.log(`⚠️ [C2-4CANDLE-FALLBACK] Could not create 4 virtual candles, using direct Point A/B extraction`);
          // Fallback to direct Point A/B extraction from all 1-minute candles
          const directPoints = this.extractDirectPointAB(relevantMinuteCandles, type);
          pointA = directPoints.pointA;
          pointB = directPoints.pointB;
        }
      } else {
        console.log(`⚠️ [C2-DIRECT-EXTRACTION] Using direct Point A/B extraction from ${relevantMinuteCandles.length} 1-minute candles`);
        const directPoints = this.extractDirectPointAB(relevantMinuteCandles, type);
        pointA = directPoints.pointA;
        pointB = directPoints.pointB;
      }
      
      // Calculate strength and slope using authentic points
      const priceChange = Math.abs(pointB.price - pointA.price);
      const strength = Math.round((priceChange / pointA.price) * 10000) / 100;
      
      // Calculate time difference for slope
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        return hour24 * 60 + minutes;
      };
      
      const pointAMinutes = parseTime(pointA.time);
      const pointBMinutes = parseTime(pointB.time);
      const timeDifferenceMinutes = Math.abs(pointBMinutes - pointAMinutes);
      const slope = timeDifferenceMinutes > 0 ? (pointB.price - pointA.price) / timeDifferenceMinutes : 0;
      
      console.log(`✅ [C2-MINI-AUTHENTIC] Extracted REAL Point A/B from 1-minute data:`);
      console.log(`   Pattern: ${type} | Strength: ${strength}%`);
      console.log(`   AUTHENTIC Point A: ${pointA.time} @ ₹${pointA.price}`);
      console.log(`   AUTHENTIC Point B: ${pointB.time} @ ₹${pointB.price}`);
      console.log(`   Slope: ${slope.toFixed(4)} points/minute`);
      console.log(`   🎯 AUTHENTIC C2 BLOCK INTERNAL PATTERN ANALYSIS COMPLETE`);
      console.log(`   📊 Using C2A (3rd candle) and C2B (4th candle) with 1-minute precision Point A/B`);
      console.log(`   ❌ NO MORE FAKE MINI PATTERN DATA - Full integration with 4 Candle Rule Methodology`);
      
      return {
        timeframe: miniTimeframe,
        type,
        strength,
        pointA,
        pointB,
        slope: Math.round(slope * 10000) / 10000
      };
      
    } catch (error) {
      console.error(`❌ [C2-MINI-ERROR] Failed to get 1-minute data:`, error);
      console.log(`⚠️ [C2-MINI-FALLBACK] Using candle OHLC data instead`);
      return this.analyzeMiniPattern(c2a, c2b, miniTimeframe);
    }
  }
  
  private analyzeConflict(mainPattern: any, miniPattern: any) {
    const isOpposite = mainPattern.type !== miniPattern.type;
    const strengthDiff = Math.abs(mainPattern.strength - miniPattern.strength);
    
    let level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = 'NONE';
    
    if (isOpposite) {
      if (miniPattern.strength > 2.0) level = 'HIGH';
      else if (miniPattern.strength > 1.0) level = 'MEDIUM';
      else level = 'LOW';
    }
    
    return {
      hasResistance: isOpposite,
      level,
      strengthDiff
    };
  }
  
  private generateRecommendation(conflictAnalysis: any) {
    const shouldTrade = !conflictAnalysis.hasResistance || conflictAnalysis.level === 'LOW';
    
    let confidence = 0;
    let positionSize = 'NONE';
    let reason = '';
    
    if (shouldTrade) {
      if (conflictAnalysis.level === 'NONE') {
        confidence = 85;
        positionSize = 'FULL';
        reason = 'Mini pattern aligns with main pattern direction';
      } else if (conflictAnalysis.level === 'LOW') {
        confidence = 60;
        positionSize = 'HALF';
        reason = 'Low internal resistance - proceed with reduced position';
      }
    } else {
      confidence = 25;
      positionSize = 'NONE';
      reason = `${conflictAnalysis.level} internal resistance detected - avoid trading`;
    }
    
    return {
      shouldTrade,
      confidence,
      positionSize,
      reason
    };
  }

  /**
   * 🎯 Extract Point A/B directly from 1-minute candles (fallback method)
   */
  private extractDirectPointAB(candles: CandleData[], type: string) {
    let pointA = { time: '', price: 0 };
    let pointB = { time: '', price: 0 };
    
    if (type === 'UPTREND') {
      // Find lowest point (Point A) and highest point (Point B)
      let lowestPrice = Infinity;
      let highestPrice = -Infinity;
      
      candles.forEach((candle: CandleData) => {
        if (candle.low < lowestPrice) {
          lowestPrice = candle.low;
          pointA = {
            time: new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }),
            price: candle.low
          };
        }
        if (candle.high > highestPrice) {
          highestPrice = candle.high;
          pointB = {
            time: new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }),
            price: candle.high
          };
        }
      });
    } else {
      // Find highest point (Point A) and lowest point (Point B)
      let lowestPrice = Infinity;
      let highestPrice = -Infinity;
      
      candles.forEach((candle: CandleData) => {
        if (candle.high > highestPrice) {
          highestPrice = candle.high;
          pointA = {
            time: new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }),
            price: candle.high
          };
        }
        if (candle.low < lowestPrice) {
          lowestPrice = candle.low;
          pointB = {
            time: new Date(candle.timestamp * 1000).toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit' 
            }),
            price: candle.low
          };
        }
      });
    }
    
    console.log(`📍 [C2-DIRECT-POINTS] Extracted Point A: ${pointA.time} @ ₹${pointA.price} | Point B: ${pointB.time} @ ₹${pointB.price}`);
    return { pointA, pointB };
  }

  /**
   * 🎯 Create main pattern analysis using AUTHENTIC Point A/B from 4 Candle Rule methodology
   */
  private createMainPatternFromAuthenticPoints(
    pattern: string, 
    timeframe: number, 
    authenticPointAB: { pointA: { time: string; price: number }; pointB: { time: string; price: number } },
    candleData: CandleData[]
  ) {
    const type = pattern.includes('UPTREND') ? 'UPTREND' : 'DOWNTREND';
    
    // Calculate strength based on authentic Point A/B
    const priceChange = Math.abs(authenticPointAB.pointB.price - authenticPointAB.pointA.price);
    const strength = Math.round((priceChange / authenticPointAB.pointA.price) * 10000) / 100;
    
    // Calculate slope using authentic Point A/B
    const pointAPrice = authenticPointAB.pointA.price;
    const pointBPrice = authenticPointAB.pointB.price;
    
    // Parse time from authentic timestamps to calculate duration
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      return hour24 * 60 + minutes; // Return minutes from midnight
    };
    
    const pointAMinutes = parseTime(authenticPointAB.pointA.time);
    const pointBMinutes = parseTime(authenticPointAB.pointB.time);
    const timeDifferenceMinutes = Math.abs(pointBMinutes - pointAMinutes);
    
    const slope = timeDifferenceMinutes > 0 ? (pointBPrice - pointAPrice) / timeDifferenceMinutes : 0;
    
    console.log(`✅ [C2-AUTHENTIC] Created main pattern using REAL Point A/B:`);
    console.log(`   Type: ${type} | Strength: ${strength}% | Slope: ${slope.toFixed(4)} pts/min`);
    console.log(`   Authentic Point A: ${authenticPointAB.pointA.time} @ ₹${authenticPointAB.pointA.price}`);
    console.log(`   Authentic Point B: ${authenticPointAB.pointB.time} @ ₹${authenticPointAB.pointB.price}`);
    
    return {
      timeframe,
      type,
      strength,
      pointA: authenticPointAB.pointA,  // Use authentic Point A
      pointB: authenticPointAB.pointB,  // Use authentic Point B
      slope: Math.round(slope * 10000) / 10000
    };
  }
}