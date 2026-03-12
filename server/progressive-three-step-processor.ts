// import { FyersAPI } from './fyers-api.js'; // Removed: Fyers API removed

export interface ProgressiveStepResult {
  step: 1 | 2 | 3;
  timeframe: number;
  c1Block: any[];
  c2Block: any[];
  c3Block?: any[];
  stepDescription: string;
  canProceedToNext: boolean;
  nextStepAction?: string;
  slopeResults?: any[];
  iterationNumber?: number;
  marketStatus?: string;
}

export interface ContinuousProgressiveResult {
  totalIterations: number;
  allResults: ProgressiveStepResult[];
  finalStatus: string;
  marketCloseTime: string;
  executionStartTime: string;
  executionEndTime: string;
}

export class ProgressiveThreeStepProcessor {
  private fyersAPI: FyersAPI;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * STEP 1: Start with 5-min timeframe, 4 candles
   * Wait for 5th and 6th candles to complete
   */
  async executeStep1(symbol: string, date: string): Promise<ProgressiveStepResult> {
    console.log('🚀 [STEP 1] Starting with 5-min timeframe, 4 candles');
    
    const timeframe = 5;
    const candles = await this.fyersAPI.getHistoricalData({
      symbol,
      resolution: timeframe.toString(),
      date_format: '1',
      range_from: date,
      range_to: date,
      cont_flag: '1'
    });

    if (!candles || candles.length < 4) {
      throw new Error('Insufficient candles for Step 1 (need at least 4 candles)');
    }

    // Take first 4 candles as initial analysis
    const initialCandles = candles.slice(0, 4);
    console.log(`📊 [STEP 1] Initial 4 candles collected at ${timeframe}-min timeframe`);

    // C1 Block = candles 1,2 | C2 Block = candles 3,4
    const c1Block = initialCandles.slice(0, 2);
    const c2Block = initialCandles.slice(2, 4);

    console.log(`🔧 [STEP 1] C1 Block: ${c1Block.length} candles | C2 Block: ${c2Block.length} candles`);

    // Check if 5th and 6th candles are available
    const canProceedToNext = candles.length >= 6;
    const c3Block = canProceedToNext ? candles.slice(4, 6) : undefined;

    return {
      step: 1,
      timeframe,
      c1Block,
      c2Block,
      c3Block,
      stepDescription: 'Initial 4-candle analysis with 5-min timeframe',
      canProceedToNext,
      nextStepAction: canProceedToNext ? 'Proceed to Step 2: Check count equality' : 'Wait for 5th and 6th candles'
    };
  }

  /**
   * STEP 2: Check if count(C1) = count(C2)
   * If yes: Combine C1+C2 as new C1, C3 (5th,6th) becomes new C2
   */
  async executeStep2(step1Result: ProgressiveStepResult): Promise<ProgressiveStepResult> {
    console.log('🚀 [STEP 2] Checking count equality: count(C1) = count(C2)');
    
    if (!step1Result.c3Block || step1Result.c3Block.length < 2) {
      throw new Error('Step 2 requires completed 5th and 6th candles');
    }

    const c1Count = step1Result.c1Block.length;
    const c2Count = step1Result.c2Block.length;
    const c3Count = step1Result.c3Block.length;

    console.log(`📊 [STEP 2] Current counts - C1: ${c1Count}, C2: ${c2Count}, C3: ${c3Count}`);

    const isCountEqual = c1Count === c2Count;
    console.log(`⚖️ [STEP 2] Count equality check: ${c1Count} === ${c2Count} = ${isCountEqual}`);

    if (isCountEqual) {
      // STEP 2 LOGIC: C1+C2 combine as new C1, C3 becomes new C2
      const newC1Block = [...step1Result.c1Block, ...step1Result.c2Block];
      const newC2Block = step1Result.c3Block;

      console.log(`🔄 [STEP 2] COMBINATION: C1(${c1Count}) + C2(${c2Count}) → NEW C1(${newC1Block.length})`);
      console.log(`🔄 [STEP 2] C3(${c3Count}) → NEW C2(${newC2Block.length})`);

      // Now we need to find new C3 block with count = new C2 count
      const requiredC3Count = newC2Block.length;
      console.log(`🎯 [STEP 2] Need to find NEW C3 block with ${requiredC3Count} candles`);

      return {
        step: 2,
        timeframe: step1Result.timeframe,
        c1Block: newC1Block,
        c2Block: newC2Block,
        stepDescription: `Step 2: Combined C1+C2→NEW C1(${newC1Block.length}), C3→NEW C2(${newC2Block.length})`,
        canProceedToNext: true,
        nextStepAction: `Find NEW C3 block with ${requiredC3Count} candles`
      };
    } else {
      // Count not equal, will need Step 3
      console.log(`❌ [STEP 2] Count not equal (${c1Count} ≠ ${c2Count}), preparing for Step 3`);
      
      return {
        step: 2,
        timeframe: step1Result.timeframe,
        c1Block: step1Result.c1Block,
        c2Block: step1Result.c2Block,
        c3Block: step1Result.c3Block,
        stepDescription: `Step 2: Count not equal (C1:${c1Count} ≠ C2:${c2Count}), prepare Step 3`,
        canProceedToNext: true,
        nextStepAction: 'Proceed to Step 3: Combine C2+C3 as new C2'
      };
    }
  }

