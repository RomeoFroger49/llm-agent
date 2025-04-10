// src/main.mts
import dotenv from "dotenv";
import readline from "readline";
import { Agent } from "./agent/Agent.mts";

dotenv.config();

async function main(): Promise<void> {
  const agent = new Agent(42); // Utilisateur par défaut
  await agent.initialize();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🤖 Agent is ready! Type your message or /exit to quit.");

  rl.on("line", async (input: string) => {
    const trimmed = input.trim();

    if (["/exit", "exit", "/quit", "quit"].includes(trimmed.toLowerCase())) {
      console.log("👋 Goodbye!");
      rl.close();
      process.exit(0);
    }

    if (trimmed.length > 0) {
      await agent.respond(trimmed);
    }
  });
}

main();
