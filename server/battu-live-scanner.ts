// import { fyersApi } from './fyers-api.js'; // Removed: Fyers API removed
import { storage } from './storage.js';
import { CorrectedSlopeCalculator } from './corrected-slope-calculator.js';
import { ProgressiveThreeStepProcessor } from './progressive-three-step-processor.js';
import { AdvancedBattuRulesEngine } from './advanced-battu-rules.js';
import { AdvancedMarketScanner } from './market-scanner.js';
import { TRuleProcessor } from './t-rule-processor.js';

interface LiveScanConfig {
  symbols: string[];
  timeframes: number[];
  enabledRules: string[];
  autoTradeEnabled: boolean;
  riskAmount: number;
  maxPositions: number;
  alertWebhook?: string;
}

interface ValidTrade {
  symbol: string;
  timeframe: number;
  pattern: string;
  entryPrice: number;
  stopLoss: number;
  target: number;
  confidence: number;
  timestamp: number;
  rulesTrigger: string[];
  candleBlocks: any[];
  slopes: any[];
}

interface ScannerStatus {
  isRunning: boolean;
  startTime: number;
  lastScan: number;
  totalScans: number;
  validTrades: number;
  errors: number;
  currentSymbol?: string;
  marketStatus: 'open' | 'closed' | 'pre-open' | 'post-close';
}

export class BattuLiveScanner {
  private config: LiveScanConfig;
  private status: ScannerStatus;
  private scanInterval: NodeJS.Timeout | null = null;
  private validTrades: ValidTrade[] = [];
  private slopeCalculator: CorrectedSlopeCalculator;
  private progressiveProcessor: ProgressiveThreeStepProcessor;
  private rulesEngine: AdvancedBattuRulesEngine;
  private marketScanner: AdvancedMarketScanner;
  private tRuleProcessor: TRuleProcessor;

  constructor(config: LiveScanConfig) {
    this.config = config;
    this.status = {
      isRunning: false,
      startTime: 0,
      lastScan: 0,
      totalScans: 0,
      validTrades: 0,
      errors: 0,
      marketStatus: 'closed'
    };
    
    this.slopeCalculator = new CorrectedSlopeCalculator(fyersApi);
    this.progressiveProcessor = new ProgressiveThreeStepProcessor(fyersApi);
    this.rulesEngine = new AdvancedBattuRulesEngine(fyersApi);
    this.marketScanner = new AdvancedMarketScanner(fyersApi);
    this.tRuleProcessor = new TRuleProcessor();
  }

  async startLiveScanning(): Promise<void> {
    if (this.status.isRunning) {
      throw new Error('Scanner is already running');
    }

    console.log('🚀 [LIVE-SCANNER] Starting Battu live scanner...');
    console.log(`📊 [LIVE-SCANNER] Configuration: ${this.config.symbols.length} symbols, ${this.config.timeframes.length} timeframes`);
    
    this.status.isRunning = true;
    this.status.startTime = Date.now();
    this.status.totalScans = 0;
    this.status.validTrades = 0;
    this.status.errors = 0;

    await storage.addActivityLog({
      type: "success",
      message: `[LIVE-SCANNER] Started live scanning for ${this.config.symbols.join(', ')}`
    });

    // Start continuous scanning
    this.scanInterval = setInterval(async () => {
      await this.performLiveScan();
    }, 30000); // Scan every 30 seconds

    // Initial scan
    await this.performLiveScan();
  }

  async stopLiveScanning(): Promise<void> {
    if (!this.status.isRunning) {
      return;
    }

    console.log('🛑 [LIVE-SCANNER] Stopping live scanner...');
    
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    this.status.isRunning = false;
    
    await storage.addActivityLog({
      type: "success",
      message: `[LIVE-SCANNER] Stopped after ${this.status.totalScans} scans, ${this.status.validTrades} valid trades found`
    });
  }

