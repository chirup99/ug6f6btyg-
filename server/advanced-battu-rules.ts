/**
 * Advanced Battu API Rules Engine
 * Implements sophisticated trading rules and pattern recognition
 */

// import { FyersAPI } from './fyers-api.js'; // Removed: Fyers API removed
import { PointABExtractor } from './point-ab-extractor.js';
import { CorrectedSlopeCalculator } from './corrected-slope-calculator.js';
import { ProgressiveThreeStepProcessor } from './progressive-three-step-processor.js';
import { TRuleProcessor } from './t-rule-processor.js';

export interface AdvancedRule {
  ruleId: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'timing' | 'pattern' | 'risk' | 'volume' | 'momentum';
  conditions: RuleCondition[];
  action: RuleAction;
}

export interface RuleCondition {
  type: 'slope' | 'volume' | 'volatility' | 'pattern' | 'timing' | 'momentum';
  operator: '>' | '<' | '=' | '>=' | '<=' | 'contains' | 'between';
  value: number | string | [number, number];
  weight: number; // 1-10 importance weight
}

export interface RuleAction {
  type: 'trigger' | 'warning' | 'stop' | 'enhance' | 'modify';
  parameters: Record<string, any>;
  confidence: number; // 0-100
}

export interface AdvancedAnalysisResult {
  ruleId: string;
  triggered: boolean;
  confidence: number;
  recommendation: string;
  riskLevel: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  tradingSignal: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell' | 'no-signal';
  parameters: Record<string, any>;
}

export class AdvancedBattuRulesEngine {
  private fyersAPI: FyersAPI;
  private slopeCalculator: CorrectedSlopeCalculator;
  private tRuleProcessor: TRuleProcessor;
  private progressiveProcessor: ProgressiveThreeStepProcessor;
  private rules: Map<string, AdvancedRule> = new Map();

  constructor(fyersAPI?: FyersAPI) {
    this.fyersAPI = fyersAPI || new FyersAPI();
    this.slopeCalculator = new CorrectedSlopeCalculator(this.fyersAPI);
    this.progressiveProcessor = new ProgressiveThreeStepProcessor(this.fyersAPI);
    this.initializeAdvancedRules();
  }

  /**
   * Initialize predefined advanced rules
   */
  private initializeAdvancedRules(): void {
    // Rule 1: Volume Surge Pattern Detection
    this.rules.set('VOLUME_SURGE', {
      ruleId: 'VOLUME_SURGE',
      name: 'Volume Surge Detection',
      description: 'Detects unusual volume spikes during pattern formation',
      priority: 'high',
      category: 'volume',
      conditions: [
        {
          type: 'volume',
          operator: '>',
          value: 1.5, // 1.5x average volume
          weight: 8
        },
        {
          type: 'pattern',
          operator: 'contains',
          value: 'breakout',
          weight: 7
        }
      ],
      action: {
        type: 'enhance',
        parameters: {
          confidenceMultiplier: 1.3,
          riskReduction: 0.2
        },
        confidence: 85
      }
    });

    // Rule 2: Multi-Timeframe Confluence
    this.rules.set('MTF_CONFLUENCE', {
      ruleId: 'MTF_CONFLUENCE',
      name: 'Multi-Timeframe Confluence',
      description: 'Validates patterns across multiple timeframes',
      priority: 'high',
      category: 'pattern',
      conditions: [
        {
          type: 'pattern',
          operator: 'contains',
          value: 'same_direction',
          weight: 9
        },
        {
          type: 'timing',
          operator: '>=',
          value: 2, // At least 2 timeframes
          weight: 8
        }
      ],
      action: {
        type: 'enhance',
        parameters: {
          confidenceBoost: 25,
          targetMultiplier: 1.5
        },
        confidence: 90
      }
    });

    // Rule 3: Volatility Spike Filter
    this.rules.set('VOLATILITY_FILTER', {
      ruleId: 'VOLATILITY_FILTER',
      name: 'Volatility Spike Filter',
      description: 'Filters out patterns during extreme volatility',
      priority: 'medium',
      category: 'risk',
      conditions: [
        {
          type: 'volatility',
          operator: '>',
          value: 2.0, // 2x normal volatility
          weight: 7
        }
      ],
      action: {
        type: 'warning',
        parameters: {
          riskIncrease: 0.4,
          stopLossAdjustment: 1.5
        },
        confidence: 75
      }
    });

    // Rule 4: Momentum Acceleration
    this.rules.set('MOMENTUM_ACCEL', {
      ruleId: 'MOMENTUM_ACCEL',
      name: 'Momentum Acceleration',
      description: 'Detects accelerating momentum patterns',
      priority: 'high',
      category: 'momentum',
      conditions: [
        {
          type: 'slope',
          operator: '>',
          value: 1.2, // Slope acceleration ratio
          weight: 8
        },
        {
          type: 'momentum',
          operator: 'between',
          value: [0.7, 1.0], // Momentum strength
          weight: 7
        }
      ],
      action: {
        type: 'trigger',
        parameters: {
          earlyEntry: true,
          targetExpansion: 1.3
        },
        confidence: 80
      }
    });

    // Rule 5: Market Session Timing
    this.rules.set('SESSION_TIMING', {
      ruleId: 'SESSION_TIMING',
      name: 'Market Session Timing',
      description: 'Adjusts analysis based on market session timing',
      priority: 'medium',
      category: 'timing',
      conditions: [
        {
          type: 'timing',
          operator: 'between',
          value: [9.25, 10.0], // First 45 minutes (high volatility)
          weight: 6
        }
      ],
      action: {
        type: 'modify',
        parameters: {
          cautionLevel: 'high',
          positionSizeReduction: 0.3
        },
        confidence: 70
      }
    });

    console.log(`🔧 [ADVANCED-RULES] Initialized ${this.rules.size} advanced rules`);
  }

