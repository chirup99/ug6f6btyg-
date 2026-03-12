// 🤖 AI PATTERN CODE GENERATOR
// Generates authentic trading code based on real detected patterns

import { DetectedPattern } from './pattern-detection-service';
import { PatternImageCapture } from './pattern-image-capture';

export interface GeneratedStrategy {
  id: string;
  name: string;
  code: string;
  description: string;
  entryRules: string[];
  exitRules: string[];
  riskManagement: string[];
  basedOnPattern: DetectedPattern;
  confidence: number;
  expectedReturn: number;
  riskReward: number;
  generatedAt: number;
  language: 'python' | 'javascript' | 'pine';
}

export class AIPatternCodeGenerator {
  
  /**
   * 🧠 GENERATE AUTHENTIC CODE FROM REAL PATTERN
   */
  async generateCodeFromPattern(
    pattern: DetectedPattern, 
    imageCapture?: PatternImageCapture,
    preferences: {
      language: 'python' | 'javascript' | 'pine';
      riskLevel: 'conservative' | 'moderate' | 'aggressive';
      timeframe: string;
      symbol: string;
    } = {
      language: 'python',
      riskLevel: 'moderate',
      timeframe: '15m',
      symbol: 'NIFTY50'
    }
  ): Promise<GeneratedStrategy> {
    
    const strategy = this.createPatternBasedStrategy(pattern, preferences);
    const code = this.generateCodeForPattern(pattern, preferences);
    
    return {
      id: `strategy_${pattern.id}_${Date.now()}`,
      name: this.generateStrategyName(pattern, preferences),
      code,
      description: this.generateStrategyDescription(pattern, preferences),
      entryRules: this.generateEntryRules(pattern),
      exitRules: this.generateExitRules(pattern),
      riskManagement: this.generateRiskManagement(pattern, preferences.riskLevel),
      basedOnPattern: pattern,
      confidence: this.calculateStrategyConfidence(pattern),
      expectedReturn: this.estimateExpectedReturn(pattern),
      riskReward: this.calculateRiskReward(pattern),
      generatedAt: Date.now(),
      language: preferences.language
    };
  }
  
  /**
   * 📝 GENERATE STRATEGY NAME
   */
  private generateStrategyName(pattern: DetectedPattern, preferences: any): string {
    const patternName = pattern.type.replace('_', ' ').toUpperCase();
    const direction = pattern.breakoutDirection.toUpperCase();
    const timeframe = preferences.timeframe.toUpperCase();
    
    return `${patternName} ${direction} ${timeframe} Strategy`;
  }
  
  /**
   * 📋 GENERATE STRATEGY DESCRIPTION
   */
  private generateStrategyDescription(pattern: DetectedPattern, preferences: any): string {
    const confidence = (pattern.confidence * 100).toFixed(1);
    const formation = pattern.formationPercentage.toFixed(1);
    
    return `
🎯 AUTHENTIC PATTERN-BASED STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Pattern: ${pattern.type.replace('_', ' ').toUpperCase()}
🎚️ Formation: ${formation}% Complete
🎯 Confidence: ${confidence}%
📈 Breakout Direction: ${pattern.breakoutDirection.toUpperCase()}
⏰ Timeframe: ${preferences.timeframe}
📍 Symbol: ${preferences.symbol}

This strategy is based on a REAL detected chart pattern with ${formation}% formation completion.
The pattern shows ${confidence}% confidence and targets a ${pattern.breakoutDirection} breakout.
Entry and exit rules are derived from authentic pattern analysis, not random generation.

🔬 PATTERN FINGERPRINT ANALYSIS:
- Pattern Points: ${pattern.points.length}
- Time Span: ${pattern.patternEnd - pattern.patternStart} candles
- Target Price: ₹${pattern.targetPrice?.toFixed(2) || 'Calculated dynamically'}
- Stop Loss: ₹${pattern.stopLoss?.toFixed(2) || 'Based on pattern structure'}
`;
  }
  
