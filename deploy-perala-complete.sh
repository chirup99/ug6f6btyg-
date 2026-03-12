#!/bin/bash

# Complete PERALA deployment to Cloud Run with all Firebase configs
# This fixes the "auth/api-key-not-valid" error by passing VITE_ vars at build time

set -e

echo "🚀 Deploying PERALA to Cloud Run with complete Firebase configuration..."

# Load environment variables from .env file
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "Please create a .env file with your Firebase configuration"
  exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

# Verify required variables
if [ -z "$VITE_FIREBASE_API_KEY" ]; then
  echo "❌ Error: VITE_FIREBASE_API_KEY not found in .env"
  exit 1
fi

echo "✅ Environment variables loaded"

# Build the Docker image with Firebase build arguments
echo "🔨 Building Docker image with Firebase configuration..."
docker build \
  --build-arg VITE_FIREBASE_API_KEY="${VITE_FIREBASE_API_KEY}" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="${VITE_FIREBASE_AUTH_DOMAIN}" \
  --build-arg VITE_FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID}" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="${VITE_FIREBASE_STORAGE_BUCKET}" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="${VITE_FIREBASE_MESSAGING_SENDER_ID}" \
  --build-arg VITE_FIREBASE_APP_ID="${VITE_FIREBASE_APP_ID}" \
  -t gcr.io/fast-planet-470408-f1/perala:latest .

# Push to Google Container Registry
echo "📦 Pushing to Container Registry..."
docker push gcr.io/fast-planet-470408-f1/perala:latest

# Deploy to Cloud Run with backend Firebase credentials
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL},NODE_ENV=production" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"

echo "✅ PERALA deployment complete!"
echo ""
echo "🔗 Your server URL:"
gcloud run services describe perala --region us-central1 --format="value(status.url)"
echo ""
echo "📝 Next steps:"
echo "1. Test login at the URL above"
echo "2. Check logs: gcloud run services logs read perala --limit 50"
