// import { fyersApi } from './fyers-api'; // Removed: Fyers API removed
import { CorrectedSlopeCalculator } from './corrected-slope-calculator';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BacktestConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  timeframe: number; // 5 for 5-minute candles
  testType: 'rolling' | 'session' | 'pattern';
  minAccuracy: number; // Target accuracy percentage
  enableLogging: boolean;
}

interface BacktestResult {
  totalTests: number;
  successfulPredictions: number;
  accuracyPercentage: number;
  avgPriceError: number;
  avgDirectionAccuracy: number;
  patternPerformance: {
    [key: string]: {
      tested: number;
      successful: number;
      accuracy: number;
    };
  };
  bestPerformingPatterns: string[];
  recommendations: string[];
}

interface PredictionTest {
  testId: string;
  c1Block: CandleData[];
  c2Block: CandleData[];
  actualC3Block: CandleData[];
  predictedC3Block: {
    c3a: CandleData;
    c3b: CandleData;
  };
  accuracy: {
    priceAccuracy: number;
    directionAccuracy: number;
    overallScore: number;
  };
  patternType: string;
  successful: boolean;
}

export class BattuBacktestEngine {
  private config: BacktestConfig;
  private testResults: PredictionTest[] = [];

  constructor(config: BacktestConfig) {
    this.config = config;
  }

  /**
   * Main backtesting function - easy to modify rules here
   */
  async runBacktest(): Promise<BacktestResult> {
    console.log(`🔄 BACKTEST STARTING: ${this.config.symbol} from ${this.config.startDate} to ${this.config.endDate}`);
    
    // Get historical data for the date range
    const historicalData = await this.fetchHistoricalData();
    
    if (historicalData.length < 6) {
      throw new Error('Insufficient historical data for backtesting (need at least 6 candles)');
    }

    // Run different test types based on configuration
    switch (this.config.testType) {
      case 'rolling':
        await this.runRollingWindowTest(historicalData);
        break;
      case 'session':
        await this.runSessionBasedTest(historicalData);
        break;
      case 'pattern':
        await this.runPatternSpecificTest(historicalData);
        break;
    }

    // Calculate and return results
    return this.calculateResults();
  }

  /**
   * Fetch historical data for backtesting
   */
  private async fetchHistoricalData(): Promise<CandleData[]> {
    try {
      const response = await fyersApi.getHistoricalData(
        this.config.symbol,
        this.config.timeframe.toString(),
        this.config.startDate,
        this.config.endDate
      );

      // Handle response structure
      const candleData = Array.isArray(response) ? response : response.candles || [];
      
      return candleData.map((candle: any) => ({
        timestamp: Array.isArray(candle) ? candle[0] : candle.timestamp,
        open: Array.isArray(candle) ? candle[1] : candle.open,
        high: Array.isArray(candle) ? candle[2] : candle.high,
        low: Array.isArray(candle) ? candle[3] : candle.low,
        close: Array.isArray(candle) ? candle[4] : candle.close,
        volume: Array.isArray(candle) ? candle[5] : (candle.volume || 0)
      }));
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
      throw error;
    }
  }

  /**
   * Rolling window test - most common backtesting approach
   * EASY TO MODIFY: Change window size, step size, validation rules
   */
  private async runRollingWindowTest(data: CandleData[]): Promise<void> {
    const windowSize = 6; // C1(2) + C2(2) + C3(2) = 6 candles
    const stepSize = 2; // Move 2 candles forward each test (configurable)

    for (let i = 0; i <= data.length - windowSize; i += stepSize) {
      const testWindow = data.slice(i, i + windowSize);
      
      // EASY TO MODIFY: Block formation rules
      const c1Block = testWindow.slice(0, 2); // First 2 candles
      const c2Block = testWindow.slice(2, 4); // Next 2 candles
      const actualC3Block = testWindow.slice(4, 6); // Last 2 candles (actual)

      // Predict C3 using C1 + C2
      const prediction = await this.predictC3Block(c1Block, c2Block);
      
      // Validate prediction against actual
      const accuracy = this.validatePrediction(prediction, actualC3Block);
      
      // Store test result
      this.testResults.push({
        testId: `rolling_${i}`,
        c1Block,
        c2Block,
        actualC3Block,
        predictedC3Block: prediction,
        accuracy,
        patternType: await this.identifyPattern(c1Block, c2Block),
        successful: accuracy.overallScore >= this.config.minAccuracy
      });

      if (this.config.enableLogging) {
        console.log(`📊 Test ${i}: ${accuracy.overallScore.toFixed(1)}% accuracy - ${accuracy.overallScore >= this.config.minAccuracy ? '✅ PASS' : '❌ FAIL'}`);
      }
    }
  }

