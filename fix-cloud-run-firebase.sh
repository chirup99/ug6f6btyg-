#!/bin/bash

# Quick fix for Firebase authentication on Cloud Run
# This redeploys your app with Firebase config properly embedded

set -e

echo "🔧 Fixing Firebase authentication on Cloud Run..."
echo ""

# Set your Firebase config
export VITE_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk"
export VITE_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com"
export VITE_FIREBASE_PROJECT_ID="fast-planet-470408-f1"
export VITE_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app"
export VITE_FIREBASE_MESSAGING_SENDER_ID="808950990883"
export VITE_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996"

echo "✅ Firebase config loaded"
echo ""
echo "🚀 Deploying to Cloud Run with Firebase config..."
echo ""

gcloud run deploy perala \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --project fast-planet-470408-f1

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎉 Firebase authentication should now work on Cloud Run!"
echo ""
echo "📝 To verify:"
echo "   1. Visit your Cloud Run URL"
echo "   2. Try to log in with Firebase"
echo "   3. Should work! ✅"
