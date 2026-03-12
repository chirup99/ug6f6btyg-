# 🚀 Deployment Guide: Firebase Hosting + Google Cloud Run

## Problem
Your authentication isn't working on Firebase Hosting because:
- **Firebase Hosting** = Static files only (HTML, CSS, JS)
- **No backend server** = No API endpoints for authentication

## Solution
Deploy your backend separately to **Google Cloud Run**, then connect your Firebase frontend to it.

---

## Prerequisites

1. **Google Cloud account** (same project as Firebase)
2. **gcloud CLI installed**: https://cloud.google.com/sdk/docs/install
3. **Authenticate gcloud**:
   ```bash
   gcloud auth login
   gcloud config set project fast-planet-470408-f1
   ```

---

## Step 1: Deploy Backend to Google Cloud Run

### Option A: Automated Script (Recommended)
```bash
./deploy-cloud-run.sh
```

### Option B: Manual Deployment
```bash
# Deploy backend using Dockerfile
gcloud run deploy trading-platform-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10
```

**What happens:**
- Cloud Build creates Docker container using the Dockerfile
- Builds **only the backend** (Express server) - not the frontend
- Deploys to Cloud Run with auto-scaling
- Provides HTTPS URL like: `https://trading-platform-backend-xxx.run.app`

**Important Notes:**
- The Dockerfile builds only the backend (server/) to avoid browser dependency issues
- The frontend is deployed separately to Firebase Hosting
- This keeps the Docker container lightweight and optimized for API serving

---

## Step 2: Configure Environment Variables on Cloud Run

Your backend needs these secrets to work:

```bash
gcloud run services update trading-platform-backend \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production,\
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,\
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,\
GOOGLE_REDIRECT_URI=https://trading-platform-backend-xxx.run.app/api/auth/google/callback,\
FYERS_API_KEY=$FYERS_API_KEY,\
FYERS_SECRET_KEY=$FYERS_SECRET_KEY,\
FYERS_APP_ID=$FYERS_APP_ID,\
GEMINI_API_KEY=$GEMINI_API_KEY,\
DATABASE_URL=$DATABASE_URL,\
SESSION_SECRET=$SESSION_SECRET"
```

**To get your Cloud Run URL:**
```bash
gcloud run services describe trading-platform-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

---

## Step 3: Update Frontend to Use Cloud Run Backend

### A. Update Environment Variables

Create `client/.env.production`:
```env
VITE_API_URL=https://trading-platform-backend-xxx.run.app
```

### B. Update API Client (if needed)

If your frontend doesn't already use environment variables, update `client/src/lib/queryClient.ts`:

```typescript
// Add at the top
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Update apiRequest function
export async function apiRequest(...) {
  const res = await fetch(`${API_BASE_URL}${requestUrl}`, {
    // ... rest of config
  });
}

// Update getQueryFn
const res = await fetch(`${API_BASE_URL}${queryKey.join("/")}`, {
  // ... rest of config
});
```

---

## Step 4: Rebuild and Redeploy Frontend to Firebase

```bash
# Build frontend with production env vars
npm run build

# Deploy to Firebase Hosting
GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json firebase deploy --only hosting
```

---

## Step 5: Update Google OAuth Settings

In Google Cloud Console (https://console.cloud.google.com):

1. Go to **APIs & Services** → **Credentials**
2. Click your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://trading-platform-backend-xxx.run.app/api/auth/google/callback
   https://fast-planet-470408-f1.web.app/api/auth/google/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://fast-planet-470408-f1.web.app
   https://trading-platform-backend-xxx.run.app
   ```

---

## Architecture Overview

```
┌─────────────────────────┐
│  Firebase Hosting       │  ← User visits here
│  (Static Frontend)      │
│  fast-planet-...web.app │
└───────────┬─────────────┘
            │ API calls
            ▼
┌─────────────────────────┐
│  Google Cloud Run       │  ← Backend runs here
│  (Express Backend)      │
│  trading-platform-...   │
│  .run.app               │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Database / Firebase    │
│  External APIs (Fyers)  │
└─────────────────────────┘
```

---

## Testing Your Deployment

1. **Test backend directly:**
   ```bash
   curl https://trading-platform-backend-xxx.run.app/api/health
   ```

