// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed
import { C2BlockInternalPatternAnalyzer } from './c2-block-internal-pattern-analyzer';

interface OneMinuteCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandleBlock {
  name: string; // C1A, C1B, C2A, C2B
  startTime: number;
  endTime: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

interface ExactTimestamp {
  candleName: string;
  priceType: 'high' | 'low';
  price: number;
  exactTimestamp: number;
  formattedTime: string;
}

interface SlopeResult {
  pointA: ExactTimestamp;
  pointB: ExactTimestamp;
  priceDiff: number;
  timeDiffMinutes: number;
  slope: number;
  trendType: 'uptrend' | 'downtrend';
  patternName: string;
  breakoutLevel?: number; // For C1B→C2A adjustment: breakout remains at C2A price
  breakoutCandleName?: string; // For C1B→C2A adjustment: breakout remains at C2A candle
  earliestOrderTime: {
    timestamp: number; // Point B + 34% of A→B duration
    formattedTime: string; // Human readable format
    waitMinutes: number; // 34% of A→B duration
  };
  orderTime: {
    timestamp: number; // Point B + 34% of A→B duration (same as earliestOrderTime)
    formattedTime: string; // Human readable format in IST
    calculationFormula: string; // "Point B exact time + 34% of duration"
    waitDuration: number; // 34% of A→B duration in minutes
    pointBTime: string; // Point B exact time for reference
  };
}

export class CorrectedSlopeCalculator {
  private fyersAPI: FyersAPI;
  private c2BlockAnalyzer: C2BlockInternalPatternAnalyzer;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
    this.c2BlockAnalyzer = new C2BlockInternalPatternAnalyzer();
  }

  /**
   * MARKET-AWARE SLOPE CALCULATION
   * Detects market opening time and fetches from 1st candle
   */
  async calculateMarketAwareSlope(
    symbol: string,
    date: string,
    timeframe: number = 5 // Start with 5-minute candles at market open
  ): Promise<{
    marketOpenTime: string;
    totalCandlesAvailable: number;
    note: string;
    candleBlocks: CandleBlock[];
    exactTimestamps: ExactTimestamp[];
    slopes: SlopeResult[];
    predictions?: any;
    summary: string;
    oneMinuteData: OneMinuteCandle[]; // All 1-minute candles for Point A/B methodology
  }> {
    console.log(`🔄 MARKET-AWARE BATTU API: Fetching from 1st candle for ${symbol} on ${date}`);
    
    // Step 1: Fetch full trading day data to detect market opening
    const fullDayCandles = await this.fyersAPI.getHistoricalData({
      symbol,
      resolution: timeframe.toString(),
      date_format: "1",
      range_from: date,
      range_to: date,
      cont_flag: "1"
    });

    if (!fullDayCandles || fullDayCandles.length < 4) {
      throw new Error(`Insufficient data: Only ${fullDayCandles?.length || 0} candles available`);
    }

    // Step 2: Market-aware detection - get first 4 candles from market opening
    const firstFourCandles = fullDayCandles.slice(0, 4);
    
    // Detect market opening time from 1st candle
    const marketOpenTime = new Date(firstFourCandles[0].timestamp * 1000).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    console.log(`📊 MARKET-AWARE: Market opened at ${marketOpenTime} IST - Using first 4 candles from market open`);

    // Continue with regular slope calculation using first 4 candles
    const result = await this.processSpecificCandles(firstFourCandles, symbol, date, timeframe);
    
    return {
      marketOpenTime,
      totalCandlesAvailable: fullDayCandles.length,
      note: `Market-aware system: Using first 4 candles from market opening at ${marketOpenTime} IST`,
      ...result
    };
  }

