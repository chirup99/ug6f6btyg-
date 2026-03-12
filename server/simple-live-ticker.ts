import { Response } from 'express';

export interface LivePrice {
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

interface ClientConnection {
  id: string;
  res: Response;
  symbol: string;
  lastPrice: LivePrice;
}

class SimpleLiveTicker {
  private clients = new Map<string, ClientConnection>();
  private broadcastInterval: NodeJS.Timeout | null = null;

  addClient(clientId: string, res: Response, initialPrice: LivePrice): void {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Store client
    const client: ClientConnection = {
      id: clientId,
      res,
      symbol: initialPrice.symbol,
      lastPrice: initialPrice
    };

    this.clients.set(clientId, client);
    console.log(`📡 [TICKER] Client connected: ${clientId} for ${initialPrice.symbol} (Total: ${this.clients.size})`);

    // Send initial data immediately
    try {
      res.write(`data: ${JSON.stringify(initialPrice)}\n\n`);
      console.log(`✅ [TICKER] Sent initial price to ${clientId}`);
    } catch (error) {
      console.error(`❌ [TICKER] Failed to send initial price`);
    }

    // Start broadcast if not running
    if (!this.broadcastInterval) {
      this.startBroadcast();
    }

    // Handle disconnect
    res.on('close', () => {
      this.removeClient(clientId);
    });
  }

  private startBroadcast(): void {
    console.log('📡 [TICKER] Starting 700ms live price broadcast');
    
    let broadcastCount = 0;
    this.broadcastInterval = setInterval(() => {
      broadcastCount++;
      const activeClients = this.clients.size;
      
      if (broadcastCount % 10 === 1) { // Log every 10 broadcasts (every 7 seconds)
        console.log(`📡 [TICKER] Broadcast cycle ${broadcastCount} to ${activeClients} clients`);
      }
      
      this.clients.forEach((client) => {
        try {
          // Generate realistic price movement (0.01% - 0.05% change)
          const changePercent = (Math.random() - 0.5) * 0.001;
          const lastClose = client.lastPrice.close;
          const newClose = lastClose * (1 + changePercent);
          
          // Update OHLC
          const newPrice: LivePrice = {
            ...client.lastPrice,
            time: Math.floor(Date.now() / 1000),
            open: client.lastPrice.open, // Keep initial open
            high: Math.max(client.lastPrice.high, newClose),
            low: Math.min(client.lastPrice.low, newClose),
            close: newClose,
            volume: (client.lastPrice.volume || 0) + Math.floor(Math.random() * 1000)
          };

          // Update cached price
          client.lastPrice = newPrice;

          // Send to client in proper SSE format
          if (client.res.writable) {
            client.res.write(`data: ${JSON.stringify(newPrice)}\n\n`);
          } else {
            console.log(`⚠️ [TICKER] Client ${client.id} not writable`);
          }
        } catch (error) {
          console.error(`❌ [TICKER] Failed to send price to ${client.id}:`, error instanceof Error ? error.message : String(error));
        }
      });
    }, 700); // 700ms as requested
  }

  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.clients.delete(clientId);
    console.log(`📡 [TICKER] Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);

    // Stop broadcast if no clients
    if (this.clients.size === 0 && this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      console.log('📡 [TICKER] Stopped broadcast (no clients)');
    }
  }

  getStatus(): { active: boolean; clients: number; symbols: string[] } {
    return {
      active: this.clients.size > 0,
      clients: this.clients.size,
      symbols: Array.from(new Set(Array.from(this.clients.values()).map(c => c.symbol)))
    };
  }

  disconnect(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    this.clients.clear();
    console.log('📡 [TICKER] Disconnected');
  }
}

export const simpleLiveTicker = new SimpleLiveTicker();
