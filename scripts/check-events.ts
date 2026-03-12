import { ElasticBeanstalkClient, DescribeEventsCommand } from '@aws-sdk/client-elastic-beanstalk';

const eb = new ElasticBeanstalkClient({ region: 'eu-north-1' });

async function check() {
  const response = await eb.send(new DescribeEventsCommand({
    ApplicationName: 'trading-platform',
    EnvironmentName: 'tradingplatform-env',
    MaxRecords: 20
  }));
  
  console.log('Recent Events:');
  console.log('═══════════════════════════════════════════════════');
  response.Events?.forEach(e => {
    const time = e.EventDate?.toISOString().split('T')[1].split('.')[0] || '';
    console.log(`[${time}] ${e.Severity}: ${e.Message}`);
  });
}

check().catch(console.error);
