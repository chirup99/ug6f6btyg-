/**
 * Advanced AI Trading Agent - Like Replit Agent but for Trading
 * 
 * This agent uses LLM function calling to intelligently:
 * - Analyze stocks with real-time data from Angel One
 * - Search news and market sentiment with web scraping
 * - Access user's trading journal for personalized insights
 * - Query social feed for community discussions
 * - Generate comprehensive reports with charts
 * - Fetch IPO updates, trending stocks, global news
 * 
 * Key Features:
 * - Multi-tool parallel execution for speed
 * - Graceful degradation with fallbacks on failures
 * - Smart intent classification for query understanding
 * - Safe web scraping with timeouts and rate limiting
 */

import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
import { EnhancedFinancialScraper } from "./enhanced-financial-scraper";
import { angelOneApi } from "./angel-one-api";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const financialScraper = new EnhancedFinancialScraper();

// =============================================================================
// SAFE UTILITIES - Defensive helpers to prevent crashes
// =============================================================================

const TIMEOUT_SHORT = 5000;
const TIMEOUT_MEDIUM = 10000;
const TIMEOUT_LONG = 15000;

// Result type with explicit data presence flag to avoid type drift
interface SafeResult<T> {
  data: T;
  ok: boolean;
  error?: string;
}

function safeNumber(value: any, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

function safeNumberOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function safeString(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  return typeof value === 'string' ? value : String(value);
}

// Wraps a promise with try-catch but returns a result object, NOT pre-awaited
// Usage: Pass fn directly to Promise.all without calling it first
function wrapSafe<T>(fn: () => Promise<T>, fallback: T, context: string = 'API'): Promise<SafeResult<T>> {
  return fn()
    .then(data => ({ data, ok: true }))
    .catch((error: any) => {
      console.warn(`[AI-AGENT] ${context} failed:`, error?.message || error);
      return { data: fallback, ok: false, error: error?.message };
    });
}

// Result type for fetches that may use fallback sources
interface FetchWithFallbackResult {
  data: any;
  degraded: boolean;
  source: string;
  primaryError?: string;
}

// Helper: Fetch stock data with explicit fallback tracking
async function fetchStockWithFallback(symbol: string): Promise<FetchWithFallbackResult> {
  try {
    const resp = await axios.get(`http://localhost:5000/api/stock-analysis/${symbol}`, { timeout: TIMEOUT_SHORT });
    return { data: resp.data, degraded: false, source: 'Internal API' };
  } catch (error: any) {
    // Primary failed, try fallback
    try {
      const yahooData = await scrapeYahooFinanceData(symbol);
      if (yahooData) {
        return { 
          data: yahooData, 
          degraded: true, 
          source: 'Yahoo Finance (fallback)', 
          primaryError: error?.message 
        };
      }
    } catch {}
    // Both failed
    return { data: null, degraded: true, source: 'none', primaryError: error?.message };
  }
}

// Normalize stock data to consistent shape regardless of source
interface NormalizedStockData {
  priceData: {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high52Week: number;
    low52Week: number;
    marketCap: string;
  };
  indicators?: {
    rsi?: number;
    macd?: any;
  };
  fundamentals?: {
    pe?: number | string;
    eps?: number | string;
  };
  source: string;
  degraded: boolean;
}

// isDegraded parameter allows callers to explicitly mark fallback data as degraded
function normalizeStockData(data: any, source: string, isDegraded: boolean = false): NormalizedStockData {
  if (!data) {
    return {
      priceData: { price: 0, change: 0, changePercent: 0, volume: 0, high52Week: 0, low52Week: 0, marketCap: 'N/A' },
      source,
      degraded: true
    };
  }
  
  // If data already has priceData shape (internal API)
  if (data.priceData) {
    return {
      priceData: {
        price: safeNumber(data.priceData.close ?? data.priceData.price),
        change: safeNumber(data.priceData.change),
        changePercent: safeNumber(data.priceData.changePercent),
        volume: safeNumber(data.priceData.volume),
        high52Week: safeNumber(data.priceData.high52Week),
        low52Week: safeNumber(data.priceData.low52Week),
        marketCap: safeString(data.priceData.marketCap, 'N/A')
      },
      indicators: data.indicators ? {
        rsi: safeNumberOrNull(data.indicators.rsi) ?? undefined,
        macd: data.indicators.macd
      } : undefined,
      fundamentals: data.fundamentals ? {
        pe: data.fundamentals.pe,
        eps: data.fundamentals.eps
      } : undefined,
      source,
      degraded: isDegraded
    };
  }
  
  // If data is raw Yahoo Finance shape (flat object with price, change, etc)
  // This is typically a fallback source, so caller should set isDegraded=true
  return {
    priceData: {
      price: safeNumber(data.price),
      change: safeNumber(data.change),
      changePercent: safeNumber(data.changePercent),
      volume: safeNumber(data.volume),
      high52Week: safeNumber(data.high52Week),
      low52Week: safeNumber(data.low52Week),
      marketCap: safeString(data.marketCap, 'N/A')
    },
    source,
    degraded: isDegraded
  };
}

// =============================================================================
// TYPES
// =============================================================================

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface AgentResponse {
  message: string;
  charts?: ChartData[];
  stocks?: StockInsight[];
  news?: NewsItem[];
  insights?: string[];
  actions?: ActionSuggestion[];
  sources?: string[];
  companyInsights?: CompanyInsightsData;
}

export interface ChartData {
  type: 'price' | 'performance' | 'comparison' | 'sentiment';
  title: string;
  data: Array<{ time: string; value: number; label?: string }>;
  trend?: 'positive' | 'negative' | 'neutral';
}

export interface StockInsight {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  technicalSignal?: string;
  sentimentScore?: number;
  recommendation?: string;
}

export interface NewsItem {
  title: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number;
  url?: string;
}

export interface ActionSuggestion {
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// Balance Sheet row item
export interface BalanceSheetRow {
  label: string;
  values: Array<{ year: string; value: number }>;
}

// Profit & Loss row item
export interface ProfitLossRow {
  label: string;
  values: Array<{ year: string; value: number }>;
}

// Annual financial data structure
export interface AnnualFinancialData {
  years: string[];
  balanceSheet: BalanceSheetRow[];
  profitLoss: ProfitLossRow[];
}

export interface CompanyInsightsData {
  symbol: string;
  name: string;
  currentPrice: number;
  quarterlyPerformance: Array<{ quarter: string; value?: number; changePercent: number }>;
  trend: 'positive' | 'negative' | 'neutral';
  pe: number;
  eps: number;
  recommendation: string;
  annualFinancials?: AnnualFinancialData;
}

// =============================================================================
// WEB SCRAPING UTILITIES
// =============================================================================

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function scrapeGoogleNews(query: string, limit: number = 5): Promise<Array<{ title: string; snippet: string; source: string; url: string }>> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const response = await axios.get(rssUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const results: Array<{ title: string; snippet: string; source: string; url: string }> = [];

    $('item').slice(0, limit).each((i, elem) => {
      const title = $(elem).find('title').text().replace(/<[^>]*>/g, '').trim();
      const link = $(elem).find('link').text();
      const source = $(elem).find('source').text() || 'News';
      const description = $(elem).find('description').text().replace(/<[^>]*>/g, '').trim();

      if (title && link) {
        results.push({
          title,
          snippet: description || title,
          source,
          url: link
        });
      }
    });

    return results;
  } catch (error) {
    console.error('[AI-AGENT] Google News scrape error:', error);
    return [];
  }
}

async function scrapeYahooFinanceData(symbol: string): Promise<any> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });

    const data = response.data;
    if (!data?.chart?.result?.[0]) {
      return null;
    }

    const result = data.chart.result[0];
    const meta = result.meta;

    return {
      symbol,
      price: meta.regularMarketPrice || 0,
      change: meta.regularMarketPrice - meta.previousClose || 0,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100) || 0,
      volume: meta.regularMarketVolume || 0,
      high52Week: meta.fiftyTwoWeekHigh,
      low52Week: meta.fiftyTwoWeekLow,
      marketCap: meta.marketCap,
      previousClose: meta.previousClose
    };
  } catch (error) {
    console.error(`[AI-AGENT] Yahoo Finance error for ${symbol}:`, error);
    return null;
  }
}

