#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep VITE_FIREBASE | xargs)
else
  echo "Error: .env file not found!"
  exit 1
fi

# Configuration
PROJECT_ID="fast-planet-470408-f1"  # Your GCP project ID
SERVICE_NAME="perala"               # Your service name (change if different)
REGION="us-central1"                # Your region

echo "🚀 Deploying to Cloud Run with Firebase config..."

# Deploy with build arguments
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --project $PROJECT_ID

echo "✅ Deployment complete!"
