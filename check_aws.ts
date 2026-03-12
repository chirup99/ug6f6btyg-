import { ElasticBeanstalkClient, DescribeEnvironmentHealthCommand, RetrieveEnvironmentInfoCommand } from "@aws-sdk/client-elastic-beanstalk";

const client = new ElasticBeanstalkClient({ region: process.env.AWS_REGION || "eu-north-1" });

async function check() {
  try {
    const envs = await client.send(new DescribeEnvironmentHealthCommand({
      AttributeNames: ["All"],
      EnvironmentName: "neofeed-social-features" // Guessing based on replit.md
    }));
    console.log("Environment Health:", JSON.stringify(envs, null, 2));

    const info = await client.send(new RetrieveEnvironmentInfoCommand({
      EnvironmentName: "neofeed-social-features",
      InfoType: "tail"
    }));
    console.log("Environment Info:", JSON.stringify(info, null, 2));
  } catch (err) {
    console.error("Error checking AWS:", err);
  }
}

check();
