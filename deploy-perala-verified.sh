#!/bin/bash

# VERIFIED deployment script for PERALA - Fixes "auth/api-key-not-valid" error
# This ensures VITE_ variables are embedded into the frontend build

set -e

echo "🚀 Starting PERALA deployment to Cloud Run..."
echo ""

# Load environment variables from .env file
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "Please create a .env file with your Firebase configuration"
  exit 1
fi

# Export all variables from .env
set -a
source .env
set +a

echo "📋 Verifying Firebase configuration..."

# Verify required VITE variables
if [ -z "$VITE_FIREBASE_API_KEY" ]; then
  echo "❌ Error: VITE_FIREBASE_API_KEY not found in .env"
  exit 1
fi

if [ -z "$VITE_FIREBASE_AUTH_DOMAIN" ]; then
  echo "❌ Error: VITE_FIREBASE_AUTH_DOMAIN not found in .env"
  exit 1
fi

if [ -z "$VITE_FIREBASE_PROJECT_ID" ]; then
  echo "❌ Error: VITE_FIREBASE_PROJECT_ID not found in .env"
  exit 1
fi

echo "✅ VITE_FIREBASE_API_KEY: ${VITE_FIREBASE_API_KEY:0:20}..."
echo "✅ VITE_FIREBASE_AUTH_DOMAIN: $VITE_FIREBASE_AUTH_DOMAIN"
echo "✅ VITE_FIREBASE_PROJECT_ID: $VITE_FIREBASE_PROJECT_ID"
echo ""

# Verify backend Firebase credentials
if [ -z "$FIREBASE_PROJECT_ID" ]; then
  echo "⚠️  Warning: FIREBASE_PROJECT_ID not found (backend credentials)"
fi

if [ -z "$FIREBASE_CLIENT_EMAIL" ]; then
  echo "⚠️  Warning: FIREBASE_CLIENT_EMAIL not found (backend credentials)"
fi

echo ""
echo "🔨 Building Docker image with Firebase configuration embedded..."
echo "This will take a few minutes..."

# Build with explicit variable passing
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --progress=plain \
  -t gcr.io/fast-planet-470408-f1/perala:latest .

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed!"
  exit 1
fi

echo "✅ Docker image built successfully"
echo ""

# Push to Google Container Registry
echo "📦 Pushing to Google Container Registry..."
docker push gcr.io/fast-planet-470408-f1/perala:latest

if [ $? -ne 0 ]; then
  echo "❌ Docker push failed!"
  exit 1
fi

echo "✅ Image pushed successfully"
echo ""

# Deploy to Cloud Run with backend credentials
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL},NODE_ENV=production" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"

if [ $? -ne 0 ]; then
  echo "❌ Cloud Run deployment failed!"
  exit 1
fi

echo ""
echo "✅ ✅ ✅ PERALA deployment complete! ✅ ✅ ✅"
echo ""
echo "🔗 Your PERALA server URL:"
gcloud run services describe perala --region us-central1 --format="value(status.url)"
echo ""
echo "📝 Next steps:"
echo "1. Test login at the URL above"
echo "2. Check logs: gcloud run services logs read perala --limit 50"
echo "3. If still getting errors, wait 5-10 minutes for OAuth changes to propagate"
echo ""
