import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const TABLES = {
  USER_POSTS: 'neofeed-user-posts',
  LIKES: 'neofeed-likes',
  DOWNTRENDS: 'neofeed-downtrends',
  RETWEETS: 'neofeed-retweets',
  COMMENTS: 'neofeed-comments',
  FINANCE_NEWS: 'neofeed-finance-news',
  USER_PROFILES: 'neofeed-user-profiles',
  AUDIO_POSTS: 'neofeed-audio-posts',
  BANNERS: 'neofeed-banners',
  FOLLOWS: 'neofeed-follows',
  REPORT_BUGS: 'neofeed-report-bugs',
  ADMIN_ACCESS: 'access-admin'
};

export interface AdminAccess {
  email_id: string;
  roles: string;
  date: string;
  revoke_date?: string;
}

export async function createAdminAccess(accessData: {
  email_id: string;
  roles: string;
}): Promise<AdminAccess> {
  try {
    const timestamp = new Date().toISOString();
    const item: AdminAccess = {
      email_id: accessData.email_id,
      roles: accessData.roles,
      date: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.ADMIN_ACCESS,
      Item: {
        pk: `admin#${accessData.email_id}`,
        sk: 'ACCESS',
        ...item
      }
    }));
    
    console.log(`✅ Admin access created: ${accessData.email_id}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating admin access:', error);
    throw error;
  }
}

export async function getAllAdminAccess(): Promise<AdminAccess[]> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.ADMIN_ACCESS
    }));
    return (result.Items || []) as AdminAccess[];
  } catch (error) {
    console.error('❌ Error fetching admin access:', error);
    return [];
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createTableIfNotExists(tableName: string): Promise<void> {
  try {
    const exists = await tableExists(tableName);
    if (exists) {
      console.log(`✅ Table ${tableName} already exists`);
      return;
    }

    console.log(`📦 Creating table ${tableName}...`);
    await dynamoClient.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }));
    console.log(`✅ Table ${tableName} created successfully`);
  } catch (error: any) {
    console.error(`❌ Error creating table ${tableName}:`, error.message);
  }
}

export async function initializeNeoFeedTables() {
  try {
    console.log('🔷 Initializing NeoFeed AWS DynamoDB tables...');
    
    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ AWS credentials not configured - NeoFeed will use Firebase fallback');
      return false;
    }
    
    // Create all tables if they don't exist
    const tableNames = Object.values(TABLES);
    for (const tableName of tableNames) {
      await createTableIfNotExists(tableName);
    }
    
    console.log('✅ NeoFeed DynamoDB tables ready for admin access');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize NeoFeed tables:', error);
    return false;
  }
}

// ==================== REPORT BUG FUNCTIONS ====================

export interface BugReport {
  bugId: string;
  username: string;
  emailId: string;
  reportDate: string;
  bugLocate: 'social_feed' | 'journal' | 'others';
  title: string;
  description: string;
  bugMedia: string[];
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export async function createBugReport(reportData: {
  username: string;
  emailId: string;
  bugLocate: 'social_feed' | 'journal' | 'others';
  title: string;
  description: string;
  bugMedia?: string[];
}): Promise<BugReport> {
  try {
    const bugId = nanoid();
    const timestamp = new Date().toISOString();
    
    const item: BugReport = {
      bugId,
      username: reportData.username,
      emailId: reportData.emailId,
      reportDate: timestamp,
      bugLocate: reportData.bugLocate,
      title: reportData.title,
      description: reportData.description,
      bugMedia: reportData.bugMedia || [],
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.REPORT_BUGS,
      Item: {
        pk: `bug#${bugId}`,
        sk: timestamp,
        ...item
      }
    }));
    
    console.log(`✅ Bug report created: ${bugId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating bug report:', error);
    throw error;
  }
}

export async function getAllBugReports(): Promise<BugReport[]> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.REPORT_BUGS
    }));
    
    const bugs = (result.Items || []) as BugReport[];
    bugs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`✅ Fetched ${bugs.length} bug reports from AWS`);
    return bugs;
  } catch (error) {
    console.error('❌ Error fetching bug reports:', error);
    return [];
  }
}

export async function createUserPost(postData: any) {
  try {
    const postId = nanoid();
    const timestamp = new Date().toISOString();
    
    const item = {
      pk: `post#${postId}`,
      sk: timestamp,
      id: postId,
      ...postData,
      status: postData.status || 'published', // Required for GSI status-createdAt-index
      createdAt: timestamp,
      updatedAt: timestamp,
      likes: 0,
      comments: 0,
      reposts: 0
    };

    await docClient.send(new PutCommand({ TableName: TABLES.USER_POSTS, Item: item }));
    console.log(`✅ User post created in AWS: ${postId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating user post in AWS:', error);
    throw error;
  }
}

export async function getUserPost(postId: string) {
  try {
    // Use GSI id-index for efficient lookup (O(1) instead of table scan)
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.USER_POSTS,
      IndexName: 'id-index',
      KeyConditionExpression: 'id = :postId',
      ExpressionAttributeValues: { ':postId': postId }
    }));
    return result.Items?.[0] || null;
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      console.log('⚠️ GSI not found, using scan fallback for getUserPost');
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.USER_POSTS,
        FilterExpression: 'id = :postId',
        ExpressionAttributeValues: { ':postId': postId }
      }));
      return result.Items?.[0] || null;
    }
    console.error('❌ Error fetching user post:', error);
    return null;
  }
}

export async function getUserPostsByUsername(username: string) {
  try {
    // Use GSI authorUsername-createdAt-index for efficient lookup
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.USER_POSTS,
      IndexName: 'authorUsername-createdAt-index',
      KeyConditionExpression: 'authorUsername = :username',
      ExpressionAttributeValues: { ':username': username },
      ScanIndexForward: false // Sort by createdAt descending
    }));
    return result.Items || [];
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      console.log('⚠️ GSI not found, using scan fallback for getUserPostsByUsername');
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.USER_POSTS,
        FilterExpression: 'authorUsername = :username',
        ExpressionAttributeValues: { ':username': username }
      }));
      return result.Items || [];
    }
    console.error('❌ Error fetching user posts:', error);
    return [];
  }
}

export async function updateUserPost(postId: string, updates: any) {
  try {
    const post = await getUserPost(postId);
    if (!post) return false;
    
    const updateExpressions: string[] = [];
    const expressionNames: Record<string, string> = {};
    const expressionValues: Record<string, any> = {};
    let counter = 0;

    for (const [key, value] of Object.entries(updates)) {
      updateExpressions.push(`#attr${counter} = :val${counter}`);
      expressionNames[`#attr${counter}`] = key;
      expressionValues[`:val${counter}`] = value;
      counter++;
    }

    updateExpressions.push('#updatedAt = :now');
    expressionNames['#updatedAt'] = 'updatedAt';
    expressionValues[':now'] = new Date().toISOString();

    await docClient.send(new UpdateCommand({
      TableName: TABLES.USER_POSTS,
      Key: { pk: post.pk, sk: post.sk },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues
    }));
    return true;
  } catch (error) {
    console.error('❌ Error updating user post:', error);
    return false;
  }
}

