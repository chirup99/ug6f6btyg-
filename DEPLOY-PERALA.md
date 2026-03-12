# Deploy Perala to Cloud Run

Quick deployment guide for your project.

## Your Configuration
- **Project ID**: `fast-planet-470408-f1`
- **Service Name**: `perala`
- **Region**: `us-central1`

## Quick Deploy (Recommended)

Simply run the deployment script:

```bash
./deploy-cloud-run.sh
```

This will:
1. Set your GCP project to `fast-planet-470408-f1`
2. Enable required APIs (Cloud Run, Cloud Build)
3. Build your Docker image using the Dockerfile
4. Deploy to Cloud Run as service `perala`
5. Give you the live URL

## Manual Deployment Commands

### Option 1: Direct source deployment
```bash
gcloud config set project fast-planet-470408-f1

gcloud run deploy perala \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --platform=managed \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --max-instances=10
```

### Option 2: Using pre-built image
If you've already pushed your image to `gcr.io/fast-planet-470408-f1/perala:latest`:

```bash
gcloud run deploy perala \
  --image=gcr.io/fast-planet-470408-f1/perala:latest \
  --region=us-central1 \
  --allow-unauthenticated \
  --platform=managed \
  --memory=2Gi \
  --cpu=2
```

### Option 3: Using Cloud Build
If deploying from repository:

```bash
# The cloudbuild.yaml is already configured for your project
gcloud builds submit --config=cloudbuild.yaml
```

## After Deployment

### View your service URL
```bash
gcloud run services describe perala --region=us-central1 --format='value(status.url)'
```

### View logs
```bash
gcloud run services logs read perala --region=us-central1 --limit=50
```

### Set environment variables
```bash
gcloud run services update perala \
  --region=us-central1 \
  --set-env-vars="FYERS_APP_ID=your-app-id,GOOGLE_CLOUD_BACKUP_ENABLED=false"
```

### Update memory/CPU if needed
```bash
gcloud run services update perala \
  --region=us-central1 \
  --memory=4Gi \
  --cpu=4
```

## Troubleshooting

### If build fails
Check the build logs:
```bash
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### If deployment fails
Check Cloud Run logs:
```bash
gcloud run services logs read perala --region=us-central1
```

### If you need to delete and redeploy
```bash
gcloud run services delete perala --region=us-central1
./deploy-cloud-run.sh
```

## Important Files
- `Dockerfile` - Docker build configuration
- `cloudbuild.yaml` - Cloud Build pipeline (uses service name: perala)
- `.gcloudignore` - Files excluded from deployment
- `deploy-cloud-run.sh` - Automated deployment script

## Next Steps After Successful Deployment

1. Your app will be live at: `https://perala-RANDOM.us-central1.run.app`
2. Set up custom domain (optional)
3. Configure environment variables for production
4. Set up monitoring and alerts in Cloud Console
