/**
 * Real-Time Battu API Monitoring System
 * Provides continuous market monitoring and instant alerts
 */

import { EventEmitter } from 'events';
// import { FyersAPI } from './fyers-api.js'; // Removed: Fyers API removed
import { AdvancedBattuRulesEngine } from './advanced-battu-rules.js';

export interface MonitoringConfig {
  symbols: string[];
  timeframes: number[];
  refreshInterval: number; // milliseconds
  alertThresholds: {
    volumeSpike: number;
    priceChange: number;
    volatility: number;
  };
  enabledRules: string[];
}

export interface MarketAlert {
  alertId: string;
  timestamp: number;
  symbol: string;
  alertType: 'pattern' | 'volume' | 'price' | 'volatility' | 'breakout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, any>;
  recommendations: string[];
}

export interface MonitoringStats {
  startTime: number;
  uptime: number;
  totalAlerts: number;
  symbolsMonitored: number;
  lastUpdate: number;
  alertsByType: Record<string, number>;
  performance: {
    avgResponseTime: number;
    successRate: number;
    errors: number;
  };
}

export class RealTimeMonitoring extends EventEmitter {
  private fyersAPI: FyersAPI;
  private rulesEngine: AdvancedBattuRulesEngine;
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alerts: MarketAlert[] = [];
  private stats: MonitoringStats;
  private lastPrices: Map<string, number> = new Map();
  private performanceMetrics: { responseTime: number; success: boolean }[] = [];

  constructor(config: MonitoringConfig) {
    super();
    this.fyersAPI = new FyersAPI();
    this.rulesEngine = new AdvancedBattuRulesEngine();
    this.config = config;
    this.stats = this.initializeStats();
    
    console.log(`🔄 [RT-MONITOR] Initialized for ${config.symbols.length} symbols`);
  }

  /**
   * Initialize monitoring statistics
   */
  private initializeStats(): MonitoringStats {
    return {
      startTime: Date.now(),
      uptime: 0,
      totalAlerts: 0,
      symbolsMonitored: this.config.symbols.length,
      lastUpdate: 0,
      alertsByType: {},
      performance: {
        avgResponseTime: 0,
        successRate: 100,
        errors: 0
      }
    };
  }

  /**
   * Start real-time monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ [RT-MONITOR] Already running');
      return;
    }

    console.log(`🚀 [RT-MONITOR] Starting real-time monitoring...`);
    console.log(`📊 [RT-MONITOR] Symbols: ${this.config.symbols.join(', ')}`);
    console.log(`⏱️ [RT-MONITOR] Refresh interval: ${this.config.refreshInterval}ms`);

    this.isRunning = true;
    this.stats.startTime = Date.now();

    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, this.config.refreshInterval);

    // Perform initial scan
    await this.performMonitoringCycle();

    this.emit('monitoringStarted', {
      symbols: this.config.symbols,
      interval: this.config.refreshInterval
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isRunning) {
      console.log('⚠️ [RT-MONITOR] Not currently running');
      return;
    }

    console.log('🛑 [RT-MONITOR] Stopping real-time monitoring...');

    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoringStopped', {
      uptime: Date.now() - this.stats.startTime,
      totalAlerts: this.stats.totalAlerts
    });
  }

  /**
   * Perform single monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    const cycleStart = Date.now();

    try {
      console.log(`🔄 [RT-MONITOR] Scanning ${this.config.symbols.length} symbols...`);

      // Monitor each symbol
      const promises = this.config.symbols.map(symbol => 
        this.monitorSymbol(symbol)
      );

      await Promise.allSettled(promises);

      // Update performance metrics
      const responseTime = Date.now() - cycleStart;
      this.performanceMetrics.push({ responseTime, success: true });
      this.updatePerformanceStats();

      // Update stats
      this.stats.uptime = Date.now() - this.stats.startTime;
      this.stats.lastUpdate = Date.now();

      console.log(`✅ [RT-MONITOR] Cycle completed in ${responseTime}ms`);

    } catch (error) {
      console.error('❌ [RT-MONITOR] Monitoring cycle failed:', error);
      
      this.performanceMetrics.push({ 
        responseTime: Date.now() - cycleStart, 
        success: false 
      });
      this.stats.performance.errors++;
      this.updatePerformanceStats();
    }
  }

  /**
   * Monitor individual symbol
   */
  private async monitorSymbol(symbol: string): Promise<void> {
    try {
      // Get current market data
      const quotes = await this.fyersAPI.getQuotes([symbol]);
      if (!quotes || quotes.length === 0) {
        return;
      }

      const quote = quotes[0];
      const currentPrice = quote.lp;
      const prevPrice = this.lastPrices.get(symbol);

      // Store current price for next comparison
      this.lastPrices.set(symbol, currentPrice);

      if (prevPrice) {
        // Check for price alerts
        await this.checkPriceAlerts(symbol, quote, prevPrice);
        
        // Check for volume alerts
        await this.checkVolumeAlerts(symbol, quote);
        
        // Check for volatility alerts
        await this.checkVolatilityAlerts(symbol, quote);
      }

      // Run pattern analysis for each timeframe
      for (const timeframe of this.config.timeframes) {
        await this.checkPatternAlerts(symbol, timeframe);
      }

    } catch (error) {
      console.error(`❌ [RT-MONITOR] Failed to monitor ${symbol}:`, error);
    }
  }

