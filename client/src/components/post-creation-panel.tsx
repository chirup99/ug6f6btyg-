import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { X, Upload, Hash, ImageIcon, TrendingUp, TrendingDown, Minus, Sparkles, Zap, Eye, Copy, Clipboard, Clock, Activity, MessageCircle, Users, UserPlus, ExternalLink, Radio, Check, Plus, Search, Layers } from 'lucide-react';
import { MultipleImageUpload } from './multiple-image-upload';
import { StackedSwipeableCards } from './stacked-swipeable-cards';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { InsertSocialPost } from '@shared/schema';
import { useAudioMode } from '@/contexts/AudioModeContext';

const STOCK_LIST = [
  'NIFTY', 'BANKNIFTY', 'SENSEX', 'CRUDEOIL', 'GOLD', 'SILVER',
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT',
  'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL',
  'BHARTIARTL', 'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB',
  'DRREDDY', 'EICHERMOT', 'GRASIM', 'HCLTECH',
  'HDFCBANK', 'HDFCLIFE', 'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR',
  'ICICIBANK', 'ITC', 'INDUSINDBK', 'INFY', 'JSWSTEEL',
  'KOTAKBANK', 'LT', 'LTIM', 'M&M',
  'MARUTI', 'NESTLEIND', 'NTPC', 'ONGC', 'POWERGRID',
  'RELIANCE', 'SBILIFE', 'SBIN', 'SUNPHARMA',
  'TCS', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL',
  'TECHM', 'TITAN', 'ULTRACEMCO', 'UPL', 'WIPRO',
  'AUBANK', 'BANDHANBNK', 'BANKBARODA', 'CANBK',
  'FEDERALBNK', 'IDFCFIRSTB', 'ACC', 'ADANIGREEN', 'ATGL',
  'AMBUJACEM', 'ABB', 'DMART', 'HAVELLS',
  'BERGEPAINT', 'BEL', 'BIOCON', 'BOSCHLTD',
  'CHOLAFIN', 'COLPAL', 'DLF', 'DABUR',
  'NYKAA', 'GAIL', 'GLAND', 'GODREJCP',
  'HDFCAMC', 'HAL', 'ICICIGI',
  'ICICIPRULI', 'INDHOTEL', 'IOC', 'IRCTC',
  'INDUSTOWER', 'NAUKRI', 'INDIGO', 'LICI',
  'MARICO', 'MPHASIS', 'MUTHOOTFIN', 'PAYTM',
  'PIIND', 'PIDILITIND', 'PGHH', 'SBICARD', 'SRF',
  'MOTHERSON', 'SHREECEM', 'SIEMENS', 'TATAPOWER',
  'TORNTPHARM', 'MCDOWELL-N', 'VEDL', 'ZOMATO',
];

const SENTIMENTS = [
  { value: 'bullish', label: 'Bullish', icon: TrendingUp, color: 'text-green-600' },
  { value: 'bearish', label: 'Bearish', icon: TrendingDown, color: 'text-red-600' },
  { value: 'neutral', label: 'Neutral', icon: Minus, color: 'text-gray-600' }
];

// Export post selection context for use in feed
export const PostSelectionContext = {
  selectedPosts: [] as number[],
  togglePostSelection: (_postId: number) => {},
  isAudioMode: false
};

interface PostCreationPanelProps {
  hideAudioMode?: boolean;
  initialViewMode?: 'post' | 'message' | 'audio';
  onMinimize?: () => void;
}

