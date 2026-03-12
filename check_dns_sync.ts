import { Route53Client, ListResourceRecordSetsCommand } from "@aws-sdk/client-route-53";
import { ElasticBeanstalkClient, DescribeEnvironmentsCommand } from "@aws-sdk/client-elastic-beanstalk";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand, DescribeListenersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
};

const r53Client = new Route53Client({ region: "us-east-1", credentials });
const ebClient = new ElasticBeanstalkClient({ region: process.env.AWS_REGION || "eu-north-1", credentials });
const elbClient = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || "eu-north-1", credentials });

async function checkSync() {
  try {
    console.log("--- 1. Current Public DNS Resolution ---");
    try {
      const peralaInIp = await resolve4('perala.in');
      console.log("perala.in resolves to:", peralaInIp);
    } catch (e) { console.log("perala.in resolve failed:", e.message); }

    try {
      const wwwPeralaIn = await resolveCname('www.perala.in');
      console.log("www.perala.in CNAME resolves to:", wwwPeralaIn);
    } catch (e) { console.log("www.perala.in resolve failed:", e.message); }

    console.log("\n--- 2. Route 53 Configuration ---");
    const zoneId = "/hostedzone/Z0813290SYY7KV0312P0";
    const records = await r53Client.send(new ListResourceRecordSetsCommand({ HostedZoneId: zoneId }));
    
    const aRecord = records.ResourceRecordSets?.find(r => r.Name === "perala.in." && r.Type === "A");
    const wwwRecord = records.ResourceRecordSets?.find(r => r.Name === "www.perala.in." && r.Type === "CNAME");

    console.log("R53 A Record (perala.in):", aRecord?.AliasTarget?.DNSName || aRecord?.ResourceRecords?.[0]?.Value);
    console.log("R53 CNAME Record (www.perala.in):", wwwRecord?.ResourceRecords?.[0]?.Value);

    console.log("\n--- 3. Elastic Beanstalk Environment ---");
    const ebEnvs = await ebClient.send(new DescribeEnvironmentsCommand({ EnvironmentNames: ["perala-live"] }));
    const env = ebEnvs.Environments?.[0];
    console.log("EB CNAME:", env?.CNAME);

    console.log("\n--- 4. Load Balancer & Target Groups ---");
    const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
    const lb = lbs.LoadBalancers?.find(l => l.DNSName?.includes("perala-live"));
    
    if (lb) {
      console.log("LB DNS Name:", lb.DNSName);
      const listeners = await elbClient.send(new DescribeListenersCommand({ LoadBalancerArn: lb.LoadBalancerArn }));
      for (const listener of listeners.Listeners || []) {
        console.log(`Listener Port: ${listener.Port}, Protocol: ${listener.Protocol}`);
        const targetGroupArn = listener.DefaultActions?.[0]?.TargetGroupArn;
        if (targetGroupArn) {
          const tg = await elbClient.send(new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn] }));
          console.log(`  Target Group Port: ${tg.TargetGroups?.[0]?.Port}, Protocol: ${tg.TargetGroups?.[0]?.Protocol}`);
          
          const health = await elbClient.send(new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn }));
          console.log(`  Target Health:`, health.TargetHealthDescriptions?.map(d => ({
            Id: d.Target?.Id,
            Port: d.Target?.Port,
            State: d.TargetHealth?.State,
            Reason: d.TargetHealth?.Reason
          })));
        }
      }
    }
  } catch (err) {
    console.error("Sync Check Error:", err);
  }
}
checkSync();
