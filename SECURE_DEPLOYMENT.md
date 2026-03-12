# Secure Cloud Run Deployment Guide

## 🔐 Security Best Practices

This guide shows you how to deploy your Trading Platform to Google Cloud Run using **Secret Manager** for secure credential storage instead of hardcoding secrets in configuration files.

---

## Quick Fix: Current Firebase Auth Error

The error `auth-api/key` occurs because Firebase Admin SDK credentials aren't being passed to Cloud Run. Here are **two solutions**:

### Option 1: Quick Deploy (Testing/Development)

The credentials are already added to `cloudbuild.yaml`. Just deploy:

```bash
gcloud builds submit --config cloudbuild.yaml
```

**⚠️ Warning**: This method embeds secrets in build configuration. Use only for testing.

---

### Option 2: Secure Deploy (Production - RECOMMENDED)

Use Google Secret Manager to store credentials securely.

#### Step 1: Store Secrets in Secret Manager

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create secrets for Firebase Admin SDK
echo -n "fast-planet-470408-f1" | \
  gcloud secrets create firebase-project-id --data-file=-

echo -n "firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com" | \
  gcloud secrets create firebase-client-email --data-file=-

# 3. Convert multi-line private key to single-line format
./convert-firebase-key.sh

# 4. Store the single-line private key (copy output from script above)
echo -n "YOUR_SINGLE_LINE_KEY_HERE" | \
  gcloud secrets create firebase-private-key --data-file=-

# 5. Store other API keys
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create gemini-api-key --data-file=-

echo -n "YOUR_FYERS_APP_ID" | \
  gcloud secrets create fyers-app-id --data-file=-

echo -n "YOUR_FYERS_SECRET_KEY" | \
  gcloud secrets create fyers-secret-key --data-file=-

echo -n "YOUR_FYERS_ACCESS_TOKEN" | \
  gcloud secrets create fyers-access-token --data-file=-
```

#### Step 2: Grant Cloud Run Access to Secrets

```bash
# Get your Cloud Run service account email
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to all secrets
for secret in firebase-project-id firebase-client-email firebase-private-key \
              gemini-api-key fyers-app-id fyers-secret-key fyers-access-token; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

#### Step 3: Deploy with Secret References

```bash
gcloud run deploy perala \
  --image gcr.io/$PROJECT_ID/perala:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "DATABASE_URL=sqlite.db,NODE_ENV=production" \
  --set-secrets "FIREBASE_PROJECT_ID=firebase-project-id:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest,GEMINI_API_KEY=gemini-api-key:latest,FYERS_APP_ID=fyers-app-id:latest,FYERS_SECRET_KEY=fyers-secret-key:latest,FYERS_ACCESS_TOKEN=fyers-access-token:latest"
```

#### Step 4: Build and Deploy

```bash
# Build the image
gcloud builds submit --tag gcr.io/$PROJECT_ID/perala

# The deployment command from Step 3 will use the image and secrets
```

---

## Understanding the Fix

### The Problem

Firebase Admin SDK requires 3 environment variables at runtime:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

These were missing from your Cloud Run deployment, causing the `auth-api/key` error.

### The Solution

1. **Build-time variables** (for frontend):
   - `VITE_FIREBASE_*` variables are embedded in the client bundle during `npm run build`
   - Already configured in `cloudbuild.yaml` build args

2. **Runtime variables** (for backend):
   - `FIREBASE_*` variables need to be available when the server starts
   - Now configured via Cloud Run environment variables or Secret Manager

---

## File Structure Changes

### ✅ Fixed: cloudbuild.yaml

Added missing substitution variables:
```yaml
substitutions:
  # Backend Firebase Admin SDK credentials
  _FIREBASE_PROJECT_ID: 'fast-planet-470408-f1'
  _FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk-fbsvc@...'
  _FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
```

### ✅ Fixed: Dockerfile

Already configured to:
- Copy `.env` file for local credentials
- Accept environment variables from Cloud Run
- Read credentials via `dotenv` package

---

## Verification Steps

After deployment, verify Firebase authentication works:

```bash
# Get your Cloud Run service URL
SERVICE_URL=$(gcloud run services describe perala --region us-central1 --format='value(status.url)')

# Test Firebase authentication endpoint
curl $SERVICE_URL/api/auth/status
```

Expected response:
```json
{
  "authenticated": false,
  "firebaseInitialized": true
}
```

---

## Troubleshooting

### Error: "Service account does not have permission"

Grant Secret Manager access:
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

### Error: "Invalid private key"

The private key must be single-line format. Use the converter script:
```bash
./convert-firebase-key.sh
```

### Error: "Cannot find module 'dotenv'"

Ensure dependencies are installed in Dockerfile:
```dockerfile
RUN npm install
```

---

## Security Checklist

- [ ] Secrets stored in Google Secret Manager (not in code)
- [ ] Service account has minimal required permissions
- [ ] `.env` file added to `.gitignore`
- [ ] Secrets rotated regularly
- [ ] Cloud Run logs monitored for unauthorized access

---

## Additional Resources

- [Google Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)

---

## Quick Reference Commands

```bash
# List all secrets
gcloud secrets list

# View a secret value
gcloud secrets versions access latest --secret="firebase-project-id"

# Update a secret
echo -n "NEW_VALUE" | gcloud secrets versions add firebase-project-id --data-file=-

# Delete a secret
gcloud secrets delete firebase-project-id
```
