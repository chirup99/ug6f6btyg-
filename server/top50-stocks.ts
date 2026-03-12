/**
 * Top 50 Indian stocks for historical data backup
 * Selected based on market cap, liquidity, and trading volume
 * Updated: September 2025
 */

export interface StockSymbol {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  marketCap?: string;
}

export const TOP_50_INDIAN_STOCKS: StockSymbol[] = [
  // NIFTY 50 Core Holdings (Top 25)
  { symbol: 'NSE:RELIANCE-EQ', name: 'Reliance Industries', exchange: 'NSE', sector: 'Oil & Gas' },
  { symbol: 'NSE:TCS-EQ', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'NSE:HDFCBANK-EQ', name: 'HDFC Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'NSE:INFY-EQ', name: 'Infosys', exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'NSE:HINDUNILVR-EQ', name: 'Hindustan Unilever', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'NSE:ICICIBANK-EQ', name: 'ICICI Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'NSE:LT-EQ', name: 'Larsen & Toubro', exchange: 'NSE', sector: 'Engineering' },
  { symbol: 'NSE:SBIN-EQ', name: 'State Bank of India', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'NSE:BHARTIARTL-EQ', name: 'Bharti Airtel', exchange: 'NSE', sector: 'Telecom' },
  { symbol: 'NSE:ITC-EQ', name: 'ITC Limited', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'NSE:KOTAKBANK-EQ', name: 'Kotak Mahindra Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'NSE:AXISBANK-EQ', name: 'Axis Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'NSE:ASIANPAINT-EQ', name: 'Asian Paints', exchange: 'NSE', sector: 'Paints' },
  { symbol: 'NSE:HCLTECH-EQ', name: 'HCL Technologies', exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'NSE:MARUTI-EQ', name: 'Maruti Suzuki India', exchange: 'NSE', sector: 'Automotive' },
  { symbol: 'NSE:BAJFINANCE-EQ', name: 'Bajaj Finance', exchange: 'NSE', sector: 'NBFC' },
  { symbol: 'NSE:WIPRO-EQ', name: 'Wipro Limited', exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'NSE:NESTLEIND-EQ', name: 'Nestle India', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'NSE:ULTRACEMCO-EQ', name: 'UltraTech Cement', exchange: 'NSE', sector: 'Cement' },
  { symbol: 'NSE:TITAN-EQ', name: 'Titan Company', exchange: 'NSE', sector: 'Jewelry' },
  { symbol: 'NSE:M&M-EQ', name: 'Mahindra & Mahindra', exchange: 'NSE', sector: 'Automotive' },
  { symbol: 'NSE:SUNPHARMA-EQ', name: 'Sun Pharmaceutical', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'NSE:BAJAJ-AUTO-EQ', name: 'Bajaj Auto', exchange: 'NSE', sector: 'Automotive' },
  { symbol: 'NSE:POWERGRID-EQ', name: 'Power Grid Corporation', exchange: 'NSE', sector: 'Power' },
  { symbol: 'NSE:TECHM-EQ', name: 'Tech Mahindra', exchange: 'NSE', sector: 'IT Services' },

  // High Volume & Growth Stocks (Next 25)
  { symbol: 'NSE:ADANIENT-EQ', name: 'Adani Enterprises', exchange: 'NSE', sector: 'Conglomerate' },
  { symbol: 'NSE:JSWSTEEL-EQ', name: 'JSW Steel', exchange: 'NSE', sector: 'Steel' },
  { symbol: 'NSE:TATAMOTORS-EQ', name: 'Tata Motors', exchange: 'NSE', sector: 'Automotive' },
  { symbol: 'NSE:HDFCLIFE-EQ', name: 'HDFC Life Insurance', exchange: 'NSE', sector: 'Insurance' },
  { symbol: 'NSE:SBILIFE-EQ', name: 'SBI Life Insurance', exchange: 'NSE', sector: 'Insurance' },
  { symbol: 'NSE:ONGC-EQ', name: 'Oil and Natural Gas Corporation', exchange: 'NSE', sector: 'Oil & Gas' },
  { symbol: 'NSE:NTPC-EQ', name: 'NTPC Limited', exchange: 'NSE', sector: 'Power' },
  { symbol: 'NSE:GRASIM-EQ', name: 'Grasim Industries', exchange: 'NSE', sector: 'Textiles' },
  { symbol: 'NSE:CIPLA-EQ', name: 'Cipla Limited', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'NSE:DRREDDY-EQ', name: 'Dr. Reddys Laboratories', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'NSE:EICHERMOT-EQ', name: 'Eicher Motors', exchange: 'NSE', sector: 'Automotive' },
  { symbol: 'NSE:COALINDIA-EQ', name: 'Coal India', exchange: 'NSE', sector: 'Mining' },
  { symbol: 'NSE:BRITANNIA-EQ', name: 'Britannia Industries', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'NSE:DIVISLAB-EQ', name: 'Divis Laboratories', exchange: 'NSE', sector: 'Pharma' },
  { symbol: 'NSE:APOLLOHOSP-EQ', name: 'Apollo Hospitals', exchange: 'NSE', sector: 'Healthcare' },
  { symbol: 'NSE:SHREECEM-EQ', name: 'Shree Cement', exchange: 'NSE', sector: 'Cement' },
  { symbol: 'NSE:BPCL-EQ', name: 'Bharat Petroleum Corporation', exchange: 'NSE', sector: 'Oil & Gas' },
  { symbol: 'NSE:HEROMOTOCO-EQ', name: 'Hero MotoCorp', exchange: 'NSE', sector: 'Automotive' },
  { symbol: 'NSE:TATACONSUM-EQ', name: 'Tata Consumer Products', exchange: 'NSE', sector: 'FMCG' },
  { symbol: 'NSE:TATASTEEL-EQ', name: 'Tata Steel', exchange: 'NSE', sector: 'Steel' },
  { symbol: 'NSE:HINDALCO-EQ', name: 'Hindalco Industries', exchange: 'NSE', sector: 'Metals' },
  { symbol: 'NSE:INDUSINDBK-EQ', name: 'IndusInd Bank', exchange: 'NSE', sector: 'Banking' },
  { symbol: 'NSE:UPL-EQ', name: 'UPL Limited', exchange: 'NSE', sector: 'Chemicals' },
  { symbol: 'NSE:ADANIPORTS-EQ', name: 'Adani Ports and SEZ', exchange: 'NSE', sector: 'Infrastructure' },
  { symbol: 'NSE:BAJAJFINSV-EQ', name: 'Bajaj Finserv', exchange: 'NSE', sector: 'Financial Services' }
];

/**
 * Get stock symbols only (for API calls)
 */
export function getTop50StockSymbols(): string[] {
  return TOP_50_INDIAN_STOCKS.map(stock => stock.symbol);
}

/**
 * Get stock by symbol
 */
export function getStockBySymbol(symbol: string): StockSymbol | undefined {
  return TOP_50_INDIAN_STOCKS.find(stock => stock.symbol === symbol);
}

/**
 * Get stocks by sector
 */
export function getStocksBySector(sector: string): StockSymbol[] {
  return TOP_50_INDIAN_STOCKS.filter(stock => 
    stock.sector.toLowerCase().includes(sector.toLowerCase())
  );
}

/**
 * Timeframes to fetch for each stock (1 year of data)
 */
export const BACKUP_TIMEFRAMES = [
  '1',    // 1 minute
  '5',    // 5 minutes
  '15',   // 15 minutes
  '60',   // 1 hour
  '1D'    // 1 day
];

/**
 * Date range for historical data backup (2 months by default)
 */
export function getBackupDateRange(months: number = 2): { from: string; to: string } {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - months);
  
  return {
    from: fromDate.toISOString().split('T')[0],
    to: toDate.toISOString().split('T')[0]
  };
}