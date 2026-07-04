export interface EmotionResult {
  emotions: string[];
  related: string[];
}

const emotionMap: Record<string, string[]> = {
  행복: ["행복", "기쁨"],
  기쁨: ["행복", "기쁨"],
  사랑: ["사랑", "따뜻함"],
  감사: ["감사"],
  슬픔: ["슬픔"],
  눈물: ["슬픔"],
  외로움: ["외로움"],
  그리움: ["그리움"],
  추억: ["그리움"],
  가족: ["가족애"],
  부모: ["가족애"],
};

export function analyzeEmotion(text: string): EmotionResult {
  const emotions = new Set<string>();
  const related = new Set<string>();

  for (const [keyword, values] of Object.entries(emotionMap)) {
    if (text.includes(keyword)) {
      values.forEach((v) => emotions.add(v));
      related.add(keyword);
    }
  }

  return {
    emotions: [...emotions],
    related: [...related],
  };
}