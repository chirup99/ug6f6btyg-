// Angel One OAuth - Proper Token Exchange Implementation
import axios from "axios";

interface AngelOneSession {
  accessToken: string | null;
  refreshToken: string | null;
  feedToken: string | null;
  clientCode: string | null;
  userName: string | null;
  isAuthenticated: boolean;
}

class AngelOneOAuthManager {
  private session: AngelOneSession = {
    accessToken: null,
    refreshToken: null,
    feedToken: null,
    clientCode: null,
    userName: null,
    isAuthenticated: false,
  };

  private clientCode: string;
  private apiKey: string;

  constructor() {
    this.clientCode = process.env.ANGEL_ONE_CLIENT_CODE || "P176266";
    this.apiKey = process.env.ANGEL_ONE_API_KEY || "";

    console.log("✅ [ANGEL ONE] OAuth Manager initialized");
    console.log(`   Client Code: ${this.clientCode}`);
    console.log(`   API Key: ${this.apiKey ? "✅ Configured" : "❌ NOT SET - Web login will fail"}`);
  }

  // Get authorization URL for redirect-based login
  getAuthorizationUrl(state?: string, redirectUri?: string): string {
    // CRITICAL: Re-read API key from environment at request time (not at init time)
    const freshApiKey = process.env.ANGEL_ONE_API_KEY || this.apiKey || "";
    
    if (!freshApiKey) {
      console.error("❌ [ANGEL ONE] API Key not configured!");
      console.error("   Please set ANGEL_ONE_API_KEY environment variable");
      console.error("   Current value:", process.env.ANGEL_ONE_API_KEY);
      throw new Error("ANGEL_ONE_API_KEY environment variable is not set");
    }
    
    // According to Angel One official docs:
    // OAuth URL format: https://smartapi.angelone.in/publisher-login?api_key={apiKey}&state={state}&redirect_uri={redirectUri}
    const baseUrl = "https://smartapi.angelone.in/publisher-login";
    const stateVar = state || "live";
    
    // Build auth URL with proper query parameters (CRITICAL for proper OAuth flow)
    const params = new URLSearchParams();
    params.append("api_key", freshApiKey);
    params.append("state", stateVar);
    
    // If redirect_uri is provided, include it
    if (redirectUri) {
      params.append("redirect_uri", redirectUri);
      console.log(`   Redirect URI: ${redirectUri}`);
    }
    
    // Format: https://smartapi.angelone.in/publisher-login?api_key=...&state=...&redirect_uri=...
    const authUrl = `${baseUrl}?${params.toString()}`;
    
    console.log("✅ [ANGEL ONE] Auth URL generated:");
    console.log(`   Client Code: ${this.clientCode}`);
    console.log(`   API Key: ${freshApiKey.substring(0, 4)}...`);
    console.log(`   State: ${stateVar}`);
    console.log(`   Full URL: ${authUrl}`);
    
    return authUrl;
  }

