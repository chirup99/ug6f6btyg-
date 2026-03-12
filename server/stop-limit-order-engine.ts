// import type { FyersAPI } from './fyers-api.js'; // Removed: Fyers API removed

interface StopLimitOrder {
  symbol: string;
  orderType: 'BUY' | 'SELL';
  triggerPrice: number;      // Stop price - when to trigger
  limitPrice: number;        // Limit price - execution price (same as trigger for exact level)
  quantity: number;
  orderTag: string;
  patternType: 'UPTREND' | 'DOWNTREND';
  breakoutLevel: number;
}

interface OrderResponse {
  success: boolean;
  orderId?: string;
  message: string;
  orderDetails?: any;
}

export class StopLimitOrderEngine {
  private fyersAPI: FyersAPI;
  private activeOrders: Map<string, StopLimitOrder> = new Map();

  constructor(fyersAPI: FyersAPI) {
    this.fyersAPI = fyersAPI;
  }

  /**
   * Place Stop Limit Order at EXACT breakout level
   * Trigger Price = Limit Price = Breakout Level (no slippage)
   */
  async placeStopLimitOrder(
    symbol: string,
    breakoutLevel: number,
    patternType: 'UPTREND' | 'DOWNTREND',
    quantity: number = 100
  ): Promise<OrderResponse> {
    try {
      // CRITICAL: Stop Limit Order Configuration
      const orderType = patternType === 'UPTREND' ? 'BUY' : 'SELL';
      const triggerPrice = breakoutLevel;    // Exact breakout level
      const limitPrice = breakoutLevel;      // Same as trigger for precise execution
      
      console.log(`🎯 STOP LIMIT ORDER PLACEMENT:`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Pattern: ${patternType}`);
      console.log(`   Order Type: ${orderType}`);
      console.log(`   Trigger Price: ${triggerPrice} (Exact breakout level)`);
      console.log(`   Limit Price: ${limitPrice} (Same as trigger)`);
      console.log(`   Quantity: ${quantity}`);

      const orderData = {
        symbol: symbol,
        qty: quantity,
        type: 2,  // Limit order
        side: patternType === 'UPTREND' ? 1 : -1, // 1 = Buy, -1 = Sell
        productType: 'I', // Intraday
        limitPrice: limitPrice,
        stopPrice: triggerPrice,  // Stop trigger
        validity: 'DAY',
        offline: false,
        stopLoss: 0,
        takeProfit: 0
      };

      // Create stop limit order
      const order: StopLimitOrder = {
        symbol,
        orderType,
        triggerPrice,
        limitPrice,
        quantity,
        orderTag: `BATTU_${patternType}_${Date.now()}`,
        patternType,
        breakoutLevel
      };

      // Place order through Fyers API
      const response = await this.fyersAPI.placeOrder(orderData);
      
      if (response.s === 'ok') {
        // Store active order
        this.activeOrders.set(response.id, order);
        
        console.log(`✅ STOP LIMIT ORDER PLACED SUCCESSFULLY:`);
        console.log(`   Order ID: ${response.id}`);
        console.log(`   Trigger: ${triggerPrice} | Limit: ${limitPrice}`);
        console.log(`   Execution: Will execute at ${limitPrice} when price ${patternType === 'UPTREND' ? 'rises above' : 'falls below'} ${triggerPrice}`);

        return {
          success: true,
          orderId: response.id,
          message: `Stop Limit Order placed at ${breakoutLevel}`,
          orderDetails: order
        };
      } else {
        console.log(`❌ STOP LIMIT ORDER FAILED: ${response.message}`);
        return {
          success: false,
          message: response.message || 'Order placement failed'
        };
      }
    } catch (error) {
      console.error('❌ Stop Limit Order Error:', error);
      return {
        success: false,
        message: `Order error: ${error.message}`
      };
    }
  }

  /**
   * Monitor active orders and update status
   */
  async checkOrderStatus(orderId: string): Promise<any> {
    try {
      const response = await this.fyersAPI.getOrderStatus(orderId);
      return response;
    } catch (error) {
      console.error('Error checking order status:', error);
      return null;
    }
  }

  /**
   * Get all active stop limit orders
   */
  getActiveOrders(): Map<string, StopLimitOrder> {
    return this.activeOrders;
  }

  /**
   * Cancel stop limit order
   */
  async cancelOrder(orderId: string): Promise<OrderResponse> {
    try {
      const response = await this.fyersAPI.cancelOrder(orderId);
      
      if (response.s === 'ok') {
        this.activeOrders.delete(orderId);
        return {
          success: true,
          message: 'Order cancelled successfully'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Cancellation failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Cancellation error: ${error.message}`
      };
    }
  }
}

// Usage Example:
/*
const stopLimitEngine = new StopLimitOrderEngine(fyersAPI);

// Place stop limit order at exact breakout level
await stopLimitEngine.placeStopLimitOrder(
  'NSE:NIFTY50-INDEX',
  24603.60,  // Exact breakout level
  'UPTREND',
  100
);

// Order will trigger when price reaches 24603.60 and execute at 24603.60
*/