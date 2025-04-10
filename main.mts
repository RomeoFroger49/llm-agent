import dotenv from "dotenv";
import { StatefulAgent } from "./agent.mts";
import OpenAI from "openai";
dotenv.config();

function main(): void {
  let state = 1;
  const agent = new StatefulAgent(1);

  agent.respond(process.argv[2]);
}

main();
