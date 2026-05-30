/**
 * Utility functions for frontend text processing
 */

/**
 * Checks if a given string contains any Kanji characters.
 */
export function hasKanji(text) {
    if (!text) return false;
    const kanjiRegex = /[\u4E00-\u9FAF\u3400-\u4DBF]/;
    return kanjiRegex.test(text);
}

/**
 * Extracts all unique Kanji characters from a string.
 */
export function extractKanji(text) {
    if (!text) return [];
    const kanjiRegex = /[\u4E00-\u9FAF\u3400-\u4DBF]/g;
    const matches = text.match(kanjiRegex);
    if (!matches) return [];
    return [...new Set(matches)]; // Unique Kanjis
}

/**
 * Detects the script types present in the text.
 * Returns an array of 'kanji', 'hiragana', 'katakana' if detected.
 */
export function getScriptTypes(text) {
    if (!text) return [];
    const types = [];
    if (/[\u4E00-\u9FAF\u3400-\u4DBF]/.test(text)) types.push('kanji');
    if (/[\u3040-\u309F]/.test(text)) types.push('hiragana');
    if (/[\u30A0-\u30FF]/.test(text)) types.push('katakana');
    return types;
}

/**
 * Compares two strings and returns an array of character objects with their status.
 * Used for highlighting mistakes in Kakitori mode.
 */
export function diffStrings(correct, given) {
    if (!correct) return [];
    const result = [];
    const correctArr = Array.from(correct);
    const givenArr = Array.from(given || '');

    // Basic character-by-character comparison
    // In the future, we could use a more advanced diff algorithm like Levenshtein
    for (let i = 0; i < correctArr.length; i++) {
        const char = correctArr[i];
        const userChar = givenArr[i];

        if (!userChar) {
            result.push({ char, status: 'missing' });
        } else if (char === userChar) {
            result.push({ char, status: 'correct' });
        } else {
            result.push({ char, userChar, status: 'wrong' });
        }
    }

    // Extra characters given by user
    if (givenArr.length > correctArr.length) {
        for (let i = correctArr.length; i < givenArr.length; i++) {
            result.push({ userChar: givenArr[i], status: 'extra' });
        }
    }

    return result;
}
