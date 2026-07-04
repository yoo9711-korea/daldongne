import { buildStoryPrompt } from "./prompt-builder";
import { StoryResult } from "./schema";
import { getOpenAI } from "@/lib/openai/client";
import { processInterview } from "../interview/interview-processor";

export interface StoryServiceInput {
  photos: unknown[];
  analysis: unknown[];
  interviews: {
    question: string;
    answer: string;
  }[];
}

export async function generateStory(
  input: StoryServiceInput
): Promise<StoryResult> {

  const memory = processInterview(input.interviews);

  const prompt = buildStoryPrompt({
    photos: input.photos,
    analysis: input.analysis,
    interviews: [
      ...input.interviews,
      {
        question: "MemoryDNA",
        answer: JSON.stringify(memory),
      },
    ],
  });

  const openai = getOpenAI();

  const response = await openai.responses.create({
    model: "gpt-5.5",
    input: prompt,
  });

  const text = response.output_text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}