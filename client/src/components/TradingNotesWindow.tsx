import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Newspaper,
  Activity,
  BarChart3,
  Brain,
  Trash2,
  X,
  Plus,
  Edit,
  Check,
  Loader2,
} from "lucide-react";

// ─── Data structures ───────────────────────────────────────────────────────

const dailyFactorsSystem = {
  financial: {
    name: "Financial",
    color: "amber",
    maxSelections: 3,
    tags: [
      "debt",
      "money shortage",
      "total risk high",
      "borrowed money",
      "unexpected expense",
      "loan pressure",
    ],
  },
  physical: {
    name: "Physical & Sleep",
    color: "orange",
    maxSelections: 3,
    tags: [
      "poor sleep",
      "exhausted",
      "hungry",
      "sick",
      "hangover",
      "jet lag",
    ],
  },
  stress: {
    name: "Work & Stress",
    color: "red",
    maxSelections: 3,
    tags: [
      "work stress",
      "family tension",
      "relationship issues",
      "health anxiety",
      "deadline pressure",
      "personal crisis",
    ],
  },
  distraction: {
    name: "Distraction & Calls",
    color: "yellow",
    maxSelections: 3,
    tags: [
      "telegram calls",
      "youtube calls",
      "social media",
      "whatsapp messages",
      "family calls",
      "others suggestions",
    ],
  },
};

const tradingTagSystem = {
  psychology: {
    name: "Psychology",
    color: "red",
    maxSelections: 2,
    tags: [
      "fomo",
      "greedy",
      "overtrading",
      "hero zero",
      "fear",
      "euphoric",
      "revenge trading",
      "disciplined",
      "patient",
      "confident",
      "anxious",
      "impulsive",
    ],
  },
  strategy: {
    name: "Strategy",
    color: "blue",
    maxSelections: 2,
    tags: [
      "planned",
      "unplanned",
      "scalping",
      "swing trading",
      "intraday",
      "position",
      "btst",
      "breakout",
      "trend following",
      "counter trend",
      "momentum",
      "mean reversion",
    ],
  },
  market: {
    name: "Market Conditions",
    color: "green",
    maxSelections: 2,
    tags: [
      "trending",
      "sideways",
      "volatile",
      "low volume",
      "high volume",
      "news driven",
      "technical setup",
      "gap up",
      "gap down",
      "pre market",
      "post market",
      "expiry day",
    ],
  },
  timeframe: {
    name: "Timeframe",
    color: "purple",
    maxSelections: 1,
    tags: ["short terms", "intraday", "swing", "investment", "long term"],
  },
  setup: {
    name: "Trade Setup",
    color: "orange",
    maxSelections: 2,
    tags: [
      "no setup",
      "blind trades",
      "technical analysis",
      "fundamental analysis",
      "news based",
      "price action",
      "indicator based",
      "pattern based",
    ],
  },
};

const tagValidationRules = {
  conflictingTags: [
    ["planned", "unplanned", "no setup"],
    ["fomo", "disciplined", "patient"],
    ["patient", "impulsive"],
    ["trending", "sideways"],
    ["gap up", "gap down"],
    ["disciplined", "blind trades"],
    ["technical analysis", "blind trades", "no setup"],
  ],
  maxTotalTags: 8,
  minRequiredTags: 0,
};

const indicatorList = [
  "Moving Average",
  "EMA",
  "MACD",
  "RSI",
  "Stochastic",
  "Bollinger Bands",
  "ATR",
  "Volume",
  "ADX",
  "Ichimoku",
  "Fibonacci",
  "Pivot Points",
  "Price Action",
];

