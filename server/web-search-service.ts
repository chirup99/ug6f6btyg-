import axios from 'axios';

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  content?: string;
}

export class WebSearchService {
  private async searchGoogle(query: string, limit: number = 5): Promise<WebSearchResult[]> {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${limit}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const html = response.data;
      const results: WebSearchResult[] = [];

      const titleRegex = /<h3[^>]*>(.*?)<\/h3>/g;
      const snippetRegex = /<div[^>]*class="[^"]*BNeawe[^"]*"[^>]*>(.*?)<\/div>/g;
      
      let titleMatch;
      let snippetMatch;
      const titles: string[] = [];
      const snippets: string[] = [];

      while ((titleMatch = titleRegex.exec(html)) !== null) {
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        if (title) titles.push(title);
      }

      while ((snippetMatch = snippetRegex.exec(html)) !== null) {
        const snippet = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
        if (snippet && snippet.length > 20) snippets.push(snippet);
      }

      for (let i = 0; i < Math.min(titles.length, snippets.length, limit); i++) {
        results.push({
          title: titles[i],
          snippet: snippets[i],
          url: `https://google.com/search?q=${encodeURIComponent(query)}`
        });
      }

      return results;
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  async searchCompanyFinancials(companyName: string): Promise<string> {
    try {
      const query = `${companyName} financial results P&L profit loss revenue earnings latest`;
      const results = await this.searchGoogle(query, 3);
      
      if (results.length === 0) {
        return `No recent web data found for ${companyName}. Try searching for specific stock symbol or company fundamentals.`;
      }

      let context = `**Latest Web Results for ${companyName}:**\n\n`;
      results.forEach((result, index) => {
        context += `${index + 1}. **${result.title}**\n   ${result.snippet}\n\n`;
      });

      return context;
    } catch (error) {
      console.error('Company financials search error:', error);
      return '';
    }
  }

  async searchStockFundamentals(symbol: string): Promise<string> {
    try {
      const query = `${symbol} stock fundamental analysis PE ratio market cap EPS growth`;
      const results = await this.searchGoogle(query, 3);
      
      if (results.length === 0) {
        return '';
      }

      let context = `**Web Search Results for ${symbol}:**\n\n`;
      results.forEach((result, index) => {
        context += `${index + 1}. ${result.title}\n   ${result.snippet}\n\n`;
      });

      return context;
    } catch (error) {
      console.error('Stock fundamentals search error:', error);
      return '';
    }
  }

  async searchCompanyNews(companyName: string): Promise<string> {
    try {
      const query = `${companyName} latest news today stock market`;
      const results = await this.searchGoogle(query, 5);
      
      if (results.length === 0) {
        return '';
      }

      let context = `**Latest News for ${companyName}:**\n\n`;
      results.forEach((result, index) => {
        context += `• ${result.title}\n  ${result.snippet}\n\n`;
      });

      return context;
    } catch (error) {
      console.error('Company news search error:', error);
      return '';
    }
  }
}

export const webSearchService = new WebSearchService();
