/**
 * Neural Query Engine - Advanced AI-like Query Processing WITHOUT External APIs
 * 
 * Inspired by Replit Agent's thinking approach:
 * 1. UNDERSTAND - Parse and classify user intent
 * 2. PLAN - Determine what data sources to query
 * 3. EXECUTE - Fetch data in parallel from all sources
 * 4. SYNTHESIZE - Combine data into intelligent response
 * 5. PRESENT - Format response with context and insights
 * 
 * NO GEMINI API DEPENDENCY - Uses pattern matching, templates, and smart logic
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { STOCK_UNIVERSE, extractStockSymbol, SYMBOL_TO_INFO, extractMultipleStocks } from "./comprehensive-stock-universe";

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const TIMEOUT_SHORT = 5000;
const TIMEOUT_MEDIUM = 10000;

// Intent patterns for query classification
const INTENT_PATTERNS = {
  stock_analysis: [
    /(?:analyze|analysis|check|show|get|what(?:'s| is))\s+(?:the\s+)?(?:stock|price|data|info)/i,
    /(?:how(?:'s| is))\s+\w+\s+(?:doing|performing|stock)/i,
    /\b(?:price|quote|ticker)\s+(?:of|for)\s+\w+/i,
    /\w+\s+(?:stock|share|price)/i,
  ],
  comparison: [
    /(?:compare|vs|versus|difference|between)\s+/i,
    /\w+\s+(?:vs|versus|or|and)\s+\w+/i,
  ],
  news: [
    /(?:news|latest|update|headline|what(?:'s| is) happening)/i,
    /(?:market|stock)\s+news/i,
  ],
  journal: [
    /(?:my|journal|trade|portfolio|p&l|profit|loss|performance)/i,
    /(?:how|what)\s+(?:am i|is my|are my)\s+(?:doing|trading|performance)/i,
  ],
  market_overview: [
    /(?:market|nifty|sensex|index|indices)\s+(?:today|now|status|overview)/i,
    /(?:how(?:'s| is))\s+(?:the\s+)?market/i,
    /market\s+(?:condition|sentiment|trend)/i,
  ],
  ipo: [
    /\bipo\b/i,
    /(?:upcoming|new|latest)\s+(?:ipo|listing)/i,
  ],
  sector: [
    /(?:sector|industry)\s+(?:analysis|performance|news)/i,
    /\b(?:it|banking|pharma|auto|fmcg|metal)\s+(?:sector|stocks)/i,
  ],
  technical: [
    /(?:technical|chart|rsi|macd|support|resistance|pattern)/i,
    /(?:buy|sell)\s+signal/i,
  ],
  fundamental: [
    /(?:fundamental|pe|eps|revenue|profit|balance sheet|financials)/i,
    /(?:valuation|ratios|earnings)/i,
  ],
};

// ============================================================================
// TYPES
// ============================================================================

interface QueryIntent {
  primary: string;
  secondary: string[];
  confidence: number;
  stocks: Array<{ symbol: string; name: string; sector: string }>;
  keywords: string[];
  isComparison: boolean;
  needsNews: boolean;
  needsJournal: boolean;
  needsTechnical: boolean;
  needsFundamental: boolean;
}

interface DataSource {
  name: string;
  data: any;
  success: boolean;
  error?: string;
  responseTime: number;
}

interface NeuralResponse {
  success: boolean;
  response: string;
  thinking: string[];
  sources: DataSource[];
  stocks: string[];
  intent: string;
  executionTime: number;
}

// ============================================================================
// NEURAL QUERY ENGINE
// ============================================================================

class NeuralQueryEngine {
  
  // Step 1: UNDERSTAND - Parse and classify user intent
  private analyzeIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(/\s+/);
    
    // Use the enhanced extractMultipleStocks function that handles:
    // - Multi-word stock names (e.g., "tata motors", "asian paints")
    // - Single word aliases (e.g., "reliance", "hdfc")
    // - Direct uppercase symbols (e.g., "TATAMOTORS", "TCS")
    // - Comparison queries (e.g., "tata motors vs reliance")
    const stocksFromQuery = extractMultipleStocks(query);
    
    // Convert to the expected format
    const detectedStocks: Array<{ symbol: string; name: string; sector: string }> = stocksFromQuery.map(s => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector
    }));
    
    // Classify intent
    const intents: string[] = [];
    let confidence = 0.5;
    
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerQuery)) {
          if (!intents.includes(intent)) {
            intents.push(intent);
            confidence = Math.min(confidence + 0.15, 0.95);
          }
        }
      }
    }
    
    // Default to stock_analysis if stocks detected but no clear intent
    if (intents.length === 0 && detectedStocks.length > 0) {
      intents.push('stock_analysis');
      confidence = 0.7;
    }
    
    // Default to general if nothing detected
    if (intents.length === 0) {
      intents.push('general');
      confidence = 0.3;
    }
    
    const isComparison = detectedStocks.length > 1 || 
                         /\b(vs|versus|compare|between|or)\b/i.test(lowerQuery);
    
    return {
      primary: intents[0],
      secondary: intents.slice(1),
      confidence,
      stocks: detectedStocks,
      keywords: words.filter(w => w.length > 3),
      isComparison,
      needsNews: intents.includes('news') || intents.includes('market_overview'),
      needsJournal: intents.includes('journal'),
      needsTechnical: intents.includes('technical') || intents.includes('stock_analysis'),
      needsFundamental: intents.includes('fundamental'),
    };
  }
  
  // Step 2: PLAN - Determine data sources to query
  private planDataFetching(intent: QueryIntent): string[] {
    const sources: string[] = [];
    
    if (intent.stocks.length > 0) {
      sources.push('stock_data');
      sources.push('yahoo_finance');
    }
    
    if (intent.needsNews || intent.primary === 'news' || intent.primary === 'market_overview') {
      sources.push('google_news');
    }
    
    if (intent.primary === 'ipo') {
      sources.push('ipo_data');
    }
    
    if (intent.needsJournal) {
      sources.push('journal');
    }
    
    // Always try to get market overview for context
    if (intent.primary === 'market_overview' || intent.stocks.length === 0) {
      sources.push('market_indices');
    }
    
    return sources;
  }
  
  // Step 3: EXECUTE - Fetch data from all sources in parallel
  private async executeDataFetching(
    sources: string[], 
    intent: QueryIntent,
    journalTrades?: any[]
  ): Promise<DataSource[]> {
    const results: DataSource[] = [];
    const fetchPromises: Promise<DataSource>[] = [];
    
    for (const source of sources) {
      switch (source) {
        case 'stock_data':
          for (const stock of intent.stocks) {
            fetchPromises.push(this.fetchStockData(stock.symbol));
          }
          break;
        case 'yahoo_finance':
          for (const stock of intent.stocks) {
            fetchPromises.push(this.fetchYahooFinance(stock.symbol));
          }
          break;
        case 'google_news':
          const newsQuery = intent.stocks.length > 0 
            ? intent.stocks.map(s => s.name).join(' ') + ' stock news'
            : 'Indian stock market news';
          fetchPromises.push(this.fetchGoogleNews(newsQuery));
          break;
        case 'ipo_data':
          fetchPromises.push(this.fetchIPOData());
          break;
        case 'market_indices':
          fetchPromises.push(this.fetchMarketIndices());
          break;
        case 'journal':
          if (journalTrades && journalTrades.length > 0) {
            results.push({
              name: 'journal',
              data: journalTrades,
              success: true,
              responseTime: 0
            });
          }
          break;
      }
    }
    
    // Execute all fetches in parallel
    const parallelResults = await Promise.allSettled(fetchPromises);
    
    for (const result of parallelResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
    
    return results;
  }
  
  // Data fetching helpers
  private async fetchStockData(symbol: string): Promise<DataSource> {
    const start = Date.now();
    try {
      const response = await axios.get(
        `http://localhost:5000/api/stock-analysis/${symbol}`,
        { timeout: TIMEOUT_SHORT }
      );
      return {
        name: `stock_${symbol}`,
        data: response.data,
        success: true,
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: `stock_${symbol}`,
        data: null,
        success: false,
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }
  
  private async fetchYahooFinance(symbol: string): Promise<DataSource> {
    const start = Date.now();
    try {
      const url = `https://finance.yahoo.com/quote/${symbol}.NS`;
      const response = await axios.get(url, {
        timeout: TIMEOUT_MEDIUM,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const price = $('[data-field="regularMarketPrice"]').first().text();
      const change = $('[data-field="regularMarketChange"]').first().text();
      const changePercent = $('[data-field="regularMarketChangePercent"]').first().text();
      
      return {
        name: `yahoo_${symbol}`,
        data: {
          symbol,
          price: parseFloat(price.replace(/,/g, '')) || 0,
          change: parseFloat(change.replace(/,/g, '')) || 0,
          changePercent: parseFloat(changePercent.replace(/[()%]/g, '')) || 0
        },
        success: true,
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: `yahoo_${symbol}`,
        data: null,
        success: false,
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }
  
  private async fetchGoogleNews(query: string): Promise<DataSource> {
    const start = Date.now();
    try {
      const url = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const response = await axios.get(url, {
        timeout: TIMEOUT_MEDIUM,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const articles: any[] = [];
      
      $('article').slice(0, 5).each((i, el) => {
        const title = $(el).find('h3, h4').first().text().trim();
        const source = $(el).find('a[data-n-tid]').first().text().trim();
        const time = $(el).find('time').first().text().trim();
        
        if (title) {
          articles.push({ title, source, time, index: i + 1 });
        }
      });
      
      return {
        name: 'google_news',
        data: articles,
        success: articles.length > 0,
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: 'google_news',
        data: [],
        success: false,
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }
  
  private async fetchIPOData(): Promise<DataSource> {
    const start = Date.now();
    try {
      const response = await axios.get('http://localhost:5000/api/ipos', { timeout: TIMEOUT_SHORT });
      return {
        name: 'ipo_data',
        data: response.data,
        success: true,
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: 'ipo_data',
        data: null,
        success: false,
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }
  
  private async fetchMarketIndices(): Promise<DataSource> {
    const start = Date.now();
    try {
      const response = await axios.get('http://localhost:5000/api/market-indices', { timeout: TIMEOUT_SHORT });
      return {
        name: 'market_indices',
        data: response.data,
        success: true,
        responseTime: Date.now() - start
      };
    } catch (error: any) {
      return {
        name: 'market_indices',
        data: null,
        success: false,
        error: error.message,
        responseTime: Date.now() - start
      };
    }
  }
  
  // Step 4: SYNTHESIZE - Combine data into intelligent response
  private synthesizeResponse(
    query: string,
    intent: QueryIntent,
    sources: DataSource[]
  ): string {
    const parts: string[] = [];
    
    // (query echo removed)
    
    // Stock analysis response
    if (intent.stocks.length > 0) {
      for (const stock of intent.stocks) {
        const stockData = sources.find(s => s.name === `stock_${stock.symbol}` && s.success);
        const yahooData = sources.find(s => s.name === `yahoo_${stock.symbol}` && s.success);
        
        parts.push(`\n## ${stock.name} (${stock.symbol})\n`);
        
        if (stockData?.data?.priceData) {
          const pd = stockData.data.priceData;
          const arrow = pd.change >= 0 ? '↑' : '↓';
          
          parts.push(`**Current Price:** Rs.${this.formatNumber(pd.close || pd.price)}`);
          parts.push(`**Change:** ${arrow} Rs.${this.formatNumber(Math.abs(pd.change))} (${pd.changePercent?.toFixed(2) || 0}%)`);
          
          if (pd.high && pd.low) {
            parts.push(`**Day Range:** Rs.${this.formatNumber(pd.low)} - Rs.${this.formatNumber(pd.high)}`);
          }
          if (pd.volume) {
            parts.push(`**Volume:** ${this.formatVolume(pd.volume)}`);
          }
        } else if (yahooData?.data) {
          const yd = yahooData.data;
          parts.push(`**Price:** Rs.${this.formatNumber(yd.price)}`);
          parts.push(`**Change:** ${yd.change >= 0 ? '↑' : '↓'} ${yd.changePercent?.toFixed(2) || 0}%`);
        } else {
          parts.push(`*Data temporarily unavailable for ${stock.symbol}*`);
        }
        
        // Add technical indicators if available
        if (stockData?.data?.indicators) {
          const ind = stockData.data.indicators;
          parts.push(`\n**Technical Indicators:**`);
          if (ind.rsi) {
            const rsiSignal = ind.rsi > 70 ? '(Overbought)' : ind.rsi < 30 ? '(Oversold)' : '(Neutral)';
            parts.push(`- RSI: ${ind.rsi.toFixed(1)} ${rsiSignal}`);
          }
        }
        
        parts.push('');
      }
    }
    
    // Comparison response
    if (intent.isComparison && intent.stocks.length > 1) {
      parts.push(`\n## Comparison Summary\n`);
      
      const stocksWithData = intent.stocks.map(stock => {
        const data = sources.find(s => s.name === `stock_${stock.symbol}` && s.success);
        return {
          ...stock,
          price: data?.data?.priceData?.close || data?.data?.priceData?.price || 0,
          change: data?.data?.priceData?.changePercent || 0
        };
      });
      
      const best = stocksWithData.reduce((a, b) => a.change > b.change ? a : b);
      const worst = stocksWithData.reduce((a, b) => a.change < b.change ? a : b);
      
      parts.push(`**Best Performer Today:** ${best.name} (${best.change > 0 ? '+' : ''}${best.change.toFixed(2)}%)`);
      parts.push(`**Weakest Today:** ${worst.name} (${worst.change > 0 ? '+' : ''}${worst.change.toFixed(2)}%)`);
      parts.push('');
    }
    
    // News response
    const newsData = sources.find(s => s.name === 'google_news' && s.success);
    if (newsData?.data && Array.isArray(newsData.data) && newsData.data.length > 0 && intent.needsNews) {
      parts.push(`\n## Latest News\n`);
      const articles = newsData.data as Array<{ title: string; source?: string }>;
      for (const article of articles.slice(0, 3)) {
        parts.push(`- **${article.title}** ${article.source ? `(${article.source})` : ''}`);
      }
      parts.push('');
    }
    
    // Market overview response
    const marketData = sources.find(s => s.name === 'market_indices' && s.success);
    if (marketData?.data && intent.primary === 'market_overview') {
      parts.push(`\n## Market Overview\n`);
      if (Array.isArray(marketData.data)) {
        for (const index of marketData.data) {
          const arrow = index.isUp ? '↑' : '↓';
          parts.push(`- **${index.regionName}:** ${arrow} ${index.changePercent?.toFixed(2) || 0}%`);
        }
      }
      parts.push('');
    }
    
    // Journal response
    const journalData = sources.find(s => s.name === 'journal' && s.success);
    if (journalData?.data && intent.needsJournal) {
      parts.push(`\n## Your Trading Journal\n`);
      const trades = journalData.data;
      const totalPnL = trades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
      const winRate = trades.filter((t: any) => (t.pnl || 0) > 0).length / trades.length * 100;
      
      parts.push(`**Total Trades:** ${trades.length}`);
      parts.push(`**Net P&L:** Rs.${this.formatNumber(totalPnL)}`);
      parts.push(`**Win Rate:** ${winRate.toFixed(1)}%`);
      parts.push('');
    }
    
    // IPO response
    const ipoData = sources.find(s => s.name === 'ipo_data' && s.success);
    if (ipoData?.data && intent.primary === 'ipo') {
      parts.push(`\n## IPO Updates\n`);
      if (ipoData.data.upcoming?.length > 0) {
        parts.push(`**Upcoming IPOs:**`);
        for (const ipo of ipoData.data.upcoming.slice(0, 3)) {
          parts.push(`- ${ipo.name || ipo.company}`);
        }
      }
      parts.push('');
    }
    
    // (source attribution removed)
    
    return parts.join('\n');
  }
  
  // Utility methods
  private formatNumber(num: number): string {
    if (num == null || isNaN(num)) return '0.00';
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return num.toLocaleString('en-IN');
    return num.toFixed(2);
  }
  
  private formatVolume(vol: number): string {
    if (vol == null || isNaN(vol)) return '0';
    if (vol >= 10000000) return (vol / 10000000).toFixed(2) + ' Cr';
    if (vol >= 100000) return (vol / 100000).toFixed(2) + ' L';
    if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
    return vol.toString();
  }
  
  // Main entry point
  async processQuery(query: string, options?: { journalTrades?: any[] }): Promise<NeuralResponse> {
    const startTime = Date.now();
    const thinking: string[] = [];
    
    // Step 1: Understand
    thinking.push(`Understanding query: "${query}"`);
    const intent = this.analyzeIntent(query);
    thinking.push(`Detected intent: ${intent.primary} (confidence: ${(intent.confidence * 100).toFixed(0)}%)`);
    
    if (intent.stocks.length > 0) {
      thinking.push(`Identified stocks: ${intent.stocks.map(s => s.symbol).join(', ')}`);
    }
    
    // Step 2: Plan
    thinking.push(`Planning data sources...`);
    const sources = this.planDataFetching(intent);
    thinking.push(`Will fetch from: ${sources.join(', ')}`);
    
    // Step 3: Execute
    thinking.push(`Executing parallel data fetches...`);
    const dataSources = await this.executeDataFetching(sources, intent, options?.journalTrades);
    const successCount = dataSources.filter(s => s.success).length;
    thinking.push(`Fetched ${successCount}/${dataSources.length} sources successfully`);
    
    // Step 4: Synthesize
    thinking.push(`Synthesizing response...`);
    const response = this.synthesizeResponse(query, intent, dataSources);
    
    const executionTime = Date.now() - startTime;
    thinking.push(`Completed in ${executionTime}ms`);
    
    return {
      success: true,
      response,
      thinking,
      sources: dataSources,
      stocks: intent.stocks.map(s => s.symbol),
      intent: intent.primary,
      executionTime
    };
  }
}

// Export singleton instance
export const neuralQueryEngine = new NeuralQueryEngine();
