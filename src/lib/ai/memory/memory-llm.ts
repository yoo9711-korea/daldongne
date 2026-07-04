import { getOpenAI } from "@/lib/openai/client";
import { MemoryDNA } from "./memory-builder";

export async function enrichMemoryDNA(
  memory: MemoryDNA,
  interviews: {
    question: string;
    answer: string;
  }[]
): Promise<MemoryDNA> {
  if (interviews.length === 0) {
    return memory;
  }

  const openai = getOpenAI();

  const response = await openai.responses.create({
    model: "gpt-5.5",
    input: `
당신은 한 사람의 인생을 정리하는 다큐멘터리 작가입니다.

아래 인터뷰를 분석하여 JSON만 반환하세요.

{
  "people":[],
  "places":[],
  "objects":[],
  "values":[],
  "relationships":[],
  "lessons":[],
  "regrets":[],
  "gratitude":[]
}

인터뷰

${JSON.stringify(interviews, null, 2)}
`,
  });

  const text = response.output_text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    const ai = JSON.parse(text);

    return {
      ...memory,
      people: [...new Set([...memory.people, ...(ai.people ?? [])])],
      places: [...new Set([...memory.places, ...(ai.places ?? [])])],
      objects: [...new Set([...memory.objects, ...(ai.objects ?? [])])],
      values: [...new Set([...memory.values, ...(ai.values ?? [])])],
      relationships: [
        ...new Set([
          ...memory.relationships,
          ...(ai.relationships ?? []),
        ]),
      ],
      lessons: [...new Set([...memory.lessons, ...(ai.lessons ?? [])])],
      regrets: [...new Set([...memory.regrets, ...(ai.regrets ?? [])])],
      gratitude: [
        ...new Set([
          ...memory.gratitude,
          ...(ai.gratitude ?? []),
        ]),
      ],
    };
  } catch {
    return memory;
  }
}