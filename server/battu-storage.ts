import { db } from "./db";
import { 
  scannerSessions, 
  symbols, 
  validPatterns, 
  executedTrades, 
  scannerLogs, 
  scannerConfig, 
  tradeApprovals,
  type ScannerSession, 
  type InsertScannerSession,
  type Symbol, 
  type InsertSymbol,
  type ValidPattern, 
  type InsertValidPattern,
  type ExecutedTrade, 
  type InsertExecutedTrade,
  type ScannerLog, 
  type InsertScannerLog,
  type ScannerConfig, 
  type InsertScannerConfig,
  type TradeApproval, 
  type InsertTradeApproval
} from "@shared/schema";
import { eq, and, desc, asc, gte, lte, inArray } from "drizzle-orm";

export class BattuStorage {
  
  // ==========================================
  // SCANNER SESSIONS MANAGEMENT
  // ==========================================
  
  async createScannerSession(session: InsertScannerSession): Promise<ScannerSession> {
    const [newSession] = await db.insert(scannerSessions).values(session).returning();
    return newSession;
  }
  
  async getScannerSession(sessionId: string): Promise<ScannerSession | null> {
    const [session] = await db.select().from(scannerSessions).where(eq(scannerSessions.sessionId, sessionId)).limit(1);
    return session || null;
  }
  
