import {
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  Calendar,
  CalendarDays,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface OhlcData {
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  time: number;
}

interface Instrument {
  symbol: string;
  name: string;
  token: string;
  exchange: string;
  instrumentType: string;
  displayName: string;
  tradingSymbol: string;
}

interface JournalChartWindowProps {
  mobileJournalPanel: number;
  showStockSearch: boolean;
  setShowStockSearch: (v: boolean) => void;
  selectedJournalSymbol: string;
  setSelectedJournalSymbol: (v: string) => void;
  setSelectedJournalInterval: (v: string) => void;
  stockSearchQuery: string;
  setStockSearchQuery: (v: string) => void;
  journalSearchType: "STOCK" | "COMMODITY" | "F&O";
  setJournalSearchType: (v: "STOCK" | "COMMODITY" | "F&O") => void;
  selectedInstrumentCategory: string;
  setSelectedInstrumentCategory: (v: string) => void;
  tradedSymbols: string[];
  currentSymbolIndex: number;
  setCurrentSymbolIndex: (fn: any) => void;
  tradingDataByDate: Record<string, any>;
  journalChartMode: "search" | "heatmap";
  setJournalChartMode: (v: "search" | "heatmap") => void;
  showJournalTimeframeDropdown: boolean;
  setShowJournalTimeframeDropdown: (v: boolean) => void;
  showHeatmapTimeframeDropdown: boolean;
  setShowHeatmapTimeframeDropdown: (v: boolean) => void;
  journalChartTimeframe: string;
  setJournalChartTimeframe: (v: string) => void;
  heatmapChartTimeframe: string;
  setHeatmapChartTimeframe: (v: string) => void;
  heatmapSelectedSymbol: string;
  heatmapChartData: any[];
  setHeatmapChartData: (v: any) => void;
  heatmapSelectedDate: string;
  heatmapChartRef: React.MutableRefObject<any>;
  heatmapCandlestickSeriesRef: React.MutableRefObject<any>;
  heatmapEma12SeriesRef: React.MutableRefObject<any>;
  heatmapEma26SeriesRef: React.MutableRefObject<any>;
  setHeatmapHoveredOhlc: (v: any) => void;
  fetchHeatmapChartData: (symbol: string, date: string) => void;
  journalChartData: any[];
  journalChartLoading: boolean;
  hoveredCandleOhlc: OhlcData | null;
  heatmapChartLoading: boolean;
  heatmapHoveredOhlc: OhlcData | null;
  journalChartContainerRef: React.RefObject<HTMLDivElement>;
  heatmapChartContainerRef: React.RefObject<HTMLDivElement>;
  getJournalTimeframeLabel: (v: string) => string;
  fetchJournalChartData: () => void;
  journalTimeframeOptions: Array<{ value: string; label: string }>;
  searchedInstruments: Instrument[];
  setSearchedInstruments: (v: Instrument[]) => void;
  isSearchingInstruments: boolean;
  selectedInstrument: any | null;
  setSelectedInstrument: (v: any) => void;
  selectedInstrumentToken: any | null;
  setSelectedInstrumentToken: (v: any) => void;
  defaultInstruments: Record<string, Instrument[]>;
  categorySearchSuggestions: Record<string, string[]>;
}

export function JournalChartWindow({
  mobileJournalPanel,
  showStockSearch,
  setShowStockSearch,
  selectedJournalSymbol,
  setSelectedJournalSymbol,
  setSelectedJournalInterval,
  stockSearchQuery,
  setStockSearchQuery,
  journalSearchType,
  setJournalSearchType,
  selectedInstrumentCategory,
  setSelectedInstrumentCategory,
  tradedSymbols,
  currentSymbolIndex,
  setCurrentSymbolIndex,
  tradingDataByDate,
  journalChartMode,
  setJournalChartMode,
  showJournalTimeframeDropdown,
  setShowJournalTimeframeDropdown,
  showHeatmapTimeframeDropdown,
  setShowHeatmapTimeframeDropdown,
  journalChartTimeframe,
  setJournalChartTimeframe,
  heatmapChartTimeframe,
  setHeatmapChartTimeframe,
  heatmapSelectedSymbol,
  heatmapChartData,
  setHeatmapChartData,
  heatmapSelectedDate,
  heatmapChartRef,
  heatmapCandlestickSeriesRef,
  heatmapEma12SeriesRef,
  heatmapEma26SeriesRef,
  setHeatmapHoveredOhlc,
  fetchHeatmapChartData,
  journalChartData,
  journalChartLoading,
  hoveredCandleOhlc,
  heatmapChartLoading,
  heatmapHoveredOhlc,
  journalChartContainerRef,
  heatmapChartContainerRef,
  getJournalTimeframeLabel,
  fetchJournalChartData,
  journalTimeframeOptions,
  searchedInstruments,
  setSearchedInstruments,
  isSearchingInstruments,
  selectedInstrument,
  setSelectedInstrument,
  selectedInstrumentToken,
  setSelectedInstrumentToken,
  defaultInstruments,
  categorySearchSuggestions,
}: JournalChartWindowProps) {
  return (
    <div
      className={`h-[300px] sm:h-[380px] md:h-[400px] ${mobileJournalPanel === 0 ? "block" : "hidden"} md:block`}
    >
      {/* Professional Visual Chart with Fyers Data - Same as Trading Master */}
      <div className="h-full relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
              {/* Stock Search Button - ONLY IN SEARCH MODE */}
              {journalChartMode === "search" && (
                <Popover
                  open={showStockSearch}
                  onOpenChange={setShowStockSearch}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 md:px-3 text-xs md:text-sm text-slate-700 dark:text-slate-300"
                      data-testid="button-stock-search"
                    >
                      <Search className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                      <span className="hidden md:inline">
                        {selectedJournalSymbol
                          .replace("NSE:", "")
                          .replace("-EQ", "")
                          .replace("-INDEX", "")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <div className="space-y-1">
                      <div className="flex gap-1.5">
                        <Input
                          placeholder={
                            journalSearchType === "STOCK"
                              ? "Search RELIANCE, TCS, INFY..."
                              : journalSearchType === "COMMODITY"
                                ? "Search GOLD, SILVER, CRUDEOIL..."
                                : "Search NIFTY, BANKNIFTY..."
                          }
                          value={stockSearchQuery}
                          onChange={(e) => setStockSearchQuery(e.target.value)}
                          className="text-xs flex-1 h-7 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                          data-testid="input-stock-search"
                        />
                        <select
                          value={journalSearchType}
                          onChange={(e) => {
                            setJournalSearchType(
                              e.target.value as "STOCK" | "COMMODITY" | "F&O"
                            );
                            setStockSearchQuery("");
                            setSearchedInstruments([]);
                          }}
                          className="h-7 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded px-2 text-xs font-medium"
                          data-testid="select-journal-type"
                        >
                          <option value="STOCK">Stock</option>
                          <option value="COMMODITY">Commodity</option>
                          <option value="F&O">F&O</option>
                        </select>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-1 custom-thin-scrollbar">
                        {/* Loading State */}
                        {isSearchingInstruments && (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="ml-2 text-sm text-gray-500">
                              Searching...
                            </span>
                          </div>
                        )}

                        {/* No Results */}
                        {!isSearchingInstruments &&
                          stockSearchQuery.length >= 2 &&
                          searchedInstruments
                            .filter((i) => {
                              if (selectedInstrumentCategory === "all")
                                return true;
                              switch (selectedInstrumentCategory) {
                                case "stock":
                                  return (
                                    (i.exchange === "NSE" ||
                                      i.exchange === "BSE") &&
                                    (!i.instrumentType ||
                                      i.instrumentType === "" ||
                                      i.instrumentType === "EQ" ||
                                      i.symbol?.endsWith("-EQ") ||
                                      i.instrumentType === "AMXIDX")
                                  );
                                case "commodity":
                                  return (
                                    i.exchange === "MCX" ||
                                    i.exchange === "NCDEX"
                                  );
                                case "fo":
                                  return (
                                    i.exchange === "NFO" ||
                                    i.exchange === "BFO"
                                  );
                                case "currency":
                                  return i.exchange === "CDS";
                                case "index":
                                  return (
                                    i.instrumentType === "AMXIDX" ||
                                    i.instrumentType === "INDEX"
                                  );
                                default:
                                  return true;
                              }
                            })
                            .length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                              No{" "}
                              {selectedInstrumentCategory !== "all"
                                ? selectedInstrumentCategory
                                : ""}{" "}
                              instruments found
                            </div>
                          )}

                        {/* Default Popular Instruments - Show when no search query */}
                        {stockSearchQuery.length < 2 && (
                          <>
                            {(defaultInstruments[
                              selectedInstrumentCategory as keyof typeof defaultInstruments
                            ]?.length ?? 0) > 0 ? (
                              <>
                                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                  Popular{" "}
                                  {selectedInstrumentCategory !== "all"
                                    ? selectedInstrumentCategory
                                        .charAt(0)
                                        .toUpperCase() +
                                      selectedInstrumentCategory.slice(1)
                                    : ""}{" "}
                                  Instruments
                                </div>
                                {(
                                  defaultInstruments[
                                    selectedInstrumentCategory as keyof typeof defaultInstruments
                                  ] || defaultInstruments["all"]
                                ).map((instrument) => (
                                  <button
                                    key={`default-${instrument.exchange}:${instrument.symbol}`}
                                    onClick={() => {
                                      const formattedSymbol = `${instrument.exchange}:${instrument.symbol}`;
                                      setSelectedJournalSymbol(formattedSymbol);
                                      setSelectedInstrument({
                                        symbol: instrument.symbol,
                                        token: instrument.token,
                                        exchange: instrument.exchange,
                                        tradingSymbol: instrument.tradingSymbol,
                                        instrumentType:
                                          instrument.instrumentType,
                                      });
                                      setSelectedInstrumentToken({
                                        token: instrument.token,
                                        exchange: instrument.exchange,
                                        tradingSymbol: instrument.tradingSymbol,
                                      });
                                      setShowStockSearch(false);
                                      setStockSearchQuery("");
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                      selectedJournalSymbol ===
                                      `${instrument.exchange}:${instrument.symbol}`
                                        ? "bg-blue-100 dark:bg-blue-900 font-medium"
                                        : ""
                                    }`}
                                    data-testid={`default-stock-${instrument.exchange}:${instrument.symbol}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="flex-1 font-medium">
                                        {instrument.name}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span
                                          className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                                            instrument.exchange === "NSE"
                                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                              : instrument.exchange === "BSE"
                                                ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                                                : instrument.exchange === "MCX"
                                                  ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                                                  : instrument.exchange ===
                                                      "NFO"
                                                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                                    : instrument.exchange ===
                                                        "BFO"
                                                      ? "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300"
                                                      : instrument.exchange ===
                                                          "CDS"
                                                        ? "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300"
                                                        : instrument.exchange ===
                                                            "NCDEX"
                                                          ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                                                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                          }`}
                                        >
                                          {instrument.exchange}
                                        </span>
                                        {instrument.instrumentType && (
                                          <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                            {instrument.instrumentType}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {instrument.symbol}
                                    </div>
                                  </button>
                                ))}
                                <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 mt-1">
                                  Or type to search more instruments...
                                </div>
                              </>
                            ) : (
                              /* Show search suggestions for Commodity and F&O */
                              <div className="px-3 py-3 space-y-3">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Search for{" "}
                                  {selectedInstrumentCategory === "commodity"
                                    ? "MCX/NCDEX Commodities"
                                    : selectedInstrumentCategory === "currency"
                                      ? "Currency Derivatives"
                                      : "F&O Derivatives"}
                                  :
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(
                                    categorySearchSuggestions[
                                      selectedInstrumentCategory
                                    ] || []
                                  ).map((suggestion) => (
                                    <button
                                      key={suggestion}
                                      onClick={() =>
                                        setStockSearchQuery(suggestion)
                                      }
                                      className="px-2.5 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                      data-testid={`search-suggestion-${suggestion}`}
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-700">
                                  Click a suggestion or type to search...
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Search Results */}
                        {!isSearchingInstruments &&
                          stockSearchQuery.length >= 2 &&
                          searchedInstruments
                            .filter((i) => {
                              if (selectedInstrumentCategory === "all")
                                return true;
                              switch (selectedInstrumentCategory) {
                                case "stock":
                                  return (
                                    (i.exchange === "NSE" ||
                                      i.exchange === "BSE") &&
                                    (!i.instrumentType ||
                                      i.instrumentType === "" ||
                                      i.instrumentType === "EQ" ||
                                      i.symbol?.endsWith("-EQ") ||
                                      i.instrumentType === "AMXIDX")
                                  );
                                case "commodity":
                                  return (
                                    i.exchange === "MCX" ||
                                    i.exchange === "NCDEX"
                                  );
                                case "fo":
                                  return (
                                    i.exchange === "NFO" ||
                                    i.exchange === "BFO"
                                  );
                                case "currency":
                                  return i.exchange === "CDS";
                                case "index":
                                  return (
                                    i.instrumentType === "AMXIDX" ||
                                    i.instrumentType === "INDEX"
                                  );
                                default:
                                  return true;
                              }
                            })
                            .map((instrument) => (
                              <button
                                key={`${instrument.exchange}:${instrument.symbol}`}
                                onClick={() => {
                                  const formattedSymbol = `${instrument.exchange}:${instrument.symbol}`;
                                  setSelectedJournalSymbol(formattedSymbol);
                                  setSelectedInstrument({
                                    symbol: instrument.symbol,
                                    token: instrument.token,
                                    exchange: instrument.exchange,
                                    tradingSymbol: instrument.tradingSymbol,
                                    instrumentType: instrument.instrumentType,
                                  });
                                  setSelectedInstrumentToken({
                                    token: instrument.token,
                                    exchange: instrument.exchange,
                                    tradingSymbol: instrument.tradingSymbol,
                                  });
                                  setShowStockSearch(false);
                                  setStockSearchQuery("");
                                }}
                                className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  selectedJournalSymbol ===
                                  `${instrument.exchange}:${instrument.symbol}`
                                    ? "bg-blue-100 dark:bg-blue-900 font-medium"
                                    : ""
                                }`}
                                data-testid={`stock-option-${instrument.exchange}:${instrument.symbol}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex-1 font-medium">
                                    {instrument.name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                                        instrument.exchange === "NSE"
                                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                          : instrument.exchange === "BSE"
                                            ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                                            : instrument.exchange === "MCX"
                                              ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                                              : instrument.exchange === "NFO"
                                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                                : instrument.exchange === "BFO"
                                                  ? "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300"
                                                  : instrument.exchange ===
                                                      "CDS"
                                                    ? "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300"
                                                    : instrument.exchange ===
                                                        "NCDEX"
                                                      ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                                                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      {instrument.exchange}
                                    </span>
                                    <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                      {instrument.instrumentType}
                                    </span>
                                  </div>
                                </div>
                                {instrument.symbol !== instrument.name && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {instrument.symbol}
                                  </div>
                                )}
                              </button>
                            ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* 🔶 Timeframe Dropdown + Time Range Filter + Next Symbol Button */}
              <div className="flex items-center gap-1">
                {/* Heatmap Symbol Display - ONLY in Heatmap Mode */}
                {journalChartMode === "heatmap" && (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                    {(() => {
                      const sym = heatmapSelectedSymbol
                        .replace("NSE:", "")
                        .replace("-INDEX", "")
                        .replace("-EQ", "");
                      const parts = sym.split(" ");
                      if (parts.length > 1) {
                        const underlying = parts[0];
                        if (underlying === "NIFTY") return "NIFTY50";
                        if (underlying === "FINNIFTY") return "NIFTYFIN";
                        if (
                          ["SENSEX", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"].includes(
                            underlying
                          )
                        )
                          return underlying;
                      }
                      return sym || "No symbol";
                    })()}
                  </span>
                )}

                {/* Export Button - ONLY in Heatmap Mode */}
                {journalChartMode === "heatmap" && heatmapChartData.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-slate-700 dark:text-slate-300"
                    onClick={() => {
                      console.log("📥 Exporting Heatmap OHLC data to CSV...");
                      try {
                        const headers = ["Time", "Open", "High", "Low", "Close", "Volume"];
                        const rows = heatmapChartData.map((d) => {
                          const date = new Date(d.time * 1000);
                          const timeStr = date
                            .toISOString()
                            .replace("T", " ")
                            .replace(/\..+/, "");
                          return [timeStr, d.open, d.high, d.low, d.close, d.volume || 0];
                        });
                        let csvContent =
                          "data:text/csv;charset=utf-8," +
                          headers.join(",") +
                          "\n" +
                          rows.map((r) => r.join(",")).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        const fileName = `heatmap_${heatmapSelectedSymbol.replace(/[:]/g, "_")}_${heatmapSelectedDate}.csv`;
                        link.setAttribute("download", fileName);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        console.log("✅ Export complete:", fileName);
                      } catch (error) {
                        console.error("❌ Export failed:", error);
                      }
                    }}
                    title="Export to CSV"
                    data-testid="button-heatmap-export"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                )}

                {/* Next Symbol Button - ONLY in Heatmap Mode */}
                {journalChartMode === "heatmap" && tradedSymbols.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-slate-700 dark:text-slate-300"
                    onClick={() => {
                      console.log(
                        `⏭️  NEXT CLICKED | Mode: HEATMAP | Index: ${currentSymbolIndex}/${tradedSymbols.length}`
                      );
                      const nextIdx = (currentSymbolIndex + 1) % tradedSymbols.length;
                      const nextSymbol = tradedSymbols[nextIdx];
                      console.log(
                        `⏭️  Switching: ${tradedSymbols[currentSymbolIndex]} → ${nextSymbol}`
                      );
                      if (heatmapChartRef.current) {
                        try {
                          heatmapChartRef.current.remove();
                          console.log(`⏭️  Heatmap chart destroyed`);
                        } catch (e) {}
                        heatmapChartRef.current = null;
                        heatmapCandlestickSeriesRef.current = null;
                        heatmapEma12SeriesRef.current = null;
                        heatmapEma26SeriesRef.current = null;
                      }
                      setCurrentSymbolIndex(nextIdx);
                      setHeatmapChartData([]);
                      setHeatmapHoveredOhlc(null);
                      console.log(
                        `⏭️  [HEATMAP] Switching to raw symbol "${nextSymbol}", refetching chart...`
                      );
                      if (heatmapSelectedDate) {
                        fetchHeatmapChartData(nextSymbol, heatmapSelectedDate);
                      }
                    }}
                    data-testid="button-next-symbol"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                )}

                {/* Timeframe Selector - ONLY in Search Mode */}
                {journalChartMode === "search" && (
                  <Popover
                    open={showJournalTimeframeDropdown}
                    onOpenChange={setShowJournalTimeframeDropdown}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs min-w-[60px] justify-start text-slate-700 dark:text-slate-300"
                        data-testid="button-journal-timeframe-dropdown"
                      >
                        <span>{getJournalTimeframeLabel(journalChartTimeframe)}</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      align="start"
                    >
                      <div className="grid gap-1">
                        {journalTimeframeOptions.map((tf) => (
                          <button
                            key={tf.value}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                              journalChartTimeframe === tf.value
                                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium"
                                : "text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                            onClick={() => {
                              setJournalChartTimeframe(tf.value);
                              setSelectedJournalInterval(tf.value);
                              setShowJournalTimeframeDropdown(false);
                            }}
                            data-testid={`timeframe-option-${tf.value}`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Heatmap Timeframe Selector - ONLY in Heatmap Mode */}
                {journalChartMode === "heatmap" && (
                  <Popover
                    open={showHeatmapTimeframeDropdown}
                    onOpenChange={setShowHeatmapTimeframeDropdown}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 px-2 text-xs min-w-[60px] justify-start text-slate-700 dark:text-slate-300"
                        data-testid="button-heatmap-timeframe-dropdown"
                      >
                        <span>{getJournalTimeframeLabel(heatmapChartTimeframe)}</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      align="start"
                    >
                      <div className="grid gap-1">
                        {journalTimeframeOptions.map((tf) => (
                          <button
                            key={tf.value}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                              heatmapChartTimeframe === tf.value
                                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium"
                                : "text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                            onClick={() => {
                              setHeatmapChartTimeframe(tf.value);
                              setSelectedJournalInterval(tf.value);
                              setShowHeatmapTimeframeDropdown(false);
                            }}
                            data-testid={`heatmap-timeframe-option-${tf.value}`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* 📅 Heatmap Date Selector - ONLY in Heatmap Mode */}
                {journalChartMode === "heatmap" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      {(() => {
                        const getNetPnL = (d: any): number => {
                          if (!d) return 0;
                          if (d?.performanceMetrics?.netPnL !== undefined) {
                            return d.performanceMetrics.netPnL;
                          }
                          if (d?.tradeHistory && Array.isArray(d.tradeHistory)) {
                            let totalPnL = 0;
                            d.tradeHistory.forEach((trade: any) => {
                              if (trade.pnl && typeof trade.pnl === "string") {
                                const pnlValue = parseFloat(
                                  trade.pnl.replace(/[₹,]/g, "")
                                );
                                if (!isNaN(pnlValue)) {
                                  totalPnL += pnlValue;
                                }
                              }
                            });
                            return totalPnL;
                          }
                          if (typeof d?.netPnL === "number") return d.netPnL;
                          if (
                            typeof d?.totalProfit === "number" ||
                            typeof d?.totalLoss === "number"
                          ) {
                            return (
                              (d?.totalProfit || 0) -
                              Math.abs(d?.totalLoss || 0)
                            );
                          }
                          return 0;
                        };
                        const getDatePnLColor = (netPnL: number) => {
                          if (netPnL === 0)
                            return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
                          const absValue = Math.abs(netPnL);
                          if (netPnL > 0) {
                            if (absValue >= 5000)
                              return "bg-green-800 dark:bg-green-700 text-white";
                            if (absValue >= 3000)
                              return "bg-green-700 dark:bg-green-600 text-white";
                            if (absValue >= 1500)
                              return "bg-green-600 dark:bg-green-500 text-white";
                            if (absValue >= 500)
                              return "bg-green-500 dark:bg-green-400 text-white";
                            return "bg-green-400 dark:bg-green-300 text-gray-800 dark:text-gray-900";
                          } else {
                            if (absValue >= 5000)
                              return "bg-red-800 dark:bg-red-700 text-white";
                            if (absValue >= 3000)
                              return "bg-red-700 dark:bg-red-600 text-white";
                            if (absValue >= 1500)
                              return "bg-red-600 dark:bg-red-500 text-white";
                            if (absValue >= 500)
                              return "bg-red-500 dark:bg-red-400 text-white";
                            return "bg-red-400 dark:bg-red-300 text-gray-800 dark:text-gray-900";
                          }
                        };
                        const selectedDateData = heatmapSelectedDate
                          ? tradingDataByDate[heatmapSelectedDate]
                          : null;
                        const selectedDatePnL = selectedDateData
                          ? getNetPnL(selectedDateData)
                          : 0;
                        const dateButtonColor = heatmapSelectedDate
                          ? getDatePnLColor(selectedDatePnL)
                          : "";
                        return (
                          <Button
                            variant={heatmapSelectedDate ? "default" : "outline"}
                            size="sm"
                            className={`h-8 px-2 text-xs flex items-center gap-1 font-medium ${dateButtonColor}`}
                            title={
                              heatmapSelectedDate
                                ? `${heatmapSelectedDate}: P&L ₹${selectedDatePnL.toLocaleString("en-IN")}`
                                : "Click to select date from heatmap"
                            }
                            data-testid="button-open-heatmap-picker"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {heatmapSelectedDate
                                ? heatmapSelectedDate
                                : "No date selected"}
                            </span>
                          </Button>
                        );
                      })()}
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[min(24rem,90vw)] p-2"
                      align="start"
                    >
                      <div className="text-xs font-semibold mb-2">
                        Select Date from Heatmap
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 max-h-64 overflow-y-auto">
                        {Object.entries(tradingDataByDate)
                          .filter(([_, data]) => {
                            if (
                              data?.tradeHistory &&
                              Array.isArray(data.tradeHistory) &&
                              data.tradeHistory.length > 0
                            ) {
                              return true;
                            }
                            const pnl =
                              data?.netPnL ||
                              0 ||
                              (data?.totalProfit || 0) -
                                Math.abs(data?.totalLoss || 0);
                            return pnl !== 0;
                          })
                          .sort(([dateA], [dateB]) =>
                            dateB.localeCompare(dateA)
                          )
                          .slice(0, 10)
                          .map(([date, data]) => {
                            const getNetPnL = (d: any): number => {
                              if (!d) return 0;
                              if (d?.performanceMetrics?.netPnL !== undefined) {
                                return d.performanceMetrics.netPnL;
                              }
                              if (
                                d?.tradeHistory &&
                                Array.isArray(d.tradeHistory)
                              ) {
                                let totalPnL = 0;
                                d.tradeHistory.forEach((trade: any) => {
                                  if (
                                    trade.pnl &&
                                    typeof trade.pnl === "string"
                                  ) {
                                    const pnlValue = parseFloat(
                                      trade.pnl.replace(/[₹,]/g, "")
                                    );
                                    if (!isNaN(pnlValue)) {
                                      totalPnL += pnlValue;
                                    }
                                  }
                                });
                                return totalPnL;
                              }
                              if (typeof d?.netPnL === "number") return d.netPnL;
                              if (
                                typeof d?.totalProfit === "number" ||
                                typeof d?.totalLoss === "number"
                              ) {
                                return (
                                  (d?.totalProfit || 0) -
                                  Math.abs(d?.totalLoss || 0)
                                );
                              }
                              return 0;
                            };
                            const getHeatmapColor = (netPnL: number) => {
                              if (netPnL === 0)
                                return "bg-gray-100 dark:bg-gray-700";
                              const absValue = Math.abs(netPnL);
                              if (netPnL > 0) {
                                if (absValue >= 5000)
                                  return "bg-green-800 dark:bg-green-700";
                                if (absValue >= 3000)
                                  return "bg-green-700 dark:bg-green-600";
                                if (absValue >= 1500)
                                  return "bg-green-600 dark:bg-green-500";
                                if (absValue >= 500)
                                  return "bg-green-500 dark:bg-green-400";
                                return "bg-green-300 dark:bg-green-300";
                              } else {
                                if (absValue >= 5000)
                                  return "bg-red-800 dark:bg-red-700";
                                if (absValue >= 3000)
                                  return "bg-red-700 dark:bg-red-600";
                                if (absValue >= 1500)
                                  return "bg-red-600 dark:bg-red-500";
                                if (absValue >= 500)
                                  return "bg-red-500 dark:bg-red-400";
                                return "bg-red-300 dark:bg-red-300";
                              }
                            };
                            const pnl = getNetPnL(data);
                            const color = getHeatmapColor(pnl);
                            return (
                              <button
                                key={date}
                                onClick={() => {
                                  const tradingData = tradingDataByDate[date];
                                  let symbolForDate = "NSE:NIFTY50-INDEX";
                                  if (
                                    tradingData?.tradeHistory &&
                                    tradingData.tradeHistory.length > 0
                                  ) {
                                    const firstTrade =
                                      tradingData.tradeHistory[0];
                                    if (firstTrade.symbol) {
                                      const cleanSym =
                                        firstTrade.symbol.replace(
                                          /NSE:|BSE:|-INDEX|-EQ/g,
                                          ""
                                        );
                                      symbolForDate = `NSE:${cleanSym}-INDEX`;
                                    }
                                  }
                                  console.log(
                                    `🗓️ [HEATMAP CLICK] Date: ${date}, Symbol: ${symbolForDate}`
                                  );
                                  fetchHeatmapChartData(symbolForDate, date);
                                }}
                                className={`h-6 text-xs font-medium rounded border ${color} ${
                                  heatmapSelectedDate === date
                                    ? "ring-2 ring-purple-500 ring-offset-1"
                                    : "border-gray-300 dark:border-gray-600"
                                } hover:opacity-80 transition`}
                                title={`${date}: P&L ₹${pnl.toLocaleString("en-IN")}`}
                                data-testid={`button-heatmap-date-${date}`}
                              >
                                {new Date(date).getDate()}
                              </button>
                            );
                          })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* X Button to Exit Heatmap Mode - ONLY in Heatmap Mode */}
                {journalChartMode === "heatmap" && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => {
                      console.log(`❌ Switching from heatmap to manual mode`);
                      setJournalChartMode("search");
                    }}
                    title="Switch to manual mode"
                    data-testid="button-exit-heatmap-mode"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}

                {/* Search Chart Fetch Button - ONLY in Search Mode */}
                {journalChartMode === "search" && (
                  <Button
                    onClick={() => {
                      console.log(
                        `🔶 SEARCH CHART: Fetching ${getJournalTimeframeLabel(journalChartTimeframe)} data for manual search`
                      );
                      fetchJournalChartData();
                    }}
                    disabled={journalChartLoading}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title={`Fetch ${getJournalTimeframeLabel(journalChartTimeframe)} chart data (standalone search - last 10 days)`}
                    data-testid="button-fetch-journal-chart"
                  >
                    {journalChartLoading ? (
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Chart Mode Toggle + Chart Container */}
          <div className="flex-1 relative flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-0">
            {/* Mode Toggle Buttons (hidden) */}
            <div className="hidden flex items-center justify-start px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setJournalChartMode("search")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    journalChartMode === "search"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                  data-testid="button-chart-mode-search"
                >
                  <Search className="w-3 h-3 inline mr-1" />
                  Search
                </button>
                <button
                  onClick={() => setJournalChartMode("heatmap")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    journalChartMode === "heatmap"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                  data-testid="button-chart-mode-heatmap"
                >
                  <CalendarDays className="w-3 h-3 inline mr-1" />
                  Heatmap
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {journalChartMode === "search" ? (
                  <span>
                    Manual:{" "}
                    {selectedJournalSymbol
                      .replace("NSE:", "")
                      .replace("-INDEX", "")
                      .replace("-EQ", "") || "Select symbol"}
                  </span>
                ) : (
                  <span>
                    Date: {heatmapSelectedDate || "Select date"} |{" "}
                    {(() => {
                      const sym = heatmapSelectedSymbol
                        .replace("NSE:", "")
                        .replace("-INDEX", "")
                        .replace("-EQ", "");
                      const parts = sym.split(" ");
                      if (parts.length > 1) {
                        const underlying = parts[0];
                        if (underlying === "NIFTY") return "NIFTY50";
                        if (underlying === "FINNIFTY") return "NIFTYFIN";
                        if (
                          [
                            "SENSEX",
                            "BANKNIFTY",
                            "FINNIFTY",
                            "MIDCPNIFTY",
                          ].includes(underlying)
                        )
                          return underlying;
                      }
                      return sym || "No symbol";
                    })()}
                  </span>
                )}
              </div>
            </div>

            {/* ========== SEARCH CHART (Manual Symbol Search) ========== */}
            <div
              className={`flex-1 relative overflow-hidden ${journalChartMode === "search" ? "flex flex-col" : "hidden"}`}
            >
              {journalChartLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 rounded-lg">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 border-4 border-blue-500/20 rounded-full" />
                      <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Loading {getJournalTimeframeLabel(journalChartTimeframe)} chart...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Chart OHLC Display */}
              {hoveredCandleOhlc &&
                journalChartData &&
                journalChartData.length > 0 && (
                  <div
                    className="absolute top-1 left-2 z-40 flex items-center gap-1 text-xs font-mono pointer-events-none"
                    data-testid="search-chart-ohlc-display"
                  >
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      O
                      {hoveredCandleOhlc.open.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      H
                      {hoveredCandleOhlc.high.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      L
                      {hoveredCandleOhlc.low.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`font-medium ${hoveredCandleOhlc.close >= hoveredCandleOhlc.open ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      C
                      {hoveredCandleOhlc.close.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`font-medium ${hoveredCandleOhlc.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {hoveredCandleOhlc.change >= 0 ? "+" : ""}
                      {hoveredCandleOhlc.change.toFixed(2)}
                    </span>
                    <span
                      className={`font-medium ${hoveredCandleOhlc.changePercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      ({hoveredCandleOhlc.changePercent >= 0 ? "+" : ""}
                      {hoveredCandleOhlc.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}

              {/* Search Chart Container */}
              <div
                ref={journalChartContainerRef}
                className="flex-1 w-full relative bg-white dark:bg-gray-800"
                data-testid="search-chart-container"
              />

              {/* Search Chart - No Data Message */}
              {(!journalChartData || journalChartData.length === 0) &&
                !journalChartLoading && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Search className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                        Search Mode
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        Select a symbol and fetch to view chart
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* ========== HEATMAP CHART (Date Selection from Calendar) ========== */}
            <div
              className={`flex-1 relative overflow-hidden ${journalChartMode === "heatmap" ? "flex flex-col" : "hidden"}`}
            >
              {heatmapChartLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 rounded-lg">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 border-4 border-purple-500/20 rounded-full" />
                      <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-purple-500 border-r-purple-500 rounded-full animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Loading heatmap chart...
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Fetching {heatmapSelectedDate} data
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Heatmap Chart OHLC Display */}
              {heatmapHoveredOhlc &&
                heatmapChartData &&
                heatmapChartData.length > 0 && (
                  <div
                    className="absolute top-1 left-2 z-40 flex items-center gap-1 text-xs font-mono pointer-events-none"
                    data-testid="heatmap-chart-ohlc-display"
                  >
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      O
                      {heatmapHoveredOhlc.open.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      H
                      {heatmapHoveredOhlc.high.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      L
                      {heatmapHoveredOhlc.low.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`font-medium ${heatmapHoveredOhlc.close >= heatmapHoveredOhlc.open ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      C
                      {heatmapHoveredOhlc.close.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span
                      className={`font-medium ${heatmapHoveredOhlc.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {heatmapHoveredOhlc.change >= 0 ? "+" : ""}
                      {heatmapHoveredOhlc.change.toFixed(2)}
                    </span>
                    <span
                      className={`font-medium ${heatmapHoveredOhlc.changePercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      ({heatmapHoveredOhlc.changePercent >= 0 ? "+" : ""}
                      {heatmapHoveredOhlc.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}

              {/* Heatmap Chart Container */}
              <div
                ref={heatmapChartContainerRef}
                className="flex-1 w-full relative bg-white dark:bg-gray-800"
                data-testid="heatmap-chart-container"
              />

              {/* Heatmap Chart - No Data Message */}
              {(!heatmapChartData || heatmapChartData.length === 0) &&
                !heatmapChartLoading && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <CalendarDays className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                        Heatmap Mode
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        Select a date from the heatmap calendar
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