  /**
   * Apply advanced rules to analysis result
   */
  async applyAdvancedRules(
    baseAnalysis: any,
    symbol: string,
    timeframe: number
  ): Promise<AdvancedAnalysisResult[]> {
    console.log(`🎯 [ADVANCED-RULES] Applying ${this.rules.size} rules to ${symbol} analysis`);
    
    const results: AdvancedAnalysisResult[] = [];
    const marketData = await this.getMarketContext(symbol, timeframe);

    for (const [ruleId, rule] of Array.from(this.rules.entries())) {
      try {
        const result = await this.evaluateRule(rule, baseAnalysis, marketData);
        results.push(result);
        
        if (result.triggered) {
          console.log(`✅ [RULE-${ruleId}] Triggered: ${result.recommendation}`);
        }
      } catch (error) {
        console.error(`❌ [RULE-${ruleId}] Evaluation failed:`, error);
      }
    }

    return results;
  }

  /**
   * Evaluate individual rule
   */
  private async evaluateRule(
    rule: AdvancedRule,
    analysis: any,
    marketData: any
  ): Promise<AdvancedAnalysisResult> {
    let score = 0;
    let maxScore = 0;
    const triggeredConditions: string[] = [];

    // Evaluate each condition
    for (const condition of rule.conditions) {
      maxScore += condition.weight;
      const conditionMet = this.evaluateCondition(condition, analysis, marketData);
      
      if (conditionMet) {
        score += condition.weight;
        triggeredConditions.push(`${condition.type} ${condition.operator} ${condition.value}`);
      }
    }

    const conditionScore = score / maxScore;
    const triggered = conditionScore >= 0.6; // 60% threshold
    const confidence = Math.round(conditionScore * rule.action.confidence);

    // Generate recommendation
    const recommendation = this.generateRecommendation(rule, triggered, conditionScore, triggeredConditions);
    
    // Determine risk level
    const riskLevel = this.calculateRiskLevel(rule, conditionScore, analysis);
    
    // Generate trading signal
    const tradingSignal = this.generateTradingSignal(rule, triggered, conditionScore);

    return {
      ruleId: rule.ruleId,
      triggered,
      confidence,
      recommendation,
      riskLevel,
      tradingSignal,
      parameters: {
        ...rule.action.parameters,
        conditionScore,
        triggeredConditions,
        category: rule.category,
        priority: rule.priority
      }
    };
  }

