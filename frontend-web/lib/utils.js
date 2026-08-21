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

export function isKanjiChar(ch) {
    if (!ch) return false;
    const normalized = ch.normalize('NFKC');
    const code = normalized.charCodeAt(0);
    return (code >= 0x4E00 && code <= 0x9FAF) || 
           (code >= 0x3400 && code <= 0x4DBF) || 
           (code >= 0x2F00 && code <= 0x2FD5) || 
           (code >= 0x2E80 && code <= 0x2EFF);
}

/**
 * Checks if a given string contains any Kanji characters.
 */
export function hasKanji(text) {
    if (!text) return false;
    const normalized = text.normalize('NFKC');
    const kanjiRegex = /[\u4E00-\u9FAF\u3400-\u4DBF\u2F00-\u2FD5\u2E80-\u2EFF]/;
    return kanjiRegex.test(normalized) || kanjiRegex.test(text);
}

/**
 * Extracts all unique Kanji characters from a string.
 */
export function extractKanji(text) {
    if (!text) return [];
    const normalized = text.normalize('NFKC');
    const kanjiRegex = /[\u4E00-\u9FAF\u3400-\u4DBF]/g;
    const matches = normalized.match(kanjiRegex);
    if (!matches) return [];
    return [...new Set(matches)]; // Unique Kanjis
}

/**
 * Strips prefix and suffix okurigana from a furigana segment for a kanji at index `kanjiIdx`.
 */
function stripOkurigana(kanjiIdx, token, wordChars) {
    if (!token) return '';
    let result = to_kana(String(token).trim());
    
    // Find consecutive kana following this kanji
    let okurigana = '';
    for (let i = kanjiIdx + 1; i < wordChars.length; i++) {
        if (isKanjiChar(wordChars[i])) break;
        okurigana += wordChars[i];
    }
    if (okurigana && result.endsWith(okurigana) && result.length > okurigana.length) {
        result = result.substring(0, result.length - okurigana.length);
    }
    
    // Also check for prefix kana preceding this kanji (e.g. お)
    let prefixKana = '';
    for (let i = kanjiIdx - 1; i >= 0; i--) {
        if (isKanjiChar(wordChars[i])) break;
        prefixKana = wordChars[i] + prefixKana;
    }
    if (prefixKana && result.startsWith(prefixKana) && result.length > prefixKana.length) {
        result = result.substring(prefixKana.length);
    }
    
    return result;
}

/**
 * Generates an array of furigana segments aligned with each character in `word`.
 * Handles multiple kanji, space-separated furigana (e.g. "れい い"), romaji readings with spaces ("orei o iu"),
 * okurigana anchors, and partial existing maps while stripping duplicate okurigana.
 */
