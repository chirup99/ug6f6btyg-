/**
 * AWS Elastic Beanstalk Deployment Script
 * Deploys the application to AWS Elastic Beanstalk
 */

import { ElasticBeanstalkClient, CreateApplicationVersionCommand, UpdateEnvironmentCommand, DescribeEnvironmentsCommand } from '@aws-sdk/client-elastic-beanstalk';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const APPLICATION_NAME = 'perala-ai';
const ENVIRONMENT_NAME = 'Peralai-env'; // Default EB environment name pattern
const S3_BUCKET = 'elasticbeanstalk-ap-south-1-' + process.env.AWS_ACCOUNT_ID || 'perala-ai-deployments';
const REGION = process.env.AWS_REGION || 'ap-south-1';

async function deploy() {
  console.log('🚀 Starting AWS Elastic Beanstalk deployment...');
  console.log(`   Application: ${APPLICATION_NAME}`);
  console.log(`   Region: ${REGION}`);

  const ebClient = new ElasticBeanstalkClient({ region: REGION });
  const s3Client = new S3Client({ region: REGION });

  // Step 1: Create deployment zip
  console.log('\n📦 Creating deployment package...');
  const versionLabel = `v${Date.now()}`;
  const zipFileName = `${APPLICATION_NAME}-${versionLabel}.zip`;
  
  // Create a deployment directory
  const deployDir = '/tmp/eb-deploy';
  if (fs.existsSync(deployDir)) {
    execSync(`rm -rf ${deployDir}`);
  }
  fs.mkdirSync(deployDir, { recursive: true });

  // Copy necessary files
  const filesToCopy = [
    'dist',
    'package.json',
    'package-lock.json',
    'Procfile',
    'node_modules'
  ];

  for (const file of filesToCopy) {
    const srcPath = path.join(process.cwd(), file);
    const destPath = path.join(deployDir, file);
    if (fs.existsSync(srcPath)) {
      console.log(`   Copying ${file}...`);
      execSync(`cp -r "${srcPath}" "${destPath}"`);
    }
  }

  // Create zip file
  const zipPath = `/tmp/${zipFileName}`;
  console.log('   Creating zip archive...');
  execSync(`cd ${deployDir} && zip -r ${zipPath} . -x "node_modules/.cache/*" -x "*.git*"`);

  const zipStats = fs.statSync(zipPath);
  console.log(`   ✅ Deployment package created: ${(zipStats.size / 1024 / 1024).toFixed(2)} MB`);

  // Step 2: Check existing environments
  console.log('\n🔍 Checking existing environments...');
  try {
    const envResponse = await ebClient.send(new DescribeEnvironmentsCommand({
      ApplicationName: APPLICATION_NAME
    }));
    
    if (envResponse.Environments && envResponse.Environments.length > 0) {
      console.log('   Found environments:');
      for (const env of envResponse.Environments) {
        console.log(`   - ${env.EnvironmentName}: ${env.Status} (${env.Health})`);
      }
    } else {
      console.log('   No environments found. You may need to create one first.');
    }
  } catch (error: any) {
    console.log(`   ⚠️ Could not fetch environments: ${error.message}`);
  }

  // Step 3: Upload to S3
  console.log('\n📤 Uploading deployment package to S3...');
  const s3Key = `${APPLICATION_NAME}/${zipFileName}`;
  
  try {
    const zipContent = fs.readFileSync(zipPath);
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: zipContent
    }));
    console.log(`   ✅ Uploaded to s3://${S3_BUCKET}/${s3Key}`);
  } catch (error: any) {
    console.log(`   ⚠️ S3 upload failed: ${error.message}`);
    console.log('   Creating deployment package locally instead...');
    const localZipPath = path.join(process.cwd(), zipFileName);
    execSync(`cp ${zipPath} ${localZipPath}`);
    console.log(`   ✅ Deployment package saved to: ${localZipPath}`);
    console.log('\n📋 Manual deployment instructions:');
    console.log('   1. Go to AWS Elastic Beanstalk Console');
    console.log(`   2. Select application: ${APPLICATION_NAME}`);
    console.log('   3. Click "Upload and Deploy"');
    console.log(`   4. Upload the file: ${zipFileName}`);
    return;
  }

  // Step 4: Create application version
  console.log('\n📝 Creating application version...');
  try {
    await ebClient.send(new CreateApplicationVersionCommand({
      ApplicationName: APPLICATION_NAME,
      VersionLabel: versionLabel,
      SourceBundle: {
        S3Bucket: S3_BUCKET,
        S3Key: s3Key
      },
      AutoCreateApplication: true
    }));
    console.log(`   ✅ Created version: ${versionLabel}`);
  } catch (error: any) {
    console.error(`   ❌ Failed to create version: ${error.message}`);
    return;
  }

  // Step 5: Update environment
  console.log('\n🔄 Deploying to environment...');
  try {
    await ebClient.send(new UpdateEnvironmentCommand({
      ApplicationName: APPLICATION_NAME,
      EnvironmentName: ENVIRONMENT_NAME,
      VersionLabel: versionLabel
    }));
    console.log(`   ✅ Deployment initiated to ${ENVIRONMENT_NAME}`);
    console.log('\n✅ Deployment started successfully!');
    console.log('   Monitor progress in AWS Elastic Beanstalk Console');
  } catch (error: any) {
    console.error(`   ❌ Failed to deploy: ${error.message}`);
    console.log('\n📋 The application version was created. To deploy manually:');
    console.log('   1. Go to AWS Elastic Beanstalk Console');
    console.log(`   2. Select application: ${APPLICATION_NAME}`);
    console.log(`   3. Deploy version: ${versionLabel}`);
  }

  // Cleanup
  execSync(`rm -rf ${deployDir} ${zipPath}`);
}

deploy().catch(console.error);
