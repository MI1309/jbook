import { API_URL } from '@/lib/api';
import { getKanjiHref } from '@/lib/kanji-route';
import { BUNPO_LEVELS } from '@/data/bunpoLevels';
import { getBunpoSlug } from '@/data/bunpoSlugs';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

// Fetch every page so large vocab and grammar catalogues are not truncated.
async function fetchList(endpoint, limit = 500, revalidate = 86400) {
  try {
    const firstRes = await fetch(`${API_URL}${endpoint}?limit=${limit}&page=1`, { next: { revalidate } });
    if (!firstRes.ok) return [];

    const firstPage = await firstRes.json();
    if (Array.isArray(firstPage)) return firstPage;

    const items = [...(firstPage?.items || [])];
    const pages = Math.max(1, Number(firstPage?.pages) || 1);

    for (let page = 2; page <= pages; page += 1) {
      const res = await fetch(`${API_URL}${endpoint}?limit=${limit}&page=${page}`, { next: { revalidate } });
      if (!res.ok) return [];

      const data = await res.json();
      if (Array.isArray(data)) return [...items, ...data];
      items.push(...(data?.items || []));
    }

    return items;
  } catch {
    return [];
  }
}

async function fetchAllKanji() {
  try {
    const res = await fetch(`${API_URL}/content/kanji/sitemap`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const kanjis = await fetchAllKanji();
  const bunpos = await fetchList('/content/grammar', 300, 3600);
  const kotobas = await fetchList('/content/vocab', 300);

  const today = new Date().toISOString();

  const staticPages = [
    {
      url: BASE_URL,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 1,
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
    ...BUNPO_LEVELS.map(({ level }) => ({
      url: `${BASE_URL}/bunpo/${level}`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.85,
    })),
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

  // Include every Kanji detail page, including levels hidden from the catalogue.
  const kanjiPages = kanjis.map((k) => ({
    url: `${BASE_URL}${getKanjiHref(k)}`,
    lastModified: today,
    changeFrequency: 'yearly',
    priority: 0.65,
  }));

  // Bunpo detail pages
  const bunpoPages = bunpos.map((b) => {
    const slug = b.slug || getBunpoSlug(b.title);
    if (!slug) return null;
    return {
      url: `${BASE_URL}/bunpo/n${b.jlpt_level}/${slug}`,
      lastModified: today,
      changeFrequency: 'yearly',
      priority: 0.65,
    };
  }).filter(Boolean);

  // Kotoba detail pages
  const kotobaPages = kotobas.map((v) => ({
    url: `${BASE_URL}/kotoba/${v.id}`,
    lastModified: today,
    changeFrequency: 'yearly',
    priority: 0.65,
  }));

  return [
    ...staticPages,
    ...kanjiPages,
    ...bunpoPages,
    ...kotobaPages,
  ];
}
