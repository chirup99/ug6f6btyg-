/**
 * Advanced Market Scanner with Multiple Detection Algorithms
 * Implements sophisticated market scanning with various trading patterns
 */

// import { FyersAPI } from './fyers-api.js'; // Removed: Fyers API removed
import { AdvancedBattuRulesEngine } from './advanced-battu-rules.js';
import { RealTimeMonitoring } from './real-time-monitoring.js';

export interface ScanResult {
  symbol: string;
  timestamp: number;
  scanType: string;
  signals: MarketSignal[];
  score: number;
  recommendation: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MarketSignal {
  signalId: string;
  type: 'breakout' | 'reversal' | 'momentum' | 'volume' | 'pattern' | 'support-resistance';
  strength: number; // 1-10
  description: string;
  price: number;
  timeframe: number;
  validUntil: number;
}

export interface ScanConfiguration {
  symbols: string[];
  timeframes: number[];
  scanTypes: string[];
  minConfidence: number;
  maxResults: number;
  filters: {
    minVolume?: number;
    minPrice?: number;
    maxPrice?: number;
    minMarketCap?: number;
  };
}

export class AdvancedMarketScanner {
  private fyersAPI: FyersAPI;
  private rulesEngine: AdvancedBattuRulesEngine;
  private monitoring: RealTimeMonitoring | null = null;

  constructor(fyersAPI?: FyersAPI) {
    this.fyersAPI = fyersAPI || new FyersAPI();
    this.rulesEngine = new AdvancedBattuRulesEngine(this.fyersAPI);
  }

  /**
   * Perform comprehensive market scan
   */
  async performFullMarketScan(config: ScanConfiguration): Promise<ScanResult[]> {
    console.log(`🔍 [MARKET-SCAN] Starting comprehensive scan for ${config.symbols.length} symbols`);
    
    const results: ScanResult[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const symbol of config.symbols) {
      try {
        console.log(`📊 [SCAN-${symbol}] Analyzing...`);
        
        const symbolResults = await Promise.all(
          config.timeframes.map(timeframe => 
            this.scanSymbolTimeframe(symbol, timeframe, today, config)
          )
        );

        // Combine results from all timeframes
        const combinedResult = this.combineTimeframeResults(symbol, symbolResults);
        
        if (combinedResult.confidence >= config.minConfidence) {
          results.push(combinedResult);
        }

      } catch (error) {
        console.error(`❌ [SCAN-${symbol}] Failed:`, error);
      }
    }

    // Sort by score and limit results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, config.maxResults);

    console.log(`✅ [MARKET-SCAN] Completed: ${sortedResults.length} high-confidence opportunities found`);
    
    return sortedResults;
  }

  /**
   * Scan single symbol on specific timeframe
   */
  private async scanSymbolTimeframe(
    symbol: string,
    timeframe: number,
    date: string,
    config: ScanConfiguration
  ): Promise<Partial<ScanResult>> {
    const signals: MarketSignal[] = [];
    let totalScore = 0;

    // Run different scan types
    for (const scanType of config.scanTypes) {
      const scanSignals = await this.runSpecificScan(symbol, timeframe, date, scanType);
      signals.push(...scanSignals);
      totalScore += scanSignals.reduce((sum, signal) => sum + signal.strength, 0);
    }

    // Get advanced rules analysis
    const advancedAnalysis = await this.rulesEngine.getAdvancedAnalysis(symbol, date, timeframe);
    
    // Add advanced rule signals
    for (const rule of advancedAnalysis.advancedRules) {
      if (rule.triggered) {
        signals.push({
          signalId: `rule-${rule.ruleId}`,
          type: 'pattern',
          strength: Math.round(rule.confidence / 10),
          description: rule.recommendation,
          price: 0, // Will be filled from market data
          timeframe,
          validUntil: Date.now() + (timeframe * 60 * 1000 * 3) // Valid for 3 periods
        });
        totalScore += rule.confidence / 10;
      }
    }

    const avgScore = signals.length > 0 ? totalScore / signals.length : 0;
    const confidence = Math.min(100, Math.round(avgScore * 10));

    return {
      signals,
      score: totalScore,
      confidence,
      riskLevel: this.calculateRiskLevel(signals, advancedAnalysis.summary.overallRisk)
    };
  }

