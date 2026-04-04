/**
 * CloudFront CDN Setup for Perala (ap-south-1 / Mumbai)
 *
 * Architecture:
 *   CloudFront → /assets/*  → S3 bucket  (cached 1 year, content-hashed)
 *   CloudFront → /uploads/* → S3 images  (cached 7 days)
 *   CloudFront → /api/*     → EB origin  (no cache, pass-through)
 *   CloudFront → /*         → EB origin  (no cache, serves index.html)
 *
 * Run once to create the distribution, then save the outputs as env vars.
 */

import {
  CloudFrontClient,
  CreateDistributionCommand,
  GetDistributionCommand,
  ListDistributionsCommand,
  CreateOriginAccessControlCommand,
  type OriginAccessControl,
} from "@aws-sdk/client-cloudfront";
import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
  PutPublicAccessBlockCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const REGION = "ap-south-1";
const ASSETS_BUCKET = "perala-static-assets";
const EB_DOMAIN = process.env.EB_DOMAIN || ""; // e.g. Peralai-env.ap-south-1.elasticbeanstalk.com

const s3 = new S3Client({ region: REGION });
const cf = new CloudFrontClient({ region: "us-east-1" }); // CloudFront is always us-east-1

// ─── Helpers ────────────────────────────────────────────────────────────────

function callerRef() {
  return `perala-${Date.now()}`;
}

async function bucketExists(bucket: string): Promise<boolean> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}

async function findExistingDistribution(comment: string): Promise<string | null> {
  try {
    const res = await cf.send(new ListDistributionsCommand({ MaxItems: "100" }));
    const items = res.DistributionList?.Items || [];
    for (const d of items) {
      if (d.Comment === comment) {
        console.log(`   Found existing distribution: ${d.Id} → ${d.DomainName}`);
        return d.Id ?? null;
      }
    }
  } catch (e: any) {
    console.log(`   ⚠️ Could not list distributions: ${e.message}`);
  }
  return null;
}

// ─── Step 1: Create S3 bucket for static assets ─────────────────────────────

async function createAssetsBucket() {
  console.log(`\n📦 Setting up S3 bucket: ${ASSETS_BUCKET}`);

  if (await bucketExists(ASSETS_BUCKET)) {
    console.log("   ✅ Bucket already exists, skipping creation");
  } else {
    await s3.send(
      new CreateBucketCommand({
        Bucket: ASSETS_BUCKET,
        CreateBucketConfiguration: { LocationConstraint: REGION },
      })
    );
    console.log("   ✅ Bucket created");
  }

  // Block all public access — CloudFront uses OAC
  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: ASSETS_BUCKET,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      },
    })
  );
  console.log("   ✅ Public access blocked (CloudFront OAC will handle access)");

  // CORS for direct uploads from browser (optional)
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: ASSETS_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: ["https://perala.in", "https://www.perala.in"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 86400,
          },
        ],
      },
    })
  );
  console.log("   ✅ CORS configured");
}

// ─── Step 2: Create Origin Access Control ───────────────────────────────────

async function createOAC(): Promise<string> {
  console.log("\n🔐 Creating Origin Access Control (OAC)...");
  try {
    const res = await cf.send(
      new CreateOriginAccessControlCommand({
        OriginAccessControlConfig: {
          Name: "perala-s3-oac",
          Description: "OAC for Perala static assets S3 bucket",
          SigningProtocol: "sigv4",
          SigningBehavior: "always",
          OriginAccessControlOriginType: "s3",
        },
      })
    );
    const oacId = res.OriginAccessControl?.Id!;
    console.log(`   ✅ OAC created: ${oacId}`);
    return oacId;
  } catch (e: any) {
    if (e.name === "OriginAccessControlAlreadyExists") {
      console.log("   ✅ OAC already exists");
      return "EXISTING";
    }
    throw e;
  }
}

// ─── Step 3: Create CloudFront Distribution ──────────────────────────────────

