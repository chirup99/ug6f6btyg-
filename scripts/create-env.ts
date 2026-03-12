import { ElasticBeanstalkClient, CreateEnvironmentCommand, DescribeApplicationVersionsCommand } from '@aws-sdk/client-elastic-beanstalk';

const AWS_REGION = 'eu-north-1';
const APPLICATION_NAME = 'trading-platform';
const ENVIRONMENT_NAME = 'trading-platform-prod';

const eb = new ElasticBeanstalkClient({ region: AWS_REGION });

async function createEnv() {
  const versions = await eb.send(new DescribeApplicationVersionsCommand({
    ApplicationName: APPLICATION_NAME,
    MaxRecords: 1
  }));
  
  const latestVersion = versions.ApplicationVersions?.[0];
  if (!latestVersion) {
    console.error('No versions found');
    process.exit(1);
  }
  
  console.log(`Latest version: ${latestVersion.VersionLabel}`);
  console.log(`Status: ${latestVersion.Status}`);
  
  console.log('Creating environment...');
  const response = await eb.send(new CreateEnvironmentCommand({
    ApplicationName: APPLICATION_NAME,
    EnvironmentName: ENVIRONMENT_NAME,
    VersionLabel: latestVersion.VersionLabel,
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
  
  console.log('\n✅ Environment creation initiated!');
  console.log(`Environment ID: ${response.EnvironmentId}`);
  console.log(`Environment Name: ${response.EnvironmentName}`);
  console.log(`Status: ${response.Status}`);
  console.log(`\n🌐 Your app will be available at:`);
  console.log(`   http://${response.CNAME || ENVIRONMENT_NAME + '.eu-north-1.elasticbeanstalk.com'}`);
  console.log('\n⏳ Environment creation takes 5-10 minutes.');
  console.log('   Check progress at: https://eu-north-1.console.aws.amazon.com/elasticbeanstalk/home?region=eu-north-1');
}

createEnv().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
