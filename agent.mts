import OpenAI from "openai";
import dotenv from "dotenv";
import { getMemory, saveMessage } from "./managementMemory.mts";
dotenv.config();

interface questionParams {
  userID: 0; // won't use it because the user is always the same
  content: string;
}

const client = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

async function askAgent(question: questionParams) {
  // save user question
  await saveMessage({
    content: question.content,
    role: "user",
    createdAt: new Date(),
  });

  const memory = await getMemory();

  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: memory.map((line) => ({
      role: line.role,
      content: line.content,
    })),
  });

  // save system answer
  await saveMessage({
    content: response.choices[0].message.content!,
    role: "assistant",
    createdAt: new Date(),
  });

  console.log(response.choices[0].message.content!);
}

const question =
  process.argv[2] || "Qu'est-ce qu'une architecture hexagonale ?";
askAgent({ userID: 0, content: question });
