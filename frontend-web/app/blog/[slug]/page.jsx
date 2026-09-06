import { getBlogDetailBySlug, getBlogList, API_URL } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShareButtons from './ShareButtons';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export const revalidate = 300; // ISR 5 minutes

export async function generateStaticParams() {
    try {
        const blogs = await getBlogList();
        if (Array.isArray(blogs)) {
            return blogs.map((blog) => ({
                slug: blog.slug,
            }));
        }
    } catch (e) {
        console.warn('[generateStaticParams] Failed to prefetch blog slugs:', e.message);
    }
    return [];
}

function getFullMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
}

function cleanText(text) {
    if (!text) return '';
    return text.replace(/[#*`_~\[\]()><\\]/g, '').replace(/\s+/g, ' ').trim();
}

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, '-and-')
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const blog = await getBlogDetailBySlug(slug);
        if (!blog) {
            return { title: 'Artikel Tidak Ditemukan | JBook Blog' };
        }

        const cleanDesc = blog.excerpt
            ? cleanText(blog.excerpt)
            : cleanText(blog.content).substring(0, 160);

        const pageUrl = `${BASE_URL}/blog/${slug}`;
        const featuredImg = blog.featured_image_url
            ? getFullMediaUrl(blog.featured_image_url)
            : `${BASE_URL}/icon-512.png`;

        const keywords = Array.from(new Set([
            ...(blog.tags || []),
            'belajar bahasa jepang',
            'bahasa jepang',
            'jlpt',
            'kanji jepang',
            'bunpo jepang',
            'kotoba jepang',
            'jbook blog',
        ]));

        return {
            title: `${blog.title} - Tips Belajar Bahasa Jepang | JBook Blog`,
            description: cleanDesc,
            keywords: keywords,
            authors: [{ name: 'Tim JBook', url: `${BASE_URL}/about` }],
            creator: 'Tim JBook',
            publisher: 'JBook',
            alternates: {
                canonical: pageUrl,
            },
            openGraph: {
                type: 'article',
                locale: 'id_ID',
                url: pageUrl,
                siteName: 'JBook',
                title: `${blog.title} | JBook Blog`,
                description: cleanDesc,
                publishedTime: blog.created_at,
                modifiedTime: blog.updated_at || blog.created_at,
                authors: ['Tim JBook'],
                section: blog.tags?.[0] || 'Bahasa Jepang',
                tags: blog.tags || [],
                images: [
                    {
                        url: featuredImg,
                        width: 1200,
                        height: 630,
                        alt: blog.title,
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${blog.title} | JBook Blog`,
                description: cleanDesc,
                images: [featuredImg],
                creator: '@jbook',
            },
            robots: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        };
    } catch (e) {
        return { title: 'Artikel Tidak Ditemukan | JBook Blog' };
    }
}

/**
 * Process inline markdown patterns (bold, italic, code, links, images)
 */
function processInlineMarkdown(text, startKey = 0) {
    if (!text) return '';
    const elements = [];
    let remaining = text;
    let key = startKey;

    const patterns = [
        { regex: /!\[([^\]]*)\]\(([^)]+)\)/g, type: 'img' },
        { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' },
        { regex: /`([^`]+)`/g, type: 'code' },
        { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
        { regex: /\*([^*]+)\*/g, type: 'italic' },
    ];

    const allMatches = [];
    patterns.forEach(pat => {
        let match;
        const regex = new RegExp(pat.regex.source, 'g');
        while ((match = regex.exec(remaining)) !== null) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                type: pat.type,
                match: match,
            });
        }
    });
    allMatches.sort((a, b) => a.start - b.start);

    let cursor = 0;
    const finalMatches = [];
    allMatches.forEach(m => {
        if (m.start >= cursor) {
            finalMatches.push(m);
            cursor = m.end;
        }
    });

    cursor = 0;
    finalMatches.forEach(m => {
        if (m.start > cursor) {
            elements.push(<span key={key++}>{remaining.slice(cursor, m.start)}</span>);
        }
        const groups = m.match.slice(1);
        switch (m.type) {
            case 'img':
                elements.push(
                    <img key={key++} src={groups[1]} alt={groups[0]} loading="lazy" className="my-6 rounded-2xl shadow-lg max-w-full h-auto border border-gray-100" />
                );
                break;
            case 'link':
                elements.push(
                    <a key={key++} href={groups[1]} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700 underline font-bold transition-colors">
                        {groups[0]}
                    </a>
                );
                break;
            case 'code':
                elements.push(
                    <code key={key++} className="px-2 py-0.5 bg-gray-100 text-red-700 rounded-lg font-mono text-sm">
                        {groups[0]}
                    </code>
                );
                break;
            case 'bold':
                elements.push(<strong key={key++} className="font-black text-gray-900">{groups[0]}</strong>);
                break;
            case 'italic':
                elements.push(<em key={key++} className="italic text-gray-800">{groups[0]}</em>);
                break;
        }
        cursor = m.end;
    });
    if (cursor < remaining.length) {
        elements.push(<span key={key++}>{remaining.slice(cursor)}</span>);
    }
    return elements;
}

/**
 * Extract Table of Contents from markdown content
 */
function extractTableOfContents(content) {
    if (!content) return [];
    const lines = content.split('\n');
    const toc = [];

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
            const title = trimmed.replace(/^##\s+/, '').replace(/[#*`]/g, '');
            toc.push({ level: 2, title, id: slugify(title) });
        } else if (trimmed.startsWith('### ')) {
            const title = trimmed.replace(/^###\s+/, '').replace(/[#*`]/g, '');
            toc.push({ level: 3, title, id: slugify(title) });
        }
    });

    return toc;
}

/**
 * Split blog content by HTML media tags (audio, video, img)
 */
function splitByHtmlMedia(content) {
    const htmlTagRegex = /<(audio|video|img)[^>]*>(?:<\/\1>)?/gi;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = htmlTagRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'md', text: content.slice(lastIndex, match.index) });
        }
        segments.push({ type: 'html', text: match[0] });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
        segments.push({ type: 'md', text: content.slice(lastIndex) });
    }
    return segments;
}

