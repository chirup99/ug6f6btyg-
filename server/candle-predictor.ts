// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

interface PredictedCandle {
  candleName: string;
  timeframe: number;
  startTime: number;
  endTime: number;
  predictedHigh: number;
  predictedLow: number;
  predictedOpen: number;
  predictedClose: number;
  confidence: number;
  basedOnTrend: 'uptrend' | 'downtrend';
  patternName: string;
}

interface TrendlineData {
  pointA: {
    price: number;
    timestamp: number;
    formattedTime: string;
  };
  pointB: {
    price: number;
    timestamp: number;
    formattedTime: string;
  };
  slope: number;
  trendType: 'uptrend' | 'downtrend';
  patternName: string;
}

export class CandlePredictor {
  private fyersAPI: FyersAPI;

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * Predict 5th and 6th candle values using slope trendlines from 4-candle analysis
   */
  async predictFifthAndSixthCandles(
    symbol: string,
    date: string,
    timeframe: number,
    trendlines: TrendlineData[],
    lastCandleEndTime: number
  ): Promise<{
    fifthCandle: PredictedCandle;
    sixthCandle: PredictedCandle;
    methodology: string;
  }> {
    try {
      console.log('🔮 Starting 5th and 6th candle prediction using slope trendlines...');
      
      // Calculate 5th candle time window
      const fifthCandleStart = lastCandleEndTime;
      const fifthCandleEnd = fifthCandleStart + (timeframe * 60);
      
      // Calculate 6th candle time window  
      const sixthCandleStart = fifthCandleEnd;
      const sixthCandleEnd = sixthCandleStart + (timeframe * 60);

      // Select dominant trendline (strongest slope)
      const dominantTrend = this.selectDominantTrend(trendlines);
      console.log(`📈 Selected dominant trend: ${dominantTrend.trendType} with slope ${dominantTrend.slope}`);

      // Predict 5th candle
      const fifthCandle = await this.predictSingleCandle(
        '5th',
        fifthCandleStart,
        fifthCandleEnd,
        timeframe,
        dominantTrend,
        1 // 1 period ahead
      );

      // Predict 6th candle
      const sixthCandle = await this.predictSingleCandle(
        '6th',
        sixthCandleStart,
        sixthCandleEnd,
        timeframe,
        dominantTrend,
        2 // 2 periods ahead
      );

      return {
        fifthCandle,
        sixthCandle,
        methodology: 'Linear trendline extrapolation using corrected slope calculations from 4-candle analysis with 1-minute precision timestamps'
      };

    } catch (error) {
      console.error('❌ Error predicting candles:', error);
      throw error;
    }
  }

  /**
   * Select the dominant trend based on slope strength and pattern reliability
   */
  private selectDominantTrend(trendlines: TrendlineData[]): TrendlineData {
    if (trendlines.length === 0) {
      throw new Error('No trendlines available for prediction');
    }

    // Prioritize by absolute slope strength
    const sortedByStrength = trendlines.sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope));
    
    // Log selection rationale
    const selected = sortedByStrength[0];
    console.log(`🎯 Dominant trend selected: ${selected.trendType} ${selected.patternName} with slope ${selected.slope} pts/min`);
    
    return selected;
  }

  /**
   * Predict a single candle using trendline extrapolation
   */
  private async predictSingleCandle(
    candleName: string,
    startTime: number,
    endTime: number,
    timeframe: number,
    dominantTrend: TrendlineData,
    periodsAhead: number
  ): Promise<PredictedCandle> {
    
    // Calculate time difference from last known point
    const timeDiffMinutes = (startTime - dominantTrend.pointB.timestamp) / 60;
    
    // Predict price using linear extrapolation
    const pricePrediction = dominantTrend.pointB.price + (dominantTrend.slope * timeDiffMinutes);
    
    // Calculate confidence based on trend strength and time distance
    const baseConfidence = Math.min(Math.abs(dominantTrend.slope) * 10, 90); // Max 90% confidence
    const timeDecay = Math.max(0.5, 1 - (periodsAhead * 0.15)); // Decrease confidence with distance
    const confidence = Math.round(baseConfidence * timeDecay);

    // Generate OHLC predictions based on trend direction
    let predictedHigh: number;
    let predictedLow: number;
    let predictedOpen: number;
    let predictedClose: number;

    if (dominantTrend.trendType === 'uptrend') {
      // Uptrend: expect higher highs and higher lows
      predictedOpen = pricePrediction;
      predictedClose = pricePrediction + (Math.abs(dominantTrend.slope) * 0.3); // Slightly higher close
      predictedHigh = predictedClose + (Math.abs(dominantTrend.slope) * 0.2); // Higher high
      predictedLow = predictedOpen - (Math.abs(dominantTrend.slope) * 0.1); // Higher low
    } else {
      // Downtrend: expect lower highs and lower lows
      predictedOpen = pricePrediction;
      predictedClose = pricePrediction - (Math.abs(dominantTrend.slope) * 0.3); // Lower close
      predictedLow = predictedClose - (Math.abs(dominantTrend.slope) * 0.2); // Lower low
      predictedHigh = predictedOpen + (Math.abs(dominantTrend.slope) * 0.1); // Lower high
    }

    console.log(`🔮 ${candleName} candle prediction: O:${predictedOpen.toFixed(2)} H:${predictedHigh.toFixed(2)} L:${predictedLow.toFixed(2)} C:${predictedClose.toFixed(2)} (${confidence}%)`);

    return {
      candleName,
      timeframe,
      startTime,
      endTime,
      predictedHigh: Number(predictedHigh.toFixed(2)),
      predictedLow: Number(predictedLow.toFixed(2)),
      predictedOpen: Number(predictedOpen.toFixed(2)),
      predictedClose: Number(predictedClose.toFixed(2)),
      confidence,
      basedOnTrend: dominantTrend.trendType,
      patternName: dominantTrend.patternName
    };
  }

  /**
   * Format prediction for display
   */
  formatPredictionForDisplay(prediction: PredictedCandle): string {
    const startTime = new Date(prediction.startTime * 1000).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const endTime = new Date(prediction.endTime * 1000).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `${prediction.candleName} Candle (${startTime}-${endTime}): O:${prediction.predictedOpen} H:${prediction.predictedHigh} L:${prediction.predictedLow} C:${prediction.predictedClose} | ${prediction.basedOnTrend} ${prediction.patternName} | ${prediction.confidence}% confidence`;
  }
}