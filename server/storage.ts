// In-memory storage implementation - no database dependencies
// Uses AWS DynamoDB for persistent data via neofeed-dynamodb-migration.ts

// Type definitions (formerly from schema, now inline for simplicity)
export interface User {
  id: number;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

export interface ApiStatus {
  id: number;
  connected: boolean;
  authenticated: boolean;
  lastUpdate: Date;
  version: string;
  dailyLimit: number;
  requestsUsed: number;
  websocketActive: boolean;
  responseTime: number;
  successRate: number;
  throughput: string;
  activeSymbols: number;
  updatesPerSec: number;
  uptime: number;
  latency: number;
  accessToken: string | null;
  tokenExpiry: Date | null;
}

export interface InsertApiStatus {
  connected?: boolean;
  authenticated?: boolean;
  version?: string;
  dailyLimit?: number;
  requestsUsed?: number;
  websocketActive?: boolean;
  responseTime?: number;
  successRate?: number;
  throughput?: string;
  activeSymbols?: number;
  updatesPerSec?: number;
  uptime?: number;
  latency?: number;
  accessToken?: string | null;
  tokenExpiry?: Date | null;
}

export interface MarketData {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  avgVolume: number;
  pe: number | null;
  marketCap: number | null;
  week52High: number | null;
  week52Low: number | null;
  dividend: number | null;
  sector: string | null;
  lastUpdate: Date;
}

export interface InsertMarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  avgVolume: number;
  pe?: number | null;
  marketCap?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
  dividend?: number | null;
  sector?: string | null;
}

export interface ActivityLog {
  id: number;
  timestamp: Date;
  type: string;
  message: string;
}

export interface InsertActivityLog {
  type: string;
  message: string;
}

export interface AnalysisInstructions {
  id: number;
  name: string;
  description: string | null;
  instructions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertAnalysisInstructions {
  name: string;
  description?: string | null;
  instructions: string[];
  isActive?: boolean;
}

export interface AnalysisResults {
  id: number;
  instructionId: number;
  symbol: string;
  timeframe: string;
  dateRange: string;
  inputData: any[];
  processedData: any;
  metadata: {
    executionTime: number;
    dataPoints: number;
    errors?: string[];
    warnings?: string[];
  } | null;
  executedAt: Date;
  createdAt: Date;
}

export interface InsertAnalysisResults {
  instructionId: number;
  symbol: string;
  timeframe: string;
  dateRange: string;
  inputData: any[];
  processedData?: any;
  metadata?: {
    executionTime?: number;
    dataPoints?: number;
    errors?: string[];
    warnings?: string[];
  } | null;
}

export interface LivestreamSettings {
  id: number;
  youtubeUrl: string | null;
  updatedAt: Date;
}

export interface InsertLivestreamSettings {
  youtubeUrl?: string | null;
}

export interface VerifiedReport {
  id: number;
  reportId: string;
  userId: string;
  username: string;
  reportData: any;
  shareUrl: string;
  views: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface InsertVerifiedReport {
  reportId: string;
  userId: string;
  username: string;
  reportData: any;
  shareUrl: string;
  expiresAt: Date;
}

export interface AuthorizedEmail {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export interface InsertAuthorizedEmail {
  email: string;
  role?: string;
  isActive?: boolean;
}

export interface AdminAccess {
  id: number;
  emailId: string;
  roles: string;
  date: Date;
  revokeDate: Date | null;
}

export interface InsertAdminAccess {
  emailId: string;
  roles: string;
  revokeDate?: Date | null;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getApiStatus(): Promise<ApiStatus | undefined>;
  updateApiStatus(status: InsertApiStatus): Promise<ApiStatus>;
  
  getAllMarketData(): Promise<MarketData[]>;
  getMarketDataBySymbol(symbol: string): Promise<MarketData | undefined>;
  updateMarketData(data: InsertMarketData): Promise<MarketData>;
  
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  addActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  getAllAnalysisInstructions(): Promise<AnalysisInstructions[]>;
  getAnalysisInstructionById(id: number): Promise<AnalysisInstructions | undefined>;
  getAnalysisInstructionByName(name: string): Promise<AnalysisInstructions | undefined>;
  createAnalysisInstruction(instruction: InsertAnalysisInstructions): Promise<AnalysisInstructions>;
  updateAnalysisInstruction(id: number, instruction: Partial<InsertAnalysisInstructions>): Promise<AnalysisInstructions>;
  deleteAnalysisInstruction(id: number): Promise<void>;
  
