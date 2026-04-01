import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Countdown } from "@/components/countdown";
import {
  Eye,
  EyeOff,
  Search,
  Shield,
  Grid3X3,
  ChevronLeft,
} from "lucide-react";

export interface PaperPosition {
  id: string;
  symbol: string;
  type: "STOCK" | "FUTURES" | "OPTIONS";
  action: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  entryTime: string;
  pnl: number;
  pnlPercent: number;
  isOpen: boolean;
  slEnabled?: boolean;
  slType?: "price" | "percent" | "duration" | "high" | "low";
  slValue?: string;
  slTimeframe?: string;
  slDurationUnit?: string;
  slTriggerPrice?: number;
  slExpiryTime?: number;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  type: "STOCK" | "FUTURES" | "OPTIONS";
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  time: string;
  pnl?: string;
  closedAt?: string;
}

interface PaperTradingMobileTabProps {
  // Display state
  paperTradingTotalPnl: number;
  paperTradingCapital: number;
  hidePositionDetails: boolean;
  setHidePositionDetails: (v: boolean) => void;

  // Positions & history
  paperPositions: PaperPosition[];
  paperTradeHistory: PaperTrade[];

  // Symbol search
  paperTradeSymbolSearch: string;
  setPaperTradeSymbolSearch: (v: string) => void;
  paperTradeSymbol: string;
  setPaperTradeSymbol: (v: string) => void;
  paperTradingEventSourcesRef: React.MutableRefObject<Map<string, EventSource>>;
  setPaperTradingWsStatus: (v: "connected" | "connecting" | "disconnected") => void;
  setPaperTradeCurrentPrice: (v: number | null) => void;
  searchPaperTradingInstruments: (query: string) => void;
  setPaperTradeSearchResults: (v: any[]) => void;
  paperTradeSearchLoading: boolean;
  paperTradeSearchResults: any[];

  // Instrument selection
  setSelectedPaperTradingInstrument: (v: any) => void;
  fetchPaperTradePrice: (stockInfoOverride?: any) => void;

  // Trade type
  paperTradeType: "STOCK" | "FUTURES" | "OPTIONS" | "MCX";
  setPaperTradeType: (v: "STOCK" | "FUTURES" | "OPTIONS" | "MCX") => void;
  setPaperTradeQuantity: (v: string) => void;
  setPaperTradeLotInput: (v: string) => void;
  setSelectedPaperTradingInstrumentNull: () => void;
  setPaperTradeSLPrice: (v: string) => void;

  // Quantity & price
  paperTradeQuantity: string;
  paperTradeLotInput: string;
  paperTradeCurrentPrice: number | null;
  paperTradePriceLoading: boolean;

  // Stop Loss
  showMobilePaperTradeSLDropdown: boolean;
  setShowMobilePaperTradeSLDropdown: (v: boolean) => void;
  paperTradeSLEnabled: boolean;
  setPaperTradeSLEnabled: (v: boolean) => void;
  paperTradeSLPrice: string;
  paperTradeSLType: "price" | "percent" | "duration" | "high" | "low";
  setPaperTradeSLType: (v: "price" | "percent" | "duration" | "high" | "low") => void;
  paperTradeSLTimeframe: string;
  setPaperTradeSLTimeframe: (v: string) => void;
  paperTradeSLDurationUnit: string;
  setPaperTradeSLDurationUnit: (v: string) => void;
  paperTradeSLValue: string;
  setPaperTradeSLValue: (v: string) => void;

  // Trade execution
  setPaperTradeAction: (v: "BUY" | "SELL") => void;
  executePaperTrade: () => void;

  // Option chain
  fetchOptionChainData: () => void;
  setShowOptionChain: (v: boolean) => void;

  // Positions view
  showMobileTradeHistory: boolean;
  setShowMobileTradeHistory: (v: boolean) => void;
  paperTradingWsStatus: "connected" | "connecting" | "disconnected";
  recordAllPaperTrades: () => void;
  exitAllPaperPositions: () => void;
  swipeStartXRef: React.MutableRefObject<number>;
  swipeStartYRef: React.MutableRefObject<number>;
  swipedPositionId: string | null;
  setSwipedPositionId: (v: string | null) => void;
  exitPosition: (positionId: string) => void;

