import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from "@google/genai";
import { intelligentAgent } from './intelligent-financial-agent';
import { enhancedFinancialScraper } from './enhanced-financial-scraper';
import { journalPortfolioAnalyzer, TradeEntry } from './journal-portfolio-analyzer';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
}

function stripHtml(html: string): string {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, '');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return text.trim();
}

interface QueryAnalysis {
  intent: 'stock_analysis' | 'market_overview' | 'news' | 'ipo' | 'journal' | 'risk_analysis' | 'portfolio' | 'performance' | 'general' | 'technical';
  stockSymbols: string[];
  keywords: string[];
  needsWebSearch: boolean;
  needsJournalData: boolean;
  needsFyersData: boolean;
  needsRiskAnalysis: boolean;
  needsPortfolioAnalysis: boolean;
  isComplexQuery: boolean;
}

export class AdvancedQueryProcessor {
  
  private async normalizeQueryWithAI(query: string): Promise<{ normalizedQuery: string; detectedStocks: string[] }> {
    try {
      const stocksList = [
        'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL',
        'ITC', 'WIPRO', 'ADANIENT', 'TATAMOTORS', 'MARUTI', 'BAJFINANCE',
        'AXISBANK', 'KOTAKBANK', 'TECHM', 'HINDUNILVR', 'ASIANPAINT', 'TITAN',
        'SUNPHARMA', 'LT', 'NESTLEIND', 'POWERGRID', 'NTPC', 'ONGC', 'COALINDIA'
      ];
      
      const prompt = `Extract stock symbols from this query: "${query}"
Available stocks: ${stocksList.join(', ')}
Return JSON: {"stocks": ["STOCK1", "STOCK2"] or [], "intent": "compare/analysis/journal/general"}
Be strict - only return actual stock names from the list.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      try {
        const text = response.text?.() || response.response?.text?.() || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            normalizedQuery: query,
            detectedStocks: Array.isArray(parsed.stocks) ? parsed.stocks : []
          };
        }
      } catch (e) {
        console.log('[SMART-QUERY] JSON parse failed, using fallback');
      }
    } catch (error) {
      console.log('[SMART-QUERY] AI normalization failed');
    }
    
    return { normalizedQuery: query, detectedStocks: [] };
  }
  
  private analyzeQuery(query: string, normalizedData?: { normalizedQuery: string; detectedStocks: string[] }): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    const stockSymbols = Array.from(new Set(normalizedData?.detectedStocks || []));
    
    let intent: QueryAnalysis['intent'] = 'general';
    
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || stockSymbols.length > 1) {
      intent = 'portfolio';
    } else if (lowerQuery.includes('journal') || lowerQuery.includes('my trade') || lowerQuery.includes('my p&l')) {
      intent = 'journal';
    } else if (lowerQuery.includes('risk') || lowerQuery.includes('drawdown')) {
      intent = 'risk_analysis';
    } else if (stockSymbols.length > 0) {
      intent = 'stock_analysis';
    } else if (lowerQuery.includes('market') || lowerQuery.includes('nifty') || lowerQuery.includes('sensex')) {
      intent = 'market_overview';
    } else if (lowerQuery.includes('news')) {
      intent = 'news';
    }

    return {
      intent,
      stockSymbols,
      keywords: query.split(/\s+/).filter(w => w.length > 3),
      needsWebSearch: true,
      needsJournalData: ['journal', 'risk_analysis', 'portfolio'].includes(intent) || lowerQuery.includes('my'),
      needsFyersData: stockSymbols.length > 0 || intent === 'stock_analysis',
      needsRiskAnalysis: ['risk_analysis', 'portfolio'].includes(intent),
      needsPortfolioAnalysis: ['portfolio'].includes(intent),
      isComplexQuery: lowerQuery.length > 40 || stockSymbols.length > 1
    };
  }
  
  private async performWebSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const webResults = await enhancedFinancialScraper.searchFinancialWeb(query, limit);
      return webResults.webResults.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        relevanceScore: r.relevanceScore
      }));
    } catch (error) {
      return [];
    }
  }

  private async generateSmartResponse(
    query: string,
    analysis: QueryAnalysis,
    data: {
      searchResults: SearchResult[];
      journalAnalysis?: any;
      stocksData?: Record<string, any>;
      companyInsights?: Record<string, any>;
    }
  ): Promise<string> {
    try {
      // Build context for AI
      let context = '';
      
      if (analysis.intent === 'portfolio' && data.stocksData && Object.keys(data.stocksData).length > 1) {
        context = `User wants to COMPARE these stocks: ${Object.keys(data.stocksData).join(', ')}\n`;
        Object.entries(data.stocksData).forEach(([symbol, info]: [string, any]) => {
          context += `${symbol}: Price ₹${info.price}, Change: ${info.changePercent}%\n`;
        });
        if (data.companyInsights) {
          Object.entries(data.companyInsights).forEach(([symbol, insights]: [string, any]) => {
            context += `${symbol} Quarterly Trend: ${insights.trend} | Revenue Growth: ${insights.revenueGrowth}%\n`;
          });
        }
      } else if (analysis.intent === 'stock_analysis' && data.stocksData) {
        context = `Stock analysis requested for: ${analysis.stockSymbols.join(', ')}\n`;
        Object.entries(data.stocksData).forEach(([symbol, info]: [string, any]) => {
          context += `${symbol}: ₹${info.price} | ${info.changePercent}% | ${info.trend}\n`;
        });
        if (data.companyInsights) {
          const first = Object.values(data.companyInsights)[0] as any;
          if (first) context += `Quarterly Performance: ${first.trend} | P/E: ${first.pe} | EPS: ₹${first.eps}\n`;
        }
      } else if (analysis.intent === 'journal' && data.journalAnalysis) {
        context = `Trading Journal Analysis:\n`;
        context += `Win Rate: ${data.journalAnalysis.performance?.winRate}%\n`;
        context += `Net P&L: ₹${data.journalAnalysis.performance?.netPnL}\n`;
        context += `Max Drawdown: ${data.journalAnalysis.risk?.maxDrawdownPercent}%\n`;
      }
      
      context += `\nWeb Search Results:\n${data.searchResults.slice(0, 3).map(r => `${r.title}: ${r.snippet}`).join('\n')}\n`;

      const prompt = `You are a smart financial AI agent. Answer this query in a SUPER CONCISE way (max 150 words):
User Query: "${query}"
Intent: ${analysis.intent}

Context: ${context}

Rules:
- ONLY show relevant data for this specific query
- NO disclaimers, NO long explanations
- Be direct and actionable
- For comparisons: show side-by-side table
- For journal: show performance summary
- For stocks: show key metrics + recommendation`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      return response.text?.() || response.response?.text?.() || 'Unable to generate response. Please try again.';
    } catch (error) {
      console.error('[SMART-RESPONSE] AI generation failed:', error);
      return 'Processing your query...';
    }
  }
  
  async processQuery(query: string, options?: {
    journalTrades?: any[];
    fyersData?: any;
    initialCapital?: number;
  }): Promise<{
    answer: string;
    sources: SearchResult[];
    timestamp: string;
  }> {
    try {
      console.log(`[SMART-QUERY] Processing: "${query}"`);
      
      const normalized = await this.normalizeQueryWithAI(query);
      const analysis = this.analyzeQuery(query, normalized);
      
      console.log(`[SMART-QUERY] Intent: ${analysis.intent}, Stocks: ${analysis.stockSymbols.join(', ')}`);
      
      const searchResults = await this.performWebSearch(query, 5);
      
      const data: any = { searchResults };
      
      // Get journal data if needed
      if (analysis.needsJournalData && options?.journalTrades && options.journalTrades.length > 0) {
        data.journalAnalysis = journalPortfolioAnalyzer.analyzeJournal(
          options.journalTrades as TradeEntry[],
          options.initialCapital || 100000
        );
      }
      
      // Get stock data for ALL requested stocks
      if (analysis.stockSymbols.length > 0) {
        data.stocksData = {};
        data.companyInsights = {};
        
        for (const symbol of analysis.stockSymbols) {
          try {
            const stockData = await intelligentAgent.getStockData(symbol);
            if (stockData) data.stocksData[symbol] = stockData;
            
            const insights = await enhancedFinancialScraper.getCompanyInsights(symbol);
            if (insights) data.companyInsights[symbol] = insights;
          } catch (err) {
            console.error(`Failed to fetch ${symbol}:`, err);
          }
        }
      }
      
      // Generate smart response
      const answer = await this.generateSmartResponse(query, analysis, data);
      
      return {
        answer,
        sources: searchResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[SMART-QUERY] Error:', error);
      return {
        answer: `I couldn't process your query. Try asking about specific stocks or your trading performance.`,
        sources: [],
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const advancedQueryProcessor = new AdvancedQueryProcessor();
