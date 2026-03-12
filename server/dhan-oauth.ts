// Dhan OAuth Implementation - Individual API Key OAuth Flow (3-Step OAuth)
import axios from 'axios';
import crypto from 'crypto';

interface DhanOAuthState {
  accessToken: string | null;
  clientId: string | null;
  userEmail: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  tokenExpiry: Date | null;
  lastRefresh: Date | null;
  refreshToken: string | null;
}

interface DhanConsentResponse {
  consentAppId?: string;
  consentAppStatus?: string;
  status?: string;
  error?: string;
  message?: string;
}

interface DhanTokenResponse {
  dhanClientId?: string;
  dhanClientName?: string;
  dhanClientUcc?: string;
  accessToken?: string;
  expiryTime?: string;
  status?: string;
  error?: string;
}

class DhanOAuthManager {
  private state: DhanOAuthState = {
    accessToken: null,
    clientId: null,
    userEmail: null,
    userName: null,
    isAuthenticated: false,
    tokenExpiry: null,
    lastRefresh: null,
    refreshToken: null,
  };

  private apiKey: string;
  private apiSecret: string;
  private redirectUri: string;
  private consentAppIds: Map<string, { id: string; createdAt: Date }> = new Map();

  constructor(apiKey?: string, apiSecret?: string) {
    // Individual API Key authentication (as per user's credentials)
    this.apiKey = apiKey || process.env.DHAN_API_KEY || '';
    this.apiSecret = apiSecret || process.env.DHAN_API_SECRET || '';
    
    // Set redirect URI based on environment
    let baseUrl;
    if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_DOMAIN) {
      baseUrl = `https://${process.env.PRODUCTION_DOMAIN}`;
    } else {
      baseUrl = (process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS)
        ? `https://${process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS}`
        : `http://localhost:5000`;
    }
    this.redirectUri = `${baseUrl}/api/broker/dhan/callback`;

