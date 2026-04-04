import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trophy,
  Users,
  BarChart3,
  Target,
  TrendingUp,
  Calendar,
  CalendarDays,
  Tag,
  ShieldCheck,
  Home as HomeIcon,
  X,
  Search,
  Download,
  RefreshCw,
  Headset,
  Info,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Share2,
  MoreVertical,
  Plus,
  Loader2,
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MultipleImageUpload,
  MultipleImageUploadRef,
} from "@/components/multiple-image-upload";
import { TradingNotesWindow } from "@/components/TradingNotesWindow";
import TradeHistoryPanel from "@/components/TradeHistoryPanel";
import { ConnectBrokerDialog } from "@/components/connect-broker-dialog";
import { DemoHeatmap } from "@/components/DemoHeatmap";
import { PersonalHeatmap } from "@/components/PersonalHeatmap";
import { PerformanceTrendChart } from "@/components/PerformanceTrendChart";
import { TradeDurationAnalysis } from "./trade-duration";
import { FundsAnalysis } from "./fund";
import LossMakingAnalysisPanel from "@/components/LossMakingAnalysisPanel";
import { DisciplineRiskPanel } from "@/components/DisciplineRiskPanel";
import { PaperTradingMobileTab } from "@/components/PaperTradingMobileTab";
import JournalScreenTime from "@/components/JournalScreenTime";
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
  handleCloseHeatmap: () => void;
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
  influencerPeriod?: { active: boolean; expiryDate: string; startDate: string; days: number } | null;

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
  handleCloseHeatmap,
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
  influencerPeriod,
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

  // ── TradeBook inlined: mini-player local state ──
  type AudioTrack = { id: string; title: string; duration: string; youtubeId?: string };
  type SearchResult = { videoId: string; title: string; thumbnail: string; duration: string };
  const DEFAULT_MEDITATION: AudioTrack[] = [
    { title: "Deep Relaxation Meditation", duration: "10:05", id: "m1", youtubeId: "B7nkVhC10Gw" },
  ];
  const DEFAULT_PSYCHOLOGY: AudioTrack[] = [
    { title: 'Bruce Lee: "Your Greatest Enemy Is Within"', duration: "22:30", id: "p1", youtubeId: "KnppzfiZcgM" },
  ];
  const [meditationTracks, setMeditationTracks] = useState<AudioTrack[]>(DEFAULT_MEDITATION);
  const [psychologyTracks, setPsychologyTracks] = useState<AudioTrack[]>(DEFAULT_PSYCHOLOGY);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCategory, setSearchCategory] = useState<"meditation" | "psychology">("meditation");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => runSearch(val), 500);
  };

  const addTrack = (result: SearchResult) => {
    const newTrack: AudioTrack = {
      id: `yt-${result.videoId}`,
      title: result.title,
      duration: result.duration,
      youtubeId: result.videoId,
    };
    if (searchCategory === "meditation") {
      setMeditationTracks(prev => prev.find(t => t.id === newTrack.id) || prev.length >= 4 ? prev : [...prev, newTrack]);
    } else {
      setPsychologyTracks(prev => prev.find(t => t.id === newTrack.id) || prev.length >= 4 ? prev : [...prev, newTrack]);
    }
  };

  const removeTrack = (category: "meditation" | "psychology", id: string) => {
    if (category === "meditation") setMeditationTracks(prev => prev.filter(t => t.id !== id));
    else setPsychologyTracks(prev => prev.filter(t => t.id !== id));
  };

  const handleDone = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };
  // ── End TradeBook inlined state ──

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
                      {/* Left Block - Performance Chart (inlined) */}
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
                                              .filter((i: any) => {
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
                                                  ).map((instrument: any) => (
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
                                                                    : instrument.exchange === "NFO"
                                                                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                                                      : instrument.exchange === "BFO"
                                                                        ? "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300"
                                                                        : instrument.exchange === "CDS"
                                                                          ? "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300"
                                                                          : instrument.exchange === "NCDEX"
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
                                                    ).map((suggestion: string) => (
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
                                              .filter((i: any) => {
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
                                              .map((instrument: any) => (
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
                                                                    : instrument.exchange === "CDS"
                                                                      ? "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300"
                                                                      : instrument.exchange === "NCDEX"
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
                                        try {
                                          const headers = ["Time", "Open", "High", "Low", "Close", "Volume"];
                                          const rows = heatmapChartData.map((d: any) => {
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
                                            rows.map((r: any) => r.join(",")).join("\n");
                                          const encodedUri = encodeURI(csvContent);
                                          const link = document.createElement("a");
                                          link.setAttribute("href", encodedUri);
                                          const fileName = `heatmap_${heatmapSelectedSymbol.replace(/[:]/g, "_")}_${heatmapSelectedDate}.csv`;
                                          link.setAttribute("download", fileName);
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
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
                                        const nextIdx = (currentSymbolIndex + 1) % tradedSymbols.length;
                                        const nextSymbol = tradedSymbols[nextIdx];
                                        if (heatmapChartRef.current) {
                                          try {
                                            heatmapChartRef.current.remove();
                                          } catch (e) {}
                                          heatmapChartRef.current = null;
                                          heatmapCandlestickSeriesRef.current = null;
                                          heatmapEma12SeriesRef.current = null;
                                          heatmapEma26SeriesRef.current = null;
                                        }
                                        setCurrentSymbolIndex(nextIdx);
                                        setHeatmapChartData([]);
                                        setHeatmapHoveredOhlc(null);
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
                                          {journalTimeframeOptions.map((tf: any) => (
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
                                          {journalTimeframeOptions.map((tf: any) => (
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
                                            .filter(([_, data]: [string, any]) => {
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
                                            .map(([date, data]: [string, any]) => {
                                              const getNetPnLInner = (d: any): number => {
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
                                              const pnl = getNetPnLInner(data);
                                              const color = getHeatmapColor(pnl);
                                              return (
                                                <button
                                                  key={date}
                                                  onClick={() => {
                                                    const tradingData = tradingDataByDate[date];
                                                    let symbolForDate = "NSE:NIFTY50-INDEX";
                                                    if (
                                                      tradingData?.tradeHistory &&
                                                      Array.isArray(tradingData.tradeHistory) &&
                                                      tradingData.tradeHistory.length > 0
                                                    ) {
                                                      const firstTrade = tradingData.tradeHistory[0];
                                                      if (firstTrade?.symbol) {
                                                        symbolForDate = firstTrade.symbol;
                                                      }
                                                    }
                                                    fetchHeatmapChartData(symbolForDate, date);
                                                  }}
                                                  className={`${color} rounded p-1 text-center hover:opacity-80 transition-opacity`}
                                                  title={`${date}: ₹${pnl.toLocaleString("en-IN")}`}
                                                  data-testid={`heatmap-date-${date}`}
                                                >
                                                  <div className="text-[10px] font-medium leading-none">
                                                    {date.split("-")[2]}
                                                  </div>
                                                  <div className="text-[8px] opacity-80 mt-0.5">
                                                    {new Date(date).toLocaleDateString("en-IN", {
                                                      month: "short",
                                                    })}
                                                  </div>
                                                </button>
                                              );
                                            })}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}

                                  {/* Refresh Button - ONLY in Search Mode */}
                                  {journalChartMode === "search" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-xs text-slate-700 dark:text-slate-300"
                                      onClick={fetchJournalChartData}
                                      title="Refresh chart"
                                      data-testid="button-refresh-chart"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                    </Button>
                                  )}

                                  {/* X Reset Button - ONLY in Heatmap Mode */}
                                  {journalChartMode === "heatmap" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-xs text-slate-700 dark:text-slate-300 hover:text-red-500"
                                      onClick={handleCloseHeatmap}
                                      title="Close heatmap"
                                      data-testid="button-close-heatmap"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Chart Mode Toggle + Chart Container */}
                            <div className="flex-1 relative flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-0">
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
                                        O{hoveredCandleOhlc.open.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        H{hoveredCandleOhlc.high.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        L{hoveredCandleOhlc.low.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className={`font-medium ${hoveredCandleOhlc.close >= hoveredCandleOhlc.open ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                        C{hoveredCandleOhlc.close.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className={`font-medium ${hoveredCandleOhlc.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                        {hoveredCandleOhlc.change >= 0 ? "+" : ""}{hoveredCandleOhlc.change.toFixed(2)}
                                      </span>
                                      <span className={`font-medium ${hoveredCandleOhlc.changePercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                        ({hoveredCandleOhlc.changePercent >= 0 ? "+" : ""}{hoveredCandleOhlc.changePercent.toFixed(2)}%)
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
                                        O{heatmapHoveredOhlc.open.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        H{heatmapHoveredOhlc.high.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        L{heatmapHoveredOhlc.low.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className={`font-medium ${heatmapHoveredOhlc.close >= heatmapHoveredOhlc.open ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                        C{heatmapHoveredOhlc.close.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className={`font-medium ${heatmapHoveredOhlc.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                        {heatmapHoveredOhlc.change >= 0 ? "+" : ""}{heatmapHoveredOhlc.change.toFixed(2)}
                                      </span>
                                      <span className={`font-medium ${heatmapHoveredOhlc.changePercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                        ({heatmapHoveredOhlc.changePercent >= 0 ? "+" : ""}{heatmapHoveredOhlc.changePercent.toFixed(2)}%)
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
                      isDemoMode={isDemoMode}
                    />

                    {/* Trade Book - Right Side (Functional Calendar) - inlined */}
                    <div className="relative">
                    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <CardContent className="p-6 px-0.5 md:px-4 md:py-4 pt-[10px] pb-[10px]">
                        <div className={`text-[10px] uppercase tracking-wider mb-2 flex items-center justify-between gap-2 rounded-md px-1 -mx-1 ${heatmapMode === 2 ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 py-0.5' : 'text-gray-500 dark:text-gray-400'}`}>
                          <div className="flex items-center gap-1">
                            <div>Trade Book</div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-4 w-4" data-testid="button-tradebook-help">
                                  <Headset className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[95vw] max-w-[700px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-xl shadow-2xl [&>button]:hidden">
                                <div className="flex flex-col md:flex-row h-[420px] md:h-[340px]">
                                  {/* Left Side: Thumbnail — compact on mobile, full on desktop */}
                                  <div className="w-full md:w-1/2 relative flex flex-col bg-slate-100 dark:bg-slate-800 overflow-hidden border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 h-40 md:h-auto">
                                    {/* Mobile-only: MINI PLAY label centered at top of thumbnail */}
                                    <div className="md:hidden absolute top-0 left-0 right-0 z-20 flex items-center justify-center pt-2 pointer-events-none">
                                      <span className="text-[9px] font-bold text-white/70 uppercase tracking-[0.35em] bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">Mini Play</span>
                                    </div>
                                    {/* Mobile-only: X close button top-right */}
                                    <DialogClose asChild>
                                      <button className="md:hidden absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors" data-testid="button-miniplay-close-mobile">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </DialogClose>
                                    {/* Background glow */}
                                    <div className="absolute inset-0 opacity-10">
                                      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] rounded-full bg-gradient-to-br from-violet-500 via-transparent to-transparent"></div>
                                    </div>
                                    {/* Thumbnail card */}
                                    <div className="flex-1 flex items-center justify-center p-3 md:p-8 relative">
                                    <motion.div key={selectedAudioTrack?.id || "none"} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative w-full aspect-[1.6/1] md:aspect-[1.6/1] rounded-xl md:rounded-2xl shadow-2xl flex flex-col justify-start border border-white/10 overflow-hidden">
                                      {selectedAudioTrack?.youtubeId ? (
                                        <div className="absolute inset-0 z-0">
                                          <img
                                            src={`https://img.youtube.com/vi/${selectedAudioTrack.youtubeId}/maxresdefault.jpg`}
                                            className="w-full h-full object-cover"
                                            alt=""
                                          />
                                        </div>
                                      ) : (
                                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-violet-800 to-purple-900" />
                                      )}
                                      <button onClick={() => selectedAudioTrack?.youtubeId && window.open(`https://www.youtube.com/watch?v=${selectedAudioTrack.youtubeId}`, "_blank")} className="absolute bottom-2 right-2 z-10 hover:scale-110 transition-transform active:scale-95">
                                        <Info className="w-3.5 h-3.5 text-white/70" />
                                      </button>
                                    </motion.div>
                                    </div>
                                  </div>
                                  <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-slate-900 min-h-0 overflow-hidden">
                                    {/* Header: always visible */}
                                    <div className="flex-shrink-0 py-2 px-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                      <div className="hidden md:flex flex-1 justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] opacity-50">Mini-Play</div>
                                      <div className="flex items-center gap-1 ml-auto">
                                        {isSearchOpen && (
                                          <button
                                            onClick={handleDone}
                                            className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                                            data-testid="button-miniplay-done"
                                          >
                                            Done
                                          </button>
                                        )}
                                        <button
                                          onClick={() => { setIsSearchOpen(v => !v); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSearchOpen ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20'}`}
                                          data-testid="button-miniplay-search"
                                        >
                                          <Search className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Content area: search mode OR playlist mode — fills remaining height */}
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                      {isSearchOpen ? (
                                        /* ── SEARCH MODE: category tabs + input + results fill this area ── */
                                        <div className="flex flex-col h-full p-3 gap-2 w-full overflow-hidden">
                                          {/* Category tabs */}
                                          <div className="flex gap-1 flex-shrink-0 w-full">
                                            {(["meditation", "psychology"] as const).map(cat => (
                                              <button
                                                key={cat}
                                                onClick={() => setSearchCategory(cat)}
                                                className={`flex-1 text-[9px] font-bold uppercase tracking-wider py-1 rounded transition-colors ${searchCategory === cat ? (cat === 'meditation' ? 'bg-violet-500 text-white' : 'bg-blue-500 text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                              >
                                                {cat} ({(cat === 'meditation' ? meditationTracks : psychologyTracks).length}/4)
                                              </button>
                                            ))}
                                          </div>
                                          {/* Search input */}
                                          <div className="flex-shrink-0 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1.5">
                                            <Search className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                            <input
                                              ref={searchInputRef}
                                              value={searchQuery}
                                              onChange={e => handleSearchInput(e.target.value)}
                                              placeholder="Search..."
                                              className="flex-1 min-w-0 bg-transparent text-[11px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none"
                                              data-testid="input-miniplay-search"
                                            />
                                            {isSearching && <Loader2 className="w-3 h-3 text-slate-400 animate-spin flex-shrink-0" />}
                                            {searchQuery && !isSearching && (
                                              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                                                <X className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                          {/* Search results — scrollable, fills remaining space, width-clamped */}
                                          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-100 dark:border-slate-700 w-full">
                                            {searchResults.length > 0 ? searchResults.map(result => {
                                              const targetList = searchCategory === 'meditation' ? meditationTracks : psychologyTracks;
                                              const alreadyAdded = targetList.some(t => t.id === `yt-${result.videoId}`);
                                              const limitReached = targetList.length >= 4;
                                              const canAdd = !alreadyAdded && !limitReached;
                                              return (
                                                <div
                                                  key={result.videoId}
                                                  className={`flex items-center gap-2 p-1.5 w-full min-w-0 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${canAdd ? 'cursor-pointer' : ''}`}
                                                  onClick={() => { if (canAdd) addTrack(result); }}
                                                >
                                                  <img src={result.thumbnail} alt="" className="w-9 h-6 rounded object-cover flex-shrink-0 bg-slate-200" />
                                                  <span className="flex-1 w-0 min-w-0 text-[10px] text-slate-700 dark:text-slate-300 leading-tight truncate">{result.title}</span>
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); if (canAdd) addTrack(result); }}
                                                    disabled={alreadyAdded || limitReached}
                                                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${alreadyAdded ? 'bg-green-100 text-green-500 dark:bg-green-900/30' : limitReached ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-500 hover:bg-violet-500 hover:text-white'}`}
                                                    title={alreadyAdded ? 'Added' : limitReached ? 'Max 4' : 'Add'}
                                                    data-testid={`button-add-track-${result.videoId}`}
                                                  >
                                                    <Plus className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              );
                                            }) : (
                                              <div className="flex items-center justify-center h-full text-[10px] text-slate-400 py-4">
                                                {searchQuery && !isSearching ? 'No results found' : 'Type to search tracks'}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        /* ── PLAYLIST MODE: combined meditation + psychology, scrollable ── */
                                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-1 w-full">
                                          {/* Meditation tracks */}
                                          {meditationTracks.length > 0 && (
                                            <div className="mb-1">
                                              <div className="flex items-center gap-1.5 px-1 mb-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0"></span>
                                                <span className="text-[9px] font-bold text-violet-500 uppercase tracking-widest">Meditation</span>
                                              </div>
                                              {meditationTracks.map(track => (
                                                <div key={track.id} className="group flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full min-w-0 overflow-hidden">
                                                  <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-500 transition-colors flex-shrink-0 cursor-pointer" onClick={() => { setSelectedAudioTrack(track); setIsAudioPlaying(true); }}>
                                                    <Play className="w-2.5 h-2.5 text-violet-500 group-hover:text-white" />
                                                  </div>
                                                  <span className="flex-1 w-0 min-w-0 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate cursor-pointer" onClick={() => { setSelectedAudioTrack(track); setIsAudioPlaying(true); }}>{track.title}</span>
                                                  <span className="text-[9px] font-mono text-slate-400 flex-shrink-0 whitespace-nowrap">{track.duration}</span>
                                                  <button onClick={() => removeTrack("meditation", track.id)} className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0" data-testid={`button-remove-meditation-${track.id}`}>
                                                    <X className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {/* Psychology tracks */}
                                          {psychologyTracks.length > 0 && (
                                            <div>
                                              <div className="flex items-center gap-1.5 px-1 mb-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                                                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Psychology</span>
                                              </div>
                                              {psychologyTracks.map(track => (
                                                <div key={track.id} className="group flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full min-w-0 overflow-hidden">
                                                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-500 transition-colors flex-shrink-0 cursor-pointer" onClick={() => { setSelectedAudioTrack(track); setIsAudioPlaying(true); }}>
                                                    <Play className="w-2.5 h-2.5 text-blue-500 group-hover:text-white" />
                                                  </div>
                                                  <span className="flex-1 w-0 min-w-0 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate cursor-pointer" onClick={() => { setSelectedAudioTrack(track); setIsAudioPlaying(true); }}>{track.title}</span>
                                                  <span className="text-[9px] font-mono text-slate-400 flex-shrink-0 whitespace-nowrap">{track.duration}</span>
                                                  <button onClick={() => removeTrack("psychology", track.id)} className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0" data-testid={`button-remove-psychology-${track.id}`}>
                                                    <X className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {meditationTracks.length === 0 && psychologyTracks.length === 0 && (
                                            <div className="flex items-center justify-center h-full text-[10px] text-slate-400 italic">Tap search to add tracks</div>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer / Now Playing — always visible, never shrinks */}
                                    <div className="flex-shrink-0 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                      <div className="flex items-center gap-2 w-full">
                                        <div className="flex items-center gap-2 flex-1 w-0 min-w-0">
                                          <div className={`w-8 h-8 rounded bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 ${selectedAudioTrack ? "animate-none" : "animate-pulse"}`}>
                                            <Music2 className="w-4 h-4 text-white" />
                                          </div>
                                          <div className="w-0 flex-1 overflow-hidden">
                                            <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100 truncate">
                                              {selectedAudioTrack ? selectedAudioTrack.title : "Select a session"}
                                            </p>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-tighter truncate">
                                              {selectedAudioTrack ? `${isAudioPlaying ? 'Playing' : 'Paused'} • ${selectedAudioTrack.duration}` : "Ready to play"}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Audio Controls */}
                                        <div className="flex items-center gap-0.5 flex-shrink-0">
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100" onClick={() => {
                                            const currentIdx = allAudioTracks.findIndex((t: any) => t.id === selectedAudioTrack?.id);
                                            const prevTrack = allAudioTracks[(currentIdx - 1 + allAudioTracks.length) % allAudioTracks.length];
                                            setSelectedAudioTrack(prevTrack);
                                            setIsAudioPlaying(true);
                                          }}>
                                            <SkipBack className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                            onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                                          >
                                            {isAudioPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100" onClick={() => {
                                            const currentIdx = allAudioTracks.findIndex((t: any) => t.id === selectedAudioTrack?.id);
                                            const nextTrack = allAudioTracks[(currentIdx + 1) % allAudioTracks.length];
                                            setSelectedAudioTrack(nextTrack);
                                            setIsAudioPlaying(true);
                                          }}>
                                            <SkipForward className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Audio Progress Slider */}
                                      <div className="px-1">
                                        <div className="relative w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer" onClick={(e) => { if (selectedAudioTrack && youtubePlayerRef.current && duration > 0) { const rect = e.currentTarget.getBoundingClientRect(); const x = e.clientX - rect.left; const clickedProgress = x / rect.width; const newTime = clickedProgress * duration; youtubePlayerRef.current.seekTo(newTime, true); setCurrentTime(newTime); setAudioProgress(clickedProgress * 100); } } }>
                                          <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-300"
                                            style={{ width: `${selectedAudioTrack ? audioProgress : 0}%` }}
                                          ></div>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400">
                                            {selectedAudioTrack ? new Date(currentTime * 1000).toISOString().substr(14, 5) : "0:00"}
                                          </span>
                                          <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400">
                                            {selectedAudioTrack ? (duration > 0 ? new Date(duration * 1000).toISOString().substr(14, 5) : selectedAudioTrack.duration) : "0:00"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Demo label shown before toggle when demo mode is active */}
                            {heatmapMode === 0 && (
                              <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide select-none">Demo</span>
                            )}
                            {/* 3-state heatmap mode toggle: 0=Demo, 1=Personal-1, 2=Personal-2 */}
                            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded p-0.5" data-testid="heatmap-mode-toggle">
                              {([0, 1, 2] as const).map((mode) => {
                                const labels = ['D', '1', '2'];
                                const titles = ['Demo mode', 'Personal 1', 'Personal 2'];
                                const isActive = heatmapMode === mode;
                                return (
                                  <button
                                    key={mode}
                                    title={titles[mode]}
                                    data-testid={`heatmap-mode-btn-${mode}`}
                                    onClick={() => {
                                      console.log(`🔄 Switching heatmap mode to ${mode}`);
                                      setHasManuallyToggledMode(true);
                                      localStorage.setItem("hasManuallyToggledMode", "true");
                                      setHeatmapMode(mode);
                                      localStorage.setItem("heatmapMode", String(mode));
                                      localStorage.setItem("tradingJournalDemoMode", String(mode === 0));
                                      setSelectedDailyFactors([]);
                                      setSelectedIndicators([]);
                                      if (mode === 2) {
                                        setTradeHistoryData2([]);
                                        setTradeHistoryWindow(2);
                                      } else {
                                        setTradeHistoryData([]);
                                        setTradeHistoryWindow(1);
                                      }
                                      setTradingImages([]);
                                      setTradingDataByDate({});
                                      if (mode === 2) {
                                        setPersonal2HeatmapRevision(prev => prev + 1);
                                      } else {
                                        setPersonalHeatmapRevision(prev => prev + 1);
                                      }
                                      console.log(`✅ Switched to mode ${mode} - CLEARED cache`);
                                    }}
                                    className={`w-5 h-4 rounded text-[9px] font-bold transition-colors ${
                                      isActive
                                        ? mode === 0
                                          ? 'bg-blue-500 text-white'
                                          : mode === 1
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-violet-600 text-white'
                                        : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    {labels[mode]}
                                  </button>
                                );
                              })}
                            </div>
                            <Button
                              onClick={saveAllTradingData}
                              size="sm"
                              variant="outline"
                              disabled={heatmapMode === 0 && localStorage.getItem('currentUserEmail') !== 'chiranjeevi.perala99@gmail.com'}
                              className={`h-5 px-2 text-[10px] border-gray-300 dark:border-gray-700 ${
                                (heatmapMode === 0 && localStorage.getItem('currentUserEmail') !== 'chiranjeevi.perala99@gmail.com')
                                  ? 'text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                              data-testid="button-save-trade-book"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                        {/* ✅ NEW CLEAN HEATMAP IMPLEMENTATION - Separate components for Demo & Personal */}
                        <div className="relative">
                         <div ref={heatmapContainerRef} className="pt-0.5">
                          {heatmapMode === 0 ? (
                            <DemoHeatmap
                              onDateSelect={handleDateSelect}
                              selectedDate={selectedDate}
                              tradingDataByDate={tradingDataByDate}
                              onDataUpdate={(data) => {
                                handleHeatmapDataUpdate(data);
                                // Scroll to latest data for demo mode
                                setTimeout(() => {
                                  if (heatmapContainerRef.current) {
                                    const scrollContainer = heatmapContainerRef.current.querySelector('[style*="overflow"]') as HTMLElement;
                                    if (scrollContainer) {
                                      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
                                      console.log("🎯 Demo heatmap: Scrolled to latest data view");
                                    }
                                  }
                                }, 300);
                              }}
                              onRangeChange={handleDateRangeChange}
                              highlightedDates={activeTagHighlight}
                              refreshTrigger={personalHeatmapRevision}
                              onSelectDateForHeatmap={(symbol, date) => {
                                console.log(`📊 [HOME] Switching to heatmap mode - Symbol: ${symbol}, Date: ${date}`);
                                setJournalChartMode('heatmap');
                                fetchHeatmapChartData(symbol, date);
                              }}
                              onFeedPost={(mode, data) => {
                                setReportPostMode(mode);
                                if (mode === 'selected') {
                                  setReportPostSelectedDate(selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                                }
                                if (mode === 'range' && data) {
                                  setRangePostOverrideData(data);
                                }
                                setShowReportPostDialog(true);
                              }}
                            />
                          ) : heatmapMode === 1 ? (
                            <PersonalHeatmap
                              userId={getUserId()}
                              defaultTitle="Personal"
                              onDateSelect={handleDateSelect}
                              selectedDate={selectedDate}
                              onDataUpdate={handleHeatmapDataUpdate}
                              onRangeChange={handleDateRangeChange}
                              highlightedDates={activeTagHighlight}
                              refreshTrigger={personalHeatmapRevision}
                              initialData={tradingDataByDate}
                              onFeedPost={(mode, data) => {
                                setReportPostMode(mode);
                                if (mode === 'selected') {
                                  setReportPostSelectedDate(heatmapSelectedDate || new Date().toISOString().split('T')[0]);
                                }
                                if (mode === 'range' && data) {
                                  setRangePostOverrideData(data);
                                }
                                setShowReportPostDialog(true);
                              }}
                            />
                          ) : (
                            <PersonalHeatmap
                              userId={(() => { const uid = getUserId(); return uid ? `2_${uid}` : null; })()}
                              defaultTitle="Personal"
                              onDateSelect={handleDateSelect}
                              selectedDate={selectedDate}
                              onDataUpdate={handleHeatmapDataUpdate}
                              onRangeChange={handleDateRangeChange}
                              highlightedDates={activeTagHighlight}
                              refreshTrigger={personal2HeatmapRevision}
                              initialData={tradingDataByDate}
                              onFeedPost={(mode, data) => {
                                setReportPostMode(mode);
                                if (mode === 'selected') {
                                  setReportPostSelectedDate(heatmapSelectedDate || new Date().toISOString().split('T')[0]);
                                }
                                if (mode === 'range' && data) {
                                  setRangePostOverrideData(data);
                                }
                                setShowReportPostDialog(true);
                              }}
                            />
                          )}
                        </div>

                        {/* Curved Lines Overlay - connects FOMO tag block to highlighted dates */}
                        {(activeTagHighlight?.tag === 'fomo' || activeTagHighlight?.tag === 'overtrading' || activeTagHighlight?.tag === 'planned') && activeTagHighlight.dates.length > 0 && (() => {
                          // Force recalculation on scroll (dependency: scrollTrigger)
                          void scrollTrigger;

                          // Calculate curved paths from FOMO button to each highlighted date cell
                          const paths: JSX.Element[] = [];

                          const buttonRef = activeTagHighlight?.tag === 'fomo' ? fomoButtonRef : activeTagHighlight?.tag === 'overtrading' ? overtradingButtonRef : plannedButtonRef;
                          if (!buttonRef.current || !heatmapContainerRef.current) {
                            return null;
                          }

                          // Get scrollable dimensions (like DemoHeatmap does)
                          const scrollWidth = heatmapContainerRef.current.scrollWidth || 0;
                          const scrollHeight = heatmapContainerRef.current.scrollHeight || 0;
                          const scrollLeft = heatmapContainerRef.current.scrollLeft || 0;
                          const scrollTop = heatmapContainerRef.current.scrollTop || 0;

                          // Get positions relative to the heatmap's scrollable content
                          const containerRect = heatmapContainerRef.current.getBoundingClientRect();
                          const buttonRect = buttonRef.current!.getBoundingClientRect();

                          // Calculate button position relative to scrollable content
                          const buttonCenterX = buttonRect.left - containerRect.left + scrollLeft + buttonRect.width / 2;
                          const buttonCenterY = buttonRect.top - containerRect.top + scrollTop + buttonRect.height / 2;

                          // Find all highlighted date cells and draw curved lines to them
                          activeTagHighlight.dates.forEach((date, index) => {
                            // Find the heatmap cell for this date
                            const cellElement = heatmapContainerRef.current?.querySelector(
                              `[data-date="${date}"]`
                            );

                            if (cellElement) {
                              const cellRect = cellElement.getBoundingClientRect();

                              // Calculate cell position relative to scrollable content
                              const cellCenterX = cellRect.left - containerRect.left + scrollLeft + cellRect.width / 2;
                              const cellCenterY = cellRect.top - containerRect.top + scrollTop + cellRect.height / 2;

                              // Create quadratic Bezier curve (Q command)
                              // Control point is positioned to create a nice arc
                              const controlX = (buttonCenterX + cellCenterX) / 2;
                              const controlY = Math.min(buttonCenterY, cellCenterY) - 50; // Arc upward

                              const pathD = `M ${buttonCenterX} ${buttonCenterY} Q ${controlX} ${controlY}, ${cellCenterX} ${cellCenterY}`;

                              paths.push(
                                <g key={`connection-${date}-${index}`}>
                                  {/* Bright colored line with dashed pattern */}
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke={activeTagHighlight?.tag === 'fomo' ? "url(#curvedLineGradient)" : activeTagHighlight?.tag === 'overtrading' ? "url(#overtradingLineGradient)" : "url(#plannedLineGradient)"}
                                    strokeWidth="2.5"
                                    strokeDasharray="6,4"
                                    opacity="0.95"
                                  />
                                  {/* Glowing dot at the end of each line */}
                                  <circle
                                    cx={cellCenterX}
                                    cy={cellCenterY}
                                    r="4"
                                    fill={activeTagHighlight?.tag === 'fomo' ? "#fcd34d" : activeTagHighlight?.tag === 'overtrading' ? "#fb923c" : "#4ade80"}
                                    opacity="0.9"
                                  />
                                  <circle
                                    cx={cellCenterX}
                                    cy={cellCenterY}
                                    r="3"
                                    fill={activeTagHighlight?.tag === 'fomo' ? "#fbbf24" : activeTagHighlight?.tag === 'overtrading' ? "#f97316" : "#22c55e"}
                                    className="animate-pulse"
                                  />
                                </g>
                              );
                            }
                          });

                          return (
                            <svg
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${scrollWidth}px`,
                                height: `${scrollHeight}px`,
                                pointerEvents: 'none',
                                zIndex: 10,
                              }}
                            >
                              {/* Define bright gradient for the curved lines */}
                              <defs>
                                <linearGradient id="curvedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="overtradingLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#fb923c" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="plannedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#16a34a" stopOpacity="1" />
                                </linearGradient>
                              </defs>
                              {paths}
                            </svg>
                          );
                        })()}
                        </div>

                        {/* Quick Stats Banner */}
                        <div className="mt-2 mb-20 md:mb-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-md px-2 py-1.5 relative" data-testid="banner-quick-stats">
                          {(() => {
                            // Calculate metrics from heatmap data and build tag-to-dates mapping
                            const filteredData = getFilteredHeatmapData();
                            const dates = Object.keys(filteredData);
                            let totalPnL = 0;
                            let totalTrades = 0;
                            let winningTrades = 0;
                            let fomoTrades = 0;
                            let consecutiveWins = 0;
                            let maxWinStreak = 0;
                            const trendData: number[] = [];
                            const fomoDates: string[] = [];
                            const overTradingDates: string[] = [];
                            const plannedDates: string[] = [];
                            let plannedCount = 0;
                            const tagStats: Record<string, any> = {};
                            const tagDates: Record<string, string[]> = {};
                            let overTradingCount = 0;

                            dates.sort().forEach(dateKey => {
                              const dayData = filteredData[dateKey];
                              const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
                              const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];

                              if (metrics) {
                                const netPnL = metrics.netPnL || 0;
                                totalPnL += netPnL;
                                totalTrades += metrics.totalTrades || 0;
                                winningTrades += metrics.winningTrades || 0;
                                trendData.push(netPnL);

                                // Track overtrading - check for tag or high trade count
                                if ((metrics.totalTrades || 0) > 10) {
                                  overTradingCount++;
                                  overTradingDates.push(dateKey);
                                }

                                // Also track if overtrading tag exists
                                if (Array.isArray(tags) && tags.length > 0) {
                                  const normalizedTags = tags.map((t: string) => t.trim().toLowerCase());
                                  if (normalizedTags.includes('overtrading')) {
                                    if (!overTradingDates.includes(dateKey)) {
                                      overTradingCount++;
                                      overTradingDates.push(dateKey);
                                    }
                                  }
                                }

                                if (Array.isArray(tags) && tags.length > 0) {
                                  const normalizedTags = tags.map((t: string) => t.trim().toLowerCase());
                                  if (normalizedTags.includes('fomo')) {
                                    fomoTrades++;
                                    fomoDates.push(dateKey);
                                  }
                                  if (normalizedTags.includes('planned')) {
                                    plannedCount++;
                                    plannedDates.push(dateKey);
                                  }
                                  // Track all tags with their dates
                                  normalizedTags.forEach(tag => {
                                    tagStats[tag] = (tagStats[tag] || 0) + 1;
                                    if (!tagDates[tag]) tagDates[tag] = [];
                                    tagDates[tag].push(dateKey);
                                  });
                                }

                                if (netPnL > 0) {
                                  consecutiveWins++;
                                  maxWinStreak = Math.max(maxWinStreak, consecutiveWins);
                                } else if (netPnL < 0) {
                                  consecutiveWins = 0;
                                }
                              }
                            });

                            const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
                            const isProfitable = totalPnL >= 0;
                            const topTags = Object.entries(tagStats)
                              .sort(([,a], [,b]) => (b as number) - (a as number))
                              .slice(0, 3)
                              .map(([tag, count]) => ({ tag, count }));

                            const createSparkline = (data: number[]) => {
                              if (data.length === 0) return '';
                              const max = Math.max(...data);
                              const min = Math.min(...data);
                              const range = max - min || 1;
                              const width = 40;
                              const height = 16;
                              const points = data.map((val, i) => {
                                const x = (i / (data.length - 1 || 1)) * width;
                                const y = height - ((val - min) / range) * height;
                                return `${x},${y}`;
                              }).join(' ');
                              return `M ${points.split(' ').join(' L ')}`;
                            };

                            return (
                              <div className="space-y-2">
                                {/* Header row with stats and menu */}
                                <div className="flex justify-start items-center gap-2">
                                  <div className={`text-white flex-1 flex ${Object.values(visibleStats).filter(v => v).length === 1 ? 'justify-center' : 'justify-around'} items-stretch gap-2`}>
                                    {visibleStats.pnl && (
                                      <div className="flex flex-col items-center justify-center" data-testid="stat-total-pnl">
                                        <div className="text-[10px] opacity-80">P&L</div>
                                        <div className={`text-xs font-bold ${isProfitable ? 'text-green-200' : 'text-red-200'}`}>
                                          {totalPnL >= 0 ? '+' : ''}₹{(totalPnL / 1000).toFixed(1)}K
                                        </div>
                                      </div>
                                    )}
                                    {visibleStats.trend && (
                                      <div className="flex flex-col items-center justify-center" data-testid="stat-trend">
                                        <div className="text-[10px] opacity-80">Trend</div>
                                        <svg width="40" height="16" className="mt-0.5">
                                          <path d={createSparkline(trendData)} fill="none" stroke="white" strokeWidth="1.5" opacity="0.9" />
                                        </svg>
                                      </div>
                                    )}
                                    {visibleStats.fomo && (
                                      <button
                                        ref={fomoButtonRef}
                                        className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${
                                          activeTagHighlight?.tag === 'fomo' ? 'bg-white/30 ring-2 ring-white/50' : ''
                                        }`}
                                        onClick={() => setActiveTagHighlight(activeTagHighlight?.tag === 'fomo' ? null : { tag: 'fomo', dates: fomoDates })}
                                        data-testid="stat-fomo"
                                        title={`Click to ${activeTagHighlight?.tag === 'fomo' ? 'hide' : 'show'} FOMO dates on heatmap`}
                                      >
                                        <div className="text-[10px] opacity-80">FOMO</div>
                                        <div className="text-xs font-bold">{fomoTrades}</div>
                                      </button>
                                    )}
                                    {visibleStats.winRate && (
                                      <div className="flex flex-col items-center justify-center" data-testid="stat-success-rate">
                                        <div className="text-[10px] opacity-80">Win%</div>
                                        <div className="text-xs font-bold">{winRate.toFixed(0)}%</div>
                                      </div>
                                    )}
                                    {visibleStats.streak && (
                                      <div className="flex flex-col items-center justify-center" data-testid="stat-win-streak">
                                        <div className="text-[10px] opacity-80">Streak</div>
                                        <div className="text-xs font-bold">{maxWinStreak}</div>
                                      </div>
                                    )}
                                    {visibleStats.overtrading && (
                                      <button
                                        ref={overtradingButtonRef}
                                        className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${
                                          activeTagHighlight?.tag === 'overtrading' ? 'bg-white/30 ring-2 ring-white/50' : ''
                                        }`}
                                        onClick={() => setActiveTagHighlight(activeTagHighlight?.tag === 'overtrading' ? null : { tag: 'overtrading', dates: overTradingDates })}
                                        data-testid="stat-overtrading"
                                        title={`Click to ${activeTagHighlight?.tag === 'overtrading' ? 'hide' : 'show'} overtrading dates on heatmap`}
                                      >
                                        <div className="text-[10px] opacity-80">OverTrade</div>
                                        <div className="text-xs font-bold text-orange-200">{overTradingCount}</div>
                                      </button>
                                    )}
                                    {visibleStats.planned && (
                                      <button
                                        ref={plannedButtonRef}
                                        className={`flex flex-col items-center justify-center hover-elevate active-elevate-2 rounded px-1 transition-all ${activeTagHighlight?.tag === 'planned' ? 'bg-white/30 ring-2 ring-white/50' : ''}`}
                                        onClick={() => setActiveTagHighlight(activeTagHighlight?.tag === 'planned' ? null : { tag: 'planned', dates: plannedDates })}
                                        data-testid="stat-planned"
                                        title={`Click to ${activeTagHighlight?.tag === 'planned' ? 'hide' : 'show'} planned trade dates on heatmap`}
                                      >
                                        <div className="text-[10px] opacity-80">Planned</div>
                                        <div className="text-xs font-bold text-green-200">{plannedCount}</div>
                                      </button>
                                    )}
                                  </div>

                                  {/* Share Icon */}
                                  <button
                                    className="flex items-center justify-center w-6 h-6 bg-white/20 rounded hover:bg-white/30 transition-colors"
                                    onClick={() => setShowShareDialog(true)}
                                    data-testid="button-share-tradebook"
                                    title="Share tradebook"
                                  >
                                    <Share2 className="w-4 h-4 text-white" />
                                  </button>

                                  {/* 3-Dot Menu Button */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="flex items-center justify-center w-6 h-6 bg-white/20 rounded hover:bg-white/30 transition-colors text-white" data-testid="button-stats-menu">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-3 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                                      <div className="space-y-2">
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-start">
                                          <span>Customize Magic Bar</span>
                                          <span className="text-xs opacity-70">{Object.values(visibleStats).filter(v => v).length}/{window.innerWidth < 768 ? 5 : 6}</span>
                                        </div>
                                        {(() => {
                                          const selectedCount = Object.values(visibleStats).filter(v => v).length;
                                          const magicBarLimit = window.innerWidth < 768 ? 5 : 6;
                                          const isAtLimit = selectedCount >= magicBarLimit;
                                          const handleCheckChange = (field: string, checked: boolean) => {
                                            if (checked && isAtLimit) return;
                                            const updated = {...visibleStats, [field]: checked}; setVisibleStats(updated); localStorage.setItem("magicBarPrefs", JSON.stringify(updated));
                                          };
                                          return (
                                            <div className="flex flex-col gap-2">
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.pnl && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.pnl} onChange={(e) => handleCheckChange('pnl', e.target.checked)} disabled={!visibleStats.pnl && isAtLimit} className="rounded" />
                                                P&L
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.trend && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.trend} onChange={(e) => handleCheckChange('trend', e.target.checked)} disabled={!visibleStats.trend && isAtLimit} className="rounded" />
                                                Trend
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.fomo && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.fomo} onChange={(e) => handleCheckChange('fomo', e.target.checked)} disabled={!visibleStats.fomo && isAtLimit} className="rounded" />
                                                FOMO
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.winRate && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.winRate} onChange={(e) => handleCheckChange('winRate', e.target.checked)} disabled={!visibleStats.winRate && isAtLimit} className="rounded" />
                                                Win Rate
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.streak && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.streak} onChange={(e) => handleCheckChange('streak', e.target.checked)} disabled={!visibleStats.streak && isAtLimit} className="rounded" />
                                                Streak
                                              </label>
                                              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.overtrading && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.overtrading} onChange={(e) => handleCheckChange('overtrading', e.target.checked)} disabled={!visibleStats.overtrading && isAtLimit} className="rounded" />
                                                Overtrading
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.planned && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.planned} onChange={(e) => handleCheckChange('planned', e.target.checked)} disabled={!visibleStats.planned && isAtLimit} className="rounded" />
                                                Planned
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.topTags && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.topTags} onChange={(e) => handleCheckChange('topTags', e.target.checked)} disabled={!visibleStats.topTags && isAtLimit} className="rounded" />
                                                Top Tags
                                              </label>
                                              <label className={`flex items-center gap-2 text-sm p-1.5 rounded ${!visibleStats.aiAnalysis && isAtLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white dark:bg-slate-800/50'}`}>
                                                <input type="checkbox" checked={visibleStats.aiAnalysis} onChange={(e) => handleCheckChange('aiAnalysis', e.target.checked)} disabled={!visibleStats.aiAnalysis && isAtLimit} className="rounded" />
                                                AI Analysis
                                              </label>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                {/* Top Tags Block with Curved Lines */}
                                {visibleStats.topTags && topTags.length > 0 && (
                                  <div className="bg-white/10 rounded px-2 py-1 text-xs text-white">
                                    <div className="opacity-80 mb-1">Top Tags:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {topTags.map(({tag, count}) => (
                                        <button
                                          key={tag}
                                          className={`hover-elevate active-elevate-2 rounded px-2 py-0.5 text-xs transition-all ${
                                            activeTagHighlight?.tag === tag ? 'bg-white/50 ring-2 ring-white/50' : 'bg-white/20'
                                          }`}
                                          onClick={() => setActiveTagHighlight(activeTagHighlight?.tag === tag ? null : { tag, dates: tagDates[tag] || [] })}
                                          data-testid={`stat-toptag-${tag}`}
                                        >
                                          {tag} <span className="text-black">({count as number})</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* AI Analysis Block - Static Text Only */}
                                {visibleStats.aiAnalysis && (
                                  <div className="bg-white/10 rounded px-2 py-1 text-xs text-white">
                                    <span className="opacity-80">AI Insight: </span>
                                    <span className="italic text-blue-200">
                                      {totalTrades > 0 ? (winRate > 60 ? "Strong performance detected" : winRate > 50 ? "Balanced trading pattern" : "Risk management recommended") : "No data yet"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                    </div>

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

                            const fmtCompact = (n: number) => {
                              const abs = Math.abs(n);
                              const sign = n < 0 ? '-' : '';
                              if (abs >= 10_000_000) return `${sign}${(abs / 10_000_000).toFixed(2)}Cr`;
                              if (abs >= 100_000)    return `${sign}${(abs / 100_000).toFixed(2)}L`;
                              if (abs >= 1_000)      return `${sign}${(abs / 1_000).toFixed(2)}K`;
                              return `${sign}${abs.toFixed(2)}`;
                            };

                            const metrics = [
                              {
                                label: "Trading Days",
                                value: String(totalDays),
                                icon: Calendar,
                                color: "from-blue-500 to-indigo-600",
                                textColor: "text-blue-600",
                              },
                              {
                                label: "Best Day",
                                value: `₹${fmtCompact(maxProfit)}`,
                                icon: TrendingUp,
                                color: "from-emerald-500 to-green-600",
                                textColor: "text-emerald-600",
                              },
                              {
                                label: "Profitable Days",
                                value: String(profitableDays),
                                icon: Target,
                                color: "from-violet-500 to-purple-600",
                                textColor: "text-violet-600",
                              },
                              {
                                label: "Avg Daily P&L",
                                value: `${avgDailyPnL < 0 ? '-' : ''}₹${fmtCompact(Math.abs(avgDailyPnL))}`,
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
                                <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0">
                                  <div
                                    className={`w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center md:mb-4 shadow-lg flex-shrink-0`}
                                  >
                                    <metric.icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0 md:space-y-1">
                                    <div
                                      className={`text-sm md:text-2xl font-bold ${metric.textColor} truncate`}
                                    >
                                      {metric.value}
                                    </div>
                                    <div className="text-[10px] md:text-sm text-slate-600 dark:text-slate-400 leading-tight">
                                      {metric.label}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

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
                          influencerPeriod={influencerPeriod}
                        />

                        {/* Trade Duration Analysis */}
                        <TradeDurationAnalysis
                          filteredHeatmapData={filteredHeatmapData}
                          theme={theme}
                        />

                        {/* Risk Management Analysis Window */}
                        <div className="col-span-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-4 md:p-8 text-white shadow-2xl mt-6">
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

                            // Chart data - last 30 trading days
                            const recentDayMetrics = dayMetrics.slice(-30);
                            const formatDateLabel = (dateStr: string) => {
                              const parts = dateStr.split('-').map(Number);
                              const month = parts[1];
                              const day = parts[2];
                              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                              return `${months[month - 1]} ${day}`;
                            };
                            const chartData = recentDayMetrics.map(d => ({
                              day: formatDateLabel(d.date),
                              pnl: d.netPnL,
                              target: targetReward,
                              risk: -riskCapital,
                            }));
                            const xAxisInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1);

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
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                                    <div className="text-lg md:text-2xl font-bold truncate">{totalDays > 0 ? `${daysMetRR}/${totalDays}` : '—'}</div>
                                    <div className="text-xs md:text-sm opacity-80 mt-1">Days Met R:R</div>
                                    <div className="text-[10px] opacity-60 mt-0.5">{totalDays > 0 ? `${((daysMetRR / totalDays) * 100).toFixed(0)}% success` : 'No data'}</div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                                    <div className="text-lg md:text-2xl font-bold text-red-300">{daysBreachedRisk}</div>
                                    <div className="text-xs md:text-sm opacity-80 mt-1">Risk Breached</div>
                                    <div className="text-[10px] opacity-60 mt-0.5">{totalDays > 0 ? `${((daysBreachedRisk / totalDays) * 100).toFixed(0)}% of days` : 'No data'}</div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                                    <div className={`text-lg md:text-2xl font-bold ${capitalTrend === 'increasing' ? 'text-emerald-300' : capitalTrend === 'declining' ? 'text-red-300' : 'text-white'}`}>
                                      {capitalTrend === 'no data' ? '—' : capitalTrend === 'increasing' ? '↑' : capitalTrend === 'declining' ? '↓' : '→'}
                                    </div>
                                    <div className="text-xs md:text-sm opacity-80 mt-1">Capital Trend</div>
                                    <div className="text-[10px] opacity-60 mt-0.5 capitalize">{capitalTrend}</div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                                    <div className="text-lg md:text-2xl font-bold text-emerald-300">{daysProfitable}</div>
                                    <div className="text-xs md:text-sm opacity-80 mt-1">Profitable Days</div>
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
                                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.6)' }} tickLine={false} axisLine={false} interval={xAxisInterval} />
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

        {/* Journal Screen Time floating tracker */}
        <JournalScreenTime tradingDataByDate={tradingDataByDate} />

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
