
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
                   # 'nn' usually means 'ん'
                   res += 'ん'
                   i += 1 # Consume first n, second n will be processed next iteration? 
                   # Wait, 'nna' -> 'んな'. 'nn' -> 'ん'.
                   # Simplification: consume both?
                   # usage of 'nn' for 'ん' is common.
                   # If we consume one 'n' as 'ん', the next 'n' starts next syllable.
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
