export function isValidJapanese(text) {
  // Hiragana: U+3040-U+309F
  // Katakana: U+30A0-U+30FF
  // Kanji: U+4E00-U+9FFF
  // Chōonpu (Long Vowel Mark): U+30FC
  const regex = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u30FC]+$/;
  return regex.test(text);
}

export function isHiragana(text) {
  const regex = /^[\u3040-\u309F]+$/;
  return regex.test(text);
}

export function isKatakana(text) {
  const regex = /^[\u30A0-\u30FF]+$/;
  return regex.test(text);
}

export function normalizeInput(input) {
  return input.trim().toLowerCase();
}
