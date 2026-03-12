import React, { useEffect, useState } from 'react';

interface TrendlinePoint {
  timestamp: number;
  price: number;
  formattedTime: string;
  candleName: string;
  priceType: string;
}

interface SlopeData {
  pointA: TrendlinePoint;
  pointB: TrendlinePoint;
  slope: number;
  trendType: 'uptrend' | 'downtrend';
  patternName: string;
}

interface BreakoutLevel {
  timestamp: number;
  price: number;
  formattedTime: string;
  candleName: string;
  levelType: 'high' | 'low';
}

interface PredictedCandle {
  startTime: number;
  endTime: number;
  predictedHigh: number;
  predictedLow: number;
  predictedOpen: number;
  predictedClose: number;
  candleName: string;
}

interface CandleBlock {
  name: string;
  startTime: number;
  endTime: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

interface RealCandle {
  startTime: number;
  endTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  available: boolean;
}

interface RealCandleData {
  success: boolean;
  fifthCandle: RealCandle;
  sixthCandle: RealCandle;
  timeframe: number;
  totalCandlesFound: number;
}

interface TrendlineChartProps {
  slopes?: SlopeData[];
  candleBlocks?: CandleBlock[];
  predictions?: {
    fifthCandle: PredictedCandle;
    sixthCandle: PredictedCandle;
  };
  realCandleData?: RealCandleData;
  timeframe?: number;
  dualValidation?: any;
  // 3-Candle Rule specific props
  uptrend?: any;
  downtrend?: any;
  predictedFourthCandle?: any;
  is3CandleRule?: boolean;
}

// Calculate breakout levels based on pattern rules
const calculateBreakoutLevel = (slope: SlopeData, candleBlocks?: CandleBlock[]): BreakoutLevel => {
  const pattern = slope.patternName;
  
  // Pattern breakout rules:
  // 1-4: C1A → C2B, breakout at C2B
  // 2-4: C1B → C2B, breakout at C2B  
  // 1-3: C1A → C2A, breakout at C2A
  // 2-3: C1B → C2B (special), breakout at C2A (special)
  
  if (pattern === '2-3') {
    // Special case: 2-3 pattern uses C2A for breakout, not C2B
    // Find C2A from candleBlocks data
    const c2aCandle = candleBlocks?.find(candle => candle.name === 'C2A');
    
    if (c2aCandle) {
      const breakoutPrice = slope.trendType === 'uptrend' ? c2aCandle.high : c2aCandle.low;
      return {
        timestamp: c2aCandle.startTime + (c2aCandle.endTime - c2aCandle.startTime) / 2, // Midpoint of C2A
        price: breakoutPrice,
        formattedTime: new Date(c2aCandle.startTime * 1000).toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata', hour12: true 
        }),
        candleName: 'C2A',
        levelType: slope.trendType === 'uptrend' ? 'high' : 'low'
      };
    }
  }
  
  // For patterns 1-3, 1-4, 2-4: breakout at Point B
  return {
    timestamp: slope.pointB.timestamp,
    price: slope.trendType === 'uptrend' ? slope.pointB.price : slope.pointB.price,
    formattedTime: slope.pointB.formattedTime,
    candleName: slope.pointB.candleName,
    levelType: slope.trendType === 'uptrend' ? 'high' : 'low'
  };
};