export async function deleteUserPost(postId: string) {
  try {
    const post = await getUserPost(postId);
    if (!post) return false;
    
    await docClient.send(new DeleteCommand({
      TableName: TABLES.USER_POSTS,
      Key: { pk: post.pk, sk: post.sk }
    }));
    return true;
  } catch (error) {
    console.error('❌ Error deleting user post:', error);
    return false;
  }
}

export async function getAllUserPosts(limit = 50, lastKey?: any) {
  try {
    // Use GSI status-createdAt-index with status='published' for efficient feed query
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.USER_POSTS,
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'published' },
      ScanIndexForward: false, // Sort by createdAt descending
      Limit: limit,
      ExclusiveStartKey: lastKey
    }));
    
    return { items: result.Items || [], lastEvaluatedKey: result.LastEvaluatedKey };
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist or query fails
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      console.log('⚠️ GSI not found, using scan fallback for getAllUserPosts');
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.USER_POSTS,
        Limit: limit
      }));
      
      const items = (result.Items || []).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return { items, lastEvaluatedKey: result.LastEvaluatedKey };
    }
    console.error('❌ Error fetching user posts:', error);
    return { items: [], lastEvaluatedKey: undefined };
  }
}

export async function createLike(userId: string, postId: string) {
  try {
    // Normalize userId to lowercase for consistent matching (Twitter-style: 1 like per user per post)
    const normalizedUserId = userId.toLowerCase();
    const likeId = `${normalizedUserId}_${postId}`;
    
    // Check if user already liked this post
    const existingLike = await userLikedPost(normalizedUserId, postId);
    if (existingLike) {
      console.log(`⚠️ User ${normalizedUserId} already liked post ${postId}`);
      return { alreadyLiked: true, likeId };
    }
    
    // Mutual exclusivity: Remove any existing downtrend when uptrending
    await deleteDowntrend(normalizedUserId, postId);
    
    const item = {
      pk: `like#${likeId}`,
      sk: 'LIKE', // Fixed sk to ensure uniqueness per user/post
      likeId,
      userId: normalizedUserId,
      postId,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({ TableName: TABLES.LIKES, Item: item }));
    console.log(`✅ Like created: ${likeId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating like:', error);
    throw error;
  }
}

export async function deleteLike(userId: string, postId: string) {
  try {
    // Normalize userId to lowercase for consistent matching
    const normalizedUserId = userId.toLowerCase();
    const likeId = `${normalizedUserId}_${postId}`;
    
    // Direct delete using known pk and sk
    await docClient.send(new DeleteCommand({
      TableName: TABLES.LIKES,
      Key: { pk: `like#${likeId}`, sk: 'LIKE' }
    }));
    
    console.log(`✅ Like deleted: ${likeId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting like:', error);
    return false;
  }
}

export async function getPostLikesCount(postId: string) {
  try {
    // Use GSI postId-createdAt-index for efficient count
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.LIKES,
      IndexName: 'postId-createdAt-index',
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: { ':postId': postId },
      Select: 'COUNT'
    }));
    return result.Count || 0;
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.LIKES,
        FilterExpression: 'postId = :postId',
        ExpressionAttributeValues: { ':postId': postId }
      }));
      return result.Count || 0;
    }
    return 0;
  }
}

export async function userLikedPost(userId: string, postId: string) {
  try {
    // Normalize userId to lowercase for consistent matching
    const normalizedUserId = userId.toLowerCase();
    const likeId = `${normalizedUserId}_${postId}`;
    
    // Direct lookup using known pk and sk
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.LIKES,
      Key: { pk: `like#${likeId}`, sk: 'LIKE' }
    }));
    
    return !!result.Item;
  } catch (error) {
    return false;
  }
}

