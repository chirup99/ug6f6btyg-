import { nanoid } from "nanoid";
import { verifyCognitoToken } from './cognito-auth';
import { 
  createUserPost, 
  getUserPost, 
  getAllUserPosts, 
  updateUserPost, 
  deleteUserPost, 
  createLike, 
  deleteLike, 
  userLikedPost, 
  createDowntrend,
  deleteDowntrend,
  userDowntrendedPost,
  getPostDowntrendsCount,
  userRetweetedPost,
  createRetweet, 
  deleteRetweet, 
  createComment, 
  getPostComments, 
  createFinanceNews, 
  getFinanceNews, 
  createOrUpdateUserProfile, 
  getUserProfile,
  getUserProfileByUsername,
  getPostLikesCount,
  getPostRetweetsCount,
  getPostCommentsCount,
  createFollow,
  deleteFollow,
  isFollowing,
  getFollowersCount,
  getFollowingCount,
  getFollowersList,
  getFollowingList,
  getAllRepostsForFeed,
  createBugReport,
  TABLES 
} from './neofeed-dynamodb-migration';

async function getAuthenticatedUser(req: any): Promise<{ userId: string; username: string; displayName: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const cognitoUser = await verifyCognitoToken(token);
  
  if (!cognitoUser) return null;
  
  const profile = await getUserProfile(cognitoUser.sub);
  
  // If no profile exists yet, use Cognito data (email username part)
  if (!profile) {
    const emailUsername = cognitoUser.email ? cognitoUser.email.split('@')[0] : cognitoUser.sub;
    console.log(`⚠️ getAuthenticatedUser: No profile for ${cognitoUser.sub}, using email: ${emailUsername}`);
    return {
      userId: cognitoUser.sub,
      username: emailUsername,
      displayName: emailUsername
    };
  }
  
  console.log(`✅ getAuthenticatedUser: Found profile username=${profile.username}`);
  return {
    userId: cognitoUser.sub,
    username: profile.username,
    displayName: profile.displayName || profile.username
  };
}

// Helper function to enrich posts with real engagement counts and author avatar from DynamoDB
async function enrichPostWithRealCounts(post: any): Promise<any> {
  const [likes, reposts, comments] = await Promise.all([
    getPostLikesCount(post.id),
    getPostRetweetsCount(post.id),
    getPostCommentsCount(post.id)
  ]);
  
  // Fetch author's profile picture if not already present
  let authorAvatar = post.authorAvatar || null;
  if (!authorAvatar && post.authorUsername) {
    try {
      const authorProfile = await getUserProfileByUsername(post.authorUsername);
      if (authorProfile?.profilePicUrl) {
        authorAvatar = authorProfile.profilePicUrl;
        console.log(`🖼️ [AVATAR] Found avatar for ${post.authorUsername}: ${authorAvatar.substring(0, 80)}...`);
      } else {
        console.log(`🖼️ [AVATAR] No profilePicUrl for ${post.authorUsername}, profile found: ${!!authorProfile}`);
      }
    } catch (err) {
      console.log(`🖼️ [AVATAR] Error fetching avatar for ${post.authorUsername}:`, err);
    }
  }
  
  return {
    ...post,
    likes,
    reposts,
    comments,
    authorAvatar
  };
}

