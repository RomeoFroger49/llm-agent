import OpenAI from "openai";
import { loadHistory, saveHistory } from "./memory.mts";
import type { memoryCore } from "./memory.mts";

export class StatefulAgent {
  private userID: number;
  private history: memoryCore[];
  client = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
  });

  constructor(userID: number) {
    this.userID = userID;
    this.history = loadHistory(userID);
  }

  async respond(userMessage: string): Promise<string> {
    // Ajout du message utilisateur
    this.history.push({
      role: "user",
      content: userMessage,
      created_at: new Date(),
    });

    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: this.history,
    });

    const assistantMessage = response.choices[0].message.content!;
    this.history.push({
      role: "assistant",
      content: assistantMessage,
      created_at: new Date(),
    });

    // Sauvegarde
    saveHistory(this.userID, this.history);

    return assistantMessage;
  }
}
