export interface MemoryDNA {
  people: string[];
  places: string[];
  objects: string[];
  events: string[];
  emotions: string[];
  values: string[];
  timeline: string[];
  relationships: string[];
  symbols: string[];
  lessons: string[];
  regrets: string[];
  gratitude: string[];
}

export function createMemoryDNA(): MemoryDNA {
  return {
    people: [],
    places: [],
    objects: [],
    events: [],
    emotions: [],
    values: [],
    timeline: [],
    relationships: [],
    symbols: [],
    lessons: [],
    regrets: [],
    gratitude: [],
  };
}