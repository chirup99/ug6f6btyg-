/**
 * Professional Pattern Detection API
 * Uses swing point extraction and proper pattern recognition
 */

import { Request, Response } from 'express';
import { SwingPointExtractor, PatternRecognitionEngine, CandleData } from '../swing-point-extractor';

interface PatternDetectionRequest {
  symbol: string;
  candles: any[]; // Accept both tuple and object formats
  timeframe: string;
  patterns: string[]; // Specific patterns to detect, empty for all
  relationships?: string[]; // NEW: Relationship-based detection like ["1<2", "2>3", "3<4"]
  tolerancePercent?: number; // NEW: Tolerance for relationship matching (default 3%)
  blockMode?: 'minutes' | 'count'; // NEW: Block aggregation mode 
  blockSize?: number; // NEW: Block size (minutes or candle count)
  minConfidence?: number; // Default 75%
}

/**
 * Convert various candle formats to standardized CandleData format
 */
function standardizeCandleData(candles: any[]): CandleData[] {
  if (!candles || candles.length === 0) return [];
  
  return candles.map((candle) => {
    // Handle tuple format: [timestamp, open, high, low, close, volume]
    if (Array.isArray(candle)) {
      return {
        timestamp: candle[0],
        open: candle[1],
        high: candle[2], 
        low: candle[3],
        close: candle[4],
        volume: candle[5] || 0
      };
    }
    
    // Handle object format with time/price properties
    if (candle.time !== undefined && candle.price !== undefined) {
      return {
        timestamp: candle.time,
        open: candle.price,
        high: candle.price,
        low: candle.price, 
        close: candle.price,
        volume: candle.volume || 0
      };
    }
    
    // Handle standard OHLC object format
    return {
      timestamp: candle.timestamp || candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume || 0
    };
  });
}

/**
 * Main pattern detection endpoint
 */
