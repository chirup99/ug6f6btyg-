// import { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

interface HistoricalPatternTrigger {
  id: string;
  date: string;
  timeframe: number;
  symbol: string;
  
  // Pattern Details
  uptrendPattern: PatternExtension | null;
  downtrendPattern: PatternExtension | null;
  
  // 5th Candle Results
  fifthCandleHigh: number;
  fifthCandleLow: number;
  
  // Trigger Analysis
  triggeredPattern: 'uptrend' | 'downtrend' | 'both' | 'none';
  triggerDetails: TriggerDetails;
  
  // Market Context
  marketCondition: string;
  volatility: string;
  volume: number;
  timeOfDay: string;
  
  // Learning Metrics
  confidence: number;
  accuracy: number;
  
  createdAt: Date;
}

interface PatternExtension {
  patternType: '1-3' | '1-4' | '2-3' | '2-4';
  pointA: { price: number; timestamp: number; exactTime: string };
  pointB: { price: number; timestamp: number; exactTime: string };
  slope: number;
  extendedLine: ExtendedLine;
  confidence: number;
}

interface ExtendedLine {
  startPrice: number;
  endPrice: number;
  duration: number;
  equation: string; // y = mx + b format
}

interface TriggerDetails {
  triggerTime: string;
  triggerPrice: number;
  triggerStrength: number; // How far above/below the line
  triggerVolume: number;
  triggerSustainability: boolean; // Did it hold or reverse
  triggerType: 'breakout' | 'breakdown' | 'false_signal';
}

interface PatternSuccessDatabase {
  [timeframe: string]: {
    uptrend: {
      [patternType: string]: {
        triggered: number;
        total: number;
        successRate: number;
        avgTriggerStrength: number;
        avgAccuracy: number;
        recentPerformance: number[];
      };
    };
    downtrend: {
      [patternType: string]: {
        triggered: number;
        total: number;
        successRate: number;
        avgTriggerStrength: number;
        avgAccuracy: number;
        recentPerformance: number[];
      };
    };
  };
}

export class SelfLearningPatternValidator {
  private fyersAPI: FyersAPI;
  private historicalTriggers: HistoricalPatternTrigger[] = [];
  private successDatabase: PatternSuccessDatabase = {};

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * HISTORICAL PATTERN EXTENSION SCANNING
   * Scans historical data and extends pattern lines to validate 5th candle triggers
   */
  async scanHistoricalPatternExtensions(
    symbol: string,
    startDate: string,
    endDate: string,
    timeframes: number[]
  ): Promise<HistoricalPatternTrigger[]> {
    console.log('🔄 [SELF-LEARNING] Starting historical pattern extension scanning');
    console.log(`📅 Date Range: ${startDate} to ${endDate}`);
    console.log(`⏱️ Timeframes: ${timeframes.join(', ')} minutes`);

    const allTriggers: HistoricalPatternTrigger[] = [];

    for (const timeframe of timeframes) {
      console.log(`\n🔍 [TIMEFRAME-${timeframe}min] Scanning historical patterns`);
      
      const timeframeTriggers = await this.scanTimeframePatternExtensions(
        symbol, 
        startDate, 
        endDate, 
        timeframe
      );
      
      allTriggers.push(...timeframeTriggers);
      console.log(`✅ [TIMEFRAME-${timeframe}min] Found ${timeframeTriggers.length} pattern triggers`);
    }

    // Store historical triggers
    this.historicalTriggers = allTriggers;
    
    // Build success database
    this.buildPatternSuccessDatabase();

    console.log(`\n🎯 [SCANNING-COMPLETE] Total triggers found: ${allTriggers.length}`);
    console.log(`📊 [DATABASE-BUILT] Success rates calculated for all patterns`);

    return allTriggers;
  }

  private async scanTimeframePatternExtensions(
    symbol: string,
    startDate: string,
    endDate: string,
    timeframe: number
  ): Promise<HistoricalPatternTrigger[]> {
    const triggers: HistoricalPatternTrigger[] = [];

    try {
      // Get historical data for the timeframe
      const historicalData = await this.fyersAPI.getHistoricalData(
        symbol,
        timeframe.toString(),
        startDate
      );

      if (!historicalData || historicalData.length < 6) {
        console.log(`❌ Insufficient data for ${timeframe}min timeframe`);
        return triggers;
      }

      // Analyze in 6-candle windows
      for (let i = 0; i <= historicalData.length - 6; i++) {
        const sixCandles = historicalData.slice(i, i + 6);
        const fourCandles = sixCandles.slice(0, 4);
        const fifthCandle = sixCandles[4];
        const sixthCandle = sixCandles[5];

        // Perform BATTU analysis on first 4 candles
        const patternAnalysis = await this.performBattuAnalysis(fourCandles, timeframe);

        if (patternAnalysis.uptrend || patternAnalysis.downtrend) {
          // Extend pattern lines to 5th candle
          const trigger = await this.analyzePatternExtension(
            symbol,
            timeframe,
            patternAnalysis,
            fifthCandle,
            sixthCandle,
            startDate
          );

          if (trigger) {
            triggers.push(trigger);
          }
        }
      }

    } catch (error) {
      console.error(`Error scanning ${timeframe}min patterns:`, error);
    }

    return triggers;
  }

