# 🚀 Deploy to Cloud Run with Working Firebase Login

## ✅ Your Files Are Already Configured Correctly!

Your `cloudbuild.yaml` and `Dockerfile` already have Firebase credentials configured. You just need to redeploy.

---

## 🔥 Deploy Now (3 Simple Steps)

### Step 1: Clear Any Old Builds
```bash
# Remove old Docker images to force fresh build
docker system prune -af
```

### Step 2: Deploy with Cloud Build
```bash
# This uses your cloudbuild.yaml with Firebase credentials
gcloud builds submit --config cloudbuild.yaml
```

### Step 3: Wait for Deployment
The build will:
1. ✅ Build Docker image with Firebase config embedded (2-3 minutes)
2. ✅ Push to Container Registry (30 seconds)
3. ✅ Deploy to Cloud Run (1-2 minutes)

**Total time:** ~5 minutes

---

## 🔍 Verify It's Working

After deployment completes, test Firebase login:

```bash
# Get your Cloud Run URL
gcloud run services describe perala --region us-central1 --format 'value(status.url)'

# Open in browser and try to sign in with Google
```

---

## 📋 What's Happening Behind the Scenes

Your `cloudbuild.yaml` (lines 88-93) already has these values:
```yaml
substitutions:
  _VITE_FIREBASE_API_KEY: 'AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk'
  _VITE_FIREBASE_AUTH_DOMAIN: 'fast-planet-470408-f1.firebaseapp.com'
  _VITE_FIREBASE_PROJECT_ID: 'fast-planet-470408-f1'
  _VITE_FIREBASE_STORAGE_BUCKET: 'fast-planet-470408-f1.firebasestorage.app'
  _VITE_FIREBASE_MESSAGING_SENDER_ID: '808950990883'
  _VITE_FIREBASE_APP_ID: '1:808950990883:web:1252e6131d1f1c21688996'
```

These are passed as `--build-arg` to Docker (lines 8-18), which embeds them in your frontend bundle during `npm run build`.

---

## ⚠️ If You Still Get Errors

### Error: "api-key-not-valid"
**Cause:** Old cached build is still deployed

**Fix:**
```bash
# Force rebuild without cache
gcloud builds submit --config cloudbuild.yaml --no-cache
```

### Error: "Permission denied"
**Cause:** Not authenticated with gcloud

**Fix:**
```bash
gcloud auth login
gcloud config set project fast-planet-470408-f1
```

### Error: "Build timeout"
**Cause:** Build is taking too long (already set to 1800s in config)

**Fix:** Check Cloud Build logs
```bash
gcloud builds list --limit 5
```

---

## 🎯 Quick Command (Copy-Paste)

```bash
# One command to redeploy everything
gcloud builds submit --config cloudbuild.yaml && echo "✅ Deployment complete! Test your Firebase login now."
```

---

## 📊 Monitor Deployment

```bash
# Watch build progress in real-time
gcloud builds list --ongoing

# Check Cloud Run logs
gcloud run services logs read perala --region us-central1
```

---

## ✅ Expected Result

After successful deployment:
- ✅ Firebase Google Sign-In works on Cloud Run
- ✅ No more "api-key-not-valid" error
- ✅ Login works exactly like it does in VSCode/localhost

**Your Cloud Run URL:** `https://perala-<random-id>-uc.a.run.app`

🎉 Firebase authentication will work perfectly!
