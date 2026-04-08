// @ts-ignore - smartapi-javascript doesn't have type declarations
import { WebSocketV2 } from 'smartapi-javascript';
import { Response } from 'express';
import { angelOneApi } from './angel-one-api';

// Exchange constants from Angel One SDK
const EXCHANGES = {
  nse_cm: 1,
  nse_fo: 2,
  bse_cm: 3,
  bse_fo: 4,
  mcx_fo: 5,
  ncx_fo: 7,
  cde_fo: 13
};

// Mode constants
const MODE = {
  LTP: 1,      // Last Traded Price
  QUOTE: 2,    // LTP + OHLC + Volume
  SNAP_QUOTE: 3,  // Full market depth snapshot
  DEPTH: 4     // Full market depth with 20 levels
};

// Action constants
const ACTION = {
  SUBSCRIBE: 1,
  UNSUBSCRIBE: 0
};

export interface WebSocketOHLC {
  symbol: string;
  symbolToken: string;
  exchange: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface WebSocketClient {
  id: string;
  res: Response;
  symbol: string;
  symbolToken: string;
  exchange: string;
}

interface SubscriptionInfo {
  symbolToken: string;
  exchange: number;
}

class AngelOneWebSocket {
  private ws: any = null;
  private clients = new Map<string, WebSocketClient>();
  private latestPrices = new Map<string, WebSocketOHLC>();
  private subscriptions = new Map<string, SubscriptionInfo>();
  private tickCallbacks = new Map<string, ((data: WebSocketOHLC) => void)[]>(); // Callbacks for tick data
  private broadcastInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000; // 30 seconds max delay
  private isConnected = false;
  private isConnecting = false;

  constructor() {
    console.log('🔶 [WEBSOCKET] Angel One WebSocket V2 service initialized');
  }

  async connect(jwtToken: string, apiKey: string, clientCode: string, feedToken: string): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      console.log('🔶 [WEBSOCKET] Already connected or connecting');
      return;
    }

    // Clear any pending reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      this.isConnecting = true;
      console.log('🔶 [WEBSOCKET] Connecting to Angel One WebSocket V2...');

      // Initialize WebSocket V2 connection using Angel One SDK
      this.ws = new WebSocketV2({
        jwttoken: jwtToken,
        apikey: apiKey,
        clientcode: clientCode,
        feedtype: feedToken
      });

      // Set up tick handler for receiving market data (BEFORE connect)
      this.ws.on('tick', (data: any) => {
        if (!data?.token) return;
        console.log('[WEBSOCKET] Tick received:', data.token);
        this.handleTick(data);
      });

      // Set up error handler
      this.ws.on('error', (error: any) => {
        console.error('❌ [WEBSOCKET] WebSocket error:', error?.message || String(error));
      });

      // Set up close handler
      this.ws.on('close', () => {
        console.log('🔶 [WEBSOCKET] WebSocket closed');
        this.isConnected = false;
        this.isConnecting = false;
        this.scheduleReconnect();
      });

      // Connect to WebSocket
      await this.ws.connect();
      
      // Connection successful - set connected flag and subscribe immediately
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log('✅ [WEBSOCKET] Connected, subscribing to symbols...');

      // Subscribe to all active symbols NOW that connection is ready
      if (this.subscriptions.size > 0) {
        this.subscribeToSymbols();
      }

