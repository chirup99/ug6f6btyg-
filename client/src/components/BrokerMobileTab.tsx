import { useState } from "react";
import { Plug, ChevronDown, TrendingUp, BookOpen, TrendingDown } from "lucide-react";

interface BrokerMobileTabProps {
  isConnected: boolean;
  activeBroker: string | null;
  secondaryBroker: string | null;
  brokerIconMap: Record<string, string>;
  getBrokerDisplayName: (id: string) => string;
  mobileBrokerOrders: any[];
  mobileBrokerPositions: any[];
  mobileBrokerFunds: number | null;
  mobileBrokerAccountInfo?: { name: string; id: string } | null;
  mobileSecondaryBrokerOrders?: any[];
  mobileSecondaryBrokerPositions?: any[];
  mobileSecondaryBrokerFunds?: number | null;
  mobileSecondaryBrokerAccountInfo?: { name: string; id: string } | null;
  setShowConnectDialog: (open: boolean) => void;
  recordAllBrokerOrders?: () => void;
  zerodhaIsConnected: boolean;
  upstoxIsConnected: boolean;
  angelOneIsConnected: boolean;
  userAngelOneIsConnected: boolean;
  dhanIsConnected: boolean;
  growwIsConnected: boolean;
  deltaExchangeIsConnected: boolean;
  fyersIsConnected: boolean;
}

const ROUNDED_BROKERS = new Set(["groww", "delta", "fyers", "angelone"]);

const formatSymbol = (symbol: string) => {
  if (!symbol) return "";
  const regex = /^([A-Z]+)(\d{2})([1-9]|O|N|D)(\d{2})(\d+)([PC]E)$/;
  const match = symbol.match(regex);
  if (match) {
    const [_, name, , month, day, strike, type] = match;
    const months: Record<string, string> = {
      "1": "JAN", "2": "FEB", "3": "MAR", "4": "APR", "5": "MAY", "6": "JUN",
      "7": "JUL", "8": "AUG", "9": "SEP", "O": "OCT", "N": "NOV", "D": "DEC",
    };
    const n = parseInt(day);
    const ord = n > 3 && n < 21 ? "th" : (["th","st","nd","rd","th","th","th","th","th","th"][n % 10] || "th");
    return `${name} ${n}${ord} ${months[month] || month} ${strike} ${type}`;
  }
  return symbol;
};

const getStatusStyle = (status: string) => {
  const s = status.toUpperCase();
  if (s === "COMPLETE" || s === "COMPLETED" || s === "FILLED") return "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400";
  if (s === "OPEN" || s === "PENDING" || s === "TRIGGER PENDING") return "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
  if (s === "CANCELLED" || s === "CANCELED" || s === "REJECTED") return "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
  return "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
};

