#!/bin/bash
# Production Deployment Script for Firebase + Cloud Run

set -e  # Exit on error

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Configuration
PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="asia-south1"

echo ""
echo "📦 Step 1: Building Frontend for Firebase Hosting..."
echo "------------------------------------------------------"
# Build frontend with production environment
npm run build

echo ""
echo "🔥 Step 2: Deploying Frontend to Firebase Hosting..."
echo "------------------------------------------------------"
firebase deploy --only hosting --project $PROJECT_ID

echo ""
echo "🐳 Step 3: Building and Deploying Backend to Cloud Run..."
echo "------------------------------------------------------"
# Build and deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --project=$PROJECT_ID \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=10

echo ""
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "📍 Your application is now live at:"
echo "   Frontend: https://fast-planet-470408-f1.web.app"
echo "   Backend:  $(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)')"
echo ""
echo "🔍 Next Steps:"
echo "   1. Test your application"
echo "   2. Configure Cloud Run environment variables (if not done yet)"
echo "   3. Monitor logs: gcloud logs tail --project=$PROJECT_ID"
echo ""
