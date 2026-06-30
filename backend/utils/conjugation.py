from utils.kana import to_kana

def deconjugate_verb(input_str: str) -> list:
    """
    Tries to deconjugate a Japanese verb form back to possible dictionary forms.
    Returns list of candidate kana strings (since we don't know kanji).
    """
    input_str = to_kana(input_str.strip())
    candidates = set()

    # First, check if it's already a dictionary form (ends with u-row kana)
    if len(input_str) > 0 and input_str[-1] in ['う', 'く', 'ぐ', 'す', 'つ', 'む', 'ぶ', 'ぬ', 'る']:
        candidates.add(input_str)
        # Special check for suru verbs that might end with する
        if input_str.endswith('する'):
            candidates.add(input_str)

    # Helper function to add ichidan candidates
    def try_ichidan(base):
        if base:
            candidates.add(base + 'る')

    # Helper function to add godan candidates with a-row endings
    def try_godan(base):
        for ending in ['う', 'く', 'ぐ', 'す', 'つ', 'む', 'ぶ', 'ぬ', 'る']:
            candidates.add(base + ending)

    # --- Deconjugate from known patterns ---
    # 1. Masu-form (polite present, ends with ます / ません / ました / ませんでした)
    if input_str.endswith('ます'):
        stem = input_str[:-2]
        # Could be ichidan (stem+ru)
        try_ichidan(stem)
        # Could be godan: i-stem + ます → base = stem, add u-row endings
        try_godan(stem)
        # Check for kuru: stem=き → くる
        if stem == 'き':
            candidates.add('くる')
        # Check for suru: stem=し → する
        if stem == 'し':
            candidates.add('する')

    if input_str.endswith('ません'):
        stem = input_str[:-3]
        try_ichidan(stem)
        try_godan(stem)
        if stem == 'き':
            candidates.add('くる')
        if stem == 'し':
            candidates.add('する')

    if input_str.endswith('ました'):
        stem = input_str[:-3]
        try_ichidan(stem)
        try_godan(stem)
        if stem == 'き':
            candidates.add('くる')
        if stem == 'し':
            candidates.add('する')

    if input_str.endswith('ませんでした'):
        stem = input_str[:-6]
        try_ichidan(stem)
        try_godan(stem)
        if stem == 'き':
            candidates.add('くる')
        if stem == 'し':
            candidates.add('する')

    # 2. Te-form (て / で)
    if len(input_str) >= 2:
        te_ending = input_str[-1]
        if te_ending in ['て', 'で']:
            # Remove te/de first
            te_stem = input_str[:-1]
            # Ichidan te-form = stem + て → stem + ru
            try_ichidan(te_stem)
            # Kuru special te-form: きて → くる
            if input_str == 'きて':
                candidates.add('くる')
            # Suru special te-form: して → する
            if input_str == 'して':
                candidates.add('する')
            # Godan te-form patterns:
            # Check for small tsu (って → godan ending with u/tsu/ru)
            if te_stem and te_stem[-1] == 'っ':
                base = te_stem[:-1]
                for end in ['う', 'つ', 'る']:
                    candidates.add(base + end)
            # Check for んで → godan ending with mu/bu/nu
            elif te_stem and te_stem[-1] == 'ん':
                base = te_stem[:-1]
                for end in ['む', 'ぶ', 'ぬ']:
                    candidates.add(base + end)
            # Check for i-te / i-de (ku/gu ending)
            elif len(input_str) >=2 and input_str[-2] in ['い', 'き', 'ぎ']:
                base = te_stem
                candidates.add(base + 'く')
                candidates.add(base + 'ぐ')
            # Check for shi-te (su ending)
            elif te_stem and te_stem[-1] == 'し':
                base = te_stem[:-1]
                candidates.add(base + 'す')
            # Check for e-row + te (imperative for godan, but also te-form?)
            else:
                try_godan(te_stem)

    # 3. Ta-form (past tense: た / だ)
    if len(input_str) >=2:
        ta_ending = input_str[-1]
        if ta_ending in ['た', 'だ']:
            ta_stem = input_str[:-1]
            try_ichidan(ta_stem)
            if input_str == 'きた':
                candidates.add('くる')
            if input_str == 'した':
                candidates.add('する')
            if ta_stem and ta_stem[-1] == 'っ':
                base = ta_stem[:-1]
                for end in ['う', 'つ', 'る']:
                    candidates.add(base + end)
            elif ta_stem and ta_stem[-1] == 'ん':
                base = ta_stem[:-1]
                for end in ['む', 'ぶ', 'ぬ']:
                    candidates.add(base + end)
            elif len(input_str)>=2 and input_str[-2] in ['い', 'き', 'ぎ']:
                base = ta_stem
                candidates.add(base + 'く')
                candidates.add(base + 'ぐ')
            elif ta_stem and ta_stem[-1] == 'し':
                base = ta_stem[:-1]
                candidates.add(base + 'す')
            else:
                try_godan(ta_stem)

    # 4. Nai-form (negative informal: ない)
    if input_str.endswith('ない'):
        nai_stem = input_str[:-2]
        # Ichidan nai = stem + ない
        try_ichidan(nai_stem)
        # Kuru special: こない → くる
        if input_str == 'こない':
            candidates.add('くる')
        # Suru special: しない → する
        if input_str == 'しない':
            candidates.add('する')
        # Godan nai: a-stem + ない
        if nai_stem and len(nai_stem) >0:
            a_char = nai_stem[-1]
            # Map a-row to u-row for godan
            godan_end_map = {
                'わ': 'う',
                'た': 'つ',
                'ら': 'る',
                'ま': 'む',
                'ば': 'ぶ',
                'な': 'ぬ',
                'か': 'く',
                'が': 'ぐ',
                'さ': 'す'
            }
            if a_char in godan_end_map:
                base = nai_stem[:-1]
                candidates.add(base + godan_end_map[a_char])
            else:
                try_godan(nai_stem)

    # 5. Nakatta-form (negative past informal: なかった)
    if input_str.endswith('なかった'):
        nakatta_stem = input_str[:-5]
        try_ichidan(nakatta_stem)
        if input_str == 'こなかった':
            candidates.add('くる')
        if input_str == 'しなかった':
            candidates.add('する')
        if nakatta_stem and len(nakatta_stem) >0:
            a_char = nakatta_stem[-1]
            godan_end_map = {
                'わ': 'う',
                'た': 'つ',
                'ら': 'る',
                'ま': 'む',
                'ば': 'ぶ',
                'な': 'ぬ',
                'か': 'く',
                'が': 'ぐ',
                'さ': 'す'
            }
            if a_char in godan_end_map:
                base = nakatta_stem[:-1]
                candidates.add(base + godan_end_map[a_char])
            else:
                try_godan(nakatta_stem)

    # 6. Volitional (おう / よう / ましょう)
    if input_str.endswith('よう') or input_str.endswith('おう') or input_str.endswith('う') and len(input_str)>=2:
        if input_str.endswith('ましょう'):
            stem = input_str[:-4]
            try_ichidan(stem)
            try_godan(stem)
            if stem == 'き':
                candidates.add('くる')
            if stem == 'し':
                candidates.add('する')
        else:
            # Regular volitional
            vol_stem = input_str[:-1]
            last_char = input_str[-1]
            if last_char == 'う':
                if input_str.endswith('こよう'):
                    candidates.add('くる')
                if input_str.endswith('しよう'):
                    candidates.add('する')
                # Ichidan volitional: stem + よう
                try_ichidan(vol_stem)
                # Godan volitional: o-stem + う
                if len(vol_stem)>=1:
                    o_char = vol_stem[-1]
                    godan_end_map_o = {
                        'お': 'う',
                        'と': 'つ',
                        'ろ': 'る',
                        'も': 'む',
                        'ぼ': 'ぶ',
                        'の': 'ぬ',
                        'こ': 'く',
                        'ご': 'ぐ',
                        'そ': 'す'
                    }
                    if o_char in godan_end_map_o:
                        base = vol_stem[:-1]
                        candidates.add(base + godan_end_map_o[o_char])
                    else:
                        try_godan(vol_stem)

    # 7. Imperative (command form: e-row, ろ, こい, しろ, なさい)
    if input_str.endswith('なさい'):
        stem = input_str[:-3]
        try_ichidan(stem)
        try_godan(stem)
        if stem == 'き':
            candidates.add('くる')
        if stem == 'し':
            candidates.add('する')
    else:
        # Short imperatives
        if input_str == 'こい':
            candidates.add('くる')
        if input_str == 'しろ':
            candidates.add('する')
        if len(input_str)>=1:
            last_char = input_str[-1]
            # Ichidan imperative ends with ろ
            if last_char == 'ろ':
                try_ichidan(input_str[:-1])
            # Godan imperative ends with e-row kana
            e_row_chars = ['え', 'け', 'げ', 'せ', 'て', 'ね', 'べ', 'め', 'れ']
            if last_char in e_row_chars:
                godan_end_map_e = {
                    'え': 'う',
                    'て': 'つ',
                    'れ': 'る',
                    'め': 'む',
                    'べ': 'ぶ',
                    'ね': 'ぬ',
                    'け': 'く',
                    'げ': 'ぐ',
                    'せ': 'す'
                }
                if last_char in godan_end_map_e:
                    base = input_str[:-1]
                    candidates.add(base + godan_end_map_e[last_char])
                else:
                    try_godan(input_str[:-1])

    # 8. Potential (える / られる / できる)
    if input_str.endswith('られる'):
        # Could be ichidan potential or passive/causative
        stem = input_str[:-3]
        try_ichidan(stem)
        if stem == 'こら':
            candidates.add('くる')
    if input_str.endswith('できる'):
        # Suru potential
        stem = input_str[:-4]
        candidates.add(stem + 'する')
    if len(input_str)>=2 and input_str[-1] == 'る' and input_str[-2] in ['え', 'け', 'げ', 'せ', 'て', 'ね', 'べ', 'め', 'れ']:
        # Godan potential (e-stem + ru)
        godan_end_map_e = {
            'え': 'う',
            'て': 'つ',
            'れ': 'る',
            'め': 'む',
            'べ': 'ぶ',
            'ね': 'ぬ',
            'け': 'く',
            'げ': 'ぐ',
            'せ': 'す'
        }
        base = input_str[:-2]
        if input_str[-2] in godan_end_map_e:
            candidates.add(base + godan_end_map_e[input_str[-2]])
        else:
            try_godan(base)

    # 9. Passive/Causative (れる / られる / させる / こさせる)
    if input_str.endswith('させる'):
        stem = input_str[:-3]
        candidates.add(stem + 'する')
        # Also check for godan causative: a-stem + せる
        if stem and len(stem)>=1:
            a_char = stem[-1]
            godan_end_map = {
                'わ': 'う',
                'た': 'つ',
                'ら': 'る',
                'ま': 'む',
                'ば': 'ぶ',
                'な': 'ぬ',
                'か': 'く',
                'が': 'ぐ',
                'さ': 'す'
            }
            if a_char in godan_end_map:
                base = stem[:-1]
                candidates.add(base + godan_end_map[a_char])
    if input_str.endswith('れる') and not input_str.endswith('られる'):
        # Godan passive/causative: a-stem + れる
        stem = input_str[:-2]
        if stem and len(stem)>=1:
            a_char = stem[-1]
            godan_end_map = {
                'わ': 'う',
                'た': 'つ',
                'ら': 'る',
                'ま': 'む',
                'ば': 'ぶ',
                'な': 'ぬ',
                'か': 'く',
                'が': 'ぐ',
                'さ': 'す'
            }
            if a_char in godan_end_map:
                base = stem[:-1]
                candidates.add(base + godan_end_map[a_char])

    return sorted(list(candidates))