const timeframeOptions = [
  { value: "1min", label: "1 Min" },
  { value: "5min", label: "5 Min" },
  { value: "15min", label: "15 Min" },
  { value: "30min", label: "30 Min" },
  { value: "1h", label: "1 Hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

// ─── Types ─────────────────────────────────────────────────────────────────

interface PerformanceMetrics {
  totalTrades: number;
  winRate: string | number;
  netPnL: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
}

interface Nifty50NewsItem {
  title: string;
  url: string;
  description?: string;
  source: string;
  publishedAt: string;
  symbol: string;
  displayName: string;
}

interface JournalDateNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface TradingNotesWindowProps {
  // Date
  selectedDate: Date | null;
  formatDateKey: (date: Date) => string;

  // Notes state
  notesContent: string;
  setNotesContent: (v: string) => void;
  tempNotesContent: string;
  setTempNotesContent: (v: string) => void;
  isEditingNotes: boolean;
  setIsEditingNotes: (v: boolean) => void;

  // Tags state
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  isTagDropdownOpen: boolean;
  setIsTagDropdownOpen: (v: boolean) => void;

  // Daily factors state
  selectedDailyFactors: string[];
  setSelectedDailyFactors: React.Dispatch<React.SetStateAction<string[]>>;
  isDailyFactorsDropdownOpen: boolean;
  setIsDailyFactorsDropdownOpen: (v: boolean) => void;

  // News state
  isNotesInNewsMode: boolean;
  setIsNotesInNewsMode: (v: boolean) => void;
  journalDateNews: JournalDateNewsItem[];
  isJournalDateNewsLoading: boolean;
  nifty50NewsItems: Nifty50NewsItem[];
  isNifty50NewsLoading: boolean;
  getWatchlistNewsRelativeTime: (publishedAt: string) => string;

  // Indicators state
  selectedIndicators: string[];
  setSelectedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  indicatorTimeframe: string;
  setIndicatorTimeframe: (v: string) => void;
  isIndicatorDropdownOpen: boolean;
  setIsIndicatorDropdownOpen: (v: boolean) => void;
  isCustomTimeframeDialogOpen: boolean;
  setIsCustomTimeframeDialogOpen: (v: boolean) => void;
  customTimeframeInput: string;
  setCustomTimeframeInput: (v: string) => void;

  // Performance metrics
  performanceMetrics: PerformanceMetrics;

  // Data
  tradingDataByDate: any;
  setTradingDataByDate: React.Dispatch<React.SetStateAction<any>>;

  // Mobile
  mobileJournalPanel: number;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TradingNotesWindow({
  selectedDate,
  formatDateKey,
  notesContent,
  setNotesContent,
  tempNotesContent,
  setTempNotesContent,
  isEditingNotes,
  setIsEditingNotes,
  selectedTags,
  setSelectedTags,
  isTagDropdownOpen,
  setIsTagDropdownOpen,
  selectedDailyFactors,
  setSelectedDailyFactors,
  isDailyFactorsDropdownOpen,
  setIsDailyFactorsDropdownOpen,
  isNotesInNewsMode,
  setIsNotesInNewsMode,
  journalDateNews,
  isJournalDateNewsLoading,
  nifty50NewsItems,
  isNifty50NewsLoading,
  getWatchlistNewsRelativeTime,
  selectedIndicators,
  setSelectedIndicators,
  indicatorTimeframe,
  setIndicatorTimeframe,
  isIndicatorDropdownOpen,
  setIsIndicatorDropdownOpen,
  isCustomTimeframeDialogOpen,
  setIsCustomTimeframeDialogOpen,
  customTimeframeInput,
  setCustomTimeframeInput,
  performanceMetrics,
  tradingDataByDate,
  setTradingDataByDate,
  mobileJournalPanel,
}: TradingNotesWindowProps) {

  // ─── Helpers ───────────────────────────────────────────────────────────

  const getAllTags = () =>
    Object.values(tradingTagSystem).flatMap((category) => category.tags);

  const getValidTags = (tags: string[]) => {
    const validTagsList = getAllTags();
    return tags.filter((tag) => validTagsList.includes(tag));
  };

  const getTagCategory = (tag: string) => {
    for (const [categoryKey, category] of Object.entries(tradingTagSystem)) {
      if (category.tags.includes(tag)) {
        return { key: categoryKey, ...category };
      }
    }
    return null;
  };

  // ─── Daily Factors handlers ────────────────────────────────────────────

  const toggleDailyFactor = (factor: string) => {
    setSelectedDailyFactors((prev) => {
      const updated = prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor];
      if (typeof window !== "undefined") {
        localStorage.setItem("tradingDailyFactors", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearAllDailyFactors = () => {
    setSelectedDailyFactors([]);
    if (typeof window !== "undefined") {
      localStorage.setItem("tradingDailyFactors", JSON.stringify([]));
    }
  };

  // ─── Indicator handlers ────────────────────────────────────────────────

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators((prev) => {
      const updated = prev.includes(indicator)
        ? prev.filter((i) => i !== indicator)
        : [...prev, indicator];
      if (typeof window !== "undefined") {
        localStorage.setItem("tradingIndicators", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearAllIndicators = () => {
    setSelectedIndicators([]);
    if (typeof window !== "undefined") {
      localStorage.setItem("tradingIndicators", JSON.stringify([]));
    }
  };

  // ─── Tag handlers ──────────────────────────────────────────────────────

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      const validTags = getValidTags(newTags);
      if (typeof window !== "undefined") {
        localStorage.setItem("tradingTags", JSON.stringify(validTags));
      }
      return validTags;
    });
  };

  const clearAllTags = () => {
    setSelectedTags([]);
    setSelectedDailyFactors([]);
    setSelectedIndicators([]);
  };

  const toggleTagWithValidation = (tag: string) => {
    const validCurrentTags = getValidTags(selectedTags);
    const newTags = validCurrentTags.includes(tag)
      ? validCurrentTags.filter((t) => t !== tag)
      : [...validCurrentTags, tag];

    if (!validCurrentTags.includes(tag)) {
      if (newTags.length > tagValidationRules.maxTotalTags) {
        alert(`Maximum ${tagValidationRules.maxTotalTags} tags allowed`);
        return;
      }
      const tagCategory = getTagCategory(tag);
      if (tagCategory) {
        const categoryTags = newTags.filter((t) =>
          tagCategory.tags.includes(t),
        );
        if (categoryTags.length > tagCategory.maxSelections) {
          alert(
            `Maximum ${tagCategory.maxSelections} ${tagCategory.name.toLowerCase()} tags allowed`,
          );
          return;
        }
      }
    }

    const validTags = getValidTags(newTags);
    setSelectedTags(validTags);
    localStorage.setItem("tradingTags", JSON.stringify(validTags));
  };

  // ─── Notes handlers ────────────────────────────────────────────────────

  const handleEditNotes = () => {
    setTempNotesContent(notesContent);
    setIsEditingNotes(true);
  };

  const handleSaveNotesOnly = async () => {
    try {
      setNotesContent(tempNotesContent);
      setIsEditingNotes(false);

      const selectedDateStr = formatDateKey(selectedDate!);
      const existingData = tradingDataByDate[selectedDateStr] || {};

      const updatedData = {
        ...existingData,
        tradingNotes: tempNotesContent,
        selectedDailyFactors: selectedDailyFactors,
        selectedIndicators: selectedIndicators,
        selectedTags: getValidTags(selectedTags),
      };

      const response = await fetch(`/api/journal/${selectedDateStr}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        console.log("✅ Notes saved successfully");
        setTradingDataByDate((prev: any) => ({
          ...prev,
          [selectedDateStr]: updatedData,
        }));
      } else {
        console.error("❌ Failed to save notes");
      }
    } catch (error) {
      console.error("❌ Error saving notes:", error);
    }
  };

  const handleCancelNotes = () => {
    setTempNotesContent(notesContent);
    setIsEditingNotes(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <Card
      className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-[300px] sm:h-[380px] md:h-[400px] flex flex-col ${mobileJournalPanel === 2 ? "block" : "hidden"} md:block`}
    >
      {/* Top 30% - Performance Insights */}
      <div className="h-[30%] border-b border-gray-200 dark:border-gray-700">
        <CardContent className="p-2 h-full">
          <div className="flex items-start justify-between px-2">
            <div className="text-left">
              <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-medium">
                Total Trades
              </p>
              <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">
                {performanceMetrics.totalTrades}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-medium">
                Win Rate
              </p>
              <p className="text-sm font-bold text-green-600 mt-0.5">
                {performanceMetrics.winRate}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-medium">
                Net P&L
              </p>
              <p
                className={`text-sm font-bold mt-0.5 ${
                  performanceMetrics.netPnL >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ₹
                {performanceMetrics.netPnL.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="space-y-0.5 bg-white dark:bg-gray-900/50 rounded-lg p-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Winning:
                </span>
                <span className="text-green-600 font-medium">
                  {performanceMetrics.winningTrades}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Profit:
                </span>
                <span className="text-green-600 font-medium">
                  ₹
                  {performanceMetrics.totalProfit.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="space-y-0.5 bg-white dark:bg-gray-900/50 rounded-lg p-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Losing:
                </span>
                <span className="text-red-600 font-medium">
                  {performanceMetrics.losingTrades}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Loss:
                </span>
                <span className="text-red-600 font-medium">
                  ₹
                  {performanceMetrics.totalLoss.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Bottom 70% - Notes Section */}
      <div className="h-[70%] flex flex-col">
        <CardContent className="p-2 flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
              {isNotesInNewsMode ? "NEWS" : "TRADING NOTES"}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsNotesInNewsMode(!isNotesInNewsMode)}
                data-testid="button-trading-news"
              >
                <Newspaper className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              </Button>

              {/* Daily Life Factors Dropdown */}
              <Popover
                open={isDailyFactorsDropdownOpen}
                onOpenChange={setIsDailyFactorsDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-testid="button-daily-factors-dropdown"
                  >
                    <Activity className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-start">
                      <h4 className="font-medium text-sm">
                        Daily Life Factors
                      </h4>
                      {selectedDailyFactors.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllDailyFactors}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          data-testid="button-clear-daily-factors"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Selected Factors Display */}
                    {selectedDailyFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                        {selectedDailyFactors.map((factor) => (
                          <span
                            key={factor}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                            onClick={() => toggleDailyFactor(factor)}
                            data-testid={`selected-daily-factor-${factor}`}
                          >
                            {factor}
                            <X className="w-3 h-3 ml-1" />
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Available Factors by Category */}
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-thin-scrollbar">
                      {Object.entries(dailyFactorsSystem).map(
                        ([categoryKey, category]) => (
                          <div key={categoryKey} className="space-y-2">
                            <div className="flex items-center justify-start">
                              <h5
                                className={`text-xs font-semibold text-${category.color}-600 dark:text-${category.color}-400`}
                              >
                                {category.name}
                              </h5>
                              <span className="text-xs text-gray-500">
                                {
                                  selectedDailyFactors.filter((f) =>
                                    category.tags.includes(f),
                                  ).length
                                }
                                /{category.maxSelections}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {category.tags.map((factor) => {
                                const isSelected =
                                  selectedDailyFactors.includes(factor);
                                const categoryCount =
                                  selectedDailyFactors.filter((f) =>
                                    category.tags.includes(f),
                                  ).length;
                                const isDisabled =
                                  !isSelected &&
                                  categoryCount >= category.maxSelections;

                                return (
                                  <button
                                    key={factor}
                                    onClick={() => toggleDailyFactor(factor)}
                                    disabled={isDisabled}
                                    className={`
                                      px-2 py-1.5 text-xs rounded-md border transition-all duration-200 text-left
                                      ${
                                        isSelected
                                          ? `bg-${category.color}-500 text-white border-${category.color}-500 hover:bg-${category.color}-600`
                                          : isDisabled
                                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                      }
                                    `}
                                    data-testid={`daily-factor-option-${factor}`}
                                  >
                                    {factor}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Indicators Dropdown */}
              <Popover
                open={isIndicatorDropdownOpen}
                onOpenChange={setIsIndicatorDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-testid="button-indicators-dropdown"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-start">
                      <h4 className="font-medium text-sm">
                        Indicator & Timeframe Tracker
                      </h4>
                      {selectedIndicators.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllIndicators}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          data-testid="button-clear-indicators"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Timeframe Selector */}
                    <div className="space-y-1 bg-white dark:bg-gray-900/50 rounded-lg p-3">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Timeframe
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {timeframeOptions.map((tf) => (
                          <button
                            key={tf.value}
                            onClick={() => {
                              setIndicatorTimeframe(tf.value);
                              if (typeof window !== "undefined") {
                                localStorage.setItem("indicatorTimeframe", tf.value);
                              }
                            }}
                            className={`px-2 py-1.5 text-xs rounded-md border transition-all duration-200 ${
                              indicatorTimeframe === tf.value
                                ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                            data-testid={`timeframe-${tf.value}`}
                          >
                            {tf.label}
                          </button>
                        ))}
                        {/* Display custom timeframe if selected */}
                        {!timeframeOptions.some((tf) => tf.value === indicatorTimeframe) && (
                          <button
                            onClick={() => {}}
                            className="px-2 py-1.5 text-xs rounded-md border bg-emerald-500 text-white border-emerald-500 transition-all duration-200 relative group"
                            data-testid={`timeframe-custom-${indicatorTimeframe}`}
                            title={`Custom: ${indicatorTimeframe}`}
                          >
                            <span className="truncate">{indicatorTimeframe}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIndicatorTimeframe("5min");
                                localStorage.setItem("indicatorTimeframe", "5min");
                              }}
                              className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid="button-remove-custom-timeframe"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </button>
                        )}
                        <Dialog open={isCustomTimeframeDialogOpen} onOpenChange={setIsCustomTimeframeDialogOpen}>
                          <DialogTrigger asChild>
                            <button
                              className="px-2 py-1.5 text-xs rounded-md border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                              data-testid="button-add-custom-timeframe"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] sm:max-w-[300px] rounded-2xl max-h-[90dvh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Custom Timeframe</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-1">
                              <input
                                type="text"
                                placeholder="e.g., 2h, 4h, 3d, 1w"
                                value={customTimeframeInput}
                                onChange={(e) => setCustomTimeframeInput(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                                data-testid="input-custom-timeframe"
                              />
                              <div className="flex gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCustomTimeframeInput("");
                                    setIsCustomTimeframeDialogOpen(false);
                                  }}
                                  className="flex-1 text-xs"
                                  data-testid="button-cancel-custom-timeframe"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (customTimeframeInput.trim()) {
                                      setIndicatorTimeframe(customTimeframeInput.trim());
                                      if (typeof window !== "undefined") {
                                        localStorage.setItem("indicatorTimeframe", customTimeframeInput.trim());
                                      }
                                      setCustomTimeframeInput("");
                                      setIsCustomTimeframeDialogOpen(false);
                                    }
                                  }}
                                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  data-testid="button-confirm-custom-timeframe"
                                >
                                  Apply
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Selected Indicators Display */}
                    {selectedIndicators.length > 0 && (
                      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                        {selectedIndicators.map((indicator) => (
                          <span
                            key={indicator}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                            onClick={() => toggleIndicator(indicator)}
                            data-testid={`selected-indicator-${indicator}`}
                          >
                            {indicator}
                            <X className="w-3 h-3 ml-1" />
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Available Indicators Grid */}
                    <div className="grid grid-cols-2 gap-1">
                      {indicatorList.map((indicator) => {
                        const isSelected = selectedIndicators.includes(indicator);
                        return (
                          <button
                            key={indicator}
                            onClick={() => toggleIndicator(indicator)}
                            className={`px-2 py-1.5 text-xs rounded-md border transition-all duration-200 text-left ${
                              isSelected
                                ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                            data-testid={`indicator-option-${indicator}`}
                          >
                            {indicator}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Tag Dropdown */}
              <Popover
                open={isTagDropdownOpen}
                onOpenChange={setIsTagDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-testid="button-tags-dropdown"
                  >
                    <Brain className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-start">
                      <h4 className="font-medium text-sm">
                        Trading Psychology & Strategy Tags
                      </h4>
                      {selectedTags.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllTags}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          data-testid="button-clear-tags"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Selected Tags Display */}
                    {getValidTags(selectedTags).length > 0 && (
                      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                        {getValidTags(selectedTags).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                            onClick={() => toggleTag(tag)}
                            data-testid={`selected-tag-${tag}`}
                          >
                            {tag}
                            <X className="w-3 h-3 ml-1" />
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Available Tags by Category */}
                    <div className="space-y-4 max-h-96 overflow-y-auto custom-thin-scrollbar">
                      {Object.entries(tradingTagSystem).map(
                        ([categoryKey, category]) => (
                          <div key={categoryKey} className="space-y-2">
                            <div className="flex items-center justify-start">
                              <h5
                                className={`text-xs font-semibold text-${category.color}-600 dark:text-${category.color}-400`}
                              >
                                {category.name}
                                {(category as any).required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </h5>
                              <span className="text-xs text-gray-500">
                                {
                                  selectedTags.filter((tag) =>
                                    category.tags.includes(tag),
                                  ).length
                                }
                                /{category.maxSelections}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {category.tags.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                const categoryCount = selectedTags.filter(
                                  (t) => category.tags.includes(t),
                                ).length;
                                const isDisabled =
                                  !isSelected &&
                                  categoryCount >= category.maxSelections;

                                return (
                                  <button
                                    key={tag}
                                    onClick={() =>
                                      toggleTagWithValidation(tag)
                                    }
                                    disabled={isDisabled}
                                    className={`
                                      px-2 py-1.5 text-xs rounded-md border transition-all duration-200 text-left
                                      ${
                                        isSelected
                                          ? `bg-${category.color}-500 text-white border-${category.color}-500 hover:bg-${category.color}-600`
                                          : isDisabled
                                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                      }
                                    `}
                                    data-testid={`tag-option-${tag}`}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {isEditingNotes ? (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancelNotes}
                    className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    data-testid="button-cancel-notes"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSaveNotesOnly}
                    className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-save-notes"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => !isNotesInNewsMode && handleEditNotes()}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-slate-900 dark:hover:text-white"
                  data-testid="button-edit-notes"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {isEditingNotes ? (
            <textarea
              value={tempNotesContent}
              onChange={(e) => setTempNotesContent(e.target.value)}
              placeholder="Write your trading notes, strategies, observations..."
              className="flex-1 w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="textarea-notes"
            />
          ) : (
            <div className="flex-1 w-full p-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-white overflow-y-auto custom-thin-scrollbar">
              {/* Display daily factors inline when they exist */}
              {selectedDailyFactors.length > 0 && (
                <div className="mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {selectedDailyFactors.map((factor) => (
                      <span
                        key={factor}
                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors group"
                        onClick={() => toggleDailyFactor(factor)}
                        title="Click to remove daily factor"
                        data-testid={`inline-daily-factor-${factor}`}
                      >
                        {factor}
                        <X className="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Display indicators inline when they exist */}
              {selectedIndicators.length > 0 && (
                <div className="mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {selectedIndicators.map((indicator) => (
                      <span
                        key={indicator}
                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-full cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors group"
                        onClick={() => toggleIndicator(indicator)}
                        title="Click to remove indicator"
                        data-testid={`inline-indicator-${indicator}`}
                      >
                        {indicator}
                        <X className="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Display tags inline when they exist */}
              {getValidTags(selectedTags).length > 0 && (
                <div className="mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {getValidTags(selectedTags).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors group"
                        onClick={() => toggleTag(tag)}
                        title="Click to remove tag"
                        data-testid={`inline-tag-${tag}`}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1 opacity-60 group-hover:opacity-100" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* News or Notes content */}
              {isNotesInNewsMode ? (
                <div className="flex-1 overflow-y-auto custom-thin-scrollbar">
                  {selectedDate ? (
                    /* Date-specific news fetched from Google News RSS */
                    (() => {
                      const from = new Date(selectedDate); from.setDate(from.getDate() - 3);
                      const to   = new Date(selectedDate); to.setDate(to.getDate() + 3);
                      const fmt  = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                      const rangeLabel = `${fmt(from)} – ${fmt(to)}`;
                      return (
                        <>
                          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">{rangeLabel}</span>
                            <span className="text-[9px] text-indigo-400 font-medium">±3 days</span>
                          </div>
                          {isJournalDateNewsLoading ? (
                            <div className="flex items-center justify-center h-16">
                              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            </div>
                          ) : journalDateNews.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {journalDateNews.map((news, idx) => (
                                <div
                                  key={`${news.url}-${idx}`}
                                  className="py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                  onClick={() => window.open(news.url, '_blank', 'noopener,noreferrer')}
                                >
                                  <p className="text-[10px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight mb-0.5">{news.title}</p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-semibold text-indigo-500 dark:text-indigo-400 shrink-0">{news.source}</span>
                                    <span className="text-[9px] text-slate-400 shrink-0">{getWatchlistNewsRelativeTime(news.publishedAt)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic text-center text-xs mt-4">No news found for this period.</p>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    /* Default: last 7 days from cached Nifty50 news */
                    (() => {
                      const now = new Date();
                      const toDate = new Date(now); toDate.setHours(23,59,59,999);
                      const fromDate = new Date(now); fromDate.setDate(fromDate.getDate() - 7); fromDate.setHours(0,0,0,0);
                      const filtered = nifty50NewsItems.filter(n => {
                        const t = new Date(n.publishedAt).getTime();
                        return t >= fromDate.getTime() && t <= toDate.getTime();
                      });
                      return (
                        <>
                          <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Last 7 days</span>
                          </div>
                          {isNifty50NewsLoading && filtered.length === 0 ? (
                            <div className="flex items-center justify-center h-16">
                              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            </div>
                          ) : filtered.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {filtered.map((news, idx) => (
                                <div
                                  key={`${news.url}-${idx}`}
                                  className="py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                  onClick={() => window.open(news.url, '_blank', 'noopener,noreferrer')}
                                >
                                  <p className="text-[10px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight mb-0.5">{news.title}</p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-semibold text-indigo-500 dark:text-indigo-400 shrink-0">{news.displayName}</span>
                                    <span className="text-[9px] text-slate-400 shrink-0">{getWatchlistNewsRelativeTime(news.publishedAt)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic text-center text-xs mt-4">No news for this period.</p>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
              ) : (
                <>
                  {notesContent ? (
                    <pre className="font-sans text-xs overflow-y-auto flex-1 whitespace-pre">
                      {notesContent}
                    </pre>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      No trading notes yet. Click Edit to add your first note.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