2. **Test authentication:**
   - Visit `https://fast-planet-470408-f1.web.app`
   - Click "Sign in with Google"
   - Should redirect to Cloud Run backend for auth

3. **Check logs:**
   ```bash
   gcloud run logs read --service trading-platform-backend --region us-central1
   ```

---

## Cost Estimates

**Google Cloud Run** (per month):
- Free tier: 2M requests, 360K GB-seconds
- After free tier: ~$0.40 per million requests
- Your usage: Likely FREE or <$5/month

**Firebase Hosting**:
- Free tier: 10GB storage, 360MB/day transfer
- Your usage: Likely FREE

---

## Troubleshooting

### "Origin not allowed by CORS"
Update CORS in `server/index.ts`:
```typescript
res.header('Access-Control-Allow-Origin', 'https://fast-planet-470408-f1.web.app');
```

### "Cannot connect to backend"
- Verify VITE_API_URL is set correctly
- Check Cloud Run service is running:
  ```bash
  gcloud run services list
  ```

### "Authentication fails silently"
- Check Cloud Run logs for errors
- Verify all env vars are set on Cloud Run
- Confirm Google OAuth redirect URIs include Cloud Run URL

---

## Quick Commands Reference

```bash
# Deploy backend
./deploy-cloud-run.sh

# Update environment variables
gcloud run services update trading-platform-backend \
  --region us-central1 \
  --set-env-vars "KEY=value"

# View logs
gcloud run logs read --service trading-platform-backend

# Get service URL
gcloud run services describe trading-platform-backend \
  --region us-central1 \
  --format 'value(status.url)'

# Deploy frontend
npm run build && firebase deploy --only hosting
```

---

## Next Steps

1. Run `./deploy-cloud-run.sh` to deploy backend
2. Get the Cloud Run URL from the output
3. Update frontend environment variables with the URL
4. Rebuild and redeploy frontend to Firebase
5. Update Google OAuth settings with new URLs
6. Test authentication on your Firebase site

---

**Need help?** Check Cloud Run logs or contact support.

---

# 🔥 Firebase Authentication Fix for Cloud Run

## ⚠️ Common Issue: "Invalid Key" Error

If you see Firebase authentication errors on Cloud Run but it works locally, it's because **VITE environment variables must be embedded at BUILD time, not runtime**.

### The Problem
When you set environment variables in Cloud Run console, they're only available when the container **runs**. But Vite needs them when you **build** the frontend (during `npm run build`).

```
❌ Cloud Run Runtime Env Vars → Too late, JS already built
✅ Docker Build Args → Embedded during npm run build
```

---

## ✅ Solution: Updated Dockerfile & Build Process

### What Changed:
The `Dockerfile` now accepts Firebase config as **build arguments**:

```dockerfile
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
# ... etc

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
# ... etc

RUN npm run build  # ← Now has access to Firebase config
```

---

## 🚀 Quick Fix Deployment Methods

### Method 1: Using deploy-to-cloudrun.sh Script

**Step 1:** Edit `deploy-to-cloudrun.sh`:
```bash
PROJECT_ID="fast-planet-470408-f1"  # Your project ID
SERVICE_NAME="perala"               # Your service name
REGION="us-central1"                # Your region
```

**Step 2:** Ensure `.env` has Firebase variables:
```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

**Step 3:** Deploy:
```bash
chmod +x deploy-to-cloudrun.sh
./deploy-to-cloudrun.sh
```

---

### Method 2: Manual gcloud Command with Build Args

```bash
# Load Firebase env vars from .env
export $(grep -v '^#' .env | grep VITE_FIREBASE | xargs)

# Deploy with build arguments
gcloud run deploy perala \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --project fast-planet-470408-f1
```

---

### Method 3: Using Cloud Build Trigger (GitHub/GitLab CI/CD)

The `cloudbuild.yaml` is already updated with build args.

**Step 1:** In Cloud Build console, edit your trigger

**Step 2:** Add these **Substitution Variables**:
```
_VITE_FIREBASE_API_KEY = (your Firebase API key)
_VITE_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com
_VITE_FIREBASE_PROJECT_ID = your-project-id
_VITE_FIREBASE_STORAGE_BUCKET = your-project.appspot.com
_VITE_FIREBASE_MESSAGING_SENDER_ID = (your sender ID)
_VITE_FIREBASE_APP_ID = (your app ID)
```

**Step 3:** Trigger build (push to repo or manual trigger)

---

### Method 4: Direct Cloud Build Submit

```bash
# Load Firebase env vars
export $(grep -v '^#' .env | grep VITE_FIREBASE | xargs)

