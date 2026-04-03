import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Timer,
  Info,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Trophy,
} from "lucide-react";


// ─── Helper functions ────────────────────────────────────────────────────────

export const calculateAverageDuration = (trades: any[]): string => {
  if (!trades || trades.length === 0) return "0m";

  let totalSeconds = 0;
  let tradesWithDuration = 0;

  trades.forEach((trade) => {
    if (trade.duration && trade.order === "SELL") {
      const minutesMatch = trade.duration.match(/(\d+)m/);
      const secondsMatch = trade.duration.match(/(\d+)s/);
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;
      totalSeconds += minutes * 60 + seconds;
      tradesWithDuration++;
    }
  });

  if (tradesWithDuration === 0) return "0m";

  const avgSecondsTotal = Math.round(totalSeconds / tradesWithDuration);
  const avgMinutes = Math.floor(avgSecondsTotal / 60);
  const avgSeconds = avgSecondsTotal % 60;

  if (avgMinutes > 0) return `${avgMinutes}m ${avgSeconds}s`;
  return `${avgSeconds}s`;
};

export const calculateTotalDuration = (trades: any[]): string => {
  let totalMinutes = 0;

  trades.forEach((trade) => {
    if (trade.duration && trade.duration !== "-") {
      const match = trade.duration.match(/(\d+)m\s*(\d+)s/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        totalMinutes += minutes + seconds / 60;
      }
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);

  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return "0m";
};

export const normalizeDurationForDisplay = (durationStr: string): string => {
  if (!durationStr || durationStr === "-") return "-";

  if (/\d+[dhms]/.test(durationStr)) return durationStr;

  const minuteMatch = durationStr.match(/(\d+)m/);
  const secondMatch = durationStr.match(/(\d+)s/);
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  const seconds = secondMatch ? parseInt(secondMatch[1]) : 0;

  const totalSeconds = minutes * 60 + seconds;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(" ") : "-";
};

// ─── Shared trade row renderer ────────────────────────────────────────────────

function formatTradeTime(timeStr: string | undefined): string {
  if (!timeStr) return "-";
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    let [, h, m, s] = timeMatch.map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")} ${ampm}`;
  }
  return timeStr;
}

function calcPctString(trade: any): string {
  if (!trade.pnl || trade.pnl === "-") return "-";
  const pnlStr = (trade.pnl || "").replace(/[₹,+\s]/g, "");
  const pnlValue = parseFloat(pnlStr) || 0;
  const totalInvestment = trade.price * trade.qty || 1;
  const percentage = (pnlValue / totalInvestment) * 100;
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
}

function calcPctClass(trade: any): string {
  if (!trade.pnl || trade.pnl === "-") return "text-slate-500 dark:text-slate-400";
  const pnlStr = (trade.pnl || "").replace(/[₹,+\s]/g, "");
  const pnlValue = parseFloat(pnlStr) || 0;
  const totalInvestment = trade.price * trade.qty || 1;
  const percentage = (pnlValue / totalInvestment) * 100;
  if (percentage > 0) return "text-emerald-600 dark:text-emerald-400";
  if (percentage < 0) return "text-red-600 dark:text-red-400";
  return "text-slate-600";
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TradeHistoryPanelProps {
  // Mobile collapse state
  showMobileTradeHistory: boolean;
  setShowMobileTradeHistory: (v: boolean) => void;
  // Window toggle (1 = primary, 2 = secondary broker)
  tradeHistoryWindow: number;
  setTradeHistoryWindow: (v: number) => void;
  // Trade data
  tradeHistoryData: any[];
  tradeHistoryData2: any[];
  // Broker connection flags
  zerodhaIsConnected: boolean;
  upstoxIsConnected: boolean;
  angelOneIsConnected: boolean;
  userAngelOneIsConnected: boolean;
  dhanIsConnected: boolean;
  deltaExchangeIsConnected: boolean;
  fyersIsConnected: boolean;
  growwIsConnected: boolean;
  // Dual-broker
  secondaryBroker: string | null;
  // Modal openers
  setShowConnectDialog: (v: boolean) => void;
  setShowOrderModal: (v: boolean) => void;
  setShowSecondaryOrderModal: (v: boolean) => void;
  setShowImportModal: (v: boolean) => void;
  setShowPaperTradingModal: (v: boolean) => void;
  setShowTradingChallengeModal: (v: boolean) => void;
  setShowJournalInfoModal: (v: string) => void;
  // UI / data state
  isLoadingHeatmapData: boolean;
  isDemoMode: boolean;
  selectedDate: Date | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeHistoryPanel({
  showMobileTradeHistory,
  setShowMobileTradeHistory,
  tradeHistoryWindow,
  setTradeHistoryWindow,
  tradeHistoryData,
  tradeHistoryData2,
  zerodhaIsConnected,
  upstoxIsConnected,
  angelOneIsConnected,
  userAngelOneIsConnected,
  dhanIsConnected,
  deltaExchangeIsConnected,
  fyersIsConnected,
  growwIsConnected,
  secondaryBroker,
  setShowConnectDialog,
  setShowOrderModal,
  setShowSecondaryOrderModal,
  setShowImportModal,
  setShowPaperTradingModal,
  setShowTradingChallengeModal,
  setShowJournalInfoModal,
  isLoadingHeatmapData,
  isDemoMode,
  selectedDate,
}: TradeHistoryPanelProps) {

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  function resolveSymbol(symbol: string): string {
    if (!selectedDate) return symbol;
    const selectedMonth = monthNames[selectedDate.getMonth()];
    return symbol.replace(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/, selectedMonth);
  }

  // ── Shared table header ──────────────────────────────────────────────────
  function TableHeader({ isSecondary = false }: { isSecondary?: boolean }) {
    return (
      <thead
        className={`sticky top-0 border-b ${
          isSecondary
            ? "bg-violet-100 dark:bg-violet-900/40 border-violet-200 dark:border-violet-700"
            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        }`}
      >
        <tr>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[60px]">Time</th>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[50px]">Order</th>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[80px]">Symbol</th>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[45px]">Type</th>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[40px]">Qty</th>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[60px]">Price</th>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[60px]">P&L</th>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[45px]">%</th>
          <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[50px]">Duration</th>
        </tr>
      </thead>
    );
  }

  // ── Desktop trade rows (window 2 – secondary broker) ────────────────────
  function DesktopSecondaryRows() {
    if (tradeHistoryData2.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="p-6 text-center">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                Connect your secondary broker to view trades here
              </p>
            </div>
          </td>
        </tr>
      );
    }
    return (
      <>
        {tradeHistoryData2.map((trade, index) => (
          <tr
            key={index}
            className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{formatTradeTime(trade.time)}</td>
            <td className="px-2 py-2">
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  trade.order === "BUY"
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                }`}
              >
                {trade.order}
              </span>
            </td>
            <td className="px-2 py-2 text-slate-700 dark:text-slate-300 font-medium">
              {resolveSymbol(trade.symbol)}
            </td>
            <td className="px-2 py-2 text-indigo-600 dark:text-indigo-300 font-semibold">MIS</td>
            <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{trade.qty}</td>
            <td className="px-2 py-2 text-amber-600 dark:text-amber-300 font-medium">
              ₹{typeof trade.price === "number" ? trade.price.toFixed(2) : trade.price}
            </td>
            <td
              className={`px-2 py-2 font-bold ${
                (trade.pnl || "").includes("+")
                  ? "text-emerald-600 dark:text-emerald-400"
                  : (trade.pnl || "").includes("-")
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {trade.pnl}
            </td>
            <td className={`px-2 py-2 font-bold ${calcPctClass(trade)}`}>{calcPctString(trade)}</td>
            <td className="px-2 py-2 text-violet-600 dark:text-violet-300 font-medium">
              {normalizeDurationForDisplay(trade.duration)}
            </td>
          </tr>
        ))}
      </>
    );
  }

  // ── Desktop trade rows (window 1 – primary broker) ──────────────────────
  function DesktopPrimaryRows() {
    if (isLoadingHeatmapData && tradeHistoryData.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Loading...</span>
            </div>
          </td>
        </tr>
      );
    }
    if (tradeHistoryData.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {!isDemoMode
              ? "No data yet"
              : selectedDate
              ? "No trades for this date"
              : "Select a date to view trades"}
          </td>
        </tr>
      );
    }
    return (
      <>
        {tradeHistoryData.map((trade, index) => (
          <tr
            key={index}
            className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{formatTradeTime(trade.time)}</td>
            <td className="px-2 py-2">
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  trade.order === "BUY"
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                }`}
              >
                {trade.order}
              </span>
            </td>
            <td className="px-2 py-2 text-slate-700 dark:text-slate-300 font-medium">
              {resolveSymbol(trade.symbol)}
            </td>
            <td className="px-2 py-2 text-indigo-600 dark:text-indigo-300 font-semibold">MIS</td>
            <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{trade.qty}</td>
            <td className="px-2 py-2 text-amber-600 dark:text-amber-300 font-medium">
              ₹{typeof trade.price === "number" ? trade.price.toFixed(2) : trade.price}
            </td>
            <td
              className={`px-2 py-2 font-bold ${
                (trade.pnl || "").includes("+")
                  ? "text-emerald-600 dark:text-emerald-400"
                  : (trade.pnl || "").includes("-")
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {trade.pnl}
            </td>
            <td className={`px-2 py-2 font-bold ${calcPctClass(trade)}`}>{calcPctString(trade)}</td>
            <td className="px-2 py-2 text-violet-600 dark:text-violet-300 font-medium">
              {normalizeDurationForDisplay(trade.duration)}
            </td>
          </tr>
        ))}
      </>
    );
  }

  // ── Mobile trade rows ────────────────────────────────────────────────────
  function MobileRows() {
    if (isLoadingHeatmapData && tradeHistoryData.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Loading...</span>
            </div>
          </td>
        </tr>
      );
    }
    if (tradeHistoryData.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {!isDemoMode
              ? "No data yet"
              : selectedDate
              ? "No trades for this date"
              : "Select a date to view trades"}
          </td>
        </tr>
      );
    }
    return (
      <>
        {tradeHistoryData.map((trade, index) => (
          <tr
            key={index}
            className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{formatTradeTime(trade.time)}</td>
            <td className="px-2 py-2">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  trade.order === "BUY"
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                }`}
              >
                {trade.order}
              </span>
            </td>
            <td className="px-2 py-2 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[100px]">
              {trade.symbol}
            </td>
            <td className="px-2 py-2 text-indigo-600 dark:text-indigo-300 font-semibold">MIS</td>
            <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{trade.qty}</td>
            <td className="px-2 py-2 text-amber-600 dark:text-amber-300 font-medium">
              ₹{typeof trade.price === "number" ? trade.price.toFixed(2) : trade.price}
            </td>
            <td className={`px-2 py-2 font-bold ${(trade.pnl || "").includes("+") ? "text-emerald-600" : "text-red-600"}`}>
              {trade.pnl}
            </td>
            <td className="px-2 py-2 font-bold text-slate-600 dark:text-slate-400">
              {(() => {
                if (!trade.pnl || trade.pnl === "-") return "-";
                const pnlStr = (trade.pnl || "").replace(/[₹,+\s]/g, "");
                const pnlValue = parseFloat(pnlStr) || 0;
                const openPrice = trade.price;
                const totalInvestment = openPrice * trade.qty || 1;
                const percentage = (pnlValue / totalInvestment) * 100;
                return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
              })()}
            </td>
            <td className="px-2 py-2 text-violet-600 dark:text-violet-300 font-medium">
              {normalizeDurationForDisplay(trade.duration)}
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <>
      {/* ── MOBILE: collapsible Trade History ─────────────────────────────── */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          onClick={() => setShowMobileTradeHistory(!showMobileTradeHistory)}
          className="w-full flex items-center justify-between h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4"
          data-testid="button-mobile-trade-history-toggle"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Trade History Summary
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center">
              <Timer className="h-3 w-3 mr-1" />
              {calculateTotalDuration(tradeHistoryData)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowJournalInfoModal("manual");
              }}
              data-testid="button-journal-info-mobile"
            >
              <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>
            {showMobileTradeHistory ? (
              <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
        </Button>

        {showMobileTradeHistory && (
          <Card className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[420px] overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex gap-1.5 overflow-x-auto custom-thin-scrollbar pb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConnectDialog(true)}
                    className="h-7 px-2 text-xs shrink-0"
                    data-testid="button-connect-mobile"
                  >
                    Connect
                  </Button>
                  {zerodhaIsConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => secondaryBroker === "zerodha" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                      data-testid="button-broker-orders-zerodha-mobile"
                    >
                      <img
                        src="https://zerodha.com/static/images/products/kite-logo.svg"
                        alt="Zerodha"
                        className="h-4 w-4"
                      />
                    </Button>
                  )}
                  {fyersIsConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => secondaryBroker === "fyers" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                      data-testid="button-broker-orders-fyers-mobile"
                    >
                      <img
                        src="https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw"
                        alt="Fyers"
                        className="h-4 w-4 rounded-full"
                      />
                    </Button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto overflow-x-auto custom-thin-scrollbar">
                <table className="text-xs w-full" style={{ minWidth: "600px" }}>
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[60px]">Time</th>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[50px]">Order</th>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[80px]">Symbol</th>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[45px]">Type</th>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[40px]">Qty</th>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[60px]">Price</th>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[60px]">P&L</th>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[45px]">%</th>
                      <th className="px-2 py-2 text-left text-slate-600 dark:text-slate-400 font-medium min-w-[50px]">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900">
                    <MobileRows />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── DESKTOP: Trade History Card ────────────────────────────────────── */}
      <Card className="hidden md:block h-[420px] border transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="p-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm font-medium uppercase tracking-wide ${
                  tradeHistoryWindow === 2
                    ? "text-violet-700 dark:text-violet-300"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Trade History
              </h3>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setTradeHistoryWindow(1)}
                  data-testid="button-trade-history-window-1"
                  className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                    tradeHistoryWindow === 1
                      ? "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => setTradeHistoryWindow(2)}
                  data-testid="button-trade-history-window-2"
                  className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                    tradeHistoryWindow === 2
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  2
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectDialog(true)}
                className="h-7 px-2 text-xs"
                data-testid="button-connect"
              >
                Connect
              </Button>
              {zerodhaIsConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => secondaryBroker === "zerodha" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                  data-testid="button-broker-orders-zerodha"
                  title="View Orders & Positions (Zerodha)"
                >
                  <img
                    src="https://zerodha.com/static/images/products/kite-logo.svg"
                    alt="Zerodha"
                    className="h-4 w-4"
                  />
                </Button>
              )}
              {upstoxIsConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => secondaryBroker === "upstox" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                  data-testid="button-broker-orders-upstox"
                  title="View Orders & Positions (Upstox)"
                >
                  <img
                    src="https://assets.upstox.com/content/assets/images/cms/202494/MediumWordmark_UP(WhiteOnPurple).png"
                    alt="Upstox"
                    className="h-4 w-4"
                  />
                </Button>
              )}
              {(angelOneIsConnected || userAngelOneIsConnected) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => secondaryBroker === "angelone" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                  data-testid="button-broker-orders-angelone"
                  title="View Orders & Positions (Angel One)"
                >
                  <img
                    src="https://play-lh.googleusercontent.com/Ic8lUYwMCgTePpo-Gbg0VwE_0srDj1xD386BvQHO_mOwsfMjX8lFBLl0Def28pO_Mvk=s48-rw?v=1701"
                    alt="Angel One"
                    className="h-4 w-4"
                  />
                </Button>
              )}
              {dhanIsConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => secondaryBroker === "dhan" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                  data-testid="button-broker-orders-dhan"
                  title="View Orders & Positions (Dhan)"
                >
                  <img
                    src="https://play-lh.googleusercontent.com/lVXf_i8Gi3C7eZVWKgeG8U5h_kAzUT0MrmvEAXfM_ihlo44VEk01HgAi6vbBNsSzBQ=w240-h480-rw?v=1701"
                    alt="Dhan"
                    className="h-4 w-4"
                  />
                </Button>
              )}
              {deltaExchangeIsConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => secondaryBroker === "delta" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                  data-testid="button-broker-orders-delta"
                  title="View Orders & Positions (Delta Exchange)"
                >
                  <img
                    src="https://play-lh.googleusercontent.com/XAQ7c8MRAvy_mOUw8EGS3tQsn95MY7gJxtj-sSoVZ6OYJmjvt7KaGGDyT85UTRpLxL6d=w240-h480-rw"
                    alt="Delta Exchange"
                    className="h-4 w-4 rounded-full"
                  />
                </Button>
              )}
              {fyersIsConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => secondaryBroker === "fyers" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                  data-testid="button-broker-orders-fyers"
                  title="View Orders & Positions (Fyers)"
                >
                  <img
                    src="https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw"
                    alt="Fyers"
                    className="h-4 w-4 rounded-full"
                  />
                </Button>
              )}
              {growwIsConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => secondaryBroker === "groww" ? setShowSecondaryOrderModal(true) : setShowOrderModal(true)}
                  data-testid="button-broker-orders-groww"
                  title="View Orders & Positions (Groww)"
                >
                  <img
                    src="https://play-lh.googleusercontent.com/LHjOai6kf1IsstKNWO9jbMxD-ix_FVYaJSLodKCqYQdoFVzQBuV9z5txxzcTagQcyX8=s48-rw"
                    alt="Groww"
                    className="h-4 w-4 rounded-full"
                  />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImportModal(true)}
                className="h-7 px-2 text-xs"
                data-testid="button-import-pnl"
              >
                Import
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaperTradingModal(true)}
                className="h-7 px-2 text-xs hidden md:flex items-center gap-1"
                data-testid="button-paper-trade"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Paper Trade
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTradingChallengeModal(true)}
                className="h-7 w-7"
                data-testid="button-trading-challenge"
                title="Trading Challenge"
              >
                <Trophy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowJournalInfoModal("manual")}
                className="h-7 w-7 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full"
                data-testid="button-journal-info"
                title="Journal Information"
              >
                <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </Button>
              <div
                className="h-7 px-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300"
                title="Average Trade Duration"
              >
                <span className="mr-1">Avg</span>
                <Timer className="h-4 w-4 mr-1.5" />
                {calculateAverageDuration(tradeHistoryWindow === 2 ? tradeHistoryData2 : tradeHistoryData)}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="max-h-80 overflow-y-auto overflow-x-auto custom-thin-scrollbar">
            <table className="text-xs" style={{ minWidth: "100%" }}>
              <TableHeader isSecondary={tradeHistoryWindow === 2} />
              <tbody className="bg-white dark:bg-slate-900">
                {tradeHistoryWindow === 2 ? <DesktopSecondaryRows /> : <DesktopPrimaryRows />}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </>
  );
}
