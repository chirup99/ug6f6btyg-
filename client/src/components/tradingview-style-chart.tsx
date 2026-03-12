import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Activity, BarChart3, RefreshCw, Maximize, Settings, TrendingDown, Volume2 } from 'lucide-react';

// Fyers symbols for chart data
const FYERS_SYMBOLS = [
  { 
    value: 'NSE:NIFTY50-INDEX', 
    label: 'NIFTY 50',
    display: 'NIFTY 50'
  },
  { 
    value: 'NSE:RELIANCE-EQ', 
    label: 'RELIANCE',
    display: 'Reliance Industries'
  },
  { 
    value: 'NSE:INFY-EQ', 
    label: 'INFOSYS',
    display: 'Infosys Limited'
  },
  { 
    value: 'NSE:TCS-EQ', 
    label: 'TCS',
    display: 'Tata Consultancy Services'
  },
  { 
    value: 'NSE:HDFCBANK-EQ', 
    label: 'HDFC BANK',
    display: 'HDFC Bank Limited'
  },
  { 
    value: 'NSE:ICICIBANK-EQ', 
    label: 'ICICI BANK',
    display: 'ICICI Bank Limited'
  },
  { 
    value: 'NSE:SBIN-EQ', 
    label: 'SBI',
    display: 'State Bank of India'
  },
];

const TIMEFRAMES = [
  { value: '1', label: '1m', color: '#6b7280' },
  { value: '5', label: '5m', color: '#6b7280' },
  { value: '15', label: '15m', color: '#6b7280' },
  { value: '30', label: '30m', color: '#6b7280' },
  { value: '60', label: '1h', color: '#6b7280' },
  { value: '240', label: '4h', color: '#6b7280' },
  { value: '1D', label: '1D', color: '#6b7280' },
];

interface TradingViewStyleChartProps {
  height?: number;
  defaultSymbol?: string;
  interval?: string;
}

