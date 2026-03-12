# OAuth 2.0 Client Configuration for PERALA (Cloud Run)

## Where to Configure OAuth URLs

### Step 1: Find Your OAuth 2.0 Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **`fast-planet-470408-f1`**
3. Navigate to: **APIs & Services** → **Credentials**
4. Look for **OAuth 2.0 Client IDs**
5. Find the one named: **"Web client (auto created by Google Service)"** or similar

### Step 2: Configure Authorized JavaScript Origins

Click **Edit** on your OAuth client, then add these origins:

```
https://fast-planet-470408-f1.firebaseapp.com
https://fast-planet-470408-f1.web.app
https://perala-xxxxx-uc.a.run.app
```

*(Replace `perala-xxxxx-uc.a.run.app` with your actual Cloud Run URL)*

### Step 3: Configure Authorized Redirect URIs

Add this redirect URI (this is the **critical one** for Firebase Auth):

```
https://fast-planet-470408-f1.firebaseapp.com/__/auth/handler
```

**Important:** This exact URL is required for Firebase Authentication to work!

### Step 4: Save Changes

Click **Save** at the bottom. Changes can take **5-15 minutes** to propagate.

---

## Complete OAuth Configuration Example

After configuration, your OAuth client should look like this:

**Authorized JavaScript origins:**
```
https://fast-planet-470408-f1.firebaseapp.com
https://fast-planet-470408-f1.web.app
https://perala-xxxxx-uc.a.run.app
```

**Authorized redirect URIs:**
```
https://fast-planet-470408-f1.firebaseapp.com/__/auth/handler
```

---

## Firebase Authorized Domains (Also Required)

In addition to OAuth URLs, also add domains in Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select: **`fast-planet-470408-f1`**
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Add:
   - `fast-planet-470408-f1.firebaseapp.com` (default, should already be there)
   - `fast-planet-470408-f1.web.app` (if using Firebase Hosting)
   - `perala-xxxxx-uc.a.run.app` (your Cloud Run domain)

---

## Quick Reference: All URLs You Need

### For Your Project: `fast-planet-470408-f1`

#### 1. Google Cloud Console OAuth Client
**Location:** APIs & Services → Credentials → OAuth 2.0 Client IDs

**JavaScript Origins:**
- `https://fast-planet-470408-f1.firebaseapp.com`
- `https://fast-planet-470408-f1.web.app`
- `https://perala-xxxxx-uc.a.run.app` ← Your Cloud Run URL

**Redirect URIs:**
- `https://fast-planet-470408-f1.firebaseapp.com/__/auth/handler`

#### 2. Firebase Console Authorized Domains
**Location:** Authentication → Settings → Authorized domains

**Add:**
- `fast-planet-470408-f1.firebaseapp.com`
- `fast-planet-470408-f1.web.app`
- `perala-xxxxx-uc.a.run.app` ← Your Cloud Run domain

#### 3. Backend CORS (server/index.ts)
**Location:** `server/index.ts` line 68-72

```typescript
const allowedOrigins = [
  'https://fast-planet-470408-f1.web.app',
  'https://fast-planet-470408-f1.firebaseapp.com',
  'https://perala-xxxxx-uc.a.run.app',  // ← Your Cloud Run URL
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
].filter(Boolean);
```

---

## How to Get Your Cloud Run URL

After deploying PERALA:

```bash
gcloud run services describe perala --region us-central1 --format="value(status.url)"
```

Example output:
```
https://perala-abcd1234-uc.a.run.app
```

Use this URL in all the places above!

---

## Troubleshooting

### Error: `redirect_uri_mismatch`

**Cause:** The redirect URI doesn't match what's configured in OAuth client

**Fix:**
1. Verify the redirect URI is **exactly**: `https://fast-planet-470408-f1.firebaseapp.com/__/auth/handler`
2. No trailing slashes
3. Must be HTTPS (not HTTP)
4. Wait 5-15 minutes after saving changes

### Error: `auth/auth-domain-config-required`

**Cause:** Domain not authorized in Firebase

**Fix:**
1. Add your Cloud Run domain to Firebase Authorized Domains
2. Make sure it matches exactly (no `https://` prefix, no trailing `/`)

### Error: `auth/api-key-not-valid`

**Cause:** API key restrictions or frontend build issue

**Fix:**
1. Check that VITE_ variables were passed during Docker build
2. Verify API key in Google Cloud Console is enabled for your domains
3. Redeploy with: `./deploy-perala-complete.sh`

---

## Complete Setup Checklist

✅ **Step 1:** Deploy PERALA to get Cloud Run URL
```bash
./deploy-perala-complete.sh
```

✅ **Step 2:** Get your URL
```bash
gcloud run services describe perala --region us-central1 --format="value(status.url)"
```

✅ **Step 3:** Add OAuth URLs in Google Cloud Console
- JavaScript Origins: Add Cloud Run URL
- Redirect URIs: Add `https://fast-planet-470408-f1.firebaseapp.com/__/auth/handler`

✅ **Step 4:** Add domain to Firebase Authorized Domains
- Add Cloud Run domain (without `https://`)

✅ **Step 5:** Update backend CORS in `server/index.ts`
- Add Cloud Run URL to allowedOrigins

✅ **Step 6:** Redeploy
```bash
./deploy-perala-complete.sh
```

✅ **Step 7:** Test login at your Cloud Run URL

---

## Success Indicators

After proper configuration:

✅ No `redirect_uri_mismatch` errors
✅ Google Sign-In popup appears correctly
✅ After login, redirects back to your app successfully
✅ User is authenticated and can access dashboard
✅ No CORS errors in browser console

---

## Direct Links

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=fast-planet-470408-f1)
- [Firebase Console - Authorized Domains](https://console.firebase.google.com/project/fast-planet-470408-f1/authentication/settings)

---

Your PERALA server will work perfectly after these OAuth configurations! 🚀
