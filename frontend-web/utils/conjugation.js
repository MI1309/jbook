import { to_kana } from '@/lib/utils';

export function deconjugate_verb(input_str) {
    input_str = to_kana(input_str.trim());
    const candidates = new Set();

    if (input_str.length > 0 && ['う', 'く', 'ぐ', 'す', 'つ', 'む', 'ぶ', 'ぬ', 'る'].includes(input_str[input_str.length - 1])) {
        candidates.add(input_str);
        if (input_str.endsWith('する')) {
            candidates.add(input_str);
        }
    }

    const try_ichidan = (base) => {
        if (base) {
            candidates.add(base + 'る');
        }
    };

    const try_godan = (base) => {
        ['う', 'く', 'ぐ', 'す', 'つ', 'む', 'ぶ', 'ぬ', 'る'].forEach(ending => {
            candidates.add(base + ending);
        });
    };

    // 1. Masu-form
    if (input_str.endsWith('ます')) {
        const stem = input_str.slice(0, -2);
        try_ichidan(stem);
        try_godan(stem);
        if (stem === 'き') candidates.add('くる');
        if (stem === 'し') candidates.add('する');
    }
    if (input_str.endsWith('ません')) {
        const stem = input_str.slice(0, -3);
        try_ichidan(stem);
        try_godan(stem);
        if (stem === 'き') candidates.add('くる');
        if (stem === 'し') candidates.add('する');
    }
    if (input_str.endsWith('ました')) {
        const stem = input_str.slice(0, -3);
        try_ichidan(stem);
        try_godan(stem);
        if (stem === 'き') candidates.add('くる');
        if (stem === 'し') candidates.add('する');
    }
    if (input_str.endsWith('ませんでした')) {
        const stem = input_str.slice(0, -6);
        try_ichidan(stem);
        try_godan(stem);
        if (stem === 'き') candidates.add('くる');
        if (stem === 'し') candidates.add('する');
    }

    // 2. Te-form
    if (input_str.length >= 2 && ['て', 'で'].includes(input_str[input_str.length - 1])) {
        const te_stem = input_str.slice(0, -1);
        try_ichidan(te_stem);
        if (input_str === 'きて') candidates.add('くる');
        if (input_str === 'して') candidates.add('する');
        if (te_stem && te_stem[te_stem.length - 1] === 'っ') {
            const base = te_stem.slice(0, -1);
            ['う', 'つ', 'る'].forEach(end => candidates.add(base + end));
        } else if (te_stem && te_stem[te_stem.length - 1] === 'ん') {
            const base = te_stem.slice(0, -1);
            ['む', 'ぶ', 'ぬ'].forEach(end => candidates.add(base + end));
        } else if (input_str.length >= 2 && ['い', 'き', 'ぎ'].includes(input_str[input_str.length - 2])) {
            candidates.add(te_stem + 'く');
            candidates.add(te_stem + 'ぐ');
        } else if (te_stem && te_stem[te_stem.length - 1] === 'し') {
            const base = te_stem.slice(0, -1);
            candidates.add(base + 'す');
        } else {
            try_godan(te_stem);
        }
    }

    // 3. Ta-form
    if (input_str.length >= 2 && ['た', 'だ'].includes(input_str[input_str.length - 1])) {
        const ta_stem = input_str.slice(0, -1);
        try_ichidan(ta_stem);
        if (input_str === 'きた') candidates.add('くる');
        if (input_str === 'した') candidates.add('する');
        if (ta_stem && ta_stem[ta_stem.length - 1] === 'っ') {
            const base = ta_stem.slice(0, -1);
            ['う', 'つ', 'る'].forEach(end => candidates.add(base + end));
        } else if (ta_stem && ta_stem[ta_stem.length - 1] === 'ん') {
            const base = ta_stem.slice(0, -1);
            ['む', 'ぶ', 'ぬ'].forEach(end => candidates.add(base + end));
        } else if (input_str.length >= 2 && ['い', 'き', 'ぎ'].includes(input_str[input_str.length - 2])) {
            candidates.add(ta_stem + 'く');
            candidates.add(ta_stem + 'ぐ');
        } else if (ta_stem && ta_stem[ta_stem.length - 1] === 'し') {
            const base = ta_stem.slice(0, -1);
            candidates.add(base + 'す');
        } else {
            try_godan(ta_stem);
        }
    }

    // 4. Nai-form
    if (input_str.endsWith('ない')) {
        const nai_stem = input_str.slice(0, -2);
        try_ichidan(nai_stem);
        if (input_str === 'こない') candidates.add('くる');
        if (input_str === 'しない') candidates.add('する');
        if (nai_stem && nai_stem.length > 0) {
            const a_char = nai_stem[nai_stem.length - 1];
            const godan_end_map = {
                'わ': 'う', 'た': 'つ', 'ら': 'る', 'ま': 'む', 'ば': 'ぶ', 'な': 'ぬ', 'か': 'く', 'が': 'ぐ', 'さ': 'す'
            };
            if (godan_end_map[a_char]) {
                const base = nai_stem.slice(0, -1);
                candidates.add(base + godan_end_map[a_char]);
            } else {
                try_godan(nai_stem);
            }
        }
    }

    // 5. Nakatta-form
    if (input_str.endsWith('なかった')) {
        const nakatta_stem = input_str.slice(0, -5);
        try_ichidan(nakatta_stem);
        if (input_str === 'こなかった') candidates.add('くる');
        if (input_str === 'しなかった') candidates.add('する');
        if (nakatta_stem && nakatta_stem.length > 0) {
            const a_char = nakatta_stem[nakatta_stem.length - 1];
            const godan_end_map = {
                'わ': 'う', 'た': 'つ', 'ら': 'る', 'ま': 'む', 'ば': 'ぶ', 'な': 'ぬ', 'か': 'く', 'が': 'ぐ', 'さ': 'す'
            };
            if (godan_end_map[a_char]) {
                const base = nakatta_stem.slice(0, -1);
                candidates.add(base + godan_end_map[a_char]);
            } else {
                try_godan(nakatta_stem);
            }
        }
    }

    // 6. Volitional
    if (input_str.endsWith('よう') || input_str.endsWith('おう') || (input_str.endsWith('う') && input_str.length >= 2)) {
        if (input_str.endsWith('ましょう')) {
            const stem = input_str.slice(0, -4);
            try_ichidan(stem);
            try_godan(stem);
            if (stem === 'き') candidates.add('くる');
            if (stem === 'し') candidates.add('する');
        } else {
            const vol_stem = input_str.slice(0, -1);
            if (input_str.endsWith('こよう')) candidates.add('くる');
            if (input_str.endsWith('しよう')) candidates.add('する');
            try_ichidan(vol_stem);
            if (vol_stem.length >= 1) {
                const o_char = vol_stem[vol_stem.length - 1];
                const godan_end_map_o = {
                    'お': 'う', 'と': 'つ', 'ろ': 'る', 'も': 'む', 'ぼ': 'ぶ', 'の': 'ぬ', 'こ': 'く', 'ご': 'ぐ', 'そ': 'す'
                };
                if (godan_end_map_o[o_char]) {
                    const base = vol_stem.slice(0, -1);
                    candidates.add(base + godan_end_map_o[o_char]);
                } else {
                    try_godan(vol_stem);
                }
            }
        }
    }

    // 7. Imperative
    if (input_str.endsWith('なさい')) {
        const stem = input_str.slice(0, -3);
        try_ichidan(stem);
        try_godan(stem);
        if (stem === 'き') candidates.add('くる');
        if (stem === 'し') candidates.add('する');
    } else {
        if (input_str === 'こい') candidates.add('くる');
        if (input_str === 'しろ') candidates.add('する');
        if (input_str.length >= 1) {
            const last_char = input_str[input_str.length - 1];
            if (last_char === 'ろ') {
                try_ichidan(input_str.slice(0, -1));
            }
            const e_row_chars = ['え', 'け', 'げ', 'せ', 'て', 'ね', 'べ', 'め', 'れ'];
            if (e_row_chars.includes(last_char)) {
                const godan_end_map_e = {
                    'え': 'う', 'て': 'つ', 'れ': 'る', 'め': 'む', 'べ': 'ぶ', 'ね': 'ぬ', 'け': 'く', 'げ': 'ぐ', 'せ': 'す'
                };
                if (godan_end_map_e[last_char]) {
                    const base = input_str.slice(0, -1);
                    candidates.add(base + godan_end_map_e[last_char]);
                } else {
                    try_godan(input_str.slice(0, -1));
                }
            }
        }
    }

    // 8. Potential
    if (input_str.endsWith('られる')) {
        const stem = input_str.slice(0, -3);
        try_ichidan(stem);
        if (stem === 'こら') candidates.add('くる');
    }
    if (input_str.endsWith('できる')) {
        const stem = input_str.slice(0, -4);
        candidates.add(stem + 'する');
    }
    if (input_str.length >= 2 && input_str[input_str.length - 1] === 'る' && ['え', 'け', 'げ', 'せ', 'て', 'ね', 'べ', 'め', 'れ'].includes(input_str[input_str.length - 2])) {
        const godan_end_map_e = {
            'え': 'う', 'て': 'つ', 'れ': 'る', 'め': 'む', 'べ': 'ぶ', 'ね': 'ぬ', 'け': 'く', 'げ': 'ぐ', 'せ': 'す'
        };
        const base = input_str.slice(0, -2);
        if (godan_end_map_e[input_str[input_str.length - 2]]) {
            candidates.add(base + godan_end_map_e[input_str[input_str.length - 2]]);
        } else {
            try_godan(base);
        }
    }

    //9. Passive/Causative
    if (input_str.endsWith('させる')) {
        const stem = input_str.slice(0, -3);
        candidates.add(stem + 'する');
        if (stem && stem.length >= 1) {
            const a_char = stem[stem.length - 1];
            const godan_end_map = {
                'わ': 'う', 'た': 'つ', 'ら': 'る', 'ま': 'む', 'ば': 'ぶ', 'な': 'ぬ', 'か': 'く', 'が': 'ぐ', 'さ': 'す'
            };
            if (godan_end_map[a_char]) {
                const base = stem.slice(0, -1);
                candidates.add(base + godan_end_map[a_char]);
            }
        }
    }
    if (input_str.endsWith('れる') && !input_str.endsWith('られる')) {
        const stem = input_str.slice(0, -2);
        if (stem && stem.length >= 1) {
            const a_char = stem[stem.length - 1];
            const godan_end_map = {
                'わ': 'う', 'た': 'つ', 'ら': 'る', 'ま': 'む', 'ば': 'ぶ', 'な': 'ぬ', 'か': 'く', 'が': 'ぐ', 'さ': 'す'
            };
            if (godan_end_map[a_char]) {
                const base = stem.slice(0, -1);
                candidates.add(base + godan_end_map[a_char]);
            }
        }
    }

    return Array.from(candidates).sort();
}

