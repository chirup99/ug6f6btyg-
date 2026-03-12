import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export interface UniversalFormatData {
  brokerName: string;
  formatName: string;
  sampleLine: string;
  positions: {
    time: number[];
    order: number[];
    symbol: number[];
    type: number[];
    qty: number[];
    price: number[];
  };
  displayValues: {
    time: string;
    order: string;
    symbol: string;
    type: string;
    qty: string;
    price: string;
  };
  userId: string;
  savedAt: string;
  detectionScore?: number;
}

export class BrokerFormatsLibrary {
  private client: DynamoDBDocumentClient | null = null;
  private tableName = "broker-formats";

  private getClient(): DynamoDBDocumentClient {
    if (!this.client) {
      const dynamoClient = new DynamoDBClient({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });
      this.client = DynamoDBDocumentClient.from(dynamoClient);
    }
    return this.client;
  }

  /**
   * Save format to universal broker library using AWS DynamoDB
   * Uses composite key: brokerName (partition) + formatId (sort)
   */
  async saveFormatToLibrary(format: Omit<UniversalFormatData, 'savedAt'>): Promise<string> {
    try {
      const formatId = `${format.formatName}_${Date.now()}`;
      const formatWithTimestamp: UniversalFormatData & { formatId: string } = {
        ...format,
        formatId,
        savedAt: new Date().toISOString()
      };

      await this.getClient().send(new PutCommand({
        TableName: this.tableName,
        Item: formatWithTimestamp
      }));

      console.log(`✅ [FORMATS-LIBRARY] Saved format to AWS DynamoDB: ${format.brokerName}/${formatId}`);
      return formatId;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error saving format to DynamoDB:', error);
      throw error;
    }
  }

  /**
   * Get all formats for a specific broker from AWS DynamoDB
   */
  async getFormatsByBroker(brokerName: string): Promise<UniversalFormatData[]> {
    try {
      const result = await this.getClient().send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'brokerName = :broker',
        ExpressionAttributeValues: {
          ':broker': brokerName
        }
      }));

      const formats = (result.Items || []) as UniversalFormatData[];
      console.log(`📚 [FORMATS-LIBRARY] Found ${formats.length} formats for ${brokerName} in DynamoDB`);
      return formats;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error fetching formats from DynamoDB:', error);
      return [];
    }
  }

  /**
   * Get all available brokers that have saved formats from AWS DynamoDB
   */
  async getAllBrokers(): Promise<string[]> {
    try {
      const result = await this.getClient().send(new ScanCommand({
        TableName: this.tableName,
        ProjectionExpression: 'brokerName'
      }));

      const brokerSet = new Set<string>();
      (result.Items || []).forEach((item: any) => {
        if (item.brokerName) {
          brokerSet.add(item.brokerName);
        }
      });

      const brokers = Array.from(brokerSet);
      console.log(`🏢 [FORMATS-LIBRARY] Found ${brokers.length} brokers in DynamoDB library`);
      return brokers;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error fetching brokers from DynamoDB:', error);
      return [];
    }
  }

  /**
   * Auto-detect format by matching against all broker formats
   * Returns best match with confidence score
   */
  async autoDetectFormat(
    firstLine: string
  ): Promise<{ format: UniversalFormatData; confidence: number; brokerName: string } | null> {
    try {
      const brokers = await this.getAllBrokers();
      const allFormats: (UniversalFormatData & { brokerName: string })[] = [];

      for (const broker of brokers) {
        const formats = await this.getFormatsByBroker(broker);
        allFormats.push(...formats.map(f => ({ ...f, brokerName: broker })));
      }

      if (allFormats.length === 0) {
        console.log('📭 [FORMATS-LIBRARY] No formats in DynamoDB library for auto-detection');
        return null;
      }

      const scores = allFormats.map(format => ({
        format,
        score: calculateMatchScore(firstLine, format.sampleLine)
      }));

      scores.sort((a, b) => b.score - a.score);
      const bestMatch = scores[0];

      if (bestMatch.score > 0.5) {
        console.log(
          `✅ [FORMATS-LIBRARY] Auto-detected format "${bestMatch.format.formatName}" from ${bestMatch.format.brokerName} (confidence: ${(bestMatch.score * 100).toFixed(0)}%)`
        );
        return {
          format: bestMatch.format,
          confidence: bestMatch.score,
          brokerName: bestMatch.format.brokerName
        };
      }

      console.log(`❌ [FORMATS-LIBRARY] No format matched above confidence threshold`);
      return null;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error in auto-detection:', error);
      return null;
    }
  }

  /**
   * Search formats by broker name (case-insensitive)
   */
  async searchFormats(query: string): Promise<UniversalFormatData[]> {
    try {
      const brokers = await this.getAllBrokers();
      const matchedBrokers = brokers.filter(b => b.toLowerCase().includes(query.toLowerCase()));

      const allFormats: UniversalFormatData[] = [];
      for (const broker of matchedBrokers) {
        const formats = await this.getFormatsByBroker(broker);
        allFormats.push(...formats);
      }

      return allFormats;
    } catch (error) {
      console.error('❌ [FORMATS-LIBRARY] Error searching formats in DynamoDB:', error);
      return [];
    }
  }
}

/**
 * Calculate match score between current data format and saved format
 * Returns 0-1 score (1 = perfect match, 0 = no match)
 */
function calculateMatchScore(currentLine: string, sampleLine: string): number {
  try {
    const currentWords = currentLine.split(/[\s\t]+/).filter(w => w.trim());
    const sampleWords = sampleLine.split(/[\s\t]+/).filter(w => w.trim());

    if (currentWords.length === 0 || sampleWords.length === 0) {
      return 0;
    }

    let matchCount = 0;
    for (const sampleWord of sampleWords) {
      if (currentWords.some(w => w.toLowerCase() === sampleWord.toLowerCase())) {
        matchCount++;
      }
    }

    const maxLen = Math.max(sampleWords.length, currentWords.length);
    return matchCount / maxLen;
  } catch (error) {
    console.error('❌ Error calculating match score:', error);
    return 0;
  }
}

export const brokerFormatsLibrary = new BrokerFormatsLibrary();
