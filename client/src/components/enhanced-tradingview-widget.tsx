import { useEffect, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface EnhancedTradingViewWidgetProps {
  height?: number;
  defaultSymbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
}

// NSE symbols that work well with TradingView
const NSE_SYMBOLS = [
  { value: 'NSE:NIFTY', label: 'NIFTY 50' },
  { value: 'NSE:RELIANCE', label: 'RELIANCE' },
  { value: 'NSE:INFY', label: 'INFOSYS' },
  { value: 'NSE:TCS', label: 'TCS' },
  { value: 'NSE:HDFCBANK', label: 'HDFC BANK' },
  { value: 'NSE:ICICIBANK', label: 'ICICI BANK' },
  { value: 'NSE:SBIN', label: 'SBI' },
  { value: 'NSE:LT', label: 'L&T' },
  { value: 'NSE:BHARTIARTL', label: 'BHARTI AIRTEL' },
  { value: 'NSE:WIPRO', label: 'WIPRO' },
];

const TIMEFRAMES = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
];

export function EnhancedTradingViewWidget({
  height = 380,
  defaultSymbol = 'NSE:NIFTY',
  interval = '15',
  theme = 'light'
}: EnhancedTradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!container.current) return;

    setIsLoading(true);
    
    // Clear previous widget
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    const widgetConfig = {
      autosize: false,
      width: "100%",
      height: height - 60, // Account for controls
      symbol: selectedSymbol,
      interval: selectedInterval,
      timezone: "Asia/Kolkata",
      theme: theme,
      style: "1",
      locale: "en",
      toolbar_bg: theme === 'light' ? "#f1f3f6" : "#2962FF",
      enable_publishing: false,
      allow_symbol_change: false, // We'll handle this with our own controls
      studies: [
        "Volume@tv-basicstudies"
      ],
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
      no_referral_id: false,
      withdateranges: true,
      hide_side_toolbar: false,
      details: true,
      hotlist: true,
      calendar: true,
      hide_legend: false,
      save_image: true,
      container_id: "enhanced_tradingview_widget"
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    script.onload = () => {
      setIsLoading(false);
    };

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [selectedSymbol, selectedInterval, height, theme]);

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Controls Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NSE_SYMBOLS.map((symbol) => (
                <SelectItem key={symbol.value} value={symbol.value}>
                  {symbol.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Timeframe Selector */}
          <div className="flex gap-1">
            {TIMEFRAMES.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={selectedInterval === timeframe.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setSelectedInterval(timeframe.value)}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {selectedSymbol.replace('NSE:', '')} • {selectedInterval}
          </span>
          <span className="text-xs text-green-600 font-medium">
            Live Data
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-sm text-gray-500">Loading TradingView chart...</div>
          </div>
        )}
        
        <div 
          ref={container} 
          className="tradingview-widget-container w-full"
          style={{ height: height - 60 }}
        />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>NSE Real-time Data • TradingView Professional Charts</span>
          <a 
            href={`https://www.tradingview.com/symbols/${selectedSymbol.replace(':', '-')}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View on TradingView →
          </a>
        </div>
      </div>
    </div>
  );
}