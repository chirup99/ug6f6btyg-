/**
 * AWS Elastic Beanstalk Deployment Script
 * Target: perala-prod | Region: ap-south-1 (Mumbai)
 */

import {
  ElasticBeanstalkClient,
  CreateApplicationCommand,
  CreateApplicationVersionCommand,
  CreateEnvironmentCommand,
  UpdateEnvironmentCommand,
  DescribeEnvironmentsCommand,
  DescribeApplicationsCommand,
  TerminateEnvironmentCommand,
} from '@aws-sdk/client-elastic-beanstalk';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REGION = 'ap-south-1';
const APPLICATION_NAME = 'perala-prod';
const ENVIRONMENT_NAME = 'perala-prod-env';
const NODE_VERSION = '20';

const ebClient = new ElasticBeanstalkClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const stsClient = new STSClient({ region: REGION });

async function getAccountId(): Promise<string> {
  const res = await stsClient.send(new GetCallerIdentityCommand({}));
  return res.Account!;
}

async function ensureBucket(bucketName: string): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`   ✅ S3 bucket exists: ${bucketName}`);
  } catch {
    console.log(`   📦 Creating S3 bucket: ${bucketName}...`);
    await s3Client.send(new CreateBucketCommand({
      Bucket: bucketName,
      CreateBucketConfiguration: { LocationConstraint: REGION },
    }));
    console.log(`   ✅ Bucket created`);
  }
}

async function applicationExists(): Promise<boolean> {
  const res = await ebClient.send(new DescribeApplicationsCommand({ ApplicationNames: [APPLICATION_NAME] }));
  return (res.Applications?.length ?? 0) > 0;
}

async function getEnvironmentStatus(): Promise<{ exists: boolean; status?: string; health?: string; url?: string }> {
  try {
    const res = await ebClient.send(new DescribeEnvironmentsCommand({
      ApplicationName: APPLICATION_NAME,
      EnvironmentNames: [ENVIRONMENT_NAME],
      IncludeDeleted: false,
    }));
    const env = res.Environments?.[0];
    if (!env || env.Status === 'Terminated') return { exists: false };
    return { exists: true, status: env.Status, health: env.Health, url: env.CNAME };
  } catch {
    return { exists: false };
  }
}

function getEnvVars(): Record<string, string> {
  const required = [
    'NODE_ENV',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'AWS_COGNITO_USER_POOL_ID',
    'AWS_COGNITO_APP_CLIENT_ID',
    'VITE_COGNITO_USER_POOL_ID',
    'VITE_COGNITO_APP_CLIENT_ID',
    'VITE_COGNITO_DOMAIN',
    'VITE_COGNITO_REDIRECT_URI',
    'VITE_COGNITO_LOGOUT_URI',
    'VITE_GOOGLE_CLIENT_ID',
    'DATABASE_URL',
  ];

  const vars: Record<string, string> = { NODE_ENV: 'production', PORT: '8080' };
  for (const key of required) {
    const val = process.env[key];
    if (!val || key === 'NODE_ENV') continue;
    // Skip Replit-internal DATABASE_URL — user must set production DB in EB console
    if (key === 'DATABASE_URL' && (val.includes('@helium') || val.includes('localhost') || val.includes('127.0.0.1'))) {
      console.log('   ⚠️  Skipping Replit DATABASE_URL — set a production DB URL in EB console');
      continue;
    }
    vars[key] = val;
  }

  // Add optional vars
  const optional = [
    'ANGEL_ONE_CLIENT_CODE', 'ANGEL_ONE_API_KEY', 'ANGEL_ONE_PIN', 'ANGEL_ONE_TOTP_SECRET',
    'ZERODHA_API_KEY', 'ZERODHA_SECRET',
    'UPSTOX_API_KEY', 'UPSTOX_API_SECRET',
    'DHAN_API_KEY', 'DHAN_API_SECRET',
    'GOOGLE_CLIENT_SECRET',
    'PRODUCTION_DOMAIN',
  ];
  for (const key of optional) {
    const val = process.env[key];
    if (val) vars[key] = val;
  }

  return vars;
}

async function createDeploymentZip(versionLabel: string): Promise<string> {
  const deployDir = '/tmp/perala-prod-deploy';
  const zipPath = `/tmp/perala-prod-${versionLabel}.zip`;

  if (fs.existsSync(deployDir)) execSync(`rm -rf ${deployDir}`);
  fs.mkdirSync(deployDir, { recursive: true });

  // Copy required files (node_modules excluded — EB installs via predeploy hook)
  const items = ['dist', 'package.json', 'package-lock.json', 'Procfile', '.ebextensions', '.platform'];
  for (const item of items) {
    const src = path.join(process.cwd(), item);
    if (fs.existsSync(src)) {
      execSync(`cp -r "${src}" "${deployDir}/${item}"`);
      console.log(`   ✅ Included: ${item}`);
    }
  }

  console.log('   🗜️  Creating zip archive...');
  execSync(`cd ${deployDir} && zip -r ${zipPath} . -x "*.git*" -x "*.map" > /dev/null`);

  const sizeMb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
  console.log(`   ✅ Package created: ${sizeMb} MB`);

  execSync(`rm -rf ${deployDir}`);
  return zipPath;
}