  getAnalysisResults(instructionId?: number, limit?: number): Promise<AnalysisResults[]>;
  createAnalysisResult(result: InsertAnalysisResults): Promise<AnalysisResults>;
  deleteAnalysisResults(instructionId: number): Promise<void>;
  
  getLivestreamSettings(): Promise<LivestreamSettings | undefined>;
  updateLivestreamSettings(settings: InsertLivestreamSettings): Promise<LivestreamSettings>;
  
  createVerifiedReport(report: InsertVerifiedReport): Promise<VerifiedReport>;
  getVerifiedReport(reportId: string): Promise<VerifiedReport | undefined>;
  incrementReportViews(reportId: string): Promise<void>;
  deleteExpiredReports(): Promise<void>;

  // Authorized Emails
  getAuthorizedEmails(): Promise<AuthorizedEmail[]>;
  addAuthorizedEmail(email: InsertAuthorizedEmail): Promise<AuthorizedEmail>;
  removeAuthorizedEmail(email: string): Promise<void>;
  isEmailAuthorized(email: string): Promise<boolean>;
  getAdminAccessTable(): Promise<any[]>;
  saveAdminAccess(access: InsertAdminAccess): Promise<AdminAccess>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currentUserId: number;
  private apiStatusData: ApiStatus | undefined;
  private marketDataMap: Map<string, MarketData>;
  private activityLogsList: ActivityLog[];
  private currentMarketDataId: number;
  private currentActivityLogId: number;
  private analysisInstructionsMap: Map<number, AnalysisInstructions>;
  private analysisResultsList: AnalysisResults[];  
  private currentAnalysisInstructionId: number;
  private currentAnalysisResultId: number;
  private livestreamSettingsData: LivestreamSettings | undefined;
  private verifiedReportsMap: Map<string, VerifiedReport>;
  private currentVerifiedReportId: number;
  private authorizedEmailsList: Map<string, AuthorizedEmail>;
  private currentAuthorizedEmailId: number;
  private adminAccessList: AdminAccess[];
  private currentAdminAccessId: number;

  constructor() {
    this.users = new Map();
    this.currentUserId = 1;
    this.marketDataMap = new Map();
    this.activityLogsList = [];
    this.currentMarketDataId = 1;
    this.currentActivityLogId = 1;
    this.analysisInstructionsMap = new Map();
    this.analysisResultsList = [];
    this.currentAnalysisInstructionId = 1;
    this.currentAnalysisResultId = 1;
    this.verifiedReportsMap = new Map();
    this.currentVerifiedReportId = 1;
    this.authorizedEmailsList = new Map();
    this.currentAuthorizedEmailId = 1;
    this.adminAccessList = [];
    this.currentAdminAccessId = 1;
    
    // Add default admin - still keeping for fallback but prioritizing external fetch
    const adminEmail = "chiranjeevi.perala99@gmail.com";
    this.authorizedEmailsList.set(adminEmail, {
      id: this.currentAuthorizedEmailId++,
      email: adminEmail,
      role: "admin",
      isActive: true,
      createdAt: new Date()
    });
    
    this.apiStatusData = {
      id: 1,
      connected: false,
      authenticated: false,
      lastUpdate: new Date(),
      version: "v3.0.0",
      dailyLimit: 100000,
      requestsUsed: 0,
      websocketActive: false,
      responseTime: 0,
      successRate: 0,
      throughput: "0 MB/s",
      activeSymbols: 0,
      updatesPerSec: 0,
      uptime: 0,
      latency: 0,
      accessToken: null,
      tokenExpiry: null,
    };

    this.initializeDefaultActivityLogs();
  }

