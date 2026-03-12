#!/bin/bash

# AWS Elastic Beanstalk Deployment Script for Perala Live
set -e

echo "🚀 Starting AWS Elastic Beanstalk Deployment to perala-live..."

# Configuration - Correct application and environment names
APP_NAME="perala ai"
ENV_NAME="perala-live"
REGION="eu-north-1"
VERSION_LABEL="v$(date +%Y%m%d-%H%M%S)"

# Step 1: Build is already done
echo "✅ Application already built"

# Step 2: Create deployment package
echo "📁 Creating deployment package..."
rm -f deploy.zip

# Include only necessary files
zip -r deploy.zip \
  dist/ \
  package.json \
  package-lock.json \
  Procfile \
  .ebextensions/ \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "*.log" \
  -x ".env*"

echo "✅ Deployment package created: deploy.zip ($(du -h deploy.zip | cut -f1))"

# Step 3: Upload to S3 and create application version
echo "☁️ Uploading to S3..."
S3_BUCKET="elasticbeanstalk-${REGION}-$(aws sts get-caller-identity --query Account --output text)"

# Check if bucket exists
if ! aws s3 ls "s3://${S3_BUCKET}" 2>&1 > /dev/null; then
  echo "Creating S3 bucket: ${S3_BUCKET}"
  aws s3 mb "s3://${S3_BUCKET}" --region ${REGION}
fi

aws s3 cp deploy.zip "s3://${S3_BUCKET}/${APP_NAME}/${VERSION_LABEL}.zip"

# Step 4: Create application version in Elastic Beanstalk
echo "📝 Creating application version: ${VERSION_LABEL}"
aws elasticbeanstalk create-application-version \
  --application-name "${APP_NAME}" \
  --version-label "${VERSION_LABEL}" \
  --source-bundle S3Bucket="${S3_BUCKET}",S3Key="${APP_NAME}/${VERSION_LABEL}.zip" \
  --region ${REGION}

# Step 5: Deploy to environment
echo "🚀 Deploying to environment: ${ENV_NAME}"
aws elasticbeanstalk update-environment \
  --application-name "${APP_NAME}" \
  --environment-name "${ENV_NAME}" \
  --version-label "${VERSION_LABEL}" \
  --region ${REGION}

echo "⏳ Waiting for deployment to complete..."
aws elasticbeanstalk wait environment-updated \
  --application-name "${APP_NAME}" \
  --environment-names "${ENV_NAME}" \
  --region ${REGION}

# Step 6: Get environment URL
echo ""
echo "✅ Deployment Complete!"
CNAME=$(aws elasticbeanstalk describe-environments \
  --application-name "${APP_NAME}" \
  --environment-names "${ENV_NAME}" \
  --query "Environments[0].CNAME" \
  --output text \
  --region ${REGION})

echo "🌐 Your application is available at: https://${CNAME}"
echo ""
echo "📊 Environment Status:"
aws elasticbeanstalk describe-environments \
  --application-name "${APP_NAME}" \
  --environment-names "${ENV_NAME}" \
  --query "Environments[0].{Status:Status,Health:Health,HealthStatus:HealthStatus}" \
  --region ${REGION}
