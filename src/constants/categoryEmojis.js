// src/constants/categoryEmojis.js

// 카테고리 정의
export const CATEGORIES = [
  {
    id: 'korean',
    name: '한식',
    emoji: '🍚'
  },
  {
    id: 'chinese',
    name: '중식',
    emoji: '🥢'
  },
  {
    id: 'japanese',
    name: '일식',
    emoji: '🍱'
  },
  {
    id: 'western',
    name: '양식',
    emoji: '🍝'
  },
  {
    id: 'cafe',
    name: '카페',
    emoji: '☕'
  },
  {
    id: 'snack',
    name: '분식',
    emoji: '🧇'
  },
  {
    id: 'asian',
    name: '아시아',
    emoji: '🍜'
  },
  {
    id: 'other',
    name: '기타',
    emoji: '🍽️'
  }
];

// 카테고리 이름 목록 (기존 코드와의 호환성을 위해)
export const CATEGORY_NAMES = CATEGORIES.map(category => category.name);

// 카테고리별 이모지 매핑
export const CATEGORY_EMOJIS = CATEGORIES.reduce((acc, { name, emoji }) => {
  acc[name] = emoji;
  return acc;
}, {});

// 카테고리와 이모지를 함께 표시하는 헬퍼 함수
export const getCategoryWithEmoji = (category) => {
  const emoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS['기타'];
  return `${emoji} ${category}`;
};