# Comprehensive Bug Report - Trading Platform
**Date:** November 19, 2025  
**Test Environment:** Replit Development Server (Local)  
**Tester:** Automated System Test

---

## 🔴 CRITICAL BUGS (P0 - Blocking)

### BUG #1: Cloud Run CORS Error - Trending Podcasts API
**Severity:** CRITICAL  
**Component:** Cloud Run Backend Integration  
**Status:** ❌ BLOCKING

**Error Message:**
```
Access to fetch at 'https://perala-808950990883.us-central1.run.app/api/trending-podcasts' 
from origin 'http://127.0.0.1:5000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Impact:**  
- Trending podcasts feature completely non-functional
- Affects MiniCast Tutor tab
- Cloud Run backend rejects all requests from local development
- Production deployment will have same CORS issues

**Root Cause:**
1. Cloud Run service not configured with `--allow-unauthenticated` flag
2. CORS preflight OPTIONS requests blocked by Cloud Run IAM layer
3. Missing CORS headers in Cloud Run response

**Reproduction Steps:**
1. Load landing page (http://127.0.0.1:5000/)
2. Open browser console
3. See error: "Error fetching trending podcasts: TypeError: Failed to fetch"
4. Network tab shows CORS policy error

**Recommended Fix:**
1. Deploy Cloud Run with `--allow-unauthenticated` flag:
   ```bash
   gcloud run deploy perala \
     --allow-unauthenticated \
     --region us-central1 \
     --source .
   ```
2. Update server CORS configuration to include all Cloud Run domains (already done in server/index.ts)
3. Ensure OPTIONS requests are handled before IAM authentication

**Files Affected:**
- `client/src/pages/home.tsx` (line 3691: fetchTrendingPodcasts function)
- Cloud Run deployment configuration

---

### BUG #2: Fyers API Authentication Failures
**Severity:** CRITICAL  
**Component:** Fyers API Integration  
**Status:** ❌ BLOCKING

**Error Message:**
```
❌ Failed POST https://api-t1.fyers.in/data/history: 401 Could not authenticate the user
❌ Fyers API request failed: 401 Request failed with status code 401
Failed to get Fyers quotes: Error: Authentication failed. Please check your access token.
```

**Impact:**
- Historical stock data completely unavailable
- Real-time price quotes failing
- Trading Master tab cannot load chart data
- Technical Analysis features non-functional
- All 50 stocks failing to fetch historical OHLC data

**Root Cause:**
1. Invalid or expired Fyers API access token
2. Incorrect authorization header format
3. Token not properly set in environment variables

**Reproduction Steps:**
1. Server starts and attempts to fetch historical data
2. All Fyers API requests fail with 401 Unauthorized
3. Console shows: "Authentication failed. Please check your access token."

**Current Behavior:**
- Server tries 8 different endpoint variations
- All endpoints reject with 401 or 404 errors
- Historical data collection completely fails

**Recommended Fix:**
1. Verify Fyers API credentials are set in environment:
   ```bash
   # Check if these are set
   FYERS_APP_ID
   FYERS_ACCESS_TOKEN
   FYERS_API_KEY
   ```
2. Regenerate Fyers access token if expired
3. Update authorization header format in server/fyers-api.ts
4. Add token refresh mechanism before expiration

**Files Affected:**
- `server/fyers-api.ts` (lines 271, 330, 332, 1374)
- `server/live-websocket-streamer.ts` (line 234)
- Environment configuration

---

### BUG #3: Fyers API Service Unavailable (503 Errors)
**Severity:** CRITICAL  
**Component:** Fyers API Historical Data  
**Status:** ❌ BLOCKING

**Error Message:**
```
❌ Failed POST https://api.fyers.in/data/history: 503 Request failed with status code 503
Error details: <html><head><title>503 Service Temporarily Unavailable</title></head></html>
❌ OLDER-MONTHS: Failed NSE:RELIANCE-EQ (Month 3): Error: Historical data temporarily unavailable
```

**Impact:**
- Historical data for older months (3+ months ago) completely failing
- All 50 stocks experiencing 503 errors on historical data fetch
- Trading Master cannot show historical patterns
- Chart analysis features broken

**Root Cause:**
1. Fyers API v3 /data/history endpoint returning 503
2. Endpoint possibly deprecated or under maintenance
3. Using incorrect API version or endpoint structure

**Current Failed Endpoints:**
```
❌ https://myapi.fyers.in/data/history (405 Method Not Allowed)
❌ https://myapi.fyers.in/data/history (404 Not Found - GET)
❌ https://myapi.fyers.in/api/v3/data/history (405 Method Not Allowed)
❌ https://myapi.fyers.in/api/v3/data/history (404 Not Found - GET)
❌ https://api-t1.fyers.in/data/history (401 Unauthorized)
❌ https://api-t2.fyers.in/data/history (503 Service Unavailable)
❌ https://api.fyers.in/data/history (503 Service Unavailable)
```

**Recommended Fix:**
1. Check Fyers API documentation for correct endpoint
2. Use v2 API instead of v3 if v3 is deprecated
3. Implement fallback to Yahoo Finance or alternative data source
4. Add retry logic with exponential backoff
5. Cache historical data to reduce API dependency

**Files Affected:**
- `server/fyers-api.ts` (line 1374: fetchDirectHistoricalData)
- `server/routes.ts` (line 8509: fetchOlderMonthsData)

---

### BUG #4: Fyers API Rate Limiting
**Severity:** HIGH  
**Component:** Real-time Price Streaming  
**Status:** ⚠️ DEGRADED SERVICE

**Error Message:**
```
❌ Fyers API request failed: 429 Request failed with status code 429
🚫 Rate limiting detected - setting 15-minute cooldown
⏳ Rate limit cooldown active for live quotes, 13 minutes remaining
Failed to get Fyers quotes: Error: Rate limited by Fyers API. Please wait 13 more minutes.
```

**Impact:**
- Real-time price updates stop for 15 minutes
- WebSocket price streaming suspended
- Users cannot see live market data
- Trading decisions impacted by stale data

**Root Cause:**
1. Too many API calls to Fyers /quotes endpoint
2. Polling interval too aggressive (likely calling every few seconds)
3. Not respecting Fyers rate limits (likely 100 calls/minute or similar)

**Current Behavior:**
- System detects 429 error
- Sets 15-minute cooldown
- All quote requests fail during cooldown
- No fallback data source available

**Recommended Fix:**
1. Increase polling interval (e.g., from 2s to 10s or 30s)
2. Implement request batching (fetch multiple symbols in one call)
3. Add intelligent throttling before hitting rate limit
4. Use WebSocket streaming if available instead of polling
5. Implement fallback to cached data during cooldown
6. Add Yahoo Finance as backup data source

**Files Affected:**
- `server/fyers-api.ts` (lines 271, 330)
- `server/live-websocket-streamer.ts` (lines 220, 234)

---

## 🟡 HIGH PRIORITY BUGS (P1 - User Impact)

### BUG #5: Journal Chart Data Fetch Error
**Severity:** HIGH  
**Component:** Trading Journal / Trade Book  
**Status:** ❌ BROKEN

**Error Message:**
```
Error fetching journal chart data: {}
```

**Impact:**
- Journal chart visualization not loading
- Trade history charts broken
- Performance analytics unavailable

**Root Cause:**
- API endpoint failing silently
- Empty error object indicates network or parsing error
- Possible Firebase or Google Cloud data fetch failure

**Recommended Fix:**
1. Add proper error logging to identify exact failure point
2. Check Firebase/Google Cloud connectivity
3. Verify journal data API endpoints are working
4. Add fallback to demo data if real data unavailable

**Files Affected:**
- `client/src/pages/home.tsx` (journal chart data fetch logic)

---

### BUG #6: Heatmap Data Loading Error
**Severity:** HIGH  
**Component:** Trading Master Heatmap  
**Status:** ⚠️ DEGRADED (Fallback Active)

**Error Message:**
```
❌ Error loading heatmap data: {}
🔄 Falling back to localStorage data...
```

**Impact:**
- Heatmap data fails to load from API
- System falls back to localStorage (stale data)
- Users see outdated trading performance data
- New users see empty heatmap

**Root Cause:**
- API endpoint `/api/journal/all-dates` possibly failing
- Network error or API authentication issue
- Google Cloud Firestore data fetch failure

**Current Behavior:**
- Primary data source fails silently
- Falls back to localStorage cached data
- No retry mechanism
- Error details not captured (empty object)

**Recommended Fix:**
1. Add detailed error logging
2. Implement retry logic (3 attempts with exponential backoff)
3. Show user-friendly error message instead of silent fallback
4. Verify Google Cloud Firestore permissions
5. Add loading skeleton while fetching

**Files Affected:**
- `client/src/pages/home.tsx` (heatmap data loading)
- `server/routes.ts` (`/api/journal/all-dates` endpoint)

---

## 🔵 MEDIUM PRIORITY BUGS (P2 - Enhancement Needed)

### BUG #7: Vite WebSocket HMR Connection Failure
**Severity:** MEDIUM  
**Component:** Development Server (Vite)  
**Status:** ⚠️ NON-CRITICAL

**Error Message:**
```
[vite] failed to connect to websocket.
your current setup:
  (browser) 127.0.0.1:5000/ <--[HTTP]--> localhost:5173/ (server)
  (browser) 127.0.0.1:5000/ <--[WebSocket (failing)]--> localhost:5173/ (server)
