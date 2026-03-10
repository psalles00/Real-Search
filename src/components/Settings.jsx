import { useState, useEffect } from 'react';
import { getUser } from '../services/realDebrid';
import './Settings.css';

export default function Settings({ 
    isOpen, 
    onClose, 
    apiKey, 
    onSaveApiKey, 
    jsonUrls, 
    onSaveJsonUrls, 
    providers,
    onSaveProviders,
    isSignedIn 
}) {
    const [inputKey, setInputKey] = useState(apiKey || '');
    const [jsonInput, setJsonInput] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const toggleProvider = (providerId) => {
        const newProviders = {
            ...providers,
            [providerId]: !providers[providerId]
        };
        onSaveProviders(newProviders);
    };
    useEffect(() => {
        setInputKey(apiKey || '');
    }, [apiKey]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSaveApiKey(inputKey.trim());
        setTestResult({ success: true, message: 'Token salvo com sucesso!' });
    };

    const handleTest = async () => {
        if (!inputKey.trim()) return;
        setTesting(true);
        setTestResult(null);
        try {
            const user = await getUser(inputKey.trim());
            setTestResult({
                success: true,
                message: `Conectado! Usuário: ${user.username} | Tipo: ${user.type} | Expira: ${new Date(user.expiration).toLocaleDateString('pt-BR')}`,
            });
        } catch (err) {
            setTestResult({
                success: false,
                message: `Erro: ${err.message}`,
            });
        } finally {
            setTesting(false);
        }
    };

    const handleClear = () => {
        setInputKey('');
        onSaveApiKey('');
        setTestResult(null);
    };

    const handleAddJson = () => {
        if (!jsonInput.trim()) return;

        // Split by newlines or commas and clean up
        const newUrls = jsonInput
            .split(/[\n,]+/)
            .map(url => url.trim())
            .filter(url => url.startsWith('http') && !jsonUrls.includes(url));

        if (newUrls.length > 0) {
            onSaveJsonUrls([...jsonUrls, ...newUrls]);
            setJsonInput('');
        }
    };

    const handleRemoveJson = (urlToRemove) => {
        onSaveJsonUrls(jsonUrls.filter(url => url !== urlToRemove));
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div
                className="settings-modal glass animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings-modal__header">
                    <h2>Configurações</h2>
                    <button className="settings-modal__close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="settings-modal__body">
                    <div className="settings-field">
                        <label className="settings-field__label" htmlFor="api-key-input">
                            Real-Debrid API Token
                        </label>
                        <p className="settings-field__help">
                            Obtenha seu token em{' '}
                            <a href="https://real-debrid.com/apitoken" target="_blank" rel="noopener noreferrer">
                                real-debrid.com/apitoken
                            </a>
                        </p>
                        <input
                            id="api-key-input"
                            type="password"
                            className="settings-field__input"
                            placeholder="Cole seu API token aqui..."
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                        />
                    </div>

                    <div className="settings-field">
                        <label className="settings-field__label">Provedores de Busca</label>
                        <div className="settings-providers">
                            <label className="settings-provider-toggle">
                                <input
                                    type="checkbox"
                                    checked={providers.apibay}
                                    onChange={() => toggleProvider('apibay')}
                                />
                                <span>The Pirate Bay</span>
                            </label>
                            <label className="settings-provider-toggle">
                                <input
                                    type="checkbox"
                                    checked={providers.yts}
                                    onChange={() => toggleProvider('yts')}
                                />
                                <span>YTS</span>
                            </label>
                            <label className="settings-provider-toggle">
                                <input
                                    type="checkbox"
                                    checked={providers.tcsv}
                                    onChange={() => toggleProvider('tcsv')}
                                />
                                <span>TorrentsCSV</span>
                            </label>
                            <label className="settings-provider-toggle">
                                <input
                                    type="checkbox"
                                    checked={providers.x1337}
                                    onChange={() => toggleProvider('x1337')}
                                />
                                <span>1337x</span>
                            </label>
                            <label className="settings-provider-toggle">
                                <input
                                    type="checkbox"
                                    checked={providers.libgen}
                                    onChange={() => toggleProvider('libgen')}
                                />
                                <span>LibGen</span>
                            </label>
                            <label className="settings-provider-toggle">
                                <input
                                    type="checkbox"
                                    checked={providers.zlib}
                                    onChange={() => toggleProvider('zlib')}
                                />
                                <span>Z-Library</span>
                            </label>
                        </div>
                    </div>

                    <div className="settings-field">
                        <label className="settings-field__label">Fontes JSON Externas</label>
                        <p className="settings-field__help">
                            Adicione URLs de arquivos JSON contendo links (ex: Jackett/Prowlarr export).
                            Um por linha ou separados por vírgula.
                        </p>
                        <div className="settings-json-input">
                            <textarea
                                className="settings-field__input settings-field__textarea"
                                placeholder="https://exemplo.com/links.json"
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                rows="3"
                            />
                            <button 
                                className="settings-json-add-btn"
                                onClick={handleAddJson}
                                disabled={!jsonInput.trim()}
                            >
                                Adicionar
                            </button>
                        </div>

                        {jsonUrls.length > 0 && (
                            <div className="settings-json-list">
                                {jsonUrls.map((url, index) => (
                                    <div key={index} className="settings-json-item">
                                        <span className="settings-json-url" title={url}>{url}</span>
                                        <button 
                                            className="settings-json-remove" 
                                            onClick={() => handleRemoveJson(url)}
                                            title="Remover"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {testResult && (
                        <div
                            className={`settings-result ${testResult.success ? 'settings-result--success' : 'settings-result--error'}`}
                        >
                            {testResult.message}
                        </div>
                    )}

                    <div className="settings-actions">
                        <button
                            id="test-connection-btn"
                            className="settings-actions__btn settings-actions__btn--secondary"
                            onClick={handleTest}
                            disabled={!inputKey.trim() || testing}
                        >
                            {testing ? 'Testando...' : 'Testar Conexão'}
                        </button>
                        <button
                            id="save-token-btn"
                            className="settings-actions__btn settings-actions__btn--primary"
                            onClick={handleSave}
                            disabled={!inputKey.trim()}
                        >
                            Salvar
                        </button>
                    </div>

                    {apiKey && (
                        <button
                            className="settings-actions__btn settings-actions__btn--danger"
                            onClick={handleClear}
                        >
                            Remover Token
                        </button>
                    )}

                    <div className="settings-divider" />

                    <div className="settings-section">
                        <label className="settings-field__label">Provedores de Torrent Ativos</label>
                        <ul className="settings-providers-list">
                            <li>
                                <span className="provider-dot active"></span>
                                Real-Debrid (API)
                            </li>
                            <li 
                                className={`provider-item ${providers?.apibay ? 'active' : 'inactive'}`}
                                onClick={() => toggleProvider('apibay')}
                            >
                                <span className={`provider-dot ${providers?.apibay ? 'active' : ''}`}></span>
                                The Pirate Bay (via APIBay)
                            </li>
                            <li 
                                className={`provider-item ${providers?.yts ? 'active' : 'inactive'}`}
                                onClick={() => toggleProvider('yts')}
                            >
                                <span className={`provider-dot ${providers?.yts ? 'active' : ''}`}></span>
                                YTS (via API)
                            </li>
                            <li 
                                className={`provider-item ${providers?.tcsv ? 'active' : 'inactive'}`}
                                onClick={() => toggleProvider('tcsv')}
                            >
                                <span className={`provider-dot ${providers?.tcsv ? 'active' : ''}`}></span>
                                Torrents-CSV (via API)
                            </li>
                            <li 
                                className={`provider-item ${providers?.x1337 ? 'active' : 'inactive'}`}
                                onClick={() => toggleProvider('x1337')}
                            >
                                <span className={`provider-dot ${providers?.x1337 ? 'active' : ''}`}></span>
                                1337x.to (Scraper)
                            </li>
                            <li 
                                className={`provider-item ${providers?.libgen ? 'active' : 'inactive'}`}
                                onClick={() => toggleProvider('libgen')}
                            >
                                <span className={`provider-dot ${providers?.libgen ? 'active' : ''}`}></span>
                                LibGen (Scraper)
                            </li>
                            <li 
                                className={`provider-item ${providers?.zlib ? 'active' : 'inactive'}`}
                                onClick={() => toggleProvider('zlib')}
                            >
                                <span className={`provider-dot ${providers?.zlib ? 'active' : ''}`}></span>
                                Z-Library (Scraper)
                            </li>
                        </ul>
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-field">
                        <label className="settings-field__label">Fontes JSON Externas</label>
                        <p className="settings-field__help">
                            Adicione links de arquivos .json contendo índices de download.
                        </p>
                        <div className="settings-field__group">
                            <textarea
                                className="settings-field__input settings-field__input--textarea"
                                placeholder="Insira uma ou mais URLs (uma por linha ou separadas por vírgula)..."
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                rows={3}
                            />
                            <button
                                className="settings-actions__btn settings-actions__btn--secondary"
                                onClick={handleAddJson}
                                disabled={!jsonInput.trim()}
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {jsonUrls && jsonUrls.length > 0 && (
                        <div className="settings-json-list">
                            {jsonUrls.map((url, idx) => (
                                <div key={idx} className="settings-json-item">
                                    <span title={url}>{url.split('/').pop() || url}</span>
                                    <button
                                        className="settings-json-remove"
                                        onClick={() => handleRemoveJson(url)}
                                        title="Remover fonte"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="settings-modal__footer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>
                        {isSignedIn
                            ? 'Suas chaves estão sincronizadas na sua conta.'
                            : 'Seu token é armazenado apenas localmente no seu navegador.'}
                    </span>
                </div>
            </div>
        </div>
    );
}
