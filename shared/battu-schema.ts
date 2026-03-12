import { pgTable, serial, text, timestamp, decimal, integer, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// SCANNER SESSIONS - Track scanning cycles
// ==========================================
export const scannerSessions = pgTable("scanner_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE, COMPLETED, STOPPED
  marketDate: varchar("market_date", { length: 10 }).notNull(), // YYYY-MM-DD
  totalSymbolsScanned: integer("total_symbols_scanned").default(0),
  totalPatternsFound: integer("total_patterns_found").default(0),
  totalTradesExecuted: integer("total_trades_executed").default(0),
  scanningFrequency: integer("scanning_frequency").default(60), // seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ==========================================
// SYMBOLS - List of symbols to scan
// ==========================================
export const symbols = pgTable("symbols", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  exchange: varchar("exchange", { length: 10 }).notNull(), // NSE, BSE
  isActive: boolean("is_active").default(true),
  lotSize: integer("lot_size").default(1),
  tickSize: decimal("tick_size", { precision: 10, scale: 2 }).default("0.05"),
  priority: integer("priority").default(1), // 1=High, 2=Medium, 3=Low
  createdAt: timestamp("created_at").defaultNow()
});

// ==========================================
// VALID PATTERNS - Store discovered patterns
// ==========================================
export const validPatterns = pgTable("valid_patterns", {
  id: serial("id").primaryKey(),
  patternId: varchar("pattern_id", { length: 100 }).notNull().unique(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  timeframe: varchar("timeframe", { length: 10 }).notNull(), // 5, 10, 15, 30
  
  // Pattern Details
  patternType: varchar("pattern_type", { length: 50 }).notNull(), // 1-3, 1-4, 2-3, 2-4
  trend: varchar("trend", { length: 10 }).notNull(), // UPTREND, DOWNTREND
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100
  
  // Price Levels
  pointAPrice: decimal("point_a_price", { precision: 12, scale: 2 }).notNull(),
  pointBPrice: decimal("point_b_price", { precision: 12, scale: 2 }).notNull(),
  breakoutLevel: decimal("breakout_level", { precision: 12, scale: 2 }).notNull(),
  stopLoss: decimal("stop_loss", { precision: 12, scale: 2 }).notNull(),
  targetPrice: decimal("target_price", { precision: 12, scale: 2 }).notNull(),
  
  // Timestamps
  pointATime: timestamp("point_a_time").notNull(),
  pointBTime: timestamp("point_b_time").notNull(),
  patternFoundAt: timestamp("pattern_found_at").notNull(),
  
  // Technical Data
  slope: decimal("slope", { precision: 10, scale: 6 }), // points per minute
  duration: integer("duration"), // minutes between Point A and B
  candleData: jsonb("candle_data"), // Store 4-candle OHLC data
  oneMinuteData: jsonb("one_minute_data"), // Store 1-minute breakdown
  
  // Pattern Status
  status: varchar("status", { length: 20 }).notNull().default("DISCOVERED"), // DISCOVERED, READY_TO_TRADE, EXECUTED, EXPIRED
  isValid: boolean("is_valid").default(true),
  expiryTime: timestamp("expiry_time"),
  
  // Risk Management
  riskAmount: decimal("risk_amount", { precision: 12, scale: 2 }),
  riskPercentage: decimal("risk_percentage", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ==========================================
// EXECUTED TRADES - Track trade execution
// ==========================================
export const executedTrades = pgTable("executed_trades", {
  id: serial("id").primaryKey(),
  tradeId: varchar("trade_id", { length: 100 }).notNull().unique(),
  patternId: varchar("pattern_id", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  
  // Order Details
  orderType: varchar("order_type", { length: 20 }).notNull(), // BUY, SELL
  orderPrice: decimal("order_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  orderStatus: varchar("order_status", { length: 20 }).notNull(), // PENDING, FILLED, CANCELLED, REJECTED
  
  // Execution Details
  entryPrice: decimal("entry_price", { precision: 12, scale: 2 }),
  entryTime: timestamp("entry_time"),
  exitPrice: decimal("exit_price", { precision: 12, scale: 2 }),
  exitTime: timestamp("exit_time"),
  exitReason: varchar("exit_reason", { length: 50 }), // TARGET_HIT, STOP_LOSS, TIMEOUT, MANUAL
  
  // P&L Calculation
  grossPnl: decimal("gross_pnl", { precision: 12, scale: 2 }),
  charges: decimal("charges", { precision: 10, scale: 2 }),
  netPnl: decimal("net_pnl", { precision: 12, scale: 2 }),
  
  // Trade Management
  stopLossPrice: decimal("stop_loss_price", { precision: 12, scale: 2 }),
  targetPrice: decimal("target_price", { precision: 12, scale: 2 }),
  tradeStatus: varchar("trade_status", { length: 20 }).notNull().default("ACTIVE"), // ACTIVE, CLOSED, CANCELLED
  
  // Additional Details
  brokerage: decimal("brokerage", { precision: 10, scale: 2 }),
  orderRef: varchar("order_ref", { length: 100 }), // Broker order reference
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ==========================================
// SCANNER LOGS - Track scanning activity
// ==========================================
export const scannerLogs = pgTable("scanner_logs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  scanTime: timestamp("scan_time").notNull(),
  
  // Scan Results
  patternsFound: integer("patterns_found").default(0),
  scanDuration: integer("scan_duration"), // milliseconds
  candlesAnalyzed: integer("candles_analyzed"),
  
  // Status
  scanStatus: varchar("scan_status", { length: 20 }).notNull(), // SUCCESS, ERROR, SKIPPED
  errorMessage: text("error_message"),
  
  // Market Data
  marketPrice: decimal("market_price", { precision: 12, scale: 2 }),
  volume: integer("volume"),
  
  createdAt: timestamp("created_at").defaultNow()
});

// ==========================================
// SCANNER CONFIGURATION
// ==========================================
export const scannerConfig = pgTable("scanner_config", {
  id: serial("id").primaryKey(),
  configName: varchar("config_name", { length: 100 }).notNull().unique(),
  
  // Scanning Settings
  scanningFrequency: integer("scanning_frequency").default(60), // seconds
  maxSymbolsPerScan: integer("max_symbols_per_scan").default(50),
  timeframes: jsonb("timeframes").default(['5', '10', '15']), // Array of timeframes
  
  // Pattern Settings
  minConfidence: decimal("min_confidence", { precision: 5, scale: 2 }).default("70.00"),
  maxPatternsPerSymbol: integer("max_patterns_per_symbol").default(3),
  patternExpiryMinutes: integer("pattern_expiry_minutes").default(240), // 4 hours
  
  // Risk Settings
  defaultRiskAmount: decimal("default_risk_amount", { precision: 12, scale: 2 }).default("10000.00"),
  maxRiskPerTrade: decimal("max_risk_per_trade", { precision: 12, scale: 2 }).default("25000.00"),
  maxDailyRisk: decimal("max_daily_risk", { precision: 12, scale: 2 }).default("100000.00"),
  
  // Market Hours
  marketStartTime: varchar("market_start_time", { length: 8 }).default("09:15:00"),
  marketEndTime: varchar("market_end_time", { length: 8 }).default("15:30:00"),
  
  // Auto Trading
  autoTradingEnabled: boolean("auto_trading_enabled").default(false),
  requireManualApproval: boolean("require_manual_approval").default(true),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ==========================================
// TRADE APPROVALS - Manual trade approval system
// ==========================================
export const tradeApprovals = pgTable("trade_approvals", {
  id: serial("id").primaryKey(),
  patternId: varchar("pattern_id", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  
  // Approval Status
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default("PENDING"), // PENDING, APPROVED, REJECTED
  approvedBy: varchar("approved_by", { length: 100 }),
  approvalTime: timestamp("approval_time"),
  rejectionReason: text("rejection_reason"),
  
  // Trade Details for Approval
  proposedOrderType: varchar("proposed_order_type", { length: 20 }).notNull(),
  proposedPrice: decimal("proposed_price", { precision: 12, scale: 2 }).notNull(),
  proposedQuantity: integer("proposed_quantity").notNull(),
  estimatedRisk: decimal("estimated_risk", { precision: 12, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow()
});

// ==========================================
// INSERT SCHEMAS FOR VALIDATION
// ==========================================
export const insertScannerSessionSchema = createInsertSchema(scannerSessions);
export const insertSymbolSchema = createInsertSchema(symbols);
export const insertValidPatternSchema = createInsertSchema(validPatterns);
export const insertExecutedTradeSchema = createInsertSchema(executedTrades);
export const insertScannerLogSchema = createInsertSchema(scannerLogs);
export const insertScannerConfigSchema = createInsertSchema(scannerConfig);
export const insertTradeApprovalSchema = createInsertSchema(tradeApprovals);

// ==========================================
// TYPE EXPORTS
// ==========================================
export type ScannerSession = typeof scannerSessions.$inferSelect;
export type InsertScannerSession = z.infer<typeof insertScannerSessionSchema>;

export type Symbol = typeof symbols.$inferSelect;
export type InsertSymbol = z.infer<typeof insertSymbolSchema>;

export type ValidPattern = typeof validPatterns.$inferSelect;
export type InsertValidPattern = z.infer<typeof insertValidPatternSchema>;

export type ExecutedTrade = typeof executedTrades.$inferSelect;
export type InsertExecutedTrade = z.infer<typeof insertExecutedTradeSchema>;

export type ScannerLog = typeof scannerLogs.$inferSelect;
export type InsertScannerLog = z.infer<typeof insertScannerLogSchema>;

export type ScannerConfig = typeof scannerConfig.$inferSelect;
export type InsertScannerConfig = z.infer<typeof insertScannerConfigSchema>;

export type TradeApproval = typeof tradeApprovals.$inferSelect;
export type InsertTradeApproval = z.infer<typeof insertTradeApprovalSchema>;