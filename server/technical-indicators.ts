// Technical Indicators calculation functions
// Supporting all indicators available in the Custom Strategy dropdown

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Exponential Moving Average
export function calculateEMA(prices: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const emaArray: (number | null)[] = [];
  
  if (prices.length === 0) return emaArray;
  
  // Fill initial values with null
  for (let i = 0; i < period - 1; i++) {
    emaArray.push(null);
  }
  
  // First EMA value is simple average of first 'period' values
  if (prices.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    emaArray.push(sum / period);
    
    // Calculate EMA for the rest
    for (let i = period; i < prices.length; i++) {
      const prevEMA = emaArray[i - 1] as number;
      emaArray.push(prices[i] * k + prevEMA * (1 - k));
    }
  }
  
  return emaArray;
}

// Simple Moving Average
export function calculateSMA(prices: number[], period: number): (number | null)[] {
  const smaArray: (number | null)[] = [];
  
  if (prices.length === 0 || period <= 0) return smaArray;
  
  // Fill initial values with null
  for (let i = 0; i < period - 1; i++) {
    smaArray.push(null);
  }
  
  // Calculate SMA values
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
    smaArray.push(sum / period);
  }
  
  return smaArray;
}

// Weighted Moving Average
export function calculateWMA(prices: number[], period: number): (number | null)[] {
  const wmaArray: (number | null)[] = [];
  
  if (prices.length === 0 || period <= 0) return wmaArray;
  
  // Fill initial values with null
  for (let i = 0; i < period - 1; i++) {
    wmaArray.push(null);
  }
  
  // Calculate WMA values
  for (let i = period - 1; i < prices.length; i++) {
    let numerator = 0;
    let denominator = 0;
    
    for (let j = 0; j < period; j++) {
      const weight = j + 1;
      numerator += prices[i - period + 1 + j] * weight;
      denominator += weight;
    }
    
    wmaArray.push(numerator / denominator);
  }
  
  return wmaArray;
}

// Relative Strength Index
export function calculateRSI(prices: number[], period: number = 14): (number | null)[] {
  const rsiArray: (number | null)[] = [];
  
  if (prices.length === 0 || period <= 0) return rsiArray;
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Fill initial values with null
  for (let i = 0; i < period; i++) {
    rsiArray.push(null);
  }
  
  if (gains.length >= period) {
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
    
    // Calculate first RSI value
    const rs = avgGain / (avgLoss || 0.0001);
    rsiArray.push(100 - (100 / (1 + rs)));
    
    // Calculate subsequent RSI values using smoothed averages
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      
      const rs = avgGain / (avgLoss || 0.0001);
      rsiArray.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsiArray;
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macd: number[], signal: number[], histogram: number[] } | null {
  if (prices.length < slowPeriod + signalPeriod) {
    return null;
  }
  
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  const macdLine: number[] = [];
  
  // Calculate MACD line (Fast EMA - Slow EMA)
  for (let i = slowPeriod - 1; i < prices.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(fastEMA[i]! - slowEMA[i]!);
    }
  }
  
  // Calculate Signal line (EMA of MACD line)
  const signalEMA = calculateEMA(macdLine, signalPeriod);
  const signalLine = signalEMA.filter(val => val !== null) as number[];
  
  // Calculate Histogram (MACD - Signal)
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const histValue = macdLine[i + signalPeriod - 1] - signalLine[i];
    histogram.push(Math.round(histValue * 10000) / 10000);
  }
  
  return {
    macd: macdLine.map(val => Math.round(val * 10000) / 10000),
    signal: signalLine.map(val => Math.round(val * 10000) / 10000),
    histogram: histogram
  };
}

// Bollinger Bands
export function calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): { upper: (number | null)[], middle: (number | null)[], lower: (number | null)[] } {
  const sma = calculateSMA(prices, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      // Calculate standard deviation
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i]!;
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      upper.push(mean + (multiplier * stdDev));
      lower.push(mean - (multiplier * stdDev));
    }
  }
  
  return { upper, middle: sma, lower };
}

// Average True Range
export function calculateATR(candles: CandleData[], period: number = 14): (number | null)[] {
  const atrArray: (number | null)[] = [];
  const trueRanges: number[] = [];
  
  if (candles.length === 0) return atrArray;
  
  // Calculate True Range for each candle
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low);
    } else {
      const tr1 = candles[i].high - candles[i].low;
      const tr2 = Math.abs(candles[i].high - candles[i - 1].close);
      const tr3 = Math.abs(candles[i].low - candles[i - 1].close);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
  }
  
  // Calculate ATR using SMA of True Range
  const atrSMA = calculateSMA(trueRanges, period);
  return atrSMA;
}

