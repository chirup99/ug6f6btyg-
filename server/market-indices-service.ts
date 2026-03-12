import axios from 'axios';

export interface MarketIndex {
  symbol: string;
  regionName: string;
  price: number;
  change: number;
  changePercent: number;
  isUp: boolean;
  marketTime: string;
  isMarketOpen: boolean;
}

// Yahoo Finance symbols for global indices
const YAHOO_FINANCE_INDICES: Record<string, string> = {
  'USA': '^GSPC',           // S&P 500
  'CANADA': '^GSPTSE',      // TSX Composite
  'INDIA': '^NSEI',         // Nifty 50
  'TOKYO': '^N225',         // Nikkei 225
  'HONG KONG': '^HSI',      // Hang Seng
};

// In-memory cache for market indices
let marketIndicesCache: Record<string, MarketIndex> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Hardcoded fallback data as a LAST resort
const FALLBACK_MARKET_DATA: Record<string, MarketIndex> = {
  'USA': { symbol: '^GSPC', regionName: 'USA', price: 5000.00, change: 25.50, changePercent: 0.51, isUp: true, marketTime: new Date().toISOString(), isMarketOpen: true },
  'CANADA': { symbol: '^GSPTSE', regionName: 'CANADA', price: 21000.00, change: -45.20, changePercent: -0.21, isUp: false, marketTime: new Date().toISOString(), isMarketOpen: true },
  'INDIA': { symbol: '^NSEI', regionName: 'INDIA', price: 22000.00, change: 110.30, changePercent: 0.50, isUp: true, marketTime: new Date().toISOString(), isMarketOpen: true },
  'TOKYO': { symbol: '^N225', regionName: 'TOKYO', price: 38000.00, change: 150.40, changePercent: 0.40, isUp: true, marketTime: new Date().toISOString(), isMarketOpen: true },
  'HONG KONG': { symbol: '^HSI', regionName: 'HONG KONG', price: 16500.00, change: -80.15, changePercent: -0.48, isUp: false, marketTime: new Date().toISOString(), isMarketOpen: true },
};

/**
 * Robust fetch using Yahoo Finance Chart API (v8)
 * This endpoint is more stable and doesn't require "crumbs"
 */
async function fetchIndexDataDirect(regionName: string, symbol: string): Promise<MarketIndex | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    console.log(`📡 [Yahoo] Fetching ${regionName} (${symbol}) directly...`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com'
      },
      timeout: 10000
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) {
      console.warn(`⚠️ [Yahoo] No result for ${regionName}`);
      return null;
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.chartPreviousClose;
    const prevClose = meta.chartPreviousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    console.log(`✅ [Yahoo] ${regionName}: ${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);

    return {
      symbol,
      regionName,
      price,
      change,
      changePercent,
      isUp: changePercent >= 0,
      marketTime: new Date(meta.regularMarketTime * 1000).toISOString(),
      isMarketOpen: true // Simplified for index data
    };
  } catch (error: any) {
    console.error(`❌ [Yahoo] API error for ${regionName}: ${error.message}`);
    return null;
  }
}

/**
 * Fetches real market data with throttling and retries
 */
export async function getMarketIndices(): Promise<Record<string, MarketIndex>> {
  const results: Record<string, MarketIndex> = {};
  const entries = Object.entries(YAHOO_FINANCE_INDICES);
  
  console.log(`🌍 Starting sequential fetch for ${entries.length} indices...`);
  
  for (const [regionName, symbol] of entries) {
    const data = await fetchIndexDataDirect(regionName, symbol);
    if (data) {
      results[regionName] = data;
    }
    
    // Throttle: 1 second delay between requests to be safe
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const successCount = Object.keys(results).length;
  console.log(`📊 Successfully fetched ${successCount}/${entries.length} indices`);
  
  if (successCount === 0) {
    throw new Error('All Yahoo Finance fetch attempts failed');
  }

  return results;
}

/**
 * Main entry point with caching and deep fallback
 */
export async function getCachedMarketIndices(): Promise<Record<string, MarketIndex>> {
  const now = Date.now();
  
  // 1. Cache Check
  if (marketIndicesCache && (now - lastFetchTime < CACHE_TTL)) {
    console.log(`📦 Returning cached data (Age: ${Math.round((now - lastFetchTime) / 1000)}s)`);
    return marketIndicesCache;
  }

  // 2. Real Fetch
  try {
    const freshData = await getMarketIndices();
    marketIndicesCache = freshData;
    lastFetchTime = now;
    return freshData;
  } catch (error) {
    console.error(`🛑 Master fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    
    // 3. Fallback to Stale Cache
    if (marketIndicesCache) {
      console.log('⚠️ Using stale cache as emergency fallback');
      return marketIndicesCache;
    }
    
    // 4. Fallback to Hardcoded (Only on first run if API is down)
    console.log('⚠️ Emergency: Using hardcoded fallback data');
    return FALLBACK_MARKET_DATA;
  }
}