  private async performBattuAnalysis(
    fourCandles: any[],
    timeframe: number
  ): Promise<{uptrend: PatternExtension | null, downtrend: PatternExtension | null}> {
    // C1 Block (first 2 candles)
    const c1Block = fourCandles.slice(0, 2);
    // C2 Block (last 2 candles)
    const c2Block = fourCandles.slice(2, 4);

    // Find uptrend pattern (C1 low → C2 high)
    const uptrendPattern = this.findUptrendPatternExtension(c1Block, c2Block, timeframe);
    
    // Find downtrend pattern (C1 high → C2 low)
    const downtrendPattern = this.findDowntrendPatternExtension(c1Block, c2Block, timeframe);

    return {
      uptrend: uptrendPattern,
      downtrend: downtrendPattern
    };
  }

  private findUptrendPatternExtension(
    c1Block: any[],
    c2Block: any[],
    timeframe: number
  ): PatternExtension | null {
    // Find Point A (lowest in C1)
    let pointA: any = null;
    c1Block.forEach((candle, index) => {
      if (!pointA || candle.low < pointA.price) {
        pointA = {
          price: candle.low,
          timestamp: candle.timestamp,
          exactTime: new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN'),
          candleIndex: index + 1
        };
      }
    });

    // Find Point B (highest in C2)
    let pointB: any = null;
    c2Block.forEach((candle, index) => {
      if (!pointB || candle.high > pointB.price) {
        pointB = {
          price: candle.high,
          timestamp: candle.timestamp,
          exactTime: new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN'),
          candleIndex: index + 3
        };
      }
    });

    if (!pointA || !pointB || pointB.price <= pointA.price) {
      return null;
    }

    // Calculate slope and extended line
    const duration = (pointB.timestamp - pointA.timestamp) / 60; // minutes
    const slope = (pointB.price - pointA.price) / duration;
    const patternType = `${pointA.candleIndex}-${pointB.candleIndex}` as '1-3' | '1-4' | '2-3' | '2-4';

    // Extend line to 5th candle (additional timeframe duration)
    const fifthCandleTime = pointB.timestamp + (timeframe * 60); // 1 more timeframe period
    const extendedPrice = pointB.price + (slope * timeframe);

    return {
      patternType,
      pointA,
      pointB,
      slope,
      extendedLine: {
        startPrice: pointB.price,
        endPrice: extendedPrice,
        duration: timeframe,
        equation: `y = ${slope.toFixed(4)}x + ${(pointB.price - slope * pointB.timestamp).toFixed(2)}`
      },
      confidence: this.calculatePatternConfidence(slope, duration, timeframe)
    };
  }

  private findDowntrendPatternExtension(
    c1Block: any[],
    c2Block: any[],
    timeframe: number
  ): PatternExtension | null {
    // Find Point A (highest in C1)
    let pointA: any = null;
    c1Block.forEach((candle, index) => {
      if (!pointA || candle.high > pointA.price) {
        pointA = {
          price: candle.high,
          timestamp: candle.timestamp,
          exactTime: new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN'),
          candleIndex: index + 1
        };
      }
    });

    // Find Point B (lowest in C2)
    let pointB: any = null;
    c2Block.forEach((candle, index) => {
      if (!pointB || candle.low < pointB.price) {
        pointB = {
          price: candle.low,
          timestamp: candle.timestamp,
          exactTime: new Date(candle.timestamp * 1000).toLocaleTimeString('en-IN'),
          candleIndex: index + 3
        };
      }
    });

    if (!pointA || !pointB || pointB.price >= pointA.price) {
      return null;
    }

    // Calculate slope and extended line
    const duration = (pointB.timestamp - pointA.timestamp) / 60; // minutes
    const slope = (pointB.price - pointA.price) / duration; // Will be negative
    const patternType = `${pointA.candleIndex}-${pointB.candleIndex}` as '1-3' | '1-4' | '2-3' | '2-4';

    // Extend line to 5th candle
    const fifthCandleTime = pointB.timestamp + (timeframe * 60);
    const extendedPrice = pointB.price + (slope * timeframe);

    return {
      patternType,
      pointA,
      pointB,
      slope,
      extendedLine: {
        startPrice: pointB.price,
        endPrice: extendedPrice,
        duration: timeframe,
        equation: `y = ${slope.toFixed(4)}x + ${(pointB.price - slope * pointB.timestamp).toFixed(2)}`
      },
      confidence: this.calculatePatternConfidence(Math.abs(slope), duration, timeframe)
    };
  }

