import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const apiStatus = pgTable("api_status", {
  id: serial("id").primaryKey(),
  connected: boolean("connected").notNull().default(false),
  authenticated: boolean("authenticated").notNull().default(false),
  lastUpdate: timestamp("last_update").notNull().defaultNow(),
  version: text("version").notNull().default("v3.0.0"),
  dailyLimit: integer("daily_limit").notNull().default(100000),
  requestsUsed: integer("requests_used").notNull().default(0),
  websocketActive: boolean("websocket_active").notNull().default(false),
  responseTime: integer("response_time").notNull().default(0),
  successRate: real("success_rate").notNull().default(0),
  throughput: text("throughput").notNull().default("0 MB/s"),
  activeSymbols: integer("active_symbols").notNull().default(0),
  updatesPerSec: integer("updates_per_sec").notNull().default(0),
  uptime: real("uptime").notNull().default(0),
  latency: integer("latency").notNull().default(0),
  accessToken: text("access_token"), // Store persistent access token
  tokenExpiry: timestamp("token_expiry"), // Track token expiration
});

export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  ltp: real("ltp").notNull(),
  change: real("change").notNull(),
  changePercent: real("change_percent").notNull(),
  lastUpdate: timestamp("last_update").notNull().defaultNow(),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(), // 'success', 'info', 'warning', 'error'
  message: text("message").notNull(),
});

export * from "./models/chat";

