#!/bin/bash

# Cloud Run Deployment with Firebase Admin Credentials
# This script deploys your app to Cloud Run with proper Firebase credentials

set -e

echo "🚀 Deploying to Cloud Run with Firebase credentials..."

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t gcr.io/fast-planet-470408-f1/trading-platform:latest .

# Push to Google Container Registry
echo "📦 Pushing to Container Registry..."
docker push gcr.io/fast-planet-470408-f1/trading-platform:latest

# Deploy to Cloud Run with secrets from Secret Manager
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy trading-platform \
  --image gcr.io/fast-planet-470408-f1/trading-platform:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="FIREBASE_PROJECT_ID=firebase-project-id:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest" \
  --set-env-vars="NODE_ENV=production,VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY,VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN,VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID,VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID"

echo "✅ Deployment complete!"
echo "🔗 Your app is live at the Cloud Run URL"