export function registerNeoFeedAwsRoutes(app: any) {
  console.log('🔷 Registering NeoFeed AWS DynamoDB routes...');

  // Bug report route
  app.post('/api/report-bug', async (req: any, res: any) => {
    try {
      const user = await getAuthenticatedUser(req);
      const { title, description, tab, imageUrls } = req.body;
      
      const bugData = {
        username: user?.username || "anonymous",
        emailId: user?.username || "anonymous",
        bugLocate: tab === "social-feed" ? "social_feed" : (tab === "journal" ? "journal" : "others"),
        title,
        description,
        bugMedia: imageUrls || []
      };
      
      console.log("🐞 [DEBUG] Submitting bug report:", bugData);
      const result = await createBugReport(bugData);
      res.json(result);
    } catch (error) {
      console.error("❌ Error submitting bug report:", error);
      res.status(500).json({ error: "Failed to submit bug report" });
    }
  });

  // Admin endpoint to check and clean up duplicate likes (Twitter-style: 1 like per user per post)
  app.get('/api/admin/check-likes', async (req: any, res: any) => {
    try {
      const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
      const { docClient } = await import('./neofeed-dynamodb-migration');
      
      const result = await docClient.send(new ScanCommand({
        TableName: 'neofeed-likes'
      }));
      
      const likes = result.Items || [];
      console.log(`📊 Found ${likes.length} total like records`);
      
      // Group likes by postId to find duplicates
      const likesByPost: Record<string, any[]> = {};
      const likesByUserPost: Record<string, any[]> = {};
      
      for (const like of likes) {
        const postId = like.postId;
        const userId = like.userId;
        const key = `${userId}_${postId}`;
        
        if (!likesByPost[postId]) likesByPost[postId] = [];
        likesByPost[postId].push(like);
        
        if (!likesByUserPost[key]) likesByUserPost[key] = [];
        likesByUserPost[key].push(like);
      }
      
      // Find posts with potential duplicates
      const duplicates = Object.entries(likesByUserPost)
        .filter(([, likes]) => likes.length > 1)
        .map(([key, likes]) => ({
          key,
          count: likes.length,
          records: likes.map(l => ({ pk: l.pk, userId: l.userId, postId: l.postId, createdAt: l.createdAt }))
        }));
      
      // Summary by post
      const postSummary = Object.entries(likesByPost).map(([postId, likes]) => ({
        postId,
        totalLikes: likes.length,
        uniqueUsers: new Set(likes.map(l => l.userId)).size,
        users: Array.from(new Set(likes.map(l => l.userId)))
      }));
      
      res.json({ 
        totalLikes: likes.length,
        duplicateGroups: duplicates.length,
        duplicates,
        postSummary
      });
    } catch (error: any) {
      console.error('❌ Error checking likes:', error);
      res.status(500).json({ error: 'Failed to check likes' });
    }
  });

  // Admin endpoint to clean up duplicate likes - keep only 1 like per user per post
  app.post('/api/admin/cleanup-likes', async (req: any, res: any) => {
    try {
      const { ScanCommand, DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
      const { docClient } = await import('./neofeed-dynamodb-migration');
      
      const result = await docClient.send(new ScanCommand({
        TableName: 'neofeed-likes'
      }));
      
      const likes = result.Items || [];
      console.log(`📊 Scanning ${likes.length} like records for duplicates...`);
      
      // Group likes by unique user+post combination
      const likesByUserPost: Record<string, any[]> = {};
      
      for (const like of likes) {
        const key = `${like.userId?.toLowerCase()}_${like.postId}`;
        if (!likesByUserPost[key]) likesByUserPost[key] = [];
        likesByUserPost[key].push(like);
      }
      
      let deletedCount = 0;
      const deletedRecords: any[] = [];
      
      // For each group with duplicates, keep the oldest and delete the rest
      for (const [key, groupLikes] of Object.entries(likesByUserPost)) {
        if (groupLikes.length > 1) {
          // Sort by createdAt, keep oldest
          groupLikes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const toDelete = groupLikes.slice(1); // Delete all except first (oldest)
          
          for (const like of toDelete) {
            await docClient.send(new DeleteCommand({
              TableName: 'neofeed-likes',
              Key: { pk: like.pk, sk: like.sk }
            }));
            deletedCount++;
            deletedRecords.push({ pk: like.pk, userId: like.userId, postId: like.postId });
            console.log(`🗑️ Deleted duplicate like: ${like.pk}`);
          }
        }
      }
      
      console.log(`✅ Cleaned up ${deletedCount} duplicate likes`);
      res.json({ 
        success: true, 
        deleted: deletedCount,
        deletedRecords,
        message: `Removed ${deletedCount} duplicate like records`
      });
    } catch (error: any) {
      console.error('❌ Error cleaning up likes:', error);
      res.status(500).json({ error: 'Failed to cleanup likes' });
    }
  });

  // Admin endpoint to check and clean up duplicate reposts (Twitter-style: 1 repost per user per post)
  app.get('/api/admin/check-reposts', async (req: any, res: any) => {
    try {
      const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
      const { docClient } = await import('./neofeed-dynamodb-migration');
      
      const result = await docClient.send(new ScanCommand({
        TableName: 'neofeed-retweets'
      }));
      
      const reposts = result.Items || [];
      console.log(`📊 Found ${reposts.length} total repost records`);
      
      // Group reposts by unique user+post combination
      const repostsByUserPost: Record<string, any[]> = {};
      
      for (const repost of reposts) {
        const key = `${repost.userId?.toLowerCase()}_${repost.postId}`;
        if (!repostsByUserPost[key]) repostsByUserPost[key] = [];
        repostsByUserPost[key].push(repost);
      }
      
      // Find duplicates
      const duplicates = Object.entries(repostsByUserPost)
        .filter(([, items]) => items.length > 1)
        .map(([key, items]) => ({
          key,
          count: items.length,
          records: items.map(r => ({ pk: r.pk, userId: r.userId, postId: r.postId, createdAt: r.createdAt }))
        }));
      
      res.json({ 
        totalReposts: reposts.length,
        duplicateGroups: duplicates.length,
        duplicates
      });
    } catch (error: any) {
      console.error('❌ Error checking reposts:', error);
      res.status(500).json({ error: 'Failed to check reposts' });
    }
  });

  // Admin endpoint to clean up duplicate reposts
  app.post('/api/admin/cleanup-reposts', async (req: any, res: any) => {
    try {
      const { ScanCommand, DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
      const { docClient } = await import('./neofeed-dynamodb-migration');
      
      const result = await docClient.send(new ScanCommand({
        TableName: 'neofeed-retweets'
      }));
      
      const reposts = result.Items || [];
      console.log(`📊 Scanning ${reposts.length} repost records for duplicates...`);
      
      // Group reposts by unique user+post combination
      const repostsByUserPost: Record<string, any[]> = {};
      
      for (const repost of reposts) {
        const key = `${repost.userId?.toLowerCase()}_${repost.postId}`;
        if (!repostsByUserPost[key]) repostsByUserPost[key] = [];
        repostsByUserPost[key].push(repost);
      }
      
      let deletedCount = 0;
      const deletedRecords: any[] = [];
      
      // For each group with duplicates, keep the oldest and delete the rest
      for (const [key, groupReposts] of Object.entries(repostsByUserPost)) {
        if (groupReposts.length > 1) {
          // Sort by createdAt, keep oldest
          groupReposts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          const toDelete = groupReposts.slice(1);
          
          for (const repost of toDelete) {
            await docClient.send(new DeleteCommand({
              TableName: 'neofeed-retweets',
              Key: { pk: repost.pk, sk: repost.sk }
            }));
            deletedCount++;
            deletedRecords.push({ pk: repost.pk, userId: repost.userId, postId: repost.postId });
            console.log(`🗑️ Deleted duplicate repost: ${repost.pk}`);
          }
        }
      }
      
      console.log(`✅ Cleaned up ${deletedCount} duplicate reposts`);
      res.json({ 
        success: true, 
        deleted: deletedCount,
        deletedRecords,
        message: `Removed ${deletedCount} duplicate repost records`
      });
    } catch (error: any) {
      console.error('❌ Error cleaning up reposts:', error);
      res.status(500).json({ error: 'Failed to cleanup reposts' });
    }
  });

  // Admin endpoint to fix posts with uppercase authorUsername
  app.post('/api/admin/fix-usernames', async (req: any, res: any) => {
    try {
      const { items: userPosts } = await getAllUserPosts(200);
      let fixedCount = 0;
      
      for (const post of userPosts) {
        if (post.authorUsername && post.authorUsername !== post.authorUsername.toLowerCase()) {
          await updateUserPost(post.id, { 
            authorUsername: post.authorUsername.toLowerCase() 
          });
          console.log(`✅ Fixed authorUsername for post ${post.id}: ${post.authorUsername} -> ${post.authorUsername.toLowerCase()}`);
          fixedCount++;
        }
      }
      
      console.log(`✅ Fixed ${fixedCount} posts with uppercase authorUsername`);
      res.json({ success: true, fixed: fixedCount });
    } catch (error: any) {
      console.error('❌ Error fixing usernames:', error);
      res.status(500).json({ error: 'Failed to fix usernames' });
    }
  });

  // Admin endpoint to list and fix follow records with uppercase usernames
  app.get('/api/admin/follow-records', async (req: any, res: any) => {
    try {
      const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
      const { docClient } = await import('./neofeed-dynamodb-migration');
      
      const result = await docClient.send(new ScanCommand({
        TableName: 'neofeed-follows'
      }));
      
      const records = result.Items || [];
      console.log(`📊 Found ${records.length} follow records`);
      
      // Check for case issues
      const caseIssues = records.filter((r: any) => 
        (r.followerUsername && r.followerUsername !== r.followerUsername.toLowerCase()) ||
        (r.followingUsername && r.followingUsername !== r.followingUsername.toLowerCase())
      );
      
      res.json({ 
        total: records.length, 
        caseIssues: caseIssues.length,
        records: records.map((r: any) => ({
          followId: r.followId,
          followerUsername: r.followerUsername,
          followingUsername: r.followingUsername,
          createdAt: r.createdAt
        }))
      });
    } catch (error: any) {
      console.error('❌ Error fetching follow records:', error);
      res.status(500).json({ error: 'Failed to fetch follow records' });
    }
  });

  // Admin endpoint to fix follow records with uppercase usernames
  app.post('/api/admin/fix-follow-records', async (req: any, res: any) => {
    try {
      const { ScanCommand, DeleteCommand, PutCommand } = await import('@aws-sdk/lib-dynamodb');
      const { docClient } = await import('./neofeed-dynamodb-migration');
      
      const result = await docClient.send(new ScanCommand({
        TableName: 'neofeed-follows'
      }));
      
      const records = result.Items || [];
      let fixedCount = 0;
      
      for (const record of records) {
        const followerLower = record.followerUsername?.toLowerCase();
        const followingLower = record.followingUsername?.toLowerCase();
        
        // Check if any username needs fixing
        if (record.followerUsername !== followerLower || record.followingUsername !== followingLower) {
          // Delete old record
          await docClient.send(new DeleteCommand({
            TableName: 'neofeed-follows',
            Key: { pk: record.pk, sk: record.sk }
          }));
          
          // Create new record with lowercase usernames
          const newFollowId = `${followerLower}_${followingLower}`;
          const newRecord = {
            ...record,
            pk: `follow#${newFollowId}`,
            followId: newFollowId,
            followerUsername: followerLower,
            followingUsername: followingLower
          };
          
          await docClient.send(new PutCommand({
            TableName: 'neofeed-follows',
            Item: newRecord
          }));
          
          console.log(`✅ Fixed follow record: ${record.followerUsername} -> ${record.followingUsername} (now lowercase)`);
          fixedCount++;
        }
      }
      
      console.log(`✅ Fixed ${fixedCount} follow records with uppercase usernames`);
      res.json({ success: true, fixed: fixedCount, total: records.length });
    } catch (error: any) {
      console.error('❌ Error fixing follow records:', error);
      res.status(500).json({ error: 'Failed to fix follow records' });
    }
  });

  app.get('/api/social-posts', async (req: any, res: any) => {
    try {
      console.log('📱 Fetching social posts from AWS DynamoDB');
      
      const { items: userPosts } = await getAllUserPosts(100);
      const financePosts = await getFinanceNews(20);
      
      // User posts now include reposts stored as separate entries with isRepost: true
      // No need to dynamically create repost feed items anymore
      const allPosts = [
        ...userPosts.map((post: any) => ({ ...post, source: 'aws' })),
        ...financePosts.map((post: any) => ({ ...post, source: 'aws', isFinanceNews: true }))
      ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Fetch real engagement counts for all posts from DynamoDB tables
      const enrichedPosts = await Promise.all(
        allPosts.map(post => enrichPostWithRealCounts(post))
      );
      
      const repostCount = userPosts.filter((p: any) => p.isRepost).length;
      console.log(`✅ Retrieved ${enrichedPosts.length} posts from AWS DynamoDB (including ${repostCount} reposts) with real engagement counts`);
      res.json(enrichedPosts);
    } catch (error: any) {
      console.error('❌ Error fetching posts from AWS:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Get posts by specific username - faster for profile pages
  app.get('/api/social-posts/by-user/:username', async (req: any, res: any) => {
    try {
      const { username } = req.params;
      console.log(`📱 Fetching posts for user: ${username}`);
      
      const { items: userPosts } = await getAllUserPosts(100);
      
      // Filter posts by authorUsername matching the requested username (case-insensitive)
      const matchingPosts = userPosts.filter((post: any) => 
        post.authorUsername?.toLowerCase() === username?.toLowerCase()
      );
      
      // Fetch real engagement counts for matching posts
      const enrichedPosts = await Promise.all(
        matchingPosts.map(post => enrichPostWithRealCounts(post))
      );
      
      console.log(`✅ Found ${enrichedPosts.length} posts for user ${username} with real engagement counts`);
      
      res.json(enrichedPosts);
    } catch (error: any) {
      console.error('❌ Error fetching user posts:', error);
      res.status(500).json({ error: 'Failed to fetch user posts' });
    }
  });

  app.post('/api/social-posts', async (req: any, res: any) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🚀 [${requestId}] Creating post on AWS DynamoDB`);
    
    try {
      const { userId, content, stockMentions, sentiment, tags, hasImage, imageUrl, isAudioPost, selectedPostIds, selectedPosts, authorUsername, authorDisplayName, authorAvatar } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Post content is required' });
      }

      // Fetch author's profile picture if not provided
      let finalAuthorAvatar = authorAvatar || null;
      if (!finalAuthorAvatar && authorUsername) {
        try {
          const authorProfile = await getUserProfileByUsername(authorUsername.toLowerCase());
          if (authorProfile?.profilePicUrl) {
            finalAuthorAvatar = authorProfile.profilePicUrl;
          }
        } catch (err) {
          // Avatar is optional, continue without it
        }
      }

      const postData = {
        content: content.trim(),
        authorUsername: (authorUsername || 'anonymous').toLowerCase(),
        authorDisplayName: authorDisplayName || 'User',
        authorAvatar: finalAuthorAvatar,
        userId: userId || nanoid(),
        stockMentions: stockMentions || [],
        sentiment: sentiment || 'neutral',
        tags: tags || [],
        hasImage: hasImage || false,
        imageUrl: imageUrl || null,
        isAudioPost: isAudioPost || false,
        selectedPostIds: selectedPostIds || [],
        selectedPosts: selectedPosts || []
      };

      const createdPost = await createUserPost(postData);
      console.log(`✅ [${requestId}] Post created on AWS: ${createdPost.id}`);
      res.json(createdPost);
    } catch (error: any) {
      console.error(`❌ [${requestId}] Error creating post:`, error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.delete('/api/social-posts/:postId', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.body?.userId;

      const post = await getUserPost(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (userId && post.userId !== userId) {
        return res.status(403).json({ error: 'You can only delete your own posts' });
      }

      await deleteUserPost(postId);
      console.log(`✅ Post ${postId} deleted from AWS`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('❌ Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });

  app.put('/api/social-posts/:postId', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const { content, userId } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Post content is required' });
      }

      const post = await getUserPost(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (userId && post.userId !== userId) {
        return res.status(403).json({ error: 'You can only edit your own posts' });
      }

      await updateUserPost(postId, { content: content.trim() });
      console.log(`✅ Post ${postId} updated on AWS`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('❌ Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  });

  app.post('/api/social-posts/:id/like', async (req: any, res: any) => {
    try {
      const postId = req.params.id;
      const userId = req.body?.userId || 'anonymous';

      const alreadyLiked = await userLikedPost(userId, postId);
      if (alreadyLiked) {
        const count = await getPostLikesCount(postId);
        return res.json({ success: true, liked: true, likes: count });
      }

      await createLike(userId, postId);
      const count = await getPostLikesCount(postId);
      console.log(`✅ Post ${postId} liked by ${userId}`);
      res.json({ success: true, liked: true, likes: count });
    } catch (error: any) {
      console.error('❌ Error liking post:', error);
      res.status(500).json({ error: 'Failed to like post' });
    }
  });

  app.delete('/api/social-posts/:id/like', async (req: any, res: any) => {
    try {
      const postId = req.params.id;
      const userId = req.body?.userId || 'anonymous';

      await deleteLike(userId, postId);
      const count = await getPostLikesCount(postId);
      console.log(`✅ Post ${postId} unliked by ${userId}`);
      res.json({ success: true, liked: false, likes: count });
    } catch (error: any) {
      console.error('❌ Error unliking post:', error);
      res.status(500).json({ error: 'Failed to unlike post' });
    }
  });

  app.post('/api/social-posts/:id/repost', async (req: any, res: any) => {
    try {
      const postId = req.params.id;
      const userId = req.body?.userId || 'anonymous';

      await createRetweet(userId, postId);
      const count = await getPostRetweetsCount(postId);
      console.log(`✅ Post ${postId} retweeted by ${userId}`);
      res.json({ success: true, reposts: count });
    } catch (error: any) {
      console.error('❌ Error retweeting:', error);
      res.status(500).json({ error: 'Failed to retweet' });
    }
  });

  app.delete('/api/social-posts/:id/repost', async (req: any, res: any) => {
    try {
      const postId = req.params.id;
      const userId = req.body?.userId || 'anonymous';

      await deleteRetweet(userId, postId);
      const count = await getPostRetweetsCount(postId);
      console.log(`✅ Post ${postId} retweet removed by ${userId}`);
      res.json({ success: true, reposts: count });
    } catch (error: any) {
      console.error('❌ Error removing retweet:', error);
      res.status(500).json({ error: 'Failed to remove retweet' });
    }
  });

  app.post('/api/social-posts/:id/comment', async (req: any, res: any) => {
    try {
      const postId = req.params.id;
      const { content, userId, authorUsername, authorDisplayName } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const comment = await createComment({
        postId,
        content: content.trim(),
        userId: userId || 'anonymous',
        authorUsername: (authorUsername || 'anonymous').toLowerCase(),
        authorDisplayName: authorDisplayName || 'User'
      });

      const count = await getPostCommentsCount(postId);
      console.log(`✅ Comment added to post ${postId}`);
      res.json({ ...comment, comments: count });
    } catch (error: any) {
      console.error('❌ Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  app.get('/api/social-posts/:postId/comments-list', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const comments = await getPostComments(postId);
      res.json(comments || []);
    } catch (error: any) {
      console.error('❌ Error fetching comments:', error);
      res.json([]);
    }
  });

  app.get('/api/social-posts/:id/comments', async (req: any, res: any) => {
    try {
      const postId = req.params.id;
      const comments = await getPostComments(postId);
      res.json(comments || []);
    } catch (error: any) {
      console.error('❌ Error fetching comments:', error);
      res.json([]);
    }
  });

  app.post('/api/social-posts/:postId/like-v2', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.body?.userId || 'anonymous';

      await createLike(userId, postId);
      const count = await getPostLikesCount(postId);
      res.json({ success: true, liked: true, likes: count });
    } catch (error: any) {
      console.error('❌ Error liking post:', error);
      res.status(500).json({ error: 'Failed to like post' });
    }
  });

  app.delete('/api/social-posts/:postId/like-v2', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      // Support userId from both query params (preferred for DELETE) and body (fallback)
      const userId = req.query?.userId || req.body?.userId || 'anonymous';
      
      console.log(`🗑️ Unlike request: postId=${postId}, userId=${userId}`);
      
      // Check if user actually liked this post first
      const wasLiked = await userLikedPost(userId, postId);
      if (!wasLiked) {
        const count = await getPostLikesCount(postId);
        console.log(`⚠️ User ${userId} has not liked post ${postId}, nothing to delete`);
        return res.json({ success: true, liked: false, likes: count, wasNotLiked: true });
      }

      await deleteLike(userId, postId);
      const count = await getPostLikesCount(postId);
      console.log(`✅ Post ${postId} unliked by ${userId}, new count: ${count}`);
      res.json({ success: true, liked: false, likes: count });
    } catch (error: any) {
      console.error('❌ Error unliking post:', error);
      res.status(500).json({ error: 'Failed to unlike post' });
    }
  });

  app.get('/api/social-posts/:postId/like-status', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.query?.userId || 'anonymous';
      const liked = await userLikedPost(userId as string, postId);
      const count = await getPostLikesCount(postId);
      res.json({ liked, likes: count });
    } catch (error: any) {
      res.json({ liked: false, likes: 0 });
    }
  });

  app.post('/api/social-posts/:postId/downtrend', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.body?.userId || 'anonymous';

      await createDowntrend(userId, postId);
      const downtrendCount = await getPostDowntrendsCount(postId);
      const uptrendCount = await getPostLikesCount(postId);
      console.log(`📉 Post ${postId} downtrended by ${userId}`);
      res.json({ success: true, downtrended: true, downtrends: downtrendCount, uptrends: uptrendCount });
    } catch (error: any) {
      console.error('❌ Error downtrending post:', error);
      res.status(500).json({ error: 'Failed to downtrend post' });
    }
  });

  app.delete('/api/social-posts/:postId/downtrend', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.query?.userId || req.body?.userId || 'anonymous';
      
      console.log(`🗑️ Remove downtrend request: postId=${postId}, userId=${userId}`);
      
      const wasDowntrended = await userDowntrendedPost(userId, postId);
      if (!wasDowntrended) {
        const count = await getPostDowntrendsCount(postId);
        console.log(`⚠️ User ${userId} has not downtrended post ${postId}, nothing to delete`);
        return res.json({ success: true, downtrended: false, downtrends: count, wasNotDowntrended: true });
      }

      await deleteDowntrend(userId, postId);
      const count = await getPostDowntrendsCount(postId);
      console.log(`✅ Post ${postId} downtrend removed by ${userId}, new count: ${count}`);
      res.json({ success: true, downtrended: false, downtrends: count });
    } catch (error: any) {
      console.error('❌ Error removing downtrend:', error);
      res.status(500).json({ error: 'Failed to remove downtrend' });
    }
  });

  app.get('/api/social-posts/:postId/downtrend-status', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.query?.userId || 'anonymous';
      const downtrended = await userDowntrendedPost(userId as string, postId);
      const count = await getPostDowntrendsCount(postId);
      res.json({ downtrended, downtrends: count });
    } catch (error: any) {
      res.json({ downtrended: false, downtrends: 0 });
    }
  });

  app.get('/api/social-posts/:postId/vote-status', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.query?.userId || 'anonymous';
      const [uptrended, downtrended, uptrendCount, downtrendCount] = await Promise.all([
        userLikedPost(userId as string, postId),
        userDowntrendedPost(userId as string, postId),
        getPostLikesCount(postId),
        getPostDowntrendsCount(postId)
      ]);
      res.json({ uptrended, downtrended, uptrends: uptrendCount, downtrends: downtrendCount });
    } catch (error: any) {
      res.json({ uptrended: false, downtrended: false, uptrends: 0, downtrends: 0 });
    }
  });

  app.post('/api/social-posts/:postId/retweet', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.body?.userId || 'anonymous';
      const userDisplayName = req.body?.userDisplayName || userId;
      const userUsername = req.body?.userUsername || userId;

      // Check if user already reposted this post
      const alreadyReposted = await userRetweetedPost(userId, postId);
      if (alreadyReposted) {
        const count = await getPostRetweetsCount(postId);
        console.log(`⚠️ User ${userId} already reposted this post`);
        return res.json({ success: true, alreadyReposted: true, reposts: count });
      }

      // Fetch the original post to get its content and author info
      let originalPost: any = await getUserPost(postId);
      if (!originalPost) {
        // Check finance news if not found in user posts
        const financeNews = await getFinanceNews(100);
        originalPost = financeNews.find((p: any) => p.id === postId);
      }
      
      if (!originalPost) {
        return res.status(404).json({ error: 'Original post not found' });
      }

      // Twitter/X-style: If reposting a repost, trace back to the TRUE original author
      // This ensures "repost of a repost" always shows the original creator, not intermediary
      let trueOriginalPostId = postId;
      let trueOriginalAuthorUsername = originalPost.authorUsername;
      let trueOriginalAuthorDisplayName = originalPost.authorDisplayName;
      let trueOriginalAuthorAvatar = originalPost.authorAvatar || null;
      let trueOriginalAuthorVerified = originalPost.authorVerified || false;

      if (originalPost.isRepost && originalPost.originalPostId) {
        // This post is already a repost - use its original author info (already traced to root)
        trueOriginalPostId = originalPost.originalPostId;
        trueOriginalAuthorUsername = originalPost.originalAuthorUsername || originalPost.authorUsername;
        trueOriginalAuthorDisplayName = originalPost.originalAuthorDisplayName || originalPost.authorDisplayName;
        trueOriginalAuthorAvatar = originalPost.originalAuthorAvatar || originalPost.authorAvatar || null;
        trueOriginalAuthorVerified = originalPost.originalAuthorVerified || originalPost.authorVerified || false;
        console.log(`🔄 Reposting a repost - tracing to true original: ${trueOriginalPostId} by @${trueOriginalAuthorUsername}`);
      }

      // Create a NEW post entry as a repost with its own engagement counts
      const repostData = {
        content: originalPost.content,
        authorUsername: (userUsername || 'anonymous').toLowerCase(),
        authorDisplayName: userDisplayName,
        userId: userId,
        // Repost-specific fields - always point to TRUE original author
        isRepost: true,
        originalPostId: trueOriginalPostId,
        originalAuthorUsername: trueOriginalAuthorUsername,
        originalAuthorDisplayName: trueOriginalAuthorDisplayName,
        originalAuthorAvatar: trueOriginalAuthorAvatar,
        originalAuthorVerified: trueOriginalAuthorVerified,
        // Copy original post's media/tags
        stockMentions: originalPost.stockMentions || [],
        sentiment: originalPost.sentiment || 'neutral',
        tags: originalPost.tags || [],
        hasImage: originalPost.hasImage || false,
        imageUrl: originalPost.imageUrl || null,
        isAudioPost: false,
        selectedPostIds: [],
        selectedPosts: []
      };

      // Create the repost as a new post with its own ID and engagement counts (likes:0, comments:0, reposts:0)
      const createdRepost = await createUserPost(repostData);
      
      // Also track in retweets table (for the original post's repost count)
      await createRetweet(userId, postId, userDisplayName);
      const originalRepostCount = await getPostRetweetsCount(postId);
      
      console.log(`✅ Repost created: User ${userId} reposted post ${postId}, new repost ID: ${createdRepost.id}`);
      res.json({ 
        success: true, 
        retweeted: true,
        reposts: originalRepostCount,
        repostId: createdRepost.id,
        repost: createdRepost
      });
    } catch (error: any) {
      console.error('❌ Error retweeting:', error);
      res.status(500).json({ error: 'Failed to retweet' });
    }
  });

  app.delete('/api/social-posts/:postId/retweet', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.body?.userId || 'anonymous';

      // Delete the retweet tracking record
      await deleteRetweet(userId, postId);
      
      // Also find and delete the user's repost post entry
      const { items: userPosts } = await getAllUserPosts(200);
      const repostPost = userPosts.find((p: any) => 
        p.isRepost === true && 
        p.originalPostId === postId && 
        p.userId === userId
      );
      
      if (repostPost) {
        await deleteUserPost(repostPost.id);
        console.log(`✅ Deleted repost post ${repostPost.id} for original ${postId}`);
      }
      
      const count = await getPostRetweetsCount(postId);
      res.json({ success: true, retweeted: false, reposts: count });
    } catch (error: any) {
      console.error('❌ Error removing retweet:', error);
      res.status(500).json({ error: 'Failed to remove retweet' });
    }
  });

  app.get('/api/social-posts/:postId/retweet-status', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const userId = req.query?.userId || 'anonymous';
      const retweeted = await userRetweetedPost(userId as string, postId);
      const count = await getPostRetweetsCount(postId);
      res.json({ retweeted, reposts: count });
    } catch (error: any) {
      res.json({ retweeted: false, reposts: 0 });
    }
  });

  app.post('/api/social-posts/:postId/comments', async (req: any, res: any) => {
    try {
      const { postId } = req.params;
      const { content, userId, authorUsername, authorDisplayName } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const comment = await createComment({
        postId,
        content: content.trim(),
        userId: userId || 'anonymous',
        authorUsername: (authorUsername || 'anonymous').toLowerCase(),
        authorDisplayName: authorDisplayName || 'User'
      });

      res.json(comment);
    } catch (error: any) {
      console.error('❌ Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  app.get('/api/neofeed/user-profile/:userId', async (req: any, res: any) => {
    try {
      const { userId } = req.params;
      const profile = await getUserProfile(userId);
      if (profile) {
        res.json(profile);
      } else {
        res.status(404).json({ error: 'Profile not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  app.post('/api/neofeed/user-profile', async (req: any, res: any) => {
    try {
      const { userId, ...profileData } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const profile = await createOrUpdateUserProfile(userId, profileData);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to save profile' });
    }
  });

  app.post('/api/neofeed/finance-news', async (req: any, res: any) => {
    try {
      const newsData = req.body;
      const news = await createFinanceNews(newsData);
      res.json(news);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create finance news' });
    }
  });

  // Simple unified profile stats endpoint - one call gets everything
  app.get('/api/profile/:username/stats', async (req: any, res: any) => {
    try {
      const username = req.params.username;
      console.log(`📊 Fetching stats for: ${username}`);
      
      if (!username) {
        return res.json({ followers: 0, following: 0, isFollowing: false });
      }
      
      // Get counts directly from DynamoDB
      const [followers, following] = await Promise.all([
        getFollowersCount(username),
        getFollowingCount(username)
      ]);
      
      // Check if current user is following this profile
      let userIsFollowing = false;
      const currentUser = await getAuthenticatedUser(req);
      if (currentUser && currentUser.username !== username) {
        userIsFollowing = await isFollowing(currentUser.username, username);
      }
      
      console.log(`✅ Stats for ${username}: ${followers} followers, ${following} following`);
      res.json({ followers, following, isFollowing: userIsFollowing });
    } catch (error: any) {
      console.error('❌ Error getting profile stats:', error);
      res.json({ followers: 0, following: 0, isFollowing: false });
    }
  });

  app.get('/api/users/:username/followers-count', async (req: any, res: any) => {
    try {
      const username = req.params.username;
      if (!username) {
        return res.json({ followers: 0, following: 0 });
      }
      
      const followers = await getFollowersCount(username);
      const following = await getFollowingCount(username);
      
      console.log(`✅ Follower counts for ${username}: ${followers} followers, ${following} following`);
      res.json({ followers, following });
    } catch (error: any) {
      console.error('❌ Error getting follower counts:', error);
      res.json({ followers: 0, following: 0 });
    }
  });

  app.get('/api/users/:username/followers-list', async (req: any, res: any) => {
    try {
      const username = req.params.username;
      if (!username) {
        return res.json({ followers: [] });
      }
      
      const followers = await getFollowersList(username);
      console.log(`✅ Retrieved ${followers.length} followers for ${username}`);
      res.json({ followers });
    } catch (error: any) {
      console.error('❌ Error getting followers list:', error);
      res.json({ followers: [] });
    }
  });

  app.get('/api/users/:username/following-list', async (req: any, res: any) => {
    try {
      const username = req.params.username;
      if (!username) {
        return res.json({ following: [] });
      }
      
      const following = await getFollowingList(username);
      console.log(`✅ Retrieved ${following.length} following for ${username}`);
      res.json({ following });
    } catch (error: any) {
      console.error('❌ Error getting following list:', error);
      res.json({ following: [] });
    }
  });

  app.get('/api/users/:username/follow-status', async (req: any, res: any) => {
    try {
      const targetUsername = req.params.username;
      
      const currentUser = await getAuthenticatedUser(req);
      if (!currentUser) {
        return res.json({ following: false });
      }
      
      if (!targetUsername) {
        return res.json({ following: false });
      }
      
      const following = await isFollowing(currentUser.username, targetUsername);
      console.log(`🔍 Follow status check: ${currentUser.username} -> ${targetUsername}: ${following}`);
      res.json({ following });
    } catch (error: any) {
      console.error('❌ Error checking follow status:', error);
      res.json({ following: false });
    }
  });

  app.post('/api/users/:username/follow', async (req: any, res: any) => {
    try {
      const targetUsername = req.params.username;
      const { targetUserData } = req.body;
      
      console.log(`📥 FOLLOW REQUEST: target=${targetUsername}`);
      
      const currentUser = await getAuthenticatedUser(req);
      if (!currentUser) {
        console.log('❌ FOLLOW: No authenticated user');
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      console.log(`📥 FOLLOW: currentUser=${currentUser.username}, target=${targetUsername}`);
      
      if (!targetUsername) {
        return res.status(400).json({ error: 'Target username is required' });
      }
      
      if (currentUser.username.toLowerCase() === targetUsername.toLowerCase()) {
        console.log('❌ FOLLOW: Cannot follow yourself');
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }
      
      const alreadyFollowing = await isFollowing(currentUser.username, targetUsername);
      console.log(`🔍 FOLLOW: Already following check: ${alreadyFollowing}`);
      
      if (alreadyFollowing) {
        const targetFollowers = await getFollowersCount(targetUsername);
        const targetFollowing = await getFollowingCount(targetUsername);
        const currentUserFollowing = await getFollowingCount(currentUser.username);
        const currentUserFollowers = await getFollowersCount(currentUser.username);
        console.log(`⚠️ ${currentUser.username} already follows ${targetUsername} - returning following: true`);
        return res.json({ 
          success: true, 
          following: true, 
          targetUser: { followers: targetFollowers, following: targetFollowing },
          currentUser: { followers: currentUserFollowers, following: currentUserFollowing }
        });
      }
      
      console.log(`🔄 FOLLOW: Creating new follow record: ${currentUser.username} -> ${targetUsername}`);
      
      await createFollow(
        currentUser.username, 
        targetUsername, 
        { displayName: currentUser.displayName }, 
        targetUserData
      );
      
      // Get updated counts for both users
      const targetFollowers = await getFollowersCount(targetUsername);
      const targetFollowing = await getFollowingCount(targetUsername);
      const currentUserFollowing = await getFollowingCount(currentUser.username);
      const currentUserFollowers = await getFollowersCount(currentUser.username);
      
      console.log(`✅ FOLLOW SUCCESS: ${currentUser.username} followed ${targetUsername}`);
      console.log(`   Target ${targetUsername}: ${targetFollowers} followers, ${targetFollowing} following`);
      console.log(`   Current ${currentUser.username}: ${currentUserFollowers} followers, ${currentUserFollowing} following`);
      console.log(`   Returning: following: true`);
      
      res.json({ 
        success: true, 
        following: true, 
        targetUser: { followers: targetFollowers, following: targetFollowing },
        currentUser: { followers: currentUserFollowers, following: currentUserFollowing }
      });
    } catch (error: any) {
      console.error('❌ Error following user:', error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  });

  app.post('/api/users/:username/unfollow', async (req: any, res: any) => {
    try {
      const targetUsername = req.params.username;
      
      console.log(`📤 UNFOLLOW REQUEST: target=${targetUsername}`);
      
      const currentUser = await getAuthenticatedUser(req);
      if (!currentUser) {
        console.log('❌ UNFOLLOW: No authenticated user');
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      console.log(`📤 UNFOLLOW: currentUser=${currentUser.username}, target=${targetUsername}`);
      
      if (!targetUsername) {
        return res.status(400).json({ error: 'Target username is required' });
      }
      
      console.log(`🔄 UNFOLLOW: Deleting follow record: ${currentUser.username} -> ${targetUsername}`);
      
      await deleteFollow(currentUser.username, targetUsername);
      
      // Get updated counts for both users
      const targetFollowers = await getFollowersCount(targetUsername);
      const targetFollowing = await getFollowingCount(targetUsername);
      const currentUserFollowing = await getFollowingCount(currentUser.username);
      const currentUserFollowers = await getFollowersCount(currentUser.username);
      
      console.log(`✅ UNFOLLOW SUCCESS: ${currentUser.username} unfollowed ${targetUsername}`);
      console.log(`   Target ${targetUsername}: ${targetFollowers} followers, ${targetFollowing} following`);
      console.log(`   Current ${currentUser.username}: ${currentUserFollowers} followers, ${currentUserFollowing} following`);
      console.log(`   Returning: following: false`);
      
      res.json({ 
        success: true, 
        following: false, 
        targetUser: { followers: targetFollowers, following: targetFollowing },
        currentUser: { followers: currentUserFollowers, following: currentUserFollowing }
      });
    } catch (error: any) {
      console.error('❌ Error unfollowing user:', error);
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  });

  app.get('/api/users/:username/profile', async (req: any, res: any) => {
    try {
      const username = req.params.username;
      const profile = await getUserProfileByUsername(username);
      
      if (profile) {
        const followers = await getFollowersCount(username);
        const following = await getFollowingCount(username);
        res.json({ 
          ...profile, 
          followers, 
          following 
        });
      } else {
        res.status(404).json({ error: 'Profile not found' });
      }
    } catch (error: any) {
      console.error('❌ Error getting user profile:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  app.post('/api/auth/cognito', async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const cognitoUser = await verifyCognitoToken(token);
      
      if (!cognitoUser) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { email, name: displayName, displayName: userDisplayName } = req.body;
      const searchEmail = (email || cognitoUser.email || '').toLowerCase();
      
      console.log(`👤 [Auth Sync] Cognito sub: ${cognitoUser.sub}, Email: ${searchEmail}`);
      
      // Step 1: Identity Resolution - Check if email is already linked to a userId
      let finalUserId = cognitoUser.sub;
      let accountLinked = false;

      if (searchEmail) {
        try {
          // Exactly match the email as provided (no Gmail normalization per user request)
          const normalizedSearchEmail = searchEmail;

          const { GetCommand, PutCommand } = await import('@aws-sdk/lib-dynamodb');
          const { docClient } = await import('./neofeed-dynamodb-migration');

          // Check for existing link in USER_PROFILES using Email as key
          // This allows multiple login methods (Password, Google) to map to same profile
          const emailLinkResult = await docClient.send(new GetCommand({
            TableName: TABLES.USER_PROFILES,
            Key: {
              pk: `USER_EMAIL#${normalizedSearchEmail}`,
              sk: 'IDENTITY_LINK'
            }
          }));

          if (emailLinkResult.Item && emailLinkResult.Item.userId) {
            finalUserId = emailLinkResult.Item.userId;
            accountLinked = true;
            console.log(`🔗 [Auth Sync] Account linked via email! ${cognitoUser.sub} -> ${finalUserId}`);
            
            // Create a mapping from this specific Cognito sub to the canonical userId
            // This speeds up future identity resolution in middleware
            await docClient.send(new PutCommand({
              TableName: TABLES.USER_PROFILES,
              Item: {
                pk: `USER#${cognitoUser.sub}`,
                sk: 'IDENTITY_MAPPING',
                canonicalUserId: finalUserId,
                linkedAt: new Date().toISOString()
              }
            }));
          } else {
            // No link exists, create one for this email
            await docClient.send(new PutCommand({
              TableName: TABLES.USER_PROFILES,
              Item: {
                pk: `USER_EMAIL#${normalizedSearchEmail}`,
                sk: 'IDENTITY_LINK',
                userId: finalUserId,
                createdAt: new Date().toISOString()
              }
            }));
            console.log(`📝 [Auth Sync] Created new identity link for email: ${normalizedSearchEmail}`);
          }
        } catch (linkError) {
          console.warn('⚠️ [Auth Sync] Identity resolution failed:', linkError);
        }
      }

      // Step 2: Ensure profile exists for the canonical userId
      const existingProfile = await getUserProfile(finalUserId);
      
      if (!existingProfile) {
        // Use provided display name or fall back to username from email
        const username = searchEmail.split('@')[0];
        const finalDisplayName = displayName || userDisplayName || username;
        
        console.log(`✨ [Auth Sync] Creating initial profile for ${finalUserId} (username: ${username}, displayName: ${finalDisplayName})`);
        await createOrUpdateUserProfile(finalUserId, {
          username: '', // Leave empty per user request to avoid non-unique placeholders
          displayName: finalDisplayName,
          email: searchEmail,
          createdAt: new Date().toISOString()
        });
      } else if (displayName && !existingProfile.displayName) {
        // Update display name if it was missing but is now provided (e.g., first social login)
        console.log(`📝 [Auth Sync] Updating missing display name for ${finalUserId}: ${displayName}`);
        await createOrUpdateUserProfile(finalUserId, {
          displayName: displayName
        });
      }

      res.json({ 
        success: true, 
        userId: finalUserId,
        accountLinked
      });
    } catch (error: any) {
      console.error('❌ [Auth Sync] Error:', error);
      res.status(500).json({ error: 'Failed to sync authentication' });
    }
  });
  // Check username availability in neofeed-user-profiles
  app.get('/api/users/check-username/:username', async (req: any, res: any) => {
    try {
      const { username } = req.params;
      if (!username) return res.status(400).json({ error: 'Username is required' });
      
      const profile = await getUserProfileByUsername(username.toLowerCase());
      res.json({ available: !profile });
    } catch (error: any) {
      console.error('❌ Error checking username availability:', error);
      res.status(500).json({ error: 'Failed to check availability' });
    }
  });

  app.get('/api/user/votes', async (req: any, res: any) => {
    try {
      const currentUser = await getAuthenticatedUser(req);
      if (!currentUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Query DynamoDB for all votes by this user
      // Since we don't have a GSI for votes by user, we'll return empty for now
      // In production, this would query a votes table with username as key
      const votes: any[] = [];
      
      res.json({ votes, success: true });
    } catch (error: any) {
      console.error('❌ Error getting user votes:', error);
      res.status(500).json({ error: 'Failed to get votes' });
    }
  });

  app.get('/api/user/profile', async (req: any, res: any) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log(`🔍 FETCH PROFILE for ${user.userId}`);
      const profile = await getUserProfile(user.userId);
      
      // If profile exists but is missing critical fields, or doesn't exist, provide defaults
      const responseProfile = {
        userId: user.userId,
        username: profile?.username || user.username,
        displayName: profile?.displayName || user.displayName || profile?.username || user.username,
        bio: profile?.bio || '',
        location: profile?.location || '',
        dob: profile?.dob || '',
        profilePicUrl: profile?.profilePicUrl || null,
        coverPicUrl: profile?.coverPicUrl || null,
        ...profile
      };

      console.log(`✅ /api/user/profile: Returning profile for ${user.userId}, username=${responseProfile.username}`);
      res.json({ success: true, profile: responseProfile });
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.patch('/api/user/profile', async (req: any, res: any) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { username, displayName, bio, location, dob, profilePicUrl, coverPicUrl } = req.body;
      const updates: any = {};
      if (username !== undefined) updates.username = username;
      if (displayName !== undefined) updates.displayName = displayName;
      if (bio !== undefined) updates.bio = bio;
      if (location !== undefined) updates.location = location;
      if (dob !== undefined) updates.dob = dob;
      if (profilePicUrl !== undefined) updates.profilePicUrl = profilePicUrl;
      if (coverPicUrl !== undefined) updates.coverPicUrl = coverPicUrl;

      console.log(`📥 UPDATE PROFILE for ${user.userId}:`, updates);

      const profile = await createOrUpdateUserProfile(user.userId, updates);
      res.json({ success: true, profile });
    } catch (error: any) {
      console.error('❌ Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  console.log('✅ NeoFeed AWS DynamoDB routes registered successfully');
}
