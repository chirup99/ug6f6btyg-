import axios from 'axios';
import crypto from 'crypto';
import type { BrokerTrade } from "@shared/schema";

export interface DeltaOrder {
  id: number;
  product_symbol: string;
  side: 'buy' | 'sell';
  order_type: string;
  limit_price: string;
  size: number;
  state: string;
  created_at: string;
}

function generateSignature(secret: string, message: string) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

export async function fetchDeltaTrades(apiKey: string, apiSecret: string): Promise<BrokerTrade[]> {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/v2/orders/history';
    const query = '?page_size=50';
    const payload = '';
    
    const signatureData = method + timestamp + path + query + payload;
    const signature = generateSignature(apiSecret, signatureData);

    const response = await axios.get(`https://api.india.delta.exchange${path}${query}`, {
      headers: {
        'api-key': apiKey,
        'timestamp': timestamp,
        'signature': signature,
        'User-Agent': 'replit-agent',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (!response.data.success) return [];

    const orders: DeltaOrder[] = response.data.result || [];
    return orders.map(order => {
      // Delta's created_at is in microseconds (as seen in some docs) or milliseconds.
      // Based on common patterns, if it's a large number, it's likely microseconds or milliseconds.
      const timestamp = parseInt(order.created_at);
      let date: Date;
      
      if (timestamp > 1e12 && timestamp < 1e14) {
        // Milliseconds
        date = new Date(timestamp);
      } else if (timestamp > 1e15) {
        // Microseconds
        date = new Date(timestamp / 1000);
      } else {
        // Seconds
        date = new Date(timestamp * 1000);
      }

      return {
        broker: 'delta' as any,
        tradeId: order.id.toString(),
        symbol: order.product_symbol,
        action: order.side.toUpperCase() as 'BUY' | 'SELL',
        quantity: order.size,
        price: parseFloat(order.limit_price || '0'),
        executedAt: date.toISOString(),
        time: date.toISOString(), // Add time field explicitly for frontend
        pnl: 0,
        fees: 0,
        status: order.state
      };
    });
  } catch (error) {
    console.error('Error fetching Delta trades:', error);
    return [];
  }
}

export async function fetchDeltaPositions(apiKey: string, apiSecret: string): Promise<any[]> {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/v2/positions';
    const query = '';
    const payload = '';
    
    const signatureData = method + timestamp + path + query + payload;
    const signature = generateSignature(apiSecret, signatureData);

    const response = await axios.get(`https://api.india.delta.exchange${path}`, {
      headers: {
        'api-key': apiKey,
        'timestamp': timestamp,
        'signature': signature,
        'User-Agent': 'replit-agent',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (!response.data.success) return [];

    const positions = response.data.result || [];
    return positions.map((pos: any) => ({
      symbol: pos.product_symbol,
      entryPrice: parseFloat(pos.entry_price || '0'),
      currentPrice: parseFloat(pos.mark_price || '0'),
      qty: parseFloat(pos.size || '0'),
      unrealizedPnl: parseFloat(pos.unrealized_pnl || '0'),
      status: parseFloat(pos.size) !== 0 ? 'OPEN' : 'CLOSED',
      returnPercent: pos.entry_price ? ((parseFloat(pos.unrealized_pnl) / (parseFloat(pos.entry_price) * Math.abs(parseFloat(pos.size)))) * 100).toFixed(2) : "0.00"
    }));
  } catch (error) {
    console.error('Error fetching Delta positions:', error);
    return [];
  }
}

export async function fetchDeltaWalletBalances(apiKey: string, apiSecret: string): Promise<any> {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/v2/wallet/balances';
    const query = '';
    const payload = '';
    
    const signatureData = method + timestamp + path + query + payload;
    const signature = generateSignature(apiSecret, signatureData);

    const response = await axios.get(`https://api.india.delta.exchange${path}`, {
      headers: {
        'api-key': apiKey,
        'timestamp': timestamp,
        'signature': signature,
        'User-Agent': 'replit-agent',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (!response.data.success) {
      console.log('🔴 [DELTA-BALANCES] API returned error:', response.data.error || response.data);
      // Return a special error object so the frontend knows why it failed
      return { 
        available_balance: 0, 
        total_balance: 0, 
        asset: 'USDT',
        error: response.data.error?.code || 'api_error',
        client_ip: response.data.error?.context?.client_ip
      };
    }

    const balances = response.data.result || [];
    console.log('🔵 [DELTA-BALANCES] Raw results:', JSON.stringify(balances, null, 2));
    
    // Delta provides balances per asset. We look for USDT as the primary trading currency.
    // If USDT not found, we look for DETO or other assets with balance.
    const usdtWallet = balances.find((w: any) => w.asset_symbol === 'USDT') || 
                       balances.find((w: any) => parseFloat(w.balance) > 0) || 
                       balances[0];
    
    const result = {
      available_balance: usdtWallet ? parseFloat(usdtWallet.available_balance || '0') : 0,
      total_balance: usdtWallet ? parseFloat(usdtWallet.balance || '0') : 0,
      asset: usdtWallet ? usdtWallet.asset_symbol : 'USDT'
    };
    
    console.log('✅ [DELTA-BALANCES] Resolved balance:', result);
    return result;
  } catch (error) {
    console.error('Error fetching Delta wallet balances:', error);
    return null;
  }
}
