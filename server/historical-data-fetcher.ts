/**
 * Historical Data Backup Service
 * Fetches and manages 1-year historical OHLC data for top 50 Indian stocks
 * Stores data in Google Cloud for failover when Fyers API is down
 */

// import { FyersAPI, CandleData, HistoricalDataRequest } from './fyers-api'; // Removed: Fyers API removed
import { TOP_50_INDIAN_STOCKS, getTop50StockSymbols, BACKUP_TIMEFRAMES, getBackupDateRange } from './top50-stocks';

export interface BackupDataRecord {
  symbol: string;
  timeframe: string;
  date: string;
  ohlcData: CandleData[];
  lastUpdated: number;
  source: 'fyers' | 'backup';
}

export interface FetchProgress {
  totalStocks: number;
  processedStocks: number;
  currentSymbol: string;
  currentTimeframe: string;
  errors: string[];
  completedAt?: number;
}

export class HistoricalDataFetcher {
  private fyersApi: FyersAPI;
  private batchSize: number = 8; // Process 8 stocks at a time to avoid rate limits (increased from 5)
  private delayBetweenRequests: number = 800; // 0.8 second delay between requests (reduced from 2 seconds)
  private maxRetries: number = 3;

  constructor(fyersApi: FyersAPI) {
    this.fyersApi = fyersApi;
  }

