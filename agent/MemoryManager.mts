// src/agent/MemoryManager.mts
import fs from "fs";
import path from "path";
import type OpenAI from "openai";
import { formatMessagePair } from "./MessageFormatter.mts";
import type { Role, Message } from "../types.d.ts";

const STORE_ID_PATH = "memory/storeId.json";

export class MemoryManager {
  private userID: number;
  private client: OpenAI;

  constructor(userID: number, client: OpenAI) {
    this.userID = userID;
    this.client = client;
  }

  private getLocalFilePath(): string {
    return `memory/user-${this.userID}.txt`;
  }

  async loadOrCreateStore(): Promise<string> {
    const all = fs.existsSync(STORE_ID_PATH)
      ? new Map(
          Object.entries(JSON.parse(fs.readFileSync(STORE_ID_PATH, "utf-8")))
        )
      : new Map();

    const storeName = `vs_user-${this.userID}`;

    if (all.has(storeName)) {
      return all.get(storeName)!;
    } else {
      const store = await this.client.vectorStores.create({
        name: storeName,
        expires_after: { anchor: "last_active_at", days: 1 },
      });
      all.set(storeName, store.id);
      fs.writeFileSync(
        STORE_ID_PATH,
        JSON.stringify(Object.fromEntries(all), null, 2)
      );
      return store.id;
    }
  }

  async retrieveRelevantContext(
    query: string,
    storeID: string
  ): Promise<string> {
    const results = await this.client.vectorStores.search(storeID, { query });
    return results.data
      .map((r) => r.content.map((p) => p.text).join("\n"))
      .join("\n---\n");
  }

  private async clearVectorStoreFiles(storeID: string): Promise<void> {
    const fileList = await this.client.vectorStores.files.list(storeID);
    for (const file of fileList.data) {
      await this.client.files.del(file.id);
      await this.client.vectorStores.files.del(storeID, file.id);
    }
  }

  async addMessageToVectorStore(
    userMsg: string,
    assistantMsg: string,
    storeID: string
  ): Promise<void> {
    const filePath = this.getLocalFilePath();
    const timestamp = new Date().toISOString();

    const userMessage: Message = { timestamp, role: "USER", content: userMsg };
    const assistantMessage: Message = {
      timestamp,
      role: "ASSISTANT",
      content: assistantMsg,
    };
    const formatted = formatMessagePair(userMessage, assistantMessage);

    fs.appendFileSync(filePath, formatted, "utf-8");

    await this.clearVectorStoreFiles(storeID);

    const uploadedFile = await this.client.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });

    await this.client.vectorStores.files.create(storeID, {
      file_id: uploadedFile.id,
    });
  }
}