  /**
   * STEP 3: If count(C1) ≠ count(C2)
   * Combine C2+C3 as new C2, C1 remains same
   */
  async executeStep3(step2Result: ProgressiveStepResult): Promise<ProgressiveStepResult> {
    console.log('🚀 [STEP 3] Combining C2+C3 as new C2, C1 remains same');
    
    if (!step2Result.c3Block) {
      throw new Error('Step 3 requires C3 block');
    }

    const c1Count = step2Result.c1Block.length;
    const c2Count = step2Result.c2Block.length;
    const c3Count = step2Result.c3Block.length;

    console.log(`📊 [STEP 3] Current counts - C1: ${c1Count}, C2: ${c2Count}, C3: ${c3Count}`);

    // STEP 3 LOGIC: C2+C3 combine as new C2, C1 remains unchanged
    const newC1Block = step2Result.c1Block; // C1 stays the same
    const newC2Block = [...step2Result.c2Block, ...step2Result.c3Block];

    console.log(`🔄 [STEP 3] C1 remains: ${newC1Block.length} candles`);
    console.log(`🔄 [STEP 3] COMBINATION: C2(${c2Count}) + C3(${c3Count}) → NEW C2(${newC2Block.length})`);

    // Now we need to find new C3 block with count = new C2 count
    const requiredC3Count = newC2Block.length;
    console.log(`🎯 [STEP 3] Need to find NEW C3 block with ${requiredC3Count} candles`);

    return {
      step: 3,
      timeframe: step2Result.timeframe,
      c1Block: newC1Block,
      c2Block: newC2Block,
      stepDescription: `Step 3: C2(${c2Count})+C3(${c3Count})→NEW C2(${newC2Block.length}), C1 unchanged(${newC1Block.length})`,
      canProceedToNext: true,
      nextStepAction: `Find NEW C3 block with ${requiredC3Count} candles`
    };
  }

