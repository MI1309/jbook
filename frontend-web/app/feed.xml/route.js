import { getBlogList } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

function cleanText(text) {
    if (!text) return '';
    return text.replace(/[#*`_~\[\]()><\\]/g, '').replace(/\s+/g, ' ').trim();
}

export async function GET() {
    let blogs = [];
    try {
        const res = await getBlogList();
        blogs = Array.isArray(res) ? res : [];
    } catch (e) {
        console.error('Failed to fetch blogs for RSS feed:', e.message);
    }

    const itemsXml = blogs
        .map((blog) => {
            const postUrl = `${BASE_URL}/blog/${blog.slug}`;
            const desc = blog.excerpt
                ? cleanText(blog.excerpt)
                : cleanText(blog.content).substring(0, 250);
            const pubDate = new Date(blog.created_at).toUTCString();

            const categories = (blog.tags || [])
                .map((t) => `<category><![CDATA[${t}]]></category>`)
                .join('');

            return `
        <item>
            <title><![CDATA[${blog.title}]]></title>
            <link>${postUrl}</link>
            <guid isPermaLink="true">${postUrl}</guid>
            <description><![CDATA[${desc}]]></description>
            <pubDate>${pubDate}</pubDate>
            ${categories}
        </item>`;
        })
        .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>JBook Blog - Belajar Bahasa Jepang</title>
        <link>${BASE_URL}/blog</link>
        <description>Kumpulan artikel, tips Bunpo, Kanji, Kotoba, dan panduan belajar JLPT di JBook.</description>
        <language>id-ID</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
        ${itemsXml}
    </channel>
</rss>`;

    return new Response(rssXml.trim(), {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
