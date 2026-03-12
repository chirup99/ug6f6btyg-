import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoHeatmap } from "@/components/DemoHeatmap";
import { useLocation } from "wouter";

export default function PublicHeatmap() {
  // Support both /share/:userId and /share/heatmap/:userId routes
  const [matchSimple, paramsSimple] = useRoute("/share/:userId");
  const [matchLegacy, paramsLegacy] = useRoute("/share/heatmap/:userId");
  const userId = paramsSimple?.userId || paramsLegacy?.userId || "";
  const [heatmapData, setHeatmapData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [userDisplayName, setUserDisplayName] = useState<string>("Guest");

  useEffect(() => {
    // Fetch public (sanitized) heatmap data - only aggregate metrics, no sensitive details
    const fetchHeatmapData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/user-journal/${userId}/public`);
        if (response.ok) {
          const data = await response.json();
          console.log(`🔓 Public heatmap data loaded: ${Object.keys(data).length} dates (aggregate metrics only)`);
          
          // SECURITY: Rebuild each record to ONLY include allowed fields, discard everything else
          const rebuiltData: Record<string, any> = {};
          Object.keys(data).forEach(dateKey => {
            const dayData = data[dateKey];
            // Rebuild from scratch - ONLY allowed fields
            rebuiltData[dateKey] = {
              performanceMetrics: {
                netPnL: Number(dayData?.performanceMetrics?.netPnL) || 0,
                totalTrades: Number(dayData?.performanceMetrics?.totalTrades) || 0,
                winningTrades: Number(dayData?.performanceMetrics?.winningTrades) || 0,
                losingTrades: Number(dayData?.performanceMetrics?.losingTrades) || 0
              },
              tradingTags: Array.isArray(dayData?.tradingTags) ? dayData.tradingTags.filter((tag: any) => typeof tag === 'string') : []
            };
          });
          
          setHeatmapData(rebuiltData);
        }
      } catch (error) {
        console.error("Error fetching public heatmap data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchHeatmapData();
    }
  }, [userId]);

  useEffect(() => {
    // Fetch user display name
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`/api/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUserDisplayName(data.displayName || data.email || userId);
        }
      } catch (error) {
        console.log("Could not fetch user info:", error);
      }
    };

    if (userId) {
      fetchUserInfo();
    }
  }, [userId]);

  const handleClose = () => {
    // Check authentication from localStorage (more reliable for public pages)
    const userId = localStorage.getItem('currentUserId');
    const userEmail = localStorage.getItem('currentUserEmail');
    const isAuthenticated = userId && userEmail && userId !== 'null' && userEmail !== 'null';
    
    if (!isAuthenticated) {
      // Not authenticated → navigate to landing page
      setLocation("/login");
    } else {
      // Authenticated → navigate to their journal
      setLocation("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trading calendar...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics from heatmap data
  const calculateStats = () => {
    const dates = Object.keys(heatmapData).sort();
    
    let totalPnL = 0;
    let totalTrades = 0;
    let winningTrades = 0;
    let fomoTrades = 0;
    let consecutiveWins = 0;
    let maxWinStreak = 0;
    const trendData: number[] = [];
    const lossTagsMap = new Map<string, number>();
    
    dates.forEach(dateKey => {
      const dayData = heatmapData[dateKey];
      // SECURITY: Consume ONLY sanitized fields - no tradingData access
      const metrics = dayData?.performanceMetrics;
      const tags = dayData?.tradingTags || [];
      
      if (metrics) {
        const netPnL = metrics.netPnL || 0;
        totalPnL += netPnL;
        totalTrades += metrics.totalTrades || 0;
        winningTrades += metrics.winningTrades || 0;
        trendData.push(netPnL);
        
        if (netPnL > 0) {
          consecutiveWins++;
          maxWinStreak = Math.max(maxWinStreak, consecutiveWins);
        } else {
          consecutiveWins = 0;
        }
        
        // Track tags from losing trades
        if (netPnL < 0 && Array.isArray(tags) && tags.length > 0) {
          tags.forEach((tag: string) => {
            const normalizedTag = tag.trim().toLowerCase();
            lossTagsMap.set(normalizedTag, (lossTagsMap.get(normalizedTag) || 0) + 1);
          });
        }
      }
      
      // Count FOMO trades
      const normalizedTags = Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()) : [];
      if (normalizedTags.includes('fomo')) {
        fomoTrades++;
      }
    });
    
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const isProfitable = totalPnL >= 0;
    const successRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const lossTags = Array.from(lossTagsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
    
    return {
      totalPnL,
      totalTrades,
      winningTrades,
      fomoTrades,
      maxWinStreak,
      winRate,
      isProfitable,
      successRate,
      trendData,
      lossTags,
    };
  };

  const stats = calculateStats();

  const createTrendPath = (data: number[]) => {
    if (data.length === 0) return '';
    const max = Math.max(...data, 0);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 40;
    const height = 20;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' L ');
    
    return `M ${points}`;
  };

  const createAnalyticsTrendPath = (data: number[]) => {
    if (data.length === 0) return '';
    const max = Math.max(...data, 0);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 100;
    const height = 45;
    
    if (data.length === 1) {
      const x = width / 2;
      const y = height - ((data[0] - min) / range) * height;
      return `M ${x} ${y}`;
    }
    
    // Create smooth bezier curve
    let path = '';
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return { x, y };
    });
    
    // Start path
    path += `M ${points[0].x} ${points[0].y}`;
    
    // Use quadratic bezier curves for smoothness
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const prev = points[i - 1];
      const cpX = (prev.x + current.x) / 2;
      const cpY = (prev.y + current.y) / 2;
      path += ` Q ${cpX} ${cpY}, ${current.x} ${current.y}`;
    }
    
    return path;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl">
        {/* Modal-style Dialog */}
        <div className="bg-background border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex-shrink-0">
            <div className="flex flex-col gap-2 p-6">
              {/* Top row: PERALA (left) and Report title (right) */}
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-3xl font-bold tracking-tight">PERALA</h1>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">MY trading report</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-9 w-9"
                    data-testid="button-close-share-modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Bottom row: Tagline and UserID */}
              <div className="flex flex-col space-y-1">
                <p className="text-xs text-muted-foreground">rethink & reinvest</p>
                <p className="text-xs text-muted-foreground">
                  userID: {userDisplayName}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto space-y-4 p-6">
            {/* Heatmap Container */}
            <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <DemoHeatmap
                tradingDataByDate={heatmapData}
                onDateSelect={() => {}}
                selectedDate={null}
                onDataUpdate={() => {}}
                isPublicView={true}
              />
            </div>
            
            {/* Stats Bar */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-md px-2 py-1.5">
              <div className="flex items-center justify-around text-white gap-1">
                {/* P&L */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[10px] opacity-80">P&L</div>
                  <div className="text-xs font-bold">
                    {stats.isProfitable ? '+' : ''}₹{(stats.totalPnL / 1000).toFixed(1)}K
                  </div>
                </div>
                
                {/* Trend */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[10px] opacity-80">Trend</div>
                  <div className="w-8 h-4">
                    <svg viewBox="0 0 40 20" className="w-full h-full">
                      <path
                        d={createTrendPath(stats.trendData)}
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        opacity="0.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                
                {/* FOMO */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[10px] opacity-80">FOMO</div>
                  <div className="text-xs font-bold">{stats.fomoTrades}</div>
                </div>
                
                {/* Win% */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[10px] opacity-80">Win%</div>
                  <div className="text-xs font-bold">{stats.winRate.toFixed(0)}%</div>
                </div>
                
                {/* Streak */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[10px] opacity-80">Streak</div>
                  <div className="text-xs font-bold">{stats.maxWinStreak}</div>
                </div>
              </div>
            </div>
            
            {/* Analytics Row: Total P&L, Performance Trend, Loss Tags */}
            <div className="grid grid-cols-3 gap-3">
              {/* Column 1: Total P&L */}
              <div className={`rounded-lg p-4 text-white ${stats.isProfitable ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-[11px] opacity-90 uppercase font-semibold">Total P&L</div>
                  <div className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center">
                    <span className="text-[10px]">₹</span>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-3">
                  {stats.isProfitable ? '+' : ''}₹{(Math.abs(stats.totalPnL) / 1000).toFixed(1)}K
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span>Total Trades</span>
                    <span className="font-semibold">{stats.totalTrades}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span>Success Rate</span>
                    <span className="font-semibold">{stats.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/80 rounded-full transition-all"
                        style={{ width: `${stats.successRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Column 2: Performance Trend */}
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 uppercase font-semibold">Performance Trend</div>
                  <div className={`text-[10px] px-2 py-1 rounded ${stats.isProfitable ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {stats.isProfitable ? 'Profitable' : 'Not Profitable'}
                  </div>
                </div>
                <svg viewBox="0 0 100 45" className="w-full" style={{ height: '120px' }}>
                  <line x1="0" y1="22.5" x2="100" y2="22.5" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.2" />
                  <path
                    d={createAnalyticsTrendPath(stats.trendData)}
                    fill="none"
                    stroke={stats.isProfitable ? '#16a34a' : '#dc2626'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              {/* Column 3: Loss Tags */}
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-[11px] text-gray-600 dark:text-gray-400 uppercase font-semibold mb-3">Loss Tags</div>
                {stats.lossTags.length > 0 ? (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                    {stats.lossTags.map(({ tag, count }) => (
                      <div
                        key={tag}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-md"
                        data-testid={`tag-loss-${tag}`}
                      >
                        <span className="text-[12px] font-medium text-red-800 dark:text-red-300 capitalize truncate">{tag}</span>
                        <span className="text-[11px] font-bold text-red-600 dark:text-red-400 ml-2 flex-shrink-0">-₹{(count * 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12px] text-gray-500 dark:text-gray-400 italic py-3">No loss tags</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