async function deploy() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Perala → AWS Elastic Beanstalk Deploy      ║');
  console.log('║   App: perala-prod  |  Region: ap-south-1   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Validate build exists
  if (!fs.existsSync(path.join(process.cwd(), 'dist/index.js'))) {
    console.error('❌ dist/index.js not found. Run npm run build first.');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(process.cwd(), 'dist/public/index.html'))) {
    console.error('❌ dist/public/index.html not found. Run npm run build first.');
    process.exit(1);
  }

  // Get AWS account ID
  console.log('🔐 Verifying AWS credentials...');
  const accountId = await getAccountId();
  console.log(`   Account: ${accountId}`);
  console.log(`   Region: ${REGION}`);

  const S3_BUCKET = `elasticbeanstalk-${REGION}-${accountId}`;
  const versionLabel = `perala-prod-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

  // Ensure S3 bucket
  console.log('\n📦 Setting up S3 bucket...');
  await ensureBucket(S3_BUCKET);

  // Ensure EB application exists
  console.log('\n🏗️  Checking Elastic Beanstalk application...');
  const appExists = await applicationExists();
  if (!appExists) {
    console.log(`   Creating application: ${APPLICATION_NAME}...`);
    await ebClient.send(new CreateApplicationCommand({
      ApplicationName: APPLICATION_NAME,
      Description: 'Perala Trading Platform - Production',
    }));
    console.log(`   ✅ Application created`);
  } else {
    console.log(`   ✅ Application exists: ${APPLICATION_NAME}`);
  }

  // Build deployment package
  console.log('\n📁 Building deployment package...');
  const zipPath = await createDeploymentZip(versionLabel);

  // Upload to S3
  console.log('\n⬆️  Uploading to S3...');
  const s3Key = `${APPLICATION_NAME}/${versionLabel}.zip`;
  const zipBuffer = fs.readFileSync(zipPath);
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: zipBuffer,
  }));
  console.log(`   ✅ Uploaded to s3://${S3_BUCKET}/${s3Key}`);
  fs.unlinkSync(zipPath);

  // Create application version
  console.log('\n📝 Creating application version...');
  await ebClient.send(new CreateApplicationVersionCommand({
    ApplicationName: APPLICATION_NAME,
    VersionLabel: versionLabel,
    Description: `Deployed from Replit on ${new Date().toUTCString()}`,
    SourceBundle: { S3Bucket: S3_BUCKET, S3Key: s3Key },
    AutoCreateApplication: false,
  }));
  console.log(`   ✅ Version: ${versionLabel}`);

  // Deploy to environment
  console.log('\n🚀 Deploying to environment...');
  const envState = await getEnvironmentStatus();
  const envVars = getEnvVars();
  const ebEnvVars = Object.entries(envVars).map(([name, value]) => ({ Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: name, Value: value }));

  if (!envState.exists) {
    console.log(`   Creating new environment: ${ENVIRONMENT_NAME}...`);
    console.log(`   Platform: Node.js ${NODE_VERSION}`);

    await ebClient.send(new CreateEnvironmentCommand({
      ApplicationName: APPLICATION_NAME,
      EnvironmentName: ENVIRONMENT_NAME,
      Description: 'Perala Production Environment - Mumbai',
      SolutionStackName: `64bit Amazon Linux 2023 v6.9.0 running Node.js ${NODE_VERSION}`,
      OptionSettings: [
        ...ebEnvVars,
        { Namespace: 'aws:autoscaling:launchconfiguration', OptionName: 'InstanceType', Value: 't3.small' },
        { Namespace: 'aws:autoscaling:asg', OptionName: 'MinSize', Value: '1' },
        { Namespace: 'aws:autoscaling:asg', OptionName: 'MaxSize', Value: '2' },
        { Namespace: 'aws:elasticbeanstalk:environment', OptionName: 'EnvironmentType', Value: 'LoadBalanced' },
        { Namespace: 'aws:elasticbeanstalk:healthreporting:system', OptionName: 'SystemType', Value: 'enhanced' },
        { Namespace: 'aws:elasticbeanstalk:application', OptionName: 'Application Healthcheck URL', Value: '/health' },
      ],
      VersionLabel: versionLabel,
      Tier: { Name: 'WebServer', Type: 'Standard' },
    }));

    console.log('   ✅ Environment creation initiated!');
    console.log('   ⏳ Environment takes 5–10 minutes to become Ready.');
  } else {
    console.log(`   Updating existing environment: ${ENVIRONMENT_NAME} (${envState.status})...`);
    await ebClient.send(new UpdateEnvironmentCommand({
      ApplicationName: APPLICATION_NAME,
      EnvironmentName: ENVIRONMENT_NAME,
      VersionLabel: versionLabel,
      OptionSettings: ebEnvVars,
    }));
    console.log('   ✅ Deployment update initiated!');
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ✅ Deployment Submitted Successfully!      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  App:    ${APPLICATION_NAME.padEnd(36)}║`);
  console.log(`║  Env:    ${ENVIRONMENT_NAME.padEnd(36)}║`);
  console.log(`║  Vers:   ${versionLabel.slice(0, 36).padEnd(36)}║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Monitor: AWS Console → Elastic Beanstalk   ║');
  console.log('║  Region:  ap-south-1 (Mumbai)               ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  Note: Set DATABASE_URL in EB environment');
  console.log('   console to your production PostgreSQL URL.');
}

deploy().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message || err);
  process.exit(1);
});
