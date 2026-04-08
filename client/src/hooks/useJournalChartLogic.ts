import { useState, useEffect, useCallback, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  IPriceLine,
  createSeriesMarkers,
} from "lightweight-charts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradeMarker {
  candleIndex: number;
  price: number;
  type: "buy" | "sell";
  symbol: string;
  quantity: number;
  time: string;
  pnl: string;
}

export interface JournalChartConfig {
  activeTab: string;
  selectedJournalSymbol: string;
  setSelectedJournalSymbol: (symbol: string) => void;
  selectedJournalInterval: string;
  setSelectedJournalInterval: (interval: string) => void;
  angelOneAccessToken: string | null | undefined;
  angelOneServerConnected: boolean;
  paperPositions: any[];
  setPaperPositions: (fn: any) => void;
  paperTradeSymbol: string;
  setPaperTradeCurrentPrice: (price: number) => void;
  tradeHistoryData: any[];
  heatmapMode: 0 | 1 | 2;
  mobileJournalPanel: number;
  journalSearchType: "STOCK" | "COMMODITY" | "F&O";
  stockSearchQuery: string;
  journalHiddenPresetTimeframes: string[];
  setJournalHiddenPresetTimeframes: (fn: any) => void;
  journalCustomTimeframes: Array<{ value: string; label: string; deletable: boolean }>;
  setJournalCustomTimeframes: (fn: any) => void;
  getUserId: () => string | null;
  getFullApiUrl: (path: string) => string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useJournalChartLogic(config: JournalChartConfig) {
  const {
    activeTab,
    selectedJournalSymbol,
    setSelectedJournalSymbol,
    selectedJournalInterval,
    setSelectedJournalInterval,
    angelOneAccessToken,
    angelOneServerConnected,
    paperPositions,
    setPaperPositions,
    paperTradeSymbol,
    setPaperTradeCurrentPrice,
    tradeHistoryData,
    heatmapMode,
    mobileJournalPanel,
    journalSearchType,
    stockSearchQuery,
    journalHiddenPresetTimeframes,
    setJournalHiddenPresetTimeframes,
    journalCustomTimeframes,
    setJournalCustomTimeframes,
    getUserId,
    getFullApiUrl,
  } = config;

  // ─── State (from home.tsx lines 9364-9369) ───────────────────────────────
  const [journalChartData, setJournalChartData] = useState<CandleBar[]>([]);
  const [journalChartLoading, setJournalChartLoading] = useState(false);
  const [journalChartTimeframe, setJournalChartTimeframe] = useState("5"); // Default 5 minutes (matches selectedJournalInterval)
  const [showJournalTimeframeDropdown, setShowJournalTimeframeDropdown] = useState(false);
  const [showHeatmapTimeframeDropdown, setShowHeatmapTimeframeDropdown] = useState(false);
  const [showTradeMarkers, setShowTradeMarkers] = useState(true); // Toggle for trade markers visibility

  // ─── Journal chart timeframe options (home.tsx line 10043) ───────────────
  const journalTimeframeOptions = [
    { value: "1", label: "1min" },
    { value: "3", label: "3min" },
    { value: "5", label: "5min" },
    { value: "10", label: "10min" },
    { value: "15", label: "15min" },
    { value: "30", label: "30min" },
    { value: "60", label: "1hr" },
    { value: "120", label: "2hr" },
    { value: "1D", label: "1D" },
  ];

  // Get label for current timeframe
  const getJournalTimeframeLabel = (value: string) => {
    const tf = journalTimeframeOptions.find((t) => t.value === value);
    return tf ? tf.label : value;
  };

  // Convert timeframe to Angel One API interval format (minutes)
  const getJournalAngelOneInterval = (timeframe: string): string => {
    // Convert preset timeframes to minutes (1D -> 1440 minutes)
    const presetToMinutes: { [key: string]: string } = {
      "1D": "1440",
      "1W": "10080",
      "1M": "43200",
    };

    // If preset (1D/1W/1M), convert to minutes; otherwise pass as-is (already in minutes)
    return presetToMinutes[timeframe] || timeframe;
  };

  // Default popular instruments for each category (pre-populated)
  // Note: Only stocks and indices have stable tokens. Commodity/F&O tokens change with contract expiry.
  const defaultInstruments = {
    all: [
      { symbol: "RELIANCE-EQ", name: "Reliance Industries", token: "2885", exchange: "NSE", instrumentType: "", displayName: "RELIANCE", tradingSymbol: "RELIANCE-EQ" },
      { symbol: "TCS-EQ", name: "Tata Consultancy Services", token: "11536", exchange: "NSE", instrumentType: "", displayName: "TCS", tradingSymbol: "TCS-EQ" },
      { symbol: "INFY-EQ", name: "Infosys Limited", token: "1594", exchange: "NSE", instrumentType: "", displayName: "INFY", tradingSymbol: "INFY-EQ" },
      { symbol: "HDFCBANK-EQ", name: "HDFC Bank", token: "1333", exchange: "NSE", instrumentType: "", displayName: "HDFCBANK", tradingSymbol: "HDFCBANK-EQ" },
      { symbol: "Nifty 50", name: "Nifty 50 Index", token: "99926000", exchange: "NSE", instrumentType: "AMXIDX", displayName: "NIFTY 50", tradingSymbol: "Nifty 50" },
      { symbol: "Nifty Bank", name: "Nifty Bank Index", token: "99926009", exchange: "NSE", instrumentType: "AMXIDX", displayName: "BANK NIFTY", tradingSymbol: "Nifty Bank" },
    ],
    stock: [
      { symbol: "RELIANCE-EQ", name: "Reliance Industries", token: "2885", exchange: "NSE", instrumentType: "", displayName: "RELIANCE", tradingSymbol: "RELIANCE-EQ" },
      { symbol: "TCS-EQ", name: "Tata Consultancy Services", token: "11536", exchange: "NSE", instrumentType: "", displayName: "TCS", tradingSymbol: "TCS-EQ" },
      { symbol: "INFY-EQ", name: "Infosys Limited", token: "1594", exchange: "NSE", instrumentType: "", displayName: "INFY", tradingSymbol: "INFY-EQ" },
      { symbol: "HDFCBANK-EQ", name: "HDFC Bank", token: "1333", exchange: "NSE", instrumentType: "", displayName: "HDFCBANK", tradingSymbol: "HDFCBANK-EQ" },
      { symbol: "ICICIBANK-EQ", name: "ICICI Bank", token: "4963", exchange: "NSE", instrumentType: "", displayName: "ICICIBANK", tradingSymbol: "ICICIBANK-EQ" },
      { symbol: "SBIN-EQ", name: "State Bank of India", token: "3045", exchange: "NSE", instrumentType: "", displayName: "SBIN", tradingSymbol: "SBIN-EQ" },
      { symbol: "BHARTIARTL-EQ", name: "Bharti Airtel", token: "10604", exchange: "NSE", instrumentType: "", displayName: "BHARTIARTL", tradingSymbol: "BHARTIARTL-EQ" },
      { symbol: "KOTAKBANK-EQ", name: "Kotak Mahindra Bank", token: "1922", exchange: "NSE", instrumentType: "", displayName: "KOTAKBANK", tradingSymbol: "KOTAKBANK-EQ" },
    ],
    commodity: [], // Commodity tokens change with contract expiry - use search
    fo: [], // F&O tokens change with contract expiry - use search
    index: [
      { symbol: "Nifty 50", name: "Nifty 50 Index", token: "99926000", exchange: "NSE", instrumentType: "AMXIDX", displayName: "NIFTY 50", tradingSymbol: "Nifty 50" },
      { symbol: "Nifty Bank", name: "Nifty Bank Index", token: "99926009", exchange: "NSE", instrumentType: "AMXIDX", displayName: "BANK NIFTY", tradingSymbol: "Nifty Bank" },
      { symbol: "Nifty IT", name: "Nifty IT Index", token: "99926013", exchange: "NSE", instrumentType: "AMXIDX", displayName: "NIFTY IT", tradingSymbol: "Nifty IT" },
      { symbol: "NIFTY NEXT 50", name: "Nifty Next 50 Index", token: "99926001", exchange: "NSE", instrumentType: "AMXIDX", displayName: "NIFTY NEXT 50", tradingSymbol: "NIFTY NEXT 50" },
      { symbol: "Nifty Midcap 50", name: "Nifty Midcap 50 Index", token: "99926027", exchange: "NSE", instrumentType: "AMXIDX", displayName: "NIFTY MIDCAP", tradingSymbol: "Nifty Midcap 50" },
      { symbol: "INDIA VIX", name: "India VIX", token: "99926004", exchange: "NSE", instrumentType: "AMXIDX", displayName: "INDIA VIX", tradingSymbol: "INDIA VIX" },
    ],
  };

  // Search suggestions for categories without pre-populated defaults
  const categorySearchSuggestions: Record<string, string[]> = {
    commodity: ["gold", "silver", "crude", "copper", "natural gas", "aluminium", "zinc", "nickel"],
    fo: ["nifty", "banknifty", "finnifty", "reliance", "tcs", "infy", "hdfcbank"],
    currency: ["usdinr", "eurinr", "gbpinr", "jpyinr", "eurusd"],
  };

  // Dynamic instrument search state
  const [searchedInstruments, setSearchedInstruments] = useState<
    Array<{
      symbol: string;
      name: string;
      token: string;
      exchange: string;
      instrumentType: string;
      displayName: string;
      tradingSymbol: string;
    }>
  >([]);
  const [isSearchingInstruments, setIsSearchingInstruments] = useState(false);

  // Currently selected instrument details (for chart loading)
  const [selectedInstrument, setSelectedInstrument] = useState<{
    symbol: string;
    token: string;
    exchange: string;
    tradingSymbol: string;
    instrumentType?: string;
  } | null>(null);

  // FIX CRITICAL BUG: Sync selectedJournalSymbol with selectedInstrument
  // When user selects a new instrument from search, update selectedJournalSymbol to match
  useEffect(() => {
    if (selectedInstrument) {
      const newSymbol = `${selectedInstrument.exchange}:${selectedInstrument.symbol}`;
      setSelectedJournalSymbol(newSymbol);
      console.log(`✅ SYNC FIX: Updated selectedJournalSymbol to "${newSymbol}" (was: ${selectedJournalSymbol})`);
    }
  }, [selectedInstrument]);

  // TradingView-style chart refs for Journal
  const journalChartContainerRef = useRef<HTMLDivElement>(null);
  const journalCandleCountRef = useRef<HTMLDivElement>(null);
  const journalCountdownBarRef = useRef<HTMLDivElement>(null);
  const journalChartRef = useRef<IChartApi | null>(null);
  const journalCandlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const journalEma12SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const journalEma26SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const journalVolumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const journalPriceLineRef = useRef<IPriceLine | null>(null);
  const journalChartDataRef = useRef<CandleBar[]>([]);
  const journalRafRef = useRef<number | null>(null);
  const journalFetchIdRef = useRef<number>(0);
  const heatmapFetchIdRef = useRef<number>(0);

  // EMA values for display in header
  const [journalEmaValues, setJournalEmaValues] = useState<{ ema12: number | null; ema26: number | null }>({ ema12: null, ema26: null });

  // Live streaming state for Journal Chart
  const [journalLiveData, setJournalLiveData] = useState<{
    ltp: number;
    countdown: { remaining: number; total: number; formatted: string };
    currentCandle: { time: number; open: number; high: number; low: number; close: number; volume: number };
    isMarketOpen: boolean;
  } | null>(null);
  const [isJournalStreaming, setIsJournalStreaming] = useState(false);
  const journalEventSourceRef = useRef<EventSource | null>(null);

  // Live OHLC ticker for display
  const [liveOhlc, setLiveOhlc] = useState<{ open: number; high: number; low: number; close: number; change: number } | null>(null);

  // Hovered candle OHLC for crosshair display (TradingView style)
  const [hoveredCandleOhlc, setHoveredCandleOhlc] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
    time: number;
  } | null>(null);

  // ========== CHART MODE SYSTEM ==========
  // Two separate charts: Search Chart (manual symbol search) vs Heatmap Chart (date selection)
  const [journalChartMode, setJournalChartMode] = useState<"search" | "heatmap">("search");