  /**
   * Check price-based alerts
   */
  private async checkPriceAlerts(symbol: string, quote: any, prevPrice: number): Promise<void> {
    const currentPrice = quote.lp;
    const priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;
    
    if (Math.abs(priceChange) >= this.config.alertThresholds.priceChange) {
      const alert: MarketAlert = {
        alertId: `price-${symbol}-${Date.now()}`,
        timestamp: Date.now(),
        symbol,
        alertType: 'price',
        severity: Math.abs(priceChange) > 2 ? 'high' : 'medium',
        message: `Significant price movement: ${priceChange.toFixed(2)}% in ${this.config.refreshInterval/1000}s`,
        data: {
          currentPrice,
          prevPrice,
          priceChange,
          changePercent: priceChange
        },
        recommendations: [
          priceChange > 0 ? 'Monitor for continuation' : 'Check support levels',
          'Verify volume confirmation'
        ]
      };

      this.addAlert(alert);
    }
  }

  /**
   * Check volume-based alerts
   */
  private async checkVolumeAlerts(symbol: string, quote: any): Promise<void> {
    const volume = quote.volume || 0;
    if (volume === 0) return;

    // Simple volume spike detection (would need historical average in production)
    const avgVolume = quote.atp || volume; // Using ATP as proxy for average
    const volumeRatio = volume / (avgVolume || 1);

    if (volumeRatio >= this.config.alertThresholds.volumeSpike) {
      const alert: MarketAlert = {
        alertId: `volume-${symbol}-${Date.now()}`,
        timestamp: Date.now(),
        symbol,
        alertType: 'volume',
        severity: volumeRatio > 3 ? 'high' : 'medium',
        message: `Volume spike detected: ${volumeRatio.toFixed(1)}x normal volume`,
        data: {
          currentVolume: volume,
          volumeRatio,
          price: quote.lp
        },
        recommendations: [
          'Investigate price action',
          'Check for news catalysts',
          'Monitor breakout potential'
        ]
      };

      this.addAlert(alert);
    }
  }

  /**
   * Check volatility alerts
   */
  private async checkVolatilityAlerts(symbol: string, quote: any): Promise<void> {
    const high = quote.high_price;
    const low = quote.low_price;
    const close = quote.lp;
    
    if (high > 0 && low > 0) {
      const dayRange = ((high - low) / close) * 100;
      
      if (dayRange >= this.config.alertThresholds.volatility) {
        const alert: MarketAlert = {
          alertId: `volatility-${symbol}-${Date.now()}`,
          timestamp: Date.now(),
          symbol,
          alertType: 'volatility',
          severity: dayRange > 5 ? 'high' : 'medium',
          message: `High volatility: ${dayRange.toFixed(2)}% daily range`,
          data: {
            high,
            low,
            close,
            dayRange,
            volatilityPercent: dayRange
          },
          recommendations: [
            'Adjust position sizes',
            'Review stop loss levels',
            'Consider range-bound strategies'
          ]
        };

        this.addAlert(alert);
      }
    }
  }

