/**
 * Screener.in Web Scraper
 * Fetches comprehensive stock data from screener.in for any symbol
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 15000;

export interface ScreenerStockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: string;
  pe: number;
  bookValue: number;
  dividendYield: number;
  roce: number;
  roe: number;
  faceValue: number;
  high52Week: number;
  low52Week: number;
  stockPE: number;
  industryPE: number;
  intrinsicValue: number;
  graham: number;
  piotroskiScore: number;
  debtToEquity: number;
  currentRatio: number;
  eps: number;
  salesGrowth3Yr: number;
  profitGrowth3Yr: number;
  promoterHolding: number;
  pledgedPercent: number;
  sector: string;
  industry: string;
  about: string;
  pros: string[];
  cons: string[];
  quarterlyResults: Array<{
    quarter: string;
    sales: number;
    expenses: number;
    operatingProfit: number;
    opm: number;
    netProfit: number;
    eps: number;
  }>;
  annualResults: Array<{
    year: string;
    sales: number;
    expenses: number;
    operatingProfit: number;
    opm: number;
    netProfit: number;
    eps: number;
  }>;
  balanceSheet: {
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
    reserves: number;
    borrowings: number;
  };
  cashFlows: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
  };
  shareholdingPattern: {
    promoters: number;
    fii: number;
    dii: number;
    public: number;
  };
  ratios: {
    pe: number;
    pb: number;
    evToEbitda: number;
    priceToSales: number;
  };
  peerComparison: Array<{
    name: string;
    price: number;
    marketCap: string;
    pe: number;
  }>;
  lastUpdated: string;
  source: string;
}

class ScreenerScraper {
  
  private parseNumber(text: string): number {
    if (!text) return 0;
    const cleaned = text.replace(/[₹,%\s]/g, '').replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private parseCrores(text: string): number {
    if (!text) return 0;
    const cleaned = text.replace(/[₹\s]/g, '').replace(/,/g, '');
    
    if (cleaned.includes('Cr')) {
      return parseFloat(cleaned.replace('Cr', '')) || 0;
    }
    if (cleaned.includes('L')) {
      return (parseFloat(cleaned.replace('L', '')) || 0) / 100;
    }
    return parseFloat(cleaned) || 0;
  }

  async getStockData(symbol: string): Promise<ScreenerStockData | null> {
    // Strip "-EQ" or other exchange suffixes for screener.in compatibility
    const symbolWithoutExchange = symbol.toUpperCase().trim().replace(/-EQ$|-BE$|-BO$|-MF$/, '');
    const cleanSymbol = symbolWithoutExchange;
    console.log(`🔍 [SCREENER] Fetching data for ${cleanSymbol} (original: ${symbol}) from screener.in...`);

    try {
      const url = `https://www.screener.in/company/${cleanSymbol}/consolidated/`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: TIMEOUT
      });

      const $ = cheerio.load(response.data);
      
      const companyName = $('h1.margin-0').first().text().trim() || 
                          $('h1').first().text().trim() || 
                          cleanSymbol;

      const currentPrice = this.parseNumber($('#top-ratios li:contains("Current Price") .number').text()) ||
                          this.parseNumber($('.current-price').text()) ||
                          this.parseNumber($('[data-id="topRatio-currentPrice"] .number').text());

      const change = this.parseNumber($('.change').text());
      const changePercent = this.parseNumber($('.change-percent').text());

      const marketCap = $('#top-ratios li:contains("Market Cap") .number').text().trim() ||
                       $('[data-id="topRatio-marketCap"] .number').text().trim() || 'N/A';

      const pe = this.parseNumber($('#top-ratios li:contains("Stock P/E") .number').text()) ||
                this.parseNumber($('[data-id="topRatio-pe"] .number').text());

      const bookValue = this.parseNumber($('#top-ratios li:contains("Book Value") .number').text()) ||
                       this.parseNumber($('[data-id="topRatio-bookValue"] .number').text());

      const dividendYield = this.parseNumber($('#top-ratios li:contains("Dividend Yield") .number').text());

      const roce = this.parseNumber($('#top-ratios li:contains("ROCE") .number').text());
      const roe = this.parseNumber($('#top-ratios li:contains("ROE") .number').text());

      const faceValue = this.parseNumber($('#top-ratios li:contains("Face Value") .number').text());

      const high52Week = this.parseNumber($('#top-ratios li:contains("High") .number').text());
      const low52Week = this.parseNumber($('#top-ratios li:contains("Low") .number').text());

      const industryPE = this.parseNumber($('#peers-table tbody tr:first-child td:nth-child(3)').text());

      const debtToEquity = this.parseNumber($('#analysis li:contains("Debt to equity") .number').text()) ||
                          this.parseNumber($('.company-ratios li:contains("Debt") .number').text());

      const eps = this.parseNumber($('#top-ratios li:contains("EPS") .number').text());

      const pros: string[] = [];
      $('#pros li').each((i, el) => {
        const text = $(el).text().trim();
        if (text) pros.push(text);
      });

      const cons: string[] = [];
      $('#cons li').each((i, el) => {
        const text = $(el).text().trim();
        if (text) cons.push(text);
      });

      const about = $('#company-profile p').first().text().trim() ||
                   $('.company-description').text().trim() ||
                   `${companyName} is a publicly traded company on NSE/BSE.`;

      const sector = $('#company-info span:contains("Sector")').next().text().trim() ||
                    $('#peers-table thead th:first-child').text().trim() || 'N/A';

      const industry = $('#company-info span:contains("Industry")').next().text().trim() || sector;

      const quarterlyResults: ScreenerStockData['quarterlyResults'] = [];
      $('#quarters-table tbody tr').slice(0, 4).each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 5) {
          quarterlyResults.push({
            quarter: $(cols[0]).text().trim(),
            sales: this.parseCrores($(cols[1]).text()),
            expenses: this.parseCrores($(cols[2]).text()),
            operatingProfit: this.parseCrores($(cols[3]).text()),
            opm: this.parseNumber($(cols[4]).text()),
            netProfit: this.parseCrores($(cols[5]).text()),
            eps: this.parseNumber($(cols[cols.length - 1]).text())
          });
        }
      });

      const annualResults: ScreenerStockData['annualResults'] = [];
      $('#profit-loss-section table tbody tr').slice(0, 5).each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 5) {
          annualResults.push({
            year: $(cols[0]).text().trim(),
            sales: this.parseCrores($(cols[1]).text()),
            expenses: this.parseCrores($(cols[2]).text()),
            operatingProfit: this.parseCrores($(cols[3]).text()),
            opm: this.parseNumber($(cols[4]).text()),
            netProfit: this.parseCrores($(cols[5]).text()),
            eps: this.parseNumber($(cols[cols.length - 1]).text())
          });
        }
      });

      const promoterHolding = this.parseNumber($('#shareholding-table tbody tr:first-child td:last-child').text()) ||
                             this.parseNumber($('.shareholding-pattern .promoter').text());

      const fiiHolding = this.parseNumber($('#shareholding-table tbody tr:nth-child(2) td:last-child').text());
      const diiHolding = this.parseNumber($('#shareholding-table tbody tr:nth-child(3) td:last-child').text());
      const publicHolding = this.parseNumber($('#shareholding-table tbody tr:nth-child(4) td:last-child').text());

      const peerComparison: ScreenerStockData['peerComparison'] = [];
      $('#peers-table tbody tr').slice(0, 5).each((i, el) => {
        const cols = $(el).find('td');
        if (cols.length >= 3) {
          peerComparison.push({
            name: $(cols[0]).text().trim(),
            price: this.parseNumber($(cols[1]).text()),
            marketCap: $(cols[2]).text().trim(),
            pe: this.parseNumber($(cols[3]).text())
          });
        }
      });

      const stockData: ScreenerStockData = {
        symbol: cleanSymbol,
        name: companyName,
        currentPrice,
        change,
        changePercent,
        marketCap,
        pe,
        bookValue,
        dividendYield,
        roce,
        roe,
        faceValue,
        high52Week,
        low52Week,
        stockPE: pe,
        industryPE,
        intrinsicValue: bookValue * 1.5,
        graham: Math.sqrt(22.5 * eps * bookValue) || 0,
        piotroskiScore: 0,
        debtToEquity,
        currentRatio: 0,
        eps,
        salesGrowth3Yr: 0,
        profitGrowth3Yr: 0,
        promoterHolding,
        pledgedPercent: 0,
        sector,
        industry,
        about,
        pros,
        cons,
        quarterlyResults,
        annualResults,
        balanceSheet: {
          totalAssets: 0,
          totalLiabilities: 0,
          equity: 0,
          reserves: 0,
          borrowings: 0
        },
        cashFlows: {
          operatingCashFlow: 0,
          investingCashFlow: 0,
          financingCashFlow: 0,
          netCashFlow: 0
        },
        shareholdingPattern: {
          promoters: promoterHolding,
          fii: fiiHolding,
          dii: diiHolding,
          public: publicHolding
        },
        ratios: {
          pe,
          pb: currentPrice / bookValue || 0,
          evToEbitda: 0,
          priceToSales: 0
        },
        peerComparison,
        lastUpdated: new Date().toISOString(),
        source: 'screener.in'
      };

      console.log(`✅ [SCREENER] Successfully fetched data for ${cleanSymbol}`);
      console.log(`   Price: ₹${currentPrice}, PE: ${pe}, Market Cap: ${marketCap}`);

      return stockData;

    } catch (error: any) {
      console.error(`❌ [SCREENER] Failed to fetch ${cleanSymbol}:`, error.message);
      
      if (error.response?.status === 404) {
        const standaloneUrl = `https://www.screener.in/company/${cleanSymbol}/`;
        try {
          console.log(`🔄 [SCREENER] Trying standalone URL for ${cleanSymbol}...`);
          const response = await axios.get(standaloneUrl, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: TIMEOUT
          });
          
          const $ = cheerio.load(response.data);
          const companyName = $('h1').first().text().trim() || cleanSymbol;
          const currentPrice = this.parseNumber($('#top-ratios li:contains("Current Price") .number').text());
          
          return {
            symbol: cleanSymbol,
            name: companyName,
            currentPrice,
            change: 0,
            changePercent: 0,
            marketCap: 'N/A',
            pe: 0,
            bookValue: 0,
            dividendYield: 0,
            roce: 0,
            roe: 0,
            faceValue: 0,
            high52Week: 0,
            low52Week: 0,
            stockPE: 0,
            industryPE: 0,
            intrinsicValue: 0,
            graham: 0,
            piotroskiScore: 0,
            debtToEquity: 0,
            currentRatio: 0,
            eps: 0,
            salesGrowth3Yr: 0,
            profitGrowth3Yr: 0,
            promoterHolding: 0,
            pledgedPercent: 0,
            sector: 'N/A',
            industry: 'N/A',
            about: `${companyName} is a publicly traded company.`,
            pros: [],
            cons: [],
            quarterlyResults: [],
            annualResults: [],
            balanceSheet: { totalAssets: 0, totalLiabilities: 0, equity: 0, reserves: 0, borrowings: 0 },
            cashFlows: { operatingCashFlow: 0, investingCashFlow: 0, financingCashFlow: 0, netCashFlow: 0 },
            shareholdingPattern: { promoters: 0, fii: 0, dii: 0, public: 0 },
            ratios: { pe: 0, pb: 0, evToEbitda: 0, priceToSales: 0 },
            peerComparison: [],
            lastUpdated: new Date().toISOString(),
            source: 'screener.in'
          };
        } catch (e) {
          return null;
        }
      }
      
      return null;
    }
  }

  async searchCompany(query: string): Promise<Array<{ symbol: string; name: string }>> {
    try {
      console.log(`🔍 [SCREENER] Searching for "${query}"...`);
      
      const searchUrl = `https://www.screener.in/api/company/search/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10000
      });

      if (Array.isArray(response.data)) {
        return response.data.slice(0, 10).map((item: any) => ({
          symbol: item.url?.split('/').filter(Boolean).pop()?.toUpperCase() || item.name,
          name: item.name || item.url || query
        }));
      }

      return [];
    } catch (error: any) {
      console.error(`❌ [SCREENER] Search failed:`, error.message);
      return [];
    }
  }
}

export const screenerScraper = new ScreenerScraper();
