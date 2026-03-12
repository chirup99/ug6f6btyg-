/**
 * Backup Data Service
 * Manages historical OHLC data storage and retrieval for failover functionality
 * Provides reliable data access when Fyers API is unavailable
 */

import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from './db';
import { 
  historicalBackupData, 
  historicalBackupIndex, 
  backupSyncStatus,
  type CandleData,
  type InsertHistoricalBackupData,
  type InsertHistoricalBackupIndex,
  type InsertBackupSyncStatus
} from '../shared/schema';
import { BackupDataRecord, FetchProgress, HistoricalDataFetcher } from './historical-data-fetcher';
import { getTop50StockSymbols, BACKUP_TIMEFRAMES } from './top50-stocks';

export interface BackupQueryParams {
  symbol: string;
  timeframe: string;
  dateFrom: string;
  dateTo: string;
}

export interface BackupDataResponse {
  success: boolean;
  data?: CandleData[];
  source: 'backup' | 'cache';
  recordsFound: number;
  dateRange: {
    from: string;
    to: string;
  };
  lastUpdated?: number;
  error?: string;
}

export interface BackupStatusResponse {
  totalRecords: number;
  recordsBySymbol: Record<string, number>;
  recordsByTimeframe: Record<string, number>;
  oldestRecord: number | null;
  newestRecord: number | null;
  storageSize: string;
  lastSyncOperation: any;
  currentStock?: string;
  totalTradingDays?: number;
  completedDays?: number;
}

export class BackupDataService {
  constructor() {}

