/**
 * Utility functions for frontend text processing
 */

// Romaji to Hiragana map
const ROMAJI_MAP = {
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'la': 'ら', 'li': 'り', 'lu': 'る', 'le': 'れ', 'lo': 'ろ',
    'wa': 'わ', 'wo': 'を', 'n': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
};

export function to_kana(text) {
    if (!text) return '';
    text = text.toLowerCase();
    let res = '';
    let i = 0;
    const n = text.length;
    
    while (i < n) {
        // Check for 3 char match
        if (i + 3 <= n && ROMAJI_MAP[text.substring(i, i + 3)]) {
            res += ROMAJI_MAP[text.substring(i, i + 3)];
            i += 3;
            continue;
        }
        // Check for 2 char match
        if (i + 2 <= n) {
            const sub = text.substring(i, i + 2);
            if (ROMAJI_MAP[sub]) {
                res += ROMAJI_MAP[sub];
                i += 2;
                continue;
            }
            // Check for double consonant (sokuon)
            if (sub[0] === sub[1] && "bcdfghjklmnpqrstvwxyz".includes(sub[0])) {
                if (sub[0] === 'n') {
                    res += 'ん';
                    i += 2;
                    continue;
                }
                res += 'っ';
                i += 1;
                continue;
            }
        }
        // Check for 1 char match
        if (ROMAJI_MAP[text[i]]) {
            res += ROMAJI_MAP[text[i]];
            i += 1;
            continue;
        }
        // If no match, keep the char
        res += text[i];
        i += 1;
    }
    return res;
}

export function to_katakana(text) {
    const hiragana = to_kana(text);
    let katakana = '';
    for (const char of hiragana) {
        const code = char.charCodeAt(0);
        if (0x3041 <= code && code <= 0x3096) {
            katakana += String.fromCharCode(code + 0x60);
        } else {
            katakana += char;
        }
    }
    return katakana;
}

// Create reverse map for Kana to Romaji
const KANA_TO_ROMAJI = {};
for (const [romaji, kana] of Object.entries(ROMAJI_MAP)) {
    if (!KANA_TO_ROMAJI[kana] || romaji.length < KANA_TO_ROMAJI[kana].length) {
        KANA_TO_ROMAJI[kana] = romaji;
    }
}
// Sort keys by length descending
const KANA_KEYS_SORTED = Object.keys(KANA_TO_ROMAJI).sort((a, b) => b.length - a.length);

export function to_romaji(text) {
    if (!text) return '';
    // Convert Katakana to Hiragana first
    let hiraganaText = '';
    for (const char of text) {
        const code = char.charCodeAt(0);
        if (0x30A1 <= code && code <= 0x30F6) {
            hiraganaText += String.fromCharCode(code - 0x60);
        } else {
            hiraganaText += char;
        }
    }
    
    let res = '';
    let i = 0;
    const n = hiraganaText.length;
    
    while (i < n) {
        // Handle sokuon (っ)
        if (hiraganaText[i] === 'っ' && i + 1 < n) {
            let nextKana = null;
            for (const k of KANA_KEYS_SORTED) {
                if (hiraganaText.substring(i + 1).startsWith(k)) {
                    nextKana = k;
                    break;
                }
            }
            if (nextKana) {
                const nextRomaji = KANA_TO_ROMAJI[nextKana];
                res += nextRomaji[0]; // double the consonant
                i += 1;
                continue;
            } else {
                res += 't';
                i += 1;
                continue;
            }
        }
        
        let matched = false;
        for (const k of KANA_KEYS_SORTED) {
            if (hiraganaText.substring(i).startsWith(k)) {
                res += KANA_TO_ROMAJI[k];
                i += k.length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            res += hiraganaText[i];
            i += 1;
        }
    }
    
    return res;
}

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
