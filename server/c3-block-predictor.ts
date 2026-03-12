// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface C3BlockPrediction {
  c3a: {
    predictedOpen: number;
    predictedHigh: number;
    predictedLow: number;
    predictedClose: number;
    startTime: number;
    endTime: number;
    confidence: number;
  };
  c3b: {
    predictedOpen: number;
    predictedHigh: number;
    predictedLow: number;
    predictedClose: number;
    startTime: number;
    endTime: number;
    confidence: number;
  };
  methodology: string;
  trendDirection: 'uptrend' | 'downtrend' | 'sideways';
  c1BlockAnalysis: any;
  c2BlockAnalysis: any;
  predictionBasis: string;
}

export class C3BlockPredictor {
  
  /**
   * Predict C3 block (C3a + C3b) using C1/C2 block patterns
   */
  async predictC3Block(
    symbol: string,
    date: string,
    timeframe: number,
    c1Block: CandleData[],
    c2Block: CandleData[]
  ): Promise<C3BlockPrediction> {
    
    console.log(`🔮 C3 BLOCK PREDICTOR: Starting prediction for ${symbol} using C1/C2 patterns`);
    console.log(`📊 C1 Block: ${c1Block.length} candles, C2 Block: ${c2Block.length} candles`);
    
    // Analyze C1 block momentum and trend
    const c1Analysis = this.analyzeBlockMomentum(c1Block, 'C1');
    const c2Analysis = this.analyzeBlockMomentum(c2Block, 'C2');
    
    // Determine overall trend direction from C1→C2 progression
    const trendDirection = this.determineTrendDirection(c1Block, c2Block);
    
    // Calculate C3a prediction based on C2 momentum
    const c3aPrediction = this.predictC3a(c2Block, c1Analysis, c2Analysis, timeframe, trendDirection);
    
    // Calculate C3b prediction based on C3a and overall trend
    const c3bPrediction = this.predictC3b(c3aPrediction, c1Analysis, c2Analysis, timeframe, trendDirection);
    
    const prediction: C3BlockPrediction = {
      c3a: c3aPrediction,
      c3b: c3bPrediction,
      methodology: "C1/C2 Block Pattern Analysis with Momentum Projection",
      trendDirection,
      c1BlockAnalysis: c1Analysis,
      c2BlockAnalysis: c2Analysis,
      predictionBasis: `Using ${c1Block.length}-candle C1 block and ${c2Block.length}-candle C2 block patterns to forecast C3 block behavior`
    };
    
    console.log(`✅ C3 PREDICTION COMPLETE: ${trendDirection} trend detected`);
    console.log(`🎯 C3A Confidence: ${c3aPrediction.confidence}%, C3B Confidence: ${c3bPrediction.confidence}%`);
    
    return prediction;
  }
  
  /**
   * Analyze momentum and characteristics of a candle block
   */
  private analyzeBlockMomentum(block: CandleData[], blockName: string) {
    const firstCandle = block[0];
    const lastCandle = block[block.length - 1];
    
    const priceMovement = lastCandle.close - firstCandle.open;
    const priceRange = Math.max(...block.map(c => c.high)) - Math.min(...block.map(c => c.low));
    const averageVolume = block.reduce((sum, c) => sum + c.volume, 0) / block.length;
    
    const momentum = priceMovement / (block.length * 5); // Points per minute
    const volatility = priceRange / firstCandle.open * 100; // Percentage volatility
    
    const bullishCandles = block.filter(c => c.close > c.open).length;
    const bearishCandles = block.filter(c => c.close < c.open).length;
    
    return {
      blockName,
      priceMovement,
      priceRange,
      momentum,
      volatility,
      averageVolume,
      bullishCandles,
      bearishCandles,
      candleCount: block.length,
      blockHigh: Math.max(...block.map(c => c.high)),
      blockLow: Math.min(...block.map(c => c.low)),
      blockOpen: firstCandle.open,
      blockClose: lastCandle.close,
      trendStrength: Math.abs(momentum),
      dominantTrend: bullishCandles > bearishCandles ? 'bullish' : bearishCandles > bullishCandles ? 'bearish' : 'neutral'
    };
  }
  