const GODAN_MAP = {
    'う': ['わ', 'い', 'え', 'お', 'って', 'った'],
    'つ': ['た', 'ち', 'て', 'と', 'って', 'った'],
    'る': ['ら', 'り', 'れ', 'ろ', 'って', 'った'],
    'む': ['ま', 'み', 'め', 'も', 'んで', 'んだ'],
    'ぶ': ['ば', 'び', 'べ', 'ぼ', 'んで', 'んだ'],
    'ぬ': ['な', 'に', 'ね', 'の', 'んで', 'んだ'],
    'く': ['か', 'き', 'け', 'こ', 'いて', 'いた'],
    'ぐ': ['が', 'ぎ', 'げ', 'ご', 'いで', 'いだ'],
    'す': ['さ', 'し', 'せ', 'そ', 'して', 'した'],
};

function _getStems(word, reading, isSuru, isKuru, isIchidan, isGodan) {
    let wStem = word;
    let rStem = reading;
    
    if (isKuru) {
        const wPrefix = word.endsWith('来る') || word.endsWith('くる') ? word.slice(0, -2) : (word.length >= 2 ? word.slice(0, -2) : '');
        const rPrefix = reading.endsWith('くる') ? reading.slice(0, -2) : (reading.length >= 2 ? reading.slice(0, -2) : '');
        return {
            wPrefix, rPrefix,
            teForm: wPrefix + '来て', teKana: rPrefix + 'きて',
            taForm: wPrefix + '来た', taKana: rPrefix + 'きた'
        };
    }

    if (isSuru) {
        const wPrefix = word.endsWith('する') ? word.slice(0, -2) : word;
        const rPrefix = reading.endsWith('する') ? reading.slice(0, -2) : reading;
        return {
            wPrefix, rPrefix,
            teForm: wPrefix + 'して', teKana: rPrefix + 'して',
            taForm: wPrefix + 'した', taKana: rPrefix + 'した'
        };
    }

    if (isIchidan) {
        wStem = word.endsWith('る') ? word.slice(0, -1) : word;
        rStem = reading.endsWith('る') ? reading.slice(0, -1) : reading;
        return {
            wPrefix: wStem, rPrefix: rStem,
            teForm: wStem + 'て', teKana: rStem + 'て',
            taForm: wStem + 'た', taKana: rStem + 'た'
        };
    }

    if (isGodan) {
        const lastChar = reading.slice(-1);
        if (!GODAN_MAP[lastChar]) return null;
        
        const [aRow, iRow, eRow, oRow, teSuff, taSuff] = GODAN_MAP[lastChar];
        wStem = word.slice(0, -1);
        rStem = reading.slice(0, -1);

        const isIku = (reading === 'いく') || reading.endsWith('いく') || (word === '行く') || word.endsWith('行く');
        let finalTe = teSuff;
        let finalTa = taSuff;
        if (isIku) {
            finalTe = 'って';
            finalTa = 'った';
        }

        return {
            wPrefix: wStem, rPrefix: rStem,
            aRow, iRow, eRow, oRow,
            teForm: wStem + finalTe, teKana: rStem + finalTe,
            taForm: wStem + finalTa, taKana: rStem + finalTa
        };
    }

    return null;
}