/**
 * Render markdown lines into React elements with heading IDs
 */
function renderMarkdown(text, startIdx = 0) {
    if (!text) return null;
    const lines = text.split('\n');
    const output = [];
    let keyCounter = startIdx * 10000;

    let listItems = [];
    let codeLines = [];
    let quoteLines = [];
    let paraLines = [];
    let inCode = false;

    const flushParagraph = () => {
        if (paraLines.length > 0) {
            output.push(
                <p key={keyCounter++} className="mb-6 text-gray-700 leading-relaxed text-lg font-medium selection:bg-red-100 selection:text-red-900">
                    {processInlineMarkdown(paraLines.join(' '), keyCounter)}
                </p>
            );
            paraLines = [];
        }
    };

    const flushList = () => {
        if (listItems.length > 0) {
            output.push(
                <ul key={keyCounter++} className="mb-6 space-y-2 ml-6 list-disc">
                    {listItems.map((item, i) => (
                        <li key={i} className="text-gray-700 text-lg font-medium leading-relaxed">
                            {processInlineMarkdown(item, keyCounter + i)}
                        </li>
                    ))}
                </ul>
            );
            keyCounter += listItems.length;
            listItems = [];
        }
    };

    const flushQuote = () => {
        if (quoteLines.length > 0) {
            output.push(
                <blockquote key={keyCounter++} className="mb-6 pl-6 border-l-4 border-red-500/40 bg-red-50/60 py-4 pr-4 rounded-r-2xl">
                    <p className="text-gray-700 italic text-lg leading-relaxed">
                        {processInlineMarkdown(quoteLines.join(' '), keyCounter)}
                    </p>
                </blockquote>
            );
            quoteLines = [];
        }
    };

    const flushCode = () => {
        if (codeLines.length > 0) {
            output.push(
                <pre key={keyCounter++} className="mb-6 p-4 bg-gray-900 text-gray-100 rounded-2xl overflow-x-auto text-sm font-mono leading-relaxed shadow-inner">
                    <code>{codeLines.join('\n')}</code>
                </pre>
            );
            codeLines = [];
        }
    };

    lines.forEach(line => {
        const trimmed = line.trim();

        if (trimmed.startsWith('```')) {
            flushParagraph(); flushList(); flushQuote();
            if (inCode) {
                flushCode();
                inCode = false;
            } else {
                inCode = true;
            }
            return;
        }

        if (inCode) {
            codeLines.push(line);
            return;
        }

        if (trimmed.startsWith('### ')) {
            flushParagraph(); flushList(); flushQuote();
            const headingText = trimmed.slice(4);
            const headingId = slugify(cleanText(headingText));
            output.push(
                <h3
                    key={keyCounter++}
                    id={headingId}
                    className="group mb-4 mt-8 text-2xl font-black text-gray-900 tracking-tight scroll-mt-24 flex items-center gap-2"
                >
                    <span>{processInlineMarkdown(headingText, keyCounter)}</span>
                    <a
                        href={`#${headingId}`}
                        className="opacity-0 group-hover:opacity-100 text-red-500 text-lg transition-opacity"
                        aria-label={`Link ke ${headingText}`}
                    >
                        #
                    </a>
                </h3>
            );
            return;
        }
        if (trimmed.startsWith('## ')) {
            flushParagraph(); flushList(); flushQuote();
            const headingText = trimmed.slice(3);
            const headingId = slugify(cleanText(headingText));
            output.push(
                <h2
                    key={keyCounter++}
                    id={headingId}
                    className="group mb-4 mt-10 text-3xl font-black text-gray-900 tracking-tight scroll-mt-24 flex items-center gap-2"
                >
                    <span>{processInlineMarkdown(headingText, keyCounter)}</span>
                    <a
                        href={`#${headingId}`}
                        className="opacity-0 group-hover:opacity-100 text-red-500 text-xl transition-opacity"
                        aria-label={`Link ke ${headingText}`}
                    >
                        #
                    </a>
                </h2>
            );
            return;
        }
        if (trimmed.startsWith('# ')) {
            flushParagraph(); flushList(); flushQuote();
            const headingText = trimmed.slice(2);
            output.push(<h2 key={keyCounter++} className="mb-4 mt-10 text-3xl font-black text-gray-900 tracking-tight">{processInlineMarkdown(headingText, keyCounter)}</h2>);
            return;
        }

        if (/^[-*+]\s+/.test(trimmed)) {
            flushParagraph(); flushQuote();
            listItems.push(trimmed.replace(/^[-*+]\s+/, ''));
            return;
        } else {
            flushList();
        }

        if (trimmed.startsWith('> ')) {
            flushParagraph(); flushList();
            quoteLines.push(trimmed.slice(2));
            return;
        } else if (quoteLines.length > 0) {
            flushQuote();
        }

        if (/^---+$/.test(trimmed)) {
            flushParagraph(); flushList(); flushQuote();
            output.push(<hr key={keyCounter++} className="my-10 border-gray-200" />);
            return;
        }

        if (trimmed === '') {
            flushParagraph();
            return;
        }

        paraLines.push(trimmed);
    });

    flushParagraph();
    flushList();
    flushQuote();
    flushCode();

    return output;
}