  /**
   * Store historical data in backup database
   */
  async storeHistoricalData(records: BackupDataRecord[]): Promise<{
    success: boolean;
    stored: number;
    skipped: number;
    errors: string[];
  }> {
    console.log(`💾 Storing ${records.length} backup records in database...`);
    
    let stored = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      for (const record of records) {
        try {
          // Check if record already exists
          const existing = await db
            .select()
            .from(historicalBackupData)
            .where(
              and(
                eq(historicalBackupData.symbol, record.symbol),
                eq(historicalBackupData.timeframe, record.timeframe),
                eq(historicalBackupData.date, record.date)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing record
            await db
              .update(historicalBackupData)
              .set({
                ohlcData: record.ohlcData as CandleData[],
                candleCount: record.ohlcData.length,
                dataSource: record.source,
                lastUpdated: new Date(record.lastUpdated)
              })
              .where(eq(historicalBackupData.id, existing[0].id));
            
            console.log(`🔄 Updated ${record.symbol} (${record.timeframe}) - ${record.ohlcData.length} candles`);
          } else {
            // Insert new record
            const insertData: InsertHistoricalBackupData = {
              symbol: record.symbol,
              timeframe: record.timeframe,
              date: record.date,
              ohlcData: record.ohlcData as CandleData[],
              candleCount: record.ohlcData.length,
              dataSource: record.source
            };

            await db.insert(historicalBackupData).values([insertData]);
            console.log(`💾 Stored ${record.symbol} (${record.timeframe}) - ${record.ohlcData.length} candles`);
          }

          // Update index
          await this.updateBackupIndex(record.symbol, record.timeframe, record.date, record.ohlcData.length);
          stored++;

        } catch (error: any) {
          const errorMsg = `Failed to store ${record.symbol} (${record.timeframe}): ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          skipped++;
        }
      }

      console.log(`✅ Backup storage complete: ${stored} stored, ${skipped} skipped`);
      return { success: true, stored, skipped, errors };

    } catch (error: any) {
      console.error(`❌ Backup storage failed: ${error.message}`);
      return { success: false, stored, skipped, errors: [...errors, error.message] };
    }
  }

  /**
   * Retrieve historical data from backup database
   */
  async getHistoricalData(params: BackupQueryParams): Promise<BackupDataResponse> {
    console.log(`📊 Retrieving backup data for ${params.symbol} (${params.timeframe})`);
    
    try {
      const records = await db
        .select()
        .from(historicalBackupData)
        .where(
          and(
            eq(historicalBackupData.symbol, params.symbol),
            eq(historicalBackupData.timeframe, params.timeframe),
            // Add date range filter if needed
            // gte(historicalBackupData.date, params.dateFrom),
            // lte(historicalBackupData.date, params.dateTo)
          )
        )
        .orderBy(desc(historicalBackupData.lastUpdated))
        .limit(1);

      if (records.length === 0) {
        return {
          success: false,
          source: 'backup',
          recordsFound: 0,
          dateRange: { from: params.dateFrom, to: params.dateTo },
          error: `No backup data found for ${params.symbol} (${params.timeframe})`
        };
      }

      const record = records[0];
      const ohlcData = record.ohlcData as CandleData[];

      // Filter data by date range if needed
      let filteredData = ohlcData;
      if (params.dateFrom && params.dateTo) {
        const fromTimestamp = new Date(params.dateFrom).getTime();
        const toTimestamp = new Date(params.dateTo).getTime() + (24 * 60 * 60 * 1000); // Include full end day
        
        filteredData = ohlcData.filter(candle => 
          candle.timestamp >= fromTimestamp && candle.timestamp <= toTimestamp
        );
      }

      console.log(`✅ Retrieved ${filteredData.length} candles from backup for ${params.symbol}`);

      return {
        success: true,
        data: filteredData,
        source: 'backup',
        recordsFound: filteredData.length,
        dateRange: { from: params.dateFrom, to: params.dateTo },
        lastUpdated: record.lastUpdated?.getTime()
      };

    } catch (error: any) {
      console.error(`❌ Failed to retrieve backup data: ${error.message}`);
      return {
        success: false,
        source: 'backup',
        recordsFound: 0,
        dateRange: { from: params.dateFrom, to: params.dateTo },
        error: error.message
      };
    }
  }

  /**
   * Update backup index for fast lookups
   */
  private async updateBackupIndex(symbol: string, timeframe: string, date: string, candleCount: number): Promise<void> {
    try {
      const existing = await db
        .select()
        .from(historicalBackupIndex)
        .where(
          and(
            eq(historicalBackupIndex.symbol, symbol),
            eq(historicalBackupIndex.timeframe, timeframe)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const record = existing[0];
        const availableDates = (record.availableDates as string[]) || [];
        
        // Add new date if not already present
        if (!availableDates.includes(date)) {
          availableDates.push(date);
          availableDates.sort();
        }

        // Update index
        await db
          .update(historicalBackupIndex)
          .set({
            availableDates: availableDates as string[],
            totalCandles: record.totalCandles + candleCount,
            oldestDate: availableDates[0],
            newestDate: availableDates[availableDates.length - 1],
            lastSynced: new Date()
          })
          .where(eq(historicalBackupIndex.id, record.id));

      } else {
        // Create new index entry
        const indexData: InsertHistoricalBackupIndex = {
          symbol,
          timeframe,
          availableDates: [date] as string[],
          totalCandles: candleCount,
          oldestDate: date,
          newestDate: date,
          isActive: true
        };

        await db.insert(historicalBackupIndex).values([indexData]);
      }

    } catch (error: any) {
      console.error(`❌ Failed to update backup index: ${error.message}`);
    }
  }

  /**
   * Get backup system status and statistics
   */
  async getBackupStatus(): Promise<BackupStatusResponse> {
    try {
      // Get total records
      const totalRecordsResult = await db
        .select()
        .from(historicalBackupData);
      
      const totalRecords = totalRecordsResult.length;

      // Group by symbol and timeframe
      const recordsBySymbol: Record<string, number> = {};
      const recordsByTimeframe: Record<string, number> = {};
      
      let oldestRecord: number | null = null;
      let newestRecord: number | null = null;

      totalRecordsResult.forEach(record => {
        // Count by symbol
        recordsBySymbol[record.symbol] = (recordsBySymbol[record.symbol] || 0) + record.candleCount;
        
        // Count by timeframe
        recordsByTimeframe[record.timeframe] = (recordsByTimeframe[record.timeframe] || 0) + record.candleCount;
        
        // Track oldest and newest records
        const recordTime = record.lastUpdated?.getTime();
        if (recordTime) {
          if (!oldestRecord || recordTime < oldestRecord) {
            oldestRecord = recordTime;
          }
          if (!newestRecord || recordTime > newestRecord) {
            newestRecord = recordTime;
          }
        }
      });

      // Get last sync operation
      const lastSyncResult = await db
        .select()
        .from(backupSyncStatus)
        .orderBy(desc(backupSyncStatus.startedAt))
        .limit(1);

      const lastSyncOperation = lastSyncResult[0] || null;

      // Estimate storage size (rough calculation)
      const avgCandleSize = 100; // bytes per candle (rough estimate)
      const totalCandles = Object.values(recordsBySymbol).reduce((sum, count) => sum + count, 0);
      const storageSizeBytes = totalCandles * avgCandleSize;
      const storageSizeMB = (storageSizeBytes / (1024 * 1024)).toFixed(2);

      // Extract current stock from the latest activity logs (if available)
      let currentStock = 'Connecting...';
      try {
        // Look for HISTORICAL-FETCH pattern in recent logs to extract current stock
        const latestLogs = await db
          .select()
          .from(activityLog)
          .orderBy(desc(activityLog.timestamp))
          .limit(5);
        
        for (const log of latestLogs) {
          if (log.message?.includes('🔌 HISTORICAL-FETCH: Processing')) {
            const match = log.message.match(/Processing (NSE:[A-Z]+-EQ)/);
            if (match) {
              currentStock = match[1];
              break;
            }
          }
        }
      } catch (error) {
        console.log('Could not extract current stock from logs');
      }

      // Calculate trading days progress
      const totalTradingDays = 20; // Approximate trading days per month
      const completedDays = Math.floor(totalRecords / 50); // Assuming 50 stocks

      return {
        totalRecords,
        recordsBySymbol,
        recordsByTimeframe,
        oldestRecord,
        newestRecord,
        storageSize: `${storageSizeMB} MB`,
        lastSyncOperation,
        currentStock,
        totalTradingDays,
        completedDays
      };

    } catch (error: any) {
      console.error(`❌ Failed to get backup status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create sync operation record
   */
  async createSyncOperation(type: 'full_sync' | 'incremental_update' | 'single_stock', totalSymbols: number): Promise<number> {
    try {
      const syncData: InsertBackupSyncStatus = {
        operationType: type,
        status: 'running',
        totalSymbols,
        processedSymbols: 0,
        errors: [] as string[]
      };

      const result = await db.insert(backupSyncStatus).values([syncData]).returning({ id: backupSyncStatus.id });
      return result[0].id;

    } catch (error: any) {
      console.error(`❌ Failed to create sync operation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update sync operation progress
   */
  async updateSyncProgress(
    syncId: number, 
    progress: Partial<{
      status: string;
      processedSymbols: number;
      currentSymbol: string;
      currentTimeframe: string;
      errors: string[];
      completedAt: Date;
    }>
  ): Promise<void> {
    try {
      await db
        .update(backupSyncStatus)
        .set(progress)
        .where(eq(backupSyncStatus.id, syncId));

    } catch (error: any) {
      console.error(`❌ Failed to update sync progress: ${error.message}`);
    }
  }

  /**
   * Check if symbol has recent backup data
   */
  async hasRecentBackupData(symbol: string, timeframe: string, maxAgeHours: number = 24): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
      
      const records = await db
        .select()
        .from(historicalBackupData)
        .where(
          and(
            eq(historicalBackupData.symbol, symbol),
            eq(historicalBackupData.timeframe, timeframe)
          )
        )
        .orderBy(desc(historicalBackupData.lastUpdated))
        .limit(1);

      if (records.length === 0) return false;
      
      return records[0].lastUpdated && records[0].lastUpdated > cutoffTime;

    } catch (error: any) {
      console.error(`❌ Failed to check backup data freshness: ${error.message}`);
      return false;
    }
  }

  /**
   * Clean old backup data (optional maintenance)
   */
  async cleanOldBackupData(keepDays: number = 365): Promise<{ deleted: number }> {
    try {
      console.log(`🧹 Cleaning backup data older than ${keepDays} days...`);
      
      const cutoffTime = new Date(Date.now() - (keepDays * 24 * 60 * 60 * 1000));
      
      // Placeholder - implement actual cleanup logic if needed
      const deletedRecords = { deletedCount: 0 };

      console.log(`🧹 Cleanup completed`);
      return { deleted: 0 }; // Placeholder - implement actual cleanup logic if needed

    } catch (error: any) {
      console.error(`❌ Failed to clean old backup data: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Factory function to create backup data service
 */
export function createBackupDataService(): BackupDataService {
  return new BackupDataService();
}