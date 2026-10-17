const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export const metadata = {
    title: 'Daftar Kanji JLPT N5 - N1 - JBook',
    description: 'Latihan dan pelajari ribuan karakter Kanji Jepang dari level N5 hingga N1 dengan mudah dan interaktif.',
    keywords: ['kanji', 'kanji jepang', 'belajar kanji', 'jlpt kanji', 'kanji n5', 'kanji n4', 'kanji n3', 'kanji n2', 'kanji n1', 'karakter jepang', '漢字'],
    alternates: { canonical: '/kanji' },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: 'Kanji JLPT N5 - N1 - JBook',
    description: 'Koleksi lengkap karakter Kanji bahasa Jepang dari level N5 hingga N1 untuk persiapan ujian JLPT.',
    url: `${BASE_URL}/kanji`,
    isPartOf: { '@type': 'WebSite', name: 'JBook', url: BASE_URL },
    educationalLevel: 'JLPT N5, N4, N3, N2, N1',
    inLanguage: ['id', 'ja'],
};

export default function KanjiLayout({ children }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {children}
        </>
    );
}
