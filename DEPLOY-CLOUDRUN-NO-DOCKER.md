# Cloud Run Deployment Without Local Docker

This guide explains how to deploy to Google Cloud Run using **Cloud Build** (no local Docker required).

## 📋 Overview

The `deploy-cloudrun-no-docker.sh` script automates deployment by:
1. **Building** the Docker image on Cloud Build (Google's servers)
2. **Passing** VITE_* variables as build arguments during image creation
3. **Deploying** to Cloud Run with runtime environment variables and secrets

## ✅ Prerequisites

### 1. Google Cloud SDK Installed
```bash
# Check if gcloud is installed
gcloud --version

# If not installed, install it:
# https://cloud.google.com/sdk/docs/install
```

### 2. Authenticated with Google Cloud
```bash
# Login
gcloud auth login

# Set project
gcloud config set project fast-planet-470408-f1

# Verify
gcloud config list
```

### 3. Required APIs Enabled
```bash
# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com
```

### 4. Secrets Created in Secret Manager
```bash
# Create secrets (run once)
echo -n "YOUR_FIREBASE_PRIVATE_KEY" | gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=-
echo -n "YOUR_FYERS_ACCESS_TOKEN" | gcloud secrets create FYERS_ACCESS_TOKEN --data-file=-
echo -n "YOUR_FYERS_SECRET_KEY" | gcloud secrets create FYERS_SECRET_KEY --data-file=-
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe fast-planet-470408-f1 --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding FIREBASE_PRIVATE_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding FYERS_ACCESS_TOKEN \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding FYERS_SECRET_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5. Firestore IAM Permissions (CRITICAL for Neo Feed)
```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe fast-planet-470408-f1 --format="value(projectNumber)")

# Grant Firestore access
gcloud projects add-iam-policy-binding fast-planet-470408-f1 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"

# Verify
gcloud projects get-iam-policy fast-planet-470408-f1 \
  --flatten="bindings[].members" \
  --filter="bindings.members:compute" \
  --format="table(bindings.role)"
```

**Expected output should include:** `roles/datastore.user`

### 6. Environment Variables File (.env)

Create a `.env` file with all required variables:

```bash
# Firebase Web App (Build-time variables)
VITE_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk"
VITE_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="fast-planet-470408-f1"
VITE_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="808950990883"
VITE_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996"

# API URL (optional - only for separate frontend/backend services)
VITE_API_URL=""

# Firebase Admin SDK (Runtime variables)
FIREBASE_PROJECT_ID="fast-planet-470408-f1"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com"

# Note: FIREBASE_PRIVATE_KEY is stored in Secret Manager, not in .env

# Google Cloud (Runtime variables)
GOOGLE_CLOUD_PROJECT_ID="fast-planet-470408-f1"
GOOGLE_CLOUD_CLIENT_EMAIL="firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com"

# Note: GOOGLE_CLOUD_PRIVATE_KEY is stored in Secret Manager, not in .env

# Fyers API (Runtime variables)
FYERS_APP_ID="BUXMASTNCH-100"

# Note: FYERS_SECRET_KEY and FYERS_ACCESS_TOKEN are stored in Secret Manager
```

## 🚀 Deployment Steps

### Quick Deploy (Recommended)
```bash
# Make script executable
chmod +x deploy-cloudrun-no-docker.sh

# Run deployment
./deploy-cloudrun-no-docker.sh
```

### What the Script Does

**Step 1: Build Docker Image with Cloud Build**
- Reads VITE_* variables from `.env`
- Submits build to Google Cloud Build
- Passes VITE_* variables as build arguments
- Builds image: `gcr.io/fast-planet-470408-f1/perala:latest`

**Step 2: Prepare Runtime Environment Variables**
- Collects backend variables from `.env`
- Formats them for Cloud Run deployment
- Excludes sensitive data (stored in Secret Manager)

**Step 3: Deploy to Cloud Run**
- Deploys the built image
- Sets runtime environment variables
- Mounts secrets from Secret Manager
- Configures with `--allow-unauthenticated` (required for CORS to work)

## 🔍 Verify Deployment

### 1. Check Build Status
```bash
# View recent builds
gcloud builds list --limit 5

# View specific build logs
gcloud builds log [BUILD_ID]
```

Look for: `ARG VITE_FIREBASE_API_KEY` in logs to confirm build args were passed.

### 2. Check Service Status
```bash
# Get service URL
gcloud run services describe perala \
  --region us-central1 \
  --format='value(status.url)'

# View service configuration
gcloud run services describe perala --region us-central1
```

### 3. Check Logs
```bash
# View latest logs
gcloud run services logs read perala \
  --region us-central1 \
  --limit 50

