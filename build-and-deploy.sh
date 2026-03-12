#!/bin/bash
# Build and Deploy with environment variables

set -e

echo "🚀 Building and Deploying with environment variables..."
echo "=================================================="

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Trigger Cloud Build
gcloud builds submit --config cloudbuild.yaml --substitutions=\
"_VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY,_VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN,_VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID,_VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET,_VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID,_VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID"

# Deploy to Cloud Run
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala \
  --region=asia-south1 \
  --project=fast-planet-470408-f1 \
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
