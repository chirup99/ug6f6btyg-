import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { 
  ElasticBeanstalkClient, 
  CreateApplicationCommand,
  CreateApplicationVersionCommand, 
  CreateEnvironmentCommand,
  DescribeEnvironmentsCommand,
  UpdateEnvironmentCommand,
  DescribeApplicationsCommand
} from '@aws-sdk/client-elastic-beanstalk';
import fs from 'fs';
import path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';
const APPLICATION_NAME = 'trading-platform';
const ENVIRONMENT_NAME = 'trading-platform-prod';
const S3_BUCKET = 'trading-platform-deployments-' + Date.now();
const ZIP_FILE_PATH = './deployment.zip';
const VERSION_LABEL = `v-${Date.now()}`;

const s3 = new S3Client({ region: AWS_REGION });
const eb = new ElasticBeanstalkClient({ region: AWS_REGION });

async function ensureBucketExists(bucketName: string) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ S3 bucket ${bucketName} exists`);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`📦 Creating S3 bucket ${bucketName}...`);
      await s3.send(new CreateBucketCommand({ 
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: AWS_REGION
        }
      }));
      console.log(`✅ S3 bucket created`);
    } else {
      throw error;
    }
  }
}

async function checkApplicationExists(): Promise<boolean> {
  try {
    const response = await eb.send(new DescribeApplicationsCommand({
      ApplicationNames: [APPLICATION_NAME]
    }));
    return (response.Applications?.length || 0) > 0;
  } catch {
    return false;
  }
}

async function checkEnvironmentExists(): Promise<{ exists: boolean; status?: string }> {
  try {
    const response = await eb.send(new DescribeEnvironmentsCommand({
      ApplicationName: APPLICATION_NAME,
      EnvironmentNames: [ENVIRONMENT_NAME]
    }));
    const env = response.Environments?.[0];
    if (env && env.Status !== 'Terminated') {
      return { exists: true, status: env.Status };
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

async function deploy() {
  console.log('🚀 Starting AWS Elastic Beanstalk Deployment\n');
  console.log(`   Region: ${AWS_REGION}`);
  console.log(`   Application: ${APPLICATION_NAME}`);
  console.log(`   Environment: ${ENVIRONMENT_NAME}`);
  console.log(`   Version: ${VERSION_LABEL}\n`);

  // Check if zip file exists
  if (!fs.existsSync(ZIP_FILE_PATH)) {
    console.error('❌ deployment.zip not found. Run "npm run build" first.');
    process.exit(1);
  }

  const fileSize = fs.statSync(ZIP_FILE_PATH).size;
  console.log(`📁 Deployment package: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);

  // Step 1: Create/verify S3 bucket
  const deploymentBucket = 'elasticbeanstalk-' + AWS_REGION + '-deployments';
  try {
    await ensureBucketExists(deploymentBucket);
  } catch (error: any) {
    console.log(`⚠️ Cannot create bucket, using existing: ${error.message}`);
  }

  // Step 2: Upload to S3
  const s3Key = `${APPLICATION_NAME}/${VERSION_LABEL}.zip`;
  console.log(`📤 Uploading to S3: s3://${deploymentBucket}/${s3Key}...`);
  
  try {
    await s3.send(new PutObjectCommand({
      Bucket: deploymentBucket,
      Key: s3Key,
      Body: fs.readFileSync(ZIP_FILE_PATH)
    }));
    console.log('✅ Upload complete\n');
  } catch (error: any) {
    console.error('❌ S3 upload failed:', error.message);
    process.exit(1);
  }

  // Step 3: Create application if it doesn't exist
  const appExists = await checkApplicationExists();
  if (!appExists) {
    console.log('📱 Creating Elastic Beanstalk application...');
    try {
      await eb.send(new CreateApplicationCommand({
        ApplicationName: APPLICATION_NAME,
        Description: 'Trading Platform - Full-stack Node.js application'
      }));
      console.log('✅ Application created\n');
    } catch (error: any) {
      console.error('❌ Failed to create application:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Application already exists\n');
  }

  // Step 4: Create application version
  console.log(`📋 Creating application version ${VERSION_LABEL}...`);
  try {
    await eb.send(new CreateApplicationVersionCommand({
      ApplicationName: APPLICATION_NAME,
      VersionLabel: VERSION_LABEL,
      Description: `Deployed at ${new Date().toISOString()}`,
      SourceBundle: {
        S3Bucket: deploymentBucket,
        S3Key: s3Key
      },
      Process: true
    }));
    console.log('✅ Application version created\n');
  } catch (error: any) {
    console.error('❌ Failed to create version:', error.message);
    process.exit(1);
  }

  // Step 5: Create or update environment
  const envCheck = await checkEnvironmentExists();
  
  if (envCheck.exists) {
    console.log(`🔄 Updating existing environment (status: ${envCheck.status})...`);
    try {
      const response = await eb.send(new UpdateEnvironmentCommand({
        ApplicationName: APPLICATION_NAME,
        EnvironmentName: ENVIRONMENT_NAME,
        VersionLabel: VERSION_LABEL
      }));
      console.log('✅ Environment update initiated');
      console.log(`   URL: ${response.CNAME}\n`);
    } catch (error: any) {
      console.error('❌ Failed to update environment:', error.message);
      process.exit(1);
    }
  } else {
    console.log('🌐 Creating new environment...');
    try {
      const response = await eb.send(new CreateEnvironmentCommand({
        ApplicationName: APPLICATION_NAME,
        EnvironmentName: ENVIRONMENT_NAME,
        VersionLabel: VERSION_LABEL,
        SolutionStackName: '64bit Amazon Linux 2023 v6.1.6 running Node.js 20',
        OptionSettings: [
          {
            Namespace: 'aws:elasticbeanstalk:application:environment',
            OptionName: 'NODE_ENV',
            Value: 'production'
          },
          {
            Namespace: 'aws:elasticbeanstalk:application:environment',
            OptionName: 'PORT',
            Value: '5000'
          },
          {
            Namespace: 'aws:elasticbeanstalk:environment:process:default',
            OptionName: 'Port',
            Value: '5000'
          },
          {
            Namespace: 'aws:autoscaling:launchconfiguration',
            OptionName: 'InstanceType',
            Value: 't3.medium'
          },
          {
            Namespace: 'aws:autoscaling:asg',
            OptionName: 'MinSize',
            Value: '1'
          },
          {
            Namespace: 'aws:autoscaling:asg',
            OptionName: 'MaxSize',
            Value: '4'
          }
        ]
      }));
      console.log('✅ Environment creation initiated');
      console.log(`   Environment ID: ${response.EnvironmentId}\n`);
    } catch (error: any) {
      console.error('❌ Failed to create environment:', error.message);
      console.log('\n💡 You may need to create the environment manually in AWS Console.');
      process.exit(1);
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 DEPLOYMENT INITIATED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('Next steps:');
  console.log('1. Go to AWS Elastic Beanstalk Console');
  console.log('2. Wait for environment to become "Ready" (5-10 minutes)');
  console.log('3. Add environment variables in Configuration > Software');
  console.log('4. Update Cognito redirect URLs to your EB domain\n');
}

deploy().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