export function conjugateVerbComplete(word, reading, wordType) {
    if (!word || !reading) return null;

    word = word.trim();
    reading = reading.trim();

    let isSuru = false;
    let isKuru = false;
    let isIchidan = false;
    let isGodan = false;

    const normalizedType = wordType ? wordType.toLowerCase().replace(/_/g, '') : '';

    if (reading === 'くる' || reading.endsWith('くる') || word === '来る' || word.endsWith('来る')) {
        isKuru = true;
    } else if (normalizedType === 'suru' || normalizedType === 'suruverb' || word.endsWith('する') || reading.endsWith('する')) {
        isSuru = true;
    } else if (normalizedType === 'ichidan' || normalizedType === 'ichidanverb') {
        isIchidan = true;
    } else if (normalizedType === 'godan' || normalizedType === 'godanverb') {
        isGodan = true;
    } else {
        if (word.endsWith('する') || reading.endsWith('する')) {
            isSuru = true;
        } else if (word.endsWith('る') && (reading.endsWith('いる') || reading.endsWith('える'))) {
            isIchidan = true;
        } else if (Object.keys(GODAN_MAP).some(suffix => reading.endsWith(suffix))) {
            isGodan = true;
        } else {
            return null;
        }
    }

    const stems = _getStems(word, reading, isSuru, isKuru, isIchidan, isGodan);
    if (!stems) return null;

    const forms = [];

    // 1. Indikatif
    const indikatif = { name: "Indikatif", variants: {} };
    indikatif.variants["default"] = { kanji: word, kana: reading };
    if (isKuru) {
        indikatif.variants["formal"] = { kanji: stems.wPrefix + "来ます", kana: stems.rPrefix + "きます" };
        indikatif.variants["negative"] = { kanji: stems.wPrefix + "来ない", kana: stems.rPrefix + "こない" };
        indikatif.variants["past"] = { kanji: stems.taForm, kana: stems.taKana };
        indikatif.variants["formal_negative"] = { kanji: stems.wPrefix + "来ません", kana: stems.rPrefix + "きません" };
        indikatif.variants["formal_past"] = { kanji: stems.wPrefix + "来ました", kana: stems.rPrefix + "きました" };
        indikatif.variants["negative_past"] = { kanji: stems.wPrefix + "来なかった", kana: stems.rPrefix + "こなかった" };
        indikatif.variants["formal_negative_past"] = { kanji: stems.wPrefix + "来ませんでした", kana: stems.rPrefix + "きませんでした" };
    } else if (isSuru) {
        indikatif.variants["formal"] = { kanji: stems.wPrefix + "します", kana: stems.rPrefix + "します" };
        indikatif.variants["negative"] = { kanji: stems.wPrefix + "しない", kana: stems.rPrefix + "しない" };
        indikatif.variants["past"] = { kanji: stems.taForm, kana: stems.taKana };
        indikatif.variants["formal_negative"] = { kanji: stems.wPrefix + "しません", kana: stems.rPrefix + "しません" };
        indikatif.variants["formal_past"] = { kanji: stems.wPrefix + "しました", kana: stems.rPrefix + "しました" };
        indikatif.variants["negative_past"] = { kanji: stems.wPrefix + "しなかった", kana: stems.rPrefix + "しなかった" };
        indikatif.variants["formal_negative_past"] = { kanji: stems.wPrefix + "しませんでした", kana: stems.rPrefix + "しませんでした" };
    } else if (isIchidan) {
        indikatif.variants["formal"] = { kanji: stems.wPrefix + "ます", kana: stems.rPrefix + "ます" };
        indikatif.variants["negative"] = { kanji: stems.wPrefix + "ない", kana: stems.rPrefix + "ない" };
        indikatif.variants["past"] = { kanji: stems.taForm, kana: stems.taKana };
        indikatif.variants["formal_negative"] = { kanji: stems.wPrefix + "ません", kana: stems.rPrefix + "ません" };
        indikatif.variants["formal_past"] = { kanji: stems.wPrefix + "ました", kana: stems.rPrefix + "ました" };
        indikatif.variants["negative_past"] = { kanji: stems.wPrefix + "なかった", kana: stems.rPrefix + "なかった" };
        indikatif.variants["formal_negative_past"] = { kanji: stems.wPrefix + "ませんでした", kana: stems.rPrefix + "ませんでした" };
    } else if (isGodan) {
        indikatif.variants["formal"] = { kanji: stems.wPrefix + stems.iRow + "ます", kana: stems.rPrefix + stems.iRow + "ます" };
        indikatif.variants["negative"] = { kanji: stems.wPrefix + stems.aRow + "ない", kana: stems.rPrefix + stems.aRow + "ない" };
        indikatif.variants["past"] = { kanji: stems.taForm, kana: stems.taKana };
        indikatif.variants["formal_negative"] = { kanji: stems.wPrefix + stems.iRow + "ません", kana: stems.rPrefix + stems.iRow + "ません" };
        indikatif.variants["formal_past"] = { kanji: stems.wPrefix + stems.iRow + "ました", kana: stems.rPrefix + stems.iRow + "ました" };
        indikatif.variants["negative_past"] = { kanji: stems.wPrefix + stems.aRow + "なかった", kana: stems.rPrefix + stems.aRow + "なかった" };
        indikatif.variants["formal_negative_past"] = { kanji: stems.wPrefix + stems.iRow + "ませんでした", kana: stems.rPrefix + stems.iRow + "ませんでした" };
    }
    forms.push(indikatif);

    // 2. Progresif
    function _buildTeIru(baseKanji, baseKana) {
        return {
            name: "Progresif",
            variants: {
                "default": { kanji: baseKanji + "いる", kana: baseKana + "いる" },
                "formal": { kanji: baseKanji + "います", kana: baseKana + "います" },
                "negative": { kanji: baseKanji + "いない", kana: baseKana + "いない" },
                "past": { kanji: baseKanji + "いた", kana: baseKana + "いた" },
                "formal_negative": { kanji: baseKanji + "いません", kana: baseKana + "いません" },
                "formal_past": { kanji: baseKanji + "いました", kana: baseKana + "いました" },
                "negative_past": { kanji: baseKanji + "いなかった", kana: baseKana + "いなかった" },
                "formal_negative_past": { kanji: baseKanji + "いませんでした", kana: baseKana + "いませんでした" },
            }
        };
    }
    forms.push(_buildTeIru(stems.teForm, stems.teKana));

    // 3. Imperatif
    const imperatif = { name: "Imperatif", variants: {} };
    if (isKuru) {
        imperatif.variants["default"] = { kanji: stems.wPrefix + "来い", kana: stems.rPrefix + "こい" };
        imperatif.variants["formal"] = { kanji: stems.wPrefix + "来てください", kana: stems.rPrefix + "きてください" };
    } else if (isSuru) {
        imperatif.variants["default"] = { kanji: stems.wPrefix + "しろ", kana: stems.rPrefix + "しろ" };
        imperatif.variants["formal"] = { kanji: stems.wPrefix + "してください", kana: stems.rPrefix + "してください" };
    } else if (isIchidan) {
        imperatif.variants["default"] = { kanji: stems.wPrefix + "ろ", kana: stems.rPrefix + "ろ" };
        imperatif.variants["formal"] = { kanji: stems.teForm + "ください", kana: stems.teKana + "ください" };
    } else if (isGodan) {
        imperatif.variants["default"] = { kanji: stems.wPrefix + stems.eRow, kana: stems.rPrefix + stems.eRow };
        imperatif.variants["formal"] = { kanji: stems.teForm + "ください", kana: stems.teKana + "ください" };
    }
    imperatif.variants["negative"] = { kanji: indikatif.variants.negative.kanji + "な", kana: indikatif.variants.negative.kana + "な" };
    forms.push(imperatif);

    // 4. Volisional
    const volisional = { name: "Volisional", variants: {} };
    if (isKuru) {
        volisional.variants["default"] = { kanji: stems.wPrefix + "来よう", kana: stems.rPrefix + "こよう" };
        volisional.variants["formal"] = { kanji: stems.wPrefix + "来ましょう", kana: stems.rPrefix + "きましょう" };
    } else if (isSuru) {
        volisional.variants["default"] = { kanji: stems.wPrefix + "しよう", kana: stems.rPrefix + "しよう" };
        volisional.variants["formal"] = { kanji: stems.wPrefix + "しましょう", kana: stems.rPrefix + "しましょう" };
    } else if (isIchidan) {
        volisional.variants["default"] = { kanji: stems.wPrefix + "よう", kana: stems.rPrefix + "よう" };
        volisional.variants["formal"] = { kanji: stems.wPrefix + "ましょう", kana: stems.rPrefix + "ましょう" };
    } else if (isGodan) {
        volisional.variants["default"] = { kanji: stems.wPrefix + stems.oRow + "う", kana: stems.rPrefix + stems.oRow + "う" };
        volisional.variants["formal"] = { kanji: stems.wPrefix + stems.iRow + "ましょう", kana: stems.rPrefix + stems.iRow + "ましょう" };
    }
    forms.push(volisional);

    // 5. Potensial
    const potensial = { name: "Potensial", variants: {} };
    let basePotKanji, basePotKana;
    if (isKuru) {
        basePotKanji = stems.wPrefix + "来られ";
        basePotKana = stems.rPrefix + "こられ";
    } else if (isSuru) {
        basePotKanji = stems.wPrefix + "でき";
        basePotKana = stems.rPrefix + "でき";
    } else if (isIchidan) {
        basePotKanji = stems.wPrefix + "られ";
        basePotKana = stems.rPrefix + "られ";
    } else if (isGodan) {
        basePotKanji = stems.wPrefix + stems.eRow;
        basePotKana = stems.rPrefix + stems.eRow;
    }
    potensial.variants["default"] = { kanji: basePotKanji + "る", kana: basePotKana + "る" };
    potensial.variants["formal"] = { kanji: basePotKanji + "ます", kana: basePotKana + "ます" };
    potensial.variants["negative"] = { kanji: basePotKanji + "ない", kana: basePotKana + "ない" };
    potensial.variants["past"] = { kanji: basePotKanji + "た", kana: basePotKana + "た" };
    potensial.variants["formal_negative"] = { kanji: basePotKanji + "ません", kana: basePotKana + "ません" };
    potensial.variants["formal_past"] = { kanji: basePotKanji + "ました", kana: basePotKana + "ました" };
    potensial.variants["negative_past"] = { kanji: basePotKanji + "なかった", kana: basePotKana + "なかった" };
    potensial.variants["formal_negative_past"] = { kanji: basePotKanji + "ませんでした", kana: basePotKana + "ませんでした" };
    forms.push(potensial);

    // 6. Kondisional
    const kondisional = { name: "Kondisional", variants: {} };
    if (isKuru) {
        kondisional.variants["default"] = { kanji: stems.wPrefix + "来れば", kana: stems.rPrefix + "くれば" };
    } else if (isSuru) {
        kondisional.variants["default"] = { kanji: stems.wPrefix + "すれば", kana: stems.rPrefix + "すれば" };
    } else if (isIchidan) {
        kondisional.variants["default"] = { kanji: stems.wPrefix + "れば", kana: stems.rPrefix + "れば" };
    } else if (isGodan) {
        kondisional.variants["default"] = { kanji: stems.wPrefix + stems.eRow + "ば", kana: stems.rPrefix + stems.eRow + "ば" };
    }
    kondisional.variants["past"] = { kanji: stems.taForm + "ら", kana: stems.taKana + "ら" };
    forms.push(kondisional);

    // 7. Shimau
    const shimau = { name: "Shimau", variants: {} };
    function _buildShimau(baseTeKanji, baseTeKana) {
        return {
            "default": { kanji: baseTeKanji + "しまう", kana: baseTeKana + "しまう" },
            "formal": { kanji: baseTeKanji + "しまいます", kana: baseTeKana + "しまいます" },
            "negative": { kanji: baseTeKanji + "しまわない", kana: baseTeKana + "しまわない" },
            "past": { kanji: baseTeKanji + "しまった", kana: baseTeKana + "しまった" },
            "formal_negative": { kanji: baseTeKanji + "しまいません", kana: baseTeKana + "しまいません" },
            "formal_past": { kanji: baseTeKanji + "しまいました", kana: baseTeKana + "しまいました" },
            "negative_past": { kanji: baseTeKanji + "しまわなかった", kana: baseTeKana + "しまわなかった" },
            "formal_negative_past": { kanji: baseTeKanji + "しまいませんでした", kana: baseTeKana + "しまいませんでした" },
        };
    }
    shimau.variants = _buildShimau(stems.teForm, stems.teKana);
    forms.push(shimau);

    // 8. Passive
    const passive = { name: "Passive", variants: {} };
    let basePassKanji, basePassKana;
    if (isKuru) {
        basePassKanji = stems.wPrefix + "来られ";
        basePassKana = stems.rPrefix + "こられ";
    } else if (isSuru) {
        basePassKanji = stems.wPrefix + "され";
        basePassKana = stems.rPrefix + "され";
    } else if (isIchidan) {
        basePassKanji = stems.wPrefix + "られ";
        basePassKana = stems.rPrefix + "られ";
    } else if (isGodan) {
        basePassKanji = stems.wPrefix + stems.aRow + "れ";
        basePassKana = stems.rPrefix + stems.aRow + "れ";
    }
    passive.variants["default"] = { kanji: basePassKanji + "る", kana: basePassKana + "る" };
    passive.variants["formal"] = { kanji: basePassKanji + "ます", kana: basePassKana + "ます" };
    passive.variants["negative"] = { kanji: basePassKanji + "ない", kana: basePassKana + "ない" };
    passive.variants["past"] = { kanji: basePassKanji + "た", kana: basePassKana + "た" };
    passive.variants["formal_negative"] = { kanji: basePassKanji + "ません", kana: basePassKana + "ません" };
    passive.variants["formal_past"] = { kanji: basePassKanji + "ました", kana: basePassKana + "ました" };
    passive.variants["negative_past"] = { kanji: basePassKanji + "なかった", kana: basePassKana + "なかった" };
    passive.variants["formal_negative_past"] = { kanji: basePassKanji + "ませんでした", kana: basePassKana + "ませんでした" };
    forms.push(passive);

    // 9. Causative
    const causative = { name: "Causative", variants: {} };
    let baseCausKanji, baseCausKana;
    if (isKuru) {
        baseCausKanji = stems.wPrefix + "来さ";
        baseCausKana = stems.rPrefix + "こさ";
    } else if (isSuru) {
        baseCausKanji = stems.wPrefix + "させ";
        baseCausKana = stems.rPrefix + "させ";
    } else if (isIchidan) {
        baseCausKanji = stems.wPrefix + "させ";
        baseCausKana = stems.rPrefix + "させ";
    } else if (isGodan) {
        baseCausKanji = stems.wPrefix + stems.aRow + "せ";
        baseCausKana = stems.rPrefix + stems.aRow + "せ";
    }
    causative.variants["default"] = { kanji: baseCausKanji + "る", kana: baseCausKana + "る" };
    causative.variants["formal"] = { kanji: baseCausKanji + "ます", kana: baseCausKana + "ます" };
    causative.variants["negative"] = { kanji: baseCausKanji + "ない", kana: baseCausKana + "ない" };
    causative.variants["past"] = { kanji: baseCausKanji + "た", kana: baseCausKana + "た" };
    causative.variants["formal_negative"] = { kanji: baseCausKanji + "ません", kana: baseCausKana + "ません" };
    causative.variants["formal_past"] = { kanji: baseCausKanji + "ました", kana: baseCausKana + "ました" };
    causative.variants["negative_past"] = { kanji: baseCausKanji + "なかった", kana: baseCausKana + "なかった" };
    causative.variants["formal_negative_past"] = { kanji: baseCausKanji + "ませんでした", kana: baseCausKana + "ませんでした" };
    forms.push(causative);

    return { forms };
}

// Keep old function for backward compatibility
export function conjugateVerb(word, reading, wordType) {
    const data = conjugateVerbComplete(word, reading, wordType);
    if (!data) return null;

    const res = [];
    for (const form of data.forms) {
        for (const [varName, varVal] of Object.entries(form.variants)) {
            if (varVal) {
                res.push({
                    form: `${form.name} (${varName})`,
                    kanji: varVal.kanji,
                    kana: varVal.kana
                });
            }
        }
    }
    return res;
}
