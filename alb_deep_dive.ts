import { ElasticLoadBalancingV2Client, DescribeTargetGroupsCommand, DescribeListenersCommand, DescribeTargetHealthCommand } from "@aws-sdk/client-elastic-load-balancing-v2";

const client = new ElasticLoadBalancingV2Client({ region: "eu-north-1" });

async function check() {
  try {
    const tgs = await client.send(new DescribeTargetGroupsCommand({}));
    console.log("--- Target Groups ---");
    for (const tg of tgs.TargetGroups || []) {
      console.log(`Name: ${tg.TargetGroupName}`);
      console.log(`Port: ${tg.Port}`);
      console.log(`HealthCheckPort: ${tg.HealthCheckPort}`);
      console.log(`ARN: ${tg.TargetGroupArn}`);
      
      const health = await client.send(new DescribeTargetHealthCommand({ TargetGroupArn: tg.TargetGroupArn }));
      console.log("Health Status:", JSON.stringify(health.TargetHealthDescriptions, null, 2));
    }

    console.log("\n--- Listeners ---");
    const lbArn = "arn:aws:elasticloadbalancing:eu-north-1:323726447850:loadbalancer/app/perala-live/82bb74976b240e2e";
    const listeners = await client.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn }));
    console.log(JSON.stringify(listeners.Listeners, null, 2));

  } catch (err) {
    console.error("ALB Check Error:", err);
  }
}
check();
