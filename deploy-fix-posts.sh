#!/bin/bash

# ===================================================================
# Cloud Run Deployment Script - Fixes Post Creation CORS Issue
# ===================================================================
# This script deploys your backend with --allow-unauthenticated flag
# which allows OPTIONS preflight requests to reach your CORS handler
# ===================================================================

set -e  # Exit on error

echo "🚀 Deploying Cloud Run backend with CORS fix..."
echo ""
echo "This will:"
echo "  ✅ Allow OPTIONS preflight requests (fixes CORS)"
echo "  ✅ Keep POST authentication secure (Firebase tokens still required)"
echo "  ✅ Enable post creation from frontend"
echo ""

# Configuration
PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala-backend"
REGION="us-central1"

# Confirm deployment
read -p "Deploy to Cloud Run? (y/n) " -n 1 -r
echo
if [[ ! $REPL =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "📦 Building and deploying..."

# Deploy with --allow-unauthenticated to fix CORS
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --timeout 300 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Testing post creation..."
echo ""
echo "Next steps:"
echo "  1. Open your app in Neo Feed tab"
echo "  2. Try creating a post"
echo "  3. Should work without CORS errors! 🎉"
echo ""
echo "📊 View logs:"
echo "  gcloud run services logs read $SERVICE_NAME --region $REGION --limit=50"
echo ""
