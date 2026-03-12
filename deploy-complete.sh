#!/bin/bash
# Deploy with ALL environment variables from .env

echo "🚀 Deploying Perala with COMPLETE environment configuration..."
echo "   This includes:"
echo "   ✅ Frontend Firebase (VITE_*)"
echo "   ✅ Backend Firebase Admin SDK"
echo "   ✅ Gemini API"
echo "   ✅ Fyers Trading API"
echo "   ✅ Database configuration"
echo ""

# Build with complete Dockerfile
echo "🔨 Building Docker image..."
docker build -f Dockerfile.complete -t gcr.io/fast-planet-470408-f1/perala:latest .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Push to Container Registry
echo "📤 Pushing to Google Container Registry..."
docker push gcr.io/fast-planet-470408-f1/perala:latest

if [ $? -ne 0 ]; then
    echo "❌ Push failed!"
    exit 1
fi

echo "✅ Push successful!"
echo ""

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
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

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "All environment variables are now available in Cloud Run:"
echo "   🔐 Frontend Firebase authentication"
echo "   🔐 Backend Firebase Admin SDK"
echo "   🤖 Gemini AI API"
echo "   📈 Fyers Trading API"
echo "   💾 Database connection"
echo ""
echo "Your app should now work exactly like it does locally!"
