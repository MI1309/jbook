const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export const metadata = {
    title: 'Kosa Kata (Kotoba) JLPT Lengkap - JBook',
    description: 'Pelajari ribuan kosa kata bahasa Jepang paling umum dan esensial dari level N5 hingga N1.',
    keywords: ['kotoba', 'kosakata jepang', 'vocabulary jepang', 'jlpt vocabulary', 'kosakata jlpt', '語', 'belajar bahasa jepang'],
    alternates: { canonical: '/kotoba' },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: 'Kosa Kata (Kotoba) JLPT - JBook',
    description: 'Koleksi lengkap kosakata bahasa Jepang dari level N5 hingga N1 untuk persiapan ujian JLPT.',
    url: `${BASE_URL}/kotoba`,
    isPartOf: { '@type': 'WebSite', name: 'JBook', url: BASE_URL },
    educationalLevel: 'JLPT N5, N4, N3, N2, N1',
    inLanguage: ['id', 'ja'],
};

export default function KotobaLayout({ children }) {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {children}
        </>
    );
}
