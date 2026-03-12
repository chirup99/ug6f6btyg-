# Cloud Run Post Creation Diagnostic Guide

## 🎯 Your Setup

Based on your description, you have:
- **Frontend**: Deployed on Firebase Hosting (`https://fast-planet-470408-f1.web.app`)
- **Backend**: Deployed on Cloud Run (`https://perala-xxxxx-uc.a.run.app`)
- **VITE_API_URL**: Set in `.env` file to point to Cloud Run backend

## 🔍 Step 1: Check Cloud Run Logs for Post Creation Attempts

Run this command to see what's happening when you try to create a post:

```bash
# Stream real-time logs (keep this running while you try to create a post)
gcloud run services logs tail perala --region us-central1

# Or view recent logs
gcloud run services logs read perala --region us-central1 --limit 100 | grep -i "post\|error"
```

**What to look for:**
- `🚀 [xxxxx] POST /api/social-posts` - Shows post creation attempt
- `❌` symbols - Show errors
- `401` or `403` status codes - Authentication issues
- `CORS` errors - Cross-origin issues

## 🔍 Step 2: Check Frontend is Pointing to Correct Backend

Your frontend needs to know where the backend is. Check these:

### A. Check VITE_API_URL in your build

The frontend was built with this URL embedded. To verify:

```bash
# Check what build args were used
gcloud builds list --limit 5

# View specific build details
gcloud builds describe [BUILD_ID]
```

Look for `VITE_API_URL` in the build arguments.

### B. What should VITE_API_URL be?

**If you deployed with `deploy-cloudrun-no-docker.sh`:**

Your `.env` file should have:
```bash
# Get your Cloud Run backend URL first
CLOUD_RUN_URL=$(gcloud run services describe perala --region us-central1 --format='value(status.url)')
echo "Your Cloud Run URL: $CLOUD_RUN_URL"

# Then set it in .env
VITE_API_URL="https://perala-808950990883-uc.a.run.app"  # Replace with your actual URL
```

## 🔍 Step 3: Check Cloud Run IAM Permissions

```bash
# Check if service allows unauthenticated access
gcloud run services get-iam-policy perala --region us-central1

# Should show:
# - members:
#   - allUsers
#   role: roles/run.invoker
```

If you don't see `allUsers`, fix it:

```bash
gcloud run services add-iam-policy-binding perala \
  --region us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

## 🔍 Step 4: Check Firestore Permissions

```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe fast-planet-470408-f1 --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# Check IAM permissions
gcloud projects get-iam-policy fast-planet-470408-f1 \
  --flatten="bindings[].members" \
  --filter="bindings.members:${PROJECT_NUMBER}-compute" \
  --format="table(bindings.role)"
```

**Must see:** `roles/datastore.user`

If missing, add it:

```bash
gcloud projects add-iam-policy-binding fast-planet-470408-f1 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

## 🔍 Step 5: Check Firebase Hosting Rewrites

If your frontend is on Firebase Hosting, check `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "perala",
          "region": "us-central1"
        }
      }
    ]
  }
}
```

This allows Firebase Hosting to proxy API calls to Cloud Run (eliminates CORS issues).

## 🛠️ Step 6: Test from Browser Console

Open your production site in browser:
1. Open DevTools (F12)
2. Go to Console tab
3. Try to create a post
4. Look for errors

**Common errors:**

### Error: "Failed to fetch" or "Network error"
```javascript
// In browser console
console.log('API URL:', import.meta.env.VITE_API_URL);
```

If it shows `undefined` or empty, the frontend was built without `VITE_API_URL`.

**Fix:** Rebuild with correct VITE_API_URL:

```bash
# Update .env with your Cloud Run URL
echo 'VITE_API_URL="https://perala-808950990883-uc.a.run.app"' >> .env

# Redeploy
./deploy-cloudrun-no-docker.sh
```

### Error: "CORS policy blocked"

If you see:
```
Access to fetch at 'https://perala-xxxxx.run.app/api/social-posts' 
from origin 'https://fast-planet-470408-f1.web.app' 
has been blocked by CORS policy
```

**Fix:** Cloud Run needs `--allow-unauthenticated`:

```bash
gcloud run services update perala \
  --region us-central1 \
  --allow-unauthenticated
```