  /**
   * STEP 3 COMPLETION LOGIC: After C3 block completion
   * Check if count(C2 block) = count(C1 block)
   * If NOT satisfied: combine C2+C3 blocks to form new C2 block, predict new C3 block with 4 candles
   */
  async executeStep3Completion(previousResult: ProgressiveStepResult, completedC3Block: any[]): Promise<ProgressiveStepResult> {
    console.log('🚀 [STEP 3 COMPLETION] After C3 block completion - checking count equality');
    
    const c1Count = previousResult.c1Block.length;
    const c2Count = previousResult.c2Block.length;
    const c3Count = completedC3Block.length;

    console.log(`📊 [STEP 3 COMPLETION] Current counts - C1: ${c1Count}, C2: ${c2Count}, C3: ${c3Count}`);

    // Check if count(C2 block) = count(C1 block)
    const isCountEqual = c2Count === c1Count;
    console.log(`⚖️ [STEP 3 COMPLETION] Count equality check: count(C2)=${c2Count} === count(C1)=${c1Count} = ${isCountEqual}`);

    if (isCountEqual) {
      console.log(`✅ [STEP 3 COMPLETION] Count condition satisfied - no combination needed`);
      
      return {
        step: 3,
        timeframe: previousResult.timeframe,
        c1Block: previousResult.c1Block,
        c2Block: previousResult.c2Block,
        c3Block: completedC3Block,
        stepDescription: `Step 3 Completion: Count condition satisfied (C1:${c1Count} = C2:${c2Count})`,
        canProceedToNext: false,
        nextStepAction: 'Analysis complete - count condition satisfied'
      };
    } else {
      // STEP 3 COMPLETION RULE: Combine C2+C3 blocks to form new C2 block
      console.log(`❌ [STEP 3 COMPLETION] Count condition NOT satisfied (${c2Count} ≠ ${c1Count})`);
      console.log(`🔄 [STEP 3 COMPLETION] Combining C2+C3 blocks to form new C2 block`);

      const newC1Block = previousResult.c1Block; // C1 block remains unchanged
      const newC2Block = [...previousResult.c2Block, ...completedC3Block]; // Combine C2+C3

      console.log(`🔄 [STEP 3 COMPLETION] C1 block remains: ${newC1Block.length} candles`);
      console.log(`🔄 [STEP 3 COMPLETION] NEW C2 block: C2(${c2Count}) + C3(${c3Count}) = ${newC2Block.length} candles`);

      // Since count(C2) = count(C3), predict new C3 block with 4 candles
      const newC3Count = newC2Block.length; // count(C2) = count(C3)
      console.log(`🎯 [STEP 3 COMPLETION] Predicting NEW C3 block with ${newC3Count} candles (since count(C2)=${newC2Block.length} = count(C3))`);

      // For now, we'll indicate that we need 4 candles for the new C3 block
      // In a real implementation, this would fetch the next candles from the market
      const predictedC3Count = 4; // As per user requirement: "predict 4 candle because count(c2) = count(c3)"
      console.log(`📈 [STEP 3 COMPLETION] System will predict ${predictedC3Count} candles for NEW C3 block`);

      return {
        step: 3,
        timeframe: previousResult.timeframe,
        c1Block: newC1Block,
        c2Block: newC2Block,
        stepDescription: `Step 3 Completion: Combined C2(${c2Count})+C3(${c3Count})→NEW C2(${newC2Block.length}), predicting NEW C3(${predictedC3Count})`,
        canProceedToNext: true,
        nextStepAction: `Fetch and predict NEW C3 block with ${predictedC3Count} candles using C1 and NEW C2 blocks`
      };
    }
  }

  /**
   * Execute complete progressive methodology
   */
  async executeProgressive(symbol: string, date: string): Promise<ProgressiveStepResult[]> {
    console.log('🌟 [PROGRESSIVE] Starting complete 3-step progressive methodology');
    
    const results: ProgressiveStepResult[] = [];

    // STEP 1: Initial 4-candle analysis
    const step1 = await this.executeStep1(symbol, date);
    results.push(step1);

    if (!step1.canProceedToNext) {
      console.log('⏳ [PROGRESSIVE] Waiting for 5th and 6th candles to complete');
      return results;
    }

    // STEP 2: Count equality check and combination logic
    const step2 = await this.executeStep2(step1);
    results.push(step2);

    const c1Count = step1.c1Block.length;
    const c2Count = step1.c2Block.length;

    // If counts were not equal, execute Step 3
    if (c1Count !== c2Count) {
      const step3 = await this.executeStep3(step2);
      results.push(step3);
    }

    console.log(`✅ [PROGRESSIVE] Completed ${results.length} steps`);
    return results;
  }

  /**
   * Get market close time for symbol
   */
  private getMarketCloseTime(symbol: string): Date {
    const today = new Date();
    
    // Indian market (NSE/BSE) closes at 3:30 PM IST
    if (symbol.includes('NSE:') || symbol.includes('BSE:')) {
      const closeTime = new Date(today);
      closeTime.setHours(15, 30, 0, 0); // 3:30 PM
      return closeTime;
    }
    
    // Default to 3:30 PM for other markets
    const closeTime = new Date(today);
    closeTime.setHours(15, 30, 0, 0);
    return closeTime;
  }

