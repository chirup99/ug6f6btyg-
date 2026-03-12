// Simple Angel One OAuth - No complex request tokens, just environment credentials
import axios from "axios";

interface AngelOneAuth {
  accessToken: string | null;
  clientCode: string | null;
  isAuthenticated: boolean;
}

class SimpleAngelOneAuth {
  private auth: AngelOneAuth = {
    accessToken: null,
    clientCode: null,
    isAuthenticated: false,
  };

  private clientCode: string;
  private password: string;
  private apiKey: string;

  constructor() {
    this.clientCode = process.env.ANGELONE_CLIENT_CODE || "P176266";
    this.password = process.env.ANGELONE_PASSWORD || "";
    this.apiKey = process.env.ANGELONE_API_KEY || "";

    console.log("✅ [ANGEL ONE] Simple OAuth initialized");
    console.log(`   Client Code: ${this.clientCode}`);
  }

  // Simple popup token - just return client code and request token
  async getPopupToken(): Promise<{ token: string; clientCode: string }> {
    try {
      // For popup, we just return a simple token that user can use
      // In real scenario, this would be exchanged via Angel One's login page
      const popupToken = `popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log("🔶 [ANGEL ONE] Generated popup token for authentication");
      
      return {
        token: popupToken,
        clientCode: this.clientCode,
      };
    } catch (error) {
      console.error("🔴 [ANGEL ONE] Error generating popup token:", error);
      throw error;
    }
  }

  // Exchange popup token for real JWT token
  async exchangePopupTokenForJWT(
    popupToken: string,
    totp: string
  ): Promise<boolean> {
    try {
      if (!this.password || !this.apiKey) {
        console.error("🔴 [ANGEL ONE] Missing credentials in environment");
        return false;
      }

      console.log("🔶 [ANGEL ONE] Exchanging popup token for JWT...");

      const response = await axios.post(
        "https://api.angelone.in/rest/auth/angelbroking/user/v1/generateSession",
        {
          clientcode: this.clientCode,
          password: this.password,
          totp: totp,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.data?.jwtToken) {
        this.auth.accessToken = response.data.data.jwtToken;
        this.auth.clientCode = this.clientCode;
        this.auth.isAuthenticated = true;

        console.log("✅ [ANGEL ONE] JWT token obtained successfully");
        return true;
      }

      console.error("🔴 [ANGEL ONE] No JWT token in response");
      return false;
    } catch (error: any) {
      console.error("🔴 [ANGEL ONE] Token exchange error:", error.message);
      return false;
    }
  }

  // Get auth status
  getStatus() {
    return {
      authenticated: this.auth.isAuthenticated,
      accessToken: this.auth.accessToken,
      clientCode: this.auth.clientCode,
    };
  }

  // Get access token
  getAccessToken(): string | null {
    return this.auth.accessToken;
  }

  // Disconnect
  disconnect() {
    this.auth = {
      accessToken: null,
      clientCode: null,
      isAuthenticated: false,
    };
    console.log("🔶 [ANGEL ONE] Disconnected");
  }
}

export const simpleAngelOneAuth = new SimpleAngelOneAuth();
