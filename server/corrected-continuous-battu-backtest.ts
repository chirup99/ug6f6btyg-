// import { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

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

interface BacktestCycle {
  cycleNumber: number;
  C1Block: BlockData;
  C2Block: BlockData;
  C3Block: BlockData;
  backtestResult: any;
  totalCandlesProcessed: number;
  mergeAction: 'C1+C2→newC1,C3→newC2' | 'C2+C3→newC2,C1same' | 'initial';
}

interface ContinuousBacktestResult {
  success: boolean;
  method: string;
  symbol: string;
  date: string;
  timeframe: string;
  totalCycles: number;
  completedCycles: BacktestCycle[];
  marketOpenTime: string;
  marketCloseTime: string;
  totalCandles: number;
  processingStatus: string;
}

export class CorrectedContinuousBattuBacktest {
  private fyersAPI: FyersAPI;
  private allMarketCandles: CandleData[] = [];
  private backtestCycles: BacktestCycle[] = [];

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * CORRECTED METHODOLOGY: Start with 4 candles, progressive block merging
   * 1. First 4 candles: C1(C1A+C1B=2), C2(C2A+C2B=2)
   * 2. Find C3(C3A+C3B=2) → total 6 candles
   * 3. If count(C1)=count(C2): merge C1+C2→newC1, C3→newC2
   * 4. If count(C1)≠count(C2): merge C2+C3→newC2, C1 stays same
   * 5. Continue until market close
   */
  async startContinuousBacktest(symbol: string, date: string, timeframe: string): Promise<ContinuousBacktestResult> {
    console.log(`🚀 [CORRECTED BACKTEST] Starting corrected continuous backtest for ${symbol} on ${date} (${timeframe}min)`);
    
    // Reset state
    this.allMarketCandles = [];
    this.backtestCycles = [];
    
    // Fetch all market data
    await this.fetchAllMarketCandles(symbol, date, timeframe);
    
    if (this.allMarketCandles.length < 6) {
      throw new Error(`Need minimum 6 candles, got ${this.allMarketCandles.length}`);
    }

    console.log(`📊 [CORRECTED BACKTEST] Loaded ${this.allMarketCandles.length} market candles`);
    
    // STEP 1: Initialize with first 4 candles from market open
    let currentC1Block = this.createInitialC1Block(); // First 2 candles (C1A+C1B)
    let currentC2Block = this.createInitialC2Block(); // Next 2 candles (C2A+C2B)
    let totalProcessedCandles = 4;
    let cycleNumber = 1;
    
    console.log(`🎯 [INITIAL SETUP] C1(2 candles) + C2(2 candles) from market open`);
    console.log(`📊 C1 Block: ${currentC1Block.candles.length} candles (${currentC1Block.name})`);
    console.log(`📊 C2 Block: ${currentC2Block.candles.length} candles (${currentC2Block.name})`);
    
    // STEP 2: Continuous backtesting until market close
    while (totalProcessedCandles < this.allMarketCandles.length - 1) {
      console.log(`\n🔄 [CYCLE ${cycleNumber}] Processing cycle...`);
      console.log(`📍 Current state: Processed ${totalProcessedCandles}/${this.allMarketCandles.length} candles`);
      
      try {
        // Find C3 block with same count as current C2 block
        const c2Count = currentC2Block.candles.length;
        const c3Block = this.findC3Block(totalProcessedCandles, c2Count, cycleNumber);
        
        if (!c3Block) {
          console.log(`⚠️ [CYCLE ${cycleNumber}] Cannot create C3 block - insufficient candles`);
          break;
        }
        
        totalProcessedCandles += c3Block.candles.length;
        console.log(`✅ [CYCLE ${cycleNumber}] Found C3(${c3Block.candles.length}) - Total processed: ${totalProcessedCandles}`);
        
        // Perform Battu analysis
        const backtestResult = await this.performBattuAnalysis(currentC1Block, currentC2Block, c3Block, cycleNumber);
        
        // Check count equality for merging logic
        const c1Count = currentC1Block.candles.length;
        const c2Count2 = currentC2Block.candles.length;
        let mergeAction: BacktestCycle['mergeAction'];
        
        if (c1Count === c2Count2) {
          console.log(`🔄 [MERGE] count(C1)=${c1Count} = count(C2)=${c2Count2} → Merging C1+C2→newC1, C3→newC2`);
          
          // Merge C1+C2 to create new C1 block
          currentC1Block = this.mergeC1C2Blocks(currentC1Block, currentC2Block, cycleNumber);
          
          // C3 becomes new C2 block
          currentC2Block = {
            ...c3Block,
            name: `C2_FROM_C3_CYCLE_${cycleNumber}`
          };
          
          mergeAction = 'C1+C2→newC1,C3→newC2';
          
        } else {
          console.log(`➡️ [NO MERGE] count(C1)=${c1Count} ≠ count(C2)=${c2Count2} → Merging C2+C3→newC2`);
          
          // Merge C2+C3 to create new C2 block (C1 stays same)
          currentC2Block = this.mergeC2C3Blocks(currentC2Block, c3Block, cycleNumber);
          
          mergeAction = 'C2+C3→newC2,C1same';
        }
        
        // Store completed cycle
        this.backtestCycles.push({
          cycleNumber,
          C1Block: {...currentC1Block},
          C2Block: {...currentC2Block},
          C3Block: c3Block,
          backtestResult,
          totalCandlesProcessed: totalProcessedCandles,
          mergeAction
        });
        
        console.log(`📊 [CYCLE ${cycleNumber}] Complete - New C1(${currentC1Block.candles.length}) + C2(${currentC2Block.candles.length})`);
        cycleNumber++;
        
        // Safety limit
        if (cycleNumber > 100) {
          console.warn('⚠️ [SAFETY] Reached maximum cycle limit');
          break;
        }
        
      } catch (error) {
        console.log(`⚠️ [CYCLE ${cycleNumber}] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }
    
    console.log(`🎯 [CORRECTED BACKTEST] Completed ${this.backtestCycles.length} cycles`);
    
    return {
      success: true,
      method: 'corrected_continuous_battu_backtest',
      symbol,
      date,
      timeframe,
      totalCycles: this.backtestCycles.length,
      completedCycles: this.backtestCycles,
      marketOpenTime: this.allMarketCandles[0]?.timestamp || '',
      marketCloseTime: this.allMarketCandles[this.allMarketCandles.length - 1]?.timestamp || '',
      totalCandles: this.allMarketCandles.length,
      processingStatus: 'completed'
    };
  }

  /**
   * Fetch all market candles from Fyers API
   */
  private async fetchAllMarketCandles(symbol: string, date: string, timeframe: string): Promise<void> {
    try {
      const historicalData = await this.fyersAPI.getHistoricalData({
        symbol,
        resolution: timeframe,
        date_format: '1',
        range_from: date,
        range_to: date,
        cont_flag: '1'
      });

      if (!Array.isArray(historicalData) || historicalData.length === 0) {
        throw new Error(`No historical data returned from Fyers API for ${symbol} on ${date}`);
      }

      this.allMarketCandles = historicalData.map((candle: any, index: number) => {
        if (!candle.timestamp || isNaN(candle.timestamp)) {
          throw new Error(`Invalid timestamp data at index ${index}: ${candle.timestamp}`);
        }
        
        const date = new Date(candle.timestamp * 1000);
        if (isNaN(date.getTime())) {
          throw new Error(`Failed to convert timestamp to date at index ${index}: ${candle.timestamp}`);
        }
        
        return {
          timestamp: date.toISOString(),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || 0
        };
      });

      console.log(`📈 [CORRECTED BACKTEST] Fetched ${this.allMarketCandles.length} candles from ${symbol} on ${date}`);
    } catch (error) {
      console.error('❌ [CORRECTED BACKTEST] Failed to fetch market candles:', error);
      throw error;
    }
  }

  /**
   * Create initial C1 block from first 2 candles (C1A + C1B)
   */
  private createInitialC1Block(): BlockData {
    const candles = this.allMarketCandles.slice(0, 2);
    
    return {
      name: 'C1_INITIAL',
      candles,
      startIndex: 0,
      endIndex: 1,
      high: this.findBlockHigh(candles),
      low: this.findBlockLow(candles)
    };
  }

  /**
   * Create initial C2 block from candles 2-3 (C2A + C2B)
   */
  private createInitialC2Block(): BlockData {
    const candles = this.allMarketCandles.slice(2, 4);
    
    return {
      name: 'C2_INITIAL',
      candles,
      startIndex: 2,
      endIndex: 3,
      high: this.findBlockHigh(candles),
      low: this.findBlockLow(candles)
    };
  }

  /**
   * Find C3 block with same count as C2 block
   */
  private findC3Block(startIndex: number, requiredCount: number, cycleNumber: number): BlockData | null {
    const endIndex = startIndex + requiredCount - 1;
    
    if (endIndex >= this.allMarketCandles.length) {
      return null;
    }
    
    const candles = this.allMarketCandles.slice(startIndex, startIndex + requiredCount);
    
    return {
      name: `C3_CYCLE_${cycleNumber}`,
      candles,
      startIndex,
      endIndex,
      high: this.findBlockHigh(candles),
      low: this.findBlockLow(candles)
    };
  }

  /**
   * Merge C1 and C2 blocks to create new C1 block
   */
  private mergeC1C2Blocks(c1Block: BlockData, c2Block: BlockData, cycleNumber: number): BlockData {
    const mergedCandles = [...c1Block.candles, ...c2Block.candles];
    
    return {
      name: `C1_MERGED_CYCLE_${cycleNumber}`,
      candles: mergedCandles,
      startIndex: c1Block.startIndex,
      endIndex: c2Block.endIndex,
      high: this.findBlockHigh(mergedCandles),
      low: this.findBlockLow(mergedCandles)
    };
  }

  /**
   * Merge C2 and C3 blocks to create new C2 block
   */
  private mergeC2C3Blocks(c2Block: BlockData, c3Block: BlockData, cycleNumber: number): BlockData {
    const mergedCandles = [...c2Block.candles, ...c3Block.candles];
    
    return {
      name: `C2_MERGED_CYCLE_${cycleNumber}`,
      candles: mergedCandles,
      startIndex: c2Block.startIndex,
      endIndex: c3Block.endIndex,
      high: this.findBlockHigh(mergedCandles),
      low: this.findBlockLow(mergedCandles)
    };
  }

  /**
   * Find highest price and timestamp in block
   */
  private findBlockHigh(candles: CandleData[]): { price: number; timestamp: string } {
    let maxHigh = -Infinity;
    let timestamp = '';
    
    for (const candle of candles) {
      if (candle.high > maxHigh) {
        maxHigh = candle.high;
        timestamp = candle.timestamp;
      }
    }
    
    return { price: maxHigh, timestamp };
  }

  /**
   * Find lowest price and timestamp in block
   */
  private findBlockLow(candles: CandleData[]): { price: number; timestamp: string } {
    let minLow = Infinity;
    let timestamp = '';
    
    for (const candle of candles) {
      if (candle.low < minLow) {
        minLow = candle.low;
        timestamp = candle.timestamp;
      }
    }
    
    return { price: minLow, timestamp };
  }

  /**
   * Perform Battu analysis on C1+C2 → C3 pattern
   */
  private async performBattuAnalysis(c1Block: BlockData, c2Block: BlockData, c3Block: BlockData, cycleNumber: number): Promise<any> {
    console.log(`📊 [BATTU ANALYSIS CYCLE ${cycleNumber}] Analyzing C1+C2 → C3 pattern...`);
    
    // Mock analysis for now - this would integrate with existing Battu analysis
    return {
      analysisType: 'corrected_continuous_backtest',
      c1BlockCount: c1Block.candles.length,
      c2BlockCount: c2Block.candles.length,
      c3BlockCount: c3Block.candles.length,
      cycle: cycleNumber,
      timestamp: new Date().toISOString()
    };
  }
}