// Stochastic Oscillator
export function calculateStochastic(candles: CandleData[], kPeriod: number = 14, dPeriod: number = 3): { k: (number | null)[], d: (number | null)[] } {
  const kArray: (number | null)[] = [];
  
  // Calculate %K
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      kArray.push(null);
    } else {
      const slice = candles.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...slice.map(c => c.high));
      const lowest = Math.min(...slice.map(c => c.low));
      const current = candles[i].close;
      
      const kValue = ((current - lowest) / (highest - lowest)) * 100;
      kArray.push(kValue);
    }
  }
  
  // Calculate %D (SMA of %K)
  const kValues = kArray.filter(val => val !== null) as number[];
  const dArray = calculateSMA(kValues, dPeriod);
  
  // Pad %D array to match length
  const paddedD: (number | null)[] = [];
  for (let i = 0; i < kPeriod - 1; i++) {
    paddedD.push(null);
  }
  paddedD.push(...dArray);
  
  return { k: kArray, d: paddedD };
}

// Commodity Channel Index
export function calculateCCI(candles: CandleData[], period: number = 20): (number | null)[] {
  const cciArray: (number | null)[] = [];
  const typicalPrices: number[] = [];
  
  // Calculate Typical Price
  for (const candle of candles) {
    typicalPrices.push((candle.high + candle.low + candle.close) / 3);
  }
  
  // Calculate SMA of Typical Price
  const sma = calculateSMA(typicalPrices, period);
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      cciArray.push(null);
    } else {
      const slice = typicalPrices.slice(i - period + 1, i + 1);
      const smaValue = sma[i]!;
      
      // Calculate Mean Deviation
      const meanDeviation = slice.reduce((sum, tp) => sum + Math.abs(tp - smaValue), 0) / period;
      
      const cci = (typicalPrices[i] - smaValue) / (0.015 * meanDeviation);
      cciArray.push(cci);
    }
  }
  
  return cciArray;
}

// Money Flow Index
export function calculateMFI(candles: CandleData[], period: number = 14): (number | null)[] {
  const mfiArray: (number | null)[] = [];
  const moneyFlows: number[] = [];
  
  // Calculate Money Flow for each candle
  for (let i = 0; i < candles.length; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const moneyFlow = typicalPrice * candles[i].volume;
    moneyFlows.push(moneyFlow);
  }
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      mfiArray.push(null);
    } else {
      let positiveMoneyFlow = 0;
      let negativeMoneyFlow = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const currentTP = (candles[j].high + candles[j].low + candles[j].close) / 3;
        const prevTP = (candles[j - 1].high + candles[j - 1].low + candles[j - 1].close) / 3;
        
        if (currentTP > prevTP) {
          positiveMoneyFlow += moneyFlows[j];
        } else if (currentTP < prevTP) {
          negativeMoneyFlow += moneyFlows[j];
        }
      }
      
      const moneyFlowRatio = positiveMoneyFlow / (negativeMoneyFlow || 1);
      const mfi = 100 - (100 / (1 + moneyFlowRatio));
      mfiArray.push(mfi);
    }
  }
  
  return mfiArray;
}

// Williams %R
export function calculateWilliamsR(candles: CandleData[], period: number = 14): (number | null)[] {
  const williamsRArray: (number | null)[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      williamsRArray.push(null);
    } else {
      const slice = candles.slice(i - period + 1, i + 1);
      const highest = Math.max(...slice.map(c => c.high));
      const lowest = Math.min(...slice.map(c => c.low));
      const current = candles[i].close;
      
      const williamsR = ((highest - current) / (highest - lowest)) * -100;
      williamsRArray.push(williamsR);
    }
  }
  
  return williamsRArray;
}

// Rate of Change
export function calculateROC(prices: number[], period: number = 12): (number | null)[] {
  const rocArray: (number | null)[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rocArray.push(null);
    } else {
      const currentPrice = prices[i];
      const pastPrice = prices[i - period];
      const roc = ((currentPrice - pastPrice) / pastPrice) * 100;
      rocArray.push(roc);
    }
  }
  
  return rocArray;
}

