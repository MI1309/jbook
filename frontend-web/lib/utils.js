/**
 * Utility functions for frontend text processing
 */

/**
 * Checks if a given string contains any Kanji characters.
 * Matches characters in the Unicode Kanji ranges.
 * @param {string} text 
 * @returns {boolean} True if the text contains at least one Kanji.
 */
export function hasKanji(text) {
    if (!text) return false;
    // Unicode range for common Kanji (CJK Unified Ideographs)
    // \u4e00-\u9faf
    const kanjiRegex = /[\u4E00-\u9FAF\u3400-\u4DBF]/;
    return kanjiRegex.test(text);
}