export function generateFuriganaMap(word, reading, furigana, existingMap) {
    // Flexible argument handling: if 3rd arg is array, it's existingMap
    if (Array.isArray(furigana)) {
        existingMap = furigana;
        furigana = null;
    }
    
    if (!word) return [];
    const normWord = word.normalize('NFKC');
    const chars = Array.from(normWord);
    const kanjiIndices = chars.map((c, i) => isKanjiChar(c) ? i : -1).filter(i => i !== -1);
    
    if (kanjiIndices.length === 0) {
        return chars.map(() => '');
    }
    
    // Helper to sanitize and strip duplicate okurigana from all map entries
    const cleanFinalMap = (map) => {
        return map.map((seg, i) => {
            if (!isKanjiChar(chars[i]) || !seg) return '';
            return stripOkurigana(i, seg, chars);
        });
    };
    
    // 1. If existing map covers ALL kanji in word
    if (Array.isArray(existingMap) && existingMap.length === chars.length) {
        const allCovered = kanjiIndices.every(idx => existingMap[idx] && String(existingMap[idx]).trim() !== '');
        if (allCovered) {
            return cleanFinalMap(existingMap);
        }
    }
    
    const fmap = chars.map(() => '');

    // 2. Try explicit furigana field if provided
    if (furigana && typeof furigana === 'string' && furigana.trim()) {
        const normFuri = furigana.normalize('NFKC').trim();
        const fTokens = normFuri.split(/[\s,、]+/).filter(Boolean);
        if (fTokens.length === kanjiIndices.length) {
            kanjiIndices.forEach((idx, k) => {
                fmap[idx] = stripOkurigana(idx, fTokens[k], chars);
            });
            return cleanFinalMap(fmap);
        } else if (fTokens.length === 1 && kanjiIndices.length === 1) {
            fmap[kanjiIndices[0]] = stripOkurigana(kanjiIndices[0], fTokens[0], chars);
            return cleanFinalMap(fmap);
        }
    }
    
    // 3. Segment from reading (or furigana if reading not given)
    const rawInput = (reading || furigana || '');
    if (!rawInput) {
        // Fallback to existing map if it had at least something
        if (Array.isArray(existingMap) && existingMap.length === chars.length) {
            return cleanFinalMap(existingMap);
        }
        return fmap;
    }
    
    // Convert entire reading/romaji to Kana without dropping words after spaces!
    const normReading = String(rawInput).normalize('NFKC').split('(')[0].split('（')[0].trim();
    const cleanReading = normReading
        .split(/[\s,、]+/)
        .filter(Boolean)
        .map(token => to_kana(token))
        .join('');
        
    if (!cleanReading) {
        return fmap;
    }
    
    // Helper to find kana anchor with particle fuzzy equivalence (を <-> お, は <-> わ, へ <-> え)
    const findAnchor = (text, anchor, fromIdx) => {
        if (!anchor) return text.length;
        const exact = text.indexOf(anchor, fromIdx);
        if (exact !== -1) return exact;
        
        let altAnchor = anchor
            .replace(/を/g, 'お')
            .replace(/は/g, 'わ')
            .replace(/へ/g, 'え');
        let altIdx = text.indexOf(altAnchor, fromIdx);
        if (altIdx !== -1) return altIdx;
        
        altAnchor = anchor
            .replace(/お/g, 'を')
            .replace(/わ/g, 'は')
            .replace(/え/g, 'へ');
        altIdx = text.indexOf(altAnchor, fromIdx);
        if (altIdx !== -1) return altIdx;
        
        return -1;
    };

    // Break word into segments of consecutive kanji and non-kanji
    const segments = [];
    let currentType = null;
    let currentChars = [];
    let currentIndices = [];
    
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const isK = isKanjiChar(char);
        const type = isK ? 'kanji' : 'kana';
        if (type !== currentType) {
            if (currentChars.length > 0) {
                segments.push({ type: currentType, text: currentChars.join(''), indices: [...currentIndices] });
            }
            currentType = type;
            currentChars = [char];
            currentIndices = [i];
        } else {
            currentChars.push(char);
            currentIndices.push(i);
        }
    }
    if (currentChars.length > 0) {
        segments.push({ type: currentType, text: currentChars.join(''), indices: [...currentIndices] });
    }
    
    let readPos = 0;
    for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        if (seg.type === 'kana') {
            const matchIdx = findAnchor(cleanReading, seg.text, readPos);
            if (matchIdx !== -1) {
                readPos = matchIdx + seg.text.length;
            }
        } else {
            // Kanji segment: look ahead for the next kana anchor
            let nextAnchor = null;
            for (let nextS = s + 1; nextS < segments.length; nextS++) {
                if (segments[nextS].type === 'kana') {
                    nextAnchor = segments[nextS].text;
                    break;
                }
            }
            
            let endPos = cleanReading.length;
            if (nextAnchor) {
                const anchorIdx = findAnchor(cleanReading, nextAnchor, readPos);
                if (anchorIdx !== -1) {
                    endPos = anchorIdx;
                }
            }
            
            const kanjiReading = cleanReading.substring(readPos, endPos);
            readPos = endPos;
            
            const kCount = seg.indices.length;
            if (kCount === 1) {
                fmap[seg.indices[0]] = kanjiReading;
            } else if (kCount > 1) {
                const total = kanjiReading.length;
                const base = Math.floor(total / kCount);
                let rem = total % kCount;
                let p = 0;
                for (let k = 0; k < kCount; k++) {
                    const take = base + (rem > 0 ? 1 : 0);
                    if (rem > 0) rem--;
                    fmap[seg.indices[k]] = kanjiReading.substring(p, p + take);
                    p += take;
                }
            }
        }
    }
    
    // 4. Fill in any missing kanji segments from existingMap
    kanjiIndices.forEach(idx => {
        if (!fmap[idx] || fmap[idx].trim() === '') {
            if (Array.isArray(existingMap) && existingMap[idx] && String(existingMap[idx]).trim() !== '') {
                fmap[idx] = existingMap[idx];
            }
        }
    });

    // 5. Fallback safety: If there are kanjis with missing furigana
    const stillEmpty = kanjiIndices.filter(idx => !fmap[idx] || fmap[idx].trim() === '');
    if (stillEmpty.length > 0) {
        if (stillEmpty.length === 1) {
            fmap[stillEmpty[0]] = cleanReading;
        } else {
            const total = cleanReading.length;
            const base = Math.floor(total / stillEmpty.length);
            let rem = total % stillEmpty.length;
            let p = 0;
            for (let k = 0; k < stillEmpty.length; k++) {
                const take = base + (rem > 0 ? 1 : 0);
                if (rem > 0) rem--;
                fmap[stillEmpty[k]] = cleanReading.substring(p, p + take);
                p += take;
            }
        }
    }
    
    return cleanFinalMap(fmap);
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
