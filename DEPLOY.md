# Cloud Run Deployment Guide

This guide covers multiple ways to deploy your Trading Platform to Google Cloud Run.

## Prerequisites

1. Google Cloud Project with billing enabled
2. Cloud Run API enabled
3. Cloud Build API enabled
4. Artifact Registry API enabled (or Container Registry)
5. `gcloud` CLI installed and authenticated

## Method 1: Direct Dockerfile Deployment (Recommended)

This is the simplest method that builds your Docker image locally or in Cloud Build.

```bash
# Make sure you're in the project root
cd /path/to/your/project

# Set your GCP project
gcloud config set project YOUR-PROJECT-ID

# Deploy using the Dockerfile
gcloud run deploy trading-platform \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --platform=managed \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --max-instances=10
```

## Method 2: Using Cloud Build (For Repository Deployments)

If you've connected your repository (GitHub, GitLab, etc.) to Cloud Run:

1. Make sure you have `cloudbuild.yaml` in your repository root (already created)
2. The build will automatically use the Dockerfile
3. Push your code to the repository
4. Cloud Build will automatically build and deploy

### Manual Cloud Build Trigger

```bash
# Build using Cloud Build explicitly
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=COMMIT_SHA=$(git rev-parse HEAD)
```

## Method 3: Pre-built Docker Image

If you want to build the image yourself first:

```bash
# Set variables
PROJECT_ID="your-project-id"
IMAGE_NAME="gcr.io/${PROJECT_ID}/trading-platform"

# Build the Docker image locally
docker build -t ${IMAGE_NAME}:latest -f Dockerfile .

# Push to Google Container Registry
docker push ${IMAGE_NAME}:latest

# Deploy to Cloud Run
gcloud run deploy trading-platform \
  --image=${IMAGE_NAME}:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --platform=managed \
  --memory=2Gi \
  --cpu=2
```

## Environment Variables

Don't forget to set your environment variables in Cloud Run:

```bash
gcloud run services update trading-platform \
  --region=us-central1 \
  --set-env-vars="NODE_ENV=production,FYERS_APP_ID=your-app-id,GOOGLE_CLOUD_BACKUP_ENABLED=false"
```

Or use the Cloud Console to add secrets securely.

## Troubleshooting

### Build fails with "package.json not found"
- Ensure `.gcloudignore` doesn't exclude package.json
- Check that `Dockerfile` explicitly copies `package.json` and `package-lock.json`

### Build timeout
- Increase timeout in `cloudbuild.yaml` (already set to 1800s)
- Use a larger machine type in Cloud Build options

### Memory issues during build
- Use `E2_HIGHCPU_8` machine type in cloudbuild.yaml (already configured)

### Application crashes on startup
- Check Cloud Run logs: `gcloud run services logs read trading-platform --region=us-central1`
- Ensure all environment variables are set
- Verify the PORT environment variable is used (Cloud Run sets this automatically)

## Files Created for Deployment

- `Dockerfile` - Main Docker configuration
- `Dockerfile.cloudrun` - Alternative Docker config
- `cloudbuild.yaml` - Cloud Build configuration
- `.gcloudignore` - Files to exclude from deployment
- `Procfile` - Process configuration for buildpack deployment
- `app.yaml` - App Engine configuration (if needed)
- `deploy-cloud-run.sh` - Automated deployment script

## Quick Deploy Script

Use the provided script for easy deployment:

```bash
# Edit the script to set your project ID
nano deploy-cloud-run.sh

# Make it executable
chmod +x deploy-cloud-run.sh

# Run it
./deploy-cloud-run.sh
```
