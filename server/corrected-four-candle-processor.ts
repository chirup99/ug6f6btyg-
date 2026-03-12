// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed
import fs from 'fs/promises';
import path from 'path';

interface OneMinuteCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BlockExtremes {
  high: {
    price: number;
    timestamp: string;
    sourceCandle: string; // C1A, C1B, C2A, or C2B
  };
  low: {
    price: number;
    timestamp: string;
    sourceCandle: string;
  };
}

interface BlockAnalysis {
  C1: BlockExtremes;
  C2: BlockExtremes;
}

interface SlopeAnalysis {
  C1_to_C2_trends: {
    uptrend?: {
      pointA: { price: number; timestamp: string; block: string };
      pointB: { price: number; timestamp: string; block: string };
      slope: number;
      durationMinutes: number;
    };
    downtrend?: {
      pointA: { price: number; timestamp: string; block: string };
      pointB: { price: number; timestamp: string; block: string };
      slope: number;
      durationMinutes: number;
    };
  };
  trendStrengthRatio?: number;
}

export class CorrectedFourCandleProcessor {
  private fyersAPI: FyersAPI;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * CORRECTED METHODOLOGY: Analyze 4-candle block using proper block-level high/low detection
   */
  async analyzeWithCorrectMethodology(
    candles: any[],
    date: string,
    symbol: string
  ): Promise<any> {
    try {
      console.log('🔍 Starting CORRECTED 4-Candle Analysis with proper block methodology...');
      
      if (candles.length < 4) {
        throw new Error('Need at least 4 candles for enhanced analysis');
      }

      // Convert 1-minute candles into 10-minute candles for 4-candle analysis
      console.log(`🔄 Converting ${candles.length} 1-minute candles into 10-minute candles for 4-candle analysis...`);
      
      const tenMinuteCandles = [];
      for (let i = 0; i < Math.min(40, candles.length); i += 10) {
        const group = candles.slice(i, i + 10);
        if (group.length > 0) {
          const combined = {
            timestamp: group[0].timestamp,
            open: group[0].open,
            high: Math.max(...group.map(c => c.high)),
            low: Math.min(...group.map(c => c.low)),
            close: group[group.length - 1].close,
            volume: group.reduce((sum, c) => sum + c.volume, 0)
          };
          tenMinuteCandles.push(combined);
        }
      }
      
      console.log(`✅ Created ${tenMinuteCandles.length} 10-minute candles from 1-minute data`);
      
      if (tenMinuteCandles.length < 4) {
        throw new Error(`Need at least 4 ten-minute candles for analysis, got ${tenMinuteCandles.length}`);
      }

      // CORRECTED BLOCK STRUCTURE:
      // C1 Block: 4 candles (split equally) → C1A (candles 1,2) + C1B (candles 3,4)  
      // C2 Block: 2 candles → C2A (candle 5) + C2B (candle 6)
      
      if (tenMinuteCandles.length < 6) {
        throw new Error(`Need at least 6 ten-minute candles for correct block analysis, got ${tenMinuteCandles.length}`);
      }

      // Take first 6 ten-minute candles for proper block structure
      const sixCandles = tenMinuteCandles.slice(0, 6);
      
      // C1 Block = First 4 candles (split equally into C1A and C1B)
      const C1A_candles = sixCandles.slice(0, 2);  // Candles 1,2
      const C1B_candles = sixCandles.slice(2, 4);  // Candles 3,4
      
      // C2 Block = Next 2 candles  
      const C2A = sixCandles[4];  // Candle 5
      const C2B = sixCandles[5];  // Candle 6

      console.log('📊 CORRECTED Block Structure (6 candles total):', {
        'C1 Block (4 candles)': {
          C1A: `Candles 1,2: ${C1A_candles.map(c => new Date(c.timestamp).toLocaleTimeString()).join(', ')}`,
          C1B: `Candles 3,4: ${C1B_candles.map(c => new Date(c.timestamp).toLocaleTimeString()).join(', ')}`
        },
        'C2 Block (2 candles)': {
          C2A: `Candle 5: ${new Date(C2A.timestamp).toLocaleTimeString()}`,
          C2B: `Candle 6: ${new Date(C2B.timestamp).toLocaleTimeString()}`
        }
      });

      // Step 1: Extract 1-minute data for each block section
      const oneMinuteData = {
        C1A: candles.slice(0, 20),   // First 20 minutes for C1A (candles 1,2)
        C1B: candles.slice(20, 40),  // Next 20 minutes for C1B (candles 3,4)
        C2A: candles.slice(40, 50),  // Next 10 minutes for C2A (candle 5)  
        C2B: candles.slice(50, 60)   // Next 10 minutes for C2B (candle 6)
      };

      console.log(`📊 Extracted 1-minute data for each candle:`, {
        C1A: `${oneMinuteData.C1A.length} candles`,
        C1B: `${oneMinuteData.C1B.length} candles`,
        C2A: `${oneMinuteData.C2A.length} candles`,
        C2B: `${oneMinuteData.C2B.length} candles`
      });

      // Step 2: Apply CORRECT methodology - find block-level highs/lows
      const blockAnalysis = this.findBlockHighsLows(oneMinuteData);

      // Step 3: Calculate slopes between C1 and C2 blocks
      const slopeAnalysis = this.calculateBlockSlopes(blockAnalysis);

      // Step 4: Apply Dual Validation System (50% + 34% Rules)
      const dualValidation = await this.applyDualValidationSystem(symbol, sixCandles, slopeAnalysis);

      // Step 5: Store enhanced data with dual validation
      const filename = `corrected-6candle-${symbol}-${Date.now()}.json`;
      const dataToStore = {
        methodology: 'CORRECTED_6_CANDLE_BLOCK_ANALYSIS_WITH_DUAL_VALIDATION',
        baseCandles: sixCandles,
        blockStructure: {
          C1_Block: { C1A: C1A_candles, C1B: C1B_candles },
          C2_Block: { C2A, C2B }
        },
        oneMinuteData,
        blockAnalysis,
        slopeAnalysis,
        dualValidation,
        analysisTimestamp: new Date().toISOString()
      };
      
      await this.storeEnhancedData(filename, dataToStore);

      console.log('✅ CORRECTED 4-Candle Analysis with Dual Validation Complete');
      console.log('📊 Block Analysis Summary:', {
        C1_High: `${blockAnalysis.C1.high.price} at ${blockAnalysis.C1.high.timestamp}`,
        C1_Low: `${blockAnalysis.C1.low.price} at ${blockAnalysis.C1.low.timestamp}`,
        C2_High: `${blockAnalysis.C2.high.price} at ${blockAnalysis.C2.high.timestamp}`,
        C2_Low: `${blockAnalysis.C2.low.price} at ${blockAnalysis.C2.low.timestamp}`,
        Slopes: slopeAnalysis.C1_to_C2_trends
      });
      
      console.log('🎯 Dual Validation Summary:', {
        rulesApplied: dualValidation.summary.rulesApplied,
        totalDuration: `${dualValidation.summary.total4CandleDuration.toFixed(2)} minutes`,
        validationResults: Object.keys(dualValidation.validationResults).map(trend => ({
          trend,
          canPlaceOrders: dualValidation.validationResults[trend].canPlaceOrders
        }))
      });
      
      return {
        methodology: 'CORRECTED_6_CANDLE_BLOCK_ANALYSIS_WITH_DUAL_VALIDATION',
        sixCandleBlock: sixCandles,
        blockStructure: {
          C1_Block: { C1A: C1A_candles, C1B: C1B_candles },
          C2_Block: { C2A, C2B }
        },
        oneMinuteData,
        blockAnalysis,
        slopeAnalysis,
        dualValidation,
        storedFilename: filename,
        analysisComplete: true
      };

    } catch (error) {
      console.error('❌ CORRECTED 4-Candle Analysis failed:', error);
      throw error;
    }
  }

