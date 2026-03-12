/**
 * Enhanced 4-Candle Rule Processor with 1-Minute Precision Data
 * 
 * This module implements the enhanced 4-candle rule that:
 * 1. First fetches 1-minute candle data for the 4 target candles
 * 2. Stores the detailed data separately
 * 3. Notes exact timestamps of high/low values
 * 4. Uses these precise timestamps for slope calculations
 */

import fs from 'fs/promises';
import path from 'path';
import { BattuIntradayBase, type OneMinuteBaseData, type BattuIntradayRequest } from './battu-intraday-base';
import type { CandleData } from './intraday-patterns';

export interface OneMinuteCandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  candleIndex: number; // Which of the 4 candles this belongs to (0-3)
  candleName: 'C1A' | 'C1B' | 'C2A' | 'C2B';
}

export interface ExactTimestamp {
  timestamp: number;
  price: number;
  candleIndex: number;
  candleName: 'C1A' | 'C1B' | 'C2A' | 'C2B';
  type: 'high' | 'low';
}

export interface PreciseSlope {
  startTimestamp: ExactTimestamp;
  endTimestamp: ExactTimestamp;
  priceChange: number;
  timeChange: number; // in minutes
  slope: number; // price change per minute
  pattern: '1-3' | '1-4' | '2-3' | '2-4';
  trendDirection: 'uptrend' | 'downtrend';
}

export interface Enhanced4CandleData {
  originalCandles: CandleData[]; // The 4 target candles
  oneMinuteCandles: OneMinuteCandleData[]; // All 1-minute candles for these 4 candles
  exactHighTimestamps: ExactTimestamp[]; // Exact timestamps where highs occurred
  exactLowTimestamps: ExactTimestamp[]; // Exact timestamps where lows occurred
  preciseSlopes: PreciseSlope[]; // Calculated slopes using exact timestamps
  analysisTimestamp: number;
  symbol: string;
  timeframe: number; // Original timeframe in minutes
}

export class Enhanced4CandleProcessor {
  private fyersApi: any;
  private storageDir: string;

