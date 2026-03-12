import { Card } from "@/components/ui/card";

interface TradebookShareViewProps {
  heatmapData: any;
  stats: {
    pnl: number;
    fomo: number;
    winRate: number;
    streak: number;
  };
}

export function TradebookShareView({ heatmapData, stats }: TradebookShareViewProps) {
  // Get current date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div 
      id="tradebook-share-container"
      className="w-[700px] bg-white p-6"
      style={{ 
        position: 'fixed', 
        left: '0', 
        top: '0', 
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -9999
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-900 rounded"></div>
          <h1 className="text-2xl font-semibold text-slate-900">trade book</h1>
        </div>
      </div>

      {/* Trading Calendar Title */}
      <div className="mb-4">
        <h2 className="text-sm text-slate-600 mb-1">Trading Calendar 2025</h2>
        <p className="text-xs text-slate-500">{Object.keys(heatmapData).length} dates with data</p>
      </div>

      {/* Calendar Heatmap - Simplified months grid */}
      <div className="mb-6 bg-slate-50 rounded-lg p-4">
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="text-center text-xs text-slate-400 font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Show month grids */}
        <div className="grid grid-cols-6 gap-4 mt-4">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, 6).map((month) => (
            <div key={month} className="space-y-1">
              <div className="text-xs font-medium text-slate-600 text-center mb-2">{month}</div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }, (_, i) => {
                  const cellClass = "w-3 h-3 rounded-sm bg-slate-200";
                  return <div key={i} className={cellClass}></div>;
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Loss</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-red-300"></div>
              <div className="w-3 h-3 rounded-sm bg-red-500"></div>
              <div className="w-3 h-3 rounded-sm bg-red-700"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-300"></div>
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              <div className="w-3 h-3 rounded-sm bg-green-700"></div>
            </div>
            <span className="text-xs text-slate-600">Profit</span>
          </div>
        </div>
      </div>

      {/* Current Date Display */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
          <span className="text-sm text-slate-700">{currentDate}</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg px-6 py-4">
        <div className="grid grid-cols-5 gap-4 text-white">
          <div className="text-center">
            <div className="text-xs opacity-80 mb-1">P&L</div>
            <div className="text-sm font-bold">
              {stats.pnl >= 0 ? '+' : ''}₹{(stats.pnl / 1000).toFixed(1)}K
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs opacity-80 mb-1">Trend</div>
            <div className="text-sm font-bold flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs opacity-80 mb-1">FOMO</div>
            <div className="text-sm font-bold">{stats.fomo}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs opacity-80 mb-1">Win%</div>
            <div className="text-sm font-bold">{stats.winRate.toFixed(0)}%</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs opacity-80 mb-1">Streak</div>
            <div className="text-sm font-bold">{stats.streak}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
