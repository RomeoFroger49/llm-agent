import OpenAI from "openai";
import fs, { ReadStream, unlinkSync } from "fs";
import type { memoryCore } from "./memory.mts";

const STORE_ID_PATH = "memory/storeId.json";

export class Agent {
  private userID: number;
  private storeID: string | null = null;
  private history: memoryCore[];
  public client = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
  });

  constructor(userID: number) {
    this.userID = userID;
  }

  async initialize(): Promise<void> {
    await this.loadOrCreateStore();
  }

  private getLocalFilePath(): string {
    return `memory/user-${this.userID}.txt`;
  }

  async respond(userMessage: string): Promise<string> {
    
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
    // Add the messages
    await this.addMessageToVectorStore(userMessage, "USER");
    await this.addMessageToVectorStore(assistantMessage, "ASSISTANT");

    console.log(assistantMessage);

    return assistantMessage;
  }

  async loadOrCreateStore(): Promise<string> {
    const all = fs.existsSync(STORE_ID_PATH)
      ? new Map(
          Object.entries(JSON.parse(fs.readFileSync(STORE_ID_PATH, "utf-8")))
        )
      : new Map();

    const storeName = `vs_user-${this.userID}`;

    if (all.has(storeName)) {
      this.storeID = all.get(storeName)!;
    } else {
      const store = await this.client.vectorStores.create({
        name: storeName,
        expires_after: { anchor: "last_active_at", days: 1 },
      });
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
    const results = await this.client.vectorStores.search(this.storeID!, {
      query,
    });

    return results.data
      .map((r) => r.content.map((p) => p.text).join("\n"))
      .join("\n---\n");
  }

  async clearVectorStoreFiles(): Promise<void> {
    const fileList = await this.client.vectorStores.files.list(this.storeID!);

    for (const file of fileList.data) {
      await this.client.files.del(file.id);
      await this.client.vectorStores.files.del(this.storeID!, file.id);
    }
  }

  private async addMessageToVectorStore(
    message: string,
    role: "USER" | "ASSISTANT"
  ): Promise<void> {
    const filePath = this.getLocalFilePath();

    // Append message localy
    const formattedMessage = `[${new Date().toISOString()}] ${role}: ${message}\n`;
    fs.appendFileSync(filePath, formattedMessage, "utf-8");

    // delete the old file on OpenAI
    await this.clearVectorStoreFiles();

    // Uploader la nouvelle version
    const uploadedFile = await this.client.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });

    // add the new file to the vectorStore
    await this.client.vectorStores.files.create(this.storeID!, {
      file_id: uploadedFile.id,
    });
  }
}
