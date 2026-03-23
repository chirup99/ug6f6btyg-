// Angel One User API - For individual user broker connections
// This is completely separate from the company Angel One connection (angel-one-api.ts)
// Users provide their own credentials via the "Connect Your Broker" dialog
// @ts-ignore - smartapi-javascript doesn't have type declarations
import { SmartAPI } from 'smartapi-javascript';
// @ts-ignore - totp-generator import compatibility
import { TOTP } from 'totp-generator';

const ANGEL_ONE_BASE_URL = 'https://apiconnect.angelbroking.com';

export interface AngelOneUserCredentials {
  clientCode: string;
  pin: string;
  apiKey: string;
  totpSecret: string;
}

export interface AngelOneUserSession {
  jwtToken: string;
  refreshToken: string;
  feedToken: string;
  clientCode: string;
  apiKey: string;
  name?: string;
  email?: string;
  connectedAt: string;
}

// In-memory store for user sessions (keyed by clientCode)
const userSessions = new Map<string, AngelOneUserSession>();

async function generateTOTP(totpSecret: string): Promise<string> {
  const cleanSecret = totpSecret.replace(/\s/g, '').toUpperCase();
  // If it's a 6-digit numeric code, use it directly
  if (/^\d{6}$/.test(cleanSecret)) {
    return cleanSecret;
  }
  // Otherwise treat it as a base32 TOTP secret key
  const totpResult = await TOTP.generate(cleanSecret);
  return typeof totpResult === 'string' ? totpResult : totpResult.otp;
}

// Build the standard headers required for all Angel One REST API calls
function buildAngelOneHeaders(jwtToken: string, apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '106.193.147.98',
    'X-MACAddress': '00:00:00:00:00:00',
    'X-PrivateKey': apiKey,
  };
}