export function TrendlineChart({ 
  slopes, 
  candleBlocks, 
  predictions, 
  realCandleData, 
  timeframe, 
  dualValidation,
  uptrend,
  downtrend,
  predictedFourthCandle,
  is3CandleRule = false
}: TrendlineChartProps) {
  // Handle 3-candle rule mode
  if (is3CandleRule) {
    if (!candleBlocks || candleBlocks.length !== 3) return null;
    
    // Calculate chart dimensions and scaling
    const chartWidth = 800;
    const chartHeight = 400;
    const padding = 60;
    const candleWidth = 80;
    const candleSpacing = 120;
    
    // Find price range
    const allPrices = candleBlocks.flatMap(candle => [candle.high, candle.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const priceBuffer = priceRange * 0.1;
    const scaledMinPrice = minPrice - priceBuffer;
    const scaledMaxPrice = maxPrice + priceBuffer;
    const scaledPriceRange = scaledMaxPrice - scaledMinPrice;
    
    // Price to Y coordinate conversion
    const priceToY = (price: number) => {
      return padding + ((scaledMaxPrice - price) / scaledPriceRange) * (chartHeight - 2 * padding);
    };
    
    // Time to X coordinate conversion
    const timeToX = (index: number) => {
      return padding + index * candleSpacing + candleWidth / 2;
    };
    
    // Calculate trendline points
    const generateTrendlinePoints = (trendline: any, candleCount: number = 3) => {
      if (!trendline || !trendline.startPoint || !trendline.endPoint) return null;
      
      const startX = timeToX(0); // Start from C1A
      const endX = timeToX(candleCount - 1); // End at C2A (3rd candle)
      const startY = priceToY(typeof trendline.startPoint === 'object' ? trendline.startPoint.value : trendline.startPoint);
      const endY = priceToY(typeof trendline.endPoint === 'object' ? trendline.endPoint.value : trendline.endPoint);
      
      return { startX, startY, endX, endY };
    };
    
    const uptrendPoints = generateTrendlinePoints(uptrend);
    const downtrendPoints = generateTrendlinePoints(downtrend);
    
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">3-Candle Trendline Visualization</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Dual higher trendlines and 4th candle (C2B) prediction</p>
        </div>
        
        <div className="flex justify-center">
          <svg width={chartWidth} height={chartHeight} className="border border-gray-200 rounded">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Price axis labels */}
            {Array.from({ length: 6 }, (_, i) => {
              const price = scaledMaxPrice - (scaledPriceRange * i / 5);
              const y = priceToY(price);
              return (
                <g key={i}>
                  <line x1={padding - 10} y1={y} x2={padding} y2={y} stroke="#666" strokeWidth="1" />
                  <text x={padding - 15} y={y + 4} textAnchor="end" fontSize="10" fill="#666">
                    {price.toFixed(0)}
                  </text>
                </g>
              );
            })}
            
            {/* Draw candlesticks */}
            {candleBlocks.map((candle, index) => {
              const x = timeToX(index);
              const openY = priceToY(candle.open);
              const closeY = priceToY(candle.close);
              const highY = priceToY(candle.high);
              const lowY = priceToY(candle.low);
              const isGreen = candle.close > candle.open;
              
              return (
                <g key={index}>
                  {/* High-Low line */}
                  <line 
                    x1={x} y1={highY} 
                    x2={x} y2={lowY} 
                    stroke="#333" 
                    strokeWidth="2"
                  />
                  
                  {/* Body rectangle */}
                  <rect
                    x={x - candleWidth/2}
                    y={Math.min(openY, closeY)}
                    width={candleWidth}
                    height={Math.abs(closeY - openY) || 2}
                    fill={isGreen ? '#10b981' : '#ef4444'}
                    stroke="#333"
                    strokeWidth="1"
                  />
                  
                  {/* Candle label */}
                  <text 
                    x={x} 
                    y={chartHeight - padding + 20} 
                    textAnchor="middle" 
                    fontSize="12" 
                    fontWeight="bold"
                    fill="#333"
                  >
                    {candle.name}
                  </text>
                  
                  {/* Price labels */}
                  <text 
                    x={x} 
                    y={highY - 8} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#10b981"
                  >
                    H: {candle.high.toFixed(1)}
                  </text>
                  <text 
                    x={x} 
                    y={lowY + 18} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#ef4444"
                  >
                    L: {candle.low.toFixed(1)}
                  </text>
                </g>
              );
            })}
            
            {/* Draw uptrend line */}
            {uptrendPoints && (
              <g>
                <line
                  x1={uptrendPoints.startX}
                  y1={uptrendPoints.startY}
                  x2={uptrendPoints.endX}
                  y2={uptrendPoints.endY}
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="none"
                />
                <circle cx={uptrendPoints.startX} cy={uptrendPoints.startY} r="4" fill="#10b981" />
                <circle cx={uptrendPoints.endX} cy={uptrendPoints.endY} r="4" fill="#10b981" />
                <text x={uptrendPoints.endX + 10} y={uptrendPoints.endY - 5} fontSize="12" fill="#10b981" fontWeight="bold">
                  Uptrend
                </text>
              </g>
            )}
            
            {/* Draw downtrend line */}
            {downtrendPoints && (
              <g>
                <line
                  x1={downtrendPoints.startX}
                  y1={downtrendPoints.startY}
                  x2={downtrendPoints.endX}
                  y2={downtrendPoints.endY}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="none"
                />
                <circle cx={downtrendPoints.startX} cy={downtrendPoints.startY} r="4" fill="#ef4444" />
                <circle cx={downtrendPoints.endX} cy={downtrendPoints.endY} r="4" fill="#ef4444" />
                <text x={downtrendPoints.endX + 10} y={downtrendPoints.endY + 15} fontSize="12" fill="#ef4444" fontWeight="bold">
                  Downtrend
                </text>
              </g>
            )}
            
            {/* Draw predicted 4th candle position */}
            {predictedFourthCandle && (
              <g>
                <rect
                  x={timeToX(3) - candleWidth/2}
                  y={padding}
                  width={candleWidth}
                  height={chartHeight - 2 * padding}
                  fill="rgba(147, 51, 234, 0.1)"
                  stroke="#9333ea"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                <text 
                  x={timeToX(3)} 
                  y={chartHeight - padding + 20} 
                  textAnchor="middle" 
                  fontSize="12" 
                  fontWeight="bold"
                  fill="#9333ea"
                >
                  C2B (Predicted)
                </text>
              </g>
            )}
            
            {/* Chart title */}
            <text x={chartWidth/2} y={30} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333">
              3-Candle Rule: Dual Trendlines Analysis
            </text>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex justify-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500"></div>
              <span>Uptrend Line</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500"></div>
              <span>Downtrend Line</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500"></div>
              <span>Bullish Candle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500"></div>
              <span>Bearish Candle</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {candleBlocks.map((candle, index) => (
            <div key={index} className="bg-white p-3 rounded border">
              <div className="font-medium text-center mb-2">{candle.name}</div>
              <div className="text-xs space-y-1">
                <div>O: {candle.open.toFixed(2)}</div>
                <div className="text-green-600">H: {candle.high.toFixed(2)}</div>
                <div className="text-red-600">L: {candle.low.toFixed(2)}</div>
                <div>C: {candle.close.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

        {predictedFourthCandle && (
          <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="font-medium text-purple-800 dark:text-gray-200 mb-2">Predicted 4th Candle (C2B)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm dark:text-gray-300">
              <div>Open: {predictedFourthCandle.predictedOpen?.toFixed(2) || 'N/A'}</div>
              <div className="text-green-600 dark:text-green-400">High: {predictedFourthCandle.predictedHigh?.toFixed(2) || 'N/A'}</div>
              <div className="text-red-600 dark:text-red-400">Low: {predictedFourthCandle.predictedLow?.toFixed(2) || 'N/A'}</div>
              <div>Close: {predictedFourthCandle.predictedClose?.toFixed(2) || 'N/A'}</div>
            </div>
            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
              Confidence: {((predictedFourthCandle.confidence || 0) * 100).toFixed(1)}%
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {uptrend && (
            <div className="bg-green-50 dark:bg-gray-700 p-3 rounded">
              <div className="font-medium text-green-800 dark:text-gray-200">Uptrend Analysis</div>
              <div className="text-sm text-green-700 dark:text-gray-300">
                Slope: {uptrend.slope?.toFixed(3)} pts/min
              </div>
            </div>
          )}
          {downtrend && (
            <div className="bg-red-50 dark:bg-gray-700 p-3 rounded">
              <div className="font-medium text-red-800 dark:text-gray-200">Downtrend Analysis</div>
              <div className="text-sm text-red-700 dark:text-gray-300">
                Slope: {downtrend.slope?.toFixed(3)} pts/min
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original 4-candle rule mode
  if (!slopes || slopes.length === 0) return null;

  // Dynamic refresh state for time-based breakout line updates
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 30 seconds for dynamic timing updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Get the earliest and latest timestamps for chart bounds
  const allTimestamps = slopes.flatMap(slope => [slope.pointA.timestamp, slope.pointB.timestamp]);
  
  // Add prediction timestamps if available
  if (predictions) {
    allTimestamps.push(predictions.fifthCandle.startTime, predictions.sixthCandle.endTime);
  }

  const minTimestamp = Math.min(...allTimestamps);
  const maxTimestamp = Math.max(...allTimestamps);
  
  // Get price range
  const allPrices = slopes.flatMap(slope => [slope.pointA.price, slope.pointB.price]);
  if (predictions) {
    allPrices.push(
      predictions.fifthCandle.predictedHigh,
      predictions.fifthCandle.predictedLow,
      predictions.sixthCandle.predictedHigh,
      predictions.sixthCandle.predictedLow
    );
  }
  
  // Add breakout levels to price range
  slopes.forEach(slope => {
    const breakoutLevel = calculateBreakoutLevel(slope, candleBlocks);
    if (breakoutLevel) {
      allPrices.push(breakoutLevel.price);
    }
  });
  
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const priceBuffer = priceRange * 0.1; // 10% buffer

  // Chart bounds object for use in components
  const chartBounds = {
    minPrice: minPrice - priceBuffer,
    maxPrice: maxPrice + priceBuffer,
    minTimestamp,
    maxTimestamp
  };

  // Chart dimensions
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = 60;

  // Convert timestamp to x-coordinate
  const timestampToX = (timestamp: number) => {
    const timeRange = maxTimestamp - minTimestamp;
    return padding + ((timestamp - minTimestamp) / timeRange) * (chartWidth - 2 * padding);
  };

  // Convert price to y-coordinate (inverted for SVG)
  const priceToY = (price: number) => {
    const adjustedMin = minPrice - priceBuffer;
    const adjustedMax = maxPrice + priceBuffer;
    const adjustedRange = adjustedMax - adjustedMin;
    return padding + ((adjustedMax - price) / adjustedRange) * (chartHeight - 2 * padding);
  };

  // Extend trendline to 6th candle end time
  const extendTrendline = (slope: SlopeData, endTimestamp: number) => {
    const timeExtension = (endTimestamp - slope.pointB.timestamp) / 60; // Convert to minutes
    const priceExtension = slope.slope * timeExtension;
    return slope.pointB.price + priceExtension;
  };

  const sixthCandleEndTime = predictions?.sixthCandle.endTime || (maxTimestamp + (timeframe ?? 10) * 60 * 2);

  return (
    <div className="w-full p-4 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-center">Trendline Visualization with Extension to 6th Candle</h3>
      
      <svg width={chartWidth} height={chartHeight} className="border rounded bg-gray-50">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Price axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const price = minPrice - priceBuffer + ratio * (maxPrice - minPrice + 2 * priceBuffer);
          const y = priceToY(price);
          return (
            <g key={i}>
              <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#6b7280" strokeWidth="1"/>
              <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#6b7280">
                {price.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Time axis labels */}
        {slopes.map((slope, i) => {
          const pointAX = timestampToX(slope.pointA.timestamp);
          const pointBX = timestampToX(slope.pointB.timestamp);
          
          return (
            <g key={`time-${i}`}>
              <line x1={pointAX} y1={chartHeight - padding} x2={pointAX} y2={chartHeight - padding + 5} stroke="#6b7280" strokeWidth="1"/>
              <text x={pointAX} y={chartHeight - padding + 20} textAnchor="middle" fontSize="10" fill="#6b7280">
                {slope.pointA.formattedTime}
              </text>
              
              <line x1={pointBX} y1={chartHeight - padding} x2={pointBX} y2={chartHeight - padding + 5} stroke="#6b7280" strokeWidth="1"/>
              <text x={pointBX} y={chartHeight - padding + 20} textAnchor="middle" fontSize="10" fill="#6b7280">
                {slope.pointB.formattedTime}
              </text>
            </g>
          );
        })}

        {/* 6th candle time marker */}
        {predictions && (
          <g>
            <line 
              x1={timestampToX(sixthCandleEndTime)} 
              y1={padding} 
              x2={timestampToX(sixthCandleEndTime)} 
              y2={chartHeight - padding} 
              stroke="#8b5cf6" 
              strokeWidth="2" 
              strokeDasharray="5,5"
            />
            <text 
              x={timestampToX(sixthCandleEndTime)} 
              y={padding - 10} 
              textAnchor="middle" 
              fontSize="12" 
              fill="#8b5cf6" 
              fontWeight="bold"
            >
              6th Candle End
            </text>
          </g>
        )}

        {/* Draw breakout lines */}
        {slopes.map((slope, i) => {
          const breakoutLevel = calculateBreakoutLevel(slope, candleBlocks);
          
          // Calculate total 4-candle duration
          const firstCandle = candleBlocks?.find(c => c.name === 'C1A');
          const lastCandle = candleBlocks?.find(c => c.name === 'C2B');
          
          if (!firstCandle || !lastCandle) return null;
          
          const total4CandleDuration = (lastCandle.endTime - firstCandle.startTime) / 60; // in minutes
          const pointAToPointBDuration = (slope.pointB.timestamp - slope.pointA.timestamp) / 60; // in minutes
          const durationRatio = pointAToPointBDuration / total4CandleDuration;
          
          // BREAKOUT LEVEL VALIDATION: Point A to 5th candle breakout must be ≥50% of total 4-candle duration
          const breakoutRequiredDuration = total4CandleDuration * 0.5; // 50% threshold in minutes
          
          // Calculate 5th candle start time (after C2B ends)
          const fifthCandleStartTime = lastCandle.endTime; // C2B end = 5th candle start
          const pointAToBreakoutDuration = (fifthCandleStartTime - slope.pointA.timestamp) / 60; // in minutes
          const isBreakoutDurationValid = pointAToBreakoutDuration >= breakoutRequiredDuration;
          
          // TIME-BASED VALIDATION: Calculate when 50% duration will be reached from Point A for 5th candle
          const breakoutThresholdTimestamp = slope.pointA.timestamp + (breakoutRequiredDuration * 60); // From Point A start
          
          const currentTime = Date.now() / 1000;
          
          // Check if time-based 50% threshold has been reached (5th candle time)
          const isTimeBasedBreakoutValid = currentTime >= breakoutThresholdTimestamp;
          
          // Breakout level conditions: Show if Point A to 5th candle ≥50% OR time has passed 50% threshold
          const shouldShowBreakout = isBreakoutDurationValid || isTimeBasedBreakoutValid;
          
          // SL ORDER DUAL VALIDATION SYSTEM:
          // 1. Point A→B duration ≥50% of total 4-candle duration
          // 2. Point B→5th candle ≥34% of Point A→Point B duration
          
          const pointBToBreakoutDuration = (fifthCandleStartTime - slope.pointB.timestamp) / 60; // in minutes
          const requiredPointBToBreakoutDuration = pointAToPointBDuration * 0.34; // 34% of A→B duration
          
          // Validation 1: Point A→B ≥50% of total 4-candle duration (using breakout duration)
          const validation1_AB_50percent = pointAToBreakoutDuration >= breakoutRequiredDuration;
          
          // Validation 2: Point B→5th candle ≥34% of Point A→Point B duration
          const validation2_B5th_34percent = pointBToBreakoutDuration >= requiredPointBToBreakoutDuration;
          
          // SL orders can ONLY be placed when BOTH validations pass
          const canPlaceOrder = validation1_AB_50percent && validation2_B5th_34percent;
          
          if (!shouldShowBreakout) {
            const timeUntilBreakout = new Date(breakoutThresholdTimestamp * 1000).toLocaleTimeString('en-IN', { 
              timeZone: 'Asia/Kolkata', hour12: true 
            });
            const minutesUntilBreakout = Math.max(0, (breakoutThresholdTimestamp - currentTime) / 60);
            const timeFromPointBRequired = breakoutRequiredDuration - pointAToPointBDuration;
            const timeFromPointBActual = pointBToBreakoutDuration;
            const minutesNeededFromB = Math.max(0, timeFromPointBRequired - timeFromPointBActual);
            console.log(`⏳ Breakout line NOT shown for ${slope.patternName} ${slope.trendType}: Point B→5th candle ${timeFromPointBActual.toFixed(1)}min < ${timeFromPointBRequired.toFixed(1)}min (required from B). Need ${minutesNeededFromB.toFixed(1)}min more from Point B. Valid at ${timeUntilBreakout}`);
            return null;
          }
          
          // Always draw breakout line from Point B when conditions are met
          const pointBX = timestampToX(slope.pointB.timestamp);
          const pointBY = priceToY(slope.pointB.price);
          const extendedX = timestampToX(sixthCandleEndTime);
          
          const breakoutColor = slope.trendType === 'uptrend' ? '#f59e0b' : '#f97316'; // Orange colors
          
          const timeFromPointBRequired = breakoutRequiredDuration - pointAToPointBDuration; // How much time needed from Point B for 50%
          const timeFromPointBActual = pointBToBreakoutDuration; // Actual time from Point B to 5th candle
          
          const validationReason = isBreakoutDurationValid ? 
            `50% rule valid: Point B→5th candle ${timeFromPointBActual.toFixed(1)}min ≥ ${timeFromPointBRequired.toFixed(1)}min (required from B)` : 
            `Time threshold reached for 5th candle breakout`;
          console.log(`✅ Breakout line shown for ${slope.patternName} ${slope.trendType}: ${validationReason}`);
          
          return (
            <g key={`breakout-${i}`}>
              {/* Horizontal breakout line from Point B to 6th candle */}
              <line
                x1={pointBX}
                y1={pointBY}
                x2={extendedX}
                y2={pointBY}
                stroke={breakoutColor}
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.9"
              />
              
              {/* Breakout level marker at Point B */}
              <circle
                cx={pointBX}
                cy={pointBY}
                r="6"
                fill={breakoutColor}
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Breakout level label */}
              <text
                x={pointBX + 12}
                y={pointBY - 12}
                fontSize="11"
                fill={breakoutColor}
                fontWeight="bold"
              >
                BREAKOUT: {slope.pointB.price.toFixed(1)}
              </text>
              
              {/* Validation status with timing display */}
              <text
                x={(pointBX + extendedX) / 2}
                y={pointBY + (slope.trendType === 'uptrend' ? 25 : -15)}
                textAnchor="middle"
                fontSize="9"
                fill={breakoutColor}
                fontWeight="bold"
              >
                {isBreakoutDurationValid ? `B→5th: ${pointBToBreakoutDuration.toFixed(0)}min (50% from B)✓` : 'TIME: 50%✓'} | SL: {canPlaceOrder ? 'DUAL✓' : validation1_AB_50percent ? 'B→5th⏳' : 'A→B⏳'}
              </text>
            </g>
          );
        })}

        {/* Draw trendlines */}
        {slopes.map((slope, i) => {
          const pointAX = timestampToX(slope.pointA.timestamp);
          const pointAY = priceToY(slope.pointA.price);
          const pointBX = timestampToX(slope.pointB.timestamp);
          const pointBY = priceToY(slope.pointB.price);
          
          const isUptrend = slope.trendType === 'uptrend';
          const lineColor = isUptrend ? '#10b981' : '#ef4444';
          const extendedColor = isUptrend ? '#34d399' : '#f87171';

          // Handle special 2-3 pattern trendline drawing
          const isSpecial23 = slope.patternName === '2-3';
          let trendlineEndX = pointBX;
          let trendlineEndY = pointBY;
          
          // For 2-3 pattern: trendline is already drawn to C2B (Point B)
          // No special handling needed since backend now uses C2B as Point B for Pattern 2-3
          
          // Extended line to 6th candle (from the actual trendline end point)
          const extendedX = timestampToX(sixthCandleEndTime);
          let extendedPrice;
          
          // For all patterns, extend from Point B (which is now C2B for Pattern 2-3)
          extendedPrice = extendTrendline(slope, sixthCandleEndTime);
          
          const extendedY = priceToY(extendedPrice);

          return (
            <g key={i}>
              {/* Main trendline (Point A to designated end point) */}
              <line
                x1={pointAX}
                y1={pointAY}
                x2={trendlineEndX}
                y2={trendlineEndY}
                stroke={lineColor}
                strokeWidth="3"
                markerEnd="url(#arrowhead)"
              />
              
              {/* Extended trendline (designated end to 6th candle) */}
              <line
                x1={trendlineEndX}
                y1={trendlineEndY}
                x2={extendedX}
                y2={extendedY}
                stroke={extendedColor}
                strokeWidth="2"
                strokeDasharray="8,4"
                opacity="0.8"
              />
              
              {/* Point A marker */}
              <circle
                cx={pointAX}
                cy={pointAY}
                r="6"
                fill={lineColor}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={pointAX}
                y={pointAY - 15}
                textAnchor="middle"
                fontSize="11"
                fill={lineColor}
                fontWeight="bold"
              >
                A ({slope.pointA.candleName})
              </text>
              
              {/* Point B marker */}
              <circle
                cx={pointBX}
                cy={pointBY}
                r="6"
                fill={lineColor}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={pointBX}
                y={pointBY - 15}
                textAnchor="middle"
                fontSize="11"
                fill={lineColor}
                fontWeight="bold"
              >
                B ({slope.pointB.candleName})
              </text>
              
              {/* Special note for 2-3 pattern */}
              {isSpecial23 && (
                <text
                  x={pointBX + 15}
                  y={pointBY + 25}
                  fontSize="9"
                  fill={lineColor}
                  fontWeight="bold"
                >
                  C2B (Point B)
                </text>
              )}
              
              {/* Extended point marker */}
              <circle
                cx={extendedX}
                cy={extendedY}
                r="4"
                fill={extendedColor}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={extendedX}
                y={extendedY - 15}
                textAnchor="middle"
                fontSize="10"
                fill={extendedColor}
                fontWeight="bold"
              >
                {extendedPrice.toFixed(1)}
              </text>
              
              {/* Slope label with special 2-3 note */}
              <text
                x={(pointAX + trendlineEndX) / 2}
                y={(pointAY + trendlineEndY) / 2 - 20}
                textAnchor="middle"
                fontSize="12"
                fill={lineColor}
                fontWeight="bold"
                className="bg-white px-2 py-1 rounded"
              >
                {slope.patternName} {slope.trendType}: {slope.slope.toFixed(4)} pts/min
                {isSpecial23 ? ' (C1B→C2B)' : ''}
              </text>
            </g>
          );
        })}

        {/* 5th and 6th Candle High/Low Real Data Lines */}
        {realCandleData && (
          <g>
            {[
              { 
                name: '5th Candle', 
                data: realCandleData.fifthCandle, 
                color: '#6366f1', 
                strokeDash: '6,3',
                status: realCandleData.fifthCandle.available ? 'REAL' : 'PENDING'
              },
              { 
                name: '6th Candle', 
                data: realCandleData.sixthCandle, 
                color: '#8b5cf6', 
                strokeDash: '8,4',
                status: realCandleData.sixthCandle.available ? 'REAL' : 'PENDING'
              }
            ].map((candle, idx) => {
              if (!candle.data.available) {
                // Show pending status for unavailable candles
                const startX = timestampToX(candle.data.startTime);
                const endX = timestampToX(candle.data.endTime);
                const centerY = priceToY((chartBounds.minPrice + chartBounds.maxPrice) / 2);
                
                return (
                  <g key={`pending-${idx}`}>
                    <rect
                      x={startX}
                      y={centerY - 15}
                      width={endX - startX}
                      height={30}
                      fill={candle.color}
                      opacity="0.2"
                      stroke={candle.color}
                      strokeDasharray="4,2"
                    />
                    <text
                      x={(startX + endX) / 2}
                      y={centerY}
                      fontSize="11"
                      fill={candle.color}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {candle.name} - PENDING
                    </text>
                  </g>
                );
              }

              const startX = timestampToX(candle.data.startTime);
              const endX = timestampToX(candle.data.endTime);
              const highY = priceToY(candle.data.high);
              const lowY = priceToY(candle.data.low);
              
              return (
                <g key={`real-${idx}`}>
                  {/* High line */}
                  <line
                    x1={startX}
                    y1={highY}
                    x2={endX}
                    y2={highY}
                    stroke={candle.color}
                    strokeWidth="4"
                    strokeDasharray={candle.strokeDash}
                    opacity="0.9"
                  />
                  {/* Low line */}
                  <line
                    x1={startX}
                    y1={lowY}
                    x2={endX}
                    y2={lowY}
                    stroke={candle.color}
                    strokeWidth="4"
                    strokeDasharray={candle.strokeDash}
                    opacity="0.9"
                  />
                  {/* Vertical connecting lines at start and end */}
                  <line
                    x1={startX}
                    y1={highY}
                    x2={startX}
                    y2={lowY}
                    stroke={candle.color}
                    strokeWidth="3"
                    opacity="0.8"
                  />
                  <line
                    x1={endX}
                    y1={highY}
                    x2={endX}
                    y2={lowY}
                    stroke={candle.color}
                    strokeWidth="3"
                    opacity="0.8"
                  />
                  
                  {/* High price label */}
                  <text
                    x={endX + 8}
                    y={highY - 3}
                    fontSize="11"
                    fill={candle.color}
                    fontWeight="bold"
                  >
                    H: {candle.data.high.toFixed(1)}
                  </text>
                  
                  {/* Low price label */}
                  <text
                    x={endX + 8}
                    y={lowY + 12}
                    fontSize="11"
                    fill={candle.color}
                    fontWeight="bold"
                  >
                    L: {candle.data.low.toFixed(1)}
                  </text>
                  
                  {/* Candle name label in center */}
                  <text
                    x={(startX + endX) / 2}
                    y={(highY + lowY) / 2}
                    fontSize="12"
                    fill={candle.color}
                    fontWeight="bold"
                    textAnchor="middle"
                    opacity="0.95"
                  >
                    {candle.name}
                  </text>
                  
                  {/* Real data indicator */}
                  <text
                    x={(startX + endX) / 2}
                    y={(highY + lowY) / 2 + 15}
                    fontSize="10"
                    fill={candle.color}
                    textAnchor="middle"
                    fontWeight="bold"
                    opacity="0.9"
                  >
                    {candle.status} DATA
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Arrow marker definition */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
           refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
          </marker>
        </defs>

        {/* Chart borders */}
        <rect x={padding} y={padding} width={chartWidth - 2 * padding} height={chartHeight - 2 * padding} 
              fill="none" stroke="#374151" strokeWidth="2"/>
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500"></div>
          <span>Uptrend Line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500"></div>
          <span>Downtrend Line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-400 opacity-80" style={{ borderTop: '2px dashed' }}></div>
          <span>Extended to 6th Candle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed' }}></div>
          <span>6th Candle End Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-orange-500" style={{ borderTop: '2px dashed' }}></div>
          <span>Breakout Level (Point A to 5th candle breakout ≥50% of 4-candle duration)</span>
        </div>
        {realCandleData && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-indigo-500" style={{ borderTop: '4px dashed' }}></div>
              <span>5th Candle High/Low ({realCandleData.fifthCandle.available ? 'Real Data' : 'Pending'})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-600" style={{ borderTop: '4px dashed' }}></div>
              <span>6th Candle High/Low ({realCandleData.sixthCandle.available ? 'Real Data' : 'Pending'})</span>
            </div>
          </>
        )}
      </div>

      {/* Timestamp details */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {slopes.map((slope, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded">
            <div className="font-semibold text-gray-700 mb-2">
              {slope.trendType.toUpperCase()} {slope.patternName}
            </div>
            <div className="space-y-1 text-gray-600">
              <div>Point A: {slope.pointA.formattedTime} @ {slope.pointA.price}</div>
              <div>Point B: {slope.pointB.formattedTime} @ {slope.pointB.price}</div>
              <div>Slope: {slope.slope.toFixed(6)} points/minute</div>
              {(() => {
                const firstCandle = candleBlocks?.find(c => c.name === 'C1A');
                const lastCandle = candleBlocks?.find(c => c.name === 'C2B');
                if (firstCandle && lastCandle) {
                  const total4CandleDuration = (lastCandle.endTime - firstCandle.startTime) / 60;
                  const pointAToPointBDuration = (slope.pointB.timestamp - slope.pointA.timestamp) / 60;
                  const durationRatio = pointAToPointBDuration / total4CandleDuration;
                  
                  // Breakout level validation: Point A to 5th candle breakout ≥50% of total 4-candle duration
                  const breakoutRequiredDuration = total4CandleDuration * 0.5; // Required minutes
                  const fifthCandleStartTime = lastCandle.endTime; // C2B end = 5th candle start
                  const pointAToBreakoutDuration = (fifthCandleStartTime - slope.pointA.timestamp) / 60;
                  const isBreakoutDurationValid = pointAToBreakoutDuration >= breakoutRequiredDuration;
                  
                  // Time-based breakout validation: wait for 50% duration from Point A for 5th candle
                  const breakoutThresholdTimestamp = slope.pointA.timestamp + (breakoutRequiredDuration * 60);
                  const currentTime = Date.now() / 1000;
                  const isTimeBasedBreakoutValid = currentTime >= breakoutThresholdTimestamp;
                  
                  // SL ORDER DUAL VALIDATION SYSTEM:
                  // Use exact breakout timestamps when available, otherwise fall back to candle start times
                  let pointBToBreakoutDuration = (fifthCandleStartTime - slope.pointB.timestamp) / 60;
                  let sixthCandleBreakoutDuration = (fifthCandleStartTime + 600 - slope.pointB.timestamp) / 60; // +600 = +10min for 6th candle
                  
                  // Check if we have exact breakout timestamps from real validation
                  const realValidation = dualValidation?.validationResults?.[slope.trendType]?.realBreakoutValidation;
                  if (realValidation?.fifthBreakoutTimestamp) {
                    pointBToBreakoutDuration = (realValidation.fifthBreakoutTimestamp - slope.pointB.timestamp * 1000) / (1000 * 60);
                  }
                  if (realValidation?.sixthBreakoutTimestamp) {
                    sixthCandleBreakoutDuration = (realValidation.sixthBreakoutTimestamp - slope.pointB.timestamp * 1000) / (1000 * 60);
                  }
                  
                  const requiredPointBToBreakoutDuration = pointAToPointBDuration * 0.34;
                  
                  // Validation 1: Point A→B ≥50% of total 4-candle duration
                  const validation1_AB_50percent = pointAToBreakoutDuration >= breakoutRequiredDuration;
                  
                  // Validation 2: Point B→5th candle ≥34% of Point A→Point B duration
                  const validation2_B5th_34percent = pointBToBreakoutDuration >= requiredPointBToBreakoutDuration;
                  
                  const timeUntilBreakout = new Date(breakoutThresholdTimestamp * 1000).toLocaleTimeString('en-IN', { 
                    timeZone: 'Asia/Kolkata', hour12: true 
                  });
                  const minutesUntilBreakout = Math.max(0, (breakoutThresholdTimestamp - currentTime) / 60);
                  const minutesNeeded = Math.max(0, breakoutRequiredDuration - pointAToBreakoutDuration);
                  const minutesNeededB5th = Math.max(0, requiredPointBToBreakoutDuration - pointBToBreakoutDuration);
                  
                  // SL orders require BOTH validations
                  const canPlaceOrderDual = validation1_AB_50percent && validation2_B5th_34percent;
                  
                  return (
                    <div>
                      <div>
                        💡 Duration B→5th: {pointBToBreakoutDuration.toFixed(1)}min 
                        {realValidation?.fifthBreakoutTimestamp ? 
                          <span className="text-green-600 ml-2">🎯 (exact breakout time)</span> : 
                          <span className="text-orange-600 ml-2">(candle start time)</span>
                        }
                      </div>
                      <div>Required for 50%: {(breakoutRequiredDuration - pointAToPointBDuration).toFixed(1)}min from Point B (Total: {breakoutRequiredDuration.toFixed(1)}min - A→B: {pointAToPointBDuration.toFixed(1)}min)</div>
                      <div>34% SL Rule: B→5th {pointBToBreakoutDuration.toFixed(1)}min ≥ {requiredPointBToBreakoutDuration.toFixed(1)}min (34% of A→B: {pointAToPointBDuration.toFixed(1)}min)</div>
                      
                      {/* 5th Candle Calculations */}
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="font-semibold text-blue-800 dark:text-blue-200">5th Candle Target:</div>
                        {realValidation?.fifthCandleBrokeBreakout ? (
                          <div>
                            <div>Status: ✅ BROKE breakout level</div>
                            <div>Target: ({slope.slope.toFixed(3)} × {pointBToBreakoutDuration.toFixed(1)}) + {slope.pointB.price.toFixed(2)} = {((slope.slope * pointBToBreakoutDuration) + slope.pointB.price).toFixed(2)}</div>
                            <div>Exit 80%: {(slope.pointB.price + (0.8 * (slope.slope * pointBToBreakoutDuration))).toFixed(2)}</div>
                            {realValidation?.fifthBreakoutTimestamp && (
                              <div className="text-xs text-green-600">
                                📍 Exact breakout: {new Date(realValidation.fifthBreakoutTimestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} @ {realValidation.fifthBreakoutPrice?.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : realValidation?.fifthCandle ? (
                          <div>Status: ❌ Did NOT break breakout level</div>
                        ) : (
                          <div>Status: ⏳ Not available yet</div>
                        )}
                      </div>
                      
                      {/* 6th Candle Calculations */}
                      <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <div className="font-semibold text-purple-800 dark:text-purple-200">6th Candle Target:</div>
                        {realValidation?.sixthCandleBrokeBreakout ? (
                          <div>
                            <div>Status: ✅ BROKE breakout level</div>
                            <div>Target: ({slope.slope.toFixed(3)} × {sixthCandleBreakoutDuration.toFixed(1)}) + {slope.pointB.price.toFixed(2)} = {((slope.slope * sixthCandleBreakoutDuration) + slope.pointB.price).toFixed(2)}</div>
                            <div>Exit 80%: {(slope.pointB.price + (0.8 * (slope.slope * sixthCandleBreakoutDuration))).toFixed(2)}</div>
                            {realValidation?.sixthBreakoutTimestamp && (
                              <div className="text-xs text-green-600">
                                📍 Exact breakout: {new Date(realValidation.sixthBreakoutTimestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} @ {realValidation.sixthBreakoutPrice?.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : realValidation?.sixthCandle ? (
                          <div>Status: ❌ Did NOT break breakout level</div>
                        ) : (
                          <div>Status: ⏳ Not available yet</div>
                        )}
                      </div>
                      
                      {/* Trade Validity Status */}
                      <div className={`mt-2 p-2 rounded ${realValidation?.tradeIsValid === false ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="font-semibold">
                          Trade Status: {realValidation?.tradeIsValid === false ? '❌ CANCEL ALL SL ORDERS' : realValidation?.tradeIsValid ? '✅ Trade Valid' : '⏳ Pending validation'}
                        </div>
                        {realValidation?.tradeIsValid === false && (
                          <div className="text-red-600 text-sm">Both 5th and 6th candles failed to break by 90% of 6th candle close time</div>
                        )}
                      </div>

                      <div>⚠️ Cancel SL if both 5th & 6th fail to break by 6th close</div>
                      <div>Breakout: {isBreakoutDurationValid ? '✅ Valid (Duration ≥50%)' : isTimeBasedBreakoutValid ? '✅ Valid (Time passed)' : `⏳ Need ${minutesNeeded.toFixed(1)}m more. Valid at ${timeUntilBreakout}`}</div>
                      <div>Validation 1 (50% from Point B): {validation1_AB_50percent ? '✅ Passed' : `❌ Need ${(breakoutRequiredDuration - pointAToPointBDuration - pointBToBreakoutDuration).toFixed(1)}min more from Point B`}</div>
                      <div>Validation 2 (B→5th ≥34% of A→B): {validation2_B5th_34percent ? '✅ Passed' : `❌ Need ${minutesNeededB5th.toFixed(1)}min more from Point B`}</div>
                      <div>SL Order: {canPlaceOrderDual ? '✅ Both validations passed - Orders enabled' : '❌ Dual validation failed - No orders'}</div>
                    </div>
                  );
                }
                return null;
              })()}
              {predictions && (
                <div>Extended to 6th: {extendTrendline(slope, sixthCandleEndTime).toFixed(2)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}