async function createDistribution(oacId: string) {
  const DIST_COMMENT = "perala-cdn-mumbai";

  console.log("\n☁️  Creating CloudFront distribution...");

  const existing = await findExistingDistribution(DIST_COMMENT);
  if (existing) {
    const dist = await cf.send(new GetDistributionCommand({ Id: existing }));
    const domain = dist.Distribution?.DomainName!;
    console.log(`   ✅ Distribution already exists: https://${domain}`);
    return { distributionId: existing, domainName: domain };
  }

  if (!EB_DOMAIN) {
    throw new Error(
      "EB_DOMAIN env var is required. Set it to your EB environment domain, e.g.:\n" +
        "  EB_DOMAIN=Peralai-env.ap-south-1.elasticbeanstalk.com npx tsx scripts/setup-cloudfront.ts"
    );
  }

  const s3OriginDomain = `${ASSETS_BUCKET}.s3.${REGION}.amazonaws.com`;
  const ebOriginDomain = EB_DOMAIN;

  const res = await cf.send(
    new CreateDistributionCommand({
      DistributionConfig: {
        Comment: DIST_COMMENT,
        Enabled: true,
        HttpVersion: "http2and3",
        PriceClass: "PriceClass_200", // Includes Mumbai edge locations
        IsIPV6Enabled: true,

        // ── Origins ──────────────────────────────────────────────────────────
        Origins: {
          Quantity: 2,
          Items: [
            {
              Id: "s3-assets",
              DomainName: s3OriginDomain,
              S3OriginConfig: { OriginAccessIdentity: "" }, // Required empty string with OAC
              OriginAccessControlId: oacId === "EXISTING" ? "" : oacId,
            },
            {
              Id: "eb-origin",
              DomainName: ebOriginDomain,
              CustomOriginConfig: {
                HTTPPort: 80,
                HTTPSPort: 443,
                OriginProtocolPolicy: "https-only",
                OriginSSLProtocols: { Quantity: 1, Items: ["TLSv1.2"] },
                OriginReadTimeout: 60,
                OriginKeepaliveTimeout: 60,
              },
            },
          ],
        },

        // ── Default cache behaviour → EB (index.html + API) ─────────────────
        DefaultCacheBehavior: {
          TargetOriginId: "eb-origin",
          ViewerProtocolPolicy: "redirect-to-https",
          Compress: true,
          AllowedMethods: {
            Quantity: 7,
            Items: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
            CachedMethods: { Quantity: 2, Items: ["GET", "HEAD"] },
          },
          CachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad", // CachingDisabled (AWS managed)
          OriginRequestPolicyId: "b689b0a8-53d0-40ab-baf2-68738e2966ac", // AllViewerExceptHostHeader
          ResponseHeadersPolicyId: "67f7725c-6f97-4210-82d7-5512b31e9d03", // SecurityHeadersPolicy
        },

        // ── Path-specific behaviours ─────────────────────────────────────────
        CacheBehaviors: {
          Quantity: 3,
          Items: [
            // /assets/* → S3, cache 1 year (content-hashed filenames)
            {
              PathPattern: "/assets/*",
              TargetOriginId: "s3-assets",
              ViewerProtocolPolicy: "redirect-to-https",
              Compress: true,
              AllowedMethods: {
                Quantity: 2,
                Items: ["GET", "HEAD"],
                CachedMethods: { Quantity: 2, Items: ["GET", "HEAD"] },
              },
              // Managed cache policy: CachingOptimized (1 year default, gzip+br)
              CachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
              ResponseHeadersPolicyId: "67f7725c-6f97-4210-82d7-5512b31e9d03",
            },

            // /uploads/* → EB, cache 7 days (profile images served by Express)
            {
              PathPattern: "/uploads/*",
              TargetOriginId: "eb-origin",
              ViewerProtocolPolicy: "redirect-to-https",
              Compress: true,
              AllowedMethods: {
                Quantity: 2,
                Items: ["GET", "HEAD"],
                CachedMethods: { Quantity: 2, Items: ["GET", "HEAD"] },
              },
              // Managed cache policy: CachingOptimized (1 year default, gzip+br)
              CachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
            },

            // /api/* → EB, never cache
            {
              PathPattern: "/api/*",
              TargetOriginId: "eb-origin",
              ViewerProtocolPolicy: "redirect-to-https",
              Compress: true,
              AllowedMethods: {
                Quantity: 7,
                Items: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
                CachedMethods: { Quantity: 2, Items: ["GET", "HEAD"] },
              },
              CachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad", // CachingDisabled
              OriginRequestPolicyId: "b689b0a8-53d0-40ab-baf2-68738e2966ac",
            },
          ],
        },

        CallerReference: callerRef(),

        // Serve index.html for SPA routing (404 → 200 with index.html)
        CustomErrorResponses: {
          Quantity: 1,
          Items: [
            {
              ErrorCode: 403,
              ResponseCode: "200",
              ResponsePagePath: "/",
              ErrorCachingMinTTL: 0,
            },
          ],
        },
      },
    })
  );

  const dist = res.Distribution!;
  console.log(`   ✅ Distribution created!`);
  console.log(`   ID:     ${dist.Id}`);
  console.log(`   Domain: https://${dist.DomainName}`);
  console.log(`   Status: ${dist.Status} (takes ~10-15 min to deploy globally)`);

  return { distributionId: dist.Id!, domainName: dist.DomainName! };
}

