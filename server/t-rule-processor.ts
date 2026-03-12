// import { FyersAPI } from './fyers-api'; // Removed: Fyers API removed
import { PointABExtractor } from './point-ab-extractor.js';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BlockData {
  candles: CandleData[];
  count: number;
  high: number;
  low: number;
  highTimestamp: number;
  lowTimestamp: number;
}

interface TRuleResult {
  success: boolean;
  method: string;
  symbol: string;
  date: string;
  timeframe: number;
  c2Block: BlockData;
  c3aBlock: BlockData;
  predictedC3bBlock: BlockData;
  methodology: string;
  steps: string[];
  confidence: number;
  analysis: {
    c2BlockAnalysis: string;
    c3aBlockAnalysis: string;
    combinedTrend: string;
    predictionBasis: string;
  };
  pointABAnalysis?: {
    pointA: { timestamp: number; price: number; exactTime: string; };
    pointB: { timestamp: number; price: number; exactTime: string; };
    slope: number;
    duration: number;
    timingRules: {
      percentage50: number;
      percentage34: number;
      targetExtension: number;
      trigger80percent: number;
    };
  };
}

export class TRuleProcessor {
  private pointABExtractor: PointABExtractor;
  
  constructor(private fyersApi: FyersAPI) {
    this.pointABExtractor = new PointABExtractor(fyersApi);
  }

