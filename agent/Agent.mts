import OpenAI from "openai";
import { DynamoMemoryManager } from "./DynamoMemoryManager.mts";
import type { Message } from "../types.d.ts";

export class Agent {
  private userID: number;
  private memoryManager!: DynamoMemoryManager;
  public client = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

  constructor(userID: number) {
    this.userID = userID;
  }

  async initialize(): Promise<void> {
    this.memoryManager = await DynamoMemoryManager.create(this.userID);
  }

  async respond(userMessage: string): Promise<string> {
    const context = await this.memoryManager.getUserMemory();

    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Use the provided context when relevant.",
        },
        {
          role: "user",
          content: `Context:\n${context.map((p) => {
            return `\n[${p.timestamp}] ${p.role}: ${p.content}`;
          })}\n\nQuestion: ${userMessage}`,
        },
      ],
    });

    const assistantMessage = response.choices[0].message.content!;

    this.memoryManager.saveMessage({
      role: "USER",
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    this.memoryManager.saveMessage({
      role: "ASSISTANT",
      content: assistantMessage,
      timestamp: new Date().toISOString(),
    });

    console.log(assistantMessage);
    return assistantMessage;
  }

  // async changeUser(newUserID: number): Promise<void> {
  //   this.userID = newUserID;
  //   this.memoryManager = new MemoryManager(newUserID, this.client);
  //   this.storeID = await this.memoryManager.loadOrCreateStore();
  //   console.log(`Switched to user ${newUserID}`);
  // }
}
