const SEARCH_ENDPOINT = '/api/search';

export async function searchTorrents(query, providers = null) {
    if (!query || !query.trim()) return [];

    let url = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query.trim())}`;
    
    if (providers) {
        const activeProviders = Object.entries(providers)
            .filter(([_, active]) => active)
            .map(([name]) => name)
            .join(',');
        if (activeProviders) {
            url += `&providers=${encodeURIComponent(activeProviders)}`;
        }
    }

    const res = await fetch(url);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro na busca' }));
        throw new Error(err.error || `Search error: ${res.status}`);
    }

    return res.json();
}
