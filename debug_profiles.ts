import { DynamoDBClient, ScanCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

async function run() {
  console.log('--- SCANNING ALL PROFILES ---');
  const scan = await client.send(new ScanCommand({
    TableName: 'neofeed-user-profiles',
    FilterExpression: 'sk = :sk',
    ExpressionAttributeValues: { ':sk': { S: 'PROFILE' } }
  }));
  
  console.log('Profiles found:', scan.Items?.length);
  scan.Items?.forEach(item => {
    console.log(`User: ${item.displayName?.S} (@${item.username?.S}) - Email: ${item.email?.S} - PK: ${item.pk?.S}`);
  });

  const emails = ['chiranjeevi.perala8686@gmail.com', 'chiranjeeviperala8686@gmail.com'];
  for (const email of emails) {
    console.log(`\n--- CHECKING IDENTITY_LINK FOR: ${email} ---`);
    const link = await client.send(new GetItemCommand({
      TableName: 'neofeed-user-profiles',
      Key: {
        pk: { S: `USER_EMAIL#${email.toLowerCase()}` },
        sk: { S: 'IDENTITY_LINK' }
      }
    }));
    console.log(email, 'Link:', link.Item ? `Points to ${link.Item.userId?.S}` : 'NOT FOUND');
  }
}

run().catch(console.error);