GODAN_MAP = {
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

def _get_stems(word: str, reading: str, is_suru: bool, is_kuru: bool, is_ichidan: bool, is_godan: bool):
    """Helper function to get stems for conjugation based on verb type."""
    w_stem = word
    r_stem = reading
    te_form = ""
    ta_form = ""
    a_stem = ""
    i_stem = ""
    e_stem = ""
    o_stem = ""
    
    if is_kuru:
        w_prefix = word[:-2] if word.endswith('来る') or word.endswith('くる') else (word[:-2] if len(word) >=2 else "")
        r_prefix = reading[:-2] if reading.endswith('くる') else (reading[:-2] if len(reading)>=2 else "")
        return {
            'w_prefix': w_prefix,
            'r_prefix': r_prefix,
            'te_form': w_prefix + "来て",
            'te_kana': r_prefix + "きて",
            'ta_form': w_prefix + "来た",
            'ta_kana': r_prefix + "きた",
            'nai_stem_kana': r_prefix + "こな",
            'vol_stem_kana': r_prefix + "こよ",
            'cond_stem_kana': r_prefix + "くれ",
            'pot_stem_kana': r_prefix + "こられ",
            'passive_stem_kana': r_prefix + "こられ",
            'causative_stem_kana': r_prefix + "こさ",
            'imperative_kana': r_prefix + "こい",
        }
    
    if is_suru:
        w_prefix = word[:-2] if word.endswith('する') else word
        r_prefix = reading[:-2] if reading.endswith('する') else reading
        return {
            'w_prefix': w_prefix,
            'r_prefix': r_prefix,
            'te_form': w_prefix + "して",
            'te_kana': r_prefix + "して",
            'ta_form': w_prefix + "した",
            'ta_kana': r_prefix + "した",
            'nai_stem_kana': r_prefix + "しな",
            'vol_stem_kana': r_prefix + "しよ",
            'cond_stem_kana': r_prefix + "すれ",
            'pot_stem_kana': r_prefix + "でき",
            'passive_stem_kana': r_prefix + "され",
            'causative_stem_kana': r_prefix + "させ",
            'imperative_kana': r_prefix + "しろ",
        }
        
    if is_ichidan:
        w_stem = word[:-1] if word.endswith('る') else word
        r_stem = reading[:-1] if reading.endswith('る') else reading
        te_form = w_stem + "て"
        te_kana = r_stem + "て"
        ta_form = w_stem + "た"
        ta_kana = r_stem + "た"
        return {
            'w_prefix': w_stem,
            'r_prefix': r_stem,
            'te_form': te_form,
            'te_kana': te_kana,
            'ta_form': ta_form,
            'ta_kana': ta_kana,
            'nai_stem_kana': r_stem + "な",
            'vol_stem_kana': r_stem + "よ",
            'cond_stem_kana': r_stem + "れ",
            'pot_stem_kana': r_stem + "られ",
            'passive_stem_kana': r_stem + "られ",
            'causative_stem_kana': r_stem + "させ",
            'imperative_kana': r_stem + "ろ",
        }
        
    if is_godan:
        last_char = reading[-1] if reading else ""
        a_row, i_row, e_row, o_row, te_suff, ta_suff = GODAN_MAP[last_char]
        
        w_stem = word[:-1] if word else ""
        r_stem = reading[:-1] if reading else ""
        
        is_iku = (reading == 'いく') or reading.endswith('いく') or (word == '行く') or word.endswith('行く')
        if is_iku:
            te_suff = 'って'
            ta_suff = 'った'
            
        te_form = w_stem + te_suff
        te_kana = r_stem + te_suff
        ta_form = w_stem + ta_suff
        ta_kana = r_stem + ta_suff
        
        return {
            'w_prefix': w_stem,
            'r_prefix': r_stem,
            'a_row': a_row,
            'i_row': i_row,
            'e_row': e_row,
            'o_row': o_row,
            'te_form': te_form,
            'te_kana': te_kana,
            'ta_form': ta_form,
            'ta_kana': ta_kana,
            'nai_stem_kana': r_stem + a_row + "な",
            'vol_stem_kana': r_stem + o_row,
            'cond_stem_kana': r_stem + e_row,
            'pot_stem_kana': r_stem + e_row,
            'passive_stem_kana': r_stem + a_row + "れ",
            'causative_stem_kana': r_stem + a_row + "せ",
            'imperative_kana': r_stem + e_row,
        }
        
    return None

def conjugate_verb_complete(word: str, reading: str, word_type: str = None):
    """
    Complete conjugation system covering 9 main forms with all 4 variants!
    Returns dict {
        "forms": [
            {
                "name": "Indikatif",
                "variants": {
                    "default": {"kanji": "...", "kana": "..."},
                    "formal": {"kanji": "...", "kana": "..."},
                    "negative": {"kanji": "...", "kana": "..."},
                    "past": {"kanji": "...", "kana": "..."},
                    "formal_negative": {"kanji": "...", "kana": "..."},
                    "formal_past": {"kanji": "...", "kana": "..."},
                    "negative_past": {"kanji": "...", "kana": "..."},
                    "formal_negative_past": {"kanji": "...", "kana": "..."},
                }
            },
            ... total 9 forms
        ]
    }
    """
    if not word or not reading:
        return None
        
    # Clean inputs
    word = word.strip()
    reading = reading.strip()

    # Determine verb type
    is_suru = False
    is_kuru = False
    is_ichidan = False
    is_godan = False
    
    # Check kuru first
    if reading == 'くる' or reading.endswith('くる') or word == '来る' or word.endswith('来る'):
        is_kuru = True
    elif word_type == 'suru' or word.endswith('する') or reading.endswith('する'):
        is_suru = True
    elif word_type == 'ichidan':
        is_ichidan = True
    elif word_type == 'godan':
        is_godan = True
    else:
        # Heuristics
        if word.endswith('する') or reading.endswith('する'):
            is_suru = True
        elif word.endswith('る') and (reading.endswith('いる') or reading.endswith('える')):
            is_ichidan = True
        elif any(reading.endswith(suffix) for suffix in GODAN_MAP.keys()):
            is_godan = True
        else:
            return None
            
    # Get stems
    stems = _get_stems(word, reading, is_suru, is_kuru, is_ichidan, is_godan)
    if not stems:
        return None
        
    forms = []
    
    # 1. Indikatif (Dictionary / Plain present)
    indikatif = {
        "name": "Indikatif",
        "variants": {
            "default": {"kanji": word, "kana": reading},
            "formal": {"kanji": "", "kana": ""},
            "negative": {"kanji": "", "kana": ""},
            "past": {"kanji": "", "kana": ""},
            "formal_negative": {"kanji": "", "kana": ""},
            "formal_past": {"kanji": "", "kana": ""},
            "negative_past": {"kanji": "", "kana": ""},
            "formal_negative_past": {"kanji": "", "kana": ""},
        }
    }
    
    if is_kuru:
        indikatif["variants"]["formal"] = {"kanji": stems["w_prefix"] + "来ます", "kana": stems["r_prefix"] + "きます"}
        indikatif["variants"]["negative"] = {"kanji": stems["w_prefix"] + "来ない", "kana": stems["r_prefix"] + "こない"}
        indikatif["variants"]["past"] = {"kanji": stems["ta_form"], "kana": stems["ta_kana"]}
        indikatif["variants"]["formal_negative"] = {"kanji": stems["w_prefix"] + "来ません", "kana": stems["r_prefix"] + "きません"}
        indikatif["variants"]["formal_past"] = {"kanji": stems["w_prefix"] + "来ました", "kana": stems["r_prefix"] + "きました"}
        indikatif["variants"]["negative_past"] = {"kanji": stems["w_prefix"] + "来なかった", "kana": stems["r_prefix"] + "こなかった"}
        indikatif["variants"]["formal_negative_past"] = {"kanji": stems["w_prefix"] + "来ませんでした", "kana": stems["r_prefix"] + "きませんでした"}
    elif is_suru:
        indikatif["variants"]["formal"] = {"kanji": stems["w_prefix"] + "します", "kana": stems["r_prefix"] + "します"}
        indikatif["variants"]["negative"] = {"kanji": stems["w_prefix"] + "しない", "kana": stems["r_prefix"] + "しない"}
        indikatif["variants"]["past"] = {"kanji": stems["ta_form"], "kana": stems["ta_kana"]}
        indikatif["variants"]["formal_negative"] = {"kanji": stems["w_prefix"] + "しません", "kana": stems["r_prefix"] + "しません"}
        indikatif["variants"]["formal_past"] = {"kanji": stems["w_prefix"] + "しました", "kana": stems["r_prefix"] + "しました"}
        indikatif["variants"]["negative_past"] = {"kanji": stems["w_prefix"] + "しなかった", "kana": stems["r_prefix"] + "しなかった"}
        indikatif["variants"]["formal_negative_past"] = {"kanji": stems["w_prefix"] + "しませんでした", "kana": stems["r_prefix"] + "しませんでした"}
    elif is_ichidan:
        indikatif["variants"]["formal"] = {"kanji": stems["w_prefix"] + "ます", "kana": stems["r_prefix"] + "ます"}
        indikatif["variants"]["negative"] = {"kanji": stems["w_prefix"] + "ない", "kana": stems["r_prefix"] + "ない"}
        indikatif["variants"]["past"] = {"kanji": stems["ta_form"], "kana": stems["ta_kana"]}
        indikatif["variants"]["formal_negative"] = {"kanji": stems["w_prefix"] + "ません", "kana": stems["r_prefix"] + "ません"}
        indikatif["variants"]["formal_past"] = {"kanji": stems["w_prefix"] + "ました", "kana": stems["r_prefix"] + "ました"}
        indikatif["variants"]["negative_past"] = {"kanji": stems["w_prefix"] + "なかった", "kana": stems["r_prefix"] + "なかった"}
        indikatif["variants"]["formal_negative_past"] = {"kanji": stems["w_prefix"] + "ませんでした", "kana": stems["r_prefix"] + "ませんでした"}
    elif is_godan:
        indikatif["variants"]["formal"] = {"kanji": stems["w_prefix"] + stems["i_row"] + "ます", "kana": stems["r_prefix"] + stems["i_row"] + "ます"}
        indikatif["variants"]["negative"] = {"kanji": stems["w_prefix"] + stems["a_row"] + "ない", "kana": stems["r_prefix"] + stems["a_row"] + "ない"}
        indikatif["variants"]["past"] = {"kanji": stems["ta_form"], "kana": stems["ta_kana"]}
        indikatif["variants"]["formal_negative"] = {"kanji": stems["w_prefix"] + stems["i_row"] + "ません", "kana": stems["r_prefix"] + stems["i_row"] + "ません"}
        indikatif["variants"]["formal_past"] = {"kanji": stems["w_prefix"] + stems["i_row"] + "ました", "kana": stems["r_prefix"] + stems["i_row"] + "ました"}
        indikatif["variants"]["negative_past"] = {"kanji": stems["w_prefix"] + stems["a_row"] + "なかった", "kana": stems["r_prefix"] + stems["a_row"] + "なかった"}
        indikatif["variants"]["formal_negative_past"] = {"kanji": stems["w_prefix"] + stems["i_row"] + "ませんでした", "kana": stems["r_prefix"] + stems["i_row"] + "ませんでした"}
    forms.append(indikatif)
    
    # 2. Progresif (Te-iru)
    def _build_te_iru(base_kanji, base_kana):
        return {
            "name": "Progresif",
            "variants": {
                "default": {"kanji": base_kanji + "いる", "kana": base_kana + "いる"},
                "formal": {"kanji": base_kanji + "います", "kana": base_kana + "います"},
                "negative": {"kanji": base_kanji + "いない", "kana": base_kana + "いない"},
                "past": {"kanji": base_kanji + "いた", "kana": base_kana + "いた"},
                "formal_negative": {"kanji": base_kanji + "いません", "kana": base_kana + "いません"},
                "formal_past": {"kanji": base_kanji + "いました", "kana": base_kana + "いました"},
                "negative_past": {"kanji": base_kanji + "いなかった", "kana": base_kana + "いなかった"},
                "formal_negative_past": {"kanji": base_kanji + "いませんでした", "kana": base_kana + "いませんでした"},
            }
        }
    forms.append(_build_te_iru(stems["te_form"], stems["te_kana"]))
    
    # 3. Imperatif
    imperatif = {"name": "Imperatif", "variants": {}}
    if is_kuru:
        imperatif["variants"]["default"] = {"kanji": stems["w_prefix"] + "来い", "kana": stems["r_prefix"] + "こい"}
        imperatif["variants"]["formal"] = {"kanji": stems["w_prefix"] + "来てください", "kana": stems["r_prefix"] + "きてください"}
    elif is_suru:
        imperatif["variants"]["default"] = {"kanji": stems["w_prefix"] + "しろ", "kana": stems["r_prefix"] + "しろ"}
        imperatif["variants"]["formal"] = {"kanji": stems["w_prefix"] + "してください", "kana": stems["r_prefix"] + "してください"}
    elif is_ichidan:
        imperatif["variants"]["default"] = {"kanji": stems["w_prefix"] + "ろ", "kana": stems["r_prefix"] + "ろ"}
        imperatif["variants"]["formal"] = {"kanji": stems["te_form"] + "ください", "kana": stems["te_kana"] + "ください"}
    elif is_godan:
        imperatif["variants"]["default"] = {"kanji": stems["w_prefix"] + stems["e_row"], "kana": stems["r_prefix"] + stems["e_row"]}
        imperatif["variants"]["formal"] = {"kanji": stems["te_form"] + "ください", "kana": stems["te_kana"] + "ください"}
    imperatif["variants"]["negative"] = {"kanji": indikatif["variants"]["negative"]["kanji"] + "な", "kana": indikatif["variants"]["negative"]["kana"] + "な"}
    imperatif["variants"]["past"] = None
    forms.append(imperatif)
    
    # 4. Volisional
    volisional = {"name": "Volisional", "variants": {}}
    if is_kuru:
        volisional["variants"]["default"] = {"kanji": stems["w_prefix"] + "来よう", "kana": stems["r_prefix"] + "こよう"}
        volisional["variants"]["formal"] = {"kanji": stems["w_prefix"] + "来ましょう", "kana": stems["r_prefix"] + "きましょう"}
    elif is_suru:
        volisional["variants"]["default"] = {"kanji": stems["w_prefix"] + "しよう", "kana": stems["r_prefix"] + "しよう"}
        volisional["variants"]["formal"] = {"kanji": stems["w_prefix"] + "しましょう", "kana": stems["r_prefix"] + "しましょう"}
    elif is_ichidan:
        volisional["variants"]["default"] = {"kanji": stems["w_prefix"] + "よう", "kana": stems["r_prefix"] + "よう"}
        volisional["variants"]["formal"] = {"kanji": stems["w_prefix"] + "ましょう", "kana": stems["r_prefix"] + "ましょう"}
    elif is_godan:
        volisional["variants"]["default"] = {"kanji": stems["w_prefix"] + stems["o_row"] + "う", "kana": stems["r_prefix"] + stems["o_row"] + "う"}
        volisional["variants"]["formal"] = {"kanji": stems["w_prefix"] + stems["i_row"] + "ましょう", "kana": stems["r_prefix"] + stems["i_row"] + "ましょう"}
    forms.append(volisional)
    
    # 5. Potensial
    potensial = {"name": "Potensial", "variants": {}}
    if is_kuru:
        _base_pot_kanji = stems["w_prefix"] + "来られ"
        _base_pot_kana = stems["r_prefix"] + "こられ"
    elif is_suru:
        _base_pot_kanji = stems["w_prefix"] + "でき"
        _base_pot_kana = stems["r_prefix"] + "でき"
    elif is_ichidan:
        _base_pot_kanji = stems["w_prefix"] + "られ"
        _base_pot_kana = stems["r_prefix"] + "られ"
    elif is_godan:
        _base_pot_kanji = stems["w_prefix"] + stems["e_row"]
        _base_pot_kana = stems["r_prefix"] + stems["e_row"]
        
    potensial["variants"]["default"] = {"kanji": _base_pot_kanji + "る", "kana": _base_pot_kana + "る"}
    potensial["variants"]["formal"] = {"kanji": _base_pot_kanji + "ます", "kana": _base_pot_kana + "ます"}
    potensial["variants"]["negative"] = {"kanji": _base_pot_kanji + "ない", "kana": _base_pot_kana + "ない"}
    potensial["variants"]["past"] = {"kanji": _base_pot_kanji + "た", "kana": _base_pot_kana + "た"}
    potensial["variants"]["formal_negative"] = {"kanji": _base_pot_kanji + "ません", "kana": _base_pot_kana + "ません"}
    potensial["variants"]["formal_past"] = {"kanji": _base_pot_kanji + "ました", "kana": _base_pot_kana + "ました"}
    potensial["variants"]["negative_past"] = {"kanji": _base_pot_kanji + "なかった", "kana": _base_pot_kana + "なかった"}
    potensial["variants"]["formal_negative_past"] = {"kanji": _base_pot_kanji + "ませんでした", "kana": _base_pot_kana + "ませんでした"}
    forms.append(potensial)
    
    # 6. Kondisional
    kondisional = {"name": "Kondisional", "variants": {}}
    if is_kuru:
        kondisional["variants"]["default"] = {"kanji": stems["w_prefix"] + "来れば", "kana": stems["r_prefix"] + "くれば"}
    elif is_suru:
        kondisional["variants"]["default"] = {"kanji": stems["w_prefix"] + "すれば", "kana": stems["r_prefix"] + "すれば"}
    elif is_ichidan:
        kondisional["variants"]["default"] = {"kanji": stems["w_prefix"] + "れば", "kana": stems["r_prefix"] + "れば"}
    elif is_godan:
        kondisional["variants"]["default"] = {"kanji": stems["w_prefix"] + stems["e_row"] + "ば", "kana": stems["r_prefix"] + stems["e_row"] + "ば"}
    # Add Tara form too (past conditional)
    kondisional["variants"]["past"] = {"kanji": stems["ta_form"] + "ら", "kana": stems["ta_kana"] + "ら"}
    forms.append(kondisional)
    
    # 7. Shimau
    shimau = {"name": "Shimau", "variants": {}}
    def _build_shimau(base_te_kanji, base_te_kana):
        return {
            "default": {"kanji": base_te_kanji + "しまう", "kana": base_te_kana + "しまう"},
            "formal": {"kanji": base_te_kanji + "しまいます", "kana": base_te_kana + "しまいます"},
            "negative": {"kanji": base_te_kanji + "しまわない", "kana": base_te_kana + "しまわない"},
            "past": {"kanji": base_te_kanji + "しまった", "kana": base_te_kana + "しまった"},
            "formal_negative": {"kanji": base_te_kanji + "しまいません", "kana": base_te_kana + "しまいません"},
            "formal_past": {"kanji": base_te_kanji + "しまいました", "kana": base_te_kana + "しまいました"},
            "negative_past": {"kanji": base_te_kanji + "しまわなかった", "kana": base_te_kana + "しまわなかった"},
            "formal_negative_past": {"kanji": base_te_kanji + "しまいませんでした", "kana": base_te_kana + "しまいませんでした"},
        }
    shimau["variants"] = _build_shimau(stems["te_form"], stems["te_kana"])
    forms.append(shimau)
    
    # 8. Passive
    passive = {"name": "Passive", "variants": {}}
    if is_kuru:
        _base_pass_kanji = stems["w_prefix"] + "来られ"
        _base_pass_kana = stems["r_prefix"] + "こられ"
    elif is_suru:
        _base_pass_kanji = stems["w_prefix"] + "され"
        _base_pass_kana = stems["r_prefix"] + "され"
    elif is_ichidan:
        _base_pass_kanji = stems["w_prefix"] + "られ"
        _base_pass_kana = stems["r_prefix"] + "られ"
    elif is_godan:
        _base_pass_kanji = stems["w_prefix"] + stems["a_row"] + "れ"
        _base_pass_kana = stems["r_prefix"] + stems["a_row"] + "れ"
        
    passive["variants"]["default"] = {"kanji": _base_pass_kanji + "る", "kana": _base_pass_kana + "る"}
    passive["variants"]["formal"] = {"kanji": _base_pass_kanji + "ます", "kana": _base_pass_kana + "ます"}
    passive["variants"]["negative"] = {"kanji": _base_pass_kanji + "ない", "kana": _base_pass_kana + "ない"}
    passive["variants"]["past"] = {"kanji": _base_pass_kanji + "た", "kana": _base_pass_kana + "た"}
    passive["variants"]["formal_negative"] = {"kanji": _base_pass_kanji + "ません", "kana": _base_pass_kana + "ません"}
    passive["variants"]["formal_past"] = {"kanji": _base_pass_kanji + "ました", "kana": _base_pass_kana + "ました"}
    passive["variants"]["negative_past"] = {"kanji": _base_pass_kanji + "なかった", "kana": _base_pass_kana + "なかった"}
    passive["variants"]["formal_negative_past"] = {"kanji": _base_pass_kanji + "ませんでした", "kana": _base_pass_kana + "ませんでした"}
    forms.append(passive)
    
    # 9. Causative
    causative = {"name": "Causative", "variants": {}}
    if is_kuru:
        _base_caus_kanji = stems["w_prefix"] + "来さ"
        _base_caus_kana = stems["r_prefix"] + "こさ"
    elif is_suru:
        _base_caus_kanji = stems["w_prefix"] + "させ"
        _base_caus_kana = stems["r_prefix"] + "させ"
    elif is_ichidan:
        _base_caus_kanji = stems["w_prefix"] + "させ"
        _base_caus_kana = stems["r_prefix"] + "させ"
    elif is_godan:
        _base_caus_kanji = stems["w_prefix"] + stems["a_row"] + "せ"
        _base_caus_kana = stems["r_prefix"] + stems["a_row"] + "せ"
        
    causative["variants"]["default"] = {"kanji": _base_caus_kanji + "る", "kana": _base_caus_kana + "る"}
    causative["variants"]["formal"] = {"kanji": _base_caus_kanji + "ます", "kana": _base_caus_kana + "ます"}
    causative["variants"]["negative"] = {"kanji": _base_caus_kanji + "ない", "kana": _base_caus_kana + "ない"}
    causative["variants"]["past"] = {"kanji": _base_caus_kanji + "た", "kana": _base_caus_kana + "た"}
    causative["variants"]["formal_negative"] = {"kanji": _base_caus_kanji + "ません", "kana": _base_caus_kana + "ません"}
    causative["variants"]["formal_past"] = {"kanji": _base_caus_kanji + "ました", "kana": _base_caus_kana + "ました"}
    causative["variants"]["negative_past"] = {"kanji": _base_caus_kanji + "なかった", "kana": _base_caus_kana + "なかった"}
    causative["variants"]["formal_negative_past"] = {"kanji": _base_caus_kanji + "ませんでした", "kana": _base_caus_kana + "ませんでした"}
    forms.append(causative)
    
    return {"forms": forms}


# Keep the old function for backward compatibility
def conjugate_verb(word: str, reading: str, word_type: str) -> list:
    data = conjugate_verb_complete(word, reading, word_type)
    if not data:
        return None
        
    # Convert back to old flat list format if needed
    res = []
    for form in data["forms"]:
        for var_name, var_val in form["variants"].items():
            if var_val:
                res.append({
                    "form": f"{form['name']} ({var_name})",
                    "kanji": var_val["kanji"],
                    "kana": var_val["kana"]
                })
    return res
