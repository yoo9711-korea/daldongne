const PEOPLE_REGEX =
  /([가-힣]{2,4})(?:님|씨|형|누나|언니|오빠|아버지|어머니|엄마|아빠|할머니|할아버지)/g;

const PLACE_REGEX =
  /(서울|부산|대구|인천|광주|대전|울산|제주|강릉|춘천|전주|여수|목포|속초|독도|학교|회사|집|시장|바다|산|공원)/g;

const YEAR_REGEX =
  /\b(19\d{2}|20\d{2})\b/g;

const EMOTION_KEYWORDS = {
  joy: [
    "행복",
    "기뻤",
    "즐거",
    "웃",
    "사랑",
    "감동",
    "신났",
  ],
  sadness: [
    "슬펐",
    "눈물",
    "이별",
    "외로",
    "힘들",
    "아팠",
  ],
  anger: [
    "화났",
    "분노",
    "억울",
    "미웠",
  ],
  fear: [
    "무서",
    "두려",
    "불안",
    "걱정",
  ],
  gratitude: [
    "감사",
    "고마",
    "덕분",
  ],
};

export interface MemoryExtractionResult {
  people: string[];
  places: string[];
  years: string[];
  emotions: string[];
  keywords: string[];
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function collectRegex(text: string, regex: RegExp) {
  const matches = text.match(regex);
  return matches ?? [];
}

export function extractMemory(text: string): MemoryExtractionResult {
  const people = collectRegex(text, PEOPLE_REGEX);

  const places = collectRegex(text, PLACE_REGEX);

  const years = collectRegex(text, YEAR_REGEX);

  const emotions: string[] = [];

  Object.entries(EMOTION_KEYWORDS).forEach(([emotion, words]) => {
    if (words.some((word) => text.includes(word))) {
      emotions.push(emotion);
    }
  });

  const keywords = unique(
    text
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 2)
  );

  return {
    people: unique(people),
    places: unique(places),
    years: unique(years),
    emotions: unique(emotions),
    keywords,
  };
}