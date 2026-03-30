import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Groww Trade API Service
 * Reverse-engineered from the official Python SDK (growwapi v1.5.0).
 *
 * Base URL:   https://api.groww.in/v1
 * Auth flow:  POST /token/api/access
 *   Headers:  Authorization: Bearer <api_key>
 *   Body:     { key_type: "approval", timestamp: <unix_sec>, checksum: SHA256(secret + timestamp_str) }
 *   Response: { token: "<access_token>" }
 *
 * Subsequent calls use Authorization: Bearer <access_token>
 * All responses: { payload: { ... } } → we return payload
 */

const BASE_URL = 'https://api.groww.in/v1';

function buildHeaders(bearerToken: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${bearerToken}`,
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

function parsePayload(data: any): any {
  return data?.payload ?? data;
}

export async function getGrowwAccessToken(apiKey: string, apiSecret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const checksum = generateChecksum(apiSecret, timestamp);

  const body = { key_type: 'approval', checksum, timestamp };

  console.log(`🔐 Groww auth → ${BASE_URL}/token/api/access  key: ${apiKey.substring(0, 5)}...`);

  try {
    const response = await axios.post(`${BASE_URL}/token/api/access`, body, {
      headers: buildHeaders(apiKey),
      timeout: 15000,
    });

    const token = response.data?.token ?? response.data?.payload?.token;
    if (token) {
      console.log('✅ Groww authentication successful');
      return token;
    }

    console.error('❌ Groww: no token in response', JSON.stringify(response.data));
    throw new Error('No token in Groww response');
  } catch (error: any) {
    const status = error.response?.status;
    const body = error.response?.data;
    const displayMsg =
      body?.error?.displayMessage ||
      body?.error?.message ||
      body?.message ||
      error.message;
    console.error(`❌ Groww Auth Error (HTTP ${status}):`, JSON.stringify(body));
    throw new Error(`Groww authentication failed (${status}): ${displayMsg}`);
  }
}

export async function getGrowwUserProfile(accessToken: string): Promise<{ userId: string; userName: string; email: string }> {
  try {
    console.log('👤 Fetching Groww user profile...');
    const response = await axios.get(`${BASE_URL}/user/detail`, {
      headers: buildHeaders(accessToken),
      timeout: 10000,
    });

    const data = parsePayload(response.data);
    console.log('👤 Groww profile raw:', JSON.stringify(data));

    const userId =
      data?.ucc ||
      data?.growwId ||
      data?.customerId ||
      data?.userId ||
      data?.client_id ||
      data?.id ||
      'N/A';

    const userName =
      data?.client_name ||
      data?.name ||
      data?.fullName ||
      data?.userName ||
      data?.displayName ||
      'Groww User';

    const email = data?.email || '';

    return { userId, userName, email };
  } catch (error: any) {
    console.error('❌ Groww Profile Error:', error.response?.data || error.message);
    return { userId: 'N/A', userName: 'Groww User', email: '' };
  }
}

export async function fetchGrowwFunds(accessToken: string): Promise<number | null> {
  try {
    console.log('💰 Fetching Groww margin/funds from /margins/detail/user...');
    const response = await axios.get(`${BASE_URL}/margins/detail/user`, {
      headers: buildHeaders(accessToken),
      timeout: 10000,
    });

    const data = parsePayload(response.data);
    console.log('💰 Groww funds raw:', JSON.stringify(data));

    // Groww actual API response structure (from /margins/detail/user):
    // {
    //   clear_cash: 98.81,                         ← total cash deposited
    //   equity_margin_details: {
    //     cnc_balance_available: 84.13,            ← available after CNC holdings (correct value to show)
    //     mis_balance_available: 84.13,
    //     cnc_margin_used: -8.7,
    //   },
    //   fno_margin_details: {
    //     future_balance_available: 84.13,
    //     option_buy_balance_available: 84.13,
    //   }
    // }
    // Use cnc_balance_available as the "available funds" — reflects cash after open CNC positions
    const equityDetails = data?.equity_margin_details || data?.equityMarginDetails || null;
    if (equityDetails) {
      // cnc_balance_available = cash available after CNC holdings (most accurate for equity investors)
      if (equityDetails.cnc_balance_available != null) return Number(equityDetails.cnc_balance_available);
      if (equityDetails.mis_balance_available != null) return Number(equityDetails.mis_balance_available);
      // Derive: total cash minus margin used
      if (data?.clear_cash != null && equityDetails.net_equity_margin_used != null) {
        return Number(data.clear_cash) + Number(equityDetails.net_equity_margin_used);
      }
    }

    // Flat-structure fallbacks
    const flatVal =
      data?.available_margin ??
      data?.availableMargin ??
      data?.clear_cash ??
      data?.net ??
      data?.available_balance ??
      data?.availableBalance ??
      data?.available_cash ??
      data?.availableCash ??
      data?.net_available ??
      data?.netAvailable ??
      null;

    return flatVal !== null ? Number(flatVal) : null;
  } catch (error: any) {
    console.error('❌ Groww Funds Error:', error.response?.data || error.message);
    return null;
  }
}

function normalizeGrowwStatus(raw: string | undefined): string {
  const s = String(raw || '').toUpperCase().trim();
  if (s === 'COMPLETE' || s === 'EXECUTED' || s === 'FILLED') return 'COMPLETE';
  if (s === 'REJECTED' || s === 'FAILED') return 'REJECTED';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  if (s === 'PENDING' || s === 'OPEN' || s === 'TRIGGER_PENDING' || s === 'PUT ORDER REQ RECEIVED' || s === 'VALIDATION PENDING') return 'PENDING';
  return s || 'PENDING';
}

export async function fetchGrowwTrades(accessToken: string): Promise<any[]> {
  try {
    console.log('📜 Fetching Groww orders from /order/list...');
    const response = await axios.get(`${BASE_URL}/order/list`, {
      headers: buildHeaders(accessToken),
      timeout: 10000,
    });

    const data = parsePayload(response.data);
    console.log('📜 Groww orders raw keys:', Object.keys(data || {}));

    const orderList =
      data?.orderList ||
      data?.order_list ||
      data?.orders ||
      (Array.isArray(data) ? data : []);

    if (Array.isArray(orderList)) {
      return orderList.map((order: any) => {
        const rawStatus = order.order_status || order.orderStatus || order.status;
        const mappedStatus = normalizeGrowwStatus(rawStatus);

        const rawTime =
          order.exchange_time || order.exchangeTime ||
          order.created_at || order.createdAt ||
          order.order_timestamp || order.orderTimestamp ||
          new Date().toISOString();

        return {
          time: rawTime,
          order: (order.transaction_type || order.transactionType || order.side || '').toUpperCase(),
          symbol: order.trading_symbol || order.tradingSymbol || order.symbol || '',
          type: (order.order_type || order.orderType || 'MARKET').toUpperCase(),
          qty: order.quantity || order.filled_quantity || order.filledQuantity || 0,
          price: order.average_fill_price || order.averageFillPrice || order.average_price || order.averagePrice || order.price || 0,
          status: mappedStatus,
          groww_order_id: order.groww_order_id || order.growwOrderId || order.order_id || order.orderId,
        };
      });
    }

    return [];
  } catch (error: any) {
    console.error('❌ Groww Orders Error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Fetch live LTP for one or more symbols using Groww's Live Data API.
 * @param accessToken  Groww bearer token
 * @param exchangeSymbols  Comma-separated "NSE_SYMBOL" or "BSE_SYMBOL" strings, e.g. "NSE_IDEA,NSE_YESBANK"
 * @param segment  "CASH" | "FNO" | "COMMODITY"  (default: "CASH")
 * @returns map of { "NSE_IDEA": 8.72, "NSE_YESBANK": 17.35 }
 */
export async function fetchGrowwLTP(
  accessToken: string,
  exchangeSymbols: string,
  segment: string = 'CASH',
): Promise<Record<string, number>> {
  try {
    console.log(`📡 [GROWW LTP] Fetching LTP for: ${exchangeSymbols}`);
    const response = await axios.get(`${BASE_URL}/live-data/ltp`, {
      headers: buildHeaders(accessToken),
      params: { segment, exchange_symbols: exchangeSymbols },
      timeout: 5000,
    });

    const payload = parsePayload(response.data);
    // payload = { "NSE_IDEA": { ltp: 8.72 }, "NSE_YESBANK": { ltp: 17.35 } }
    const result: Record<string, number> = {};
    for (const [key, val] of Object.entries(payload || {})) {
      const ltp = (val as any)?.ltp;
      if (ltp !== undefined && ltp !== null) {
        result[key] = Number(ltp);
      }
    }
    console.log(`✅ [GROWW LTP] Response:`, JSON.stringify(result));
    return result;
  } catch (error: any) {
    console.error('❌ Groww LTP Error:', error.response?.data || error.message);
    return {};
  }
}

export async function fetchGrowwPositions(accessToken: string): Promise<any[]> {
  try {
    console.log('💼 Fetching Groww positions from /positions/user...');
    const response = await axios.get(`${BASE_URL}/positions/user`, {
      headers: buildHeaders(accessToken),
      timeout: 10000,
    });

    const data = parsePayload(response.data);
    console.log('💼 Groww positions raw keys:', Object.keys(data || {}));
    if (Array.isArray(data?.positionList || data?.position_list || data?.positions || (Array.isArray(data) ? data : []))) {
      const firstPos = (data?.positionList || data?.position_list || data?.positions || data)?.[0];
      if (firstPos) console.log('💼 Groww first position sample:', JSON.stringify(firstPos));
    }

    const rawList =
      data?.positionList ||
      data?.position_list ||
      data?.positions ||
      (Array.isArray(data) ? data : []);

    if (!Array.isArray(rawList)) return [];

    return rawList.map((pos: any) => {
      console.log('💼 [DEBUG] Mapping position:', JSON.stringify(pos));
      const symbol =
        pos.trading_symbol || pos.tradingSymbol ||
        pos.symbol || pos.scrip_code || pos.scripCode || '';

      // Groww API actual fields (from /positions/user):
      // credit_price = average buy price (entry)
      // net_price    = net average price
      // credit_quantity / debit_quantity = buy/sell qty
      // quantity     = net quantity held
      // realised_pnl = closed P&L
      // NOTE: Groww positions endpoint does NOT return live LTP
      const entryPrice = Number(
        pos.credit_price ?? pos.net_price ??
        pos.buy_avg_price ?? pos.buy_avg ?? pos.buy_average ?? pos.average_buy_price ??
        pos.average_price ?? pos.avgPrice ?? pos.avg_price ??
        pos.entry_price ?? pos.entryPrice ?? 0
      );

      // Groww doesn't provide live LTP in positions — use net_price as best available fallback
      const currentPrice = Number(
        pos.ltp ?? pos.last_traded_price ?? pos.lastTradedPrice ??
        pos.last_price ?? pos.current_price ?? pos.currentPrice ??
        pos.close_price ?? pos.closePrice ??
        pos.net_price ?? pos.credit_price ?? 0
      );

      const qty = Number(
        pos.quantity ?? pos.net_quantity ?? pos.netQuantity ??
        pos.net_qty ?? pos.netQty ?? 0
      );

      const unrealizedPnl = Number(
        pos.pnl !== undefined ? pos.pnl :
        pos.unrealized_pnl !== undefined ? pos.unrealized_pnl :
        pos.unrealisedPnl !== undefined ? pos.unrealisedPnl :
        pos.realised_pnl !== undefined ? pos.realised_pnl :
        (currentPrice - entryPrice) * qty
      );

      const posStatus = (qty !== 0) ? 'OPEN' : 'CLOSED';

      const product =
        pos.product || pos.product_type || pos.productType ||
        pos.exchange || '';

      // Determine exchange for LTP key construction (e.g. "NSE_IDEA")
      const rawExchange = (pos.exchange || pos.segment || '').toUpperCase();
      const exchange = rawExchange.startsWith('BSE') ? 'BSE' : 'NSE';

      return {
        symbol,
        entryPrice,
        entry_price: entryPrice,
        currentPrice,
        current_price: currentPrice,
        ltp: currentPrice,
        qty,
        quantity: qty,
        unrealizedPnl,
        unrealized_pnl: unrealizedPnl,
        status: posStatus,
        product,
        exchange,
      };
    }).filter((pos: any) => pos.symbol && pos.qty !== 0);
  } catch (error: any) {
    console.error('❌ Groww Positions Error:', error.response?.data || error.message);
    return [];
  }
}
