import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Hash, ImageIcon, TrendingUp, TrendingDown, Minus, Sparkles, Zap, Eye, Copy, Clipboard, Clock, Activity } from 'lucide-react';
import { MultipleImageUpload } from './multiple-image-upload';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { InsertSocialPost } from '@shared/schema';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
  'ICICIBANK', 'KOTAKBANK', 'BHARTIARTL', 'ITC', 'SBIN',
  'ASIANPAINT', 'MARUTI', 'LT', 'AXISBANK', 'HCLTECH'
];

const SENTIMENTS = [
  { value: 'bullish', label: 'Bullish', icon: TrendingUp, color: 'text-green-600' },
  { value: 'bearish', label: 'Bearish', icon: TrendingDown, color: 'text-red-600' },
  { value: 'neutral', label: 'Neutral', icon: Minus, color: 'text-gray-600' }
];

export function PostCreationModal({ isOpen, onClose }: PostCreationModalProps) {
  const [content, setContent] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [stockMentions, setStockMentions] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<string>('neutral');
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string; url: string; name: string; file?: File}>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getUserDisplayName } = useCurrentUser();

  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertSocialPost) => {
      const response = await fetch('/api/social-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      return await response.json();
    },
    onMutate: async (newPost) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['/api/social-posts'] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(['/api/social-posts']);

      // Optimistically update to the new value - add new post at the top
      queryClient.setQueryData(['/api/social-posts'], (old: any) => {
        const optimisticPost = {
          id: Date.now(), // Temporary ID
          ...newPost,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likes: 0,
          comments: 0,
          reposts: 0
        };
        return old ? [optimisticPost, ...old] : [optimisticPost];
      });

      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onSuccess: (data) => {
      // Refresh with real data from server to get correct ID and server timestamp
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
      toast({ title: 'Success', description: 'Post created successfully! 🎉' });
      handleClose();
    },
    onError: (error, newPost, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['/api/social-posts'], context?.previousPosts);
      toast({ title: 'Error', description: 'Failed to create post' });
      console.error('Error creating post:', error);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['/api/social-posts'] });
    }
  });

  const handleAddStock = () => {
    if (selectedStock && !stockMentions.includes(selectedStock)) {
      setStockMentions([...stockMentions, selectedStock]);
      setSelectedStock('');
    }
  };

  const handleRemoveStock = (stock: string) => {
    setStockMentions(stockMentions.filter(s => s !== stock));
  };

  const handleImagesChange = (images: Array<{id: string; url: string; name: string; file?: File}>) => {
    setUploadedImages(images);
    if (images.length > 0) {
      toast({ 
        title: 'Images Updated', 
        description: `${images.length} image(s) ready for post`,
        duration: 2000
      });
    }
  };

  // Simplified text paste functionality (images handled by MultipleImageUpload)
  const handleTextPaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle text paste only (images handled by MultipleImageUpload)
      if (item.type === 'text/plain') {
        item.getAsString((text) => {
          // Auto-detect stock symbols in pasted text
          const stockPattern = /\$([A-Z]{2,10})|([A-Z]{2,10}(?=\s|$))/g;
          const matches = Array.from(text.matchAll(stockPattern));
          const detectedStocks = Array.from(new Set(matches.map(match => match[1] || match[2]).filter(Boolean)));
          
          if (detectedStocks.length > 0) {
            const newStocks = detectedStocks.filter(stock => !stockMentions.includes(stock));
            if (newStocks.length > 0) {
              setStockMentions(prev => [...prev, ...newStocks]);
              toast({ 
                title: 'Stock Symbols Detected', 
                description: `Added: ${newStocks.join(', ')}`,
                duration: 3000
              });
            }
          }
          
          // Add the text to content if there's no existing content
          if (!content.trim()) {
            setContent(text);
          }
        });
      }
    }
  }, [stockMentions, toast, content]);

  // Add paste event listener for text only
  useEffect(() => {
    if (isOpen) {
      const handleGlobalTextPaste = (e: ClipboardEvent) => {
        // Only handle if the textarea is focused (images handled by MultipleImageUpload)
        if (document.activeElement === textareaRef.current) {
          handleTextPaste(e);
        }
      };

      document.addEventListener('paste', handleGlobalTextPaste);
      
      return () => {
        document.removeEventListener('paste', handleGlobalTextPaste);
      };
    }
  }, [isOpen, handleTextPaste]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Post content cannot be empty' });
      return;
    }

    // Handle multiple images if present
    const imageUrls: string[] = [];
    
    if (uploadedImages.length > 0) {
      try {
        for (const image of uploadedImages) {
          if (image.file) {
            // Convert image to base64 for persistent storage
            const base64String = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(image.file!);
            });
            imageUrls.push(base64String);
          } else {
            // Already base64 or URL
            imageUrls.push(image.url);
          }
        }
        console.log(`✅ ${imageUrls.length} images processed for persistent storage`);
      } catch (error) {
        console.error('❌ Error converting images to base64:', error);
        toast({ title: 'Error', description: 'Failed to process images' });
        return;
      }
    }

    const userDisplayName = getUserDisplayName();
    const postData: InsertSocialPost = {
      authorUsername: userDisplayName,
      authorDisplayName: userDisplayName,
      authorAvatar: '/api/avatars/user.jpg',
      authorVerified: false,
      authorFollowers: 0,
      content,
      stockMentions,
      sentiment,
      hasImage: imageUrls.length > 0,
      imageUrl: imageUrls.length > 0 ? (imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls)) : null,
      likes: 0,
      comments: 0,
      reposts: 0,
      tags: []
    };

    // Post directly without preview
    createPostMutation.mutate(postData);
  };

  const handleClose = () => {
    setContent('');
    setSelectedStock('');
    setStockMentions([]);
    setSentiment('neutral');
    setUploadedImages([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-xl transition-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-500" />
            Create Post
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Share your trading insights with the community
          </DialogDescription>
        </DialogHeader>


        <div className="space-y-4" data-testid="post-creation-form">
          {/* Clean Content Input */}
          <div>
            <Label htmlFor="content" className="text-gray-700 dark:text-gray-300 font-medium">
              What's happening in the markets?
            </Label>
            <div className="relative mt-2">
              <Textarea
                ref={textareaRef}
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your market insights, analysis, or thoughts..."
                className="min-h-[120px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={280}
                data-testid="input-post-content"
              />
              <div className={`absolute bottom-3 right-3 text-sm flex items-center gap-1 ${
                content.length > 280 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {content.length > 280 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                {content.length}/280
              </div>
            </div>
          </div>

          {/* Stock Selection */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Add Stock Symbols</Label>
            <div className="flex gap-2 mt-2">
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" data-testid="select-stock">
                  <SelectValue placeholder="Select a stock" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                  {POPULAR_STOCKS.map((stock) => (
                    <SelectItem key={stock} value={stock} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      ${stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddStock} 
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                data-testid="button-add-stock"
              >
                Add
              </Button>
            </div>
            
            {/* Selected Stocks */}
            {stockMentions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {stockMentions.map((stock) => (
                  <Badge 
                    key={stock} 
                    className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  >
                    ${stock}
                    <button
                      onClick={() => handleRemoveStock(stock)}
                      className="ml-2 hover:text-red-500"
                      data-testid={`button-remove-stock-${stock}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Market Sentiment */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Market Sentiment</Label>
            <div className="flex gap-2 mt-2">
              {SENTIMENTS.map((sent) => (
                <Button
                  key={sent.value}
                  variant={sentiment === sent.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSentiment(sent.value)}
                  className={`flex items-center gap-2 ${
                    sentiment === sent.value 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  data-testid={`button-sentiment-${sent.value}`}
                >
                  <sent.icon className={`w-4 h-4 ${sent.color}`} />
                  {sent.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Multi-Image Upload */}
          <div>
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Add Images</Label>
            <div className="mt-2">
              <div className="h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden transition-none">
                <MultipleImageUpload 
                  images={uploadedImages}
                  onImagesChange={handleImagesChange}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                <Copy className="w-3 h-3" />
                <span>Paste multiple images with Ctrl+V • Drag & drop • Click to browse</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline"
              onClick={handleClose}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              data-testid="button-cancel-post"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || !content.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
              data-testid="button-submit-post"
            >
              {createPostMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}