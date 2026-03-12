import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Heart, 
  MessageCircle, 
  Repeat, 
  Share, 
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Verified,
  Image as ImageIcon,
  PlusCircle,
  Filter,
  Globe,
  Home,
  Plus,
  Newspaper,
  Radio
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SwipeableCarousel } from './swipeable-carousel';
import { UserIdSetupDialog } from './user-id-setup-dialog';
import { getCognitoToken, getCognitoUser } from '@/cognito';
import { useAudioMode } from '@/contexts/AudioModeContext';
import { AudioMinicastCard } from './audio-minicast-card';

interface SocialPost {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified?: boolean;
    followers?: number;
  };
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  reposts: number;
  tags: string[];
  stockMentions: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  hasImage?: boolean;
  imageUrl?: string;
  liked?: boolean;
  reposted?: boolean;
  isAudioPost?: boolean;
  selectedPostIds?: number[];
  metadata?: any;
}

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
}

function SearchBar({ searchQuery, setSearchQuery, onSearch, onPostDailyNews, isPostingNews }: SearchBarProps & { onPostDailyNews: () => void; isPostingNews: boolean }) {
  return (
    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
      <div className="max-w-2xl mx-auto flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search stocks, users, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-full focus:border-blue-500 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-800"
            data-testid="input-social-search"
          />
        </div>
        <Button
          onClick={onSearch}
          className="rounded-full px-6 bg-blue-500 hover:bg-blue-600 text-white"
          data-testid="button-search-posts"
        >
          Search
        </Button>
        <Button
          onClick={onPostDailyNews}
          disabled={isPostingNews}
          className="rounded-full p-2 bg-orange-500 hover:bg-orange-600 text-white"
          title="Post latest stock news"
          data-testid="button-post-daily-news"
        >
          {isPostingNews ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Newspaper className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          className="rounded-full p-2"
          title="Filter posts"
          data-testid="button-filter-posts"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isReposted, setIsReposted] = useState(post.reposted || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [repostCount, setRepostCount] = useState(post.reposts);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();
  const { isAudioMode, selectedPosts, togglePostSelection } = useAudioMode();
  const isSelected = selectedPosts.includes(parseInt(post.id));

  const handleLike = async () => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/social-posts/${post.id}/like`, { 
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        setIsLiked(!isLiked);
        setLikeCount(data.likes);
        toast({
          title: isLiked ? "Unliked!" : "Liked!",
          description: `Post ${isLiked ? 'removed from' : 'added to'} your likes.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const handleRepost = async () => {
    try {
      const method = isReposted ? 'DELETE' : 'POST';
      const response = await fetch(`/api/social-posts/${post.id}/repost`, { 
        method,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        setIsReposted(!isReposted);
        setRepostCount(data.reposts);
        toast({
          title: isReposted ? "Unreposted!" : "Reposted!",
          description: `Post ${isReposted ? 'removed from' : 'shared to'} your timeline.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update repost status",
        variant: "destructive",
      });
    }
  };

  const handleComment = () => {
    setShowCommentInput(!showCommentInput);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/social-posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText })
      });
      const data = await response.json();
      
      if (data.success) {
        setCommentCount(data.comments);
        setCommentText('');
        setShowCommentInput(false);
        toast({
          title: "Comment Added!",
          description: "Your opinion has been shared successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4" />;
      case 'bearish': return <TrendingDown className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const handleCardClick = () => {
    if (isAudioMode && !post.isAudioPost) {
      togglePostSelection(parseInt(post.id));
    }
  };

  // If this is an audio minicast post, render the special card
  if (post.isAudioPost) {
    return (
      <AudioMinicastCard
        content={post.content}
        author={{
          displayName: post.author.displayName,
          username: post.author.username
        }}
        selectedPostIds={post.selectedPostIds}
        timestamp={post.timestamp}
        likes={likeCount}
        comments={commentCount}
        isLiked={isLiked}
      />
    );
  }

  return (
    <Card 
      className={`border-0 border-b border-gray-200 dark:border-gray-700 rounded-none transition-all relative ${
        isAudioMode 
          ? isSelected
            ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-l-purple-500 cursor-pointer' 
            : 'hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer hover:border-l-4 hover:border-l-purple-300' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
      }`}
      onClick={handleCardClick}
      data-testid={`post-card-${post.id}`}
    >
      {isSelected && isAudioMode && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-2 z-10 animate-bounce">
          <Radio className="h-4 w-4" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
              post.author.username === 'Daily_News_Profile' 
                ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                : 'bg-gradient-to-br from-blue-400 to-purple-500'
            }`}>
              {post.author.username === 'Daily_News_Profile' ? (
                <Newspaper className="h-6 w-6" />
              ) : (
                post.author.displayName.charAt(0)
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <span className={`font-semibold ${post.author.username === 'Daily_News_Profile' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                  {post.author.username === 'Daily_News_Profile' ? 'Daily News' : post.author.displayName}
                </span>
                {post.author.username === 'Daily_News_Profile' ? (
                  <Newspaper className="h-4 w-4 text-orange-500" />
                ) : post.author.verified ? (
                  <Verified className="h-4 w-4 text-blue-500" />
                ) : null}
              </div>
              <span className={`text-gray-500 dark:text-gray-400 ${post.author.username === 'Daily_News_Profile' ? 'text-xs' : ''}`}>
                @{post.author.username === 'Daily_News_Profile' ? 'daily_news' : post.author.username}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {formatTimeAgo(post.timestamp)}
              </span>
              {post.author.username === 'Daily_News_Profile' && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20 text-xs">
                  Latest News
                </Badge>
              )}
              <div className="ml-auto">
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
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
                                            <linearGradient id={`pnlGradient-feed-${post.id}`} x1="0" y1="0" x2="0" y2="1">
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
            {/* Post Content */}
            <div className="mb-3">
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
                                <linearGradient id={`pnlGradient-feed-${post.id}`} x1="0" y1="0" x2="0" y2="1">
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
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Stock Mentions & Sentiment */}
            {(post.stockMentions.length > 0 || post.sentiment) && (
              <div className="flex items-center gap-2 mb-3">
                {post.stockMentions.map((stock) => (
                  <Badge
                    key={stock}
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                    data-testid={`badge-stock-${stock}`}
                  >
                    ${stock}
                  </Badge>
                ))}
                {post.sentiment && (
                  <div className={`flex items-center gap-1 text-sm ${getSentimentColor(post.sentiment)}`}>
                    {getSentimentIcon(post.sentiment)}
                    <span className="capitalize">{post.sentiment}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-blue-500 hover:underline cursor-pointer text-sm"
                    data-testid={`tag-${tag}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Multiple Images Carousel - Compatible with both old and new schema */}
            {(post.hasImage && post.imageUrl) && (
              <div className="mb-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
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
                  
                  if (images.length === 1) {
                    return (
                      <img 
                        src={images[0]} 
                        alt="Post image" 
                        className="w-full h-48 object-cover"
                      />
                    );
                  } else if (images.length > 1) {
                    return <SwipeableCarousel images={images} />;
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Engagement Actions */}
            <div className="flex items-center justify-between max-w-md mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleComment}
                className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full"
                data-testid={`button-comment-${post.id}`}
              >
                <MessageCircle className="h-5 w-5 mr-1" />
                <span className="text-sm">{commentCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRepost}
                className={`p-2 rounded-full ${
                  isReposted
                    ? 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
                data-testid={`button-repost-${post.id}`}
              >
                <Repeat className="h-5 w-5 mr-1" />
                <span className="text-sm">{repostCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`p-2 rounded-full ${
                  isLiked
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
                data-testid={`button-like-${post.id}`}
              >
                <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full"
                data-testid={`button-share-${post.id}`}
              >
                <Share className="h-5 w-5" />
              </Button>
            </div>

            {/* Comment Input Section */}
            {showCommentInput && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      U
                    </div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your opinion on this post..."
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      rows={3}
                      maxLength={280}
                      data-testid={`textarea-comment-${post.id}`}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500">
                        {commentText.length}/280
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCommentInput(false)}
                          data-testid={`button-cancel-comment-${post.id}`}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={submitComment}
                          disabled={!commentText.trim() || isSubmittingComment}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          data-testid={`button-submit-comment-${post.id}`}
                        >
                          {isSubmittingComment ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            'Comment'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has profile (username) when component mounts
  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        const idToken = await getCognitoToken();
        if (!idToken) {
          console.log('No user logged in');
          return;
        }

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('📋 Profile check on social feed:', {
            hasProfile: !!profileData.profile,
            hasUsername: !!profileData.profile?.username
          });

          // Show dialog only if user doesn't have a username
          if (!profileData.profile || !profileData.profile.username) {
            console.log('❌ No username found, showing profile dialog');
            setShowProfileDialog(true);
          } else {
            console.log('✅ Profile complete, user can use social feed');
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };

    checkUserProfile();
  }, []);

  // Fast social posts with caching
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => fetch('/api/social-posts').then(res => res.json()),
    staleTime: 30000, // Keep data fresh for 30 seconds
    refetchInterval: 60000, // Auto-refresh every minute
    refetchOnWindowFocus: false // Don't refetch on window focus for better performance
  });

  // Daily news posting mutation
  const dailyNewsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auto-post-daily-news', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "📰 Daily News Posted!",
        description: `Successfully posted ${data.postsCreated} news articles to the social feed.`,
      });
      // Refresh the social feed to show new posts
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: "Failed to post daily news. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Transform API data to match component interface
  const transformedPosts = posts.map((post: any) => ({
    id: post.id.toString(),
    author: {
      username: post.authorUsername || 'unknown',
      displayName: post.authorDisplayName || post.authorUsername || 'Unknown User',
      verified: Math.random() > 0.7, // Random verification for demo
      followers: 0
    },
    content: post.content || '',
    timestamp: new Date(post.createdAt || Date.now()),
    likes: post.likes || Math.floor(Math.random() * 200) + 10,
    comments: post.comments || Math.floor(Math.random() * 50) + 1,
    reposts: post.reposts || Math.floor(Math.random() * 100) + 5,
    tags: post.content ? post.content.split(' ').filter((word: string) => word.startsWith('#')).map((tag: string) => tag.slice(1)) : [],
    stockMentions: post.stockMentions || (post.ticker ? [post.ticker.replace('$', '')] : []),
    sentiment: post.sentiment || (post.ticker ? (Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral') : 'neutral'),
    hasImage: post.hasImage || false,
    imageUrl: post.imageUrl || undefined,
    metadata: post.metadata,
    liked: false,
    reposted: false,
    isAudioPost: post.isAudioPost || false,
    selectedPostIds: post.selectedPostIds || []
  }));

  // Enhanced duplicate removal with Set-based filtering (same as neofeed)
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const uniquePosts = transformedPosts.filter(post => {
    // ID-based deduplication
    if (seenIds.has(post.id)) {
      return false;
    }
    seenIds.add(post.id);

    // Content-based deduplication (trim and lowercase for comparison)
    const normalizedContent = post.content.trim().toLowerCase();
    if (seenContent.has(normalizedContent)) {
      return false;
    }
    seenContent.add(normalizedContent);

    return true;
  });

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
    // Filter posts based on search query
    // This could be connected to a real API later
  };

  const scrollToBottom = () => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Search Bar */}
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        onPostDailyNews={() => dailyNewsMutation.mutate()}
        isPostingNews={dailyNewsMutation.isPending}
      />

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Create Post Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                U
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-3">
                  <Input
                    placeholder="What's happening in the market?"
                    className="border-0 bg-transparent text-lg placeholder:text-gray-500 focus-visible:ring-0"
                    data-testid="input-create-post"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-blue-500">
                      <ImageIcon className="h-5 w-5 mr-1" />
                      Media
                    </Button>
                    <Button variant="ghost" size="sm" className="text-blue-500">
                      <BarChart3 className="h-5 w-5 mr-1" />
                      Chart
                    </Button>
                  </div>
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6"
                    data-testid="button-create-post"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading social feed...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-500">Error loading posts. Please try again.</p>
              </div>
            ) : uniquePosts.length > 0 ? (
              uniquePosts.map((post: SocialPost) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No posts available</p>
              </div>
            )}
          </div>

          {/* Load More */}
          <div className="p-6 text-center border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              className="rounded-full px-8"
              data-testid="button-load-more"
            >
              Load More Posts
            </Button>
          </div>
        </div>
        <div ref={feedEndRef} />
      </div>

      {/* Floating Bottom Navigation - Neo Feed Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          <button
            onClick={scrollToBottom}
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            data-testid="button-nav-home"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors text-blue-600 dark:text-blue-400"
            data-testid="button-nav-post"
          >
            <div className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <Plus className="h-7 w-7 text-white stroke-[2.5]" />
            </div>
          </button>
          
          <button
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            data-testid="button-nav-message"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium">Messages</span>
          </button>
        </div>
      </div>

      {/* Profile Setup Dialog - Only shows if user doesn't have username */}
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
        }}
      />
    </div>
  );
}