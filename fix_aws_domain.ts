import { ElasticBeanstalkClient, DescribeEnvironmentsCommand, DescribeEnvironmentHealthCommand, ListAvailableSolutionStacksCommand } from "@aws-sdk/client-elastic-beanstalk";

const client = new ElasticBeanstalkClient({ 
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

async function runFix() {
  try {
    console.log("--- Listing Environments ---");
    const envs = await client.send(new DescribeEnvironmentsCommand({}));
    console.log("Environments:", JSON.stringify(envs.Environments, null, 2));

    if (envs.Environments && envs.Environments.length > 0) {
      for (const env of envs.Environments) {
        console.log(`\n--- Checking Health for: ${env.EnvironmentName} ---`);
        try {
          const health = await client.send(new DescribeEnvironmentHealthCommand({
            EnvironmentName: env.EnvironmentName,
            AttributeNames: ["All"]
          }));
          console.log(`Health for ${env.EnvironmentName}:`, JSON.stringify(health, null, 2));
        } catch (hErr) {
          console.error(`Could not get health for ${env.EnvironmentName}:`, hErr);
        }
      }
    } else {
      console.log("No environments found in this region.");
    }

  } catch (err) {
    console.error("Critical Error during AWS scan:", err);
  }
}

runFix();
