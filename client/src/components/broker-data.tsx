import { DialogContent, Dialog } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, BookOpen, TrendingUp, TrendingDown } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BrokerDataProps {
  showOrderModal: boolean;
  setShowOrderModal: (open: boolean) => void;
  orderTab: string;
  setOrderTab: (tab: string) => void;
  showUserId: boolean;
  setShowUserId: (show: boolean) => void;
  zerodhaClientId: string | null;
  zerodhaUserName: string | null;
  upstoxAccessToken?: string | null;
  upstoxUserId?: string | null;
  upstoxUserName?: string | null;
  dhanAccessToken?: string | null;
  dhanUserId?: string | null;
  dhanClientId?: string | null;
  dhanClientName?: string | null;
  growwAccessToken?: string | null;
  growwUserId?: string | null;
  growwUserName?: string | null;
  brokerOrders: any[];
  fetchingBrokerOrders: boolean;
  zerodhaAccessToken: string | null;
  recordAllBrokerOrders: () => void;
  brokerPositions: any[];
  fetchingBrokerPositions: boolean;
  showBrokerImportModal: boolean;
  setShowBrokerImportModal: (open: boolean) => void;
  handleBrokerImport: (data: any) => void;
  showImportModal: boolean;
  setShowImportModal: (open: boolean) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFormat: any;
  detectedFormatLabel: string;
  isBuildMode: boolean;
  setIsBuildMode: (is: boolean) => void;
  brokerSearchInput: string;
  setBrokerSearchInput: (input: string) => void;
  showBrokerSuggestions: boolean;
  setShowBrokerSuggestions: (show: boolean) => void;
  filteredBrokers: string[];
  buildModeData: any;
  setBuildModeData: (data: any) => void;
  allColumnsFilledForSave: boolean;
  missingColumns: string[];
  saveFormatToUniversalLibrary: (label: string, data: any, broker: string) => Promise<boolean>;
  currentUser: any;
  getCognitoToken: () => Promise<string | null>;
  setSavedFormats: (formats: any) => void;
  importDataTextareaRef: React.RefObject<HTMLTextAreaElement>;
  deltaExchangeIsConnected?: boolean;
  deltaExchangeApiKey?: string | null;
  deltaExchangeApiSecret?: string | null;
  deltaExchangeUserId?: string | null;
  deltaExchangeAccountName?: string | null;
  brokerFunds: number | null;
  fyersStatus?: any;
  angelOneAccessToken?: string | null;
  angelOneClientCode?: string | null;
  angelOneUserName?: string | null;
  secondaryBroker?: string | null;
  secondaryBrokerOrders?: any[];
  secondaryBrokerPositions?: any[];
  secondaryBrokerFunds?: number | null;
  fetchingSecondaryBroker?: boolean;
  showSecondaryOrderModal?: boolean;
  setShowSecondaryOrderModal?: (open: boolean) => void;
  recordSecondaryBrokerOrders?: (orders: any[]) => void;
  isDemoMode?: boolean;
}