  /**
   * Evaluate individual condition
   */
  private evaluateCondition(condition: RuleCondition, analysis: any, marketData: any): boolean {
    const value = this.extractValue(condition.type, analysis, marketData);
    
    switch (condition.operator) {
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '=':
        return value === condition.value;
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'between':
        const [min, max] = condition.value as [number, number];
        return value >= min && value <= max;
      default:
        return false;
    }
  }

  /**
   * Extract value based on condition type
   */
  private extractValue(type: string, analysis: any, marketData: any): any {
    switch (type) {
      case 'slope':
        return analysis.slopes?.[0]?.slope || 0;
      case 'volume':
        return marketData.volumeRatio || 1;
      case 'volatility':
        return marketData.volatilityRatio || 1;
      case 'pattern':
        return analysis.patternName || '';
      case 'timing':
        return marketData.sessionTime || 0;
      case 'momentum':
        return marketData.momentum || 0;
      default:
        return 0;
    }
  }

  /**
   * Generate recommendation text
   */
  private generateRecommendation(
    rule: AdvancedRule,
    triggered: boolean,
    score: number,
    conditions: string[]
  ): string {
    if (!triggered) {
      return `${rule.name}: Conditions not met (score: ${Math.round(score * 100)}%)`;
    }

    const actionText = {
      'trigger': 'Execute trade signal',
      'warning': 'Exercise caution',
      'stop': 'Avoid trading',
      'enhance': 'Strengthen position',
      'modify': 'Adjust parameters'
    }[rule.action.type] || 'Review analysis';

    return `${rule.name}: ${actionText} - ${conditions.join(', ')} (confidence: ${Math.round(score * 100)}%)`;
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(rule: AdvancedRule, score: number, analysis: any): 'very-low' | 'low' | 'medium' | 'high' | 'very-high' {
    const baseRisk = analysis.riskLevel || 'medium';
    const riskAdjustment = rule.action.parameters?.riskIncrease || 0;
    
    if (rule.action.type === 'warning' || riskAdjustment > 0.3) {
      return 'high';
    } else if (rule.action.type === 'enhance' && score > 0.8) {
      return 'low';
    } else if (rule.action.type === 'stop') {
      return 'very-high';
    }
    
    return baseRisk;
  }

  /**
   * Generate trading signal
   */
  private generateTradingSignal(
    rule: AdvancedRule,
    triggered: boolean,
    score: number
  ): 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell' | 'no-signal' {
    if (!triggered) return 'no-signal';
    
    switch (rule.action.type) {
      case 'trigger':
        return score > 0.85 ? 'strong-buy' : 'buy';
      case 'enhance':
        return 'buy';
      case 'warning':
        return 'hold';
      case 'stop':
        return 'sell';
      case 'modify':
        return 'hold';
      default:
        return 'no-signal';
    }
  }

