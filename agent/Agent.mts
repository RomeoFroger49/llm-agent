// src/agent/Agent.mts
import OpenAI from "openai";
import { MemoryManager } from "./MemoryManager.mts";
import { formatMessagePair } from "./MessageFormatter.mts";


export class Agent {
  private userID: number;
  private storeID: string | null = null;
  private memoryManager: MemoryManager;
  public client = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

  constructor(userID: number) {
    this.userID = userID;
    this.memoryManager = new MemoryManager(userID, this.client);
  }

  async initialize(): Promise<void> {
    this.storeID = await this.memoryManager.loadOrCreateStore();
  }

  async respond(userMessage: string): Promise<string> {
    const context = await this.memoryManager.retrieveRelevantContext(
      userMessage,
      this.storeID!
    );

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
          content: `Context:\n${context}\n\nQuestion: ${userMessage}`,
        },
      ],
    });

    const assistantMessage = response.choices[0].message.content!;
    await this.memoryManager.addMessageToVectorStore(
      userMessage,
      assistantMessage,
      this.storeID!
    );
    console.log(assistantMessage);
    return assistantMessage;
  }

  async changeUser(newUserID: number): Promise<void> {
    this.userID = newUserID;
    this.memoryManager = new MemoryManager(newUserID, this.client);
    this.storeID = await this.memoryManager.loadOrCreateStore();
    console.log(`Switched to user ${newUserID}`);
  }
}
