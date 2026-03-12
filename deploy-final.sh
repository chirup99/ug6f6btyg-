#!/bin/bash
# Final Cloud Run Backend Deployment Script

set -e

echo "🚀 Deploying Backend to Cloud Run..."
echo "====================================="

PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="asia-south1"

echo ""
echo "🐳 Building and deploying to Cloud Run..."

# Build the docker image using Cloud Build
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME .

# Deploy the image to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=4Gi \
  --cpu=2 \
  --timeout=900 \
  --cpu-boost \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=10 \
  --service-account=perala@fast-planet-470408-f1.iam.gserviceaccount.com \
  --set-env-vars="NODE_ENV=production"

echo ""
echo "✅ Deployment Complete!"
echo "Backend URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)')"
echo ""
echo "🔍 Test health endpoint:"
echo "curl $(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)')/health"
echo ""