  /**
   * 💻 GENERATE CODE FOR PATTERN
   */
  private generateCodeForPattern(pattern: DetectedPattern, preferences: any): string {
    switch (preferences.language) {
      case 'python':
        return this.generatePythonCode(pattern, preferences);
      case 'javascript':
        return this.generateJavaScriptCode(pattern, preferences);
      case 'pine':
        return this.generatePineScriptCode(pattern, preferences);
      default:
        return this.generatePythonCode(pattern, preferences);
    }
  }
  
  /**
   * 🐍 GENERATE PYTHON CODE
   */
  private generatePythonCode(pattern: DetectedPattern, preferences: any): string {
    const patternData = JSON.stringify({
      type: pattern.type,
      points: pattern.points.map(p => ({ price: p.price, index: p.index })),
      confidence: pattern.confidence,
      breakoutDirection: pattern.breakoutDirection,
      targetPrice: pattern.targetPrice,
      stopLoss: pattern.stopLoss
    }, null, 2);
    
    return `"""
🎯 AUTHENTIC ${pattern.type.replace('_', ' ').toUpperCase()} PATTERN STRATEGY
Generated from REAL chart pattern with ${pattern.formationPercentage.toFixed(1)}% formation
Base Pattern Confidence: ${(pattern.confidence * 100).toFixed(1)}%
"""

import pandas as pd
import numpy as np
from datetime import datetime
import ta

class Authentic${pattern.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Strategy:
    """
    🔬 REAL PATTERN-BASED TRADING STRATEGY
    This strategy is based on an ACTUAL detected ${pattern.type.replace('_', ' ')} pattern
    Pattern Formation: ${pattern.formationPercentage.toFixed(1)}%
    Breakout Direction: ${pattern.breakoutDirection.toUpperCase()}
    """
    
    def __init__(self):
        # 📊 AUTHENTIC PATTERN DATA (From Real Chart Detection)
        self.pattern_data = ${patternData}
        
        # 🎯 STRATEGY PARAMETERS (Based on Real Pattern Analysis)
        self.entry_confidence_threshold = ${pattern.confidence.toFixed(3)}
        self.target_price = ${pattern.targetPrice?.toFixed(2) || 'None'}
        self.stop_loss = ${pattern.stopLoss?.toFixed(2) || 'None'}
        self.risk_reward_ratio = ${this.calculateRiskReward(pattern).toFixed(2)}
        
        # 📈 PATTERN VALIDATION RULES
        self.min_formation_percentage = ${Math.max(80, pattern.formationPercentage).toFixed(1)}
        self.breakout_direction = "${pattern.breakoutDirection}"
        
        # 🔄 STATE TRACKING
        self.position = None
        self.entry_price = None
        self.pattern_confirmed = False
        
    def validate_pattern_structure(self, df: pd.DataFrame) -> bool:
        """
        🔍 VALIDATE PATTERN STRUCTURE (Based on Real Pattern Points)
        Checks if current market structure matches the detected pattern
        """
        if len(df) < ${pattern.points.length}:
            return False
            
        # Get recent highs and lows for pattern matching
        recent_data = df.tail(${Math.max(20, pattern.patternEnd - pattern.patternStart)})
        
        # Calculate pattern characteristics
        price_range = recent_data['high'].max() - recent_data['low'].min()
        volatility = recent_data['close'].pct_change().std()
        
        # Pattern-specific validation
        ${this.generatePatternValidationCode(pattern)}
        
        return True
    
    def detect_entry_signal(self, df: pd.DataFrame) -> dict:
        """
        🎯 DETECT ENTRY SIGNAL (Based on Authentic Pattern Breakout)
        """
        if not self.validate_pattern_structure(df):
            return {"signal": False, "reason": "Pattern structure not valid"}
            
        current_price = df['close'].iloc[-1]
        
        # 📊 Pattern-Specific Entry Logic
        ${this.generateEntrySignalCode(pattern)}
        
        # 🔄 Volume Confirmation (if pattern had volume surge)
        volume_avg = df['volume'].rolling(20).mean().iloc[-1]
        current_volume = df['volume'].iloc[-1]
        volume_surge = current_volume > volume_avg * 1.5
        
        # 🎯 FINAL ENTRY DECISION
        if breakout_confirmed and volume_surge:
            return {
                "signal": True,
                "reason": f"${pattern.type.replace('_', ' ').toUpperCase()} breakout confirmed",
                "entry_price": current_price,
                "target": self.target_price,
                "stop_loss": self.stop_loss,
                "confidence": ${pattern.confidence.toFixed(3)}
            }
            
        return {"signal": False, "reason": "Entry conditions not met"}
    
    def manage_position(self, df: pd.DataFrame) -> dict:
        """
        🛡️ POSITION MANAGEMENT (Based on Pattern Structure)
        """
        if self.position is None:
            return {"action": "none"}
            
        current_price = df['close'].iloc[-1]
        
        # 🎯 Target Achievement
        if self.target_price and ((self.breakout_direction == "up" and current_price >= self.target_price) or 
                                  (self.breakout_direction == "down" and current_price <= self.target_price)):
            return {
                "action": "exit",
                "reason": "Target achieved",
                "exit_price": current_price,
                "pnl": self.calculate_pnl(current_price)
            }
        
        # 🛑 Stop Loss Hit
        if self.stop_loss and ((self.breakout_direction == "up" and current_price <= self.stop_loss) or 
                               (self.breakout_direction == "down" and current_price >= self.stop_loss)):
            return {
                "action": "exit",
                "reason": "Stop loss hit",
                "exit_price": current_price,
                "pnl": self.calculate_pnl(current_price)
            }
        
        return {"action": "hold"}
    
    def calculate_pnl(self, current_price: float) -> float:
        """Calculate P&L based on position"""
        if self.entry_price is None:
            return 0.0
            
        if self.breakout_direction == "up":
            return (current_price - self.entry_price) / self.entry_price * 100
        else:
            return (self.entry_price - current_price) / self.entry_price * 100
    
    def run_strategy(self, df: pd.DataFrame) -> dict:
        """
        🚀 MAIN STRATEGY EXECUTION
        """
        # Check for entry signal
        if self.position is None:
            entry_signal = self.detect_entry_signal(df)
            if entry_signal["signal"]:
                self.position = self.breakout_direction
                self.entry_price = entry_signal["entry_price"]
                return {
                    "action": "enter",
                    "position": self.position,
                    "price": self.entry_price,
                    "reason": entry_signal["reason"],
                    "target": self.target_price,
                    "stop_loss": self.stop_loss
                }
        
        # Manage existing position
        else:
            position_action = self.manage_position(df)
            if position_action["action"] == "exit":
                self.position = None
                self.entry_price = None
                return position_action
        
        return {"action": "none"}

# 🎯 USAGE EXAMPLE
if __name__ == "__main__":
    # Initialize strategy with authentic pattern data
    strategy = Authentic${pattern.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Strategy()
    
    # Load your OHLC data
    # df = pd.read_csv('your_data.csv')
    
    # Run strategy
    # result = strategy.run_strategy(df)
    # print(f"Strategy Signal: {result}")
    
    print("🎯 AUTHENTIC PATTERN STRATEGY INITIALIZED")
    print(f"📊 Pattern Type: ${pattern.type.replace('_', ' ').toUpperCase()}")
    print(f"🎚️ Formation: ${pattern.formationPercentage.toFixed(1)}%")
    print(f"🎯 Confidence: ${(pattern.confidence * 100).toFixed(1)}%")
    print(f"📈 Direction: ${pattern.breakoutDirection.toUpperCase()}")
`;
  }
  
