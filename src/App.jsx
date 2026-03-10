import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsSection from './components/ResultsSection';
import Loader from './components/Loader';
import Settings from './components/Settings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { searchTorrents } from './services/torrentSearch';
import { searchJsonSources } from './services/jsonSearch';
import { checkCachedHashes, addMagnet, selectFiles, unrestrictLink, checkManualCache } from './services/realDebrid';
import './App.css';

export default function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [localApiKey, setLocalApiKey] = useLocalStorage('rd_api_token', '');
  const [apiKey, setApiKey] = useState(localApiKey);
  const [localJsonUrls, setLocalJsonUrls] = useLocalStorage('json_urls', []);
  const [jsonUrls, setJsonUrls] = useState(localJsonUrls);
  const [localProviders, setLocalProviders] = useLocalStorage('torrent_providers', {
    apibay: true,
    yts: true,
    tcsv: true,
    x1337: true,
    zlib: true
  });
  const [providers, setProviders] = useState(localProviders);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cachedResults, setCachedResults] = useState([]);
  const [torrentResults, setTorrentResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [sortBy, setSortBy] = useState('seeds'); // 'seeds', 'size', 'date', 'peers'

  // Sync with Clerk Metadata if logged in
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user) {
        const cloudApiKey = user.unsafeMetadata?.rd_api_token;
        const cloudJsonUrls = user.unsafeMetadata?.json_urls;
        const cloudProviders = user.unsafeMetadata?.torrent_providers;

        // 1. Sincronizar API Key
        if (cloudApiKey) {
          // Prioridade para a nuvem se existir
          setApiKey(cloudApiKey);
          setLocalApiKey(cloudApiKey);
        } else if (localApiKey) {
          // Se nuvem vazia mas local tem valor, sobe para a nuvem
          setApiKey(localApiKey);
          user.update({
            unsafeMetadata: { ...user.unsafeMetadata, rd_api_token: localApiKey }
          }).catch(err => console.error('Erro ao subir apiKey para o Clerk:', err));
        }

        // 2. Sincronizar JSON URLs
        if (cloudJsonUrls && Array.isArray(cloudJsonUrls)) {
          setJsonUrls(cloudJsonUrls);
          setLocalJsonUrls(cloudJsonUrls);
        } else if (localJsonUrls && localJsonUrls.length > 0) {
          setJsonUrls(localJsonUrls);
          user.update({
            unsafeMetadata: { ...user.unsafeMetadata, json_urls: localJsonUrls }
          }).catch(err => console.error('Erro ao subir jsonUrls para o Clerk:', err));
        }

        // 3. Sincronizar Provedores
        if (cloudProviders && typeof cloudProviders === 'object') {
          setProviders(cloudProviders);
          setLocalProviders(cloudProviders);
        } else if (localProviders) {
          setProviders(localProviders);
          user.update({
            unsafeMetadata: { ...user.unsafeMetadata, torrent_providers: localProviders }
          }).catch(err => console.error('Erro ao subir providers para o Clerk:', err));
        }
      } else if (!isSignedIn) {
        // Usuário deslogado: mantém o que está no localStorage
        setApiKey(localApiKey);
        setJsonUrls(localJsonUrls);
        setProviders(localProviders);
      }
    }
  }, [isLoaded, isSignedIn, user, localApiKey, localJsonUrls, localProviders, setLocalApiKey, setLocalJsonUrls, setLocalProviders]);

  const handleSaveApiKey = async (newKey) => {
    setApiKey(newKey);
    setLocalApiKey(newKey);

    if (isSignedIn && user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            rd_api_token: newKey
          }
        });
      } catch (err) {
        console.error('Erro ao salvar no Clerk:', err);
      }
    }
  };

  const handleSaveJsonUrls = async (newUrls) => {
    setJsonUrls(newUrls);
    setLocalJsonUrls(newUrls);

    if (isSignedIn && user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            json_urls: newUrls
          }
        });
      } catch (err) {
        console.error('Erro ao salvar no Clerk:', err);
      }
    }
  };

  const handleSaveProviders = async (newProviders) => {
    setProviders(newProviders);
    setLocalProviders(newProviders);

    if (isSignedIn && user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            torrent_providers: newProviders
          }
        });
      } catch (err) {
        console.error('Erro ao salvar no Clerk:', err);
      }
    }
  };
 

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSearch = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    setCachedResults([]);
    setTorrentResults([]);
    setSearched(true);

    try {
      // Step 1: Search torrents from API and JSON sources
      const [rawApiResults, jsonResults] = await Promise.all([
        searchTorrents(query, providers),
        searchJsonSources(query, jsonUrls)
      ]);

      const rawResults = [...jsonResults, ...rawApiResults];

      if (!rawResults.length) {
        setTorrentResults([]);
        setLoading(false);
        return;
      }

      // Deduplicate results by hash immediately
      const results = [];
      const seenHashes = new Set();
      for (const r of rawResults) {
        const h = r.hash?.toLowerCase();
        if (h) {
          if (seenHashes.has(h)) continue;
          seenHashes.add(h);
        }
        results.push(r);
      }

      // Step 2: Check Real-Debrid instant availability (if API key configured)
      if (apiKey) {
        try {
          const hashes = results.map((r) => r.hash).filter(Boolean);
          const cachedMap = await checkCachedHashes(apiKey, hashes);

          const cached = [];
          const torrents = [];

          for (const r of results) {
            const h = r.hash?.toLowerCase();
            if (h && cachedMap[h]) {
              cached.push({ ...r, rdInfo: cachedMap[h].userTorrent });
            } else {
              torrents.push(r);
            }
          }

          setCachedResults(cached);
          setTorrentResults(torrents);
        } catch (rdErr) {
          console.warn('Real-Debrid check failed:', rdErr);
          setTorrentResults(results);
        }
      } else {
        setTorrentResults(results);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, jsonUrls]);

  const parseSize = (sizeStr) => {
    if (!sizeStr) return 0;
    const units = { 'B': 1, 'KB': 1024, 'MB': 1024 ** 2, 'GB': 1024 ** 3, 'TB': 1024 ** 4 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    return value * (units[unit] || 1);
  };

  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'Desconhecida') return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    }
    return new Date(dateStr).getTime() || 0;
  };

  const getSortedResults = (results) => {
    return [...results].sort((a, b) => {
      if (sortBy === 'seeds') return (b.seeds || 0) - (a.seeds || 0);
      if (sortBy === 'peers') return (b.peers || 0) - (a.peers || 0);
      if (sortBy === 'size') return parseSize(b.size) - parseSize(a.size);
      if (sortBy === 'date') return parseDate(b.date) - parseDate(a.date);
      return 0;
    });
  };

  const sortedCached = getSortedResults(cachedResults);
  const sortedTorrents = getSortedResults(torrentResults);

  const handleSmartRD = useCallback(async (magnet) => {
    if (!apiKey) throw new Error('Configure seu token Real-Debrid primeiro');

    // 1. Add magnet
    const torrent = await addMagnet(apiKey, magnet);
    // 2. Select all files
    await selectFiles(apiKey, torrent.id, 'all');

    // 3. Wait 1 second to let RD process cache availability
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Inspecionar status
    const info = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrent.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    }).then(r => r.json());

    if (info.status === 'downloaded' && info.links && info.links.length > 0) {
      // Cached! Vamos obter o link final para cada parte
      const unrestrictPromises = info.links.map(link => unrestrictLink(apiKey, link));
      const linksData = await Promise.all(unrestrictPromises);

      const parsedLinks = linksData.map(l => ({
        id: l.id,
        filename: l.filename,
        filesize: l.filesize,
        downloadUrl: l.download
      })).filter(l => l.downloadUrl); // remover eventuais falhas

      if (parsedLinks.length === 1) {
        // Arquivo unico (um filme padrão), mantem o auto-download pra ser luxuoso
        window.open(parsedLinks[0].downloadUrl, '_blank');
        return { type: 'downloaded', message: 'Torrent 100% cacheado! Download iniciado.', directLink: parsedLinks[0].downloadUrl };
      } else if (parsedLinks.length > 1) {
        // Pack de Temporada ou Multiplos Arquivos
        return { type: 'multi', message: 'Múltiplos arquivos disponíveis na conta.', links: parsedLinks };
      }
    }

    return { type: 'queued', message: 'Transferência iniciada no Real-Debrid.' };
  }, [apiKey]);

  const handleManualCheck = useCallback(async (magnet, torrentId) => {
    if (!apiKey) throw new Error('Configure seu token Real-Debrid primeiro');

    // Manda verificar furtivamente (faz o add, aguarda, info e logo em seguida apaga)
    const res = await checkManualCache(apiKey, magnet);

    if (res.cached) {
      setTorrentResults(prev => {
        const itemIndex = prev.findIndex(t => t.id === torrentId);
        if (itemIndex > -1) {
          const item = prev[itemIndex];
          // Remove todos os itens com o mesmo hash (clones de trackers diferentes por ex)
          const newTorrents = prev.filter(t => t.hash?.toLowerCase() !== item.hash?.toLowerCase());

          // Atualiza cachedResults apenas se ainda não estiver lá
          setCachedResults(currentCached => {
            const alreadyExists = currentCached.some(c => c.hash?.toLowerCase() === item.hash?.toLowerCase());
            if (alreadyExists) return currentCached;
            return [{ ...item, rdInfo: res.rdInfo }, ...currentCached];
          });

          return newTorrents;
        }
        return prev;
      });
      return { success: true, message: 'Disponibilidade encontrada, transferido para Real-Debrid!' };
    }
    return { success: false, message: 'Sem cache disponível no Real-Debrid.' };
  }, [apiKey]);


  return (
    <div className="app">
      <Header
        onSettingsClick={() => setSettingsOpen(true)}
        hasApiKey={!!apiKey}
      />

      <main className="app__main container">
        {!isLoaded ? (
          <Loader />
        ) : !isSignedIn ? (
          <div className="app__hero app__hero--centered animate-fade-in">
            <h2 className="app__welcome-title">Real Search</h2>
            <div className="app__login-cta">
              <p>Faça login para continuar.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="app__hero">
              <SearchBar onSearch={handleSearch} isLoading={loading} />
            </div>

            {loading && <Loader />}

            {error && (
              <div className="app__error animate-fade-in">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {!loading && searched && cachedResults.length === 0 && torrentResults.length === 0 && !error && (
              <div className="app__empty animate-fade-in">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <p>Nenhum resultado encontrado.</p>
              </div>
            )}

            {!loading && (sortedCached.length > 0 || sortedTorrents.length > 0) && (
              <ResultsSection
                cachedResults={sortedCached}
                torrentResults={sortedTorrents}
                apiKey={apiKey}
                onSmartRD={handleSmartRD}
                onManualCheck={handleManualCheck}
                onToast={showToast}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            )}
          </>
        )}
      </main>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        jsonUrls={jsonUrls}
        onSaveJsonUrls={handleSaveJsonUrls}
        providers={providers}
        onSaveProviders={handleSaveProviders}
        isSignedIn={isSignedIn}
      />

      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