export async function createDowntrend(userId: string, postId: string) {
  try {
    const normalizedUserId = userId.toLowerCase();
    const downtrendId = `${normalizedUserId}_${postId}`;
    
    const existingDowntrend = await userDowntrendedPost(normalizedUserId, postId);
    if (existingDowntrend) {
      console.log(`⚠️ User ${normalizedUserId} already downtrended post ${postId}`);
      return { alreadyDowntrended: true, downtrendId };
    }
    
    await deleteLike(normalizedUserId, postId);
    
    const item = {
      pk: `downtrend#${downtrendId}`,
      sk: 'DOWNTREND',
      downtrendId,
      userId: normalizedUserId,
      postId,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({ TableName: TABLES.DOWNTRENDS, Item: item }));
    console.log(`✅ Downtrend created: ${downtrendId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating downtrend:', error);
    throw error;
  }
}

export async function deleteDowntrend(userId: string, postId: string) {
  try {
    const normalizedUserId = userId.toLowerCase();
    const downtrendId = `${normalizedUserId}_${postId}`;
    
    await docClient.send(new DeleteCommand({
      TableName: TABLES.DOWNTRENDS,
      Key: { pk: `downtrend#${downtrendId}`, sk: 'DOWNTREND' }
    }));
    
    console.log(`✅ Downtrend deleted: ${downtrendId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting downtrend:', error);
    return false;
  }
}

export async function getPostDowntrendsCount(postId: string) {
  try {
    // Use GSI postId-createdAt-index for efficient count
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.DOWNTRENDS,
      IndexName: 'postId-createdAt-index',
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: { ':postId': postId },
      Select: 'COUNT'
    }));
    return result.Count || 0;
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.DOWNTRENDS,
        FilterExpression: 'postId = :postId',
        ExpressionAttributeValues: { ':postId': postId }
      }));
      return result.Count || 0;
    }
    return 0;
  }
}

export async function userDowntrendedPost(userId: string, postId: string) {
  try {
    const normalizedUserId = userId.toLowerCase();
    const downtrendId = `${normalizedUserId}_${postId}`;
    
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.DOWNTRENDS,
      Key: { pk: `downtrend#${downtrendId}`, sk: 'DOWNTREND' }
    }));
    
    return !!result.Item;
  } catch (error) {
    return false;
  }
}

export async function createRetweet(userId: string, postId: string, userDisplayName?: string) {
  try {
    // Normalize userId to lowercase for consistent matching (Twitter-style: 1 repost per user per post)
    const normalizedUserId = userId.toLowerCase();
    const retweetId = `${normalizedUserId}_${postId}`;
    
    // Check if user already retweeted this post
    const existingRetweet = await userRetweetedPost(normalizedUserId, postId);
    if (existingRetweet) {
      console.log(`⚠️ User ${normalizedUserId} already retweeted post ${postId}`);
      return { alreadyRetweeted: true, retweetId };
    }
    
    const item = {
      pk: `retweet#${retweetId}`,
      sk: 'RETWEET', // Fixed sk to ensure uniqueness per user/post
      retweetId,
      userId: normalizedUserId,
      userDisplayName: userDisplayName || userId,
      postId,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({ TableName: TABLES.RETWEETS, Item: item }));
    console.log(`✅ Retweet created: ${retweetId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating retweet:', error);
    throw error;
  }
}

export async function deleteRetweet(userId: string, postId: string) {
  try {
    // Normalize userId to lowercase for consistent matching
    const normalizedUserId = userId.toLowerCase();
    const retweetId = `${normalizedUserId}_${postId}`;
    
    // Direct delete using known pk and sk
    await docClient.send(new DeleteCommand({
      TableName: TABLES.RETWEETS,
      Key: { pk: `retweet#${retweetId}`, sk: 'RETWEET' }
    }));
    
    console.log(`✅ Retweet deleted: ${retweetId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting retweet:', error);
    return false;
  }
}

export async function getPostRetweetsCount(postId: string) {
  try {
    // Use GSI postId-createdAt-index for efficient count
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.RETWEETS,
      IndexName: 'postId-createdAt-index',
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: { ':postId': postId },
      Select: 'COUNT'
    }));
    return result.Count || 0;
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.RETWEETS,
        FilterExpression: 'postId = :postId',
        ExpressionAttributeValues: { ':postId': postId }
      }));
      return result.Count || 0;
    }
    return 0;
  }
}

export async function userRetweetedPost(userId: string, postId: string) {
  try {
    // Normalize userId to lowercase for consistent matching
    const normalizedUserId = userId.toLowerCase();
    const retweetId = `${normalizedUserId}_${postId}`;
    
    // Direct lookup using known pk and sk
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.RETWEETS,
      Key: { pk: `retweet#${retweetId}`, sk: 'RETWEET' }
    }));
    
    return !!result.Item;
  } catch (error) {
    return false;
  }
}

// Get all retweets for a post with user details
export async function getPostRetweets(postId: string) {
  try {
    // Use GSI postId-createdAt-index for efficient lookup
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.RETWEETS,
      IndexName: 'postId-createdAt-index',
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: { ':postId': postId },
      ScanIndexForward: false
    }));
    return result.Items || [];
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.RETWEETS,
        FilterExpression: 'postId = :postId',
        ExpressionAttributeValues: { ':postId': postId }
      }));
      return result.Items || [];
    }
    console.error('❌ Error fetching post retweets:', error);
    return [];
  }
}

