// Angel One User API - For individual user broker connections
// This is completely separate from the company Angel One connection (angel-one-api.ts)
// Users provide their own credentials via the "Connect Your Broker" dialog
// @ts-ignore - smartapi-javascript doesn't have type declarations
import { SmartAPI } from 'smartapi-javascript';
// @ts-ignore - totp-generator import compatibility
import { TOTP } from 'totp-generator';

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

export async function getAngelOneUserOrders(session: AngelOneUserSession): Promise<any[]> {
  try {
    const smartApi = new SmartAPI({ api_key: '' });
    const res = await (smartApi as any).getOrderBook(session.jwtToken);
    if (res?.status && res?.data) {
      return Array.isArray(res.data) ? res.data : [];
    }
    return [];
  } catch (e) {
    console.error(`❌ [USER-ANGELONE] Error fetching orders for ${session.clientCode}:`, e);
    return [];
  }
}

export async function getAngelOneUserTrades(session: AngelOneUserSession): Promise<any[]> {
  try {
    const smartApi = new SmartAPI({ api_key: '' });
    const res = await (smartApi as any).getTradeBook(session.jwtToken);
    if (res?.status && res?.data) {
      return Array.isArray(res.data) ? res.data : [];
    }
    return [];
  } catch (e) {
    console.error(`❌ [USER-ANGELONE] Error fetching trades for ${session.clientCode}:`, e);
    return [];
  }
}

export async function getAngelOneUserPositions(session: AngelOneUserSession): Promise<any[]> {
  try {
    const smartApi = new SmartAPI({ api_key: '' });
    const res = await (smartApi as any).getPosition(session.jwtToken);
    if (res?.status && res?.data) {
      const positions = (Array.isArray(res.data) ? res.data : (res.data.net || [])).map((p: any) => ({
        symbol: p.tradingsymbol || p.symbolname || '',
        quantity: Number(p.netqty || p.quantity || 0),
        averagePrice: Number(p.averageprice || p.avgnetprice || 0),
        currentPrice: Number(p.ltp || 0),
        pnl: Number(p.unrealised || p.pnl || 0),
        product: p.producttype || p.product || '',
        exchange: p.exchange || 'NSE',
      }));
      return positions;
    }
    return [];
  } catch (e) {
    console.error(`❌ [USER-ANGELONE] Error fetching positions for ${session.clientCode}:`, e);
    return [];
  }
}

export async function getAngelOneUserFunds(session: AngelOneUserSession): Promise<number> {
  try {
    const smartApi = new SmartAPI({ api_key: '' });
    const res = await (smartApi as any).getRMS(session.jwtToken);
    if (res?.status && res?.data) {
      const net = res.data?.net;
      if (net && Array.isArray(net) && net.length > 0) {
        return Number(net[0]?.availablecash || 0);
      }
    }
    return 0;
  } catch (e) {
    console.error(`❌ [USER-ANGELONE] Error fetching funds for ${session.clientCode}:`, e);
    return 0;
  }
}
