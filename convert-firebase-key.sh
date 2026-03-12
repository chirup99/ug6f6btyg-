#!/bin/bash

# Helper script to convert multi-line Firebase private key to single-line format
# Usage: ./convert-firebase-key.sh

echo "==================================="
echo "Firebase Private Key Converter"
echo "==================================="
echo ""
echo "This script reads your .env file and converts the multi-line"
echo "FIREBASE_PRIVATE_KEY to single-line format for Cloud Run deployment."
echo ""

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

echo "📄 Reading FIREBASE_PRIVATE_KEY from .env..."
echo ""

PRIVATE_KEY=$(grep -A 100 'FIREBASE_PRIVATE_KEY=' .env | sed -n '/FIREBASE_PRIVATE_KEY=/,/-----END PRIVATE KEY-----/p' | sed '1s/FIREBASE_PRIVATE_KEY=//' | tr -d '"')

if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: FIREBASE_PRIVATE_KEY not found in .env"
    exit 1
fi

SINGLE_LINE_KEY=$(echo "$PRIVATE_KEY" | tr '\n' '\\n' | sed 's/\\n$//')

echo "✅ Single-line format (copy this for Cloud Run):"
echo "================================================"
echo "$SINGLE_LINE_KEY"
echo "================================================"
echo ""
echo "💡 You can use this value in:"
echo "   1. cloudbuild.yaml substitutions section"
echo "   2. Cloud Run environment variables"
echo "   3. gcloud deploy command"
echo ""
