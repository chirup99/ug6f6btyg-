#!/bin/bash
# Deploy to AWS Elastic Beanstalk - perala-prod (ap-south-1)
# Usage: bash scripts/deploy-perala-eb.sh

set -e

REGION="ap-south-1"
ACCOUNT_ID="323726447850"
APPLICATION_NAME="TradingMaster"
ENVIRONMENT_NAME="perala-prod"
S3_BUCKET="elasticbeanstalk-${REGION}-${ACCOUNT_ID}"
VERSION_LABEL="perala-$(date +%s)"
ZIP_FILE="perala-eb-latest.zip"

echo "🚀 Building and deploying Perala to AWS Elastic Beanstalk"
echo "   Region:      $REGION"
echo "   Application: $APPLICATION_NAME"
echo "   Environment: $ENVIRONMENT_NAME"
echo "   Version:     $VERSION_LABEL"
echo ""

# Step 1: Build
echo "📦 Building app..."
npm run build
echo "✅ Build complete"

# Step 2: Create deployment zip
echo ""
echo "🗜️  Creating deployment zip..."
rm -f "$ZIP_FILE"
zip -r "$ZIP_FILE" dist/ package.json package-lock.json Procfile .platform/ \
  -x "*.git*" -x "node_modules/*"
echo "✅ Zip created: $(du -sh $ZIP_FILE | cut -f1)"

# Step 3: Upload and deploy via Node.js
echo ""
node --input-type=module << JSEOF
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ElasticBeanstalkClient, CreateApplicationVersionCommand, UpdateEnvironmentCommand } from '@aws-sdk/client-elastic-beanstalk';
import fs from 'fs';

const s3 = new S3Client({ region: '${REGION}' });
const eb = new ElasticBeanstalkClient({ region: '${REGION}' });
const s3Key = '${APPLICATION_NAME}/${VERSION_LABEL}.zip';

console.log('📤 Uploading to S3...');
await s3.send(new PutObjectCommand({
  Bucket: '${S3_BUCKET}',
  Key: s3Key,
  Body: fs.readFileSync('${ZIP_FILE}'),
  ContentType: 'application/zip'
}));
console.log('✅ Uploaded to S3');

console.log('📋 Creating application version...');
await eb.send(new CreateApplicationVersionCommand({
  ApplicationName: '${APPLICATION_NAME}',
  VersionLabel: '${VERSION_LABEL}',
  Description: 'Deployed at ' + new Date().toISOString(),
  SourceBundle: { S3Bucket: '${S3_BUCKET}', S3Key: s3Key },
  AutoCreateApplication: false
}));
console.log('✅ Version created');

console.log('🔄 Updating environment...');
const res = await eb.send(new UpdateEnvironmentCommand({
  ApplicationName: '${APPLICATION_NAME}',
  EnvironmentName: '${ENVIRONMENT_NAME}',
  VersionLabel: '${VERSION_LABEL}'
}));
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('🎉 DEPLOYMENT INITIATED SUCCESSFULLY!');
console.log('   URL: http://' + res.CNAME);
console.log('   Monitor: https://${REGION}.console.aws.amazon.com/elasticbeanstalk/home?region=${REGION}');
console.log('   Wait ~5 minutes for the environment to become Ready');
console.log('═══════════════════════════════════════════════════════');
JSEOF