function renderBlogContent(content) {
    if (!content) return null;
    const segments = splitByHtmlMedia(content);
    return segments.map((seg, idx) => {
        if (seg.type === 'html') {
            const lower = seg.text.toLowerCase().trim();
            const isSafe = lower.startsWith('<audio') || lower.startsWith('<video') || lower.startsWith('<img');
            if (!isSafe) return null;
            return <div key={idx} className="my-8" dangerouslySetInnerHTML={{ __html: seg.text }} />;
        }
        return <div key={idx}>{renderMarkdown(seg.text, idx * 1000)}</div>;
    });
}

export default async function BlogDetailPage({ params }) {
    const { slug } = await params;

    let blog = null;
    let allBlogs = [];
    try {
        const [detailData, listData] = await Promise.all([
            getBlogDetailBySlug(slug),
            getBlogList().catch(() => []),
        ]);
        blog = detailData;
        allBlogs = Array.isArray(listData) ? listData : [];
    } catch (error) {
        console.error('Blog fetch error:', error.message);
    }

    if (!blog) {
        notFound();
    }

    const featuredImg = getFullMediaUrl(blog.featured_image_url);
    const postUrl = `${BASE_URL}/blog/${blog.slug}`;
    const cleanDesc = blog.excerpt
        ? cleanText(blog.excerpt)
        : cleanText(blog.content).substring(0, 160);

    // Calculate reading time & word count
    const wordCount = (blog.content || '').trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Table of Contents
    const toc = extractTableOfContents(blog.content);

    // Related Posts (Filter out current, sort by common tags or recency)
    const relatedPosts = allBlogs
        .filter((b) => b.slug !== blog.slug)
        .map((b) => {
            const commonTags = (b.tags || []).filter((t) => (blog.tags || []).includes(t)).length;
            return { ...b, score: commonTags };
        })
        .sort((a, b) => b.score - a.score || new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);

    // Structured Data JSON-LD (BlogPosting & Breadcrumbs)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BlogPosting',
                '@id': `${postUrl}#article`,
                isPartOf: {
                    '@type': 'WebSite',
                    '@id': `${BASE_URL}/#website`,
                    name: 'JBook',
                    url: BASE_URL,
                },
                headline: blog.title,
                description: cleanDesc,
                image: featuredImg || `${BASE_URL}/icon-512.png`,
                datePublished: blog.created_at,
                dateModified: blog.updated_at || blog.created_at,
                mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': postUrl,
                },
                author: {
                    '@type': 'Organization',
                    name: 'Tim JBook',
                    url: `${BASE_URL}/about`,
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'JBook',
                    url: BASE_URL,
                    logo: {
                        '@type': 'ImageObject',
                        url: `${BASE_URL}/icon-512.png`,
                    },
                },
                inLanguage: 'id-ID',
                keywords: (blog.tags || []).join(', '),
                wordCount: wordCount,
                articleSection: blog.tags?.[0] || 'Bahasa Jepang',
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${postUrl}#breadcrumb`,
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
                        item: `${BASE_URL}/blog`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: blog.title,
                        item: postUrl,
                    },
                ],
            },
        ],
    };

    return (
        <div className="bg-white min-h-screen">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero with Featured Image */}
            {featuredImg && (
                <div className="relative w-full h-64 md:h-96 lg:h-[450px] overflow-hidden bg-gray-100">
                    <img
                        src={featuredImg}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                        fetchPriority="high"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
                </div>
            )}

            {/* Header & Meta */}
            <div className={`${featuredImg ? 'relative -mt-32 md:-mt-48 z-10' : 'bg-gray-50 py-12 border-b border-gray-100'}`}>
                <div className="container mx-auto px-6 max-w-4xl">
                    {/* Breadcrumbs Navigation */}
                    <nav aria-label="Breadcrumb" className="mb-6">
                        <ol className={`flex flex-wrap items-center gap-2 text-xs md:text-sm font-bold ${featuredImg ? 'text-white/90 drop-shadow' : 'text-gray-500'}`}>
                            <li>
                                <Link href="/" className="hover:underline hover:text-red-500 transition-colors">
                                    Beranda
                                </Link>
                            </li>
                            <li>/</li>
                            <li>
                                <Link href="/blog" className="hover:underline hover:text-red-500 transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>/</li>
                            <li className="truncate max-w-[200px] md:max-w-xs text-red-600 font-extrabold" aria-current="page">
                                {blog.title}
                            </li>
                        </ol>
                    </nav>

                    <div className={`rounded-t-[2.5rem] ${featuredImg ? 'bg-white shadow-2xl shadow-black/10' : ''} p-6 md:p-10`}>
                        {/* Tags */}
                        {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {blog.tags.map(tag => (
                                    <span key={tag} className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-red-50 text-red-600 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <h1 className={`${featuredImg ? 'text-3xl md:text-5xl' : 'text-4xl md:text-6xl'} font-black text-gray-900 leading-tight mb-6 tracking-tight`}>
                            {blog.title}
                        </h1>

                        {/* Author, Date, Reading Time */}
                        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-500 font-bold pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-md">
                                    JB
                                </div>
                                <span className="text-gray-900">Tim JBook</span>
                            </div>
                            <span>•</span>
                            <time dateTime={blog.created_at}>
                                {new Date(blog.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </time>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-gray-600">
                                ⏱️ {readingTime} menit baca ({wordCount} kata)
                            </span>
                        </div>

                        {blog.excerpt && (
                            <div className="mt-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-100/70">
                                <p className="text-gray-800 italic leading-relaxed text-base font-medium">
                                    💡 {blog.excerpt}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="container mx-auto px-6 pb-20 max-w-4xl">
                <div className="px-0 md:px-10 py-6">
                    {/* Table of Contents (if 2+ headings) */}
                    {toc.length >= 2 && (
                        <nav aria-label="Daftar Isi" className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-200/80">
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-2">
                                <span>📑</span> Daftar Isi Artikel
                            </h2>
                            <ul className="space-y-2 text-sm">
                                {toc.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className={item.level === 3 ? 'ml-4' : ''}
                                    >
                                        <a
                                            href={`#${item.id}`}
                                            className="text-gray-600 hover:text-red-600 font-semibold transition-colors flex items-center gap-1.5"
                                        >
                                            <span className="text-red-400">›</span>
                                            <span>{item.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {/* Article Content */}
                    <article className="prose prose-lg prose-red max-w-none">
                        {renderBlogContent(blog.content)}
                    </article>

                    {/* Social Share & Copy Link Section */}
                    <div className="mt-16 pt-8 border-t-2 border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Suka dengan artikel ini?</h3>
                            <p className="text-sm text-gray-500 font-medium">Bagikan tips ini ke teman belajar bahasa Jepang kamu!</p>
                        </div>
                        <ShareButtons title={blog.title} url={postUrl} />
                    </div>

                    {/* CTA Banner: Learn Japanese with JBook */}
                    <div className="mt-16 p-8 md:p-10 bg-gradient-to-br from-red-600 via-red-700 to-pink-700 rounded-3xl text-white shadow-xl shadow-red-500/20">
                        <div className="max-w-2xl">
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-3">
                                🚀 Praktik Langsung di JBook
                            </span>
                            <h3 className="text-2xl md:text-3xl font-black leading-tight mb-3">
                                Siap Kuasai Bahasa Jepang Lebih Cepat?
                            </h3>
                            <p className="text-red-100 text-sm md:text-base mb-6 leading-relaxed">
                                Jelajahi ribuan materi Kanji interaktif, tata bahasa Bunpo lengkap N5–N1, daftar kosakata Kotoba, serta latihan soal JLPT simulasi resmi.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/kanji"
                                    className="px-4 py-2.5 bg-white text-red-600 hover:bg-red-50 rounded-xl font-black text-sm transition-all shadow active:scale-95"
                                >
                                    Belajar Kanji
                                </Link>
                                <Link
                                    href="/bunpo"
                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-sm transition-all border border-white/20 active:scale-95"
                                >
                                    Tata Bahasa (Bunpo)
                                </Link>
                                <Link
                                    href="/practice"
                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-sm transition-all border border-white/20 active:scale-95"
                                >
                                    Latihan Soal JLPT
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Related Articles (Internal Linking) */}
                    {relatedPosts.length > 0 && (
                        <section aria-labelledby="related-posts-heading" className="mt-20 pt-12 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 id="related-posts-heading" className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                    Artikel Terkait Lainnya
                                </h2>
                                <Link
                                    href="/blog"
                                    className="text-sm font-black text-red-600 hover:text-red-700 transition-colors"
                                >
                                    Lihat Semua →
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {relatedPosts.map((rel) => {
                                    const relImg = getFullMediaUrl(rel.featured_image_url);
                                    return (
                                        <Link
                                            key={rel.id}
                                            href={`/blog/${rel.slug}`}
                                            className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all flex flex-col h-full"
                                        >
                                            <div className="aspect-[16/9] bg-gray-50 overflow-hidden relative">
                                                {relImg ? (
                                                    <img
                                                        src={relImg}
                                                        alt={rel.title}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 text-2xl">
                                                        📝
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {rel.tags && rel.tags.slice(0, 2).map((t) => (
                                                        <span key={t} className="text-[10px] font-black uppercase px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full group-hover:bg-red-50 group-hover:text-red-600">
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-sm group-hover:text-red-600 transition-colors line-clamp-2 mb-2 leading-snug">
                                                    {rel.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 mt-auto">
                                                    {new Date(rel.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