      // Start 700ms broadcast interval
      if (!this.broadcastInterval) {
        this.startBroadcasting();
      }

    } catch (error: any) {
      console.error('❌ [WEBSOCKET] Failed to connect:', error?.message || String(error));
      this.isConnected = false;
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleTick(data: any): void {
    try {
      if (!data) return;

      // Data from Angel One WebSocket V2 is already parsed by the SDK
      // QUOTE mode provides: subscription_mode, exchange_type, token, last_traded_price, 
      // open_price_day, high_price_day, low_price_day, close_price, vol_traded
      
      const {
        token,
        exchange_type: exchangeType,
        last_traded_price: ltp,
        open_price_day: open,
        high_price_day: high,
        low_price_day: low,
        close_price: close,
        vol_traded: volume
      } = data;

      if (!token || !ltp) return;

      // Normalize token to string (remove quotes, whitespace)
      const normalizedToken = String(token).replace(/"/g, '').trim();

      // Find subscription by token - try multiple formats
      let symbolKey: string | null = null;
      let symbolData: SubscriptionInfo | undefined;

      const entries = Array.from(this.subscriptions.entries());
      for (const [key, sub] of entries) {
        const subToken = String(sub.symbolToken).replace(/"/g, '').trim();
        
        // Try exact match, number match, and string match
        if (subToken === normalizedToken || 
            subToken === String(token) ||
            parseInt(subToken) === parseInt(normalizedToken)) {
          symbolKey = key;
          symbolData = sub;
          console.log(`✅ [WS] Token match found: ${normalizedToken} -> ${key}`);
          break;
        }
      }

      if (!symbolKey || !symbolData) {
        console.debug(`⚠️ [WS] No subscription found for token: ${normalizedToken}. Available subscriptions: ${Array.from(this.subscriptions.values()).map(s => s.symbolToken).join(', ')}`);
        return;
      }

      // Parse prices (Angel One sends prices in paise, divide by 100)
      const priceDiv = 100;

      // Update latest price data
      const ohlcData: WebSocketOHLC = {
        symbol: symbolKey.split('_')[0],
        symbolToken: normalizedToken,
        exchange: this.getExchangeName(symbolData.exchange),
        time: Math.floor(Date.now() / 1000),
        open: open ? parseFloat(String(open)) / priceDiv : parseFloat(String(ltp)) / priceDiv,
        high: high ? parseFloat(String(high)) / priceDiv : parseFloat(String(ltp)) / priceDiv,
        low: low ? parseFloat(String(low)) / priceDiv : parseFloat(String(ltp)) / priceDiv,
        close: parseFloat(String(ltp)) / priceDiv,
        volume: volume ? parseFloat(String(volume)) : 0
      };

      this.latestPrices.set(symbolKey, ohlcData);
      console.log(`💹 [WS] ${ohlcData.symbol}: LTP=${ohlcData.close} O=${ohlcData.open} H=${ohlcData.high} L=${ohlcData.low} V=${ohlcData.volume}`);

      // Call tick callbacks for this symbol
      const callbacks = this.tickCallbacks.get(symbolKey);
      if (callbacks && callbacks.length > 0) {
        for (const callback of callbacks) {
          try {
            callback(ohlcData);
          } catch (cbError) {
            console.error(`[WEBSOCKET] Tick callback error for ${symbolKey}:`, cbError);
          }
        }
      }

    } catch (error: any) {
      console.error('[WEBSOCKET] Tick parse error:', error?.message, error?.stack);
    }
  }

  private getExchangeName(exchangeType: number): string {
    const exchanges: { [key: number]: string } = {
      1: 'NSE',
      2: 'NFO',
      3: 'BSE',
      4: 'BFO',
      5: 'MCX',
      7: 'NCX',
      13: 'CDS'
    };
    return exchanges[exchangeType] || 'NSE';
  }

  private getExchangeType(exchange: string): number {
    const exchanges: { [key: string]: number } = {
      'NSE': EXCHANGES.nse_cm,
      'NFO': EXCHANGES.nse_fo,
      'BSE': EXCHANGES.bse_cm,
      'BFO': EXCHANGES.bse_fo,
      'MCX': EXCHANGES.mcx_fo,
      'NCX': EXCHANGES.ncx_fo,
      'CDS': EXCHANGES.cde_fo
    };
    return exchanges[exchange.toUpperCase()] || EXCHANGES.nse_cm;
  }

  private subscribeToSymbols(): void {
    if (!this.ws || !this.isConnected) return;

    try {
      // Group subscriptions by exchange type
      const tokensByExchange = new Map<number, string[]>();

      const subscriptionEntries = Array.from(this.subscriptions.entries());
      for (const [key, sub] of subscriptionEntries) {
        const tokens = tokensByExchange.get(sub.exchange) || [];
        tokens.push(sub.symbolToken);
        tokensByExchange.set(sub.exchange, tokens);
      }

      // Subscribe to each exchange group using correct Angel One format
      const exchangeEntries = Array.from(tokensByExchange.entries());
      for (const [exchangeType, tokens] of exchangeEntries) {
        const subscriptionRequest = {
          correlationID: `journal_${Date.now()}`,
          action: ACTION.SUBSCRIBE,
          mode: MODE.QUOTE, // QUOTE mode for OHLC data
          exchangeType,
          tokens
        };

        console.log(`🔶 [WEBSOCKET] Subscribing to ${tokens.length} tokens on exchange ${exchangeType} with QUOTE mode`);
        this.ws.fetchData(subscriptionRequest);
      }

    } catch (error: any) {
      console.error('❌ [WEBSOCKET] Subscription error:', error?.message || String(error));
    }
  }

  private startBroadcasting(): void {
    console.log('📡 [WEBSOCKET] Starting 700ms broadcast interval');
    
    this.broadcastInterval = setInterval(() => {
      if (this.latestPrices.size === 0) return;

      this.clients.forEach((client) => {
        const key = `${client.symbol}_${client.symbolToken}`;
        const price = this.latestPrices.get(key);

        if (price && client.res.writable) {
          try {
            client.res.write(`data: ${JSON.stringify(price)}\n\n`);
          } catch (error) {
            console.debug('[WEBSOCKET] Failed to send to client');
          }
        }
      });
    }, 700); // 700ms interval as requested
  }

  addClient(
    clientId: string,
    res: Response,
    symbol: string,
    symbolToken: string,
    exchange: string,
    initialData?: WebSocketOHLC
  ): void {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Store client
    const client: WebSocketClient = {
      id: clientId,
      res,
      symbol,
      symbolToken,
      exchange
    };

    this.clients.set(clientId, client);
    console.log(`🔶 [WEBSOCKET] Client ${clientId} connected for ${symbol} (Total: ${this.clients.size})`);

    // Store initial data if provided (for fallback scenario)
    const key = `${symbol}_${symbolToken}`;
    if (initialData) {
      this.latestPrices.set(key, initialData);
      
      // Send initial SSE event immediately
      try {
        res.write(`data: ${JSON.stringify(initialData)}\n\n`);
        console.log(`✅ [WEBSOCKET] Sent initial data to client ${clientId}`);
      } catch (error) {
        console.debug('[WEBSOCKET] Failed to send initial data');
      }
    }

    // Add to subscriptions
    const exchangeType = this.getExchangeType(exchange);
    this.subscriptions.set(key, { symbolToken, exchange: exchangeType });

    // Subscribe if WebSocket is connected
    if (this.isConnected && this.ws) {
      this.subscribeToSymbols();
    } else {
      // Try to connect if not connected
      this.ensureConnection();
    }

    // Handle client disconnect
    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.clients.delete(clientId);
    console.log(`🔶 [WEBSOCKET] Client ${clientId} disconnected (Remaining: ${this.clients.size})`);

    // Check if any other clients need this subscription
    const key = `${client.symbol}_${client.symbolToken}`;
    const hasOtherClients = Array.from(this.clients.values()).some(
      c => `${c.symbol}_${c.symbolToken}` === key
    );

    if (!hasOtherClients) {
      this.subscriptions.delete(key);
      this.latestPrices.delete(key);
      console.log(`🔶 [WEBSOCKET] Removed subscription for ${key}`);
    }

    // Stop broadcasting if no clients
    if (this.clients.size === 0 && this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      console.log('📡 [WEBSOCKET] Stopped broadcasting (no clients)');
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.isConnected || this.isConnecting) return;

    // Try to get session data from angelOneApi
    const session = angelOneApi.getSession();
    if (!session) {
      console.log('⚠️ [WEBSOCKET] No Angel One session available');
      return;
    }

    const credentials = angelOneApi.getCredentials();
    if (!credentials) {
      console.log('⚠️ [WEBSOCKET] No Angel One credentials available');
      return;
    }

    await this.connect(
      session.jwtToken,
      credentials.apiKey,
      credentials.clientCode,
      session.feedToken
    );
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const delay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      this.maxReconnectDelay
    );

    console.log(`🔶 [WEBSOCKET] Scheduling reconnect in ${Math.round(delay/1000)}s (attempt ${this.reconnectAttempts + 1})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.ensureConnection();
    }, delay);
  }

  getStatus(): { connected: boolean; clients: number; subscriptions: number; symbols: string[] } {
    return {
      connected: this.isConnected,
      clients: this.clients.size,
      subscriptions: this.subscriptions.size,
      symbols: Array.from(this.subscriptions.keys())
    };
  }

  // Get latest prices for specific tokens (used for live-indices endpoint)
  getLatestPrices(tokens: string[]): Map<string, WebSocketOHLC> {
    const prices = new Map<string, WebSocketOHLC>();
    
    for (const token of tokens) {
      // Find by token in latestPrices
      let found = false;
      for (const [key, price] of this.latestPrices.entries()) {
        if (price.symbolToken === token) {
          prices.set(token, price);
          found = true;
          break;
        }
      }
      
      if (!found) {
        // Check if subscription exists but no price yet
        const hasSubscription = Array.from(this.subscriptions.values()).some(
          sub => sub.symbolToken === token
        );
        if (hasSubscription) {
          console.log(`⏳ [WEBSOCKET] Token ${token} subscribed but no price data yet`);
        }
      }
    }
    
    return prices;
  }

  // Subscribe to live index prices (BANKNIFTY, SENSEX, GOLD, SILVER, CRUDEOIL, NATURALGAS)
  subscribeToLiveIndices(): void {
    const indices = [
      { symbol: 'BANKNIFTY',  token: '99926009', exchange: 'NSE' },
      { symbol: 'SENSEX',     token: '99919000', exchange: 'BSE' },
      { symbol: 'GOLD',       token: '99920003', exchange: 'MCX' },
      { symbol: 'SILVER',     token: '99920004', exchange: 'MCX' },
      { symbol: 'CRUDEOIL',   token: '99920001', exchange: 'MCX' },
      { symbol: 'NATURALGAS', token: '99920002', exchange: 'MCX' },
    ];

    for (const idx of indices) {
      const key = `${idx.symbol}_${idx.token}`;
      const exchangeType = this.getExchangeType(idx.exchange);
      
      // Add to subscriptions
      this.subscriptions.set(key, { symbolToken: idx.token, exchange: exchangeType });
      console.log(`📊 [WEBSOCKET] Added live index subscription: ${idx.symbol} (${idx.token})`);
    }

    // Subscribe if connected
    if (this.isConnected && this.ws) {
      this.subscribeToSymbols();
    }
  }

  // Subscribe to a symbol with a callback for tick data (used by journal chart)
  subscribe(exchange: string, symbolToken: string, tradingSymbol: string, callback: (data: WebSocketOHLC) => void): void {
    const key = `${tradingSymbol}_${symbolToken}`;
    const exchangeType = this.getExchangeType(exchange);
    
    console.log(`📊 [WEBSOCKET] Subscribe request: ${tradingSymbol} (${symbolToken}) on ${exchange}`);
    
    // Add to subscriptions
    this.subscriptions.set(key, { symbolToken, exchange: exchangeType });
    
    // Add callback to the callbacks list
    const existingCallbacks = this.tickCallbacks.get(key) || [];
    existingCallbacks.push(callback);
    this.tickCallbacks.set(key, existingCallbacks);
    
    console.log(`📊 [WEBSOCKET] Added subscription: ${key} with callback (total callbacks: ${existingCallbacks.length})`);
    
    // Subscribe if WebSocket is connected
    if (this.isConnected && this.ws) {
      this.subscribeToSymbols();
    } else {
      // Try to connect if not connected
      this.ensureConnection();
    }
  }

  disconnect(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        console.debug('[WEBSOCKET] Error closing WebSocket');
      }
      this.ws = null;
    }

    this.clients.clear();
    this.subscriptions.clear();
    this.latestPrices.clear();
    this.tickCallbacks.clear();
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    console.log('🔶 [WEBSOCKET] Disconnected and cleaned up');
  }
}

export const angelOneWebSocket = new AngelOneWebSocket();
