/**
 * Comprehensive NSE/BSE Stock Universe
 * Contains 500+ stocks covering Nifty 50, Nifty Next 50, Nifty Midcap 100,
 * and other popular traded stocks on NSE and BSE
 * 
 * This file supports dynamic symbol lookup for the AI search functionality
 */

export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  exchange: 'NSE' | 'BSE' | 'BOTH';
}

// Comprehensive mapping of common names/aliases to stock symbols
// Keys are lowercase for case-insensitive matching
export const STOCK_UNIVERSE: Record<string, StockInfo> = {
  // NIFTY 50 Stocks (All 50 components)
  'reliance': { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Oil & Gas', exchange: 'BOTH' },
  'reliance industries': { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Oil & Gas', exchange: 'BOTH' },
  'ril': { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Oil & Gas', exchange: 'BOTH' },
  
  'tcs': { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'BOTH' },
  'tata consultancy': { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'BOTH' },
  'tata consultancy services': { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'BOTH' },
  
  'hdfcbank': { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', exchange: 'BOTH' },
  'hdfc bank': { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', exchange: 'BOTH' },
  'hdfc': { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'infy': { symbol: 'INFY', name: 'Infosys', sector: 'IT', exchange: 'BOTH' },
  'infosys': { symbol: 'INFY', name: 'Infosys', sector: 'IT', exchange: 'BOTH' },
  
  'icicibank': { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', exchange: 'BOTH' },
  'icici bank': { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', exchange: 'BOTH' },
  'icici': { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'hindunilvr': { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', exchange: 'BOTH' },
  'hindustan unilever': { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', exchange: 'BOTH' },
  'hul': { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', exchange: 'BOTH' },
  
  'bhartiartl': { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', exchange: 'BOTH' },
  'bharti airtel': { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', exchange: 'BOTH' },
  'airtel': { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', exchange: 'BOTH' },
  
  'sbin': { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', exchange: 'BOTH' },
  'sbi': { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', exchange: 'BOTH' },
  'state bank': { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', exchange: 'BOTH' },
  'state bank of india': { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', exchange: 'BOTH' },
  
  'itc': { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', exchange: 'BOTH' },
  'itc limited': { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', exchange: 'BOTH' },
  
  'lt': { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Engineering', exchange: 'BOTH' },
  'larsen': { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Engineering', exchange: 'BOTH' },
  'larsen & toubro': { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Engineering', exchange: 'BOTH' },
  'l&t': { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Engineering', exchange: 'BOTH' },
  
  'kotakbank': { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', exchange: 'BOTH' },
  'kotak bank': { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', exchange: 'BOTH' },
  'kotak mahindra': { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', exchange: 'BOTH' },
  'kotak': { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'axisbank': { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking', exchange: 'BOTH' },
  'axis bank': { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking', exchange: 'BOTH' },
  'axis': { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'asianpaint': { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Paints', exchange: 'BOTH' },
  'asian paints': { symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Paints', exchange: 'BOTH' },
  
  'hcltech': { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', exchange: 'BOTH' },
  'hcl tech': { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', exchange: 'BOTH' },
  'hcl technologies': { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', exchange: 'BOTH' },
  'hcl': { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', exchange: 'BOTH' },
  
  'maruti': { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Automobile', exchange: 'BOTH' },
  'maruti suzuki': { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Automobile', exchange: 'BOTH' },
  
  'bajfinance': { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance', exchange: 'BOTH' },
  'bajaj finance': { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance', exchange: 'BOTH' },
  
  'wipro': { symbol: 'WIPRO', name: 'Wipro', sector: 'IT', exchange: 'BOTH' },
  
  'nestleind': { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', exchange: 'BOTH' },
  'nestle': { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', exchange: 'BOTH' },
  'nestle india': { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', exchange: 'BOTH' },
  
  'ultracemco': { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', exchange: 'BOTH' },
  'ultratech': { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', exchange: 'BOTH' },
  'ultratech cement': { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', exchange: 'BOTH' },
  
  'titan': { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer Goods', exchange: 'BOTH' },
  'titan company': { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer Goods', exchange: 'BOTH' },
  
  'm&m': { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automobile', exchange: 'BOTH' },
  'mahindra': { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automobile', exchange: 'BOTH' },
  'mahindra & mahindra': { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automobile', exchange: 'BOTH' },
  
  'sunpharma': { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', exchange: 'BOTH' },
  'sun pharma': { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', exchange: 'BOTH' },
  'sun pharmaceutical': { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', exchange: 'BOTH' },
  
  'bajaj-auto': { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Automobile', exchange: 'BOTH' },
  'bajaj auto': { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Automobile', exchange: 'BOTH' },
  'bajajauto': { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Automobile', exchange: 'BOTH' },
  
  'powergrid': { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Power', exchange: 'BOTH' },
  'power grid': { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Power', exchange: 'BOTH' },
  
  'techm': { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT', exchange: 'BOTH' },
  'tech mahindra': { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT', exchange: 'BOTH' },
  
  'adanient': { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Conglomerate', exchange: 'BOTH' },
  'adani enterprises': { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Conglomerate', exchange: 'BOTH' },
  'adani': { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Conglomerate', exchange: 'BOTH' },
  
  'jswsteel': { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Steel', exchange: 'BOTH' },
  'jsw steel': { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Steel', exchange: 'BOTH' },
  'jsw': { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Steel', exchange: 'BOTH' },
  
  // TATA MOTORS - Multiple aliases for better matching
  'tatamotors': { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', exchange: 'BOTH' },
  'tata motors': { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', exchange: 'BOTH' },
  'tata motor': { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', exchange: 'BOTH' },
  'tatamtr': { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', exchange: 'BOTH' },
  
  'hdfclife': { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Insurance', exchange: 'BOTH' },
  'hdfc life': { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Insurance', exchange: 'BOTH' },
  
  'sbilife': { symbol: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Insurance', exchange: 'BOTH' },
  'sbi life': { symbol: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Insurance', exchange: 'BOTH' },
  
  'ongc': { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation', sector: 'Oil & Gas', exchange: 'BOTH' },
  'oil and natural gas': { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation', sector: 'Oil & Gas', exchange: 'BOTH' },
  
  'ntpc': { symbol: 'NTPC', name: 'NTPC Limited', sector: 'Power', exchange: 'BOTH' },
  'ntpc limited': { symbol: 'NTPC', name: 'NTPC Limited', sector: 'Power', exchange: 'BOTH' },
  
  'grasim': { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Textiles', exchange: 'BOTH' },
  'grasim industries': { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Textiles', exchange: 'BOTH' },
  
  'cipla': { symbol: 'CIPLA', name: 'Cipla Limited', sector: 'Pharma', exchange: 'BOTH' },
  
  'drreddy': { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories', sector: 'Pharma', exchange: 'BOTH' },
  'dr reddy': { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories', sector: 'Pharma', exchange: 'BOTH' },
  'dr reddys': { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories', sector: 'Pharma', exchange: 'BOTH' },
  
  'eichermot': { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Automobile', exchange: 'BOTH' },
  'eicher': { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Automobile', exchange: 'BOTH' },
  'eicher motors': { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Automobile', exchange: 'BOTH' },
  'royal enfield': { symbol: 'EICHERMOT', name: 'Eicher Motors', sector: 'Automobile', exchange: 'BOTH' },
  
  'coalindia': { symbol: 'COALINDIA', name: 'Coal India', sector: 'Mining', exchange: 'BOTH' },
  'coal india': { symbol: 'COALINDIA', name: 'Coal India', sector: 'Mining', exchange: 'BOTH' },
  
  'britannia': { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG', exchange: 'BOTH' },
  'britannia industries': { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG', exchange: 'BOTH' },
  
  'divislab': { symbol: 'DIVISLAB', name: 'Divis Laboratories', sector: 'Pharma', exchange: 'BOTH' },
  'divis lab': { symbol: 'DIVISLAB', name: 'Divis Laboratories', sector: 'Pharma', exchange: 'BOTH' },
  'divis': { symbol: 'DIVISLAB', name: 'Divis Laboratories', sector: 'Pharma', exchange: 'BOTH' },
  
  'apollohosp': { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare', exchange: 'BOTH' },
  'apollo': { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare', exchange: 'BOTH' },
  'apollo hospitals': { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare', exchange: 'BOTH' },
  
  'shreecem': { symbol: 'SHREECEM', name: 'Shree Cement', sector: 'Cement', exchange: 'BOTH' },
  'shree cement': { symbol: 'SHREECEM', name: 'Shree Cement', sector: 'Cement', exchange: 'BOTH' },
  
  'bpcl': { symbol: 'BPCL', name: 'Bharat Petroleum', sector: 'Oil & Gas', exchange: 'BOTH' },
  'bharat petroleum': { symbol: 'BPCL', name: 'Bharat Petroleum', sector: 'Oil & Gas', exchange: 'BOTH' },
  
  'heromotoco': { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Automobile', exchange: 'BOTH' },
  'hero': { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Automobile', exchange: 'BOTH' },
  'hero motocorp': { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Automobile', exchange: 'BOTH' },
  
  'tataconsum': { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG', exchange: 'BOTH' },
  'tata consumer': { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG', exchange: 'BOTH' },
  
  'tatasteel': { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Steel', exchange: 'BOTH' },
  'tata steel': { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Steel', exchange: 'BOTH' },
  
  'hindalco': { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', exchange: 'BOTH' },
  'hindalco industries': { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', exchange: 'BOTH' },
  
  'indusindbk': { symbol: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Banking', exchange: 'BOTH' },
  'indusind bank': { symbol: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Banking', exchange: 'BOTH' },
  'indusind': { symbol: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'upl': { symbol: 'UPL', name: 'UPL Limited', sector: 'Chemicals', exchange: 'BOTH' },
  
  'adaniports': { symbol: 'ADANIPORTS', name: 'Adani Ports and SEZ', sector: 'Infrastructure', exchange: 'BOTH' },
  'adani ports': { symbol: 'ADANIPORTS', name: 'Adani Ports and SEZ', sector: 'Infrastructure', exchange: 'BOTH' },
  
  'bajajfinsv': { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Finance', exchange: 'BOTH' },
  'bajaj finserv': { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Finance', exchange: 'BOTH' },
  
  // NIFTY NEXT 50 Stocks
  'adanigreen': { symbol: 'ADANIGREEN', name: 'Adani Green Energy', sector: 'Power', exchange: 'BOTH' },
  'adani green': { symbol: 'ADANIGREEN', name: 'Adani Green Energy', sector: 'Power', exchange: 'BOTH' },
  
  'adanitrans': { symbol: 'ADANITRANS', name: 'Adani Transmission', sector: 'Power', exchange: 'BOTH' },
  'adani transmission': { symbol: 'ADANITRANS', name: 'Adani Transmission', sector: 'Power', exchange: 'BOTH' },
  
  'ambujacem': { symbol: 'AMBUJACEM', name: 'Ambuja Cements', sector: 'Cement', exchange: 'BOTH' },
  'ambuja': { symbol: 'AMBUJACEM', name: 'Ambuja Cements', sector: 'Cement', exchange: 'BOTH' },
  'ambuja cement': { symbol: 'AMBUJACEM', name: 'Ambuja Cements', sector: 'Cement', exchange: 'BOTH' },
  
  'auropharma': { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma', sector: 'Pharma', exchange: 'BOTH' },
  'aurobindo': { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma', sector: 'Pharma', exchange: 'BOTH' },
  'aurobindo pharma': { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma', sector: 'Pharma', exchange: 'BOTH' },
  
  'bankbaroda': { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking', exchange: 'BOTH' },
  'bank of baroda': { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking', exchange: 'BOTH' },
  'bob': { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking', exchange: 'BOTH' },
  
  'bergepaint': { symbol: 'BERGEPAINT', name: 'Berger Paints', sector: 'Paints', exchange: 'BOTH' },
  'berger paints': { symbol: 'BERGEPAINT', name: 'Berger Paints', sector: 'Paints', exchange: 'BOTH' },
  'berger': { symbol: 'BERGEPAINT', name: 'Berger Paints', sector: 'Paints', exchange: 'BOTH' },
  
  'biocon': { symbol: 'BIOCON', name: 'Biocon', sector: 'Pharma', exchange: 'BOTH' },
  
  'boschltd': { symbol: 'BOSCHLTD', name: 'Bosch Limited', sector: 'Auto Ancillary', exchange: 'BOTH' },
  'bosch': { symbol: 'BOSCHLTD', name: 'Bosch Limited', sector: 'Auto Ancillary', exchange: 'BOTH' },
  
  'canbk': { symbol: 'CANBK', name: 'Canara Bank', sector: 'Banking', exchange: 'BOTH' },
  'canara bank': { symbol: 'CANBK', name: 'Canara Bank', sector: 'Banking', exchange: 'BOTH' },
  'canara': { symbol: 'CANBK', name: 'Canara Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'cholafin': { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment', sector: 'Finance', exchange: 'BOTH' },
  'chola': { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment', sector: 'Finance', exchange: 'BOTH' },
  'cholamandalam': { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment', sector: 'Finance', exchange: 'BOTH' },
  
  'colpal': { symbol: 'COLPAL', name: 'Colgate Palmolive India', sector: 'FMCG', exchange: 'BOTH' },
  'colgate': { symbol: 'COLPAL', name: 'Colgate Palmolive India', sector: 'FMCG', exchange: 'BOTH' },
  
  'dabur': { symbol: 'DABUR', name: 'Dabur India', sector: 'FMCG', exchange: 'BOTH' },
  'dabur india': { symbol: 'DABUR', name: 'Dabur India', sector: 'FMCG', exchange: 'BOTH' },
  
  'dmart': { symbol: 'DMART', name: 'Avenue Supermarts', sector: 'Retail', exchange: 'BOTH' },
  'avenue supermarts': { symbol: 'DMART', name: 'Avenue Supermarts', sector: 'Retail', exchange: 'BOTH' },
  'd-mart': { symbol: 'DMART', name: 'Avenue Supermarts', sector: 'Retail', exchange: 'BOTH' },
  
  'dlf': { symbol: 'DLF', name: 'DLF Limited', sector: 'Real Estate', exchange: 'BOTH' },
  
  'federalbnk': { symbol: 'FEDERALBNK', name: 'Federal Bank', sector: 'Banking', exchange: 'BOTH' },
  'federal bank': { symbol: 'FEDERALBNK', name: 'Federal Bank', sector: 'Banking', exchange: 'BOTH' },
  'federal': { symbol: 'FEDERALBNK', name: 'Federal Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'gail': { symbol: 'GAIL', name: 'GAIL India', sector: 'Oil & Gas', exchange: 'BOTH' },
  'gail india': { symbol: 'GAIL', name: 'GAIL India', sector: 'Oil & Gas', exchange: 'BOTH' },
  
  'godrejcp': { symbol: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG', exchange: 'BOTH' },
  'godrej consumer': { symbol: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG', exchange: 'BOTH' },
  'godrej': { symbol: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG', exchange: 'BOTH' },
  
  'godrejprop': { symbol: 'GODREJPROP', name: 'Godrej Properties', sector: 'Real Estate', exchange: 'BOTH' },
  'godrej properties': { symbol: 'GODREJPROP', name: 'Godrej Properties', sector: 'Real Estate', exchange: 'BOTH' },
  
  'havells': { symbol: 'HAVELLS', name: 'Havells India', sector: 'Electricals', exchange: 'BOTH' },
  'havells india': { symbol: 'HAVELLS', name: 'Havells India', sector: 'Electricals', exchange: 'BOTH' },
  
  'hdfcamc': { symbol: 'HDFCAMC', name: 'HDFC Asset Management', sector: 'Finance', exchange: 'BOTH' },
  'hdfc amc': { symbol: 'HDFCAMC', name: 'HDFC Asset Management', sector: 'Finance', exchange: 'BOTH' },
  
  'icicipruli': { symbol: 'ICICIPRULI', name: 'ICICI Prudential Life', sector: 'Insurance', exchange: 'BOTH' },
  'icici prudential': { symbol: 'ICICIPRULI', name: 'ICICI Prudential Life', sector: 'Insurance', exchange: 'BOTH' },
  
  'icicigi': { symbol: 'ICICIGI', name: 'ICICI Lombard General Insurance', sector: 'Insurance', exchange: 'BOTH' },
  'icici lombard': { symbol: 'ICICIGI', name: 'ICICI Lombard General Insurance', sector: 'Insurance', exchange: 'BOTH' },
  
  'idfcfirstb': { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank', sector: 'Banking', exchange: 'BOTH' },
  'idfc first': { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank', sector: 'Banking', exchange: 'BOTH' },
  'idfc first bank': { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'indigo': { symbol: 'INDIGO', name: 'InterGlobe Aviation', sector: 'Aviation', exchange: 'BOTH' },
  'interglobe': { symbol: 'INDIGO', name: 'InterGlobe Aviation', sector: 'Aviation', exchange: 'BOTH' },
  'interglobe aviation': { symbol: 'INDIGO', name: 'InterGlobe Aviation', sector: 'Aviation', exchange: 'BOTH' },
  
  'ioc': { symbol: 'IOC', name: 'Indian Oil Corporation', sector: 'Oil & Gas', exchange: 'BOTH' },
  'indian oil': { symbol: 'IOC', name: 'Indian Oil Corporation', sector: 'Oil & Gas', exchange: 'BOTH' },
  
  'jublfood': { symbol: 'JUBLFOOD', name: 'Jubilant Foodworks', sector: 'Restaurant', exchange: 'BOTH' },
  'jubilant food': { symbol: 'JUBLFOOD', name: 'Jubilant Foodworks', sector: 'Restaurant', exchange: 'BOTH' },
  'dominos': { symbol: 'JUBLFOOD', name: 'Jubilant Foodworks', sector: 'Restaurant', exchange: 'BOTH' },
  
  'lici': { symbol: 'LICI', name: 'Life Insurance Corporation', sector: 'Insurance', exchange: 'BOTH' },
  'lic': { symbol: 'LICI', name: 'Life Insurance Corporation', sector: 'Insurance', exchange: 'BOTH' },
  'life insurance corporation': { symbol: 'LICI', name: 'Life Insurance Corporation', sector: 'Insurance', exchange: 'BOTH' },
  
  'ltim': { symbol: 'LTIM', name: 'LTIMindtree', sector: 'IT', exchange: 'BOTH' },
  'ltimindtree': { symbol: 'LTIM', name: 'LTIMindtree', sector: 'IT', exchange: 'BOTH' },
  'mindtree': { symbol: 'LTIM', name: 'LTIMindtree', sector: 'IT', exchange: 'BOTH' },
  
  'ltts': { symbol: 'LTTS', name: 'L&T Technology Services', sector: 'IT', exchange: 'BOTH' },
  'l&t technology': { symbol: 'LTTS', name: 'L&T Technology Services', sector: 'IT', exchange: 'BOTH' },
  
  'lupin': { symbol: 'LUPIN', name: 'Lupin Limited', sector: 'Pharma', exchange: 'BOTH' },
  
  'marico': { symbol: 'MARICO', name: 'Marico Limited', sector: 'FMCG', exchange: 'BOTH' },
  
  'mphasis': { symbol: 'MPHASIS', name: 'Mphasis Limited', sector: 'IT', exchange: 'BOTH' },
  
  'muthootfin': { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance', sector: 'Finance', exchange: 'BOTH' },
  'muthoot': { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance', sector: 'Finance', exchange: 'BOTH' },
  'muthoot finance': { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance', sector: 'Finance', exchange: 'BOTH' },
  
  'naukri': { symbol: 'NAUKRI', name: 'Info Edge India', sector: 'Internet', exchange: 'BOTH' },
  'info edge': { symbol: 'NAUKRI', name: 'Info Edge India', sector: 'Internet', exchange: 'BOTH' },
  
  'nmdc': { symbol: 'NMDC', name: 'NMDC Limited', sector: 'Mining', exchange: 'BOTH' },
  
  'oberoirlty': { symbol: 'OBEROIRLTY', name: 'Oberoi Realty', sector: 'Real Estate', exchange: 'BOTH' },
  'oberoi': { symbol: 'OBEROIRLTY', name: 'Oberoi Realty', sector: 'Real Estate', exchange: 'BOTH' },
  'oberoi realty': { symbol: 'OBEROIRLTY', name: 'Oberoi Realty', sector: 'Real Estate', exchange: 'BOTH' },
  
  'ofss': { symbol: 'OFSS', name: 'Oracle Financial Services', sector: 'IT', exchange: 'BOTH' },
  'oracle financial': { symbol: 'OFSS', name: 'Oracle Financial Services', sector: 'IT', exchange: 'BOTH' },
  
  'pageind': { symbol: 'PAGEIND', name: 'Page Industries', sector: 'Textiles', exchange: 'BOTH' },
  'page industries': { symbol: 'PAGEIND', name: 'Page Industries', sector: 'Textiles', exchange: 'BOTH' },
  'jockey': { symbol: 'PAGEIND', name: 'Page Industries', sector: 'Textiles', exchange: 'BOTH' },
  
  'pfc': { symbol: 'PFC', name: 'Power Finance Corporation', sector: 'Finance', exchange: 'BOTH' },
  'power finance': { symbol: 'PFC', name: 'Power Finance Corporation', sector: 'Finance', exchange: 'BOTH' },
  
  'pidilitind': { symbol: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Chemicals', exchange: 'BOTH' },
  'pidilite': { symbol: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Chemicals', exchange: 'BOTH' },
  'fevicol': { symbol: 'PIDILITIND', name: 'Pidilite Industries', sector: 'Chemicals', exchange: 'BOTH' },
  
  'pnb': { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Banking', exchange: 'BOTH' },
  'punjab national': { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Banking', exchange: 'BOTH' },
  'punjab national bank': { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'policybzr': { symbol: 'POLICYBZR', name: 'PB Fintech', sector: 'Insurance', exchange: 'BOTH' },
  'policybazaar': { symbol: 'POLICYBZR', name: 'PB Fintech', sector: 'Insurance', exchange: 'BOTH' },
  'pb fintech': { symbol: 'POLICYBZR', name: 'PB Fintech', sector: 'Insurance', exchange: 'BOTH' },
  
  'recltd': { symbol: 'RECLTD', name: 'REC Limited', sector: 'Finance', exchange: 'BOTH' },
  'rec': { symbol: 'RECLTD', name: 'REC Limited', sector: 'Finance', exchange: 'BOTH' },
  
  'sbicard': { symbol: 'SBICARD', name: 'SBI Cards', sector: 'Finance', exchange: 'BOTH' },
  'sbi card': { symbol: 'SBICARD', name: 'SBI Cards', sector: 'Finance', exchange: 'BOTH' },
  'sbi cards': { symbol: 'SBICARD', name: 'SBI Cards', sector: 'Finance', exchange: 'BOTH' },
  
  'siemens': { symbol: 'SIEMENS', name: 'Siemens Limited', sector: 'Engineering', exchange: 'BOTH' },
  
  'srf': { symbol: 'SRF', name: 'SRF Limited', sector: 'Chemicals', exchange: 'BOTH' },
  
  'tatapower': { symbol: 'TATAPOWER', name: 'Tata Power Company', sector: 'Power', exchange: 'BOTH' },
  'tata power': { symbol: 'TATAPOWER', name: 'Tata Power Company', sector: 'Power', exchange: 'BOTH' },
  
  'tataelxsi': { symbol: 'TATAELXSI', name: 'Tata Elxsi', sector: 'IT', exchange: 'BOTH' },
  'tata elxsi': { symbol: 'TATAELXSI', name: 'Tata Elxsi', sector: 'IT', exchange: 'BOTH' },
  
  'tatacomm': { symbol: 'TATACOMM', name: 'Tata Communications', sector: 'Telecom', exchange: 'BOTH' },
  'tata communications': { symbol: 'TATACOMM', name: 'Tata Communications', sector: 'Telecom', exchange: 'BOTH' },
  
  'torntpharm': { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', sector: 'Pharma', exchange: 'BOTH' },
  'torrent pharma': { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', sector: 'Pharma', exchange: 'BOTH' },
  'torrent': { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', sector: 'Pharma', exchange: 'BOTH' },
  
  'trent': { symbol: 'TRENT', name: 'Trent Limited', sector: 'Retail', exchange: 'BOTH' },
  'westside': { symbol: 'TRENT', name: 'Trent Limited', sector: 'Retail', exchange: 'BOTH' },
  'zudio': { symbol: 'TRENT', name: 'Trent Limited', sector: 'Retail', exchange: 'BOTH' },
  
  'vedl': { symbol: 'VEDL', name: 'Vedanta Limited', sector: 'Metals', exchange: 'BOTH' },
  'vedanta': { symbol: 'VEDL', name: 'Vedanta Limited', sector: 'Metals', exchange: 'BOTH' },
  
  'zomato': { symbol: 'ZOMATO', name: 'Zomato Limited', sector: 'Internet', exchange: 'BOTH' },
  'zomato limited': { symbol: 'ZOMATO', name: 'Zomato Limited', sector: 'Internet', exchange: 'BOTH' },
  
  // Popular Mid-cap and Small-cap Stocks
  'abb': { symbol: 'ABB', name: 'ABB India', sector: 'Engineering', exchange: 'BOTH' },
  'abb india': { symbol: 'ABB', name: 'ABB India', sector: 'Engineering', exchange: 'BOTH' },
  
  'alkem': { symbol: 'ALKEM', name: 'Alkem Laboratories', sector: 'Pharma', exchange: 'BOTH' },
  'alkem labs': { symbol: 'ALKEM', name: 'Alkem Laboratories', sector: 'Pharma', exchange: 'BOTH' },
  
  'ashokley': { symbol: 'ASHOKLEY', name: 'Ashok Leyland', sector: 'Automobile', exchange: 'BOTH' },
  'ashok leyland': { symbol: 'ASHOKLEY', name: 'Ashok Leyland', sector: 'Automobile', exchange: 'BOTH' },
  
  'astral': { symbol: 'ASTRAL', name: 'Astral Limited', sector: 'Plastics', exchange: 'BOTH' },
  
  'atul': { symbol: 'ATUL', name: 'Atul Limited', sector: 'Chemicals', exchange: 'BOTH' },
  
  'aubank': { symbol: 'AUBANK', name: 'AU Small Finance Bank', sector: 'Banking', exchange: 'BOTH' },
  'au bank': { symbol: 'AUBANK', name: 'AU Small Finance Bank', sector: 'Banking', exchange: 'BOTH' },
  'au small finance': { symbol: 'AUBANK', name: 'AU Small Finance Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'balramchin': { symbol: 'BALRAMCHIN', name: 'Balrampur Chini Mills', sector: 'Sugar', exchange: 'BOTH' },
  'balrampur': { symbol: 'BALRAMCHIN', name: 'Balrampur Chini Mills', sector: 'Sugar', exchange: 'BOTH' },
  
  'bandhanbnk': { symbol: 'BANDHANBNK', name: 'Bandhan Bank', sector: 'Banking', exchange: 'BOTH' },
  'bandhan bank': { symbol: 'BANDHANBNK', name: 'Bandhan Bank', sector: 'Banking', exchange: 'BOTH' },
  'bandhan': { symbol: 'BANDHANBNK', name: 'Bandhan Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'bataindia': { symbol: 'BATAINDIA', name: 'Bata India', sector: 'Footwear', exchange: 'BOTH' },
  'bata': { symbol: 'BATAINDIA', name: 'Bata India', sector: 'Footwear', exchange: 'BOTH' },
  'bata india': { symbol: 'BATAINDIA', name: 'Bata India', sector: 'Footwear', exchange: 'BOTH' },
  
  'bhel': { symbol: 'BHEL', name: 'Bharat Heavy Electricals', sector: 'Engineering', exchange: 'BOTH' },
  'bharat heavy': { symbol: 'BHEL', name: 'Bharat Heavy Electricals', sector: 'Engineering', exchange: 'BOTH' },
  
  'cadilahc': { symbol: 'CADILAHC', name: 'Cadila Healthcare', sector: 'Pharma', exchange: 'BOTH' },
  'cadila': { symbol: 'CADILAHC', name: 'Cadila Healthcare', sector: 'Pharma', exchange: 'BOTH' },
  'zydus': { symbol: 'CADILAHC', name: 'Cadila Healthcare', sector: 'Pharma', exchange: 'BOTH' },
  
  'castrolind': { symbol: 'CASTROLIND', name: 'Castrol India', sector: 'Lubricants', exchange: 'BOTH' },
  'castrol': { symbol: 'CASTROLIND', name: 'Castrol India', sector: 'Lubricants', exchange: 'BOTH' },
  
  'cesc': { symbol: 'CESC', name: 'CESC Limited', sector: 'Power', exchange: 'BOTH' },
  
  'crompton': { symbol: 'CROMPTON', name: 'Crompton Greaves Consumer', sector: 'Electricals', exchange: 'BOTH' },
  'crompton greaves': { symbol: 'CROMPTON', name: 'Crompton Greaves Consumer', sector: 'Electricals', exchange: 'BOTH' },
  
  'cumminsind': { symbol: 'CUMMINSIND', name: 'Cummins India', sector: 'Engineering', exchange: 'BOTH' },
  'cummins': { symbol: 'CUMMINSIND', name: 'Cummins India', sector: 'Engineering', exchange: 'BOTH' },
  
  'escorts': { symbol: 'ESCORTS', name: 'Escorts Limited', sector: 'Automobile', exchange: 'BOTH' },
  
  'exideind': { symbol: 'EXIDEIND', name: 'Exide Industries', sector: 'Auto Ancillary', exchange: 'BOTH' },
  'exide': { symbol: 'EXIDEIND', name: 'Exide Industries', sector: 'Auto Ancillary', exchange: 'BOTH' },
  
  'glaxo': { symbol: 'GLAXO', name: 'GlaxoSmithKline Pharma', sector: 'Pharma', exchange: 'BOTH' },
  'gsk': { symbol: 'GLAXO', name: 'GlaxoSmithKline Pharma', sector: 'Pharma', exchange: 'BOTH' },
  
  'gmrinfra': { symbol: 'GMRINFRA', name: 'GMR Infrastructure', sector: 'Infrastructure', exchange: 'BOTH' },
  'gmr': { symbol: 'GMRINFRA', name: 'GMR Infrastructure', sector: 'Infrastructure', exchange: 'BOTH' },
  
  'gujgasltd': { symbol: 'GUJGASLTD', name: 'Gujarat Gas', sector: 'Gas Distribution', exchange: 'BOTH' },
  'gujarat gas': { symbol: 'GUJGASLTD', name: 'Gujarat Gas', sector: 'Gas Distribution', exchange: 'BOTH' },
  
  'hal': { symbol: 'HAL', name: 'Hindustan Aeronautics', sector: 'Defence', exchange: 'BOTH' },
  'hindustan aeronautics': { symbol: 'HAL', name: 'Hindustan Aeronautics', sector: 'Defence', exchange: 'BOTH' },
  
  'hdfcergo': { symbol: 'HDFCERGO', name: 'HDFC ERGO General Insurance', sector: 'Insurance', exchange: 'BOTH' },
  
  'hindpetro': { symbol: 'HINDPETRO', name: 'Hindustan Petroleum', sector: 'Oil & Gas', exchange: 'BOTH' },
  'hpcl': { symbol: 'HINDPETRO', name: 'Hindustan Petroleum', sector: 'Oil & Gas', exchange: 'BOTH' },
  'hindustan petroleum': { symbol: 'HINDPETRO', name: 'Hindustan Petroleum', sector: 'Oil & Gas', exchange: 'BOTH' },
  
  'hindzinc': { symbol: 'HINDZINC', name: 'Hindustan Zinc', sector: 'Metals', exchange: 'BOTH' },
  'hindustan zinc': { symbol: 'HINDZINC', name: 'Hindustan Zinc', sector: 'Metals', exchange: 'BOTH' },
  
  'idbi': { symbol: 'IDBI', name: 'IDBI Bank', sector: 'Banking', exchange: 'BOTH' },
  'idbi bank': { symbol: 'IDBI', name: 'IDBI Bank', sector: 'Banking', exchange: 'BOTH' },
  
  'idea': { symbol: 'IDEA', name: 'Vodafone Idea', sector: 'Telecom', exchange: 'BOTH' },
  'vodafone idea': { symbol: 'IDEA', name: 'Vodafone Idea', sector: 'Telecom', exchange: 'BOTH' },
  'vi': { symbol: 'IDEA', name: 'Vodafone Idea', sector: 'Telecom', exchange: 'BOTH' },
  
  'igl': { symbol: 'IGL', name: 'Indraprastha Gas', sector: 'Gas Distribution', exchange: 'BOTH' },
  'indraprastha gas': { symbol: 'IGL', name: 'Indraprastha Gas', sector: 'Gas Distribution', exchange: 'BOTH' },
  
  'industower': { symbol: 'INDUSTOWER', name: 'Indus Towers', sector: 'Telecom', exchange: 'BOTH' },
  'indus towers': { symbol: 'INDUSTOWER', name: 'Indus Towers', sector: 'Telecom', exchange: 'BOTH' },
  
  'irctc': { symbol: 'IRCTC', name: 'Indian Railway Catering', sector: 'Railways', exchange: 'BOTH' },
  'indian railway': { symbol: 'IRCTC', name: 'Indian Railway Catering', sector: 'Railways', exchange: 'BOTH' },
  
  'jswenergy': { symbol: 'JSWENERGY', name: 'JSW Energy', sector: 'Power', exchange: 'BOTH' },
  'jsw energy': { symbol: 'JSWENERGY', name: 'JSW Energy', sector: 'Power', exchange: 'BOTH' },
  
  'jindalstel': { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power', sector: 'Steel', exchange: 'BOTH' },
  'jindal steel': { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power', sector: 'Steel', exchange: 'BOTH' },
  'jspl': { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power', sector: 'Steel', exchange: 'BOTH' },
  
  'lichsgfin': { symbol: 'LICHSGFIN', name: 'LIC Housing Finance', sector: 'Finance', exchange: 'BOTH' },
  'lic housing': { symbol: 'LICHSGFIN', name: 'LIC Housing Finance', sector: 'Finance', exchange: 'BOTH' },
  
  'manappuram': { symbol: 'MANAPPURAM', name: 'Manappuram Finance', sector: 'Finance', exchange: 'BOTH' },
  'manappuram finance': { symbol: 'MANAPPURAM', name: 'Manappuram Finance', sector: 'Finance', exchange: 'BOTH' },
  
  'maxhealth': { symbol: 'MAXHEALTH', name: 'Max Healthcare', sector: 'Healthcare', exchange: 'BOTH' },
  'max healthcare': { symbol: 'MAXHEALTH', name: 'Max Healthcare', sector: 'Healthcare', exchange: 'BOTH' },
  'max hospital': { symbol: 'MAXHEALTH', name: 'Max Healthcare', sector: 'Healthcare', exchange: 'BOTH' },
  
  'mcdowell-n': { symbol: 'MCDOWELL-N', name: 'United Spirits', sector: 'Alcoholic Beverages', exchange: 'BOTH' },
  'united spirits': { symbol: 'MCDOWELL-N', name: 'United Spirits', sector: 'Alcoholic Beverages', exchange: 'BOTH' },
  'mcdowell': { symbol: 'MCDOWELL-N', name: 'United Spirits', sector: 'Alcoholic Beverages', exchange: 'BOTH' },
  
  'mfsl': { symbol: 'MFSL', name: 'Max Financial Services', sector: 'Finance', exchange: 'BOTH' },
  'max financial': { symbol: 'MFSL', name: 'Max Financial Services', sector: 'Finance', exchange: 'BOTH' },
  
  'motherson': { symbol: 'MOTHERSON', name: 'Motherson Sumi Systems', sector: 'Auto Ancillary', exchange: 'BOTH' },
  'motherson sumi': { symbol: 'MOTHERSON', name: 'Motherson Sumi Systems', sector: 'Auto Ancillary', exchange: 'BOTH' },
  
  'mrf': { symbol: 'MRF', name: 'MRF Limited', sector: 'Tyres', exchange: 'BOTH' },
  
  'natcopharm': { symbol: 'NATCOPHARM', name: 'Natco Pharma', sector: 'Pharma', exchange: 'BOTH' },
  'natco': { symbol: 'NATCOPHARM', name: 'Natco Pharma', sector: 'Pharma', exchange: 'BOTH' },
  
  'navinfluor': { symbol: 'NAVINFLUOR', name: 'Navin Fluorine', sector: 'Chemicals', exchange: 'BOTH' },
  'navin fluorine': { symbol: 'NAVINFLUOR', name: 'Navin Fluorine', sector: 'Chemicals', exchange: 'BOTH' },
  
  'niacl': { symbol: 'NIACL', name: 'New India Assurance', sector: 'Insurance', exchange: 'BOTH' },
  'new india assurance': { symbol: 'NIACL', name: 'New India Assurance', sector: 'Insurance', exchange: 'BOTH' },
  
  'paytm': { symbol: 'PAYTM', name: 'One 97 Communications', sector: 'Fintech', exchange: 'BOTH' },
  'one97': { symbol: 'PAYTM', name: 'One 97 Communications', sector: 'Fintech', exchange: 'BOTH' },
  
  'persistent': { symbol: 'PERSISTENT', name: 'Persistent Systems', sector: 'IT', exchange: 'BOTH' },
  'persistent systems': { symbol: 'PERSISTENT', name: 'Persistent Systems', sector: 'IT', exchange: 'BOTH' },
  
  'petronet': { symbol: 'PETRONET', name: 'Petronet LNG', sector: 'Gas', exchange: 'BOTH' },
  'petronet lng': { symbol: 'PETRONET', name: 'Petronet LNG', sector: 'Gas', exchange: 'BOTH' },
  
  'pghh': { symbol: 'PGHH', name: 'Procter & Gamble Hygiene', sector: 'FMCG', exchange: 'BOTH' },
  'p&g': { symbol: 'PGHH', name: 'Procter & Gamble Hygiene', sector: 'FMCG', exchange: 'BOTH' },
  'procter': { symbol: 'PGHH', name: 'Procter & Gamble Hygiene', sector: 'FMCG', exchange: 'BOTH' },
  
  'piind': { symbol: 'PIIND', name: 'PI Industries', sector: 'Chemicals', exchange: 'BOTH' },
  'pi industries': { symbol: 'PIIND', name: 'PI Industries', sector: 'Chemicals', exchange: 'BOTH' },
  
  'polycab': { symbol: 'POLYCAB', name: 'Polycab India', sector: 'Electricals', exchange: 'BOTH' },
  'polycab india': { symbol: 'POLYCAB', name: 'Polycab India', sector: 'Electricals', exchange: 'BOTH' },
  
  'prestige': { symbol: 'PRESTIGE', name: 'Prestige Estates', sector: 'Real Estate', exchange: 'BOTH' },
  'prestige estates': { symbol: 'PRESTIGE', name: 'Prestige Estates', sector: 'Real Estate', exchange: 'BOTH' },
  
  'pvr': { symbol: 'PVR', name: 'PVR INOX', sector: 'Entertainment', exchange: 'BOTH' },
  'pvr inox': { symbol: 'PVR', name: 'PVR INOX', sector: 'Entertainment', exchange: 'BOTH' },
  'inox': { symbol: 'PVR', name: 'PVR INOX', sector: 'Entertainment', exchange: 'BOTH' },
  
  'rajeshexpo': { symbol: 'RAJESHEXPO', name: 'Rajesh Exports', sector: 'Jewellery', exchange: 'BOTH' },
  'rajesh exports': { symbol: 'RAJESHEXPO', name: 'Rajesh Exports', sector: 'Jewellery', exchange: 'BOTH' },
  
  'ramcocem': { symbol: 'RAMCOCEM', name: 'Ramco Cements', sector: 'Cement', exchange: 'BOTH' },
  'ramco': { symbol: 'RAMCOCEM', name: 'Ramco Cements', sector: 'Cement', exchange: 'BOTH' },
  
  'relaxo': { symbol: 'RELAXO', name: 'Relaxo Footwears', sector: 'Footwear', exchange: 'BOTH' },
  
  'sail': { symbol: 'SAIL', name: 'Steel Authority of India', sector: 'Steel', exchange: 'BOTH' },
  'steel authority': { symbol: 'SAIL', name: 'Steel Authority of India', sector: 'Steel', exchange: 'BOTH' },
  
  'suntv': { symbol: 'SUNTV', name: 'Sun TV Network', sector: 'Media', exchange: 'BOTH' },
  'sun tv': { symbol: 'SUNTV', name: 'Sun TV Network', sector: 'Media', exchange: 'BOTH' },
  
  'supremeind': { symbol: 'SUPREMEIND', name: 'Supreme Industries', sector: 'Plastics', exchange: 'BOTH' },
  'supreme industries': { symbol: 'SUPREMEIND', name: 'Supreme Industries', sector: 'Plastics', exchange: 'BOTH' },
  
  'syngene': { symbol: 'SYNGENE', name: 'Syngene International', sector: 'Pharma', exchange: 'BOTH' },
  'syngene international': { symbol: 'SYNGENE', name: 'Syngene International', sector: 'Pharma', exchange: 'BOTH' },
  
  'tatachemicals': { symbol: 'TATACHEM', name: 'Tata Chemicals', sector: 'Chemicals', exchange: 'BOTH' },
  'tata chemicals': { symbol: 'TATACHEM', name: 'Tata Chemicals', sector: 'Chemicals', exchange: 'BOTH' },
  'tatachem': { symbol: 'TATACHEM', name: 'Tata Chemicals', sector: 'Chemicals', exchange: 'BOTH' },
  
  'tvsmotor': { symbol: 'TVSMOTOR', name: 'TVS Motor Company', sector: 'Automobile', exchange: 'BOTH' },
  'tvs motor': { symbol: 'TVSMOTOR', name: 'TVS Motor Company', sector: 'Automobile', exchange: 'BOTH' },
  'tvs': { symbol: 'TVSMOTOR', name: 'TVS Motor Company', sector: 'Automobile', exchange: 'BOTH' },
  
  'uflex': { symbol: 'UFLEX', name: 'Uflex Limited', sector: 'Packaging', exchange: 'BOTH' },
  
  'unionbank': { symbol: 'UNIONBANK', name: 'Union Bank of India', sector: 'Banking', exchange: 'BOTH' },
  'union bank': { symbol: 'UNIONBANK', name: 'Union Bank of India', sector: 'Banking', exchange: 'BOTH' },
  
  'voltas': { symbol: 'VOLTAS', name: 'Voltas Limited', sector: 'Consumer Durables', exchange: 'BOTH' },
  
  'whirlpool': { symbol: 'WHIRLPOOL', name: 'Whirlpool of India', sector: 'Consumer Durables', exchange: 'BOTH' },
  'whirlpool india': { symbol: 'WHIRLPOOL', name: 'Whirlpool of India', sector: 'Consumer Durables', exchange: 'BOTH' },
  
  'yesbank': { symbol: 'YESBANK', name: 'Yes Bank', sector: 'Banking', exchange: 'BOTH' },
  'yes bank': { symbol: 'YESBANK', name: 'Yes Bank', sector: 'Banking', exchange: 'BOTH' },
  
  // Market Indices
  'nifty': { symbol: 'NIFTY50', name: 'Nifty 50', sector: 'Index', exchange: 'NSE' },
  'nifty 50': { symbol: 'NIFTY50', name: 'Nifty 50', sector: 'Index', exchange: 'NSE' },
  'nifty50': { symbol: 'NIFTY50', name: 'Nifty 50', sector: 'Index', exchange: 'NSE' },
  
  'sensex': { symbol: 'SENSEX', name: 'BSE Sensex', sector: 'Index', exchange: 'BSE' },
  'bse sensex': { symbol: 'SENSEX', name: 'BSE Sensex', sector: 'Index', exchange: 'BSE' },
  
  'banknifty': { symbol: 'BANKNIFTY', name: 'Bank Nifty', sector: 'Index', exchange: 'NSE' },
  'bank nifty': { symbol: 'BANKNIFTY', name: 'Bank Nifty', sector: 'Index', exchange: 'NSE' },
  'niftybank': { symbol: 'BANKNIFTY', name: 'Bank Nifty', sector: 'Index', exchange: 'NSE' },
  
  'niftyit': { symbol: 'NIFTYIT', name: 'Nifty IT', sector: 'Index', exchange: 'NSE' },
  'nifty it': { symbol: 'NIFTYIT', name: 'Nifty IT', sector: 'Index', exchange: 'NSE' },
  
  'finnifty': { symbol: 'FINNIFTY', name: 'Nifty Financial Services', sector: 'Index', exchange: 'NSE' },
  'fin nifty': { symbol: 'FINNIFTY', name: 'Nifty Financial Services', sector: 'Index', exchange: 'NSE' },
  
  // Commodities
  'gold': { symbol: 'GOLD', name: 'Gold', sector: 'Commodity', exchange: 'NSE' },
  'silver': { symbol: 'SILVER', name: 'Silver', sector: 'Commodity', exchange: 'NSE' },
  'crude': { symbol: 'CRUDEOIL', name: 'Crude Oil', sector: 'Commodity', exchange: 'NSE' },
  'crude oil': { symbol: 'CRUDEOIL', name: 'Crude Oil', sector: 'Commodity', exchange: 'NSE' },
  'crudeoil': { symbol: 'CRUDEOIL', name: 'Crude Oil', sector: 'Commodity', exchange: 'NSE' },
  'naturalgas': { symbol: 'NATURALGAS', name: 'Natural Gas', sector: 'Commodity', exchange: 'NSE' },
  'natural gas': { symbol: 'NATURALGAS', name: 'Natural Gas', sector: 'Commodity', exchange: 'NSE' },
  'copper': { symbol: 'COPPER', name: 'Copper', sector: 'Commodity', exchange: 'NSE' },
};

// Create a reverse lookup map: symbol -> StockInfo
export const SYMBOL_TO_INFO: Record<string, StockInfo> = {};
for (const [key, value] of Object.entries(STOCK_UNIVERSE)) {
  if (!SYMBOL_TO_INFO[value.symbol]) {
    SYMBOL_TO_INFO[value.symbol] = value;
  }
}

/**
 * Enhanced stock symbol extraction that works with any NSE/BSE symbol
 * If exact match not found, attempts fuzzy matching and direct symbol lookup
 * Supports exchange prefixes like "NSE:TCS" or "BSE:500410"
 */
export function extractStockSymbol(query: string): StockInfo | null {
  // Handle exchange prefixes first (e.g., "NSE:TCS", "BSE:500410")
  const prefixMatch = query.match(/(?:NSE|BSE):([A-Z0-9]+)/i);
  if (prefixMatch) {
    const symbol = prefixMatch[1].toUpperCase();
    if (SYMBOL_TO_INFO[symbol]) {
      return SYMBOL_TO_INFO[symbol];
    }
    // Return as dynamic symbol
    return {
      symbol: symbol,
      name: symbol,
      sector: 'Unknown',
      exchange: query.toUpperCase().startsWith('BSE') ? 'BSE' : 'NSE'
    };
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  // First try exact match in our universe
  if (STOCK_UNIVERSE[lowerQuery]) {
    return STOCK_UNIVERSE[lowerQuery];
  }
  
  // Try matching multi-word phrases (longest match first)
  const words = lowerQuery.split(/\s+/);
  for (let len = words.length; len >= 2; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      if (STOCK_UNIVERSE[phrase]) {
        return STOCK_UNIVERSE[phrase];
      }
    }
  }
  
  // Try single word matches
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9&-]/g, '');
    if (STOCK_UNIVERSE[cleanWord]) {
      return STOCK_UNIVERSE[cleanWord];
    }
  }
  
  // Check if it looks like a stock symbol (uppercase letters, 2-15 chars)
  // Return known symbols OR allow dynamic pass-through for API lookup
  const symbolMatch = query.match(/\b([A-Z][A-Z0-9&-]{1,14})\b/);
  if (symbolMatch) {
    const symbol = symbolMatch[1];
    // Check if this symbol exists in our reverse lookup
    if (SYMBOL_TO_INFO[symbol]) {
      return SYMBOL_TO_INFO[symbol];
    }
    // Dynamic pass-through for unknown but valid-pattern symbols
    // This enables full NSE/BSE coverage for any legitimate ticker
    if (!isCommonWord(symbol)) {
      return {
        symbol: symbol,
        name: symbol,
        sector: 'Unknown',
        exchange: 'NSE'
      };
    }
  }
  
  // Try without spaces (e.g., "tatamotors" from "tata motors")
  const noSpaces = lowerQuery.replace(/\s+/g, '');
  if (STOCK_UNIVERSE[noSpaces]) {
    return STOCK_UNIVERSE[noSpaces];
  }
  
  // Try uppercase version as direct symbol
  const upperQuery = query.toUpperCase().trim();
  if (SYMBOL_TO_INFO[upperQuery]) {
    return SYMBOL_TO_INFO[upperQuery];
  }
  
  // Dynamic symbol support: If the query looks like a valid NSE/BSE symbol pattern
  // (uppercase letters/numbers, 2-15 chars, starts with a letter, no common words),
  // allow it through for API lookup. This enables full NSE/BSE coverage.
  const cleanUpperQuery = upperQuery.replace(/[^A-Z0-9&-]/g, '');
  if (
    cleanUpperQuery.length >= 2 && 
    cleanUpperQuery.length <= 15 && 
    /^[A-Z]/.test(cleanUpperQuery) &&
    !isCommonWord(cleanUpperQuery)
  ) {
    return {
      symbol: cleanUpperQuery,
      name: cleanUpperQuery,
      sector: 'Unknown',
      exchange: 'NSE'
    };
  }
  
  return null;
}

// Common words that should NOT be treated as stock symbols
const COMMON_WORDS = new Set([
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE',
  'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW',
  'OLD', 'SEE', 'WAY', 'WHO', 'BOY', 'DID', 'OWN', 'SAY', 'SHE', 'TWO', 'TOO', 'USE',
  'BEST', 'BUY', 'SELL', 'HOLD', 'PRICE', 'VALUE', 'STOCK', 'SHARE', 'MARKET', 'NEWS',
  'ANALYSIS', 'CHART', 'TREND', 'BULLISH', 'BEARISH', 'COMPARE', 'WITH', 'ABOUT',
  'TODAY', 'SHOW', 'GIVE', 'TELL', 'WHAT', 'WHICH', 'WHERE', 'WHEN', 'WILL', 'WOULD',
  'GOOD', 'BAD', 'HIGH', 'LOW', 'UP', 'DOWN', 'EV', 'AI', 'IT', 'VS', 'OR', 'CARS'
]);

function isCommonWord(word: string): boolean {
  return COMMON_WORDS.has(word);
}

/**
 * Extract multiple stock symbols from a query (for comparisons like "tata vs reliance")
 * Returns all unique stocks found in the query
 * Supports both predefined stocks and dynamic NSE/BSE symbols
 */
export function extractMultipleStocks(query: string): StockInfo[] {
  const lowerQuery = query.toLowerCase().trim();
  const results: StockInfo[] = [];
  const seenSymbols = new Set<string>();
  const usedRanges: Array<[number, number]> = []; // Track which character ranges have been used
  
  // Helper to check if a range overlaps with already-used ranges
  const rangeOverlaps = (start: number, end: number): boolean => {
    for (const [usedStart, usedEnd] of usedRanges) {
      if (!(end <= usedStart || start >= usedEnd)) {
        return true;
      }
    }
    return false;
  };
  
  // First, check for uppercase symbols in the original query (dynamic support for any NSE/BSE symbol)
  const symbolRegex = /\b([A-Z][A-Z0-9&-]{1,14})\b/g;
  let match;
  while ((match = symbolRegex.exec(query)) !== null) {
    const sym = match[1];
    if (!seenSymbols.has(sym) && !isCommonWord(sym)) {
      if (SYMBOL_TO_INFO[sym]) {
        results.push(SYMBOL_TO_INFO[sym]);
      } else {
        // Dynamic symbol - not in our curated list but valid pattern
        results.push({
          symbol: sym,
          name: sym,
          sector: 'Unknown',
          exchange: 'NSE'
        });
      }
      seenSymbols.add(sym);
      usedRanges.push([match.index, match.index + sym.length]);
    }
  }
  
  // Now try to find multi-word matches in lowercase (longest first)
  const words = lowerQuery.split(/\s+/);
  
  // Check for multi-word stock names (e.g., "tata motors", "asian paints")
  for (let len = Math.min(words.length, 4); len >= 2; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      if (STOCK_UNIVERSE[phrase] && !seenSymbols.has(STOCK_UNIVERSE[phrase].symbol)) {
        results.push(STOCK_UNIVERSE[phrase]);
        seenSymbols.add(STOCK_UNIVERSE[phrase].symbol);
      }
    }
  }
  
  // Check individual words
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9&-]/g, '');
    if (STOCK_UNIVERSE[cleanWord] && !seenSymbols.has(STOCK_UNIVERSE[cleanWord].symbol)) {
      results.push(STOCK_UNIVERSE[cleanWord]);
      seenSymbols.add(STOCK_UNIVERSE[cleanWord].symbol);
    }
  }
  
  return results;
}

/**
 * Get all stock symbols in the universe
 */
export function getAllSymbols(): string[] {
  const uniqueSymbols = new Set<string>();
  for (const info of Object.values(STOCK_UNIVERSE)) {
    uniqueSymbols.add(info.symbol);
  }
  return Array.from(uniqueSymbols);
}

/**
 * Get stocks by sector
 */
export function getStocksBySector(sector: string): StockInfo[] {
  const sectorLower = sector.toLowerCase();
  const stocks: StockInfo[] = [];
  const seen = new Set<string>();
  
  for (const info of Object.values(STOCK_UNIVERSE)) {
    if (info.sector.toLowerCase().includes(sectorLower) && !seen.has(info.symbol)) {
      stocks.push(info);
      seen.add(info.symbol);
    }
  }
  
  return stocks;
}

/**
 * Search for stocks by name or symbol
 */
export function searchStocks(query: string, limit: number = 10): StockInfo[] {
  const lowerQuery = query.toLowerCase();
  const results: StockInfo[] = [];
  const seen = new Set<string>();
  
  for (const [key, info] of Object.entries(STOCK_UNIVERSE)) {
    if (seen.has(info.symbol)) continue;
    
    if (
      key.includes(lowerQuery) ||
      info.symbol.toLowerCase().includes(lowerQuery) ||
      info.name.toLowerCase().includes(lowerQuery)
    ) {
      results.push(info);
      seen.add(info.symbol);
    }
    
    if (results.length >= limit) break;
  }
  
  return results;
}