export async function createComment(commentData: any) {
  try {
    const commentId = nanoid();
    const timestamp = new Date().toISOString();
    
    const item = {
      pk: `comment#${commentId}`,
      sk: timestamp,
      id: commentId,
      ...commentData,
      createdAt: timestamp
    };

    await docClient.send(new PutCommand({ TableName: TABLES.COMMENTS, Item: item }));
    console.log(`✅ Comment created: ${commentId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    throw error;
  }
}

export async function getPostComments(postId: string) {
  try {
    // Use GSI postId-createdAt-index for efficient lookup
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.COMMENTS,
      IndexName: 'postId-createdAt-index',
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: { ':postId': postId },
      ScanIndexForward: false // Sort by createdAt descending
    }));
    return result.Items || [];
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.COMMENTS,
        FilterExpression: 'postId = :postId',
        ExpressionAttributeValues: { ':postId': postId }
      }));
      return (result.Items || []).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [];
  }
}

export async function getPostCommentsCount(postId: string) {
  try {
    // Use GSI postId-createdAt-index for efficient count
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.COMMENTS,
      IndexName: 'postId-createdAt-index',
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: { ':postId': postId },
      Select: 'COUNT'
    }));
    return result.Count || 0;
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.COMMENTS,
        FilterExpression: 'postId = :postId',
        ExpressionAttributeValues: { ':postId': postId }
      }));
      return result.Count || 0;
    }
    return 0;
  }
}

export async function createFinanceNews(newsData: any) {
  try {
    const newsId = nanoid();
    const timestamp = new Date().toISOString();
    
    const item = {
      pk: `finance-news#${newsId}`,
      sk: timestamp,
      id: newsId,
      ...newsData,
      createdAt: timestamp,
      authorUsername: 'finance_news',
      authorDisplayName: 'Finance News'
    };

    await docClient.send(new PutCommand({ TableName: TABLES.FINANCE_NEWS, Item: item }));
    console.log(`✅ Finance news created: ${newsId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating finance news:', error);
    throw error;
  }
}

export async function getFinanceNews(limit = 20) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.FINANCE_NEWS,
      Limit: limit
    }));
    return (result.Items || []).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    return [];
  }
}

export async function createOrUpdateUserProfile(userId: string, profileData: any) {
  try {
    const timestamp = new Date().toISOString();
    
    // Fetch existing profile first to preserve other fields
    const existingProfile = await getUserProfile(userId);
    console.log(`🔍 existingProfile for ${userId}:`, JSON.stringify(existingProfile));
    
    // Explicitly merge fields to ensure nothing is lost
    const item = {
      pk: `USER#${userId}`,
      sk: 'PROFILE',
      userId,
      ...(existingProfile || {}),
      ...profileData,
      updatedAt: timestamp
    };

    console.log(`💾 Saving item to DynamoDB for ${userId}:`, JSON.stringify(item));
    await docClient.send(new PutCommand({ TableName: TABLES.USER_PROFILES, Item: item }));
    
    // Propagate profile picture and display name updates to other tables
    const propUpdates = [];
    if (profileData.profilePicUrl) {
      propUpdates.push({ field: 'authorAvatar', value: profileData.profilePicUrl });
    }
    if (profileData.displayName) {
      propUpdates.push({ field: 'authorDisplayName', value: profileData.displayName });
    }

    if (propUpdates.length > 0) {
      const username = profileData.username || existingProfile?.username;
      if (username) {
        const normalizedUsername = username.toLowerCase();
        const tablesToSync = [
          { name: TABLES.USER_POSTS, field: 'authorUsername', avatarField: 'authorAvatar', nameField: 'authorDisplayName' },
          { name: TABLES.COMMENTS, field: 'authorUsername', avatarField: 'authorAvatar', nameField: 'authorDisplayName' },
          { name: TABLES.AUDIO_POSTS, field: 'authorUsername', avatarField: 'authorAvatar', nameField: 'authorDisplayName' },
          { name: TABLES.BANNERS, field: 'authorUsername', avatarField: 'authorAvatar', nameField: 'authorDisplayName' }
        ];

        for (const tableConfig of tablesToSync) {
          try {
            console.log(`🔄 Syncing profile to ${tableConfig.name} for user ${normalizedUsername}...`);
            const scanResult = await docClient.send(new ScanCommand({
              TableName: tableConfig.name,
              FilterExpression: `#usrField = :username`,
              ExpressionAttributeNames: { '#usrField': tableConfig.field },
              ExpressionAttributeValues: { ':username': normalizedUsername }
            }));

            if (scanResult.Items && scanResult.Items.length > 0) {
              console.log(`📝 Found ${scanResult.Items.length} items to update in ${tableConfig.name}`);
              for (const record of scanResult.Items) {
                const updateExpressions: string[] = [];
                const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
                const expressionValues: Record<string, any> = { ':now': timestamp };

                let valCounter = 0;
                if (profileData.profilePicUrl) {
                  updateExpressions.push(`#attr${valCounter} = :val${valCounter}`);
                  expressionNames[`#attr${valCounter}`] = tableConfig.avatarField;
                  expressionValues[`:val${valCounter}`] = profileData.profilePicUrl;
                  valCounter++;
                }
                if (profileData.displayName) {
                  updateExpressions.push(`#attr${valCounter} = :val${valCounter}`);
                  expressionNames[`#attr${valCounter}`] = tableConfig.nameField;
                  expressionValues[`:val${valCounter}`] = profileData.displayName;
                  valCounter++;
                }

                if (updateExpressions.length > 0) {
                  await docClient.send(new UpdateCommand({
                    TableName: tableConfig.name,
                    Key: { pk: record.pk, sk: record.sk },
                    UpdateExpression: `SET ${updateExpressions.join(', ')}, #updatedAt = :now`,
                    ExpressionAttributeNames: expressionNames,
                    ExpressionAttributeValues: expressionValues
                  }));
                }
              }
              console.log(`✅ Successfully synced ${tableConfig.name}`);
            }
          } catch (err) {
            console.error(`❌ Failed to sync profile to ${tableConfig.name}:`, err);
          }
        }

        // Also update FOLLOWS table
        try {
          const followerResult = await docClient.send(new ScanCommand({
            TableName: TABLES.FOLLOWS,
            FilterExpression: 'followerUsername = :username',
            ExpressionAttributeValues: { ':username': normalizedUsername }
          }));
          for (const record of (followerResult.Items || [])) {
            const upds: string[] = [];
            const vals: any = {};
            if (profileData.profilePicUrl) { upds.push('followerAvatar = :avatar'); vals[':avatar'] = profileData.profilePicUrl; }
            if (profileData.displayName) { upds.push('followerDisplayName = :name'); vals[':name'] = profileData.displayName; }
            if (upds.length > 0) {
              await docClient.send(new UpdateCommand({
                TableName: TABLES.FOLLOWS,
                Key: { pk: record.pk, sk: record.sk },
                UpdateExpression: `SET ${upds.join(', ')}`,
                ExpressionAttributeValues: vals
              }));
            }
          }

          const followingResult = await docClient.send(new ScanCommand({
            TableName: TABLES.FOLLOWS,
            FilterExpression: 'followingUsername = :username',
            ExpressionAttributeValues: { ':username': normalizedUsername }
          }));
          for (const record of (followingResult.Items || [])) {
            const upds: string[] = [];
            const vals: any = {};
            if (profileData.profilePicUrl) { upds.push('followingAvatar = :avatar'); vals[':avatar'] = profileData.profilePicUrl; }
            if (profileData.displayName) { upds.push('followingDisplayName = :name'); vals[':name'] = profileData.displayName; }
            if (upds.length > 0) {
              await docClient.send(new UpdateCommand({
                TableName: TABLES.FOLLOWS,
                Key: { pk: record.pk, sk: record.sk },
                UpdateExpression: `SET ${upds.join(', ')}`,
                ExpressionAttributeValues: vals
              }));
            }
          }
        } catch (err) {
          console.error(`⚠️ Failed to sync profile to FOLLOWS table:`, err);
        }
      }
    }
    
    // Also update username mapping for lookup by username
    // Use the merged username to ensure mapping stays up to date
    const finalUsername = profileData.username || existingProfile?.username;
    if (finalUsername) {
      const normalizedUsername = finalUsername.toLowerCase();
      const oldUsername = existingProfile?.username ? existingProfile.username.toLowerCase() : null;
      
      // If the username has changed, delete the old mapping and update all linked tables
      if (oldUsername && oldUsername !== normalizedUsername) {
        try {
          console.log(`🔄 Username changed from ${oldUsername} to ${normalizedUsername}. Cascading updates...`);
          
          // 1. Delete the old username mapping
          await docClient.send(new DeleteCommand({
            TableName: TABLES.USER_PROFILES,
            Key: {
              pk: `USERNAME#${oldUsername}`,
              sk: 'MAPPING'
            }
          }));
          console.log(`🗑️ Old username mapping deleted: ${oldUsername}`);

          // 2. Cascade updates to all linked tables
          const tablesToUpdate = [
            { name: TABLES.USER_POSTS, field: 'authorUsername' },
            { name: TABLES.LIKES, field: 'userId' },
            { name: TABLES.DOWNTRENDS, field: 'userId' },
            { name: TABLES.RETWEETS, field: 'userId' },
            { name: TABLES.COMMENTS, field: 'authorUsername' },
            { name: TABLES.AUDIO_POSTS, field: 'authorUsername' },
            { name: TABLES.BANNERS, field: 'authorUsername' }
          ];

          for (const tableConfig of tablesToUpdate) {
            try {
              // Note: For large datasets, this should be done via GSI and BatchWriteItem or a background job.
              // For now, we use a scan and update for simplicity, assuming reasonable data volume.
              const scanResult = await docClient.send(new ScanCommand({
                TableName: tableConfig.name,
                FilterExpression: `#field = :oldUsername`,
                ExpressionAttributeNames: { '#field': tableConfig.field },
                ExpressionAttributeValues: { ':oldUsername': oldUsername }
              }));

              if (scanResult.Items && scanResult.Items.length > 0) {
                console.log(`📝 Updating ${scanResult.Items.length} items in ${tableConfig.name}...`);
                for (const item of scanResult.Items) {
                  await docClient.send(new UpdateCommand({
                    TableName: tableConfig.name,
                    Key: { pk: item.pk, sk: item.sk },
                    UpdateExpression: `SET #field = :newUsername, updatedAt = :now`,
                    ExpressionAttributeNames: { '#field': tableConfig.field },
                    ExpressionAttributeValues: { 
                      ':newUsername': normalizedUsername,
                      ':now': timestamp
                    }
                  }));
                }
              }
            } catch (tableError) {
              console.error(`⚠️ Failed to update items in ${tableConfig.name}:`, tableError);
            }
          }

          // 3. Update FOLLOWS table (both follower and following fields)
          try {
            // Update where user is follower
            const followerResult = await docClient.send(new ScanCommand({
              TableName: TABLES.FOLLOWS,
              FilterExpression: 'followerUsername = :oldUsername',
              ExpressionAttributeValues: { ':oldUsername': oldUsername }
            }));
            for (const item of (followerResult.Items || [])) {
              await docClient.send(new UpdateCommand({
                TableName: TABLES.FOLLOWS,
                Key: { pk: item.pk, sk: item.sk },
                UpdateExpression: 'SET followerUsername = :newUsername, followId = :newFollowId',
                ExpressionAttributeValues: { 
                  ':newUsername': normalizedUsername,
                  ':newFollowId': `${normalizedUsername}_${item.followingUsername}`
                }
              }));
            }

            // Update where user is being followed
            const followingResult = await docClient.send(new ScanCommand({
              TableName: TABLES.FOLLOWS,
              FilterExpression: 'followingUsername = :oldUsername',
              ExpressionAttributeValues: { ':oldUsername': oldUsername }
            }));
            for (const item of (followingResult.Items || [])) {
              await docClient.send(new UpdateCommand({
                TableName: TABLES.FOLLOWS,
                Key: { pk: item.pk, sk: item.sk },
                UpdateExpression: 'SET followingUsername = :newUsername, followId = :newFollowId',
                ExpressionAttributeValues: { 
                  ':newUsername': normalizedUsername,
                  ':newFollowId': `${item.followerUsername}_${normalizedUsername}`
                }
              }));
            }
          } catch (followError) {
            console.error(`⚠️ Failed to update follows for ${oldUsername}:`, followError);
          }

        } catch (delError) {
          console.error(`⚠️ Failed to delete old username mapping or cascade updates for ${oldUsername}:`, delError);
        }
      }

      await docClient.send(new PutCommand({
        TableName: TABLES.USER_PROFILES,
        Item: {
          pk: `USERNAME#${normalizedUsername}`,
          sk: 'MAPPING',
          userId,
          username: normalizedUsername,
          updatedAt: timestamp
        }
      }));
      console.log(`✅ Username mapping updated: ${normalizedUsername} -> ${userId}`);
    }

    console.log(`✅ User profile saved: ${userId}`);
    return item;
  } catch (error) {
    console.error('❌ Error saving user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  try {
    // Use correct key format: USER#userId for pk, PROFILE for sk (matching routes.ts)
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.USER_PROFILES,
      Key: { pk: `USER#${userId}`, sk: 'PROFILE' }
    }));
    
    const profile = result.Item || null;
    if (profile) {
      console.log(`🔍 getUserProfile(${userId}): FOUND - pk=${profile.pk}, username=${profile.username}, DOB=${profile.dob || 'NOT SET'}`);
    } else {
      console.log(`🔍 getUserProfile(${userId}): NOT FOUND`);
    }
    return profile;
  } catch (error) {
    console.error(`❌ getUserProfile error for ${userId}:`, error);
    return null;
  }
}

