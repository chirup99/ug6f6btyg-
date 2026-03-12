// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BlockStructure {
  name: string;
  candles: CandleData[];
  count: number;
  startTime: string;
  endTime: string;
  high: { price: number; timestamp: string };
  low: { price: number; timestamp: string };
  subBlocks?: {
    A: SubBlockStructure;
    B: SubBlockStructure;
  };
}

interface SubBlockStructure {
  name: string;
  candles: CandleData[];
  count: number;
  high: { price: number; timestamp: string };
  low: { price: number; timestamp: string };
}

interface DynamicBlockRotationResult {
  rotationApplied: boolean;
  rotationReason: string;
  currentBlocks: {
    C1: BlockStructure;
    C2: BlockStructure;
    C3?: BlockStructure;
  };
  rotationHistory: Array<{
    step: number;
    condition: string;
    action: string;
    timestamp: string;
  }>;
  nextPredictionTarget?: string;
}

export class DynamicBlockRotator {
  private fyersAPI: FyersAPI;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * Equal division logic for expanded blocks
   * C1 BLOCK (4 candles): C1A = candles [1,2], C1B = candles [3,4]
   * C2/C3 BLOCK (>2 candles): share equally between A and B sub-blocks
   */
  private divideBlockEqually(block: BlockStructure): BlockStructure {
    if (block.count <= 2) {
      // No division needed for 2 or fewer candles
      return block;
    }

    const halfPoint = Math.ceil(block.count / 2);
    const candlesA = block.candles.slice(0, halfPoint);
    const candlesB = block.candles.slice(halfPoint);

    // Create sub-block A
    const subBlockA: SubBlockStructure = {
      name: `${block.name.replace('BLOCK', 'A')}`,
      candles: candlesA,
      count: candlesA.length,
      high: this.findHighestCandle(candlesA),
      low: this.findLowestCandle(candlesA)
    };

    // Create sub-block B  
    const subBlockB: SubBlockStructure = {
      name: `${block.name.replace('BLOCK', 'B')}`,
      candles: candlesB,
      count: candlesB.length,
      high: this.findHighestCandle(candlesB),
      low: this.findLowestCandle(candlesB)
    };

    // Return block with sub-blocks
    return {
      ...block,
      subBlocks: {
        A: subBlockA,
        B: subBlockB
      }
    };
  }

  /**
   * Divide NEW C2 block (old C3) into C2A and C2B sub-blocks
   */
  private divideC2Block(c2Block: BlockStructure): BlockStructure {
    console.log('🔄 Dividing NEW C2 block into C2A and C2B sub-blocks...');
    
    const candleCount = c2Block.count;
    const halfCount = Math.ceil(candleCount / 2);
    
    // Split candles into C2A and C2B
    const c2aCandles = c2Block.candles.slice(0, halfCount);
    const c2bCandles = c2Block.candles.slice(halfCount);

    console.log(`📊 NEW C2 BLOCK division: C2A = candles [1,${halfCount}], C2B = candles [${halfCount + 1},${candleCount}]`);

    const subBlockA: SubBlockStructure = {
      name: "NEW C2A",
      candles: c2aCandles,
      count: c2aCandles.length,
      high: this.findHighestCandle(c2aCandles),
      low: this.findLowestCandle(c2aCandles)
    };

    const subBlockB: SubBlockStructure = {
      name: "NEW C2B",
      candles: c2bCandles,
      count: c2bCandles.length,
      high: this.findHighestCandle(c2bCandles),
      low: this.findLowestCandle(c2bCandles)
    };

    return {
      ...c2Block,
      name: "NEW C2 BLOCK (C2A+C2B)",
      subBlocks: {
        A: subBlockA,
        B: subBlockB
      }
    };
  }

  /**
   * Helper method to find highest candle in array
   */
  private findHighestCandle(candles: CandleData[]): { price: number; timestamp: string } {
    if (candles.length === 0) {
      throw new Error('Cannot find highest candle in empty array');
    }
    
    let highest = candles[0];
    for (const candle of candles) {
      if (candle.high > highest.high) {
        highest = candle;
      }
    }
    
    return { price: highest.high, timestamp: highest.timestamp };
  }

  /**
   * Helper method to find lowest candle in array
   */
  private findLowestCandle(candles: CandleData[]): { price: number; timestamp: string } {
    if (candles.length === 0) {
      throw new Error('Cannot find lowest candle in empty array');
    }
    
    let lowest = candles[0];
    for (const candle of candles) {
      if (candle.low < lowest.low) {
        lowest = candle;
      }
    }
    
    return { price: lowest.low, timestamp: lowest.timestamp };
  }