// ─── Step 4: Attach S3 bucket policy to allow CloudFront OAC ────────────────

async function attachBucketPolicy(distributionArn: string) {
  console.log("\n📋 Attaching S3 bucket policy for CloudFront OAC...");

  // Get AWS account ID from env or derive from credentials
  const accountId = process.env.AWS_ACCOUNT_ID || "YOUR_ACCOUNT_ID";

  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowCloudFrontServicePrincipal",
        Effect: "Allow",
        Principal: { Service: "cloudfront.amazonaws.com" },
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${ASSETS_BUCKET}/*`,
        Condition: {
          StringEquals: {
            "AWS:SourceArn": distributionArn,
          },
        },
      },
    ],
  };

  if (accountId === "YOUR_ACCOUNT_ID") {
    console.log("   ⚠️  AWS_ACCOUNT_ID not set — printing bucket policy for manual application:");
    console.log(JSON.stringify(policy, null, 2));
    console.log(
      "\n   Apply this policy in AWS Console → S3 → perala-static-assets → Permissions → Bucket Policy"
    );
    return;
  }

  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: ASSETS_BUCKET,
      Policy: JSON.stringify(policy),
    })
  );
  console.log("   ✅ Bucket policy applied");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Perala CloudFront CDN Setup (ap-south-1)");
  console.log("═══════════════════════════════════════════════\n");

  await createAssetsBucket();
  const oacId = await createOAC();
  const { distributionId, domainName } = await createDistribution(oacId);

  const distributionArn = `arn:aws:cloudfront::${process.env.AWS_ACCOUNT_ID || "YOUR_ACCOUNT_ID"}:distribution/${distributionId}`;
  await attachBucketPolicy(distributionArn);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✅ Setup complete! Save these values:");
  console.log("═══════════════════════════════════════════════");
  console.log(`\n  CLOUDFRONT_DISTRIBUTION_ID=${distributionId}`);
  console.log(`  CLOUDFRONT_DOMAIN=https://${domainName}`);
  console.log(`  VITE_CDN_URL=https://${domainName}/`);
  console.log(`  ASSETS_S3_BUCKET=${ASSETS_BUCKET}`);
  console.log(`\n  Add these to your EB environment variables and .env`);
  console.log("\n  Next steps:");
  console.log("  1. Wait 10-15 min for CloudFront to deploy globally");
  console.log("  2. Run: bash scripts/deploy-cloudfront.sh");
  console.log("  3. Point your domain's CNAME to the CloudFront domain above");
  console.log("═══════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
