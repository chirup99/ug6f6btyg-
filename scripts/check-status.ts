import { ElasticBeanstalkClient, DescribeEnvironmentsCommand } from '@aws-sdk/client-elastic-beanstalk';

const eb = new ElasticBeanstalkClient({ region: 'eu-north-1' });

async function check() {
  const response = await eb.send(new DescribeEnvironmentsCommand({
    ApplicationName: 'trading-platform',
    EnvironmentNames: ['tradingplatform-env']
  }));
  
  const env = response.Environments?.[0];
  if (env) {
    console.log('═══════════════════════════════════════════════════');
    console.log('AWS ELASTIC BEANSTALK ENVIRONMENT STATUS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Environment: ${env.EnvironmentName}`);
    console.log(`Status: ${env.Status}`);
    console.log(`Health: ${env.Health}`);
    console.log(`URL: http://${env.CNAME}`);
    console.log(`Version: ${env.VersionLabel}`);
    console.log('═══════════════════════════════════════════════════');
  } else {
    console.log('Environment not found');
  }
}

check().catch(console.error);
