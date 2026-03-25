import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Groww Trade API Service
 *
 * Reverse-engineered from the official Python SDK (growwapi v1.5.0).
 * Authentication flow:
 *   POST https://api.groww.in/v1/token/api/access
 *   Headers:  Authorization: Bearer <api_key>
 *   Body:     { key_type: "approval", timestamp: <unix_seconds>, checksum: SHA256(secret + timestamp_str) }
 *   Response: { token: "<access_token>" }
 */

const BASE_URL = 'https://api.groww.in/v1';

function buildHeaders(apiKeyOrToken: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKeyOrToken}`,
    'Content-Type': 'application/json',
    'x-request-id': uuidv4(),
    'x-client-id': 'growwapi',
    'x-client-platform': 'growwapi-python-client',
    'x-client-platform-version': '1.5.0',
    'x-api-version': '1.0',
  };
}

function generateChecksum(secret: string, timestamp: number): string {
  const input = secret + String(timestamp);
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export async function getGrowwAccessToken(apiKey: string, apiSecret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const checksum = generateChecksum(apiSecret, timestamp);

  const body = {
    key_type: 'approval',
    checksum,
    timestamp,
  };

  console.log(`🔐 Authenticating with Groww — API Key: ${apiKey.substring(0, 5)}... endpoint: ${BASE_URL}/token/api/access`);

  try {
    const response = await axios.post(`${BASE_URL}/token/api/access`, body, {
      headers: buildHeaders(apiKey),
      timeout: 15000,
    });

    const token = response.data?.token;
    if (token) {
      console.log('✅ Groww authentication successful');
      return token;
    }

    console.error('❌ Groww: no token in response', JSON.stringify(response.data));
    throw new Error('No token in Groww response');
  } catch (error: any) {
    const status = error.response?.status;
    const body = error.response?.data;
    const displayMsg = body?.error?.displayMessage || body?.message || error.message;
    console.error(`❌ Groww Auth Error (HTTP ${status}):`, JSON.stringify(body));
    throw new Error(`Groww authentication failed (${status}): ${displayMsg}`);
  }
}

export async function fetchGrowwFunds(accessToken: string): Promise<number> {
  try {
    console.log('💰 Fetching funds from Groww...');
    const response = await axios.get(`${BASE_URL}/accounts/funds`, {
      headers: buildHeaders(accessToken),
      timeout: 10000,
    });

    return response.data?.available_cash ?? response.data?.data?.available_cash ?? 0;
  } catch (error: any) {
    console.error('❌ Groww Funds Error:', error.response?.data || error.message);
    return 0;
  }
}

export async function fetchGrowwTrades(accessToken: string): Promise<any[]> {
  try {
    console.log('📜 Fetching orders from Groww...');
    const response = await axios.get(`${BASE_URL}/orders/list`, {
      headers: buildHeaders(accessToken),
      timeout: 10000,
    });

    const orderList =
      response.data?.order_list ||
      response.data?.data?.order_list ||
      response.data?.payload?.order_list ||
      response.data ||
      [];

    if (Array.isArray(orderList)) {
      return orderList.map((order: any) => ({
        time: order.created_at || order.exchange_time || new Date().toISOString(),
        order: order.transaction_type,
        symbol: order.trading_symbol,
        type: order.order_type,
        qty: order.quantity,
        price: order.average_fill_price || order.average_price || order.price,
        status: order.order_status,
        groww_order_id: order.groww_order_id || order.order_id,
      }));
    }

    return [];
  } catch (error: any) {
    console.error('❌ Groww Orders Error:', error.response?.data || error.message);
    return [];
  }
}

export async function fetchGrowwPositions(accessToken: string): Promise<any[]> {
  try {
    console.log('💼 Fetching positions from Groww...');
    const response = await axios.get(`${BASE_URL}/positions`, {
      headers: buildHeaders(accessToken),
      timeout: 10000,
    });

    const positions =
      response.data?.payload ||
      response.data?.data ||
      response.data ||
      [];

    if (Array.isArray(positions)) return positions;
    return [];
  } catch (error: any) {
    console.error('❌ Groww Positions Error:', error.response?.data || error.message);
    return [];
  }
}
