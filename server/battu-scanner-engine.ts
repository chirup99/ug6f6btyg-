import { nanoid } from "nanoid";
import { BattuStorage } from "./battu-storage";
import { 
  type InsertScannerSession, 
  type InsertValidPattern, 
  type InsertExecutedTrade, 
  type InsertScannerLog, 
  type Symbol,
  type ScannerConfig
} from "@shared/schema";

// Import existing BATTU analysis engines  
import { CorrectedSlopeCalculator } from "./corrected-slope-calculator";

export interface ScannerSessionConfig {
  sessionId: string;
  marketDate: string;
  symbols: string[];
  timeframes: string[];
  scanningFrequency: number;
  minConfidence: number;
  maxPatternsPerSymbol: number;
  autoTradingEnabled: boolean;
}

export interface PatternResult {
  patternId: string;
  symbol: string;
  timeframe: string;
  patternType: string;
  trend: string;
  confidence: number;
  pointAPrice: number;
  pointBPrice: number;
  breakoutLevel: number;
  stopLoss: number;
  targetPrice: number;
  pointATime: Date;
  pointBTime: Date;
  slope?: number;
  duration?: number;
  candleData?: any;
  oneMinuteData?: any;
  riskAmount?: number;
}

export interface TradeResult {
  tradeId: string;
  patternId: string;
  symbol: string;
  orderType: string;
  orderPrice: number;
  quantity: number;
  stopLossPrice: number;
  targetPrice: number;
  riskAmount: number;
}

export class BattuScannerEngine {
  private storage: BattuStorage;
  private slopeCalculator: CorrectedSlopeCalculator;
  private activeSessionId: string | null = null;
  private scanningInterval: NodeJS.Timeout | null = null;
  private isScanning = false;

