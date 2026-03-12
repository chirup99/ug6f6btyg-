#!/bin/bash

# Secure Cloud Run Deployment Script using Google Secret Manager
# This script stores secrets securely and deploys your Trading Platform

set -e

echo "=========================================="
echo "Secure Cloud Run Deployment"
echo "=========================================="
echo ""

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No GCP project selected. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project: $PROJECT_ID"
echo "📍 Region: us-central1"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Create a .env file with your credentials first."
    exit 1
fi

echo "🔧 Step 1: Enabling required APIs..."
gcloud services enable secretmanager.googleapis.com run.googleapis.com cloudbuild.googleapis.com --quiet

echo ""
echo "🔐 Step 2: Creating/updating secrets in Secret Manager..."

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if gcloud secrets describe $secret_name &>/dev/null; then
        echo "   Updating: $secret_name"
        echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=- --quiet
    else
        echo "   Creating: $secret_name"
        echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=- --quiet
    fi
}

# Read credentials from .env
FIREBASE_PROJECT_ID=$(grep '^FIREBASE_PROJECT_ID=' .env | cut -d'=' -f2 | tr -d '"')
FIREBASE_CLIENT_EMAIL=$(grep '^FIREBASE_CLIENT_EMAIL=' .env | cut -d'=' -f2 | tr -d '"')
GEMINI_API_KEY=$(grep '^GEMINI_API_KEY=' .env | head -1 | cut -d'=' -f2 | tr -d '"')
FYERS_APP_ID=$(grep '^FYERS_APP_ID=' .env | cut -d'=' -f2 | tr -d '"')
FYERS_SECRET_KEY=$(grep '^FYERS_SECRET_KEY=' .env | cut -d'=' -f2 | tr -d '"')
FYERS_ACCESS_TOKEN=$(grep '^FYERS_ACCESS_TOKEN=' .env | cut -d'=' -f2 | tr -d '"')

# Extract and convert multi-line private key to single-line
FIREBASE_PRIVATE_KEY=$(grep -A 100 'FIREBASE_PRIVATE_KEY=' .env | \
    sed -n '/FIREBASE_PRIVATE_KEY=/,/-----END PRIVATE KEY-----/p' | \
    sed '1s/FIREBASE_PRIVATE_KEY=//' | \
    tr -d '"' | \
    awk '{printf "%s\\n", $0}' | \
    sed 's/\\n$//')

# Validate required variables
if [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$FIREBASE_CLIENT_EMAIL" ] || [ -z "$FIREBASE_PRIVATE_KEY" ]; then
    echo "❌ Error: Missing Firebase credentials in .env file"
    exit 1
fi

# Create/update secrets
create_or_update_secret "firebase-project-id" "$FIREBASE_PROJECT_ID"
create_or_update_secret "firebase-client-email" "$FIREBASE_CLIENT_EMAIL"
create_or_update_secret "firebase-private-key" "$FIREBASE_PRIVATE_KEY"

if [ -n "$GEMINI_API_KEY" ]; then
    create_or_update_secret "gemini-api-key" "$GEMINI_API_KEY"
fi

if [ -n "$FYERS_APP_ID" ]; then
    create_or_update_secret "fyers-app-id" "$FYERS_APP_ID"
fi

if [ -n "$FYERS_SECRET_KEY" ]; then
    create_or_update_secret "fyers-secret-key" "$FYERS_SECRET_KEY"
fi

if [ -n "$FYERS_ACCESS_TOKEN" ]; then
    create_or_update_secret "fyers-access-token" "$FYERS_ACCESS_TOKEN"
fi

echo ""
echo "🔑 Step 3: Granting Secret Manager access to Cloud Run..."

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for secret in firebase-project-id firebase-client-email firebase-private-key \
              gemini-api-key fyers-app-id fyers-secret-key fyers-access-token; do
    if gcloud secrets describe $secret &>/dev/null; then
        gcloud secrets add-iam-policy-binding $secret \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="roles/secretmanager.secretAccessor" \
            --quiet 2>/dev/null || true
    fi
done

echo ""
echo "🏗️  Step 4: Building Docker image..."

# Read frontend Firebase config from .env
VITE_FIREBASE_API_KEY=$(grep '^VITE_FIREBASE_API_KEY=' .env | cut -d'=' -f2 | tr -d '"')
VITE_FIREBASE_AUTH_DOMAIN=$(grep '^VITE_FIREBASE_AUTH_DOMAIN=' .env | cut -d'=' -f2 | tr -d '"')
VITE_FIREBASE_PROJECT_ID=$(grep '^VITE_FIREBASE_PROJECT_ID=' .env | cut -d'=' -f2 | tr -d '"')
VITE_FIREBASE_STORAGE_BUCKET=$(grep '^VITE_FIREBASE_STORAGE_BUCKET=' .env | cut -d'=' -f2 | tr -d '"')
VITE_FIREBASE_MESSAGING_SENDER_ID=$(grep '^VITE_FIREBASE_MESSAGING_SENDER_ID=' .env | cut -d'=' -f2 | tr -d '"')
VITE_FIREBASE_APP_ID=$(grep '^VITE_FIREBASE_APP_ID=' .env | cut -d'=' -f2 | tr -d '"')

# Debug: Show what we're passing (hide sensitive values)
echo "   Frontend Firebase API Key: ${VITE_FIREBASE_API_KEY:0:20}..."
echo "   Backend Firebase Project: $FIREBASE_PROJECT_ID"
echo "   Gemini API Key: ${GEMINI_API_KEY:0:20}..."
echo "   Fyers App ID: $FYERS_APP_ID"

gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/perala \
    --timeout=1200s \
    --machine-type=e2-highcpu-8 \
    --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
    --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
    --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
    --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
    --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
    --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
    --build-arg FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
    --build-arg FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL" \
    --build-arg FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
    --build-arg GEMINI_API_KEY="$GEMINI_API_KEY" \
    --build-arg FYERS_APP_ID="$FYERS_APP_ID" \
    --build-arg FYERS_SECRET_KEY="$FYERS_SECRET_KEY" \
    --build-arg FYERS_ACCESS_TOKEN="$FYERS_ACCESS_TOKEN"

echo ""
echo "🚀 Step 5: Deploying to Cloud Run..."

gcloud run deploy perala \
    --image gcr.io/$PROJECT_ID/perala \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --set-env-vars "DATABASE_URL=sqlite.db,NODE_ENV=production" \
    --set-secrets "FIREBASE_PROJECT_ID=firebase-project-id:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest,GEMINI_API_KEY=gemini-api-key:latest,FYERS_APP_ID=fyers-app-id:latest,FYERS_SECRET_KEY=fyers-secret-key:latest,FYERS_ACCESS_TOKEN=fyers-access-token:latest"

echo ""
echo "✅ Deployment complete!"
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe perala --region us-central1 --format='value(status.url)')
echo "🌐 Your application is live at:"
echo "   $SERVICE_URL"
echo ""
echo "🔍 Verify Firebase authentication:"
echo "   curl $SERVICE_URL/api/auth/status"
echo ""
