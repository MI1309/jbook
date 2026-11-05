export const KANJI_LEVELS = [
    {
        level: 'n5',
        number: 5,
        title: 'Pemula / Dasar',
        description: 'Karakter dasar yang sering ditemui dalam kehidupan sehari-hari: angka, hari, arah, keluarga, dan waktu (~80–100 kanji).',
        accent: 'text-accent-blue',
        icon: 'Sprout',
        beta: false,
    },
    {
        level: 'n4',
        number: 4,
        title: 'Dasar Lanjutan',
        description: 'Kanji untuk aktivitas harian, tempat, kata kerja, kata sifat, dan situasi umum (~160–180 kanji).',
        accent: 'text-accent-green',
        icon: 'Leaf',
        beta: false,
    },
    {
        level: 'n3',
        number: 3,
        title: 'Menengah',
        description: 'Menjembatani pemahaman dasar ke tingkat mahir, digunakan dalam artikel pendek, instruksi, dan berita ringan (~370 kanji).',
        accent: 'text-accent-gold',
        icon: 'TreePine',
        beta: true,
    },
    {
        level: 'n2',
        number: 2,
        title: 'Mahir',
        description: 'Karakter kompleks untuk artikel surat kabar, esai umum, dan lingkungan kerja profesional (~370 kanji).',
        accent: 'text-orange-500',
        icon: 'Mountain',
        beta: true,
    },
    {
        level: 'n1',
        number: 1,
        title: 'Tingkat Ahli',
        description: 'Kanji tingkat tinggi untuk sastra, opini formal, dokumen hukum, dan idiom empat karakter (~1200 kanji).',
        accent: 'text-rose-500',
        icon: 'Crown',
        beta: true,
    },
];

export function getKanjiLevel(level) {
    if (!level) return null;
    const clean = String(level).trim().toLowerCase();
    const normalized = clean.startsWith('n') ? clean : `n${clean}`;
    return KANJI_LEVELS.find((item) => item.level === normalized) ?? null;
}
