import { z } from "zod";

export const StoryChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  script: z.string(),
  emotion: z.string(),
  photoIds: z.array(z.string()),
});

export const LifeEventSchema = z.object({
  year: z.string().optional(),
  title: z.string(),
  description: z.string(),
});

export const StoryCharacterSchema = z.object({
  name: z.string(),
  role: z.string(),
});

export const StorySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
    },
    summary: {
      type: "string",
    },
    theme: {
      type: "string",
    },
    tone: {
      type: "string",
    },
    timeline: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          year: {
            type: "string",
          },
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
        },
        required: ["title", "description"],
      },
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
          },
          role: {
            type: "string",
          },
        },
        required: ["name", "role"],
      },
    },
    chapters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
          },
          title: {
            type: "string",
          },
          summary: {
            type: "string",
          },
          script: {
            type: "string",
          },
          emotion: {
            type: "string",
          },
          photoIds: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: [
          "id",
          "title",
          "summary",
          "script",
          "emotion",
          "photoIds",
        ],
      },
    },
  },
  required: [
    "title",
    "summary",
    "theme",
    "tone",
    "timeline",
    "characters",
    "chapters",
  ],
} as const;

export type StoryChapter = z.infer<typeof StoryChapterSchema>;
export type LifeEvent = z.infer<typeof LifeEventSchema>;
export type StoryCharacter = z.infer<typeof StoryCharacterSchema>;

export interface StoryResult {
  title: string;
  summary: string;
  theme: string;
  tone: string;
  timeline: LifeEvent[];
  characters: StoryCharacter[];
  chapters: StoryChapter[];
}