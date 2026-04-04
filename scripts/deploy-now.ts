/**
 * Perala Full Deployment Script
 * ─────────────────────────────
 * 1. Create S3 assets bucket + CloudFront distribution (if needed)
 * 2. Build frontend with VITE_CDN_URL baked in
 * 3. Sync /assets/* to S3 with 1-year cache
 * 4. Invalidate CloudFront cache
 * 5. Create deployment ZIP per the Perala_AWS_Deployment_Guide
 * 6. Upload ZIP to EB S3 bucket → deploy to perala-prod
 */

import 'dotenv/config';
import {
  CloudFrontClient,
  CreateDistributionCommand,
  ListDistributionsCommand,
  CreateOriginAccessControlCommand,
  GetDistributionCommand,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  ElasticBeanstalkClient,
  CreateApplicationVersionCommand,
  UpdateEnvironmentCommand,
  DescribeEnvironmentsCommand,
} from '@aws-sdk/client-elastic-beanstalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ── Config ────────────────────────────────────────────────────────────────────
const REGION           = 'ap-south-1';
const ASSETS_BUCKET    = 'perala-static-assets';
const EB_APP           = 'TradingMaster';
const EB_ENV           = 'perala-prod';
const EB_S3_BUCKET     = 'elasticbeanstalk-ap-south-1-323726447850';
const EB_DOMAIN        = 'perala-prod.eba-uhnreree.ap-south-1.elasticbeanstalk.com';
const ACCOUNT_ID       = '323726447850';
const DIST_COMMENT     = 'perala-cdn-mumbai';
const PROJECT_ROOT     = process.cwd();

// AWS Clients
const s3  = new S3Client({ region: REGION });
const cf  = new CloudFrontClient({ region: 'us-east-1' });
const eb  = new ElasticBeanstalkClient({ region: REGION });
const s3Eb = new S3Client({ region: REGION });

// ── Helpers ───────────────────────────────────────────────────────────────────
const log  = (msg: string) => console.log(`\n${msg}`);
const ok   = (msg: string) => console.log(`   ✅ ${msg}`);
const warn = (msg: string) => console.log(`   ⚠️  ${msg}`);
const step = (n: number, total: number, msg: string) =>
  console.log(`\n${'─'.repeat(60)}\n  [${n}/${total}] ${msg}\n${'─'.repeat(60)}`);

async function bucketExists(bucket: string, client = s3): Promise<boolean> {
  try { await client.send(new HeadBucketCommand({ Bucket: bucket })); return true; }
  catch { return false; }
}

async function findDistribution(): Promise<{ id: string; domain: string } | null> {
  const res = await cf.send(new ListDistributionsCommand({ MaxItems: '100' }));
  const items = res.DistributionList?.Items ?? [];
  for (const d of items) {
    if (d.Comment === DIST_COMMENT) return { id: d.Id!, domain: d.DomainName! };
  }
  return null;
}

function run(cmd: string, opts: { env?: NodeJS.ProcessEnv; label?: string } = {}) {
  const label = opts.label ?? cmd.slice(0, 60);
  console.log(`   $ ${label}`);
  execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, ...opts.env },
    cwd: PROJECT_ROOT,
  });
}

// ── Step 1: Ensure S3 bucket exists ──────────────────────────────────────────
async function ensureAssetsBucket() {
  if (await bucketExists(ASSETS_BUCKET)) {
    ok(`S3 bucket '${ASSETS_BUCKET}' already exists`);
    return;
  }
  log(`Creating S3 bucket: ${ASSETS_BUCKET}`);
  await s3.send(new CreateBucketCommand({
    Bucket: ASSETS_BUCKET,
    CreateBucketConfiguration: { LocationConstraint: REGION },
  }));
  await s3.send(new PutPublicAccessBlockCommand({
    Bucket: ASSETS_BUCKET,
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true, IgnorePublicAcls: true,
      BlockPublicPolicy: true, RestrictPublicBuckets: true,
    },
  }));
  ok(`Bucket created and locked down (CloudFront OAC access only)`);
}