# Submit build with substitutions
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=\
_VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY",\
_VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN",\
_VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID",\
_VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET",\
_VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID",\
_VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID"
```

---

## 🔍 Verify Firebase Config Was Embedded

After deployment, check build logs:

```bash
# Get latest build
gcloud builds list --limit=1

# View build log
gcloud builds log [BUILD_ID]
```

Look for these lines in the log:
```
ENV VITE_FIREBASE_API_KEY=AIza...
ENV VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```

If you see actual values (not "your-api-key"), it worked!

---

## 🧪 Test Authentication

1. Visit your Cloud Run URL
2. Open browser console (F12)
3. Try to sign in
4. Check console for Firebase errors

**Working correctly:**
```
✅ Authentication successful, redirecting to app...
```

**Still broken:**
```
❌ Firebase: Error (auth/invalid-api-key)
```
→ Build args weren't passed, redeploy with --build-arg flags

---

## 🔐 Security Notes

- Firebase API keys are **safe** to embed in frontend (they're public)
- They're protected by Firebase Security Rules
- Backend keys (FIREBASE_PRIVATE_KEY) should stay in runtime env vars
- Don't commit `.env` to Git

---

## 📊 Full Environment Variables Checklist

### Build-Time (Dockerfile ARG/ENV):
- ✅ VITE_FIREBASE_API_KEY
- ✅ VITE_FIREBASE_AUTH_DOMAIN
- ✅ VITE_FIREBASE_PROJECT_ID
- ✅ VITE_FIREBASE_STORAGE_BUCKET
- ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
- ✅ VITE_FIREBASE_APP_ID

### Runtime (Cloud Run Env Vars):
- ✅ NODE_ENV=production
- ✅ FIREBASE_PROJECT_ID
- ✅ FIREBASE_CLIENT_EMAIL
- ✅ FIREBASE_PRIVATE_KEY
- ✅ DATABASE_URL (if using database)
- ✅ Other backend API keys (Fyers, Gemini, etc.)

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid key" even after setting build args
**Solution:** 
- Make sure you're using `--build-arg` flag (not `--set-env-vars`)
- Verify .env file has correct values
- Check build logs to confirm values were embedded

### Issue: Build takes very long
**Solution:**
- Cloud Build uses `E2_HIGHCPU_8` machine (already configured)
- First build is slow, subsequent builds use Docker layer cache
- Consider using Cloud Build instead of `gcloud run deploy --source`

### Issue: Can't load environment variables
**Solution:**
```bash
# Instead of manually typing, load from .env:
export $(grep -v '^#' .env | grep VITE_FIREBASE | xargs)
```

### Issue: Variables show as "undefined" in browser
**Solution:**
- VITE_ prefix is required for frontend env vars
- They must be set during build, not runtime
- Redeploy with --build-arg flags

---

## 📝 Complete Deployment Checklist

- [ ] Update `Dockerfile` (already done ✅)
- [ ] Update `cloudbuild.yaml` (already done ✅)
- [ ] Ensure `.env` has all VITE_FIREBASE_* variables
- [ ] Choose deployment method (script/manual/CI)
- [ ] Pass build arguments during deployment
- [ ] Verify build logs show embedded values
- [ ] Test authentication on Cloud Run URL
- [ ] Set runtime env vars for backend (if needed)
- [ ] Update OAuth redirect URIs (if using Google auth)

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Check your .env file has Firebase config
grep VITE_FIREBASE .env

# 2. Edit deploy script with your project details
nano deploy-to-cloudrun.sh

# 3. Deploy
chmod +x deploy-to-cloudrun.sh
./deploy-to-cloudrun.sh

# 4. Test
# Visit your Cloud Run URL and try logging in

# Done! 🎉
```
