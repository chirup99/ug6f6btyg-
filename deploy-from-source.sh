#!/bin/bash
# Deploy Perala from source - builds image automatically

echo "🚀 Deploying Perala from source code..."

gcloud config set project fast-planet-470408-f1

# This will build the Docker image AND deploy in one step
gcloud run deploy perala \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --platform=managed \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --max-instances=10

echo "✅ Done!"
