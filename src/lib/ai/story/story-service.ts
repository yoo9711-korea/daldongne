import { buildStoryPrompt } from "./prompt-builder";
import { StoryResult } from "./schema";
import { getOpenAI } from "@/lib/openai/client";
import { processInterview } from "../interview/interview-processor";
import { buildTimeline } from "../timeline/timeline-engine";
import { enrichMemoryDNA } from "../memory/memory-llm";
import { buildLifeChapters } from "../life/life-chapter-engine";
import { generateDocumentaryScript } from "./documentary-script-engine";

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
  const basicMemory = processInterview(input.interviews);

  const memory = await enrichMemoryDNA(
            basicMemory,
            input.interviews
          );

  const timeline = buildTimeline(memory);

  const lifeChapters = buildLifeChapters(memory);

  const documentary = await generateDocumentaryScript(
  memory,
  timeline,
  lifeChapters
);

  const prompt = buildStoryPrompt({
    photos: input.photos,
    analysis: input.analysis,
    interviews: [
      ...input.interviews,
      {
        question: "MemoryDNA",
        answer: JSON.stringify(memory, null, 2),
      },
      {
        question: "Timeline",
        answer: JSON.stringify(timeline, null, 2),
      },
 
    {
     question: "LifeChapters",
     answer: JSON.stringify(lifeChapters, null, 2),
  },    
 
  {
  question: "DocumentaryScript",
  answer: JSON.stringify(documentary, null, 2),
  },

   ],
  });

  const openai = getOpenAI();

  const response = await openai.responses.create({
    model: "gpt-5.5",
    input: prompt,
  });

  const text = response.output_text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text) as StoryResult;
}