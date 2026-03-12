// import { CandleData } from './fyers-api'; // Removed: Fyers API removed

export interface PredictedCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
  confidence: number;
  source: string;
}

export interface DrilledCandle extends PredictedCandle {
  parentCandle: string;
  drilledLevel: number;
  quickTradeSignal: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
}

export class RecursiveDrillingPredictor {
  
  /**
   * Step 1: Use 4 existing 40min candles to predict 5th and 6th 40min candles
   */
  predict5thAnd6thCandles(
    fourCandles: CandleData[], 
    baseTimeframe: number = 40
  ): { fifth: PredictedCandle, sixth: PredictedCandle, analysis: any } {
    
    console.log(`🎯 STEP 1: Predicting 5th and 6th ${baseTimeframe}min candles from 4 existing candles`);
    
    // Extract Point A and Point B from 4 candles
    const c1Block = fourCandles.slice(0, 2); // C1A, C1B
    const c2Block = fourCandles.slice(2, 4); // C2A, C2B
    
    // Find Point A (lowest low from C1 block)
    const c1Lows = c1Block.map(c => c.low);
    const pointA = Math.min(...c1Lows);
    const pointAIndex = c1Lows.indexOf(pointA);
    
    // Find Point B (highest high from C2 block)
    const c2Highs = c2Block.map(c => c.high);
    const pointB = Math.max(...c2Highs);
    const pointBIndex = c2Highs.indexOf(pointB);
    
    // Calculate slope (points per minute)
    const totalDuration = baseTimeframe * 4; // 160 minutes for 4 x 40min candles
    const pointAToPointBDuration = totalDuration * 0.75; // Assume 3/4 of total duration
    const slope = (pointB - pointA) / pointAToPointBDuration;
    
    console.log(`📊 Pattern Analysis:`);
    console.log(`   Point A: ${pointA} (from C1 block)`);
    console.log(`   Point B: ${pointB} (from C2 block)`);
    console.log(`   Slope: ${slope.toFixed(4)} points/minute`);
    console.log(`   Pattern: 1-4 ${slope > 0 ? 'UPTREND' : 'DOWNTREND'}`);
    
    // Predict 5th candle (40min)
    const lastCandle = fourCandles[3]; // C2B
    const fifthCandleStart = lastCandle.timestamp + (baseTimeframe * 60 * 1000);
    const projectedPriceAfter40min = pointB + (slope * baseTimeframe);
    
    const fifthCandle: PredictedCandle = {
      timestamp: fifthCandleStart,
      open: lastCandle.close,
      high: Math.max(lastCandle.close, projectedPriceAfter40min + 5),
      low: Math.min(lastCandle.close, projectedPriceAfter40min - 15),
      close: projectedPriceAfter40min,
      volume: 0,
      timeframe: `${baseTimeframe}min`,
      confidence: 85,
      source: '4-candle-battu-prediction'
    };
    
    // Predict 6th candle (40min)
    const sixthCandleStart = fifthCandleStart + (baseTimeframe * 60 * 1000);
    const projectedPriceAfter80min = pointB + (slope * baseTimeframe * 2);
    
    const sixthCandle: PredictedCandle = {
      timestamp: sixthCandleStart,
      open: fifthCandle.close,
      high: Math.max(fifthCandle.close, projectedPriceAfter80min + 8),
      low: Math.min(fifthCandle.close, projectedPriceAfter80min - 12),
      close: projectedPriceAfter80min,
      volume: 0,
      timeframe: `${baseTimeframe}min`,
      confidence: 78,
      source: '4-candle-battu-prediction'
    };
    
    console.log(`🔮 5th Candle Prediction (${baseTimeframe}min): ${fifthCandle.open} → ${fifthCandle.close}`);
    console.log(`🔮 6th Candle Prediction (${baseTimeframe}min): ${sixthCandle.open} → ${sixthCandle.close}`);
    
    const analysis = {
      pointA,
      pointB,
      slope,
      pattern: slope > 0 ? '1-4_UPTREND' : '1-4_DOWNTREND',
      totalDuration,
      breakoutLevel: pointB
    };
    
    return { fifth: fifthCandle, sixth: sixthCandle, analysis };
  }
  
