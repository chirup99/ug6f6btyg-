import { GoogleGenAI } from "@google/genai";
import { webSearchService } from './web-search-service';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AdvancedSearchRequest {
  query: string;
  includeWebSearch?: boolean;
  context?: {
    stockData?: any;
    journalData?: any;
    socialPosts?: any;
  };
}

export interface AdvancedSearchResponse {
  answer: string;
  sources?: string[];
  relatedData?: any;
}

export class AdvancedAIAgent {
  async search(request: AdvancedSearchRequest): Promise<AdvancedSearchResponse> {
    try {
      const { query, includeWebSearch = true, context } = request;
      
      let systemContext = `You are an advanced financial AI assistant built into a trading platform.
You have access to:
- Real-time stock market data
- User's trading journal and performance metrics
- Social feed discussions
- Web search capabilities for latest information

Your goal is to provide detailed, accurate, and helpful responses about:
- Stock analysis and fundamentals (P/E ratio, market cap, revenue, profit/loss)
- Company financial performance and P&L statements
- Technical analysis and trading insights
- Market trends and news

IMPORTANT RULES:
1. For company P&L or financial data queries, ALWAYS use web search results
2. Provide specific numbers and metrics when available
3. Explain financial terms clearly for non-experts
4. Be conversational but professional
5. Cite sources when using web data
6. If data is not available, clearly state what's missing

Format your responses with:
- Clear headings using **bold**
- Bullet points for lists
- Numbers and metrics prominently displayed
- Easy-to-understand explanations`;

      const queryLower = query.toLowerCase();
      const isFinancialQuery = queryLower.includes('p&l') || 
                               queryLower.includes('profit') ||
                               queryLower.includes('loss') ||
                               queryLower.includes('revenue') ||
                               queryLower.includes('earnings') ||
                               queryLower.includes('financial') ||
                               queryLower.includes('fundamentals') ||
                               queryLower.includes('balance sheet') ||
                               queryLower.includes('income statement');

      const isCompanyQuery = /\b[A-Z]{2,}\b/.test(query) || 
                            queryLower.includes('company') ||
                            queryLower.includes('stock');

      let webContext = '';
      const sources: string[] = [];

      if (includeWebSearch && (isFinancialQuery || isCompanyQuery)) {
        const stockSymbolMatch = query.match(/\b([A-Z]{2,})\b/);
        const stockSymbol = stockSymbolMatch ? stockSymbolMatch[1] : '';
        
        const companyName = query.match(/(?:about|for|of)\s+([A-Za-z\s]+?)(?:\s+stock|\s+company|\s*$)/i)?.[1]?.trim() || stockSymbol;

        if (isFinancialQuery && companyName) {
          console.log(`🌐 Fetching financial data from web for: ${companyName}`);
          const financialData = await webSearchService.searchCompanyFinancials(companyName);
          if (financialData) {
            webContext += financialData + '\n\n';
            sources.push('Web Search: Company Financials');
          }
        }

        if (stockSymbol) {
          console.log(`🌐 Fetching stock fundamentals from web for: ${stockSymbol}`);
          const fundamentalsData = await webSearchService.searchStockFundamentals(stockSymbol);
          if (fundamentalsData) {
            webContext += fundamentalsData + '\n\n';
            sources.push('Web Search: Stock Fundamentals');
          }
        }

        if (companyName && queryLower.includes('news')) {
          console.log(`🌐 Fetching latest news from web for: ${companyName}`);
          const newsData = await webSearchService.searchCompanyNews(companyName);
          if (newsData) {
            webContext += newsData + '\n\n';
            sources.push('Web Search: Latest News');
          }
        }
      }

      let contextualInfo = '';
      if (context?.stockData) {
        contextualInfo += `\n\n**Available Stock Data:**\n${JSON.stringify(context.stockData, null, 2)}\n`;
        sources.push('Platform: Real-time Stock Data');
      }

      if (context?.journalData) {
        contextualInfo += `\n\n**User's Trading Journal:**\n${JSON.stringify(context.journalData, null, 2)}\n`;
        sources.push('Platform: Trading Journal');
      }

      if (context?.socialPosts) {
        contextualInfo += `\n\n**Social Feed Discussions:**\n${JSON.stringify(context.socialPosts, null, 2)}\n`;
        sources.push('Platform: Social Feed');
      }

      const fullPrompt = `${systemContext}

${webContext ? `**Web Search Results:**\n${webContext}` : ''}

${contextualInfo}

**User Question:** ${query}

Please provide a comprehensive, detailed answer using all available information. If you found web search results, incorporate them into your response with specific data points. Explain financial metrics clearly.`;

      console.log(`🤖 Sending query to Gemini AI...`);
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: fullPrompt,
      });

      const answer = response.text || "I couldn't generate a response. Please try rephrasing your question.";

      return {
        answer,
        sources: sources.length > 0 ? sources : undefined,
        relatedData: context
      };

    } catch (error) {
      console.error('Advanced AI Agent error:', error);
      throw new Error(`AI search failed: ${error}`);
    }
  }
}

export const advancedAIAgent = new AdvancedAIAgent();
