import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Users,
  BarChart3,
  Target,
  TrendingUp,
  Calendar,
  Tag,
  ShieldCheck,
  Home as HomeIcon,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Line,
  ReferenceLine,
} from "recharts";
import { JournalChartWindow } from "@/components/JournalChartWindow";
import {
  MultipleImageUpload,
  MultipleImageUploadRef,
} from "@/components/multiple-image-upload";
import { TradingNotesWindow } from "@/components/TradingNotesWindow";
import TradeHistoryPanel from "@/components/TradeHistoryPanel";
import { ConnectBrokerDialog } from "@/components/connect-broker-dialog";
import { TradeBook } from "@/components/tradebook";
import { PerformanceTrendChart } from "@/components/PerformanceTrendChart";
import { TradeDurationAnalysis } from "./trade-duration";
import { FundsAnalysis } from "./fund";
import LossMakingAnalysisPanel from "@/components/LossMakingAnalysisPanel";
import { DisciplineRiskPanel } from "@/components/DisciplineRiskPanel";
import { PaperTradingMobileTab } from "@/components/PaperTradingMobileTab";
import { useLocation } from "wouter";

export interface JournalTabContentProps {
  // Navigation
  setTabWithAuthCheck: (tab: string) => void;
  mobileBottomTab: string;
  setMobileBottomTab: (tab: string) => void;
  mobileJournalPanel: number;
  setMobileJournalPanel: React.Dispatch<React.SetStateAction<number>>;

  // JournalChartWindow props
  showStockSearch: any;
  setShowStockSearch: any;
  selectedJournalSymbol: any;
  setSelectedJournalSymbol: any;
  setSelectedJournalInterval: any;
  stockSearchQuery: any;
  setStockSearchQuery: any;
  journalSearchType: any;
  setJournalSearchType: any;
  selectedInstrumentCategory: any;
  setSelectedInstrumentCategory: any;
  tradedSymbols: any;
  currentSymbolIndex: any;
  setCurrentSymbolIndex: any;
  tradingDataByDate: any;
  setTradingDataByDate: any;
  journalChartMode: any;
  setJournalChartMode: any;
  showJournalTimeframeDropdown: any;
  setShowJournalTimeframeDropdown: any;
  showHeatmapTimeframeDropdown: any;
  setShowHeatmapTimeframeDropdown: any;
  journalChartTimeframe: any;
  setJournalChartTimeframe: any;
  heatmapChartTimeframe: any;
  setHeatmapChartTimeframe: any;
  heatmapSelectedSymbol: any;
  heatmapChartData: any;
  setHeatmapChartData: any;
  heatmapSelectedDate: any;
  heatmapChartRef: any;
  heatmapCandlestickSeriesRef: any;
  heatmapEma12SeriesRef: any;
  heatmapEma26SeriesRef: any;
  setHeatmapHoveredOhlc: any;
  fetchHeatmapChartData: any;
  journalChartData: any;
  journalChartLoading: any;
  hoveredCandleOhlc: any;
  heatmapChartLoading: any;
  heatmapHoveredOhlc: any;
  journalChartContainerRef: any;
  heatmapChartContainerRef: any;
  getJournalTimeframeLabel: any;
  fetchJournalChartData: any;
  journalTimeframeOptions: any;
  searchedInstruments: any;
  setSearchedInstruments: any;
  isSearchingInstruments: any;
  selectedInstrument: any;
  setSelectedInstrument: any;
  selectedInstrumentToken: any;
  setSelectedInstrumentToken: any;
  defaultInstruments: any;
  categorySearchSuggestions: any;

  // MultipleImageUpload
  imageUploadRef: React.RefObject<MultipleImageUploadRef>;
  tradingImages: any;
  setTradingImages: any;

  // TradingNotesWindow
  selectedDate: any;
  formatDateKey: any;
  notesContent: any;
  setNotesContent: any;
  tempNotesContent: any;
  setTempNotesContent: any;
  isEditingNotes: any;
  setIsEditingNotes: any;
  selectedTags: any;
  setSelectedTags: any;
  isTagDropdownOpen: any;
  setIsTagDropdownOpen: any;
  selectedDailyFactors: any;
  setSelectedDailyFactors: any;
  isDailyFactorsDropdownOpen: any;
  setIsDailyFactorsDropdownOpen: any;
  isNotesInNewsMode: any;
  setIsNotesInNewsMode: any;
  journalDateNews: any;
  isJournalDateNewsLoading: any;
  nifty50NewsItems: any;
  isNifty50NewsLoading: any;
  getWatchlistNewsRelativeTime: any;
  selectedIndicators: any;
  setSelectedIndicators: any;
  indicatorTimeframe: any;
  setIndicatorTimeframe: any;
  isIndicatorDropdownOpen: any;
  setIsIndicatorDropdownOpen: any;
  isCustomTimeframeDialogOpen: any;
  setIsCustomTimeframeDialogOpen: any;
  customTimeframeInput: any;
  setCustomTimeframeInput: any;
  performanceMetrics: any;

  // TradeHistoryPanel
  showMobileTradeHistory: any;
  setShowMobileTradeHistory: any;
  tradeHistoryWindow: any;
  setTradeHistoryWindow: any;
  tradeHistoryData: any;
  tradeHistoryData2: any;
  zerodhaIsConnected: any;
  upstoxIsConnected: any;
  angelOneIsConnected: any;
  userAngelOneIsConnected: any;
  dhanIsConnected: any;
  deltaExchangeIsConnected: any;
  fyersIsConnected: any;
  growwIsConnected: any;
  secondaryBroker: any;
  setShowConnectDialog: any;
  setShowOrderModal: any;
  setShowSecondaryOrderModal: any;
  setShowImportModal: any;
  setShowPaperTradingModal: any;
  setShowTradingChallengeModal: any;
  setShowJournalInfoModal: any;
  isLoadingHeatmapData: any;
  isDemoMode: any;

  // ConnectBrokerDialog
  showConnectDialog: any;
  showDeltaExchange: any;
  setShowDeltaExchange: any;
  connectedBrokersCount: any;
  setZerodhaAccessToken: any;
  setZerodhaIsConnected: any;
  upstoxAccessToken: any;
  setUpstoxAccessToken: any;
  setUpstoxIsConnected: any;
  setUserAngelOneToken: any;
  setUserAngelOneIsConnected: any;
  setUserAngelOneName: any;
  setDhanAccessToken: any;
  setDhanIsConnected: any;
  setDhanClientName: any;
  setGrowwIsConnected: any;
  setGrowwAccessToken: any;
  setGrowwUserId: any;
  setGrowwUserName: any;
  setBrokerFunds: any;
  setDeltaExchangeIsConnected: any;
  deltaExchangeApiKey: any;
  setDeltaExchangeApiKey: any;
  deltaExchangeApiSecret: any;
  setDeltaExchangeApiSecret: any;
  setDeltaExchangeUserId: any;
  setDeltaExchangeAccountName: any;
  isUpstoxDialogOpen: any;
  setIsUpstoxDialogOpen: any;
  upstoxApiKeyInput: any;
  setUpstoxApiKeyInput: any;
  upstoxApiSecretInput: any;
  setUpstoxApiSecretInput: any;
  showUpstoxSecret: any;
  setShowUpstoxSecret: any;
  isAngelOneDialogOpen: any;
  setIsAngelOneDialogOpen: any;
  angelOneClientCodeInput: any;
  setAngelOneClientCodeInput: any;
  angelOneApiKeyInput: any;
  setAngelOneApiKeyInput: any;
  showAngelOneSecret: any;
  setShowAngelOneSecret: any;
  angelOnePinInput: any;
  setAngelOnePinInput: any;
  showAngelOnePin: any;
  setShowAngelOnePin: any;
  angelOneTotpInput: any;
  setAngelOneTotpInput: any;
  showAngelOneTotp: any;
  setShowAngelOneTotp: any;
  isDhanDialogOpen: any;
  setIsDhanDialogOpen: any;
  dhanClientIdInput: any;
  setDhanClientIdInput: any;
  dhanTokenInput: any;
  setDhanTokenInput: any;
  showDhanToken: any;
  setShowDhanToken: any;
  isGrowwDialogOpen: any;
  setIsGrowwDialogOpen: any;
  growwApiKeyInput: any;
  setGrowwApiKeyInput: any;
  growwApiSecretInput: any;
  setGrowwApiSecretInput: any;
  showGrowwSecret: any;
  setShowGrowwSecret: any;
  isGrowwConnecting: any;
  setIsGrowwConnecting: any;
  isFyersDialogOpen: any;
  setIsFyersDialogOpen: any;
  fyersAppId: any;
  setFyersAppId: any;
  fyersSecretId: any;
  setFyersSecretId: any;
  isDeltaExchangeDialogOpen: any;
  setIsDeltaExchangeDialogOpen: any;
  showDeltaSecret: any;
  setShowDeltaSecret: any;
  deltaWhitelistedIP: any;
  isZerodhaDialogOpen: any;
  setIsZerodhaDialogOpen: any;
  zerodhaApiKeyInput: any;
  setZerodhaApiKeyInput: any;
  zerodhaApiSecretInput: any;
  setZerodhaApiSecretInput: any;
  showZerodhaSecret: any;
  setShowZerodhaSecret: any;
  handleZerodhaConnect: any;
  submitZerodhaCredentials: any;
  handleUpstoxConnect: any;
  handleUpstoxDisconnect: any;
  handleUserAngelOneConnect: any;
  handleUserAngelOneDisconnect: any;
  handleDhanConnect: any;
  submitDhanCredentials: any;
  handleGrowwConnect: any;
  submitGrowwCredentials: any;
  handleGrowwDisconnect: any;
  handleDeltaExchangeConnect: any;
  handleDeltaExchangeDisconnect: any;

