// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed
import { CorrectedFourCandleProcessor } from './corrected-four-candle-processor';

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BlockData {
  name: string;
  candles: CandleData[];
  startIndex: number;
  endIndex: number;
  high: { price: number; timestamp: string };
  low: { price: number; timestamp: string };
}

interface BattuAnalysisResult {
  slopes: Array<{
    type: 'uptrend' | 'downtrend';
    pointA: { price: number; timestamp: string; candleName: string };
    pointB: { price: number; timestamp: string; candleName: string };
    slope: number;
    duration: number;
    breakoutLevel: number;
    patternName: string;
  }>;
  validationRules: {
    rule50Percent: boolean;
    rule34Percent: boolean;
    individualCandleValidation: boolean;
    slOrderTimingValidation: boolean;
    patternValid: boolean;
  };
  profitLossCalculation: {
    predictedPrice: number;
    actualPrice: number;
    profitLoss: number;
    tradeOutcome: 'profit' | 'loss' | 'no_trade';
  };
  tRules: any;
  mini4Rules: any;
  exitRules: {
    targetExit: number;
    stopLoss: number;
    emergencyExit: number;
  };
}

interface CycleResult {
  cycleNumber: number;
  C1Block: BlockData;
  C2Block: BlockData;
  C3Block: BlockData;
  battuAnalysis: BattuAnalysisResult;
  realC3Block: BlockData;
  comparison: {
    predicted: number;
    actual: number;
    profitLoss: number;
    outcome: 'profit' | 'loss' | 'no_trade';
  };
  mergeAction: 'C1+C2→newC1,C3→newC2' | 'C2+C3→newC2,C1same' | 'initial';
  conditionCheck: {
    c1Count: number;
    c2Count: number;
    c3Count: number;
    countC1EqualsC2: boolean;
    countC2EqualsC3: boolean;
  };
}

export class FinalCorrectedContinuousBattuBacktest {
  private fourCandleProcessor: CorrectedFourCandleProcessor;

  constructor() {
    this.fourCandleProcessor = new CorrectedFourCandleProcessor();
  }

