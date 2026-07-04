import { MemoryDNA } from "../memory/memory-builder";

export interface TimelineEvent {
  year?: string;
  title: string;
  description: string;
  emotion?: string;
}

export function buildTimeline(memory: MemoryDNA): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const max = Math.max(
    memory.events.length,
    memory.timeline.length
  );

  for (let i = 0; i < max; i++) {
    const description = memory.events[i];
    if (!description) continue;

    events.push({
      year: memory.timeline[i],
      title: description.slice(0, 30),
      description,
      emotion: memory.emotions[i],
    });
  }

  return events.sort((a, b) => {
    const ay = Number(a.year ?? 9999);
    const by = Number(b.year ?? 9999);

    if (Number.isNaN(ay) || Number.isNaN(by)) {
      return 0;
    }

    return ay - by;
  });
}