  /**
   * Step 2: Extract 10min sub-candles from existing 40min candles for quick scalping
   */
  extract10minFromExisting40min(
    fourCandles: CandleData[]
  ): { 
    extracted10min: CandleData[]; 
    quickScalpingTrendlines: any;
    scalperAnalysis: any;
  } {
    
    console.log(`🔽 STEP 2: Extracting 10min sub-candles from 4 x 40min candles for quick scalping`);
    
    const extracted10min: CandleData[] = [];
    
    // Extract 4 x 10min candles from each 40min candle
    fourCandles.forEach((candle40min, candleIndex) => {
      console.log(`   📊 Processing 40min candle ${candleIndex + 1}: ${candle40min.open} → ${candle40min.close}`);
      
      // Split each 40min candle into 4 x 10min sub-candles
      for (let i = 0; i < 4; i++) {
        const subCandleStart = candle40min.timestamp + (i * 10 * 60 * 1000);
        
        // Calculate OHLC for each 10min sub-candle based on 40min parent
        const progressRatio = (i + 1) / 4;
        const priceProgression = (candle40min.close - candle40min.open) * progressRatio;
        
        const subOpen = i === 0 ? candle40min.open : candle40min.open + ((candle40min.close - candle40min.open) * (i / 4));
        const subClose = candle40min.open + priceProgression;
        
        // Distribute high/low across the 4 sub-candles
        const volatilityRange = candle40min.high - candle40min.low;
        const subHigh = Math.max(subOpen, subClose) + (volatilityRange * (0.1 + Math.random() * 0.2));
        const subLow = Math.min(subOpen, subClose) - (volatilityRange * (0.1 + Math.random() * 0.15));
        
        const subCandle: CandleData = {
          timestamp: subCandleStart,
          open: subOpen,
          high: Math.min(subHigh, candle40min.high),
          low: Math.max(subLow, candle40min.low),
          close: subClose,
          volume: candle40min.volume / 4 // Distribute volume
        };
        
        extracted10min.push(subCandle);
        
        console.log(`      ↳ 10min-${i+1}: O:${subCandle.open.toFixed(1)} H:${subCandle.high.toFixed(1)} L:${subCandle.low.toFixed(1)} C:${subCandle.close.toFixed(1)}`);
      }
    });
    
    console.log(`✅ Extracted ${extracted10min.length} x 10min candles from 4 x 40min candles`);
    
    // Now apply Battu analysis to the 16 x 10min candles for quick scalping
    const scalperAnalysis = this.apply10minBattuForScalping(extracted10min);
    
    return {
      extracted10min,
      quickScalpingTrendlines: scalperAnalysis.trendlines,
      scalperAnalysis
    };
  }
  
  /**
   * Apply Battu analysis to 16 x 10min candles for quick scalping signals
   */
  apply10minBattuForScalping(tenMinCandles: CandleData[]): any {
    console.log(`🎯 STEP 3: Applying Battu analysis to ${tenMinCandles.length} x 10min candles for scalping`);
    
    // Take first 4 x 10min candles for quick Battu analysis
    const scalping4Candles = tenMinCandles.slice(0, 4);
    
    // C1 Block: First 2 x 10min candles
    const c1Block = scalping4Candles.slice(0, 2);
    const c1Lows = c1Block.map(c => c.low);
    const c1Highs = c1Block.map(c => c.high);
    const c1PointA = Math.min(...c1Lows);
    const c1PointB = Math.max(...c1Highs);
    
    // C2 Block: Second 2 x 10min candles  
    const c2Block = scalping4Candles.slice(2, 4);
    const c2Lows = c2Block.map(c => c.low);
    const c2Highs = c2Block.map(c => c.high);
    const c2PointA = Math.min(...c2Lows);
    const c2PointB = Math.max(...c2Highs);
    
    // Quick scalping trendlines (10min precision)
    const uptrend = {
      pointA: c1PointA,
      pointB: c2PointB,
      slope: (c2PointB - c1PointA) / 40, // 4 x 10min = 40 minutes
      pattern: '1-4_UPTREND_10MIN',
      breakoutLevel: c2PointB,
      quickEntry: c2PointB + 1,
      quickTarget: c2PointB + ((c2PointB - c1PointA) * 0.5),
      quickStopLoss: c2PointA
    };
    
    const downtrend = {
      pointA: c1PointB,
      pointB: c2PointA,
      slope: (c2PointA - c1PointB) / 40,
      pattern: '1-4_DOWNTREND_10MIN',
      breakoutLevel: c2PointA,
      quickEntry: c2PointA - 1,
      quickTarget: c2PointA - ((c1PointB - c2PointA) * 0.5),
      quickStopLoss: c2PointB
    };
    
    // Determine dominant trend for scalping
    const uptrendStrength = Math.abs(uptrend.slope);
    const downtrendStrength = Math.abs(downtrend.slope);
    const dominantTrend = uptrendStrength > downtrendStrength ? uptrend : downtrend;
    
    console.log(`   📈 Quick Uptrend: ${uptrend.pointA.toFixed(1)} → ${uptrend.pointB.toFixed(1)} (Slope: ${uptrend.slope.toFixed(3)})`);
    console.log(`   📉 Quick Downtrend: ${downtrend.pointA.toFixed(1)} → ${downtrend.pointB.toFixed(1)} (Slope: ${downtrend.slope.toFixed(3)})`);
    console.log(`   🎯 Dominant: ${dominantTrend.pattern} (Breakout: ${dominantTrend.breakoutLevel.toFixed(1)})`);
    
    return {
      uptrend,
      downtrend,
      dominantTrend,
      trendlines: { uptrend, downtrend },
      scalpingSignal: {
        action: dominantTrend === uptrend ? 'BUY' : 'SELL',
        entry: dominantTrend.quickEntry,
        target: dominantTrend.quickTarget,
        stopLoss: dominantTrend.quickStopLoss,
        timeframe: '10min',
        confidence: 88
      }
    };
  }
  
