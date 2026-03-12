/**
 * Professional Swing Point Extraction System
 * Uses ZigZag algorithm to identify pivot points (local maxima/minima) for proper pattern detection
 */

export interface SwingPoint {
  index: number;
  timestamp: number;
  price: number;
  type: 'high' | 'low';
  strength: number; // How many bars confirmed this swing
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export class SwingPointExtractor {

  /**
   * Extract Support and Resistance levels from price data
   * This finds real meaningful price levels that act as barriers
   */
  static extractSupportResistanceLevels(
    candles: CandleData[],
    minTouches: number = 3, // Minimum number of times price must touch level
    tolerancePercent: number = 0.5 // How close prices need to be to form a level
  ): Array<{level: number, type: 'support' | 'resistance', touches: number, indices: number[], strength: number}> {
    if (candles.length < 10) return [];

    // Step 1: Get all significant highs and lows
    const significantPoints: Array<{price: number, index: number, type: 'high' | 'low'}> = [];
    
    // Find significant highs and lows using a simple lookback approach
    const lookback = Math.max(5, Math.floor(candles.length / 50)); // Adaptive lookback
    
    for (let i = lookback; i < candles.length - lookback; i++) {
      const candle = candles[i];
      
      // Check if this is a significant high
      let isSignificantHigh = true;
      let isSignificantLow = true;
      
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        if (candles[j].high >= candle.high) isSignificantHigh = false;
        if (candles[j].low <= candle.low) isSignificantLow = false;
      }
      
      if (isSignificantHigh) {
        significantPoints.push({
          price: candle.high,
          index: i,
          type: 'high'
        });
      }
      
      if (isSignificantLow) {
        significantPoints.push({
          price: candle.low,
          index: i,
          type: 'low'
        });
      }
    }
    
    // Step 2: Group nearby price levels together
    const levels: Array<{level: number, type: 'support' | 'resistance', touches: number, indices: number[], strength: number}> = [];
    
    for (const point of significantPoints) {
      const tolerance = point.price * (tolerancePercent / 100);
      
      // Find existing level this point could belong to
      const existingLevel = levels.find(level => 
        Math.abs(level.level - point.price) <= tolerance &&
        level.type === (point.type === 'high' ? 'resistance' : 'support')
      );
      
      if (existingLevel) {
        // Add to existing level
        existingLevel.touches++;
        existingLevel.indices.push(point.index);
        // Recalculate average level
        const allPrices = [existingLevel.level, point.price];
        existingLevel.level = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      } else {
        // Create new level
        levels.push({
          level: point.price,
          type: point.type === 'high' ? 'resistance' : 'support',
          touches: 1,
          indices: [point.index],
          strength: 1
        });
      }
    }
    
    // Step 3: Filter levels by minimum touches and calculate strength
    const validLevels = levels
      .filter(level => level.touches >= minTouches)
      .map(level => ({
        ...level,
        strength: level.touches * (candles.length / 100) // More touches + more data = stronger
      }))
      .sort((a, b) => b.strength - a.strength); // Sort by strength
    
    console.log(`🎯 Support/Resistance Detection: Found ${validLevels.length} strong levels from ${candles.length} candles`);
    console.log(`📊 Levels:`, validLevels.map(l => `${l.type.toUpperCase()}@${l.level.toFixed(2)} (${l.touches} touches)`).join(', '));
    
    return validLevels;
  }

  /**
   * Convert Support/Resistance levels to swing points for pattern detection
   */
  static supportResistanceToSwingPoints(
    srLevels: Array<{level: number, type: 'support' | 'resistance', touches: number, indices: number[], strength: number}>,
    candles: CandleData[]
  ): SwingPoint[] {
    const swingPoints: SwingPoint[] = [];
    
    for (const srLevel of srLevels) {
      // Use the first occurrence index for timing
      const firstIndex = Math.min(...srLevel.indices);
      const firstCandle = candles[firstIndex];
      
      swingPoints.push({
        index: firstIndex,
        price: srLevel.level,
        timestamp: firstCandle.timestamp,
        type: srLevel.type === 'resistance' ? 'high' : 'low',
        strength: srLevel.strength
      });
    }
    
    // Sort by index to maintain chronological order
    return swingPoints.sort((a, b) => a.index - b.index);
  }
  