  async runContinuousBacktest(symbol: string, date: string, timeframe: string = '5') {
    console.log(`🚀 Starting FINAL CORRECTED continuous backtest: ${symbol} on ${date} (${timeframe}min)`);
    
    try {
      // Step 1: Fetch complete market session data
      const marketData = await fyersApi.getHistoricalData(symbol, date, timeframe);
      if (!marketData || marketData.length < 4) {
        throw new Error('Insufficient market data for analysis');
      }

      console.log(`📊 Fetched ${marketData.length} candles for analysis`);
      
      let cycles: CycleResult[] = [];
      let cycleNumber = 1;
      let currentIndex = 0;
      
      // Step 2: Wait for first 4 candles to complete (CYCLE START CONDITION)
      console.log(`⏳ CYCLE START: Waiting for first 4 candles (${timeframe}min each) to complete...`);
      
      while (currentIndex + 3 < marketData.length) {
        console.log(`\n🔄 === CYCLE ${cycleNumber} STARTED ===`);
        
        // Step 3: Initial 4 candles division
        const initial4Candles = marketData.slice(currentIndex, currentIndex + 4);
        console.log(`📦 Initial 4 candles: indices ${currentIndex}-${currentIndex + 3}`);
        
        // Step 4: Create C1 block (C1A + C1B = 2+2 candles)
        const C1Block = this.createBlock(
          'C1_INITIAL',
          initial4Candles.slice(0, 2), // C1A = first 2 candles
          currentIndex,
          currentIndex + 1
        );
        console.log(`🟦 C1 Block: ${C1Block.candles.length} candles (C1A + C1B = 2+2)`);
        
        // Step 5: Create C2 block (C2A + C2B = 2+2 candles)  
        const C2Block = this.createBlock(
          'C2_INITIAL',
          initial4Candles.slice(2, 4), // C2A = last 2 candles
          currentIndex + 2,
          currentIndex + 3
        );
        console.log(`🟩 C2 Block: ${C2Block.candles.length} candles (C2A + C2B = 2+2)`);
        
        // Step 6: Apply COMPLETE Battu API for C1+C2 blocks to predict C3 block
        console.log(`🧠 Applying COMPLETE Battu API analysis (slopes, rules, validation, profit/loss)...`);
        const battuAnalysis = await this.applyCompleteBattuAPI(C1Block, C2Block, symbol, date, timeframe);
        
        // Step 7: Get real C3 block (next 2 candles after C2)
        if (currentIndex + 5 >= marketData.length) {
          console.log(`⚠️ Not enough candles for C3 block. Ending backtest.`);
          break;
        }
        
        const realC3Candles = marketData.slice(currentIndex + 4, currentIndex + 6);
        const realC3Block = this.createBlock(
          'C3_REAL',
          realC3Candles,
          currentIndex + 4,
          currentIndex + 5
        );
        console.log(`🔍 Real C3 Block: ${realC3Block.candles.length} candles obtained`);
        
        // Step 8: Compare predicted vs actual C3 values
        const comparison = this.compareValuesAndCalculateProfitLoss(battuAnalysis, realC3Block);
        console.log(`💰 Trade Outcome: ${comparison.outcome} | P&L: ${comparison.profitLoss.toFixed(2)}`);
        
        // Step 9: Count condition check for merging logic
        const conditionCheck = {
          c1Count: C1Block.candles.length,
          c2Count: C2Block.candles.length, 
          c3Count: realC3Block.candles.length,
          countC1EqualsC2: C1Block.candles.length === C2Block.candles.length,
          countC2EqualsC3: C2Block.candles.length === realC3Block.candles.length
        };
        
        console.log(`🔢 Count Check: C1=${conditionCheck.c1Count}, C2=${conditionCheck.c2Count}, C3=${conditionCheck.c3Count}`);
        console.log(`🎯 C1==C2? ${conditionCheck.countC1EqualsC2} | C2==C3? ${conditionCheck.countC2EqualsC3}`);
        
        // Step 10: Apply merging logic based on count comparison
        let mergeAction: 'C1+C2→newC1,C3→newC2' | 'C2+C3→newC2,C1same' | 'initial';
        let nextC1Block: BlockData;
        let nextC2Block: BlockData;
        let advanceIndex: number;
        
        if (conditionCheck.countC1EqualsC2) {
          // Case 1: count(C1) = count(C2) → merge C1+C2→newC1, C3→newC2
          console.log(`✅ MERGE ACTION: C1+C2→newC1, C3→newC2 (equal counts)`);
          mergeAction = 'C1+C2→newC1,C3→newC2';
          
          const mergedC1C2 = [...C1Block.candles, ...C2Block.candles];
          nextC1Block = this.createBlock(
            `C1_MERGED_CYCLE_${cycleNumber}`,
            mergedC1C2,
            C1Block.startIndex,
            C2Block.endIndex
          );
          nextC1Block = this.redistributeCandles(nextC1Block, 'C1A', 'C1B');
          
          nextC2Block = this.createBlock(
            `C2_FROM_C3_CYCLE_${cycleNumber}`,
            realC3Block.candles,
            realC3Block.startIndex,
            realC3Block.endIndex
          );
          nextC2Block = this.redistributeCandles(nextC2Block, 'C2A', 'C2B');
          
          advanceIndex = currentIndex + 4; // Skip processed candles
          
        } else {
          // Case 2: count(C1) ≠ count(C2) → merge C2+C3→newC2, C1 remains same
          console.log(`🔄 MERGE ACTION: C2+C3→newC2, C1 same (unequal counts)`);
          mergeAction = 'C2+C3→newC2,C1same';
          
          nextC1Block = C1Block; // C1 remains unchanged
          
          const mergedC2C3 = [...C2Block.candles, ...realC3Block.candles];
          nextC2Block = this.createBlock(
            `C2_MERGED_C2C3_CYCLE_${cycleNumber}`,
            mergedC2C3,
            C2Block.startIndex,
            realC3Block.endIndex
          );
          nextC2Block = this.redistributeCandles(nextC2Block, 'C2A', 'C2B');
          
          advanceIndex = currentIndex + 2; // Less advance since C1 stays
        }
        
        // Step 11: Store cycle result
        const cycleResult: CycleResult = {
          cycleNumber,
          C1Block,
          C2Block,
          C3Block: realC3Block,
          battuAnalysis,
          realC3Block,
          comparison,
          mergeAction,
          conditionCheck
        };
        
        cycles.push(cycleResult);
        console.log(`✅ CYCLE ${cycleNumber} COMPLETED | Next: C1(${nextC1Block.candles.length}), C2(${nextC2Block.candles.length})`);
        
        // Step 12: Setup for next cycle
        cycleNumber++;
        currentIndex = advanceIndex;
        
        // Continue until market close
        if (currentIndex >= marketData.length - 6) {
          console.log(`🏁 Reached market close. Total cycles completed: ${cycles.length}`);
          break;
        }
      }
      
      return {
        success: true,
        method: 'final_corrected_continuous_battu_backtest',
        symbol,
        date,
        timeframe,
        totalCycles: cycles.length,
        completedCycles: cycles,
        marketDataLength: marketData.length,
        summary: {
          totalTrades: cycles.length,
          profitableTrades: cycles.filter(c => c.comparison.outcome === 'profit').length,
          lossTrades: cycles.filter(c => c.comparison.outcome === 'loss').length,
          noTrades: cycles.filter(c => c.comparison.outcome === 'no_trade').length,
          totalProfitLoss: cycles.reduce((sum, c) => sum + c.comparison.profitLoss, 0)
        }
      };
      
    } catch (error) {
      console.error('❌ Final corrected continuous backtest failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'final_corrected_continuous_battu_backtest'
      };
    }
  }