export function BrokerMobileTab({
  isConnected,
  activeBroker,
  secondaryBroker,
  brokerIconMap,
  getBrokerDisplayName,
  mobileBrokerOrders,
  mobileBrokerPositions,
  mobileBrokerFunds,
  mobileBrokerAccountInfo,
  mobileSecondaryBrokerOrders = [],
  mobileSecondaryBrokerPositions = [],
  mobileSecondaryBrokerFunds,
  mobileSecondaryBrokerAccountInfo,
  setShowConnectDialog,
  recordAllBrokerOrders,
}: BrokerMobileTabProps) {
  const [subTab, setSubTab] = useState<"orders" | "positions">("orders");
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [viewingSecondary, setViewingSecondary] = useState(false);

  const currentBrokerKey = viewingSecondary ? secondaryBroker : activeBroker;
  const currentOrders = viewingSecondary ? mobileSecondaryBrokerOrders : mobileBrokerOrders;
  const currentPositions = viewingSecondary ? mobileSecondaryBrokerPositions : mobileBrokerPositions;
  const currentFunds = viewingSecondary ? mobileSecondaryBrokerFunds : mobileBrokerFunds;
  const currentAccountInfo = viewingSecondary ? mobileSecondaryBrokerAccountInfo : mobileBrokerAccountInfo;
  const isDelta = currentBrokerKey === "delta";
  const fundsDisplay = currentFunds != null
    ? (isDelta
        ? `$${Number(currentFunds).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `₹${Number(currentFunds).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    : (isDelta ? "$0.00" : "₹0.00");

  if (!isConnected) {
    return (
      <div className="fixed inset-0 z-40 bg-white dark:bg-gray-950 flex flex-col items-center justify-center pb-24">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center mb-5">
          <Plug className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">No broker connected</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-7 text-center max-w-[220px] leading-relaxed">
          Connect your trading account to view live orders and positions
        </p>
        <button
          onClick={() => setShowConnectDialog(true)}
          className="px-7 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold shadow-md active:scale-95 transition-transform"
          data-testid="button-mobile-broker-connect"
        >
          Connect Broker
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-gray-950 flex flex-col pb-20">
      {/* Header */}
      <div className="relative px-4 pt-7 pb-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
        {/* Funds block — top of header */}
        <div className="mb-2.5">
          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight mb-0.5">
            Available Fund
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
            {fundsDisplay}
          </p>
        </div>

        {/* Broker info row — below funds */}
        <button
          className="flex items-center gap-2 min-w-0 w-full"
          onClick={() => setShowSwitcher((v) => !v)}
          data-testid="button-mobile-broker-switcher"
        >
          {currentBrokerKey && brokerIconMap[currentBrokerKey] && (
            <img
              src={brokerIconMap[currentBrokerKey]}
              alt={currentBrokerKey}
              className={`w-5 h-5 flex-shrink-0 object-contain ${ROUNDED_BROKERS.has(currentBrokerKey) ? "rounded-full" : ""}`}
            />
          )}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {currentAccountInfo?.id && (
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-tight truncate">
                {currentAccountInfo.id}
              </p>
            )}
            {currentAccountInfo?.id && currentAccountInfo?.name && (
              <span className="text-gray-300 dark:text-gray-700 text-[10px]">·</span>
            )}
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight truncate">
              {currentAccountInfo?.name || getBrokerDisplayName(currentBrokerKey || "")}
            </p>
          </div>
          {secondaryBroker && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${showSwitcher ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {/* Switcher dropdown */}
        {showSwitcher && secondaryBroker && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-lg">
            <button
              className={`w-full flex items-center gap-2.5 px-4 py-3 ${!viewingSecondary ? "bg-gray-50 dark:bg-gray-800/60" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"}`}
              onClick={() => { setViewingSecondary(false); setShowSwitcher(false); }}
              data-testid="button-mobile-view-primary"
            >
              {activeBroker && brokerIconMap[activeBroker] && (
                <img
                  src={brokerIconMap[activeBroker]}
                  alt={activeBroker}
                  className={`w-5 h-5 object-contain flex-shrink-0 ${ROUNDED_BROKERS.has(activeBroker) ? "rounded-full" : ""}`}
                />
              )}
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 flex-1 text-left">
                {mobileBrokerAccountInfo?.name || getBrokerDisplayName(activeBroker || "")}
              </span>
              {!viewingSecondary && (
                <span className="text-[10px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-2 py-0.5 rounded-full font-medium">
                  Active
                </span>
              )}
            </button>
            <button
              className={`w-full flex items-center gap-2.5 px-4 py-3 ${viewingSecondary ? "bg-violet-50 dark:bg-violet-950/40" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"}`}
              onClick={() => { setViewingSecondary(true); setShowSwitcher(false); }}
              data-testid="button-mobile-view-secondary"
            >
              {brokerIconMap[secondaryBroker] && (
                <img
                  src={brokerIconMap[secondaryBroker]}
                  alt={secondaryBroker}
                  className={`w-5 h-5 object-contain flex-shrink-0 ${ROUNDED_BROKERS.has(secondaryBroker) ? "rounded-full" : ""}`}
                />
              )}
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 flex-1 text-left">
                {mobileSecondaryBrokerAccountInfo?.name || getBrokerDisplayName(secondaryBroker)}
              </span>
              {viewingSecondary && (
                <span className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-medium">
                  Active
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="px-4 pt-3 pb-0 flex-shrink-0 bg-white dark:bg-gray-950">
        <div className={`flex gap-0 rounded-lg p-0.5 ${viewingSecondary ? "bg-violet-100/70 dark:bg-violet-900/30" : "bg-gray-100 dark:bg-gray-800/60"}`}>
          <button
            onClick={() => setSubTab("orders")}
            className={`flex-1 text-xs py-1.5 rounded-[7px] font-medium transition-all duration-150 ${
              subTab === "orders"
                ? (viewingSecondary
                    ? "bg-white dark:bg-violet-900/60 shadow-sm text-gray-900 dark:text-white"
                    : "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white")
                : "text-gray-500 dark:text-gray-400"
            }`}
            data-testid="mobile-broker-subtab-orders"
          >
            Orders
          </button>
          <button
            onClick={() => setSubTab("positions")}
            className={`flex-1 text-xs py-1.5 rounded-[7px] font-medium transition-all duration-150 ${
              subTab === "positions"
                ? (viewingSecondary
                    ? "bg-white dark:bg-violet-900/60 shadow-sm text-gray-900 dark:text-white"
                    : "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white")
                : "text-gray-500 dark:text-gray-400"
            }`}
            data-testid="mobile-broker-subtab-positions"
          >
            Positions
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-thin-scrollbar px-4 py-3 space-y-1.5">
        {subTab === "orders" ? (
          <>
            {currentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
                <BookOpen className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No orders found</p>
              </div>
            ) : (
              currentOrders.map((order: any, i: number) => {
                const symbol = formatSymbol(order.symbol || order.tradingsymbol || "");
                const side = String(order.side || order.transactionType || order.transaction_type || order.tradeType || "").toUpperCase();
                const isBuy = side === "BUY" || side === "B";
                const rawStatus = String(order.status || order.orderStatus || order.order_status || "OPEN");
                const status = rawStatus.toUpperCase().replace(/_/g, " ");
                const price = order.price || order.averagePrice || order.average_price || order.executedPrice || 0;
                const qty = order.qty || order.quantity || order.filledShares || order.orderQuantity || 0;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40"
                    data-testid={`card-mobile-order-${i}`}
                  >
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isBuy ? "bg-emerald-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mb-0.5">{symbol}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                        <span className={isBuy ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>{isBuy ? "BUY" : "SELL"}</span>
                        <span>·</span>
                        <span>Qty {qty}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-200 mb-0.5">
                        {typeof price === "number" ? `₹${price.toFixed(2)}` : price}
                      </p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getStatusStyle(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {currentOrders.length > 0 && (
              <div className="flex items-center justify-between pt-1.5 pb-1">
                <span className="text-[10px] text-gray-400 dark:text-gray-600">
                  {currentOrders.length} order{currentOrders.length !== 1 ? "s" : ""}
                </span>
                {!viewingSecondary && recordAllBrokerOrders && (
                  <button
                    onClick={recordAllBrokerOrders}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    data-testid="button-mobile-record-orders"
                  >
                    <BookOpen className="w-3 h-3" />
                    Save to Journal
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {currentPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
                <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">No positions</p>
              </div>
            ) : (
              currentPositions
                .slice()
                .sort((a: any, b: any) => {
                  const aS = String(a.status || "Open").toUpperCase().trim();
                  const bS = String(b.status || "Open").toUpperCase().trim();
                  return (aS === "OPEN" ? 0 : 999) - (bS === "OPEN" ? 0 : 999);
                })
                .map((pos: any, i: number) => {
                  const entryPrice = Number(pos.entryPrice || pos.entry_price || pos.avgPrice || 0);
                  const currentPrice = Number(pos.currentPrice || pos.current_price || pos.ltp || 0);
                  const qty = Number(pos.qty || pos.quantity || pos.netQty || 0);
                  const unrealizedPnl = (currentPrice - entryPrice) * qty;
                  const status = String(pos.status || "Open").toUpperCase().trim();
                  const isClosed = status === "CLOSED";
                  const returnPercent = entryPrice > 0 && !isClosed ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
                  const isProfit = unrealizedPnl >= 0;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 ${isClosed ? "opacity-50" : ""}`}
                      data-testid={`card-mobile-position-${i}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mb-0.5">
                          {formatSymbol(pos.symbol)}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                          <span>Avg ₹{entryPrice.toFixed(2)}</span>
                          <span>·</span>
                          <span>LTP ₹{currentPrice.toFixed(2)}</span>
                          <span>·</span>
                          <span>Qty {qty}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-bold tabular-nums ${isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {isProfit ? "+" : ""}₹{unrealizedPnl.toFixed(2)}
                        </p>
                        <p className={`text-[10px] tabular-nums ${returnPercent >= 0 || isClosed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {isClosed ? "–" : `${returnPercent >= 0 ? "+" : ""}${returnPercent.toFixed(2)}%`}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
            {currentPositions.length > 0 && (
              <p className="text-[10px] text-gray-400 dark:text-gray-600 pt-1">
                {currentPositions.length} position{currentPositions.length !== 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
