import fs from "fs";


const FILE = "memory/memory.json";

export interface memoryCore {
  role: "user" | "assistant";
  content: string;
  created_at: Date;
}

// JSON memory file
export const loadHistory = (userID: number): memoryCore[] => {
  if (!fs.existsSync(FILE)) return [];
  const all = JSON.parse(fs.readFileSync(FILE, "utf-8") || "{}");
  return all[userID] || [];
};

export const saveHistory = (userID: number, messages: memoryCore[]): void => {
  const all = fs.existsSync(FILE)
    ? JSON.parse(fs.readFileSync(FILE, "utf-8"))
    : {};
  all[userID] = messages;
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
};
