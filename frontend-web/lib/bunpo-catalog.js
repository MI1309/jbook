import { API_URL } from '@/lib/api';

const REVALIDATE_SECONDS = 3600;

export async function getBunpoCatalog() {
    const response = await fetch(`${API_URL}/content/grammar?limit=300&page=1`, {
        next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) throw new Error(`Bunpo catalog request failed (${response.status})`);

    const data = await response.json();
    return Array.isArray(data) ? data : (data.items || []);
}

export async function getBunpoGrammarDetail(id) {
    const response = await fetch(`${API_URL}/content/grammar/${encodeURIComponent(id)}`, {
        next: { revalidate: REVALIDATE_SECONDS },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Bunpo detail request failed (${response.status})`);
    return response.json();
}