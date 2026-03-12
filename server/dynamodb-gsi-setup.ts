import { DynamoDBClient, UpdateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export const GSI_DEFINITIONS = {
  'neofeed-user-posts': [
    {
      IndexName: 'authorUsername-createdAt-index',
      KeySchema: [
        { AttributeName: 'authorUsername', KeyType: 'HASH' as const },
        { AttributeName: 'createdAt', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    },
    {
      IndexName: 'status-createdAt-index',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' as const },
        { AttributeName: 'createdAt', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    },
    {
      IndexName: 'id-index',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'neofeed-likes': [
    {
      IndexName: 'postId-createdAt-index',
      KeySchema: [
        { AttributeName: 'postId', KeyType: 'HASH' as const },
        { AttributeName: 'createdAt', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    },
    {
      IndexName: 'userId-postId-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' as const },
        { AttributeName: 'postId', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'neofeed-downtrends': [
    {
      IndexName: 'postId-createdAt-index',
      KeySchema: [
        { AttributeName: 'postId', KeyType: 'HASH' as const },
        { AttributeName: 'createdAt', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'neofeed-retweets': [
    {
      IndexName: 'postId-createdAt-index',
      KeySchema: [
        { AttributeName: 'postId', KeyType: 'HASH' as const },
        { AttributeName: 'createdAt', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'neofeed-comments': [
    {
      IndexName: 'postId-createdAt-index',
      KeySchema: [
        { AttributeName: 'postId', KeyType: 'HASH' as const },
        { AttributeName: 'createdAt', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'neofeed-follows': [
    {
      IndexName: 'followerUsername-index',
      KeySchema: [
        { AttributeName: 'followerUsername', KeyType: 'HASH' as const },
        { AttributeName: 'followingUsername', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    },
    {
      IndexName: 'followingUsername-index',
      KeySchema: [
        { AttributeName: 'followingUsername', KeyType: 'HASH' as const },
        { AttributeName: 'followerUsername', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'neofeed-audio-posts': [
    {
      IndexName: 'authorUsername-createdAt-index',
      KeySchema: [
        { AttributeName: 'authorUsername', KeyType: 'HASH' as const },
        { AttributeName: 'createdAt', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'neofeed-finance-news': [
    {
      IndexName: 'category-publishedAt-index',
      KeySchema: [
        { AttributeName: 'category', KeyType: 'HASH' as const },
        { AttributeName: 'publishedAt', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'neofeed-banners': [
    {
      IndexName: 'active-displayStart-index',
      KeySchema: [
        { AttributeName: 'active', KeyType: 'HASH' as const },
        { AttributeName: 'displayStart', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ],
  'tradebook-heatmaps': [
    {
      IndexName: 'userId-sessionDate-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' as const },
        { AttributeName: 'sessionDate', KeyType: 'RANGE' as const }
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }
  ]
};

const ATTRIBUTE_DEFINITIONS: Record<string, { AttributeName: string; AttributeType: 'S' | 'N' }[]> = {
  'neofeed-user-posts': [
    { AttributeName: 'authorUsername', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'id', AttributeType: 'S' }
  ],
  'neofeed-likes': [
    { AttributeName: 'postId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' },
    { AttributeName: 'userId', AttributeType: 'S' }
  ],
  'neofeed-downtrends': [
    { AttributeName: 'postId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  'neofeed-retweets': [
    { AttributeName: 'postId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  'neofeed-comments': [
    { AttributeName: 'postId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  'neofeed-follows': [
    { AttributeName: 'followerUsername', AttributeType: 'S' },
    { AttributeName: 'followingUsername', AttributeType: 'S' }
  ],
  'neofeed-audio-posts': [
    { AttributeName: 'authorUsername', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' }
  ],
  'neofeed-finance-news': [
    { AttributeName: 'category', AttributeType: 'S' },
    { AttributeName: 'publishedAt', AttributeType: 'S' }
  ],
  'neofeed-banners': [
    { AttributeName: 'active', AttributeType: 'S' },
    { AttributeName: 'displayStart', AttributeType: 'S' }
  ],
  'tradebook-heatmaps': [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'sessionDate', AttributeType: 'S' }
  ]
};

async function getExistingGSIs(tableName: string): Promise<string[]> {
  try {
    const response = await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    return response.Table?.GlobalSecondaryIndexes?.map(gsi => gsi.IndexName || '') || [];
  } catch (error) {
    console.error(`Error describing table ${tableName}:`, error);
    return [];
  }
}

async function addGSIToTable(tableName: string, gsi: any, attributeDefinitions: any[]) {
  try {
    const existingGSIs = await getExistingGSIs(tableName);
    
    if (existingGSIs.includes(gsi.IndexName)) {
      console.log(`  GSI ${gsi.IndexName} already exists on ${tableName}`);
      return true;
    }

    console.log(`  Adding GSI ${gsi.IndexName} to ${tableName}...`);
    
    await dynamoClient.send(new UpdateTableCommand({
      TableName: tableName,
      AttributeDefinitions: attributeDefinitions,
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: gsi.IndexName,
            KeySchema: gsi.KeySchema,
            Projection: gsi.Projection
          }
        }
      ]
    }));
    
    console.log(`  ✅ GSI ${gsi.IndexName} added successfully`);
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`  ⚠️ Table ${tableName} is currently being updated, skipping ${gsi.IndexName}`);
      return false;
    }
    console.error(`  ❌ Failed to add GSI ${gsi.IndexName}:`, error.message);
    return false;
  }
}

export async function setupAllGSIs() {
  console.log('🔧 Setting up Global Secondary Indexes for DynamoDB tables...\n');
  
  for (const [tableName, gsis] of Object.entries(GSI_DEFINITIONS)) {
    console.log(`📋 Processing table: ${tableName}`);
    const attributeDefinitions = ATTRIBUTE_DEFINITIONS[tableName] || [];
    
    for (const gsi of gsis) {
      await addGSIToTable(tableName, gsi, attributeDefinitions);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('');
  }
  
  console.log('✅ GSI setup complete!\n');
}

export async function checkGSIStatus() {
  console.log('📊 Checking GSI status for all tables...\n');
  
  const results: Record<string, { existing: string[], needed: string[], missing: string[] }> = {};
  
  for (const [tableName, gsis] of Object.entries(GSI_DEFINITIONS)) {
    const existing = await getExistingGSIs(tableName);
    const needed = gsis.map(g => g.IndexName);
    const missing = needed.filter(name => !existing.includes(name));
    
    results[tableName] = { existing, needed, missing };
    
    console.log(`📋 ${tableName}:`);
    console.log(`   Existing GSIs: ${existing.length > 0 ? existing.join(', ') : 'None'}`);
    console.log(`   Needed GSIs: ${needed.join(', ')}`);
    console.log(`   Missing GSIs: ${missing.length > 0 ? missing.join(', ') : 'All present ✅'}`);
    console.log('');
  }
  
  return results;
}
