import * as fs from "fs";

interface MemoryCore {
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
}

const fileJSON = "agent-memory.json";

async function saveMessage(message: MemoryCore) {
  const memory = [...(await getMemory()), message];

  try {
    fs.writeFileSync(fileJSON, JSON.stringify(memory, null, 2));
  } catch (error) {
    console.error(error);
    throw new Error("memory bug, the question hasn't been registered");
  }
}

async function getMemory(): Promise<MemoryCore[]> {
  try {
    const memory = fs.readFileSync(fileJSON, "utf-8");
    const parsed = JSON.parse(memory);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export { saveMessage, getMemory, MemoryCore };