  /**
   * Extract swing points using ZigZag algorithm with minimum percentage deviation
   * This identifies true pivot points (local maxima/minima) from OHLC data
   */
  static extractSwingPoints(
    candles: CandleData[], 
    minDeviationPercent: number = 2.0,
    lookbackPeriod: number = 5
  ): SwingPoint[] {
    if (candles.length < lookbackPeriod * 2) {
      console.log(`⚠️ Insufficient data: ${candles.length} candles, need at least ${lookbackPeriod * 2}`);
      return [];
    }

    const swingPoints: SwingPoint[] = [];
    
    // Find local highs and lows using lookback method
    for (let i = lookbackPeriod; i < candles.length - lookbackPeriod; i++) {
      const currentCandle = candles[i];
      const currentHigh = currentCandle.high;
      const currentLow = currentCandle.low;
      
      // Check if current high is a local maximum
      let isSwingHigh = true;
      let isSwingLow = true;
      
      for (let j = i - lookbackPeriod; j <= i + lookbackPeriod; j++) {
        if (j === i) continue;
        
        if (candles[j].high >= currentHigh) {
          isSwingHigh = false;
        }
        if (candles[j].low <= currentLow) {
          isSwingLow = false;
        }
      }
      
      // Add swing high if it's a local maximum
      if (isSwingHigh) {
        swingPoints.push({
          index: i,
          timestamp: currentCandle.timestamp,
          price: currentHigh,
          type: 'high',
          strength: lookbackPeriod
        });
      }
      
      // Add swing low if it's a local minimum
      if (isSwingLow) {
        swingPoints.push({
          index: i,
          timestamp: currentCandle.timestamp,
          price: currentLow,
          type: 'low',
          strength: lookbackPeriod
        });
      }
    }
    
    // Apply ZigZag filtering with minimum deviation
    const zigzagPoints = this.applyZigZagFilter(swingPoints, minDeviationPercent);
    
    console.log(`🎯 Swing Point Extraction: ${candles.length} candles → ${swingPoints.length} raw pivots → ${zigzagPoints.length} filtered swing points`);
    
    return zigzagPoints.sort((a, b) => a.index - b.index);
  }
  
  /**
   * Apply ZigZag filter to remove minor fluctuations
   * Only keeps swings that move at least minDeviation% from previous swing
   */
  private static applyZigZagFilter(
    swingPoints: SwingPoint[], 
    minDeviationPercent: number
  ): SwingPoint[] {
    if (swingPoints.length < 2) return swingPoints;
    
    // Sort by index to ensure chronological order
    const sortedSwings = [...swingPoints].sort((a, b) => a.index - b.index);
    const filteredSwings: SwingPoint[] = [sortedSwings[0]]; // Always include first point
    
    for (let i = 1; i < sortedSwings.length; i++) {
      const lastSwing = filteredSwings[filteredSwings.length - 1];
      const currentSwing = sortedSwings[i];
      
      // Calculate percentage deviation from last significant swing
      const deviation = Math.abs(currentSwing.price - lastSwing.price) / lastSwing.price * 100;
      
      // Only include if deviation is significant enough AND swing type alternates
      if (deviation >= minDeviationPercent && currentSwing.type !== lastSwing.type) {
        filteredSwings.push(currentSwing);
      }
    }
    
    return filteredSwings;
  }
  
  /**
   * 🎯 CORRECT 15-MINUTE SWING POINT METHODOLOGY
   * Converts 1-minute candles to 15-minute candles and identifies swing points
   * Based on number of points in pattern: high-low-high-low or low-high-low-high
   */
  static extractFifteenMinuteSwingPoints(
    oneMinuteCandles: CandleData[],
    numPoints: number
  ): { swingPoints: SwingPoint[], fifteenMinCandles: CandleData[], exactTimestamps: { point: SwingPoint, exactTimestamp: number }[] } {
    console.log(`🎯 EXTRACTING 15-MINUTE SWING POINTS: ${oneMinuteCandles.length} 1-min candles → ${numPoints} swing points`);
    
    // Step 1: Convert 1-minute candles to 15-minute candles
    const fifteenMinCandles = this.convertTo15MinuteCandles(oneMinuteCandles);
    console.log(`📊 Created ${fifteenMinCandles.length} fifteen-minute candles from ${oneMinuteCandles.length} one-minute candles`);
    
    // Step 2: Extract swing points from 15-minute data
    const swingPoints = this.extractSwingPoints(fifteenMinCandles, 2, 1.0); // 2 lookback, 1% min deviation
    console.log(`🔍 Found ${swingPoints.length} swing points in 15-minute data`);
    
    // Step 3: Select the required number of points based on pattern structure
    const selectedPoints = this.selectPatternPoints(swingPoints, numPoints);
    console.log(`✅ Selected ${selectedPoints.length} points for ${numPoints}-point pattern`);
    
    // Step 4: Map swing points back to exact 1-minute timestamps
    const exactTimestamps = this.mapToExact1MinuteTimestamps(selectedPoints, oneMinuteCandles);
    console.log(`⏰ Mapped swing points to exact 1-minute timestamps`);
    
    return {
      swingPoints: selectedPoints,
      fifteenMinCandles,
      exactTimestamps
    };
  }

