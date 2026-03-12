import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { Route53Client, ListHostedZonesCommand, ListResourceRecordSetsCommand } from "@aws-sdk/client-route-53";

const ec2Client = new EC2Client({ 
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const r53Client = new Route53Client({ 
  region: "us-east-1", // Route 53 is global but client usually uses us-east-1
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

async function checkResources() {
  try {
    console.log("--- EC2 Instances ---");
    const instances = await ec2Client.send(new DescribeInstancesCommand({}));
    const runningInstances = instances.Reservations?.flatMap(r => r.Instances || [])
      .filter(i => i.State?.Name === "running") || [];
    
    runningInstances.forEach(i => {
      console.log(`ID: ${i.InstanceId}, IP: ${i.PublicIpAddress}, State: ${i.State?.Name}`);
      console.log(`Security Groups: ${i.SecurityGroups?.map(sg => sg.GroupName).join(", ")}`);
    });

    if (runningInstances.length > 0) {
        const sgIds = runningInstances.flatMap(i => i.SecurityGroups?.map(sg => sg.GroupId!) || []);
        const sgs = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds }));
        console.log("\n--- Security Group Rules ---");
        sgs.SecurityGroups?.forEach(sg => {
            console.log(`SG: ${sg.GroupName} (${sg.GroupId})`);
            sg.IpPermissions?.forEach(p => {
                console.log(`  Allow Port: ${p.FromPort}-${p.ToPort}, Protocol: ${p.IpProtocol}`);
            });
        });
    }

    console.log("\n--- Route 53 Hosted Zones ---");
    const zones = await r53Client.send(new ListHostedZonesCommand({}));
    for (const zone of zones.HostedZones || []) {
      console.log(`Zone: ${zone.Name} (${zone.Id})`);
      const records = await r53Client.send(new ListResourceRecordSetsCommand({ HostedZoneId: zone.Id }));
      records.ResourceRecordSets?.forEach(r => {
        console.log(`  Record: ${r.Name} [${r.Type}] -> ${r.ResourceRecords?.map(rr => rr.Value).join(", ") || r.AliasTarget?.DNSName}`);
      });
    }

  } catch (err) {
    console.error("Error checking resources:", err);
  }
}

checkResources();
