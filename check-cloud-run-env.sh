#!/bin/bash

# Check Cloud Run Environment Variables for Firebase Config
# Run this script from your local machine (not Replit)

echo "🔍 Checking Cloud Run environment variables for Firebase..."
echo ""

# Get all environment variables from Cloud Run
ENV_VARS=$(gcloud run services describe perala \
  --region us-central1 \
  --format 'value(spec.template.spec.containers[0].env)' \
  2>&1)

if [[ $? -ne 0 ]]; then
  echo "❌ Error: gcloud command failed. Make sure you're authenticated:"
  echo "   gcloud auth login"
  echo "   gcloud config set project fast-planet-470408-f1"
  exit 1
fi

echo "📊 Cloud Run Environment Variables:"
echo "$ENV_VARS"
echo ""
echo "🔍 Checking for Firebase credentials..."
echo ""

# Check for Firebase variables
if echo "$ENV_VARS" | grep -q "FIREBASE_PROJECT_ID"; then
  echo "✅ FIREBASE_PROJECT_ID found"
else
  echo "❌ FIREBASE_PROJECT_ID missing"
fi

if echo "$ENV_VARS" | grep -q "FIREBASE_CLIENT_EMAIL"; then
  echo "✅ FIREBASE_CLIENT_EMAIL found"
else
  echo "❌ FIREBASE_CLIENT_EMAIL missing"
fi

if echo "$ENV_VARS" | grep -q "FIREBASE_PRIVATE_KEY"; then
  echo "✅ FIREBASE_PRIVATE_KEY found"
else
  echo "❌ FIREBASE_PRIVATE_KEY missing"
fi

echo ""
echo "🎯 Cloud Run Service Account (Principal) - This is SEPARATE from Firebase:"
gcloud run services describe perala \
  --region us-central1 \
  --format 'value(spec.template.spec.serviceAccountName)'

echo ""
echo "📝 Summary:"
echo "   - Cloud Run Principal: Runs your container (you'll see 808950990883-compute@...)"
echo "   - Firebase credentials: Should be in environment variables above"
echo "   - These are DIFFERENT service accounts - both are correct!"