  /**
   * Check pattern-based alerts
   */
  private async checkPatternAlerts(symbol: string, timeframe: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const analysis = await this.rulesEngine.getAdvancedAnalysis(symbol, today, timeframe);
      
      // Check for triggered advanced rules
      const triggeredRules = analysis.advancedRules.filter(rule => rule.triggered);
      
      for (const rule of triggeredRules) {
        if (this.config.enabledRules.includes(rule.ruleId)) {
          const alert: MarketAlert = {
            alertId: `pattern-${rule.ruleId}-${symbol}-${Date.now()}`,
            timestamp: Date.now(),
            symbol,
            alertType: 'pattern',
            severity: this.mapRiskToSeverity(rule.riskLevel),
            message: `Pattern alert: ${rule.recommendation}`,
            data: {
              ruleId: rule.ruleId,
              confidence: rule.confidence,
              tradingSignal: rule.tradingSignal,
              riskLevel: rule.riskLevel,
              timeframe
            },
            recommendations: analysis.summary.recommendations
          };

          this.addAlert(alert);
        }
      }

    } catch (error) {
      console.error(`❌ [RT-MONITOR] Pattern analysis failed for ${symbol}:`, error);
    }
  }

  /**
   * Map risk level to alert severity
   */
  private mapRiskToSeverity(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (riskLevel) {
      case 'very-low':
        return 'low';
      case 'low':
        return 'low';
      case 'medium':
        return 'medium';
      case 'high':
        return 'high';
      case 'very-high':
        return 'critical';
      default:
        return 'medium';
    }
  }

  /**
   * Add alert to system
   */
  private addAlert(alert: MarketAlert): void {
    this.alerts.push(alert);
    this.stats.totalAlerts++;
    
    // Update alert type counters
    this.stats.alertsByType[alert.alertType] = 
      (this.stats.alertsByType[alert.alertType] || 0) + 1;

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    console.log(`🚨 [ALERT-${alert.severity.toUpperCase()}] ${alert.symbol}: ${alert.message}`);

    // Emit alert event
    this.emit('alert', alert);

    // Emit critical alerts separately
    if (alert.severity === 'critical') {
      this.emit('criticalAlert', alert);
    }
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(): void {
    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }

    const successfulMetrics = this.performanceMetrics.filter(m => m.success);
    const totalMetrics = this.performanceMetrics.length;

    this.stats.performance.successRate = totalMetrics > 0 
      ? (successfulMetrics.length / totalMetrics) * 100 
      : 100;

    this.stats.performance.avgResponseTime = successfulMetrics.length > 0
      ? successfulMetrics.reduce((sum, m) => sum + m.responseTime, 0) / successfulMetrics.length
      : 0;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50): MarketAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get alerts by symbol
   */
  getAlertsBySymbol(symbol: string, limit: number = 20): MarketAlert[] {
    return this.alerts
      .filter(alert => alert.symbol === symbol)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(alertType: string, limit: number = 20): MarketAlert[] {
    return this.alerts
      .filter(alert => alert.alertType === alertType)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get monitoring statistics
   */
  getStats(): MonitoringStats {
    this.stats.uptime = this.isRunning ? Date.now() - this.stats.startTime : 0;
    return { ...this.stats };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`🔧 [RT-MONITOR] Configuration updated`);
    
    this.emit('configUpdated', this.config);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.stats.totalAlerts = 0;
    this.stats.alertsByType = {};
    console.log(`🗑️ [RT-MONITOR] Alerts cleared`);
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isRunning: boolean;
    uptime: number;
    lastUpdate: number;
    symbolsMonitored: number;
    recentAlerts: number;
  } {
    const recentAlerts = this.alerts.filter(
      alert => Date.now() - alert.timestamp < 60000 // Last minute
    ).length;

    return {
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.stats.startTime : 0,
      lastUpdate: this.stats.lastUpdate,
      symbolsMonitored: this.config.symbols.length,
      recentAlerts
    };
  }
}