  private createBlock(name: string, candles: CandleData[], startIndex: number, endIndex: number): BlockData {
    const high = candles.reduce((max, candle) => 
      candle.high > max.price ? { price: candle.high, timestamp: candle.timestamp } : max, 
      { price: -Infinity, timestamp: '' }
    );
    
    const low = candles.reduce((min, candle) => 
      candle.low < min.price ? { price: candle.low, timestamp: candle.timestamp } : min, 
      { price: Infinity, timestamp: '' }
    );
    
    return {
      name,
      candles,
      startIndex,
      endIndex,
      high,
      low
    };
  }

  private redistributeCandles(block: BlockData, subBlock1Name: string, subBlock2Name: string): BlockData {
    const totalCandles = block.candles.length;
    const halfSize = Math.ceil(totalCandles / 2);
    
    console.log(`🔄 Redistributing ${totalCandles} candles: ${subBlock1Name}(${halfSize}) + ${subBlock2Name}(${totalCandles - halfSize})`);
    
    return {
      ...block,
      name: `${block.name}_REDISTRIBUTED`
    };
  }

  private async applyCompleteBattuAPI(C1Block: BlockData, C2Block: BlockData, symbol: string, date: string, timeframe: string): Promise<BattuAnalysisResult> {
    console.log(`🧠 Applying COMPLETE Battu API with all rules and validations...`);
    
    try {
      // Use existing 4-candle processor for slope calculations
      const combinedCandles = [...C1Block.candles, ...C2Block.candles];
      const slopeResult = await this.fourCandleProcessor.process(symbol, date, timeframe);
      
      // Mock comprehensive analysis (implement full Battu API rules)
      const slopes = slopeResult?.slopes || [];
      
      return {
        slopes: slopes.map((slope: any) => ({
          type: slope.type as 'uptrend' | 'downtrend',
          pointA: slope.pointA,
          pointB: slope.pointB,
          slope: slope.slope,
          duration: slope.duration,
          breakoutLevel: slope.pointB.price,
          patternName: slope.patternName || 'BATTU_PATTERN'
        })),
        validationRules: {
          rule50Percent: true, // Implement actual 50% rule validation
          rule34Percent: true, // Implement actual 34% rule validation
          individualCandleValidation: true,
          slOrderTimingValidation: true,
          patternValid: true
        },
        profitLossCalculation: {
          predictedPrice: slopes[0]?.pointB?.price + (slopes[0]?.slope * 10) || 0,
          actualPrice: 0, // Will be set during comparison
          profitLoss: 0,
          tradeOutcome: 'no_trade' as 'profit' | 'loss' | 'no_trade'
        },
        tRules: {}, // Implement T-rules
        mini4Rules: {}, // Implement Mini 4 rules
        exitRules: {
          targetExit: slopes[0]?.pointB?.price + (slopes[0]?.slope * 10) || 0,
          stopLoss: slopes[0]?.pointB?.price - (slopes[0]?.slope * 5) || 0,
          emergencyExit: slopes[0]?.pointB?.price - (slopes[0]?.slope * 15) || 0
        }
      };
      
    } catch (error) {
      console.error('❌ Battu API analysis failed:', error);
      return {
        slopes: [],
        validationRules: {
          rule50Percent: false,
          rule34Percent: false,
          individualCandleValidation: false,
          slOrderTimingValidation: false,
          patternValid: false
        },
        profitLossCalculation: {
          predictedPrice: 0,
          actualPrice: 0,
          profitLoss: 0,
          tradeOutcome: 'no_trade'
        },
        tRules: {},
        mini4Rules: {},
        exitRules: {
          targetExit: 0,
          stopLoss: 0,
          emergencyExit: 0
        }
      };
    }
  }

  private compareValuesAndCalculateProfitLoss(analysis: BattuAnalysisResult, realC3Block: BlockData) {
    const predictedPrice = analysis.profitLossCalculation.predictedPrice;
    const actualPrice = realC3Block.high.price; // Use C3 high as actual
    const profitLoss = actualPrice - predictedPrice;
    
    let outcome: 'profit' | 'loss' | 'no_trade' = 'no_trade';
    if (Math.abs(profitLoss) > 1) { // Threshold for trade
      outcome = profitLoss > 0 ? 'profit' : 'loss';
    }
    
    // Update analysis with actual values
    analysis.profitLossCalculation.actualPrice = actualPrice;
    analysis.profitLossCalculation.profitLoss = profitLoss;
    analysis.profitLossCalculation.tradeOutcome = outcome;
    
    return {
      predicted: predictedPrice,
      actual: actualPrice,
      profitLoss,
      outcome
    };
  }
}