  /**
   * CORRECTED: Find true high/low for each block by scanning 1-minute data
   */
  private findBlockHighsLows(oneMinuteData: any): BlockAnalysis {
    console.log('🔍 Finding block-level highs/lows using CORRECTED methodology...');

    // Step 1: Find C1 Block extremes (from C1A + C1B combined)
    const C1_extremes = this.findBlockExtremes(['C1A', 'C1B'], {
      C1A: oneMinuteData.C1A,
      C1B: oneMinuteData.C1B
    });

    // Step 2: Find C2 Block extremes (from C2A + C2B combined)
    const C2_extremes = this.findBlockExtremes(['C2A', 'C2B'], {
      C2A: oneMinuteData.C2A,
      C2B: oneMinuteData.C2B
    });

    const result = {
      C1: C1_extremes,
      C2: C2_extremes
    };

    console.log('📊 CORRECTED Block Analysis Results:', {
      C1_High: `${result.C1.high.price} (from ${result.C1.high.sourceCandle} at ${result.C1.high.timestamp})`,
      C1_Low: `${result.C1.low.price} (from ${result.C1.low.sourceCandle} at ${result.C1.low.timestamp})`,
      C2_High: `${result.C2.high.price} (from ${result.C2.high.sourceCandle} at ${result.C2.high.timestamp})`,
      C2_Low: `${result.C2.low.price} (from ${result.C2.low.sourceCandle} at ${result.C2.low.timestamp})`
    });

    return result;
  }

  /**
   * Finds exact breakout timestamp within a candle using 1-minute data scanning
   * Same methodology as Point A and Point B detection
   */
  private async findExactBreakoutTimestampPrivate(
    symbol: string,
    candleStartTime: number,
    candleEndTime: number,
    breakoutLevel: number,
    isUptrend: boolean
  ): Promise<{ broke: boolean; exactTimestamp: number | null; breakoutPrice: number | null }> {
    try {
      console.log(`🔍 Scanning 1-minute data for exact breakout timestamp...`);
      console.log(`📊 Candle window: ${new Date(candleStartTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} to ${new Date(candleEndTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}`);
      console.log(`🎯 Breakout level: ${breakoutLevel} (${isUptrend ? 'UPTREND - looking for high > level' : 'DOWNTREND - looking for low < level'})`);
      
      // Fetch 1-minute data for the candle time window
      const oneMinuteData = await this.fyersAPI.getHistoricalData(
        symbol,
        1, // 1-minute resolution for exact timing
        new Date(candleStartTime * 1000).toISOString().split('T')[0],
        new Date(candleEndTime * 1000).toISOString().split('T')[0]
      );
      
      if (!oneMinuteData || oneMinuteData.length === 0) {
        console.log(`❌ No 1-minute data available for exact breakout detection`);
        return { broke: false, exactTimestamp: null, breakoutPrice: null };
      }
      
      // Filter to exact candle time window
      const candleMinutes = oneMinuteData.filter(candle => 
        candle.timestamp >= candleStartTime && 
        candle.timestamp < candleEndTime
      );
      
      console.log(`📈 Found ${candleMinutes.length} 1-minute candles within the target candle window`);
      
      // Scan each 1-minute candle for exact breakout moment
      for (const minuteCandle of candleMinutes) {
        if (isUptrend) {
          // For uptrend: look for high breaking above breakout level
          if (minuteCandle.high > breakoutLevel) {
            const exactTime = minuteCandle.timestamp * 1000; // Convert to milliseconds
            console.log(`🎯 UPTREND BREAKOUT FOUND! Exact time: ${new Date(exactTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}`);
            console.log(`📊 Breakout details: High ${minuteCandle.high} > Level ${breakoutLevel}`);
            return { 
              broke: true, 
              exactTimestamp: exactTime, 
              breakoutPrice: minuteCandle.high 
            };
          }
        } else {
          // For downtrend: look for low breaking below breakout level
          if (minuteCandle.low < breakoutLevel) {
            const exactTime = minuteCandle.timestamp * 1000; // Convert to milliseconds
            console.log(`🎯 DOWNTREND BREAKOUT FOUND! Exact time: ${new Date(exactTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}`);
            console.log(`📊 Breakout details: Low ${minuteCandle.low} < Level ${breakoutLevel}`);
            return { 
              broke: true, 
              exactTimestamp: exactTime, 
              breakoutPrice: minuteCandle.low 
            };
          }
        }
      }
      
      console.log(`❌ No breakout found within the candle window`);
      return { broke: false, exactTimestamp: null, breakoutPrice: null };
      
    } catch (error) {
      console.log(`⚠️ Error scanning for exact breakout timestamp: ${error}`);
      return { broke: false, exactTimestamp: null, breakoutPrice: null };
    }
  }

