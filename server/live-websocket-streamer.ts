import { angelOneApi } from "./angel-one-api";
import { broadcastToSSEClients } from "./live-price-routes";
import { WebSocket } from "ws";

export interface LivePriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  lastUpdate: string;
  isLive: boolean;
  source: 'websocket' | 'quotes' | 'fallback' | 'angelone';
  isMarketOpen?: boolean;
}

export interface OHLCBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  isComplete: boolean;
}

// Angel One stock token mappings for live price streaming
const ANGEL_ONE_STOCK_TOKENS: { [key: string]: { token: string; exchange: string; tradingSymbol: string } } = {
  'RELIANCE': { token: '2885', exchange: 'NSE', tradingSymbol: 'RELIANCE-EQ' },
  'TCS': { token: '11536', exchange: 'NSE', tradingSymbol: 'TCS-EQ' },
  'HDFCBANK': { token: '1333', exchange: 'NSE', tradingSymbol: 'HDFCBANK-EQ' },
  'ICICIBANK': { token: '4963', exchange: 'NSE', tradingSymbol: 'ICICIBANK-EQ' },
  'INFY': { token: '1594', exchange: 'NSE', tradingSymbol: 'INFY-EQ' },
  'ITC': { token: '1660', exchange: 'NSE', tradingSymbol: 'ITC-EQ' },
  'HINDUNILVR': { token: '1394', exchange: 'NSE', tradingSymbol: 'HINDUNILVR-EQ' },
  'SBIN': { token: '3045', exchange: 'NSE', tradingSymbol: 'SBIN-EQ' },
  'BHARTIARTL': { token: '10604', exchange: 'NSE', tradingSymbol: 'BHARTIARTL-EQ' },
  'KOTAKBANK': { token: '1922', exchange: 'NSE', tradingSymbol: 'KOTAKBANK-EQ' },
  'LT': { token: '11483', exchange: 'NSE', tradingSymbol: 'LT-EQ' },
  'AXISBANK': { token: '5900', exchange: 'NSE', tradingSymbol: 'AXISBANK-EQ' },
  'MARUTI': { token: '10999', exchange: 'NSE', tradingSymbol: 'MARUTI-EQ' },
  'ASIANPAINT': { token: '236', exchange: 'NSE', tradingSymbol: 'ASIANPAINT-EQ' },
  'TITAN': { token: '3506', exchange: 'NSE', tradingSymbol: 'TITAN-EQ' },
  'SUNPHARMA': { token: '3351', exchange: 'NSE', tradingSymbol: 'SUNPHARMA-EQ' },
  'WIPRO': { token: '3787', exchange: 'NSE', tradingSymbol: 'WIPRO-EQ' },
  'TATAMOTORS': { token: '3456', exchange: 'NSE', tradingSymbol: 'TATAMOTORS-EQ' },
  'TATASTEEL': { token: '3499', exchange: 'NSE', tradingSymbol: 'TATASTEEL-EQ' },
  'ADANIENT': { token: '25', exchange: 'NSE', tradingSymbol: 'ADANIENT-EQ' },
  'BAJFINANCE': { token: '317', exchange: 'NSE', tradingSymbol: 'BAJFINANCE-EQ' },
  'NIFTY50': { token: '99926000', exchange: 'NSE', tradingSymbol: 'Nifty 50' },
  'BANKNIFTY': { token: '99926009', exchange: 'NSE', tradingSymbol: 'Nifty Bank' },
};

export class LiveWebSocketStreamer {
  private connections = new Set<WebSocket>();
  private priceData = new Map<string, LivePriceData>();
  private ohlcBars = new Map<string, OHLCBar[]>(); // Ring buffer for each symbol
  private currentBars = new Map<string, OHLCBar>(); // Current incomplete bars
  private healthStatus = {
    websocketConnected: false,
    quotesApiWorking: false,
    lastSuccessfulUpdate: 0,
    connectionAttempts: 0,
    errors: [] as string[],
    dataSource: 'angelone' as 'angelone' | 'fallback'
  };
  
  private reconnectTimer: NodeJS.Timeout | null = null;
  private streamingTimer: NodeJS.Timeout | null = null;
  private quotesBackupTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private backoffDelay = 1000; // Start with 1 second
  private maxBackoffDelay = 30000; // Max 30 seconds
  
