import { useState, useRef, useEffect, useMemo, memo, JSX, createContext, useContext, useCallback, type ReactNode } from 'react';
import { DemoHeatmap } from './DemoHeatmap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { PostCreationPanel } from './post-creation-panel';
import { LiveBanner } from './live-banner';
import type { SocialPost } from '@shared/schema';
import { AudioModeProvider, useAudioMode } from '@/contexts/AudioModeContext';
import { 
  Search, Bell, Settings, MessageCircle, Repeat, Heart, 
  Share, MoreHorizontal, CheckCircle, BarChart3, Clock,
  TrendingUp, TrendingDown, Activity, Plus, Home, PenTool,
  Copy, ExternalLink, X, Send, Bot, Trash2, User, MapPin, Calendar,
  ChevronDown, ChevronUp, ArrowLeft, Check, Layers, Mic, Newspaper,
  Users, UserPlus, ThumbsUp, Loader2, Camera, ZoomIn, ZoomOut, Move,
  Link as LinkIcon, Facebook, MessageCircle as WhatsApp, Send as Telegram, Linkedin,
  Info, Pencil, Award, Flame, Lock, Unlock, BookOpen, Target as TargetIcon, Zap, Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { SwipeableCarousel } from './swipeable-carousel';
import { AIChatWindow } from './ai-chat-window';
import { UserIdSetupDialog } from './user-id-setup-dialog';
import { UserProfileDropdown } from './user-profile-dropdown';
import { AudioMinicastCard } from './audio-minicast-card';
import { AudioSelectedPostsPreview } from './audio-selected-posts-preview';
import { getCognitoToken, getCognitoUser } from '@/cognito';

interface FeedPost {
  id: string | number;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatar?: string | null;
  authorVerified?: boolean;
  authorFollowers?: number | null;
  content: string;
  likes?: number;
  comments?: number;
  reposts?: number;
  tags?: string[];
  stockMentions?: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral' | null;
  hasImage?: boolean;
  imageUrl?: string | null;
  hasImages?: boolean;  // Support for future multi-image feature
  imageUrls?: string[];  // Support for future multi-image feature
  isAudioPost?: boolean; // Audio minicast post flag
  selectedPostIds?: (string | number)[]; // Selected posts for audio minicast
  selectedPosts?: Array<{ id: string | number; content: string }>; // Selected posts content for audio minicast
  metadata?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  ticker?: string;
  timestamp?: string;
  // Repost support - reposts are now stored as separate posts with their own engagement
  isRepost?: boolean;
  originalPostId?: string;
  originalAuthorUsername?: string;
  originalAuthorDisplayName?: string;
  originalAuthorAvatar?: string | null;
  originalAuthorVerified?: boolean;
  // Legacy repostedBy structure (deprecated - now authorUsername/authorDisplayName is the reposter)
  repostedBy?: {
    userId: string;
    displayName: string;
    repostedAt: string;
  };
  // Legacy support for the old structure
  user?: {
    initial: string;
    username: string;
    handle: string;
    verified: boolean;
    online: boolean;
    avatar?: string;
  };
  metrics?: {
    comments: number;
    reposts: number;
    likes: number;
  };
  hasMedia?: boolean;
}

// User mention suggestion interface
interface MentionSuggestion {
  username: string;
  displayName: string;
  avatar: string | null;
  userId: string | null;
}

// Format timestamp for comments
function formatCommentTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

// ─── Live avatar mirror context ──────────────────────────────────────────────
// Instead of relying on the stale authorAvatar stored in each post/comment/follow
// record, we always fetch the CURRENT profilePicUrl from the user's profile.
// getAvatar(username) returns the live URL (or null while loading / not found).

interface UserAvatarCtx {
  getAvatar: (username: string | undefined | null) => string | null;
  setAvatar: (username: string, url: string | null) => void;
}

const UserAvatarContext = createContext<UserAvatarCtx>({ getAvatar: () => null, setAvatar: () => {} });

function UserAvatarProvider({ children }: { children: ReactNode }) {
  const cacheRef = useRef<Map<string, string | null>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // cacheRev increments each time the cache is populated — forces context consumers to re-render
  const [cacheRev, setCacheRev] = useState(0);

  const flush = useCallback(() => {
    const toFetch = Array.from(pendingRef.current);
    pendingRef.current.clear();
    if (toFetch.length === 0) return;

    fetch('/api/users/avatars-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: toFetch }),
    })
      .then(r => (r.ok ? r.json() : {}))
      .then((data: Record<string, { profilePicUrl: string | null }>) => {
        for (const u of toFetch) cacheRef.current.set(u, null);
        for (const [u, info] of Object.entries(data)) {
          cacheRef.current.set(u.toLowerCase(), info?.profilePicUrl || null);
        }
        setCacheRev(v => v + 1);
      })
      .catch(() => {
        for (const u of toFetch) cacheRef.current.set(u, null);
        setCacheRev(v => v + 1);
      });
  }, []);

  const getAvatar = useCallback((username: string | undefined | null): string | null => {
    if (!username) return null;
    const key = username.toLowerCase();
    if (cacheRef.current.has(key)) return cacheRef.current.get(key) ?? null;
    pendingRef.current.add(key);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 80);
    return null;
  }, [flush]);

  // Instantly push a new avatar URL into the cache and re-render all consumers.
  // Call this right after a successful profile picture upload so every post/comment
  // shows the new image without waiting for a page refresh.
  const setAvatar = useCallback((username: string, url: string | null) => {
    if (!username) return;
    cacheRef.current.set(username.toLowerCase(), url);
    setCacheRev(v => v + 1);
  }, []);

  // cacheRev in the dep array ensures a new value object is created after each fetch,
  // which causes all context consumers to re-render and pick up fresh avatar URLs.
  const value = useMemo(() => ({ getAvatar, setAvatar }), [getAvatar, setAvatar, cacheRev]); // eslint-disable-line react-hooks/exhaustive-deps

  return <UserAvatarContext.Provider value={value}>{children}</UserAvatarContext.Provider>;
}

const useUserAvatar = () => useContext(UserAvatarContext).getAvatar;
const useSetAvatar  = () => useContext(UserAvatarContext).setAvatar;
// ─────────────────────────────────────────────────────────────────────────────

