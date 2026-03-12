import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Settings, Grid3X3, Calendar, ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

export default function TradingJournalDemo() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">Trading Journal</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-card" data-testid="badge-symbol">NIFTY50</Badge>
                  <Badge variant="outline" className="bg-card" data-testid="badge-timeframe">15m</Badge>
                  <Button size="sm" variant="default" className="h-7" data-testid="button-chart-confirm">
                    <span className="text-xs">✓</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-settings">
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-more">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Chart Placeholder with Demo Chart Image */}
              <div className="bg-muted rounded-lg h-[300px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full relative">
                    {/* Simulated Candlestick Chart */}
                    <svg viewBox="0 0 600 250" className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1="0" y1="50" x2="600" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                      <line x1="0" y1="150" x2="600" y2="150" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                      <line x1="0" y1="200" x2="600" y2="200" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                      
                      {/* Trendline (Pink) */}
                      <path d="M 50 180 L 200 140 L 350 120 L 500 100 L 580 90" 
                            stroke="#ec4899" strokeWidth="2" fill="none" />
                      
                      {/* Support Line (Pink) */}
                      <path d="M 50 200 L 200 170 L 350 150 L 500 140 L 580 130" 
                            stroke="#ec4899" strokeWidth="2" fill="none" />
                      
                      {/* Price Action (Green/Teal Line) */}
                      <path d="M 80 190 L 120 170 L 160 150 L 200 145 L 240 135 L 280 125 L 320 130 L 360 115 L 400 110 L 440 105 L 480 100 L 520 95 L 560 92" 
                            stroke="#10b981" strokeWidth="2.5" fill="none" />
                      
                      {/* Dots at key points */}
                      <circle cx="560" cy="92" r="4" fill="#10b981" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur" data-testid="badge-chart-pagination">
                    1 / 2
                  </Badge>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/50 backdrop-blur" 
                  data-testid="button-chart-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/50 backdrop-blur" 
                  data-testid="button-chart-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Trade History Summary */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" data-testid="text-section-title">TRADE HISTORY SUMMARY</h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" data-testid="button-order">Order</Button>
                  <Button size="sm" variant="ghost" data-testid="button-import">Import</Button>
                  <Badge variant="secondary" data-testid="badge-duration">0m</Badge>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Time</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Order</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Symbol</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Qty</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">P&L</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">%</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b" data-testid="row-trade-1">
                      <td className="py-3 text-muted-foreground">12:13:00</td>
                      <td className="py-3">
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid="badge-buy">BUY</Badge>
                      </td>
                      <td className="py-3">SENSEX 4th w SEP PE</td>
                      <td className="py-3 text-muted-foreground">NRML</td>
                      <td className="py-3 text-right">40</td>
                      <td className="py-3 text-right">₹514.3</td>
                      <td className="py-3 text-right text-green-600">+₹1170.00</td>
                      <td className="py-3 text-right text-green-600">+5.38%</td>
                      <td className="py-3 text-right text-muted-foreground">0m 17s</td>
                    </tr>
                    <tr className="border-b" data-testid="row-trade-2">
                      <td className="py-3 text-muted-foreground">12:13:17</td>
                      <td className="py-3">
                        <Badge variant="destructive" data-testid="badge-sell">SELL</Badge>
                      </td>
                      <td className="py-3">SENSEX 4th w SEP PE</td>
                      <td className="py-3 text-muted-foreground">NRML</td>
                      <td className="py-3 text-right">40</td>
                      <td className="py-3 text-right">₹543.55</td>
                      <td className="py-3 text-right text-green-600">+₹1170.00</td>
                      <td className="py-3 text-right text-green-600">+5.38%</td>
                      <td className="py-3 text-right text-muted-foreground">0m 17s</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column - Stats & Calendar */}
          <div className="space-y-6">
            {/* Trading Stats */}
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div data-testid="stat-total-trades">
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <div data-testid="stat-win-rate">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-green-600">100.0%</p>
                </div>
                <div data-testid="stat-net-pnl">
                  <p className="text-sm text-muted-foreground">Net P&L</p>
                  <p className="text-2xl font-bold text-green-600">₹1,170</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div data-testid="stat-winning-trades">
                  <p className="text-sm text-muted-foreground">Winning Trades:</p>
                  <p className="text-sm">1</p>
                  <p className="text-sm text-muted-foreground">Total Profit:</p>
                  <p className="text-sm text-green-600">₹1,170</p>
                </div>
                <div data-testid="stat-losing-trades">
                  <p className="text-sm text-muted-foreground">Losing Trades:</p>
                  <p className="text-sm">0</p>
                  <p className="text-sm text-muted-foreground">Total Loss:</p>
                  <p className="text-sm">₹0</p>
                </div>
              </div>
            </Card>

            {/* Trading Notes */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-1.5" data-testid="text-notes-title">
                  TRADING NOTES
                  <Newspaper className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                </h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" data-testid="button-tags">Tags (3)</Button>
                  <Button size="sm" variant="ghost" data-testid="button-edit">Edit</Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" data-testid="badge-tag-scalping">scalping</Badge>
                <Badge variant="secondary" data-testid="badge-tag-price-action">price action</Badge>
                <Badge variant="secondary" data-testid="badge-tag-pattern">pattern based</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground" data-testid="text-note-content">
                perfect my trendline setup
              </p>
            </Card>

            {/* Trade Book Calendar */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <h3 className="font-semibold" data-testid="text-calendar-title">trade book</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Demo</span>
                  <div className="w-10 h-5 bg-muted rounded-full relative">
                    <div className="w-4 h-4 bg-green-600 rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                  <Button size="sm" data-testid="button-save">Save</Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium" data-testid="text-calendar-year">Trading Calendar 2025</h4>
                  <span className="text-xs text-muted-foreground">15 dates with data</span>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-12 gap-1 text-xs">
                  {/* Month Headers */}
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                    <div key={month} className="text-center text-muted-foreground col-span-1">
                      {month}
                    </div>
                  ))}
                  
                  {/* Calendar Days - Simplified representation */}
                  {Array.from({ length: 12 }).map((_, monthIndex) => (
                    <div key={monthIndex} className="col-span-1 space-y-0.5">
                      {Array.from({ length: 5 }).map((_, weekIndex) => {
                        const isDataDay = (monthIndex === 6 && weekIndex === 2) || // Jul
                                         (monthIndex === 7 && weekIndex === 1) || // Aug
                                         (monthIndex === 8 && weekIndex === 3) || // Sep
                                         (monthIndex === 10 && weekIndex === 0); // Nov (blue - selected)
                        const isSelectedDay = monthIndex === 10 && weekIndex === 0; // Nov 3
                        
                        return (
                          <div
                            key={weekIndex}
                            className={`h-2 w-2 rounded-sm ${
                              isSelectedDay
                                ? 'bg-blue-600'
                                : isDataDay
                                ? 'bg-green-600'
                                : 'bg-muted'
                            }`}
                            data-testid={`calendar-day-${monthIndex}-${weekIndex}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-600"></div>
                      <span className="text-muted-foreground">Loss</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-600"></div>
                      <span className="text-muted-foreground">Profit</span>
                    </div>
                  </div>
                </div>

                {/* Date Display */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-date-prev">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium" data-testid="text-selected-date">Monday, November 3, 2025</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-date-next">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
