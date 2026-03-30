import { DialogContent, Dialog } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, Plus, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  } = props;

  const queryClient = useQueryClient();

  const [secondaryOrderTab, setSecondaryOrderTab] = useState("history");

  const isFyersConnected = fyersStatus?.connected && fyersStatus?.authenticated;
  const isConnected = zerodhaAccessToken || upstoxAccessToken || angelOneAccessToken || dhanAccessToken || growwAccessToken || deltaExchangeIsConnected || isFyersConnected;
  const activeBroker = zerodhaAccessToken ? 'zerodha' : upstoxAccessToken ? 'upstox' : angelOneAccessToken ? 'angelone' : dhanAccessToken ? 'dhan' : growwAccessToken ? 'groww' : deltaExchangeIsConnected ? 'delta' : isFyersConnected ? 'fyers' : null;

  // Refresh Dhan profile every 10 seconds if connected
  useEffect(() => {
    if (activeBroker !== 'dhan' || !showOrderModal) return;

    const refreshDhanProfile = async () => {
      try {
        const response = await apiRequest("GET", `/api/broker/dhan/profile?accessToken=${encodeURIComponent(dhanAccessToken || '')}&dhanClientId=${encodeURIComponent(dhanClientId || dhanUserId || '')}`, null);
        console.log("🔍 [DHAN] Profile refresh response:", response);
        queryClient.invalidateQueries({ queryKey: ["/api/broker/dhan/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/broker/dhan/profile"] });
      } catch (error) {
        console.error("Error refreshing Dhan profile:", error);
      }
    };

    refreshDhanProfile();
    const interval = setInterval(refreshDhanProfile, 10000);
    return () => clearInterval(interval);
  }, [activeBroker, dhanAccessToken, dhanClientId, dhanUserId, showOrderModal, queryClient]);

  // Refresh Delta profile every minute if connected
  useEffect(() => {
    if (!deltaExchangeIsConnected || !showOrderModal) return;

    const refreshProfile = async () => {
      try {
        const response = await apiRequest("GET", `/api/broker/delta/profile?apiKey=${encodeURIComponent(deltaExchangeApiKey || '')}&apiSecret=${encodeURIComponent(deltaExchangeApiSecret || '')}`, null);
        console.log("🔍 [DELTA] Profile refresh response:", response);
        queryClient.invalidateQueries({ queryKey: ["/api/broker/delta/profile"] });
      } catch (error) {
        console.error("Error refreshing Delta profile:", error);
      }
    };

    refreshProfile();
    const interval = setInterval(refreshProfile, 60000);
    return () => clearInterval(interval);
  }, [deltaExchangeIsConnected, showOrderModal, queryClient]);


  const [growwOrders, setGrowwOrders] = useState<any[]>([]);
  const [fetchingGrowwOrders, setFetchingGrowwOrders] = useState(false);
  const [growwPositions, setGrowwPositions] = useState<any[]>([]);
  const [growwFundsValue, setGrowwFundsValue] = useState<number>(0);

  // Refresh Groww orders every 15 seconds if connected
  useEffect(() => {
    if (activeBroker !== 'groww' || !showOrderModal) return;

    const refreshGrowwOrders = async () => {
      setFetchingGrowwOrders(true);
      try {
        const response = await apiRequest("GET", `/api/broker/groww/orders?accessToken=${encodeURIComponent(growwAccessToken || '')}`, null);
        console.log("🔍 [GROWW] Orders refresh response:", response);
        if (response.success && response.orders) {
          setGrowwOrders(response.orders);
        }
      } catch (error) {
        console.error("Error refreshing Groww orders:", error);
      } finally {
        setFetchingGrowwOrders(false);
      }
    };

    const refreshGrowwPositions = async () => {
      try {
        const response = await apiRequest("GET", `/api/broker/groww/positions?accessToken=${encodeURIComponent(growwAccessToken || '')}`, null);
        console.log("🔍 [GROWW] Positions refresh response:", response);
        if (response.success && response.positions) {
          setGrowwPositions(response.positions);
        }
      } catch (error) {
        console.error("Error refreshing Groww positions:", error);
      }
    };

    const refreshGrowwFunds = async () => {
      try {
        const response = await apiRequest("GET", `/api/broker/groww/funds?accessToken=${encodeURIComponent(growwAccessToken || '')}`, null);
        if (response.success && response.funds !== undefined) {
          setGrowwFundsValue(response.funds);
        }
      } catch (error) {
        console.error("Error refreshing Groww funds:", error);
      }
    };

    refreshGrowwOrders();
    refreshGrowwPositions();
    refreshGrowwFunds();
    const interval = setInterval(() => {
      refreshGrowwOrders();
      refreshGrowwPositions();
      refreshGrowwFunds();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeBroker, growwAccessToken, showOrderModal, queryClient]);

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
        switch (n % 10) {
          case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th";
        }
      };
      return `${name} ${parseInt(day).toString()}${getOrdinal(day)} ${months[month] || month} ${strike} ${type}`;
    }
    return symbol;
  };

  const brokerFundsValue = activeBroker === 'groww'
    ? (growwFundsValue || brokerFunds || 0)
    : brokerFunds;

  const allBrokerInfo: Record<string, { logo: string; id: string; name: string; rounded?: boolean }> = {
    zerodha:  { logo: "https://zerodha.com/static/images/products/kite-logo.svg", id: zerodhaClientId || "N/A", name: zerodhaUserName || "N/A" },
    upstox:   { logo: "https://assets.upstox.com/content/assets/images/cms/202494/MediumWordmark_UP(WhiteOnPurple).png", id: upstoxUserId || "N/A", name: (upstoxUserName && upstoxUserName !== "undefined" && upstoxUserName !== "N/A" ? upstoxUserName : "Upstox User") },
    dhan:     { logo: "https://play-lh.googleusercontent.com/lVXf_i8Gi3C7eZVWKgeG8U5h_kAzUT0MrmvEAXfM_ihlo44VEk01HgAi6vbBNsSzBQ=w240-h480-rw?v=1701", id: dhanClientId || dhanUserId || "N/A", name: dhanClientName || "Dhan User" },
    groww:    { logo: "https://play-lh.googleusercontent.com/LHjOai6kf1IsstKNWO9jbMxD-ix_FVYaJSLodKCqYQdoFVzQBuV9z5txxzcTagQcyX8=s48-rw", id: growwUserId || "N/A", name: growwUserName || "Groww User", rounded: true },
    delta:    { logo: "https://play-lh.googleusercontent.com/XAQ7c8MRAvy_mOUw8EGS3tQsn95MY7gJxtj-sSoVZ6OYJmjvt7KaGGDyT85UTRpLxL6d=w240-h480-rw", id: (deltaExchangeUserId && deltaExchangeUserId !== "Fetching..." ? deltaExchangeUserId : "N/A"), name: (deltaExchangeAccountName && deltaExchangeAccountName !== "Delta User" ? deltaExchangeAccountName : "Delta User"), rounded: true },
    fyers:    { logo: "https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw", id: fyersStatus?.userId || "N/A", name: fyersStatus?.userName || "Fyers User", rounded: true },
    angelone: { logo: "https://play-lh.googleusercontent.com/Ic8lUYwMCgTePpo-Gbg0VwE_0srDj1xD386BvQHO_mOwsfMjX8lFBLl0Def28pO_Mvk=s48-rw?v=1701", id: angelOneClientCode || "N/A", name: angelOneUserName || "Angel One User", rounded: true },
  };

  const renderBrokerChip = (broker: string) => {
    const info = allBrokerInfo[broker];
    if (!info) return null;
    return (
      <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/50 rounded px-2 py-1 min-w-0">
        <img src={info.logo} alt={broker} className={`w-3 h-3 flex-shrink-0 ${info.rounded ? 'rounded-full' : ''}`} />
        <div className="flex flex-col min-w-0 leading-tight">
          <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{showUserId ? info.id : "••••••"}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{showUserId ? info.name : "•••••"}</span>
        </div>
      </div>
    );
  };

  // Reusable dialog header for any broker
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
      <div className={`sticky top-0 z-10 border-b px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 ${
        isSecondary
          ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-200 dark:border-violet-700'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
      }`}>
        <div className="flex items-center justify-between sm:w-1/3">
          <span className={`text-sm font-semibold ${isSecondary ? 'text-violet-800 dark:text-violet-200' : 'text-slate-800 dark:text-slate-100'}`}>
            Orders & Positions
          </span>
        </div>
        <div className="flex items-center justify-between sm:w-1/3 sm:flex-col sm:items-center sm:justify-center gap-1">
          <span className={`text-[10px] font-medium uppercase tracking-wider ${isSecondary ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`}>
            Available Funds
          </span>
          <span className={`text-xs font-bold ${isSecondary ? 'text-green-600 dark:text-green-400' : 'text-green-600 dark:text-green-400'}`}>
            {showUserId ? fundsDisplay : (isDelta ? "$***" : "₹***")}
          </span>
        </div>
        <div className="flex items-center justify-end sm:w-1/3 gap-2 flex-wrap">
          {info && renderBrokerChip(broker)}
          <button onClick={onToggleUserId} className={`p-1 rounded transition-colors flex-shrink-0 ${isSecondary ? 'hover:bg-violet-200 dark:hover:bg-violet-800' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`} data-testid="button-toggle-user-id" title={showUserId ? "Hide ID" : "Show ID"}>
            {showUserId ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>
      </div>
    );
  };

  // Reusable orders table (full-width single-broker style)
  const renderOrdersTable = (orders: any[], isFetching: boolean, onRecord?: () => void) => (
    <>
      <div className="max-h-96 overflow-auto border rounded-lg custom-thin-scrollbar">
        <table className="w-full min-w-[520px] text-xs">
          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Time</th>
              <th className="px-2 py-2 text-left font-medium">Order</th>
              <th className="px-2 py-2 text-left font-medium">Symbol</th>
              <th className="px-2 py-2 text-left font-medium">Type</th>
              <th className="px-2 py-2 text-left font-medium">Qty</th>
              <th className="px-2 py-2 text-left font-medium">Price</th>
              <th className="px-2 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                  {isFetching ? 'Loading...' : 'No orders found'}
                </td>
              </tr>
            ) : (
              [...orders].sort((a, b) => {
                const aS = String(a.status || "").toUpperCase().trim();
                const bS = String(b.status || "").toUpperCase().trim();
                const aO = aS === "COMPLETE" || aS === "PENDING" ? 0 : aS === "REJECTED" || aS === "CANCELLED" ? 999 : 500;
                const bO = bS === "COMPLETE" || bS === "PENDING" ? 0 : bS === "REJECTED" || bS === "CANCELLED" ? 999 : 500;
                return aO - bO;
              }).map((trade, index) => {
                const status = String(trade.status || "").toUpperCase().trim();
                const isClosed = status === "REJECTED" || status === "CANCELLED";
                let displayTime = trade.time || trade.executedAt || trade.created_at;
                if (displayTime) {
                  try {
                    const dateObj = new Date(displayTime);
                    if (!isNaN(dateObj.getTime())) {
                      displayTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                    } else if (displayTime.includes(' ')) {
                      const dateParts = displayTime.split(' ');
                      if (dateParts.length >= 2) {
                        displayTime = dateParts[1];
                        const timeObj = new Date(`2000-01-01 ${displayTime}`);
                        if (!isNaN(timeObj.getTime())) {
                          displayTime = timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                        }
                      }
                    }
                  } catch (e) { console.error("Error formatting time:", e); }
                }
                return (
                  <tr key={index} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${isClosed ? 'bg-gray-100/50 dark:bg-gray-800/40' : ''}`}>
                    <td className="px-2 py-2 font-medium">{displayTime}</td>
                    <td className="px-2 py-2">
                      <span className={`px-1 py-0.5 rounded text-xs ${trade.order === "BUY" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"}`}>{trade.order}</span>
                    </td>
                    <td className="px-2 py-2 font-medium">{formatSymbol(trade.symbol)}</td>
                    <td className="px-2 py-2">{trade.type}</td>
                    <td className="px-2 py-2">{trade.qty}</td>
                    <td className="px-2 py-2">₹{typeof trade.price === 'number' ? trade.price.toFixed(2) : trade.price}</td>
                    <td className="px-2 py-2">
                      <span className={`text-xs font-medium ${(status === 'COMPLETE' || status === 'COMPLETED' || status === 'EXECUTED' || status === 'FILLED') ? 'text-green-600 dark:text-green-400' : status === 'REJECTED' || status === 'FAILED' ? 'text-red-600 dark:text-red-400' : status === 'CANCELLED' || status === 'CANCELED' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {status === 'COMPLETE' ? 'EXECUTED' : (trade.status || 'PENDING').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
        {onRecord && (
          <button onClick={onRecord} disabled={orders.length === 0} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors" data-testid="button-record-broker-orders">
            Record to Journal
          </button>
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{orders.length} orders</span>
      </div>
    </>
  );

  // Reusable positions table (full-width single-broker style)
  const renderPositionsTable = (positions: any[]) => (
    <>
      <div className="max-h-96 overflow-auto border rounded-lg custom-thin-scrollbar">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Symbol</th>
              <th className="px-2 py-2 text-left font-medium">Entry Price</th>
              <th className="px-2 py-2 text-left font-medium">Current Price</th>
              <th className="px-2 py-2 text-left font-medium">Qty</th>
              <th className="px-2 py-2 text-left font-medium">Unrealized P&L</th>
              <th className="px-2 py-2 text-left font-medium">Return %</th>
              <th className="px-2 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                  {isConnected ? 'No open positions' : 'Connect to broker to view positions'}
                </td>
              </tr>
            ) : (
              [...positions].sort((a, b) => {
                const aS = String(a.status || "Open").toUpperCase().trim();
                const bS = String(b.status || "Open").toUpperCase().trim();
                return (aS === "OPEN" ? 0 : 999) - (bS === "OPEN" ? 0 : 999);
              }).map((pos, index) => {
                const entryPrice = (pos.entryPrice || pos.entry_price || pos.avgPrice || 0) as number;
                const currentPrice = (pos.currentPrice || pos.current_price || pos.ltp || 0) as number;
                const qty = (pos.qty || pos.quantity || pos.netQty || 0) as number;
                const unrealizedPnl = pos.unrealizedPnl !== undefined ? pos.unrealizedPnl : (currentPrice - entryPrice) * qty;
                const status = String(pos.status || "Open").toUpperCase().trim();
                const isClosed = status === "CLOSED";
                const returnPercent = (entryPrice > 0 && !isClosed) ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
                let displayTime = pos.time || pos.timestamp || '';
                if (displayTime && typeof displayTime === 'string' && displayTime.includes(' ')) {
                  try {
                    const dateParts = displayTime.split(' ');
                    if (dateParts.length >= 2) {
                      displayTime = dateParts[1];
                      const timeObj = new Date(`2000-01-01 ${displayTime}`);
                      if (!isNaN(timeObj.getTime())) {
                        displayTime = timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                      }
                    }
                  } catch (e) { console.error("Error formatting position time:", e); }
                }
                return (
                  <tr key={index} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${isClosed ? 'bg-gray-100/50 dark:bg-gray-800/40' : ''}`}>
                    <td className="px-2 py-2 font-medium">
                      <div>{formatSymbol(pos.symbol)}</div>
                      {displayTime && <div className="text-[10px] text-gray-500 font-normal">{displayTime}</div>}
                    </td>
                    <td className="px-2 py-2">₹{entryPrice.toFixed(2)}</td>
                    <td className="px-2 py-2">₹{currentPrice.toFixed(2)}</td>
                    <td className="px-2 py-2">{qty}</td>
                    <td className={`px-2 py-2 font-medium ${unrealizedPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>₹{unrealizedPnl.toFixed(2)}</td>
                    <td className={`px-2 py-2 ${returnPercent >= 0 || isClosed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isClosed ? "0.00%" : `${returnPercent.toFixed(2)}%`}
                    </td>
                    <td className="px-2 py-2">{(pos.status || 'Open').toUpperCase()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{positions.length} open positions</span>
      </div>
    </>
  );

  return (
    <>
      {/* Primary broker dialog — always single-broker layout */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-thin-scrollbar p-0 sm:mx-4">
          {renderDialogHeader(activeBroker, brokerFundsValue, () => setShowUserId(!showUserId))}
          <div className="p-4">
            <Tabs value={orderTab} onValueChange={setOrderTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="history">Orders</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="space-y-4">
                {renderOrdersTable(displayOrders, isFetchingOrders, recordAllBrokerOrders)}
              </TabsContent>
              <TabsContent value="positions" className="space-y-4">
                {renderPositionsTable(displayPositions)}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secondary broker dialog — independent, same layout as primary */}
      {secondaryBroker && (
        <Dialog open={showSecondaryOrderModal} onOpenChange={setShowSecondaryOrderModal}>
          <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-thin-scrollbar p-0 sm:mx-4">
            {renderDialogHeader(secondaryBroker, secondaryBrokerFunds, () => setShowUserId(!showUserId), true)}
            <div className="p-4">
              <Tabs value={secondaryOrderTab} onValueChange={setSecondaryOrderTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3">
                  <TabsTrigger value="history">Orders</TabsTrigger>
                  <TabsTrigger value="positions">Positions</TabsTrigger>
                </TabsList>
                <TabsContent value="history" className="space-y-4">
                  {renderOrdersTable(secondaryBrokerOrders, fetchingSecondaryBroker || false, recordSecondaryBrokerOrders ? () => recordSecondaryBrokerOrders(secondaryBrokerOrders) : undefined)}
                </TabsContent>
                <TabsContent value="positions" className="space-y-4">
                  {renderPositionsTable(secondaryBrokerPositions)}
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
