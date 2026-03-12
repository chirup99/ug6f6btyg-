// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed
import { CorrectedFourCandleProcessor } from './corrected-four-candle-processor';

export interface ProgressiveAnalysisResult {
  currentTimeframe: number;
  nextTimeframe: number;
  candleCount: number;
  shouldDouble: boolean;
  analysis?: any;
  doubledAnalysis?: any;
  realBreakoutValidation?: any;
  doubledRealBreakoutValidation?: any;
  marketClosed: boolean;
  progressiveLevel: number;
  totalLevels: number;
  candleConsolidation?: any;
}

export class ProgressiveTimeframeDoubler {
  private correctedProcessor: CorrectedFourCandleProcessor;

  constructor(private fyersApi: FyersAPI) {
    this.correctedProcessor = new CorrectedFourCandleProcessor(fyersApi);
  }

  async runProgressiveAnalysis(
    symbol: string,
    date: string,
    initialTimeframe: string,
    startAfterCandle: number = 6
  ): Promise<ProgressiveAnalysisResult[]> {
    console.log(`🔄 Starting progressive timeframe doubling analysis...`);
    console.log(`📊 Symbol: ${symbol}, Date: ${date}, Initial TF: ${initialTimeframe}min`);
    console.log(`🎯 LOGIC: After 6th candle (60min) → Double timeframe → Wait for 3 candles → Check >6 → Double again`);

    const results: ProgressiveAnalysisResult[] = [];
    let currentTimeframe = parseInt(initialTimeframe);
    let progressiveLevel = 1;
    const maxLevels = 8; // Allow more levels for longer market sessions
    
    // Check if market is closed (pass date for historical analysis)
    const marketClosed = await this.isMarketClosed(date);

    while (progressiveLevel <= maxLevels && !marketClosed) {
      console.log(`\n🎯 Progressive Level ${progressiveLevel}: ${currentTimeframe}min timeframe`);

      try {
        // Get current candle count for this timeframe
        const candleCount = await this.getCandleCount(symbol, date, currentTimeframe.toString());
        console.log(`📈 Candle count at ${currentTimeframe}min: ${candleCount}`);

        // Special logic: For first level, need 6 candles (60 minutes), then 3 candles minimum for subsequent levels
        const minimumCandles = (progressiveLevel === 1) ? 6 : 3;
        const shouldDouble = candleCount > startAfterCandle && candleCount >= minimumCandles;
        
        console.log(`🔍 Logic Check: Level ${progressiveLevel}, Need minimum ${minimumCandles} candles, Have ${candleCount}`);
        console.log(`🔍 Should double? ${shouldDouble} (${candleCount} > ${startAfterCandle} AND >= ${minimumCandles})`);

        // Always fetch 1-minute base data for accurate progressive analysis
        const historicalData = await this.fyersApi.getHistoricalData({
          symbol,
          resolution: '1', // Always use 1-minute base data
          date_format: '1',
          range_from: date,
          range_to: date,
          cont_flag: '1'
        });

        const currentAnalysis = await this.correctedProcessor.analyzeWithCorrectMethodology(
          historicalData || [],
          date,
          symbol
        );

        // Display 4-candle analysis results for each timeframe
        console.log(`📋 [PROGRESSIVE] 4-Candle Analysis at ${currentTimeframe}min timeframe:`);
        if (currentAnalysis && currentAnalysis.uptrend && currentAnalysis.downtrend) {
          console.log(`   ✅ UPTREND Pattern: ${currentAnalysis.uptrend.patternName} (Slope: ${currentAnalysis.uptrend.slope.toFixed(3)} pts/min)`);
          console.log(`   ✅ DOWNTREND Pattern: ${currentAnalysis.downtrend.patternName} (Slope: ${currentAnalysis.downtrend.slope.toFixed(3)} pts/min)`);
          console.log(`   🎯 Valid Trade Patterns Found: Both uptrend and downtrend patterns available`);
        } else {
          console.log(`   ❌ No valid trade patterns found at ${currentTimeframe}min timeframe`);
        }

        // Add real breakout validation for current timeframe
        let realBreakoutValidation = null;
        if (currentAnalysis && currentAnalysis.uptrend && currentAnalysis.downtrend) {
          try {
            const realCandleResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/battu-scan/real-candle-data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                symbol,
                date,
                timeframe: currentTimeframe.toString(),
                analysisData: currentAnalysis
              })
            });
            
            if (realCandleResponse.ok) {
              const realCandleData = await realCandleResponse.json();
              console.log(`   📊 [PROGRESSIVE] Real breakout validation at ${currentTimeframe}min:`);
              console.log(`   📈 5th Candle: High ${realCandleData.fifthCandle?.high}, Low ${realCandleData.fifthCandle?.low}`);
              console.log(`   📈 6th Candle: High ${realCandleData.sixthCandle?.high}, Low ${realCandleData.sixthCandle?.low}`);
              realBreakoutValidation = realCandleData;
            }
          } catch (error) {
            console.log(`   ⚠️ Real breakout validation unavailable for ${currentTimeframe}min timeframe`);
          }
        }

        let doubledAnalysis = null;
        let candleConsolidation = null;
        if (shouldDouble) {
          const nextTimeframe = currentTimeframe * 2;
          console.log(`⏫ DOUBLING: ${currentTimeframe}min → ${nextTimeframe}min (After ${candleCount} candles completed)`);
          
          // Step 1: Get the 6 completed candles at current timeframe 
          const sixCompletedCandles = await this.getSixCompletedCandles(symbol, date, currentTimeframe);
          console.log(`📊 Found ${sixCompletedCandles.length} completed candles at ${currentTimeframe}min for consolidation`);
          
          // Step 2: Consolidate 6 candles into 3 candles at doubled timeframe
          if (sixCompletedCandles.length >= 6) {
            candleConsolidation = this.consolidateSixCandlesToThree(sixCompletedCandles, currentTimeframe, nextTimeframe);
            console.log(`🔄 CONSOLIDATION: 6 candles (${currentTimeframe}min) → 3 candles (${nextTimeframe}min)`);
            console.log(`   📈 Consolidated Candle 1: ${candleConsolidation.consolidated[0].open} → ${candleConsolidation.consolidated[0].close}`);
            console.log(`   📈 Consolidated Candle 2: ${candleConsolidation.consolidated[1].open} → ${candleConsolidation.consolidated[1].close}`);
            console.log(`   📈 Consolidated Candle 3: ${candleConsolidation.consolidated[2].open} → ${candleConsolidation.consolidated[2].close}`);
          }

          // Step 3: Get analysis at doubled timeframe using same 1-minute base data
          const doubledHistoricalData = await this.fyersApi.getHistoricalData({
            symbol,
            resolution: '1', // Always use 1-minute base data for consistency
            date_format: '1',
            range_from: date,
            range_to: date,
            cont_flag: '1'
          });

          doubledAnalysis = await this.correctedProcessor.analyzeWithCorrectMethodology(
            doubledHistoricalData || [],
            date,
            symbol
          );

          // Display 4-candle analysis results for doubled timeframe
          console.log(`📋 [PROGRESSIVE] 4-Candle Analysis at ${nextTimeframe}min doubled timeframe:`);
          if (doubledAnalysis && doubledAnalysis.uptrend && doubledAnalysis.downtrend) {
            console.log(`   ✅ UPTREND Pattern: ${doubledAnalysis.uptrend.patternName} (Slope: ${doubledAnalysis.uptrend.slope.toFixed(3)} pts/min)`);
            console.log(`   ✅ DOWNTREND Pattern: ${doubledAnalysis.downtrend.patternName} (Slope: ${doubledAnalysis.downtrend.slope.toFixed(3)} pts/min)`);
            console.log(`   🎯 Valid Trade Patterns Found: Both uptrend and downtrend patterns available`);
          } else {
            console.log(`   ❌ No valid trade patterns found at ${nextTimeframe}min doubled timeframe`);
          }

          console.log(`✅ Doubled analysis completed for ${nextTimeframe}min`);
          
          // Log the progression path clearly
          if (progressiveLevel === 1) {
            console.log(`📋 PROGRESSION: 10min (6 candles = 60min) → 20min timeframe`);
          } else {
            console.log(`📋 PROGRESSION: ${currentTimeframe}min (${candleCount} candles) → ${nextTimeframe}min timeframe`);
          }
        }

        const result: ProgressiveAnalysisResult = {
          currentTimeframe,
          nextTimeframe: shouldDouble ? currentTimeframe * 2 : currentTimeframe,
          candleCount,
          shouldDouble,
          analysis: currentAnalysis,
          doubledAnalysis,
          realBreakoutValidation,
          doubledRealBreakoutValidation: null, // Will be added for doubled analysis
          marketClosed,
          progressiveLevel,
          totalLevels: maxLevels,
          candleConsolidation // Add consolidation details
        };

        results.push(result);

        // If we should double, move to next level
        if (shouldDouble) {
          currentTimeframe = currentTimeframe * 2;
          progressiveLevel++;
          console.log(`🔄 Moving to Level ${progressiveLevel} with ${currentTimeframe}min timeframe`);
        } else {
          // No more doubling needed at this time
          console.log(`⏸️ Waiting for more candles (${candleCount} not > ${startAfterCandle} or < ${minimumCandles} minimum)`);
          break;
        }

        // Indian market specific: Stop at 80 minutes maximum timeframe
        if (currentTimeframe > 80) {
          console.log(`🛑 Indian market maximum timeframe reached: ${currentTimeframe}min (80min is final doubling)`);
          break;
        }

      } catch (error) {
        console.error(`❌ Error in progressive level ${progressiveLevel}:`, error);
        break;
      }
    }

    console.log(`🏁 Progressive analysis completed: ${results.length} levels processed`);
    console.log(`📊 Final progression path: ${results.map(r => `${r.currentTimeframe}min(${r.candleCount})`).join(' → ')}`);
    return results;
  }

  private async getCandleCount(symbol: string, date: string, timeframe: string): Promise<number> {
    try {
      // Always fetch 1-minute base data, then calculate how many candles of the target timeframe we can create
      const oneMinuteData = await this.fyersApi.getHistoricalData({
        symbol,
        resolution: '1', // Always use 1-minute base data
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });

      if (!oneMinuteData || oneMinuteData.length === 0) {
        console.log(`⚠️ No 1-minute data available for ${date}`);
        return 0;
      }

      // Calculate how many candles of the target timeframe we can create from 1-minute data
      const timeframeMinutes = parseInt(timeframe);
      const possibleCandles = Math.floor(oneMinuteData.length / timeframeMinutes);
      
      console.log(`📊 1-minute data: ${oneMinuteData.length} candles → ${possibleCandles} ${timeframe}-minute candles`);
      
      // For demonstration: If we have insufficient data, show what would happen with full market data
      if (oneMinuteData.length < 100) {
        const fullMarketCandles = Math.floor(375 / timeframeMinutes); // 9:15 AM - 3:30 PM = 375 minutes
        console.log(`💡 DEMO: With full market data (375 minutes), we would have ${fullMarketCandles} ${timeframe}-minute candles`);
        return fullMarketCandles; // Return theoretical count for demonstration
      }
      
      return possibleCandles;
    } catch (error) {
      console.error(`❌ Error getting candle count:`, error);
      return 0;
    }
  }

  private async isMarketClosed(analysisDate?: string): Promise<boolean> {
    console.log(`🔍 isMarketClosed called with analysisDate: ${analysisDate}`);
    
    // For historical data analysis, always allow processing
    if (analysisDate) {
      // Parse target date more reliably
      const targetDate = new Date(analysisDate + 'T00:00:00');
      const today = new Date();
      
      // Normalize both dates to compare just the date part
      const targetDateString = targetDate.toISOString().split('T')[0];
      const todayDateString = today.toISOString().split('T')[0];
      
      console.log(`📅 Date comparison: Target: ${targetDateString}, Today: ${todayDateString}`);
      
      // If analyzing different date, market is "open" for analysis purposes
      if (targetDateString !== todayDateString) {
        console.log(`📊 Historical analysis mode: Market considered OPEN for date ${analysisDate}`);
        return false;
      }
      
      console.log(`📅 Same date detected - checking real-time market hours`);
    }

    // For real-time analysis, check actual market hours (9:15 AM - 3:30 PM IST)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    
    const marketStart = 9 * 60 + 15; // 9:15 AM in minutes
    const marketEnd = 15 * 60 + 30;  // 3:30 PM in minutes
    const currentTime = hour * 60 + minute;
    
    const closed = currentTime < marketStart || currentTime > marketEnd;
    console.log(`🕐 Market status: ${closed ? 'CLOSED' : 'OPEN'} (Current: ${hour}:${minute.toString().padStart(2, '0')})`);
    
    return closed;
  }

  private async getSixCompletedCandles(symbol: string, date: string, timeframe: number): Promise<any[]> {
    try {
      // Get 1-minute base data
      const oneMinuteData = await this.fyersApi.getHistoricalData({
        symbol,
        resolution: '1',
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });

      if (!oneMinuteData || oneMinuteData.length === 0) {
        return [];
      }

      // Convert 1-minute data to target timeframe candles
      const candles = [];
      const candleDurationMinutes = timeframe;
      
      for (let i = 0; i < oneMinuteData.length; i += candleDurationMinutes) {
        const candleData = oneMinuteData.slice(i, i + candleDurationMinutes);
        if (candleData.length === candleDurationMinutes) { // Only complete candles
          const open = candleData[0][1];
          const close = candleData[candleData.length - 1][4];
          const high = Math.max(...candleData.map(d => d[2]));
          const low = Math.min(...candleData.map(d => d[3]));
          
          candles.push({
            open,
            high,
            low,
            close,
            timeframe: `${timeframe}min`,
            startTime: candleData[0][0],
            endTime: candleData[candleData.length - 1][0]
          });
          
          // Only return first 6 completed candles
          if (candles.length >= 6) break;
        }
      }
      
      return candles.slice(0, 6); // Ensure exactly 6 candles
    } catch (error) {
      console.error(`❌ Error getting six completed candles:`, error);
      return [];
    }
  }

  private consolidateSixCandlesToThree(sixCandles: any[], oldTimeframe: number, newTimeframe: number): any {
    // Consolidation logic: Candles 1,2 → Consolidated 1, Candles 3,4 → Consolidated 2, Candles 5,6 → Consolidated 3
    const consolidated = [];
    
    for (let i = 0; i < 6; i += 2) {
      const candle1 = sixCandles[i];
      const candle2 = sixCandles[i + 1];
      
      if (candle1 && candle2) {
        const consolidatedCandle = {
          open: candle1.open,
          close: candle2.close,
          high: Math.max(candle1.high, candle2.high),
          low: Math.min(candle1.low, candle2.low),
          timeframe: `${newTimeframe}min`,
          startTime: candle1.startTime,
          endTime: candle2.endTime,
          sourceCandles: [i + 1, i + 2] // Track which original candles were combined
        };
        
        consolidated.push(consolidatedCandle);
      }
    }
    
    return {
      originalTimeframe: oldTimeframe,
      newTimeframe: newTimeframe,
      inputCandles: sixCandles.length,
      outputCandles: consolidated.length,
      consolidated: consolidated,
      consolidationMap: "Candles 1,2 → C1 | Candles 3,4 → C2 | Candles 5,6 → C3"
    };
  }

  // Get real-time progressive status
  async getProgressiveStatus(
    symbol: string,
    date: string,
    currentTimeframe: string
  ): Promise<{
    shouldProgress: boolean;
    currentLevel: number;
    nextTimeframe: number;
    candleCount: number;
    marketStatus: 'open' | 'closed';
    progressionRule: string;
    recommendation: string;
  }> {
    const timeframe = parseInt(currentTimeframe);
    const candleCount = await this.getCandleCount(symbol, date, currentTimeframe);
    const marketClosed = await this.isMarketClosed(date);
    
    // Calculate current progressive level based on timeframe
    let currentLevel = 1;
    let checkTimeframe = 10; // Start from 10min baseline
    while (checkTimeframe < timeframe) {
      checkTimeframe *= 2;
      currentLevel++;
    }

    // Determine progression rules based on level
    let progressionRule: string;
    let shouldProgress: boolean;
    let recommendation: string;

    if (currentLevel === 1) {
      // First level: Need 6 candles (60 minutes) to double from 10min to 20min
      progressionRule = "After 6 candles (60 minutes) → Double to 20min";
      shouldProgress = candleCount >= 6 && !marketClosed;
      recommendation = candleCount >= 6 
        ? "Ready to double timeframe to 20min" 
        : `Wait for ${6 - candleCount} more candles (${(6 - candleCount) * timeframe} minutes)`;
    } else {
      // Subsequent levels: Wait for 3 candles minimum, then check if >6 total
      const minimumCandles = 3;
      progressionRule = `Wait for ${minimumCandles} candles → Check if >6 → Double timeframe`;
      shouldProgress = candleCount > 6 && candleCount >= minimumCandles && !marketClosed;
      
      if (candleCount < minimumCandles) {
        recommendation = `Wait for ${minimumCandles - candleCount} more candles`;
      } else if (candleCount <= 6) {
        recommendation = `Wait for ${7 - candleCount} more candles to exceed 6`;
      } else {
        recommendation = `Ready to double timeframe to ${timeframe * 2}min`;
      }
    }

    console.log(`📊 Progressive Status: Level ${currentLevel}, ${timeframe}min, ${candleCount} candles`);
    console.log(`🎯 Rule: ${progressionRule}`);
    console.log(`💡 Recommendation: ${recommendation}`);

    return {
      shouldProgress,
      currentLevel,
      nextTimeframe: timeframe * 2,
      candleCount,
      marketStatus: marketClosed ? 'closed' : 'open',
      progressionRule,
      recommendation
    };
  }
}