from utils.kana import to_kana

GODAN_MAP = {
    # last_char: (a_row, i_row, e_row, o_row, te_suffix, ta_suffix)
    'う': ('わ', 'い', 'え', 'お', 'って', 'った'),
    'つ': ('た', 'ち', 'て', 'と', 'って', 'った'),
    'る': ('ら', 'り', 'れ', 'ろ', 'って', 'った'),
    'む': ('ま', 'み', 'め', 'も', 'んで', 'んだ'),
    'ぶ': ('ば', 'び', 'べ', 'ぼ', 'んで', 'んだ'),
    'ぬ': ('な', 'に', 'ね', 'の', 'んで', 'んだ'),
    'く': ('か', 'き', 'け', 'こ', 'いて', 'いた'),
    'ぐ': ('が', 'ぎ', 'げ', 'ご', 'いで', 'いだ'),
    'す': ('さ', 'し', 'せ', 'そ', 'して', 'した'),
}

def conjugate_verb(word: str, reading: str, word_type: str) -> list:
    """
    Returns a list of 9 conjugation forms for the given Japanese verb.
    Each item in the list is a dictionary:
    {
        "form": str,     # Nama bentuk (Indonesian)
        "kanji": str,    # Bentuk Kanji (e.g., 食べます)
        "kana": str      # Bentuk Kana (e.g., たべます)
    }
    """
    if not word or not reading:
        return None

    # Clean inputs
    word = word.strip()
    reading = reading.strip()

    # If word_type is explicitly specified and is not a verb type, do not conjugate
    if word_type:
        word_type_lower = word_type.lower()
        verb_types = ['godan', 'ichidan', 'suru', 'intransitive', 'transitive', 'verb']
        if not any(vt in word_type_lower for vt in verb_types):
            return None
    
    # 1. Determine the verb group
    is_suru = False
    is_kuru = False
    is_ichidan = False
    is_godan = False

    # Check kuru first
    if reading == 'くる' or reading.endswith('くる') or word == '来る' or word.endswith('来る'):
        is_kuru = True
    # Check suru
    elif word_type == 'suru' or word.endswith('する') or reading.endswith('する'):
        is_suru = True
    elif word_type == 'ichidan':
        is_ichidan = True
    elif word_type == 'godan':
        is_godan = True
    else:
        # Heuristics if word_type is not specific
        if word.endswith('する') or reading.endswith('する'):
            is_suru = True
        elif word.endswith('る') and (reading.endswith('いる') or reading.endswith('える')):
            is_ichidan = True
        elif any(reading.endswith(suffix) for suffix in GODAN_MAP.keys()):
            is_godan = True
        else:
            return None

    # 2. Conjugate based on group
    conjugations = []

    if is_kuru:
        # Kuru (来・くる) is irregular
        if word.endswith('来る'):
            w_prefix = word[:-2]
        elif word.endswith('くる'):
            w_prefix = word[:-2]
        else:
            w_prefix = word[:-2] if len(word) >= 2 else ""

        if reading.endswith('くる'):
            r_prefix = reading[:-2]
        else:
            r_prefix = reading[:-2] if len(reading) >= 2 else ""

        forms = [
            ("Kamus (Biasa / Kamus)", w_prefix + "来る", r_prefix + "くる"),
            ("Masu (Sopan)", w_prefix + "来ます", r_prefix + "きます"),
            ("Te (Permohonan / Penghubung)", w_prefix + "来て", r_prefix + "きて"),
            ("Ta (Masa Lalu Biasa)", w_prefix + "来た", r_prefix + "kita"), # Wait, let's keep hiragana for reading: きた
            ("Nai (Negatif Biasa)", w_prefix + "来ない", r_prefix + "こない"),
            ("Nakatta (Negatif Lampau)", w_prefix + "来なかった", r_prefix + "こなかった"),
            ("Volitional (Ajakan)", w_prefix + "来よう", r_prefix + "こよう"),
            ("Conditional (Syarat)", w_prefix + "来れば", r_prefix + "くれば"),
            ("Potential (Bisa / Kemampuan)", w_prefix + "来られる", r_prefix + "こられる")
        ]
        # Fix the きた form
        forms[3] = ("Ta (Masa Lalu Biasa)", w_prefix + "来た", r_prefix + "きた")
        for name, w_val, r_val in forms:
            conjugations.append({"form": name, "kanji": w_val, "kana": r_val})

    elif is_suru:
        # Suru (する) verb
        w_prefix = word
        if w_prefix.endswith('する'):
            w_prefix = w_prefix[:-2]
        
        r_prefix = reading
        if r_prefix.endswith('する'):
            r_prefix = r_prefix[:-2]

        forms = [
            ("Kamus (Biasa / Kamus)", w_prefix + "する", r_prefix + "する"),
            ("Masu (Sopan)", w_prefix + "します", r_prefix + "します"),
            ("Te (Permohonan / Penghubung)", w_prefix + "して", r_prefix + "して"),
            ("Ta (Masa Lalu Biasa)", w_prefix + "した", r_prefix + "した"),
            ("Nai (Negatif Biasa)", w_prefix + "しない", r_prefix + "しない"),
            ("Nakatta (Negatif Lampau)", w_prefix + "しなかった", r_prefix + "しなかった"),
            ("Volitional (Ajakan)", w_prefix + "しよう", r_prefix + "しよう"),
            ("Conditional (Syarat)", w_prefix + "すれば", r_prefix + "すれば"),
            ("Potential (Bisa / Kemampuan)", w_prefix + "できる", r_prefix + "できる")
        ]
        for name, w_val, r_val in forms:
            conjugations.append({"form": name, "kanji": w_val, "kana": r_val})

    elif is_ichidan:
        # Ichidan (Group 2)
        w_stem = word[:-1] if word.endswith('る') else word
        r_stem = reading[:-1] if reading.endswith('る') else reading

        forms = [
            ("Kamus (Biasa / Kamus)", w_stem + "る", r_stem + "る"),
            ("Masu (Sopan)", w_stem + "ます", r_stem + "ます"),
            ("Te (Permohonan / Penghubung)", w_stem + "て", r_stem + "て"),
            ("Ta (Masa Lalu Biasa)", w_stem + "た", r_stem + "た"),
            ("Nai (Negatif Biasa)", w_stem + "ない", r_stem + "ない"),
            ("Nakatta (Negatif Lampau)", w_stem + "なかった", r_stem + "なかった"),
            ("Volitional (Ajakan)", w_stem + "よう", r_stem + "よう"),
            ("Conditional (Syarat)", w_stem + "れば", r_stem + "れば"),
            ("Potential (Bisa / Kemampuan)", w_stem + "られる", r_stem + "られる")
        ]
        for name, w_val, r_val in forms:
            conjugations.append({"form": name, "kanji": w_val, "kana": r_val})

    elif is_godan:
        # Godan (Group 1)
        last_char = reading[-1] if reading else ""
        if last_char not in GODAN_MAP:
            return None
        
        a_row, i_row, e_row, o_row, te_suff, ta_suff = GODAN_MAP[last_char]
        
        w_stem = word[:-1] if word else ""
        r_stem = reading[:-1] if reading else ""

        is_iku = (reading == 'いく') or reading.endswith('いく') or (word == '行く') or word.endswith('行く')
        if is_iku:
            te_suff = 'って'
            ta_suff = 'った'

        forms = [
            ("Kamus (Biasa / Kamus)", word, reading),
            ("Masu (Sopan)", w_stem + i_row + "ます", r_stem + i_row + "ます"),
            ("Te (Permohonan / Penghubung)", w_stem + te_suff, r_stem + te_suff),
            ("Ta (Masa Lalu Biasa)", w_stem + ta_suff, r_stem + ta_suff),
            ("Nai (Negatif Biasa)", w_stem + a_row + "ない", r_stem + a_row + "ない"),
            ("Nakatta (Negatif Lampau)", w_stem + a_row + "なかった", r_stem + a_row + "なかった"),
            ("Volitional (Ajakan)", w_stem + o_row + "う", r_stem + o_row + "う"),
            ("Conditional (Syarat)", w_stem + e_row + "ば", r_stem + e_row + "ば"),
            ("Potential (Bisa / Kemampuan)", w_stem + e_row + "る", r_stem + e_row + "る")
        ]
        for name, w_val, r_val in forms:
            conjugations.append({"form": name, "kanji": w_val, "kana": r_val})

    return conjugations
