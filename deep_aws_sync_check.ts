import { Route53Client, ListResourceRecordSetsCommand } from "@aws-sdk/client-route-53";
import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetHealthCommand, DescribeTargetGroupsCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { ElasticBeanstalkClient, DescribeEnvironmentsCommand } from "@aws-sdk/client-elastic-beanstalk";
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
};

const r53 = new Route53Client({ region: "us-east-1", credentials });
const ec2 = new EC2Client({ region: "eu-north-1", credentials });
const elb = new ElasticLoadBalancingV2Client({ region: "eu-north-1", credentials });
const eb = new ElasticBeanstalkClient({ region: "eu-north-1", credentials });

async function analyze() {
  console.log("--- DNS CHECK ---");
  try {
    const ips = await resolve4("perala.in");
    console.log("perala.in resolves to:", ips);
  } catch (e) { console.log("perala.in resolve fail:", e.message); }

  console.log("\n--- ROUTE 53 CHECK ---");
  const records = await r53.send(new ListResourceRecordSetsCommand({ HostedZoneId: "/hostedzone/Z0813290SYY7KV0312P0" }));
  const aRecord = records.ResourceRecordSets?.find(r => r.Name === "perala.in." && r.Type === "A");
  console.log("R53 Record Value:", aRecord?.ResourceRecords?.[0]?.Value || aRecord?.AliasTarget?.DNSName);

  console.log("\n--- EC2 INSTANCE CHECK ---");
  const instances = await ec2.send(new DescribeInstancesCommand({ InstanceIds: ["i-06b91f43bdbc0f704"] }));
  const inst = instances.Reservations?.[0]?.Instances?.[0];
  console.log("Instance IP:", inst?.PublicIpAddress);
  console.log("Instance State:", inst?.State?.Name);

  console.log("\n--- SECURITY GROUP CHECK ---");
  const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: ["sg-04e8b7ea0e9a9c6a9"] }));
  console.log("Rules:", JSON.stringify(sgs.SecurityGroups?.[0]?.IpPermissions, null, 2));

  console.log("\n--- EB ENVIRONMENT CHECK ---");
  const envs = await eb.send(new DescribeEnvironmentsCommand({ EnvironmentNames: ["perala-live"] }));
  console.log("EB Status:", envs.Environments?.[0]?.Status);
  console.log("EB Health:", envs.Environments?.[0]?.Health);
}
analyze();