  // Symbols to track (using simple names for Angel One)
  private readonly symbols = [
    'RELIANCE', 
    'TCS', 
    'INFY', 
    'HDFCBANK', 
    'ICICIBANK', 
    'ITC'
  ];
  
  private readonly maxBarsPerSymbol = 500; // Ring buffer size
  
  constructor() {
    console.log('🚀 Live WebSocket Streamer initialized for real-time price streaming (Angel One API)');
    this.initializePriceData();
    this.startStreaming();
  }

  private async initializePriceData() {
    console.log('🚀 Initializing with Angel One API prices...');
    
    // Initialize with Angel One real data
    try {
      if (angelOneApi.isConnected()) {
        const symbolsData = this.symbols
          .filter(s => ANGEL_ONE_STOCK_TOKENS[s])
          .map(s => ({
            exchange: ANGEL_ONE_STOCK_TOKENS[s].exchange,
            tradingSymbol: ANGEL_ONE_STOCK_TOKENS[s].tradingSymbol,
            symbolToken: ANGEL_ONE_STOCK_TOKENS[s].token
          }));
        
        const quotes = await angelOneApi.getQuotes(symbolsData);
        
        if (quotes && quotes.length > 0) {
          const marketOpen = this.isMarketHours();
          quotes.forEach(quote => {
            const nseSymbol = `NSE:${quote.tradingSymbol}`;
            const displayPrice = marketOpen ? quote.ltp : quote.close;
            this.priceData.set(nseSymbol, {
              symbol: nseSymbol,
              price: displayPrice,
              change: parseFloat((quote.change || 0).toFixed(2)),
              changePercent: parseFloat((quote.changePercent || 0).toFixed(2)),
              volume: quote.volume,
              timestamp: Math.floor(Date.now() / 1000),
              open: quote.open,
              high: quote.high,
              low: quote.low,
              close: quote.close || quote.ltp,
              lastUpdate: new Date().toISOString(),
              isLive: marketOpen,
              source: 'angelone',
              isMarketOpen: marketOpen
            });
            
            this.ohlcBars.set(nseSymbol, []);
            this.currentBars.set(nseSymbol, this.createNewBar(nseSymbol, quote.ltp));
          });
          
          console.log(`✅ Initialized ${quotes.length} symbols with real Angel One prices (Market: ${marketOpen ? 'OPEN' : 'CLOSED'})`);
          this.healthStatus.dataSource = 'angelone';
          return;
        }
      } else {
        console.log('⚠️ Angel One not connected, waiting for authentication...');
      }
    } catch (error) {
      console.log('⚠️ Failed to initialize with Angel One prices, using minimal fallback');
    }
    
    // Only use minimal fallback if real data fails
    const marketOpen = this.isMarketHours();
    this.symbols.forEach(symbol => {
      const tokenData = ANGEL_ONE_STOCK_TOKENS[symbol];
      const nseSymbol = tokenData ? `NSE:${tokenData.tradingSymbol}` : `NSE:${symbol}-EQ`;
      this.priceData.set(nseSymbol, {
        symbol: nseSymbol,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: Math.floor(Date.now() / 1000),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        lastUpdate: new Date().toISOString(),
        isLive: false,
        source: 'fallback',
        isMarketOpen: marketOpen
      });
      
      this.ohlcBars.set(nseSymbol, []);
      this.currentBars.set(nseSymbol, this.createNewBar(nseSymbol, 0));
    });
    this.healthStatus.dataSource = 'fallback';
  }

  private createNewBar(symbol: string, price: number): OHLCBar {
    const now = Math.floor(Date.now() / 1000);
    const barTimestamp = Math.floor(now / 60) * 60; // Round to minute
    
    return {
      timestamp: barTimestamp,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
      symbol,
      isComplete: false
    };
  }

  private isMarketHours(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const dayOfWeek = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const marketStart = 9 * 60 + 15; // 9:15 AM in minutes
    const marketEnd = 15 * 60 + 30;  // 3:30 PM in minutes
    const currentTime = hour * 60 + minute;
    
    return currentTime >= marketStart && currentTime <= marketEnd;
  }

  async startStreaming() {
    console.log('📡 Starting live price streaming system...');
    
    // Try WebSocket first
    await this.connectWebSocket();
    
    // Start quotes API backup (every 2 seconds)
    this.startQuotesBackup();
    
    // Start SSE broadcasting (every 700ms as requested)
    this.startSSEBroadcasting();
  }

