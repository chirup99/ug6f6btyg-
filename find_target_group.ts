import { ElasticLoadBalancingV2Client, DescribeTargetGroupsCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
const elb = new ElasticLoadBalancingV2Client({ region: "eu-north-1" });
async function find() {
  const tgs = await elb.send(new DescribeTargetGroupsCommand({}));
  console.log("Target Groups:", JSON.stringify(tgs.TargetGroups, null, 2));
}
find();