  // TradeBook
  heatmapMode: any;
  setHeatmapMode: any;
  heatmapContainerRef: any;
  handleDateSelect: any;
  handleHeatmapDataUpdate: any;
  handleDateRangeChange: any;
  activeTagHighlight: any;
  setActiveTagHighlight: any;
  personalHeatmapRevision: any;
  personal2HeatmapRevision: any;
  setPersonalHeatmapRevision: any;
  setPersonal2HeatmapRevision: any;
  saveAllTradingData: any;
  getUserId: any;
  setReportPostMode: any;
  setReportPostSelectedDate: any;
  setRangePostOverrideData: any;
  setShowReportPostDialog: any;
  setShowShareDialog: any;
  fomoButtonRef: any;
  overtradingButtonRef: any;
  plannedButtonRef: any;
  scrollTrigger: any;
  visibleStats: any;
  setVisibleStats: any;
  getFilteredHeatmapData: any;
  selectedAudioTrack: any;
  setSelectedAudioTrack: any;
  isAudioPlaying: any;
  setIsAudioPlaying: any;
  allAudioTracks: any;
  youtubePlayerRef: any;
  duration: any;
  currentTime: any;
  audioProgress: any;
  setCurrentTime: any;
  setAudioProgress: any;
  setHasManuallyToggledMode: any;
  setTradeHistoryData: any;
  setTradeHistoryData2: any;

  // Insights / analytics
  setSelectedDate: any;
  theme: any;
  targetPeriod: any;
  setTargetPeriod: any;
  targetAmount: any;
  setTargetAmount: any;
  prevProgressRef: any;
  isTortoiseFacingRightRef: any;
  selectedDateRange: any;
  riskCapital: any;
  setRiskCapital: any;
  riskRewardRatio: any;
  setRiskRewardRatio: any;

  // FundsAnalysis
  isConnected: any;
  totalBrokerFunds: any;
  allBrokerFunds: any;
  journalFundBase: any;
  setJournalFundBase: any;
  journalWalletUserId?: string | null;
  activeBroker: any;
  getBrokerDisplayName: any;
  brokerIconMap: any;

  // LossMakingAnalysisPanel
  formatDuration: any;

  // Mobile Pill Nav
  isNavVisible: boolean;
  navSparklineData: { trend: string; points: string };

  // Mobile Paper Trade
  paperTradingTotalPnl: any;
  paperTradingCapital: any;
  hidePositionDetails: any;
  setHidePositionDetails: any;
  paperPositions: any;
  paperTradeHistory: any;
  paperTradeSymbolSearch: any;
  setPaperTradeSymbolSearch: any;
  paperTradeSymbol: any;
  setPaperTradeSymbol: any;
  paperTradingEventSourcesRef: any;
  setPaperTradingWsStatus: any;
  setPaperTradeCurrentPrice: any;
  searchPaperTradingInstruments: any;
  setPaperTradeSearchResults: any;
  paperTradeSearchLoading: any;
  paperTradeSearchResults: any;
  setSelectedPaperTradingInstrument: any;
  fetchPaperTradePrice: any;
  paperTradeType: any;
  setPaperTradeType: any;
  setPaperTradeQuantity: any;
  setPaperTradeLotInput: any;
  setPaperTradeSLPrice: any;
  paperTradeQuantity: any;
  paperTradeLotInput: any;
  paperTradeCurrentPrice: any;
  paperTradePriceLoading: any;
  showMobilePaperTradeSLDropdown: any;
  setShowMobilePaperTradeSLDropdown: any;
  paperTradeSLEnabled: any;
  setPaperTradeSLEnabled: any;
  paperTradeSLPrice: any;
  paperTradeSLType: any;
  setPaperTradeSLType: any;
  paperTradeSLTimeframe: any;
  setPaperTradeSLTimeframe: any;
  paperTradeSLDurationUnit: any;
  setPaperTradeSLDurationUnit: any;
  paperTradeSLValue: any;
  setPaperTradeSLValue: any;
  setPaperTradeAction: any;
  executePaperTrade: any;
  fetchOptionChainData: any;
  setShowOptionChain: any;
  paperTradingWsStatus: any;
  recordAllPaperTrades: any;
  exitAllPaperPositions: any;
  swipeStartXRef: any;
  swipeStartYRef: any;
  swipedPositionId: any;
  setSwipedPositionId: any;
  exitPosition: any;
  resetPaperTradingAccount: any;
  toast: any;

  // Guest Dialog
  showGuestDialog: any;
  setShowGuestDialog: any;
}

