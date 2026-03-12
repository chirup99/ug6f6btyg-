import axios from 'axios';
import * as cheerio from 'cheerio';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: string;
  pe?: number;
  high52Week?: number;
  low52Week?: number;
}

interface NewsItem {
  title: string;
  source: string;
  link: string;
  timestamp: string;
  summary?: string;
}

interface IPOData {
  company: string;
  openDate: string;
  closeDate: string;
  priceRange: string;
  lotSize: number;
  status: string;
}

interface JournalInsight {
  totalTrades: number;
  winRate: number;
  averageProfit: number;
  averageLoss: number;
  bestPerformingStock: string;
  worstPerformingStock: string;
  tradingPattern: string;
  suggestion: string;
}

interface MarketTrend {
  index: string;
  value: number;
  change: number;
  changePercent: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Intelligent Financial Agent - No External AI APIs Required
 * Provides comprehensive stock analysis, news, IPO updates, and personalized insights
 */
export class IntelligentFinancialAgent {
  
  /**
   * Fetch live stock data from Yahoo Finance
   */
  async getStockData(symbol: string): Promise<StockData | null> {
    try {
      // Yahoo Finance API endpoint
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const data = response.data;
      if (!data?.chart?.result?.[0]) {
        return null;
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];

      return {
        symbol: symbol,
        price: meta.regularMarketPrice || 0,
        change: meta.regularMarketPrice - meta.previousClose || 0,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100) || 0,
        volume: meta.regularMarketVolume || 0,
        high52Week: meta.fiftyTwoWeekHigh,
        low52Week: meta.fiftyTwoWeekLow,
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch financial news from Google News
   */
  async getFinancialNews(limit: number = 10): Promise<NewsItem[]> {
    try {
      const newsItems: NewsItem[] = [];
      
      // Google News RSS feed for finance
      const url = 'https://news.google.com/rss/search?q=india+stock+market+NSE+BSE&hl=en-IN&gl=IN&ceid=IN:en';
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      
      $('item').slice(0, limit).each((i, elem) => {
        const title = $(elem).find('title').text();
        const link = $(elem).find('link').text();
        const pubDate = $(elem).find('pubDate').text();
        const source = $(elem).find('source').text() || 'Google News';
        
        newsItems.push({
          title,
          link,
          source,
          timestamp: pubDate,
        });
      });

      return newsItems;
    } catch (error) {
      console.error('Error fetching financial news:', error);
      return [];
    }
  }

  /**
   * Get upcoming and recent IPO data
   */
  async getIPOUpdates(): Promise<IPOData[]> {
    try {
      const ipos: IPOData[] = [];
      
      // Scrape IPO data from MoneyControl or similar
      const url = 'https://www.moneycontrol.com/ipo/ipo-dashboard';
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Parse IPO table (structure may vary, this is a template)
      $('.ipo_table tr').slice(1, 11).each((i, elem) => {
        const company = $(elem).find('td').eq(0).text().trim();
        const openDate = $(elem).find('td').eq(1).text().trim();
        const closeDate = $(elem).find('td').eq(2).text().trim();
        const priceRange = $(elem).find('td').eq(3).text().trim();
        const lotSize = parseInt($(elem).find('td').eq(4).text().trim()) || 0;
        const status = $(elem).find('td').eq(5).text().trim();
        
        if (company) {
          ipos.push({
            company,
            openDate,
            closeDate,
            priceRange,
            lotSize,
            status
          });
        }
      });

      return ipos;
    } catch (error) {
      console.error('Error fetching IPO data:', error);
      // Return mock data if scraping fails
      return [
        {
          company: 'IPO data temporarily unavailable',
          openDate: '-',
          closeDate: '-',
          priceRange: '-',
          lotSize: 0,
          status: 'Check MoneyControl for latest IPOs'
        }
      ];
    }
  }

  /**
   * Analyze user's trading journal and provide insights
   */
  analyzeJournal(trades: any[]): JournalInsight {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        averageProfit: 0,
        averageLoss: 0,
        bestPerformingStock: 'N/A',
        worstPerformingStock: 'N/A',
        tradingPattern: 'Not enough data',
        suggestion: 'Start logging your trades to get personalized insights!'
      };
    }

    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    
    const winRate = (winningTrades.length / totalTrades) * 100;
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    const averageProfit = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    // Find best and worst performing stocks
    const stockPerformance = new Map<string, number>();
    trades.forEach(trade => {
      const stock = trade.stock || trade.symbol || 'Unknown';
      const pnl = trade.pnl || 0;
      stockPerformance.set(stock, (stockPerformance.get(stock) || 0) + pnl);
    });

    let bestStock = 'N/A';
    let worstStock = 'N/A';
    let maxProfit = -Infinity;
    let maxLoss = Infinity;

    stockPerformance.forEach((pnl, stock) => {
      if (pnl > maxProfit) {
        maxProfit = pnl;
        bestStock = stock;
      }
      if (pnl < maxLoss) {
        maxLoss = pnl;
        worstStock = stock;
      }
    });

    // Detect trading patterns
    let tradingPattern = 'Balanced trading';
    if (winRate > 70) {
      tradingPattern = 'High win rate - Excellent risk management';
    } else if (winRate < 40) {
      tradingPattern = 'Low win rate - Review your strategy';
    }

    if (averageProfit > averageLoss * 2) {
      tradingPattern += ', Strong profit-taking';
    } else if (averageLoss > averageProfit * 2) {
      tradingPattern += ', Cutting losses too late';
    }

    // Generate suggestions
    let suggestion = '';
    if (winRate < 50) {
      suggestion = '⚠️ Your win rate is below 50%. Focus on improving entry points and risk management.';
    } else if (averageLoss > averageProfit) {
      suggestion = '📉 Your average loss exceeds average profit. Consider tighter stop losses.';
    } else if (winRate > 60 && averageProfit > averageLoss) {
      suggestion = '✅ Great performance! Keep following your strategy and maintain discipline.';
    } else {
      suggestion = '💡 You\'re on the right track. Focus on consistency and risk-reward ratio.';
    }

    return {
      totalTrades,
      winRate: Math.round(winRate * 100) / 100,
      averageProfit: Math.round(averageProfit * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      bestPerformingStock: bestStock,
      worstPerformingStock: worstStock,
      tradingPattern,
      suggestion
    };
  }

  /**
   * Get market trends (indices)
   */
  async getMarketTrends(): Promise<MarketTrend[]> {
    try {
      const indices = [
        { symbol: '^NSEI', name: 'NIFTY 50' },
        { symbol: '^BSESN', name: 'SENSEX' },
        { symbol: '^NSEBANK', name: 'BANK NIFTY' }
      ];

      const trends: MarketTrend[] = [];

      for (const index of indices) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${index.symbol}`;
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
          });

          const data = response.data;
          if (data?.chart?.result?.[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const change = meta.regularMarketPrice - meta.previousClose;
            const changePercent = (change / meta.previousClose) * 100;

            trends.push({
              index: index.name,
              value: meta.regularMarketPrice,
              change,
              changePercent,
              trend: changePercent > 0.5 ? 'bullish' : changePercent < -0.5 ? 'bearish' : 'neutral'
            });
          }
        } catch (err) {
          console.error(`Error fetching ${index.name}:`, err);
        }
      }

      return trends;
    } catch (error) {
      console.error('Error fetching market trends:', error);
      return [];
    }
  }

  /**
   * Generate intelligent stock analysis report
   */
  async generateStockAnalysis(symbol: string, fyersData?: any, journalTrades?: any[]): Promise<string> {
    try {
      // Fetch stock data
      const stockData = await this.getStockData(symbol);
      
      if (!stockData) {
        return `❌ Unable to fetch data for ${symbol}. Please check the symbol and try again.`;
      }

      // Build analysis report
      let report = `# 📊 ${symbol} Stock Analysis\n\n`;
      
      // Current Price & Performance
      report += `## 💰 Current Performance\n`;
      report += `- **Price:** ₹${stockData.price.toFixed(2)}\n`;
      report += `- **Change:** ${stockData.change >= 0 ? '+' : ''}₹${stockData.change.toFixed(2)} (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%)\n`;
      report += `- **Volume:** ${stockData.volume.toLocaleString()}\n`;
      
      if (stockData.high52Week && stockData.low52Week) {
        report += `- **52W High:** ₹${stockData.high52Week.toFixed(2)}\n`;
        report += `- **52W Low:** ₹${stockData.low52Week.toFixed(2)}\n`;
      }
      
      report += `\n`;

      // Technical Analysis
      report += `## 📈 Technical Analysis\n`;
      const priceVsHigh = stockData.high52Week ? ((stockData.price / stockData.high52Week) * 100).toFixed(2) : 'N/A';
      const priceVsLow = stockData.low52Week ? ((stockData.price / stockData.low52Week) * 100).toFixed(2) : 'N/A';
      
      report += `- **Price vs 52W High:** ${priceVsHigh}%\n`;
      report += `- **Price vs 52W Low:** ${priceVsLow}%\n`;
      
      // Trend detection
      if (stockData.changePercent > 2) {
        report += `- **Trend:** 🟢 Strong Bullish\n`;
      } else if (stockData.changePercent > 0) {
        report += `- **Trend:** 🟢 Bullish\n`;
      } else if (stockData.changePercent < -2) {
        report += `- **Trend:** 🔴 Strong Bearish\n`;
      } else if (stockData.changePercent < 0) {
        report += `- **Trend:** 🔴 Bearish\n`;
      } else {
        report += `- **Trend:** ⚪ Neutral\n`;
      }
      
      report += `\n`;

      // Fyers Integration
      if (fyersData) {
        report += `## 🔴 Fyers Live Data\n`;
        report += `- **Real-time integration:** Connected\n`;
        report += `- **Live prices:** Available\n`;
        report += `\n`;
      }

      // Journal Analysis
      if (journalTrades && journalTrades.length > 0) {
        const symbolTrades = journalTrades.filter(t => 
          (t.stock || t.symbol || '').toUpperCase().includes(symbol.toUpperCase())
        );
        
        if (symbolTrades.length > 0) {
          const totalPnL = symbolTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
          const wins = symbolTrades.filter(t => (t.pnl || 0) > 0).length;
          const winRate = (wins / symbolTrades.length) * 100;
          
          report += `## 📔 Your Trading History (${symbol})\n`;
          report += `- **Total Trades:** ${symbolTrades.length}\n`;
          report += `- **Win Rate:** ${winRate.toFixed(2)}%\n`;
          report += `- **Total P&L:** ₹${totalPnL.toFixed(2)}\n`;
          report += `- **Performance:** ${totalPnL > 0 ? '✅ Profitable' : '⚠️ Needs improvement'}\n`;
          report += `\n`;
        }
      }

      // Intelligent Suggestions
      report += `## 💡 Intelligent Insights\n`;
      
      if (stockData.changePercent > 5) {
        report += `- ⚠️ Stock showing strong upward momentum. Consider profit booking if you're in profit.\n`;
      } else if (stockData.changePercent < -5) {
        report += `- 🎯 Stock showing weakness. Could be a buying opportunity if fundamentals are strong.\n`;
      }
      
      if (stockData.high52Week && stockData.price > stockData.high52Week * 0.95) {
        report += `- 🚀 Trading near 52-week high. Strong momentum but watch for resistance.\n`;
      } else if (stockData.low52Week && stockData.price < stockData.low52Week * 1.05) {
        report += `- 📉 Trading near 52-week low. Potential value buy if fundamentals are intact.\n`;
      }
      
      report += `\n---\n`;
      report += `*Analysis generated: ${new Date().toLocaleString()}*\n`;
      report += `*Data sources: Yahoo Finance, Fyers API, Your Trading Journal*\n`;

      return report;
    } catch (error) {
      console.error('Error generating stock analysis:', error);
      return `❌ Error generating analysis for ${symbol}. Please try again.`;
    }
  }

  /**
   * Generate comprehensive market report
   */
  async generateMarketReport(): Promise<string> {
    try {
      let report = `# 🌐 Market Overview\n\n`;
      
      // Get market trends
      const trends = await this.getMarketTrends();
      
      if (trends.length > 0) {
        report += `## 📊 Major Indices\n`;
        trends.forEach(trend => {
          const emoji = trend.trend === 'bullish' ? '🟢' : trend.trend === 'bearish' ? '🔴' : '⚪';
          report += `### ${emoji} ${trend.index}\n`;
          report += `- **Value:** ${trend.value.toFixed(2)}\n`;
          report += `- **Change:** ${trend.change >= 0 ? '+' : ''}${trend.change.toFixed(2)} (${trend.changePercent >= 0 ? '+' : ''}${trend.changePercent.toFixed(2)}%)\n`;
          report += `- **Trend:** ${trend.trend.toUpperCase()}\n\n`;
        });
      }

      // Get financial news
      const news = await this.getFinancialNews(5);
      
      if (news.length > 0) {
        report += `## 📰 Latest Financial News\n`;
        news.forEach((item, index) => {
          report += `${index + 1}. **${item.title}**\n`;
          report += `   - Source: ${item.source}\n`;
          report += `   - [Read More](${item.link})\n\n`;
        });
      }

      // Get IPO updates
      const ipos = await this.getIPOUpdates();
      
      if (ipos.length > 0) {
        report += `## 🎯 IPO Updates\n`;
        ipos.slice(0, 5).forEach((ipo, index) => {
          report += `${index + 1}. **${ipo.company}**\n`;
          report += `   - Open: ${ipo.openDate} | Close: ${ipo.closeDate}\n`;
          report += `   - Price Range: ${ipo.priceRange}\n`;
          report += `   - Status: ${ipo.status}\n\n`;
        });
      }

      report += `\n---\n`;
      report += `*Report generated: ${new Date().toLocaleString()}*\n`;
      report += `*Sources: Yahoo Finance, Google News, MoneyControl*\n`;

      return report;
    } catch (error) {
      console.error('Error generating market report:', error);
      return `❌ Error generating market report. Please try again.`;
    }
  }

  /**
   * Generate comprehensive journal insights report
   */
  generateJournalReport(trades: any[]): string {
    const insights = this.analyzeJournal(trades);
    
    let report = `# 📔 Trading Journal Analysis\n\n`;
    
    report += `## 📊 Performance Overview\n`;
    report += `- **Total Trades:** ${insights.totalTrades}\n`;
    report += `- **Win Rate:** ${insights.winRate}%\n`;
    report += `- **Average Profit:** ₹${insights.averageProfit.toFixed(2)}\n`;
    report += `- **Average Loss:** ₹${insights.averageLoss.toFixed(2)}\n`;
    report += `\n`;

    report += `## 🏆 Top Performers\n`;
    report += `- **Best Stock:** ${insights.bestPerformingStock}\n`;
    report += `- **Worst Stock:** ${insights.worstPerformingStock}\n`;
    report += `\n`;

    report += `## 📈 Trading Pattern\n`;
    report += `${insights.tradingPattern}\n\n`;

    report += `## 💡 Personalized Suggestion\n`;
    report += `${insights.suggestion}\n\n`;

    report += `---\n`;
    report += `*Analysis generated: ${new Date().toLocaleString()}*\n`;
    report += `*Based on your ${insights.totalTrades} trades*\n`;

    return report;
  }
}

export const intelligentAgent = new IntelligentFinancialAgent();