  // ========== HEATMAP CHART STATE (Separate from Search Chart) ==========
  const [heatmapChartData, setHeatmapChartData] = useState<CandleBar[]>([]);
  const [heatmapChartLoading, setHeatmapChartLoading] = useState(false);
  const [heatmapChartTimeframe, setHeatmapChartTimeframe] = useState("1"); // Default 1 minute
  const [heatmapSelectedSymbol, setHeatmapSelectedSymbol] = useState(""); // Symbol from heatmap date
  const [heatmapSelectedDate, setHeatmapSelectedDate] = useState(""); // Date from heatmap calendar
  const [heatmapTradeHistory, setHeatmapTradeHistory] = useState<any[]>([]); // Trade history for heatmap date

  // Heatmap Chart refs (completely separate from Search Chart)
  const heatmapChartContainerRef = useRef<HTMLDivElement>(null);
  const heatmapChartRef = useRef<IChartApi | null>(null);
  const heatmapCandlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const heatmapEma12SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const heatmapEma26SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const heatmapVolumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const heatmapSeriesMarkersRef = useRef<any>(null); // Stores createSeriesMarkers wrapper
  const heatmapChartDataRef = useRef<CandleBar[]>([]);

  // Heatmap OHLC display (separate from search chart)
  const [heatmapHoveredOhlc, setHeatmapHoveredOhlc] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
    time: number;
  } | null>(null);

  // Angel One Stock Token Mapping for Journal Chart (Expanded for all exchanges)
  const journalAngelOneTokens: { [key: string]: { token: string; exchange: string; tradingSymbol: string } } = {
    // NSE Indices
    NIFTY50: { token: "99926000", exchange: "NSE", tradingSymbol: "Nifty 50" },
    NIFTY: { token: "99926000", exchange: "NSE", tradingSymbol: "Nifty 50" },
    BANKNIFTY: { token: "99926009", exchange: "NSE", tradingSymbol: "Nifty Bank" },
    NIFTYIT: { token: "99926013", exchange: "NSE", tradingSymbol: "Nifty IT" },
    NIFTYNEXT50: { token: "99926001", exchange: "NSE", tradingSymbol: "NIFTY NEXT 50" },
    NIFTYMIDCAP50: { token: "99926027", exchange: "NSE", tradingSymbol: "Nifty Midcap 50" },
    INDIAVIX: { token: "99926004", exchange: "NSE", tradingSymbol: "INDIA VIX" },
    // NSE Stocks
    RELIANCE: { token: "2885", exchange: "NSE", tradingSymbol: "RELIANCE-EQ" },
    TCS: { token: "11536", exchange: "NSE", tradingSymbol: "TCS-EQ" },
    HDFCBANK: { token: "1333", exchange: "NSE", tradingSymbol: "HDFCBANK-EQ" },
    INFY: { token: "1594", exchange: "NSE", tradingSymbol: "INFY-EQ" },
    ICICIBANK: { token: "4963", exchange: "NSE", tradingSymbol: "ICICIBANK-EQ" },
    SBIN: { token: "3045", exchange: "NSE", tradingSymbol: "SBIN-EQ" },
    BHARTIARTL: { token: "10604", exchange: "NSE", tradingSymbol: "BHARTIARTL-EQ" },
    ITC: { token: "1660", exchange: "NSE", tradingSymbol: "ITC-EQ" },
    KOTAKBANK: { token: "1922", exchange: "NSE", tradingSymbol: "KOTAKBANK-EQ" },
    LT: { token: "11483", exchange: "NSE", tradingSymbol: "LT-EQ" },
    AXISBANK: { token: "5900", exchange: "NSE", tradingSymbol: "AXISBANK-EQ" },
    WIPRO: { token: "3787", exchange: "NSE", tradingSymbol: "WIPRO-EQ" },
    TATASTEEL: { token: "3499", exchange: "NSE", tradingSymbol: "TATASTEEL-EQ" },
    // BSE Indices
    SENSEX: { token: "99919000", exchange: "BSE", tradingSymbol: "SENSEX" },
    // MCX Commodities
    GOLD: { token: "232801", exchange: "MCX", tradingSymbol: "GOLD" },
    CRUDEOIL: { token: "232665", exchange: "MCX", tradingSymbol: "CRUDEOIL" },
    SILVER: { token: "234977", exchange: "MCX", tradingSymbol: "SILVER" },
  };

  // Store selected instrument with token (direct from search API)
  const [selectedInstrumentToken, setSelectedInstrumentToken] = useState<{ token: string; exchange: string; tradingSymbol: string } | null>(null);

  // Convert NSE/MCX symbol format to Angel One format with fuzzy matching
  const getJournalAngelOneSymbol = (symbol: string): string => {
    let cleanSymbol = symbol
      .replace(/^(NSE|BSE|MCX|NCDEX|NFO|BFO|CDS):/, "")
      .replace(/-EQ$/, "")
      .replace(/-INDEX$/, "")
      .replace(/-COM$/, "")
      .replace(/-FUT$/, "")
      .replace(/-OPT$/, "");

    // Normalize spaces and case for better matching
    cleanSymbol = cleanSymbol.replace(/\s+/g, "").toUpperCase();

    // Try direct lookup first
    if (journalAngelOneTokens[cleanSymbol]) {
      return cleanSymbol;
    }

    // Try fuzzy matching (handle "Nifty 50" → "NIFTY50")
    const fuzzyMatches: { [key: string]: string } = {
      NIFTY50: "NIFTY50",
      NIFTYBANK: "BANKNIFTY",
      NIFTYIT: "NIFTYIT",
      BANKNIFTY: "BANKNIFTY",
      INDIAVIX: "INDIAVIX",
      SENSEX: "SENSEX",
      GOLD: "GOLD",
      CRUDEOIL: "CRUDEOIL",
      SILVER: "SILVER",
    };

    return fuzzyMatches[cleanSymbol] || cleanSymbol;
  };

  // 🔶 PURE NUMERIC: Convert custom timeframe to minutes ONLY (no "2D", only "2880")
  const convertJournalCustomTimeframe = (type: string, interval: string): string => {
    const num = parseInt(interval);
    if (isNaN(num) || num <= 0) return "1";

    switch (type) {
      case "minutes": return num.toString(); // 80 → "80"
      case "hr": return (num * 60).toString(); // 2hr → "120"
      case "d": return (num * 1440).toString(); // 2d → "2880" (numeric minutes!)
      case "m": return (num * 43200).toString(); // 1m → "43200" (30 days)
      case "w": return (num * 10080).toString(); // 2w → "20160" (numeric minutes!)
      default: return "1";
    }
  };

  const createJournalCustomTimeframeLabel = (type: string, interval: string): string => {
    const num = parseInt(interval);
    switch (type) {
      case "minutes": return `${num}min`;
      case "hr": return `${num}hr`;
      case "d": return `${num}d`;
      case "m": return `${num}m`;
      case "w": return `${num}w`;
      default: return `${num}min`;
    }
  };

  // 🔶 PURE NUMERIC: Just parse as integer (no more .endsWith checks!)
  const getJournalTimeframeMinutes = (value: string): number => {
    return parseInt(value) || 1; // Already converted by getJournalAngelOneInterval()
  };

  const deleteJournalTimeframe = (valueToDelete: string) => {
    const isCustom = journalCustomTimeframes.some((tf) => tf.value === valueToDelete);
    if (isCustom) {
      setJournalCustomTimeframes((prev: any) => prev.filter((tf: any) => tf.value !== valueToDelete));
    } else {
      setJournalHiddenPresetTimeframes((prev: any) => [...prev, valueToDelete]);
    }
    if (selectedJournalInterval === valueToDelete) {
      setSelectedJournalInterval("5");
    }
  };

  const getAllJournalTimeframes = () => {
    const allPresetTimeframes = [
      { value: "1", label: "1min", deletable: false },
      { value: "5", label: "5min", deletable: false },
      { value: "10", label: "10min", deletable: true },
      { value: "15", label: "15min", deletable: true },
      { value: "20", label: "20min", deletable: true },
      { value: "30", label: "30min", deletable: true },
      { value: "40", label: "40min", deletable: true },
      { value: "60", label: "1hr", deletable: true },
      { value: "80", label: "80min", deletable: true },
      { value: "120", label: "2hr", deletable: true },
      { value: "1D", label: "1D", deletable: true },
    ];
    const visiblePresetTimeframes = allPresetTimeframes.filter(
      (tf) => !journalHiddenPresetTimeframes.includes(tf.value)
    );
    const allTimeframes = [...visiblePresetTimeframes, ...journalCustomTimeframes];
    return allTimeframes.sort((a, b) => {
      const minutesA = getJournalTimeframeMinutes(a.value);
      const minutesB = getJournalTimeframeMinutes(b.value);
      return minutesA - minutesB;
    });
  };

  // Map journal search type to exchange segment for filtering (similar to paper trading)
  const getExchangeForJournalSearchType = (type: "STOCK" | "COMMODITY" | "F&O"): string => {
    switch (type) {
      case "STOCK":
        return "NSE,BSE"; // Equity stocks from NSE and BSE
      case "COMMODITY":
        return "MCX,NCDEX"; // Commodities from MCX and NCDEX
      case "F&O":
        return "NFO,BFO"; // Futures & Options from NSE F&O and BSE F&O
      default:
        return "NSE,BSE";
    }
  };

  // 🔍 Fetch instruments from Angel One master file API
  const fetchInstruments = async (searchQuery: string, searchType: "STOCK" | "COMMODITY" | "F&O") => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchedInstruments([]);
      return;
    }

    setIsSearchingInstruments(true);
    try {
      // Get exchange segment based on selected journal search type
      const exchange = getExchangeForJournalSearchType(searchType);
      console.log(`🔍 [JOURNAL-CHART] Searching for "${searchQuery}" on exchange: ${exchange} (type: ${searchType})`);

      const response = await fetch(
        `/api/angelone/search-instruments?query=${encodeURIComponent(searchQuery)}&exchange=${encodeURIComponent(exchange)}&limit=50`
      );
      const data = await response.json();

      if (data.success && data.instruments) {
        console.log(`🔍 [JOURNAL-CHART] Found ${data.instruments.length} instruments`);
        setSearchedInstruments(data.instruments);
      } else {
        setSearchedInstruments([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch instruments:", error);
      setSearchedInstruments([]);
    } finally {
      setIsSearchingInstruments(false);
    }
  };

  // useEffect to fetch instruments when search query or search type changes (with debouncing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stockSearchQuery.length >= 2) {
        fetchInstruments(stockSearchQuery, journalSearchType);
      } else {
        setSearchedInstruments([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [stockSearchQuery, journalSearchType]);

  // Calculate EMA (Exponential Moving Average)
  const calculateEMA = (prices: number[], period: number): number[] => {
    if (prices.length === 0) return [];
    const k = 2 / (period + 1);
    const ema: number[] = [];
    let sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(sma);
    for (let i = period; i < prices.length; i++) {
      sma = prices[i] * k + sma * (1 - k);
      ema.push(sma);
    }
    return ema;
  };

  // ✅ MANUAL SEARCH CHART: Standalone - NO dependency on heatmap date selection
  const fetchJournalChartData = useCallback(async () => {
    // Increment fetch ID - any older in-flight fetches will be ignored when they complete
    const thisFetchId = ++journalFetchIdRef.current;

    try {
      // STEP 1: Cancel pending rAF and destroy old chart IMMEDIATELY
      console.log(`🔄 [SEARCH CHART] Destroying old chart... (fetch #${thisFetchId})`);
      if (journalRafRef.current !== null) {
        cancelAnimationFrame(journalRafRef.current);
        journalRafRef.current = null;
      }
      if (journalChartRef.current) {
        try { journalChartRef.current.remove(); } catch (e) {}
        journalChartRef.current = null;
        journalCandlestickSeriesRef.current = null;
        journalEma12SeriesRef.current = null;
        journalEma26SeriesRef.current = null;
        journalVolumeSeriesRef.current = null;
      }

      // STEP 2: Validate inputs - ONLY need symbol (for manual search)
      if (!selectedJournalSymbol) {
        console.warn("❌ [SEARCH CHART] No symbol selected");
        setJournalChartLoading(false);
        return;
      }

      console.log(`📊 [SEARCH CHART] Fetching ${selectedJournalSymbol} (manual search)`);
      setJournalChartLoading(true);

      // STEP 3: Get token - Use direct token if available, otherwise lookup
      let stockToken = selectedInstrumentToken;
      let cleanSymbol = selectedJournalSymbol; // Define cleanSymbol here for use in logs

      if (!stockToken) {
        // Fallback: Extract clean symbol and lookup
        cleanSymbol = getJournalAngelOneSymbol(selectedJournalSymbol);
        stockToken = journalAngelOneTokens[cleanSymbol];
        console.log(`📊 [SEARCH CHART] Symbol: ${cleanSymbol}, Token: ${stockToken?.token}`);
      } else {
        console.log(`📊 [SEARCH CHART] Using direct token from search: ${selectedJournalSymbol}, Token: ${stockToken.token}`);
        cleanSymbol = getJournalAngelOneSymbol(selectedJournalSymbol);
      }

      if (!stockToken) {
        console.warn(`❌ [SEARCH CHART] No token for: ${selectedJournalSymbol}`);
        setJournalChartLoading(false);
        return;
      }

      // STEP 4: Build API request - fetch last 10 days for search chart
      const interval = getJournalAngelOneInterval(journalChartTimeframe);
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const formatDateWithTime = (d: Date, time: string) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day} ${time}`;
      };

      const requestBody = {
        exchange: stockToken.exchange,
        symbolToken: stockToken.token,
        interval: interval,
        fromDate: formatDateWithTime(tenDaysAgo, "00:00"), // Full day start (supports MCX, crypto, 24hr markets)
        toDate: formatDateWithTime(today, "23:59"), // Full day end (supports MCX, crypto, 24hr markets)
      };

      console.log(`📊 [SEARCH CHART] API Request:`, requestBody);

      // STEP 5: Fetch chart data
      const response = await fetch(getFullApiUrl("/api/angelone/historical"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [SEARCH CHART] API Error ${response.status}: ${errorText}`);
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }

      // STEP 6: Parse and map candle data
      const data = await response.json();
      let candleData: any[] = [];

      if (data.success && data.candles && Array.isArray(data.candles)) {
        candleData = data.candles.map((candle: any) => {
          let unixSeconds: number;

          if (typeof candle.timestamp === "string") {
            const [datePart, timePart] = candle.timestamp.split(" ");
            const [year, month, day] = datePart.split("-").map(Number);
            const [hours, minutes] = timePart.split(":").map(Number);
            const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
            const istOffsetMs = 5.5 * 60 * 60 * 1000;
            unixSeconds = Math.floor((utcDate.getTime() - istOffsetMs) / 1000);
          } else {
            unixSeconds = candle.timestamp > 10000000000 ? Math.floor(candle.timestamp / 1000) : candle.timestamp;
          }

          return {
            time: unixSeconds as any,
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
            volume: parseInt(candle.volume) || 0,
          };
        });
      }

      // Guard: Ignore stale fetch results if a newer fetch has started
      if (thisFetchId !== journalFetchIdRef.current) {
        console.log(`⚠️ [SEARCH CHART] Stale fetch #${thisFetchId} ignored (current: #${journalFetchIdRef.current})`);
        return;
      }

      console.log(`✅ [SEARCH CHART] Chart ready: ${candleData.length} candles for ${cleanSymbol}`);
      setJournalChartData(candleData);
    } catch (error) {
      if (thisFetchId === journalFetchIdRef.current) {
        console.error("❌ [SEARCH CHART] Error:", error);
        setJournalChartData([]);
      }
    } finally {
      if (thisFetchId === journalFetchIdRef.current) {
        setJournalChartLoading(false);
      }
    }
  }, [selectedJournalSymbol, journalChartTimeframe]);

  // ✅ AUTO-FETCH CHART DATA IN MANUAL MODE
  useEffect(() => {
    if (activeTab !== "journal" || !selectedJournalSymbol) return;

    console.log(`🔄 [JOURNAL-TAB] Tab activated or symbol changed to ${selectedJournalSymbol}, triggering auto-fetch...`);

    // Use a small delay to ensure refs are ready and to debounce rapid switching
    const timer = setTimeout(() => {
      setJournalChartMode("search");
      fetchJournalChartData();
    }, 200);

    return () => clearTimeout(timer);
  }, [activeTab, selectedJournalSymbol, fetchJournalChartData]);

  // ✅ AUTO-RELOAD CHART ON MOBILE PANEL SWITCH (Fixes zoom/resize issues)
  useEffect(() => {
    if (mobileJournalPanel === 0 && activeTab === "journal") {
      const timer = setTimeout(() => {
        console.log("📱 [MOBILE-CHART] Switching to Chart panel, auto-reloading...");
        fetchJournalChartData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [mobileJournalPanel, activeTab, fetchJournalChartData]);

  // ✅ REFETCH when Angel One token refreshes (next day or new session)
  // Uses a delay to prevent racing with the auto-fetch effect
  useEffect(() => {
    if (!selectedJournalSymbol || !angelOneAccessToken || activeTab !== "journal") return;

    const timer = setTimeout(() => {
      console.log(`🔄 [TOKEN-REFRESH] Journal chart refetching with refreshed Angel One token`);
      fetchJournalChartData();
    }, 500);
    return () => clearTimeout(timer);
  }, [angelOneAccessToken, selectedJournalSymbol, activeTab, fetchJournalChartData]);

  // ✅ RECOVERY: Re-fetch when Angel One server connects/reconnects and chart has no data.
  // Handles the case where the initial fetch failed because the server wasn't ready yet
  // (e.g. startup auto-connect was still in progress when the user first selected a symbol).
  useEffect(() => {
    if (!angelOneServerConnected || !selectedJournalSymbol || activeTab !== "journal") return;
    // Use ref to check for missing data without adding journalChartData to deps
    // (which would cause the effect to re-run on every candle update)
    if (journalChartDataRef.current && journalChartDataRef.current.length > 0) return;

    const timer = setTimeout(() => {
      console.log(`🔄 [RECOVERY] Angel One connected — retrying chart fetch for ${selectedJournalSymbol}`);
      fetchJournalChartData();
    }, 800);
    return () => clearTimeout(timer);
  }, [angelOneServerConnected, selectedJournalSymbol, activeTab, fetchJournalChartData]);

  // ✅ SAFETY-NET: Retry chain at 3s, 6s, and 12s if the chart is still empty.
  // Angel One server auto-connect takes up to ~10s on startup so the early 200ms/500ms/800ms
  // fetches may all fail. This chain keeps retrying until the API is ready, eliminating the
  // need to visit the trading dashboard first to "warm up" the connection.
  useEffect(() => {
    if (activeTab !== "journal" || !selectedJournalSymbol) return;
    const retry = (delayMs: number) =>
      setTimeout(() => {
        if (!journalChartDataRef.current || journalChartDataRef.current.length === 0) {
          console.log(`🔄 [SAFETY-NET] Chart still empty after ${delayMs}ms — retrying for ${selectedJournalSymbol}`);
          fetchJournalChartData();
        }
      }, delayMs);
    const t1 = retry(3000);
    const t2 = retry(6000);
    const t3 = retry(12000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedJournalSymbol]);

  const fetchHeatmapChartData = useCallback(
    async (symbol: string, date: string) => {
      const thisFetchId = ++heatmapFetchIdRef.current;
      try {
        console.log(`🗓️ [HEATMAP FETCH] Starting fetch for ${symbol} on ${date} (fetch #${thisFetchId})`);

        // STEP 1: Destroy old heatmap chart
        if (heatmapChartRef.current) {
          try { heatmapChartRef.current.remove(); } catch (e) {}
          heatmapChartRef.current = null;
          heatmapCandlestickSeriesRef.current = null;
          heatmapEma12SeriesRef.current = null;
          heatmapEma26SeriesRef.current = null;
          heatmapVolumeSeriesRef.current = null;
        }

        // STEP 2: Validate inputs
        if (!symbol) {
          console.warn("❌ [HEATMAP FETCH] No symbol provided");
          setHeatmapChartLoading(false);
          return;
        }

        if (!date) {
          console.warn("❌ [HEATMAP FETCH] No date provided");
          setHeatmapChartLoading(false);
          return;
        }

        setHeatmapChartLoading(true);
        setHeatmapChartData([]);

        // ✅ ENSURE DATE FORMAT IS YYYY-MM-DD STRING
        let formattedDate = "";
        if (typeof date === "string") {
          formattedDate = date;
        } else if (date && typeof (date as any).getFullYear === "function") {
          const d = date as any;
          formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        } else {
          formattedDate = String(date);
        }

        setHeatmapSelectedSymbol(symbol);
        setHeatmapSelectedDate(formattedDate);
        console.log(`🗓️ [HEATMAP SYNC] Updated header - Date: ${formattedDate}, Symbol: ${symbol}`);

        // STEP 3: Smart symbol resolution — handle EQ, FUT, CE/PE, MCX commodities
        const raw = symbol.replace(/^(NSE|BSE|MCX|NFO|BFO|NCDEX|CDS):/, "").trim();

        const INDICES = ["NIFTY50", "NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "SENSEX"];
        const MCX_BASE = [
          "GOLD", "SILVER", "CRUDEOIL", "COPPER", "ZINC", "NATURALGAS", "COTTON",
          "LEAD", "NICKEL", "ALUMINIUM", "GOLDPETAL", "GOLDM", "SILVERM", "CRUDEOILM",
          "MENTHAOIL", "CASTORSEED",
        ];

        let cleanSymbol = "";
        let resolvedExchange = "NSE";

        // 1. Equity: ends with -EQ  (e.g. IDEA-EQ, YESBANK-EQ)
        if (/[-_]EQ$/i.test(raw)) {
          cleanSymbol = raw.replace(/[-_]EQ$/i, "").toUpperCase();
          resolvedExchange = "NSE";

        // 2. Compact futures: YYMONFUT (NIFTY25JUNFUT) or DDMONYYFUT (CRUDEOILM18DEC25FUT)
        } else if (/\d{2}[A-Z]{3}\d{2}FUT$/i.test(raw) || /\d{2}[A-Z]{3}FUT$/i.test(raw)) {
          // Strip expiry — try DDMONYYFUT first, then YYMONFUT
          const underlying = raw
            .replace(/\d{2}[A-Z]{3}\d{2}FUT$/i, "")
            .replace(/\d{2}[A-Z]{3}FUT$/i, "")
            .toUpperCase();
          // Map MCX mini variants to base commodity (CRUDEOILM → CRUDEOIL, GOLDM → GOLD, SILVERM → SILVER)
          const miniMap: Record<string, string> = { CRUDEOILM: "CRUDEOIL", GOLDM: "GOLD", SILVERM: "SILVER" };
          cleanSymbol = underlying === "NIFTY" ? "NIFTY50" : (miniMap[underlying] || underlying);
          resolvedExchange = MCX_BASE.some((c) => cleanSymbol.startsWith(c)) ? "MCX" : "NSE";

        // 3. Spaced futures: "IDEA APR FUT", "NIFTY APR FUT", "GOLD APR FUT"
        } else if (/\bFUT\b/i.test(raw)) {
          const underlying = raw.split(/\s+/)[0].toUpperCase();
          cleanSymbol = underlying === "NIFTY" ? "NIFTY50" : underlying;
          resolvedExchange = MCX_BASE.some((c) => cleanSymbol.startsWith(c)) ? "MCX" : "NSE";

        // 4. Options CE/PE: "NIFTY 22nd w MAY PE", "IDEA 100 CE", "BANKNIFTY 45000 CE"
        } else if (/\b(CE|PE)\b/i.test(raw)) {
          const underlying = raw.split(/\s+/)[0].toUpperCase();
          cleanSymbol = underlying === "NIFTY" ? "NIFTY50" : underlying;
          resolvedExchange = "NSE";

        // 5. Index with -INDEX suffix
        } else if (/-INDEX$/i.test(raw)) {
          const base = raw.replace(/-INDEX$/i, "").toUpperCase();
          cleanSymbol = base === "NIFTY" ? "NIFTY50" : base;
          resolvedExchange = cleanSymbol === "SENSEX" ? "BSE" : "NSE";

        // 6. Direct symbol (NIFTY50, BANKNIFTY, GOLD, etc.)
        } else {
          cleanSymbol = raw.toUpperCase();
          if (cleanSymbol === "NIFTY") cleanSymbol = "NIFTY50";
          resolvedExchange = MCX_BASE.some((c) => cleanSymbol.startsWith(c)) ? "MCX" : "NSE";
        }

        console.log(`🗓️ [HEATMAP FETCH] Resolved: "${symbol}" → "${cleanSymbol}" (${resolvedExchange})`);

        // Try static token map first
        let stockToken: { token: string; exchange: string; tradingSymbol: string } | null =
          journalAngelOneTokens[cleanSymbol] || null;

        // Dynamic lookup via instrument search if not in static map
        if (!stockToken) {
          console.log(`🔍 [HEATMAP] "${cleanSymbol}" not in static map — searching dynamically...`);
          try {
            // For MCX commodities: find the nearest active futures contract
            const isMcx = resolvedExchange === "MCX";
            const searchExchange = isMcx ? "MCX" : "NSE,BSE";
            const searchResp = await fetch(
              `/api/angelone/search-instruments?query=${encodeURIComponent(cleanSymbol)}&exchange=${searchExchange}&limit=20`
            );
            if (searchResp.ok) {
              const searchData = await searchResp.json();
              const instruments: any[] = searchData.instruments || [];

              if (isMcx) {
                // For MCX: find active FUT contracts, sort by nearest expiry
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const futContracts = instruments
                  .filter(
                    (inst: any) =>
                      inst.instrumentType === "FUTCOM" ||
                      inst.instrumentType === "FUT" ||
                      String(inst.tradingSymbol || "").toUpperCase().includes("FUT")
                  )
                  .filter((inst: any) => {
                    if (!inst.expiry) return true;
                    const parts = inst.expiry.split(/[-\/]/);
                    if (parts.length < 3) return true;
                    const expDate = new Date(inst.expiry);
                    return expDate >= today;
                  })
                  .sort((a: any, b: any) => {
                    if (!a.expiry) return 1;
                    if (!b.expiry) return -1;
                    return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
                  });
                const best = futContracts[0];
                if (best) {
                  stockToken = { token: best.token, exchange: best.exchange || "MCX", tradingSymbol: best.tradingSymbol || cleanSymbol };
                  console.log(`✅ [HEATMAP] MCX active contract: ${best.tradingSymbol} expiry: ${best.expiry}`);
                }
              } else {
                // For NSE/BSE: prefer EQ instrument type exact match
                const eqMatch = instruments.find(
                  (inst: any) =>
                    inst.instrumentType === "EQ" &&
                    (String(inst.tradingSymbol || "").toUpperCase() === `${cleanSymbol}-EQ` ||
                      String(inst.tradingSymbol || "").toUpperCase() === cleanSymbol ||
                      String(inst.symbol || "").toUpperCase() === cleanSymbol)
                );
                const anyMatch = eqMatch || instruments[0];
                if (anyMatch) {
                  stockToken = { token: anyMatch.token, exchange: anyMatch.exchange || "NSE", tradingSymbol: anyMatch.tradingSymbol || cleanSymbol };
                  console.log(`✅ [HEATMAP] Dynamically resolved: ${cleanSymbol} → token ${stockToken.token}`);
                }
              }
            }
          } catch (searchErr) {
            console.warn(`⚠️ [HEATMAP] Dynamic search failed for ${cleanSymbol}:`, searchErr);
          }
        }

        console.log(`🗓️ [HEATMAP FETCH] Symbol: ${cleanSymbol}, Token: ${stockToken?.token}`);

        if (!stockToken) {
          console.warn(`❌ [HEATMAP FETCH] No token found for: ${cleanSymbol}`);
          setHeatmapChartLoading(false);
          return;
        }

        // Override exchange with resolved one when using dynamic lookup for MCX
        if (resolvedExchange === "MCX") {
          stockToken = { ...stockToken, exchange: "MCX" };
        }

        // STEP 4: Build API request
        const interval = getJournalAngelOneInterval(heatmapChartTimeframe);
        const requestBody = {
          exchange: stockToken.exchange,
          symbolToken: stockToken.token,
          interval: interval,
          date: date,
        };

        console.log(`🗓️ [HEATMAP FETCH] API Request:`, requestBody);

        // STEP 5: Fetch chart data
        const response = await fetch(getFullApiUrl("/api/angelone/historical"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [HEATMAP FETCH] API Error ${response.status}: ${errorText}`);
          throw new Error(`Failed to fetch heatmap chart data: ${response.status}`);
        }

        // STEP 6: Parse and map candle data
        const data = await response.json();
        let candleData: any[] = [];

        if (data.success && data.candles && Array.isArray(data.candles)) {
          candleData = data.candles.map((candle: any) => {
            let unixSeconds: number;

            if (typeof candle.timestamp === "string") {
              const [datePart, timePart] = candle.timestamp.split(" ");
              const [year, month, day] = datePart.split("-").map(Number);
              const [hours, minutes] = timePart.split(":").map(Number);
              const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
              const istOffsetMs = 5.5 * 60 * 60 * 1000;
              unixSeconds = Math.floor((utcDate.getTime() - istOffsetMs) / 1000);
            } else {
              unixSeconds = candle.timestamp > 10000000000 ? Math.floor(candle.timestamp / 1000) : candle.timestamp;
            }

            return {
              time: unixSeconds as any,
              open: parseFloat(candle.open),
              high: parseFloat(candle.high),
              low: parseFloat(candle.low),
              close: parseFloat(candle.close),
              volume: parseInt(candle.volume) || 0,
            };
          });
        }

        console.log(`✅ [HEATMAP FETCH] Chart ready: ${candleData.length} candles for ${cleanSymbol} on ${date}`);
        if (thisFetchId !== heatmapFetchIdRef.current) {
          console.log(`⚠️ [HEATMAP FETCH] Stale fetch #${thisFetchId} ignored (current: ${heatmapFetchIdRef.current})`);
          return;
        }
        setHeatmapChartData(candleData);
        // Switch to heatmap mode in the same sync block so React batches both state updates
        // into one render — container becomes visible at the same moment data is set,
        // ensuring the chart container has non-zero dimensions when the chart init effect fires.
        setJournalChartMode("heatmap");

        // STEP 7: Also fetch journal data for trade history markers
        try {
          const userId = getUserId();
          const effectiveMarkersUserId = heatmapMode === 2 ? `2_${userId}` : userId;
          let journalResponse;
          let journalData = null;

          // Try user-specific data first (if authenticated)
          if (effectiveMarkersUserId) {
            journalResponse = await fetch(getFullApiUrl(`/api/user-journal/${effectiveMarkersUserId}/${formattedDate}`));
            if (journalResponse.ok) {
              const userData = await journalResponse.json();
              if (userData.tradeHistory && Array.isArray(userData.tradeHistory)) {
                journalData = userData;
                console.log(`✅ [HEATMAP FETCH] Loaded ${userData.tradeHistory.length} trades from user data for markers`);
              }
            }
          }

          // If no user data, try demo/shared data
          if (!journalData) {
            journalResponse = await fetch(getFullApiUrl(`/api/journal/${formattedDate}`));
            if (journalResponse.ok) {
              const demoData = await journalResponse.json();
              if (demoData.tradeHistory && Array.isArray(demoData.tradeHistory)) {
                journalData = demoData;
                console.log(`✅ [HEATMAP FETCH] Loaded ${demoData.tradeHistory.length} trades from demo data for markers`);
              }
            }
          }

          if (journalData?.tradeHistory && Array.isArray(journalData.tradeHistory)) {
            setHeatmapTradeHistory(journalData.tradeHistory);
          } else {
            console.warn("⚠️ [HEATMAP FETCH] No trade history found");
            setHeatmapTradeHistory([]);
          }
        } catch (journalError) {
          console.warn("⚠️ [HEATMAP FETCH] Could not fetch journal data for markers:", journalError);
          setHeatmapTradeHistory([]);
        }

      } catch (error) {
        console.error("❌ [HEATMAP FETCH] Error:", error);
        setHeatmapChartData([]);
      } finally {
        setHeatmapChartLoading(false);
      }
    },
    [heatmapChartTimeframe, heatmapMode]
  );

  // Reset Heatmap OHLC display when heatmap chart data changes
  useEffect(() => {
    if (heatmapChartData && heatmapChartData.length > 0) {
      const latest = heatmapChartData[heatmapChartData.length - 1];
      setHeatmapHoveredOhlc({
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        change: latest.close - latest.open,
        changePercent: latest.open > 0 ? ((latest.close - latest.open) / latest.open) * 100 : 0,
        time: latest.time,
      });
      console.log(`✅ [HEATMAP] OHLC loaded, showing latest candle`);
    } else {
      setHeatmapHoveredOhlc(null);
    }
  }, [heatmapChartData]);

  // Keep heatmap chart data ref updated
  useEffect(() => {
    heatmapChartDataRef.current = heatmapChartData;
  }, [heatmapChartData]);

  // Auto-update heatmap chart when timeframe changes (without needing to re-select date)
  useEffect(() => {
    if (journalChartMode === "heatmap" && heatmapSelectedDate && heatmapSelectedSymbol) {
      console.log(`⏱️ [HEATMAP TIMEFRAME] Changed to ${getJournalTimeframeLabel(heatmapChartTimeframe)} - re-fetching chart for ${heatmapSelectedDate}`);
      fetchHeatmapChartData(heatmapSelectedSymbol, heatmapSelectedDate);
    }
  }, [heatmapChartTimeframe, journalChartMode, fetchHeatmapChartData]);

  // Reset OHLC display when chart data changes (simple - same as Trading Master)
  useEffect(() => {
    if (journalChartData && journalChartData.length > 0) {
      const latest = journalChartData[journalChartData.length - 1];
      setHoveredCandleOhlc({
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        change: latest.close - latest.open,
        changePercent: latest.open > 0 ? ((latest.close - latest.open) / latest.open) * 100 : 0,
        time: latest.time,
      });
      console.log(`✅ JOURNAL OHLC: 1-minute candles loaded, showing latest candle`);
    } else {
      setHoveredCandleOhlc(null);
    }
  }, [journalChartData]);

  // 🔴 DISCONNECT: When user leaves journal tab, close SSE
  useEffect(() => {
    if (activeTab !== "journal") {
      if (journalEventSourceRef.current) {
        journalEventSourceRef.current.close();
        journalEventSourceRef.current = null;
        setIsJournalStreaming(false);
        setJournalLiveData(null);
        console.log("🔴 [SSE] Disconnected from live stream (tab change)");
      }
      return;
    }
  }, [activeTab]);

  // ✅ LIVE STREAMING: SSE connection starts immediately on journal tab open (no delay)
  useEffect(() => {
    if (activeTab !== "journal") {
      return;
    }

    // Get stock token info
    // 🔶 IN SEARCH MODE: ALWAYS use selectedJournalSymbol (manual search)
    // Otherwise: Try selectedInstrument (from heatmap) or fallback to mapping
    let stockToken: { token: string; exchange: string; tradingSymbol: string } | undefined;

    if (journalChartMode === "search") {
      // Search mode: Use selectedJournalSymbol with Angel One token mapping
      const cleanSymbol = getJournalAngelOneSymbol(selectedJournalSymbol);
      stockToken = journalAngelOneTokens[cleanSymbol];
      console.log(`✅ [SSE SEARCH MODE] Using selectedJournalSymbol: ${selectedJournalSymbol} → ${cleanSymbol}, Token: ${stockToken?.token}`);
    } else if (selectedInstrument) {
      // Heatmap mode: Use dynamically selected instrument
      stockToken = {
        token: selectedInstrument.token,
        exchange: selectedInstrument.exchange,
        tradingSymbol: selectedInstrument.tradingSymbol,
      };
      console.log("✅ [SSE HEATMAP MODE] Using dynamically selected instrument:", selectedInstrument);
    } else {
      // Fallback: Use hardcoded mapping
      const cleanSymbol = getJournalAngelOneSymbol(selectedJournalSymbol);
      stockToken = journalAngelOneTokens[cleanSymbol];
      console.log("✅ [SSE FALLBACK] Using hardcoded token mapping for:", cleanSymbol);
    }

    if (!stockToken) {
      console.warn(`❌ [SSE] No token found for symbol: ${selectedJournalSymbol} (mode: ${journalChartMode})`);
      return;
    }

    // Close existing connection if any
    if (journalEventSourceRef.current) {
      journalEventSourceRef.current.close();
      journalEventSourceRef.current = null;
    }

    // 🔴 FIX: Get last candle from chart data for initial OHLC values (if available)
    // Don't block SSE connection if chart data isn't ready yet - SSE starts independently
    const lastCandle = journalChartData && journalChartData.length > 0 ? journalChartData[journalChartData.length - 1] : undefined;

    // 🔶 Convert selected timeframe to seconds (selectedJournalInterval is in minutes)
    const intervalSeconds = parseInt(selectedJournalInterval || "1") * 60;

    // Start new WebSocket SSE connection with REAL Angel One market data
    let sseUrl = getFullApiUrl(
      `/api/angelone/live-stream-ws?symbol=${stockToken.tradingSymbol}&symbolToken=${stockToken.token}&exchange=${stockToken.exchange}&tradingSymbol=${stockToken.tradingSymbol}&interval=${intervalSeconds}`
    );

    // Add initial OHLC as fallback for when real API fails
    if (lastCandle && lastCandle.close > 0) {
      sseUrl += `&open=${lastCandle.open}&high=${lastCandle.high}&low=${lastCandle.low}&close=${lastCandle.close}&volume=${lastCandle.volume || 0}`;
      console.log("📡 [SSE] Initial fallback OHLC:", { open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close });
    }

    console.log(`📡 [SSE] Connecting with timeframe: ${selectedJournalInterval}min (${intervalSeconds}s candle interval)`);

    const eventSource = new EventSource(sseUrl);
    journalEventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("📡 [SSE] Connected to:", sseUrl);
      setIsJournalStreaming(true);
    };

    eventSource.onmessage = (event) => {
      try {
        console.log("📡 [SSE MESSAGE] Raw data:", event.data.substring(0, 100));
        const liveCandle = JSON.parse(event.data);
        console.log("💹 [PRICE] LTP:", liveCandle.close, "Open:", liveCandle.open, "Time:", liveCandle.time);

        // Update demo trading positions with live price (700ms real-time P&L)
        if (liveCandle.close > 0 && paperPositions.length > 0) {
          setPaperPositions((prev: any) =>
            prev.map((position: any) => {
              if (
                position.isOpen &&
                position.symbol === selectedJournalSymbol.replace("NSE:", "").replace("-INDEX", "")
              ) {
                const pnl = (liveCandle.close - position.entryPrice) * position.quantity;
                const pnlPercent = ((liveCandle.close - position.entryPrice) / position.entryPrice) * 100;
                return { ...position, currentPrice: liveCandle.close, pnl, pnlPercent };
              }
              return position;
            })
          );

          // 🔴 FIX: Only update current price for trade entry form if user EXPLICITLY selected an instrument in paper trading
          // WITHOUT THIS CHECK: Empty paperTradeSymbol caused "".includes to be true for all strings!
          if (paperTradeSymbol && selectedJournalSymbol.includes(paperTradeSymbol)) {
            setPaperTradeCurrentPrice(liveCandle.close);
          }
        }

        // Update chart candlestick - only if chart is initialized
        if (journalCandlestickSeriesRef.current && journalChartRef.current && liveCandle.close > 0) {
          // 🔶 Convert selected timeframe to seconds (selectedJournalInterval is in minutes)
          const intervalSeconds = parseInt(selectedJournalInterval || "1") * 60;
          console.log(`⏱️ [INTERVAL] Using ${selectedJournalInterval}min = ${intervalSeconds}s for countdown`);

          // Get the last candle from the chart (use ref to avoid triggering re-render)
          const chartData = journalChartDataRef.current;
          if (!chartData || chartData.length === 0) {
            console.warn("⚠️ Chart data ref is empty, skipping update");
            return;
          }
          const lastChartCandle = chartData[chartData.length - 1];
          if (!lastChartCandle) return;

          // Calculate the candle start time for the incoming live data (align to interval)
          const currentCandleStartTime = Math.floor(liveCandle.time / intervalSeconds) * intervalSeconds;

          // Calculate the start time of the last chart candle
          const lastCandleStartTime = Math.floor(lastChartCandle.time / intervalSeconds) * intervalSeconds;

          // Calculate countdown for the current candle
          const currentTime = Math.floor(Date.now() / 1000);
          const nextCandleTime = currentCandleStartTime + intervalSeconds;
          const remainingSeconds = Math.max(0, nextCandleTime - currentTime);
          const remainingMinutes = Math.floor(remainingSeconds / 60);
          const remainingSecondsDisplay = remainingSeconds % 60;

          // CRITICAL FIX: Check if market is open from SSE response (isMarketOpen or marketStatus)
          const isMarketActuallyOpen =
            liveCandle.isMarketOpen === true ||
            liveCandle.marketStatus === "live" ||
            liveCandle.marketStatus === "delayed";

          // Only show countdown if market is open, otherwise show empty
          const countdownFormatted = isMarketActuallyOpen
            ? remainingMinutes > 0
              ? `${remainingMinutes}:${remainingSecondsDisplay.toString().padStart(2, "0")}`
              : `${remainingSeconds}s`
            : "";

          // Update or create price line with LTP and countdown
          if (journalCandlestickSeriesRef.current) {
            // Remove existing price line if it exists
            if (journalPriceLineRef.current) {
              journalCandlestickSeriesRef.current.removePriceLine(journalPriceLineRef.current);
            }

            // Create new price line with current LTP and countdown
            journalPriceLineRef.current = journalCandlestickSeriesRef.current.createPriceLine({
              price: liveCandle.close,
              color: liveCandle.close >= liveCandle.open ? "#16a34a" : "#dc2626",
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: isMarketActuallyOpen ? countdownFormatted : "",
            });
          }

          // Update journalLiveData state with countdown
          setJournalLiveData({
            ltp: liveCandle.close,
            countdown: {
              remaining: isMarketActuallyOpen ? remainingSeconds : 0,
              total: intervalSeconds,
              formatted: isMarketActuallyOpen ? countdownFormatted : "Market Closed",
            },
            currentCandle: {
              time: liveCandle.time,
              open: liveCandle.open,
              high: liveCandle.high,
              low: liveCandle.low,
              close: liveCandle.close,
              volume: liveCandle.volume || 0,
            },
            isMarketOpen: isMarketActuallyOpen,
          });

          // Only update if we're within the same candle interval
          if (currentCandleStartTime === lastCandleStartTime) {
            // CRITICAL: Preserve candle OHLC - update only what changed
            // Use the last chart candle's open value (don't replace with latest price)
            const candleOpen = lastChartCandle.open; // PRESERVE original open
            const candleHigh = Math.max(lastChartCandle.high, liveCandle.close); // Update high if price exceeded
            const candleLow = Math.min(lastChartCandle.low, liveCandle.close); // Update low if price went below
            const candleClose = liveCandle.close; // Update close with latest price

            const changePercent = candleOpen > 0 ? ((candleClose - candleOpen) / candleOpen) * 100 : 0;

            // 🔴 CRITICAL: SAVE the current candle's final OHLC to use when it becomes the "previous" candle
            (window as any).journalLastFinalizedOHLC = {
              open: candleOpen,
              high: candleHigh,
              low: candleLow,
              close: candleClose,
              time: lastChartCandle.time,
            };

            setLiveOhlc({
              open: candleOpen,
              high: candleHigh,
              low: candleLow,
              close: candleClose,
              change: changePercent,
            });

            // Update the current candle with preserved OHLC
            setTimeout(() => {
              try {
                journalCandlestickSeriesRef.current?.update({
                  time: lastChartCandle.time as any,
                  open: candleOpen,
                  high: candleHigh,
                  low: candleLow,
                  close: candleClose,
                });
              } catch (e) {
                console.warn("⚠️ Chart update skipped (time conflict)", e);
              }
            }, 50);

            console.log(`📊 [UPDATE] Same candle interval, OHLC: O${candleOpen} H${candleHigh} L${candleLow} C${candleClose}`);
          } else if (currentCandleStartTime > lastCandleStartTime && isMarketActuallyOpen) {
            // We've crossed into a new candle interval AND market is open - add new candle
            console.log("🆕 [NEW CANDLE] New interval detected, adding new candle to chart (market is open)");

            // 🔴 CRITICAL: Use the SAVED final OHLC from the previous candle's last update
            // NOT the new candle's data!
            const savedOHLC = (window as any).journalLastFinalizedOHLC;
            const prevCandleOpen = savedOHLC?.open || lastChartCandle.open;
            const prevCandleHigh = savedOHLC?.high || lastChartCandle.high;
            const prevCandleLow = savedOHLC?.low || lastChartCandle.low;
            const prevCandleClose = savedOHLC?.close || lastChartCandle.close;

            console.log(
              `✅ [USING SAVED OHLC] From last update: O${prevCandleOpen} H${prevCandleHigh} L${prevCandleLow} C${prevCandleClose} (NOT from new candle with close: ${liveCandle.close})`
            );

            // 🔴 CRITICAL FIX: For new candle, initialize OHLC properly
            // Don't use live data's OHLC directly (it's just a single price point)
            // Instead, initialize new candle with current price for all OHLC values
            // Subsequent updates will adjust H and L while preserving O and C
            const newCandle = {
              time: currentCandleStartTime,
              open: liveCandle.close, // 🔴 FIX: Initialize with current price (not liveCandle.open)
              high: liveCandle.close, // 🔴 FIX: Initialize with current price
              low: liveCandle.close, // 🔴 FIX: Initialize with current price
              close: liveCandle.close,
              volume: liveCandle.volume || 0,
            };
            console.log(`🕯️ [NEW CANDLE INIT] Initialized O/H/L/C all to ${liveCandle.close} (will update H/L with future prices)`);

            // UPDATE STATE: Finalize previous candle + add new candle atomically
            const updatedChartData = (() => {
              const prev = journalChartDataRef.current || [];
              // Avoid duplicate new candles
              const newCandleExists = prev.some((c) => c.time === currentCandleStartTime);
              if (newCandleExists) return prev;

              // Create updated array with:
              // 1. All previous candles EXCEPT the last one
              // 2. The last candle with its FINALIZED OHLC
              // 3. The new candle
              const updated = [...prev];
              if (updated.length > 0) {
                // Update the last candle's OHLC to match what we calculated
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  open: prevCandleOpen,
                  high: prevCandleHigh,
                  low: prevCandleLow,
                  close: prevCandleClose,
                };
              }
              updated.push(newCandle);
              return updated;
            })();

            // Update BOTH state and ref synchronously to prevent desync
            setJournalChartData(updatedChartData);
            journalChartDataRef.current = updatedChartData;

            // 🔴 CRITICAL: Save viewport BEFORE any chart updates to prevent flickering
            let savedViewportRange: any = null;
            if (journalChartRef.current) {
              try {
                const timeScale = journalChartRef.current.timeScale();
                savedViewportRange = timeScale.getVisibleRange();
              } catch (e) {
                console.warn("⚠️ Could not save viewport range", e);
              }
            }

            // Update chart series with viewport preservation
            setTimeout(() => {
              if (journalCandlestickSeriesRef.current && journalChartRef.current) {
                try {
                  // FINALIZE previous candle on chart with its complete OHLC
                  journalCandlestickSeriesRef.current.update({
                    time: lastChartCandle.time as any,
                    open: prevCandleOpen,
                    high: prevCandleHigh,
                    low: prevCandleLow,
                    close: prevCandleClose,
                  });
                  console.log(
                    `✅ [CANDLE FINALIZED] Previous candle locked with OHLC: O${prevCandleOpen} H${prevCandleHigh} L${prevCandleLow} C${prevCandleClose}`
                  );

                  // Add the new candle immediately after finalizing previous
                  // 🔴 FIX: Use corrected OHLC values (all initialized to current price)
                  journalCandlestickSeriesRef.current.update({
                    time: currentCandleStartTime as any,
                    open: newCandle.open,
                    high: newCandle.high,
                    low: newCandle.low,
                    close: newCandle.close,
                  });
                  console.log(`🕯️ [CANDLE ADDED] New candle: O${newCandle.open} H${newCandle.high} L${newCandle.low} C${newCandle.close}`);

                  // 🎯 Restore viewport IMMEDIATELY after all candle updates
                  if (savedViewportRange) {
                    try {
                      const timeScale = journalChartRef.current.timeScale();
                      timeScale.setVisibleRange(savedViewportRange);
                      console.log("✅ [VIEWPORT RESTORED] Smooth transition complete");
                    } catch (e) {
                      console.warn("⚠️ Viewport restoration skipped", e);
                    }
                  }
                } catch (e) {
                  console.warn("⚠️ Candle update skipped (time conflict)", e);
                }
              }
            }, 20);

            // 🔴 FIX: Update live OHLC display using corrected new candle values
            const changePercent = newCandle.open > 0 ? ((newCandle.close - newCandle.open) / newCandle.open) * 100 : 0;
            setLiveOhlc({
              open: newCandle.open,
              high: newCandle.high,
              low: newCandle.low,
              close: newCandle.close,
              change: changePercent,
            });

            // Update candle count display (use ref to get count)
            if (journalCandleCountRef.current) {
              journalCandleCountRef.current.textContent = `${chartData.length + 1}`;
            }

            console.log(
              `🕯️ [CANDLE ADDED] Time: ${new Date(currentCandleStartTime * 1000).toLocaleTimeString()} OHLC: O${newCandle.open} H${newCandle.high} L${newCandle.low} C${newCandle.close}`
            );
          }

          // Update countdown bar
          if (journalCountdownBarRef.current) {
            const percentRemaining = (remainingSeconds / intervalSeconds) * 100;
            journalCountdownBarRef.current.style.width = `${percentRemaining}%`;
            journalCountdownBarRef.current.style.transformOrigin = "right center";
            journalCountdownBarRef.current.title = `${remainingSeconds}s / ${intervalSeconds}s`;
          }
        } else {
          console.log("⏳ Chart not ready yet:", {
            hasRef: !!journalCandlestickSeriesRef.current,
            hasChart: !!journalChartRef.current,
          });
        }
      } catch (err) {
        console.error("❌ SSE parse error:", err instanceof Error ? err.message : String(err));
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ [SSE ERROR]:", err);
      setIsJournalStreaming(false);
    };

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      setIsJournalStreaming(false);
    };
  }, [activeTab, selectedJournalSymbol, selectedJournalInterval, journalChartMode]);

  // Keep ref in sync with state for SSE logic (avoid recreating SSE on every data change)
  useEffect(() => {
    journalChartDataRef.current = journalChartData;
  }, [journalChartData]);

  // ❌ REMOVED: useEffect that fetched based on journalSelectedDate
  // Manual search chart is now standalone - only fetches on explicit button click

  // Initialize and render TradingView-style chart for Journal
  useEffect(() => {
    if (activeTab !== "journal") {
      if (journalRafRef.current !== null) {
        cancelAnimationFrame(journalRafRef.current);
        journalRafRef.current = null;
      }
      if (journalChartRef.current) {
        try {
          journalChartRef.current.remove();
        } catch (e) {}
        journalChartRef.current = null;
        journalCandlestickSeriesRef.current = null;
        journalEma12SeriesRef.current = null;
        journalEma26SeriesRef.current = null;
      }
      return;
    }

    if (!journalChartContainerRef.current) return;

    // Only render chart if we have data - don't show placeholder (user sees loading indicator)
    if (!journalChartData || journalChartData.length === 0) {
      return;
    }

    // Cancel any pending rAF from a previous render cycle
    if (journalRafRef.current !== null) {
      cancelAnimationFrame(journalRafRef.current);
      journalRafRef.current = null;
    }

    // Properly destroy old chart object before clearing DOM
    if (journalChartRef.current) {
      try { journalChartRef.current.remove(); } catch (e) {}
      journalChartRef.current = null;
      journalCandlestickSeriesRef.current = null;
      journalEma12SeriesRef.current = null;
      journalEma26SeriesRef.current = null;
      journalVolumeSeriesRef.current = null;
    }

    console.log(`📊 Rendering chart with ${journalChartData.length} candles`);

    // Clear container DOM content
    journalChartContainerRef.current.innerHTML = "";

    // Defer chart creation until layout is ready
    journalRafRef.current = requestAnimationFrame(() => {
      journalRafRef.current = null;
      if (!journalChartContainerRef.current) return;

      try {
        const containerWidth = journalChartContainerRef.current.clientWidth || 800;
        const containerHeight = journalChartContainerRef.current.clientHeight || 400;

        console.log("📊 Chart container dimensions:", { containerWidth, containerHeight });

        const isDark = document.documentElement.classList.contains("dark");
        const chartBg = isDark ? "#111827" : "#ffffff";
        const chartText = isDark ? "#d1d5db" : "#1f2937";
        const chartGrid = isDark ? "#1f2937" : "#f3f4f6";
        const chartCross = isDark ? "#4b5563" : "#9ca3af";
        const chartLabel = isDark ? "#1f2937" : "#f3f4f6";

        const chart = createChart(journalChartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: chartBg },
            textColor: chartText,
          },
          grid: {
            vertLines: { color: chartGrid, style: 1 },
            horzLines: { color: chartGrid, style: 1 },
          },
          crosshair: {
            mode: 1,
            vertLine: { color: chartCross, width: 1, style: 2, labelBackgroundColor: chartLabel },
            horzLine: { color: chartCross, width: 1, style: 2, labelBackgroundColor: chartLabel },
          },
          rightPriceScale: {
            visible: true,
            borderVisible: true,
            borderColor: isDark ? "#374151" : "#e5e7eb",
            scaleMargins: { top: 0.1, bottom: 0.25 },
            autoScale: true,
          },
          timeScale: {
            visible: true,
            borderVisible: true,
            borderColor: isDark ? "#374151" : "#e5e7eb",
            timeVisible: true,
            secondsVisible: false,
            barSpacing: 12,
            minBarSpacing: 4,
            fixLeftEdge: false,
            fixRightEdge: false,
            lockVisibleTimeRangeOnResize: false,
            tickMarkFormatter: (time: number) => {
              // Convert UTC timestamp to IST (UTC+5:30) and format for display
              const date = new Date(time * 1000);
              // Add IST offset: 5 hours 30 minutes = 330 minutes
              const istDate = new Date(date.getTime() + 330 * 60 * 1000);
              const hours = istDate.getUTCHours().toString().padStart(2, "0");
              const minutes = istDate.getUTCMinutes().toString().padStart(2, "0");
              return `${hours}:${minutes}`;
            },
          },
          localization: {
            timeFormatter: (time: number) => {
              // Format time for crosshair tooltip in IST
              const date = new Date(time * 1000);
              const istDate = new Date(date.getTime() + 330 * 60 * 1000);
              const hours = istDate.getUTCHours().toString().padStart(2, "0");
              const minutes = istDate.getUTCMinutes().toString().padStart(2, "0");
              const day = istDate.getUTCDate().toString().padStart(2, "0");
              const month = (istDate.getUTCMonth() + 1).toString().padStart(2, "0");
              return `${day}/${month} ${hours}:${minutes} IST`;
            },
          },
          autoSize: true,
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#16a34a",
          downColor: "#dc2626",
          borderUpColor: "#15803d",
          borderDownColor: "#b91c1c",
          wickUpColor: "#15803d",
          wickDownColor: "#b91c1c",
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "",
          color: "rgba(22, 163, 74, 0.3)",
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });

        const ema12Series = chart.addSeries(LineSeries, {
          color: "#0066ff",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
        });

        const ema26Series = chart.addSeries(LineSeries, {
          color: "#ff6600",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
        });

        journalChartRef.current = chart;
        journalCandlestickSeriesRef.current = candlestickSeries;
        journalEma12SeriesRef.current = ema12Series;
        journalEma26SeriesRef.current = ema26Series;
        journalVolumeSeriesRef.current = volumeSeries;

        // Subscribe to crosshair move for OHLC display (TradingView style)
        chart.subscribeCrosshairMove((param) => {
          if (!param.time || !param.point) {
            // Reset to latest candle when cursor leaves chart
            const latestData = journalChartData[journalChartData.length - 1];
            if (latestData) {
              const prevCandle = journalChartData[journalChartData.length - 2];
              const prevClose = prevCandle?.close || latestData.open;
              const change = latestData.close - prevClose;
              const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
              setHoveredCandleOhlc({
                open: latestData.open,
                high: latestData.high,
                low: latestData.low,
                close: latestData.close,
                change,
                changePercent,
                time: latestData.time,
              });
            }
            return;
          }

          // Get candle data at crosshair position
          const candleData = param.seriesData.get(candlestickSeries);
          if (candleData && "open" in candleData) {
            // Find previous candle for change calculation
            const sortedData = [...journalChartData].sort((a, b) => a.time - b.time);
            const currentIndex = sortedData.findIndex((c) => c.time === param.time);
            const prevCandle = currentIndex > 0 ? sortedData[currentIndex - 1] : null;
            const prevClose = prevCandle?.close || candleData.open;
            const change = candleData.close - prevClose;
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

            setHoveredCandleOhlc({
              open: candleData.open,
              high: candleData.high,
              low: candleData.low,
              close: candleData.close,
              change,
              changePercent,
              time: param.time as number,
            });
          }
        });

        // Set data immediately
        const sortedData = [...journalChartData].sort((a: any, b: any) => a.time - b.time);

        const chartData = sortedData.map((candle: any) => ({
          time: candle.time as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        candlestickSeries.setData(chartData);

        // Initialize hovered OHLC with latest candle data
        if (sortedData.length > 0) {
          const latestCandle = sortedData[sortedData.length - 1];
          const prevCandle = sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;
          const prevClose = prevCandle?.close || latestCandle.open;
          const change = latestCandle.close - prevClose;
          const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
          setHoveredCandleOhlc({
            open: latestCandle.open,
            high: latestCandle.high,
            low: latestCandle.low,
            close: latestCandle.close,
            change,
            changePercent,
            time: latestCandle.time,
          });
        }

        // Volume data with color based on price movement
        const volumeData = sortedData.map((candle: any) => ({
          time: candle.time as any,
          value: candle.volume || 0,
          color: candle.close >= candle.open ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
        }));
        volumeSeries.setData(volumeData);

        const closePrices = sortedData.map((c: any) => c.close);
        const ema12 = calculateEMA(closePrices, 12);
        const ema26 = calculateEMA(closePrices, 26);

        const ema12Data = ema12
          .map((value, index) => ({
            time: sortedData[index + 11]?.time as any,
            value: value,
          }))
          .filter((d) => d.time);

        const ema26Data = ema26
          .map((value, index) => ({
            time: sortedData[index + 25]?.time as any,
            value: value,
          }))
          .filter((d) => d.time);

        if (ema12Data.length > 0) {
          ema12Series.setData(ema12Data);
          setJournalEmaValues((prev) => ({ ...prev, ema12: ema12Data[ema12Data.length - 1]?.value || null }));
        }
        if (ema26Data.length > 0) {
          ema26Series.setData(ema26Data);
          setJournalEmaValues((prev) => ({ ...prev, ema26: ema26Data[ema26Data.length - 1]?.value || null }));
        }

        // Fit content but with better zoom to show time scale
        setTimeout(() => {
          if (journalChartRef.current) {
            journalChartRef.current.timeScale().fitContent();
            // Reset zoom to prevent over-zooming that hides time scale
            journalChartRef.current.timeScale().applyOptions({ rightOffset: 10 });
          }
        }, 100);

        // autoSize: true handles all resize events via ResizeObserver
      } catch (error) {
        console.error("❌ Error rendering journal chart:", error instanceof Error ? error.message : String(error));
        if (error instanceof Error) console.error("Stack:", error.stack);
        // Show error message instead of placeholder
        if (journalChartContainerRef.current) {
          journalChartContainerRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-center; height: 100%; font-size: 12px; color: #e74c3c;">
              Chart render error: ${error instanceof Error ? error.message : "Unknown error"}
            </div>
          `;
        }
      }
    });

    return () => {
      if (journalRafRef.current !== null) {
        cancelAnimationFrame(journalRafRef.current);
        journalRafRef.current = null;
      }
    };
  }, [activeTab, selectedJournalSymbol, journalChartTimeframe, journalChartData]);

  // ========== HEATMAP CHART INITIALIZATION ==========
  // Separate chart for heatmap date selection - completely independent from search chart
  useEffect(() => {
    if (activeTab !== "journal") {
      if (heatmapChartRef.current) {
        try {
          heatmapChartRef.current.remove();
        } catch (e) {}
        heatmapChartRef.current = null;
        heatmapCandlestickSeriesRef.current = null;
      }
      return;
    }

    if (!heatmapChartContainerRef.current) return;
    if (!heatmapChartData || heatmapChartData.length === 0) return;

    console.log(`🗓️ [HEATMAP CHART] Rendering with ${heatmapChartData.length} candles for date: ${heatmapSelectedDate}`);

    // Defer chart creation until layout is ready
    const timer = setTimeout(() => {
      if (!heatmapChartContainerRef.current) return;

      try {
        // Clean up existing chart first
        if (heatmapChartRef.current) {
          try {
            heatmapChartRef.current.remove();
          } catch (e) {}
          heatmapChartRef.current = null;
          heatmapCandlestickSeriesRef.current = null;
        }

        // Clear container
        heatmapChartContainerRef.current.innerHTML = "";

        const containerWidth = heatmapChartContainerRef.current.clientWidth || 800;
        const containerHeight = heatmapChartContainerRef.current.clientHeight || 400;

        console.log("🗓️ [HEATMAP CHART] Container dimensions:", { containerWidth, containerHeight });

        if (containerHeight === 0) {
          console.warn("🗓️ [HEATMAP CHART] Container height is 0, chart might not be visible");
        }

        const isDark = document.documentElement.classList.contains("dark");
        const chartBg = isDark ? "#111827" : "#ffffff";
        const chartText = isDark ? "#d1d5db" : "#1f2937";
        const chartGrid = isDark ? "#1f2937" : "#f3f4f6";
        const chartCross = isDark ? "#4b5563" : "#9ca3af";
        const chartLabel = isDark ? "#1f2937" : "#f3f4f6";

        const chart = createChart(heatmapChartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: chartBg },
            textColor: chartText,
          },
          grid: {
            vertLines: { color: chartGrid, style: 1 },
            horzLines: { color: chartGrid, style: 1 },
          },
          crosshair: {
            mode: 1,
            vertLine: { color: chartCross, width: 1, style: 2, labelBackgroundColor: chartLabel },
            horzLine: { color: chartCross, width: 1, style: 2, labelBackgroundColor: chartLabel },
          },
          rightPriceScale: {
            visible: true,
            borderVisible: true,
            borderColor: isDark ? "#374151" : "#e5e7eb",
            scaleMargins: { top: 0.1, bottom: 0.25 },
            autoScale: true,
          },
          timeScale: {
            visible: true,
            borderVisible: true,
            borderColor: isDark ? "#374151" : "#e5e7eb",
            timeVisible: true,
            secondsVisible: false,
            barSpacing: 12,
            minBarSpacing: 4,
            fixLeftEdge: false,
            fixRightEdge: false,
            lockVisibleTimeRangeOnResize: false,
            tickMarkFormatter: (time: number) => {
              const date = new Date(time * 1000);
              const istDate = new Date(date.getTime() + 330 * 60 * 1000);
              const hours = istDate.getUTCHours().toString().padStart(2, "0");
              const minutes = istDate.getUTCMinutes().toString().padStart(2, "0");
              return `${hours}:${minutes}`;
            },
          },
          localization: {
            timeFormatter: (time: number) => {
              const date = new Date(time * 1000);
              const istDate = new Date(date.getTime() + 330 * 60 * 1000);
              const hours = istDate.getUTCHours().toString().padStart(2, "0");
              const minutes = istDate.getUTCMinutes().toString().padStart(2, "0");
              const day = istDate.getUTCDate().toString().padStart(2, "0");
              const month = (istDate.getUTCMonth() + 1).toString().padStart(2, "0");
              return `${day}/${month} ${hours}:${minutes} IST`;
            },
          },
          autoSize: true,
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#16a34a",
          downColor: "#dc2626",
          borderUpColor: "#15803d",
          borderDownColor: "#b91c1c",
          wickUpColor: "#15803d",
          wickDownColor: "#b91c1c",
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "",
          color: "rgba(147, 51, 234, 0.3)", // Purple for heatmap chart
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });

        heatmapChartRef.current = chart;
        heatmapCandlestickSeriesRef.current = candlestickSeries;

        // Subscribe to crosshair move for OHLC display
        chart.subscribeCrosshairMove((param) => {
          if (!param.time || !param.point) {
            const latestData = heatmapChartData[heatmapChartData.length - 1];
            if (latestData) {
              const prevCandle = heatmapChartData[heatmapChartData.length - 2];
              const prevClose = prevCandle?.close || latestData.open;
              const change = latestData.close - prevClose;
              const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
              setHeatmapHoveredOhlc({
                open: latestData.open,
                high: latestData.high,
                low: latestData.low,
                close: latestData.close,
                change,
                changePercent,
                time: latestData.time,
              });
            }
            return;
          }

          const candleData = param.seriesData.get(candlestickSeries);
          if (candleData && "open" in candleData) {
            const sortedData = [...heatmapChartData].sort((a, b) => a.time - b.time);
            const currentIndex = sortedData.findIndex((c) => c.time === param.time);
            const prevCandle = currentIndex > 0 ? sortedData[currentIndex - 1] : null;
            const prevClose = prevCandle?.close || candleData.open;
            const change = candleData.close - prevClose;
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

            setHeatmapHoveredOhlc({
              open: candleData.open,
              high: candleData.high,
              low: candleData.low,
              close: candleData.close,
              change,
              changePercent,
              time: param.time as number,
            });
          }
        });

        // Set data
        const sortedData = [...heatmapChartData].sort((a: any, b: any) => a.time - b.time);

        const chartData = sortedData.map((candle: any) => ({
          time: candle.time as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        const volumeData = sortedData.map((candle: any) => ({
          time: candle.time as any,
          value: candle.volume || 0,
          color: candle.close >= candle.open ? "rgba(147, 51, 234, 0.4)" : "rgba(220, 38, 38, 0.4)",
        }));

        candlestickSeries.setData(chartData);
        volumeSeries.setData(volumeData);

        // ========== ADD BUY/SELL TRADE MARKERS ==========
        if (heatmapTradeHistory && heatmapTradeHistory.length > 0) {
          const markers: any[] = [];

          // MCX mini variant normalisation (shared for both chart and trade symbols)
          const MCX_MINI_MAP: Record<string, string> = { CRUDEOILM: "CRUDEOIL", GOLDM: "GOLD", SILVERM: "SILVER" };

          // Extract and normalise the underlying from the currently-displayed chart symbol
          let currentChartUnderlying = heatmapSelectedSymbol
            .replace(/^(NSE|BSE|MCX|NFO|BFO):/, "")
            .replace(/-INDEX$/i, "")
            .replace(/-EQ$/i, "")
            .replace(/\d{2}[A-Z]{3}\d{2}FUT$/i, "") // DDMONYYFUT (CRUDEOILM18DEC25FUT)
            .replace(/\d{2}[A-Z]{3}FUT$/i, "") // YYMONFUT   (NIFTY25JUNFUT)
            .split(" ")[0]
            .toUpperCase();
          if (currentChartUnderlying === "NIFTY") currentChartUnderlying = "NIFTY50";
          currentChartUnderlying = MCX_MINI_MAP[currentChartUnderlying] || currentChartUnderlying;

          console.log(`🔍 [HEATMAP MARKERS] Processing ${heatmapTradeHistory.length} trades, filtering for symbol: ${currentChartUnderlying}...`);

          heatmapTradeHistory.forEach((trade) => {
            // FILTER BY SYMBOL: strip exchange prefix + expiry/type suffixes, then compare
            const tradeSymbol = trade.symbol || "";
            let tradeUnderlying = tradeSymbol
              .replace(/^(NSE|BSE|MCX|NFO|BFO):/, "")
              .split(" ")[0]
              .replace(/-EQ$/i, "")
              .replace(/-INDEX$/i, "")
              .replace(/\d{2}[A-Z]{3}\d{2}FUT$/i, "") // DDMONYYFUT
              .replace(/\d{2}[A-Z]{3}FUT$/i, "") // YYMONFUT
              .replace(/\d{2}[A-Z]{3}\d{2}(CE|PE)$/i, "") // options
              .toUpperCase();
            if (tradeUnderlying === "NIFTY") tradeUnderlying = "NIFTY50";
            tradeUnderlying = MCX_MINI_MAP[tradeUnderlying] || tradeUnderlying;

            // Only process trades whose underlying matches the current chart
            if (tradeUnderlying !== currentChartUnderlying) {
              console.log(`⏭️ [HEATMAP MARKERS] Skipping trade for ${tradeUnderlying} (current chart: ${currentChartUnderlying})`);
              return;
            }

            // Parse trade time (format: "HH:MM:SS AM/PM")
            const timeStr = trade.time || "";
            if (!timeStr) {
              console.warn(`⚠️ [HEATMAP MARKERS] Trade has no time: ${JSON.stringify(trade)}`);
              return;
            }

            console.log(`📝 [HEATMAP MARKERS] Processing trade: ${JSON.stringify(trade)}`);

            try {
              // Extract hours, minutes, seconds from time string
              // Supports both "HH:MM:SS AM/PM" and "HH:MM:SS" (24-hour) formats
              const match = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
              if (!match) {
                console.warn(`⚠️ [HEATMAP MARKERS] Could not parse time: "${timeStr}"`);
                return;
              }

              let hours = parseInt(match[1]);
              const minutes = parseInt(match[2]);
              const seconds = match[3] ? parseInt(match[3]) : 0; // Default to 0 if not provided
              const period = match[4] ? match[4].toUpperCase() : null; // AM/PM is optional

              // Convert to 24-hour format only if AM/PM is provided
              if (period === "PM" && hours !== 12) hours += 12;
              if (period === "AM" && hours === 12) hours = 0;

              console.log(`⏱️  [HEATMAP MARKERS] Trade "${trade.order}" at ${timeStr} -> ${hours}:${minutes} IST`);

              // Find matching candle by time of day (IST)
              const matchingCandle = sortedData.find((candle) => {
                const candleDate = new Date(candle.time * 1000);
                const istCandleDate = new Date(candleDate.getTime() + 330 * 60 * 1000);
                const candleHours = istCandleDate.getUTCHours();
                const candleMinutes = istCandleDate.getUTCMinutes();

                // Match within the same minute
                return candleHours === hours && candleMinutes === minutes;
              });

              if (matchingCandle) {
                const isGreen = trade.order === "BUY";

                markers.push({
                  time: matchingCandle.time as any,
                  position: isGreen ? "belowBar" : "aboveBar",
                  color: isGreen ? "#16a34a" : "#dc2626",
                  shape: isGreen ? "arrowUp" : "arrowDown",
                  text: `${trade.order}`,
                });

                console.log(`✅ [HEATMAP MARKERS] Matched "${trade.order}" at ${timeStr} to candle time ${matchingCandle.time}`);
              } else {
                console.warn(`❌ [HEATMAP MARKERS] No matching candle found for time ${timeStr} (${hours}:${minutes})`);
              }
            } catch (e) {
              console.error(`❌ [HEATMAP MARKERS] Parse error for "${timeStr}":`, e);
            }
          });

          if (markers.length > 0) {
            // Use createSeriesMarkers wrapper for proper API support
            heatmapSeriesMarkersRef.current = createSeriesMarkers(candlestickSeries);
            heatmapSeriesMarkersRef.current.setMarkers(markers);

            const buyCount = heatmapTradeHistory.filter((t) => t.order === "BUY").length;
            const sellCount = heatmapTradeHistory.filter((t) => t.order === "SELL").length;
            console.log(`📍 [HEATMAP] Successfully added ${markers.length} trade markers (${buyCount} BUY, ${sellCount} SELL)`);
          } else {
            console.warn(`⚠️ [HEATMAP] No markers created despite ${heatmapTradeHistory.length} trades`);
          }
        }

        // Fit content
        setTimeout(() => {
          if (heatmapChartRef.current) {
            heatmapChartRef.current.timeScale().fitContent();
            heatmapChartRef.current.timeScale().applyOptions({ rightOffset: 10 });
          }
        }, 100);

        // autoSize: true handles all resize events via ResizeObserver

        console.log("🗓️ [HEATMAP CHART] Successfully rendered");
      } catch (error) {
        console.error("🗓️ [HEATMAP CHART] Error rendering:", error instanceof Error ? error.message : String(error));
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [activeTab, heatmapChartData, heatmapTradeHistory, heatmapSelectedDate]);

  // Extract underlying symbol from option/futures trade symbol
  const getTradeUnderlyingSymbol = (tradeSymbol: string): string => {
    // For options/futures like "NIFTY 22nd w MAR PE", "BANKNIFTY 15 AUG CE", "SENSEX FEB PE", extract the underlying
    const indexSymbols = ["NIFTY50", "NIFTY", "BANKNIFTY", "SENSEX", "FINNIFTY", "MIDCPNIFTY", "NIFTYIT"];
    const cleanSymbol = tradeSymbol.toUpperCase().trim();

    // Try to match longest symbols first to avoid partial matches
    const sorted = [...indexSymbols].sort((a, b) => b.length - a.length);

    for (const idx of sorted) {
      if (cleanSymbol.includes(idx)) {
        const result = idx === "NIFTY" ? "NIFTY50" : idx; // Map NIFTY to NIFTY50
        return result;
      }
    }
    return cleanSymbol; // Return clean symbol if no index match
  };

  // Check if trade symbol matches chart symbol (including option/futures on underlying)
  const doesTradeMatchChart = (tradeSymbol: string, chartSymbol: string): boolean => {
    const tradeUnderlying = getTradeUnderlyingSymbol(tradeSymbol);
    const chartUnderlying = getTradeUnderlyingSymbol(chartSymbol);
    const matches = tradeUnderlying === chartUnderlying;

    console.log(
      `🔍 Symbol Match Check: Trade="${tradeSymbol}" (underlying="${tradeUnderlying}") vs Chart="${chartSymbol}" (underlying="${chartUnderlying}") = ${matches}`
    );
    return matches;
  };

  // Convert trade history to chart markers (TIME-BASED ONLY - ignores symbol matching)
  const getTradeMarkersForChart = useCallback((): TradeMarker[] => {
    if (
      !tradeHistoryData ||
      tradeHistoryData.length === 0 ||
      !journalChartData ||
      journalChartData.length === 0
    ) {
      console.log("🔴 MARKER ABORT: No trade or chart data", { trades: tradeHistoryData?.length || 0, candles: journalChartData?.length || 0 });
      return [];
    }

    console.log("🟢 MARKER START: Processing", tradeHistoryData.length, "trades against", journalChartData.length, "candles");
    const markers: TradeMarker[] = [];

    // Use heatmap selected date for chart markers (independent from search chart)

    tradeHistoryData.forEach((trade, index) => {
      try {
        // 🔶 TIME-BASED MATCHING ONLY - ignore symbol, use only trade time
        // Parse trade time (e.g., "1:16:33 PM" or "11:23:56 AM")
        const tradeTime = trade.time;
        if (!tradeTime) {
          console.log(`❌ Trade #${index + 1}: No time found`);
          return;
        }

        // Convert 12-hour format to 24-hour format
        const [time, period] = tradeTime.split(" ");
        const [hours, minutes, seconds] = time.split(":").map(Number);
        let hour24 = hours;

        if (period?.toUpperCase() === "PM" && hours !== 12) {
          hour24 = hours + 12;
        } else if (period?.toUpperCase() === "AM" && hours === 12) {
          hour24 = 0;
        }

        // Create target time in minutes from midnight for comparison
        const tradeMinutesFromMidnight = hour24 * 60 + minutes;

        console.log(
          `🕐 Trade #${index + 1}: ${tradeTime} → 24h: ${hour24}:${String(minutes).padStart(2, "0")} (${tradeMinutesFromMidnight}min) [${trade.order}]`
        );

        // Find closest candle in chart data by matching time
        let closestCandleIndex = -1;
        let minTimeDiff = Infinity;

        journalChartData.forEach((candle, candleIndex) => {
          // Candle timestamp is UTC (Unix seconds), convert to IST for matching
          // IST = UTC + 5:30 hours = UTC + 330 minutes
          const candleDate = new Date(candle.time * 1000);
          const utcMinutes = candleDate.getUTCHours() * 60 + candleDate.getUTCMinutes();
          const istMinutes = (utcMinutes + 330) % 1440; // Add IST offset, wrap at midnight

          const timeDiff = Math.abs(istMinutes - tradeMinutesFromMidnight);

          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestCandleIndex = candleIndex;
          }
        });

        // Use timeframe interval to determine matching tolerance
        // For 1-min candles, use 1-min tolerance; for 5-min candles, use 3-min tolerance, etc.
        const timeframeMinutes = parseInt(journalChartTimeframe) || 1;
        const timeframeTolerance = Math.max(Math.ceil(timeframeMinutes / 2), 1);

        if (closestCandleIndex !== -1 && minTimeDiff <= timeframeTolerance) {
          const candle = journalChartData[closestCandleIndex];
          // Use candle high/low for marker position (BUY below bar, SELL above bar)
          const price = trade.order === "BUY" ? candle.low : candle.high;

          markers.push({
            candleIndex: closestCandleIndex,
            price: trade.price || price,
            type: trade.order.toLowerCase() as "buy" | "sell",
            symbol: trade.symbol,
            quantity: trade.qty,
            time: trade.time,
            pnl: trade.pnl,
          });
          console.log(`✅ Marker added: ${trade.order} @ ${trade.time} → Candle #${closestCandleIndex} (diff: ${minTimeDiff}min)`);
        } else {
          console.log(`⚠️ No matching candle for trade @ ${trade.time} (closest diff: ${minTimeDiff}min, tolerance: ${timeframeTolerance}min)`);
        }
      } catch (error) {
        console.error("Error parsing trade for markers:", trade, error);
      }
    });

    console.log(
      "📊 Generated trade markers:",
      markers.length,
      "markers from",
      tradeHistoryData.length,
      "trades (TIME-BASED matching)"
    );
    return markers;
  }, [tradeHistoryData, journalChartData, journalChartTimeframe]);

  // Check if symbol is an INDEX (NIFTY50, BANKNIFTY, etc) - marks only for indices
  const isIndexChart = () => {
    const indexSymbols = ["NIFTY50", "BANKNIFTY", "SENSEX", "FINNIFTY", "MIDCPNIFTY", "NIFTYIT"];
    const cleanSymbol = getJournalAngelOneSymbol(selectedJournalSymbol);
    return indexSymbols.some((idx) => cleanSymbol.toUpperCase().includes(idx));
  };

  // Apply trade marks to chart (TIME-BASED - matches trade history times to candles)
  useEffect(() => {
    if (activeTab !== "journal" || !journalCandlestickSeriesRef.current || !journalChartRef.current) {
      return;
    }

    // If markers are hidden, skip
    if (!showTradeMarkers) {
      return;
    }

    // Only display marks if there's chart data AND trade data for current date
    if (!journalChartData || journalChartData.length === 0 || !tradeHistoryData || tradeHistoryData.length === 0) {
      return;
    }

    const markers = getTradeMarkersForChart();
    console.log("📊 MARKER DEBUG (TIME-BASED) - Trades:", tradeHistoryData.length, "Chart candles:", journalChartData.length);
    console.log("  - Generated markers:", markers.length, "Visible:", showTradeMarkers);

    markers.forEach((m, idx) => {
      console.log(`  📍 [${idx}] Candle#${m.candleIndex} TIME: ${m.time} - ${m.type.toUpperCase()} @ ₹${m.price}`);
    });

    try {
      if (markers.length > 0) {
        // Use built-in setMarkers with TradingView-style arrows
        const chartMarkers = markers
          .map((marker, idx) => {
            const candle = journalChartData[marker.candleIndex];
            const markTime = candle?.time;

            const mObj: any = {
              time: markTime,
              position: marker.type === "buy" ? "belowBar" : "aboveBar",
              color: marker.type === "buy" ? "#22c55e" : "#ef4444", // Bright green/red
              shape: marker.type === "buy" ? "arrowUp" : "arrowDown",
              text: `${marker.type === "buy" ? "BUY" : "SELL"} ${marker.time}`,
            };

            console.log(`  🔄 [${idx}] time:${markTime} ${mObj.shape} pos:${mObj.position} text:${mObj.text}`);
            return mObj;
          })
          .filter((m, idx) => {
            const hasTime = m.time !== undefined;
            if (!hasTime) console.log(`  ❌ Filtered marker ${idx} - undefined time`);
            return hasTime;
          });

        // Sort markers by time (required by lightweight-charts)
        chartMarkers.sort((a: any, b: any) => a.time - b.time);

        console.log(`  🎯 Final markers to apply: ${chartMarkers.length}`);

        // ✅ Markers disabled - LightweightCharts doesn't support setMarkers on series
        (journalCandlestickSeriesRef.current as any).setMarkers(chartMarkers);
        console.log(`📊 ✅ Markers applied to series: ${chartMarkers.length}`);
      } else {
        console.log("📊 No markers to apply - clearing");
        if (journalCandlestickSeriesRef.current) (journalCandlestickSeriesRef.current as any).setMarkers([]);
      }
    } catch (e) {
      console.error("📊 ❌ Marker Error:", e);
    }
  }, [activeTab, journalChartData, tradeHistoryData, getTradeMarkersForChart, showTradeMarkers, selectedJournalSymbol]);

  // Cancel any in-flight heatmap fetch and switch back to search chart
  const handleCloseHeatmap = useCallback(() => {
    heatmapFetchIdRef.current += 1;
    setJournalChartMode("search");
  }, []);

  // ─── Return ────────────────────────────────────────────────────────────────
  return {
    // State
    journalChartData,
    setJournalChartData,
    journalChartLoading,
    setJournalChartLoading,
    journalChartTimeframe,
    setJournalChartTimeframe,
    showJournalTimeframeDropdown,
    setShowJournalTimeframeDropdown,
    showHeatmapTimeframeDropdown,
    setShowHeatmapTimeframeDropdown,
    showTradeMarkers,
    setShowTradeMarkers,
    journalChartMode,
    setJournalChartMode,
    handleCloseHeatmap,
    heatmapChartData,
    setHeatmapChartData,
    heatmapChartLoading,
    setHeatmapChartLoading,
    heatmapChartTimeframe,
    setHeatmapChartTimeframe,
    heatmapSelectedSymbol,
    setHeatmapSelectedSymbol,
    heatmapSelectedDate,
    setHeatmapSelectedDate,
    heatmapTradeHistory,
    setHeatmapTradeHistory,
    heatmapHoveredOhlc,
    setHeatmapHoveredOhlc,
    hoveredCandleOhlc,
    setHoveredCandleOhlc,
    journalEmaValues,
    journalLiveData,
    isJournalStreaming,
    liveOhlc,
    setLiveOhlc,
    searchedInstruments,
    setSearchedInstruments,
    isSearchingInstruments,
    selectedInstrument,
    setSelectedInstrument,
    selectedInstrumentToken,
    setSelectedInstrumentToken,

    // Refs (DOM)
    journalChartContainerRef,
    heatmapChartContainerRef,
    journalCandleCountRef,
    journalCountdownBarRef,

    // Refs (chart instances - for external access e.g. handleDateSelect)
    journalChartRef,
    journalCandlestickSeriesRef,
    journalEma12SeriesRef,
    journalEma26SeriesRef,
    heatmapChartRef,
    heatmapCandlestickSeriesRef,
    heatmapEma12SeriesRef,
    heatmapEma26SeriesRef,

    // Functions
    fetchJournalChartData,
    fetchHeatmapChartData,
    getJournalTimeframeLabel,
    getJournalAngelOneInterval,
    getJournalAngelOneSymbol,
    getJournalTimeframeMinutes,
    getAllJournalTimeframes,
    deleteJournalTimeframe,
    convertJournalCustomTimeframe,
    createJournalCustomTimeframeLabel,
    getExchangeForJournalSearchType,
    fetchInstruments,
    calculateEMA,
    getTradeMarkersForChart,
    getTradeUnderlyingSymbol,
    doesTradeMatchChart,
    isIndexChart,

    // Constants (used in JSX)
    journalTimeframeOptions,
    journalAngelOneTokens,
    defaultInstruments,
    categorySearchSuggestions,
  };
}
