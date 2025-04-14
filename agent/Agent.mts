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
    this.memoryManager = await DynamoMemoryManager.create(
      this.userID,
      this.client
    );
  }

  async interact(question: string): Promise<string> {
    const memory = await this.memoryManager.getRelevantMessages(question, 3);

    const messages = memory.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }));

    console.log("Memory messages:", messages);

    messages.push({ role: "user", content: question });

    const response = await this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });

    const answer = response.choices[0].message.content ?? "";

    // On enregistre la question + la réponse
    await this.memoryManager.saveMessage({
      timestamp: new Date().toISOString(),
      role: "USER",
      content: question,
    });

    await this.memoryManager.saveMessage({
      timestamp: new Date().toISOString(),
      role: "ASSISTANT",
      content: answer,
    });

    return answer;
  }

  // async changeUser(newUserID: number): Promise<void> {
  //   this.userID = newUserID;
  //   this.memoryManager = new MemoryManager(newUserID, this.client);
  //   this.storeID = await this.memoryManager.loadOrCreateStore();
  //   console.log(`Switched to user ${newUserID}`);
  // }
}
