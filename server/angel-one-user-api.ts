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
