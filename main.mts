import dotenv from "dotenv";
import { Agent } from "./agent.mts";
dotenv.config();

async function main(): Promise<void> {
  let state = 1;
  const agent = new Agent(42);
  // create a store ou retrieve an existant one
  await agent.initialize();

  await agent.respond(process.argv[2]);
}

main();