export function BrokerData(props: BrokerDataProps) {
  const {
    showOrderModal, setShowOrderModal, orderTab, setOrderTab, showUserId, setShowUserId,
    zerodhaClientId, zerodhaUserName, upstoxAccessToken, upstoxUserId, upstoxUserName,
    dhanAccessToken, dhanUserId, dhanClientId, dhanClientName,
    growwAccessToken, growwUserId, growwUserName,
    deltaExchangeIsConnected, deltaExchangeApiKey, deltaExchangeApiSecret,
    deltaExchangeUserId, deltaExchangeAccountName,
    brokerOrders, fetchingBrokerOrders, zerodhaAccessToken,
    recordAllBrokerOrders, brokerPositions, fetchingBrokerPositions, showBrokerImportModal,
    setShowBrokerImportModal, handleBrokerImport, showImportModal, setShowImportModal,
    handleFileUpload, activeFormat, detectedFormatLabel, isBuildMode, setIsBuildMode,
    brokerSearchInput, setBrokerSearchInput, showBrokerSuggestions, setShowBrokerSuggestions,
    filteredBrokers, buildModeData, setBuildModeData, allColumnsFilledForSave, missingColumns,
    saveFormatToUniversalLibrary, currentUser, getCognitoToken, setSavedFormats, importDataTextareaRef,
    brokerFunds,
    fyersStatus,
    angelOneAccessToken,
    angelOneClientCode,
    angelOneUserName,
    secondaryBroker,
    secondaryBrokerOrders = [],
    secondaryBrokerPositions = [],
    secondaryBrokerFunds,
    fetchingSecondaryBroker,
    showSecondaryOrderModal = false,
    setShowSecondaryOrderModal = () => {},
    recordSecondaryBrokerOrders,
    isDemoMode = false,
  } = props;

  const queryClient = useQueryClient();
  const [secondaryOrderTab, setSecondaryOrderTab] = useState("history");
  const [positionsLastUpdated, setPositionsLastUpdated] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (props.brokerPositions?.length >= 0 && showOrderModal) {
      setPositionsLastUpdated(Date.now());
      setSecondsAgo(0);
    }
  }, [props.brokerPositions, showOrderModal]);

  useEffect(() => {
    if (!positionsLastUpdated) return;
    const t = setInterval(() => setSecondsAgo(Math.floor((Date.now() - positionsLastUpdated) / 1000)), 1000);
    return () => clearInterval(t);
  }, [positionsLastUpdated]);

  const isFyersConnected = fyersStatus?.connected && fyersStatus?.authenticated;
  const isConnected = zerodhaAccessToken || upstoxAccessToken || angelOneAccessToken || dhanAccessToken || growwAccessToken || deltaExchangeIsConnected || isFyersConnected;
  const activeBroker = zerodhaAccessToken ? 'zerodha' : upstoxAccessToken ? 'upstox' : angelOneAccessToken ? 'angelone' : dhanAccessToken ? 'dhan' : growwAccessToken ? 'groww' : deltaExchangeIsConnected ? 'delta' : isFyersConnected ? 'fyers' : null;

  useEffect(() => {
    if (activeBroker !== 'dhan' || !showOrderModal) return;
    const refreshDhanProfile = async () => {
      try {
        await apiRequest("GET", `/api/broker/dhan/profile?accessToken=${encodeURIComponent(dhanAccessToken || '')}&dhanClientId=${encodeURIComponent(dhanClientId || dhanUserId || '')}`, null);
        queryClient.invalidateQueries({ queryKey: ["/api/broker/dhan/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/broker/dhan/profile"] });
      } catch (error) { console.error("Error refreshing Dhan profile:", error); }
    };
    refreshDhanProfile();
    const interval = setInterval(refreshDhanProfile, 10000);
    return () => clearInterval(interval);
  }, [activeBroker, dhanAccessToken, dhanClientId, dhanUserId, showOrderModal, queryClient]);

  useEffect(() => {
    if (!deltaExchangeIsConnected || !showOrderModal) return;
    const refreshProfile = async () => {
      try {
        await apiRequest("GET", `/api/broker/delta/profile?apiKey=${encodeURIComponent(deltaExchangeApiKey || '')}&apiSecret=${encodeURIComponent(deltaExchangeApiSecret || '')}`, null);
        queryClient.invalidateQueries({ queryKey: ["/api/broker/delta/profile"] });
      } catch (error) { console.error("Error refreshing Delta profile:", error); }
    };
    refreshProfile();
    const interval = setInterval(refreshProfile, 60000);
    return () => clearInterval(interval);
  }, [deltaExchangeIsConnected, showOrderModal, queryClient]);

  const [growwOrders, setGrowwOrders] = useState<any[]>([]);
  const [fetchingGrowwOrders, setFetchingGrowwOrders] = useState(false);
  const growwInitialLoadDone = useRef(false);
  const [growwPositions, setGrowwPositions] = useState<any[]>([]);
  const [growwFundsValue, setGrowwFundsValue] = useState<number | null>(null);
  const [growwLivePrices, setGrowwLivePrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (activeBroker !== 'groww' || !growwAccessToken) return;
    let cancelled = false;
    const prefetch = async () => {
      try {
        const [ordersRes, posRes] = await Promise.all([
          apiRequest("GET", `/api/broker/groww/orders?accessToken=${encodeURIComponent(growwAccessToken)}`, null),
          apiRequest("GET", `/api/broker/groww/positions?accessToken=${encodeURIComponent(growwAccessToken)}`, null),
        ]);
        if (cancelled) return;
        if (ordersRes.success && ordersRes.orders) { setGrowwOrders(ordersRes.orders); growwInitialLoadDone.current = true; }
        if (posRes.success && posRes.positions) setGrowwPositions(posRes.positions);
      } catch (e) {}
    };
    prefetch();
    return () => { cancelled = true; };
  }, [activeBroker, growwAccessToken]);

  useEffect(() => {
    if (activeBroker !== 'groww' || !showOrderModal) return;
    const refreshGrowwOrders = async () => {
      const needsLoader = !growwInitialLoadDone.current;
      if (needsLoader) setFetchingGrowwOrders(true);
      try {
        const response = await apiRequest("GET", `/api/broker/groww/orders?accessToken=${encodeURIComponent(growwAccessToken || '')}`, null);
        if (response.success && response.orders) setGrowwOrders(response.orders);
      } catch (error) { console.error("Error refreshing Groww orders:", error); }
      finally { if (needsLoader) { setFetchingGrowwOrders(false); growwInitialLoadDone.current = true; } }
    };
    const refreshGrowwPositions = async () => {
      try {
        const response = await apiRequest("GET", `/api/broker/groww/positions?accessToken=${encodeURIComponent(growwAccessToken || '')}`, null);
        if (response.success && response.positions) setGrowwPositions(response.positions);
      } catch (error) { console.error("Error refreshing Groww positions:", error); }
    };
    const refreshGrowwFunds = async () => {
      try {
        const response = await apiRequest("GET", `/api/broker/groww/funds?accessToken=${encodeURIComponent(growwAccessToken || '')}`, null);
        if (response.success && response.fundsAvailable) setGrowwFundsValue(Number(response.funds));
      } catch (error) { console.error("Error refreshing Groww funds:", error); }
    };
    refreshGrowwOrders(); refreshGrowwPositions(); refreshGrowwFunds();
    const ordersInterval = setInterval(() => { refreshGrowwOrders(); refreshGrowwPositions(); }, 10000);
    const fundsInterval = setInterval(refreshGrowwFunds, 10000);
    return () => { clearInterval(ordersInterval); clearInterval(fundsInterval); setGrowwFundsValue(null); };
  }, [activeBroker, growwAccessToken, showOrderModal, queryClient]);

  useEffect(() => {
    const isGrowwPrimary = activeBroker === 'groww' && showOrderModal;
    const isGrowwSecondary = secondaryBroker === 'groww' && showSecondaryOrderModal;
    if (!isGrowwPrimary && !isGrowwSecondary) return;
    if (!growwAccessToken) return;
    const positionsToUse = isGrowwPrimary ? growwPositions : (secondaryBrokerPositions || []);
    if (positionsToUse.length === 0) return;
    const fetchLTP = async () => {
      try {
        const symbolsToFetch = positionsToUse.filter(p => p.symbol && (p.status || 'OPEN').toUpperCase() === 'OPEN');
        if (!symbolsToFetch.length) return;
        const qs = new URLSearchParams({ accessToken: growwAccessToken, segment: 'CASH' });
        for (const p of symbolsToFetch) qs.append('exchange_symbols', `${p.exchange || 'NSE'}_${p.symbol}`);
        const response = await apiRequest("GET", `/api/broker/groww/ltp?${qs.toString()}`, null);
        if (response.success && response.prices) setGrowwLivePrices(response.prices as Record<string, number>);
      } catch {}
    };
    fetchLTP();
    const ltpInterval = setInterval(fetchLTP, 600);
    return () => clearInterval(ltpInterval);
  }, [activeBroker, secondaryBroker, growwAccessToken, showOrderModal, showSecondaryOrderModal, growwPositions, secondaryBrokerPositions]);

  const displayOrders = activeBroker === 'groww' ? growwOrders : brokerOrders;
  const displayPositions = activeBroker === 'groww' ? growwPositions : brokerPositions;
  const isFetchingOrders = activeBroker === 'groww' ? fetchingGrowwOrders : fetchingBrokerOrders;

  const formatSymbol = (symbol: string) => {
    if (!symbol) return "";
    const regex = /^([A-Z]+)(\d{2})([1-9]|O|N|D)(\d{2})(\d+)([PC]E)$/;
    const match = symbol.match(regex);
    if (match) {
      const [_, name, year, month, day, strike, type] = match;
      const months: Record<string, string> = {
        "1": "JAN", "2": "FEB", "3": "MAR", "4": "APR", "5": "MAY", "6": "JUN",
        "7": "JUL", "8": "AUG", "9": "SEP", "O": "OCT", "N": "NOV", "D": "DEC"
      };
      const getOrdinal = (d: string) => {
        const n = parseInt(d);
        if (n > 3 && n < 21) return 'th';
        switch (n % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; }
      };
      return `${name} ${parseInt(day)}${getOrdinal(day)} ${months[month] || month} ${strike} ${type}`;
    }
    return symbol;
  };

  const formatTime = (raw: any): string => {
    if (!raw) return "";
    try {
      const s = String(raw).trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?(\s*(AM|PM))?$/i.test(s)) return s;
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      if (s.includes(' ')) {
        const t = s.split(' ')[1];
        const d2 = new Date(`2000-01-01T${t}`);
        if (!isNaN(d2.getTime())) return d2.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return t;
      }
    } catch {}
    return String(raw);
  };

  const brokerFundsValue = activeBroker === 'groww'
    ? (growwFundsValue !== null ? growwFundsValue : (brokerFunds ?? 0))
    : brokerFunds;

  const allBrokerInfo: Record<string, { logo: string; id: string; name: string; rounded?: boolean }> = {
    zerodha:  { logo: "https://zerodha.com/static/images/products/kite-logo.svg", id: zerodhaClientId || "N/A", name: zerodhaUserName || "N/A" },
    upstox:   { logo: "https://assets.upstox.com/content/assets/images/cms/202494/MediumWordmark_UP(WhiteOnPurple).png", id: upstoxUserId || "N/A", name: upstoxUserName && upstoxUserName !== "undefined" && upstoxUserName !== "N/A" ? upstoxUserName : "Upstox User" },
    dhan:     { logo: "https://play-lh.googleusercontent.com/lVXf_i8Gi3C7eZVWKgeG8U5h_kAzUT0MrmvEAXfM_ihlo44VEk01HgAi6vbBNsSzBQ=w240-h480-rw?v=1701", id: dhanClientId || dhanUserId || "N/A", name: dhanClientName || "Dhan User" },
    groww:    { logo: "https://play-lh.googleusercontent.com/LHjOai6kf1IsstKNWO9jbMxD-ix_FVYaJSLodKCqYQdoFVzQBuV9z5txxzcTagQcyX8=s48-rw", id: growwUserId || "N/A", name: growwUserName || "Groww User", rounded: true },
    delta:    { logo: "https://play-lh.googleusercontent.com/XAQ7c8MRAvy_mOUw8EGS3tQsn95MY7gJxtj-sSoVZ6OYJmjvt7KaGGDyT85UTRpLxL6d=w240-h480-rw", id: (deltaExchangeUserId && deltaExchangeUserId !== "Fetching..." ? deltaExchangeUserId : "N/A"), name: (deltaExchangeAccountName && deltaExchangeAccountName !== "Delta User" ? deltaExchangeAccountName : "Delta User"), rounded: true },
    fyers:    { logo: "https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw", id: fyersStatus?.userId || "N/A", name: fyersStatus?.userName || "Fyers User", rounded: true },
    angelone: { logo: "https://play-lh.googleusercontent.com/Ic8lUYwMCgTePpo-Gbg0VwE_0srDj1xD386BvQHO_mOwsfMjX8lFBLl0Def28pO_Mvk=s48-rw?v=1701", id: angelOneClientCode || "N/A", name: angelOneUserName || "Angel One User", rounded: true },
  };

  const renderDialogHeader = (broker: string | null, funds: number | null | undefined, onToggleUserId: () => void, isSecondary = false) => {
    if (!broker) return null;
    const info = allBrokerInfo[broker];
    const isDelta = broker === 'delta';
    const fundsDisplay = funds != null
      ? (isDelta
          ? `$${Number(funds).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `₹${Number(funds).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      : (isDelta ? '$0.00' : '₹0.00');

    return (
      <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b ${
        isSecondary
          ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-800/50'
          : 'bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {info && (
            <img
              src={info.logo}
              alt={broker}
              className={`w-5 h-5 flex-shrink-0 object-contain ${info.rounded ? 'rounded-full' : ''}`}
            />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate leading-none">
              {showUserId ? info?.name : "••••••"}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">
              {showUserId ? info?.id : "••••••"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none">Funds</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
              {showUserId ? fundsDisplay : (isDelta ? "$***" : "₹***")}
            </p>
          </div>
          <button
            onClick={onToggleUserId}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            data-testid="button-toggle-user-id"
          >
            {showUserId ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'COMPLETE' || s === 'COMPLETED' || s === 'EXECUTED' || s === 'FILLED')
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    if (s === 'REJECTED' || s === 'FAILED')
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (s === 'CANCELLED' || s === 'CANCELED')
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
  };

  const renderOrdersTable = (orders: any[], isFetching: boolean, onRecord?: () => void) => {
    const sorted = [...orders].sort((a, b) => {
      const aS = String(a.status || "").toUpperCase().trim();
      const bS = String(b.status || "").toUpperCase().trim();
      const rank = (s: string) => s === "COMPLETE" || s === "PENDING" ? 0 : s === "REJECTED" || s === "CANCELLED" ? 999 : 500;
      return rank(aS) - rank(bS);
    });

    return (
      <div className="space-y-2">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
            <BookOpen className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No orders found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Time</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Symbol</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Side</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Price</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {sorted.map((trade, index) => {
                    const status = String(trade.status || "PENDING").toUpperCase().trim();
                    const isClosed = status === "REJECTED" || status === "CANCELLED";
                    return (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${isClosed ? 'opacity-50' : ''}`}
                        data-testid={`row-order-${index}`}
                      >
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                          {formatTime(trade.time || trade.executedAt || trade.created_at)}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200 max-w-[140px] truncate">
                          {formatSymbol(trade.symbol)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            trade.order === "BUY"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          }`}>
                            {trade.order === "BUY" ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {trade.order}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{trade.type}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{trade.qty}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {typeof trade.price === 'number' ? `₹${trade.price.toFixed(2)}` : trade.price}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getStatusStyle(status)}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-1.5">
              {sorted.map((trade, index) => {
                const status = String(trade.status || "PENDING").toUpperCase().trim();
                const isClosed = status === "REJECTED" || status === "CANCELLED";
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 ${isClosed ? 'opacity-50' : ''}`}
                    data-testid={`card-order-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          trade.order === "BUY"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        }`}>
                          {trade.order}
                        </span>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {formatSymbol(trade.symbol)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                        <span>{formatTime(trade.time || trade.executedAt || trade.created_at)}</span>
                        <span>·</span>
                        <span>{trade.type}</span>
                        <span>·</span>
                        <span>Qty {trade.qty}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                        {typeof trade.price === 'number' ? `₹${trade.price.toFixed(2)}` : trade.price}
                      </p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getStatusStyle(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-600">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          {onRecord && (
            <button
              onClick={onRecord}
              disabled={orders.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              data-testid="button-record-broker-orders"
            >
              <BookOpen className="w-3 h-3" />
              Save to Journal
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPositionsTable = (positions: any[], livePrices: Record<string, number> = {}, isFetching = false) => {
    const sorted = [...positions].sort((a, b) => {
      const aS = String(a.status || "Open").toUpperCase().trim();
      const bS = String(b.status || "Open").toUpperCase().trim();
      return (aS === "OPEN" ? 0 : 999) - (bS === "OPEN" ? 0 : 999);
    });

    return (
      <div className="space-y-2">
        {isFetching && positions.length === 0 ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800/60" />
            ))}
          </div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
            <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No positions</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Symbol</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Entry</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">LTP</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">P&L</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Ret%</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {sorted.map((pos, index) => {
                    const entryPrice = (pos.entryPrice || pos.entry_price || pos.avgPrice || 0) as number;
                    const ltpKey = `${pos.exchange || 'NSE'}_${pos.symbol}`;
                    const liveLTP = livePrices[ltpKey];
                    const currentPrice = liveLTP !== undefined ? liveLTP : (pos.currentPrice || pos.current_price || pos.ltp || 0) as number;
                    const qty = (pos.qty || pos.quantity || pos.netQty || 0) as number;
                    const unrealizedPnl = (currentPrice - entryPrice) * qty;
                    const status = String(pos.status || "Open").toUpperCase().trim();
                    const isClosed = status === "CLOSED";
                    const returnPercent = (entryPrice > 0 && !isClosed) ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
                    const isProfit = unrealizedPnl >= 0;
                    return (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${isClosed ? 'opacity-50' : ''}`}
                        data-testid={`row-position-${index}`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200 max-w-[140px] truncate">
                          {formatSymbol(pos.symbol)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">₹{entryPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300 font-medium">₹{currentPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{qty}</td>
                        <td className={`px-3 py-2 text-right tabular-nums font-semibold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isProfit ? '+' : ''}₹{unrealizedPnl.toFixed(2)}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums text-xs ${(returnPercent >= 0 || isClosed) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isClosed ? '–' : `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%`}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            isClosed
                              ? 'text-gray-500 bg-gray-100 dark:bg-gray-800'
                              : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-1.5">
              {sorted.map((pos, index) => {
                const entryPrice = (pos.entryPrice || pos.entry_price || pos.avgPrice || 0) as number;
                const ltpKey = `${pos.exchange || 'NSE'}_${pos.symbol}`;
                const liveLTP = livePrices[ltpKey];
                const currentPrice = liveLTP !== undefined ? liveLTP : (pos.currentPrice || pos.current_price || pos.ltp || 0) as number;
                const qty = (pos.qty || pos.quantity || pos.netQty || 0) as number;
                const unrealizedPnl = (currentPrice - entryPrice) * qty;
                const status = String(pos.status || "Open").toUpperCase().trim();
                const isClosed = status === "CLOSED";
                const returnPercent = (entryPrice > 0 && !isClosed) ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
                const isProfit = unrealizedPnl >= 0;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 ${isClosed ? 'opacity-50' : ''}`}
                    data-testid={`card-position-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mb-0.5">
                        {formatSymbol(pos.symbol)}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                        <span>Entry ₹{entryPrice.toFixed(2)}</span>
                        <span>·</span>
                        <span>LTP ₹{currentPrice.toFixed(2)}</span>
                        <span>·</span>
                        <span>Qty {qty}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold tabular-nums ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isProfit ? '+' : ''}₹{unrealizedPnl.toFixed(2)}
                      </p>
                      <p className={`text-[10px] tabular-nums ${(returnPercent >= 0 || isClosed) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isClosed ? '–' : `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-600">{positions.length} position{positions.length !== 1 ? 's' : ''}</span>
          {positions.length > 0 && positionsLastUpdated && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE · {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col p-0 gap-0 rounded-xl overflow-hidden">
          {renderDialogHeader(activeBroker, brokerFundsValue, () => setShowUserId(!showUserId))}
          <div className="flex-1 overflow-y-auto custom-thin-scrollbar">
            <Tabs value={orderTab} onValueChange={setOrderTab} className="w-full">
              <div className="px-4 pt-3 pb-0 sticky top-0 bg-white dark:bg-gray-950 z-[5]">
                <TabsList className="h-8 w-full grid grid-cols-2 bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
                  <TabsTrigger value="history" className="text-xs h-7 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="positions" className="text-xs h-7 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
                    Positions
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="px-4 py-3">
                <TabsContent value="history" className="mt-0">
                  {renderOrdersTable(displayOrders, isFetchingOrders, recordAllBrokerOrders)}
                </TabsContent>
                <TabsContent value="positions" className="mt-0">
                  {renderPositionsTable(displayPositions, activeBroker === 'groww' ? growwLivePrices : {}, fetchingBrokerPositions)}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {secondaryBroker && (
        <Dialog open={showSecondaryOrderModal} onOpenChange={setShowSecondaryOrderModal}>
          <DialogContent className="w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col p-0 gap-0 rounded-xl overflow-hidden">
            {renderDialogHeader(secondaryBroker, secondaryBrokerFunds, () => setShowUserId(!showUserId), true)}
            <div className="flex-1 overflow-y-auto custom-thin-scrollbar">
              <Tabs value={secondaryOrderTab} onValueChange={setSecondaryOrderTab} className="w-full">
                <div className="px-4 pt-3 pb-0 sticky top-0 bg-violet-50 dark:bg-violet-950/40 z-[5]">
                  <TabsList className="h-8 w-full grid grid-cols-2 bg-violet-100/70 dark:bg-violet-900/30 rounded-lg p-0.5">
                    <TabsTrigger value="history" className="text-xs h-7 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-violet-900/60 data-[state=active]:shadow-sm">
                      Orders
                    </TabsTrigger>
                    <TabsTrigger value="positions" className="text-xs h-7 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-violet-900/60 data-[state=active]:shadow-sm">
                      Positions
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="px-4 py-3">
                  <TabsContent value="history" className="mt-0">
                    {renderOrdersTable(secondaryBrokerOrders, fetchingSecondaryBroker || false, recordSecondaryBrokerOrders ? () => recordSecondaryBrokerOrders(secondaryBrokerOrders) : undefined)}
                  </TabsContent>
                  <TabsContent value="positions" className="mt-0">
                    {renderPositionsTable(secondaryBrokerPositions, secondaryBroker === 'groww' ? growwLivePrices : {}, fetchingSecondaryBroker || false)}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
