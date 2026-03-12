/**
 * Backup Sync Scheduler
 * Automatically keeps historical backup data updated through periodic sync operations
 */

import { createBackupDataService } from './backup-data-service';
import { createHistoricalDataFetcher } from './historical-data-fetcher';
import { getTop50StockSymbols } from './top50-stocks';
// import type { FyersAPI } from './fyers-api'; // Removed: Fyers API removed

export class BackupSyncScheduler {
  private backupService = createBackupDataService();
  private fetcher: ReturnType<typeof createHistoricalDataFetcher>;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private fyersApi: FyersAPI) {
    this.fetcher = createHistoricalDataFetcher(fyersApi);
  }

  /**
   * Start automatic periodic syncing
   */
  start(intervalHours: number = 6): void {
    if (this.isRunning) {
      console.log('📅 Backup sync scheduler already running');
      return;
    }

    console.log(`📅 Starting backup sync scheduler (every ${intervalHours} hours)...`);
    this.isRunning = true;

    // Run initial sync after 1 minute
    setTimeout(() => {
      this.performIncrementalSync().catch(error => {
        console.error('❌ Initial backup sync failed:', error);
      });
    }, 60 * 1000);

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.performIncrementalSync().catch(error => {
        console.error('❌ Periodic backup sync failed:', error);
      });
    }, intervalHours * 60 * 60 * 1000);

    console.log(`✅ Backup sync scheduler started`);
  }

  /**
   * Stop automatic syncing
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('📅 Backup sync scheduler not running');
      return;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isRunning = false;
    console.log('🛑 Backup sync scheduler stopped');
  }

  /**
   * Perform incremental sync for stocks that need updates
   */
  async performIncrementalSync(): Promise<void> {
    if (!this.fyersApi.isAuthenticated()) {
      console.log('🔒 Skipping backup sync - Fyers API not authenticated');
      return;
    }

    console.log('🔄 Starting incremental backup sync...');
    const startTime = Date.now();

    try {
      const symbols = getTop50StockSymbols();
      const syncId = await this.backupService.createSyncOperation('incremental_update', symbols.length);
      
      let processed = 0;
      let updated = 0;
      const errors: string[] = [];

      for (const symbol of symbols) {
        try {
          // Check if symbol needs update (older than 12 hours)
          const needsUpdate = !(await this.backupService.hasRecentBackupData(symbol, '1', 12));
          
          if (needsUpdate) {
            console.log(`🔄 Updating ${symbol}...`);
            
            const records = await this.fetcher.updateStockData(symbol);
            
            if (records.length > 0) {
              const storeResult = await this.backupService.storeHistoricalData(records);
              if (storeResult.success) {
                updated++;
                console.log(`✅ Updated ${symbol}: ${storeResult.stored} records`);
              }
            }
          } else {
            console.log(`⏭️ Skipping ${symbol} - data is recent`);
          }

          processed++;

          // Update sync progress
          await this.backupService.updateSyncProgress(syncId, {
            processedSymbols: processed,
            currentSymbol: symbol
          });

          // Rate limiting - wait 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          const errorMsg = `Failed to sync ${symbol}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Mark sync as completed
      await this.backupService.updateSyncProgress(syncId, {
        status: 'completed',
        completedAt: new Date(),
        errors: errors
      });

      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Incremental backup sync completed in ${duration}s:`);
      console.log(`   📊 Processed: ${processed}/${symbols.length} symbols`);
      console.log(`   🔄 Updated: ${updated} symbols`);
      console.log(`   ❌ Errors: ${errors.length}`);

    } catch (error: any) {
      console.error(`❌ Incremental backup sync failed: ${error.message}`);
    }
  }

  /**
   * Perform full sync for all stocks
   */
  async performFullSync(): Promise<void> {
    if (!this.fyersApi.isAuthenticated()) {
      console.log('🔒 Cannot perform full sync - Fyers API not authenticated');
      return;
    }

    console.log('🔄 Starting full backup sync...');
    const startTime = Date.now();

    try {
      const symbols = getTop50StockSymbols();
      const syncId = await this.backupService.createSyncOperation('full_sync', symbols.length);

      const progressCallback = async (progress: any) => {
        await this.backupService.updateSyncProgress(syncId, {
          processedSymbols: progress.processedStocks,
          currentSymbol: progress.currentSymbol,
          currentTimeframe: progress.currentTimeframe,
          errors: progress.errors
        });
      };

      const backupRecords = await this.fetcher.fetchAllHistoricalData(progressCallback);
      
      if (backupRecords.length > 0) {
        console.log(`💾 Storing ${backupRecords.length} records...`);
        const storeResult = await this.backupService.storeHistoricalData(backupRecords);
        
        await this.backupService.updateSyncProgress(syncId, {
          status: 'completed',
          completedAt: new Date()
        });

        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`✅ Full backup sync completed in ${duration}s: ${storeResult.stored} records stored`);
      } else {
        await this.backupService.updateSyncProgress(syncId, {
          status: 'completed',
          completedAt: new Date(),
          errors: ['No data was fetched']
        });

        console.log(`⚠️ Full backup sync completed but no data was fetched`);
      }

    } catch (error: any) {
      console.error(`❌ Full backup sync failed: ${error.message}`);
    }
  }

  /**
   * Get sync scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    startTime: Date | null;
    nextSyncIn: number | null;
  } {
    return {
      isRunning: this.isRunning,
      startTime: null, // Could track this if needed
      nextSyncIn: null // Could calculate this from interval
    };
  }

  /**
   * Force immediate sync
   */
  async forcSync(type: 'incremental' | 'full' = 'incremental'): Promise<void> {
    console.log(`🚀 Force sync requested (${type})...`);
    
    if (type === 'full') {
      await this.performFullSync();
    } else {
      await this.performIncrementalSync();
    }
  }
}

/**
 * Global scheduler instance
 */
let schedulerInstance: BackupSyncScheduler | null = null;

/**
 * Initialize backup sync scheduler
 */
export function initializeBackupSyncScheduler(fyersApi: FyersAPI): BackupSyncScheduler {
  if (schedulerInstance) {
    console.log('📅 Backup sync scheduler already initialized');
    return schedulerInstance;
  }

  schedulerInstance = new BackupSyncScheduler(fyersApi);
  
  // Auto-start with 6-hour intervals in production
  // Comment out for development to avoid API rate limits
  // schedulerInstance.start(6);

  return schedulerInstance;
}

/**
 * Get the global scheduler instance
 */
export function getBackupSyncScheduler(): BackupSyncScheduler | null {
  return schedulerInstance;
}