export function isValidJapanese(text) {
  // Hiragana: U+3040-U+309F
  // Katakana: U+30A0-U+30FF
  // Kanji: U+4E00-U+9FFF
  const regex = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+$/;
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
