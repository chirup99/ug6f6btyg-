/**
 * NLP Data Router - Routes NLP intents to existing data sources
 * Connects to: Angel One, Screener.in, News, Journal, Social Feed
 */

import { NLPResult } from './nlp-trading-agent';
import { screenerScraper, ScreenerStockData } from './screener-scraper';

interface DataRouterResponse {
  success: boolean;
  data: any;
  source: string;
  formatted: string;
}

class NLPDataRouter {

  async route(nlpResult: NLPResult): Promise<DataRouterResponse> {
    const { intent, entities } = nlpResult;
    const stockEntity = entities.find(e => e.entity === 'stock');
    const stock = stockEntity?.value?.toUpperCase() || null;

    console.log(`🔀 [NLP-ROUTER] Routing intent: ${intent}, stock: ${stock}`);

    try {
      switch (intent) {
        case 'stock.price':
          return await this.handleStockPrice(stock);

        case 'stock.analysis':
        case 'stock.screener':
          return await this.handleStockAnalysis(stock);

        case 'stock.technical':
          return await this.handleTechnicalAnalysis(stock, entities);

        case 'stock.news':
          return await this.handleStockNews(stock);

        case 'market.news':
          return await this.handleMarketNews();

        case 'stock.quarterly':
          return await this.handleQuarterlyResults(stock);

        case 'stock.shareholding':
          return await this.handleShareholding(stock);

        case 'social.feed':
          return await this.handleSocialFeed();

        case 'social.stock':
          return await this.handleSocialStock(stock);

        case 'journal.trades':
        case 'journal.today':
          return await this.handleJournal();

        case 'journal.stock':
          return await this.handleJournalStock(stock);

        case 'watchlist.show':
          return await this.handleWatchlist();

        case 'watchlist.add':
          return await this.handleWatchlistAdd(stock);

        case 'market.overview':
          return await this.handleMarketOverview();

        case 'ipo.upcoming':
          return await this.handleIPO();

        case 'stock.compare':
          return await this.handleComparison(entities);

        case 'general.help':
          return this.handleHelp();

        case 'general.greeting':
          return this.handleGreeting();

        default:
          // Try to handle as stock query if stock entity found
          if (stock) {
            return await this.handleStockAnalysis(stock);
          }
          return this.handleUnknown(nlpResult.originalQuery);
      }
    } catch (error: any) {
      console.error(`❌ [NLP-ROUTER] Error routing ${intent}:`, error.message);
      return {
        success: false,
        data: null,
        source: 'error',
        formatted: `Sorry, I couldn't process your request. Error: ${error.message}`
      };
    }
  }

