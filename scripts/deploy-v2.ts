import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ElasticBeanstalkClient, CreateApplicationVersionCommand, CreateEnvironmentCommand } from '@aws-sdk/client-elastic-beanstalk';
import fs from 'fs';

const AWS_REGION = 'eu-north-1';
const APPLICATION_NAME = 'trading-platform';
const ENVIRONMENT_NAME = 'trading-platform-prod';
const S3_BUCKET = 'elasticbeanstalk-eu-north-1-deployments';
const VERSION_LABEL = `v-${Date.now()}`;

const s3 = new S3Client({ region: AWS_REGION });
const eb = new ElasticBeanstalkClient({ region: AWS_REGION });

async function deploy() {
  console.log('🚀 Deploying new version:', VERSION_LABEL);
  
  // Upload to S3
  const s3Key = `trading-platform/${VERSION_LABEL}.zip`;
  console.log('📤 Uploading to S3...');
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fs.readFileSync('./deployment.zip')
  }));
  console.log('✅ Upload complete');

  // Create version
  console.log('📋 Creating application version...');
  await eb.send(new CreateApplicationVersionCommand({
    ApplicationName: APPLICATION_NAME,
    VersionLabel: VERSION_LABEL,
    SourceBundle: { S3Bucket: S3_BUCKET, S3Key: s3Key },
    Process: true
  }));
  console.log('✅ Version created');

  // Wait for processing
  console.log('⏳ Waiting 20s for version processing...');
  await new Promise(r => setTimeout(r, 20000));

  // Create environment
  console.log('🌐 Creating environment...');
  const response = await eb.send(new CreateEnvironmentCommand({
    ApplicationName: APPLICATION_NAME,
    EnvironmentName: ENVIRONMENT_NAME,
    VersionLabel: VERSION_LABEL,
    SolutionStackName: '64bit Amazon Linux 2023 v6.7.0 running Node.js 20',
    OptionSettings: [
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'NODE_ENV', Value: 'production' },
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'PORT', Value: '5000' },
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'AWS_REGION', Value: 'eu-north-1' },
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'AWS_COGNITO_USER_POOL_ID', Value: 'eu-north-1_rXrrnI6cZ' },
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'AWS_COGNITO_APP_CLIENT_ID', Value: '65plb5ei051fh8qr52mispdqq' },
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'AWS_S3_BUCKET', Value: 'neofeed-profile-images' },
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'VITE_COGNITO_USER_POOL_ID', Value: 'eu-north-1_rXrrnI6cZ' },
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'VITE_COGNITO_APP_CLIENT_ID', Value: '65plb5ei051fh8qr52mispdqq' },
      { Namespace: 'aws:elasticbeanstalk:application:environment', OptionName: 'VITE_COGNITO_DOMAIN', Value: 'tradingplatform-531503.auth.eu-north-1.amazoncognito.com' },
      { Namespace: 'aws:elasticbeanstalk:environment:process:default', OptionName: 'Port', Value: '5000' },
      { Namespace: 'aws:autoscaling:launchconfiguration', OptionName: 'InstanceType', Value: 't3.medium' },
      { Namespace: 'aws:autoscaling:asg', OptionName: 'MinSize', Value: '1' },
      { Namespace: 'aws:autoscaling:asg', OptionName: 'MaxSize', Value: '4' }
    ]
  }));

  console.log('\n════════════════════════════════════════════════════════');
  console.log('🎉 DEPLOYMENT SUCCESSFUL!');
  console.log('════════════════════════════════════════════════════════');
  console.log(`\nEnvironment: ${response.EnvironmentName}`);
  console.log(`URL: http://${response.CNAME}`);
  console.log(`Status: ${response.Status}`);
  console.log('\n⏳ Environment will be ready in 5-10 minutes.');
  console.log('📊 Monitor: https://eu-north-1.console.aws.amazon.com/elasticbeanstalk');
  console.log('\n⚠️  After deployment, add these secrets in EB Configuration:');
  console.log('   - AWS_ACCESS_KEY_ID');
  console.log('   - AWS_SECRET_ACCESS_KEY');
  console.log('   - SESSION_SECRET');
  console.log('   - ANGEL_ONE_* credentials');
  console.log('   - FYERS_* credentials');
}

deploy().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