export async function createAudioPost(audioData: any) {
  try {
    const audioId = nanoid();
    const timestamp = new Date().toISOString();
    
    const item = {
      pk: `audio#${audioId}`,
      sk: timestamp,
      id: audioId,
      ...audioData,
      createdAt: timestamp
    };

    await docClient.send(new PutCommand({ TableName: TABLES.AUDIO_POSTS, Item: item }));
    console.log(`✅ Audio post created: ${audioId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating audio post:', error);
    throw error;
  }
}

export async function createBanner(bannerData: any) {
  try {
    const bannerId = nanoid();
    const timestamp = new Date().toISOString();
    
    const item = {
      pk: `banner#${bannerId}`,
      sk: timestamp,
      id: bannerId,
      ...bannerData,
      createdAt: timestamp
    };

    await docClient.send(new PutCommand({ TableName: TABLES.BANNERS, Item: item }));
    console.log(`✅ Banner created: ${bannerId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating banner:', error);
    throw error;
  }
}

export async function getBanners() {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.BANNERS
    }));
    return result.Items || [];
  } catch (error) {
    return [];
  }
}

export async function createFollow(followerUsername: string, followingUsername: string, followerData?: any, followingData?: any) {
  try {
    // Normalize usernames to lowercase for consistent matching
    const normalizedFollower = followerUsername.toLowerCase();
    const normalizedFollowing = followingUsername.toLowerCase();
    const followId = `${normalizedFollower}_${normalizedFollowing}`;
    const timestamp = new Date().toISOString();
    
    const item = {
      pk: `follow#${followId}`,
      sk: timestamp,
      followId,
      followerUsername: normalizedFollower,
      followingUsername: normalizedFollowing,
      followerDisplayName: followerData?.displayName || followerUsername,
      followingDisplayName: followingData?.displayName || followingUsername,
      followerAvatar: followerData?.profilePicUrl || null,
      followingAvatar: followingData?.profilePicUrl || null,
      createdAt: timestamp
    };

    await docClient.send(new PutCommand({ TableName: TABLES.FOLLOWS, Item: item }));
    console.log(`✅ Follow created: ${normalizedFollower} -> ${normalizedFollowing}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating follow:', error);
    throw error;
  }
}

export async function deleteFollow(followerUsername: string, followingUsername: string) {
  try {
    // Normalize usernames to lowercase for consistent matching
    const normalizedFollower = followerUsername.toLowerCase();
    const normalizedFollowing = followingUsername.toLowerCase();
    const followId = `${normalizedFollower}_${normalizedFollowing}`;
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.FOLLOWS,
      FilterExpression: 'followId = :followId',
      ExpressionAttributeValues: { ':followId': followId }
    }));
    
    if (result.Items && result.Items.length > 0) {
      const item = result.Items[0];
      await docClient.send(new DeleteCommand({
        TableName: TABLES.FOLLOWS,
        Key: { pk: item.pk, sk: item.sk }
      }));
      console.log(`✅ Unfollowed: ${normalizedFollower} -> ${normalizedFollowing}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Error deleting follow:', error);
    return false;
  }
}

export async function isFollowing(followerUsername: string, followingUsername: string): Promise<boolean> {
  try {
    // Normalize usernames to lowercase for consistent matching
    const normalizedFollower = followerUsername.toLowerCase();
    const normalizedFollowing = followingUsername.toLowerCase();
    
    // Use GSI followerUsername-index for efficient lookup
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.FOLLOWS,
      IndexName: 'followerUsername-index',
      KeyConditionExpression: 'followerUsername = :follower AND followingUsername = :following',
      ExpressionAttributeValues: { 
        ':follower': normalizedFollower,
        ':following': normalizedFollowing
      }
    }));
    return (result.Items?.length || 0) > 0;
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const followId = `${followerUsername.toLowerCase()}_${followingUsername.toLowerCase()}`;
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.FOLLOWS,
        FilterExpression: 'followId = :followId',
        ExpressionAttributeValues: { ':followId': followId }
      }));
      return (result.Items?.length || 0) > 0;
    }
    return false;
  }
}

