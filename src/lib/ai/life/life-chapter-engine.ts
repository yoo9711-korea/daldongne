import { MemoryDNA } from "../memory/memory-builder";

export interface LifeChapter {
  id: string;
  title: string;
  summary: string;
  years: string[];
  events: string[];
  emotions: string[];
}

const CHAPTERS = [
  {
    id: "childhood",
    title: "유년기",
    keywords: [
      "어릴",
      "유치원",
      "초등",
      "국민학교",
      "놀이터",
      "부모님",
      "엄마",
      "아빠",
    ],
  },
  {
    id: "school",
    title: "학창시절",
    keywords: [
      "중학교",
      "고등학교",
      "대학교",
      "선생님",
      "친구",
      "졸업",
      "시험",
    ],
  },
  {
    id: "youth",
    title: "청년기",
    keywords: [
      "군대",
      "취업",
      "첫 직장",
      "회사",
      "연애",
    ],
  },
  {
    id: "family",
    title: "가족",
    keywords: [
      "결혼",
      "아내",
      "남편",
      "아이",
      "아들",
      "딸",
      "손주",
    ],
  },
  {
    id: "turning",
    title: "인생의 전환점",
    keywords: [
      "처음",
      "가장",
      "계기",
      "전환점",
      "변화",
      "도전",
      "실패",
      "성공",
    ],
  },
];

export function buildLifeChapters(
  memory: MemoryDNA
): LifeChapter[] {

  return CHAPTERS.map((chapter) => {

    const events = memory.events.filter((event) =>
      chapter.keywords.some((keyword) =>
        event.includes(keyword)
      )
    );

    return {
      id: chapter.id,
      title: chapter.title,
      summary: events.slice(0, 3).join(" "),
      years: memory.timeline,
      events,
      emotions: memory.emotions,
    };

  }).filter((chapter) => chapter.events.length > 0);

}