  // Footer
  resetPaperTradingAccount: () => void;

  // Toast
  toast: (opts: { title: string; description?: string }) => void;
}

export function PaperTradingMobileTab({
  paperTradingTotalPnl,
  paperTradingCapital,
  hidePositionDetails,
  setHidePositionDetails,
  paperPositions,
  paperTradeHistory,
  paperTradeSymbolSearch,
  setPaperTradeSymbolSearch,
  paperTradeSymbol,
  setPaperTradeSymbol,
  paperTradingEventSourcesRef,
  setPaperTradingWsStatus,
  setPaperTradeCurrentPrice,
  searchPaperTradingInstruments,
  setPaperTradeSearchResults,
  paperTradeSearchLoading,
  paperTradeSearchResults,
  setSelectedPaperTradingInstrument,
  fetchPaperTradePrice,
  paperTradeType,
  setPaperTradeType,
  setPaperTradeQuantity,
  setPaperTradeLotInput,
  setSelectedPaperTradingInstrumentNull,
  setPaperTradeSLPrice,
  paperTradeQuantity,
  paperTradeLotInput,
  paperTradeCurrentPrice,
  paperTradePriceLoading,
  showMobilePaperTradeSLDropdown,
  setShowMobilePaperTradeSLDropdown,
  paperTradeSLEnabled,
  setPaperTradeSLEnabled,
  paperTradeSLPrice,
  paperTradeSLType,
  setPaperTradeSLType,
  paperTradeSLTimeframe,
  setPaperTradeSLTimeframe,
  paperTradeSLDurationUnit,
  setPaperTradeSLDurationUnit,
  paperTradeSLValue,
  setPaperTradeSLValue,
  setPaperTradeAction,
  executePaperTrade,
  fetchOptionChainData,
  setShowOptionChain,
  showMobileTradeHistory,
  setShowMobileTradeHistory,
  paperTradingWsStatus,
  recordAllPaperTrades,
  exitAllPaperPositions,
  swipeStartXRef,
  swipeStartYRef,
  swipedPositionId,
  setSwipedPositionId,
  exitPosition,
  resetPaperTradingAccount,
  toast,
}: PaperTradingMobileTabProps) {
  return (
    <div className="md:hidden fixed inset-0 z-40 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-y-auto pb-20 flex flex-col">
      {/* Hero Balance Section - Dark gradient background */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-5 pt-8 pb-6 relative">

        <div className="text-gray-400 text-xs mb-1">P&L</div>
        <div className={`text-3xl font-bold mb-2 ${paperTradingTotalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid="paper-trading-pnl-mobile">
          {hidePositionDetails ? '***' : `₹${paperTradingTotalPnl.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        </div>
        <div className="text-sm flex items-center gap-1 text-gray-400">
          <span>{hidePositionDetails ? '***' : `₹${paperTradingCapital.toLocaleString('en-IN')}`}</span>
          <span className="text-gray-500 text-xs">Total Capital</span>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <span>Positions:</span>
            <span className="text-white font-medium">{paperPositions.filter(p => p.isOpen).length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <span>Trades:</span>
            <span className="text-white font-medium">{paperTradeHistory.length}</span>
          </div>
          <Button
            onClick={() => setHidePositionDetails(!hidePositionDetails)}
            size="icon"
            variant="ghost"
            className="h-6 w-6 ml-auto text-gray-400 hover:text-slate-900 dark:hover:text-white"
            data-testid="button-toggle-visibility-mobile"
          >
            {hidePositionDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* New Trade Card */}
        <div className="px-4 py-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">New Trade</div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search instrument..."
                value={paperTradeSymbolSearch}
                onChange={(e) => {
                  const query = e.target.value;
                  if (!query && paperTradeSymbol && paperTradingEventSourcesRef.current.has(paperTradeSymbol)) {
                    const stream = paperTradingEventSourcesRef.current.get(paperTradeSymbol);
                    if (stream) stream.close();
                    paperTradingEventSourcesRef.current.delete(paperTradeSymbol);
                    setPaperTradingWsStatus('disconnected');
                  }
                  setPaperTradeSymbolSearch(query);
                  setPaperTradeSymbol("");
                  setPaperTradeCurrentPrice(null);
                  if (query.length > 0) {
                    searchPaperTradingInstruments(query);
                  } else {
                    setPaperTradeSearchResults([]);
                  }
                }}
                className="h-10 pl-10 text-sm rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                data-testid="input-paper-trade-search-mobile-tab"
              />
              {/* Search Dropdown */}
              {paperTradeSymbolSearch && !paperTradeSymbol && (
                <div className="absolute z-[100] left-0 right-0 mt-1 max-h-48 overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {paperTradeSearchLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </div>
                  ) : paperTradeSearchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
                  ) : (
                    paperTradeSearchResults.slice(0, 6).map((stock, idx) => (
                      <button
                        key={`${stock.symbol}-${stock.exchange}-${idx}`}
                        onClick={() => {
                          setSelectedPaperTradingInstrument(stock);
                          setPaperTradeSymbol(stock.symbol);
                          setPaperTradeSymbolSearch(stock.symbol);
                          if (paperTradeType === 'STOCK') {
                            setPaperTradeQuantity("");
                          } else {
                            setPaperTradeLotInput("1");
                          }
                          fetchPaperTradePrice(stock);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-start text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
                        data-testid={`select-stock-mobile-tab-${stock.symbol}`}
                      >
                        <span className="font-medium">{stock.symbol}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{stock.exchange}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Type and Option Chain Row */}
            <div className="flex gap-2 mb-3">
              <Select
                value={paperTradeType}
                onValueChange={(v) => {
                  const newType = v as 'STOCK' | 'FUTURES' | 'OPTIONS' | 'MCX';
                  if (paperTradeSymbol && paperTradingEventSourcesRef.current.has(paperTradeSymbol)) {
                    const stream = paperTradingEventSourcesRef.current.get(paperTradeSymbol);
                    if (stream) stream.close();
                    paperTradingEventSourcesRef.current.delete(paperTradeSymbol);
                  }
                  setPaperTradeType(newType);
                  setPaperTradeSymbol("");
                  setPaperTradeSymbolSearch("");
                  setPaperTradeSearchResults([]);
                  setPaperTradeCurrentPrice(null);
                  setSelectedPaperTradingInstrumentNull();
                  setPaperTradeQuantity("");
                  setPaperTradeLotInput("");
                  setPaperTradeSLPrice("");
                  setPaperTradingWsStatus('disconnected');
                }}
              >
                <SelectTrigger className="flex-1 h-10 text-sm rounded-lg" data-testid="select-paper-trade-type-mobile-tab">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOCK">Stock</SelectItem>
                  <SelectItem value="FUTURES">Futures</SelectItem>
                  <SelectItem value="OPTIONS">Options</SelectItem>
                  <SelectItem value="MCX">MCX</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  fetchOptionChainData();
                  setShowOptionChain(true);
                }}
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-lg"
                data-testid="button-option-chain-mobile-tab"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Quantity and Price Row */}
            <div className="flex gap-2 mb-4">
              {paperTradeType === 'STOCK' ? (
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={paperTradeQuantity}
                  onChange={(e) => setPaperTradeQuantity(e.target.value)}
                  className="flex-1 h-10 text-sm text-center rounded-lg"
                  min="1"
                  data-testid="input-paper-trade-qty-mobile-tab"
                />
              ) : (
                <Input
                  type="number"
                  placeholder="Lots"
                  value={paperTradeLotInput}
                  onChange={(e) => setPaperTradeLotInput(e.target.value)}
                  className="flex-1 h-10 text-sm text-center rounded-lg"
                  min="1"
                  data-testid="input-paper-trade-lots-mobile-tab"
                />
              )}
              <div className="flex-1 h-10 flex items-center justify-center text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800">
                {paperTradePriceLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : paperTradeCurrentPrice ? (
                  <span>₹{paperTradeCurrentPrice.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Price</span>
                )}
              </div>
            </div>

            {/* Stop Loss Button with Dropdown - Mobile Tab */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Button
                  onClick={() => setShowMobilePaperTradeSLDropdown(!showMobilePaperTradeSLDropdown)}
                  disabled={!paperTradeSymbol || !(paperTradeType === 'STOCK' ? paperTradeQuantity : paperTradeLotInput) || !paperTradeCurrentPrice}
                  variant={paperTradeSLEnabled ? "default" : "outline"}
                  className={`w-full h-10 rounded-lg ${paperTradeSLEnabled ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                  data-testid="button-paper-sl-mobile-tab"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {paperTradeSLEnabled ? `SL: ₹${paperTradeSLPrice}` : 'Set SL'}
                </Button>
                {showMobilePaperTradeSLDropdown && (
                  <div className="absolute z-50 bottom-1/2 transform translate-y-1/2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-64">
                    <div className="p-4 space-y-3">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Stop Loss Configuration</div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase">Type</label>
                        <Select value={paperTradeSLType} onValueChange={(v: any) => setPaperTradeSLType(v)}>
                          <SelectTrigger className="h-9 text-sm mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price">Price SL</SelectItem>
                            <SelectItem value="percent">% SL</SelectItem>
                            <SelectItem value="duration">Duration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(paperTradeSLType === 'high' || paperTradeSLType === 'low') && (
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase">Timeframe</label>
                          <Select value={paperTradeSLTimeframe} onValueChange={(v) => setPaperTradeSLTimeframe(v)}>
                            <SelectTrigger className="h-9 text-sm mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1m">1 Minute</SelectItem>
                              <SelectItem value="5m">5 Minutes</SelectItem>
                              <SelectItem value="15m">15 Minutes</SelectItem>
                              <SelectItem value="30m">30 Minutes</SelectItem>
                              <SelectItem value="1h">1 Hour</SelectItem>
                              <SelectItem value="4h">4 Hours</SelectItem>
                              <SelectItem value="1d">1 Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {paperTradeSLType === 'duration' && (
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase">Duration Unit</label>
                          <Select value={paperTradeSLDurationUnit} onValueChange={(v) => setPaperTradeSLDurationUnit(v)}>
                            <SelectTrigger className="h-9 text-sm mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="min">Minutes</SelectItem>
                              <SelectItem value="hr">Hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {paperTradeSLType !== 'high' && paperTradeSLType !== 'low' && (
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase">{paperTradeSLType === 'duration' ? 'Duration' : 'Value'}</label>
                          <Input
                            type="number"
                            placeholder={paperTradeSLType === 'price' ? 'Price' : paperTradeSLType === 'duration' ? (paperTradeSLDurationUnit === 'min' ? 'Minutes' : 'Hours') : '%'}
                            value={paperTradeSLValue}
                            onChange={(e) => setPaperTradeSLValue(e.target.value)}
                            className="h-9 text-sm mt-1"
                            data-testid="input-paper-sl-value-mobile-tab"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button
                          onClick={() => {
                            setPaperTradeSLEnabled(false);
                            setPaperTradeSLValue("");
                            setPaperTradeSLPrice("");
                            setShowMobilePaperTradeSLDropdown(false);
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9"
                          data-testid="button-clear-sl-mobile-tab"
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={() => {
                            if (paperTradeSLValue || paperTradeSLType === 'high' || paperTradeSLType === 'low') {
                              setPaperTradeSLEnabled(true);
                              setPaperTradeSLPrice(paperTradeSLValue);
                              toast({
                                title: "Stop Loss Set",
                                description: paperTradeSLType === 'price'
                                  ? `SL at ₹${paperTradeSLValue}`
                                  : paperTradeSLType === 'percent'
                                  ? `SL at ${paperTradeSLValue}% loss`
                                  : paperTradeSLType === 'duration'
                                  ? `SL after ${paperTradeSLValue} ${paperTradeSLDurationUnit}`
                                  : `SL at ${paperTradeSLTimeframe} candle ${paperTradeSLType}`
                              });
                            }
                            setShowMobilePaperTradeSLDropdown(false);
                          }}
                          size="sm"
                          className="flex-1 h-9 bg-orange-500 hover:bg-orange-600 text-white"
                          data-testid="button-set-sl-mobile-tab"
                        >
                          Set SL
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {(() => {
                const inputValue = paperTradeType === 'STOCK' ? paperTradeQuantity : paperTradeLotInput;
                return (
                  <>
                    <Button
                      onClick={() => { setPaperTradeAction('BUY'); executePaperTrade(); }}
                      disabled={!paperTradeSymbol || !inputValue || !paperTradeCurrentPrice}
                      className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-base"
                      data-testid="button-paper-buy-mobile-tab"
                    >
                      BUY
                    </Button>
                    <Button
                      onClick={() => { setPaperTradeAction('SELL'); executePaperTrade(); }}
                      disabled={!paperTradeSymbol || !inputValue || !paperTradeCurrentPrice}
                      className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-base"
                      data-testid="button-paper-sell-mobile-tab"
                    >
                      SELL
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Positions & Trade History Toggle Section */}
        {(paperPositions.filter(p => p.isOpen).length > 0 || paperTradeHistory.length > 0) && (
          <div className="">
            <div className="flex items-center justify-start mb-3">
              <Button
                onClick={() => setShowMobileTradeHistory(!showMobileTradeHistory)}
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-gray-400 hover:text-slate-900 dark:hover:text-white"
                data-testid="button-toggle-mobile-position-history"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                {showMobileTradeHistory ? 'Trade History' : 'Open Positions'}
                {!showMobileTradeHistory && paperTradingWsStatus === 'connected' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
              </div>
              <Button
                onClick={showMobileTradeHistory ? recordAllPaperTrades : exitAllPaperPositions}
                size="sm"
                variant="ghost"
                className={`h-7 px-2 text-xs ${
                  showMobileTradeHistory
                    ? 'text-blue-400 hover:text-blue-500'
                    : 'text-red-500 hover:text-red-600'
                }`}
                data-testid={showMobileTradeHistory ? "button-record-all-mobile-tab" : "button-exit-all-mobile-tab"}
              >
                {showMobileTradeHistory ? 'Record' : 'Exit All'}
              </Button>
            </div>

            {/* Open Positions View */}
            {!showMobileTradeHistory && paperPositions.filter(p => p.isOpen).length > 0 && (
              <div className="space-y-2 px-4 divide-gray-200 dark:divide-gray-800">
                {paperPositions.filter(p => p.isOpen).map(position => (
                  <div
                    key={position.id}
                    className="relative bg-red-500 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden select-none cursor-grab active:cursor-grabbing h-auto"
                    data-testid={`position-card-tab-${position.symbol}`}
                    onMouseDown={(e) => {
                      swipeStartXRef.current = e.clientX;
                      swipeStartYRef.current = e.clientY;
                      console.log('🔴 MOUSE DOWN on', position.symbol, ':', swipeStartXRef.current);
                    }}
                    onMouseUp={(e) => {
                      const endX = e.clientX;
                      const endY = e.clientY;
                      const diffX = swipeStartXRef.current - endX;
                      const diffY = Math.abs(swipeStartYRef.current - endY);

                      console.log('🟢 MOUSE UP on', position.symbol, '- diffX:', diffX, 'diffY:', diffY);

                      if (diffX > 25 && diffY < 50) {
                        console.log('✅ LEFT SWIPE DETECTED - SHOW EXIT BUTTON');
                        setSwipedPositionId(position.id);
                      } else if (diffX < -25 && diffY < 50) {
                        console.log('✅ RIGHT SWIPE DETECTED - HIDE EXIT BUTTON');
                        setSwipedPositionId(null);
                      }
                    }}
                    onTouchStart={(e) => {
                      if (e.touches && e.touches[0]) {
                        swipeStartXRef.current = e.touches[0].clientX;
                        swipeStartYRef.current = e.touches[0].clientY;
                        console.log('🔴 TOUCH START on', position.symbol, ':', swipeStartXRef.current);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (Math.abs(swipeStartXRef.current - (e.touches[0]?.clientX || 0)) > 10) {
                        e.preventDefault();
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (e.changedTouches && e.changedTouches[0]) {
                        const endX = e.changedTouches[0].clientX;
                        const endY = e.changedTouches[0].clientY;
                        const diffX = swipeStartXRef.current - endX;
                        const diffY = Math.abs(swipeStartYRef.current - endY);

                        console.log('🟢 TOUCH END on', position.symbol, '- diffX:', diffX, 'diffY:', diffY);

                        if (diffX > 25 && diffY < 50) {
                          console.log('✅ LEFT SWIPE DETECTED - SHOW EXIT BUTTON');
                          setSwipedPositionId(position.id);
                        } else if (diffX < -25 && diffY < 50) {
                          console.log('✅ RIGHT SWIPE DETECTED - HIDE EXIT BUTTON');
                          setSwipedPositionId(null);
                        }
                      }
                    }}
                  >
                    {/* Exit button - always rendered, visible when card slides */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/5 bg-red-500 flex items-center justify-center">
                      <button
                        onClick={() => exitPosition(position.id)}
                        className="flex flex-col items-center justify-center w-full h-full hover:bg-red-600 transition-colors active:bg-red-700"
                        data-testid={`button-exit-position-${position.symbol}`}
                        title="Exit position"
                      >
                        <div className="text-white text-sm font-bold">×</div>
                        <div className="text-[7px] text-white dark:text-white font-bold whitespace-nowrap">EXIT</div>
                      </button>
                    </div>

                    {/* Main position card content - slides left on swipe */}
                    <div
                      className="w-full p-3 bg-white dark:bg-gray-900 cursor-pointer"
                      style={{
                        transform: swipedPositionId === position.id ? 'translateX(-20%)' : 'translateX(0)',
                        transition: 'transform 300ms ease-in-out'
                      }}
                      onClick={() => {
                        if (swipedPositionId === position.id) {
                          console.log('🔄 Tapped on content - resetting swipe');
                          setSwipedPositionId(null);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{position.symbol}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            position.action === 'BUY'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {position.action}
                          </span>
                        </div>
                        {swipedPositionId !== position.id && (
                          <ChevronLeft className="w-4 h-4 text-gray-400 opacity-50" />
                        )}
                      </div>
                      <div className="flex items-center justify-start text-xs">
                        <div className="text-gray-600 dark:text-gray-400">
                          Qty: {position.quantity} | Avg: {hidePositionDetails ? '***' : `₹${position.entryPrice.toFixed(2)}`}
                        </div>
                        <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {hidePositionDetails ? '***' : `₹${position.pnl.toFixed(0)}`}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-start">
                        <div>
                          LTP: ₹{position.currentPrice.toFixed(2)}
                          {(position as any).slType === "duration" ? ((position as any).slExpiryTime ? <span className="text-orange-500 ml-2">Time: <Countdown expiryTime={(position as any).slExpiryTime} onExpiry={() => exitPosition(position.id)} /></span> : null) : (position as any).slTriggerPrice && (
                            <span className="text-orange-500 ml-2">SL: ₹{(position as any).slTriggerPrice.toFixed(2)}</span>
                          )}
                        </div>
                        <div className={`text-[10px] font-semibold ${position.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Trade History View */}
            {showMobileTradeHistory && paperTradeHistory.length > 0 && (
              <div className="space-y-1 bg-white dark:bg-gray-900/50 rounded-lg p-3">
                {[...paperTradeHistory].reverse().slice(0, 10).map(trade => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-start py-2.5 border-b border-gray-200 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        trade.action === 'BUY'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {trade.action === 'BUY' ? 'B' : 'S'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{trade.symbol}</div>
                        <div className="text-[10px] text-gray-400">{trade.time} | Qty: {trade.quantity}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">₹{trade.price.toFixed(2)}</div>
                      <div className={`text-xs ${
                        !trade.pnl ? 'text-gray-600 dark:text-gray-400' : trade.pnl.includes('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {trade.pnl || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-start pt-3 border-t border-gray-800">
            <button
              onClick={resetPaperTradingAccount}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              data-testid="button-reset-mobile-tab"
            >
              Reset Account
            </button>
            <span className="text-xs text-gray-400">Demo mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}
