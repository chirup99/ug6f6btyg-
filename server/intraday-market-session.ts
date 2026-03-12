/**
 * Intraday Market Session Analysis - Step 1
 * Focus only on patterns within market open (9:15 AM) to market close (3:30 PM)
 * No analysis outside market boundaries
 */

export interface MarketConfig {
  name: string;
  exchange: string;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  timezone: string;
  tradingDays: number[]; // 0=Sunday, 1=Monday, etc.
}

export interface MarketSession {
  date: string;
  openTime: number;
  closeTime: number;
  isActive: boolean;
  market: MarketConfig;
  sessionDuration: number; // in minutes
}

export interface IntradayCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sessionTime: string; // HH:MM format
  minutesFromOpen: number;
  isWithinSession: boolean;
  marketConfig: MarketConfig;
}

export class IntradayMarketAnalyzer {
  private marketConfigs: Map<string, MarketConfig> = new Map([
    // Indian Markets (NSE Only)
    ['NSE', {
      name: 'National Stock Exchange',
      exchange: 'NSE',
      openHour: 9,
      openMinute: 15,
      closeHour: 15,
      closeMinute: 30,
      timezone: 'Asia/Kolkata',
      tradingDays: [1, 2, 3, 4, 5] // Monday to Friday
    }],
    // Indian Commodity Exchange
    ['MCX', {
      name: 'Multi Commodity Exchange',
      exchange: 'MCX',
      openHour: 9,
      openMinute: 0,
      closeHour: 23,
      closeMinute: 30,
      timezone: 'Asia/Kolkata',
      tradingDays: [1, 2, 3, 4, 5] // Monday to Friday
    }],
    // US Markets
    ['NYSE', {
      name: 'New York Stock Exchange',
      exchange: 'NYSE',
      openHour: 9,
      openMinute: 30,
      closeHour: 16,
      closeMinute: 0,
      timezone: 'America/New_York',
      tradingDays: [1, 2, 3, 4, 5]
    }],
    ['NASDAQ', {
      name: 'NASDAQ',
      exchange: 'NASDAQ',
      openHour: 9,
      openMinute: 30,
      closeHour: 16,
      closeMinute: 0,
      timezone: 'America/New_York',
      tradingDays: [1, 2, 3, 4, 5]
    }],
    // European Markets
    ['LSE', {
      name: 'London Stock Exchange',
      exchange: 'LSE',
      openHour: 8,
      openMinute: 0,
      closeHour: 16,
      closeMinute: 30,
      timezone: 'Europe/London',
      tradingDays: [1, 2, 3, 4, 5]
    }],
    // Asian Markets
    ['TSE', {
      name: 'Tokyo Stock Exchange',
      exchange: 'TSE',
      openHour: 9,
      openMinute: 0,
      closeHour: 15,
      closeMinute: 0,
      timezone: 'Asia/Tokyo',
      tradingDays: [1, 2, 3, 4, 5]
    }],
    // Crypto Markets (24/7)
    ['CRYPTO', {
      name: 'Cryptocurrency Market',
      exchange: 'CRYPTO',
      openHour: 0,
      openMinute: 0,
      closeHour: 23,
      closeMinute: 59,
      timezone: 'UTC',
      tradingDays: [0, 1, 2, 3, 4, 5, 6] // All days
    }],
    // Forex Markets (24/5)
    ['FOREX', {
      name: 'Foreign Exchange Market',
      exchange: 'FOREX',
      openHour: 0,
      openMinute: 0,
      closeHour: 23,
      closeMinute: 59,
      timezone: 'UTC',
      tradingDays: [1, 2, 3, 4, 5] // Monday to Friday
    }]
  ]);