async function scrapeMoneyControlIPOs(): Promise<Array<{ company: string; dates: string; priceRange: string; status: string; subscription: string }>> {
  try {
    const url = 'https://www.moneycontrol.com/ipo/ipo-dashboard';
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const ipos: Array<{ company: string; dates: string; priceRange: string; status: string; subscription: string }> = [];

    // Try multiple selectors for IPO tables
    $('.ipo_table tr, .ipo-list tr, table.tblIpo tr').slice(1, 10).each((i, elem) => {
      const cells = $(elem).find('td');
      if (cells.length >= 3) {
        const company = cells.eq(0).text().trim();
        const dates = cells.eq(1).text().trim() || cells.eq(2).text().trim();
        const priceRange = cells.eq(2).text().trim() || cells.eq(3).text().trim();
        const status = cells.eq(4).text().trim() || 'Active';
        const subscription = cells.eq(5).text().trim() || '-';

        if (company && company.length > 2) {
          ipos.push({ company, dates, priceRange, status, subscription });
        }
      }
    });

    return ipos.length > 0 ? ipos : [
      { company: 'Check MoneyControl for latest IPOs', dates: 'Dec 2025', priceRange: '-', status: 'Visit moneycontrol.com', subscription: '-' }
    ];
  } catch (error) {
    console.error('[AI-AGENT] IPO scrape error:', error);
    return [
      { company: 'IPO data temporarily unavailable', dates: '-', priceRange: '-', status: 'Please try again', subscription: '-' }
    ];
  }
}

async function scrapeTrendingStocks(): Promise<Array<{ symbol: string; name: string; change: string; volume: string; category: string }>> {
  try {
    // Scrape NSE top gainers/losers
    const trending: Array<{ symbol: string; name: string; change: string; volume: string; category: string }> = [];

    // Try Yahoo Finance trending
    const url = 'https://query1.finance.yahoo.com/v1/finance/trending/IN';
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });

    if (response.data?.finance?.result?.[0]?.quotes) {
      response.data.finance.result[0].quotes.slice(0, 10).forEach((quote: any) => {
        trending.push({
          symbol: quote.symbol?.replace('.NS', '') || 'Unknown',
          name: quote.shortName || quote.symbol || 'Unknown',
          change: 'Trending',
          volume: 'High',
          category: 'Most Active'
        });
      });
    }

    // Add some static popular stocks if trending is empty
    if (trending.length === 0) {
      return [
        { symbol: 'RELIANCE', name: 'Reliance Industries', change: 'Active', volume: 'High', category: 'Large Cap' },
        { symbol: 'TCS', name: 'Tata Consultancy Services', change: 'Active', volume: 'High', category: 'IT' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank', change: 'Active', volume: 'High', category: 'Banking' },
        { symbol: 'INFY', name: 'Infosys', change: 'Active', volume: 'High', category: 'IT' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank', change: 'Active', volume: 'High', category: 'Banking' }
      ];
    }

    return trending;
  } catch (error) {
    console.error('[AI-AGENT] Trending stocks error:', error);
    return [
      { symbol: 'NIFTY50', name: 'Nifty 50 Index', change: '-', volume: '-', category: 'Index' },
      { symbol: 'RELIANCE', name: 'Reliance Industries', change: '-', volume: '-', category: 'Large Cap' }
    ];
  }
}

async function scrapeGlobalMarketNews(): Promise<Array<{ headline: string; market: string; impact: string; source: string }>> {
  try {
    const news: Array<{ headline: string; market: string; impact: string; source: string }> = [];

    // Scrape global market news from Google News
    const queries = [
      'US stock market today',
      'Asian markets today',
      'European markets today',
      'Global economy news'
    ];

    for (const query of queries.slice(0, 2)) {
      const results = await scrapeGoogleNews(query, 2);
      results.forEach(result => {
        news.push({
          headline: result.title,
          market: query.includes('US') ? 'US Markets' : query.includes('Asian') ? 'Asian Markets' : 'Global',
          impact: 'Medium',
          source: result.source
        });
      });
    }

    return news.slice(0, 8);
  } catch (error) {
    console.error('[AI-AGENT] Global news error:', error);
    return [
      { headline: 'Global market data temporarily unavailable', market: 'Global', impact: '-', source: 'System' }
    ];
  }
}

// =============================================================================
// TRADING TOOLS - Functions the AI can call
// =============================================================================

