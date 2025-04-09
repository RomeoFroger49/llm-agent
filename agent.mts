import OpenAI from "openai";
import dotenv from "dotenv";
import { getAllMemory, getUserMemory, saveMessage } from "./managementMemory.mts";
dotenv.config();

interface questionParams {
  userID: number; // won't use it because the user is always the same
  content: string;
}

const client = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

async function askAgent(question: questionParams) {
  // save user question
  await saveMessage({
    userID: question.userID,
    memoryCore: {
      content: question.content,
      role: "user",
      createdAt: new Date(),
    },
  });

  const memory = await getUserMemory(question.userID);
  console.log(memory);

  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: memory.map((line) => (
      {
      role: line.memoryCore.role,
      content: line.memoryCore.role,
      }
    )),
  });

  // save assistant answer
  await saveMessage({
    userID: question.userID,
    memoryCore: {
      content: response.choices[0].message.content!,
      role: "assistant",
      createdAt: new Date(),
    },
  });

}

const question =
  process.argv[2] || "Qu'est-ce qu'une architecture hexagonale ?";
askAgent({ userID: 3, content: question });