WebSocket connection to 'ws://127.0.0.1:5000/?token=...' failed: 
Error during WebSocket handshake: Unexpected response code: 400
```

**Impact:**
- Hot Module Replacement (HMR) not working
- Developer must manually refresh browser after code changes
- Slower development iteration speed
- No impact on production builds

**Root Cause:**
- Vite HMR WebSocket trying to connect through Express server
- Express server returns 400 on WebSocket upgrade request
- HMR proxy configuration issue

**Recommended Fix:**
1. This is development-only and doesn't affect production
2. Can be safely ignored for now
3. To fix: Configure Vite HMR to use correct WebSocket port
4. Alternative: Use manual refresh during development

**Files Affected:**
- `vite.config.ts` (HMR configuration)
- Development workflow only

---

## 📊 SUMMARY

### Critical Issues (Must Fix Immediately)
- ❌ **Cloud Run CORS blocking all API requests** → Deploy with --allow-unauthenticated
- ❌ **Fyers API authentication failing** → Update API credentials
- ❌ **Fyers API 503 errors on historical data** → Fix endpoint or use fallback
- ⚠️ **Fyers rate limiting** → Reduce polling frequency

### High Priority (Fix Soon)
- ❌ **Journal chart data error** → Add proper error handling
- ⚠️ **Heatmap fallback to localStorage** → Fix primary data source

### Medium Priority (Enhancement)
- ⚠️ **Vite HMR WebSocket** → Dev experience improvement (optional)

---

## 🔧 RECOMMENDED ACTION PLAN

### Immediate Actions (P0 - Today)
1. **Fix Fyers API credentials** → Update access token in environment
2. **Deploy Cloud Run with CORS fix** → Use --allow-unauthenticated flag
3. **Investigate Fyers API v3 endpoints** → Check documentation or switch to v2
4. **Reduce Fyers polling rate** → Change from 2s to 30s interval

### Short Term (P1 - This Week)
1. **Add comprehensive error logging** → Identify all failure points
2. **Implement fallback data sources** → Yahoo Finance for when Fyers fails
3. **Fix journal/heatmap data loading** → Proper error handling and retry
4. **Add user-facing error messages** → Don't fail silently

### Long Term (P2 - Future)
1. **Optimize Fyers API usage** → Batch requests, use WebSocket
2. **Add data caching layer** → Reduce API dependency
3. **Implement monitoring/alerting** → Track API failures
4. **Fix Vite HMR for better DX** → Developer experience improvement

---

## ✅ LANDING PAGE STATUS

### What's Working ✅
- World map displays correctly
- Market indices show real-time data (USA +0.45%, CANADA +0.28%, INDIA +0.65%, HONG KONG +0.22%, TOKYO +0.38%)
- Navigation buttons functional (Technical Analysis, Social Feed, Market News, Trading Journal, Fundamentals)
- Feature cards display (Social Feed, Trading Master, Journal)
- Dark theme working correctly
- Search bar rendered
- Sidebar navigation (home, login, theme toggle)
- Tech news section displays

### What's Broken ❌
- Trending podcasts (CORS error)
- Historical stock data (Fyers API issues)
- Real-time quotes (rate limited)
- Journal charts (data fetch error)
- Heatmap (falling back to localStorage)

---

**END OF BUG REPORT**
