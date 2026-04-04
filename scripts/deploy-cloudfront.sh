#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Perala — Full CloudFront + EB Deploy Script
#  Usage: bash scripts/deploy-cloudfront.sh
#
#  Required env vars (set in .env or export before running):
#    CLOUDFRONT_DISTRIBUTION_ID   — from setup-cloudfront.ts output
#    VITE_CDN_URL                 — e.g. https://d1abc.cloudfront.net/
#    ASSETS_S3_BUCKET             — perala-static-assets
#    EB_APP_NAME                  — perala-ai
#    EB_ENV_NAME                  — Peralai-env
# ═══════════════════════════════════════════════════════════════
set -e

# ── Load .env if present ─────────────────────────────────────────────────────
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^\s*#' .env | grep -v '^\s*$')
  set +a
fi

# ── Required variable checks ──────────────────────────────────────────────────
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID (from setup-cloudfront.ts)}"
: "${VITE_CDN_URL:?Set VITE_CDN_URL (e.g. https://d1abc.cloudfront.net/)}"
: "${ASSETS_S3_BUCKET:=perala-static-assets}"
: "${AWS_REGION:=ap-south-1}"
: "${EB_APP_NAME:=TradingMaster}"
: "${EB_ENV_NAME:=perala-prod}"
: "${EB_S3_BUCKET_OVERRIDE:=elasticbeanstalk-ap-south-1-323726447850}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Perala CloudFront Deploy"
echo "  CDN URL  : $VITE_CDN_URL"
echo "  S3 Bucket: $ASSETS_S3_BUCKET"
echo "  CF Dist  : $CLOUDFRONT_DISTRIBUTION_ID"
echo "  EB Env   : $EB_ENV_NAME"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Build frontend with CDN base URL ──────────────────────────────────
echo "▶ [1/5] Building frontend (VITE_CDN_URL=$VITE_CDN_URL)..."
VITE_CDN_URL="$VITE_CDN_URL" npm run build
echo "   ✅ Build complete"

# ── Step 2: Sync assets to S3 (skip .br / .gz pre-compressed duplicates) ─────
echo ""
echo "▶ [2/5] Syncing assets to s3://$ASSETS_S3_BUCKET/assets/ ..."

# Upload JS/CSS/font assets — content-hashed, cache 1 year
aws s3 sync dist/public/assets "s3://$ASSETS_S3_BUCKET/assets" \
  --region "$AWS_REGION" \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.br" \
  --exclude "*.gz" \
  --delete \
  --no-progress

# Upload brotli-compressed variants with correct Content-Encoding
echo "   Uploading brotli variants..."
for f in dist/public/assets/*.br dist/public/assets/**/*.br; do
  [ -f "$f" ] || continue
  base="${f%.br}"                         # strip .br suffix
  key="assets/${base#dist/public/assets/}" # S3 key without .br
  content_type="application/octet-stream"
  [[ "$base" == *.js ]]  && content_type="text/javascript"
  [[ "$base" == *.css ]] && content_type="text/css"
  aws s3 cp "$f" "s3://$ASSETS_S3_BUCKET/$key" \
    --region "$AWS_REGION" \
    --content-type "$content_type" \
    --content-encoding "br" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata-directive REPLACE \
    --no-progress 2>/dev/null || true
done

echo "   ✅ Assets synced"

# ── Step 3: Invalidate CloudFront cache for index.html / HTML routes ──────────
echo ""
echo "▶ [3/5] Invalidating CloudFront cache for HTML routes..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --region us-east-1 \
  --no-cli-pager \
  --output text \
  --query 'Invalidation.Id' \
  | xargs -I{} echo "   Invalidation ID: {}"
echo "   ✅ CloudFront invalidation submitted"

# ── Step 4: Package & deploy to Elastic Beanstalk ────────────────────────────
echo ""
echo "▶ [4/5] Packaging for Elastic Beanstalk..."

VERSION_LABEL="v$(date +%Y%m%d-%H%M%S)"
ZIP_NAME="perala-${VERSION_LABEL}.zip"
ZIP_PATH="/tmp/$ZIP_NAME"
EB_S3_BUCKET="${EB_S3_BUCKET_OVERRIDE:-elasticbeanstalk-${AWS_REGION}-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo 'unknown')}"

# Zip: server dist + package files (exclude full node_modules and frontend src)
zip -r "$ZIP_PATH" \
  dist/index.cjs \
  dist/index.js \
  package.json \
  Procfile \
  .ebextensions \
  --exclude "*.git*" \
  --exclude "node_modules/.cache/*" \
  -q

echo "   Package: $ZIP_NAME ($(du -sh "$ZIP_PATH" | cut -f1))"

# Upload deployment zip to S3
echo ""
echo "▶ [5/5] Deploying to Elastic Beanstalk ($EB_ENV_NAME)..."
if aws s3 cp "$ZIP_PATH" "s3://$EB_S3_BUCKET/$EB_APP_NAME/$ZIP_NAME" \
    --region "$AWS_REGION" --no-progress 2>/dev/null; then

  # Create EB application version
  aws elasticbeanstalk create-application-version \
    --application-name "$EB_APP_NAME" \
    --version-label "$VERSION_LABEL" \
    --source-bundle "S3Bucket=$EB_S3_BUCKET,S3Key=$EB_APP_NAME/$ZIP_NAME" \
    --region "$AWS_REGION" \
    --no-cli-pager \
    --auto-create-application \
    --output text > /dev/null

  # Deploy to environment
  aws elasticbeanstalk update-environment \
    --application-name "$EB_APP_NAME" \
    --environment-name "$EB_ENV_NAME" \
    --version-label "$VERSION_LABEL" \
    --region "$AWS_REGION" \
    --no-cli-pager \
    --output text > /dev/null

  echo "   ✅ EB deployment initiated: $VERSION_LABEL"
  echo "      Monitor at: https://${AWS_REGION}.console.aws.amazon.com/elasticbeanstalk"
else
  echo "   ⚠️  S3 upload failed — run manually with EB CLI: eb deploy"
fi

rm -f "$ZIP_PATH"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Deploy complete!"
echo ""
echo "  Static assets : $VITE_CDN_URL"
echo "  App (EB)      : check EB console for URL"
echo "  CloudFront    : cache invalidation in progress (~2 min)"
echo "═══════════════════════════════════════════════════════════"
echo ""