  private async performLiveScan(): Promise<void> {
    try {
      this.status.lastScan = Date.now();
      this.status.totalScans++;

      // Check market status
      await this.updateMarketStatus();
      
      if (this.status.marketStatus === 'closed') {
        console.log('📴 [LIVE-SCANNER] Market is closed, skipping scan');
        return;
      }

      console.log(`🔍 [LIVE-SCANNER] Scan #${this.status.totalScans} starting...`);

      // Scan each symbol across all timeframes
      for (const symbol of this.config.symbols) {
        this.status.currentSymbol = symbol;
        
        for (const timeframe of this.config.timeframes) {
          await this.scanSymbolTimeframe(symbol, timeframe);
        }
      }

      console.log(`✅ [LIVE-SCANNER] Scan #${this.status.totalScans} completed`);

    } catch (error) {
      this.status.errors++;
      console.error('❌ [LIVE-SCANNER] Scan failed:', error);
      
      await storage.addActivityLog({
        type: "error",
        message: `[LIVE-SCANNER] Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private async scanSymbolTimeframe(symbol: string, timeframe: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log(`🔍 [LIVE-SCANNER] Scanning ${symbol} on ${timeframe}min timeframe`);

      // Step 1: Apply core Battu 6-candle block methodology
      const battuAnalysis = await this.slopeCalculator.calculateSlopesFromExactTimestamps(symbol, today, timeframe);
      
      if (!battuAnalysis || !battuAnalysis.slopes || battuAnalysis.slopes.length === 0) {
        console.log(`⚠️ [LIVE-SCANNER] No valid Battu analysis for ${symbol} ${timeframe}min`);
        return;
      }

      // Step 2: Apply progressive 3-step methodology
      const progressiveResult = await this.progressiveProcessor.executeProgressive(symbol, today);
      
      // Step 3: Apply advanced rules engine
      const rulesAnalysis = await this.rulesEngine.getAdvancedAnalysis(symbol, today, timeframe);
      
      // Step 4: Check for valid trade setups
      const validTrade = await this.evaluateTradeSetup(
        symbol, 
        timeframe, 
        battuAnalysis, 
        progressiveResult, 
        rulesAnalysis
      );

      if (validTrade) {
        this.validTrades.push(validTrade);
        this.status.validTrades++;
        
        console.log(`🎯 [LIVE-SCANNER] VALID TRADE FOUND: ${symbol} ${timeframe}min - ${validTrade.pattern} (${validTrade.confidence}% confidence)`);
        
        await this.handleValidTrade(validTrade);
      }

    } catch (error) {
      console.error(`❌ [LIVE-SCANNER] Error scanning ${symbol} ${timeframe}min:`, error);
    }
  }

  private async evaluateTradeSetup(
    symbol: string,
    timeframe: number,
    battuAnalysis: any,
    progressiveResult: any,
    rulesAnalysis: any
  ): Promise<ValidTrade | null> {
    
    // Find strongest slope trend
    const strongestSlope = battuAnalysis.slopes.reduce((strongest: any, current: any) => {
      return Math.abs(current.slope) > Math.abs(strongest.slope) ? current : strongest;
    });

    // Calculate confidence score
    let confidence = 0;
    const triggeredRules: string[] = [];

    // Base confidence from slope strength
    confidence += Math.min(Math.abs(strongestSlope.slope) * 10, 40);
    
    // Add confidence from advanced rules
    if (rulesAnalysis?.summary?.confidence) {
      confidence += rulesAnalysis.summary.confidence * 0.4;
    }

    // Add confidence from progressive validation
    if (progressiveResult && progressiveResult.length > 0) {
      confidence += 20;
      triggeredRules.push('PROGRESSIVE_VALIDATION');
    }

    // Check timing rules
    if (strongestSlope.timingValid) {
      confidence += 15;
      triggeredRules.push('TIMING_RULES_VALID');
    }

    // Check volume confirmation
    if (rulesAnalysis?.advancedRules?.some((rule: any) => rule.ruleId === 'VOLUME_SURGE' && rule.triggered)) {
      confidence += 10;
      triggeredRules.push('VOLUME_SURGE');
    }

    // Minimum confidence threshold for valid trade
    if (confidence < 70) {
      return null;
    }

    // Calculate entry, stop loss, and target
    const entryPrice = strongestSlope.breakoutLevel;
    const stopLoss = this.calculateStopLoss(battuAnalysis.candleBlocks, strongestSlope.trendDirection);
    const target = this.calculateTarget(entryPrice, strongestSlope.slope, timeframe);

    return {
      symbol,
      timeframe,
      pattern: strongestSlope.patternName,
      entryPrice,
      stopLoss,
      target,
      confidence: Math.round(confidence),
      timestamp: Date.now(),
      rulesTrigger: triggeredRules,
      candleBlocks: battuAnalysis.candleBlocks,
      slopes: battuAnalysis.slopes
    };
  }

  private calculateStopLoss(candleBlocks: any[], trendDirection: string): number {
    // Use previous candle high/low as stop loss
    const lastCandle = candleBlocks[candleBlocks.length - 1];
    return trendDirection === 'uptrend' ? lastCandle.low : lastCandle.high;
  }

  private calculateTarget(entryPrice: number, slope: number, timeframe: number): number {
    // Target based on slope projection over 2x timeframe duration
    const projectedMove = slope * (timeframe * 2);
    return entryPrice + projectedMove;
  }

  private async handleValidTrade(trade: ValidTrade): Promise<void> {
    // Log the valid trade
    await storage.addActivityLog({
      type: "success",
      message: `[LIVE-SCANNER] Valid trade: ${trade.symbol} ${trade.pattern} - Entry: ${trade.entryPrice}, Target: ${trade.target}, Confidence: ${trade.confidence}%`
    });

    // Send alert if webhook configured
    if (this.config.alertWebhook) {
      await this.sendTradeAlert(trade);
    }

    // Auto-place order if enabled
    if (this.config.autoTradeEnabled) {
      await this.placeAutoTrade(trade);
    }

    console.log(`📧 [LIVE-SCANNER] Trade alert sent for ${trade.symbol} ${trade.pattern}`);
  }

  private async sendTradeAlert(trade: ValidTrade): Promise<void> {
    // Implementation for sending webhook alerts
    const alertData = {
      action: 'TRADE_SIGNAL',
      symbol: trade.symbol,
      pattern: trade.pattern,
      entry: trade.entryPrice,
      stopLoss: trade.stopLoss,
      target: trade.target,
      confidence: trade.confidence,
      timestamp: trade.timestamp,
      rules: trade.rulesTrigger.join(', ')
    };

    console.log('📧 [LIVE-SCANNER] Alert data prepared:', alertData);
    // Here you would send to external webhook/alert system
  }

  private async placeAutoTrade(trade: ValidTrade): Promise<void> {
    try {
      // Calculate position size based on risk amount
      const riskDistance = Math.abs(trade.entryPrice - trade.stopLoss);
      const quantity = Math.floor(this.config.riskAmount / riskDistance);

      if (quantity > 0) {
        console.log(`🤖 [LIVE-SCANNER] Auto-placing trade: ${trade.symbol} ${quantity} shares`);
        
        // Here you would integrate with your trading API
        // For now, just log the order details
        await storage.addActivityLog({
          type: "success",
          message: `[LIVE-SCANNER] Auto-trade placed: ${trade.symbol} ${quantity} shares at ${trade.entryPrice}`
        });
      }
    } catch (error) {
      console.error('❌ [LIVE-SCANNER] Auto-trade failed:', error);
    }
  }

  private async updateMarketStatus(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // Indian market hours: 9:15 AM to 3:30 PM (IST)
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM

    if (currentTime >= marketOpen && currentTime <= marketClose) {
      this.status.marketStatus = 'open';
    } else if (currentTime < marketOpen) {
      this.status.marketStatus = 'pre-open';
    } else {
      this.status.marketStatus = 'post-close';
    }
  }

  // Public methods for status and control
  getStatus(): ScannerStatus {
    return { ...this.status };
  }

  getValidTrades(): ValidTrade[] {
    return [...this.validTrades];
  }

  getRecentTrades(limit: number = 10): ValidTrade[] {
    return this.validTrades
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async updateConfig(newConfig: Partial<LiveScanConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    await storage.addActivityLog({
      type: "success",
      message: `[LIVE-SCANNER] Configuration updated`
    });
  }

  getStatistics() {
    const uptime = this.status.isRunning ? Date.now() - this.status.startTime : 0;
    const successRate = this.status.totalScans > 0 ? 
      ((this.status.totalScans - this.status.errors) / this.status.totalScans * 100) : 0;

    return {
      uptime,
      totalScans: this.status.totalScans,
      validTrades: this.status.validTrades,
      errors: this.status.errors,
      successRate: Math.round(successRate),
      averageTradesPerHour: uptime > 0 ? 
        Math.round((this.status.validTrades / (uptime / 3600000)) * 100) / 100 : 0,
      symbols: this.config.symbols.length,
      timeframes: this.config.timeframes.length
    };
  }
}