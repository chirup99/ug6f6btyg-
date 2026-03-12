// Utility functions for exit price calculations to avoid NaN issues

export const calculateExitPrice = (
  candleClose: number | undefined,
  livePrice: number | undefined,
  breakoutLevel: number,
  targetReached: boolean
): { exitPrice: number; exitAmount: number; displayPrice: string; displayAmount: string } => {
  
  // Use actual candle close price if available, otherwise live price
  const actualPrice = candleClose || livePrice;
  
  if (!actualPrice) {
    return {
      exitPrice: 0,
      exitAmount: 0,
      displayPrice: 'N/A',
      displayAmount: 'N/A'
    };
  }

  if (targetReached) {
    // Target reached - use actual price for profit calculation
    const exitAmount = actualPrice - breakoutLevel;
    return {
      exitPrice: actualPrice,
      exitAmount,
      displayPrice: actualPrice.toFixed(2),
      displayAmount: exitAmount.toFixed(2)
    };
  } else {
    // Target not reached at candle close - use actual candle close price (not 98% of live price)  
    const exitAmount = actualPrice - breakoutLevel;
    return {
      exitPrice: actualPrice,
      exitAmount,
      displayPrice: actualPrice.toFixed(2),
      displayAmount: exitAmount.toFixed(2)
    };
  }
};

// Stop loss calculation for 4-candle rule
export const calculateStopLoss = (
  triggeredCandle: '5th' | '6th',
  trendDirection: 'uptrend' | 'downtrend',
  fourthCandleData: { high: number; low: number } | undefined,
  fifthCandleData: { high: number; low: number } | undefined
): { stopLossPrice: number; stopLossSource: string; displayPrice: string } => {
  
  if (triggeredCandle === '5th') {
    // 5th candle triggered: Stop loss = 4th candle low (uptrend) or high (downtrend)
    if (!fourthCandleData) {
      return {
        stopLossPrice: 0,
        stopLossSource: '4th candle (unavailable)',
        displayPrice: 'N/A'
      };
    }
    
    const stopLossPrice = trendDirection === 'uptrend' ? fourthCandleData.low : fourthCandleData.high;
    return {
      stopLossPrice,
      stopLossSource: `4th candle ${trendDirection === 'uptrend' ? 'low' : 'high'}`,
      displayPrice: stopLossPrice.toFixed(2)
    };
  } else {
    // 6th candle triggered: Stop loss = 5th candle
    if (!fifthCandleData) {
      return {
        stopLossPrice: 0,
        stopLossSource: '5th candle (unavailable)',
        displayPrice: 'N/A'
      };
    }
    
    // Stop loss based on trigger candle logic:
    // - 5th candle trigger: Use 4th candle high/low as stop loss  
    // - 6th candle trigger: Use 5th candle high/low as stop loss
    // Since this function is called with fifthCandleData, we assume 5th candle trigger for now
    // Note: This should be updated to receive the appropriate reference candle based on trigger
    const stopLossPrice = trendDirection === 'uptrend' ? fifthCandleData.low : fifthCandleData.high;
    return {
      stopLossPrice,
      stopLossSource: `Previous candle ${trendDirection === 'uptrend' ? 'low' : 'high'}`,
      displayPrice: stopLossPrice.toFixed(2)
    };
  }
};

export const calculate98PercentExitPrice = (
  livePrice: number | undefined,
  breakoutLevel: number
): { exitPrice: number; exitAmount: number; displayPrice: string; displayAmount: string } => {
  
  if (!livePrice) {
    return {
      exitPrice: 0,
      exitAmount: 0,
      displayPrice: 'N/A',
      displayAmount: 'N/A'
    };
  }

  // For 98% timing, use 98% of current live price
  const exitPrice = livePrice * 0.98;
  const exitAmount = exitPrice - breakoutLevel;
  
  return {
    exitPrice,
    exitAmount,
    displayPrice: exitPrice.toFixed(2),
    displayAmount: exitAmount.toFixed(2)
  };
};