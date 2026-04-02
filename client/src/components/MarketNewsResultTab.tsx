import {
  Newspaper,
  RefreshCw,
  Loader2,
  Sparkles,
  Brain,
  X,
  ExternalLink,
} from "lucide-react";

interface WatchlistStock {
  symbol: string;
  name: string;
  token: string;
  exchange: string;
  displayName: string;
  tradingSymbol: string;
}

interface NewsItem {
  title: string;
  url: string;
  description?: string;
  source: string;
  publishedAt: string;
  symbol: string;
  displayName: string;
}

interface AllNewsItem {
  title: string;
  url: string;
  description?: string;
  source: string;
  publishedAt: string;
  sector: string;
  displayName: string;
}

interface StockPrice {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  chartData: Array<{ price: number; time: string }>;
}

interface AiAnalysis {
  overallSentiment: string;
  marketMood: string;
  trendingSectors: Array<{
    rank: number;
    sector: string;
    sentiment: string;
    investmentSignal: string;
    keyTheme: string;
    articleCount: number;
    score: number;
  }>;
  keyEvents: Array<{ event: string; implication: string; impact: string }>;
  opportunities: Array<{ sector: string; opportunity: string; confidence: number; timeframe: string }>;
  riskAlerts: Array<{ risk: string; severity: string; mitigation: string }>;
  weeklyOutlook: string;
  totalArticles: number;
  sectorCounts: Record<string, number>;
}

interface MarketNewsResultTabProps {
  marketNewsMode: 'all' | 'watchlist' | 'nifty50';
  setMarketNewsMode: (mode: 'all' | 'watchlist' | 'nifty50') => void;
  allMarketNewsItems: AllNewsItem[];
  isAllMarketNewsLoading: boolean;
  nifty50NewsItems: NewsItem[];
  isNifty50NewsLoading: boolean;
  marketNewsItems: NewsItem[];
  isMarketNewsLoading: boolean;
  newsSelectedSector: string | null;
  setNewsSelectedSector: (sector: string | null) => void;
  showNewsAiPanel: boolean;
  setShowNewsAiPanel: (show: boolean) => void;
  newsAiAnalysis: AiAnalysis | null;
  setNewsAiAnalysis: (analysis: AiAnalysis | null) => void;
  isNewsAiAnalysisLoading: boolean;
  setIsNewsAiAnalysisLoading: (loading: boolean) => void;
  newsAiAnalysisError: string | null;
  setNewsAiAnalysisError: (error: string | null) => void;
  newsStockPrices: { [symbol: string]: StockPrice };
  watchlistSymbols: WatchlistStock[];
  fetchMarketNews: () => void;
  fetchAllMarketNews: () => void;
  fetchNifty50News: () => void;
  getWatchlistNewsRelativeTime: (publishedAt: string) => string;
}

const NIFTY50_SECTOR_MAP: Record<string, string> = {
  ADANIENT: 'Commodity', ADANIPORTS: 'Commodity', COALINDIA: 'Commodity',
  HINDALCO: 'Commodity', JSWSTEEL: 'Commodity', TATASTEEL: 'Commodity',
  ULTRACEMCO: 'Commodity', UPL: 'Commodity', NTPC: 'Commodity',
  ONGC: 'Commodity', POWERGRID: 'Commodity', BPCL: 'Commodity',
  RELIANCE: 'Commodity', CRUDEOIL: 'Commodity', GOLD: 'Commodity', SILVER: 'Commodity',
  HCLTECH: 'IT', INFY: 'IT', TCS: 'IT', TECHM: 'IT', WIPRO: 'IT', LTIM: 'IT',
  AXISBANK: 'Finance', BAJFINANCE: 'Finance', BAJAJFINSV: 'Finance',
  HDFCBANK: 'Finance', HDFCLIFE: 'Finance', ICICIBANK: 'Finance',
  INDUSINDBK: 'Finance', KOTAKBANK: 'Finance', SBILIFE: 'Finance', SBIN: 'Finance',
  'BAJAJ-AUTO': 'Auto', EICHERMOT: 'Auto', HEROMOTOCO: 'Auto',
  'M&M': 'Auto', MARUTI: 'Auto', TATAMOTORS: 'Auto',
  APOLLOHOSP: 'Pharma', CIPLA: 'Pharma', DIVISLAB: 'Pharma', DRREDDY: 'Pharma', SUNPHARMA: 'Pharma',
  ASIANPAINT: 'Consumer', BRITANNIA: 'Consumer', HINDUNILVR: 'Consumer',
  ITC: 'Consumer', NESTLEIND: 'Consumer', TATACONSUM: 'Consumer', TITAN: 'Consumer',
  BHARTIARTL: 'Market', GRASIM: 'Market', LT: 'Market',
  SENSEX: 'Market', NIFTY: 'Market', BANKNIFTY: 'Market',
};