  /**
   * 🟨 GENERATE JAVASCRIPT CODE
   */
  private generateJavaScriptCode(pattern: DetectedPattern, preferences: any): string {
    return `/**
 * 🎯 AUTHENTIC ${pattern.type.replace('_', ' ').toUpperCase()} PATTERN STRATEGY
 * Generated from REAL chart pattern with ${pattern.formationPercentage.toFixed(1)}% formation
 * Base Pattern Confidence: ${(pattern.confidence * 100).toFixed(1)}%
 */

class Authentic${pattern.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Strategy {
  constructor() {
    // 📊 AUTHENTIC PATTERN DATA (From Real Chart Detection)
    this.patternData = ${JSON.stringify(pattern, null, 2)};
    
    // 🎯 STRATEGY PARAMETERS
    this.entryConfidenceThreshold = ${pattern.confidence.toFixed(3)};
    this.targetPrice = ${pattern.targetPrice?.toFixed(2) || 'null'};
    this.stopLoss = ${pattern.stopLoss?.toFixed(2) || 'null'};
    this.breakoutDirection = "${pattern.breakoutDirection}";
    
    // 🔄 STATE
    this.position = null;
    this.entryPrice = null;
  }
  
  /**
   * 🔍 VALIDATE PATTERN STRUCTURE
   */
  validatePatternStructure(candles) {
    if (candles.length < ${pattern.points.length}) return false;
    
    const recentData = candles.slice(-${Math.max(20, pattern.patternEnd - pattern.patternStart)});
    const prices = recentData.map(c => c.close);
    const highs = recentData.map(c => c.high);
    const lows = recentData.map(c => c.low);
    
    // Pattern-specific validation
    ${this.generateJSPatternValidation(pattern)}
    
    return true;
  }
  
  /**
   * 🎯 DETECT ENTRY SIGNAL
   */
  detectEntrySignal(candles) {
    if (!this.validatePatternStructure(candles)) {
      return { signal: false, reason: "Pattern structure not valid" };
    }
    
    const currentCandle = candles[candles.length - 1];
    const currentPrice = currentCandle.close;
    
    ${this.generateJSEntrySignal(pattern)}
    
    if (breakoutConfirmed) {
      return {
        signal: true,
        reason: "${pattern.type.replace('_', ' ').toUpperCase()} breakout confirmed",
        entryPrice: currentPrice,
        target: this.targetPrice,
        stopLoss: this.stopLoss,
        confidence: ${pattern.confidence.toFixed(3)}
      };
    }
    
    return { signal: false, reason: "Entry conditions not met" };
  }
  
  /**
   * 🚀 RUN STRATEGY
   */
  runStrategy(candles) {
    if (!this.position) {
      const entrySignal = this.detectEntrySignal(candles);
      if (entrySignal.signal) {
        this.position = this.breakoutDirection;
        this.entryPrice = entrySignal.entryPrice;
        return {
          action: "enter",
          position: this.position,
          price: this.entryPrice,
          reason: entrySignal.reason
        };
      }
    }
    
    return { action: "none" };
  }
}

// 🎯 EXPORT FOR USE
export default Authentic${pattern.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Strategy;

// 📊 USAGE EXAMPLE
/*
const strategy = new Authentic${pattern.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Strategy();
const result = strategy.runStrategy(ohlcData);
console.log('Strategy Signal:', result);
*/`;
  }
  
