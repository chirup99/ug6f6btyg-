// Upstox OAuth 2.0 Implementation
import axios from 'axios';
import crypto from 'crypto';

interface UpstoxOAuthState {
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  tokenExpiry: Date | null;
  lastRefresh: Date | null;
}

interface UpstoxTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface UpstoxProfileResponse {
  status: string;
  data: {
    user_id: string;
    email: string;
    name: string;
    user_name: string;
    broker: string;
  };
}

class UpstoxOAuthManager {
  private state: UpstoxOAuthState = {
    accessToken: null,
    userId: null,
    userEmail: null,
    userName: null,
    isAuthenticated: false,
    tokenExpiry: null,
    lastRefresh: null,
  };

  private apiKey: string = '';
  private apiSecret: string = '';
  private redirectUri: string;
  private oauthStates: Map<string, { state: string; createdAt: Date }> = new Map();

  constructor(apiKey?: string, apiSecret?: string) {
    this.apiKey = apiKey || process.env.UPSTOX_API_KEY || '';
    this.apiSecret = apiSecret || process.env.UPSTOX_API_SECRET || '';
    
    // Default to a placeholder if nothing else is available
    this.redirectUri = `http://localhost:5000/api/upstox/callback`;

    console.log('🔵 [UPSTOX] OAuth Manager initialized');
  }

  // Update credentials dynamically
  setCredentials(apiKey: string, apiSecret: string) {
    console.log('🔵 [UPSTOX] Updating credentials dynamically');
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  // Generate OAuth authorization URL with dynamic domain support
  generateAuthorizationUrl(domain?: string): { url: string; state: string } {
    console.log(`🔵 [UPSTOX] Generating auth URL for domain: ${domain || 'constructor-default'}`);
    
    // Check if credentials are configured
    if (!this.apiKey || !this.apiSecret) {
      console.error('🔴 [UPSTOX] Missing credentials during URL generation');
      throw new Error('Upstox credentials not configured. Please set UPSTOX_API_KEY and UPSTOX_API_SECRET environment variables.');
    }

    const state = crypto.randomBytes(32).toString('hex');
    
    // Use the exact redirect URI registered in the Upstox Developer Portal.
    let redirectUri = this.redirectUri;
    
    if (domain) {
      // Logic: If the current domain is perala.in, we use perala.in.
      // We must avoid the Replit URL if we are on the custom domain.
      const protocol = (domain.includes('localhost') || domain.includes('127.0.0.1')) ? 'http' : 'https';
      
      // Strip port if present
      const cleanDomain = domain.split(':')[0];
      
      // IMPORTANT: Construct the redirect URI using the CURRENT visiting domain
      redirectUri = `${protocol}://${cleanDomain}/api/upstox/callback`;
    }
    
    console.log(`🔵 [UPSTOX] Final Redirect URI being sent to Upstox: ${redirectUri}`);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.apiKey,
      redirect_uri: redirectUri,
      state: state,
    });

