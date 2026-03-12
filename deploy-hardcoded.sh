#!/bin/bash
# ⚠️ WARNING: This uses hardcoded credentials in Dockerfile
# NOT recommended for production - use deploy-secure.sh instead

echo "⚠️  WARNING: Using hardcoded credentials from Dockerfile.hardcoded"
echo "This is NOT secure for production use!"
echo ""
read -p "Continue anyway? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🚀 Building with hardcoded credentials..."

# Build image locally with hardcoded Dockerfile
docker build -f Dockerfile.hardcoded -t gcr.io/fast-planet-470408-f1/perala:latest .

# Push to GCR
docker push gcr.io/fast-planet-470408-f1/perala:latest

# Deploy to Cloud Run
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --project fast-planet-470408-f1

echo "✅ Deployed (but credentials are exposed in Docker image!)"
