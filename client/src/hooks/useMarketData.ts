import { useState, useEffect } from "react";

export interface MarketDataResponse {
  [key: string]: {
    isUp: boolean;
    change: number;
  };
}

export function useMarketData(refreshInterval: number = 900000) { // Default 15 minutes (900000ms)
  const [marketData, setMarketData] = useState<MarketDataResponse>({
    USA: { isUp: true, change: 0 },
    CANADA: { isUp: true, change: 0 },
    INDIA: { isUp: true, change: 0 },
    "HONG KONG": { isUp: true, change: 0 },
    TOKYO: { isUp: true, change: 0 },
  });
  const [loading, setLoading] = useState(false);

  // Function to fetch real market data
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching real-time market data...');
      
      const response = await fetch('/api/market-indices');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.statusText}`);
      }
      
      const data: MarketDataResponse = await response.json();
      
      console.log('✅ Market data received:', data);
      setMarketData(data);
    } catch (error) {
      console.error('❌ Error fetching market data:', error);
      // Keep previous data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchMarketData();
    
    // Set up interval to fetch every refreshInterval milliseconds
    const interval = setInterval(() => {
      fetchMarketData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { marketData, loading };
}