export async function getFollowersCount(username: string): Promise<number> {
  try {
    // Normalize username to lowercase for consistent matching
    const normalizedUsername = username.toLowerCase();
    
    // Use GSI followingUsername-index for efficient count
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.FOLLOWS,
      IndexName: 'followingUsername-index',
      KeyConditionExpression: 'followingUsername = :username',
      ExpressionAttributeValues: { ':username': normalizedUsername },
      Select: 'COUNT'
    }));
    console.log(`📊 getFollowersCount for ${normalizedUsername}: ${result.Count || 0} followers`);
    return result.Count || 0;
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.FOLLOWS,
        FilterExpression: 'followingUsername = :username',
        ExpressionAttributeValues: { ':username': username.toLowerCase() }
      }));
      return result.Count || 0;
    }
    console.error(`❌ Error getting followers count:`, error);
    return 0;
  }
}

export async function getFollowingCount(username: string): Promise<number> {
  try {
    // Normalize username to lowercase for consistent matching
    const normalizedUsername = username.toLowerCase();
    
    // Use GSI followerUsername-index for efficient count
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.FOLLOWS,
      IndexName: 'followerUsername-index',
      KeyConditionExpression: 'followerUsername = :username',
      ExpressionAttributeValues: { ':username': normalizedUsername },
      Select: 'COUNT'
    }));
    console.log(`📊 getFollowingCount for ${normalizedUsername}: ${result.Count || 0} following`);
    return result.Count || 0;
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.FOLLOWS,
        FilterExpression: 'followerUsername = :username',
        ExpressionAttributeValues: { ':username': username.toLowerCase() }
      }));
      return result.Count || 0;
    }
    console.error(`❌ Error getting following count:`, error);
    return 0;
  }
}