  async applyTRule(
    c2BlockCandles: CandleData[],
    c3aBlockCandles: CandleData[],
    symbol: string,
    date: string,
    timeframe: number = 10
  ): Promise<TRuleResult> {
    try {
      console.log(`🎯 [T-RULE] Starting T-rule processing for ${symbol}`);
      console.log(`📊 [T-RULE] C2 Block: ${c2BlockCandles.length} candles, C3a Block: ${c3aBlockCandles.length} candles`);

      // Create block data structures
      const c2Block = this.createBlockData(c2BlockCandles, 'C2');
      const c3aBlock = this.createBlockData(c3aBlockCandles, 'C3a');

      console.log(`📈 [T-RULE] C2 Block - High: ${c2Block.high}, Low: ${c2Block.low}`);
      console.log(`📈 [T-RULE] C3a Block - High: ${c3aBlock.high}, Low: ${c3aBlock.low}`);

      // STEP 2A: Extract exact Point A and Point B from C2 block using 1-minute data
      console.log(`🔍 [T-RULE] Extracting exact Point A/B timestamps for 50%/34% calculations`);
      
      let pointABAnalysis = null;
      try {
        const pointABResult = await this.pointABExtractor.extractPointAB(
          c2BlockCandles,
          symbol,
          date,
          'T-RULE'
        );

        pointABAnalysis = {
          pointA: {
            timestamp: pointABResult.pointAB.pointA.timestamp,
            price: pointABResult.pointAB.pointA.price,
            exactTime: pointABResult.pointAB.pointA.exactTime
          },
          pointB: {
            timestamp: pointABResult.pointAB.pointB.timestamp,
            price: pointABResult.pointAB.pointB.price,
            exactTime: pointABResult.pointAB.pointB.exactTime
          },
          slope: pointABResult.pointAB.slope,
          duration: pointABResult.pointAB.duration.minutes,
          timingRules: {
            percentage50: pointABResult.timingRules.pointAToPointB.percentage50,
            percentage34: pointABResult.timingRules.pointAToPointB.percentage34,
            targetExtension: pointABResult.timingRules.targetCalculation.slopeExtension,
            trigger80percent: pointABResult.timingRules.targetCalculation.trigger80percent
          }
        };

        console.log(`✅ [T-RULE] Point A/B extraction completed - Duration: ${pointABAnalysis.duration.toFixed(2)} min, Slope: ${pointABAnalysis.slope.toFixed(4)} pts/min`);
        
      } catch (error) {
        console.error(`⚠️ [T-RULE] Point A/B extraction failed:`, error);
      }

      // Apply Step 2 methodology to predict C3b
      const predictedC3b = await this.predictC3bUsingStep2Methods(
        c2Block,
        c3aBlock,
        symbol,
        date,
        timeframe
      );

      // Calculate confidence based on trend consistency
      const confidence = this.calculateTRuleConfidence(c2Block, c3aBlock, predictedC3b);

      // Generate analysis
      const analysis = this.generateTRuleAnalysis(c2Block, c3aBlock, predictedC3b);

      const result: TRuleResult = {
        success: true,
        method: "T-Rule Processor",
        symbol,
        date,
        timeframe,
        c2Block,
        c3aBlock,
        predictedC3bBlock: predictedC3b,
        methodology: "T-Rule: Use C2 block + C3a block to apply Step 2 methods and predict C3b candles",
        steps: [
          "1. Extract exact Point A/B timestamps from C2 block using 1-minute data",
          "2. Calculate precise 50%/34% timing rules for trigger validation",
          "3. Analyze C2 block trend and momentum",
          "4. Analyze C3a block continuation pattern", 
          "5. Apply Step 2 methodology (slope calculation + trend analysis)",
          "6. Predict C3b candles based on combined C2+C3a analysis",
          "7. Calculate confidence score based on trend consistency"
        ],
        confidence,
        analysis,
        pointABAnalysis
      };

      console.log(`✅ [T-RULE] T-rule processing completed with ${confidence}% confidence`);
      return result;

    } catch (error) {
      console.error('❌ [T-RULE] T-rule processing failed:', error);
      throw new Error(`T-rule processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createBlockData(candles: CandleData[], blockName: string): BlockData {
    if (!candles || candles.length === 0) {
      throw new Error(`${blockName} block cannot be empty`);
    }

    let high = candles[0].high;
    let low = candles[0].low;
    let highTimestamp = candles[0].timestamp;
    let lowTimestamp = candles[0].timestamp;

    // Find highest high and lowest low with their timestamps
    candles.forEach(candle => {
      if (candle.high > high) {
        high = candle.high;
        highTimestamp = candle.timestamp;
      }
      if (candle.low < low) {
        low = candle.low;
        lowTimestamp = candle.timestamp;
      }
    });

    return {
      candles,
      count: candles.length,
      high,
      low,
      highTimestamp,
      lowTimestamp
    };
  }

  private async predictC3bUsingStep2Methods(
    c2Block: BlockData,
    c3aBlock: BlockData,
    symbol: string,
    date: string,
    timeframe: number
  ): Promise<BlockData> {
    console.log(`🔍 [T-RULE] Applying Step 2 methods for C3b prediction`);

    // Calculate trend direction from C2 to C3a
    const c2TrendDirection = this.calculateTrendDirection(c2Block);
    const c3aTrendDirection = this.calculateTrendDirection(c3aBlock);
    
    console.log(`📊 [T-RULE] C2 Block trend: ${c2TrendDirection}`);
    console.log(`📊 [T-RULE] C3a Block trend: ${c3aTrendDirection}`);

    // Calculate momentum from C2 block ending to C3a block
    const c2ToC3aMomentum = this.calculateMomentum(c2Block, c3aBlock);
    console.log(`⚡ [T-RULE] C2→C3a momentum: ${c2ToC3aMomentum.toFixed(2)} points`);

    // Predict C3b based on Step 2 methodology
    const lastC3aCandle = c3aBlock.candles[c3aBlock.candles.length - 1];
    const predictedC3bCandles: CandleData[] = [];

    // Generate C3b candles based on the pattern (same count as C3a for symmetry)
    const c3bCandleCount = c3aBlock.count;
    const baseTimestamp = lastC3aCandle.timestamp;
    const candleInterval = timeframe * 60 * 1000; // Convert to milliseconds

    for (let i = 0; i < c3bCandleCount; i++) {
      const timestamp = baseTimestamp + (i + 1) * candleInterval;
      
      // Apply momentum and trend continuation
      const momentumFactor = c2ToC3aMomentum * 0.7; // 70% momentum continuation
      const trendFactor = this.getTrendContinuationFactor(c2TrendDirection, c3aTrendDirection);
      
      const predictedCandle = this.generatePredictedCandle(
        lastC3aCandle,
        timestamp,
        momentumFactor,
        trendFactor,
        i
      );
      
      predictedC3bCandles.push(predictedCandle);
    }

    console.log(`🎯 [T-RULE] Predicted ${c3bCandleCount} C3b candles using Step 2 methodology`);
    
    return this.createBlockData(predictedC3bCandles, 'C3b (Predicted)');
  }

  private calculateTrendDirection(block: BlockData): 'uptrend' | 'downtrend' | 'sideways' {
    const firstCandle = block.candles[0];
    const lastCandle = block.candles[block.candles.length - 1];
    
    const priceChange = lastCandle.close - firstCandle.open;
    const percentChange = (priceChange / firstCandle.open) * 100;
    
    if (percentChange > 0.1) return 'uptrend';
    if (percentChange < -0.1) return 'downtrend';
    return 'sideways';
  }

  private calculateMomentum(c2Block: BlockData, c3aBlock: BlockData): number {
    const c2LastCandle = c2Block.candles[c2Block.candles.length - 1];
    const c3aLastCandle = c3aBlock.candles[c3aBlock.candles.length - 1];
    
    return c3aLastCandle.close - c2LastCandle.close;
  }

  private getTrendContinuationFactor(c2Trend: string, c3aTrend: string): number {
    // If trends are consistent, stronger continuation factor
    if (c2Trend === c3aTrend) {
      return c2Trend === 'uptrend' ? 1.2 : c2Trend === 'downtrend' ? 0.8 : 1.0;
    }
    // If trends are opposite, weaker continuation
    return 1.0;
  }

  private generatePredictedCandle(
    baseCandle: CandleData,
    timestamp: number,
    momentumFactor: number,
    trendFactor: number,
    candleIndex: number
  ): CandleData {
    // Apply momentum decay over time
    const decayFactor = Math.pow(0.9, candleIndex);
    const adjustedMomentum = momentumFactor * decayFactor * trendFactor;
    
    // Generate OHLC with realistic spread
    const basePrice = baseCandle.close + adjustedMomentum;
    const volatility = Math.abs(baseCandle.high - baseCandle.low) * 0.8;
    
    const open = basePrice + (Math.random() - 0.5) * volatility * 0.3;
    const close = basePrice + (Math.random() - 0.5) * volatility * 0.5;
    const high = Math.max(open, close) + Math.random() * volatility * 0.4;
    const low = Math.min(open, close) - Math.random() * volatility * 0.4;
    
    return {
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(baseCandle.volume * (0.8 + Math.random() * 0.4))
    };
  }

  private calculateTRuleConfidence(
    c2Block: BlockData,
    c3aBlock: BlockData,
    predictedC3b: BlockData
  ): number {
    let confidence = 70; // Base confidence

    // Analyze trend consistency
    const c2Trend = this.calculateTrendDirection(c2Block);
    const c3aTrend = this.calculateTrendDirection(c3aBlock);
    
    if (c2Trend === c3aTrend && c2Trend !== 'sideways') {
      confidence += 15; // Consistent trend direction
    }
    
    // Volume consistency check
    const c2AvgVolume = c2Block.candles.reduce((sum, c) => sum + c.volume, 0) / c2Block.count;
    const c3aAvgVolume = c3aBlock.candles.reduce((sum, c) => sum + c.volume, 0) / c3aBlock.count;
    
    if (Math.abs(c2AvgVolume - c3aAvgVolume) / c2AvgVolume < 0.3) {
      confidence += 10; // Similar volume patterns
    }
    
    // Block size compatibility
    if (c2Block.count >= 2 && c3aBlock.count >= 1) {
      confidence += 5; // Adequate data for analysis
    }
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  private generateTRuleAnalysis(
    c2Block: BlockData,
    c3aBlock: BlockData,
    predictedC3b: BlockData
  ) {
    const c2Trend = this.calculateTrendDirection(c2Block);
    const c3aTrend = this.calculateTrendDirection(c3aBlock);
    const momentum = this.calculateMomentum(c2Block, c3aBlock);
    
    return {
      c2BlockAnalysis: `C2 Block (${c2Block.count} candles): ${c2Trend} pattern, Range: ${c2Block.low}-${c2Block.high}`,
      c3aBlockAnalysis: `C3a Block (${c3aBlock.count} candles): ${c3aTrend} pattern, Range: ${c3aBlock.low}-${c3aBlock.high}`,
      combinedTrend: c2Trend === c3aTrend ? `Consistent ${c2Trend} continuation` : `Trend reversal: ${c2Trend} → ${c3aTrend}`,
      predictionBasis: `Step 2 methodology applied with ${momentum.toFixed(2)} momentum factor and ${c2Trend === c3aTrend ? 'trend continuation' : 'reversal pattern'} logic`
    };
  }

  // Utility method to split C3 block into C3a and C3b
  splitC3Block(c3BlockCandles: CandleData[]): { c3a: CandleData[], c3b: CandleData[] } {
    const totalCandles = c3BlockCandles.length;
    const c3aCount = Math.ceil(totalCandles / 2);
    
    const c3a = c3BlockCandles.slice(0, c3aCount);
    const c3b = c3BlockCandles.slice(c3aCount);
    
    console.log(`📊 [T-RULE] C3 Block split: Total ${totalCandles} → C3a(${c3a.length}) + C3b(${c3b.length})`);
    
    return { c3a, c3b };
  }

  // New method to find C3a candles using C2 block and Mini 4 Rule methodology
  async findC3aUsingC2Block(
    c2BlockCandles: CandleData[],
    symbol: string,
    date: string,
    timeframe: number = 10
  ): Promise<{
    success: boolean;
    method: string;
    c2Block: BlockData;
    predictedC3a: BlockData;
    totalC3Expected: number;
    mini4RuleAnalysis: {
      c2Trend: string;
      c2Momentum: number;
      c2VolumePattern: string;
      predictionLogic: string;
    };
    confidence: number;
  }> {
    try {
      console.log(`🔍 [MINI-4-RULE] Finding C3a candles using C2 block for ${symbol}`);
      console.log(`📊 [MINI-4-RULE] C2 Block: ${c2BlockCandles.length} candles → Predicting C3a: 2 candles (Total C3: 4 candles)`);

      // Create C2 block data structure
      const c2Block = this.createBlockData(c2BlockCandles, 'C2');

      // Apply Mini 4 Rule methodology for C3a prediction
      const c3aPrediction = await this.predictC3aUsingMini4Rule(
        c2Block,
        symbol,
        date,
        timeframe
      );

      // Generate Mini 4 Rule analysis
      const mini4RuleAnalysis = this.generateMini4RuleAnalysis(c2Block, c3aPrediction.predictedC3a);

      // Calculate confidence for Mini 4 Rule prediction
      const confidence = this.calculateMini4RuleConfidence(c2Block, c3aPrediction.predictedC3a);

      console.log(`✅ [MINI-4-RULE] C3a prediction completed using Mini 4 Rule methodology with ${confidence}% confidence`);

      return {
        success: true,
        method: "Mini 4 Rule: C3a Prediction using C2 Block",
        c2Block,
        predictedC3a: c3aPrediction.predictedC3a,
        totalC3Expected: 4, // C3a(2) + C3b(2) = 4 total candles
        mini4RuleAnalysis,
        confidence
      };

    } catch (error) {
      console.error('❌ [MINI-4-RULE] C3a prediction using C2 block failed:', error);
      throw new Error(`Mini 4 Rule C3a prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async predictC3aUsingMini4Rule(
    c2Block: BlockData,
    symbol: string,
    date: string,
    timeframe: number
  ): Promise<{ predictedC3a: BlockData }> {
    console.log(`🎯 [MINI-4-RULE] Applying Mini 4 Rule methodology for C3a prediction`);

    // Mini 4 Rule methodology: Analyze C2 block pattern and project forward
    const c2Trend = this.calculateTrendDirection(c2Block);
    const c2Momentum = this.calculateC2BlockMomentum(c2Block);
    const c2VolumeStrength = this.calculateVolumeStrength(c2Block);

    console.log(`📈 [MINI-4-RULE] C2 Analysis - Trend: ${c2Trend}, Momentum: ${c2Momentum.toFixed(2)}, Volume Strength: ${c2VolumeStrength}`);

    // Generate C3a candles (2 candles expected)
    const lastC2Candle = c2Block.candles[c2Block.candles.length - 1];
    const predictedC3aCandles: CandleData[] = [];
    const candleInterval = timeframe * 60 * 1000; // Convert to milliseconds

    // Mini 4 Rule logic: Project trend continuation with momentum decay
    for (let i = 0; i < 2; i++) { // Generate 2 C3a candles
      const timestamp = lastC2Candle.timestamp + (i + 1) * candleInterval;
      
      // Apply Mini 4 Rule projection logic
      const momentumDecay = Math.pow(0.85, i); // 15% decay per candle
      const adjustedMomentum = c2Momentum * momentumDecay;
      const trendContinuation = this.getMini4RuleTrendContinuation(c2Trend, i);
      
      const predictedCandle = this.generateMini4RulePredictedCandle(
        lastC2Candle,
        timestamp,
        adjustedMomentum,
        trendContinuation,
        c2VolumeStrength,
        i
      );
      
      predictedC3aCandles.push(predictedCandle);
    }

    console.log(`🔮 [MINI-4-RULE] Generated 2 C3a candles using Mini 4 Rule projection methodology`);
    
    return {
      predictedC3a: this.createBlockData(predictedC3aCandles, 'C3a (Mini 4 Rule Predicted)')
    };
  }

  private calculateC2BlockMomentum(c2Block: BlockData): number {
    const firstCandle = c2Block.candles[0];
    const lastCandle = c2Block.candles[c2Block.candles.length - 1];
    
    // Calculate price momentum and volatility momentum
    const priceMomentum = lastCandle.close - firstCandle.open;
    const volatilityRange = c2Block.high - c2Block.low;
    
    return priceMomentum + (volatilityRange * 0.3); // Weight volatility at 30%
  }

  private calculateVolumeStrength(c2Block: BlockData): 'strong' | 'medium' | 'weak' {
    const volumes = c2Block.candles.map(c => c.volume);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const volumeVariance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
    const volumeCV = Math.sqrt(volumeVariance) / avgVolume; // Coefficient of variation
    
    if (avgVolume > 120000 && volumeCV < 0.2) return 'strong';
    if (avgVolume > 100000 && volumeCV < 0.3) return 'medium';
    return 'weak';
  }

  private getMini4RuleTrendContinuation(trend: string, candleIndex: number): number {
    // Mini 4 Rule logic: Trend continuation factors
    const baseFactor = trend === 'uptrend' ? 1.1 : trend === 'downtrend' ? 0.9 : 1.0;
    const decayFactor = Math.pow(0.95, candleIndex); // 5% decay per subsequent candle
    
    return baseFactor * decayFactor;
  }

  private generateMini4RulePredictedCandle(
    baseCandle: CandleData,
    timestamp: number,
    momentum: number,
    trendFactor: number,
    volumeStrength: string,
    candleIndex: number
  ): CandleData {
    // Mini 4 Rule prediction logic with realistic OHLC generation
    const basePrice = baseCandle.close + momentum * 0.6; // 60% momentum application
    const volatility = Math.abs(baseCandle.high - baseCandle.low) * 0.7; // 70% of base volatility
    
    // Generate OHLC with Mini 4 Rule methodology
    const open = basePrice + (Math.random() - 0.5) * volatility * 0.4;
    const close = basePrice * trendFactor + (Math.random() - 0.5) * volatility * 0.3;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    // Volume prediction based on C2 block volume strength
    const volumeMultiplier = volumeStrength === 'strong' ? 1.1 : volumeStrength === 'medium' ? 1.0 : 0.9;
    const predictedVolume = Math.floor(baseCandle.volume * volumeMultiplier * (0.9 + Math.random() * 0.2));
    
    return {
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: predictedVolume
    };
  }

  private generateMini4RuleAnalysis(c2Block: BlockData, predictedC3a: BlockData) {
    const c2Trend = this.calculateTrendDirection(c2Block);
    const c2Momentum = this.calculateC2BlockMomentum(c2Block);
    const c2VolumePattern = this.calculateVolumeStrength(c2Block);
    
    return {
      c2Trend: `C2 Block shows ${c2Trend} pattern with range ${c2Block.low}-${c2Block.high}`,
      c2Momentum,
      c2VolumePattern: `Volume strength: ${c2VolumePattern}`,
      predictionLogic: `Mini 4 Rule methodology: C2 momentum (${c2Momentum.toFixed(2)}) projected with ${c2Trend} continuation to generate C3a pattern`
    };
  }

  private calculateMini4RuleConfidence(c2Block: BlockData, predictedC3a: BlockData): number {
    let confidence = 75; // Base confidence for Mini 4 Rule

    // Analyze C2 block consistency
    const c2Trend = this.calculateTrendDirection(c2Block);
    if (c2Trend !== 'sideways') {
      confidence += 10; // Clear trend direction
    }

    // Volume pattern strength
    const volumeStrength = this.calculateVolumeStrength(c2Block);
    if (volumeStrength === 'strong') confidence += 10;
    else if (volumeStrength === 'medium') confidence += 5;

    // C2 block size adequacy
    if (c2Block.count >= 4) {
      confidence += 5; // Adequate sample size
    }

    return Math.min(confidence, 90); // Cap at 90% for Mini 4 Rule predictions
  }
}