  /**
   * Session-based test - test different market sessions
   * EASY TO MODIFY: Session times, session logic
   */
  private async runSessionBasedTest(data: CandleData[]): Promise<void> {
    // EASY TO MODIFY: Define market sessions
    const sessions = [
      { name: 'Morning', start: 9.25, end: 11.0 }, // 9:15 AM - 11:00 AM
      { name: 'Midday', start: 11.0, end: 13.0 },  // 11:00 AM - 1:00 PM
      { name: 'Afternoon', start: 13.0, end: 15.5 } // 1:00 PM - 3:30 PM
    ];

    for (const session of sessions) {
      const sessionData = this.filterDataBySession(data, session.start, session.end);
      
      if (sessionData.length >= 6) {
        // Run rolling test within this session
        const originalData = [...data];
        await this.runRollingWindowTest(sessionData);
        
        // Tag results with session info
        this.testResults.forEach(result => {
          if (!result.testId.includes('session')) {
            result.testId = `${session.name.toLowerCase()}_${result.testId}`;
          }
        });
      }
    }
  }

  /**
   * Pattern-specific test - test each pattern type separately
   * EASY TO MODIFY: Pattern definitions, pattern logic
   */
  private async runPatternSpecificTest(data: CandleData[]): Promise<void> {
    // EASY TO MODIFY: Define which patterns to test
    const patternsToTest = ['1-3', '1-4', '2-3', '2-4'];
    
    for (const targetPattern of patternsToTest) {
      console.log(`🎯 Testing pattern: ${targetPattern}`);
      
      for (let i = 0; i <= data.length - 6; i += 1) {
        const testWindow = data.slice(i, i + 6);
        const c1Block = testWindow.slice(0, 2);
        const c2Block = testWindow.slice(2, 4);
        const actualC3Block = testWindow.slice(4, 6);

        const detectedPattern = await this.identifyPattern(c1Block, c2Block);
        
        // Only test if this matches our target pattern
        if (detectedPattern === targetPattern) {
          const prediction = await this.predictC3Block(c1Block, c2Block);
          const accuracy = this.validatePrediction(prediction, actualC3Block);
          
          this.testResults.push({
            testId: `pattern_${targetPattern}_${i}`,
            c1Block,
            c2Block,
            actualC3Block,
            predictedC3Block: prediction,
            accuracy,
            patternType: targetPattern,
            successful: accuracy.overallScore >= this.config.minAccuracy
          });
        }
      }
    }
  }

