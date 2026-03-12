import { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, Plus, Search, Filter, BarChart3, 
  TrendingUp, TrendingDown, Star, Bookmark, BookmarkCheck, 
  Eye, DollarSign, Target, Shield, Zap, AlertTriangle,
  Building2, PieChart, Activity, Clock, Users, Briefcase,
  ChevronDown, ChevronUp, X, ExternalLink, Bell, Verified,
  Image as ImageIcon, MoreHorizontal, Bot
} from 'lucide-react';
import { AIChatWindow } from './ai-chat-window';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
  shares: number;
  tags: string[];
  stockMentions: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  hasImage?: boolean;
  imageUrl?: string;
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  credibility: number; // 1-5 stars
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  category: 'earnings' | 'analyst' | 'institutional' | 'regulatory' | 'market';
  viewCount: number;
  isRead: boolean;
  relatedTickers: string[];
  url: string;
  publishedAt: Date;
  bookmarked?: boolean;
}

interface OHLCData {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  high52Week: number;
  low52Week: number;
  marketCap: number;
  pe: number;
  pb: number;
  eps: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  revenueGrowth: number;
  profitGrowth: number;
  epsGrowth: number;
  beta: number;
  dividendYield: number;
  evEbitda: number;
}

function FuturisticSearchBar({ searchQuery, setSearchQuery, onSearch }: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Open AI chat when user starts typing
    if (value.trim() && !isChatOpen) {
      setChatQuery(value);
      setIsChatOpen(true);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setChatQuery(searchQuery);
      setIsChatOpen(true);
    } else {
      onSearch();
    }
  };

  return (
    <>
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-3 z-50">
        <div className="max-w-4xl mx-auto flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search or ask AI about stocks, market insights..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-16 py-2 bg-slate-800/50 border-slate-700 rounded-lg focus:border-blue-500 text-white placeholder-slate-400 text-sm"
              data-testid="input-social-search"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button
                onClick={handleSearch}
                variant="ghost"
                className="h-7 w-7 p-0 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                title="Ask AI"
                data-testid="button-search-posts"
              >
                <Bot className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-md transition-colors"
                title="Advanced filters"
                data-testid="button-filter-posts"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
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

function CreatePostCard() {
  const [content, setContent] = useState('');
  const [stockMentions, setStockMentions] = useState('');
  
  return (
    <Card className="bg-slate-800 border-slate-700 mb-6">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="w-12 h-12 border-2 border-blue-500/30">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
              ME
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="Share your market insights..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 resize-none min-h-[120px] rounded-xl"
              data-testid="textarea-create-post"
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <Button variant="ghost" className="text-slate-400 hover:text-white p-2 rounded-lg">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Button variant="ghost" className="text-slate-400 hover:text-white p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Add stock symbols (AAPL, TSLA...)"
                  value={stockMentions}
                  onChange={(e) => setStockMentions(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 w-64 rounded-lg"
                />
              </div>
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 rounded-xl font-medium"
                disabled={!content.trim()}
                data-testid="button-publish-post"
              >
                Publish
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisPanel({ symbol, isOpen, onClose }: { symbol: string; isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'ohlc' | 'news'>('ohlc');
  const [newsFilter, setNewsFilter] = useState<string>('all');

  const mockOHLCData: OHLCData = {
    symbol: symbol,
    open: 185.20,
    high: 187.95,
    low: 184.10,
    close: 186.75,
    volume: 2450000,
    change: 1.55,
    changePercent: 0.84,
    high52Week: 198.23,
    low52Week: 142.56,
    marketCap: 2940000000000,
    pe: 28.5,
    pb: 6.2,
    eps: 6.54,
    roe: 28.7,
    roa: 18.2,
    debtToEquity: 1.73,
    revenueGrowth: 12.3,
    profitGrowth: 18.7,
    epsGrowth: 15.2,
    beta: 1.21,
    dividendYield: 0.52,
    evEbitda: 24.8
  };

  const mockNewsData: NewsItem[] = [
    {
      id: '1',
      title: 'Q4 Earnings Beat Expectations with Strong Revenue Growth',
      source: 'MarketWatch',
      credibility: 5,
      sentiment: 'bullish',
      impact: 'high',
      category: 'earnings',
      viewCount: 15420,
      isRead: false,
      relatedTickers: [symbol, 'QQQ'],
      url: '#',
      publishedAt: new Date(Date.now() - 3600000),
      bookmarked: false
    },
    {
      id: '2',
      title: 'Institutional Buying Surge Detected in Large Cap Tech',
      source: 'Bloomberg',
      credibility: 5,
      sentiment: 'bullish',
      impact: 'medium',
      category: 'institutional',
      viewCount: 8930,
      isRead: true,
      relatedTickers: [symbol, 'MSFT', 'GOOGL'],
      url: '#',
      publishedAt: new Date(Date.now() - 7200000),
      bookmarked: true
    },
    {
      id: '3',
      title: 'Analyst Upgrades Price Target Following Innovation Summit',
      source: 'Seeking Alpha',
      credibility: 4,
      sentiment: 'bullish',
      impact: 'medium',
      category: 'analyst',
      viewCount: 12100,
      isRead: false,
      relatedTickers: [symbol],
      url: '#',
      publishedAt: new Date(Date.now() - 10800000),
      bookmarked: false
    }
  ];

  if (!isOpen) return null;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-green-400 bg-green-500/10';
    }
  };

  return (
    <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex gap-4">
          <Button
            variant={activeTab === 'ohlc' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('ohlc')}
            className="text-white px-4 py-2 rounded-lg"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analysis
          </Button>
          <Button
            variant={activeTab === 'news' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('news')}
            className="text-white px-4 py-2 rounded-lg"
          >
            <Bell className="h-4 w-4 mr-2" />
            News
          </Button>
        </div>
        <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white p-2">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6">
        {activeTab === 'ohlc' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Price Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                Price Data
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Open</span>
                  <span className="text-white font-mono">${mockOHLCData.open}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">High</span>
                  <span className="text-green-400 font-mono">${mockOHLCData.high}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Low</span>
                  <span className="text-red-400 font-mono">${mockOHLCData.low}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Close</span>
                  <span className="text-white font-mono font-bold">${mockOHLCData.close}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Change</span>
                  <span className="text-green-400 font-mono">+{mockOHLCData.changePercent}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Volume</span>
                  <span className="text-white font-mono">{(mockOHLCData.volume / 1000000).toFixed(2)}M</span>
                </div>
              </div>
            </div>

            {/* Valuation Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                Valuation
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">P/E Ratio</span>
                  <span className="text-white font-mono">{mockOHLCData.pe}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">P/B Ratio</span>
                  <span className="text-white font-mono">{mockOHLCData.pb}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Market Cap</span>
                  <span className="text-white font-mono">${(mockOHLCData.marketCap / 1000000000).toFixed(2)}B</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">EV/EBITDA</span>
                  <span className="text-white font-mono">{mockOHLCData.evEbitda}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Dividend Yield</span>
                  <span className="text-white font-mono">{mockOHLCData.dividendYield}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Beta</span>
                  <span className="text-white font-mono">{mockOHLCData.beta}</span>
                </div>
              </div>
            </div>

            {/* Financial Health */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Financial Health
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">EPS</span>
                  <span className="text-white font-mono">${mockOHLCData.eps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ROE</span>
                  <span className="text-green-400 font-mono">{mockOHLCData.roe}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ROA</span>
                  <span className="text-green-400 font-mono">{mockOHLCData.roa}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Debt/Equity</span>
                  <span className="text-white font-mono">{mockOHLCData.debtToEquity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Revenue Growth</span>
                  <span className="text-green-400 font-mono">+{mockOHLCData.revenueGrowth}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">EPS Growth</span>
                  <span className="text-green-400 font-mono">+{mockOHLCData.epsGrowth}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* News Filters */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'earnings', 'analyst', 'institutional', 'regulatory', 'market'].map((filter) => (
                <Button
                  key={filter}
                  variant={newsFilter === filter ? 'default' : 'ghost'}
                  onClick={() => setNewsFilter(filter)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    newsFilter === filter 
                      ? 'bg-blue-500 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </Button>
              ))}
            </div>

            {/* News Items */}
            <div className="space-y-4">
              {mockNewsData.map((news) => (
                <div
                  key={news.id}
                  className={`p-4 rounded-xl border transition-all duration-200 hover:border-slate-600 ${
                    news.isRead ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-700/30 border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`px-2 py-1 text-xs ${getImpactColor(news.impact)}`}>
                          {news.impact.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(news.sentiment)}
                          <span className="text-xs text-slate-400 capitalize">{news.sentiment}</span>
                        </div>
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                          {news.category}
                        </Badge>
                      </div>
                      <h4 className="text-white font-medium mb-2 leading-tight">
                        {news.title}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{news.source}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < news.credibility ? 'text-yellow-400 fill-current' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{news.viewCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{Math.floor((Date.now() - news.publishedAt.getTime()) / 3600000)}h ago</span>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {news.relatedTickers.map((ticker) => (
                          <Badge key={ticker} variant="secondary" className="text-xs bg-blue-500/10 text-blue-400">
                            ${ticker}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                        {news.bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FuturisticPostCard({ post }: { post: SocialPost }) {
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isReposted, setIsReposted] = useState(post.reposted || false);
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked || false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [repostCount, setRepostCount] = useState(post.reposts);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleRepost = () => {
    setIsReposted(!isReposted);
    setRepostCount(prev => isReposted ? prev - 1 : prev + 1);
  };

  const handleAnalysis = () => {
    setShowAnalysis(!showAnalysis);
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
      case 'bullish': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'bearish': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 mb-6 hover:border-slate-600 transition-all duration-200">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12 border-2 border-slate-600">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                {post.author.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold">{post.author.displayName}</h3>
                {post.author.verified && (
                  <Verified className="h-4 w-4 text-blue-400 fill-current" />
                )}
                <span className="text-slate-400 text-sm">@{post.author.username}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 text-sm">{formatTimeAgo(post.timestamp)}</span>
              </div>
            </div>
            <Button variant="ghost" className="text-slate-400 hover:text-white p-2">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-6 pb-4">
          <p className="text-white leading-relaxed mb-4">{post.content}</p>
          
          {/* Stock Mentions & Sentiment */}
          {(post.stockMentions.length > 0 || post.sentiment) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.stockMentions.map((stock) => (
                <Badge
                  key={stock}
                  className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 font-mono"
                >
                  ${stock}
                </Badge>
              ))}
              {post.sentiment && (
                <Badge
                  className={`px-3 py-1 border font-medium ${getSentimentColor(post.sentiment)}`}
                >
                  {post.sentiment === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {post.sentiment === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                  {post.sentiment === 'neutral' && <Activity className="h-3 w-3 mr-1" />}
                  {post.sentiment.toUpperCase()}
                </Badge>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="text-blue-400 text-sm hover:text-blue-300 cursor-pointer">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post Image */}
          {post.hasImage && post.imageUrl && (
            <div className="mb-4 rounded-xl overflow-hidden border border-slate-700">
              <img
                src={post.imageUrl}
                alt="Post image"
                className="w-full h-64 object-cover"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <Button
                variant="ghost"
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isLiked
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                }`}
                data-testid="button-like-post"
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
                data-testid="button-comment-post"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{post.comments}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={handleRepost}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isReposted
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                }`}
                data-testid="button-repost-post"
              >
                <Share2 className="h-5 w-5" />
                <span className="font-medium">{repostCount}</span>
              </Button>

              {post.stockMentions.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={handleAnalysis}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    showAnalysis
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/10'
                  }`}
                  data-testid="button-analysis-post"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">Analysis</span>
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isBookmarked
                  ? 'text-yellow-400 bg-yellow-500/10'
                  : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10'
              }`}
              data-testid="button-bookmark-post"
            >
              {isBookmarked ? <BookmarkCheck className="h-5 w-5 fill-current" /> : <Bookmark className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Analysis Panel */}
        {showAnalysis && post.stockMentions.length > 0 && (
          <div className="px-6 pb-6">
            <AnalysisPanel
              symbol={post.stockMentions[0]}
              isOpen={showAnalysis}
              onClose={() => setShowAnalysis(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FuturisticSocialFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Auto-post news mutation
  const autoPostNewsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/gemini/auto-post-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to auto-post news');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "News Posted Successfully!",
        description: `Created ${data.postsCreated} new posts with latest financial news${data.posts.some((p: any) => p.symbolCount > 0) ? ' including NSE symbols' : ''}`,
      });
      
      // Refresh social posts to show new news posts
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Auto-Post Failed",
        description: error.message || "Failed to fetch and post latest news",
        variant: "destructive",
      });
    },
  });

  const handleAutoPostNews = () => {
    autoPostNewsMutation.mutate();
  };
  
  const mockPosts: SocialPost[] = [
    {
      id: '1',
      author: {
        username: 'cryptoquant_alex',
        displayName: 'Alex Chen',
        avatar: '',
        verified: true,
        followers: 0
      },
      content: 'Just analyzed the latest earnings report for AAPL. The fundamentals look incredibly strong with a 15% YoY revenue growth. Technical indicators showing bullish momentum. This could be a great entry point for long-term positions. 📈',
      timestamp: new Date(Date.now() - 3600000),
      likes: 234,
      comments: 45,
      reposts: 89,
      shares: 23,
      tags: ['earnings', 'technicalanalysis', 'longterm'],
      stockMentions: ['AAPL'],
      sentiment: 'bullish',
      hasImage: false,
      liked: false,
      reposted: false,
      bookmarked: false
    },
    {
      id: '2',
      author: {
        username: 'market_guru',
        displayName: 'Sarah Martinez',
        avatar: '',
        verified: true,
        followers: 0
      },
      content: 'Market volatility is creating amazing opportunities in the tech sector. Keep an eye on TSLA and NVDA - both showing strong support levels. Risk management is key in this environment. 🚀',
      timestamp: new Date(Date.now() - 7200000),
      likes: 456,
      comments: 78,
      reposts: 123,
      shares: 34,
      tags: ['volatility', 'tech', 'opportunities'],
      stockMentions: ['TSLA', 'NVDA'],
      sentiment: 'bullish',
      hasImage: true,
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
      liked: true,
      reposted: false,
      bookmarked: true
    }
  ];

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <FuturisticSearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
      />
      
      <div className="max-w-4xl mx-auto p-6">
        <CreatePostCard />
        
        {/* Auto-Post News Button */}
        <div className="mb-6">
          <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Latest Financial News</h3>
                    <p className="text-slate-400 text-sm">Auto-post latest news with NSE symbols</p>
                  </div>
                </div>
                <Button 
                  onClick={handleAutoPostNews}
                  disabled={autoPostNewsMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-4 py-2"
                  data-testid="button-auto-post-news"
                >
                  {autoPostNewsMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Posting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Post News
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-0">
          {mockPosts.map((post) => (
            <FuturisticPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}