  /**
   * Fetch 1 year of historical data for all top 50 stocks
   */
  async fetchAllHistoricalData(progressCallback?: (progress: FetchProgress) => void): Promise<BackupDataRecord[]> {
    console.log('📊 Starting bulk historical data fetch for top 50 stocks...');
    
    const symbols = getTop50StockSymbols();
    const dateRange = getBackupDateRange();
    const allBackupData: BackupDataRecord[] = [];
    
    const progress: FetchProgress = {
      totalStocks: symbols.length,
      processedStocks: 0,
      currentSymbol: '',
      currentTimeframe: '',
      errors: []
    };

    console.log(`📈 Fetching data for ${symbols.length} stocks across ${BACKUP_TIMEFRAMES.length} timeframes`);
    console.log(`📅 Date range: ${dateRange.from} to ${dateRange.to}`);

    // Process stocks in batches to avoid overwhelming the API
    for (let i = 0; i < symbols.length; i += this.batchSize) {
      const batch = symbols.slice(i, i + this.batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(symbols.length / this.batchSize)}`);
      
      // Process each stock in the batch
      for (const symbol of batch) {
        progress.currentSymbol = symbol;
        progressCallback?.(progress);
        
        console.log(`📊 Processing ${symbol} (${progress.processedStocks + 1}/${symbols.length})`);
        
        try {
          // Fetch data for all timeframes for this stock
          for (const timeframe of BACKUP_TIMEFRAMES) {
            progress.currentTimeframe = timeframe;
            progressCallback?.(progress);
            
            console.log(`  ⏱️ Fetching ${timeframe} data for ${symbol}`);
            
            const historicalData = await this.fetchStockData(symbol, timeframe, dateRange);
            
            if (historicalData && historicalData.length > 0) {
              const backupRecord: BackupDataRecord = {
                symbol,
                timeframe,
                date: dateRange.to,
                ohlcData: historicalData,
                lastUpdated: Date.now(),
                source: 'fyers'
              };
              
              allBackupData.push(backupRecord);
              console.log(`  ✅ Fetched ${historicalData.length} candles for ${symbol} (${timeframe})`);
            } else {
              const error = `No data available for ${symbol} (${timeframe})`;
              progress.errors.push(error);
              console.log(`  ⚠️ ${error}`);
            }
            
            // Add delay between timeframe requests (reduced from 500ms to 200ms)
            await this.delay(200);
          }
          
          progress.processedStocks++;
          progressCallback?.(progress);
          
          // Add delay between stock requests
          await this.delay(this.delayBetweenRequests);
          
        } catch (error: any) {
          const errorMsg = `Failed to fetch data for ${symbol}: ${error.message}`;
          progress.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          progress.processedStocks++;
        }
      }
    }
    
    progress.completedAt = Date.now();
    progressCallback?.(progress);
    
    console.log(`✅ Bulk fetch completed! Processed ${allBackupData.length} records`);
    console.log(`📊 Success rate: ${((allBackupData.length / (symbols.length * BACKUP_TIMEFRAMES.length)) * 100).toFixed(1)}%`);
    
    if (progress.errors.length > 0) {
      console.log(`⚠️ Errors encountered: ${progress.errors.length}`);
      progress.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return allBackupData;
  }

  /**
   * Fetch historical data for a single stock and timeframe
   */
  async fetchStockData(
    symbol: string, 
    timeframe: string, 
    dateRange: { from: string; to: string },
    retryCount: number = 0
  ): Promise<CandleData[] | null> {
    try {
      const request: HistoricalDataRequest = {
        symbol,
        resolution: timeframe,
        date_format: '1',
        range_from: dateRange.from,
        range_to: dateRange.to,
        cont_flag: '1'
      };
      
      const data = await this.fyersApi.getHistoricalData(request);
      
      // Validate data quality
      if (data && data.length > 0) {
        const validData = this.validateAndCleanData(data);
        return validData;
      }
      
      return null;
      
    } catch (error: any) {
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Retrying ${symbol} (${timeframe}) - attempt ${retryCount + 1}/${this.maxRetries}`);
        await this.delay(3000); // Wait 3 seconds before retry
        return this.fetchStockData(symbol, timeframe, dateRange, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Validate and clean OHLC data
   */
  private validateAndCleanData(data: CandleData[]): CandleData[] {
    return data.filter(candle => {
      // Remove invalid candles
      return candle.open > 0 && 
             candle.high > 0 && 
             candle.low > 0 && 
             candle.close > 0 &&
             candle.high >= candle.low &&
             candle.high >= Math.max(candle.open, candle.close) &&
             candle.low <= Math.min(candle.open, candle.close) &&
             candle.volume >= 0;
    }).map(candle => ({
      ...candle,
      // Round prices to 2 decimal places to save storage
      open: Math.round(candle.open * 100) / 100,
      high: Math.round(candle.high * 100) / 100,
      low: Math.round(candle.low * 100) / 100,
      close: Math.round(candle.close * 100) / 100
    }));
  }

  /**
   * Update specific stock's data (for periodic updates)
   */
  async updateStockData(symbol: string): Promise<BackupDataRecord[]> {
    console.log(`🔄 Updating data for ${symbol}...`);
    
    const dateRange = getBackupDateRange();
    const updatedRecords: BackupDataRecord[] = [];
    
    for (const timeframe of BACKUP_TIMEFRAMES) {
      try {
        const historicalData = await this.fetchStockData(symbol, timeframe, dateRange);
        
        if (historicalData && historicalData.length > 0) {
          const backupRecord: BackupDataRecord = {
            symbol,
            timeframe,
            date: dateRange.to,
            ohlcData: historicalData,
            lastUpdated: Date.now(),
            source: 'fyers'
          };
          
          updatedRecords.push(backupRecord);
          console.log(`✅ Updated ${historicalData.length} candles for ${symbol} (${timeframe})`);
        }
        
        await this.delay(1000); // 1 second delay between timeframes
        
      } catch (error: any) {
        console.error(`❌ Failed to update ${symbol} (${timeframe}): ${error.message}`);
      }
    }
    
    console.log(`✅ Updated ${updatedRecords.length}/${BACKUP_TIMEFRAMES.length} timeframes for ${symbol}`);
    return updatedRecords;
  }

  /**
   * Get data freshness status
   */
  async getDataFreshness(records: BackupDataRecord[]): Promise<{
    fresh: number;
    stale: number;
    missing: number;
    oldestRecord: number | null;
    newestRecord: number | null;
  }> {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const totalExpected = TOP_50_INDIAN_STOCKS.length * BACKUP_TIMEFRAMES.length;
    
    let fresh = 0;
    let stale = 0;
    let oldestRecord: number | null = null;
    let newestRecord: number | null = null;
    
    records.forEach(record => {
      const age = now - record.lastUpdated;
      
      if (age < oneDayMs) {
        fresh++;
      } else {
        stale++;
      }
      
      if (!oldestRecord || record.lastUpdated < oldestRecord) {
        oldestRecord = record.lastUpdated;
      }
      
      if (!newestRecord || record.lastUpdated > newestRecord) {
        newestRecord = record.lastUpdated;
      }
    });
    
    return {
      fresh,
      stale,
      missing: totalExpected - records.length,
      oldestRecord,
      newestRecord
    };
  }

  /**
   * Fetch missing data only (skip already completed symbols/months)
   */
  async fetchMissingData(
    months: number, 
    completionStatus: any, 
    progressCallback?: (progress: FetchProgress) => void
  ): Promise<BackupDataRecord[]> {
    console.log(`🎯 Starting selective fetch for missing data (${months} months)...`);
    
    const { missingSymbols, missingMonths } = completionStatus;
    const allBackupData: BackupDataRecord[] = [];
    
    const progress: FetchProgress = {
      totalStocks: missingSymbols.length,
      processedStocks: 0,
      currentSymbol: '',
      currentTimeframe: '',
      errors: []
    };

    console.log(`📊 Missing symbols: ${missingSymbols.length}, Missing months: ${missingMonths.length}`);
    
    // Process only missing symbols
    for (const symbol of missingSymbols) {
      progress.currentSymbol = symbol;
      progressCallback?.(progress);
      
      console.log(`🔄 Fetching missing data for ${symbol}...`);
      
      try {
        // Generate date ranges for missing months
        for (const month of missingMonths) {
          const fromDate = `${month}-01`;
          const lastDay = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
          const toDate = `${month}-${lastDay.toString().padStart(2, '0')}`;
          
          const historicalData = await this.fetchStockData(symbol, '1', { from: fromDate, to: toDate });
          
          if (historicalData.length > 0) {
            const backupRecord: BackupDataRecord = {
              symbol,
              timeframe: '1',
              date: month,
              ohlcData: historicalData,
              lastUpdated: Date.now(),
              source: 'fyers'
            };
            allBackupData.push(backupRecord);
          }
        }
        
        progress.processedStocks++;
        progressCallback?.(progress);
        
      } catch (error: any) {
        console.error(`❌ Error fetching missing data for ${symbol}: ${error.message}`);
        progress.errors.push(`${symbol}: ${error.message}`);
      }
      
      // Add delay between symbols to avoid rate limiting
      await this.delay(this.delayBetweenRequests);
    }

    console.log(`✅ Selective fetch completed: ${allBackupData.length} records collected`);
    return allBackupData;
  }

  /**
   * Utility function to add delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create configured historical data fetcher
 */
export function createHistoricalDataFetcher(fyersApi: FyersAPI): HistoricalDataFetcher {
  return new HistoricalDataFetcher(fyersApi);
}