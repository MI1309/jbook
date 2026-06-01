
# Simple Romaji to Hiragana converter for search
# Handles basic romaji, double consonants, and long vowels (partial)

ROMAJI_MAP = {
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
    'tsu': 'つ', 'chi': 'ち', 'shi': 'し', 'fu': 'ふ',
}

def to_kana(text: str) -> str:
    if not text:
        return ""
        
    text = text.lower()
    res = ""
    i = 0
    n = len(text)
    
    while i < n:
        # Check for 3 char match (e.g. kya, shi, tsu - wait shi is 3, tsu is 3)
        # Check mapping for 3 chars
        if i + 3 <= n and text[i:i+3] in ROMAJI_MAP:
            res += ROMAJI_MAP[text[i:i+3]]
            i += 3
            continue
            
        # Check for 2 char match
        if i + 2 <= n:
            sub = text[i:i+2]
            if sub in ROMAJI_MAP:
                res += ROMAJI_MAP[sub]
                i += 2
                continue
            # Check for double consonant (sokuon) e.g. 'kk', 'tt'
            if sub[0] == sub[1] and sub[0] in "bcdfghjklmnpqrstvwxyz":
                # Except 'nn' which is 'ん' if followed by vowel or end? 
                # classic rule: 'nn' -> 'ん' if end or next is not vowel
                # but let's handle 'nn' separately?
                if sub[0] == 'n':
                   # 'nn' should be 'ん'
                   res += 'ん'
                   i += 2 # Consume both n's
                   continue

                res += 'っ'
                i += 1
                continue
        
        # Check for 1 char match
        if text[i] in ROMAJI_MAP:
            res += ROMAJI_MAP[text[i]]
            i += 1
            continue
            
        # If no match, keep char
        res += text[i]
        i += 1
        
    return res

def to_katakana(text: str) -> str:
    hiragana = to_kana(text)
    katakana = ""
    for char in hiragana:
        code = ord(char)
        if 0x3041 <= code <= 0x3096:
            katakana += chr(code + 0x60)
        else:
            katakana += char
    return katakana

def format_reading(reading_list: list, is_onyomi: bool = True) -> str:
    if not reading_list:
        return "-"
    
    if is_onyomi:
        # Convert romaji (usually uppercase) to Katakana
        return ", ".join([to_katakana(r.lower()) for r in reading_list])
    else:
        # Convert romaji (usually lowercase) to Hiragana
        return ", ".join([to_kana(r.lower()) for r in reading_list])

# Reverse map for Hiragana to Romaji conversion
KANA_TO_ROMAJI = {}
for romaji, kana in ROMAJI_MAP.items():
    if kana not in KANA_TO_ROMAJI or len(romaji) < len(KANA_TO_ROMAJI[kana]):
        KANA_TO_ROMAJI[kana] = romaji

# Sort keys by length descending to match compound kana first
KANA_KEYS_SORTED = sorted(KANA_TO_ROMAJI.keys(), key=len, reverse=True)

def to_romaji(text: str) -> str:
    if not text:
        return ""
    
    # First, convert Katakana to Hiragana to make it uniform
    hiragana_text = ""
    for char in text:
        code = ord(char)
        if 0x30A1 <= code <= 0x30F6: # Katakana range
            hiragana_text += chr(code - 0x60)
        else:
            hiragana_text += char
            
    res = ""
    i = 0
    n = len(hiragana_text)
    
    while i < n:
        # Handle sokuon (small tsu: っ) -> doubles the next consonant
        if hiragana_text[i] == 'っ' and i + 1 < n:
            next_kana = None
            for k in KANA_KEYS_SORTED:
                if hiragana_text[i+1:].startswith(k):
                    next_kana = k
                    break
            if next_kana:
                next_romaji = KANA_TO_ROMAJI[next_kana]
                res += next_romaji[0] # add the first letter (consonant)
                i += 1
                continue
            else:
                res += "t"
                i += 1
                continue
                
        matched = False
        for k in KANA_KEYS_SORTED:
            if hiragana_text[i:].startswith(k):
                res += KANA_TO_ROMAJI[k]
                i += len(k)
                matched = True
                break
        if not matched:
            res += hiragana_text[i]
            i += 1
            
    return res
