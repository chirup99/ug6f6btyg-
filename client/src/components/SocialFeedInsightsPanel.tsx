import { TrendingUp, Hash, MessageCircle, FileText, RotateCcw, User } from "lucide-react";

interface SocialFeedInsightsPanelProps {
  socialFeedPosts: any[];
  isSocialFeedLoading: boolean;
  fetchSocialFeedData: () => void;
}

export function SocialFeedInsightsPanel({
  socialFeedPosts,
  isSocialFeedLoading,
  fetchSocialFeedData,
}: SocialFeedInsightsPanelProps) {
  const now = Date.now();
  const cutoff24h = now - 24 * 60 * 60 * 1000;
  const posts24h = socialFeedPosts.filter(p => new Date(p.createdAt).getTime() >= cutoff24h);
  const allPosts = socialFeedPosts;

  // Trending stocks — count stockMentions across last 24h posts
  const stockCount: Record<string, number> = {};
  posts24h.forEach(p => {
    (p.stockMentions || []).forEach((s: string) => {
      stockCount[s] = (stockCount[s] || 0) + 1;
    });
  });
  // Also fall back to all posts if 24h is sparse
  if (Object.keys(stockCount).length < 3) {
    allPosts.forEach(p => {
      (p.stockMentions || []).forEach((s: string) => {
        stockCount[s] = (stockCount[s] || 0) + 1;
      });
    });
  }
  const trendingStocks = Object.entries(stockCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Trending hashtags — parse #word from content
  const hashtagCount: Record<string, number> = {};
  const allForHT = posts24h.length >= 3 ? posts24h : allPosts;
  allForHT.forEach(p => {
    const matches = (p.content || '').match(/#[a-zA-Z0-9_]+/g) || [];
    matches.forEach((tag: string) => {
      const t = tag.toLowerCase();
      hashtagCount[t] = (hashtagCount[t] || 0) + 1;
    });
  });
  const trendingHashtags = Object.entries(hashtagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  // Sentiment distribution
  const sentCounts = { bullish: 0, bearish: 0, neutral: 0 };
  allForHT.forEach(p => {
    const s = (p.sentiment || 'neutral').toLowerCase();
    if (s === 'bullish') sentCounts.bullish++;
    else if (s === 'bearish') sentCounts.bearish++;
    else sentCounts.neutral++;
  });
  const totalSent = sentCounts.bullish + sentCounts.bearish + sentCounts.neutral || 1;
  const bullPct = Math.round((sentCounts.bullish / totalSent) * 100);
  const bearPct = Math.round((sentCounts.bearish / totalSent) * 100);
  const neutPct = 100 - bullPct - bearPct;

  // Topic keywords from content
  const STOP_WORDS = new Set(['the','is','in','at','of','and','a','to','for','on','with','this','that','my','i','it','be','are','was','has','have','by','an','or','but','not','we','they','you','as','up','do','so','he','she','its','from','about','just','all','will','can','more','also','been','had','were','what','there','which','who','your','our','their','if','out','no','how','some','would','any','said','like']);
  const wordCount: Record<string, number> = {};
  allForHT.forEach(p => {
    const words = (p.content || '').toLowerCase().replace(/#\w+/g, '').replace(/[^a-z\s]/g, ' ').split(/\s+/);
    words.forEach((w: string) => {
      if (w.length > 3 && !STOP_WORDS.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    });
  });
  const topTopics = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  const overallMood = bullPct > bearPct + 10 ? 'Bullish' : bearPct > bullPct + 10 ? 'Bearish' : 'Neutral';
  const moodColor = overallMood === 'Bullish' ? 'text-green-400' : overallMood === 'Bearish' ? 'text-red-400' : 'text-yellow-400';
  const moodBg = overallMood === 'Bullish' ? 'from-green-900/30 to-green-800/10 border-green-700/40' : overallMood === 'Bearish' ? 'from-red-900/30 to-red-800/10 border-red-700/40' : 'from-yellow-900/30 to-yellow-800/10 border-yellow-700/40';

  return (
    <div className="w-full space-y-4">
      {isSocialFeedLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Analysing community discussions…</p>
        </div>
      ) : socialFeedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
          <User className="w-12 h-12 opacity-30" />
          <p className="text-sm">No posts yet — be the first to share your trade idea!</p>
        </div>
      ) : (
        <>
          {/* Header stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-pink-400">{allPosts.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Total Posts</div>
            </div>
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{posts24h.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Last 24 Hours</div>
            </div>
            <div className={`bg-gradient-to-br ${moodBg} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-bold ${moodColor}`}>{overallMood}</div>
              <div className="text-xs text-gray-400 mt-0.5">Community Mood</div>
            </div>
          </div>

          {/* Sentiment bar */}
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-200">Community Sentiment</span>
              <span className="text-xs text-gray-500">{totalSent} posts analysed</span>
            </div>
            <div className="flex rounded-full overflow-hidden h-3">
              {bullPct > 0 && <div style={{ width: `${bullPct}%` }} className="bg-green-500 transition-all" />}
              {neutPct > 0 && <div style={{ width: `${neutPct}%` }} className="bg-yellow-500 transition-all" />}
              {bearPct > 0 && <div style={{ width: `${bearPct}%` }} className="bg-red-500 transition-all" />}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-green-400">🟢 Bullish {bullPct}%</span>
              <span className="text-xs text-yellow-400">🟡 Neutral {neutPct}%</span>
              <span className="text-xs text-red-400">🔴 Bearish {bearPct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trending Stocks */}
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-semibold text-gray-200">Trending Stocks</span>
                <span className="text-xs text-gray-500 ml-auto">by mentions</span>
              </div>
              {trendingStocks.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No stock mentions yet</p>
              ) : (
                <div className="space-y-2">
                  {trendingStocks.map(([sym, cnt], i) => {
                    const maxCnt = trendingStocks[0][1];
                    const pct = Math.round((cnt / maxCnt) * 100);
                    const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                    return (
                      <div key={sym} className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-4 ${rankColors[i] || 'text-gray-500'}`}>#{i + 1}</span>
                        <span className="text-xs font-mono font-semibold text-pink-300 w-20 truncate">{sym}</span>
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%` }} className="h-full bg-pink-500 rounded-full" />
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">{cnt} {cnt === 1 ? 'post' : 'posts'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trending Hashtags */}
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-gray-200">Trending Hashtags</span>
              </div>
              {trendingHashtags.length === 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {['#Nifty50', '#Trading', '#Stocks', '#BSE', '#NSE', '#BuyTheDip'].map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-blue-900/30 border border-blue-700/40 text-blue-300 text-xs rounded-full">{tag}</span>
                  ))}
                  <span className="text-xs text-gray-600 self-center">— no hashtags in posts yet</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trendingHashtags.map(([tag, cnt]) => (
                    <span key={tag} className="px-2.5 py-1 bg-blue-900/30 border border-blue-700/40 text-blue-300 text-xs rounded-full flex items-center gap-1">
                      {tag}
                      <span className="text-blue-500 text-[10px]">×{cnt}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hot Discussion Topics */}
          {topTopics.length > 0 && (
            <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-gray-200">Hot Discussion Topics</span>
                <span className="text-xs text-gray-500 ml-auto">from post content</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topTopics.map(topic => (
                  <span key={topic} className="px-3 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs rounded-full">{topic}</span>
                ))}
              </div>
            </div>
          )}

          {/* 24h Report */}
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-gray-200">24-Hour Community Report</span>
            </div>
            <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
              <p>
                In the last 24 hours, the NeoFeed community published <span className="text-white font-semibold">{posts24h.length}</span> post{posts24h.length !== 1 ? 's' : ''}.
                {' '}Community mood is <span className={`font-semibold ${moodColor}`}>{overallMood}</span> with {bullPct}% bullish, {neutPct}% neutral, and {bearPct}% bearish sentiment.
              </p>
              {trendingStocks.length > 0 && (
                <p>
                  Most discussed stocks: <span className="text-pink-300 font-semibold">{trendingStocks.slice(0, 3).map(([s]) => s).join(', ')}</span>.
                  {trendingStocks[0] && ` ${trendingStocks[0][0]} leads with ${trendingStocks[0][1]} mention${trendingStocks[0][1] !== 1 ? 's' : ''}.`}
                </p>
              )}
              {trendingHashtags.length > 0 && (
                <p>
                  Top hashtags: <span className="text-blue-300">{trendingHashtags.slice(0, 4).map(([t]) => t).join(' ')}</span>.
                </p>
              )}
              {topTopics.length > 0 && (
                <p>
                  Recurring discussion themes: <span className="text-purple-300">{topTopics.slice(0, 5).join(', ')}</span>.
                </p>
              )}
              <p className="text-gray-500 pt-1 border-t border-gray-700/50">
                Data is based on {allPosts.length} total posts on NeoFeed. Refresh to see latest updates.
              </p>
            </div>
            <button
              onClick={() => fetchSocialFeedData()}
              className="mt-3 flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          {/* Recent Posts Preview */}
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-200">Recent Posts</span>
              </div>
              <span className="text-xs text-gray-500">Latest {Math.min(3, allPosts.length)}</span>
            </div>
            <div className="space-y-3">
              {allPosts.slice(0, 3).map((post: any, idx: number) => {
                const sentColor = post.sentiment === 'bullish' ? 'text-green-400 border-green-700/50' : post.sentiment === 'bearish' ? 'text-red-400 border-red-700/50' : 'text-yellow-400 border-yellow-700/50';
                const timeAgo = (() => {
                  const diff = Math.floor((now - new Date(post.createdAt).getTime()) / 60000);
                  if (diff < 60) return `${diff}m ago`;
                  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
                  return `${Math.floor(diff / 1440)}d ago`;
                })();
                const authorName = post.authorDisplayName || post.authorUsername || 'Trader';
                return (
                  <div key={post.id || idx} className="border border-gray-700/40 rounded-lg p-3 bg-gray-800/30">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center text-[10px] font-bold text-white">
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-gray-300">{authorName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {post.sentiment && (
                          <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${sentColor}`}>
                            {post.sentiment === 'bullish' ? '🐂' : post.sentiment === 'bearish' ? '🐻' : '—'} {post.sentiment}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-600">{timeAgo}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{post.content}</p>
                    {(post.stockMentions || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(post.stockMentions as string[]).slice(0, 4).map((s: string) => (
                          <span key={s} className="text-[10px] bg-pink-900/30 text-pink-300 border border-pink-800/40 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