  /**
   * Check if market is still open
   */
  private isMarketOpen(symbol: string): boolean {
    const now = new Date();
    const marketClose = this.getMarketCloseTime(symbol);
    return now < marketClose;
  }

  /**
   * Execute continuous progressive methodology until market close
   */
  async executeContinuousProgressive(symbol: string, date: string): Promise<ContinuousProgressiveResult> {
    const startTime = new Date();
    console.log('🔄 [CONTINUOUS] Starting continuous progressive methodology until market close');
    
    const allResults: ProgressiveStepResult[] = [];
    let iterationNumber = 1;
    let currentBlocks: { c1: any[], c2: any[], c3: any[] } = { c1: [], c2: [], c3: [] };

    while (this.isMarketOpen(symbol)) {
      console.log(`\n🔁 [ITERATION ${iterationNumber}] Starting progressive cycle...`);
      
      try {
        // Execute complete progressive methodology for current iteration
        const iterationResults = await this.executeProgressive(symbol, date);
        
        // Add iteration number to each result
        iterationResults.forEach(result => {
          result.iterationNumber = iterationNumber;
          result.marketStatus = this.isMarketOpen(symbol) ? 'OPEN' : 'CLOSED';
        });
        
        allResults.push(...iterationResults);
        
        // Get the latest blocks from the last step
        const lastResult = iterationResults[iterationResults.length - 1];
        if (lastResult) {
          currentBlocks.c1 = lastResult.c1Block;
          currentBlocks.c2 = lastResult.c2Block;
          if (lastResult.c3Block) {
            currentBlocks.c3 = lastResult.c3Block;
          }
        }

        console.log(`✅ [ITERATION ${iterationNumber}] Completed - ${iterationResults.length} steps processed`);
        console.log(`📊 [ITERATION ${iterationNumber}] Current blocks: C1(${currentBlocks.c1.length}), C2(${currentBlocks.c2.length}), C3(${currentBlocks.c3.length})`);
        
        iterationNumber++;
        
        // Wait for new candles (5 minutes for 5-min timeframe)
        if (this.isMarketOpen(symbol)) {
          console.log('⏳ [CONTINUOUS] Waiting 5 minutes for new candles...');
          await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes
        }
        
      } catch (error) {
        console.error(`❌ [ITERATION ${iterationNumber}] Error:`, error);
        // Continue to next iteration on error
        await new Promise(resolve => setTimeout(resolve, 60 * 1000)); // Wait 1 minute on error
      }
    }

    const endTime = new Date();
    const marketCloseTime = this.getMarketCloseTime(symbol);

    console.log('🏁 [CONTINUOUS] Market closed - Progressive methodology completed');
    console.log(`📈 [CONTINUOUS] Total iterations: ${iterationNumber - 1}`);
    console.log(`📊 [CONTINUOUS] Total steps processed: ${allResults.length}`);

    return {
      totalIterations: iterationNumber - 1,
      allResults,
      finalStatus: 'MARKET_CLOSED',
      marketCloseTime: marketCloseTime.toISOString(),
      executionStartTime: startTime.toISOString(),
      executionEndTime: endTime.toISOString()
    };
  }

  /**
   * Get current progressive status
   */
  async getProgressiveStatus(symbol: string): Promise<{
    marketOpen: boolean;
    marketCloseTime: string;
    currentTime: string;
    timeUntilClose: number; // minutes
  }> {
    const now = new Date();
    const marketClose = this.getMarketCloseTime(symbol);
    const timeUntilClose = Math.max(0, Math.floor((marketClose.getTime() - now.getTime()) / (1000 * 60)));

    return {
      marketOpen: this.isMarketOpen(symbol),
      marketCloseTime: marketClose.toISOString(),
      currentTime: now.toISOString(),
      timeUntilClose
    };
  }
}