export async function detectPatterns(req: Request, res: Response) {
  try {
    const {
      symbol,
      candles: rawCandles,
      timeframe,
      patterns = [], // Empty array means detect all patterns
      relationships = [], // NEW: Relationship-based detection
      tolerancePercent = 3.0, // NEW: Default 3% tolerance
      blockMode = 'minutes', // NEW: Default to time-based blocks
      blockSize, // NEW: Will be auto-determined if not provided
      minConfidence = 75
    }: PatternDetectionRequest = req.body;

    // Validate input
    if (!symbol || !rawCandles || !Array.isArray(rawCandles) || rawCandles.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input: symbol and candles array (minimum 10 candles) required'
      });
    }

    console.log(`🔍 Pattern Detection Request: ${symbol} - ${rawCandles.length} candles - ${timeframe} timeframe`);

    // Step 1: Standardize candle data format
    const standardizedCandles = standardizeCandleData(rawCandles);
    
    if (standardizedCandles.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data after standardization - minimum 10 valid OHLC candles required'
      });
    }

    console.log(`📊 Standardized ${rawCandles.length} raw candles → ${standardizedCandles.length} OHLC candles`);

    // Step 2: Extract Swing Points using ZigZag algorithm (restored working trendline logic)
    console.log(`🎯 Using ZigZag swing point extraction for proper trendline detection with numbered points`);
    
    const minDeviationPercent = 2.0; // 2% minimum deviation for swing points
    const lookbackPeriod = 5; // 5-bar confirmation period
    
    const swingPoints = SwingPointExtractor.extractSwingPoints(
      standardizedCandles,
      minDeviationPercent,
      lookbackPeriod
    );

    if (swingPoints.length < 3) {
      return res.status(400).json({
        success: false,
        error: `Insufficient swing points detected (${swingPoints.length}). Need at least 3 swing points for trendline pattern recognition.`,
        swingPointsFound: swingPoints.length,
        totalCandles: standardizedCandles.length,
        detectionMethod: 'ZigZag Swing Points'
      });
    }

    console.log(`🎯 ZigZag Swing Extraction: ${standardizedCandles.length} candles → ${swingPoints.length} numbered swing points`);

    // Step 5: Detect patterns - Choose between relationship-based or classic pattern detection
    let detectedPatterns: any[] = [];
    
    if (relationships.length > 0) {
      // NEW: Use relationship-based detection (e.g., ["1<2", "2>3", "3<4"])
      console.log(`🔍 Using relationship-based detection with patterns: ${relationships.join(', ')}`);
      
      const swingPatternWindows = SwingPointExtractor.findSwingPattern(
        swingPoints,
        relationships,
        tolerancePercent
      );
      
      console.log(`🎯 Found ${swingPatternWindows.length} relationship-based pattern matches`);
      
      // Convert swing pattern windows to detectedPatterns format
      detectedPatterns = swingPatternWindows.map((window, index) => {
        const confidence = SwingPointExtractor.calculatePatternConfidence(
          window,
          'relationship_sequence',
          standardizedCandles
        );
        
        return {
          type: 'relationship_sequence',
          points: window,
          confidence: confidence,
          priceRange: {
            high: Math.max(...window.map(p => p.price)),
            low: Math.min(...window.map(p => p.price))
          },
          timeRange: {
            start: window[0].timestamp,
            end: window[window.length - 1].timestamp
          },
          relationships: relationships,
          toleranceUsed: tolerancePercent
        };
      });
    } else {
      // Classic pattern detection using PatternRecognitionEngine
      console.log(`🔍 Using classic pattern detection for ${patterns.length || 'all'} pattern types`);
      detectedPatterns = PatternRecognitionEngine.detectPatterns(
        swingPoints,
        standardizedCandles
      );
    }

    // Step 6: Apply confidence threshold filtering
    const filteredPatterns = detectedPatterns.filter(pattern => 
      pattern.confidence >= minConfidence
    );

    // Step 7: Format response for UI consumption with support/resistance mapping
    const formattedPatterns = filteredPatterns.map(pattern => ({
      ...pattern,
      points: SwingPointExtractor.formatSwingPointsForUI(pattern.points, standardizedCandles),
      rays: generatePatternRays(pattern),
      metadata: {
        totalPoints: pattern.points.length,
        priceRange: pattern.priceRange.high - pattern.priceRange.low,
        timeRange: pattern.timeRange.end - pattern.timeRange.start,
        volatility: calculateVolatility(pattern.points),
        avgSlope: calculateAverageSlope(pattern.points),
        symbol,
        timeframe: timeframe || 'unknown',
        dateCreated: new Date().toISOString()
      }
    }));

    const response = {
      success: true,
      symbol,
      timeframe,
      totalCandles: standardizedCandles.length,
      swingPointsExtracted: swingPoints.length,
      patternsDetected: detectedPatterns.length,
      patternsAfterFiltering: filteredPatterns.length,
      minConfidence,
      patterns: formattedPatterns,
      swingPoints: SwingPointExtractor.formatSwingPointsForUI(swingPoints, standardizedCandles),
      analysisMetadata: {
        detectionMethod: 'ZigZag Swing Points',
        minDeviationPercent,
        lookbackPeriod,
        swingPointsExtracted: swingPoints.length,
        candlesToSwingPoints: `${standardizedCandles.length} candles → ${swingPoints.length} swing points`,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`✅ Pattern Detection Complete: ${filteredPatterns.length} patterns found above ${minConfidence}% confidence`);
    
    res.json(response);

  } catch (error) {
    console.error('❌ Pattern Detection Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during pattern detection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate pattern-specific rays (support/resistance, targets, stop losses)
 */
function generatePatternRays(pattern: any) {
  const rays: any = {};
  const { points, type } = pattern;
  
  if (!points || points.length === 0) return rays;

  switch (type) {
    case 'head_shoulders':
      // Neckline connecting the two troughs
      if (points.length >= 5) {
        const leftTrough = points[0]; // LS
        const rightTrough = points[4]; // RS
        rays.neckline = {
          price: (leftTrough.price + rightTrough.price) / 2,
          relativePrice: (leftTrough.price + rightTrough.price) / 2,
          color: '#8b5cf6'
        };
        rays.target = {
          price: rays.neckline.price - (points[2].price - rays.neckline.price), // Head height below neckline
          relativePrice: rays.neckline.price - (points[2].price - rays.neckline.price),
          color: '#10b981'
        };
      }
      break;

    case 'double_top':
      if (points.length >= 3) {
        const valley = points[1]; // Middle valley
        rays.support = {
          price: valley.price,
          relativePrice: valley.price,
          color: '#10b981'
        };
        const peakHeight = Math.max(points[0].price, points[2].price) - valley.price;
        rays.target = {
          price: valley.price - peakHeight,
          relativePrice: valley.price - peakHeight,
          color: '#ef4444'
        };
      }
      break;

    case 'double_bottom':
      if (points.length >= 3) {
        const peak = points[1]; // Middle peak
        rays.resistance = {
          price: peak.price,
          relativePrice: peak.price,
          color: '#ef4444'
        };
        const valleyDepth = peak.price - Math.min(points[0].price, points[2].price);
        rays.target = {
          price: peak.price + valleyDepth,
          relativePrice: peak.price + valleyDepth,
          color: '#10b981'
        };
      }
      break;

    case 'ascending_triangle':
      if (points.length >= 4) {
        const resistance = Math.max(points[1].price, points[3].price);
        rays.resistance = {
          price: resistance,
          relativePrice: resistance,
          color: '#ef4444'
        };
        rays.target = {
          price: resistance + (resistance - Math.min(points[0].price, points[2].price)),
          relativePrice: resistance + (resistance - Math.min(points[0].price, points[2].price)),
          color: '#10b981'
        };
      }
      break;

    case 'descending_triangle':
      if (points.length >= 4) {
        const support = Math.min(points[1].price, points[3].price);
        rays.support = {
          price: support,
          relativePrice: support,
          color: '#10b981'
        };
        rays.target = {
          price: support - (Math.max(points[0].price, points[2].price) - support),
          relativePrice: support - (Math.max(points[0].price, points[2].price) - support),
          color: '#ef4444'
        };
      }
      break;
  }

  return rays;
}

/**
 * Calculate volatility of swing points
 */
function calculateVolatility(points: any[]): number {
  if (points.length < 2) return 0;
  
  const prices = points.map(p => p.price);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance) / avgPrice * 100; // As percentage
  
  return Math.round(volatility * 100) / 100;
}

/**
 * Calculate average slope between swing points
 */
function calculateAverageSlope(points: any[]): number {
  if (points.length < 2) return 0;
  
  let totalSlope = 0;
  let slopeCount = 0;
  
  for (let i = 1; i < points.length; i++) {
    const timeDiff = points[i].timestamp - points[i-1].timestamp;
    const priceDiff = points[i].price - points[i-1].price;
    
    if (timeDiff > 0) {
      totalSlope += priceDiff / timeDiff;
      slopeCount++;
    }
  }
  
  return slopeCount > 0 ? Math.round((totalSlope / slopeCount) * 10000) / 10000 : 0;
}