import { analyzeEmotion } from "../emotion/emotion-engine";
import { createMemoryDNA } from "../memory/memory-builder";
import { extractMemory } from "../memory/memory-extractor";

export interface InterviewInput {
  question: string;
  answer: string;
}

export function processInterview(
  interviews: InterviewInput[]
) {
  const memory = createMemoryDNA();

  interviews.forEach((item) => {
    const emotion = analyzeEmotion(item.answer);
    const extracted = extractMemory(item.answer);

    memory.events.push(item.answer);

    memory.people.push(...extracted.people);
    memory.places.push(...extracted.places);

    memory.timeline.push(...extracted.years);

    memory.emotions.push(...emotion.emotions);
    memory.emotions.push(...extracted.emotions);

    memory.symbols.push(...emotion.related);

    memory.values.push(...extracted.keywords);
  });

  memory.people = [...new Set(memory.people)];
  memory.places = [...new Set(memory.places)];
  memory.events = [...new Set(memory.events)];
  memory.timeline = [...new Set(memory.timeline)];
  memory.values = [...new Set(memory.values)];
  memory.emotions = [...new Set(memory.emotions)];
  memory.symbols = [...new Set(memory.symbols)];

  return memory;
}