  /**
   * Predict C3 block using C1 + C2 patterns
   * EASY TO MODIFY: Prediction logic, momentum calculations
   */
  private async predictC3Block(c1Block: CandleData[], c2Block: CandleData[]): Promise<{c3a: CandleData, c3b: CandleData}> {
    // EASY TO MODIFY: Momentum calculation method
    const c1Momentum = this.calculateBlockMomentum(c1Block);
    const c2Momentum = this.calculateBlockMomentum(c2Block);
    
    // EASY TO MODIFY: Trend detection logic
    const trendDirection = c2Momentum > c1Momentum ? 'uptrend' : 'downtrend';
    const momentumStrength = Math.abs(c2Momentum - c1Momentum);
    
    // EASY TO MODIFY: C3a prediction formula
    const lastC2Candle = c2Block[c2Block.length - 1];
    const avgMomentum = (c1Momentum + c2Momentum) / 2;
    const trendMultiplier = trendDirection === 'uptrend' ? 1.1 : 0.9;
    
    // Predict C3a
    const c3aOpen = lastC2Candle.close;
    const c3aClose = c3aOpen + (avgMomentum * trendMultiplier);
    const c3aHigh = Math.max(c3aOpen, c3aClose) + (momentumStrength * 0.5);
    const c3aLow = Math.min(c3aOpen, c3aClose) - (momentumStrength * 0.3);
    
    // Predict C3b (EASY TO MODIFY: C3b prediction formula)
    const c3bOpen = c3aClose;
    const decayFactor = 0.8; // Momentum decay
    const c3bClose = c3bOpen + (avgMomentum * trendMultiplier * decayFactor);
    const c3bHigh = Math.max(c3bOpen, c3bClose) + (momentumStrength * 0.4);
    const c3bLow = Math.min(c3bOpen, c3bClose) - (momentumStrength * 0.2);

    return {
      c3a: {
        timestamp: lastC2Candle.timestamp + (this.config.timeframe * 60),
        open: Math.round(c3aOpen * 100) / 100,
        high: Math.round(c3aHigh * 100) / 100,
        low: Math.round(c3aLow * 100) / 100,
        close: Math.round(c3aClose * 100) / 100,
        volume: 0
      },
      c3b: {
        timestamp: lastC2Candle.timestamp + (this.config.timeframe * 60 * 2),
        open: Math.round(c3bOpen * 100) / 100,
        high: Math.round(c3bHigh * 100) / 100,
        low: Math.round(c3bLow * 100) / 100,
        close: Math.round(c3bClose * 100) / 100,
        volume: 0
      }
    };
  }

  /**
   * Validate prediction accuracy
   * EASY TO MODIFY: Accuracy calculation methods, thresholds
   */
  private validatePrediction(
    predicted: {c3a: CandleData, c3b: CandleData}, 
    actual: CandleData[]
  ): {priceAccuracy: number, directionAccuracy: number, overallScore: number} {
    
    const actualC3a = actual[0];
    const actualC3b = actual[1];
    
    // EASY TO MODIFY: Price accuracy calculation
    const c3aPriceError = Math.abs(predicted.c3a.close - actualC3a.close) / actualC3a.close * 100;
    const c3bPriceError = Math.abs(predicted.c3b.close - actualC3b.close) / actualC3b.close * 100;
    const avgPriceError = (c3aPriceError + c3bPriceError) / 2;
    const priceAccuracy = Math.max(0, 100 - avgPriceError);
    
    // EASY TO MODIFY: Direction accuracy calculation
    const predictedDirection = predicted.c3b.close > predicted.c3a.close ? 'up' : 'down';
    const actualDirection = actualC3b.close > actualC3a.close ? 'up' : 'down';
    const directionAccuracy = predictedDirection === actualDirection ? 100 : 0;
    
    // EASY TO MODIFY: Overall scoring formula
    const overallScore = (priceAccuracy * 0.6) + (directionAccuracy * 0.4);
    
    return {
      priceAccuracy: Math.round(priceAccuracy * 100) / 100,
      directionAccuracy,
      overallScore: Math.round(overallScore * 100) / 100
    };
  }

  /**
   * Calculate block momentum
   * EASY TO MODIFY: Momentum calculation formula
   */
  private calculateBlockMomentum(block: CandleData[]): number {
    const firstCandle = block[0];
    const lastCandle = block[block.length - 1];
    
    // EASY TO MODIFY: Momentum formula
    const priceChange = lastCandle.close - firstCandle.open;
    const timespan = block.length * this.config.timeframe; // minutes
    
    return priceChange / timespan; // Points per minute
  }