  /**
   * Auto-detect market from symbol
   */
  private detectMarketFromSymbol(symbol: string): MarketConfig {
    if (symbol.startsWith('NSE:')) return this.marketConfigs.get('NSE')!;
    if (symbol.startsWith('MCX:')) return this.marketConfigs.get('MCX')!;
    if (symbol.startsWith('NYSE:')) return this.marketConfigs.get('NYSE')!;
    if (symbol.startsWith('NASDAQ:')) return this.marketConfigs.get('NASDAQ')!;
    if (symbol.startsWith('LSE:')) return this.marketConfigs.get('LSE')!;
    if (symbol.startsWith('TSE:')) return this.marketConfigs.get('TSE')!;
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('CRYPTO')) {
      return this.marketConfigs.get('CRYPTO')!;
    }
    if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) {
      return this.marketConfigs.get('FOREX')!;
    }
    
    // Default to NSE for Indian markets
    return this.marketConfigs.get('NSE')!;
  }

  /**
   * Check if a timestamp falls within market hours for specific market
   */
  private isWithinMarketHours(timestamp: number, marketConfig: MarketConfig): boolean {
    const date = new Date(timestamp * 1000);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const dayOfWeek = date.getDay();
    
    // Check if it's a trading day
    if (!marketConfig.tradingDays.includes(dayOfWeek)) {
      return false;
    }
    
    // Convert to minutes from midnight for easier comparison
    const currentMinutes = hour * 60 + minute;
    const openMinutes = marketConfig.openHour * 60 + marketConfig.openMinute;
    const closeMinutes = marketConfig.closeHour * 60 + marketConfig.closeMinute;
    
    // Handle markets that cross midnight (24h markets)
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  /**
   * Get market session info for a given date and market
   */
  private getMarketSession(date: Date, marketConfig: MarketConfig): MarketSession {
    const sessionDate = new Date(date);
    
    // Set market open time
    const openTime = new Date(sessionDate);
    openTime.setHours(marketConfig.openHour, marketConfig.openMinute, 0, 0);
    
    // Set market close time
    const closeTime = new Date(sessionDate);
    closeTime.setHours(marketConfig.closeHour, marketConfig.closeMinute, 0, 0);
    
    // Calculate session duration in minutes
    let sessionDuration = (marketConfig.closeHour * 60 + marketConfig.closeMinute) - 
                         (marketConfig.openHour * 60 + marketConfig.openMinute);
    
    // Handle markets that cross midnight
    if (sessionDuration < 0) {
      sessionDuration = 24 * 60 + sessionDuration;
    }
    
    return {
      date: sessionDate.toISOString().split('T')[0],
      openTime: Math.floor(openTime.getTime() / 1000),
      closeTime: Math.floor(closeTime.getTime() / 1000),
      isActive: marketConfig.tradingDays.includes(sessionDate.getDay()),
      market: marketConfig,
      sessionDuration
    };
  }

  /**
   * Calculate minutes from market open for specific market
   */
  private getMinutesFromOpen(timestamp: number, marketConfig: MarketConfig): number {
    const date = new Date(timestamp * 1000);
    const marketOpen = new Date(date);
    marketOpen.setHours(marketConfig.openHour, marketConfig.openMinute, 0, 0);
    
    const diffMs = date.getTime() - marketOpen.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Convert raw OHLC data to intraday session-aware candles with API-based market detection
   */
  public async processIntradayDataWithAPI(rawCandles: any[], symbol: string, fyersApi: any): Promise<IntradayCandle[]> {
    if (!rawCandles || rawCandles.length === 0) {
      return [];
    }

    // First try to get market session info from Fyers API
    let marketConfig: MarketConfig;
    // const apiSessionInfo = await fyersApi.getMarketSessionInfo(symbol); // Removed: Fyers API removed
    const apiSessionInfo = null;
    
    if (apiSessionInfo) {
      console.log(`🎯 Using real-time market data from Fyers API for ${symbol}`);
      console.log(`📊 API detected: ${apiSessionInfo.marketName} (${apiSessionInfo.marketOpen} - ${apiSessionInfo.marketClose})`);
      
      // Convert API response to MarketConfig
      const [openHour, openMinute] = apiSessionInfo.marketOpen.split(':').map(Number);
      const [closeHour, closeMinute] = apiSessionInfo.marketClose.split(':').map(Number);  
      
      marketConfig = {
        name: apiSessionInfo.marketName,
        exchange: apiSessionInfo.exchange,
        openHour,
        openMinute,
        closeHour,
        closeMinute,
        timezone: apiSessionInfo.timezone,
        tradingDays: [1, 2, 3, 4, 5] // Default to weekdays, can be enhanced
      };
    } else {
      console.log(`⚠️ API session info unavailable, falling back to symbol-based detection for ${symbol}`);
      marketConfig = this.detectMarketFromSymbol(symbol);
    }
    
    console.log(`🕒 Processing ${rawCandles.length} candles for ${marketConfig.name} (${marketConfig.exchange}) session analysis...`);
    console.log(`⏰ Market Hours: ${marketConfig.openHour.toString().padStart(2, '0')}:${marketConfig.openMinute.toString().padStart(2, '0')} - ${marketConfig.closeHour.toString().padStart(2, '0')}:${marketConfig.closeMinute.toString().padStart(2, '0')} (${marketConfig.timezone})`);
    
    const intradayCandles: IntradayCandle[] = [];
    let sessionCandleCount = 0;
    let filteredOutCount = 0;

    for (const candle of rawCandles) {
      const timestamp = candle.timestamp || candle[0];
      const open = candle.open || candle[1];
      const high = candle.high || candle[2];  
      const low = candle.low || candle[3];
      const close = candle.close || candle[4];
      const volume = candle.volume || candle[5] || 0;

      const isWithinSession = this.isWithinMarketHours(timestamp, marketConfig);
      
      if (isWithinSession) {
        const date = new Date(timestamp * 1000);
        const sessionTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const minutesFromOpen = this.getMinutesFromOpen(timestamp, marketConfig);

        intradayCandles.push({
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          sessionTime,
          minutesFromOpen,
          isWithinSession: true,
          marketConfig
        });
        sessionCandleCount++;
      } else {
        filteredOutCount++;
      }
    }

    console.log(`📊 ${marketConfig.exchange} Session Processing Results:`);
    console.log(`   ✅ Session candles (${marketConfig.openHour.toString().padStart(2, '0')}:${marketConfig.openMinute.toString().padStart(2, '0')} - ${marketConfig.closeHour.toString().padStart(2, '0')}:${marketConfig.closeMinute.toString().padStart(2, '0')}): ${sessionCandleCount}`);
    console.log(`   ❌ Filtered out (outside hours): ${filteredOutCount}`);
    console.log(`   🎯 Analysis boundary: ${marketConfig.name} market hours ${apiSessionInfo ? '(API-detected)' : '(fallback)'}`);

    return intradayCandles;
  }

  /**
   * Convert raw OHLC data to intraday session-aware candles with market detection (fallback method)
   */
  public processIntradayData(rawCandles: any[], symbol?: string): IntradayCandle[] {
    if (!rawCandles || rawCandles.length === 0) {
      return [];
    }

    // Auto-detect market from symbol or default to NSE
    const marketConfig = symbol ? this.detectMarketFromSymbol(symbol) : this.marketConfigs.get('NSE')!;
    
    console.log(`🕒 Processing ${rawCandles.length} candles for ${marketConfig.name} (${marketConfig.exchange}) session analysis...`);
    console.log(`⏰ Market Hours: ${marketConfig.openHour.toString().padStart(2, '0')}:${marketConfig.openMinute.toString().padStart(2, '0')} - ${marketConfig.closeHour.toString().padStart(2, '0')}:${marketConfig.closeMinute.toString().padStart(2, '0')} (${marketConfig.timezone})`);
    
    const intradayCandles: IntradayCandle[] = [];
    let sessionCandleCount = 0;
    let filteredOutCount = 0;

    for (const candle of rawCandles) {
      const timestamp = candle.timestamp || candle[0];
      const open = candle.open || candle[1];
      const high = candle.high || candle[2];  
      const low = candle.low || candle[3];
      const close = candle.close || candle[4];
      const volume = candle.volume || candle[5] || 0;

      const isWithinSession = this.isWithinMarketHours(timestamp, marketConfig);
      
      if (isWithinSession) {
        const date = new Date(timestamp * 1000);
        const sessionTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const minutesFromOpen = this.getMinutesFromOpen(timestamp, marketConfig);

        intradayCandles.push({
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          sessionTime,
          minutesFromOpen,
          isWithinSession: true,
          marketConfig
        });
        sessionCandleCount++;
      } else {
        filteredOutCount++;
      }
    }

    console.log(`📊 ${marketConfig.exchange} Session Processing Results:`);
    console.log(`   ✅ Session candles (${marketConfig.openHour.toString().padStart(2, '0')}:${marketConfig.openMinute.toString().padStart(2, '0')} - ${marketConfig.closeHour.toString().padStart(2, '0')}:${marketConfig.closeMinute.toString().padStart(2, '0')}): ${sessionCandleCount}`);
    console.log(`   ❌ Filtered out (outside hours): ${filteredOutCount}`);
    console.log(`   🎯 Analysis boundary: ${marketConfig.name} market hours only`);

    return intradayCandles;
  }

  /**
   * Group candles by trading session (day)
   */
  public groupByTradingSession(candles: IntradayCandle[]): Map<string, IntradayCandle[]> {
    const sessions = new Map<string, IntradayCandle[]>();

    for (const candle of candles) {
      const date = new Date(candle.timestamp * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!sessions.has(dateKey)) {
        sessions.set(dateKey, []);
      }
      sessions.get(dateKey)!.push(candle);
    }

    console.log(`📅 Grouped into ${sessions.size} trading sessions`);
    
    // Log session details
    for (const [date, sessionCandles] of sessions.entries()) {
      const firstCandle = sessionCandles[0];
      const lastCandle = sessionCandles[sessionCandles.length - 1];
      console.log(`   📆 ${date}: ${sessionCandles.length} candles (${firstCandle.sessionTime} - ${lastCandle.sessionTime})`);
    }

    return sessions;
  }

  /**
   * Validate that all candles are within market boundaries for their respective markets
   */
  public validateMarketBoundaries(candles: IntradayCandle[]): {
    isValid: boolean;
    violations: string[];
    summary: string;
    marketInfo?: string;
  } {
    if (candles.length === 0) return { isValid: true, violations: [], summary: "No candles to validate" };
    
    const violations: string[] = [];
    let earliestTime = Infinity;
    let latestTime = 0;
    const marketConfig = candles[0].marketConfig;
    const maxSessionMinutes = marketConfig.sessionDuration;

    for (const candle of candles) {
      if (!candle.isWithinSession) {
        const date = new Date(candle.timestamp * 1000);
        violations.push(`Candle at ${date.toLocaleString()} is outside ${candle.marketConfig.exchange} market hours`);
      }

      if (candle.minutesFromOpen < 0) {
        violations.push(`Candle at ${candle.sessionTime} is before ${candle.marketConfig.exchange} market open`);
      }

      if (candle.minutesFromOpen > maxSessionMinutes) {
        violations.push(`Candle at ${candle.sessionTime} is after ${candle.marketConfig.exchange} market close`);
      }

      earliestTime = Math.min(earliestTime, candle.minutesFromOpen);
      latestTime = Math.max(latestTime, candle.minutesFromOpen);
    }

    const isValid = violations.length === 0;
    const marketInfo = `${marketConfig.name} (${marketConfig.openHour.toString().padStart(2, '0')}:${marketConfig.openMinute.toString().padStart(2, '0')} - ${marketConfig.closeHour.toString().padStart(2, '0')}:${marketConfig.closeMinute.toString().padStart(2, '0')})`;
    const summary = isValid 
      ? `✅ All ${candles.length} candles are within ${marketConfig.exchange} market boundaries (${Math.floor(earliestTime)}min - ${Math.floor(latestTime)}min from open)`
      : `❌ Found ${violations.length} boundary violations in ${candles.length} candles for ${marketConfig.exchange}`;

    return {
      isValid,
      violations,
      summary,
      marketInfo
    };
  }

  /**
   * Get current market session status for specific market
   */
  public getCurrentSessionStatus(symbol?: string): {
    isMarketOpen: boolean;
    timeToOpen?: number;  // minutes
    timeToClose?: number; // minutes
    sessionPhase: 'pre-market' | 'open' | 'post-market' | '24h-trading';
    marketConfig: MarketConfig;
    nextTradingDay?: string;
  } {
    const marketConfig = symbol ? this.detectMarketFromSymbol(symbol) : this.marketConfigs.get('NSE')!;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();
    const openMinutes = marketConfig.openHour * 60 + marketConfig.openMinute;
    const closeMinutes = marketConfig.closeHour * 60 + marketConfig.closeMinute;

    // Check if today is a trading day
    const isTradingDay = marketConfig.tradingDays.includes(currentDay);

    // Handle 24/7 markets (Crypto)
    if (marketConfig.exchange === 'CRYPTO') {
      return {
        isMarketOpen: true,
        sessionPhase: '24h-trading',
        marketConfig
      };
    }

    // Handle Forex (24/5)
    if (marketConfig.exchange === 'FOREX') {
      const isWeekend = currentDay === 0 || currentDay === 6; // Sunday or Saturday
      return {
        isMarketOpen: !isWeekend,
        sessionPhase: isWeekend ? 'post-market' : '24h-trading',
        marketConfig,
        nextTradingDay: isWeekend ? 'Monday' : undefined
      };
    }

    // Regular market handling
    let isMarketOpen = false;
    let sessionPhase: 'pre-market' | 'open' | 'post-market' = 'post-market';
    let timeToOpen: number | undefined;
    let timeToClose: number | undefined;
    let nextTradingDay: string | undefined;

    if (isTradingDay) {
      // Handle markets that cross midnight
      if (closeMinutes < openMinutes) {
        isMarketOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
      } else {
        isMarketOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
      }

      if (currentMinutes < openMinutes) {
        sessionPhase = 'pre-market';
        timeToOpen = openMinutes - currentMinutes;
      } else if (isMarketOpen) {
        sessionPhase = 'open';
        if (closeMinutes < openMinutes) {
          // Market crosses midnight
          timeToClose = closeMinutes < currentMinutes ? 
            (24 * 60) - currentMinutes + closeMinutes : 
            closeMinutes - currentMinutes;
        } else {
          timeToClose = closeMinutes - currentMinutes;
        }
      } else {
        sessionPhase = 'post-market';
        // Time to next trading day's open
        const nextTradingDayIndex = marketConfig.tradingDays.find(day => day > currentDay) || marketConfig.tradingDays[0];
        const daysUntilNext = nextTradingDayIndex > currentDay ? 
          nextTradingDayIndex - currentDay : 
          7 - currentDay + nextTradingDayIndex;
        timeToOpen = (daysUntilNext * 24 * 60) - currentMinutes + openMinutes;
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        nextTradingDay = dayNames[nextTradingDayIndex];
      }
    } else {
      // Not a trading day
      sessionPhase = 'post-market';
      const nextTradingDayIndex = marketConfig.tradingDays.find(day => day > currentDay) || marketConfig.tradingDays[0];
      const daysUntilNext = nextTradingDayIndex > currentDay ? 
        nextTradingDayIndex - currentDay : 
        7 - currentDay + nextTradingDayIndex;
      timeToOpen = (daysUntilNext * 24 * 60) - currentMinutes + openMinutes;
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      nextTradingDay = dayNames[nextTradingDayIndex];
    }

    return {
      isMarketOpen,
      timeToOpen,
      timeToClose,
      sessionPhase,
      marketConfig,
      nextTradingDay
    };
  }
}

// Export singleton instance
export const intradayAnalyzer = new IntradayMarketAnalyzer();