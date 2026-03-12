import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface MinimalChartProps {
  height?: number;
  ohlcData?: any[];
  symbol?: string;
  isInteractiveMode?: boolean;
  onCandleClick?: (candleIndex: number) => void;
  selectionLineIndex?: number | null;
  mockStartIndex?: number | null;
  timeRange?: [number, number] | null; // [startMinute, endMinute] for vertical reference lines
  indicators?: {
    sma?: Array<{id: string, period: number}>;
    ema?: Array<{id: string, period: number}>;
    ma?: Array<{id: string, period: number}>;
    rsi?: Array<{id: string, period: number, overbought: number, oversold: number}>;
    bollinger?: Array<{id: string, period: number, stdDev: number}>;
    macd?: Array<{id: string, fast: number, slow: number, signal: number}>;
  };
  chartType?: 'line' | 'candles';
  // Visual AI integration props
  onSelectedPointsChange?: (points: Array<{
    x: number;
    y: number;
    price: number;
    timestamp: number;
    candleIndex: number;
    pointNumber: number;
    label?: 'SL' | 'Target' | 'Breakout' | 'Entry' | null;
  }>) => void;
  onChartReset?: () => void;
  onChartExpand?: () => void;
  externalSelectedPoints?: Array<{
    x: number;
    y: number;
    price: number;
    timestamp: number;
    candleIndex: number;
    pointNumber: number;
    label?: 'SL' | 'Target' | 'Breakout' | 'Entry' | null;
  }>;
  enablePointSelection?: boolean;
  parentDrawingMode?: 'none' | 'line' | 'box' | null;
  isExpanded?: boolean;
  resetToken?: number;
  
  // Auto-display Notes AI callback
  onSelectActivated?: () => void;
  
  // Trade markers for buy/sell points
  tradeMarkers?: Array<{
    candleIndex: number;
    price: number;
    type: 'buy' | 'sell';
    symbol: string;
    quantity: number;
    time: string;
    pnl: string;
  }>;
  
  // Hide control buttons for journal interface
  hideControls?: boolean;
}

