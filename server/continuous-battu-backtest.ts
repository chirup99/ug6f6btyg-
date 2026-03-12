// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BacktestBlock {
  name: string;
  candles: CandleData[];
  startIndex: number;
  endIndex: number;
  high: { price: number; timestamp: string };
  low: { price: number; timestamp: string };
}

interface BacktestCycle {
  cycleNumber: number;
  C1Block: BacktestBlock;
  C2Block: BacktestBlock;
  C3Block: BacktestBlock;
  slopeResults: any[];
  completed: boolean;
  timestamp: string;
}

interface ContinuousBacktestResult {
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

export class ContinuousBattuBacktest {
  private fyersAPI: FyersAPI;
  private allMarketCandles: CandleData[] = [];
  private currentCycleIndex = 0;
  private backtestCycles: BacktestCycle[] = [];

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * Main continuous backtesting function - implements the proper cycle progression
   */
  async startContinuousBacktest(symbol: string, date: string, timeframe: string): Promise<ContinuousBacktestResult> {
    console.log('🔄 [CONTINUOUS BACKTEST] Starting continuous Battu backtesting from market open to close...');
    
    // STEP 1: Fetch all market candles from open to close
    await this.fetchAllMarketCandles(symbol, date, timeframe);
    
    if (this.allMarketCandles.length < 6) {
      throw new Error(`Need minimum 6 candles for continuous backtesting, got ${this.allMarketCandles.length}`);
    }

    console.log(`📊 [CONTINUOUS BACKTEST] Loaded ${this.allMarketCandles.length} market candles for continuous processing`);
    
    // STEP 2: Start continuous backtesting cycle
    let currentIndex = 0;
    let cycleNumber = 1;
    
    while (currentIndex + 5 < this.allMarketCandles.length) { // Need at least 6 candles (C1A,C1B,C2A,C2B,C3A,C3B)
      console.log(`\n🔄 [CYCLE ${cycleNumber}] Starting backtest cycle at candle index ${currentIndex}...`);
      
      // STEP 3: Create C1, C2 blocks for current cycle
      const { c1Block, c2Block, nextIndex } = this.createC1C2Blocks(currentIndex, cycleNumber);
      
      // STEP 4: Predict and backtest C3 block
      const c3Block = this.createC3Block(nextIndex, c1Block, c2Block, cycleNumber);
      
      // STEP 5: Apply Battu analysis to this cycle
      const slopeResults = await this.applyCycleBattuAnalysis(c1Block, c2Block, c3Block);
      
      // STEP 6: Store completed cycle
      const cycle: BacktestCycle = {
        cycleNumber,
        C1Block: c1Block,
        C2Block: c2Block,
        C3Block: c3Block,
        slopeResults,
        completed: true,
        timestamp: new Date().toISOString()
      };
      
      this.backtestCycles.push(cycle);
      console.log(`✅ [CYCLE ${cycleNumber}] Completed - C1(${c1Block.candles.length}) + C2(${c2Block.candles.length}) → C3(${c3Block.candles.length})`);
      
      // STEP 7: Move to next cycle - CRITICAL PROGRESSION LOGIC
      currentIndex = this.calculateNextCycleStartIndex(c1Block, c2Block, c3Block);
      cycleNumber++;
      
      // Safety check to prevent infinite loops
      if (cycleNumber > 100) {
        console.warn('⚠️ [CONTINUOUS BACKTEST] Reached maximum cycle limit (100) - stopping');
        break;
      }
    }
    
    console.log(`🎯 [CONTINUOUS BACKTEST] Completed ${this.backtestCycles.length} cycles from market open to close`);
    
    return {
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
   * Fetch all market candles from market open to close
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

      console.log(`🔍 [CONTINUOUS BACKTEST] Raw data structure:`, historicalData?.slice(0, 2));

      if (!Array.isArray(historicalData) || historicalData.length === 0) {
        throw new Error(`No historical data returned from Fyers API for ${symbol} on ${date}`);
      }

      // FyersAPI.getHistoricalData already returns CandleData[] format with proper structure
      this.allMarketCandles = historicalData.map((candle: any, index: number) => {
        // Validate the candle data structure
        if (!candle.timestamp || isNaN(candle.timestamp)) {
          console.warn(`⚠️ Invalid timestamp at index ${index}:`, candle.timestamp, 'Full candle:', candle);
          throw new Error(`Invalid timestamp data at index ${index}: ${candle.timestamp}`);
        }
        
        const date = new Date(candle.timestamp * 1000);
        if (isNaN(date.getTime())) {
          console.warn(`⚠️ Invalid date conversion at index ${index}:`, candle.timestamp);
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

      console.log(`📈 [CONTINUOUS BACKTEST] Fetched ${this.allMarketCandles.length} candles from ${symbol} on ${date}`);
    } catch (error) {
      console.error('❌ [CONTINUOUS BACKTEST] Failed to fetch market candles:', error);
      throw error;
    }
  }

  /**
   * Create C1 and C2 blocks for current cycle using count(C1) = count(C2) rule
   */
  private createC1C2Blocks(startIndex: number, cycleNumber: number): {
    c1Block: BacktestBlock;
    c2Block: BacktestBlock; 
    nextIndex: number;
  } {
    console.log(`🔧 [CYCLE ${cycleNumber}] Creating C1,C2 blocks starting from index ${startIndex}...`);
    
    // Available candles for C1+C2 (reserve some for C3)
    const remainingCandles = this.allMarketCandles.length - startIndex;
    const maxForC1C2 = Math.min(remainingCandles - 2, 10); // Reserve 2 for C3, max 10 for C1+C2
    
    if (maxForC1C2 < 4) {
      throw new Error(`Not enough candles remaining for C1+C2 blocks: ${maxForC1C2}`);
    }
    
    // Apply count(C1) = count(C2) rule
    const totalC1C2 = Math.floor(maxForC1C2 / 2) * 2; // Ensure even number
    const candlesPerBlock = totalC1C2 / 2;
    
    // Create C1 block
    const c1Candles = this.allMarketCandles.slice(startIndex, startIndex + candlesPerBlock);
    const c1Block: BacktestBlock = {
      name: `C1_CYCLE_${cycleNumber}`,
      candles: c1Candles,
      startIndex,
      endIndex: startIndex + candlesPerBlock - 1,
      high: this.findHighestPoint(c1Candles),
      low: this.findLowestPoint(c1Candles)
    };
    
    // Create C2 block  
    const c2StartIndex = startIndex + candlesPerBlock;
    const c2Candles = this.allMarketCandles.slice(c2StartIndex, c2StartIndex + candlesPerBlock);
    const c2Block: BacktestBlock = {
      name: `C2_CYCLE_${cycleNumber}`,
      candles: c2Candles,
      startIndex: c2StartIndex,
      endIndex: c2StartIndex + candlesPerBlock - 1,
      high: this.findHighestPoint(c2Candles),
      low: this.findLowestPoint(c2Candles)
    };
    
    console.log(`✅ [CYCLE ${cycleNumber}] Created C1(${c1Block.candles.length}) and C2(${c2Block.candles.length}) blocks - count(C1) = count(C2) ✓`);
    
    return {
      c1Block,
      c2Block,
      nextIndex: c2StartIndex + candlesPerBlock
    };
  }

  /**
   * Create C3 block (this is what we backtest/predict)
   */
  private createC3Block(startIndex: number, c1Block: BacktestBlock, c2Block: BacktestBlock, cycleNumber: number): BacktestBlock {
    // C3 block gets the next available candles (usually 2-4 candles)
    const maxC3Size = Math.min(4, this.allMarketCandles.length - startIndex);
    const c3Candles = this.allMarketCandles.slice(startIndex, startIndex + maxC3Size);
    
    const c3Block: BacktestBlock = {
      name: `C3_CYCLE_${cycleNumber}`,
      candles: c3Candles,
      startIndex,
      endIndex: startIndex + c3Candles.length - 1,
      high: this.findHighestPoint(c3Candles),
      low: this.findLowestPoint(c3Candles)
    };
    
    console.log(`🎯 [CYCLE ${cycleNumber}] Created C3(${c3Block.candles.length}) block for backtesting`);
    return c3Block;
  }

  /**
   * Apply Battu analysis to the current cycle blocks
   */
  private async applyCycleBattuAnalysis(c1Block: BacktestBlock, c2Block: BacktestBlock, c3Block: BacktestBlock): Promise<any[]> {
    // This is where we apply the actual Battu slope calculation logic
    // Using C1 + C2 to analyze/predict C3 performance
    
    console.log(`📊 [BATTU ANALYSIS] Analyzing C1+C2 → C3 pattern...`);
    
    // Calculate uptrend: C1 lowest → C2 highest  
    const uptrendSlope = this.calculateSlope(c1Block.low, c2Block.high, 'uptrend');
    
    // Calculate downtrend: C1 highest → C2 lowest
    const downtrendSlope = this.calculateSlope(c1Block.high, c2Block.low, 'downtrend');
    
    return [uptrendSlope, downtrendSlope];
  }

  /**
   * Calculate next cycle start index - CRITICAL for continuous progression
   */
  private calculateNextCycleStartIndex(c1Block: BacktestBlock, c2Block: BacktestBlock, c3Block: BacktestBlock): number {
    // METHODOLOGY: After C3 completes, next cycle starts after C1 block
    // This ensures we don't skip candles and maintain continuous market coverage
    
    const nextIndex = c1Block.endIndex + 1;
    console.log(`➡️ [PROGRESSION] Next cycle will start at index ${nextIndex} (after current C1 block)`);
    
    return nextIndex;
  }

  /**
   * Helper functions
   */
  private findHighestPoint(candles: CandleData[]): { price: number; timestamp: string } {
    const highest = candles.reduce((max, candle) => candle.high > max.high ? candle : max);
    return { price: highest.high, timestamp: highest.timestamp };
  }

  private findLowestPoint(candles: CandleData[]): { price: number; timestamp: string } {
    const lowest = candles.reduce((min, candle) => candle.low < min.low ? candle : min);
    return { price: lowest.low, timestamp: lowest.timestamp };
  }

  private calculateSlope(pointA: { price: number; timestamp: string }, pointB: { price: number; timestamp: string }, type: string): any {
    const timeA = new Date(pointA.timestamp).getTime();
    const timeB = new Date(pointB.timestamp).getTime();
    const timeDiffMinutes = Math.abs(timeB - timeA) / (1000 * 60);
    const priceDiff = pointB.price - pointA.price;
    const slope = timeDiffMinutes > 0 ? priceDiff / timeDiffMinutes : 0;
    
    return {
      type,
      pointA,
      pointB,
      slope,
      duration: timeDiffMinutes
    };
  }
}