  private async analyzePatternExtension(
    symbol: string,
    timeframe: number,
    patternAnalysis: {uptrend: PatternExtension | null, downtrend: PatternExtension | null},
    fifthCandle: any,
    sixthCandle: any,
    date: string
  ): Promise<HistoricalPatternTrigger | null> {
    // Analyze which pattern (if any) was triggered by 5th candle
    let triggeredPattern: 'uptrend' | 'downtrend' | 'both' | 'none' = 'none';
    let triggerDetails: TriggerDetails | null = null;

    // Check uptrend trigger
    const uptrendTriggered = patternAnalysis.uptrend && 
      fifthCandle.high > patternAnalysis.uptrend.extendedLine.endPrice;

    // Check downtrend trigger  
    const downtrendTriggered = patternAnalysis.downtrend && 
      fifthCandle.low < patternAnalysis.downtrend.extendedLine.endPrice;

    if (uptrendTriggered && downtrendTriggered) {
      triggeredPattern = 'both';
    } else if (uptrendTriggered) {
      triggeredPattern = 'uptrend';
      triggerDetails = this.calculateTriggerDetails(
        patternAnalysis.uptrend!,
        fifthCandle,
        'breakout'
      );
    } else if (downtrendTriggered) {
      triggeredPattern = 'downtrend';
      triggerDetails = this.calculateTriggerDetails(
        patternAnalysis.downtrend!,
        fifthCandle,
        'breakdown'
      );
    }

    // Only save if there was a trigger
    if (triggeredPattern === 'none') {
      return null;
    }

    // Create historical trigger record
    const trigger: HistoricalPatternTrigger = {
      id: `${symbol}_${timeframe}min_${date}_${Date.now()}`,
      date,
      timeframe,
      symbol,
      uptrendPattern: patternAnalysis.uptrend,
      downtrendPattern: patternAnalysis.downtrend,
      fifthCandleHigh: fifthCandle.high,
      fifthCandleLow: fifthCandle.low,
      triggeredPattern,
      triggerDetails: triggerDetails || this.getDefaultTriggerDetails(),
      marketCondition: this.analyzeMarketCondition(fifthCandle, sixthCandle),
      volatility: this.calculateVolatility(fifthCandle),
      volume: fifthCandle.volume || 0,
      timeOfDay: new Date(fifthCandle.timestamp * 1000).toLocaleTimeString('en-IN'),
      confidence: this.calculateOverallConfidence(patternAnalysis, triggeredPattern),
      accuracy: this.calculateAccuracy(patternAnalysis, fifthCandle, triggeredPattern),
      createdAt: new Date()
    };

    console.log(`✅ [TRIGGER-FOUND] ${timeframe}min ${triggeredPattern} pattern triggered`);
    console.log(`   Pattern: ${triggeredPattern === 'uptrend' ? patternAnalysis.uptrend?.patternType : patternAnalysis.downtrend?.patternType}`);
    console.log(`   Trigger Price: ${triggerDetails?.triggerPrice || 'N/A'}`);
    console.log(`   Accuracy: ${trigger.accuracy.toFixed(1)}%`);

    return trigger;
  }

  private calculateTriggerDetails(
    pattern: PatternExtension,
    fifthCandle: any,
    triggerType: 'breakout' | 'breakdown'
  ): TriggerDetails {
    const triggerPrice = triggerType === 'breakout' ? fifthCandle.high : fifthCandle.low;
    const expectedPrice = pattern.extendedLine.endPrice;
    const triggerStrength = Math.abs(triggerPrice - expectedPrice);

    return {
      triggerTime: new Date(fifthCandle.timestamp * 1000).toLocaleTimeString('en-IN'),
      triggerPrice,
      triggerStrength,
      triggerVolume: fifthCandle.volume || 0,
      triggerSustainability: triggerStrength > 5, // Basic sustainability check
      triggerType: triggerStrength > 10 ? triggerType : 'false_signal'
    };
  }

