// src/agent/MessageFormatter.mts
import type { Message } from "../types.d.ts";

export function formatMessagePair(user: Message, assistant: Message): string {
  return `[${user.timestamp}] ${user.role}: ${user.content}\n[${assistant.timestamp}] ${assistant.role}: ${assistant.content}\n`;
}