// Average Directional Index (simplified version)
export function calculateADX(candles: CandleData[], period: number = 14): (number | null)[] {
  const adxArray: (number | null)[] = [];
  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];
  
  // Calculate True Range, +DM, and -DM
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low);
      plusDMs.push(0);
      minusDMs.push(0);
    } else {
      // True Range
      const tr1 = candles[i].high - candles[i].low;
      const tr2 = Math.abs(candles[i].high - candles[i - 1].close);
      const tr3 = Math.abs(candles[i].low - candles[i - 1].close);
      trueRanges.push(Math.max(tr1, tr2, tr3));
      
      // Directional Movement
      const highDiff = candles[i].high - candles[i - 1].high;
      const lowDiff = candles[i - 1].low - candles[i].low;
      
      plusDMs.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      minusDMs.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
    }
  }
  
  // Simplified ADX calculation
  for (let i = 0; i < candles.length; i++) {
    if (i < period * 2) {
      adxArray.push(null);
    } else {
      // This is a simplified version - a full ADX implementation would be more complex
      const avgTR = trueRanges.slice(i - period + 1, i + 1).reduce((sum, tr) => sum + tr, 0) / period;
      const avgPlusDM = plusDMs.slice(i - period + 1, i + 1).reduce((sum, dm) => sum + dm, 0) / period;
      const avgMinusDM = minusDMs.slice(i - period + 1, i + 1).reduce((sum, dm) => sum + dm, 0) / period;
      
      const plusDI = (avgPlusDM / avgTR) * 100;
      const minusDI = (avgMinusDM / avgTR) * 100;
      const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
      
      adxArray.push(dx);
    }
  }
  
  return adxArray;
}

// Parabolic SAR (simplified version)
export function calculatePSAR(candles: CandleData[], step: number = 0.02, maxStep: number = 0.2): (number | null)[] {
  const psarArray: (number | null)[] = [];
  
  if (candles.length < 2) return psarArray;
  
  let isUptrend = candles[1].close > candles[0].close;
  let sar = isUptrend ? candles[0].low : candles[0].high;
  let ep = isUptrend ? candles[1].high : candles[1].low;
  let af = step;
  
  psarArray.push(null); // First value is null
  psarArray.push(sar);
  
  for (let i = 2; i < candles.length; i++) {
    const prevSar = sar;
    sar = prevSar + af * (ep - prevSar);
    
    if (isUptrend) {
      if (candles[i].high > ep) {
        ep = candles[i].high;
        af = Math.min(af + step, maxStep);
      }
      
      if (candles[i].low <= sar) {
        isUptrend = false;
        sar = ep;
        ep = candles[i].low;
        af = step;
      }
    } else {
      if (candles[i].low < ep) {
        ep = candles[i].low;
        af = Math.min(af + step, maxStep);
      }
      
      if (candles[i].high >= sar) {
        isUptrend = true;
        sar = ep;
        ep = candles[i].high;
        af = step;
      }
    }
    
    psarArray.push(sar);
  }
  
  return psarArray;
}

// Volume Weighted Average Price
export function calculateVWAP(candles: CandleData[]): (number | null)[] {
  const vwapArray: (number | null)[] = [];
  let cumulativeTPV = 0; // Cumulative Typical Price * Volume
  let cumulativeVolume = 0;
  
  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
    
    const vwap = cumulativeTPV / cumulativeVolume;
    vwapArray.push(vwap);
  }
  
  return vwapArray;
}

// Helper function to detect EMA crossovers (used in strategy testing)
export function detectEMACrossovers(prices: number[], period: number): Array<{
  index: number;
  type: 'EMA_CROSS_ABOVE' | 'EMA_CROSS_BELOW';
  timestamp: number;
  indicatorValue: number;
  time: string;
}> {
  const ema = calculateEMA(prices, period);
  const crossovers = [];
  
  for (let i = 1; i < prices.length; i++) {
    if (ema[i] !== null && ema[i - 1] !== null) {
      const currentPrice = prices[i];
      const prevPrice = prices[i - 1];
      const currentEMA = ema[i]!;
      const prevEMA = ema[i - 1]!;
      
      // Price crosses above EMA
      if (prevPrice <= prevEMA && currentPrice > currentEMA) {
        crossovers.push({
          index: i,
          type: 'EMA_CROSS_ABOVE' as const,
          timestamp: Date.now() / 1000 + i * 60, // Mock timestamp
          indicatorValue: currentEMA,
          time: `${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}:00`
        });
      }
      
      // Price crosses below EMA
      if (prevPrice >= prevEMA && currentPrice < currentEMA) {
        crossovers.push({
          index: i,
          type: 'EMA_CROSS_BELOW' as const,
          timestamp: Date.now() / 1000 + i * 60, // Mock timestamp
          indicatorValue: currentEMA,
          time: `${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}:00`
        });
      }
    }
  }
  
  return crossovers;
}