  // CRITICAL: Exchange temporary auth_token & feed_token for JWT tokens
  async exchangeTokensForJWT(authToken: string, feedToken: string): Promise<{
    success: boolean;
    jwtToken?: string;
    refreshToken?: string;
    feedToken?: string;
    message?: string;
  }> {
    try {
      console.log("🔶 [ANGEL ONE] Exchanging temporary tokens for JWT tokens...");
      console.log(`   auth_token: ${authToken.substring(0, 30)}...`);
      
      // IMPORTANT: According to Angel One docs, use generateTokens endpoint
      // This converts the temporary auth_token to JWT tokens
      const response = await axios.post(
        "https://apiconnect.angelone.in/rest/auth/angelbroking/jwt/v1/generateTokens",
        {
          refreshToken: authToken, // Angel One uses the authToken from URL as refreshToken for this specific endpoint
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-UserType": "USER",
            "X-SourceID": "WEB",
            "X-ClientLocalIP": "127.0.0.1",
            "X-ClientPublicIP": "127.0.0.1",
            "X-MACAddress": "00:00:00:00:00:00",
            "X-PrivateKey": this.apiKey,
          },
          timeout: 10000,
        }
      );

      console.log("🔶 [ANGEL ONE] Token exchange response received");
      
      if (response.data?.status === true && response.data?.data?.jwtToken) {
        console.log("✅ [ANGEL ONE] JWT tokens acquired successfully!");
        console.log(`   JWT Token: ${response.data.data.jwtToken.substring(0, 30)}...`);
        
        this.session.accessToken = response.data.data.jwtToken;
        this.session.refreshToken = response.data.data.refreshToken;
        this.session.feedToken = feedToken;
        this.session.clientCode = this.clientCode;
        this.session.isAuthenticated = true;
        this.session.userName = this.clientCode;

        return {
          success: true,
          jwtToken: response.data.data.jwtToken,
          refreshToken: response.data.data.refreshToken,
          feedToken: feedToken,
        };
      } else {
        const errorMsg = response.data?.message || "Token exchange failed";
        console.error("🔴 [ANGEL ONE] Token exchange failed:", errorMsg);
        return {
          success: false,
          message: errorMsg,
        };
      }
    } catch (error: any) {
      console.error("🔴 [ANGEL ONE] Token exchange error:", error.message);
      if (error.response?.data) {
        console.error("   Response:", error.response.data);
      }
      return {
        success: false,
        message: error.response?.data?.message || "Token exchange failed: " + error.message,
      };
    }
  }

  // Handle callback from Angel One
  async handleCallback(authToken: string, feedToken: string): Promise<{
    success: boolean;
    token?: string;
    feedToken?: string;
    refreshToken?: string;
    clientCode?: string;
    message?: string;
  }> {
    try {
      console.log("🔶 [ANGEL ONE] Handling OAuth callback...");
      
      // Exchange temporary tokens for JWT tokens
      const exchangeResult = await this.exchangeTokensForJWT(authToken, feedToken);
      
      if (!exchangeResult.success) {
        return {
          success: false,
          message: exchangeResult.message || "Failed to exchange tokens",
        };
      }

      console.log("✅ [ANGEL ONE] Successfully authenticated via OAuth callback!");

      return {
        success: true,
        token: exchangeResult.jwtToken,
        refreshToken: exchangeResult.refreshToken,
        feedToken: exchangeResult.feedToken,
        clientCode: this.clientCode,
      };
    } catch (error: any) {
      console.error("🔴 [ANGEL ONE] Callback handling error:", error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Authenticate with Angel One using credentials and TOTP
  async authenticateWithTotp(totp: string, password: string): Promise<{ 
    success: boolean; 
    token?: string; 
    clientCode?: string;
    message?: string;
  }> {
    try {
      console.log("🔶 [ANGEL ONE] Authenticating with TOTP...");

      const response = await axios.post(
        "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/generateSession",
        {
          clientcode: this.clientCode,
          password: password,
          totp: totp,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data?.status === true && response.data?.data?.jwtToken) {
        this.session.accessToken = response.data.data.jwtToken;
        this.session.refreshToken = response.data.data.refreshToken;
        this.session.feedToken = response.data.data.feedToken;
        this.session.clientCode = this.clientCode;
        this.session.isAuthenticated = true;
        this.session.userName = response.data.data?.userName || this.clientCode;

        console.log("✅ [ANGEL ONE] Successfully authenticated!");
        console.log(`   User: ${this.session.userName}`);

        return {
          success: true,
          token: response.data.data.jwtToken,
          clientCode: this.clientCode,
        };
      }

      console.error("🔴 [ANGEL ONE] Authentication failed - Invalid response");
      return {
        success: false,
        message: response.data?.message || "Authentication failed",
      };
    } catch (error: any) {
      console.error("🔴 [ANGEL ONE] Authentication error:", error.message);
      return {
        success: false,
        message: error.response?.data?.message || "Authentication error: " + error.message,
      };
    }
  }

  // Set tokens directly (for database-loaded tokens)
  setTokens(accessToken: string, refreshToken?: string, feedToken?: string) {
    this.session.accessToken = accessToken;
    if (refreshToken) this.session.refreshToken = refreshToken;
    if (feedToken) this.session.feedToken = feedToken;
    this.session.clientCode = this.clientCode;
    this.session.isAuthenticated = true;
    this.session.userName = this.clientCode;
    console.log("✅ [ANGEL ONE] Tokens loaded from database");
  }

  // Get current session
  getSession() {
    return {
      authenticated: this.session.isAuthenticated,
      accessToken: this.session.accessToken,
      refreshToken: this.session.refreshToken,
      feedToken: this.session.feedToken,
      clientCode: this.session.clientCode,
      userName: this.session.userName,
    };
  }

  // Get access token only
  getAccessToken(): string | null {
    return this.session.accessToken;
  }

  // Get feed token only
  getFeedToken(): string | null {
    return this.session.feedToken;
  }

  // Disconnect
  disconnect() {
    this.session = {
      accessToken: null,
      refreshToken: null,
      feedToken: null,
      clientCode: null,
      userName: null,
      isAuthenticated: false,
    };
    console.log("🔶 [ANGEL ONE] Disconnected");
  }
}

export const angelOneOAuthManager = new AngelOneOAuthManager();
