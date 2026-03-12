import { ElasticBeanstalkClient, ListAvailableSolutionStacksCommand } from '@aws-sdk/client-elastic-beanstalk';

const eb = new ElasticBeanstalkClient({ region: 'eu-north-1' });

async function listStacks() {
  const response = await eb.send(new ListAvailableSolutionStacksCommand({}));
  const nodeStacks = response.SolutionStacks?.filter(s => s.includes('Node.js')) || [];
  console.log('Available Node.js stacks:');
  nodeStacks.forEach(s => console.log('  ' + s));
}

listStacks().catch(console.error);
