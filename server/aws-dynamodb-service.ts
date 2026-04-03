import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  DeleteCommand,
  QueryCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "tradebook-heatmaps";

class AWSDynamoDBService {
  private client: DynamoDBClient | null = null;
  private docClient: DynamoDBDocumentClient | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    const region = (process.env.AWS_REGION || "ap-south-1").trim();

    if (!accessKeyId || !secretAccessKey) {
      console.log("⚠️ AWS credentials not found in environment variables");
      console.log("   Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION");
      return;
    }

    console.log(`🔐 AWS Credentials check:`);
    console.log(`   Access Key ID: ${accessKeyId.substring(0, 4)}...${accessKeyId.substring(accessKeyId.length - 4)} (${accessKeyId.length} chars)`);
    console.log(`   Secret Key: ****${secretAccessKey.substring(secretAccessKey.length - 4)} (${secretAccessKey.length} chars)`);
    console.log(`   Region: ${region}`);

    try {
      this.client = new DynamoDBClient({
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey
        }
      });

      this.docClient = DynamoDBDocumentClient.from(this.client, {
        marshallOptions: {
          removeUndefinedValues: true,
          convertEmptyValues: true
        }
      });

      this.isInitialized = true;
      console.log(`✅ AWS DynamoDB initialized successfully`);
      console.log(`   Region: ${region}`);
      console.log(`   Table: ${TABLE_NAME}`);
    } catch (error) {
      console.error("❌ Failed to initialize AWS DynamoDB:", error);
    }
  }

  isConnected(): boolean {
    return this.isInitialized && this.docClient !== null;
  }

  async saveJournalData(dateKey: string, data: any): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return false;
    }

    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: dateKey,
          data: data,
          updatedAt: new Date().toISOString()
        }
      });

      await this.docClient!.send(command);
      console.log(`✅ AWS: Saved journal data for ${dateKey}`);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to save journal data for ${dateKey}:`, error);
      return false;
    }
  }

  async getJournalData(dateKey: string): Promise<any | null> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return null;
    }

    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: dateKey }
      });

      const response = await this.docClient!.send(command);

      if (response.Item) {
        console.log(`✅ AWS: Retrieved journal data for ${dateKey}`);
        return response.Item.data;
      }

      console.log(`⚠️ AWS: No data found for ${dateKey}`);
      return null;
    } catch (error) {
      console.error(`❌ AWS: Failed to get journal data for ${dateKey}:`, error);
      return null;
    }
  }

  async getAllJournalData(): Promise<Record<string, any>> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return {};
    }

    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME
      });

      const response = await this.docClient!.send(command);

      const result: Record<string, any> = {};
      const today = new Date().toISOString().split('T')[0]; // 2025-12-12 format

      if (response.Items) {
        for (const item of response.Items) {
          if (item.dateKey && item.data) {
            // ✅ CRITICAL FIX: Only process actual journal_ keys
            // Skip user_ (personal heatmap), paper_trading_ (paper trade state), and any other non-journal keys
            // Touching paper_trading_ keys here would corrupt and then DELETE paper trading data
            if (!item.dateKey.startsWith('journal_')) {
              continue; // Only process genuine demo journal entries
            }
            
            let cleanKey = item.dateKey.replace('journal_', '');
            
            // Fix invalid dates (empty, null, or non-date format) - only for demo data
            const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(cleanKey);
            if (!isValidDate) {
              console.log(`⚠️ Invalid date key detected: "${cleanKey}" - replacing with today: ${today}`);
              cleanKey = today;
              // Update the item in database with fixed date
              await this.saveJournalData(`journal_${today}`, item.data);
              // Delete the old invalid entry
              await this.deleteJournalData(item.dateKey);
            }
            
            result[cleanKey] = item.data;
          }
        }
        console.log(`✅ AWS: Retrieved ${Object.keys(result).length} demo journal entries`);
      }

      return result;
    } catch (error) {
      console.error("❌ AWS: Failed to get all journal data:", error);
      return {};
    }
  }

  async deleteJournalData(dateKey: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return false;
    }

    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: dateKey }
      });

      await this.docClient!.send(command);
      console.log(`✅ AWS: Deleted journal data for ${dateKey}`);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to delete journal data for ${dateKey}:`, error);
      return false;
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    return this.getJournalData(key);
  }

  async setCachedData(key: string, data: any): Promise<boolean> {
    return this.saveJournalData(key, data);
  }

  async getAllCollectionData(): Promise<Record<string, any>> {
    return this.getAllJournalData();
  }

  // ========================================
  // USER-SPECIFIC JOURNAL METHODS (Personal Heatmap)
  // Key format: user_{userId}_{YYYY-MM-DD}
  // ========================================

  async saveUserJournalData(userId: string, dateKey: string, data: any): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return false;
    }

    try {
      // ENSURE we use the canonical userId passed from middleware
      const userDateKey = `user_${userId}_${dateKey}`;
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: userDateKey,
          userId: userId, // This must be the canonical ID
          date: dateKey,
          sessionDate: dateKey,
          data: data,
          updatedAt: new Date().toISOString()
        }
      });

      await this.docClient!.send(command);
      console.log(`✅ AWS: Saved user journal data for ${userId}/${dateKey}`);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to save user journal data for ${userId}/${dateKey}:`, error);
      return false;
    }
  }

  async getUserJournalData(userId: string, dateKey: string): Promise<any | null> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return null;
    }

    try {
      const userDateKey = `user_${userId}_${dateKey}`;
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: userDateKey }
      });

      const response = await this.docClient!.send(command);

      if (response.Item) {
        console.log(`✅ AWS: Retrieved user journal data for ${userId}/${dateKey}`);
        return response.Item.data;
      }

      console.log(`⚠️ AWS: No user data found for ${userId}/${dateKey}`);
      return null;
    } catch (error) {
      console.error(`❌ AWS: Failed to get user journal data for ${userId}/${dateKey}:`, error);
      return null;
    }
  }

  async getAllUserJournalData(userId: string): Promise<Record<string, any>> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return {};
    }

    try {
      const userPrefix = `user_${userId}_`;
      
      // Try using GSI userId-sessionDate-index for efficient lookup
      try {
        const queryCommand = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'userId-sessionDate-index',
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        });
        
        const response = await this.docClient!.send(queryCommand);
        const result: Record<string, any> = {};

        if (response.Items) {
          for (const item of response.Items) {
            if (item.dateKey && item.data) {
              const cleanKey = item.dateKey.replace(userPrefix, '');
              result[cleanKey] = item.data;
            }
          }
          console.log(`✅ AWS: Retrieved ${Object.keys(result).length} user journal entries for ${userId} (GSI)`);
        }
        return result;
      } catch (gsiError: any) {
        // Fallback to scan if GSI doesn't exist
        if (gsiError.message?.includes('index') || gsiError.name === 'ValidationException') {
          console.log('⚠️ GSI not found, using scan fallback for getAllUserJournalData');
        } else {
          throw gsiError;
        }
      }

      // Fallback to scan
      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(dateKey, :prefix)",
        ExpressionAttributeValues: {
          ":prefix": userPrefix
        }
      });

      const response = await this.docClient!.send(scanCommand);

      const result: Record<string, any> = {};

      if (response.Items) {
        for (const item of response.Items) {
          if (item.dateKey && item.data) {
            const cleanKey = item.dateKey.replace(userPrefix, '');
            result[cleanKey] = item.data;
          }
        }
        console.log(`✅ AWS: Retrieved ${Object.keys(result).length} user journal entries for ${userId}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ AWS: Failed to get all user journal data for ${userId}:`, error);
      return {};
    }
  }

  async deleteUserJournalData(userId: string, dateKey: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return false;
    }

    try {
      const userDateKey = `user_${userId}_${dateKey}`;
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: userDateKey }
      });

      await this.docClient!.send(command);
      console.log(`✅ AWS: Deleted user journal data for ${userId}/${dateKey}`);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to delete user journal data for ${userId}/${dateKey}:`, error);
      return false;
    }
  }

  // ========================================
  // USER-SPECIFIC PAPER TRADING METHODS
  // Key format: paper_trading_{userId}
  // ========================================

  async savePaperTradingData(userId: string, data: {
    capital: number;
    positions: any[];
    tradeHistory: any[];
    totalPnl: number;
    realizedPnl: number;
  }): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return false;
    }

    try {
      const paperTradingKey = `paper_trading_${userId}`;
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: paperTradingKey,
          userId: userId,
          data: data,
          updatedAt: new Date().toISOString()
        }
      });

      await this.docClient!.send(command);
      console.log(`✅ AWS: Saved paper trading data for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to save paper trading data for user ${userId}:`, error);
      return false;
    }
  }

  async getPaperTradingData(userId: string): Promise<{
    capital: number;
    positions: any[];
    tradeHistory: any[];
    totalPnl: number;
    realizedPnl: number;
  } | null> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return null;
    }

    try {
      const paperTradingKey = `paper_trading_${userId}`;
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: paperTradingKey }
      });

      const response = await this.docClient!.send(command);

      if (response.Item) {
        console.log(`✅ AWS: Retrieved paper trading data for user ${userId}`);
        return response.Item.data;
      }

      console.log(`⚠️ AWS: No paper trading data found for user ${userId}`);
      return null;
    } catch (error) {
      console.error(`❌ AWS: Failed to get paper trading data for user ${userId}:`, error);
      return null;
    }
  }

  async deletePaperTradingData(userId: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ AWS DynamoDB not connected");
      return false;
    }

    try {
      const paperTradingKey = `paper_trading_${userId}`;
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: paperTradingKey }
      });

      await this.docClient!.send(command);
      console.log(`✅ AWS: Deleted paper trading data for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to delete paper trading data for user ${userId}:`, error);
      return false;
    }
  }

  // ── Journal Wallet ───────────────────────────────────────────────────────

  async getWallet(userId: string): Promise<any | null> {
    if (!this.isConnected()) return null;
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: `wallet#${userId}` }
      });
      const response = await this.docClient!.send(command);
      return response.Item?.data ?? null;
    } catch (error) {
      console.error(`❌ AWS: Failed to get wallet for ${userId}:`, error);
      return null;
    }
  }

  async saveWallet(userId: string, walletData: any): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: `wallet#${userId}`,
          data: { ...walletData, updatedAt: new Date().toISOString() },
          updatedAt: new Date().toISOString()
        }
      });
      await this.docClient!.send(command);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to save wallet for ${userId}:`, error);
      return false;
    }
  }

  // ── Referral System ───────────────────────────────────────────────────────

  async getReferralProfile(userId: string): Promise<any | null> {
    if (!this.isConnected()) return null;
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: `referral#${userId}` }
      });
      const response = await this.docClient!.send(command);
      return response.Item?.data ?? null;
    } catch (error) {
      console.error(`❌ AWS: Failed to get referral profile for ${userId}:`, error);
      return null;
    }
  }

  async saveReferralProfile(userId: string, data: any): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: `referral#${userId}`,
          data: { ...data, updatedAt: new Date().toISOString() },
          updatedAt: new Date().toISOString()
        }
      });
      await this.docClient!.send(command);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to save referral profile for ${userId}:`, error);
      return false;
    }
  }

  async getReferralByCode(code: string): Promise<any | null> {
    if (!this.isConnected()) return null;
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: `referralcode#${code.toUpperCase()}` }
      });
      const response = await this.docClient!.send(command);
      return response.Item?.data ?? null;
    } catch (error) {
      console.error(`❌ AWS: Failed to get referral by code ${code}:`, error);
      return null;
    }
  }

  async saveReferralCodeLookup(code: string, data: any): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: `referralcode#${code.toUpperCase()}`,
          data,
          updatedAt: new Date().toISOString()
        }
      });
      await this.docClient!.send(command);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to save referral code lookup for ${code}:`, error);
      return false;
    }
  }

  // ── Influencer Free Period ─────────────────────────────────────────────────

  async getInfluencerPeriod(userId: string): Promise<any | null> {
    if (!this.isConnected()) return null;
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: `influencer#${userId}` }
      });
      const response = await this.docClient!.send(command);
      return response.Item?.data ?? null;
    } catch (error) {
      console.error(`❌ AWS: Failed to get influencer period for ${userId}:`, error);
      return null;
    }
  }

  async saveInfluencerPeriod(userId: string, data: any): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: `influencer#${userId}`,
          data: { ...data, updatedAt: new Date().toISOString() },
          updatedAt: new Date().toISOString()
        }
      });
      await this.docClient!.send(command);
      return true;
    } catch (error) {
      console.error(`❌ AWS: Failed to save influencer period for ${userId}:`, error);
      return false;
    }
  }
}


export const awsDynamoDBService = new AWSDynamoDBService();