const allSectors = ['Market', 'IT', 'Finance', 'Commodity', 'Defence', 'AI & Tech', 'Pharma', 'Consumer', 'Economy', 'Auto'];
const nifty50Sectors = ['IT', 'Finance', 'Auto', 'Pharma', 'Consumer', 'Commodity', 'Market'];
const sectorColors: Record<string, string> = {
  Market: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IT: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Finance: 'bg-green-500/15 text-green-400 border-green-500/30',
  Commodity: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Defence: 'bg-red-500/15 text-red-400 border-red-500/30',
  'AI & Tech': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Pharma: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  Consumer: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Economy: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  Auto: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

export function MarketNewsResultTab({
  marketNewsMode,
  setMarketNewsMode,
  allMarketNewsItems,
  isAllMarketNewsLoading,
  nifty50NewsItems,
  isNifty50NewsLoading,
  marketNewsItems,
  isMarketNewsLoading,
  newsSelectedSector,
  setNewsSelectedSector,
  showNewsAiPanel,
  setShowNewsAiPanel,
  newsAiAnalysis,
  setNewsAiAnalysis,
  isNewsAiAnalysisLoading,
  setIsNewsAiAnalysisLoading,
  newsAiAnalysisError,
  setNewsAiAnalysisError,
  newsStockPrices,
  watchlistSymbols,
  fetchMarketNews,
  fetchAllMarketNews,
  fetchNifty50News,
  getWatchlistNewsRelativeTime,
}: MarketNewsResultTabProps) {
  const isAllMode = marketNewsMode === 'all';
  const isNifty50Mode = marketNewsMode === 'nifty50';
  const loading = isAllMode ? isAllMarketNewsLoading : isNifty50Mode ? isNifty50NewsLoading : isMarketNewsLoading;
  const rawNewsItems = isAllMode ? allMarketNewsItems : isNifty50Mode ? nifty50NewsItems : marketNewsItems;

  const newsItems = newsSelectedSector
    ? rawNewsItems.filter((item: any) => {
        if (isAllMode) return (item.sector || item.displayName) === newsSelectedSector;
        if (isNifty50Mode) return (NIFTY50_SECTOR_MAP[item.symbol] || 'Market') === newsSelectedSector;
        return true;
      })
    : rawNewsItems;

  const tagColor = isAllMode ? 'bg-purple-500/20 text-purple-400' : isNifty50Mode ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400';
  const emptyMsg = isAllMode ? 'Click Refresh to load latest market news' : isNifty50Mode ? 'Click Refresh to load Nifty 50 news' : 'Add stocks to your watchlist or click Refresh';
  const loadingMsg = isAllMode ? 'Fetching news across all sectors...' : isNifty50Mode ? 'Fetching Nifty 50 stock news...' : `Fetching news from ${watchlistSymbols.length} stocks...`;

  const handleRefresh = () => {
    if (isAllMode) fetchAllMarketNews();
    else if (isNifty50Mode) fetchNifty50News();
    else fetchMarketNews();
  };

  const getItemSector = (item: any): string => {
    if (isAllMode) return item.sector || item.displayName || 'Market';
    if (isNifty50Mode) return NIFTY50_SECTOR_MAP[item.symbol] || 'Market';
    return item.displayName || 'Market';
  };

  const handleAiAnalysis = () => {
    if (rawNewsItems.length === 0) return;
    setIsNewsAiAnalysisLoading(true);
    setShowNewsAiPanel(true);
    setNewsAiAnalysis(null);
    setNewsAiAnalysisError(null);

    setTimeout(() => {
      try {
        const BULLISH_KW = ['surge', 'jump', 'rally', 'record high', 'gain', 'rise', 'beat', 'profit', 'growth', 'expand', 'outperform', 'strong', 'recover', 'upgrade', 'win', 'deal', 'order', 'breakthrough', 'positive', 'soar', 'climb', 'high'];
        const BEARISH_KW = ['fall', 'drop', 'slump', 'crash', 'loss', 'decline', 'weak', 'miss', 'cut', 'debt', 'concern', 'risk', 'warn', 'downgrade', 'layoff', 'fraud', 'probe', 'scrutiny', 'sell', 'tumble', 'plunge', 'low', 'pressure', 'selloff'];
        const EVENT_KW = ['rbi', 'sebi', 'merger', 'acquisition', 'ipo', 'policy', 'rate', 'quarterly results', 'gdp', 'budget', 'fii', 'dii', 'q4', 'q3', 'q2', 'q1', 'inflation', 'capex'];

        const sectorScores: Record<string, { bull: number; bear: number; total: number; titles: string[] }> = {};
        const keyEvents: any[] = [];
        const seenEvents = new Set<string>();

        rawNewsItems.forEach((item: any) => {
          const sector = getItemSector(item);
          const t = (item.title || '').toLowerCase();
          if (!sectorScores[sector]) sectorScores[sector] = { bull: 0, bear: 0, total: 0, titles: [] };
          sectorScores[sector].total++;
          sectorScores[sector].titles.push(item.title || '');
          const bullHits = BULLISH_KW.filter(k => t.includes(k)).length;
          const bearHits = BEARISH_KW.filter(k => t.includes(k)).length;
          sectorScores[sector].bull += bullHits;
          sectorScores[sector].bear += bearHits;
          const isEvent = EVENT_KW.some(k => t.includes(k));
          if (isEvent && keyEvents.length < 6 && !seenEvents.has(item.title)) {
            seenEvents.add(item.title);
            const impact = bearHits > 0 ? 'HIGH' : bullHits > 0 ? 'MEDIUM' : 'LOW';
            keyEvents.push({ event: item.title, implication: `Impact on ${sector} sector`, impact });
          }
        });

        let totalBull = 0, totalBear = 0;
        Object.values(sectorScores).forEach(s => { totalBull += s.bull; totalBear += s.bear; });
        const overallSentiment = totalBull > totalBear * 1.3 ? 'BULLISH' : totalBear > totalBull * 1.3 ? 'BEARISH' : 'NEUTRAL';
        const marketMood = overallSentiment === 'BULLISH'
          ? 'Markets showing positive momentum with broad-based buying interest across key sectors.'
          : overallSentiment === 'BEARISH'
          ? 'Markets under pressure with selling across multiple sectors amid macro headwinds.'
          : 'Markets consolidating with mixed signals — selective opportunities remain.';

        const trendingSectors = Object.entries(sectorScores)
          .filter(([, s]) => s.total >= 1)
          .map(([sector, s]) => {
            const net = s.bull - s.bear;
            const sentiment = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';
            const signal = net > 1 ? 'BUY' : net < -1 ? 'SELL' : 'WATCH';
            const theme = s.titles.slice(0, 2).join(' · ').substring(0, 80) + (s.titles.length > 2 ? '…' : '');
            return { sector, sentiment, investmentSignal: signal, keyTheme: theme || `${s.total} articles`, articleCount: s.total, score: Math.abs(net) * 10 + s.total };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map((s, i) => ({ ...s, rank: i + 1 }));

        const opportunities = trendingSectors
          .filter(s => s.investmentSignal === 'BUY')
          .slice(0, 3)
          .map(s => ({ sector: s.sector, opportunity: `${s.sector} sector showing bullish momentum with ${sectorScores[s.sector]?.total || 0} positive news catalysts`, confidence: Math.min(90, 55 + (sectorScores[s.sector]?.bull || 0) * 5), timeframe: 'short' }));

        const riskAlerts = trendingSectors
          .filter(s => s.investmentSignal === 'SELL')
          .slice(0, 3)
          .map(s => ({ risk: `${s.sector} under pressure`, severity: sectorScores[s.sector]?.bear > 3 ? 'HIGH' : 'MEDIUM', mitigation: `Monitor stop-loss levels; wait for stabilisation before adding positions in ${s.sector}` }));

        const topBull = trendingSectors.find(s => s.sentiment === 'positive')?.sector || 'IT';
        const weeklyOutlook = `Based on ${rawNewsItems.length} articles across ${Object.keys(sectorScores).length} sectors — ${topBull} leads with positive sentiment. ${overallSentiment === 'BULLISH' ? 'Broader market trend favours longs; manage risk with trailing stops.' : overallSentiment === 'BEARISH' ? 'Defensive posture advised; prefer quality large-caps and reduce leverage.' : 'Stock-specific approach recommended; focus on earnings-driven catalysts.'}`;

        setNewsAiAnalysis({ overallSentiment, marketMood, trendingSectors, keyEvents, opportunities, riskAlerts, weeklyOutlook, totalArticles: rawNewsItems.length, sectorCounts: Object.fromEntries(Object.entries(sectorScores).map(([k, v]) => [k, v.total])) });
      } catch (e) {
        console.error('Local analysis error:', e);
        setNewsAiAnalysisError('Analysis failed. Please try again.');
      } finally {
        setIsNewsAiAnalysisLoading(false);
      }
    }, 600);
  };

  return (
    <div className="w-full rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <Newspaper className="h-3.5 w-3.5 text-gray-400" />
          {rawNewsItems.length > 0 && (
            <span className="text-[11px] text-gray-600">
              {newsSelectedSector
                ? `${newsItems.length} articles · ${newsSelectedSector}`
                : isAllMode
                  ? `${rawNewsItems.length} articles · last 7 days`
                  : isNifty50Mode
                    ? `${rawNewsItems.length} articles · 50 stocks`
                    : `${watchlistSymbols.length} stocks · last 7 days`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Pill tab switcher */}
          <div
            className="flex items-center p-0.5 rounded-full"
            style={{ background: '#111' }}
            data-testid="market-news-tab-switcher"
          >
            {[
              { key: 'all', label: 'All', labelFull: 'All News' },
              { key: 'watchlist', label: 'Watch', labelFull: 'Watchlist' },
              { key: 'nifty50', label: 'N50', labelFull: 'Nifty 50' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setMarketNewsMode(tab.key as 'all' | 'watchlist' | 'nifty50');
                  setNewsSelectedSector(null);
                  setShowNewsAiPanel(false);
                  setNewsAiAnalysis(null);
                  setNewsAiAnalysisError(null);
                  if (tab.key === 'watchlist' && marketNewsItems.length === 0) fetchMarketNews();
                  if (tab.key === 'all' && allMarketNewsItems.length === 0) fetchAllMarketNews();
                  if (tab.key === 'nifty50' && nifty50NewsItems.length === 0) fetchNifty50News();
                }}
                data-testid={`tab-market-news-${tab.key}`}
                className="relative px-2.5 py-1 md:px-3 text-xs font-medium rounded-full transition-all duration-200"
                style={
                  marketNewsMode === tab.key
                    ? {
                        background: 'linear-gradient(135deg, #d4d4d4 0%, #a8a8a8 40%, #c8c8c8 100%)',
                        color: '#111',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                      }
                    : { color: '#6b7280' }
                }
              >
                <span className="md:hidden">{tab.label}</span>
                <span className="hidden md:inline">{tab.labelFull}</span>
              </button>
            ))}
          </div>
          {/* AI Analysis button */}
          {(isAllMode || isNifty50Mode) && rawNewsItems.length > 0 && (
            <button
              onClick={handleAiAnalysis}
              disabled={isNewsAiAnalysisLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', opacity: isNewsAiAnalysisLoading ? 0.7 : 1 }}
              data-testid="button-news-ai-analysis"
            >
              {isNewsAiAnalysisLoading
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Sparkles className="h-3 w-3" />}
              <span className="hidden md:inline">AI Analysis</span>
            </button>
          )}
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors"
            data-testid="button-refresh-market-news"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Sector filter pills */}
      {(isAllMode || isNifty50Mode) && rawNewsItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-gray-800">
          <button
            onClick={() => setNewsSelectedSector(null)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${newsSelectedSector === null ? 'bg-gray-200 text-gray-900 border-gray-200' : 'bg-gray-800/60 text-gray-500 border-gray-700/60 hover:border-gray-500 hover:text-gray-300'}`}
            data-testid="filter-sector-all"
          >All</button>
          {(isAllMode ? allSectors : nifty50Sectors).map(sector => {
            const count = rawNewsItems.filter((i: any) => {
              if (isAllMode) return (i.sector || i.displayName) === sector;
              return (NIFTY50_SECTOR_MAP[i.symbol] || 'Market') === sector;
            }).length;
            if (count === 0) return null;
            const active = newsSelectedSector === sector;
            return (
              <button
                key={sector}
                onClick={() => setNewsSelectedSector(active ? null : sector)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${active ? sectorColors[sector] || 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-gray-800/60 text-gray-500 border-gray-700/60 hover:text-gray-300 hover:border-gray-500'}`}
                data-testid={`filter-sector-${sector.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {sector} <span className="opacity-50 ml-0.5">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* AI Analysis Panel */}
      {(isAllMode || isNifty50Mode) && showNewsAiPanel && (
        <div className="border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
            <div className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-gray-300">AI Market Intelligence</span>
              {newsAiAnalysis && <span className="text-[11px] text-gray-600">· {newsAiAnalysis.totalArticles} articles</span>}
            </div>
            <button onClick={() => setShowNewsAiPanel(false)} className="text-gray-600 hover:text-gray-400 transition-colors p-0.5 rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {isNewsAiAnalysisLoading ? (
            <div className="flex items-center justify-center py-8 gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-xs text-gray-500">Analysing {rawNewsItems.length} articles…</span>
            </div>
          ) : newsAiAnalysisError ? (
            <div className="flex flex-col items-center justify-center py-7 gap-2 px-4">
              <p className="text-xs text-red-400 text-center">{newsAiAnalysisError}</p>
              <button onClick={handleAiAnalysis} className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">Try again</button>
            </div>
          ) : newsAiAnalysis ? (
            <div className="divide-y divide-gray-800/70">
              {/* Overall Sentiment */}
              <div className="px-4 py-3 flex items-center gap-3">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md tabular-nums ${newsAiAnalysis.overallSentiment === 'BULLISH' ? 'bg-green-500/10 text-green-400' : newsAiAnalysis.overallSentiment === 'BEARISH' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {newsAiAnalysis.overallSentiment === 'BULLISH' ? '▲' : newsAiAnalysis.overallSentiment === 'BEARISH' ? '▼' : '●'} {newsAiAnalysis.overallSentiment}
                </span>
                <p className="text-xs text-gray-400 flex-1 leading-relaxed">{newsAiAnalysis.marketMood}</p>
              </div>
              {/* Trending Sectors */}
              {newsAiAnalysis.trendingSectors?.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2">Sectors</p>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                    {newsAiAnalysis.trendingSectors.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 py-1">
                        <span className="text-[10px] text-gray-700 font-mono w-4 shrink-0">{s.rank || i + 1}</span>
                        <span className="text-xs text-gray-300 w-20 shrink-0">{s.sector}</span>
                        <span className={`text-[10px] font-medium shrink-0 ${s.sentiment === 'positive' ? 'text-green-500' : s.sentiment === 'negative' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {s.sentiment === 'positive' ? '▲' : s.sentiment === 'negative' ? '▼' : '●'}
                        </span>
                        <span className="text-[11px] text-gray-600 flex-1 line-clamp-1">{s.keyTheme}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Key Events + Opportunities */}
              {(newsAiAnalysis.keyEvents?.length > 0 || newsAiAnalysis.opportunities?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800/70">
                  {newsAiAnalysis.keyEvents?.length > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2">Key Events</p>
                      <div className="space-y-2">
                        {newsAiAnalysis.keyEvents.slice(0, 3).map((e: any, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`text-[9px] font-semibold px-1 py-0.5 rounded shrink-0 mt-0.5 ${e.impact === 'HIGH' ? 'bg-red-500/10 text-red-500' : e.impact === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-700 text-gray-500'}`}>{e.impact}</span>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{e.event}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {newsAiAnalysis.opportunities?.length > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2">Opportunities</p>
                      <div className="space-y-2">
                        {newsAiAnalysis.opportunities.map((o: any, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[10px] font-medium text-green-600 shrink-0 pt-0.5">{o.sector}</span>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed flex-1">{o.opportunity}</p>
                            <span className="text-[10px] text-gray-600 shrink-0 pt-0.5">{o.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Risk Alerts */}
              {newsAiAnalysis.riskAlerts?.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2">Risks</p>
                  <div className="space-y-1.5">
                    {newsAiAnalysis.riskAlerts.map((r: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded shrink-0 mt-0.5 ${r.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' : r.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-700 text-gray-500'}`}>{r.severity}</span>
                        <div>
                          <p className="text-[11px] text-gray-300">{r.risk}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{r.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Outlook */}
              {newsAiAnalysis.weeklyOutlook && (
                <div className="px-4 py-3">
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-1.5">Outlook</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{newsAiAnalysis.weeklyOutlook}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* News list / loading / empty state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">{loadingMsg}</p>
        </div>
      ) : newsItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Newspaper className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-400">No recent news found in the last 7 days</p>
          <p className="text-xs text-gray-600">{emptyMsg}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800/60 max-h-[50vh] md:max-h-[640px] overflow-y-auto">
          {newsItems.map((item, index) => {
            const stockData = !isAllMode ? newsStockPrices[(item as any).symbol] : null;
            const isUp = stockData ? stockData.change >= 0 : null;
            const sparkColor = isUp === true ? '#22c55e' : isUp === false ? '#ef4444' : '#6b7280';
            const pts = stockData?.chartData ?? [];
            let sparkPath = '';
            if (pts.length >= 2) {
              const prices = pts.map((p: any) => p.price);
              const mn = Math.min(...prices), mx = Math.max(...prices);
              const rng = mx - mn || 1;
              const W = 56, H = 22;
              sparkPath = prices.map((p: number, i: number) => {
                const x = (i / (prices.length - 1)) * W;
                const y = H - ((p - mn) / rng) * H;
                return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
            }
            return (
              <div
                key={`${item.url}-${index}`}
                className="px-4 py-3 hover:bg-gray-800/40 transition-colors cursor-pointer group"
                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                data-testid={`market-news-item-${index}`}
              >
                <div className={`flex items-center gap-2 ${!isAllMode ? 'mb-1.5' : ''}`}>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${tagColor}`}>{item.displayName}</span>
                  <span className="text-gray-200 text-xs line-clamp-1 flex-1 leading-tight font-medium group-hover:text-white transition-colors">
                    {item.title}
                    <ExternalLink className="h-2.5 w-2.5 inline ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />
                  </span>
                  <span className="text-gray-600 text-[10px] shrink-0">{getWatchlistNewsRelativeTime(item.publishedAt)}</span>
                </div>
                {!isAllMode && (
                  <div className="flex items-center gap-2 pl-0.5">
                    {stockData ? (
                      <>
                        <span className="text-gray-300 text-xs font-mono">
                          {stockData.currency === 'USD'
                            ? `$${stockData.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                            : `₹${stockData.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        </span>
                        <span className={`text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                          {isUp ? '▲' : '▼'} {Math.abs(stockData.changePercent).toFixed(2)}%
                        </span>
                        {sparkPath && (
                          <svg width="56" height="22" viewBox="0 0 56 22" className="shrink-0">
                            <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">Loading…</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
