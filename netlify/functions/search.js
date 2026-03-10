import * as cheerio from 'cheerio';

const MAX_RESULTS = 300;

// Common public trackers
const TRACKERS = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.internetwarriors.net:1337/announce',
    'udp://tracker.leechers-paradise.org:6969/announce',
    'udp://tracker.coppersurfer.tk:6969/announce',
    'udp://tracker.openbittorrent.com:80',
    'udp://p4p.arenabg.ch:1337',
    'udp://9.rarbg.com:2810/announce'
];

const TR_STRING = TRACKERS.map(tr => `&tr=${encodeURIComponent(tr)}`).join('');

function formatBytes(bytes) {
    const sizeBytes = parseInt(bytes, 10);
    if (isNaN(sizeBytes) || sizeBytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeBytes) / Math.log(k));
    return parseFloat((sizeBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function searchAPIBay(query) {
    const results = [];
    try {
        const response = await fetch(`https://apibay.org/q.php?q=${encodeURIComponent(query)}`);
        if (!response.ok) return results;
        const data = await response.json();

        if (!data.length || data[0].id === "0" || data[0].info_hash === "0000000000000000000000000000000000000000") {
            return results;
        }

        for (const item of data) {
            const infoHash = item.info_hash.toLowerCase();
            const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(item.name)}${TR_STRING}`;
            let uploadDate = 'Desconhecida';
            if (item.added) {
                uploadDate = new Date(parseInt(item.added, 10) * 1000).toLocaleDateString('pt-BR');
            }

            results.push({
                id: `apibay-${item.id}`,
                title: item.name,
                hash: infoHash,
                seeds: parseInt(item.seeders, 10) || 0,
                peers: parseInt(item.leechers, 10) || 0,
                size: formatBytes(item.size),
                date: uploadDate,
                source: 'The Pirate Bay',
                magnet
            });
        }
    } catch (err) {
        console.warn('APIBay search error:', err);
    }
    return results;
}

async function searchYTS(query) {
    const results = [];
    try {
        // YTS supports limit up to 50 and pagination
        const pages = [1, 2, 3]; // 3 pages × 50 = up to 150 results
        const fetches = pages.map(page =>
            fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=50&page=${page}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
        );
        const responses = await Promise.all(fetches);

        for (const body of responses) {
            if (!body?.data?.movies) continue;
            for (const movie of body.data.movies) {
                if (!movie.torrents) continue;
                for (const torrent of movie.torrents) {
                    const hash = torrent.hash.toLowerCase();
                    const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(movie.title + ' ' + torrent.quality + ' [YTS]')}${TR_STRING}`;
                    results.push({
                        id: `yts-${movie.id}-${torrent.quality}-${torrent.type || ''}`,
                        title: `${movie.title} (${movie.year}) [${torrent.quality}${torrent.type === 'bluray' ? ' BluRay' : ''}]`,
                        hash,
                        seeds: parseInt(torrent.seeds, 10) || 0,
                        peers: parseInt(torrent.peers, 10) || 0,
                        size: torrent.size,
                        date: new Date(torrent.date_uploaded_unix * 1000).toLocaleDateString('pt-BR'),
                        source: 'YTS',
                        magnet
                    });
                }
            }
        }
    } catch (err) {
        console.warn('YTS search error:', err);
    }
    return results;
}