// Render comment content with clickable @mentions
function CommentContent({ content }: { content: string }) {
  const mentionPattern = /@(\w+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(
      <span 
        key={match.index}
        className="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer font-medium"
        onClick={() => console.log(`Navigate to @${match![1]}`)}
      >
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <>{parts}</>;
}

// Inline Comment Section Component - compact with comments list and delete
function InlineCommentSection({ post, isVisible, onClose, onCommentAdded, onCommentDeleted }: { post: FeedPost; isVisible: boolean; onClose: () => void; onCommentAdded?: () => void; onCommentDeleted?: () => void }) {
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getUsername, getUserDisplayName } = useCurrentUser();
  const getAvatar = useUserAvatar();

  const currentUsername = getUsername() || localStorage.getItem('currentUsername') || '';

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: [`/api/social-posts/${post.id}/comments`],
    queryFn: () => fetch(`/api/social-posts/${post.id}/comments`).then(r => r.json()),
    enabled: isVisible,
    staleTime: 30000,
  });

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (comment.trim()) commentMutation.mutate(comment.trim());
    }
  };

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const username = getUsername() || localStorage.getItem('currentUsername') || 'anonymous';
      const displayName = getUserDisplayName() || username;
      const response = await fetch(`/api/social-posts/${post.id}/comments/aws`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, authorUsername: username, authorDisplayName: displayName, authorAvatar: null })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add comment');
      }
      return response.json();
    },
    onSuccess: () => {
      if (onCommentAdded) onCommentAdded();
      queryClient.invalidateQueries({ queryKey: [`/api/social-posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      setComment('');
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to add comment", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const username = getUsername() || localStorage.getItem('currentUsername') || '';
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorUsername: username })
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      if (onCommentDeleted) onCommentDeleted();
      queryClient.invalidateQueries({ queryKey: [`/api/social-posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
    },
    onError: () => {
      toast({ description: "Failed to delete comment", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) commentMutation.mutate(comment.trim());
  };

  if (!isVisible) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 overflow-x-hidden" data-testid={`comment-section-${post.id}`}>
      {/* Comments list */}
      {comments.length > 0 && (
        <div className="mb-2 space-y-1.5 max-h-48 overflow-y-auto">
          {comments.map((c: any) => {
            const commentId = c.id || c.commentId;
            const isOwn = currentUsername && c.authorUsername === currentUsername;
            return (
              <div key={commentId} className="flex items-start gap-1.5 group px-1">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                  {(() => {
                    const liveUrl = getAvatar(c.authorUsername);
                    const commentAvatarUrl = liveUrl || c.authorAvatar;
                    return commentAvatarUrl && !commentAvatarUrl.includes('ui-avatars.com') ? (
                      <img src={commentAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                        {(c.authorDisplayName || c.authorUsername || '?')[0]}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-2.5 py-1.5">
                    <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 mr-1">
                      {c.authorDisplayName || c.authorUsername}
                    </span>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300 break-words">{c.content}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">{formatCommentTimestamp(c.createdAt)}</span>
                </div>
                {isOwn && (
                  <button
                    onClick={() => deleteMutation.mutate(commentId)}
                    disabled={deleteMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0 mt-1.5 p-0.5"
                    data-testid={`button-delete-comment-${commentId}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment form - single-line compact input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-1.5 px-1">
          <input
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-7 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 outline-none focus:border-blue-400 dark:focus:border-blue-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            disabled={commentMutation.isPending}
            data-testid={`input-comment-${post.id}`}
          />
          <button
            type="submit"
            disabled={!comment.trim() || commentMutation.isPending}
            className="h-7 w-7 flex-shrink-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-30 flex items-center justify-center transition-colors"
            data-testid={`button-submit-comment-${post.id}`}
          >
            {commentMutation.isPending ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <Send className="h-3 w-3" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Share Modal Component
function ShareModal({ isOpen, onClose, post }: { isOpen: boolean; onClose: () => void; post: FeedPost }) {
  const { toast } = useToast();
  const postUrl = `${window.location.origin}/post/${post.id}`;

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
        toast({ description: "Link copied to clipboard!" });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({ description: "Link copied to clipboard!" });
      }
    } catch (err) {
      console.error('Copy failed:', err);
      toast({ description: "Failed to copy link", variant: "destructive" });
    }
  };

  const socialPlatforms = [
    { name: 'Facebook', icon: 'https://play-lh.googleusercontent.com/KCMTYuiTrKom4Vyf0G4foetVOwhKWzNbHWumV73IXexAIy5TTgZipL52WTt8ICL-oIo=w240-h480-rw', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/10', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}` },
    { name: 'X', icon: 'https://cdn.simpleicons.org/x', color: 'text-gray-900 dark:text-white', bgColor: 'bg-black dark:bg-gray-800/50', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}` },
    { name: 'Whatsapp', icon: 'https://cdn.simpleicons.org/whatsapp', color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/10', url: `https://wa.me/?text=${encodeURIComponent(postUrl)}` },
    { name: 'Telegram', icon: 'https://cdn.simpleicons.org/telegram', color: 'text-sky-500', bgColor: 'bg-sky-50 dark:bg-sky-900/10', url: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}` },
    { name: 'Linkedin', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg', color: 'text-blue-700', bgColor: 'bg-blue-50 dark:bg-blue-900/10', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}` },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs p-0 overflow-visible border-none bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
        <div className="relative pt-10 pb-5 px-5 flex flex-col items-center text-center">
          {/* Top floating logo */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-800 z-10 p-1">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="NeoFeed Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Share with Friends</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 leading-relaxed px-2">
            Trading is more effective when you connect with friends!
          </p>

          <div className="w-full space-y-3 text-left">
            <div>
              <label className="text-xs font-bold text-gray-900 dark:text-white mb-2 block">Link</label>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                <p className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate font-medium">
                  {postUrl.length > 20 ? postUrl.substring(0, 20) + '...' : postUrl}
                </p>
                <button 
                  onClick={copyToClipboard}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-500 dark:text-gray-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-900 dark:text-white mb-2 block">Share to</label>
              <div className="flex justify-between items-center gap-1">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => {
                      window.open(platform.url, '_blank');
                    }}
                    className="flex flex-col items-center gap-1 group transition-all flex-1"
                    title={platform.name}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${platform.bgColor} group-hover:scale-105 transition-transform shadow-sm overflow-hidden ${platform.name === 'X' ? 'p-2' : 'p-1.5'}`}>
                      <img 
                        src={platform.icon} 
                        alt={platform.name} 
                        className="w-full h-full object-contain"
                        style={platform.name === 'Facebook' ? { filter: 'hue-rotate(-30deg)' } : platform.name === 'X' ? { filter: 'invert(1)' } : undefined}
                      />
                    </div>
                    <span className="text-[7px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                      {platform.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AnalysisData {
  priceData: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: string;
    high52W: number;
    low52W: number;
  };
  valuation: {
    marketCap: string;
    peRatio: number;
    pbRatio: number;
    psRatio: number;
    evEbitda: number;
    pegRatio: number;
  };
  financialHealth: {
    eps: number;
    bookValue: number;
    dividendYield: string;
    roe: string;
    roa: string;
    deRatio: number;
  };
  technicalIndicators?: {
    rsi: number | null;
  };
  growthMetrics?: {
    revenueGrowth: string;
    epsGrowth: string;
    profitMargin: string;
    ebitdaMargin: string;
    freeCashFlowYield: string;
  };
  additionalIndicators?: {
    beta: number;
    currentRatio: number;
    quickRatio: number;
    priceToSales: number;
    enterpriseValue: string;
  };
  marketSentiment?: {
    score: number;
    trend: string;
    volumeSpike: boolean;
    confidence: string;
  };
  news: Array<{
    title: string;
    source: string;
    time: string;
    url: string;
  }>;
}

// Price Chart Section Component
function PriceChartSection({ ticker, analysisData }: { ticker: string; analysisData: AnalysisData }) {
  const [timeframe, setTimeframe] = useState('1D');
  // Clean symbol: strip leading $ and any exchange prefix so the API receives e.g. "RELIANCE" not "$RELIANCE"
  const cleanTicker = ticker.replace(/^\$+/, '').replace(/^(NSE|BSE|MCX):/i, '').replace(/-EQ$/i, '').toUpperCase();

  // Fetch real chart data — same Yahoo Finance logic as market news tab
  const { data: chartData = [], isLoading: chartLoading } = useQuery({
    queryKey: ['stock-chart', cleanTicker, timeframe],
    queryFn: () => fetch(`/api/stock-chart-data/${cleanTicker}?timeframe=${timeframe}`).then(res => res.json()),
    refetchInterval: 300000,
    staleTime: timeframe === '1D' ? 30000 : 180000,
    gcTime: 600000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });
  // Get current price from chart data (latest point) or fallback to analysis data
  const getLatestChartPrice = () => {
    if (chartData && chartData.length > 0) {
      // Use the last data point from the chart as the current price
      return chartData[chartData.length - 1]?.price || analysisData.priceData.close || 0;
    }
    return analysisData.priceData.close || 0;
  };
  
  const currentPrice = getLatestChartPrice();
  
  // Calculate price difference based on selected timeframe
  const getTimeframeBaseline = () => {
    if (!chartData || chartData.length === 0) {
      return analysisData.priceData.open || currentPrice;
    }
    
    switch (timeframe) {
      case '1D':
        // For 1D: Use previous trading day close (first data point of the day)
        return chartData[0]?.price || analysisData.priceData.open || currentPrice;
      case '5D':
        // For 5D: Use price from 5 days ago (first data point in 5-day range)
        return chartData[0]?.price || currentPrice;
      case '1M':
        // For 1M: Use price from 1 month ago (first data point in 1-month range)
        return chartData[0]?.price || currentPrice;
      case '6M':
        // For 6M: Use price from 6 months ago (first data point in 6-month range)
        return chartData[0]?.price || currentPrice;
      case '1Y':
        // For 1Y: Use price from 1 year ago (first data point in 1-year range)
        return chartData[0]?.price || currentPrice;
      default:
        return chartData[0]?.price || currentPrice;
    }
  };
  
  const baselinePrice = getTimeframeBaseline();
  const priceChange = currentPrice - baselinePrice;
  const percentChange = baselinePrice !== 0 ? ((priceChange / baselinePrice) * 100).toFixed(2) : '0.00';
  const isPositive = priceChange >= 0;
  
  // Calculate OHLC values from actual chart data
  const getOHLCFromChart = () => {
    if (!chartData || chartData.length === 0) {
      return {
        open: analysisData.priceData.open || 0,
        high: analysisData.priceData.high || 0,
        low: analysisData.priceData.low || 0,
        volume: analysisData.priceData.volume || 'N/A'
      };
    }
    
    const prices = chartData.map((d: any) => Number(d.price) || 0);
    const volumes = chartData.map((d: any) => Number(d.volume) || 0);
    
    const openPrice = chartData[0]?.price || prices[0] || 0;
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    const totalVolume = volumes.reduce((a: number, b: number) => a + b, 0);
    
    return {
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      volume: totalVolume > 0 ? (totalVolume / 100000).toFixed(2) + 'L' : 'N/A'
    };
  };
  
  const ohlcData = getOHLCFromChart();
  
  const timeframes = ['1D', '5D', '1M', '6M', '1Y'];
  
  return (
    <div>
      {/* Current Price Display */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-green-400 text-sm">💰</div>
          <span className="text-green-400 font-medium">Price Chart</span>
        </div>
        
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-gray-900 dark:text-white text-xl font-bold">₹{currentPrice.toFixed(2)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">INR</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? '▲' : '▼'} ₹{Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{percentChange}%)
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{
              timeframe === '1D' ? 'vs prev close' :
              timeframe === '5D' ? 'vs 5 days ago' :
              timeframe === '1M' ? 'vs 1 month ago' :
              timeframe === '6M' ? 'vs 6 months ago' :
              timeframe === '1Y' ? 'vs 1 year ago' : 'today'
            }</span>
          </div>
        </div>
        
        {/* Timeframe Buttons */}
        <div className="flex gap-1 mb-3">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs ${
                timeframe === tf 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>
        
        {/* Price Chart */}
        <div className="w-full h-56 mb-4 bg-gray-100 dark:bg-gray-900/40 rounded-lg">
          {chartLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full"></div>
                Loading real {timeframe} chart data...
              </div>
            </div>
          ) : chartData && chartData.length > 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickCount={8}
                  />
                  <YAxis 
                    domain={[(dataMin: number) => {
                      const prices = chartData.map((d: any) => Number(d.price) || 0);
                      const min = Math.min(...prices);
                      return Math.floor(min - (min * 0.01));
                    }, (dataMax: number) => {
                      const prices = chartData.map((d: any) => Number(d.price) || 0);
                      const max = Math.max(...prices);
                      return Math.ceil(max + (max * 0.01));
                    }]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    width={35}
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
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444' }}
                  />
                  <ReferenceLine 
                    y={baselinePrice} 
                    stroke="#64748b" 
                    strokeDasharray="2 2" 
                    strokeWidth={1}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                <div className="mb-1">No chart data available</div>
                <p className="text-xs">Try selecting a different timeframe</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* OHLC Data Grid - Synced with Chart Data */}
      <div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Open</span>
            <span className="text-gray-900 dark:text-white">₹{Number(ohlcData.open).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">High</span>
            <span className="text-gray-900 dark:text-white">₹{Number(ohlcData.high).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Low</span>
            <span className="text-gray-900 dark:text-white">₹{Number(ohlcData.low).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Vol</span>
            <span className="text-gray-900 dark:text-white">{ohlcData.volume}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">52W High</span>
            <span className="text-gray-900 dark:text-white">₹{Number(analysisData.priceData.high52W).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">52W Low</span>
            <span className="text-gray-900 dark:text-white">₹{Number(analysisData.priceData.low52W).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedHeader({ onAllClick, isRefreshing, selectedFilter, onFilterChange, searchQuery, setSearchQuery, onSearch, showAppBar, onBackClick }: { onAllClick: () => void; isRefreshing: boolean; selectedFilter: string; onFilterChange: (filter: string) => void; searchQuery: string; setSearchQuery: (query: string) => void; onSearch: () => void; showAppBar: boolean; onBackClick?: () => void }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Only open AI chat if user clicks "Ask AI" button, not while typing
    // This allows search filtering to work properly
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // If search query exists, trigger feed search
      onSearch();
    } else {
      // If empty, clear search
      onSearch();
    }
  };

  const handleAskAI = () => {
    if (searchQuery.trim()) {
      setChatQuery(searchQuery);
      setIsChatOpen(true);
    }
  };

  return (
    <>
      <div id="neofeed-sticky-header" className="bg-background border-b border-border sticky top-0 z-50">
        
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-0">
          {/* Header row: search bar left, icons right — hides on scroll */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showAppBar ? 'max-h-16 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stocks"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  data-testid="input-neo-feed-search"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="h-5 w-5" />
                </Button>
                <UserProfileDropdown />
              </div>
            </div>
          </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex overflow-x-auto border-b border-border -mb-[1px]">
            {['All', 'Bullish', 'Bearish', 'Profile'].map((filter, index) => (
              <button
                key={filter}
                onClick={filter === 'All' ? onAllClick : () => onFilterChange(filter)}
                disabled={filter === 'All' && isRefreshing}
                className={`px-4 pb-3 pt-1 font-medium text-sm whitespace-nowrap relative transition-colors ${
                  selectedFilter === filter
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  {index === 0 && isRefreshing && (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {filter}
                </div>
                {selectedFilter === filter && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
          
          {/* Back Button - Right Corner (Mobile Only) */}
          {onBackClick && (
            <Button
              onClick={onBackClick}
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
              data-testid="button-back-to-home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      </div>

      <AIChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialQuery={chatQuery}
      />
    </>
  );
}

function ProfileHeader({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [activeTab, setActiveTab] = useState('Posts');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showImageCropModal, setShowImageCropModal] = useState(false);
  const [imageType, setImageType] = useState<'profile' | 'cover'>('profile');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const getAvatar = useUserAvatar();
  const setAvatar = useSetAvatar();

  // Build placeholder from localStorage so the profile header renders instantly on mount,
  // with no skeleton flash, before the network fetch completes.
  // NOTE: profilePicUrl and coverPicUrl are intentionally NOT read from localStorage —
  // they are always fetched fresh from AWS/DynamoDB (same pattern for both).
  const localStoragePlaceholder = (() => {
    const username = localStorage.getItem('currentUsername');
    if (!username) return null;
    return {
      username,
      displayName: localStorage.getItem('currentDisplayName') || localStorage.getItem('currentUserName') || username,
      profilePicUrl: null,
      bio: null,
      location: null,
      coverPicUrl: null,
    };
  })();

  // Profile fetch — with placeholderData so isLoading is always false on mount
  const { data: profileData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const idToken = await getCognitoToken();
      if (!idToken) return null;
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.profile || null;
    },
    placeholderData: localStoragePlaceholder,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const username = profileData?.username || '';

  // Simple stats fetch - cached with longer interval, don't refetch on mount
  const { data: stats = { followers: 0, following: 0 } } = useQuery({
    queryKey: ['profile-stats', username],
    queryFn: async () => {
      if (!username) return { followers: 0, following: 0 };
      console.log(`📊 Fetching stats for: ${username}`);
      const response = await fetch(`/api/profile/${username}/stats`);
      if (!response.ok) return { followers: 0, following: 0 };
      const data = await response.json();
      console.log(`📊 Stats received:`, data);
      return data;
    },
    enabled: !!username,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Followers list - only when dialog opens
  const { data: followersList = { followers: [] } } = useQuery({
    queryKey: ['followers-list', username],
    queryFn: async () => {
      if (!username) return { followers: [] };
      const response = await fetch(`/api/users/${username}/followers-list`);
      if (!response.ok) return { followers: [] };
      return response.json();
    },
    enabled: !!username && showFollowersDialog,
  });

  // Following list - only when dialog opens
  const { data: followingList = { following: [] } } = useQuery({
    queryKey: ['following-list', username],
    queryFn: async () => {
      if (!username) return { following: [] };
      const response = await fetch(`/api/users/${username}/following-list`);
      if (!response.ok) return { following: [] };
      return response.json();
    },
    enabled: !!username && showFollowingDialog,
  });

  // User posts - direct fetch by username for speed
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: async (): Promise<SocialPost[]> => {
      if (!username) return [];
      console.log(`📝 Fetching posts for user: ${username}`);
      const response = await fetch(`/api/social-posts/by-user/${username}`);
      if (!response.ok) throw new Error('Failed to fetch user posts');
      const posts = await response.json();
      console.log(`📝 Received ${posts.length} posts for ${username}`);
      return posts;
    },
    enabled: !!username,
    staleTime: 30000,
  });

  // Get current user's votes for filtering Likes tab
  const { data: currentUserVotes = {} } = useQuery({
    queryKey: ['my-votes'],
    queryFn: async () => {
      const idToken = await getCognitoToken();
      if (!idToken) return {};
      const response = await fetch('/api/user/votes', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) return {};
      const data = await response.json();
      // Create a map of postId -> vote status for quick lookup
      const votesMap: Record<string, { uptrend: boolean; downtrend: boolean }> = {};
      if (data.votes && Array.isArray(data.votes)) {
        data.votes.forEach((vote: any) => {
          votesMap[vote.postId] = {
            uptrend: vote.voteType === 'uptrend',
            downtrend: vote.voteType === 'downtrend'
          };
        });
      }
      return votesMap;
    },
    enabled: !!username,
    staleTime: 10000,
  });

  // Filter posts based on current user's votes
  const likedPosts = userPosts.filter(post => currentUserVotes[post.id]);

  const postCount = userPosts.length;
  const displayName = profileData?.displayName || '';
  const bio = profileData?.bio || '';
  const followers = stats?.followersCount || stats?.followers || 0;
  const following = stats?.followingCount || stats?.following || 0;
  const profilePicUrl = profileData?.profilePicUrl;
  const initials = displayName ? displayName.charAt(0).toUpperCase() : username.charAt(0).toUpperCase();
  const userId = profileData?.userId;

  const MINDSET_CARDS = [
    {
      type: 'bruce-lee',
      label: "Trader's Mindset",
      quote: "Be like water — adapt to what the market gives you. Never force a trade.",
      showBruceLee: true,
      image: '/bruce-lee-card.png',
      bg: 'from-gray-950 via-[#1a1200] to-gray-900',
      dark: true,
    },
    {
      type: 'bruce-lee',
      label: 'Your Greatest Enemy Is Within',
      quote: "Fear, greed, and ego destroy more traders than any bad setup ever will.",
      showBruceLee: true,
      image: '/bruce-lee-enemy-within.png',
      bg: 'from-[#0d0500] via-[#2a1400] to-[#0d0800]',
      dark: true,
    },
    {
      type: 'loss-psychology',
      label: 'Loss Psychology',
      quote: "A loss is tuition — pay it and move on. Revenge trading is the real enemy.",
      showBruceLee: false,
      bg: 'from-rose-600 to-red-700',
      dark: false,
    },
    {
      type: 'noise',
      label: 'Ignore the Noise',
      quote: "Consuming too much information creates paralysis. Block the noise — trust your system.",
      showBruceLee: false,
      bg: 'from-slate-600 to-slate-800',
      dark: false,
    },
    {
      type: 'rules',
      label: 'Follow the Rules',
      quote: "Your rules exist because your past self was rational. Don't let emotions override them.",
      showBruceLee: false,
      bg: 'from-violet-600 to-indigo-700',
      dark: false,
    },
  ];

  const { data: journalRaw = {} } = useQuery({
    queryKey: ['profile-journal-perf', userId],
    queryFn: async () => {
      if (!userId) return {};
      const response = await fetch(`/api/user-journal/${userId}/public`);
      if (!response.ok) return {};
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { last6Months, monthlyYield, totalTrades, winRate } = useMemo(() => {
    const now = new Date();
    const months: { label: string; pnl: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en', { month: 'short' });
      let pnl = 0;
      Object.entries(journalRaw as Record<string, any>).forEach(([date, day]) => {
        if (date.startsWith(key)) pnl += Number(day?.performanceMetrics?.netPnL) || 0;
      });
      months.push({ label, pnl });
    }
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let thisMonthPnl = 0;
    let totalW = 0, totalL = 0, allTrades = 0;
    Object.entries(journalRaw as Record<string, any>).forEach(([date, day]) => {
      if (date.startsWith(currentKey)) thisMonthPnl += Number(day?.performanceMetrics?.netPnL) || 0;
      totalW += Number(day?.performanceMetrics?.winningTrades) || 0;
      totalL += Number(day?.performanceMetrics?.losingTrades) || 0;
      allTrades += Number(day?.performanceMetrics?.totalTrades) || 0;
    });
    const totalAbsPnl = months.reduce((s, m) => s + Math.abs(m.pnl), 0);
    const yieldPct = totalAbsPnl > 0 ? (thisMonthPnl / totalAbsPnl) * 100 : 0;
    const wr = (totalW + totalL) > 0 ? Math.round((totalW / (totalW + totalL)) * 100) : 0;
    return { last6Months: months, monthlyYield: yieldPct, totalTrades: allTrades, winRate: wr };
  }, [journalRaw]);

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
    return String(n);
  };

  const [activeRuleIndex, setActiveRuleIndex] = useState(() => new Date().getDay() % MINDSET_CARDS.length);
  const [ruleExiting, setRuleExiting] = useState(false);
  const [cardsPrivate, setCardsPrivate] = useState(() => profileData?.performancePublic === false);
  const ruleTouchStartXRef = useRef<number | null>(null);
  const ruleSwipedRef = useRef(false);

  const cycleRule = () => {
    if (ruleExiting) return;
    setRuleExiting(true);
    setTimeout(() => {
      setActiveRuleIndex(i => (i + 1) % MINDSET_CARDS.length);
      setRuleExiting(false);
    }, 280);
  };

  const cyclePrevRule = () => {
    if (ruleExiting) return;
    setRuleExiting(true);
    setTimeout(() => {
      setActiveRuleIndex(i => (i - 1 + MINDSET_CARDS.length) % MINDSET_CARDS.length);
      setRuleExiting(false);
    }, 280);
  };

  const handleRuleTouchStart = (e: React.TouchEvent) => {
    ruleTouchStartXRef.current = e.touches[0].clientX;
    ruleSwipedRef.current = false;
  };

  const handleRuleTouchEnd = (e: React.TouchEvent) => {
    if (ruleTouchStartXRef.current === null) return;
    const delta = e.changedTouches[0].clientX - ruleTouchStartXRef.current;
    if (Math.abs(delta) > 40) {
      ruleSwipedRef.current = true;
      delta < 0 ? cyclePrevRule() : cycleRule();
    }
    ruleTouchStartXRef.current = null;
  };


  useEffect(() => {
    const timer = setInterval(cycleRule, 4000);
    return () => clearInterval(timer);
  }, [ruleExiting]);

  useEffect(() => {
    if (profileData !== undefined) {
      setCardsPrivate(profileData?.performancePublic === false);
    }
  }, [profileData?.performancePublic]);

  const DEMO_MONTHS = [
    { label: 'Oct', pnl: 8200 },
    { label: 'Nov', pnl: -3400 },
    { label: 'Dec', pnl: 12600 },
    { label: 'Jan', pnl: 5900 },
    { label: 'Feb', pnl: -1800 },
    { label: 'Mar', pnl: 9400 },
  ];

  // Compute discipline trend: cumulative streak data from journal
  const disciplineData = useMemo(() => {
    const entries = Object.entries(journalRaw as Record<string, any>)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);
    let streak = 0;
    return entries.map(([, day]) => {
      const pnl = Number(day?.performanceMetrics?.netPnL || day?.profitLossAmount || 0);
      if (pnl >= 0) streak++; else streak = Math.max(0, streak - 1);
      return streak;
    });
  }, [journalRaw]);

  // Weekly trend line from journal (last 8 data points)
  const weeklyTrendData = useMemo(() => {
    let cum = 0;
    return Object.entries(journalRaw as Record<string, any>)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([, day]) => {
        cum += Number(day?.performanceMetrics?.netPnL || 0);
        return cum;
      });
  }, [journalRaw]);

  // Push performance snapshot to server mirror so public profile views are instant
  useEffect(() => {
    if (!userId || last6Months.length === 0) return;
    const currentStreak = disciplineData.length > 0 ? disciplineData[disciplineData.length - 1] : 0;
    getCognitoToken().then(idToken => {
      if (!idToken) return;
      fetch('/api/user/performance-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ last6Months, monthlyYield, totalTrades, winRate, currentStreak, disciplineData }),
      }).catch(() => {});
    });
  }, [userId, last6Months, monthlyYield, totalTrades, winRate, disciplineData]);

  // Handle image selection for editing
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setImageType(type);
      setShowImageCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle cropped image upload
  const handleCroppedImageUpload = async (croppedImageBlob: Blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', croppedImageBlob, `${imageType}-image.jpg`);
      formData.append('type', imageType);

      const idToken = await getCognitoToken();
      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      const responseData = await response.json();
      
      if (!response.ok || responseData.error) {
        console.error('Image upload failed:', responseData);
        throw new Error(responseData.details || responseData.message || 'Upload failed');
      }
      
      const { url } = responseData;
      
      // Don't save placeholder/fallback URLs - only save real S3 URLs
      if (!url || url.includes('ui-avatars.com')) {
        throw new Error('Image storage failed. Please try again.');
      }
      
      // Update profile with the new image URL
      const updateResponse = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          [imageType === 'profile' ? 'profilePicUrl' : 'coverPicUrl']: url
        })
      });

      if (!updateResponse.ok) throw new Error('Failed to update profile');
      
      toast({ description: `${imageType === 'profile' ? 'Profile' : 'Cover'} photo updated successfully!` });

      // Instantly push the new profile pic into the avatar cache so every post/comment
      // everywhere updates immediately without requiring a page refresh.
      if (imageType === 'profile' && username) {
        setAvatar(username, url);
      }
      
      // Bust every profile-related cache — mirror logic returns the fresh image on next fetch
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      // Also bust the dropdown's independent query so the nav avatar updates too
      queryClient.invalidateQueries({ queryKey: ['user-profile-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts/news'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts/audio'] });
      if (username) {
        queryClient.invalidateQueries({ queryKey: ['profile-stats', username] });
        queryClient.invalidateQueries({ queryKey: ['user-posts', username] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] });
        queryClient.invalidateQueries({ queryKey: [`/api/social-posts/by-user/${username}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/followers-count`] });
        queryClient.invalidateQueries({ queryKey: ['followers-list', username] });
        queryClient.invalidateQueries({ queryKey: ['following-list', username] });
      }
      setShowImageCropModal(false);
      setSelectedImage(null);
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({ 
        description: error?.message || "Failed to upload image. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Hidden file inputs for image selection */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageSelect(e, 'cover')}
        data-testid="input-cover-image-hidden"
      />
      <input
        ref={profileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageSelect(e, 'profile')}
        data-testid="input-profile-image-hidden"
      />

      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div className="px-5 pt-4 pb-0">

          {/* ── Row 1: Compact identity + stats ── */}
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div
              className="relative group cursor-pointer flex-shrink-0"
              onClick={() => profileInputRef.current?.click()}
              data-testid="button-edit-profile-pic"
            >
              <Avatar className="w-14 h-14 border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                {profilePicUrl ? (
                  <AvatarImage src={profilePicUrl} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Name + handle + bio */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-[15px] text-gray-900 dark:text-white leading-tight truncate">
                  {displayName || username}
                </h2>
                {profileData?.verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-current flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">@{username}{profileData?.location ? ` · ${profileData.location}` : ''}</p>
              {bio && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-1">{bio}</p>
              )}
            </div>

            {/* Stats + Edit */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <button className="text-center" onClick={() => setShowFollowingDialog(true)} data-testid="button-show-following">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{formatCount(following)}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Following</p>
                </button>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                <button className="text-center" onClick={() => setShowFollowersDialog(true)} data-testid="button-show-followers">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{formatCount(followers)}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Followers</p>
                </button>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{formatCount(postCount)}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">Posts</p>
                </div>
              </div>
              <Button
                className="h-7 px-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                onClick={() => setShowEditProfile(true)}
                data-testid="button-edit-profile"
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* ── Mindset Card (5-card auto-cycle) ── */}
          <style>{`
            @keyframes blPulse {
              0%, 100% { filter: drop-shadow(0 0 8px rgba(234,179,8,0.35)) brightness(1); transform: scale(1); }
              50% { filter: drop-shadow(0 0 18px rgba(234,179,8,0.7)) brightness(1.08); transform: scale(1.04); }
            }
          `}</style>
          <div className="relative h-[92px] mb-3">
            {/* Stacked shadow cards behind */}
            {[2, 1].map((offset) => {
              const cardIdx = (activeRuleIndex + offset) % MINDSET_CARDS.length;
              const card = MINDSET_CARDS[cardIdx];
              return (
                <div
                  key={offset}
                  className={`absolute inset-0 rounded-xl bg-gradient-to-r ${card.bg}`}
                  style={{
                    opacity: offset === 2 ? 0.32 : 0.6,
                    transform: `translateY(${offset === 2 ? '-7px' : '-3.5px'}) scaleX(${offset === 2 ? 0.95 : 0.98})`,
                    zIndex: offset === 2 ? 1 : 2,
                  }}
                />
              );
            })}

            {/* Active main card */}
            {(() => {
              const card = MINDSET_CARDS[activeRuleIndex];
              return (
                <div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-r ${card.bg} shadow-md overflow-hidden z-10 select-none`}
                  style={{
                    opacity: ruleExiting ? 0 : 1,
                    transform: ruleExiting ? 'translateY(-8px) scale(0.97)' : 'translateY(0) scale(1)',
                    transition: 'opacity 280ms, transform 280ms',
                    touchAction: 'none',
                  }}
                  onTouchStart={handleRuleTouchStart}
                  onTouchEnd={handleRuleTouchEnd}
                  onClick={(e) => {
                    if (ruleSwipedRef.current) { ruleSwipedRef.current = false; return; }
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const tapX = e.clientX - rect.left;
                    if (tapX < rect.width / 2) cyclePrevRule(); else cycleRule();
                  }}
                >
                  {/* Bruce Lee image — only on bruce-lee cards, uses card-specific image */}
                  {card.showBruceLee && (
                    <>
                      {/* Gold ambient glow */}
                      <div className="absolute right-0 top-0 bottom-0 w-[90px] bg-gradient-to-l from-yellow-500/25 via-yellow-400/10 to-transparent pointer-events-none" />
                      <div className="absolute right-0 top-0 bottom-0 w-[80px] overflow-hidden pointer-events-none">
                        <img
                          src={card.image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain object-bottom"
                          style={{ animation: 'blPulse 3s ease-in-out infinite' }}
                        />
                      </div>
                    </>
                  )}

                  {/* Fade edge before image area */}
                  {card.showBruceLee && (
                    <div className="absolute right-[44px] top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/15 pointer-events-none" />
                  )}

                  {/* Card content */}
                  <div className={`flex items-center h-full px-3 gap-0 ${card.showBruceLee ? 'pr-[82px]' : 'pr-3'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[7px] uppercase tracking-widest font-bold mb-0.5 ${card.dark ? 'text-yellow-500/70' : 'text-white/65'}`}>
                        {card.label}
                      </p>
                      <p className={`text-[10px] font-semibold leading-tight ${card.dark ? 'text-white' : 'text-white'}`}>
                        &ldquo;{card.quote}&rdquo;
                      </p>
                    </div>
                    {/* Dot indicators */}
                    <div className="flex flex-col items-center justify-end pb-1.5 flex-shrink-0 self-end ml-2">
                      <div className="flex items-center gap-1">
                        {MINDSET_CARDS.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === activeRuleIndex ? 'w-3 bg-white' : 'w-1 bg-white/30'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Trading Metric Cards Row ── */}
          {(() => {
            const miniLinePath = (data: number[], w = 80, h = 28) => {
              if (data.length < 2) return null;
              const max = Math.max(...data); const min = Math.min(...data);
              const range = max - min || 1;
              const pts = data.map((v, i) => ({
                x: (i / (data.length - 1)) * w,
                y: h - ((v - min) / range) * h,
              }));
              return pts.reduce((d, p, i) => i === 0 ? `M ${p.x.toFixed(1)},${p.y.toFixed(1)}` : `${d} L ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');
            };
            const DEMO_TREND = [2100, -800, 5400, 3200, -1200, 7800, 9100, 6400];
            const yieldPath = miniLinePath(last6Months.map(m => m.pnl));
            const disciplinePath = miniLinePath(disciplineData.length > 1 ? disciplineData : [0, 1, 2, 3, 4, 5]);
            const trendPath = miniLinePath(weeklyTrendData.length > 1 ? weeklyTrendData : DEMO_TREND);
            const demoPath = miniLinePath(DEMO_TREND);
            const isYieldPos = monthlyYield >= 0;
            const isTrendPos = (weeklyTrendData[weeklyTrendData.length - 1] ?? 0) >= 0;

            const MONTHLY_TARGET_PCT = 5.0;
            const targetProgress = Math.min(100, Math.max(0, (monthlyYield / MONTHLY_TARGET_PCT) * 100));
            const R = 18; const CIRC = 2 * Math.PI * R;
            const dash = (targetProgress / 100) * CIRC;

            const currentStreak = disciplineData.length > 0 ? disciplineData[disciplineData.length - 1] : 0;
            const bestMonthPnl = last6Months.length > 0 ? Math.max(...last6Months.map(m => m.pnl)) : 0;

            const PrivateMask = () => (
              <div className="absolute inset-0 rounded-2xl bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col items-center justify-center gap-1 z-20">
                <Lock className="w-4 h-4 text-gray-400" />
                <p className="text-[9px] text-gray-400 font-semibold">Private</p>
              </div>
            );

            return (
              <>
                {/* Row header with privacy toggle */}
                <div className="flex items-center justify-between mb-2 pt-1">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">Performance</p>
                  <button
                    onClick={async () => {
                      const next = !cardsPrivate;
                      setCardsPrivate(next);
                      try {
                        const idToken = await getCognitoToken();
                        if (idToken) {
                          await fetch('/api/user/profile', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                            body: JSON.stringify({ performancePublic: !next }),
                          });
                        }
                      } catch {}
                    }}
                    className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                      cardsPrivate
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                    data-testid="button-toggle-cards-private"
                  >
                    {cardsPrivate ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    {cardsPrivate ? 'Private' : 'Public'}
                  </button>
                </div>

                {!cardsPrivate && (
                  <p className="text-[8px] text-blue-400 dark:text-blue-500 mb-1.5 flex items-center gap-1">
                    <Eye className="w-2.5 h-2.5" /> Visible to everyone
                  </p>
                )}

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${cardsPrivate ? 'max-h-0 opacity-0 pb-0' : 'max-h-[200px] opacity-100 pb-4'}`}>
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-5 px-5">

                  {/* 1 · Journal Streak */}
                  <div className="relative flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <p className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">Streak</p>
                    </div>
                    <p className="text-base font-bold leading-none text-orange-500 mb-1.5">{currentStreak} days</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className={`flex-1 h-4 rounded-sm transition-colors ${i < Math.min(currentStreak, 7) ? 'bg-orange-400' : 'bg-gray-100 dark:bg-gray-700'}`} />
                      ))}
                    </div>
                    <p className="text-[8px] text-gray-400 mt-1">Journal streak</p>
                  </div>

                  {/* 2 · Journal Entries */}
                  <div className="relative flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <BookOpen className="w-3 h-3 text-teal-500" />
                      <p className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">Journal</p>
                    </div>
                    <p className="text-base font-bold leading-none text-teal-600 dark:text-teal-400 mb-2">{totalTrades} entries</p>
                    <div className="flex gap-0.5 items-end h-6">
                      {last6Months.map((m, i) => {
                        const maxPnl = Math.max(...last6Months.map(x => Math.abs(x.pnl)), 1);
                        const h = Math.max(20, (Math.abs(m.pnl) / maxPnl) * 100);
                        return <div key={i} className="flex-1 rounded-sm bg-teal-400/70 dark:bg-teal-600/70" style={{ height: `${h}%` }} title={m.label} />;
                      })}
                    </div>
                    <p className="text-[8px] text-gray-400 mt-1">Logged trades</p>
                  </div>

                  {/* 3 · Monthly Yield */}
                  <div className="relative flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                    <p className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-1">Yield</p>
                    <p className={`text-base font-bold leading-none mb-2 ${isYieldPos ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isYieldPos ? '+' : ''}{monthlyYield.toFixed(1)}%
                    </p>
                    {yieldPath ? (
                      <svg width="100%" height="24" viewBox="0 0 80 24" preserveAspectRatio="none">
                        <path d={yieldPath} fill="none" stroke={isYieldPos ? '#10b981' : '#ef4444'} strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <div className="flex gap-0.5 items-end h-6">
                        {last6Months.map((m, i) => (
                          <div key={i} className={`flex-1 rounded-sm ${m.pnl >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                            style={{ height: `${Math.max(20, Math.abs(m.pnl) / Math.max(...last6Months.map(x => Math.abs(x.pnl)), 1) * 100)}%` }} />
                        ))}
                      </div>
                    )}
                    <p className="text-[8px] text-gray-400 mt-1">{totalTrades} trades</p>
                  </div>

                  {/* 4 · Monthly Target */}
                  <div className="relative flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TargetIcon className="w-3 h-3 text-blue-500" />
                      <p className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">Target</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="40" height="40" viewBox="0 0 46 46">
                        <circle cx="23" cy="23" r={R} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                        <circle cx="23" cy="23" r={R} fill="none"
                          stroke={targetProgress >= 100 ? '#10b981' : '#3b82f6'}
                          strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={`${dash} ${CIRC}`}
                          strokeDashoffset={CIRC * 0.25}
                          style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                        <text x="23" y="27" textAnchor="middle" fontSize="9" fontWeight="700" fill={targetProgress >= 100 ? '#10b981' : '#3b82f6'}>
                          {Math.round(targetProgress)}%
                        </text>
                      </svg>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">{monthlyYield >= 0 ? '+' : ''}{monthlyYield.toFixed(1)}%</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">of {MONTHLY_TARGET_PCT}%</p>
                      </div>
                    </div>
                  </div>

                  {/* 5 · Discipline */}
                  <div className="relative flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Award className="w-3 h-3 text-violet-500" />
                      <p className="text-[8px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">Discipline</p>
                    </div>
                    <p className="text-base font-bold leading-none mb-2 text-violet-600 dark:text-violet-400">{currentStreak} wins</p>
                    {disciplinePath ? (
                      <svg width="100%" height="24" viewBox="0 0 80 24" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="disc-grad2" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                        <path d={disciplinePath} fill="none" stroke="url(#disc-grad2)" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <div className="h-6 flex items-center"><div className="h-px w-full bg-violet-200 dark:bg-violet-800" /></div>
                    )}
                    <p className="text-[8px] text-gray-400 mt-1">Win streak trend</p>
                  </div>

                </div>
                </div>
              </>
            );
          })()}

          {/* ── Tabs ── */}
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-700 -mx-5 px-5">
            {(['Posts', 'Audio', 'Bullish', 'Bearish'] as const).map((tab) => {
              const label = tab === 'Posts' && postCount > 0 ? `Posts (${postCount})` : tab;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); onTabChange?.(tab); }}
                  className={`pb-3 px-3 font-medium text-sm whitespace-nowrap transition-colors relative flex-shrink-0 ${
                    activeTab === tab
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  data-testid={`button-tab-${tab.toLowerCase()}`}
                >
                  {label}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profileData={profileData}
        onSuccess={() => {
          setShowEditProfile(false);
          queryClient.invalidateQueries({ queryKey: ['my-profile'] });
          queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
          queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/social-posts/news'] });
          queryClient.invalidateQueries({ queryKey: ['/api/social-posts/audio'] });
          if (username) {
            queryClient.invalidateQueries({ queryKey: ['profile-stats', username] });
            queryClient.invalidateQueries({ queryKey: ['user-posts', username] });
            queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] });
            queryClient.invalidateQueries({ queryKey: [`/api/social-posts/by-user/${username}`] });
            queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/followers-count`] });
            queryClient.invalidateQueries({ queryKey: ['followers-list', username] });
            queryClient.invalidateQueries({ queryKey: ['following-list', username] });
          }
          setTimeout(() => { window.location.reload(); }, 500);
        }}
      />

      {/* Followers Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Followers
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {followersList.followers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No followers yet</p>
              </div>
            ) : (
              followersList.followers.map((follower: any) => (
                <div 
                  key={follower.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  data-testid={`follower-${follower.id}`}
                >
                  <Avatar className="w-10 h-10">
                    {(() => {
                      const liveUrl = getAvatar(follower.username);
                      const avatarUrl = liveUrl || follower.avatar;
                      return avatarUrl && !avatarUrl.includes('ui-avatars.com') ? (
                        <AvatarImage src={avatarUrl} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                          {(follower.displayName || follower.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      );
                    })()}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{follower.displayName || follower.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{follower.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Following
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {followingList.following.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Not following anyone yet</p>
              </div>
            ) : (
              followingList.following.map((user: any) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  data-testid={`following-${user.id}`}
                >
                  <Avatar className="w-10 h-10">
                    {(() => {
                      const liveUrl = getAvatar(user.username);
                      const avatarUrl = liveUrl || user.avatar;
                      return avatarUrl && !avatarUrl.includes('ui-avatars.com') ? (
                        <AvatarImage src={avatarUrl} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                          {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      );
                    })()}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{user.displayName || user.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal - Twitter style adjustment */}
      <ImageCropModal
        isOpen={showImageCropModal}
        onClose={() => {
          setShowImageCropModal(false);
          setSelectedImage(null);
        }}
        imageSrc={selectedImage}
        imageType={imageType}
        onSave={handleCroppedImageUpload}
        uploading={uploading}
      />
    </>
  );
}

// Twitter-style Image Crop Modal for adjusting profile/cover images
function ImageCropModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  imageType, 
  onSave, 
  uploading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageSrc: string | null; 
  imageType: 'profile' | 'cover';
  onSave: (blob: Blob) => void;
  uploading: boolean;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens with new image
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Load image when source changes
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;
    
    // Set canvas dimensions based on image type
    if (imageType === 'profile') {
      canvas.width = 400;
      canvas.height = 400;
    } else {
      canvas.width = 1500;
      canvas.height = 500;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get actual container dimensions
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate base image size to fill container (like object-fit: cover)
    // Image maintains aspect ratio while covering the entire container
    const imgAspect = img.width / img.height;
    const containerAspect = containerWidth / containerHeight;
    
    let baseWidth, baseHeight;
    
    if (imgAspect > containerAspect) {
      // Image is wider - height fills container, width overflows
      baseHeight = containerHeight;
      baseWidth = baseHeight * imgAspect;
    } else {
      // Image is taller - width fills container, height overflows
      baseWidth = containerWidth;
      baseHeight = baseWidth / imgAspect;
    }
    
    // Apply user's scale adjustment
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    
    // Image is centered via flexbox, then translate applied
    // Calculate where image starts in preview coordinates
    const previewX = (containerWidth - scaledWidth) / 2 + position.x;
    const previewY = (containerHeight - scaledHeight) / 2 + position.y;
    
    // Scale from preview coordinates to canvas coordinates
    const scaleX = canvas.width / containerWidth;
    const scaleY = canvas.height / containerHeight;
    
    const drawX = previewX * scaleX;
    const drawY = previewY * scaleY;
    const drawWidth = scaledWidth * scaleX;
    const drawHeight = scaledHeight * scaleY;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  if (!isOpen || !imageSrc) return null;

  const containerClass = imageType === 'profile' 
    ? 'w-[220px] h-[220px] rounded-full' 
    : 'w-full h-[140px] rounded-md';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs p-4 overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm font-semibold text-foreground">
            Adjust {imageType === 'profile' ? 'Profile' : 'Cover'} Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-3">
          <div 
            ref={containerRef}
            className={`relative overflow-hidden bg-muted ${containerClass} cursor-move`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={imageSrc} 
              alt="Preview"
              className="select-none pointer-events-none"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                minWidth: '100%',
                minHeight: '100%',
                width: 'auto',
                height: 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
              draggable={false}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Drag to reposition</p>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={uploading} data-testid="button-cancel-crop" className="h-7 px-3 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={uploading} data-testid="button-apply-crop" className="h-7 px-3 text-xs">
            {uploading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditProfileDialog({ isOpen, onClose, profileData, onSuccess }: { 
  isOpen: boolean; 
  onClose: () => void; 
  profileData: any;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState(profileData?.username || '');
  const [displayName, setDisplayName] = useState(profileData?.displayName || '');
  const [bio, setBio] = useState(profileData?.bio || '');
  const [originalUsername, setOriginalUsername] = useState(profileData?.username || '');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Update state when profileData changes
  useEffect(() => {
    if (profileData) {
      setUsername(profileData.username || '');
      setDisplayName(profileData.displayName || '');
      setBio(profileData.bio || '');
      setOriginalUsername(profileData.username || '');
      setUsernameAvailable(null);
      setUsernameMessage('');
    }
  }, [profileData]);

  // Check username availability when username changes (with debounce)
  useEffect(() => {
    const checkUsername = async () => {
      // If username hasn't changed from original, no need to check
      if (username.toLowerCase() === originalUsername.toLowerCase()) {
        setUsernameAvailable(null);
        setUsernameMessage('');
        return;
      }

      if (username.length < 3) {
        setUsernameAvailable(null);
        setUsernameMessage('');
        return;
      }

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        setUsernameAvailable(false);
        setUsernameMessage('Username must be 3-20 characters (letters, numbers, underscore only)');
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await fetch(`/api/user/check-username/${username}`);
        const data = await response.json();
        
        setUsernameAvailable(data.available);
        setUsernameMessage(data.message);
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
        setUsernameMessage('');
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [username, originalUsername]);

  // Check if save should be disabled (username changed but not available)
  const isUsernameChanged = username.toLowerCase() !== originalUsername.toLowerCase();
  const canSave = !saving && (!isUsernameChanged || usernameAvailable === true);

  const handleSave = async () => {
    // Validate username if changed
    if (isUsernameChanged && usernameAvailable !== true) {
      toast({ 
        description: usernameMessage || "Please choose a valid, available username", 
        variant: "destructive" 
      });
      return;
    }

    setSaving(true);
    try {
      const idToken = await getCognitoToken();
      if (!idToken) {
        toast({ description: "Please log in to update your profile", variant: "destructive" });
        setSaving(false);
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          username: username || undefined,
          displayName: displayName || undefined,
          bio: bio || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      toast({ description: "Profile updated successfully!" });
      onSuccess();
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({ description: error.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors" data-testid="button-cancel-profile">
            Cancel
          </button>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
          <button
            onClick={handleSave}
            disabled={!canSave || checkingUsername}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 disabled:opacity-40 hover:text-blue-700 transition-colors"
            data-testid="button-save-profile"
          >
            {saving ? 'Saving…' : checkingUsername ? 'Checking…' : 'Save'}
          </button>
        </div>

        {/* Fields */}
        <div className="px-5 py-4 space-y-5">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="border-0 border-b border-gray-200 dark:border-gray-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent text-sm"
              data-testid="input-displayname"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Username</label>
            <div className="relative">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                className="border-0 border-b border-gray-200 dark:border-gray-700 rounded-none px-0 pr-7 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent text-sm"
                data-testid="input-username"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                {checkingUsername && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" data-testid="icon-checking-username" />}
                {!checkingUsername && isUsernameChanged && usernameAvailable === true && <CheckCircle className="h-3.5 w-3.5 text-green-500" data-testid="icon-username-available" />}
                {!checkingUsername && isUsernameChanged && usernameAvailable === false && <X className="h-3.5 w-3.5 text-red-500" data-testid="icon-username-unavailable" />}
              </div>
            </div>
            {usernameMessage && isUsernameChanged && (
              <p className={`text-xs ${usernameAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`} data-testid="text-username-message">
                {usernameMessage === "Username is available" ? "Available" : usernameMessage === "Username is already taken" ? "Already taken" : usernameMessage}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell traders about yourself…"
              rows={3}
              className="border-0 border-b border-gray-200 dark:border-gray-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent text-sm resize-none"
              data-testid="textarea-bio"
            />
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Update your profile or cover photo using the camera icons on your profile.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnalysisPanel({ ticker, isOpen, onClose }: { ticker: string; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  // Mobile view toggle state (fundamentals vs news)
  const [showNewsOnMobile, setShowNewsOnMobile] = useState(false);

  // Extract stock symbol from ticker (remove $ prefix)
  const stockSymbol = ticker.replace('$', '');
  
  // Fetch real fundamental data
  const { data: fundamentalData, isLoading: loadingFundamentals } = useQuery({
    queryKey: [`/api/stock-analysis/${stockSymbol}`],
    queryFn: async () => {
      const response = await fetch(`/api/stock-analysis/${stockSymbol}`);
      if (!response.ok) throw new Error('Failed to fetch stock analysis');
      return await response.json();
    },
    enabled: isOpen,
  });

  // Fetch real news data
  const { data: newsData, isLoading: loadingNews } = useQuery({
    queryKey: [`/api/stock-news/${stockSymbol}`],
    queryFn: async () => {
      const response = await fetch(`/api/stock-news/${stockSymbol}?refresh=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch stock news');
      return await response.json();
    },
    enabled: isOpen,
    staleTime: 600000,
    gcTime: 600000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Combine data for display
  const analysisData: AnalysisData = {
    priceData: fundamentalData?.priceData || {
      open: 0, high: 0, low: 0, close: 0, volume: 'N/A', high52W: 0, low52W: 0
    },
    valuation: fundamentalData?.valuation || {
      marketCap: 'N/A', peRatio: 0, pbRatio: 0, psRatio: 0, evEbitda: 0, pegRatio: 0
    },
    financialHealth: fundamentalData?.financialHealth || {
      eps: 0, bookValue: 0, dividendYield: 'N/A', roe: 'N/A', roa: 'N/A', deRatio: 0
    },
    technicalIndicators: fundamentalData?.technicalIndicators || {
      rsi: null
    },
    growthMetrics: fundamentalData?.growthMetrics || {
      revenueGrowth: 'N/A', epsGrowth: 'N/A', profitMargin: 'N/A', ebitdaMargin: 'N/A', freeCashFlowYield: 'N/A'
    },
    additionalIndicators: fundamentalData?.additionalIndicators || {
      beta: 0, currentRatio: 0, quickRatio: 0, priceToSales: 0, enterpriseValue: 'N/A'
    },
    marketSentiment: fundamentalData?.marketSentiment || {
      score: 0.5, trend: 'Neutral', volumeSpike: false, confidence: 'Medium'
    },
    news: newsData || []
  };

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Fundamental Analysis Panel */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-xl backdrop-blur-sm ">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400 " />
          <h3 className="text-gray-900 dark:text-white font-semibold flex-1 ">{showNewsOnMobile ? 'Related News' : 'Fundamental Analysis'}</h3>
          {!showNewsOnMobile && loadingFundamentals && (
            <div className="ml-2 w-4 h-4 border-2 border-gray-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin "></div>
          )}
          {showNewsOnMobile && loadingNews && (
            <div className="ml-2 w-4 h-4 border-2 border-gray-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin "></div>
          )}
          {/* Mobile toggle button - switch between Fundamentals and News */}
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setShowNewsOnMobile(!showNewsOnMobile)}
            data-testid="button-toggle-news-mobile"
          >
            <Newspaper className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>

        {/* Conditional content - show news or fundamentals on mobile */}
        {showNewsOnMobile ? (
          /* Related News content for mobile */
          <div className="space-y-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700/60 rounded-xl p-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 lg:hidden ">
            {analysisData.news && analysisData.news.length > 0 ? (
              analysisData.news.map((item, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-gray-100 dark:bg-gray-600/60 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/70 transition-colors backdrop-blur-sm shadow-sm cursor-pointer"
                  onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                >
                  <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm mb-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    {item.title} ↗
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-xs ">{item.source}</span>
                    <span className="text-gray-500 dark:text-gray-500 text-xs ">{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400 ">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent news available for this stock</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ">Check back later for updates</p>
              </div>
            )}
          </div>
        ) : (
          /* Fundamental Analysis content */
          <div className="space-y-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700/60 rounded-xl p-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 ">
          {/* Price Chart & Data */}
          <PriceChartSection ticker={ticker} analysisData={analysisData} />

          {/* Valuation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Valuation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Market Cap</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.marketCap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">P/E Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.peRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">P/B Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.pbRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EV/EBITDA</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.evEbitda}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">P/S Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.psRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">PEG Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.valuation.pegRatio}</span>
              </div>
            </div>
          </div>

          {/* Financial Health */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Financial Health</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EPS</span>
                <span className="text-gray-900 dark:text-white ">₹{analysisData.financialHealth.eps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Book Value</span>
                <span className="text-gray-900 dark:text-white ">₹{analysisData.financialHealth.bookValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Dividend Yield</span>
                <span className="text-gray-700 dark:text-gray-300 ">{analysisData.financialHealth.dividendYield}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">ROE</span>
                <span className="text-gray-700 dark:text-gray-300 ">{analysisData.financialHealth.roe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">ROA</span>
                <span className="text-gray-700 dark:text-gray-300 ">{analysisData.financialHealth.roa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">D/E Ratio</span>
                <span className="text-gray-900 dark:text-white ">{analysisData.financialHealth.deRatio}</span>
              </div>
            </div>
          </div>

          {/* Technical Indicators */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Technical Indicators</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">RSI (14)</span>
                <span className={`font-medium ${
                  analysisData.technicalIndicators?.rsi 
                    ? analysisData.technicalIndicators.rsi > 70 
                      ? 'text-red-400' 
                      : analysisData.technicalIndicators.rsi < 30 
                        ? 'text-green-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.technicalIndicators?.rsi ? analysisData.technicalIndicators.rsi.toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EMA 50</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{(analysisData.technicalIndicators as any)?.ema50 || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Market Sentiment & Volume Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Market Sentiment</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Sentiment Score</span>
                <span className={`font-medium ${
                  analysisData.marketSentiment?.score 
                    ? analysisData.marketSentiment.score > 0.6 
                      ? 'text-green-400' 
                      : analysisData.marketSentiment.score < 0.4 
                        ? 'text-red-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.marketSentiment?.score ? `${(analysisData.marketSentiment.score * 100).toFixed(0)}%` : 'Neutral'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Trend</span>
                <span className={`font-medium ${
                  analysisData.marketSentiment?.trend === 'Bullish' 
                    ? 'text-green-400' 
                    : analysisData.marketSentiment?.trend === 'Bearish' 
                      ? 'text-red-400' 
                      : 'text-yellow-400'
                }`}>
                  {analysisData.marketSentiment?.trend || 'Neutral'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Volume Spike</span>
                <span className={`font-medium ${
                  analysisData.marketSentiment?.volumeSpike 
                    ? 'text-orange-400' 
                    : 'text-slate-400'
                }`}>
                  {analysisData.marketSentiment?.volumeSpike ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Confidence</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">
                  {analysisData.marketSentiment?.confidence || 'Medium'}
                </span>
              </div>
            </div>
          </div>

          {/* Growth Metrics */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Growth Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Revenue Growth</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.revenueGrowth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EPS Growth</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.epsGrowth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Profit Margin</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.profitMargin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">EBITDA Margin</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.ebitdaMargin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">FCF Yield</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.growthMetrics?.freeCashFlowYield}</span>
              </div>
            </div>
          </div>

          {/* Additional Indicators */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-gray-700 dark:text-gray-400 " />
              <span className="text-gray-800 dark:text-gray-400 font-medium ">Additional Indicators</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Beta</span>
                <span className={`font-medium ${
                  analysisData.additionalIndicators?.beta 
                    ? analysisData.additionalIndicators.beta > 1.2 
                      ? 'text-red-400' 
                      : analysisData.additionalIndicators.beta < 0.8 
                        ? 'text-green-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.additionalIndicators?.beta || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Current Ratio</span>
                <span className={`font-medium ${
                  analysisData.additionalIndicators?.currentRatio 
                    ? analysisData.additionalIndicators.currentRatio > 1.5 
                      ? 'text-green-400' 
                      : analysisData.additionalIndicators.currentRatio < 1 
                        ? 'text-red-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.additionalIndicators?.currentRatio || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Quick Ratio</span>
                <span className={`font-medium ${
                  analysisData.additionalIndicators?.quickRatio 
                    ? analysisData.additionalIndicators.quickRatio > 1 
                      ? 'text-green-400' 
                      : analysisData.additionalIndicators.quickRatio < 0.7 
                        ? 'text-red-400' 
                        : 'text-yellow-400'
                    : 'text-slate-400'
                }`}>
                  {analysisData.additionalIndicators?.quickRatio || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 ">Enterprise Value</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium ">{analysisData.additionalIndicators?.enterpriseValue}</span>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Related News Panel - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-xl backdrop-blur-sm ">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400 " />
          <h3 className="text-gray-900 dark:text-white font-semibold ">Related News</h3>
          {loadingNews && (
            <div className="ml-2 w-4 h-4 border-2 border-gray-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin "></div>
          )}
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700/60 rounded-xl p-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800 ">
          {analysisData.news && analysisData.news.length > 0 ? (
            analysisData.news.map((item, index) => (
              <div 
                key={index} 
                className="p-3 bg-gray-100 dark:bg-gray-600/60 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/70 transition-colors backdrop-blur-sm shadow-sm cursor-pointer"
                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
              >
                <h4 className="text-gray-700 dark:text-gray-300 font-medium text-sm mb-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  {item.title} ↗
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-xs ">{item.source}</span>
                  <span className="text-gray-500 dark:text-gray-500 text-xs ">{item.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 ">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent news available for this stock</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 ">Check back later for updates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TradeInsightCard({ post }: { post: FeedPost }) {
  const m = post.metadata || {};
  const [mirrorData, setMirrorData] = useState<Record<string, any> | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);

  useEffect(() => {
    if (!m.ownerUserId || !m.date) return;
    setMirrorLoading(true);
    const params = new URLSearchParams({ from: m.date, to: m.date });
    fetch(`/api/journal/heatmap-mirror/${m.ownerUserId}?${params.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMirrorData(data); })
      .catch(() => {})
      .finally(() => setMirrorLoading(false));
  }, [m.ownerUserId, m.date]);

  const liveStats = useMemo(() => {
    if (!mirrorData) return null;
    const dayData = mirrorData[m.date] || {};
    const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
    const tradeHistory: any[] = dayData?.tradeHistory || [];
    let cumulative = 0;
    const chartData = tradeHistory.map((t: any) => {
      const p = typeof t.pnl === 'number' ? t.pnl : parseFloat(String(t.pnl || '0').replace(/[₹+,]/g, '')) || 0;
      cumulative += p;
      return cumulative;
    });
    const totalPnL = metrics?.netPnL ?? dayData?.profitLossAmount ?? 0;
    const totalTrades = metrics?.totalTrades ?? dayData?.totalTrades ?? tradeHistory.length;
    const winRate = totalTrades > 0 ? Math.round((metrics?.winningTrades || 0) / totalTrades * 100) : 0;
    return { chartData, pnl: totalPnL, trades: totalTrades, winRate };
  }, [mirrorData, m.date]);

  const chartData: number[] = liveStats?.chartData ?? (Array.isArray(m.chartData) ? m.chartData : []);
  const pnl: number = liveStats?.pnl ?? m.pnl ?? 0;
  const trades: number = liveStats?.trades ?? m.trades ?? 0;
  const winRate: number = liveStats?.winRate ?? m.winRate ?? 0;
  const dateLabel: string = m.dateLabel || m.date || '';
  const isProfit = pnl >= 0;

  const svgW = 320, svgH = 80;
  const maxVal = Math.max(...chartData, 0);
  const minVal = Math.min(...chartData, 0);
  const range = maxVal - minVal || 1;

  // Build smooth cubic bezier path through data points (Catmull-Rom spline)
  const chartPoints = chartData.length > 1
    ? chartData.map((val, i) => ({
        x: (i / (chartData.length - 1)) * svgW,
        y: svgH - ((val - minVal) / range) * svgH,
      }))
    : null;

  const smoothLinePath = chartPoints
    ? chartPoints.reduce((d, pt, i) => {
        if (i === 0) return `M ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        const prev = chartPoints[i - 1];
        const prevPrev = i >= 2 ? chartPoints[i - 2] : prev;
        const next = i < chartPoints.length - 1 ? chartPoints[i + 1] : pt;
        const cp1x = prev.x + (pt.x - prevPrev.x) / 5;
        const cp1y = prev.y + (pt.y - prevPrev.y) / 5;
        const cp2x = pt.x - (next.x - prev.x) / 5;
        const cp2y = pt.y - (next.y - prev.y) / 5;
        return `${d} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      }, '')
    : null;

  const areaPath = smoothLinePath && chartPoints
    ? `M 0,${svgH} L ${chartPoints[0].x.toFixed(1)},${chartPoints[0].y.toFixed(1)} ${smoothLinePath.replace(/^M [0-9.,]+ /, '')} L ${svgW},${svgH} Z`
    : null;

  const animId = `ti-anim-${post.id}`;

  return (
    <div className="mb-4 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/50 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{dateLabel}</span>
      </div>
      <div className="flex" style={{ height: '140px' }}>
        <div className="flex-1 px-3 pb-3 pt-1 relative">
          {mirrorLoading ? (
            <div className="w-full h-full flex items-center justify-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : smoothLinePath ? (
            <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="overflow-visible">
              <defs>
                <linearGradient id={`ti-grad-${post.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isProfit ? '#22c55e' : '#ef4444'} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={isProfit ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                </linearGradient>
                <style>{`
                  @keyframes ${animId}-draw {
                    from { stroke-dashoffset: 2000; opacity: 0.4; }
                    to { stroke-dashoffset: 0; opacity: 1; }
                  }
                  @keyframes ${animId}-fade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                `}</style>
              </defs>
              {areaPath && (
                <path
                  d={areaPath}
                  fill={`url(#ti-grad-${post.id})`}
                  style={{ animation: `${animId}-fade 1s ease-out 0.3s both` }}
                />
              )}
              <path
                d={smoothLinePath}
                fill="none"
                stroke={isProfit ? '#22c55e' : '#ef4444'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 2000,
                  animation: `${animId}-draw 1.2s cubic-bezier(0.4,0,0.2,1) both`,
                }}
              />
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="h-px w-full bg-gray-200 dark:bg-zinc-700" />
            </div>
          )}
        </div>
        <div className="w-[118px] flex-shrink-0 border-l border-gray-100 dark:border-zinc-800/60 bg-gray-50/40 dark:bg-zinc-900/20 flex flex-col justify-center gap-2.5 px-4 py-3">
          <div>
            <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">TOTAL P&L</div>
            <div className={`text-sm font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : '-'}₹{Math.abs(Math.floor(pnl)).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">TRADES</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{trades}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">WIN RATE</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{winRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RangeReportCard({ metadata: m, postId, postCreatedAt, stripped }: { metadata: any; postId: string | number; postCreatedAt?: string | Date; stripped?: boolean }) {
  const [fomoHighlight, setFomoHighlight] = useState(false);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const fomoButtonRef = useRef<HTMLButtonElement>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const [mirrorData, setMirrorData] = useState<Record<string, any> | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);

  // 24hr countdown: expiry = createdAt + 24hr, refreshed every 1hr
  const [expiryCountdown, setExpiryCountdown] = useState<{ hoursLeft: number; expired: boolean } | null>(null);
  useEffect(() => {
    if (!postCreatedAt) return;
    const compute = () => {
      const created = new Date(postCreatedAt).getTime();
      const expiry = created + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const msLeft = expiry - now;
      if (msLeft <= 0) { setExpiryCountdown({ hoursLeft: 0, expired: true }); return; }
      const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
      setExpiryCountdown({ hoursLeft, expired: false });
    };
    compute();
    const interval = setInterval(compute, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [postCreatedAt]);

  // Mirror fetch: load heatmap data live from the owner's journal
  useEffect(() => {
    if (!m.ownerUserId) return;
    setMirrorLoading(true);
    const params = new URLSearchParams();
    if (m.fromDate) params.set('from', m.fromDate);
    if (m.toDate) params.set('to', m.toDate);
    fetch(`/api/journal/heatmap-mirror/${m.ownerUserId}?${params.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMirrorData(data); })
      .catch(() => {})
      .finally(() => setMirrorLoading(false));
  }, [m.ownerUserId, m.fromDate, m.toDate]);

  // Resolve heatmap data: prefer live mirror, fallback to legacy embedded data
  const heatmapData: Record<string, any> | null = mirrorData ?? m.tradingDataByDate ?? null;

  // Compute stats live from mirror data — no stored metadata needed
  const mirrorStats = useMemo(() => {
    if (!mirrorData || Object.keys(mirrorData).length === 0) return null;
    let totalPnL = 0, totalTrades = 0, winningTrades = 0;
    let fomoCount = 0, currentStreak = 0, maxStreak = 0;
    const trendData: number[] = [];
    const fomoDates: string[] = [];
    Object.entries(mirrorData)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dateKey, dayData]: [string, any]) => {
        const metrics = dayData?.tradingData?.performanceMetrics || dayData?.performanceMetrics;
        const tags: string[] = dayData?.tradingData?.tradingTags || dayData?.tradingTags || [];
        if (metrics) {
          const netPnL = Number(metrics.netPnL) || 0;
          totalPnL += netPnL;
          totalTrades += Number(metrics.totalTrades) || 0;
          winningTrades += Number(metrics.winningTrades) || 0;
          trendData.push(netPnL);
          if (netPnL > 0) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
          else { currentStreak = 0; }
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              if (tag.toLowerCase().includes('fomo') && !fomoDates.includes(dateKey)) {
                fomoDates.push(dateKey);
                fomoCount++;
              }
            });
          }
        }
      });
    return {
      totalPnL,
      totalTrades,
      winRate: totalTrades > 0 ? Math.round(winningTrades / totalTrades * 100) : 0,
      fomoCount,
      streak: maxStreak,
      trendData,
      fomoDates,
      dateCount: Object.keys(mirrorData).length,
    };
  }, [mirrorData]);

  // Use live mirror stats if available; fall back to stored metadata for old posts
  const stats = mirrorStats ?? m;
  const isProfit = (stats.totalPnL || 0) >= 0;
  const trendData: number[] = stats.trendData || [];

  const maxT = Math.max(...trendData, 0);
  const minT = Math.min(...trendData, 0);
  const rangeT = maxT - minT || 1;
  const svgW = 40, svgH = 20;
  const trendPath = trendData.length > 1
    ? trendData.map((v, i) => {
        const x = (i / (trendData.length - 1)) * svgW;
        const y = svgH - ((v - minT) / rangeT) * svgH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ')
    : `M 0 ${svgH / 2} L ${svgW} ${svgH / 2}`;

  const fromLabel = m.fromDate ? new Date(m.fromDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
  const toLabel = m.toDate ? new Date(m.toDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  useEffect(() => {
    if (!fomoHighlight) return;
    const container = heatmapContainerRef.current;
    if (!container) return;
    const handleScroll = () => setScrollTrigger(prev => prev + 1);
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [fomoHighlight]);

  const tradingDays: { date: string; pnl: number; isFomo: boolean }[] = m.tradingDays || [];
  const maxAbsPnL = Math.max(...tradingDays.map(d => Math.abs(d.pnl)), 1);
  const monthGroups: { label: string; days: { date: string; pnl: number; isFomo: boolean }[] }[] = [];
  tradingDays.forEach(day => {
    const d = new Date(day.date);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = monthGroups.find(g => g.label === label);
    if (existing) { existing.days.push(day); }
    else { monthGroups.push({ label, days: [day] }); }
  });
  const getDotSize = (pnl: number) => {
    const ratio = Math.abs(pnl) / maxAbsPnL;
    if (ratio > 0.66) return 11;
    if (ratio > 0.33) return 9;
    return 7;
  };

  const inner = (
    <>
      {mirrorLoading ? (
        <div className={`flex items-center gap-2 text-xs text-gray-400 ${stripped ? 'px-0 pb-2' : 'px-4 pb-3'}`}>
          <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          Loading heatmap...
        </div>
      ) : heatmapData ? (
        <div className={stripped ? 'pb-2' : 'px-4 pb-2'}>
          <div className="relative">
            <div
              ref={heatmapContainerRef}
              className={`max-h-48 overflow-auto scrollbar-hide ${stripped ? '' : 'border border-slate-100 dark:border-zinc-800 rounded-lg'}`}
            >
              <DemoHeatmap
                tradingDataByDate={heatmapData}
                onDateSelect={() => {}}
                selectedDate={null}
                onDataUpdate={() => {}}
                isPublicView={true}
                disableAutoScroll={true}
                onSelectDateForHeatmap={() => {}}
              />
            </div>
            {fomoHighlight && stats.fomoDates && stats.fomoDates.length > 0 && (() => {
              void scrollTrigger;
              if (!fomoButtonRef.current || !heatmapContainerRef.current) return null;
              const scrollableEl = heatmapContainerRef.current;
              const scrollLeft = scrollableEl.scrollLeft || 0;
              const scrollTop = scrollableEl.scrollTop || 0;
              const scrollWidth = scrollableEl.scrollWidth || 0;
              const scrollHeight = scrollableEl.scrollHeight || 0;
              const containerRect = scrollableEl.getBoundingClientRect();
              const buttonRect = fomoButtonRef.current.getBoundingClientRect();
              const buttonCenterX = buttonRect.left - containerRect.left + scrollLeft + buttonRect.width / 2;
              const buttonCenterY = buttonRect.top - containerRect.top + scrollTop + buttonRect.height / 2;
              const paths: JSX.Element[] = [];
              (stats.fomoDates as string[]).forEach((date: string, index: number) => {
                const cellEl = scrollableEl.querySelector(`[data-date="${date}"]`);
                if (cellEl) {
                  const cellRect = cellEl.getBoundingClientRect();
                  const cellCenterX = cellRect.left - containerRect.left + scrollLeft + cellRect.width / 2;
                  const cellCenterY = cellRect.top - containerRect.top + scrollTop + cellRect.height / 2;
                  const controlX = (buttonCenterX + cellCenterX) / 2;
                  const controlY = Math.min(buttonCenterY, cellCenterY) - 40;
                  paths.push(
                    <g key={`nf-${date}-${index}`}>
                      <path d={`M ${buttonCenterX} ${buttonCenterY} Q ${controlX} ${controlY}, ${cellCenterX} ${cellCenterY}`} fill="none" stroke="url(#nfGrad)" strokeWidth="2" strokeDasharray="6,4" opacity="0.9" />
                      <circle cx={cellCenterX} cy={cellCenterY} r="4" fill="#fcd34d" opacity="0.9" />
                      <circle cx={cellCenterX} cy={cellCenterY} r="3" fill="#fbbf24" />
                    </g>
                  );
                }
              });
              return (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: `${scrollWidth}px`, height: `${scrollHeight}px`, pointerEvents: 'none', zIndex: 10, overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="nfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
                      <stop offset="50%" stopColor="#f472b6" stopOpacity="1" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  {paths}
                </svg>
              );
            })()}
          </div>
        </div>
      ) : tradingDays.length > 0 && (
        <div className="px-4 pb-2">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700">
            <div className="flex gap-4 min-w-max pb-1">
              {monthGroups.map(group => (
                <div key={group.label} className="flex flex-col gap-1">
                  <div className="text-[9px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">{group.label.split(' ')[0]}</div>
                  <div className="flex flex-col gap-[3px]">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dow, wi) => (
                      <div key={wi} className="flex gap-[3px] items-center">
                        <span className="text-[7px] text-gray-300 dark:text-zinc-600 w-2">{dow}</span>
                        {group.days.filter(day => new Date(day.date).getDay() === wi).map(day => {
                          const size = getDotSize(day.pnl);
                          const isGain = day.pnl >= 0;
                          return (
                            <div key={day.date} title={`${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${isGain ? '+' : ''}₹${Math.round(day.pnl).toLocaleString()}${day.isFomo ? ' (FOMO)' : ''}`} style={{ width: size, height: size }} className={`rounded-full flex-shrink-0 ${day.isFomo ? 'bg-yellow-400 dark:bg-yellow-500' : isGain ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-red-500 dark:bg-red-400'}`} />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-400">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span>Loss</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span>Profit</span></div>
            {(stats.fomoCount || 0) > 0 && <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400" /><span>FOMO</span></div>}
          </div>
        </div>
      )}

      <div className={`bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg px-2.5 py-2 ${stripped ? 'mb-0' : 'mx-2 mb-2'}`}>
        <div className="flex items-center justify-around text-white">
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[8px] font-medium opacity-75 uppercase tracking-wide">P&L</div>
            <div className="text-xs font-bold leading-none">{isProfit ? '+' : '-'}₹{(Math.abs(stats.totalPnL || 0) / 1000).toFixed(1)}K</div>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[8px] font-medium opacity-75 uppercase tracking-wide">Trend</div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-8 h-4">
              <path d={trendPath} fill="none" stroke="white" strokeWidth="1.8" opacity="0.95" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <button
            ref={fomoButtonRef}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 border shadow-inner transition-all ${fomoHighlight ? 'bg-white/30 border-white/60 ring-2 ring-white/40' : 'bg-white/20 border-white/40 hover:bg-white/25'}`}
            onClick={() => setFomoHighlight(prev => !prev)}
            title={`Tap to ${fomoHighlight ? 'hide' : 'show'} FOMO trading days`}
          >
            <div className="text-[8px] font-medium opacity-90 uppercase tracking-wide">FOMO</div>
            <div className="text-xs font-bold leading-none">{stats.fomoCount || 0}</div>
          </button>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[8px] font-medium opacity-75 uppercase tracking-wide">Win%</div>
            <div className="text-xs font-bold leading-none">{stats.winRate || 0}%</div>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[8px] font-medium opacity-75 uppercase tracking-wide">Streak</div>
            <div className="text-xs font-bold leading-none">{stats.streak || 0}</div>
          </div>
        </div>
      </div>
    </>
  );

  if (stripped) return inner;
  return (
    <div className="mb-4 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/50 rounded-xl overflow-hidden shadow-sm">
      {inner}
    </div>
  );
}

const PostCard = memo(function PostCard({ post, currentUserUsername, onViewUserProfile }: { post: FeedPost; currentUserUsername?: string; onViewUserProfile?: (username: string) => void }) {
  const getAvatar = useUserAvatar();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [liked, setLiked] = useState(false);
  const [downtrended, setDowntrended] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showVoteBar, setShowVoteBar] = useState(false);
  const voteBarRef = useRef<HTMLDivElement>(null);
  
  // Real-time count state - initialize from post data (uptrends = likes, downtrends = new)
  const [likeCount, setLikeCount] = useState(post.metrics?.likes || post.likes || 0);
  const [downtrendCount, setDowntrendCount] = useState(0);
  const [repostCount, setRepostCount] = useState(post.metrics?.reposts || post.reposts || 0);
  const [commentCount, setCommentCount] = useState(post.metrics?.comments || post.comments || 0);
  
  // Range report countdown: shown in post header
  const [rangeCountdown, setRangeCountdown] = useState<{ hoursLeft: number; expired: boolean } | null>(null);
  useEffect(() => {
    if (post.metadata?.type !== 'range_report' || !post.createdAt) return;
    const compute = () => {
      const created = new Date(post.createdAt as string).getTime();
      const expiry = created + 24 * 60 * 60 * 1000;
      const msLeft = expiry - Date.now();
      if (msLeft <= 0) { setRangeCountdown({ hoursLeft: 0, expired: true }); return; }
      setRangeCountdown({ hoursLeft: Math.ceil(msLeft / (60 * 60 * 1000)), expired: false });
    };
    compute();
    const id = setInterval(compute, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [post.metadata?.type, post.createdAt]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if this post belongs to the current user (case-insensitive)
  const isOwnPost = !!(currentUserUsername && (
    post.authorUsername?.toLowerCase() === currentUserUsername?.toLowerCase() || 
    post.user?.handle?.toLowerCase() === currentUserUsername?.toLowerCase()));
  
  // Get the author username for follow functionality
  const authorUsername = post.user?.handle || post.authorUsername || 'user';
  
  // Fetch follow status for this author - with Cognito authentication
  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', authorUsername],
    queryFn: async () => {
      if (isOwnPost || !currentUserUsername) return { following: false };
      const idToken = await getCognitoToken();
      if (!idToken) return { following: false };
      
      const response = await fetch(`/api/users/${authorUsername}/follow-status`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) return { following: false };
      return response.json();
    },
    enabled: !!currentUserUsername && !isOwnPost,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  
  // Update local state when query data changes
  useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.following || followStatus.isFollowing || false);
    }
  }, [followStatus]);
  
  // Fetch vote status for this post on mount (both uptrend and downtrend)
  const { data: voteStatus } = useQuery({
    queryKey: ['vote-status', post.id, currentUserUsername],
    queryFn: async () => {
      if (!currentUserUsername) return { uptrended: false, downtrended: false, uptrends: 0, downtrends: 0 };
      const response = await fetch(`/api/social-posts/${post.id}/vote-status?userId=${currentUserUsername}`);
      if (!response.ok) return { uptrended: false, downtrended: false, uptrends: likeCount, downtrends: 0 };
      return response.json();
    },
    enabled: !!currentUserUsername,
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  
  // Fetch retweet status for this post on mount - uses AWS DynamoDB
  const { data: retweetStatus } = useQuery({
    queryKey: ['retweet-status', post.id, currentUserUsername],
    queryFn: async () => {
      if (!currentUserUsername) return { retweeted: false, reposts: 0 };
      const response = await fetch(`/api/social-posts/${post.id}/retweet-status?userId=${encodeURIComponent(currentUserUsername)}`);
      if (!response.ok) return { retweeted: false, reposts: repostCount };
      const data = await response.json();
      console.log(`🔁 Retweet status for post ${post.id}: retweeted=${data.retweeted}, reposts=${data.reposts}`);
      return data;
    },
    enabled: !!currentUserUsername,
    staleTime: 60000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  
  // Update vote state from server (both uptrend and downtrend)
  useEffect(() => {
    if (voteStatus) {
      setLiked(voteStatus.uptrended || false);
      setDowntrended(voteStatus.downtrended || false);
      if (voteStatus.uptrends !== undefined) {
        setLikeCount(voteStatus.uptrends);
      }
      if (voteStatus.downtrends !== undefined) {
        setDowntrendCount(voteStatus.downtrends);
      }
    }
  }, [voteStatus]);
  
  // Update retweet state from server
  useEffect(() => {
    if (retweetStatus) {
      setReposted(retweetStatus.retweeted || false);
      if (retweetStatus.reposts !== undefined) {
        setRepostCount(retweetStatus.reposts);
      }
    }
  }, [retweetStatus]);

  // Close vote bar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (voteBarRef.current && !voteBarRef.current.contains(event.target as Node)) {
        setShowVoteBar(false);
      }
    };

    if (showVoteBar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVoteBar]);
  
  // Audio mode text selection
  const { isAudioMode, selectedTextSnippets, addTextSnippet } = useAudioMode();
  
  // Text truncation settings
  const MAX_TEXT_LENGTH = 150;
  
  // Text selection handler - Click to select entire post
  const handleTextSelection = () => {
    if (!isAudioMode) return;
    
    if (selectedTextSnippets.length >= 5) {
      toast({ description: "Maximum 5 posts allowed", variant: "destructive" });
      return;
    }
    
    // Select the entire post content instead of just highlighted text
    const fullText = post.content;
    
    if (!fullText || fullText.trim().length === 0) return;
    
    // Keep post.id as string (DynamoDB IDs are strings)
    const postIdValue = typeof post.id === 'string' ? post.id : String(post.id);
    
    addTextSnippet({
      postId: postIdValue,
      text: fullText,
      authorUsername: post.user?.handle || post.authorUsername || 'Unknown',
      authorDisplayName: post.user?.username || post.authorDisplayName || 'Unknown User'
    });
  };

  // Uptrend mutation (replaces like) with mutual exclusivity - uses AWS DynamoDB
  // When uptrending, automatically deactivates any existing downtrend
  const likeMutation = useMutation({
    mutationFn: async ({ wasLiked }: { wasLiked: boolean }) => {
      const method = wasLiked ? 'DELETE' : 'POST';
      const userId = currentUserUsername || 'anonymous';
      console.log(`📈 Uptrend mutation: ${method} for post ${post.id}, wasUptrended=${wasLiked}, userId=${userId}`);
      
      let url = `/api/social-posts/${post.id}/like-v2`;
      if (method === 'DELETE') {
        url += `?userId=${encodeURIComponent(userId)}`;
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ userId }) : undefined
      });
      if (!response.ok) throw new Error('Failed to update uptrend');
      return response.json();
    },
    onMutate: ({ wasLiked }) => {
      const prevLikeCount = likeCount;
      const prevDowntrendCount = downtrendCount;
      const wasDowntrended = downtrended;
      const newLiked = !wasLiked;
      setLiked(newLiked);
      setLikeCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
      // Mutual exclusivity: if uptrending, deactivate downtrend
      if (!wasLiked && wasDowntrended) {
        setDowntrended(false);
        setDowntrendCount(prev => Math.max(0, prev - 1));
      }
      console.log(`📈 Optimistic: wasUptrended=${wasLiked}, newUptrended=${newLiked}`);
      return { wasLiked, prevLikeCount, prevDowntrendCount, wasDowntrended };
    },
    onSuccess: (data) => {
      if (data?.liked !== undefined) {
        setLiked(data.liked);
      }
      if (data?.likes !== undefined) {
        setLikeCount(data.likes);
      }
      // Refetch vote status to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['vote-status', post.id, currentUserUsername] });
    },
    onError: (err, variables, context) => {
      setLiked(context?.wasLiked || false);
      setLikeCount(context?.prevLikeCount || 0);
      if (context?.wasDowntrended) {
        setDowntrended(true);
        setDowntrendCount(context?.prevDowntrendCount || 0);
      }
      toast({ description: "Failed to update uptrend", variant: "destructive" });
    }
  });

  // Downtrend mutation with mutual exclusivity - uses AWS DynamoDB
  // When downtrending, automatically deactivates any existing uptrend
  const downtrendMutation = useMutation({
    mutationFn: async ({ wasDowntrended }: { wasDowntrended: boolean }) => {
      const method = wasDowntrended ? 'DELETE' : 'POST';
      const userId = currentUserUsername || 'anonymous';
      console.log(`📉 Downtrend mutation: ${method} for post ${post.id}, wasDowntrended=${wasDowntrended}, userId=${userId}`);
      
      let url = `/api/social-posts/${post.id}/downtrend`;
      if (method === 'DELETE') {
        url += `?userId=${encodeURIComponent(userId)}`;
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ userId }) : undefined
      });
      if (!response.ok) throw new Error('Failed to update downtrend');
      return response.json();
    },
    onMutate: ({ wasDowntrended }) => {
      const prevDowntrendCount = downtrendCount;
      const prevLikeCount = likeCount;
      const wasLiked = liked;
      const newDowntrended = !wasDowntrended;
      setDowntrended(newDowntrended);
      setDowntrendCount(prev => wasDowntrended ? Math.max(0, prev - 1) : prev + 1);
      // Mutual exclusivity: if downtrending, deactivate uptrend
      if (!wasDowntrended && wasLiked) {
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      }
      console.log(`📉 Optimistic: wasDowntrended=${wasDowntrended}, newDowntrended=${newDowntrended}`);
      return { wasDowntrended, prevDowntrendCount, prevLikeCount, wasLiked };
    },
    onSuccess: (data) => {
      if (data?.downtrended !== undefined) {
        setDowntrended(data.downtrended);
      }
      if (data?.downtrends !== undefined) {
        setDowntrendCount(data.downtrends);
      }
      // Refetch vote status to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['vote-status', post.id, currentUserUsername] });
    },
    onError: (err, variables, context) => {
      setDowntrended(context?.wasDowntrended || false);
      setDowntrendCount(context?.prevDowntrendCount || 0);
      if (context?.wasLiked) {
        setLiked(true);
        setLikeCount(context?.prevLikeCount || 0);
      }
      toast({ description: "Failed to update downtrend", variant: "destructive" });
    }
  });

  // Repost mutation with real-time count updates (Twitter-style) - uses AWS DynamoDB
  // Fixed: Pass wasReposted as variable to avoid race condition between onMutate and mutationFn
  const repostMutation = useMutation({
    mutationFn: async ({ wasReposted }: { wasReposted: boolean }) => {
      const method = wasReposted ? 'DELETE' : 'POST';
      console.log(`🔁 Repost mutation: ${method} for post ${post.id}, wasReposted=${wasReposted}`);
      const userDisplayName = localStorage.getItem('currentDisplayName') || currentUserUsername || 'anonymous';
      const userUsername = currentUserUsername || 'anonymous';
      const response = await fetch(`/api/social-posts/${post.id}/retweet`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userUsername,
          userDisplayName: userDisplayName,
          userUsername: userUsername
        })
      });
      if (!response.ok) throw new Error('Failed to update repost');
      return response.json();
    },
    onMutate: ({ wasReposted }) => {
      // Optimistic update - toggle state AND count immediately
      const prevCount = repostCount;
      setReposted(!wasReposted);
      setRepostCount(prev => wasReposted ? Math.max(0, prev - 1) : prev + 1);
      console.log(`🔁 Optimistic: wasReposted=${wasReposted}, newReposted=${!wasReposted}, count=${wasReposted ? prevCount - 1 : prevCount + 1}`);
      return { wasReposted, prevCount };
    },
    onSuccess: (data) => {
      // Update with server response - sync both reposted state AND count
      if (data?.retweeted !== undefined) {
        setReposted(data.retweeted);
        console.log(`🔁 Server confirmed: retweeted=${data.retweeted}`);
      }
      if (data?.reposts !== undefined) {
        setRepostCount(data.reposts);
        console.log(`🔁 Server confirmed: reposts=${data.reposts}`);
      }
      if (data?.repostId) {
        console.log(`🔁 New repost post created with ID: ${data.repostId}`);
      }
      // Invalidate queries to sync state (include userId for proper cache matching)
      queryClient.invalidateQueries({ queryKey: ['retweet-status', post.id, currentUserUsername] });
      // Also invalidate the main posts feed to show the new repost
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
    },
    onError: (err, variables, context) => {
      // Revert both state and count on error
      setReposted(context?.wasReposted || false);
      setRepostCount(context?.prevCount || 0);
      toast({ description: "Failed to update repost", variant: "destructive" });
    }
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (content: string) => {
      const idToken = await getCognitoToken();
      if (!idToken) throw new Error('Not authenticated');
      const response = await fetch(`/api/social-posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ content, userId: currentUserUsername })
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      setShowEditDialog(false);
      setShowOptionsMenu(false);
      toast({ description: "Post updated successfully!" });
    },
    onError: () => {
      toast({ description: "Failed to update post", variant: "destructive" });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const idToken = await getCognitoToken();
      if (!idToken) throw new Error('Not authenticated');
      const response = await fetch(`/api/social-posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ userId: currentUserUsername })
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      setShowDeleteDialog(false);
      setShowOptionsMenu(false);
      toast({ description: "Post deleted successfully!" });
    },
    onError: () => {
      toast({ description: "Failed to delete post", variant: "destructive" });
    }
  });

  // Follow/Unfollow mutation with Cognito authentication
  // IMPORTANT: Pass action explicitly to avoid stale closure issues
  const followMutation = useMutation({
    mutationFn: async ({ action }: { action: 'follow' | 'unfollow' }) => {
      const idToken = await getCognitoToken();
      if (!idToken) throw new Error('Not authenticated');
      
      console.log(`🔄 Follow mutation starting: action=${action}, target=${authorUsername}`);
      
      const endpoint = action === 'unfollow'
        ? `/api/users/${authorUsername}/unfollow` 
        : `/api/users/${authorUsername}/follow`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          targetUserData: { displayName: post.authorDisplayName || post.user?.username || authorUsername }
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action}`);
      }
      const data = await response.json();
      console.log(`✅ Server response for ${action}:`, data);
      return { ...data, requestedAction: action };
    },
    onSuccess: (data) => {
      console.log('✅ Follow action complete:', { 
        requestedAction: data.requestedAction,
        serverFollowing: data.following,
        author: authorUsername, 
        currentUser: currentUserUsername
      });
      
      // Use server response as source of truth
      setIsFollowing(data.following);
      
      // Simple cache invalidation - Twitter-like
      queryClient.invalidateQueries({ queryKey: ['follow-status', authorUsername] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', authorUsername] });
      if (currentUserUsername) {
        queryClient.invalidateQueries({ queryKey: ['profile-stats', currentUserUsername] });
      }
      
      // Show success message based on server response
      toast({ description: data.following ? "Now following!" : "Unfollowed" });
    },
    onError: (err: any) => {
      console.error('❌ Follow action failed:', err);
      // Refetch the actual status from server on error
      queryClient.invalidateQueries({ queryKey: ['follow-status', authorUsername] });
      toast({ description: err?.message || "Failed to update follow status", variant: "destructive" });
    }
  });
  
  // Handler that explicitly passes the intended action
  const handleFollowClick = () => {
    const action = isFollowing ? 'unfollow' : 'follow';
    console.log(`👆 Follow button clicked: current isFollowing=${isFollowing}, action will be=${action}`);
    followMutation.mutate({ action });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'bearish': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  // If this is an audio minicast post, render the special card
  if (post.isAudioPost) {
    // Use the saved selectedPosts if available, otherwise try to find them from cache
    let selectedPosts: Array<{ id: string | number; content: string }> = [];
    
    if (post.selectedPosts && post.selectedPosts.length > 0) {
      selectedPosts = post.selectedPosts.map(sp => ({
        id: sp.id,
        content: sp.content
      }));
    } else if (post.selectedPostIds && post.selectedPostIds.length > 0) {
      const allPosts = queryClient.getQueryData<any[]>(['/api/social-posts']) || [];
      selectedPosts = (post.selectedPostIds || [])
        .map(selectedId => {
          const selectedPost = allPosts.find(p => p.id === selectedId || p.id?.toString() === selectedId?.toString());
          if (selectedPost) {
            return {
              id: selectedPost.id,
              content: selectedPost.content || ''
            };
          }
          return null;
        })
        .filter((p): p is { id: string | number; content: string } => p !== null);
    }
    
    // Use the mirror cache for the audio card avatar the same way as regular PostCards
    const audioPostUsername = post.user?.handle || post.authorUsername || '';
    const liveAudioAvatar = getAvatar(audioPostUsername) || post.authorAvatar || post.user?.avatar || undefined;

    return (
      <AudioMinicastCard
        content={post.content}
        author={{
          displayName: post.user?.username || post.authorDisplayName || 'Unknown User',
          username: audioPostUsername,
          avatar: liveAudioAvatar
        }}
        selectedPostIds={post.selectedPostIds}
        selectedPosts={selectedPosts}
        timestamp={post.createdAt ? new Date(post.createdAt) : new Date()}
        likes={post.likes || post.metrics?.likes || 0}
        comments={post.comments || post.metrics?.comments || 0}
        isLiked={liked}
        postId={post.id?.toString()}
        isOwner={isOwnPost}
      />
    );
  }

  // ── Range Report Post: flat card with no action bar ──
  if (post.metadata?.type === 'range_report') {
    const liveUrl = getAvatar(post.authorUsername || post.user?.handle);
    const storedUrl = post.authorAvatar || post.user?.avatar;
    const avatarUrl = liveUrl || storedUrl;
    const isValidAvatar = avatarUrl && !avatarUrl.includes('ui-avatars.com') && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/'));
    return (
      <Card className="bg-card border border-border shadow-none mb-2 rounded-xl overflow-hidden transition-none">
        <CardContent className="p-2.5 xl:p-4 pb-0 transition-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7 border border-border flex-shrink-0">
                {isValidAvatar ? (
                  <AvatarImage src={avatarUrl} alt={post.authorDisplayName || post.authorUsername} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                  {post.user?.initial || post.authorDisplayName?.charAt(0) || post.authorUsername?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                {onViewUserProfile ? (
                  <button
                    onClick={() => {
                      const username = post.user?.handle || post.authorUsername || '';
                      if (username) onViewUserProfile(username);
                    }}
                    className="text-foreground font-semibold text-sm hover:underline leading-none"
                  >
                    {post.user?.username || post.authorDisplayName || post.authorUsername || 'Unknown'}
                  </button>
                ) : (
                  <span className="text-foreground font-semibold text-sm leading-none">
                    {post.user?.username || post.authorDisplayName || post.authorUsername || 'Unknown'}
                  </span>
                )}
                <p className="text-muted-foreground text-xs leading-none mt-0.5">@{post.user?.handle || post.authorUsername}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {rangeCountdown && (
                rangeCountdown.expired
                  ? <span className="text-[9px] bg-gray-100 dark:bg-zinc-800 text-gray-400 px-1.5 py-0.5 rounded font-medium">expired</span>
                  : <span className="text-[9px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">{rangeCountdown.hoursLeft}h left</span>
              )}
            </div>
          </div>
        </CardContent>
        {/* Heatmap + Stats — no padding, fills the card */}
        <RangeReportCard metadata={post.metadata} postId={post.id} postCreatedAt={post.createdAt} stripped={true} />
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border shadow-none mb-2 rounded-xl transition-none">
      
      <CardContent className="p-2.5 xl:p-4 transition-none">
        {/* User Header - For reposts, shows the reposter (current user) as the main author */}
        <div className="flex items-start justify-between mb-2 xl:mb-3">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="relative">
              {(() => {
                const liveUrl = getAvatar(post.authorUsername || post.user?.handle);
                const storedUrl = post.authorAvatar || post.user?.avatar;
                const avatarUrl = liveUrl || storedUrl;
                const isValidAvatar = avatarUrl && !avatarUrl.includes('ui-avatars.com') && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/'));
                return (
                  <Avatar className="w-7 h-7 xl:w-9 xl:h-9 border border-border">
                    {isValidAvatar ? (
                      <AvatarImage src={avatarUrl} alt={post.authorDisplayName || post.authorUsername} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs xl:text-sm">
                      {post.user?.initial || 
                       post.authorDisplayName?.charAt(0) || 
                       post.authorUsername?.charAt(0) || 
                       'U'}
                    </AvatarFallback>
                  </Avatar>
                );
              })()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {onViewUserProfile ? (
                  <button
                    onClick={() => {
                      const username = post.user?.handle || post.authorUsername || '';
                      if (username) onViewUserProfile(username);
                    }}
                    className="text-foreground font-semibold text-sm xl:text-base hover:underline cursor-pointer transition-colors"
                    data-testid={`button-profile-${post.authorUsername}`}
                  >
                    {post.user?.username || 
                     post.authorDisplayName || 
                     post.authorUsername || 
                     'Unknown User'}
                  </button>
                ) : (
                  <span
                    className="text-foreground font-semibold text-sm xl:text-base"
                    data-testid={`text-profile-${post.authorUsername}`}
                  >
                    {post.user?.username || 
                     post.authorDisplayName || 
                     post.authorUsername || 
                     'Unknown User'}
                  </span>
                )}
                {(post.user?.verified || post.authorVerified) && (
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                )}
                {/* Repost attribution - shows original author with repost icon */}
                {post.isRepost && post.originalAuthorUsername && (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Repeat className="h-4 w-4 text-green-500" />
                    {onViewUserProfile ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (post.originalAuthorUsername) {
                            onViewUserProfile(post.originalAuthorUsername);
                          }
                        }}
                        className="text-sm hover:underline cursor-pointer text-green-600 dark:text-green-400 font-medium"
                        data-testid={`button-original-author-${post.originalPostId}`}
                      >
                        {post.originalAuthorDisplayName || post.originalAuthorUsername}
                      </button>
                    ) : (
                      <span
                        className="text-sm text-green-600 dark:text-green-400 font-medium"
                        data-testid={`text-original-author-${post.originalPostId}`}
                      >
                        {post.originalAuthorDisplayName || post.originalAuthorUsername}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium">
                <span>@{post.user?.handle || post.authorUsername || 'user'}</span>
                {/* Hide timestamp for finance news posts (auto-generated content) */}
                {post.authorUsername !== 'finance_news' && (
                  <>
                    <span>•</span>
                    <span>
                      {post.timestamp || 
                       (post.createdAt ? new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'now')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Follow/Following button - Instagram/Twitter style toggle */}
            {!isOwnPost && currentUserUsername && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollowClick}
                disabled={followMutation.isPending}
                className={`rounded-full px-4 text-xs font-semibold min-w-[80px] ${
                  isFollowing 
                    ? 'border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                data-testid={`button-follow-${post.id}`}
              >
                {followMutation.isPending ? '...' : isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
            {/* Audio mode indicator */}
            {isAudioMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                <Mic className="w-3 h-3" />
                <span>Select text</span>
              </div>
            )}
            {/* Range report countdown badge */}
            {rangeCountdown && (
              rangeCountdown.expired ? (
                <span className="text-[9px] bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 px-1.5 py-0.5 rounded font-medium">expired</span>
              ) : (
                <span className="text-[9px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">{rangeCountdown.hoursLeft}h left</span>
              )
            )}
            {/* 3-dot menu - only show for user's own posts */}
            {isOwnPost && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  data-testid={`button-options-${post.id}`}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
                
                {/* Dropdown menu */}
                {showOptionsMenu && (
                  <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50 min-w-[50px]">
                    <button
                      onClick={() => {
                        setShowDeleteDialog(true);
                        setShowOptionsMenu(false);
                      }}
                      className="flex items-center justify-center p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                      data-testid={`button-delete-${post.id}`}
                      title="Delete Post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-1.5 xl:mb-3">
          {/* Range Report Card */}
          {post.metadata?.type === 'range_report' && (
            <RangeReportCard metadata={post.metadata} postId={post.id} postCreatedAt={post.createdAt} />
          )}

          {post.metadata?.type === 'trade_insight' && (
            <TradeInsightCard post={post} />
          )}
          <div className="relative">
            {(() => {
              const isJournalPost = post.metadata?.type === 'range_report' || post.metadata?.type === 'trade_insight';
              const isReportContent = post.content?.trim().toLowerCase().replace(/[-\s]/g, '') === 'tradingreport' || post.content?.trim().toLowerCase() === 'trading-report';
              if (isJournalPost || isReportContent) return null;
              return (
            <p 
              className={`text-gray-900 dark:text-white leading-snug mb-1.5 xl:mb-3 text-sm xl:text-base font-medium ${
                isAudioMode ? 'cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors rounded-lg p-2 -m-2' : ''
              }`}
              onClick={handleTextSelection}
            >
              {isExpanded || post.content.length <= MAX_TEXT_LENGTH
                ? post.content
                : `${post.content.substring(0, MAX_TEXT_LENGTH)}...`}
            </p>
              );
            })()}
            
            {/* Expand/Collapse button for long text */}
            {!(post.metadata?.type === 'range_report' || post.metadata?.type === 'trade_insight') && !['trading-report','trading report'].includes(post.content?.trim().toLowerCase()) && post.content.length > MAX_TEXT_LENGTH && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mt-1 transition-colors"
                data-testid={`button-expand-${post.id}`}
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Show more</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Ticker and Sentiment - Only show if valid ticker exists */}
          {post.ticker && (
            <div className="flex items-center gap-1.5 mb-1.5 xl:mb-3">
              <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 xl:px-4 xl:py-2 font-bold text-xs">
                {post.ticker}
              </Badge>
              <Badge className={`px-2 py-0.5 xl:px-4 xl:py-2 border font-bold text-xs ${
                post.sentiment === 'bullish' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' :
                post.sentiment === 'bearish' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' :
                'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
              }`}>
                {post.sentiment === 'bullish' && <TrendingUp className="w-4 h-4 mr-1" />}
                {post.sentiment === 'bearish' && <TrendingDown className="w-4 h-4 mr-1" />}
                {post.sentiment === 'neutral' && <Activity className="w-4 h-4 mr-1" />}
                {(post.sentiment || 'neutral').charAt(0).toUpperCase() + (post.sentiment || 'neutral').slice(1)}
              </Badge>
            </div>
          )}

          {/* Multiple Images Display - Swipeable Carousel for all images */}
          {(post.hasMedia || post.imageUrl) && (
            <div className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              {(() => {
                // Support both single images and JSON arrays of multiple images
                let images: string[] = [];
                if (post.imageUrl) {
                  try {
                    // Try to parse as JSON array first (for multiple images)
                    const parsed = JSON.parse(post.imageUrl);
                    images = Array.isArray(parsed) ? parsed : [post.imageUrl];
                  } catch {
                    // If not JSON, treat as single image
                    images = [post.imageUrl];
                  }
                }
                
                // Always use swipeable carousel for consistent card-like experience
                if (images.length > 0) {
                  return <SwipeableCarousel images={images} />;
                }
                return null;
              })()}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags?.filter(tag => tag.toLowerCase().replace(/[-\s]/g, '') !== 'tradingreport').map((tag, index) => (
              <span key={`${post.id}-tag-${index}-${tag}`} className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border py-1.5 xl:py-2">
          <div className="flex items-center gap-3 xl:gap-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentSection(!showCommentSection)}
              className={`flex items-center gap-1 xl:gap-2 px-1.5 xl:px-3 py-1 xl:py-2 h-auto rounded-lg transition-colors ${
                showCommentSection ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid={`button-comment-${post.id}`}
            >
              <MessageCircle className={`h-4 w-4 xl:h-5 xl:w-5 ${showCommentSection ? 'text-blue-500' : ''}`} />
              <span className="text-xs xl:text-sm">{commentCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => repostMutation.mutate({ wasReposted: reposted })}
              disabled={repostMutation.isPending}
              className={`flex items-center gap-1 xl:gap-2 px-1.5 xl:px-3 py-1 xl:py-2 h-auto rounded-lg transition-colors ${
                reposted ? 'text-green-500 dark:text-green-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid={`button-repost-${post.id}`}
            >
              <Repeat className={`h-4 w-4 xl:h-5 xl:w-5 ${reposted ? 'text-green-500' : ''}`} />
              <span className="text-xs xl:text-sm">{repostCount}</span>
            </Button>
            
            <div ref={voteBarRef} className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoteBar(!showVoteBar)}
                disabled={likeMutation.isPending || downtrendMutation.isPending}
                className={`flex items-center gap-1 xl:gap-2 px-1.5 xl:px-3 py-1 xl:py-2 h-auto rounded-lg transition-colors ${
                  liked || downtrended
                    ? liked ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                data-testid={`button-vote-${post.id}`}
                title="Click to vote"
              >
                {liked ? (
                  <TrendingUp className="h-4 w-4 xl:h-5 xl:w-5 fill-green-600 dark:fill-green-400 text-green-600 dark:text-green-400" />
                ) : downtrended ? (
                  <TrendingDown className="h-4 w-4 xl:h-5 xl:w-5 fill-red-600 dark:fill-red-400 text-red-600 dark:text-red-400" />
                ) : (
                  <TrendingUp className="h-4 w-4 xl:h-5 xl:w-5" />
                )}
                <span className="text-xs xl:text-sm">{liked ? likeCount : downtrended ? downtrendCount : likeCount}</span>
              </Button>

              {/* Vote Bar - Facebook/LinkedIn Style */}
              {showVoteBar && (
                <div className="absolute bottom-full mb-2 left-0 bg-gray-50 dark:bg-gray-800 rounded-full shadow-lg p-2 flex gap-3 backdrop-blur-sm border border-gray-300 dark:border-gray-700 z-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      likeMutation.mutate({ wasLiked: liked });
                      setShowVoteBar(false);
                    }}
                    disabled={likeMutation.isPending}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
                      liked
                        ? 'bg-green-600/20 text-green-600 dark:bg-green-400/20 dark:text-green-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-white'
                    }`}
                    title="Uptrend (Bullish)"
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm">{likeCount}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      downtrendMutation.mutate({ wasDowntrended: downtrended });
                      setShowVoteBar(false);
                    }}
                    disabled={downtrendMutation.isPending}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
                      downtrended
                        ? 'bg-red-600/20 text-red-600 dark:bg-red-400/20 dark:text-red-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-white'
                    }`}
                    title="Downtrend (Bearish)"
                  >
                    <TrendingDown className="h-5 w-5" />
                    <span className="text-sm">{downtrendCount}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Only show analysis button if valid ticker exists */}
            {post.ticker && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`flex items-center gap-1 backdrop-blur-sm hover:bg-gray-500/20 px-1.5 xl:px-3 py-1 xl:py-2 h-auto rounded-lg ${
                  showAnalysis ? 'text-black dark:text-white' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 xl:h-5 xl:w-5" />
              </Button>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowShareModal(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 xl:p-2 h-auto rounded-lg"
            data-testid={`button-share-${post.id}`}
          >
            <Share className="h-4 w-4 xl:h-5 xl:w-5" />
          </Button>
        </div>

        {/* Analysis Panel - Only show if valid ticker exists */}
        {showAnalysis && post.ticker && (
          <AnalysisPanel 
            ticker={post.ticker}
            isOpen={showAnalysis}
            onClose={() => setShowAnalysis(false)}
          />
        )}

        {/* Inline Comment Section */}
        <InlineCommentSection 
          post={post}
          isVisible={showCommentSection}
          onClose={() => setShowCommentSection(false)}
          onCommentAdded={() => setCommentCount(prev => prev + 1)}
          onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))}
        />

        {/* Share Modal */}
        <ShareModal 
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          post={post}
        />

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="resize-none"
              data-testid="textarea-edit-content"
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={() => editMutation.mutate(editContent)}
                disabled={editMutation.isPending || !editContent.trim()}
                data-testid="button-save-edit"
              >
                {editMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
});

// Twitter-style User Profile View Component
function ViewUserProfile({ 
  username, 
  onBack, 
  currentUserUsername 
}: { 
  username: string; 
  onBack: () => void; 
  currentUserUsername: string;
}) {
  const [activeTab, setActiveTab] = useState('Posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const getAvatar = useUserAvatar();

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${username}/profile`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/profile`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch followers/following counts
  const { data: countsData = { followers: 0, following: 0 } } = useQuery({
    queryKey: [`/api/users/${username}/followers-count`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/followers-count`);
      if (!response.ok) return { followers: 0, following: 0 };
      return response.json();
    },
    staleTime: 30 * 1000,
  });

  // Fetch user posts directly for this user
  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: [`/api/social-posts/by-user/${username}`],
    queryFn: async (): Promise<SocialPost[]> => {
      const response = await fetch(`/api/social-posts/by-user/${username}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    staleTime: 30 * 1000,
    enabled: !!username,
  });

  // Fetch followers list
  const { data: followersList = { followers: [] } } = useQuery({
    queryKey: [`/api/users/${username}/followers-list`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/followers-list`);
      if (!response.ok) return { followers: [] };
      return response.json();
    },
    enabled: showFollowersDialog,
  });

  // Fetch following list
  const { data: followingList = { following: [] } } = useQuery({
    queryKey: [`/api/users/${username}/following-list`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/following-list`);
      if (!response.ok) return { following: [] };
      return response.json();
    },
    enabled: showFollowingDialog,
  });

  // Check follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserUsername || currentUserUsername === username) return;
      try {
        const idToken = await getCognitoToken();
        if (!idToken) return;
        const response = await fetch(`/api/users/${username}/follow-status`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.following || data.isFollowing || false);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    checkFollowStatus();
  }, [username, currentUserUsername]);

  // Posts are already filtered by user from the API
  const userPosts = allPosts;

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUserUsername || currentUserUsername === username) return;
    
    setIsFollowLoading(true);
    try {
      const idToken = await getCognitoToken();
      if (!idToken) {
        setIsFollowLoading(false);
        return;
      }
      
      const endpoint = isFollowing
        ? `/api/users/${username}/unfollow`
        : `/api/users/${username}/follow`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          targetUserData: { displayName: profileData?.displayName || username }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
        queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/followers-count`] });
        toast({ description: data.following ? 'Following!' : 'Unfollowed' });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const isOwnProfile = currentUserUsername?.toLowerCase() === username?.toLowerCase();
  const displayName = profileData?.displayName || username;
  const bio = profileData?.bio || '';
  const profilePicUrl = profileData?.profilePicUrl;
  const initials = (displayName || 'U').charAt(0).toUpperCase();
  const performanceIsPublic = profileData?.performancePublic !== false;
  const showPerformance = isOwnProfile || performanceIsPublic;

  const VIEW_MINDSET_CARDS = [
    { label: "Trader's Mindset", quote: "Be like water — adapt to what the market gives you. Never force a trade.", bg: 'from-gray-950 via-[#1a1200] to-gray-900', showImage: true, image: '/bruce-lee-card.png' },
    { label: 'Your Greatest Enemy Is Within', quote: "Fear, greed, and ego destroy more traders than any bad setup ever will.", bg: 'from-[#0d0500] via-[#2a1400] to-[#0d0800]', showImage: true, image: '/bruce-lee-enemy-within.png' },
    { label: 'Loss Psychology', quote: "A loss is tuition — pay it and move on. Revenge trading is the real enemy.", bg: 'from-rose-600 to-red-700', showImage: false, image: '' },
    { label: 'Ignore the Noise', quote: "Consuming too much information creates paralysis. Block the noise — trust your system.", bg: 'from-slate-600 to-slate-800', showImage: false, image: '' },
    { label: 'Follow the Rules', quote: "Your rules exist because your past self was rational. Don't let emotions override them.", bg: 'from-violet-600 to-indigo-700', showImage: false, image: '' },
  ];

  const [viewCardIndex, setViewCardIndex] = useState(() => new Date().getDay() % VIEW_MINDSET_CARDS.length);
  const [viewCardExiting, setViewCardExiting] = useState(false);
  const viewTouchStartRef = useRef<number | null>(null);
  const viewSwipedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setViewCardExiting(true);
      setTimeout(() => { setViewCardIndex(i => (i + 1) % VIEW_MINDSET_CARDS.length); setViewCardExiting(false); }, 280);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Fetch performance snapshot from in-memory mirror — instant, no DynamoDB read
  const { data: viewPerfMirror } = useQuery({
    queryKey: ['perf-mirror', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}/performance-mirror`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: showPerformance,
    staleTime: 60 * 1000,
    refetchInterval: showPerformance ? 30 * 1000 : false,
  });

  const viewPerfMetrics = useMemo(() => {
    const fallback = {
      last6Months: [] as { label: string; pnl: number }[],
      monthlyYield: 0, totalTrades: 0, currentStreak: 0, disciplineData: [] as number[],
    };
    if (!viewPerfMirror) return fallback;
    return {
      last6Months: viewPerfMirror.last6Months || [],
      monthlyYield: viewPerfMirror.monthlyYield || 0,
      totalTrades: viewPerfMirror.totalTrades || 0,
      currentStreak: viewPerfMirror.currentStreak || 0,
      disciplineData: viewPerfMirror.disciplineData || [],
    };
  }, [viewPerfMirror]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-3">
                <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-10 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="w-24 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h2>
        <Button onClick={onBack} data-testid="button-back-not-found">Go back</Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Back Button Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          data-testid="button-back-profile"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Header — no cover photo */}
      <div className="bg-white dark:bg-gray-900 px-4 pt-4 pb-0 border-b border-gray-100 dark:border-gray-800">
        {/* Top row: avatar + info + stats + action button */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <Avatar className="w-14 h-14 flex-shrink-0 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            {profilePicUrl ? (
              <AvatarImage src={profilePicUrl} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Name / handle / bio */}
          <div className="flex-1 min-w-0">
            <h1 className="text-gray-900 dark:text-white font-bold text-base leading-tight flex items-center gap-1 flex-wrap">
              {displayName}
              {profileData?.verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-current flex-shrink-0" />
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              @{username}
              {profileData?.location ? ` · ${profileData.location}` : ''}
            </p>
            {bio && (
              <p className="text-gray-700 dark:text-gray-300 text-xs mt-0.5 leading-snug">{bio}</p>
            )}
          </div>

          {/* Stats + action button on the right */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {/* Stats row */}
            <div className="flex items-center gap-3 text-center">
              <button
                className="hover:opacity-80 transition-opacity"
                onClick={() => setShowFollowingDialog(true)}
                data-testid="button-view-following"
              >
                <div className="font-bold text-gray-900 dark:text-white text-sm leading-none">{countsData?.following || 0}</div>
                <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wide mt-0.5">Following</div>
              </button>
              <button
                className="hover:opacity-80 transition-opacity"
                onClick={() => setShowFollowersDialog(true)}
                data-testid="button-view-followers"
              >
                <div className="font-bold text-gray-900 dark:text-white text-sm leading-none">{countsData?.followers || 0}</div>
                <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wide mt-0.5">Followers</div>
              </button>
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-sm leading-none">{userPosts.length}</div>
                <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wide mt-0.5">Posts</div>
              </div>
            </div>
            {/* Action Button */}
            {isOwnProfile ? (
              <Button
                variant="default"
                size="sm"
                className="rounded-lg px-4 text-xs font-semibold bg-gray-900 dark:bg-white dark:text-gray-900 text-white"
                onClick={() => setShowEditProfile(true)}
                data-testid="button-edit-profile"
              >
                Edit Profile
              </Button>
            ) : currentUserUsername ? (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className={`rounded-lg px-4 text-xs font-semibold min-w-[80px] ${
                  isFollowing
                    ? 'border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-500'
                    : 'bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 text-white'
                }`}
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                data-testid="button-follow-profile"
              >
                {isFollowLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isFollowing ? 'Following' : 'Follow'}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Join Date */}
        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs mb-3">
          <Calendar className="w-3 h-3" />
          <span>Joined {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Mindset Quote Card + Performance Cards — visible when public (or own profile) */}
      {showPerformance && (
        <div className="bg-white dark:bg-gray-900 px-4 pt-3 pb-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">Performance</p>
            <div className="flex items-center gap-1 text-[9px] text-gray-400 dark:text-gray-500">
              {performanceIsPublic ? (
                <><Unlock className="w-2.5 h-2.5" /><span>Public</span></>
              ) : (
                <><Lock className="w-2.5 h-2.5" /><span>Private</span></>
              )}
            </div>
          </div>
          {performanceIsPublic && (
            <p className="text-[8px] text-blue-400 dark:text-blue-500 mb-2 flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" /> Visible to everyone
            </p>
          )}

          {/* Mindset Card */}
          <style>{`@keyframes blPulseV{0%,100%{filter:drop-shadow(0 0 8px rgba(234,179,8,.35)) brightness(1);transform:scale(1)}50%{filter:drop-shadow(0 0 18px rgba(234,179,8,.7)) brightness(1.08);transform:scale(1.04)}}`}</style>
          <div className="relative h-[88px] mb-3">
            {[2, 1].map((offset) => {
              const c = VIEW_MINDSET_CARDS[(viewCardIndex + offset) % VIEW_MINDSET_CARDS.length];
              return (
                <div key={offset} className={`absolute inset-0 rounded-xl bg-gradient-to-r ${c.bg}`}
                  style={{ opacity: offset === 2 ? 0.32 : 0.6, transform: `translateY(${offset === 2 ? '-7px' : '-3.5px'}) scaleX(${offset === 2 ? 0.95 : 0.98})`, zIndex: offset === 2 ? 1 : 2 }}
                />
              );
            })}
            {(() => {
              const card = VIEW_MINDSET_CARDS[viewCardIndex];
              return (
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${card.bg} shadow-md overflow-hidden z-10 select-none`}
                  style={{ opacity: viewCardExiting ? 0 : 1, transform: viewCardExiting ? 'translateY(-8px) scale(0.97)' : 'translateY(0) scale(1)', transition: 'opacity 280ms, transform 280ms' }}
                  onTouchStart={e => { viewTouchStartRef.current = e.touches[0].clientX; viewSwipedRef.current = false; }}
                  onTouchEnd={e => {
                    if (viewTouchStartRef.current === null) return;
                    const delta = e.changedTouches[0].clientX - viewTouchStartRef.current;
                    if (Math.abs(delta) > 40) { viewSwipedRef.current = true; setViewCardExiting(true); setTimeout(() => { setViewCardIndex(i => (i + (delta < 0 ? 1 : -1) + VIEW_MINDSET_CARDS.length) % VIEW_MINDSET_CARDS.length); setViewCardExiting(false); }, 280); }
                    viewTouchStartRef.current = null;
                  }}
                  onClick={e => {
                    if (viewSwipedRef.current) { viewSwipedRef.current = false; return; }
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const isRight = e.clientX - rect.left > rect.width / 2;
                    setViewCardExiting(true);
                    setTimeout(() => { setViewCardIndex(i => (i + (isRight ? 1 : -1) + VIEW_MINDSET_CARDS.length) % VIEW_MINDSET_CARDS.length); setViewCardExiting(false); }, 280);
                  }}
                >
                  {card.showImage && (
                    <>
                      <div className="absolute right-0 top-0 bottom-0 w-[90px] bg-gradient-to-l from-yellow-500/25 via-yellow-400/10 to-transparent pointer-events-none" />
                      <div className="absolute right-0 top-0 bottom-0 w-[80px] overflow-hidden pointer-events-none">
                        <img src={card.image} alt="" className="absolute inset-0 w-full h-full object-contain object-bottom" style={{ animation: 'blPulseV 3s ease-in-out infinite' }} />
                      </div>
                    </>
                  )}
                  <div className={`flex items-center h-full px-3 ${card.showImage ? 'pr-[82px]' : 'pr-3'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[7px] uppercase tracking-widest font-bold mb-0.5 text-white/65">{card.label}</p>
                      <p className="text-[10px] font-semibold leading-tight text-white">&ldquo;{card.quote}&rdquo;</p>
                    </div>
                    <div className="flex flex-col items-center justify-end pb-1.5 flex-shrink-0 self-end ml-2">
                      <div className="flex items-center gap-1">
                        {VIEW_MINDSET_CARDS.map((_, i) => (
                          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === viewCardIndex ? 'w-3 bg-white' : 'w-1 bg-white/30'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Performance Metric Cards — only shown when profile is public */}
          {performanceIsPublic && (() => {
            const { last6Months, monthlyYield, totalTrades, disciplineData, currentStreak } = viewPerfMetrics;
            const miniLinePath = (data: number[], w = 80, h = 28) => {
              if (data.length < 2) return null;
              const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
              const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((v - min) / range) * h }));
              return pts.reduce((d, p, i) => i === 0 ? `M ${p.x.toFixed(1)},${p.y.toFixed(1)}` : `${d} L ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');
            };
            const isYieldPos = monthlyYield >= 0;
            const yieldPath = miniLinePath(last6Months.map(m => m.pnl));
            const disciplinePath = miniLinePath(disciplineData.length > 1 ? disciplineData : [0, 1, 2, 3, 4, 5]);
            const MONTHLY_TARGET_PCT = 5.0;
            const targetProgress = Math.min(100, Math.max(0, (monthlyYield / MONTHLY_TARGET_PCT) * 100));
            const R = 18, CIRC = 2 * Math.PI * R, dash = (targetProgress / 100) * CIRC;
            return (
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
                {/* Streak */}
                <div className="flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                  <div className="flex items-center gap-1 mb-1"><Flame className="w-3 h-3 text-orange-500" /><p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Streak</p></div>
                  <p className="text-base font-bold leading-none text-orange-500 mb-1.5">{currentStreak} days</p>
                  <div className="flex gap-0.5">{Array.from({ length: 7 }).map((_, i) => <div key={i} className={`flex-1 h-4 rounded-sm ${i < Math.min(currentStreak, 7) ? 'bg-orange-400' : 'bg-gray-100 dark:bg-gray-700'}`} />)}</div>
                  <p className="text-[8px] text-gray-400 mt-1">Journal streak</p>
                </div>
                {/* Journal Entries */}
                <div className="flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                  <div className="flex items-center gap-1 mb-1"><BookOpen className="w-3 h-3 text-teal-500" /><p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Journal</p></div>
                  <p className="text-base font-bold leading-none text-teal-600 dark:text-teal-400 mb-2">{totalTrades} entries</p>
                  <div className="flex gap-0.5 items-end h-6">{last6Months.map((m, i) => { const maxP = Math.max(...last6Months.map(x => Math.abs(x.pnl)), 1); return <div key={i} className="flex-1 rounded-sm bg-teal-400/70" style={{ height: `${Math.max(20, (Math.abs(m.pnl) / maxP) * 100)}%` }} />; })}</div>
                  <p className="text-[8px] text-gray-400 mt-1">Logged trades</p>
                </div>
                {/* Yield */}
                <div className="flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                  <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-1">Yield</p>
                  <p className={`text-base font-bold leading-none mb-2 ${isYieldPos ? 'text-emerald-500' : 'text-red-500'}`}>{isYieldPos ? '+' : ''}{monthlyYield.toFixed(1)}%</p>
                  {yieldPath ? <svg width="100%" height="24" viewBox="0 0 80 24" preserveAspectRatio="none"><path d={yieldPath} fill="none" stroke={isYieldPos ? '#10b981' : '#ef4444'} strokeWidth="1.8" strokeLinecap="round" /></svg>
                    : <div className="flex gap-0.5 items-end h-6">{last6Months.map((m, i) => <div key={i} className={`flex-1 rounded-sm ${m.pnl >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ height: `${Math.max(20, Math.abs(m.pnl) / Math.max(...last6Months.map(x => Math.abs(x.pnl)), 1) * 100)}%` }} />)}</div>}
                  <p className="text-[8px] text-gray-400 mt-1">{totalTrades} trades</p>
                </div>
                {/* Target */}
                <div className="flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                  <div className="flex items-center gap-1 mb-1"><TargetIcon className="w-3 h-3 text-blue-500" /><p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Target</p></div>
                  <div className="flex items-center gap-2">
                    <svg width="40" height="40" viewBox="0 0 46 46">
                      <circle cx="23" cy="23" r={R} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                      <circle cx="23" cy="23" r={R} fill="none" stroke={targetProgress >= 100 ? '#10b981' : '#3b82f6'} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${dash} ${CIRC}`} strokeDashoffset={CIRC * 0.25} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                      <text x="23" y="27" textAnchor="middle" fontSize="9" fontWeight="700" fill={targetProgress >= 100 ? '#10b981' : '#3b82f6'}>{Math.round(targetProgress)}%</text>
                    </svg>
                    <div><p className="text-xs font-bold text-gray-900 dark:text-white leading-none">{monthlyYield >= 0 ? '+' : ''}{monthlyYield.toFixed(1)}%</p><p className="text-[9px] text-gray-400 mt-0.5">of {MONTHLY_TARGET_PCT}%</p></div>
                  </div>
                </div>
                {/* Discipline */}
                <div className="flex-shrink-0 w-[130px] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm p-3">
                  <div className="flex items-center gap-1 mb-1"><Award className="w-3 h-3 text-violet-500" /><p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Discipline</p></div>
                  <p className="text-base font-bold leading-none mb-2 text-violet-600 dark:text-violet-400">{currentStreak} wins</p>
                  {disciplinePath ? <svg width="100%" height="24" viewBox="0 0 80 24" preserveAspectRatio="none"><defs><linearGradient id="dg-view" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs><path d={disciplinePath} fill="none" stroke="url(#dg-view)" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    : <div className="h-6 flex items-center"><div className="h-px w-full bg-violet-200 dark:bg-violet-800" /></div>}
                  <p className="text-[8px] text-gray-400 mt-1">Win streak trend</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {(['Posts', 'Audio', 'Bullish', 'Bearish'] as const).map((tab) => {
            const count = tab === 'Posts'
              ? userPosts.filter(p => !(p as any).isAudioPost).length
              : tab === 'Audio'
              ? userPosts.filter(p => (p as any).isAudioPost).length
              : tab === 'Bullish'
              ? userPosts.filter(p => (p as any).sentiment === 'bullish').length
              : userPosts.filter(p => (p as any).sentiment === 'bearish').length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-3 font-medium text-sm whitespace-nowrap transition-colors relative flex-shrink-0 ${
                  activeTab === tab
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                data-testid={`button-profile-tab-${tab.toLowerCase()}`}
              >
                {tab}{!postsLoading && count > 0 ? ` (${count})` : ''}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4">
        {(() => {
          const postSkeletons = (
            <div className="space-y-3 mt-2">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 animate-pulse border-0 shadow-none bg-muted/30">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-muted rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-muted rounded w-28"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );

          const emptyState = (icon: React.ReactNode, message: string) => (
            <div className="py-14 text-center text-gray-400 dark:text-gray-500">
              <div className="mb-3 flex justify-center opacity-40">{icon}</div>
              <p className="text-sm">{message}</p>
            </div>
          );

          const renderPosts = (posts: typeof userPosts, emptyMsg: string) => {
            if (postsLoading) return postSkeletons;
            if (posts.length === 0) return emptyState(<MessageCircle className="w-10 h-10" />, emptyMsg);
            return (
              <div className="space-y-2 mt-2 mb-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      id: post.id.toString(),
                      content: post.content,
                      authorUsername: post.authorUsername,
                      authorDisplayName: post.authorDisplayName,
                      authorAvatar: post.authorAvatar,
                      authorVerified: post.authorVerified,
                      createdAt: post.createdAt,
                      likes: post.likes || 0,
                      comments: post.comments || 0,
                      reposts: post.reposts || 0,
                      imageUrl: post.imageUrl,
                      hasMedia: post.hasImage,
                      metadata: post.metadata,
                      ticker: post.stockMentions?.[0] ? `$${post.stockMentions[0]}` : '',
                      sentiment: post.sentiment as 'bullish' | 'bearish' | 'neutral' | null,
                      tags: post.tags || [],
                      stockMentions: post.stockMentions || [],
                      user: {
                        initial: (post.authorDisplayName || 'U')[0].toUpperCase(),
                        username: post.authorDisplayName || '',
                        handle: post.authorUsername || '',
                        verified: post.authorVerified || false,
                        online: true,
                        avatar: post.authorAvatar || undefined,
                      },
                      metrics: {
                        comments: post.comments || 0,
                        reposts: post.reposts || 0,
                        likes: post.likes || 0,
                      },
                    } as FeedPost}
                    currentUserUsername={currentUserUsername}
                  />
                ))}
              </div>
            );
          };

          const audioPosts = userPosts.filter(p => (p as any).isAudioPost);
          const bullishPosts = userPosts.filter(p => (p as any).sentiment === 'bullish');
          const bearishPosts = userPosts.filter(p => (p as any).sentiment === 'bearish');
          if (activeTab === 'Posts') return renderPosts(userPosts.filter(p => !(p as any).isAudioPost), 'No posts yet.');
          if (activeTab === 'Audio') return renderPosts(audioPosts, 'No audio minicasts yet.');
          if (activeTab === 'Bullish') return renderPosts(bullishPosts, 'No bullish posts yet.');
          if (activeTab === 'Bearish') return renderPosts(bearishPosts, 'No bearish posts yet.');
          return null;
        })()}
      </div>

      {/* Edit Profile Dialog (own profile only) */}
      {showEditProfile && (
        <EditProfileDialog
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          profileData={profileData}
          onSuccess={() => {
            setShowEditProfile(false);
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
            queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
            queryClient.invalidateQueries({ queryKey: ['/api/social-posts/news'] });
            queryClient.invalidateQueries({ queryKey: ['/api/social-posts/audio'] });
            queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] });
            queryClient.invalidateQueries({ queryKey: [`/api/social-posts/by-user/${username}`] });
            queryClient.invalidateQueries({ queryKey: ['profile-stats', username] });
            queryClient.invalidateQueries({ queryKey: ['user-posts', username] });
            queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/followers-count`] });
            queryClient.invalidateQueries({ queryKey: ['followers-list', username] });
            queryClient.invalidateQueries({ queryKey: ['following-list', username] });
            setTimeout(() => window.location.reload(), 500);
          }}
        />
      )}

      {/* Followers Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Followers
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {followersList.followers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No followers yet</p>
              </div>
            ) : (
              followersList.followers.map((follower: any) => (
                <div
                  key={follower.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <Avatar className="w-10 h-10">
                    {(() => {
                      const liveUrl = getAvatar(follower.username);
                      const avatarUrl = liveUrl || follower.avatar;
                      return avatarUrl && !avatarUrl.includes('ui-avatars.com') ? (
                        <AvatarImage src={avatarUrl} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                          {(follower.displayName || follower.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      );
                    })()}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{follower.displayName || follower.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{follower.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Following
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {followingList.following.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Not following anyone yet</p>
              </div>
            ) : (
              followingList.following.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <Avatar className="w-10 h-10">
                    {(() => {
                      const liveUrl = getAvatar(user.username);
                      const avatarUrl = liveUrl || user.avatar;
                      return avatarUrl && !avatarUrl.includes('ui-avatars.com') ? (
                        <AvatarImage src={avatarUrl} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                          {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      );
                    })()}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{user.displayName || user.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NeoFeedSocialFeedComponent({ onBackClick }: { onBackClick?: () => void }) {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [profileActiveTab, setProfileActiveTab] = useState<string>('Posts');
  const [isAtTop, setIsAtTop] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [currentUserUsername, setCurrentUserUsername] = useState<string>('');
  const [viewingUserProfile, setViewingUserProfile] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTopFilters, setShowTopFilters] = useState(true);
  const [showAppBar, setShowAppBar] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollYRef = useRef(0);
  const [headerHeight, setHeaderHeight] = useState(130);
  const [showMobileCreatePost, setShowMobileCreatePost] = useState(false);
  const [showMobileAudioMinicast, setShowMobileAudioMinicast] = useState(false);
  const [showMobileMessages, setShowMobileMessages] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { isAudioMode, setIsAudioMode, selectedTextSnippets, clearSelection } = useAudioMode();
  
  const handleDeactivateAudio = () => {
    setIsAudioMode(false);
    clearSelection();
  };
  
  // Handle scroll to hide/show app bar and bottom navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Stop all audio playback when scrolling
      window.speechSynthesis.cancel();
      
      // Pause YouTube video when scrolling
      if (typeof (window as any).pauseBannerYouTube === 'function') {
        (window as any).pauseBannerYouTube();
      }
      
      // App Bar + Bottom Nav - show on scroll up, hide on scroll down
      if (currentScrollY < lastScrollYRef.current || currentScrollY < 10) {
        setShowAppBar(true);
        setShowBottomNav(true);
      } else if (currentScrollY > lastScrollYRef.current) {
        setShowAppBar(false);
        setShowBottomNav(false);
      }
      
      lastScrollYRef.current = currentScrollY;
      setIsAtTop(currentScrollY < 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Track sticky header height so create post panel never goes under it
  useEffect(() => {
    const header = document.getElementById('neofeed-sticky-header');
    if (!header) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setHeaderHeight(Math.ceil(entry.contentRect.height));
      }
    });
    observer.observe(header);
    setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    return () => observer.disconnect();
  }, []);

  // Fetch posts with stable caching to prevent flickering
  const { data: posts = [], isLoading, error, isFetching } = useQuery({
    queryKey: ['/api/social-posts'],
    queryFn: async (): Promise<SocialPost[]> => {
      const response = await fetch('/api/social-posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      return await response.json();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoading && !isFetching && posts.length > 0) {
        setPageNumber(prev => prev + 1);
      }
    }, { threshold: 0.1 });
    
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isLoading, isFetching, posts.length]);


  // Check if user has profile (username) when component mounts and fetch real username
  // Also prefetch data into query cache for instant Profile tab loading
  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        const idToken = await getCognitoToken();
        if (!idToken) {
          console.log('No user logged in');
          return;
        }

        console.log('🔍 Checking profile for authenticated user');

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('📋 Profile check response:', {
            userId: profileData.userId,
            email: profileData.email,
            hasProfile: !!profileData.profile,
            hasUsername: !!profileData.profile?.username,
            hasDOB: !!profileData.profile?.dob,
            profileData: profileData.profile
          });

          // Prefetch profile data into query cache for instant Profile tab loading
          if (profileData.profile) {
            queryClient.setQueryData(['my-profile'], profileData.profile);
          }

          // Store real username from DynamoDB for Profile filter
          if (profileData.profile?.username) {
            setCurrentUserUsername(profileData.profile.username);
            
            // Prefetch profile stats for instant Profile tab loading
            fetch(`/api/profile/${profileData.profile.username}/stats`)
              .then(res => res.ok ? res.json() : { followers: 0, following: 0 })
              .then(stats => {
                queryClient.setQueryData(['profile-stats', profileData.profile.username], stats);
                console.log('📊 Prefetched profile stats:', stats);
              })
              .catch(() => {});
          }

          // Show dialog only if user doesn't have username or DOB
          if (!profileData.profile || !profileData.profile.username || !profileData.profile.dob) {
            console.log('❌ Profile incomplete (missing username or DOB), showing profile dialog');
            setShowProfileDialog(true);
          } else {
            console.log('✅ Profile complete, user can use social feed');
          }
        } else {
          console.error('❌ Profile check failed with status:', response.status);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };

    checkUserProfile();
  }, [queryClient]);

  // Smart "All" button functionality
  const handleAllClick = () => {
    setSelectedFilter('All');
    setPageNumber(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter change handler
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setPageNumber(1);
    if (filter === 'Profile') setProfileActiveTab('Posts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search functionality
  const handleSearch = () => {
    // Search logic will filter posts in the filteredData step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convert SocialPost to FeedPost format for compatibility and apply filtering
  const rawFeedData: FeedPost[] = posts.map(post => ({
    id: post.id.toString(),
    user: {
      initial: post.authorDisplayName?.[0]?.toUpperCase() || "U",
      username: post.authorDisplayName,
      handle: post.authorUsername,
      verified: post.authorVerified,
      online: true, // Default since we don't track online status
      avatar: post.authorAvatar || undefined,
    },
    content: post.content,
    timestamp: formatTimestamp(post.createdAt),
    tags: post.tags || [],
    sentiment: (post.sentiment || 'neutral') as 'bullish' | 'bearish' | 'neutral',
    ticker: post.stockMentions?.[0] ? `$${post.stockMentions[0]}` : "",
    metrics: {
      comments: post.comments,
      reposts: post.reposts,
      likes: post.likes,
    },
    hasMedia: post.hasImage || false,
    imageUrl: post.imageUrl || undefined,
    imageUrls: post.imageUrl ? [post.imageUrl] : [],
    stockMentions: post.stockMentions || [],
    isAudioPost: post.isAudioPost || false,
    selectedPostIds: post.selectedPostIds || [],
    metadata: post.metadata,
    authorUsername: post.authorUsername,
    authorDisplayName: post.authorDisplayName,
    createdAt: post.createdAt,
    // Repost fields - reposts are now stored as separate posts with their own engagement
    isRepost: (post as any).isRepost || false,
    originalPostId: (post as any).originalPostId,
    originalAuthorUsername: (post as any).originalAuthorUsername,
    originalAuthorDisplayName: (post as any).originalAuthorDisplayName,
    originalAuthorAvatar: (post as any).originalAuthorAvatar,
    originalAuthorVerified: (post as any).originalAuthorVerified,
    // Own engagement counts for reposts (separate from original post)
    likes: post.likes || 0,
    comments: post.comments || 0,
    reposts: post.reposts || 0,
  }));

  // Enhanced content normalization function to handle source variations
  const normalizeContentForDeduplication = (content: string): string => {
    let normalized = content.trim().toLowerCase();
    
    // Remove source information patterns
    normalized = normalized
      .replace(/🔗\s*source:\s*[^,.\n]*[,.\n]?/gi, '') // Remove "🔗 Source: XYZ"
      .replace(/source:\s*[^,.\n]*[,.\n]?/gi, '') // Remove "Source: XYZ"
      .replace(/-\s*[^,.\n]*(?:today|times|watch|news|india|business)[^,.\n]*[,.\n]?/gi, '') // Remove news source names
      .replace(/\([^)]*(?:today|times|watch|news|india|business)[^)]*\)/gi, '') // Remove sources in parentheses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Remove leading news emoji and common prefixes
    normalized = normalized
      .replace(/^📰\s*/gi, '') // Remove news emoji
      .replace(/^news:\s*/gi, '') // Remove "News:" prefix
      .replace(/^breaking:\s*/gi, '') // Remove "Breaking:" prefix
      .trim();
    
    return normalized;
  };

  // Remove duplicates: ID-based deduplication only - show all posts including similar content
  const seenIds = new Set<string>();
  const allFeedData: FeedPost[] = rawFeedData.filter(post => {
    const postId = post.id.toString();
    if (seenIds.has(postId)) return false;
    seenIds.add(postId);
    return true;
  });

  // Apply search filtering first
  let searchFilteredData = allFeedData;
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    searchFilteredData = allFeedData.filter(post => 
      post.content.toLowerCase().includes(query) ||
      post.user?.username?.toLowerCase().includes(query) ||
      post.ticker?.toLowerCase().includes(query) ||
      post.stockMentions?.some(stock => stock.toLowerCase().includes(query)) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Apply filter tabs to search results - using real username from DynamoDB state
  // Use case-insensitive matching for Profile filter to handle username case variations
  let filteredData: FeedPost[] = selectedFilter === 'All' 
    ? searchFilteredData
    : selectedFilter === 'Symbol' 
    ? searchFilteredData.filter(post => post.stockMentions && post.stockMentions.length > 0)
    : selectedFilter === 'Bullish'
    ? searchFilteredData.filter(post => post.sentiment === 'bullish')
    : selectedFilter === 'Bearish'
    ? searchFilteredData.filter(post => post.sentiment === 'bearish')
    : selectedFilter === 'Profile'
    ? (() => {
        const profilePosts = searchFilteredData.filter(post => 
          post.authorUsername?.toLowerCase() === currentUserUsername?.toLowerCase() || 
          post.user?.handle?.toLowerCase() === currentUserUsername?.toLowerCase());
        if (profileActiveTab === 'Audio') return profilePosts.filter(p => p.isAudioPost);
        if (profileActiveTab === 'Bullish') return profilePosts.filter(p => p.sentiment === 'bullish');
        if (profileActiveTab === 'Bearish') return profilePosts.filter(p => p.sentiment === 'bearish');
        if (profileActiveTab === 'Media') return profilePosts.filter(p => p.hasMedia || !!p.imageUrl);
        return profilePosts.filter(p => !p.isAudioPost); // Posts tab (default)
      })()
    : searchFilteredData.filter(post => post.tags?.some(tag => tag.toLowerCase().includes(selectedFilter.toLowerCase())));

  // Sort posts - memoized to prevent re-sorting on every render
  const feedData: FeedPost[] = useMemo(() => {
    return filteredData.sort((a, b) => {
      // Posts with symbols/stockMentions come first
      const aHasSymbols = a.stockMentions && a.stockMentions.length > 0;
      const aHasTicker = a.ticker && a.ticker.length > 0;
      const bHasSymbols = b.stockMentions && b.stockMentions.length > 0;
      const bHasTicker = b.ticker && b.ticker.length > 0;
      
      if ((aHasSymbols || aHasTicker) && !(bHasSymbols || bHasTicker)) return -1;
      if (!(aHasSymbols || aHasTicker) && (bHasSymbols || bHasTicker)) return 1;
      
      // If both have symbols or neither have symbols, sort by creation date (newest first)
      const aDate = new Date(a.timestamp || 0).getTime();
      const bDate = new Date(b.timestamp || 0).getTime();
      return bDate - aDate;
    });
  }, [filteredData]);

  function formatTimestamp(dateStr: string | Date): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    // Less than 1 minute
    if (diffInMinutes < 1) return 'now';
    
    // Less than 1 hour - show minutes
    if (diffInHours < 1) return `${Math.floor(diffInMinutes)}m`;
    
    // Less than 24 hours - show hours
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
    
    // Less than 7 days - show days
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d`;
    
    // 7+ days - show full date in DD-MM-YYYY format
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Show skeleton loading only on initial load, not during background fetches
  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <FeedHeader onAllClick={handleAllClick} isRefreshing={isFetching} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} showAppBar={showAppBar} onBackClick={onBackClick} />
        <div className="max-w-3xl mx-auto px-3 py-3">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-card border border-border animate-pulse shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-muted rounded"></div>
                      <div className="w-24 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-4 bg-muted rounded"></div>
                    <div className="w-3/4 h-4 bg-muted rounded"></div>
                    <div className="w-1/2 h-4 bg-muted rounded"></div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="w-16 h-6 bg-muted rounded"></div>
                    <div className="w-16 h-6 bg-muted rounded"></div>
                    <div className="w-16 h-6 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <FeedHeader onAllClick={handleAllClick} isRefreshing={isFetching} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} showAppBar={showAppBar} onBackClick={onBackClick} />
        <div className="max-w-3xl mx-auto px-3 py-3">
          <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-red-600 dark:text-red-400">Failed to load posts. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Use feedData directly - don't add mock data
  const defaultFeedData: FeedPost[] = feedData;

  // Show ViewUserProfile when viewing another user's profile
  if (viewingUserProfile) {
    return (
      <ViewUserProfile
        username={viewingUserProfile}
        onBack={() => setViewingUserProfile(null)}
        currentUserUsername={currentUserUsername}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      {/* Back Button - Absolute positioned in top-right corner (Mobile Only) */}
      {onBackClick && (
        <Button
          onClick={onBackClick}
          variant="ghost"
          size="icon"
          className="lg:hidden absolute top-4 right-4 z-50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          data-testid="button-back-to-home-neofeed"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      )}
      
      <FeedHeader 
        onAllClick={handleAllClick} 
        isRefreshing={isFetching} 
        selectedFilter={selectedFilter} 
        onFilterChange={handleFilterChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        showAppBar={showAppBar}
        onBackClick={onBackClick}
      />
      
      {/* Live Banner - Spans full width (Hidden in Profile view) */}
      {selectedFilter !== 'Profile' && (
        <div className="px-4 py-4 max-w-7xl mx-auto w-full">
          <LiveBanner />
        </div>
      )}

      {/* Profile Header - Full width row, only on Profile tab */}
      {selectedFilter === 'Profile' && (
        <div className="px-4 py-2 md:py-3 max-w-7xl mx-auto w-full">
          <ProfileHeader onTabChange={(tab) => setProfileActiveTab(tab)} />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex gap-5 xl:gap-6 px-4 py-2 md:py-3 max-w-7xl mx-auto w-full">
        {/* Social Feed Posts - Left column */}
        <div className="flex-[3] min-w-0">
          <div className="space-y-2 xl:space-y-3">
            {feedData.map((post) => (
              <PostCard key={post.id} post={post} currentUserUsername={currentUserUsername} onViewUserProfile={setViewingUserProfile} />
            ))}
            
            {/* Infinite scroll loader trigger */}
            <div 
              ref={loaderRef}
              className="flex justify-center py-8"
              data-testid="loader-infinite-scroll"
            >
              {(isFetching || (isLoading && posts.length > 0)) && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              )}
            </div>
          </div>
        </div>

        {/* Post Creation Panel - Right Side (Desktop Only) */}
        {(
          <div className="hidden md:flex flex-[2] min-w-[300px] max-w-[460px] flex-shrink-0">
            <div
              className="sticky z-30 transition-[top] duration-300 w-full"
              style={{ top: `${headerHeight + 12}px` }}
            >
              <PostCreationPanel />
            </div>
          </div>
        )}
      </div>

      {/* Profile Setup Dialog - Only shows if user doesn't have username or DOB */}
      <UserIdSetupDialog 
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        onSuccess={(username) => {
          localStorage.setItem('currentUsername', username);
          setShowProfileDialog(false);
          toast({
            title: "Profile Created!",
            description: "You can now post and interact on the social feed.",
          });
          // Reload page to update profile dropdown with new username
          setTimeout(() => window.location.reload(), 500);
        }}
      />

      {/* Mobile Create Post Dialog - Only shows on mobile when + button is tapped */}
      <Dialog open={showMobileCreatePost} onOpenChange={setShowMobileCreatePost}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <div className="p-4">
            <PostCreationPanel hideAudioMode={true} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Audio Minicast Dialog - Only shows on mobile when Radio button is tapped */}
      <Dialog open={showMobileAudioMinicast} onOpenChange={setShowMobileAudioMinicast}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
          <PostCreationPanel 
            initialViewMode="audio" 
            onMinimize={() => setShowMobileAudioMinicast(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Mobile Messages Dialog - Only shows on mobile when Messages button is tapped */}
      <Dialog open={showMobileMessages} onOpenChange={setShowMobileMessages}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <div className="p-4">
            <PostCreationPanel initialViewMode="message" hideAudioMode={true} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Selected Posts Preview - Always visible when posts are selected, independent of bottom nav */}
      <div className="md:hidden">
        <AudioSelectedPostsPreview
          snippets={selectedTextSnippets}
          onTap={() => setShowMobileAudioMinicast(true)}
          onDeactivate={handleDeactivateAudio}
        />
      </div>

      {/* Bottom Navigation Bar - Mobile Only (Hides on scroll) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 pb-4 px-6 pointer-events-none transition-all duration-300 ${
        showBottomNav ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}>
        <div className="max-w-xs mx-auto backdrop-blur-md rounded-full shadow-lg pointer-events-auto transition-all duration-300 bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-around px-1.5 py-1.5">
            {/* Home Icon */}
            <button
              onClick={() => handleFilterChange('All')}
              className="flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              data-testid="button-home-mobile"
            >
              <Home className="h-5 w-5" />
            </button>

            {/* Plus Icon (Create Post) */}
            <button
              onClick={() => setShowMobileCreatePost(true)}
              className="flex items-center justify-center flex-1 rounded-full px-4 py-2 shadow-md transition-all duration-200 bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              data-testid="button-create-mobile"
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* MiniCast Icon - Toggles Audio MiniCast */}
            <button
              onClick={() => setShowMobileAudioMinicast(!showMobileAudioMinicast)}
              className={`flex items-center justify-center flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                showMobileAudioMinicast 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              data-testid="button-minicast-mobile"
            >
              <Layers className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add padding to bottom of content to prevent overlap with bottom nav on mobile */}
      <div className="md:hidden h-20"></div>
    </div>
  );
}

// Wrap with AudioModeProvider + UserAvatarProvider for audio minicast + mirror avatar logic
export default function NeoFeedSocialFeed({ onBackClick }: { onBackClick?: () => void }) {
  return (
    <AudioModeProvider>
      <UserAvatarProvider>
        <NeoFeedSocialFeedComponent onBackClick={onBackClick} />
      </UserAvatarProvider>
    </AudioModeProvider>
  );
}