  /**
   * Main dynamic block rotation logic
   * After C3 completion, if count(C1) == count(C2), rotate blocks
   */
  async processBlockRotation(
    originalC1: CandleData[],
    originalC2: CandleData[],
    completedC3: CandleData[],
    symbol: string,
    date: string
  ): Promise<DynamicBlockRotationResult> {
    
    console.log('🔄 Starting Dynamic Block Rotation Analysis...');
    
    const rotationHistory: Array<{ step: number; condition: string; action: string; timestamp: string }> = [];
    
    // Step 1: Analyze current block structure
    const c1Count = originalC1.length;
    const c2Count = originalC2.length;
    const c3Count = completedC3.length;
    
    console.log(`📊 Block Count Analysis:`, {
      'Original C1 BLOCK': c1Count,
      'Original C2 BLOCK': c2Count,
      'Completed C3 BLOCK': c3Count
    });

    rotationHistory.push({
      step: 1,
      condition: `C1 count: ${c1Count}, C2 count: ${c2Count}, C3 count: ${c3Count}`,
      action: 'Analyzing block counts for rotation condition',
      timestamp: new Date().toISOString()
    });

    // Step 2: Check rotation condition and equal count requirement
    const shouldRotate = c1Count === c2Count;
    const equalCountSatisfied = c2Count === c3Count;
    
    console.log(`🔍 Rotation Condition Check: count(C1) == count(C2) ? ${c1Count} == ${c2Count} = ${shouldRotate}`);
    console.log(`🔍 Equal Count Validation: count(C2) == count(C3) ? ${c2Count} == ${c3Count} = ${equalCountSatisfied}`);

    if (!shouldRotate || !equalCountSatisfied) {
      const failureReason = !shouldRotate 
        ? `count(C1) ${c1Count} != count(C2) ${c2Count}` 
        : `count(C2) ${c2Count} != count(C3) ${c3Count}`;
      
      rotationHistory.push({
        step: 2,
        condition: failureReason,
        action: 'No rotation applied - required conditions not met',
        timestamp: new Date().toISOString()
      });

      return {
        rotationApplied: false,
        rotationReason: !shouldRotate 
          ? `No rotation: C1 count (${c1Count}) != C2 count (${c2Count})` 
          : `No rotation: C2 count (${c2Count}) != C3 count (${c3Count}) - Equal count requirement not satisfied`,
        currentBlocks: {
          C1: this.createBlockStructure('C1 BLOCK', originalC1),
          C2: this.createBlockStructure('C2 BLOCK', originalC2),
          C3: this.createBlockStructure('C3 BLOCK', completedC3)
        },
        rotationHistory,
        nextPredictionTarget: 'Continue with existing C1/C2 blocks for next cycle'
      };
    }

    // Step 3: Apply rotation logic
    console.log('✅ Both rotation conditions met - applying dynamic block rotation...');

    rotationHistory.push({
      step: 2,
      condition: `count(C1) ${c1Count} == count(C2) ${c2Count} AND count(C2) ${c2Count} == count(C3) ${c3Count}`,
      action: 'Both rotation conditions satisfied - proceeding with block rotation',
      timestamp: new Date().toISOString()
    });

    // Step 4: Create new block structure with equal division logic
    const combinedC1C2 = [...originalC1, ...originalC2];
    
    let newC1Block = this.createBlockStructure('NEW C1 BLOCK (old C1+C2)', combinedC1C2);
    let newC2Block = this.createBlockStructure('NEW C2 BLOCK (old C3)', completedC3);

    // Apply equal division logic for expanded blocks
    console.log('🔪 Applying equal division logic for expanded blocks...');
    
    if (newC1Block.count > 2) {
      console.log(`📊 NEW C1 BLOCK has ${newC1Block.count} candles - applying equal division: C1A = candles [1,${Math.ceil(newC1Block.count/2)}], C1B = candles [${Math.ceil(newC1Block.count/2)+1},${newC1Block.count}]`);
      newC1Block = this.divideBlockEqually(newC1Block);
    }
    
    // Always apply C2A/C2B division for NEW C2 BLOCK regardless of count
    console.log(`📊 NEW C2 BLOCK has ${newC2Block.count} candles - applying C2A/C2B division...`);
    newC2Block = this.divideC2Block(newC2Block);

    console.log('🔄 Block Rotation Applied with Equal Division:', {
      'NEW C1 BLOCK': `${newC1Block.count} candles (${newC1Block.startTime} - ${newC1Block.endTime})${newC1Block.subBlocks ? ` | Sub-blocks: ${newC1Block.subBlocks.A.name}(${newC1Block.subBlocks.A.count}), ${newC1Block.subBlocks.B.name}(${newC1Block.subBlocks.B.count})` : ''}`,
      'NEW C2 BLOCK': `${newC2Block.count} candles (${newC2Block.startTime} - ${newC2Block.endTime})${newC2Block.subBlocks ? ` | Sub-blocks: ${newC2Block.subBlocks.A.name}(${newC2Block.subBlocks.A.count}), ${newC2Block.subBlocks.B.name}(${newC2Block.subBlocks.B.count})` : ''}`
    });

    rotationHistory.push({
      step: 3,
      condition: 'Block rotation formula applied',
      action: `NEW C1 = old(C1+C2) [${newC1Block.count} candles], NEW C2 = old(C3) [${newC2Block.count} candles]`,
      timestamp: new Date().toISOString()
    });

    rotationHistory.push({
      step: 4,
      condition: 'Equal division logic applied',
      action: `NEW C1 BLOCK divided into ${newC1Block.subBlocks ? `${newC1Block.subBlocks.A.name}(${newC1Block.subBlocks.A.count}) + ${newC1Block.subBlocks.B.name}(${newC1Block.subBlocks.B.count})` : 'no sub-division needed'}; NEW C2 BLOCK divided into ${newC2Block.subBlocks ? `${newC2Block.subBlocks.A.name}(${newC2Block.subBlocks.A.count}) + ${newC2Block.subBlocks.B.name}(${newC2Block.subBlocks.B.count})` : 'no sub-division needed'}`,
      timestamp: new Date().toISOString()
    });

    rotationHistory.push({
      step: 5,
      condition: 'Next prediction cycle ready',
      action: 'System ready to predict new C3 BLOCK using rotated C1/C2 structure with sub-block pattern recognition',
      timestamp: new Date().toISOString()
    });

    return {
      rotationApplied: true,
      rotationReason: `Rotation applied: C1 count (${c1Count}) == C2 count (${c2Count}) AND C2 count (${c2Count}) == C3 count (${c3Count})`,
      currentBlocks: {
        C1: newC1Block,
        C2: newC2Block
      },
      rotationHistory,
      nextPredictionTarget: 'NEW C3 BLOCK (7th + 8th candles) using rotated C1/C2 blocks'
    };
  }