  /**
   * STEP-BY-STEP CORRECTED SLOPE CALCULATION
   * Following your exact methodology for precise timing
   */
  async calculateCorrectedSlope(
    symbol: string,
    date: string,
    timeframe: number = 10 // 10-minute candles
  ): Promise<{
    candleBlocks: CandleBlock[];
    exactTimestamps: ExactTimestamp[];
    slopes: SlopeResult[];
    predictions?: any;
    summary: string;
    oneMinuteData: OneMinuteCandle[]; // All 1-minute candles for Point A/B methodology
    advancedAnalysis?: any; // Advanced Internal Pattern Analysis
  }> {
    console.log('🔧 Starting CORRECTED Slope Calculation with exact timing methodology...');

    // STEP 1: Get available candles and determine methodology based on candle count
    const allAvailableCandles = await this.getFlexibleMainCandles(symbol, date, timeframe);
    if (allAvailableCandles.length < 4) {
      console.log(`⚠️ LIVE MARKET: Only ${allAvailableCandles.length} candles available - need at least 4 for analysis`);
      return {
        candleBlocks: [],
        exactTimestamps: [],
        slopes: [],
        summary: `Live market has only ${allAvailableCandles.length} candles available - analysis requires minimum 4 candles`,
        oneMinuteData: [],
        advancedAnalysis: undefined
      };
    }
    
    // METHODOLOGY SELECTION: 4 candles = Traditional 4-candle rule, 6+ candles = NEW flexible blocks
    let mainCandles: CandleBlock[];
    let methodology: string;
    
    if (allAvailableCandles.length <= 4) {
      console.log(`📊 STEP 1: TRADITIONAL 4-CANDLE RULE - Using classic C1A, C1B, C2A, C2B methodology`);
      methodology = "TRADITIONAL_4_CANDLE";
      mainCandles = allAvailableCandles.slice(0, 4).map((candle, i) => ({
        ...candle,
        name: ['C1A', 'C1B', 'C2A', 'C2B'][i]
      }));
    } else if (allAvailableCandles.length <= 6) {  
      console.log(`📊 STEP 1: TRANSITION PHASE - 5th/6th candles detected, using enhanced 4-candle + extension`);
      methodology = "ENHANCED_4_CANDLE";
      mainCandles = allAvailableCandles.slice(0, 6).map((candle, i) => ({
        ...candle,
        name: ['C1A', 'C1B', 'C2A', 'C2B', 'C5', 'C6'][i]
      }));
    } else {
      console.log(`📊 STEP 1: NEW FLEXIBLE BLOCKS - 7+ candles completed, switching to NEW C1/C2/C3 block methodology`);
      methodology = "NEW_FLEXIBLE_BLOCKS";  
      mainCandles = allAvailableCandles;
    }
    
    console.log(`🎯 METHODOLOGY SELECTED: ${methodology} with ${mainCandles.length} available candles`);

    console.log(`📊 ${methodology} ANALYSIS: Processing ${mainCandles.length} candles:`);
    mainCandles.forEach((candle, i) => {
      console.log(`${candle.name}: ${new Date(candle.startTime * 1000).toLocaleTimeString()} - ${new Date(candle.endTime * 1000).toLocaleTimeString()}, High: ${candle.high}, Low: ${candle.low}`);
    });

    // STEP 2: Get COMPLETE 1-minute data for the entire trading day - NO LIMITS!
    const exactTimestamps: ExactTimestamp[] = [];
    
    console.log(`\n🔧 UNLIMITED 1-MINUTE DATA FETCH: Getting ALL available 1-minute data for live market analysis...`);
    console.log(`📊 Date: ${date} - Fetching complete trading session data without any time window restrictions`);
    
    // Get ALL 1-minute candles for the entire trading day - remove all limitations
    const allOneMinuteData = await this.getCompleteOneMinuteDataForDay(symbol, date);
    
    console.log(`🔧 Point A/B Method: Collected ${allOneMinuteData.length} total 1-minute candles for UNLIMITED analysis and exact breakout detection`);
    
    // Now process each main candle block using the complete 1-minute dataset
    for (let i = 0; i < mainCandles.length; i++) {
      const candleBlock = mainCandles[i];
      const candleName = candleBlock.name;
      
      console.log(`\n🔍 STEP 2-${i+1}: Processing ${candleName} from UNLIMITED 1-minute dataset...`);
      const blockStartIST = new Date(candleBlock.startTime * 1000).toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });
      const blockEndIST = new Date(candleBlock.endTime * 1000).toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });
      console.log(`Time window: ${blockStartIST} to ${blockEndIST} - Filtering from ${allOneMinuteData.length} available candles`);
      
      // Filter the complete 1-minute dataset for this specific candle block
      const oneMinuteCandles = allOneMinuteData.filter(candle => 
        candle.timestamp >= candleBlock.startTime && candle.timestamp < candleBlock.endTime
      );

      console.log(`📈 Found ${oneMinuteCandles.length} 1-minute candles in ${candleName} window`);

      // STEP 3: Search for exact timestamps where high/low occurred
      const highTimestamp = this.findExactTimestamp(oneMinuteCandles, candleBlock.high, 'high');
      const lowTimestamp = this.findExactTimestamp(oneMinuteCandles, candleBlock.low, 'low');

      if (highTimestamp) {
        const highTime = new Date(highTimestamp.timestamp * 1000);
        const formattedHighTime = highTime.toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        });
        exactTimestamps.push({
          candleName,
          priceType: 'high',
          price: candleBlock.high,
          exactTimestamp: highTimestamp.timestamp,
          formattedTime: formattedHighTime
        });
        console.log(`🎯 ${candleName} High (${candleBlock.high}) found at: ${formattedHighTime}`);
      }

      if (lowTimestamp) {
        const lowTime = new Date(lowTimestamp.timestamp * 1000);
        const formattedLowTime = lowTime.toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        });
        exactTimestamps.push({
          candleName,
          priceType: 'low',
          price: candleBlock.low,
          exactTimestamp: lowTimestamp.timestamp,
          formattedTime: formattedLowTime
        });
        console.log(`🎯 ${candleName} Low (${candleBlock.low}) found at: ${formattedLowTime}`);
      }
    }

    // STEP 4: Calculate slopes using methodology-specific approach
    const slopes = this.calculateSlopesWithMethodology(exactTimestamps, mainCandles, methodology);

    // STEP 5: Predict 5th and 6th candles using slope trendlines
    let predictions = null;
    try {
      const { CandlePredictor } = await import('./candle-predictor');
      const predictor = new CandlePredictor(this.fyersAPI);
      
      const lastCandleEndTime = Math.max(...mainCandles.map(c => c.endTime));
      predictions = await predictor.predictFifthAndSixthCandles(
        symbol,
        date,
        timeframe,
        slopes.map(slope => ({
          pointA: {
            price: slope.pointA.price,
            timestamp: slope.pointA.exactTimestamp,
            formattedTime: slope.pointA.formattedTime
          },
          pointB: {
            price: slope.pointB.price,
            timestamp: slope.pointB.exactTimestamp,
            formattedTime: slope.pointB.formattedTime
          },
          slope: slope.slope,
          trendType: slope.trendType,
          patternName: slope.patternName
        })),
        lastCandleEndTime
      );
      console.log('✅ STEP 5: Generated predictions for 5th and 6th candles');
    } catch (error) {
      console.warn('⚠️ Could not generate candle predictions:', error);
    }

    // Generate summary
    const summary = this.generateSummary(slopes, predictions);

    console.log(`🔧 Point A/B Method: Collected ${allOneMinuteData.length} total 1-minute candles for exact breakout detection`);
    
    // STEP 6: ADVANCED INTERNAL PATTERN ANALYSIS - Recursive Timeframe Breakdown
    console.log('\n🎯 [ADVANCED-INTERNAL] Starting recursive timeframe breakdown using real 1-minute data...');
    console.log(`🔍 [ADVANCED-INTERNAL] Input data: ${mainCandles.length} main candles, ${allOneMinuteData.length} 1-minute candles, ${timeframe}min timeframe`);
    const advancedAnalysis = this.performRecursiveTimeframeBreakdown(mainCandles, allOneMinuteData, timeframe);
    console.log(`✅ [ADVANCED-INTERNAL] Analysis complete:`, {
      selectedTrend: advancedAnalysis.selectedTrend,
      trendScore: advancedAnalysis.trendScore,
      optimalTimeframe: advancedAnalysis.optimalTimeframe,
      internalPatternsCount: advancedAnalysis.internalPatterns.length
    });
    
    return {
      candleBlocks: mainCandles,
      exactTimestamps,
      slopes,
      predictions,
      summary,
      oneMinuteData: allOneMinuteData,
      advancedAnalysis // Include the recursive analysis
    };
  }

  /**
   * Get the 4 main candles (higher timeframe like 10-minute)
   */
  private async getFlexibleMainCandles(symbol: string, date: string, timeframe: number): Promise<CandleBlock[]> {
    try {
      const historicalData = await this.fyersAPI.getHistoricalData({
        symbol,
        resolution: timeframe.toString(),
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });

      if (!historicalData || historicalData.length < 4) {
        console.log(`⚠️ LIVE MARKET: Only ${historicalData?.length || 0} candles available - need minimum 4 for analysis`);
        return [];
      }

      const availableCandles = historicalData.length;
      console.log(`🔧 [FLEXIBLE STRUCTURE] Working with ${availableCandles} available candles in live market`);
      
      // Flexible naming based on available candles
      const candleNames = ['C1A', 'C1B', 'C1C', 'C1D', 'C2A', 'C2B', 'C3A', 'C3B', 'C4A', 'C4B'];
      
      return historicalData.slice(0, Math.min(availableCandles, 10)).map((candle: any, index: number) => ({
        name: candleNames[index],
        startTime: candle.timestamp,
        endTime: candle.timestamp + (timeframe * 60), // Add timeframe duration in seconds
        high: candle.high,
        low: candle.low,
        open: candle.open,
        close: candle.close
      }));
    } catch (error) {
      console.error('❌ Error fetching 6 main candles:', error);
      throw error;
    }
  }

  /**
   * STEP 2: Get COMPLETE 1-minute data for entire trading day - NO LIMITS!
   * This provides complete live market data for unlimited analysis
   */
  private async getCompleteOneMinuteDataForDay(
    symbol: string, 
    date: string
  ): Promise<OneMinuteCandle[]> {
    try {
      console.log(`🚀 UNLIMITED FETCH: Getting ALL 1-minute data for ${symbol} on ${date}...`);
      
      const oneMinuteData = await this.fyersAPI.getHistoricalData({
        symbol,
        resolution: '1', // 1-minute resolution
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });

      if (!oneMinuteData || oneMinuteData.length === 0) {
        console.warn('⚠️ No 1-minute data received for entire day');
        return [];
      }

      console.log(`📊 SUCCESS: Fetched ${oneMinuteData.length} complete 1-minute candles for entire trading session`);
      console.log(`📈 Data covers: ${new Date(oneMinuteData[0].timestamp * 1000).toLocaleTimeString()} to ${new Date(oneMinuteData[oneMinuteData.length - 1].timestamp * 1000).toLocaleTimeString()}`);
      
      return oneMinuteData.map((candle: any) => ({
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      }));
    } catch (error) {
      console.error('❌ Error fetching complete 1-minute data:', error);
      return [];
    }
  }

  /**
   * LEGACY: Get all 1-minute candles within a specific time window (kept for backward compatibility)
   */
  private async getOneMinuteCandlesInWindow(
    symbol: string, 
    startTime: number, 
    endTime: number
  ): Promise<OneMinuteCandle[]> {
    try {
      // Convert to date strings for API
      const startDate = new Date(startTime * 1000).toISOString().split('T')[0];
      const endDate = new Date(endTime * 1000).toISOString().split('T')[0];

      const oneMinuteData = await this.fyersAPI.getHistoricalData({
        symbol,
        resolution: '1', // 1-minute resolution
        date_format: '1',
        range_from: startDate,
        range_to: endDate,
        cont_flag: '1'
      });

      if (!oneMinuteData || oneMinuteData.length === 0) {
        console.warn('⚠️ No 1-minute data received');
        return [];
      }

      // Filter candles to exact time window
      const filteredCandles = oneMinuteData.filter((candle: any) => 
        candle.timestamp >= startTime && candle.timestamp < endTime
      );

      console.log(`📊 Filtered ${filteredCandles.length} candles within exact time window`);
      return filteredCandles;
    } catch (error) {
      console.error('❌ Error fetching 1-minute candles:', error);
      return [];
    }
  }

  /**
   * STEP 3: Find exact timestamp where a specific price (high/low) occurred
   * Takes the EARLIEST occurrence if multiple matches
   */
  private findExactTimestamp(
    oneMinuteCandles: OneMinuteCandle[], 
    targetPrice: number, 
    priceType: 'high' | 'low'
  ): { timestamp: number; candle: OneMinuteCandle } | null {
    console.log(`🔍 Searching for ${priceType} price ${targetPrice} in ${oneMinuteCandles.length} 1-minute candles...`);

    for (const candle of oneMinuteCandles) {
      const matchPrice = priceType === 'high' ? candle.high : candle.low;
      
      if (Math.abs(matchPrice - targetPrice) < 0.01) { // Allow small floating point differences
        const formattedTime = new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        });
        console.log(`✅ Found ${priceType} ${targetPrice} at ${formattedTime}`);
        return { timestamp: candle.timestamp, candle };
      }
    }

    console.warn(`⚠️ Could not find exact ${priceType} price ${targetPrice} in 1-minute data`);
    return null;
  }

  /**
   * EQUAL SHARE METHOD: Dynamic candle allocation for handling more than 4 candles
   * Rule: NEW C1 BLOCK gets exactly 4 candles (C1A=2, C1B=2)
   * If NEW C2 BLOCK has more than 2 candles, share equally
   */
  private applyEqualShareMethod(allCandleNames: string[]): { c1Block: string[], c2Block: string[] } {
    console.log('🔄 [EQUAL SHARE METHOD] Applying dynamic candle allocation...');
    
    // Separate C1 and C2 candles
    const c1Candles = allCandleNames.filter(name => name.startsWith('C1')).sort();
    const c2Candles = allCandleNames.filter(name => name.startsWith('C2')).sort();
    
    console.log(`📊 Detected candles: C1 candles: ${c1Candles.join(', ')}, C2 candles: ${c2Candles.join(', ')}`);
    
    let newC1Block: string[] = [];
    let newC2Block: string[] = [];
    
    // RULE 1: NEW C1 BLOCK gets exactly 4 candles
    if (c1Candles.length >= 4) {
      // If we have exactly 4 or more C1 candles, take first 4
      newC1Block = c1Candles.slice(0, 4);
      console.log(`✅ NEW C1 BLOCK: Taking first 4 candles from ${c1Candles.length} available: ${newC1Block.join(', ')}`);
      
      // Apply C1A=2, C1B=2 subdivision
      const c1A = newC1Block.slice(0, 2);  // First 2 candles
      const c1B = newC1Block.slice(2, 4);  // Next 2 candles
      console.log(`📋 C1 subdivision: C1A=${c1A.join('+')}, C1B=${c1B.join('+')}`);
    } else if (c1Candles.length > 0) {
      // Take all available C1 candles if less than 4
      newC1Block = c1Candles;
      console.log(`⚠️ NEW C1 BLOCK: Only ${c1Candles.length} C1 candles available, taking all: ${newC1Block.join(', ')}`);
    }
    
    // RULE 2: If NEW C2 BLOCK has more than 2 candles, share equally
    if (c2Candles.length > 2) {
      // Equal sharing for C2 block
      const halfCount = Math.ceil(c2Candles.length / 2);
      newC2Block = c2Candles.slice(0, halfCount);
      console.log(`⚖️ NEW C2 BLOCK: Equal sharing - taking first ${halfCount} candles from ${c2Candles.length} available: ${newC2Block.join(', ')}`);
      
      // Show the subdivision
      if (c2Candles.length % 2 === 0) {
        const c2A = c2Candles.slice(0, c2Candles.length / 2);
        const c2B = c2Candles.slice(c2Candles.length / 2);
        console.log(`📋 C2 equal subdivision: C2A=${c2A.join('+')}, C2B=${c2B.join('+')}`);
      } else {
        const c2A = c2Candles.slice(0, halfCount);
        const c2B = c2Candles.slice(halfCount);
        console.log(`📋 C2 unequal subdivision (odd count): C2A=${c2A.join('+')}, C2B=${c2B.join('+')}`);
      }
    } else {
      // Take all C2 candles if 2 or fewer
      newC2Block = c2Candles;
      console.log(`✅ NEW C2 BLOCK: ${c2Candles.length} candles (≤2), taking all: ${newC2Block.join(', ')}`);
    }
    
    console.log(`🎯 EQUAL SHARE RESULT: NEW C1 BLOCK(${newC1Block.length}): ${newC1Block.join(', ')}, NEW C2 BLOCK(${newC2Block.length}): ${newC2Block.join(', ')}`);
    
    return {
      c1Block: newC1Block,
      c2Block: newC2Block
    };
  }

  /**
   * STEP 5: Calculate slopes using exact timestamps - STEP 1/STEP 2 RULE VALIDATION SYSTEM
   */
  private async calculateFlexibleBlockSlopes(exactTimestamps: ExactTimestamp[], mainCandles: CandleBlock[]): Promise<SlopeResult[]> {
    const slopes: SlopeResult[] = [];

    console.log('🔧 [STEP 1/STEP 2 VALIDATION] Implementing proper block formation rule validation...');
    
    // Auto-detect available candles
    const allCandleNames = Array.from(new Set(exactTimestamps.map(ts => ts.candleName))).sort();
    console.log(`📊 Available candles: ${allCandleNames.join(', ')}`);
    
    // STEP 1 RULE VALIDATION: Try count(C1) = count(C2)
    const step1Result = this.tryStep1BlockFormation(allCandleNames);
    
    let c1Block: string[];
    let c2Block: string[];
    let blockFormationRule: string;
    
    if (step1Result.success) {
      console.log(`✅ STEP 1 RULE APPLIED: count(C1) = count(C2) validation passed`);
      c1Block = step1Result.c1Block;
      c2Block = step1Result.c2Block;
      blockFormationRule = "STEP_1_EQUAL_COUNT";
    } else {
      console.log(`❌ STEP 1 RULE FAILED: ${step1Result.reason}`);
      console.log(`🔄 STEP 2 RULE APPLIED: Using different block formation logic`);
      const step2Result = this.applyStep2BlockFormation(allCandleNames);
      c1Block = step2Result.c1Block;
      c2Block = step2Result.c2Block;
      blockFormationRule = "STEP_2_FALLBACK";
    }
    
    console.log(`🎯 BLOCK FORMATION RULE: ${blockFormationRule}`);
    console.log(`🔧 C1 BLOCK: ${c1Block.join(' + ')} (${c1Block.length} candles)`);
    console.log(`🔧 C2 BLOCK: ${c2Block.join(' + ')} (${c2Block.length} candles)`);

    // C1 BLOCK: Get candles based on equal share allocation
    const c1Lows = exactTimestamps.filter(ts => c1Block.includes(ts.candleName) && ts.priceType === 'low');
    const c1Highs = exactTimestamps.filter(ts => c1Block.includes(ts.candleName) && ts.priceType === 'high');
    
    // C2 BLOCK: Get candles based on equal share allocation
    const c2Lows = exactTimestamps.filter(ts => c2Block.includes(ts.candleName) && ts.priceType === 'low');
    const c2Highs = exactTimestamps.filter(ts => c2Block.includes(ts.candleName) && ts.priceType === 'high');

    console.log(`📈 C1 BLOCK analysis: ${c1Lows.length} lows, ${c1Highs.length} highs from ${c1Block.length} candles`);
    console.log(`📊 C2 BLOCK analysis: ${c2Lows.length} lows, ${c2Highs.length} highs from ${c2Block.length} candles`);

    // UPTREND: Point A = C1 BLOCK lowest point, Point B = C2 BLOCK highest point
    if (c1Lows.length > 0 && c2Highs.length > 0) {
      const pointA = c1Lows.reduce((min, current) => current.price < min.price ? current : min);
      let pointB = c2Highs.reduce((max, current) => current.price > max.price ? current : max);
      let breakoutLevel = pointB; // Default breakout level
      
      // CORRECTED 2-3 PATTERN: C1B → C2B (Point B uses C2B, not C2A)
      if (pointA.candleName === 'C1B' && pointB.candleName === 'C2A') {
        const c2BHighs = exactTimestamps.filter(ts => ts.candleName === 'C2B' && ts.priceType === 'high');
        if (c2BHighs.length > 0) {
          const c2BPoint = c2BHighs.reduce((max, current) => current.price > max.price ? current : max);
          console.log(`🔧 CORRECTED 2-3 PATTERN: C1B→C2B pattern detected - Point B now uses C2B instead of C2A`);
          console.log(`📊 2-3 Pattern corrected: C1B(${pointA.price}) → C2B(${c2BPoint.price}), Breakout level: C2B(${c2BPoint.price})`);
          
          // Use C2B for both slope calculation AND Point B (corrected from C2A)
          const patternName = `2-3_UPTREND_CORRECTED`;
          const slope = this.calculateSlope(pointA, c2BPoint, 'uptrend', patternName);
          slopes.push(slope);
        } else {
          // Fallback to normal calculation if C2B not available
          const patternName = `FLEXIBLE_C1(${c1Block.length})_TO_C2(${c2Block.length})_UPTREND`;
          const slope = this.calculateSlope(pointA, pointB, 'uptrend', patternName);
          slopes.push(slope);
        }
      } else {
        // Normal uptrend calculation with DYNAMIC pattern naming
        console.log(`🎯 UPTREND: Point A = C1 BLOCK low ${pointA.price} (${pointA.candleName}), Point B = C2 BLOCK high ${pointB.price} (${pointB.candleName})`);
        
        // DYNAMIC PATTERN NAMING: Based on actual Point A and Point B candle positions
        const patternName = this.getDynamicPatternName(pointA.candleName, pointB.candleName, 'uptrend');
        console.log(`📊 Dynamic Pattern Name: ${patternName} (Point A: ${pointA.candleName} → Point B: ${pointB.candleName})`);
        
        const slope = this.calculateSlope(pointA, pointB, 'uptrend', patternName);
        slopes.push(slope);
      }
    }

    // DOWNTREND: Point A = C1 BLOCK highest point, Point B = C2 BLOCK lowest point
    if (c1Highs.length > 0 && c2Lows.length > 0) {
      const pointA = c1Highs.reduce((max, current) => current.price > max.price ? current : max);
      let pointB = c2Lows.reduce((min, current) => current.price < min.price ? current : min);
      let breakoutLevel = pointB; // Default breakout level
      
      // CORRECTED 2-3 PATTERN: C1B → C2B (Point B uses C2B, not C2A)
      if (pointA.candleName === 'C1B' && pointB.candleName === 'C2A') {
        const c2BLows = exactTimestamps.filter(ts => ts.candleName === 'C2B' && ts.priceType === 'low');
        if (c2BLows.length > 0) {
          const c2BPoint = c2BLows.reduce((min, current) => current.price < min.price ? current : min);
          console.log(`🔧 CORRECTED 2-3 PATTERN: C1B→C2B downtrend pattern detected - Point B now uses C2B instead of C2A`);
          console.log(`📊 2-3 Pattern corrected: C1B(${pointA.price}) → C2B(${c2BPoint.price}), Breakout level: C2B(${c2BPoint.price})`);
          
          // Use C2B for both slope calculation AND Point B (corrected from C2A)
          const patternName = `2-3_DOWNTREND_CORRECTED`;
          const slope = this.calculateSlope(pointA, c2BPoint, 'downtrend', patternName);
          slopes.push(slope);
        } else {
          // Fallback to normal calculation if C2B not available
          const patternName = `FLEXIBLE_C1(${c1Block.length})_TO_C2(${c2Block.length})_DOWNTREND`;
          const slope = this.calculateSlope(pointA, pointB, 'downtrend', patternName);
          slopes.push(slope);
        }
      } else {
        // Normal downtrend calculation with DYNAMIC pattern naming
        console.log(`🎯 DOWNTREND: Point A = C1 BLOCK high ${pointA.price} (${pointA.candleName}), Point B = C2 BLOCK low ${pointB.price} (${pointB.candleName})`);
        
        // DYNAMIC PATTERN NAMING: Based on actual Point A and Point B candle positions
        const patternName = this.getDynamicPatternName(pointA.candleName, pointB.candleName, 'downtrend');
        console.log(`📊 Dynamic Pattern Name: ${patternName} (Point A: ${pointA.candleName} → Point B: ${pointB.candleName})`);
        
        const slope = this.calculateSlope(pointA, pointB, 'downtrend', patternName);
        slopes.push(slope);
      }
    }

    console.log(`✅ ${blockFormationRule} methodology complete: Generated ${slopes.length} slope patterns using C1(${c1Block.length}) and C2(${c2Block.length}) blocks`);
    
    // 🔬 C2 BLOCK INTERNAL PATTERN ANALYSIS - SYNCHRONIZED with Point A/B Analysis
    await this.performC2BlockInternalAnalysis(slopes, exactTimestamps, mainCandles);
    
    return slopes;
  }

  /**
   * STEP 1 RULE: Try count(C1) = count(C2) validation
   */
  private tryStep1BlockFormation(allCandleNames: string[]): {
    success: boolean;
    reason: string;
    c1Block: string[];
    c2Block: string[];
  } {
    const totalCandles = allCandleNames.length;
    
    // STEP 1 RULE: Try equal division of available candles
    if (totalCandles < 4) {
      return {
        success: false,
        reason: `Need minimum 4 candles for Step 1 rule, got ${totalCandles}`,
        c1Block: [],
        c2Block: []
      };
    }
    
    // Try equal count division
    const halfCount = Math.floor(totalCandles / 2);
    const c1Block = allCandleNames.slice(0, halfCount);
    const c2Block = allCandleNames.slice(halfCount, halfCount * 2);
    
    // STEP 1 VALIDATION: count(C1) MUST equal count(C2)
    if (c1Block.length === c2Block.length) {
      console.log(`✅ STEP 1 VALIDATION PASSED: count(C1)=${c1Block.length} == count(C2)=${c2Block.length}`);
      return {
        success: true,
        reason: `Step 1 rule satisfied: equal count validation passed`,
        c1Block,
        c2Block
      };
    } else {
      return {
        success: false,
        reason: `Step 1 rule failed: count(C1)=${c1Block.length} != count(C2)=${c2Block.length}`,
        c1Block: [],
        c2Block: []
      };
    }
  }

  /**
   * STEP 2 RULE: Fallback block formation when Step 1 fails
   */
  private applyStep2BlockFormation(allCandleNames: string[]): {
    c1Block: string[];
    c2Block: string[];
  } {
    console.log(`🔄 STEP 2 RULE: Applying fallback block formation logic`);
    
    // STEP 2 LOGIC: Use equal share method as fallback
    return this.applyEqualShareMethod(allCandleNames);
  }

  /**
   * DYNAMIC PATTERN NAMING: Calculate pattern name based on actual Point A and Point B candle positions
   */
  public getDynamicPatternName(pointACandleName: string, pointBCandleName: string, trendType: string): string {
    // Map candle names to their numeric positions
    const candleToNumber: { [key: string]: number } = {
      'C1A': 1,  // 1st candle
      'C1B': 2,  // 2nd candle  
      'C1C': 3,  // 3rd candle
      'C1D': 4,  // 4th candle
      'C2A': 3,  // 3rd candle (alternative naming)
      'C2B': 4   // 4th candle (alternative naming)
    };

    const pointANumber = candleToNumber[pointACandleName];
    const pointBNumber = candleToNumber[pointBCandleName];

    if (!pointANumber || !pointBNumber) {
      console.warn(`⚠️ Unknown candle names: ${pointACandleName} → ${pointBCandleName}, using fallback naming`);
      return `UNKNOWN_PATTERN_${trendType.toUpperCase()}`;
    }

    // Generate pattern name: {pointA}-{pointB} Pattern  
    const patternName = `${pointANumber}-${pointBNumber}_PATTERN_${trendType.toUpperCase()}`;
    
    return patternName;
  }

  /**
   * DEPRECATED: Old 4-candle pattern name system - replaced by NEW 6-candle block methodology
   * Determine pattern name based on source candles (1-3, 1-4, 2-3, 2-4)
   */
  private determinePatternName(startCandleName: string, endCandleName: string): string {
    console.log('⚠️ DEPRECATED: Old pattern naming system called - should use NEW 6-candle block methodology');
    const candleMap: { [key: string]: number } = {
      'C1A': 1,
      'C1B': 2,
      'C1C': 3, // NEW: Added C1C (candle 3)
      'C1D': 4, // NEW: Added C1D (candle 4)
      'C2A': 5, // UPDATED: C2A is now candle 5
      'C2B': 6  // UPDATED: C2B is now candle 6
    };
    
    const startNum = candleMap[startCandleName];
    const endNum = candleMap[endCandleName];
    
    return `${startNum}-${endNum}`;
  }

  /**
   * Calculate slopes using methodology-specific approach
   */
  private calculateSlopesWithMethodology(
    exactTimestamps: ExactTimestamp[],
    mainCandles: CandleBlock[],
    methodology: string
  ): SlopeResult[] {
    console.log(`🔧 [${methodology}] Calculating slopes using selected methodology...`);
    
    if (methodology === "TRADITIONAL_4_CANDLE") {
      return this.calculateTraditional4CandleSlopes(exactTimestamps, mainCandles);
    } else if (methodology === "ENHANCED_4_CANDLE") {
      return this.calculateEnhanced4CandleSlopes(exactTimestamps, mainCandles);
    } else {
      return this.calculateFlexibleBlockSlopes(exactTimestamps, mainCandles);
    }
  }

  /**
   * Calculate slopes using traditional 4-candle rule (C1A, C1B, C2A, C2B)
   */
  private calculateTraditional4CandleSlopes(
    exactTimestamps: ExactTimestamp[],
    mainCandles: CandleBlock[]
  ): SlopeResult[] {
    console.log(`🔧 [TRADITIONAL 4-CANDLE] Using classic C1A→C1B→C2A→C2B slope calculation`);
    
    const slopes: SlopeResult[] = [];
    
    // Find Point A (lowest low in C1 block) and Point B (highest high in C2 block) for uptrend
    const c1Lows = exactTimestamps.filter(ts => 
      ['C1A', 'C1B'].includes(ts.candleName) && ts.priceType === 'low'
    );
    const c2Highs = exactTimestamps.filter(ts => 
      ['C2A', 'C2B'].includes(ts.candleName) && ts.priceType === 'high'
    );
    
    if (c1Lows.length > 0 && c2Highs.length > 0) {
      const pointA = c1Lows.reduce((min, current) => 
        current.price < min.price ? current : min
      );
      let pointB = c2Highs.reduce((max, current) => 
        current.price > max.price ? current : max
      );
      
      // C1B to C2A adjustment rule: if Point A is C1B and Point B is C2A, adjust slope to use C2B
      if (pointA.candleName === 'C1B' && pointB.candleName === 'C2A') {
        const c2bHigh = exactTimestamps.find(ts => ts.candleName === 'C2B' && ts.priceType === 'high');
        if (c2bHigh) {
          console.log(`🔧 SPECIAL RULE: C1B→C2A pattern detected - slope adjusted to C2B but breakout level remains C2A`);
          const adjustedPointB = { ...c2bHigh };
          const slope = this.calculateSlope(pointA, adjustedPointB, 'uptrend', `TRADITIONAL_C1B_TO_C2A_ADJUSTED_UPTREND`);
          // Override the breakout level to remain at C2A
          slope.breakoutLevel = pointB.price;
          slope.breakoutCandleName = pointB.candleName;
          slopes.push(slope);
          console.log(`📈 TRADITIONAL UPTREND (ADJUSTED): Point A (C1B low) → Point B (C2B high for slope, C2A for breakout), Slope: ${slope.slope.toFixed(6)} pts/min`);
        } else {
          // Fallback to normal calculation if C2B not available
          const slope = this.calculateSlope(pointA, pointB, 'uptrend', `TRADITIONAL_C1_TO_C2_UPTREND`);
          slopes.push(slope);
          console.log(`📈 TRADITIONAL UPTREND: Point A (${pointA.candleName} low) → Point B (${pointB.candleName} high), Slope: ${slope.slope.toFixed(6)} pts/min`);
        }
      } else {
        const slope = this.calculateSlope(pointA, pointB, 'uptrend', `TRADITIONAL_C1_TO_C2_UPTREND`);
        slopes.push(slope);
        console.log(`📈 TRADITIONAL UPTREND: Point A (${pointA.candleName} low) → Point B (${pointB.candleName} high), Slope: ${slope.slope.toFixed(6)} pts/min`);
      }
    }
    
    // Find Point A (highest high in C1 block) and Point B (lowest low in C2 block) for downtrend
    const c1Highs = exactTimestamps.filter(ts => 
      ['C1A', 'C1B'].includes(ts.candleName) && ts.priceType === 'high'
    );
    const c2Lows = exactTimestamps.filter(ts => 
      ['C2A', 'C2B'].includes(ts.candleName) && ts.priceType === 'low'
    );
    
    if (c1Highs.length > 0 && c2Lows.length > 0) {
      const pointA = c1Highs.reduce((max, current) => 
        current.price > max.price ? current : max
      );
      let pointB = c2Lows.reduce((min, current) => 
        current.price < min.price ? current : min
      );
      
      // C1B to C2A adjustment rule: if Point A is C1B and Point B is C2A, adjust slope to use C2B
      if (pointA.candleName === 'C1B' && pointB.candleName === 'C2A') {
        const c2bLow = exactTimestamps.find(ts => ts.candleName === 'C2B' && ts.priceType === 'low');
        if (c2bLow) {
          console.log(`🔧 SPECIAL RULE: C1B→C2A pattern detected - slope adjusted to C2B but breakout level remains C2A`);
          const adjustedPointB = { ...c2bLow };
          const slope = this.calculateSlope(pointA, adjustedPointB, 'downtrend', `TRADITIONAL_C1B_TO_C2A_ADJUSTED_DOWNTREND`);
          // Override the breakout level to remain at C2A
          slope.breakoutLevel = pointB.price;
          slope.breakoutCandleName = pointB.candleName;
          slopes.push(slope);
          console.log(`📉 TRADITIONAL DOWNTREND (ADJUSTED): Point A (C1B high) → Point B (C2B low for slope, C2A for breakout), Slope: ${slope.slope.toFixed(6)} pts/min`);
        } else {
          // Fallback to normal calculation if C2B not available
          const slope = this.calculateSlope(pointA, pointB, 'downtrend', `TRADITIONAL_C1_TO_C2_DOWNTREND`);
          slopes.push(slope);
          console.log(`📉 TRADITIONAL DOWNTREND: Point A (${pointA.candleName} high) → Point B (${pointB.candleName} low), Slope: ${slope.slope.toFixed(6)} pts/min`);
        }
      } else {
        const slope = this.calculateSlope(pointA, pointB, 'downtrend', `TRADITIONAL_C1_TO_C2_DOWNTREND`);
        slopes.push(slope);
        console.log(`📉 TRADITIONAL DOWNTREND: Point A (${pointA.candleName} high) → Point B (${pointB.candleName} low), Slope: ${slope.slope.toFixed(6)} pts/min`);
      }
    }
    
    return slopes;
  }

  /**
   * Helper method to process specific candles with slope calculation
   */
  private async processSpecificCandles(
    candles: any[],
    symbol: string,
    date: string,
    timeframe: number
  ): Promise<{
    candleBlocks: CandleBlock[];
    exactTimestamps: ExactTimestamp[];
    slopes: SlopeResult[];
    predictions?: any;
    summary: string;
    oneMinuteData: OneMinuteCandle[];
  }> {
    console.log(`🔄 Processing ${candles.length} specific candles for market-aware analysis`);
    
    // Step 1: Create candle blocks
    const candleBlocks: CandleBlock[] = [
      {
        name: 'C1A',
        startTime: candles[0].timestamp,
        endTime: candles[0].timestamp + (timeframe * 60),
        high: candles[0].high,
        low: candles[0].low,
        open: candles[0].open,
        close: candles[0].close
      },
      {
        name: 'C1B', 
        startTime: candles[1].timestamp,
        endTime: candles[1].timestamp + (timeframe * 60),
        high: candles[1].high,
        low: candles[1].low,
        open: candles[1].open,
        close: candles[1].close
      },
      {
        name: 'C2A',
        startTime: candles[2].timestamp,
        endTime: candles[2].timestamp + (timeframe * 60),
        high: candles[2].high,
        low: candles[2].low,
        open: candles[2].open,
        close: candles[2].close
      },
      {
        name: 'C2B',
        startTime: candles[3].timestamp,
        endTime: candles[3].timestamp + (timeframe * 60),
        high: candles[3].high,
        low: candles[3].low,
        open: candles[3].close,
        close: candles[3].close
      }
    ];

    // Step 2: Fetch 1-minute data for exact timing
    const oneMinuteData = await this.fyersAPI.getHistoricalData({
      symbol,
      resolution: '1',
      date_format: "1",
      range_from: date,
      range_to: date,
      cont_flag: "1"
    });

    // Step 3: Find exact timestamps
    const exactTimestamps = this.findExactTimestamps(candleBlocks, oneMinuteData);

    // Step 4: Calculate slopes
    const slopes = await this.calculateFlexibleBlockSlopes(exactTimestamps, candleBlocks);

    const summary = `Market-aware analysis complete: ${slopes.length} patterns found from ${candles.length} candles`;

    return {
      candleBlocks,
      exactTimestamps,
      slopes,
      summary,
      oneMinuteData
    };
  }

  /**
   * Calculate slopes using enhanced 4-candle + 5th/6th extension
   */
  private calculateEnhanced4CandleSlopes(
    exactTimestamps: ExactTimestamp[],
    mainCandles: CandleBlock[]
  ): SlopeResult[] {
    console.log(`🔧 [ENHANCED 4-CANDLE] Using 4-candle base + 5th/6th candle extension`);
    
    // Use traditional 4-candle for base, but also include 5th/6th if available
    const baseSlopes = this.calculateTraditional4CandleSlopes(exactTimestamps, mainCandles);
    
    // TODO: Add 5th/6th candle extension logic here
    
    return baseSlopes;
  }

  /**
   * Calculate slope between two exact timestamps
   */
  private calculateSlope(pointA: ExactTimestamp, pointB: ExactTimestamp, trendType: 'uptrend' | 'downtrend', patternName?: string): SlopeResult {
    const priceDiff = pointB.price - pointA.price;
    const timeDiffSeconds = pointB.exactTimestamp - pointA.exactTimestamp;
    const timeDiffMinutes = timeDiffSeconds / 60;
    const slope = priceDiff / timeDiffMinutes;

    // Calculate earliest order placement time (Point B + 34% of A→B duration)
    const waitMinutes = timeDiffMinutes * 0.34; // 34% of A→B duration
    const earliestOrderTimestamp = pointB.exactTimestamp + (waitMinutes * 60); // Add wait time in seconds

    // Format times correctly with IST timezone for console logging
    const formatTimeIST = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });

    console.log(`📈 ${trendType.toUpperCase()} Slope Calculation (Pattern: ${patternName || 'Unknown'}):`);
    console.log(`   Point A (${pointA.candleName} ${pointA.priceType}): ${pointA.price} at ${formatTimeIST(pointA.exactTimestamp)}`);
    console.log(`   Point B (${pointB.candleName} ${pointB.priceType}): ${pointB.price} at ${formatTimeIST(pointB.exactTimestamp)}`);
    console.log(`   Price Difference: ${pointB.price} - ${pointA.price} = ${priceDiff}`);
    console.log(`   Time Difference: ${timeDiffMinutes.toFixed(2)} minutes`);
    console.log(`   Slope: ${priceDiff} / ${timeDiffMinutes.toFixed(2)} = ${slope.toFixed(6)} points/minute`);
    console.log(`   34% Wait Time: ${waitMinutes.toFixed(1)} minutes after Point B`);
    console.log(`   Earliest Order Time: ${formatTimeIST(earliestOrderTimestamp)}`);

    return {
      pointA,
      pointB,
      priceDiff,
      timeDiffMinutes,
      slope,
      trendType,
      patternName: patternName || 'Unknown',
      breakoutLevel: pointB.price, // Default breakout level is Point B price
      breakoutCandleName: pointB.candleName, // Default breakout candle is Point B candle
      earliestOrderTime: {
        timestamp: earliestOrderTimestamp,
        formattedTime: formatTimeIST(earliestOrderTimestamp),
        waitMinutes: waitMinutes
      },
      orderTime: {
        timestamp: earliestOrderTimestamp,
        formattedTime: formatTimeIST(earliestOrderTimestamp),
        calculationFormula: "Point B exact time + 34% of duration",
        waitDuration: waitMinutes,
        pointBTime: formatTimeIST(pointB.exactTimestamp)
      }
    };
  }

  /**
   * STEP 6: ADVANCED INTERNAL PATTERN ANALYSIS - Recursive Timeframe Breakdown
   * Starting with 80min timeframe (4 candles), the system breaks it down:
   * 80min → 40min → 20min → 10min using real 1-minute data
   */
  private performRecursiveTimeframeBreakdown(
    mainCandles: CandleBlock[], 
    oneMinuteData: OneMinuteCandle[], 
    baseTimeframe: number
  ): any {
    console.log(`🔍 [RECURSIVE-BREAKDOWN] Starting with ${baseTimeframe}min timeframe (${mainCandles.length} candles)`);
    console.log(`📊 [RECURSIVE-BREAKDOWN] Using ${oneMinuteData.length} 1-minute candles for internal analysis`);
    
    const analysis = {
      selectedTrend: 'uptrend',
      trendScore: 0,
      optimalTimeframe: baseTimeframe,
      recommendation: '',
      internalPatterns: [] as any[]
    };
    
    // 1. Analyze base timeframe (e.g., 80min) using original 4 candles
    const basePattern = this.analyzeTimeframePatterns(mainCandles.slice(0, 4), baseTimeframe, '80min Analysis');
    analysis.internalPatterns.push({
      timeframe: baseTimeframe,
      patterns: basePattern
    });
    
    // 2. Extract C2 block (candles 3&4) and create 40min breakdown
    if (baseTimeframe >= 20 && oneMinuteData.length >= 160) {
      const halfTimeframe = baseTimeframe / 2;
      console.log(`🔄 [RECURSIVE-BREAKDOWN] Breaking down C2 block into ${halfTimeframe}min candles...`);
      
      // Extract C2 block's 1-minute data (last half of the timeframe)
      const c2StartMinute = Math.floor(oneMinuteData.length / 2);
      const c2OneMinuteData = oneMinuteData.slice(c2StartMinute, c2StartMinute + Math.floor(oneMinuteData.length / 2));
      
      if (c2OneMinuteData.length >= halfTimeframe * 4) {
        const halfCandles = this.createCandlesFromOneMinute(c2OneMinuteData, halfTimeframe);
        if (halfCandles.length >= 4) {
          const halfPattern = this.analyzeTimeframePatterns(halfCandles.slice(0, 4), halfTimeframe, `${halfTimeframe}min Analysis`);
          analysis.internalPatterns.push({
            timeframe: halfTimeframe,
            patterns: halfPattern
          });
          
          // 3. Extract C2 block of 40min and create 20min breakdown
          if (halfTimeframe >= 20) {
            const quarterTimeframe = halfTimeframe / 2;
            console.log(`🔄 [RECURSIVE-BREAKDOWN] Breaking down C2 of ${halfTimeframe}min into ${quarterTimeframe}min candles...`);
            
            const c2Of40Start = Math.floor(c2OneMinuteData.length / 2);
            const c2Of40OneMinute = c2OneMinuteData.slice(c2Of40Start, c2Of40Start + Math.floor(c2OneMinuteData.length / 2));
            
            if (c2Of40OneMinute.length >= quarterTimeframe * 4) {
              const quarterCandles = this.createCandlesFromOneMinute(c2Of40OneMinute, quarterTimeframe);
              if (quarterCandles.length >= 4) {
                const quarterPattern = this.analyzeTimeframePatterns(quarterCandles.slice(0, 4), quarterTimeframe, `${quarterTimeframe}min Analysis`);
                analysis.internalPatterns.push({
                  timeframe: quarterTimeframe,
                  patterns: quarterPattern
                });
              }
            }
          }
        }
      }
    }
    
    // Calculate strongest trend and recommendation
    let uptrendTotal = 0;
    let downtrendTotal = 0;
    
    analysis.internalPatterns.forEach(pattern => {
      uptrendTotal += pattern.patterns.uptrend.score;
      downtrendTotal += pattern.patterns.downtrend.score;
    });
    
    if (uptrendTotal > downtrendTotal) {
      analysis.selectedTrend = 'uptrend';
      analysis.trendScore = uptrendTotal;
      analysis.recommendation = `Strong uptrend signal (${analysis.internalPatterns[0]?.patterns.uptrend.pattern}) at ${baseTimeframe}min - High confidence entry`;
    } else {
      analysis.selectedTrend = 'downtrend';  
      analysis.trendScore = downtrendTotal;
      analysis.recommendation = `Strong downtrend signal (${analysis.internalPatterns[0]?.patterns.downtrend.pattern}) at ${baseTimeframe}min - High confidence entry`;
    }
    
    console.log(`🎯 [RECURSIVE-BREAKDOWN] Analysis complete: ${analysis.selectedTrend.toUpperCase()} stronger (${analysis.trendScore})`);
    console.log(`📊 [RECURSIVE-BREAKDOWN] Analyzed ${analysis.internalPatterns.length} timeframes: ${analysis.internalPatterns.map(p => p.timeframe + 'min').join(' → ')}`);
    
    return analysis;
  }
  
  /**
   * Analyze patterns in a specific timeframe using real OHLC data
   */
  private analyzeTimeframePatterns(candles: CandleBlock[], timeframe: number, label: string): any {
    console.log(`🔍 [PATTERN-ANALYSIS] ${label}: Analyzing ${candles.length} candles`);
    
    // Pattern scoring based on hierarchy: 1-3 > 2-4 > 1-4 > 2-3
    const patternScores = {
      '1-3': 100,
      '2-4': 75,
      '1-4': 50,
      '2-3': 25
    };
    
    // Simple pattern detection based on price movements
    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];
    
    const uptrendScore = lastCandle.high > firstCandle.low ? patternScores['2-4'] : patternScores['2-3'];
    const downtrendScore = firstCandle.high > lastCandle.low ? patternScores['1-4'] : patternScores['2-3'];
    
    const uptrendPattern = uptrendScore === patternScores['2-4'] ? '2-4' : '2-3';
    const downtrendPattern = downtrendScore === patternScores['1-4'] ? '1-4' : '2-3';
    
    console.log(`📊 [PATTERN-ANALYSIS] ${label}: Uptrend ${uptrendPattern} (${uptrendScore}), Downtrend ${downtrendPattern} (${downtrendScore})`);
    
    return {
      uptrend: {
        pattern: uptrendPattern,
        score: uptrendScore
      },
      downtrend: {
        pattern: downtrendPattern,
        score: downtrendScore
      }
    };
  }
  
  /**
   * Create higher timeframe candles from 1-minute data
   */
  private createCandlesFromOneMinute(oneMinuteData: OneMinuteCandle[], targetTimeframe: number): CandleBlock[] {
    const candles: CandleBlock[] = [];
    const candlesPerBlock = targetTimeframe;
    
    for (let i = 0; i < oneMinuteData.length; i += candlesPerBlock) {
      const block = oneMinuteData.slice(i, i + candlesPerBlock);
      if (block.length === candlesPerBlock) {
        const open = block[0].open;
        const close = block[block.length - 1].close;
        const high = Math.max(...block.map(c => c.high));
        const low = Math.min(...block.map(c => c.low));
        
        candles.push({
          name: `C${Math.floor(i / candlesPerBlock) + 1}`,
          startTime: block[0].timestamp,
          endTime: block[block.length - 1].timestamp + 60,
          open,
          high,
          low,
          close
        });
      }
    }
    
    return candles;
  }

  /**
   * Generate summary of the analysis
   */
  private generateSummary(slopes: SlopeResult[], predictions?: any): string {
    let summary = '🔧 CORRECTED SLOPE ANALYSIS SUMMARY\n\n';
    
    slopes.forEach((slope, i) => {
      summary += `${i + 1}. ${slope.trendType.toUpperCase()} ${slope.patternName}: ${slope.slope.toFixed(4)} points/minute\n`;
      summary += `   From: ${slope.pointA.candleName} ${slope.pointA.priceType} (${slope.pointA.price}) at ${slope.pointA.formattedTime}\n`;
      summary += `   To: ${slope.pointB.candleName} ${slope.pointB.priceType} (${slope.pointB.price}) at ${slope.pointB.formattedTime}\n`;
      summary += `   Duration: ${slope.timeDiffMinutes.toFixed(2)} minutes\n\n`;
    });

    if (slopes.length === 2) {
      const uptrend = slopes.find(s => s.trendType === 'uptrend');
      const downtrend = slopes.find(s => s.trendType === 'downtrend');
      
      if (uptrend && downtrend) {
        const ratio = Math.abs(downtrend.slope / uptrend.slope);
        summary += `📊 TREND STRENGTH RATIO: ${ratio.toFixed(2)}x stronger ${ratio > 1 ? 'bearish' : 'bullish'} bias\n`;
      }
    }

    // Add 5th and 6th candle predictions if available
    if (predictions) {
      summary += '\n🔮 5TH & 6TH CANDLE PREDICTIONS\n\n';
      if (predictions.fifthCandle) {
        const pred = predictions.fifthCandle;
        summary += `5th Candle: O:${pred.predictedOpen} H:${pred.predictedHigh} L:${pred.predictedLow} C:${pred.predictedClose} (${pred.confidence}% confidence)\n`;
        summary += `Based on: ${pred.basedOnTrend} ${pred.patternName}\n\n`;
      }
      if (predictions.sixthCandle) {
        const pred = predictions.sixthCandle;
        summary += `6th Candle: O:${pred.predictedOpen} H:${pred.predictedHigh} L:${pred.predictedLow} C:${pred.predictedClose} (${pred.confidence}% confidence)\n`;
        summary += `Based on: ${pred.basedOnTrend} ${pred.patternName}\n\n`;
      }
      summary += `Methodology: ${predictions.methodology}\n`;
    }

    return summary;
  }

  /**
   * 🔬 C2 BLOCK INTERNAL PATTERN ANALYSIS - SYNCHRONIZED with Point A/B Analysis
   * Performs deep analysis on C2 block (3rd and 4th candles) to detect internal resistance
   */
  private async performC2BlockInternalAnalysis(
    slopes: SlopeResult[], 
    exactTimestamps: ExactTimestamp[], 
    mainCandles: CandleBlock[]
  ) {
    try {
      if (slopes.length === 0) {
        console.log('⚠️ [C2-INTERNAL] No slopes available for C2 block analysis');
        return;
      }

      console.log('🔬 [C2-INTERNAL] Starting C2 Block Internal Pattern Analysis...');
      
      // Get the main pattern from the best slope
      const mainSlope = slopes[0]; // Primary pattern
      const mainPattern = mainSlope.patternName;
      
      // Extract Point A and Point B from main analysis
      const mainPointA = {
        time: mainSlope.pointA.exactTimestamp,
        price: mainSlope.pointA.price,
        candleBlock: mainSlope.pointA.candleName
      };
      
      const mainPointB = {
        time: mainSlope.pointB.exactTimestamp,
        price: mainSlope.pointB.price,
        candleBlock: mainSlope.pointB.candleName
      };
      
      console.log(`🎯 [C2-INTERNAL] SYNCHRONIZED: Main Pattern = ${mainPattern}`);
      console.log(`   Point A: ${mainPointA.candleBlock} @ ${mainPointA.price} (${new Date(mainPointA.time * 1000).toLocaleTimeString()})`);
      console.log(`   Point B: ${mainPointB.candleBlock} @ ${mainPointB.price} (${new Date(mainPointB.time * 1000).toLocaleTimeString()})`);

      // Find C2 block candles (3rd and 4th candles)
      const c2aCandleBlock = mainCandles.find(c => c.name === 'C2A');
      const c2bCandleBlock = mainCandles.find(c => c.name === 'C2B');
      
      if (!c2aCandleBlock || !c2bCandleBlock) {
        console.log('⚠️ [C2-INTERNAL] C2A or C2B candle blocks not found, skipping analysis');
        return;
      }

      // Convert candle blocks to CandleData format for C2 block analyzer
      const c2a = {
        timestamp: c2aCandleBlock.startTime,
        open: c2aCandleBlock.open,
        high: c2aCandleBlock.high,
        low: c2aCandleBlock.low,
        close: c2aCandleBlock.close,
        volume: 0 // Volume not available in CandleBlock
      };
      
      const c2b = {
        timestamp: c2bCandleBlock.startTime,
        open: c2bCandleBlock.open,
        high: c2bCandleBlock.high,
        low: c2bCandleBlock.low,
        close: c2bCandleBlock.close,
        volume: 0
      };
      
      // We also need C1A and C1B for the analyzer
      const c1aCandleBlock = mainCandles.find(c => c.name === 'C1A');
      const c1bCandleBlock = mainCandles.find(c => c.name === 'C1B');
      
      if (!c1aCandleBlock || !c1bCandleBlock) {
        console.log('⚠️ [C2-INTERNAL] C1A or C1B candle blocks not found, skipping analysis');
        return;
      }
      
      const c1a = {
        timestamp: c1aCandleBlock.startTime,
        open: c1aCandleBlock.open,
        high: c1aCandleBlock.high,
        low: c1aCandleBlock.low,
        close: c1aCandleBlock.close,
        volume: 0
      };
      
      const c1b = {
        timestamp: c1bCandleBlock.startTime,
        open: c1bCandleBlock.open,
        high: c1bCandleBlock.high,
        low: c1bCandleBlock.low,
        close: c1bCandleBlock.close,
        volume: 0
      };

      // C2 Block Internal Pattern Analysis - INTEGRATED with Point A/B Analysis
      console.log('🔬 [C2-AUTHENTIC] Analyzing C2 block using REAL Point A/B from 4 Candle Rule methodology');
      console.log(`   Main Pattern: ${mainPattern}`);
      console.log(`   🎯 AUTHENTIC Point A: ${mainPointA.candleBlock} @ ₹${mainPointA.price} (${new Date(mainPointA.time * 1000).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' })})`);
      console.log(`   🎯 AUTHENTIC Point B: ${mainPointB.candleBlock} @ ₹${mainPointB.price} (${new Date(mainPointB.time * 1000).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' })})`);
      console.log(`   ❌ NO MORE FAKE TIMESTAMPS: Using exact Point A/B from 1-minute data analysis`);
      
      // Calculate C2 block specific analysis using authentic Point A/B
      const c2BlockAnalysis = this.analyzeC2BlockWithAuthenticPoints(
        mainPointA, mainPointB, c2aCandleBlock, c2bCandleBlock, mainPattern
      );

      // Add C2 block analysis to main slope result
      if (mainSlope && c2BlockAnalysis) {
        (mainSlope as any).c2BlockAnalysis = c2BlockAnalysis;
        console.log(`✅ [C2-INTEGRATED] Analysis integrated with main Point A/B result`);
        console.log(`   ${c2BlockAnalysis.type} pattern detected in C2 block`);
        console.log(`   Internal resistance: ${c2BlockAnalysis.internalResistance ? 'YES' : 'NO'}`);
        console.log(`   Confidence: ${c2BlockAnalysis.confidence}%`);
      }
      
    } catch (error) {
      console.error('❌ [C2-INTERNAL] C2 Block analysis error:', error);
    }
  }

  /**
   * 🔬 C2 Block Analysis INTEGRATED with Point A/B Analysis (4 Candle Rule Methodology)
   * Uses AUTHENTIC Point A/B coordinates to analyze C2 block (3rd and 4th candles)
   */
  private analyzeC2BlockWithAuthenticPoints(
    pointA: { time: number; price: number; candleBlock: string },
    pointB: { time: number; price: number; candleBlock: string },
    c2a: CandleBlock,
    c2b: CandleBlock,
    mainPattern: string
  ) {
    try {
      console.log('🔬 [C2-AUTHENTIC] Starting C2 block analysis with real Point A/B');
      
      // Determine if Point A or B falls within C2 block
      const c2aStart = c2a.startTime;
      const c2aEnd = c2a.endTime;
      const c2bStart = c2b.startTime;
      const c2bEnd = c2b.endTime;
      
      const pointAInC2 = (pointA.time >= c2aStart && pointA.time <= c2bEnd);
      const pointBInC2 = (pointB.time >= c2aStart && pointB.time <= c2bEnd);
      
      console.log(`🎯 [C2-AUTHENTIC] Point A in C2 block: ${pointAInC2}`);
      console.log(`🎯 [C2-AUTHENTIC] Point B in C2 block: ${pointBInC2}`);
      
      // Analyze C2 block patterns based on authentic Point A/B
      let c2Pattern = 'NEUTRAL';
      let internalResistance = false;
      let confidence = 70;
      
      if (pointAInC2 && pointBInC2) {
        // Both points in C2 block - strong internal pattern
        if (pointB.price > pointA.price) {
          c2Pattern = 'UPTREND';
          confidence = 90;
        } else {
          c2Pattern = 'DOWNTREND';
          confidence = 90;
        }
        console.log(`🎯 [C2-AUTHENTIC] Both points in C2 - Strong ${c2Pattern} pattern`);
      } else if (pointAInC2 || pointBInC2) {
        // One point in C2 block - moderate internal pattern
        if (pointBInC2) {
          // Point B in C2 - trend continuation pattern
          c2Pattern = mainPattern.includes('UPTREND') ? 'UPTREND' : 'DOWNTREND';
          confidence = 80;
        } else if (pointAInC2) {
          // Point A in C2 - trend initiation pattern
          c2Pattern = mainPattern.includes('UPTREND') ? 'UPTREND' : 'DOWNTREND';
          confidence = 75;
        }
        console.log(`🎯 [C2-AUTHENTIC] One point in C2 - ${c2Pattern} pattern (${confidence}% confidence)`);
      } else {
        // No points in C2 block - analyze C2 candles directly
        const c2Trend = c2b.close > c2a.open ? 'UPTREND' : 'DOWNTREND';
        c2Pattern = c2Trend;
        confidence = 60;
        console.log(`🎯 [C2-AUTHENTIC] No points in C2 - Direct analysis: ${c2Pattern}`);
      }
      
      // Check for internal resistance
      if (c2Pattern !== mainPattern.replace(/.*_/, '').toUpperCase()) {
        internalResistance = true;
        confidence -= 20;
        console.log(`⚠️ [C2-AUTHENTIC] Internal resistance detected: C2=${c2Pattern} vs Main=${mainPattern}`);
      }
      
      // Generate pattern labels (1-3, 1-4, 2-3, 2-4)
      const patternLabel = this.generateC2PatternLabel(pointA, pointB, c2a, c2b);
      
      return {
        type: c2Pattern,
        patternLabel,
        confidence,
        internalResistance,
        pointAInC2,
        pointBInC2,
        authenticPointA: {
          time: new Date(pointA.time * 1000).toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Kolkata', 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          price: pointA.price,
          candleBlock: pointA.candleBlock
        },
        authenticPointB: {
          time: new Date(pointB.time * 1000).toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Kolkata', 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          price: pointB.price,
          candleBlock: pointB.candleBlock
        },
        c2BlockRange: {
          start: new Date(c2aStart * 1000).toLocaleTimeString(),
          end: new Date(c2bEnd * 1000).toLocaleTimeString()
        }
      };
      
    } catch (error) {
      console.error('❌ [C2-AUTHENTIC] Error in C2 block analysis:', error);
      return null;
    }
  }

  /**
   * Generate pattern labels for C2 block analysis (1-3, 1-4, 2-3, 2-4)
   */
  private generateC2PatternLabel(
    pointA: { time: number; candleBlock: string },
    pointB: { time: number; candleBlock: string },
    c2a: CandleBlock,
    c2b: CandleBlock
  ): string {
    // Map candle blocks to numbers
    const candleMap: { [key: string]: number } = {
      'C1A': 1, 'C1B': 2, 'C2A': 3, 'C2B': 4
    };
    
    const pointACandle = candleMap[pointA.candleBlock] || 1;
    const pointBCandle = candleMap[pointB.candleBlock] || 4;
    
    return `${pointACandle}-${pointBCandle}`;
  }

  /**
   * Process corrected slope calculation with advanced analysis
   */
  async processCorrectedSlopeCalculation(
    symbol: string,
    date: string,
    timeframe: string,
    candles: any[]
  ): Promise<{
    slopes: SlopeResult[];
    oneMinuteData: OneMinuteCandle[];
    candleBlocks: CandleBlock[];
    summary: string;
  }> {
    try {
      console.log(`🔄 Processing corrected slope calculation for ${symbol} on ${date} (${timeframe}min)`);
      
      if (!candles || candles.length < 4) {
        throw new Error(`Insufficient candles: Need at least 4, got ${candles?.length || 0}`);
      }

      // Use the existing market-aware slope calculation
      const result = await this.calculateMarketAwareSlope(symbol, date, parseInt(timeframe));
      
      return {
        slopes: result.slopes,
        oneMinuteData: result.oneMinuteData,
        candleBlocks: result.candleBlocks,
        summary: result.summary
      };
      
    } catch (error) {
      console.error('❌ Error in processCorrectedSlopeCalculation:', error);
      throw error;
    }
  }
}