export function JournalTabContent({
  setTabWithAuthCheck,
  mobileBottomTab,
  setMobileBottomTab,
  mobileJournalPanel,
  setMobileJournalPanel,
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
  setTradingDataByDate,
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
  imageUploadRef,
  tradingImages,
  setTradingImages,
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
  showConnectDialog,
  showDeltaExchange,
  setShowDeltaExchange,
  connectedBrokersCount,
  setZerodhaAccessToken,
  setZerodhaIsConnected,
  upstoxAccessToken,
  setUpstoxAccessToken,
  setUpstoxIsConnected,
  setUserAngelOneToken,
  setUserAngelOneIsConnected,
  setUserAngelOneName,
  setDhanAccessToken,
  setDhanIsConnected,
  setDhanClientName,
  setGrowwIsConnected,
  setGrowwAccessToken,
  setGrowwUserId,
  setGrowwUserName,
  setBrokerFunds,
  setDeltaExchangeIsConnected,
  deltaExchangeApiKey,
  setDeltaExchangeApiKey,
  deltaExchangeApiSecret,
  setDeltaExchangeApiSecret,
  setDeltaExchangeUserId,
  setDeltaExchangeAccountName,
  isUpstoxDialogOpen,
  setIsUpstoxDialogOpen,
  upstoxApiKeyInput,
  setUpstoxApiKeyInput,
  upstoxApiSecretInput,
  setUpstoxApiSecretInput,
  showUpstoxSecret,
  setShowUpstoxSecret,
  isAngelOneDialogOpen,
  setIsAngelOneDialogOpen,
  angelOneClientCodeInput,
  setAngelOneClientCodeInput,
  angelOneApiKeyInput,
  setAngelOneApiKeyInput,
  showAngelOneSecret,
  setShowAngelOneSecret,
  angelOnePinInput,
  setAngelOnePinInput,
  showAngelOnePin,
  setShowAngelOnePin,
  angelOneTotpInput,
  setAngelOneTotpInput,
  showAngelOneTotp,
  setShowAngelOneTotp,
  isDhanDialogOpen,
  setIsDhanDialogOpen,
  dhanClientIdInput,
  setDhanClientIdInput,
  dhanTokenInput,
  setDhanTokenInput,
  showDhanToken,
  setShowDhanToken,
  isGrowwDialogOpen,
  setIsGrowwDialogOpen,
  growwApiKeyInput,
  setGrowwApiKeyInput,
  growwApiSecretInput,
  setGrowwApiSecretInput,
  showGrowwSecret,
  setShowGrowwSecret,
  isGrowwConnecting,
  setIsGrowwConnecting,
  isFyersDialogOpen,
  setIsFyersDialogOpen,
  fyersAppId,
  setFyersAppId,
  fyersSecretId,
  setFyersSecretId,
  isDeltaExchangeDialogOpen,
  setIsDeltaExchangeDialogOpen,
  showDeltaSecret,
  setShowDeltaSecret,
  deltaWhitelistedIP,
  isZerodhaDialogOpen,
  setIsZerodhaDialogOpen,
  zerodhaApiKeyInput,
  setZerodhaApiKeyInput,
  zerodhaApiSecretInput,
  setZerodhaApiSecretInput,
  showZerodhaSecret,
  setShowZerodhaSecret,
  handleZerodhaConnect,
  submitZerodhaCredentials,
  handleUpstoxConnect,
  handleUpstoxDisconnect,
  handleUserAngelOneConnect,
  handleUserAngelOneDisconnect,
  handleDhanConnect,
  submitDhanCredentials,
  handleGrowwConnect,
  submitGrowwCredentials,
  handleGrowwDisconnect,
  handleDeltaExchangeConnect,
  handleDeltaExchangeDisconnect,
  heatmapMode,
  setHeatmapMode,
  heatmapContainerRef,
  handleDateSelect,
  handleHeatmapDataUpdate,
  handleDateRangeChange,
  activeTagHighlight,
  setActiveTagHighlight,
  personalHeatmapRevision,
  personal2HeatmapRevision,
  setPersonalHeatmapRevision,
  setPersonal2HeatmapRevision,
  saveAllTradingData,
  getUserId,
  setReportPostMode,
  setReportPostSelectedDate,
  setRangePostOverrideData,
  setShowReportPostDialog,
  setShowShareDialog,
  fomoButtonRef,
  overtradingButtonRef,
  plannedButtonRef,
  scrollTrigger,
  visibleStats,
  setVisibleStats,
  getFilteredHeatmapData,
  selectedAudioTrack,
  setSelectedAudioTrack,
  isAudioPlaying,
  setIsAudioPlaying,
  allAudioTracks,
  youtubePlayerRef,
  duration,
  currentTime,
  audioProgress,
  setCurrentTime,
  setAudioProgress,
  setHasManuallyToggledMode,
  setTradeHistoryData,
  setTradeHistoryData2,
  setSelectedDate,
  theme,
  targetPeriod,
  setTargetPeriod,
  targetAmount,
  setTargetAmount,
  prevProgressRef,
  isTortoiseFacingRightRef,
  selectedDateRange,
  riskCapital,
  setRiskCapital,
  riskRewardRatio,
  setRiskRewardRatio,
  isConnected,
  totalBrokerFunds,
  allBrokerFunds,
  journalFundBase,
  setJournalFundBase,
  journalWalletUserId,
  activeBroker,
  getBrokerDisplayName,
  brokerIconMap,
  formatDuration,
  isNavVisible,
  navSparklineData,
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
  showGuestDialog,
  setShowGuestDialog,
}: JournalTabContentProps) {
  const [, setLocation] = useLocation();
  return (
    <>
                <div className="space-y-4 md:space-y-6 px-3 md:px-6 py-3 md:py-2 relative">
                {/* Back Button - Mobile Only */}
                <Button
                  onClick={() => setTabWithAuthCheck("trading-home")}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  data-testid="button-back-to-home-journal"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                    Trading Journal
                  </h2>
                  <span className="text-[10px] md:text-xs text-gray-500 font-medium tracking-widest uppercase italic flex items-center gap-1">
                    Break the Loop, Find Your Edge
                    <span className="flex items-center ml-1">
                      <svg 
                        width="24" 
                        height="12" 
                        viewBox="0 0 24 12" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-purple-500"
                      >
                        <path 
                          d="M11 5.2C10.2 4 9 3 7.5 3C4.5 3 3 4.5 3 6C3 7.5 4.5 9 7.5 9C10.5 9 12 6 12 6" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                        />
                        <path 
                          d="M12 6C12 6 13.5 9 16.5 9C19.5 9 21 7.5 21 6C21 5.6 20.9 5.2 20.7 4.8" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                        />
                        <path 
                          d="M17.8 3.3C17.4 3.1 16.9 3 16.5 3C13.5 3 12 6 12 6" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                        />
                        <path 
                          d="M21 2L23 1" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          className="animate-pulse"
                        />
                      </svg>
                    </span>
                  </span>
                </div>
                {/* Main Journal Content - Mobile: Show only in "home" tab | Desktop: Always visible */}
                <div
                  className={`${mobileBottomTab !== "home" ? "hidden md:block" : "block"}`}
                >
                  {/* PERFORMANCE TIMELINE - Responsive Three Blocks */}
                  {/* Desktop: 3-column grid | Mobile: Single panel with carousel */}
                  <div className="relative mb-6">
                    {/* Desktop: Grid Layout | Mobile: Single Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left Block - Performance Chart */}
                      <JournalChartWindow
                        mobileJournalPanel={mobileJournalPanel}
                        showStockSearch={showStockSearch}
                        setShowStockSearch={setShowStockSearch}
                        selectedJournalSymbol={selectedJournalSymbol}
                        setSelectedJournalSymbol={setSelectedJournalSymbol}
                        setSelectedJournalInterval={setSelectedJournalInterval}
                        stockSearchQuery={stockSearchQuery}
                        setStockSearchQuery={setStockSearchQuery}
                        journalSearchType={journalSearchType}
                        setJournalSearchType={setJournalSearchType}
                        selectedInstrumentCategory={selectedInstrumentCategory}
                        setSelectedInstrumentCategory={setSelectedInstrumentCategory}
                        tradedSymbols={tradedSymbols}
                        currentSymbolIndex={currentSymbolIndex}
                        setCurrentSymbolIndex={setCurrentSymbolIndex}
                        tradingDataByDate={tradingDataByDate}
                        journalChartMode={journalChartMode}
                        setJournalChartMode={setJournalChartMode}
                        showJournalTimeframeDropdown={showJournalTimeframeDropdown}
                        setShowJournalTimeframeDropdown={setShowJournalTimeframeDropdown}
                        showHeatmapTimeframeDropdown={showHeatmapTimeframeDropdown}
                        setShowHeatmapTimeframeDropdown={setShowHeatmapTimeframeDropdown}
                        journalChartTimeframe={journalChartTimeframe}
                        setJournalChartTimeframe={setJournalChartTimeframe}
                        heatmapChartTimeframe={heatmapChartTimeframe}
                        setHeatmapChartTimeframe={setHeatmapChartTimeframe}
                        heatmapSelectedSymbol={heatmapSelectedSymbol}
                        heatmapChartData={heatmapChartData}
                        setHeatmapChartData={setHeatmapChartData}
                        heatmapSelectedDate={heatmapSelectedDate}
                        heatmapChartRef={heatmapChartRef}
                        heatmapCandlestickSeriesRef={heatmapCandlestickSeriesRef}
                        heatmapEma12SeriesRef={heatmapEma12SeriesRef}
                        heatmapEma26SeriesRef={heatmapEma26SeriesRef}
                        setHeatmapHoveredOhlc={setHeatmapHoveredOhlc}
                        fetchHeatmapChartData={fetchHeatmapChartData}
                        journalChartData={journalChartData}
                        journalChartLoading={journalChartLoading}
                        hoveredCandleOhlc={hoveredCandleOhlc}
                        heatmapChartLoading={heatmapChartLoading}
                        heatmapHoveredOhlc={heatmapHoveredOhlc}
                        journalChartContainerRef={journalChartContainerRef}
                        heatmapChartContainerRef={heatmapChartContainerRef}
                        getJournalTimeframeLabel={getJournalTimeframeLabel}
                        fetchJournalChartData={fetchJournalChartData}
                        journalTimeframeOptions={journalTimeframeOptions}
                        searchedInstruments={searchedInstruments}
                        setSearchedInstruments={setSearchedInstruments}
                        isSearchingInstruments={isSearchingInstruments}
                        selectedInstrument={selectedInstrument}
                        setSelectedInstrument={setSelectedInstrument}
                        selectedInstrumentToken={selectedInstrumentToken}
                        setSelectedInstrumentToken={setSelectedInstrumentToken}
                        defaultInstruments={defaultInstruments}
                        categorySearchSuggestions={categorySearchSuggestions}
                      />

                      {/* Middle Block - Multiple Image Upload */}
                      <div
                        className={`h-[300px] sm:h-[380px] md:h-[400px] ${mobileJournalPanel === 1 ? "block" : "hidden"} md:block`}
                      >
                        <MultipleImageUpload
                          ref={imageUploadRef}
                          images={tradingImages}
                          onImagesChange={setTradingImages}
                        />
                      </div>

                      {/* Right Block - PERFORMANCE STATS + TRADING NOTES */}
                      <TradingNotesWindow
                        selectedDate={selectedDate}
                        formatDateKey={formatDateKey}
                        notesContent={notesContent}
                        setNotesContent={setNotesContent}
                        tempNotesContent={tempNotesContent}
                        setTempNotesContent={setTempNotesContent}
                        isEditingNotes={isEditingNotes}
                        setIsEditingNotes={setIsEditingNotes}
                        selectedTags={selectedTags}
                        setSelectedTags={setSelectedTags}
                        isTagDropdownOpen={isTagDropdownOpen}
                        setIsTagDropdownOpen={setIsTagDropdownOpen}
                        selectedDailyFactors={selectedDailyFactors}
                        setSelectedDailyFactors={setSelectedDailyFactors}
                        isDailyFactorsDropdownOpen={isDailyFactorsDropdownOpen}
                        setIsDailyFactorsDropdownOpen={setIsDailyFactorsDropdownOpen}
                        isNotesInNewsMode={isNotesInNewsMode}
                        setIsNotesInNewsMode={setIsNotesInNewsMode}
                        journalDateNews={journalDateNews}
                        isJournalDateNewsLoading={isJournalDateNewsLoading}
                        nifty50NewsItems={nifty50NewsItems}
                        isNifty50NewsLoading={isNifty50NewsLoading}
                        getWatchlistNewsRelativeTime={getWatchlistNewsRelativeTime}
                        selectedIndicators={selectedIndicators}
                        setSelectedIndicators={setSelectedIndicators}
                        indicatorTimeframe={indicatorTimeframe}
                        setIndicatorTimeframe={setIndicatorTimeframe}
                        isIndicatorDropdownOpen={isIndicatorDropdownOpen}
                        setIsIndicatorDropdownOpen={setIsIndicatorDropdownOpen}
                        isCustomTimeframeDialogOpen={isCustomTimeframeDialogOpen}
                        setIsCustomTimeframeDialogOpen={setIsCustomTimeframeDialogOpen}
                        customTimeframeInput={customTimeframeInput}
                        setCustomTimeframeInput={setCustomTimeframeInput}
                        performanceMetrics={performanceMetrics}
                        tradingDataByDate={tradingDataByDate}
                        setTradingDataByDate={setTradingDataByDate}
                        mobileJournalPanel={mobileJournalPanel}
                      />
                    </div>

                    {/* Mobile Navigation Arrows - Bottom of panels */}
                    <div className="md:hidden flex items-center justify-between mt-4 gap-3">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setMobileJournalPanel((prev) =>
                            prev === 0 ? 2 : prev - 1,
                          )
                        }
                        className="flex-1 h-12 rounded-xl"
                        data-testid="button-journal-prev"
                      >
                        <ChevronLeft className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">
                          {mobileJournalPanel === 0
                            ? "Notes"
                            : mobileJournalPanel === 1
                              ? "Chart"
                              : "Upload"}
                        </span>
                      </Button>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-center min-w-[80px]">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Current
                        </div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {mobileJournalPanel === 0
                            ? "Chart"
                            : mobileJournalPanel === 1
                              ? "Upload"
                              : "Notes"}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setMobileJournalPanel((prev) =>
                            prev === 2 ? 0 : prev + 1,
                          )
                        }
                        className="flex-1 h-12 rounded-xl"
                        data-testid="button-journal-next"
                      >
                        <span className="text-sm font-medium">
                          {mobileJournalPanel === 0
                            ? "Upload"
                            : mobileJournalPanel === 1
                              ? "Notes"
                              : "Chart"}
                        </span>
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </Button>
                    </div>
                  </div>

                  {/* Two Column Layout: TRADE HISTORY SUMMARY (Left) and PROFIT CONSISTENCY (Right) */}
                  {/* Desktop: 2-column grid | Mobile: Show Trade Book with collapsible Trade History */}
                  <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 gap-6">

                    <TradeHistoryPanel
                      showMobileTradeHistory={showMobileTradeHistory}
                      setShowMobileTradeHistory={setShowMobileTradeHistory}
                      tradeHistoryWindow={tradeHistoryWindow}
                      setTradeHistoryWindow={setTradeHistoryWindow}
                      tradeHistoryData={tradeHistoryData}
                      tradeHistoryData2={tradeHistoryData2}
                      zerodhaIsConnected={zerodhaIsConnected}
                      upstoxIsConnected={upstoxIsConnected}
                      angelOneIsConnected={angelOneIsConnected}
                      userAngelOneIsConnected={userAngelOneIsConnected}
                      dhanIsConnected={dhanIsConnected}
                      deltaExchangeIsConnected={deltaExchangeIsConnected}
                      fyersIsConnected={fyersIsConnected}
                      growwIsConnected={growwIsConnected}
                      secondaryBroker={secondaryBroker}
                      setShowConnectDialog={setShowConnectDialog}
                      setShowOrderModal={setShowOrderModal}
                      setShowSecondaryOrderModal={setShowSecondaryOrderModal}
                      setShowImportModal={setShowImportModal}
                      setShowPaperTradingModal={setShowPaperTradingModal}
                      setShowTradingChallengeModal={setShowTradingChallengeModal}
                      setShowJournalInfoModal={setShowJournalInfoModal}
                      isLoadingHeatmapData={isLoadingHeatmapData}
                      isDemoMode={isDemoMode}
                      selectedDate={selectedDate}
                    />
                                        {/* Connect Dialog - Shows broker connection options */}
                    <ConnectBrokerDialog
                      open={showConnectDialog}
                      onOpenChange={setShowConnectDialog}
                      showDeltaExchange={showDeltaExchange}
                      setShowDeltaExchange={setShowDeltaExchange}
                      connectedBrokersCount={connectedBrokersCount}
                      zerodhaIsConnected={zerodhaIsConnected}
                      setZerodhaAccessToken={setZerodhaAccessToken}
                      setZerodhaIsConnected={setZerodhaIsConnected}
                      upstoxIsConnected={upstoxIsConnected}
                      upstoxAccessToken={upstoxAccessToken}
                      setUpstoxAccessToken={setUpstoxAccessToken}
                      setUpstoxIsConnected={setUpstoxIsConnected}
                      angelOneIsConnected={angelOneIsConnected}
                      userAngelOneIsConnected={userAngelOneIsConnected}
                      setUserAngelOneToken={setUserAngelOneToken}
                      setUserAngelOneIsConnected={setUserAngelOneIsConnected}
                      setUserAngelOneName={setUserAngelOneName}
                      dhanIsConnected={dhanIsConnected}
                      setDhanAccessToken={setDhanAccessToken}
                      setDhanIsConnected={setDhanIsConnected}
                      setDhanClientName={setDhanClientName}
                      fyersIsConnected={fyersIsConnected}
                      growwIsConnected={growwIsConnected}
                      setGrowwIsConnected={setGrowwIsConnected}
                      setGrowwAccessToken={setGrowwAccessToken}
                      setGrowwUserId={setGrowwUserId}
                      setGrowwUserName={setGrowwUserName}
                      setBrokerFunds={setBrokerFunds}
                      deltaExchangeIsConnected={deltaExchangeIsConnected}
                      setDeltaExchangeIsConnected={setDeltaExchangeIsConnected}
                      deltaExchangeApiKey={deltaExchangeApiKey}
                      setDeltaExchangeApiKey={setDeltaExchangeApiKey}
                      deltaExchangeApiSecret={deltaExchangeApiSecret}
                      setDeltaExchangeApiSecret={setDeltaExchangeApiSecret}
                      setDeltaExchangeUserId={setDeltaExchangeUserId}
                      setDeltaExchangeAccountName={setDeltaExchangeAccountName}
                      isUpstoxDialogOpen={isUpstoxDialogOpen}
                      setIsUpstoxDialogOpen={setIsUpstoxDialogOpen}
                      upstoxApiKeyInput={upstoxApiKeyInput}
                      setUpstoxApiKeyInput={setUpstoxApiKeyInput}
                      upstoxApiSecretInput={upstoxApiSecretInput}
                      setUpstoxApiSecretInput={setUpstoxApiSecretInput}
                      showUpstoxSecret={showUpstoxSecret}
                      setShowUpstoxSecret={setShowUpstoxSecret}
                      isAngelOneDialogOpen={isAngelOneDialogOpen}
                      setIsAngelOneDialogOpen={setIsAngelOneDialogOpen}
                      angelOneClientCodeInput={angelOneClientCodeInput}
                      setAngelOneClientCodeInput={setAngelOneClientCodeInput}
                      angelOneApiKeyInput={angelOneApiKeyInput}
                      setAngelOneApiKeyInput={setAngelOneApiKeyInput}
                      showAngelOneSecret={showAngelOneSecret}
                      setShowAngelOneSecret={setShowAngelOneSecret}
                      angelOnePinInput={angelOnePinInput}
                      setAngelOnePinInput={setAngelOnePinInput}
                      showAngelOnePin={showAngelOnePin}
                      setShowAngelOnePin={setShowAngelOnePin}
                      angelOneTotpInput={angelOneTotpInput}
                      setAngelOneTotpInput={setAngelOneTotpInput}
                      showAngelOneTotp={showAngelOneTotp}
                      setShowAngelOneTotp={setShowAngelOneTotp}
                      isDhanDialogOpen={isDhanDialogOpen}
                      setIsDhanDialogOpen={setIsDhanDialogOpen}
                      dhanClientIdInput={dhanClientIdInput}
                      setDhanClientIdInput={setDhanClientIdInput}
                      dhanTokenInput={dhanTokenInput}
                      setDhanTokenInput={setDhanTokenInput}
                      showDhanToken={showDhanToken}
                      setShowDhanToken={setShowDhanToken}
                      isGrowwDialogOpen={isGrowwDialogOpen}
                      setIsGrowwDialogOpen={setIsGrowwDialogOpen}
                      growwApiKeyInput={growwApiKeyInput}
                      setGrowwApiKeyInput={setGrowwApiKeyInput}
                      growwApiSecretInput={growwApiSecretInput}
                      setGrowwApiSecretInput={setGrowwApiSecretInput}
                      showGrowwSecret={showGrowwSecret}
                      setShowGrowwSecret={setShowGrowwSecret}
                      isGrowwConnecting={isGrowwConnecting}
                      setIsGrowwConnecting={setIsGrowwConnecting}
                      isFyersDialogOpen={isFyersDialogOpen}
                      setIsFyersDialogOpen={setIsFyersDialogOpen}
                      fyersAppId={fyersAppId}
                      setFyersAppId={setFyersAppId}
                      fyersSecretId={fyersSecretId}
                      setFyersSecretId={setFyersSecretId}
                      isDeltaExchangeDialogOpen={isDeltaExchangeDialogOpen}
                      setIsDeltaExchangeDialogOpen={setIsDeltaExchangeDialogOpen}
                      showDeltaSecret={showDeltaSecret}
                      setShowDeltaSecret={setShowDeltaSecret}
                      deltaWhitelistedIP={deltaWhitelistedIP}
                      isZerodhaDialogOpen={isZerodhaDialogOpen}
                      setIsZerodhaDialogOpen={setIsZerodhaDialogOpen}
                      zerodhaApiKeyInput={zerodhaApiKeyInput}
                      setZerodhaApiKeyInput={setZerodhaApiKeyInput}
                      zerodhaApiSecretInput={zerodhaApiSecretInput}
                      setZerodhaApiSecretInput={setZerodhaApiSecretInput}
                      showZerodhaSecret={showZerodhaSecret}
                      setShowZerodhaSecret={setShowZerodhaSecret}
                      handleZerodhaConnect={handleZerodhaConnect}
                      submitZerodhaCredentials={submitZerodhaCredentials}
                      handleUpstoxConnect={handleUpstoxConnect}
                      handleUpstoxDisconnect={handleUpstoxDisconnect}
                      handleUserAngelOneConnect={handleUserAngelOneConnect}
                      handleUserAngelOneDisconnect={handleUserAngelOneDisconnect}
                      handleDhanConnect={handleDhanConnect}
                      submitDhanCredentials={submitDhanCredentials}
                      handleGrowwConnect={handleGrowwConnect}
                      submitGrowwCredentials={submitGrowwCredentials}
                      handleGrowwDisconnect={handleGrowwDisconnect}
                      handleDeltaExchangeConnect={handleDeltaExchangeConnect}
                      handleDeltaExchangeDisconnect={handleDeltaExchangeDisconnect}
                    />

                    {/* Trade Book - Right Side (Functional Calendar) */}
                    <TradeBook
                      heatmapMode={heatmapMode}
                      setHeatmapMode={setHeatmapMode}
                      selectedDate={selectedDate}
                      heatmapContainerRef={heatmapContainerRef}
                      handleDateSelect={handleDateSelect}
                      handleHeatmapDataUpdate={handleHeatmapDataUpdate}
                      handleDateRangeChange={handleDateRangeChange}
                      activeTagHighlight={activeTagHighlight}
                      setActiveTagHighlight={setActiveTagHighlight}
                      personalHeatmapRevision={personalHeatmapRevision}
                      personal2HeatmapRevision={personal2HeatmapRevision}
                      setPersonalHeatmapRevision={setPersonalHeatmapRevision}
                      setPersonal2HeatmapRevision={setPersonal2HeatmapRevision}
                      tradingDataByDate={tradingDataByDate}
                      setTradingDataByDate={setTradingDataByDate}
                      saveAllTradingData={saveAllTradingData}
                      getUserId={getUserId}
                      fetchHeatmapChartData={fetchHeatmapChartData}
                      setJournalChartMode={setJournalChartMode}
                      setReportPostMode={setReportPostMode}
                      setReportPostSelectedDate={setReportPostSelectedDate}
                      setRangePostOverrideData={setRangePostOverrideData}
                      setShowReportPostDialog={setShowReportPostDialog}
                      heatmapSelectedDate={heatmapSelectedDate}
                      setShowShareDialog={setShowShareDialog}
                      fomoButtonRef={fomoButtonRef}
                      overtradingButtonRef={overtradingButtonRef}
                      plannedButtonRef={plannedButtonRef}
                      scrollTrigger={scrollTrigger}
                      visibleStats={visibleStats}
                      setVisibleStats={setVisibleStats}
                      getFilteredHeatmapData={getFilteredHeatmapData}
                      selectedAudioTrack={selectedAudioTrack}
                      setSelectedAudioTrack={setSelectedAudioTrack}
                      isAudioPlaying={isAudioPlaying}
                      setIsAudioPlaying={setIsAudioPlaying}
                      allAudioTracks={allAudioTracks}
                      youtubePlayerRef={youtubePlayerRef}
                      duration={duration}
                      currentTime={currentTime}
                      audioProgress={audioProgress}
                      setCurrentTime={setCurrentTime}
                      setAudioProgress={setAudioProgress}
                      setHasManuallyToggledMode={setHasManuallyToggledMode}
                      setSelectedDailyFactors={setSelectedDailyFactors}
                      setSelectedIndicators={setSelectedIndicators}
                      setTradeHistoryData={setTradeHistoryData}
                      setTradeHistoryData2={setTradeHistoryData2}
                      setTradeHistoryWindow={setTradeHistoryWindow}
                      setTradingImages={setTradingImages}
                    />

                  </div>
                </div>
                {/* End of Main Journal Content */}
                {/* Ranking Tab Content - Mobile only - Empty placeholder */}
                {mobileBottomTab === "ranking" && (
                  <div className="md:hidden p-4">
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
                        <Trophy className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Trading Challenge</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-4">Coming Soon</p>
                      <div className="space-y-3 w-full max-w-xs">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-left">
                          <Users className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Compete with Traders</p>
                            <p className="text-xs text-gray-500">Join 7-day trading challenges</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-left">
                          <BarChart3 className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Live P&L Tracking</p>
                            <p className="text-xs text-gray-500">Real-time ranking based on your trades</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-left">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Leaderboard Rankings</p>
                            <p className="text-xs text-gray-500">See your position among all participants</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============== MODERN TRADING ANALYTICS DASHBOARD ============== */}
                {/* Mobile: Show only in "insight" tab | Desktop: Always visible */}
                <div
                  className={`mt-8 space-y-6 ${mobileBottomTab !== "insight" ? "hidden md:block" : "block"}`}
                >
                  {(() => {
                    // Calculate comprehensive insights from all trading data
                    const calculateTradingInsights = (data = tradingDataByDate) => {
                      const allData = Object.values(data).filter(
                        (data: any) => {
                          const d = data?.tradingData || data;
                          return d &&
                                 d.tradeHistory &&
                                 Array.isArray(d.tradeHistory) &&
                                 d.tradeHistory.length > 0;
                        }
                      );

                      if (allData.length === 0) {
                        return {
                          tagAnalysis: [],
                          overallStats: {
                            totalTrades: 0,
                            winRate: 0,
                            totalPnL: 0,
                          },
                          topPerformers: [],
                          worstPerformers: [],
                          tradingDayAnalysis: [],
                        };
                      }

                      // Tag-based performance analysis
                      const tagStats: any = {};
                      const dailyStats: any[] = [];

                      allData.forEach((data: any, index: number) => {
                        const dayData = data?.tradingData || data;
                        const trades = dayData.tradeHistory || [];
                        const tags = dayData.tradingTags || [];
                        const metrics = dayData.performanceMetrics;

                        // Calculate day statistics
                        if (metrics) {
                          dailyStats.push({
                            day: index + 1,
                            trades: metrics.totalTrades || trades.length,
                            winRate: parseFloat(metrics.winRate) || 0,
                            netPnL: metrics.netPnL || 0,
                            tags: tags,
                          });
                        }

                        // Analyze each tag's performance
                        tags.forEach((tag: string) => {
                          if (!tagStats[tag]) {
                            tagStats[tag] = {
                              tag,
                              tradingDays: 0,
                              totalTrades: 0,
                              wins: 0,
                              losses: 0,
                              totalPnL: 0,
                              winRate: 0,
                              avgPnL: 0,
                              bestDay: 0,
                              worstDay: 0,
                              totalDuration: 0,
                              durations: [],
                            };
                          }

                          const stats = tagStats[tag];
                          stats.tradingDays++;

                          if (metrics) {
                            const dayTrades = metrics.totalTrades || 1;
                            stats.totalTrades += dayTrades;
                            stats.wins += metrics.winningTrades || 0;
                            stats.losses += metrics.losingTrades || 0;
                            stats.totalPnL += metrics.netPnL || 0;
                            
                            // Track duration if available (assuming duration in minutes)
                            const duration = metrics.avgDuration || metrics.duration || 0;
                            if (duration > 0) {
                              stats.totalDuration += (duration * dayTrades);
                              stats.durations.push(duration);
                            }
                            stats.bestDay = Math.max(
                              stats.bestDay,
                              metrics.netPnL || 0,
                            );
                            stats.worstDay = Math.min(
                              stats.worstDay,
                              metrics.netPnL || 0,
                            );
                          }
                        });
                      });

                      // Calculate final stats for each tag
                      Object.values(tagStats).forEach((stats: any) => {
                        stats.winRate =
                          stats.totalTrades > 0
                            ? (stats.wins / stats.totalTrades) * 100
                            : 0;
                        stats.avgPnL =
                          stats.tradingDays > 0
                            ? stats.totalPnL / stats.tradingDays
                            : 0;
                        
                        stats.avgDuration = stats.totalTrades > 0 ? (stats.totalDuration / stats.totalTrades) : 0;
                        
                        // Determine trading style
                        if (stats.avgDuration === 0) {
                          stats.tradingStyle = "Inconsistent";
                        } else if (stats.avgDuration < 15) {
                          stats.tradingStyle = "Scalper";
                        } else if (stats.avgDuration < 60) {
                          stats.tradingStyle = "Intraday";
                        } else if (stats.avgDuration < 1440) {
                          stats.tradingStyle = "Swing Trade";
                        } else {
                          stats.tradingStyle = "Holding";
                        }
                        
                        // Override for emotional exit if loss making with high duration
                        if (stats.totalPnL < 0 && stats.avgDuration > 30) {
                          stats.tradingStyle = "Emotional Panic Exit";
                        }
                        
                        // Check for inconsistency in durations
                        if (stats.durations.length > 2) {
                           const min = Math.min(...stats.durations);
                           const max = Math.max(...stats.durations);
                           if (max > min * 5) {
                             stats.tradingStyle = "Inconsistent Duration";
                           }
                        }
                      });

                      const tagAnalysis = Object.values(tagStats).sort(
                        (a: any, b: any) => b.totalPnL - a.totalPnL,
                      );

                      // Overall statistics
                      const totalTrades = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.totalTrades,
                        0,
                      );
                      const totalPnL = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.totalPnL,
                        0,
                      );
                      const totalWins = tagAnalysis.reduce(
                        (sum: number, tag: any) => sum + tag.wins,
                        0,
                      );
                      const overallWinRate =
                        totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

                      const overallStats = {
                        totalTrades,
                        winRate: overallWinRate,
                        totalPnL,
                      };
                      const topPerformers = tagAnalysis.slice(0, 5);
                      const worstPerformers = tagAnalysis.slice(-3).reverse();

                      return {
                        tagAnalysis,
                        overallStats,
                        topPerformers,
                        worstPerformers,
                        tradingDayAnalysis: dailyStats,
                      };
                    };

                    // ✅ NEW: Use filtered heatmap data directly instead of complex insights
                    const filteredHeatmapData = getFilteredHeatmapData();
                    const insights = calculateTradingInsights(filteredHeatmapData);
                    const calculateHeatmapMetrics = () => {
                      const dates = Object.keys(filteredHeatmapData);
                      let totalPnL = 0;
                      let totalTrades = 0;
                      let winningTrades = 0;
                      let datesWithTrading = 0;
                      dates.forEach(dateKey => {
                        const dayData = filteredHeatmapData[dateKey];

                        // Handle both wrapped (AWS) and unwrapped formats
                        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;

                        if (metrics) {
                          const netPnL = metrics.netPnL || 0;

                          // Only include dates with actual trading activity (non-zero P&L)
                          if (netPnL !== 0) {
                            totalPnL += netPnL;
                            totalTrades += metrics.totalTrades || 0;
                            winningTrades += metrics.winningTrades || 0;
                            datesWithTrading++;
                          }
                        }
                      });

                      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

                      return { totalPnL, totalTrades, winRate, datesCount: datesWithTrading };
                    };

                    const heatmapMetrics = calculateHeatmapMetrics();
                    const totalPnL = heatmapMetrics.totalPnL;
                    const isProfitable = totalPnL >= 0;

                    console.log(`📊 Performance Trend using ${selectedDateRange ? 'FILTERED' : 'ALL'} heatmap data: ${heatmapMetrics.datesCount} dates, Total P&L: ₹${totalPnL.toFixed(2)}`);

                    return (
                      <div className="space-y-6">
                        {/* Desktop: Single Row with Total P&L, Performance Trend, Top Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          {/* Total Performance Card - Desktop: Left side */}
                          <div
                            className={`md:col-span-3 rounded-3xl p-6 md:p-8 text-white shadow-2xl ${isProfitable ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-red-500 to-rose-600"}`}
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Target className="w-6 h-6" />
                              </div>
                              <div className="text-right">
                                <div className="text-sm opacity-80">
                                  {selectedDateRange ? 'Range' : 'Total'} P&L
                                </div>
                                <div className="text-2xl md:text-3xl font-bold">
                                  {totalPnL >= 0 ? "" : "-"}₹
                                  {Math.abs(totalPnL).toLocaleString("en-IN")}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm opacity-80">
                                  Total Trades
                                </span>
                                <span className="font-semibold">
                                  {heatmapMetrics.totalTrades}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm opacity-80">
                                  Success Rate
                                </span>
                                <span className="font-semibold">
                                  {heatmapMetrics.winRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                  className="bg-white rounded-full h-2 transition-all duration-1000"
                                  style={{
                                    width: `${Math.min(
                                      heatmapMetrics.winRate,
                                      100,
                                    )}%`,
                                  }}
                                ></div>
                              </div>

                              {/* Weekly/Monthly Target Slider */}
                              <div className="pt-4 mt-2 border-t border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold opacity-90 uppercase tracking-wider">Target Period</span>
                                  <div className="flex bg-white/10 p-0.5 rounded-lg">
                                    <button 
                                      onClick={() => setTargetPeriod('weekly')}
                                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${targetPeriod === 'weekly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-white hover:bg-white/5'}`}
                                    >
                                      Weekly
                                    </button>
                                    <button 
                                      onClick={() => setTargetPeriod('monthly')}
                                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${targetPeriod === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-white hover:bg-white/5'}`}
                                    >
                                      Monthly
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider opacity-90">
                                    <span>{targetPeriod} Target</span>
                                    <span>₹{targetAmount.toLocaleString()}</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="5000" 
                                    max="200000" 
                                    step="5000" 
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                  />
                                </div>

                                {(() => {
                                  // Calculate Period P&L
                                  const now = new Date();
                                  const startOfPeriod = new Date(now);
                                  if (targetPeriod === 'weekly') {
                                    const day = now.getDay();
                                    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                                    startOfPeriod.setDate(diff);
                                  } else {
                                    startOfPeriod.setDate(1);
                                  }
                                  startOfPeriod.setHours(0, 0, 0, 0);

                                  const periodPnL = Object.entries(filteredHeatmapData)
                                    .filter(([dateStr]) => new Date(dateStr) >= startOfPeriod)
                                    .reduce((sum, [, data]: [string, any]) => {
                                      const metrics = data?.tradingData?.performanceMetrics || data?.performanceMetrics;
                                      return sum + (metrics?.netPnL || 0);
                                    }, 0);

                                  const progress = Math.max(0, Math.min(100, (periodPnL / targetAmount) * 100));
                                  const isTargetMet = periodPnL >= targetAmount;

                                  // Track tortoise direction
                                  if (progress > prevProgressRef.current + 0.1) {
                                    isTortoiseFacingRightRef.current = true;
                                  } else if (progress < prevProgressRef.current - 0.1) {
                                    isTortoiseFacingRightRef.current = false;
                                  }
                                  prevProgressRef.current = progress;

                                  return (
                                    <div className="space-y-2 pt-1">
                                      <div className="flex justify-between items-end">
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Current {targetPeriod === 'weekly' ? 'Week' : 'Month'}</span>
                                          <div className="text-sm font-bold text-white">
                                            ₹{periodPnL.toLocaleString()}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Progress</span>
                                          <div className="text-xs font-bold text-white">{progress.toFixed(1)}%</div>
                                        </div>
                                      </div>
                                      <div className="h-2 bg-white/20 rounded-full relative mb-4">
                                        {/* Animated Tortoise */}
                                        <motion.div
                                          initial={false}
                                          animate={{ left: `${progress}%` }}
                                          transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                          className="absolute -top-6 -ml-2 z-10 flex items-center justify-center h-6"
                                          style={{ left: `${progress}%` }}
                                        >
                                          <span className={`text-sm leading-none filter drop-shadow-sm transform ${isTortoiseFacingRightRef.current ? '-scale-x-100' : ''}`}>🐢</span>
                                        </motion.div>

                                        <div 
                                          className={`h-full bg-white rounded-full transition-all duration-1000 ${isTargetMet ? 'opacity-100' : 'opacity-60'}`}
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      {isTargetMet && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-tighter animate-bounce">
                                          <Trophy className="w-3 h-3" /> Target Achieved!
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Performance Trend Chart - Desktop: Middle */}
                          <PerformanceTrendChart
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            isProfitable={isProfitable}
                            tradingDataByDate={tradingDataByDate}
                            filteredHeatmapData={filteredHeatmapData}
                            theme={theme}
                          />
                          {/* Top Tags - Desktop: Right side */}
                          <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                <Tag className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">
                                  Top Tags
                                </h3>
                                <p className="text-xs text-slate-500">
                                  Strategy Performance
                                </p>
                              </div>
                            </div>

                            {insights.topPerformers.length > 0 ? (
                              <div className="space-y-6">
                                <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar -mx-2 px-2 scroll-smooth">
                                  {insights.topPerformers
                                    .map((tag: any, idx: number) => (
                                      <div 
                                        key={tag.tag} 
                                        className="flex-shrink-0 w-[240px] snap-start bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                                      >
                                        <div className="flex items-center justify-between w-full mb-3">
                                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                                            {(tag.displayTag || tag.tag).toUpperCase()}
                                          </span>
                                          <span
                                            className={`text-sm font-bold ${
                                              tag.totalPnL >= 0
                                                ? "text-emerald-600"
                                                : "text-red-500"
                                            }`}
                                          >
                                            {tag.totalPnL >= 0 ? "+" : ""}₹
                                            {Math.abs(
                                              tag.totalPnL,
                                            ).toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mb-2">
                                          <div
                                            className={`h-2 rounded-full transition-all duration-1000 ${
                                              tag.totalPnL >= 0
                                                ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                                : "bg-gradient-to-r from-red-400 to-rose-500"
                                            }`}
                                            style={{
                                              width: `${Math.min(
                                                tag.winRate,
                                                100,
                                              )}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Success Rate</span>
                                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                            {tag.winRate.toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                </div>

                                {/* Tag Performance Trend Chart */}
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm pl-[4px] pr-[4px] text-left font-normal pt-[0px] pb-[0px] mt-[0px] mb-[0px]">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Tag Trends</h4>
                                    </div>
                                    <div className="flex gap-2">
                                      <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[9px] uppercase font-bold text-slate-400">Profit</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        <span className="text-[9px] uppercase font-bold text-slate-400">Loss</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="h-[120px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart
                                        data={insights.topPerformers.map((tag: any) => ({
                                          name: (tag.displayTag || tag.tag).toUpperCase(),
                                          pnl: tag.totalPnL
                                        }))}
                                        margin={{ top: 0, right: 5, left: -20, bottom: 0 }}
                                      >
                                        <defs>
                                          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                                          </linearGradient>
                                        </defs>
                                        <XAxis 
                                          dataKey="name" 
                                          hide={false}
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
                                        />
                                        <YAxis hide={true} />
                                        <Tooltip
                                          contentStyle={{
                                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            color: '#fff'
                                          }}
                                          itemStyle={{ color: '#fff', padding: 0 }}
                                          formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                                        />
                                        <Area
                                          type="monotone"
                                          dataKey="pnl"
                                          stroke="#6366f1"
                                          strokeWidth={2}
                                          fill="url(#pnlGradient)"
                                          animationDuration={1000}
                                        />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-32 text-slate-500 dark:text-slate-400">
                                <div className="text-center">
                                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No tag data</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Strategy Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(() => {
                            // Filter to only include dates with actual trading activity (non-zero P&L)
                            const allData = Object.values(
                              filteredHeatmapData,
                            ).filter(
                              (data: any) => data && data.performanceMetrics && data.performanceMetrics.netPnL !== 0,
                            );

                            if (allData.length === 0) return null;

                            const totalDays = allData.length;
                            const profitableDays = allData.filter(
                              (d: any) => d.performanceMetrics.netPnL > 0,
                            ).length;
                            const avgDailyPnL =
                              allData.reduce(
                                (sum: number, d: any) =>
                                  sum + d.performanceMetrics.netPnL,
                                0,
                              ) / totalDays;
                            const maxProfit = Math.max(
                              ...allData.map(
                                (d: any) => d.performanceMetrics.netPnL,
                              ),
                            );

                            const metrics = [
                              {
                                label: "Trading Days",
                                value: totalDays,
                                icon: Calendar,
                                color: "from-blue-500 to-indigo-600",
                                textColor: "text-blue-600",
                              },
                              {
                                label: "Best Day",
                                value: <div className="flex justify-between w-full"><span>₹</span><span>{maxProfit.toLocaleString()}</span></div>,
                                icon: TrendingUp,
                                color: "from-emerald-500 to-green-600",
                                textColor: "text-emerald-600",
                              },
                              {
                                label: "Profitable Days",
                                value: profitableDays,
                                icon: Target,
                                color: "from-violet-500 to-purple-600",
                                textColor: "text-violet-600",
                              },
                              {
                                label: "Avg Daily P&L",
                                value: `₹${Math.abs(
                                  avgDailyPnL,
                                ).toLocaleString()}`,
                                icon: BarChart3,
                                color:
                                  avgDailyPnL >= 0
                                    ? "from-emerald-500 to-green-600"
                                    : "from-red-500 to-rose-600",
                                textColor:
                                  avgDailyPnL >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600",
                              },
                            ];

                            return metrics.map((metric) => (
                              <div
                                key={metric.label}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-3 md:p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
                              >
                                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-0">
                                  <div
                                    className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center md:mb-4 shadow-lg flex-shrink-0`}
                                  >
                                    <metric.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                  </div>
                                  <div className="flex-1 md:space-y-1">
                                    <div
                                      className={`text-xl md:text-2xl font-bold ${metric.textColor}`}
                                    >
                                      <div className="flex justify-between w-full">{metric.value}</div>
                                    </div>
                                    <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                                      {metric.label}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

                        {/* Trade Duration Analysis */}
                        <TradeDurationAnalysis
                          filteredHeatmapData={filteredHeatmapData}
                          theme={theme}
                        />

                        {/* Full Width Funds Analysis */}
                        <FundsAnalysis
                          isConnected={isConnected}
                          isDemoMode={isDemoMode}
                          totalBrokerFunds={totalBrokerFunds}
                          allBrokerFunds={allBrokerFunds}
                          journalFundBase={journalFundBase}
                          setJournalFundBase={setJournalFundBase}
                          journalWalletUserId={journalWalletUserId}
                          tradeHistoryData={tradeHistoryData}
                          tradingDataByDate={tradingDataByDate}
                          activeBroker={activeBroker}
                          performanceMetrics={performanceMetrics}
                          setShowConnectDialog={setShowConnectDialog}
                          getBrokerDisplayName={getBrokerDisplayName}
                          brokerIconMap={brokerIconMap}
                        />

                        {/* Risk Management Analysis Window */}
                        <div className="col-span-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl mt-6">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">Risk Management Analysis</h3>
                              <p className="opacity-80">Track your capital discipline and risk/reward consistency</p>
                            </div>
                          </div>

                          {(() => {
                            const allDates = Object.keys(filteredHeatmapData).sort();
                            const dayMetrics = allDates.map(dateStr => {
                              const d = filteredHeatmapData[dateStr];
                              const metrics = d?.tradingData?.performanceMetrics || d?.performanceMetrics;
                              const trades: any[] = d?.tradingData?.tradeHistory || d?.tradeHistory || d?.trades || [];
                              const netPnL = metrics?.netPnL ?? trades.reduce((s: number, t: any) => s + (typeof t.pnl === 'number' ? t.pnl : parseFloat((t.pnl || '0').replace(/[₹,+\s]/g, '')) || 0), 0);
                              const totalTrades = metrics?.totalTrades || trades.length;
                              return { date: dateStr, netPnL, totalTrades };
                            }).filter(d => d.totalTrades > 0);

                            const totalDays = dayMetrics.length;
                            const targetReward = riskCapital * riskRewardRatio;
                            const daysMetRR = dayMetrics.filter(d => d.netPnL >= targetReward).length;
                            const daysBreachedRisk = dayMetrics.filter(d => d.netPnL <= -riskCapital).length;
                            const daysProfitable = dayMetrics.filter(d => d.netPnL > 0).length;

                            // Capital consistency: compare avg P&L of first half vs second half
                            const half = Math.floor(dayMetrics.length / 2);
                            const firstHalfAvg = half > 0 ? dayMetrics.slice(0, half).reduce((s, d) => s + d.netPnL, 0) / half : 0;
                            const secondHalfAvg = half > 0 ? dayMetrics.slice(half).reduce((s, d) => s + d.netPnL, 0) / (dayMetrics.length - half) : 0;
                            const capitalTrend = totalDays < 2 ? 'no data' : secondHalfAvg > firstHalfAvg * 1.1 ? 'increasing' : secondHalfAvg < firstHalfAvg * 0.9 ? 'declining' : 'consistent';

                            // Chart data
                            const chartData = dayMetrics.map((d, i) => ({
                              day: d.date.slice(5),
                              pnl: d.netPnL,
                              target: targetReward,
                              risk: -riskCapital,
                            }));

                            return (
                              <div className="space-y-6">
                                {/* Settings Row */}
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold uppercase tracking-wider opacity-90">Risk Capital Per Day</span>
                                      <span className="text-sm font-black">₹{riskCapital.toLocaleString()}</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="1000"
                                      max="100000"
                                      step="1000"
                                      value={riskCapital}
                                      onChange={e => {
                                        const v = parseInt(e.target.value);
                                        setRiskCapital(v);
                                        localStorage.setItem('riskCapital', String(v));
                                      }}
                                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                    <div className="flex justify-between text-[10px] opacity-60">
                                      <span>₹1K</span><span>₹50K</span><span>₹1L</span>
                                    </div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold uppercase tracking-wider opacity-90">Risk : Reward Ratio</span>
                                      <span className="text-sm font-black">1 : {riskRewardRatio}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      {[1, 1.5, 2, 2.5, 3, 4, 5].map(r => (
                                        <button
                                          key={r}
                                          onClick={() => {
                                            setRiskRewardRatio(r);
                                            localStorage.setItem('riskRewardRatio', String(r));
                                          }}
                                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${riskRewardRatio === r ? 'bg-white text-blue-700 shadow-sm' : 'bg-white/10 hover:bg-white/20'}`}
                                        >
                                          {r}
                                        </button>
                                      ))}
                                    </div>
                                    <p className="text-[10px] opacity-60">Target reward: ₹{targetReward.toLocaleString()} per day</p>
                                  </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold">{totalDays > 0 ? `${daysMetRR}/${totalDays}` : '—'}</div>
                                    <div className="text-sm opacity-80 mt-1">Days Met R:R</div>
                                    <div className="text-[10px] opacity-60 mt-0.5">{totalDays > 0 ? `${((daysMetRR / totalDays) * 100).toFixed(0)}% success` : 'No data'}</div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold text-red-300">{daysBreachedRisk}</div>
                                    <div className="text-sm opacity-80 mt-1">Risk Breached</div>
                                    <div className="text-[10px] opacity-60 mt-0.5">{totalDays > 0 ? `${((daysBreachedRisk / totalDays) * 100).toFixed(0)}% of days` : 'No data'}</div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className={`text-2xl font-bold ${capitalTrend === 'increasing' ? 'text-emerald-300' : capitalTrend === 'declining' ? 'text-red-300' : 'text-white'}`}>
                                      {capitalTrend === 'no data' ? '—' : capitalTrend === 'increasing' ? '↑' : capitalTrend === 'declining' ? '↓' : '→'}
                                    </div>
                                    <div className="text-sm opacity-80 mt-1">Capital Trend</div>
                                    <div className="text-[10px] opacity-60 mt-0.5 capitalize">{capitalTrend}</div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="text-2xl font-bold text-emerald-300">{daysProfitable}</div>
                                    <div className="text-sm opacity-80 mt-1">Profitable Days</div>
                                    <div className="text-[10px] opacity-60 mt-0.5">{totalDays > 0 ? `${((daysProfitable / totalDays) * 100).toFixed(0)}% win rate` : 'No data'}</div>
                                  </div>
                                </div>

                                {/* Trend Chart */}
                                {chartData.length > 1 ? (
                                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-xs font-bold uppercase tracking-wider opacity-90">Daily P&amp;L vs Risk/Reward Bands</span>
                                      <div className="flex items-center gap-3 text-[10px] opacity-70">
                                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-white rounded" /> P&L</span>
                                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-emerald-300 border-dashed border-t-2 border-emerald-300 rounded" /> Target</span>
                                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-red-300 border-dashed border-t-2 border-red-300 rounded" /> Risk</span>
                                      </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={180}>
                                      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.6)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                        <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.6)' }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `${v >= 0 ? '' : '-'}${(Math.abs(v) / 1000).toFixed(0)}K`} />
                                        <Tooltip
                                          contentStyle={{ background: '#1e3a5f', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#e2e8f0', fontSize: '11px' }}
                                          formatter={(v: any, name: string) => {
                                            const label = name === 'pnl' ? 'Daily P&L' : name === 'target' ? 'Target (R:R)' : 'Max Risk';
                                            return [`${v >= 0 ? '₹' : '-₹'}${Math.abs(v).toLocaleString()}`, label];
                                          }}
                                        />
                                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 2" />
                                        <Line type="monotone" dataKey="target" stroke="#6ee7b7" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                                        <Line type="monotone" dataKey="risk" stroke="#fca5a5" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                                        <Line
                                          type="monotone"
                                          dataKey="pnl"
                                          stroke="rgba(255,255,255,0.7)"
                                          strokeWidth={2}
                                          dot={({ cx, cy, payload, index }: any) => {
                                            const color = payload.pnl >= targetReward ? '#6ee7b7' : payload.pnl <= -riskCapital ? '#fca5a5' : 'rgba(255,255,255,0.8)';
                                            return <circle key={`rr-dot-${index}`} cx={cx} cy={cy} r={4} fill={color} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />;
                                          }}
                                          activeDot={{ r: 6, fill: 'white', stroke: 'rgba(255,255,255,0.4)', strokeWidth: 2 }}
                                        />
                                      </ComposedChart>
                                    </ResponsiveContainer>
                                    <div className="flex items-center gap-4 mt-2 text-[10px] opacity-70">
                                      <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-300" /> Met R:R</span>
                                      <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-300" /> Breached risk</span>
                                      <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-white/70" /> Within range</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                                    <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="font-medium opacity-80">No trading data yet</p>
                                    <p className="text-sm opacity-60 mt-1">Save trades to see your risk/reward trend</p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <LossMakingAnalysisPanel
                          filteredHeatmapData={filteredHeatmapData}
                          tradeHistoryData={tradeHistoryData}
                          theme={theme}
                          formatDuration={formatDuration}
                        />

                        {/* Disciplined Trading Insights */}
                        <DisciplineRiskPanel
                          tradingDataByDate={tradingDataByDate}
                          filteredHeatmapData={filteredHeatmapData}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>

        {/* Minimalist Floating Pill Navigation - Mobile Only */}
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 pb-4 px-6 pointer-events-none transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-xs mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 pointer-events-auto">
            <div className="flex items-center justify-around px-1.5 py-1.5">
              {/* Home Tab */}
              <button
                onClick={() => setMobileBottomTab("home")}
                className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                  mobileBottomTab === "home"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-900 dark:hover:text-white"
                }`}
                data-testid="mobile-tab-home"
              >
                <HomeIcon className={`h-5 w-5 ${mobileBottomTab === "home" ? "fill-current" : ""}`} />
              </button>

              {/* Insight Tab */}
              <button
                onClick={() => setMobileBottomTab("insight")}
                className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                  mobileBottomTab === "insight"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-900 dark:hover:text-white"
                }`}
                data-testid="mobile-tab-insight"
              >
                <svg viewBox="0 0 24 16" className="h-5 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id={`navAreaGradient-${mobileBottomTab === "insight" ? "active" : navSparklineData.trend}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={mobileBottomTab === "insight" ? "#d1d5db" : (navSparklineData.trend === "up" ? "#22c55e" : navSparklineData.trend === "down" ? "#ef4444" : "#9ca3af")} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={mobileBottomTab === "insight" ? "#d1d5db" : (navSparklineData.trend === "up" ? "#22c55e" : navSparklineData.trend === "down" ? "#ef4444" : "#9ca3af")} stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`0,14 ${navSparklineData.points.split(' ').map((p, i) => {
                      const [x, y] = p.split(',');
                      return `${(parseFloat(x) / 40 * 22) + 1},${(parseFloat(y) / 24 * 12) + 1}`;
                    }).join(' ')} 22,14`}
                    fill={`url(#navAreaGradient-${mobileBottomTab === "insight" ? "active" : navSparklineData.trend})`}
                  />
                  <polyline
                    points={navSparklineData.points.split(' ').map(p => {
                      const [x, y] = p.split(',');
                      return `${(parseFloat(x) / 40 * 22) + 1},${(parseFloat(y) / 24 * 12) + 1}`;
                    }).join(' ')}
                    stroke={mobileBottomTab === "insight" ? "#ffffff" : (navSparklineData.trend === "up" ? "#22c55e" : navSparklineData.trend === "down" ? "#ef4444" : "#9ca3af")}
                    strokeWidth={mobileBottomTab === "insight" ? "2" : "1.5"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>

              {/* Paper Trade Tab */}
              <button
                onClick={() => setMobileBottomTab("paper-trade")}
                className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                  mobileBottomTab === "paper-trade"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-900 dark:hover:text-white"
                }`}
                data-testid="mobile-tab-paper-trade"
              >
                <TrendingUp className={`h-5 w-5 ${mobileBottomTab === "paper-trade" ? "fill-current" : ""}`} />
              </button>

              {/* Ranking Tab */}
              <button
                onClick={() => setMobileBottomTab("ranking")}
                className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                  mobileBottomTab === "ranking"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-900 dark:hover:text-white"
                }`}
                data-testid="mobile-tab-ranking"
              >
                <Trophy className={`h-5 w-5 ${mobileBottomTab === "ranking" ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Paper Trade Tab - Full Screen */}
        {mobileBottomTab === "paper-trade" && (
          <PaperTradingMobileTab
            paperTradingTotalPnl={paperTradingTotalPnl}
            paperTradingCapital={paperTradingCapital}
            hidePositionDetails={hidePositionDetails}
            setHidePositionDetails={setHidePositionDetails}
            paperPositions={paperPositions}
            paperTradeHistory={paperTradeHistory}
            paperTradeSymbolSearch={paperTradeSymbolSearch}
            setPaperTradeSymbolSearch={setPaperTradeSymbolSearch}
            paperTradeSymbol={paperTradeSymbol}
            setPaperTradeSymbol={setPaperTradeSymbol}
            paperTradingEventSourcesRef={paperTradingEventSourcesRef}
            setPaperTradingWsStatus={setPaperTradingWsStatus}
            setPaperTradeCurrentPrice={setPaperTradeCurrentPrice}
            searchPaperTradingInstruments={searchPaperTradingInstruments}
            setPaperTradeSearchResults={setPaperTradeSearchResults}
            paperTradeSearchLoading={paperTradeSearchLoading}
            paperTradeSearchResults={paperTradeSearchResults}
            setSelectedPaperTradingInstrument={setSelectedPaperTradingInstrument}
            fetchPaperTradePrice={fetchPaperTradePrice}
            paperTradeType={paperTradeType}
            setPaperTradeType={setPaperTradeType}
            setPaperTradeQuantity={setPaperTradeQuantity}
            setPaperTradeLotInput={setPaperTradeLotInput}
            setSelectedPaperTradingInstrumentNull={() => setSelectedPaperTradingInstrument(null)}
            setPaperTradeSLPrice={setPaperTradeSLPrice}
            paperTradeQuantity={paperTradeQuantity}
            paperTradeLotInput={paperTradeLotInput}
            paperTradeCurrentPrice={paperTradeCurrentPrice}
            paperTradePriceLoading={paperTradePriceLoading}
            showMobilePaperTradeSLDropdown={showMobilePaperTradeSLDropdown}
            setShowMobilePaperTradeSLDropdown={setShowMobilePaperTradeSLDropdown}
            paperTradeSLEnabled={paperTradeSLEnabled}
            setPaperTradeSLEnabled={setPaperTradeSLEnabled}
            paperTradeSLPrice={paperTradeSLPrice}
            paperTradeSLType={paperTradeSLType}
            setPaperTradeSLType={setPaperTradeSLType}
            paperTradeSLTimeframe={paperTradeSLTimeframe}
            setPaperTradeSLTimeframe={setPaperTradeSLTimeframe}
            paperTradeSLDurationUnit={paperTradeSLDurationUnit}
            setPaperTradeSLDurationUnit={setPaperTradeSLDurationUnit}
            paperTradeSLValue={paperTradeSLValue}
            setPaperTradeSLValue={setPaperTradeSLValue}
            setPaperTradeAction={setPaperTradeAction}
            executePaperTrade={executePaperTrade}
            fetchOptionChainData={fetchOptionChainData}
            setShowOptionChain={setShowOptionChain}
            showMobileTradeHistory={showMobileTradeHistory}
            setShowMobileTradeHistory={setShowMobileTradeHistory}
            paperTradingWsStatus={paperTradingWsStatus}
            recordAllPaperTrades={recordAllPaperTrades}
            exitAllPaperPositions={exitAllPaperPositions}
            swipeStartXRef={swipeStartXRef}
            swipeStartYRef={swipeStartYRef}
            swipedPositionId={swipedPositionId}
            setSwipedPositionId={setSwipedPositionId}
            exitPosition={exitPosition}
            resetPaperTradingAccount={resetPaperTradingAccount}
            toast={toast}
          />
        )}

        {/* Guest login prompt for unauthenticated users on Journal tab */}
        {showGuestDialog && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-600/50 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Sign in to track trades</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Log in to save your journal and P&L data.</p>
              </div>
              <button
                onClick={() => setLocation('/landing')}
                className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                data-testid="guest-dialog-login-journal"
              >
                Login
              </button>
              <button
                onClick={() => setShowGuestDialog(false)}
                className="shrink-0 text-slate-400 hover:text-white transition-colors p-1"
                data-testid="guest-dialog-close-journal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
    </>
  );
}
