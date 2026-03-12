import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Target } from "lucide-react";

interface ReportCardData {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  datesCount: number;
  lossTags: Array<{ tag: string; count: number; totalLoss: number }>;
  trendData: Array<{ date: string; pnl: number; formattedDate: string }>;
  isProfitable: boolean;
}

interface ReportCardComposerProps {
  data: ReportCardData | null;
}

export function ReportCardComposer({ data }: ReportCardComposerProps) {
  // Handle null data gracefully - render empty container
  if (!data) {
    return (
      <div 
        id="report-card-container"
        className="w-[1080px] h-[1350px]"
        style={{ 
          position: 'fixed', 
          left: '0', 
          top: '0', 
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -9999
        }}
      />
    );
  }
  
  const { totalPnL, winRate, totalTrades, datesCount, lossTags, trendData, isProfitable } = data;

  return (
    <div 
      id="report-card-container"
      className="w-[1080px] h-[1350px] bg-gradient-to-br from-slate-50 to-slate-100 p-12 flex flex-col"
      style={{ 
        position: 'fixed', 
        left: '0', 
        top: '0', 
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -9999
      }}
    >
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 mb-2">Trading Performance</h1>
            <p className="text-xl text-slate-600">Your Journey at a Glance</p>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white px-8 py-4 rounded-2xl text-3xl font-bold">
            FREE
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Total P&L Card */}
        <Card className={`${isProfitable ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white border-0`}>
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm opacity-80">Total P&L</div>
                <div className="text-4xl font-bold">
                  {totalPnL >= 0 ? '+' : '-'}₹{Math.abs(totalPnL).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className="space-y-3 mt-6">
              <div className="flex justify-between">
                <span className="text-sm opacity-80">Total Trades</span>
                <span className="font-semibold text-lg">{totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm opacity-80">Win Rate</span>
                <span className="font-semibold text-lg">{winRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Days Card */}
        <Card className="bg-white border-2 border-slate-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-slate-600">Trading Days</div>
                <div className="text-4xl font-bold text-slate-900">{datesCount}</div>
              </div>
            </div>
            <div className="text-sm text-slate-600 mt-6">
              Active trading sessions tracked
            </div>
          </CardContent>
        </Card>

        {/* Performance Indicator Card */}
        <Card className="bg-white border-2 border-slate-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-slate-600">Performance</div>
                <div className="text-3xl font-bold text-slate-900">
                  {isProfitable ? 'Profitable' : 'Learning'}
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-600 mt-6">
              Overall market performance
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini Performance Trend Visualization */}
      <div className="bg-white rounded-3xl p-8 mb-8 border-2 border-slate-200">
        <h3 className="text-2xl font-semibold text-slate-900 mb-6">Performance Trend</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {trendData.slice(-12).map((item, idx) => {
            const maxAbsPnl = Math.max(...trendData.map(d => Math.abs(d.pnl)));
            const height = maxAbsPnl > 0 ? (Math.abs(item.pnl) / maxAbsPnl) * 100 : 0;
            const isPositive = item.pnl >= 0;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex-1 w-full flex items-end">
                  <div 
                    className={`w-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'} rounded-t-lg transition-all`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-600 font-medium">{item.formattedDate}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loss Tags Analysis */}
      {lossTags.length > 0 && (
        <div className="bg-white rounded-3xl p-8 mb-8 border-2 border-slate-200">
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Key Loss Patterns</h3>
          <div className="grid grid-cols-2 gap-4">
            {lossTags.slice(0, 4).map((tag, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="text-base px-4 py-2">{tag.tag}</Badge>
                  <span className="text-sm text-slate-600">{tag.count} times</span>
                </div>
                <span className="text-lg font-bold text-red-600">
                  -₹{Math.abs(tag.totalLoss).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promotional Footer */}
      <div className="mt-auto">
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-3xl p-8 text-white">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Advanced Trading Journal</h2>
            <p className="text-2xl mb-6 opacity-90">
              Track emotions & behavior with realistic data
            </p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <Badge variant="secondary" className="text-xl px-6 py-3 bg-white/20 text-white hover:bg-white/30">
                NSE
              </Badge>
              <Badge variant="secondary" className="text-xl px-6 py-3 bg-white/20 text-white hover:bg-white/30">
                Crypto
              </Badge>
              <Badge variant="secondary" className="text-xl px-6 py-3 bg-white/20 text-white hover:bg-white/30">
                Forex
              </Badge>
              <Badge variant="secondary" className="text-xl px-6 py-3 bg-white/20 text-white hover:bg-white/30">
                Commodity
              </Badge>
            </div>
            <div className="text-3xl font-bold bg-white/20 rounded-2xl px-8 py-4 inline-block">
              100% FREE • Start Tracking Today
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