export async function getFollowersList(username: string): Promise<any[]> {
  try {
    // Normalize username to lowercase for consistent matching
    const normalizedUsername = username.toLowerCase();
    
    // Use GSI followingUsername-index for efficient lookup
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.FOLLOWS,
      IndexName: 'followingUsername-index',
      KeyConditionExpression: 'followingUsername = :username',
      ExpressionAttributeValues: { ':username': normalizedUsername }
    }));
    
    return (result.Items || []).map((item: any) => ({
      id: item.followerUsername,
      username: item.followerUsername,
      displayName: item.followerDisplayName || item.followerUsername,
      avatar: item.followerAvatar,
      followedAt: item.createdAt
    }));
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.FOLLOWS,
        FilterExpression: 'followingUsername = :username',
        ExpressionAttributeValues: { ':username': username.toLowerCase() }
      }));
      return (result.Items || []).map((item: any) => ({
        id: item.followerUsername,
        username: item.followerUsername,
        displayName: item.followerDisplayName || item.followerUsername,
        avatar: item.followerAvatar,
        followedAt: item.createdAt
      }));
    }
    return [];
  }
}

export async function getFollowingList(username: string): Promise<any[]> {
  try {
    // Normalize username to lowercase for consistent matching
    const normalizedUsername = username.toLowerCase();
    
    // Use GSI followerUsername-index for efficient lookup
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.FOLLOWS,
      IndexName: 'followerUsername-index',
      KeyConditionExpression: 'followerUsername = :username',
      ExpressionAttributeValues: { ':username': normalizedUsername }
    }));
    
    return (result.Items || []).map((item: any) => ({
      id: item.followingUsername,
      username: item.followingUsername,
      displayName: item.followingDisplayName || item.followingUsername,
      avatar: item.followingAvatar,
      followedAt: item.createdAt
    }));
  } catch (error: any) {
    // Fallback to scan if GSI doesn't exist yet
    if (error.message?.includes('index') || error.name === 'ValidationException') {
      const result = await docClient.send(new ScanCommand({
        TableName: TABLES.FOLLOWS,
        FilterExpression: 'followerUsername = :username',
        ExpressionAttributeValues: { ':username': username.toLowerCase() }
      }));
      return (result.Items || []).map((item: any) => ({
        id: item.followingUsername,
        username: item.followingUsername,
        displayName: item.followingDisplayName || item.followingUsername,
        avatar: item.followingAvatar,
        followedAt: item.createdAt
      }));
    }
    return [];
  }
}

