export interface EmotionKeyword {
  keyword: string;
  emotions: string[];
  related: string[];
}

export const emotionDictionary: EmotionKeyword[] = [

  {
    keyword: "아버지",
    emotions: [
      "희생",
      "책임감",
      "든든함",
      "묵묵함",
      "사랑"
    ],
    related: [
      "새벽",
      "출근",
      "작업복",
      "등",
      "손",
      "가족"
    ]
  },

  {
    keyword: "어머니",
    emotions: [
      "사랑",
      "헌신",
      "포근함",
      "따뜻함"
    ],
    related: [
      "부엌",
      "김치",
      "장독대",
      "미소",
      "기도"
    ]
  },

  {
    keyword: "할머니",
    emotions: [
      "그리움",
      "포근함",
      "지혜"
    ],
    related: [
      "마당",
      "된장",
      "손주",
      "장독",
      "겨울"
    ]
  },

  {
    keyword: "고향",
    emotions: [
      "향수",
      "그리움",
      "평안"
    ],
    related: [
      "논",
      "골목",
      "개울",
      "친구",
      "집"
    ]
  }

];