  /**
   * Get market context data
   */
  private async getMarketContext(symbol: string, timeframe: number): Promise<any> {
    try {
      // Get recent market data for context
      const currentTime = new Date();
      const fromDate = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const marketData = await this.fyersAPI.getHistoricalData(
        symbol,
        fromDate.toISOString().split('T')[0],
        currentTime.toISOString().split('T')[0],
        1 // 1-minute for detailed analysis
      );

      if (!marketData || marketData.length === 0) {
        return { volumeRatio: 1, volatilityRatio: 1, momentum: 0, sessionTime: 0 };
      }

      // Calculate volume ratio (current vs average)
      const recentVolume = marketData.slice(-10).reduce((sum, candle) => sum + (candle.volume || 0), 0) / 10;
      const averageVolume = marketData.reduce((sum, candle) => sum + (candle.volume || 0), 0) / marketData.length;
      const volumeRatio = averageVolume > 0 ? recentVolume / averageVolume : 1;

      // Calculate volatility ratio
      const recentVolatility = this.calculateVolatility(marketData.slice(-20));
      const overallVolatility = this.calculateVolatility(marketData);
      const volatilityRatio = overallVolatility > 0 ? recentVolatility / overallVolatility : 1;

      // Calculate momentum
      const momentum = this.calculateMomentum(marketData.slice(-10));

      // Calculate session time (hours from market open)
      const marketOpen = 9.25; // 9:15 AM
      const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
      const sessionTime = Math.max(0, currentHour - marketOpen);

      return {
        volumeRatio,
        volatilityRatio,
        momentum,
        sessionTime,
        dataPoints: marketData.length
      };
    } catch (error) {
      console.error('Failed to get market context:', error);
      return { volumeRatio: 1, volatilityRatio: 1, momentum: 0, sessionTime: 0 };
    }
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(candles: any[]): number {
    if (candles.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < candles.length; i++) {
      const currentClose = candles[i].close;
      const prevClose = candles[i - 1].close;
      if (prevClose > 0) {
        returns.push((currentClose - prevClose) / prevClose);
      }
    }
    
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate momentum
   */
  private calculateMomentum(candles: any[]): number {
    if (candles.length < 2) return 0;
    
    const firstClose = candles[0].close;
    const lastClose = candles[candles.length - 1].close;
    
    if (firstClose === 0) return 0;
    
    return (lastClose - firstClose) / firstClose;
  }

  /**
   * Get comprehensive analysis with advanced rules
   */
  async getAdvancedAnalysis(
    symbol: string,
    date: string,
    timeframe: number = 5
  ): Promise<{
    baseAnalysis: any;
    advancedRules: AdvancedAnalysisResult[];
    summary: {
      overallRisk: string;
      tradingSignal: string;
      confidence: number;
      activeRules: number;
      recommendations: string[];
    };
  }> {
    console.log(`🚀 [ADVANCED-ANALYSIS] Starting comprehensive analysis for ${symbol}`);
    
    // Get base analysis
    const baseAnalysis = await this.slopeCalculator.calculateCorrectedSlope(symbol, date, timeframe, {});
    
    // Apply advanced rules
    const advancedRules = await this.applyAdvancedRules(baseAnalysis, symbol, timeframe);
    
    // Generate summary
    const summary = this.generateAnalysisSummary(advancedRules);
    
    console.log(`✅ [ADVANCED-ANALYSIS] Analysis complete: ${summary.activeRules} rules triggered`);
    
    return {
      baseAnalysis,
      advancedRules,
      summary
    };
  }

  /**
   * Generate analysis summary
   */
  private generateAnalysisSummary(rules: AdvancedAnalysisResult[]): {
    overallRisk: string;
    tradingSignal: string;
    confidence: number;
    activeRules: number;
    recommendations: string[];
  } {
    const triggeredRules = rules.filter(r => r.triggered);
    const averageConfidence = triggeredRules.length > 0 
      ? triggeredRules.reduce((sum, r) => sum + r.confidence, 0) / triggeredRules.length 
      : 0;

    // Determine overall risk
    const riskLevels = triggeredRules.map(r => r.riskLevel);
    const overallRisk = this.determineOverallRisk(riskLevels);

    // Determine trading signal
    const signals = triggeredRules.map(r => r.tradingSignal).filter(s => s !== 'no-signal');
    const tradingSignal = this.determineOverallSignal(signals);

    // Generate recommendations
    const recommendations = triggeredRules
      .filter(r => r.confidence > 60)
      .map(r => r.recommendation);

    return {
      overallRisk,
      tradingSignal,
      confidence: Math.round(averageConfidence),
      activeRules: triggeredRules.length,
      recommendations
    };
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRisk(riskLevels: string[]): string {
    if (riskLevels.includes('very-high')) return 'very-high';
    if (riskLevels.includes('high')) return 'high';
    if (riskLevels.includes('medium')) return 'medium';
    if (riskLevels.includes('low')) return 'low';
    return 'very-low';
  }

  /**
   * Determine overall trading signal
   */
  private determineOverallSignal(signals: string[]): string {
    if (signals.length === 0) return 'no-signal';
    
    const signalCounts = signals.reduce((counts, signal) => {
      counts[signal] = (counts[signal] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const dominantSignal = Object.entries(signalCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    return dominantSignal;
  }

  /**
   * Add custom rule
   */
  addCustomRule(rule: AdvancedRule): void {
    this.rules.set(rule.ruleId, rule);
    console.log(`✅ [CUSTOM-RULE] Added rule: ${rule.name}`);
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      console.log(`🗑️ [RULE-REMOVAL] Removed rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * List all rules
   */
  listRules(): AdvancedRule[] {
    return Array.from(this.rules.values());
  }
}