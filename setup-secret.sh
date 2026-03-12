#!/bin/bash
# This script securely creates and populates a secret in Google Cloud Secret Manager.
set -e

# Load environment variables from .env file
if [ ! -f .env ]; then
  echo "Error: .env file not found."
  exit 1
fi
set -o allexport
source .env
set +o allexport

PROJECT_ID="fast-planet-470408-f1"
SECRET_ID="firebase-private-key"
SERVICE_ACCOUNT_EMAIL="cloud-build-perala@${PROJECT_ID}.iam.gserviceaccount.com"

# Enable the Secret Manager API if it'''s not already enabled
echo "🔑 Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# Create the secret if it doesn'''t exist
echo "🔑 Checking for secret '''$SECRET_ID'''..."
if ! gcloud secrets describe $SECRET_ID --project=$PROJECT_ID &>/dev/null; then
  echo "✨ Secret not found. Creating secret '''$SECRET_ID'''..."
  gcloud secrets create $SECRET_ID --replication-policy="automatic" --project=$PROJECT_ID
else
  echo "✅ Secret '''$SECRET_ID''' already exists."
fi

# Add the private key from the .env file as a new secret version.
# This reads the file content directly, preserving all formatting.
echo "🔐 Adding new secret version from .env file..."
gcloud secrets versions add $SECRET_ID --data-file=- --project=$PROJECT_ID <<EOF
$FIREBASE_PRIVATE_KEY
EOF

# Grant the Cloud Run service account permission to access the secret
echo "🔒 Granting access to the service account..."
gcloud secrets add-iam-policy-binding $SECRET_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/secretmanager.secretAccessor" --project=$PROJECT_ID

echo "✅ Successfully stored Firebase private key in Secret Manager and granted access."
