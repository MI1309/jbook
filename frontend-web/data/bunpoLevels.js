export const BUNPO_LEVELS = [
    {
        level: 'n5',
        number: 5,
        title: 'Fondasi',
        description: 'Partikel dasar (は, が, を, に, で), bentuk ます/です, kata tanya, angka, kata kerja bentuk て/た, adjektiva dasar. Target: memperkenalkan diri & percakapan sehari-hari sederhana.',
        accent: 'text-accent-blue',
        icon: 'Sprout',
        beta: false,
    },
    {
        level: 'n4',
        number: 4,
        title: 'Dasar Lanjutan',
        description: 'Bentuk potensial, て-form lanjutan, ない-form, syarat (と, ば, たら, なら), memberi/menerima, んです. Target: bercerita tentang pengalaman & rencana.',
        accent: 'text-accent-green',
        icon: 'Leaf',
        beta: false,
    },
    {
        level: 'n3',
        number: 3,
        title: 'Menengah',
        description: 'Kalimat pasif, kausatif, kondisi, ようになる, ために, ように, ばかり, ところ. Target: memahami artikel & berita sederhana.',
        accent: 'text-accent-gold',
        icon: 'TreePine',
        beta: true,
    },
    {
        level: 'n2',
        number: 2,
        title: 'Mahir',
        description: 'Nuansa formal, 敬語 dasar, pola majemuk, ekspresi tertulis. Target: membaca novel & dokumen resmi.',
        accent: 'text-orange-500',
        icon: 'Mountain',
        beta: true,
    },
    {
        level: 'n1',
        number: 1,
        title: 'Ahli',
        description: 'Pola klasik, sastra, nuansa halus, idiom, 四字熟語. Target: setara penutur asli terdidik.',
        accent: 'text-rose-500',
        icon: 'Crown',
        beta: true,
    },
];

export function getBunpoLevel(level) {
    return BUNPO_LEVELS.find((item) => item.level === String(level).toLowerCase()) ?? null;
}