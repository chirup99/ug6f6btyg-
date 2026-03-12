import { ElasticBeanstalkClient, DescribeEnvironmentResourcesCommand } from "@aws-sdk/client-elastic-beanstalk";
const ebClient = new ElasticBeanstalkClient({ 
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});
async function check() {
  const resources = await ebClient.send(new DescribeEnvironmentResourcesCommand({ EnvironmentName: "perala-live" }));
  console.log("EB Resources:", JSON.stringify(resources.EnvironmentResources, null, 2));
}
check();