const tradingTools: AgentTool[] = [
  // TOOL 1: Get Stock Price & Technical Analysis (Uses Angel One when authenticated)
  {
    name: "get_stock_price",
    description: "Get real-time stock price, technical indicators (RSI, MACD, EMA), and fundamental data for a stock symbol. Uses Angel One API when authenticated for live data. Use for any stock price or analysis query.",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock symbol like RELIANCE, TCS, INFY, HDFCBANK" }
      },
      required: ["symbol"]
    },
    execute: async (params: { symbol: string }) => {
      const symbolUpper = params.symbol.toUpperCase();
      let isDegraded = false;
      let rawData: any = null;
      let source = 'Internal API';
      
      // Check if Angel One is authenticated - if so, prioritize it
      const isAngelOneConnected = angelOneApi.isConnected();
      console.log(`[AI-AGENT] 📈 Fetching price for ${symbolUpper}, Angel One connected: ${isAngelOneConnected}`);
      
      try {
        // Try internal API first (which uses Angel One if authenticated)
        const response = await axios.get(`http://localhost:5000/api/stock-analysis/${symbolUpper}`, { timeout: 10000 });
        rawData = response.data;
        source = isAngelOneConnected ? 'Angel One API (Live)' : 'Internal API';
      } catch (error) {
        // Fallback to Yahoo Finance
        isDegraded = true;
        source = 'Yahoo Finance (fallback)';
        rawData = await scrapeYahooFinanceData(symbolUpper);
      }
      
      if (!rawData) {
        return { error: `Failed to fetch data for ${params.symbol}`, suggestion: 'Try checking if the symbol is correct' };
      }
      
      // Also fetch related news
      const newsData = await scrapeGoogleNews(`${symbolUpper} stock news`, 3).catch(() => []);
      
      // Normalize to consistent schema
      const normalized = normalizeStockData(rawData, source, isDegraded);
      return {
        symbol: symbolUpper,
        ...normalized,
        recentNews: newsData.map((n: any) => ({
          title: safeString(n?.title, 'News unavailable'),
          source: safeString(n?.source, 'Unknown')
        })),
        angelOneConnected: isAngelOneConnected,
        dataStatus: isDegraded ? 'degraded' : (isAngelOneConnected ? 'live (Angel One)' : 'live')
      };
    }
  },

  // TOOL 2: Get Chart Data
  {
    name: "get_chart_data",
    description: "Get historical price chart data for a stock with specified timeframe (1D, 5D, 1M, 6M, 1Y). Returns OHLC data for charts.",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock symbol" },
        timeframe: { type: "string", enum: ["1D", "5D", "1M", "6M", "1Y"], description: "Chart timeframe" }
      },
      required: ["symbol"]
    },
    execute: async (params: { symbol: string; timeframe?: string }) => {
      try {
        const tf = params.timeframe || "1D";
        const response = await axios.get(`http://localhost:5000/api/stock-chart-data/${params.symbol.toUpperCase()}?timeframe=${tf}`, { timeout: 10000 });
        return { chartData: response.data, timeframe: tf, symbol: params.symbol.toUpperCase() };
      } catch (error) {
        return { error: `Failed to fetch chart data for ${params.symbol}`, chartData: [] };
      }
    }
  },

  // TOOL 3: Web Search - Deep Research
  {
    name: "web_search",
    description: "Search the web for any financial information, company news, market analysis, IPO details, or trending topics. Use this for real-time research on any query.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query like 'Tata Motors Q3 results' or 'upcoming IPOs December 2025' or 'RBI rate decision impact'" },
        limit: { type: "number", description: "Number of results (max 10)" }
      },
      required: ["query"]
    },
    execute: async (params: { query: string; limit?: number }) => {
      try {
        console.log(`[AI-AGENT] 🌐 Web search: "${params.query}"`);
        const results = await scrapeGoogleNews(params.query, params.limit || 5);
        
        // Also try to extract stock symbol and get price if mentioned
        const stockMatch = params.query.match(/\b(RELIANCE|TCS|INFY|HDFCBANK|ICICIBANK|BHARTIARTL|ITC|SBIN|WIPRO|TECHM|ADANIPORTS|ASIANPAINT|BAJFINANCE|TATAMOTORS|MARUTI|TATASTEEL)\b/i);
        let stockData = null;
        if (stockMatch) {
          stockData = await scrapeYahooFinanceData(stockMatch[1].toUpperCase());
        }

        return {
          searchResults: results,
          stockData,
          query: params.query,
          resultCount: results.length,
          source: 'Google News + Web Scraping'
        };
      } catch (error) {
        return { error: 'Web search failed', searchResults: [], query: params.query };
      }
    }
  },

  // TOOL 4: Market News
  {
    name: "search_market_news",
    description: "Get latest financial news and market updates. Can filter by stock symbol, sector, or topic. Use for news-related queries.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query like 'RELIANCE earnings' or 'RBI rate decision' or 'IT sector'" },
        limit: { type: "number", description: "Number of results to return (max 10)" }
      },
      required: ["query"]
    },
    execute: async (params: { query: string; limit?: number }) => {
      try {
        // First try internal API
        const response = await axios.get(`http://localhost:5000/api/stock-news`, {
          params: { q: params.query, limit: params.limit || 5 },
          timeout: 8000
        });
        if (response.data && response.data.length > 0) {
          return response.data;
        }
      } catch (error) {
        // Fallback to web scraping
      }
      
      // Fallback to Google News scraping
      const newsResults = await scrapeGoogleNews(`${params.query} India stock market`, params.limit || 5);
      return {
        news: newsResults.map(n => ({
          title: n.title,
          source: n.source,
          snippet: n.snippet,
          url: n.url,
          sentiment: n.title.toLowerCase().includes('fall') || n.title.toLowerCase().includes('drop') ? 'negative' : 
                     n.title.toLowerCase().includes('rise') || n.title.toLowerCase().includes('gain') ? 'positive' : 'neutral'
        })),
        source: 'Web Scraping'
      };
    }
  },

  // TOOL 5: Trading Journal Analysis
  {
    name: "get_trading_journal",
    description: "Get user's trading journal data including P&L, win rate, trade history, and performance metrics. Use for personalized trading insights.",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["today", "week", "month", "all"], description: "Time period for journal data" }
      }
    },
    execute: async (params: { period?: string }) => {
      try {
        const response = await axios.get(`http://localhost:5000/api/journal/all-dates`, { timeout: 10000 });
        const allData = response.data;
        
        const dates = Object.keys(allData);
        let totalPnL = 0;
        let totalTrades = 0;
        let winningTrades = 0;
        let bestDay = { date: '', pnl: -Infinity };
        let worstDay = { date: '', pnl: Infinity };
        const recentTrades: any[] = [];
        
        dates.forEach(date => {
          const dayData = allData[date];
          const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
          if (metrics) {
            totalPnL += metrics.netPnL || 0;
            totalTrades += metrics.totalTrades || 0;
            winningTrades += metrics.winningTrades || 0;
            
            if (metrics.netPnL > bestDay.pnl) bestDay = { date, pnl: metrics.netPnL };
            if (metrics.netPnL < worstDay.pnl) worstDay = { date, pnl: metrics.netPnL };
          }
          
          // Collect recent trades
          const trades = dayData?.tradingData?.trades || dayData?.trades || [];
          trades.slice(0, 3).forEach((t: any) => recentTrades.push({ ...t, date }));
        });
        
        return {
          totalDays: dates.length,
          totalPnL: Math.round(totalPnL),
          totalTrades,
          winRate: totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) + '%' : '0%',
          averagePnLPerDay: dates.length > 0 ? Math.round(totalPnL / dates.length) : 0,
          bestDay,
          worstDay: worstDay.pnl !== Infinity ? worstDay : { date: 'N/A', pnl: 0 },
          recentDates: dates.slice(-7),
          recentTrades: recentTrades.slice(0, 5),
          period: params.period || 'all'
        };
      } catch (error) {
        return { error: "Failed to fetch journal data", totalDays: 0, totalPnL: 0 };
      }
    }
  },

  // TOOL 6: Social Feed Intelligence
  {
    name: "get_social_feed",
    description: "Get community discussions, trending topics, and sentiment from the social feed. Filter by stock symbol or topic for relevant posts.",
    parameters: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter by stock symbol or topic (e.g., RELIANCE, banking, bullish)" },
        limit: { type: "number", description: "Number of posts to return" }
      }
    },
    execute: async (params: { filter?: string; limit?: number }) => {
      try {
        const response = await axios.get(`http://localhost:5000/api/social-posts`, {
          params: { limit: params.limit || 15 },
          timeout: 10000
        });
        
        let posts = response.data.posts || [];
        
        // Filter by keyword if provided
        if (params.filter) {
          const filterLower = params.filter.toLowerCase();
          posts = posts.filter((post: any) => 
            post.content?.toLowerCase().includes(filterLower) ||
            post.stockSymbol?.toLowerCase().includes(filterLower) ||
            post.hashtags?.some((h: string) => h.toLowerCase().includes(filterLower))
          );
        }
        
        // Analyze sentiment
        const bullishPosts = posts.filter((p: any) => 
          p.content?.toLowerCase().includes('bullish') || 
          p.content?.toLowerCase().includes('buy') ||
          p.content?.toLowerCase().includes('long')
        ).length;
        
        const bearishPosts = posts.filter((p: any) => 
          p.content?.toLowerCase().includes('bearish') || 
          p.content?.toLowerCase().includes('sell') ||
          p.content?.toLowerCase().includes('short')
        ).length;
        
        return {
          posts: posts.slice(0, params.limit || 10),
          totalCount: posts.length,
          sentiment: {
            bullish: bullishPosts,
            bearish: bearishPosts,
            overall: bullishPosts > bearishPosts ? 'bullish' : bearishPosts > bullishPosts ? 'bearish' : 'neutral'
          },
          filter: params.filter || 'all'
        };
      } catch (error) {
        return { posts: [], error: "Failed to fetch social feed", totalCount: 0 };
      }
    }
  },

  // TOOL 7: Compare Stocks (Enhanced with Real Data for Each Stock)
  {
    name: "compare_stocks",
    description: "Compare multiple stocks by price, fundamentals, quarterly performance, and trend. Use for stock comparison queries. Returns detailed data for each stock including chart-ready quarterly data.",
    parameters: {
      type: "object",
      properties: {
        symbols: { type: "array", items: { type: "string" }, description: "List of stock symbols to compare (max 5)" }
      },
      required: ["symbols"]
    },
    execute: async (params: { symbols: string[] }) => {
      try {
        console.log(`[AI-AGENT] 📊 Comparing stocks: ${params.symbols.join(', ')}`);
        
        const comparisons = await Promise.all(
          params.symbols.slice(0, 5).map(async (symbol) => {
            const symbolUpper = symbol.toUpperCase();
            console.log(`[AI-AGENT] Fetching data for ${symbolUpper}...`);
            
            // Fetch both price data and company insights in parallel for EACH stock
            const [priceResult, insightsResult, newsResult] = await Promise.all([
              wrapSafe(async () => {
                try {
                  const response = await axios.get(`http://localhost:5000/api/stock-analysis/${symbolUpper}`, { timeout: 8000 });
                  return response.data;
                } catch {
                  return await scrapeYahooFinanceData(symbolUpper);
                }
              }, null, `price data for ${symbolUpper}`),
              wrapSafe(() => financialScraper.getCompanyInsights(symbolUpper), null, `insights for ${symbolUpper}`),
              wrapSafe(() => scrapeGoogleNews(`${symbolUpper} stock news`, 3), [], `news for ${symbolUpper}`)
            ]);
            
            const rawData = priceResult.data;
            const insights = insightsResult.data;
            const newsData = newsResult.data ?? [];
            
            if (!rawData && !insights) {
              return { 
                symbol: symbolUpper, 
                status: 'error', 
                error: "Data unavailable", 
                dataStatus: 'failed' 
              };
            }
            
            // Normalize price data
            const normalized = normalizeStockData(rawData, priceResult.ok ? 'API' : 'fallback', !priceResult.ok);
            
            // Get quarterly performance - prefer real data from insights
            let quarterlyPerformance: Array<{ quarter: string; value?: number; changePercent: number }> = [];
            let trend: 'positive' | 'negative' | 'neutral' = 'neutral';
            
            if (insights?.quarterlyPerformance && insights.quarterlyPerformance.length > 0) {
              quarterlyPerformance = insights.quarterlyPerformance.map(q => ({
                quarter: q.quarter,
                value: q.value, // Actual revenue in Cr from scraper
                changePercent: q.changePercent
              }));
              trend = insights.trend;
            } else {
              // Generate based on current change with proper Indian FY quarter format
              const changePercent = normalized.priceData.changePercent;
              const currentDate = new Date();
              
              // Helper function to convert calendar date to Indian fiscal year quarter format
              const getIndianFYQuarterLabel = (date: Date): string => {
                const month = date.getMonth();
                const year = date.getFullYear();
                let quarterNum: number;
                let fiscalYear: number;
                
                if (month >= 3 && month <= 5) {
                  quarterNum = 1;
                  fiscalYear = year + 1;
                } else if (month >= 6 && month <= 8) {
                  quarterNum = 2;
                  fiscalYear = year + 1;
                } else if (month >= 9 && month <= 11) {
                  quarterNum = 3;
                  fiscalYear = year + 1;
                } else {
                  quarterNum = 4;
                  fiscalYear = year;
                }
                return `Q${quarterNum} FY${fiscalYear.toString().slice(-2)}`;
              };
              
              for (let i = 3; i >= 0; i--) {
                const quarterDate = new Date(currentDate);
                quarterDate.setMonth(currentDate.getMonth() - (i * 3));
                const quarterLabel = getIndianFYQuarterLabel(quarterDate);
                const baseTrend = changePercent / 4;
                const seasonalFactor = [0.8, 1.2, 0.9, 1.1][i] || 1;
                quarterlyPerformance.push({
                  quarter: quarterLabel,
                  changePercent: Math.round(baseTrend * seasonalFactor * 100) / 100
                });
              }
              const trendSum = quarterlyPerformance.reduce((sum, q) => sum + q.changePercent, 0);
              trend = trendSum > 1 ? 'positive' : trendSum < -1 ? 'negative' : 'neutral';
            }
            
            return { 
              symbol: symbolUpper, 
              name: insights?.name || symbolUpper,
              priceData: normalized.priceData,
              indicators: normalized.indicators,
              fundamentals: {
                pe: insights?.pe ?? normalized.fundamentals?.pe ?? 'N/A',
                eps: insights?.eps ?? normalized.fundamentals?.eps ?? 'N/A'
              },
              quarterlyPerformance,
              trend,
              recommendation: insights?.recommendation || 'Hold',
              recentNews: newsData.slice(0, 2).map((n: any) => safeString(n?.title, '')),
              annualFinancials: insights?.annualFinancials,
              status: 'success', 
              dataStatus: insightsResult.ok ? 'live' : (priceResult.ok ? 'partial' : 'degraded')
            };
          })
        );
        
        console.log(`[AI-AGENT] ✅ Comparison complete for ${comparisons.length} stocks`);
        
        return { 
          comparisons, 
          comparedSymbols: params.symbols.map(s => s.toUpperCase()),
          comparisonCount: comparisons.filter(c => c.status === 'success').length
        };
      } catch (error) {
        console.error('[AI-AGENT] Compare stocks error:', error);
        return { error: "Failed to compare stocks", comparisons: [], comparedSymbols: [] };
      }
    }
  },

  // TOOL 8: Market Indices
  {
    name: "get_market_indices",
    description: "Get current market indices like NIFTY, SENSEX, Bank Nifty with real-time prices and changes.",
    parameters: {
      type: "object",
      properties: {}
    },
    execute: async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/market-indices`, { timeout: 8000 });
        return response.data;
      } catch (error) {
        // Return cached/static data
        return {
          indices: [
            { name: 'NIFTY 50', symbol: 'NIFTY', status: 'Data temporarily unavailable' },
            { name: 'SENSEX', symbol: 'SENSEX', status: 'Data temporarily unavailable' },
            { name: 'BANK NIFTY', symbol: 'BANKNIFTY', status: 'Data temporarily unavailable' }
          ],
          source: 'Cached data - live data unavailable'
        };
      }
    }
  },

  // TOOL 9: IPO Updates (Enhanced with Web Scraping)
  {
    name: "get_ipo_updates",
    description: "Get information about upcoming IPOs, current IPO subscriptions, and recent IPO listings. Uses live web scraping for latest data.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["upcoming", "current", "recent", "all"], description: "IPO status filter" }
      }
    },
    execute: async (params: { status?: string }) => {
      try {
        console.log('[AI-AGENT] 📊 Fetching IPO data...');
        
        // Scrape real IPO data
        const ipos = await scrapeMoneyControlIPOs();
        
        // Also get news about IPOs
        const ipoNews = await scrapeGoogleNews('IPO India December 2025 listing', 3);
        
        return {
          ipos,
          recentNews: ipoNews.map(n => n.title),
          lastUpdated: new Date().toISOString(),
          source: 'MoneyControl + Google News',
          status: params.status || 'all'
        };
      } catch (error) {
        return {
          ipos: [{ company: 'Check MoneyControl for latest IPOs', dates: '-', priceRange: '-', status: '-', subscription: '-' }],
          error: 'IPO data fetch failed',
          source: 'Fallback'
        };
      }
    }
  },

  // TOOL 10: Sentiment Analysis (Enhanced with True Parallel Execution)
  {
    name: "analyze_sentiment",
    description: "Analyze market sentiment for a stock based on news, social feed, price action, and technical indicators. Provides comprehensive sentiment score.",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock symbol to analyze" }
      },
      required: ["symbol"]
    },
    execute: async (params: { symbol: string }) => {
      const symbolUpper = params.symbol.toUpperCase();
      
      // True parallel fetch - use fetchStockWithFallback for explicit degradation tracking
      const [stockResult, newsResult, socialResult] = await Promise.all([
        // Stock data with explicit fallback tracking
        wrapSafe(() => fetchStockWithFallback(symbolUpper), 
          { data: null, degraded: true, source: 'none' } as FetchWithFallbackResult, 
          'stock data'),
        
        // News scraping
        wrapSafe(() => scrapeGoogleNews(`${params.symbol} stock news`, 5), [], 'news'),
        
        // Social feed
        wrapSafe(async () => {
          const resp = await axios.get(`http://localhost:5000/api/social-posts`, { params: { limit: 20 }, timeout: TIMEOUT_SHORT });
          return resp.data?.posts ?? [];
        }, [], 'social')
      ]);
      
      // Extract the FetchWithFallbackResult - degraded flag is explicit, not inferred from ok
      const stockFetch = stockResult.data as FetchWithFallbackResult;
      const normalized = normalizeStockData(stockFetch.data, stockFetch.source, stockFetch.degraded);
      const newsData = newsResult.data ?? [];
      const socialPosts = socialResult.data ?? [];
      
      // News sentiment calculation
      let newsPositive = 0, newsNegative = 0;
      newsData.forEach((news: any) => {
        const lower = safeString(news?.title).toLowerCase();
        if (lower.includes('rise') || lower.includes('gain') || lower.includes('up') || lower.includes('profit')) newsPositive++;
        if (lower.includes('fall') || lower.includes('drop') || lower.includes('down') || lower.includes('loss')) newsNegative++;
      });
      
      // Social sentiment calculation
      const mentions = socialPosts.filter((p: any) => 
        safeString(p?.content).toLowerCase().includes(params.symbol.toLowerCase())
      );
      const socialMentions = mentions.length;
      const socialBullish = mentions.filter((p: any) => {
        const content = safeString(p?.content).toLowerCase();
        return content.includes('bullish') || content.includes('buy');
      }).length;
      
      // Extract metrics from normalized data
      const priceChange = normalized.priceData.changePercent;
      const rsi = normalized.indicators?.rsi ?? 50;
      
      // Weighted sentiment score (0-100)
      const priceScore = Math.min(100, Math.max(0, 50 + priceChange * 5));
      const newsScore = newsData.length > 0 ? (newsPositive / newsData.length) * 100 : 50;
      const technicalScore = rsi > 70 ? 70 : rsi < 30 ? 30 : rsi;
      const socialScore = socialMentions > 0 ? (socialBullish / socialMentions) * 100 : 50;
      
      const overallScore = priceScore * 0.3 + newsScore * 0.25 + technicalScore * 0.25 + socialScore * 0.2;
      
      return {
        symbol: symbolUpper,
        sentimentScore: Math.round(overallScore),
        sentiment: overallScore > 60 ? 'bullish' : overallScore < 40 ? 'bearish' : 'neutral',
        priceChange: priceChange.toFixed(2) + '%',
        newsAnalysis: {
          total: newsData.length,
          positive: newsPositive,
          negative: newsNegative,
          headlines: newsData.slice(0, 3).map((n: any) => safeString(n?.title, 'News unavailable'))
        },
        socialAnalysis: {
          mentions: socialMentions,
          bullish: socialBullish
        },
        technicalRating: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral',
        rsi: Math.round(rsi),
        dataStatus: {
          stockData: stockResult.ok ? 'live' : 'degraded',
          newsData: newsResult.ok ? 'live' : 'degraded',
          socialData: socialResult.ok ? 'live' : 'degraded'
        }
      };
    }
  },

  // TOOL 11: Trending Stocks
  {
    name: "get_trending_stocks",
    description: "Get trending stocks, top gainers, top losers, and most active stocks in the market today.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["gainers", "losers", "active", "all"], description: "Category of trending stocks" }
      }
    },
    execute: async (params: { category?: string }) => {
      try {
        console.log('[AI-AGENT] 📈 Fetching trending stocks...');
        const trending = await scrapeTrendingStocks();
        
        return {
          trending,
          category: params.category || 'all',
          lastUpdated: new Date().toISOString(),
          source: 'Yahoo Finance + NSE'
        };
      } catch (error) {
        return { 
          trending: [],
          error: 'Failed to fetch trending stocks',
          fallback: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK']
        };
      }
    }
  },

  // TOOL 12: Global Market News
  {
    name: "get_global_news",
    description: "Get global market news including US markets, Asian markets, European markets, and their potential impact on Indian markets.",
    parameters: {
      type: "object",
      properties: {
        region: { type: "string", enum: ["US", "Asia", "Europe", "all"], description: "Market region" }
      }
    },
    execute: async (params: { region?: string }) => {
      try {
        console.log('[AI-AGENT] 🌍 Fetching global market news...');
        const globalNews = await scrapeGlobalMarketNews();
        
        return {
          news: globalNews,
          region: params.region || 'all',
          lastUpdated: new Date().toISOString(),
          source: 'Google News - Global Markets'
        };
      } catch (error) {
        return { news: [], error: 'Failed to fetch global news' };
      }
    }
  },

  // TOOL 13: Company Deep Analysis (with Real Data from Enhanced Financial Scraper)
  {
    name: "get_company_fundamentals",
    description: "Get detailed company fundamentals including P/E ratio, EPS, market cap, revenue, profit margins, and quarterly performance with real data. Use for fundamental analysis.",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock symbol for fundamental analysis" }
      },
      required: ["symbol"]
    },
    execute: async (params: { symbol: string }) => {
      const symbolUpper = params.symbol.toUpperCase();
      console.log(`[AI-AGENT] 📊 Deep analysis for ${symbolUpper} using real data sources...`);
      
      // True parallel fetch - all requests start simultaneously including enhanced scraper
      const [companyInsightsResult, yahooResult, newsResult, internalResult] = await Promise.all([
        // Use enhanced financial scraper for REAL quarterly performance data
        wrapSafe(() => financialScraper.getCompanyInsights(symbolUpper), null, 'Enhanced Financial Scraper'),
        wrapSafe(() => scrapeYahooFinanceData(symbolUpper), null, 'Yahoo Finance'),
        wrapSafe(() => scrapeGoogleNews(`${params.symbol} quarterly results earnings stock news`, 5), [], 'news'),
        wrapSafe(async () => {
          const resp = await axios.get(`http://localhost:5000/api/stock-analysis/${symbolUpper}`, { timeout: TIMEOUT_SHORT });
          return resp.data;
        }, null, 'internal API')
      ]);
      
      // Use enhanced scraper data if available (has REAL quarterly performance)
      const companyInsights = companyInsightsResult.data;
      
      // Normalize other data sources - mark as degraded based on source availability
      const yahooNorm = normalizeStockData(yahooResult.data, 'Yahoo', !yahooResult.ok);
      const internalNorm = normalizeStockData(internalResult.data, 'Internal', !internalResult.ok);
      
      // Prefer internal data, fall back to Yahoo - use nullish coalescing to preserve zeros
      const primaryData = internalResult.ok ? internalNorm : yahooNorm;
      const newsData = newsResult.data ?? [];
      
      // Helper to pick first non-null/undefined value (preserves zeros)
      const pick = (primary: number, fallback: number): number => 
        primary !== null && primary !== undefined ? primary : fallback;
      
      // Extract metrics - prefer company insights, then internal, then Yahoo
      const currentPrice = companyInsights?.currentPrice ?? pick(primaryData.priceData.price, yahooNorm.priceData.price);
      const change = pick(primaryData.priceData.change, yahooNorm.priceData.change);
      const changePercent = pick(primaryData.priceData.changePercent, yahooNorm.priceData.changePercent);
      
      // Use REAL quarterly performance from enhanced scraper if available
      let quarterlyPerformance: Array<{ quarter: string; value?: number; changePercent: number }>;
      let trend: 'positive' | 'negative' | 'neutral';
      
      if (companyInsights?.quarterlyPerformance && companyInsights.quarterlyPerformance.length > 0) {
        // Real data from enhanced financial scraper
        console.log(`[AI-AGENT] ✅ Using REAL quarterly data for ${symbolUpper}`);
        quarterlyPerformance = companyInsights.quarterlyPerformance.map(q => ({
          quarter: q.quarter,
          value: q.value, // Actual revenue in Cr from scraper
          changePercent: q.changePercent
        }));
        trend = companyInsights.trend;
      } else {
        // Fallback: Generate based on current price change with proper Indian FY quarter format
        console.log(`[AI-AGENT] ⚠️ Using estimated quarterly data for ${symbolUpper}`);
        const currentDate = new Date();
        quarterlyPerformance = [];
        
        // Helper function to convert calendar date to Indian fiscal year quarter format
        const getIndianFYQuarterLabel = (date: Date): string => {
          const month = date.getMonth();
          const year = date.getFullYear();
          let quarterNum: number;
          let fiscalYear: number;
          
          if (month >= 3 && month <= 5) {
            quarterNum = 1;
            fiscalYear = year + 1;
          } else if (month >= 6 && month <= 8) {
            quarterNum = 2;
            fiscalYear = year + 1;
          } else if (month >= 9 && month <= 11) {
            quarterNum = 3;
            fiscalYear = year + 1;
          } else {
            quarterNum = 4;
            fiscalYear = year;
          }
          return `Q${quarterNum} FY${fiscalYear.toString().slice(-2)}`;
        };
        
        for (let i = 3; i >= 0; i--) {
          const quarterDate = new Date(currentDate);
          quarterDate.setMonth(currentDate.getMonth() - (i * 3));
          const quarterLabel = getIndianFYQuarterLabel(quarterDate);
          
          // Generate realistic trends based on current change
          const baseTrend = changePercent / 4;
          const seasonalFactor = [0.8, 1.2, 0.9, 1.1][i] || 1;
          const quarterChange = Math.round(baseTrend * seasonalFactor * 100) / 100;
          
          quarterlyPerformance.push({
            quarter: quarterLabel,
            changePercent: quarterChange
          });
        }
        
        const trendSum = quarterlyPerformance.reduce((sum, q) => sum + q.changePercent, 0);
        trend = trendSum > 1 ? 'positive' : trendSum < -1 ? 'negative' : 'neutral';
      }
      
      // Extract PE/EPS - prefer company insights, then internal, then Yahoo
      const pe = companyInsights?.pe ?? primaryData.fundamentals?.pe ?? yahooNorm.fundamentals?.pe ?? 'N/A';
      const eps = companyInsights?.eps ?? primaryData.fundamentals?.eps ?? yahooNorm.fundamentals?.eps ?? 'N/A';
      
      return {
        symbol: symbolUpper,
        name: companyInsights?.name || symbolUpper,
        currentPrice: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: pick(primaryData.priceData.volume, yahooNorm.priceData.volume),
        high52Week: pick(primaryData.priceData.high52Week, yahooNorm.priceData.high52Week),
        low52Week: pick(primaryData.priceData.low52Week, yahooNorm.priceData.low52Week),
        marketCap: yahooNorm.priceData.marketCap !== 'N/A' ? yahooNorm.priceData.marketCap : primaryData.priceData.marketCap,
        quarterlyPerformance,
        trend,
        recommendation: companyInsights?.recommendation || 'Hold - Awaiting more data',
        recentNews: newsData.map((n: any) => ({
          title: safeString(n?.title, 'News unavailable'),
          source: safeString(n?.source, 'Unknown'),
          url: safeString(n?.url, '')
        })),
        pe,
        eps,
        annualFinancials: companyInsights?.annualFinancials,
        source: companyInsightsResult.ok ? 'Real Data (Moneycontrol/NSE/Yahoo)' : 'Yahoo Finance + Internal APIs',
        dataStatus: {
          companyInsights: companyInsightsResult.ok ? 'live' : 'degraded',
          yahoo: yahooResult.ok ? 'live' : 'degraded',
          internal: internalResult.ok ? 'live' : 'degraded',
          news: newsResult.ok ? 'live' : 'degraded'
        }
      };
    }
  },

  // TOOL 14: Generate Summary Report (with True Parallel Execution)
  {
    name: "generate_report",
    description: "Generate a comprehensive summary report combining stock analysis, news, sentiment, and personalized insights from the user's trading journal.",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Stock symbol for the report" },
        includeJournal: { type: "boolean", description: "Include trading journal insights" },
        includeNews: { type: "boolean", description: "Include recent news" }
      },
      required: ["symbol"]
    },
    execute: async (params: { symbol: string; includeJournal?: boolean; includeNews?: boolean }) => {
      const symbolUpper = params.symbol.toUpperCase();
      console.log(`[AI-AGENT] 📄 Generating comprehensive report for ${symbolUpper}...`);

      // True parallel fetch - all requests start simultaneously
      const [stockResult, newsResult, journalResult] = await Promise.all([
        // Stock Analysis
        wrapSafe(async () => {
          try {
            const resp = await axios.get(`http://localhost:5000/api/stock-analysis/${symbolUpper}`, { timeout: TIMEOUT_SHORT });
            return resp.data;
          } catch {
            return await scrapeYahooFinanceData(symbolUpper);
          }
        }, null, 'stock analysis'),
        
        // News (if requested)
        params.includeNews !== false 
          ? wrapSafe(() => scrapeGoogleNews(`${params.symbol} stock news analysis`, 5), [], 'news')
          : Promise.resolve({ data: [], ok: true }),
        
        // Journal (if requested)
        params.includeJournal 
          ? wrapSafe(async () => {
              const resp = await axios.get(`http://localhost:5000/api/journal/all-dates`, { timeout: TIMEOUT_SHORT });
              return resp.data;
            }, {}, 'journal')
          : Promise.resolve({ data: {}, ok: true })
      ]);

      // Normalize stock data - mark as degraded if API failed
      const normalized = normalizeStockData(stockResult.data, stockResult.ok ? 'API' : 'fallback', !stockResult.ok);
      const newsData = newsResult.data ?? [];
      const journalData = journalResult.data ?? {};
      
      const report: any = {
        symbol: symbolUpper,
        generatedAt: new Date().toISOString(),
        sections: {
          stockAnalysis: {
            priceData: normalized.priceData,
            indicators: normalized.indicators,
            fundamentals: normalized.fundamentals
          }
        },
        dataStatus: {
          stockData: stockResult.ok ? 'live' : 'degraded',
          newsData: newsResult.ok ? 'live' : 'degraded',
          journalData: journalResult.ok ? 'live' : 'degraded'
        }
      };
      
      if (params.includeNews !== false) {
        report.sections.recentNews = newsData;
      }

      // Process journal insights safely - use nullish coalescing for trades array
      if (params.includeJournal) {
        const dates = Object.keys(journalData);
        const relatedTrades: any[] = [];
        
        dates.forEach(date => {
          const dayData = journalData[date];
          const trades = dayData?.tradingData?.trades ?? dayData?.trades ?? [];
          trades.forEach((t: any) => {
            const tradeSymbol = safeString(t?.symbol ?? t?.stock ?? '').toLowerCase();
            if (tradeSymbol.includes(params.symbol.toLowerCase())) {
              relatedTrades.push({ ...t, date });
            }
          });
        });
        
        report.sections.journalInsights = {
          relatedTrades: relatedTrades.slice(0, 5),
          tradeCount: relatedTrades.length,
          hasHistory: relatedTrades.length > 0
        };
      }

      // Extract RSI safely from normalized data
      const rsi = normalized.indicators?.rsi ?? 50;
      report.sections.sentimentSummary = {
        technicalSignal: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
        newsSentiment: newsData.length > 0 ? 'Available' : 'Limited',
        journalHistory: report.sections.journalInsights?.hasHistory ? 'You have traded this stock before' : 'No previous trades'
      };

      return report;
    }
  }
];

