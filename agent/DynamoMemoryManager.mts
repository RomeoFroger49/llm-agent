// DynamoMemoryManager.mts
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

dotenv.config();

const REGION = process.env.AWS_REGION!;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

export class DynamoMemoryManager {
  private baseClient = new DynamoDBClient({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  private ddb = DynamoDBDocumentClient.from(this.baseClient);
  private userID: number;
  public tableName: string;
  private isInitialized: boolean = false;

  private constructor(userID: number) {
    this.tableName = `AgentMemory_user-${userID}`;
  }

  static async create(userID: number): Promise<DynamoMemoryManager> {
    const instance = new DynamoMemoryManager(userID);
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
    await this.ddb.send(
      new PutCommand({
        TableName: this.tableName,
        Item: message,
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
}
