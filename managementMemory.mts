import * as fs from "fs";

interface MemoryCore {
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
}

interface MemoryParams {
  userID: number;
  memoryCore: MemoryCore;
}

const fileJSON = "agent-memory.json";

//serializer
const serialize = (memo: Record<number, MemoryCore[]>): MemoryParams[] => {
  const res: MemoryParams[] = [];
  for (const [userID, memories] of Object.entries(memo)) {
    memories.forEach((memoryCore) => {
      res.push({ userID: Number(userID), memoryCore });
    });
  }
  return res;
};

//deserializer
const deserialize = (memo: MemoryParams[]): Record<number, MemoryCore[]> => {
  const res: Record<number, MemoryCore[]> = {};
  for (let line of memo) {
    res[line.userID] = res[line.userID]
      ? [...res[line.userID], line.memoryCore]
      : [line.memoryCore];
  }
  return res;
};
//

async function saveMessage(message: MemoryParams) {
  const memory: MemoryParams[] = [...(await getAllMemory()), message];

  try {
    fs.writeFileSync(fileJSON, JSON.stringify(deserialize(memory), null, 2));
  } catch (error) {
    console.error(error);
    throw new Error("memory bug, the question hasn't been registered");
  }
}

async function getAllMemory(): Promise<MemoryParams[]> {
  try {
    const memory = fs.readFileSync(fileJSON, "utf-8");
    const parsed = JSON.parse(memory || "{}");
    return serialize(parsed);
  } catch (error) {
    console.error("Error reading or parsing memory:", error);
    throw error;
  }
}

async function getUserMemory(userID: number): Promise<MemoryParams[]> {
  try {
    const memory = fs.readFileSync(fileJSON, "utf-8");
    const parsed = JSON.parse(memory || "{}") as Record<number, MemoryCore[]>;
    const userMemoryArray = parsed[userID];
    return serialize(userMemoryArray ? { [userID]: userMemoryArray } : {});
  } catch (error) {
    console.error("Error reading or parsing memory:", error);
    throw error;
  }
}

export { saveMessage, getAllMemory, getUserMemory };
