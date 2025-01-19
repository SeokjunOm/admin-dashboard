// src/constants/categoryEmojis.js
export const CATEGORY_EMOJIS = {
    '한식': '🍚',
    '중식': '🥢',
    '일식': '🍱',
    '양식': '🍝',
    '카페': '☕',
    '분식': '🧇',
    '아시아': '🍜',
    '기타': '🍽️'
  };
  
  export const getCategoryWithEmoji = (category) => {
    const emoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS['기타'];
    return `${emoji} ${category}`;
  };