  private buildPatternSuccessDatabase(): void {
    console.log('🏗️ [DATABASE-BUILD] Building pattern success database from historical triggers');

    this.successDatabase = {};

    this.historicalTriggers.forEach(trigger => {
      const tf = trigger.timeframe.toString();
      
      if (!this.successDatabase[tf]) {
        this.successDatabase[tf] = {
          uptrend: {},
          downtrend: {}
        };
      }

      // Process uptrend pattern
      if (trigger.uptrendPattern) {
        const patternType = trigger.uptrendPattern.patternType;
        if (!this.successDatabase[tf].uptrend[patternType]) {
          this.successDatabase[tf].uptrend[patternType] = {
            triggered: 0,
            total: 0,
            successRate: 0,
            avgTriggerStrength: 0,
            avgAccuracy: 0,
            recentPerformance: []
          };
        }

        const stats = this.successDatabase[tf].uptrend[patternType];
        stats.total++;
        
        if (trigger.triggeredPattern === 'uptrend' || trigger.triggeredPattern === 'both') {
          stats.triggered++;
        }

        stats.avgAccuracy = ((stats.avgAccuracy * (stats.total - 1)) + trigger.accuracy) / stats.total;
        stats.successRate = (stats.triggered / stats.total) * 100;
        stats.recentPerformance.push(trigger.accuracy);
        
        // Keep only last 20 performances
        if (stats.recentPerformance.length > 20) {
          stats.recentPerformance.shift();
        }
      }

      // Process downtrend pattern
      if (trigger.downtrendPattern) {
        const patternType = trigger.downtrendPattern.patternType;
        if (!this.successDatabase[tf].downtrend[patternType]) {
          this.successDatabase[tf].downtrend[patternType] = {
            triggered: 0,
            total: 0,
            successRate: 0,
            avgTriggerStrength: 0,
            avgAccuracy: 0,
            recentPerformance: []
          };
        }

        const stats = this.successDatabase[tf].downtrend[patternType];
        stats.total++;
        
        if (trigger.triggeredPattern === 'downtrend' || trigger.triggeredPattern === 'both') {
          stats.triggered++;
        }

        stats.avgAccuracy = ((stats.avgAccuracy * (stats.total - 1)) + trigger.accuracy) / stats.total;
        stats.successRate = (stats.triggered / stats.total) * 100;
        stats.recentPerformance.push(trigger.accuracy);
        
        if (stats.recentPerformance.length > 20) {
          stats.recentPerformance.shift();
        }
      }
    });

    console.log('✅ [DATABASE-COMPLETE] Pattern success database built successfully');
    this.logSuccessRatesSummary();
  }

  /**
   * USE HISTORICAL DATA FOR LIVE PATTERN SELECTION
   * Compare current recursive analysis patterns with historical success rates
   */
  selectOptimalPatternUsingHistoricalData(
    currentPatterns: any[],
    timeframe: number
  ): any {
    console.log('🎯 [PATTERN-SELECTION] Using historical data for optimal pattern selection');

    if (!this.successDatabase[timeframe.toString()]) {
      console.log('❌ No historical data available for this timeframe');
      return this.fallbackPatternSelection(currentPatterns);
    }

    const scoredPatterns = currentPatterns.map(pattern => {
      const historicalStats = this.getHistoricalStats(pattern, timeframe);
      const historicalScore = this.calculateHistoricalScore(historicalStats);
      const currentScore = this.calculateCurrentPatternScore(pattern);
      
      const combinedScore = (historicalScore * 0.6) + (currentScore * 0.4);

      return {
        ...pattern,
        historicalStats,
        historicalScore,
        currentScore,
        combinedScore
      };
    });

    // Select pattern with highest combined score
    const selectedPattern = scoredPatterns.reduce((best, current) => 
      current.combinedScore > best.combinedScore ? current : best
    );

    console.log(`✅ [SELECTION-COMPLETE] Selected pattern with ${selectedPattern.combinedScore.toFixed(1)} combined score`);
    console.log(`   Historical success rate: ${selectedPattern.historicalStats?.successRate || 0}%`);
    console.log(`   Pattern type: ${selectedPattern.patternType}`);

    return selectedPattern;
  }

  private getHistoricalStats(pattern: any, timeframe: number): any {
    const tf = timeframe.toString();
    const direction = pattern.slope > 0 ? 'uptrend' : 'downtrend';
    const patternType = pattern.patternLabel || pattern.patternType;

    return this.successDatabase[tf]?.[direction]?.[patternType] || null;
  }

