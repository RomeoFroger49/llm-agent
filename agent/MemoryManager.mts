import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Message, Role } from "../types.d.ts";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const REGION = process.env.AWS_REGION!;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

export class MemoryManager {
  private baseClient = new DynamoDBClient({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  private ddb = DynamoDBDocumentClient.from(this.baseClient);
  private client: OpenAI;
  public tableName: string;
  private isInitialized: boolean = false;

  private constructor(userID: number, client: OpenAI) {
    this.client = client;
    this.tableName = `AgentMemory_user-${userID}`;
  }

  static async create(
    userID: number,
    client: OpenAI
  ): Promise<MemoryManager> {
    const instance = new MemoryManager(userID, client);
    await instance.init();
    return instance;
  }

  private async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.baseClient.send(
        new DescribeTableCommand({ TableName: this.tableName })
      );
    } catch {
      await this.baseClient.send(
        new CreateTableCommand({
          TableName: this.tableName,
          AttributeDefinitions: [
            { AttributeName: "timestamp", AttributeType: "S" },
          ],
          KeySchema: [{ AttributeName: "timestamp", KeyType: "HASH" }],
          BillingMode: "PAY_PER_REQUEST",
        })
      );
    }

    this.isInitialized = true;
  }

  async saveMessage(message: Message): Promise<void> {
    const embeddingResponse = await this.client.embeddings.create({
      model: "text-embedding-ada-002",
      input: message.content,
    });
    await this.ddb.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          ...message,
          embedding: embeddingResponse.data[0].embedding,
        },
      })
    );
  }

  async getUserMemory(): Promise<Message[]> {
    const result = await this.ddb.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );

    const items = (result.Items as Message[]) || [];
    return items.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async getRelevantMessages(
    query: string,
    topK: number = 3
  ): Promise<Message[]> {
    const embeddingResponse = await this.client.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    const result = await this.ddb.send(
      new ScanCommand({ TableName: this.tableName })
    );

    const scored = ((result.Items || []) as any[]).map((item) => ({
      item,
      score: this.cosineSimilarity(queryEmbedding, item.embedding),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ item }) => ({
        timestamp: item.timestamp,
        role: item.role,
        content: item.content,
      }));
  }

  // tool

  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }
}