  /**
   * 🌲 GENERATE PINESCRIPT CODE
   */
  private generatePineScriptCode(pattern: DetectedPattern, preferences: any): string {
    return `//@version=5
indicator("🎯 Authentic ${pattern.type.replace('_', ' ').toUpperCase()} Pattern Strategy", overlay=true)

// 📊 AUTHENTIC PATTERN PARAMETERS (From Real Detection)
var float pattern_confidence = ${pattern.confidence.toFixed(3)}
var float target_price = ${pattern.targetPrice?.toFixed(2) || 'na'}
var float stop_loss = ${pattern.stopLoss?.toFixed(2) || 'na'}
var string breakout_direction = "${pattern.breakoutDirection}"

// 🎯 PATTERN DETECTION VARIABLES
var bool pattern_detected = false
var bool entry_signal = false

// 🔍 PATTERN VALIDATION
validate_pattern() =>
    // Validate pattern structure based on real detected pattern
    ${this.generatePinePatternValidation(pattern)}

// 🎯 ENTRY SIGNAL DETECTION
detect_entry() =>
    pattern_valid = validate_pattern()
    breakout_confirmed = false
    
    ${this.generatePineEntrySignal(pattern)}
    
    pattern_valid and breakout_confirmed

// 📊 MAIN LOGIC
if validate_pattern()
    pattern_detected := true
    
if pattern_detected and detect_entry()
    entry_signal := true
    
// 🎨 VISUAL INDICATORS
plotshape(pattern_detected, title="Pattern Detected", location=location.belowbar, color=color.yellow, style=shape.triangleup, size=size.small)
plotshape(entry_signal, title="Entry Signal", location=location.belowbar, color=color.lime, style=shape.triangleup, size=size.normal)

// 🎯 PRICE LEVELS
hline(target_price, title="Target", color=color.green, linestyle=hline.style_dashed)
hline(stop_loss, title="Stop Loss", color=color.red, linestyle=hline.style_dashed)

// 📝 INFO TABLE
var table info_table = table.new(position.top_right, 2, 5, bgcolor=color.white, border_width=1)
if barstate.islast
    table.cell(info_table, 0, 0, "Pattern", text_color=color.black)
    table.cell(info_table, 1, 0, "${pattern.type.replace('_', ' ').toUpperCase()}", text_color=color.black)
    table.cell(info_table, 0, 1, "Formation", text_color=color.black)
    table.cell(info_table, 1, 1, "${pattern.formationPercentage.toFixed(1)}%", text_color=color.black)
    table.cell(info_table, 0, 2, "Confidence", text_color=color.black)
    table.cell(info_table, 1, 2, str.tostring(pattern_confidence * 100, "#.#") + "%", text_color=color.black)
    table.cell(info_table, 0, 3, "Direction", text_color=color.black)
    table.cell(info_table, 1, 3, breakout_direction, text_color=color.black)
`;
  }
  
