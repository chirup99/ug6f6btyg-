# 🚀 Cloud Run Deployment Guide - Firebase Authentication Fix

## 🔒 CRITICAL SECURITY NOTICE

**If you deployed before this fix**, your Docker images may contain embedded secrets (Firebase private key, Fyers tokens). You should:

1. **Rotate all credentials immediately**:
   - Generate new Firebase service account key
   - Regenerate Fyers API tokens
   - Update your `.env` file with new credentials
   
2. **Delete old Docker images**:
   ```bash
   gcloud container images list-tags gcr.io/fast-planet-470408-f1/perala --format=json
   gcloud container images delete gcr.io/fast-planet-470408-f1/perala:TAG --quiet
   ```

3. **Redeploy with the secure Dockerfile** (this version)

---

## ⚠️ THE PROBLEM

Your app works on VSCode/Replit but shows **"Firebase: Error (auth/api-key-not-valid)"** on Cloud Run.

**Why?** Vite embeds Firebase config variables (VITE_FIREBASE_*) at **BUILD time**, not runtime. When Cloud Build builds your Docker image, the `.env` file isn't available, so the Firebase config is empty in the production build.

---

## ✅ THE SOLUTION (3 Options)

### **Option 1: Use deploy-cloudrun-fixed.sh** (Recommended - Easiest)

This script reads credentials from your local `.env` file and passes them to Docker during build.

#### Setup (One-time)

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Authenticate Docker
gcloud auth configure-docker
```

#### Deploy

```bash
# Make executable (first time only)
chmod +x deploy-cloudrun-fixed.sh

# Deploy!
./deploy-cloudrun-fixed.sh
```

**That's it!** The script will:
1. Read all Firebase credentials from `.env`
2. Build Docker image with credentials embedded
3. Push to Google Container Registry
4. Deploy to Cloud Run

---

### **Option 2: Manual Docker Build & Deploy**

If you prefer manual control:

```bash
# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Convert private key to single-line
FIREBASE_PRIVATE_KEY_SINGLE=$(echo "$FIREBASE_PRIVATE_KEY" | awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}')

# Build with all Firebase config
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --build-arg FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
  --build-arg FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL" \
  --build-arg FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY_SINGLE" \
  --build-arg GEMINI_API_KEY="$GEMINI_API_KEY" \
  --build-arg FYERS_APP_ID="$FYERS_APP_ID" \
  --build-arg FYERS_SECRET_KEY="$FYERS_SECRET_KEY" \
  --build-arg FYERS_ACCESS_TOKEN="$FYERS_ACCESS_TOKEN" \
  -t gcr.io/fast-planet-470408-f1/perala:latest \
  .

# Push to registry
docker push gcr.io/fast-planet-470408-f1/perala:latest

# Deploy to Cloud Run
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "DATABASE_URL=sqlite.db,NODE_ENV=production,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL,FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY_SINGLE,GEMINI_API_KEY=$GEMINI_API_KEY,FYERS_APP_ID=$FYERS_APP_ID,FYERS_SECRET_KEY=$FYERS_SECRET_KEY,FYERS_ACCESS_TOKEN=$FYERS_ACCESS_TOKEN"
```

---

### **Option 3: Cloud Build with Trigger Variables** (For CI/CD)

If you want automatic deployment from GitHub/GitLab:

#### Step 1: Create Cloud Build Trigger

1. Go to: https://console.cloud.google.com/cloud-build/triggers
2. Click "Create Trigger"
3. Connect your repository
4. Select `cloudbuild.yaml` as build configuration

#### Step 2: Add Substitution Variables

In trigger settings → Substitution variables, add:

| Variable | Value (from .env) |
|----------|------------------|
| `_VITE_FIREBASE_API_KEY` | AIzaSy... |
| `_VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `_VITE_FIREBASE_PROJECT_ID` | your-project-id |
| `_VITE_FIREBASE_STORAGE_BUCKET` | your-bucket.firebasestorage.app |
| `_VITE_FIREBASE_MESSAGING_SENDER_ID` | 123456789 |
| `_VITE_FIREBASE_APP_ID` | 1:123:web:abc123 |
| `_FIREBASE_PROJECT_ID` | your-project-id |
| `_FIREBASE_CLIENT_EMAIL` | firebase-adminsdk@... |
| `_FIREBASE_PRIVATE_KEY` | -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY----- |
| `_GEMINI_API_KEY` | AIzaSy... |
| `_FYERS_APP_ID` | YOUR_APP_ID |
| `_FYERS_SECRET_KEY` | YOUR_SECRET |
| `_FYERS_ACCESS_TOKEN` | eyJhbG... |

**Important:** For `_FIREBASE_PRIVATE_KEY`, convert to single-line:

```bash
echo "$FIREBASE_PRIVATE_KEY" | awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}'
```

---

## 🔒 Security Best Practices

### ❌ NEVER DO THIS:
- Don't commit credentials to `cloudbuild.yaml`
- Don't commit `.env` to Git (it's in `.gitignore`)
- Don't share your private keys publicly

### ✅ DO THIS:
- Use `deploy-cloudrun-fixed.sh` for local deployments
- Use Cloud Build trigger variables for CI/CD
- Use Google Secret Manager for production (see below)

---

## 🔐 Production: Google Secret Manager (Most Secure)

For production deployments, use Secret Manager:

```bash
# Create secrets
echo -n "AIzaSy..." | gcloud secrets create VITE_FIREBASE_API_KEY --data-file=-
echo -n "your-project.firebaseapp.com" | gcloud secrets create VITE_FIREBASE_AUTH_DOMAIN --data-file=-
# ... create all other secrets

# Grant Cloud Build access
PROJECT_NUMBER=$(gcloud projects describe fast-planet-470408-f1 --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding VITE_FIREBASE_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Then update `cloudbuild.yaml` to use secrets (see [Secret Manager docs](https://cloud.google.com/build/docs/securing-builds/use-secrets)).

---

## ✅ Verify It Works

After deployment:

```bash
# Get your Cloud Run URL
gcloud run services describe perala --region us-central1 --format 'value(status.url)'

# Check that Firebase config is embedded
curl -s "https://your-app-url.run.app/assets/index-*.js" | grep -o "AIzaSy[a-zA-Z0-9_-]*" | head -1
```

If you see your Firebase API key, it's working! ✅

---

## 🆘 Troubleshooting

### Error: "Firebase: Error (auth/api-key-not-valid)"

**Cause:** Firebase config not embedded during build

**Fix:** Use `deploy-cloudrun-fixed.sh` or add substitution variables

### Error: "cross-env: not found"

```bash
npm install cross-env
```

### Error: "Permission denied: deploy-cloudrun-fixed.sh"

```bash
chmod +x deploy-cloudrun-fixed.sh
```

### Firebase login works on Replit but not Cloud Run

**Cause:** Firebase config variables not passed at build time

**Fix:** Use one of the 3 deployment options above

---

## 📊 Deployment Comparison

| Method | Security | Ease | CI/CD | Best For |
|--------|----------|------|-------|----------|
| deploy-cloudrun-fixed.sh | ✅ High | ✅ Easy | ❌ No | Local testing |
| Cloud Build Triggers | ⚠️ Medium | ⚠️ Medium | ✅ Yes | Automated deploys |
| Secret Manager | ✅ Highest | ❌ Complex | ✅ Yes | Production |

---

## 🎯 Quick Start (TL;DR)

```bash
chmod +x deploy-cloudrun-fixed.sh
./deploy-cloudrun-fixed.sh
```

That's it! Your Firebase authentication will work on Cloud Run. ✅