  constructor(fyersApi: any) {
    this.fyersApi = fyersApi;
    this.storageDir = path.join(process.cwd(), 'battu-enhanced-data');
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  /**
   * Main processing method that implements the enhanced 4-candle rule
   */
  async processEnhanced4CandleRule(
    symbol: string,
    originalCandles: CandleData[],
    timeframe: number
  ): Promise<Enhanced4CandleData> {
    if (originalCandles.length !== 4) {
      throw new Error('Enhanced 4-candle rule requires exactly 4 candles');
    }

    console.log(`🔍 Starting Enhanced 4-Candle Analysis for ${symbol}`);
    console.log(`📊 Original timeframe: ${timeframe} minutes`);
    console.log(`🕘 Target candles: ${originalCandles.length} candles`);

    // Step 1: Fetch 1-minute data for each of the 4 candles
    const oneMinuteCandles = await this.fetchOneMinuteDataForCandles(
      symbol,
      originalCandles,
      timeframe
    );

    // Step 2: Find exact timestamps of high/low values
    const exactHighTimestamps = this.findExactHighTimestamps(oneMinuteCandles);
    const exactLowTimestamps = this.findExactLowTimestamps(oneMinuteCandles);

    // Step 3: Calculate precise slopes using exact timestamps
    const preciseSlopes = this.calculatePreciseSlopes(
      exactHighTimestamps,
      exactLowTimestamps
    );

    // Step 4: Create enhanced data structure
    const enhancedData: Enhanced4CandleData = {
      originalCandles,
      oneMinuteCandles,
      exactHighTimestamps,
      exactLowTimestamps,
      preciseSlopes,
      analysisTimestamp: Date.now(),
      symbol,
      timeframe
    };

    // Step 5: Store data separately for analysis
    await this.storeEnhancedData(enhancedData);

    console.log(`✅ Enhanced 4-Candle Analysis Complete`);
    console.log(`📁 Stored ${oneMinuteCandles.length} 1-minute candles`);
    console.log(`🎯 Found ${exactHighTimestamps.length} exact high timestamps`);
    console.log(`🎯 Found ${exactLowTimestamps.length} exact low timestamps`);
    console.log(`📈 Calculated ${preciseSlopes.length} precise slopes`);

    return enhancedData;
  }

  /**
   * Fetch 1-minute candle data for each of the 4 target candles
   */
  private async fetchOneMinuteDataForCandles(
    symbol: string,
    originalCandles: CandleData[],
    originalTimeframe: number
  ): Promise<OneMinuteCandleData[]> {
    const allOneMinuteCandles: OneMinuteCandleData[] = [];
    const candleNames: ('C1A' | 'C1B' | 'C2A' | 'C2B')[] = ['C1A', 'C1B', 'C2A', 'C2B'];

    for (let i = 0; i < originalCandles.length; i++) {
      const candle = originalCandles[i];
      const candleName = candleNames[i];
      
      console.log(`🔍 Fetching 1-minute data for ${candleName} (${new Date(candle.timestamp * 1000).toLocaleString()})`);

      // Calculate time range for this candle
      const startTime = candle.timestamp;
      const endTime = candle.timestamp + (originalTimeframe * 60) - 60; // End just before next candle
      
      try {
        // Convert timestamps to proper date format for Fyers API
        const startDate = new Date(startTime * 1000);
        const endDate = new Date(endTime * 1000);
        
        // Format dates as YYYY-MM-DD strings
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];
        
        // Fetch 1-minute data for this specific candle period using correct parameters
        const oneMinuteData = await this.fyersApi.getHistoricalData({
          symbol: symbol,
          resolution: '1', // 1-minute resolution
          date_format: '1',
          range_from: formattedStartDate,
          range_to: formattedEndDate,
          cont_flag: '1'
        });

        if (oneMinuteData && oneMinuteData.candles && oneMinuteData.candles.length > 0) {
          // Convert to OneMinuteCandleData format
          const convertedCandles: OneMinuteCandleData[] = oneMinuteData.candles.map((candleData: any) => ({
            timestamp: candleData.timestamp,
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
            volume: candleData.volume,
            candleIndex: i,
            candleName
          }));

          allOneMinuteCandles.push(...convertedCandles);
          console.log(`📊 Fetched ${convertedCandles.length} 1-minute candles for ${candleName}`);
        } else {
          console.warn(`⚠️ No 1-minute data available for ${candleName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch 1-minute data for ${candleName}:`, error);
      }
    }

    return allOneMinuteCandles;
  }

  /**
   * Find exact timestamps where high values occurred within each candle
   */
  private findExactHighTimestamps(oneMinuteCandles: OneMinuteCandleData[]): ExactTimestamp[] {
    const exactTimestamps: ExactTimestamp[] = [];
    const candleGroups = this.groupCandlesByCandleName(oneMinuteCandles);

    for (const [candleName, candles] of Object.entries(candleGroups)) {
      if (candles.length === 0) continue;

      // Find the highest price in this candle group
      const highestPrice = Math.max(...candles.map(c => c.high));
      
      // Find the 1-minute candle(s) where this high occurred
      const highCandles = candles.filter(c => c.high === highestPrice);
      
      // Use the first occurrence (earliest timestamp) if multiple
      const highCandle = highCandles[0];
      
      exactTimestamps.push({
        timestamp: highCandle.timestamp,
        price: highestPrice,
        candleIndex: highCandle.candleIndex,
        candleName: candleName as 'C1A' | 'C1B' | 'C2A' | 'C2B',
        type: 'high'
      });

      console.log(`🎯 ${candleName} High: ${highestPrice} at ${new Date(highCandle.timestamp * 1000).toLocaleString()}`);
    }

    return exactTimestamps;
  }

  /**
   * Find exact timestamps where low values occurred within each candle
   */
  private findExactLowTimestamps(oneMinuteCandles: OneMinuteCandleData[]): ExactTimestamp[] {
    const exactTimestamps: ExactTimestamp[] = [];
    const candleGroups = this.groupCandlesByCandleName(oneMinuteCandles);

    for (const [candleName, candles] of Object.entries(candleGroups)) {
      if (candles.length === 0) continue;

      // Find the lowest price in this candle group
      const lowestPrice = Math.min(...candles.map(c => c.low));
      
      // Find the 1-minute candle(s) where this low occurred
      const lowCandles = candles.filter(c => c.low === lowestPrice);
      
      // Use the first occurrence (earliest timestamp) if multiple
      const lowCandle = lowCandles[0];
      
      exactTimestamps.push({
        timestamp: lowCandle.timestamp,
        price: lowestPrice,
        candleIndex: lowCandle.candleIndex,
        candleName: candleName as 'C1A' | 'C1B' | 'C2A' | 'C2B',
        type: 'low'
      });

      console.log(`🎯 ${candleName} Low: ${lowestPrice} at ${new Date(lowCandle.timestamp * 1000).toLocaleString()}`);
    }

    return exactTimestamps;
  }

  /**
   * Group 1-minute candles by their parent candle name
   */
  private groupCandlesByCandleName(candles: OneMinuteCandleData[]): Record<string, OneMinuteCandleData[]> {
    return candles.reduce((groups, candle) => {
      const key = candle.candleName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(candle);
      return groups;
    }, {} as Record<string, OneMinuteCandleData[]>);
  }

  /**
   * Calculate precise slopes using exact timestamps of high/low values
   */
  private calculatePreciseSlopes(
    exactHighs: ExactTimestamp[],
    exactLows: ExactTimestamp[]
  ): PreciseSlope[] {
    const slopes: PreciseSlope[] = [];

    // Define all possible patterns for 4-candle rule
    const patterns = [
      { pattern: '1-3' as const, startIndex: 0, endIndex: 2 }, // C1A to C2A
      { pattern: '1-4' as const, startIndex: 0, endIndex: 3 }, // C1A to C2B
      { pattern: '2-3' as const, startIndex: 1, endIndex: 2 }, // C1B to C2A
      { pattern: '2-4' as const, startIndex: 1, endIndex: 3 }, // C1B to C2B
    ];

    // Calculate uptrend slopes (low to high)
    for (const patternDef of patterns) {
      const startLow = exactLows.find(t => t.candleIndex === patternDef.startIndex);
      const endHigh = exactHighs.find(t => t.candleIndex === patternDef.endIndex);

      if (startLow && endHigh) {
        const priceChange = endHigh.price - startLow.price;
        const timeChange = Math.abs(endHigh.timestamp - startLow.timestamp) / 60; // Convert to minutes
        const slope = timeChange > 0 ? priceChange / timeChange : 0;

        slopes.push({
          startTimestamp: startLow,
          endTimestamp: endHigh,
          priceChange,
          timeChange,
          slope,
          pattern: patternDef.pattern,
          trendDirection: 'uptrend'
        });

        console.log(`📈 ${patternDef.pattern} Uptrend: ${slope.toFixed(4)}/min (${timeChange.toFixed(1)} min duration)`);
      }
    }

    // Calculate downtrend slopes (high to low)
    for (const patternDef of patterns) {
      const startHigh = exactHighs.find(t => t.candleIndex === patternDef.startIndex);
      const endLow = exactLows.find(t => t.candleIndex === patternDef.endIndex);

      if (startHigh && endLow) {
        const priceChange = endLow.price - startHigh.price; // Will be negative for downtrend
        const timeChange = Math.abs(endLow.timestamp - startHigh.timestamp) / 60; // Convert to minutes
        const slope = timeChange > 0 ? priceChange / timeChange : 0;

        slopes.push({
          startTimestamp: startHigh,
          endTimestamp: endLow,
          priceChange,
          timeChange,
          slope,
          pattern: patternDef.pattern,
          trendDirection: 'downtrend'
        });

        console.log(`📉 ${patternDef.pattern} Downtrend: ${slope.toFixed(4)}/min (${timeChange.toFixed(1)} min duration)`);
      }
    }

    return slopes;
  }

  /**
   * Store enhanced data to separate file for analysis
   */
  private async storeEnhancedData(data: Enhanced4CandleData): Promise<void> {
    const filename = `enhanced-4candle-${data.symbol.replace(':', '-')}-${data.analysisTimestamp}.json`;
    const filepath = path.join(this.storageDir, filename);

    try {
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      console.log(`💾 Stored enhanced 4-candle data: ${filename}`);
    } catch (error) {
      console.error('Failed to store enhanced data:', error);
    }
  }

  /**
   * Load previously stored enhanced data
   */
  async loadEnhancedData(symbol: string, timestamp?: number): Promise<Enhanced4CandleData | null> {
    try {
      const files = await fs.readdir(this.storageDir);
      const symbolFiles = files.filter(f => 
        f.startsWith(`enhanced-4candle-${symbol.replace(':', '-')}`) && 
        f.endsWith('.json')
      );

      if (symbolFiles.length === 0) {
        return null;
      }

      // If timestamp provided, find exact match, otherwise get most recent
      let targetFile: string;
      if (timestamp) {
        targetFile = symbolFiles.find(f => f.includes(timestamp.toString())) || symbolFiles[symbolFiles.length - 1];
      } else {
        targetFile = symbolFiles.sort().pop()!;
      }

      const filepath = path.join(this.storageDir, targetFile);
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data) as Enhanced4CandleData;
    } catch (error) {
      console.error('Failed to load enhanced data:', error);
      return null;
    }
  }

  /**
   * Get summary of stored enhanced analyses
   */
  async getStoredAnalysesSummary(): Promise<Array<{symbol: string, timestamp: number, filename: string}>> {
    try {
      const files = await fs.readdir(this.storageDir);
      const enhancedFiles = files.filter(f => f.startsWith('enhanced-4candle-') && f.endsWith('.json'));
      
      return enhancedFiles.map(filename => {
        const parts = filename.replace('enhanced-4candle-', '').replace('.json', '').split('-');
        const timestamp = parseInt(parts.pop() || '0');
        const symbol = parts.join('-').replace('-', ':');
        
        return { symbol, timestamp, filename };
      }).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get stored analyses summary:', error);
      return [];
    }
  }
}