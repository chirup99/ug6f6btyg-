// Fyers OAuth 2.0 Implementation
import axios from 'axios';
import crypto from 'crypto';

interface FyersOAuthState {
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  tokenExpiry: Date | null;
  lastRefresh: Date | null;
}

interface StoredOAuthState {
  state: string;
  appId: string;
  secretKey: string;
  createdAt: Date;
}

class FyersOAuthManager {
  private state: FyersOAuthState = {
    accessToken: null,
    userId: null,
    userEmail: null,
    userName: null,
    isAuthenticated: false,
    tokenExpiry: null,
    lastRefresh: null,
  };

  private appId: string;
  private secretKey: string;
  private redirectUri: string;
  private oauthStates: Map<string, StoredOAuthState> = new Map();

  constructor(appId?: string, secretKey?: string) {
    this.appId = appId || process.env.FYERS_APP_ID || '';
    this.secretKey = secretKey || process.env.FYERS_SECRET_KEY || '';
    this.redirectUri = `http://localhost:5000/api/fyers/callback`;

    console.log('🔵 [FYERS] OAuth Manager initialized');
  }

  generateAuthorizationUrl(appId: string, secretKey: string, domain?: string): { url: string; state: string } {
    const state = crypto.randomBytes(32).toString('hex');
    let redirectUri = this.redirectUri;
    
    if (domain) {
      const protocol = (domain.includes('localhost') || domain.includes('127.0.0.1')) ? 'http' : 'https';
      const cleanDomain = domain.split(':')[0];
      redirectUri = `${protocol}://${cleanDomain}/api/fyers/callback`;
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
    });

    const authUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?${params.toString()}`;
    this.oauthStates.set(state, { state, appId, secretKey, createdAt: new Date() });

    return { url: authUrl, state };
  }

  async exchangeCodeForToken(code: string, state: string): Promise<boolean> {
    try {
      const storedState = this.oauthStates.get(state);
      if (!storedState) {
        console.error('🔴 [FYERS] Invalid state parameter');
        return false;
      }
      const { appId, secretKey } = storedState;
      this.oauthStates.delete(state);

      const appIdHash = crypto.createHash('sha256').update(`${appId}:${secretKey}`).digest('hex');

      const response = await axios.post('https://api-t1.fyers.in/api/v3/validate-authcode', {
        grant_type: 'authorization_code',
        appIdHash: appIdHash,
        code: code,
      });

      if (response.data.s === 'ok' && response.data.access_token) {
        this.state.accessToken = response.data.access_token;
        this.state.isAuthenticated = true;
        this.state.lastRefresh = new Date();
        this.state.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.fetchUserProfile(appId, secretKey);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('🔴 [FYERS] Token exchange error:', error.message);
      return false;
    }
  }

  private async fetchUserProfile(appId: string, secretKey: string): Promise<void> {
    try {
      if (!this.state.accessToken) return;

      const response = await axios.get('https://api-t1.fyers.in/api/v3/profile', {
        headers: {
          'Authorization': `${appId}:${this.state.accessToken}`
        }
      });

      if (response.data.s === 'ok') {
        this.state.userId = response.data.data.fy_id;
        this.state.userEmail = response.data.data.email_id;
        this.state.userName = response.data.data.display_name || response.data.data.name;
      }
    } catch (error: any) {
      console.error('🔴 [FYERS] Profile fetch error:', error.message);
    }
  }

  getStatus() {
    return {
      connected: this.state.isAuthenticated,
      authenticated: this.state.isAuthenticated,
      accessToken: this.state.accessToken,
      userId: this.state.userId,
      userEmail: this.state.userEmail,
      userName: this.state.userName,
    };
  }

  async getOrders(): Promise<any[]> {
    try {
      if (!this.state.accessToken || !this.state.userId) return [];

      const response = await axios.get('https://api-t1.fyers.in/api/v3/orders', {
        headers: {
          'Authorization': `${this.appId}:${this.state.accessToken}`
        }
      });

      if (response.data.s === 'ok') {
        // Map Fyers statuses to our app's internal status based on documentation
        const statusMap: Record<number, string> = {
          1: 'CANCELLED',
          2: 'COMPLETE',
          4: 'TRANSIT',
          5: 'REJECTED',
          6: 'PENDING',
          7: 'EXPIRED'
        };

        return response.data.data.orderBook.map((order: any) => ({
          id: order.id,
          time: order.orderDateTime,
          order: order.side === 1 ? "BUY" : "SELL",
          symbol: order.symbol,
          type: order.type === 1 ? "LIMIT" : order.type === 2 ? "MARKET" : order.type === 3 ? "SL-M" : "SL-L",
          qty: order.qty,
          price: order.tradedPrice || order.limitPrice,
          status: statusMap[order.status] || 'PENDING'
        }));
      }
      return [];
    } catch (error: any) {
      console.error('🔴 [FYERS] Orders fetch error:', error.message);
      return [];
    }
  }

  async getPositions(): Promise<any[]> {
    try {
      if (!this.state.accessToken || !this.state.userId) return [];

      const response = await axios.get('https://api-t1.fyers.in/api/v3/positions', {
        headers: {
          'Authorization': `${this.appId}:${this.state.accessToken}`
        }
      });

      if (response.data.s === 'ok') {
        return response.data.netPositions.map((pos: any) => ({
          symbol: pos.symbol,
          entryPrice: pos.avgPrice,
          currentPrice: pos.ltp,
          qty: pos.netQty,
          realizedPnl: pos.realized_profit,
          unrealizedPnl: pos.unrealized_profit,
          totalPnl: pos.pl,
          status: pos.netQty !== 0 ? "OPEN" : "CLOSED"
        }));
      }
      return [];
    } catch (error: any) {
      console.error('🔴 [FYERS] Positions fetch error:', error.message);
      return [];
    }
  }

  disconnect(): void {
    this.state = {
      accessToken: null,
      userId: null,
      userEmail: null,
      userName: null,
      isAuthenticated: false,
      tokenExpiry: null,
      lastRefresh: null,
    };
  }
}

export const fyersOAuthManager = new FyersOAuthManager();
