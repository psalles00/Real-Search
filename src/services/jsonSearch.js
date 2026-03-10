export async function searchJsonSources(query, urls) {
    if (!query || !urls || urls.length === 0) return [];

    const results = [];
    const lowercaseQuery = query.toLowerCase().trim();
    const queryTokens = lowercaseQuery.split(/\s+/).filter(t => t.length > 0);

    // Helper to extract hash from magnet
    const getHashFromMagnet = (magnet) => {
        const match = magnet?.match(/xt=urn:btih:([^&/]+)/i);
        return match ? match[1].toLowerCase() : null;
    };

    const fetchPromises = urls.map(async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();

            // The format example: { name: "...", downloads: [ { title: "...", uris: ["magnet:..."], uploadDate: "...", fileSize: "..." } ] }
            if (!data.downloads || !Array.isArray(data.downloads)) return null;

            const sourceName = data.name || new URL(url).hostname;

            return data.downloads
                .filter(item => {
                    const title = item.title.toLowerCase();
                    // Check if every token in the query is present in the title
                    // We also normalize the title by replacing dots/dashes with spaces during comparison
                    const normalizedTitle = title.replace(/[.\-_]/g, ' ');
                    return queryTokens.every(token =>
                        title.includes(token) || normalizedTitle.includes(token)
                    );
                })
                .map(item => {
                    const magnet = item.uris?.[0] || '';
                    const hash = getHashFromMagnet(magnet);

                    return {
                        id: `json-${sourceName}-${hash || Math.random()}`,
                        title: item.title,
                        hash: hash,
                        seeds: 0, // JSON sources usually don't have seed info in this format
                        peers: 0,
                        size: item.fileSize || 'Desconhecido',
                        date: item.uploadDate ? new Date(item.uploadDate).toLocaleDateString('pt-BR') : 'Desconhecida',
                        source: sourceName,
                        magnet: magnet,
                        isJsonSource: true
                    };
                });
        } catch (err) {
            console.warn(`Error fetching JSON source ${url}:`, err);
            return null;
        }
    });

    const allResults = await Promise.all(fetchPromises);

    for (const group of allResults) {
        if (group) {
            results.push(...group);
        }
    }

    return results;
}