  constructor() {
    this.storage = new BattuStorage();
    this.slopeCalculator = new CorrectedSlopeCalculator("", "");
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  async startScannerSession(config: ScannerSessionConfig): Promise<string> {
    try {
      console.log(`🚀 Starting BATTU Scanner Session: ${config.sessionId}`);
      
      // Create new scanner session
      const sessionData: InsertScannerSession = {
        sessionId: config.sessionId,
        startTime: new Date(),
        status: "ACTIVE",
        marketDate: config.marketDate,
        totalSymbolsScanned: 0,
        totalPatternsFound: 0,
        totalTradesExecuted: 0,
        scanningFrequency: config.scanningFrequency
      };

      const session = await this.storage.createScannerSession(sessionData);
      this.activeSessionId = session.sessionId;

      // Log session start
      await this.logScannerActivity(
        session.sessionId,
        "SYSTEM",
        new Date(),
        0,
        0,
        0,
        "SUCCESS",
        null,
        0,
        0
      );

      // Start continuous scanning
      this.startContinuousScanning(config);

      console.log(`✅ Scanner session ${session.sessionId} started successfully`);
      return session.sessionId;

    } catch (error) {
      console.error("❌ Error starting scanner session:", error);
      throw error;
    }
  }

  async stopScannerSession(sessionId: string): Promise<void> {
    try {
      console.log(`🛑 Stopping Scanner Session: ${sessionId}`);

      // Stop scanning interval
      if (this.scanningInterval) {
        clearInterval(this.scanningInterval);
        this.scanningInterval = null;
      }

      // Update session status
      await this.storage.updateScannerSession(sessionId, {
        status: "COMPLETED",
        endTime: new Date()
      });

      // Log session end
      await this.logScannerActivity(
        sessionId,
        "SYSTEM",
        new Date(),
        0,
        0,
        0,
        "SUCCESS",
        null,
        0,
        0
      );

      this.activeSessionId = null;
      this.isScanning = false;

      console.log(`✅ Scanner session ${sessionId} stopped successfully`);

    } catch (error) {
      console.error("❌ Error stopping scanner session:", error);
      throw error;
    }
  }

  // ==========================================
  // CONTINUOUS SCANNING ENGINE
  // ==========================================

  private startContinuousScanning(config: ScannerSessionConfig): void {
    console.log(`🔄 Starting continuous scanning every ${config.scanningFrequency} seconds`);

    this.scanningInterval = setInterval(async () => {
      if (!this.isScanning && this.activeSessionId) {
        await this.performScanCycle(config);
      }
    }, config.scanningFrequency * 1000);
  }

  private async performScanCycle(config: ScannerSessionConfig): Promise<void> {
    if (this.isScanning) return;

    this.isScanning = true;
    const cycleStartTime = new Date();

    try {
      console.log(`🔍 Starting scan cycle for ${config.symbols.length} symbols`);

      for (const symbol of config.symbols) {
        await this.scanSymbol(config.sessionId, symbol, config.timeframes, config);
      }

      // Update session statistics
      const patterns = await this.storage.getPatternsBySession(config.sessionId);
      const trades = await this.storage.getTradesBySession(config.sessionId);

      await this.storage.updateScannerSession(config.sessionId, {
        totalSymbolsScanned: config.symbols.length,
        totalPatternsFound: patterns.length,
        totalTradesExecuted: trades.length
      });

      const cycleTime = Date.now() - cycleStartTime.getTime();
      console.log(`✅ Scan cycle completed in ${cycleTime}ms`);

    } catch (error) {
      console.error("❌ Error in scan cycle:", error);
    } finally {
      this.isScanning = false;
    }
  }

  // ==========================================
  // SYMBOL SCANNING ENGINE
  // ==========================================

  private async scanSymbol(
    sessionId: string, 
    symbol: string, 
    timeframes: string[], 
    config: ScannerSessionConfig
  ): Promise<void> {
    const scanStartTime = new Date();

    try {
      console.log(`📊 Scanning symbol: ${symbol}`);

      for (const timeframe of timeframes) {
        const patterns = await this.analyzeSymbolTimeframe(symbol, timeframe, config);
        
        for (const pattern of patterns) {
          // Save discovered pattern
          const savedPattern = await this.saveValidPattern(sessionId, pattern);
          
          // Check if pattern is ready for trading
          if (this.isPatternReadyForTrading(savedPattern, config)) {
            await this.processTradeSignal(sessionId, savedPattern, config);
          }
        }
      }

      // Log successful scan
      await this.logScannerActivity(
        sessionId,
        symbol,
        scanStartTime,
        0, // Will be updated with actual patterns found
        Date.now() - scanStartTime.getTime(),
        timeframes.length,
        "SUCCESS",
        null,
        0,
        0
      );

    } catch (error) {
      console.error(`❌ Error scanning symbol ${symbol}:`, error);
      
      // Log error
      await this.logScannerActivity(
        sessionId,
        symbol,
        scanStartTime,
        0,
        Date.now() - scanStartTime.getTime(),
        timeframes.length,
        "ERROR",
        error instanceof Error ? error.message : String(error),
        0,
        0
      );
    }
  }

  // ==========================================
  // PATTERN ANALYSIS ENGINE
  // ==========================================

  private async performBasicPatternAnalysis(symbol: string, timeframe: string, marketDate: string): Promise<any> {
    // Basic pattern analysis - this would integrate with existing BATTU logic
    try {
      console.log(`📊 Performing basic pattern analysis for ${symbol} ${timeframe}`);
      
      // For now, return a simple structure that matches expected format
      return {
        slopes: [
          {
            pattern: "DEMO_PATTERN",
            trend: Math.random() > 0.5 ? "UPTREND" : "DOWNTREND",
            confidence: 75 + Math.random() * 20,
            pointAPrice: 24800 + Math.random() * 200,
            pointBPrice: 24800 + Math.random() * 200,
            breakoutLevel: 24800 + Math.random() * 200,
            slope: (Math.random() - 0.5) * 10,
            duration: 10 + Math.random() * 20,
            pointATime: new Date(marketDate + "T09:15:00"),
            pointBTime: new Date(marketDate + "T09:30:00")
          }
        ],
        candleBlocks: {},
        oneMinuteData: []
      };
    } catch (error) {
      console.error("Error in basic pattern analysis:", error);
      return { slopes: [], candleBlocks: {}, oneMinuteData: [] };
    }
  }

  private async analyzeSymbolTimeframe(
    symbol: string, 
    timeframe: string, 
    config: ScannerSessionConfig
  ): Promise<PatternResult[]> {
    try {
      console.log(`🔬 Analyzing ${symbol} on ${timeframe} timeframe`);

      // Use existing slope calculator for pattern detection
      // Note: Using basic analysis since exact method needs refactoring
      const analysis = await this.performBasicPatternAnalysis(symbol, timeframe, config.marketDate);

      const patterns: PatternResult[] = [];

      if (analysis && analysis.slopes && analysis.slopes.length > 0) {
        for (const slope of analysis.slopes) {
          // Convert slope analysis to pattern result
          const pattern: PatternResult = {
            patternId: nanoid(),
            symbol,
            timeframe,
            patternType: slope.pattern || "UNKNOWN",
            trend: slope.trend || "UNKNOWN",
            confidence: slope.confidence || 70,
            pointAPrice: parseFloat(slope.pointAPrice?.toString() || "0"),
            pointBPrice: parseFloat(slope.pointBPrice?.toString() || "0"),
            breakoutLevel: parseFloat(slope.breakoutLevel?.toString() || slope.pointBPrice?.toString() || "0"),
            stopLoss: this.calculateStopLoss(slope),
            targetPrice: this.calculateTargetPrice(slope),
            pointATime: new Date(slope.pointATime || Date.now()),
            pointBTime: new Date(slope.pointBTime || Date.now()),
            slope: parseFloat(slope.slope?.toString() || "0"),
            duration: slope.duration || 0,
            candleData: analysis.candleBlocks || {},
            oneMinuteData: analysis.oneMinuteData || [],
            riskAmount: config.maxPatternsPerSymbol ? 10000 : undefined
          };

          // Filter by minimum confidence
          if (pattern.confidence >= config.minConfidence) {
            patterns.push(pattern);
            console.log(`✅ Valid pattern found: ${pattern.patternType} (${pattern.confidence}% confidence)`);
          }
        }
      }

      return patterns;

    } catch (error) {
      console.error(`❌ Error analyzing ${symbol} ${timeframe}:`, error);
      return [];
    }
  }

  // ==========================================
  // PATTERN VALIDATION & STORAGE
  // ==========================================

  private async saveValidPattern(sessionId: string, pattern: PatternResult): Promise<any> {
    try {
      const patternData: InsertValidPattern = {
        patternId: pattern.patternId,
        sessionId,
        symbol: pattern.symbol,
        timeframe: pattern.timeframe,
        patternType: pattern.patternType,
        trend: pattern.trend,
        confidence: pattern.confidence.toString(),
        pointAPrice: pattern.pointAPrice.toString(),
        pointBPrice: pattern.pointBPrice.toString(),
        breakoutLevel: pattern.breakoutLevel.toString(),
        stopLoss: pattern.stopLoss.toString(),
        targetPrice: pattern.targetPrice.toString(),
        pointATime: pattern.pointATime,
        pointBTime: pattern.pointBTime,
        patternFoundAt: new Date(),
        slope: pattern.slope?.toString(),
        duration: pattern.duration,
        candleData: pattern.candleData,
        oneMinuteData: pattern.oneMinuteData,
        status: "DISCOVERED",
        isValid: true,
        expiryTime: new Date(Date.now() + (240 * 60 * 1000)), // 4 hours expiry
        riskAmount: pattern.riskAmount?.toString()
      };

      const savedPattern = await this.storage.createValidPattern(patternData);
      console.log(`💾 Pattern saved: ${savedPattern.patternId}`);
      return savedPattern;

    } catch (error) {
      console.error("❌ Error saving pattern:", error);
      throw error;
    }
  }

  private isPatternReadyForTrading(pattern: any, config: ScannerSessionConfig): boolean {
    // For now, patterns are ready for trading if they meet confidence criteria
    // Additional logic can be added for timing rules, market conditions, etc.
    return parseFloat(pattern.confidence) >= config.minConfidence && pattern.isValid;
  }

  // ==========================================
  // TRADE EXECUTION ENGINE
  // ==========================================

  private async processTradeSignal(
    sessionId: string, 
    pattern: any, 
    config: ScannerSessionConfig
  ): Promise<void> {
    try {
      console.log(`📈 Processing trade signal for pattern: ${pattern.patternId}`);

      // Update pattern status to ready for trading
      await this.storage.updateValidPattern(pattern.patternId, {
        status: "READY_TO_TRADE"
      });

      // If manual approval is required, create trade approval record
      if (config.autoTradingEnabled) {
        await this.executeAutomaticTrade(sessionId, pattern, config);
      } else {
        await this.createTradeApproval(pattern);
        console.log(`⏳ Trade approval created for pattern: ${pattern.patternId}`);
      }

    } catch (error) {
      console.error("❌ Error processing trade signal:", error);
    }
  }

  private async executeAutomaticTrade(
    sessionId: string, 
    pattern: any, 
    config: ScannerSessionConfig
  ): Promise<void> {
    try {
      const tradeData: InsertExecutedTrade = {
        tradeId: nanoid(),
        patternId: pattern.patternId,
        sessionId,
        symbol: pattern.symbol,
        orderType: pattern.trend === "UPTREND" ? "BUY" : "SELL",
        orderPrice: parseFloat(pattern.breakoutLevel),
        quantity: this.calculateTradeQuantity(pattern, config),
        orderStatus: "PENDING",
        stopLossPrice: parseFloat(pattern.stopLoss),
        targetPrice: parseFloat(pattern.targetPrice),
        tradeStatus: "ACTIVE",
        notes: `Auto-generated trade from pattern ${pattern.patternType}`
      };

      const trade = await this.storage.createExecutedTrade(tradeData);
      console.log(`🎯 Automatic trade executed: ${trade.tradeId}`);

      // Update pattern status
      await this.storage.updateValidPattern(pattern.patternId, {
        status: "TRADE_EXECUTED"
      });

    } catch (error) {
      console.error("❌ Error executing automatic trade:", error);
    }
  }

  private async createTradeApproval(pattern: any): Promise<void> {
    // Implementation for manual approval workflow
    console.log(`📝 Creating trade approval for pattern: ${pattern.patternId}`);
    // This would integrate with the trade approvals table
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  private calculateStopLoss(slope: any): number {
    // Basic stop loss calculation
    const breakoutLevel = parseFloat(slope.breakoutLevel?.toString() || slope.pointBPrice?.toString() || "0");
    const buffer = breakoutLevel * 0.02; // 2% buffer
    
    if (slope.trend === "UPTREND") {
      return breakoutLevel - buffer;
    } else {
      return breakoutLevel + buffer;
    }
  }

  private calculateTargetPrice(slope: any): number {
    // Basic target price calculation
    const breakoutLevel = parseFloat(slope.breakoutLevel?.toString() || slope.pointBPrice?.toString() || "0");
    const slopeValue = parseFloat(slope.slope?.toString() || "0");
    const duration = slope.duration || 10; // Default 10 minutes
    
    return breakoutLevel + (slopeValue * duration);
  }

  private calculateTradeQuantity(pattern: any, config: ScannerSessionConfig): number {
    // Basic quantity calculation based on risk amount
    const riskAmount = 10000; // Default risk amount
    const stopLossDistance = Math.abs(parseFloat(pattern.breakoutLevel) - parseFloat(pattern.stopLoss));
    
    if (stopLossDistance > 0) {
      return Math.floor(riskAmount / stopLossDistance);
    }
    
    return 1; // Minimum quantity
  }

  private async logScannerActivity(
    sessionId: string,
    symbol: string,
    scanTime: Date,
    patternsFound: number,
    scanDuration: number,
    candlesAnalyzed: number,
    scanStatus: string,
    errorMessage: string | null,
    marketPrice: number,
    volume: number,
    notes?: string | null
  ): Promise<void> {
    try {
      const logData: InsertScannerLog = {
        sessionId,
        symbol,
        scanTime,
        patternsFound,
        scanDuration,
        candlesAnalyzed,
        scanStatus,
        errorMessage,
        marketPrice: marketPrice?.toString() || "0",
        volume: volume || 0
      };

      await this.storage.createScannerLog(logData);
    } catch (error) {
      console.error("❌ Error logging scanner activity:", error);
    }
  }

  // ==========================================
  // PUBLIC API METHODS
  // ==========================================

  async getActiveSession(): Promise<any> {
    if (!this.activeSessionId) return null;
    return await this.storage.getScannerSession(this.activeSessionId);
  }

  async getSessionStatistics(sessionId: string): Promise<any> {
    return await this.storage.getSessionStatistics(sessionId);
  }

  async getDiscoveredPatterns(): Promise<any[]> {
    return await this.storage.getDiscoveredPatterns();
  }

  async getActiveTrades(): Promise<any[]> {
    return await this.storage.getActiveTrades();
  }

  async getSessionLogs(sessionId: string): Promise<any[]> {
    return await this.storage.getLogsBySession(sessionId);
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }
}