### Error: "Authentication required to create posts"

The Firebase ID token isn't being sent or verified.

Check Cloud Run logs:
```bash
gcloud run services logs read perala --region us-central1 --limit 50 | grep "POST /api/social-posts"
```

Look for:
- `❌ No valid authorization header`
- `❌ Token verification failed`

**Fix:** User needs to be signed in. Check in browser console:
```javascript
// Check if user is signed in
firebase.auth().currentUser
```

### Error: "Profile not set up"

User profile doesn't exist in Firestore.

Check Cloud Run logs for:
```
⚠️ User profile not found in Firestore
```

**Fix:** User needs to complete their profile first. Go to profile settings and save.

## ✅ Complete Fix Checklist

Run these commands in order:

### 1. Grant Firestore Access
```bash
PROJECT_NUMBER=$(gcloud projects describe fast-planet-470408-f1 --format="value(projectNumber)")
gcloud projects add-iam-policy-binding fast-planet-470408-f1 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

### 2. Allow Unauthenticated Access (for CORS)
```bash
gcloud run services add-iam-policy-binding perala \
  --region us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### 3. Get Cloud Run URL
```bash
CLOUD_RUN_URL=$(gcloud run services describe perala --region us-central1 --format='value(status.url)')
echo "Your Cloud Run backend URL: $CLOUD_RUN_URL"
```

### 4. Update .env with Backend URL
```bash
# Edit .env file and set:
# VITE_API_URL="https://perala-808950990883-uc.a.run.app"  # Use your actual URL from step 3
nano .env
```

### 5. Rebuild and Redeploy
```bash
./deploy-cloudrun-no-docker.sh
```

### 6. Wait for build to complete (5-10 minutes)
```bash
# Watch build progress
gcloud builds list --limit 1 --ongoing

# When done, get new frontend URL
firebase hosting:channel:list
```

## 🧪 Test Post Creation

1. **Visit your Firebase Hosting URL**: `https://fast-planet-470408-f1.web.app`
2. **Sign in with Google**
3. **Open Browser DevTools** (F12) → Network tab
4. **Go to Neo Feed tab**
5. **Try creating a post**

**In Network tab, look for:**
- `POST /api/social-posts` request
- Status should be `200 OK`
- Response should show post data

**In Cloud Run logs:**
```bash
gcloud run services logs read perala --region us-central1 --limit 20
```

Should see:
```
🚀 [xxxxx] POST /api/social-posts - New post creation request
✅ [xxxxx] Token verified for user: QyJVxgQpCic4h8oQGU6TCsF8Mwg2
✅ [xxxxx] User profile found: chiranjeeviperala99 (Perala chiranjeevi)
✅ [xxxxx] User post saved to Firebase with ID: [post_id]
🎉 [xxxxx] Post creation successful!
```

## 🐛 Still Not Working?

Send me the output of:

```bash
# 1. Check build configuration
gcloud builds list --limit 1

# 2. Check service configuration
gcloud run services describe perala --region us-central1 --format=yaml

# 3. Check IAM permissions
gcloud projects get-iam-policy fast-planet-470408-f1 | grep -A5 "compute@developer"

# 4. Check recent logs
gcloud run services logs read perala --region us-central1 --limit 50
```

## 📋 Quick Reference

| Issue | Check | Fix |
|-------|-------|-----|
| CORS errors | Allow unauthenticated | `gcloud run services add-iam-policy-binding` |
| Post creation fails | Firestore permissions | Grant `roles/datastore.user` |
| Wrong API URL | Build args | Rebuild with correct `VITE_API_URL` |
| Profile not loading | Firestore access | Same as post creation |
| Network errors | VITE_API_URL | Set in `.env` and rebuild |

## 🎯 Most Likely Issue

Based on your setup (Firebase Hosting + Cloud Run backend), the **most common issue** is:

**Frontend doesn't know where backend is** → `VITE_API_URL` is empty or wrong

**Fix:**
```bash
# Get backend URL
gcloud run services describe perala --region us-central1 --format='value(status.url)'

# Update .env
echo 'VITE_API_URL="https://perala-808950990883-uc.a.run.app"' >> .env

# Rebuild
./deploy-cloudrun-no-docker.sh
```

This embeds the backend URL into your frontend build, so it knows where to send API requests.