  /**
   * Run specific scan type
   */
  private async runSpecificScan(
    symbol: string,
    timeframe: number,
    date: string,
    scanType: string
  ): Promise<MarketSignal[]> {
    switch (scanType) {
      case 'breakout':
        return await this.scanBreakouts(symbol, timeframe, date);
      case 'reversal':
        return await this.scanReversals(symbol, timeframe, date);
      case 'momentum':
        return await this.scanMomentum(symbol, timeframe, date);
      case 'volume':
        return await this.scanVolumeAnomaly(symbol, timeframe, date);
      case 'support-resistance':
        return await this.scanSupportResistance(symbol, timeframe, date);
      case 'battu-patterns':
        return await this.scanBattuPatterns(symbol, timeframe, date);
      default:
        return [];
    }
  }

  /**
   * Scan for breakout patterns
   */
  private async scanBreakouts(symbol: string, timeframe: number, date: string): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      // Get recent price data
      const candles = await this.fyersAPI.getHistoricalData(symbol, date, date, timeframe);
      if (!candles || candles.length < 20) return signals;

      // Calculate resistance/support levels
      const highs = candles.slice(-10).map(c => c.high);
      const lows = candles.slice(-10).map(c => c.low);
      const resistance = Math.max(...highs);
      const support = Math.min(...lows);
      
      const lastCandle = candles[candles.length - 1];
      const currentPrice = lastCandle.close;

      // Check for resistance breakout
      if (currentPrice > resistance * 1.002) { // 0.2% above resistance
        signals.push({
          signalId: `breakout-resistance-${symbol}-${Date.now()}`,
          type: 'breakout',
          strength: 8,
          description: `Resistance breakout at ${resistance.toFixed(2)}`,
          price: currentPrice,
          timeframe,
          validUntil: Date.now() + (timeframe * 60 * 1000 * 2)
        });
      }

      // Check for support breakdown
      if (currentPrice < support * 0.998) { // 0.2% below support
        signals.push({
          signalId: `breakdown-support-${symbol}-${Date.now()}`,
          type: 'breakout',
          strength: 7,
          description: `Support breakdown at ${support.toFixed(2)}`,
          price: currentPrice,
          timeframe,
          validUntil: Date.now() + (timeframe * 60 * 1000 * 2)
        });
      }

    } catch (error) {
      console.error(`❌ Breakout scan failed for ${symbol}:`, error);
    }

