#!/bin/bash
# Quick deployment for Perala

echo "🚀 Deploying Perala to Cloud Run..."
echo "Project: fast-planet-470408-f1"
echo "Service: perala"
echo ""

gcloud config set project fast-planet-470408-f1

gcloud run deploy perala \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --platform=managed \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "View your service:"
gcloud run services describe perala --region=us-central1 --format='value(status.url)'