  private async handleStockPrice(stock: string | null): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol. Example: "RELIANCE price" or "what is TCS price"'
      };
    }

    const data = await screenerScraper.getStockData(stock);
    if (!data) {
      return {
        success: false,
        data: null,
        source: 'screener.in',
        formatted: `Could not find data for ${stock}. Please check the symbol and try again.`
      };
    }

    return {
      success: true,
      data,
      source: 'screener.in',
      formatted: this.formatStockPrice(data)
    };
  }

  private async handleStockAnalysis(stock: string | null): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol. Example: "analyze RELIANCE" or "TCS fundamentals"'
      };
    }

    const data = await screenerScraper.getStockData(stock);
    if (!data) {
      return {
        success: false,
        data: null,
        source: 'screener.in',
        formatted: `Could not find data for ${stock}. Please check the symbol and try again.`
      };
    }

    return {
      success: true,
      data,
      source: 'screener.in',
      formatted: this.formatStockAnalysis(data)
    };
  }

  private async handleTechnicalAnalysis(stock: string | null, entities: any[]): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol. Example: "RELIANCE RSI" or "TCS technical analysis"'
      };
    }

    const indicator = entities.find(e => e.entity === 'indicator')?.value || 'overview';

    return {
      success: true,
      data: { stock, indicator },
      source: 'technical',
      formatted: `## 📊 ${stock} Technical Analysis

To view detailed technical charts and indicators for ${stock}:

1. **Search for "${stock}"** in the search bar
2. **View the chart** with technical indicators
3. **Available indicators:** RSI, MACD, EMA, SMA, Bollinger Bands

**Quick Tip:** You can also ask:
- "${stock} RSI" for RSI values
- "${stock} MACD" for MACD analysis
- "${stock} chart" for price chart`
    };
  }

  private async handleStockNews(stock: string | null): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol. Example: "RELIANCE news" or "latest news on TCS"'
      };
    }

    return {
      success: true,
      data: { stock, type: 'news' },
      source: 'news',
      formatted: `## 📰 ${stock} Latest News

Loading news for ${stock}...

**Pro Tip:** The news section updates automatically when you view the stock chart.

**To see full news:**
1. Search for "${stock}" in the main search bar
2. Click on the News tab
3. View curated news from multiple sources`
    };
  }

  private async handleMarketNews(): Promise<DataRouterResponse> {
    return {
      success: true,
      data: { type: 'market_news' },
      source: 'news',
      formatted: `## 📰 Market News

To view the latest market news:

1. **Click on "Market News" tab** in the navigation
2. **Browse curated headlines** from top sources
3. **Filter by category:** Stocks, Economy, Global, IPO

**Current Market Status:**
- NSE/BSE trading hours: 9:15 AM - 3:30 PM IST
- Check indices for overall market direction`
    };
  }

  private async handleQuarterlyResults(stock: string | null): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol. Example: "RELIANCE quarterly results"'
      };
    }

    const data = await screenerScraper.getStockData(stock);
    if (!data || !data.quarterlyResults?.length) {
      return {
        success: false,
        data: null,
        source: 'screener.in',
        formatted: `Could not find quarterly results for ${stock}.`
      };
    }

    return {
      success: true,
      data: data.quarterlyResults,
      source: 'screener.in',
      formatted: this.formatQuarterlyResults(stock, data.quarterlyResults)
    };
  }

  private async handleShareholding(stock: string | null): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol. Example: "RELIANCE shareholding pattern"'
      };
    }

    const data = await screenerScraper.getStockData(stock);
    if (!data) {
      return {
        success: false,
        data: null,
        source: 'screener.in',
        formatted: `Could not find shareholding data for ${stock}.`
      };
    }

    return {
      success: true,
      data: data.shareholdingPattern,
      source: 'screener.in',
      formatted: this.formatShareholding(stock, data.shareholdingPattern)
    };
  }

  private async handleSocialFeed(): Promise<DataRouterResponse> {
    return {
      success: true,
      data: { type: 'social_feed' },
      source: 'social',
      formatted: `## 💬 Social Feed

To view the community social feed:

1. **Click on "Social Feed" tab** in the navigation
2. **Browse posts** from other traders
3. **Share your own insights** and analysis

**Features:**
- Post trading ideas and analysis
- Comment on other traders' posts
- Share charts and screenshots
- Follow top performers`
    };
  }

  private async handleSocialStock(stock: string | null): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol. Example: "what are people saying about RELIANCE"'
      };
    }

    return {
      success: true,
      data: { stock, type: 'social_stock' },
      source: 'social',
      formatted: `## 💬 ${stock} Community Discussion

To see what traders are saying about ${stock}:

1. **Go to Social Feed tab**
2. **Search for "${stock}"** in the feed
3. **View discussions, analysis, and predictions**

**Quick Actions:**
- Post your own ${stock} analysis
- Ask the community for opinions
- Share your trades`
    };
  }

  private async handleJournal(): Promise<DataRouterResponse> {
    return {
      success: true,
      data: { type: 'journal' },
      source: 'journal',
      formatted: `## 📔 Trading Journal

To view your trading journal:

1. **Click on "Journal" tab** in the navigation
2. **Browse your past trades** by date
3. **Add new trade entries** with notes

**Journal Features:**
- Track all your trades
- Add entry/exit notes
- Calculate P&L automatically
- Review performance over time`
    };
  }

  private async handleJournalStock(stock: string | null): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol.'
      };
    }

    return {
      success: true,
      data: { stock, type: 'journal_stock' },
      source: 'journal',
      formatted: `## 📔 Your ${stock} Trades

To view your ${stock} trading history:

1. **Go to Journal tab**
2. **Filter by "${stock}"**
3. **Review all your ${stock} trades**

**Track:**
- Entry and exit prices
- Position sizes
- Profit/Loss
- Trade notes and learnings`
    };
  }

  private async handleWatchlist(): Promise<DataRouterResponse> {
    return {
      success: true,
      data: { type: 'watchlist' },
      source: 'watchlist',
      formatted: `## 📋 Your Watchlist

To view your watchlist:

1. **Click on "Watchlist" tab** in the navigation
2. **View live prices** of your tracked stocks
3. **Add/remove stocks** as needed

**Watchlist Features:**
- Real-time price updates
- Quick chart access
- News for watched stocks
- Price alerts`
    };
  }

  private async handleWatchlistAdd(stock: string | null): Promise<DataRouterResponse> {
    if (!stock) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify a stock symbol to add. Example: "add RELIANCE to watchlist"'
      };
    }

    return {
      success: true,
      data: { stock, action: 'add' },
      source: 'watchlist',
      formatted: `## ✅ Add ${stock} to Watchlist

To add ${stock} to your watchlist:

1. **Go to Watchlist tab**
2. **Click the "+" button**
3. **Search for "${stock}"**
4. **Click to add**

Or search for "${stock}" and click the star icon to add it directly.`
    };
  }

  private async handleMarketOverview(): Promise<DataRouterResponse> {
    // Try to get NIFTY data
    const niftyData = await screenerScraper.getStockData('NIFTY');

    return {
      success: true,
      data: { nifty: niftyData },
      source: 'market',
      formatted: `## 📈 Market Overview

**Major Indices:**
- NIFTY 50: Check chart for live data
- BANK NIFTY: Check chart for live data
- SENSEX: Check chart for live data

**Market Hours:** 9:15 AM - 3:30 PM IST

**Quick Actions:**
- Search "NIFTY" for index chart
- Check "Market News" for updates
- View "Watchlist" for tracked stocks

**Pro Tip:** The home page shows real-time market status!`
    };
  }

  private async handleIPO(): Promise<DataRouterResponse> {
    return {
      success: true,
      data: { type: 'ipo' },
      source: 'ipo',
      formatted: `## 🚀 Upcoming IPOs

To view upcoming IPOs:

1. **Check the Market News tab** for IPO announcements
2. **Key IPO Information:**
   - Issue price range
   - Lot size
   - Opening and closing dates
   - Company fundamentals

**IPO Tips:**
- Research the DRHP thoroughly
- Check promoter holdings
- Compare with listed peers
- Apply based on your risk appetite`
    };
  }

  private async handleComparison(entities: any[]): Promise<DataRouterResponse> {
    const stocks = entities.filter(e => e.entity === 'stock').map(e => e.value);
    
    if (stocks.length < 2) {
      return {
        success: false,
        data: null,
        source: 'none',
        formatted: 'Please specify two stocks to compare. Example: "compare RELIANCE with TCS"'
      };
    }

    const [stock1, stock2] = stocks;
    const [data1, data2] = await Promise.all([
      screenerScraper.getStockData(stock1),
      screenerScraper.getStockData(stock2)
    ]);

    if (!data1 || !data2) {
      return {
        success: false,
        data: null,
        source: 'screener.in',
        formatted: `Could not find data for one or both stocks.`
      };
    }

    return {
      success: true,
      data: { stock1: data1, stock2: data2 },
      source: 'screener.in',
      formatted: this.formatComparison(data1, data2)
    };
  }

  private handleHelp(): DataRouterResponse {
    return {
      success: true,
      data: { type: 'help' },
      source: 'system',
      formatted: `## 🤖 Trading Assistant Help

**What can I do?**

**Stock Information:**
- "RELIANCE price" - Get current price
- "analyze TCS" - Full stock analysis
- "INFY quarterly results" - Financial results
- "HDFCBANK shareholding" - Ownership pattern

**Technical Analysis:**
- "RELIANCE RSI" - Technical indicators
- "TCS chart" - Price chart
- "NIFTY trend" - Market trend

**News & Social:**
- "RELIANCE news" - Stock-specific news
- "market news" - Latest updates
- "social feed" - Community posts

**Your Data:**
- "my trades" - Trading journal
- "watchlist" - Your tracked stocks
- "today trades" - Today's activity

**Market:**
- "market overview" - Index status
- "upcoming IPO" - New IPOs
- "compare RELIANCE TCS" - Stock comparison

**Just type naturally!** I understand context.`
    };
  }

  private handleGreeting(): DataRouterResponse {
    const greetings = [
      "Hello! I'm your trading assistant. How can I help you today?",
      "Hi there! Ready to analyze some stocks? Just ask!",
      "Hey! Looking for stock info, news, or your journal? I'm here to help!",
      "Good to see you! What would you like to know about the markets?"
    ];
    
    return {
      success: true,
      data: { type: 'greeting' },
      source: 'system',
      formatted: `## 👋 ${greetings[Math.floor(Math.random() * greetings.length)]}

**Quick commands:**
- Type a stock symbol (e.g., "RELIANCE")
- Ask for news ("market news")
- View your journal ("my trades")
- Get help ("help")`
    };
  }

  private handleUnknown(query: string): DataRouterResponse {
    return {
      success: true,
      data: { query },
      source: 'system',
      formatted: `I'm not sure what you're looking for with "${query}".

**Try these:**
- **Stock info:** "RELIANCE price" or "analyze TCS"
- **News:** "market news" or "INFY news"
- **Journal:** "my trades" or "today trades"
- **Help:** Type "help" for all commands

**Tip:** You can also just type a stock symbol!`
    };
  }

  // ============ FORMATTING HELPERS ============

  private formatStockPrice(data: ScreenerStockData): string {
    const changeEmoji = data.change >= 0 ? '📈' : '📉';
    const changeSign = data.change >= 0 ? '+' : '';

    return `## ${changeEmoji} ${data.name} (${data.symbol})

**Current Price:** ₹${data.currentPrice.toLocaleString()}
**Change:** ${changeSign}${data.change.toFixed(2)} (${changeSign}${data.changePercent.toFixed(2)}%)

| Metric | Value |
|--------|-------|
| Market Cap | ${data.marketCap} |
| P/E Ratio | ${data.pe.toFixed(2)} |
| 52W High | ₹${data.high52Week.toLocaleString()} |
| 52W Low | ₹${data.low52Week.toLocaleString()} |

*Source: screener.in*`;
  }

  private formatStockAnalysis(data: ScreenerStockData): string {
    const changeEmoji = data.change >= 0 ? '📈' : '📉';

    let analysis = `## ${changeEmoji} ${data.name} (${data.symbol}) Analysis

### Price & Valuation
| Metric | Value |
|--------|-------|
| Current Price | ₹${data.currentPrice.toLocaleString()} |
| Market Cap | ${data.marketCap} |
| P/E Ratio | ${data.pe.toFixed(2)} |
| Book Value | ₹${data.bookValue.toFixed(2)} |
| EPS | ₹${data.eps.toFixed(2)} |

### Returns & Efficiency
| Metric | Value |
|--------|-------|
| ROCE | ${data.roce.toFixed(2)}% |
| ROE | ${data.roe.toFixed(2)}% |
| Dividend Yield | ${data.dividendYield.toFixed(2)}% |

### 52-Week Range
- **High:** ₹${data.high52Week.toLocaleString()}
- **Low:** ₹${data.low52Week.toLocaleString()}
`;

    if (data.pros && data.pros.length > 0) {
      analysis += `\n### ✅ Pros\n`;
      data.pros.slice(0, 3).forEach(pro => {
        analysis += `- ${pro}\n`;
      });
    }

    if (data.cons && data.cons.length > 0) {
      analysis += `\n### ⚠️ Cons\n`;
      data.cons.slice(0, 3).forEach(con => {
        analysis += `- ${con}\n`;
      });
    }

    analysis += `\n*Source: screener.in*`;
    return analysis;
  }

  private formatQuarterlyResults(stock: string, results: any[]): string {
    let formatted = `## 📊 ${stock} Quarterly Results\n\n`;
    formatted += `| Quarter | Sales (Cr) | Profit (Cr) | EPS |\n`;
    formatted += `|---------|------------|-------------|-----|\n`;

    results.slice(0, 4).forEach(q => {
      formatted += `| ${q.quarter} | ${q.sales.toFixed(0)} | ${q.netProfit.toFixed(0)} | ${q.eps.toFixed(2)} |\n`;
    });

    formatted += `\n*Source: screener.in*`;
    return formatted;
  }

  private formatShareholding(stock: string, pattern: any): string {
    return `## 📊 ${stock} Shareholding Pattern

| Category | Holding |
|----------|---------|
| Promoters | ${pattern.promoters.toFixed(2)}% |
| FII | ${pattern.fii.toFixed(2)}% |
| DII | ${pattern.dii.toFixed(2)}% |
| Public | ${pattern.public.toFixed(2)}% |

*Source: screener.in*`;
  }

  private formatComparison(data1: ScreenerStockData, data2: ScreenerStockData): string {
    return `## ⚖️ ${data1.symbol} vs ${data2.symbol}

| Metric | ${data1.symbol} | ${data2.symbol} |
|--------|-------|-------|
| Price | ₹${data1.currentPrice.toLocaleString()} | ₹${data2.currentPrice.toLocaleString()} |
| Market Cap | ${data1.marketCap} | ${data2.marketCap} |
| P/E | ${data1.pe.toFixed(2)} | ${data2.pe.toFixed(2)} |
| ROE | ${data1.roe.toFixed(2)}% | ${data2.roe.toFixed(2)}% |
| ROCE | ${data1.roce.toFixed(2)}% | ${data2.roce.toFixed(2)}% |
| EPS | ₹${data1.eps.toFixed(2)} | ₹${data2.eps.toFixed(2)} |

*Source: screener.in*`;
  }
}

export const nlpDataRouter = new NLPDataRouter();
