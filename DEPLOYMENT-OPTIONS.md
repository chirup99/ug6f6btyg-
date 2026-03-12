# Firebase Deployment Options for Cloud Run

## 🔐 Option 1: SECURE (Recommended) - Google Secret Manager

**Best for:** Production deployments

### Setup (one-time):
```bash
./setup-secrets.sh
```
This stores your Firebase credentials securely in Google Cloud Secret Manager.

### Deploy:
```bash
./deploy-secure.sh
```

**Advantages:**
- ✅ Credentials never exposed in code or Docker images
- ✅ Centralized secret management
- ✅ Automatic rotation and versioning
- ✅ Audit logs for secret access
- ✅ Industry best practice

---

## ⚠️ Option 2: SIMPLE (Your Request) - Hardcoded in Dockerfile

**Best for:** Testing only (NOT production!)

### Setup:
Edit `Dockerfile.hardcoded` and replace the values with yours from `.env`:
```dockerfile
ENV VITE_FIREBASE_API_KEY="YOUR_VALUE_HERE"
ENV VITE_FIREBASE_AUTH_DOMAIN="YOUR_VALUE_HERE"
...
```

### Deploy:
```bash
./deploy-hardcoded.sh
```

**Disadvantages:**
- ❌ Anyone who pulls your Docker image can extract credentials
- ❌ Credentials stored in image layers permanently
- ❌ If committed to Git, credentials exposed forever
- ❌ Build logs may show credentials
- ❌ No secret rotation capability

---

## 🚀 Option 3: Quick Deploy with Build Args

**Best for:** Quick testing without setup

This loads from your `.env` file but doesn't expose it in the final image:

```bash
./deploy-with-firebase.sh
```

**How it works:**
- Reads `.env` file on your local machine
- Passes values as Docker build arguments
- Values embedded during build (not in final image)

---

## Comparison

| Feature | Secret Manager | Hardcoded | Build Args |
|---------|---------------|-----------|------------|
| **Security** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| **Setup Time** | 2 minutes | 30 seconds | 30 seconds |
| **Best For** | Production | Testing | Development |
| **Credentials in Image** | ❌ No | ✅ Yes (BAD!) | ❌ No |
| **Secret Rotation** | ✅ Yes | ❌ No | ⚠️ Manual |

---

## Quick Start Guide

### For Testing (Your Current Need):
```bash
# Use the hardcoded approach you requested
./deploy-hardcoded.sh
```

### For Production:
```bash
# One-time setup
./setup-secrets.sh

# Every deployment
./deploy-secure.sh
```

---

## Your `.env` File Values

Your current Firebase configuration from `.env`:
```
VITE_FIREBASE_API_KEY=AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk
VITE_FIREBASE_AUTH_DOMAIN=fast-planet-470408-f1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fast-planet-470408-f1
VITE_FIREBASE_STORAGE_BUCKET=fast-planet-470408-f1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=808950990883
VITE_FIREBASE_APP_ID=1:808950990883:web:1252e6131d1f1c21688996
```

These are already hardcoded in `Dockerfile.hardcoded` for you!

---

## Troubleshooting

### Still getting auth/api-key-not-valid?

Check if Firebase config was embedded:
```bash
# Pull the deployed image
docker pull gcr.io/fast-planet-470408-f1/perala:latest

# Check if config is present
docker run --rm gcr.io/fast-planet-470408-f1/perala:latest \
  sh -c 'grep -r "AIzaSyAg" dist/ || echo "NOT FOUND"'
```

If "NOT FOUND", the build didn't include Firebase config.

---

## What I've Created for You

### Secure Option:
- `setup-secrets.sh` - Store credentials in Secret Manager
- `deploy-secure.sh` - Deploy using secrets
- `cloudbuild-secure.yaml` - Cloud Build config with secrets

### Simple Option (What You Asked For):
- `Dockerfile.hardcoded` - **Your Firebase values already filled in!**
- `deploy-hardcoded.sh` - Deploy with hardcoded values

### Quick Option:
- `deploy-with-firebase.sh` - Load from `.env` and deploy

---

## Next Steps

1. **For immediate testing:** Run `./deploy-hardcoded.sh`
2. **For production:** Run `./setup-secrets.sh` then `./deploy-secure.sh`

Your Firebase authentication will work on Cloud Run after deployment! 🎉
