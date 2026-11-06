import { API_URL } from '@/lib/api';

const REVALIDATE_SECONDS = 3600;

export async function getBunpoCatalog() {
    const items = [];
    let page = 1;

    while (true) {
        let response;
        let data;
        try {
            response = await fetch(`${API_URL}/content/grammar?limit=300&page=${page}`, {
                next: { revalidate: REVALIDATE_SECONDS },
            });
            if (!response.ok) {
                if (page === 1) throw new Error(`Bunpo catalog request failed (${response.status})`);
                break;
            }
            data = await response.json();
        } catch (error) {
            if (page === 1) throw error;
            break;
        }

        const pageItems = Array.isArray(data) ? data : (data.items || []);
        items.push(...pageItems);

        const totalPages = Number(data?.pages);
        const hasPageCount = Number.isFinite(totalPages) && totalPages > 0;
        if (pageItems.length === 0 || (hasPageCount ? page >= totalPages : pageItems.length < 300)) break;
        page += 1;
    }

    return items;
}

export async function getBunpoGrammarDetail(id) {
    const response = await fetch(`${API_URL}/content/grammar/${encodeURIComponent(id)}`, {
        next: { revalidate: REVALIDATE_SECONDS },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Bunpo detail request failed (${response.status})`);
    return response.json();
}