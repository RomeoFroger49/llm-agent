export type Role = "USER" | "ASSISTANT";

export interface Message {
  timestamp: string;
  role: Role;
  content: string;
  embedding?: number[];
}
