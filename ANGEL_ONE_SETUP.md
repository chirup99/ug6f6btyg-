# Angel One SmartAPI Setup Guide

## Quick Start

Angel One provides a **FREE** alternative to Fyers API with automatic TOTP authentication (no daily token refresh needed).

## Step 1: Get Your Credentials

1. Visit: https://smartapi.angelbroking.com/publisher-api
2. Sign up or login to Angel One
3. Create an API application or find your existing one
4. Collect these credentials:
   - **Client Code**: Your Angel One account code (e.g., `A12345`)
   - **PIN**: Your 4-digit trading PIN
   - **API Key**: SmartAPI key from your dashboard
   - **TOTP Secret**: From your authenticator app setup (base32 format)

## Step 2: Add to Environment

### Option A: Manual Entry (Easiest for Testing)
1. Go to Market Dashboard → Angel One (Free) tab
2. Enter your credentials in the form
3. Click "Connect to Angel One"
4. You're done!

### Option B: Environment Variables (For Auto-Connection)

Add these to your `.env` file:

```env
VITE_ANGEL_ONE_CLIENT_CODE="your-client-code"
VITE_ANGEL_ONE_PIN="1234"
VITE_ANGEL_ONE_API_KEY="your-api-key"
VITE_ANGEL_ONE_TOTP_SECRET="YOURBASE32SECRETHERE"
```

The frontend will automatically show a one-click "Connect with Environment Credentials" button.

### Option C: Secrets Management (Most Secure)

Use Replit's built-in Secrets tab:

1. Click **Secrets** in the left sidebar
2. Add these keys:
   - `VITE_ANGEL_ONE_CLIENT_CODE`
   - `VITE_ANGEL_ONE_PIN`
   - `VITE_ANGEL_ONE_API_KEY`
   - `VITE_ANGEL_ONE_TOTP_SECRET`

Replit will encrypt them automatically.

## Step 3: Verify Connection

1. Restart the application (`npm run dev`)
2. Go to Market Dashboard
3. If credentials are found:
   - Angel One (Free) tab shows: **"Connect with Environment Credentials"**
   - Click the button to connect
   - See your profile name if successful

## Features

✅ **Free** - No subscription required  
✅ **TOTP-based** - Automatic 2FA authentication  
✅ **No Daily Refresh** - Unlike Fyers which requires daily token refresh  
✅ **Real-time Data** - Access to LTP, historical data, holdings, positions  

## Supported Operations

- Get profile information
- Fetch real-time prices (LTP)
- Get historical candle data
- View holdings
- View positions
- Order book access

## Troubleshooting

### "Connection Failed - Invalid credentials"
- ✓ Verify Client Code is correct
- ✓ Check PIN is 4 digits
- ✓ Ensure API Key matches your SmartAPI dashboard
- ✓ Verify TOTP Secret is in base32 format

### "Invalid TOTP"
- ✓ Check your TOTP Secret (should be uppercase)
- ✓ Ensure authenticator app is synced
- ✓ Generate fresh TOTP from authenticator

### "Access Denied"
- ✓ Check if Angel One account is active
- ✓ Verify API access is enabled in dashboard
- ✓ Contact Angel One support if needed

## Switching Between APIs

| Feature | Fyers | Angel One |
|---------|-------|-----------|
| Cost | Paid | FREE |
| Token Refresh | Daily ✗ | Never ✓ |
| Authentication | Token-based | TOTP-based |
| Setup Time | Longer | Shorter |
| Real-time Data | Yes | Yes |

## Support

- Angel One Help: https://smartapi.angelbroking.com/docs/
- Contact: support@angelbroking.com
