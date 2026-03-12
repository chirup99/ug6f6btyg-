#!/bin/bash

# Install Google Cloud SDK in Replit environment
# This allows deploying to Cloud Run directly from Replit

set -e

echo "🔧 Installing Google Cloud SDK..."
echo ""

# Create a directory for gcloud
mkdir -p ~/google-cloud-sdk

# Download the latest gcloud SDK
echo "📥 Downloading gcloud SDK..."
curl https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=$HOME

# Add gcloud to PATH
echo ""
echo "📝 Adding gcloud to PATH..."
echo 'export PATH=$HOME/google-cloud-sdk/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Initialize gcloud (requires user authentication)
echo ""
echo "✅ Google Cloud SDK installed!"
echo ""
echo "🔑 To authenticate and set up your project, run:"
echo "   source ~/.bashrc"
echo "   gcloud init"
echo ""
echo "Or for non-interactive setup:"
echo "   gcloud auth login"
echo "   gcloud config set project fast-planet-470408-f1"
echo "   gcloud config set run/region us-central1"
echo ""
echo "After authentication, you can deploy using:"
echo "   ./deploy-cloudrun-no-docker.sh"
