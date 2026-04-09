import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  lazy,
  Suspense,
  startTransition,
} from "react";
import { Countdown } from '@/components/countdown';

import { motion, AnimatePresence } from "framer-motion";

const WatchlistResultTab = lazy(() => import('@/components/WatchlistResultTab').then(m => ({ default: m.WatchlistResultTab })));


const BrokerData = lazy(() => import("@/components/broker-data").then(m => ({ default: m.BrokerData })));
import { useLocation } from "wouter";

import { useToast } from "@/hooks/use-toast";

import { AuthButtonAngelOne, AngelOneStatus, AngelOneApiStatistics, AngelOneSystemStatus, AngelOneLiveMarketPrices } from "@/components/auth-button-angelone";

import { AuthButtonUpstox } from "@/components/auth-button-upstox";
import { TradingJournalModal } from "@/components/trading-journal-modal";
const PaperTradingModal = lazy(() => import("@/components/PaperTradingModal").then(m => ({ default: m.PaperTradingModal })));
const PaperTradingMobileTab = lazy(() => import("@/components/PaperTradingMobileTab").then(m => ({ default: m.PaperTradingMobileTab })));

// REMOVED: All Fyers-related imports
// import { AuthButton } from "@/components/auth-button";

// import { ConnectionStatus } from "@/components/connection-status";

// import { MonthlyProgressTracker } from "@/components/monthly-progress-tracker";

// import { ApiStatistics } from "@/components/api-statistics";

// import { ErrorPanel } from "@/components/error-panel";


const AdvancedCandlestickChart = lazy(() => import("@/components/advanced-candlestick-chart").then(m => ({ default: m.AdvancedCandlestickChart })));
const IndicatorCrossingsDisplay = lazy(() => import("@/components/indicator-crossings-display").then(m => ({ default: m.IndicatorCrossingsDisplay })));
import NeoFeedSocialFeed from "@/components/neofeed-social-feed";
const TradingMaster = lazy(() => import("@/components/trading-master").then(m => ({ default: m.TradingMaster })));
const MiniCastTab = lazy(() => import("@/components/MiniCastTab").then(m => ({ default: m.MiniCastTab })));
import { TradingDashboardTab } from "@/components/TradingDashboardTab";

import type { MultipleImageUploadRef } from "@/components/multiple-image-upload";
import { WorldMap } from "@/components/world-map";

const NeoFeedPostDialog = lazy(() => import("@/components/NeoFeedPostDialog").then(m => ({ default: m.NeoFeedPostDialog })));
const ShareReportTradebookDialog = lazy(() => import("@/components/ShareReportTradebookDialog").then(m => ({ default: m.ShareReportTradebookDialog })));
const ImportPnLDialog = lazy(() => import("@/components/ImportPnLDialog").then(m => ({ default: m.ImportPnLDialog })));


import { useTheme } from "@/components/theme-provider";

import { useCurrentUser } from "@/hooks/useCurrentUser";


import { cognitoSignOut, getCognitoToken, sendEmailVerificationCode, confirmEmailVerification, checkEmailVerified } from "@/cognito";

import type { IChartApi, ISeriesApi, CandlestickSeries, LineSeries, HistogramSeries, IPriceLine } from 'lightweight-charts';

import { ArrowLeft, Banknote, Clock, ExternalLink, Info, Loader2, LogOut, Newspaper, RefreshCw, Save, TrendingUp, Award, Headset, X, Play, Music2, Pencil, CheckCircle, Activity, Bitcoin, Wallet } from "lucide-react";

import { parseBrokerTrades, ParseError } from "@/utils/trade-parser";

import { useJournalChartLogic } from "@/hooks/useJournalChartLogic";


// Global window type declaration for audio control
declare global {
  interface Window {
    stopNewsAudio?: () => void;
  }
}

import {

  PriceChangeAnimation,
  TradeExecutionAnimation,
  VolumeSpikeAnimation,
  MarketStatusPulse,
  ProfitLossAnimation,
  CandlestickAnimation,
  MarketDataSkeleton,
} from "@/components/micro-animations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {

  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";


import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import {

  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {

  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {

  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {

  TrendingDown,
  Calendar,
  BarChart3,
  
  Pause,
  RotateCcw,
  RotateCw,
  DollarSign,
  Zap,
  Sun,
  Moon,
  GraduationCap,
  Download,
  Mic,
  MessageCircle,
  BookOpen,
  Receipt,
  Home as HomeIcon,
  Search,
  Code,
  PenTool,
  Target,
  Grid3X3,
  Send,
  Sparkles,
  Users,
  Upload,
  Timer,
  Edit,
  Check,
  Mail,
  
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Trash2,
  AlertTriangle,
  Flame,
  AlertCircle,
  Shield,
  Bot,
  User,
  SkipBack,
  SkipForward,
  Heart,
  Lightbulb,
  Star,
  FileText,
  Bell,
  Briefcase,
  PieChart,
  Lock,
  Trophy,
  Radio,
  Eye,
  EyeOff,
  Blocks,
  Hammer,
  Plus,
  Share2,
  Copy,
  Link2,
  Facebook,
  Linkedin,
  Twitter,
  Bug, Settings,
  Filter,
  RefreshCcw,
  MoreVertical,
  ChevronsUpDown,
  CalendarDays,
  Brain,
  ShieldCheck,
  Bookmark,
  Volume2,
  Globe,
  Cpu,
  Building2,
  Car,
  Layers,
  Headphones,
  UserPlus,
  Hash,
} from "lucide-react";
const AIChatWindow = lazy(() => import("@/components/ai-chat-window").then(m => ({ default: m.AIChatWindow })));
const TradingNotesWindow = lazy(() => import("@/components/TradingNotesWindow").then(m => ({ default: m.TradingNotesWindow })));
const JournalAIReportPanel = lazy(() => import("@/components/JournalAIReportPanel").then(m => ({ default: m.JournalAIReportPanel })));
const SocialFeedInsightsPanel = lazy(() => import("@/components/SocialFeedInsightsPanel").then(m => ({ default: m.SocialFeedInsightsPanel })));
import { usePaperTrading } from "@/hooks/usePaperTrading";
import { JournalTabContent } from "./JournalTabContent";

import type { BrokerTrade } from "@shared/schema";

// Module-level voice constants — defined once, never recreated on renders
const VOICES_BY_LANGUAGE: { [key: string]: Array<{ id: string; name: string; description: string; gender: string }> } = {
  en: [{ id: 'en-IN-PrabhatNeural', name: 'Prabhat', description: 'Indian English', gender: 'Male' }, { id: 'en-IN-NeerjaNeural', name: 'Neerja', description: 'Indian English', gender: 'Female' }],
  hi: [{ id: 'hi-IN-MadhurNeural', name: 'Madhur', description: 'Natural Hindi', gender: 'Male' }, { id: 'hi-IN-SwaraNeural', name: 'Swara', description: 'Natural Hindi', gender: 'Female' }],
  bn: [{ id: 'bn-IN-BashkarNeural', name: 'Bashkar', description: 'Natural Bengali', gender: 'Male' }, { id: 'bn-IN-TanishaaNeural', name: 'Tanishaa', description: 'Natural Bengali', gender: 'Female' }],
  ta: [{ id: 'ta-IN-ValluvarNeural', name: 'Valluvar', description: 'Natural Tamil', gender: 'Male' }, { id: 'ta-IN-PallaviNeural', name: 'Pallavi', description: 'Natural Tamil', gender: 'Female' }],
  te: [{ id: 'te-IN-MohanNeural', name: 'Mohan', description: 'Natural Telugu', gender: 'Male' }, { id: 'te-IN-ShrutiNeural', name: 'Shruti', description: 'Natural Telugu', gender: 'Female' }],
  mr: [{ id: 'mr-IN-ManoharNeural', name: 'Manohar', description: 'Natural Marathi', gender: 'Male' }, { id: 'mr-IN-AarohiNeural', name: 'Aarohi', description: 'Natural Marathi', gender: 'Female' }],
  gu: [{ id: 'gu-IN-NiranjanNeural', name: 'Niranjan', description: 'Natural Gujarati', gender: 'Male' }, { id: 'gu-IN-DhwaniNeural', name: 'Dhwani', description: 'Natural Gujarati', gender: 'Female' }],
  kn: [{ id: 'kn-IN-GaganNeural', name: 'Gagan', description: 'Natural Kannada', gender: 'Male' }, { id: 'kn-IN-SapnaNeural', name: 'Sapna', description: 'Natural Kannada', gender: 'Female' }],
  ml: [{ id: 'ml-IN-MidhunNeural', name: 'Midhun', description: 'Natural Malayalam', gender: 'Male' }, { id: 'ml-IN-SobhanaNeural', name: 'Sobhana', description: 'Natural Malayalam', gender: 'Female' }],
  pa: [{ id: 'hi-IN-MadhurNeural', name: 'Madhur', description: 'Punjabi (Hindi voice)', gender: 'Male' }, { id: 'hi-IN-SwaraNeural', name: 'Swara', description: 'Punjabi (Hindi voice)', gender: 'Female' }],
  or: [{ id: 'bn-IN-BashkarNeural', name: 'Bashkar', description: 'Odia (Bengali voice)', gender: 'Male' }, { id: 'bn-IN-TanishaaNeural', name: 'Tanishaa', description: 'Odia (Bengali voice)', gender: 'Female' }],
};
const LANGUAGE_SCRIPTS: { [key: string]: string } = {
  en: 'A', hi: 'हि', bn: 'বা', ta: 'த', te: 'తె', mr: 'मर', gu: 'ગુ', kn: 'ಕ', ml: 'മ', pa: 'ਪੰ', or: 'ଓ',
};

// Type definitions for stock data and trading
interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string | number;
  marketCap: string;
  pe: number;
  high: number;
  low: number;
  open: number;
  sentiment: {
    trend?: string;
    confidence?: string;
    score?: number;
  } | null;
  indicators: {
    rsi?: string;
    ema50?: string;
    macd?: string;
  } | null;
}

interface TradeMarker {
  candleIndex: number;
  price: number;
  type: "buy" | "sell";
  symbol: string;
  quantity: number;
  time: string;
  pnl: string;
}

// SwipeableCardStack Component
interface SwipeableCardStackProps {
  onSectorChange: (sector: string) => void;
  selectedSector: string;
  onCardIndexChange?: (index: number) => void;
  currentCardIndex?: number;
  voiceLanguage?: string;
}

function SwipeableCardStack({
  onSectorChange,
  selectedSector,
  onCardIndexChange,
  currentCardIndex = 0,
  voiceLanguage = 'en',
}: SwipeableCardStackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentContent, setCurrentContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);
  // Preload cache: `${sector}-${lang}-${speaker}` → blob URL
  const audioCacheRef = React.useRef<Map<string, string>>(new Map());
  // Track in-progress preloads to avoid duplicate fetches
  const preloadingRef = React.useRef<Set<string>>(new Set());
  // Cache news text by sector — avoids repeated /api/stock-news fetches for same sector
  const newsTextCacheRef = React.useRef<Map<string, string>>(new Map());
  // Track in-progress news fetches to avoid duplicate requests
  const newsFetchingRef = React.useRef<Map<string, Promise<string>>>(new Map());
  // Monotonic counter — incremented on every fetchAndPlayContent call.
  // Lets the async callback detect if a newer swipe superseded it and skip playback.
  const fetchRequestIdRef = React.useRef(0);

  const [cards, setCards] = useState([
    {
      id: 1,
      title: "TECH NEWS",
      subtitle: "Latest in\ntechnology",
      buttonText: "Play",
      gradient: "from-blue-500 to-blue-600",
      buttonColor: "text-blue-600",
      icon: "💻",
      sector: "IT",
    },
    {
      id: 2,
      title: "FINANCE NEWS",
      subtitle: "Market updates\n& trends",
      buttonText: "Listen",
      gradient: "from-green-500 to-green-600",
      buttonColor: "text-green-600",
      icon: "📈",
      sector: "FINANCE",
    },
    {
      id: 3,
      title: "COMMODITY NEWS",
      subtitle: "Commodity\nmarket trends",
      buttonText: "Listen",
      gradient: "from-orange-500 to-orange-600",
      buttonColor: "text-orange-600",
      icon: "🏗️",
      sector: "COMMODITY",
    },
    {
      id: 4,
      title: "GLOBAL NEWS",
      subtitle: "World events\n& updates",
      buttonText: "Listen",
      gradient: "from-purple-500 to-purple-600",
      buttonColor: "text-purple-600",
      icon: "🌍",
      sector: "GLOBAL",
    },
    {
      id: 5,
      title: "BANKING NEWS",
      subtitle: "Banking sector\nupdates",
      buttonText: "Listen",
      gradient: "from-indigo-500 to-indigo-600",
      buttonColor: "text-indigo-600",
      icon: "🏦",
      sector: "BANKS",
    },
    {
      id: 6,
      title: "AUTO NEWS",
      subtitle: "Automotive\nindustry news",
      buttonText: "Listen",
      gradient: "from-red-500 to-red-600",
      buttonColor: "text-red-600",
      icon: "🚗",
      sector: "AUTOMOBILE",
    },
  ]);

  // Sector to stock symbol mapping for real news fetching
  const SECTOR_NEWS_SYMBOL: Record<string, string> = {
    IT: 'TCS',
    FINANCE: 'NIFTY',
    COMMODITY: 'GOLD',
    GLOBAL: 'SENSEX',
    BANKS: 'BANKNIFTY',
    AUTOMOBILE: 'TATAMOTORS',
  };

  // All supported languages with their default Microsoft Neural voices
  // (matches the language map in server/tts-service.ts)
  const ALL_LANGUAGES: Record<string, string> = {
    'en': 'en-IN-NeerjaNeural',
    'hi': 'hi-IN-MadhurNeural',
    'bn': 'bn-IN-BashkarNeural',
    'ta': 'ta-IN-ValluvarNeural',
    'te': 'te-IN-MohanNeural',
    'mr': 'mr-IN-ManoharNeural',
    'gu': 'gu-IN-DhwaniNeural',
    'kn': 'kn-IN-GaganNeural',
    'ml': 'ml-IN-MidhunNeural',
  };

  // Build cache key — always keyed to a specific lang+speaker so every voice has its own slot
  // IMPORTANT: always prioritize localStorage over the closed-over prop to avoid stale closures
  const getCacheKey = (sector: string, lang?: string, speaker?: string) => {
    const l = lang || localStorage.getItem('voiceLanguage') || voiceLanguage || 'en';
    const s = speaker || localStorage.getItem('activeVoiceProfileId') || ALL_LANGUAGES[l] || 'en-IN-NeerjaNeural';
    return `${sector}-${l}-${s}`;
  };

  // Fetch news text for a sector — cached so repeated calls for the same sector
  // (e.g. when preloading multiple languages) only hit the network once.
  const buildNewsText = async (sector: string): Promise<string> => {
    // 1. Memory cache hit — instant
    const cached = newsTextCacheRef.current.get(sector);
    if (cached) return cached;

    // 2. In-flight dedup — attach to the running promise instead of starting a new fetch
    const inflight = newsFetchingRef.current.get(sector);
    if (inflight) return inflight;

    // 3. Fresh fetch
    const symbol = SECTOR_NEWS_SYMBOL[sector] || 'NIFTY';
    const fetchPromise = (async (): Promise<string> => {
      try {
        const res = await fetch(`/api/stock-news/${symbol}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.news || []);
        const headlines = items
          .slice(0, 3)
          .map((item: any) => {
            const title = (item.title || '').trim();
            return title.length > 120 ? title.substring(0, 117) + '...' : title;
          })
          .filter(Boolean);
        const text = headlines.length === 0
          ? `${sector} market update. Trading activity is ongoing.`
          : headlines.join('. ') + '.';
        newsTextCacheRef.current.set(sector, text);
        return text;
      } catch {
        const fallback = `${sector} market update. Trading activity is ongoing.`;
        newsTextCacheRef.current.set(sector, fallback);
        return fallback;
      } finally {
        newsFetchingRef.current.delete(sector);
      }
    })();

    newsFetchingRef.current.set(sector, fetchPromise);
    return fetchPromise;
  };

  // Generate TTS audio blob URL — accepts explicit lang/speaker for cross-language preloading
  const buildAudioUrl = async (text: string, lang?: string, speaker?: string): Promise<string | null> => {
    const cleanText = text
      .replace(/^(good morning|good afternoon|good evening|hello|hi|welcome)/gi, '')
      .replace(/^(ladies and gentlemen|dear listeners|in today's news)/gi, '')
      .replace(/^[.,\s]+/, '')
      .trim();
    if (!cleanText) return null;

    const useLang = lang || localStorage.getItem('voiceLanguage') || voiceLanguage || 'en';
    const useSpeaker = speaker || localStorage.getItem('activeVoiceProfileId') || ALL_LANGUAGES[useLang] || 'en-IN-NeerjaNeural';

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, language: useLang, speaker: useSpeaker, speed: 1.0, pitch: 1.0 }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.audioBase64) return null;

      const base64Data = data.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      return URL.createObjectURL(audioBlob);
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.warn('[buildAudioUrl] TTS fetch error:', err?.message || err);
      return null;
    }
  };

  // Silently preload audio for a sector in a specific language
  const preloadForSectorAndLang = React.useCallback(async (sector: string, lang: string, speaker: string) => {
    const cacheKey = getCacheKey(sector, lang, speaker);
    if (audioCacheRef.current.has(cacheKey)) return;
    if (preloadingRef.current.has(cacheKey)) return;
    preloadingRef.current.add(cacheKey);
    try {
      const text = await buildNewsText(sector);
      const url = await buildAudioUrl(text, lang, speaker);
      if (url) {
        // Revoke any old URL for this key before replacing (prevents memory leak)
        const old = audioCacheRef.current.get(cacheKey);
        if (old) URL.revokeObjectURL(old);
        audioCacheRef.current.set(cacheKey, url);
        console.log(`[PRELOAD] ✅ Cached ${sector} [${lang}]`);
      }
    } catch (e) {
      console.error(`[PRELOAD] Failed for ${sector} [${lang}]:`, e);
    } finally {
      preloadingRef.current.delete(cacheKey);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Preload audio for the current language (uses active voice profile)
  const preloadForSector = React.useCallback(async (sector: string) => {
    const lang = localStorage.getItem('voiceLanguage') || voiceLanguage || 'en';
    const speaker = localStorage.getItem('activeVoiceProfileId') || ALL_LANGUAGES[lang] || 'en-IN-NeerjaNeural';
    const cacheKey = getCacheKey(sector, lang, speaker);
    if (audioCacheRef.current.has(cacheKey)) return;
    if (preloadingRef.current.has(cacheKey)) return;
    preloadingRef.current.add(cacheKey);
    console.log(`[PRELOAD] Background preloading ${sector} [${lang}]...`);
    try {
      const text = await buildNewsText(sector);
      const url = await buildAudioUrl(text, lang, speaker);
      if (url) {
        // Revoke any old URL for this key before replacing (prevents memory leak)
        const old = audioCacheRef.current.get(cacheKey);
        if (old) URL.revokeObjectURL(old);
        audioCacheRef.current.set(cacheKey, url);
        console.log(`[PRELOAD] ✅ Cached ${sector} [${lang}]`);
      }
    } catch (e) {
      console.error(`[PRELOAD] Failed for ${sector}:`, e);
    } finally {
      preloadingRef.current.delete(cacheKey);
    }
  }, []);

  // Global cleanup function to stop all audio
  const globalStopAudio = React.useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Play audio via Microsoft Edge TTS backend
  const playAudio = async (text: string) => {
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    const cleanText = text
      .replace(/^(good morning|good afternoon|good evening|hello|hi|welcome)/gi, "")
      .replace(/^(ladies and gentlemen|dear listeners|in today's news)/gi, "")
      .replace(/^[.,\s]+/, "")
      .trim();

    if (!cleanText) return;

    setIsPlaying(true);
    try {
      const savedVoiceId = localStorage.getItem('activeVoiceProfileId') || 'en-US-AriaNeural';
      const savedLanguage = localStorage.getItem('voiceLanguage') || voiceLanguage || 'en';

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          language: savedLanguage,
          speaker: savedVoiceId,
          speed: 1.0,
          pitch: 1.0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const base64Data = data.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;
          audio.onended = () => {
            setIsPlaying(false);
            currentAudioRef.current = null;
          };
          audio.play().catch((err) => {
            console.error('[TTS] Audio play error:', err);
            setIsPlaying(false);
          });
        }
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('[TTS] Error:', error);
      setIsPlaying(false);
    }
  };

  // Stop audio playback
  const stopAudio = () => {
    globalStopAudio();
  };

  // Helper: play a blob URL immediately
  const playBlobUrl = (url: string) => {
    setIsPlaying(true);
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    audio.onended = () => { setIsPlaying(false); currentAudioRef.current = null; };
    audio.play().catch(err => { console.error('[TTS] Audio play error:', err); setIsPlaying(false); });
  };

  // Fetch real latest news for the current card sector (same source as Market News tab)
  const fetchAndPlayContent = async (cardTitle: string, sector: string) => {
    globalStopAudio();
    setCurrentContent("");

    // Claim a unique ID for this invocation. Any older async fetch that finishes
    // later will see its ID is stale and will NOT play — fixing the alternating bug
    // where a previous slow fetch would play over the card the user actually swiped to.
    const myId = ++fetchRequestIdRef.current;
    const isStale = () => fetchRequestIdRef.current !== myId;

    const cacheKey = getCacheKey(sector);

    // ── 1. Cache hit: play instantly ───────────────────────────────────────
    const cachedUrl = audioCacheRef.current.get(cacheKey);
    if (cachedUrl) {
      if (isStale()) return;
      console.log(`[CACHE HIT] ✅ Instant play for ${sector}`);
      playBlobUrl(cachedUrl);
      return;
    }

    // ── 2. Preload in-flight: wait for it instead of starting a duplicate ──
    if (preloadingRef.current.has(cacheKey)) {
      console.log(`[PRELOAD WAIT] ⏳ Preload running for ${sector}, attaching…`);
      setIsLoading(true);
      await new Promise<void>((resolve) => {
        const poll = setInterval(() => {
          if (!preloadingRef.current.has(cacheKey)) {
            clearInterval(poll);
            resolve();
          }
        }, 150);
        // Safety timeout — 15 s max
        setTimeout(() => { clearInterval(poll); resolve(); }, 15000);
      });
      setIsLoading(false);
      if (isStale()) return;
      const readyUrl = audioCacheRef.current.get(cacheKey);
      if (readyUrl) {
        console.log(`[PRELOAD WAIT] ✅ Preload finished, playing for ${sector}`);
        playBlobUrl(readyUrl);
        return;
      }
      // Preload failed — fall through to fresh generation
    }

    // ── 3. Cache miss + no preload: generate now ───────────────────────────
    try {
      setIsLoading(true);
      const content = await buildNewsText(sector);
      if (isStale()) { setIsLoading(false); return; }
      setCurrentContent(content);
      setIsLoading(false);

      const url = await buildAudioUrl(content);
      if (isStale()) return;
      if (url) {
        audioCacheRef.current.set(cacheKey, url);
        playBlobUrl(url);
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  // skipAutoPlay=true when the caller already triggered fetchAndPlayContent inside
  // the user-gesture handler (before any setTimeout) to preserve browser autoplay policy.
  const swipeCard = (direction: "left" | "right", skipAutoPlay = false) => {
    // Immediately stop current audio and clear old content (prevent flashback)
    if (!skipAutoPlay) globalStopAudio();
    setCurrentContent("");

    let nextCard: any = null;
    let nextNextCard: any = null;
    let nextIndex = currentCardIndex;

    setCards((prev) => {
      const newCards = [...prev];

      if (direction === "right") {
        const topCard = newCards.shift();
        if (topCard) newCards.push(topCard);
        nextIndex = (currentCardIndex + 1) % 7;
      } else {
        const bottomCard = newCards.pop();
        if (bottomCard) newCards.unshift(bottomCard);
        nextIndex = (currentCardIndex - 1 + 7) % 7;
      }

      if (newCards.length > 0) nextCard = newCards[0];
      if (newCards.length > 1) nextNextCard = newCards[1];

      return newCards;
    });

    if (nextCard) {
      if (onCardIndexChange) onCardIndexChange(nextIndex);

      // Kick off preload immediately (no-op if already cached or in-flight)
      preloadForSector(nextCard.sector);

      // Auto-play the new top card. When skipAutoPlay=true the caller already
      // called fetchAndPlayContent directly inside the user-gesture handler so
      // we must NOT call it again (that would increment fetchRequestIdRef and
      // mark the in-flight fetch as stale, silently cancelling playback).
      if (!skipAutoPlay) fetchAndPlayContent(nextCard.title, nextCard.sector);

      // Warm the card after that in the background
      if (nextNextCard) {
        setTimeout(() => preloadForSector(nextNextCard.sector), 800);
      }
    }
  };

  // Expose global stop function to window for tab switching
  React.useEffect(() => {
    window.stopNewsAudio = globalStopAudio;

    return () => {
      delete window.stopNewsAudio;
    };
  }, [globalStopAudio]);

  // Expose preload functions so parent can trigger card preloading when language or voice changes
  React.useEffect(() => {
    // Called when language changes — preloads all sectors in the new language
    (window as any)._preloadSwipeCardsForLang = (lang: string) => {
      const speaker = localStorage.getItem('activeVoiceProfileId') || ALL_LANGUAGES[lang] || 'en-IN-NeerjaNeural';
      cards.forEach((card) => {
        preloadForSectorAndLang(card.sector, lang, speaker);
      });
    };

    // Called when voice profile changes — preloads all sectors for current lang + new speaker,
    // then all other languages in the background so any future language switch is instant too
    (window as any)._preloadSwipeCardsForVoice = (speaker: string, lang?: string) => {
      const activeLang = lang || localStorage.getItem('voiceLanguage') || 'en';
      // Phase 1: current language immediately (tight stagger)
      cards.forEach((card, i) => {
        if (i === 0) {
          preloadForSectorAndLang(card.sector, activeLang, speaker);
        } else {
          setTimeout(() => preloadForSectorAndLang(card.sector, activeLang, speaker), i * 400);
        }
      });
      // Phase 2: all other languages with new speaker in background
      const otherLangs = Object.entries(ALL_LANGUAGES).filter(([l]) => l !== activeLang);
      let jobIndex = 0;
      otherLangs.forEach(([l]) => {
        cards.forEach((card) => {
          const delay = 8000 + jobIndex * 2000;
          setTimeout(() => preloadForSectorAndLang(card.sector, l, speaker), delay);
          jobIndex++;
        });
      });
      console.log(`[VOICE CHANGE] Preloading ${cards.length} sectors for speaker=${speaker} lang=${activeLang}`);
    };

    return () => {
      delete (window as any)._preloadSwipeCardsForLang;
      delete (window as any)._preloadSwipeCardsForVoice;
    };
  }, [cards, preloadForSectorAndLang]);

  // Listen for voice profile changes and immediately re-preload all sectors
  React.useEffect(() => {
    const handleVoiceProfileChange = (e: Event) => {
      const speaker = (e as CustomEvent).detail?.speaker;
      if (!speaker) return;
      if ((window as any)._preloadSwipeCardsForVoice) {
        (window as any)._preloadSwipeCardsForVoice(speaker);
      }
    };
    window.addEventListener('perala-voice-profile-change', handleVoiceProfileChange);
    return () => window.removeEventListener('perala-voice-profile-change', handleVoiceProfileChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add window focus/blur detection to stop voice when clicking away
  React.useEffect(() => {
    const handleWindowBlur = () => {
      // Stop audio when user clicks away from the window
      globalStopAudio();
    };

    const handleVisibilityChange = () => {
      // Stop audio when tab becomes hidden
      if (document.hidden) {
        globalStopAudio();
      }
    };

    // Listen for window losing focus
    window.addEventListener("blur", handleWindowBlur);
    // Listen for tab visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [globalStopAudio]);

  // Cleanup on component unmount: stop audio and revoke all cached blob URLs
  React.useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      globalStopAudio();
      // Revoke all blob URLs to prevent memory leaks
      audioCacheRef.current.forEach(url => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
    };
  }, [globalStopAudio]);

  // On mount: Phase 1 — preload ALL sectors in the CURRENT language fast (500 ms stagger).
  // Phase 2 — preload ALL remaining languages in the background (2 s stagger, starting
  // at 8 s) so that any language switch is an instant cache hit with no generation delay.
  React.useEffect(() => {
    if (cards.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Always read localStorage first — the prop starts as 'en' default before parent syncs saved value
    const activeLang = localStorage.getItem('voiceLanguage') || voiceLanguage || 'en';
    const activeSpeaker = localStorage.getItem('activeVoiceProfileId') || ALL_LANGUAGES[activeLang] || 'en-IN-NeerjaNeural';

    // ── Phase 1: current language, tight stagger ───────────────────────────
    cards.forEach((card, i) => {
      if (i === 0) {
        preloadForSectorAndLang(card.sector, activeLang, activeSpeaker);
      } else {
        timers.push(setTimeout(() => preloadForSectorAndLang(card.sector, activeLang, activeSpeaker), i * 500));
      }
    });

    // ── Phase 2: all other languages, background stagger (starts at 8 s) ──
    const otherLangs = Object.entries(ALL_LANGUAGES).filter(([lang]) => lang !== activeLang);
    let jobIndex = 0;
    otherLangs.forEach(([lang]) => {
      cards.forEach((card) => {
        const delay = 8000 + jobIndex * 2000;
        timers.push(setTimeout(() => preloadForSectorAndLang(card.sector, lang, activeSpeaker), delay));
        jobIndex++;
      });
    });

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When voiceLanguage prop changes: stop audio and immediately preload all sectors
  // in the newly selected language so the next card swipe plays without any delay.
  React.useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlaying(false);

    // Preload all cards in the new language — use localStorage so we get the latest
    // profile ID even if the closure captured an older value
    const lang = localStorage.getItem('voiceLanguage') || voiceLanguage || 'en';
    const speaker = localStorage.getItem('activeVoiceProfileId') || ALL_LANGUAGES[lang] || 'en-IN-NeerjaNeural';
    const langChangeTimers: ReturnType<typeof setTimeout>[] = [];
    cards.forEach((card, i) => {
      if (i === 0) {
        preloadForSectorAndLang(card.sector, lang, speaker);
      } else {
        langChangeTimers.push(setTimeout(() => preloadForSectorAndLang(card.sector, lang, speaker), i * 400));
      }
    });
    console.log(`[LANG CHANGE] Switched to ${lang} — preloading ${cards.length} sectors with speaker: ${speaker}`);
    return () => langChangeTimers.forEach(clearTimeout);
  }, [voiceLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-44 h-36 md:w-40 md:h-40">
      {cards.map((card, index) => {
        const isTop = index === 0;
        const isSecond = index === 1;
        const isThird = index === 2;

        return (
          <div
            key={card.id}
            data-card-index={index}
            className={`absolute inset-0 transition-all duration-300 ease-out cursor-grab active:cursor-grabbing ${
              isTop
                ? "z-40 scale-100 rotate-0"
                : isSecond
                  ? "z-30 scale-95 rotate-1 translate-y-2"
                  : isThird
                    ? "z-20 scale-90 rotate-2 translate-y-4"
                    : "z-10 scale-85 rotate-3 translate-y-6 opacity-50"
            }`}
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
              if (!isTop) return;

              const startX = e.clientX;
              const startY = e.clientY;
              const cardElement = e.currentTarget as HTMLElement;
              let isDragging = false;

              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (
                  !isDragging &&
                  (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                ) {
                  isDragging = true;
                }

                if (isDragging) {
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300),
                  );
                }
              };

              const handleMouseUp = (e: MouseEvent) => {
                if (isDragging) {
                  const deltaX = e.clientX - startX;
                  if (Math.abs(deltaX) > 100) {
                    // Determine swipe direction
                    const swipeDirection = deltaX > 0 ? "right" : "left";

                    if (swipeDirection === "right") {
                      // Start audio NOW — still in user-gesture context (mouseup).
                      // After right swipe cards[1] becomes the new top card.
                      const futureTop = cards.length > 1 ? cards[1] : null;
                      if (futureTop) fetchAndPlayContent(futureTop.title, futureTop.sector);

                      // Right swipe: Card moves away animation
                      const direction = "150%";
                      const rotation = "30deg";
                      cardElement.style.transform = `translate(${direction}, ${
                        deltaX * 0.5
                      }px) rotate(${rotation})`;
                      cardElement.style.opacity = "0";

                      setTimeout(() => {
                        cardElement.style.transform = "";
                        cardElement.style.opacity = "";
                        swipeCard(swipeDirection, true); // skipAutoPlay — already started above
                      }, 300);
                    } else {
                      // Start audio NOW — still in user-gesture context (mouseup).
                      // After left swipe cards[cards.length-1] becomes the new top card.
                      const futureTop = cards.length > 0 ? cards[cards.length - 1] : null;
                      if (futureTop) fetchAndPlayContent(futureTop.title, futureTop.sector);

                      // Left swipe: Previous card slides in from left (reverse animation)
                      cardElement.style.transform = "";
                      cardElement.style.opacity = "";

                      // Change the card order (skipAutoPlay — already started above)
                      swipeCard(swipeDirection, true);

                      // Then animate the new top card sliding in from the right (coming back)
                      setTimeout(() => {
                        const newTopCard =
                          cardElement.parentElement?.querySelector(
                            '[data-card-index="0"]',
                          ) as HTMLElement;
                        if (newTopCard) {
                          // Start from right side with rotation (like it's coming back)
                          newTopCard.style.transform =
                            "translate(150%, 0) rotate(30deg)";
                          newTopCard.style.opacity = "0";

                          // Animate to center
                          setTimeout(() => {
                            newTopCard.style.transform = "";
                            newTopCard.style.opacity = "";
                            newTopCard.style.transition =
                              "transform 300ms ease-out, opacity 300ms ease-out";

                            // Clear transition after animation
                            setTimeout(() => {
                              newTopCard.style.transition = "";
                            }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    // Snap back to center
                    cardElement.style.transform = "";
                    cardElement.style.opacity = "";
                  }
                }

                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
            onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
              if (!isTop) return;

              const startX = e.touches[0].clientX;
              const startY = e.touches[0].clientY;
              const cardElement = e.currentTarget as HTMLElement;
              let isDragging = false;

              const handleTouchMove = (e: TouchEvent) => {
                const deltaX = e.touches[0].clientX - startX;
                const deltaY = e.touches[0].clientY - startY;

                if (
                  !isDragging &&
                  (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                ) {
                  isDragging = true;
                }

                if (isDragging) {
                  e.preventDefault();
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300),
                  );
                }
              };

              const handleTouchEnd = (e: TouchEvent) => {
                if (isDragging) {
                  const deltaX = e.changedTouches[0].clientX - startX;
                  if (Math.abs(deltaX) > 100) {
                    // Determine swipe direction
                    const swipeDirection = deltaX > 0 ? "right" : "left";

                    if (swipeDirection === "right") {
                      // Start audio NOW — still in user-gesture context (touchend).
                      // After right swipe cards[1] becomes the new top card.
                      const futureTop = cards.length > 1 ? cards[1] : null;
                      if (futureTop) fetchAndPlayContent(futureTop.title, futureTop.sector);

                      // Right swipe: Card moves away animation
                      const direction = "150%";
                      const rotation = "30deg";
                      cardElement.style.transform = `translate(${direction}, ${
                        deltaX * 0.5
                      }px) rotate(${rotation})`;
                      cardElement.style.opacity = "0";

                      setTimeout(() => {
                        cardElement.style.transform = "";
                        cardElement.style.opacity = "";
                        swipeCard(swipeDirection, true); // skipAutoPlay — already started above
                      }, 300);
                    } else {
                      // Start audio NOW — still in user-gesture context (touchend).
                      // After left swipe cards[cards.length-1] becomes the new top card.
                      const futureTop = cards.length > 0 ? cards[cards.length - 1] : null;
                      if (futureTop) fetchAndPlayContent(futureTop.title, futureTop.sector);

                      // Left swipe: Previous card slides in from left (reverse animation)
                      cardElement.style.transform = "";
                      cardElement.style.opacity = "";

                      // Change the card order (skipAutoPlay — already started above)
                      swipeCard(swipeDirection, true);

                      // Then animate the new top card sliding in from the right (coming back)
                      setTimeout(() => {
                        const newTopCard =
                          cardElement.parentElement?.querySelector(
                            '[data-card-index="0"]',
                          ) as HTMLElement;
                        if (newTopCard) {
                          // Start from right side with rotation (like it's coming back)
                          newTopCard.style.transform =
                            "translate(150%, 0) rotate(30deg)";
                          newTopCard.style.opacity = "0";

                          // Animate to center
                          setTimeout(() => {
                            newTopCard.style.transform = "";
                            newTopCard.style.opacity = "";
                            newTopCard.style.transition =
                              "transform 300ms ease-out, opacity 300ms ease-out";

                            // Clear transition after animation
                            setTimeout(() => {
                              newTopCard.style.transition = "";
                            }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    // Snap back to center
                    cardElement.style.transform = "";
                    cardElement.style.opacity = "";
                  }
                }

                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
              };

              document.addEventListener("touchmove", handleTouchMove, {
                passive: false,
              });
              document.addEventListener("touchend", handleTouchEnd);
            }}
            onClick={() => {
              if (isTop) {
                console.log(`Clicked on ${card.title}`);
                onSectorChange(card.sector);
              }
            }}
          >
            <div
              className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-3 md:p-4 h-full relative overflow-hidden shadow-xl border-2 border-white/10 flex flex-col`}
            >
              {/* Character illustration area */}
              <div className="absolute bottom-0 right-0 w-14 h-14 md:w-16 md:h-16 opacity-20">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 rounded-full"></div>
              </div>

              {/* Card content */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-[9px] md:text-[8px] text-white/90 mb-0.5 md:mb-1 uppercase tracking-wider font-semibold">
                  {card.title}
                </div>
                <h3 className="text-sm md:text-xs font-bold text-white mb-1.5 md:mb-2 leading-snug flex-grow">
                  {card.subtitle.split("\n").map((line, i) => (
                    <div key={i} className="hidden md:block">{line}</div>
                  ))}
                </h3>
                <Button
                  className={`bg-white ${card.buttonColor} hover:bg-gray-100 px-2.5 py-1 md:px-2.5 md:py-0.5 rounded-full text-[11px] md:text-[10px] font-semibold shadow-lg w-fit`}
                  onClick={() => {
                    if (isTop) {
                      if (isPlaying) {
                        stopAudio();
                      } else {
                        fetchAndPlayContent(card.title, card.sector);
                      }
                    }
                  }}
                  disabled={isLoading && isTop}
                >
                  <div className="flex items-center gap-2">
                    {isTop && isLoading ? (
                      <RotateCcw className="w-4 h-4 animate-spin" />
                    ) : isTop && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>
                      {isTop && isLoading
                        ? "Generating..."
                        : isTop && isPlaying
                          ? "Pause"
                          : card.buttonText}
                    </span>
                  </div>
                </Button>
              </div>

              {/* Icon */}
              <div className="absolute top-2 right-2 md:top-1.5 md:right-1.5 text-white/80">
                {(() => {
                  const icons: Record<string, React.ComponentType<{className?: string}>> = {
                    IT: Cpu,
                    FINANCE: TrendingUp,
                    COMMODITY: Layers,
                    GLOBAL: Globe,
                    BANKS: Building2,
                    AUTOMOBILE: Car,
                  };
                  const Icon = icons[card.sector] || Cpu;
                  return <Icon className="w-5 h-5 md:w-4 md:h-4 drop-shadow" />;
                })()}
              </div>

              {/* Stack indicator for non-top cards */}
              {!isTop && (
                <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
import { format } from "date-fns";

import { apiRequest } from "@/lib/queryClient";

import {

  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Pie,
  Cell,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

function NiftyIndex() {
  const {
    data: marketData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/market-data"],
    refetchInterval: 3000, // Refresh every 3 seconds for live data
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading data</div>
        </CardContent>
      </Card>
    );
  }

  // Find NIFTY50 data from the response
  const niftyData = Array.isArray(marketData)
    ? marketData.find((item: any) => item.symbol === "NIFTY50")
    : null;

  if (!niftyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            NIFTY 50 Index
          </CardTitle>
          <CardDescription>Live market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div>NIFTY data not available</div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = niftyData.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? "text-green-600" : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {niftyData.name}
        </CardTitle>
        <CardDescription>Live streaming data from NSE</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">
              {niftyData.ltp?.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "N/A"}
            </div>
            <div className="text-sm text-gray-500">Last Traded Price</div>
          </div>
          <div className={`text-right ${trendColor}`}>
            <div className="flex items-center justify-end gap-1">
              <TrendIcon className="h-4 w-4" />
              <span className="text-lg font-semibold">
                {isPositive ? "+" : ""}
                {niftyData.change?.toFixed(2) || "N/A"}
              </span>
            </div>
            <div className="text-sm">
              ({isPositive ? "+" : ""}
              {niftyData.changePercent?.toFixed(2) || "N/A"}%)
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500">
            Last Updated: {new Date(niftyData.lastUpdate).toLocaleTimeString()}
          </div>
          <div className="text-xs text-gray-500">Code: {niftyData.code}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface HistoricalDataResponse {
  symbol: string;
  resolution: string;
  range_from: string;
  range_to: string;
  candles: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

function HistoricalDataSection() {
  // Set default dates to a few days ago to ensure data availability (avoid weekends/holidays)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 3); // Go back 3 days to avoid weekend issues
  const [fromDate, setFromDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [timeframe, setTimeframe] = useState("1");
  const [selectedSymbol, setSelectedSymbol] = useState("NSE:INFY-EQ");
  const [sentimentAnalysis, setSentimentAnalysis] = useState<any[]>([]);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const queryClient = useQueryClient();

  const { data: historicalData } = useQuery<HistoricalDataResponse>({
    queryKey: [
      "/api/historical-data",
      selectedSymbol,
      fromDate,
      toDate,
      timeframe,
    ],
    enabled: true, // Enable automatic fetching
  });

  const fetchHistoricalData = useMutation({
    mutationFn: async () => {
      const response = await fetch(getFullApiUrl("/api/historical-data"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          resolution: timeframe,
          range_from: fromDate,
          range_to: toDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch historical data");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["/api/historical-data", selectedSymbol, fromDate, toDate, timeframe],
        data,
      );
    },
  });

  const handleFetchData = () => {
    fetchHistoricalData.mutate();
  };

  const analyzeSentiment = async (candles: any[], symbol: string) => {
    if (!candles || candles.length === 0) return;

    setIsAnalyzingSentiment(true);
    try {
      const response = await fetch(getFullApiUrl("/api/sentiment-analysis"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candles,
          symbol,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSentimentAnalysis(data.sentiment || []);
      } else {
        console.error("Failed to analyze sentiment");
        setSentimentAnalysis([]);
      }
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      setSentimentAnalysis([]);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  // Auto-analyze sentiment when historical data changes
  React.useEffect(() => {
    if (historicalData?.candles && historicalData.candles.length > 0) {
      analyzeSentiment(historicalData.candles, selectedSymbol);
    }
  }, [historicalData, selectedSymbol]);

  const handleExportToExcel = () => {
    if (
      !historicalData ||
      !historicalData.candles ||
      historicalData.candles.length === 0
    ) {
      return;
    }

    // Prepare CSV content with sentiment data
    const headers = [
      "Date",
      "Time",
      "Open",
      "High",
      "Low",
      "Close",
      "Volume",
      "Sentiment_Signal",
      "Sentiment_Score",
      "Confidence",
    ];
    const csvContent = [
      headers.join(","),
      ...historicalData.candles.map((candle, index) => {
        const date = new Date(candle.timestamp * 1000);
        const dateStr = format(date, "d/M/yyyy");
        const timeStr = format(date, "HH:mm:ss");
        const sentiment = sentimentAnalysis[index];
        return [
          dateStr,
          timeStr,
          candle.open.toFixed(2),
          candle.high.toFixed(2),
          candle.low.toFixed(2),
          candle.close.toFixed(2),
          candle.volume.toString(),
          sentiment?.signal || "N/A",
          sentiment?.score?.toFixed(2) || "N/A",
          sentiment?.confidence?.toFixed(0) || "N/A",
        ].join(",");
      }),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    // Generate filename with symbol, timeframe, and date range
    const symbolName = (selectedSymbol || "UNKNOWN")
      .replace("NSE:", "")
      .replace("-EQ", "")
      .replace("-INDEX", "");
    const timeframeName = timeframe === "1" ? "1min" : `${timeframe}min`;
    const dateRange =
      fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    const filename = `${symbolName}_${timeframeName}_${dateRange}_OHLC.csv`;

    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Historical OHLC Data
        </CardTitle>
        <CardDescription>
          Custom date range, symbol, and timeframe selection with real-time
          Fyers API data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date, Symbol, and Timeframe Selection */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-date">From Date</Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-date">To Date</Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger>
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NSE:NIFTY50-INDEX">NIFTY 50</SelectItem>
                <SelectItem value="NSE:INFY-EQ">INFOSYS</SelectItem>
                <SelectItem value="NSE:RELIANCE-EQ">RELIANCE</SelectItem>
                <SelectItem value="NSE:TCS-EQ">TCS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Minute</SelectItem>
                <SelectItem value="5">5 Minutes</SelectItem>
                <SelectItem value="10">10 Minutes</SelectItem>
                <SelectItem value="15">15 Minutes</SelectItem>
                <SelectItem value="20">20 Minutes</SelectItem>
                <SelectItem value="30">30 Minutes</SelectItem>
                <SelectItem value="40">40 Minutes</SelectItem>
                <SelectItem value="60">1 Hour</SelectItem>
                <SelectItem value="80">80 Minutes</SelectItem>
                <SelectItem value="120">2 Hours</SelectItem>
                <SelectItem value="160">160 Minutes</SelectItem>
                <SelectItem value="240">4 Hours</SelectItem>
                <SelectItem value="320">320 Minutes</SelectItem>
                <SelectItem value="480">8 Hours</SelectItem>
                <SelectItem value="960">16 Hours</SelectItem>
                <SelectItem value="1D">1 Day</SelectItem>
                <SelectItem value="2D">2 Days</SelectItem>
                <SelectItem value="4D">4 Days</SelectItem>
                <SelectItem value="8D">8 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <div className="flex gap-1.5">
              <Button
                onClick={handleFetchData}
                disabled={fetchHistoricalData.isPending}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {fetchHistoricalData.isPending ? "Fetching..." : "Fetch Data"}
              </Button>
              <Button
                onClick={handleExportToExcel}
                disabled={
                  !historicalData || historicalData.candles.length === 0
                }
                variant="outline"
                size="default"
                className="px-3"
                title="Export OHLC data to Excel"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {fetchHistoricalData.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-red-100 rounded-full p-1">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">
                  Fyers API Temporary Service Issue
                </h3>
                <div className="text-red-700 text-sm mt-1 space-y-2">
                  <p>
                    <strong>Current Status:</strong> Fyers API is experiencing
                    intermittent service issues with historical data endpoints.
                    Live market data continues working perfectly.
                  </p>
                  <div className="bg-green-100 p-3 rounded border-l-4 border-green-400">
                    <p className="font-medium text-green-800">
                      What's Still Working:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-green-700">
                      <li>
                        • <strong>Live Market Data:</strong> Real-time prices
                        streaming every 3 seconds (Dashboard tab)
                      </li>
                      <li>
                        • <strong>Chart Tab:</strong> Professional interactive
                        candlestick chart with zoom controls
                      </li>
                      <li>
                        • <strong>Pattern Analysis:</strong> All 14 Battu API
                        endpoints for technical analysis
                      </li>
                      <li>
                        • <strong>Previously Successful:</strong> CB Tab fetched
                        375 candles earlier before API maintenance
                      </li>
                    </ul>
                  </div>
                  <div className="bg-blue-100 p-3 rounded border-l-4 border-blue-400">
                    <p className="font-medium text-blue-800">
                      Alternative Solutions:
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-blue-700">
                      <li>
                        • <strong>Use Chart Tab:</strong> Interactive
                        candlestick chart may have different data endpoints
                      </li>
                      <li>
                        • <strong>Try Later:</strong> API maintenance typically
                        resolves within 30-60 minutes
                      </li>
                      <li>
                        • <strong>Different Dates:</strong> Try various past
                        trading days as availability varies
                      </li>
                      <li>
                        • <strong>Monitor Dashboard:</strong> Live streaming
                        data remains fully functional
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {historicalData && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-green-100 rounded-full p-1">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-green-800 font-medium">
                  ✅ Fyers API Successfully Connected & Data Loaded!
                </div>
              </div>
              <div className="text-green-700 text-sm mt-1">
                Real-time historical OHLC data fetched successfully from Fyers
                API v3.0.0
              </div>
            </div>
            <div className="flex items-center justify-start">
              <h3 className="text-lg font-semibold">
                OHLC Data ({historicalData?.candles?.length || 0} candles) - CB
                Tab
              </h3>
              <div className="text-sm text-gray-500 space-y-1">
                <div>
                  {fromDate} to {toDate} | {timeframe} minute timeframe
                </div>
                <div className="text-xs">
                  Total Candles: {historicalData?.candles?.length || 0}
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-auto border rounded-lg custom-thin-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">High</TableHead>
                    <TableHead className="text-right">Low</TableHead>
                    <TableHead className="text-right">Close</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-center">Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalData?.candles?.map((candle, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(candle.timestamp * 1000).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.open.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.high.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.low.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.close.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {candle.volume.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {isAnalyzingSentiment &&
                        index < sentimentAnalysis.length ? (
                          <div className="flex items-center justify-center space-x-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-gray-500">
                              Analyzing...
                            </span>
                          </div>
                        ) : sentimentAnalysis[index] ? (
                          <div className="space-y-1 bg-white dark:bg-gray-900/50 rounded-lg p-3">
                            <div
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                sentimentAnalysis[index].signal === "BUY"
                                  ? "bg-green-100 text-green-800"
                                  : sentimentAnalysis[index].signal === "SELL"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {sentimentAnalysis[index].signal}
                            </div>
                            <div className="text-xs text-gray-600">
                              {sentimentAnalysis[index].confidence}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${
                                  sentimentAnalysis[index].score > 0
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${
                                    Math.abs(sentimentAnalysis[index].score) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!historicalData?.candles ||
                    historicalData.candles.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-gray-500"
                      >
                        <div className="space-y-2">
                          <div>No historical data available</div>
                          <div className="text-sm">
                            Historical data access may require specific API
                            permissions or market hours. Use the "Fetch Data"
                            button above to attempt loading data.
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MicroAnimationsDemoPage() {
  const [demoPrice, setDemoPrice] = useState(1552.5);
  const [prevPrice, setPrevPrice] = useState(1552.5);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [volume, setVolume] = useState(1000000);
  const [isLive, setIsLive] = useState(true);
  const [profitLoss, setProfitLoss] = useState(0);
  const [showCandleAnimation, setShowCandleAnimation] = useState(false);

  // Demo candle data
  const demoCandleData = {
    open: 1580.0,
    high: 1585.5,
    low: 1548.2,
    close: 1552.5,
  };

  const updatePrice = (direction: "up" | "down") => {
    setPrevPrice(demoPrice);
    const change =
      direction === "up" ? Math.random() * 5 + 1 : -(Math.random() * 5 + 1);
    setDemoPrice((prev) => Math.max(prev + change, 1500));
  };

  const simulateTradeExecution = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      const change =
        tradeType === "buy"
          ? Math.random() * 10 + 5
          : -(Math.random() * 10 + 5);
      setProfitLoss(change);
    }, 3000);
  };

  const simulateVolumeSpike = () => {
    setVolume((prev) => prev * (1.5 + Math.random()));
    setTimeout(() => setVolume(1000000), 3000);
  };

  const toggleMarketStatus = () => {
    setIsLive(!isLive);
  };

  const triggerCandleAnimation = () => {
    setShowCandleAnimation(false);
    setTimeout(() => setShowCandleAnimation(true), 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Micro-Animations for Trading Interface
          </CardTitle>
          <CardDescription>
            Interactive demos showcasing smooth animations for trade execution
            and market movements
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Price Change Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Price Change Animation</CardTitle>
            <CardDescription>
              Live price updates with directional indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <PriceChangeAnimation
                value={demoPrice}
                previousValue={prevPrice}
                className="text-lg"
              />
            </div>
            <div className="flex gap-1.5">
              <Button onClick={() => updatePrice("up")} className="flex-1">
                <TrendingUp className="h-4 w-4 mr-2" />
                Price Up
              </Button>
              <Button
                onClick={() => updatePrice("down")}
                variant="outline"
                className="flex-1"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Price Down
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trade Execution Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Execution Animation</CardTitle>
            <CardDescription>
              Order execution feedback with loading states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex gap-1.5">
                <Button
                  onClick={() => setTradeType("buy")}
                  variant={tradeType === "buy" ? "default" : "outline"}
                  size="sm"
                >
                  Buy
                </Button>
                <Button
                  onClick={() => setTradeType("sell")}
                  variant={tradeType === "sell" ? "default" : "outline"}
                  size="sm"
                >
                  Sell
                </Button>
              </div>
              <Button
                onClick={simulateTradeExecution}
                disabled={isExecuting}
                className="w-full"
              >
                {isExecuting ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute {tradeType.toUpperCase()} Order
                  </>
                )}
              </Button>
            </div>
            <TradeExecutionAnimation
              isExecuting={isExecuting}
              tradeType={tradeType}
              amount="100"
              symbol="INFY"
            />
          </CardContent>
        </Card>

        {/* Volume Spike Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Spike Animation</CardTitle>
            <CardDescription>
              Animated volume alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <VolumeSpikeAnimation
                volume={volume}
                averageVolume={1000000}
                className="text-sm"
              />
            </div>
            <Button onClick={simulateVolumeSpike} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Trigger Volume Spike
            </Button>
          </CardContent>
        </Card>

        {/* Market Status Pulse */}
        <Card>
          <CardHeader>
            <CardTitle>Market Status Animation</CardTitle>
            <CardDescription>
              Live market status with pulsing indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <MarketStatusPulse isLive={isLive} />
            </div>
            <Button onClick={toggleMarketStatus} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Toggle Market Status
            </Button>
          </CardContent>
        </Card>

        {/* Profit/Loss Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Profit/Loss Animation</CardTitle>
            <CardDescription>
              Animated P&L with color transitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <ProfitLossAnimation
                value={profitLoss}
                showCurrency={true}
                className="text-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setProfitLoss(Math.random() * 100 + 10)}
                size="sm"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Profit
              </Button>
              <Button
                onClick={() => setProfitLoss(-(Math.random() * 100 + 10))}
                variant="outline"
                size="sm"
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                Loss
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Candlestick Animation */}
        <Card>
          <CardHeader>
            <CardTitle>Candlestick Formation</CardTitle>
            <CardDescription>Animated candle drawing process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {showCandleAnimation && (
                <CandlestickAnimation candle={demoCandleData} duration={2000} />
              )}
            </div>
            <Button onClick={triggerCandleAnimation} className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Animate Candle Formation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Loading Skeleton Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Market Data Loading Animation</CardTitle>
          <CardDescription>
            Skeleton loading states for market data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MarketDataSkeleton />
            <MarketDataSkeleton />
            <MarketDataSkeleton />
          </div>
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Live Market Data with Animations</CardTitle>
          <CardDescription>
            Real INFY data enhanced with micro-animations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Live Price</Label>
              <PriceChangeAnimation
                value={1552.5}
                previousValue={1574.5}
                className="p-3 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label>P&L Today</Label>
              <ProfitLossAnimation
                value={-22.0}
                showCurrency={true}
                className="p-3 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Market Status</Label>
              {isReportLoading && (
                                                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                                                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-8 border border-gray-700 shadow-2xl max-w-md">
                                                      <div className="text-center">
                                                        <style>{`
                                                          @keyframes thinkingDot {
                                                            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
                                                            30% { opacity: 1; transform: translateY(-8px); }
                                                          }
                                                          .thinking-dot {
                                                            display: inline-block;
                                                            width: 10px;
                                                            height: 10px;
                                                            border-radius: 50%;
                                                            background-color: #3b82f6;
                                                            animation: thinkingDot 1.4s infinite;
                                                            margin: 0 4px;
                                                          }
                                                          .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
                                                          .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
                                                        `}</style>
                                                        <h3 className="text-lg font-semibold text-white mb-4">Generating Financial Report</h3>
                                                        <div className="flex items-center justify-center gap-2 mb-3">
                                                          <div className="thinking-dot"></div>
                                                          <div className="thinking-dot"></div>
                                                          <div className="thinking-dot"></div>
                                                        </div>
                                                        <p className="text-sm text-gray-400">Analyzing quarterly data, company insights, and financial statements...</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                                <div className="p-3 border rounded-lg bg-white dark:bg-gray-700">
                <MarketStatusPulse isLive={false} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// API base URL for Cloud Run compatibility - use environment variable
// BUT: In development mode (localhost), always use relative URLs to avoid CORS issues
const isDevelopmentMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.port === '5000';

const API_BASE_URL = isDevelopmentMode ? '' : (import.meta.env.VITE_API_URL || '');

// Helper function to construct full API URLs for Cloud Run compatibility
const getFullApiUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

function RangeHeatmapPreview({ filteredData }: { filteredData: Record<string, any> }) {
  const [fomoActive, setFomoActive] = useState(false);
  const [fomoLinePositions, setFomoLinePositions] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }> | null>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const fomoButtonRef = useRef<HTMLButtonElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  const dates = Object.keys(filteredData).sort();

  let totalPnL = 0, totalTrades = 0, winningTrades = 0;
  let fomoCount = 0, currentStreak = 0, maxStreak = 0;
  const trendData: number[] = [];
  const fomoDates: string[] = [];

  dates.forEach(dateKey => {
    const dayData = filteredData[dateKey];
    const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
    const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
    if (metrics) {
      const netPnL = metrics.netPnL || 0;
      totalPnL += netPnL;
      totalTrades += metrics.totalTrades || 0;
      winningTrades += metrics.winningTrades || 0;
      trendData.push(netPnL);
      if (netPnL > 0) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
      else currentStreak = 0;
    }
    if (Array.isArray(tags)) {
      tags.forEach((tag: string) => { if (tag.toLowerCase().includes('fomo') && !fomoDates.includes(dateKey)) { fomoCount++; fomoDates.push(dateKey); } });
    }
  });

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;
  const isProfit = totalPnL >= 0;
  const fromLabel = dates[0] ? new Date(dates[0]).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '-';
  const toLabel = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const months = useMemo(() => {
    if (dates.length === 0) return [];
    const startD = new Date(dates[0]); startD.setDate(1);
    const endD = new Date(dates[dates.length - 1]);
    const result: { name: string; year: number; dayRows: (Date | null)[][] }[] = [];
    const cur = new Date(startD);
    while (cur.getFullYear() < endD.getFullYear() || (cur.getFullYear() === endD.getFullYear() && cur.getMonth() <= endD.getMonth())) {
      const year = cur.getFullYear();
      const monthIndex = cur.getMonth();
      const monthName = cur.toLocaleString('en-US', { month: 'short' });
      const lastDay = new Date(year, monthIndex + 1, 0);
      const dayColumns: (Date | null)[][] = [[], [], [], [], [], [], []];
      for (let i = 0; i < new Date(year, monthIndex, 1).getDay(); i++) dayColumns[i].push(null);
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, monthIndex, day);
        dayColumns[date.getDay()].push(date);
      }
      result.push({ name: monthName, year, dayRows: dayColumns });
      cur.setMonth(cur.getMonth() + 1);
      if (result.length > 24) break;
    }
    return result;
  }, [dates.join(',')]);

  const getPnLColor = (pnl: number) => {
    if (pnl === 0) return "bg-gray-200 dark:bg-gray-700";
    const amount = Math.abs(pnl);
    if (pnl > 0) {
      if (amount >= 5000) return "bg-green-800 dark:bg-green-700";
      if (amount >= 1500) return "bg-green-600 dark:bg-green-500";
      return "bg-green-300 dark:bg-green-300";
    } else {
      if (amount >= 5000) return "bg-red-800 dark:bg-red-700";
      if (amount >= 1500) return "bg-red-600 dark:bg-red-500";
      return "bg-red-300 dark:bg-red-300";
    }
  };

  const getCellPnL = (dateKey: string) => {
    const data = filteredData[dateKey];
    if (!data) return 0;
    const metrics = data?.tradingData?.performanceMetrics || data?.performanceMetrics;
    return metrics?.netPnL || 0;
  };

  useEffect(() => {
    if (!fomoActive || fomoDates.length === 0) { setFomoLinePositions(null); return; }
    const calc = () => {
      const outer = outerRef.current;
      const heatmap = heatmapContainerRef.current;
      const fomoBtn = fomoButtonRef.current;
      if (!outer || !heatmap || !fomoBtn) return;
      const outerRect = outer.getBoundingClientRect();
      const fomoBtnRect = fomoBtn.getBoundingClientRect();
      const originX = fomoBtnRect.left - outerRect.left + fomoBtnRect.width / 2;
      const originY = fomoBtnRect.top - outerRect.top + fomoBtnRect.height / 2;
      const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
      fomoDates.forEach(dateKey => {
        const cell = heatmap.querySelector(`[data-date="${dateKey}"]`) as HTMLElement;
        if (cell) {
          const cellRect = cell.getBoundingClientRect();
          const x2 = cellRect.left - outerRect.left + cellRect.width / 2;
          const y2 = cellRect.top - outerRect.top + cellRect.height / 2;
          lines.push({ x1: originX, y1: originY, x2, y2 });
        }
      });
      setFomoLinePositions(lines.length > 0 ? lines : null);
    };
    const t1 = setTimeout(calc, 50);
    const t2 = setTimeout(calc, 250);
    const scroll = heatmapContainerRef.current;
    scroll?.addEventListener('scroll', calc);
    return () => { clearTimeout(t1); clearTimeout(t2); scroll?.removeEventListener('scroll', calc); };
  }, [fomoActive, fomoDates.join(',')]);

  const svgW = 40, svgH = 20;
  const maxTrend = Math.max(...trendData, 0);
  const minTrend = Math.min(...trendData, 0);
  const rangeT = maxTrend - minTrend || 1;
  const smoothTrendPath = (() => {
    if (trendData.length < 2) return `M 0 ${svgH / 2} L ${svgW} ${svgH / 2}`;
    const pts = trendData.map((v, i) => ({ x: (i / (trendData.length - 1)) * svgW, y: svgH - ((v - minTrend) / rangeT) * svgH }));
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i], cx = (c.x - p.x) / 2.5;
      d += ` C ${(p.x + cx).toFixed(1)} ${p.y.toFixed(1)}, ${(c.x - cx).toFixed(1)} ${c.y.toFixed(1)}, ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
    }
    return d;
  })();

  const dayLabels = ['S', 'M', 'T', 'W', 'TH', 'F', 'S'];

  return (
    <div className="space-y-2" ref={outerRef} style={{ position: 'relative' }}>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {dates.length} trading days · {fromLabel} – {toLabel}
      </div>

      {/* FOMO SVG overlay — spans the full outer container */}
      {fomoActive && fomoLinePositions && (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20, overflow: 'visible' }}>
          <defs>
            <linearGradient id="range-fomo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgb(234, 179, 8)', stopOpacity: 0.9 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(167, 51, 234)', stopOpacity: 0.9 }} />
            </linearGradient>
          </defs>
          {fomoLinePositions.map((line, idx) => {
            const { x1, y1, x2, y2 } = line;
            const dx = x2 - x1, dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const curveAmt = Math.min(dist * 0.3, 50);
            const angle = Math.atan2(dy, dx);
            const perp = angle - Math.PI / 2;
            const cx = (x1 + x2) / 2 + Math.cos(perp) * curveAmt;
            const cy = (y1 + y2) / 2 + Math.sin(perp) * curveAmt;
            return (
              <path
                key={idx}
                d={`M ${x1} ${y1} Q ${cx} ${cy}, ${x2} ${y2}`}
                stroke="url(#range-fomo-grad)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="5,3"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(234,179,8,0.5))' }}
              />
            );
          })}
        </svg>
      )}

      {/* Scrollable Heatmap */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto" ref={heatmapContainerRef} style={{ position: 'relative' }}>
          <div className="flex gap-3 p-3 pb-2 select-none" style={{ minWidth: 'fit-content' }}>
            {months.map((month, monthIndex) => (
              <div key={monthIndex} className="flex flex-col gap-0.5">
                <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 text-center select-none">{month.name}</div>
                <div className="flex gap-1">
                  <div className="flex flex-col gap-0.5 select-none">
                    {dayLabels.map((label, i) => (
                      <div key={i} className="w-5 h-3 flex items-center justify-center text-[8px] text-gray-500 dark:text-gray-500 select-none">{label}</div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-fit select-none">
                    {month.dayRows.map((column, colIdx) => (
                      <div key={colIdx} className="flex gap-0.5 select-none">
                        {column.map((date, dateIdx) => {
                          if (!date) return <div key={dateIdx} className="w-3 h-3" />;
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, '0');
                          const d = String(date.getDate()).padStart(2, '0');
                          const dateKey = `${y}-${m}-${d}`;
                          const pnl = getCellPnL(dateKey);
                          const isFomo = fomoDates.includes(dateKey);
                          return (
                            <div
                              key={dateIdx}
                              className={`w-3 h-3 rounded-sm transition-all relative ${getPnLColor(pnl)} ${fomoActive && isFomo ? 'ring-2 ring-yellow-400 dark:ring-yellow-300 animate-pulse shadow-lg shadow-yellow-400/50' : ''}`}
                              data-date={dateKey}
                              title={`${dateKey}: ₹${pnl.toFixed(0)}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-gray-500 dark:text-gray-400">Loss</span>
            <div className="w-2.5 h-2.5 bg-red-800 dark:bg-red-700 rounded-full" />
            <div className="w-2.5 h-2.5 bg-red-600 dark:bg-red-500 rounded-full" />
            <div className="w-2.5 h-2.5 bg-red-300 rounded-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-green-300 rounded-full" />
            <div className="w-2.5 h-2.5 bg-green-600 dark:bg-green-500 rounded-full" />
            <div className="w-2.5 h-2.5 bg-green-800 dark:bg-green-700 rounded-full" />
            <span className="text-[9px] text-gray-500 dark:text-gray-400">Profit</span>
          </div>
        </div>
      </div>

      {/* Purple Stats Bar */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl px-4 py-3">
        <div className="flex items-center justify-around text-white">
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[9px] font-medium opacity-75 uppercase tracking-wide">P&L</div>
            <div className="text-sm font-bold leading-none">{isProfit ? '+' : ''}₹{(totalPnL / 1000).toFixed(1)}K</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[9px] font-medium opacity-75 uppercase tracking-wide">Trend</div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-10 h-5">
              <path d={smoothTrendPath} fill="none" stroke="white" strokeWidth="1.8" opacity="0.95" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <button
            ref={fomoButtonRef}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${fomoActive ? 'bg-white/25 ring-2 ring-white/60' : 'hover:bg-white/10'}`}
            onClick={() => setFomoActive(v => !v)}
          >
            <div className="text-[9px] font-medium opacity-75 uppercase tracking-wide">FOMO</div>
            <div className="text-sm font-bold leading-none">{fomoCount}</div>
          </button>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[9px] font-medium opacity-75 uppercase tracking-wide">Win%</div>
            <div className="text-sm font-bold leading-none">{winRate.toFixed(0)}%</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[9px] font-medium opacity-75 uppercase tracking-wide">Streak</div>
            <div className="text-sm font-bold leading-none">{maxStreak}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MarketNewsResultTab (inlined) ───────────────────────────────────────────

interface _WatchlistStock {
  symbol: string;
  name: string;
  token: string;
  exchange: string;
  displayName: string;
  tradingSymbol: string;
}

interface _NewsItem {
  title: string;
  url: string;
  description?: string;
  source: string;
  publishedAt: string;
  symbol: string;
  displayName: string;
}

interface _AllNewsItem {
  title: string;
  url: string;
  description?: string;
  source: string;
  publishedAt: string;
  sector: string;
  displayName: string;
}

interface _StockPrice {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  chartData: Array<{ price: number; time: string }>;
}

interface _AiAnalysis {
  overallSentiment: string;
  marketMood: string;
  trendingSectors: Array<{
    rank: number;
    sector: string;
    sentiment: string;
    investmentSignal: string;
    keyTheme: string;
    articleCount: number;
    score: number;
  }>;
  keyEvents: Array<{ event: string; implication: string; impact: string }>;
  opportunities: Array<{ sector: string; opportunity: string; confidence: number; timeframe: string }>;
  riskAlerts: Array<{ risk: string; severity: string; mitigation: string }>;
  weeklyOutlook: string;
  totalArticles: number;
  sectorCounts: Record<string, number>;
}

interface MarketNewsResultTabProps {
  marketNewsMode: 'all' | 'watchlist' | 'nifty50';
  setMarketNewsMode: (mode: 'all' | 'watchlist' | 'nifty50') => void;
  allMarketNewsItems: _AllNewsItem[];
  isAllMarketNewsLoading: boolean;
  nifty50NewsItems: _NewsItem[];
  isNifty50NewsLoading: boolean;
  marketNewsItems: _NewsItem[];
  isMarketNewsLoading: boolean;
  newsSelectedSector: string | null;
  setNewsSelectedSector: (sector: string | null) => void;
  showNewsAiPanel: boolean;
  setShowNewsAiPanel: (show: boolean) => void;
  newsAiAnalysis: _AiAnalysis | null;
  setNewsAiAnalysis: (analysis: _AiAnalysis | null) => void;
  isNewsAiAnalysisLoading: boolean;
  setIsNewsAiAnalysisLoading: (loading: boolean) => void;
  newsAiAnalysisError: string | null;
  setNewsAiAnalysisError: (error: string | null) => void;
  newsStockPrices: { [symbol: string]: _StockPrice };
  watchlistSymbols: _WatchlistStock[];
  fetchMarketNews: () => void;
  fetchAllMarketNews: () => void;
  fetchNifty50News: () => void;
  getWatchlistNewsRelativeTime: (publishedAt: string) => string;
}

const NIFTY50_SECTOR_MAP: Record<string, string> = {
  ADANIENT: 'Commodity', ADANIPORTS: 'Commodity', COALINDIA: 'Commodity',
  HINDALCO: 'Commodity', JSWSTEEL: 'Commodity', TATASTEEL: 'Commodity',
  ULTRACEMCO: 'Commodity', UPL: 'Commodity', NTPC: 'Commodity',
  ONGC: 'Commodity', POWERGRID: 'Commodity', BPCL: 'Commodity',
  RELIANCE: 'Commodity', CRUDEOIL: 'Commodity', GOLD: 'Commodity', SILVER: 'Commodity',
  HCLTECH: 'IT', INFY: 'IT', TCS: 'IT', TECHM: 'IT', WIPRO: 'IT', LTIM: 'IT',
  AXISBANK: 'Finance', BAJFINANCE: 'Finance', BAJAJFINSV: 'Finance',
  HDFCBANK: 'Finance', HDFCLIFE: 'Finance', ICICIBANK: 'Finance',
  INDUSINDBK: 'Finance', KOTAKBANK: 'Finance', SBILIFE: 'Finance', SBIN: 'Finance',
  'BAJAJ-AUTO': 'Auto', EICHERMOT: 'Auto', HEROMOTOCO: 'Auto',
  'M&M': 'Auto', MARUTI: 'Auto', TATAMOTORS: 'Auto',
  APOLLOHOSP: 'Pharma', CIPLA: 'Pharma', DIVISLAB: 'Pharma', DRREDDY: 'Pharma', SUNPHARMA: 'Pharma',
  ASIANPAINT: 'Consumer', BRITANNIA: 'Consumer', HINDUNILVR: 'Consumer',
  ITC: 'Consumer', NESTLEIND: 'Consumer', TATACONSUM: 'Consumer', TITAN: 'Consumer',
  BHARTIARTL: 'Market', GRASIM: 'Market', LT: 'Market',
  SENSEX: 'Market', NIFTY: 'Market', BANKNIFTY: 'Market',
};

const _allSectors = ['Market', 'IT', 'Finance', 'Commodity', 'Defence', 'AI & Tech', 'Pharma', 'Consumer', 'Economy', 'Auto'];
const _nifty50Sectors = ['IT', 'Finance', 'Auto', 'Pharma', 'Consumer', 'Commodity', 'Market'];
const _sectorColors: Record<string, string> = {
  Market: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IT: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Finance: 'bg-green-500/15 text-green-400 border-green-500/30',
  Commodity: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Defence: 'bg-red-500/15 text-red-400 border-red-500/30',
  'AI & Tech': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Pharma: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  Consumer: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Economy: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  Auto: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

function MarketNewsResultTab({
  marketNewsMode,
  setMarketNewsMode,
  allMarketNewsItems,
  isAllMarketNewsLoading,
  nifty50NewsItems,
  isNifty50NewsLoading,
  marketNewsItems,
  isMarketNewsLoading,
  newsSelectedSector,
  setNewsSelectedSector,
  showNewsAiPanel,
  setShowNewsAiPanel,
  newsAiAnalysis,
  setNewsAiAnalysis,
  isNewsAiAnalysisLoading,
  setIsNewsAiAnalysisLoading,
  newsAiAnalysisError,
  setNewsAiAnalysisError,
  newsStockPrices,
  watchlistSymbols,
  fetchMarketNews,
  fetchAllMarketNews,
  fetchNifty50News,
  getWatchlistNewsRelativeTime,
}: MarketNewsResultTabProps) {
  const isAllMode = marketNewsMode === 'all';
  const isNifty50Mode = marketNewsMode === 'nifty50';
  const loading = isAllMode ? isAllMarketNewsLoading : isNifty50Mode ? isNifty50NewsLoading : isMarketNewsLoading;
  const rawNewsItems = isAllMode ? allMarketNewsItems : isNifty50Mode ? nifty50NewsItems : marketNewsItems;

  // Fallback chart data for when market is closed (no intraday data) — same API as NeoFeed
  const [fallbackChartData, setFallbackChartData] = useState<Record<string, {price: number; time: string}[]>>({});
  const fallbackFetchedRef = useRef<Set<string>>(new Set());

  // When news items change, fetch last-traded chart data for any symbol missing intraday points
  useEffect(() => {
    if (isAllMode) return;
    const symbolsToFetch = rawNewsItems
      .filter((item: any) => item.symbol)
      .map((item: any) => item.symbol as string)
      .filter((sym: string, idx: number, arr: string[]) => arr.indexOf(sym) === idx) // unique
      .filter((sym: string) => {
        const pts = newsStockPrices[sym]?.chartData ?? [];
        return pts.length < 2 && !fallbackFetchedRef.current.has(sym);
      });
    if (symbolsToFetch.length === 0) return;
    symbolsToFetch.forEach((sym: string) => fallbackFetchedRef.current.add(sym));
    symbolsToFetch.forEach(async (sym: string) => {
      try {
        const res = await fetch(`/api/stock-chart-data/${sym}?timeframe=1D`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length >= 2) {
            setFallbackChartData(prev => ({ ...prev, [sym]: data }));
          }
        }
      } catch {}
    });
  }, [rawNewsItems, newsStockPrices, isAllMode]);

  const newsItems = newsSelectedSector
    ? rawNewsItems.filter((item: any) => {
        if (isAllMode) return (item.sector || item.displayName) === newsSelectedSector;
        if (isNifty50Mode) return (NIFTY50_SECTOR_MAP[item.symbol] || 'Market') === newsSelectedSector;
        return true;
      })
    : rawNewsItems;

  const tagColor = isAllMode ? 'bg-purple-500/20 text-purple-400' : isNifty50Mode ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400';
  const emptyMsg = isAllMode ? 'Click Refresh to load latest market news' : isNifty50Mode ? 'Click Refresh to load Nifty 50 news' : 'Add stocks to your watchlist or click Refresh';
  const loadingMsg = isAllMode ? 'Fetching news across all sectors...' : isNifty50Mode ? 'Fetching Nifty 50 stock news...' : `Fetching news from ${watchlistSymbols.length} stocks...`;

  const handleRefresh = () => {
    if (isAllMode) fetchAllMarketNews();
    else if (isNifty50Mode) fetchNifty50News();
    else fetchMarketNews();
  };

  const getItemSector = (item: any): string => {
    if (isAllMode) return item.sector || item.displayName || 'Market';
    if (isNifty50Mode) return NIFTY50_SECTOR_MAP[item.symbol] || 'Market';
    return item.displayName || 'Market';
  };

  const handleAiAnalysis = () => {
    if (rawNewsItems.length === 0) return;
    setIsNewsAiAnalysisLoading(true);
    setShowNewsAiPanel(true);
    setNewsAiAnalysis(null);
    setNewsAiAnalysisError(null);

    setTimeout(() => {
      try {
        const BULLISH_KW = ['surge', 'jump', 'rally', 'record high', 'gain', 'rise', 'beat', 'profit', 'growth', 'expand', 'outperform', 'strong', 'recover', 'upgrade', 'win', 'deal', 'order', 'breakthrough', 'positive', 'soar', 'climb', 'high'];
        const BEARISH_KW = ['fall', 'drop', 'slump', 'crash', 'loss', 'decline', 'weak', 'miss', 'cut', 'debt', 'concern', 'risk', 'warn', 'downgrade', 'layoff', 'fraud', 'probe', 'scrutiny', 'sell', 'tumble', 'plunge', 'low', 'pressure', 'selloff'];
        const EVENT_KW = ['rbi', 'sebi', 'merger', 'acquisition', 'ipo', 'policy', 'rate', 'quarterly results', 'gdp', 'budget', 'fii', 'dii', 'q4', 'q3', 'q2', 'q1', 'inflation', 'capex'];

        const sectorScores: Record<string, { bull: number; bear: number; total: number; titles: string[] }> = {};
        const keyEvents: any[] = [];
        const seenEvents = new Set<string>();

        rawNewsItems.forEach((item: any) => {
          const sector = getItemSector(item);
          const t = (item.title || '').toLowerCase();
          if (!sectorScores[sector]) sectorScores[sector] = { bull: 0, bear: 0, total: 0, titles: [] };
          sectorScores[sector].total++;
          sectorScores[sector].titles.push(item.title || '');
          const bullHits = BULLISH_KW.filter(k => t.includes(k)).length;
          const bearHits = BEARISH_KW.filter(k => t.includes(k)).length;
          sectorScores[sector].bull += bullHits;
          sectorScores[sector].bear += bearHits;
          const isEvent = EVENT_KW.some(k => t.includes(k));
          if (isEvent && keyEvents.length < 6 && !seenEvents.has(item.title)) {
            seenEvents.add(item.title);
            const impact = bearHits > 0 ? 'HIGH' : bullHits > 0 ? 'MEDIUM' : 'LOW';
            keyEvents.push({ event: item.title, implication: `Impact on ${sector} sector`, impact });
          }
        });

        let totalBull = 0, totalBear = 0;
        Object.values(sectorScores).forEach(s => { totalBull += s.bull; totalBear += s.bear; });
        const overallSentiment = totalBull > totalBear * 1.3 ? 'BULLISH' : totalBear > totalBull * 1.3 ? 'BEARISH' : 'NEUTRAL';
        const marketMood = overallSentiment === 'BULLISH'
          ? 'Markets showing positive momentum with broad-based buying interest across key sectors.'
          : overallSentiment === 'BEARISH'
          ? 'Markets under pressure with selling across multiple sectors amid macro headwinds.'
          : 'Markets consolidating with mixed signals — selective opportunities remain.';

        const trendingSectors = Object.entries(sectorScores)
          .filter(([, s]) => s.total >= 1)
          .map(([sector, s]) => {
            const net = s.bull - s.bear;
            const sentiment = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';
            const signal = net > 1 ? 'BUY' : net < -1 ? 'SELL' : 'WATCH';
            const theme = s.titles.slice(0, 2).join(' · ').substring(0, 80) + (s.titles.length > 2 ? '…' : '');
            return { sector, sentiment, investmentSignal: signal, keyTheme: theme || `${s.total} articles`, articleCount: s.total, score: Math.abs(net) * 10 + s.total };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map((s, i) => ({ ...s, rank: i + 1 }));

        const opportunities = trendingSectors
          .filter(s => s.investmentSignal === 'BUY')
          .slice(0, 3)
          .map(s => ({ sector: s.sector, opportunity: `${s.sector} sector showing bullish momentum with ${sectorScores[s.sector]?.total || 0} positive news catalysts`, confidence: Math.min(90, 55 + (sectorScores[s.sector]?.bull || 0) * 5), timeframe: 'short' }));

        const riskAlerts = trendingSectors
          .filter(s => s.investmentSignal === 'SELL')
          .slice(0, 3)
          .map(s => ({ risk: `${s.sector} under pressure`, severity: sectorScores[s.sector]?.bear > 3 ? 'HIGH' : 'MEDIUM', mitigation: `Monitor stop-loss levels; wait for stabilisation before adding positions in ${s.sector}` }));

        const topBull = trendingSectors.find(s => s.sentiment === 'positive')?.sector || 'IT';
        const weeklyOutlook = `Based on ${rawNewsItems.length} articles across ${Object.keys(sectorScores).length} sectors — ${topBull} leads with positive sentiment. ${overallSentiment === 'BULLISH' ? 'Broader market trend favours longs; manage risk with trailing stops.' : overallSentiment === 'BEARISH' ? 'Defensive posture advised; prefer quality large-caps and reduce leverage.' : 'Stock-specific approach recommended; focus on earnings-driven catalysts.'}`;

        setNewsAiAnalysis({ overallSentiment, marketMood, trendingSectors, keyEvents, opportunities, riskAlerts, weeklyOutlook, totalArticles: rawNewsItems.length, sectorCounts: Object.fromEntries(Object.entries(sectorScores).map(([k, v]) => [k, v.total])) });
      } catch (e) {
        console.error('Local analysis error:', e);
        setNewsAiAnalysisError('Analysis failed. Please try again.');
      } finally {
        setIsNewsAiAnalysisLoading(false);
      }
    }, 600);
  };

  return (
    <div className="w-full rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <Newspaper className="h-3.5 w-3.5 text-gray-400" />
          {rawNewsItems.length > 0 && (
            <span className="text-[11px] text-gray-600">
              {newsSelectedSector
                ? `${newsItems.length} articles · ${newsSelectedSector}`
                : isAllMode
                  ? `${rawNewsItems.length} articles · last 7 days`
                  : isNifty50Mode
                    ? `${rawNewsItems.length} articles · 50 stocks`
                    : `${watchlistSymbols.length} stocks · last 7 days`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Pill tab switcher */}
          <div
            className="flex items-center p-0.5 rounded-full"
            style={{ background: '#111' }}
            data-testid="market-news-tab-switcher"
          >
            {[
              { key: 'all', label: 'All', labelFull: 'All News' },
              { key: 'watchlist', label: 'Watch', labelFull: 'Watchlist' },
              { key: 'nifty50', label: 'N50', labelFull: 'Nifty 50' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setMarketNewsMode(tab.key as 'all' | 'watchlist' | 'nifty50');
                  setNewsSelectedSector(null);
                  setShowNewsAiPanel(false);
                  setNewsAiAnalysis(null);
                  setNewsAiAnalysisError(null);
                  if (tab.key === 'watchlist' && marketNewsItems.length === 0) fetchMarketNews();
                  if (tab.key === 'all' && allMarketNewsItems.length === 0) fetchAllMarketNews();
                  if (tab.key === 'nifty50' && nifty50NewsItems.length === 0) fetchNifty50News();
                }}
                data-testid={`tab-market-news-${tab.key}`}
                className="relative px-2.5 py-1 md:px-3 text-xs font-medium rounded-full transition-all duration-200"
                style={
                  marketNewsMode === tab.key
                    ? {
                        background: 'linear-gradient(135deg, #d4d4d4 0%, #a8a8a8 40%, #c8c8c8 100%)',
                        color: '#111',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                      }
                    : { color: '#6b7280' }
                }
              >
                <span className="md:hidden">{tab.label}</span>
                <span className="hidden md:inline">{tab.labelFull}</span>
              </button>
            ))}
          </div>
          {/* AI Analysis button */}
          {(isAllMode || isNifty50Mode) && rawNewsItems.length > 0 && (
            <button
              onClick={handleAiAnalysis}
              disabled={isNewsAiAnalysisLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', opacity: isNewsAiAnalysisLoading ? 0.7 : 1 }}
              data-testid="button-news-ai-analysis"
            >
              {isNewsAiAnalysisLoading
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Sparkles className="h-3 w-3" />}
              <span className="hidden md:inline">AI Analysis</span>
            </button>
          )}
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors"
            data-testid="button-refresh-market-news"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Sector filter pills */}
      {(isAllMode || isNifty50Mode) && rawNewsItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-gray-800">
          <button
            onClick={() => setNewsSelectedSector(null)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${newsSelectedSector === null ? 'bg-gray-200 text-gray-900 border-gray-200' : 'bg-gray-800/60 text-gray-500 border-gray-700/60 hover:border-gray-500 hover:text-gray-300'}`}
            data-testid="filter-sector-all"
          >All</button>
          {(isAllMode ? _allSectors : _nifty50Sectors).map(sector => {
            const count = rawNewsItems.filter((i: any) => {
              if (isAllMode) return (i.sector || i.displayName) === sector;
              return (NIFTY50_SECTOR_MAP[i.symbol] || 'Market') === sector;
            }).length;
            if (count === 0) return null;
            const active = newsSelectedSector === sector;
            return (
              <button
                key={sector}
                onClick={() => setNewsSelectedSector(active ? null : sector)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${active ? _sectorColors[sector] || 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-gray-800/60 text-gray-500 border-gray-700/60 hover:text-gray-300 hover:border-gray-500'}`}
                data-testid={`filter-sector-${sector.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {sector} <span className="opacity-50 ml-0.5">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* AI Analysis Panel */}
      {(isAllMode || isNifty50Mode) && showNewsAiPanel && (
        <div className="border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
            <div className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-gray-300">AI Market Intelligence</span>
              {newsAiAnalysis && <span className="text-[11px] text-gray-600">· {newsAiAnalysis.totalArticles} articles</span>}
            </div>
            <button onClick={() => setShowNewsAiPanel(false)} className="text-gray-600 hover:text-gray-400 transition-colors p-0.5 rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {isNewsAiAnalysisLoading ? (
            <div className="flex items-center justify-center py-8 gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-xs text-gray-500">Analysing {rawNewsItems.length} articles…</span>
            </div>
          ) : newsAiAnalysisError ? (
            <div className="flex flex-col items-center justify-center py-7 gap-2 px-4">
              <p className="text-xs text-red-400 text-center">{newsAiAnalysisError}</p>
              <button onClick={handleAiAnalysis} className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">Try again</button>
            </div>
          ) : newsAiAnalysis ? (
            <div className="divide-y divide-gray-800/70">
              {/* Overall Sentiment */}
              <div className="px-4 py-3 flex items-center gap-3">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md tabular-nums ${newsAiAnalysis.overallSentiment === 'BULLISH' ? 'bg-green-500/10 text-green-400' : newsAiAnalysis.overallSentiment === 'BEARISH' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {newsAiAnalysis.overallSentiment === 'BULLISH' ? '▲' : newsAiAnalysis.overallSentiment === 'BEARISH' ? '▼' : '●'} {newsAiAnalysis.overallSentiment}
                </span>
                <p className="text-xs text-gray-400 flex-1 leading-relaxed">{newsAiAnalysis.marketMood}</p>
              </div>
              {/* Trending Sectors */}
              {newsAiAnalysis.trendingSectors?.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2">Sectors</p>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                    {newsAiAnalysis.trendingSectors.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 py-1">
                        <span className="text-[10px] text-gray-700 font-mono w-4 shrink-0">{s.rank || i + 1}</span>
                        <span className="text-xs text-gray-300 w-20 shrink-0">{s.sector}</span>
                        <span className={`text-[10px] font-medium shrink-0 ${s.sentiment === 'positive' ? 'text-green-500' : s.sentiment === 'negative' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {s.sentiment === 'positive' ? '▲' : s.sentiment === 'negative' ? '▼' : '●'}
                        </span>
                        <span className="text-[11px] text-gray-600 flex-1 line-clamp-1">{s.keyTheme}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Key Events + Opportunities */}
              {(newsAiAnalysis.keyEvents?.length > 0 || newsAiAnalysis.opportunities?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800/70">
                  {newsAiAnalysis.keyEvents?.length > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2">Key Events</p>
                      <div className="space-y-2">
                        {newsAiAnalysis.keyEvents.slice(0, 3).map((e: any, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`text-[9px] font-semibold px-1 py-0.5 rounded shrink-0 mt-0.5 ${e.impact === 'HIGH' ? 'bg-red-500/10 text-red-500' : e.impact === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-700 text-gray-500'}`}>{e.impact}</span>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{e.event}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {newsAiAnalysis.opportunities?.length > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2">Opportunities</p>
                      <div className="space-y-2">
                        {newsAiAnalysis.opportunities.map((o: any, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[10px] font-medium text-green-600 shrink-0 pt-0.5">{o.sector}</span>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed flex-1">{o.opportunity}</p>
                            <span className="text-[10px] text-gray-600 shrink-0 pt-0.5">{o.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Risk Alerts */}
              {newsAiAnalysis.riskAlerts?.length > 0 && (
                <div className="px-4 py-3">
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-2">Risks</p>
                  <div className="space-y-1.5">
                    {newsAiAnalysis.riskAlerts.map((r: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded shrink-0 mt-0.5 ${r.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' : r.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-700 text-gray-500'}`}>{r.severity}</span>
                        <div>
                          <p className="text-[11px] text-gray-300">{r.risk}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{r.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Outlook */}
              {newsAiAnalysis.weeklyOutlook && (
                <div className="px-4 py-3">
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mb-1.5">Outlook</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{newsAiAnalysis.weeklyOutlook}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* News list / loading / empty state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">{loadingMsg}</p>
        </div>
      ) : newsItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Newspaper className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-400">No recent news found in the last 7 days</p>
          <p className="text-xs text-gray-600">{emptyMsg}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800/60 max-h-[50vh] md:max-h-[640px] overflow-y-auto">
          {newsItems.map((item, index) => {
            const sym = (item as any).symbol as string;
            const stockData = !isAllMode ? newsStockPrices[sym] : null;
            const rawPts = stockData?.chartData ?? [];
            const fallbackPts = fallbackChartData[sym] ?? [];
            const effectivePts = rawPts.length >= 2 ? rawPts : fallbackPts;

            // When main price API has no data, derive price/change from fallback chart
            const displayData = stockData ?? ((!isAllMode && effectivePts.length >= 2) ? (() => {
              const first = effectivePts[0].price;
              const last = effectivePts[effectivePts.length - 1].price;
              const change = last - first;
              return { price: last, change, changePercent: first > 0 ? (change / first) * 100 : 0, currency: 'INR' as const };
            })() : null);

            const isUp = displayData ? displayData.change >= 0 : null;
            const sparkColor = isUp === true ? '#22c55e' : isUp === false ? '#ef4444' : '#6b7280';
            let sparkPath = '';
            if (effectivePts.length >= 2) {
              const prices = effectivePts.map((p: any) => p.price);
              const mn = Math.min(...prices), mx = Math.max(...prices);
              const rng = mx - mn || (displayData?.price ?? 1) * 0.001 || 1;
              const W = 56, H = 22;
              sparkPath = prices.map((p: number, i: number) => {
                const x = (i / (prices.length - 1)) * W;
                const y = H - ((p - mn) / rng) * H;
                return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
            }
            return (
              <div
                key={`${item.url}-${index}`}
                className="px-4 py-3 hover:bg-gray-800/40 transition-colors cursor-pointer group"
                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                data-testid={`market-news-item-${index}`}
              >
                <div className={`flex items-center gap-2 ${!isAllMode ? 'mb-1.5' : ''}`}>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${tagColor}`}>{item.displayName}</span>
                  <span className="text-gray-200 text-xs line-clamp-1 flex-1 leading-tight font-medium group-hover:text-white transition-colors">
                    {item.title}
                    <ExternalLink className="h-2.5 w-2.5 inline ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />
                  </span>
                  <span className="text-gray-600 text-[10px] shrink-0">{getWatchlistNewsRelativeTime(item.publishedAt)}</span>
                </div>
                {!isAllMode && (
                  <div className="flex items-center gap-2 pl-0.5">
                    {displayData ? (
                      <>
                        <span className="text-gray-300 text-xs font-mono">
                          {displayData.currency === 'USD'
                            ? `$${displayData.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                            : `₹${displayData.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        </span>
                        <span className={`text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                          {isUp ? '▲' : '▼'} {Math.abs(displayData.changePercent).toFixed(2)}%
                        </span>
                        {sparkPath && (
                          <svg width="56" height="22" viewBox="0 0 56 22" className="shrink-0">
                            <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">Loading…</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const queryClient = useQueryClient();
  const [activeVoiceProfileId, setActiveVoiceProfileId] = useState<string>(() => { if (typeof window !== 'undefined') { return localStorage.getItem('activeVoiceProfileId') || 'ravi'; } return 'ravi'; });
  const [voiceLanguage, setVoiceLanguage] = useState("en"); // Multilingual support: en, hi, bn, ta, te, mr, gu, kn, ml
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevProgressRef = useRef(0);
  const isTortoiseFacingRightRef = useRef(true);

  useEffect(() => {
    localStorage.setItem('activeVoiceProfileId', activeVoiceProfileId);
    // Notify SwipeableCardStack to re-preload all sectors with the new voice profile
    window.dispatchEvent(new CustomEvent('perala-voice-profile-change', { detail: { speaker: activeVoiceProfileId } }));
  }, [activeVoiceProfileId]);
  useEffect(() => {
    localStorage.setItem('voiceLanguage', voiceLanguage);
    // Notify all AudioMinicastCard instances so they can invalidate their caches
    // and re-generate audio in the new language (same-tab 'storage' events don't fire)
    window.dispatchEvent(new CustomEvent('perala-voice-lang-change', { detail: { lang: voiceLanguage } }));
  }, [voiceLanguage]);
  useEffect(() => { 
    const saved = localStorage.getItem('voiceLanguage'); 
    if (saved && saved !== voiceLanguage) setVoiceLanguage(saved); 
  }, []);

  const voiceUserNameRef = React.useRef('');
  const prefetchVoiceAudio = async (lang: string, silent = false) => {
    const DURATION = 600;

    // Show progress bar only when user explicitly changes language (not on silent mount preload)
    if (!silent) {
      setVoiceLangLoading(true);
      setVoiceLangProgress(0);
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min((elapsed / DURATION) * 100, 99);
        setVoiceLangProgress(pct);
        if (elapsed < DURATION) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    // Trigger swipe card audio preloading in the selected language in background
    if ((window as any)._preloadSwipeCardsForLang) {
      (window as any)._preloadSwipeCardsForLang(lang);
    }

    // Pre-warm greeting audio for all voice profiles in the new language (fire-and-forget)
    // Pre-warm greeting audio for all voice profiles in the new language (fire-and-forget)
    const u = voiceUserNameRef.current;
    const greetingsByLang: { [key: string]: (p: string) => string } = {
      en: (p) => u ? `Hello ${u}! I am ${p}. Welcome to Perala! How is your day?` : `Hello! I am ${p}. Welcome to Perala! How is your day?`,
      hi: (p) => u ? `नमस्ते ${u}! मैं ${p} हूँ। पेरला में आपका स्वागत है! आपका दिन कैसा है?` : `नमस्ते! मैं ${p} हूँ। पेरला में आपका स्वागत है! आपका दिन कैसा है?`,
      bn: (p) => u ? `নমস্কার ${u}! আমি ${p}। পেরলায় আপনাকে স্বাগত! আপনার দিন কেমন যাচ্ছে?` : `নমস্কার! আমি ${p}। পেরলায় আপনাকে স্বাগত! আপনার দিন কেমন যাচ্ছে?`,
      ta: (p) => u ? `வணக்கம் ${u}! நான் ${p}. பெரலாவில் உங்களை வரவேற்கிறோம்! உங்கள் நாள் எப்படி இருக்கிறது?` : `வணக்கம்! நான் ${p}. பெரலாவில் உங்களை வரவேற்கிறோம்! உங்கள் நாள் எப்படி இருக்கிறது?`,
      te: (p) => u ? `నమస్కారం ${u}! నేను ${p}. పెరలాలో మీకు స్వాగతం! మీ రోజు ఎలా ఉంది?` : `నమస్కారం! నేను ${p}. పెరలాలో మీకు స్వాగతం! మీ రోజు ఎలా ఉంది?`,
      mr: (p) => u ? `नमस्कार ${u}! मी ${p} आहे. पेरलामध्ये तुमचे स्वागत आहे! तुमचा दिवस कसा आहे?` : `नमस्कार! मी ${p} आहे. पेरलामध्ये तुमचे स्वागत आहे! तुमचा दिवस कसा आहे?`,
      gu: (p) => u ? `નમસ્તે ${u}! હું ${p} છું. પेरलामां आपनुं स्वागत छे! तमारो दिवस केवो छे?` : `નમસ્તે! હું ${p} છું. પेरलामां आपनुं स्वागत छे! तमारो दिवस केवो छे?`,
      kn: (p) => u ? `ನಮಸ್ಕಾರ ${u}! ನಾನು ${p}. ಪೆರಲಾದಲ್ಲಿ ನಿಮಗೆ ಸ್ವಾಗತ! ನಿಮ್ಮ ದಿನ ಹೇಗಿದೆ?` : `ನಮಸ್ಕಾರ! ನಾನು ${p}. ಪೆರಲಾದಲ್ಲಿ ನಿಮಗೆ ಸ್ವಾಗತ! ನಿಮ್ಮ ದಿನ ಹೇಗಿದೆ?`,
      ml: (p) => u ? `നമസ്കാരം ${u}! ഞാൻ ${p} ആണ്. പെരലയിലേക്ക് സ്വാഗതം! നിങ്ങളുടെ ദിവസം എങ്ങനെയുണ്ട്?` : `നമസ്കാരം! ഞാൻ ${p} ആണ്. പെരലയിലേക്ക് സ്വാഗതം! നിങ്ങളുടെ ദിവസം എങ്ങനെയുണ്ട്?`,
      pa: (p) => u ? `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${u}! ਮੈਂ ${p} ਹਾਂ। ਪੇਰਲਾ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਤੁਹਾਡਾ ਦਿਨ ਕਿਵੇਂ ਹੈ?` : `ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ${p} ਹਾਂ। ਪੇਰਲਾ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਤੁਹਾਡਾ ਦਿਨ ਕਿਵੇਂ ਹੈ?`,
      or: (p) => u ? `ନମସ୍କାର ${u}! ମୁଁ ${p}। ପେରଲାରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ! ଆପଣଙ୍କ ଦିନ କ'ଣ?` : `ନମସ୍କାର! ମୁଁ ${p}। ପେରଲାରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ! ଆପଣଙ୍କ ଦିନ କ'ଣ?`,
    };
    const profilesByLang: { [key: string]: Array<{id: string, name: string}> } = {
      en: [{ id: 'en-IN-PrabhatNeural', name: 'Prabhat' }, { id: 'en-IN-NeerjaNeural', name: 'Neerja' }],
      hi: [{ id: 'hi-IN-MadhurNeural', name: 'Madhur' }, { id: 'hi-IN-SwaraNeural', name: 'Swara' }],
      bn: [{ id: 'bn-IN-BashkarNeural', name: 'Bashkar' }, { id: 'bn-IN-TanishaaNeural', name: 'Tanishaa' }],
      ta: [{ id: 'ta-IN-ValluvarNeural', name: 'Valluvar' }, { id: 'ta-IN-PallaviNeural', name: 'Pallavi' }],
      te: [{ id: 'te-IN-MohanNeural', name: 'Mohan' }, { id: 'te-IN-ShrutiNeural', name: 'Shruti' }],
      mr: [{ id: 'mr-IN-ManoharNeural', name: 'Manohar' }, { id: 'mr-IN-AarohiNeural', name: 'Aarohi' }],
      gu: [{ id: 'gu-IN-NiranjanNeural', name: 'Niranjan' }, { id: 'gu-IN-DhwaniNeural', name: 'Dhwani' }],
      kn: [{ id: 'kn-IN-GaganNeural', name: 'Gagan' }, { id: 'kn-IN-SapnaNeural', name: 'Sapna' }],
      ml: [{ id: 'ml-IN-MidhunNeural', name: 'Midhun' }, { id: 'ml-IN-SobhanaNeural', name: 'Sobhana' }],
      pa: [{ id: 'hi-IN-MadhurNeural', name: 'Madhur' }, { id: 'hi-IN-SwaraNeural', name: 'Swara' }],
      or: [{ id: 'bn-IN-BashkarNeural', name: 'Bashkar' }, { id: 'bn-IN-TanishaaNeural', name: 'Tanishaa' }],
    };
    const getGreeting = greetingsByLang[lang] || greetingsByLang['en'];
    const profiles = profilesByLang[lang] || profilesByLang['en'];
    profiles.forEach((profile) => {
      const cacheKey = `${profile.id}_${lang}`;
      if (voiceAudioCacheRef.current[cacheKey]) return; // already cached
      if (voicePromiseCacheRef.current[cacheKey]) return; // already in-flight
      const text = getGreeting(profile.name);
      const promise = fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang, speaker: profile.id, speed: 1.0, pitch: 1.0 }),
      }).then(r => r.ok ? r.json() : null).then(data => {
        if (data?.audioBase64) {
          const base64Data = data.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
          const binary = atob(base64Data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const audioUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
          voiceAudioCacheRef.current[cacheKey] = audioUrl;
          delete voicePromiseCacheRef.current[cacheKey];
          return audioUrl;
        }
        delete voicePromiseCacheRef.current[cacheKey];
        return null;
      }).catch(() => { delete voicePromiseCacheRef.current[cacheKey]; return null; });
      voicePromiseCacheRef.current[cacheKey] = promise;
    });

    if (!silent) {
      await new Promise(r => setTimeout(r, DURATION));
      setVoiceLangProgress(100);
      setVoiceLangLoading(false);
    }
  };

  // Silently pre-warm voices for the saved/default language on mount
  React.useEffect(() => {
    const savedLang = localStorage.getItem('voiceLanguage') || 'en';
    prefetchVoiceAudio(savedLang, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [location, setLocation] = useLocation();
  const [showGuestDialog, setShowGuestDialog] = useState(false);

  // 🔶 Detect Angel One OAuth callback from redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("angelone_connected")) {
      console.log("✅ Angel One connected successfully (redirect callback)");
      setAngelOneIsConnected(true);
      setAngelOneAccessToken(params.get("angelone_client_code") || "P176266");
      localStorage.setItem("angel_one_client_code", params.get("angelone_client_code") || "P176266");
      toast({ title: "Success", description: "Angel One connected successfully" });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.has("angelone_error")) {
      const error = decodeURIComponent(params.get("angelone_error") || "");
      console.error("❌ Angel One auth error:", error);
      toast({ variant: "destructive", title: "Error", description: error });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  // AUTO-CONNECT: Angel One API - Automatically connect when app loads
  // Read-only status query — auto-connect is handled exclusively by the global
  // AngelOneGlobalAutoConnect in App.tsx. Using it here too would fire two
  // simultaneous connect-env mutations and cause TOTP race conditions.
  const { data: angelOneServerStatus } = useQuery<{
    success: boolean; connected: boolean; authenticated: boolean;
    clientCode?: string; tokenExpired?: boolean;
  }>({
    queryKey: ["/api/angelone/status"],
    refetchInterval: 5000,
    staleTime: 4000,
  });
  const angelOneServerConnected = !!(angelOneServerStatus?.connected && angelOneServerStatus?.authenticated && !angelOneServerStatus?.tokenExpired);

  // Sync server-side Angel One connection status into local state so chart data
  // (journal tab, etc.) works even without visiting the trading dashboard tab first.
  // NOTE: Only sets angelOneAccessToken (for charts/data), NOT angelOneIsConnected
  // (broker UI) — the company auto-connect is separate from the user's broker selection.
  useEffect(() => {
    if (angelOneServerConnected && angelOneServerStatus?.clientCode) {
      const clientCode = angelOneServerStatus.clientCode;
      // Clean up any company clientCode that was wrongly stored as a broker token
      // (from a previous fix). If the stored value matches the company clientCode,
      // it is not a user-connected broker token — remove it and reset broker UI state.
      const storedToken = localStorage.getItem('angel_one_token');
      if (storedToken === clientCode) {
        localStorage.removeItem('angel_one_token');
        setAngelOneIsConnected(false);
        console.log('🧹 [AUTO-CONNECT] Removed company clientCode from broker token storage');
      }
      setAngelOneAccessToken(clientCode);
      console.log('✅ [AUTO-CONNECT] Synced Angel One chart token to local state (broker UI unchanged)');
    }
  }, [angelOneServerConnected, angelOneServerStatus?.clientCode]);
  const { theme, toggleTheme } = useTheme();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [activeTab, setActiveTab] = useState("trading-home");

  // Track which tabs have been visited so we only start loading their data when needed
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(["trading-home"]));
  useEffect(() => {
    setVisitedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Stop all audio (voice profile + swipeable news cards) when user switches tabs
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    (window as any).stopNewsAudio?.();
  }, [activeTab]);

  // Show guest login dialog when unauthenticated user visits social feed or journal tab
  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    const isAuthenticated = userId && userEmail && userId !== 'null' && userEmail !== 'null';
    if (!isAuthenticated && (activeTab === 'voice' || activeTab === 'journal')) {
      const delay = activeTab === 'journal' ? 45000 : 14000;
      const timer = setTimeout(() => {
        setShowGuestDialog(true);
      }, delay);
      return () => clearTimeout(timer);
    } else if (activeTab !== 'voice' && activeTab !== 'journal') {
      setShowGuestDialog(false);
    }
  }, [activeTab]);

  const [showTutorOverlay, setShowTutorOverlay] = useState(false);
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
  const userEmail = localStorage.getItem("currentUserEmail");
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeCurrentY, setSwipeCurrentY] = useState(0);
  const [isSwipingUp, setIsSwipingUp] = useState(false);
  const [showJournalAI, setShowJournalAI] = useState(false);
  const [journalAIData, setJournalAIData] = useState<any>(null);
  const [statisticsTab, setStatisticsTab] = useState("overview");
  const [journalReportActiveTab, setJournalReportActiveTab] = useState<'personal1' | 'personal2'>('personal1');
  const [journalReportMetrics, setJournalReportMetrics] = useState<any>(null);
  const [journalScreenTimeStart, setJournalScreenTimeStart] = useState<number | null>(null);
  const [journalCurrentSessionSecs, setJournalCurrentSessionSecs] = useState(0);
  const [journalScreenTimeSessions, setJournalScreenTimeSessions] = useState<Array<{date: string; totalSeconds: number}>>([]);
  const [journalTabCurrentSecs, setJournalTabCurrentSecs] = useState(0);
  // Calendar state - declared early to avoid temporal dead zone issues
  const [selectedDate, setSelectedDate] = useState(null as Date | null);
  // Shared timeframe state for chart and crossings display
  const [chartTimeframe, setChartTimeframe] = useState<string>("1");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [newDob, setNewDob] = useState("");
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  // Navigation menu state
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);

  // Stop voice greeting when voice panel collapses or nav closes
  useEffect(() => {
    if (!isVoiceActive && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    // Prefetch greeting audio for all voices instantly when panel opens
    if (isVoiceActive) {
      prefetchVoiceAudio(voiceLanguage, true);
    }
  }, [isVoiceActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isNavOpen && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, [isNavOpen]);

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"feedback" | "request">("feedback");
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackSubmitSuccess, setFeedbackSubmitSuccess] = useState(false);
  const [adminFeedbackItems, setAdminFeedbackItems] = useState<any[]>([]);
  const [adminFeedbackLoading, setAdminFeedbackLoading] = useState(false);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voiceBreakTime, setVoiceBreakTime] = useState(200); // ms
  const [voiceEmphasis, setVoiceEmphasis] = useState("moderate"); // none, moderate, strong
  const [voicePitchVariation, setVoicePitchVariation] = useState(10);
  const [voiceTemperature, setVoiceTemperature] = useState(0.68);
  const [voiceNoiseScale, setVoiceNoiseScale] = useState(0.67);
  const [voiceCommaPause, setVoiceCommaPause] = useState(220);
  const [voicePeriodPause, setVoicePeriodPause] = useState(500);
  const [voiceEnergyDynamic, setVoiceEnergyDynamic] = useState(5);
  const [voiceNounDuration, setVoiceNounDuration] = useState(1.15);
  const [voiceFunctionDuration, setVoiceFunctionDuration] = useState(0.92);
  const [voiceMicroJitter, setVoiceMicroJitter] = useState(3);
  // Use a ref (not state) so cache writes never trigger re-renders
  const voiceAudioCacheRef = useRef<{[key: string]: string}>({});
  // Tracks in-flight TTS fetches so clicks can await them instead of firing duplicates
  const voicePromiseCacheRef = useRef<{[key: string]: Promise<string | null>}>({});
  const [voiceLangLoading, setVoiceLangLoading] = useState(false);
  const [voiceLangProgress, setVoiceLangProgress] = useState(0);
  const [showAdminDashboardDialog, setShowAdminDashboardDialog] = useState(false);
  const [adminTab, setAdminTab] = useState("bugs-list");
  const [showMagicBugBar, setShowMagicBugBar] = useState(false);
  const [showReportBugDialog, setShowReportBugDialog] = useState(false);
  const [reportBugTab, setReportBugTab] = useState<"social-feed" | "journal" | "others">("social-feed");
  const [reportBugTitle, setReportBugTitle] = useState("");
  const [reportBugDescription, setReportBugDescription] = useState("");
  const [reportBugFiles, setReportBugFiles] = useState<File[]>([]);
  const [reportBugSubmitting, setReportBugSubmitting] = useState(false);
  const [showAddAdminAccessDialog, setShowAddAdminAccessDialog] = useState(false);
  const [adminAccessEmail, setAdminAccessEmail] = useState("");
  const [adminAccessRole, setAdminAccessRole] = useState<"developer" | "admin">("developer");
  const [journalFundBase, setJournalFundBase] = useState<number>(1000);
  const [journalLastDeducted, setJournalLastDeducted] = useState<number>(0);
  const [influencerPeriod, setInfluencerPeriod] = useState<{ active: boolean; expiryDate: string; startDate: string; days: number } | null>(null);
  // Influencer admin tab state
  const [influencerEmailSearch, setInfluencerEmailSearch] = useState("");
  const [influencerSearchResults, setInfluencerSearchResults] = useState<Array<{ userId: string; email: string; displayName: string }>>([]);
  const [influencerSearchLoading, setInfluencerSearchLoading] = useState(false);
  const [influencerSelectedUser, setInfluencerSelectedUser] = useState<{ userId: string; email: string; displayName: string } | null>(null);
  const [influencerDays, setInfluencerDays] = useState<number>(90);
  const [influencerActivating, setInfluencerActivating] = useState(false);
  const [influencerActivated, setInfluencerActivated] = useState<{ userId: string; email: string; days: number; expiryDate: string } | null>(null);
  const [influencerShowSearch, setInfluencerShowSearch] = useState(false);
  const [influencerList, setInfluencerList] = useState<Array<{ userId: string; userEmail: string; displayName: string; days: number; startDate: string; expiryDate: string; grantedBy: string; active: boolean }>>([]);
  const [influencerListLoading, setInfluencerListLoading] = useState(false);
  const [influencerListSearch, setInfluencerListSearch] = useState("");
  const [influencerRevoking, setInfluencerRevoking] = useState<string | null>(null);
  const [showAddInfluencerDialog, setShowAddInfluencerDialog] = useState(false);
  const [influencerSortMode, setInfluencerSortMode] = useState<'all' | 'expiring' | 'longest' | 'active' | 'expired'>('all');

  // Load wallet from server for the current user
  const loadWallet = async (userId: string) => {
    try {
      const res = await fetch(`/api/journal-wallet/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.wallet) {
          setJournalFundBase(data.wallet.balance ?? 1000);
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not load journal wallet from server, using default');
    }
  };

  // Load influencer free period for the current user
  const loadInfluencerPeriod = async (userId: string) => {
    try {
      const res = await fetch(`/api/influencer/period/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.active && data.period) {
          setInfluencerPeriod({ active: true, expiryDate: data.period.expiryDate, startDate: data.period.startDate, days: data.period.days });
        } else {
          setInfluencerPeriod(null);
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not load influencer period');
    }
  };

  // Load all active influencer periods (admin only)
  const loadInfluencerList = async () => {
    setInfluencerListLoading(true);
    try {
      const res = await fetch('/api/influencer/list-all');
      if (res.ok) {
        const data = await res.json();
        setInfluencerList(data.periods || []);
      }
    } catch (e) {
      console.warn('⚠️ Could not load influencer list');
    } finally {
      setInfluencerListLoading(false);
    }
  };
  const [adminBugReports, setAdminBugReports] = useState<Array<{ bugId: string; title: string; reportDate: string; bugLocate: string; status: string; username: string; }>>([]); 
  const [loadingBugReports, setLoadingBugReports] = useState(false);
  const [expandedBugId, setExpandedBugId] = useState<string | null>(null);
  const [bugListFilter, setBugListFilter] = useState<'all' | 'critical' | 'repeated' | 'priority'>('all');
  
  // Primary owner email - only this user can manage admin access
  const PRIMARY_OWNER_EMAIL = "chiranjeevi.perala99@gmail.com";
  
  // Authorized users state with localStorage persistence
  interface AuthorizedUser {
    email: string;
    role: "developer" | "admin" | "owner";
    addedAt: string;
  }
  
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem("authorizedUsers");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [{ email: PRIMARY_OWNER_EMAIL, role: "owner" as const, addedAt: new Date().toISOString() }];
      }
    }
    // Default: only primary owner
    return [{ email: PRIMARY_OWNER_EMAIL, role: "owner" as const, addedAt: new Date().toISOString() }];
  });
  
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  
  // Fetch bug reports when admin dashboard opens with bugs-list tab
  useEffect(() => {
    if (showAdminDashboardDialog && adminTab === "bugs-list") {
      setLoadingBugReports(true);
      fetch("/api/admin/bug-reports")
        .then(res => res.json())
        .then(data => {
          setAdminBugReports(data);
          setLoadingBugReports(false);
        })
        .catch(err => {
          console.error("Error fetching bug reports:", err);
          setLoadingBugReports(false);
        });
    }
  }, [showAdminDashboardDialog, adminTab]);

  // Save authorized users to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("authorizedUsers", JSON.stringify(authorizedUsers));
  }, [authorizedUsers]);

  // Fetch admin access from AWS when admin dashboard opens with admin-access tab
  useEffect(() => {
    if (showAdminDashboardDialog && adminTab === "admin-access") {
      console.log('📥 Fetching admin access from AWS...');
      fetch('/api/admin/access')
        .then(res => res.json())
        .then((data: any[]) => {
          console.log('✅ Fetched admin access from AWS:', data);
          // Transform AWS data to local format
          const awsUsers: AuthorizedUser[] = data.map(item => ({
            email: item.email_id,
            role: item.roles as "developer" | "admin" | "owner",
            addedAt: item.date
          }));
          // Merge with primary owner if not present
          const hasOwner = awsUsers.some(u => u.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase());
          if (!hasOwner) {
            awsUsers.unshift({ email: PRIMARY_OWNER_EMAIL, role: "owner" as const, addedAt: new Date().toISOString() });
          }
          setAuthorizedUsers(awsUsers);
        })
        .catch(err => {
          console.error('❌ Error fetching admin access:', err);
        });
    }
  }, [showAdminDashboardDialog, adminTab]);

  // Fetch feedback/feature requests when admin feedback tabs open
  useEffect(() => {
    if (showAdminDashboardDialog && (adminTab === "feedback" || adminTab === "feature-requests")) {
      setAdminFeedbackLoading(true);
      fetch("/api/admin/feedback")
        .then(res => res.json())
        .then(data => {
          setAdminFeedbackItems(Array.isArray(data) ? data : []);
          setAdminFeedbackLoading(false);
        })
        .catch(err => {
          console.error("Error fetching feedback:", err);
          setAdminFeedbackLoading(false);
        });
    }
  }, [showAdminDashboardDialog, adminTab]);

  // Handler to add new admin access
  const handleAddAdminAccess = async () => {
    if (!adminAccessEmail || !adminAccessEmail.includes("@")) return;
    
    // Check if email already exists
    if (authorizedUsers.some(u => u.email.toLowerCase() === adminAccessEmail.toLowerCase())) {
      toast({
        title: "Email already exists",
        description: "This email is already in the authorized list.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Save to AWS DynamoDB
      const response = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_id: adminAccessEmail.toLowerCase(),
          roles: adminAccessRole
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save admin access');
      }
      
      const savedData = await response.json();
      console.log('✅ Admin access saved to AWS:', savedData);
      
      const newUser: AuthorizedUser = {
        email: adminAccessEmail.toLowerCase(),
        role: adminAccessRole,
        addedAt: savedData.date || new Date().toISOString(),
      };
      
      setAuthorizedUsers(prev => [...prev, newUser]);
      setShowAddAdminAccessDialog(false);
      setAdminAccessEmail("");
      setAdminAccessRole("developer");
      
      toast({
        title: "Access granted",
        description: `${newUser.email} has been added with ${newUser.role} role.`,
      });
    } catch (error: any) {
      console.error('❌ Error saving admin access:', error);
      toast({
        title: "Error saving access",
        description: error.message || "Failed to save admin access to database.",
        variant: "destructive",
      });
    }
  };
  
  // Handler to revoke admin access (only primary owner can do this)
  const handleRevokeAdminAccess = (email: string) => {
    if (email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) {
      toast({
        title: "Cannot revoke",
        description: "Primary owner access cannot be revoked.",
        variant: "destructive",
      });
      return;
    }
    
    setAuthorizedUsers(prev => prev.filter(u => u.email.toLowerCase() !== email.toLowerCase()));
    
    toast({
      title: "Access revoked",
      description: `${email} has been removed from the authorized list.`,
    });
  };
  
  // Filter authorized users based on search query
  const filteredAuthorizedUsers = authorizedUsers.filter(user =>
    user.email.toLowerCase().includes(adminSearchQuery.toLowerCase())
  );


  const handleReportBug = async () => {
    const token = await getCognitoToken();
    if (!reportBugTitle || !reportBugDescription || reportBugSubmitting) return;

    setReportBugSubmitting(true);
    try {
      let imageUrls: string[] = [];

      // Convert files to base64 data URLs (same approach as Create Post)
      if (reportBugFiles.length > 0) {
        console.log(`📤 Converting ${reportBugFiles.length} bug report media files to base64...`);
        
        const convertToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        };

        const base64Promises = reportBugFiles.map(file => convertToBase64(file));
        imageUrls = await Promise.all(base64Promises);
        console.log(`✅ Converted ${imageUrls.length} media files to base64`);
      }

      // Submit bug report with base64 image data
      const response = await fetch("/api/report-bug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`
        },
        body: JSON.stringify({
          title: reportBugTitle,
          description: reportBugDescription,
          tab: reportBugTab,
          imageUrls: imageUrls
        }),
      });

      if (!response.ok) throw new Error("Failed to submit bug report");

      toast({
        title: "Success",
        description: "Bug report submitted successfully. Thank you!",
      });

      setShowReportBugDialog(false);
      setReportBugTitle("");
      setReportBugDescription("");
      setReportBugFiles([]);
      setReportBugTab("social-feed");
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast({
        title: "Error",
        description: "Failed to submit bug report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReportBugSubmitting(false);
    }
  };

  const handleUpdateProfile = async (updates: any) => {
    try {
      const token = await getCognitoToken();
    console.log("🐞 [DEBUG] Token for bug report:", token ? "Found" : "Missing");
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        toast({ description: "Profile updated successfully" });
        window.location.reload();
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({ description: "Error updating profile", variant: "destructive" });
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }
    setIsCheckingUsername(true);
    try {
      const response = await fetch(`/api/user/check-username/${username}`);
      const data = await response.json();
      setIsUsernameAvailable(data.available);
    } catch (error) {
      console.error("Username check error:", error);
      setIsUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Mobile bottom navigation state (home, insight, ranking, paper-trade)
  const [mobileBottomTab, setMobileBottomTab] = useState<
    "home" | "insight" | "ranking" | "paper-trade"
  >("home");
  // Settings panel state
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [verificationOtp, setVerificationOtp] = useState("");
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationConfirming, setVerificationConfirming] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Clear old localStorage data - using AWS only now
  useEffect(() => {
    localStorage.removeItem("tradingDataByDate");
    console.log("🧹 Cleared old localStorage tradingDataByDate - using AWS only");
  }, []);

  // Auth state initialization - wait for AWS to sync
  const [authInitialized, setAuthInitialized] = useState(false);
  // View-only mode for unauthenticated users - they can view but not interact with protected features
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const allAudioTracks = [
    { title: "Deep Relaxation Meditation", duration: "10:05", id: "m1", youtubeId: "B7nkVhC10Gw" },
    { title: 'Bruce Lee: "Your Greatest Enemy Is Within"', duration: "22:30", id: "p1", youtubeId: "KnppzfiZcgM" },
  ];
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<{title: string, duration: string, id: string, youtubeId: string} | null>(allAudioTracks[1]);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isYTReady, setIsYTReady] = useState(false);
  const youtubePlayerRef = useRef<any>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAudioPlayingRef = useRef(false);
  const selectedAudioTrackRef = useRef<any>(null);
  useEffect(() => { isAudioPlayingRef.current = isAudioPlaying; }, [isAudioPlaying]);
  useEffect(() => { selectedAudioTrackRef.current = selectedAudioTrack; }, [selectedAudioTrack]);

  useEffect(() => {
    // Create the persistent player container outside React's render tree
    // so it is never unmounted when the component re-renders with early returns
    if (!document.getElementById("youtube-audio-player")) {
      const container = document.createElement("div");
      container.id = "youtube-audio-player";
      container.style.cssText = "position:fixed;bottom:0;left:0;width:0;height:0;opacity:0;pointer-events:none;overflow:hidden;";
      document.body.appendChild(container);
    }

    if ((window as any).YT && (window as any).YT.Player) {
      setIsYTReady(true);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log("📺 YouTube IFrame API Ready");
      setIsYTReady(true);
    };
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isYTReady || !selectedAudioTrack?.youtubeId) return;

    setCurrentTime(0);
    setAudioProgress(0);
    setDuration(0);

    const startProgressInterval = () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
          const time = youtubePlayerRef.current.getCurrentTime();
          setCurrentTime(time);
          const d = youtubePlayerRef.current.getDuration?.() || 0;
          if (d > 0) {
            setDuration(d);
            setAudioProgress((time / d) * 100);
          }
        }
      }, 500);
    };

    // If player already exists, load new video into it (preserves mobile gesture context)
    // onStateChange uses selectedAudioTrackRef so it's always current — no need to re-register
    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.loadVideoById === "function") {
      if (isAudioPlayingRef.current) {
        youtubePlayerRef.current.loadVideoById(selectedAudioTrack.youtubeId);
      } else {
        youtubePlayerRef.current.cueVideoById(selectedAudioTrack.youtubeId);
      }
      startProgressInterval();
      return;
    }

    // First time: create the player
    const playerContainer = document.getElementById("youtube-audio-player");
    if (!playerContainer) return;

    const shouldAutoPlay = isAudioPlayingRef.current;
    youtubePlayerRef.current = new (window as any).YT.Player("youtube-audio-player", {
      height: "0",
      width: "0",
      videoId: selectedAudioTrack.youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        showinfo: 0,
        modestbranding: 1,
        loop: 0,
        fs: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
        autohide: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          const dur = event.target.getDuration();
          if (dur > 0) setDuration(dur);
          startProgressInterval();
          console.log("🎵 YouTube Audio Ready");
          if (shouldAutoPlay) event.target.playVideo();
        },
        onStateChange: (event: any) => {
          const YTState = (window as any).YT?.PlayerState;
          if (!YTState) return;
          if (event.data === YTState.ENDED) {
            const current = selectedAudioTrackRef.current;
            const currentIdx = allAudioTracks.findIndex(t => t.id === current?.id);
            const nextTrack = allAudioTracks[(currentIdx + 1) % allAudioTracks.length];
            setSelectedAudioTrack(nextTrack);
            setIsAudioPlaying(true);
          } else if (event.data === YTState.PLAYING) {
            setIsAudioPlaying(true);
          }
        },
      }
    });
  }, [selectedAudioTrack, isYTReady]);

  useEffect(() => {
    if (!youtubePlayerRef.current) return;
    if (isAudioPlaying) {
      if (typeof youtubePlayerRef.current.playVideo === "function") youtubePlayerRef.current.playVideo();
    } else {
      if (typeof youtubePlayerRef.current.pauseVideo === "function") youtubePlayerRef.current.pauseVideo();
    }
  }, [isAudioPlaying]);

  // Get current user data from AWS DynamoDB
  const { currentUser } = useCurrentUser();

  // Keep voiceUserNameRef in sync with currentUser and re-prefetch greeting audio
  // so voice profiles play instantly (cache is warm with the correct personalised greeting)
  React.useEffect(() => {
    const name = currentUser?.displayName || currentUser?.name || currentUser?.username || '';
    if (name !== voiceUserNameRef.current) {
      voiceUserNameRef.current = name;
      // Clear stale cached audio so the re-prefetch stores personalised greetings
      const lang = localStorage.getItem('voiceLanguage') || 'en';
      const profileIds = [
        'en-IN-PrabhatNeural','en-IN-NeerjaNeural',
        'hi-IN-MadhurNeural','hi-IN-SwaraNeural',
        'bn-IN-BashkarNeural','bn-IN-TanishaaNeural',
        'ta-IN-ValluvarNeural','ta-IN-PallaviNeural',
        'te-IN-MohanNeural','te-IN-ShrutiNeural',
        'mr-IN-ManoharNeural','mr-IN-AarohiNeural',
        'gu-IN-NiranjanNeural','gu-IN-DhwaniNeural',
        'kn-IN-GaganNeural','kn-IN-SapnaNeural',
        'ml-IN-MidhunNeural','ml-IN-SobhanaNeural',
      ];
      profileIds.forEach(id => { delete voiceAudioCacheRef.current[`${id}_${lang}`]; });
      prefetchVoiceAudio(lang, true);
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps
  // Mirror the same ['my-profile'] query used by the social feed so the sidebar avatar
  // stays in sync without a page refresh whenever the user updates their profile picture.
  const { data: sidebarProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const token = await getCognitoToken();
      if (!token) return null;
      const res = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile || null;
    },
    enabled: !!currentUser?.userId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Use the live-fetched pic, falling back to what useCurrentUser loaded from localStorage
  const sidebarProfilePicUrl = sidebarProfile?.profilePicUrl ?? currentUser?.profilePicUrl ?? null;

  // Check if current user is the primary owner
  const isPrimaryOwner = currentUser?.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();

  // Initialize AWS auth sync with localStorage - NO AUTOMATIC REDIRECT
  // Users can view the home screen, redirect only happens when they try to interact with protected content
  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');

    if (userId && userEmail && userId !== 'null' && userEmail !== 'null') {
      console.log('✅ Auth initialized from localStorage:', { userId, userEmail });
      setAuthInitialized(true);
      setIsViewOnlyMode(false);
    } else {
      // Wait for AWS auth state with timeout - but DON'T redirect, just enable view-only mode
      const timer = setTimeout(() => {
        const finalUserId = localStorage.getItem('currentUserId');
        const finalUserEmail = localStorage.getItem('currentUserEmail');

        if (!finalUserId || !finalUserEmail || finalUserId === 'null' || finalUserEmail === 'null') {
          console.log('🎯 No auth found - enabling view-only mode (no redirect)');
          setIsViewOnlyMode(true);
          setAuthInitialized(true); // Mark as initialized so UI renders
        } else {
          console.log('✅ Auth initialized after delay:', { finalUserId, finalUserEmail });
          setAuthInitialized(true);
          setIsViewOnlyMode(false);
        }
      }, 500); // Use AWS Cognito for authentication sync

      return () => clearTimeout(timer);
    }
  }, []);

  // AI Search state

  // Check email verification status when settings panel opens
  useEffect(() => {
    if (showSettingsPanel && currentUser) {
      checkEmailVerified().then((verified) => {
        setEmailVerified(verified);
      }).catch(() => {
        setEmailVerified(false);
      });
    }
  }, [showSettingsPanel, currentUser]);

  // Handle sending verification OTP
  const handleSendVerificationOtp = async () => {
    setVerificationSending(true);
    setVerificationError("");
    try {
      await sendEmailVerificationCode();
      setVerificationCodeSent(true);
    } catch (error: any) {
      setVerificationError(error?.message || "Failed to send verification code");
    } finally {
      setVerificationSending(false);
    }
  };

  // Handle confirming email verification
  const handleConfirmVerification = async () => {
    if (!verificationOtp || verificationOtp.length !== 6) {
      setVerificationError("Please enter a valid 6-digit code");
      return;
    }
    setVerificationConfirming(true);
    setVerificationError("");
    try {
      await confirmEmailVerification(verificationOtp);
      setEmailVerified(true);
      setVerificationCodeSent(false);
      setVerificationOtp("");
    } catch (error: any) {
      if (error?.name === "CodeMismatchException") {
        setVerificationError("Invalid verification code. Please try again.");
      } else if (error?.name === "ExpiredCodeException") {
        setVerificationError("Code expired. Please request a new one.");
      } else {
        setVerificationError(error?.message || "Verification failed");
      }
    } finally {
      setVerificationConfirming(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchInputActive, setIsSearchInputActive] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [searchResultsNews, setSearchResultsNews] = useState<any[]>([]);
  const [searchResultsNewsSymbol, setSearchResultsNewsSymbol] = useState("");
  const [aiChartSelectedTimeframe, setAiChartSelectedTimeframe] = useState('1Y');

  const [flashBarIndex, setFlashBarIndex] = useState(0);
  const [flashBarVisible, setFlashBarVisible] = useState(true);
  const [flashBarFallbackChartData, setFlashBarFallbackChartData] = useState<Record<string, {price: number; time: string}[]>>({});
  const flashBarFallbackFetchedRef = useRef<Set<string>>(new Set());

  // Listen for timeframe change events to trigger re-render
  useEffect(() => {
    const handleTimeframeChange = () => {
      const newTimeframe = (window as any).aiAssistantSelectedTimeframe || '1Y';
      setAiChartSelectedTimeframe(newTimeframe);
    };

    window.addEventListener('timeframeChange', handleTimeframeChange);
    return () => window.removeEventListener('timeframeChange', handleTimeframeChange);
  }, []);

  // Fetch news for search results when symbol changes (use same source as chart: window.companyInsightsData)
  useEffect(() => {
    if (!searchResults || !isSearchActive) return;

    // Get symbol from the same source the chart uses
    const companyInsights = (window as any).companyInsightsData;
    const stockData = (window as any).aiAssistantStockData;

    // Extract symbol: prefer companyInsightsData.symbol, fallback to aiAssistantStockData.name
    let currentSymbol = companyInsights?.symbol || '';
    if (!currentSymbol && stockData?.name) {
      // Extract symbol from stock name (format: "RELIANCE\nReliance Industries")
      currentSymbol = stockData.name.split('\n')[0]?.trim() || '';
    }

    if (!currentSymbol || currentSymbol === searchResultsNewsSymbol) return;

    console.log('📰 Fetching news for search results symbol:', currentSymbol);
    setSearchResultsNewsSymbol(currentSymbol);
    setSearchResultsNews([]);

    let newsCancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/stock-news/${encodeURIComponent(currentSymbol.toUpperCase())}?refresh=${Date.now()}`);
        if (newsCancelled) return;
        const data = await response.json();
        if (newsCancelled) return;

        const articles = Array.isArray(data) ? data : (data.articles || data.data || []);

        if (articles && articles.length > 0) {
          const getRelativeTime = (dateString: string) => {
            try {
              const date = new Date(dateString);
              const now = new Date();
              const diffMs = now.getTime() - date.getTime();
              const diffSecs = Math.floor(diffMs / 1000);
              const diffMins = Math.floor(diffSecs / 60);
              const diffHours = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHours / 24);
              const diffWeeks = Math.floor(diffDays / 7);

              if (diffSecs < 60) return 'Just now';
              if (diffMins < 60) return `${diffMins}m ago`;
              if (diffHours < 24) return `${diffHours}h ago`;
              if (diffDays < 7) return `${diffDays}d ago`;
              if (diffWeeks < 4) return `${diffWeeks}w ago`;
              return 'Recently';
            } catch (error) {
              return 'Recently';
            }
          };

          const formattedNews = articles.map((article: any) => ({
            title: article.title,
            source: article.source || "Market News",
            time: getRelativeTime(article.publishedAt || article.date || new Date().toISOString()),
            url: article.url || article.link || '#'
          }));

          console.log('📰 News fetched successfully:', formattedNews.length, 'articles');
          if (!newsCancelled) setSearchResultsNews(formattedNews);
        } else {
          console.log('📰 No news articles found for:', currentSymbol);
        }
      } catch (error) {
        if (!newsCancelled) console.warn("Failed to fetch news for symbol:", currentSymbol, error);
      }
    })();
    return () => { newsCancelled = true; };
  }, [searchResults, isSearchActive]);

  // ❌ REMOVED: journalSelectedDate - manual search chart is now completely standalone

  // Trending podcasts state
  const [selectedSector, setSelectedSector] = useState<string>("FINANCE");
  const [trendingPodcasts, setTrendingPodcasts] = useState<any[]>([]);
  const [isPodcastsLoading, setIsPodcastsLoading] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);


  // Animated greeting stocks state
  const [currentStockIndex, setCurrentStockIndex] = useState(0);
  const [showingInitialGreeting, setShowingInitialGreeting] = useState(true);
  const animatedStocks = [
    { symbol: "NIFTY", price: "59273.80", change: +1.24, isProfit: true },
    { symbol: "BANKNIFTY", price: "52841.35", change: +0.87, isProfit: true },
    { symbol: "SENSEX", price: "85138.27", change: -0.45, isProfit: false },
    { symbol: "Top Gainers", price: "TCS +2.1%", change: +2.1, isProfit: true },
    { symbol: "Top Losers", price: "SUNPHARMA -1.8%", change: -1.8, isProfit: false },
  ];

  // Passcode protection state
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [authenticatedTabs, setAuthenticatedTabs] = useState<Set<string>>(
    new Set(),
  );
  const [pendingTab, setPendingTab] = useState<string>("");
  const [showSavedFormatsDropdown, setShowSavedFormatsDropdown] = useState(false);

  // Show initial greeting for 2 seconds, then switch to animated stocks
  useEffect(() => {
    if (!isViewOnlyMode) {
      const initialTimer = setTimeout(() => {
        setShowingInitialGreeting(false);
      }, 2000);
      return () => clearTimeout(initialTimer);
    }
  }, [isViewOnlyMode]);

  // Auto-rotate stock display every 3 seconds (only after initial greeting)
  useEffect(() => {
    if (!isViewOnlyMode && !showingInitialGreeting) {
      const interval = setInterval(() => {
        setCurrentStockIndex(prev => (prev + 1) % animatedStocks.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [animatedStocks.length, isViewOnlyMode, showingInitialGreeting]);

  // Expose toggle nav function to window for profile icon in right sidebar
  useEffect(() => {
    window.toggleNav = () => {
      setIsNavOpen(prev => !prev);
    };
    return () => {
      delete window.toggleNav;
    };
  }, []);

  // Passcode verification functions
  const protectedTabs = [
    "trading-home",
    "dashboard",
  ]; // Protected tabs

  const handleTabClick = (tabName: string) => {
    if (protectedTabs.includes(tabName) && !authenticatedTabs.has(tabName)) {
      setPendingTab(tabName);
      setShowPasscodeModal(true);
    } else {
      setTabWithAuthCheck(tabName);
    }
  };

  const handlePasscodeSubmit = () => {
    if (passcodeInput === "1302") {
      const newAuthenticatedTabs = new Set(authenticatedTabs);
      newAuthenticatedTabs.add(pendingTab);
      setAuthenticatedTabs(newAuthenticatedTabs);
      setTabWithAuthCheck(pendingTab);
      setShowPasscodeModal(false);
      setPasscodeInput("");
      setPendingTab("");
    } else {
      // Reset on wrong passcode
      setPasscodeInput("");
    }
  };

  const handlePasscodeCancel = () => {
    setShowPasscodeModal(false);
    setPasscodeInput("");
    setPendingTab("");
  };

  // Trading Master Coming Soon Modal State
  const [showTradingMasterComingSoon, setShowTradingMasterComingSoon] = useState(false);
  const { toast } = useToast();

  // Share tradebook modal state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [isCreatingShareableLink, setIsCreatingShareableLink] = useState(false);
  const [isSharedReportMode, setIsSharedReportMode] = useState(false);
  const [sharedReportData, setSharedReportData] = useState<any>(null);

  // Handle shared report from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedReportId = params.get('sharedReport');

    if (sharedReportId) {
      // Open dialog immediately to show loading state
      setIsSharedReportMode(true);
      setShowShareDialog(true);

      // Fetch the shared report in background
      fetch(`/api/verified-reports/${sharedReportId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.report) {
            setSharedReportData(data.report);
            setShareableUrl(data.report.shareUrl);
          } else {
            // Close dialog if report not found
            setShowShareDialog(false);
            setIsSharedReportMode(false);
          }
        })
        .catch(err => {
          console.error('Failed to load shared report:', err);
          setShowShareDialog(false);
          setIsSharedReportMode(false);
        });
    }
  }, []);

  // Handle share dialog close in shared report mode
  const handleShareDialogClose = () => {
    setShowShareDialog(false);

    if (isSharedReportMode) {
      // Clean up query parameter and reset shared mode
      window.history.replaceState({}, '', '/');
      setIsSharedReportMode(false);
      setSharedReportData(null);
      setShareableUrl(null);
    }
  };

  // Centralized authentication check helper - ALL tab switches MUST use this
  const setTabWithAuthCheck = (tabName: string) => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');

    const isAuthenticated = userId && userEmail && userId !== 'null' && userEmail !== 'null';

    console.log('[AUTH] Navigating to tab:', tabName, '| authenticated:', !!isAuthenticated);
    startTransition(() => {
      setActiveTab(tabName);
    });
    return true;
  };

  // Check if user is logged in, redirect to login if not
  const checkAuthAndNavigate = (tabName: string) => {
    return setTabWithAuthCheck(tabName);
  };

  // Handle Trading Master access - only for chiranjeevi.perala99@gmail.com
  const handleTradingMasterAccess = () => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    const isAuthenticated = userId && userEmail && userId !== 'null' && userEmail !== 'null';

    // Check if user is authorized for Trading Master
    if (isAuthenticated && userEmail === 'chiranjeevi.perala99@gmail.com') {
      // Authorized user - navigate to trading-master tab
      setActiveTab('trading-master');
    } else {
      // All other users (guests + non-authorized) - show coming soon modal
      setShowTradingMasterComingSoon(true);
    }
  };

  // Handle Mini Cast access - only for chiranjeevi.perala99@gmail.com
  const handleMinicastAccess = () => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    const isAuthenticated = userId && userEmail && userId !== 'null' && userEmail !== 'null';

    if (isAuthenticated && userEmail === 'chiranjeevi.perala99@gmail.com') {
      setTabWithAuthCheck("tutor");
    } else {
      // All other users (guests + non-authorized) - show coming soon dialog
      setShowComingSoonDialog(true);
    }
  };

  // Create shareable trading report
  const handleCreateShareableLink = async () => {
    try {
      setIsCreatingShareableLink(true);

      // Gather trading data from the calendar
      const filteredData = getFilteredHeatmapData();
      const dates = Object.keys(filteredData).sort();

      // Calculate comprehensive stats
      let totalPnL = 0;
      let totalTrades = 0;
      let winningTrades = 0;
      let fomoCount = 0;
      const streaks: number[] = [];
      let currentStreak = 0;

      dates.forEach(dateKey => {
        const dayData = filteredData[dateKey];
        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
        const tags = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];

        if (metrics) {
          const netPnL = metrics.netPnL || 0;
          totalPnL += netPnL;
          totalTrades += metrics.totalTrades || 0;
          winningTrades += metrics.winningTrades || 0;

          // Track FOMO tags
          if (Array.isArray(tags) && tags.some((tag: string) => tag.toLowerCase() === 'fomo')) {
            fomoCount++;
          }

          // Track win streaks
          if (netPnL > 0) {
            currentStreak++;
          } else if (netPnL < 0 && currentStreak > 0) {
            streaks.push(currentStreak);
            currentStreak = 0;
          }
        }
      });

      // Final streak
      if (currentStreak > 0) {
        streaks.push(currentStreak);
      }

      const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      // Create verified report
      const response = await fetch('/api/verified-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId || 'demo',
          username: currentUser?.displayName || currentUser?.email || 'Demo User',
          reportData: {
            tradingDataByDate: filteredData,
            totalPnL,
            totalTrades,
            winRate: Number(winRate.toFixed(2)),
            fomoCount,
            maxStreak,
            userId: currentUser?.userId || 'demo',
            username: currentUser?.displayName || currentUser?.email || 'Demo User',
            tagline: 'rethink & reinvest',
          }
        })
      });

      const result = await response.json();

      if (result.success && result.report) {
        setShareableUrl(result.report.shareUrl);
        toast({
          title: "Shareable link created!",
          description: "Your trading report is ready to share. Link expires in 7 days.",
        });
      } else {
        throw new Error(result.error || 'Failed to create shareable link');
      }
    } catch (error) {
      console.error('[SHARE] Error creating shareable link:', error);
      toast({
        title: "Error",
        description: "Failed to create shareable link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingShareableLink(false);
    }
  };

  // AI Finance Assistant Logic - Real data fetching and analysis
  const fetchRealStockData = async (
    symbol: string,
  ): Promise<StockData | null> => {
    try {
      console.log(`🤖 AI Search fetching real data for ${symbol}...`);
      const response = await fetch(`/api/stock-analysis/${symbol}`);
      const data = await response.json();

      if (data && data.priceData) {
        console.log(
          `✅ AI Search got real data for ${symbol}:`,
          data.priceData,
        );
        return {
          symbol: symbol,
          price: data.priceData.close || data.priceData.price || 0,
          change: (data.priceData.close || 0) - (data.priceData.open || 0),
          changePercent: data.sentiment?.score
            ? ((data.priceData.close - data.priceData.open) /
                data.priceData.open) *
              100
            : 0,
          volume: data.priceData.volume || "N/A",
          marketCap: data.valuation?.marketCap || "N/A",
          pe: data.valuation?.peRatio || 0,
          high: data.priceData.high || 0,
          low: data.priceData.low || 0,
          open: data.priceData.open || 0,
          sentiment: data.sentiment || null,
          indicators: data.indicators || null,
        };
      }
      return null;
    } catch (error) {
      console.error(`❌ AI Search failed to fetch data for ${symbol}:`, error);
      return null;
    }
  };

  // Optimized unified search with caching and performance improvements
  const handleSearch = async (queryOverride?: string) => {
    let query = queryOverride || searchQuery;
    if (!query.trim()) return;

    // Convert stock symbol format (RELIANCE-EQ) to human language (reliance)
    if (query.includes('-') && query.toUpperCase() === query) {
      const symbolPart = query.split('-')[0]; // Extract "RELIANCE" from "RELIANCE-EQ"
      query = symbolPart.toLowerCase(); // Convert to "reliance"
      console.log(`✅ [SYMBOL-DETECTED] Converted ${queryOverride} to human language: ${query}`);
    }

    // Check authentication before allowing search
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');

    if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
      console.log('[AUTH] Authentication required for search - redirecting to login');
      setLocation('/login');
      return;
    }

    // Prevent concurrent searches
    if (isSearchLoading) return;

    setIsSearchLoading(true);

    try {
      const message = query.toLowerCase();
      const stockSymbols = [
        "reliance",
        "tcs",
        "infy",
        "infosys",
        "hdfcbank",
        "icicibank",
        "bhartiartl",
        "itc",
        "nifty",
        "banknifty",
        "sbin",
        "adaniports",
        "asianpaint",
        "bajfinance",
        "wipro",
        "techm",
      ];
      const mentionedStock = stockSymbols.find((stock) =>
        message.includes(stock),
      );

      // USE TRADING AI AGENT FOR ALL QUERIES - Like Replit Agent for Trading
      // This agent uses tool calling to intelligently gather data from multiple sources
      console.log(
        "🤖 [TRADING-AGENT] Triggering AI Trading Agent (Tool Calling Enabled)...",
      );

      try {
        // Call the new Trading AI Agent endpoint
        const response = await fetch(getFullApiUrl("/api/trading-agent"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query,
            context: {
              userId: currentUser?.userId || localStorage.getItem('currentUserId'),
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.message) {
            let result = data.message;

            // Store chart data for rendering if available
            if (data.charts && data.charts.length > 0) {
              (window as any).tradingAgentCharts = data.charts;
              console.log("📊 [TRADING-AGENT] Received chart data:", data.charts.length, "charts");
            }

            // Store stock insights for rendering
            if (data.stocks && data.stocks.length > 0) {
              (window as any).tradingAgentStocks = data.stocks;
              console.log("📈 [TRADING-AGENT] Received stock insights:", data.stocks.length, "stocks");
            }

            // Store company insights data on window for chart rendering
            if (data.companyInsights) {
              (window as any).companyInsightsData = data.companyInsights;
              console.log("✅ [TRADING-AGENT] Received company insights:", data.companyInsights.symbol, data.companyInsights.trend);

              // Store stock data for chart display
              (window as any).aiAssistantStockData = {
                name: data.companyInsights.name || data.companyInsights.symbol,
                price: data.companyInsights.price || 0,
                change: (data.companyInsights.price || 0) - (data.companyInsights.open || 0),
                changePercent: ((data.companyInsights.price - (data.companyInsights.open || data.companyInsights.price)) / ((data.companyInsights.open || data.companyInsights.price) || 1)) * 100,
                symbol: data.companyInsights.symbol
              };
              (window as any).aiAssistantSelectedTimeframe = '1Y';

              // Fetch price chart data for the symbol
              try {
                const symbol = data.companyInsights.symbol || "";
                if (symbol) {
                  const chartResponse = await fetch(getFullApiUrl(`/api/stock-chart-data/${symbol}?timeframe=1Y`));
                  if (chartResponse.ok) {
                    const chartData = await chartResponse.json();
                    if (chartData && chartData.length > 0) {
                      (window as any).aiAssistantPriceChartData = chartData;
                      // Insert price chart marker at the beginning of results
                      result = "[CHART:PRICE_CHART]\n" + result;
                      console.log("📈 [TRADING-AGENT] Fetched price chart data:", chartData.length, "candles");
                    }
                  }
                }
              } catch (chartError) {
                console.warn("⚠️ Could not fetch price chart data:", chartError);
              }
            } else {
              (window as any).companyInsightsData = null;
            }

            // (sources footer removed)

            setSearchResults(result);

            // Fetch news if query is about financial/market topics
            const isNewsQuery = query.toLowerCase().includes("news") || query.toLowerCase().includes("market") || query.toLowerCase().includes("update") || query.toLowerCase().includes("financial");
            if (isNewsQuery) {
              try {
                const newsPromises = ["IT", "FINANCE", "COMMODITY", "GLOBAL", "BANKS", "AUTOMOBILE"].map(sector =>
                  fetch("/api/daily-news", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sector })
                  })
                    .then(res => res.json())
                    .then(data => ({...data, url: "#", source: sector, time: new Date().toLocaleTimeString()}))
                    .catch(err => null)
                );
                const results = await Promise.all(newsPromises);
                const validResults = results.filter(r => r !== null);
                if (validResults.length > 0) setSearchResultsNews(validResults);
              } catch (err) {console.warn("Error fetching news:", err);}
            }
            console.log("✅ [TRADING-AGENT] Query processing complete!");
            setIsSearchLoading(false);
            return;
          }
        }

        // Fallback to advanced-query if trading-agent fails
        console.log("⚠️ [TRADING-AGENT] Falling back to advanced query...");

        let journalTrades: any[] = [];
        try {
          const journalResponse = await fetch(getFullApiUrl("/api/journal/all-dates"));
          if (journalResponse.ok) {
            const allJournalData = await journalResponse.json();
            Object.entries(allJournalData).forEach(
              ([date, data]: [string, any]) => {
                if (data.tradeHistory && Array.isArray(data.tradeHistory)) {
                  journalTrades.push(
                    ...data.tradeHistory.map((trade: any) => ({
                      ...trade,
                      date,
                    })),
                  );
                }
              },
            );
          }
        } catch (journalError) {
          console.warn("⚠️ Could not load journal data:", journalError);
        }

        const fallbackResponse = await fetch(getFullApiUrl("/api/advanced-query"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query, journalTrades: journalTrades }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          if (data.companyInsights) {
            (window as any).companyInsightsData = data.companyInsights;
          }
          setSearchResults(data.answer);
          setIsSearchLoading(false);
          return;
        }
      } catch (error) {
        console.error("❌ [TRADING-AGENT] Error:", error);
        // Fall through to other handlers
      }

      // Technical Indicator Search (RSI, EMA, MACD, etc.)
      if (
        message.includes("rsi") ||
        message.includes("ema") ||
        message.includes("macd") ||
        message.includes("bollinger") ||
        message.includes("moving average") ||
        message.includes("technical")
      ) {
        const stock = (mentionedStock || "RELIANCE").toUpperCase();
        const realData = await fetchRealStockData(stock);

        if (realData) {
          const technicalResult = `## 📊 Technical Analysis: ${stock}

**🎯 Technical Indicators (Live Data):**
• **RSI (14):** ${realData.indicators?.rsi || "Calculating..."} ${
            parseFloat(realData.indicators?.rsi || "50") > 70
              ? "🔴 Overbought"
              : parseFloat(realData.indicators?.rsi || "50") < 30
                ? "🟢 Oversold"
                : "🟡 Neutral"
          }
• **EMA 50:** ₹${realData.indicators?.ema50 || "Loading..."}
• **MACD:** ${realData.indicators?.macd || "Processing..."}
• **Volume:** ${realData.volume} ${
            parseInt(String(realData.volume)) > 1000000
              ? "(High Volume)"
              : "(Normal Volume)"
          }

**📈 Price Action:**
• **Current:** ₹${realData.price.toLocaleString()} (${realData.changePercent.toFixed(
            2,
          )}%)
• **Support:** ₹${(realData.price * 0.98).toFixed(0)} | **Resistance:** ₹${(
            realData.price * 1.02
          ).toFixed(0)}
• **Trend:** ${
            realData.changePercent > 0 ? "Bullish momentum" : "Bearish pressure"
          }

**🔮 Trading Signals:**
${
  parseFloat(realData.indicators?.rsi || "50") > 70
    ? "• RSI suggests overbought condition - Consider profit booking"
    : parseFloat(realData.indicators?.rsi || "50") < 30
      ? "• RSI shows oversold levels - Potential buying opportunity"
      : "• RSI in neutral zone - Wait for clear signals"
}

**💡 Technical Strategy:**
Use Trading Master for detailed chart analysis with all 14 timeframes and advanced indicators.`;

          setSearchResults(technicalResult);
        } else {
          setSearchResults(
            `📊 **Technical Analysis Hub**\n\nAccess advanced technical indicators through:\n• **Trading Master:** Full charting suite with RSI, MACD, Bollinger Bands\n• **Live Options:** Greeks and technical levels\n• **Community Analysis:** Social Feed technical discussions\n\n🚀 Switch to Trading Master for comprehensive technical analysis.`,
          );
        }
      }

      // Social Feed Search - Optimized with timeout and caching
      else if (
        message.includes("social") ||
        message.includes("community") ||
        message.includes("discussion") ||
        message.includes("trending") ||
        message.includes("sentiment")
      ) {
        try {
          // Fast timeout for social data to prevent slow loading
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

          const socialResponse = await fetch(getFullApiUrl("/api/social-posts?limit=5"), {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (socialResponse.ok) {
            const socialData = await socialResponse.json();

            // Filter relevant posts based on query
            let relevantPosts = socialData;
            if (mentionedStock) {
              relevantPosts = socialData.filter(
                (post: any) =>
                  post.content &&
                  post.content.toLowerCase().includes(mentionedStock),
              );
            }

            // Extract trending topics
            const trendingTopics = Array.from(
              new Set(
                socialData.flatMap((post: any) =>
                  (post.content?.match(/\b[A-Z]{3,}\b/g) || []).slice(0, 3),
                ),
              ),
            ).slice(0, 8);

            const socialResult = `## 💬 Social Feed Intelligence ${
              mentionedStock ? `- ${mentionedStock.toUpperCase()}` : ""
            }

**💹 Trending Discussions:**
${
  trendingTopics.map((topic) => `• ${topic}`).join("\n") ||
  "• General market discussions"
}

**📊 Community Insights (${relevantPosts.length} posts):**
${relevantPosts
  .slice(0, 5)
  .map(
    (post: any, index: number) =>
      `${index + 1}. **${post.authorUsername || "Trader"}:** ${(
        post.content || ""
      ).substring(0, 120)}...`,
  )
  .join("\n\n")}

**🎯 Sentiment Analysis:**
${
  relevantPosts.length > 0
    ? `Community is actively discussing ${
        mentionedStock ? mentionedStock.toUpperCase() + " with" : "market with"
      } ${
        relevantPosts.some(
          (p: any) =>
            p.content?.toLowerCase().includes("bullish") ||
            p.content?.toLowerCase().includes("buy"),
        )
          ? "bullish sentiment"
          : relevantPosts.some(
                (p: any) =>
                  p.content?.toLowerCase().includes("bearish") ||
                  p.content?.toLowerCase().includes("sell"),
              )
            ? "bearish sentiment"
            : "mixed sentiment"
      }`
    : "Limited recent discussions on this topic"
}

**🚀 Platform Integration:**
• **Full Feed:** Access complete Social Feed for detailed discussions  
• **Real-time Updates:** Live community posts and market reactions
• **Expert Analysis:** Professional trader insights and strategies

💡 **Quick Access:** Switch to Social Feed tab for complete community analysis.`;

            setSearchResults(socialResult);
          } else {
            setSearchResults(
              `💬 **Social Feed Center**\n\nAccess community insights:\n• **Live Discussions:** Real-time market conversations\n• **Expert Analysis:** Professional trader perspectives\n• **Trending Topics:** What the community is discussing\n\n🚀 Switch to Social Feed tab for full community analysis.`,
            );
          }
        } catch (error) {
          setSearchResults(
            `💬 **Social Feed Access**\n\nConnect with the trading community through our Social Feed tab for:\n• Live market discussions\n• Community sentiment analysis\n• Expert trading insights\n\n💡 Navigate to Social Feed for real-time community intelligence.`,
          );
        }
      }

      // Journal & Trading History Search
      else if (
        message.includes("journal") ||
        message.includes("trades") ||
        message.includes("history") ||
        message.includes("performance") ||
        message.includes("pnl")
      ) {
        const journalResult = `## 📝 Trading Journal & Performance Hub

**📊 Performance Analytics Available:**
• **Daily P&L Tracking:** Comprehensive trade-by-trade analysis
• **Strategy Performance:** Success rates and optimization insights  
• **Risk Management:** Drawdown analysis and position sizing
• **Pattern Recognition:** Identify winning and losing patterns

**💼 Journal Features:**
• **Trade Documentation:** Screenshots, notes, and market context
• **Tag System:** Categorize trades by strategy, emotion, setup
• **Performance Metrics:** Win rate, average profit/loss, Sharpe ratio
• **Calendar View:** Visual P&L heatmap and trading frequency

**🎯 Quick Journal Actions:**
• **Today's Trades:** Check current session performance
• **Weekly Review:** Analyze recent trading patterns  
• **Monthly Summary:** Comprehensive performance overview
• **Strategy Analysis:** Deep dive into specific trading approaches

**📈 Performance Insights:**
• **Best Performing Days:** Identify optimal trading conditions
• **Loss Analysis:** Understand and fix problematic patterns
• **Time Analysis:** Find your most profitable trading hours
• **Risk Metrics:** Monitor and optimize risk-adjusted returns

**🚀 Platform Integration:**
Use Journal tab for detailed performance tracking and trade analysis.`;

        setSearchResults(journalResult);
      }

      // Quick Actions (Add to watchlist, set alerts, etc.)
      else if (
        message.includes("add") ||
        message.includes("watchlist") ||
        message.includes("alert") ||
        message.includes("notification")
      ) {
        const quickResult = `## ⚡ Quick Actions Hub

**📋 Watchlist Management:**
${
  mentionedStock
    ? `• **Add ${mentionedStock.toUpperCase()}:** Monitor price movements and alerts
• **Set Price Alert:** Get notified at target levels
• **Technical Alert:** RSI/MACD signal notifications
• **News Alert:** Breaking news for ${mentionedStock.toUpperCase()}`
    : `• **Add Stocks:** Build your monitoring portfolio
• **Create Lists:** Sector-wise or strategy-based groupings
• **Bulk Actions:** Import/export watchlist data
• **Smart Alerts:** AI-powered signal notifications`
}

**🔔 Alert System:**
• **Price Targets:** Get notified at support/resistance levels
• **Technical Signals:** RSI overbought/oversold alerts
• **News Alerts:** Breaking developments on watched stocks
• **Volume Alerts:** Unusual trading activity notifications

**🎯 Quick Setup Actions:**
• **Portfolio Sync:** Connect with Trading Master for live tracking
• **Risk Alerts:** Position size and stop-loss monitoring  
• **Calendar Alerts:** Earnings, dividends, and event reminders
• **Community Alerts:** Social Feed mentions and discussions

**⚙️ Automation Features:**
• **Smart Scanning:** Auto-detect trading opportunities
• **Pattern Alerts:** Chart pattern recognition notifications
• **Sector Rotation:** Industry momentum change alerts
• **Market Regime:** Bull/bear market transition signals

**🚀 Platform Integration:**
Configure alerts through Trading Master and monitor via Social Feed updates.`;

        setSearchResults(quickResult);
      }

      // Stock price requests - Optimized with fast loading
      else if (
        message.includes("price") ||
        message.includes("stock") ||
        message.includes("nifty") ||
        message.includes("sensex") ||
        message.includes("live")
      ) {
        const stock = (mentionedStock || "RELIANCE").toUpperCase();

        // Show immediate response for better UX
        setSearchResults(
          `🔍 **Loading ${stock} Data...**\n\n⏱️ Fetching live market data...`,
        );

        // Use existing stock analysis endpoint with timeout
        let realData: StockData | null = null;
        try {
          realData = await Promise.race([
            fetchRealStockData(stock),
            new Promise<StockData | null>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 4000),
            ),
          ]);
        } catch (error) {
          console.log("Stock data timeout, using fallback");
        }

        if (realData) {
          // Get additional fundamental data from social feed
          let fundamentalData = "";
          try {
            const socialResponse = await fetch(getFullApiUrl("/api/social-posts?limit=5"));
            if (socialResponse.ok) {
              const socialData = await socialResponse.json();
              const relevantPosts = socialData.filter(
                (post: any) =>
                  post.content &&
                  (post.content.toLowerCase().includes(stock.toLowerCase()) ||
                    post.content.toLowerCase().includes("market") ||
                    post.content.toLowerCase().includes("analysis")),
              );

              if (relevantPosts.length > 0) {
                fundamentalData = `\n**📊 Community Analysis:**\n${relevantPosts
                  .slice(0, 2)
                  .map(
                    (post: any, index: number) =>
                      `${index + 1}. ${post.content.substring(0, 150)}...`,
                  )
                  .join("\n")}\n`;
              }
            }
          } catch (e) {
            console.log("Social data not available");
          }

          const trend = realData.changePercent > 0 ? "bullish" : "bearish";
          const trendIcon = trend === "bullish" ? "📈" : "📉";
          const sentimentEmoji =
            realData.sentiment?.trend === "Bullish"
              ? "🟢"
              : realData.sentiment?.trend === "Bearish"
                ? "🔴"
                : "🟡";
          const sentimentText = realData.sentiment?.trend || "Neutral";
          const sentimentConfidence =
            realData.sentiment?.confidence || "Medium";

          const analysisResult = `## ${stock} Stock Analysis ${trendIcon}

**📈 Live Market Data (Fyers API):**
• **Current Price:** ₹${realData.price.toLocaleString()} (${realData.changePercent.toFixed(
            2,
          )}%)
• **Open:** ₹${realData.open.toLocaleString()} | **High:** ₹${realData.high.toLocaleString()}
• **Low:** ₹${realData.low.toLocaleString()} | **Volume:** ${realData.volume}
• **Market Cap:** ${realData.marketCap}
• **P/E Ratio:** ${realData.pe || "N/A"}

**🎯 Market Sentiment:** ${sentimentEmoji} ${sentimentText} (${sentimentConfidence} confidence)

**📊 Technical Indicators:**
• **RSI:** ${realData.indicators?.rsi || "Calculating..."}
• **EMA 50:** ${realData.indicators?.ema50 || "Loading..."}
• **Trend:** ${trend === "bullish" ? "Upward momentum" : "Consolidation phase"}
• **Support:** ₹${(realData.price * 0.98).toFixed(0)} | **Resistance:** ₹${(
            realData.price * 1.02
          ).toFixed(0)}
${fundamentalData}
**💡 AI Trading Insight:**
${
  trend === "bullish"
    ? `Strong buying momentum with ${
        realData.volume
      } volume. Consider position entry with stop-loss below ₹${(
        realData.price * 0.95
      ).toFixed(0)}.`
    : `Cautious sentiment prevailing. Wait for confirmation above ₹${(
        realData.price * 1.02
      ).toFixed(0)} for bullish reversal.`
}

**⚖️ Risk Level:** ${
            realData.changePercent > 5
              ? "High"
              : realData.changePercent > 2
                ? "Medium"
                : "Low"
          } Volatility | ${sentimentConfidence} Confidence

🚀 **Platform Features:** Use Trading Master for advanced charts and options analysis.`;

          setSearchResults(analysisResult);
        } else {
          // Fallback with platform guidance
          setSearchResults(`📈 **${stock} Stock Analysis**

⏰ **Data Status:** Real-time data temporarily unavailable

**🔧 Alternative Data Sources:**
• **Trading Master:** Live charts, options chain, technical indicators
• **Social Feed:** Community analysis and discussions
• **Market Dashboard:** Real-time quotes and market sentiment

**📱 Platform Features Available:**
• **Live Options Chain:** Greeks calculation and analysis
• **Technical Charts:** 14 timeframes with indicators
• **Community Insights:** Social trading feed
• **Risk Management:** Journal and performance tracking

💡 **Quick Access:** Switch to Trading Master tab for live ${stock} data and analysis.`);
        }
      }

      // Market news requests using existing platform news data
      else if (
        message.includes("news") ||
        message.includes("market") ||
        message.includes("update")
      ) {
        try {
          // Use the same news API that's already working successfully
          const query = mentionedStock
            ? mentionedStock.toUpperCase()
            : "Indian stock market finance news";
          const response = await fetch(
            `/api/stock-news?query=${encodeURIComponent(query)}`,
          );
          const data = await response.json();

          if (data.success && data.articles && data.articles.length > 0) {
            // Organize the news data that's already being fetched
            const newsArticles = data.articles.slice(0, 6);

            // Analyze sentiment from the news
            const getNewssentiment = (articles: any[]) => {
              const positiveWords = [
                "growth",
                "profit",
                "gain",
                "rise",
                "bullish",
                "strong",
                "beat",
                "up",
                "higher",
                "surge",
              ];
              const negativeWords = [
                "loss",
                "decline",
                "fall",
                "bearish",
                "weak",
                "miss",
                "concern",
                "down",
                "lower",
                "crash",
              ];

              let positiveCount = 0;
              let negativeCount = 0;

              articles.forEach((article) => {
                const text = (
                  article.title +
                  " " +
                  (article.description || "")
                ).toLowerCase();
                positiveWords.forEach((word) => {
                  if (text.includes(word)) positiveCount++;
                });
                negativeWords.forEach((word) => {
                  if (text.includes(word)) negativeCount++;
                });
              });

              if (positiveCount > negativeCount)
                return {
                  sentiment: "Bullish",
                  score: positiveCount - negativeCount,
                };
              if (negativeCount > positiveCount)
                return {
                  sentiment: "Bearish",
                  score: negativeCount - positiveCount,
                };
              return { sentiment: "Neutral", score: 0 };
            };

            const sentimentAnalysis = getNewssentiment(newsArticles);
            const targetSymbol = mentionedStock
              ? mentionedStock.toUpperCase()
              : "Market";

            const newsResult = `## 📰 Latest ${targetSymbol} News & Analysis

**🎯 News Sentiment Analysis:**
• **Overall Tone:** ${sentimentAnalysis.sentiment} ${
              sentimentAnalysis.sentiment === "Bullish"
                ? "🟢"
                : sentimentAnalysis.sentiment === "Bearish"
                  ? "🔴"
                  : "🟡"
            }
• **Confidence Score:** ${Math.abs(sentimentAnalysis.score)} signals detected
• **Market Impact:** ${
              sentimentAnalysis.sentiment === "Bullish"
                ? "Positive momentum expected"
                : sentimentAnalysis.sentiment === "Bearish"
                  ? "Caution advised"
                  : "Mixed signals, focus on fundamentals"
            }

**📈 Trading Implications:**
${
  sentimentAnalysis.sentiment === "Bullish"
    ? `• Positive news flow may support price appreciation\n• Consider gradual position building on dips\n• Monitor for continuation patterns`
    : sentimentAnalysis.sentiment === "Bearish"
      ? `• Negative sentiment may create selling pressure\n• Wait for news clarity before fresh positions\n• Look for oversold bounce opportunities`
      : `• Mixed news requires balanced approach\n• Focus on technical levels over news sentiment\n• Maintain risk management discipline`
}

**📋 Recent Headlines (${newsArticles.length} articles):**
${newsArticles
  .map(
    (article: any, index: number) =>
      `${index + 1}. **${article.title}**\n   ${
        article.description || "Breaking market development"
      }\n   _Source: ${article.source || "Market News"}_`,
  )
  .join("\n\n")}

**💡 Platform Integration:**
• **Social Feed:** Community discussions about these developments
• **Trading Master:** Technical analysis with news correlation
• **Journal:** Track news-driven trading decisions

🚀 **Next Steps:** Use Social Feed for community insights on these news developments.`;

            setSearchResults(newsResult);
          } else {
            // Fallback when news API doesn't have data
            setSearchResults(`📰 **Market News Dashboard**

**🔧 News Sources Available:**
• **Social Feed:** Real-time community discussions and market insights
• **Trading Platform:** Live market updates and analysis
• **Community Posts:** User-generated market commentary

**📱 Platform Features:**
• **Breaking News:** Check Social Feed for latest developments
• **Market Analysis:** Community-driven insights and discussions
• **Technical Updates:** Trading Master for chart-based news correlation

**💡 Alternative Sources:**
• Switch to Social Feed tab for community market discussions
• Check Trading Master for technical news impact analysis
• Monitor Journal for news-driven trading patterns

🚀 **Quick Access:** Social Feed contains the most up-to-date market discussions.`);
          }
        } catch (error) {
          console.error("News fetch error:", error);
          setSearchResults(
            `📰 **News Center**\n\nAccess the latest market news through our platform features:\n\n• **Social Feed:** Community market discussions\n• **Trading Master:** Technical analysis and market updates\n• **Platform Dashboard:** Real-time market information\n\n💡 Use Social Feed for the most current market insights.`,
          );
        }
      }

      // IPO requests using AI Finance Assistant logic
      else if (
        message.includes("ipo") ||
        message.includes("listing") ||
        message.includes("upcoming")
      ) {
        const ipoAnalysis = `🚀 **IPO Market Intelligence**

**Current IPO Landscape:**
The IPO market is experiencing selective activity with quality companies commanding premium valuations. Key focus areas:

• **Technology Sector:** Fintech and SaaS companies leading the pipeline with strong digital transformation themes
• **Green Energy:** Renewable energy firms gaining significant investor attention amid sustainability focus
• **Healthcare:** Specialty pharma and medical device companies benefiting from health sector growth
• **Financial Services:** NBFCs and insurance companies exploring listings amid credit growth cycle

**Investment Framework for IPO Analysis:**

**1. Fundamental Due Diligence:**
• Business model sustainability and competitive moats
• Revenue growth consistency and profit margins
• Management track record and corporate governance
• Industry positioning and market opportunity size

**2. Valuation Assessment:**
• Compare with listed peers in same sector
• Evaluate growth prospects vs. premium pricing
• Assess price band reasonableness
• Consider post-listing price performance patterns

**3. Risk Evaluation:**
• Market timing and overall sentiment
• Lock-in period implications for promoters
• Regulatory environment and compliance history
• Competition intensity and market share sustainability

**Professional IPO Strategy:**
• **Research Phase:** Thorough analysis of DRHP and company financials
• **Application Strategy:** Multiple family member applications for better allocation
• **Post-Listing:** Monitor for 3-6 months before major position changes
• **Portfolio Integration:** Limit IPO exposure to 5-10% of total portfolio

**Current Market Dynamics:**
• Quality companies with clear business models preferred
• Premium valuations acceptable for proven growth stories
• Retail participation remains strong but selective
• Institutional investors focusing on long-term value creation

💡 **Platform Integration:** Use our Social Feed for community IPO discussions and Trading Master for technical analysis of newly listed stocks.`;

        setSearchResults(ipoAnalysis);
      }

      // Fundamental analysis using existing social feed data
      else if (
        message.includes("fundamental") ||
        message.includes("analysis") ||
        message.includes("financials")
      ) {
        try {
          // Combine stock data with social feed fundamental insights
          const stock = mentionedStock
            ? mentionedStock.toUpperCase()
            : "MARKET";

          // Get stock data and social feed data in parallel
          const [stockData, socialResponse] = await Promise.all([
            mentionedStock ? fetchRealStockData(stock) : Promise.resolve(null),
            fetch("/api/social-posts?limit=10"),
          ]);

          let fundamentalInsights = "";
          if (socialResponse.ok) {
            const socialData = await socialResponse.json();
            // Filter for fundamental analysis posts
            const fundamentalPosts = socialData.filter(
              (post: any) =>
                post.content &&
                (post.content.toLowerCase().includes("pe ratio") ||
                  post.content.toLowerCase().includes("p/e") ||
                  post.content.toLowerCase().includes("valuation") ||
                  post.content.toLowerCase().includes("earnings") ||
                  post.content.toLowerCase().includes("fundamental") ||
                  post.content.toLowerCase().includes("financial") ||
                  post.content.toLowerCase().includes("balance sheet") ||
                  post.content.toLowerCase().includes("revenue") ||
                  post.content.toLowerCase().includes("profit margin") ||
                  (mentionedStock &&
                    post.content
                      .toLowerCase()
                      .includes(mentionedStock.toLowerCase()))),
            );

            if (fundamentalPosts.length > 0) {
              fundamentalInsights = `**📈 Community Fundamental Analysis:**
${fundamentalPosts
  .slice(0, 3)
  .map(
    (post: any, index: number) =>
      `${index + 1}. ${post.content.substring(0, 200)}...`,
  )
  .join("\n\n")}

`;
            }
          }

          if (stockData && mentionedStock) {
            // Specific stock fundamental analysis
            const fundamentalResult = `## ${stock} Fundamental Analysis 📊

**📋 Key Financial Metrics (Live Data):**
• **Current Price:** ₹${stockData.price.toLocaleString()}
• **Market Capitalization:** ${stockData.marketCap}
• **P/E Ratio:** ${stockData.pe || "N/A"} ${
              stockData.pe
                ? stockData.pe < 15
                  ? "(Attractive)"
                  : stockData.pe < 25
                    ? "(Fair)"
                    : "(Premium)"
                : ""
            }
• **Daily Volume:** ${stockData.volume}
• **Price Change:** ${stockData.changePercent.toFixed(2)}% (${
              stockData.changePercent > 0
                ? "Positive momentum"
                : "Under pressure"
            })

**💹 Valuation Assessment:**
${
  stockData.pe > 0
    ? `• P/E of ${stockData.pe} suggests ${
        stockData.pe < 15
          ? "**undervalued** opportunity"
          : stockData.pe < 25
            ? "**fairly valued** with reasonable premium"
            : "**premium valuation** requiring strong growth"
      }\n• Sector comparison needed for complete picture`
    : "• P/E data unavailable - focus on revenue and earnings trends\n• Check recent quarterly results for growth trajectory"
}

**🎯 Investment Framework:**
• **Growth Quality:** Consistent revenue and earnings expansion
• **Financial Health:** Strong balance sheet with manageable debt levels
• **Market Position:** Competitive advantages and market share trends
• **Management:** Track record of value creation and strategic vision

**⚠️ Risk Analysis:**
• **Volatility Level:** ${
              stockData.changePercent > 5
                ? "High"
                : stockData.changePercent > 2
                  ? "Medium"
                  : "Low"
            } (based on recent price movement)
• **Sentiment Risk:** ${
              stockData.sentiment?.confidence || "Medium"
            } confidence level
• **Liquidity:** ${
              stockData.volume !== "N/A"
                ? "Good trading volumes"
                : "Limited liquidity"
            }

${fundamentalInsights}**💡 Platform Resources:**
• **Trading Master:** Complete financial ratios and technical analysis
• **Social Feed:** Community fundamental discussions and insights
• **Market Dashboard:** Real-time valuation metrics

🚀 **Next Steps:** Check Social Feed for community fundamental analysis discussions.`;

            setSearchResults(fundamentalResult);
          } else {
            // General fundamental analysis framework with social insights
            const generalFundamental = `📊 **Fundamental Analysis Center**

**🔍 Platform Data Sources:**
• **Social Feed:** Community fundamental analysis and insights
• **Trading Master:** Complete financial ratios and valuation metrics
• **Market Data:** Real-time price and volume information

${fundamentalInsights}**📈 Essential Analysis Framework:**

**1. Profitability Ratios:**
• **ROE (Return on Equity):** >15% indicates efficient capital use
• **ROA (Return on Assets):** >10% shows strong asset management
• **Net Margin:** >10% suggests healthy profitability
• **EBITDA Margin:** Industry-specific operational efficiency

**2. Valuation Metrics:**
• **P/E Ratio:** Compare with sector average and growth rate
• **P/B Ratio:** <3 generally attractive for most sectors
• **EV/EBITDA:** Comprehensive valuation including debt structure
• **PEG Ratio:** <1 indicates growth at reasonable price

**3. Financial Strength:**
• **Debt-to-Equity:** <0.5 preferred for financial stability
• **Current Ratio:** >1.5 shows good short-term liquidity
• **Interest Coverage:** >5x indicates comfortable debt servicing
• **Free Cash Flow:** Positive and growing cash generation

**🎯 Sector-Wise Opportunities:**

**Banking (P/E: 12-15x)**
• Post-cycle recovery phase with improving asset quality
• Focus: Private banks with strong digital transformation

**Technology (P/E: 20-25x)**
• Premium justified by consistent growth and global exposure
• Focus: Export-oriented companies with recurring revenue models

**FMCG (P/E: 35-45x)**
• Quality premium for stable cash flows and market leadership
• Focus: Rural recovery themes and premiumization trends

**🚨 Red Flags to Avoid:**
⚠️ Declining revenue for 3+ consecutive quarters
⚠️ Rising debt without corresponding asset growth
⚠️ Frequent management changes or governance issues
⚠️ Sector headwinds without clear resolution path

**💡 Platform Integration:**
• **Social Feed:** Real-time community fundamental discussions
• **Trading Master:** Detailed financial ratio analysis
• **Journal:** Track fundamental-based investment decisions

🚀 **Quick Access:** Social Feed contains active fundamental analysis discussions.`;

            setSearchResults(generalFundamental);
          }
        } catch (error) {
          console.error("Fundamental analysis error:", error);
          setSearchResults(
            `📊 **Fundamental Analysis Hub**\n\n**📱 Available Resources:**\n• **Social Feed:** Community fundamental discussions\n• **Trading Master:** Financial ratios and analysis tools\n• **Platform Data:** Real-time market and company information\n\n💡 Check Social Feed for active fundamental analysis discussions.`,
          );
        }
      }

      // Advanced AI Search - Uses Gemini AI + Web Search (like Replit Agent)
      else {
        console.log(`🤖 Using Advanced AI Agent for query: ${query}`);

        try {
          const response = await fetch(getFullApiUrl("/api/advanced-search"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              includeWebSearch: true,
            }),
          });

          const data = await response.json();

          if (data.success && data.answer) {
            let result = `## 🤖 AI Assistant\n\n${data.answer}`;

            if (data.sources && data.sources.length > 0) {
              result += `\n\n**📚 Sources:**\n${data.sources.map((source: string) => `• ${source}`).join("\n")}`;
            }

            setSearchResults(result);
          } else {
            throw new Error("AI search failed");
          }
        } catch (error) {
          console.error("Advanced AI search error:", error);

          const fallbackResponse = `🤖 **AI Trading Assistant Ready!**\n\nI can help you with comprehensive trading and investment analysis:\n\n📈 **Live Stock Prices & Analysis:**\n• Real-time market data and technical indicators\n• Sector performance and trend analysis\n• Support/resistance levels and price targets\n\n📰 **Market News & Updates:**\n• Latest financial news and market movements\n• Economic indicators and policy impacts\n• Corporate earnings and sector trends\n\n🚀 **IPO Analysis & Information:**\n• Upcoming IPO calendar and subscription details\n• Post-listing performance tracking\n• Investment recommendations and risk assessment\n\n📊 **Fundamental Analysis:**\n• Company financials and valuation metrics\n• Sector comparisons and growth prospects\n• Risk analysis and investment recommendations\n\n💡 **Try asking:** "Get NIFTY price", "Latest market news", "IPO updates", or "Analyze fundamentals"`;

          setSearchResults(fallbackResponse);
        }
      }
    } catch (error) {
      console.error("AI Search error:", error);
      setSearchResults(
        "🤖 I'm here to help with all your trading and finance questions! I can assist with:\n\n• Stock analysis and live quotes\n• Market news and IPO updates\n• Trading strategies and risk management\n• Platform features (Trading Master, Journal, Social Feed)\n• Options trading and Greeks calculation\n\nWhat would you like to know more about?",
      );
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Handle suggestion button clicks
  const handleSuggestionClick = (suggestion: string) => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');

    if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
      console.log('[AUTH] Authentication required for suggestions - redirecting to login');
      setLocation('/login');
      return;
    }

    setSearchQuery(suggestion);
    setIsSearchActive(true);
    // Automatically trigger search with the suggestion
    handleSearch(suggestion);
  };

  // Generate Trading Journal AI Performance Report
  const computeJournalMetrics = (journalData: Record<string, any>) => {
    let totalTrades = 0, winningTrades = 0, losingTrades = 0, breakEvenTrades = 0;
    let totalProfit = 0, totalLoss = 0, netPnL = 0, fomoTrades = 0;
    let psychologyTags: Record<string, number> = {};
    let dailyPnL: { date: string; pnl: number; trades: number }[] = [];
    let tradingDays = 0, profitDays = 0, lossDays = 0;
    let maxConsecutiveWins = 0, maxConsecutiveLosses = 0;
    let currentWinStreak = 0, currentLossStreak = 0;
    let instrumentCounts: Record<string, number> = {};
    let weekdayPnL: Record<string, number> = {};

    const parsePnL = (pnlVal: any): number => {
      if (typeof pnlVal === 'number') return pnlVal;
      if (typeof pnlVal === 'string') {
        const s = pnlVal.replace(/[₹,+\s]/g, '');
        return parseFloat(s) || 0;
      }
      return 0;
    };

    const sortedDates = Object.keys(journalData).sort();
    sortedDates.forEach((date) => {
      const dateData = journalData[date];
      if (!dateData || typeof dateData !== 'object') return;
      const trades = dateData.tradeHistory || dateData.trades || [];
      const tags = dateData.tradingTags || dateData.selectedTags || [];
      if (trades.length === 0 && tags.length === 0) return;
      tradingDays++;

      let dayPnL = 0;
      trades.forEach((trade: any) => {
        totalTrades++;
        const pnl = parsePnL(trade.pnl);
        dayPnL += pnl;
        if (pnl > 0) { winningTrades++; totalProfit += pnl; }
        else if (pnl < 0) { losingTrades++; totalLoss += Math.abs(pnl); }
        else { breakEvenTrades++; }
        const symbol = trade.symbol || trade.stock || '';
        if (symbol) instrumentCounts[symbol] = (instrumentCounts[symbol] || 0) + 1;
      });

      tags.forEach((tag: string) => {
        psychologyTags[tag] = (psychologyTags[tag] || 0) + 1;
        if (tag.toLowerCase().includes('fomo')) fomoTrades++;
      });

      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      weekdayPnL[dayOfWeek] = (weekdayPnL[dayOfWeek] || 0) + dayPnL;

      if (dayPnL !== 0 || trades.length > 0) {
        dailyPnL.push({ date, pnl: dayPnL, trades: trades.length });
        netPnL += dayPnL;
        if (dayPnL > 0) { profitDays++; currentWinStreak++; currentLossStreak = 0; maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak); }
        else if (dayPnL < 0) { lossDays++; currentLossStreak++; currentWinStreak = 0; maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak); }
        else { currentWinStreak = 0; currentLossStreak = 0; }
      }
    });

    const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
    const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
    const rrRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    const expectancy = totalTrades > 0 ? netPnL / totalTrades : 0;
    const recentTrend = dailyPnL.slice(-14);
    const bestDay = dailyPnL.reduce((a, b) => a.pnl > b.pnl ? a : b, { date: '', pnl: 0, trades: 0 });
    const worstDay = dailyPnL.reduce((a, b) => a.pnl < b.pnl ? a : b, { date: '', pnl: 0, trades: 0 });
    const topInstruments = Object.entries(instrumentCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
    const psychList = Object.entries(psychologyTags).sort(([, a], [, b]) => b - a);
    const bestWeekday = Object.entries(weekdayPnL).sort(([, a], [, b]) => b - a)[0];
    const worstWeekday = Object.entries(weekdayPnL).sort(([, a], [, b]) => a - b)[0];
    const avgTradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;
    const chartData = recentTrend.map((d, i) => ({ day: `D${i + 1}`, value: d.pnl, date: d.date }));
    (window as any).performanceTrendChartData = chartData;

    return {
      totalTrades, winningTrades, losingTrades, breakEvenTrades, totalProfit, totalLoss, netPnL,
      winRate, avgWin, avgLoss, rrRatio, profitFactor, expectancy, fomoTrades,
      psychologyTags, psychList, dailyPnL, recentTrend, chartData, tradingDays, profitDays, lossDays,
      maxConsecutiveWins, maxConsecutiveLosses, instrumentCounts, topInstruments, weekdayPnL,
      bestDay, worstDay, bestWeekday, worstWeekday, avgTradesPerDay,
    };
  };

  const generateJournalAIReport = async (tabOverride?: 'personal1' | 'personal2') => {
    setIsSearchLoading(true);
    setIsSearchActive(true);
    setSearchQuery("Trading Journal Performance Analysis");

    try {
      const p1Data = (window as any).__p1JournalData || {};
      const p2Data = (window as any).__p2JournalData || {};
      const hasP1 = Object.keys(p1Data).length > 0;
      const hasP2 = Object.keys(p2Data).length > 0;

      // Fetch from API if local state empty
      let fetchedData: Record<string, any> = {};
      try {
        const res = await fetch(getFullApiUrl("/api/journal/all-dates"));
        if (res.ok) fetchedData = await res.json();
      } catch {}

      const effectiveP1 = hasP1 ? p1Data : fetchedData;
      const effectiveHasP1 = Object.keys(effectiveP1).length > 0;
      const effectiveHasP2 = hasP2;

      // Decide which data to use
      // isDemo is based on window globals (which match the heatmap state),
      // NOT on effectiveHasP1 (which includes API fallback data).
      // This ensures the journal report header matches the heatmap mode.
      let useData: Record<string, any>;
      let isDemo = false;
      let activeTab: 'personal1' | 'personal2' = tabOverride || journalReportActiveTab;

      if (!hasP1 && !hasP2) {
        // No personal heatmap data in either slot — fall back to demo
        // Use __demoJournalData (populated by heatmap) OR fetchedData (same /api/journal/all-dates source)
        isDemo = true;
        const demoWindowData = (window as any).__demoJournalData || {};
        useData = Object.keys(demoWindowData).length > 0 ? demoWindowData : fetchedData;
        if (Object.keys(useData).length === 0) {
          setJournalReportMetrics({ noData: true, isDemo: true });
          setSearchResults("[CHART:JOURNAL_REPORT]");
          setIsSearchLoading(false);
          return;
        }
      } else {
        useData = (activeTab === 'personal2' && effectiveHasP2) ? p2Data : effectiveP1;
      }

      const metrics = computeJournalMetrics(useData);
      const hasBothPersonal = effectiveHasP1 && effectiveHasP2;

      setJournalReportActiveTab(activeTab);
      setJournalReportMetrics({ ...metrics, isDemo, hasBothPersonal, hasP1: effectiveHasP1, hasP2: effectiveHasP2, activeTab });
      setSearchResults("[CHART:JOURNAL_REPORT]");
    } catch (error) {
      console.error("Error generating journal report:", error);
      setJournalReportMetrics({ error: true });
      setSearchResults("[CHART:JOURNAL_REPORT]");
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Screen time tracker for journal report (display-only — does NOT double-count sessions;
  // the journal tab tracker below owns session persistence to avoid double-counting)
  useEffect(() => {
    const isOpen = searchResults.includes("[CHART:JOURNAL_REPORT]");
    if (!isOpen) return;
    const startMs = Date.now();
    setJournalScreenTimeStart(startMs);
    setJournalCurrentSessionSecs(0);
    const iv = setInterval(() => {
      setJournalCurrentSessionSecs(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => {
      clearInterval(iv);
      setJournalScreenTimeStart(null);
      setJournalCurrentSessionSecs(0);
    };
  }, [searchResults.includes("[CHART:JOURNAL_REPORT]")]);

  // Screen time tracker for Journal tab (tracks time spent on the journal tab)
  useEffect(() => {
    if (activeTab !== 'journal') return;
    // Load saved sessions from localStorage on first open
    try {
      const saved = localStorage.getItem('journalScreenTimeSessions');
      if (saved) {
        const parsed = JSON.parse(saved) as Array<{date: string; totalSeconds: number}>;
        setJournalScreenTimeSessions(parsed);
      }
    } catch {}
    const startMs = Date.now();
    setJournalTabCurrentSecs(0);
    const iv = setInterval(() => {
      setJournalTabCurrentSecs(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => {
      clearInterval(iv);
      const duration = Math.floor((Date.now() - startMs) / 1000);
      if (duration < 3) return;
      const today = new Date().toISOString().slice(0, 10);
      setJournalScreenTimeSessions(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(s => s.date === today);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], totalSeconds: updated[idx].totalSeconds + duration };
        } else {
          updated.push({ date: today, totalSeconds: duration });
        }
        const trimmed = updated.slice(-30);
        try { localStorage.setItem('journalScreenTimeSessions', JSON.stringify(trimmed)); } catch {}
        return trimmed;
      });
      setJournalTabCurrentSecs(0);
    };
  }, [activeTab === 'journal']);

  // Function to fetch trending podcasts for a specific sector
  const fetchTrendingPodcasts = async (sector: string) => {
    setIsPodcastsLoading(true);
    try {
      const response = await fetch(getFullApiUrl("/api/trending-podcasts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector }),
      });

      if (response.ok) {
        const data = await response.json();
        setTrendingPodcasts(data.podcasts || []);
      } else {
        throw new Error("Failed to fetch trending podcasts");
      }
    } catch (error) {
      console.error("Error fetching trending podcasts:", error);
      setTrendingPodcasts([]);
    } finally {
      setIsPodcastsLoading(false);
    }
  };

  // Handler for sector change
  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    fetchTrendingPodcasts(sector);
    setSelectedPodcast(null); // Clear selected podcast when sector changes
  };

  // Dynamic greeting based on local time
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Hey, Good Morning! 🌅";
    } else if (hour >= 12 && hour < 17) {
      return "Hey, Good Afternoon! ☀️";
    } else if (hour >= 17 && hour < 21) {
      return "Hey, Good Evening! 🌆";
    } else {
      return "Hey, Good Night! 🌙";
    }
  };

  // Handler for podcast selection
  const handlePodcastSelect = (podcast: any) => {
    setSelectedPodcast(podcast);
  };

  // Load default podcasts only when tutor tab is first visited
  React.useEffect(() => {
    if (!visitedTabs.has("tutor")) return;
    fetchTrendingPodcasts("FINANCE");
  }, [visitedTabs.has("tutor")]);

  // Podcasts are now only selected when manually clicked
  // Removed AI image generation - using user provided images

  // State to track slope pattern configuration from TradingMaster
  const [slopePatternConfig, setSlopePatternConfig] = useState({
    symbol: "NSE:INFY-EQ",
    timeframe: "1",
    fromDate: format(new Date(), "yyyy-MM-dd"),
    toDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Event images - using gradient placeholders for cloud deployment
  const getEventImage = (eventName: string) => {
    // Return a data URL with gradient based on event type
    const gradients: Record<string, string> = {
      "Global Startup Summit | Hyderabad 2025": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "TiE Bangalore Founders Summit": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "Pharma Bio Summit Hyderabad": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "Hyderabad Food Festival": "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "HITEX IT Expo Hyderabad": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "Mumbai Fintech Festival": "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      "Nasscom Product Conclave Bangalore": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "India AI Summit Mumbai": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    };
    const gradient = gradients[eventName] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    // Return empty string to use CSS gradient instead
    return "";
  };

  // Removed AI image generation effects

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showDeltaExchange, setShowDeltaExchange] = useState(false);

  const [zerodhaAccessToken, setZerodhaAccessToken] = useState<string | null>(null);
  const [zerodhaIsConnected, setZerodhaIsConnected] = useState(false);
  const [zerodhaClientId, setZerodhaClientId] = useState<string | null>(null);
  const [brokerFunds, setBrokerFunds] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zerodha_broker_funds");
      return saved ? parseFloat(saved) : null;
    }
    return null;
  });

  // Track individual broker funds for multi-broker support
  const [allBrokerFunds, setAllBrokerFunds] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("all_broker_funds");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Sync allBrokerFunds to localStorage
  useEffect(() => {
    localStorage.setItem("all_broker_funds", JSON.stringify(allBrokerFunds));
  }, [allBrokerFunds]);

  // Calculate total funds across all brokers
  const totalBrokerFunds = useMemo(() => {
    return Object.values(allBrokerFunds).reduce((sum, val) => sum + val, 0);
  }, [allBrokerFunds]);

  const brokerIconMap: Record<string, string> = {
    zerodha: "https://kite.zerodha.com/static/images/kite-logo.svg",
    upstox: "https://assets.upstox.com/content/assets/images/cms/202494/MediumWordmark_UP(WhiteOnPurple).png",
    angelone: "https://play-lh.googleusercontent.com/Ic8lUYwMCgTePpo-Gbg0VwE_0srDj1xD386BvQHO_mOwsfMjX8lFBLl0Def28pO_Mvk=s48-rw?v=1701",
    dhan: "https://play-lh.googleusercontent.com/lVXf_i8Gi3C7eZVWKgeG8U5h_kAzUT0MrmvEAXfM_ihlo44VEk01HgAi6vbBNsSzBQ=w240-h480-rw?v=1701",
    groww: "https://play-lh.googleusercontent.com/LHjOai6kf1IsstKNWO9jbMxD-ix_FVYaJSLodKCqYQdoFVzQBuV9z5txxzcTagQcyX8=s48-rw",
    fyers: "https://play-lh.googleusercontent.com/5Y1kVEbboWVeZ4T0l7cjP2nAUbz1_-ImIWKbbdXkJ0-JMpwV7svbG4uEakENWxPQFRWuQgu4tDtaENULAzZW=s48-rw",
    delta: "https://play-lh.googleusercontent.com/XAQ7c8MRAvy_mOUw8EGS3tQsn95MY7gJxtj-sSoVZ6OYJmjvt7KaGGDyT85UTRpLxL6d=w240-h480-rw"
  };

  const getBrokerDisplayName = (id: string) => {
    const names: Record<string, string> = {
      zerodha: "Zerodha", upstox: "Upstox", angelone: "Angel One",
      dhan: "Dhan", groww: "Groww", fyers: "Fyers", delta: "Delta Exchange"
    };
    return names[id] || id;
  };
  const [zerodhaUserName, setZerodhaUserName] = useState<string | null>(null);
const [zerodhaTradesDialog, setZerodhaTradesDialog] = useState(false);
  const [showUserId, setShowUserId] = useState(true);
  const [zerodhaTradesLoading, setZerodhaTradesLoading] = useState(false);
  const [zerodhaTradesData, setZerodhaTradesData] = useState<any[]>([]);
  const [zerodhaProfileData, setZerodhaProfileData] = useState<any>(null);
  const [importData, setImportData] = useState("");
  const [importError, setImportError] = useState("");
  const [upstoxIsConnected, setUpstoxIsConnected] = useState(false);
  const [upstoxAccessToken, setUpstoxAccessToken] = useState<string | null>(null);
  const [upstoxUserId, setUpstoxUserId] = useState<string | null>(null);
  const [upstoxUserName, setUpstoxUserName] = useState<string | null>(null);

  useEffect(() => {
    if (upstoxAccessToken) {
      fetch("/api/upstox/profile")
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            const userId = data.userId && data.userId !== "undefined" ? data.userId : null;
            const userName = data.userName && data.userName !== "undefined" ? data.userName : null;
            
            if (userId) {
              setUpstoxUserId(userId);
              localStorage.setItem("upstox_user_id", userId);
            }
            if (userName) {
              setUpstoxUserName(userName);
              localStorage.setItem("upstox_user_name", userName);
            }
          }
        })
        .catch(err => console.error("Failed to fetch Upstox profile:", err));
    }
  }, [upstoxAccessToken]);
  const [angelOneAccessToken, setAngelOneAccessToken] = useState<string | null>(null);
  const [angelOneIsConnected, setAngelOneIsConnected] = useState(false);
  // Separate state for user's PERSONAL Angel One broker connection (never touches company state)
  const [userAngelOneToken, setUserAngelOneToken] = useState<string | null>(() => localStorage.getItem("user_ao_jwt"));
  const [userAngelOneIsConnected, setUserAngelOneIsConnected] = useState(() => !!localStorage.getItem("user_ao_jwt"));
  const [userAngelOneName, setUserAngelOneName] = useState<string | null>(() => localStorage.getItem("angel_one_user_name"));
  
  
  


  

  const [dhanAccessToken, setDhanAccessToken] = useState<string | null>(null);
  const [dhanClientName, setDhanClientName] = useState<string | null>(localStorage.getItem("dhan_client_name"));
  const [dhanIsConnected, setDhanIsConnected] = useState(false);
  const [deltaExchangeIsConnected, setDeltaExchangeIsConnected] = useState(false);
  const [growwIsConnected, setGrowwIsConnected] = useState(false);
  const { data: fyersStatus } = useQuery({
    queryKey: ["/api/fyers/status"],
    refetchInterval: 5000,
    enabled: visitedTabs.has("dashboard") || visitedTabs.has("journal"),
  });
  const fyersIsConnected = fyersStatus?.connected && fyersStatus?.authenticated;
  const isConnected = zerodhaIsConnected || upstoxIsConnected || userAngelOneIsConnected || angelOneIsConnected || dhanIsConnected || deltaExchangeIsConnected || fyersIsConnected || growwIsConnected;
  const activeBroker = zerodhaIsConnected ? 'zerodha' : upstoxIsConnected ? 'upstox' : userAngelOneIsConnected ? 'angelone' : angelOneIsConnected ? 'angelone' : dhanIsConnected ? 'dhan' : growwIsConnected ? 'groww' : deltaExchangeIsConnected ? 'delta' : fyersIsConnected ? 'fyers' : null;

  const connectedBrokersList = [
    zerodhaIsConnected ? 'zerodha' : null,
    upstoxIsConnected ? 'upstox' : null,
    (userAngelOneIsConnected || angelOneIsConnected) ? 'angelone' : null,
    dhanIsConnected ? 'dhan' : null,
    deltaExchangeIsConnected ? 'delta' : null,
    fyersIsConnected ? 'fyers' : null,
    growwIsConnected ? 'groww' : null,
  ].filter((b): b is string => Boolean(b));
  const connectedBrokersCount = connectedBrokersList.length;
  const secondaryBroker = connectedBrokersList[1] || null;

  const brokerFundsValue = activeBroker === 'groww' 
    ? (queryClient.getQueryData<{funds: number}>(["/api/broker/groww/funds"])?.funds ?? brokerFunds)
    : brokerFunds;

  const [isDhanDialogOpen, setIsDhanDialogOpen] = useState(false);
  const [isAngelOneDialogOpen, setIsAngelOneDialogOpen] = useState(false);
  const [isFyersDialogOpen, setIsFyersDialogOpen] = useState(false);
  const [isZerodhaDialogOpen, setIsZerodhaDialogOpen] = useState(false);
  const [isUpstoxDialogOpen, setIsUpstoxDialogOpen] = useState(false);
  const [zerodhaApiKeyInput, setZerodhaApiKeyInput] = useState("");
  const [zerodhaApiSecretInput, setZerodhaApiSecretInput] = useState("");
  const [upstoxApiKeyInput, setUpstoxApiKeyInput] = useState("");
  const [upstoxApiSecretInput, setUpstoxApiSecretInput] = useState("");
  const [angelOneApiKeyInput, setAngelOneApiKeyInput] = useState(() => localStorage.getItem("angel_one_api_key") || "");
  const [angelOneClientCodeInput, setAngelOneClientCodeInput] = useState(() => localStorage.getItem("angel_one_client_code") || "");
  const [angelOnePinInput, setAngelOnePinInput] = useState(() => localStorage.getItem("angel_one_pin") || "");
  const [angelOneTotpInput, setAngelOneTotpInput] = useState(() => localStorage.getItem("angel_one_totp") || "");
  const [showZerodhaSecret, setShowZerodhaSecret] = useState(false);
  const [showUpstoxSecret, setShowUpstoxSecret] = useState(false);
  const [showAngelOneSecret, setShowAngelOneSecret] = useState(false);
  const [showAngelOnePin, setShowAngelOnePin] = useState(false);
  const [showAngelOneTotp, setShowAngelOneTotp] = useState(false);
  const [fyersAppId, setFyersAppId] = useState("");
  const [fyersSecretId, setFyersSecretId] = useState("");
  const [isDeltaExchangeDialogOpen, setIsDeltaExchangeDialogOpen] = useState(false);
  const [deltaWhitelistedIP, setDeltaWhitelistedIP] = useState<string>("Loading...");

  useEffect(() => {
    if (!isDeltaExchangeDialogOpen) return;
    fetch('https://ifconfig.me/ip')
      .then(res => res.text())
      .then(ip => setDeltaWhitelistedIP(ip.trim()))
      .catch(err => {
        console.error("Failed to fetch public IP:", err);
        setDeltaWhitelistedIP(window.location.hostname);
      });
  }, [isDeltaExchangeDialogOpen]);
  const [deltaExchangeApiKey, setDeltaExchangeApiKey] = useState(localStorage.getItem("delta_api_key") || "");
  const [deltaExchangeApiSecret, setDeltaExchangeApiSecret] = useState(localStorage.getItem("delta_api_secret") || "");
  const [deltaExchangeUserId, setDeltaExchangeUserId] = useState<string | null>(localStorage.getItem("delta_exchange_user_id"));
  const [deltaExchangeAccountName, setDeltaExchangeAccountName] = useState<string | null>(localStorage.getItem("delta_exchange_account_name"));
  const [showDeltaSecret, setShowDeltaSecret] = useState(false);
  const [dhanClientIdInput, setDhanClientIdInput] = useState(localStorage.getItem("dhan_client_id") || "");
  const [dhanTokenInput, setDhanTokenInput] = useState(localStorage.getItem("dhan_access_token") || "");
  const [showDhanToken, setShowDhanToken] = useState(false);
  const [isGrowwDialogOpen, setIsGrowwDialogOpen] = useState(false);
  const [isGrowwConnecting, setIsGrowwConnecting] = useState(false);
  const [growwApiKeyInput, setGrowwApiKeyInput] = useState("");
  const [growwApiSecretInput, setGrowwApiSecretInput] = useState("");
  const [showGrowwSecret, setShowGrowwSecret] = useState(false);
  const [growwAccessToken, setGrowwAccessToken] = useState<string | null>(null);
  const [growwUserId, setGrowwUserId] = useState<string | null>(null);
  const [growwUserName, setGrowwUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedGrowwConnected = localStorage.getItem("growwIsConnected") === "true";
    if (storedGrowwConnected) {
      setGrowwIsConnected(true);
      setGrowwAccessToken(localStorage.getItem("growwAccessToken"));
      setGrowwUserId(localStorage.getItem("growwUserId"));
      setGrowwUserName(localStorage.getItem("growwUserName"));
    }
  }, []);

  useEffect(() => {
    const checkDhanInit = async () => {
      const token = localStorage.getItem("dhan_access_token");
      const clientId = localStorage.getItem("dhan_client_id");
      const savedName = localStorage.getItem("dhan_client_name");
      
      if (token && clientId) {
        setDhanAccessToken(token);
        setDhanIsConnected(true);
        if (savedName) {
          setDhanClientName(savedName);
        } else {
          // Fetch name if missing
          try {
            const response = await apiRequest("POST", "/api/broker/dhan/connect", {
              clientId,
              accessToken: token
            });
            if (response.success && response.clientName) {
              setDhanClientName(response.clientName);
              localStorage.setItem("dhan_client_name", response.clientName);
            }
          } catch (e) {
            console.error("Failed to load Dhan profile", e);
          }
        }
      }
    };
    checkDhanInit();
  }, []);
  const handleDhanConnect = async () => {
    setIsDhanDialogOpen(true);
  };

  const handleGrowwConnect = async () => {
    setIsGrowwDialogOpen(true);
  };

  const submitGrowwCredentials = async () => {
    if (!growwApiKeyInput || !growwApiSecretInput) {
      toast({
        title: "Error",
        description: "Please enter both API Key and API Secret",
        variant: "destructive"
      });
      return;
    }

    // Close dialog instantly — no waiting
    setIsGrowwDialogOpen(false);
    toast({ title: "Connecting...", description: "Verifying Groww credentials..." });

    const apiKey = growwApiKeyInput;
    const apiSecret = growwApiSecretInput;
    setIsGrowwConnecting(true);

    try {
      const response = await apiRequest("POST", "/api/broker/groww/connect", { apiKey, apiSecret });

      if (response.success) {
        const accessToken = response.accessToken;
        const userId = response.userId || apiKey.substring(0, 8);
        const userName = response.userName || "Groww User";
        const funds = response.funds;

        localStorage.setItem("growwIsConnected", "true");
        localStorage.setItem("growwAccessToken", accessToken);
        localStorage.setItem("growwUserId", userId);
        localStorage.setItem("growwUserName", userName);

        setGrowwIsConnected(true);
        setGrowwAccessToken(accessToken);
        setGrowwUserId(userId);
        setGrowwUserName(userName);

        if (funds != null) {
          setBrokerFunds(funds);
          localStorage.setItem("zerodha_broker_funds", String(funds));
        }

        toast({ title: "Connected", description: `Groww account connected — ${userName}` });
      }
    } catch (error: any) {
      toast({ title: "Connection Failed", description: error.message || "Failed to connect to Groww", variant: "destructive" });
    } finally {
      setIsGrowwConnecting(false);
    }
  };

  const handleGrowwDisconnect = () => {
    localStorage.removeItem("growwIsConnected");
    localStorage.removeItem("growwAccessToken");
    localStorage.removeItem("growwUserId");
    localStorage.removeItem("growwUserName");

    setGrowwIsConnected(false);
    setGrowwAccessToken(null);
    setGrowwUserId(null);
    setGrowwUserName(null);
    toast({
      title: "Disconnected",
      description: "Groww account disconnected",
    });
  };


  const [deltaExchangeTradesData, setDeltaExchangeTradesData] = useState<any[]>([]);
  const [deltaExchangePositionsData, setDeltaExchangePositionsData] = useState<any[]>([]);
  const [deltaExchangeFetching, setDeltaExchangeFetching] = useState(false);

  const { data: fyersOrders, isLoading: fetchingFyersOrders } = useQuery({
    queryKey: ["/api/broker/fyers/orders"],
    enabled: !!fyersIsConnected,
    refetchInterval: 30000,
  });

  const { data: fyersPositions, isLoading: fetchingFyersPositions } = useQuery({
    queryKey: ["/api/broker/fyers/positions"],
    enabled: !!fyersIsConnected,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const fetchDeltaData = async () => {
      if (deltaExchangeIsConnected && deltaExchangeApiKey && deltaExchangeApiSecret) {
        setDeltaExchangeFetching(true);
        try {
          const [tradesRes, positionsRes, balancesRes] = await Promise.all([
            fetch("/api/broker/delta/trades", {
              headers: {
                "x-api-key": deltaExchangeApiKey,
                "x-api-secret": deltaExchangeApiSecret
              }
            }),
            fetch("/api/broker/delta/positions", {
              headers: {
                "x-api-key": deltaExchangeApiKey,
                "x-api-secret": deltaExchangeApiSecret
              }
            }),
            fetch("/api/broker/delta/balances", {
              headers: {
                "x-api-key": deltaExchangeApiKey,
                "x-api-secret": deltaExchangeApiSecret
              }
            })
          ]);

          if (tradesRes.ok) {
            const data = await tradesRes.json();
            setDeltaExchangeTradesData(data.trades || []);
          }
          if (positionsRes.ok) {
            const data = await positionsRes.json();
            setDeltaExchangePositionsData(data.positions || []);
          }
          if (balancesRes.ok) {
            const data = await balancesRes.json();
            if (data.success && data.available_balance !== undefined) {
              setBrokerFunds(data.available_balance);
              localStorage.setItem("zerodha_broker_funds", data.available_balance.toString());
            } else if (data.error === 'ip_not_whitelisted_for_api_key') {
              console.warn("Delta Exchange: IP not whitelisted. Please whitelist:", data.client_ip);
              toast({
                title: "Delta API Restriction",
                description: `IP ${data.client_ip} is not whitelisted in your Delta Exchange API settings.`,
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error("Error fetching Delta data:", error);
        } finally {
          setDeltaExchangeFetching(false);
        }
      }
    };

    fetchDeltaData();
    const interval = setInterval(fetchDeltaData, 60000);
    return () => clearInterval(interval);
  }, [deltaExchangeIsConnected, deltaExchangeApiKey, deltaExchangeApiSecret]);

  useEffect(() => {
    const savedApiKey = localStorage.getItem("delta_exchange_api_key");
    const savedApiSecret = localStorage.getItem("delta_exchange_api_secret");
    if (savedApiKey && savedApiSecret) {
      setDeltaExchangeApiKey(savedApiKey);
      setDeltaExchangeApiSecret(savedApiSecret);
      setDeltaExchangeIsConnected(true);
      
      // Fetch profile details on load if connected
      fetch("/api/broker/delta/profile", {
        headers: {
          "x-api-key": savedApiKey,
          "x-api-secret": savedApiSecret
        }
      })
      .then(res => res.json())
      .then(data => {
        console.log('🔵 [DELTA] Received profile data:', data);
        const profile = (data.success && data.result) ? data.result : (data.result || data);
        if (profile && (profile.id !== undefined || profile.userId !== undefined)) {
          const userId = String(profile.id || profile.userId || "");
          const accountName = String(profile.account_name || profile.userName || "Delta User");
          console.log('✅ [DELTA] Setting profile:', userId, accountName);
          setDeltaExchangeUserId(userId);
          setDeltaExchangeAccountName(accountName);
          if (userId) localStorage.setItem("delta_exchange_user_id", userId);
          if (accountName) localStorage.setItem("delta_exchange_account_name", accountName);
        }
      })
      .catch(err => console.error("Failed to fetch Delta profile on load:", err));
    }
  }, []);

  const handleDeltaExchangeConnect = async () => {
    if (deltaExchangeApiKey && deltaExchangeApiSecret) {
      try {
        const response = await apiRequest("POST", "/api/broker/delta/connect", {
          apiKey: deltaExchangeApiKey,
          apiSecret: deltaExchangeApiSecret
        });

        if (response.success) {
          localStorage.setItem("delta_exchange_api_key", deltaExchangeApiKey);
          localStorage.setItem("delta_exchange_api_secret", deltaExchangeApiSecret);
          
          // Fetch profile details
          try {
            const profileRes = await fetch("/api/broker/delta/profile", {
              headers: {
                "x-api-key": deltaExchangeApiKey,
                "x-api-secret": deltaExchangeApiSecret
              }
            });
            if (profileRes.ok) {
              const data = await profileRes.ok ? await profileRes.json() : null;
              if (data) {
                console.log('🔵 [DELTA] Received profile data (connect):', data);
                const profileData = (data.success && data.result) ? data.result : (data.result || data);
                if (profileData && (profileData.id !== undefined || profileData.userId !== undefined)) {
                  const userId = String(profileData.id || profileData.userId || "");
                  const accountName = String(profileData.account_name || profileData.userName || "Delta User");
                  console.log('✅ [DELTA] Setting profile (connect):', userId, accountName);
                  setDeltaExchangeUserId(userId);
                  setDeltaExchangeAccountName(accountName);
                  if (userId) localStorage.setItem("delta_exchange_user_id", userId);
                  if (accountName) localStorage.setItem("delta_exchange_account_name", accountName);
                }
              }
            }
          } catch (err) {
            console.error("Failed to fetch Delta profile:", err);
          }

          setDeltaExchangeIsConnected(true);
          setIsDeltaExchangeDialogOpen(false);
          toast({
            title: "Connected",
            description: "Delta Exchange India connected successfully",
          });
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to connect to Delta Exchange",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to connect to Delta Exchange",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please enter both API Key and API Secret",
        variant: "destructive",
      });
    }
  };

  const handleDeltaExchangeDisconnect = () => {
    localStorage.removeItem("delta_exchange_api_key");
    localStorage.removeItem("delta_exchange_api_secret");
    localStorage.removeItem("delta_exchange_user_id");
    localStorage.removeItem("delta_exchange_account_name");
    setDeltaExchangeUserId(null);
    setDeltaExchangeAccountName(null);
    setDeltaExchangeIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Delta Exchange India disconnected",
    });
  };

  const submitDhanCredentials = async () => {
    if (!dhanClientIdInput || !dhanTokenInput) {
      toast({
        title: "Error",
        description: "Please enter both Client ID and Access Token",
        variant: "destructive"
      });
      return;
    }

    // Close dialog instantly — no waiting
    setIsDhanDialogOpen(false);
    toast({ title: "Connecting...", description: "Verifying Dhan credentials..." });

    const clientId = dhanClientIdInput;
    const accessToken = dhanTokenInput;

    try {
      const data = await apiRequest("POST", "/api/broker/dhan/connect", { clientId, accessToken });

      if (data.success) {
        setDhanAccessToken(accessToken);
        setDhanIsConnected(true);
        if (data.clientName) {
          setDhanClientName(data.clientName);
          localStorage.setItem("dhan_client_name", data.clientName);
        }
        localStorage.setItem("dhan_access_token", accessToken);
        localStorage.setItem("dhan_client_id", clientId);
        toast({ title: "Connected", description: "Dhan connected successfully" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to connect to Dhan", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to connect to Dhan", variant: "destructive" });
    }
  };
  
  
  

  

  


  
  
  

  

  


  
  
  


  


  // Zerodha OAuth Handlers
  // Check localStorage on mount to restore connection state
  useEffect(() => {
    console.log('🔷 [ZERODHA] Checking localStorage on mount...');
    const savedToken = localStorage.getItem('zerodha_token');
    console.log('🔷 [ZERODHA] Saved token:', savedToken ? 'FOUND ✅' : 'NOT FOUND ❌');
    if (savedToken) {
      setZerodhaAccessToken(savedToken);
      setZerodhaIsConnected(true);
      console.log('✅ [ZERODHA] Connection restored from localStorage');
      const savedClientId = localStorage.getItem('zerodha_client_id');
      if (savedClientId) {
        setZerodhaClientId(savedClientId);
        console.log('✅ [ZERODHA] Client ID restored from localStorage');
      }
    } else {
      console.log('⚠️ [ZERODHA] No saved token in localStorage');
    }
      const savedUserName = localStorage.getItem("zerodha_user_name");
      if (savedUserName && savedUserName !== "undefined") {
        setZerodhaUserName(savedUserName);
        console.log("✅ [ZERODHA] User Name restored from localStorage");
      }
  }, []);


  // Fetch Zerodha profile to get both userId and userName - with persistence

  // Restore Upstox connection from localStorage on mount
  useEffect(() => {
    console.log('🔵 [UPSTOX] Checking localStorage on mount...');
    const savedToken = localStorage.getItem('upstox_token');
    console.log('🔵 [UPSTOX] Saved token:', savedToken ? 'FOUND ✅' : 'NOT FOUND ❌');
    if (savedToken) {
      setUpstoxAccessToken(savedToken);
      setUpstoxIsConnected(true);
      console.log('✅ [UPSTOX] Connection restored from localStorage');
      const savedUserId = localStorage.getItem('upstox_user_id');
      const savedUserName = localStorage.getItem('upstox_user_name');
      if (savedUserId) {
        setUpstoxUserId(savedUserId);
        console.log('✅ [UPSTOX] User ID restored from localStorage');
      }
      if (savedUserName && savedUserName !== "undefined") {
        setUpstoxUserName(savedUserName);
        console.log('✅ [UPSTOX] User Name restored from localStorage');
      }
    } else {
      console.log('⚠️ [UPSTOX] No saved token in localStorage');
    }
  }, []);

  // Restore Angel One connection from localStorage on mount
  useEffect(() => {
    console.log('✅ [ANGEL ONE] Checking localStorage on mount...');
    const savedToken = localStorage.getItem('angel_one_token');
    console.log('✅ [ANGEL ONE] Saved token:', savedToken ? 'FOUND ✅' : 'NOT FOUND ❌');
    if (savedToken) {
      setAngelOneAccessToken(savedToken);
      setAngelOneIsConnected(true);
      console.log('✅ [ANGEL ONE] Connection restored from localStorage');
    } else {
      console.log('⚠️ [ANGEL ONE] No saved token in localStorage');
    }
  }, []);

  // Restore Dhan connection from localStorage on mount
  useEffect(() => {
    console.log('🔵 [DHAN] Checking localStorage on mount...');
    const savedToken = localStorage.getItem('dhan_token');
    console.log('🔵 [DHAN] Saved token:', savedToken ? 'FOUND ✅' : 'NOT FOUND ❌');
    if (savedToken) {
      setDhanAccessToken(savedToken);
      setDhanIsConnected(true);
      console.log('✅ [DHAN] Connection restored from localStorage');
    } else {
      console.log('⚠️ [DHAN] No saved token in localStorage');
    }
  }, []);

  useEffect(() => {
    if (zerodhaAccessToken) {
      // Check if we already have profile in localStorage
      const savedId = localStorage.getItem('zerodha_client_id');
      const savedName = localStorage.getItem('zerodha_user_name');
      
      if (savedId && savedName && !zerodhaClientId) {
        setZerodhaClientId(savedId);
        setZerodhaUserName(savedName);
        console.log('✅ [ZERODHA] Profile restored from cache');
        return;
      }
      
      // If not in cache or state, fetch it from backend
      if (!zerodhaClientId || !zerodhaUserName) {
        const fetchZerodhaProfile = async () => {
          try {
            const apiKey = localStorage.getItem("zerodha_api_key");
            const response = await fetch('/api/zerodha/profile', {
              headers: {
                'Authorization': `Bearer ${zerodhaAccessToken}`,
                'x-api-key': apiKey || ""
              }
            });
            if (response.ok) {
              const data = await response.json();
              if (data.profile && data.profile.userId && data.profile.userName) {
                localStorage.setItem('zerodha_client_id', data.profile.userId);
                localStorage.setItem('zerodha_user_name', data.profile.userName);
                setZerodhaClientId(data.profile.userId);
                setZerodhaUserName(data.profile.userName);
                setZerodhaProfileData(data.profile);
                console.log('✅ [ZERODHA] Profile fetched and saved:', data.profile.userId);
              }
            }
          } catch (error) {
            console.error('❌ [ZERODHA] Failed to fetch profile:', error);
          }
        };
        fetchZerodhaProfile();
      }
    }
  }, [zerodhaAccessToken]);

  // Handle Zerodha OAuth callback from URL (popup communication)
  useEffect(() => {
    const handleZerodhaCallback = async () => {
      console.log('🔷 [ZERODHA] Checking URL for callback token...');
      const params = new URLSearchParams(window.location.search);
      const zerodhaToken = params.get("zerodha_token");
      console.log('🔷 [ZERODHA] Token in URL:', zerodhaToken ? '✅ FOUND' : '❌ NOT FOUND');
      
      if (zerodhaToken) {
        console.log('✅ [ZERODHA] Token received in URL:', zerodhaToken.substring(0, 20) + '...');
        localStorage.setItem("zerodha_token", zerodhaToken); document.cookie = `zerodha_token=${zerodhaToken}; path=/; SameSite=Lax; Secure`; setZerodhaAccessToken(zerodhaToken); setZerodhaIsConnected(true);
        setZerodhaAccessToken(zerodhaToken);
        setZerodhaIsConnected(true);
        
        // Notify parent window if this is a popup
        if (window.opener) {
          console.log("📡 Sending token to opener:", window.opener.location.origin); window.opener.postMessage({ type: "ZERODHA_TOKEN", token: zerodhaToken }, "*");
          console.log('📡 Sent token to parent window');
        }
        
        // Fetch trades
        setTimeout(() => {
          setZerodhaTradesLoading(true);
          const apiKey = localStorage.getItem("zerodha_api_key");
          fetch("/api/zerodha/trades", {
            headers: { 
              "Authorization": `Bearer ${zerodhaToken}`,
              "x-api-key": apiKey || ""
            }
          })
            .then(res => res.json())
            .then(data => {
              setZerodhaTradesData(data.trades || []);
              setZerodhaTradesDialog(true);
              console.log('✅ Zerodha trades fetched:', data.trades?.length);
              
              // Close popup after trades loaded
              if (window.opener) {
                setTimeout(() => window.close(), 2000);
              }
            })
            .catch(err => console.error("Error fetching Zerodha trades:", err))
            .finally(() => setZerodhaTradesLoading(false));
        }, 300);
        
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    handleZerodhaCallback();
  }, []);

  // Listen for messages from popup windows
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("📡 [MESSAGE] Received message:", event.data.type, event.data);
      
      if (event.data.type === 'ANGELONE_AUTH_SUCCESS' && event.data.token) {
        const token = event.data.token;
        console.log('✅ [ANGELONE] Token received from popup:', token.substring(0, 20) + '...');
        
        localStorage.setItem("angelone_token", token);
        if (event.data.feedToken) localStorage.setItem("angelone_feed_token", event.data.feedToken);
        if (event.data.refreshToken) localStorage.setItem("angelone_refresh_token", event.data.refreshToken);
        if (event.data.clientCode) localStorage.setItem("angelone_client_code", event.data.clientCode);
        
        document.cookie = `angelone_token=${token}; path=/; SameSite=Lax; Secure`;
        setAngelOneAccessToken(token);
        setAngelOneIsConnected(true);
        setShowConnectDialog(false);
        
        console.log('✅ [ANGELONE] Connection established and saved to localStorage');
      } else if (event.data.type === 'ZERODHA_TOKEN' && event.data.token) {
        const token = event.data.token;
        console.log('✅ [ZERODHA] Token received from popup:', token.substring(0, 20) + '...');
        
        localStorage.setItem("zerodha_token", token); document.cookie = `zerodha_token=${token}; path=/; SameSite=Lax; Secure`; setZerodhaAccessToken(token); setZerodhaIsConnected(true);
        setZerodhaAccessToken(token);
        setZerodhaIsConnected(true);
        setShowConnectDialog(false);
        console.log('✅ [ZERODHA] Connection established and saved to localStorage');
        
        // Fetch trades
        setTimeout(() => {
          // Also fetch profile
          const apiKey = localStorage.getItem("zerodha_api_key");
          fetch("/api/zerodha/profile", {
            headers: { 
              "Authorization": `Bearer ${token}`,
              "x-api-key": apiKey || ""
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data.profile) {
                setZerodhaProfileData(data.profile);
                setZerodhaClientId(data.profile.userId);
                setZerodhaUserName(data.profile.userName);
                localStorage.setItem("zerodha_client_id", data.profile.userId);
                localStorage.setItem("zerodha_user_name", data.profile.userName);
                console.log('✅ [ZERODHA] Profile fetched:', data.profile.email);
              }
            })
            .catch(err => console.error("❌ [ZERODHA] Error fetching profile:", err));

          console.log('📡 [ZERODHA] Fetching trades with token...');
          setZerodhaTradesLoading(true);
          const apiKeyForTrades = localStorage.getItem("zerodha_api_key");
          fetch("/api/zerodha/trades", {
            headers: { 
              "Authorization": `Bearer ${token}`,
              "x-api-key": apiKeyForTrades || ""
            }
          })
            .then(res => res.json())
            .then(data => {
              setZerodhaTradesData(data.trades || []);
              setZerodhaTradesDialog(true);
              console.log('✅ [ZERODHA] Trades fetched:', data.trades?.length || 0, 'trades');
            })
            .catch(err => {
              console.error("❌ [ZERODHA] Error fetching trades:", err);
            })
            .finally(() => setZerodhaTradesLoading(false));
        }, 300);
      } else if (event.data.type === 'ZERODHA_ERROR') {
        console.error('❌ [ZERODHA] Error from callback:', event.data.error);
        alert('Zerodha error: ' + event.data.error);
      } else if (event.data.type === 'DHAN_TOKEN' && event.data.token) {
        const token = event.data.token;
        console.log('🔵 [DHAN] Token received from popup:', token.substring(0, 20) + '...');
        
        localStorage.setItem("dhan_token", token);
        localStorage.setItem("dhan_token", token);
        localStorage.setItem("dhan_user_id", "dhan_user");
        localStorage.setItem("dhan_client_name", "Dhan Account");
        document.cookie = `dhan_token=${token}; path=/; SameSite=Lax; Secure`;
        setDhanIsConnected(true);
        setShowConnectDialog(false);
        console.log('✅ [DHAN] Connection established and saved to localStorage');
      } else if (event.data.type === 'ANGEL_ONE_TOKEN' && event.data.token) {
        const token = event.data.token;
        console.log('🔶 [ANGEL ONE] Token received from popup:', token.substring(0, 20) + '...');
        
        localStorage.setItem("angel_one_token", token);
        document.cookie = `angel_one_token=${token}; path=/; SameSite=Lax; Secure`;
        setAngelOneAccessToken(token);
        setAngelOneIsConnected(true);
        setShowConnectDialog(false);
        console.log('✅ [ANGEL ONE] Connection established and saved to localStorage');
      } else if (event.data.type === 'ANGEL_ONE_ERROR') {
        console.error('❌ [ANGEL ONE] Error from callback:', event.data.error);
        alert('Angel One error: ' + event.data.error);
      } else if (event.data.type === 'DHAN_ERROR') {
        console.error('❌ [DHAN] Error from callback:', event.data.error);
        alert('Dhan error: ' + event.data.error);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleZerodhaConnect = () => {
    setIsZerodhaDialogOpen(true);
  };

  const submitZerodhaCredentials = () => {
    if (!zerodhaApiKeyInput || !zerodhaApiSecretInput) {
      toast({
        title: "Error",
        description: "Please enter both API Key and API Secret",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("zerodha_api_key", zerodhaApiKeyInput);
    localStorage.setItem("zerodha_api_secret", zerodhaApiSecretInput);

    // Set api_key cookie instantly client-side (no network, available immediately for callback)
    document.cookie = `zerodha_api_key=${encodeURIComponent(zerodhaApiKeyInput)}; path=/; max-age=900; SameSite=None; Secure`;

    // Close dialog immediately
    setIsZerodhaDialogOpen(false);

    // Store secret server-side via beacon (fire-and-forget — no await, no delay)
    // Server stores it in memory; callback reads it before the user can even finish logging in
    navigator.sendBeacon(
      '/api/zerodha/store-secret',
      new Blob(
        [JSON.stringify({ apiKey: zerodhaApiKeyInput, apiSecret: zerodhaApiSecretInput })],
        { type: 'application/json' }
      )
    );

    // Navigate instantly — no waiting
    window.location.href = `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(zerodhaApiKeyInput)}`;
  };

  const handleUpstoxConnect = async () => {
    try {
      if (!upstoxApiKeyInput || !upstoxApiSecretInput) {
        toast({
          title: "Error",
          description: "API Key and API Secret are required",
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem("upstox_api_key", upstoxApiKeyInput);
      localStorage.setItem("upstox_api_secret", upstoxApiSecretInput);

      // Close dialog immediately for instant feedback
      setIsUpstoxDialogOpen(false);

      // Open popup IMMEDIATELY from user gesture (before any await) to avoid popup blockers
      const popup = window.open(
        'about:blank',
        'upstox_oauth',
        'width=600,height=800,resizable=yes,scrollbars=yes'
      );

      if (!popup) {
        toast({ title: "Popup blocked", description: "Please allow popups and try again.", variant: "destructive" });
        return;
      }

      // Show loading in the popup while we fetch the real URL
      popup.document.write('<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p style="color:#666">Connecting to Upstox...</p></body></html>');

      // Fetch auth URL in background — popup is already open so no delay for user
      const response = await fetch('/api/upstox/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: upstoxApiKeyInput, apiSecret: upstoxApiSecretInput })
      });
      const data = await response.json();

      if (!data.authUrl) {
        popup.close();
        toast({ title: "Error", description: "Could not generate Upstox authorization URL", variant: "destructive" });
        return;
      }

      // Redirect popup to real auth URL
      popup.location.href = data.authUrl;
      console.log('✅ Upstox popup redirected to auth URL');
      
      // Listen for messages from the OAuth callback popup
      const messageListener = (event: MessageEvent) => {
        if (event.data.type === "UPSTOX_AUTH_SUCCESS") {
          console.log("✅ Upstox authentication successful!");
          localStorage.setItem("upstox_token", event.data.token);
          localStorage.setItem("upstox_user_id", event.data.userId || "");
          localStorage.setItem("upstox_user_email", event.data.userEmail || "");
          localStorage.setItem("upstox_user_name", event.data.userName || "");
          setUpstoxAccessToken(event.data.token);
          setUpstoxIsConnected(true);
          window.removeEventListener("message", messageListener);
          toast({
            title: "Success",
            description: "Upstox connected successfully!",
          });
        } else if (event.data.type === "UPSTOX_AUTH_ERROR") {
          console.error("❌ Upstox authentication failed:", event.data.error);
          window.removeEventListener("message", messageListener);
          toast({
            title: "Error",
            description: event.data.error || "Failed to authenticate with Upstox",
            variant: "destructive",
          });
        }
      };

      window.addEventListener("message", messageListener);
      
      // Monitor popup closing and cleanup
      let checkCount = 0;
      const monitorPopup = setInterval(() => {
        checkCount++;
        if (popup.closed) {
          clearInterval(monitorPopup);
          window.removeEventListener("message", messageListener);
          console.log('⚠️ Upstox popup closed');
          return;
        }
        if (checkCount > 300) {
          clearInterval(monitorPopup);
          window.removeEventListener("message", messageListener);
          popup.close();
          console.log('⚠️ Upstox popup timeout');
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Upstox error:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to connect to Upstox'));
    }
  };

  const handleUpstoxDisconnect = async () => {
    try {
      const token = upstoxAccessToken;
      if (!token) {
        // No token to revoke, just clear locally
        localStorage.removeItem("upstox_token");
        localStorage.removeItem("upstox_user_id");
        localStorage.removeItem("upstox_user_email");
        localStorage.removeItem("upstox_user_name");
        setUpstoxAccessToken(null);
        setUpstoxIsConnected(false);
        return;
      }

      // Call Upstox logout API
      const response = await fetch('https://api.upstox.com/v2/logout', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔵 Upstox logout response:', response.status);
      
      // Clear local storage regardless of API response
      localStorage.removeItem("upstox_token");
      localStorage.removeItem("upstox_user_id");
      localStorage.removeItem("upstox_user_email");
      localStorage.removeItem("upstox_user_name");
      setUpstoxAccessToken(null);
      setUpstoxIsConnected(false);
    } catch (error) {
      console.error('❌ Upstox disconnect error:', error);
      // Clear local storage even if API call fails
      localStorage.removeItem("upstox_token");
      localStorage.removeItem("upstox_user_id");
      localStorage.removeItem("upstox_user_email");
      localStorage.removeItem("upstox_user_name");
      setUpstoxAccessToken(null);
      setUpstoxIsConnected(false);
    }
  };

  const handleAngelOneConnect = async () => {
    try {
      console.log("🔶 Starting Angel One OAuth flow...");
      
      // Get the authorization URL from the backend
      const response = await fetch("/api/angelone/auth-url");
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to get authorization URL");
      }
      
      const authUrl = data.authUrl;
      
      // Open the login page in a popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        "AngelOneLogin",
        `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
      );
      
      if (!popup) {
        alert("Please allow popups to connect your Angel One account");
        return;
      }

      // Listen for messages from the OAuth callback popup
      const messageListener = (event: MessageEvent) => {
        if (event.data.type === "ANGELONE_AUTH_SUCCESS") {
          console.log("✅ Angel One authentication successful!");
          
          localStorage.setItem("angel_one_token", event.data.token);
          localStorage.setItem("angel_one_client_code", event.data.clientCode || "");
          
          if (event.data.refreshToken) {
            localStorage.setItem("angel_one_refresh_token", event.data.refreshToken);
          }
          
          setAngelOneAccessToken(event.data.token);
          setAngelOneIsConnected(true);
          setIsAngelOneDialogOpen(false);
          
          window.removeEventListener("message", messageListener);
          
          toast({
            title: "Success",
            description: "Angel One connected successfully!",
          });
        }
      };

      window.addEventListener("message", messageListener);
      
      // Monitor popup closing and cleanup — max 5 minutes (300 ticks)
      let angelOneCheckCount = 0;
      const monitorPopup = setInterval(() => {
        angelOneCheckCount++;
        if (popup.closed) {
          clearInterval(monitorPopup);
          window.removeEventListener("message", messageListener);
          console.log('⚠️ Angel One popup closed');
          return;
        }
        if (angelOneCheckCount > 300) {
          clearInterval(monitorPopup);
          window.removeEventListener("message", messageListener);
          popup.close();
          console.log('⚠️ Angel One popup timeout after 5 minutes');
        }
      }, 1000);
      
    } catch (error) {
      console.error("❌ Angel One error:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to connect" 
      });
    }
  };

  const handleUserAngelOneConnect = async () => {
    if (!angelOneClientCodeInput || !angelOneApiKeyInput || !angelOnePinInput || !angelOneTotpInput) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all fields." });
      return;
    }

    // Close dialog and show feedback instantly — don't wait for the network
    setIsAngelOneDialogOpen(false);
    toast({ title: "Connecting...", description: "Authenticating with Angel One..." });

    const clientCode = angelOneClientCodeInput.trim();
    const pin = angelOnePinInput.trim();
    const apiKey = angelOneApiKeyInput.trim();
    const totpSecret = angelOneTotpInput.trim();

    setAngelOneClientCodeInput("");
    setAngelOneApiKeyInput("");
    setAngelOnePinInput("");
    setAngelOneTotpInput("");

    try {
      const response = await fetch("/api/user/angelone/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientCode, pin, apiKey, totpSecret }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to connect");
      }

      localStorage.setItem("user_ao_jwt", data.token);
      localStorage.setItem("angel_one_client_code", data.clientCode || clientCode);
      if (data.name) {
        localStorage.setItem("angel_one_user_name", data.name);
        setUserAngelOneName(data.name);
      }

      setUserAngelOneToken(data.token);
      setUserAngelOneIsConnected(true);

      toast({
        title: "Connected",
        description: `Angel One account${data.name ? ` (${data.name})` : ""} connected successfully!`,
      });
    } catch (error: any) {
      console.error("❌ [USER-ANGELONE] Connect error:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to connect Angel One account",
      });
    }
  };

  const handleUserAngelOneDisconnect = () => {
    const clientCode = localStorage.getItem("angel_one_client_code");
    if (clientCode) {
      fetch("/api/user/angelone/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientCode }),
      }).catch(() => {});
    }
    localStorage.removeItem("user_ao_jwt");
    localStorage.removeItem("angel_one_client_code");
    localStorage.removeItem("angel_one_user_name");
    setUserAngelOneToken(null);
    setUserAngelOneIsConnected(false);
    setUserAngelOneName(null);
  };

  const handleRevokeZerodha = () => {
    localStorage.removeItem("zerodha_token"); document.cookie = "zerodha_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    setZerodhaAccessToken(null);
    setZerodhaIsConnected(false);
    setZerodhaTradesData([]);
    console.log('🔓 Zerodha connection revoked');
  };

  const handleFetchZerodhaTrades = async () => {
    if (!zerodhaAccessToken) {
      alert('Please connect to Zerodha first');
      return;
    }
    
    setZerodhaTradesLoading(true);
    try {
      const apiKey = localStorage.getItem("zerodha_api_key");
      const response = await fetch('/api/zerodha/trades', {
        headers: { 
          'Authorization': `Bearer ${zerodhaAccessToken}`,
          'x-api-key': apiKey || ""
        }
      });
      const { trades } = await response.json();
      setZerodhaTradesData(trades);
      setZerodhaTradesDialog(true);
    } catch (error) {
      console.error('Error fetching trades:', error);
      alert('Failed to fetch trades');
    } finally {
      setZerodhaTradesLoading(false);
    }
  };
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [isBuildMode, setIsBuildMode] = useState(false);

  // Define the format type with position-based structure (supports multiple positions per field)
  type FormatData = {
    id?: string;  // Unique ID for the format (generated on save)
    label?: string;  // Human-readable label for display
    sampleLine: string;  // Original first line of trade data
    positions: {
      time: number[];  // Array of positions
      order: number[];
      symbol: number[];
      type: number[];
      qty: number[];
      price: number[];
    };
    // Keep string values for display in build table
    displayValues: {
      time: string;
      order: string;
      symbol: string;
      type: string;
      qty: string;
      price: string;
    };
  };

  // Define ParseResult type for trade parsing
  type ParseResult = {
    trades: any[];
    errors: ParseError[];
  };

  const [buildModeData, setBuildModeData] = useState<FormatData>({
    sampleLine: "",
    positions: {
      time: [],
      order: [],
      symbol: [],
      type: [],
      qty: [],
      price: []
    },
    displayValues: {
      time: "",
      order: "",
      symbol: "",
      type: "",
      qty: "",
      price: ""
    }
  });
  const [brokerSearchInput, setBrokerSearchInput] = useState("");
  const [showBrokerSuggestions, setShowBrokerSuggestions] = useState(false);
  const [availableBrokers, setAvailableBrokers] = useState<string[]>([
    // Top Discount Brokers
    "Zerodha", "Groww", "Angel One", "Upstox", "5paisa", "Fyers", "Paytm Money", "Alice Blue",
    "Shoonya by Finvasia", "Samco Securities", "Motilal Oswal",

    // Crypto Exchanges & Brokers
    "Coinbase", "Kraken", "Binance", "Delta Exchange", "WazirX", "Bybit", "OKX", "Huobi",
    "Kucoin", "FTX", "Gemini", "Bitstamp", "Upbit", "Bithumb", "Crypto.com", "Bitcoin India",
    "CoinDCX", "Zebpay", "BTCXIndia", "Unocoin", "BTCXINDIA", "Paxful", "LocalBitcoins", "Coinswitch",

    // Full-Service Brokers
    "ICICI Securities", "HDFC Securities", "Kotak Securities", "Axis Securities",
    "SBI Securities", "Sharekhan", "IIFL Securities", "JM Financial",
    "Geojit Financial", "Edelweiss Broking", "Religare Broking", "Centrum Broking",

    // Bank-Integrated Brokers
    "YES Bank Securities", "IDBI Bank Securities", "RBL Bank", "Aditya Birla Money",
    "Federal Bank Securities", "Bandhan Bank Securities",

    // Other Established Brokers
    "Arihant Capital", "Ashika Stock Broking", "Augment Financial", "B. D. Ranka",
    "Bhavik Shares & Stock Brokers", "Bombay Bullion", "Bosch Stock Broking",
    "BrightMoney", "Brokerking", "CARE Broking", "Choice Equities", "Cityline Stock Brokers",
    "Claire Equity", "Clearly Brokerage", "D. A. Stock Broking", "Deepak Stock Brokers",
    "Dhanraj Brokers", "Dharwani Equities", "DHI Finance", "Dolat Brokerage",
    "Edelweiss Private", "ERM Stock Brokers", "Equity Infotech", "Euro Exim Securities",
    "Exclusive Equities", "Federal Bank Broking", "Fimpro Financial", "Fincare Stock Broking",
    "Finquest Securities", "Finvasia", "Fiscal Broking", "Flat Securities",
    "Flipstone Consultancy", "Fortis Broking", "Forward Broking", "Fortwell Equities",
    "Four Stone Consultants", "Frances Commodities", "Franklin Securities", "Gajjar Securities",
    "Ganesh Securities", "Garuda Capstock", "Gaurav Stock Brokers", "GCL Securities",
    "Genesis Broking", "Geo Securities", "Ginodia Stock Brokers", "Global Capital",
    "Global Equities", "Global Funds", "Global Securities", "Globe Brokers",
    "Glorious Capital", "Good Sign Equities", "Grand Finserve", "Grapes Broking",
    "Gravesham Broking", "Grin Broking", "GT Securities", "Guide Stock Brokers",
    "Gulimex Broking", "Gumption Securities", "Gupta Securities", "Guru Arjun Consultants",
    "Gurukul Equities", "Gyan Capital", "Gyan Securities", "H. R. Equities",
    "Harsh Broking", "Harveys Broking", "Hasib Securities", "Haycroft Broking",
    "Helix Securities", "H Equities", "Heritage Broking", "Heston Brokers",
    "Hi-Tech Securities", "Hi-Wealth Stock Brokers", "Himalayan Equities", "Himalaya Capital",
    "Hind Securities", "Hindsight Broking", "Hippo Broking", "Hoho Equities",
    "Holistic Investments", "Holmes Broking", "Home Capital", "Homestead Equities",
    "Honing Brokers", "Horizon Equities", "Horizon Securities", "Horizo Broking",
    "Horseplay Broking", "Hot Stock Brokers", "House of Brokers", "Houston Capital",
    "Hovercraft Brokers", "Howdy Equities", "Hullark Brokers", "Hullabaloo Capital",
    "Humana Securities", "Humble Brokers", "Humidor Equities", "Humility Securities",
    "Humor Capital", "Hump Day Brokers", "Huntec Capital", "Huntsman Equities",
    "Hurdles Broking", "Hurray Securities", "Hurricane Capital", "Hurried Brokers",
    "Hurtling Equities", "Husband Broking", "Hush Capital", "Hustle Brokers",
    "Hustlers Equities", "Hut Stock Brokers", "Hydrogen Capital", "Hyped Equities",
    "Hype Broking", "Hypothesis Capital", "Hyundai Securities", "Hyve Broking",

    // Indian Stock Brokers (Additional)
    "Invested", "Indiabulls Securities", "IIFL Wealth", "IndiaMart Securities",
    "Jagjeet Stock Brokers", "Jaiprakash Securities", "Jal Stock Broking", "Jalamar Brokers",
    "Jalata Equities", "Jamboree Capital", "Jambul Brokers", "Jamestown Securities",
    "Jan Capital", "Janata Broking", "Janglee Equities", "Janitor Securities",
    "Jannat Capital", "Janta Brokers", "Jaswant Broking", "Jata Securities",
    "Jayant Brokers", "Jayesh Equities", "Jayesh Securities", "Jb Capital",
    "Jdm Securities", "Jeera Broking", "Jeeva Equities", "Jehandad Capital",
    "Jen Stock Broking", "Jenco Securities", "Jericho Brokers", "Jerkin Equities",
    "Jeroboam Capital", "Jerry's Broking", "Jet Brokers", "Jetpack Securities",
    "Jetta Capital", "Jetton Equities", "Jewell Securities", "Jfc Capital",
    "Jha Stock Brokers", "Jhon Broking", "Jhoti Securities", "Jhunjhunwala Brokers",
    "Jig Securities", "Jigsaw Brokers", "Jihad Capital", "Jila Equities",
    "Jill's Broking", "Jilt Securities", "Jimbo Brokers", "Jimnastic Capital",
    "Jimmy's Equities", "Jin Capital", "Jingle Broking", "Jingle Bells Securities",
    "Jingle Jangle Brokers", "Jingly Equities", "Jingoism Capital", "Jinxed Securities",
    "Jirawala Brokers", "Jism Equities", "Jitney Capital", "Jitter Broking",
    "Jittery Securities", "Jiuzhaigou Brokers", "Jive Capital", "Jive Equities",
    "Jive Turkey Brokers", "Jiver Securities", "Jjim Capital", "Job Broking",
    "Jobber Equities", "Jobcentre Capital", "Jobless Securities", "Jobname Brokers",
    "Jobsworth Equities", "Jock Capital", "Jockey Broking", "Jockeys Securities",
    "Jocular Brokers", "Jocund Equities", "Jodeci Capital", "Jodhpur Securities",
    "Jodhpurs Broking", "Jodi Brokers", "Joe Capital", "Joes Equities",
    "Joey's Broking", "Joeys Securities", "Jog Capital", "Jogee Brokers",
    "Jogging Equities", "Joggs Securities", "Joghurt Capital", "Jogles Broking",
    "John Deere Brokers", "John Equities", "Johns Capital", "Johnny Broking",
    "Johnny's Securities", "Johnnys Brokers", "Johny's Capital", "Join Equities",
    "Joined Securities", "Joining Capital", "Joins Broking", "Joint Equities",
    "Joint Venture Securities", "Jointed Brokers", "Jointless Capital", "Joists Equities",
    "Joist Securities", "Joke Capital", "Joker Broking", "Jokers Equities",
    "Jokes Securities", "Jokester Capital", "Jokily Broking", "Jokiness Equities"
  ]);
  const [savedFormats, setSavedFormats] = useState<Record<string, FormatData>>({});
  const [activeFormat, setActiveFormat] = useState<FormatData | null>(null);
  const [detectedFormatLabel, setDetectedFormatLabel] = useState<string | null>(null);
  const [formatsLoading, setFormatsLoading] = useState(false);
  const importDataTextareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredBrokers = brokerSearchInput.trim() 
    ? availableBrokers.filter(b => b.toLowerCase().includes(brokerSearchInput.toLowerCase()))
    : [];

  // Check if all columns are filled
  const allColumnsFilledForSave = 
    buildModeData.positions.time.length > 0 &&
    buildModeData.positions.order.length > 0 &&
    buildModeData.positions.symbol.length > 0 &&
    buildModeData.positions.type.length > 0 &&
    buildModeData.positions.qty.length > 0 &&
    buildModeData.positions.price.length > 0;

  // Get missing columns for tooltip
  const missingColumns = [];
  if (buildModeData.positions.time.length === 0) missingColumns.push("Time");
  if (buildModeData.positions.order.length === 0) missingColumns.push("Order");
  if (buildModeData.positions.symbol.length === 0) missingColumns.push("Symbol");
  if (buildModeData.positions.type.length === 0) missingColumns.push("Type");
  if (buildModeData.positions.qty.length === 0) missingColumns.push("Qty");
  if (buildModeData.positions.price.length === 0) missingColumns.push("Price");

  // Helper function to save formats to Universal Broker Library AND user personal formats
  const saveFormatToUniversalLibrary = async (formatLabel: string, format: FormatData, brokerName: string) => {
    if (!currentUser?.userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save formats",
        variant: "destructive"
      });
      return false;
    }

    try {
      const idToken = await getCognitoToken();
      if (!idToken) return false;

      // Generate a unique ID for this format (timestamp + random suffix)
      const uniqueFormatId = `${brokerName}_${formatLabel}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // Create format with ID and label embedded
      const formatWithMetadata: FormatData = {
        ...format,
        id: uniqueFormatId,
        label: formatLabel
      };

      console.log(`💾 Saving format "${formatLabel}" to ${brokerName} library with ID: ${uniqueFormatId}`);
      const response = await fetch('/api/broker-formats/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          brokerName,
          formatName: formatLabel,
          sampleLine: format.sampleLine,
          positions: format.positions,
          displayValues: format.displayValues,
          userId: currentUser.userId
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Format saved to ${brokerName} library`);

        // SYNC to user's personal formats for live preview
        // Use unique ID as key to prevent overwriting existing formats with same label
        const updatedFormats = {
          ...savedFormats,
          [uniqueFormatId]: formatWithMetadata
        };
        setSavedFormats(updatedFormats);

        // Also set this as the active format immediately
        setActiveFormat(formatWithMetadata);
        setDetectedFormatLabel(formatLabel);

        // Save to user's personal formats backend
        const userFormatsResponse = await fetch(`/api/user-formats/${currentUser.userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(updatedFormats)
        });

        if (userFormatsResponse.ok) {
          console.log(`✅ Format also synced to personal formats for live preview`);
        }

        toast({
          title: "Format Saved Successfully",
          description: `Your format "${formatLabel}" has been saved to the ${brokerName} library!`
        });
        return true;
      } else {
        console.error("❌ Failed to save format:", data.error);
        toast({
          title: "Save Failed",
          description: data.error || "Failed to save format to library",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("❌ Error saving format:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to server",
        variant: "destructive"
      });
      return false;
    }
  };


  // Load user's saved formats from AWS when user is authenticated
  useEffect(() => {
    const loadUserFormats = async () => {
      console.log("🔄 loadUserFormats triggered, currentUser:", currentUser?.userId ? `userId: ${currentUser.userId}` : "NO USER");

      if (!currentUser?.userId) {
        console.log("⏳ No authenticated user, skipping format load");
        setSavedFormats({});
        setFormatsLoading(false);
        return;
      }

      setFormatsLoading(true);
      try {
        console.log("📥 Loading user formats for userId:", currentUser.userId);
        const idToken = await getCognitoToken();
        if (!idToken) {
          console.error("❌ Failed to get Cognito ID token");
          setFormatsLoading(false);
          return;
        }

        console.log("🔑 Got Cognito ID token, making request to /api/user-formats/", currentUser.userId);
        const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        console.log("📡 Response status:", response.status, response.statusText);
        if (response.ok) {
          const formats = await response.json();
          console.log("✅ Loaded formats from AWS:", Object.keys(formats).length, "formats", formats);
          setSavedFormats(formats);
          if (Object.keys(formats).length > 0) {
            console.log("📦 Formats available in dropdown:", Object.keys(formats).join(", "));
          }
        } else {
          const errorText = await response.text();
          console.log("📭 No saved formats found in AWS, status:", response.status, "error:", errorText);
          setSavedFormats({});
        }
      } catch (error) {
        console.error("❌ Error loading user formats:", error);
        setSavedFormats({});
      } finally {
        setFormatsLoading(false);
      }
    };

    loadUserFormats();
  }, [currentUser?.userId]);

  // Reload formats when import dialog opens
  useEffect(() => {
    if (showImportModal && currentUser?.userId) {
      console.log("📂 Import dialog opened, reloading formats...");
      setFormatsLoading(true);
      // Create a function to reload formats without dependency on state
      (async () => {
        try {
          const idToken = await getCognitoToken();
          if (idToken) {
            const response = await fetch(`/api/user-formats/${currentUser.userId}`, {
              headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (response.ok) {
              const formats = await response.json();
              console.log("✅ Dialog opened - formats reloaded:", Object.keys(formats).length);
              setSavedFormats(formats);
              if (Object.keys(formats).length > 0) {
                console.log("📦 Formats now available in dropdown:", Object.keys(formats).join(", "));
              }
            }
          }
        } catch (err) {
          console.error("❌ Failed to reload formats on dialog open:", err);
        } finally {
          setFormatsLoading(false);
        }
      })();
    }
  }, [showImportModal, currentUser?.userId]);

  // Track if user has manually selected a format (to avoid auto-override)
  const [userSelectedFormatId, setUserSelectedFormatId] = useState<string | null>(null);

  // Auto-apply saved formats to live preview when data is pasted
  // BUT respect user's manual selection if they've chosen a specific format
  useEffect(() => {
    if (!importData.trim()) {
      setActiveFormat(null);
      setDetectedFormatLabel(null);
      return;
    }

    // If user has manually selected a format, don't auto-override
    if (userSelectedFormatId && savedFormats[userSelectedFormatId]) {
      console.log(`🔒 Respecting user's manual format selection: ${userSelectedFormatId}`);
      const userFormat = savedFormats[userSelectedFormatId];
      const currentFirstLine = importData.trim().split('\n')[0];
      const recalculatedFormat = recalculateFormatPositions(userFormat, currentFirstLine);
      setActiveFormat(recalculatedFormat);
      setDetectedFormatLabel(userFormat.label || userSelectedFormatId);
      return;
    }

    // PRIORITY 1: Auto-apply first saved format only if no manual selection
    if (Object.keys(savedFormats).length > 0 && !userSelectedFormatId) {
      // Use the first saved format automatically for live preview
      const firstFormatId = Object.keys(savedFormats)[0];
      const firstFormat = savedFormats[firstFormatId];

      // CRITICAL FIX: Recalculate positions based on current pasted data's first line
      const currentFirstLine = importData.trim().split('\n')[0];
      const recalculatedFormat = recalculateFormatPositions(firstFormat, currentFirstLine);

      const displayLabel = firstFormat.label || firstFormatId;
      console.log(`📲 Auto-applying saved format: "${displayLabel}" with recalculated positions for live preview`);
      console.log(`   Original positions:`, firstFormat.positions);
      console.log(`   Recalculated positions:`, recalculatedFormat.positions);
      setActiveFormat(recalculatedFormat);
      setDetectedFormatLabel(displayLabel);
      return;
    }

    // PRIORITY 2: Fall back to universal library detection if no saved formats
    const autoDetect = async () => {
      try {
        const firstLine = importData.trim().split('\n')[0];
        const response = await fetch('/api/broker-formats/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstLine })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.format) {
            console.log(`🎯 Auto-detected format from universal library - ${data.brokerName}: ${data.format.formatName} (${(data.confidence * 100).toFixed(0)}% confidence)`);
            setActiveFormat(data.format);
            setDetectedFormatLabel(`${data.brokerName}/${data.format.formatName}`);
          } else {
            setActiveFormat(null);
            setDetectedFormatLabel(null);
          }
        }
      } catch (error) {
        console.error('❌ Auto-detection error:', error);
        setActiveFormat(null);
        setDetectedFormatLabel(null);
      }
    };

    autoDetect();
  }, [importData, savedFormats, showImportModal, userSelectedFormatId]);

  // Broker Import State
  const [showBrokerImportModal, setShowBrokerImportModal] = useState(false);
  const [selectedBrokerForImport, setSelectedBrokerForImport] = useState<string>("");
  const [brokerCredentials, setBrokerCredentials] = useState({
    apiKey: "",
    apiSecret: "",
    clientId: "",
  });
  const [brokerImportLoading, setBrokerImportLoading] = useState(false);
  const [brokerImportError, setBrokerImportError] = useState("");

  // Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSecondaryOrderModal, setShowSecondaryOrderModal] = useState(false);
  const [orderTab, setOrderTab] = useState("history");

  // ─── CENTRAL BROKER REGISTRY ───────────────────────────────────────────
  // ADD NEW BROKERS HERE ONLY — both the primary and secondary order/position
  // dialogs automatically pick up the correct endpoints, tokens, and URLs.
  // No other fetch code needs to change when a new broker is integrated.
  // ────────────────────────────────────────────────────────────────────────
  const getBrokerEndpoints = useCallback((broker: string | null): {
    token: string | null;
    ordersEp: string | null;
    positionsEp: string | null;
    fundsEp: string | null;
  } => {
    switch (broker) {
      case 'zerodha': {
        const apiKey = localStorage.getItem("zerodha_api_key");
        return {
          token: zerodhaAccessToken,
          ordersEp: apiKey ? `/api/zerodha/trades?api_key=${encodeURIComponent(apiKey)}` : '/api/zerodha/trades',
          positionsEp: apiKey ? `/api/zerodha/positions?api_key=${encodeURIComponent(apiKey)}` : '/api/zerodha/positions',
          fundsEp: apiKey ? `/api/zerodha/margins?api_key=${encodeURIComponent(apiKey)}` : '/api/zerodha/margins',
        };
      }
      case 'upstox':
        return { token: upstoxAccessToken, ordersEp: '/api/broker/upstox/trades', positionsEp: '/api/broker/upstox/positions', fundsEp: '/api/broker/upstox/margins' };
      case 'angelone':
        return { token: userAngelOneToken, ordersEp: '/api/broker/angelone/trades', positionsEp: '/api/broker/angelone/positions', fundsEp: '/api/broker/angelone/margins' };
      case 'dhan':
        return { token: dhanAccessToken, ordersEp: '/api/broker/dhan/trades', positionsEp: '/api/broker/dhan/positions', fundsEp: '/api/broker/dhan/margins' };
      case 'groww':
        return {
          token: growwAccessToken,
          ordersEp: growwAccessToken ? `/api/broker/groww/orders?accessToken=${encodeURIComponent(growwAccessToken)}` : null,
          positionsEp: null,
          fundsEp: growwAccessToken ? `/api/broker/groww/funds?accessToken=${encodeURIComponent(growwAccessToken)}` : null,
        };
      case 'fyers':
        return { token: 'fyers_connected', ordersEp: '/api/broker/fyers/orders', positionsEp: '/api/broker/fyers/positions', fundsEp: '/api/broker/fyers/margins' };
      case 'delta':
        return { token: deltaExchangeIsConnected ? deltaExchangeApiKey : null, ordersEp: '/api/broker/delta/trades', positionsEp: '/api/broker/delta/positions', fundsEp: '/api/broker/delta/margins' };
      // ── ADD NEW BROKER CASE BELOW ──────────────────────────────────────
      default:
        return { token: null, ordersEp: null, positionsEp: null, fundsEp: null };
    }
  }, [zerodhaAccessToken, upstoxAccessToken, userAngelOneToken, dhanAccessToken, growwAccessToken, deltaExchangeIsConnected, deltaExchangeApiKey]);

  // Fetch broker positions when tab changes
  useEffect(() => {
    if (orderTab === "positions" && activeBroker) {
      let cancelled = false;
      let lastPositionsKey = '__uninit__';
      const fetchPositions = async () => {
        try {
          const { token, positionsEp: endpoint } = getBrokerEndpoints(activeBroker);
          const broker = activeBroker || '';
          
          if (!endpoint) return;
          
          const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (cancelled) return;
          // On any error, leave the existing positions on screen — don't blank them out
          if (!res.ok) {
            if (res.status === 401) {
              console.warn('⚠️ [POSITIONS] Session expired, please reconnect broker');
            }
            return;
          }
          const data = await res.json();
          if (cancelled) return;
          let positions = data.positions || [];

          // Fetch live prices for each position from WebSocket stream
          if (positions.length > 0) {
            const livePositions = await Promise.all(
              positions.map(async (pos: any) => {
                try {
                  const symbol = pos.symbol || '';
                  const liveRes = await fetch(`/api/live-quotes/NSE:${symbol}-EQ`);
                  if (liveRes.ok) {
                    const liveData = await liveRes.json();
                    return {
                      ...pos,
                      currentPrice: liveData.price || pos.currentPrice || pos.current_price || 0
                    };
                  }
                } catch (err) {
                  console.warn(`⚠️ [LIVE-PRICE] Could not fetch live price for ${pos.symbol}`);
                }
                return pos;
              })
            );
            if (cancelled) return;
            positions = livePositions;
          }

          // Build a key from symbols+qty+status to detect structural changes only (not price fluctuations)
          const newKey = positions.map((p: any) =>
            `${p.symbol}:${p.qty ?? p.quantity ?? p.netQty ?? 0}:${p.status ?? ''}`
          ).join('|');

          // Only update React state when positions actually changed — keeps UI completely stable between polls
          if (newKey !== lastPositionsKey) {
            lastPositionsKey = newKey;
            setBrokerPositions(positions);
            console.log('✅ [POSITIONS]', broker, 'Updated', positions.length, 'positions');
          }
        } catch (err) {
          // Silent fail — keep whatever is currently displayed, don't blank out
          if (!cancelled) console.error('❌ [POSITIONS] Error fetching positions:', err);
        }
      };

      // Fetch positions immediately when tab opens
      fetchPositions();

      // Poll every 700ms in background — UI only updates when positions actually change
      const pollInterval = setInterval(fetchPositions, 700);

      // Cleanup: clear interval and mark cancelled to prevent stale state updates
      return () => { cancelled = true; clearInterval(pollInterval); };
    }
  }, [activeBroker, orderTab, getBrokerEndpoints]);
  const [brokerOrders, setBrokerOrders] = useState<any[]>([]);
  const [fetchingBrokerOrders, setFetchingBrokerOrders] = useState(false);
  const [brokerPositions, setBrokerPositions] = useState<any[]>([]);
  const [fetchingBrokerPositions, setFetchingBrokerPositions] = useState(false);

  const [broker2Orders, setBroker2Orders] = useState<any[]>([]);
  const [broker2Positions, setBroker2Positions] = useState<any[]>([]);
  const [broker2Funds, setBroker2Funds] = useState<number | null>(null);
  const [fetchingBroker2, setFetchingBroker2] = useState(false);

  const [orderData, setOrderData] = useState({
    symbol: "",
    action: "Buy",
    orderType: "Market",
    quantity: "",
    price: "",
    stopLoss: "",
    target: "",
  });
  const previousBrokerOrdersLengthRef = useRef<number>(0);
  const previousCompleteOrdersLengthRef = useRef<number>(0);
  const previousSecondaryCompleteOrdersLengthRef = useRef<number>(0);

  // Save Confirmation Dialog State
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [saveConfirmationData, setSaveConfirmationData] = useState<any>(null);

  // Trade History Data State
  const [tradeHistoryData, setTradeHistoryData] = useState([]);
  const [tradeHistoryData2, setTradeHistoryData2] = useState<any[]>([]);
  const [tradeHistoryWindow, setTradeHistoryWindow] = useState(1);

  // Fetch broker orders when Orders dialog opens
  useEffect(() => {
    if (orderTab === 'history' && activeBroker) {
      let cancelled = false;
      const fetchOrders = async () => {
        if (cancelled) return;
        setFetchingBrokerOrders(true);
        try {
          const { token, ordersEp: endpoint } = getBrokerEndpoints(activeBroker);
          const broker = activeBroker || '';

          if (!endpoint) {
            if (!cancelled) setFetchingBrokerOrders(false);
            return;
          }
          
          const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (cancelled) return;
          if (!res.ok) {
            await res.json().catch(() => ({}));
            if (res.status === 401) {
              console.warn('⚠️ [ORDERS] Session expired, please reconnect broker');
            }
            if (!cancelled) { setBrokerOrders([]); setFetchingBrokerOrders(false); }
            return;
          }
          const data = await res.json();
          if (!cancelled) {
            setBrokerOrders(data.trades || data.orders || []);
            console.log('✅ [ORDERS]', broker, 'Fetched', (data.trades || data.orders || []).length, 'trades');
          }
        } catch (err) {
          if (!cancelled) {
            console.error('❌ [ORDERS] Error fetching trades:', err);
            setBrokerOrders([]);
          }
        } finally {
          if (!cancelled) setFetchingBrokerOrders(false);
        }
      };

      // Fetch orders immediately when dialog opens
      fetchOrders();

      // Set up polling to refresh every 5 seconds while dialog is open
      const pollInterval = setInterval(fetchOrders, 5000);

      // Cleanup: clear interval and prevent stale state updates from in-flight fetches
      return () => { cancelled = true; clearInterval(pollInterval); };
    }
  }, [activeBroker, orderTab, getBrokerEndpoints]);

  // Fetch second broker ORDERS (5s polling) — runs in background for auto-record to work
  useEffect(() => {
    if (!secondaryBroker) {
      setBroker2Orders([]);
      return;
    }
    let cancelled = false;
    const fetchOrders = async () => {
      const { token, ordersEp: ep } = getBrokerEndpoints(secondaryBroker);
      if (!ep || (!token && secondaryBroker !== 'groww')) return;
      setFetchingBroker2(true);
      try {
        const res = await fetch(ep, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (!cancelled) {
          if (!res.ok) {
            if (res.status === 401) console.warn('⚠️ [BROKER2 ORDERS] Session expired, please reconnect broker');
            setBroker2Orders([]);
          } else {
            const data = await res.json();
            setBroker2Orders(data.trades || data.orders || []);
            console.log('✅ [BROKER2 ORDERS]', secondaryBroker, 'Fetched', (data.trades || data.orders || []).length, 'trades');
          }
        }
      } catch (err) {
        console.error('❌ [BROKER2 ORDERS] Error:', err);
        if (!cancelled) setBroker2Orders([]);
      } finally {
        if (!cancelled) setFetchingBroker2(false);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [secondaryBroker, getBrokerEndpoints]);

  // Fetch second broker POSITIONS (700ms polling, live prices, change detection) — uses central registry
  useEffect(() => {
    if (!secondaryBroker || (!showOrderModal && !showSecondaryOrderModal)) {
      setBroker2Positions([]);
      return;
    }
    let cancelled = false;
    let lastPositionsKey = '__uninit__';
    const fetchPositions = async () => {
      const { token, positionsEp: ep } = getBrokerEndpoints(secondaryBroker);
      if (!ep) return;
      try {
        const res = await fetch(ep, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (!res.ok) {
          if (res.status === 401) console.warn('⚠️ [BROKER2 POSITIONS] Session expired, please reconnect broker');
          return;
        }
        const data = await res.json();
        let positions = data.positions || [];
        // Enrich with live prices — same as broker 1
        if (positions.length > 0) {
          const livePositions = await Promise.all(
            positions.map(async (pos: any) => {
              try {
                const symbol = pos.symbol || '';
                const liveRes = await fetch(`/api/live-quotes/NSE:${symbol}-EQ`);
                if (liveRes.ok) {
                  const liveData = await liveRes.json();
                  return { ...pos, currentPrice: liveData.price || pos.currentPrice || pos.current_price || 0 };
                }
              } catch {
                console.warn(`⚠️ [BROKER2 LIVE-PRICE] Could not fetch live price for ${pos.symbol}`);
              }
              return pos;
            })
          );
          positions = livePositions;
        }
        // Change detection — only update state when positions actually changed
        const newKey = positions.map((p: any) =>
          `${p.symbol}:${p.qty ?? p.quantity ?? p.netQty ?? 0}:${p.status ?? ''}`
        ).join('|');
        if (!cancelled && newKey !== lastPositionsKey) {
          lastPositionsKey = newKey;
          setBroker2Positions(positions);
          console.log('✅ [BROKER2 POSITIONS]', secondaryBroker, 'Updated', positions.length, 'positions');
        }
      } catch (err) {
        console.error('❌ [BROKER2 POSITIONS] Error:', err);
      }
    };
    fetchPositions();
    const interval = setInterval(fetchPositions, 700);
    return () => { cancelled = true; clearInterval(interval); };
  }, [secondaryBroker, showOrderModal, showSecondaryOrderModal, getBrokerEndpoints]);

  // Fetch second broker FUNDS (2s polling) — uses central registry
  useEffect(() => {
    if (!secondaryBroker || (!showOrderModal && !showSecondaryOrderModal)) {
      setBroker2Funds(null);
      return;
    }
    let cancelled = false;
    const fetchFunds = async () => {
      const { token, fundsEp: ep } = getBrokerEndpoints(secondaryBroker);
      if (!ep) return;
      try {
        const res = await fetch(ep, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const funds = data.availableCash ?? data.availableFunds ?? data.funds ?? null;
          if (funds !== null) {
            setBroker2Funds(funds);
            console.log('✅ [BROKER2 FUNDS]', secondaryBroker, 'Fetched funds:', funds);
          }
        }
      } catch (err) {
        console.error('❌ [BROKER2 FUNDS] Error:', err);
      }
    };
    fetchFunds();
    const interval = setInterval(fetchFunds, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [secondaryBroker, showOrderModal, showSecondaryOrderModal, zerodhaAccessToken, upstoxAccessToken, userAngelOneToken, dhanAccessToken, growwAccessToken, fyersIsConnected]);

  // Continuously merge secondary broker funds into allBrokerFunds (every 5s, always — not just when modal open)
  useEffect(() => {
    if (!secondaryBroker) {
      // Remove secondary broker key when no secondary broker is connected
      setAllBrokerFunds(prev => {
        const next = { ...prev };
        const knownBrokers = ['zerodha', 'upstox', 'angelone', 'dhan', 'groww', 'fyers', 'delta'];
        let changed = false;
        for (const key of knownBrokers) {
          if (key in next && key !== activeBroker) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      return;
    }
    let cancelled = false;
    const { token, fundsEp: ep } = getBrokerEndpoints(secondaryBroker);
    if (!ep) return;
    const fetchSecondaryFunds = async () => {
      try {
        const res = await fetch(ep, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const funds = data.availableCash ?? data.availableFunds ?? data.funds ?? null;
          if (funds !== null) {
            setAllBrokerFunds(prev => ({ ...prev, [secondaryBroker]: funds }));
            console.log('✅ [ALL-BROKER-FUNDS] Merged secondary', secondaryBroker, ':', funds);
          }
        }
      } catch (e) {
        console.warn('⚠️ [ALL-BROKER-FUNDS] Could not fetch secondary broker funds');
      }
    };
    fetchSecondaryFunds();
    const interval = setInterval(fetchSecondaryFunds, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [secondaryBroker, activeBroker, getBrokerEndpoints, zerodhaAccessToken, upstoxAccessToken, userAngelOneToken, dhanAccessToken, growwAccessToken, fyersIsConnected]);


  // Restore broker funds from localStorage on mount when Zerodha connected
  useEffect(() => {
    if (zerodhaAccessToken && !brokerFunds) {
      const saved = localStorage.getItem("zerodha_broker_funds");
      if (saved) {
        setBrokerFunds(parseFloat(saved));
      }
    }
  }, [zerodhaAccessToken, brokerFunds]);

  // Fetch broker funds when dialog opens - supports all 4 brokers (Zerodha, Upstox, Angel One, Dhan)
  useEffect(() => {
    if (showOrderModal && (zerodhaAccessToken || upstoxAccessToken || userAngelOneToken || dhanAccessToken)) {
      const fetchBrokerFunds = async () => {
        try {
          // Determine which broker is connected
          let endpoint = '';
          let token = '';
          let broker = '';
          
          if (zerodhaAccessToken) {
            endpoint = '/api/zerodha/margins';
            token = zerodhaAccessToken;
            broker = 'Zerodha';
            
            // Add API Key to query or headers for Zerodha
            const apiKey = localStorage.getItem("zerodha_api_key");
            if (apiKey) {
              endpoint += `?api_key=${encodeURIComponent(apiKey)}`;
            }
          } else if (upstoxAccessToken) {
            endpoint = '/api/broker/upstox/margins';
            token = upstoxAccessToken;
            broker = 'Upstox';
          } else if (userAngelOneToken) {
            endpoint = '/api/broker/angelone/margins';
            token = userAngelOneToken;
            broker = 'Angel One';
          } else if (dhanAccessToken) {
            endpoint = '/api/broker/dhan/margins';
            token = dhanAccessToken;
            broker = 'Dhan';
          } else if (fyersIsConnected) {
            endpoint = '/api/broker/fyers/margins';
            token = 'fyers_connected';
            broker = 'Fyers';
          }
          
          if (!endpoint) return;
          
          const response = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setBrokerFunds(data.availableCash || data.availableFunds || 0);
          console.log('✅ [FUNDS]', broker, 'Fetched available funds:', data.availableCash || data.availableFunds);
        } catch (error) {
          console.error('❌ [FUNDS] Error fetching broker funds:', error);
          setBrokerFunds(0);
        }
      };
      
      // Fetch funds immediately when dialog opens
      fetchBrokerFunds();
      
      // Set up polling to refresh every 2 seconds while dialog is open
      const pollInterval = setInterval(fetchBrokerFunds, 2000);
      
      // Cleanup: clear interval when dialog closes
      return () => clearInterval(pollInterval);
    }
  }, [showOrderModal, zerodhaAccessToken, upstoxAccessToken, userAngelOneToken, dhanAccessToken]);

  // ============================================

  // ✅ SIMPLIFIED: TWO SEPARATE HEATMAP DATA STATES - NO localStorage!
  // Demo heatmap data (Heatmap loaded from AWS DynamoDB
  const [demoTradingDataByDate, setDemoTradingDataByDate] = useState<Record<string, any>>({});

  // Personal heatmap data (Heatmap loaded from AWS DynamoDB
  const [personalTradingDataByDate, setPersonalTradingDataByDate] = useState<Record<string, any>>({});

  // Personal Heatmap 2 data (Tab2 / secondary broker trades)
  const [personal2TradingDataByDate, setPersonal2TradingDataByDate] = useState<Record<string, any>>({});

  // ✅ PERSONAL HEATMAP REVISION: Track updates to force React re-renders
  // This counter increments after personal auto-clicking completes
  // Ensures heatmap cells update when personalTradingDataByDate changes
  const [personalHeatmapRevision, setPersonalHeatmapRevision] = useState(0);
  const [personal2HeatmapRevision, setPersonal2HeatmapRevision] = useState(0);

  // 3-state heatmap mode: 0 = Demo, 1 = Personal Heatmap 1 (Tab1), 2 = Personal Heatmap 2 (Tab2)
  const [heatmapMode, setHeatmapMode] = useState<0 | 1 | 2>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("heatmapMode");
      if (stored !== null) {
        const n = parseInt(stored);
        if (n === 0 || n === 1 || n === 2) return n as 0 | 1 | 2;
      }
      // Fall back to old isDemoMode logic
      const oldDemoMode = localStorage.getItem("tradingJournalDemoMode");
      const userId = localStorage.getItem("currentUserId");
      if (oldDemoMode === "true" || !userId) {
        console.log("🎯 Auto-default: Demo mode (heatmapMode=0)");
        return 0;
      }
      console.log("🎯 Default: Personal mode (heatmapMode=1)");
      return 1;
    }
    return 0;
  });

  // Derived boolean for backward compatibility with existing code
  // Demo mode UI (demo broker dialogs, demo orders/positions) only applies to guest (non-authenticated) users.
  // Authenticated users can toggle to demo heatmap data but always see real broker connections.
  const isLoggedIn = !!(currentUser?.userId);
  const isDemoMode = heatmapMode === 0 && !isLoggedIn;
  // setIsDemoMode kept for backward compat (true → Demo=0, false → Personal1=1)
  const setIsDemoMode = (val: boolean) => {
    const newMode = val ? 0 : 1;
    setHeatmapMode(newMode);
    localStorage.setItem("heatmapMode", String(newMode));
    localStorage.setItem("tradingJournalDemoMode", String(val));
  };

  // Reset broker connections based on actual stored tokens only
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasZerodhaUrlToken = !!urlParams.get('zerodha_token');
    const hasZerodhaStoredToken = !!localStorage.getItem('zerodha_token');
    if (!hasZerodhaUrlToken && !hasZerodhaStoredToken) setZerodhaIsConnected(false);

    const hasUpstoxStoredToken = !!localStorage.getItem('upstox_token');
    if (!hasUpstoxStoredToken) setUpstoxIsConnected(false);
  }, [isDemoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state for heatmap data
  const [isLoadingHeatmapData, setIsLoadingHeatmapData] = useState(false);


  // ✅ CLEANUP: Remove stale localStorage data on startup to prevent state mismatches
  // This ensures fresh data is always fetched from AWS DynamoDB
  useEffect(() => {
    console.log("🧹 Startup cleanup: Removing stale localStorage trading data caches...");

    // Remove stale personal trading data cache - forces fresh fetch from AWS
    localStorage.removeItem("personalTradingDataByDate");

    // Remove stale calendar data cache
    localStorage.removeItem("calendarData");

    // Remove stale heatmap data cache
    localStorage.removeItem("heatmapDataCache");

    console.log("✅ Stale localStorage caches cleared - will fetch fresh data from AWS");
  }, []); // Empty dependency array = runs once on mount
  // Loading state for date selection
  const [isDateLoading, setIsDateLoading] = useState(false);

  // ✅ FIXED: Use useMemo with revision dependencies to force re-renders
  // When personal mode auto-clicking completes, revisions increment
  // This triggers React to re-compute tradingDataByDate and re-render the heatmap
  const tradingDataByDate = useMemo(() => {
    const activeData = heatmapMode === 0 ? demoTradingDataByDate
                     : heatmapMode === 1 ? personalTradingDataByDate
                     : personal2TradingDataByDate;
    const modeLabel = heatmapMode === 0 ? 'DEMO' : heatmapMode === 1 ? 'PERSONAL-1' : 'PERSONAL-2';
    console.log(`🔄 tradingDataByDate recomputed [Mode: ${modeLabel}, Dates: ${Object.keys(activeData).length}]`);
    return activeData;
  }, [heatmapMode, demoTradingDataByDate, personalTradingDataByDate, personal2TradingDataByDate, personalHeatmapRevision, personal2HeatmapRevision]);


  // ── Paper Trading Hook (extracted) ──────────────────────────────────────────
  // ref wrapper to break circular dep with useJournalChartLogic
  const _setHeatmapSelectedDateRef = useRef<(date: string) => void>(() => {});

  const {
    showPaperTradingModal, setShowPaperTradingModal,
    showTradingChallengeModal, setShowTradingChallengeModal,
    showJournalInfoModal, setShowJournalInfoModal,
    hidePositionDetails, setHidePositionDetails,
    swipedPositionId, setSwipedPositionId,
    swipeStartXRef, swipeStartYRef,
    paperTradingCapital, setPaperTradingCapital,
    paperTradingRealizedPnl, setPaperTradingRealizedPnl,
    paperTradingTotalPnl,
    paperPositions, setPaperPositions,
    paperTradeHistory, setPaperTradeHistory,
    paperTradingAwsLoaded, setPaperTradingAwsLoaded,
    paperTradingAwsSaving,
    paperTradeSymbol, setPaperTradeSymbol,
    paperTradeSymbolSearch, setPaperTradeSymbolSearch,
    paperTradeSearchResults, setPaperTradeSearchResults,
    paperTradeSearchLoading,
    selectedPaperTradingInstrument, setSelectedPaperTradingInstrument,
    paperTradeType, setPaperTradeType,
    paperTradeQuantity, setPaperTradeQuantity,
    paperTradeLotInput, setPaperTradeLotInput,
    paperTradeAction, setPaperTradeAction,
    paperTradeCurrentPrice, setPaperTradeCurrentPrice,
    paperTradePriceLoading, setPaperTradePriceLoading,
    showPaperTradeSLDropdown, setShowPaperTradeSLDropdown,
    showMobilePaperTradeSLDropdown, setShowMobilePaperTradeSLDropdown,
    paperTradeSLPrice, setPaperTradeSLPrice,
    paperTradeSLType, setPaperTradeSLType,
    paperTradeSLValue, setPaperTradeSLValue,
    paperTradeSLTimeframe, setPaperTradeSLTimeframe,
    paperTradeSLDurationUnit, setPaperTradeSLDurationUnit,
    paperTradeSLEnabled, setPaperTradeSLEnabled,
    paperTradingWsStatus, setPaperTradingWsStatus,
    paperTradingLivePrices,
    paperTradingEventSourcesRef,
    paperTradingStreamSymbolsRef,
    searchPaperTradingInstruments,
    fetchPaperTradePrice,
    executePaperTrade,
    resetPaperTradingAccount,
    recordAllPaperTrades,
    recordAllBrokerOrders,
    recordSecondaryBrokerOrders,
    exitAllPaperPositions,
    exitPosition,
    getSearchPlaceholder,
    getLotSizeForInstrument,
  } = usePaperTrading({
    zerodhaAccessToken,
    upstoxAccessToken,
    userAngelOneToken,
    dhanAccessToken,
    growwAccessToken,
    fyersIsConnected,
    activeBroker,
    setBrokerFunds,
    setAllBrokerFunds,
    authInitialized,
    isViewOnlyMode,
    isDemoMode,
    setIsDemoMode,
    tradingDataByDate,
    personalTradingDataByDate,
    setPersonalTradingDataByDate,
    setTradeHistoryData,
    setTradeHistoryData2,
    setTradeHistoryWindow,
    setHeatmapSelectedDate: (date: string) => _setHeatmapSelectedDateRef.current(date),
    setSelectedDate,
    setPersonalHeatmapRevision,
    setShowOrderModal,
    setShowSecondaryOrderModal,
    brokerOrders,
    broker2Orders,
    secondaryBroker,
    fyersOrders,
    deltaExchangeTradesData,
    previousCompleteOrdersLengthRef,
    previousBrokerOrdersLengthRef,
    previousSecondaryCompleteOrdersLengthRef,
    activeTab,
    mobileBottomTab,
    toast,
  });
  // Sync heatmap data to window globals for journal report generation
  React.useEffect(() => {
    (window as any).__p1JournalData = personalTradingDataByDate;
    (window as any).__p2JournalData = personal2TradingDataByDate;
    (window as any).__demoJournalData = demoTradingDataByDate;
  }, [personalTradingDataByDate, personal2TradingDataByDate, demoTradingDataByDate]);

  // Mini sparkline data for navigation bar icon - mirrors the Performance Trend chart exactly
  const navSparklineData = useMemo(() => {
    // Helper: normalize values array → SVG polyline points string (w=40, h=24)
    const toPoints = (values: number[]) => {
      if (values.length === 0) return null;
      if (values.length === 1) values = [values[0], values[0]];
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const range = maxVal - minVal || 1;
      return values.map((val, idx) => {
        const x = (idx / (values.length - 1)) * 40;
        const y = 20 - ((val - minVal) / range) * 16; // 4px top/bottom padding
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
    };

    // --- MODE 1: Selected date → intraday trade-by-trade cumulative P&L ---
    // Uses same data path as the full Performance Trend chart (tradingDataByDate)
    if (selectedDate) {
      const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
      const todayData = tradingDataByDate[selectedDateStr];
      const raw = todayData?.tradingData || todayData;
      const allTrades: any[] = raw?.tradeHistory || raw?.trades || [];

      if (allTrades.length > 0) {
        // Parse + sort by time (same logic as Performance Trend chart)
        const parseTimeToMin = (t: string) => {
          if (!t) return -1;
          const m = t.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)/i);
          if (!m) return -1;
          let h = parseInt(m[1]);
          const mn = parseInt(m[2]);
          if (m[4].toUpperCase() === 'PM' && h !== 12) h += 12;
          if (m[4].toUpperCase() === 'AM' && h === 12) h = 0;
          return h * 60 + mn;
        };
        const trades = allTrades
          .map((t: any) => {
            const pnlNum = typeof t.pnl === 'number' ? t.pnl : parseFloat(String(t.pnl || '0').replace(/[₹,+\s]/g, '')) || 0;
            return { pnl: pnlNum, timeMin: parseTimeToMin(t.time || t.exitTime || '') };
          })
          .filter((t: any) => t.pnl !== 0)
          .sort((a: any, b: any) => a.timeMin - b.timeMin);

        if (trades.length > 0) {
          let cum = 0;
          const vals: number[] = [0];
          trades.forEach((t: any) => { cum += t.pnl; vals.push(cum); });
          const pts = toPoints(vals)!;
          return { points: pts, hasData: true, trend: cum >= 0 ? "up" : "down", mode: "1d" };
        }
      }
    }

    // --- MODE 2: Multi-day cumulative P&L trend (all available dates) ---
    // Uses same data path as the full Performance Trend chart (tradingDataByDate)
    const allDates = Object.keys(tradingDataByDate).sort();
    if (allDates.length > 0) {
      let cumPnL = 0;
      const pnlValues: number[] = [];
      allDates.forEach(dateKey => {
        const dayData = tradingDataByDate[dateKey];
        // Handle both wrapped (AWS) and unwrapped formats — same as heatmapMetrics
        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
        const netPnL = metrics?.netPnL || 0;
        if (netPnL !== 0) {
          cumPnL += netPnL;
          pnlValues.push(cumPnL);
        }
      });
      if (pnlValues.length > 0) {
        const pts = toPoints(pnlValues)!;
        const trend = pnlValues[pnlValues.length - 1] >= pnlValues[0] ? "up" : "down";
        return { points: pts, hasData: true, trend, mode: "multi" };
      }
    }

    // --- MODE 3: No data — gentle placeholder wave ---
    return { points: "0,18 5,16 10,14 15,15 20,12 25,10 30,8 35,6 40,4", hasData: false, trend: "neutral", mode: "empty" };
  }, [tradingDataByDate, selectedDate, heatmapMode]);


  const setTradingDataByDate = heatmapMode === 0 ? setDemoTradingDataByDate
                             : heatmapMode === 1 ? setPersonalTradingDataByDate
                             : setPersonal2TradingDataByDate;
  const getActiveStorageKey = () => heatmapMode === 0 ? "demoTradingDataByDate" : heatmapMode === 1 ? "personalTradingDataByDate" : "personal2TradingDataByDate";

  // Helper function to get AWS userId from localStorage
  // Returns null if user is not logged in with AWS
  const getUserId = (): string | null => {
    if (typeof window === "undefined") return null;

    // Use the actual AWS user ID from authentication ONLY
    const awsUserId = localStorage.getItem("currentUserId");
    if (awsUserId) {
      console.log(`🔑 Using AWS user ID: ${awsUserId}`);
      return awsUserId;
    }

    // No AWS user logged in - return null instead of generating random IDs
    console.log(`⚠️ No AWS user logged in - getUserId() returns null`);
    return null;
  };

  // Load journal wallet from server when user is identified; also auto-apply pending referral from URL
  useEffect(() => {
    const userId = currentUser?.userId;
    if (!userId) return;
    loadWallet(userId);
    loadInfluencerPeriod(userId);

    // Auto-apply referral code from URL (?ref=CODE) if present and not yet applied
    const urlParams = new URLSearchParams(window.location.search);
    const pendingRef = urlParams.get('ref') || sessionStorage.getItem('pendingReferralCode');
    if (pendingRef) {
      // Remove from URL cleanly
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      sessionStorage.removeItem('pendingReferralCode');
      // Apply referral via API
      fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: pendingRef.toUpperCase(),
          userName: currentUser?.displayName || currentUser?.username || '',
          userEmail: currentUser?.email || ''
        })
      }).then(r => r.json()).then(data => {
        if (data.success) {
          setJournalFundBase(data.newBalance);
          console.log('✅ Referral auto-applied from URL:', pendingRef);
        }
      }).catch(err => console.warn('⚠️ Auto referral apply failed:', err));
    }
  }, [currentUser?.userId]);

  // Capture referral code from URL for unauthenticated users (store in sessionStorage)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref && !currentUser?.userId) {
      sessionStorage.setItem('pendingReferralCode', ref);
    }
  }, []);

  // Load all heatmap data on startup and when userId or tab changes - ALWAYS from userId, never demo
  useEffect(() => {
    const loadAllHeatmapData = async () => {
      // Only load heatmap data when on journal tab
      if (activeTab !== "journal") {
        console.log(`⏭️ Skipping heatmap load - not on journal tab (current: ${activeTab})`);
        return;
      }

      // ALWAYS load from userId, not demo mode
      const userId = currentUser?.userId;

      console.log(`🔄 Loading heatmap data - userId: ${userId || "NO USER (demo)"}`);
      try {
        setIsLoadingHeatmapData(true);

        if (!userId) {
          // No user logged in - clear heatmap data
          console.log("⚠️ No user ID found - heatmap requires login");
          setPersonalTradingDataByDate({});
          setCalendarData({});
          setIsLoadingHeatmapData(false);
          return;
        }

        // Load user data from AWS DynamoDB
        console.log("📥 HEATMAP: Fetching user data from AWS for userId:", userId);
        const response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/all`));
        if (response.ok) {
          const personalData = await response.json();
          console.log("✅ HEATMAP data loaded:", Object.keys(personalData).length, "dates");

          setTradingDataByDate(personalData);
          setCalendarData(personalData);


          // Auto-click all available dates to populate heatmap colors - ULTRA FAST
          // This simulates clicking each date to ensure colors appear immediately
          setTimeout(async () => {
            console.log(
              "🔄 Ultra-fast auto-clicking all PERSONAL dates for heatmap colors...",
            );

            // Create all fetch promises in parallel for maximum speed
            const fetchPromises = Object.keys(personalData).map(
              async (dateStr) => {
                try {
                  const response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/${dateStr}`));
                  if (response.ok) {
                    const journalData = await response.json();
                    if (journalData && Object.keys(journalData).length > 0) {
                      return { dateStr, journalData };
                    }
                  }
                } catch (error) {
                  console.error(
                    `❌ Error auto-loading PERSONAL date ${dateStr}:`,
                    error,
                  );
                }
                return null;
              },
            );

            // Wait for all fetches to complete in parallel
            const results = await Promise.all(fetchPromises);

            // Update state with all loaded data
            const validResults = results.filter((r) => r !== null);
            if (validResults.length > 0) {
              const updatedData = { ...personalData };
              validResults.forEach((result: any) => {
                if (result) {
                  updatedData[result.dateStr] = result.journalData;
                }
              });
              setTradingDataByDate(updatedData);
              setCalendarData(updatedData);
              console.log(
                `✅ Ultra-fast PERSONAL heatmap population complete! Loaded ${validResults.length} dates in parallel.`,
              );
            }

          }, 100);
        } else {
          console.log("📭 No personal data found for user:", userId);
        }
      } catch (error) {
        console.error("❌ Error loading heatmap data:", error);
        console.error("Error type:", typeof error);
        console.error("Error message:", error instanceof Error ? error.message : 'Unknown error');
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
      } finally {
        setIsLoadingHeatmapData(false);
      }
    };

    loadAllHeatmapData();
  }, [activeTab, currentUser?.userId]); // Re-run when tab or user changes - ALWAYS load from userId

  // Images state for saving (with proper type)
  const [tradingImages, setTradingImages] = useState<any[]>([]);
  const imageUploadRef = useRef<MultipleImageUploadRef>(null);

  // Journal chart controls state - WITH CUSTOM TIMEFRAME SUPPORT
  const [selectedJournalSymbol, setSelectedJournalSymbol] =
    useState("NSE:NIFTY50-INDEX");
  const [selectedJournalInterval, setSelectedJournalInterval] = useState("5");  // Default to 5min
  const [showJournalCustomTimeframe, setShowJournalCustomTimeframe] = useState(false);
  const [journalCustomTimeframeType, setJournalCustomTimeframeType] = useState('minutes');
  const [journalCustomTimeframeInterval, setJournalCustomTimeframeInterval] = useState('');
  const [journalCustomTimeframes, setJournalCustomTimeframes] = useState<Array<{value: string, label: string, deletable: boolean}>>([]);
  const [journalHiddenPresetTimeframes, setJournalHiddenPresetTimeframes] = useState<string[]>([]);

  const [showStockSearch, setShowStockSearch] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [journalSearchType, setJournalSearchType] = useState<'STOCK' | 'COMMODITY' | 'F&O'>('STOCK');

  // Traded symbols tracking for Next button navigation
  const [tradedSymbols, setTradedSymbols] = useState<string[]>([]);
  const [currentSymbolIndex, setCurrentSymbolIndex] = useState(0);

  // Option Chain state
  const [showOptionChain, setShowOptionChain] = useState(false);
  const [optionChainData, setOptionChainData] = useState<any>(null);
  const [optionChainLoading, setOptionChainLoading] = useState(false);
  const [selectedOptionExpiry, setSelectedOptionExpiry] = useState<string>("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<string>("NIFTY");
  const [selectedOptionExpiryDate, setSelectedOptionExpiryDate] = useState<string>("");

  // ✨ OPTIMIZED FILTERING LOGIC
  // Normalize date to YYYY-MM-DD format
  const normalizeExpiryDate = (date: any): string | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch {
        return null;
      }
    }
    return null;
  };

  // Filter options by selected expiry (if expiry selected, otherwise return all)
  const filterOptionsByExpiry = (options: any[], selectedExpiry: string | null): any[] => {
    if (!options) return [];
    if (!selectedExpiry) return options; // No filter = show all
    return options.filter(option => {
      if (!option.expiry) return true;
      const optionExpiry = normalizeExpiryDate(option.expiry);
      return optionExpiry === selectedExpiry;
    });
  };

  // Get effective selected expiry (user choice or first available)
  const getEffectiveExpiry = (): string | null => {
    if (selectedOptionExpiryDate) return selectedOptionExpiryDate;
    const allExpiries = getOptionExpiryDates(selectedOptionIndex);
    return allExpiries.length > 0 ? allExpiries[0].value : null;
  };

  // Get expiry dates - extract from actual options data or backend response
  const getOptionExpiryDates = (index?: string): Array<{value: string, label: string}> => {
    if (!optionChainData) return [];

    // First try: backend expiryDates field
    let expiries = optionChainData?.expiryDates || optionChainData?.expiries || [];

    // Second try: extract from actual calls/puts if backend didn't provide dates
    if (!expiries || expiries.length === 0) {
      const allOptions = [...(optionChainData?.calls || []), ...(optionChainData?.puts || [])];
      const uniqueExpiries = new Set(
        allOptions
          .map((opt: any) => opt.expiry)
          .filter((exp: any) => exp && typeof exp === 'string')
      );
      expiries = Array.from(uniqueExpiries).sort();
      console.log('📅 Extracted expiry dates from options:', expiries);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter future dates
    const futureExpiries = expiries.filter((expiry: any) => {
      try {
        const expiryDate = new Date(expiry);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate >= today;
      } catch {
        return false;
      }
    });

    // Map to display format
    return futureExpiries.slice(0, 10).map((expiry: any) => ({
      value: String(expiry),
      label: (() => {
        try {
          return new Date(expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
          return String(expiry);
        }
      })()
    }));
  };

  // Auto-select first expiry date when option chain data loads (mobile fix)
  useEffect(() => {
    if (optionChainData?.expiryDates && optionChainData.expiryDates.length > 0 && !selectedOptionExpiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureExpiries = optionChainData.expiryDates.filter((expiry: string) => {
        const expiryDate = new Date(expiry);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate >= today;
      });
      if (futureExpiries.length > 0) {
        setSelectedOptionExpiryDate(futureExpiries[0]);
      }
    }
  }, [optionChainData, selectedOptionExpiryDate]);

  // Auto-fetch option chain data when dialog opens (mobile fix)
  useEffect(() => {
    if (showOptionChain && selectedOptionIndex) {
      fetchOptionChainData(selectedOptionIndex);
    }
  }, [showOptionChain, selectedOptionIndex]);
  const foEligibleSymbols = [
    'KOTAKBANK', 'LT', 'ITC', 'AXISBANK', 'HINDUNILVR', 'BAJFINANCE', 'MARUTI',
    'ASIANPAINT', 'TITAN', 'TATAMOTORS', 'SUNPHARMA', 'WIPRO', 'ULTRACEMCO',
    'TECHM', 'HCLTECH', 'NTPC', 'POWERGRID', 'ONGC', 'COALINDIA', 'M&M',
    'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'ADANIPORTS', 'BPCL', 'GRASIM',
    'DRREDDY', 'CIPLA', 'APOLLOHOSP', 'DIVISLAB', 'EICHERMOT', 'TATACONSUM',
    'BAJAJFINSV', 'HDFCLIFE', 'SBILIFE', 'INDUSINDBK', 'BRITANNIA', 'NESTLEIND',
    'NIFTY', 'BANKNIFTY', 'NIFTY50', 'NIFTYIT', 'FINNIFTY', 'MIDCPNIFTY'
  ];

  // Check if current instrument has options available
  const hasOptionsAvailable = (): boolean => {
    if (!selectedInstrument) return false;

    const symbol = selectedInstrument.symbol.replace('-EQ', '').replace('-INDEX', '').toUpperCase();
    const type = selectedInstrument.instrumentType || '';
    const exchange = selectedInstrument.exchange;

    // Indices always have options
    if (type === 'AMXIDX' || type === 'INDEX') return true;

    // Futures have corresponding options
    if (type === 'FUTIDX' || type === 'FUTSTK') return true;

    // F&O eligible stocks on NSE
    if ((exchange === 'NSE' || exchange === 'BSE') && (!type || type === '' || type === 'EQ')) {
      return foEligibleSymbols.some(s => symbol.includes(s) || s.includes(symbol));
    }

    return false;
  };

  // Get underlying symbol for option chain
  const getUnderlyingSymbol = (indexOverride?: string): string => {
    if (!selectedInstrument) {
    // If an index is explicitly provided (e.g., from option chain dropdown), use it directly
    if (indexOverride) {
      return indexOverride;
    }
    const pt = paperTradeSymbol ? paperTradeSymbol.replace(/-..*$/, "").toUpperCase() : "NIFTY";
    return pt;
  }

    const symbol = selectedInstrument.symbol.replace('-EQ', '').replace('-INDEX', '').toUpperCase();

    // For indices
    if (symbol.includes('NIFTY50') || symbol === 'NIFTY 50') return 'NIFTY';
    if (symbol.includes('BANKNIFTY') || symbol.includes('NIFTY BANK')) return 'BANKNIFTY';
    if (symbol.includes('FINNIFTY')) return 'FINNIFTY';
    if (symbol.includes('MIDCPNIFTY')) return 'MIDCPNIFTY';

    // For futures, extract underlying
    if (symbol.includes('FUT')) {
      const match = symbol.match(/^([A-Z]+)/);
      if (match) return match[1];
    }

    return symbol;
  };

  // Fetch option chain data
    const fetchOptionChainData = async (indexToFetch?: string, expiryToFetch?: string) => {
    const underlying = getUnderlyingSymbol(indexToFetch);
    if (!underlying) return;

    setOptionChainLoading(true);
    try {
      const expiry = expiryToFetch ? `&expiry=${encodeURIComponent(expiryToFetch)}` : '';
      const url = `/api/options/chain?symbol=${underlying}${expiry}`;
      console.log('🔗 [OPTIONS] Fetching from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📡 [OPTIONS] Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 [OPTIONS] Data received:', data.success ? '✅' : '❌', data);

      if (data.success && data.data) {
        setOptionChainData(data.data);
        console.log('✅ [OPTIONS] Option chain loaded:', data.data.calls?.length || 0, 'calls,', data.data.puts?.length || 0, 'puts');

        // Auto-select first expiry if not already selected
        // Try expiryDates first (backend field), then expiries (fallback)
        const expiries = data.data.expiryDates || data.data.expiries || [];
        if (expiries && expiries.length > 0) {
          const firstExpiry = expiries[0];
          if (!selectedOptionExpiryDate) {
            setSelectedOptionExpiryDate(firstExpiry);
            console.log('✅ [OPTIONS] Auto-selected first expiry:', firstExpiry);
          }
        }
      } else {
        console.warn('⚠️ [OPTIONS] Invalid response format:', data);
        setOptionChainData(null);
      }
    } catch (error) {
      console.error('❌ [OPTIONS] Error fetching option chain:', error);
      setOptionChainData(null);
    } finally {
      setOptionChainLoading(false);
    }
  };
  const [selectedInstrumentCategory, setSelectedInstrumentCategory] = useState("all");
  const [selectedJournalDate, setSelectedJournalDate] = useState(() => new Date().toISOString().split('T')[0]);
  // Mobile carousel state for journal panels (0=chart, 1=image, 2=notes)
  const [mobileJournalPanel, setMobileJournalPanel] = useState(2);
  // Mobile trade history dropdown state
  const [showMobileTradeHistory, setShowMobileTradeHistory] = useState(false);

  // ── Journal chart logic extracted to useJournalChartLogic hook ──
  const {
    journalChartData, setJournalChartData,
    journalChartLoading, setJournalChartLoading,
    journalChartTimeframe, setJournalChartTimeframe,
    showJournalTimeframeDropdown, setShowJournalTimeframeDropdown,
    showHeatmapTimeframeDropdown, setShowHeatmapTimeframeDropdown,
    showTradeMarkers, setShowTradeMarkers,
    journalChartMode, setJournalChartMode, handleCloseHeatmap,
    heatmapChartData, setHeatmapChartData,
    heatmapChartLoading, setHeatmapChartLoading,
    heatmapChartTimeframe, setHeatmapChartTimeframe,
    heatmapSelectedSymbol, setHeatmapSelectedSymbol,
    heatmapSelectedDate, setHeatmapSelectedDate,
    heatmapTradeHistory, setHeatmapTradeHistory,
    heatmapHoveredOhlc, setHeatmapHoveredOhlc,
    hoveredCandleOhlc, setHoveredCandleOhlc,
    journalEmaValues,
    journalLiveData,
    isJournalStreaming,
    liveOhlc, setLiveOhlc,
    searchedInstruments, setSearchedInstruments,
    isSearchingInstruments,
    selectedInstrument, setSelectedInstrument,
    selectedInstrumentToken, setSelectedInstrumentToken,
    journalChartContainerRef,
    heatmapChartContainerRef,
    journalCandleCountRef,
    journalCountdownBarRef,
    journalChartRef,
    journalCandlestickSeriesRef,
    journalEma12SeriesRef,
    journalEma26SeriesRef,
    heatmapChartRef,
    heatmapCandlestickSeriesRef,
    heatmapEma12SeriesRef,
    heatmapEma26SeriesRef,
    fetchJournalChartData,
    fetchHeatmapChartData,
    getJournalTimeframeLabel,
    getJournalAngelOneInterval,
    getJournalAngelOneSymbol,
    getJournalTimeframeMinutes,
    getAllJournalTimeframes,
    deleteJournalTimeframe,
    convertJournalCustomTimeframe,
    createJournalCustomTimeframeLabel,
    getExchangeForJournalSearchType,
    fetchInstruments,
    calculateEMA,
    getTradeMarkersForChart,
    getTradeUnderlyingSymbol,
    doesTradeMatchChart,
    isIndexChart,
    journalTimeframeOptions,
    journalAngelOneTokens,
    defaultInstruments,
    categorySearchSuggestions,
  } = useJournalChartLogic({
    activeTab,
    selectedJournalSymbol,
    setSelectedJournalSymbol,
    selectedJournalInterval,
    setSelectedJournalInterval,
    angelOneAccessToken,
    angelOneServerConnected,
    paperPositions,
    setPaperPositions,
    paperTradeSymbol,
    setPaperTradeCurrentPrice,
    tradeHistoryData,
    heatmapMode,
    mobileJournalPanel,
    journalSearchType,
    stockSearchQuery,
    journalHiddenPresetTimeframes,
    setJournalHiddenPresetTimeframes,
    journalCustomTimeframes,
    setJournalCustomTimeframes,
    getUserId,
    getFullApiUrl,
  });

  // Sync setHeatmapSelectedDate ref so usePaperTrading can call it
  useEffect(() => {
    _setHeatmapSelectedDateRef.current = setHeatmapSelectedDate;
  }, [setHeatmapSelectedDate]);


  // Watchlist Feature State
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Array<{
    symbol: string;
    name: string;
    token: string;
    exchange: string;
    displayName: string;
    tradingSymbol: string;
  }>>(() => {
    const saved = localStorage.getItem('watchlistSymbols');
    return saved ? JSON.parse(saved) : [
      { symbol: 'NSE:RELIANCE-EQ', name: 'Reliance Industries', token: '2885', exchange: 'NSE', displayName: 'RELIANCE', tradingSymbol: 'RELIANCE-EQ' },
      { symbol: 'NSE:TCS-EQ', name: 'Tata Consultancy Services', token: '11536', exchange: 'NSE', displayName: 'TCS', tradingSymbol: 'TCS-EQ' },
      { symbol: 'NSE:HDFCBANK-EQ', name: 'HDFC Bank', token: '1333', exchange: 'NSE', displayName: 'HDFCBANK', tradingSymbol: 'HDFCBANK-EQ' },
    ];
  });
  const [selectedWatchlistSymbol, setSelectedWatchlistSymbol] = useState<string>('NSE:RELIANCE-EQ');
  const [watchlistSearchQuery, setWatchlistSearchQuery] = useState('');
  const [watchlistDropdownOpen, setWatchlistDropdownOpen] = useState(false);
  const [watchlistSearchResults, setWatchlistSearchResults] = useState<Array<{
    symbol: string;
    name: string;
    token: string;
    exchange: string;
    displayName: string;
    tradingSymbol: string;
  }>>([]);
  const [isWatchlistSearching, setIsWatchlistSearching] = useState(false);
  const [watchlistNews, setWatchlistNews] = useState<Array<{
    title: string;
    description: string;
    url: string;
    publishedAt: string;
    source: string;
  }>>([]);
  const [isWatchlistNewsLoading, setIsWatchlistNewsLoading] = useState(false);
  const [marketNewsItems, setMarketNewsItems] = useState<Array<{title: string; url: string; description?: string; source: string; publishedAt: string; symbol: string; displayName: string;}>>([]);
  const [isMarketNewsLoading, setIsMarketNewsLoading] = useState(false);
  const [marketNewsMode, setMarketNewsMode] = useState<'all' | 'watchlist' | 'nifty50'>('nifty50');
  const [allMarketNewsItems, setAllMarketNewsItems] = useState<Array<{title: string; url: string; description?: string; source: string; publishedAt: string; sector: string; displayName: string;}>>([]);
  const [isAllMarketNewsLoading, setIsAllMarketNewsLoading] = useState(false);
  const [nifty50NewsItems, setNifty50NewsItems] = useState<Array<{title: string; url: string; description?: string; source: string; publishedAt: string; symbol: string; displayName: string;}>>([]);
  const [isNifty50NewsLoading, setIsNifty50NewsLoading] = useState(false);
  const [socialFeedPosts, setSocialFeedPosts] = useState<any[]>([]);
  const [isSocialFeedLoading, setIsSocialFeedLoading] = useState(false);
  const [newsSelectedSector, setNewsSelectedSector] = useState<string | null>(null);
  const [newsAiAnalysis, setNewsAiAnalysis] = useState<any>(null);
  const [isNewsAiAnalysisLoading, setIsNewsAiAnalysisLoading] = useState(false);
  const [showNewsAiPanel, setShowNewsAiPanel] = useState(false);
  const [newsAiAnalysisError, setNewsAiAnalysisError] = useState<string | null>(null);
  const [newsStockPrices, setNewsStockPrices] = useState<{[symbol: string]: {price: number; change: number; changePercent: number; currency: string; chartData: Array<{price: number; time: string}>}}>({});
  const fetchedPriceSymbolsRef = useRef<Set<string>>(new Set());
  const [allWatchlistQuarterlyData, setAllWatchlistQuarterlyData] = useState<{[symbol: string]: Array<{
    quarter: string;
    revenue: string;
    net_profit: string;
    eps: string;
    change_percent: string;
  }>}>({});
  const [isWatchlistQuarterlyLoading, setIsWatchlistQuarterlyLoading] = useState(false);
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);
  const [compareQuarterlyData, setCompareQuarterlyData] = useState<{[symbol: string]: any[]}>({});
  const [compareNewsData, setCompareNewsData] = useState<{[symbol: string]: any[]}>({});
  const [compareAnalysisData, setCompareAnalysisData] = useState<{[symbol: string]: any}>({});
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareAiInsights, setCompareAiInsights] = useState<string | null>(null);
  const [showCompareResults, setShowCompareResults] = useState(false);
  const [compareActiveTab, setCompareActiveTab] = useState<'overview'|'pnl'|'balance'|'metrics'|'insights'>('overview');
  const [showFullReport, setShowFullReport] = useState(false);
  const [fullReportLoading, setFullReportLoading] = useState(false);
  const [fullReportData, setFullReportData] = useState<{quarterly: any[]; annualFinancials: any; keyMetrics: any} | null>(null);
  const [fullReportActiveTab, setFullReportActiveTab] = useState<'quarterly'|'pnl'|'balance'|'metrics'|'insights'>('quarterly');
  const [fullReportSymbol, setFullReportSymbol] = useState<string | null>(null);
  const [nifty50Timeframe, setNifty50Timeframe] = useState('1D');
  const [niftyBankTimeframe, setNiftyBankTimeframe] = useState('1D');

  const flashBarItems = useMemo(() => {
    const items: Array<{ category: string; text: string; colorClass: string; tab: string; symbol?: string }> = [];
    const isAdmin = currentUser?.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();

    const newsSource = allMarketNewsItems.length > 0 ? allMarketNewsItems : nifty50NewsItems.length > 0 ? nifty50NewsItems : marketNewsItems;
    newsSource.slice(0, 6).forEach(n => {
      items.push({ category: 'News', text: n.title, colorClass: 'bg-green-500/20 text-green-300 border-green-500/30', tab: 'market-news' });
    });

    if (isAdmin) {
      watchlistSymbols.slice(0, 4).forEach(s => {
        const cleanSym = s.symbol.replace(/^[A-Z]+:/i, '').replace('-EQ', '').replace('-BE', '');
        items.push({ category: 'Watchlist', text: s.displayName || cleanSym, colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', tab: 'watchlist', symbol: cleanSym });
      });

      if (watchlistSymbols.length === 0) {
        items.push({ category: 'Watchlist', text: 'Add stocks to your watchlist to track live prices', colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', tab: 'watchlist' });
      }
    }

    items.push({ category: 'Social', text: 'Community insights · Trading discussions · Market reactions', colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30', tab: 'social' });
    items.push({ category: 'Journal', text: 'Log your trades and track P&L performance over time', colorClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30', tab: 'journal' });

    if (isAdmin) {
      items.push({ category: 'Challenge', text: 'Live Trading Challenge — sharpen your skills & compete', colorClass: 'bg-red-500/20 text-red-300 border-red-500/30', tab: 'trade-challenge' });
    }

    return items;
  }, [watchlistSymbols, allMarketNewsItems, nifty50NewsItems, marketNewsItems, currentUser?.email]);

  // Journal summary stats for authenticated users — shown on the flashbar Journal item
  const journalFlashStats = useMemo(() => {
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    const isAuth = userId && userEmail && userId !== 'null' && userEmail !== 'null';
    if (!isAuth) return null;
    const dates = Object.keys(tradingDataByDate).sort();
    if (dates.length === 0) return null;
    let totalPnL = 0, totalTrades = 0, winningTrades = 0;
    dates.forEach(dateKey => {
      const dayData = tradingDataByDate[dateKey];
      const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
      if (metrics) {
        totalPnL += metrics.netPnL || 0;
        totalTrades += metrics.totalTrades || 0;
        winningTrades += metrics.winningTrades || 0;
      }
    });
    if (totalTrades === 0) return null;
    const winRate = (winningTrades / totalTrades) * 100;
    return { totalPnL, totalTrades, winRate, tradingDays: dates.length };
  }, [tradingDataByDate]);

  useEffect(() => {
    if (flashBarItems.length <= 1) return;
    const id = setInterval(() => {
      setFlashBarVisible(false);
      setTimeout(() => {
        setFlashBarIndex(prev => (prev + 1) % flashBarItems.length);
        setFlashBarVisible(true);
      }, 220);
    }, 4000);
    return () => clearInterval(id);
  }, [flashBarItems.length]);

  // Fetch fallback last-traded chart data for watchlist symbols with < 2 intraday points
  useEffect(() => {
    const watchlistFlashItems = flashBarItems.filter(it => it.category === 'Watchlist' && it.symbol);
    const toFetch = watchlistFlashItems
      .map(it => it.symbol as string)
      .filter(sym => {
        const pts = (newsStockPrices[sym]?.chartData ?? []).filter((d: any) => d.price > 0);
        return pts.length < 2 && !flashBarFallbackFetchedRef.current.has(sym);
      });
    if (toFetch.length === 0) return;
    toFetch.forEach(sym => flashBarFallbackFetchedRef.current.add(sym));
    toFetch.forEach(async (sym) => {
      try {
        const res = await fetch(`/api/stock-chart-data/${sym}?timeframe=1D`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length >= 2) {
          setFlashBarFallbackChartData(prev => ({ ...prev, [sym]: data }));
        }
      } catch {}
    });
  }, [flashBarItems, newsStockPrices]);

  // Queries for NIFTY50 and NIFTYBANK chart data - optimized with caching
  const { data: nifty50ChartData = [], isLoading: isNifty50Loading } = useQuery({
    queryKey: ['stock-chart', 'NSE:NIFTY50-INDEX', nifty50Timeframe],
    queryFn: () => fetch(`/api/stock-chart-data/NSE:NIFTY50-INDEX?timeframe=${nifty50Timeframe}`).then(res => res.json()),
    enabled: activeTab === 'trading-home',
    refetchInterval: nifty50Timeframe === '1D' ? 120000 : 600000,
    staleTime: 60000,
    gcTime: 600000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { data: niftyBankChartData = [], isLoading: isNiftyBankLoading } = useQuery({
    queryKey: ['stock-chart', selectedWatchlistSymbol, niftyBankTimeframe],
    queryFn: () => {
      const symbol = selectedWatchlistSymbol;
      return fetch(`/api/stock-chart-data/${symbol}?timeframe=${niftyBankTimeframe}`).then(res => res.json());
    },
    enabled: activeTab === 'trading-home',
    refetchInterval: niftyBankTimeframe === '1D' ? 120000 : 600000,
    staleTime: 60000,
    gcTime: 600000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Transform chart data to match LineChart format - uses price field consistently
  const transformChartData = (data: any[]) => {
    if (!Array.isArray(data)) return [];
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    return data.map((candle: any) => {
      let time = candle.time;
      if (!time && candle.timestamp) {
        const ist = new Date(candle.timestamp * 1000 + IST_OFFSET_MS);
        const hh = ist.getUTCHours().toString().padStart(2, '0');
        const mm = ist.getUTCMinutes().toString().padStart(2, '0');
        time = `${hh}:${mm}`;
      }
      return {
        time: time || '',
        price: Number(candle.price) || Number(candle.close) || 0
      };
    });
  };

  const nifty50FormattedData = transformChartData(nifty50ChartData);
  const niftyBankFormattedData = transformChartData(niftyBankChartData);

  // Get current price from chart data (latest point) - matches NeoFeed pattern
  const getNifty50CurrentPrice = () => {
    if (nifty50ChartData && nifty50ChartData.length > 0) {
      return nifty50ChartData[nifty50ChartData.length - 1]?.price || nifty50ChartData[nifty50ChartData.length - 1]?.close || 0;
    }
    return 0;
  };

  const getNiftyBankCurrentPrice = () => {
    if (niftyBankChartData && niftyBankChartData.length > 0) {
      return niftyBankChartData[niftyBankChartData.length - 1]?.price || niftyBankChartData[niftyBankChartData.length - 1]?.close || 0;
    }
    return 0;
  };

  // Calculate baseline for change calculation - uses first data point as baseline
  const getNifty50Baseline = () => {
    if (!nifty50ChartData || nifty50ChartData.length === 0) {
      return getNifty50CurrentPrice();
    }
    return nifty50ChartData[0]?.price || nifty50ChartData[0]?.close || getNifty50CurrentPrice();
  };

  const getNiftyBankBaseline = () => {
    if (!niftyBankChartData || niftyBankChartData.length === 0) {
      return getNiftyBankCurrentPrice();
    }
    return niftyBankChartData[0]?.price || niftyBankChartData[0]?.close || getNiftyBankCurrentPrice();
  };

  const getNifty50Change = () => {
    const current = getNifty50CurrentPrice();
    const baseline = getNifty50Baseline();
    return current - baseline;
  };

  const getNiftyBankChange = () => {
    const current = getNiftyBankCurrentPrice();
    const baseline = getNiftyBankBaseline();
    return current - baseline;
  };

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('watchlistSymbols', JSON.stringify(watchlistSymbols));
  }, [watchlistSymbols]);

  // Fetch quarterly data when watchlist stock is selected
  useEffect(() => {
    if (!searchResultsNewsSymbol) {
      setAllWatchlistQuarterlyData({});
      return;
    }

    const fetchQuarterlyData = async () => {
      setIsWatchlistQuarterlyLoading(true);
      try {
        const cleanSymbol = searchResultsNewsSymbol.replace(/^[A-Z]+:/i, '').replace('-EQ', '').replace('-BE', '');
        const response = await fetch(`/api/quarterly-results/${cleanSymbol}`);
        if (response.ok) {
          const data = await response.json();
          setAllWatchlistQuarterlyData({
            [searchResultsNewsSymbol]: data.results || []
          });
        }
      } catch (error) {
        console.error(`Error fetching quarterly data:`, error);
        setAllWatchlistQuarterlyData({ [searchResultsNewsSymbol]: [] });
      } finally {
        setIsWatchlistQuarterlyLoading(false);
      }
    };

    fetchQuarterlyData();
  }, [searchResultsNewsSymbol]);
  // Sync watchlist stock selection with search results symbol to trigger quarterly fetch
  useEffect(() => {
    if (selectedWatchlistSymbol && searchResults.includes("[CHART:WATCHLIST]")) {
      setSearchResultsNewsSymbol(selectedWatchlistSymbol);
    }
  }, [selectedWatchlistSymbol, searchResults]);



  // Fetch news for selected watchlist symbol
  useEffect(() => {
    if (selectedWatchlistSymbol && (isWatchlistOpen || searchResults.includes("[CHART:WATCHLIST]"))) {
      const fetchWatchlistNews = async () => {
        setIsWatchlistNewsLoading(true);
        try {
          const cleanSymbol = selectedWatchlistSymbol.replace(/^[A-Z]+:/i, '').replace('-EQ', '').replace('-BE', '');
          const response = await fetch(`/api/stock-news/${cleanSymbol}?refresh=${Date.now()}`);
          if (response.ok) {
            const data = await response.json();
            const newsItems = Array.isArray(data) ? data : (data.news || []);
            setWatchlistNews(newsItems.slice(0, 20));
          }
        } catch (error) {
          console.error('Error fetching watchlist news:', error);
        } finally {
          setIsWatchlistNewsLoading(false);
        }
      };
      fetchWatchlistNews();
    }
  }, [selectedWatchlistSymbol, isWatchlistOpen, searchResults]);

  // Auto-fetch news for search results
  useEffect(() => {
    if (searchResultsNewsSymbol && searchResults.includes("[CHART:SEARCH_RESULTS]")) {
      const fetchSearchResultsNews = async () => {
        setIsWatchlistNewsLoading(true);
        try {
          const cleanSymbol = searchResultsNewsSymbol.replace(/^[A-Z]+:/i, '').replace('-EQ', '').replace('-BE', '');
          const response = await fetch(`/api/stock-news/${cleanSymbol}?refresh=${Date.now()}`);
          if (response.ok) {
            const data = await response.json();
            const newsItems = Array.isArray(data) ? data : (data.news || []);
            setWatchlistNews(newsItems.slice(0, 20));
          }
        } catch (error) {
          console.error('Error fetching search results news:', error);
        } finally {
          setIsWatchlistNewsLoading(false);
        }
      };
      fetchSearchResultsNews();
    }
  }, [searchResultsNewsSymbol, searchResults]);

  // Search stocks for watchlist
  const searchWatchlistStocks = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setWatchlistSearchResults([]);
      return;
    }
    setIsWatchlistSearching(true);
    try {
      const response = await fetch(`/api/angelone/search-instruments?query=${encodeURIComponent(query)}&exchange=NSE,BSE,MCX&limit=10`);
      if (response.ok) {
        const data = await response.json();
        const instruments = data.instruments || data || [];
        // Map to display format with symbol and name
        const formatted = instruments.slice(0, 10).map((inst: any) => ({
          symbol: inst.symbol || inst.trading_symbol || '',
          displayName: inst.symbol || inst.trading_symbol || '',
          name: inst.name || inst.company_name || inst.instrument_name || '',
          token: inst.token || inst.exch_instrument_token || '',
          exchange: inst.exch_seg || 'NSE',
          tradingSymbol: inst.symbol || inst.trading_symbol || ''
        })).filter((item: any) => item.symbol);
        setWatchlistSearchResults(formatted);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      setWatchlistSearchResults([]);
    } finally {
      setIsWatchlistSearching(false);
    }
  };

  // Trigger search when watchlist search query changes (with debouncing)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (watchlistSearchQuery.trim().length > 0) {
        searchWatchlistStocks(watchlistSearchQuery);
      } else {
        setWatchlistSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [watchlistSearchQuery]);


  // Fetch company insights when watchlist stock is selected (same logic as main search)
  useEffect(() => {
    if (selectedWatchlistSymbol) {
      const fetchWatchlistCompanyInsights = async () => {
        try {
          const response = await fetch(`/api/trading-agent?q=${encodeURIComponent(selectedWatchlistSymbol)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.companyInsights) {
              (window as any).companyInsightsData = data.companyInsights;
            }
          }
        } catch (error) {
          console.error('Error fetching watchlist company insights:', error);
        }
      };
      fetchWatchlistCompanyInsights();
    }
  }, [selectedWatchlistSymbol]);
  // Add stock to watchlist
  const addToWatchlist = (stock: { symbol: string; name: string; token: string; exchange: string; displayName: string; tradingSymbol: string }) => {
    if (!watchlistSymbols.find(s => s.symbol === stock.symbol)) {
      setWatchlistSymbols(prev => [...prev, stock]);
      setSelectedWatchlistSymbol(stock.symbol);
    }
    setWatchlistSearchQuery('');
    setWatchlistSearchResults([]);
  };

  // Remove stock from watchlist
  const removeFromWatchlist = (symbol: string) => {
    setWatchlistSymbols(prev => prev.filter(s => s.symbol !== symbol));
    if (selectedWatchlistSymbol === symbol && watchlistSymbols.length > 1) {
      const remaining = watchlistSymbols.filter(s => s.symbol !== symbol);
      setSelectedWatchlistSymbol(remaining[0]?.symbol || '');
    }
  };

  // Get relative time for news
  const fetchMarketNews = async () => {
    if (watchlistSymbols.length === 0) {
      setMarketNewsItems([]);
      return;
    }
    setIsMarketNewsLoading(true);
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const allNews: Array<{title: string; url: string; description?: string; source: string; publishedAt: string; symbol: string; displayName: string;}> = [];
      const seenUrls = new Set<string>();
      await Promise.all(
        watchlistSymbols.map(async (stock) => {
          try {
            const cleanSymbol = stock.symbol.replace(/^[A-Z]+:/i, '').replace('-EQ', '').replace('-BE', '');
            const res = await fetch(`/api/stock-news/${cleanSymbol}`);
            if (!res.ok) return;
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.news || []);
            items.forEach((item: any) => {
              if (!item.url || seenUrls.has(item.url)) return;
              const publishedDate = new Date(item.publishedAt || item.date || 0);
              if (publishedDate < oneWeekAgo) return;
              seenUrls.add(item.url);
              allNews.push({
                title: item.title || '',
                url: item.url || '',
                description: item.description || item.summary || '',
                source: item.source || '',
                publishedAt: item.publishedAt || item.date || new Date().toISOString(),
                symbol: cleanSymbol,
                displayName: stock.displayName || cleanSymbol,
              });
            });
          } catch {}
        })
      );
      allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setMarketNewsItems(allNews);
    } catch (error) {
      console.error('Error fetching market news:', error);
    } finally {
      setIsMarketNewsLoading(false);
    }
  };

  const fetchAllMarketNews = async () => {
    setIsAllMarketNewsLoading(true);
    try {
      const res = await fetch('/api/general-market-news');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAllMarketNewsItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching all market news:', error);
    } finally {
      setIsAllMarketNewsLoading(false);
    }
  };

  const NIFTY50_SYMBOLS = [
    { symbol: 'ADANIENT', name: 'Adani Enterprises' },
    { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ' },
    { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints' },
    { symbol: 'AXISBANK', name: 'Axis Bank' },
    { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto' },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
    { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv' },
    { symbol: 'BPCL', name: 'BPCL' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
    { symbol: 'BRITANNIA', name: 'Britannia Industries' },
    { symbol: 'CIPLA', name: 'Cipla' },
    { symbol: 'COALINDIA', name: 'Coal India' },
    { symbol: 'DIVISLAB', name: "Divi's Laboratories" },
    { symbol: 'DRREDDY', name: "Dr. Reddy's" },
    { symbol: 'EICHERMOT', name: 'Eicher Motors' },
    { symbol: 'GRASIM', name: 'Grasim Industries' },
    { symbol: 'HCLTECH', name: 'HCL Technologies' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank' },
    { symbol: 'HDFCLIFE', name: 'HDFC Life' },
    { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp' },
    { symbol: 'HINDALCO', name: 'Hindalco Industries' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank' },
    { symbol: 'ITC', name: 'ITC' },
    { symbol: 'INDUSINDBK', name: 'IndusInd Bank' },
    { symbol: 'INFY', name: 'Infosys' },
    { symbol: 'JSWSTEEL', name: 'JSW Steel' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
    { symbol: 'LT', name: 'Larsen & Toubro' },
    { symbol: 'LTIM', name: 'LTIMindtree' },
    { symbol: 'M&M', name: 'Mahindra & Mahindra' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki' },
    { symbol: 'NESTLEIND', name: 'Nestlé India' },
    { symbol: 'NTPC', name: 'NTPC' },
    { symbol: 'ONGC', name: 'ONGC' },
    { symbol: 'POWERGRID', name: 'Power Grid Corporation' },
    { symbol: 'RELIANCE', name: 'Reliance Industries' },
    { symbol: 'SBILIFE', name: 'SBI Life Insurance' },
    { symbol: 'SBIN', name: 'State Bank of India' },
    { symbol: 'SUNPHARMA', name: 'Sun Pharma' },
    { symbol: 'TCS', name: 'Tata Consultancy Services' },
    { symbol: 'TATACONSUM', name: 'Tata Consumer Products' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors' },
    { symbol: 'TATASTEEL', name: 'Tata Steel' },
    { symbol: 'TECHM', name: 'Tech Mahindra' },
    { symbol: 'TITAN', name: 'Titan Company' },
    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement' },
    { symbol: 'UPL', name: 'UPL' },
    { symbol: 'WIPRO', name: 'Wipro' },
    { symbol: 'SENSEX', name: 'Sensex' },
    { symbol: 'NIFTY', name: 'Nifty 50' },
    { symbol: 'BANKNIFTY', name: 'Bank Nifty' },
    { symbol: 'CRUDEOIL', name: 'Crude Oil' },
    { symbol: 'GOLD', name: 'Gold' },
    { symbol: 'SILVER', name: 'Silver' },
  ];

  const fetchNifty50News = async () => {
    setIsNifty50NewsLoading(true);
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const allNews: Array<{title: string; url: string; description?: string; source: string; publishedAt: string; symbol: string; displayName: string;}> = [];
      const seenUrls = new Set<string>();
      const batchSize = 8;
      for (let i = 0; i < NIFTY50_SYMBOLS.length; i += batchSize) {
        const batch = NIFTY50_SYMBOLS.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (stock) => {
            try {
              const res = await fetch(`/api/stock-news/${stock.symbol}`);
              if (!res.ok) return;
              const data = await res.json();
              const items = Array.isArray(data) ? data : (data.news || []);
              items.forEach((item: any) => {
                if (!item.url || seenUrls.has(item.url)) return;
                const publishedDate = new Date(item.publishedAt || item.date || 0);
                if (publishedDate < oneWeekAgo) return;
                seenUrls.add(item.url);
                allNews.push({
                  title: item.title || '',
                  url: item.url || '',
                  description: item.description || item.summary || '',
                  source: item.source || '',
                  publishedAt: item.publishedAt || item.date || new Date().toISOString(),
                  symbol: stock.symbol,
                  displayName: stock.name,
                });
              });
            } catch {}
          })
        );
      }
      allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setNifty50NewsItems(allNews);
      const uniqueSymbols = [...new Set(allNews.map(n => n.symbol))];
      fetchNewsStockPrices(uniqueSymbols);
    } catch (error) {
      console.error('Error fetching Nifty 50 news:', error);
    } finally {
      setIsNifty50NewsLoading(false);
    }
  };

  const fetchSocialFeedData = async () => {
    setIsSocialFeedLoading(true);
    try {
      const res = await fetch('/api/social-posts?limit=200');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSocialFeedPosts(Array.isArray(data) ? data : []);
    } catch {
      setSocialFeedPosts([]);
    } finally {
      setIsSocialFeedLoading(false);
    }
  };

  const fetchNewsStockPrices = async (symbols: string[]) => {
    const toFetch = symbols.filter(s => !fetchedPriceSymbolsRef.current.has(s));
    if (toFetch.length === 0) return;
    toFetch.forEach(s => fetchedPriceSymbolsRef.current.add(s));
    const batchSize = 15;
    for (let i = 0; i < toFetch.length; i += batchSize) {
      const batch = toFetch.slice(i, i + batchSize);
      try {
        const res = await fetch(`/api/news-stock-prices?symbols=${batch.join(',')}`);
        if (!res.ok) continue;
        const data = await res.json();
        setNewsStockPrices(prev => ({ ...prev, ...data }));
      } catch {}
    }
  };

  // Auto-fetch news on mount so flashbar shows real news immediately
  useEffect(() => {
    fetchNifty50News();
  }, []);

  // Fetch prices for watchlist symbols so sparklines show on flashbar
  useEffect(() => {
    if (watchlistSymbols.length === 0) return;
    const symbols = watchlistSymbols.map(s =>
      s.symbol.replace(/^[A-Z]+:/i, '').replace('-EQ', '').replace('-BE', '')
    );
    fetchNewsStockPrices(symbols);
  }, [watchlistSymbols]);

  const handleCompareAnalysis = async () => {
    if (compareSymbols.length < 2) return;
    setCompareLoading(true);
    setShowCompareResults(true);
    setCompareAiInsights(null);
    setCompareQuarterlyData({});
    setCompareNewsData({});
    setCompareAnalysisData({});
    setCompareActiveTab('overview');
    try {
      const qData: {[k: string]: any[]} = {};
      const nData: {[k: string]: any[]} = {};
      const aData: {[k: string]: any} = {};
      await Promise.all(compareSymbols.map(async sym => {
        try {
          const qRes = await fetch(`/api/quarterly-results/${sym}`);
          if (qRes.ok) { const d = await qRes.json(); qData[sym] = d.results || []; }
          else { console.warn(`Quarterly fetch failed for ${sym}: ${qRes.status}`); }
        } catch (e) { console.warn(`Quarterly fetch error for ${sym}:`, e); }
        try {
          const nRes = await fetch(`/api/stock-news/${sym}`);
          if (nRes.ok) { const d = await nRes.json(); nData[sym] = (Array.isArray(d) ? d : (d.news || [])).slice(0, 3); }
          else { console.warn(`News fetch failed for ${sym}: ${nRes.status}`); }
        } catch (e) { console.warn(`News fetch error for ${sym}:`, e); }
        try {
          const [aRes, finRes] = await Promise.all([
            fetch(`/api/stock-analysis/${sym}`),
            fetch(`/api/company-financials/${sym}`)
          ]);
          const d: any = aRes.ok ? await aRes.json() : {};
          if (finRes.ok) {
            const fin = await finRes.json();
            if (fin?.annualFinancials) d.annualFinancials = fin.annualFinancials;
            if (fin?.keyMetrics) d.keyMetrics = fin.keyMetrics;
          }
          aData[sym] = d;
        } catch (e) { console.warn(`Analysis fetch error for ${sym}:`, e); }
      }));
      setCompareQuarterlyData(qData);
      setCompareNewsData(nData);
      setCompareAnalysisData(aData);
      setCompareAiInsights('ready');
    } catch (e) {
      console.error('Compare analysis error:', e);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleViewFullReport = async (symbol: string) => {
    const cleanSymbol = symbol.replace(/^[A-Z]+:/i, '').replace(/-EQ$|-BE$|-SM$/i, '');
    setShowFullReport(true);
    setFullReportLoading(true);
    setFullReportData(null);
    setFullReportActiveTab('quarterly');
    setFullReportSymbol(cleanSymbol);
    try {
      const [qRes, finRes] = await Promise.all([
        fetch(`/api/quarterly-results/${cleanSymbol}`),
        fetch(`/api/company-financials/${cleanSymbol}`)
      ]);
      const qData = qRes.ok ? await qRes.json() : {};
      const finData = finRes.ok ? await finRes.json() : {};
      setFullReportData({
        quarterly: qData.results || [],
        annualFinancials: finData.annualFinancials || null,
        keyMetrics: finData.keyMetrics || null,
      });
    } catch (e) {
      console.error('Full report fetch error:', e);
    } finally {
      setFullReportLoading(false);
    }
  };

  const getWatchlistNewsRelativeTime = (publishedAt: string) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now.getTime() - published.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };


  // Notes state for journal tab
  const [notesContent, setNotesContent] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tradingNotes") || "";
    }
    return "";
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotesContent, setTempNotesContent] = useState(notesContent);

  // Trading tags state
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tradingTags");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Daily life factors state - affects trading performance
  const [selectedDailyFactors, setSelectedDailyFactors] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tradingDailyFactors");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [isDailyFactorsDropdownOpen, setIsDailyFactorsDropdownOpen] = useState(false);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  const [isNotesInNewsMode, setIsNotesInNewsMode] = useState(false);
  const [journalDateNews, setJournalDateNews] = useState<Array<{title: string; url: string; source: string; publishedAt: string}>>([]);
  const [isJournalDateNewsLoading, setIsJournalDateNewsLoading] = useState(false);

  // When news mode is toggled on, load Nifty50 news for "last 7 days" fallback
  useEffect(() => {
    if (isNotesInNewsMode && nifty50NewsItems.length === 0) {
      fetchNifty50News();
    }
  }, [isNotesInNewsMode]);

  // When a date is selected and news mode is open, fetch Google News for that date range
  useEffect(() => {
    if (!isNotesInNewsMode) return;
    if (!selectedDate) { setJournalDateNews([]); return; }
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth()+1)}-${pad(selectedDate.getDate())}`;
    let cancelled = false;
    setIsJournalDateNewsLoading(true);
    setJournalDateNews([]);
    fetch(`/api/journal-date-news?date=${dateStr}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setJournalDateNews(data.articles || []); })
      .catch(() => { if (!cancelled) setJournalDateNews([]); })
      .finally(() => { if (!cancelled) setIsJournalDateNewsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate, isNotesInNewsMode]);


  // Indicators state for tracking mistakes with indicators and timeframes
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tradingIndicators");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [indicatorTimeframe, setIndicatorTimeframe] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("indicatorTimeframe") || "5min";
    }
    return "5min";
  });
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false);
  const [targetPeriod, setTargetPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [targetAmount, setTargetAmount] = useState(20000);
  const [riskCapital, setRiskCapital] = useState<number>(() => {
    const saved = localStorage.getItem('riskCapital');
    return saved ? parseInt(saved) : 10000;
  });
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(() => {
    const saved = localStorage.getItem('riskRewardRatio');
    return saved ? parseFloat(saved) : 2;
  });
  const [isCustomTimeframeDialogOpen, setIsCustomTimeframeDialogOpen] = useState(false);
  const [customTimeframeInput, setCustomTimeframeInput] = useState("");

  // Trade book window states
  const [showTradingNotesWindow, setShowTradingNotesWindow] = useState(false);
  const [showPerformanceWindow, setShowPerformanceWindow] = useState(false);
  const [showMultipleImageUpload, setShowMultipleImageUpload] = useState(false);

  // Calendar state for PROFIT CONSISTENCY
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("calendarData");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  // Tag highlighting state for curved line visualization
  const [activeTagHighlight, setActiveTagHighlight] = useState<{
    tag: string;
    dates: string[];
  } | null>(null);

  // Stats customization state for purple panel
  const [visibleStats, setVisibleStats] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return {
      pnl: true,
      trend: true,
      fomo: true,
      winRate: true,
      streak: !isMobile,   // desktop: on by default; mobile: off (5-slot limit)
      overtrading: true,
      topTags: false,
      aiAnalysis: false,
      planned: false,
    };
  });

  // Load Magic Bar preferences from localStorage on mount (enforce device limits)
  useEffect(() => {
    const saved = localStorage.getItem("magicBarPrefs");
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        const isMobile = window.innerWidth < 768;
        const limit = isMobile ? 5 : 6;
        const activeKeys = Object.keys(prefs).filter((k) => prefs[k]);
        if (activeKeys.length > limit) {
          // Trim extras: keep first `limit` active keys, disable the rest
          const trimmed = { ...prefs };
          let kept = 0;
          const order = ['pnl', 'trend', 'fomo', 'winRate', 'overtrading', 'planned', 'streak', 'topTags', 'aiAnalysis'];
          order.forEach((k) => {
            if (prefs[k]) {
              if (kept < limit) { trimmed[k] = true; kept++; }
              else { trimmed[k] = false; }
            }
          });
          setVisibleStats(trimmed);
        } else {
          setVisibleStats(prefs);
        }
      } catch (e) {
        console.log("Could not load Magic Bar preferences");
      }
    }
  }, []);

  // Refs for curved line connections from tag block to heatmap dates
  const fomoButtonRef = useRef<HTMLButtonElement>(null);
  const overtradingButtonRef = useRef<HTMLButtonElement>(null);
  const plannedButtonRef = useRef<HTMLButtonElement>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);

  // Refs for share dialog curved line connections
  const shareDialogFomoButtonRef = useRef<HTMLButtonElement>(null);
  const shareDialogHeatmapContainerRef = useRef<HTMLDivElement>(null);

  // State to trigger re-render of curved lines during scroll
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [shareDialogScrollTrigger, setShareDialogScrollTrigger] = useState(0);

  // Effect to handle scroll updates for curved lines - ULTRA FAST VERSION
  useEffect(() => {
    if (!activeTagHighlight || (activeTagHighlight.tag !== 'fomo' && activeTagHighlight.tag !== 'overtrading' && activeTagHighlight.tag !== 'planned')) return;

    const heatmapWrapper = heatmapContainerRef.current;
    if (!heatmapWrapper) return;

    // Find the actual scrollable element inside the heatmap component immediately
    const scrollableElement = heatmapWrapper.querySelector('.overflow-x-auto');
    if (!scrollableElement) {
      // Retry after a tiny delay if not found
      const retryTimeout = setTimeout(() => {
        const element = heatmapWrapper.querySelector('.overflow-x-auto');
        if (element) {
          attachScrollListener(element);
        }
      }, 10);

      return () => clearTimeout(retryTimeout);
    }

    let rafId: number | null = null;

    const handleScroll = () => {
      // Immediate update for instant response
      setScrollTrigger(prev => prev + 1);

      // Cancel any pending RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Also schedule RAF for next frame to ensure smooth rendering
      rafId = requestAnimationFrame(() => {
        setScrollTrigger(prev => prev + 1);
        rafId = null;
      });
    };

    const attachScrollListener = (element: Element) => {
      // Listen to scroll events with passive for best performance
      element.addEventListener('scroll', handleScroll, { passive: true });

      // Also listen for resize events
      window.addEventListener('resize', handleScroll, { passive: true });

      console.log('⚡ Attached ULTRA-FAST scroll listener to heatmap');
    };

    // Attach immediately
    attachScrollListener(scrollableElement);

    // Cleanup
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [activeTagHighlight]);

  // ✅ SEPARATE STATE FOR SHARE DIALOG: Prevents interference with main tradebook (moved before useEffect)
  const [shareDialogTagHighlight, setShareDialogTagHighlight] = useState<{
    tag: string;
    dates: string[];
  } | null>(null);

  // Effect to handle scroll updates for share dialog curved lines
  useEffect(() => {
    if (!shareDialogTagHighlight || shareDialogTagHighlight.tag !== 'fomo') return;

    const heatmapWrapper = shareDialogHeatmapContainerRef.current;
    if (!heatmapWrapper) return;

    // Find the scrollable element (parent with overflow-auto class)
    const scrollableElement = heatmapWrapper;
    if (!scrollableElement) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      // Immediate update for instant response
      setShareDialogScrollTrigger(prev => prev + 1);

      // Cancel any pending RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Also schedule RAF for next frame
      rafId = requestAnimationFrame(() => {
        setShareDialogScrollTrigger(prev => prev + 1);
        rafId = null;
      });
    };

    // Attach scroll listener
    scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    console.log('⚡ Attached scroll listener to share dialog heatmap');

    // Cleanup
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [shareDialogTagHighlight]);



  // State for post-to-NeoFeed feature in Trading Report
  const [showReportPostPickerPopover, setShowReportPostPickerPopover] = useState(false);
  const [showReportPostDialog, setShowReportPostDialog] = useState(false);
  const [reportPostMode, setReportPostMode] = useState<'today' | 'selected' | 'range' | null>(null);
  const [reportPostDescription, setReportPostDescription] = useState('');
  const [reportPostSelectedDate, setReportPostSelectedDate] = useState<string>('');
  const [isPostingReport, setIsPostingReport] = useState(false);

  // Override data for range post when triggered from Personal Heatmap
  const [rangePostOverrideData, setRangePostOverrideData] = useState<Record<string, any> | null>(null);

  // Date range selection state
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [isCalendarDataFetched, setIsCalendarDataFetched] = useState(false);

  // ✅ NEW: Heatmap data and date range state for Performance Trend filtering
  const [heatmapDataFromComponent, setHeatmapDataFromComponent] = useState<Record<string, any>>({});
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [perfTrendTab, setPerfTrendTab] = useState<string>('1Y');

  // Track if user has manually toggled the switch (to prevent auto-switching after manual toggle)
  const [hasManuallyToggledMode, setHasManuallyToggledMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hasManuallyToggledMode");
      return stored === "true";
    }
    return false;
  });

  // ✅ NEW: Callbacks to receive heatmap data and date range
  // ✅ FIXED: Now updates the correct state (demo OR personal) based on isDemoMode
  const handleHeatmapDataUpdate = (data: Record<string, any>) => {
    const modeLabel = heatmapMode === 0 ? 'DEMO' : heatmapMode === 1 ? 'PERSONAL-1' : 'PERSONAL-2';
    console.log(`📊 Received heatmap data update: ${Object.keys(data).length} dates [Mode: ${modeLabel}]`);

    // ✅ CRITICAL FIX: Update the correct state based on current mode
    if (heatmapMode === 0) {
      console.log("📊 Updating DEMO heatmap state");
      setDemoTradingDataByDate(data);
    } else if (heatmapMode === 1) {
      console.log("👤 Updating PERSONAL-1 heatmap state");
      setPersonalTradingDataByDate(data);
    } else {
      console.log("👤 Updating PERSONAL-2 heatmap state");
      setPersonal2TradingDataByDate(data);
    }

    // Also update the legacy shared state for backward compatibility
    setHeatmapDataFromComponent(data);

    // ✅ AUTO-SWITCH TO DEMO MODE: Only for new users on initial load (not after manual toggle)
    if (!isDemoMode && getUserId() && !hasManuallyToggledMode) {
      const hasAnyTradeData = Object.values(data).some((dayData: any) => {
        // Check both wrapped (AWS) and unwrapped formats
        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
        const tradeHistory = dayData?.tradingData?.tradeHistory || dayData?.tradeHistory;

        // Has data if:
        // 1. Has performance metrics with non-zero P&L, OR
        // 2. Has non-empty trade history
        return (
          (metrics && metrics.netPnL !== undefined && metrics.netPnL !== 0) ||
          (Array.isArray(tradeHistory) && tradeHistory.length > 0)
        );
      });

      if (!hasAnyTradeData && Object.keys(data).length === 0) {
        console.log("📭 No personal trades found - auto-switching to Demo mode");
        setIsDemoMode(true);
        localStorage.setItem("tradingJournalDemoMode", "true");
        // Don't set hasManuallyToggledMode here - this is automatic, not manual

        // Scroll to latest data after a brief delay to ensure heatmap is rendered
        setTimeout(() => {
          if (heatmapContainerRef.current) {
            const scrollContainer = heatmapContainerRef.current.querySelector('[style*="overflow"]') as HTMLElement;
            if (scrollContainer) {
              // Scroll to the rightmost position (latest date)
              scrollContainer.scrollLeft = scrollContainer.scrollWidth;
              console.log("🎯 Scrolled to latest data view");
            }
          }
        }, 500);
      } else if (!hasAnyTradeData) {
        console.log("⚠️ Personal data exists but has no actual trade data (all zero P&L)");
      }
    }
  };

  const handleDateRangeChange = (range: { from: Date; to: Date } | null) => {
    console.log("📅 Date range changed:", range);
    setSelectedDateRange(range);
  };

  // ✅ NEW: Filter heatmap data based on selected date range
  // ✅ FIXED: Now uses tradingDataByDate (mode-aware) instead of shared heatmapDataFromComponent
  const getFilteredHeatmapData = () => {
    // ✅ CRITICAL FIX: Use tradingDataByDate which correctly switches between demo and personal data
    const modeAwareData = tradingDataByDate;
    const totalDates = Object.keys(modeAwareData).length;

    if (!selectedDateRange) {
      // No range selected - return all data
      // No range selected - return all data with actual trades
      const unrangedData = Object.fromEntries(
        Object.entries(modeAwareData).filter(([_, dayData]) => {
          const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
          return (metrics?.totalTrades || 0) > 0;
        })
      );
      const actualDates = Object.keys(unrangedData).length;
      return unrangedData;
    }

    const filtered: Record<string, any> = {};
    const fromTime = selectedDateRange.from.getTime();
    const toTime = selectedDateRange.to.getTime();

    console.log(`🔍 Filtering ${totalDates} dates by range: ${selectedDateRange.from.toISOString().slice(0, 10)} to ${selectedDateRange.to.toISOString().slice(0, 10)} [Mode: ${isDemoMode ? 'DEMO' : 'PERSONAL'}]`);

    Object.keys(modeAwareData).forEach(dateKey => {
      // Parse date key (expecting YYYY-MM-DD format)
      const dateTime = new Date(dateKey).getTime();

      if (isNaN(dateTime)) {
        console.warn(`⚠️ Could not parse date key: ${dateKey}, skipping`);
        return;
      }

      if (dateTime >= fromTime && dateTime <= toTime) {
        const dayData = modeAwareData[dateKey];
        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
        if ((metrics?.totalTrades || 0) > 0) {
          filtered[dateKey] = dayData;
        }
      }
    });

    const filteredCount = Object.keys(filtered).length;
    console.log(`🔍 Filtered heatmap data: ${filteredCount} dates (from ${totalDates} total) [Mode: ${isDemoMode ? 'DEMO' : 'PERSONAL'}]`);

    if (filteredCount === 0 && totalDates > 0) {
      console.warn(`⚠️ WARNING: Filtering dropped all ${totalDates} entries! Check date key format compatibility.`);
      console.log('Sample keys:', Object.keys(modeAwareData).slice(0, 5));
    }

    return filtered;
  };

  // Auto-set calendar data fetched when both dates are selected
  useEffect(() => {
    if (fromDate && toDate) {
      setIsCalendarDataFetched(true);
    } else {
      setIsCalendarDataFetched(false);
    }
  }, [fromDate, toDate]);

  // Auto-click all personal dates for current year or date range
  const [isAutoClickingPersonal, setIsAutoClickingPersonal] = useState(false);

  const handleAutoClickPersonalDates = async () => {
    if (isDemoMode) {
      console.log("⚠️ Auto-click only works in Personal mode");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      console.log("⚠️ No user ID found - cannot auto-click personal dates");
      alert("⚠️ Please log in with your AWS account to use personal mode");
      return;
    }

    setIsAutoClickingPersonal(true);

    try {
      console.log(`🔄 Auto-clicking personal dates for year ${heatmapYear}${fromDate && toDate ? ` (range: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()})` : ''}...`);

      // Fetch all personal data first
      const response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/all`));

      if (!response.ok) {
        throw new Error('Failed to fetch personal data');
      }

      const allPersonalData = await response.json();
      let datesToFetch: string[] = Object.keys(allPersonalData);

      // Filter by year and date range
      if (fromDate && toDate) {
        // If date range is selected, only fetch dates within range
        const fromTime = fromDate.getTime();
        const toTime = toDate.getTime();

        datesToFetch = datesToFetch.filter(dateStr => {
          const dateTime = new Date(dateStr).getTime();
          return dateTime >= fromTime && dateTime <= toTime;
        });

        console.log(`📅 Filtered to ${datesToFetch.length} dates within selected range`);
      } else {
        // If no range selected, filter by current heatmap year
        datesToFetch = datesToFetch.filter(dateStr => {
          const date = new Date(dateStr);
          return date.getFullYear() === heatmapYear;
        });

        console.log(`📅 Filtered to ${datesToFetch.length} dates for year ${heatmapYear}`);
      }

      if (datesToFetch.length === 0) {
        console.log("ℹ️ No personal dates found for the selected period");
        return;
      }

      // Create all fetch promises in parallel for maximum speed
      const fetchPromises = datesToFetch.map(async (dateStr) => {
        try {
          const response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/${dateStr}`));
          if (response.ok) {
            let journalData = await response.json();

            // CRITICAL FIX: Unwrap AWS response format (has tradingData wrapper)
            if (journalData && journalData.tradingData) {
              journalData = journalData.tradingData;
              console.log(`📦 Unwrapped AWS tradingData for ${dateStr}`);
            }

            if (journalData && Object.keys(journalData).length > 0) {
              return { dateStr, journalData };
            }
          }
        } catch (error) {
          console.error(`❌ Error loading personal date ${dateStr}:`, error);
        }
        return null;
      });

      // Wait for all fetches to complete in parallel
      const results = await Promise.all(fetchPromises);

      // Update state with all loaded data
      const validResults = results.filter((r) => r !== null);
      if (validResults.length > 0) {
        const updatedData = { ...personalTradingDataByDate };
        validResults.forEach((result: any) => {
          if (result) {
            updatedData[result.dateStr] = result.journalData;
          }
        });
        setPersonalTradingDataByDate(updatedData);
        setCalendarData(updatedData); // CRITICAL: Update calendarData to show heatmap colors!
        localStorage.setItem("personalTradingDataByDate", JSON.stringify(updatedData));
        console.log(`✅ Auto-click completed! Loaded ${validResults.length} personal dates for heatmap colors. March 3,4,5 should now show colors!`);
      }
    } catch (error) {
      console.error("❌ Error during auto-click:", error);
      // Don't show error popup for new users - they will see demo heatmap instead
      console.log("ℹ️ No personal data found - user will see demo heatmap");
    } finally {
      setIsAutoClickingPersonal(false);
    }
  };

  // Year navigation handlers - auto-click when year changes
  const handlePreviousYear = () => {
    const newYear = heatmapYear - 1;
    setHeatmapYear(newYear);
    // Auto-click dates for new year if in personal mode
    if (!isDemoMode) {
      setTimeout(() => {
        handleAutoClickPersonalDates();
      }, 100);
    }
  };

  const handleNextYear = () => {
    const newYear = heatmapYear + 1;
    setHeatmapYear(newYear);
    // Auto-click dates for new year if in personal mode
    if (!isDemoMode) {
      setTimeout(() => {
        handleAutoClickPersonalDates();
      }, 100);
    }
  };

  // Reset date range handler
  const handleResetDateRange = () => {
    setFromDate(null);
    setToDate(null);
    setIsCalendarDataFetched(false);
  };

  // ✅ AUTO-OPEN JOURNAL INFO MODAL: Show modal when journal tab opens
  useEffect(() => {
    if (activeTab === "journal") {
      setShowJournalInfoModal("auto");
    }
  }, [activeTab]);

  // ✅ INSTANT AUTO-LOAD: Load heatmap data immediately when journal tab opens
  // No delays, no complex logic - just instant data loading
  useEffect(() => {
    if (activeTab === 'journal' || activeTab === 'trading-home') {
      if (!isDemoMode) {
        // Personal mode - load personal data instantly
        const userId = getUserId();
        if (userId) {
          console.log(`👤 Personal mode - loading personal data instantly...`);
          handleAutoClickPersonalDates();
        } else if (!hasManuallyToggledMode) {
          // Only auto-switch if user hasn't manually chosen personal mode
          console.log(`⚠️ No userId found - auto-switching to Demo mode`);
          setIsDemoMode(true);
          localStorage.setItem("tradingJournalDemoMode", "true");
        } else {
          console.log(`ℹ️ No userId but user manually selected personal mode - respecting choice`);
        }
      } else {
        // ✅ SIMPLIFIED: Load demo data directly from AWS - NO localStorage!
        console.log(`📊 Demo mode - loading from AWS DynamoDB journal-database...`);
        let demoCancelled = false;
        (async () => {
          try {
            const response = await fetch(getFullApiUrl('/api/journal/all-dates'));
            if (!demoCancelled && response.ok) {
              const awsData = await response.json(); // AWS DynamoDB data
              if (!demoCancelled) {
                const dateCount = Object.keys(awsData).length;
                setDemoTradingDataByDate(awsData);
                setCalendarData(awsData);
                console.log(`✅ Loaded ${dateCount} real dates from AWS`);
              }
            }
          } catch (error) {
            if (!demoCancelled) console.error("❌ Error loading from AWS:", error);
          }
        })();
        return () => { demoCancelled = true; };
      }
    }
  }, [isDemoMode, activeTab, heatmapYear]);

  // Calendar handler functions
  const formatDateKey = (date: Date) => {
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // YYYY-MM-DD format
  };

  const saveCalendarData = (data: any) => {
    setCalendarData(data);
    localStorage.setItem("calendarData", JSON.stringify(data));
  };

  // Helper function to extract unique raw trade symbols from tradeHistory for Next-button cycling.
  // Returns the raw symbol (first occurrence per unique underlying) so fetchHeatmapChartData can
  // resolve any instrument type: index, equity, commodity, options, futures.
  const extractTradedSymbols = (tradeHistory: any[]): string[] => {
    if (!Array.isArray(tradeHistory)) return [];

    const NIFTY_ALIAS: Record<string, string> = { 'NIFTY': 'NIFTY50' };
    const MCX_MINI: Record<string, string> = { 'CRUDEOILM': 'CRUDEOIL', 'GOLDM': 'GOLD', 'SILVERM': 'SILVER' };

    // Map from normalised underlying → first raw symbol seen for that underlying
    const underlyingToRaw = new Map<string, string>();

    tradeHistory.forEach((trade: any) => {
      const rawSymbol = (trade.symbol || trade.tradingSymbol || '').trim();
      if (!rawSymbol) return;

      // Strip exchange prefix, then derive underlying
      const noPrefix = rawSymbol.replace(/^(NSE|BSE|MCX|NFO|BFO|NCDEX):/, '');
      let underlying = (noPrefix.split(' ')[0])
        .replace(/-EQ$/i, '')
        .replace(/-INDEX$/i, '')
        .replace(/\d{2}[A-Z]{3}\d{2}FUT$/i, '') // DDMONYYFUT  e.g. 18DEC25FUT
        .replace(/\d{2}[A-Z]{3}FUT$/i, '')        // YYMONFUT    e.g. 25JUNFUT
        .replace(/\d{2}[A-Z]{3}\d{2}(CE|PE)$/i, '') // options    e.g. 25000CE
        .toUpperCase();

      if (!underlying) return;

      // Normalise well-known aliases
      underlying = NIFTY_ALIAS[underlying] || underlying;
      underlying = MCX_MINI[underlying] || underlying;

      // Keep the FIRST raw symbol encountered for each unique underlying
      if (!underlyingToRaw.has(underlying)) {
        underlyingToRaw.set(underlying, rawSymbol);
        console.log(`📊 Mapped underlying "${underlying}" → raw symbol "${rawSymbol}"`);
      }
    });

    const result = Array.from(underlyingToRaw.values());
    console.log(`📊 Final extracted traded symbols (raw):`, result);
    return result;
  };

  const handleDateSelect = async (date: Date, awsData?: any) => {
    // 📅 User selected date from heatmap
    const dateString = formatDateKey(date);
    console.log(`📅 DATE SELECTED: ${dateString}`);

    // ✅ DESTROY CHART IMMEDIATELY - Don't wait for useEffect
    if (journalChartRef.current) {
      try {
        journalChartRef.current.remove();
        console.log(`✅ Chart destroyed in handleDateSelect`);
      } catch (e) {}
      journalChartRef.current = null;
      journalCandlestickSeriesRef.current = null;
      journalEma12SeriesRef.current = null;
      journalEma26SeriesRef.current = null;
    }

    // Clear all data immediately - HEATMAP ONLY (manual search chart unaffected)
    setSelectedDate(date);
    setJournalChartData([]); // Clear manual search chart
    setLiveOhlc(null);
    setNotesContent("");
    setTempNotesContent("");
    setSelectedTags([]);
    setSelectedDailyFactors([]);
    setSelectedIndicators([]);
    if (heatmapMode === 2) {
      setTradeHistoryData2([]);
      setTradeHistoryWindow(2);
    } else {
      setTradeHistoryData([]);
    }
    setTradingImages([]);
    setTradedSymbols([]);
    setCurrentSymbolIndex(0);
    setIsLoadingHeatmapData(true); // Show loading state

    const dateKey = formatDateKey(date);

    // If awsData is provided (from PersonalHeatmap), use it directly - NO API FETCH
    // Also check tradingDataByDate cache (loaded at startup) so we skip the API call for known dates
    const cachedData = awsData !== undefined ? awsData : tradingDataByDate[dateKey];
    if (cachedData !== undefined) {
      console.log(`✅ Using cached data for ${dateKey} (no API fetch needed):`, cachedData);
      awsData = cachedData;
    }

    if (awsData !== undefined) {
      console.log(`✅ Using FRESH AWS data from PersonalHeatmap for ${dateKey}:`, awsData);
      let journalData = awsData;

      // Handle AWS response format (has tradingData wrapper)
      if (journalData && journalData.tradingData) {
        journalData = journalData.tradingData;
        console.log(`📦 Unwrapped AWS tradingData:`, journalData);
      }

      if (journalData && Object.keys(journalData).length > 0) {
        console.log("🎯 Populating UI with FRESH AWS data:", journalData);

        // Load the data into correct state variables
        const notes = journalData.notes || journalData.tradingNotes || journalData.notesContent || "";
        if (notes) {
          setNotesContent(notes);
          setTempNotesContent(notes);
          console.log("📝 Loaded notes from AWS:", notes);
        }

        const tags = journalData.tags || journalData.tradingTags || journalData.selectedTags || [];
        if (Array.isArray(tags)) {
          setSelectedTags(tags);
        }

        const dailyFactors = journalData.dailyFactors || journalData.selectedDailyFactors || [];
        if (Array.isArray(dailyFactors)) {
          setSelectedDailyFactors(dailyFactors);
          console.log("🌅 Loaded daily factors from AWS:", dailyFactors);
        }

        const indicators = journalData.indicators || journalData.selectedIndicators || [];
        if (Array.isArray(indicators)) {
          setSelectedIndicators(indicators);
          console.log("📊 Loaded indicators from AWS:", indicators);
          console.log("🏷️ Loaded tags from AWS:", tags);
        }

        if (journalData.tradeHistory && Array.isArray(journalData.tradeHistory)) {
          heatmapMode === 2 ? setTradeHistoryData2(journalData.tradeHistory) : setTradeHistoryData(journalData.tradeHistory);
          console.log("📊 Loaded trade history from AWS:", journalData.tradeHistory.length, "trades");

          // Extract index symbols for the symbol cycler (NIFTY50, BANKNIFTY, etc.)
          const symbols = extractTradedSymbols(journalData.tradeHistory);
          if (symbols.length > 0) {
            setTradedSymbols(symbols);
            setCurrentSymbolIndex(0);
            console.log(`📊 Extracted traded symbols:`, symbols);
          }

          // Use the raw symbol from the first trade for the chart — smart resolution handles EQ/FUT/MCX
          const rawFirstSymbol = journalData.tradeHistory[0]?.symbol || journalData.tradeHistory[0]?.tradingSymbol || '';
          if (rawFirstSymbol) {
            setHeatmapSelectedDate(dateString);
            console.log(`🗓️ [TRADE BOOK SELECT] Fetching chart for raw symbol: ${rawFirstSymbol} on ${dateString}`);
            // ✅ FETCH CHART DATA: Smart resolution handles EQ, FUT, CE/PE, MCX, INDEX
            fetchHeatmapChartData(rawFirstSymbol, dateString);
          }
        }

        const images = journalData.images || journalData.tradingImages || [];
        if (Array.isArray(images)) {
          setTradingImages(images);
          console.log("🖼️ Loaded images from AWS:", images.length, "images");
        }

        console.log("✅ Successfully loaded all FRESH AWS data for:", dateKey);
      } else {
        console.log(`📭 No AWS data for: ${dateKey}`);
      }
      setIsLoadingHeatmapData(false);
      return; // Exit early - we used fresh AWS data
    }

    // Load journal data from API
    try {
      let response;
      const userId = getUserId();

      if (userId) {
        // Load user-specific data
        response = await fetch(getFullApiUrl(`/api/user-journal/${userId}/${dateKey}`));
      } else {
        // Load shared demo data
        response = await fetch(getFullApiUrl(`/api/journal/${dateKey}`));
      }
      console.log(`📡 Load response status: ${response.status}`, response);

      if (response.ok) {
        let journalData = await response.json();
        console.log(`📊 Journal data received:`, journalData);

        // Handle AWS response format (has tradingData wrapper)
        if (journalData && journalData.tradingData) {
          journalData = journalData.tradingData;
          console.log(`📦 Unwrapped AWS tradingData:`, journalData);
        }

        // FALLBACK: If user data is empty and we have a userId, try loading shared demo data
        if ((!journalData || Object.keys(journalData).length === 0) && userId) {
          console.log(`📭 User journal empty for ${dateKey}, falling back to shared demo data`);
          const demoResponse = await fetch(getFullApiUrl(`/api/journal/${dateKey}`));
          if (demoResponse.ok) {
            journalData = await demoResponse.json();
            console.log(`✅ Loaded from shared demo endpoint:`, journalData);
          }
        }

        if (journalData && Object.keys(journalData).length > 0) {
          console.log(
            "🎯 Found journal data from Google Cloud journal-database, populating UI:",
            journalData,
          );

          // Data already cleared at start of handleDateSelect for instant feedback
          // Now just populate with new data

          // Load the data into correct state variables (with field name flexibility)
          const notes =
            journalData.notes ||
            journalData.tradingNotes ||
            journalData.notesContent ||
            "";
          if (notes) {
            setNotesContent(notes);
            setTempNotesContent(notes);
            console.log("📝 Loaded notes from journal-database:", notes);
          }

          const tags =
            journalData.tags ||
            journalData.tradingTags ||
            journalData.selectedTags ||
            [];
          if (Array.isArray(tags)) {
            setSelectedTags(tags);
        }

        const dailyFactors = journalData.dailyFactors || journalData.selectedDailyFactors || [];
        if (Array.isArray(dailyFactors)) {
          setSelectedDailyFactors(dailyFactors);
          console.log("🌅 Loaded daily factors from AWS:", dailyFactors);
        }

        const indicators = journalData.indicators || journalData.selectedIndicators || [];
        if (Array.isArray(indicators)) {
          setSelectedIndicators(indicators);
          console.log("📊 Loaded indicators from AWS:", indicators);
            console.log("🏷️ Loaded tags from journal-database:", tags);
          }

          // ✅ ONLY USE REAL DYNAMODB TRADE HISTORY - NO HARDCODED/CONSTRUCTED DATA
          if (
            journalData.tradeHistory &&
            Array.isArray(journalData.tradeHistory) &&
            journalData.tradeHistory.length > 0
          ) {
            heatmapMode === 2 ? setTradeHistoryData2(journalData.tradeHistory) : setTradeHistoryData(journalData.tradeHistory);
            console.log(
              "✅ Loaded REAL trade history from AWS:",
              journalData.tradeHistory.length,
              "trades",
            );
            console.log("📊 Trade data source: DYNAMODB (no hardcoded data)");

            // Extract index symbols for the symbol cycler (NIFTY50, BANKNIFTY, etc.)
            const symbols = extractTradedSymbols(journalData.tradeHistory);
            if (symbols.length > 0) {
              setTradedSymbols(symbols);
              setCurrentSymbolIndex(0);
              console.log(`📊 Extracted traded symbols:`, symbols);
            }

            // Use the raw symbol from the first trade for the chart — smart resolution handles EQ/FUT/MCX
            const rawFirstSymbol = journalData.tradeHistory[0]?.symbol || journalData.tradeHistory[0]?.tradingSymbol || '';
            if (rawFirstSymbol) {
              setHeatmapSelectedDate(dateString);
              console.log(`🗓️ [TRADE BOOK SELECT] Fetching chart for raw symbol: ${rawFirstSymbol} on ${dateString}`);
              // ✅ FETCH CHART DATA: Smart resolution handles EQ, FUT, CE/PE, MCX, INDEX
              fetchHeatmapChartData(rawFirstSymbol, dateString);
            }
          } else {
            // No trade history in AWS - keep empty state, DO NOT construct fake data
            heatmapMode === 2 ? setTradeHistoryData2([]) : setTradeHistoryData([]);
            console.log("📭 No trade history in AWS for this date - showing empty state");
          }

          if (journalData.images && Array.isArray(journalData.images)) {
            setTradingImages(journalData.images);
            console.log(
              "🖼️ Loaded images from journal-database:",
              journalData.images.length,
              "images",
            );
          }

          // Show trading data windows automatically
          setShowTradingNotesWindow(true);
          setShowPerformanceWindow(true);
          setShowMultipleImageUpload(true);

          // Update calendar data to ensure heatmap colors update
          const updatedCalendarData = {
            ...calendarData,
            [dateKey]: journalData,
          };
          setCalendarData(updatedCalendarData);

          // CRITICAL: Also update tradingDataByDate for heatmap colors
          // The heatmap reads from tradingDataByDate to calculate colors
          const updatedTradingData = {
            ...tradingDataByDate,
            [dateKey]: journalData,
          };
          setTradingDataByDate(updatedTradingData);

          // Save to localStorage as backup
          localStorage.setItem(
            "tradingDataByDate",
            JSON.stringify(updatedTradingData),
          );
          localStorage.setItem(
            "calendarData",
            JSON.stringify(updatedCalendarData),
          );

          console.log(
            "✅ Successfully loaded and saved all journal data for:",
            dateKey,
          );
        } else {
          console.log("📭 No journal data found for:", dateKey);
          // Data already cleared at start of handleDateSelect for instant feedback
          // Empty state is already showing

          // Still open windows to allow adding new data for this date
          setShowTradingNotesWindow(true);
          setShowPerformanceWindow(true);
          setShowMultipleImageUpload(true);
        }
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Load failed with status ${response.status}:`,
          errorText,
        );
        console.log("⚠️ Keeping existing data visible instead of clearing UI");
        // DON'T clear data on failed load - keep existing UI state visible
      }
    } catch (error) {
      console.error("❌ Error loading journal data:", error);
      console.log("⚠️ Error loading data - UI will remain empty");
    } finally {
      setIsLoadingHeatmapData(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentCalendarDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentCalendarDate(today);
    setSelectedDate(today);
  };

  const getCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Get first day of the week (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();

    // Start from the beginning of the week
    startDate.setDate(1 - firstDayOfWeek);

    // End at the end of the week
    const lastDayOfWeek = lastDay.getDay();
    endDate.setDate(lastDay.getDate() + (6 - lastDayOfWeek));

    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentCalendarDate.getMonth();
  };

  const hasDataForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    // Check both calendarData and tradingDataByDate for comprehensive data detection
    const calData = calendarData[dateKey];
    const tradeData = tradingDataByDate[dateKey];

    return (
      (calData &&
        (calData.tradeHistory ||
          calData.notes ||
          (calData.images && calData.images.length > 0))) ||
      (tradeData &&
        (tradeData.tradeHistory ||
          tradeData.tradingNotes ||
          tradeData.notesContent ||
          (tradeData.images && tradeData.images.length > 0) ||
          (tradeData.performanceMetrics &&
            tradeData.performanceMetrics.totalTrades > 0)))
    );
  };

  const isDateInRange = (date: Date) => {
    if (!fromDate || !toDate) return false;
    const dateTime = date.getTime();
    return dateTime >= fromDate.getTime() && dateTime <= toDate.getTime();
  };

  const getDateRangeData = () => {
    if (!fromDate || !toDate) return {};

    const rangeData: Record<string, any> = {};
    const current = new Date(fromDate);

    while (current <= toDate) {
      const dateKey = formatDateKey(current);
      if (calendarData[dateKey]) {
        rangeData[dateKey] = calendarData[dateKey];
      }
      current.setDate(current.getDate() + 1);
    }

    return rangeData;
  };

  const getDateRangeSummary = () => {
    const rangeData = getDateRangeData();
    const dates = Object.keys(rangeData);

    let totalTrades = 0;
    let datesWithNotes = 0;
    let datesWithImages = 0;
    let totalNetPnL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let datesWithTrades = 0;

    dates.forEach((dateKey) => {
      const data = rangeData[dateKey];
      let hasTradesThisDate = false;

      if (data.tradeHistory && Array.isArray(data.tradeHistory)) {
        totalTrades += data.tradeHistory.length;
        if (data.tradeHistory.length > 0) {
          hasTradesThisDate = true;
        }
      }

      if (data.performanceMetrics) {
        totalNetPnL += data.performanceMetrics.netPnL || 0;
        winningTrades += data.performanceMetrics.winningTrades || 0;
        losingTrades += data.performanceMetrics.losingTrades || 0;
        if (data.performanceMetrics.totalTrades > 0) {
          hasTradesThisDate = true;
        }
      }

      if (hasTradesThisDate) {
        datesWithTrades++;
      }

      if (data.tradingNotes || data.notesContent) datesWithNotes++;
      if (data.images && data.images.length > 0) datesWithImages++;
    });

    const winRate =
      totalTrades > 0
        ? ((winningTrades / (winningTrades + losingTrades)) * 100).toFixed(1)
        : "0.0";

    return {
      totalDates: dates.length,
      totalTrades,
      datesWithNotes,
      datesWithImages,
      datesWithTrades,
      totalNetPnL,
      winningTrades,
      losingTrades,
      winRate,
    };
  };

  // Generate full year date range for heatmap (like GitHub)
  const generateContinuousDateRange = () => {
    const currentYear = new Date().getFullYear();
    const dates = [];

    // Start from January 1st of current year
    const startOfYear = new Date(currentYear, 0, 1);
    // Find the start of the week containing Jan 1st
    const startOfWeek = new Date(startOfYear);
    startOfWeek.setDate(startOfYear.getDate() - startOfYear.getDay());

    // End at December 31st of current year
    const endOfYear = new Date(currentYear, 11, 31);
    // Find the end of the week containing Dec 31st
    const endOfWeek = new Date(endOfYear);
    endOfWeek.setDate(endOfYear.getDate() + (6 - endOfYear.getDay()));

    const currentDate = new Date(startOfWeek);
    while (currentDate <= endOfWeek) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  // Group dates by weeks for proper calendar layout - only actual month dates
  const getHeatmapWeeks = (year = heatmapYear) => {
    const months = [];

    // For demo mode in 2025, start from June (month 5) since demo data starts from June
    // For personal mode or other years, show all 12 months starting from January
    const startMonth = (isDemoMode && year === 2025) ? 5 : 0;
    const endMonth = 12;

    // Generate proper calendar layout for each month
    for (let monthIndex = startMonth; monthIndex < endMonth; monthIndex++) {
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);

      // Only include actual dates of the month, arranged by weeks
      const monthWeeks = [];
      const currentDate = new Date(firstDay);

      // Calculate starting position (day of week for first day)
      const startDayOfWeek = firstDay.getDay();

      let currentWeek = [];

      // Add empty slots for days before the month starts
      for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push(null);
      }

      // Add all actual dates of the month
      while (currentDate.getMonth() === monthIndex) {
        // Create date using explicit components to avoid timezone issues
        const day = currentDate.getDate();
        const dateToAdd = new Date();
        dateToAdd.setFullYear(year, monthIndex, day);
        dateToAdd.setHours(12, 0, 0, 0); // Set to noon to avoid timezone edge cases
        currentWeek.push(dateToAdd);
        currentDate.setDate(currentDate.getDate() + 1);

        // If week is complete (7 days) or month ended, push week and start new one
        if (currentWeek.length === 7) {
          monthWeeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // If there's a partial week remaining, fill it and add it
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        monthWeeks.push(currentWeek);
      }

      months.push({
        month: monthIndex,
        weeks: monthWeeks,
        name: firstDay.toLocaleDateString("en-US", { month: "short" }),
      });
    }

    return months;
  };

  // Get month labels for full year heatmap
  const getHeatmapMonthLabels = (year = heatmapYear) => {
    const months = [];

    // Always show all 12 months of the selected year
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      months.push({
        name: date.toLocaleDateString("en-US", { month: "short" }),
        year: year,
      });
    }

    return months;
  };

  // Color grading function for heatmap based on P&L
  const getHeatmapColor = (netPnL: number) => {
    if (netPnL === 0) return "bg-gray-100 dark:bg-gray-700"; // Neutral for no trades

    const absValue = Math.abs(netPnL);

    if (netPnL > 0) {
      // Green for profits - darker green for higher profits
      if (absValue >= 5000) return "bg-green-800 dark:bg-green-700"; // Very high profit
      if (absValue >= 3000) return "bg-green-700 dark:bg-green-600"; // High profit
      if (absValue >= 1500) return "bg-green-600 dark:bg-green-500"; // Medium profit
      if (absValue >= 500) return "bg-green-500 dark:bg-green-400"; // Low-medium profit
      return "bg-green-300 dark:bg-green-300"; // Small profit
    } else {
      // Red for losses - darker red for higher losses
      if (absValue >= 5000) return "bg-red-800 dark:bg-red-700"; // Very high loss
      if (absValue >= 3000) return "bg-red-700 dark:bg-red-600"; // High loss
      if (absValue >= 1500) return "bg-red-600 dark:bg-red-500"; // Medium loss
      if (absValue >= 500) return "bg-red-500 dark:bg-red-400"; // Low-medium loss
      return "bg-red-300 dark:bg-red-300"; // Small loss
    }
  };

  // Save all trading data for the selected date to Google Cloud journal database
  const saveAllTradingData = async () => {
    console.log("🚀 SAVE BUTTON CLICKED! Current selectedDate:", selectedDate);

    try {
      // Check if a date is selected
      if (!selectedDate) {
        console.log("❌ No date selected for save operation");
        alert("⚠️ Please select a date on the calendar first!");
        return;
      }

      console.log("✅ Date is selected, proceeding with save...");

      // Use formatDateKey for consistency with load function
      const selectedDateStr = formatDateKey(selectedDate);

      // Safe data collection with fallbacks to prevent crashes
      // Mode 2 saves Tab2 trades (tradeHistoryData2); modes 0 and 1 save Tab1 trades
      const rawTradeHistory = heatmapMode === 2 ? tradeHistoryData2 : tradeHistoryData;
      const safeTradeHistory = Array.isArray(rawTradeHistory)
        ? rawTradeHistory
        : [];
      const safeNotesContent =
        typeof notesContent === "string" ? notesContent : "";
      const safeTags = Array.isArray(selectedTags) ? selectedTags : [];
      // Get current images from the image upload component
      const currentImages = imageUploadRef.current?.getCurrentImages() || [];
      const safeImages = Array.isArray(currentImages) ? currentImages : [];
      const safePerformanceMetrics = performanceMetrics || {
        totalTrades: safeTradeHistory.length,
        winningTrades: 0,
        losingTrades: 0,
        totalPnL: 0,
        netPnL: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
      };

      const journalData = {
        tradeHistory: safeTradeHistory,
        tradingNotes: safeNotesContent,
        tradingTags: safeTags,
        images: safeImages,
        performanceMetrics: safePerformanceMetrics,
        timestamp: new Date().toISOString(),
      };
      console.log(`💾 SAVE SUMMARY for ${selectedDateStr}:`);
      console.log(`  📊 Trade History: ${safeTradeHistory.length} trades`);
      console.log(`  📝 Notes: ${safeNotesContent ? safeNotesContent.substring(0, 50) + '...' : 'None'}`);
      console.log(`  🏷️ Tags: ${safeTags.length} tags - ${safeTags.join(', ')}`);
      console.log(`  🖼️ Images: ${safeImages.length} images`);
      console.log(`  💰 Net P&L: ₹${safePerformanceMetrics.netPnL}`);
      console.log(`🔄 Attempting to save data for date: ${selectedDateStr}`, journalData);

      // Choose endpoint based on heatmap mode
      // Mode 0 = Demo (shared), Mode 1 = Personal Heatmap 1 (Tab1), Mode 2 = Personal Heatmap 2 (Tab2)
      let response;
      if (heatmapMode === 0) {
        // Demo mode: Save to shared Google Cloud journal database
        console.log("📊 Saving to demo data (shared)");
        response = await fetch(`/api/journal/${selectedDateStr}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(journalData),
        });
      } else {
        // Personal mode (1 or 2): Save to AWS (user-specific)
        const userId = getUserId();
        if (!userId) {
          console.error("❌ Cannot save in personal mode - no AWS user logged in");
          alert("⚠️ Please log in with your AWS account to save personal trading data.\n\nSwitch to Demo mode or log in to continue.");
          throw new Error("No AWS user logged in - cannot save to personal mode");
        }
        // Mode 2 uses "2_" prefix to create separate DynamoDB key space (user2_{userId}_{date})
        const effectiveUserId = heatmapMode === 2 ? `2_${userId}` : userId;
        const modeLabel = heatmapMode === 2 ? 'Personal-2 (Tab2)' : 'Personal-1 (Tab1)';
        console.log(`👤 Saving to ${modeLabel} data (effectiveUserId: ${effectiveUserId})`);
        response = await fetch(`/api/user-journal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: effectiveUserId,
            date: selectedDateStr,
            tradingData: journalData,
          }),
        });
      }

      console.log(`📡 Save response status: ${response.status}`, response);

      if (response.ok) {
        const responseData = await response.json();
        console.log(`✅ Save response data:`, responseData);

        // Update local state
        const allData = {
          ...tradingDataByDate,
          [selectedDateStr]: journalData,
        };
        setTradingDataByDate(allData);

        // ✅ CRITICAL FIX: Trigger heatmap refresh immediately after save
        // This forces PersonalHeatmap to clear old data and fetch fresh, displaying new colors
        setPersonalHeatmapRevision(prev => prev + 1);

        console.log(
          `✅ All trading data saved successfully for ${selectedDateStr}`,
          journalData,
        );

        // CRITICAL: Reload FULL heatmap data after save to sync everything
        console.log("🔄 Reloading FULL heatmap data to sync all windows...");

        // Reload the full heatmap data based on current mode
        if (heatmapMode === 0) {
          setPersonalHeatmapRevision(prev => prev + 1);
          console.log("📊 Refreshing demo mode heatmap...");
          const allDatesResponse = await fetch("/api/journal/all-dates");
          if (allDatesResponse.ok) {
            const allDatesData = await allDatesResponse.json();
            console.log(`✅ Heatmap refreshed with ${Object.keys(allDatesData).length} dates`);
            setTradingDataByDate(allDatesData);
          }
        } else if (heatmapMode === 1) {
          setPersonalHeatmapRevision(prev => prev + 1);
          const userId = getUserId();
          if (userId) {
            console.log(`👤 Refreshing Personal-1 heatmap for user: ${userId}`);
            const allUserDataResponse = await fetch(`/api/user-journal/${userId}/all`);
            if (allUserDataResponse.ok) {
              const allUserData = await allUserDataResponse.json();
              console.log(`✅ Heatmap refreshed with ${Object.keys(allUserData).length} dates`);
              setTradingDataByDate(allUserData);
            }
          }
        } else {
          setPersonal2HeatmapRevision(prev => prev + 1);
          const userId = getUserId();
          if (userId) {
            const effectiveUserId = `2_${userId}`;
            console.log(`👤 Refreshing Personal-2 heatmap for user: ${effectiveUserId}`);
            const allUserDataResponse = await fetch(`/api/user-journal/${effectiveUserId}/all`);
            if (allUserDataResponse.ok) {
              const allUserData = await allUserDataResponse.json();
              console.log(`✅ Heatmap-2 refreshed with ${Object.keys(allUserData).length} dates`);
              setTradingDataByDate(allUserData);
            }
          }
        }

        // Reload the current date to ensure UI updates
        console.log("🔄 Reloading current date to refresh UI...");
        await handleDateSelect(selectedDate);

        // Show success message
        if (typeof window !== "undefined") {
          const formattedDate = selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          const saveLocation = heatmapMode === 0 ? "Demo" : heatmapMode === 1 ? "Personal-1" : "Personal-2";

          // Deduct journal charges for saved trades (skip if influencer period is active)
          const isInfluencerFree = influencerPeriod?.active && influencerPeriod.expiryDate && new Date(influencerPeriod.expiryDate) > new Date();
          if (safeTradeHistory.length > 0 && !isInfluencerFree) {
            const charge = parseFloat((safeTradeHistory.length * 2 * 1.18).toFixed(2));
            setJournalLastDeducted(charge);
            setJournalFundBase(prev => parseFloat((prev - charge).toFixed(2)));
            // Persist deduction to server
            const userId = currentUser?.userId;
            if (userId) {
              fetch(`/api/journal-wallet/${encodeURIComponent(userId)}/deduct`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: charge, note: `Journal save — ${safeTradeHistory.length} trade(s)` })
              }).then(r => r.json()).then(data => {
                if (data.success && data.wallet) {
                  setJournalFundBase(data.wallet.balance);
                }
              }).catch(err => console.warn('⚠️ Wallet deduct API failed:', err));
            }
          }

          setSaveConfirmationData({
            formattedDate,
            saveLocation,
            trades: safeTradeHistory.length,
            notes: safeNotesContent ? "✓" : "✗",
            tags: safeTags.length > 0 ? safeTags.join(', ') : "None",
            images: safeImages.length,
            netPnL: safePerformanceMetrics.netPnL.toLocaleString("en-IN")
          });
          setShowSaveConfirmation(true);
        }
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Save failed with status ${response.status}:`,
          errorText,
        );
        throw new Error(
          `Failed to save to Google Cloud: ${response.status} ${errorText}`,
        );
      }
    } catch (error) {
      console.error("❌ Error saving to Google Cloud journal database:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setSaveConfirmationData({
        error: true,
        errorMessage
      });
      setShowSaveConfirmation(true);
    }
  };

  // Calculate performance metrics from actual trade history data
  const performanceMetrics = useMemo(() => {
    if (!tradeHistoryData || tradeHistoryData.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        totalLoss: 0,
        netPnL: 0,
        winRate: "0.0",
      };
    }

    // Parse P&L values from trade history data
    const tradesPnL = tradeHistoryData.map((trade) => {
      // Parse P&L string (e.g., "+₹2850", "-₹1200", "₹0") to number
      const pnlStr = (trade.pnl || "").replace(/[₹,+\s]/g, ""); // Remove ₹, commas, + and spaces
      const pnlValue = parseFloat(pnlStr) || 0;
      return pnlValue;
    });

    const totalTrades = tradesPnL.length;
    const winningTrades = tradesPnL.filter((pnl) => pnl > 0).length;
    const losingTrades = tradesPnL.filter((pnl) => pnl < 0).length;
    const totalProfit = tradesPnL
      .filter((pnl) => pnl > 0)
      .reduce((sum, pnl) => sum + pnl, 0);
    const totalLoss = Math.abs(
      tradesPnL.filter((pnl) => pnl < 0).reduce((sum, pnl) => sum + pnl, 0),
    );
    const netPnL = tradesPnL.reduce((sum, pnl) => sum + pnl, 0);
    const closedTrades = winningTrades + losingTrades;
    const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

    // Calculate Max % and Min % with durations
    let maxPnLPercent = 0;
    let minPnLPercent = 0;
    let maxPnLDuration = "-";
    let minPnLDuration = "-";

    tradeHistoryData.forEach((trade) => {
      const pnlStr = (trade.pnl || "").replace(/[₹,+\s]/g, "");
      const pnlValue = parseFloat(pnlStr) || 0;
      const price = parseFloat(trade.price) || 0;
      const qty = parseInt(trade.qty) || 0;
      const margin = price * qty;

      if (margin > 0) {
        const percent = (pnlValue / margin) * 100;
        if (percent > maxPnLPercent) {
          maxPnLPercent = percent;
          maxPnLDuration = trade.duration || "-";
        }
        if (percent < minPnLPercent) {
          minPnLPercent = percent;
          minPnLDuration = trade.duration || "-";
        }
      }
    });

    // Calculate Margin Capital and P&L %
    // Margin is calculated as (Price * Qty) for each trade. 
    // For simplicity, we'll sum the absolute value of investment per trade to find "Total Capital Used"
    const totalMarginUsed = tradeHistoryData.reduce((sum, trade) => {
      const price = parseFloat(trade.price) || 0;
      const qty = parseInt(trade.qty) || 0;
      return sum + (price * qty);
    }, 0);

    const pnlPercentage = tradeHistoryData.length > 0 ? (netPnL / (totalMarginUsed / tradeHistoryData.length)) * 100 : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      totalProfit,
      totalLoss,
      netPnL,
      winRate: winRate.toFixed(1),
      totalMarginUsed,
      pnlPercentage: pnlPercentage.toFixed(2),
      maxPnLPercent: maxPnLPercent.toFixed(2),
      minPnLPercent: minPnLPercent.toFixed(2),
      maxPnLDuration,
      minPnLDuration,
    };
  }, [tradeHistoryData]);

  // Helper function to parse time string into Date object reliably
  const parseTradeTime = (timeStr: string): Date => {
    if (!timeStr) return new Date(0);
    
    // If it is already a full date string or ISO format
    if (timeStr.includes("-") || timeStr.includes("T")) {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) return d;
    }

    // Handle formats like "11:11:38 AM" or "12:08:33 PM" or "11:11:38"
    const timeMatch = timeStr.match(/(\d+):(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = parseInt(timeMatch[3]);
      const ampm = timeMatch[4]?.toUpperCase();

      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;

      const d = new Date();
      d.setHours(hours, minutes, seconds, 0);
      return d;
    }

    // Fallback to basic Date parsing
    const d = new Date(`1970-01-01 ${timeStr}`);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  // Helper function to format duration in milliseconds to readable format (d, h, m, s)
  const formatDuration = (durationMs: number): string => {
    if (durationMs < 0) return '-';

    const totalSeconds = Math.floor(durationMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.length > 0 ? parts.join(' ') : '0s';
  };

  // Import handling functions
  const calculateSimplePnL = (trades: any[]) => {
    // Pre-sort by time BEFORE the P&L loop so broker API order doesn't matter.
    // Groww returns newest-first; Zerodha returns oldest-first.
    // Without this sort, SELLs arrive before BUYs and no position is open → P&L stays "-".
    const processedTrades = [...trades].sort((a, b) => {
      const tA = parseTradeTime(a.time).getTime();
      const tB = parseTradeTime(b.time).getTime();
      if (tA !== tB) return tA - tB;
      // Same timestamp: BUY before SELL (open before close)
      if (a.order === 'BUY' && b.order !== 'BUY') return -1;
      if (a.order !== 'BUY' && b.order === 'BUY') return 1;
      return 0;
    });

    const positions: {
      [symbol: string]: {
        qty: number;
        avgPrice: number;
        firstTradeTime: string;
      };
    } = {};

    for (let i = 0; i < processedTrades.length; i++) {
      const trade = processedTrades[i];
      const symbol = trade.symbol;

      // Initialize position tracking for this symbol
      if (!positions[symbol]) {
        positions[symbol] = { qty: 0, avgPrice: 0, firstTradeTime: trade.time };
      }

      if (trade.order === "BUY") {
        // Add to position
        const currentValue = positions[symbol].qty * positions[symbol].avgPrice;
        const newValue = trade.qty * trade.price;
        const totalQty = positions[symbol].qty + trade.qty;

        if (totalQty > 0) {
          positions[symbol].avgPrice = (currentValue + newValue) / totalQty;
        }
        positions[symbol].qty = totalQty;

        // If this is the first trade for this symbol, record the time
        if (positions[symbol].qty === trade.qty) {
          positions[symbol].firstTradeTime = trade.time;
        }
      } else if (trade.order === "SELL") {
        // Close position (partial or full)
        if (positions[symbol].qty > 0) {
          // Calculate P&L for the quantity being sold
          const pnlPerShare = trade.price - positions[symbol].avgPrice;
          const totalPnL = pnlPerShare * trade.qty;

          // Calculate duration from first buy to this sell
          const entryTime = parseTradeTime(
            positions[symbol].firstTradeTime,
          );
          const exitTime = parseTradeTime(trade.time);
          const durationMs = exitTime.getTime() - entryTime.getTime();
          const durationText = formatDuration(durationMs);

          // Set P&L and duration on this SELL trade
          processedTrades[i].pnl = `₹${totalPnL.toFixed(2)}`;
          processedTrades[i].duration = durationText;

          // Reduce position
          positions[symbol].qty -= trade.qty;

          // If position is fully closed, reset
          if (positions[symbol].qty <= 0) {
            positions[symbol] = { qty: 0, avgPrice: 0, firstTradeTime: "" };
          }
        }
      }
    }

    // Sort processed trades by time (earliest first) to maintain chronological order
    processedTrades.sort((a, b) => {
      const timeA = convertTimeToComparable(a.time);
      const timeB = convertTimeToComparable(b.time);
      return timeA.localeCompare(timeB);
    });

    return processedTrades;
  };

  const parseCSVData = (csvText: string) => {
    try {
      const lines = csvText.trim().split("\n");
      const data = [];

      console.log("🔍 Parsing", lines.length, "lines of trade data");

      for (const line of lines) {
        if (line.trim()) {
          // Handle comma-separated (CSV), tab-separated, and space-separated data
          let parts = [];
          if (line.includes(",")) {
            // CSV format: split by commas and trim each part
            parts = line
              .trim()
              .split(",")
              .map((part) => part.trim())
              .filter((part) => part.length > 0);
          } else if (line.includes("\t")) {
            // Tab-separated format: split by tabs only and trim each part
            parts = line
              .trim()
              .split("\t")
              .map((part) => part.trim())
              .filter((part) => part.length > 0);
          } else {
            // Space-separated format: split by multiple spaces
            parts = line
              .trim()
              .split(/\s{2,}/)
              .map((part) => part.trim())
              .filter((part) => part.length > 0);
          }

          console.log("📋 Parsed parts:", parts);

          // Smart broker format detection
          if (parts.length >= 4) {
            let time = "";
            let order = "";
            let symbol = "";
            let type = "MIS";
            let qty = 0;
            let price = 0;

            // Detect format by checking first field
            const firstField = parts[0];
            const isTimeFirst =
              firstField && /^\d{1,2}:\d{2}(:\d{2})?/.test(firstField);

            // Check if there's a date column
            let startIndex = 0;
            if (
              parts[0] &&
              (parts[0].includes("-") || parts[0].includes("/")) &&
              parts[1] &&
              /\d{1,2}:\d{2}/.test(parts[1])
            ) {
              startIndex = 1; // Skip the date column
            }

            if (
              isTimeFirst ||
              (startIndex === 1 && /^\d{1,2}:\d{2}/.test(parts[startIndex]))
            ) {
              // FORMAT 1: Time first (most common)
              // Time, Symbol/Order, Other fields...
              time = parts[startIndex];

              // Handle AM/PM
              if (
                parts[startIndex + 1] &&
                /^(AM|PM)$/i.test(parts[startIndex + 1])
              ) {
                time = `${time} ${parts[startIndex + 1]}`;
                startIndex++;
              }

              // Next field could be symbol or order
              let nextFieldIndex = startIndex + 1;
              let nextField = parts[nextFieldIndex] || "";

              // Check if it's an order type (BUY/SELL with optional pipe)
              const orderMatch = nextField.match(/^(BUY|SELL)\|?$/i);
              if (orderMatch) {
                // Standard format: Time, Order, Symbol, Type, Qty, Price
                order = orderMatch[1].toUpperCase();
                symbol = parts[nextFieldIndex + 1] || "";
                type = parts[nextFieldIndex + 2] || "MIS";
                qty = parseInt(parts[nextFieldIndex + 3] || "0");
                price = parseFloat(parts[nextFieldIndex + 4] || "0");
              } else {
                // Alternative: Time, Symbol, OrderType(combined), Qty, Price
                symbol = nextField;

                // Next field might be combined order+type (e.g., "buynrml", "sellmis")
                const combinedField = (
                  parts[nextFieldIndex + 1] || ""
                ).toLowerCase();
                if (combinedField.startsWith("buy")) {
                  order = "BUY";
                  type =
                    combinedField.replace("buy", "").toUpperCase() || "MIS";
                } else if (combinedField.startsWith("sell")) {
                  order = "SELL";
                  type =
                    combinedField.replace("sell", "").toUpperCase() || "MIS";
                } else {
                  // Might be separate order and type
                  order = (parts[nextFieldIndex + 1] || "")
                    .toUpperCase()
                    .replace("|", "");
                  type = (parts[nextFieldIndex + 2] || "MIS").toUpperCase();
                }

                // Get qty and price
                const remainingParts = parts.slice(nextFieldIndex + 2);
                for (const part of remainingParts) {
                  const num = parseFloat(part);
                  if (!isNaN(num) && num > 0) {
                    if (qty === 0 && num >= 1) {
                      qty = Math.floor(num);
                    } else if (price === 0) {
                      price = num;
                    }
                  }
                }
              }
            } else {
              // FORMAT 2: Symbol first (legacy format)
              // Symbol, Order|Type, Qty, Price, Time
              symbol = parts[startIndex];

              // Next field is order (might have pipe or be combined with type)
              const orderField = parts[startIndex + 1] || "";

              // Check for "BUY| NRML" format (order and type in same field with pipe)
              if (orderField.includes("|")) {
                const orderParts = orderField.split("|").map((p) => p.trim());
                order = orderParts[0].toUpperCase();
                type = (orderParts[1] || "MIS").toUpperCase();
                qty = parseInt(parts[startIndex + 2] || "0");
                price = parseFloat(parts[startIndex + 3] || "0");
                time = parts[startIndex + 4] || "";
              } else if (
                orderField.toLowerCase().startsWith("buy") ||
                orderField.toLowerCase().startsWith("sell")
              ) {
                // Extract order and type from combined field (e.g., "buynrml", "sellmis")
                const orderFieldUpper = orderField.toUpperCase();
                if (orderFieldUpper.startsWith("BUY")) {
                  order = "BUY";
                  type = orderFieldUpper.replace("BUY", "").trim() || "MIS";
                } else {
                  order = "SELL";
                  type = orderFieldUpper.replace("SELL", "").trim() || "MIS";
                }
                qty = parseInt(parts[startIndex + 2] || "0");
                price = parseFloat(parts[startIndex + 3] || "0");
                time = parts[startIndex + 4] || "";
              } else {
                // Separate order and type fields
                order = orderField.toUpperCase();
                type = (parts[startIndex + 2] || "MIS").toUpperCase();
                qty = parseInt(parts[startIndex + 3] || "0");
                price = parseFloat(parts[startIndex + 4] || "0");
                time = parts[startIndex + 5] || "";
              }
            }

            // Extract quantity from "225 / 225" format if needed
            if (qty === 0) {
              for (const part of parts) {
                const qtyMatch = part.match(/(\d+)/);
                if (qtyMatch) {
                  const testQty = parseInt(qtyMatch[1]);
                  if (testQty > 0 && testQty < 100000) {
                    qty = testQty;
                    break;
                  }
                }
              }
            }

            // Extract price from "200.00 / 200.00 trg." format if needed
            if (price === 0) {
              for (const part of parts) {
                const priceMatch = part.match(/(\d+\.?\d*)/);
                if (priceMatch) {
                  const testPrice = parseFloat(priceMatch[1]);
                  if (
                    testPrice > 0 &&
                    testPrice < 100000 &&
                    testPrice !== qty
                  ) {
                    price = testPrice;
                    break;
                  }
                }
              }
            }

            // Clean up order type
            order = order.toUpperCase().trim();
            if (!["BUY", "SELL"].includes(order)) {
              // Try to extract from the line if we still don't have a valid order
              const lineUpper = line.toUpperCase();
              if (lineUpper.includes("BUY")) {
                order = "BUY";
              } else if (lineUpper.includes("SELL")) {
                order = "SELL";
              } else {
                continue; // Skip invalid orders
              }
            }

            // Clean up type
            type = type.toUpperCase().trim();
            if (!["MIS", "CNC", "NRML", "BFO", "LIM", "LIMIT"].includes(type)) {
              type = "MIS"; // Default
            }

            // Clean symbol - remove NFO, BFO, NSE, BSE suffixes and handle CE/PE
            symbol = symbol
              .replace(/\s+(NFO|BFO|NSE|BSE)$/i, "")
              .replace(/\s+(CE|PE)\s+(NFO|BFO|NSE|BSE)$/i, " $1")
              .trim();

            console.log("✅ Extracted trade:", {
              time,
              order,
              symbol,
              type,
              qty,
              price,
            });

            // Only add trade if we have essential fields
            if (time && order && symbol && qty > 0) {
              const trade = {
                time: time,
                order: order,
                symbol: symbol,
                type: type,
                qty: qty,
                price: price,
                pnl: "-",
                duration: "-",
              };

              console.log("✅ Adding trade to data:", trade);
              data.push(trade);
            } else {
              console.log("❌ Skipping invalid trade - missing:", {
                hasTime: !!time,
                hasOrder: !!order,
                hasSymbol: !!symbol,
                hasQty: qty > 0,
                time,
                order,
                symbol,
                qty,
              });
            }
          }
        }
      }

      console.log("📊 Total trades parsed:", data.length);

      // Sort trades by time (earliest first)
      data.sort((a, b) => {
        const timeA = convertTimeToComparable(a.time);
        const timeB = convertTimeToComparable(b.time);
        return timeA.localeCompare(timeB);
      });

      return data;
    } catch (error) {
      throw new Error(
        "Failed to parse trade data. Please check the format and try again.",
      );
    }
  };

  // Helper function to convert time strings to comparable format
  const convertTimeToComparable = (timeStr: string) => {
    try {
      // Handle formats like "12:13:17 PM" or "12:13:17"
      let time = timeStr.trim();

      // If no AM/PM, assume 24-hour format
      if (!time.includes("AM") && !time.includes("PM")) {
        return time.padStart(8, "0"); // Ensure consistent format like "12:13:17"
      }

      // Convert 12-hour to 24-hour format for proper sorting
      const match = time.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const seconds = match[3];
        const period = match[4].toUpperCase();

        // Convert to 24-hour format
        if (period === "AM" && hours === 12) {
          hours = 0;
        } else if (period === "PM" && hours !== 12) {
          hours += 12;
        }

        return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
      }

      return time;
    } catch (error) {
      return timeStr; // Fallback to original string
    }
  };

  const calculatePnLAndDuration = (trades: any[]) => {
    const processedTrades = [...trades];
    const openTrades: { [symbol: string]: any[] } = {};

    // Process each trade and match with open positions
    for (let i = 0; i < processedTrades.length; i++) {
      const trade = processedTrades[i];
      const symbol = trade.symbol;

      if (!openTrades[symbol]) {
        openTrades[symbol] = [];
      }

      // Find matching open trade with opposite order type (partial or full match)
      let matchedIndex = -1;
      for (let j = 0; j < openTrades[symbol].length; j++) {
        const openTrade = openTrades[symbol][j];
        if (openTrade.order !== trade.order && openTrade.qty >= trade.qty) {
          matchedIndex = j;
          break;
        }
      }

      if (matchedIndex !== -1) {
        // Found a match - calculate P&L and duration
        const openTrade = openTrades[symbol][matchedIndex];

        // Calculate P&L based on first order type (using closing quantity)
        let pnlPerShare = 0;
        if (openTrade.order === "BUY") {
          // Long position: Buy first, then Sell
          pnlPerShare = trade.price - openTrade.price;
        } else {
          // Short position: Sell first, then Buy
          pnlPerShare = openTrade.price - trade.price;
        }

        // Multiply by CLOSING quantity (trade.qty) to get total P&L
        const totalPnL = pnlPerShare * trade.qty;

        // Calculate duration
        const openTime = parseTradeTime(openTrade.time);
        const closeTime = parseTradeTime(trade.time);
        const durationMs = closeTime.getTime() - openTime.getTime();
        const durationText = formatDuration(durationMs);

        // Only show P&L and duration on the closing trade
        // For LONG (BUY first): Show on SELL row
        // For SHORT (SELL first): Show on BUY row

        if (openTrade.order === "BUY") {
          // Long position: BUY first, show P&L on SELL (current trade)
          processedTrades[i].pnl = `₹${totalPnL.toFixed(2)}`;
          processedTrades[i].duration = durationText;
        } else {
          // Short position: SELL first, show P&L on BUY (current trade)
          processedTrades[i].pnl = `₹${totalPnL.toFixed(2)}`;
          processedTrades[i].duration = durationText;
        }

        // Handle partial vs full exit
        if (openTrade.qty === trade.qty) {
          // Full exit - remove the open trade
          openTrades[symbol].splice(matchedIndex, 1);
        } else {
          // Partial exit - reduce the open trade quantity
          openTrade.qty -= trade.qty;
        }
      } else {
        // No match found - add to open trades
        openTrades[symbol].push(trade);
      }
    }

    return processedTrades;
  };

  // Helper function to find position of selected text in first line
  const findPositionInLine = (selectedText: string, firstLine: string): number | null => {
    if (!selectedText || !firstLine) return null;

    // Split first line by tabs first, then by spaces
    const words = firstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());

    // Find the exact match or partial match
    const trimmedSelection = selectedText.trim();
    const position = words.findIndex(word => word === trimmedSelection || word.includes(trimmedSelection) || trimmedSelection.includes(word));

    console.log("🔍 Position detection:", { selectedText: trimmedSelection, words, position, firstLine });
    return position >= 0 ? position : null;
  };

  // Helper: Recalculate format positions based on current textarea's first line
  // Uses SMART FIELD DETECTION for common fields instead of just displayValue matching
  const recalculateFormatPositions = (format: FormatData, currentFirstLine: string): FormatData => {
    if (!currentFirstLine || !format.displayValues) return format;

    const recalculatedPositions: FormatData["positions"] = {
      time: [],
      order: [],
      symbol: [],
      type: [],
      qty: [],
      price: []
    };

    // Get words from current first line
    const currentWords = currentFirstLine.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());

    // SMART FIELD DETECTION - use patterns to find field positions
    // This is more robust than just matching displayValues which might be different in new data

    // 1. ORDER field: Look for BUY or SELL
    const orderPos = currentWords.findIndex(w => 
      w.toUpperCase() === "BUY" || w.toUpperCase() === "SELL"
    );
    if (orderPos >= 0) {
      recalculatedPositions.order = [orderPos];
    }

    // 2. TIME field: Look for HH:MM:SS pattern
    const timePos = currentWords.findIndex(w => 
      /^\d{1,2}:\d{2}(:\d{2})?$/.test(w)
    );
    if (timePos >= 0) {
      recalculatedPositions.time = [timePos];
    }

    // 3. TYPE field: Look for MIS, NRML, CNC, etc.
    const typePos = currentWords.findIndex(w => 
      ["MIS", "NRML", "CNC", "INTRADAY", "DELIVERY", "MARGIN"].includes(w.toUpperCase())
    );
    if (typePos >= 0) {
      recalculatedPositions.type = [typePos];
    }

    // 4. QTY and PRICE: Find numeric values
    // QTY is usually a whole number, PRICE usually has decimals or is larger
    const numericPositions: { pos: number; value: number; hasDecimal: boolean }[] = [];
    currentWords.forEach((word, idx) => {
      const cleanNum = word.replace(/[₹$,]/g, "");
      const num = parseFloat(cleanNum);
      if (!isNaN(num) && num > 0) {
        // Skip if already assigned to time/order/type
        if (idx !== orderPos && idx !== timePos && idx !== typePos) {
          numericPositions.push({ 
            pos: idx, 
            value: num, 
            hasDecimal: cleanNum.includes(".")
          });
        }
      }
    });

    // Usually qty comes before price, qty is typically smaller or whole number
    if (numericPositions.length >= 2) {
      // Sort by position (earlier = more likely qty)
      numericPositions.sort((a, b) => a.pos - b.pos);
      recalculatedPositions.qty = [numericPositions[0].pos];
      recalculatedPositions.price = [numericPositions[numericPositions.length - 1].pos];
    } else if (numericPositions.length === 1) {
      // If only one numeric, use original format's hint
      if (format.positions.qty.length > 0) {
        recalculatedPositions.qty = [numericPositions[0].pos];
      } else {
        recalculatedPositions.price = [numericPositions[0].pos];
      }
    }

    // 5. SYMBOL: Everything else between ORDER and TYPE (typically)
    // Symbol is usually the longest part or contains instrument names
    const usedPositions = new Set([
      ...recalculatedPositions.time,
      ...recalculatedPositions.order,
      ...recalculatedPositions.type,
      ...recalculatedPositions.qty,
      ...recalculatedPositions.price
    ]);

    // Find symbol positions - typically comes after order and before type
    const symbolPositions: number[] = [];
    for (let i = 0; i < currentWords.length; i++) {
      if (!usedPositions.has(i)) {
        const word = currentWords[i];
        // Skip common non-symbol words
        if (!["NFO", "NSE", "BSE", "MCX", "w", "CE", "PE", "FUT", "OPT"].includes(word.toUpperCase())) {
          // Check if it looks like part of a symbol (contains letters)
          if (/[A-Za-z]/.test(word)) {
            symbolPositions.push(i);
          }
        } else {
          // Include exchange/option type as part of symbol too
          symbolPositions.push(i);
        }
      }
    }
    recalculatedPositions.symbol = symbolPositions;

    console.log("🔄 SMART Recalculated format positions:", {
      original: format.positions,
      recalculated: recalculatedPositions,
      currentWords,
      displayValues: format.displayValues
    });

    return {
      ...format,
      sampleLine: currentFirstLine,
      positions: recalculatedPositions
    };
  };

  // Parse trades using saved format with position-based mapping (supports multiple positions per field)
  const parseTradesWithFormat = (data: string, format: FormatData): ParseResult => {
    const result: ParseResult = {
      trades: [],
      errors: []
    };

    const lines = data.split("\n").filter(line => line.trim());

    if (lines.length === 0) {
      result.errors.push({
        line: 0,
        content: "",
        reason: "No data found"
      });
      return result;
    }

    // Parse each line using position mapping
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by tabs first, then by spaces
      const words = line.split(/\t+/).flatMap(part => part.split(/\s+/)).filter(w => w.trim());

      try {
        const tradeData: any = {};

        // Extract fields based on saved positions (join if multiple positions)
        if (format.positions.time.length > 0) {
          tradeData.time = format.positions.time.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.order.length > 0) {
          tradeData.order = format.positions.order.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.symbol.length > 0) {
          tradeData.symbol = format.positions.symbol.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.type.length > 0) {
          tradeData.type = format.positions.type.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.qty.length > 0) {
          tradeData.qty = format.positions.qty.map(pos => words[pos] || "").join(" ");
        }
        if (format.positions.price.length > 0) {
          tradeData.price = format.positions.price.map(pos => words[pos] || "").join(" ");
        }

        // Validate required fields
        if (!tradeData.order || !tradeData.qty || !tradeData.price) {
          result.errors.push({
            line: i + 1,
            content: line,
            reason: "Missing required fields (order, qty, or price)"
          });
          continue;
        }

        // Validate and normalize
        const order = tradeData.order?.toUpperCase();
        if (order !== "BUY" && order !== "SELL") {
          result.errors.push({
            line: i + 1,
            content: line,
            reason: `Invalid order type: ${tradeData.order}`
          });
          continue;
        }

        const qty = parseFloat(tradeData.qty);
        const price = parseFloat(tradeData.price?.replace(/[₹$,]/g, "") || "0");

        if (isNaN(qty) || qty <= 0) {
          result.errors.push({
            line: i + 1,
            content: line,
            reason: `Invalid quantity: ${tradeData.qty}`
          });
          continue;
        }

        if (isNaN(price) || price <= 0) {
          result.errors.push({
            line: i + 1,
            content: line,
            reason: `Invalid price: ${tradeData.price}`
          });
          continue;
        }

        result.trades.push({
          time: tradeData.time || "",
          order: order as "BUY" | "SELL",
          symbol: tradeData.symbol || "",
          type: tradeData.type?.toUpperCase() || "MIS",
          qty: Math.floor(qty),
          price,
          pnl: "-",
          duration: "-"
        });
      } catch (err) {
        result.errors.push({
          line: i + 1,
          content: line,
          reason: err instanceof Error ? err.message : "Parsing error"
        });
      }
    }

    console.log("✅ Parsed trades using positions:", format.positions, "Result:", result);
    return result;
  };

  const handleImportData = () => {
    try {
      setImportError("");
      setParseErrors([]);

      if (!importData.trim()) {
        setImportError("Please paste trade data");
        return;
      }

      // Use format-based parser if active format is set, otherwise use default parser
      const { trades, errors } = activeFormat 
        ? parseTradesWithFormat(importData, activeFormat)
        : parseBrokerTrades(importData);

      // Store parse errors for detailed display
      setParseErrors(errors);

      if (trades.length === 0) {
        if (errors.length > 0) {
          setImportError(
            `No valid trades found. ${errors.length} error(s) detected. See details below.`,
          );
        } else {
          setImportError(
            "No valid trades found in the data. Please check the format.",
          );
        }
        return;
      }

      // Calculate P&L for the successfully parsed trades
      const processedData = calculateSimplePnL(trades);

      // Add imported trades to the active tab's trade history (not replace)
      if (tradeHistoryWindow === 2) {
        setTradeHistoryData2((prev) => [...processedData, ...prev]);
      } else {
        setTradeHistoryData((prev) => [...processedData, ...prev]);
      }

      // Show success message with counts
      if (errors.length > 0) {
        // Partial import - some trades succeeded, some failed
        console.log(
          `✅ Imported ${trades.length} trades successfully. ⚠️ ${errors.length} line(s) had errors.`,
        );
      } else {
        // Full success
        const formatInfo = detectedFormatLabel ? ` using "${detectedFormatLabel}" format` : "";
        console.log(`✅ Successfully imported ${trades.length} trades${formatInfo}! Added to existing trade history.`);
      }

      // Log format detection info
      if (activeFormat && detectedFormatLabel) {
        console.log(`🎯 Used auto-detected "${detectedFormatLabel}" format for parsing!`);
      }

      // Close modal and show order modal only if no errors, otherwise keep modal open to show errors
      if (errors.length === 0) {
        setShowImportModal(false);
        setImportData("");
        // setShowOrderModal(true);
        // Reset user format selection for fresh start next time
        setUserSelectedFormatId(null);
      } else {
        // Keep modal open to show errors but still set the data
        // setShowOrderModal(true);
      }
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    } else {
      setImportError("Please upload a valid CSV file");
    }
  };

  const handleBrokerImport = (trades: BrokerTrade[]) => {
    const convertedTrades = trades.map((trade) => ({
      time: new Date(trade.executedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      order: trade.action,
      symbol: trade.symbol,
      type: "MKT",
      qty: trade.quantity,
      price: trade.price,
      pnl: trade.pnl ? `₹${trade.pnl}` : "-",
      duration: "-",
    }));

    setTradeHistoryData((prev) => [...convertedTrades, ...prev]);
    setShowBrokerImportModal(false);
  };

  // Helper function to handle tab changes with audio stopping
  const handleTabChange = (newTab: string) => {
    // Stop any playing news audio when switching tabs
    if (window.stopNewsAudio) {
      window.stopNewsAudio();
    }
    setActiveTab(newTab);
  };

  // Expose tab state management to window for navigation preservation
  useEffect(() => {
    window.getActiveTab = () => {
      console.log('[TAB] Getting active tab:', activeTab);
      return activeTab;
    };
    window.setActiveTab = (tab: string) => {
      console.log('[TAB] Setting active tab to:', tab);
      setActiveTab(tab);
    };

    console.log('[TAB] Tab functions exposed, current tab:', activeTab);

    return () => {
      delete window.getActiveTab;
      delete window.setActiveTab;
    };
  }, [activeTab]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (
      tab &&
      [
        "strategy-build",
        "dashboard",
        "chart",
        "documentation",
        "journal",
        "insights",
        "voice",
        "portfolio",
        "risk-management",
      ].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [location]);

  // Render social feed with full-width layout (no sidebar)
  if (activeTab === "voice") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Full-width Social Feed - No Sidebar */}
        <main className="h-screen w-full">
              <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" /></div>}>
                <NeoFeedSocialFeed onBackClick={() => setTabWithAuthCheck("trading-home")} />
              </Suspense>
        </main>
        {/* Guest login prompt for unauthenticated users */}
        {showGuestDialog && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Sign in to interact</p>
                <p className="text-xs text-slate-400 mt-0.5">Log in to post, like, and join the conversation.</p>
              </div>
              <button
                onClick={() => setLocation('/landing')}
                className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                data-testid="guest-dialog-login-voice"
              >
                Login
              </button>
              <button
                onClick={() => setShowGuestDialog(false)}
                className="shrink-0 text-slate-400 hover:text-white transition-colors p-1"
                data-testid="guest-dialog-close-voice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MiniCast/Tutor tab with full page view
  if (activeTab === "tutor") {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-900"><div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" /></div>}>
        <MiniCastTab setActiveTab={setActiveTab} />
      </Suspense>
    );
  }


  return (
    <div className={`min-h-screen bg-background overscroll-none touch-pan-y ${
      isSharedReportMode ? 'pointer-events-none opacity-30 blur-sm' : ''
    }`}>
      {/* Vertical Sidebar - Fixed Position */}

      {/* Main Content Area - Full Width */}
      <div className="flex flex-col chatgpt-main-content min-h-screen md:min-h-screen min-h-[100dvh] overscroll-none">
        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            {/* Render content based on active tab */}

            {localStorage.getItem('currentUserEmail') === 'chiranjeevi.perala99@gmail.com' && (
              <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
                <TradingDashboardTab setActiveTab={setActiveTab} />
              </div>
            )}

            {activeTab === "trading-home" && (
              <div className="relative min-h-screen overflow-hidden">
                {/* Navigation Menu - Behind the home screen */}
                <div className="fixed inset-0 bg-gradient-to-b from-blue-800 to-blue-900 z-10 flex items-start justify-end pt-20 px-0 md:items-center md:justify-center md:pt-0 md:px-6">
                  <div className="w-auto md:w-full md:max-w-sm space-y-6 pr-4 md:pr-0">
                    {currentUser.userId ? (
                      <>
                        {/* User Profile Section - Horizontal Layout */}
                        <div className="flex items-center gap-4 pb-2">
                          <Avatar className="w-14 h-14 border-2 border-white/20">
                            <AvatarImage src={sidebarProfilePicUrl ?? undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold text-xl">
                              {(currentUser?.displayName || currentUser?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white font-semibold text-base">
                                {currentUser.displayName && currentUser.displayName !== "Not available" ? currentUser.displayName : (currentUser.username && !currentUser.username.includes("@") ? currentUser.username : "")}
                              </p>
                              {(() => {
                                const userEmail = currentUser?.email?.toLowerCase();
                                const adminUser = authorizedUsers.find(u => u.email.toLowerCase() === userEmail);
                                if (adminUser) {
                                  if (adminUser.role === "owner") {
                                    return (
                                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm" title="Primary Owner">
                                        <Check className="h-2.5 w-2.5 text-white" />
                                      </div>
                                    );
                                  } else if (adminUser.role === "developer") {
                                    return (
                                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shadow-sm" title="Developer">
                                        <Check className="h-2.5 w-2.5 text-white" />
                                      </div>
                                    );
                                  } else if (adminUser.role === "admin") {
                                    return (
                                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow-sm" title="Admin">
                                        <Check className="h-2.5 w-2.5 text-white" />
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </div>
                            <p className="text-blue-200 text-sm">
                               {currentUser.username && !currentUser.username.includes("@") ? `@${currentUser.username}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Navigation Menu Items - Left aligned */}
                        <div className="space-y-3 flex flex-col">
                          <button
                            onClick={() => { if (isEditingUsername || isEditingDisplayName || isEditingDob || isEditingLocation) { setIsEditingUsername(false); setIsEditingDisplayName(false); setIsEditingDob(false); setIsEditingLocation(false); } else { setIsProfileActive(!isProfileActive); } }}
                            className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center justify-start"
                            data-testid="nav-profile"
                          >
                            <User className="h-4 w-4 mr-2" />
                            <span>profile</span>
                            {isEditingUsername || isEditingDisplayName || isEditingDob || isEditingLocation ? ( <X className="h-4 w-4" /> ) : ( <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileActive ? "rotate-180" : ""}`} /> )}
                          </button>

                          {isProfileActive && (
                            <div className="px-4 py-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="flex flex-col group relative">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">username</span>
                                {isEditingUsername ? (
                                  <div className="relative flex flex-col gap-2 w-full">
                                    <div className="relative w-full">
                                      <Input
                                        value={newUsername}
                                        onChange={(e) => { setNewUsername(e.target.value); checkUsernameAvailability(e.target.value); }}
                                        className="h-8 bg-gray-800 border-gray-700 text-white pr-10 w-full"
                                        autoFocus
                                        data-testid="input-username-edit"
                                      />
                                      {isCheckingUsername ? (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                                          <div className="h-4 w-4 border-2 border-gray-500 border-t-blue-400 rounded-full animate-spin" />
                                        </div>
                                      ) : isUsernameAvailable === true ? (
                                        <button onClick={async (e) => { e.stopPropagation(); await handleUpdateProfile({ username: newUsername }); setIsEditingUsername(false); setIsUsernameAvailable(null); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-all z-10" data-testid="button-save-username">
                                          <CheckCircle className="h-4 w-4 text-green-400" />
                                        </button>
                                      ) : isUsernameAvailable === false ? (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-not-allowed">
                                          <X className="h-4 w-4 text-red-400" />
                                        </div>
                                      ) : null}
                                    </div>
                                    {isUsernameAvailable === false && (<span className="text-xs text-red-400">Username taken</span>)}
                                    {isUsernameAvailable === true && newUsername.length >= 3 && (<span className="text-xs text-green-400">Available now</span>)}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-white font-medium">{currentUser?.username || "Not available"}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setNewUsername(currentUser?.username || ""); setIsUsernameAvailable(null); setIsEditingUsername(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all" data-testid="button-edit-username">
                                      <Pencil className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col group relative">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">display name</span>
                                {isEditingDisplayName ? (
                                  <div className="relative flex items-center gap-2">
                                    <div className="relative w-full">
                                      <Input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} className="h-8 bg-gray-800 border-gray-700 text-white pr-10 w-full" autoFocus />
                                      <button onClick={async (e) => { e.stopPropagation(); await handleUpdateProfile({ displayName: newDisplayName }); setIsEditingDisplayName(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-all z-10">
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-white font-medium">{currentUser?.displayName && currentUser.displayName !== "Not available" ? currentUser.displayName : ""}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setNewDisplayName(currentUser?.displayName || ""); setIsEditingDisplayName(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">email id</span>
                                <span className="text-white font-medium">{currentUser?.email && currentUser.email !== "empty" ? currentUser.email : ""}</span>
                              </div>
                              <div className="flex flex-col group relative">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">dob</span>
                                {isEditingDob ? (
                                  <div className="relative flex items-center group">
                                    <Input type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} className="h-9 bg-gray-800 border-gray-700 text-white pr-10 focus:ring-1 focus:ring-blue-500" autoFocus onKeyDown={async (e) => { if (e.key === "Enter") { e.stopPropagation(); await handleUpdateProfile({ dob: newDob }); setIsEditingDob(false); } else if (e.key === "Escape") { setIsEditingDob(false); } }} />
                                    <button onClick={async (e) => { e.stopPropagation(); await handleUpdateProfile({ dob: newDob }); setIsEditingDob(false); }} className="absolute right-2 p-1 hover:bg-white/10 rounded-md transition-all" data-testid="button-save-dob">
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-white font-medium">{currentUser?.dob ? currentUser.dob.split("-").reverse().join("-") : "empty"}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setNewDob(currentUser?.dob || ""); setIsEditingDob(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col group relative">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">location</span>
                                {isEditingLocation ? (
                                  <div className="relative flex items-center group">
                                    <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="h-9 bg-gray-800 border-gray-700 text-white pr-10 focus:ring-1 focus:ring-blue-500" autoFocus onKeyDown={async (e) => { if (e.key === "Enter") { e.stopPropagation(); await handleUpdateProfile({ location: newLocation }); setIsEditingLocation(false); } else if (e.key === "Escape") { setIsEditingLocation(false); } }} />
                                    <button onClick={async (e) => { e.stopPropagation(); await handleUpdateProfile({ location: newLocation }); setIsEditingLocation(false); }} className="absolute right-2 p-1 hover:bg-white/10 rounded-md transition-all" data-testid="button-save-location">
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="text-white font-medium">{currentUser?.location && currentUser.location !== "empty" ? currentUser.location : ""}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setNewLocation(currentUser?.location || ""); setIsEditingLocation(true); }} className="p-1 hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"><Pencil className="h-3 w-3 text-blue-400" /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {!isProfileActive && (
                            <>
                              <button
                                onClick={() => setIsVoiceActive(!isVoiceActive)}
                                className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center justify-start"
                                data-testid="nav-voice"
                              >
                                <Mic className="h-4 w-4 mr-2" />
                                <span>Voice</span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isVoiceActive ? "rotate-180" : ""}`} />
                              </button>

                              {isVoiceActive && (
                                <div className="px-4 py-6 bg-gray-800/50 border border-gray-700 rounded-lg no-scrollbar max-h-[400px] overflow-y-auto pl-[0px] pr-[0px] pt-[10px] pb-[10px] mt-[2px] mb-[2px]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                  <div className="flex flex-col items-center gap-4">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">voice profiles</span>
                                    <div className="flex items-center justify-start gap-4 py-2 overflow-x-auto no-scrollbar scroll-smooth pl-[10px] pr-[10px]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                      {(VOICES_BY_LANGUAGE[voiceLanguage] || VOICES_BY_LANGUAGE['en']).map((profile) => {
                                          const isSelected = activeVoiceProfileId === profile.id;
                                          const isMale = profile.gender === 'Male';
                                          const languageText = LANGUAGE_SCRIPTS[voiceLanguage] || 'A';
                                          const isLoadingThis = loadingVoiceId === profile.id;
                                          return (
                                            <div
                                              key={profile.id}
                                              className="flex flex-col items-center gap-1.5 group cursor-pointer"
                                              onClick={async () => {
                                                setActiveVoiceProfileId(profile.id);
                                                if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
                                                const cacheKey = `${profile.id}_${voiceLanguage}`;
                                                if (voiceAudioCacheRef.current[cacheKey]) {
                                                  const audio = new Audio(voiceAudioCacheRef.current[cacheKey]);
                                                  currentAudioRef.current = audio;
                                                  audio.play().catch(err => console.error('🎤 [TTS] Cache play error:', err));
                                                  return;
                                                }
                                                setLoadingVoiceId(profile.id);
                                                try {
                                                  let audioUrl: string | null = null;
                                                  // Prefetch already in-flight — await it instead of firing a duplicate request
                                                  if (voicePromiseCacheRef.current[cacheKey]) {
                                                    audioUrl = await voicePromiseCacheRef.current[cacheKey];
                                                  } else {
                                                    const userName = currentUser?.displayName || currentUser?.name || currentUser?.username || '';
                                                    const greetings: { [key: string]: (p: string, u: string) => string } = {
                                                      en: (p, u) => u ? `Hello ${u}! I am ${p}. Welcome to Perala! How is your day?` : `Hello! I am ${p}. Welcome to Perala! How is your day?`,
                                                      hi: (p, u) => u ? `नमस्ते ${u}! मैं ${p} हूँ। पेरला में आपका स्वागत है!` : `नमस्ते! मैं ${p} हूँ। पेरला में आपका स्वागत है!`,
                                                      bn: (p, u) => u ? `নমস্কার ${u}! আমি ${p}। পেরলায় আপনাকে স্বাগত!` : `নমস্কার! আমি ${p}। পেরলায় আপনাকে স্঵াগত!`,
                                                      ta: (p, u) => u ? `வணக்கம் ${u}! நான் ${p}. பெரலாவில் உங்களை வரவேற்கிறோம்!` : `வணக்கம்! நான் ${p}. பெரலாவில் உங்களை வரவேற்கிறோம்!`,
                                                      te: (p, u) => u ? `నమస్కారం ${u}! నేను ${p}. పెరలాలో మీకు స్వాగతం!` : `నమస్కారం! నేను ${p}. పెరలాలో మీకు స్వాగతం!`,
                                                      mr: (p, u) => u ? `नमस्कार ${u}! मी ${p} आहे. पेरलामध्ये तुमचे स्वागत!` : `नमस्कार! मी ${p} आहे. पेरलामध्ये तुमचे स्वागत!`,
                                                      gu: (p, u) => u ? `નમસ્તે ${u}! હું ${p} છું. પેરલામां आपनुं स्वागत छे!` : `નમસ્તે! હું ${p} છું. પેરલામां आपनुं स्वागत छे!`,
                                                      kn: (p, u) => u ? `ನಮಸ್ಕಾರ ${u}! ನಾನು ${p}. ಪೆರಲಾದಲ್ಲಿ ನಿಮಗೆ ಸ್ವಾಗತ!` : `ನಮಸ್ಕಾರ! ನಾನು ${p}. ಪೆರಲಾದಲ್ಲಿ ನಿಮಗೆ ಸ್ವಾಗತ!`,
                                                      ml: (p, u) => u ? `നമസ്കാരം ${u}! ഞാൻ ${p} ആണ്. പെരലയിലേക്ക് സ്വാഗതം!` : `നമസ്കാരം! ഞാൻ ${p} ആണ്. പെരലയിലേക്ക് സ്വാഗതം!`,
                                                    };
                                                    const baseText = (greetings[voiceLanguage] || greetings['en'])(profile.name, userName);
                                                    const freshPromise: Promise<string | null> = fetch('/api/tts/generate', {
                                                      method: 'POST',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify({ text: baseText, language: voiceLanguage || 'en', speaker: profile.id, speed: voiceRate || 1.0, pitch: voicePitch || 1.0 })
                                                    }).then(r => r.ok ? r.json() : null).then(data => {
                                                      if (data?.audioBase64) {
                                                        const base64Data = data.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
                                                        const binaryString = atob(base64Data);
                                                        const bytes = new Uint8Array(binaryString.length);
                                                        for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
                                                        const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
                                                        voiceAudioCacheRef.current[cacheKey] = url;
                                                        delete voicePromiseCacheRef.current[cacheKey];
                                                        return url;
                                                      }
                                                      delete voicePromiseCacheRef.current[cacheKey];
                                                      return null;
                                                    }).catch(() => { delete voicePromiseCacheRef.current[cacheKey]; return null; });
                                                    voicePromiseCacheRef.current[cacheKey] = freshPromise;
                                                    audioUrl = await freshPromise;
                                                  }
                                                  if (audioUrl) {
                                                    const audio = new Audio(audioUrl);
                                                    currentAudioRef.current = audio;
                                                    audio.play().catch(err => console.error('🎤 [TTS] Audio play error:', err));
                                                  }
                                                } catch (error) {
                                                  console.error('🎤 [TTS] Error:', error);
                                                } finally {
                                                  setLoadingVoiceId(null);
                                                }
                                              }}
                                            >
                                              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-105 ${isSelected ? (isMale ? "border-blue-500 ring-2 ring-blue-500/50" : "border-pink-500 ring-2 ring-pink-500/50") : "border-transparent"} active:scale-95 overflow-hidden ${isMale ? 'bg-gradient-to-br from-blue-600 to-blue-400' : 'bg-gradient-to-br from-pink-600 to-pink-400'} shadow-lg`}>
                                                {isLoadingThis ? (
                                                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                  <span className="text-xs font-bold text-white">{languageText}</span>
                                                )}
                                              </div>
                                              <span className={`text-[10px] font-medium transition-colors flex items-center gap-1 ${isSelected ? (isMale ? "text-blue-400" : "text-pink-400") + " font-bold" : "text-gray-300 group-hover:" + (isMale ? "text-blue-400" : "text-pink-400")}`}>
                                                {profile.name} {isSelected && !isLoadingThis && <Check className="h-2.5 w-2.5" />}
                                              </span>
                                            </div>
                                          );
                                        })}
                                    </div>
                                    {voiceLangLoading && (
                                      <div className="w-full px-1 animate-in fade-in duration-200">
                                        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                                          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-100" style={{ width: `${voiceLangProgress}%` }} />
                                        </div>
                                        <p className="text-[10px] text-blue-400 text-center mt-1 animate-pulse">Setting up {voiceLanguage !== 'en' ? 'new language' : 'English'} voices…</p>
                                      </div>
                                    )}
                                    <div className="w-full h-px bg-gray-700/50 my-1" />
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1">
                                        <p className="text-[11px] text-gray-500 italic mb-2">Language & Voice</p>
                                        <select
                                          value={voiceLanguage}
                                          onChange={(e) => { const l = e.target.value; setVoiceLanguage(l); prefetchVoiceAudio(l); }}
                                          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200 focus:border-blue-400 focus:outline-none"
                                        >
                                          <option value="en">English (Indian)</option>
                                          <option value="hi">हिंदी (Hindi)</option>
                                          <option value="bn">বাংলা (Bengali)</option>
                                          <option value="ta">தமிழ் (Tamil)</option>
                                          <option value="te">తెలుగు (Telugu)</option>
                                          <option value="mr">मराठी (Marathi)</option>
                                          <option value="gu">ગુજરાતી (Gujarati)</option>
                                          <option value="kn">ಕನ್ನಡ (Kannada)</option>
                                          <option value="ml">മലയാളം (Malayalam)</option>
                                          <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                                          <option value="or">ଓଡ଼ିଆ (Odia)</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                      <p className="text-[11px] text-gray-500 italic">Select a voice for your audio post</p>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setIsVoiceSettingsOpen(!isVoiceSettingsOpen); }}
                                        className={`p-1 rounded-full hover:bg-white/10 transition-transform ${isVoiceSettingsOpen ? 'rotate-180 text-blue-400' : 'text-gray-500'}`}
                                      >
                                        <ChevronDown className="h-4 w-4" />
                                      </button>
                                    </div>
                                    {isVoiceSettingsOpen && (
                                      <div className="px-6 py-6 bg-gray-800/80 border border-gray-700/50 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-md">
                                        <div className="space-y-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                            <div className="flex flex-col gap-3 w-full">
                                              <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-bold">Pitch</span>
                                                <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full">{(voicePitch || 1.0).toFixed(1)}</span>
                                              </div>
                                              <div className="relative w-full h-6 flex items-center group">
                                                <div className="absolute h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 transition-all duration-300" style={{ width: `${((voicePitch - 0.5) / 1.5) * 100}%` }} />
                                                </div>
                                                <input type="range" min="0.5" max="2.0" step="0.1" value={voicePitch || 1.0} onChange={(e) => setVoicePitch(parseFloat(e.target.value))} className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125" />
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-3 w-full">
                                              <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-bold">Speed</span>
                                                <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full">{(voiceRate || 1.0).toFixed(1)}x</span>
                                              </div>
                                              <div className="relative w-full h-6 flex items-center group">
                                                <div className="absolute h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 transition-all duration-300" style={{ width: `${((voiceRate - 0.5) / 1.5) * 100}%` }} />
                                                </div>
                                                <input type="range" min="0.5" max="2.0" step="0.1" value={voiceRate || 1.0} onChange={(e) => setVoiceRate(parseFloat(e.target.value))} className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125" />
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-3 w-full">
                                              <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-bold">Break</span>
                                                <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full">{voiceBreakTime}ms</span>
                                              </div>
                                              <div className="relative w-full h-6 flex items-center group">
                                                <div className="absolute h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 transition-all duration-300" style={{ width: `${((voiceBreakTime - 0) / 1000) * 100}%` }} />
                                                </div>
                                                <input type="range" min="0" max="1000" step="50" value={voiceBreakTime} onChange={(e) => setVoiceBreakTime(parseInt(e.target.value))} className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125" />
                                              </div>
                                            </div>
                                            <div className="flex flex-col gap-3 w-full">
                                              <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-bold">Noise Scale</span>
                                                <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full">{voiceNoiseScale}</span>
                                              </div>
                                              <div className="relative w-full h-6 flex items-center group">
                                                <div className="absolute h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 transition-all duration-300" style={{ width: `${((voiceNoiseScale - 0.5) / 0.3) * 100}%` }} />
                                                </div>
                                                <input type="range" min="0.5" max="0.8" step="0.01" value={voiceNoiseScale} onChange={(e) => setVoiceNoiseScale(parseFloat(e.target.value))} className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125" />
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-3 mt-2">
                                            <div className="flex justify-between items-center px-1">
                                              <span className="text-[11px] uppercase tracking-[0.2em] text-blue-400/80 font-bold">Emphasis</span>
                                              <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded-full capitalize">{voiceEmphasis}</span>
                                            </div>
                                            <div className="flex p-1 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                                              {['none', 'moderate', 'strong'].map((level) => (
                                                <button key={level} onClick={() => setVoiceEmphasis(level)} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${voiceEmphasis === level ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-200'}`}>
                                                  {level}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {!localStorage.getItem('currentUserId') || localStorage.getItem('currentUserId') === 'null' ? (
                                    <div className="pt-2 pb-1">
                                      <button onClick={() => { setLocation('/landing'); setIsNavOpen(false); }} className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]" data-testid="button-sidebar-login">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                        Login
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                              {!isVoiceActive && (
                                <>
                                  {localStorage.getItem('currentUserEmail') === 'chiranjeevi.perala99@gmail.com' && (
                                    <button onClick={() => { setTabWithAuthCheck("dashboard"); setIsNavOpen(false); }} className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" data-testid="nav-dashboard">
                                      <BarChart3 className="h-4 w-4" />
                                      <span>dashboard</span>
                                    </button>
                                  )}
                                  <button onClick={() => setShowReportBugDialog(true)} className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-2" data-testid="nav-report-bug">
                                    <Bug className="h-4 w-4" />
                                    <span>report bug</span>
                                  </button>
                                  {(() => {
                                    const userEmail = currentUser?.email?.toLowerCase();
                                    const isAuthorizedAdmin = authorizedUsers.some((u: any) => u.email.toLowerCase() === userEmail);
                                    if (isAuthorizedAdmin) {
                                      return (
                                        <button onClick={() => setShowAdminDashboardDialog(true)} className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-2" data-testid="nav-admin-dashboard">
                                          <Bug className="h-4 w-4" />
                                          <span>Admin -dashboard</span>
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <button onClick={() => setIsFeedbackDialogOpen(true)} className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-2" data-testid="nav-feedback">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>feedback or request feature</span>
                                  </button>
                                  <button onClick={toggleTheme} className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" data-testid="nav-dark-theme">
                                    {theme === 'dark' ? (<><Sun className="h-4 w-4" /><span>light mode</span></>) : (<><Moon className="h-4 w-4" /><span>dark mode</span></>)}
                                  </button>
                                  <button onClick={async () => { try { await cognitoSignOut(); localStorage.clear(); window.location.href = "/login"; } catch (error) { console.error("Logout error:", error); } }} className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2" data-testid="nav-logout">
                                    <LogOut className="h-4 w-4" />
                                    <span>logout</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    ) : (<div className="flex flex-col items-center justify-center space-y-4 w-full">
                        <button
                          onClick={() => {
                            window.location.href = "/login";
                          }}
                          className="w-full px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-center"
                          data-testid="nav-login"
                        >
                          Login
                        </button>

                        {/* Voice button — identical to logged-in sidebar */}
                        <button
                          onClick={() => setIsVoiceActive(!isVoiceActive)}
                          className="w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center justify-start"
                          data-testid="nav-voice-guest"
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          <span>Voice</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isVoiceActive ? "rotate-180" : ""}`} />
                        </button>

                        {isVoiceActive && (
                          <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pt-[16px] pb-[16px] mt-[2px] mb-[2px]">
                            <div className="flex flex-col items-center gap-4 px-4">
                              <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">voice profiles</span>
                              <div className="flex items-center justify-center gap-6 py-2 w-full">
                                {(VOICES_BY_LANGUAGE[voiceLanguage] || VOICES_BY_LANGUAGE['en']).map((profile) => {
                                    const isSelected = activeVoiceProfileId === profile.id;
                                    const isMale = profile.gender === 'Male';
                                    const languageText = LANGUAGE_SCRIPTS[voiceLanguage] || 'A';
                                    const isLoadingThis = loadingVoiceId === profile.id;
                                    return (
                                      <div
                                        key={profile.id}
                                        className="flex flex-col items-center gap-1.5 group cursor-pointer"
                                        onClick={async () => {
                                          setActiveVoiceProfileId(profile.id);
                                          if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
                                          const cacheKey = `${profile.id}_${voiceLanguage}`;
                                          if (voiceAudioCacheRef.current[cacheKey]) {
                                            const audio = new Audio(voiceAudioCacheRef.current[cacheKey]);
                                            currentAudioRef.current = audio;
                                            audio.play().catch(err => console.error('🎤 [TTS] Cache play error:', err));
                                            return;
                                          }
                                          setLoadingVoiceId(profile.id);
                                          try {
                                            let audioUrl: string | null = null;
                                            // Prefetch already in-flight — await it instead of firing a duplicate request
                                            if (voicePromiseCacheRef.current[cacheKey]) {
                                              audioUrl = await voicePromiseCacheRef.current[cacheKey];
                                            } else {
                                              const greetings: { [key: string]: (p: string) => string } = {
                                                en: (p) => `Hello! I am ${p}. Welcome to Perala!`,
                                                hi: (p) => `नमस्ते! मैं ${p} हूँ। पेरला में आपका स्वागत है!`,
                                                bn: (p) => `নমস্কার! আমি ${p}। পেরলায় আপনাকে স্঵াগত!`,
                                                ta: (p) => `வணக்கம்! நான் ${p}. பெரலாவில் உங்களை வரவேற்கிறோம்!`,
                                                te: (p) => `నమస్కారం! నేను ${p}. పెరలాలో మీకు స్వాగతం!`,
                                                mr: (p) => `नमस्कार! मी ${p} आहे. पेरलामध्ये तुमचे स्वागत!`,
                                                gu: (p) => `નમસ્તે! હું ${p} છું. પેરલામां आपनुं स्वागत छे!`,
                                                kn: (p) => `ನಮಸ್ಕಾರ! ನಾನು ${p}. ಪೆರಲಾದಲ್ಲಿ ನಿಮಗೆ ಸ್ವಾಗತ!`,
                                                ml: (p) => `നമസ്കാരം! ഞാൻ ${p} ആണ്. പെരലയിലേക്ക് സ്വാഗതം!`,
                                                pa: (p) => `ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ${p} ਹਾਂ। ਪੇਰਲਾ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ!`,
                                                or: (p) => `ନମସ୍କାର! ମୁଁ ${p}। ପେରଲାରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ!`,
                                              };
                                              const text = (greetings[voiceLanguage] || greetings['en'])(profile.name);
                                              const freshPromise: Promise<string | null> = fetch('/api/tts/generate', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ text, language: voiceLanguage || 'en', speaker: profile.id, speed: voiceRate || 1.0, pitch: voicePitch || 1.0 })
                                              }).then(r => r.ok ? r.json() : null).then(data => {
                                                if (data?.audioBase64) {
                                                  const base64Data = data.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
                                                  const binaryString = atob(base64Data);
                                                  const bytes = new Uint8Array(binaryString.length);
                                                  for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
                                                  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
                                                  voiceAudioCacheRef.current[cacheKey] = url;
                                                  delete voicePromiseCacheRef.current[cacheKey];
                                                  return url;
                                                }
                                                delete voicePromiseCacheRef.current[cacheKey];
                                                return null;
                                              }).catch(() => { delete voicePromiseCacheRef.current[cacheKey]; return null; });
                                              voicePromiseCacheRef.current[cacheKey] = freshPromise;
                                              audioUrl = await freshPromise;
                                            }
                                            if (audioUrl) {
                                              const audio = new Audio(audioUrl);
                                              currentAudioRef.current = audio;
                                              audio.play().catch(err => console.error('🎤 [TTS] Audio play error:', err));
                                            }
                                          } catch (error) {
                                            console.error('🎤 [TTS] Error:', error);
                                          } finally {
                                            setLoadingVoiceId(null);
                                          }
                                        }}
                                      >
                                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-105 ${isSelected ? (isMale ? "border-blue-500 ring-2 ring-blue-500/50" : "border-pink-500 ring-2 ring-pink-500/50") : "border-transparent"} active:scale-95 overflow-hidden ${isMale ? 'bg-gradient-to-br from-blue-600 to-blue-400' : 'bg-gradient-to-br from-pink-600 to-pink-400'} shadow-lg`}>
                                          {isLoadingThis ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                          ) : (
                                            <span className="text-xs font-bold text-white">{languageText}</span>
                                          )}
                                        </div>
                                        <span className={`text-[10px] font-medium transition-colors flex items-center gap-1 ${isSelected ? (isMale ? "text-blue-400" : "text-pink-400") + " font-bold" : "text-gray-300 group-hover:" + (isMale ? "text-blue-400" : "text-pink-400")}`}>
                                          {profile.name} {isSelected && !isLoadingThis && <Check className="h-2.5 w-2.5" />}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                              {voiceLangLoading && (
                                <div className="w-full px-1 animate-in fade-in duration-200">
                                  <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-100" style={{ width: `${voiceLangProgress}%` }} />
                                  </div>
                                  <p className="text-[10px] text-blue-400 text-center mt-1 animate-pulse">Setting up new language voices…</p>
                                </div>
                              )}
                              <div className="w-full h-px bg-gray-700/50 my-1" />
                              <div className="w-full">
                                <p className="text-[11px] text-gray-500 italic mb-2 text-center">Language & Voice</p>
                                <select
                                  value={voiceLanguage}
                                  onChange={(e) => { const l = e.target.value; setVoiceLanguage(l); prefetchVoiceAudio(l); }}
                                  className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:border-blue-400 focus:outline-none"
                                >
                                  <option value="en">English (Indian)</option>
                                  <option value="hi">हिंदी (Hindi)</option>
                                  <option value="bn">বাংলা (Bengali)</option>
                                  <option value="ta">தமிழ் (Tamil)</option>
                                  <option value="te">తెలుగు (Telugu)</option>
                                  <option value="mr">मराठी (Marathi)</option>
                                  <option value="gu">ગુજરાતી (Gujarati)</option>
                                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                                  <option value="ml">മലയാളം (Malayalam)</option>
                                  <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                                  <option value="or">ଓଡ଼ିଆ (Odia)</option>
                                </select>
                              </div>
                              <p className="text-[11px] text-gray-500 italic text-center pb-1">Select a voice for your audio post</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>



                {/* Two-line Hamburger Icon - Mobile only - Theme responsive - Fixed position */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNavOpen(!isNavOpen);
                  }}
                  className={`fixed top-4 right-4 z-50 w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all duration-300 ${searchResults ? 'hidden' : 'md:hidden'}`}
                  data-testid="button-nav-toggle"
                >
                  <div
                    className={`h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isNavOpen ? "w-5 rotate-45 translate-y-1" : "w-5"}`}
                  ></div>
                  <div
                    className={`h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isNavOpen ? "w-5 -rotate-45 -translate-y-1" : "w-4 ml-1"}`}
                  ></div>
                </button>

                {/* Home Screen - Stacks on top with card effect */}
                <div
                  onClick={() => isNavOpen && setIsNavOpen(false)}
                  className={`min-h-screen bg-gray-900 flex flex-col transition-all duration-500 ease-out relative z-20 ${
                    isNavOpen
                      ? "scale-[0.88] -translate-x-[82%] rounded-r-3xl shadow-2xl"
                      : "scale-100 translate-x-0"
                  }`}
                  style={{
                    transformOrigin: "right center",
                  }}
                >
                  {/* World Map Section - 35% of viewport height */}
                  {!searchResults && (
                    <div className="w-full flex items-center justify-center h-[35vh]" style={{ background: theme === 'dark' ? '#1a1a1a' : '#e3f2fd' }}>
                      <div className="w-full h-full">
                        <Suspense fallback={null}>
                          <WorldMap />
                        </Suspense>
                      </div>
                    </div>
                  )}

                  {/* Mobile Greeting - Visible only on mobile */}
                  <div className="w-full hidden bg-blue-900 px-4 py-3 flex justify-center pt-[1px] pb-[1px] pt-[1px] pb-[1px]">
                    <div className="text-center">
                      {isViewOnlyMode ? (
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-400" />
                          <h1 className="text-lg font-normal text-gray-100">
                            Welcome to Trading Platform
                          </h1>
                        </div>
                      ) : showingInitialGreeting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-400" />
                          <h1 className="text-lg font-normal text-gray-100">
                            Hey {currentUser?.displayName || currentUser?.username || "Trader"}
                          </h1>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          {animatedStocks[currentStockIndex].isProfit ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          )}
                          <span className={`text-sm font-semibold ${animatedStocks[currentStockIndex].isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {animatedStocks[currentStockIndex].symbol}: {animatedStocks[currentStockIndex].price}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blue Section: Expands to 100% when search results show, fixed height otherwise */}
                  <div className={`dark-scrollbar-area w-full bg-blue-900 flex flex-col items-center justify-start md:py-3 py-0 relative overflow-y-auto ${
                    searchResults ? "h-screen px-3 md:px-4" : "h-[65vh] px-0 md:px-4"
                  }`}>
                    <div className="max-w-4xl w-full md:space-y-2">
                      {/* Dynamic Greeting - Hidden on mobile */}
                    

                      {/* Magic Flash Bar - Auto-cycling highlights from all tabs */}
                      <div className="relative mx-auto md:block hidden max-w-4xl">
                        {(() => {
                          const item = flashBarItems[flashBarIndex] || flashBarItems[0];
                          if (!item) return null;
                          return (
                            <button
                              data-testid="flash-bar"
                              onClick={() => {
                                if (item.tab === 'watchlist') {
                                  setSearchResults("[CHART:WATCHLIST]");
                                  setIsSearchActive(true);
                                } else if (item.tab === 'market-news') {
                                  setSearchResults("[CHART:MARKET_NEWS]");
                                  setIsSearchActive(true);
                                  fetchNifty50News();
                                } else if (item.tab === 'trade-challenge') {
                                  setSearchResults("[CHART:TRADE]");
                                  setIsSearchActive(true);
                                } else if (item.tab === 'social') {
                                  setIsSearchActive(true);
                                  setSearchResults("[CHART:SOCIAL_FEED]");
                                  fetchSocialFeedData();
                                } else if (item.tab === 'journal') {
                                  const userId = localStorage.getItem('currentUserId');
                                  const userEmail = localStorage.getItem('currentUserEmail');
                                  if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
                                    setLocation('/login');
                                    return;
                                  }
                                  generateJournalAIReport();
                                }
                              }}
                              className="w-full h-9 rounded-2xl bg-gray-800/70 border border-gray-700/60 hover:border-gray-500 hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 px-3 text-left group mt-[0px] mb-[0px] pl-[12px] pr-[12px] pt-[20px] pb-[20px]"
                            >
                              {/* Live dot */}
                              <span className="relative flex-shrink-0 hidden md:flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                              </span>

                              {/* Category badge */}
                              <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.colorClass} uppercase tracking-wide`}>
                                {item.category}
                              </span>

                              {/* Cycling content — sparkline for watchlist, text otherwise */}
                              <span
                                className="flex-1 min-w-0 flex items-center gap-2 transition-opacity duration-200 overflow-hidden"
                                style={{ opacity: flashBarVisible ? 1 : 0 }}
                              >
                                {item.category === 'Journal' && journalFlashStats ? (() => {
                                  const { totalPnL, totalTrades, winRate, tradingDays } = journalFlashStats;
                                  const isPositive = totalPnL >= 0;
                                  return (
                                    <>
                                      <span className="text-sm font-semibold text-gray-100 flex-shrink-0">Journal</span>
                                      <span className={`text-sm font-bold flex-shrink-0 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPositive ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                      </span>
                                      <span className={`text-[11px] flex-shrink-0 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        P&L
                                      </span>
                                      <span className="flex-shrink-0 w-px h-3 bg-gray-700 mx-0.5" />
                                      <span className="text-[11px] text-gray-400 flex-shrink-0">{totalTrades} trades</span>
                                      <span className="flex-shrink-0 w-px h-3 bg-gray-700 mx-0.5" />
                                      <span className="text-[11px] text-gray-400 flex-shrink-0">{winRate.toFixed(0)}% win</span>
                                      <span className="flex-shrink-0 w-px h-3 bg-gray-700 mx-0.5" />
                                      <span className="text-[11px] text-gray-500 flex-shrink-0">{tradingDays}d</span>
                                    </>
                                  );
                                })() : item.category === 'News' ? (() => {
                                  const niftyPrices = nifty50FormattedData.map((d: any) => d.price).filter((p: number) => p > 0);
                                  const minP = niftyPrices.length >= 2 ? Math.min(...niftyPrices) : 0;
                                  const maxP = niftyPrices.length >= 2 ? Math.max(...niftyPrices) : 0;
                                  const rangeP = maxP - minP || 1;
                                  const W = 52, H = 18;
                                  const pts = niftyPrices.length >= 2
                                    ? niftyPrices.map((p: number, i: number) => `${(i / (niftyPrices.length - 1)) * W},${H - ((p - minP) / rangeP) * H}`).join(' ')
                                    : '';
                                  const lastP = niftyPrices[niftyPrices.length - 1] || 0;
                                  const firstP = niftyPrices[0] || 0;
                                  const isUp = lastP >= firstP;
                                  const changePct = firstP ? ((lastP - firstP) / firstP) * 100 : 0;
                                  return (
                                    <>
                                      <span className="text-sm text-gray-300 truncate min-w-0 flex-1">{item.text}</span>
                                      {pts && (
                                        <>
                                          <span className="flex-shrink-0 w-px h-3 bg-gray-600 mx-0.5" />
                                          <span className="text-[11px] font-mono flex-shrink-0 text-gray-400">N50</span>
                                          <span className={`text-[11px] flex-shrink-0 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                            {isUp ? '▲' : '▼'}{Math.abs(changePct).toFixed(2)}%
                                          </span>
                                          <svg width={W} height={H} className="flex-shrink-0" style={{ overflow: 'visible' }}>
                                            <polyline points={pts} fill="none" stroke={isUp ? '#4ade80' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        </>
                                      )}
                                    </>
                                  );
                                })() : item.category === 'Watchlist' && item.symbol && newsStockPrices[item.symbol] ? (() => {
                                  const sd = newsStockPrices[item.symbol];
                                  const sym = item.symbol;
                                  const isUp = sd.changePercent >= 0;
                                  const rawPrices = (sd.chartData || []).map((d: any) => d.price).filter((p: number) => p > 0);
                                  const fallbackPrices = (flashBarFallbackChartData[sym] ?? []).map((d: any) => d.price).filter((p: number) => p > 0);
                                  const prices = rawPrices.length >= 2 ? rawPrices : (fallbackPrices.length >= 2 ? fallbackPrices : []);
                                  const minP = prices.length >= 2 ? Math.min(...prices) : 0;
                                  const maxP = prices.length >= 2 ? Math.max(...prices) : 0;
                                  const range = maxP - minP || sd.price * 0.001 || 1;
                                  const W = 52, H = 18;
                                  const pts = prices.length >= 2 ? prices.map((p: number, i: number) => `${(i / (prices.length - 1)) * W},${H - ((p - minP) / range) * H}`).join(' ') : '';
                                  const newsSource = nifty50NewsItems.length > 0 ? nifty50NewsItems : marketNewsItems;
                                  const latestNews = newsSource.find((n: any) => n.symbol === sym)?.title || null;
                                  return (
                                    <>
                                      <span className="text-sm font-semibold text-gray-100 flex-shrink-0">{item.text}</span>
                                      <span className={`text-sm font-bold flex-shrink-0 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                        ₹{sd.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                      </span>
                                      <span className={`text-[11px] flex-shrink-0 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                        {isUp ? '▲' : '▼'}{Math.abs(sd.changePercent).toFixed(2)}%
                                      </span>
                                      {pts && (
                                        <svg width={W} height={H} className="flex-shrink-0" style={{ overflow: 'visible' }}>
                                          <polyline points={pts} fill="none" stroke={isUp ? '#4ade80' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      )}
                                      {latestNews && (
                                        <>
                                          <span className="flex-shrink-0 w-px h-3 bg-gray-600 mx-0.5" />
                                          <span className="text-[11px] text-gray-400 truncate min-w-0">{latestNews}</span>
                                        </>
                                      )}
                                    </>
                                  );
                                })() : (
                                  <span className="text-sm text-gray-300 truncate">{item.text}</span>
                                )}
                              </span>

                              {/* Progress dots */}
                              <span className="flex-shrink-0 flex items-center gap-[3px]">
                                {Array.from({ length: Math.min(flashBarItems.length, 8) }).map((_, i) => (
                                  <span
                                    key={i}
                                    className="block rounded-full transition-all duration-300"
                                    style={{
                                      width: i === flashBarIndex % Math.min(flashBarItems.length, 8) ? 10 : 4,
                                      height: 4,
                                      background: i === flashBarIndex % Math.min(flashBarItems.length, 8) ? '#60a5fa' : '#374151',
                                    }}
                                  />
                                ))}
                              </span>

                              {/* Arrow hint */}
                              <span className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2.5l4.5 4.5L5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </span>
                            </button>
                          );
                        })()}
                      </div>

        {/* Feedback / Request Feature Dialog */}
        <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-0 overflow-hidden rounded-2xl [&>button]:hidden">
            <div className="relative p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feedbackType === "feedback" ? "Send us feedback" : "Request feature"}
                  </h2>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setFeedbackType("feedback")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${feedbackType === 'feedback' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500'}`}
                    >
                      Feedback
                    </button>
                    <button 
                      onClick={() => setFeedbackType("request")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${feedbackType === 'request' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500'}`}
                    >
                      Request
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative mb-6">
                <Textarea 
                  placeholder={feedbackType === "feedback" ? "How can we improve Origin UI?" : "What feature would you like to see?"}
                  className="min-h-[120px] bg-white dark:bg-gray-950 border-gray-700 dark:border-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:ring-blue-500 rounded-xl"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1">
                  {feedbackType === "feedback" && [1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`h-5 w-5 cursor-pointer transition-colors ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'}`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                  disabled={isFeedbackSubmitting || feedbackSubmitSuccess || !feedbackText.trim()}
                  onClick={async () => {
                    if (!feedbackText.trim()) return;
                    setIsFeedbackSubmitting(true);
                    try {
                      const authToken = localStorage.getItem("cognitoAccessToken") || localStorage.getItem("angelOneJwt") || "";
                      const res = await fetch("/api/feedback", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
                        },
                        body: JSON.stringify({ type: feedbackType, text: feedbackText, rating })
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || "Submission failed");
                      }
                      setFeedbackSubmitSuccess(true);
                      setFeedbackText("");
                      setRating(0);
                      toast({
                        title: feedbackType === "feedback" ? "Feedback received!" : "Feature request sent!",
                        description: feedbackType === "feedback"
                          ? "Thank you for your feedback. We'll review it soon."
                          : "Your feature request has been noted. We'll look into it!",
                      });
                      setTimeout(() => {
                        setFeedbackSubmitSuccess(false);
                        setIsFeedbackDialogOpen(false);
                      }, 1500);
                    } catch (err: any) {
                      console.error("Error submitting feedback:", err);
                      toast({
                        variant: "destructive",
                        title: "Failed to submit",
                        description: err?.message || "Something went wrong. Please try again.",
                      });
                    } finally {
                      setIsFeedbackSubmitting(false);
                    }
                  }}
                >
                  {feedbackSubmitSuccess ? "Sent!" : isFeedbackSubmitting ? "Sending..." : feedbackType === "feedback" ? "Send feedback" : "Request feature"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

                      {/* AI Search Results - All screen sizes for all tabs */}
                      {isSearchActive && (
                        <div className={`max-w-5xl mx-auto mt-4 animate-in slide-in-from-top-4 duration-300 ${(searchResults || isSearchLoading) ? 'block pb-20' : 'hidden md:block'}`}>
                          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
                            {isSearchLoading ? (
                              <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="relative flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-blue-500 animate-spin" />
                                  <div className="absolute w-4 h-4 rounded-full border-2 border-gray-700 border-t-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
                                </div>
                                <span className="text-xs text-gray-500 animate-pulse tracking-wide">Generating report…</span>
                              </div>
                            ) : searchResults ? (
                              <div className="space-y-1 p-3 md:p-4">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
                                  <div className="flex items-center gap-2">
                                  {searchResults.includes("[CHART:WATCHLIST]") ? (
                                      <>
                      <Eye className="h-4 w-4 text-blue-400" />
                      <h3 className="text-base md:text-lg font-medium text-gray-100">
                        Watchlist
                                      </h3>
                                      </>
                                    ) : searchResults.includes("[CHART:MARKET_NEWS]") ? (
                                      <>
                      <Newspaper className="h-4 w-4 text-green-400" />
                      <h3 className="text-base md:text-lg font-medium text-gray-100">
                        Market News
                                      </h3>
                                      </>
                                    ) : searchResults.includes("[CHART:TRADE]") ? (
                                      <>
                      <Trophy className="h-4 w-4 text-orange-400" />
                      <h3 className="text-base md:text-lg font-medium text-gray-100">
                        Trading Challenge
                                      </h3>
                                      </>
                                    ) : searchResults.includes("[CHART:JOURNAL_REPORT]") ? (
                                      <>
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-base md:text-lg font-medium text-gray-100">
                        Journal Report
                                      </h3>
                                      </>
                                    ) : searchResults.includes("[CHART:SOCIAL_FEED]") ? (
                                      <>
                      <User className="h-4 w-4 text-pink-400" />
                      <h3 className="text-base md:text-lg font-medium text-gray-100">
                        Social Feed Insights
                                      </h3>
                                      </>
                                    ) : (
                                      <>
                      <Bot className="h-4 w-4 text-blue-400" />
                      <h3 className="text-base md:text-lg font-medium text-gray-100">
                        Full Report
                                      </h3>
                                      </>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => { setSearchResults(""); setIsSearchActive(false); setSearchQuery(""); }}
                                    className="text-gray-400 hover:text-gray-200 p-1 rounded-lg hover:bg-gray-700/50 transition-colors"
                                    data-testid="button-close-results"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="max-w-none">
                                  <div className="text-gray-300 leading-relaxed">
                                    {(() => {
                                      let renderedContent: any = null;
                                      let processedResults = searchResults;

                                      // Strip metadata/noise from AI text parts before rendering
                                      const cleanReportPart = (text: string): string => {
                                        if (!text) return '';
                                        return text
                                          .replace(/^\*\*Analysis for:\*\*[^\n]*/gm, '')
                                          .replace(/##\s[^\n]+\n[\s\S]*?\*Data from:[^\n]*\*[^\n]*/g, '')
                                          .replace(/\*Data from:[^\n]*\*/g, '')
                                          .replace(/^---\s*\*\*Sources:\*\*[^\n]*/gm, '')
                                          .replace(/^---+\s*$/gm, '')
                                          .replace(/^[,\s]+$/gm, '')
                                          .replace(/\n{3,}/g, '\n\n')
                                          .trim();
                                      };

                                      // Minimal market-news-style renderer for AI report text
                                      const renderReportText = (text: string) => {
                                        if (!text || !text.trim()) return null;
                                        const lines = text.split('\n');
                                        const items: Array<{type: string; content: string; key?: string; value?: string}> = [];
                                        lines.forEach(line => {
                                          const t = line.trim();
                                          if (!t || t === '---') return;
                                          if (t.startsWith('## ')) {
                                            items.push({ type: 'h2', content: t.replace(/^##\s*/, '').replace(/\*\*/g, '') });
                                          } else if (t.startsWith('### ')) {
                                            items.push({ type: 'h3', content: t.replace(/^###\s*/, '').replace(/\*\*/g, '') });
                                          } else if (/^\*\*[^*]+:\*\*/.test(t)) {
                                            const m = t.match(/^\*\*([^*]+):\*\*\s*(.*)/);
                                            if (m) items.push({ type: 'kv', key: m[1], value: m[2].replace(/\*\*/g, '').replace(/\*/g, '') });
                                            else items.push({ type: 'text', content: t.replace(/\*\*/g, '').replace(/\*/g, '') });
                                          } else if (t.startsWith('- ') || t.startsWith('• ')) {
                                            items.push({ type: 'bullet', content: t.slice(2).replace(/\*\*/g, '').replace(/\*/g, '') });
                                          } else {
                                            items.push({ type: 'text', content: t.replace(/\*\*/g, '').replace(/\*/g, '') });
                                          }
                                        });
                                        return (
                                          <div className="w-full rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden">
                                            <div className="divide-y divide-gray-800/70">
                                              {items.map((it, i) => {
                                                if (it.type === 'h2') return (
                                                  <div key={i} className="px-4 py-2.5 bg-gray-900/60 flex items-center gap-2">
                                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{it.content}</span>
                                                  </div>
                                                );
                                                if (it.type === 'h3') return (
                                                  <div key={i} className="px-4 py-2 bg-gray-900/30">
                                                    <span className="text-xs font-medium text-gray-400">{it.content}</span>
                                                  </div>
                                                );
                                                if (it.type === 'kv') return (
                                                  <div key={i} className="px-4 py-2.5 flex items-baseline gap-3 hover:bg-gray-800/30 transition-colors">
                                                    <span className="text-[11px] text-gray-500 shrink-0 w-32">{it.key}</span>
                                                    <span className="text-xs text-gray-200 flex-1 leading-relaxed">{it.value}</span>
                                                  </div>
                                                );
                                                if (it.type === 'bullet') return (
                                                  <div key={i} className="px-4 py-2 flex items-start gap-2">
                                                    <span className="text-gray-600 text-[10px] mt-0.5 shrink-0">·</span>
                                                    <span className="text-xs text-gray-400 leading-relaxed">{it.content}</span>
                                                  </div>
                                                );
                                                return (
                                                  <div key={i} className="px-4 py-2">
                                                    <span className="text-xs text-gray-400 leading-relaxed">{it.content}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      };

                                      // Handle Market News view
                                      if (searchResults.includes("[CHART:MARKET_NEWS]")) {
                                        return (
                                          <MarketNewsResultTab
                                            marketNewsMode={marketNewsMode}
                                            setMarketNewsMode={setMarketNewsMode}
                                            allMarketNewsItems={allMarketNewsItems}
                                            isAllMarketNewsLoading={isAllMarketNewsLoading}
                                            nifty50NewsItems={nifty50NewsItems}
                                            isNifty50NewsLoading={isNifty50NewsLoading}
                                            marketNewsItems={marketNewsItems}
                                            isMarketNewsLoading={isMarketNewsLoading}
                                            newsSelectedSector={newsSelectedSector}
                                            setNewsSelectedSector={setNewsSelectedSector}
                                            showNewsAiPanel={showNewsAiPanel}
                                            setShowNewsAiPanel={setShowNewsAiPanel}
                                            newsAiAnalysis={newsAiAnalysis}
                                            setNewsAiAnalysis={setNewsAiAnalysis}
                                            isNewsAiAnalysisLoading={isNewsAiAnalysisLoading}
                                            setIsNewsAiAnalysisLoading={setIsNewsAiAnalysisLoading}
                                            newsAiAnalysisError={newsAiAnalysisError}
                                            setNewsAiAnalysisError={setNewsAiAnalysisError}
                                            newsStockPrices={newsStockPrices}
                                            watchlistSymbols={watchlistSymbols}
                                            fetchMarketNews={fetchMarketNews}
                                            fetchAllMarketNews={fetchAllMarketNews}
                                            fetchNifty50News={fetchNifty50News}
                                            getWatchlistNewsRelativeTime={getWatchlistNewsRelativeTime}
                                          />
                                        );
                                      }

                                      // Handle price chart at the top
                                      if (searchResults.includes("[CHART:PRICE_CHART]")) {
                                        const priceChartData =
                                          (window as any).aiAssistantPriceChartData || [];
                                        const stockData = (window as any).aiAssistantStockData || {};
                                        const parts = searchResults.split("[CHART:PRICE_CHART]");
                                        processedResults = parts[1] || "";

                                        const timeframes = ['1D', '5D', '1M', '6M', '1Y'];
                                        const selectedTimeframe = aiChartSelectedTimeframe;

                                        // Extract price data from chart data
                                        const lastCandle = priceChartData[priceChartData.length - 1];
                                        const firstCandle = priceChartData[0];
                                        const currentPrice = lastCandle?.price || 0;
                                        const priceChange = lastCandle && firstCandle ? lastCandle.price - firstCandle.price : 0;
                                        const changePercent = firstCandle?.price ? (priceChange / firstCandle.price) * 100 : 0;
                                        const stockName = stockData.name || 'Stock Price';

                                        renderedContent = (
                                          <div className="flex gap-4">
                                            {priceChartData.length > 0 && (
                                              <div className="flex-1 mb-4 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                                {/* Header with timeframes and price info */}
                                                <div className="mb-4">
                                                  <div className="flex items-center justify-between mb-3">
                                                    {/* Timeframe buttons */}
                                                    <div className="flex gap-1.5">
                                                      {timeframes.map((tf) => (
                                                        <button
                                                          key={tf}
                                                          onClick={async () => {
                                                            setAiChartSelectedTimeframe(tf);
                                                            (window as any).aiAssistantSelectedTimeframe = tf;
                                                            // Fetch new chart data for the selected timeframe
                                                            const symbol = (window as any).companyInsightsData?.symbol || '';
                                                            if (symbol) {
                                                              try {
                                                                const response = await fetch(getFullApiUrl(`/api/stock-chart-data/${symbol}?timeframe=${tf}`));
                                                                if (response.ok) {
                                                                  const newChartData = await response.json();
                                                                  if (newChartData && newChartData.length > 0) {
                                                                    (window as any).aiAssistantPriceChartData = newChartData;
                                                                    window.dispatchEvent(new Event('timeframeChange'));
                                                                  }
                                                                }
                                                              } catch (error) {
                                                                console.warn("Failed to fetch chart data for timeframe:", error);
                                                              }
                                                            }
                                                          }}
                                                          data-testid={`button-timeframe-${tf}`}
                                                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                                            selectedTimeframe === tf
                                                              ? 'bg-blue-500 text-white'
                                                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                          }`}
                                                        >
                                                          {tf}
                                                        </button>
                                                      ))}
                                                    </div>

                                                    {/* Price info on right */}
                                                    <div className="text-right">
                                                      <div className="flex items-center justify-between w-full justify-between">
                                                        <div>
                                                          <div className="text-sm font-semibold text-gray-100">
                                                            ₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                          </div>
                                                          <div className={`text-xs font-medium ${
                                                            priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                          }`}>
                                                            {priceChange >= 0 ? '↑' : '↓'} ₹{Math.abs(priceChange).toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Stock name below timeframes */}
                                                  <div className="text-sm font-medium text-gray-300 mb-3">
                                                    {stockName}
                                                  </div>
                                                </div>

                                                <div className="h-56 w-full">
                                                  <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={priceChartData} margin={{ top: 5, right: 20, left: 1.5, bottom: 5 }}>
                                                      <XAxis 
                                                        dataKey="time" 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                                        tickCount={8}
                                                      />
                                                      <YAxis 
                                                        domain={['dataMin - 10', 'dataMax + 10']}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                                        width={35}
                                                        tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                                                      />
                                                      <Tooltip 
                                                        content={({ active, payload, label }) => {
                                                          if (!active || !payload || !payload.length) return null;
                                                          const value = payload[0].value;
                                                          return (
                                                            <div style={{
                                                              backgroundColor: '#1e293b',
                                                              border: '1px solid #334155',
                                                              borderRadius: '6px',
                                                              color: '#e2e8f0',
                                                              padding: '8px 16px',
                                                              fontSize: '13px',
                                                              minWidth: '140px',
                                                              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              gap: '12px'
                                                            }}>
                                                              <span style={{ fontSize: '13px', fontWeight: '500' }}>
                                                                ₹{Number(value).toFixed(2)}
                                                              </span>
                                                              <div style={{
                                                                width: '1px',
                                                                height: '20px',
                                                                backgroundColor: '#475569'
                                                              }}></div>
                                                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                                {label}
                                                              </span>
                                                            </div>
                                                          );
                                                        }}
                                                      />
                                                      <Line 
                                                        type="linear" 
                                                        dataKey="price" 
                                                        stroke="#ef4444"
                                                        strokeWidth={2}
                                                        dot={false}
                                                        activeDot={{ r: 4, fill: '#ef4444' }}
                                                      />
                                                      {currentPrice > 0 && (
                                                        <ReferenceLine 
                                                          y={currentPrice}
                                                          stroke={priceChange >= 0 ? '#22c55e' : '#ef4444'}
                                                          strokeDasharray="4 4"
                                                          strokeWidth={1}
                                                          opacity={0.6}
                                                        />
                                                      )}
                                                    </LineChart>
                                                  </ResponsiveContainer>
                                                </div>

                                                {/* OHLC Display Section */}
                                                {priceChartData.length > 0 && (() => {
                                                  const firstCandle = priceChartData[0];
                                                  const lastCandle = priceChartData[priceChartData.length - 1];
                                                  const prices = priceChartData.map((candle: any) => candle.price);
                                                  const open = firstCandle?.price || 0;
                                                  const high = Math.max(...prices);
                                                  const low = Math.min(...prices);
                                                  const close = lastCandle?.price || 0;

                                                  return (
                                                    <div className="mt-4 grid grid-cols-4 justify-between justify-between gap-2">
                                                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                        <div className="text-xs font-medium text-gray-400 mb-1">Open</div>
                                                        <div className="text-sm font-semibold text-gray-100">₹{open.toFixed(2)}</div>
                                                      </div>
                                                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                        <div className="text-xs font-medium text-gray-400 mb-1">High</div>
                                                        <div className="text-sm font-semibold text-green-400">₹{high.toFixed(2)}</div>
                                                      </div>
                                                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                        <div className="text-xs font-medium text-gray-400 mb-1">Low</div>
                                                        <div className="text-sm font-semibold text-red-400">₹{low.toFixed(2)}</div>
                                                      </div>
                                                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                                        <div className="text-xs font-medium text-gray-400 mb-1">Close</div>
                                                        <div className={`text-sm font-semibold ${close >= open ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>₹{close.toFixed(2)}</div>
                                                        <div className={`text-xs font-medium ${close >= open ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                          {close >= open ? '+' : ''}{((close - open) / open * 100).toFixed(2)}%
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })()}
                                              </div>
                                            )}
                                            {/* Related News for Search Results */}
                                            <div className="flex-1 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                              <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                  <Clock className="h-4 w-4 text-gray-400" />
                                                  <h3 className="text-sm font-medium text-gray-200">
                                                    Related News
                                                  </h3>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 text-xs text-gray-400 hover:text-gray-200"
                                                  onClick={() => {
                                                    setIsWatchlistNewsLoading(true);
                                                    const symbol = (window as any).companyInsightsData?.symbol || searchResultsNewsSymbol;
                                                    if (symbol) {
                                                      const cleanSymbol = symbol.replace('-EQ', '').replace('-BE', '');
                                                      fetch(`/api/stock-news/${cleanSymbol}?refresh=${Date.now()}`)
                                                        .then(res => res.json())
                                                        .then(data => {
                                                          const newsItems = Array.isArray(data) ? data : (data.news || []);
                                                          setWatchlistNews(newsItems.slice(0, 20));
                                                        })
                                                        .finally(() => setIsWatchlistNewsLoading(false));
                                                    }
                                                  }}
                                                  data-testid="button-refresh-search-news"
                                                >
                                                  <RefreshCw className={`h-3 w-3 mr-1 ${isWatchlistNewsLoading ? 'animate-spin' : ''}`} />
                                                  Refresh
                                                </Button>
                                              </div>

                                              <div className="space-y-3 max-h-[320px] overflow-y-auto mb-4">
                                                {isWatchlistNewsLoading ? (
                                                  <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                                  </div>
                                                ) : watchlistNews.length > 0 ? (
                                                  watchlistNews.map((item, index) => (
                                                    <div 
                                                      key={index} 
                                                      className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer border border-gray-700"
                                                      onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                                                      data-testid={`search-news-item-${index}`}
                                                    >
                                                      <h4 className="text-gray-200 font-medium text-sm mb-2 hover:text-gray-100 transition-colors line-clamp-2">
                                                        {item.title} <ExternalLink className="h-3 w-3 inline ml-1" />
                                                      </h4>
                                                      <p className="text-gray-400 text-xs line-clamp-3">{item.summary}</p>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <div className="text-center py-8">
                                                    <p className="text-gray-400 text-sm">No news available</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      }

                                      // Handle Watchlist view
                                      if (searchResults.includes("[CHART:WATCHLIST]")) {
                                        return (
                                          <Suspense fallback={null}>
                                          <WatchlistResultTab
                                            watchlistSymbols={watchlistSymbols}
                                            selectedWatchlistSymbol={selectedWatchlistSymbol}
                                            setSelectedWatchlistSymbol={setSelectedWatchlistSymbol}
                                            watchlistNews={watchlistNews}
                                            setWatchlistNews={setWatchlistNews}
                                            isWatchlistNewsLoading={isWatchlistNewsLoading}
                                            setIsWatchlistNewsLoading={setIsWatchlistNewsLoading}
                                            allWatchlistQuarterlyData={allWatchlistQuarterlyData}
                                            setAllWatchlistQuarterlyData={setAllWatchlistQuarterlyData}
                                            isWatchlistQuarterlyLoading={isWatchlistQuarterlyLoading}
                                            setIsWatchlistQuarterlyLoading={setIsWatchlistQuarterlyLoading}
                                            searchResultsNewsSymbol={searchResultsNewsSymbol}
                                            watchlistSearchQuery={watchlistSearchQuery}
                                            setWatchlistSearchQuery={setWatchlistSearchQuery}
                                            watchlistDropdownOpen={watchlistDropdownOpen}
                                            setWatchlistDropdownOpen={setWatchlistDropdownOpen}
                                            compareSymbols={compareSymbols}
                                            setCompareSymbols={setCompareSymbols}
                                            compareQuarterlyData={compareQuarterlyData}
                                            compareNewsData={compareNewsData}
                                            compareAnalysisData={compareAnalysisData}
                                            compareLoading={compareLoading}
                                            compareAiInsights={compareAiInsights}
                                            setCompareAiInsights={setCompareAiInsights}
                                            showCompareResults={showCompareResults}
                                            setShowCompareResults={setShowCompareResults}
                                            compareActiveTab={compareActiveTab}
                                            setCompareActiveTab={setCompareActiveTab}
                                            showFullReport={showFullReport}
                                            setShowFullReport={setShowFullReport}
                                            fullReportLoading={fullReportLoading}
                                            fullReportData={fullReportData}
                                            fullReportActiveTab={fullReportActiveTab}
                                            setFullReportActiveTab={setFullReportActiveTab}
                                            fullReportSymbol={fullReportSymbol}
                                            nifty50Timeframe={nifty50Timeframe}
                                            setNifty50Timeframe={setNifty50Timeframe}
                                            niftyBankTimeframe={niftyBankTimeframe}
                                            setNiftyBankTimeframe={setNiftyBankTimeframe}
                                            nifty50FormattedData={nifty50FormattedData}
                                            niftyBankFormattedData={niftyBankFormattedData}
                                            isNifty50Loading={isNifty50Loading}
                                            isNiftyBankLoading={isNiftyBankLoading}
                                            getNifty50CurrentPrice={getNifty50CurrentPrice}
                                            getNifty50Change={getNifty50Change}
                                            getNiftyBankCurrentPrice={getNiftyBankCurrentPrice}
                                            getNiftyBankChange={getNiftyBankChange}
                                            addToWatchlist={addToWatchlist}
                                            removeFromWatchlist={removeFromWatchlist}
                                            handleViewFullReport={handleViewFullReport}
                                            handleCompareAnalysis={handleCompareAnalysis}
                                            getWatchlistNewsRelativeTime={getWatchlistNewsRelativeTime}
                                          />
                                          </Suspense>
                                        );
                                      }

                                      // Render text with inline charts
                                      if (
                                        processedResults.includes(
                                          "[CHART:PERFORMANCE_TREND]",
                                        )
                                      ) {
                                        const parts = processedResults.split(
                                          "[CHART:PERFORMANCE_TREND]",
                                        );
                                        const chartData =
                                          (window as any)
                                            .performanceTrendChartData || [];

                                        processedResults = parts[1] || "";

                                        const performanceContent = (
                                          <>
                                            {parts[0]}
                                            {chartData.length > 0 && (
                                              <div className="my-4 bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                                                <div className="h-32 w-full">
                                                  <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                  >
                                                    <AreaChart
                                                      data={chartData}
                                                      margin={{
                                                        top: 20,
                                                        right: 20,
                                                        left: 10,
                                                        bottom: 5,
                                                      }}
                                                    >
                                                      <defs>
                                                        <linearGradient
                                                          id="aiAreaGradient"
                                                          x1="0"
                                                          y1="0"
                                                          x2="0"
                                                          y2="1"
                                                        >
                                                          <stop
                                                            offset="0%"
                                                            stopColor="rgb(107, 114, 128)"
                                                            stopOpacity={0.6}
                                                          />
                                                          <stop
                                                            offset="100%"
                                                            stopColor="rgb(107, 114, 128)"
                                                            stopOpacity={0.1}
                                                          />
                                                        </linearGradient>
                                                      </defs>
                                                      <XAxis
                                                        dataKey="day"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={false}
                                                        className="text-slate-500 dark:text-slate-400"
                                                      />
                                                      <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{
                                                          fontSize: 10,
                                                          fill: "#64748b",
                                                        }}
                                                        tickFormatter={(
                                                          value,
                                                        ) =>
                                                          `${
                                                            value >= 0
                                                              ? ""
                                                              : "-"
                                                          }${(
                                                            Math.abs(value) /
                                                            1000
                                                          ).toFixed(0)}K`
                                                        }
                                                        domain={[
                                                          "dataMin - 1000",
                                                          "dataMax + 1000",
                                                        ]}
                                                        className="text-slate-500 dark:text-slate-400"
                                                      />
                                                      <Tooltip
                                                        contentStyle={{
                                                          background:
                                                            "var(--background)",
                                                          border:
                                                            "1px solid var(--border)",
                                                          borderRadius: "8px",
                                                          color:
                                                            "var(--foreground)",
                                                          fontSize: "11px",
                                                          padding: "6px 10px",
                                                        }}
                                                        formatter={(
                                                          value: any,
                                                        ) => [
                                                          `${
                                                            value >= 0
                                                              ? "₹"
                                                              : "-₹"
                                                          }${Math.abs(
                                                            value,
                                                          ).toLocaleString()}`,
                                                          "Daily P&L",
                                                        ]}
                                                        labelFormatter={(
                                                          label,
                                                        ) => `${label}`}
                                                      />
                                                      <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#000000"
                                                        strokeWidth={2}
                                                        fill="url(#aiAreaGradient)"
                                                        dot={false}
                                                        activeDot={{
                                                          r: 4,
                                                          stroke: "#000000",
                                                          strokeWidth: 1,
                                                          fill: "#ffffff",
                                                        }}
                                                      />
                                                    </AreaChart>
                                                  </ResponsiveContainer>
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        );

                                        renderedContent = renderedContent ? 
                                          <>{renderedContent}{performanceContent}</> : 
                                          performanceContent;
                                      }

                                      // Company Insights Chart with quarterly performance trend
                                      if (
                                        processedResults.includes(
                                          "[CHART:COMPANY_INSIGHTS]",
                                        )
                                      ) {
                                        const parts = processedResults.split(
                                          "[CHART:COMPANY_INSIGHTS]",
                                        );
                                        const companyInsights =
                                          (window as any).companyInsightsData || null;

                                        // Use structured data from API response - show ACTUAL revenue values
                                        const chartData: Array<{quarter: string; value: number; revenue: number; trend: string; changePercent: number}> = [];

                                        if (companyInsights && companyInsights.quarterlyPerformance) {
                                          companyInsights.quarterlyPerformance.forEach((q: any) => {
                                            // Use actual revenue value from scraped data
                                            const actualRevenue = q.value || q.revenue || 0;
                                            chartData.push({
                                              quarter: q.quarter,
                                              value: actualRevenue, // Actual revenue in Crores
                                              revenue: actualRevenue,
                                              trend: q.changePercent >= 0 ? 'positive' : 'negative',
                                              changePercent: q.changePercent || 0
                                            });
                                          });
                                        }

                                        // Use trend from structured data or calculate from chart
                                        const overallTrend = companyInsights?.trend || 
                                          (chartData.length > 1 
                                            ? chartData[chartData.length - 1].value > chartData[0].value 
                                              ? 'positive' 
                                              : 'negative'
                                            : 'neutral');

                                        const trendColor = overallTrend === 'positive' ? '#22c55e' : overallTrend === 'negative' ? '#ef4444' : '#6b7280';

                                        const companyInsightsContent = (
                                          <>
                                            {parts[0] ? renderReportText(cleanReportPart(parts[0])) : null}
                                            {chartData.length > 0 && (
                                              <div className="my-4 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                                <div className="flex items-center justify-between mb-3">
                                                  <span className="text-sm font-medium text-gray-300">Quarterly Performance Trend</span>
                                                  <span className={`text-xs px-2 py-1 rounded ${overallTrend === 'positive' ? 'bg-green-500/20 text-green-400' : overallTrend === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                    {overallTrend === 'positive' ? '↑ Uptrend' : overallTrend === 'negative' ? '↓ Downtrend' : '→ Neutral'}
                                                  </span>
                                                </div>
                                                <div className="h-40 w-full">
                                                  <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                  >
                                                    <AreaChart
                                                      data={chartData}
                                                      margin={{
                                                        top: 10,
                                                        right: 10,
                                                        left: 10,
                                                        bottom: 20,
                                                      }}
                                                    >
                                                      <defs>
                                                        <linearGradient
                                                          id="companyInsightsGradient"
                                                          x1="0"
                                                          y1="0"
                                                          x2="0"
                                                          y2="1"
                                                        >
                                                          <stop
                                                            offset="0%"
                                                            stopColor={trendColor}
                                                            stopOpacity={0.4}
                                                          />
                                                          <stop
                                                            offset="100%"
                                                            stopColor={trendColor}
                                                            stopOpacity={0.05}
                                                          />
                                                        </linearGradient>
                                                      </defs>
                                                      <XAxis
                                                        dataKey="quarter"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{
                                                          fontSize: 11,
                                                          fill: "#9ca3af",
                                                        }}
                                                      />
                                                      <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{
                                                          fontSize: 10,
                                                          fill: "#6b7280",
                                                        }}
                                                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K Cr`}
                                                        domain={['dataMin - 1000', 'dataMax + 1000']}
                                                      />
                                                      <Tooltip
                                                        contentStyle={{
                                                          background: "#1f2937",
                                                          border: "1px solid #374151",
                                                          borderRadius: "8px",
                                                          color: "#f3f4f6",
                                                          fontSize: "12px",
                                                          padding: "8px 12px",
                                                        }}
                                                        formatter={(value: any, name: any, props: any) => [
                                                          `₹${Number(value).toLocaleString()} Cr (${props.payload.changePercent >= 0 ? '+' : ''}${props.payload.changePercent.toFixed(2)}%)`,
                                                          "Revenue"
                                                        ]}
                                                        labelFormatter={(label) => `${label}`}
                                                      />
                                                      <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke={trendColor}
                                                        strokeWidth={2}
                                                        fill="url(#companyInsightsGradient)"
                                                        dot={{
                                                          r: 4,
                                                          stroke: trendColor,
                                                          strokeWidth: 2,
                                                          fill: "#1f2937",
                                                        }}
                                                        activeDot={{
                                                          r: 6,
                                                          stroke: trendColor,
                                                          strokeWidth: 2,
                                                          fill: "#ffffff",
                                                        }}
                                                      />
                                                    </AreaChart>
                                                  </ResponsiveContainer>
                                                </div>
                                                <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
                                                  <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Positive Quarter
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Negative Quarter
                                                  </span>
                                                </div>
                                              </div>
                                            )}

                                            {/* Profit & Loss Statement Table */}
                                            {companyInsights?.annualFinancials?.profitLoss && companyInsights.annualFinancials.profitLoss.length > 0 && (
                                              <div className="my-4 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                                <div className="flex items-center justify-start mb-3">
                                                  <span className="text-sm font-medium text-gray-300">Profit & Loss Statement (in Cr)</span>
                                                  <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                                                    Annual Data
                                                  </span>
                                                </div>
                                                <div className="overflow-x-auto">
                                                  <table className="w-full text-sm">
                                                    <thead>
                                                      <tr className="border-b border-gray-200 dark:border-gray-700">
                                                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Particulars</th>
                                                        {companyInsights.annualFinancials.years.slice(0, 5).map((year: string) => (
                                                          <th key={year} className="text-right py-2 px-2 text-gray-400 font-medium">{year}</th>
                                                        ))}
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {companyInsights.annualFinancials.profitLoss.map((row: any, idx: number) => (
                                                        <tr key={idx} className={`border-b border-gray-800 ${row.label.toLowerCase().includes('net profit') || row.label.toLowerCase().includes('eps') ? 'bg-gray-800/30 font-medium' : ''}`}>
                                                          <td className="py-2 px-2 text-gray-300">{row.label}</td>
                                                          {row.values.slice(0, 5).map((v: any, vIdx: number) => {
                                                            const numVal = typeof v.value === 'string' ? parseFloat(v.value.replace(/,/g, '')) : Number(v.value);
                                                            const displayVal = isNaN(numVal) ? v.value : numVal.toLocaleString();
                                                            return (
                                                              <td key={vIdx} className={`text-right py-2 px-2 ${numVal >= 0 ? 'text-gray-200' : 'text-red-400'}`}>
                                                                {displayVal}
                                                              </td>
                                                            );
                                                          })}
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </div>
                                            )}

                                            {/* Balance Sheet Table */}
                                            {companyInsights?.annualFinancials?.balanceSheet && companyInsights.annualFinancials.balanceSheet.length > 0 && (
                                              <div className="my-4 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                                                <div className="flex items-center justify-start mb-3">
                                                  <span className="text-sm font-medium text-gray-300">Balance Sheet (in Cr)</span>
                                                  <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                                                    Annual Data
                                                  </span>
                                                </div>
                                                <div className="overflow-x-auto">
                                                  <table className="w-full text-sm">
                                                    <thead>
                                                      <tr className="border-b border-gray-700">
                                                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Particulars</th>
                                                        {companyInsights.annualFinancials.years.slice(0, 5).map((year: string) => (
                                                          <th key={year} className="text-right py-2 px-2 text-gray-400 font-medium">{year}</th>
                                                        ))}
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {companyInsights.annualFinancials.balanceSheet.map((row: any, idx: number) => (
                                                        <tr key={idx} className={`border-b border-gray-800 ${row.label.toLowerCase().includes('total assets') || row.label.toLowerCase().includes('total liabilities') ? 'bg-gray-800/30 font-medium' : ''}`}>
                                                          <td className="py-2 px-2 text-gray-300">{row.label}</td>
                                                          {row.values.slice(0, 5).map((v: any, vIdx: number) => {
                                                            const numVal = typeof v.value === 'string' ? parseFloat(v.value.replace(/,/g, '')) : Number(v.value);
                                                            const displayVal = isNaN(numVal) ? v.value : numVal.toLocaleString();
                                                            return (
                                                              <td key={vIdx} className={`text-right py-2 px-2 ${numVal >= 0 ? 'text-gray-200' : 'text-red-400'}`}>
                                                                {displayVal}
                                                              </td>
                                                            );
                                                          })}
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </div>
                                            )}
                                            {parts[1] ? renderReportText(cleanReportPart(parts[1])) : null}
                                          </>
                                        );

                                        renderedContent = renderedContent ? 
                                          <>{renderedContent}{companyInsightsContent}</> : 
                                          companyInsightsContent;
                                      }
                      // Handle Social Feed Insights
                      if (searchResults.includes("[CHART:SOCIAL_FEED]")) {
                        renderedContent = (
                          <Suspense fallback={null}>
                            <SocialFeedInsightsPanel
                              socialFeedPosts={socialFeedPosts}
                              isSocialFeedLoading={isSocialFeedLoading}
                              fetchSocialFeedData={fetchSocialFeedData}
                            />
                          </Suspense>
                        );
                      }

                      // Handle Journal Full Report
                      if (searchResults.includes("[CHART:JOURNAL_REPORT]")) {
                        renderedContent = (
                          <Suspense fallback={null}>
                            <JournalAIReportPanel
                              journalReportMetrics={journalReportMetrics}
                              setJournalReportActiveTab={setJournalReportActiveTab}
                              generateJournalAIReport={generateJournalAIReport}
                              journalScreenTimeSessions={journalScreenTimeSessions}
                              journalCurrentSessionSecs={journalCurrentSessionSecs}
                              journalTabCurrentSecs={journalTabCurrentSecs}
                            />
                          </Suspense>
                        );
                      }

                      // Handle Trading Challenge Coming Soon
                      if (searchResults.includes("[CHART:TRADE]")) {
                        renderedContent = (
                          <div className="w-full rounded-xl border border-gray-800 bg-gray-900/90 overflow-hidden">
                            {/* Compact header */}
                            <div className="px-3 py-2.5 border-b border-gray-800 flex items-center gap-2">
                              <Trophy className="h-3.5 w-3.5 text-orange-400" />
                              <span className="text-xs font-semibold text-gray-200">Trading Challenge</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 ml-auto">Coming Soon</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-800/60">
                              {[
                                { icon: <Users className="h-4 w-4 text-blue-400" />, title: 'Compete', desc: 'Join 7-day trading challenges against other traders', color: 'text-blue-400' },
                                { icon: <BarChart3 className="h-4 w-4 text-green-400" />, title: 'Live P&L', desc: 'Real-time rankings based on your trade performance', color: 'text-green-400' },
                                { icon: <Award className="h-4 w-4 text-yellow-400" />, title: 'Leaderboard', desc: 'Track your rank among all challenge participants', color: 'text-yellow-400' },
                              ].map((item, i) => (
                                <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-800/30 transition-colors">
                                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                                  <div>
                                    <p className={`text-xs font-semibold ${item.color}`}>{item.title}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="px-4 py-2.5 border-t border-gray-800/60 flex items-center justify-between">
                              <span className="text-[10px] text-gray-600">Notify me when launched</span>
                              <button className="text-[10px] px-2.5 py-1 rounded-full bg-orange-600/20 text-orange-400 border border-orange-600/30 hover:bg-orange-600/30 transition-colors">Remind Me</button>
                            </div>
                          </div>
                        );
                      }



                                      // Strip raw stock-data dump blocks that the AI agent inlines
                                      // before chart markers — these are already shown visually
                                      // by the chart components so the raw text is redundant.
                                      // Pattern: "## Company (SYM)\n\n**Current Price:**…\n---\n*Data from:…*"
                                      if (processedResults && typeof processedResults === 'string') {
                                        processedResults = cleanReportPart(processedResults);
                                      }

                                      return renderedContent || (processedResults ? renderReportText(processedResults) : null) || searchResults;
                                    })()}


                                  </div>
                                  {/* Disclaimer */}
                                  <div className="mt-4 pt-3 border-t border-gray-700">
                                    <p className="text-xs text-gray-500 italic">
                                      Disclaimer: Financial data is sourced from NSE/BSE and other public sources. 
                                      This information is for educational purposes only and should not be considered 
                                      financial advice. Please verify data independently before making investment decisions.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-0 pt-0 border-t border-gray-700">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSearchQuery("");
                                      setIsSearchActive(false);
                                      setSearchResults("");
                                    }}
                                    className="text-gray-400 hover:text-gray-200"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                  </Button>
                                </div>
                              </div>
                            ) : searchQuery && !isSearchLoading ? (
                              <div className="text-center text-gray-400 py-8">
                                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>
                                  Press Enter or click the search button to get
                                  AI assistance
                                </p>
                              </div>
                            ) : isSearchLoading ? (
                              <div className="text-center py-8">
                                <style>{`
                                  @keyframes thinkingDot {
                                    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
                                    30% { opacity: 1; transform: translateY(-8px); }
                                  }
                                  .thinking-dot {
                                    display: inline-block;
                                    width: 8px;
                                    height: 8px;
                                    border-radius: 50%;
                                    background-color: #3b82f6;
                                    animation: thinkingDot 1.4s infinite;
                                    margin: 0 3px;
                                  }
                                  .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
                                  .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
                                `}</style>
                                <div className="flex items-center justify-center">
                                  <div className="thinking-dot"></div>
                                  <div className="thinking-dot"></div>
                                  <div className="thinking-dot"></div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Enhanced AI Suggestion Buttons - Desktop only */}
                      <div className="md:flex hidden flex-wrap items-center justify-center gap-2 max-w-6xl mx-auto md:mt-3">
                        {/* <Button
                        variant="secondary"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-11 px-4 rounded-full font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "Get live stock prices and fundamentals for NIFTY, SENSEX, and top Indian stocks"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Stock Prices</span>
                        </div>
                      </Button> */}

                        {isPrimaryOwner && (
                        <Button
                          variant="secondary"
                          className="bg-cyan-600 hover:bg-cyan-700  text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                          onClick={() => {
                            const userId = localStorage.getItem('currentUserId');
                            const userEmail = localStorage.getItem('currentUserEmail');
                            if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
                              setLocation('/login');
                              return;
                            }
                            setIsWatchlistLoading(true);
                            setIsSearchActive(true);
                            setSearchResults("[CHART:WATCHLIST]");
                            setIsWatchlistOpen(true);
                            // Auto-select first stock in watchlist and fetch its quarterly data
                            if (watchlistSymbols.length > 0 && !selectedWatchlistSymbol) {
                              const firstStock = watchlistSymbols[0];
                              setSelectedWatchlistSymbol(firstStock.symbol);
                              setSearchResultsNewsSymbol(firstStock.symbol);
                            }
                            setTimeout(() => setIsWatchlistLoading(false), 300);
                          }}
                          data-testid="button-watchlist"
                        >
                          <div className="flex items-center justify-center gap-1">
                            {isWatchlistLoading ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                            <span>Watchlist</span>
                          </div>
                        </Button>
                        )}

                        <Button
                          variant="secondary"
                          className="bg-green-600 hover:bg-green-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                          onClick={() => {
                            setIsSearchActive(true);
                            setSearchResults("[CHART:MARKET_NEWS]");
                            fetchNifty50News();
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Newspaper className="h-3 w-3" />
                            <span>Market News</span>
                          </div>
                        </Button>

                        <Button
                          variant="secondary"
                          className="bg-pink-600 hover:bg-pink-700  text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                          onClick={() => {
                            setIsSearchActive(true);
                            setSearchResults("[CHART:SOCIAL_FEED]");
                            fetchSocialFeedData();
                          }}
                          data-testid="button-social-feed"
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>Feed Report</span>
                          </div>
                        </Button>

                        <Button
                          variant="secondary"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                          onClick={() => {
                            const userId = localStorage.getItem('currentUserId');
                            const userEmail = localStorage.getItem('currentUserEmail');
                            if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
                              setLocation('/login');
                              return;
                            }
                            generateJournalAIReport();
                          }}
                          data-testid="button-trading-journal"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            <span>Journal Report</span>
                          </div>
                        </Button>

                        {isPrimaryOwner && (
                        <Button
                          variant="secondary"
                          className="bg-red-600 hover:bg-red-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200"
                          onClick={() => {
                            const userId = localStorage.getItem('currentUserId');
                            const userEmail = localStorage.getItem('currentUserEmail');
                            if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
                              setLocation('/login');
                              return;
                            }
                            setIsSearchActive(true);
                            setSearchResults("[CHART:TRADE]");
                          }}
                          data-testid="button-trade"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Trophy className="h-3 w-3" />
                            <span>Trade Challenge</span>
                          </div>
                        </Button>
                        )}


                        {/* <Button
                        variant="secondary"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 h-11 px-4 rounded-full font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "Add TCS to watchlist and set alerts"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <span>Quick Actions</span>
                        </div>
                      </Button> */}

                        {/* <Button
                        variant="secondary"
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0 h-11 px-4 rounded-full font-medium transition-all duration-200"
                        onClick={() =>
                          handleSuggestionClick(
                            "Show me upcoming IPOs and recent IPO performance in Indian markets"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>IPO Updates</span>
                        </div>
                      </Button> */}


                      </div>

                      {/* Trading Tools Section - White container with centered cards */}
                      <div className={`${searchResults ? 'bg-transparent hidden md:block' : 'bg-white'} md:pt-3 md:pb-3 md:rounded-3xl rounded-3xl relative pointer-events-auto touch-pan-y flex-shrink-0 w-full mb-[14px] pb-[10px] ml-[0px] mr-[0px] pl-4 pr-4 mt-[20px] pt-[70px]`}>
                        {/* Mobile Flashbar - replaces search bar */}
                        <div className="md:hidden absolute -top-3 left-4 right-4 z-50">
                          {/* Flashbar cycling highlights */}
                          {(() => {
                            const item = flashBarItems[flashBarIndex] || flashBarItems[0];
                            if (!item) return null;
                            return (
                              <button
                                data-testid="flash-bar-mobile"
                                onClick={() => {
                                  const scrollToResults = () => {
                                    setTimeout(() => {
                                      document.querySelector('.dark-scrollbar-area')?.scrollTo({ top: 0, behavior: 'smooth' });
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }, 50);
                                  };
                                  if (item.tab === 'watchlist') {
                                    // Watchlist is hidden on mobile — show Market News instead
                                    setSearchResults("[CHART:MARKET_NEWS]");
                                    setIsSearchActive(true);
                                    fetchNifty50News();
                                    scrollToResults();
                                  } else if (item.tab === 'market-news') {
                                    setSearchResults("[CHART:MARKET_NEWS]");
                                    setIsSearchActive(true);
                                    fetchNifty50News();
                                    scrollToResults();
                                  } else if (item.tab === 'trade-challenge') {
                                    setSearchResults("[CHART:TRADE]");
                                    setIsSearchActive(true);
                                    scrollToResults();
                                  } else if (item.tab === 'social') {
                                    setIsSearchActive(true);
                                    setSearchResults("[CHART:SOCIAL_FEED]");
                                    fetchSocialFeedData();
                                    scrollToResults();
                                  } else if (item.tab === 'journal') {
                                    const userId = localStorage.getItem('currentUserId');
                                    const userEmail = localStorage.getItem('currentUserEmail');
                                    if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
                                      setLocation('/login');
                                      return;
                                    }
                                    generateJournalAIReport();
                                    scrollToResults();
                                  }
                                }}
                                className="w-full h-10 rounded-2xl bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-900 transition-all duration-200 flex items-center gap-2 px-3 text-left group"
                              >
                                {/* Category icon */}
                                <span className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border ${item.colorClass}`}>
                                  {item.category === 'News' && <Newspaper className="w-2.5 h-2.5" />}
                                  {item.category === 'Watchlist' && <Eye className="w-2.5 h-2.5" />}
                                  {item.category === 'Social' && <MessageCircle className="w-2.5 h-2.5" />}
                                  {item.category === 'Journal' && <FileText className="w-2.5 h-2.5" />}
                                  {(item.category === 'Challenge' || item.category === 'Trade') && <Trophy className="w-2.5 h-2.5" />}
                                </span>

                                {/* Cycling content */}
                                <span
                                  className="flex-1 min-w-0 flex items-center gap-2 transition-opacity duration-200 overflow-hidden"
                                  style={{ opacity: flashBarVisible ? 1 : 0 }}
                                >
                                  {item.category === 'Journal' && journalFlashStats ? (() => {
                                    const { totalPnL, totalTrades, winRate, tradingDays } = journalFlashStats;
                                    const isPositive = totalPnL >= 0;
                                    return (
                                      <>
                                        <span className="text-[11px] font-semibold text-gray-200 flex-shrink-0">Journal</span>
                                        <span className={`text-[11px] font-bold flex-shrink-0 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                          {isPositive ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </span>
                                        <span className="flex-shrink-0 w-px h-3 bg-gray-700 mx-0.5" />
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">{totalTrades}T</span>
                                        <span className="flex-shrink-0 w-px h-3 bg-gray-700 mx-0.5" />
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">{winRate.toFixed(0)}%W</span>
                                      </>
                                    );
                                  })() : item.category === 'News' ? (
                                    <span className="text-xs text-gray-300 truncate min-w-0 flex-1">{item.text}</span>
                                  ) : item.category === 'Watchlist' && item.symbol && newsStockPrices[item.symbol] ? (() => {
                                    const sd = newsStockPrices[item.symbol];
                                    const sym = item.symbol;
                                    const isUp = sd.changePercent >= 0;
                                    const rawPrices = (sd.chartData || []).map((d: any) => d.price).filter((p: number) => p > 0);
                                    const fallbackPrices = (flashBarFallbackChartData[sym] ?? []).map((d: any) => d.price).filter((p: number) => p > 0);
                                    const prices = rawPrices.length >= 2 ? rawPrices : (fallbackPrices.length >= 2 ? fallbackPrices : []);
                                    const minP = prices.length >= 2 ? Math.min(...prices) : 0;
                                    const maxP = prices.length >= 2 ? Math.max(...prices) : 0;
                                    const range = maxP - minP || sd.price * 0.001 || 1;
                                    return (
                                      <>
                                        <span className="text-[11px] font-semibold text-gray-200 truncate">{sym.replace('-EQ','')}</span>
                                        <span className={`text-[11px] font-mono ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                          ₹{sd.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </span>
                                        <span className={`text-[10px] ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                          {isUp ? '▲' : '▼'} {Math.abs(sd.changePercent).toFixed(2)}%
                                        </span>
                                        {prices.length >= 2 && (
                                          <svg width="36" height="16" viewBox="0 0 36 16" className="flex-shrink-0">
                                            <polyline
                                              points={prices.map((p, i) => `${(i / (prices.length - 1)) * 36},${16 - ((p - minP) / range) * 14}`).join(' ')}
                                              fill="none"
                                              stroke={isUp ? '#22c55e' : '#ef4444'}
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        )}
                                      </>
                                    );
                                  })() : (
                                    <span className="text-xs text-gray-300 truncate">{item.text}</span>
                                  )}
                                </span>

                                {/* Progress dots */}
                                <span className="flex-shrink-0 flex items-center gap-[3px]">
                                  {Array.from({ length: Math.min(flashBarItems.length, 8) }).map((_, i) => (
                                    <span
                                      key={i}
                                      className="block rounded-full transition-all duration-300"
                                      style={{
                                        width: i === flashBarIndex % Math.min(flashBarItems.length, 8) ? 10 : 4,
                                        height: 4,
                                        background: i === flashBarIndex % Math.min(flashBarItems.length, 8) ? '#60a5fa' : '#374151',
                                      }}
                                    />
                                  ))}
                                </span>

                                {/* Arrow hint */}
                                <span className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2.5l4.5 4.5L5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </span>
                              </button>
                            );
                          })()}

                          {/* Mobile Quick Action Buttons - Always visible below flashbar */}
                          <div
                            className="mt-2 flex gap-2 justify-center flex-wrap relative z-50"
                          >
                            {isPrimaryOwner && (
                            <Button
                              variant="secondary"
                              className="hidden md:flex bg-cyan-600 hover:bg-cyan-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() => {
                                const userId = localStorage.getItem('currentUserId');
                                const userEmail = localStorage.getItem('currentUserEmail');
                                if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
                                  setLocation('/login');
                                  return;
                                }
                                setIsWatchlistLoading(true);
                                setIsSearchActive(true);
                                setSearchResults("[CHART:WATCHLIST]");
                                setIsWatchlistOpen(true);
                                if (watchlistSymbols.length > 0 && !selectedWatchlistSymbol) {
                                  const firstStock = watchlistSymbols[0];
                                  setSelectedWatchlistSymbol(firstStock.symbol);
                                  setSearchResultsNewsSymbol(firstStock.symbol);
                                }
                                setTimeout(() => setIsWatchlistLoading(false), 300);
                              }}
                              data-testid="button-watchlist-mobile"
                            >
                              <div className="flex items-center justify-center gap-1">
                                {isWatchlistLoading ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                                <span>Watchlist</span>
                              </div>
                            </Button>
                            )}

                            <Button
                              variant="secondary"
                              className="bg-green-600 hover:bg-green-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() => {
                                setIsSearchActive(true);
                                setSearchResults("[CHART:MARKET_NEWS]");
                                fetchNifty50News();
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <Newspaper className="h-3 w-3" />
                                <span>Market News</span>
                              </div>
                            </Button>

                            <Button
                              variant="secondary"
                              className="bg-pink-600 hover:bg-pink-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() => {
                                setIsSearchActive(true);
                                setSearchResults("[CHART:SOCIAL_FEED]");
                                fetchSocialFeedData();
                              }}
                              data-testid="button-social-feed-mobile"
                            >
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Feed Report</span>
                              </div>
                            </Button>

                            <Button
                              variant="secondary"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() => {
                                const userId = localStorage.getItem('currentUserId');
                                const userEmail = localStorage.getItem('currentUserEmail');
                                if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
                                  setLocation('/login');
                                  return;
                                }
                                generateJournalAIReport();
                              }}
                              data-testid="button-trading-journal-mobile"
                            >
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>Journal Report</span>
                              </div>
                            </Button>

                            {isPrimaryOwner && (
                            <Button
                              variant="secondary"
                              className="bg-orange-600 hover:bg-orange-700 text-white border-0 h-7 px-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                              onClick={() => {
                                const userId = localStorage.getItem('currentUserId');
                                const userEmail = localStorage.getItem('currentUserEmail');
                                if (!userId || !userEmail || userId === 'null' || userEmail === 'null') {
                                  setLocation('/login');
                                  return;
                                }
                                setIsSearchActive(true);
                                setSearchResults("[CHART:TRADE]");
                              }}
                              data-testid="button-trade-challenge-mobile"
                            >
                              <div className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                <span>Trade Challenge</span>
                              </div>
                            </Button>
                            )}
                          </div>

                          {/* Mobile AI Search Results - suppressed for all tabs; desktop layout is used on all screen sizes */}
                          {false && isSearchActive && searchResults && (
                            <div className="md:hidden fixed inset-x-0 top-0 bottom-0 bg-gray-900/95 backdrop-blur-sm z-[60] overflow-y-auto">
                              <div className="p-3 space-y-3">
                                <div className="flex items-center justify-start pb-2 border-b border-gray-700">
                                  <div className="flex items-center gap-1.5">
                                    {searchResults.includes("[CHART:WATCHLIST]") ? (
                                      <>
                                        <Eye className="h-4 w-4 text-gray-700 dark:text-blue-400" />
                                        <h3 className="text-xs font-medium text-gray-100">
                                          Watchlist
                                        </h3>
                                      </>
                                    ) : searchResults.includes("[CHART:TRADE]") ? (
                                      <>
                                        <Trophy className="h-4 w-4 text-red-400" />
                                        <h3 className="text-xs font-medium text-gray-100">
                                          Trade Challenge
                                        </h3>
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-4 w-4 text-blue-400" />
                                        <h3 className="text-xs font-medium text-gray-100">
                                          Trading Challenge
                                        </h3>
                                      </>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSearchQuery("");
                                      setIsSearchActive(false);
                                      setSearchResults("");
                                    }}
                                    className="text-gray-400 hover:text-gray-200 h-6 w-6 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                  <div className="text-gray-300 whitespace-pre-wrap leading-tight text-xs">
                                    {searchResults.includes("[CHART:WATCHLIST]") ? (
// Mobile Watchlist Layout - Using compact desktop layout
                                      <div className="space-y-2">
                                        {/* NIFTY 50 Chart */}
                                        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-start">
                                              <div className="flex items-center gap-1">
                                                <h4 className="text-xs font-semibold text-gray-200">NIFTY 50</h4>
                                                <span className="text-xs text-green-400 flex items-center gap-0.5">
                                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                  Live
                                                </span>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-xs font-mono text-gray-100">₹{getNifty50CurrentPrice().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                                <div className={`text-xs flex items-center justify-end gap-0.5 ${getNifty50Change() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                  {getNifty50Change() >= 0 ? '▲' : '▼'} {Math.abs((getNifty50Change() / (getNifty50CurrentPrice() - getNifty50Change())) * 100).toFixed(2)}%
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                              {['1D', '5D', '1M'].map((tf) => (
                                                <Button key={tf} variant="ghost" size="sm" onClick={() => setNifty50Timeframe(tf)} className={`px-1 py-0 text-xs h-5 ${nifty50Timeframe === tf ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400'}`}>
                                                  {tf}
                                                </Button>
                                              ))}
                                            </div>
                                            <div className="h-24 w-full bg-gray-800/30 rounded p-1">
                                              <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={isNifty50Loading ? [] : nifty50FormattedData} margin={{ top: 2, right: 10, left: 30, bottom: 2 }}>
                                                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} tickCount={3} />
                                                  <YAxis domain={['dataMin - 50', 'dataMax + 50']} axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} width={8} />
                                                  <Tooltip content={({ active, payload }) => {if (!active || !payload?.length) return null; const value = payload[0].value; return <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', padding: '4px 8px', fontSize: '11px' }}>₹{Number(value).toFixed(2)}</div>;}} />
                                                  <Line type="linear" dataKey="price" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                                                </LineChart>
                                              </ResponsiveContainer>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Selected Stock Chart */}
                                        {selectedWatchlistSymbol && (
                                          <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-start">
                                                <div className="flex items-center gap-1">
                                                  <h4 className="text-xs font-semibold text-gray-200">{selectedWatchlistSymbol.replace('-EQ', '')}</h4>
                                                  <span className="text-xs text-green-400">Live</span>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-0.5">
                                                {['1D', '5D', '1M'].map((tf) => (
                                                  <Button key={tf} variant="ghost" size="sm" onClick={() => {}} className={`px-1 py-0 text-xs h-5 bg-blue-600/20 text-blue-400`}>
                                                    {tf}
                                                  </Button>
                                                ))}
                                              </div>
                                              <div className="h-24 w-full bg-gray-800/30 rounded p-1">
                                                <ResponsiveContainer width="100%" height="100%">
                                                  <LineChart data={[]} margin={{ top: 2, right: 10, left: 30, bottom: 2 }}>
                                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 8 }} tickCount={3} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8 }} width={8} />
                                                    <Line type="linear" dataKey="price" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                                                  </LineChart>
                                                </ResponsiveContainer>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* My Watchlist */}
                                        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
                                          <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-medium text-gray-200">My Watchlist</h4>
                                            <span className="text-xs text-gray-400">{watchlistSymbols.length} stocks</span>
                                          </div>
                                          <div className="space-y-1 max-h-20 overflow-y-auto">
                                            {watchlistSymbols.map((stock) => (
                                              <div key={stock.symbol} onClick={() => setSelectedWatchlistSymbol(stock.symbol)} className={`px-2 py-1 rounded text-xs cursor-pointer ${selectedWatchlistSymbol === stock.symbol ? 'bg-blue-600/30 border border-blue-500/50' : 'hover:bg-gray-700/50'}`}>
                                                <div className="font-medium text-gray-200">{stock.displayName || stock.symbol}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ) : searchResults.includes("[CHART:TRADE]") ? (

                                      <div className="w-full max-w-2xl mx-auto py-12">
                                        {/* Header with Trophy Icon */}
                                        <div className="flex flex-col items-center mb-8">
                                          <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                                            <Trophy className="h-12 w-12 text-white" />
                                          </div>
                                          <h2 className="text-3xl font-bold text-white text-center mb-2">Trading Challenge</h2>
                                          <p className="text-gray-400 text-lg">Coming Soon</p>
                                        </div>

                                        {/* Feature Cards */}
                                        <div className="space-y-3">
                                          {/* Compete with Traders Card */}
                                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                              <Users className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                              <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Compete with Traders</h3>
                                              <p className="text-gray-400 text-sm">Join 7-day trading challenges</p>
                                            </div>
                                          </div>

                                          {/* Live P&L Tracking Card */}
                                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                              <BarChart3 className="h-6 w-6 text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                              <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Live P&L Tracking</h3>
                                              <p className="text-gray-400 text-sm">Real-time ranking based on your trades</p>
                                            </div>
                                          </div>

                                          {/* Leaderboard Rankings Card */}
                                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                              <Trophy className="h-6 w-6 text-yellow-500" />
                                            </div>
                                            <div className="flex-1">
                                              <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Leaderboard Rankings</h3>
                                              <p className="text-gray-400 text-sm">See your position among all participants</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      ) : (searchResults

                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Trading Tools Grid - Desktop: 4 columns centered, Mobile: 3 horizontal cards + swipeable below */}
                        {!searchResults && (
                        <div className="mx-auto max-w-6xl hidden md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-3 md:px-4 md:items-start">
                          {/* Social Feed Card */}
                          <div
                            className="bg-blue-500 rounded-2xl overflow-hidden h-28 w-full relative cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => checkAuthAndNavigate("voice")}
                          >
                            <div className="absolute top-2 left-2">
                              <span className="bg-white bg-opacity-90 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                Social Feed
                              </span>
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Trading Master Card */}
                          <div
                            className="bg-indigo-500 rounded-2xl overflow-hidden h-28 w-full relative cursor-pointer hover:scale-105 transition-transform"
                            onClick={handleTradingMasterAccess}
                          >
                            <div className="absolute top-2 left-2">
                              <span className="bg-white bg-opacity-90 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                Trading Master
                              </span>
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <Activity className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Trading Charts Card */}
                          <div
                            className="bg-emerald-500 rounded-2xl overflow-hidden h-28 w-full relative cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => checkAuthAndNavigate("journal")}
                          >
                            <div className="absolute top-2 left-2">
                              <span className="bg-white bg-opacity-90 text-emerald-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                Journal
                              </span>
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                                <Pencil className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Tutor Daily News Swipeable Cards - Portrait orientation with proper spacing */}
                          <div className="relative h-28 w-full flex items-start justify-center overflow-visible md:-mt-[22px]">
                            <SwipeableCardStack
                              onSectorChange={handleSectorChange}
                              selectedSector={selectedSector}
                              onCardIndexChange={setCurrentCardIndex}
                              currentCardIndex={currentCardIndex}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </div>
                        )}
                        {/* Mobile Layout: 3 horizontal cards + swipeable below */}
                        {!searchResults && (
                        <div className="md:hidden mt-2">
                          {/* Three cards in a row */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {/* Social Feed Card */}
                            <div
                              className="bg-blue-500 rounded-xl overflow-hidden h-20 relative cursor-pointer active:scale-95 transition-transform"
                              onClick={() => checkAuthAndNavigate("voice")}
                            >
                              <div className="absolute top-2 left-2">
                                <span className="bg-white bg-opacity-90 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                  Social Feed
                                </span>
                              </div>
                              <div className="absolute bottom-2 right-2">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                  <MessageCircle className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>

                            {/* Trading Master Card */}
                            <div
                              className="bg-purple-500 rounded-xl overflow-hidden h-20 relative cursor-pointer active:scale-95 transition-transform"
                              onClick={handleTradingMasterAccess}
                            >
                              <div className="absolute top-2 left-2">
                                <span className="bg-white bg-opacity-90 text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                  Trading Master
                                </span>
                              </div>
                              <div className="absolute bottom-2 right-2">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                  <Activity className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>

                            {/* Journal Card */}
                            <div
                              className="bg-green-500 rounded-xl overflow-hidden h-20 relative cursor-pointer active:scale-95 transition-transform"
                              onClick={() => checkAuthAndNavigate("journal")}
                            >
                              <div className="absolute top-2 left-2">
                                <span className="bg-white bg-opacity-90 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                  Journal
                                </span>
                              </div>
                              <div className="absolute bottom-2 right-2">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                                  <Pencil className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Swipeable News Cards Below - Properly Centered */}
                          <div className="flex items-center justify-center px-4 pb-0">
                            <SwipeableCardStack
                              onSectorChange={handleSectorChange}
                              selectedSector={selectedSector}
                              onCardIndexChange={setCurrentCardIndex}
                              currentCardIndex={currentCardIndex}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </div>
                        )}

                        {/* Navigation Dots - Outside white container, in blue area */}
                        {!searchResults && (
                        <div className="md:hidden absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex gap-2 justify-center z-40">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <button
                              key={index}
                              data-testid={`nav-dot-${index}`}
                              onClick={() => {
                                // Calculate how many swipes needed to get to this card
                                const diff = index - currentCardIndex;
                                // Navigate to the selected card (this would need to be implemented in SwipeableCardStack)
                                setCurrentCardIndex(index);
                              }}
                              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:scale-110 ${
                                index === currentCardIndex
                                  ? "bg-white scale-125"
                                  : "bg-white/40"
                              }`}
                            ></button>
                          ))}
                        </div>
                        )}
                      </div>
                    </div>

                    {/* Animated Floating Tutor Button - Admin only */}
                    {!searchResults && currentUser && authorizedUsers.some(u => u.email.toLowerCase() === currentUser?.email?.toLowerCase()) && (
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
                      <div className="relative">
                        {/* Background animation rings */}
                        <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-violet-600/30 to-indigo-600/30 animate-ping pointer-events-none"></div>
                        <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-violet-600/20 to-indigo-600/20 animate-pulse pointer-events-none"></div>

                        {/* Main clickable button */}
                        <Button
                          onClick={handleMinicastAccess}
                          className="relative w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-2xl hover:animate-none transition-all duration-300 border-4 border-white/20 pointer-events-auto animate-bounce hover:scale-110"
                        >
                          <ChevronUp className="h-8 w-8 text-gray-400 pointer-events-none" />
                        </Button>
                      </div>
                    </div>
                    )}

                    {/* Tutor Vertical Sidebar - Slides from right */}
{/* Coming Soon Dialog for Mini Cast */}
        <Dialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
          <DialogContent className="w-[90vw] max-w-xs bg-white dark:bg-slate-950 border-none shadow-2xl rounded-2xl p-0 overflow-hidden [&>button]:hidden">
            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-4 pt-5 pb-6 text-center overflow-hidden rounded-t-2xl">
              <button
                onClick={() => setShowComingSoonDialog(false)}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                data-testid="button-close-minicast-x"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
              <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
              <div className="relative">
                <div className="mx-auto w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg mb-2.5 border border-white/30">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Mini Cast</h2>
                <p className="text-violet-200 text-xs font-medium mt-0.5">Streaming Platform</p>
                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-2.5 py-0.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Coming Soon</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-4 pt-2">
              <Button
                onClick={() => setShowComingSoonDialog(false)}
                className="w-full h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] text-sm"
                data-testid="button-close-minicast-coming-soon"
              >
                Got It, I'll Wait!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
                {/* Admin Dashboard Dialog */}
        <Dialog open={showAdminDashboardDialog} onOpenChange={setShowAdminDashboardDialog}>
          <DialogContent className="w-[95vw] sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-xl rounded-3xl p-0 overflow-hidden">
            <div className="p-6 text-center pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
              <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                Admin Dashboard
              </DialogTitle>
            </div>

            {/* Admin Tab Switcher */}
            <div className="flex justify-center px-6 pt-[0px] pb-[0px]">
              <div className="flex bg-[#0a0f1d] p-1.5 rounded-xl w-full border border-slate-800/50 shadow-inner pt-[0px] pb-[0px] pl-[0px] pr-[0px]">
                <button
                  onClick={() => setAdminTab("bugs-list")}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${ adminTab === "bugs-list" ? "text-blue-400" : "text-slate-400 hover:text-slate-300" }`}
                  data-testid="button-admin-tab-bugs-list"
                >
                  <span>Bugs list</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white ml-1 shadow-[0_0_10px_rgba(37,99,235,0.4)]">{adminBugReports.length}</span>
                  {adminTab === "bugs-list" && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}
                </button>
                <button
                  onClick={() => setAdminTab("bugs-fixed")}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${ adminTab === "bugs-fixed" ? "text-blue-400" : "text-slate-400 hover:text-slate-300" }`}
                  data-testid="button-admin-tab-bugs-fixed"
                >
                  <span>Bugs fixed</span>
                  {adminTab === "bugs-fixed" && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}
                </button>
                <button
                  onClick={() => { setAdminTab("influencer"); loadInfluencerList(); }}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${ adminTab === "influencer" ? "text-blue-400" : "text-slate-400 hover:text-slate-300" }`}
                  data-testid="button-admin-tab-influencer"
                >
                  <span>Influencer</span>
                  {adminTab === "influencer" && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}
                </button>
                <button
                  onClick={() => setAdminTab("banner-ads")}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${ adminTab === "banner-ads" ? "text-blue-400" : "text-slate-400 hover:text-slate-300" }`}
                  data-testid="button-admin-tab-banner-ads"
                >
                  <span>Banner Ads</span>
                  {adminTab === "banner-ads" && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}
                </button>
                <button
                  onClick={() => setAdminTab("admin-access")}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${ adminTab === "admin-access" ? "text-blue-400" : "text-slate-400 hover:text-slate-300" }`}
                  data-testid="button-admin-tab-admin-access"
                >
                  <span>Admin Access</span>
                  {adminTab === "admin-access" && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}
                </button>
                <button
                  onClick={() => setAdminTab("feedback")}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${ adminTab === "feedback" ? "text-green-400" : "text-slate-400 hover:text-slate-300" }`}
                  data-testid="button-admin-tab-feedback"
                >
                  <span>Feedback</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[11px] font-bold text-white ml-1 shadow-[0_0_10px_rgba(22,163,74,0.4)]">
                    {adminFeedbackItems.filter(f => f.type === 'feedback').length}
                  </span>
                  {adminTab === "feedback" && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  )}
                </button>
                <button
                  onClick={() => setAdminTab("feature-requests")}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${ adminTab === "feature-requests" ? "text-violet-400" : "text-slate-400 hover:text-slate-300" }`}
                  data-testid="button-admin-tab-feature-requests"
                >
                  <span>Requests</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white ml-1 shadow-[0_0_10px_rgba(124,58,237,0.4)]">
                    {adminFeedbackItems.filter(f => f.type === 'request').length}
                  </span>
                  {adminTab === "feature-requests" && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-thin-scrollbar min-h-[400px]">
              {adminTab === "admin-access" ? (
                <div className="relative h-full p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-[0px] pb-[0px] pl-[10px] pr-[10px]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 px-1 w-full pt-[1px] pb-[1px]">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Authorized Access</h4>
                      <div className="flex-1">
                        <div className="relative group w-full">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          <Input 
                            placeholder="Search accounts..." 
                            value={adminSearchQuery}
                            onChange={(e) => setAdminSearchQuery(e.target.value)}
                            className="h-7 w-full pl-7 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-[11px] focus-visible:ring-1 focus-visible:ring-blue-500/30 transition-all"
                            data-testid="input-admin-search"
                          />
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-4 px-2 border-slate-200 dark:border-slate-800 whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/50">{filteredAuthorizedUsers.length} Total</Badge>
                    </div>
                  </div>
                    <div className="mt-4 space-y-2">
                      {filteredAuthorizedUsers.map((user, index) => {
                        const initials = user.email.substring(0, 2).toUpperCase();
                        const isOwner = user.role === "owner";
                        const roleColor = user.role === "owner" ? "green" : user.role === "admin" ? "purple" : "blue";
                        return (
                          <div key={user.email} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl hover:border-blue-500/30 transition-all duration-300" data-testid={`admin-user-row-${index}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-${roleColor}-500/10 flex items-center justify-center border border-${roleColor}-500/20`}>
                                <span className={`text-[10px] font-bold text-${roleColor}-500`}>{initials}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{user.email}</span>
                                <span className={`text-[9px] font-medium capitalize ${user.role === "owner" ? "text-green-500" : user.role === "admin" ? "text-purple-500" : "text-blue-500"}`}>
                                  {user.role === "owner" ? "Primary Owner" : user.role}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isOwner ? (
                                <>
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                  <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                                </>
                              ) : (
                                <>
                                  <Badge variant="outline" className={`text-[8px] h-5 px-2 ${user.role === "admin" ? "border-purple-300 text-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-blue-300 text-blue-500 bg-blue-50 dark:bg-blue-900/20"}`}>
                                    {user.role === "admin" ? "Admin" : "Developer"}
                                  </Badge>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRevokeAdminAccess(user.email)}
                                    className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    data-testid={`button-revoke-${index}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  <Button
                    size="icon"
                    onClick={() => setShowAddAdminAccessDialog(true)}
                    className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-blue-500/50 hover:scale-105"
                    data-testid="button-add-admin-access"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              ) : adminTab === "bugs-list" ? (
                <div className="p-4 space-y-3 pt-[0px] pb-[0px] pl-[10px] pr-[10px] max-h-[450px] overflow-y-auto custom-thin-scrollbar">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reported Bugs</h3>
                    <button
                      onClick={() => setShowMagicBugBar(!showMagicBugBar)}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                        showMagicBugBar 
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30" 
                          : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                      data-testid="button-magic-bug-bar"
                    >
                       <Bug className="h-3 w-3" />
                      <span>AI Bug</span>
                    </button>
                  </div>
                  {showMagicBugBar && adminBugReports.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700/50">
                        <Bug className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Smart Bug Analysis</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div onClick={() => setBugListFilter(bugListFilter === 'critical' ? 'all' : 'critical')} className={`group p-2 rounded-lg transition-all cursor-pointer ${bugListFilter === 'critical' ? 'bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-500' : 'bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600'}`} data-testid="filter-critical">
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle className={`h-3 w-3 ${bugListFilter === 'critical' ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`} />
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${bugListFilter === 'critical' ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>Critical</span>
                          </div>
                          <div className="text-base font-bold text-slate-700 dark:text-slate-200">
                            {adminBugReports.filter(b => b.title?.toLowerCase().includes('error') || b.title?.toLowerCase().includes('crash') || b.title?.toLowerCase().includes('broken') || b.description?.toLowerCase().includes('critical')).length}
                          </div>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Errors & crashes</p>
                        </div>
                        <div onClick={() => setBugListFilter(bugListFilter === 'repeated' ? 'all' : 'repeated')} className={`group p-2 rounded-lg transition-all cursor-pointer ${bugListFilter === 'repeated' ? 'bg-yellow-100 dark:bg-yellow-900/40 border-2 border-yellow-400 dark:border-yellow-500' : 'bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600'}`} data-testid="filter-repeated">
                          <div className="flex items-center gap-1.5 mb-1">
                            <RefreshCw className={`h-3 w-3 ${bugListFilter === 'repeated' ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`} />
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${bugListFilter === 'repeated' ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-500 dark:text-slate-400'}`}>Repeated</span>
                          </div>
                          <div className="text-base font-bold text-slate-700 dark:text-slate-200">
                            {(() => {
                              const titles = adminBugReports.map(b => b.title?.toLowerCase().split(' ').slice(0, 2).join(' '));
                              const counts: Record<string, number> = {};
                              titles.forEach(t => { if (t) counts[t] = (counts[t] || 0) + 1; });
                              return Object.values(counts).filter(c => c > 1).reduce((a, b) => a + b, 0);
                            })()}
                          </div>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Similar reports</p>
                        </div>
                        <div onClick={() => setBugListFilter(bugListFilter === 'priority' ? 'all' : 'priority')} className={`group p-2 rounded-lg transition-all cursor-pointer ${bugListFilter === 'priority' ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500' : 'bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600'}`} data-testid="filter-priority">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Target className={`h-3 w-3 ${bugListFilter === 'priority' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${bugListFilter === 'priority' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>Priority</span>
                          </div>
                          <div className="text-base font-bold text-slate-700 dark:text-slate-200">
                            {adminBugReports.filter(b => b.status === 'pending' && (b.title?.toLowerCase().includes('not working') || b.title?.toLowerCase().includes('not loading') || b.title?.toLowerCase().includes('issue'))).length}
                          </div>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Fix ASAP</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 py-1.5 border-t border-slate-200 dark:border-slate-700/50">
                        {(() => {
                          const counts = adminBugReports.reduce((acc, bug) => {
                            const locate = bug.bugLocate || "others";
                            acc[locate] = (acc[locate] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          return (
                            <>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30">
                                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">journals {counts["journal"] || 0} bugs</span>
                              </div>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30">
                                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">others {counts["others"] || 0} bugs</span>
                              </div>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30">
                                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">social feed {counts["social_feed"] || 0} bugs</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      {adminBugReports.filter(b => b.title?.toLowerCase().includes('error') || b.title?.toLowerCase().includes('crash') || b.title?.toLowerCase().includes('not working')).length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Flame className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Top Priority Bugs</span>
                          </div>
                          <div className="space-y-1">
                            {adminBugReports.filter(b => b.title?.toLowerCase().includes('error') || b.title?.toLowerCase().includes('crash') || b.title?.toLowerCase().includes('not working')).slice(0, 3).map((bug, i) => (
                              <div key={bug.bugId || i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 flex-1 truncate">{bug.title}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                  {bug.status === 'pending' ? 'Pending' : bug.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {bugListFilter !== 'all' && (
                    <div className="flex items-center justify-between py-2 px-3 mb-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Filtering by:</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          bugListFilter === 'critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                          bugListFilter === 'repeated' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400' :
                          'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                        }`}>
                          {bugListFilter.charAt(0).toUpperCase() + bugListFilter.slice(1)}
                        </span>
                      </div>
                      <button 
                        onClick={() => setBugListFilter('all')} 
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
                        data-testid="clear-bug-filter"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    </div>
                  )}
                  {loadingBugReports ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500"></div>
                    </div>
                  ) : adminBugReports.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 dark:text-slate-500">No bug reports</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[380px] overflow-y-auto custom-thin-scrollbar">
                      {(() => {
                        const getFilteredBugs = () => {
                          if (bugListFilter === 'critical') {
                            return adminBugReports.filter(b => 
                              b.title?.toLowerCase().includes('error') || 
                              b.title?.toLowerCase().includes('crash') || 
                              b.title?.toLowerCase().includes('broken') || 
                              b.description?.toLowerCase().includes('critical')
                            );
                          }
                          if (bugListFilter === 'repeated') {
                            const titles = adminBugReports.map(b => b.title?.toLowerCase().split(' ').slice(0, 2).join(' '));
                            const counts: Record<string, number> = {};
                            titles.forEach(t => { if (t) counts[t] = (counts[t] || 0) + 1; });
                            const repeatedPrefixes = Object.entries(counts).filter(([_, c]) => c > 1).map(([t]) => t);
                            return adminBugReports.filter(b => {
                              const prefix = b.title?.toLowerCase().split(' ').slice(0, 2).join(' ');
                              return repeatedPrefixes.includes(prefix || '');
                            });
                          }
                          if (bugListFilter === 'priority') {
                            return adminBugReports.filter(b => b.status === 'pending');
                          }
                          return adminBugReports;
                        };
                        return getFilteredBugs().map((bug, index) => (
                        <div
                          key={bug.bugId || index}
                          className="group"
                          data-testid={`bug-item-${index}`}
                        >
                          <button
                            onClick={() => setExpandedBugId(expandedBugId === bug.bugId ? null : bug.bugId)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
                          >
                            <ChevronRight className={`h-3 w-3 text-slate-400 transition-transform ${expandedBugId === bug.bugId ? 'rotate-90' : ''}`} />
                            <span className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{bug.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${bug.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : bug.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : bug.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                              {bug.status === 'pending' ? 'Pending' : bug.status === 'in_progress' ? 'In Progress' : bug.status === 'resolved' ? 'Resolved' : 'Closed'}
                            </span>
                          </button>
                          {expandedBugId === bug.bugId && (
                            <div className="ml-5 mr-2 mt-1 mb-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/50 space-y-2">
                              <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {bug.username || 'Unknown'}
                                </span>
                                {bug.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {bug.email}
                                  </span>
                                )}
                                <span>{new Date(bug.reportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${bug.bugLocate === 'social_feed' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : bug.bugLocate === 'journal' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'}`}>
                                  {bug.bugLocate === 'social_feed' ? 'Social Feed' : bug.bugLocate === 'journal' ? 'Journal' : 'Others'}
                                </span>
                              </div>
                              {bug.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{bug.description}</p>
                              )}
                              {bug.bugMedia && bug.bugMedia.length > 0 && (
                                <div className="flex gap-2 pt-1 overflow-x-auto">
                                  {bug.bugMedia.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity">
                                      <img src={url} alt={`Bug media ${i + 1}`} className="w-full h-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ));
                      })()}
                    </div>
                  )}
                </div>
              ) : adminTab === "feedback" || adminTab === "feature-requests" ? (
                <div className="p-4 space-y-3 pt-[4px] pb-[0px] pl-[10px] pr-[10px] max-h-[450px] overflow-y-auto custom-thin-scrollbar">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {adminTab === "feedback" ? "User Feedback" : "Feature Requests"}
                    </h3>
                    <Badge variant="outline" className="text-[9px] h-4 px-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      {adminFeedbackItems.filter(f => f.type === (adminTab === "feedback" ? "feedback" : "request")).length} total
                    </Badge>
                  </div>
                  {adminFeedbackLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 dark:border-slate-600 border-t-green-500"></div>
                    </div>
                  ) : (() => {
                    const filtered = adminFeedbackItems.filter(f => f.type === (adminTab === "feedback" ? "feedback" : "request"));
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-10">
                          <p className="text-xs text-slate-400 dark:text-slate-500">No {adminTab === "feedback" ? "feedback" : "feature requests"} yet</p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {filtered.map((item: any, index: number) => (
                          <div key={item.feedbackId || index} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 space-y-1.5" data-testid={`feedback-item-${index}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${adminTab === "feedback" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-violet-500/10 text-violet-600 dark:text-violet-400"}`}>
                                  {(item.username || "?").substring(0, 1).toUpperCase()}
                                </div>
                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{item.username || "anonymous"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.rating > 0 && adminTab === "feedback" && (
                                  <div className="flex items-center gap-0.5">
                                    {[1,2,3,4,5].map(s => (
                                      <span key={s} className={`text-[10px] ${s <= item.rating ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"}`}>★</span>
                                    ))}
                                  </div>
                                )}
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                  {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${item.status === 'new' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : item.status === 'reviewed' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                  {item.status === 'new' ? 'New' : item.status === 'reviewed' ? 'Reviewed' : 'Done'}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : adminTab === "influencer" ? (
                <div className="relative h-full p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-[0px] pb-[0px] pl-[10px] pr-[10px]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 px-1 w-full pt-[1px] pb-[1px]">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Active Influencers</h4>
                      <div className="flex-1">
                        <div className="relative group w-full">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
                          <Input
                            placeholder="Search influencers..."
                            value={influencerListSearch}
                            onChange={(e) => setInfluencerListSearch(e.target.value)}
                            className="h-7 w-full pl-7 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-[11px] focus-visible:ring-1 focus-visible:ring-pink-500/30 transition-all"
                            data-testid="input-influencer-list-search"
                          />
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-4 px-2 border-slate-200 dark:border-slate-800 whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/50">
                        {influencerList.filter(p => (p.userEmail || '').toLowerCase().includes(influencerListSearch.toLowerCase()) || (p.displayName || '').toLowerCase().includes(influencerListSearch.toLowerCase())).length} Total
                      </Badge>
                    </div>
                  </div>
                  {/* Filter pills */}
                  <div className="flex gap-1.5 flex-wrap px-1 pt-1">
                    {([
                      { key: 'all', label: 'All' },
                      { key: 'active', label: 'Active' },
                      { key: 'expiring', label: 'Expiring Soon' },
                      { key: 'longest', label: 'Longest Period' },
                      { key: 'expired', label: 'Expired' },
                    ] as const).map(f => (
                      <button
                        key={f.key}
                        onClick={() => setInfluencerSortMode(f.key)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${
                          influencerSortMode === f.key
                            ? f.key === 'expired' ? 'bg-red-500 text-white border-red-500 shadow-sm'
                              : f.key === 'expiring' ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                              : 'bg-pink-500 text-white border-pink-500 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-pink-400 hover:text-pink-500'
                        }`}
                        data-testid={`filter-influencer-${f.key}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 max-h-[270px] overflow-y-auto custom-thin-scrollbar space-y-2 pr-0.5">
                    {influencerListLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 dark:border-slate-600 border-t-pink-500" />
                      </div>
                    ) : (() => {
                      const now = Date.now();
                      const filtered = influencerList
                        .filter(p => {
                          const matchSearch = (p.userEmail || '').toLowerCase().includes(influencerListSearch.toLowerCase()) || (p.displayName || '').toLowerCase().includes(influencerListSearch.toLowerCase());
                          if (!matchSearch) return false;
                          const expiry = new Date(p.expiryDate).getTime();
                          if (influencerSortMode === 'active') return expiry > now;
                          if (influencerSortMode === 'expired') return expiry <= now;
                          if (influencerSortMode === 'expiring') return expiry > now;
                          return true;
                        })
                        .sort((a, b) => {
                          if (influencerSortMode === 'expiring') return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                          if (influencerSortMode === 'longest') return b.days - a.days;
                          return 0;
                        });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                            {influencerListSearch ? 'No influencers match your search.' : influencerSortMode !== 'all' ? `No ${influencerSortMode} influencers.` : 'No active influencers yet. Tap + to add one.'}
                          </div>
                        );
                      }

                      return filtered.map((p, index) => {
                        const initials = (p.userEmail || '').substring(0, 2).toUpperCase();
                        const expiry = new Date(p.expiryDate);
                        const isExpired = expiry.getTime() < now;
                        const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now) / 86400000));
                        const isExpiringSoon = !isExpired && daysLeft <= 14;
                        return (
                          <div key={p.userId} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 rounded-xl hover:border-pink-500/30 transition-all duration-300" data-testid={`influencer-row-${index}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isExpired ? 'bg-red-500/10 border-red-500/20' : isExpiringSoon ? 'bg-orange-500/10 border-orange-500/20' : 'bg-pink-500/10 border-pink-500/20'}`}>
                                <span className={`text-[10px] font-bold ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-pink-500'}`}>{initials}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{p.userEmail}</span>
                                <span className={`text-[9px] font-medium ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-pink-500'}`}>
                                  {isExpired ? `Expired ${expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : `${daysLeft}d left · Exp ${expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[8px] h-5 px-2 ${isExpired ? 'border-red-300 text-red-500 bg-red-50 dark:bg-red-900/20' : isExpiringSoon ? 'border-orange-300 text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-pink-300 text-pink-500 bg-pink-50 dark:bg-pink-900/20'}`}>
                                {p.days}d
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={influencerRevoking === p.userId}
                                onClick={async () => {
                                  setInfluencerRevoking(p.userId);
                                  try {
                                    const res = await fetch(`/api/influencer/revoke/${encodeURIComponent(p.userId)}`, { method: 'POST' });
                                    if (res.ok) {
                                      setInfluencerList(prev => prev.filter(x => x.userId !== p.userId));
                                    }
                                  } catch (e) {
                                    console.warn('Failed to revoke influencer', e);
                                  } finally {
                                    setInfluencerRevoking(null);
                                  }
                                }}
                                className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                data-testid={`button-revoke-influencer-${index}`}
                              >
                                {influencerRevoking === p.userId ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <X className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <Button
                    size="icon"
                    onClick={() => { setShowAddInfluencerDialog(true); setInfluencerSelectedUser(null); setInfluencerEmailSearch(""); setInfluencerSearchResults([]); setInfluencerDays(90); setInfluencerActivated(null); }}
                    className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/30 transition-all duration-300 hover:shadow-pink-500/50 hover:scale-105"
                    data-testid="button-add-influencer"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              ) : (
                <div className="px-8 pb-8 text-center space-y-4 pt-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-2"><Activity className="h-6 w-6 text-slate-400 dark:text-slate-500" /></div>
                  <p className="text-slate-600 dark:text-slate-400">Welcome to the Admin Dashboard ({adminTab}). This area is currently under development.</p>
                  <Button variant="ghost" onClick={() => setShowAdminDashboardDialog(false)} className="w-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium">Dismiss</Button>
                </div>
              )}







            </div>
          </DialogContent>
        </Dialog>
{/* Report Bug Dialog */}
        <Dialog open={showReportBugDialog} onOpenChange={setShowReportBugDialog}>
          <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl p-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Report Bug
              </DialogTitle>
            </div>
            
            {/* Tab Switcher */}
            <div className="flex gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setReportBugTab("social-feed")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  reportBugTab === "social-feed"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                data-testid="tab-social-feed"
              >
                <Users className="h-4 w-4" />
                Social Feed
              </button>
              <button
                onClick={() => setReportBugTab("journal")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  reportBugTab === "journal"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                data-testid="tab-journal"
              >
                <BookOpen className="h-4 w-4" />
                Journal
              </button>
              <button
                onClick={() => setReportBugTab("others")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  reportBugTab === "others"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                data-testid="tab-others"
              >
                <Settings className="h-4 w-4" />
                Others
              </button>
            </div>
            
            {/* Form Content */}
            <div className="p-4 space-y-4">
              {/* Title Input */}
              <Input
                placeholder="Title"
                value={reportBugTitle}
                onChange={(e) => setReportBugTitle(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl"
                data-testid="input-report-bug-title"
              />
              
              {/* Description Textarea */}
              <Textarea
                placeholder="Describe the bug in detail..."
                value={reportBugDescription}
                onChange={(e) => setReportBugDescription(e.target.value)}
                className="w-full min-h-[100px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl resize-none"
                data-testid="input-report-bug-description"
              />
              
              {/* Multi-File Upload Area */}
              <div
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 pl-[0px] pr-[0px] pt-[0px] pb-[0px]"
                onClick={() => document.getElementById('report-bug-file-input')?.click()}
                tabIndex={0}
                onPaste={(e) => {
                  e.preventDefault();
                  const clipboardItems = e.clipboardData?.items;
                  if (!clipboardItems) return;
                  
                  const pastedFiles: File[] = [];
                  const maxSize = 10 * 1024 * 1024;
                  
                  for (let i = 0; i < clipboardItems.length; i++) {
                    const item = clipboardItems[i];
                    if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
                      const file = item.getAsFile();
                      if (file) {
                        if (file.size > maxSize) {
                          alert(`Pasted file exceeds 10MB limit`);
                        } else {
                          pastedFiles.push(file);
                        }
                      }
                    }
                  }
                  
                  if (pastedFiles.length > 0) {
                    const totalFiles = [...reportBugFiles, ...pastedFiles].slice(0, 5);
                    setReportBugFiles(totalFiles);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer?.files || []);
                  const maxSize = 10 * 1024 * 1024;
                  const validFiles = files.filter(file => {
                    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                      return false;
                    }
                    if (file.size > maxSize) {
                      alert(`File "${file.name}" exceeds 10MB limit`);
                      return false;
                    }
                    return true;
                  });
                  const totalFiles = [...reportBugFiles, ...validFiles].slice(0, 5);
                  setReportBugFiles(totalFiles);
                }}
                data-testid="dropzone-report-bug-files"
              >
                <input
                  id="report-bug-file-input"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const maxSize = 10 * 1024 * 1024; // 10MB
                    const validFiles = files.filter(file => {
                      if (file.size > maxSize) {
                        alert(`File "${file.name}" exceeds 10MB limit`);
                        return false;
                      }
                      return true;
                    });
                    const totalFiles = [...reportBugFiles, ...validFiles].slice(0, 5);
                    setReportBugFiles(totalFiles);
                  }}
                  data-testid="input-report-bug-files"
                />
                
                {reportBugFiles.length > 0 ? (
                  <div className="relative w-full min-h-[100px] p-2">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                      {reportBugFiles.map((file, index) => (
                        <div 
                          key={index} 
                          className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800"
                        >
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 dark:bg-teal-900/30">
                              <Upload className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                              <span className="text-[8px] text-teal-700 dark:text-teal-300 px-1 truncate w-full text-center">{file.name}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportBugFiles(reportBugFiles.filter((_, i) => i !== index));
                            }}
                            className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-gray-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded text-[10px] font-bold text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 shadow-sm">
                      {reportBugFiles.length}/5
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Upload className="h-8 w-8 text-teal-500 mb-2 opacity-80" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Click to upload, drag & drop, or paste</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Images & Videos (max 10MB, up to 5 files)</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportBugDialog(false);
                  setReportBugTitle("");
                  setReportBugDescription("");
                  setReportBugFiles([]);
                  setReportBugTab("social-feed");
                }}
                className="px-6"
                disabled={reportBugSubmitting}
                data-testid="button-cancel-report-bug"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReportBug}
                disabled={reportBugSubmitting || !reportBugTitle || !reportBugDescription}
                data-testid="button-submit-report-bug"
              >
                {reportBugSubmitting ? "Submitting..." : "Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Add Influencer Dialog */}
        <Dialog open={showAddInfluencerDialog} onOpenChange={(open) => { setShowAddInfluencerDialog(open); if (!open) { setInfluencerSelectedUser(null); setInfluencerEmailSearch(""); setInfluencerSearchResults([]); setInfluencerDays(90); setInfluencerActivated(null); } }}>
          <DialogContent className="w-[92vw] sm:max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-xl rounded-2xl p-0 overflow-visible gap-0">
            <DialogTitle className="sr-only">Add Influencer Access</DialogTitle>

            {influencerActivated ? (
              <div className="p-5 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Activated</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{influencerActivated.email}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[11px] font-bold text-pink-500">{influencerActivated.days}d</p>
                    <p className="text-[9px] text-slate-400">{new Date(influencerActivated.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] rounded-lg" onClick={() => { setInfluencerActivated(null); setInfluencerSelectedUser(null); setInfluencerEmailSearch(""); setInfluencerSearchResults([]); setInfluencerDays(90); }} data-testid="button-influencer-grant-another">
                    + Another
                  </Button>
                  <Button size="sm" className="flex-1 h-8 text-[11px] rounded-lg bg-pink-500 hover:bg-pink-600" onClick={() => { setShowAddInfluencerDialog(false); setInfluencerActivated(null); setInfluencerSelectedUser(null); setInfluencerEmailSearch(""); setInfluencerDays(90); loadInfluencerList(); }} data-testid="button-influencer-done">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {/* Title row */}
                <div className="flex items-center justify-between pb-0.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Influencer Access</span>
                  <button onClick={() => setShowAddInfluencerDialog(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" data-testid="button-close-influencer-dialog">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Email search */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="Search user by email..."
                      value={influencerEmailSearch}
                      autoFocus
                      onChange={async (e) => {
                        const val = e.target.value;
                        setInfluencerEmailSearch(val);
                        setInfluencerSelectedUser(null);
                        if (val.trim().length < 3) { setInfluencerSearchResults([]); return; }
                        setInfluencerSearchLoading(true);
                        try {
                          const res = await fetch(`/api/influencer/search-user?email=${encodeURIComponent(val.trim())}`);
                          const data = await res.json();
                          setInfluencerSearchResults(data.users || []);
                        } catch (e) { setInfluencerSearchResults([]); }
                        finally { setInfluencerSearchLoading(false); }
                      }}
                      className="h-8 w-full pl-7 pr-7 text-[11px] bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg focus-visible:ring-1 focus-visible:ring-pink-400"
                      data-testid="input-influencer-email-search"
                    />
                    {influencerSearchLoading && <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border border-pink-400 border-t-transparent rounded-full animate-spin" />}
                  </div>

                  {!influencerSelectedUser && influencerSearchResults.length > 0 && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[140px] overflow-y-auto custom-thin-scrollbar">
                      {influencerSearchResults.map((user, idx) => (
                        <button
                          key={user.userId}
                          onClick={() => { setInfluencerSelectedUser(user); setInfluencerSearchResults([]); setInfluencerEmailSearch(user.email); }}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/40 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors text-left"
                          data-testid={`button-influencer-select-user-${idx}`}
                        >
                          <div className="w-5 h-5 rounded-full bg-pink-500/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-bold text-pink-500">{(user.displayName || user.email).substring(0,2).toUpperCase()}</span>
                          </div>
                          <span className="flex-1 text-[10px] text-slate-700 dark:text-slate-200 truncate">{user.email}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {influencerSelectedUser && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200/60 dark:border-pink-800/60">
                      <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[7px] font-bold text-pink-500">{(influencerSelectedUser.displayName || influencerSelectedUser.email).substring(0,2).toUpperCase()}</span>
                      </div>
                      <span className="flex-1 text-[10px] font-medium text-pink-700 dark:text-pink-300 truncate">{influencerSelectedUser.email}</span>
                      <button onClick={() => { setInfluencerSelectedUser(null); setInfluencerEmailSearch(""); }} className="text-pink-300 hover:text-red-400" data-testid="button-influencer-deselect"><X className="h-3 w-3" /></button>
                    </div>
                  )}
                </div>

                {/* Duration row */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Duration</span>
                    <span className="text-[11px] font-bold text-pink-500">{influencerDays}d · exp {new Date(Date.now() + influencerDays * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[30, 60, 90, 180, 365].map(d => (
                      <button
                        key={d}
                        onClick={() => setInfluencerDays(d)}
                        className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-all border ${influencerDays === d ? 'bg-pink-500 text-white border-pink-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-pink-400'}`}
                        data-testid={`button-influencer-preset-${d}`}
                      >
                        {d === 30 ? '1M' : d === 60 ? '2M' : d === 90 ? '3M' : d === 180 ? '6M' : '1Y'}
                      </button>
                    ))}
                  </div>
                  <input type="range" min={7} max={365} step={1} value={influencerDays} onChange={(e) => setInfluencerDays(Number(e.target.value))} className="w-full h-1.5 rounded-full accent-pink-500" data-testid="slider-influencer-days" />
                </div>

                {/* Footer */}
                <div className="flex gap-2 pt-0.5">
                  <Button variant="outline" size="sm" onClick={() => setShowAddInfluencerDialog(false)} className="flex-1 h-8 text-[11px] rounded-lg" data-testid="button-cancel-influencer">Cancel</Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!influencerSelectedUser) return;
                      setInfluencerActivating(true);
                      try {
                        const res = await fetch('/api/influencer/set-period', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: influencerSelectedUser.userId, days: influencerDays, userEmail: influencerSelectedUser.email, displayName: influencerSelectedUser.displayName, grantedBy: currentUser?.email || 'admin' })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setInfluencerActivated({ userId: influencerSelectedUser.userId, email: influencerSelectedUser.email, days: influencerDays, expiryDate: data.period.expiryDate });
                        }
                      } catch (e) { console.warn('Failed to set influencer period', e); }
                      finally { setInfluencerActivating(false); }
                    }}
                    disabled={!influencerSelectedUser || influencerActivating}
                    className="flex-1 h-8 text-[11px] rounded-lg bg-pink-500 hover:bg-pink-600"
                    data-testid="button-influencer-activate"
                  >
                    {influencerActivating ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : 'Activate'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Admin Access Dialog */}
        <Dialog open={showAddAdminAccessDialog} onOpenChange={setShowAddAdminAccessDialog}>
          <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Add Admin Access
              </DialogTitle>
            </div>
            
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email"
                    placeholder="Enter email address..." 
                    value={adminAccessEmail}
                    onChange={(e) => setAdminAccessEmail(e.target.value)}
                    className="w-full pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                    data-testid="input-admin-access-email"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAdminAccessRole("developer")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      adminAccessRole === "developer"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                    data-testid="radio-role-developer"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      adminAccessRole === "developer" ? "border-blue-500" : "border-slate-400"
                    }`}>
                      {adminAccessRole === "developer" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <span className="font-medium">Developer</span>
                  </button>
                  <button
                    onClick={() => setAdminAccessRole("admin")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      adminAccessRole === "admin"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                    data-testid="radio-role-admin"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      adminAccessRole === "admin" ? "border-purple-500" : "border-slate-400"
                    }`}>
                      {adminAccessRole === "admin" && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                    </div>
                    <span className="font-medium">Admin</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddAdminAccessDialog(false);
                  setAdminAccessEmail("");
                  setAdminAccessRole("developer");
                }}
                className="px-6"
                data-testid="button-cancel-admin-access"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAdminAccess}
                disabled={!adminAccessEmail}
                className="px-6 bg-blue-500 hover:bg-blue-600"
                data-testid="button-save-admin-access"
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
                    {showTutorOverlay && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                          onClick={() => setShowTutorOverlay(false)}
                        />

                        {/* Sidebar */}
                        <div
                          className="fixed top-0 right-0 h-full w-96 bg-slate-50 dark:bg-slate-900 z-50 shadow-2xl transition-transform duration-500 ease-out"
                          style={{
                            animation: "slideInFromRight 0.5s ease-out",
                          }}
                        >
                          {/* Header with close button */}
                          <div className="flex items-center justify-start p-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-white" />
                              </div>
                              <span className="text-lg font-semibold text-white">
                                Mini-cast
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowTutorOverlay(false)}
                              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:bg-slate-800"
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>

                          {/* Scrollable content */}
                          <div className="h-full overflow-y-auto pb-20 custom-thin-scrollbar">
                            <div className="p-4 space-y-6">
                              {/* Welcome message */}
                              <div className="text-center space-y-2">
                                <h2 className="text-xl font-bold text-white">
                                  Mini-cast
                                </h2>
                                <p className="text-slate-600 dark:text-slate-300 text-sm">
                                  Interactive lessons and personalized guidance
                                </p>
                              </div>

                              {/* Quick access cards - vertical stack */}
                              <div className="space-y-4">
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-100 dark:bg-slate-700 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                      <BookOpen className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                      Trading Basics
                                    </h3>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                                    Learn fundamental concepts and strategies
                                  </p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-100 dark:bg-slate-700 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                      <BarChart3 className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                      Chart Analysis
                                    </h3>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                                    Master technical analysis and patterns
                                  </p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-100 dark:bg-slate-700 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                      <Target className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                      Risk Management
                                    </h3>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                                    Protect your capital with smart strategies
                                  </p>
                                </div>
                              </div>

                              {/* Additional learning sections */}
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">
                                  Quick Actions
                                </h3>

                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-100 dark:bg-slate-700 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                      <Lightbulb className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-white font-medium">
                                      Trading Tips
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-100 dark:bg-slate-700 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                      <AlertCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-white font-medium">
                                      Market Alerts
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 hover:bg-slate-100 dark:bg-slate-700 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                                      <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-white font-medium">
                                      Performance Insights
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Global CSS for animations */}
                    <style>{`
                  @keyframes slideUpFromBottom {
                    from {
                      transform: translateY(100%);
                    }
                    to {
                      transform: translateY(0);
                    }
                  }

                  @keyframes slideInFromRight {
                    from {
                      transform: translateX(100%);
                    }
                    to {
                      transform: translateX(0);
                    }
                  }
                `}</style>
                  </div>
                </div>
              </div>
            )}



            {activeTab === "trading-master" && currentUser?.email?.toLowerCase() === "chiranjeevi.perala99@gmail.com" && (
              <div className="h-full relative">
                {/* Back Button - Mobile Only */}
                <Button
                  onClick={() => setTabWithAuthCheck("trading-home")}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  data-testid="button-back-to-home-trading-master"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" /></div>}>
                  <TradingMaster />
                </Suspense>
              </div>
            )}


            {activeTab === "chart" && (
              <div className="h-full relative">
                <Button
                  onClick={() => setTabWithAuthCheck("trading-home")}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  data-testid="button-back-to-home-chart"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin" /></div>}>
                  <AdvancedCandlestickChart />
                </Suspense>
                <Suspense fallback={null}>
                  <IndicatorCrossingsDisplay />
                </Suspense>
              </div>
            )}

            {activeTab === "journal" && (
              <JournalTabContent
                setTabWithAuthCheck={setTabWithAuthCheck}
                mobileBottomTab={mobileBottomTab}
                setMobileBottomTab={setMobileBottomTab}
                mobileJournalPanel={mobileJournalPanel}
                setMobileJournalPanel={setMobileJournalPanel}
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
                setTradingDataByDate={setTradingDataByDate}
                journalChartMode={journalChartMode}
                setJournalChartMode={setJournalChartMode}
                handleCloseHeatmap={handleCloseHeatmap}
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
                imageUploadRef={imageUploadRef}
                tradingImages={tradingImages}
                setTradingImages={setTradingImages}
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
                showConnectDialog={showConnectDialog}
                showDeltaExchange={showDeltaExchange}
                setShowDeltaExchange={setShowDeltaExchange}
                connectedBrokersCount={connectedBrokersCount}
                setZerodhaAccessToken={setZerodhaAccessToken}
                setZerodhaIsConnected={setZerodhaIsConnected}
                upstoxAccessToken={upstoxAccessToken}
                setUpstoxAccessToken={setUpstoxAccessToken}
                setUpstoxIsConnected={setUpstoxIsConnected}
                setUserAngelOneToken={setUserAngelOneToken}
                setUserAngelOneIsConnected={setUserAngelOneIsConnected}
                setUserAngelOneName={setUserAngelOneName}
                setDhanAccessToken={setDhanAccessToken}
                setDhanIsConnected={setDhanIsConnected}
                setDhanClientName={setDhanClientName}
                setGrowwIsConnected={setGrowwIsConnected}
                setGrowwAccessToken={setGrowwAccessToken}
                setGrowwUserId={setGrowwUserId}
                setGrowwUserName={setGrowwUserName}
                setBrokerFunds={setBrokerFunds}
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
                heatmapMode={heatmapMode}
                setHeatmapMode={setHeatmapMode}
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
                saveAllTradingData={saveAllTradingData}
                getUserId={getUserId}
                setReportPostMode={setReportPostMode}
                setReportPostSelectedDate={setReportPostSelectedDate}
                setRangePostOverrideData={setRangePostOverrideData}
                setShowReportPostDialog={setShowReportPostDialog}
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
                setTradeHistoryData={setTradeHistoryData}
                setTradeHistoryData2={setTradeHistoryData2}
                setSelectedDate={setSelectedDate}
                theme={theme}
                targetPeriod={targetPeriod}
                setTargetPeriod={setTargetPeriod}
                targetAmount={targetAmount}
                setTargetAmount={setTargetAmount}
                prevProgressRef={prevProgressRef}
                isTortoiseFacingRightRef={isTortoiseFacingRightRef}
                selectedDateRange={selectedDateRange}
                riskCapital={riskCapital}
                setRiskCapital={setRiskCapital}
                riskRewardRatio={riskRewardRatio}
                setRiskRewardRatio={setRiskRewardRatio}
                isConnected={isConnected}
                totalBrokerFunds={totalBrokerFunds}
                allBrokerFunds={allBrokerFunds}
                journalFundBase={journalFundBase}
                setJournalFundBase={setJournalFundBase}
                journalWalletUserId={currentUser?.userId ?? null}
                influencerPeriod={influencerPeriod}
                currentUserName={currentUser?.displayName || currentUser?.username || ''}
                currentUserEmail={currentUser?.email || ''}
                activeBroker={activeBroker}
                getBrokerDisplayName={getBrokerDisplayName}
                brokerIconMap={brokerIconMap}
                formatDuration={formatDuration}
                isNavVisible={isNavVisible}
                navSparklineData={navSparklineData}
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
                showGuestDialog={showGuestDialog}
                setShowGuestDialog={setShowGuestDialog}
                journalCandleCountRef={journalCandleCountRef}
                journalCountdownBarRef={journalCountdownBarRef}
                journalLiveData={journalLiveData}
                isJournalStreaming={isJournalStreaming}
                liveOhlc={liveOhlc}
              />
            )}


          </div>
        </main>

        <Suspense fallback={null}>
        <BrokerData 
          showOrderModal={showOrderModal} 
          setShowOrderModal={setShowOrderModal}
          showSecondaryOrderModal={showSecondaryOrderModal}
          setShowSecondaryOrderModal={setShowSecondaryOrderModal}
          recordSecondaryBrokerOrders={recordSecondaryBrokerOrders}
          orderTab={orderTab} 
          setOrderTab={setOrderTab} 
          showUserId={showUserId} 
          setShowUserId={setShowUserId} 
          zerodhaClientId={zerodhaClientId} 
          zerodhaUserName={zerodhaUserName} 
          deltaExchangeIsConnected={deltaExchangeIsConnected}
          deltaExchangeApiKey={deltaExchangeApiKey}
          deltaExchangeApiSecret={deltaExchangeApiSecret}
          deltaExchangeUserId={deltaExchangeUserId}
          deltaExchangeAccountName={deltaExchangeAccountName}
          fyersStatus={fyersStatus}
          brokerOrders={zerodhaAccessToken ? brokerOrders : upstoxAccessToken ? brokerOrders : userAngelOneIsConnected ? brokerOrders : dhanAccessToken ? brokerOrders : growwAccessToken ? (brokerOrders || []) : deltaExchangeIsConnected ? (deltaExchangeTradesData || []) : fyersIsConnected ? (fyersOrders || []) : []}
          fetchingBrokerOrders={zerodhaAccessToken ? fetchingBrokerOrders : upstoxAccessToken ? fetchingBrokerOrders : userAngelOneIsConnected ? fetchingBrokerOrders : dhanAccessToken ? (fetchingBrokerOrders || false) : growwAccessToken ? (fetchingBrokerOrders || false) : deltaExchangeIsConnected ? deltaExchangeFetching : fetchingFyersOrders}
          zerodhaAccessToken={zerodhaAccessToken}
          recordAllBrokerOrders={recordAllBrokerOrders}
          upstoxAccessToken={upstoxAccessToken}
          upstoxUserId={upstoxUserId}
          upstoxUserName={upstoxUserName}
          dhanAccessToken={dhanAccessToken}
          dhanUserId={dhanClientIdInput}
          dhanClientName={dhanClientName || "Dhan User"}
          growwAccessToken={growwAccessToken}
          growwUserId={growwUserId}
          growwUserName={growwUserName || "Groww User"}
          brokerPositions={zerodhaAccessToken ? brokerPositions : upstoxAccessToken ? brokerPositions : userAngelOneIsConnected ? brokerPositions : dhanAccessToken ? brokerPositions : growwAccessToken ? (brokerPositions || []) : deltaExchangeIsConnected ? (deltaExchangePositionsData || []) : fyersIsConnected ? (fyersPositions || []) : []}
          fetchingBrokerPositions={zerodhaAccessToken ? fetchingBrokerPositions : upstoxAccessToken ? fetchingBrokerPositions : userAngelOneIsConnected ? fetchingBrokerPositions : dhanAccessToken ? (fetchingBrokerOrders || false) : growwAccessToken ? (fetchingBrokerPositions || false) : deltaExchangeIsConnected ? deltaExchangeFetching : fetchingFyersPositions}
          angelOneAccessToken={userAngelOneToken}
          angelOneClientCode={localStorage.getItem("angel_one_client_code")}
          angelOneUserName={userAngelOneName}
          secondaryBroker={secondaryBroker}
          secondaryBrokerOrders={secondaryBroker === 'fyers' ? (fyersOrders || []) : secondaryBroker === 'delta' ? (deltaExchangeTradesData || []) : broker2Orders}
          secondaryBrokerPositions={secondaryBroker === 'fyers' ? (fyersPositions || []) : secondaryBroker === 'delta' ? (deltaExchangePositionsData || []) : broker2Positions}
          secondaryBrokerFunds={broker2Funds}
          fetchingSecondaryBroker={fetchingBroker2}
          showBrokerImportModal={showBrokerImportModal} 
          setShowBrokerImportModal={setShowBrokerImportModal} 
          handleBrokerImport={handleBrokerImport} 
          showImportModal={showImportModal} 
          setShowImportModal={setShowImportModal} 
          handleFileUpload={handleFileUpload} 
          activeFormat={activeFormat} 
          detectedFormatLabel={detectedFormatLabel} 
          isBuildMode={isBuildMode} 
          setIsBuildMode={setIsBuildMode} 
          brokerSearchInput={brokerSearchInput} 
          setBrokerSearchInput={setBrokerSearchInput} 
          showBrokerSuggestions={showBrokerSuggestions} 
          setShowBrokerSuggestions={setShowBrokerSuggestions} 
          filteredBrokers={filteredBrokers} 
          buildModeData={buildModeData} 
          setBuildModeData={setBuildModeData} 
          allColumnsFilledForSave={allColumnsFilledForSave} 
          missingColumns={missingColumns} 
          saveFormatToUniversalLibrary={saveFormatToUniversalLibrary} 
          currentUser={currentUser} 
          getCognitoToken={getCognitoToken} 
          setSavedFormats={setSavedFormats} 
          importDataTextareaRef={importDataTextareaRef} brokerFunds={brokerFunds}
          isDemoMode={isDemoMode}
        />
        </Suspense>
        {/* Broker Funds Breakup Dialog */}
        <Suspense fallback={null}>
        <ImportPnLDialog
          showImportModal={showImportModal}
          setShowImportModal={setShowImportModal}
          importData={importData}
          setImportData={setImportData}
          handleFileUpload={handleFileUpload}
          activeFormat={activeFormat}
          setActiveFormat={setActiveFormat}
          detectedFormatLabel={detectedFormatLabel}
          setDetectedFormatLabel={setDetectedFormatLabel}
          isBuildMode={isBuildMode}
          setIsBuildMode={setIsBuildMode}
          brokerSearchInput={brokerSearchInput}
          setBrokerSearchInput={setBrokerSearchInput}
          showBrokerSuggestions={showBrokerSuggestions}
          setShowBrokerSuggestions={setShowBrokerSuggestions}
          filteredBrokers={filteredBrokers}
          buildModeData={buildModeData}
          setBuildModeData={setBuildModeData}
          allColumnsFilledForSave={allColumnsFilledForSave}
          missingColumns={missingColumns}
          saveFormatToUniversalLibrary={saveFormatToUniversalLibrary}
          currentUser={currentUser}
          getCognitoToken={getCognitoToken}
          setSavedFormats={setSavedFormats}
          savedFormats={savedFormats}
          showSavedFormatsDropdown={showSavedFormatsDropdown}
          setShowSavedFormatsDropdown={setShowSavedFormatsDropdown}
          formatsLoading={formatsLoading}
          setFormatsLoading={setFormatsLoading}
          userSelectedFormatId={userSelectedFormatId}
          setUserSelectedFormatId={setUserSelectedFormatId}
          importDataTextareaRef={importDataTextareaRef}
          importError={importError}
          setImportError={setImportError}
          parseErrors={parseErrors}
          setParseErrors={setParseErrors}
          handleImportData={handleImportData}
          parseTradesWithFormat={parseTradesWithFormat}
          recalculateFormatPositions={recalculateFormatPositions}
          toast={toast}
        />

        {/* Trading Challenge Coming Soon Modal */}
        <Dialog open={showTradingChallengeModal} onOpenChange={setShowTradingChallengeModal}>
          <DialogContent className="w-[90vw] max-w-xs rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-0 bg-white dark:bg-slate-900 [&>button]:hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Trophy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Trade Challenge</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400">Coming Soon</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTradingChallengeModal(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                data-testid="button-close-challenge-modal-x"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Features */}
            <div className="px-4 py-3 space-y-0">
              {[
                { label: 'Compete with traders', sub: 'Join 7-day trading challenges' },
                { label: 'Live P&L tracking', sub: 'Real-time ranking by your trades' },
                { label: 'Leaderboard rankings', sub: 'See your position among all traders' },
                { label: 'Win rewards', sub: 'Earn badges and recognition' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0 mt-1.5" />
                  <div>
                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-4 pb-4 pt-1">
              <Button
                onClick={() => setShowTradingChallengeModal(false)}
                variant="outline"
                className="w-full h-8 text-xs font-medium border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                data-testid="button-close-challenge-modal"
              >
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Suspense fallback={null}>
          <TradingJournalModal open={!!showJournalInfoModal} onOpenChange={setShowJournalInfoModal} isAutoPopup={showJournalInfoModal === "auto"} />
        </Suspense>


        {/* Paper Trading (Demo Trading) Modal - Minimalist Design */}
        <PaperTradingModal
          showPaperTradingModal={showPaperTradingModal}
          setShowPaperTradingModal={setShowPaperTradingModal}
          hidePositionDetails={hidePositionDetails}
          setHidePositionDetails={setHidePositionDetails}
          paperPositions={paperPositions}
          paperTradeCurrentPrice={paperTradeCurrentPrice}
          setPaperTradeCurrentPrice={setPaperTradeCurrentPrice}
          paperTradeHistory={paperTradeHistory}
          paperTradeLotInput={paperTradeLotInput}
          setPaperTradeLotInput={setPaperTradeLotInput}
          paperTradePriceLoading={paperTradePriceLoading}
          paperTradeQuantity={paperTradeQuantity}
          setPaperTradeQuantity={setPaperTradeQuantity}
          paperTradeSLDurationUnit={paperTradeSLDurationUnit}
          setPaperTradeSLDurationUnit={setPaperTradeSLDurationUnit}
          paperTradeSLEnabled={paperTradeSLEnabled}
          setPaperTradeSLEnabled={setPaperTradeSLEnabled}
          paperTradeSLTimeframe={paperTradeSLTimeframe}
          setPaperTradeSLTimeframe={setPaperTradeSLTimeframe}
          paperTradeSLType={paperTradeSLType}
          setPaperTradeSLType={setPaperTradeSLType}
          paperTradeSLValue={paperTradeSLValue}
          setPaperTradeSLValue={setPaperTradeSLValue}
          paperTradeSLPrice={paperTradeSLPrice}
          setPaperTradeSLPrice={setPaperTradeSLPrice}
          paperTradeSearchLoading={paperTradeSearchLoading}
          paperTradeSearchResults={paperTradeSearchResults}
          paperTradeSymbol={paperTradeSymbol}
          setPaperTradeSymbol={setPaperTradeSymbol}
          paperTradeSymbolSearch={paperTradeSymbolSearch}
          setPaperTradeSymbolSearch={setPaperTradeSymbolSearch}
          paperTradeType={paperTradeType}
          setPaperTradeType={setPaperTradeType}
          paperTradingCapital={paperTradingCapital}
          paperTradingTotalPnl={paperTradingTotalPnl}
          paperTradingWsStatus={paperTradingWsStatus}
          setPaperTradingWsStatus={setPaperTradingWsStatus}
          showMobilePaperTradeSLDropdown={showMobilePaperTradeSLDropdown}
          setShowMobilePaperTradeSLDropdown={setShowMobilePaperTradeSLDropdown}
          showPaperTradeSLDropdown={showPaperTradeSLDropdown}
          setShowPaperTradeSLDropdown={setShowPaperTradeSLDropdown}
          setPaperTradeAction={setPaperTradeAction}
          setPaperTradeSearchResults={setPaperTradeSearchResults}
          setSelectedPaperTradingInstrument={setSelectedPaperTradingInstrument}
          setShowOptionChain={setShowOptionChain}
          executePaperTrade={executePaperTrade}
          exitAllPaperPositions={exitAllPaperPositions}
          exitPosition={exitPosition}
          fetchOptionChainData={fetchOptionChainData}
          fetchPaperTradePrice={fetchPaperTradePrice}
          getLotSizeForInstrument={getLotSizeForInstrument}
          recordAllPaperTrades={recordAllPaperTrades}
          resetPaperTradingAccount={resetPaperTradingAccount}
          searchPaperTradingInstruments={searchPaperTradingInstruments}
          paperTradingEventSourcesRef={paperTradingEventSourcesRef}
          toast={toast}
        />

        {/* Save Confirmation Dialog - Minimalistic Design */}
        <Dialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
          <DialogContent className="w-[95vw] max-w-sm rounded-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              {saveConfirmationData?.error ? (
                <>
                  <DialogTitle className="text-red-600">Save Failed</DialogTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {saveConfirmationData.errorMessage}
                  </p>
                </>
              ) : (
                <>
                  <DialogTitle className="text-green-600">Saved Successfully</DialogTitle>
                  <div className="space-y-2 text-sm mt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="font-medium">{saveConfirmationData?.formattedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Saved to:</span>
                      <span className="font-medium">{saveConfirmationData?.saveLocation}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Trades:</span>
                        <span>{saveConfirmationData?.trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                        <span>{saveConfirmationData?.notes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tags:</span>
                        <span>{saveConfirmationData?.tags}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Images:</span>
                        <span>{saveConfirmationData?.images}</span>
                      </div>
                      <div className="flex justify-start font-semibold">
                        <span className="text-gray-600 dark:text-gray-400">Net P&L:</span>
                        <span>₹{saveConfirmationData?.netPnL}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogHeader>
            <div className="flex justify-center gap-3 mt-4">
              <Button
                onClick={() => setShowSaveConfirmation(false)}
                variant={saveConfirmationData?.error ? "outline" : "default"}
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Passcode Modal */}
        <Dialog open={showPasscodeModal} onOpenChange={setShowPasscodeModal}>
          <DialogContent className="w-[95vw] max-w-sm rounded-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center">Enter Passcode</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                This section is protected. Please enter the passcode to
                continue.
              </div>
              <div className="flex justify-center">
                <Input
                  type="password"
                  placeholder="Enter 4-digit passcode"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-40 text-center text-lg tracking-widest"
                  maxLength={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePasscodeSubmit();
                    }
                  }}
                  autoFocus
                  data-testid="input-passcode"
                />
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePasscodeCancel}
                  data-testid="button-cancel-passcode"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasscodeSubmit}
                  data-testid="button-submit-passcode"
                >
                  Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Option Chain Modal */}
        <Dialog open={showOptionChain} onOpenChange={(open) => { setShowOptionChain(open); if (open) { fetchOptionChainData(selectedOptionIndex); } }}>
          <DialogContent className="w-[95vw] max-w-2xl p-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 max-h-[90dvh] overflow-y-auto">

            {/* Desktop Header */}
            <div className="block border-b border-gray-200 dark:border-gray-700 px-4 py-2">
              <div className="flex items-center justify-center mb-2">
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Spot: ₹{(optionChainData?.spotPrice || 0)?.toLocaleString()}</span>
              </div>

              {/* Desktop Controls */}
              <div className="flex items-center justify-center gap-2">
                <Select value={selectedOptionIndex} onValueChange={(val) => { setSelectedOptionIndex(val); setSelectedOptionExpiryDate(""); setOptionChainData(null); setTimeout(() => fetchOptionChainData(val), 0); }}>
                  <SelectTrigger className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white text-xs w-auto" data-testid="select-option-index">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                    <SelectItem value="NIFTY">NIFTY</SelectItem>
                    <SelectItem value="BANKNIFTY">BANKNIFTY</SelectItem>
                    <SelectItem value="SENSEX">SENSEX</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedOptionExpiryDate || (getOptionExpiryDates(selectedOptionIndex)[0]?.value || "")} onValueChange={(val) => { setSelectedOptionExpiryDate(val); fetchOptionChainData(selectedOptionIndex, val); }}>
                  <SelectTrigger className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white text-xs w-auto" data-testid="select-option-expiry-date">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                    {getOptionExpiryDates(selectedOptionIndex).slice(0, 3).map((date) => (
                      <SelectItem key={date.value} value={date.value}>
                        {date.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Area */}
            {/* Desktop Table View */}
            <div className="px-2 md:px-6 py-4 overflow-y-auto max-h-[70vh]">
              {optionChainLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading {selectedOptionIndex} options...</p>
                </div>
              )}

              {!optionChainLoading && optionChainData && (() => {
                const getOptionSymbols = () => {
                  const calls = optionChainData?.calls || [];
                  const puts = optionChainData?.puts || [];
                  const effectiveExpiry = normalizeExpiryDate(getEffectiveExpiry());
                  const filteredCalls = filterOptionsByExpiry(calls, effectiveExpiry);
                  const filteredPuts = filterOptionsByExpiry(puts, effectiveExpiry);
                  return { calls: filteredCalls, puts: filteredPuts };
                };

                const { calls, puts } = getOptionSymbols();
                const currentPrice = optionChainData?.spotPrice || 0;
                const allStrikes = new Set();
                calls.forEach(c => allStrikes.add(c.strikePrice));
                puts.forEach(p => allStrikes.add(p.strikePrice));
                const strikeArray = Array.from(allStrikes) as number[];
                let atmStrike = null;
                if (strikeArray.length > 0) {
                  atmStrike = strikeArray.reduce((nearest, strike) => 
                    Math.abs(strike - currentPrice) < Math.abs(nearest - currentPrice) ? strike : nearest
                  );
                }

                const filteredCalls = (() => {
                  const itm = calls.filter(c => c.strikePrice < currentPrice && c.strikePrice !== atmStrike).reverse().slice(0, 10).reverse();
                  const oTm = calls.filter(c => c.strikePrice > currentPrice && c.strikePrice !== atmStrike).slice(0, 10);
                  const atm = atmStrike ? calls.filter(c => c.strikePrice === atmStrike).slice(0, 1) : [];
                  return [...itm, ...atm, ...oTm].sort((a, b) => a.strikePrice - b.strikePrice);
                })();

                const filteredPuts = (() => {
                  const itm = puts.filter(p => p.strikePrice > currentPrice && p.strikePrice !== atmStrike).slice(0, 10);
                  const oTm = puts.filter(p => p.strikePrice < currentPrice && p.strikePrice !== atmStrike).reverse().slice(0, 10).reverse();
                  const atm = atmStrike ? puts.filter(p => p.strikePrice === atmStrike).slice(0, 1) : [];
                  return [...oTm, ...atm, ...itm].sort((a, b) => a.strikePrice - b.strikePrice);
                })();

                const maxRows = Math.max(filteredCalls.length, filteredPuts.length);
                const getOptionStatus = (strike, isCall) => {
                  const allStrikes = new Set();
                  calls.forEach(c => allStrikes.add(c.strikePrice));
                  puts.forEach(p => allStrikes.add(p.strikePrice));
                  const strikeArray = Array.from(allStrikes);
                  if (strikeArray.length === 0) return 'OTM';
                  if (strike === atmStrike) return 'ATM';
                  if (isCall) return strike < currentPrice ? 'ITM' : 'OTM';
                  return strike > currentPrice ? 'ITM' : 'OTM';
                };

                const getExchangeForIndex = (index: string): string => {
                  const exchangeMap: Record<string, string> = {
                    'NIFTY': 'NFO',
                    'BANKNIFTY': 'NFO',
                    'SENSEX': 'BFO',
                    'MIDCPNIFTY': 'NFO'
                  };
                  return exchangeMap[index] || 'NFO';
                };

                const handleOptionClick = async (option: any) => {
                  const { symbol: instrumentSymbol, ltp, token: optionToken, exchange: optionExchange } = option;
                  setPaperTradeSymbol(instrumentSymbol);
                  setPaperTradeSymbolSearch(instrumentSymbol);
                  setPaperTradeType('OPTIONS');
                  setPaperTradeLotInput("1");

                  if (ltp && ltp > 0) {
                    setPaperTradeCurrentPrice(ltp);
                    setPaperTradePriceLoading(false);
                    const optionInstrument = {
                      symbol: instrumentSymbol,
                      exchange: optionExchange || getExchangeForIndex(selectedOptionIndex),
                      token: optionToken || '',
                      name: instrumentSymbol
                    };
                    setSelectedPaperTradingInstrument(optionInstrument);
                    fetchPaperTradePrice(optionInstrument);
                  }
                  setShowOptionChain(false);
                };

                const getClasses = (strike, isCall) => {
                  const status = getOptionStatus(strike, isCall);
                  if (status === 'ATM') return 'px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded text-center cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors';
                  if (status === 'ITM' && isCall) return 'px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded text-center cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors';
                  if (status === 'ITM') return 'px-2 py-1 bg-red-100 dark:bg-red-900/20 rounded text-center cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors';
                  return 'px-2 py-1 bg-gray-100 dark:bg-gray-800/40 rounded text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800/60 transition-colors';
                };

                const getTextClasses = (strike, isCall) => {
                  const status = getOptionStatus(strike, isCall);
                  if (status === 'ATM') return 'text-xs font-semibold text-yellow-900 dark:text-yellow-300';
                  if (status === 'ITM' && isCall) return 'text-xs font-semibold text-green-900 dark:text-green-300';
                  if (status === 'ITM') return 'text-xs font-semibold text-red-900 dark:text-red-300';
                  return 'text-xs font-semibold text-gray-700 dark:text-gray-400';
                };

                const getPriceClasses = (strike, isCall) => {
                  const status = getOptionStatus(strike, isCall);
                  if (status === 'ATM') return 'text-xs text-yellow-700 dark:text-yellow-400 mt-0.5';
                  if (status === 'ITM' && isCall) return 'text-xs text-green-700 dark:text-green-400 mt-0.5';
                  if (status === 'ITM') return 'text-xs text-red-700 dark:text-red-400 mt-0.5';
                  return 'text-xs text-gray-600 dark:text-gray-500 mt-0.5';
                };

                if (maxRows === 0) {
                  return <div className="text-center py-8"><p className="text-sm text-gray-600 dark:text-gray-400">No options available for {selectedOptionIndex} on {selectedOptionExpiryDate}</p></div>;
                }

                return <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700"><tr><th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">CE</th><th className="text-center py-2 px-2 font-semibold text-gray-900 dark:text-white">Strike</th><th className="text-right py-2 px-3 font-semibold text-gray-900 dark:text-white">PE</th></tr></thead><tbody>{Array.from({ length: maxRows }).map((_, index) => <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"><td className="py-2 px-3">{filteredCalls[index] ? <div onClick={() => handleOptionClick(filteredCalls[index])} className={getClasses(filteredCalls[index].strikePrice, true)} data-testid={`option-call-${filteredCalls[index].strikePrice}`}><div className={getPriceClasses(filteredCalls[index].strikePrice, true)}>₹{filteredCalls[index].ltp?.toFixed(2) || 0}</div></div> : null}</td><td className="py-2 px-2 text-center font-medium text-gray-700 dark:text-gray-300">{filteredCalls[index]?.strikePrice || filteredPuts[index]?.strikePrice || '-'}</td><td className="py-2 px-3 text-right">{filteredPuts[index] ? <div onClick={() => handleOptionClick(filteredPuts[index])} className={getClasses(filteredPuts[index].strikePrice, false)} data-testid={`option-put-${filteredPuts[index].strikePrice}`}><div className={getPriceClasses(filteredPuts[index].strikePrice, false)}>₹{filteredPuts[index].ltp?.toFixed(2) || 0}</div></div> : null}</td></tr>)}</tbody></table></div>;
              })()}
            </div>
          </DialogContent>
        </Dialog>


        {/* Trading Master Coming Soon Modal */}
        <Dialog open={showTradingMasterComingSoon} onOpenChange={setShowTradingMasterComingSoon}>
          <DialogContent className="w-[90vw] max-w-xs rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-0 bg-white dark:bg-slate-900 [&>button]:hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Trading Master</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400">Coming Soon</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTradingMasterComingSoon(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                data-testid="button-close-trading-master-x"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Features */}
            <div className="px-4 py-3 space-y-1.5">
              {[
                { label: 'Pattern recognition & signals' },
                { label: 'AI-powered trade analysis' },
                { label: 'Real-time strategy backtesting' },
                { label: 'Multi-timeframe trend analysis' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-4 pb-4 pt-1">
              <Button
                onClick={() => setShowTradingMasterComingSoon(false)}
                variant="outline"
                className="w-full h-8 text-xs font-medium border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                data-testid="button-close-trading-master-coming-soon"
              >
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Journal AI Dialog */}
        <Dialog open={showJournalAI} onOpenChange={setShowJournalAI}>
          <DialogContent className="w-[95vw] max-w-5xl max-h-[85vh] h-auto sm:h-[85vh] overflow-y-auto p-0 rounded-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  Trading Journal AI Assistant
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 sm:h-full">
                {/* Performance Report */}
                <div className="lg:col-span-2 p-6 overflow-y-auto max-h-[50vh] sm:max-h-none">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {journalAIData?.report ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {journalAIData.report}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Loading journal analysis...
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Trend Chart */}
                <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-800 p-6 border-t lg:border-t-0 border-l-0 lg:border-l border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Performance Trend
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Not Profitable</span>
                      </div>
                    </div>

                    <div className="h-[250px]">
                      {journalAIData?.performanceData &&
                      journalAIData.performanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={journalAIData.performanceData}
                            margin={{
                              top: 20,
                              right: 20,
                              left: 20,
                              bottom: 20,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="performanceGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="rgb(107, 114, 128)"
                                  stopOpacity={0.4}
                                />
                                <stop
                                  offset="100%"
                                  stopColor="rgb(107, 114, 128)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="day"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "#6B7280" }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "#6B7280" }}
                              tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(17, 24, 39, 0.95)",
                                border: "none",
                                borderRadius: "8px",
                                color: "white",
                                fontSize: "12px",
                              }}
                              formatter={(value: any, name: string) => [
                                `₹${parseFloat(value).toFixed(2)}`,
                                "P&L",
                              ]}
                              labelFormatter={(label) => `Day: ${label}`}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="rgb(107, 114, 128)"
                              strokeWidth={2}
                              fill="url(#performanceGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">
                              No performance data available
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Mobile Paper Trade Tab - Full Screen */}
        {activeTab !== "journal" && mobileBottomTab === "paper-trade" && (
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

        {/* Share Tradebook Dialog */}
        <Suspense fallback={null}>
          <ShareReportTradebookDialog
            open={showShareDialog}
            handleShareDialogClose={handleShareDialogClose}
            setShowShareDialog={setShowShareDialog}
            setShareDialogTagHighlight={setShareDialogTagHighlight}
            shareableUrl={shareableUrl}
            isCreatingShareableLink={isCreatingShareableLink}
            handleCreateShareableLink={handleCreateShareableLink}
            isSharedReportMode={isSharedReportMode}
            sharedReportData={sharedReportData}
            currentUser={currentUser}
            getFilteredHeatmapData={getFilteredHeatmapData}
            setJournalChartMode={setJournalChartMode}
            fetchHeatmapChartData={fetchHeatmapChartData}
            toast={toast}
          />
        </Suspense>

        {/* Post to NeoFeed Composition Dialog */}
        <Suspense fallback={null}>
          <NeoFeedPostDialog
            open={showReportPostDialog}
            onOpenChange={setShowReportPostDialog}
            reportPostMode={reportPostMode}
            setReportPostMode={setReportPostMode}
            reportPostDescription={reportPostDescription}
            setReportPostDescription={setReportPostDescription}
            reportPostSelectedDate={reportPostSelectedDate}
            setReportPostSelectedDate={setReportPostSelectedDate}
            rangePostOverrideData={rangePostOverrideData}
            setRangePostOverrideData={setRangePostOverrideData}
            tradingDataByDate={tradingDataByDate}
            getFilteredHeatmapData={getFilteredHeatmapData}
            currentUser={currentUser}
            isPostingReport={isPostingReport}
            setIsPostingReport={setIsPostingReport}
            isDemoMode={isDemoMode}
          />
        </Suspense>

        {/* Brokerage Charges Breakdown Dialog */}
        {/* Journal Charges Dialog */}

        </Suspense>
      </div>
    </div>
  );
}
