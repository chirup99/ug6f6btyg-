import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCognitoToken } from "@/cognito";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PaperPosition {
  id: string;
  symbol: string;
  type: 'STOCK' | 'FUTURES' | 'OPTIONS';
  action: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  entryTime: string;
  pnl: number;
  pnlPercent: number;
  isOpen: boolean;
  slEnabled?: boolean;
  slType?: 'price' | 'percent' | 'duration' | 'high' | 'low';
  slValue?: string;
  slTimeframe?: string;
  slDurationUnit?: string;
  slTriggerPrice?: number;
  slExpiryTime?: number;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  type: 'STOCK' | 'FUTURES' | 'OPTIONS';
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  time: string;
  pnl?: string;
  closedAt?: string;
}

// ─── Pure utility helpers (inlined to avoid cross-file dependency) ─────────────

function _formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function _parseTradeTime(timeStr: string): Date {
  if (!timeStr) return new Date(0);
  if (timeStr.includes("-") || timeStr.includes("T")) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) return d;
  }
  const timeMatch = timeStr.match(/(\d+):(\d+):(\d+)\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseInt(timeMatch[3]);
    const ampm = timeMatch[4]?.toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, seconds, 0);
    return d;
  }
  const d = new Date(`1970-01-01 ${timeStr}`);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function _formatDuration(durationMs: number): string {
  if (durationMs < 0) return '-';
  const totalSeconds = Math.floor(durationMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  return parts.length > 0 ? parts.join(' ') : '0s';
}

function _convertTimeToComparable(timeStr: string): string {
  try {
    let time = timeStr.trim();
    if (!time.includes("AM") && !time.includes("PM")) {
      return time.padStart(8, "0");
    }
    const match = time.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const seconds = match[3];
      const period = match[4].toUpperCase();
      if (period === "AM" && hours === 12) hours = 0;
      else if (period === "PM" && hours !== 12) hours += 12;
      return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
    }
    return time;
  } catch {
    return timeStr;
  }
}

function _calculateSimplePnL(trades: any[]): any[] {
  const processedTrades = [...trades].sort((a, b) => {
    const tA = _parseTradeTime(a.time).getTime();
    const tB = _parseTradeTime(b.time).getTime();
    if (tA !== tB) return tA - tB;
    if (a.order === 'BUY' && b.order !== 'BUY') return -1;
    if (a.order !== 'BUY' && b.order === 'BUY') return 1;
    return 0;
  });

  const positions: { [symbol: string]: { qty: number; avgPrice: number; firstTradeTime: string } } = {};

  for (let i = 0; i < processedTrades.length; i++) {
    const trade = processedTrades[i];
    const symbol = trade.symbol;
    if (!positions[symbol]) {
      positions[symbol] = { qty: 0, avgPrice: 0, firstTradeTime: trade.time };
    }
    if (trade.order === "BUY") {
      const currentValue = positions[symbol].qty * positions[symbol].avgPrice;
      const newValue = trade.qty * trade.price;
      const totalQty = positions[symbol].qty + trade.qty;
      if (totalQty > 0) positions[symbol].avgPrice = (currentValue + newValue) / totalQty;
      positions[symbol].qty = totalQty;
      if (positions[symbol].qty === trade.qty) positions[symbol].firstTradeTime = trade.time;
    } else if (trade.order === "SELL") {
      if (positions[symbol].qty > 0) {
        const pnlPerShare = trade.price - positions[symbol].avgPrice;
        const totalPnL = pnlPerShare * trade.qty;
        const entryTime = _parseTradeTime(positions[symbol].firstTradeTime);
        const exitTime = _parseTradeTime(trade.time);
        const durationMs = exitTime.getTime() - entryTime.getTime();
        processedTrades[i].pnl = `₹${totalPnL.toFixed(2)}`;
        processedTrades[i].duration = _formatDuration(durationMs);
        positions[symbol].qty -= trade.qty;
        if (positions[symbol].qty <= 0) {
          positions[symbol] = { qty: 0, avgPrice: 0, firstTradeTime: "" };
        }
      }
    }
  }

  processedTrades.sort((a, b) => {
    const timeA = _convertTimeToComparable(a.time);
    const timeB = _convertTimeToComparable(b.time);
    return timeA.localeCompare(timeB);
  });

  return processedTrades;
}

// ─── Hook params ──────────────────────────────────────────────────────────────

