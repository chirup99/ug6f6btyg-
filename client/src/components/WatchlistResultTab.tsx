import React from "react";
import { Button } from "@/components/ui/button";
import {
  Clock,
  ExternalLink,
  Loader2,
  Newspaper,
  RefreshCw,
  TrendingUp,
  Plus,
  ChevronDown,
  Search,
  X,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface WatchlistStock {
  symbol: string;
  name: string;
  token: string;
  exchange: string;
  displayName: string;
  tradingSymbol: string;
}

interface WatchlistNewsItem {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}

interface WatchlistQuarterlyItem {
  quarter: string;
  revenue: string;
  net_profit: string;
  eps: string;
  change_percent: string;
  [key: string]: any;
}

interface WatchlistResultTabProps {
  watchlistSymbols: WatchlistStock[];
  selectedWatchlistSymbol: string;
  setSelectedWatchlistSymbol: (symbol: string) => void;
  watchlistNews: WatchlistNewsItem[];
  setWatchlistNews: (news: WatchlistNewsItem[]) => void;
  isWatchlistNewsLoading: boolean;
  setIsWatchlistNewsLoading: (loading: boolean) => void;
  allWatchlistQuarterlyData: { [symbol: string]: WatchlistQuarterlyItem[] };
  setAllWatchlistQuarterlyData: (fn: (prev: { [symbol: string]: WatchlistQuarterlyItem[] }) => { [symbol: string]: WatchlistQuarterlyItem[] }) => void;
  isWatchlistQuarterlyLoading: boolean;
  setIsWatchlistQuarterlyLoading: (loading: boolean) => void;
  searchResultsNewsSymbol: string | null;
  watchlistSearchQuery: string;
  setWatchlistSearchQuery: (q: string) => void;
  watchlistDropdownOpen: boolean;
  setWatchlistDropdownOpen: (open: boolean) => void;
  compareSymbols: string[];
  setCompareSymbols: (fn: string[] | ((prev: string[]) => string[])) => void;
  compareQuarterlyData: { [symbol: string]: any[] };
  compareNewsData: { [symbol: string]: any[] };
  compareAnalysisData: { [symbol: string]: any };
  compareLoading: boolean;
  compareAiInsights: string | null;
  setCompareAiInsights: (insights: string | null) => void;
  showCompareResults: boolean;
  setShowCompareResults: (show: boolean) => void;
  compareActiveTab: 'overview' | 'pnl' | 'balance' | 'metrics' | 'insights';
  setCompareActiveTab: (tab: 'overview' | 'pnl' | 'balance' | 'metrics' | 'insights') => void;
  showFullReport: boolean;
  setShowFullReport: (show: boolean) => void;
  fullReportLoading: boolean;
  fullReportData: { quarterly: any[]; annualFinancials: any; keyMetrics: any } | null;
  fullReportActiveTab: 'quarterly' | 'pnl' | 'balance' | 'metrics' | 'insights';
  setFullReportActiveTab: (tab: 'quarterly' | 'pnl' | 'balance' | 'metrics' | 'insights') => void;
  fullReportSymbol: string | null;
  nifty50Timeframe: string;
  setNifty50Timeframe: (tf: string) => void;
  niftyBankTimeframe: string;
  setNiftyBankTimeframe: (tf: string) => void;
  nifty50FormattedData: Array<{ time: string; price: number }>;
  niftyBankFormattedData: Array<{ time: string; price: number }>;
  isNifty50Loading: boolean;
  isNiftyBankLoading: boolean;
  getNifty50CurrentPrice: () => number;
  getNifty50Change: () => number;
  getNiftyBankCurrentPrice: () => number;
  getNiftyBankChange: () => number;
  addToWatchlist: (stock: WatchlistStock) => void;
  removeFromWatchlist: (symbol: string) => void;
  handleViewFullReport: (symbol: string) => void;
  handleCompareAnalysis: () => void;
  getWatchlistNewsRelativeTime: (publishedAt: string) => string;
}

export function WatchlistResultTab({
  watchlistSymbols,
  selectedWatchlistSymbol,
  setSelectedWatchlistSymbol,
  watchlistNews,
  setWatchlistNews,
  isWatchlistNewsLoading,
  setIsWatchlistNewsLoading,
  allWatchlistQuarterlyData,
  setAllWatchlistQuarterlyData,
  isWatchlistQuarterlyLoading,
  setIsWatchlistQuarterlyLoading,
  searchResultsNewsSymbol,
  watchlistSearchQuery,
  setWatchlistSearchQuery,
  watchlistDropdownOpen,
  setWatchlistDropdownOpen,
  compareSymbols,
  setCompareSymbols,
  compareQuarterlyData,
  compareNewsData,
  compareAnalysisData,
  compareLoading,
  compareAiInsights,
  setCompareAiInsights,
  showCompareResults,
  setShowCompareResults,
  compareActiveTab,
  setCompareActiveTab,
  showFullReport,
  setShowFullReport,
  fullReportLoading,
  fullReportData,
  fullReportActiveTab,
  setFullReportActiveTab,
  fullReportSymbol,
  nifty50Timeframe,
  setNifty50Timeframe,
  niftyBankTimeframe,
  setNiftyBankTimeframe,
  nifty50FormattedData,
  niftyBankFormattedData,
  isNifty50Loading,
  isNiftyBankLoading,
  getNifty50CurrentPrice,
  getNifty50Change,
  getNiftyBankCurrentPrice,
  getNiftyBankChange,
  addToWatchlist,
  removeFromWatchlist,
  handleViewFullReport,
  handleCompareAnalysis,
  getWatchlistNewsRelativeTime,
}: WatchlistResultTabProps) {
                                        const selectedStock = watchlistSymbols.find(s => s.symbol === selectedWatchlistSymbol);
                                        const cleanSymbolForNews = selectedWatchlistSymbol.replace(/^[A-Z]+:/i, '').replace('-EQ', '').replace('-BE', '');

  return (
                                          <div className="w-full space-y-4">
                                            <div className="flex gap-4 w-full">
                                            {/* Left Column - Index Charts + Watchlist */}
                                            <div className="flex-1 space-y-4">
                                              {/* NIFTY 50 Chart */}
                                              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                                                <div className="space-y-2">
                                                  <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-1">
                                                      <h4 className="text-sm font-semibold text-gray-200">NIFTY 50</h4>
                                                      <span className="text-xs text-green-400 flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                        Live
                                                      </span>
                                                    </div>
                                                    <div className="text-right">
                                                      <div className="text-sm font-mono text-gray-100">₹{getNifty50CurrentPrice().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                                      <div className={`text-xs flex items-center justify-end gap-0.5 ${getNifty50Change() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {getNifty50Change() >= 0 ? '▲' : '▼'} ₹{Math.abs(getNifty50Change()).toFixed(2)} ({((getNifty50Change() / (getNifty50CurrentPrice() - getNifty50Change())) * 100).toFixed(2)}%)
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    {['1D', '5D', '1M', '6M', '1Y'].map((tf) => (
                                                      <Button
                                                        key={tf}
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setNifty50Timeframe(tf)}
                                                        className={`px-1.5 py-0.5 text-xs h-6 ${nifty50Timeframe === tf ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`}
                                                      >
                                                        {tf}
                                                      </Button>
                                                    ))}
                                                  </div>

                                                  <div className="h-48 w-full bg-gray-800/30 rounded-lg p-2 overflow-hidden">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                      <AreaChart data={isNifty50Loading ? [] : nifty50FormattedData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                                                        <defs>
                                                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={getNifty50Change() >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor={getNifty50Change() >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                                          </linearGradient>
                                                        </defs>
                                                        <XAxis 
                                                          dataKey="time" 
                                                          axisLine={false}
                                                          tickLine={false}
                                                          tick={{ fontSize: 9, fill: '#64748b' }}
                                                          tickCount={5}
                                                          hide
                                                        />
                                                        <YAxis 
                                                          domain={['auto', 'auto']}
                                                          type="number"
                                                          axisLine={false}
                                                          tickLine={false}
                                                          hide
                                                        />
                                                        <Tooltip 
                                                          content={({ active, payload, label }) => {
                                                            if (!active || !payload || !payload.length) return null;
                                                            const value = payload[0].value;
                                                            return (
                                                              <div className="bg-slate-900 border border-slate-700 rounded-md p-2 shadow-xl flex items-center gap-2">
                                                                <span className="text-sm font-medium text-slate-100">
                                                                  ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                <div className="w-px h-4 bg-slate-700" />
                                                                <span className="text-xs text-slate-400">
                                                                  {label}
                                                                </span>
                                                              </div>
                                                            );
                                                          }}
                                                        />
                                                        <Area 
                                                          type="monotone" 
                                                          dataKey="price" 
                                                          stroke={getNifty50Change() >= 0 ? "#10b981" : "#ef4444"}
                                                          strokeWidth={2}
                                                          fillOpacity={1}
                                                          fill="url(#colorPrice)"
                                                          dot={false}
                                                          activeDot={{ r: 4, fill: getNifty50Change() >= 0 ? "#10b981" : "#ef4444", strokeWidth: 0 }}
                                                        />
                                                      </AreaChart>
                                                    </ResponsiveContainer>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Dynamic Watchlist Chart */}
                                              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                                                <div className="space-y-2">
                                                  <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-1">
                                                      <h4 className="text-sm font-semibold text-gray-200">
                                                        {watchlistSymbols.find(s => s.symbol === selectedWatchlistSymbol)?.displayName || selectedWatchlistSymbol.split(':').pop()?.replace('-EQ', '').replace('-BE', '')}
                                                      </h4>
                                                      <span className="text-xs text-green-400 flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                        Live
                                                      </span>
                                                    </div>
                                                    <div className="text-right">
                                                      <div className="text-sm font-mono text-gray-100">₹{getNiftyBankCurrentPrice().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                                      <div className={`text-xs flex items-center justify-end gap-0.5 ${getNiftyBankChange() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {getNiftyBankChange() >= 0 ? '▲' : '▼'} ₹{Math.abs(getNiftyBankChange()).toFixed(2)} ({((getNiftyBankChange() / (getNiftyBankCurrentPrice() - getNiftyBankChange())) * 100).toFixed(2)}%)
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    {['1D', '5D', '1M', '6M', '1Y'].map((tf) => (
                                                      <Button
                                                        key={tf}
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setNiftyBankTimeframe(tf)}
                                                        className={`px-1.5 py-0.5 text-xs h-6 ${niftyBankTimeframe === tf ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}`}
                                                      >
                                                        {tf}
                                                      </Button>
                                                    ))}
                                                  </div>

                                                  <div className="h-48 w-full bg-gray-800/30 rounded-lg p-2 overflow-hidden">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                      <AreaChart data={isNiftyBankLoading ? [] : niftyBankFormattedData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                                                        <defs>
                                                          <linearGradient id="colorPriceBank" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={getNiftyBankChange() >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor={getNiftyBankChange() >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                                          </linearGradient>
                                                        </defs>
                                                        <XAxis 
                                                          dataKey="time" 
                                                          axisLine={false}
                                                          tickLine={false}
                                                          tick={{ fontSize: 9, fill: '#64748b' }}
                                                          tickCount={5}
                                                          hide
                                                        />
                                                        <YAxis 
                                                          domain={['auto', 'auto']}
                                                          type="number"
                                                          axisLine={false}
                                                          tickLine={false}
                                                          hide
                                                        />
                                                        <Tooltip 
                                                          content={({ active, payload, label }) => {
                                                            if (!active || !payload || !payload.length) return null;
                                                            const value = payload[0].value;
                                                            return (
                                                              <div className="bg-slate-900 border border-slate-700 rounded-md p-2 shadow-xl flex items-center gap-2">
                                                                <span className="text-sm font-medium text-slate-100">
                                                                  ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                <div className="w-px h-4 bg-slate-700" />
                                                                <span className="text-xs text-slate-400">
                                                                  {label}
                                                                </span>
                                                              </div>
                                                            );
                                                          }}
                                                        />
                                                        <Area 
                                                          type="monotone" 
                                                          dataKey="price" 
                                                          stroke={getNiftyBankChange() >= 0 ? "#10b981" : "#ef4444"}
                                                          strokeWidth={2}
                                                          fillOpacity={1}
                                                          fill="url(#colorPriceBank)"
                                                          dot={false}
                                                          activeDot={{ r: 4, fill: getNiftyBankChange() >= 0 ? "#10b981" : "#ef4444", strokeWidth: 0 }}
                                                        />
                                                      </AreaChart>
                                                    </ResponsiveContainer>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* My Watchlist */}
                                              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                                                <div className="flex items-center justify-between mb-3">
                                                  <h4 className="text-sm font-medium text-gray-200">My Watchlist</h4>
                                                  <span className="text-xs text-gray-400">{watchlistSymbols.length} stocks</span>
                                                </div>

                                                {/* Add Stock Dropdown */}
                                                {(() => {
                                                  const PREDEFINED_STOCKS = [
                                                    { symbol: 'NIFTY50', displayName: 'NIFTY 50', name: 'Nifty 50 Index', token: '99926000', exchange: 'NSE', tradingSymbol: 'NIFTY50' },
                                                    { symbol: 'SENSEX', displayName: 'SENSEX', name: 'BSE Sensex Index', token: '99919000', exchange: 'BSE', tradingSymbol: 'SENSEX' },
                                                    { symbol: 'BANKNIFTY', displayName: 'BANKNIFTY', name: 'Bank Nifty Index', token: '99926009', exchange: 'NSE', tradingSymbol: 'BANKNIFTY' },
                                                    { symbol: 'CRUDEOIL', displayName: 'Crude Oil', name: 'Crude Oil MCX', token: '234230', exchange: 'MCX', tradingSymbol: 'CRUDEOIL' },
                                                    { symbol: 'GOLD', displayName: 'Gold', name: 'Gold MCX', token: '99920003', exchange: 'MCX', tradingSymbol: 'GOLD' },
                                                    { symbol: 'SILVER', displayName: 'Silver', name: 'Silver MCX', token: '99920004', exchange: 'MCX', tradingSymbol: 'SILVER' },
                                                    { symbol: 'ADANIENT-EQ', displayName: 'ADANIENT', name: 'Adani Enterprises', token: '25', exchange: 'NSE', tradingSymbol: 'ADANIENT-EQ' },
                                                    { symbol: 'ADANIPORTS-EQ', displayName: 'ADANIPORTS', name: 'Adani Ports & SEZ', token: '15083', exchange: 'NSE', tradingSymbol: 'ADANIPORTS-EQ' },
                                                    { symbol: 'APOLLOHOSP-EQ', displayName: 'APOLLOHOSP', name: 'Apollo Hospitals', token: '157', exchange: 'NSE', tradingSymbol: 'APOLLOHOSP-EQ' },
                                                    { symbol: 'ASIANPAINT-EQ', displayName: 'ASIANPAINT', name: 'Asian Paints', token: '236', exchange: 'NSE', tradingSymbol: 'ASIANPAINT-EQ' },
                                                    { symbol: 'AXISBANK-EQ', displayName: 'AXISBANK', name: 'Axis Bank', token: '5900', exchange: 'NSE', tradingSymbol: 'AXISBANK-EQ' },
                                                    { symbol: 'BAJAJ-AUTO-EQ', displayName: 'BAJAJ-AUTO', name: 'Bajaj Auto', token: '16669', exchange: 'NSE', tradingSymbol: 'BAJAJ-AUTO-EQ' },
                                                    { symbol: 'BAJFINANCE-EQ', displayName: 'BAJFINANCE', name: 'Bajaj Finance', token: '317', exchange: 'NSE', tradingSymbol: 'BAJFINANCE-EQ' },
                                                    { symbol: 'BAJAJFINSV-EQ', displayName: 'BAJAJFINSV', name: 'Bajaj Finserv', token: '16675', exchange: 'NSE', tradingSymbol: 'BAJAJFINSV-EQ' },
                                                    { symbol: 'BPCL-EQ', displayName: 'BPCL', name: 'BPCL', token: '526', exchange: 'NSE', tradingSymbol: 'BPCL-EQ' },
                                                    { symbol: 'BHARTIARTL-EQ', displayName: 'BHARTIARTL', name: 'Bharti Airtel', token: '10604', exchange: 'NSE', tradingSymbol: 'BHARTIARTL-EQ' },
                                                    { symbol: 'BRITANNIA-EQ', displayName: 'BRITANNIA', name: 'Britannia Industries', token: '547', exchange: 'NSE', tradingSymbol: 'BRITANNIA-EQ' },
                                                    { symbol: 'CIPLA-EQ', displayName: 'CIPLA', name: 'Cipla', token: '694', exchange: 'NSE', tradingSymbol: 'CIPLA-EQ' },
                                                    { symbol: 'COALINDIA-EQ', displayName: 'COALINDIA', name: 'Coal India', token: '20374', exchange: 'NSE', tradingSymbol: 'COALINDIA-EQ' },
                                                    { symbol: 'DIVISLAB-EQ', displayName: 'DIVISLAB', name: "Divi's Laboratories", token: '10940', exchange: 'NSE', tradingSymbol: 'DIVISLAB-EQ' },
                                                    { symbol: 'DRREDDY-EQ', displayName: 'DRREDDY', name: "Dr. Reddy's Laboratories", token: '881', exchange: 'NSE', tradingSymbol: 'DRREDDY-EQ' },
                                                    { symbol: 'EICHERMOT-EQ', displayName: 'EICHERMOT', name: 'Eicher Motors', token: '910', exchange: 'NSE', tradingSymbol: 'EICHERMOT-EQ' },
                                                    { symbol: 'GRASIM-EQ', displayName: 'GRASIM', name: 'Grasim Industries', token: '1232', exchange: 'NSE', tradingSymbol: 'GRASIM-EQ' },
                                                    { symbol: 'HCLTECH-EQ', displayName: 'HCLTECH', name: 'HCL Technologies', token: '7229', exchange: 'NSE', tradingSymbol: 'HCLTECH-EQ' },
                                                    { symbol: 'HDFCBANK-EQ', displayName: 'HDFCBANK', name: 'HDFC Bank', token: '1333', exchange: 'NSE', tradingSymbol: 'HDFCBANK-EQ' },
                                                    { symbol: 'HDFCLIFE-EQ', displayName: 'HDFCLIFE', name: 'HDFC Life', token: '467', exchange: 'NSE', tradingSymbol: 'HDFCLIFE-EQ' },
                                                    { symbol: 'HEROMOTOCO-EQ', displayName: 'HEROMOTOCO', name: 'Hero MotoCorp', token: '1348', exchange: 'NSE', tradingSymbol: 'HEROMOTOCO-EQ' },
                                                    { symbol: 'HINDALCO-EQ', displayName: 'HINDALCO', name: 'Hindalco Industries', token: '1363', exchange: 'NSE', tradingSymbol: 'HINDALCO-EQ' },
                                                    { symbol: 'HINDUNILVR-EQ', displayName: 'HINDUNILVR', name: 'Hindustan Unilever', token: '1394', exchange: 'NSE', tradingSymbol: 'HINDUNILVR-EQ' },
                                                    { symbol: 'ICICIBANK-EQ', displayName: 'ICICIBANK', name: 'ICICI Bank', token: '4963', exchange: 'NSE', tradingSymbol: 'ICICIBANK-EQ' },
                                                    { symbol: 'ITC-EQ', displayName: 'ITC', name: 'ITC', token: '1660', exchange: 'NSE', tradingSymbol: 'ITC-EQ' },
                                                    { symbol: 'INDUSINDBK-EQ', displayName: 'INDUSINDBK', name: 'IndusInd Bank', token: '5258', exchange: 'NSE', tradingSymbol: 'INDUSINDBK-EQ' },
                                                    { symbol: 'INFY-EQ', displayName: 'INFY', name: 'Infosys', token: '1594', exchange: 'NSE', tradingSymbol: 'INFY-EQ' },
                                                    { symbol: 'JSWSTEEL-EQ', displayName: 'JSWSTEEL', name: 'JSW Steel', token: '11723', exchange: 'NSE', tradingSymbol: 'JSWSTEEL-EQ' },
                                                    { symbol: 'KOTAKBANK-EQ', displayName: 'KOTAKBANK', name: 'Kotak Mahindra Bank', token: '1922', exchange: 'NSE', tradingSymbol: 'KOTAKBANK-EQ' },
                                                    { symbol: 'LT-EQ', displayName: 'LT', name: 'Larsen & Toubro', token: '11483', exchange: 'NSE', tradingSymbol: 'LT-EQ' },
                                                    { symbol: 'LTIM-EQ', displayName: 'LTIM', name: 'LTIMindtree', token: '17818', exchange: 'NSE', tradingSymbol: 'LTIM-EQ' },
                                                    { symbol: 'M&M-EQ', displayName: 'M&M', name: 'Mahindra & Mahindra', token: '2031', exchange: 'NSE', tradingSymbol: 'M&M-EQ' },
                                                    { symbol: 'MARUTI-EQ', displayName: 'MARUTI', name: 'Maruti Suzuki', token: '10999', exchange: 'NSE', tradingSymbol: 'MARUTI-EQ' },
                                                    { symbol: 'NESTLEIND-EQ', displayName: 'NESTLEIND', name: 'Nestlé India', token: '17963', exchange: 'NSE', tradingSymbol: 'NESTLEIND-EQ' },
                                                    { symbol: 'NTPC-EQ', displayName: 'NTPC', name: 'NTPC', token: '11630', exchange: 'NSE', tradingSymbol: 'NTPC-EQ' },
                                                    { symbol: 'ONGC-EQ', displayName: 'ONGC', name: 'ONGC', token: '2475', exchange: 'NSE', tradingSymbol: 'ONGC-EQ' },
                                                    { symbol: 'POWERGRID-EQ', displayName: 'POWERGRID', name: 'Power Grid Corporation', token: '14977', exchange: 'NSE', tradingSymbol: 'POWERGRID-EQ' },
                                                    { symbol: 'RELIANCE-EQ', displayName: 'RELIANCE', name: 'Reliance Industries', token: '2885', exchange: 'NSE', tradingSymbol: 'RELIANCE-EQ' },
                                                    { symbol: 'SBILIFE-EQ', displayName: 'SBILIFE', name: 'SBI Life Insurance', token: '21808', exchange: 'NSE', tradingSymbol: 'SBILIFE-EQ' },
                                                    { symbol: 'SBIN-EQ', displayName: 'SBIN', name: 'State Bank of India', token: '3045', exchange: 'NSE', tradingSymbol: 'SBIN-EQ' },
                                                    { symbol: 'SUNPHARMA-EQ', displayName: 'SUNPHARMA', name: 'Sun Pharma', token: '3351', exchange: 'NSE', tradingSymbol: 'SUNPHARMA-EQ' },
                                                    { symbol: 'TCS-EQ', displayName: 'TCS', name: 'Tata Consultancy Services', token: '11536', exchange: 'NSE', tradingSymbol: 'TCS-EQ' },
                                                    { symbol: 'TATACONSUM-EQ', displayName: 'TATACONSUM', name: 'Tata Consumer Products', token: '3432', exchange: 'NSE', tradingSymbol: 'TATACONSUM-EQ' },
                                                    { symbol: 'TATAMOTORS-EQ', displayName: 'TATAMOTORS', name: 'Tata Motors', token: '3456', exchange: 'NSE', tradingSymbol: 'TATAMOTORS-EQ' },
                                                    { symbol: 'TATASTEEL-EQ', displayName: 'TATASTEEL', name: 'Tata Steel', token: '3499', exchange: 'NSE', tradingSymbol: 'TATASTEEL-EQ' },
                                                    { symbol: 'TECHM-EQ', displayName: 'TECHM', name: 'Tech Mahindra', token: '13538', exchange: 'NSE', tradingSymbol: 'TECHM-EQ' },
                                                    { symbol: 'TITAN-EQ', displayName: 'TITAN', name: 'Titan Company', token: '3506', exchange: 'NSE', tradingSymbol: 'TITAN-EQ' },
                                                    { symbol: 'ULTRACEMCO-EQ', displayName: 'ULTRACEMCO', name: 'UltraTech Cement', token: '11532', exchange: 'NSE', tradingSymbol: 'ULTRACEMCO-EQ' },
                                                    { symbol: 'UPL-EQ', displayName: 'UPL', name: 'UPL', token: '3691', exchange: 'NSE', tradingSymbol: 'UPL-EQ' },
                                                    { symbol: 'WIPRO-EQ', displayName: 'WIPRO', name: 'Wipro', token: '3787', exchange: 'NSE', tradingSymbol: 'WIPRO-EQ' },
                                                    { symbol: 'ACC-EQ', displayName: 'ACC', name: 'ACC', token: '22', exchange: 'NSE', tradingSymbol: 'ACC-EQ' },
                                                    { symbol: 'ADANIGREEN-EQ', displayName: 'ADANIGREEN', name: 'Adani Green Energy', token: '25', exchange: 'NSE', tradingSymbol: 'ADANIGREEN-EQ' },
                                                    { symbol: 'ADANITOTALGAS-EQ', displayName: 'ADANITOTALGAS', name: 'Adani Total Gas', token: '6731', exchange: 'NSE', tradingSymbol: 'ADANITOTALGAS-EQ' },
                                                    { symbol: 'AMBUJACEM-EQ', displayName: 'AMBUJACEM', name: 'Ambuja Cements', token: '1270', exchange: 'NSE', tradingSymbol: 'AMBUJACEM-EQ' },
                                                    { symbol: 'ABB-EQ', displayName: 'ABB', name: 'ABB India', token: '13', exchange: 'NSE', tradingSymbol: 'ABB-EQ' },
                                                    { symbol: 'APOLLOTYRE-EQ', displayName: 'APOLLOTYRE', name: 'Apollo Tyres', token: '163', exchange: 'NSE', tradingSymbol: 'APOLLOTYRE-EQ' },
                                                    { symbol: 'DMART-EQ', displayName: 'DMART', name: 'Avenue Supermarts (DMart)', token: '4849', exchange: 'NSE', tradingSymbol: 'DMART-EQ' },
                                                    { symbol: 'BAJAJHLDNG-EQ', displayName: 'BAJAJHLDNG', name: 'Bajaj Holdings & Investment', token: '16', exchange: 'NSE', tradingSymbol: 'BAJAJHLDNG-EQ' },
                                                    { symbol: 'BANKBARODA-EQ', displayName: 'BANKBARODA', name: 'Bank of Baroda', token: '4668', exchange: 'NSE', tradingSymbol: 'BANKBARODA-EQ' },
                                                    { symbol: 'BERGEPAINT-EQ', displayName: 'BERGEPAINT', name: 'Berger Paints', token: '404', exchange: 'NSE', tradingSymbol: 'BERGEPAINT-EQ' },
                                                    { symbol: 'BEL-EQ', displayName: 'BEL', name: 'Bharat Electronics', token: '383', exchange: 'NSE', tradingSymbol: 'BEL-EQ' },
                                                    { symbol: 'BIOCON-EQ', displayName: 'BIOCON', name: 'Biocon', token: '12490', exchange: 'NSE', tradingSymbol: 'BIOCON-EQ' },
                                                    { symbol: 'BOSCHLTD-EQ', displayName: 'BOSCHLTD', name: 'Bosch', token: '509', exchange: 'NSE', tradingSymbol: 'BOSCHLTD-EQ' },
                                                    { symbol: 'CHOLAFIN-EQ', displayName: 'CHOLAFIN', name: 'Cholamandalam Investment & Finance', token: '685', exchange: 'NSE', tradingSymbol: 'CHOLAFIN-EQ' },
                                                    { symbol: 'COLPAL-EQ', displayName: 'COLPAL', name: 'Colgate-Palmolive India', token: '2955', exchange: 'NSE', tradingSymbol: 'COLPAL-EQ' },
                                                    { symbol: 'DLF-EQ', displayName: 'DLF', name: 'DLF', token: '14732', exchange: 'NSE', tradingSymbol: 'DLF-EQ' },
                                                    { symbol: 'DABUR-EQ', displayName: 'DABUR', name: 'Dabur India', token: '772', exchange: 'NSE', tradingSymbol: 'DABUR-EQ' },
                                                    { symbol: 'NYKAA-EQ', displayName: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', token: '6390', exchange: 'NSE', tradingSymbol: 'NYKAA-EQ' },
                                                    { symbol: 'GAIL-EQ', displayName: 'GAIL', name: 'GAIL India', token: '1209', exchange: 'NSE', tradingSymbol: 'GAIL-EQ' },
                                                    { symbol: 'GLAND-EQ', displayName: 'GLAND', name: 'Gland Pharma', token: '5552', exchange: 'NSE', tradingSymbol: 'GLAND-EQ' },
                                                    { symbol: 'GODREJCP-EQ', displayName: 'GODREJCP', name: 'Godrej Consumer Products', token: '10099', exchange: 'NSE', tradingSymbol: 'GODREJCP-EQ' },
                                                    { symbol: 'HAVELLS-EQ', displayName: 'HAVELLS', name: 'Havells India', token: '2181', exchange: 'NSE', tradingSymbol: 'HAVELLS-EQ' },
                                                    { symbol: 'HDFCAMC-EQ', displayName: 'HDFCAMC', name: 'HDFC AMC', token: '4244', exchange: 'NSE', tradingSymbol: 'HDFCAMC-EQ' },
                                                    { symbol: 'HAL-EQ', displayName: 'HAL', name: 'Hindustan Aeronautics', token: '541154', exchange: 'NSE', tradingSymbol: 'HAL-EQ' },
                                                    { symbol: 'ICICIGI-EQ', displayName: 'ICICIGI', name: 'ICICI Lombard', token: '15083', exchange: 'NSE', tradingSymbol: 'ICICIGI-EQ' },
                                                    { symbol: 'ICICIPRULI-EQ', displayName: 'ICICIPRULI', name: 'ICICI Prudential Life', token: '467', exchange: 'NSE', tradingSymbol: 'ICICIPRULI-EQ' },
                                                    { symbol: 'INDHOTEL-EQ', displayName: 'INDHOTEL', name: 'Indian Hotels Company', token: '1512', exchange: 'NSE', tradingSymbol: 'INDHOTEL-EQ' },
                                                    { symbol: 'IOC-EQ', displayName: 'IOC', name: 'Indian Oil Corporation', token: '1624', exchange: 'NSE', tradingSymbol: 'IOC-EQ' },
                                                    { symbol: 'IRCTC-EQ', displayName: 'IRCTC', name: 'IRCTC', token: '13611', exchange: 'NSE', tradingSymbol: 'IRCTC-EQ' },
                                                    { symbol: 'INDUSTOWER-EQ', displayName: 'INDUSTOWER', name: 'Indus Towers', token: '7984', exchange: 'NSE', tradingSymbol: 'INDUSTOWER-EQ' },
                                                    { symbol: 'NAUKRI-EQ', displayName: 'NAUKRI', name: 'Info Edge (Naukri)', token: '13751', exchange: 'NSE', tradingSymbol: 'NAUKRI-EQ' },
                                                    { symbol: 'INDIGO-EQ', displayName: 'INDIGO', name: 'InterGlobe Aviation (IndiGo)', token: '11195', exchange: 'NSE', tradingSymbol: 'INDIGO-EQ' },
                                                    { symbol: 'LICI-EQ', displayName: 'LICI', name: 'LIC (Life Insurance Corporation)', token: '543526', exchange: 'NSE', tradingSymbol: 'LICI-EQ' },
                                                    { symbol: 'MARICO-EQ', displayName: 'MARICO', name: 'Marico', token: '4067', exchange: 'NSE', tradingSymbol: 'MARICO-EQ' },
                                                    { symbol: 'MPHASIS-EQ', displayName: 'MPHASIS', name: 'Mphasis', token: '4406', exchange: 'NSE', tradingSymbol: 'MPHASIS-EQ' },
                                                    { symbol: 'MUTHOOTFIN-EQ', displayName: 'MUTHOOTFIN', name: 'Muthoot Finance', token: '3263', exchange: 'NSE', tradingSymbol: 'MUTHOOTFIN-EQ' },
                                                    { symbol: 'PAYTM-EQ', displayName: 'PAYTM', name: 'One97 Communications (Paytm)', token: '6705', exchange: 'NSE', tradingSymbol: 'PAYTM-EQ' },
                                                    { symbol: 'PIIND-EQ', displayName: 'PIIND', name: 'PI Industries', token: '2824', exchange: 'NSE', tradingSymbol: 'PIIND-EQ' },
                                                    { symbol: 'PIDILITIND-EQ', displayName: 'PIDILITIND', name: 'Pidilite Industries', token: '2664', exchange: 'NSE', tradingSymbol: 'PIDILITIND-EQ' },
                                                    { symbol: 'PGHH-EQ', displayName: 'PGHH', name: 'P&G Hygiene & Health Care', token: '2855', exchange: 'NSE', tradingSymbol: 'PGHH-EQ' },
                                                    { symbol: 'SBICARD-EQ', displayName: 'SBICARD', name: 'SBI Cards & Payment Services', token: '10916', exchange: 'NSE', tradingSymbol: 'SBICARD-EQ' },
                                                    { symbol: 'SRF-EQ', displayName: 'SRF', name: 'SRF', token: '3273', exchange: 'NSE', tradingSymbol: 'SRF-EQ' },
                                                    { symbol: 'MOTHERSON-EQ', displayName: 'MOTHERSON', name: 'Samvardhana Motherson', token: '4204', exchange: 'NSE', tradingSymbol: 'MOTHERSON-EQ' },
                                                    { symbol: 'SHREECEM-EQ', displayName: 'SHREECEM', name: 'Shree Cement', token: '3103', exchange: 'NSE', tradingSymbol: 'SHREECEM-EQ' },
                                                    { symbol: 'SIEMENS-EQ', displayName: 'SIEMENS', name: 'Siemens India', token: '3144', exchange: 'NSE', tradingSymbol: 'SIEMENS-EQ' },
                                                    { symbol: 'TATAPOWER-EQ', displayName: 'TATAPOWER', name: 'Tata Power', token: '3426', exchange: 'NSE', tradingSymbol: 'TATAPOWER-EQ' },
                                                    { symbol: 'TORNTPHARM-EQ', displayName: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', token: '3518', exchange: 'NSE', tradingSymbol: 'TORNTPHARM-EQ' },
                                                    { symbol: 'UNITDSPR-EQ', displayName: 'UNITDSPR', name: 'United Spirits', token: '3574', exchange: 'NSE', tradingSymbol: 'UNITDSPR-EQ' },
                                                    { symbol: 'VEDL-EQ', displayName: 'VEDL', name: 'Vedanta', token: '3063', exchange: 'NSE', tradingSymbol: 'VEDL-EQ' },
                                                    { symbol: 'ZOMATO-EQ', displayName: 'ZOMATO', name: 'Zomato', token: '5165', exchange: 'NSE', tradingSymbol: 'ZOMATO-EQ' },
                                                  ];
                                                  const filteredStocks = PREDEFINED_STOCKS.filter(s => {
                                                    const q = watchlistSearchQuery.toLowerCase();
                                                    return !q || s.displayName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
                                                  });
                                                  const alreadyAdded = new Set(watchlistSymbols.map(s => s.symbol));
                                                  return (
                                                    <div className="relative mb-3">
                                                      <button
                                                        onClick={() => {
                                                          setWatchlistDropdownOpen(!watchlistDropdownOpen);
                                                          setWatchlistSearchQuery('');
                                                        }}
                                                        className="w-full h-8 flex items-center justify-between px-3 bg-gray-800 border border-gray-600 rounded-md text-xs text-gray-400 hover:border-gray-500 transition-colors"
                                                        data-testid="button-watchlist-dropdown-toggle"
                                                      >
                                                        <span className="flex items-center gap-2">
                                                          <Plus className="h-3.5 w-3.5" />
                                                          Add stock to watchlist...
                                                        </span>
                                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${watchlistDropdownOpen ? 'rotate-180' : ''}`} />
                                                      </button>
                                                      {watchlistDropdownOpen && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg z-50 shadow-xl">
                                                          <div className="p-2 border-b border-gray-700">
                                                            <div className="relative">
                                                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                                                              <input
                                                                autoFocus
                                                                placeholder="Search stocks..."
                                                                value={watchlistSearchQuery}
                                                                onChange={e => setWatchlistSearchQuery(e.target.value)}
                                                                className="w-full h-7 pl-7 pr-3 text-xs bg-gray-900 border border-gray-600 rounded text-gray-200 placeholder:text-gray-500 outline-none focus:border-blue-500"
                                                                data-testid="input-watchlist-dropdown-search"
                                                              />
                                                            </div>
                                                          </div>
                                                          <div className="max-h-52 overflow-y-auto">
                                                            {filteredStocks.length === 0 ? (
                                                              <div className="px-3 py-4 text-center text-xs text-gray-500">No results found</div>
                                                            ) : filteredStocks.map((stock, idx) => {
                                                              const added = alreadyAdded.has(stock.symbol);
                                                              return (
                                                                <button
                                                                  key={stock.symbol}
                                                                  disabled={added}
                                                                  onClick={() => {
                                                                    if (!added) {
                                                                      addToWatchlist(stock);
                                                                      setWatchlistDropdownOpen(false);
                                                                      setWatchlistSearchQuery('');
                                                                    }
                                                                  }}
                                                                  className={`w-full flex items-center justify-between px-3 py-2 border-b border-gray-700 last:border-b-0 transition-colors text-left ${added ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-700/60 cursor-pointer'}`}
                                                                  data-testid={`watchlist-dropdown-item-${idx}`}
                                                                >
                                                                  <div className="min-w-0">
                                                                    <div className="text-xs font-medium text-gray-200">{stock.displayName}</div>
                                                                    <div className="text-xs text-gray-500 truncate">{stock.name}</div>
                                                                  </div>
                                                                  <div className="ml-2 shrink-0">
                                                                    {added ? (
                                                                      <span className="text-xs text-green-500">Added</span>
                                                                    ) : (
                                                                      <Plus className="h-3.5 w-3.5 text-gray-500" />
                                                                    )}
                                                                  </div>
                                                                </button>
                                                              );
                                                            })}
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })()}

                                                {/* Watchlist Items */}
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                  {watchlistSymbols.map((stock, idx) => (
                                                    <div
                                                      key={stock.symbol}
                                                      className={`flex items-center justify-start px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                                                        selectedWatchlistSymbol === stock.symbol 
                                                          ? 'bg-blue-600/30 border border-blue-500/50' 
                                                          : 'hover:bg-gray-700/50'
                                                      }`}
                                                      onClick={() => setSelectedWatchlistSymbol(stock.symbol)}
                                                      data-testid={`watchlist-item-${idx}`}
                                                    >
                                                      <div className="flex items-center justify-between w-full">
                                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                          selectedWatchlistSymbol === stock.symbol ? 'bg-blue-400' : 'bg-gray-500'
                                                        }`} />
                                                        <div>
                                                          <div className="text-xs font-medium text-gray-200">{stock.displayName || stock.symbol.replace('-EQ', '')}</div>
                                                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{stock.name}</div>
                                                        </div>
                                                      </div>
                                                      </div>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          removeFromWatchlist(stock.symbol);
                                                        }}
                                                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                                        data-testid={`button-remove-watchlist-${idx}`}
                                                      >
                                                        <X className="h-3 w-3" />
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Right Column - Related News */}
                                            <div className="flex-1 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                              <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                  <h3 className="text-sm font-medium text-gray-200 mt-[0px] mb-[0px] truncate leading-none">
                                                    Related News for {cleanSymbolForNews}
                                                  </h3>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1.5 shrink-0 px-2"
                                                  onClick={() => {
                                                    setIsWatchlistNewsLoading(true);
                                                    fetch(`/api/stock-news/${cleanSymbolForNews}?refresh=${Date.now()}`)
                                                      .then(res => res.json())
                                                      .then(data => {
                                                        const newsItems = Array.isArray(data) ? data : (data.news || []);
                                                        setWatchlistNews(newsItems.slice(0, 20));
                                                      })
                                                      .finally(() => setIsWatchlistNewsLoading(false));
                                                  }}
                                                  data-testid="button-refresh-news"
                                                >
                                                  <RefreshCw className={`h-3 w-3 ${isWatchlistNewsLoading ? 'animate-spin' : ''}`} />
                                                  <span className="leading-none">Refresh</span>
                                                </Button>
                                              </div>

                                              <div className="space-y-3 max-h-[320px] overflow-y-auto mb-4">
                                                {isWatchlistNewsLoading ? (
                                                  <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                                  </div>
                                                ) : watchlistNews.length > 0 ? (
                                                  watchlistNews.map((item, index) => (
                                                    <div 
                                                      key={index} 
                                                      className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer border border-gray-700"
                                                      onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                                                      data-testid={`news-item-${index}`}
                                                    >
                                                      <h4 className="text-gray-200 font-medium text-sm mb-2 hover:text-gray-100 transition-colors line-clamp-2">
                                                        {item.title} <ExternalLink className="h-3 w-3 inline ml-1" />
                                                      </h4>
                                                      {item.description && (
                                                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{item.description}</p>
                                                      )}
                                                      <div className="flex items-center justify-between">
                                                        <span className="text-gray-500 text-xs">{item.source}</span>
                                                        <span className="text-gray-500 text-xs">{getWatchlistNewsRelativeTime(item.publishedAt)}</span>
                                                      </div>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <div className="text-center py-8 text-gray-500">
                                                    <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No news available for {cleanSymbolForNews}</p>
                                                    <p className="text-xs mt-1">Select a stock from the watchlist</p>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Quarterly Results for Selected Stock Only */}
                                              <div className="border-t border-gray-700 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                  <div className="flex items-center gap-2 min-w-0">
                                                    <TrendingUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                    <h3 className="text-sm font-medium text-gray-200 mt-[0px] mb-[0px] truncate leading-none">
                                                      Quarterly Performance Trend <span className="text-xs text-gray-500 ml-1">(Net profit)</span>
                                                    </h3>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    {searchResultsNewsSymbol && (
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                          setIsWatchlistQuarterlyLoading(true);
                                                          try {
                                                            const cleanSymbol = searchResultsNewsSymbol.replace(/^[A-Z]+:/i, '').replace("-EQ", "").replace("-BE", "");
                                                            const response = await fetch(`/api/quarterly-results/${cleanSymbol}`);
                                                            if (response.ok) {
                                                              const data = await response.json();
                                                              setAllWatchlistQuarterlyData(prev => ({
                                                                ...prev,
                                                                [searchResultsNewsSymbol]: data.results || []
                                                              }));
                                                            }
                                                          } catch (error) {
                                                            console.error("Error refreshing quarterly data:", error);
                                                          } finally {
                                                            setIsWatchlistQuarterlyLoading(false);
                                                          }
                                                        }}
                                                        data-testid="button-refresh-quarterly"
                                                        className="h-7 px-2 flex items-center justify-center shrink-0"
                                                      >
                                                        <RefreshCw className={`h-3 w-3 ${isWatchlistQuarterlyLoading ? "animate-spin" : ""}`} />
                                                      </Button>
                                                    )}
                                                    {(() => {
                                                      if (!searchResultsNewsSymbol) return null;
                                                      const quarterlyData = allWatchlistQuarterlyData[searchResultsNewsSymbol] || [];
                                                      const hasTrendingUp = quarterlyData.length > 1 && 
                                                        parseFloat(quarterlyData[quarterlyData.length - 1]?.change_percent || '0') >= 0;
                                                      return (
                                                        <span className={`text-xs px-2 py-1 rounded ${hasTrendingUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                          {hasTrendingUp ? '↑ Uptrend' : '↓ Downtrend'}
                                                        </span>
                                                      );
                                                    })()}
                                                  </div>
                                                </div>

                                                <div className="space-y-1">
                                                  {isWatchlistQuarterlyLoading ? (
                                                    <div className="flex items-center justify-center py-8">
                                                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                                    </div>
                                                  ) : searchResultsNewsSymbol ? (() => {
                                                    const quarterlyData = allWatchlistQuarterlyData[searchResultsNewsSymbol] || [];
                                                    // Don't show loading state if we have data
                                                    // The isWatchlistQuarterlyLoading at the top already handles the loading indicator
                                                    if (!quarterlyData || quarterlyData.length === 0) {
                                                      // Check if still loading, otherwise show no data message
                                                      if (isWatchlistQuarterlyLoading) {
                                                        return (
                                                          <div className="text-center py-8 text-gray-500">
                                                            <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto mb-2" />
                                                            <p className="text-xs">Loading quarterly results...</p>
                                                          </div>
                                                        );
                                                      }
                                                      return (
                                                        <div className="text-center py-4 text-gray-500 text-xs">
                                                          No quarterly data available
                                                        </div>
                                                      );
                                                    }
                                                    const hasTrendingUp = quarterlyData.length > 1 && 
                                                      parseFloat(quarterlyData[quarterlyData.length - 1]?.change_percent || '0') >= 0;

                                                    const chartData = quarterlyData.map((q: any) => ({
                                                      quarter: q.quarter,
                                                      value: parseFloat((q.net_profit || q.revenue || '0').toString().replace(/,/g, '')) || 0,
                                                      changePercent: parseFloat((q.change_percent || '0').toString()) || 0,
                                                      isPositive: parseFloat((q.net_profit || q.revenue || '0').toString().replace(/,/g, '')) >= 0
                                                    }));

                                                    const trendColor = hasTrendingUp ? '#22c55e' : '#ef4444';

                                                    return quarterlyData.length > 0 ? (
                                                      <>
                                                        <div className="h-40 w-full mb-3">
                                                          <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                                              <defs>
                                                                <linearGradient id={`grad-${searchResultsNewsSymbol}`} x1="0" y1="0" x2="0" y2="1">
                                                                  <stop offset="0%" stopColor={trendColor} stopOpacity={0.4} />
                                                                  <stop offset="100%" stopColor={trendColor} stopOpacity={0.05} />
                                                                </linearGradient>
                                                              </defs>
                                                              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                                              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K Cr`} axisLine={false} tickLine={false} />
                                                              <Tooltip 
                                                                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', fontSize: '11px' }}
                                                                formatter={(value: any) => [`₹${Number(value).toLocaleString()} Cr`, 'Net Profit']}
                                                              />
                                                              <Area 
                                                                type="monotone" 
                                                                dataKey="value" 
                                                                stroke={trendColor} 
                                                                strokeWidth={2} 
                                                                fill={`url(#grad-${searchResultsNewsSymbol})`}
                                                                dot={{ r: 5, stroke: trendColor, strokeWidth: 2, fill: '#1f2937' }}
                                                                activeDot={{ r: 7, stroke: trendColor, strokeWidth: 2, fill: '#ffffff' }}
                                                              />
                                                            </AreaChart>
                                                          </ResponsiveContainer>
                                                        </div>
                                                        <div className="flex justify-center gap-4 text-xs text-gray-400 mb-2">
                                                          <span className="flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Positive Quarter
                                                          </span>
                                                          <span className="flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Negative Quarter
                                                          </span>
                                                        </div>
                                                        {/* PDF Links for Deep Analysis */}
                                                        {quarterlyData.some((q: any) => q.pdf_url) && (
                                                          <div className="mt-3 pt-3 border-t border-gray-700">
                                                            <div className="flex items-center justify-between mb-2">
                                                              <span className="text-xs font-medium text-gray-400">Quarterly Results PDFs</span>
                                                              <button
                                                                onClick={() => {
                                                                  const symbol = searchResultsNewsSymbol || selectedWatchlistSymbol;
                                                                  if (symbol) {
                                                                    handleViewFullReport(symbol);
                                                                  }
                                                                }}
                                                                className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                                                                data-testid="button-ai-full-report"
                                                              >
                                                                View Full Report
                                                              </button>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                              {quarterlyData.slice(-4).map((q: any, idx: number) => 
                                                                q.pdf_url && (
                                                                  <a
                                                                    key={idx}
                                                                    href={q.pdf_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300"
                                                                    data-testid={`link-pdf-${idx}`}
                                                                  >
                                                                    <FileText className="h-3 w-3" />
                                                                    {q.quarter}
                                                                  </a>
                                                                )
                                                              )}
                                                            </div>
                                                          </div>
                                                        )}
                                                      </>
                                                    ) : (
                                                      <div className="text-center py-4 text-gray-500 text-xs">
                                                        No quarterly data available
                                                      </div>
                                                    );
                                                  })() : (
                                                    <div className="text-center py-8 text-gray-500">
                                                      <TrendingUp className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                      <p className="text-xs">Search for a stock to see quarterly results</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* ── Full Report Panel ── */}
                                          {showFullReport && (
                                            <div className="w-full rounded-xl border border-blue-700/40 bg-gray-900/80 overflow-hidden">
                                              {/* Header */}
                                              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
                                                <div className="flex items-center gap-2">
                                                  <FileText className="h-4 w-4 text-blue-400" />
                                                  <span className="text-sm font-semibold text-gray-200">
                                                    Full Report{fullReportSymbol ? ` — ${fullReportSymbol}` : ''}
                                                  </span>
                                                </div>
                                                <button
                                                  onClick={() => setShowFullReport(false)}
                                                  className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700/50 transition-colors"
                                                  data-testid="button-close-full-report"
                                                >Close</button>
                                              </div>

                                              {fullReportLoading ? (
                                                <div className="flex flex-col items-center justify-center py-12">
                                                  <Loader2 className="h-6 w-6 animate-spin text-blue-400 mb-3" />
                                                  <p className="text-xs text-gray-400">Fetching latest financial data…</p>
                                                </div>
                                              ) : fullReportData ? (() => {
                                                const frTabs = [
                                                  { id: 'quarterly', label: 'Quarterly' },
                                                  { id: 'pnl',       label: 'P&L Statement' },
                                                  { id: 'balance',   label: 'Balance Sheet' },
                                                  { id: 'metrics',   label: 'Key Metrics' },
                                                  { id: 'insights',  label: '✦ Insights' },
                                                ] as const;

                                                const km = fullReportData.keyMetrics;
                                                const af = fullReportData.annualFinancials;
                                                const qd = fullReportData.quarterly;

                                                // Quarterly chart data
                                                const frChartData = qd.map((q: any) => ({
                                                  quarter: q.quarter,
                                                  value: parseFloat((q.net_profit || q.revenue || '0').toString().replace(/,/g, '')) || 0,
                                                  isPositive: parseFloat((q.net_profit || q.revenue || '0').toString().replace(/,/g, '')) >= 0,
                                                }));

                                                const frHasTrend = frChartData.length > 1;
                                                const frLatest  = frHasTrend ? frChartData[frChartData.length - 1].value : 0;
                                                const frPrev    = frHasTrend ? frChartData[frChartData.length - 2].value : 0;
                                                const frTrendUp = frLatest >= frPrev;
                                                const frColor   = frTrendUp ? '#22c55e' : '#ef4444';

                                                // AI insight calculations
                                                const profits = qd.map((q: any) => parseFloat((q.net_profit || '0').toString().replace(/,/g, ''))).filter(Boolean);
                                                const profitGrowth = profits.length > 1
                                                  ? ((profits[profits.length - 1] - profits[0]) / Math.abs(profits[0])) * 100
                                                  : null;
                                                const recentTrend = profits.length > 1
                                                  ? profits[profits.length - 1] > profits[profits.length - 2] ? 'improving' : 'declining'
                                                  : null;

                                                return (
                                                  <div>
                                                    {/* Tab bar */}
                                                    <div className="flex border-b border-gray-700/60 px-4 pt-3 gap-1 overflow-x-auto">
                                                      {frTabs.map(tab => (
                                                        <button
                                                          key={tab.id}
                                                          onClick={() => setFullReportActiveTab(tab.id)}
                                                          className={`px-3 py-1.5 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                                                            fullReportActiveTab === tab.id
                                                              ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500'
                                                              : 'text-gray-500 hover:text-gray-300'
                                                          }`}
                                                        >{tab.label}</button>
                                                      ))}
                                                    </div>

                                                    <div className="px-4 pt-4 pb-5 space-y-4">

                                                      {/* QUARTERLY TAB */}
                                                      {fullReportActiveTab === 'quarterly' && (
                                                        <div>
                                                          <div className="flex items-center gap-2 mb-3">
                                                            <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                                                            <span className="text-xs font-semibold text-gray-300">Quarterly Net Profit (₹ Cr)</span>
                                                            {frHasTrend && (
                                                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${frTrendUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {frTrendUp ? '↑ Uptrend' : '↓ Downtrend'}
                                                              </span>
                                                            )}
                                                          </div>
                                                          {frChartData.length > 0 ? (
                                                            <>
                                                              <div className="h-44 w-full mb-3">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                  <AreaChart data={frChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                                                    <defs>
                                                                      <linearGradient id="fr-grad" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor={frColor} stopOpacity={0.4} />
                                                                        <stop offset="100%" stopColor={frColor} stopOpacity={0.05} />
                                                                      </linearGradient>
                                                                    </defs>
                                                                    <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                                                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                                                                    <Tooltip
                                                                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', fontSize: '11px' }}
                                                                      formatter={(v: any) => [`₹${Number(v).toLocaleString()} Cr`, 'Net Profit']}
                                                                    />
                                                                    <Area type="monotone" dataKey="value" stroke={frColor} strokeWidth={2} fill="url(#fr-grad)" dot={{ r: 4, stroke: frColor, strokeWidth: 2, fill: '#1f2937' }} activeDot={{ r: 6, stroke: frColor, strokeWidth: 2, fill: '#fff' }} />
                                                                  </AreaChart>
                                                                </ResponsiveContainer>
                                                              </div>
                                                              {/* Quarterly table */}
                                                              <div className="overflow-x-auto rounded-lg border border-gray-700/40">
                                                                <table className="w-full text-xs">
                                                                  <thead>
                                                                    <tr className="bg-gray-800/50">
                                                                      <th className="text-left py-2 px-3 font-medium text-gray-400">Quarter</th>
                                                                      <th className="text-right py-2 px-3 font-medium text-gray-400">Net Profit (Cr)</th>
                                                                      <th className="text-right py-2 px-3 font-medium text-gray-400">Revenue (Cr)</th>
                                                                      <th className="text-right py-2 px-3 font-medium text-gray-400">EPS (₹)</th>
                                                                    </tr>
                                                                  </thead>
                                                                  <tbody>
                                                                    {qd.map((q: any, i: number) => {
                                                                      const np = parseFloat((q.net_profit || '0').toString().replace(/,/g,''));
                                                                      const prevNp = i > 0 ? parseFloat((qd[i-1].net_profit || '0').toString().replace(/,/g,'')) : null;
                                                                      const npTrend = prevNp !== null && prevNp !== 0 ? ((np - prevNp) / Math.abs(prevNp)) * 100 : null;
                                                                      return (
                                                                        <tr key={i} className="border-t border-gray-700/30 hover:bg-gray-800/30">
                                                                          <td className="py-2 px-3 text-gray-300 font-medium">{q.quarter}</td>
                                                                          <td className="py-2 px-3 text-right">
                                                                            <div className="flex items-center justify-end gap-1.5">
                                                                              {npTrend !== null && (
                                                                                <span className={`text-[10px] font-medium ${npTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                                  {npTrend >= 0 ? '▲' : '▼'}{Math.abs(npTrend).toFixed(1)}%
                                                                                </span>
                                                                              )}
                                                                              <span className="text-gray-300">{q.net_profit ? `₹${Number(q.net_profit).toLocaleString()}` : '—'}</span>
                                                                            </div>
                                                                          </td>
                                                                          <td className="py-2 px-3 text-right text-gray-400">{q.revenue ? `₹${Number(q.revenue).toLocaleString()}` : '—'}</td>
                                                                          <td className="py-2 px-3 text-right text-gray-400">{q.eps ? `₹${q.eps}` : '—'}</td>
                                                                        </tr>
                                                                      );
                                                                    })}
                                                                  </tbody>
                                                                </table>
                                                              </div>
                                                              {/* PDF links */}
                                                              {qd.some((q: any) => q.pdf_url) && (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                  {qd.filter((q: any) => q.pdf_url).slice(-4).map((q: any, i: number) => (
                                                                    <a key={i} href={q.pdf_url} target="_blank" rel="noopener noreferrer"
                                                                      className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300"
                                                                      data-testid={`link-fr-pdf-${i}`}>
                                                                      <FileText className="h-3 w-3" />{q.quarter} PDF
                                                                    </a>
                                                                  ))}
                                                                </div>
                                                              )}
                                                            </>
                                                          ) : (
                                                            <p className="text-xs text-gray-500 text-center py-6">No quarterly data available</p>
                                                          )}
                                                        </div>
                                                      )}

                                                      {/* P&L TAB */}
                                                      {fullReportActiveTab === 'pnl' && (
                                                        <div>
                                                          <div className="flex items-center gap-2 mb-3">
                                                            <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                                                            <span className="text-xs font-semibold text-gray-300">Annual Profit & Loss</span>
                                                          </div>
                                                          {af?.profitLoss?.length > 0 ? (
                                                            <div className="overflow-x-auto rounded-lg border border-gray-700/40">
                                                              <table className="w-full text-xs min-w-full">
                                                                <thead>
                                                                  <tr className="bg-gray-800/50">
                                                                    <th className="text-left py-2 px-3 font-medium text-gray-400 w-40">Item</th>
                                                                    {(af.years || []).slice(0, 5).map((y: string, i: number) => (
                                                                      <th key={i} className="text-right py-2 px-3 font-medium text-gray-400 whitespace-nowrap">{y}</th>
                                                                    ))}
                                                                  </tr>
                                                                </thead>
                                                                <tbody>
                                                                  {af.profitLoss.filter((row: any) => !/^\s*(10 Years|5 Years|3 Years|TTM|1 Year|Last Year)\s*:/.test(row.label || '')).map((row: any, i: number) => (
                                                                    <tr key={i} className="border-t border-gray-700/30 hover:bg-gray-800/30">
                                                                      <td className="py-2 px-3 text-gray-400 font-medium">{row.label}</td>
                                                                      {(af.years || []).slice(0, 5).map((_: string, yi: number) => {
                                                                        const v = row.values?.[yi]?.value;
                                                                        const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : Number(v);
                                                                        return (
                                                                          <td key={yi} className={`py-2 px-3 text-right ${!isNaN(n) && n < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                                                            {v != null ? (isNaN(n) ? v : n.toLocaleString()) : '—'}
                                                                          </td>
                                                                        );
                                                                      })}
                                                                    </tr>
                                                                  ))}
                                                                </tbody>
                                                              </table>
                                                            </div>
                                                          ) : (
                                                            <p className="text-xs text-gray-500 text-center py-6">No P&L data available</p>
                                                          )}
                                                        </div>
                                                      )}

                                                      {/* BALANCE SHEET TAB */}
                                                      {fullReportActiveTab === 'balance' && (
                                                        <div>
                                                          <div className="flex items-center gap-2 mb-3">
                                                            <BarChart className="h-3.5 w-3.5 text-gray-400" />
                                                            <span className="text-xs font-semibold text-gray-300">Annual Balance Sheet</span>
                                                          </div>
                                                          {af?.balanceSheet?.length > 0 ? (
                                                            <div className="overflow-x-auto rounded-lg border border-gray-700/40">
                                                              <table className="w-full text-xs min-w-full">
                                                                <thead>
                                                                  <tr className="bg-gray-800/50">
                                                                    <th className="text-left py-2 px-3 font-medium text-gray-400 w-40">Item</th>
                                                                    {(af.years || []).slice(0, 5).map((y: string, i: number) => (
                                                                      <th key={i} className="text-right py-2 px-3 font-medium text-gray-400 whitespace-nowrap">{y}</th>
                                                                    ))}
                                                                  </tr>
                                                                </thead>
                                                                <tbody>
                                                                  {af.balanceSheet.map((row: any, i: number) => (
                                                                    <tr key={i} className="border-t border-gray-700/30 hover:bg-gray-800/30">
                                                                      <td className="py-2 px-3 text-gray-400 font-medium">{row.label}</td>
                                                                      {(af.years || []).slice(0, 5).map((_: string, yi: number) => {
                                                                        const v = row.values?.[yi]?.value;
                                                                        const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : Number(v);
                                                                        return (
                                                                          <td key={yi} className={`py-2 px-3 text-right ${!isNaN(n) && n < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                                                            {v != null ? (isNaN(n) ? v : n.toLocaleString()) : '—'}
                                                                          </td>
                                                                        );
                                                                      })}
                                                                    </tr>
                                                                  ))}
                                                                </tbody>
                                                              </table>
                                                            </div>
                                                          ) : (
                                                            <p className="text-xs text-gray-500 text-center py-6">No balance sheet data available</p>
                                                          )}
                                                        </div>
                                                      )}

                                                      {/* KEY METRICS TAB */}
                                                      {fullReportActiveTab === 'metrics' && (
                                                        <div>
                                                          <div className="flex items-center gap-2 mb-3">
                                                            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                                                            <span className="text-xs font-semibold text-gray-300">Key Metrics</span>
                                                          </div>
                                                          {km ? (
                                                            <div className="grid grid-cols-2 gap-2">
                                                              {[
                                                                { label: 'P/E Ratio', value: km.pe != null ? km.pe.toFixed(2) : null },
                                                                { label: 'P/B Ratio', value: km.pb != null ? km.pb.toFixed(2) : null },
                                                                { label: 'EPS (TTM)', value: km.eps != null ? `₹${km.eps.toFixed(2)}` : null },
                                                                { label: 'Market Cap', value: km.marketCap },
                                                                { label: 'ROE', value: km.roe },
                                                                { label: 'ROCE', value: km.roce },
                                                                { label: 'Debt / Equity', value: km.debtToEquity != null ? km.debtToEquity.toFixed(2) : null },
                                                                { label: 'Current Ratio', value: km.currentRatio != null ? km.currentRatio.toFixed(2) : null },
                                                                { label: 'Beta', value: km.beta != null ? km.beta.toFixed(2) : null },
                                                                { label: 'Profit Margin', value: km.profitMargin },
                                                                { label: 'Revenue Growth', value: km.revenueGrowth },
                                                                { label: 'Dividend Yield', value: km.dividendYield },
                                                                { label: '52W High', value: km.high52w != null ? `₹${km.high52w.toLocaleString()}` : null },
                                                                { label: '52W Low', value: km.low52w != null ? `₹${km.low52w.toLocaleString()}` : null },
                                                                { label: 'Book Value', value: km.bookValue != null ? `₹${km.bookValue.toFixed(2)}` : null },
                                                              ].map(({ label, value }) => (
                                                                <div key={label} className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
                                                                  <span className="text-[11px] text-gray-500">{label}</span>
                                                                  <span className="text-[11px] font-medium text-gray-200">{value ?? '—'}</span>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          ) : (
                                                            <p className="text-xs text-gray-500 text-center py-6">No key metrics data available</p>
                                                          )}
                                                        </div>
                                                      )}

                                                      {/* INSIGHTS TAB */}
                                                      {fullReportActiveTab === 'insights' && (() => {
                                                        // ── Computed signals ──────────────────────────────────
                                                        const peVal    = km?.pe ?? null;
                                                        const roeVal   = km?.roe ? parseFloat(km.roe) : null;
                                                        const roceVal  = km?.roce ? parseFloat(km.roce) : null;
                                                        const deVal    = km?.debtToEquity ?? null;
                                                        const pmVal    = km?.profitMargin ? parseFloat(km.profitMargin) : null;
                                                        const rgVal    = km?.revenueGrowth ? parseFloat(km.revenueGrowth) : null;
                                                        const betaVal  = km?.beta ?? null;
                                                        const dyVal    = km?.dividendYield ? parseFloat(km.dividendYield) : null;

                                                        // Fundamental score (0-100)
                                                        let fscore = 0; let fmax = 0;
                                                        if (profitGrowth !== null) { fmax += 25; if (profitGrowth > 15) fscore += 25; else if (profitGrowth > 0) fscore += 15; }
                                                        if (roeVal !== null) { fmax += 20; if (roeVal >= 20) fscore += 20; else if (roeVal >= 12) fscore += 13; else if (roeVal >= 6) fscore += 7; }
                                                        if (deVal !== null) { fmax += 15; if (deVal < 0.3) fscore += 15; else if (deVal < 1) fscore += 10; else if (deVal < 2) fscore += 5; }
                                                        if (pmVal !== null) { fmax += 20; if (pmVal >= 20) fscore += 20; else if (pmVal >= 10) fscore += 13; else if (pmVal >= 5) fscore += 7; }
                                                        if (roceVal !== null) { fmax += 20; if (roceVal >= 20) fscore += 20; else if (roceVal >= 12) fscore += 13; else if (roceVal >= 6) fscore += 7; }
                                                        const fundamentalScore = fmax > 0 ? Math.round((fscore / fmax) * 100) : null;

                                                        // Valuation signal
                                                        const valuationLabel = peVal === null ? null : peVal < 12 ? { text: 'Deeply Undervalued', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' } : peVal < 20 ? { text: 'Fairly Valued', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' } : peVal < 30 ? { text: 'Slightly Overvalued', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' } : { text: 'Premium Priced', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' };

                                                        // Quality grade
                                                        const qualityGrade = fundamentalScore === null ? null : fundamentalScore >= 80 ? { grade: 'A+', label: 'Exceptional Quality', color: 'text-green-400' } : fundamentalScore >= 65 ? { grade: 'A', label: 'High Quality', color: 'text-green-400' } : fundamentalScore >= 50 ? { grade: 'B+', label: 'Good Quality', color: 'text-blue-400' } : fundamentalScore >= 35 ? { grade: 'B', label: 'Average Quality', color: 'text-yellow-400' } : { grade: 'C', label: 'Below Average', color: 'text-red-400' };

                                                        // Pre-computed display values (avoids nested ternary in template literals)
                                                        const pgSign = profitGrowth !== null && profitGrowth >= 0 ? '+' : '';
                                                        const pgLabel = profitGrowth !== null ? (pgSign + profitGrowth.toFixed(1) + '%') : null;

                                                        // Risk level
                                                        let riskScore = 0;
                                                        if (deVal !== null && deVal > 1.5) riskScore += 2;
                                                        if (betaVal !== null && betaVal > 1.3) riskScore += 2;
                                                        if (pmVal !== null && pmVal < 5) riskScore += 1;
                                                        if (profitGrowth !== null && profitGrowth < -10) riskScore += 2;
                                                        if (recentTrend === 'declining') riskScore += 1;
                                                        const riskLevel = riskScore <= 1 ? { label: 'Low Risk', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' } : riskScore <= 3 ? { label: 'Moderate Risk', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' } : { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };

                                                        // Bull / Bear cases
                                                        const bullPoints: string[] = [];
                                                        const bearPoints: string[] = [];
                                                        if (profitGrowth !== null && profitGrowth > 10) bullPoints.push(`Strong profit CAGR of +${profitGrowth.toFixed(1)}% over ${qd.length} quarters`);
                                                        if (roeVal !== null && roeVal >= 18) bullPoints.push(`Exceptional ROE of ${roeVal.toFixed(1)}% — top-tier capital efficiency`);
                                                        if (roceVal !== null && roceVal >= 15) bullPoints.push(`ROCE of ${roceVal.toFixed(1)}% indicates excellent capital deployment`);
                                                        if (deVal !== null && deVal < 0.5) bullPoints.push(`Near-zero leverage (D/E: ${deVal.toFixed(2)}) — fortress balance sheet`);
                                                        if (pmVal !== null && pmVal >= 15) bullPoints.push(`High profit margin of ${pmVal.toFixed(1)}% shows strong pricing power`);
                                                        if (recentTrend === 'improving') bullPoints.push('Most recent quarter shows accelerating profit momentum');
                                                        if (dyVal !== null && dyVal > 1.5) bullPoints.push(`Attractive dividend yield of ${dyVal.toFixed(2)}% supports income investors`);
                                                        if (peVal !== null && peVal < 15) bullPoints.push(`Discounted valuation at ${peVal.toFixed(1)}x P/E — potential re-rating upside`);

                                                        if (profitGrowth !== null && profitGrowth < 0) bearPoints.push(`Profit declined ${profitGrowth.toFixed(1)}% over ${qd.length} quarters — concerning trend`);
                                                        if (roeVal !== null && roeVal < 10) bearPoints.push(`ROE of ${roeVal.toFixed(1)}% below 10% — capital allocation concerns`);
                                                        if (deVal !== null && deVal > 1.5) bearPoints.push(`High leverage (D/E: ${deVal.toFixed(2)}) increases financial risk`);
                                                        if (pmVal !== null && pmVal < 5) bearPoints.push(`Thin margins (${pmVal.toFixed(1)}%) vulnerable to cost inflation`);
                                                        if (peVal !== null && peVal > 35) bearPoints.push(`Premium valuation of ${peVal.toFixed(1)}x P/E leaves little room for disappointment`);
                                                        if (betaVal !== null && betaVal > 1.3) bearPoints.push(`High beta of ${betaVal.toFixed(2)} means significant volatility during market downturns`);
                                                        if (recentTrend === 'declining') bearPoints.push('Most recent quarter shows deteriorating profit — watch next result closely');

                                                        // Fill defaults if empty
                                                        if (bullPoints.length === 0) bullPoints.push('Diversified business model with multiple revenue streams', 'Track record in established sector');
                                                        if (bearPoints.length === 0) bearPoints.push('Monitor quarterly results for any guidance downgrade', 'Macro headwinds remain a sector-wide risk');

                                                        // 52W position
                                                        const h52 = km?.high52w ?? null;
                                                        const l52 = km?.low52w ?? null;
                                                        const rangePct = h52 && l52 && h52 > l52 ? Math.round(((h52 - l52) / h52) * 100) : null;

                                                        return (
                                                          <div className="space-y-3">
                                                            {/* Header */}
                                                            <div className="flex items-center justify-between">
                                                              <div className="flex items-center gap-2">
                                                                <Sparkles className="h-4 w-4 text-purple-400" />
                                                                <span className="text-sm font-semibold text-gray-200">AI Fundamental Analysis</span>
                                                                <span className="text-[10px] text-gray-600">— {fullReportSymbol}</span>
                                                              </div>
                                                            </div>

                                                            {/* Scorecard row */}
                                                            <div className="grid grid-cols-3 gap-2">
                                                              {qualityGrade && (
                                                                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-800/60 border border-gray-700/40">
                                                                  <span className={`text-2xl font-black ${qualityGrade.color}`}>{qualityGrade.grade}</span>
                                                                  <span className="text-[10px] text-gray-500 mt-0.5 text-center leading-tight">{qualityGrade.label}</span>
                                                                  <span className="text-[9px] text-gray-700 mt-1">Fundamental Score</span>
                                                                </div>
                                                              )}
                                                              {valuationLabel && (
                                                                <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${valuationLabel.bg}`}>
                                                                  <span className={`text-xs font-bold ${valuationLabel.color} text-center leading-tight`}>{valuationLabel.text}</span>
                                                                  <span className="text-[10px] text-gray-500 mt-1">{peVal?.toFixed(1)}x P/E</span>
                                                                  <span className="text-[9px] text-gray-700 mt-0.5">Valuation</span>
                                                                </div>
                                                              )}
                                                              <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${riskLevel.bg}`}>
                                                                <span className={`text-xs font-bold ${riskLevel.color} text-center leading-tight`}>{riskLevel.label}</span>
                                                                <span className="text-[9px] text-gray-700 mt-1">Risk Level</span>
                                                              </div>
                                                            </div>

                                                            {/* Key metrics inline */}
                                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 p-3 rounded-xl bg-gray-800/40 border border-gray-700/30">
                                                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider col-span-2 mb-0.5">Key Financials at a Glance</p>
                                                              {[
                                                                { label: 'Net Profit Growth', value: pgLabel, positive: profitGrowth !== null && profitGrowth >= 0 },
                                                                { label: 'Recent Trend', value: recentTrend ? (recentTrend === 'improving' ? '↑ Improving' : '↓ Declining') : null, positive: recentTrend === 'improving' },
                                                                { label: 'ROE', value: km?.roe || null, positive: roeVal !== null && roeVal >= 15 },
                                                                { label: 'ROCE', value: km?.roce || null, positive: roceVal !== null && roceVal >= 15 },
                                                                { label: 'Profit Margin', value: km?.profitMargin || null, positive: pmVal !== null && pmVal >= 10 },
                                                                { label: 'Revenue Growth', value: km?.revenueGrowth || null, positive: rgVal !== null && rgVal >= 0 },
                                                                { label: 'Debt / Equity', value: deVal !== null ? deVal.toFixed(2) : null, positive: deVal !== null && deVal < 1 },
                                                                { label: 'Beta', value: betaVal !== null ? betaVal.toFixed(2) : null, positive: betaVal !== null && betaVal < 1.2 },
                                                              ].filter(m => m.value).map(({ label, value, positive }) => (
                                                                <div key={label} className="flex justify-between items-center">
                                                                  <span className="text-[10px] text-gray-600">{label}</span>
                                                                  <span className={`text-[11px] font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>{value}</span>
                                                                </div>
                                                              ))}
                                                            </div>

                                                            {/* Bull case */}
                                                            <div className="p-3 rounded-xl bg-green-900/10 border border-green-700/20">
                                                              <div className="flex items-center gap-1.5 mb-2">
                                                                <span className="text-green-400 text-xs font-bold">▲ Bull Case</span>
                                                                <span className="text-[10px] text-gray-600">— reasons to be optimistic</span>
                                                              </div>
                                                              <ul className="space-y-1">
                                                                {bullPoints.slice(0, 4).map((pt, i) => (
                                                                  <li key={i} className="flex items-start gap-1.5">
                                                                    <span className="text-green-500 text-[10px] mt-0.5 shrink-0">✓</span>
                                                                    <span className="text-[11px] text-gray-300 leading-relaxed">{pt}</span>
                                                                  </li>
                                                                ))}
                                                              </ul>
                                                            </div>

                                                            {/* Bear case */}
                                                            <div className="p-3 rounded-xl bg-red-900/10 border border-red-700/20">
                                                              <div className="flex items-center gap-1.5 mb-2">
                                                                <span className="text-red-400 text-xs font-bold">▼ Bear Case</span>
                                                                <span className="text-[10px] text-gray-600">— risks to monitor</span>
                                                              </div>
                                                              <ul className="space-y-1">
                                                                {bearPoints.slice(0, 4).map((pt, i) => (
                                                                  <li key={i} className="flex items-start gap-1.5">
                                                                    <span className="text-red-500 text-[10px] mt-0.5 shrink-0">✕</span>
                                                                    <span className="text-[11px] text-gray-300 leading-relaxed">{pt}</span>
                                                                  </li>
                                                                ))}
                                                              </ul>
                                                            </div>

                                                            {/* 52-week range */}
                                                            {h52 !== null && l52 !== null && (
                                                              <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/30">
                                                                <div className="flex items-center justify-between mb-2">
                                                                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">52-Week Price Range</span>
                                                                  {rangePct !== null && <span className="text-[10px] text-gray-600">{rangePct}% spread</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                  <span className="text-[11px] text-red-400 font-medium shrink-0">₹{l52.toLocaleString()}</span>
                                                                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                                    <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%)', width: '100%' }} />
                                                                  </div>
                                                                  <span className="text-[11px] text-green-400 font-medium shrink-0">₹{h52.toLocaleString()}</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                                                                  {rangePct !== null && rangePct > 30 ? 'Wide annual range — high volatility stock.' : 'Relatively stable price band this year.'}
                                                                </p>
                                                              </div>
                                                            )}

                                                            {/* Investment thesis */}
                                                            <div className="p-3 rounded-xl bg-purple-900/15 border border-purple-700/25">
                                                              <div className="flex items-center gap-1.5 mb-2">
                                                                <Sparkles className="h-3 w-3 text-purple-400" />
                                                                <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">Investment Thesis</span>
                                                              </div>
                                                              <p className="text-[11px] text-gray-300 leading-relaxed">
                                                                {(() => {
                                                                  const strong = profitGrowth !== null && profitGrowth > 10 && roeVal !== null && roeVal > 15 && (deVal === null || deVal < 1);
                                                                  const weak   = profitGrowth !== null && profitGrowth < 0 && (deVal !== null && deVal > 1.5);
                                                                  if (strong) return `${fullReportSymbol} demonstrates strong fundamental quality — consistent profit growth, efficient capital usage, and a healthy balance sheet make it a compelling candidate for long-term portfolios. Current valuation${peVal ? ` at ${peVal.toFixed(1)}x P/E` : ''} ${peVal && peVal < 22 ? 'offers a reasonable entry point.' : 'demands continued earnings delivery to justify the premium.'}`;
                                                                  if (weak)   return `${fullReportSymbol} is navigating through a challenging phase — declining profits and elevated leverage warrant caution. Investors should wait for 2 consecutive quarters of profit recovery before taking fresh positions. Stop-losses and position sizing are critical at this stage.`;
                                                                  return `${fullReportSymbol} shows a mixed fundamental picture. ${bullPoints[0] || 'Established business with sector presence.'} However, ${bearPoints[0]?.toLowerCase() || 'key metrics need improvement.'}. A selective, SIP-based accumulation strategy with defined risk management is advisable.`;
                                                                })()}
                                                              </p>
                                                            </div>

                                                            {/* Disclaimer */}
                                                            <div className="flex items-start gap-1.5 pt-1">
                                                              <span className="text-[9px] text-gray-700 leading-relaxed">
                                                                ℹ️ For informational purposes only — not investment advice. Always consult a SEBI-registered advisor before making investment decisions.
                                                              </span>
                                                            </div>
                                                          </div>
                                                        );
                                                      })()}

                                                    </div>
                                                  </div>
                                                );
                                              })() : (
                                                <div className="flex items-center justify-center py-8 text-gray-500 text-xs">
                                                  No data available from any source.
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* ── Stock Compare Window ── */}
                                          <div className="w-full rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
                                              <div className="flex items-center gap-2">
                                                <BarChart className="h-4 w-4 text-purple-400" />
                                                <span className="text-sm font-semibold text-gray-200">Compare Stocks</span>
                                                <span className="text-[11px] text-gray-500 ml-1">Select up to 3 from watchlist</span>
                                              </div>
                                              {showCompareResults && (
                                                <button
                                                  onClick={() => { setShowCompareResults(false); setCompareAiInsights(null); setCompareSymbols([]); }}
                                                  className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700/50 transition-colors"
                                                  data-testid="button-compare-reset"
                                                >Reset</button>
                                              )}
                                            </div>

                                            {/* Stock selector chips + Analyse button */}
                                            <div className="px-4 pt-3 pb-3">
                                              <div className="flex flex-wrap gap-2 mb-3">
                                                {watchlistSymbols.length === 0 ? (
                                                  <span className="text-xs text-gray-500">No stocks in watchlist. Add stocks first.</span>
                                                ) : watchlistSymbols.map(s => {
                                                  const cs = s.symbol.replace(/^[A-Z]+:/i,'').replace('-EQ','').replace('-BE','');
                                                  const isSel = compareSymbols.includes(cs);
                                                  const isDisabled = !isSel && compareSymbols.length >= 3;
                                                  return (
                                                    <button
                                                      key={s.symbol}
                                                      data-testid={`chip-compare-${cs}`}
                                                      onClick={() => {
                                                        if (isSel) setCompareSymbols(p => p.filter(x => x !== cs));
                                                        else if (!isDisabled) setCompareSymbols(p => [...p, cs]);
                                                      }}
                                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                        isSel
                                                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                                          : isDisabled
                                                            ? 'bg-gray-800/30 text-gray-600 border-gray-700/30 cursor-not-allowed'
                                                            : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:border-purple-500/40 hover:text-gray-200'
                                                      }`}
                                                    >
                                                      {s.displayName || cs}
                                                      {isSel && <X className="h-2.5 w-2.5 ml-0.5" />}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                              <button
                                                onClick={handleCompareAnalysis}
                                                disabled={compareSymbols.length < 2 || compareLoading}
                                                data-testid="button-compare-analyze"
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                                  compareSymbols.length >= 2 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'
                                                }`}
                                              >
                                                {compareLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                                {compareLoading ? 'Analysing…' : `Analyse${compareSymbols.length >= 2 ? ` ${compareSymbols.length} Stocks` : ''}`}
                                              </button>
                                            </div>

                                            {/* Results panel */}
                                            {showCompareResults && compareSymbols.length >= 2 && (() => {
                                              const COLORS = ['#a78bfa', '#34d399', '#f87171', '#60a5fa'];

                                              // Build merged chart data (net profit per quarter)
                                              const allQs = [...new Set(compareSymbols.flatMap(sym => (compareQuarterlyData[sym] || []).map((q: any) => q.quarter)))];
                                              const chartRows = allQs.slice(-6).map(quarter => {
                                                const row: any = { quarter };
                                                compareSymbols.forEach(sym => {
                                                  const q = (compareQuarterlyData[sym] || []).find((x: any) => x.quarter === quarter);
                                                  if (q) row[sym] = parseFloat((q.net_profit || q.revenue || '0').toString().replace(/,/g,'')) || 0;
                                                });
                                                return row;
                                              });

                                              // Compute growth metrics for AI insights
                                              const metrics = compareSymbols.map((sym, si) => {
                                                const q = compareQuarterlyData[sym] || [];
                                                const profits = q.map((x: any) => parseFloat((x.net_profit||'0').toString().replace(/,/g,''))).filter(Boolean);
                                                const growth = profits.length > 1 ? ((profits[profits.length-1]-profits[0])/Math.abs(profits[0]))*100 : 0;
                                                const trend = profits.length > 1 && profits[profits.length-1] > profits[profits.length-2] ? 'improving' : 'declining';
                                                return { sym, growth, trend, color: COLORS[si], quarters: q.length };
                                              });
                                              const best = [...metrics].sort((a,b) => b.growth - a.growth)[0];
                                              const improvingCount = metrics.filter(m => m.trend === 'improving').length;

                                              // Helper: collect all row labels for a financial section across all stocks
                                              const getFinancialRows = (section: 'profitLoss' | 'balanceSheet') => {
                                                const labelSet = new Set<string>();
                                                compareSymbols.forEach(sym => {
                                                  const rows = compareAnalysisData[sym]?.annualFinancials?.[section] || [];
                                                  rows.forEach((r: any) => labelSet.add(r.label));
                                                });
                                                return Array.from(labelSet);
                                              };

                                              // Helper: get value for a label/year/stock from financials
                                              const getFinancialValue = (sym: string, section: 'profitLoss' | 'balanceSheet', label: string, yearIdx: number) => {
                                                const rows = compareAnalysisData[sym]?.annualFinancials?.[section] || [];
                                                const row = rows.find((r: any) => r.label === label);
                                                if (!row) return null;
                                                const val = row.values?.[yearIdx]?.value;
                                                if (val === undefined || val === null) return null;
                                                const num = typeof val === 'string' ? parseFloat(val.replace(/,/g,'')) : Number(val);
                                                return isNaN(num) ? val : num;
                                              };

                                              // Merged years across all stocks for a section
                                              const getMergedYears = (_section: 'profitLoss' | 'balanceSheet') => {
                                                const yearSets = compareSymbols.map(sym => compareAnalysisData[sym]?.annualFinancials?.years || []);
                                                return yearSets.reduce((a: string[], b: string[]) => a.length >= b.length ? a : b, []).slice(0, 5);
                                              };

                                              const tabs = [
                                                { id: 'overview', label: 'Quarterly Report' },
                                                { id: 'pnl', label: 'P&L Statement' },
                                                { id: 'balance', label: 'Balance Sheet' },
                                                { id: 'metrics', label: 'Key Metrics' },
                                                { id: 'insights', label: '✦ Insights' },
                                              ] as const;

                                              return (
                                                <div className="pb-4">
                                                  {/* Tab bar */}
                                                  <div className="flex border-b border-gray-700/60 px-4 pt-3 gap-1 overflow-x-auto">
                                                    {tabs.map(tab => (
                                                      <button
                                                        key={tab.id}
                                                        onClick={() => setCompareActiveTab(tab.id)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                                                          compareActiveTab === tab.id
                                                            ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
                                                            : 'text-gray-500 hover:text-gray-300'
                                                        }`}
                                                      >
                                                        {tab.label}
                                                      </button>
                                                    ))}
                                                  </div>

                                                  <div className="px-4 space-y-4 pt-4">

                                                    {/* ── OVERVIEW TAB ── */}
                                                    {compareActiveTab === 'overview' && (
                                                      <>
                                                        {/* Bar chart */}
                                                        <div>
                                                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                            <TrendingUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                            <span className="text-xs font-semibold text-gray-300">Quarterly Net Profit (₹ Cr)</span>
                                                            <div className="flex items-center gap-3 ml-auto flex-wrap">
                                                              {compareSymbols.map((sym, i) => (
                                                                <span key={sym} className="flex items-center gap-1 text-[11px]" style={{ color: COLORS[i] }}>
                                                                  <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: COLORS[i] }} />
                                                                  {sym}
                                                                </span>
                                                              ))}
                                                            </div>
                                                          </div>
                                                          {chartRows.length > 0 ? (
                                                            <div className="h-44 w-full">
                                                              <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={chartRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                                                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                                                  <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(v: number) => `₹${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={40} />
                                                                  <Tooltip
                                                                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
                                                                    formatter={(v: any, name: any) => [`₹${Number(v).toLocaleString()} Cr`, name]}
                                                                  />
                                                                  {compareSymbols.map((sym, i) => (
                                                                    <Bar key={sym} dataKey={sym} fill={COLORS[i]} radius={[3,3,0,0]} maxBarSize={30} />
                                                                  ))}
                                                                </BarChart>
                                                              </ResponsiveContainer>
                                                            </div>
                                                          ) : (
                                                            <p className="text-xs text-gray-500 text-center py-6">No quarterly data available for selected stocks</p>
                                                          )}
                                                        </div>

                                                        {/* Quarterly net profit table */}
                                                        {chartRows.length > 0 && (
                                                          <div className="border-t border-gray-700/50 pt-3">
                                                            <span className="text-xs font-semibold text-gray-300 block mb-2">Quarterly Net Profit Summary (₹ Cr)</span>
                                                            <div className="overflow-x-auto rounded-lg border border-gray-700/40">
                                                              <table className="w-full text-xs min-w-full">
                                                                <thead>
                                                                  <tr className="bg-gray-800/50">
                                                                    <th className="text-left py-2 px-3 font-medium text-gray-400">Quarter</th>
                                                                    {compareSymbols.map((sym, i) => (
                                                                      <th key={sym} className="text-right py-2 px-3 font-medium" style={{ color: COLORS[i] }}>{sym}</th>
                                                                    ))}
                                                                  </tr>
                                                                </thead>
                                                                <tbody>
                                                                  {chartRows.slice(-5).map((row, i) => (
                                                                    <tr key={i} className="border-t border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                                                                      <td className="py-2 px-3 text-gray-400">{row.quarter}</td>
                                                                      {compareSymbols.map((sym) => (
                                                                        <td key={sym} className="text-right py-2 px-3 font-mono" style={{ color: row[sym] != null ? (row[sym] >= 0 ? '#d1fae5' : '#fca5a5') : '#6b7280' }}>
                                                                          {row[sym] != null ? `₹${Number(row[sym]).toLocaleString()}` : '—'}
                                                                        </td>
                                                                      ))}
                                                                    </tr>
                                                                  ))}
                                                                </tbody>
                                                              </table>
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* PDF links */}
                                                        {compareSymbols.some(sym => (compareQuarterlyData[sym] || []).some((q: any) => q.pdf_url)) && (
                                                          <div className="border-t border-gray-700/50 pt-3">
                                                            <span className="text-xs font-semibold text-gray-300 block mb-2">Quarterly Result PDFs</span>
                                                            <div className="space-y-2">
                                                              {compareSymbols.map((sym, si) => {
                                                                const pdfs = (compareQuarterlyData[sym] || []).filter((q: any) => q.pdf_url).slice(-4);
                                                                if (!pdfs.length) return null;
                                                                return (
                                                                  <div key={sym} className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[11px] font-semibold w-16 shrink-0" style={{ color: COLORS[si] }}>{sym}</span>
                                                                    {pdfs.map((q: any, idx: number) => (
                                                                      <a key={idx} href={q.pdf_url} target="_blank" rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-[11px] text-gray-300 border border-gray-700/60 hover:border-gray-500 transition-colors">
                                                                        <FileText className="h-2.5 w-2.5 shrink-0" />{q.quarter}
                                                                      </a>
                                                                    ))}
                                                                  </div>
                                                                );
                                                              })}
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* Latest news */}
                                                        <div className="border-t border-gray-700/50 pt-3">
                                                          <span className="text-xs font-semibold text-gray-300 block mb-2">Latest News</span>
                                                          <div className="space-y-3">
                                                            {compareSymbols.map((sym, si) => {
                                                              const news = compareNewsData[sym] || [];
                                                              if (!news.length) return (
                                                                <div key={sym}>
                                                                  <span className="text-[11px] font-semibold" style={{ color: COLORS[si] }}>{sym}</span>
                                                                  <p className="text-[11px] text-gray-600 mt-1">No news available</p>
                                                                </div>
                                                              );
                                                              return (
                                                                <div key={sym}>
                                                                  <span className="text-[11px] font-semibold block mb-1" style={{ color: COLORS[si] }}>{sym}</span>
                                                                  <div className="space-y-1.5">
                                                                    {news.slice(0,2).map((n: any, ni: number) => (
                                                                      <a key={ni} href={n.url} target="_blank" rel="noopener noreferrer"
                                                                        className="flex items-start gap-1.5 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 border border-gray-700/40 hover:border-gray-600 group transition-colors">
                                                                        <ExternalLink className="h-3 w-3 text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5" />
                                                                        <span className="text-[11px] text-gray-400 group-hover:text-gray-200 line-clamp-2 transition-colors">{n.title}</span>
                                                                      </a>
                                                                    ))}
                                                                  </div>
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                        </div>

                                                        {/* AI Insights */}
                                                        {compareAiInsights && (
                                                          <div className="border-t border-gray-700/50 pt-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                                                              <span className="text-xs font-semibold text-gray-300">AI Insights</span>
                                                            </div>
                                                            <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-700/30 space-y-1.5">
                                                              {metrics.map((m) => (
                                                                <p key={m.sym} className="text-xs text-gray-300">
                                                                  <span className="font-semibold" style={{ color: m.color }}>• {m.sym}:</span>{' '}
                                                                  Net profit {m.growth >= 0 ? 'growth' : 'decline'} of{' '}
                                                                  <span className={m.growth >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                                    {m.growth >= 0 ? '+' : ''}{m.growth.toFixed(1)}%
                                                                  </span>{' '}
                                                                  over {m.quarters} quarters — <span className={m.trend === 'improving' ? 'text-green-400' : 'text-red-400'}>{m.trend}</span> trend
                                                                </p>
                                                              ))}
                                                              {best && (
                                                                <p className="text-xs text-gray-300 mt-2 pt-2 border-t border-purple-700/20">
                                                                  📊 <span className="font-semibold text-purple-300">Best performer:</span> {best.sym} with {best.growth >= 0 ? '+' : ''}{best.growth.toFixed(1)}% profit growth
                                                                </p>
                                                              )}
                                                              <p className="text-xs text-gray-400">
                                                                🎯 {improvingCount === compareSymbols.length
                                                                  ? 'All selected stocks show improving trends — broadly positive outlook.'
                                                                  : improvingCount === 0
                                                                    ? 'All stocks show declining recent quarters — exercise caution.'
                                                                    : `${improvingCount}/${compareSymbols.length} stocks improving. Selective approach advised.`}
                                                              </p>
                                                            </div>
                                                          </div>
                                                        )}
                                                      </>
                                                    )}

                                                    {/* ── P&L STATEMENT TAB ── */}
                                                    {compareActiveTab === 'pnl' && (() => {
                                                      const pnlLabels = getFinancialRows('profitLoss');
                                                      const years = getMergedYears('profitLoss');
                                                      const hasPnl = compareSymbols.some(sym => (compareAnalysisData[sym]?.annualFinancials?.profitLoss || []).length > 0);
                                                      if (!hasPnl) return (
                                                        <div className="text-center py-8">
                                                          <p className="text-xs text-gray-500">Annual P&amp;L data not available for selected stocks</p>
                                                          <p className="text-[11px] text-gray-600 mt-1">Try stocks like RELIANCE, TCS, HDFCBANK</p>
                                                        </div>
                                                      );
                                                      return (
                                                        <div className="space-y-4">
                                                          {/* Per-stock annual P&L tables */}
                                                          {compareSymbols.map((sym, si) => {
                                                            const symPnl = compareAnalysisData[sym]?.annualFinancials?.profitLoss || [];
                                                            const symYears = (compareAnalysisData[sym]?.annualFinancials?.years || []).slice(0, 5);
                                                            if (!symPnl.length) return (
                                                              <div key={sym} className="rounded-lg border border-gray-700/40 p-3">
                                                                <span className="text-xs font-semibold" style={{ color: COLORS[si] }}>{sym}</span>
                                                                <p className="text-[11px] text-gray-600 mt-1">No P&amp;L data available</p>
                                                              </div>
                                                            );
                                                            return (
                                                              <div key={sym} className="rounded-lg border border-gray-700/40 overflow-hidden">
                                                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border-b border-gray-700/40">
                                                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[si] }} />
                                                                  <span className="text-xs font-semibold" style={{ color: COLORS[si] }}>{sym}</span>
                                                                  <span className="text-[11px] text-gray-500 ml-auto">Profit & Loss Statement (₹ Cr)</span>
                                                                </div>
                                                                <div className="overflow-x-auto">
                                                                  <table className="w-full text-xs min-w-full">
                                                                    <thead>
                                                                      <tr className="bg-gray-800/30">
                                                                        <th className="text-left py-2 px-3 font-medium text-gray-400 min-w-[140px]">Particulars</th>
                                                                        {symYears.map((y: string) => (
                                                                          <th key={y} className="text-right py-2 px-3 font-medium text-gray-400 whitespace-nowrap">{y}</th>
                                                                        ))}
                                                                      </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                      {symPnl.map((row: any, idx: number) => {
                                                                        const isHighlight = row.label?.toLowerCase().includes('net profit') || row.label?.toLowerCase().includes('total revenue') || row.label?.toLowerCase().includes('ebitda') || row.label?.toLowerCase().includes('pat');
                                                                        return (
                                                                          <tr key={idx} className={`border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors ${isHighlight ? 'bg-gray-800/30 font-semibold' : ''}`}>
                                                                            <td className="py-2 px-3 text-gray-300 min-w-[140px]">{row.label}</td>
                                                                            {(row.values || []).slice(0, 5).map((v: any, vIdx: number) => {
                                                                              const numVal = typeof v?.value === 'string' ? parseFloat(v.value.replace(/,/g,'')) : Number(v?.value ?? 0);
                                                                              return (
                                                                                <td key={vIdx} className={`text-right py-2 px-3 font-mono whitespace-nowrap ${isNaN(numVal) ? 'text-gray-400' : numVal >= 0 ? 'text-gray-200' : 'text-red-400'}`}>
                                                                                  {isNaN(numVal) ? (v?.value || '—') : numVal.toLocaleString()}
                                                                                </td>
                                                                              );
                                                                            })}
                                                                          </tr>
                                                                        );
                                                                      })}
                                                                    </tbody>
                                                                  </table>
                                                                </div>
                                                              </div>
                                                            );
                                                          })}

                                                          {/* Side-by-side comparison for common rows */}
                                                          {pnlLabels.length > 0 && compareSymbols.length >= 2 && (
                                                            <div className="border-t border-gray-700/50 pt-3">
                                                              <div className="flex items-center gap-2 mb-2">
                                                                <Sparkles className="h-3 w-3 text-purple-400" />
                                                                <span className="text-xs font-semibold text-gray-300">Side-by-Side P&amp;L Comparison (Latest Year)</span>
                                                              </div>
                                                              <div className="overflow-x-auto rounded-lg border border-gray-700/40">
                                                                <table className="w-full text-xs min-w-full">
                                                                  <thead>
                                                                    <tr className="bg-gray-800/50">
                                                                      <th className="text-left py-2 px-3 font-medium text-gray-400 min-w-[140px]">Particulars</th>
                                                                      {compareSymbols.map((sym, i) => (
                                                                        <th key={sym} className="text-right py-2 px-3 font-medium whitespace-nowrap" style={{ color: COLORS[i] }}>{sym}</th>
                                                                      ))}
                                                                    </tr>
                                                                  </thead>
                                                                  <tbody>
                                                                    {pnlLabels.map((label, idx) => {
                                                                      const isHighlight = label?.toLowerCase().includes('net profit') || label?.toLowerCase().includes('total revenue') || label?.toLowerCase().includes('ebitda') || label?.toLowerCase().includes('pat');
                                                                      return (
                                                                        <tr key={idx} className={`border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors ${isHighlight ? 'bg-gray-800/30 font-semibold' : ''}`}>
                                                                          <td className="py-2 px-3 text-gray-300 min-w-[140px]">{label}</td>
                                                                          {compareSymbols.map((sym) => {
                                                                            const val = getFinancialValue(sym, 'profitLoss', label, 0);
                                                                            const numVal = typeof val === 'number' ? val : parseFloat(String(val || '').replace(/,/g,''));
                                                                            return (
                                                                              <td key={sym} className={`text-right py-2 px-3 font-mono whitespace-nowrap ${val === null ? 'text-gray-600' : isNaN(numVal) ? 'text-gray-300' : numVal >= 0 ? 'text-gray-200' : 'text-red-400'}`}>
                                                                                {val === null ? '—' : isNaN(numVal) ? String(val) : numVal.toLocaleString()}
                                                                              </td>
                                                                            );
                                                                          })}
                                                                        </tr>
                                                                      );
                                                                    })}
                                                                  </tbody>
                                                                </table>
                                                              </div>
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })()}

                                                    {/* ── BALANCE SHEET TAB ── */}
                                                    {compareActiveTab === 'balance' && (() => {
                                                      const bsLabels = getFinancialRows('balanceSheet');
                                                      const hasBS = compareSymbols.some(sym => (compareAnalysisData[sym]?.annualFinancials?.balanceSheet || []).length > 0);
                                                      if (!hasBS) return (
                                                        <div className="text-center py-8">
                                                          <p className="text-xs text-gray-500">Balance sheet data not available for selected stocks</p>
                                                          <p className="text-[11px] text-gray-600 mt-1">Try stocks like RELIANCE, TCS, HDFCBANK</p>
                                                        </div>
                                                      );
                                                      return (
                                                        <div className="space-y-4">
                                                          {/* Per-stock balance sheets */}
                                                          {compareSymbols.map((sym, si) => {
                                                            const symBS = compareAnalysisData[sym]?.annualFinancials?.balanceSheet || [];
                                                            const symYears = (compareAnalysisData[sym]?.annualFinancials?.years || []).slice(0, 5);
                                                            if (!symBS.length) return (
                                                              <div key={sym} className="rounded-lg border border-gray-700/40 p-3">
                                                                <span className="text-xs font-semibold" style={{ color: COLORS[si] }}>{sym}</span>
                                                                <p className="text-[11px] text-gray-600 mt-1">No balance sheet data available</p>
                                                              </div>
                                                            );
                                                            return (
                                                              <div key={sym} className="rounded-lg border border-gray-700/40 overflow-hidden">
                                                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border-b border-gray-700/40">
                                                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[si] }} />
                                                                  <span className="text-xs font-semibold" style={{ color: COLORS[si] }}>{sym}</span>
                                                                  <span className="text-[11px] text-gray-500 ml-auto">Balance Sheet (₹ Cr)</span>
                                                                </div>
                                                                <div className="overflow-x-auto">
                                                                  <table className="w-full text-xs min-w-full">
                                                                    <thead>
                                                                      <tr className="bg-gray-800/30">
                                                                        <th className="text-left py-2 px-3 font-medium text-gray-400 min-w-[140px]">Particulars</th>
                                                                        {symYears.map((y: string) => (
                                                                          <th key={y} className="text-right py-2 px-3 font-medium text-gray-400 whitespace-nowrap">{y}</th>
                                                                        ))}
                                                                      </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                      {symBS.map((row: any, idx: number) => {
                                                                        const isHighlight = row.label?.toLowerCase().includes('total assets') || row.label?.toLowerCase().includes('total liabilities') || row.label?.toLowerCase().includes('equity') || row.label?.toLowerCase().includes('net worth');
                                                                        return (
                                                                          <tr key={idx} className={`border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors ${isHighlight ? 'bg-gray-800/30 font-semibold' : ''}`}>
                                                                            <td className="py-2 px-3 text-gray-300 min-w-[140px]">{row.label}</td>
                                                                            {(row.values || []).slice(0, 5).map((v: any, vIdx: number) => {
                                                                              const numVal = typeof v?.value === 'string' ? parseFloat(v.value.replace(/,/g,'')) : Number(v?.value ?? 0);
                                                                              return (
                                                                                <td key={vIdx} className={`text-right py-2 px-3 font-mono whitespace-nowrap ${isNaN(numVal) ? 'text-gray-400' : numVal >= 0 ? 'text-gray-200' : 'text-red-400'}`}>
                                                                                  {isNaN(numVal) ? (v?.value || '—') : numVal.toLocaleString()}
                                                                                </td>
                                                                              );
                                                                            })}
                                                                          </tr>
                                                                        );
                                                                      })}
                                                                    </tbody>
                                                                  </table>
                                                                </div>
                                                              </div>
                                                            );
                                                          })}

                                                          {/* Side-by-side comparison */}
                                                          {bsLabels.length > 0 && compareSymbols.length >= 2 && (
                                                            <div className="border-t border-gray-700/50 pt-3">
                                                              <div className="flex items-center gap-2 mb-2">
                                                                <Sparkles className="h-3 w-3 text-purple-400" />
                                                                <span className="text-xs font-semibold text-gray-300">Side-by-Side Balance Sheet (Latest Year)</span>
                                                              </div>
                                                              <div className="overflow-x-auto rounded-lg border border-gray-700/40">
                                                                <table className="w-full text-xs min-w-full">
                                                                  <thead>
                                                                    <tr className="bg-gray-800/50">
                                                                      <th className="text-left py-2 px-3 font-medium text-gray-400 min-w-[140px]">Particulars</th>
                                                                      {compareSymbols.map((sym, i) => (
                                                                        <th key={sym} className="text-right py-2 px-3 font-medium whitespace-nowrap" style={{ color: COLORS[i] }}>{sym}</th>
                                                                      ))}
                                                                    </tr>
                                                                  </thead>
                                                                  <tbody>
                                                                    {bsLabels.map((label, idx) => {
                                                                      const isHighlight = label?.toLowerCase().includes('total assets') || label?.toLowerCase().includes('total liabilities') || label?.toLowerCase().includes('equity') || label?.toLowerCase().includes('net worth');
                                                                      return (
                                                                        <tr key={idx} className={`border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors ${isHighlight ? 'bg-gray-800/30 font-semibold' : ''}`}>
                                                                          <td className="py-2 px-3 text-gray-300 min-w-[140px]">{label}</td>
                                                                          {compareSymbols.map((sym) => {
                                                                            const val = getFinancialValue(sym, 'balanceSheet', label, 0);
                                                                            const numVal = typeof val === 'number' ? val : parseFloat(String(val || '').replace(/,/g,''));
                                                                            return (
                                                                              <td key={sym} className={`text-right py-2 px-3 font-mono whitespace-nowrap ${val === null ? 'text-gray-600' : isNaN(numVal) ? 'text-gray-300' : numVal >= 0 ? 'text-gray-200' : 'text-red-400'}`}>
                                                                                {val === null ? '—' : isNaN(numVal) ? String(val) : numVal.toLocaleString()}
                                                                              </td>
                                                                            );
                                                                          })}
                                                                        </tr>
                                                                      );
                                                                    })}
                                                                  </tbody>
                                                                </table>
                                                              </div>
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })()}

                                                    {/* ── KEY METRICS TAB ── */}
                                                    {compareActiveTab === 'metrics' && (() => {
                                                      const metricDefs = [
                                                        { label: 'Current Price (₹)', key: (d: any) => d?.priceData?.close || d?.priceData?.price },
                                                        { label: 'Open (₹)', key: (d: any) => d?.priceData?.open },
                                                        { label: 'High (₹)', key: (d: any) => d?.priceData?.high },
                                                        { label: 'Low (₹)', key: (d: any) => d?.priceData?.low },
                                                        { label: '52W High (₹)', key: (d: any) => d?.keyMetrics?.high52w || d?.priceData?.week52High || d?.priceData?.high52W },
                                                        { label: '52W Low (₹)', key: (d: any) => d?.keyMetrics?.low52w || d?.priceData?.week52Low || d?.priceData?.low52W },
                                                        { label: 'P/E Ratio', key: (d: any) => d?.keyMetrics?.pe || d?.valuation?.peRatio || d?.priceData?.pe || d?.fundamentals?.pe },
                                                        { label: 'P/B Ratio', key: (d: any) => d?.keyMetrics?.pb || d?.valuation?.pbRatio || d?.priceData?.pb || d?.fundamentals?.pb },
                                                        { label: 'EPS (₹)', key: (d: any) => d?.keyMetrics?.eps || d?.financialHealth?.eps || d?.priceData?.eps || d?.fundamentals?.eps },
                                                        { label: 'Market Cap', key: (d: any) => d?.keyMetrics?.marketCap || d?.valuation?.marketCap || d?.priceData?.marketCap || d?.fundamentals?.marketCap },
                                                        { label: 'Book Value (₹)', key: (d: any) => d?.keyMetrics?.bookValue || d?.financialHealth?.bookValue || d?.priceData?.bookValue || d?.fundamentals?.bookValue },
                                                        { label: 'Dividend Yield', key: (d: any) => d?.keyMetrics?.dividendYield || d?.financialHealth?.dividendYield || d?.priceData?.dividendYield || d?.fundamentals?.dividendYield },
                                                        { label: 'ROE (%)', key: (d: any) => d?.keyMetrics?.roe || d?.financialHealth?.roe || d?.fundamentals?.roe || d?.moneycontrolData?.roe },
                                                        { label: 'ROCE (%)', key: (d: any) => d?.keyMetrics?.roce || d?.fundamentals?.roce || d?.moneycontrolData?.roce },
                                                        { label: 'Debt-to-Equity', key: (d: any) => d?.keyMetrics?.debtToEquity || d?.financialHealth?.deRatio || d?.fundamentals?.debtToEquity || d?.moneycontrolData?.deRatio },
                                                        { label: 'Current Ratio', key: (d: any) => d?.keyMetrics?.currentRatio || d?.additionalIndicators?.currentRatio || d?.fundamentals?.currentRatio || d?.moneycontrolData?.currentRatio },
                                                        { label: 'Profit Margin', key: (d: any) => d?.keyMetrics?.profitMargin || d?.growthMetrics?.profitMargin || d?.moneycontrolData?.profitMargin },
                                                        { label: 'Revenue Growth', key: (d: any) => d?.keyMetrics?.revenueGrowth || d?.growthMetrics?.revenueGrowth || d?.moneycontrolData?.revenueGrowth },
                                                        { label: 'Beta', key: (d: any) => d?.keyMetrics?.beta || d?.additionalIndicators?.beta || d?.fundamentals?.beta || d?.moneycontrolData?.beta },
                                                      ];

                                                      const hasMetrics = compareSymbols.some(sym => compareAnalysisData[sym]);
                                                      if (!hasMetrics) return (
                                                        <div className="text-center py-8">
                                                          <p className="text-xs text-gray-500">Key metrics data not available</p>
                                                        </div>
                                                      );

                                                      return (
                                                        <div className="space-y-3">
                                                          <div className="overflow-x-auto rounded-lg border border-gray-700/40">
                                                            <table className="w-full text-xs min-w-full">
                                                              <thead>
                                                                <tr className="bg-gray-800/50">
                                                                  <th className="text-left py-2 px-3 font-medium text-gray-400 min-w-[140px]">Metric</th>
                                                                  {compareSymbols.map((sym, i) => (
                                                                    <th key={sym} className="text-right py-2 px-3 font-medium whitespace-nowrap" style={{ color: COLORS[i] }}>{sym}</th>
                                                                  ))}
                                                                </tr>
                                                              </thead>
                                                              <tbody>
                                                                {metricDefs.map(({ label, key }, idx) => {
                                                                  const vals = compareSymbols.map(sym => {
                                                                    const raw = key(compareAnalysisData[sym]);
                                                                    if (raw === undefined || raw === null || raw === '' || raw === 'N/A') return null;
                                                                    const num = parseFloat(String(raw).replace(/[,%]/g,''));
                                                                    return isNaN(num) ? String(raw) : num;
                                                                  });
                                                                  const numericVals = vals.filter(v => typeof v === 'number') as number[];
                                                                  const maxVal = numericVals.length > 1 ? Math.max(...numericVals) : null;
                                                                  const minVal = numericVals.length > 1 ? Math.min(...numericVals) : null;

                                                                  return (
                                                                    <tr key={idx} className="border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors">
                                                                      <td className="py-2 px-3 text-gray-400">{label}</td>
                                                                      {compareSymbols.map((sym, si) => {
                                                                        const val = vals[si];
                                                                        const isMax = typeof val === 'number' && val === maxVal && numericVals.length > 1;
                                                                        const isMin = typeof val === 'number' && val === minVal && numericVals.length > 1 && minVal !== maxVal;
                                                                        const lowerIsBetter = label.includes('Debt') || label.includes('Beta') || label.includes('P/E') || label.includes('P/B');
                                                                        const showGreen = lowerIsBetter ? isMin : isMax;
                                                                        const showRed = lowerIsBetter ? isMax : isMin;
                                                                        return (
                                                                          <td key={sym} className={`text-right py-2 px-3 font-mono whitespace-nowrap ${val === null ? 'text-gray-600' : showGreen ? 'text-green-400 font-semibold' : showRed ? 'text-red-400' : 'text-gray-200'}`}>
                                                                            {val === null ? '—' : typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : val}
                                                                            {showGreen && <span className="ml-1 text-[9px] text-green-500">▲</span>}
                                                                            {showRed && <span className="ml-1 text-[9px] text-red-500">▼</span>}
                                                                          </td>
                                                                        );
                                                                      })}
                                                                    </tr>
                                                                  );
                                                                })}
                                                              </tbody>
                                                            </table>
                                                          </div>
                                                          <p className="text-[11px] text-gray-600 italic">Green ▲ = better value. Red ▼ = weaker value relative to peers.</p>
                                                        </div>
                                                      );
                                                    })()}

                                                    {/* ── INSIGHTS TAB ── */}
                                                    {compareActiveTab === 'insights' && (() => {
                                                      // Broad label matcher — covers Screener.in, Yahoo Finance & NSE label variants
                                                      const getPnLValue = (sym: string, hints: string[], yi = 0): number | null => {
                                                        const rows: any[] = compareAnalysisData[sym]?.annualFinancials?.profitLoss || [];
                                                        for (const hint of hints) {
                                                          const row = rows.find((r: any) => r.label?.toLowerCase().includes(hint.toLowerCase()));
                                                          if (row) {
                                                            const v = row.values?.[yi]?.value;
                                                            if (v !== undefined && v !== null) {
                                                              const n = parseFloat(String(v).replace(/,/g, ''));
                                                              if (!isNaN(n)) return n;
                                                            }
                                                          }
                                                        }
                                                        return null;
                                                      };
                                                      const REV_HINTS  = ['revenue from operations','revenue','net revenue','total revenue','total income','net sales','sales','operating income','income from operations'];
                                                      const NP_HINTS   = ['net profit','profit after tax','pat','profit for the year','net income','profit attributable'];
                                                      const getSymYears = (sym: string) => (compareAnalysisData[sym]?.annualFinancials?.years || []).slice(0, 5).reverse();
                                                      const allYearsI = (() => {
                                                        const sets = compareSymbols.map(s => getSymYears(s));
                                                        return sets.reduce((a: string[], b: string[]) => a.length >= b.length ? a : b, []);
                                                      })();
                                                      const revTrend = allYearsI.map(yr => {
                                                        const row: any = { year: yr };
                                                        compareSymbols.forEach(sym => {
                                                          const sy = getSymYears(sym); const idx = sy.indexOf(yr);
                                                          if (idx !== -1) { const v = getPnLValue(sym, REV_HINTS, idx); if (v !== null) row[sym] = v; }
                                                        }); return row;
                                                      });
                                                      const npTrend = allYearsI.map(yr => {
                                                        const row: any = { year: yr };
                                                        compareSymbols.forEach(sym => {
                                                          const sy = getSymYears(sym); const idx = sy.indexOf(yr);
                                                          if (idx !== -1) { const v = getPnLValue(sym, NP_HINTS, idx); if (v !== null) row[sym] = v; }
                                                        }); return row;
                                                      });
                                                      const marginTrend = allYearsI.map(yr => {
                                                        const row: any = { year: yr };
                                                        compareSymbols.forEach(sym => {
                                                          const sy = getSymYears(sym); const idx = sy.indexOf(yr);
                                                          if (idx !== -1) {
                                                            const rev = getPnLValue(sym, REV_HINTS, idx);
                                                            const np  = getPnLValue(sym, NP_HINTS, idx);
                                                            if (rev !== null && np !== null) row[sym] = (rev > 0) ? parseFloat(((np/rev)*100).toFixed(2)) : null;
                                                          }
                                                        }); return row;
                                                      });
                                                      const scoreCards = compareSymbols.map((sym, si) => {
                                                        const d = compareAnalysisData[sym];
                                                        let score = 0, total = 0;
                                                        const flags: {label:string;value:string;good:boolean}[] = [];
                                                        const parse = (s: any) => parseFloat(String(s||'').replace(/[%,]/g,''));
                                                        const roe = parse(d?.keyMetrics?.roe || d?.fundamentals?.roe);
                                                        if (!isNaN(roe)) { total++; const g = roe>=15; if(g) score++; flags.push({label:'ROE',value:`${roe.toFixed(1)}%`,good:g}); }
                                                        const roce = parse(d?.keyMetrics?.roce || d?.fundamentals?.roce);
                                                        if (!isNaN(roce)) { total++; const g = roce>=15; if(g) score++; flags.push({label:'ROCE',value:`${roce.toFixed(1)}%`,good:g}); }
                                                        const de = parse(d?.keyMetrics?.debtToEquity || d?.fundamentals?.debtToEquity);
                                                        if (!isNaN(de)) { total++; const g = de<1; if(g) score++; flags.push({label:'D/E',value:de.toFixed(2),good:g}); }
                                                        const cr = parse(d?.keyMetrics?.currentRatio || d?.fundamentals?.currentRatio);
                                                        if (!isNaN(cr)) { total++; const g = cr>=1.5; if(g) score++; flags.push({label:'Curr.Ratio',value:cr.toFixed(2),good:g}); }
                                                        const pe = parse(d?.keyMetrics?.pe || d?.fundamentals?.pe);
                                                        if (!isNaN(pe) && pe>0) { total++; const g = pe<30; if(g) score++; flags.push({label:'P/E',value:pe.toFixed(1),good:g}); }
                                                        const qd = compareQuarterlyData[sym] || [];
                                                        const ps = qd.map((q:any)=>parseFloat((q.net_profit||'0').toString().replace(/,/g,''))).filter(Boolean);
                                                        if (ps.length>=2) { total++; const g = ps[ps.length-1]>ps[0]; if(g) score++; const gr = ((ps[ps.length-1]-ps[0])/Math.abs(ps[0]))*100; flags.push({label:'Profit Growth',value:`${gr>=0?'+':''}${gr.toFixed(1)}%`,good:g}); }
                                                        const dy = parse(d?.keyMetrics?.dividendYield || d?.fundamentals?.dividendYield);
                                                        if (!isNaN(dy) && dy>0) { total++; const g = dy>=1; if(g) score++; flags.push({label:'Div Yield',value:`${dy.toFixed(2)}%`,good:g}); }
                                                        const pm = parse(d?.keyMetrics?.profitMargin);
                                                        if (!isNaN(pm)) { total++; const g = pm>=10; if(g) score++; flags.push({label:'Margin',value:`${pm.toFixed(1)}%`,good:g}); }
                                                        const pct = total>0 ? Math.round((score/total)*100) : 0;
                                                        const verdict = total===0 ? 'Awaiting Data' : pct>=70 ? 'Strongly +ve' : pct>=50 ? 'Moderately +ve' : pct>=35 ? 'Neutral' : '-ve';
                                                        const vc = total===0 ? '#6b7280' : pct>=70 ? '#34d399' : pct>=50 ? '#60a5fa' : pct>=35 ? '#fbbf24' : '#f87171';
                                                        return {sym, score, total, pct, flags, verdict, vc, color: COLORS[si]};
                                                      });
                                                      const norm = (v: number|null, mn: number, mx: number) => v===null||isNaN(v) ? 0 : Math.min(100,Math.max(0,((v-mn)/(mx-mn))*100));
                                                      const radarData = ['ROE','ROCE','Low D/E','Net Margin','Div Yield'].map(metric => {
                                                        const row: any = {metric};
                                                        compareSymbols.forEach(sym => {
                                                          const d = compareAnalysisData[sym];
                                                          const p = (s:any) => parseFloat(String(s||'').replace(/[%,]/g,''));
                                                          if (metric==='ROE') row[sym] = norm(p(d?.keyMetrics?.roe||d?.fundamentals?.roe),0,40);
                                                          else if (metric==='ROCE') row[sym] = norm(p(d?.keyMetrics?.roce||d?.fundamentals?.roce),0,40);
                                                          else if (metric==='Low D/E') { const v=p(d?.keyMetrics?.debtToEquity||d?.fundamentals?.debtToEquity); row[sym]=norm(isNaN(v)?null:Math.max(0,3-v),0,3); }
                                                          else if (metric==='Net Margin') row[sym] = norm(p(d?.keyMetrics?.profitMargin),0,40);
                                                          else if (metric==='Div Yield') row[sym] = norm(p(d?.keyMetrics?.dividendYield||d?.fundamentals?.dividendYield),0,5);
                                                        }); return row;
                                                      });
                                                      if (!compareSymbols.some(s => compareAnalysisData[s])) return (
                                                        <div className="text-center py-8"><p className="text-xs text-gray-500">Run Compare Analysis first to see Insights</p></div>
                                                      );
                                                      return (
                                                        <div className="space-y-5">
                                                          {/* Score cards */}
                                                          <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                                                              <span className="text-xs font-bold text-gray-200 uppercase tracking-wide">Fundamental Score Cards</span>
                                                              <span className="text-[10px] text-gray-600 ml-1">— rules-based · real data only</span>
                                                            </div>
                                                            <div className={`grid gap-3 ${compareSymbols.length > 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                                              {scoreCards.map(sc => (
                                                                <div key={sc.sym} className="rounded-xl border border-gray-700/50 p-3 bg-gray-800/40 space-y-2">
                                                                  <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-bold" style={{color:sc.color}}>{sc.sym}</span>
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{background:sc.vc+'22',color:sc.vc}}>{sc.verdict}</span>
                                                                  </div>
                                                                  <div>
                                                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                                      <span>Score</span>
                                                                      <span className="font-mono" style={{color:sc.vc}}>{sc.score}/{sc.total} ({sc.pct}%)</span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                                                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${sc.pct}%`,background:sc.vc}} />
                                                                    </div>
                                                                  </div>
                                                                  <div className="flex flex-wrap gap-1">
                                                                    {sc.flags.map((f,fi) => (
                                                                      <span key={fi} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${f.good ? 'bg-green-900/40 text-green-400 border border-green-800/40' : 'bg-red-900/30 text-red-400 border border-red-900/30'}`}>
                                                                        {f.label}: {f.value}
                                                                      </span>
                                                                    ))}
                                                                  </div>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          </div>

                                                          {/* Radar chart */}
                                                          <div className="rounded-xl border border-gray-700/50 p-3 bg-gray-800/30">
                                                            <span className="text-xs font-semibold text-gray-300 block mb-2">Fundamental Radar — Normalised 0–100 (higher = better)</span>
                                                            <div className="h-52 w-full">
                                                              <ResponsiveContainer width="100%" height="100%">
                                                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                                                                  <PolarGrid stroke="#374151" />
                                                                  <PolarAngleAxis dataKey="metric" tick={{fill:'#9ca3af',fontSize:10}} />
                                                                  <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:'#6b7280',fontSize:8}} tickCount={4} />
                                                                  {compareSymbols.map((sym,i) => (
                                                                    <Radar key={sym} name={sym} dataKey={sym} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.18} strokeWidth={2} dot={{r:3,fill:COLORS[i]}} />
                                                                  ))}
                                                                  <Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'8px',fontSize:'11px'}} formatter={(v:any)=>[`${Number(v).toFixed(0)}/100`]} />
                                                                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px',paddingTop:'4px'}} />
                                                                </RadarChart>
                                                              </ResponsiveContainer>
                                                            </div>
                                                            <p className="text-[10px] text-gray-600 text-center mt-1">D/E axis inverted — lower debt scores higher. Based on scraped data.</p>
                                                          </div>

                                                          {/* Revenue trend */}
                                                          {revTrend.some(r => compareSymbols.some(s => r[s] != null)) && (
                                                            <div className="rounded-xl border border-gray-700/50 p-3 bg-gray-800/30">
                                                              <span className="text-xs font-semibold text-gray-300 block mb-2">Revenue Trend — Annual (₹ Cr)</span>
                                                              <div className="h-40 w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                  <LineChart data={revTrend} margin={{top:5,right:10,left:0,bottom:5}}>
                                                                    <XAxis dataKey="year" tick={{fontSize:9,fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                                                                    <YAxis tick={{fontSize:8,fill:'#6b7280'}} tickFormatter={(v:number)=>v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v}`} axisLine={false} tickLine={false} width={44} />
                                                                    <Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'8px',fontSize:'11px'}} formatter={(v:any,n:any)=>[`₹${Number(v).toLocaleString()} Cr`,n]} />
                                                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}} />
                                                                    {compareSymbols.map((sym,i) => (
                                                                      <Line key={sym} type="monotone" dataKey={sym} stroke={COLORS[i]} strokeWidth={2} dot={{r:3,fill:COLORS[i]}} connectNulls />
                                                                    ))}
                                                                  </LineChart>
                                                                </ResponsiveContainer>
                                                              </div>
                                                            </div>
                                                          )}

                                                          {/* Net Profit trend */}
                                                          {npTrend.some(r => compareSymbols.some(s => r[s] != null)) && (
                                                            <div className="rounded-xl border border-gray-700/50 p-3 bg-gray-800/30">
                                                              <span className="text-xs font-semibold text-gray-300 block mb-2">Net Profit Trend — Annual (₹ Cr)</span>
                                                              <div className="h-40 w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                  <LineChart data={npTrend} margin={{top:5,right:10,left:0,bottom:5}}>
                                                                    <XAxis dataKey="year" tick={{fontSize:9,fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                                                                    <YAxis tick={{fontSize:8,fill:'#6b7280'}} tickFormatter={(v:number)=>v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v}`} axisLine={false} tickLine={false} width={44} />
                                                                    <Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'8px',fontSize:'11px'}} formatter={(v:any,n:any)=>[`₹${Number(v).toLocaleString()} Cr`,n]} />
                                                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}} />
                                                                    {compareSymbols.map((sym,i) => (
                                                                      <Line key={sym} type="monotone" dataKey={sym} stroke={COLORS[i]} strokeWidth={2} dot={{r:3,fill:COLORS[i]}} connectNulls />
                                                                    ))}
                                                                  </LineChart>
                                                                </ResponsiveContainer>
                                                              </div>
                                                            </div>
                                                          )}

                                                          {/* Net Profit Margin trend */}
                                                          {marginTrend.some(r => compareSymbols.some(s => r[s] != null)) && (
                                                            <div className="rounded-xl border border-gray-700/50 p-3 bg-gray-800/30">
                                                              <span className="text-xs font-semibold text-gray-300 block mb-2">Net Profit Margin Trend (%)</span>
                                                              <div className="h-36 w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                  <AreaChart data={marginTrend} margin={{top:5,right:10,left:0,bottom:5}}>
                                                                    <defs>
                                                                      {compareSymbols.map((sym,i) => (
                                                                        <linearGradient key={sym} id={`mgGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                                                                          <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.3} />
                                                                          <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
                                                                        </linearGradient>
                                                                      ))}
                                                                    </defs>
                                                                    <XAxis dataKey="year" tick={{fontSize:9,fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                                                                    <YAxis tick={{fontSize:8,fill:'#6b7280'}} tickFormatter={(v:number)=>`${v.toFixed(0)}%`} axisLine={false} tickLine={false} width={36} />
                                                                    <Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'8px',fontSize:'11px'}} formatter={(v:any,n:any)=>[`${Number(v).toFixed(2)}%`,n]} />
                                                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}} />
                                                                    {compareSymbols.map((sym,i) => (
                                                                      <Area key={sym} type="monotone" dataKey={sym} stroke={COLORS[i]} fill={`url(#mgGrad${i})`} strokeWidth={2} dot={{r:2.5,fill:COLORS[i]}} connectNulls />
                                                                    ))}
                                                                  </AreaChart>
                                                                </ResponsiveContainer>
                                                              </div>
                                                            </div>
                                                          )}

                                                          {/* Quarterly net profit bar */}
                                                          {chartRows.length > 0 && (
                                                            <div className="rounded-xl border border-gray-700/50 p-3 bg-gray-800/30">
                                                              <span className="text-xs font-semibold text-gray-300 block mb-2">Quarterly Net Profit (₹ Cr) — Last 6 Quarters</span>
                                                              <div className="h-40 w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                  <BarChart data={chartRows.slice(-6)} margin={{top:5,right:10,left:0,bottom:5}}>
                                                                    <XAxis dataKey="quarter" tick={{fontSize:9,fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                                                                    <YAxis tick={{fontSize:8,fill:'#6b7280'}} tickFormatter={(v:number)=>`₹${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={40} />
                                                                    <Tooltip contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'8px',fontSize:'11px'}} formatter={(v:any,n:any)=>[`₹${Number(v).toLocaleString()} Cr`,n]} />
                                                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}} />
                                                                    {compareSymbols.map((sym,i) => (
                                                                      <Bar key={sym} dataKey={sym} fill={COLORS[i]} radius={[3,3,0,0]} maxBarSize={28} />
                                                                    ))}
                                                                  </BarChart>
                                                                </ResponsiveContainer>
                                                              </div>
                                                            </div>
                                                          )}

                                                          {/* Deep AI Insights panel */}
                                                          <div className="rounded-xl border border-purple-800/40 bg-purple-900/10 p-4 space-y-4">
                                                            <div className="flex items-center gap-2">
                                                              <Sparkles className="h-4 w-4 text-purple-400" />
                                                              <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">Advanced Analysis — Deep Insights</span>
                                                              <span className="ml-auto text-[9px] text-gray-600 italic">Rules-based · No AI hallucinations · Real data only</span>
                                                            </div>
                                                            {scoreCards.map(sc => {
                                                              const d = compareAnalysisData[sc.sym];
                                                              const p = (s:any) => parseFloat(String(s||'').replace(/[%,]/g,''));
                                                              const qd = compareQuarterlyData[sc.sym] || [];
                                                              const ps = qd.map((q:any)=>parseFloat((q.net_profit||'0').toString().replace(/,/g,''))).filter(Boolean);
                                                              const qtdGrowth = ps.length>=2 ? ((ps[ps.length-1]-ps[0])/Math.abs(ps[0]))*100 : null;
                                                              const roe = p(d?.keyMetrics?.roe||d?.fundamentals?.roe);
                                                              const roce = p(d?.keyMetrics?.roce||d?.fundamentals?.roce);
                                                              const de = p(d?.keyMetrics?.debtToEquity||d?.fundamentals?.debtToEquity);
                                                              const pe = p(d?.keyMetrics?.pe||d?.fundamentals?.pe);
                                                              const pm = p(d?.keyMetrics?.profitMargin);
                                                              const bv = p(d?.keyMetrics?.bookValue||d?.fundamentals?.bookValue);
                                                              const pb = p(d?.keyMetrics?.pb||d?.fundamentals?.pb);
                                                              const lines: string[] = [];
                                                              if (!isNaN(roe)) lines.push(roe>=20 ? `✅ Excellent ROE of ${roe.toFixed(1)}% — top-tier capital efficiency` : roe>=15 ? `✅ Healthy ROE of ${roe.toFixed(1)}% — good shareholder returns` : `⚠️ ROE of ${roe.toFixed(1)}% is below 15% threshold — moderate returns`);
                                                              if (!isNaN(roce)) lines.push(roce>=20 ? `✅ Strong ROCE ${roce.toFixed(1)}% — efficient capital deployment` : roce>=15 ? `✅ Decent ROCE ${roce.toFixed(1)}%` : `⚠️ ROCE ${roce.toFixed(1)}% below benchmark — room to improve`);
                                                              if (!isNaN(de)) lines.push(de<0.3 ? `✅ Nearly debt-free (D/E: ${de.toFixed(2)}) — very strong balance sheet` : de<1 ? `✅ Conservative leverage (D/E: ${de.toFixed(2)}) — well managed` : de<2 ? `📊 Moderate debt (D/E: ${de.toFixed(2)}) — acceptable for the sector` : `⚠️ High D/E ratio of ${de.toFixed(2)} — elevated financial risk`);
                                                              if (!isNaN(pe) && pe>0) lines.push(pe<12 ? `💎 P/E of ${pe.toFixed(1)}x — potentially deeply undervalued` : pe<20 ? `✅ Reasonable P/E ${pe.toFixed(1)}x — value zone` : pe<35 ? `📊 P/E of ${pe.toFixed(1)}x — growth premium priced in` : `⚠️ Elevated P/E ${pe.toFixed(1)}x — high expectations; limited margin of safety`);
                                                              if (!isNaN(pb) && pb>0 && !isNaN(bv)) lines.push(pb<1.5 ? `💎 P/B of ${pb.toFixed(2)}x — trading near book value` : pb<3 ? `📊 P/B of ${pb.toFixed(2)}x — moderate premium to book` : `📊 P/B of ${pb.toFixed(2)}x — market values strong intangibles/franchise`);
                                                              if (!isNaN(pm)) lines.push(pm>=25 ? `✅ Exceptional margin of ${pm.toFixed(1)}% — pricing power & cost discipline` : pm>=15 ? `✅ Strong net margin ${pm.toFixed(1)}%` : pm>=8 ? `📊 Decent margin ${pm.toFixed(1)}%` : `⚠️ Thin net margin ${pm.toFixed(1)}% — watch for cost pressures`);
                                                              if (qtdGrowth!==null) lines.push(qtdGrowth>=20 ? `📈 Strong profit momentum: +${qtdGrowth.toFixed(1)}% over ${qd.length} quarters` : qtdGrowth>=5 ? `📈 Steady profit growth of +${qtdGrowth.toFixed(1)}%` : qtdGrowth>=0 ? `📊 Modest profit growth of +${qtdGrowth.toFixed(1)}% — stable` : `📉 Profit contracted ${Math.abs(qtdGrowth).toFixed(1)}% over ${qd.length} quarters — monitor closely`);
                                                              return (
                                                                <div key={sc.sym} className="space-y-1.5 pt-3 border-t border-purple-800/20 first:border-t-0 first:pt-0">
                                                                  <div className="flex items-center gap-2">
                                                                    <span className="w-2.5 h-2.5 rounded-full" style={{background:sc.color}} />
                                                                    <span className="text-xs font-bold" style={{color:sc.color}}>{sc.sym}</span>
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{background:sc.vc+'22',color:sc.vc}}>{sc.verdict}</span>
                                                                    {sc.total > 0 && <span className="ml-auto text-[10px] text-gray-500">{sc.score}/{sc.total} criteria met</span>}
                                                                  </div>
                                                                  {lines.length > 0 ? (
                                                                    <div className="space-y-1 pl-4">
                                                                      {lines.map((line,li)=>(
                                                                        <p key={li} className="text-[11px] text-gray-300 leading-relaxed">{line}</p>
                                                                      ))}
                                                                    </div>
                                                                  ) : (
                                                                    <p className="text-[11px] text-gray-500 pl-4 italic">Fundamental data not yet available — try re-running Compare Analysis.</p>
                                                                  )}
                                                                </div>
                                                              );
                                                            })}
                                                            {scoreCards.filter(sc => sc.total > 0).length >= 2 && (() => {
                                                              const ranked = [...scoreCards].filter(sc => sc.total > 0).sort((a,b)=>b.pct-a.pct);
                                                              const w = ranked[0]; const l = ranked[ranked.length-1];
                                                              const gap = w.pct - l.pct;
                                                              return (
                                                                <div className="pt-3 border-t border-purple-800/30 space-y-1">
                                                                  <p className="text-[11px] text-gray-200">
                                                                    🏆 <span className="font-semibold" style={{color:w.color}}>{w.sym}</span> leads with a fundamental score of <span style={{color:w.vc}}>{w.pct}%</span>
                                                                    {l.sym !== w.sym && <> vs <span className="font-semibold" style={{color:l.color}}>{l.sym}</span>'s <span style={{color:l.vc}}>{l.pct}%</span></>}.
                                                                  </p>
                                                                  {gap >= 20 && (
                                                                    <p className="text-[11px] text-yellow-400">⚡ Significant gap of {gap}% — fundamentals strongly favour <span className="font-semibold">{w.sym}</span>.</p>
                                                                  )}
                                                                  {gap < 10 && gap > 0 && (
                                                                    <p className="text-[11px] text-blue-400">⚖️ Close contest — both stocks show comparable fundamentals. Sector & valuation timing matters.</p>
                                                                  )}
                                                                  <p className="text-[10px] text-gray-600 mt-1 italic">ℹ️ For informational purposes only — not investment advice. Consult a SEBI-registered advisor.</p>
                                                                </div>
                                                              );
                                                            })()}
                                                          </div>
                                                        </div>
                                                      );
                                                    })()}

                                                  </div>
                                                </div>
                                              );
                                            })()}
                                          </div>

                                          </div>
                                        );
}