// =============================================================================
// AI AGENT ORCHESTRATOR (Enhanced)
// =============================================================================

export class TradingAIAgent {
  private tools: AgentTool[];
  private conversationHistory: Array<{ role: string; content: string }>;

  constructor() {
    this.tools = tradingTools;
    this.conversationHistory = [];
  }

  private getToolDescriptions(): string {
    return this.tools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');
  }

  private classifyIntent(query: string): string[] {
    const lower = query.toLowerCase();
    const intents: string[] = [];
    
    // Stock price/analysis
    if (lower.includes('price') || lower.includes('analysis') || lower.includes('rsi') || 
        lower.includes('technical') || lower.includes('macd') || lower.match(/\b(reliance|tcs|infy|hdfcbank|icicibank|wipro|techm|sbin)\b/)) {
      intents.push('stock_analysis');
    }
    
    // News
    if (lower.includes('news') || lower.includes('headline') || lower.includes('update')) {
      intents.push('news');
    }
    
    // IPO
    if (lower.includes('ipo') || lower.includes('listing') || lower.includes('subscription')) {
      intents.push('ipo');
    }
    
    // Journal/Performance
    if (lower.includes('journal') || lower.includes('my trade') || lower.includes('performance') || 
        lower.includes('p&l') || lower.includes('win rate')) {
      intents.push('journal');
    }
    
    // Social/Community
    if (lower.includes('social') || lower.includes('community') || lower.includes('discussion') ||
        lower.includes('trending topic') || lower.includes('what are people')) {
      intents.push('social');
    }
    
    // Comparison
    if (lower.includes('compare') || lower.includes('vs') || lower.includes('versus') ||
        lower.includes('which is better')) {
      intents.push('comparison');
    }
    
    // Sentiment
    if (lower.includes('sentiment') || lower.includes('bullish') || lower.includes('bearish')) {
      intents.push('sentiment');
    }
    
    // Global markets
    if (lower.includes('global') || lower.includes('us market') || lower.includes('asian') || 
        lower.includes('dow') || lower.includes('nasdaq') || lower.includes('international')) {
      intents.push('global');
    }
    
    // Trending
    if (lower.includes('trending') || lower.includes('top gainer') || lower.includes('top loser') ||
        lower.includes('most active') || lower.includes('popular stock')) {
      intents.push('trending');
    }
    
    // Fundamentals
    if (lower.includes('fundamental') || lower.includes('pe ratio') || lower.includes('eps') ||
        lower.includes('market cap') || lower.includes('revenue') || lower.includes('profit')) {
      intents.push('fundamentals');
    }
    
    // Report/Summary
    if (lower.includes('report') || lower.includes('summary') || lower.includes('comprehensive') ||
        lower.includes('full analysis') || lower.includes('deep dive')) {
      intents.push('report');
    }
    
    return intents.length > 0 ? intents : ['general'];
  }

