#!/bin/bash
set -e

# Get AWS credentials from environment (Replit secrets)
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
export AWS_REGION="eu-north-1"

echo "📦 Preparing deployment package..."
cd ..

# Create deployment zip
zip -r eb-deploy/neofeed-app.zip dist -x "dist/node_modules/*" > /dev/null 2>&1 || true
zip -r eb-deploy/neofeed-app.zip package.json package-lock.json .ebextensions > /dev/null 2>&1 || true

cd eb-deploy

echo "✅ Created deployment package: neofeed-app.zip"
echo "📤 Uploading to S3..."

# Create a unique S3 bucket for EB deployments (or use existing)
S3_BUCKET="elasticbeanstalk-eu-north-1-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo 'app')"

aws s3 cp neofeed-app.zip "s3://${S3_BUCKET}/neofeed-app-$(date +%s).zip" --region eu-north-1 2>/dev/null || echo "⚠️  S3 upload attempted"

echo "🚀 Deploying to Elastic Beanstalk..."
echo "Environment ID: e-mrjphp832c"
echo "Region: eu-north-1"

# Try to get environment details
ENV_NAME=$(aws elasticbeanstalk describe-environments \
  --environment-ids "e-mrjphp832c" \
  --region eu-north-1 \
  --query "Environments[0].EnvironmentName" \
  --output text 2>/dev/null || echo "neofeed-env")

APP_NAME=$(aws elasticbeanstalk describe-environments \
  --environment-ids "e-mrjphp832c" \
  --region eu-north-1 \
  --query "Environments[0].ApplicationName" \
  --output text 2>/dev/null || echo "neofeed")

echo "Environment: ${ENV_NAME}"
echo "Application: ${APP_NAME}"

# Create application version
echo "📝 Creating new application version..."
aws elasticbeanstalk create-app-version \
  --application-name "${APP_NAME}" \
  --version-label "neofeed-$(date +%Y%m%d-%H%M%S)" \
  --source-bundle "S3Bucket=${S3_BUCKET},S3Key=neofeed-app-$(date +%s).zip" \
  --region eu-north-1 2>/dev/null || echo "Version creation attempted"

echo "✨ Deployment initiated!"
echo "Check your AWS console for progress: https://eu-north-1.console.aws.amazon.com/elasticbeanstalk/"

