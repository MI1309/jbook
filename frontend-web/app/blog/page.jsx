import { getBlogList } from '@/lib/api';
import Link from 'next/link';
import BlogListClient from './BlogListClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export const revalidate = 300; // ISR 5 minutes

export const metadata = {
    title: 'Blog Bahasa Jepang: Tips Belajar, Panduan JLPT & Materi | JBook',
    description: 'Kumpulan artikel dan panduan terlengkap belajar bahasa Jepang di JBook. Tips tata bahasa (Bunpo), huruf Kanji, kosakata (Kotoba), budaya, dan kiat sukses lulus ujian JLPT N5-N1.',
    keywords: [
        'blog bahasa jepang',
        'tips belajar bahasa jepang',
        'panduan jlpt n5 n1',
        'belajar kanji jepang',
        'tata bahasa jepang',
        'kosakata jepang kotoba',
        'jbook blog',
        'kursus bahasa jepang online',
    ],
    alternates: {
        canonical: `${BASE_URL}/blog`,
    },
    openGraph: {
        type: 'website',
        locale: 'id_ID',
        url: `${BASE_URL}/blog`,
        siteName: 'JBook',
        title: 'Blog Bahasa Jepang: Tips, Panduan JLPT & Materi | JBook',
        description: 'Kumpulan artikel dan panduan terlengkap belajar bahasa Jepang. Kuasai Kanji, Bunpo, Kotoba, dan taklukkan ujian JLPT bersama JBook.',
        images: [
            {
                url: `${BASE_URL}/icon-512.png`,
                width: 512,
                height: 512,
                alt: 'JBook Blog - Belajar Bahasa Jepang',
                type: 'image/png',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog Bahasa Jepang: Tips & Panduan JLPT | JBook',
        description: 'Kumpulan artikel dan tips terlengkap belajar bahasa Jepang di JBook.',
        images: [`${BASE_URL}/icon-512.png`],
        creator: '@jbook',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default async function BlogListPage() {
    let blogs = [];
    try {
        const res = await getBlogList();
        blogs = Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('Failed to fetch blogs in BlogListPage:', error.message);
    }

    const blogUrl = `${BASE_URL}/blog`;

    // JSON-LD Structured Data (CollectionPage & ItemList)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${blogUrl}#webpage`,
                url: blogUrl,
                name: 'Blog Bahasa Jepang JBook',
                description: 'Kumpulan artikel edukatif, panduan tata bahasa, kanji, dan tips JLPT.',
                isPartOf: {
                    '@type': 'WebSite',
                    '@id': `${BASE_URL}/#website`,
                    name: 'JBook',
                    url: BASE_URL,
                },
                inLanguage: 'id-ID',
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${blogUrl}#breadcrumb`,
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Beranda',
                        item: BASE_URL,
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Blog',
                        item: blogUrl,
                    },
                ],
            },
            {
                '@type': 'ItemList',
                '@id': `${blogUrl}#itemlist`,
                itemListElement: blogs.slice(0, 10).map((blog, idx) => ({
                    '@type': 'ListItem',
                    position: idx + 1,
                    url: `${BASE_URL}/blog/${blog.slug}`,
                    name: blog.title,
                })),
            },
        ],
    };

    return (
        <main className="container mx-auto px-6 py-12 max-w-6xl min-h-screen">
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="mb-8">
                <ol className="flex items-center gap-2 text-sm font-bold text-gray-500">
                    <li>
                        <Link href="/" className="hover:underline hover:text-red-500 transition-colors">
                            Beranda
                        </Link>
                    </li>
                    <li>/</li>
                    <li className="text-red-600 font-extrabold" aria-current="page">
                        Blog
                    </li>
                </ol>
            </nav>

            {/* Page Header */}
            <header className="mb-14 text-center">
                <span className="inline-block px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                    💡 Wawasan &amp; Edukasi
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight mb-4">
                    JBook <span className="text-red-600">Blog</span>
                </h1>
                <p className="text-gray-500 font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                    Kumpulan panduan, wawasan, tips, dan strategi praktis seputar perjalanan belajar Bahasa Jepang dan persiapan ujian JLPT kamu.
                </p>
                <div className="w-24 h-1.5 bg-red-600 mx-auto mt-6 rounded-full"></div>
            </header>

            {/* Blog List with interactive Search & Filter */}
            <BlogListClient initialBlogs={blogs} />
        </main>
    );
}