async function searchTorrentsCSV(query) {
    const results = [];
    try {
        const response = await fetch(`https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}&size=50`);
        if (!response.ok) return results;
        const data = await response.json();

        if (!data.torrents || !data.torrents.length) return results;

        for (const item of data.torrents) {
            const hash = item.infohash.toLowerCase();
            const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(item.name)}${TR_STRING}`;
            results.push({
                id: `tcsv-${item.id}`,
                title: item.name,
                hash,
                seeds: parseInt(item.seeders, 10) || 0,
                peers: parseInt(item.leechers, 10) || 0,
                size: formatBytes(item.size_bytes),
                date: new Date(item.created_unix * 1000).toLocaleDateString('pt-BR'),
                source: 'Torrents-CSV',
                magnet
            });
        }
    } catch (err) {
        console.warn('Torrents-CSV search error:', err);
    }
    return results;
}

async function search1337x(query) {
    const results = [];
    try {
        const searchUrl = `https://www.1377x.to/search/${encodeURIComponent(query)}/1/`;
        const response = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (!response.ok) return results;
        const html = await response.text();
        const $ = cheerio.load(html);

        const rows = $('table.table-list tbody tr');
        const detailPromises = [];

        rows.slice(0, 15).each((i, el) => {
            const title = $(el).find('td.coll-1.name a').last().text();
            const detailPath = $(el).find('td.coll-1.name a').last().attr('href');
            const seeds = parseInt($(el).find('td.coll-2.seeds').text(), 10) || 0;
            const leeches = parseInt($(el).find('td.coll-3.leeches').text(), 10) || 0;
            
            const sizeClone = $(el).find('td.coll-4.size').clone();
            sizeClone.children().remove();
            const size = sizeClone.text().trim();
            
            const date = $(el).find('td.coll-5.date').text();

            if (detailPath) {
                const detailUrl = `https://www.1377x.to${detailPath}`;
                detailPromises.push(
                    fetch(detailUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                    })
                        .then(r => r.text())
                        .then(detailHtml => {
                            const $$ = cheerio.load(detailHtml);
                            const magnet = $$('a[href^="magnet:"]').attr('href');
                            const infoHashMatch = magnet?.match(/btih:([a-fA-F0-9]+)/);
                            const hash = infoHashMatch ? infoHashMatch[1].toLowerCase() : null;

                            if (magnet && hash) {
                                return {
                                    id: `1337x-${hash}`,
                                    title,
                                    hash,
                                    seeds,
                                    peers: leeches,
                                    size,
                                    date,
                                    source: '1337x',
                                    magnet
                                };
                            }
                        })
                        .catch(() => null)
                );
            }
        });

        const scrapedResults = await Promise.all(detailPromises);
        return scrapedResults.filter(Boolean);
    } catch (err) {
        console.warn('1337x search error:', err);
    }
    return results;
}

async function smartSearch(query) {
    const seasonMatch = query.match(/(.+?)\s+(s(\d+)|season\s+(\d+)|temporada\s+(\d+))/i);
    let queries = [query];
    let filterPattern = null;

    if (seasonMatch) {
        const baseTitle = seasonMatch[1].trim();
        const seasonNum = parseInt(seasonMatch[3] || seasonMatch[4] || seasonMatch[5], 10);
        const sXX = `S${seasonNum.toString().padStart(2, '0')}`;

        queries.push(baseTitle);
        filterPattern = new RegExp(`${sXX}|Season\\s*0?${seasonNum}|Temporada\\s*0?${seasonNum}`, 'i');
    }

    const allResultsRaw = await Promise.all(queries.map(async (q) => {
        const [apibay, yts, tcsv, x1337] = await Promise.all([
            searchAPIBay(q),
            searchYTS(q),
            searchTorrentsCSV(q),
            search1337x(q)
        ]);
        return [...apibay, ...yts, ...tcsv, ...x1337];
    }));

    const seen = new Set();
    let mergedResults = [];

    allResultsRaw.flat().forEach(r => {
        if (!seen.has(r.hash)) {
            seen.add(r.hash);
            if (filterPattern) {
                if (filterPattern.test(r.title)) {
                    mergedResults.push(r);
                }
            } else {
                mergedResults.push(r);
            }
        }
    });

    return mergedResults;
}

export default async (request) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');

    if (!q) {
        return new Response(JSON.stringify({ error: 'Termo de busca vazio' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const results = await smartSearch(q);

        // Sort by seeders descending
        results.sort((a, b) => b.seeds - a.seeds);

        const limitedResults = results.slice(0, MAX_RESULTS);

        return new Response(JSON.stringify(limitedResults), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Search error:', error);
        return new Response(JSON.stringify({ error: 'Erro ao buscar torrents' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};