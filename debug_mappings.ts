import { DynamoDBClient, ScanCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

async function run() {
  console.log('--- CHECKING IDENTITY MAPPINGS ---');
  const scan = await client.send(new ScanCommand({
    TableName: 'neofeed-user-profiles',
    FilterExpression: 'sk = :sk',
    ExpressionAttributeValues: { ':sk': { S: 'IDENTITY_MAPPING' } }
  }));
  
  console.log('Mappings found:', scan.Items?.length);
  scan.Items?.forEach(item => {
    console.log(`PK: ${item.pk?.S} -> Canonical: ${item.canonicalUserId?.S} - Email: ${item.email?.S}`);
  });
}

run().catch(console.error);