export function PostCreationPanel({ hideAudioMode = false, initialViewMode = 'post', onMinimize }: PostCreationPanelProps = {}) {
  const [content, setContent] = useState('');
  const [stockMentions, setStockMentions] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<string>('neutral');
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string; url: string; name: string; file?: File}>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Stock mention search state
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const stockSearchRef = useRef<HTMLDivElement>(null);

  // @user mention state
  const [userMentionQuery, setUserMentionQuery] = useState<string | null>(null);
  const [userMentionResults, setUserMentionResults] = useState<{ username: string; displayName: string; avatar: string | null }[]>([]);
  const [userMentionLoading, setUserMentionLoading] = useState(false);
  
  // New state for view switching
  const [viewMode, setViewMode] = useState<'post' | 'message' | 'audio'>(initialViewMode);
  const [messageTab, setMessageTab] = useState<'message' | 'community'>('message');
  
  // Audio minicast state from context
  const { isAudioMode, setIsAudioMode, selectedTextSnippets, addTextSnippet, removeTextSnippet, clearSelection } = useAudioMode();
  
  // Sync viewMode with context audio mode
  useEffect(() => {
    setIsAudioMode(viewMode === 'audio');
  }, [viewMode, setIsAudioMode]);
  
  // Filtered stock list based on search query
  const filteredStocks = STOCK_LIST.filter(stock =>
    stock.toLowerCase().includes(stockSearchQuery.toLowerCase()) &&
    !stockMentions.includes(stock)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stockSearchRef.current && !stockSearchRef.current.contains(event.target as Node)) {
        setShowStockDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add stock mention from dropdown
  const addStockMention = (stock: string) => {
    if (!stockMentions.includes(stock)) {
      setStockMentions(prev => [...prev, stock]);
    }
    setStockSearchQuery('');
    setShowStockDropdown(false);
  };
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();


  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertSocialPost) => {
      const { getCognitoUser } = await import('@/cognito');
      const user = await getCognitoUser();
      
      if (!user?.userId) {
        throw new Error('Please log in first');
      }
      
      const response = await fetch('/api/social-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...postData,
          userId: user.userId
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to create post');
      }
      
      return response.json();
    },
    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: ['/api/social-posts'] });
      const previousPosts = queryClient.getQueryData(['/api/social-posts']);

      queryClient.setQueryData(['/api/social-posts'], (old: any) => {
        const optimisticPost = {
          id: Date.now(),
          ...newPost,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likes: 0,
          comments: 0,
          reposts: 0,
          // Ensure multiple images are handled correctly in the optimistic update
          imageUrl: newPost.imageUrl
        };
        
        if (Array.isArray(old)) {
          return [optimisticPost, ...old];
        }
        return [optimisticPost];
      });

      return { previousPosts };
    },
    onError: (err: any, newPost, context) => {
      queryClient.setQueryData(['/api/social-posts'], context?.previousPosts);
      toast({ 
        description: err.message || "Failed to create post", 
        variant: "destructive" 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      resetForm();
      toast({ description: "Post created successfully!" });
    }
  });

  const resetForm = () => {
    setContent('');
    setStockMentions([]);
    setSentiment('neutral');
    setUploadedImages([]);
    clearSelection();
  };

  const addTextCardSnippet = () => {
    if (content.trim() && selectedTextSnippets.length < 3) {
      const username = currentUser.username || currentUser.email?.split('@')[0] || 'anonymous';
      const displayName = currentUser.displayName || username;
      
      addTextSnippet({
        postId: Date.now(),
        text: content.trim(),
        authorUsername: username,
        authorDisplayName: displayName
      });
      
      setContent('');
      toast({ description: `Card ${selectedTextSnippets.length + 1}/3 added!` });
    }
  };

  const detectStockMentions = useCallback((text: string) => {
    const words = text.toUpperCase().split(/\s+/);
    const mentions = words.filter(word => {
      const cleanWord = word.replace(/[^\w&-]/g, '');
      return STOCK_LIST.includes(cleanWord) && !stockMentions.includes(cleanWord);
    });
    return mentions;
  }, [stockMentions]);

  // Fetch @user mention suggestions
  useEffect(() => {
    if (userMentionQuery === null || userMentionQuery.length === 0) { setUserMentionResults([]); return; }
    const t = setTimeout(async () => {
      setUserMentionLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userMentionQuery)}&limit=6`);
        if (res.ok) { const d = await res.json(); setUserMentionResults(d.users || d || []); }
      } catch { setUserMentionResults([]); }
      finally { setUserMentionLoading(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [userMentionQuery]);

  const insertUserMention = (username: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart ?? content.length;
    const before = content.slice(0, cursor).replace(/@\w*$/, `@${username} `);
    const after = content.slice(cursor);
    const newVal = before + after;
    setContent(newVal);
    setUserMentionQuery(null);
    setUserMentionResults([]);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(before.length, before.length); }, 0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Detect @user mention at cursor
    const cursor = e.target.selectionStart ?? newContent.length;
    const textUpToCursor = newContent.slice(0, cursor);
    const mentionMatch = textUpToCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setUserMentionQuery(mentionMatch[1]);
    } else {
      setUserMentionQuery(null);
      setUserMentionResults([]);
    }

    const newMentions = detectStockMentions(newContent);
    if (newMentions.length > 0) {
      setStockMentions(prev => [...prev, ...newMentions]);
    }
  };


  const removeStockMention = (stock: string) => {
    setStockMentions(stockMentions.filter(s => s !== stock));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For audio posts, allow submission if either content OR selected posts exist
    if (viewMode === 'audio') {
      if (!content.trim() && selectedTextSnippets.length === 0) {
        toast({ 
          description: "Please add text or select posts for your audio minicast.", 
          variant: "destructive" 
        });
        return;
      }
    } else {
      // For regular posts, require content
      if (!content.trim()) {
        toast({ 
          description: "Please enter some content for your post.", 
          variant: "destructive" 
        });
        return;
      }
    }

    // Use the saved username and displayName from the user's profile
    const username = currentUser.username || currentUser.email?.split('@')[0] || 'anonymous';
    const displayName = currentUser.displayName || currentUser.username || currentUser.email?.split('@')[0] || 'Anonymous User';
    
    const postData: InsertSocialPost = {
      content: content.trim() || (viewMode === 'audio' && selectedTextSnippets.length > 0 ? 
        `Audio MiniCast with ${selectedTextSnippets.length} selected post${selectedTextSnippets.length > 1 ? 's' : ''}` : ''),
      authorUsername: username,
      authorDisplayName: displayName,
      stockMentions: viewMode === 'audio' ? [] : stockMentions,
      sentiment: viewMode === 'audio' ? undefined : (sentiment as 'bullish' | 'bearish' | 'neutral'),
      tags: [],
      hasImage: uploadedImages.length > 0,
      imageUrl: uploadedImages.length > 1 ? 
        JSON.stringify(uploadedImages.map(img => img.url)) : 
        (uploadedImages.length === 1 ? uploadedImages[0].url : undefined),
      isAudioPost: viewMode === 'audio',
      selectedPostIds: viewMode === 'audio' ? 
        selectedTextSnippets
          .map(s => String(s.postId))
          .filter(id => id && id !== 'undefined' && id !== 'null' && id.length > 0)
        : undefined,
      selectedPosts: viewMode === 'audio' ?
        selectedTextSnippets
          .filter(s => s.postId && s.text)
          .map(s => ({
            id: String(s.postId),
            content: s.text
          }))
        : undefined
    };

    createPostMutation.mutate(postData);
  };

  // Mock profiles data
  const mockProfiles = [
    {
      id: 1,
      name: 'Ravi',
      handle: '@ravi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      isOwn: true,
      status: 'online',
      bgColor: 'bg-gray-500'
    },
    {
      id: 2,
      name: 'Vaib',
      handle: '@vaib',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
      following: false,
      status: 'online',
      bgColor: 'bg-pink-400'
    },
    {
      id: 3,
      name: 'Kids',
      handle: '@kids',
      avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&h=150&fit=crop',
      following: false,
      status: 'offline',
      bgColor: 'bg-amber-700'
    },
    {
      id: 4,
      name: 'Add',
      handle: '',
      avatar: null,
      isAdd: true,
      status: 'none',
      bgColor: 'bg-gray-800'
    }
  ];

  const [activeProfileId, setActiveProfileId] = useState<number>(1);

  return (
    <Card className="w-full bg-white dark:bg-gray-900 border border-border shadow-none rounded-xl transition-none">
      <CardHeader className="border-b border-border pb-3 pt-4 px-4 transition-none">
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted transition-none">
              {viewMode === 'post' ? (
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              ) : viewMode === 'audio' ? (
                <Radio className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              ) : (
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-base font-semibold tracking-tight">
              {viewMode === 'audio' && isAudioMode ? 'Audio MiniCast' : viewMode === 'post' ? 'Create Post' : 'Messages'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Audio Toggle Switch - Desktop only */}
            {!hideAudioMode && (
              <div className="hidden md:flex items-center gap-2">
                <Radio className={`h-4 w-4 ${
                  viewMode === 'audio'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
                <Switch
                  checked={viewMode === 'audio'}
                  onCheckedChange={(checked) => {
                    setViewMode(checked ? 'audio' : 'post');
                  }}
                  className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  data-testid="switch-toggle-audio"
                />
              </div>
            )}
            {/* Audio Icon - Mobile only */}
            {!hideAudioMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'audio' ? 'post' : 'audio')}
                className={`md:hidden p-2 h-8 w-8 rounded-full ${
                  viewMode === 'audio'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                data-testid="button-toggle-audio"
              >
                <Radio className={`h-4 w-4 ${
                  viewMode === 'audio'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </Button>
            )}
            {/* X Close button — shown when dialog can be closed (mobile) */}
            {onMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAudioMode(false);
                  onMinimize();
                }}
                className="p-2 h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                data-testid="button-close-dialog"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 max-h-[calc(100vh-220px)] overflow-y-auto thin-scrollbar">
        {viewMode === 'audio' ? (
          /* Audio MiniCast Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Content Input with + Button */}
            <div className="space-y-2">
              <Label htmlFor="audio-content" className="text-sm font-medium text-foreground">What's on your mind?</Label>
              <div className="relative">
                <Textarea
                  id="audio-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (content.trim() && selectedTextSnippets.length < 3) {
                        addTextCardSnippet();
                      }
                    }
                  }}
                  placeholder="Your thoughts will be converted to audio... (Press Enter to add card, Shift+Enter for new line)"
                  maxLength={500}
                  className="min-h-[100px] resize-none bg-gray-50 dark:bg-gray-800 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary pr-12"
                  data-testid="textarea-audio-content"
                />
                {/* + Button in bottom right corner */}
                {content.trim() && selectedTextSnippets.length < 3 && (
                  <Button
                    type="button"
                    size="icon"
                    onClick={addTextCardSnippet}
                    className="absolute bottom-2 right-2 h-8 w-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md"
                    data-testid="button-add-text-card"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
                {content.length}/500 characters
              </div>
            </div>

            {/* Selected Posts Display - Shows both text cards AND selected posts from feed */}
            {selectedTextSnippets.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-center text-sm font-medium text-foreground">
                  Selected Posts ({selectedTextSnippets.length}/3)
                </Label>
                <StackedSwipeableCards 
                  snippets={selectedTextSnippets}
                  onRemove={(id) => removeTextSnippet(id)}
                />
              </div>
            ) : (
              /* Post Selection Instructions - Only show when no posts selected */
              <div 
                className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors relative"
                onClick={onMinimize}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                    Select Posts for Audio MiniCast
                  </h3>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Click on any post below to add it to your audio minicast (up to 3 posts). 
                  Your selected posts will be combined with your thoughts into an audio experience.
                </p>
                {/* Cards Icon with Hand Click Indicator - Bottom Right */}
                <div className="absolute bottom-2 right-2 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="relative w-6 h-6">
                    <Layers className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-600 dark:bg-purple-300 rounded-full flex items-center justify-center">
                      <svg className="w-1.5 h-1.5 text-white dark:text-purple-900" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 6a2 2 0 11-4 0 2 2 0 014 0zM2 9a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={(!content.trim() && selectedTextSnippets.length === 0) || createPostMutation.isPending}
                className="min-w-[100px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                data-testid="button-publish-audio"
              >
                {createPostMutation.isPending ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4 mr-2" />
                    Publish Audio
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : viewMode === 'post' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-foreground">What's on your mind?</Label>
            <div className="relative">
              {/* @user mention dropdown */}
              {(userMentionResults.length > 0 || userMentionLoading) && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  {userMentionLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      Searching…
                    </div>
                  ) : userMentionResults.map((u) => (
                    <button
                      key={u.username}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); insertUserMention(u.username); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      data-testid={`mention-option-${u.username}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-gray-500 uppercase">{(u.displayName || u.username)[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{u.displayName || u.username}</p>
                        <p className="text-[10px] text-gray-400 truncate">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                id="content"
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setUserMentionQuery(null); setUserMentionResults([]); }
                }}
                placeholder="Share your trading insights… type @ to tag someone"
                maxLength={500}
                className="min-h-[100px] resize-none bg-gray-50 dark:bg-gray-800 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                data-testid="textarea-post-content"
              />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
              {content.length}/500 characters
            </div>
          </div>

          {/* Stock Selection - Dropdown with search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Stock Mentions</Label>
            <div className="relative" ref={stockSearchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={stockSearchQuery}
                  onChange={(e) => { setStockSearchQuery(e.target.value); setShowStockDropdown(true); }}
                  onFocus={() => setShowStockDropdown(true)}
                  placeholder="Search stocks..."
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-border text-foreground focus:border-primary"
                  data-testid="input-stock-search"
                />
              </div>

              {/* Stock Dropdown */}
              {showStockDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredStocks.length > 0 ? filteredStocks.map((stock) => (
                    <button
                      key={stock}
                      type="button"
                      onClick={() => addStockMention(stock)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      data-testid={`stock-option-${stock}`}
                    >
                      <span className="text-sm text-gray-900 dark:text-white">{stock}</span>
                      <Plus className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    </button>
                  )) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No stocks found for "{stockSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Stock Mentions Display */}
            {stockMentions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {stockMentions.map(stock => (
                  <Badge 
                    key={stock} 
                    variant="secondary" 
                    className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    data-testid={`badge-stock-${stock}`}
                  >
                    #{stock}
                    <button
                      type="button"
                      onClick={() => removeStockMention(stock)}
                      className="ml-1 hover:bg-red-500/30 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sentiment Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Market Sentiment</Label>
            <Select value={sentiment} onValueChange={setSentiment}>
              <SelectTrigger className="bg-muted/40 border-border text-foreground focus:border-primary" data-testid="select-sentiment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {SENTIMENTS.map(({ value, label, icon: Icon, color }) => (
                  <SelectItem key={value} value={value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2 flex flex-col">
            <Label className="text-sm font-medium text-foreground">Images (Optional)</Label>
            <div className="h-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
              <MultipleImageUpload
                images={uploadedImages}
                onImagesChange={setUploadedImages}
                variant="neofeed"
                data-testid="image-uploader"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={!content.trim() || createPostMutation.isPending}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-publish-post"
            >
              {createPostMutation.isPending ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </form>
        ) : (
          /* Message/Community View */
          <div className="space-y-4">
            {messageTab === 'message' ? (
              /* Message View - Simple message interface */
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Direct messages coming soon!</p>
                </div>
              </div>
            ) : (
              /* Community View - Profiles and followers */
              <div className="space-y-4">
                {/* Profiles Section */}
                <div className="space-y-3">
                  {mockProfiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600" data-testid={`profile-card-${profile.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${profile.bgColor} flex items-center justify-center text-white font-medium`} data-testid={`avatar-${profile.id}`}>
                          {profile.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm" data-testid={`profile-name-${profile.id}`}>{profile.name}</h4>
                            {profile.status === 'online' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid={`status-${profile.id}`}>
                                Online
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`profile-handle-${profile.id}`}>{profile.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {profile.isOwn ? (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium" data-testid={`profile-you-${profile.id}`}>You</span>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7" data-testid={`button-copy-strategy-${profile.id}`}>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Strategy
                            </Button>
                            <Button size="sm" variant="ghost" className="p-1 h-7 w-7" data-testid={`button-follow-${profile.id}`}>
                              <Users className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Followers Section */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600" data-testid="followers-section">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm" data-testid="followers-title">Followers</h3>
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7" data-testid="button-follow-all">
                      <UserPlus className="w-3 h-3 mr-1" />
                      Follow All
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400" data-testid="followers-count">
                    Connect with 1,247 active traders in your network
                  </div>
                </div>

                {/* Join Community Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Join Trading Community</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Connect with experienced traders and share strategies
                  </p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm" data-testid="button-join-community">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Join Community
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}