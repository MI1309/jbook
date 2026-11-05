import { isValidBunpoPattern } from '@/lib/bunpo-schema';

export const BUNPO_SECTIONS_PILOT = {
    'wa-desu': {
        id: '',
        title: '～は～です',
        structure: '',
        explanation: '',
        chapter: 0,
        jlpt_level: 5,
        sentences: [],
        slug: 'wa-desu',
        tags: ['N5', 'perkenalan', 'kalimat nominal'],
        sections: {
            mainFunction: {
                summary: 'Pola ～は～です digunakan untuk menyatakan identitas atau informasi tentang topik dengan bentuk sopan.',
                points: [
                    'は menandai topik yang sedang dibicarakan; partikel ini dibaca wa.',
                    'です mengakhiri predikat nominal dalam bentuk sopan.',
                    'Bagian sebelum は adalah topik, sedangkan bagian setelah は menyampaikan keterangan tentang topik.',
                    'Partikel は ditulis は tetapi dibaca wa saat berfungsi sebagai partikel topik.',
                ],
            },
            sentencePattern: {
                formula: 'N1 は N2 です。',
                variations: [
                    { label: 'Nama', formula: 'N1 は N2 です。', example: '私はアナです。' },
                    { label: 'Pekerjaan atau peran', formula: 'N1 は N2 です。', example: '田中さんは先生です。' },
                    { label: 'Asal atau kategori', formula: 'N1 は N2 です。', example: '私はインドネシア人です。' },
                ],
                notes: [
                    ' は adalah partikel topik dan dibaca wa, bukan ha.',
                    'です digunakan untuk membuat pernyataan nominal terdengar sopan.',
                    'Dalam konteks yang jelas, topik dapat tidak disebutkan; pola dasar tetap menunjukkan hubungan topik dan keterangan.',
                ],
            },
            examples: [
                { jp: '私は学生です。', reading: 'わたしは がくせいです。', id: 'Saya adalah pelajar.', expressions: [{ word: '私', reading: 'わたし', meaning: 'saya' }, { word: '学生', reading: 'がくせい', meaning: 'pelajar' }] },
                { jp: '田中さんは先生です。', reading: 'たなかさんは せんせいです。', id: 'Tanaka adalah guru.', expressions: [{ word: '田中さん', reading: 'たなかさん', meaning: 'Tuan/Nona Tanaka' }, { word: '先生', reading: 'せんせい', meaning: 'guru' }] },
                { jp: 'これは本です。', reading: 'これは ほんです。', id: 'Ini adalah buku.', expressions: [{ word: 'これ', reading: 'これ', meaning: 'ini' }, { word: '本', reading: 'ほん', meaning: 'buku' }] },
                { jp: '私はインドネシア人です。', reading: 'わたしは インドネシアじんです。', id: 'Saya orang Indonesia.', expressions: [{ word: '私', reading: 'わたし', meaning: 'saya' }, { word: 'インドネシア人', reading: 'インドネシアじん', meaning: 'orang Indonesia' }] },
            ],
            comparison: {
                summary: 'Bedakan fungsi は sebagai penanda topik dari partikel lain yang menandai fokus atau penambahan.',
                items: [
                    { vs: 'は dan が', difference: 'は menandai topik pembicaraan; が menandai subjek atau informasi yang difokuskan, dan tidak dapat dipertukarkan begitu saja.', example: '私は学生です。' },
                    { vs: 'は dan も', difference: 'は memperkenalkan topik; も berarti “juga” dan menggantikan は ketika menyatakan kesamaan tambahan.', example: '私も学生です。' },
                    { vs: 'です dan だ', difference: 'です adalah bentuk sopan; だ adalah bentuk biasa yang digunakan dalam konteks kasual.', example: '私は学生です。' },
                ],
            },
            nuance: {
                summary: 'Pola ini menyajikan keterangan tentang topik secara langsung dan sopan.',
                points: [
                    'は mengatur apa yang menjadi pokok pembicaraan, bukan selalu subjek gramatikal dalam setiap konteks.',
                    'です membuat kalimat nominal menjadi sopan tanpa mengubahnya menjadi kata kerja.',
                    'Keterangan setelah は dapat berupa identitas, peran, kategori, atau informasi nominal lainnya.',
                    'Konteks percakapan dapat membuat topik tidak perlu diulang.',
                ],
            },
            coreExplanation: {
                summary: 'N1 は N2 です menyatakan bahwa N2 adalah keterangan atau identitas dari topik N1.',
                text: 'Contoh 私は学生です。 dapat dipahami sebagai “Saya adalah pelajar.” 私 menjadi topik melalui は, lalu 学生です menyampaikan informasi tentang topik tersebut dengan bentuk sopan. は dibaca wa ketika menjadi partikel.',
            },
            commonMistakes: [
                { wrong: '私は学生はです。', correct: '私は学生です。', reason: 'は menandai topik setelah 私; tidak ditambahkan lagi sebelum です.' },
                { wrong: '私わ学生です。', correct: '私は学生です。', reason: 'Partikel topik ditulis は meskipun dibaca wa.' },
                { wrong: '私は学生だです。', correct: '私は学生です。', reason: 'だ dan です tidak digabung; pilih bentuk biasa atau bentuk sopan.' },
            ],
            faq: [
                { q: 'Apakah は dibaca ha?', a: 'Sebagai partikel topik, は dibaca wa. Di kata lain, seperti はな, huruf ini dibaca ha.' },
                { q: 'Apakah です berarti “adalah” secara harfiah?', a: 'Dalam terjemahan Indonesia, です sering tidak diterjemahkan sendiri; ia menandai gaya sopan pada predikat nominal.' },
                { q: 'Bisakah topik dihilangkan?', a: 'Bisa jika sudah jelas dari konteks percakapan, tetapi pola dasar untuk belajar tetap ditulis lengkap.' },
                { q: 'Apakah です dipakai setelah semua kata?', a: 'Tidak. です digunakan di sini setelah predikat nominal; penggunaannya dengan kata sifat mengikuti aturan tersendiri.' },
            ],
            miniPractice: [
                { type: 'fill-in', question: 'Lengkapi: 私___学生です。', options: ['は', 'を', 'に'], answer: 'は', explanation: 'は menandai topik 私 dan dibaca wa.' },
                { type: 'translate', question: 'Terjemahkan: 田中さんは先生です。', answer: 'Tanaka adalah guru.', explanation: '田中さん adalah topik, dan 先生です memberi keterangannya.' },
                { type: 'correct', question: 'Pilih penulisan partikel topik yang benar: 私わ学生です。', options: ['私は学生です。', '私が学生です。'], answer: '私は学生です。', explanation: 'Partikel topik ditulis は, meski dibaca wa.' },
            ],
            conceptMap: {
                summary: 'Hubungan topik, partikel, predikat nominal, dan kesopanan dalam pola ～は～です.',
                nodes: [
                    { id: 'n1', label: 'N1: topik', type: 'noun' },
                    { id: 'wa', label: 'は (wa)', type: 'particle' },
                    { id: 'n2', label: 'N2: keterangan nominal', type: 'noun' },
                    { id: 'desu', label: 'です', type: 'politeness' },
                    { id: 'sentence', label: 'Pernyataan sopan', type: 'meaning' },
                    { id: 'example', label: '私は学生です。', type: 'example' },
                ],
                edges: [
                    { from: 'n1', to: 'wa', label: 'topik ditandai' },
                    { from: 'wa', to: 'n2', label: 'diikuti keterangan' },
                    { from: 'n2', to: 'desu', label: 'predikat nominal + sopan' },
                    { from: 'desu', to: 'sentence', label: 'membentuk' },
                    { from: 'example', to: 'sentence', label: 'contoh pola' },
                ],
            },
        },
        relatedPatterns: [],
        source: { url: '', name: 'Materi editorial JBook', license: '' },
        metadata: { createdAt: '2026-11-05', updatedAt: '2026-11-05', version: '1', isComplete: true },
    },
};

for (const [slug, pattern] of Object.entries(BUNPO_SECTIONS_PILOT)) {
    const result = isValidBunpoPattern(pattern);
    if (!result.valid) console.warn(`[bunpo pilot] Invalid pattern "${slug}":`, result.errors);
}