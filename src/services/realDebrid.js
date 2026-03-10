const BASE_URL = 'https://api.real-debrid.com/rest/1.0';

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request(endpoint, token, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers(token),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(error.error || `Real-Debrid error: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function getUser(token) {
  return request('/user', token);
}

export async function getUserTorrents(token) {
  return request('/torrents?limit=2500', token);
}

export async function addMagnet(token, magnet) {
  const body = new URLSearchParams({ magnet });
  return request('/torrents/addMagnet', token, {
    method: 'POST',
    body,
  });
}

export async function getTorrentInfo(token, id) {
  return request(`/torrents/info/${id}`, token);
}

export async function selectFiles(token, id, files = 'all') {
  const body = new URLSearchParams({ files });
  return request(`/torrents/selectFiles/${id}`, token, {
    method: 'POST',
    body,
  });
}

export async function deleteTorrent(token, id) {
  return request(`/torrents/delete/${id}`, token, {
    method: 'DELETE',
  });
}

export async function unrestrictLink(token, link) {
  const body = new URLSearchParams({ link });
  return request('/unrestrict/link', token, {
    method: 'POST',
    body,
  });
}

/**
 * Verifica quais torrents já estão adicionados à conta do usuário.
 * O endpoint global 'instantAvailability' foi desativado em 2024 pelo RD.
 */
export async function checkCachedHashes(token, hashes) {
  const torrents = await getUserTorrents(token).catch(() => []);
  const cachedMap = {};

  for (const t of torrents) {
    const h = t.hash?.toLowerCase();
    if (h) {
      cachedMap[h] = {
        id: t.id,
        filename: t.filename,
        status: t.status,
        progress: t.progress,
        links: t.links || [],
      };
    }
  }

  const result = {};
  for (const hash of hashes) {
    const h = hash.toLowerCase();
    if (cachedMap[h]) {
      result[h] = { userTorrent: cachedMap[h] };
    }
  }

  return result;
}

/**
 * Checa um único torrent criando ele, selecionando arquivos,
 * inspecionando o status de download instantâneo, e depois
 * apagando-o da conta do usuário para não poluir.
 */
export async function checkManualCache(token, magnet) {
  try {
    const torrent = await addMagnet(token, magnet);
    await selectFiles(token, torrent.id, 'all');

    // Timeout para dar tempo ao Real-Debrid de processar o estado do link internamente
    await new Promise((resolve) => setTimeout(resolve, 800));

    const info = await getTorrentInfo(token, torrent.id);

    // Apaga o teste da conta do usuário
    await deleteTorrent(token, torrent.id).catch(() => { });

    // Retorna true se estiver cacheado
    if (info.status === 'downloaded') {
      return {
        cached: true,
        rdInfo: {
          id: info.id,
          filename: info.filename,
          status: info.status,
          links: info.links || [],
        }
      };
    }

    return { cached: false, rdInfo: null };
  } catch (err) {
    console.error('Manual cache check error:', err);
    return { cached: false, error: err.message };
  }
}