  /**
   * Identify pattern type from C1 + C2 blocks
   * EASY TO MODIFY: Pattern identification logic
   */
  private async identifyPattern(c1Block: CandleData[], c2Block: CandleData[]): Promise<string> {
    // EASY TO MODIFY: Pattern detection rules
    const c1High = Math.max(...c1Block.map(c => c.high));
    const c1Low = Math.min(...c1Block.map(c => c.low));
    const c2High = Math.max(...c2Block.map(c => c.high));
    const c2Low = Math.min(...c2Block.map(c => c.low));
    
    // Simple pattern classification (EASY TO MODIFY)
    if (c2High > c1High && c2Low > c1Low) return '1-4'; // Uptrend
    if (c2High < c1High && c2Low < c1Low) return '1-3'; // Downtrend
    if (c2High > c1High && c2Low < c1Low) return '2-4'; // High volatility
    return '2-3'; // Sideways/consolidation
  }

  /**
   * Filter data by market session
   * EASY TO MODIFY: Session filtering logic
   */
  private filterDataBySession(data: CandleData[], startHour: number, endHour: number): CandleData[] {
    return data.filter(candle => {
      const date = new Date(candle.timestamp * 1000);
      const hour = date.getHours() + (date.getMinutes() / 60);
      return hour >= startHour && hour <= endHour;
    });
  }

  /**
   * Calculate final backtest results
   * EASY TO MODIFY: Result calculations, reporting
   */
  private calculateResults(): BacktestResult {
    const totalTests = this.testResults.length;
    const successfulPredictions = this.testResults.filter(r => r.successful).length;
    const accuracyPercentage = (successfulPredictions / totalTests) * 100;
    
    // Calculate pattern performance
    const patternPerformance: {[key: string]: any} = {};
    const patterns = Array.from(new Set(this.testResults.map(r => r.patternType)));
    
    patterns.forEach(pattern => {
      const patternTests = this.testResults.filter(r => r.patternType === pattern);
      const patternSuccesses = patternTests.filter(r => r.successful).length;
      
      patternPerformance[pattern] = {
        tested: patternTests.length,
        successful: patternSuccesses,
        accuracy: patternTests.length > 0 ? (patternSuccesses / patternTests.length) * 100 : 0
      };
    });

    // Calculate averages
    const avgPriceError = this.testResults.reduce((sum, r) => sum + (100 - r.accuracy.priceAccuracy), 0) / totalTests;
    const avgDirectionAccuracy = this.testResults.reduce((sum, r) => sum + r.accuracy.directionAccuracy, 0) / totalTests;

    // Best performing patterns
    const bestPerformingPatterns = patterns
      .sort((a, b) => patternPerformance[b].accuracy - patternPerformance[a].accuracy)
      .slice(0, 2);

    // Generate recommendations (EASY TO MODIFY)
    const recommendations = this.generateRecommendations(accuracyPercentage, patternPerformance, bestPerformingPatterns);

    return {
      totalTests,
      successfulPredictions,
      accuracyPercentage: Math.round(accuracyPercentage * 100) / 100,
      avgPriceError: Math.round(avgPriceError * 100) / 100,
      avgDirectionAccuracy: Math.round(avgDirectionAccuracy * 100) / 100,
      patternPerformance,
      bestPerformingPatterns,
      recommendations
    };
  }

  /**
   * Generate actionable recommendations
   * EASY TO MODIFY: Recommendation logic
   */
  private generateRecommendations(accuracy: number, patterns: any, bestPatterns: string[]): string[] {
    const recommendations: string[] = [];
    
    // EASY TO MODIFY: Recommendation rules
    if (accuracy >= 75) {
      recommendations.push('✅ High accuracy achieved - Ready for live trading');
    } else if (accuracy >= 60) {
      recommendations.push('⚠️ Moderate accuracy - Consider optimizing prediction formulas');
    } else {
      recommendations.push('❌ Low accuracy - Review momentum calculations and pattern detection');
    }

    if (bestPatterns.length > 0) {
      recommendations.push(`🎯 Focus on patterns: ${bestPatterns.join(', ')} for best results`);
    }

    if (patterns['1-4']?.accuracy > 80) {
      recommendations.push('📈 Uptrend predictions are strong - Prioritize bullish market conditions');
    }

    return recommendations;
  }
}

export default BattuBacktestEngine;