  /**
   * Convert 1-minute candles to 15-minute candles
   */
  private static convertTo15MinuteCandles(oneMinCandles: CandleData[]): CandleData[] {
    const fifteenMinCandles: CandleData[] = [];
    
    // Group candles into 15-minute intervals
    for (let i = 0; i < oneMinCandles.length; i += 15) {
      const group = oneMinCandles.slice(i, i + 15);
      if (group.length === 0) continue;
      
      const firstCandle = group[0];
      const lastCandle = group[group.length - 1];
      
      // Create 15-minute OHLC from 15 one-minute candles
      const fifteenMinCandle: CandleData = {
        timestamp: firstCandle.timestamp, // Use first candle timestamp
        open: firstCandle.open,
        high: Math.max(...group.map(c => c.high)),
        low: Math.min(...group.map(c => c.low)),
        close: lastCandle.close,
        volume: group.reduce((sum, c) => sum + (c.volume || 0), 0)
      };
      
      fifteenMinCandles.push(fifteenMinCandle);
    }
    
    return fifteenMinCandles;
  }

  /**
   * Select pattern points based on swing structure (high-low-high-low or reverse)
   */
  private static selectPatternPoints(swingPoints: SwingPoint[], numPoints: number): SwingPoint[] {
    if (swingPoints.length < numPoints) {
      console.log(`⚠️ Not enough swing points: need ${numPoints}, found ${swingPoints.length}`);
      return swingPoints;
    }
    
    // Find sequences that alternate properly (high-low-high-low or low-high-low-high)
    for (let i = 0; i <= swingPoints.length - numPoints; i++) {
      const sequence = swingPoints.slice(i, i + numPoints);
      
      // Check if sequence alternates properly
      if (this.isValidSwingSequence(sequence)) {
        console.log(`✅ Found valid ${numPoints}-point swing sequence: ${sequence.map(p => p.type).join('-')}`);
        return sequence;
      }
    }
    
    // Fallback: just take first numPoints if no perfect sequence found
    console.log(`⚠️ No perfect alternating sequence found, using first ${numPoints} points`);
    return swingPoints.slice(0, numPoints);
  }

  /**
   * Check if swing sequence alternates properly (high-low-high-low or low-high-low-high)
   */
  private static isValidSwingSequence(sequence: SwingPoint[]): boolean {
    if (sequence.length < 2) return true;
    
    // Check that types alternate
    for (let i = 1; i < sequence.length; i++) {
      if (sequence[i].type === sequence[i - 1].type) {
        return false; // Same type consecutively = invalid
      }
    }
    return true;
  }

  /**
   * Map 15-minute swing points back to exact 1-minute timestamps where the high/low occurred
   */
  private static mapToExact1MinuteTimestamps(
    swingPoints: SwingPoint[],
    oneMinuteCandles: CandleData[]
  ): { point: SwingPoint, exactTimestamp: number }[] {
    const exactTimestamps: { point: SwingPoint, exactTimestamp: number }[] = [];
    
    for (const swingPoint of swingPoints) {
      // Find the 15-minute window where this swing point occurred
      const windowStart = swingPoint.timestamp;
      const windowEnd = windowStart + (15 * 60); // 15 minutes in seconds
      
      // Find 1-minute candles in this window
      const windowCandles = oneMinuteCandles.filter(c => 
        c.timestamp >= windowStart && c.timestamp < windowEnd
      );
      
      // Find exact 1-minute candle where the high/low occurred
      let exactCandle: CandleData | null = null;
      if (swingPoint.type === 'high') {
        // Find candle with highest high in window
        exactCandle = windowCandles.reduce((max, candle) => 
          candle.high > max.high ? candle : max, windowCandles[0]);
      } else {
        // Find candle with lowest low in window  
        exactCandle = windowCandles.reduce((min, candle) =>
          candle.low < min.low ? candle : min, windowCandles[0]);
      }
      
      if (exactCandle) {
        exactTimestamps.push({
          point: swingPoint,
          exactTimestamp: exactCandle.timestamp
        });
        
        console.log(`📍 ${swingPoint.type.toUpperCase()} at 15-min ${new Date(swingPoint.timestamp * 1000).toLocaleTimeString()} → exact 1-min ${new Date(exactCandle.timestamp * 1000).toLocaleTimeString()}`);
      }
    }
    
    return exactTimestamps;
  }