  private async connectWebSocket() {
    if (this.isConnecting) {
      return;
    }
    
    this.isConnecting = true;
    this.healthStatus.connectionAttempts++;
    
    try {
      console.log('🔌 Attempting connection to Angel One market data API...');
      
      // Use Angel One API for real-time data
      await this.initializeAngelOneConnection();
      
    } catch (error: any) {
      console.error('❌ Angel One connection failed:', error.message);
      this.healthStatus.errors.push(`AngelOne: ${error.message}`);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  private async initializeAngelOneConnection() {
    // Use Angel One API data for real-time prices
    this.healthStatus.websocketConnected = false;
    this.backoffDelay = 1000; // Reset backoff
    
    if (angelOneApi.isConnected()) {
      console.log('✅ Real-time Angel One API connection established');
      this.healthStatus.dataSource = 'angelone';
    } else {
      console.log('⚠️ Angel One not authenticated yet, will retry...');
    }
    
    // Start using real Angel One API data as primary source
    this.startRealDataStreaming();
  }

  private startRealDataStreaming() {
    // Use real Angel One API data as primary streaming source
    console.log('🚀 Starting real-time Angel One API data streaming...');
    
    // Initialize with immediate fetch, then continue with regular intervals
    this.fetchRealTimeData();
    
    const updateInterval = setInterval(() => {
      this.fetchRealTimeData();
    }, 2000); // Update every 2 seconds with real Angel One data
    
    // Store interval for cleanup
    this.streamingTimer = updateInterval;
  }

  private async fetchRealTimeData() {
    // Check if Angel One is connected
    if (!angelOneApi.isConnected()) {
      console.log('⏳ Waiting for Angel One authentication...');
      return;
    }
    
    const marketOpen = this.isMarketHours();
    
    try {
      console.log('📡 Fetching real-time data from Angel One API...');
      
      const symbolsData = this.symbols
        .filter(s => ANGEL_ONE_STOCK_TOKENS[s])
        .map(s => ({
          exchange: ANGEL_ONE_STOCK_TOKENS[s].exchange,
          tradingSymbol: ANGEL_ONE_STOCK_TOKENS[s].tradingSymbol,
          symbolToken: ANGEL_ONE_STOCK_TOKENS[s].token
        }));
      
      const quotes = await angelOneApi.getQuotes(symbolsData);
      
      if (quotes && quotes.length > 0) {
        this.healthStatus.quotesApiWorking = true;
        this.healthStatus.dataSource = 'angelone';
        
        quotes.forEach(quote => {
          const nseSymbol = `NSE:${quote.tradingSymbol}`;
          const displayPrice = marketOpen ? quote.ltp : quote.close;
          const updatedData: LivePriceData = {
            symbol: nseSymbol,
            price: displayPrice,
            change: parseFloat((quote.change || 0).toFixed(2)),
            changePercent: parseFloat((quote.changePercent || 0).toFixed(2)),
            volume: quote.volume,
            timestamp: Math.floor(Date.now() / 1000),
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close || quote.ltp,
            lastUpdate: new Date().toISOString(),
            isLive: marketOpen,
            source: 'angelone',
            isMarketOpen: marketOpen
          };
          
          this.priceData.set(nseSymbol, updatedData);
          this.updateOHLCBar(nseSymbol, quote.ltp, quote.volume);
        });
        
        this.healthStatus.lastSuccessfulUpdate = Date.now();
        console.log(`✅ Updated ${quotes.length} symbols with real Angel One data (Market: ${marketOpen ? 'OPEN' : 'CLOSED'})`);
      }
    } catch (error: any) {
      console.log('⚠️ Real-time Angel One data fetch failed:', error.message);
      this.healthStatus.quotesApiWorking = false;
      this.healthStatus.dataSource = 'fallback';
      this.healthStatus.errors.push(`RealTime: ${error.message}`);
    }
  }

  private simulateLivePriceUpdates() {
    // DEPRECATED: This method is no longer used - replaced with real Angel One API data
    console.log('⚠️ Simulated price updates are disabled - using real Angel One API data');
  }

  private updatePriceData(symbol: string, price: number, volume: number) {
    const currentData = this.priceData.get(symbol);
    if (!currentData) return;
    
    const change = price - currentData.open;
    const changePercent = (change / currentData.open) * 100;
    
    // Update price data
    const updatedData: LivePriceData = {
      ...currentData,
      price,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: currentData.volume + volume,
      high: Math.max(currentData.high, price),
      low: Math.min(currentData.low, price),
      close: price,
      timestamp: Math.floor(Date.now() / 1000),
      lastUpdate: new Date().toISOString(),
      isLive: true,
      source: 'websocket'
    };
    
    this.priceData.set(symbol, updatedData);
    
    // Update OHLC bar
    this.updateOHLCBar(symbol, price, volume);
    
    this.healthStatus.lastSuccessfulUpdate = Date.now();
  }

  private updateOHLCBar(symbol: string, price: number, volume: number) {
    const currentBar = this.currentBars.get(symbol);
    if (!currentBar) return;
    
    const now = Math.floor(Date.now() / 1000);
    const barTimestamp = Math.floor(now / 60) * 60;
    
    // Check if we need a new bar (new minute)
    if (barTimestamp > currentBar.timestamp) {
      // Complete the current bar
      currentBar.isComplete = true;
      this.addCompletedBar(symbol, currentBar);
      
      // Create new bar
      const newBar = this.createNewBar(symbol, price);
      this.currentBars.set(symbol, newBar);
    } else {
      // Update current bar
      currentBar.high = Math.max(currentBar.high, price);
      currentBar.low = Math.min(currentBar.low, price);
      currentBar.close = price;
      currentBar.volume += volume;
    }
  }

  private addCompletedBar(symbol: string, bar: OHLCBar) {
    const bars = this.ohlcBars.get(symbol) || [];
    bars.push(bar);
    
    // Maintain ring buffer size
    if (bars.length > this.maxBarsPerSymbol) {
      bars.shift();
    }
    
    this.ohlcBars.set(symbol, bars);
  }

  private async startQuotesBackup() {
    // DEPRECATED: This backup method is no longer needed since Angel One API is the primary data source
    console.log('✅ Angel One API is the primary data source - backup not needed');
  }

  private startSSEBroadcasting() {
    // Broadcast to SSE clients every 700ms
    const broadcastInterval = setInterval(() => {
      const priceUpdate = {
        type: 'price_update',
        data: Array.from(this.priceData.values()),
        timestamp: new Date().toISOString(),
        health: this.getHealthStatus()
      };
      
      this.broadcast(priceUpdate);
    }, 700);
    
    // Store for cleanup
    this.streamingTimer = broadcastInterval;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    console.log(`🔄 Reconnecting WebSocket in ${this.backoffDelay}ms...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, this.backoffDelay);
    
    // Exponential backoff
    this.backoffDelay = Math.min(this.backoffDelay * 2, this.maxBackoffDelay);
  }

  // WebSocket connection management
  addConnection(ws: WebSocket) {
    this.connections.add(ws);
    console.log(`📡 SSE client connected. Total connections: ${this.connections.size}`);
    
    // Send initial data
    this.sendToClient(ws, {
      type: 'connection',
      status: 'connected',
      message: 'Live price streaming activated',
      data: Array.from(this.priceData.values()),
      health: this.getHealthStatus()
    });
  }

  removeConnection(ws: WebSocket) {
    this.connections.delete(ws);
    console.log(`📡 SSE client disconnected. Total connections: ${this.connections.size}`);
  }

  private sendToClient(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  broadcast(data: any) {
    // Send to WebSocket connections
    this.connections.forEach(ws => {
      this.sendToClient(ws, data);
    });
    
    // Also broadcast to SSE clients with correct payload format
    if (data.type === 'price_update' && data.data) {
      // Convert Array of price data to Object keyed by symbol for SSE clients
      const pricesBySymbol: { [key: string]: any } = {};
      data.data.forEach((priceData: any) => {
        pricesBySymbol[priceData.symbol] = priceData;
      });
      
      broadcastToSSEClients(pricesBySymbol);
    }
  }

  // Public API methods
  getPriceData(): LivePriceData[] {
    return Array.from(this.priceData.values());
  }

  getSymbolData(symbol: string): LivePriceData | null {
    return this.priceData.get(symbol) || null;
  }

  getOHLCBars(symbol: string, limit: number = 100): OHLCBar[] {
    const bars = this.ohlcBars.get(symbol) || [];
    return bars.slice(-limit); // Return last N bars
  }

  getHealthStatus() {
    const now = Date.now();
    const timeSinceUpdate = now - this.healthStatus.lastSuccessfulUpdate;
    
    return {
      ...this.healthStatus,
      isHealthy: timeSinceUpdate < 5000, // Healthy if updated within 5 seconds
      timeSinceLastUpdate: timeSinceUpdate,
      isMarketHours: this.isMarketHours(),
      activeConnections: this.connections.size,
      totalSymbols: this.symbols.length
    };
  }

  // Public method to check if market is open
  isMarketOpen(): boolean {
    return this.isMarketHours();
  }

  // Called when Angel One authentication succeeds - triggers immediate data fetch
  async onAngelOneAuthenticated() {
    console.log('🔔 Angel One authentication detected - triggering price fetch...');
    this.healthStatus.dataSource = 'angelone';
    
    // Force fetch real-time data immediately (bypassing market hours check for initial load)
    await this.forceInitialFetch();
    
    // Also reinitialize with Angel One data
    await this.initializePriceData();
    
    console.log('✅ Angel One price streaming activated');
  }

  // Force initial fetch - used when Angel One authenticates (ignores market hours for initial load)
  private async forceInitialFetch() {
    if (!angelOneApi.isConnected()) {
      console.log('⚠️ Cannot force fetch - Angel One not connected');
      return;
    }
    
    try {
      console.log('📡 Force fetching initial data from Angel One API...');
      
      const symbolsData = this.symbols
        .filter(s => ANGEL_ONE_STOCK_TOKENS[s])
        .map(s => ({
          exchange: ANGEL_ONE_STOCK_TOKENS[s].exchange,
          tradingSymbol: ANGEL_ONE_STOCK_TOKENS[s].tradingSymbol,
          symbolToken: ANGEL_ONE_STOCK_TOKENS[s].token
        }));
      
      console.log(`📊 Requesting quotes for ${symbolsData.length} symbols:`, symbolsData.map(s => s.tradingSymbol));
      
      const quotes = await angelOneApi.getQuotes(symbolsData);
      
      if (quotes && quotes.length > 0) {
        this.healthStatus.quotesApiWorking = true;
        this.healthStatus.dataSource = 'angelone';
        
        quotes.forEach(quote => {
          const nseSymbol = `NSE:${quote.tradingSymbol}`;
          const marketOpen = this.isMarketHours();
          const displayPrice = marketOpen ? quote.ltp : quote.close;
          const updatedData: LivePriceData = {
            symbol: nseSymbol,
            price: displayPrice,
            change: parseFloat((quote.change || 0).toFixed(2)),
            changePercent: parseFloat((quote.changePercent || 0).toFixed(2)),
            volume: quote.volume || 0,
            timestamp: Math.floor(Date.now() / 1000),
            open: quote.open || quote.ltp,
            high: quote.high || quote.ltp,
            low: quote.low || quote.ltp,
            close: quote.close || quote.ltp,
            lastUpdate: new Date().toISOString(),
            isLive: marketOpen,
            source: 'angelone',
            isMarketOpen: marketOpen
          };
          
          this.priceData.set(nseSymbol, updatedData);
          this.updateOHLCBar(nseSymbol, quote.ltp, quote.volume || 0);
        });
        
        this.healthStatus.lastSuccessfulUpdate = Date.now();
        console.log(`✅ Initial fetch: Updated ${quotes.length} symbols with Angel One data`);
      } else {
        console.log('⚠️ No quotes returned from Angel One API');
      }
    } catch (error: any) {
      console.error('❌ Force initial fetch failed:', error.message);
      this.healthStatus.errors.push(`InitialFetch: ${error.message}`);
    }
  }

  // Cleanup
  stop() {
    console.log('🛑 Stopping live WebSocket streamer...');
    
    if (this.streamingTimer) {
      clearInterval(this.streamingTimer);
    }
    
    if (this.quotesBackupTimer) {
      clearInterval(this.quotesBackupTimer);
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.connections.clear();
    this.healthStatus.websocketConnected = false;
  }
}

// Global instance
export const liveWebSocketStreamer = new LiveWebSocketStreamer();