    return signals;
  }

  /**
   * Scan for reversal patterns
   */
  private async scanReversals(symbol: string, timeframe: number, date: string): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      const candles = await this.fyersAPI.getHistoricalData(symbol, date, date, timeframe);
      if (!candles || candles.length < 5) return signals;

      const lastThree = candles.slice(-3);
      
      // Hammer/Doji patterns
      for (let i = 0; i < lastThree.length; i++) {
        const candle = lastThree[i];
        const body = Math.abs(candle.close - candle.open);
        const upperShadow = candle.high - Math.max(candle.open, candle.close);
        const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
        const totalRange = candle.high - candle.low;

        // Hammer pattern
        if (lowerShadow > body * 2 && upperShadow < body * 0.5 && totalRange > 0) {
          signals.push({
            signalId: `hammer-${symbol}-${Date.now()}-${i}`,
            type: 'reversal',
            strength: 6,
            description: 'Hammer reversal pattern detected',
            price: candle.close,
            timeframe,
            validUntil: Date.now() + (timeframe * 60 * 1000)
          });
        }

        // Doji pattern
        if (body < totalRange * 0.1 && totalRange > 0) {
          signals.push({
            signalId: `doji-${symbol}-${Date.now()}-${i}`,
            type: 'reversal',
            strength: 5,
            description: 'Doji reversal pattern detected',
            price: candle.close,
            timeframe,
            validUntil: Date.now() + (timeframe * 60 * 1000)
          });
        }
      }

    } catch (error) {
      console.error(`❌ Reversal scan failed for ${symbol}:`, error);
    }

    return signals;
  }

  /**
   * Scan for momentum patterns
   */
  private async scanMomentum(symbol: string, timeframe: number, date: string): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      const candles = await this.fyersAPI.getHistoricalData(symbol, date, date, timeframe);
      if (!candles || candles.length < 10) return signals;

      // Calculate momentum indicators
      const prices = candles.map(c => c.close);
      const momentum = this.calculateMomentumIndicator(prices);
      const rsi = this.calculateRSI(prices, 14);

      // Strong momentum signal
      if (Math.abs(momentum) > 0.05) { // 5% momentum
        signals.push({
          signalId: `momentum-${symbol}-${Date.now()}`,
          type: 'momentum',
          strength: Math.min(10, Math.round(Math.abs(momentum) * 100)),
          description: `Strong ${momentum > 0 ? 'bullish' : 'bearish'} momentum: ${(momentum * 100).toFixed(2)}%`,
          price: prices[prices.length - 1],
          timeframe,
          validUntil: Date.now() + (timeframe * 60 * 1000 * 3)
        });
      }

      // RSI extremes
      if (rsi < 30) {
        signals.push({
          signalId: `rsi-oversold-${symbol}-${Date.now()}`,
          type: 'reversal',
          strength: 7,
          description: `RSI oversold: ${rsi.toFixed(1)}`,
          price: prices[prices.length - 1],
          timeframe,
          validUntil: Date.now() + (timeframe * 60 * 1000 * 2)
        });
      } else if (rsi > 70) {
        signals.push({
          signalId: `rsi-overbought-${symbol}-${Date.now()}`,
          type: 'reversal',
          strength: 7,
          description: `RSI overbought: ${rsi.toFixed(1)}`,
          price: prices[prices.length - 1],
          timeframe,
          validUntil: Date.now() + (timeframe * 60 * 1000 * 2)
        });
      }

    } catch (error) {
      console.error(`❌ Momentum scan failed for ${symbol}:`, error);
    }

    return signals;
  }

  /**
   * Scan for volume anomalies
   */
  private async scanVolumeAnomaly(symbol: string, timeframe: number, date: string): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      const candles = await this.fyersAPI.getHistoricalData(symbol, date, date, timeframe);
      if (!candles || candles.length < 20) return signals;

      const volumes = candles.map(c => c.volume || 0).filter(v => v > 0);
      if (volumes.length === 0) return signals;

      const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
      const lastVolume = volumes[volumes.length - 1];
      const volumeRatio = lastVolume / avgVolume;

      // Volume spike
      if (volumeRatio > 2) {
        signals.push({
          signalId: `volume-spike-${symbol}-${Date.now()}`,
          type: 'volume',
          strength: Math.min(10, Math.round(volumeRatio)),
          description: `Volume spike: ${volumeRatio.toFixed(1)}x average`,
          price: candles[candles.length - 1].close,
          timeframe,
          validUntil: Date.now() + (timeframe * 60 * 1000)
        });
      }

      // Volume drying up
      if (volumeRatio < 0.3) {
        signals.push({
          signalId: `volume-dry-${symbol}-${Date.now()}`,
          type: 'volume',
          strength: 5,
          description: `Low volume: ${volumeRatio.toFixed(1)}x average`,
          price: candles[candles.length - 1].close,
          timeframe,
          validUntil: Date.now() + (timeframe * 60 * 1000)
        });
      }

    } catch (error) {
      console.error(`❌ Volume scan failed for ${symbol}:`, error);
    }

    return signals;
  }

  /**
   * Scan for support/resistance levels
   */
  private async scanSupportResistance(symbol: string, timeframe: number, date: string): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      const candles = await this.fyersAPI.getHistoricalData(symbol, date, date, timeframe);
      if (!candles || candles.length < 50) return signals;

      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      const currentPrice = candles[candles.length - 1].close;

      // Find significant support/resistance levels
      const supportLevels = this.findSupportLevels(lows);
      const resistanceLevels = this.findResistanceLevels(highs);

      // Check proximity to support/resistance
      for (const support of supportLevels) {
        const distance = Math.abs(currentPrice - support) / support;
        if (distance < 0.01) { // Within 1%
          signals.push({
            signalId: `near-support-${symbol}-${Date.now()}`,
            type: 'support-resistance',
            strength: 7,
            description: `Near support level: ${support.toFixed(2)}`,
            price: currentPrice,
            timeframe,
            validUntil: Date.now() + (timeframe * 60 * 1000 * 4)
          });
        }
      }

      for (const resistance of resistanceLevels) {
        const distance = Math.abs(currentPrice - resistance) / resistance;
        if (distance < 0.01) { // Within 1%
          signals.push({
            signalId: `near-resistance-${symbol}-${Date.now()}`,
            type: 'support-resistance',
            strength: 7,
            description: `Near resistance level: ${resistance.toFixed(2)}`,
            price: currentPrice,
            timeframe,
            validUntil: Date.now() + (timeframe * 60 * 1000 * 4)
          });
        }
      }

    } catch (error) {
      console.error(`❌ Support/Resistance scan failed for ${symbol}:`, error);
    }

    return signals;
  }

  /**
   * Scan for Battu patterns
   */
  private async scanBattuPatterns(symbol: string, timeframe: number, date: string): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];
    
    try {
      const analysis = await this.rulesEngine.getAdvancedAnalysis(symbol, date, timeframe);
      
      if (analysis.baseAnalysis && analysis.baseAnalysis.slopes) {
        for (const slope of analysis.baseAnalysis.slopes) {
          if (Math.abs(slope.slope) > 1) { // Significant slope
            signals.push({
              signalId: `battu-slope-${symbol}-${Date.now()}`,
              type: 'pattern',
              strength: Math.min(10, Math.round(Math.abs(slope.slope))),
              description: `Battu pattern: ${slope.direction} slope ${slope.slope.toFixed(2)} pts/min`,
              price: slope.pointB?.price || 0,
              timeframe,
              validUntil: Date.now() + (timeframe * 60 * 1000 * 5)
            });
          }
        }
      }

    } catch (error) {
      console.error(`❌ Battu pattern scan failed for ${symbol}:`, error);
    }

    return signals;
  }

  /**
   * Combine results from multiple timeframes
   */
  private combineTimeframeResults(symbol: string, results: Partial<ScanResult>[]): ScanResult {
    const allSignals = results.flatMap(r => r.signals || []);
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const avgConfidence = results.length > 0 
      ? results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length 
      : 0;

    // Determine overall recommendation
    const recommendation = this.determineOverallRecommendation(allSignals, avgConfidence);
    
    // Determine risk level
    const riskLevels = results.map(r => r.riskLevel).filter(Boolean) as string[];
    const overallRisk = this.determineOverallRisk(riskLevels);

    return {
      symbol,
      timestamp: Date.now(),
      scanType: 'comprehensive',
      signals: allSignals,
      score: totalScore,
      recommendation,
      confidence: Math.round(avgConfidence),
      riskLevel: overallRisk
    };
  }

  /**
   * Calculate momentum indicator
   */
  private calculateMomentumIndicator(prices: number[]): number {
    if (prices.length < 2) return 0;
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    return (lastPrice - firstPrice) / firstPrice;
  }

  /**
   * Calculate RSI
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Find support levels
   */
  private findSupportLevels(lows: number[]): number[] {
    const levels: number[] = [];
    const windowSize = 5;

    for (let i = windowSize; i < lows.length - windowSize; i++) {
      const current = lows[i];
      let isSupport = true;

      // Check if current low is lower than surrounding lows
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && lows[j] < current) {
          isSupport = false;
          break;
        }
      }

      if (isSupport) {
        levels.push(current);
      }
    }

    return levels.slice(-5); // Return last 5 support levels
  }

  /**
   * Find resistance levels
   */
  private findResistanceLevels(highs: number[]): number[] {
    const levels: number[] = [];
    const windowSize = 5;

    for (let i = windowSize; i < highs.length - windowSize; i++) {
      const current = highs[i];
      let isResistance = true;

      // Check if current high is higher than surrounding highs
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && highs[j] > current) {
          isResistance = false;
          break;
        }
      }

      if (isResistance) {
        levels.push(current);
      }
    }

    return levels.slice(-5); // Return last 5 resistance levels
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(signals: MarketSignal[], baseRisk: string): 'low' | 'medium' | 'high' {
    const riskSignals = signals.filter(s => 
      s.type === 'reversal' || s.strength > 8
    ).length;

    if (baseRisk === 'high' || riskSignals > 2) return 'high';
    if (baseRisk === 'medium' || riskSignals > 0) return 'medium';
    return 'low';
  }

  /**
   * Determine overall recommendation
   */
  private determineOverallRecommendation(
    signals: MarketSignal[], 
    confidence: number
  ): 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell' {
    if (confidence < 50) return 'hold';

    const bullishSignals = signals.filter(s => 
      (s.type === 'breakout' && s.description.includes('resistance')) ||
      (s.type === 'momentum' && s.description.includes('bullish')) ||
      (s.type === 'reversal' && s.description.includes('hammer'))
    ).length;

    const bearishSignals = signals.filter(s => 
      (s.type === 'breakout' && s.description.includes('support')) ||
      (s.type === 'momentum' && s.description.includes('bearish')) ||
      (s.type === 'reversal' && s.description.includes('overbought'))
    ).length;

    const netSignal = bullishSignals - bearishSignals;

    if (netSignal >= 3 && confidence > 80) return 'strong-buy';
    if (netSignal >= 1 && confidence > 60) return 'buy';
    if (netSignal <= -3 && confidence > 80) return 'strong-sell';
    if (netSignal <= -1 && confidence > 60) return 'sell';
    
    return 'hold';
  }

  /**
   * Determine overall risk
   */
  private determineOverallRisk(riskLevels: string[]): 'low' | 'medium' | 'high' {
    if (riskLevels.includes('high')) return 'high';
    if (riskLevels.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Start real-time monitoring
   */
  startRealtimeMonitoring(config: ScanConfiguration): void {
    const monitoringConfig = {
      symbols: config.symbols,
      timeframes: config.timeframes,
      refreshInterval: 30000, // 30 seconds
      alertThresholds: {
        volumeSpike: 2.0,
        priceChange: 1.0,
        volatility: 3.0
      },
      enabledRules: ['VOLUME_SURGE', 'MTF_CONFLUENCE', 'MOMENTUM_ACCEL']
    };

    this.monitoring = new RealTimeMonitoring(monitoringConfig);
    this.monitoring.startMonitoring();
    
    console.log('🔄 [MARKET-SCANNER] Real-time monitoring started');
  }

  /**
   * Stop real-time monitoring
   */
  stopRealtimeMonitoring(): void {
    if (this.monitoring) {
      this.monitoring.stopMonitoring();
      this.monitoring = null;
      console.log('🛑 [MARKET-SCANNER] Real-time monitoring stopped');
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): any {
    return this.monitoring ? this.monitoring.getStatus() : { isRunning: false };
  }
}