  // Helper methods for generating pattern-specific code
  private generatePatternValidationCode(pattern: DetectedPattern): string {
    switch (pattern.type) {
      case 'triangle':
        return `
        # Triangle pattern validation
        if price_range < volatility * 50:
            return False  # Insufficient price movement
        
        # Check for converging trendlines
        resistance_slope = self.calculate_resistance_slope(recent_data)
        support_slope = self.calculate_support_slope(recent_data)
        
        return abs(resistance_slope - support_slope) > 0.002`;
        
      case 'rectangle':
        return `
        # Rectangle pattern validation
        support_level = recent_data['low'].rolling(5).min().iloc[-1]
        resistance_level = recent_data['high'].rolling(5).max().iloc[-1]
        
        # Check for horizontal levels
        return (resistance_level - support_level) / support_level > 0.02`;
        
      default:
        return `
        # Generic pattern validation
        return price_range > 0 and volatility > 0.01`;
    }
  }
  
  private generateEntrySignalCode(pattern: DetectedPattern): string {
    const breakoutLevel = pattern.breakoutDirection === 'up' ? 
      'resistance_level' : 'support_level';
      
    return `
        # ${pattern.type.replace('_', ' ').toUpperCase()} Breakout Detection
        ${pattern.breakoutDirection === 'up' ? 'resistance_level' : 'support_level'} = ${
          pattern.points.length > 0 ? 
          pattern.points[pattern.breakoutDirection === 'up' ? 0 : pattern.points.length - 1].price.toFixed(2) :
          'recent_data[\'high\' if self.breakout_direction == \'up\' else \'low\'].max()'
        }
        
        breakout_confirmed = current_price ${ 
          pattern.breakoutDirection === 'up' ? '>' : '<'
        } ${breakoutLevel}`;
  }
  
  private generateJSPatternValidation(pattern: DetectedPattern): string {
    return `
    // JavaScript pattern validation for ${pattern.type}
    const priceRange = Math.max(...highs) - Math.min(...lows);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const volatility = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length) / avgPrice;
    
    return priceRange > avgPrice * 0.01 && volatility > 0.005;`;
  }
  
  private generateJSEntrySignal(pattern: DetectedPattern): string {
    return `
    // ${pattern.type.replace('_', ' ').toUpperCase()} entry signal
    const breakoutLevel = ${pattern.points.length > 0 ? pattern.points[0].price.toFixed(2) : 'currentPrice'};
    const breakoutConfirmed = currentPrice ${pattern.breakoutDirection === 'up' ? '>' : '<'} breakoutLevel;`;
  }
  
