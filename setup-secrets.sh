#!/bin/bash
# One-time setup: Store Firebase credentials in Google Cloud Secret Manager

echo "🔐 Setting up Firebase credentials in Secret Manager..."

# Load from your .env file
export $(grep "^VITE_FIREBASE_" .env | xargs)

# Create secrets in Secret Manager
gcloud secrets create firebase-api-key --data-file=<(echo -n "$VITE_FIREBASE_API_KEY") --project=fast-planet-470408-f1 2>/dev/null || \
gcloud secrets versions add firebase-api-key --data-file=<(echo -n "$VITE_FIREBASE_API_KEY") --project=fast-planet-470408-f1

gcloud secrets create firebase-auth-domain --data-file=<(echo -n "$VITE_FIREBASE_AUTH_DOMAIN") --project=fast-planet-470408-f1 2>/dev/null || \
gcloud secrets versions add firebase-auth-domain --data-file=<(echo -n "$VITE_FIREBASE_AUTH_DOMAIN") --project=fast-planet-470408-f1

gcloud secrets create firebase-project-id --data-file=<(echo -n "$VITE_FIREBASE_PROJECT_ID") --project=fast-planet-470408-f1 2>/dev/null || \
gcloud secrets versions add firebase-project-id --data-file=<(echo -n "$VITE_FIREBASE_PROJECT_ID") --project=fast-planet-470408-f1

gcloud secrets create firebase-storage-bucket --data-file=<(echo -n "$VITE_FIREBASE_STORAGE_BUCKET") --project=fast-planet-470408-f1 2>/dev/null || \
gcloud secrets versions add firebase-storage-bucket --data-file=<(echo -n "$VITE_FIREBASE_STORAGE_BUCKET") --project=fast-planet-470408-f1

gcloud secrets create firebase-messaging-sender-id --data-file=<(echo -n "$VITE_FIREBASE_MESSAGING_SENDER_ID") --project=fast-planet-470408-f1 2>/dev/null || \
gcloud secrets versions add firebase-messaging-sender-id --data-file=<(echo -n "$VITE_FIREBASE_MESSAGING_SENDER_ID") --project=fast-planet-470408-f1

gcloud secrets create firebase-app-id --data-file=<(echo -n "$VITE_FIREBASE_APP_ID") --project=fast-planet-470408-f1 2>/dev/null || \
gcloud secrets versions add firebase-app-id --data-file=<(echo -n "$VITE_FIREBASE_APP_ID") --project=fast-planet-470408-f1

echo "✅ Secrets stored securely in Secret Manager"