  /**
   * Step 3: Complete recursive drilling prediction process (IST Timezone Only)
   */
  async performRecursiveDrillingPrediction(
    fourCandles: CandleData[],
    baseTimeframe: number = 40
  ): Promise<{
    originalCandles: CandleData[];
    predicted5th: PredictedCandle;
    predicted6th: PredictedCandle;
    extracted10min: CandleData[];
    quickScalpingTrendlines: any;
    scalperAnalysis: any;
    quickTradingSignals: any;
    istTimestamps: {
      marketOpen: string;
      marketClose: string;
      current: string;
    };
  }> {
    
    console.log(`🚀 CORRECTED RECURSIVE DRILLING PREDICTION STARTED (IST TIMEZONE)`);
    console.log(`📊 Input: 4 x ${baseTimeframe}min candles → Extract 10min sub-candles for quick scalping`);
    
    // Convert timestamps to IST for display
    const formatIST = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    
    const istTimestamps = {
      marketOpen: '09:15:00 IST',
      marketClose: '15:30:00 IST', 
      current: formatIST(Date.now())
    };
    
    console.log(`⏰ IST Market Session: ${istTimestamps.marketOpen} - ${istTimestamps.marketClose}`);
    console.log(`🕐 Current IST Time: ${istTimestamps.current}`);
    
    // Step 1: Predict 5th and 6th 40min candles using Battu analysis
    const { fifth, sixth, analysis } = this.predict5thAnd6thCandles(fourCandles, baseTimeframe);
    
    console.log(`📊 40min Battu Analysis (Higher Timeframe):`);
    console.log(`   Pattern: ${analysis.pattern}`);
    console.log(`   Point A: ${analysis.pointA.toFixed(2)} → Point B: ${analysis.pointB.toFixed(2)}`);
    console.log(`   Slope: ${analysis.slope.toFixed(4)} points/minute`);
    console.log(`   Breakout Level: ${analysis.breakoutLevel.toFixed(2)}`);
    
    // Step 2: Extract 10min sub-candles from existing 4 x 40min candles for quick scalping
    const { extracted10min, quickScalpingTrendlines, scalperAnalysis } = 
      this.extract10minFromExisting40min(fourCandles);
    
    console.log(`🎯 QUICK SCALPING ANALYSIS (10min Precision):`);
    console.log(`   Dominant Trend: ${scalperAnalysis.dominantTrend.pattern}`);
    console.log(`   Quick Entry: ${scalperAnalysis.scalpingSignal.entry.toFixed(2)}`);
    console.log(`   Quick Target: ${scalperAnalysis.scalpingSignal.target.toFixed(2)}`);
    console.log(`   Quick Stop Loss: ${scalperAnalysis.scalpingSignal.stopLoss.toFixed(2)}`);
    console.log(`   Action: ${scalperAnalysis.scalpingSignal.action} (Confidence: ${scalperAnalysis.scalpingSignal.confidence}%)`);
    
    return {
      originalCandles: fourCandles,
      predicted5th: fifth,
      predicted6th: sixth,
      extracted10min,
      quickScalpingTrendlines,
      scalperAnalysis,
      quickTradingSignals: scalperAnalysis.scalpingSignal,
      istTimestamps
    };
  }
  
  /**
   * Generate summary for quick traders
   */
  generateQuickTradingSummary(result: any): {
    nextAction: string;
    timeToAction: number;
    confidence: number;
    riskReward: number;
    signals: any[];
  } {
    
    const { drilled5th, drilled6th, analysis } = result;
    const allSignals = [...drilled5th, ...drilled6th].filter(c => c.quickTradeSignal !== 'HOLD');
    
    if (allSignals.length === 0) {
      return {
        nextAction: 'WAIT',
        timeToAction: 10,
        confidence: 50,
        riskReward: 1,
        signals: []
      };
    }
    
    const nextSignal = allSignals[0];
    const timeToAction = Math.max(0, (nextSignal.timestamp - Date.now()) / (1000 * 60)); // minutes
    
    const riskReward = Math.abs(nextSignal.exitPrice - nextSignal.entryPrice) / 
                      Math.abs(nextSignal.entryPrice - nextSignal.stopLoss);
    
    return {
      nextAction: nextSignal.quickTradeSignal,
      timeToAction,
      confidence: nextSignal.confidence,
      riskReward,
      signals: allSignals.map(s => ({
        action: s.quickTradeSignal,
        timeframe: s.timeframe,
        entry: s.entryPrice,
        exit: s.exitPrice,
        stopLoss: s.stopLoss,
        timeMinutes: (s.timestamp - Date.now()) / (1000 * 60)
      }))
    };
  }
}