# Stream logs in real-time
gcloud run services logs tail perala --region us-central1
```

**Look for:**
- `✅ Firebase Admin SDK initialized successfully`
- `✅ CORS allowed for Cloud Run domain`
- No "auth/api-key-not-valid" errors

### 4. Test Neo Feed Features

1. **Visit your Cloud Run URL**
2. **Sign in with Google**
3. **Go to Neo Feed tab**
4. **Try creating a post**

**Expected logs:**
```
🚀 [xxxxx] POST /api/social-posts - New post creation request
✅ [xxxxx] Token verified for user: [user_id]
✅ [xxxxx] User profile found: [username] ([displayName])
✅ [xxxxx] User post saved to Firebase with ID: [post_id]
🎉 [xxxxx] Post creation successful!
```

5. **Check your profile loads** with posts displayed

## 🐛 Troubleshooting

### Build Fails
```bash
# Error: "Permission denied"
# Solution: Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Error: "Could not read .env file"
# Solution: Ensure .env file exists in project root
ls -la .env
```

### Deployment Fails
```bash
# Error: "Service account does not have permission to access secrets"
# Solution: Grant secret access (see Prerequisites #4)

# Error: "Image not found"
# Solution: Check if build completed successfully
gcloud builds list --limit 5
```

### Post Creation Fails on Cloud Run
```bash
# Error: "Failed to create post"
# Check Cloud Run logs:
gcloud run services logs read perala --region us-central1 --limit 50

# Common causes:
# 1. Missing Firestore permissions → See Prerequisites #5
# 2. IAM authentication enabled → Deploy with --allow-unauthenticated
# 3. Profile not set up → User needs to complete profile first
```

### Profile Not Loading
```bash
# Symptom: Neo Feed profile tab is blank
# Cause: Missing Firestore IAM permissions
# Solution: Grant roles/datastore.user (see Prerequisites #5)
```

### CORS Errors
```bash
# Symptom: "No 'Access-Control-Allow-Origin' header"
# Cause: Service deployed with IAM authentication
# Solution: Redeploy with --allow-unauthenticated flag

gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

## 📊 Script Configuration

The script uses these settings:

```bash
PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="us-central1"
MEMORY="2Gi"
CPU="2"
TIMEOUT="300"  # 5 minutes
MAX_INSTANCES="10"
PORT="5000"
```

To modify, edit `deploy-cloudrun-no-docker.sh` lines 13-17.

## 🔐 Security Best Practices

### ✅ Do's
- ✅ Store sensitive keys in Secret Manager
- ✅ Use `--allow-unauthenticated` with Firebase token verification in code
- ✅ Grant minimal IAM permissions (only `roles/datastore.user`)
- ✅ Keep `.env` out of version control (in `.gitignore`)
- ✅ Rotate secrets periodically

### ❌ Don'ts
- ❌ Don't commit secrets to Git
- ❌ Don't hardcode API keys in code
- ❌ Don't set PORT env var (Cloud Run sets it automatically)
- ❌ Don't enable IAM authentication (blocks CORS preflight)

## 📚 Related Documentation

- **Neo Feed Fix**: `CLOUD-RUN-NEOFEED-FIX.md` - Post creation & profile loading issues
- **Environment Variables**: `CLOUDRUN-ENVIRONMENT-VARIABLES.md` - Complete variable guide
- **Firebase Setup**: `FIREBASE-CLOUDRUN-FIX.md` - Firebase Admin SDK configuration
- **Deployment Guide**: `CLOUD-RUN-DEPLOYMENT-GUIDE.md` - General deployment guide

## 🎯 Quick Reference

### Common Commands
```bash
# Deploy
./deploy-cloudrun-no-docker.sh

# View logs
gcloud run services logs read perala --region us-central1 --limit 50

# Get service URL
gcloud run services describe perala --region us-central1 --format='value(status.url)'

# Update single environment variable
gcloud run services update perala \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production"

# View service configuration
gcloud run services describe perala --region us-central1

# Delete service
gcloud run services delete perala --region us-central1
```

### Service URL
After deployment, your service will be available at:
```
https://perala-[hash]-uc.a.run.app
```

The exact URL is displayed at the end of deployment.

## ✅ Checklist Before Deploying

- [ ] gcloud CLI installed and authenticated
- [ ] Required APIs enabled (Cloud Build, Cloud Run, Secret Manager)
- [ ] Secrets created in Secret Manager
- [ ] Cloud Run service account has secret access
- [ ] Cloud Run service account has Firestore access (`roles/datastore.user`)
- [ ] `.env` file exists with all required variables
- [ ] Script has executable permissions (`chmod +x`)

## 🚀 Ready to Deploy!

Once all prerequisites are met, simply run:
```bash
./deploy-cloudrun-no-docker.sh
```

The script will:
1. ✅ Build your image on Google Cloud
2. ✅ Deploy to Cloud Run with proper configuration
3. ✅ Display your live service URL

Your Neo Feed posts and profile will work correctly! 🎉
