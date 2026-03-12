import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  interval?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  container_id?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewWidget({
  symbol = "NSE:NIFTY",
  width = "100%",
  height = 400,
  interval = "D",
  timezone = "Asia/Kolkata",
  theme = "light",
  style = "1",
  locale = "en",
  toolbar_bg = "#f1f3f6",
  enable_publishing = false,
  hide_side_toolbar = false,
  allow_symbol_change = true,
  container_id = "tradingview_widget"
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": interval,
      "timezone": timezone,
      "theme": theme,
      "style": style,
      "locale": locale,
      "toolbar_bg": toolbar_bg,
      "enable_publishing": enable_publishing,
      "hide_side_toolbar": hide_side_toolbar,
      "allow_symbol_change": allow_symbol_change,
      "container_id": container_id
    });

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, interval, timezone, theme, style, locale, toolbar_bg, enable_publishing, hide_side_toolbar, allow_symbol_change, container_id]);

  return (
    <div className="tradingview-widget-container" style={{ height, width }}>
      <div 
        ref={containerRef}
        id={container_id}
        style={{ height: '100%', width: '100%' }}
      />
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default TradingViewWidget;