  private initializeDefaultActivityLogs() {
    const logs = [
      { type: "info", message: "System initialized - waiting for Angel One API authentication" },
    ];

    logs.forEach(logData => {
      const istTimestamp = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      
      const log: ActivityLog = {
        id: this.currentActivityLogId++,
        timestamp: istTimestamp,
        type: logData.type,
        message: logData.message,
      };
      this.activityLogsList.push(log);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getApiStatus(): Promise<ApiStatus | undefined> {
    return this.apiStatusData;
  }

  async updateApiStatus(status: InsertApiStatus): Promise<ApiStatus> {
    this.apiStatusData = {
      id: 1,
      connected: status.connected ?? false,
      authenticated: status.authenticated ?? false,
      version: status.version ?? "v3.0.0",
      dailyLimit: status.dailyLimit ?? 100000,
      requestsUsed: status.requestsUsed ?? 0,
      websocketActive: status.websocketActive ?? false,
      responseTime: status.responseTime ?? 0,
      successRate: status.successRate ?? 0,
      throughput: status.throughput ?? "0 MB/s",
      activeSymbols: status.activeSymbols ?? 0,
      updatesPerSec: status.updatesPerSec ?? 0,
      uptime: status.uptime ?? 0,
      latency: status.latency ?? 0,
      accessToken: status.accessToken ?? null,
      tokenExpiry: status.tokenExpiry ?? null,
      lastUpdate: new Date(),
    };
    return this.apiStatusData;
  }

  async getAllMarketData(): Promise<MarketData[]> {
    return Array.from(this.marketDataMap.values());
  }

  async getMarketDataBySymbol(symbol: string): Promise<MarketData | undefined> {
    return this.marketDataMap.get(symbol);
  }

  async updateMarketData(data: InsertMarketData): Promise<MarketData> {
    const existing = this.marketDataMap.get(data.symbol);
    const marketData: MarketData = {
      id: existing?.id || this.currentMarketDataId++,
      ...data,
      pe: data.pe ?? null,
      marketCap: data.marketCap ?? null,
      week52High: data.week52High ?? null,
      week52Low: data.week52Low ?? null,
      dividend: data.dividend ?? null,
      sector: data.sector ?? null,
      lastUpdate: new Date(),
    };
    this.marketDataMap.set(data.symbol, marketData);
    return marketData;
  }

  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    return this.activityLogsList
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const istTimestamp = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const activityLog: ActivityLog = {
      id: this.currentActivityLogId++,
      timestamp: istTimestamp,
      ...log,
    };
    this.activityLogsList.push(activityLog);
    
    if (this.activityLogsList.length > 100) {
      this.activityLogsList = this.activityLogsList.slice(-100);
    }
    
    return activityLog;
  }

  async getAllAnalysisInstructions(): Promise<AnalysisInstructions[]> {
    return Array.from(this.analysisInstructionsMap.values());
  }

  async getAnalysisInstructionById(id: number): Promise<AnalysisInstructions | undefined> {
    return this.analysisInstructionsMap.get(id);
  }

  async getAnalysisInstructionByName(name: string): Promise<AnalysisInstructions | undefined> {
    return Array.from(this.analysisInstructionsMap.values()).find(
      (instruction) => instruction.name === name
    );
  }

  async createAnalysisInstruction(instruction: InsertAnalysisInstructions): Promise<AnalysisInstructions> {
    const id = this.currentAnalysisInstructionId++;
    const analysisInstruction: AnalysisInstructions = {
      id,
      name: instruction.name,
      description: instruction.description ?? null,
      instructions: Array.isArray(instruction.instructions) ? instruction.instructions : [],
      isActive: instruction.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.analysisInstructionsMap.set(id, analysisInstruction);
    return analysisInstruction;
  }

  async updateAnalysisInstruction(id: number, instruction: Partial<InsertAnalysisInstructions>): Promise<AnalysisInstructions> {
    const existing = this.analysisInstructionsMap.get(id);
    if (!existing) {
      throw new Error(`Analysis instruction with id ${id} not found`);
    }
    
    const updated: AnalysisInstructions = {
      ...existing,
      name: instruction.name ?? existing.name,
      description: instruction.description ?? existing.description,
      instructions: Array.isArray(instruction.instructions) ? instruction.instructions : existing.instructions,
      isActive: instruction.isActive ?? existing.isActive,
      updatedAt: new Date(),
    };
    this.analysisInstructionsMap.set(id, updated);
    return updated;
  }

  async deleteAnalysisInstruction(id: number): Promise<void> {
    this.analysisInstructionsMap.delete(id);
    this.analysisResultsList = this.analysisResultsList.filter(
      (result) => result.instructionId !== id
    );
  }

  async getAnalysisResults(instructionId?: number, limit: number = 20): Promise<AnalysisResults[]> {
    let results = this.analysisResultsList;
    
    if (instructionId !== undefined) {
      results = results.filter((result) => result.instructionId === instructionId);
    }
    
    return results
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  }

  async createAnalysisResult(result: InsertAnalysisResults): Promise<AnalysisResults> {
    const analysisResult: AnalysisResults = {
      id: this.currentAnalysisResultId++,
      instructionId: result.instructionId,
      symbol: result.symbol,
      timeframe: result.timeframe,
      dateRange: result.dateRange,
      inputData: Array.isArray(result.inputData) ? result.inputData : [],
      processedData: result.processedData || {},
      metadata: result.metadata ? {
        executionTime: result.metadata.executionTime || 0,
        dataPoints: result.metadata.dataPoints || 0,
        errors: Array.isArray(result.metadata.errors) ? result.metadata.errors : undefined,
        warnings: Array.isArray(result.metadata.warnings) ? result.metadata.warnings : undefined,
      } : null,
      executedAt: new Date(),
      createdAt: new Date(),
    };
    this.analysisResultsList.push(analysisResult);
    
    if (this.analysisResultsList.length > 100) {
      this.analysisResultsList = this.analysisResultsList.slice(-100);
    }
    
    return analysisResult;
  }

  async deleteAnalysisResults(instructionId: number): Promise<void> {
    this.analysisResultsList = this.analysisResultsList.filter(
      (result) => result.instructionId !== instructionId
    );
  }

  async getLivestreamSettings(): Promise<LivestreamSettings | undefined> {
    return this.livestreamSettingsData;
  }

  async updateLivestreamSettings(settings: InsertLivestreamSettings): Promise<LivestreamSettings> {
    const livestreamSettings: LivestreamSettings = {
      id: 1,
      youtubeUrl: settings.youtubeUrl ?? null,
      updatedAt: new Date(),
    };
    this.livestreamSettingsData = livestreamSettings;
    return livestreamSettings;
  }

  async createVerifiedReport(report: InsertVerifiedReport): Promise<VerifiedReport> {
    const verifiedReport: VerifiedReport = {
      id: this.currentVerifiedReportId++,
      reportId: report.reportId,
      userId: report.userId,
      username: report.username,
      reportData: report.reportData,
      shareUrl: report.shareUrl,
      views: 0,
      createdAt: new Date(),
      expiresAt: report.expiresAt,
    };
    this.verifiedReportsMap.set(report.reportId, verifiedReport);
    return verifiedReport;
  }

  async getVerifiedReport(reportId: string): Promise<VerifiedReport | undefined> {
    const report = this.verifiedReportsMap.get(reportId);
    if (report && report.expiresAt > new Date()) {
      return report;
    }
    return undefined;
  }

  async incrementReportViews(reportId: string): Promise<void> {
    const report = this.verifiedReportsMap.get(reportId);
    if (report) {
      report.views++;
      this.verifiedReportsMap.set(reportId, report);
    }
  }

  async deleteExpiredReports(): Promise<void> {
    const now = new Date();
    const entries = Array.from(this.verifiedReportsMap.entries());
    for (const [reportId, report] of entries) {
      if (report.expiresAt <= now) {
        this.verifiedReportsMap.delete(reportId);
      }
    }
  }

  async getAuthorizedEmails(): Promise<AuthorizedEmail[]> {
    return Array.from(this.authorizedEmailsList.values());
  }

  async addAuthorizedEmail(insert: InsertAuthorizedEmail): Promise<AuthorizedEmail> {
    const existing = this.authorizedEmailsList.get(insert.email);
    if (existing) {
      const updated = { ...existing, role: insert.role ?? existing.role, isActive: insert.isActive ?? existing.isActive };
      this.authorizedEmailsList.set(insert.email, updated);
      return updated;
    }

    const id = this.currentAuthorizedEmailId++;
    const authEmail: AuthorizedEmail = {
      id,
      email: insert.email,
      role: insert.role ?? "developer",
      isActive: insert.isActive ?? true,
      createdAt: new Date()
    };
    this.authorizedEmailsList.set(insert.email, authEmail);
    return authEmail;
  }

  async removeAuthorizedEmail(email: string): Promise<void> {
    this.authorizedEmailsList.delete(email);
  }

  async isEmailAuthorized(email: string): Promise<boolean> {
    const auth = this.authorizedEmailsList.get(email);
    return !!auth && auth.isActive;
  }

  async getAdminAccessTable(): Promise<any[]> {
    try {
      return this.adminAccessList.map(access => ({
        emailds: access.emailId,
        roles: access.roles,
        displayNames: access.emailId.split('@')[0],
        date: access.date.toISOString(),
        revokeDate: access.revokeDate ? access.revokeDate.toISOString() : null
      }));
    } catch (error) {
      console.error("Error fetching admin access table:", error);
      return [];
    }
  }

  async saveAdminAccess(access: InsertAdminAccess): Promise<AdminAccess> {
    const id = this.currentAdminAccessId++;
    const newAccess: AdminAccess = {
      id,
      emailId: access.emailId,
      roles: access.roles,
      date: new Date(),
      revokeDate: access.revokeDate ?? null
    };
    this.adminAccessList.push(newAccess);
    
    // Also add to authorized emails for access control
    await this.addAuthorizedEmail({
      email: access.emailId,
      role: access.roles,
      isActive: true
    });

    return newAccess;
  }
}

// Use in-memory storage - no database dependency
// Persistent data uses AWS DynamoDB via neofeed-dynamodb-migration.ts
export const storage: IStorage = new MemStorage();