// Direct REST call to Angel One API
async function angelOneGet(path: string, jwtToken: string, apiKey: string): Promise<any> {
  const url = `${ANGEL_ONE_BASE_URL}${path}`;
  const headers = buildAngelOneHeaders(jwtToken, apiKey);
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Angel One API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function connectAngelOneUser(credentials: AngelOneUserCredentials): Promise<AngelOneUserSession> {
  const { clientCode, pin, apiKey, totpSecret } = credentials;

  const smartApi = new SmartAPI({ api_key: apiKey.trim() });

  console.log(`🔶 [USER-ANGELONE] Authenticating user: ${clientCode}`);

  const totpToken = await generateTOTP(totpSecret.trim());
  console.log(`🔐 [USER-ANGELONE] TOTP generated for ${clientCode}`);

  const sessionResponse = await smartApi.generateSession(
    clientCode.trim(),
    pin.trim(),
    totpToken
  );

  if (!sessionResponse.status || !sessionResponse.data) {
    const errorMsg = sessionResponse.message || 'Authentication failed';
    console.error(`🔴 [USER-ANGELONE] Session failed for ${clientCode}: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const sessionData = sessionResponse.data;

  const tokenResponse = await smartApi.generateToken(sessionData.refreshToken);

  const jwtToken = tokenResponse?.data?.jwtToken || sessionData.jwtToken;
  const feedToken = tokenResponse?.data?.feedToken || sessionData.feedToken || '';
  const refreshToken = sessionData.refreshToken || '';

  let name: string | undefined;
  let email: string | undefined;

  try {
    const profile = await smartApi.getProfile(refreshToken);
    if (profile?.data) {
      name = profile.data.name;
      email = profile.data.email;
    }
  } catch (e) {
    console.warn(`⚠️ [USER-ANGELONE] Could not fetch profile for ${clientCode}`);
  }

  const session: AngelOneUserSession = {
    jwtToken,
    refreshToken,
    feedToken,
    clientCode: clientCode.trim(),
    apiKey: apiKey.trim(),
    name,
    email,
    connectedAt: new Date().toISOString(),
  };

  userSessions.set(clientCode.trim(), session);
  console.log(`✅ [USER-ANGELONE] User ${clientCode} connected successfully`);

  return session;
}

export function disconnectAngelOneUser(clientCode: string): void {
  userSessions.delete(clientCode);
  console.log(`🔴 [USER-ANGELONE] User ${clientCode} disconnected`);
}

export function getAngelOneUserSession(clientCode: string): AngelOneUserSession | undefined {
  return userSessions.get(clientCode);
}

export function getAngelOneSessionByToken(jwtToken: string): AngelOneUserSession | undefined {
  for (const session of userSessions.values()) {
    if (session.jwtToken === jwtToken) return session;
  }
  return undefined;
}

// Fetch order book (today's orders placed) via direct REST API
export async function getAngelOneUserOrders(session: AngelOneUserSession): Promise<any[]> {
  try {
    const data = await angelOneGet(
      '/rest/secure/angelbroking/order/v1/getOrderBook',
      session.jwtToken,
      session.apiKey
    );
    console.log(`📋 [USER-ANGELONE] Order book response for ${session.clientCode}:`, JSON.stringify(data).slice(0, 200));
    if (data?.status && data?.data) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
  } catch (e) {
    console.error(`❌ [USER-ANGELONE] Error fetching orders for ${session.clientCode}:`, e);
    return [];
  }
}

// Fetch trade book (executed trades) via direct REST API
export async function getAngelOneUserTrades(session: AngelOneUserSession): Promise<any[]> {
  try {
    const data = await angelOneGet(
      '/rest/secure/angelbroking/order/v1/getTradeBook',
      session.jwtToken,
      session.apiKey
    );
    console.log(`📋 [USER-ANGELONE] Trade book response for ${session.clientCode}:`, JSON.stringify(data).slice(0, 200));
    if (data?.status && data?.data) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
  } catch (e) {
    console.error(`❌ [USER-ANGELONE] Error fetching trades for ${session.clientCode}:`, e);
    return [];
  }
}

// Fetch positions via direct REST API
export async function getAngelOneUserPositions(session: AngelOneUserSession): Promise<any[]> {
  try {
    const data = await angelOneGet(
      '/rest/secure/angelbroking/order/v1/getPosition',
      session.jwtToken,
      session.apiKey
    );
    console.log(`📋 [USER-ANGELONE] Positions response for ${session.clientCode}:`, JSON.stringify(data).slice(0, 200));
    if (data?.status && data?.data) {
      const raw = Array.isArray(data.data) ? data.data : (data.data?.net || []);
      return raw.map((p: any) => ({
        symbol: p.tradingsymbol || p.symbolname || '',
        quantity: Number(p.netqty || p.quantity || 0),
        averagePrice: Number(p.averageprice || p.avgnetprice || 0),
        currentPrice: Number(p.ltp || 0),
        pnl: Number(p.unrealised || p.pnl || 0),
        product: p.producttype || p.product || '',
        exchange: p.exchange || 'NSE',
        status: Number(p.netqty || 0) === 0 ? 'CLOSED' : 'OPEN',
      }));
    }
    return [];
  } catch (e) {
    console.error(`❌ [USER-ANGELONE] Error fetching positions for ${session.clientCode}:`, e);
    return [];
  }
}

// Fetch available funds (RMS) via direct REST API
export async function getAngelOneUserFunds(session: AngelOneUserSession): Promise<number> {
  try {
    const data = await angelOneGet(
      '/rest/secure/angelbroking/user/v1/getRMS',
      session.jwtToken,
      session.apiKey
    );
    console.log(`💰 [USER-ANGELONE] Funds response for ${session.clientCode}:`, JSON.stringify(data).slice(0, 200));
    if (data?.status && data?.data) {
      const net = data.data?.net;
      if (net && Array.isArray(net) && net.length > 0) {
        return Number(net[0]?.availablecash || 0);
      }
      // Some responses return availablecash directly
      return Number(data.data?.availablecash || data.data?.availableBalance || 0);
    }
    return 0;
  } catch (e) {
    console.error(`❌ [USER-ANGELONE] Error fetching funds for ${session.clientCode}:`, e);
    return 0;
  }
}
