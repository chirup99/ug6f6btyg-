import axios from 'axios';
import { dhanOAuthManager } from '../../dhan-oauth';
import type { DhanCredentials, BrokerTrade } from "@shared/schema";

export interface DhanTrade {
  time: string;
  order: 'BUY' | 'SELL';
  symbol: string;
  qty: number;
  price: number;
  pnl: string;
  returnPercent?: string;
  duration?: string;
  type: string;
  status: string;
}

export interface DhanPosition {
  symbol: string;
  entry_price: number;
  current_price: number;
  qty: number;
  quantity: number;
  unrealized_pnl: number;
  unrealizedPnl: number;
  return_percent: string;
  returnPercent: string;
  status: string;
}

export async function fetchDhanTrades(): Promise<DhanTrade[]> {
  try {
    const accessToken = dhanOAuthManager.getAccessToken();
    if (!accessToken) return [];

    const response = await axios.get('https://api.dhan.co/v2/orders', {
      headers: { 'access-token': accessToken, 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const orders = response.data?.data || response.data || [];
    
    // Group orders by symbol to calculate P&L for round-trip trades
    const trades: DhanTrade[] = [];
    const openBuyOrders: Record<string, any[]> = {};
    const openSellOrders: Record<string, any[]> = {};

    // Sort orders by time to process chronologically
    const sortedOrders = orders.sort((a: any, b: any) => 
      new Date(a.orderDateTime || a.updateTime || 0).getTime() - new Date(b.orderDateTime || b.updateTime || 0).getTime()
    );

    sortedOrders.forEach((order: any) => {
      const statusUpper = String(order.orderStatus || order.status || '').toUpperCase();
      let mappedStatus = 'PENDING';
      if (['TRADED', 'EXECUTED', 'COMPLETE', 'SUCCESS'].includes(statusUpper)) mappedStatus = 'COMPLETE';
      else if (statusUpper.includes('REJECT')) mappedStatus = 'REJECTED';
      else if (statusUpper.includes('CANCEL')) mappedStatus = 'CANCELLED';

      const side = (order.transactionType || order.side || '').toUpperCase();
      const symbol = order.tradingSymbol || order.symbol || 'N/A';
      const qty = Number(order.quantity || order.qty || 0);
      const price = Number(order.averagePrice || order.price || 0);
      const time = order.orderDateTime || order.updateTime ? new Date(order.orderDateTime || order.updateTime) : null;

      let pnl = '-';
      let returnPercent = '-';
      let duration = '-';

      if (mappedStatus === 'COMPLETE') {
        const opposingSide = side === 'BUY' ? openSellOrders : openBuyOrders;
        const sameSide = side === 'BUY' ? openBuyOrders : openSellOrders;

        if (opposingSide[symbol] && opposingSide[symbol].length > 0) {
          const match = opposingSide[symbol].shift();
          const buyPrice = side === 'BUY' ? price : match.price;
          const sellPrice = side === 'SELL' ? price : match.price;
          
          const rawPnl = (sellPrice - buyPrice) * qty;
          pnl = `₹${rawPnl.toFixed(2)}`;
          returnPercent = buyPrice > 0 ? `${((sellPrice - buyPrice) / buyPrice * 100).toFixed(2)}%` : '0.00%';
          
          if (time && match.time) {
            const diffMs = Math.abs(time.getTime() - match.time.getTime());
            const diffSec = Math.floor(diffMs / 1000);
            duration = diffSec < 60 ? `${diffSec}s` : `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
          }
        } else {
          if (!sameSide[symbol]) sameSide[symbol] = [];
          sameSide[symbol].push({ price, qty, time });
        }
      }

      trades.push({
        time: time ? time.toLocaleTimeString() : '-',
        order: side === 'SELL' ? 'SELL' : 'BUY',
        symbol,
        qty,
        price,
        pnl,
        returnPercent,
        duration,
        type: order.orderType || 'MARKET',
        status: mappedStatus
      });
    });

    return trades;
  } catch (error) {
    return [];
  }
}

export async function fetchDhanPositions(): Promise<DhanPosition[]> {
  try {
    const accessToken = dhanOAuthManager.getAccessToken();
    if (!accessToken) return [];

    const response = await axios.get('https://api.dhan.co/v2/positions', {
      headers: { 'access-token': accessToken, 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const positionsData = response.data?.data || response.data || [];
    return positionsData.map((pos: any) => {
      const quantity = Number(pos.netQty || pos.quantity || 0);
      // Dhan API often uses costPrice or buyAvg for entry price in positions
      const entryPrice = Number(pos.costPrice || pos.buyAvg || pos.avgCostPrice || pos.averagePrice || pos.entryPrice || 0);
      const unrealizedPnl = Number(pos.unrealizedProfit || pos.unrealizedPnl || 0);
      const ltp = Number(pos.lastPrice || pos.currentPrice || pos.ltp || 0);
      
      // Calculate current price if not provided: (unrealizedPnl / quantity) + entryPrice
      // PnL = (Current - Entry) * Qty => Current = (PnL / Qty) + Entry
      let currentPrice = ltp;
      if (currentPrice === 0 && quantity !== 0) {
        currentPrice = (unrealizedPnl / quantity) + entryPrice;
      }

      return {
        symbol: pos.tradingSymbol || pos.symbol || 'N/A',
        entry_price: entryPrice,
        entryPrice: entryPrice, // Added for frontend compatibility
        current_price: currentPrice,
        currentPrice: currentPrice, // Added for frontend compatibility
        qty: quantity,
        quantity: quantity,
        unrealized_pnl: unrealizedPnl,
        unrealizedPnl: unrealizedPnl,
        return_percent: entryPrice && quantity ? ((unrealizedPnl / (entryPrice * Math.abs(quantity))) * 100).toFixed(2) : "0.00",
        returnPercent: entryPrice && quantity ? ((unrealizedPnl / (entryPrice * Math.abs(quantity))) * 100).toFixed(2) : "0.00",
        status: quantity !== 0 ? 'OPEN' : 'CLOSED'
      };
    });
  } catch (error) {
    return [];
  }
}

export async function fetchDhanMargins(): Promise<number> {
  try {
    const accessToken = dhanOAuthManager.getAccessToken();
    if (!accessToken) return 0;

    const response = await axios.get('https://api.dhan.co/v2/fundlimit', {
      headers: { 'access-token': accessToken, 'Content-Type': 'application/json' },
      timeout: 10000
    });

    return response.data?.availabelBalance ?? response.data?.availableBalance ?? response.data?.dhanCash ?? 0;
  } catch (error) {
    return 0;
  }
}
