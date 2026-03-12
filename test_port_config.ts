import { ElasticBeanstalkClient, DescribeConfigurationSettingsCommand } from "@aws-sdk/client-elastic-beanstalk";
const ebClient = new ElasticBeanstalkClient({ region: "eu-north-1" });
async function check() {
  const settings = await ebClient.send(new DescribeConfigurationSettingsCommand({
    ApplicationName: "perala ai",
    EnvironmentName: "perala-live"
  }));
  const portSetting = settings.ConfigurationSettings?.[0]?.OptionSettings?.find(s => s.OptionName === "PORT");
  console.log("Current PORT setting in AWS Console:", portSetting?.Value);
}
check();