export interface UsePaperTradingParams {
  zerodhaAccessToken: string | null;
  upstoxAccessToken: string | null;
  userAngelOneToken: string | null;
  dhanAccessToken: string | null;
  growwAccessToken: string | null;
  fyersIsConnected: boolean;
  activeBroker: string | null;
  setBrokerFunds: (v: number | null) => void;
  setAllBrokerFunds: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  authInitialized: boolean;
  isViewOnlyMode: boolean;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  tradingDataByDate: Record<string, any>;
  personalTradingDataByDate: Record<string, any>;
  setPersonalTradingDataByDate: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setTradeHistoryData: (data: any) => void;
  setTradeHistoryData2: React.Dispatch<React.SetStateAction<any[]>>;
  setTradeHistoryWindow: (val: number) => void;
  setHeatmapSelectedDate: (date: string) => void;
  setSelectedDate: (date: Date | null) => void;
  setPersonalHeatmapRevision: React.Dispatch<React.SetStateAction<number>>;
  setShowOrderModal: (val: boolean) => void;
  setShowSecondaryOrderModal: (val: boolean) => void;
  brokerOrders: any[];
  broker2Orders: any[];
  secondaryBroker: string | null;
  fyersOrders: any[] | undefined;
  deltaExchangeTradesData: any[];
  previousCompleteOrdersLengthRef: React.MutableRefObject<number>;
  previousBrokerOrdersLengthRef: React.MutableRefObject<number>;
  previousSecondaryCompleteOrdersLengthRef: React.MutableRefObject<number>;
  activeTab: string;
  mobileBottomTab: string;
  toast: (opts: { title: string; description?: string; variant?: string; duration?: number }) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePaperTrading(params: UsePaperTradingParams) {
  const {
    zerodhaAccessToken, upstoxAccessToken, userAngelOneToken, dhanAccessToken,
    growwAccessToken, fyersIsConnected, activeBroker,
    setBrokerFunds, setAllBrokerFunds,
    authInitialized, isViewOnlyMode,
    isDemoMode, setIsDemoMode,
    tradingDataByDate, personalTradingDataByDate, setPersonalTradingDataByDate,
    setTradeHistoryData, setTradeHistoryData2, setTradeHistoryWindow,
    setHeatmapSelectedDate, setSelectedDate, setPersonalHeatmapRevision,
    setShowOrderModal, setShowSecondaryOrderModal,
    brokerOrders, broker2Orders, secondaryBroker, fyersOrders, deltaExchangeTradesData,
    previousCompleteOrdersLengthRef, previousBrokerOrdersLengthRef, previousSecondaryCompleteOrdersLengthRef,
    activeTab, mobileBottomTab,
    toast
  } = params;

  const queryClient = useQueryClient();

  // ── Modal states ────────────────────────────────────────────────────────────
  const [showPaperTradingModal, setShowPaperTradingModal] = useState(false);
  const [showTradingChallengeModal, setShowTradingChallengeModal] = useState(false);
  const [showJournalInfoModal, setShowJournalInfoModal] = useState<boolean | 'auto' | 'manual'>(false);

  // ── Position UI states ──────────────────────────────────────────────────────
  const [hidePositionDetails, setHidePositionDetails] = useState(false);
  const [swipedPositionId, setSwipedPositionId] = useState<string | null>(null);
  const swipeStartXRef = useRef<number>(0);
  const swipeStartYRef = useRef<number>(0);

  // ── Capital & P&L ───────────────────────────────────────────────────────────
  const [paperTradingCapital, setPaperTradingCapital] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("paperTradingCapital");
      return stored ? parseFloat(stored) : 1800000;
    }
    return 1800000;
  });

  const [paperTradingRealizedPnl, setPaperTradingRealizedPnl] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("paperTradingRealizedPnl");
      return stored ? parseFloat(stored) : 0;
    }
    return 0;
  });

  // ── Positions & trade history ────────────────────────────────────────────────
  const [paperPositions, setPaperPositions] = useState<PaperPosition[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("paperPositions");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [paperTradeHistory, setPaperTradeHistory] = useState<PaperTrade[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("paperTradeHistory");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // ── AWS sync state ──────────────────────────────────────────────────────────
  const [paperTradingAwsLoaded, setPaperTradingAwsLoaded] = useState(false);
  const [paperTradingAwsSaving, setPaperTradingAwsSaving] = useState(false);
  const paperTradingSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [paperTradeSymbol, setPaperTradeSymbol] = useState("");
  const [paperTradeSymbolSearch, setPaperTradeSymbolSearch] = useState("");
  const [paperTradeSearchResults, setPaperTradeSearchResults] = useState<any[]>([]);
  const [paperTradeSearchLoading, setPaperTradeSearchLoading] = useState(false);
  const [selectedPaperTradingInstrument, setSelectedPaperTradingInstrument] = useState<any>(null);
  const [paperTradeType, setPaperTradeType] = useState<'STOCK' | 'FUTURES' | 'OPTIONS' | 'MCX'>('STOCK');
  const [paperTradeQuantity, setPaperTradeQuantity] = useState("");
  const [paperTradeLotInput, setPaperTradeLotInput] = useState("");
  const [paperTradeAction, setPaperTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [paperTradeCurrentPrice, setPaperTradeCurrentPrice] = useState<number | null>(null);
  const [paperTradePriceLoading, setPaperTradePriceLoading] = useState(false);

  // ── Stop Loss state ─────────────────────────────────────────────────────────
  const [showPaperTradeSLDropdown, setShowPaperTradeSLDropdown] = useState(false);
  const [showMobilePaperTradeSLDropdown, setShowMobilePaperTradeSLDropdown] = useState(false);
  const [paperTradeSLPrice, setPaperTradeSLPrice] = useState("");
  const [paperTradeSLType, setPaperTradeSLType] = useState<'price' | 'percent' | 'duration' | 'high' | 'low'>('price');
  const [paperTradeSLValue, setPaperTradeSLValue] = useState("");
  const [paperTradeSLTimeframe, setPaperTradeSLTimeframe] = useState("5m");
  const [paperTradeSLDurationUnit, setPaperTradeSLDurationUnit] = useState("min");
  const [paperTradeSLEnabled, setPaperTradeSLEnabled] = useState(false);
  const paperTradingStreamSymbolsRef = useRef<Set<string>>(new Set());

  // ── Live WebSocket state ────────────────────────────────────────────────────
  const [paperTradingWsStatus, setPaperTradingWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [paperTradingLivePrices, setPaperTradingLivePrices] = useState<Map<string, number>>(new Map());
  const paperTradingEventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  const paperTradingLastUpdateRef = useRef<number>(Date.now());

  // ── Broker Funds Global Fetch ────────────────────────────────────────────────
  useEffect(() => {
    if (zerodhaAccessToken || upstoxAccessToken || userAngelOneToken || dhanAccessToken || growwAccessToken || fyersIsConnected) {
      const fetchBrokerFundsGlobal = async () => {
        try {
          let endpoint = '';
          let token = '';
          let broker = '';

          if (activeBroker === 'zerodha' && zerodhaAccessToken) {
            endpoint = '/api/zerodha/margins';
            token = zerodhaAccessToken;
            broker = 'Zerodha';
            const apiKey = localStorage.getItem("zerodha_api_key");
            if (apiKey) endpoint += `?api_key=${encodeURIComponent(apiKey)}`;
          } else if (activeBroker === 'upstox' && upstoxAccessToken) {
            endpoint = '/api/broker/upstox/margins';
            token = upstoxAccessToken;
            broker = 'Upstox';
          } else if (activeBroker === 'angelone' && userAngelOneToken) {
            endpoint = '/api/broker/angelone/margins';
            token = userAngelOneToken;
            broker = 'Angel One';
          } else if (activeBroker === 'dhan' && dhanAccessToken) {
            endpoint = '/api/broker/dhan/margins';
            token = dhanAccessToken;
            broker = 'Dhan';
          } else if (activeBroker === 'groww' && growwAccessToken) {
            endpoint = `/api/broker/groww/funds?accessToken=${growwAccessToken}`;
            token = growwAccessToken;
            broker = 'Groww';
          } else if (activeBroker === 'fyers' && fyersIsConnected) {
            endpoint = '/api/broker/fyers/margins';
            token = 'fyers_connected';
            broker = 'Fyers';
          }

          if (!endpoint) return;

          const response = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          const funds = data.availableCash || data.availableFunds || data.funds || 0;
          setBrokerFunds(funds);

          if (activeBroker) {
            setAllBrokerFunds(prev => ({
              ...prev,
              [activeBroker]: funds
            }));
          }

          if (activeBroker === 'groww') {
            queryClient.setQueryData(["/api/broker/groww/funds"], { funds });
          }

          console.log('✅ [GLOBAL-FUNDS]', broker, 'Fetched available funds:', funds);
        } catch (error) {
          console.error('❌ [GLOBAL-FUNDS] Error fetching broker funds:', error);
        }
      };

      fetchBrokerFundsGlobal();
      const pollInterval = setInterval(fetchBrokerFundsGlobal, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [activeBroker, zerodhaAccessToken, upstoxAccessToken, userAngelOneToken, dhanAccessToken, growwAccessToken, fyersIsConnected]);

  // ── Sync live prices → positions ─────────────────────────────────────────────
  useEffect(() => {
    if (paperTradingLivePrices.size === 0 || paperPositions.length === 0) return;

    const updatedPositions = paperPositions.map(position => {
      const livePrice = paperTradingLivePrices.get(position.symbol);
      if (livePrice && livePrice !== position.currentPrice) {
        const pnl = (livePrice - position.entryPrice) * position.quantity;
        const pnlPercent = ((livePrice - position.entryPrice) / position.entryPrice) * 100;
        return {
          ...position,
          currentPrice: livePrice,
          pnl: position.action === "BUY" ? pnl : -pnl,
          pnlPercent: position.action === "BUY" ? pnlPercent : -pnlPercent
        };
      }
      return position;
    });

    if (JSON.stringify(updatedPositions) !== JSON.stringify(paperPositions)) {
      setPaperPositions(updatedPositions);
    }
  }, [paperTradingLivePrices]);

  // ── AWS load on auth init ───────────────────────────────────────────────────
  const loadPaperTradingFromAWS = useCallback(async () => {
    const userId = localStorage.getItem('currentUserId');
    if (!userId || userId === 'null') return;

    try {
      const idToken = await getCognitoToken();
      if (!idToken) {
        console.log('⚠️ No Cognito token for paper trading AWS load');
        return;
      }

      console.log('📊 Loading paper trading data from AWS for user:', userId);
      const response = await fetch(`/api/paper-trading/${userId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log('✅ Loaded paper trading data from AWS:', result.isNew ? '(new user, defaults)' : '');
          setPaperTradingCapital(result.data.capital || 1800000);
          setPaperPositions(result.data.positions || []);
          setPaperTradeHistory(result.data.tradeHistory || []);
          setPaperTradingRealizedPnl(result.data.realizedPnl || 0);
          localStorage.setItem("paperTradingCapital", String(result.data.capital || 1800000));
          localStorage.setItem("paperPositions", JSON.stringify(result.data.positions || []));
          localStorage.setItem("paperTradeHistory", JSON.stringify(result.data.tradeHistory || []));
          localStorage.setItem("paperTradingRealizedPnl", String(result.data.realizedPnl || 0));
        }
        setPaperTradingAwsLoaded(true);
      } else {
        console.warn('⚠️ Failed to load paper trading data from AWS:', response.status);
        setPaperTradingAwsLoaded(true);
      }
    } catch (error) {
      console.error('❌ Error loading paper trading from AWS:', error);
      setPaperTradingAwsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    if (userId && userId !== 'null' && authInitialized && !isViewOnlyMode && !paperTradingAwsLoaded) {
      loadPaperTradingFromAWS();
    }
  }, [authInitialized, isViewOnlyMode, paperTradingAwsLoaded, loadPaperTradingFromAWS]);

  // ── AWS save (debounced) ────────────────────────────────────────────────────
  const savePaperTradingToAWS = useCallback(async (
    capital: number,
    positions: PaperPosition[],
    tradeHistory: PaperTrade[],
    realizedPnl: number
  ) => {
    const userId = localStorage.getItem('currentUserId');
    if (!userId || userId === 'null') return;

    try {
      const idToken = await getCognitoToken();
      if (!idToken) {
        console.log('⚠️ No Cognito token for paper trading AWS save');
        return;
      }

      setPaperTradingAwsSaving(true);
      const totalPnl = positions.reduce((total, p) => total + (p.pnl || 0), 0);

      const response = await fetch(`/api/paper-trading/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ capital, positions, tradeHistory, totalPnl, realizedPnl })
      });

      if (response.ok) {
        console.log('✅ Paper trading data saved to AWS');
      } else {
        console.warn('⚠️ Failed to save paper trading data to AWS:', response.status);
      }
    } catch (error) {
      console.error('❌ Error saving paper trading to AWS:', error);
    } finally {
      setPaperTradingAwsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!paperTradingAwsLoaded) return;
    const userId = localStorage.getItem('currentUserId');
    if (!userId || userId === 'null') return;

    if (paperTradingSaveTimeoutRef.current) {
      clearTimeout(paperTradingSaveTimeoutRef.current);
    }

    paperTradingSaveTimeoutRef.current = setTimeout(() => {
      savePaperTradingToAWS(paperTradingCapital, paperPositions, paperTradeHistory, paperTradingRealizedPnl);
    }, 2000);

    return () => {
      if (paperTradingSaveTimeoutRef.current) {
        clearTimeout(paperTradingSaveTimeoutRef.current);
      }
    };
  }, [paperTradingCapital, paperPositions, paperTradeHistory, paperTradingRealizedPnl, paperTradingAwsLoaded, savePaperTradingToAWS]);

  // ── Persist positions to localStorage ──────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("paperPositions", JSON.stringify(paperPositions));
  }, [paperPositions]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getExchangeForTradeType = (type: 'STOCK' | 'FUTURES' | 'OPTIONS' | 'MCX'): string => {
    switch (type) {
      case 'STOCK': return 'NSE,BSE';
      case 'FUTURES': return 'NFO,BFO';
      case 'OPTIONS': return 'NFO,BFO';
      case 'MCX': return 'MCX,NCDEX';
      default: return 'NSE,BSE';
    }
  };

  const getLotSizeForInstrument = (symbol: string, type: 'STOCK' | 'FUTURES' | 'OPTIONS' | 'MCX'): number => {
    const futuresLotSizes: { [key: string]: number } = {
      'NIFTY': 75, 'BANKNIFTY': 35, 'FINNIFTY': 65, 'MIDCPNIFTY': 40,
      'SENSEX': 20, 'BANKEX': 15, 'NIFTYIT': 50, 'NIFTYPHARMA': 50,
      'NIFTYINFRA': 50, 'NIFTYAUTO': 50, 'NIFTYBANK': 50,
    };
    const mcxLotSizes: { [key: string]: number } = {
      'GOLD': 100, 'SILVER': 30, 'CRUDEOIL': 100, 'NATURALGAS': 250,
      'COPPER': 1, 'LEAD': 1, 'NICKEL': 1, 'ZINC': 1, 'ALUMMINI': 1,
      'COTTON': 1, 'MENTHAOIL': 1,
    };
    const baseSymbol = symbol.replace(/\d.*$/i, '').toUpperCase();
    switch (type) {
      case 'FUTURES': return futuresLotSizes[baseSymbol] || 1;
      case 'OPTIONS': return futuresLotSizes[baseSymbol] || 1;
      case 'MCX': return mcxLotSizes[baseSymbol] || 1;
      case 'STOCK':
      default: return 1;
    }
  };

  const getSearchPlaceholder = (): string => {
    switch (paperTradeType) {
      case 'STOCK': return 'Search RELIANCE, TCS, INFY...';
      case 'FUTURES': return 'Search NIFTY, BANKNIFTY futures...';
      case 'OPTIONS': return 'Search NIFTY, BANKNIFTY options...';
      case 'MCX': return 'Search GOLD, SILVER, CRUDEOIL...';
      default: return 'Search instruments...';
    }
  };

  const sortInstruments = (instruments: any[]): any[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const categories: any = { index: [], futuresNear: [], futuresNext: [], futuresFar: [], options: [], others: [] };

    instruments.forEach((inst) => {
      const instrumentType = inst.instrumentType || '';
      if (instrumentType === 'FUTIDX' || instrumentType === 'OPTIDX' ||
          inst.symbol?.match(/^(NIFTY50|NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)$/i)) {
        if (instrumentType === 'OPTIDX') categories.options.push(inst);
        else categories.index.push(inst);
      } else if (instrumentType === 'FUTSTK' || instrumentType === 'FUTIDX' || instrumentType === 'FUTCOM') {
        if (inst.expiry) {
          const expiryDate = new Date(inst.expiry);
          expiryDate.setHours(0, 0, 0, 0);
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 7) categories.futuresNear.push(inst);
          else if (daysUntilExpiry <= 37) categories.futuresNext.push(inst);
          else categories.futuresFar.push(inst);
        } else {
          categories.futuresNear.push(inst);
        }
      } else if (instrumentType === 'OPTSTK' || instrumentType === 'OPTFUT' || instrumentType === 'OPTIDX') {
        categories.options.push(inst);
      } else {
        categories.others.push(inst);
      }
    });

    return [
      ...categories.index, ...categories.futuresNear, ...categories.futuresNext,
      ...categories.futuresFar, ...categories.options, ...categories.others
    ];
  };

  const searchPaperTradingInstruments = async (query: string) => {
    if (!query || query.length < 1) {
      setPaperTradeSearchResults([]);
      return;
    }
    setPaperTradeSearchLoading(true);
    try {
      const exchange = getExchangeForTradeType(paperTradeType);
      console.log(`🔍 [PAPER-TRADE] Searching for "${query}" on exchange: ${exchange} (type: ${paperTradeType})`);
      const url = `/api/angelone/search-instruments?query=${encodeURIComponent(query)}&exchange=${encodeURIComponent(exchange)}&limit=50`;
      console.log(`🔍 [PAPER-TRADE] API URL: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 [PAPER-TRADE] API Response:`, data);
        const instruments = data.instruments || data.results || [];
        console.log(`🔍 [PAPER-TRADE] Found ${instruments.length} instruments`);
        const formatted = instruments.map((inst: any) => ({
          symbol: inst.symbol || inst.tradingSymbol || "",
          name: inst.name || inst.symbol || "",
          token: inst.token || inst.symbolToken || "",
          exchange: inst.exchange || "",
          instrumentType: inst.instrumentType || "",
          type: inst.type || paperTradeType,
          lotSize: inst.lotSize || 1,
          expiry: inst.expiry || null,
        }));
        const sorted = sortInstruments(formatted);
        console.log(`🔍 [PAPER-TRADE] Formatted and sorted ${sorted.length} results:`, sorted.slice(0, 3));
        sorted.forEach((inst, idx) => {
          if (idx < 3) {
            console.log(`  [${idx}] ${inst.symbol} | Token: ${inst.token} | Exchange: ${inst.exchange} | Type: ${inst.instrumentType}`);
          }
        });
        setPaperTradeSearchResults(sorted);
      } else {
        console.error(`🔍 [PAPER-TRADE] API error: ${response.status}`);
        setPaperTradeSearchResults([]);
      }
    } catch (error) {
      console.error("Paper trading search error:", error);
      setPaperTradeSearchResults([]);
    } finally {
      setPaperTradeSearchLoading(false);
    }
  };

  const fetchPaperTradePrice = async (stockInfoOverride?: any) => {
    const stockInfo = stockInfoOverride || selectedPaperTradingInstrument;
    if (!stockInfo) {
      console.warn(`⚠️ [PAPER-TRADE-PRICE] No instrument selected`);
      return;
    }

    if (paperTradingEventSourcesRef.current.has(stockInfo.symbol)) {
      const prevStream = paperTradingEventSourcesRef.current.get(stockInfo.symbol);
      if (prevStream) prevStream.close();
      paperTradingEventSourcesRef.current.delete(stockInfo.symbol);
    }

    console.log(`🔍 [PAPER-TRADE-PRICE] Selected instrument:`, {
      symbol: stockInfo.symbol, token: stockInfo.token,
      exchange: stockInfo.exchange, instrumentType: stockInfo.instrumentType, type: stockInfo.type
    });

    if (!stockInfo.symbol || !stockInfo.exchange) {
      console.error(`❌ [PAPER-TRADE-PRICE] Missing required fields:`, {
        symbol: stockInfo.symbol, token: stockInfo.token, exchange: stockInfo.exchange
      });
      setPaperTradePriceLoading(false);
      return;
    }

    setPaperTradePriceLoading(true);
    setPaperTradingWsStatus('connecting');
    try {
      const sseUrl = `/api/angelone/live-stream-ws?symbol=${stockInfo.symbol}&symbolToken=${stockInfo.token}&exchange=${stockInfo.exchange}&tradingSymbol=${stockInfo.symbol}&interval=0`;
      console.log(`📊 [PAPER-TRADE-PRICE] Opening CONTINUOUS live price stream for ${stockInfo.symbol} (NSE, BSE, MCX, NCDEX, NFO, BFO, CDS)`);
      console.log(`  URL: ${sseUrl}`);

      const eventSource = new EventSource(sseUrl);
      paperTradingEventSourcesRef.current.set(stockInfo.symbol, eventSource);

      let priceReceived = false;
      const timeout = setTimeout(() => {
        if (!priceReceived) {
          console.warn(`⚠️ [PAPER-TRADE-PRICE] No price received for ${stockInfo.symbol} after 5s`);
          setPaperTradePriceLoading(false);
        }
      }, 5000);

      eventSource.onopen = () => {
        console.log(`✅ [PAPER-TRADE-PRICE] WebSocket STREAMING for ${stockInfo.symbol} @ 700ms`);
        setPaperTradingWsStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const ltp = data.ltp || data.close;
          if (ltp && ltp > 0) {
            if (!priceReceived) {
              console.log(`✅ [PAPER-TRADE-PRICE] Got initial price for ${stockInfo.symbol}: ₹${ltp}`);
              clearTimeout(timeout);
              setPaperTradePriceLoading(false);
              priceReceived = true;
            }
            setPaperTradeCurrentPrice(ltp);
            setPaperTradingLivePrices(prev => new Map(prev).set(stockInfo.symbol, ltp));
          }
        } catch (err) {
          console.error(`[PAPER-TRADE-PRICE] Parse error for ${stockInfo.symbol}:`, err);
        }
      };

      eventSource.onerror = (event) => {
        console.error(`❌ [PAPER-TRADE-PRICE] Connection error for ${stockInfo.symbol}:`, event);
        clearTimeout(timeout);
        eventSource.close();
        paperTradingEventSourcesRef.current.delete(stockInfo.symbol);
        setPaperTradingWsStatus('disconnected');
        if (!priceReceived) setPaperTradePriceLoading(false);
      };
    } catch (error) {
      console.error("❌ [PAPER-TRADE-PRICE] Exception:", error);
      setPaperTradePriceLoading(false);
      setPaperTradingWsStatus('disconnected');
    }
  };

  // ── Execute trade ────────────────────────────────────────────────────────────
  const executePaperTrade = () => {
    const inputValue = paperTradeType === 'STOCK' ? paperTradeQuantity : paperTradeLotInput;
    if (!paperTradeSymbol || !inputValue || !paperTradeCurrentPrice) {
      toast({
        title: "Invalid Trade",
        description: `Please select a symbol and enter ${paperTradeType === 'STOCK' ? 'quantity' : 'lots'}`,
        variant: "destructive"
      });
      return;
    }

    let quantity = parseInt(inputValue);
    if (paperTradeType !== 'STOCK') {
      const lotSize = getLotSizeForInstrument(paperTradeSymbol, paperTradeType);
      quantity = quantity * lotSize;
    }
    const tradeValue = quantity * paperTradeCurrentPrice;

    if (paperTradeAction === 'BUY') {
      if (tradeValue > paperTradingCapital) {
        toast({
          title: "Insufficient Capital",
          description: `Need ₹${tradeValue.toLocaleString()} but only ₹${paperTradingCapital.toLocaleString()} available`,
          variant: "destructive"
        });
        return;
      }

      let slTriggerPrice: number | undefined;
      let slExpiryTime: number | undefined;

      if (paperTradeSLEnabled && paperTradeSLType === 'duration') {
        const durationValue = parseInt(paperTradeSLValue);
        if (!isNaN(durationValue)) {
          const multiplier = paperTradeSLDurationUnit === 'hr' ? 60 * 60 * 1000 : 60 * 1000;
          slExpiryTime = Date.now() + (durationValue * multiplier);
        }
      }

      if (paperTradeSLEnabled && paperTradeSLValue) {
        if (paperTradeSLType === 'price') {
          slTriggerPrice = parseFloat(paperTradeSLValue);
        } else if (paperTradeSLType === 'percent') {
          const percentValue = parseFloat(paperTradeSLValue);
          slTriggerPrice = paperTradeCurrentPrice * (1 - percentValue / 100);
        } else if (paperTradeSLType === 'duration') {
          const durationValue = parseFloat(paperTradeSLValue);
          const multiplier = paperTradeSLDurationUnit === 'hr' ? 60 : 1;
          slExpiryTime = Date.now() + (durationValue * multiplier * 60 * 1000);
        }
      }

      const newPosition: PaperPosition = {
        id: `PT-${Date.now()}`,
        symbol: paperTradeSymbol,
        type: paperTradeType as any,
        action: 'BUY',
        quantity: quantity,
        entryPrice: paperTradeCurrentPrice,
        currentPrice: paperTradeCurrentPrice,
        entryTime: new Date().toLocaleTimeString(),
        pnl: 0,
        pnlPercent: 0,
        isOpen: true,
        symbolToken: (selectedPaperTradingInstrument as any)?.token || "0",
        exchange: (selectedPaperTradingInstrument as any)?.exchange || (paperTradeType === 'MCX' ? 'MCX' : paperTradeType === 'FUTURES' || paperTradeType === 'OPTIONS' ? 'NFO' : 'NSE'),
        slEnabled: paperTradeSLEnabled,
        slType: paperTradeSLEnabled ? paperTradeSLType : undefined,
        slValue: paperTradeSLEnabled ? paperTradeSLValue : undefined,
        slTimeframe: paperTradeSLEnabled ? paperTradeSLTimeframe : undefined,
        slDurationUnit: paperTradeSLEnabled ? paperTradeSLDurationUnit : undefined,
        slTriggerPrice: slTriggerPrice,
        slExpiryTime: slExpiryTime
      } as any;

      const updatedPositions = [...paperPositions, newPosition];
      setPaperPositions(updatedPositions);
      localStorage.setItem("paperPositions", JSON.stringify(updatedPositions));

      const instrumentForStreaming = {
        symbol: newPosition.symbol,
        exchange: (newPosition as any).exchange,
        token: (newPosition as any).symbolToken,
        name: newPosition.symbol
      };
      fetchPaperTradePrice(instrumentForStreaming);

      const newCapital = paperTradingCapital - tradeValue;
      setPaperTradingCapital(newCapital);
      localStorage.setItem("paperTradingCapital", String(newCapital));

      const newTrade: PaperTrade = {
        id: newPosition.id,
        symbol: paperTradeSymbol,
        type: 'MIS' as any,
        action: 'BUY',
        quantity: quantity,
        price: paperTradeCurrentPrice,
        time: new Date().toLocaleTimeString()
      };
      const updatedHistory = [...paperTradeHistory, newTrade];
      setPaperTradeHistory(updatedHistory);
      localStorage.setItem("paperTradeHistory", JSON.stringify(updatedHistory));

      let toastDescription = `Bought ${quantity} ${paperTradeSymbol} @ ₹${paperTradeCurrentPrice.toFixed(2)}`;
      if (paperTradeSLEnabled && slTriggerPrice) {
        toastDescription += ` | SL: ₹${slTriggerPrice.toFixed(2)}`;
      } else if (paperTradeSLEnabled && slExpiryTime) {
        toastDescription += ` | SL: ${paperTradeSLValue} ${paperTradeSLDurationUnit}`;
      }

      toast({ title: "Trade Executed", description: toastDescription });

      setPaperTradeSLEnabled(false);
      setPaperTradeSLValue("");
      setShowPaperTradeSLDropdown(false);

    } else {
      const openPosition = paperPositions.find(p => p.symbol === paperTradeSymbol && p.isOpen);

      if (!openPosition) {
        toast({
          title: "No Open Position",
          description: `You don't have an open position in ${paperTradeSymbol} to sell`,
          variant: "destructive"
        });
        return;
      }

      const pnl = (paperTradeCurrentPrice - openPosition.entryPrice) * openPosition.quantity;
      const pnlPercent = ((paperTradeCurrentPrice - openPosition.entryPrice) / openPosition.entryPrice) * 100;

      const updatedPositions = paperPositions.map(p =>
        p.id === openPosition.id
          ? {
              ...p, isOpen: false, currentPrice: paperTradeCurrentPrice, pnl, pnlPercent,
              symbolToken: (p as any).symbolToken, exchange: (p as any).exchange
            }
          : p
      );
      setPaperPositions(updatedPositions);
      localStorage.setItem("paperPositions", JSON.stringify(updatedPositions));

      const saleValue = openPosition.quantity * paperTradeCurrentPrice;
      const newCapital = paperTradingCapital + saleValue;
      setPaperTradingCapital(newCapital);
      localStorage.setItem("paperTradingCapital", String(newCapital));

      const sellTrade: PaperTrade = {
        id: `PT-${Date.now()}`,
        symbol: paperTradeSymbol,
        type: 'MIS' as any,
        action: 'SELL',
        quantity: openPosition.quantity,
        price: paperTradeCurrentPrice,
        time: new Date().toLocaleTimeString(),
        pnl: `₹${pnl.toFixed(2)}`,
        closedAt: new Date().toLocaleTimeString()
      };
      const updatedHistory = [...paperTradeHistory, sellTrade];
      setPaperTradeHistory(updatedHistory);
      localStorage.setItem("paperTradeHistory", JSON.stringify(updatedHistory));

      toast({
        title: pnl >= 0 ? "Profit Booked!" : "Loss Booked",
        description: `Sold ${openPosition.quantity} ${paperTradeSymbol} @ ₹${paperTradeCurrentPrice.toFixed(2)} | P&L: ₹${pnl.toFixed(2)}`
      });
    }

    setPaperTradeSymbol("");
    setPaperTradeQuantity("");
    setPaperTradeLotInput("");
    setPaperTradeCurrentPrice(null);
    setPaperTradeSymbolSearch("");
  };

  // ── Reset account ────────────────────────────────────────────────────────────
  const resetPaperTradingAccount = async () => {
    setPaperTradingCapital(1800000);
    setPaperPositions([]);
    setPaperTradeHistory([]);
    setPaperTradeSymbol("");
    setPaperTradeQuantity("");
    setPaperTradeLotInput("");
    setPaperTradeCurrentPrice(null);
    localStorage.setItem("paperTradingCapital", "1800000");
    localStorage.setItem("paperPositions", "[]");
    localStorage.setItem("paperTradeHistory", "[]");
    setPaperTradingRealizedPnl(0);
    localStorage.setItem("paperTradingRealizedPnl", "0");
    setPaperTradingAwsLoaded(false);
    const userId = localStorage.getItem('currentUserId');
    if (userId && userId !== 'null') {
      try {
        const idToken = await getCognitoToken();
        if (idToken) {
          await fetch(`/api/paper-trading/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          console.log('✅ Paper trading AWS data reset');
        }
      } catch (error) {
        console.error('❌ Error resetting AWS paper trading data:', error);
      }
      setPaperTradingAwsLoaded(true);
    }
    toast({ title: "Account Reset", description: "Paper trading account reset to ₹18,00,000" });
  };

  // ── Record paper trades to journal ──────────────────────────────────────────
  const recordAllPaperTrades = () => {
    if (paperTradeHistory.length === 0) {
      toast({ title: "No Trades", description: "No trade history to record", variant: "destructive" });
      return;
    }

    if (isDemoMode) {
      console.log("🔄 Auto-switching to personal mode to record trades...");
      setIsDemoMode(false);
    }

    console.log("📊 Converting paper trades to journal format...");

    const convertedTrades = paperTradeHistory.map((trade: any) => ({
      time: trade.time,
      order: trade.action,
      symbol: trade.symbol,
      type: trade.type || 'MIS',
      qty: trade.quantity,
      price: trade.price,
      pnl: trade.pnl || '-',
      duration: trade.closedAt ? '0m 0s' : '-'
    }));

    const processedData = _calculateSimplePnL(convertedTrades);
    setTradeHistoryData(processedData);

    const today = new Date();
    const todayKey = _formatDateKey(today);
    const existingData = tradingDataByDate[todayKey] || {};
    const existingTrades = existingData.tradeHistory || [];

    const heatmapTrades = paperTradeHistory.map((trade: any) => ({
      symbol: trade.symbol, type: trade.type || 'MIS', action: trade.action,
      quantity: trade.quantity, price: trade.price, time: trade.time,
      pnl: trade.pnl, closedAt: trade.closedAt
    }));

    const mergedTrades = [...existingTrades, ...heatmapTrades];
    const updatedData = {
      ...existingData,
      tradeHistory: mergedTrades,
      profitLossAmount: mergedTrades.reduce((sum: number, trade: any) => {
        if (trade.pnl && trade.pnl !== '-') {
          const pnlStr = String(trade.pnl).replace('₹', '').replace('+', '');
          return sum + (parseFloat(pnlStr) || 0);
        }
        return sum;
      }, 0),
      totalTrades: mergedTrades.length
    };

    setPersonalTradingDataByDate((prev: any) => ({ ...prev, [todayKey]: updatedData }));
    localStorage.setItem("personalTradingDataByDate", JSON.stringify({
      ...personalTradingDataByDate,
      [todayKey]: updatedData
    }));

    setHeatmapSelectedDate(todayKey);
    setSelectedDate(today);
    setShowPaperTradingModal(false);
    setIsDemoMode(false);

    toast({
      title: "Trades Recorded",
      description: `Recorded ${convertedTrades.length} trades to today's summary and personal tradebook`
    });

    console.log("✅ Paper trades recorded to journal summary and heatmap");
    setPersonalHeatmapRevision(prev => prev + 1);
  };

  // ── Record broker orders ─────────────────────────────────────────────────────
  const recordAllBrokerOrders = () => {
    if (brokerOrders.length === 0) {
      toast({ title: "No Orders", description: "No broker orders to record", variant: "destructive" });
      return;
    }

    const completeOrders = brokerOrders.filter((order: any) =>
      (String(order.status || '').toUpperCase().trim() === 'COMPLETE' ||
       String(order.status || '').toUpperCase().trim() === 'COMPLETED')
    );

    if (completeOrders.length === 0) {
      toast({
        title: "No Complete Orders",
        description: "Only COMPLETE orders are imported. Skipping REJECTED, CANCELLED, and PENDING orders.",
        variant: "destructive"
      });
      return;
    }

    if (isDemoMode) {
      console.log("🔄 Auto-switching to personal mode to record broker orders...");
      setIsDemoMode(false);
    }

    console.log("📊 Converting broker orders to journal format (COMPLETE orders only)...");
    console.log(`✅ Importing ${completeOrders.length} COMPLETE orders (skipped ${brokerOrders.length - completeOrders.length} non-complete orders)`);

    const convertedTrades = completeOrders.map((trade: any) => ({
      time: trade.time, order: trade.order, symbol: trade.symbol,
      type: trade.type || 'MIS', qty: trade.qty, price: trade.price,
      pnl: trade.pnl || '-', duration: trade.duration || '-'
    }));

    const processedData = _calculateSimplePnL(convertedTrades);
    setTradeHistoryData(processedData);

    const today = new Date();
    const todayKey = _formatDateKey(today);
    const existingData = tradingDataByDate[todayKey] || {};
    const existingTrades = existingData.tradeHistory || [];

    const heatmapTrades = completeOrders.map((trade: any) => ({
      symbol: trade.symbol, type: trade.type || 'MIS', action: trade.order,
      quantity: trade.qty, price: trade.price, time: trade.time,
      pnl: trade.pnl, duration: trade.duration
    }));

    const mergedTrades = [...existingTrades, ...heatmapTrades];
    const updatedData = {
      ...existingData,
      tradeHistory: mergedTrades,
      profitLossAmount: mergedTrades.reduce((sum: number, trade: any) => {
        if (trade.pnl && trade.pnl !== '-') {
          const pnlStr = String(trade.pnl).replace('₹', '').replace('+', '');
          return sum + (parseFloat(pnlStr) || 0);
        }
        return sum;
      }, 0),
      totalTrades: mergedTrades.length
    };

    setPersonalTradingDataByDate((prev: any) => ({ ...prev, [todayKey]: updatedData }));
    localStorage.setItem("personalTradingDataByDate", JSON.stringify({
      ...personalTradingDataByDate,
      [todayKey]: updatedData
    }));

    setHeatmapSelectedDate(todayKey);
    setSelectedDate(today);
    setShowOrderModal(false);

    toast({ title: "Orders Recorded", description: `Recorded ${completeOrders.length} orders` });

    console.log("✅ Broker orders recorded to journal summary and heatmap");
    setPersonalHeatmapRevision(prev => prev + 1);
  };

  // ── Auto-tap: primary broker orders ─────────────────────────────────────────
  useEffect(() => {
    const completeOrders = brokerOrders.filter((order: any) =>
      (String(order.status || '').toUpperCase().trim() === 'COMPLETE' ||
       String(order.status || '').toUpperCase().trim() === 'COMPLETED')
    );
    const completeOrdersCount = completeOrders.length;

    if (completeOrdersCount > previousCompleteOrdersLengthRef.current && completeOrdersCount > 0) {
      console.log(`🤖 [AUTO-TAP] Detected ${completeOrdersCount} COMPLETE orders (was ${previousCompleteOrdersLengthRef.current}), auto-recording only success orders...`);
      setTimeout(() => { recordAllBrokerOrders(); }, 500);
    }

    previousCompleteOrdersLengthRef.current = completeOrdersCount;
    previousBrokerOrdersLengthRef.current = brokerOrders.length;
  }, [brokerOrders]);

  // ── Record secondary broker orders ──────────────────────────────────────────
  const recordSecondaryBrokerOrders = (secondaryOrders: any[]) => {
    if (!secondaryOrders || secondaryOrders.length === 0) {
      toast({ title: "No Orders", description: "No secondary broker orders to record", variant: "destructive" });
      return;
    }
    const completeOrders = secondaryOrders.filter((order: any) =>
      String(order.status || '').toUpperCase().trim() === 'COMPLETE' ||
      String(order.status || '').toUpperCase().trim() === 'COMPLETED'
    );
    if (completeOrders.length === 0) {
      toast({ title: "No Complete Orders", description: "Only COMPLETE orders are imported.", variant: "destructive" });
      return;
    }
    const convertedTrades = completeOrders.map((trade: any) => ({
      time: trade.time, order: trade.order, symbol: trade.symbol,
      type: trade.type || 'MIS', qty: trade.qty, price: trade.price,
      pnl: trade.pnl || '-', duration: trade.duration || '-'
    }));
    const processedData = _calculateSimplePnL(convertedTrades);
    setTradeHistoryData2(processedData);
    setTradeHistoryWindow(2);
    setShowSecondaryOrderModal(false);
    toast({ title: "Orders Recorded to Window 2", description: `Recorded ${completeOrders.length} orders` });
    setPersonalHeatmapRevision(prev => prev + 1);
  };

  // ── Auto-tap: secondary broker orders ───────────────────────────────────────
  useEffect(() => {
    const secondaryOrders =
      secondaryBroker === 'fyers' ? (fyersOrders || []) :
      secondaryBroker === 'delta' ? (deltaExchangeTradesData || []) :
      broker2Orders || [];

    if (!secondaryBroker || secondaryOrders.length === 0) return;

    const completeOrders = (secondaryOrders as any[]).filter((order: any) =>
      String(order.status || '').toUpperCase().trim() === 'COMPLETE' ||
      String(order.status || '').toUpperCase().trim() === 'COMPLETED'
    );
    const completeCount = completeOrders.length;

    if (completeCount > previousSecondaryCompleteOrdersLengthRef.current && completeCount > 0) {
      console.log(`🤖 [AUTO-TAP W2] Detected ${completeCount} COMPLETE secondary orders (was ${previousSecondaryCompleteOrdersLengthRef.current}), auto-recording to Window 2...`);
      setTimeout(() => { recordSecondaryBrokerOrders(secondaryOrders as any[]); }, 500);
    }

    previousSecondaryCompleteOrdersLengthRef.current = completeCount;
  }, [fyersOrders, deltaExchangeTradesData, broker2Orders, secondaryBroker]);

  // ── Exit positions ───────────────────────────────────────────────────────────
  const exitAllPaperPositions = () => {
    const openPositions = paperPositions.filter(p => p.isOpen);
    if (openPositions.length === 0) {
      toast({ title: "No Positions", description: "No open positions to exit", variant: "destructive" });
      return;
    }

    let totalPnl = 0;
    let newCapital = paperTradingCapital;
    const newHistoryEntries: PaperTrade[] = [];
    const exitTime = new Date().toLocaleTimeString();

    const updatedPositions = paperPositions.map(p => {
      if (!p.isOpen) return p;
      const pnl = (p.currentPrice - p.entryPrice) * p.quantity;
      const pnlPercent = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100;
      totalPnl += pnl;
      const saleValue = p.quantity * p.currentPrice;
      newCapital += saleValue;

      const sellTrade: PaperTrade = {
        id: `PT-EXIT-${Date.now()}-${p.id}`,
        symbol: p.symbol, type: p.type, action: 'SELL',
        quantity: p.quantity, price: p.currentPrice, time: exitTime,
        pnl: `₹${pnl.toFixed(2)}`, closedAt: exitTime
      };
      newHistoryEntries.push(sellTrade);

      return { ...p, isOpen: false, pnl, pnlPercent };
    });

    setPaperPositions(updatedPositions);
    localStorage.setItem("paperPositions", JSON.stringify(updatedPositions));

    setPaperTradingCapital(newCapital);
    localStorage.setItem("paperTradingCapital", String(newCapital));

    const updatedHistory = [...paperTradeHistory, ...newHistoryEntries];
    setPaperTradeHistory(updatedHistory);
    localStorage.setItem("paperTradeHistory", JSON.stringify(updatedHistory));

    setPaperTradingRealizedPnl(prev => {
      const newRealizedPnl = prev + totalPnl;
      localStorage.setItem("paperTradingRealizedPnl", String(newRealizedPnl));
      return newRealizedPnl;
    });

    toast({
      title: totalPnl >= 0 ? "All Positions Closed - Profit!" : "All Positions Closed - Loss",
      description: `Exited ${openPositions.length} position${openPositions.length > 1 ? 's' : ''} | Total P&L: ${totalPnl >= 0 ? '+' : ''}₹${totalPnl.toFixed(2)}`
    });
  };

  const exitPosition = (positionId: string) => {
    const position = paperPositions.find(p => p.id === positionId);
    if (!position) {
      toast({ title: "Position Not Found", description: "Could not find the position to exit", variant: "destructive" });
      return;
    }

    const exitPnL = position.pnl;
    const exitPrice = position.currentPrice;

    const updatedPositions = paperPositions.map(p =>
      p.id === positionId ? { ...p, isOpen: false } : p
    );
    setPaperPositions(updatedPositions);
    localStorage.setItem("paperPositions", JSON.stringify(updatedPositions));

    const newTrade: PaperTrade = {
      id: `exit-${positionId}`,
      symbol: position.symbol,
      type: position.type,
      action: position.action === 'BUY' ? 'SELL' : 'BUY',
      quantity: position.quantity,
      price: exitPrice,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      pnl: `${exitPnL >= 0 ? '+' : ''}₹${exitPnL.toFixed(0)}`,
      closedAt: new Date().toISOString()
    };

    const updatedHistory = [...paperTradeHistory, newTrade];
    setPaperTradeHistory(updatedHistory);
    localStorage.setItem("paperTradeHistory", JSON.stringify(updatedHistory));

    setPaperTradingRealizedPnl(prev => {
      const newRealizedPnl = prev + exitPnL;
      localStorage.setItem("paperTradingRealizedPnl", String(newRealizedPnl));
      return newRealizedPnl;
    });

    setSwipedPositionId(null);

    toast({
      title: "Position Exited",
      description: `${position.symbol} exited at ₹${exitPrice.toFixed(2)} | P&L: ₹${exitPnL.toFixed(0)}`,
      duration: 2000
    });
  };

  // ── Live WebSocket Streaming ─────────────────────────────────────────────────
  useEffect(() => {
    const openPositions = paperPositions.filter(p => p.isOpen);
    const openSymbols = new Set(openPositions.map(p => p.symbol));

    const isMobilePaperTradeTabActive = activeTab === 'journal' && mobileBottomTab === 'paper-trade';
    const isPaperTradingActive = showPaperTradingModal || isMobilePaperTradeTabActive;

    if (!isPaperTradingActive || openPositions.length === 0) {
      paperTradingEventSourcesRef.current.forEach((es) => { es.close(); });
      paperTradingEventSourcesRef.current.clear();
      setPaperTradingWsStatus('disconnected');
      return;
    }

    paperTradingEventSourcesRef.current.forEach((es, symbol) => {
      if (!openSymbols.has(symbol)) {
        console.log(`🔌 [PAPER-TRADING] Closing stale connection: ${symbol}`);
        es.close();
        paperTradingEventSourcesRef.current.delete(symbol);
      }
    });

    setPaperTradingWsStatus('connecting');
    console.log(`📊 [PAPER-TRADING] Starting live stream for ${openPositions.length} positions`);

    openPositions.forEach(position => {
      if (paperTradingEventSourcesRef.current.has(position.symbol)) return;

      const symbolToken = (position as any).symbolToken || "0";
      const exchange = (position as any).exchange || "NSE";

      const sseUrl = `/api/angelone/live-stream-ws?symbol=${position.symbol}&symbolToken=${symbolToken}&exchange=${exchange}&tradingSymbol=${position.symbol}&interval=0`;

      console.log(`📡 [PAPER-TRADING] Subscribing to ${position.symbol} live stream`);

      const eventSource = new EventSource(sseUrl);
      paperTradingEventSourcesRef.current.set(position.symbol, eventSource);

      eventSource.onopen = () => {
        console.log(`✅ [PAPER-TRADING] Connected: ${position.symbol}`);
        setPaperTradingWsStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const ltp = data.ltp || data.close;
          if (ltp && ltp > 0) {
            paperTradingLastUpdateRef.current = Date.now();

            setPaperTradingLivePrices(prev => {
              const newMap = new Map(prev);
              newMap.set(position.symbol, ltp);
              return newMap;
            });

            setPaperPositions(prevPositions => {
              return prevPositions.map(p => {
                if (p.symbol === position.symbol && p.isOpen) {
                  const priceDiff = p.action === 'BUY'
                    ? (ltp - p.entryPrice)
                    : (p.entryPrice - ltp);
                  const pnl = priceDiff * p.quantity;
                  const pnlPercent = (priceDiff / p.entryPrice) * 100;
                  return { ...p, currentPrice: ltp, pnl, pnlPercent };
                }
                return p;
              });
            });
          }
        } catch (err) {
          console.error(`[PAPER-TRADING] Parse error for ${position.symbol}:`, err);
        }
      };

      eventSource.onerror = () => {
        console.warn(`⚠️ [PAPER-TRADING] Connection error: ${position.symbol}`);
        setTimeout(() => {
          if (paperTradingEventSourcesRef.current.has(position.symbol)) {
            const es = paperTradingEventSourcesRef.current.get(position.symbol);
            if (es) es.close();
            paperTradingEventSourcesRef.current.delete(position.symbol);
          }
        }, 5000);
      };
    });

    return () => {
      console.log(`🔌 [PAPER-TRADING] Cleaning up live stream connections`);
      paperTradingEventSourcesRef.current.forEach((es) => { es.close(); });
      paperTradingEventSourcesRef.current.clear();
    };
  }, [showPaperTradingModal, activeTab, mobileBottomTab, paperPositions.filter(p => p.isOpen).map(p => `${p.symbol}:${p.action}`).join(',')]);

  // ── Total P&L (memo) ─────────────────────────────────────────────────────────
  const paperTradingTotalPnl = useMemo(() => {
    const unrealizedPnl = paperPositions.filter(p => p.isOpen).reduce((total, p) => total + (p.pnl || 0), 0);
    return paperTradingRealizedPnl + unrealizedPnl;
  }, [paperPositions, paperTradingRealizedPnl]);

  // ── SL Monitoring ────────────────────────────────────────────────────────────
  useEffect(() => {
    const openPositions = paperPositions.filter(p => p.isOpen);
    if (openPositions.length === 0) return;

    openPositions.forEach(position => {
      const pos = position as any;
      if (!pos.slEnabled) return;

      let slTriggered = false;
      let slReason = '';

      if (pos.slTriggerPrice && pos.currentPrice > 0) {
        if (pos.action === 'BUY') {
          if (pos.currentPrice <= pos.slTriggerPrice) {
            slTriggered = true;
            slReason = `Price SL hit at ₹${pos.currentPrice.toFixed(2)} (SL: ₹${pos.slTriggerPrice.toFixed(2)})`;
          }
        } else {
          if (pos.currentPrice >= pos.slTriggerPrice) {
            slTriggered = true;
            slReason = `Price SL hit at ₹${pos.currentPrice.toFixed(2)} (SL: ₹${pos.slTriggerPrice.toFixed(2)})`;
          }
        }
      }

      if (pos.slExpiryTime && Date.now() >= pos.slExpiryTime) {
        slTriggered = true;
        slReason = `Time SL expired (${pos.slValue} ${pos.slDurationUnit})`;
      }

      if (slTriggered) {
        console.log(`🛑 [SL-TRIGGER] Auto-exiting ${pos.symbol}: ${slReason}`);

        const priceDiff = pos.action === 'BUY'
          ? (pos.currentPrice - pos.entryPrice)
          : (pos.entryPrice - pos.currentPrice);
        const finalPnl = priceDiff * pos.quantity;
        const finalPnlPercent = (priceDiff / pos.entryPrice) * 100;

        setPaperPositions(prevPositions => {
          const updated = prevPositions.map(p =>
            p.id === pos.id
              ? { ...p, isOpen: false, pnl: finalPnl, pnlPercent: finalPnlPercent }
              : p
          );
          localStorage.setItem("paperPositions", JSON.stringify(updated));
          return updated;
        });

        const saleValue = pos.quantity * pos.currentPrice;
        setPaperTradingCapital(prev => {
          const newCapital = prev + saleValue;
          localStorage.setItem("paperTradingCapital", String(newCapital));
          return newCapital;
        });

        const exitTrade = {
          id: `PT-${Date.now()}`,
          symbol: pos.symbol,
          type: 'MIS',
          action: 'SELL' as const,
          quantity: pos.quantity,
          price: pos.currentPrice,
          time: new Date().toLocaleTimeString(),
          pnl: `${finalPnl >= 0 ? '+' : ''}₹${finalPnl.toFixed(2)}`
        };
        setPaperTradeHistory(prev => {
          const updated = [...prev, exitTrade];
          localStorage.setItem("paperTradeHistory", JSON.stringify(updated));
          return updated;
        });

        toast({
          title: "Stop Loss Triggered",
          description: `${pos.symbol}: ${slReason} | P&L: ${finalPnl >= 0 ? '+' : ''}₹${finalPnl.toFixed(2)}`,
          variant: finalPnl >= 0 ? "default" : "destructive"
        });
      }
    });
  }, [paperPositions.map(p => `${p.id}:${p.currentPrice}:${p.isOpen}`).join(',')]);

  // ─── Return ────────────────────────────────────────────────────────────────
  return {
    // Modal states
    showPaperTradingModal, setShowPaperTradingModal,
    showTradingChallengeModal, setShowTradingChallengeModal,
    showJournalInfoModal, setShowJournalInfoModal,
    // Position UI
    hidePositionDetails, setHidePositionDetails,
    swipedPositionId, setSwipedPositionId,
    swipeStartXRef, swipeStartYRef,
    // Capital & P&L
    paperTradingCapital, setPaperTradingCapital,
    paperTradingRealizedPnl, setPaperTradingRealizedPnl,
    paperTradingTotalPnl,
    // Positions & history
    paperPositions, setPaperPositions,
    paperTradeHistory, setPaperTradeHistory,
    // AWS sync
    paperTradingAwsLoaded, setPaperTradingAwsLoaded,
    paperTradingAwsSaving,
    // Form
    paperTradeSymbol, setPaperTradeSymbol,
    paperTradeSymbolSearch, setPaperTradeSymbolSearch,
    paperTradeSearchResults, setPaperTradeSearchResults,
    paperTradeSearchLoading,
    selectedPaperTradingInstrument, setSelectedPaperTradingInstrument,
    paperTradeType, setPaperTradeType,
    paperTradeQuantity, setPaperTradeQuantity,
    paperTradeLotInput, setPaperTradeLotInput,
    paperTradeAction, setPaperTradeAction,
    paperTradeCurrentPrice, setPaperTradeCurrentPrice,
    paperTradePriceLoading, setPaperTradePriceLoading,
    // Stop Loss
    showPaperTradeSLDropdown, setShowPaperTradeSLDropdown,
    showMobilePaperTradeSLDropdown, setShowMobilePaperTradeSLDropdown,
    paperTradeSLPrice, setPaperTradeSLPrice,
    paperTradeSLType, setPaperTradeSLType,
    paperTradeSLValue, setPaperTradeSLValue,
    paperTradeSLTimeframe, setPaperTradeSLTimeframe,
    paperTradeSLDurationUnit, setPaperTradeSLDurationUnit,
    paperTradeSLEnabled, setPaperTradeSLEnabled,
    // WebSocket
    paperTradingWsStatus, setPaperTradingWsStatus,
    paperTradingLivePrices,
    paperTradingEventSourcesRef,
    // Refs
    paperTradingStreamSymbolsRef,
    // Functions
    searchPaperTradingInstruments,
    fetchPaperTradePrice,
    executePaperTrade,
    resetPaperTradingAccount,
    recordAllPaperTrades,
    recordAllBrokerOrders,
    recordSecondaryBrokerOrders,
    exitAllPaperPositions,
    exitPosition,
    getSearchPlaceholder,
    getLotSizeForInstrument,
  };
}