  /**
   * Determine overall trend direction from C1→C2 progression
   */
  private determineTrendDirection(c1Block: CandleData[], c2Block: CandleData[]): 'uptrend' | 'downtrend' | 'sideways' {
    const c1Close = c1Block[c1Block.length - 1].close;
    const c2Close = c2Block[c2Block.length - 1].close;
    
    const c1High = Math.max(...c1Block.map(c => c.high));
    const c2High = Math.max(...c2Block.map(c => c.high));
    
    const c1Low = Math.min(...c1Block.map(c => c.low));
    const c2Low = Math.min(...c2Block.map(c => c.low));
    
    const closeProgression = c2Close - c1Close;
    const highProgression = c2High - c1High;
    const lowProgression = c2Low - c1Low;
    
    // Combine multiple factors for trend determination
    const trendScore = (closeProgression * 0.4) + (highProgression * 0.3) + (lowProgression * 0.3);
    
    if (trendScore > 5) return 'uptrend';
    if (trendScore < -5) return 'downtrend';
    return 'sideways';
  }
  
  /**
   * Predict C3a candle using C2 block momentum
   */
  private predictC3a(
    c2Block: CandleData[], 
    c1Analysis: any, 
    c2Analysis: any, 
    timeframe: number,
    trendDirection: string
  ) {
    const lastC2Candle = c2Block[c2Block.length - 1];
    const c2Momentum = c2Analysis.momentum;
    const trendMultiplier = trendDirection === 'uptrend' ? 1.2 : trendDirection === 'downtrend' ? 0.8 : 1.0;
    
    // C3a starts where C2 ended
    const predictedOpen = lastC2Candle.close;
    
    // Apply momentum with trend adjustment
    const momentumProjection = c2Momentum * timeframe * trendMultiplier;
    const predictedClose = predictedOpen + momentumProjection;
    
    // Calculate high/low based on volatility patterns
    const avgVolatility = (c1Analysis.volatility + c2Analysis.volatility) / 2;
    const priceRange = predictedOpen * (avgVolatility / 100);
    
    const predictedHigh = Math.max(predictedOpen, predictedClose) + (priceRange * 0.6);
    const predictedLow = Math.min(predictedOpen, predictedClose) - (priceRange * 0.4);
    
    // Calculate confidence based on trend consistency
    const trendConsistency = Math.abs(c1Analysis.momentum - c2Analysis.momentum) < 2 ? 85 : 70;
    const volumeConfidence = c2Analysis.averageVolume > 1000 ? 90 : 75;
    const confidence = Math.min(95, (trendConsistency + volumeConfidence) / 2);
    
    const startTime = lastC2Candle.timestamp + (timeframe * 60);
    const endTime = startTime + (timeframe * 60);
    
    return {
      predictedOpen: Math.round(predictedOpen * 100) / 100,
      predictedHigh: Math.round(predictedHigh * 100) / 100,
      predictedLow: Math.round(predictedLow * 100) / 100,
      predictedClose: Math.round(predictedClose * 100) / 100,
      startTime,
      endTime,
      confidence: Math.round(confidence)
    };
  }
  
  /**
   * Predict C3b candle using C3a and overall block patterns
   */
  private predictC3b(
    c3aPrediction: any,
    c1Analysis: any,
    c2Analysis: any,
    timeframe: number,
    trendDirection: string
  ) {
    // C3b starts where C3a ends
    const predictedOpen = c3aPrediction.predictedClose;
    
    // Analyze block-to-block progression pattern
    const blockProgressionMomentum = (c2Analysis.momentum - c1Analysis.momentum) * 0.7;
    const trendContinuation = trendDirection === 'uptrend' ? 1.1 : trendDirection === 'downtrend' ? 0.9 : 1.0;
    
    // Apply progressive momentum decay for C3b
    const momentumProjection = blockProgressionMomentum * timeframe * trendContinuation;
    const predictedClose = predictedOpen + momentumProjection;
    
    // Calculate high/low with increased volatility for C3b
    const blockVolatility = Math.max(c1Analysis.volatility, c2Analysis.volatility) * 1.1;
    const priceRange = predictedOpen * (blockVolatility / 100);
    
    const predictedHigh = Math.max(predictedOpen, predictedClose) + (priceRange * 0.7);
    const predictedLow = Math.min(predictedOpen, predictedClose) - (priceRange * 0.5);
    
    // C3b confidence slightly lower due to increased time distance
    const baseConfidence = c3aPrediction.confidence * 0.9;
    const progressionConfidence = Math.abs(blockProgressionMomentum) > 1 ? 85 : 70;
    const confidence = Math.min(90, (baseConfidence + progressionConfidence) / 2);
    
    const startTime = c3aPrediction.endTime;
    const endTime = startTime + (timeframe * 60);
    
    return {
      predictedOpen: Math.round(predictedOpen * 100) / 100,
      predictedHigh: Math.round(predictedHigh * 100) / 100,
      predictedLow: Math.round(predictedLow * 100) / 100,
      predictedClose: Math.round(predictedClose * 100) / 100,
      startTime,
      endTime,
      confidence: Math.round(confidence)
    };
  }
}

export const c3BlockPredictor = new C3BlockPredictor();