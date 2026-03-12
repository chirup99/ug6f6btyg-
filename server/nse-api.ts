import axios, { AxiosInstance } from 'axios';

export interface NSEEquityData {
  symbol: string;
  open: number;
  dayHigh: number;
  dayLow: number;
  lastPrice: number;
  previousClose: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  yearHigh: number;
  yearLow: number;
  perChange365d?: number;
  perChange30d?: number;
}

export interface NSEQuoteInfo {
  symbol: string;
  companyName: string;
  industry: string;
  lastPrice: number;
  change: number;
  pChange: number;
  previousClose: number;
  open: number;
  close: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  lastUpdateTime: string;
  series?: string;
}

export interface NSEPreMarketData {
  symbol: string;
  lastPrice: number;
  change: number;
  pChange: number;
  previousClose: number;
  iep: number;
  finalPrice: number;
  finalQuantity: number;
  totalBuyQuantity: number;
  totalSellQuantity: number;
}

export interface NSEApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: 'INVALID_SYMBOL' | 'INVALID_CATEGORY' | 'RATE_LIMITED' | 'SESSION_FAILED' | 'NETWORK_ERROR' | 'UNKNOWN';
  timestamp: string;
  latencyMs: number;
  cached?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class NSEAPI {
  private session: AxiosInstance;
  private cookies: string = '';
  private lastCookieRefresh: Date | null = null;
  private cookieRefreshIntervalMs = 5 * 60 * 1000; // 5 minutes
  private lastRequestTime: number = 0;
  private minRequestIntervalMs = 500; // Minimum 500ms between requests to avoid rate limiting
  
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly cacheTTLMs = 30 * 1000; // 30 second cache for real-time data
  
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.nseindia.com/',
    'Origin': 'https://www.nseindia.com',
  };

  static readonly PRE_MARKET_CATEGORIES = ['NIFTY 50', 'Nifty Bank', 'Emerge', 'Securities in F&O', 'Others', 'All'];
  
  static readonly EQUITY_MARKET_CATEGORIES = [
    'NIFTY 50', 'NIFTY NEXT 50', 'NIFTY MIDCAP 50', 'NIFTY MIDCAP 100', 'NIFTY MIDCAP 150',
    'NIFTY SMALLCAP 50', 'NIFTY SMALLCAP 100', 'NIFTY SMALLCAP 250', 'NIFTY MIDSMALLCAP 400',
    'NIFTY 100', 'NIFTY 200', 'NIFTY AUTO', 'NIFTY BANK', 'NIFTY ENERGY',
    'NIFTY FINANCIAL SERVICES', 'NIFTY FMCG', 'NIFTY IT', 'NIFTY MEDIA', 'NIFTY METAL',
    'NIFTY PHARMA', 'NIFTY PSU BANK', 'NIFTY REALTY', 'NIFTY PRIVATE BANK',
    'Securities in F&O', 'Permitted to Trade'
  ];

  private static readonly PRE_MARKET_CATEGORY_MAP: Record<string, string> = {
    'NIFTY 50': 'NIFTY',
    'Nifty Bank': 'BANKNIFTY',
    'Emerge': 'SME',
    'Securities in F&O': 'FO',
    'Others': 'OTHERS',
    'All': 'ALL',
  };

  constructor() {
    this.session = axios.create({
      baseURL: 'https://www.nseindia.com',
      timeout: 15000,
      headers: this.headers,
    });

    this.session.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('[NSE] Session expired (401/403), refreshing cookies...');
          await this.initSession();
          error.config.headers['Cookie'] = this.cookies;
          return this.session.request(error.config);
        }
        throw error;
      }
    );
  }

  private async initSession(): Promise<void> {
    try {
      console.log('[NSE] Initializing session...');
      const response = await axios.get('https://www.nseindia.com', {
        headers: this.headers,
        timeout: 10000,
      });
      
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        this.cookies = setCookieHeader.map((cookie: string) => cookie.split(';')[0]).join('; ');
        this.session.defaults.headers['Cookie'] = this.cookies;
        console.log('[NSE] Session cookies obtained and applied to session');
      }
      
      this.lastCookieRefresh = new Date();
    } catch (error: any) {
      console.error('[NSE] Failed to initialize session:', error.message);
      throw new Error('Failed to initialize NSE session');
    }
  }

  private async ensureSession(): Promise<void> {
    const now = new Date();
    const needsRefresh = !this.lastCookieRefresh || 
      (now.getTime() - this.lastCookieRefresh.getTime()) > this.cookieRefreshIntervalMs;
    
    if (needsRefresh) {
      await this.initSession();
    }
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestIntervalMs) {
      const waitTime = this.minRequestIntervalMs - timeSinceLastRequest;
      console.log(`[NSE] Throttling: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      console.log(`[NSE] Cache hit for: ${key}`);
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.cacheTTLMs,
    });
  }

  private getRequestHeaders(): Record<string, string> {
    return {
      ...this.headers,
      'Cookie': this.cookies,
    };
  }

  private isValidSymbol(symbol: string): boolean {
    return /^[A-Z0-9&-]+$/.test(symbol) && symbol.length >= 1 && symbol.length <= 20;
  }

  private isValidMarketCategory(category: string): boolean {
    return NSEAPI.EQUITY_MARKET_CATEGORIES.some(
      c => c.toUpperCase() === category.toUpperCase()
    );
  }

  private isValidPreMarketCategory(category: string): boolean {
    return NSEAPI.PRE_MARKET_CATEGORIES.some(
      c => c.toUpperCase() === category.toUpperCase() || c === category
    );
  }

  async getEquityMarketData(category: string = 'NIFTY 50'): Promise<NSEApiResponse<NSEEquityData[]>> {
    const startTime = Date.now();
    const cacheKey = `market_${category.toUpperCase()}`;
    
    const cached = this.getCached<NSEEquityData[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        cached: true,
      };
    }
    
    if (!this.isValidMarketCategory(category)) {
      return {
        success: false,
        error: `Invalid category: ${category}. Valid categories: ${NSEAPI.EQUITY_MARKET_CATEGORIES.slice(0, 5).join(', ')}...`,
        errorCode: 'INVALID_CATEGORY',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
    
    try {
      await this.ensureSession();
      await this.throttle();
      
      const encodedCategory = category.toUpperCase().replace(/ /g, '%20').replace(/&/g, '%26');
      const url = `/api/equity-stockIndices?index=${encodedCategory}`;
      
      console.log(`[NSE] Fetching equity market data for: ${category}`);
      
      const response = await this.session.get(url, {
        headers: this.getRequestHeaders(),
      });
      
      const data = response.data?.data;
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format from NSE');
      }

      const equityData: NSEEquityData[] = data.map((item: any) => ({
        symbol: item.symbol,
        open: item.open,
        dayHigh: item.dayHigh,
        dayLow: item.dayLow,
        lastPrice: item.lastPrice,
        previousClose: item.previousClose,
        change: item.change,
        pChange: item.pChange,
        totalTradedVolume: item.totalTradedVolume,
        totalTradedValue: item.totalTradedValue,
        yearHigh: item.yearHigh,
        yearLow: item.yearLow,
        perChange365d: item.perChange365d,
        perChange30d: item.perChange30d,
      }));

      this.setCache(cacheKey, equityData);

      return {
        success: true,
        data: equityData,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('[NSE] Error fetching equity market data:', error.message);
      
      const errorCode = error.response?.status === 429 ? 'RATE_LIMITED' : 
                       error.code === 'ECONNREFUSED' ? 'NETWORK_ERROR' : 'UNKNOWN';
      
      return {
        success: false,
        error: `Failed to fetch market data: ${error.message}`,
        errorCode,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async getEquityQuote(symbol: string): Promise<NSEApiResponse<NSEQuoteInfo>> {
    const startTime = Date.now();
    const normalizedSymbol = symbol.toUpperCase().trim();
    const cacheKey = `quote_${normalizedSymbol}`;
    
    const cached = this.getCached<NSEQuoteInfo>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        cached: true,
      };
    }
    
    if (!this.isValidSymbol(normalizedSymbol)) {
      return {
        success: false,
        error: `Invalid symbol format: ${symbol}. Symbols should contain only letters, numbers, & and -.`,
        errorCode: 'INVALID_SYMBOL',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
    
    try {
      await this.ensureSession();
      await this.throttle();
      
      const encodedSymbol = normalizedSymbol.replace(/ /g, '%20').replace(/&/g, '%26');
      const url = `/api/quote-equity?symbol=${encodedSymbol}`;
      
      console.log(`[NSE] Fetching quote for: ${normalizedSymbol}`);
      
      const response = await this.session.get(url, {
        headers: this.getRequestHeaders(),
      });
      
      const info = response.data?.info;
      const priceInfo = response.data?.priceInfo;
      
      if (!info || !priceInfo) {
        return {
          success: false,
          error: `No data found for symbol: ${normalizedSymbol}. Please check if the symbol is correct.`,
          errorCode: 'INVALID_SYMBOL',
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        };
      }

      const quoteInfo: NSEQuoteInfo = {
        symbol: info.symbol,
        companyName: info.companyName,
        industry: info.industry || 'N/A',
        lastPrice: priceInfo.lastPrice,
        change: priceInfo.change,
        pChange: priceInfo.pChange,
        previousClose: priceInfo.previousClose,
        open: priceInfo.open,
        close: priceInfo.close || priceInfo.lastPrice,
        dayHigh: priceInfo.intraDayHighLow?.max || priceInfo.dayHigh,
        dayLow: priceInfo.intraDayHighLow?.min || priceInfo.dayLow,
        yearHigh: priceInfo.weekHighLow?.max || 0,
        yearLow: priceInfo.weekHighLow?.min || 0,
        totalTradedVolume: priceInfo.totalTradedVolume || 0,
        totalTradedValue: priceInfo.totalTradedValue || 0,
        lastUpdateTime: priceInfo.lastUpdateTime || new Date().toISOString(),
        series: info.series,
      };

      this.setCache(cacheKey, quoteInfo);

      return {
        success: true,
        data: quoteInfo,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error(`[NSE] Error fetching quote for ${normalizedSymbol}:`, error.message);
      
      const errorCode = error.response?.status === 429 ? 'RATE_LIMITED' :
                       error.response?.status === 404 ? 'INVALID_SYMBOL' :
                       error.code === 'ECONNREFUSED' ? 'NETWORK_ERROR' : 'UNKNOWN';
      
      return {
        success: false,
        error: errorCode === 'INVALID_SYMBOL' 
          ? `Symbol not found: ${normalizedSymbol}` 
          : `Failed to fetch quote: ${error.message}`,
        errorCode,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async getPreMarketData(category: string = 'NIFTY 50'): Promise<NSEApiResponse<NSEPreMarketData[]>> {
    const startTime = Date.now();
    const cacheKey = `premarket_${category}`;
    
    const cached = this.getCached<NSEPreMarketData[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        cached: true,
      };
    }
    
    if (!this.isValidPreMarketCategory(category)) {
      return {
        success: false,
        error: `Invalid pre-market category: ${category}. Valid categories: ${NSEAPI.PRE_MARKET_CATEGORIES.join(', ')}`,
        errorCode: 'INVALID_CATEGORY',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
    
    try {
      await this.ensureSession();
      await this.throttle();
      
      const key = NSEAPI.PRE_MARKET_CATEGORY_MAP[category] || 'NIFTY';
      const url = `/api/market-data-pre-open?key=${key}`;
      
      console.log(`[NSE] Fetching pre-market data for: ${category}`);
      
      const response = await this.session.get(url, {
        headers: this.getRequestHeaders(),
      });
      
      const data = response.data?.data;
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid pre-market response format');
      }

      const preMarketData: NSEPreMarketData[] = data.map((item: any) => {
        const metadata = item.metadata || item;
        return {
          symbol: metadata.symbol,
          lastPrice: metadata.lastPrice,
          change: metadata.change,
          pChange: metadata.pChange,
          previousClose: metadata.previousClose,
          iep: metadata.iep || 0,
          finalPrice: metadata.finalPrice || metadata.lastPrice,
          finalQuantity: metadata.finalQuantity || 0,
          totalBuyQuantity: metadata.totalBuyQuantity || 0,
          totalSellQuantity: metadata.totalSellQuantity || 0,
        };
      });

      this.setCache(cacheKey, preMarketData);

      return {
        success: true,
        data: preMarketData,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('[NSE] Error fetching pre-market data:', error.message);
      
      const errorCode = error.response?.status === 429 ? 'RATE_LIMITED' :
                       error.code === 'ECONNREFUSED' ? 'NETWORK_ERROR' : 'UNKNOWN';
      
      return {
        success: false,
        error: `Failed to fetch pre-market data: ${error.message}`,
        errorCode,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async getOptionChain(symbol: string, isIndex: boolean = false): Promise<NSEApiResponse<any>> {
    const startTime = Date.now();
    const normalizedSymbol = symbol.toUpperCase().trim();
    const cacheKey = `options_${normalizedSymbol}_${isIndex}`;
    
    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        cached: true,
      };
    }
    
    if (!this.isValidSymbol(normalizedSymbol)) {
      return {
        success: false,
        error: `Invalid symbol format: ${symbol}`,
        errorCode: 'INVALID_SYMBOL',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
    
    try {
      await this.ensureSession();
      await this.throttle();
      
      const encodedSymbol = normalizedSymbol.replace(/ /g, '%20').replace(/&/g, '%26');
      const url = isIndex 
        ? `/api/option-chain-indices?symbol=${encodedSymbol}`
        : `/api/option-chain-equities?symbol=${encodedSymbol}`;
      
      console.log(`[NSE] Fetching option chain for: ${normalizedSymbol} (isIndex: ${isIndex})`);
      
      const response = await this.session.get(url, {
        headers: this.getRequestHeaders(),
      });
      
      const records = response.data?.records;
      
      if (!records) {
        return {
          success: false,
          error: `No option chain data found for symbol: ${normalizedSymbol}`,
          errorCode: 'INVALID_SYMBOL',
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        };
      }

      this.setCache(cacheKey, records);

      return {
        success: true,
        data: records,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error(`[NSE] Error fetching option chain for ${normalizedSymbol}:`, error.message);
      
      const errorCode = error.response?.status === 429 ? 'RATE_LIMITED' :
                       error.response?.status === 404 ? 'INVALID_SYMBOL' :
                       error.code === 'ECONNREFUSED' ? 'NETWORK_ERROR' : 'UNKNOWN';
      
      return {
        success: false,
        error: errorCode === 'INVALID_SYMBOL'
          ? `Symbol not found: ${normalizedSymbol}`
          : `Failed to fetch option chain: ${error.message}`,
        errorCode,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async testConnection(): Promise<NSEApiResponse<{ message: string }>> {
    const startTime = Date.now();
    
    try {
      await this.initSession();
      
      return {
        success: true,
        data: { message: 'NSE connection successful - Session initialized' },
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection failed',
        errorCode: 'SESSION_FAILED',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('[NSE] Cache cleared');
  }
}

export const nseApi = new NSEAPI();