  private parseToolCalls(response: string): Array<{ tool: string; params: any }> {
    const toolCalls: Array<{ tool: string; params: any }> = [];
    
    // Look for tool call patterns like [TOOL: tool_name(params)]
    const toolPattern = /\[TOOL:\s*(\w+)\((.*?)\)\]/g;
    let match;
    
    while ((match = toolPattern.exec(response)) !== null) {
      const toolName = match[1];
      const paramsStr = match[2];
      
      try {
        let params = {};
        if (paramsStr.trim().startsWith('{')) {
          params = JSON.parse(paramsStr);
        } else if (paramsStr.includes('=')) {
          paramsStr.split(',').forEach(pair => {
            const [key, value] = pair.split('=').map(s => s.trim().replace(/["']/g, ''));
            (params as any)[key] = value;
          });
        } else if (paramsStr.trim()) {
          const tool = this.tools.find(t => t.name === toolName);
          if (tool) {
            const firstRequired = Object.keys(tool.parameters.properties || {})[0];
            if (firstRequired) {
              (params as any)[firstRequired] = paramsStr.trim().replace(/["']/g, '');
            }
          }
        }
        
        toolCalls.push({ tool: toolName, params });
      } catch (e) {
        console.error(`Failed to parse tool call: ${match[0]}`, e);
      }
    }
    
    return toolCalls;
  }

  async processQuery(query: string, context?: {
    userId?: string;
    journalData?: any;
    socialData?: any;
  }): Promise<AgentResponse> {
    console.log(`🤖 [TRADING-AGENT] Processing query: ${query}`);
    
    // Classify intent
    const intents = this.classifyIntent(query);
    console.log(`🎯 [TRADING-AGENT] Classified intents: ${intents.join(', ')}`);
    
    const systemPrompt = `You are an advanced AI Trading Agent - like a personal trading assistant powered by real-time data and multiple intelligence sources.

## YOUR CAPABILITIES
You have access to these powerful tools:
${this.getToolDescriptions()}

## HOW TO USE TOOLS
When you need data, include a tool call in this exact format:
[TOOL: tool_name(param1="value1", param2="value2")]

Examples:
- [TOOL: get_stock_price(symbol="RELIANCE")]
- [TOOL: web_search(query="Tata Motors Q3 2025 earnings results")]
- [TOOL: get_ipo_updates(status="current")]
- [TOOL: analyze_sentiment(symbol="HDFCBANK")]
- [TOOL: get_trending_stocks(category="gainers")]
- [TOOL: get_global_news(region="US")]
- [TOOL: get_company_fundamentals(symbol="TCS")]
- [TOOL: generate_report(symbol="INFY", includeJournal=true, includeNews=true)]
- [TOOL: compare_stocks(symbols=["RELIANCE", "TCS", "INFY"])]

## QUERY CONTEXT
User's query intent(s): ${intents.join(', ')}

## RESPONSE GUIDELINES
1. **Call ALL relevant tools** to gather comprehensive data
2. **Be specific with numbers** - prices, percentages, volumes
3. **Provide actionable insights** - What should the user do?
4. **Format clearly** with sections, bullet points, and highlights
5. **Include sources** for transparency

## SPECIAL MARKERS
- For chart data: [CHART:COMPANY_INSIGHTS] (when fundamentals are requested)
- For key metrics: **metric: value**
- For signals: 📈 bullish, 📉 bearish, ➡️ neutral
- For recommendations: 💡 insight, ⚠️ warning, ✅ opportunity

## USER CONTEXT
- Platform: Trading Platform with Angel One integration
- Features: Trading journal, social feed, real-time prices, charts
- Data sources: Angel One API, Yahoo Finance, Google News, Web Scraping

Now process the user's query comprehensively.`;

    try {
      // First pass: Let LLM plan what tools to call
      const planningResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: `User Query: ${query}\n\nAnalyze this query and call ALL relevant tools to provide a comprehensive answer. For queries about companies, always include fundamentals and news.` }] }
        ]
      });

      const planText = planningResponse.text || "";
      console.log(`🔧 [TRADING-AGENT] Planning response:`, planText.substring(0, 800));
      
      // Parse and execute tool calls
      const toolCalls = this.parseToolCalls(planText);
      console.log(`🔧 [TRADING-AGENT] Tool calls identified:`, toolCalls.length, toolCalls.map(t => t.tool));
      
      const toolResults: Record<string, any> = {};
      
      // Execute tools in parallel for speed
      const toolPromises = toolCalls.map(async (call) => {
        const tool = this.tools.find(t => t.name === call.tool);
        if (tool) {
          console.log(`🔧 [TRADING-AGENT] Executing: ${call.tool}`, call.params);
          try {
            const result = await tool.execute(call.params);
            return { tool: call.tool, result };
          } catch (e) {
            console.error(`❌ [TRADING-AGENT] Tool error:`, e);
            return { tool: call.tool, result: { error: `Failed to execute ${call.tool}` } };
          }
        }
        return null;
      });
      
      const results = await Promise.all(toolPromises);
      results.forEach(r => {
        if (r) toolResults[r.tool] = r.result;
      });
      
      // Second pass: Generate final response with tool results
      const hasToolResults = Object.keys(toolResults).length > 0;
      
      const finalPrompt = hasToolResults 
        ? `${systemPrompt}

## TOOL RESULTS
Here is the data from your tool calls:
${JSON.stringify(toolResults, null, 2)}

Now provide a comprehensive, well-formatted response to the user's query using this data.
- Be specific with numbers and data points
- Provide clear insights and recommendations
- Use markdown formatting for readability
- If fundamentals data is available, mention [CHART:COMPANY_INSIGHTS] for the frontend to render a chart

User Query: ${query}`
        : `${systemPrompt}

User Query: ${query}

Provide a helpful response. Mention which tools would provide better data if available.`;

      const finalResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }]
      });

      const responseText = finalResponse.text || "I apologize, but I couldn't generate a response. Please try again.";
      
      // Extract chart markers and data
      const charts: ChartData[] = [];
      let companyInsights: CompanyInsightsData | undefined;
      
      // Check for company insights data
      if (toolResults['get_company_fundamentals'] && !toolResults['get_company_fundamentals'].error) {
        const fundData = toolResults['get_company_fundamentals'];
        companyInsights = {
          symbol: fundData.symbol,
          name: fundData.name,
          currentPrice: fundData.currentPrice,
          quarterlyPerformance: fundData.quarterlyPerformance || [],
          trend: fundData.trend || 'neutral',
          pe: fundData.pe || 0,
          eps: fundData.eps || 0,
          recommendation: fundData.trend === 'positive' ? 'Consider for growth' : 'Monitor closely',
          annualFinancials: fundData.annualFinancials
        };
      }

      // Extract stock insights
      const stocks: StockInsight[] = [];
      if (toolResults['get_stock_price']?.priceData) {
        const sp = toolResults['get_stock_price'];
        stocks.push({
          symbol: sp.symbol || sp.priceData?.symbol || 'Unknown',
          price: sp.priceData?.close || sp.priceData?.price,
          change: sp.priceData?.change,
          changePercent: sp.priceData?.changePercent,
          technicalSignal: sp.indicators?.rsi > 70 ? 'Overbought' : 
                          sp.indicators?.rsi < 30 ? 'Oversold' : 'Neutral'
        });
      }

      // Collect sources
      const sources: string[] = [];
      if (toolResults['get_stock_price']) sources.push('Angel One Real-time Data');
      if (toolResults['web_search']) sources.push('Web Search');
      if (toolResults['search_market_news']) sources.push('Financial News');
      if (toolResults['get_trading_journal']) sources.push('Your Trading Journal');
      if (toolResults['get_social_feed']) sources.push('Community Discussions');
      if (toolResults['get_market_indices']) sources.push('Market Indices');
      if (toolResults['get_ipo_updates']) sources.push('IPO Data (MoneyControl)');
      if (toolResults['get_trending_stocks']) sources.push('Trending Stocks');
      if (toolResults['get_global_news']) sources.push('Global Markets');
      if (toolResults['get_company_fundamentals']) sources.push('Company Fundamentals');
      if (toolResults['analyze_sentiment']) sources.push('Sentiment Analysis');

      return {
        message: responseText,
        charts,
        stocks,
        sources,
        companyInsights,
        insights: this.extractInsights(responseText)
      };

    } catch (error) {
      console.error(`❌ [TRADING-AGENT] Error:`, error);
      return {
        message: `I encountered an error processing your request. Please try again or rephrase your question.`,
        insights: ['Try being more specific with stock symbols', 'Check if the market is open']
      };
    }
  }

  private extractInsights(text: string): string[] {
    const insights: string[] = [];
    
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('💡') || line.includes('📊') || line.includes('⚠️') ||
          line.includes('✅') || line.includes('📈') || line.includes('📉') ||
          line.toLowerCase().includes('insight') ||
          line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('suggest')) {
        const cleaned = line.trim().replace(/^[-*•]\s*/, '');
        if (cleaned.length > 10) {
          insights.push(cleaned);
        }
      }
    }
    
    return insights.slice(0, 5);
  }
}

// Export singleton instance
export const tradingAIAgent = new TradingAIAgent();