  private calculateHistoricalScore(stats: any): number {
    if (!stats) return 50; // Default score if no historical data

    return (stats.successRate * 0.5) + (stats.avgAccuracy * 0.3) + (stats.triggered * 0.2);
  }

  private calculateCurrentPatternScore(pattern: any): number {
    return pattern.confidence || 50;
  }

  private fallbackPatternSelection(patterns: any[]): any {
    return patterns.reduce((best, current) => 
      (current.confidence || 0) > (best.confidence || 0) ? current : best
    );
  }

  // Helper methods
  private calculatePatternConfidence(slope: number, duration: number, timeframe: number): number {
    let confidence = 50;
    if (Math.abs(slope) >= 3) confidence += 30;
    else if (Math.abs(slope) >= 2) confidence += 20;
    else if (Math.abs(slope) >= 1) confidence += 10;

    if (duration >= 10 && duration <= 30) confidence += 20;
    return Math.min(confidence, 95);
  }

  private analyzeMarketCondition(fifthCandle: any, sixthCandle: any): string {
    if (sixthCandle.close > fifthCandle.close) return 'bullish';
    if (sixthCandle.close < fifthCandle.close) return 'bearish';
    return 'sideways';
  }

  private calculateVolatility(candle: any): string {
    const range = candle.high - candle.low;
    const percentage = (range / candle.open) * 100;
    if (percentage > 2) return 'high';
    if (percentage > 1) return 'medium';
    return 'low';
  }

  private calculateOverallConfidence(
    patterns: {uptrend: PatternExtension | null, downtrend: PatternExtension | null},
    triggered: string
  ): number {
    if (triggered === 'uptrend') return patterns.uptrend?.confidence || 50;
    if (triggered === 'downtrend') return patterns.downtrend?.confidence || 50;
    if (triggered === 'both') {
      return ((patterns.uptrend?.confidence || 50) + (patterns.downtrend?.confidence || 50)) / 2;
    }
    return 30; // Low confidence for no trigger
  }

  private calculateAccuracy(
    patterns: {uptrend: PatternExtension | null, downtrend: PatternExtension | null},
    fifthCandle: any,
    triggered: string
  ): number {
    if (triggered === 'uptrend' && patterns.uptrend) {
      const predicted = patterns.uptrend.extendedLine.endPrice;
      const actual = fifthCandle.high;
      return Math.max(0, 100 - (Math.abs(predicted - actual) / actual * 100));
    }
    if (triggered === 'downtrend' && patterns.downtrend) {
      const predicted = patterns.downtrend.extendedLine.endPrice;
      const actual = fifthCandle.low;
      return Math.max(0, 100 - (Math.abs(predicted - actual) / actual * 100));
    }
    return 0;
  }

  private getDefaultTriggerDetails(): TriggerDetails {
    return {
      triggerTime: 'N/A',
      triggerPrice: 0,
      triggerStrength: 0,
      triggerVolume: 0,
      triggerSustainability: false,
      triggerType: 'false_signal'
    };
  }

  private logSuccessRatesSummary(): void {
    console.log('\n📊 [SUCCESS-RATES-SUMMARY] Historical Pattern Performance:');
    
    Object.keys(this.successDatabase).forEach(timeframe => {
      console.log(`\n⏱️ ${timeframe}min Timeframe:`);
      
      // Uptrend patterns
      console.log('   📈 Uptrend Patterns:');
      Object.entries(this.successDatabase[timeframe].uptrend).forEach(([pattern, stats]) => {
        console.log(`      ${pattern}: ${stats.successRate.toFixed(1)}% (${stats.triggered}/${stats.total})`);
      });
      
      // Downtrend patterns
      console.log('   📉 Downtrend Patterns:');
      Object.entries(this.successDatabase[timeframe].downtrend).forEach(([pattern, stats]) => {
        console.log(`      ${pattern}: ${stats.successRate.toFixed(1)}% (${stats.triggered}/${stats.total})`);
      });
    });
  }

  // Public getters
  getHistoricalTriggers(): HistoricalPatternTrigger[] {
    return this.historicalTriggers;
  }

  getSuccessDatabase(): PatternSuccessDatabase {
    return this.successDatabase;
  }

  getPatternSuccessRate(timeframe: number, direction: 'uptrend' | 'downtrend', patternType: string): number {
    return this.successDatabase[timeframe.toString()]?.[direction]?.[patternType]?.successRate || 0;
  }
}