// Analysis Instructions table for custom data processing
export const analysisInstructions = pgTable("analysis_instructions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  instructions: jsonb("instructions").$type<AnalysisStep[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Analysis Results table to store processed data
export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  instructionId: integer("instruction_id").notNull().references(() => analysisInstructions.id),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  dateRange: text("date_range").notNull(),
  inputData: jsonb("input_data").$type<any[]>().notNull(),
  processedData: jsonb("processed_data").$type<any>().notNull(),
  metadata: jsonb("metadata").$type<AnalysisMetadata>(),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Social Feed Posts table
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  authorUsername: text("author_username").notNull(),
  authorDisplayName: text("author_display_name").notNull(),
  authorAvatar: text("author_avatar"),
  authorVerified: boolean("author_verified").notNull().default(false),
  authorFollowers: integer("author_followers").default(0),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  reposts: integer("reposts").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  stockMentions: jsonb("stock_mentions").$type<string[]>().notNull().default([]),
  sentiment: text("sentiment"), // 'bullish', 'bearish', 'neutral'
  hasImage: boolean("has_image").notNull().default(false),
  imageUrl: text("image_url"),
  isAudioPost: boolean("is_audio_post").notNull().default(false),
  selectedPostIds: jsonb("selected_post_ids").$type<(string | number)[]>().default([]),
  selectedPosts: jsonb("selected_posts").$type<Array<{ id: string | number; content: string }>>().default([]),
  metadata: jsonb("metadata").$type<any>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Social Post Likes - Track which users liked which posts
export const socialPostLikes = pgTable("social_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  userEmail: text("user_email").notNull(), // Using email as user identifier (from Firebase)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Social Post Comments - Store comments on posts
export const socialPostComments = pgTable("social_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  userEmail: text("user_email").notNull(), // User who commented
  username: text("username").notNull(), // Display username
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Social Post Reposts - Track who reposted which posts
export const socialPostReposts = pgTable("social_post_reposts", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  userEmail: text("user_email").notNull(), // User who reposted
  username: text("username").notNull(), // Display username
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User Follows - Track user follow relationships
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerEmail: text("follower_email").notNull(), // User who is following
  followingEmail: text("following_email").notNull(), // User being followed
  followingUsername: text("following_username").notNull(), // Username of the person being followed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Historical Data Backup - Top 50 Stocks OHLC Data Storage
export const historicalBackupData = pgTable("historical_backup_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(), // NSE:ICICIBANK-EQ, NSE:RELIANCE-EQ, etc.
  timeframe: text("timeframe").notNull(), // '1', '5', '15', '60', '1D'
  date: text("date").notNull(), // YYYY-MM-DD format
  ohlcData: jsonb("ohlc_data").$type<CandleData[]>().notNull(), // Array of OHLC candles
  candleCount: integer("candle_count").notNull().default(0), // Number of candles stored
  dataSource: text("data_source").notNull().default('fyers'), // 'fyers' or 'backup'
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Index for fast lookups by symbol, timeframe, and date
export const historicalBackupIndex = pgTable("historical_backup_index", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  availableDates: jsonb("available_dates").$type<string[]>().notNull().default([]),
  totalCandles: integer("total_candles").notNull().default(0),
  oldestDate: text("oldest_date"),
  newestDate: text("newest_date"),
  lastSynced: timestamp("last_synced").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Backup Sync Status - Track fetching and sync operations
export const backupSyncStatus = pgTable("backup_sync_status", {
  id: serial("id").primaryKey(),
  operationType: text("operation_type").notNull(), // 'full_sync', 'incremental_update', 'single_stock'
  status: text("status").notNull(), // 'running', 'completed', 'failed', 'paused'
  totalSymbols: integer("total_symbols").notNull().default(0),
  processedSymbols: integer("processed_symbols").notNull().default(0),
  currentSymbol: text("current_symbol"),
  currentTimeframe: text("current_timeframe"),
  errors: jsonb("errors").$type<string[]>().notNull().default([]),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  estimatedCompletion: timestamp("estimated_completion"),
});

// Livestream Settings - Singleton document for YouTube banner URL
export const livestreamSettings = pgTable("livestream_settings", {
  id: serial("id").primaryKey(),
  youtubeUrl: text("youtube_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Verified Reports - Public shareable trading reports (7-day expiry)
export const verifiedReports = pgTable("verified_reports", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").notNull().unique(), // Unique shareable ID (nanoid)
  userId: text("user_id").notNull(), // Firebase user ID
  username: text("username").notNull(), // Display username
  reportData: jsonb("report_data").$type<VerifiedReportData>().notNull(), // Full report data
  shareUrl: text("share_url").notNull(), // Full shareable URL
  views: integer("views").notNull().default(0), // Track how many times viewed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 7 days from creation
});

// Define analysis step types
export interface AnalysisStep {
  id: string;
  type: 'filter' | 'calculate' | 'aggregate' | 'transform' | 'condition' | 'pattern';
  name: string;
  description: string;
  parameters: Record<string, any>;
  output?: string;
}

export interface AnalysisMetadata {
  executionTime: number;
  dataPoints: number;
  errors?: string[];
  warnings?: string[];
}

// OHLC Candle Data Interface for Historical Data Backup
export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Verified Report Data Interface
export interface VerifiedReportData {
  // Heatmap data - trading calendar
  tradingDataByDate: Record<string, any>;
  
  // Performance metrics
  totalPnL: number;
  totalTrades: number;
  winRate: number;
  fomoCount: number;
  maxStreak: number;
  
  // User info
  userId: string;
  username: string;
  tagline?: string;
  
  // Timestamp
  generatedAt: string;
}

// Authorized Emails table to manage access to restricted features
export const authorizedEmails = pgTable("authorized_emails", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("developer"), // 'admin', 'developer'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin Access table (as requested by user)
export const adminAccess = pgTable("access_admin", {
  id: serial("id").primaryKey(),
  emailId: text("email_id").notNull(),
  roles: text("roles").notNull(), // 'admin', 'developer'
  date: timestamp("date").notNull().defaultNow(),
  revokeDate: timestamp("revoke_date"),
});

export const insertAuthorizedEmailSchema = createInsertSchema(authorizedEmails).omit({
  id: true,
  createdAt: true,
});

export const insertAdminAccessSchema = createInsertSchema(adminAccess).omit({
  id: true,
  date: true,
});

export type AuthorizedEmail = typeof authorizedEmails.$inferSelect;
export type InsertAuthorizedEmail = z.infer<typeof insertAuthorizedEmailSchema>;
export type AdminAccess = typeof adminAccess.$inferSelect;
export type InsertAdminAccess = z.infer<typeof insertAdminAccessSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertApiStatusSchema = createInsertSchema(apiStatus).omit({
  id: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
});

export const insertAnalysisInstructionsSchema = createInsertSchema(analysisInstructions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisResultsSchema = createInsertSchema(analysisResults).omit({
  id: true,
  executedAt: true,
  createdAt: true,
});

// Historical Data Backup Insert Schemas
export const insertHistoricalBackupDataSchema = createInsertSchema(historicalBackupData).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertHistoricalBackupIndexSchema = createInsertSchema(historicalBackupIndex).omit({
  id: true,
  lastSynced: true,
});

export const insertBackupSyncStatusSchema = createInsertSchema(backupSyncStatus).omit({
  id: true,
  startedAt: true,
});

export const insertLivestreamSettingsSchema = createInsertSchema(livestreamSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertVerifiedReportSchema = createInsertSchema(verifiedReports).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertHistoricalBackupData = z.infer<typeof insertHistoricalBackupDataSchema>;
export type InsertHistoricalBackupIndex = z.infer<typeof insertHistoricalBackupIndexSchema>;
export type InsertBackupSyncStatus = z.infer<typeof insertBackupSyncStatusSchema>;
export type LivestreamSettings = typeof livestreamSettings.$inferSelect;
export type InsertLivestreamSettings = z.infer<typeof insertLivestreamSettingsSchema>;
export type VerifiedReport = typeof verifiedReports.$inferSelect;
export type InsertVerifiedReport = z.infer<typeof insertVerifiedReportSchema>;

// ==========================================
// BATTU SCANNER SCHEMA - Integrated for DB Migration
// ==========================================

// Scanner Sessions
export const scannerSessions = pgTable("scanner_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  marketDate: varchar("market_date", { length: 10 }).notNull(),
  totalSymbolsScanned: integer("total_symbols_scanned").default(0),
  totalPatternsFound: integer("total_patterns_found").default(0),
  totalTradesExecuted: integer("total_trades_executed").default(0),
  scanningFrequency: integer("scanning_frequency").default(60),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Symbols to scan
export const symbols = pgTable("symbols", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  exchange: varchar("exchange", { length: 10 }).notNull(),
  isActive: boolean("is_active").default(true),
  lotSize: integer("lot_size").default(1),
  tickSize: decimal("tick_size", { precision: 10, scale: 2 }).default("0.05"),
  priority: integer("priority").default(1),
  createdAt: timestamp("created_at").defaultNow()
});

// Valid patterns discovered
export const validPatterns = pgTable("valid_patterns", {
  id: serial("id").primaryKey(),
  patternId: varchar("pattern_id", { length: 100 }).notNull().unique(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  timeframe: varchar("timeframe", { length: 10 }).notNull(),
  patternType: varchar("pattern_type", { length: 50 }).notNull(),
  trend: varchar("trend", { length: 10 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  pointAPrice: decimal("point_a_price", { precision: 12, scale: 2 }).notNull(),
  pointBPrice: decimal("point_b_price", { precision: 12, scale: 2 }).notNull(),
  breakoutLevel: decimal("breakout_level", { precision: 12, scale: 2 }).notNull(),
  stopLoss: decimal("stop_loss", { precision: 12, scale: 2 }).notNull(),
  targetPrice: decimal("target_price", { precision: 12, scale: 2 }).notNull(),
  pointATime: timestamp("point_a_time").notNull(),
  pointBTime: timestamp("point_b_time").notNull(),
  patternFoundAt: timestamp("pattern_found_at").notNull(),
  slope: decimal("slope", { precision: 10, scale: 6 }),
  duration: integer("duration"),
  candleData: jsonb("candle_data"),
  oneMinuteData: jsonb("one_minute_data"),
  status: varchar("status", { length: 20 }).notNull().default("DISCOVERED"),
  isValid: boolean("is_valid").default(true),
  expiryTime: timestamp("expiry_time"),
  riskAmount: decimal("risk_amount", { precision: 12, scale: 2 }),
  riskPercentage: decimal("risk_percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Executed trades
export const executedTrades = pgTable("executed_trades", {
  id: serial("id").primaryKey(),
  tradeId: varchar("trade_id", { length: 100 }).notNull().unique(),
  patternId: varchar("pattern_id", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  orderType: varchar("order_type", { length: 20 }).notNull(),
  orderPrice: decimal("order_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  orderStatus: varchar("order_status", { length: 20 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 12, scale: 2 }),
  entryTime: timestamp("entry_time"),
  exitPrice: decimal("exit_price", { precision: 12, scale: 2 }),
  exitTime: timestamp("exit_time"),
  exitReason: varchar("exit_reason", { length: 50 }),
  grossPnl: decimal("gross_pnl", { precision: 12, scale: 2 }),
  charges: decimal("charges", { precision: 10, scale: 2 }),
  netPnl: decimal("net_pnl", { precision: 12, scale: 2 }),
  stopLossPrice: decimal("stop_loss_price", { precision: 12, scale: 2 }),
  targetPrice: decimal("target_price", { precision: 12, scale: 2 }),
  tradeStatus: varchar("trade_status", { length: 20 }).notNull().default("ACTIVE"),
  brokerage: decimal("brokerage", { precision: 10, scale: 2 }),
  orderRef: varchar("order_ref", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Scanner logs
export const scannerLogs = pgTable("scanner_logs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  scanTime: timestamp("scan_time").notNull(),
  patternsFound: integer("patterns_found").default(0),
  scanDuration: integer("scan_duration"),
  candlesAnalyzed: integer("candles_analyzed"),
  scanStatus: varchar("scan_status", { length: 20 }).notNull(),
  errorMessage: text("error_message"),
  marketPrice: decimal("market_price", { precision: 12, scale: 2 }),
  volume: integer("volume"),
  createdAt: timestamp("created_at").defaultNow()
});

// Scanner configuration
export const scannerConfig = pgTable("scanner_config", {
  id: serial("id").primaryKey(),
  configName: varchar("config_name", { length: 100 }).notNull().unique(),
  scanningFrequency: integer("scanning_frequency").default(60),
  maxSymbolsPerScan: integer("max_symbols_per_scan").default(50),
  timeframes: jsonb("timeframes").default(['5', '10', '15']),
  minConfidence: decimal("min_confidence", { precision: 5, scale: 2 }).default("70.00"),
  maxPatternsPerSymbol: integer("max_patterns_per_symbol").default(3),
  patternExpiryMinutes: integer("pattern_expiry_minutes").default(240),
  defaultRiskAmount: decimal("default_risk_amount", { precision: 12, scale: 2 }).default("10000.00"),
  maxRiskPerTrade: decimal("max_risk_per_trade", { precision: 12, scale: 2 }).default("25000.00"),
  maxDailyRisk: decimal("max_daily_risk", { precision: 12, scale: 2 }).default("100000.00"),
  marketStartTime: varchar("market_start_time", { length: 8 }).default("09:15:00"),
  marketEndTime: varchar("market_end_time", { length: 8 }).default("15:30:00"),
  autoTradingEnabled: boolean("auto_trading_enabled").default(false),
  requireManualApproval: boolean("require_manual_approval").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Trade approvals
export const tradeApprovals = pgTable("trade_approvals", {
  id: serial("id").primaryKey(),
  patternId: varchar("pattern_id", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default("PENDING"),
  approvedBy: varchar("approved_by", { length: 100 }),
  approvalTime: timestamp("approval_time"),
  rejectionReason: text("rejection_reason"),
  proposedOrderType: varchar("proposed_order_type", { length: 20 }).notNull(),
  proposedPrice: decimal("proposed_price", { precision: 12, scale: 2 }).notNull(),
  proposedQuantity: integer("proposed_quantity").notNull(),
  estimatedRisk: decimal("estimated_risk", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas for validation
export const insertScannerSessionSchema = createInsertSchema(scannerSessions);
export const insertSymbolSchema = createInsertSchema(symbols);
export const insertValidPatternSchema = createInsertSchema(validPatterns);
export const insertExecutedTradeSchema = createInsertSchema(executedTrades);
export const insertScannerLogSchema = createInsertSchema(scannerLogs);
export const insertScannerConfigSchema = createInsertSchema(scannerConfig);
export const insertTradeApprovalSchema = createInsertSchema(tradeApprovals);
export const insertSocialPostSchema = createInsertSchema(socialPosts);

// ==========================================
// PROFESSIONAL PORTFOLIO MANAGEMENT SYSTEM
// Transform from "learning platform" to "trading intelligence platform"
// ==========================================

// User Portfolios - Multiple portfolios per user
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // "Growth Portfolio", "Day Trading", etc.
  description: text("description"),
  initialCapital: decimal("initial_capital", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).notNull(),
  totalPnL: decimal("total_pnl", { precision: 15, scale: 2 }).notNull().default("0"),
  totalPnLPercent: real("total_pnl_percent").notNull().default(0),
  dayPnL: decimal("day_pnl", { precision: 15, scale: 2 }).notNull().default("0"),
  dayPnLPercent: real("day_pnl_percent").notNull().default(0),
  portfolioType: text("portfolio_type").notNull().default("equity"), // equity, derivatives, hybrid
  riskLevel: text("risk_level").notNull().default("moderate"), // conservative, moderate, aggressive
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Portfolio Holdings - Individual positions
export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  symbol: text("symbol").notNull(), // NSE:RELIANCE-EQ
  quantity: integer("quantity").notNull(),
  averagePrice: decimal("average_price", { precision: 12, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 12, scale: 2 }).notNull(),
  investedAmount: decimal("invested_amount", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).notNull(),
  unrealizedPnL: decimal("unrealized_pnl", { precision: 15, scale: 2 }).notNull(),
  unrealizedPnLPercent: real("unrealized_pnl_percent").notNull(),
  dayChange: decimal("day_change", { precision: 15, scale: 2 }).notNull().default("0"),
  dayChangePercent: real("day_change_percent").notNull().default(0),
  sector: text("sector"), // Technology, Banking, Pharma, etc.
  marketCap: text("market_cap"), // Large, Mid, Small
  beta: real("beta"), // Stock volatility vs market
  pe: real("pe"), // Price to Earnings ratio
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Trade History - All executed trades
export const tradeHistory = pgTable("trade_history", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  tradeType: text("trade_type").notNull(), // BUY, SELL
  orderType: text("order_type").notNull(), // MARKET, LIMIT, STOP_LOSS
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  brokerage: decimal("brokerage", { precision: 10, scale: 2 }).notNull().default("0"),
  taxes: decimal("taxes", { precision: 10, scale: 2 }).notNull().default("0"),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).notNull(),
  pnlRealized: decimal("pnl_realized", { precision: 15, scale: 2 }), // For SELL orders
  pnlPercent: real("pnl_percent"), // For SELL orders
  tradeStrategy: text("trade_strategy"), // BATTU Pattern, Manual, AI Signal
  patternId: text("pattern_id"), // Link to BATTU pattern
  notes: text("notes"),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Risk Analytics - Professional risk metrics
export const portfolioRiskAnalytics = pgTable("portfolio_risk_analytics", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  
  // Risk Metrics
  valueAtRisk: decimal("value_at_risk", { precision: 15, scale: 2 }), // VaR 1-day 95%
  expectedShortfall: decimal("expected_shortfall", { precision: 15, scale: 2 }), // Conditional VaR
  portfolioBeta: real("portfolio_beta"), // vs NIFTY 50
  portfolioVolatility: real("portfolio_volatility"), // Annualized std deviation
  sharpeRatio: real("sharpe_ratio"), // Risk-adjusted returns
  maxDrawdown: real("max_drawdown"), // Maximum peak-to-trough decline
  
  // Concentration Risk
  topHoldingPercent: real("top_holding_percent"), // % of largest position
  top5HoldingsPercent: real("top5_holdings_percent"), // % of top 5 positions
  sectorConcentration: jsonb("sector_concentration"), // Sector-wise breakdown
  
  // Performance Metrics
  dailyReturns: jsonb("daily_returns"), // Last 30 days returns
  monthlyReturns: jsonb("monthly_returns"), // Last 12 months
  correlation: jsonb("correlation"), // Correlation matrix with indices
  
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  isValid: boolean("is_valid").notNull().default(true),
});

// AI Research Reports - Professional market intelligence
export const aiResearchReports = pgTable("ai_research_reports", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").notNull().unique(),
  reportType: text("report_type").notNull(), // daily, weekly, sector, stock
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  
  // Report Content
  marketOutlook: text("market_outlook"), // Overall market view
  sectorAnalysis: jsonb("sector_analysis"), // Sector-wise insights
  topPicks: jsonb("top_picks"), // Recommended stocks
  riskFactors: jsonb("risk_factors"), // Key risks to watch
  technicalView: text("technical_view"), // Technical analysis
  
  // Market Data
  niftyTarget: decimal("nifty_target", { precision: 10, scale: 2 }),
  niftySupport: decimal("nifty_support", { precision: 10, scale: 2 }),
  marketSentiment: text("market_sentiment"), // bullish, bearish, neutral
  volatilityOutlook: text("volatility_outlook"), // high, medium, low
  
  // Analytics
  readCount: integer("read_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  accuracyScore: real("accuracy_score"), // Track prediction accuracy
  
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Algorithmic Signals - Professional trading alerts
export const algorithmicSignals = pgTable("algorithmic_signals", {
  id: serial("id").primaryKey(),
  signalId: text("signal_id").notNull().unique(),
  symbol: text("symbol").notNull(),
  signalType: text("signal_type").notNull(), // BUY, SELL, HOLD
  strategy: text("strategy").notNull(), // Technical, Momentum, Mean_Reversion, BATTU
  
  // Signal Details
  entryPrice: decimal("entry_price", { precision: 12, scale: 2 }).notNull(),
  targetPrice: decimal("target_price", { precision: 12, scale: 2 }),
  stopLoss: decimal("stop_loss", { precision: 12, scale: 2 }),
  confidence: real("confidence").notNull(), // 0-100
  timeframe: text("timeframe").notNull(), // 1D, 1W, 1M
  
  // Technical Indicators
  rsi: real("rsi"),
  macdSignal: text("macd_signal"), // bullish, bearish
  movingAverage: jsonb("moving_average"), // 20, 50, 200 day MAs
  supportResistance: jsonb("support_resistance"),
  volumePattern: text("volume_pattern"), // high, low, average
  
  // Fundamental Data
  peRatio: real("pe_ratio"),
  marketCap: decimal("market_cap", { precision: 15, scale: 2 }),
  earningsGrowth: real("earnings_growth"),
  revenueGrowth: real("revenue_growth"),
  
  // Status
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, TRIGGERED, EXPIRED
  triggeredAt: timestamp("triggered_at"),
  expiresAt: timestamp("expires_at").notNull(),
  performance: real("performance"), // Track signal accuracy
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema exports for new portfolio tables
export const insertPortfolioSchema = createInsertSchema(portfolios);
export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings);
export const insertTradeHistorySchema = createInsertSchema(tradeHistory);
export const insertPortfolioRiskAnalyticsSchema = createInsertSchema(portfolioRiskAnalytics);
export const insertAiResearchReportSchema = createInsertSchema(aiResearchReports);
export const insertAlgorithmicSignalSchema = createInsertSchema(algorithmicSignals);

// Type exports for BATTU schema
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
export type User = typeof users.$inferSelect;
export type ApiStatus = typeof apiStatus.$inferSelect;
export type InsertApiStatus = z.infer<typeof insertApiStatusSchema>;
export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type AnalysisInstructions = typeof analysisInstructions.$inferSelect;
export type InsertAnalysisInstructions = z.infer<typeof insertAnalysisInstructionsSchema>;
export type AnalysisResults = typeof analysisResults.$inferSelect;
export type InsertAnalysisResults = z.infer<typeof insertAnalysisResultsSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;

// Professional Portfolio Management Types
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type InsertPortfolioHolding = z.infer<typeof insertPortfolioHoldingSchema>;
export type TradeHistory = typeof tradeHistory.$inferSelect;
export type InsertTradeHistory = z.infer<typeof insertTradeHistorySchema>;
export type PortfolioRiskAnalytics = typeof portfolioRiskAnalytics.$inferSelect;
export type InsertPortfolioRiskAnalytics = z.infer<typeof insertPortfolioRiskAnalyticsSchema>;
export type AiResearchReport = typeof aiResearchReports.$inferSelect;
export type InsertAiResearchReport = z.infer<typeof insertAiResearchReportSchema>;
export type AlgorithmicSignal = typeof algorithmicSignals.$inferSelect;
export type InsertAlgorithmicSignal = z.infer<typeof insertAlgorithmicSignalSchema>;

// Pattern Analysis Storage for Visual AI Chart Patterns
export const savedPatterns = pgTable("saved_patterns", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  points: jsonb("points").$type<PatternPoint[]>().notNull(),
  relationships: jsonb("relationships").$type<string[]>().notNull(),
  rays: jsonb("rays").$type<PatternRays>().notNull(),
  metadata: jsonb("metadata").$type<PatternMetadata>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pattern Point with normalized coordinates for cross-symbol matching
export interface PatternPoint {
  pointNumber: number;
  price: number;
  timestamp: number;
  relativePrice: number; // Normalized price (0-1 scale relative to pattern range)
  relativeTime: number; // Normalized time (0-1 scale relative to pattern duration)
  label?: string;
}

// Pattern Rays for SL/Target/Breakout levels
export interface PatternRays {
  sl?: { price: number; relativePrice: number; color: string };
  target?: { price: number; relativePrice: number; color: string };
  breakout?: { price: number; relativePrice: number; color: string };
  [key: string]: { price: number; relativePrice: number; color: string } | undefined;
}

// Pattern Metadata for matching and analysis
export interface PatternMetadata {
  totalPoints: number;
  priceRange: number;
  timeRange: number;
  volatility: number;
  avgSlope: number;
  symbol: string;
  timeframe: string;
  dateCreated: string;
}

// Zod schemas for pattern validation
export const patternPointSchema = z.object({
  pointNumber: z.number().min(1),
  price: z.number().positive(),
  timestamp: z.number().positive(),
  relativePrice: z.number().min(0).max(1),
  relativeTime: z.number().min(0).max(1),
  label: z.string().optional(),
});

export const patternRaySchema = z.object({
  price: z.number().positive(),
  relativePrice: z.number().min(0).max(1),
  color: z.string(),
});

export const patternRaysSchema = z.object({
  sl: patternRaySchema.optional(),
  target: patternRaySchema.optional(),
  breakout: patternRaySchema.optional(),
}).catchall(patternRaySchema.optional());

export const patternMetadataSchema = z.object({
  totalPoints: z.number().min(1),
  priceRange: z.number().positive(),
  timeRange: z.number().positive(),
  volatility: z.number().min(0),
  avgSlope: z.number(),
  symbol: z.string().min(1),
  timeframe: z.string().min(1),
  dateCreated: z.string(),
});

export const insertSavedPatternSchema = createInsertSchema(savedPatterns, {
  points: z.array(patternPointSchema).min(2),
  relationships: z.array(z.string()).default([]),
  rays: patternRaysSchema.default({}),
  metadata: patternMetadataSchema,
}).omit({ createdAt: true });

export type SelectSavedPattern = typeof savedPatterns.$inferSelect;
export type InsertSavedPattern = z.infer<typeof insertSavedPatternSchema>;

// ============================================================================
// BROKER INTEGRATION SCHEMA
// ============================================================================

// Broker identifiers (Fyers removed - using Angel One only)
export const brokerIds = ['kite', 'dhan', 'groww', 'delta'] as const;
export type BrokerId = typeof brokerIds[number];
export const brokerIdSchema = z.enum(brokerIds);

// Individual broker credential schemas
export const kiteCredentialSchema = z.object({
  broker: z.literal('kite'),
  apiKey: z.string().min(1, 'API Key is required'),
  apiSecret: z.string().min(1, 'API Secret is required'),
  requestToken: z.string().min(1, 'Request Token is required'),
});

export const growwCredentialSchema = z.object({
  broker: z.literal('groww'),
  apiKey: z.string().min(1, 'API Key is required'),
  apiSecret: z.string().min(1, 'API Secret is required'),
});

export const dhanCredentialSchema = z.object({
  broker: z.literal('dhan'),
  clientId: z.string().min(1, 'Client ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
});

export const deltaCredentialSchema = z.object({
  broker: z.literal('delta'),
  apiKey: z.string().min(1, 'API Key is required'),
  apiSecret: z.string().min(1, 'API Secret is required'),
});

// Discriminated union for broker credentials
export const brokerCredentialSchema = z.discriminatedUnion('broker', [
  kiteCredentialSchema,
  dhanCredentialSchema,
  growwCredentialSchema,
  deltaCredentialSchema,
]);

// Credential schema map for per-broker access
export const brokerCredentialSchemas = {
  kite: kiteCredentialSchema,
  dhan: dhanCredentialSchema,
  groww: growwCredentialSchema,
  delta: deltaCredentialSchema,
} as const;

// Normalized trade object from broker
export interface BrokerTrade {
  broker: BrokerId;
  tradeId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  executedAt: string;
  pnl?: number;
  fees?: number;
  notes?: string;
}

// Broker trade schema
export const brokerTradeSchema = z.object({
  broker: brokerIdSchema,
  tradeId: z.string(),
  symbol: z.string().min(1),
  action: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive(),
  price: z.number().positive(),
  executedAt: z.string(),
  pnl: z.number().optional(),
  fees: z.number().optional(),
  notes: z.string().optional(),
});

// API request/response schemas
export const brokerImportRequestSchema = z.object({
  broker: brokerIdSchema,
  credentials: brokerCredentialSchema,
});

export const brokerTradesResponseSchema = z.object({
  success: z.boolean(),
  trades: z.array(brokerTradeSchema),
  message: z.string().optional(),
});

// Types
export type KiteCredentials = z.infer<typeof kiteCredentialSchema>;
export type DhanCredentials = z.infer<typeof dhanCredentialSchema>;
export type DeltaCredentials = z.infer<typeof deltaCredentialSchema>;
export type BrokerCredentials = z.infer<typeof brokerCredentialSchema>;
export type BrokerImportRequest = z.infer<typeof brokerImportRequestSchema>;
export type BrokerTradesResponse = z.infer<typeof brokerTradesResponseSchema>;
