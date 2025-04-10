import OpenAI from "openai";
import fs from "fs";
import { loadHistory, saveHistory } from "./memory.mts";
import type { memoryCore } from "./memory.mts";

const STORE_ID_PATH = "memory/storeId.json";

export class StatefulAgent {
  private userID: number;
  private storeID: string | null = null;
  private history: memoryCore[];
  public client = new OpenAI({
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

    const context = await this.retrieveRelevantContext(userMessage);

    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
      {
        role: "system",
        content:
          "Tu es un assistant intelligent. Utilise les informations contextuelles si elles sont pertinentes pour répondre à l'utilisateur.",
      },
      {
        role: "user",
        content: `Contexte (mémoire pertinente) :\n${context}\n\nQuestion : ${userMessage}`,
      },
    ],
    });

    const assistantMessage = response.choices[0].message.content!;
    this.history.push({
      role: "assistant",
      content: assistantMessage,
      created_at: new Date(),
    });

    // Sauvegarde
    saveHistory(this.userID, this.history);

    console.log(assistantMessage);

    return assistantMessage;
  }

  private async loadOrCreateStore(): Promise<string> {
    const all = fs.existsSync(STORE_ID_PATH)
      ? new Map(
          Object.entries(JSON.parse(fs.readFileSync(STORE_ID_PATH, "utf-8")))
        )
      : new Map();

    const storeName = `vs_user-${this.userID}`;

    if (all.has(storeName)) {
      this.storeID = all.get(storeName)!;
    } else {
      const store = await this.client.vectorStores.create({ name: storeName });
      this.storeID = store.id;
      all.set(storeName, store.id);
      fs.writeFileSync(
        STORE_ID_PATH,
        JSON.stringify(Object.fromEntries(all), null, 2)
      );
    }

    return this.storeID!;
  }

  private async retrieveRelevantContext(query: string): Promise<string> {
    if (!this.storeID) await this.loadOrCreateStore();

    const results = await this.client.vectorStores.search(this.storeID!, {
      query,
    });

    return results.data
      .map((r) => r.content.map((p) => p.text).join("\n"))
      .join("\n---\n");
  }
}