    console.log('🔵 [DHAN] API Key OAuth Manager initialized');
    console.log(`🔵 [DHAN] Redirect URI: ${this.redirectUri}`);
    console.log(`🔵 [DHAN] API Key configured: ${this.apiKey ? 'YES' : 'NO'}`);
  }

  // Step 1: Generate Consent (Call Dhan API to get consentAppId)
  async generateConsent(domain?: string): Promise<{ consentAppId: string; url: string } | null> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        console.error('🔴 [DHAN] API credentials missing');
        console.error('   Required environment variables: DHAN_API_KEY, DHAN_API_SECRET');
        return null;
      }

      console.log('🔵 [DHAN] Step 1: Calling app/generate-consent API...');
      console.log(`🔵 [DHAN] Using API Key: ${this.apiKey.substring(0, 4)}...`);
      console.log(`🔵 [DHAN] API Secret length: ${this.apiSecret.length}`);

      // Call Dhan Individual API to generate consent - per official documentation
      // Headers: app_id and app_secret (custom headers, not Basic Auth)
      const response = await axios({
        method: 'post',
        url: `https://auth.dhan.co/app/generate-consent?client_id=${this.apiKey.trim()}`,
        headers: {
          'app_id': this.apiKey.trim(),
          'app_secret': this.apiSecret.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: {},
        timeout: 15000,
      });

      const consentData: DhanConsentResponse = response.data;
      
      if (!consentData.consentAppId) {
        console.error('🔴 [DHAN] No consentAppId in response:', consentData);
        return null;
      }

      // Step 2: Build login URL using the consentAppId with dynamic domain support
      const consentAppId = consentData.consentAppId;
      let redirectUri = this.redirectUri;
      if (domain) {
        redirectUri = `https://${domain}/api/broker/dhan/callback`;
      }
      
      // Important: Use the correct endpoint for individual API key flow
      const loginUrl = `https://auth.dhan.co/login/consentApp-login?consentAppId=${encodeURIComponent(consentAppId)}&redirect_url=${encodeURIComponent(redirectUri)}`;

      this.consentAppIds.set(consentAppId, {
        id: consentAppId,
        createdAt: new Date(),
      });

      console.log('✅ [DHAN] Consent generated with ID:', consentAppId);
      console.log('✅ [DHAN] Consent Status:', consentData.consentAppStatus);
      console.log('✅ [DHAN] Login URL created - ready for browser redirect');
      
      return {
        consentAppId: consentAppId,
        url: loginUrl,
      };
    } catch (error: any) {
      console.error('🔴 [DHAN] Error generating consent:', error.message);
      if (error.response?.status === 401) {
        console.error('🔴 [DHAN] HTTP 401 Unauthorized - API credentials are invalid or expired');
        console.error('🔴 [DHAN] Please verify:');
        console.error('   1. DHAN_API_KEY is set correctly');
        console.error('   2. DHAN_API_SECRET is set correctly');
        console.error('   3. Credentials are active in Dhan dashboard');
      }
      if (error.response?.status === 400) {
        console.error('🔴 [DHAN] HTTP 400 Error - Check API credentials and request format');
      }
      if (error.response?.data) {
        console.error('🔴 [DHAN] API Response:', error.response.data);
      }
      return null;
    }
  }

  // Step 3: Consume Consent (server-side, after user logs in and gets tokenId)
  async consumeConsent(tokenId: string): Promise<boolean> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        console.error('🔴 [DHAN] API credentials not configured');
        return false;
      }

      console.log('🔵 [DHAN] Step 3: Consuming consent with tokenId...');

      // Call Dhan Individual API to consume consent
      // POST to https://auth.dhan.co/app/consumeApp-consent?tokenId=<TOKEN_ID>
      // Headers: app_id and app_secret (custom headers, not Basic Auth)
      const response = await axios.post(
        `https://auth.dhan.co/app/consumeApp-consent?tokenId=${tokenId}`,
        {},
        {
          headers: {
            'app_id': this.apiKey.trim(),
            'app_secret': this.apiSecret.trim(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000,
        }
      );

      const tokenData: DhanTokenResponse = response.data;
      
      if (tokenData.accessToken) {
        // Parse expiry time
        const expiryTime = tokenData.expiryTime ? new Date(tokenData.expiryTime) : new Date(Date.now() + 86400 * 1000);
        
        this.state.accessToken = tokenData.accessToken;
        this.state.clientId = tokenData.dhanClientId || '';
        this.state.userName = tokenData.dhanClientName || ''; // Use user name directly from token response
        this.state.tokenExpiry = expiryTime;
        this.state.isAuthenticated = true;
        this.state.lastRefresh = new Date();

        console.log(`✅ [DHAN] Access token obtained successfully`);
        console.log(`✅ [DHAN] Client ID: ${this.state.clientId}`);
        console.log(`✅ [DHAN] Client Name: ${this.state.userName}`);
        console.log(`⏰ [DHAN] Token expires at: ${expiryTime.toISOString()}`);
        
        return true;
      }

      console.error('🔴 [DHAN] Failed to get access token');
      console.error('🔴 [DHAN] Response:', tokenData);
      return false;
    } catch (error: any) {
      console.error('🔴 [DHAN] Token consumption error:', error.message);
      if (error.response?.status === 401) {
        console.error('🔴 [DHAN] HTTP 401 - Invalid credentials');
      }
      if (error.response?.data) {
        console.error('🔴 [DHAN] Response:', error.response.data);
      }
      return false;
    }
  }

  private async fetchAndSetProfileName(token: string): Promise<void> {
    try {
      const response = await axios.get('https://api.dhan.co/v2/profile', {
        headers: { 'access-token': token, 'Content-Type': 'application/json' },
        timeout: 5000
      });
      if (response.data?.dhanClientName) {
        this.setUserName(response.data.dhanClientName);
      }
    } catch (error) {
      // Ignore errors here
    }
  }

  // Set manual token (Individual API Key flow)
  setManualToken(clientId: string, accessToken: string, name?: string): void {
    this.state.accessToken = accessToken;
    this.state.clientId = clientId;
    this.state.userName = name || 'Dhan User';
    this.state.isAuthenticated = true;
    this.state.tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    this.state.lastRefresh = new Date();

    console.log('✅ [DHAN] Manual token set successfully');
    console.log(`✅ [DHAN] Client ID: ${clientId}`);
    if (name) console.log(`✅ [DHAN] Client Name: ${name}`);
  }

  // Update user name
  setUserName(name: string): void {
    this.state.userName = name;
    console.log(`✅ [DHAN] User name updated: ${name}`);
  }

  // Get current authentication status
  getStatus() {
    const isTokenExpired = this.state.tokenExpiry && new Date() > this.state.tokenExpiry;
    
    return {
      connected: this.state.isAuthenticated && !isTokenExpired,
      authenticated: this.state.isAuthenticated && !isTokenExpired,
      accessToken: this.state.isAuthenticated && !isTokenExpired ? this.state.accessToken : null,
      clientId: this.state.clientId,
      userEmail: this.state.userEmail,
      userName: this.state.userName,
      tokenExpiry: this.state.tokenExpiry?.getTime() || null,
      tokenExpired: isTokenExpired,
      lastRefresh: this.state.lastRefresh?.toISOString() || null,
    };
  }

  // Disconnect/reset session
  disconnect(): void {
    this.state = {
      accessToken: null,
      clientId: null,
      userEmail: null,
      userName: null,
      isAuthenticated: false,
      tokenExpiry: null,
      lastRefresh: null,
      refreshToken: null,
    };
    this.consentAppIds.clear();
    console.log('🔵 [DHAN] Session disconnected');
  }

  // Get access token for API calls
  getAccessToken(): string | null {
    if (!this.state.isAuthenticated || !this.state.accessToken) {
      return null;
    }

    if (this.state.tokenExpiry && new Date() > this.state.tokenExpiry) {
      console.warn('⚠️ [DHAN] Access token has expired');
      this.disconnect();
      return null;
    }

    return this.state.accessToken;
  }
}

// Singleton instance
// Initialize with Individual API Key credentials (DHAN_API_KEY and DHAN_API_SECRET)
export const dhanOAuthManager = new DhanOAuthManager();