  /**
   * Find specific swing patterns within the swing points
   * Returns sequences of swing points that match the given relationship pattern
   */
  static findSwingPattern(
    swingPoints: SwingPoint[], 
    patternRelationships: string[],
    tolerancePercent: number = 5.0
  ): SwingPoint[][] {
    const patterns: SwingPoint[][] = [];
    const requiredPoints = patternRelationships.length + 1; // relationships + 1 = points
    
    if (swingPoints.length < requiredPoints) {
      return patterns;
    }
    
    // Sliding window through swing points
    for (let i = 0; i <= swingPoints.length - requiredPoints; i++) {
      const window = swingPoints.slice(i, i + requiredPoints);
      
      if (this.validateSwingRelationships(window, patternRelationships, tolerancePercent)) {
        patterns.push(window);
      }
    }
    
    return patterns;
  }
  
  /**
   * Validate if swing point sequence matches the given relationships
   * Properly handles price level relationships with tolerance
   */
  private static validateSwingRelationships(
    swingPoints: SwingPoint[], 
    relationships: string[],
    tolerancePercent: number
  ): boolean {
    if (swingPoints.length !== relationships.length + 1) {
      return false;
    }
    
    // Check each relationship
    for (let i = 0; i < relationships.length; i++) {
      const relationship = relationships[i];
      const pointA = swingPoints[i];
      const pointB = swingPoints[i + 1];
      
      if (!this.checkRelationship(pointA, pointB, relationship, tolerancePercent)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check individual swing point relationship (e.g., "1<2", "2>3", "4=2")
   */
  private static checkRelationship(
    pointA: SwingPoint, 
    pointB: SwingPoint, 
    relationship: string,
    tolerancePercent: number
  ): boolean {
    const priceA = pointA.price;
    const priceB = pointB.price;
    
    // Calculate tolerance range
    const tolerance = Math.max(priceA, priceB) * (tolerancePercent / 100);
    
    if (relationship.includes('<')) {
      return priceA < priceB - tolerance; // A significantly lower than B
    } else if (relationship.includes('>')) {
      return priceA > priceB + tolerance; // A significantly higher than B
    } else if (relationship.includes('=')) {
      return Math.abs(priceA - priceB) <= tolerance; // A approximately equal to B
    }
    
    return false;
  }
  
  /**
   * Calculate pattern confidence based on swing point quality and price action
   */
  static calculatePatternConfidence(
    swingPoints: SwingPoint[],
    patternType: string,
    candleData: CandleData[]
  ): number {
    let confidence = 70; // Base confidence
    
    // Boost confidence for strong swing points
    const avgStrength = swingPoints.reduce((sum, point) => sum + point.strength, 0) / swingPoints.length;
    confidence += Math.min(avgStrength * 2, 15); // Up to +15 for strong swings
    
    // Boost confidence for clear price separation
    const priceRange = Math.max(...swingPoints.map(p => p.price)) - Math.min(...swingPoints.map(p => p.price));
    const avgPrice = swingPoints.reduce((sum, p) => sum + p.price, 0) / swingPoints.length;
    const rangePercent = (priceRange / avgPrice) * 100;
    
    if (rangePercent > 5) confidence += 10; // Clear price movements
    if (rangePercent > 10) confidence += 5;  // Strong price movements
    
    // Boost confidence for volume confirmation (if available)
    if (candleData[0]?.volume) {
      const swingVolumes = swingPoints.map(sp => candleData[sp.index]?.volume || 0);
      const avgVolume = candleData.reduce((sum, c) => sum + (c.volume || 0), 0) / candleData.length;
      
      const highVolumeSwings = swingVolumes.filter(vol => vol > avgVolume * 1.2).length;
      const volumeBoost = (highVolumeSwings / swingPoints.length) * 10;
      confidence += Math.min(volumeBoost, 10);
    }
    
    return Math.min(confidence, 95); // Cap at 95%
  }
  
  /**
   * Format swing points for UI display and API response
   * Now supports block mapping to show swings at correct candle positions
   */
  static formatSwingPointsForUI(
    swingPoints: SwingPoint[], 
    candles: CandleData[],
    blockMap?: Array<{startIndex: number, endIndex: number, highIndex: number, lowIndex: number, startTs: number, endTs: number}>
  ) {
    return swingPoints.map((point, index) => {
      let actualCandleIndex = point.index;
      let actualCandle = candles[point.index];
      
      // If we have block mapping, use the actual candle indices from the original data
      if (blockMap && blockMap[point.index]) {
        const blockInfo = blockMap[point.index];
        if (point.type === 'high') {
          actualCandleIndex = blockInfo.highIndex;
          actualCandle = candles[blockInfo.highIndex];
        } else {
          actualCandleIndex = blockInfo.lowIndex;
          actualCandle = candles[blockInfo.lowIndex];
        }
      }
      
      if (!actualCandle) {
        console.warn(`⚠️ Swing point index ${actualCandleIndex} not found in candle data`);
        return null;
      }
      
      return {
        pointNumber: index + 1,
        price: point.price,
        timestamp: actualCandle.timestamp, // Use actual candle timestamp
        relativePrice: point.price, // Will be normalized by UI based on chart range
        relativeTime: actualCandle.timestamp, // Will be normalized by UI based on time range
        label: `${point.type === 'high' ? 'H' : 'L'}${index + 1}`,
        swingType: point.type,
        strength: point.strength,
        candleIndex: actualCandleIndex, // Use actual candle index
        x: actualCandleIndex * 10, // Basic scaling for chart positioning
        y: point.price,
        index: actualCandleIndex,
        type: point.type
      };
    }).filter(Boolean);
  }
}

/**
 * Professional Pattern Recognition Engine
 * Uses swing point relationships to identify classic trading patterns
 */
export class PatternRecognitionEngine {
  
  // Professional pattern definitions using swing point relationships
  private static readonly PATTERN_DEFINITIONS = {
    head_shoulders: {
      name: 'Head & Shoulders',
      relationships: ['LS', 'LP', 'H', 'RP', 'RS'], // Left Shoulder, Left Peak, Head, Right Peak, Right Shoulder
      swingTypes: ['low', 'high', 'high', 'high', 'low'],
      validation: (points: SwingPoint[]) => {
        if (points.length !== 5) return false;
        const [ls, lp, h, rp, rs] = points;
        
        // Head must be highest point
        if (h.price <= lp.price || h.price <= rp.price) return false;
        
        // Shoulders should be at similar levels (within 3%)
        const shoulderTolerance = Math.abs(ls.price - rs.price) / Math.max(ls.price, rs.price);
        if (shoulderTolerance > 0.05) return false; // 5% tolerance
        
        // Peaks should be below head but above shoulders
        if (lp.price <= ls.price || rp.price <= rs.price) return false;
        
        return true;
      },
      confidence: 85
    },
    
    double_top: {
      name: 'Double Top',
      relationships: ['T1', 'V', 'T2'], // Top 1, Valley, Top 2
      swingTypes: ['high', 'low', 'high'],
      validation: (points: SwingPoint[]) => {
        if (points.length !== 3) return false;
        const [t1, v, t2] = points;
        
        // Tops should be at similar levels (within 2%)
        const topTolerance = Math.abs(t1.price - t2.price) / Math.max(t1.price, t2.price);
        if (topTolerance > 0.03) return false; // 3% tolerance
        
        // Valley should be significantly lower than tops
        const valleyDepth = Math.min(t1.price, t2.price) - v.price;
        const minDepthRequired = Math.max(t1.price, t2.price) * 0.02; // 2% minimum depth
        
        return valleyDepth >= minDepthRequired;
      },
      confidence: 80
    },
    
    double_bottom: {
      name: 'Double Bottom',
      relationships: ['B1', 'P', 'B2'], // Bottom 1, Peak, Bottom 2
      swingTypes: ['low', 'high', 'low'],
      validation: (points: SwingPoint[]) => {
        if (points.length !== 3) return false;
        const [b1, p, b2] = points;
        
        // Bottoms should be at similar levels (within 3%)
        const bottomTolerance = Math.abs(b1.price - b2.price) / Math.max(b1.price, b2.price);
        if (bottomTolerance > 0.03) return false;
        
        // Peak should be significantly higher than bottoms
        const peakHeight = p.price - Math.max(b1.price, b2.price);
        const minHeightRequired = Math.min(b1.price, b2.price) * 0.02; // 2% minimum height
        
        return peakHeight >= minHeightRequired;
      },
      confidence: 80
    },
    
    ascending_triangle: {
      name: 'Ascending Triangle',
      relationships: ['L1', 'H1', 'L2', 'H2'], // Higher lows, equal highs
      swingTypes: ['low', 'high', 'low', 'high'],
      validation: (points: SwingPoint[]) => {
        if (points.length !== 4) return false;
        const [l1, h1, l2, h2] = points;
        
        // Highs should be at similar levels (resistance)
        const highTolerance = Math.abs(h1.price - h2.price) / Math.max(h1.price, h2.price);
        if (highTolerance > 0.02) return false; // 2% tolerance
        
        // Second low should be higher than first (ascending support)
        return l2.price > l1.price;
      },
      confidence: 75
    },
    
    descending_triangle: {
      name: 'Descending Triangle',
      relationships: ['H1', 'L1', 'H2', 'L2'], // Lower highs, equal lows
      swingTypes: ['high', 'low', 'high', 'low'],
      validation: (points: SwingPoint[]) => {
        if (points.length !== 4) return false;
        const [h1, l1, h2, l2] = points;
        
        // Lows should be at similar levels (support)
        const lowTolerance = Math.abs(l1.price - l2.price) / Math.max(l1.price, l2.price);
        if (lowTolerance > 0.02) return false; // 2% tolerance
        
        // Second high should be lower than first (descending resistance)
        return h2.price < h1.price;
      },
      confidence: 75
    }
  };
  
  /**
   * Detect all patterns in the given swing points
   */
  static detectPatterns(swingPoints: SwingPoint[], candles: CandleData[]) {
    const detectedPatterns: any[] = [];
    
    for (const [patternKey, definition] of Object.entries(this.PATTERN_DEFINITIONS)) {
      const patterns = this.findPatternInstances(swingPoints, definition, candles);
      
      for (const pattern of patterns) {
        if (pattern.confidence >= 75) { // 75% threshold filter
          detectedPatterns.push({
            type: patternKey,
            name: definition.name,
            points: pattern.points,
            confidence: pattern.confidence,
            timeRange: {
              start: pattern.points[0].timestamp,
              end: pattern.points[pattern.points.length - 1].timestamp
            },
            priceRange: {
              high: Math.max(...pattern.points.map((p: SwingPoint) => p.price)),
              low: Math.min(...pattern.points.map((p: SwingPoint) => p.price))
            }
          });
        }
      }
    }
    
    console.log(`🎯 Pattern Recognition: Found ${detectedPatterns.length} high-confidence patterns (75%+ threshold)`);
    return detectedPatterns;
  }
  
  /**
   * Find instances of a specific pattern
   */
  private static findPatternInstances(
    swingPoints: SwingPoint[], 
    definition: any,
    candles: CandleData[]
  ) {
    const instances: any[] = [];
    const requiredPoints = definition.swingTypes.length;
    
    if (swingPoints.length < requiredPoints) return instances;
    
    // Sliding window through swing points
    for (let i = 0; i <= swingPoints.length - requiredPoints; i++) {
      const window = swingPoints.slice(i, i + requiredPoints);
      
      // Check if swing types match pattern requirement
      const typesMatch = window.every((point, index) => 
        point.type === definition.swingTypes[index]
      );
      
      if (typesMatch && definition.validation(window)) {
        const confidence = SwingPointExtractor.calculatePatternConfidence(
          window, 
          definition.name, 
          candles
        );
        
        instances.push({
          points: window,
          confidence: Math.max(confidence, definition.confidence)
        });
      }
    }
    
    return instances;
  }
}