  /**
   * Predict 7th and 8th candles after 6th candle completion using extended slope analysis
   */
  async predict7thAnd8thCandles(
    symbol: string,
    date: string,
    timeframe: number,
    slopes: any[],
    sixthCandleEndTime: number
  ): Promise<any> {
    try {
      console.log('🔮 Starting 7th and 8th candle prediction after 6th candle completion...');
      
      if (!slopes || slopes.length === 0) {
        throw new Error('No slope data available for extended predictions');
      }

      // Use the dominant trend for extended predictions
      const dominantTrend = slopes.reduce((strongest, current) => 
        Math.abs(current.slope) > Math.abs(strongest.slope) ? current : strongest
      );

      console.log(`🎯 Using dominant trend for extended predictions: ${dominantTrend.trendType} (slope: ${dominantTrend.slope.toFixed(6)})`);

      // Calculate prediction windows
      const timeframeSeconds = timeframe * 60;
      const seventhCandleStartTime = sixthCandleEndTime;
      const seventhCandleEndTime = seventhCandleStartTime + timeframeSeconds;
      const eighthCandleStartTime = seventhCandleEndTime;
      const eighthCandleEndTime = eighthCandleStartTime + timeframeSeconds;

      // Get Point B timestamp and price for extrapolation
      const pointBTimestamp = dominantTrend.pointB.exactTimestamp;
      const pointBPrice = dominantTrend.pointB.price;
      const slope = dominantTrend.slope; // points per minute

      // Calculate time differences from Point B
      const timeToSeventhMidpoint = (seventhCandleStartTime + (timeframeSeconds / 2) - pointBTimestamp) / 60; // minutes
      const timeToEighthMidpoint = (eighthCandleStartTime + (timeframeSeconds / 2) - pointBTimestamp) / 60; // minutes

      // Calculate predicted prices using linear extrapolation
      const seventhPredictedPrice = pointBPrice + (slope * timeToSeventhMidpoint);
      const eighthPredictedPrice = pointBPrice + (slope * timeToEighthMidpoint);

      // Calculate confidence scores (decreases with distance from analysis window)
      const seventhConfidence = Math.max(0, 95 - (timeToSeventhMidpoint * 0.5));
      const eighthConfidence = Math.max(0, 90 - (timeToEighthMidpoint * 0.5));

      // Generate OHLC predictions with realistic price variation
      const priceVariation = Math.abs(slope) * (timeframe / 10); // Adjusted variation based on slope strength

      const seventhCandle = {
        candleName: '7th',
        timeframe: timeframe,
        startTime: seventhCandleStartTime,
        endTime: seventhCandleEndTime,
        predictedOpen: seventhPredictedPrice - (priceVariation * 0.3),
        predictedHigh: seventhPredictedPrice + priceVariation,
        predictedLow: seventhPredictedPrice - priceVariation,
        predictedClose: seventhPredictedPrice + (priceVariation * 0.2),
        confidence: Math.round(seventhConfidence),
        basedOnTrend: dominantTrend.trendType,
        patternName: dominantTrend.patternName,
        formattedStartTime: new Date(seventhCandleStartTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
        formattedEndTime: new Date(seventhCandleEndTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })
      };

      const eighthCandle = {
        candleName: '8th',
        timeframe: timeframe,
        startTime: eighthCandleStartTime,
        endTime: eighthCandleEndTime,
        predictedOpen: eighthPredictedPrice - (priceVariation * 0.3),
        predictedHigh: eighthPredictedPrice + priceVariation,
        predictedLow: eighthPredictedPrice - priceVariation,
        predictedClose: eighthPredictedPrice + (priceVariation * 0.2),
        confidence: Math.round(eighthConfidence),
        basedOnTrend: dominantTrend.trendType,
        patternName: dominantTrend.patternName,
        formattedStartTime: new Date(eighthCandleStartTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
        formattedEndTime: new Date(eighthCandleEndTime * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })
      };

      console.log(`🔮 7th Candle Prediction: ${seventhCandle.formattedStartTime}-${seventhCandle.formattedEndTime}, Close: ${seventhCandle.predictedClose.toFixed(2)}, Confidence: ${seventhCandle.confidence}%`);
      console.log(`🔮 8th Candle Prediction: ${eighthCandle.formattedStartTime}-${eighthCandle.formattedEndTime}, Close: ${eighthCandle.predictedClose.toFixed(2)}, Confidence: ${eighthCandle.confidence}%`);

      return {
        success: true,
        seventhCandle,
        eighthCandle,
        methodology: `Extended Linear Trendline Prediction from Point B using ${dominantTrend.trendType} slope ${slope.toFixed(6)} points/min`,
        dominantTrend: {
          type: dominantTrend.trendType,
          slope: dominantTrend.slope,
          pattern: dominantTrend.patternName,
          pointB: {
            price: pointBPrice,
            timestamp: pointBTimestamp,
            formattedTime: new Date(pointBTimestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })
          }
        }
      };

    } catch (error) {
      console.error('❌ Error predicting 7th and 8th candles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in extended candle prediction'
      };
    }
  }

  /**
   * Validates real 5th and 6th candle breakout using live market data with exact breakout timestamps
   */
  private async validateRealCandleBreakout(
    symbol: string,
    fourCandles: any[],
    trend: any,
    trendType: string,
    fifthCandleStartTime: number,
    sixthCandleStartTime: number,
    sixthCandleEndTime: number
  ) {
    try {
      const breakoutPrice = trend.pointB.price;
      const isUptrend = trendType === 'uptrend';
      
      // Get current timestamp
      const currentTimestamp = Date.now();
      
      // Initialize validation results with enhanced breakout detection
      const validation = {
        fifthCandle: null as any,
        sixthCandle: null as any,
        fifthCandleBrokeBreakout: false,
        sixthCandleBrokeBreakout: false,
        fifthBreakoutTimestamp: null as number | null,
        sixthBreakoutTimestamp: null as number | null,
        fifthBreakoutPrice: null as number | null,
        sixthBreakoutPrice: null as number | null,
        tradeIsValid: false,
        currentTime: new Date(currentTimestamp).toISOString(),
        breakoutPrice: breakoutPrice,
        trendType: trendType
      };

      // FORCE CHECK: For historical data, always validate candles regardless of current time
      console.log(`🔍 Timestamp Check: Current: ${new Date(currentTimestamp)} vs 5th candle: ${new Date(fifthCandleStartTime * 1000)}`);
      console.log(`🔍 5th candle time analysis: ${currentTimestamp >= fifthCandleStartTime * 1000 ? '✅ Time passed' : '❌ Time not passed'}`);
      
      // For historical analysis (July 25, 2025), force validation
      const isHistoricalData = fifthCandleStartTime < (Date.now() / 1000);
      if (currentTimestamp >= fifthCandleStartTime * 1000 || isHistoricalData) {
        console.log(`🔍 5th candle time reached, fetching real data for breakout validation...`);
        
        // Fetch 5th candle data (10-minute candle starting at fifthCandleStartTime)
        const fifthCandleEndTime = fifthCandleStartTime + (10 * 60); // Add 10 minutes in seconds
        const fifthCandleData = await this.fetchCandleData(symbol, fifthCandleStartTime, fifthCandleEndTime);
        
        if (fifthCandleData) {
          validation.fifthCandle = fifthCandleData;
          
          // Enhanced breakout detection: find exact breakout timestamp within 5th candle
          const fifthBreakoutDetails = await this.findExactBreakoutTimestamp(
            symbol, 
            fifthCandleStartTime, 
            fifthCandleEndTime, 
            breakoutPrice, 
            isUptrend
          );
          
          console.log(`📊 5th candle data: High: ${fifthCandleData.high}, Low: ${fifthCandleData.low}`);
          
          if (fifthBreakoutDetails.broke) {
            validation.fifthCandleBrokeBreakout = true;
            validation.fifthBreakoutTimestamp = fifthBreakoutDetails.exactTimestamp;
            validation.fifthBreakoutPrice = fifthBreakoutDetails.breakoutPrice;
            console.log(`🎯 5th candle BROKE breakout level! Exact timestamp: ${new Date(fifthBreakoutDetails.exactTimestamp!).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}`);
          } else {
            console.log(`❌ 5th candle did NOT break breakout level (${breakoutPrice})`);
          }
        }
      }

      // Check if we're past the 6th candle start time (convert seconds to milliseconds)
      console.log(`🔍 Timestamp Check: Current: ${new Date(currentTimestamp)} vs 6th candle: ${new Date(sixthCandleStartTime * 1000)}`);
      console.log(`🔍 6th candle time analysis: ${currentTimestamp >= sixthCandleStartTime * 1000 ? '✅ Time passed' : '❌ Time not passed'}`);
      
      // For historical analysis (July 25, 2025), force validation
      const isHistoricalData6th = sixthCandleStartTime < (Date.now() / 1000);
      if (currentTimestamp >= sixthCandleStartTime * 1000 || isHistoricalData6th) {
        console.log(`🔍 6th candle time reached, fetching real data for breakout validation...`);
        
        // Fetch 6th candle data (10-minute candle starting at sixthCandleStartTime)
        const sixthCandleData = await this.fetchCandleData(symbol, sixthCandleStartTime, sixthCandleEndTime);
        
        if (sixthCandleData) {
          validation.sixthCandle = sixthCandleData;
          console.log(`📊 6th candle data: High: ${sixthCandleData.high}, Low: ${sixthCandleData.low}`);
          
          // Enhanced breakout detection: find exact breakout timestamp within 6th candle
          const sixthBreakoutDetails = await this.findExactBreakoutTimestamp(
            symbol, 
            sixthCandleStartTime, 
            sixthCandleEndTime, 
            breakoutPrice, 
            isUptrend
          );
          
          if (sixthBreakoutDetails.broke) {
            validation.sixthCandleBrokeBreakout = true;
            validation.sixthBreakoutTimestamp = sixthBreakoutDetails.exactTimestamp;
            validation.sixthBreakoutPrice = sixthBreakoutDetails.breakoutPrice;
            console.log(`🎯 6th candle BROKE breakout level! Exact timestamp: ${new Date(sixthBreakoutDetails.exactTimestamp!).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}`);
          } else {
            console.log(`❌ 6th candle did NOT break breakout level (${breakoutPrice})`);
          }
        }
      }

      // Trade is valid if either 5th or 6th candle broke the breakout level
      // Trade becomes invalid only if we're past 90% of 6th candle close time and neither broke
      const ninetyPercentDeadline = (sixthCandleStartTime + (0.9 * (sixthCandleEndTime - sixthCandleStartTime))) * 1000; // Convert to milliseconds
      
      console.log(`⚠️ Trade Validity Check:
         Current Time: ${new Date(currentTimestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
         90% Deadline: ${new Date(ninetyPercentDeadline).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
         5th Candle Broke: ${validation.fifthCandleBrokeBreakout ? '✅' : '❌'}
         6th Candle Broke: ${validation.sixthCandleBrokeBreakout ? '✅' : '❌'}`);
      
      if (currentTimestamp >= ninetyPercentDeadline) {
        // We're past 90% of the 6th candle close - check if either candle broke
        validation.tradeIsValid = validation.fifthCandleBrokeBreakout || validation.sixthCandleBrokeBreakout;
        console.log(`🚨 Past 90% deadline - Trade Valid: ${validation.tradeIsValid ? '✅' : '❌'}`);
      } else {
        // Still within trading window - trade remains valid
        validation.tradeIsValid = true;
        console.log(`⏳ Still within trading window - Trade Valid: ✅`);
      }

      return validation;
      
    } catch (error) {
      console.error('Error validating real candle breakout:', error);
      return {
        fifthCandle: null,
        sixthCandle: null,
        fifthCandleBrokeBreakout: false,
        sixthCandleBrokeBreakout: false,
        fifthBreakoutTimestamp: null,
        sixthBreakoutTimestamp: null,
        fifthBreakoutPrice: null,
        sixthBreakoutPrice: null,
        tradeIsValid: true, // Default to valid on error
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find exact breakout timestamp using 1-minute data (same methodology as Point A/B)
   */
  async findExactBreakoutTimestamp(
    symbol: string,
    candleStartTime: number,
    candleEndTime: number,
    breakoutPrice: number,
    isUptrend: boolean
  ): Promise<{broke: boolean; exactTimestamp: number | null; breakoutPrice: number | null}> {
    try {
      console.log(`🔍 Finding exact breakout timestamp for ${symbol} in ${isUptrend ? 'uptrend' : 'downtrend'}`);
      console.log(`📊 Candle window: ${new Date(candleStartTime * 1000).toLocaleString()} to ${new Date(candleEndTime * 1000).toLocaleString()}`);
      console.log(`💰 Breakout level: ${breakoutPrice}`);
      
      // Get 1-minute data for the candle time window
      const minuteData = await this.getOneMinuteHistoricalData(symbol, candleStartTime * 1000, candleEndTime * 1000);
      
      if (!minuteData || minuteData.length === 0) {
        console.log('❌ No 1-minute data available for exact breakout detection');
        return { broke: false, exactTimestamp: null, breakoutPrice: null };
      }

      console.log(`📈 Scanning ${minuteData.length} 1-minute candles for breakout...`);
      
      // Scan each 1-minute candle for breakout
      for (let i = 0; i < minuteData.length; i++) {
        const minute = minuteData[i];
        const timeStr = new Date(minute.timestamp * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
        
        if (isUptrend) {
          // For uptrend, check if high breaks above breakout level
          console.log(`  ${i+1}. ${timeStr} - High: ${minute.high} vs Breakout: ${breakoutPrice} (${minute.high > breakoutPrice ? '✅ BROKE' : '❌ No break'})`);
          if (minute.high > breakoutPrice) {
            console.log(`🎯 BREAKOUT DETECTED! Uptrend broke at ${timeStr} with high ${minute.high} > ${breakoutPrice}`);
            return {
              broke: true,
              exactTimestamp: minute.timestamp * 1000, // Convert to milliseconds
              breakoutPrice: minute.high
            };
          }
        } else {
          // For downtrend, check if low breaks below breakout level
          console.log(`  ${i+1}. ${timeStr} - Low: ${minute.low} vs Breakout: ${breakoutPrice} (${minute.low < breakoutPrice ? '✅ BROKE' : '❌ No break'})`);
          if (minute.low < breakoutPrice) {
            console.log(`🎯 BREAKOUT DETECTED! Downtrend broke at ${timeStr} with low ${minute.low} < ${breakoutPrice}`);
            return {
              broke: true,
              exactTimestamp: minute.timestamp * 1000, // Convert to milliseconds
              breakoutPrice: minute.low
            };
          }
        }
      }

      console.log('❌ No breakout detected in any 1-minute candle');
      return { broke: false, exactTimestamp: null, breakoutPrice: null };
      
    } catch (error) {
      console.error('Error finding exact breakout timestamp:', error);
      return { broke: false, exactTimestamp: null, breakoutPrice: null };
    }
  }

  /**
   * Get 1-minute historical data for exact breakout detection within a time window
   */
  private async getOneMinuteHistoricalData(
    symbol: string,
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    try {
      // Convert timestamps to date strings (handle both seconds and milliseconds)
      const startTimeSeconds = startTime > 1e12 ? Math.floor(startTime / 1000) : startTime;
      const endTimeSeconds = endTime > 1e12 ? Math.floor(endTime / 1000) : endTime;
      
      const startDate = new Date(startTimeSeconds * 1000).toISOString().split('T')[0];
      const endDate = new Date(endTimeSeconds * 1000).toISOString().split('T')[0];
      
      console.log(`🔍 Fetching 1-minute data for breakout detection: ${symbol}`);
      console.log(`⏰ Window: ${new Date(startTimeSeconds * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} to ${new Date(endTimeSeconds * 1000).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}`);
      
      // Fetch 1-minute data from Fyers API
      const historicalData = await this.fyersAPI.getHistoricalData(symbol, '1', startDate, endDate);
      
      if (!historicalData || !historicalData.candles) {
        console.log('❌ No 1-minute data available for breakout detection');
        return [];
      }

      // Filter data to exact time window and convert to proper format
      const filtered = historicalData.candles
        .map((candle: any[]) => ({
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        }))
        .filter((candle: any) => candle.timestamp >= startTimeSeconds && candle.timestamp < endTimeSeconds)
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

      console.log(`✅ Found ${filtered.length} 1-minute candles for breakout detection`);
      return filtered;
      
    } catch (error) {
      console.error('Error fetching 1-minute data for breakout detection:', error);
      return [];
    }
  }

  /**
   * Fetches specific candle data for a given time range
   */
  private async fetchCandleData(symbol: string, startTime: number, endTime: number) {
    try {
      // Convert to date strings for Fyers API
      const startDate = new Date(startTime).toISOString().split('T')[0];
      const endDate = new Date(endTime).toISOString().split('T')[0];
      
      // Fetch 1-minute data to construct the specific 10-minute candle
      const fyersApi = (global as any).fyersApi;
      if (!fyersApi) {
        console.warn('Fyers API not available for real candle validation');
        return null;
      }

      // const response = null; // fyersApi.getHistoricalData(symbol, '1', startDate, endDate);
      
      if (response && response.candles && response.candles.length > 0) {
        // Filter candles within our exact time window
        const relevantCandles = response.candles.filter((candle: any[]) => {
          const candleTime = candle[0] * 1000; // Convert to milliseconds
          return candleTime >= startTime && candleTime < endTime;
        });

        if (relevantCandles.length > 0) {
          // Combine all 1-minute candles into a single 10-minute candle
          const open = relevantCandles[0][1];
          const high = Math.max(...relevantCandles.map((c: any[]) => c[2]));
          const low = Math.min(...relevantCandles.map((c: any[]) => c[3]));
          const close = relevantCandles[relevantCandles.length - 1][4];
          const volume = relevantCandles.reduce((sum: number, c: any[]) => sum + c[5], 0);

          return {
            timestamp: startTime,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume,
            formattedTime: new Date(startTime).toLocaleTimeString('en-US', { 
              hour12: true, 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            })
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching candle data:', error);
      return null;
    }
  }

  /**
   * Find extreme high/low across multiple candles in a block
   */
  private findBlockExtremes(candleNames: string[], candleData: any): BlockExtremes {
    let overallHigh = { price: -Infinity, timestamp: '', sourceCandle: '' };
    let overallLow = { price: Infinity, timestamp: '', sourceCandle: '' };

    for (const candleName of candleNames) {
      const oneMinCandles = candleData[candleName];
      if (!oneMinCandles || !Array.isArray(oneMinCandles)) continue;

      // Scan each 1-minute candle within this target candle
      for (const minCandle of oneMinCandles) {
        // Check if this 1-min candle has the highest high
        if (minCandle.high > overallHigh.price) {
          overallHigh = {
            price: minCandle.high,
            timestamp: minCandle.timestamp,
            sourceCandle: candleName
          };
        }

        // Check if this 1-min candle has the lowest low
        if (minCandle.low < overallLow.price) {
          overallLow = {
            price: minCandle.low,
            timestamp: minCandle.timestamp,
            sourceCandle: candleName
          };
        }
      }
    }

    return {
      high: overallHigh,
      low: overallLow
    };
  }

  /**
   * CORRECTED: Calculate slopes between C1 and C2 blocks
   */
  private calculateBlockSlopes(blockAnalysis: BlockAnalysis): SlopeAnalysis {
    console.log('📈 Calculating CORRECTED block-to-block slopes...');

    const trends: any = {};

    // Potential uptrend: C1 Low → C2 High
    if (blockAnalysis.C2.high.price > blockAnalysis.C1.low.price) {
      const pointA = {
        price: blockAnalysis.C1.low.price,
        timestamp: blockAnalysis.C1.low.timestamp,
        block: 'C1'
      };
      const pointB = {
        price: blockAnalysis.C2.high.price,
        timestamp: blockAnalysis.C2.high.timestamp,
        block: 'C2'
      };

      const durationMinutes = this.calculateMinutesDifference(pointA.timestamp, pointB.timestamp);
      const slope = (pointB.price - pointA.price) / durationMinutes;

      trends.uptrend = {
        pointA,
        pointB,
        slope,
        durationMinutes
      };

      console.log(`📈 CORRECTED Uptrend: ${pointA.price} → ${pointB.price} over ${durationMinutes} minutes = ${slope.toFixed(3)} pts/min`);
    }

    // Potential downtrend: C1 High → C2 Low
    if (blockAnalysis.C1.high.price > blockAnalysis.C2.low.price) {
      const pointA = {
        price: blockAnalysis.C1.high.price,
        timestamp: blockAnalysis.C1.high.timestamp,
        block: 'C1'
      };
      const pointB = {
        price: blockAnalysis.C2.low.price,
        timestamp: blockAnalysis.C2.low.timestamp,
        block: 'C2'
      };

      const durationMinutes = this.calculateMinutesDifference(pointA.timestamp, pointB.timestamp);
      const slope = (pointB.price - pointA.price) / durationMinutes;

      trends.downtrend = {
        pointA,
        pointB,
        slope,
        durationMinutes
      };

      console.log(`📉 CORRECTED Downtrend: ${pointA.price} → ${pointB.price} over ${durationMinutes} minutes = ${slope.toFixed(3)} pts/min`);
    }

    // Calculate strength ratio if both trends exist
    let trendStrengthRatio;
    if (trends.uptrend && trends.downtrend) {
      trendStrengthRatio = Math.abs(trends.uptrend.slope) / Math.abs(trends.downtrend.slope);
      console.log(`⚖️ CORRECTED Trend Strength Ratio: ${trendStrengthRatio.toFixed(2)}x (${Math.abs(trends.uptrend.slope) > Math.abs(trends.downtrend.slope) ? 'Bullish' : 'Bearish'} stronger)`);
    }

    return {
      C1_to_C2_trends: trends,
      trendStrengthRatio
    };
  }

  /**
   * Apply Dual Validation System for SL Order Placement (50% + 34% Rules)
   */
  private async applyDualValidationSystem(symbol: string, fourCandles: any[], slopeAnalysis: any): Promise<any> {
    console.log('🔍 Applying Dual Validation System (50% + 34% Rules)...');
    
    const [C1A, C1B, C2A, C2B] = fourCandles;
    
    // Calculate total 4-candle duration
    const total4CandleDuration = (C2B.timestamp - C1A.timestamp) / (1000 * 60); // in minutes
    
    // Process each trend
    const validationResults: any = {};
    
    for (const [trendType, trend] of Object.entries(slopeAnalysis.C1_to_C2_trends) as [string, any][]) {
      const pointATimestamp = trend.pointA.timestamp;
      const pointBTimestamp = trend.pointB.timestamp;
      const pointAToPointBDuration = (new Date(pointBTimestamp).getTime() - new Date(pointATimestamp).getTime()) / (1000 * 60);
      
      // Calculate 5th and 6th candle times (after C2B ends)
      const fifthCandleStartTime = C2B.timestamp + (10 * 60 * 1000); // Assuming 10-minute candles
      const sixthCandleStartTime = fifthCandleStartTime + (10 * 60 * 1000); // 6th candle starts after 5th
      const sixthCandleEndTime = sixthCandleStartTime + (10 * 60 * 1000); // 6th candle ends
      
      const pointATo5thDuration = (fifthCandleStartTime - new Date(pointATimestamp).getTime()) / (1000 * 60);
      const pointBTo5thDuration = (fifthCandleStartTime - new Date(pointBTimestamp).getTime()) / (1000 * 60);
      const pointATo6thDuration = (sixthCandleStartTime - new Date(pointATimestamp).getTime()) / (1000 * 60);
      const pointBTo6thDuration = (sixthCandleStartTime - new Date(pointBTimestamp).getTime()) / (1000 * 60);
      const pointBTo6thEndDuration = (sixthCandleEndTime - new Date(pointBTimestamp).getTime()) / (1000 * 60);
      
      // DUAL VALIDATION SYSTEM:
      // 1. Point A→5th candle ≥50% of total 4-candle duration
      const validation1_50percent = pointATo5thDuration >= (total4CandleDuration * 0.5);
      
      // 2. Point B→5th candle ≥34% of Point A→Point B duration  
      const validation2_34percent = pointBTo5thDuration >= (pointAToPointBDuration * 0.34);
      
      // SL orders enabled only when BOTH validations pass
      const canPlaceOrders = validation1_50percent && validation2_34percent;
      
      const timeFromPointBRequired = (total4CandleDuration * 0.5) - pointAToPointBDuration;
      const timeFromPointBActual = pointBTo5thDuration;
      
      // Calculate target price and exit levels for both 5th and 6th candles
      const slopeRate = trend.slope; // points per minute
      const breakoutPrice = trend.pointB.price; // Point B price as breakout level
      
      // Fetch real 5th and 6th candle data to check actual breakout
      const realBreakoutValidation = await this.validateRealCandleBreakout(
        symbol, 
        fourCandles, 
        trend, 
        trendType, 
        fifthCandleStartTime, 
        sixthCandleStartTime, 
        sixthCandleEndTime
      );

      // Enhanced target calculations using exact breakout timestamps when available
      let duration5thFromBToBreakout = pointBTo5thDuration;
      let duration6thFromBToBreakout = pointBTo6thDuration;
      
      // If exact breakout timestamps are available, use them for more accurate target calculations
      if (realBreakoutValidation.fifthBreakoutTimestamp) {
        duration5thFromBToBreakout = (realBreakoutValidation.fifthBreakoutTimestamp - new Date(pointBTimestamp).getTime()) / (1000 * 60);
        console.log(`🎯 Using exact 5th candle breakout timestamp for target calculation: ${duration5thFromBToBreakout.toFixed(2)} minutes from Point B`);
      }
      
      if (realBreakoutValidation.sixthBreakoutTimestamp) {
        duration6thFromBToBreakout = (realBreakoutValidation.sixthBreakoutTimestamp - new Date(pointBTimestamp).getTime()) / (1000 * 60);
        console.log(`🎯 Using exact 6th candle breakout timestamp for target calculation: ${duration6thFromBToBreakout.toFixed(2)} minutes from Point B`);
      }
      
      // 5th candle target calculations (using exact breakout timing if available)
      const projected5thValue = slopeRate * duration5thFromBToBreakout; // Only the projected portion
      const target5thPrice = projected5thValue + breakoutPrice;
      const exit5thPrice = breakoutPrice + (0.8 * projected5thValue); // 80% of projected value only
      
      console.log(`🎯 5th Candle Target Calculation CORRECTED:`);
      console.log(`   Slope: ${slopeRate.toFixed(3)} pts/min`);
      console.log(`   Duration: ${duration5thFromBToBreakout.toFixed(2)} minutes`);
      console.log(`   Projected Value: ${projected5thValue.toFixed(2)} (slope × time)`);
      console.log(`   Breakout Price: ${breakoutPrice.toFixed(2)}`);
      console.log(`   Target: ${target5thPrice.toFixed(2)} (projected + breakout)`);
      console.log(`   80% Exit: ${exit5thPrice.toFixed(2)} (breakout + 80% of projected only)`);
      
      // 6th candle target calculations (using exact breakout timing if available)
      const projected6thValue = slopeRate * duration6thFromBToBreakout; // Only the projected portion
      const target6thPrice = projected6thValue + breakoutPrice;
      const exit6thPrice = breakoutPrice + (0.8 * projected6thValue); // 80% of projected value only
      
      console.log(`🎯 6th Candle Target Calculation CORRECTED:`);
      console.log(`   Projected Value: ${projected6thValue.toFixed(2)} (slope × time)`);
      console.log(`   Target: ${target6thPrice.toFixed(2)} (projected + breakout)`);
      console.log(`   80% Exit: ${exit6thPrice.toFixed(2)} (breakout + 80% of projected only)`);
      
      // Trade validity: Both 5th and 6th candles must break breakout line by 6th candle close
      // If neither breaks by 6th candle close, cancel SL orders (trade invalid)
      const tradeValidityDeadline = pointBTo6thEndDuration; // By 6th candle close
      
      validationResults[trendType] = {
        total4CandleDuration: total4CandleDuration.toFixed(2),
        pointAToPointBDuration: pointAToPointBDuration.toFixed(2),
        pointATo5thDuration: pointATo5thDuration.toFixed(2),
        pointBTo5thDuration: pointBTo5thDuration.toFixed(2),
        timeFromPointBRequired: timeFromPointBRequired.toFixed(2),
        timeFromPointBActual: timeFromPointBActual.toFixed(2),
        validation1_50percent,
        validation2_34percent,
        canPlaceOrders,
        requiredFor34Percent: (pointAToPointBDuration * 0.34).toFixed(2),
        minutesNeededFromB: Math.max(0, (pointAToPointBDuration * 0.34) - pointBTo5thDuration).toFixed(2),
        // Target calculations for both candles
        slopeRate: slopeRate.toFixed(3),
        breakoutPrice: breakoutPrice.toFixed(2),
        // 5th candle targets
        duration5thFromBToBreakout: duration5thFromBToBreakout.toFixed(2),
        target5thPrice: target5thPrice.toFixed(2),
        exit5thPrice: exit5thPrice.toFixed(2),
        // 6th candle targets  
        duration6thFromBToBreakout: duration6thFromBToBreakout.toFixed(2),
        target6thPrice: target6thPrice.toFixed(2),
        exit6thPrice: exit6thPrice.toFixed(2),
        // Trade validity
        tradeValidityDeadline: tradeValidityDeadline.toFixed(2),
        tradeValidRule: "Cancel SL orders if both 5th and 6th candles fail to break breakout line by 6th candle close",
        // Real breakout validation
        realBreakoutValidation,
        exitAt80Percent: true
      };
      
      console.log(`🎯 ${trendType.toUpperCase()} Dual Validation & Target Calculation:
         Total 4-candle duration: ${total4CandleDuration.toFixed(2)} minutes
         Point A→Point B duration: ${pointAToPointBDuration.toFixed(2)} minutes
         Point B→5th candle duration: ${pointBTo5thDuration.toFixed(2)} minutes
         Required from Point B (50% rule): ${timeFromPointBRequired.toFixed(2)} minutes
         Required for 34% rule: ${(pointAToPointBDuration * 0.34).toFixed(2)} minutes
         
         🔍 Validation Results:
         Validation 1 (50% from Point B): ${validation1_50percent ? '✅ PASSED' : '❌ FAILED'}
         Validation 2 (B→5th ≥34% of A→B): ${validation2_34percent ? '✅ PASSED' : '❌ FAILED'}
         SL Orders Enabled: ${canPlaceOrders ? '✅ YES' : '❌ NO'}
         
         🎯 Target Calculations (5th & 6th Candle):
         Slope Rate: ${slopeRate.toFixed(3)} points/min
         Breakout Price: ${breakoutPrice.toFixed(2)}
         
         📊 5th Candle Target:
         Duration B→5th: ${duration5thFromBToBreakout.toFixed(2)} minutes
         Target: (${slopeRate.toFixed(3)} × ${duration5thFromBToBreakout.toFixed(2)}) + ${breakoutPrice.toFixed(2)} = ${target5thPrice.toFixed(2)}
         Exit at 80%: ${exit5thPrice.toFixed(2)}
         
         📊 6th Candle Target:
         Duration B→6th: ${duration6thFromBToBreakout.toFixed(2)} minutes  
         Target: (${slopeRate.toFixed(3)} × ${duration6thFromBToBreakout.toFixed(2)}) + ${breakoutPrice.toFixed(2)} = ${target6thPrice.toFixed(2)}
         Exit at 80%: ${exit6thPrice.toFixed(2)}
         
         ⚠️ Trade Validity Rule:
         Deadline: ${tradeValidityDeadline.toFixed(2)} minutes from Point B (90% of 6th candle close)
         Action: Cancel SL orders if BOTH 5th and 6th candles fail to break breakout line by 90% deadline
         
         🔍 Real Breakout Validation:
         5th Candle: ${realBreakoutValidation.fifthCandle ? `High: ${realBreakoutValidation.fifthCandle.high}, Low: ${realBreakoutValidation.fifthCandle.low}, Broke: ${realBreakoutValidation.fifthCandleBrokeBreakout ? '✅ YES' : '❌ NO'}` : '⏳ Not available yet'}
         6th Candle: ${realBreakoutValidation.sixthCandle ? `High: ${realBreakoutValidation.sixthCandle.high}, Low: ${realBreakoutValidation.sixthCandle.low}, Broke: ${realBreakoutValidation.sixthCandleBrokeBreakout ? '✅ YES' : '❌ NO'}` : '⏳ Not available yet'}
         Trade Valid: ${realBreakoutValidation.tradeIsValid ? '✅ YES' : '❌ NO - Cancel SL orders'}`);
    }
    
    return {
      validationResults,
      summary: {
        total4CandleDuration,
        rulesApplied: ['50% breakout rule from Point B perspective', '34% SL order rule', '5th & 6th candle target calculations with 80% exit', 'Trade validity: Cancel if both 5th & 6th fail to break by 6th close'],
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Fetch REAL 1-minute data from Fyers API for a specific target candle timeframe
   */
  private async fetchOneMinuteDataForCandle(targetCandle: any, date: string, symbol: string): Promise<OneMinuteCandle[]> {
    try {
      console.log(`🕐 Fetching REAL 1-minute data for candle at ${targetCandle.timestamp}...`);

      const startTime = new Date(targetCandle.timestamp);
      const endTime = new Date(startTime.getTime() + (10 * 60 * 1000)); // Assuming 10-min candles

      // Format dates for Fyers API
      const startDate = startTime.toISOString().split('T')[0];
      const endDate = endTime.toISOString().split('T')[0];

      console.log(`🔍 Fetching from Fyers API: ${symbol} from ${startDate} to ${endDate} with 1-minute resolution`);

      const historicalData = await this.fyersAPI.getHistoricalData({
        symbol: symbol,
        resolution: '1', // 1-minute resolution
        date_format: '1',
        range_from: startDate,
        range_to: endDate,
        cont_flag: '1'
      });

      if (!historicalData || historicalData.length === 0) {
        console.warn(`⚠️ No REAL 1-minute data available from Fyers API for ${symbol} in timeframe ${startTime.toISOString()} to ${endTime.toISOString()}`);
        return [];
      }

      // Convert Fyers API response to our format and filter to exact timeframe
      const filtered = historicalData
        .filter((c: any) => {
          const candleTime = new Date(c[0] * 1000);
          return candleTime >= startTime && candleTime < endTime;
        })
        .map((c: any) => ({
          timestamp: new Date(c[0] * 1000).toISOString(),
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
          volume: c[5]
        }));

      console.log(`✅ Retrieved ${filtered.length} REAL 1-minute candles from Fyers API for target candle`);
      return filtered;

    } catch (error) {
      console.error(`❌ Failed to fetch REAL 1-minute data from Fyers API for candle:`, error);
      console.log(`🔄 This requires valid Fyers API authentication`);
      return [];
    }
  }

  /**
   * Calculate difference in minutes between two timestamps
   */
  private calculateMinutesDifference(timestamp1: string, timestamp2: string): number {
    const time1 = new Date(timestamp1);
    const time2 = new Date(timestamp2);
    return Math.abs(time2.getTime() - time1.getTime()) / (1000 * 60);
  }

  /**
   * Store enhanced analysis data to file
   */
  private async storeEnhancedData(filename: string, data: any): Promise<void> {
    try {
      const dirPath = path.join(process.cwd(), 'battu-corrected-data');
      await fs.mkdir(dirPath, { recursive: true });
      
      const filePath = path.join(dirPath, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      console.log(`💾 CORRECTED analysis data stored: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to store enhanced data:', error);
    }
  }
}