  /**
   * Create structured block data with extremes analysis
   */
  private createBlockStructure(name: string, candles: CandleData[]): BlockStructure {
    if (candles.length === 0) {
      throw new Error(`Cannot create block structure for ${name} - no candles provided`);
    }

    // Find block extremes
    let highPrice = candles[0].high;
    let highTimestamp = candles[0].timestamp;
    let lowPrice = candles[0].low;
    let lowTimestamp = candles[0].timestamp;

    candles.forEach(candle => {
      if (candle.high > highPrice) {
        highPrice = candle.high;
        highTimestamp = candle.timestamp;
      }
      if (candle.low < lowPrice) {
        lowPrice = candle.low;
        lowTimestamp = candle.timestamp;
      }
    });

    return {
      name,
      candles: [...candles],
      count: candles.length,
      startTime: candles[0].timestamp,
      endTime: candles[candles.length - 1].timestamp,
      high: { price: highPrice, timestamp: highTimestamp },
      low: { price: lowPrice, timestamp: lowTimestamp }
    };
  }

  /**
   * Simulate next cycle prediction using rotated blocks
   */
  async simulateNextCyclePrediction(
    rotatedC1: BlockStructure,
    rotatedC2: BlockStructure,
    symbol: string,
    date: string
  ): Promise<any> {
    
    console.log('🔮 Simulating next cycle prediction with rotated blocks...');
    
    // Calculate new slopes using rotated block extremes
    const newUptrend = {
      pointA: rotatedC1.low,
      pointB: rotatedC2.high,
      slope: this.calculateSlope(rotatedC1.low, rotatedC2.high)
    };

    const newDowntrend = {
      pointA: rotatedC1.high,
      pointB: rotatedC2.low,
      slope: this.calculateSlope(rotatedC1.high, rotatedC2.low)
    };

    console.log('📈 New Slope Analysis with Rotated Blocks:', {
      uptrend: `${newUptrend.slope.toFixed(3)} points/min (${rotatedC1.name} low → ${rotatedC2.name} high)`,
      downtrend: `${newDowntrend.slope.toFixed(3)} points/min (${rotatedC1.name} high → ${rotatedC2.name} low)`
    });

    return {
      predictedTrends: {
        uptrend: newUptrend,
        downtrend: newDowntrend
      },
      breakoutLevels: {
        uptrend: rotatedC2.high.price,
        downtrend: rotatedC2.low.price
      },
      predictionTarget: 'NEW C3 BLOCK (7th + 8th candles)',
      methodology: 'Using rotated C1/C2 blocks for enhanced prediction accuracy'
    };
  }

  /**
   * Calculate slope between two price points
   */
  private calculateSlope(pointA: { price: number; timestamp: string }, pointB: { price: number; timestamp: string }): number {
    const priceChange = pointB.price - pointA.price;
    const timeChange = (new Date(pointB.timestamp).getTime() - new Date(pointA.timestamp).getTime()) / (1000 * 60); // minutes
    return timeChange > 0 ? priceChange / timeChange : 0;
  }
}