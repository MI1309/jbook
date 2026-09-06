import { getBlogList, API_URL } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

async function safeFetch(fn, fallback = []) {
  try {
    const result = await fn();
    return Array.isArray(result) ? result : (result?.items || fallback);
  } catch (e) {
    console.warn('[sitemap] fetch failed:', e.message);
    return fallback;
  }
}

// Fetch helper via direct fetch for kanji/bunpo/kotoba list
async function fetchList(endpoint, limit = 500) {
  try {
    const res = await fetch(`${API_URL}${endpoint}?limit=${limit}`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.items || []);
  } catch (e) {
    return [];
  }
}

export default async function sitemap() {
  const blogs = await safeFetch(getBlogList, []);
  const kanjis = await fetchList('/content/kanji', 300);
  const bunpos = await fetchList('/content/grammar', 300);
  const kotobas = await fetchList('/content/vocab', 300);

  const fmtDate = (d) => {
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return new Date().toISOString();
      return dt.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const today = new Date().toISOString();

  const staticPages = [
    {
      url: BASE_URL,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: blogs.length > 0 ? fmtDate(blogs[0].updated_at || blogs[0].created_at) : today,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/kanji`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/bunpo`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/kotoba`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/kana`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/tts`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/practice`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ];

  // Blog detail pages
  const blogPages = blogs.map((blog) => ({
    url: `${BASE_URL}/blog/${blog.slug}`,
    lastModified: fmtDate(blog.updated_at || blog.created_at),
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  // Kanji detail pages (safe cap 300)
  const kanjiPages = kanjis.slice(0, 300).map((k) => ({
    url: `${BASE_URL}/kanji/${k.id}`,
    lastModified: today,
    changeFrequency: 'yearly',
    priority: 0.65,
  }));

  // Bunpo detail pages
  const bunpoPages = bunpos.slice(0, 300).map((b) => ({
    url: `${BASE_URL}/bunpo/${b.id}`,
    lastModified: today,
    changeFrequency: 'yearly',
    priority: 0.65,
  }));

  // Kotoba detail pages
  const kotobaPages = kotobas.slice(0, 300).map((v) => ({
    url: `${BASE_URL}/kotoba/${v.id}`,
    lastModified: today,
    changeFrequency: 'yearly',
    priority: 0.65,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...kanjiPages,
    ...bunpoPages,
    ...kotobaPages,
  ];
}
