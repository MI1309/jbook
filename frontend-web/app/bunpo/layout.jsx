const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export const metadata = {
    title: 'Daftar Bunpo & Tata Bahasa JLPT - JBook',
    description: 'Pelajari pola tata bahasa (Bunpo) bahasa Jepang lengkap dari level N5 hingga N1.',
    keywords: ['bunpo', 'tatabahasajepang', 'grammar jepang', 'jlpt grammar', 'tatabahasa jepang', '文法', 'belajar bahasa jepang'],
    alternates: { canonical: '/bunpo' },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: 'Bunpo & Tata Bahasa JLPT - JBook',
    description: 'Koleksi lengkap pola tata bahasa (Bunpo) bahasa Jepang dari level N5 hingga N1 untuk persiapan ujian JLPT.',
    url: `${BASE_URL}/bunpo`,
    isPartOf: { '@type': 'WebSite', name: 'JBook', url: BASE_URL },
    educationalLevel: 'JLPT N5, N4, N3, N2, N1',
    inLanguage: ['id', 'ja'],
};

export default function BunpoLayout({ children }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {children}
        </>
    );
}