// ── Step 2: Create CloudFront distribution ────────────────────────────────────
async function ensureCloudFront(): Promise<{ id: string; domain: string }> {
  const existing = await findDistribution();
  if (existing) {
    ok(`CloudFront distribution exists: https://${existing.domain}`);
    return existing;
  }

  log(`Creating CloudFront distribution (Mumbai edge, PriceClass_200)...`);

  // Create OAC (may already exist)
  let oacId = '';
  try {
    const oacRes = await cf.send(new CreateOriginAccessControlCommand({
      OriginAccessControlConfig: {
        Name: 'perala-s3-oac',
        Description: 'OAC for Perala static assets',
        SigningProtocol: 'sigv4',
        SigningBehavior: 'always',
        OriginAccessControlOriginType: 's3',
      },
    }));
    oacId = oacRes.OriginAccessControl?.Id ?? '';
    ok(`OAC created: ${oacId}`);
  } catch (e: any) {
    if (e.name !== 'OriginAccessControlAlreadyExists') throw e;
    warn('OAC already exists — will attach to distribution');
  }

  const res = await cf.send(new CreateDistributionCommand({
    DistributionConfig: {
      Comment: DIST_COMMENT,
      Enabled: true,
      HttpVersion: 'http2and3',
      PriceClass: 'PriceClass_200',
      IsIPV6Enabled: true,
      CallerReference: `perala-${Date.now()}`,

      Origins: {
        Quantity: 2,
        Items: [
          {
            Id: 's3-assets',
            DomainName: `${ASSETS_BUCKET}.s3.${REGION}.amazonaws.com`,
            S3OriginConfig: { OriginAccessIdentity: '' },
            ...(oacId ? { OriginAccessControlId: oacId } : {}),
          },
          {
            Id: 'eb-origin',
            DomainName: EB_DOMAIN,
            CustomOriginConfig: {
              HTTPPort: 80,
              HTTPSPort: 443,
              OriginProtocolPolicy: 'https-only',
              OriginSSLProtocols: { Quantity: 1, Items: ['TLSv1.2'] },
              OriginReadTimeout: 60,
              OriginKeepaliveTimeout: 60,
            },
          },
        ],
      },

      // Default: EB origin, no-cache (API + index.html)
      DefaultCacheBehavior: {
        TargetOriginId: 'eb-origin',
        ViewerProtocolPolicy: 'redirect-to-https',
        Compress: true,
        AllowedMethods: {
          Quantity: 7,
          Items: ['GET','HEAD','OPTIONS','PUT','PATCH','POST','DELETE'],
          CachedMethods: { Quantity: 2, Items: ['GET','HEAD'] },
        },
        CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled (AWS managed)
        OriginRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac', // AllViewerExceptHostHeader
      },

      CacheBehaviors: {
        Quantity: 3,
        Items: [
          // /assets/* → S3, cache 1 year
          {
            PathPattern: '/assets/*',
            TargetOriginId: 's3-assets',
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
            AllowedMethods: { Quantity: 2, Items: ['GET','HEAD'], CachedMethods: { Quantity: 2, Items: ['GET','HEAD'] } },
            CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized (1yr)
          },
          // /uploads/* → EB, cache 7 days
          {
            PathPattern: '/uploads/*',
            TargetOriginId: 'eb-origin',
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
            AllowedMethods: { Quantity: 2, Items: ['GET','HEAD'], CachedMethods: { Quantity: 2, Items: ['GET','HEAD'] } },
            CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
          },
          // /api/* → EB, no cache
          {
            PathPattern: '/api/*',
            TargetOriginId: 'eb-origin',
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
            AllowedMethods: { Quantity: 7, Items: ['GET','HEAD','OPTIONS','PUT','PATCH','POST','DELETE'], CachedMethods: { Quantity: 2, Items: ['GET','HEAD'] } },
            CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
            OriginRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac',
          },
        ],
      },

      // SPA: serve index.html for unknown paths
      CustomErrorResponses: {
        Quantity: 1,
        Items: [{ ErrorCode: 403, ResponseCode: '200', ResponsePagePath: '/', ErrorCachingMinTTL: 0 }],
      },
    },
  }));

  const dist = res.Distribution!;
  ok(`Distribution created: ${dist.Id}`);
  ok(`Domain: https://${dist.DomainName}`);
  console.log(`   Status: ${dist.Status} (deploys globally in ~10-15 min)`);

  // Attach S3 bucket policy to allow CloudFront OAC
  const distributionArn = `arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${dist.Id}`;
  const policy = {
    Version: '2012-10-17',
    Statement: [{
      Sid: 'AllowCloudFrontServicePrincipal',
      Effect: 'Allow',
      Principal: { Service: 'cloudfront.amazonaws.com' },
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${ASSETS_BUCKET}/*`,
      Condition: { StringEquals: { 'AWS:SourceArn': distributionArn } },
    }],
  };
  await s3.send(new PutBucketPolicyCommand({ Bucket: ASSETS_BUCKET, Policy: JSON.stringify(policy) }));
  ok(`S3 bucket policy attached for CloudFront access`);

  return { id: dist.Id!, domain: dist.DomainName! };
}

// ── Step 3: Build frontend with VITE_CDN_URL ──────────────────────────────────
function buildFrontend(cdnUrl: string) {
  log(`Building frontend (VITE_CDN_URL=${cdnUrl})...`);
  run('npm run build', { env: { VITE_CDN_URL: cdnUrl }, label: 'npm run build' });
  ok(`Build complete → dist/public/ + dist/index.js`);
}

// ── Step 4: Sync assets to S3 ─────────────────────────────────────────────────
async function syncAssetsToS3() {
  log(`Syncing dist/public/assets → s3://${ASSETS_BUCKET}/assets/`);
  const assetsDir = path.join(PROJECT_ROOT, 'dist', 'public', 'assets');
  if (!fs.existsSync(assetsDir)) { warn('No assets dir found, skipping S3 sync'); return; }

  let uploaded = 0;
  const files = walkDir(assetsDir);

  for (const filePath of files) {
    const key = 'assets/' + path.relative(assetsDir, filePath).replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();
    const isBrotli = filePath.endsWith('.br');
    const isGzip   = filePath.endsWith('.gz');

    if (isBrotli || isGzip) continue; // skip pre-compressed — CloudFront compresses on the fly

    const contentType = getContentType(ext);
    const body = fs.readFileSync(filePath);

    await s3.send(new PutObjectCommand({
      Bucket: ASSETS_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    uploaded++;
    if (uploaded % 10 === 0) process.stdout.write(`   Uploaded ${uploaded} files...\r`);
  }
  ok(`Synced ${uploaded} asset files to S3`);
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full));
    else results.push(full);
  }
  return results;
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    '.js': 'text/javascript', '.css': 'text/css',
    '.html': 'text/html', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.ttf': 'font/ttf', '.webp': 'image/webp',
    '.map': 'application/json',
  };
  return map[ext] ?? 'application/octet-stream';
}

// ── Step 5: Invalidate CloudFront cache ────────────────────────────────────────
async function invalidateCache(distId: string) {
  log(`Invalidating CloudFront cache...`);
  await cf.send(new CreateInvalidationCommand({
    DistributionId: distId,
    InvalidationBatch: {
      CallerReference: `deploy-${Date.now()}`,
      Paths: { Quantity: 2, Items: ['/', '/index.html'] },
    },
  }));
  ok(`Cache invalidated (HTML routes)`);
}

// ── Step 6: Create .env for deployment ZIP ───────────────────────────────────
function createDeployEnv(cfDomain: string, cfDistId: string) {
  const lines = [
    `NODE_ENV=production`,
    `PORT=8081`,
    `AWS_REGION=${REGION}`,
    `AWS_S3_BUCKET=${process.env.AWS_S3_BUCKET ?? 'neofeed-profile-images'}`,
    `AWS_COGNITO_USER_POOL_ID=${process.env.AWS_COGNITO_USER_POOL_ID ?? ''}`,
    `AWS_COGNITO_APP_CLIENT_ID=${process.env.AWS_COGNITO_APP_CLIENT_ID ?? ''}`,
    `VITE_COGNITO_USER_POOL_ID=${process.env.VITE_COGNITO_USER_POOL_ID ?? ''}`,
    `VITE_COGNITO_APP_CLIENT_ID=${process.env.VITE_COGNITO_APP_CLIENT_ID ?? ''}`,
    `VITE_COGNITO_DOMAIN=${process.env.VITE_COGNITO_DOMAIN ?? ''}`,
    `VITE_COGNITO_REDIRECT_URI=${process.env.VITE_COGNITO_REDIRECT_URI ?? ''}`,
    `VITE_COGNITO_LOGOUT_URI=${process.env.VITE_COGNITO_LOGOUT_URI ?? ''}`,
    `ANGEL_ONE_CLIENT_CODE=${process.env.ANGEL_ONE_CLIENT_CODE ?? ''}`,
    `ANGEL_ONE_PIN=${process.env.ANGEL_ONE_PIN ?? ''}`,
    `ANGEL_ONE_API_KEY=${process.env.ANGEL_ONE_API_KEY ?? ''}`,
    `ANGEL_ONE_TOTP_SECRET=${process.env.ANGEL_ONE_TOTP_SECRET ?? ''}`,
    `PRODUCTION_DOMAIN=${process.env.PRODUCTION_DOMAIN ?? 'perala.in'}`,
    `VITE_CDN_URL=https://${cfDomain}/`,
    `CLOUDFRONT_DISTRIBUTION_ID=${cfDistId}`,
    `ASSETS_S3_BUCKET=${ASSETS_BUCKET}`,
    `SESSION_SECRET=${process.env.SESSION_SECRET ?? crypto.randomBytes(32).toString('hex')}`,
    `DATABASE_URL=${process.env.DATABASE_URL ?? ''}`,
    `GOOGLE_GENERATIVE_AI_API_KEY=${process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ''}`,
    `OPENAI_API_KEY=${process.env.OPENAI_API_KEY ?? ''}`,
  ].filter(l => !l.endsWith('='));

  const envContent = lines.join('\n') + '\n';
  fs.writeFileSync(path.join(PROJECT_ROOT, '.env.deploy'), envContent);
  ok(`.env.deploy created with ${lines.length} variables`);
}

// ── Step 7: Create deployment ZIP ─────────────────────────────────────────────
function createDeploymentZip(): string {
  log(`Creating deployment ZIP (per Perala_AWS_Deployment_Guide)...`);

  const versionLabel = `v${new Date().toISOString().replace(/[-:T]/g,'.').slice(0,16)}`;
  const zipName = `perala-${versionLabel}.zip`;
  const zipPath = `/tmp/${zipName}`;

  // Verify required files exist
  const required = ['dist/index.js', 'dist/public/index.html', 'Procfile', 'package.json'];
  for (const f of required) {
    if (!fs.existsSync(path.join(PROJECT_ROOT, f))) {
      throw new Error(`Required file missing: ${f} — did the build succeed?`);
    }
  }

  // Create ZIP per the guide: dist/ server/ shared/ .ebextensions/ Procfile .env package.json package-lock.json
  const cmd = [
    `zip -r ${zipPath}`,
    `dist/`,
    `server/`,
    `shared/`,
    `.ebextensions/`,
    `Procfile`,
    `.env.deploy`,
    `package.json`,
    `package-lock.json`,
    `--exclude "node_modules/*"`,
    `--exclude "*.git*"`,
    `--exclude "*.cache*"`,
    `--exclude "dist/public/assets/*.br"`,
    `--exclude "dist/public/assets/*.gz"`,
    `-q`,
  ].join(' ');

  run(cmd, { label: `zip -r ${zipName} dist/ server/ shared/ .ebextensions/ ...` });

  // Rename .env.deploy to .env inside the zip
  run(`zip ${zipPath} .env.deploy`, { label: 'Adding .env to zip' });

  const stats = fs.statSync(zipPath);
  ok(`ZIP created: ${zipName} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

  // Quick sanity check
  const verify = execSync(`unzip -l ${zipPath} | grep -E '(dist/index|Procfile|package.json|.env.deploy)'`).toString();
  console.log('   Verified contents:');
  verify.split('\n').filter(Boolean).forEach(l => console.log(`     ${l.trim()}`));

  return zipPath;
}

// ── Step 8: Upload to S3 and deploy to EB ────────────────────────────────────
async function deployToEB(zipPath: string): Promise<string> {
  const zipName = path.basename(zipPath);
  const versionLabel = zipName.replace('perala-', '').replace('.zip', '');
  const s3Key = `TradingMaster/${zipName}`;

  log(`Uploading ZIP to s3://${EB_S3_BUCKET}/${s3Key}...`);
  const zipBody = fs.readFileSync(zipPath);
  await s3Eb.send(new PutObjectCommand({ Bucket: EB_S3_BUCKET, Key: s3Key, Body: zipBody }));
  ok(`ZIP uploaded`);

  log(`Creating EB application version: ${versionLabel}...`);
  await eb.send(new CreateApplicationVersionCommand({
    ApplicationName: EB_APP,
    VersionLabel: versionLabel,
    SourceBundle: { S3Bucket: EB_S3_BUCKET, S3Key: s3Key },
    AutoCreateApplication: false,
  }));
  ok(`Application version created`);

  log(`Deploying ${versionLabel} to ${EB_ENV}...`);
  await eb.send(new UpdateEnvironmentCommand({
    ApplicationName: EB_APP,
    EnvironmentName: EB_ENV,
    VersionLabel: versionLabel,
  }));
  ok(`Deployment initiated!`);

  return versionLabel;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const TOTAL = 8;
  console.log('\n' + '═'.repeat(60));
  console.log('  Perala Full Deploy — CloudFront + Elastic Beanstalk');
  console.log('  Region: ap-south-1  |  Env: perala-prod');
  console.log('═'.repeat(60));

  step(1, TOTAL, 'Ensure S3 assets bucket');
  await ensureAssetsBucket();

  step(2, TOTAL, 'Ensure CloudFront distribution');
  let distId = '';
  let cfDomain = '';
  let cdnUrl = '';
  try {
    const cf = await ensureCloudFront();
    distId  = cf.id;
    cfDomain = cf.domain;
    cdnUrl   = `https://${cfDomain}/`;
  } catch (e: any) {
    warn(`CloudFront skipped: ${e.message}`);
    warn('Your AWS account needs CloudFront verification — contact AWS Support.');
    warn('Continuing deployment without CDN (EB will serve all assets directly).');
    cdnUrl = '';
  }

  step(3, TOTAL, 'Build frontend');
  buildFrontend(cdnUrl);

  step(4, TOTAL, 'Sync assets to S3');
  if (cdnUrl) {
    await syncAssetsToS3();
  } else {
    warn('Skipping S3 asset sync — CloudFront not active yet');
  }

  step(5, TOTAL, 'Invalidate CloudFront HTML cache');
  if (distId) {
    await invalidateCache(distId);
  } else {
    warn('Skipping invalidation — no CloudFront distribution yet');
  }

  step(6, TOTAL, 'Create .env for deployment');
  createDeployEnv(cfDomain, distId);

  step(7, TOTAL, 'Create deployment ZIP');
  const zipPath = createDeploymentZip();

  step(8, TOTAL, 'Deploy to Elastic Beanstalk (perala-prod)');
  const version = await deployToEB(zipPath);

  // Cleanup temp files
  fs.unlinkSync(zipPath);
  if (fs.existsSync(path.join(PROJECT_ROOT, '.env.deploy'))) {
    fs.unlinkSync(path.join(PROJECT_ROOT, '.env.deploy'));
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ DEPLOYMENT COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`\n  Version      : ${version}`);
  console.log(`  CDN URL      : ${cdnUrl}`);
  console.log(`  EB Env       : ${EB_ENV} (perala-prod.eba-uhnreree.ap-south-1.elasticbeanstalk.com)`);
  console.log(`  CloudFront   : https://${cfDomain}`);
  console.log(`  Dist ID      : ${distId}`);
  console.log('\n  Monitor EB health:');
  console.log(`  https://ap-south-1.console.aws.amazon.com/elasticbeanstalk/home?region=ap-south-1#/environment/health?applicationName=${EB_APP}&environmentId=`);
  console.log('\n  ⚠️  CloudFront takes 10-15 min to propagate globally.');
  console.log('     Assets are cached at Mumbai edge after first request.');
  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n❌ Deployment failed:', err.message ?? err);
  process.exit(1);
});
