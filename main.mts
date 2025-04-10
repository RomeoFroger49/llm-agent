import dotenv from "dotenv";
import { Agent } from "./agent.mts";
import readline from "readline";

dotenv.config();

async function main(): Promise<void> {
  const agent = new Agent(42);
  await agent.initialize();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(
    "Agent initialisé. Pose une question ou tape 'exit' pour quitter."
  );

  rl.on("line", async (input: string) => {
    const trimmed = input.trim().toLowerCase();
    if (["exit", "quit", "stop"].includes(trimmed)) {
      console.log("Fermeture de l'agent. À bientôt !");
      rl.close();
      process.exit(0);
    } else if (trimmed.length > 0) {
      await agent.respond(input);
    }
  });
}

main();
