import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Grid3X3, Search, Shield, ShieldCheck, X } from "lucide-react";
import { Countdown } from "@/components/countdown";

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

interface PaperTradingModalProps {
  showPaperTradingModal: boolean;
  setShowPaperTradingModal: (v: boolean) => void;
  hidePositionDetails: boolean;
  setHidePositionDetails: (v: boolean) => void;
  paperPositions: PaperPosition[];
  paperTradeCurrentPrice: number | null;
  setPaperTradeCurrentPrice: (v: number | null) => void;
  paperTradeHistory: PaperTrade[];
  paperTradeLotInput: string;
  setPaperTradeLotInput: (v: string) => void;
  paperTradePriceLoading: boolean;
  paperTradeQuantity: string;
  setPaperTradeQuantity: (v: string) => void;
  paperTradeSLDurationUnit: string;
  setPaperTradeSLDurationUnit: (v: string) => void;
  paperTradeSLEnabled: boolean;
  setPaperTradeSLEnabled: (v: boolean) => void;
  paperTradeSLTimeframe: string;
  setPaperTradeSLTimeframe: (v: string) => void;
  paperTradeSLType: 'price' | 'percent' | 'duration' | 'high' | 'low';
  setPaperTradeSLType: (v: 'price' | 'percent' | 'duration' | 'high' | 'low') => void;
  paperTradeSLValue: string;
  setPaperTradeSLValue: (v: string) => void;
  paperTradeSLPrice: string;
  setPaperTradeSLPrice: (v: string) => void;
  paperTradeSearchLoading: boolean;
  paperTradeSearchResults: any[];
  paperTradeSymbol: string;
  setPaperTradeSymbol: (v: string) => void;
  paperTradeSymbolSearch: string;
  setPaperTradeSymbolSearch: (v: string) => void;
  paperTradeType: 'STOCK' | 'FUTURES' | 'OPTIONS' | 'MCX';
  setPaperTradeType: (v: 'STOCK' | 'FUTURES' | 'OPTIONS' | 'MCX') => void;
  paperTradingCapital: number;
  paperTradingTotalPnl: number;
  paperTradingWsStatus: 'connected' | 'connecting' | 'disconnected';
  setPaperTradingWsStatus: (v: 'connected' | 'connecting' | 'disconnected') => void;
  showMobilePaperTradeSLDropdown: boolean;
  setShowMobilePaperTradeSLDropdown: (v: boolean) => void;
  showPaperTradeSLDropdown: boolean;
  setShowPaperTradeSLDropdown: (v: boolean) => void;
  setPaperTradeAction: (v: 'BUY' | 'SELL') => void;
  setPaperTradeSearchResults: (v: any[]) => void;
  setSelectedPaperTradingInstrument: (v: any) => void;
  setShowOptionChain: (v: boolean) => void;
  executePaperTrade: () => void;
  exitAllPaperPositions: () => void;
  exitPosition: (positionId: string) => void;
  fetchOptionChainData: () => void;
  fetchPaperTradePrice: (stockInfoOverride?: any) => void;
  getLotSizeForInstrument: (symbol: string, type: 'STOCK' | 'FUTURES' | 'OPTIONS' | 'MCX') => number;
  recordAllPaperTrades: () => void;
  resetPaperTradingAccount: () => void;
  searchPaperTradingInstruments: (query: string) => void;
  toast: (opts: { title?: string; description?: string; variant?: string }) => void;
}

