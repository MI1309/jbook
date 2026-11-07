export default function manifest() {
    return {
        id: '/',
        name: 'JBook - Belajar Bahasa Jepang',
        short_name: 'JBook',
        description: 'Belajar Kanji, Kotoba, dan Bunpo dengan materi bahasa Jepang berbahasa Indonesia.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8f8f5',
        theme_color: '#172978',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    };
}