    // Log the EXACT URL for verification
    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?${params.toString()}`;
    console.log(`🔵 [UPSTOX] Generated URL: ${authUrl}`);
    
    // Store state with redirect URI for verification during callback
    this.oauthStates.set(state, { state, createdAt: new Date() });
    
    // Clean up old states (older than 10 minutes)
    const now = new Date();
    Array.from(this.oauthStates.entries()).forEach(([key, value]) => {
      if (now.getTime() - value.createdAt.getTime() > 10 * 60 * 1000) {
        this.oauthStates.delete(key);
      }
    });

    return { url: authUrl, state };
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, state: string, domain?: string): Promise<boolean> {
    try {
      // Verify state
      const storedState = this.oauthStates.get(state);
      if (!storedState) {
        console.error('🔴 [UPSTOX] Invalid state parameter - possible CSRF attack');
        return false;
      }
      this.oauthStates.delete(state);

      // Determine redirect URI used during authorization
      let redirectUri = this.redirectUri;
      if (domain) {
        const protocol = (domain.includes('localhost') || domain.includes('127.0.0.1')) ? 'http' : 'https';
        const cleanDomain = domain.split(':')[0];
        redirectUri = `${protocol}://${cleanDomain}/api/upstox/callback`;
      }
      
      console.log(`🔵 [UPSTOX] Using Redirect URI for token exchange: ${redirectUri}`);

      console.log('🔵 [UPSTOX] Exchanging authorization code for token...');
      console.log(`🔵 [UPSTOX] Code: ${code.substring(0, 20)}...`);
      console.log(`🔵 [UPSTOX] Client ID: ${this.apiKey.substring(0, 10)}...`);
      console.log(`🔵 [UPSTOX] Redirect URI: ${redirectUri}`);

      const tokenUrl = 'https://api.upstox.com/v2/login/authorization/token';
      const params = new URLSearchParams({
        code: code,
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      console.log('🔵 [UPSTOX] Sending token exchange request...');
      const response = await axios.post(tokenUrl, params.toString(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      });

      console.log('🔵 [UPSTOX] Token response received:', response.status);
      console.log('🔵 [UPSTOX] Response data:', JSON.stringify(response.data).substring(0, 200));
      const tokenData: UpstoxTokenResponse = response.data;
      
      if (tokenData.access_token) {
        // Token expires in 24 hours (86400 seconds) - use default if expires_in missing
        const expiresIn = tokenData.expires_in && typeof tokenData.expires_in === 'number' 
          ? tokenData.expires_in 
          : 86400; // Default to 24 hours
        
        const expiryTime = new Date(Date.now() + expiresIn * 1000);
        
        // Validate the date
        if (isNaN(expiryTime.getTime())) {
          console.error('🔴 [UPSTOX] Invalid expiry time calculated:', { expiresIn, expiryTime });
          // Use default 24 hours
          const fallbackTime = new Date(Date.now() + 86400 * 1000);
          this.state.tokenExpiry = fallbackTime;
        } else {
          this.state.tokenExpiry = expiryTime;
        }
        
        this.state.accessToken = tokenData.access_token;
        this.state.isAuthenticated = true;
        this.state.lastRefresh = new Date();

        console.log('✅ [UPSTOX] Access token obtained successfully');
        console.log(`⏰ [UPSTOX] Token expires in ${expiresIn} seconds`);
        console.log(`⏰ [UPSTOX] Token expires at: ${this.state.tokenExpiry?.toISOString()}`);

        // Fetch user profile
        await this.fetchUserProfile();
        
        return true;
      }

      console.error('🔴 [UPSTOX] Failed to get access token - no token in response');
      console.error('🔴 [UPSTOX] Response data:', JSON.stringify(tokenData));
      return false;
    } catch (error: any) {
      console.error('🔴 [UPSTOX] Token exchange error:', error.message);
      if (error.response?.status) {
        console.error('🔴 [UPSTOX] HTTP Status:', error.response.status);
      }
      if (error.response?.data) {
        console.error('🔴 [UPSTOX] Response:', JSON.stringify(error.response.data));
      }
      return false;
    }
  }

  // Fetch user profile using access token
  private async fetchUserProfile(): Promise<void> {
    try {
      if (!this.state.accessToken) {
        console.error('🔴 [UPSTOX] No access token available for profile fetch');
        return;
      }

      console.log('🔵 [UPSTOX] Fetching user profile...');

      const response = await axios.get(
        'https://api.upstox.com/v2/user/profile',
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.state.accessToken}`,
          },
          timeout: 10000,
        }
      );

      const profileData: UpstoxProfileResponse = response.data;
      
      if (profileData.data) {
        this.state.userId = profileData.data.user_id;
        this.state.userEmail = profileData.data.email;
        this.state.userName = profileData.data.user_name || profileData.data.name;

        console.log(`✅ [UPSTOX] User profile fetched: ${this.state.userName} (${this.state.userEmail})`);
      }
    } catch (error: any) {
      console.error('🔴 [UPSTOX] Profile fetch error:', error.message);
      // Non-fatal error - continue even if profile fetch fails
    }
  }

  // Get current authentication status
  getStatus() {
    const isTokenExpired = this.state.tokenExpiry && new Date() > this.state.tokenExpiry;
    
    return {
      connected: this.state.isAuthenticated && !isTokenExpired,
      authenticated: this.state.isAuthenticated && !isTokenExpired,
      accessToken: this.state.isAuthenticated && !isTokenExpired ? this.state.accessToken : null,
      userId: this.state.userId,
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
      userId: null,
      userEmail: null,
      userName: null,
      isAuthenticated: false,
      tokenExpiry: null,
      lastRefresh: null,
    };
    this.oauthStates.clear();
    console.log('🔵 [UPSTOX] Session disconnected');
  }

  // Get access token for API calls
  getAccessToken(): string | null {
    if (!this.state.isAuthenticated || !this.state.accessToken) {
      return null;
    }

    if (this.state.tokenExpiry && new Date() > this.state.tokenExpiry) {
      console.warn('⚠️ [UPSTOX] Access token has expired');
      this.disconnect();
      return null;
    }

    return this.state.accessToken;
  }
}

// Singleton instance
export const upstoxOAuthManager = new UpstoxOAuthManager();