export async function getUserProfileByUsername(username: string): Promise<any> {
  try {
    // Normalize to lowercase for consistent matching
    const normalizedUsername = username.toLowerCase();
    
    // Step 1: Get the userId from username mapping (pk: USERNAME#username, sk: MAPPING)
    const mappingResult = await docClient.send(new GetCommand({
      TableName: TABLES.USER_PROFILES,
      Key: {
        pk: `USERNAME#${normalizedUsername}`,
        sk: 'MAPPING'
      }
    }));
    
    if (!mappingResult.Item) {
      console.log(`🖼️ [getUserProfileByUsername] No username mapping found for ${normalizedUsername}`);
      return null;
    }
    
    const userId = mappingResult.Item.userId;
    console.log(`🖼️ [getUserProfileByUsername] Found userId ${userId} for username ${normalizedUsername}`);
    
    // Step 2: Get the actual profile using the userId (pk: USER#userId, sk: PROFILE)
    const profileResult = await docClient.send(new GetCommand({
      TableName: TABLES.USER_PROFILES,
      Key: {
        pk: `USER#${userId}`,
        sk: 'PROFILE'
      }
    }));
    
    const profile = profileResult.Item || null;
    if (profile) {
      console.log(`🖼️ [getUserProfileByUsername] Found profile for ${normalizedUsername}:`, {
        username: profile.username,
        dob: profile.dob,
        hasProfilePicUrl: !!profile.profilePicUrl,
        profilePicUrl: profile.profilePicUrl ? profile.profilePicUrl.substring(0, 60) + '...' : 'NONE'
      });
    }
    return profile;
  } catch (error) {
    console.log(`🖼️ [getUserProfileByUsername] Error for ${username}:`, error);
    return null;
  }
}

// Get all reposts with original post data for feed display
export async function getAllRepostsForFeed() {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.RETWEETS
    }));
    return result.Items || [];
  } catch (error) {
    console.error('❌ Error fetching all reposts:', error);
    return [];
  }
}

// Search users by username prefix for @mention autocomplete
export async function searchUsersByUsernamePrefix(prefix: string, limit = 10): Promise<any[]> {
  try {
    if (!prefix || prefix.length < 1) return [];
    
    const normalizedPrefix = prefix.toLowerCase();
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.USER_PROFILES,
      FilterExpression: 'begins_with(#username, :prefix) OR begins_with(#displayName, :prefix)',
      ExpressionAttributeNames: {
        '#username': 'username',
        '#displayName': 'displayName'
      },
      ExpressionAttributeValues: { 
        ':prefix': normalizedPrefix 
      },
      Limit: limit * 3
    }));
    
    const users = (result.Items || [])
      .filter((item: any) => 
        item.username?.toLowerCase().startsWith(normalizedPrefix) ||
        item.displayName?.toLowerCase().startsWith(normalizedPrefix)
      )
      .slice(0, limit)
      .map((item: any) => ({
        username: item.username,
        displayName: item.displayName || item.username,
        avatar: item.profilePicUrl || item.avatar || null,
        userId: item.userId || item.pk?.replace('USER#', '') || null
      }));
    
    console.log(`🔍 User search for "${prefix}": found ${users.length} users`);
    return users;
  } catch (error) {
    console.error('❌ Error searching users:', error);
    return [];
  }
}

// Create comment with @mention support
export async function createCommentWithMentions(commentData: {
  postId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar?: string | null;
  content: string;
  mentions?: string[];
}) {
  try {
    const commentId = nanoid();
    const timestamp = new Date().toISOString();
    
    // Extract @mentions from content
    const mentionPattern = /@(\w+)/g;
    const extractedMentions = [...(commentData.content.matchAll(mentionPattern))].map(m => m[1].toLowerCase());
    const allMentions = [...new Set([...(commentData.mentions || []), ...extractedMentions])];
    
    const item = {
      pk: `comment#${commentId}`,
      sk: timestamp,
      id: commentId,
      postId: commentData.postId,
      authorUsername: commentData.authorUsername,
      authorDisplayName: commentData.authorDisplayName,
      authorAvatar: commentData.authorAvatar || null,
      content: commentData.content,
      mentions: allMentions,
      createdAt: timestamp,
      updatedAt: timestamp,
      likes: 0
    };

    await docClient.send(new PutCommand({ TableName: TABLES.COMMENTS, Item: item }));
    console.log(`✅ Comment created with ${allMentions.length} mentions: ${commentId}`);
    return item;
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    throw error;
  }
}

// Delete a comment
export async function deleteComment(commentId: string, authorUsername: string): Promise<boolean> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.COMMENTS,
      FilterExpression: 'id = :commentId',
      ExpressionAttributeValues: { ':commentId': commentId }
    }));
    
    if (result.Items && result.Items.length > 0) {
      const comment = result.Items[0];
      
      // Only allow author to delete their own comment
      if (comment.authorUsername?.toLowerCase() !== authorUsername?.toLowerCase()) {
        throw new Error('Not authorized to delete this comment');
      }
      
      await docClient.send(new DeleteCommand({
        TableName: TABLES.COMMENTS,
        Key: { pk: comment.pk, sk: comment.sk }
      }));
      console.log(`✅ Comment deleted: ${commentId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    throw error;
  }
}

// Get comments mentioning a specific user (for notifications)
export async function getCommentsMentioningUser(username: string): Promise<any[]> {
  try {
    const normalizedUsername = username.toLowerCase();
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.COMMENTS,
      FilterExpression: 'contains(mentions, :username)',
      ExpressionAttributeValues: { ':username': normalizedUsername }
    }));
    
    return (result.Items || []).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('❌ Error fetching mention comments:', error);
    return [];
  }
}

// ==================== REPORT BUG FUNCTIONS ====================

export interface BugReport {
  bugId: string;
  username: string;
  emailId: string;
  reportDate: string;
  bugLocate: 'social_feed' | 'journal' | 'others';
  title: string;
  description: string;
  bugMedia: string[];
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

