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

export interface TradingChallenge {
  challengeId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  startingCapital: number;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: string;
  participantCount: number;
}

export interface ChallengeParticipant {
  participantId: string;
  oderId: string;
  userId: string;
  challengeId: string;
  joinedAt: string;
  startingCapital: number;
  currentCapital: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  pnlPercent: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  rank: number;
  lastUpdated: string;
}

export interface ChallengeTrade {
  tradeId: string;
  userId: string;
  challengeId: string;
  symbol: string;
  type: 'STOCK' | 'FUTURES' | 'OPTIONS' | 'MCX';
  action: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  status: 'open' | 'closed';
  entryTime: string;
  exitTime?: string;
}

class TradingChallengeService {
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
      console.log("⚠️ [CHALLENGE] AWS credentials not found");
      return;
    }

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
      console.log(`🏆 [CHALLENGE] Trading Challenge Service initialized`);
    } catch (error) {
      console.error("❌ [CHALLENGE] Failed to initialize:", error);
    }
  }

  isConnected(): boolean {
    return this.isInitialized && this.docClient !== null;
  }

  async createChallenge(challenge: Omit<TradingChallenge, 'participantCount'>): Promise<boolean> {
    if (!this.isConnected()) {
      console.error("❌ [CHALLENGE] Not connected to DynamoDB");
      return false;
    }

    try {
      const challengeKey = `challenge_${challenge.challengeId}`;
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: challengeKey,
          type: 'challenge',
          ...challenge,
          participantCount: 0,
          createdAt: new Date().toISOString()
        }
      });

      await this.docClient!.send(command);
      console.log(`✅ [CHALLENGE] Created challenge: ${challenge.challengeId}`);
      return true;
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to create challenge:`, error);
      return false;
    }
  }

  async getChallenge(challengeId: string): Promise<TradingChallenge | null> {
    if (!this.isConnected()) return null;

    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: `challenge_${challengeId}` }
      });

      const response = await this.docClient!.send(command);
      if (response.Item) {
        return response.Item as unknown as TradingChallenge;
      }
      return null;
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to get challenge:`, error);
      return null;
    }
  }

  async getActiveChallenges(): Promise<TradingChallenge[]> {
    if (!this.isConnected()) return [];

    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(dateKey, :prefix) AND #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":prefix": "challenge_",
          ":status": "active"
        }
      });

      const response = await this.docClient!.send(command);
      return (response.Items || []) as unknown as TradingChallenge[];
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to get active challenges:`, error);
      return [];
    }
  }

  async getAllChallenges(): Promise<TradingChallenge[]> {
    if (!this.isConnected()) return [];

    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(dateKey, :prefix)",
        ExpressionAttributeValues: {
          ":prefix": "challenge_"
        }
      });

      const response = await this.docClient!.send(command);
      return (response.Items || []) as unknown as TradingChallenge[];
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to get all challenges:`, error);
      return [];
    }
  }

  async registerParticipant(userId: string, challengeId: string, startingCapital: number): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const participantKey = `participant_${challengeId}_${userId}`;
      const participant = {
        participantId: participantKey,
        oderId: participantKey,
        userId,
        challengeId,
        joinedAt: new Date().toISOString(),
        startingCapital,
        currentCapital: startingCapital,
        realizedPnL: 0,
        unrealizedPnL: 0,
        totalPnL: 0,
        pnlPercent: 0,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        rank: 0,
        lastUpdated: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: participantKey,
          type: 'participant',
          ...participant
        }
      });

      await this.docClient!.send(command);
      
      await this.incrementParticipantCount(challengeId);
      
      console.log(`✅ [CHALLENGE] User ${userId} registered for challenge ${challengeId}`);
      return true;
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to register participant:`, error);
      return false;
    }
  }

  private async incrementParticipantCount(challengeId: string): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: `challenge_${challengeId}` },
        UpdateExpression: "SET participantCount = if_not_exists(participantCount, :zero) + :inc",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":inc": 1
        }
      });
      await this.docClient!.send(command);
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to increment participant count:`, error);
    }
  }

  async getParticipant(userId: string, challengeId: string): Promise<ChallengeParticipant | null> {
    if (!this.isConnected()) return null;

    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { dateKey: `participant_${challengeId}_${userId}` }
      });

      const response = await this.docClient!.send(command);
      if (response.Item) {
        return response.Item as unknown as ChallengeParticipant;
      }
      return null;
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to get participant:`, error);
      return null;
    }
  }

  async updateParticipantStats(
    userId: string, 
    challengeId: string, 
    stats: Partial<ChallengeParticipant>
  ): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const existing = await this.getParticipant(userId, challengeId);
      if (!existing) return false;

      const updated = {
        ...existing,
        ...stats,
        lastUpdated: new Date().toISOString()
      };

      if (updated.startingCapital > 0) {
        updated.pnlPercent = (updated.totalPnL / updated.startingCapital) * 100;
      }

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: `participant_${challengeId}_${userId}`,
          type: 'participant',
          ...updated
        }
      });

      await this.docClient!.send(command);
      console.log(`✅ [CHALLENGE] Updated stats for ${userId} in challenge ${challengeId}`);
      return true;
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to update participant stats:`, error);
      return false;
    }
  }

  async getLeaderboard(challengeId: string): Promise<ChallengeParticipant[]> {
    if (!this.isConnected()) return [];

    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(dateKey, :prefix)",
        ExpressionAttributeValues: {
          ":prefix": `participant_${challengeId}_`
        }
      });

      const response = await this.docClient!.send(command);
      const participants = (response.Items || []) as unknown as ChallengeParticipant[];
      
      const sorted = participants.sort((a, b) => b.totalPnL - a.totalPnL);
      
      sorted.forEach((p, index) => {
        p.rank = index + 1;
      });

      console.log(`🏆 [CHALLENGE] Leaderboard for ${challengeId}: ${sorted.length} participants`);
      return sorted;
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to get leaderboard:`, error);
      return [];
    }
  }

  async recordChallengeTrade(trade: ChallengeTrade): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const tradeKey = `trade_${trade.challengeId}_${trade.userId}_${trade.tradeId}`;
      
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          dateKey: tradeKey,
          type: 'challenge_trade',
          ...trade
        }
      });

      await this.docClient!.send(command);
      console.log(`✅ [CHALLENGE] Recorded trade for ${trade.userId}: ${trade.symbol}`);
      return true;
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to record trade:`, error);
      return false;
    }
  }

  async getUserChallengeTrades(userId: string, challengeId: string): Promise<ChallengeTrade[]> {
    if (!this.isConnected()) return [];

    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(dateKey, :prefix)",
        ExpressionAttributeValues: {
          ":prefix": `trade_${challengeId}_${userId}_`
        }
      });

      const response = await this.docClient!.send(command);
      return (response.Items || []) as unknown as ChallengeTrade[];
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to get user trades:`, error);
      return [];
    }
  }

  async getUserChallenges(userId: string): Promise<ChallengeParticipant[]> {
    if (!this.isConnected()) return [];

    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(dateKey, :prefix) AND userId = :userId",
        ExpressionAttributeValues: {
          ":prefix": "participant_",
          ":userId": userId
        }
      });

      const response = await this.docClient!.send(command);
      return (response.Items || []) as unknown as ChallengeParticipant[];
    } catch (error) {
      console.error(`❌ [CHALLENGE] Failed to get user challenges:`, error);
      return [];
    }
  }
}

export const tradingChallengeService = new TradingChallengeService();