export function PaperTradingModal({
  showPaperTradingModal,
  setShowPaperTradingModal,
  hidePositionDetails,
  setHidePositionDetails,
  paperPositions,
  paperTradeCurrentPrice,
  setPaperTradeCurrentPrice,
  paperTradeHistory,
  paperTradeLotInput,
  setPaperTradeLotInput,
  paperTradePriceLoading,
  paperTradeQuantity,
  setPaperTradeQuantity,
  paperTradeSLDurationUnit,
  setPaperTradeSLDurationUnit,
  paperTradeSLEnabled,
  setPaperTradeSLEnabled,
  paperTradeSLTimeframe,
  setPaperTradeSLTimeframe,
  paperTradeSLType,
  setPaperTradeSLType,
  paperTradeSLValue,
  setPaperTradeSLValue,
  paperTradeSLPrice,
  setPaperTradeSLPrice,
  paperTradeSearchLoading,
  paperTradeSearchResults,
  paperTradeSymbol,
  setPaperTradeSymbol,
  paperTradeSymbolSearch,
  setPaperTradeSymbolSearch,
  paperTradeType,
  setPaperTradeType,
  paperTradingCapital,
  paperTradingTotalPnl,
  paperTradingWsStatus,
  setPaperTradingWsStatus,
  showMobilePaperTradeSLDropdown,
  setShowMobilePaperTradeSLDropdown,
  showPaperTradeSLDropdown,
  setShowPaperTradeSLDropdown,
  setPaperTradeAction,
  setPaperTradeSearchResults,
  setSelectedPaperTradingInstrument,
  setShowOptionChain,
  executePaperTrade,
  exitAllPaperPositions,
  exitPosition,
  fetchOptionChainData,
  fetchPaperTradePrice,
  getLotSizeForInstrument,
  recordAllPaperTrades,
  resetPaperTradingAccount,
  searchPaperTradingInstruments,
  toast,
}: PaperTradingModalProps) {
  return (
        <Dialog open={showPaperTradingModal} onOpenChange={setShowPaperTradingModal}>
          <DialogContent className="w-full h-auto sm:max-w-2xl sm:max-h-[85vh] rounded-none sm:rounded-2xl overflow-hidden p-0 bg-white sm:dark:bg-gray-900 hidden sm:flex flex-col">
            {/* Mobile Wallet-Style View */}
            <div className="flex flex-col h-full sm:hidden">
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
              <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 custom-thin-scrollbar">
                {/* Trade Entry Card */}
                <div className="p-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">New Trade</div>

                    {/* Instrument Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
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
                        data-testid="input-paper-trade-search-mobile"
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
                                data-testid={`select-stock-mobile-${stock.symbol}`}
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
                          setSelectedPaperTradingInstrument(null);
                          setPaperTradeQuantity("");
                          setPaperTradeLotInput("");
                          setPaperTradingWsStatus('disconnected');
                        }}
                      >
                        <SelectTrigger className="flex-1 h-10 text-sm rounded-lg" data-testid="select-paper-trade-type-mobile">
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
                        data-testid="button-option-chain-mobile"
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
                          data-testid="input-paper-trade-qty-mobile"
                        />
                      ) : (
                        <Input
                          type="number"
                          placeholder="Lots"
                          value={paperTradeLotInput}
                          onChange={(e) => setPaperTradeLotInput(e.target.value)}
                          className="flex-1 h-10 text-sm text-center rounded-lg"
                          min="1"
                          data-testid="input-paper-trade-lots-mobile"
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

                    {/* Trade Value Display */}
                    {paperTradeSymbol && paperTradeCurrentPrice && (() => {
                      const inputValue = paperTradeType === 'STOCK' ? paperTradeQuantity : paperTradeLotInput;
                      if (!inputValue) return null;
                      let quantity = parseInt(inputValue);
                      if (paperTradeType !== 'STOCK') {
                        const lotSize = getLotSizeForInstrument(paperTradeSymbol, paperTradeType);
                        quantity = quantity * lotSize;
                      }
                      return (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
                          Trade Value: ₹{(quantity * paperTradeCurrentPrice).toLocaleString('en-IN')}
                        </div>
                      );
                    })()}

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
                              data-testid="button-paper-buy-mobile"
                            >
                              BUY
                            </Button>
                            <Button
                              onClick={() => { setPaperTradeAction('SELL'); executePaperTrade(); }}
                              disabled={!paperTradeSymbol || !inputValue || !paperTradeCurrentPrice}
                              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-base"
                              data-testid="button-paper-sell-mobile"
                            >
                              SELL
                            </Button>

                            {/* Mobile SL Button with Dropdown */}
                            <div className="relative">
                              <Button
                                onClick={() => setShowMobilePaperTradeSLDropdown(!showMobilePaperTradeSLDropdown)}
                                disabled={!paperTradeSymbol || !inputValue || !paperTradeCurrentPrice}
                                variant={paperTradeSLEnabled ? "default" : "outline"}
                                className={`h-12 w-12 rounded-xl ${paperTradeSLEnabled ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                                data-testid="button-paper-sl-mobile"
                              >
                                {paperTradeSLEnabled ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                              </Button>
                              {showMobilePaperTradeSLDropdown && (
                                <div className="absolute z-50 bottom-14 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                                  <div className="p-4 space-y-3 min-w-[240px]">
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
                                      <div className="flex gap-1.5">
                                        <Input
                                          type="number"
                                          placeholder="Duration"
                                          value={paperTradeSLValue}
                                          onChange={(e) => setPaperTradeSLValue(e.target.value)}
                                          className="h-9 text-sm flex-1"
                                          data-testid="input-paper-sl-duration-mobile"
                                        />
                                        <Select value={paperTradeSLDurationUnit} onValueChange={(v) => setPaperTradeSLDurationUnit(v)}>
                                          <SelectTrigger className="h-9 text-sm w-20">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="min">Min</SelectItem>
                                            <SelectItem value="hr">Hr</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}

                                    {paperTradeSLType !== 'high' && paperTradeSLType !== 'low' && paperTradeSLType !== 'duration' && (
                                      <Input
                                        type="number"
                                        placeholder={paperTradeSLType === 'price' ? 'Price' : '%'}
                                        value={paperTradeSLValue}
                                        onChange={(e) => setPaperTradeSLValue(e.target.value)}
                                        className="h-9 text-sm"
                                        data-testid="input-paper-sl-value-mobile"
                                      />
                                    )}

                                    <div className="flex gap-2 pt-1">
                                      <Button
                                        onClick={() => {
                                          setPaperTradeSLEnabled(false);
                                          setPaperTradeSLValue("");
                                          setShowMobilePaperTradeSLDropdown(false);
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-9"
                                        data-testid="button-clear-paper-sl-mobile"
                                      >
                                        Clear
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          if (paperTradeSLValue || paperTradeSLType === 'high' || paperTradeSLType === 'low') {
                                            setPaperTradeSLEnabled(true);
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
                                        data-testid="button-set-paper-sl-mobile"
                                      >
                                        Set SL
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Open Positions Section */}
                {paperPositions.filter(p => p.isOpen).length > 0 && (
                  <div className="">
                    <div className="flex items-center justify-start mb-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        Open Positions
                        {paperTradingWsStatus === 'connected' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                      </div>
                      <Button
                        onClick={exitAllPaperPositions}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        data-testid="button-exit-all-mobile"
                      >
                        Exit All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {paperPositions.filter(p => p.isOpen).map(position => {
                        const entryTimeParts = position.entryTime.match(/(\d+):(\d+):(\d+)\s*(AM|PM)?/i);
                        let durationStr = '-';
                        if (entryTimeParts) {
                          const now = new Date();
                          const entryDate = new Date();
                          let hours = parseInt(entryTimeParts[1]);
                          const minutes = parseInt(entryTimeParts[2]);
                          const seconds = parseInt(entryTimeParts[3]);
                          const ampm = entryTimeParts[4];
                          if (ampm) {
                            if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                            if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                          }
                          entryDate.setHours(hours, minutes, seconds, 0);
                          const diffMs = now.getTime() - entryDate.getTime();
                          if (diffMs > 0) {
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffHrs = Math.floor(diffMins / 60);
                            const remainMins = diffMins % 60;
                            durationStr = diffHrs > 0 ? `${diffHrs}h ${remainMins}m` : `${remainMins}m`;
                          } else {
                            durationStr = '0m';
                          }
                        }
                        return (
                          <div 
                            key={position.id}
                            className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800"
                            data-testid={`position-card-${position.symbol}`}
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
                              <span className="text-xs text-gray-400">{durationStr}</span>
                            </div>
                            <div className="flex items-center justify-start text-xs">
                              <div className="text-gray-600 dark:text-gray-400">
                                Qty: {position.quantity} | Avg: {hidePositionDetails ? '***' : `₹${position.entryPrice.toFixed(2)}`}
                              </div>
                              <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {hidePositionDetails ? '***' : `₹${position.pnl.toFixed(0)}`}
                                <span className="text-[10px] ml-1">({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              LTP: ₹{position.currentPrice.toFixed(2)}
                              {(position as any).slType === "duration" ? ((position as any).slExpiryTime ? <span className="text-orange-500 ml-2">Time: <Countdown expiryTime={(position as any).slExpiryTime} onExpiry={() => exitPosition(position.id)} /></span> : null) : (position as any).slTriggerPrice && (
                                <span className="text-orange-500 ml-2">SL: ₹{(position as any).slTriggerPrice.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Trade History Section */}
                {paperTradeHistory.length > 0 && (
                  <div className="">
                    <div className="flex items-center justify-start mb-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Trade History
                      </div>
                      <Button
                        onClick={recordAllPaperTrades}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        data-testid="button-record-all-mobile"
                      >
                        Record
                      </Button>
                    </div>
                    <div className="space-y-1 bg-white dark:bg-gray-900/50 rounded-lg p-3">
                      {[...paperTradeHistory].reverse().slice(0, 10).map(trade => (
                        <div 
                          key={trade.id}
                          className="flex items-center justify-start py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              trade.action === 'BUY' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {trade.action === 'BUY' ? 'B' : 'S'}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{trade.symbol}</div>
                              <div className="text-[10px] text-gray-400">{trade.time} | Qty: {trade.quantity}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">₹{trade.price.toFixed(2)}</div>
                            <div className={`text-xs ${
                              !trade.pnl ? 'text-gray-600 dark:text-gray-400' : trade.pnl.includes('+') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trade.pnl || '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 pb-6">
                  <div className="flex items-center justify-start pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={resetPaperTradingAccount}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      data-testid="button-reset-mobile"
                    >
                      Reset Account
                    </button>
                    <span className="text-xs text-gray-400">Demo mode</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop View - Original Design */}
            <div className="hidden sm:block">
              {/* Compact Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Paper Trading</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      paperTradingWsStatus === 'connected' 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`} data-testid="paper-trading-ws-status">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                        paperTradingWsStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      {paperTradingWsStatus === 'connected' ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Capital: <span className="font-medium text-gray-900 dark:text-gray-100">₹{paperTradingCapital.toLocaleString('en-IN')}</span></span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className={paperTradingTotalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      P&L: <span className="font-medium" data-testid="paper-trading-total-pnl">{hidePositionDetails ? '***' : (paperTradingTotalPnl >= 0 ? '+' : '') + '₹' + paperTradingTotalPnl.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Compact Stats Row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 dark:text-gray-400">Positions:</span>
                    <span className="font-medium">{paperPositions.filter(p => p.isOpen).length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 dark:text-gray-400">Trades:</span>
                    <span className="font-medium">{paperTradeHistory.length}</span>
                  </div>
                </div>

                {/* Trade Entry - Compact Inline Form */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3">
                  <div className="flex flex-wrap items-end gap-2 justify-end">
                    {/* Symbol Search */}
                    <div className="flex-1 min-w-[180px] relative">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                          type="text"
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
                          className="h-8 pl-8 text-xs"
                          data-testid="input-paper-trade-search"
                        />
                      </div>
                      {/* Dropdown */}
                      {paperTradeSymbolSearch && !paperTradeSymbol && (
                        <div className="absolute z-[100] left-0 right-0 mt-1 max-h-40 overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                          {paperTradeSearchLoading ? (
                            <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              Searching...
                            </div>
                          ) : paperTradeSearchResults.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500">No results</div>
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
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-start text-xs"
                                data-testid={`select-stock-${stock.symbol}`}
                              >
                                <span className="font-medium truncate">{stock.symbol}</span>
                                <span className="text-[10px] text-gray-400 ml-2">{stock.exchange}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {/* Option Chain Button */}
                    <Button
                      onClick={() => {
                        fetchOptionChainData();
                        setShowOptionChain(true);
                      }}
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      data-testid="button-option-chain"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>

                    {/* Type */}
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
                        setSelectedPaperTradingInstrument(null);
                        setPaperTradeQuantity("");
                        setPaperTradeLotInput("");
                        setPaperTradeSLPrice("");
                        setPaperTradingWsStatus('disconnected');
                      }}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs" data-testid="select-paper-trade-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCK">Stock</SelectItem>
                        <SelectItem value="FUTURES">Futures</SelectItem>
                        <SelectItem value="OPTIONS">Options</SelectItem>
                        <SelectItem value="MCX">MCX</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Quantity or Lots Input */}
                    {paperTradeType === 'STOCK' ? (
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={paperTradeQuantity}
                        onChange={(e) => setPaperTradeQuantity(e.target.value)}
                        className="w-20 h-8 text-xs text-center"
                        min="1"
                        data-testid="input-paper-trade-qty"
                      />
                    ) : (
                      <Input
                        type="number"
                        placeholder="Lots"
                        value={paperTradeLotInput}
                        onChange={(e) => setPaperTradeLotInput(e.target.value)}
                        className="w-20 h-8 text-xs text-center"
                        min="1"
                        data-testid="input-paper-trade-lots"
                      />
                    )}

                    {/* Price Display */}
                    <div className="w-32 h-8 flex items-center justify-center text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
                      {paperTradePriceLoading ? (
                        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : paperTradeCurrentPrice ? (
                        <span>₹{paperTradeCurrentPrice.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">--</span>
                      )}
                    </div>

                    {/* Buy/Sell and SL Buttons */}
                    {(() => {
                      const inputValue = paperTradeType === 'STOCK' ? paperTradeQuantity : paperTradeLotInput;
                      return (
                        <div className="flex gap-2 items-center justify-end">
                          <Button
                            onClick={() => { setPaperTradeAction('BUY'); executePaperTrade(); }}
                            disabled={!paperTradeSymbol || !inputValue || !paperTradeCurrentPrice}
                            size="sm"
                            className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white text-xs"
                            data-testid="button-paper-buy"
                          >
                            BUY
                          </Button>
                          <Button
                            onClick={() => { setPaperTradeAction('SELL'); executePaperTrade(); }}
                            disabled={!paperTradeSymbol || !inputValue || !paperTradeCurrentPrice}
                            size="sm"
                            className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white text-xs"
                            data-testid="button-paper-sell"
                          >
                            SELL
                          </Button>

                          {/* SL Button with Dropdown */}
                          <div className="relative">
                            <Button
                              onClick={() => setShowPaperTradeSLDropdown(!showPaperTradeSLDropdown)}
                              disabled={!paperTradeSymbol || !inputValue || !paperTradeCurrentPrice}
                              size="sm"
                              variant={paperTradeSLEnabled ? "default" : "outline"}
                              className={`h-8 px-3 text-xs ${paperTradeSLEnabled ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                              data-testid="button-paper-sl"
                            >
                              SL {paperTradeSLEnabled && '✓'}
                            </Button>
                            {showPaperTradeSLDropdown && (
                              <div className="fixed z-[9999] top-10 -right-2 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                                <div className="p-2.5 space-y-1.5">
                                  <div>
                                    <label className="text-[10px] text-gray-500 uppercase">Type</label>
                                    <Select value={paperTradeSLType} onValueChange={(v: any) => setPaperTradeSLType(v)}>
                                      <SelectTrigger className="h-7 text-xs mt-1">
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
                                        <SelectTrigger className="h-6 text-xs mt-0">
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
                                    <div className="flex gap-1.5">
                                      <Input
                                        type="number"
                                        placeholder="Duration"
                                        value={paperTradeSLValue}
                                        onChange={(e) => setPaperTradeSLValue(e.target.value)}
                                        className="h-6 text-xs flex-1"
                                        data-testid="input-paper-sl-duration"
                                      />
                                      <Select value={paperTradeSLDurationUnit} onValueChange={(v) => setPaperTradeSLDurationUnit(v)}>
                                        <SelectTrigger className="h-6 text-xs w-14">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="min">Min</SelectItem>
                                          <SelectItem value="hr">Hr</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  {paperTradeSLType !== 'high' && paperTradeSLType !== 'low' && paperTradeSLType !== 'duration' && (
                                    <Input
                                      type="number"
                                      placeholder={paperTradeSLType === 'price' ? 'Price' : '%'}
                                      value={paperTradeSLValue}
                                      onChange={(e) => setPaperTradeSLValue(e.target.value)}
                                      className="h-6 text-xs"
                                      data-testid="input-paper-sl-value"
                                    />
                                  )}

                                  <Button
                                    onClick={() => {
                                      if (paperTradeSLValue || paperTradeSLType === 'high' || paperTradeSLType === 'low') {
                                        setPaperTradeSLEnabled(true);
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
                                      setShowPaperTradeSLDropdown(false);
                                    }}
                                    size="sm"
                                    className="w-full h-6 text-xs bg-gray-600 hover:bg-gray-700 text-white"
                                    data-testid="button-set-paper-sl"
                                  >
                                    Set SL
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Trade Value */}
                  {paperTradeSymbol && paperTradeCurrentPrice && (() => {
                    const inputValue = paperTradeType === 'STOCK' ? paperTradeQuantity : paperTradeLotInput;
                    if (!inputValue) return null;
                    let quantity = parseInt(inputValue);
                    if (paperTradeType !== 'STOCK') {
                      const lotSize = getLotSizeForInstrument(paperTradeSymbol, paperTradeType);
                      quantity = quantity * lotSize;
                    }
                    return (
                      <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                        Value: ₹{(quantity * paperTradeCurrentPrice).toLocaleString('en-IN')}
                      </div>
                    );
                  })()}
                </div>

                {/* Open Positions - Compact Table */}
                {paperPositions.filter(p => p.isOpen).length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        Open Positions
                        {paperTradingWsStatus === 'connected' && <span className="w-1 h-1 bg-green-500 rounded-full" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setHidePositionDetails(!hidePositionDetails)}
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          data-testid="button-toggle-position-visibility"
                          title={hidePositionDetails ? "Show details" : "Hide details"}
                        >
                          {hidePositionDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          onClick={exitAllPaperPositions}
                          size="sm"
                          variant="outline"
                          className="h-5 px-2 text-[10px] text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-red-700 dark:hover:bg-red-900/20"
                          data-testid="button-exit-all-positions"
                        >
                          Exit All
                        </Button>
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-md overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                            <th className="px-2 py-1.5 text-left font-medium">Symbol</th>
                            <th className="px-2 py-1.5 text-center font-medium">Order</th>
                            <th className="px-2 py-1.5 text-right font-medium">Qty</th>
                            <th className="px-2 py-1.5 text-right font-medium">Avg</th>
                            <th className="px-2 py-1.5 text-right font-medium">LTP</th>
                            <th className="px-2 py-1.5 text-right font-medium">SL</th>
                            <th className="px-2 py-1.5 text-right font-medium">P&L</th>
                            <th className="px-2 py-1.5 text-right font-medium">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paperPositions.filter(p => p.isOpen).map(position => (
                            <tr 
                              key={position.id} 
                              className="border-t border-gray-100 dark:border-gray-800"
                              data-testid={`position-row-${position.symbol}`}
                            >
                              <td className="px-2 py-1.5 font-medium flex items-center gap-2">
                                <span>{position.symbol}</span>
                                <button
                                  onClick={() => exitPosition(position.id)}
                                  className="h-5 w-5 text-red-500 hover:text-red-600 hover:opacity-80 transition-all"
                                  data-testid="button-exit-desktop-position"
                                  title="Exit position"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <span className={`text-[10px] ${position.action === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                                  {position.action}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-right">{position.quantity}</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">{hidePositionDetails ? '***' : position.entryPrice.toFixed(2)}</td>
                              <td className="px-2 py-1.5 text-right">{position.currentPrice.toFixed(2)}</td>
                              <td className="px-2 py-1.5 text-right text-orange-500 text-[10px] font-medium">
                                {(position as any).slType === 'duration' ? ((position as any).slExpiryTime ? <Countdown expiryTime={(position as any).slExpiryTime} onExpiry={() => exitPosition(position.id)} /> : `Time: ${(position as any).slValue} ${(position as any).slDurationUnit || "min"}`) : (position as any).slTriggerPrice ? `₹${(position as any).slTriggerPrice.toFixed(2)}` : "-"}
                              </td>
                              <td className={`px-2 py-1.5 text-right font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {hidePositionDetails ? '***' : `₹${position.pnl.toFixed(0)}`}
                              </td>
                              <td className={`px-2 py-1.5 text-right text-[10px] ${position.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Trade History */}
                {paperTradeHistory.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between gap-2">
                      <div>History</div>
                      <Button
                        onClick={recordAllPaperTrades}
                        size="sm"
                        variant="outline"
                        className="h-5 px-2 text-[10px] text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-700 dark:hover:bg-blue-900/20"
                        data-testid="button-record-all-trades"
                      >
                        Record
                      </Button>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-md overflow-x-auto max-h-40 overflow-y-auto custom-thin-scrollbar">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0">
                          <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                            <th className="px-2 py-1.5 text-left font-medium">Time</th>
                            <th className="px-2 py-1.5 text-center font-medium">Order</th>
                            <th className="px-2 py-1.5 text-left font-medium">Symbol</th>
                            <th className="px-2 py-1.5 text-right font-medium">Qty</th>
                            <th className="px-2 py-1.5 text-right font-medium">Price</th>
                            <th className="px-2 py-1.5 text-right font-medium">P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...paperTradeHistory].reverse().map(trade => (
                            <tr key={trade.id} className="border-t border-gray-100 dark:border-gray-800">
                              <td className="px-2 py-1.5 text-gray-400">{trade.time}</td>
                              <td className="px-2 py-1.5 text-center">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  trade.action === 'BUY' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {trade.action}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 font-medium">{trade.symbol}</td>
                              <td className="px-2 py-1.5 text-right">{trade.quantity}</td>
                              <td className="px-2 py-1.5 text-right">₹{trade.price.toFixed(2)}</td>
                              <td className={`px-2 py-1.5 text-right font-medium ${
                                !trade.pnl ? 'text-gray-600 dark:text-gray-400' : trade.pnl.includes('+') ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {trade.pnl || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={resetPaperTradingAccount}
                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                    data-testid="button-reset-paper-trading"
                  >
                    Reset Account
                  </button>
                  <span className="text-[10px] text-gray-400">Demo mode - no real trades</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
  );
}
