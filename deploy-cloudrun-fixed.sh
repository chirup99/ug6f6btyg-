#!/bin/bash
# ✅ FIXED Cloud Run Deployment Script with Firebase Build Arguments
# This script properly passes Firebase config at BUILD time for Vite

set -e

echo "🚀 Starting Cloud Run deployment with Firebase authentication..."
echo ""

# Project settings
PROJECT_ID="fast-planet-470408-f1"
REGION="us-central1"
SERVICE_NAME="perala"

# Load environment variables from .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Source the .env file
export $(cat .env | grep -v '^#' | xargs)

echo "✅ Environment variables loaded from .env"
echo ""

# Convert multi-line private key to single-line for Docker
FIREBASE_PRIVATE_KEY_SINGLE_LINE=$(echo "$FIREBASE_PRIVATE_KEY" | awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}')

echo "🔨 Building Docker image with Firebase frontend config..."
echo "📦 This embeds Firebase config into the frontend bundle at BUILD time"
echo "🔒 Backend credentials are NOT embedded - they're passed at runtime for security"
echo ""

# Build Docker image with ONLY frontend Firebase config as build arguments
# Backend credentials are passed at runtime via --set-env-vars (more secure)
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  -f Dockerfile \
  .

echo ""
echo "✅ Docker image built successfully!"
echo ""

echo "📤 Pushing image to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

echo ""
echo "✅ Image pushed successfully!"
echo ""

echo "🚀 Deploying to Cloud Run..."
echo "⏳ This may take 2-5 minutes..."
echo ""

# Deploy to Cloud Run with runtime environment variables (for backend)
# Using custom service account with minimal permissions for better security
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --project $PROJECT_ID \
  --service-account cloud-build-perala@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars "DATABASE_URL=sqlite.db,NODE_ENV=production,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL,FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY_SINGLE_LINE,GEMINI_API_KEY=$GEMINI_API_KEY,FYERS_APP_ID=$FYERS_APP_ID,FYERS_SECRET_KEY=$FYERS_SECRET_KEY,FYERS_ACCESS_TOKEN=$FYERS_ACCESS_TOKEN"

echo ""
echo "✅✅✅ DEPLOYMENT SUCCESSFUL! ✅✅✅"
echo ""
echo "🌐 Your app is now live at:"
echo "   https://$SERVICE_NAME-<random-id>-uc.a.run.app"
echo ""
echo "📋 To get the exact URL, run:"
echo "   gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'"
echo ""
echo "🔑 Firebase authentication is now properly configured!"
echo "   Users should be able to sign in with Google"
echo ""
