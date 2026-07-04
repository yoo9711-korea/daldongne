export interface HeritageKeyword {
  keyword: string;
  decade: string;
  category: string;
  emotions: string[];
  related: string[];
}

export const koreanHeritage: HeritageKeyword[] = [

  {
    keyword: "연탄",
    decade: "1970",
    category: "생활",
    emotions: [
      "따뜻함",
      "가난",
      "희망",
      "가족"
    ],
    related: [
      "겨울",
      "달동네",
      "아버지",
      "어머니",
      "군고구마"
    ]
  },

  {
    keyword: "흑백TV",
    decade: "1980",
    category: "생활",
    emotions: [
      "추억",
      "설렘",
      "가족"
    ],
    related: [
      "주말",
      "거실",
      "드라마",
      "웃음"
    ]
  },

  {
    keyword: "공중전화",
    decade: "1980",
    category: "생활",
    emotions: [
      "기다림",
      "보고싶음"
    ],
    related: [
      "동전",
      "편지",
      "가족",
      "연인"
    ]
  },

  {
    keyword: "교련복",
    decade: "1980",
    category: "학교",
    emotions: [
      "청춘",
      "긴장",
      "추억"
    ],
    related: [
      "학교",
      "친구",
      "운동장"
    ]
  },

  {
    keyword: "장독대",
    decade: "1970",
    category: "가정",
    emotions: [
      "어머니",
      "포근함",
      "정겨움"
    ],
    related: [
      "된장",
      "김치",
      "마당",
      "햇살"
    ]
  }

];