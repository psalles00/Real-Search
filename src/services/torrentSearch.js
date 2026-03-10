const SEARCH_ENDPOINT = '/api/search';

export async function searchTorrents(query) {
    if (!query || !query.trim()) return [];

    const url = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro na busca' }));
        throw new Error(err.error || `Search error: ${res.status}`);
    }

    return res.json();
}
