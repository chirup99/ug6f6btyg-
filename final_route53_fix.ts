import "dotenv/config";
import { Route53Client, ChangeResourceRecordSetsCommand, ListHostedZonesCommand } from "@aws-sdk/client-route-53";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { ElasticBeanstalkClient, DescribeEnvironmentsCommand } from "@aws-sdk/client-elastic-beanstalk";

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
};

const r53 = new Route53Client({ region: "us-east-1", credentials });
const elb = new ElasticLoadBalancingV2Client({ region: "ap-south-1", credentials });
const eb = new ElasticBeanstalkClient({ region: "ap-south-1", credentials });

async function fix() {
  try {
    console.log("--- Scanning Hosted Zones ---");
    const zones = await r53.send(new ListHostedZonesCommand({}));
    zones.HostedZones?.forEach(z => console.log(`Zone: ${z.Name} ID: ${z.Id}`));

    console.log("\n--- Scanning EB Environments in ap-south-1 ---");
    const envs = await eb.send(new DescribeEnvironmentsCommand({}));
    const env = envs.Environments?.find(e => e.EnvironmentName === "production-env" || e.CNAME?.includes("perala"));
    console.log("Found Environment:", env?.EnvironmentName, "CNAME:", env?.CNAME);

    const lbs = await elb.send(new DescribeLoadBalancersCommand({}));
    // Try to find the LB associated with the EB environment
    const lb = lbs.LoadBalancers?.find(l => l.DNSName?.includes(env?.EnvironmentName || "perala"));
    console.log("LB DNS:", lb?.DNSName);
    console.log("LB Canonical Hosted Zone ID:", lb?.CanonicalHostedZoneId);

    if (lb && lb.CanonicalHostedZoneId && env) {
      const targetZone = zones.HostedZones?.find(z => z.Name.includes("perala.in"));
      if (!targetZone) {
        console.log("Error: Could not find Route 53 Hosted Zone for perala.in");
        return;
      }

      console.log(`\n--- Updating Route 53 (${targetZone.Id}) to correct ALIAS ---`);
      const change = await r53.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: targetZone.Id,
        ChangeBatch: {
          Changes: [
            {
              Action: "UPSERT",
              ResourceRecordSet: {
                Name: "perala.in.",
                Type: "A",
                AliasTarget: {
                  HostedZoneId: lb.CanonicalHostedZoneId,
                  DNSName: `dualstack.${lb.DNSName}.`,
                  EvaluateTargetHealth: false
                }
              }
            }
          ]
        }
      }));
      console.log("Route 53 Update Status:", change.ChangeInfo?.Status);
    } else {
      console.log("Error: Could not find valid Load Balancer, Hosted Zone ID, or Environment");
    }
  } catch (err) {
    console.error("Fix Error:", err);
  }
}
fix();