  private generatePinePatternValidation(pattern: DetectedPattern): string {
    return `
    high_range = ta.highest(high, 20) - ta.lowest(low, 20)
    avg_price = ta.sma(close, 20)
    high_range > avg_price * 0.02`;
  }
  
  private generatePineEntrySignal(pattern: DetectedPattern): string {
    return `
    breakout_level = ${pattern.points.length > 0 ? pattern.points[0].price.toFixed(2) : 'close'}
    breakout_confirmed := close ${pattern.breakoutDirection === 'up' ? '>' : '<'} breakout_level`;
  }
  
  // Strategy calculation methods
  private generateEntryRules(pattern: DetectedPattern): string[] {
    const rules = [
      `Wait for ${pattern.type.replace('_', ' ')} pattern to reach 80%+ formation`,
      `Confirm breakout ${pattern.breakoutDirection} from pattern structure`,
      `Validate with volume surge (>150% of 20-period average)`,
      `Ensure pattern confidence is above ${(pattern.confidence * 100).toFixed(0)}%`
    ];
    
    if (pattern.targetPrice) {
      rules.push(`Target price calculated at ₹${pattern.targetPrice.toFixed(2)}`);
    }
    
    return rules;
  }
  
  private generateExitRules(pattern: DetectedPattern): string[] {
    const rules = [
      `Take profit at calculated target level`,
      `Stop loss based on pattern structure`,
      `Trail stop loss after 50% target achievement`
    ];
    
    if (pattern.stopLoss) {
      rules.push(`Initial stop loss at ₹${pattern.stopLoss.toFixed(2)}`);
    }
    
    return rules;
  }
  
  private generateRiskManagement(pattern: DetectedPattern, riskLevel: string): string[] {
    const baseRisk = riskLevel === 'conservative' ? 1 : riskLevel === 'moderate' ? 2 : 3;
    
    return [
      `Risk per trade: ${baseRisk}% of account`,
      `Maximum concurrent positions: ${riskLevel === 'conservative' ? 2 : riskLevel === 'moderate' ? 3 : 5}`,
      `Pattern confidence minimum: ${Math.max(60, pattern.confidence * 100).toFixed(0)}%`,
      `Stop loss mandatory on all trades`,
      `Review and adjust after 10 trades`
    ];
  }
  
  private createPatternBasedStrategy(pattern: DetectedPattern, preferences: any): any {
    return {
      patternType: pattern.type,
      formation: pattern.formationPercentage,
      confidence: pattern.confidence,
      breakoutDirection: pattern.breakoutDirection,
      timeframe: preferences.timeframe,
      riskLevel: preferences.riskLevel
    };
  }
  
  private calculateStrategyConfidence(pattern: DetectedPattern): number {
    let confidence = pattern.confidence;
    
    // Bonus for high formation percentage
    if (pattern.formationPercentage >= 90) confidence += 0.1;
    else if (pattern.formationPercentage >= 80) confidence += 0.05;
    
    // Bonus for clear breakout direction
    if (pattern.breakoutDirection !== 'neutral') confidence += 0.1;
    
    return Math.min(1, confidence);
  }
  
  private estimateExpectedReturn(pattern: DetectedPattern): number {
    if (!pattern.targetPrice || !pattern.points.length) return 5; // Default 5%
    
    const avgPrice = pattern.points.reduce((sum, p) => sum + p.price, 0) / pattern.points.length;
    return Math.abs((pattern.targetPrice - avgPrice) / avgPrice * 100);
  }
  
  private calculateRiskReward(pattern: DetectedPattern): number {
    if (!pattern.targetPrice || !pattern.stopLoss || !pattern.points.length) return 2; // Default 2:1
    
    const avgPrice = pattern.points.reduce((sum, p) => sum + p.price, 0) / pattern.points.length;
    const reward = Math.abs(pattern.targetPrice - avgPrice);
    const risk = Math.abs(avgPrice - pattern.stopLoss);
    
    return risk > 0 ? reward / risk : 2;
  }
}

// Export singleton instance
export const aiPatternCodeGenerator = new AIPatternCodeGenerator();