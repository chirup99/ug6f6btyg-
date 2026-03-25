import axios from 'axios';

/**
 * Groww API Service
 * Uses the Groww Trade API (growwapi.in) with API Key + Secret flow.
 * Reference: https://groww.in/trade-api/docs/python-sdk
 */

const BASE_URL = 'https://growwapi.in';

export async function getGrowwAccessToken(apiKey: string, apiSecret: string): Promise<string> {
  try {
    console.log(`🔐 Authenticating with Groww for API Key: ${apiKey.substring(0, 5)}...`);

    // POST /v1/login with api_key and secret to get access_token
    const response = await axios.post(`${BASE_URL}/v1/login`, {
      api_key: apiKey,
      secret: apiSecret
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.access_token) {
      console.log('✅ Groww authentication successful');
      return response.data.access_token;
    }

    // Some versions return the token at a different key
    if (response.data && response.data.data && response.data.data.access_token) {
      console.log('✅ Groww authentication successful');
      return response.data.data.access_token;
    }

    throw new Error('No access_token in Groww response');
  } catch (error: any) {
    console.error('❌ Groww Auth Error:', error.response?.data || error.message);
    throw new Error(`Groww authentication failed: ${error.response?.data?.message || error.message}`);
  }
}

export async function fetchGrowwFunds(accessToken: string): Promise<number> {
  try {
    console.log('💰 Fetching funds from Groww...');
    const response = await axios.get(`${BASE_URL}/v1/accounts/funds`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.available_cash !== undefined) {
      return response.data.available_cash;
    }
    if (response.data && response.data.data && response.data.data.available_cash !== undefined) {
      return response.data.data.available_cash;
    }
    return 0;
  } catch (error: any) {
    console.error('❌ Groww Funds Error:', error.message);
    return 0;
  }
}

export async function fetchGrowwTrades(accessToken: string): Promise<any[]> {
  try {
    console.log('📜 Fetching orders from Groww...');
    const response = await axios.get(`${BASE_URL}/v1/orders`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const orderList = response.data?.order_list || response.data?.data?.order_list || response.data || [];

    if (Array.isArray(orderList)) {
      return orderList.map((order: any) => ({
        time: order.created_at || order.exchange_time || new Date().toISOString(),
        order: order.transaction_type,
        symbol: order.trading_symbol,
        type: order.order_type,
        qty: order.quantity,
        price: order.average_fill_price || order.average_price || order.price,
        status: order.order_status,
        groww_order_id: order.groww_order_id || order.order_id
      }));
    }

    return [];
  } catch (error: any) {
    console.error('❌ Groww Orders Error:', error.message);
    return [];
  }
}

export async function fetchGrowwPositions(accessToken: string): Promise<any[]> {
  try {
    console.log('💼 Fetching positions from Groww...');
    const response = await axios.get(`${BASE_URL}/v1/positions`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const positions = response.data?.data || response.data || [];
    if (Array.isArray(positions)) {
      return positions;
    }
    return [];
  } catch (error: any) {
    console.error('❌ Groww Positions Error:', error.message);
    return [];
  }
}