export function TradingViewStyleChart({
  height = 500,
  defaultSymbol = 'NSE:NIFTY50-INDEX',
  interval = '15'
}: TradingViewStyleChartProps) {
  const chartContainer = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [crosshair, setCrosshair] = useState<{x: number, y: number, visible: boolean}>({x: 0, y: 0, visible: false});

  // Get current symbol info
  const currentSymbol = FYERS_SYMBOLS.find(s => s.value === selectedSymbol) || FYERS_SYMBOLS[0];

  // Fetch historical data with fallback dates
  const { data: historicalData, isLoading, refetch, error } = useQuery({
    queryKey: ['tradingview-chart-data', selectedSymbol, selectedInterval, lastUpdate.toISOString().split('T')[0]],
    queryFn: async () => {
      console.log(`📊 TradingView Chart: Fetching data for ${selectedSymbol} (${selectedInterval})`);
      
      // Try current date first, then fallback to previous trading days
      const datesToTry = [];
      const today = new Date(lastUpdate);
      
      // Add current date and previous 5 weekdays as fallback
      for (let i = 0; i < 7; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() - i);
        // Skip weekends for stock market data
        const dayOfWeek = testDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
          datesToTry.push(testDate.toISOString().split('T')[0]);
        }
        if (datesToTry.length >= 5) break; // Try up to 5 trading days
      }
      
      let lastError = null;
      
      for (const dateStr of datesToTry) {
        try {
          const requestBody = {
            symbol: selectedSymbol,
            resolution: selectedInterval === '1D' ? 'D' : selectedInterval,
            range_from: dateStr,
            range_to: dateStr
          };
          
          const response = await fetch('/api/historical-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data.candles && data.candles.length > 0) {
              console.log(`✅ Found data for ${dateStr}: ${data.candles.length} candles`);
              return data;
            }
          }
          
          lastError = new Error(`No data available for ${dateStr}`);
        } catch (err) {
          lastError = err;
          console.log(`❌ Failed to fetch data for ${dateStr}:`, err);
        }
      }
      
      // If all dates fail, throw the last error
      throw lastError || new Error('No historical data available for any recent trading days');
    },
    refetchInterval: 60000, // Refresh every minute instead of 30 seconds to reduce API load
    retry: 1, // Reduce retries since we already try multiple dates
  });

  // Fetch live market data for real-time price
  const { data: liveQuotes } = useQuery<any[]>({
    queryKey: ['/api/market-data'],
    refetchInterval: 5000,
    enabled: true,
    retry: 1,
  });

  // Find matching live data
  const liveData = liveQuotes?.find((item: any) => 
    item.symbol === selectedSymbol.split(':')[1]?.split('-')[0] || 
    item.code === selectedSymbol
  ) as any;

  // Professional TradingView-style chart rendering
  useEffect(() => {
    if (!chartContainer.current || !historicalData?.candles) return;

    const canvas = chartContainer.current.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = chartContainer.current.clientWidth;
      newCanvas.height = height - 140;
      newCanvas.style.cursor = 'crosshair';
      
      // Add mouse move handler for crosshair
      newCanvas.addEventListener('mousemove', (e) => {
        const rect = newCanvas.getBoundingClientRect();
        setCrosshair({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          visible: true
        });
      });
      
      newCanvas.addEventListener('mouseleave', () => {
        setCrosshair(prev => ({ ...prev, visible: false }));
      });
      
      chartContainer.current.appendChild(newCanvas);
      drawTradingViewChart(newCanvas, historicalData.candles);
    } else {
      canvas.width = chartContainer.current.clientWidth;
      canvas.height = height - 140;
      drawTradingViewChart(canvas, historicalData.candles);
    }
  }, [historicalData, height, crosshair]);

  const drawTradingViewChart = (canvas: HTMLCanvasElement, candles: any[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !candles.length) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // TradingView-style dark theme
    const theme = {
      background: '#131722',
      grid: '#2A2E39',
      text: '#D1D4DC',
      textSecondary: '#6C7883',
      green: '#089981',
      red: '#F23645',
      blue: '#2962FF',
      volume: '#434651'
    };

    // Clear canvas with dark background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 20, right: 80, bottom: 80, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom - 60; // Reserve space for volume
    const volumeHeight = 60;

    // Find price range
    const prices = candles.flatMap(c => [c.open, c.high, c.low, c.close]);
    const volumes = candles.map(c => c.volume || 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxVolume = Math.max(...volumes);
    const priceRange = maxPrice - minPrice;

    // Draw grid lines (TradingView style)
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    
    // Horizontal price grid
    for (let i = 0; i <= 8; i++) {
      const y = padding.top + (chartHeight * i / 8);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Price labels (TradingView style)
      const price = maxPrice - (priceRange * i / 8);
      ctx.fillStyle = theme.textSecondary;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      const priceText = price.toFixed(2);
      ctx.fillText(priceText, width - padding.right + 5, y + 4);
    }

    // Vertical time grid
    const visibleCandles = Math.min(candles.length, 80);
    const candleWidth = chartWidth / visibleCandles;
    const startIndex = Math.max(0, candles.length - visibleCandles);
    
    for (let i = 0; i < visibleCandles; i += Math.ceil(visibleCandles / 6)) {
      const x = padding.left + (i * candleWidth);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    // Draw candlesticks (TradingView style)
    for (let i = startIndex; i < candles.length; i++) {
      const candle = candles[i];
      const x = padding.left + ((i - startIndex) * candleWidth);
      const centerX = x + candleWidth / 2;
      
      // Calculate Y positions
      const highY = padding.top + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding.top + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * chartHeight;
      
      const isGreen = candle.close >= candle.open;
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);
      
      // Draw wick
      ctx.strokeStyle = isGreen ? theme.green : theme.red;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, highY);
      ctx.lineTo(centerX, lowY);
      ctx.stroke();
      
      // Draw body (TradingView style - filled for red, hollow for green)
      const candleBodyWidth = Math.max(1, candleWidth - 2);
      
      if (isGreen) {
        // Green candle - hollow
        ctx.strokeStyle = theme.green;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, bodyTop, candleBodyWidth, bodyHeight);
      } else {
        // Red candle - filled
        ctx.fillStyle = theme.red;
        ctx.fillRect(x + 1, bodyTop, candleBodyWidth, bodyHeight);
      }
    }

    // Draw volume bars at bottom
    const volumeStartY = height - padding.bottom + 10;
    for (let i = startIndex; i < candles.length; i++) {
      const candle = candles[i];
      const x = padding.left + ((i - startIndex) * candleWidth);
      const volume = candle.volume || 0;
      const barHeight = (volume / maxVolume) * volumeHeight;
      
      const isGreen = candle.close >= candle.open;
      ctx.fillStyle = isGreen ? theme.green + '60' : theme.red + '60';
      ctx.fillRect(x + 1, volumeStartY + volumeHeight - barHeight, candleWidth - 2, barHeight);
    }

    // Draw crosshair
    if (crosshair.visible) {
      ctx.strokeStyle = theme.textSecondary;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshair.x, padding.top);
      ctx.lineTo(crosshair.x, height - padding.bottom);
      ctx.stroke();
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padding.left, crosshair.y);
      ctx.lineTo(width - padding.right, crosshair.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }

    // Draw title and latest price (TradingView style)
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(currentSymbol.display, padding.left, 15);
    
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const isGreen = lastCandle.close >= lastCandle.open;
      ctx.fillStyle = isGreen ? theme.green : theme.red;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`₹${lastCandle.close.toFixed(2)}`, padding.left + 200, 15);
      
      // Change indicator
      const change = lastCandle.close - lastCandle.open;
      const changePercent = (change / lastCandle.open) * 100;
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(
        `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`,
        padding.left + 320,
        15
      );
    }

    // Volume label
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Volume', padding.left, volumeStartY - 5);
  };

  const handleRefresh = () => {
    setLastUpdate(new Date());
    refetch();
  };

  return (
    <div className="w-full h-full bg-[#131722] border border-gray-700 rounded-lg overflow-hidden">

      {/* TradingView-style Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-[#1E222D]">
        <div className="flex items-center gap-3">
          {/* Symbol Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search stocks (e.g., RELIANCE, NIFTY, TCS)"
              className="w-64 px-3 py-2 bg-[#131722] border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              onChange={(e) => {
                const searchTerm = e.target.value.toUpperCase();
                const foundSymbol = FYERS_SYMBOLS.find(s => 
                  s.label.includes(searchTerm) || s.display.toUpperCase().includes(searchTerm)
                );
                if (foundSymbol) {
                  setSelectedSymbol(foundSymbol.value);
                }
              }}
            />
          </div>

          <Separator orientation="vertical" className="h-6 bg-gray-600" />

          {/* Timeframe Buttons */}
          <div className="flex gap-1">
            {TIMEFRAMES.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={selectedInterval === timeframe.value ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 text-xs ${
                  selectedInterval === timeframe.value 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-300 hover:bg-[#2A2E39] hover:text-white'
                }`}
                onClick={() => setSelectedInterval(timeframe.value)}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-gray-300 hover:text-white hover:bg-[#2A2E39]">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-[#2A2E39]">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-[#2A2E39]">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-75 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              <div className="text-sm text-gray-400">Loading TradingView chart...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-75 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm text-red-400">Failed to load chart data</div>
              <div className="text-xs text-gray-500">Please try again</div>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="border-gray-600 text-gray-300 hover:text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        <div 
          ref={chartContainer} 
          className="w-full bg-[#131722]"
          style={{ height: height - 140 }}
        />
      </div>

      {/* TradingView-style Footer */}
      <div className="px-3 py-2 border-t border-gray-700 bg-[#1E222D]">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              <span>Real-time Fyers Data</span>
            </div>
            {historicalData?.candles && (
              <span>{historicalData.candles.length} candles • {selectedInterval} timeframe</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>NSE • Asia/Kolkata</span>
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}