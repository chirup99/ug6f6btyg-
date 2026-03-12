import { useState, useRef, useEffect, useMemo, memo } from 'react';
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
  Link as LinkIcon, Facebook, MessageCircle as WhatsApp, Send as Telegram, Linkedin
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
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

// Inline Comment Section Component - Twitter/Instagram Style with @mentions
function InlineCommentSection({ post, isVisible, onClose, onCommentAdded }: { post: FeedPost; isVisible: boolean; onClose: () => void; onCommentAdded?: () => void }) {
  const [comment, setComment] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getUserDisplayName, getUsername } = useCurrentUser();

  // Fetch existing comments for this post from AWS DynamoDB
  const { data: existingComments = [], isLoading: loadingComments, refetch: refetchComments } = useQuery({
    queryKey: [`/api/social-posts/${post.id}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/social-posts/${post.id}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
    },
    enabled: isVisible,
    staleTime: 30000,
  });

  // Search users for @mention autocomplete
  const searchUsers = async (query: string) => {
    if (!query || query.length < 1) {
      setMentionSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const users = await response.json();
        setMentionSuggestions(users);
        setSelectedMentionIndex(0);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Handle text input and detect @mentions
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setComment(value);
    setCursorPosition(cursorPos);

    // Detect if user is typing @mention
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const searchTerm = mentionMatch[1];
      setMentionSearch(searchTerm);
      setShowMentionSuggestions(true);
      searchUsers(searchTerm);
    } else {
      setShowMentionSuggestions(false);
      setMentionSearch('');
    }
  };

  // Handle keyboard navigation in mention suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentionSuggestions || mentionSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev < mentionSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev > 0 ? prev - 1 : mentionSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertMention(mentionSuggestions[selectedMentionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentionSuggestions(false);
    }
  };

  // Insert selected mention into comment
  const insertMention = (user: MentionSuggestion) => {
    const textBeforeCursor = comment.slice(0, cursorPosition);
    const textAfterCursor = comment.slice(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const newText = `${beforeMention}@${user.username} ${textAfterCursor}`;
      setComment(newText);
      setShowMentionSuggestions(false);
      
      // Focus and set cursor position after the inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + user.username.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Add comment mutation using AWS DynamoDB
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const username = getUsername() || localStorage.getItem('currentUsername') || 'anonymous';
      const displayName = getUserDisplayName() || username;
      const avatar: string | null = null; // Avatar fetched from profile if needed
      
      const response = await fetch(`/api/social-posts/${post.id}/comments/aws`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content,
          authorUsername: username,
          authorDisplayName: displayName,
          authorAvatar: avatar
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }
      return response.json();
    },
    onSuccess: () => {
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/social-posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      setComment('');
      toast({ description: "Comment added!" });
      refetchComments();
    },
    onError: (error: any) => {
      toast({ 
        description: error.message || "Failed to add comment", 
        variant: "destructive" 
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const username = getUsername() || localStorage.getItem('currentUsername');
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorUsername: username })
      });
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/social-posts/${post.id}/comments`] });
      setShowDeleteMenu(null);
      toast({ description: "Comment deleted" });
    },
    onError: () => {
      toast({ description: "Failed to delete comment", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && !showMentionSuggestions) {
      commentMutation.mutate(comment.trim());
    }
  };

  // Click outside to close mention suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowMentionSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isVisible) return null;

  const currentUsername = getUsername() || localStorage.getItem('currentUsername');

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 overflow-x-hidden" data-testid={`comment-section-${post.id}`}>
      {/* Loading State */}
      {loadingComments && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Comments List */}
      {existingComments.length > 0 && (
        <div className="mb-4">
          <div className="max-h-80 overflow-y-auto overflow-x-hidden space-y-3">
            {existingComments.map((existingComment: any) => {
              const isUserComment = existingComment.authorUsername?.toLowerCase() === currentUsername?.toLowerCase();
              
              return (
                <div key={existingComment.id} className="relative group" data-testid={`comment-${existingComment.id}`}>
                  <div className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      {existingComment.authorAvatar ? (
                        <AvatarImage src={existingComment.authorAvatar} alt={existingComment.authorDisplayName} />
                      ) : null}
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {existingComment.authorDisplayName?.[0]?.toUpperCase() || existingComment.authorUsername?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {existingComment.authorDisplayName || existingComment.authorUsername || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          @{existingComment.authorUsername}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatCommentTimestamp(existingComment.createdAt)}
                        </span>
                      </div>
                        {post.metadata?.type === 'trade_insight' && (
                          <div className="mb-4 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/50 rounded-xl overflow-hidden shadow-sm">
                            <div className="flex h-[140px]">
                              {/* Left side: Date and Chart */}
                              <div className="flex-1 p-4 flex flex-col">
                                <div className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                  {post.metadata.date}
                                </div>
                                <div className="flex-1 w-full min-h-0 relative">
                                  {post.metadata.chartData && post.metadata.chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={post.metadata.chartData.map((val: number, i: number) => ({ val, i }))}>
                                        <defs>
                                          <linearGradient id={`pnlGradient-${post.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                        <Line 
                                          type="monotone" 
                                          dataKey="val" 
                                          stroke={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} 
                                          strokeWidth={2} 
                                          dot={false}
                                          animationDuration={1000}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] text-gray-400">
                                      No chart data
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Right side: Stats */}
                              <div className="w-[120px] bg-gray-50/50 dark:bg-zinc-900/20 border-l border-gray-100 dark:border-zinc-800/50 p-4 flex flex-col justify-center space-y-3">
                                <div>
                                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL P&L</div>
                                  <div className={`text-sm font-bold ${post.metadata.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{Math.floor(post.metadata.pnl).toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">TRADES</div>
                                  <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{post.metadata.trades}</div>
                                </div>
                                <div>
                                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">WIN RATE</div>
                                  <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{post.metadata.winRate}%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                          <CommentContent content={existingComment.content} />
                        </p>
                    </div>
                    
                    {/* Delete menu for user's own comments */}
                    {isUserComment && (
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowDeleteMenu(showDeleteMenu === existingComment.id ? null : existingComment.id)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                          data-testid={`button-comment-menu-${existingComment.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        {showDeleteMenu === existingComment.id && (
                          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-[100px]">
                            <button
                              onClick={() => deleteCommentMutation.mutate(existingComment.id)}
                              disabled={deleteCommentMutation.isPending}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                              data-testid={`button-delete-comment-${existingComment.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loadingComments && existingComments.length === 0 && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          No comments yet. Be the first to comment!
        </div>
      )}

      {/* Add New Comment Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-start gap-3 px-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-blue-500 text-white">
              {getUserDisplayName()?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Write a comment... Use @ to mention someone"
              value={comment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyDown}
              className="min-h-[50px] text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 resize-none rounded-xl pr-16"
              disabled={commentMutation.isPending}
              data-testid={`input-comment-${post.id}`}
            />
            
            {/* Mention Suggestions Dropdown */}
            {showMentionSuggestions && mentionSuggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute bottom-full left-0 mb-1 w-full max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="py-1">
                  {mentionSuggestions.map((user, index) => (
                    <button
                      key={`${user.username}-${index}`}
                      type="button"
                      onClick={() => insertMention(user)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        index === selectedMentionIndex 
                          ? 'bg-blue-50 dark:bg-blue-900/30' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      data-testid={`mention-suggestion-${user.username}`}
                    >
                      <Avatar className="w-8 h-8">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.displayName} />
                        ) : null}
                        <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {user.displayName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{user.username}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button inside textarea */}
            <Button 
              type="submit" 
              size="icon"
              disabled={!comment.trim() || commentMutation.isPending}
              className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
              data-testid={`button-submit-comment-${post.id}`}
            >
              {commentMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
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
  
  // Fetch real chart data from the API with optimized caching for faster loading
  const { data: chartData = [], isLoading: chartLoading } = useQuery({
    queryKey: ['stock-chart', ticker, timeframe],
    queryFn: () => fetch(`/api/stock-chart-data/${ticker}?timeframe=${timeframe}`).then(res => res.json()),
    refetchInterval: timeframe === '1D' ? 60000 : 300000, // Reduced frequency: 1min for 1D, 5min for others
    staleTime: timeframe === '1D' ? 30000 : 180000, // Longer cache: 30s for 1D, 3min for others
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Use cached data on mount for faster loading
    refetchOnWindowFocus: false // Reduce unnecessary refetches
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
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* App Header - Hides on scroll */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showAppBar ? 'max-h-20 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                  <div className="text-gray-700 dark:text-gray-300 font-bold text-sm">⚡</div>
                </div>
                <div>
                  <h1 className="text-gray-900 dark:text-white font-bold text-xl">NeoFeed</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">AI-Powered Trading Network</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
               
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="h-5 w-5" />
                </Button>
                <UserProfileDropdown />
              </div>
            </div>
          </div>

          {/* AI-Enhanced Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
            <Input
              placeholder="Ask me about stocks, market news, IPOs, trading strategies..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-20 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              data-testid="input-neo-feed-search"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {searchQuery.trim() && (
                <Button
                  onClick={handleSearch}
                  size="sm"
                  className="h-7 w-7 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center justify-center"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex gap-2 overflow-x-auto">
            {['All', 'Bullish', 'Bearish', 'Profile'].map((filter, index) => (
              <Button
                key={filter}
                onClick={filter === 'All' ? onAllClick : () => onFilterChange(filter)}
                variant={selectedFilter === filter ? "default" : "ghost"}
                disabled={filter === 'All' && isRefreshing}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedFilter === filter
                    ? `bg-blue-600 hover:bg-blue-700 text-white ${filter === 'All' && isRefreshing ? 'opacity-80' : ''}` 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {index === 0 && isRefreshing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {filter}
                </div>
              </Button>
            ))}
          </div>
          
          {/* Back Button - Right Corner (Mobile Only) */}
          {onBackClick && (
            <Button
              onClick={onBackClick}
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
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

function ProfileHeader() {
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

  // Simple profile fetch - heavily cached to load instantly when switching tabs
  const { data: profileData, isLoading } = useQuery({
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - profile data rarely changes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch when component remounts (tab switching)
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: false, // Don't refetch when component remounts (tab switching)
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
  const coverPicUrl = profileData?.coverPicUrl;
  const initials = displayName ? displayName.charAt(0).toUpperCase() : username.charAt(0).toUpperCase();

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
      
      // Invalidate profile cache to refresh
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6 animate-pulse">
        <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
        <div className="pt-20 px-4 pb-4">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

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

      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-6">
        {/* Cover Photo */}
        <div className={`h-48 relative overflow-visible ${coverPicUrl ? 'bg-black' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'}`}>
          {coverPicUrl && (
            <img src={coverPicUrl} alt="Cover" className="w-full h-full object-contain" />
          )}
          {/* Cover Edit Button - Twitter style camera icon */}
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            disabled={uploading}
            data-testid="button-edit-cover"
          >
            <Camera className="w-5 h-5" />
          </button>
          {/* Profile Picture - overlapping cover */}
          <div className="absolute -bottom-16 left-4 z-20">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 overflow-hidden">
                {profilePicUrl ? (
                  <AvatarImage src={profilePicUrl} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-4xl font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              {/* Profile Picture Edit Button - Twitter style camera icon */}
              <button
                onClick={() => profileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={uploading}
                data-testid="button-edit-profile-pic"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-24 px-4 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold text-2xl flex items-center gap-2">
                {displayName || username}
                {profileData?.verified && (
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-current" />
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">@{username}</p>
            </div>
            <Button 
              variant="outline" 
              className="rounded-full px-6 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowEditProfile(true)}
              data-testid="button-edit-profile"
            >
              Edit profile
            </Button>
          </div>

          {bio && (
            <p className="text-gray-900 dark:text-white mb-4 text-base">{bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 text-sm mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>India</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date().getFullYear()}</span>
            </div>
          </div>

          <div className="flex gap-4 text-sm mb-4">
            <button 
              className="hover:underline"
              onClick={() => setShowFollowingDialog(true)}
              data-testid="button-show-following"
            >
              <span className="font-bold text-gray-900 dark:text-white">{following}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Following</span>
            </button>
            <button 
              className="hover:underline"
              onClick={() => setShowFollowersDialog(true)}
              data-testid="button-show-followers"
            >
              <span className="font-bold text-gray-900 dark:text-white">{followers}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Followers</span>
            </button>
          </div>

          <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700">
            {[`Posts ${postCount > 0 ? `(${postCount})` : ''}`, 'Media', 'Likes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.split(' ')[0])}
                className={`pb-3 px-2 font-medium transition-colors relative ${
                  activeTab === tab.split(' ')[0]
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                data-testid={`button-tab-${tab.split(' ')[0].toLowerCase()}`}
              >
                {tab}
                {activeTab === tab.split(' ')[0] && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Posts Display */}
      {activeTab === 'Posts' && (
        <div className="space-y-4 mb-6">
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : userPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No posts yet. Share your first trading insight!</p>
            </Card>
          ) : (
            userPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post as FeedPost}
                currentUserUsername={username}
              />
            ))
          )}
        </div>
      )}

      {/* User Liked Posts Display */}
      {activeTab === 'Likes' && (
        <div className="space-y-4 mb-6">
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : likedPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No liked posts yet. Like posts by tapping the voting button!</p>
            </Card>
          ) : (
            likedPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post as FeedPost}
                currentUserUsername={username}
              />
            ))
          )}
        </div>
      )}

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profileData={profileData}
        onSuccess={() => {
          setShowEditProfile(false);
          // Invalidate all relevant social feed queries to refresh UI data
          queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
          queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/social-posts/news'] });
          queryClient.invalidateQueries({ queryKey: ['/api/social-posts/audio'] });
          // Force a small delay then reload to ensure DynamoDB eventual consistency has a chance
          setTimeout(() => {
            window.location.reload();
          }, 500);
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
                    {follower.avatar ? (
                      <AvatarImage src={follower.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                        {(follower.displayName || follower.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
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
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                        {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
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
    ? 'w-[300px] h-[300px] rounded-full' 
    : 'w-full max-w-[600px] h-[200px] rounded-lg';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Adjust {imageType === 'profile' ? 'Profile' : 'Cover'} Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Preview Container */}
          <div 
            ref={containerRef}
            className={`relative overflow-hidden bg-gray-900 ${containerClass} cursor-move flex items-center justify-center`}
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
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                maxWidth: 'none',
                maxHeight: 'none',
                width: imageType === 'profile' ? 'auto' : 'auto',
                height: imageType === 'profile' ? 'auto' : 'auto',
                minWidth: imageType === 'profile' ? '100%' : '100%',
                minHeight: imageType === 'profile' ? '100%' : '100%',
                objectFit: 'cover',
              }}
              draggable={false}
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-4 w-full max-w-md">
            <ZoomOut className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              data-testid="slider-zoom"
            />
            <ZoomIn className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Move className="w-4 h-4" />
            Drag to reposition
          </p>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={uploading} data-testid="button-cancel-crop">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={uploading} data-testid="button-apply-crop">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <div className="relative">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="Enter username"
                className="pr-10"
                data-testid="input-username"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" data-testid="icon-checking-username" />
                )}
                {!checkingUsername && isUsernameChanged && usernameAvailable === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" data-testid="icon-username-available" />
                )}
                {!checkingUsername && isUsernameChanged && usernameAvailable === false && (
                  <X className="h-4 w-4 text-red-500" data-testid="icon-username-unavailable" />
                )}
              </div>
            </div>
            {usernameMessage && isUsernameChanged && (
              <p 
                className={`text-xs mt-1 ${usernameAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                data-testid="text-username-message"
              >
                {usernameMessage === "Username is available" ? "Available" : usernameMessage === "Username is already taken" ? "Not Available" : usernameMessage}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              data-testid="input-displayname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              data-testid="textarea-bio"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            To change your profile or cover photo, use the camera buttons on your profile header above.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={saving} data-testid="button-cancel-profile">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave || checkingUsername} data-testid="button-save-profile">
              {saving ? "Saving..." : checkingUsername ? "Checking..." : "Save Profile"}
            </Button>
          </div>
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
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user focuses window
    refetchInterval: 300000, // Auto-refresh every 5 minutes
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

const PostCard = memo(function PostCard({ post, currentUserUsername, onViewUserProfile }: { post: FeedPost; currentUserUsername?: string; onViewUserProfile?: (username: string) => void }) {
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
    
    // Keep post.id as string (Firebase IDs are strings)
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
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ content })
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
          'Authorization': `Bearer ${idToken}`
        }
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
    console.log('🎙️ Audio Minicast Post Detected:', {
      postId: post.id,
      selectedPostIds: post.selectedPostIds,
      hasSavedSelectedPosts: !!post.selectedPosts && post.selectedPosts.length > 0
    });
    
    // Use the saved selectedPosts if available, otherwise try to find them from cache
    let selectedPosts: Array<{ id: string | number; content: string }> = [];
    
    if (post.selectedPosts && post.selectedPosts.length > 0) {
      // Use the saved selected posts content (preferred method)
      console.log('✅ Using saved selectedPosts from post data');
      selectedPosts = post.selectedPosts.map(sp => ({
        id: sp.id,
        content: sp.content
      }));
    } else if (post.selectedPostIds && post.selectedPostIds.length > 0) {
      // Fallback: Try to find posts in cache (backward compatibility)
      console.log('⚠️ Falling back to cache lookup for selectedPosts');
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
    
    console.log('📊 Final selectedPosts array:', {
      count: selectedPosts.length,
      posts: selectedPosts.map(p => ({ id: p.id, contentLength: p.content.length }))
    });
    
    return (
      <AudioMinicastCard
        content={post.content}
        author={{
          displayName: post.user?.username || post.authorDisplayName || 'Unknown User',
          username: post.user?.handle || post.authorUsername || 'user',
          avatar: post.authorAvatar || post.user?.avatar || undefined
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

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md mb-4 transition-none">
      
      <CardContent className="p-3 xl:p-4 transition-none">
        {/* User Header - For reposts, shows the reposter (current user) as the main author */}
        <div className="flex items-start justify-between mb-2 xl:mb-4">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="relative">
              {(() => {
                const avatarUrl = post.authorAvatar || post.user?.avatar;
                const isValidAvatar = avatarUrl && avatarUrl.includes('s3.') && !avatarUrl.includes('ui-avatars.com');
                console.log('🖼️ PostCard avatar debug:', { 
                  postId: post.id, 
                  authorAvatar: post.authorAvatar, 
                  userAvatar: post.user?.avatar,
                  avatarUrl, 
                  isValidAvatar 
                });
                return (
                  <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-600 ">
                    {isValidAvatar ? (
                      <AvatarImage src={avatarUrl} alt={post.authorDisplayName || post.authorUsername} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm ">
                      {post.user?.initial || 
                       post.authorDisplayName?.charAt(0) || 
                       post.authorUsername?.charAt(0) || 
                       'U'}
                    </AvatarFallback>
                  </Avatar>
                );
              })()}
              {post.user?.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-lg animate-pulse ring-1 ring-emerald-400/40"></div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const username = post.user?.handle || post.authorUsername || '';
                    if (username) {
                      if (onViewUserProfile) {
                        onViewUserProfile(username);
                      } else {
                        window.location.href = `/user/${username}`;
                      }
                    }
                  }}
                  className="text-gray-900 dark:text-white font-bold text-lg hover:underline cursor-pointer transition-colors"
                  data-testid={`button-profile-${post.authorUsername}`}
                >
                  {post.user?.username || 
                   post.authorDisplayName || 
                   post.authorUsername || 
                   'Unknown User'}
                </button>
                {(post.user?.verified || post.authorVerified) && (
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                )}
                {/* Repost attribution - shows original author with repost icon */}
                {post.isRepost && post.originalAuthorUsername && (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Repeat className="h-4 w-4 text-green-500" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post.originalAuthorUsername) {
                          if (onViewUserProfile) {
                            onViewUserProfile(post.originalAuthorUsername);
                          } else {
                            window.location.href = `/user/${post.originalAuthorUsername}`;
                          }
                        }
                      }}
                      className="text-sm hover:underline cursor-pointer text-green-600 dark:text-green-400 font-medium"
                      data-testid={`button-original-author-${post.originalPostId}`}
                    >
                      {post.originalAuthorDisplayName || post.originalAuthorUsername}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm font-medium ">
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
        <div className="mb-2 xl:mb-4">
          {post.metadata?.type === 'trade_insight' && (
            <div className="mb-4 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/50 rounded-xl overflow-hidden shadow-sm">
              <div className="flex h-[140px]">
                {/* Left side: Date and Chart */}
                <div className="flex-1 p-4 flex flex-col">
                  <div className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {post.metadata.date}
                  </div>
                  <div className="flex-1 w-full min-h-0 relative">
                    {post.metadata.chartData && post.metadata.chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={post.metadata.chartData.map((val: number, i: number) => ({ val, i }))}>
                          <defs>
                            <linearGradient id={`pnlGradient-neofeed-${post.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.1}/>
                              <stop offset="95%" stopColor={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Line 
                            type="monotone" 
                            dataKey="val" 
                            stroke={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} 
                            strokeWidth={2} 
                            dot={false}
                            animationDuration={1000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-gray-400">
                        No chart data
                      </div>
                    )}
                  </div>
                </div>
                {/* Right side: Stats */}
                <div className="w-[120px] bg-gray-50/50 dark:bg-zinc-900/20 border-l border-gray-100 dark:border-zinc-800/50 p-4 flex flex-col justify-center space-y-3">
                  <div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL P&L</div>
                    <div className={`text-sm font-bold ${post.metadata.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.floor(post.metadata.pnl).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">TRADES</div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{post.metadata.trades}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">WIN RATE</div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{post.metadata.winRate}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="relative">
                          {post.metadata?.type === 'trade_insight' && (
                            <div className="mb-4 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/50 rounded-xl overflow-hidden shadow-sm">
                              <div className="flex h-[140px]">
                                {/* Left side: Date and Chart */}
                                <div className="flex-1 p-4 flex flex-col">
                                  <div className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                    {post.metadata.date}
                                  </div>
                                  <div className="flex-1 w-full min-h-0 relative">
                                    {post.metadata.chartData && post.metadata.chartData.length > 0 ? (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={post.metadata.chartData.map((val: number, i: number) => ({ val, i }))}>
                                          <defs>
                                            <linearGradient id={`pnlGradient-neofeed-post-${post.id}`} x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.1}/>
                                              <stop offset="95%" stopColor={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                                            </linearGradient>
                                          </defs>
                                          <Line 
                                            type="monotone" 
                                            dataKey="val" 
                                            stroke={post.metadata.pnl >= 0 ? "#22c55e" : "#ef4444"} 
                                            strokeWidth={2} 
                                            dot={false}
                                            animationDuration={1000}
                                          />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    ) : (
                                      <div className="h-full flex items-center justify-center text-[10px] text-gray-400">
                                        No chart data
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Right side: Stats */}
                                <div className="w-[120px] bg-gray-50/50 dark:bg-zinc-900/20 border-l border-gray-100 dark:border-zinc-800/50 p-4 flex flex-col justify-center space-y-3">
                                  <div>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL P&L</div>
                                    <div className={`text-sm font-bold ${post.metadata.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ₹{Math.floor(post.metadata.pnl).toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">TRADES</div>
                                    <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{post.metadata.trades}</div>
                                  </div>
                                  <div>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">WIN RATE</div>
                                    <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{post.metadata.winRate}%</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
            <p 
              className={`text-gray-900 dark:text-white leading-relaxed mb-2 xl:mb-3 text-base font-medium ${
                isAudioMode ? 'cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors rounded-lg p-2 -m-2' : ''
              }`}
              onClick={handleTextSelection}
            >
              {isExpanded || post.content.length <= MAX_TEXT_LENGTH
                ? post.content
                : `${post.content.substring(0, MAX_TEXT_LENGTH)}...`}
            </p>
            
            {/* Expand/Collapse button for long text */}
            {post.content.length > MAX_TEXT_LENGTH && (
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
            <div className="flex items-center gap-2 mb-2 xl:mb-3">
              <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-4 py-2 font-bold ">
                {post.ticker}
              </Badge>
              <Badge className={`px-4 py-2 border font-bold ${
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
            {post.tags?.map((tag, index) => (
              <span key={`${post.id}-tag-${index}-${tag}`} className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-300 dark:border-cyan-400/30 bg-gradient-to-r from-gray-100/80 to-gray-200/80 dark:from-black/40 dark:to-indigo-900/40 py-4 rounded-b-lg">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentSection(!showCommentSection)}
              className={`flex items-center gap-2 backdrop-blur-sm hover:bg-gray-500/20 px-3 py-2 rounded-lg transition-colors ${
                showCommentSection ? 'text-blue-500 dark:text-blue-400' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              data-testid={`button-comment-${post.id}`}
            >
              <MessageCircle className={`h-5 w-5 ${showCommentSection ? 'text-blue-500' : ''}`} />
              <span>{commentCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => repostMutation.mutate({ wasReposted: reposted })}
              disabled={repostMutation.isPending}
              className={`flex items-center gap-2 backdrop-blur-sm hover:bg-gray-500/20 px-3 py-2 rounded-lg transition-colors ${
                reposted ? 'text-green-500 dark:text-green-400' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              data-testid={`button-repost-${post.id}`}
            >
              <Repeat className={`h-5 w-5 ${reposted ? 'text-green-500' : ''}`} />
              <span>{repostCount}</span>
            </Button>
            
            <div ref={voteBarRef} className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoteBar(!showVoteBar)}
                disabled={likeMutation.isPending || downtrendMutation.isPending}
                className={`flex items-center gap-2 backdrop-blur-sm hover:bg-gray-500/20 px-3 py-2 rounded-lg transition-colors ${
                  liked || downtrended
                    ? liked ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                data-testid={`button-vote-${post.id}`}
                title="Click to vote"
              >
                {liked ? (
                  <TrendingUp className="h-5 w-5 fill-green-600 dark:fill-green-400 text-green-600 dark:text-green-400" />
                ) : downtrended ? (
                  <TrendingDown className="h-5 w-5 fill-red-600 dark:fill-red-400 text-red-600 dark:text-red-400" />
                ) : (
                  <TrendingUp className="h-5 w-5" />
                )}
                <span>{liked ? likeCount : downtrended ? downtrendCount : likeCount}</span>
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
                className={`flex items-center gap-2  backdrop-blur-sm hover:bg-gray-500/20 px-3 py-2 rounded-lg ${
                  showAnalysis ? 'text-black dark:text-white' : 'text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowShareModal(true)}
            className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-500/20  backdrop-blur-sm p-2 rounded-lg"
            data-testid={`button-share-${post.id}`}
          >
            <Share className="h-5 w-5" />
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${username}/profile`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/profile`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    staleTime: 60000,
  });

  // Fetch followers/following counts
  const { data: countsData = { followers: 0, following: 0 } } = useQuery({
    queryKey: [`/api/users/${username}/followers-count`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/followers-count`);
      if (!response.ok) return { followers: 0, following: 0 };
      return response.json();
    },
    staleTime: 60000,
  });

  // Fetch user posts
  const { data: allPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/social-posts'],
    queryFn: async (): Promise<SocialPost[]> => {
      const response = await fetch('/api/social-posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    staleTime: 120000,
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

  // Filter posts for this user
  const userPosts = allPosts.filter(post => 
    post.authorUsername?.toLowerCase() === username?.toLowerCase() ||
    post.authorDisplayName?.toLowerCase() === profileData?.displayName?.toLowerCase()
  );

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
  const coverPicUrl = profileData?.coverPicUrl;
  const initials = (displayName || 'U').charAt(0).toUpperCase();

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="h-48 bg-gray-300 dark:bg-gray-700 relative">
            <div className="absolute top-4 left-4 w-10 h-10 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
          </div>
          <div className="pt-20 px-4 pb-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
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
      
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-44 relative overflow-hidden">
          {coverPicUrl ? (
            <img src={coverPicUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600" />
          )}
          
          {/* Camera icon for cover editing (only for own profile) */}
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-gray-800/60 hover:bg-gray-800/80 text-white rounded-lg"
              data-testid="button-edit-cover"
            >
              <Camera className="h-5 w-5" />
            </Button>
          )}
          
          {/* Profile Picture - overlapping cover */}
          <div className="absolute -bottom-14 left-4">
            <div className="relative">
              <Avatar className="w-28 h-28 border-4 border-white dark:border-gray-800 shadow-lg">
                {profilePicUrl ? (
                  <AvatarImage src={profilePicUrl} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 px-4 pb-4">
          {/* Name and Edit/Follow Button Row */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-gray-900 dark:text-white font-bold text-xl flex items-center gap-2">
                {displayName}
                {profileData?.verified && (
                  <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />
                )}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">@{username}</p>
            </div>
            
            {/* Edit Profile or Follow Button */}
            {isOwnProfile ? (
              <Button
                variant="outline"
                className="rounded-full px-5 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                onClick={() => setLocation('/settings')}
                data-testid="button-edit-profile"
              >
                Edit profile
              </Button>
            ) : currentUserUsername ? (
              <Button
                variant={isFollowing ? "outline" : "default"}
                className={`rounded-full px-5 min-w-[100px] ${
                  isFollowing
                    ? 'border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-500'
                    : 'bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 text-white'
                }`}
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                data-testid="button-follow-profile"
              >
                {isFollowLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  'Following'
                ) : (
                  'Follow'
                )}
              </Button>
            ) : null}
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-gray-800 dark:text-gray-200 mb-3 text-sm">{bio}</p>
          )}

          {/* Location and Join Date */}
          <div className="flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400 text-sm mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>India</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Following/Followers Counts */}
          <div className="flex gap-4 text-sm mb-4">
            <button
              className="hover:underline"
              onClick={() => setShowFollowingDialog(true)}
              data-testid="button-view-following"
            >
              <span className="font-bold text-gray-900 dark:text-white">{countsData?.following || 0}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">Following</span>
            </button>
            <button
              className="hover:underline"
              onClick={() => setShowFollowersDialog(true)}
              data-testid="button-view-followers"
            >
              <span className="font-bold text-gray-900 dark:text-white">{countsData?.followers || 0}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">Followers</span>
            </button>
          </div>

          {/* Tabs: Posts, Media, Likes */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {['Posts', 'Media', 'Likes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                data-testid={`button-profile-tab-${tab.toLowerCase()}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="max-w-4xl mx-auto px-4">
        {activeTab === 'Posts' && (
          <div className="space-y-4 mb-6">
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : userPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No posts yet.</p>
              </Card>
            ) : (
              userPosts.map((post) => (
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
              ))
            )}
          </div>
        )}

        {activeTab === 'Media' && (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No media posts yet.</p>
          </Card>
        )}

        {activeTab === 'Likes' && (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Liked posts will appear here.</p>
          </Card>
        )}
      </div>

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
                    {follower.avatar ? (
                      <AvatarImage src={follower.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                        {(follower.displayName || follower.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
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
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                        {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
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
      
      // Update App Bar - Only show when at the top (top 50px)
      if (currentScrollY < 50) {
        setShowAppBar(true);
      } else {
        setShowAppBar(false);
      }
      
      // Update Bottom Nav - Show on scroll up, hide on scroll down
      if (currentScrollY < lastScrollYRef.current) {
        setShowBottomNav(true);
      } else if (currentScrollY > lastScrollYRef.current) {
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

          // Store real username from Firebase for Profile filter
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

  // Remove duplicates: ID-based and enhanced content-based deduplication
  // Note: Reposts are NOT filtered as duplicates - they have the same content but are separate posts with their own engagement
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const allFeedData: FeedPost[] = rawFeedData.filter(post => {
    // ID-based deduplication
    const postId = post.id.toString();
    if (seenIds.has(postId)) {
      return false;
    }
    seenIds.add(postId);

    // Skip content-based deduplication for reposts (they intentionally have same content as original)
    if (post.isRepost) {
      return true;
    }

    // Enhanced content-based deduplication that ignores source variations (only for non-reposts)
    const normalizedContent = normalizeContentForDeduplication(post.content);
    if (seenContent.has(normalizedContent)) {
      console.log(`🚫 Duplicate content filtered: "${post.content.substring(0, 100)}..."`);
      return false;
    }
    seenContent.add(normalizedContent);

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

  // Apply filter tabs to search results - using real Firebase username from state
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
    ? searchFilteredData.filter(post => 
        post.authorUsername?.toLowerCase() === currentUserUsername?.toLowerCase() || 
        post.user?.handle?.toLowerCase() === currentUserUsername?.toLowerCase())
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground">
        <FeedHeader onAllClick={handleAllClick} isRefreshing={isFetching} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} showAppBar={showAppBar} onBackClick={onBackClick} />
        <div className="max-w-3xl mx-auto px-3 py-3">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" ref={containerRef}>
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
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <LiveBanner />
        </div>
      )}
      
      {/* Main Content Area with Post Creation Panel on Right */}
      <div className="flex-1 flex gap-2 xl:gap-4 px-2 md:px-3 py-2 md:py-3 max-w-6xl mx-auto">
        {/* Social Feed Posts - Left Side */}
        <div className="flex-1 max-w-4xl">
          {/* Show Profile Header when Profile filter is selected */}
          {selectedFilter === 'Profile' && <ProfileHeader />}
          
          <div className="space-y-3 xl:space-y-6">
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
        <div className="hidden md:block w-80 xl:w-96 flex-shrink-0">
          <div className={`sticky z-30 transition-all duration-300 ${
            showAppBar ? 'top-[140px] xl:top-[200px]' : 'top-[140px] xl:top-[160px]'
          }`}>
            <PostCreationPanel />
          </div>
        </div>
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

// Wrap with AudioModeProvider for audio minicast functionality
export default function NeoFeedSocialFeed({ onBackClick }: { onBackClick?: () => void }) {
  return (
    <AudioModeProvider>
      <NeoFeedSocialFeedComponent onBackClick={onBackClick} />
    </AudioModeProvider>
  );
}