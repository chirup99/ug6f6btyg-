#!/bin/bash
# Deploy to Cloud Run with Firebase credentials properly configured

echo "🚀 Deploying Perala to Cloud Run with Firebase credentials..."

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📋 Loading Firebase credentials from .env file..."
    export $(grep "^VITE_FIREBASE_" .env | xargs)
else
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your Firebase credentials."
    exit 1
fi

# Verify Firebase credentials are loaded
if [ -z "$VITE_FIREBASE_API_KEY" ]; then
    echo "❌ Error: VITE_FIREBASE_API_KEY not found in .env file"
    exit 1
fi

echo "✅ Firebase credentials loaded successfully"
echo "   API Key: ${VITE_FIREBASE_API_KEY:0:20}..."
echo "   Project: $VITE_FIREBASE_PROJECT_ID"

# Set GCP project
gcloud config set project fast-planet-470408-f1

# Build and deploy using Cloud Build with Firebase credentials
echo "🔨 Building Docker image with Firebase credentials..."
gcloud builds submit \
  --substitutions=\
_VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY",\
_VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN",\
_VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID",\
_VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET",\
_VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID",\
_VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --config=cloudbuild.yaml

echo ""
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10

echo ""
echo "✅ Deployment complete!"
echo "🔗 Your app should now be accessible at the Cloud Run URL"
echo "🔐 Firebase authentication should work correctly"