  async updateScannerSession(sessionId: string, updates: Partial<InsertScannerSession>): Promise<ScannerSession | null> {
    const [updated] = await db
      .update(scannerSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scannerSessions.sessionId, sessionId))
      .returning();
    return updated || null;
  }
  
  async getActiveScannerSessions(): Promise<ScannerSession[]> {
    return await db.select().from(scannerSessions).where(eq(scannerSessions.status, "ACTIVE")).orderBy(desc(scannerSessions.startTime));
  }
  
  async getSessionsByDate(marketDate: string): Promise<ScannerSession[]> {
    return await db.select().from(scannerSessions).where(eq(scannerSessions.marketDate, marketDate)).orderBy(desc(scannerSessions.startTime));
  }
  
  // ==========================================
  // SYMBOLS MANAGEMENT
  // ==========================================
  
  async createSymbol(symbol: InsertSymbol): Promise<Symbol> {
    const [newSymbol] = await db.insert(symbols).values(symbol).returning();
    return newSymbol;
  }
  
  async getSymbol(symbol: string): Promise<Symbol | null> {
    const [found] = await db.select().from(symbols).where(eq(symbols.symbol, symbol)).limit(1);
    return found || null;
  }
  
  async getActiveSymbols(): Promise<Symbol[]> {
    return await db.select().from(symbols).where(eq(symbols.isActive, true)).orderBy(asc(symbols.priority), asc(symbols.symbol));
  }
  
  async updateSymbol(symbol: string, updates: Partial<InsertSymbol>): Promise<Symbol | null> {
    const [updated] = await db
      .update(symbols)
      .set(updates)
      .where(eq(symbols.symbol, symbol))
      .returning();
    return updated || null;
  }
  
  async bulkCreateSymbols(symbolList: InsertSymbol[]): Promise<Symbol[]> {
    return await db.insert(symbols).values(symbolList).onConflictDoNothing().returning();
  }
  
  // ==========================================
  // VALID PATTERNS MANAGEMENT
  // ==========================================
  
  async createValidPattern(pattern: InsertValidPattern): Promise<ValidPattern> {
    const [newPattern] = await db.insert(validPatterns).values(pattern).returning();
    return newPattern;
  }
  
  async getValidPattern(patternId: string): Promise<ValidPattern | null> {
    const [pattern] = await db.select().from(validPatterns).where(eq(validPatterns.patternId, patternId)).limit(1);
    return pattern || null;
  }
  
  async getPatternsBySession(sessionId: string): Promise<ValidPattern[]> {
    return await db.select().from(validPatterns).where(eq(validPatterns.sessionId, sessionId)).orderBy(desc(validPatterns.patternFoundAt));
  }
  
  async getPatternsBySymbol(symbol: string, status?: string): Promise<ValidPattern[]> {
    const conditions = [eq(validPatterns.symbol, symbol)];
    if (status) {
      conditions.push(eq(validPatterns.status, status));
    }
    return await db.select().from(validPatterns).where(and(...conditions)).orderBy(desc(validPatterns.patternFoundAt));
  }
  
  async getDiscoveredPatterns(): Promise<ValidPattern[]> {
    return await db.select().from(validPatterns).where(eq(validPatterns.status, "DISCOVERED")).orderBy(desc(validPatterns.confidence), desc(validPatterns.patternFoundAt));
  }
  
  async getReadyToTradePatterns(): Promise<ValidPattern[]> {
    return await db.select().from(validPatterns).where(eq(validPatterns.status, "READY_TO_TRADE")).orderBy(desc(validPatterns.confidence));
  }
  
  async updateValidPattern(patternId: string, updates: Partial<InsertValidPattern>): Promise<ValidPattern | null> {
    const [updated] = await db
      .update(validPatterns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(validPatterns.patternId, patternId))
      .returning();
    return updated || null;
  }
  
  async expireOldPatterns(expiryTime: Date): Promise<number> {
    const result = await db
      .update(validPatterns)
      .set({ status: "EXPIRED", isValid: false, updatedAt: new Date() })
      .where(and(
        lte(validPatterns.expiryTime, expiryTime),
        eq(validPatterns.isValid, true)
      ));
    return result.rowCount || 0;
  }
  
  // ==========================================
  // EXECUTED TRADES MANAGEMENT
  // ==========================================
  
  async createExecutedTrade(trade: InsertExecutedTrade): Promise<ExecutedTrade> {
    const [newTrade] = await db.insert(executedTrades).values(trade).returning();
    return newTrade;
  }
  
  async getExecutedTrade(tradeId: string): Promise<ExecutedTrade | null> {
    const [trade] = await db.select().from(executedTrades).where(eq(executedTrades.tradeId, tradeId)).limit(1);
    return trade || null;
  }
  
  async getTradesByPattern(patternId: string): Promise<ExecutedTrade[]> {
    return await db.select().from(executedTrades).where(eq(executedTrades.patternId, patternId)).orderBy(desc(executedTrades.createdAt));
  }
  
  async getTradesBySession(sessionId: string): Promise<ExecutedTrade[]> {
    return await db.select().from(executedTrades).where(eq(executedTrades.sessionId, sessionId)).orderBy(desc(executedTrades.createdAt));
  }
  
  async getActiveTrades(): Promise<ExecutedTrade[]> {
    return await db.select().from(executedTrades).where(eq(executedTrades.tradeStatus, "ACTIVE")).orderBy(desc(executedTrades.entryTime));
  }
  
  async updateExecutedTrade(tradeId: string, updates: Partial<InsertExecutedTrade>): Promise<ExecutedTrade | null> {
    const [updated] = await db
      .update(executedTrades)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(executedTrades.tradeId, tradeId))
      .returning();
    return updated || null;
  }
  
  async getTradesBySymbol(symbol: string, limit?: number): Promise<ExecutedTrade[]> {
    const query = db.select().from(executedTrades).where(eq(executedTrades.symbol, symbol)).orderBy(desc(executedTrades.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }
  
  async getTotalPnLBySession(sessionId: string): Promise<{ totalPnL: number; totalTrades: number }> {
    const trades = await db.select().from(executedTrades).where(eq(executedTrades.sessionId, sessionId));
    const totalPnL = trades.reduce((sum, trade) => sum + (parseFloat(trade.netPnl?.toString() || "0")), 0);
    return { totalPnL, totalTrades: trades.length };
  }
  
  // ==========================================
  // SCANNER LOGS MANAGEMENT
  // ==========================================
  
  async createScannerLog(log: InsertScannerLog): Promise<ScannerLog> {
    const [newLog] = await db.insert(scannerLogs).values(log).returning();
    return newLog;
  }
  
  async getLogsBySession(sessionId: string): Promise<ScannerLog[]> {
    return await db.select().from(scannerLogs).where(eq(scannerLogs.sessionId, sessionId)).orderBy(desc(scannerLogs.scanTime));
  }
  
  async getLogsBySymbol(symbol: string, limit?: number): Promise<ScannerLog[]> {
    const query = db.select().from(scannerLogs).where(eq(scannerLogs.symbol, symbol)).orderBy(desc(scannerLogs.scanTime));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }
  
  async getRecentLogs(limit: number = 100): Promise<ScannerLog[]> {
    return await db.select().from(scannerLogs).orderBy(desc(scannerLogs.scanTime)).limit(limit);
  }
  
  async getErrorLogs(sessionId?: string): Promise<ScannerLog[]> {
    const conditions = [eq(scannerLogs.scanStatus, "ERROR")];
    if (sessionId) {
      conditions.push(eq(scannerLogs.sessionId, sessionId));
    }
    return await db.select().from(scannerLogs).where(and(...conditions)).orderBy(desc(scannerLogs.scanTime));
  }
  
  // ==========================================
  // SCANNER CONFIGURATION MANAGEMENT
  // ==========================================
  
  async createScannerConfig(config: InsertScannerConfig): Promise<ScannerConfig> {
    const [newConfig] = await db.insert(scannerConfig).values(config).returning();
    return newConfig;
  }
  
  async getScannerConfig(configName: string): Promise<ScannerConfig | null> {
    const [config] = await db.select().from(scannerConfig).where(eq(scannerConfig.configName, configName)).limit(1);
    return config || null;
  }
  
  async getActiveScannerConfig(): Promise<ScannerConfig | null> {
    const [config] = await db.select().from(scannerConfig).where(eq(scannerConfig.isActive, true)).limit(1);
    return config || null;
  }
  
  async updateScannerConfig(configName: string, updates: Partial<InsertScannerConfig>): Promise<ScannerConfig | null> {
    const [updated] = await db
      .update(scannerConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scannerConfig.configName, configName))
      .returning();
    return updated || null;
  }
  
  async getAllScannerConfigs(): Promise<ScannerConfig[]> {
    return await db.select().from(scannerConfig).orderBy(desc(scannerConfig.createdAt));
  }
  
  // ==========================================
  // TRADE APPROVALS MANAGEMENT
  // ==========================================
  
  async createTradeApproval(approval: InsertTradeApproval): Promise<TradeApproval> {
    const [newApproval] = await db.insert(tradeApprovals).values(approval).returning();
    return newApproval;
  }
  
  async getTradeApproval(patternId: string): Promise<TradeApproval | null> {
    const [approval] = await db.select().from(tradeApprovals).where(eq(tradeApprovals.patternId, patternId)).limit(1);
    return approval || null;
  }
  
  async getPendingApprovals(): Promise<TradeApproval[]> {
    return await db.select().from(tradeApprovals).where(eq(tradeApprovals.approvalStatus, "PENDING")).orderBy(desc(tradeApprovals.createdAt));
  }
  
  async updateTradeApproval(patternId: string, updates: Partial<InsertTradeApproval>): Promise<TradeApproval | null> {
    const [updated] = await db
      .update(tradeApprovals)
      .set(updates)
      .where(eq(tradeApprovals.patternId, patternId))
      .returning();
    return updated || null;
  }
  
  async approveTradeApproval(patternId: string, approvedBy: string): Promise<TradeApproval | null> {
    return await this.updateTradeApproval(patternId, {
      approvalStatus: "APPROVED",
      approvedBy,
      approvalTime: new Date()
    });
  }
  
  async rejectTradeApproval(patternId: string, rejectionReason: string): Promise<TradeApproval | null> {
    return await this.updateTradeApproval(patternId, {
      approvalStatus: "REJECTED",
      rejectionReason
    });
  }
  
  // ==========================================
  // UTILITY METHODS
  // ==========================================
  
  async getSessionStatistics(sessionId: string): Promise<{
    session: ScannerSession | null;
    totalPatterns: number;
    totalTrades: number;
    totalPnL: number;
    symbolsScanned: number;
    scanDuration: number;
  }> {
    const session = await this.getScannerSession(sessionId);
    const patterns = await this.getPatternsBySession(sessionId);
    const trades = await this.getTradesBySession(sessionId);
    const logs = await this.getLogsBySession(sessionId);
    
    const totalPnL = trades.reduce((sum, trade) => sum + (parseFloat(trade.netPnl?.toString() || "0")), 0);
    const uniqueSymbols = new Set(logs.map(log => log.symbol)).size;
    const scanDuration = session ? (session.endTime ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime() : Date.now() - new Date(session.startTime).getTime()) : 0;
    
    return {
      session,
      totalPatterns: patterns.length,
      totalTrades: trades.length,
      totalPnL,
      symbolsScanned: uniqueSymbols,
      scanDuration: Math.floor(scanDuration / 1000) // seconds
    };
  }
  
  async getSymbolPerformance(symbol: string): Promise<{
    totalPatterns: number;
    totalTrades: number;
    successfulTrades: number;
    totalPnL: number;
    avgPnL: number;
    successRate: number;
  }> {
    const patterns = await this.getPatternsBySymbol(symbol);
    const trades = await this.getTradesBySymbol(symbol);
    
    const successfulTrades = trades.filter(trade => parseFloat(trade.netPnl?.toString() || "0") > 0);
    const totalPnL = trades.reduce((sum, trade) => sum + (parseFloat(trade.netPnl?.toString() || "0")), 0);
    const avgPnL = trades.length > 0 ? totalPnL / trades.length : 0;
    const successRate = trades.length > 0 ? (successfulTrades.length / trades.length) * 100 : 0;
    
    return {
      totalPatterns: patterns.length,
      totalTrades: trades.length,
      successfulTrades: successfulTrades.length,
      totalPnL,
      avgPnL,
      successRate
    };
  }
  
  async cleanupExpiredData(daysOld: number = 30): Promise<{
    sessionsDeleted: number;
    patternsExpired: number;
    logsDeleted: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Expire old patterns
    const patternsExpired = await this.expireOldPatterns(cutoffDate);
    
    // Note: In a production system, you might want to actually delete old data
    // For now, we just expire patterns and return statistics
    
    return {
      sessionsDeleted: 0, // Would implement actual deletion if needed
      patternsExpired,
      logsDeleted: 0 // Would implement actual deletion if needed
    };
  }
}