import { getOpenAI } from "@/lib/openai/client";
import { MemoryDNA } from "../memory/memory-builder";
import { TimelineEvent } from "../timeline/timeline-engine";
import { LifeChapter } from "../life/life-chapter-engine";

export interface DocumentaryScript {
  title: string;
  opening: string;
  chapters: {
    title: string;
    narration: string;
  }[];
  ending: string;
}

export async function generateDocumentaryScript(
  memory: MemoryDNA,
  timeline: TimelineEvent[],
  chapters: LifeChapter[]
): Promise<DocumentaryScript> {

  const openai = getOpenAI();

  const response = await openai.responses.create({

    model: "gpt-5.5",

    input: `
당신은 한국 최고의 다큐멘터리 작가입니다.

절대로 AI처럼 쓰지 마세요.

한 사람의 삶을 존중하며

감동적인 다큐멘터리 내레이션을 작성하세요.

JSON만 반환합니다.

{
"title":"",
"opening":"",
"chapters":[
{
"title":"",
"narration":""
}
],
"ending":""
}

MemoryDNA

${JSON.stringify(memory,null,2)}

Timeline

${JSON.stringify(timeline,null,2)}

Life Chapters

${JSON.stringify(chapters,null,2)}
`
  });

  const text = response.output_text
    .replace(/```json/gi,"")
    .replace(/```/g,"")
    .trim();

  return JSON.parse(text);

}