export function MinimalChart({
  height = 320,
  ohlcData = [],
  symbol = 'NIFTY 50',
  isInteractiveMode = false,
  onCandleClick,
  selectionLineIndex = null,
  mockStartIndex = null,
  timeRange = null as [number, number] | null,
  indicators = {},
  chartType = 'line',
  onSelectedPointsChange,
  onChartReset,
  onChartExpand,
  externalSelectedPoints,
  enablePointSelection = false,
  parentDrawingMode = null,
  isExpanded = false,
  resetToken = 0,
  onSelectActivated,
  tradeMarkers = [],
  hideControls = false
}: MinimalChartProps) {
  const chartContainer = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crosshair, setCrosshair] = useState<{x: number, y: number, visible: boolean}>({x: 0, y: 0, visible: false});
  
  // 🎯 MANUAL POINT SELECTION STATE - Default OFF
  const [isManualPointMode, setIsManualPointMode] = useState(false);
  const manualModeRef = useRef(isManualPointMode);
  const [selectedPoints, setSelectedPoints] = useState<Array<{
    x: number;
    y: number;
    price: number;
    timestamp: number;
    candleIndex: number;
    pointNumber: number;
    label?: 'SL' | 'Target' | 'Breakout' | 'Entry' | null;
  }>>(externalSelectedPoints || []);

  // 🔗 VISUAL AI INTEGRATION: Sync external points and notify parent of changes
  const arePointsEqual = (points1: any[], points2: any[]) => {
    if (points1.length !== points2.length) return false;
    return points1.every((p1, i) => {
      const p2 = points2[i];
      return p1.candleIndex === p2.candleIndex && p1.pointNumber === p2.pointNumber && p1.label === p2.label;
    });
  };

  // 📊 S/R DETECTION: Auto-detect Support & Resistance levels from swing highs/lows
  const detectAndMarkSupportResistance = () => {
    if (!ohlcData || ohlcData.length < 10) {
      console.log('⚠️ Insufficient data for S/R detection');
      return;
    }

    console.log('🔍 Detecting Support & Resistance levels from swing points...');

    // Extract swing highs and lows using lookback method
    const swingPoints: Array<{
      index: number;
      price: number;
      type: 'high' | 'low';
      timestamp: number;
    }> = [];

    const lookback = Math.max(3, Math.floor(ohlcData.length / 50)); // Adaptive lookback

    // Find swing highs and lows
    for (let i = lookback; i < ohlcData.length - lookback; i++) {
      const candle = ohlcData[i];
      const high = Array.isArray(candle) ? candle[2] : candle.high;
      const low = Array.isArray(candle) ? candle[3] : candle.low;
      const timestamp = Array.isArray(candle) ? candle[0] : candle.timestamp;

      // Check for swing high
      let isSwingHigh = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        const compareCandle = ohlcData[j];
        const compareHigh = Array.isArray(compareCandle) ? compareCandle[2] : compareCandle.high;
        if (compareHigh >= high) {
          isSwingHigh = false;
          break;
        }
      }

      // Check for swing low
      let isSwingLow = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        const compareCandle = ohlcData[j];
        const compareLow = Array.isArray(compareCandle) ? compareCandle[3] : compareCandle.low;
        if (compareLow <= low) {
          isSwingLow = false;
          break;
        }
      }

      if (isSwingHigh) {
        swingPoints.push({
          index: i,
          price: high,
          type: 'high',
          timestamp: timestamp
        });
      }

      if (isSwingLow) {
        swingPoints.push({
          index: i,
          price: low,
          type: 'low',
          timestamp: timestamp
        });
      }
    }

    // Sort by index and take up to 8 most recent swing points
    const recentSwingPoints = swingPoints
      .sort((a, b) => a.index - b.index)
      .slice(-8);

    // Convert to chart points format with numbered labels
    const srPoints = recentSwingPoints.map((swing, index) => ({
      candleIndex: swing.index,
      price: swing.price,
      timestamp: swing.timestamp,
      pointNumber: index + 1,
      label: swing.type === 'high' ? 'Target' as const : 'SL' as const,
      x: 0, // Will be calculated by chart
      y: 0  // Will be calculated by chart
    }));

    console.log(`✅ Detected ${srPoints.length} S/R levels:`, 
      srPoints.map((p, idx) => `${p.pointNumber}:${recentSwingPoints[idx]?.type?.toUpperCase()}@${p.price.toFixed(2)}`).join(' → '));

    // Update selected points to show S/R levels
    setSelectedPoints(srPoints);
    
    // Also add horizontal rays for major S/R levels
    const srRays = recentSwingPoints.slice(-4).map((swing, index) => ({
      id: `sr-${swing.type}-${index}`,
      price: swing.price,
      label: swing.type === 'high' ? 'Target' as const : 'SL' as const,
      color: swing.type === 'high' ? '#ef4444' : '#10b981' // Red for resistance, green for support
    }));

    setHorizontalRays(srRays);
  };

  // 🔥 DYNAMIC PATTERN DETECTION: Points = Candles (4C uses 4, 5-point patterns use 5, etc.)
  const detectDynamicPatternMatches = (selectedPattern: any, candleCount?: number) => {
    // 🎯 PERFECT TIMESTAMP APPROACH: Uses OHLC data window for exact 1-minute timestamp marking
    // User's brilliant insight: Use OHLC data window timestamps instead of candle high/low estimates
    
    // 🎯 DYNAMIC CANDLE COUNT: Extract from pattern points or use override
    const patternPoints = selectedPattern?.points?.length || 4;
    const actualCandleCount = candleCount || patternPoints;
    const minRequiredCandles = actualCandleCount * 15; // 15 minutes per candle
    
    if (!optimizedCandles || optimizedCandles.length < minRequiredCandles || !selectedPattern) {
      console.log(`⚠️ Insufficient OHLC data window or no pattern selected for ${actualCandleCount}-candle analysis`);
      console.log(`📊 Need: ${minRequiredCandles} candles, Have: ${optimizedCandles?.length || 0} candles`);
      return;
    }

    console.log(`🎯 Starting DYNAMIC pattern detection using OHLC data window timestamps...`);
    console.log(`📊 Pattern: "${selectedPattern.name || 'Unknown'}" | Points: ${patternPoints} | Using: ${actualCandleCount} candles`);
    console.log(`📊 OHLC Data Window: ${optimizedCandles.length} perfect 1-minute candles available`);

    const patternMatches: Array<{
      startTimestamp: number;
      confidence: number;
      candles: any[];
      relationships: string[];
      reverseRelationships: string[];
      isReverseBest: boolean;
    }> = [];

    // 🎯 FIX 2: Market Open Time Detection - Find 9:15 AM (market open)
    const getMarketOpenIndex = () => {
      if (optimizedCandles.length === 0) return 0;
      
      // Get first candle's date to determine market open time
      const firstCandle = optimizedCandles[0];
      const baseTimestamp = firstCandle.timestamp || firstCandle.time || Date.now() / 1000;
      const baseDate = new Date(typeof baseTimestamp === 'string' ? baseTimestamp : baseTimestamp * 1000);
      
      // Market opens at 9:15 AM (555 minutes since midnight)
      const marketOpenMinutes = 9 * 60 + 15; // 555 minutes = 9:15 AM
      
      const marketOpenDate = new Date(baseDate);
      marketOpenDate.setHours(0, 0, 0, 0);
      marketOpenDate.setMinutes(marketOpenMinutes);
      const marketOpenTimestamp = Math.floor(marketOpenDate.getTime() / 1000);
      
      // Find the first candle at or after market open
      for (let i = 0; i < optimizedCandles.length; i++) {
        const candleTime = optimizedCandles[i].timestamp || optimizedCandles[i].time || 0;
        const candleTimestamp = typeof candleTime === 'string' ? new Date(candleTime).getTime() / 1000 : candleTime;
        
        if (candleTimestamp >= marketOpenTimestamp) {
          console.log(`🕘 Market Open detected at index ${i} (${new Date(candleTimestamp * 1000).toLocaleTimeString()})`);
          return i;
        }
      }
      
      console.log('⚠️ Market open not found, starting from beginning');
      return 0;
    };

    // 🎯 DYNAMIC 15-min candle creation with PRECISE EXTREMUM TRACKING
    const createTimestampBased15MinCandles = (startIndex: number, count: number) => {
      const candles15min = [];
      
      for (let i = 0; i < count; i++) {
        // Calculate exact 15-minute intervals from market open (9:15, 9:30, 9:45, 10:00, etc.)
        const intervalStartIndex = startIndex + (i * 15);
        const intervalEndIndex = Math.min(intervalStartIndex + 15, optimizedCandles.length);
        
        if (intervalEndIndex <= intervalStartIndex) break;
        
        const intervalCandles = optimizedCandles.slice(intervalStartIndex, intervalEndIndex);
        if (intervalCandles.length === 0) break;

        // Create 15-min OHLC from 1-min data + TRACK EXACT EXTREMUM POSITIONS
        const open = Array.isArray(intervalCandles[0]) ? intervalCandles[0][1] : intervalCandles[0].open;
        const close = Array.isArray(intervalCandles[intervalCandles.length - 1]) ? 
          intervalCandles[intervalCandles.length - 1][4] : intervalCandles[intervalCandles.length - 1].close;
        
        let high = -Infinity, low = Infinity;
        let highIndex = intervalStartIndex, lowIndex = intervalStartIndex;
        let highTimestamp = 0, lowTimestamp = 0;
        
        // 🎯 PRECISE MINUTE SELECTION: Find exact minutes where extremums occur
        intervalCandles.forEach((candle, localIdx) => {
          const h = Array.isArray(candle) ? candle[2] : candle.high;
          const l = Array.isArray(candle) ? candle[3] : candle.low;
          const timestamp = Array.isArray(candle) ? candle[0] : candle.timestamp;
          
          if (h > high) {
            high = h;
            highIndex = intervalStartIndex + localIdx;
            highTimestamp = timestamp;
          }
          if (l < low) {
            low = l;
            lowIndex = intervalStartIndex + localIdx;
            lowTimestamp = timestamp;
          }
        });

        const firstCandleTimestamp = Array.isArray(intervalCandles[0]) ? 
          intervalCandles[0][0] : intervalCandles[0].timestamp;

        candles15min.push({
          originalIndex: intervalStartIndex, // Block start for reference
          open, high, low, close,
          timestamp: firstCandleTimestamp,
          intervalMinutes: i * 15, // Minutes since market open
          // 🎯 NEW: Exact extremum positions within this 15-min block
          extremums: {
            highIndex,
            lowIndex,
            highTimestamp,
            lowTimestamp
          }
        });
      }
      return candles15min;
    };

    // 🎯 FIX 4: Equality handling with tolerance
    const PRICE_TOLERANCE = 0.01; // 0.01 points tolerance for equality
    const compareWithTolerance = (value1: number, value2: number): '>' | '<' | '=' => {
      const diff = Math.abs(value1 - value2);
      if (diff <= PRICE_TOLERANCE) return '=';
      return value1 > value2 ? '>' : '<';
    };

    // Extract pattern relationships for comparison
    const patternRelationships = selectedPattern.relationships || [];
    console.log(`🔍 Pattern "${selectedPattern.name}" has relationships:`, patternRelationships);

    // 🎯 CREATE TIMESTAMP→INDEX MAPPING for chart coordinate sync
    const timestampIndexMap = new Map<number, number>();
    optimizedCandles.forEach((candle, index) => {
      const timestamp = Array.isArray(candle) ? candle[0] : (candle.timestamp || candle.time || 0);
      timestampIndexMap.set(timestamp, index);
    });
    console.log(`🗺️ TIMESTAMP MAP: Created mapping for ${timestampIndexMap.size} optimized candles`);
    
    // 🎯 DYNAMIC SCANNING: Start from market open, use actualCandleCount
    const marketOpenIndex = getMarketOpenIndex();
    const maxScanIndex = optimizedCandles.length - (actualCandleCount * 15); // Need N x 15 minutes
    
    for (let startIdx = marketOpenIndex; startIdx <= maxScanIndex; startIdx += 15) {
      const candles15min = createTimestampBased15MinCandles(startIdx, actualCandleCount);
      
      if (candles15min.length < actualCandleCount) continue;

      // 🎯 DYNAMIC RELATIONSHIP EXTRACTION: Supports any number of candles
      const relationships = [];
      const reverseRelationships = [];
      
      // Extract all adjacent relationships (1vs2, 2vs3, 3vs4, etc.) plus first vs last
      for (let i = 0; i < actualCandleCount - 1; i++) {
        // Normal pattern: alternating H-L-H-L...
        const isEvenIndex = i % 2 === 0;
        const price1 = isEvenIndex ? candles15min[i].high : candles15min[i].low;
        const price2 = isEvenIndex ? candles15min[i + 1].low : candles15min[i + 1].high;
        
        const relation = compareWithTolerance(price1, price2);
        relationships.push(`${i + 1}${relation}${i + 2}`);
        
        // Reverse pattern: alternating L-H-L-H...  
        const revPrice1 = isEvenIndex ? candles15min[i].low : candles15min[i].high;
        const revPrice2 = isEvenIndex ? candles15min[i + 1].high : candles15min[i + 1].low;
        
        const revRelation = compareWithTolerance(revPrice1, revPrice2);
        reverseRelationships.push(`${i + 1}${revRelation}${i + 2}`);
      }
      
      // Add first vs last relationship (1 vs N)
      const firstHigh = candles15min[0].high;
      const firstLow = candles15min[0].low;
      const lastHigh = candles15min[actualCandleCount - 1].high;
      const lastLow = candles15min[actualCandleCount - 1].low;
      
      const rel1vsLast = compareWithTolerance(firstHigh, lastLow);
      const revRel1vsLast = compareWithTolerance(firstLow, lastHigh);
      
      relationships.push(`1${rel1vsLast}${actualCandleCount}`);
      reverseRelationships.push(`1${revRel1vsLast}${actualCandleCount}`);

      // 🎯 DYNAMIC CONFIDENCE: Based on actual number of relationships
      const expectedRelCount = actualCandleCount; // (N-1) adjacent + 1 first-last = N total relationships  
      const matchCount = relationships.filter(rel => patternRelationships.includes(rel)).length;
      const reverseMatchCount = reverseRelationships.filter(rel => patternRelationships.includes(rel)).length;
      
      const normalConfidence = matchCount / expectedRelCount;
      const reverseConfidence = reverseMatchCount / expectedRelCount;
      const confidence = Math.max(normalConfidence, reverseConfidence);
      const isReverseBest = reverseConfidence > normalConfidence;
      
      if (confidence >= 0.75) { // True 75% threshold (3 out of 4 matches)
        patternMatches.push({
          startTimestamp: candles15min[0].timestamp,
          confidence,
          candles: candles15min,
          relationships: isReverseBest ? reverseRelationships : relationships,
          reverseRelationships,
          isReverseBest
        });
        
        const bestRels = isReverseBest ? reverseRelationships : relationships;
        console.log(`✅ 75%+ Match Found! Start: ${startIdx} (${new Date(candles15min[0].timestamp * 1000).toLocaleTimeString()})`);
        console.log(`   Confidence: ${(confidence * 100).toFixed(1)}% | Pattern: ${isReverseBest ? 'REVERSE' : 'NORMAL'}`);
        console.log(`   Winning Relationships: ${bestRels.join(', ')}`);
        console.log(`   Expected: ${patternRelationships.join(', ')}`);
      }
    }

    // Apply best match to chart
    if (patternMatches.length > 0) {
      const bestMatch = patternMatches.sort((a, b) => b.confidence - a.confidence)[0];
      
      console.log(`🎯 Applying best ${actualCandleCount}-candle match (${(bestMatch.confidence * 100).toFixed(1)}% confidence):`, bestMatch);
      
      // 🎯 DYNAMIC VISUALIZATION: Supports any number of candles with exact extremum positions
      const chartPoints = bestMatch.candles.map((candle, idx) => {
        let price, label, exactIndex, exactTimestamp;
        
        if (bestMatch.isReverseBest) {
          // Reverse pattern: L1, H2, L3, H4, L5, H6... (alternating starting with Low)
          if (idx % 2 === 0) {
            // Even indices = Low points
            price = candle.low;
            label = 'Low';
            exactIndex = candle.extremums.lowIndex;
            exactTimestamp = candle.extremums.lowTimestamp;
          } else {
            // Odd indices = High points  
            price = candle.high;
            label = 'High';
            exactIndex = candle.extremums.highIndex;
            exactTimestamp = candle.extremums.highTimestamp;
          }
        } else {
          // Normal pattern: H1, L2, H3, L4, H5, L6... (alternating starting with High)
          if (idx % 2 === 0) {
            // Even indices = High points
            price = candle.high;
            label = 'High';
            exactIndex = candle.extremums.highIndex;
            exactTimestamp = candle.extremums.highTimestamp;
          } else {
            // Odd indices = Low points
            price = candle.low;
            label = 'Low';
            exactIndex = candle.extremums.lowIndex;
            exactTimestamp = candle.extremums.lowTimestamp;
          }
        }
        
        // 🎯 MAP TO CHART COORDINATES: Convert exact timestamp to optimized chart index
        const chartIndex = timestampIndexMap.get(exactTimestamp) ?? -1;
        if (chartIndex === -1) {
          console.warn(`⚠️ MAPPING FAIL: Timestamp ${exactTimestamp} not found in optimized chart data`);
        }
        
        console.log(`🎯 EXACT POINT ${idx + 1}: ${label} at original=${exactIndex}, chart=${chartIndex}, price=${price.toFixed(2)} (${new Date(exactTimestamp * 1000).toLocaleTimeString()})`);
        
        return {
          candleIndex: chartIndex >= 0 ? chartIndex : exactIndex, // 🎯 SYNC: Use chart index for proper alignment
          price,
          timestamp: exactTimestamp, // 🎯 FIXED: Use exact extremum timestamp
          pointNumber: idx + 1,
          label: (idx % 2 === 0 ? 'Target' : 'SL') as 'SL' | 'Target' | 'Breakout' | 'Entry',
          x: 0, // Will be calculated by chart
          y: 0  // Will be calculated by chart
        };
      });

      setSelectedPoints(chartPoints);
      
      // Add horizontal rays for key levels based on pattern type
      let keyLevels;
      if (bestMatch.isReverseBest) {
        keyLevels = [
          { id: 'low1', price: bestMatch.candles[0].low, label: 'SL' as const, color: '#10b981' },
          { id: 'high2', price: bestMatch.candles[1].high, label: 'Target' as const, color: '#ef4444' },
          { id: 'low3', price: bestMatch.candles[2].low, label: 'SL' as const, color: '#10b981' },
          { id: 'high4', price: bestMatch.candles[3].high, label: 'Target' as const, color: '#ef4444' }
        ];
      } else {
        keyLevels = [
          { id: 'high1', price: bestMatch.candles[0].high, label: 'Target' as const, color: '#ef4444' },
          { id: 'low2', price: bestMatch.candles[1].low, label: 'SL' as const, color: '#10b981' },
          { id: 'high3', price: bestMatch.candles[2].high, label: 'Target' as const, color: '#ef4444' },
          { id: 'low4', price: bestMatch.candles[3].low, label: 'SL' as const, color: '#10b981' }
        ];
      }
      
      setHorizontalRays(keyLevels);

      return bestMatch;
    } else {
      console.log(`❌ No ${actualCandleCount}-candle patterns found with ≥75% confidence`);
      return null;
    }
  };

  // 🎯 EXPOSE DYNAMIC PATTERN DETECTION TO PURPLE DROPDOWN
  useEffect(() => {
    if (canvasRef.current) {
      // Expose the dynamic pattern detection function to be called from Trading Master
      (canvasRef.current as any)._detectDynamicPattern = detectDynamicPatternMatches;
      console.log('🔗 Dynamic pattern detection exposed to Trading Master dropdown');
    }
  }, [canvasRef.current]);

  // Update manual point mode when enablePointSelection prop changes
  useEffect(() => {
    // Force off by default even if prop suggests otherwise
    setIsManualPointMode(false);
  }, [enablePointSelection]);

  useEffect(() => {
    if (externalSelectedPoints && !arePointsEqual(externalSelectedPoints, selectedPoints)) {
      setSelectedPoints(externalSelectedPoints);
    }
  }, [externalSelectedPoints]);

  useEffect(() => {
    if (onSelectedPointsChange) {
      onSelectedPointsChange(selectedPoints);
    }
  }, [selectedPoints, onSelectedPointsChange]);

  // 🎯 FIXED: Only disable manual mode when enablePointSelection becomes false, not based on points
  useEffect(() => {
    // Explicitly set to false to ensure it starts OFF
    setIsManualPointMode(false);
  }, [enablePointSelection]);
  
  // 🎯 FIXED: Keep manual mode ref synchronized to prevent closure drift
  useEffect(() => {
    manualModeRef.current = isManualPointMode;
  }, [isManualPointMode]);

  // 🎯 RESET FUNCTIONALITY: Handle reset token changes (NO CALLBACK to avoid loops)
  const prevResetToken = useRef(resetToken);
  useEffect(() => {
    if (resetToken !== prevResetToken.current) {
      prevResetToken.current = resetToken;
      // Clear all internal state - NO callback call to avoid feedback loop
      setSelectedPoints([]);
      setHorizontalRays([]);
      setShowManualPattern(true);
    }
  }, [resetToken]);

  // 🎯 PARENT DRAWING MODE SYNC: Use parentDrawingMode prop
  useEffect(() => {
    if (parentDrawingMode !== null && parentDrawingMode !== undefined) {
      setDrawingMode(parentDrawingMode);
    }
  }, [parentDrawingMode]);
  
  // 🎯 Enhanced point selection with save/load and horizontal rays
  const [savedPointSets, setSavedPointSets] = useState<Array<{
    id: string;
    name: string;
    points: typeof selectedPoints;
    timestamp: number;
  }>>([]);
  const [horizontalRays, setHorizontalRays] = useState<Array<{
    id: string;
    price: number;
    label: 'SL' | 'Target' | 'Breakout';
    color: string;
    pointNumber?: number;
  }>>([]);
  const [isAddingRay, setIsAddingRay] = useState<'SL' | 'Target' | 'Breakout' | null>(null);
  const [showManualPattern, setShowManualPattern] = useState(true);
  
  // 🚀 PERFORMANCE OPTIMIZATION: Limit max visible candles for huge datasets
  const MAX_VISIBLE_CANDLES = 500; // Optimal performance threshold
  const PERFORMANCE_THRESHOLD = 1000; // When to apply optimizations
  
  // 🚀 MEMOIZED OPTIMIZATION: Cache optimized candles with MARKER-SAFE time range filtering
  const optimizedCandles = useMemo(() => {
    let candlesToUse = ohlcData || [];
    
    // 🕘 APPLY TIME RANGE FILTER FIRST - Constrain data to selected time range
    if (timeRange && timeRange.length === 2 && candlesToUse.length > 0) {
      const [startMinute, endMinute] = timeRange;
      
      // Helper function to convert minutes since midnight to timestamp
      const minutesToTimestamp = (minutes: number, baseDate: Date = new Date()) => {
        const date = new Date(baseDate);
        date.setHours(0, 0, 0, 0);
        date.setMinutes(minutes);
        return Math.floor(date.getTime() / 1000);
      };
      
      // Use the first candle's date as reference
      const firstCandle = candlesToUse[0];
      const baseTimestamp = firstCandle.timestamp || firstCandle.time || Date.now() / 1000;
      const baseDate = new Date(typeof baseTimestamp === 'string' ? baseTimestamp : baseTimestamp * 1000);
      
      const startTargetTime = minutesToTimestamp(startMinute, baseDate);
      const endTargetTime = minutesToTimestamp(endMinute, baseDate);
      
      // Filter candles to only include those within the time range
      candlesToUse = candlesToUse.filter(candle => {
        const candleTime = candle.timestamp || candle.time || 0;
        const candleTimestamp = typeof candleTime === 'string' ? new Date(candleTime).getTime() / 1000 : candleTime;
        return candleTimestamp >= startTargetTime && candleTimestamp <= endTargetTime;
      });
      
      console.log(`🕘 TIME FILTER SYNC: Start=${startMinute}min (${Math.floor(startMinute/60)}:${String(startMinute%60).padStart(2,'0')}), End=${endMinute}min (${Math.floor(endMinute/60)}:${String(endMinute%60).padStart(2,'0')})`);
      console.log(`📊 TIME CONSTRAINED: ${ohlcData.length} → ${candlesToUse.length} candles within filter range`);
    }
    
    // 🎯 MARKER SAFETY: Collect required indices from selected points to preserve them
    const requiredIndices = new Set<number>();
    selectedPoints.forEach(point => {
      if (point.candleIndex >= 0 && point.candleIndex < candlesToUse.length) {
        requiredIndices.add(point.candleIndex);
        // Also preserve neighboring candles for context
        for (let i = Math.max(0, point.candleIndex - 2); i <= Math.min(candlesToUse.length - 1, point.candleIndex + 2); i++) {
          requiredIndices.add(i);
        }
      }
    });
    
    // Apply performance optimization only if still needed after time filtering
    if (candlesToUse.length <= PERFORMANCE_THRESHOLD) {
      return candlesToUse;
    }
    
    console.log(`📊 PERFORMANCE: Optimizing ${candlesToUse.length} candles → ${MAX_VISIBLE_CANDLES} visible (preserving ${requiredIndices.size} marker points)`);
    
    // Smart sampling: take recent candles + key historical points + required marker indices
    const recentCandlesCount = Math.floor(MAX_VISIBLE_CANDLES * 0.6); // Reduce to make room for markers
    const historicalSampleCount = Math.floor(MAX_VISIBLE_CANDLES * 0.3);
    const markerReserve = MAX_VISIBLE_CANDLES - recentCandlesCount - historicalSampleCount;
    
    // Take most recent candles
    const recentCandles = candlesToUse.slice(-recentCandlesCount);
    
    // Sample historical data (every nth candle)
    const sampleRate = Math.max(1, Math.floor(candlesToUse.length / historicalSampleCount));
    const historicalCandles = candlesToUse.filter((_, index) => index % sampleRate === 0).slice(0, historicalSampleCount);
    
    // Add required marker candles
    const markerCandles = Array.from(requiredIndices)
      .filter(idx => idx >= 0 && idx < candlesToUse.length)
      .slice(0, markerReserve) // Limit to reserve space
      .map(idx => candlesToUse[idx]);
    
    // Combine and sort by timestamp, removing duplicates
    const allCandles = [...historicalCandles, ...recentCandles, ...markerCandles];
    const uniqueCandles = Array.from(new Map(allCandles.map(candle => {
      const timestamp = candle.timestamp || candle.time || 0;
      return [timestamp, candle];
    })).values()).sort((a, b) => {
      const timeA = a.timestamp || a.time || 0;
      const timeB = b.timestamp || b.time || 0;
      return timeA - timeB;
    });
    
    console.log(`✅ PERFORMANCE: Dataset optimized to ${uniqueCandles.length} candles (${markerCandles.length} markers preserved)`);
    return uniqueCandles;
  }, [ohlcData, timeRange, selectedPoints]);
  
  // Manual point selection mode only - no automatic pattern detection
  const [rangeSelection, setRangeSelection] = useState<{start: number | null, end: number | null, isSelecting: boolean}>({ start: null, end: null, isSelecting: false });
  const [drawingMode, setDrawingMode] = useState<'none' | 'line' | 'box'>('none');
  const [drawings, setDrawings] = useState<any[]>([]);
  // Note: indicators now come from props
  const [chartState, setChartState] = useState({
    scrollOffset: 0,
    zoomLevel: 1,
    priceScaleWidth: 45,
    isExpanded: false,
    isDraggingPriceScale: false,
    isDragging: false,
    dragStartX: 0,
    dragStartOffset: 0
  });

  // 📱 TOUCH EVENT HANDLERS - Add touch support for mobile devices
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!canvasRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Create mouse event equivalent for compatibility
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true
    });
    
    handleMouseDown(mouseEvent);
  }, []);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!canvasRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setCrosshair({ x, y, visible: true });
    
    // Handle dragging for touch
    if (chartState.isDragging) {
      const deltaX = x - chartState.dragStartX;
      const sensitivity = 2;
      
      const maxOffset = Math.max(0, optimizedCandles.length - Math.floor(100 / chartState.zoomLevel));
      const newOffset = Math.max(0, Math.min(
        maxOffset,
        chartState.dragStartOffset - Math.floor(deltaX / sensitivity)
      ));
      
      setChartState(prev => ({ ...prev, scrollOffset: newOffset }));
    }
  }, [chartState.isDragging, chartState.dragStartX, chartState.dragStartOffset, chartState.zoomLevel, optimizedCandles.length]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    setCrosshair(prev => ({ ...prev, visible: false }));
    setChartState(prev => ({ 
      ...prev, 
      isDraggingPriceScale: false,
      isDragging: false
    }));
  }, []);

  // Enhanced event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if hovering over price scale
    const isOverPriceScale = x > rect.width - chartState.priceScaleWidth;
    
    // Set appropriate cursor based on mode
    let cursor = 'crosshair';
    if (isOverPriceScale) cursor = 'ns-resize';
    else if (chartState.isDragging) cursor = 'grabbing';
    else if (drawingMode !== 'none') cursor = 'crosshair';
    else cursor = 'grab';
    
    canvasRef.current.style.cursor = cursor;
    setCrosshair({ x, y, visible: true });
    
    // Handle chart dragging - CONSTRAINED to filtered data only
    if (chartState.isDragging) {
      const deltaX = x - chartState.dragStartX;
      const sensitivity = 2; // Adjust drag sensitivity
      
      // 🕘 CONSTRAIN SCROLLING: Only allow dragging within filtered time range
      const maxOffset = Math.max(0, optimizedCandles.length - Math.floor(100 / chartState.zoomLevel));
      const newOffset = Math.max(0, Math.min(
        maxOffset,
        chartState.dragStartOffset - Math.floor(deltaX / sensitivity)
      ));
      
      // Only update if we're still within the filtered range
      setChartState(prev => ({ ...prev, scrollOffset: newOffset }));
      console.log(`📊 DRAG CONSTRAINED: Offset ${newOffset}/${maxOffset} (${optimizedCandles.length} filtered candles)`);
    }
    
    // Handle price scale dragging
    if (chartState.isDraggingPriceScale) {
      const deltaY = y - (rect.height / 2);
      const newZoom = Math.max(0.5, Math.min(3, 1 + (deltaY / 100)));
      setChartState(prev => ({ ...prev, zoomLevel: newZoom }));
    }
    
    // Handle range selection
    if (rangeSelection.isSelecting && rangeSelection.start !== null) {
      const padding = { left: 50, right: chartState.priceScaleWidth + 10 };
      const chartWidth = rect.width - padding.left - padding.right;
      const visibleCandles = Math.min(optimizedCandles.length, Math.floor(100 / chartState.zoomLevel));
      const candleWidth = chartWidth / visibleCandles;
      const startIndex = chartState.scrollOffset;
      const candleIndex = Math.floor((x - padding.left) / candleWidth) + startIndex;
      
      if (candleIndex >= 0 && candleIndex < optimizedCandles.length) {
        setRangeSelection(prev => ({ ...prev, end: candleIndex }));
      }
    }
  }, [chartState.isDraggingPriceScale, chartState.priceScaleWidth, chartState.isDragging, chartState.dragStartX, chartState.dragStartOffset, chartState.zoomLevel, chartState.scrollOffset, drawingMode, rangeSelection.isSelecting, rangeSelection.start, optimizedCandles.length]);
  
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return;
    e.preventDefault(); // Prevent default to ensure events work properly
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    console.log(`🖱️ MOUSE DOWN: x=${x}, y=${e.clientY - rect.top}, manualMode=${manualModeRef.current}`);
    
    // Check if clicking on price scale
    if (x > rect.width - chartState.priceScaleWidth) {
      setChartState(prev => ({ ...prev, isDraggingPriceScale: true }));
      return;
    }
    
    const padding = { left: 50, right: chartState.priceScaleWidth + 10 };
    const chartWidth = rect.width - padding.left - padding.right;
    const visibleCandles = Math.min(ohlcData.length, Math.floor(100 / chartState.zoomLevel));
    const candleWidth = chartWidth / visibleCandles;
    const startIndex = chartState.scrollOffset;
    const candleIndex = Math.floor((x - padding.left) / candleWidth) + startIndex;
    
    // Handle range selection mode (Shift + click)
    if (e.shiftKey && candleIndex >= 0 && candleIndex < ohlcData.length) {
      if (!rangeSelection.isSelecting) {
        setRangeSelection({ start: candleIndex, end: null, isSelecting: true });
      } else {
        setRangeSelection(prev => ({ 
          ...prev, 
          end: candleIndex, 
          isSelecting: false 
        }));
      }
      return;
    }
    
    // 🎯 HANDLE RAY PLACEMENT - High priority when in ray adding mode
    if (isAddingRay && manualModeRef.current) {
      console.log(`➡️ Placing ${isAddingRay} ray`);
      handleRayPlacement(e);
      return;
    }
    
    // 🎯 HANDLE MANUAL POINT SELECTION - High priority, handle first
    if (manualModeRef.current) {
      console.log('🎯 Entering manual point selection mode');
      handleManualPointClick(e);
      return;
    }
    
    // Handle candle selection for interactive mode
    if (isInteractiveMode && onCandleClick && candleIndex >= 0 && candleIndex < ohlcData.length) {
      onCandleClick(candleIndex);
      return;
    }
    
    // Start chart dragging
    setChartState(prev => ({ 
      ...prev, 
      isDragging: true, 
      dragStartX: x,
      dragStartOffset: prev.scrollOffset
    }));
  }, [isInteractiveMode, onCandleClick, ohlcData.length, chartState.priceScaleWidth, chartState.zoomLevel, chartState.scrollOffset, rangeSelection.isSelecting, isManualPointMode]);
  
  const handleMouseUp = useCallback(() => {
    setChartState(prev => ({ 
      ...prev, 
      isDraggingPriceScale: false,
      isDragging: false
    }));
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setCrosshair(prev => ({ ...prev, visible: false }));
    setChartState(prev => ({ 
      ...prev, 
      isDraggingPriceScale: false,
      isDragging: false
    }));
  }, []);
  
  // 🎯 MANUAL POINT SELECTION HANDLER - Enhanced with better logging and error handling
  const handleManualPointClick = useCallback((e: MouseEvent) => {
    console.log('🎯 handleManualPointClick called');
    if (!canvasRef.current || !optimizedCandles.length) {
      console.log('❌ Cannot handle manual point click: canvas or candles missing');
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Chart dimensions and calculations
    const padding = { top: 20, right: 80, bottom: 30, left: 20 };
    const chartHeight = canvas.height - padding.top - padding.bottom;
    const chartWidth = canvas.width - padding.left - padding.right;
    
    // Check if click is within chart area
    if (x < padding.left || x > canvas.width - padding.right || 
        y < padding.top || y > canvas.height - padding.bottom) {
      console.log(`❌ Click outside chart area: x=${x}, y=${y}, bounds=[${padding.left}, ${canvas.width - padding.right}], [${padding.top}, ${canvas.height - padding.bottom}]`);
      return;
    }
    
    console.log(`✅ Click within chart area: x=${x}, y=${y}`);
    
    // 🎯 FIXED: Use EXACT SAME visible candle calculation logic as drawEnhancedChart with proper bounds
    const visibleCandles = Math.max(1, Math.min(optimizedCandles.length, Math.floor(100 / chartState.zoomLevel)));
    const visibleStartIndex = Math.max(0, Math.min(optimizedCandles.length - visibleCandles, Math.floor(chartState.scrollOffset)));
    const visibleEndIndex = visibleStartIndex + visibleCandles;
    const visibleCandleData = optimizedCandles.slice(visibleStartIndex, visibleEndIndex);
    
    // Calculate candle width using same innerWidth as chart rendering
    const innerWidth = chartWidth; // chartWidth already excludes padding
    const candleWidth = innerWidth / visibleCandles;
    
    // Find the nearest candle using SAME index calculation as chart rendering with proper clamping
    const relativeX = x - padding.left;
    const visibleCandleIndex = Math.max(0, Math.min(visibleCandles - 1, Math.floor(relativeX / candleWidth)));
    const candleIndex = visibleStartIndex + visibleCandleIndex;
    
    if (candleIndex < 0 || candleIndex >= optimizedCandles.length) return;
    
    const candle = optimizedCandles[candleIndex];
    if (!candle) return;
    
    // Calculate price range using SAME logic as chart rendering
    let prices;
    let paddingMultiplier;
    
    if (chartType === 'line') {
      // For line charts, use only closing prices
      prices = visibleCandleData.map(c => c.close || c.c || 0);
      paddingMultiplier = 0.2; // 20% padding for better line chart visibility
    } else {
      // For candlesticks, use OHLC range
      prices = visibleCandleData.flatMap(c => [c.open || c.o, c.high || c.h, c.low || c.l, c.close || c.c]);
      paddingMultiplier = 0.1; // 10% padding for candlesticks
    }
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // 🚀 ADAPTIVE RANGE EXPANSION: Same as chart rendering
    const adaptiveMultiplier = priceRange < 50 ? paddingMultiplier * 2 : paddingMultiplier;
    const paddedMin = minPrice - priceRange * adaptiveMultiplier;
    const paddedMax = maxPrice + priceRange * adaptiveMultiplier;
    const paddedRange = (paddedMax - paddedMin) / chartState.zoomLevel;
    
    if (paddedRange === 0) return;
    
    const relativeY = y - padding.top;
    const price = paddedMax - (relativeY / chartHeight) * paddedRange;
    
    setSelectedPoints(prev => {
      // 🔢 SEQUENTIAL POINT NUMBERING - Calculate inside state updater to avoid stale closure
      const nextNumber = prev.length + 1;
      
      // 🎯 FIXED: Remove double padding offset - coordinates already relative to chart area
      const newPoint = {
        x: x, // Use original mouse x coordinate
        y: y, // Use original mouse y coordinate  
        price: price,
        timestamp: candle.timestamp || candle.time || Date.now() / 1000,
        candleIndex,
        pointNumber: nextNumber, // Sequential numbering starting from 1
        label: null
      };
      
      const updatedPoints = [...prev, newPoint];
      console.log(`🎯 MANUAL POINT SELECTED: Point ${nextNumber} at price ₹${price.toFixed(2)} (Candle ${candleIndex})`);
      console.log(`📊 Total points now: ${updatedPoints.length}`);
      return updatedPoints;
    });
  }, [optimizedCandles, chartState.scrollOffset, chartState.zoomLevel]);

  // 🎯 CLEAR MANUAL POINTS ONLY
  const clearManualPoints = useCallback(() => {
    setSelectedPoints([]);
    console.log('🗑️ Manual points cleared (rays preserved)');
  }, []);

  // 🗑️ CLEAR HORIZONTAL RAYS ONLY
  const clearHorizontalRays = useCallback(() => {
    setHorizontalRays([]);
    console.log('🗑️ Horizontal rays cleared (points preserved)');
  }, []);

  // 🗑️ CLEAR ALL (Points + Rays)
  const clearAll = useCallback(() => {
    setSelectedPoints([]);
    setHorizontalRays([]);
    setIsAddingRay(null);
    console.log('🗑️ All points and rays cleared');
  }, []);

  // 💾 SAVE POINT SET
  const savePointSet = useCallback(() => {
    if (selectedPoints.length === 0) {
      console.log('❌ No points to save');
      return;
    }
    
    const newSet = {
      id: `set_${Date.now()}`,
      name: `Pattern ${savedPointSets.length + 1} (${selectedPoints.length} points)`,
      points: [...selectedPoints],
      timestamp: Date.now()
    };
    
    setSavedPointSets(prev => [...prev, newSet]);
    console.log(`💾 Saved point set: ${newSet.name}`);
  }, [selectedPoints, savedPointSets.length]);

  // 📂 LOAD POINT SET
  const loadPointSet = useCallback((setId: string) => {
    const pointSet = savedPointSets.find(set => set.id === setId);
    if (pointSet) {
      setSelectedPoints(pointSet.points);
      console.log(`📂 Loaded point set: ${pointSet.name}`);
    }
  }, [savedPointSets]);

  // 🗑️ DELETE SAVED POINT SET
  const deleteSavedPointSet = useCallback((setId: string) => {
    setSavedPointSets(prev => prev.filter(set => set.id !== setId));
    console.log(`🗑️ Deleted saved point set: ${setId}`);
  }, []);

  // 🎯 LABEL POINT (SL/Target/Breakout/Entry) with auto-ray creation
  const labelPoint = useCallback((pointNumber: number, label: 'SL' | 'Target' | 'Breakout' | 'Entry' | null) => {
    setSelectedPoints(prev => {
      const updatedPoints = prev.map(point => 
        point.pointNumber === pointNumber 
          ? { ...point, label }
          : point
      );
      
      // Auto-create ray for labeled points (except Entry)
      if (label && label !== 'Entry') {
        const labeledPoint = updatedPoints.find(p => p.pointNumber === pointNumber);
        if (labeledPoint) {
          // Remove existing ray for this label to avoid duplicates
          setHorizontalRays(prevRays => {
            const filteredRays = prevRays.filter(ray => ray.label !== label);
            const colors = {
              SL: '#ef4444',
              Target: '#22c55e', 
              Breakout: '#f59e0b'
            };
            
            const newRay = {
              id: `ray_${label}_${Date.now()}`,
              price: labeledPoint.price,
              label: label as 'SL' | 'Target' | 'Breakout',
              color: colors[label as keyof typeof colors],
              pointNumber: pointNumber
            };
            
            console.log(`➡️ Auto-created ${label} ray at ₹${labeledPoint.price.toFixed(2)} from Point #${pointNumber}`);
            return [...filteredRays, newRay];
          });
        }
      }
      
      return updatedPoints;
    });
    console.log(`🏷️ Point ${pointNumber} labeled as: ${label || 'None'}`);
  }, []);

  // ➡️ ADD HORIZONTAL RAY
  const addHorizontalRay = useCallback((price: number, label: 'SL' | 'Target' | 'Breakout', pointNumber?: number) => {
    const colors = {
      SL: '#ef4444',        // Red for Stop Loss
      Target: '#22c55e',    // Green for Target
      Breakout: '#f59e0b'   // Orange for Breakout
    };
    
    const newRay = {
      id: `ray_${Date.now()}`,
      price,
      label,
      color: colors[label],
      pointNumber
    };
    
    setHorizontalRays(prev => [...prev, newRay]);
    console.log(`➡️ Added ${label} ray at ₹${price.toFixed(2)} ${pointNumber ? `(Point ${pointNumber})` : ''}`);
  }, []);

  // 🗑️ REMOVE HORIZONTAL RAY
  const removeHorizontalRay = useCallback((rayId: string) => {
    setHorizontalRays(prev => prev.filter(ray => ray.id !== rayId));
    console.log(`🗑️ Removed horizontal ray: ${rayId}`);
  }, []);

  // ➡️ HANDLE RAY PLACEMENT
  const handleRayPlacement = useCallback((e: MouseEvent) => {
    if (!canvasRef.current || !optimizedCandles.length || !isAddingRay) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Chart dimensions
    const padding = { top: 20, right: 80, bottom: 30, left: 20 };
    const chartHeight = canvas.height - padding.top - padding.bottom;
    
    // Check if click is within chart area
    if (x < padding.left || x > canvas.width - padding.right || 
        y < padding.top || y > canvas.height - padding.bottom) {
      return;
    }
    
    // Calculate price from Y position
    const startIndex = Math.max(0, Math.floor(chartState.scrollOffset));
    const chartWidth = canvas.width - padding.left - padding.right;
    const candleWidth = Math.max(1, chartWidth / Math.min(optimizedCandles.length - startIndex, Math.floor(100 / chartState.zoomLevel)));
    const visibleCandleCount = Math.floor(chartWidth / candleWidth);
    const endIndex = Math.min(optimizedCandles.length - 1, startIndex + visibleCandleCount);
    
    const visibleCandles = optimizedCandles.slice(startIndex, endIndex + 1);
    const prices = visibleCandles.flatMap(c => [c.high || c.h || 0, c.low || c.l || 0]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const paddedRange = priceRange * 1.05;
    const paddedMin = minPrice - (paddedRange - priceRange) / 2;
    const paddedMax = maxPrice + (paddedRange - priceRange) / 2;
    
    const relativeY = y - padding.top;
    const price = paddedMax - (relativeY / chartHeight) * paddedRange;
    
    // Add the ray
    addHorizontalRay(price, isAddingRay);
    setIsAddingRay(null); // Exit ray adding mode
    
    console.log(`➡️ ${isAddingRay} ray placed at ₹${price.toFixed(2)}`);
  }, [optimizedCandles, chartState.scrollOffset, chartState.zoomLevel, isAddingRay, addHorizontalRay]);

  // 🎯 TOGGLE MANUAL POINT MODE
  const toggleManualPointMode = useCallback(() => {
    setIsManualPointMode(prev => {
      const newMode = !prev;
      if (!newMode) {
        // Exiting manual mode, keep points visible until manually cleared
        setIsAddingRay(null); // Only stop ray adding mode
      }
      console.log(`🎯 Manual point mode: ${newMode ? 'ON' : 'OFF'}`);
      return newMode;
    });
  }, []);

  // 🌐 EXPOSE FUNCTIONS TO GLOBAL WINDOW for Visual AI integration
  useEffect(() => {
    (window as any).selectedPoints = selectedPoints;
    (window as any).horizontalRays = horizontalRays;
    (window as any).labelPoint = labelPoint;
    (window as any).addHorizontalRay = addHorizontalRay;
    (window as any).removeHorizontalRay = removeHorizontalRay;
    (window as any).setIsAddingRay = setIsAddingRay;
    (window as any).clearManualPoints = clearManualPoints;
    (window as any).clearHorizontalRays = clearHorizontalRays;
    (window as any).clearAll = clearAll;
    
    // Force re-render of Visual AI component when points change
    const visualAIPointsUpdatedEvent = new CustomEvent('visualAIPointsUpdated', {
      detail: { selectedPoints, horizontalRays }
    });
    window.dispatchEvent(visualAIPointsUpdatedEvent);
    
  }, [selectedPoints, horizontalRays, labelPoint, addHorizontalRay, removeHorizontalRay, setIsAddingRay, clearManualPoints, clearHorizontalRays, clearAll]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setChartState(prev => ({
        ...prev,
        zoomLevel: Math.max(0.5, Math.min(3, prev.zoomLevel * delta))
      }));
    } else {
      // Scroll
      setChartState(prev => ({
        ...prev,
        scrollOffset: Math.max(0, Math.min(optimizedCandles.length - 50, prev.scrollOffset + Math.sign(e.deltaY) * 5))
      }));
    }
  }, [optimizedCandles.length]);
  
  useEffect(() => {
    if (!chartContainer.current || !ohlcData || !ohlcData.length) return;

    // ✅ Using memoized optimized candles

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('data-testid', 'visual-chart'); // Add data-testid for purple dropdown
      // Safely assign to ref using type assertion
      (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;
      chartContainer.current.appendChild(canvas);
    }
    
    // Set canvas size
    const containerRect = chartContainer.current.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = chartState.isExpanded ? height * 1.5 : height;
    
    // Add event listeners
    // Add mouse event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleWheel);
    
    // Add touch event listeners for mobile support
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    console.log(`📱 Event listeners added to canvas (${canvas.width}x${canvas.height})`);
    
    drawEnhancedChart(canvas, optimizedCandles, selectionLineIndex, mockStartIndex || undefined, indicators, timeRange, chartType);
    
    return () => {
      // Remove mouse event listeners
      canvas?.removeEventListener('mousemove', handleMouseMove);
      canvas?.removeEventListener('mousedown', handleMouseDown);
      canvas?.removeEventListener('mouseup', handleMouseUp);
      canvas?.removeEventListener('mouseleave', handleMouseLeave);
      canvas?.removeEventListener('wheel', handleWheel);
      
      // Remove touch event listeners
      canvas?.removeEventListener('touchstart', handleTouchStart);
      canvas?.removeEventListener('touchmove', handleTouchMove);
      canvas?.removeEventListener('touchend', handleTouchEnd);
    };
  }, [optimizedCandles, height, chartState, selectionLineIndex, mockStartIndex, timeRange, indicators, chartType, handleMouseMove, handleMouseDown, handleMouseUp, handleMouseLeave, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, selectedPoints, horizontalRays, isManualPointMode, showManualPattern]);

  // Indicator calculation functions (same as trading-master.tsx)
  const calculateSMA = (prices: number[], period: number): (number | null)[] => {
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
  };

  const calculateEMA = (prices: number[], period: number): (number | null)[] => {
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
  };

  const calculateRSI = (prices: number[], period: number = 14): (number | null)[] => {
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
      
      // Calculate subsequent RSI values
      for (let i = period; i < gains.length; i++) {
        avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
        avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
        
        const rs = avgGain / (avgLoss || 0.0001);
        rsiArray.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsiArray;
  };

  const calculateBollinger = (prices: number[], period: number = 20, stdDev: number = 2) => {
    const sma = calculateSMA(prices, period);
    const upperBand: (number | null)[] = [];
    const lowerBand: (number | null)[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upperBand.push(null);
        lowerBand.push(null);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = slice.reduce((sum, price) => sum + price, 0) / period;
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        upperBand.push(mean + (standardDeviation * stdDev));
        lowerBand.push(mean - (standardDeviation * stdDev));
      }
    }
    
    return { sma, upperBand, lowerBand };
  };

  const drawEnhancedChart = (canvas: HTMLCanvasElement, candles: any[], selectionIndex?: number | null, mockStart?: number | null, activeIndicators?: any, currentTimeRange?: [number, number] | null, currentChartType: 'line' | 'candles' = 'line') => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !candles.length) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // TradingView Style Colors - Exact Match
    const theme = {
      background: '#131722',
      grid: '#2A2E39',
      text: '#D1D4DC',
      textSecondary: '#6C7883',
      green: '#22c55e',     // TradingView green (bright)
      red: '#ef4444',       // TradingView red (bright)
      greenWick: '#16a34a', // Darker green for wicks
      redWick: '#dc2626',   // Darker red for wicks
      blue: '#2962FF',
      volume: '#434651'
    };

    // Clear canvas with dark background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    const padding = { 
      top: 20, 
      right: chartState.priceScaleWidth + 10, 
      bottom: 30, 
      left: 50 
    };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate visible range with zoom and scroll
    const visibleCandles = Math.min(candles.length, Math.floor(100 / chartState.zoomLevel));
    const startIndex = Math.max(0, Math.min(candles.length - visibleCandles, chartState.scrollOffset));
    const endIndex = startIndex + visibleCandles;
    const visibleCandleData = candles.slice(startIndex, endIndex);
    
    // Define offset for mapping visible data to calculation dataset
    const visibleOffsetInCalcData = startIndex;
    
    if (!visibleCandleData.length) return;
    
    // 🎯 ENHANCED PRICE RANGE CALCULATION for Pattern Clarity
    let prices;
    let priceRange;
    let paddingMultiplier;
    
    if (currentChartType === 'line') {
      // For line charts, use only closing prices but with enhanced range expansion
      prices = visibleCandleData.map(c => c.close || c.c || 0);
      paddingMultiplier = 0.2; // 20% padding for better line chart visibility
    } else {
      // For candlesticks, use OHLC range
      prices = visibleCandleData.flatMap(c => [c.open || c.o, c.high || c.h, c.low || c.l, c.close || c.c]);
      paddingMultiplier = 0.1; // 10% padding for candlesticks
    }
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    priceRange = maxPrice - minPrice;
    
    // 🚀 ADAPTIVE RANGE EXPANSION: Larger expansion for small price ranges (better pattern visibility)
    const adaptiveMultiplier = priceRange < 50 ? paddingMultiplier * 2 : paddingMultiplier;
    
    const paddedMin = minPrice - priceRange * adaptiveMultiplier;
    const paddedMax = maxPrice + priceRange * adaptiveMultiplier;
    const paddedRange = (paddedMax - paddedMin) / chartState.zoomLevel;

    if (paddedRange === 0) return;

    // Draw price scale background
    ctx.fillStyle = '#1B1F2B';
    ctx.fillRect(width - chartState.priceScaleWidth, 0, chartState.priceScaleWidth, height);
    
    // Draw price scale border
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - chartState.priceScaleWidth, 0);
    ctx.lineTo(width - chartState.priceScaleWidth, height);
    ctx.stroke();

    // Draw grid lines and price labels
    ctx.fillStyle = theme.text;
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    
    for (let i = 0; i <= 5; i++) {
      const priceLevel = paddedMax - (paddedRange * i / 5);
      const y = padding.top + (chartHeight * i / 5);
      
      // Grid line
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - chartState.priceScaleWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Price label
      ctx.fillText(priceLevel.toFixed(2), width - chartState.priceScaleWidth + 5, y + 4);
    }
    
    // Calculate candle width
    const candleWidth = chartWidth / visibleCandles;

    // 📊 CONDITIONAL RENDERING: Line Chart vs Candlestick Chart
    if (currentChartType === 'line') {
      // 🚀 LINE CHART RENDERING with Enhanced Price Clarity
      ctx.strokeStyle = theme.blue; // Use blue for line chart
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let firstPoint = true;
      for (let i = 0; i < visibleCandleData.length; i++) {
        const candle = visibleCandleData[i];
        const x = padding.left + (i * candleWidth) + candleWidth / 2; // Center of candle
        
        // Use closing price for line chart
        const close = candle.close || candle.c || 0;
        const closeY = padding.top + ((paddedMax - close) / paddedRange) * chartHeight;
        
        if (firstPoint) {
          ctx.moveTo(x, closeY);
          firstPoint = false;
        } else {
          ctx.lineTo(x, closeY);
        }
      }
      ctx.stroke();
      
      // Add data points for better visibility
      ctx.fillStyle = theme.blue;
      for (let i = 0; i < visibleCandleData.length; i++) {
        const candle = visibleCandleData[i];
        const x = padding.left + (i * candleWidth) + candleWidth / 2;
        const close = candle.close || candle.c || 0;
        const closeY = padding.top + ((paddedMax - close) / paddedRange) * chartHeight;
        
        // Draw small circles at data points
        ctx.beginPath();
        ctx.arc(x, closeY, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      
    } else {
      // 🕯️ CANDLESTICK CHART RENDERING (Original Logic)
      for (let i = 0; i < visibleCandleData.length; i++) {
        const globalIndex = startIndex + i;
        const candle = visibleCandleData[i];
        const x = padding.left + (i * candleWidth);
        const centerX = x + candleWidth / 2;
        
        // Handle both OHLC formats
        const open = candle.open || candle.o || 0;
        const high = candle.high || candle.h || 0;
        const low = candle.low || candle.l || 0;
        const close = candle.close || candle.c || 0;
        
        // Calculate Y positions with enhanced range
        const highY = padding.top + ((paddedMax - high) / paddedRange) * chartHeight;
        const lowY = padding.top + ((paddedMax - low) / paddedRange) * chartHeight;
        const openY = padding.top + ((paddedMax - open) / paddedRange) * chartHeight;
        const closeY = padding.top + ((paddedMax - close) / paddedRange) * chartHeight;
        
        const isGreen = close >= open;
        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(1, bodyBottom - bodyTop);
        
        // Check if this is a mock candle
        const isMockCandle = candle.isMock || (mockStart !== null && mockStart !== undefined && globalIndex >= mockStart);
        
        // TradingView Style Colors - Exact Match
        let wickColor = isGreen ? theme.greenWick : theme.redWick;
        let bodyColor = isGreen ? theme.green : theme.red;
        
        if (isMockCandle) {
          // Mock candles: lighter/dashed appearance with new theme colors
          wickColor = isGreen ? '#22c55eAA' : '#ef4444AA'; // Semi-transparent
          bodyColor = isGreen ? '#22c55eAA' : '#ef4444AA';
        }
        
        // Draw TradingView style thin precise wicks
        ctx.strokeStyle = wickColor;
        ctx.lineWidth = 1; // Thin precise wicks like TradingView
        if (isMockCandle) {
          ctx.setLineDash([3, 2]); // Dashed pattern for mock candles
        }
        ctx.beginPath();
        ctx.moveTo(centerX, highY);
        ctx.lineTo(centerX, lowY);
        ctx.stroke();
        if (isMockCandle) {
          ctx.setLineDash([]); // Reset dash
        }
        
        // TradingView Style Candlestick Bodies - Both Green and Red are SOLID FILLED
        const candleBodyWidth = Math.max(2, candleWidth - 2); // Clean spacing
        
        // Both green and red candles are solid filled in TradingView style
        ctx.fillStyle = bodyColor;
        if (isMockCandle) {
          ctx.globalAlpha = 0.6; // Semi-transparent for mock candles
        }
        ctx.fillRect(x + 1, bodyTop, candleBodyWidth, bodyHeight);
        
        if (isMockCandle) {
          ctx.globalAlpha = 1.0; // Reset transparency
        }
      }
    }
    
    // DRAW INDICATORS - Use 3-4 months data for calculation but display only visible range
    if (activeIndicators && Object.keys(activeIndicators).length > 0) {
      // 🎯 ENHANCED ACCURACY: Use FULL OHLC dataset for indicator calculations (3-4 months)
      // This ensures indicators have sufficient historical data for accuracy
      const fullDatasetPrices = (ohlcData || []).map(c => c.close || c.c || 0);
      
      // 🚀 PERFORMANCE: Calculate indicators from full dataset (no useMemo here as we're inside drawEnhancedChart)
      const indicatorData: any = {};
      
      // Only calculate if we have valid data
      if (fullDatasetPrices.length > 0) {
        if (activeIndicators.sma) {
          indicatorData.sma = activeIndicators.sma.map((config: any) => calculateSMA(fullDatasetPrices, config.period));
        }
        if (activeIndicators.ema) {
          indicatorData.ema = activeIndicators.ema.map((config: any) => calculateEMA(fullDatasetPrices, config.period));
        }
        if (activeIndicators.ma) {
          indicatorData.ma = activeIndicators.ma.map((config: any) => calculateSMA(fullDatasetPrices, config.period));
        }
        if (activeIndicators.bollinger) {
          indicatorData.bollinger = activeIndicators.bollinger.map((config: any) => 
            calculateBollinger(fullDatasetPrices, config.period, config.stdDev));
        }
        if (activeIndicators.rsi) {
          indicatorData.rsi = activeIndicators.rsi.map((config: any) => calculateRSI(fullDatasetPrices, config.period));
        }
      }
      
      // 📊 MAP VISIBLE CANDLES TO FULL DATASET INDICES
      // Find the starting index in the full dataset that corresponds to our visible range
      const fullDataset = ohlcData || [];
      let visibleStartIndex = 0;
      
      // If we have time range filtering, find the correct starting index
      if (timeRange && timeRange.length === 2 && fullDataset.length > 0) {
        // Find the first candle in full dataset that matches our time range
        const [startMinute] = timeRange;
        const firstVisibleCandle = visibleCandleData[0];
        
        if (firstVisibleCandle) {
          const firstVisibleTime = firstVisibleCandle.timestamp || firstVisibleCandle.time || 0;
          visibleStartIndex = fullDataset.findIndex(candle => {
            const candleTime = candle.timestamp || candle.time || 0;
            return Math.abs(candleTime - firstVisibleTime) < 60; // Match within 1 minute tolerance
          });
          
          // Fallback: if no exact match found, use proportional mapping
          if (visibleStartIndex < 0) {
            visibleStartIndex = Math.floor((startMinute / 1440) * fullDataset.length);
          }
        }
      }
      
      // Ensure valid index
      visibleStartIndex = Math.max(0, visibleStartIndex);
      
      // Draw SMA indicators (multiple instances) - using 30-candle warm-up + visible range
      if (indicatorData.sma && Array.isArray(indicatorData.sma) && indicatorData.sma.length > 0) {
        indicatorData.sma.forEach((sma: any[], index: number) => {
          const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#DC143C']; // Different shades for multiple SMAs
          ctx.strokeStyle = colors[index % colors.length];
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          
          let firstPoint = true;
          for (let i = 0; i < visibleCandleData.length; i++) {
            // Map to calculation dataset (30 warm-up candles + visible range)
            const calcIndex = visibleOffsetInCalcData + i;
            const smaValue = sma[calcIndex];
            
            // Display indicators starting from the first visible candle
            if (smaValue !== null && smaValue !== undefined && calcIndex < sma.length) {
              const x = padding.left + (i * candleWidth) + candleWidth / 2;
              const y = padding.top + ((paddedMax - smaValue) / paddedRange) * chartHeight;
              
              if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
        });
      }
      
      // Draw EMA indicators (multiple instances) - using 30-candle warm-up + visible range
      if (indicatorData.ema && Array.isArray(indicatorData.ema) && indicatorData.ema.length > 0) {
        indicatorData.ema.forEach((ema: any[], index: number) => {
          const colors = ['#00BFFF', '#1E90FF', '#4169E1', '#0000FF', '#000080']; // Different blues for multiple EMAs
          ctx.strokeStyle = colors[index % colors.length];
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          
          let firstPoint = true;
          for (let i = 0; i < visibleCandleData.length; i++) {
            // Map to calculation dataset (30 warm-up candles + visible range)
            const calcIndex = visibleOffsetInCalcData + i;
            const emaValue = ema[calcIndex];
            
            // Display indicators starting from the first visible candle
            if (emaValue !== null && emaValue !== undefined && calcIndex < ema.length) {
              const x = padding.left + (i * candleWidth) + candleWidth / 2;
              const y = padding.top + ((paddedMax - emaValue) / paddedRange) * chartHeight;
              
              if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
        });
      }
      
      // Draw MA (Moving Average) indicators (multiple instances) - using 30-candle warm-up + visible range
      if (indicatorData.ma && Array.isArray(indicatorData.ma) && indicatorData.ma.length > 0) {
        indicatorData.ma.forEach((ma: any[], index: number) => {
          const colors = ['#32CD32', '#228B22', '#008000', '#006400', '#004000']; // Different greens for multiple MAs
          ctx.strokeStyle = colors[index % colors.length];
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          
          let firstPoint = true;
          for (let i = 0; i < visibleCandleData.length; i++) {
            // Map to calculation dataset (30 warm-up candles + visible range)
            const calcIndex = visibleOffsetInCalcData + i;
            const maValue = ma[calcIndex];
            
            // Display indicators starting from the first visible candle
            if (maValue !== null && maValue !== undefined && calcIndex < ma.length) {
              const x = padding.left + (i * candleWidth) + candleWidth / 2;
              const y = padding.top + ((paddedMax - maValue) / paddedRange) * chartHeight;
              
              if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
        });
      }
      
      // Draw Bollinger Bands (multiple instances) - using full dataset calculations but display only visible range
      if (indicatorData.bollinger && Array.isArray(indicatorData.bollinger) && indicatorData.bollinger.length > 0) {
        indicatorData.bollinger.forEach((bollinger: any, index: number) => {
          const colors = ['#FF69B4', '#FF1493', '#DC143C', '#B22222', '#8B0000']; // Different pinks for multiple Bollinger
          
          // Upper band
          ctx.strokeStyle = colors[index % colors.length];
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          
          let firstPoint = true;
          for (let i = 0; i < visibleCandleData.length; i++) {
            // Map to calculation dataset (30 warm-up candles + visible range)
            const calcIndex = visibleOffsetInCalcData + i;
            const upperValue = bollinger.upperBand && bollinger.upperBand[calcIndex];
            
            if (upperValue !== null && upperValue !== undefined && calcIndex < bollinger.upperBand.length) {
              const x = padding.left + (i * candleWidth) + candleWidth / 2;
              const y = padding.top + ((paddedMax - upperValue) / paddedRange) * chartHeight;
              
              if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
          
          // Lower band
          ctx.beginPath();
          firstPoint = true;
          for (let i = 0; i < visibleCandleData.length; i++) {
            // Map to calculation dataset (30 warm-up candles + visible range)
            const calcIndex = visibleOffsetInCalcData + i;
            const lowerValue = bollinger.lowerBand && bollinger.lowerBand[calcIndex];
            
            if (lowerValue !== null && lowerValue !== undefined && calcIndex < bollinger.lowerBand.length) {
              const x = padding.left + (i * candleWidth) + candleWidth / 2;
              const y = padding.top + ((paddedMax - lowerValue) / paddedRange) * chartHeight;
              
              if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
          
          // Middle line (SMA)
          ctx.setLineDash([]);
          ctx.beginPath();
          firstPoint = true;
          for (let i = 0; i < visibleCandleData.length; i++) {
            // Map to calculation dataset (30 warm-up candles + visible range)
            const calcIndex = visibleOffsetInCalcData + i;
            const middleValue = bollinger.sma && bollinger.sma[calcIndex];
            
            if (middleValue !== null && middleValue !== undefined && calcIndex < bollinger.sma.length) {
              const x = padding.left + (i * candleWidth) + candleWidth / 2;
              const y = padding.top + ((paddedMax - middleValue) / paddedRange) * chartHeight;
              
              if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
        });
      }
      
      // Draw RSI indicators (multiple instances) - using full dataset calculations but display only visible range
      if (indicatorData.rsi && Array.isArray(indicatorData.rsi) && indicatorData.rsi.length > 0) {
        const rsiPanelHeight = 60;
        const rsiPanelTop = height - padding.bottom - rsiPanelHeight;
        
        // Draw RSI panel background
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(padding.left, rsiPanelTop, chartWidth, rsiPanelHeight);
        
        indicatorData.rsi.forEach((rsi: any[], index: number) => {
          if (!rsi || !Array.isArray(rsi)) return;
          const colors = ['#FFFF00', '#FF8C00', '#FF4500', '#FF0000', '#DC143C']; // Different oranges/reds for multiple RSIs
          
          // Draw RSI reference lines (custom oversold, 50, custom overbought)
          ctx.strokeStyle = '#444444';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          
          [30, 50, 70].forEach(level => { // Use standard RSI levels
            const y = rsiPanelTop + ((100 - level) / 100) * rsiPanelHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
          });
          
          ctx.setLineDash([]);
          
          // Draw RSI line
          ctx.strokeStyle = colors[index % colors.length];
          ctx.lineWidth = 2;
          ctx.beginPath();
          
          let firstPoint = true;
          for (let i = 0; i < visibleCandleData.length; i++) {
            // Map to calculation dataset (30 warm-up candles + visible range)
            const calcIndex = visibleOffsetInCalcData + i;
            const rsiValue = rsi[calcIndex];
            
            if (rsiValue !== null && rsiValue !== undefined && calcIndex < rsi.length) {
              const x = padding.left + (i * candleWidth) + candleWidth / 2;
              const y = rsiPanelTop + ((100 - rsiValue) / 100) * rsiPanelHeight;
              
              if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
          ctx.stroke();
        });
        
        // Draw RSI labels
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('RSI', padding.left - 5, rsiPanelTop + 15);
      }
    }
    
    // Draw selection line for interactive mode
    if (selectionIndex !== null && selectionIndex !== undefined && selectionIndex >= startIndex && selectionIndex < startIndex + visibleCandles) {
      const relativeIndex = selectionIndex - startIndex;
      const selectionX = padding.left + (relativeIndex * candleWidth) + candleWidth / 2;
      
      // Draw vertical selection line
      ctx.strokeStyle = '#00FF00'; // Bright green
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(selectionX, padding.top);
      ctx.lineTo(selectionX, height - padding.bottom);
      ctx.stroke();
      
      // Add selection indicator at top
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(selectionX, padding.top, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add text label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📍 SELECTED', selectionX, padding.top - 8);
    }

    // 🎯 ENHANCED CROSSHAIR with Price & Time Display
    if (crosshair.visible) {
      ctx.strokeStyle = theme.textSecondary + '80';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      // Vertical crosshair line
      ctx.beginPath();
      ctx.moveTo(crosshair.x, padding.top);
      ctx.lineTo(crosshair.x, height - padding.bottom);
      ctx.stroke();
      
      // Horizontal crosshair line
      ctx.beginPath();
      ctx.moveTo(padding.left, crosshair.y);
      ctx.lineTo(width - padding.right, crosshair.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // 💡 Calculate and display price at crosshair position
      const priceAtCrosshair = paddedMax - ((crosshair.y - padding.top) / chartHeight) * paddedRange;
      
      // 🕘 Calculate and display time/candle index at crosshair position
      const candleIndex = Math.floor((crosshair.x - padding.left) / candleWidth);
      const candle = visibleCandleData[candleIndex];
      
      if (candle && priceAtCrosshair > 0) {
        // Price label (right side)
        ctx.fillStyle = theme.blue;
        ctx.fillRect(width - padding.right - 2, crosshair.y - 10, padding.right + 2, 20);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(
          `₹${priceAtCrosshair.toFixed(2)}`, 
          width - padding.right + 2, 
          crosshair.y + 3
        );
        
        // Time/Candle info label (bottom)
        const timestamp = candle.timestamp || candle.time || 0;
        const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
        const timeStr = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        
        ctx.fillStyle = theme.blue;
        const labelWidth = 80;
        ctx.fillRect(crosshair.x - labelWidth/2, height - padding.bottom, labelWidth, 20);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, crosshair.x, height - padding.bottom + 12);
        
        // 📊 Show OHLC values for current candle (top-left corner)
        if (candle) {
          const open = candle.open || candle.o || 0;
          const high = candle.high || candle.h || 0;  
          const low = candle.low || candle.l || 0;
          const close = candle.close || candle.c || 0;
          
          // Background for OHLC info
          ctx.fillStyle = theme.background + 'F0';
          ctx.fillRect(padding.left + 5, padding.top + 5, 150, currentChartType === 'line' ? 25 : 50);
          
          // OHLC text
          ctx.fillStyle = theme.text;
          ctx.font = '10px Arial';
          ctx.textAlign = 'left';
          
          if (currentChartType === 'line') {
            // For line charts, show only Close price
            ctx.fillText(`Close: ₹${close.toFixed(2)}`, padding.left + 8, padding.top + 20);
          } else {
            // For candlesticks, show full OHLC
            ctx.fillText(`O: ₹${open.toFixed(2)} H: ₹${high.toFixed(2)}`, padding.left + 8, padding.top + 20);
            ctx.fillText(`L: ₹${low.toFixed(2)} C: ₹${close.toFixed(2)}`, padding.left + 8, padding.top + 35);
          }
        }
      }
    }
    
    // 🎯 AUTOMATIC PATTERN OVERLAYS DISABLED - Clean chart for manual pattern drawing
    // Clean chart interface - no automatic pattern overlays
    
    // 🎯 DRAW MANUAL SELECTED POINTS AND PATTERNS - FIXED CANDLEINDEX ANCHORING
    if (showManualPattern && selectedPoints.length > 0) {
      selectedPoints.forEach((point, index) => {
        // 🔧 CALCULATE ACTUAL SCREEN POSITION FROM CANDLEINDEX (DRAG-PROOF)
        let actualX = point.x;
        let actualY = point.y;
        
        if (point.candleIndex !== undefined) {
          // Calculate screen X position from candleIndex and current scroll offset
          const relativeIndex = point.candleIndex - chartState.scrollOffset;
          
          if (relativeIndex >= 0 && relativeIndex < visibleCandles) {
            actualX = padding.left + (relativeIndex * candleWidth) + (candleWidth / 2);
            // Y position from price 
            actualY = padding.top + ((paddedMax - point.price) / paddedRange) * chartHeight;
          } else {
            // Point is outside visible area, skip drawing
            return;
          }
        }
        
        // Draw point circle
        ctx.fillStyle = '#00FF00'; // Bright green for manual points
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(actualX, actualY, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Draw point number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(point.pointNumber.toString(), actualX, actualY);
        
        // Draw price label
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`₹${point.price.toFixed(2)}`, actualX + 12, actualY - 5);
        
        // Draw point label if exists
        if (point.label) {
          const labelColors = {
            SL: '#ef4444',
            Target: '#22c55e', 
            Breakout: '#f59e0b',
            Entry: '#3b82f6'
          };
          ctx.fillStyle = labelColors[point.label] || '#FFFFFF';
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(point.label, actualX, actualY + 12);
        }
      });
      
      // Draw lines connecting points (if 2 or more points) - FIXED FOR CANDLEINDEX
      if (selectedPoints.length >= 2) {
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Draw lines connecting consecutive points using recalculated positions
        const visiblePoints = selectedPoints.filter(point => {
          if (point.candleIndex !== undefined) {
            const relativeIndex = point.candleIndex - chartState.scrollOffset;
            return relativeIndex >= 0 && relativeIndex < visibleCandles;
          }
          return true;
        }).map(point => {
          if (point.candleIndex !== undefined) {
            const relativeIndex = point.candleIndex - chartState.scrollOffset;
            const actualX = padding.left + (relativeIndex * candleWidth) + (candleWidth / 2);
            const actualY = padding.top + ((paddedMax - point.price) / paddedRange) * chartHeight;
            return { x: actualX, y: actualY };
          }
          return { x: point.x, y: point.y };
        });
        
        if (visiblePoints.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y);
          
          for (let i = 1; i < visiblePoints.length; i++) {
            ctx.lineTo(visiblePoints[i].x, visiblePoints[i].y);
          }
          
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
        }
      }
    }
    
    // ➡️ DRAW HORIZONTAL RAYS (SL/Target/Breakout levels)
    if (horizontalRays.length > 0) {
      horizontalRays.forEach(ray => {
        const rayY = padding.top + ((paddedMax - ray.price) / paddedRange) * chartHeight;
        
        // 🎯 CALCULATE RAY START AND END POSITIONS based on pattern points and candle size
        let rayStartX = padding.left;
        let rayEndX = width - padding.right; // Default to full width as fallback
        
        if (selectedPoints.length > 0) {
          // Find the pattern starting point (lowest point number)
          const startingPoint = selectedPoints.reduce((min, point) => 
            point.pointNumber < min.pointNumber ? point : min
          );
          
          // Find the pattern ending point (highest point number)  
          const endingPoint = selectedPoints.reduce((max, point) => 
            point.pointNumber > max.pointNumber ? point : max
          );
          
          // Calculate candle width for current chart
          const candleWidth = chartWidth / visibleCandles;
          
          // Start ray at the starting point position
          const startCandleIndex = Math.max(0, startingPoint.candleIndex - startIndex);
          rayStartX = padding.left + (startCandleIndex * candleWidth);
          
          // End ray at last point + one candle duration (next candle size)
          const endCandleIndex = Math.max(0, endingPoint.candleIndex - startIndex);
          rayEndX = padding.left + ((endCandleIndex + 1) * candleWidth); // +1 for next candle
          
          // Ensure ray doesn't exceed chart boundaries
          rayEndX = Math.min(rayEndX, width - padding.right);
        }
        
        // Draw ray line from start point to end point + next candle
        ctx.strokeStyle = ray.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line for rays
        ctx.beginPath();
        ctx.moveTo(rayStartX, rayY);
        ctx.lineTo(rayEndX, rayY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
        
        // Draw ray label and price
        const labelText = `${ray.label}: ₹${ray.price.toFixed(2)}`;
        ctx.fillStyle = ray.color;
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        
        // Background for label
        const labelWidth = ctx.measureText(labelText).width + 6;
        const labelHeight = 16;
        ctx.fillStyle = theme.background + 'E6'; // Semi-transparent background
        ctx.fillRect(padding.left + 5, rayY - labelHeight/2, labelWidth, labelHeight);
        
        // Label text
        ctx.fillStyle = ray.color;
        ctx.fillText(labelText, padding.left + 8, rayY + 4);
        
        // Point number reference if available
        if (ray.pointNumber) {
          const pointText = `#${ray.pointNumber}`;
          ctx.fillStyle = '#FFEB3B'; // Yellow for point numbers
          ctx.font = '9px Arial';
          ctx.textAlign = 'right';
          ctx.fillText(pointText, width - padding.right - 5, rayY + 3);
        }
      });
    }
    
    // 🕘 Draw TIME FILTER VERTICAL REFERENCE LINES - Moving lines controlled by sliders
    if (currentTimeRange && currentTimeRange.length === 2) {
      const [startMinute, endMinute] = currentTimeRange;
      
      // Convert candle timestamps to minutes since midnight for direct comparison
      const candleMinutes = visibleCandleData.map(candle => {
        const timestamp = candle.timestamp || candle.time || 0;
        const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
        return date.getHours() * 60 + date.getMinutes();
      });
      
      // Find the closest candle indices to slider positions
      let startCandleIndex = -1;
      let endCandleIndex = -1;
      
      // Find start position - closest candle to or after start time
      for (let i = 0; i < candleMinutes.length; i++) {
        if (candleMinutes[i] >= startMinute) {
          startCandleIndex = i;
          break;
        }
      }
      
      // Find end position - closest candle to or before end time
      for (let i = candleMinutes.length - 1; i >= 0; i--) {
        if (candleMinutes[i] <= endMinute) {
          endCandleIndex = i;
          break;
        }
      }
      
      // Debug logging for synchronization
      console.log(`🕘 TIME FILTER SYNC: Start=${startMinute}min (${Math.floor(startMinute/60)}:${String(startMinute%60).padStart(2,'0')}), End=${endMinute}min (${Math.floor(endMinute/60)}:${String(endMinute%60).padStart(2,'0')})`);
      console.log(`📍 CANDLE MATCH: Start index=${startCandleIndex}, End index=${endCandleIndex}`);
      
      // VERTICAL LINE RENDERING DISABLED - User requested removal of 9:15 vertical line
      // Time filtering still works through slider bar, just visual lines removed
    }
    
    // Draw date/time scale at bottom
    ctx.fillStyle = theme.text;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < visibleCandleData.length; i += Math.ceil(visibleCandles / 6)) {
      const candle = visibleCandleData[i];
      const x = padding.left + (i * candleWidth) + candleWidth / 2;
      const timestamp = candle.timestamp || candle.time || Date.now();
      const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
      const timeLabel = date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Draw time label
      ctx.fillText(timeLabel, x, height - 5);
      
      // Draw tick mark
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, height - padding.bottom);
      ctx.lineTo(x, height - padding.bottom + 5);
      ctx.stroke();
    }
    
    // Draw range selection overlay
    if (rangeSelection.start !== null && rangeSelection.end !== null) {
      const startIdx = Math.min(rangeSelection.start, rangeSelection.end) - startIndex;
      const endIdx = Math.max(rangeSelection.start, rangeSelection.end) - startIndex;
      
      if (startIdx >= 0 && endIdx < visibleCandles) {
        const startX = padding.left + (startIdx * candleWidth);
        const endX = padding.left + ((endIdx + 1) * candleWidth);
        
        // Draw selection background
        ctx.fillStyle = '#00FF0020';
        ctx.fillRect(startX, padding.top, endX - startX, chartHeight);
        
        // Draw selection borders
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, padding.top);
        ctx.lineTo(startX, height - padding.bottom);
        ctx.moveTo(endX, padding.top);
        ctx.lineTo(endX, height - padding.bottom);
        ctx.stroke();
        
        // Draw selection info
        ctx.fillStyle = '#00FF00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `Range: ${Math.abs(rangeSelection.end - rangeSelection.start) + 1} candles`,
          (startX + endX) / 2,
          padding.top - 5
        );
      }
    }
    
    // Draw zoom and scroll indicators
    if (chartState.zoomLevel !== 1 || chartState.scrollOffset > 0) {
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Zoom: ${(chartState.zoomLevel * 100).toFixed(0)}% | Scroll: ${chartState.scrollOffset} | Candles: ${visibleCandles}/${candles.length}`,
        padding.left,
        height - 25
      );
    }
    
    // Draw price scale drag indicator
    if (chartState.isDraggingPriceScale) {
      ctx.fillStyle = '#00FF0080';
      ctx.fillRect(width - chartState.priceScaleWidth, 0, chartState.priceScaleWidth, height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DRAG', width - chartState.priceScaleWidth / 2, height / 2);
    }
  };

  return (
    <div className="w-full h-full bg-[#131722] rounded-lg overflow-hidden relative">
      {/* Vertical Sidebar Controls */}
      {!hideControls && isManualPointMode && (
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
        <button
          onClick={() => {
            setChartState(prev => ({ ...prev, zoomLevel: 1, scrollOffset: 0 }));
            if (onChartReset) onChartReset();
          }}
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs w-20"
          data-testid="button-reset-chart"
        >
          🔄 Reset
        </button>
        
        <button
          onClick={() => {
            console.log('🎯 Manual point mode button clicked');
            toggleManualPointMode();
            
            // Auto-display Notes AI when select is activated
            if (!isManualPointMode && onSelectActivated) {
              console.log('🤖 Auto-displaying Notes AI in Visual AI tab');
              onSelectActivated();
            }
          }}
          className={`px-2 py-1 rounded text-xs font-bold transition-colors w-20 ${
            isManualPointMode 
              ? 'bg-green-500 hover:bg-green-400 text-black border-2 border-green-300' 
              : 'bg-slate-700 hover:bg-slate-600 text-white border-2 border-transparent'
          }`}
          data-testid="button-manual-point-mode"
        >
          {isManualPointMode ? '✏️ ON' : '✏️ Select'}
        </button>
        
        {/* Hide point control buttons when enablePointSelection is false (pattern mode) */}
        {enablePointSelection !== false && selectedPoints.length > 0 && (
          <div 
            className="text-white text-xs px-2 py-1 bg-green-800 rounded w-20 text-center"
            data-testid="text-selected-points-count"
          >
            {selectedPoints.length} pts
          </div>
        )}
        
        {/* Clear and Undo buttons below pts box - Hidden when patterns are applied */}
        {enablePointSelection !== false && selectedPoints.length > 0 && (
          <>
            <button
              onClick={() => {
                // Delete last point - same logic as OHLC data window 
                const updatedPoints = selectedPoints.slice(0, -1);
                onSelectedPointsChange?.(updatedPoints);
                
                // Update global window state for chart sync
                (window as any).selectedPoints = updatedPoints;
                
                // Dispatch event to update Visual AI
                window.dispatchEvent(new CustomEvent('visualAIPointsUpdated', {
                  detail: { 
                    selectedPoints: updatedPoints, 
                    horizontalRays: [] 
                  }
                }));
                
                console.log(`🗑️ Deleted last point. Remaining: ${updatedPoints.length} points`);
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs w-20"
              data-testid="button-delete-point"
            >
              ❌ Delete
            </button>
            
            <button
              onClick={() => {
                // Clear all points
                onSelectedPointsChange?.([]);
                
                // Update global window state
                (window as any).selectedPoints = [];
                
                // Dispatch event to update Visual AI
                window.dispatchEvent(new CustomEvent('visualAIPointsUpdated', {
                  detail: { 
                    selectedPoints: [], 
                    horizontalRays: [] 
                  }
                }));
                
                console.log('🧹 Cleared all selected points');
              }}
              className="bg-orange-600 hover:bg-orange-500 text-white px-2 py-1 rounded text-xs w-20"
              data-testid="button-clear-points"
            >
              🧹 Clear
            </button>
            
            <button
              onClick={() => {
                // Undo last point (same as delete in this context)
                const updatedPoints = selectedPoints.slice(0, -1);
                onSelectedPointsChange?.(updatedPoints);
                
                // Update global window state
                (window as any).selectedPoints = updatedPoints;
                
                // Dispatch event to update Visual AI
                window.dispatchEvent(new CustomEvent('visualAIPointsUpdated', {
                  detail: { 
                    selectedPoints: updatedPoints, 
                    horizontalRays: [] 
                  }
                }));
                
                console.log(`↩️ Undo last point. Remaining: ${updatedPoints.length} points`);
              }}
              className="bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded text-xs w-20"
              data-testid="button-undo-point"
            >
              ↩️ Undo
            </button>
          </>
        )}
        </div>
      )}
      
      <div 
        ref={chartContainer} 
        className="w-full h-full bg-[#131722]"
        style={{ height: chartState.isExpanded ? height * 1.5 : height }}
      />
    </div>
  );
}