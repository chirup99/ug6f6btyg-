#!/bin/bash
set -e

S3_BUCKET="perala-static-assets"
S3_REGION="ap-south-1"
CDN_URL="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/"

echo "▶ Building with CDN base: $CDN_URL"
VITE_CDN_URL="$CDN_URL" npm run build

echo "▶ Uploading assets to s3://$S3_BUCKET/"
aws s3 sync dist/public/assets s3://$S3_BUCKET/assets \
  --region $S3_REGION \
  --cache-control "public, max-age=31536000, immutable" \
  --content-encoding gzip \
  --metadata-directive REPLACE \
  --exclude "*.html" \
  --delete 2>/dev/null || \
aws s3 sync dist/public/assets s3://$S3_BUCKET/assets \
  --region $S3_REGION \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --delete

echo "▶ Uploading index.html (no-cache) to S3 for reference"
aws s3 cp dist/public/index.html s3://$S3_BUCKET/index.html \
  --region $S3_REGION \
  --cache-control "no-cache, no-store, must-revalidate"

echo ""
echo "✅ CDN deploy complete!"
echo "   Assets served from: ${CDN_URL}assets/"
echo "   index.html served from: Express (perala.in)"
echo ""
echo "   For production, set this env var before building:"
echo "   VITE_CDN_URL=$CDN_URL"
