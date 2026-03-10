import { useState } from 'react';
import './ResultCard.css';

function formatSize(sizeStr) {
    if (!sizeStr) return '—';
    return sizeStr;
}

export default function ResultCard({ result, type, apiKey, onSmartRD, onManualCheck, onToast }) {
    const [adding, setAdding] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkedNoCache, setCheckedNoCache] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState(null);
    const [directDownloadUrl, setDirectDownloadUrl] = useState(null);

    const handleCopyMagnet = () => {
        if (result.magnet) {
            navigator.clipboard.writeText(result.magnet).then(() => {
                onToast?.('Magnet copiado!', 'success');
            }).catch(() => {
                onToast?.('Erro ao copiar', 'error');
            });
        }
    };

    const handleOpenMagnet = () => {
        if (result.magnet) {
            window.open(result.magnet, '_self');
        }
    };

    const handleSmartClick = async () => {
        if (!apiKey || !result.magnet) return;
        setAdding(true);
        try {
            // Abrir o site do Real-Debrid em uma nova janela como solicitado
            window.open('https://real-debrid.com/torrents', '_blank');

            const rdResult = await onSmartRD(result.magnet);
            if (rdResult.type === 'downloaded') {
                setDirectDownloadUrl(rdResult.directLink);
                onToast?.(rdResult.message, 'success');
            } else if (rdResult.type === 'multi') {
                setExpandedFiles(rdResult.links);
                onToast?.(rdResult.message, 'success');
            } else {
                onToast?.(rdResult.message, 'success');
            }
        } catch (err) {
            onToast?.(err.message, 'error');
        } finally {
            setAdding(false);
        }
    };

    const handleCheckCache = async () => {
        if (!apiKey || !result.magnet) return;
        setChecking(true);
        setCheckedNoCache(false);
        try {
            const checkRes = await onManualCheck(result.magnet, result.id);
            if (checkRes.success) {
                onToast?.(checkRes.message, 'success');
            } else {
                setCheckedNoCache(true);
                onToast?.(checkRes.message, 'error');
            }
        } catch (err) {
            onToast?.(err.message, 'error');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className={`result-card result-card--${type}`}>
            <div className="result-card__main">
                <h3 className="result-card__title" title={result.title}>
                    {result.title}
                </h3>
                <div className="result-card__meta">
                    {result.size && (
                        <span className="result-card__badge result-card__badge--size">
                            {formatSize(result.size)}
                        </span>
                    )}
                    {result.seeds !== undefined && (
                        <span className="result-card__badge result-card__badge--seeds">
                            ▲ {result.seeds}
                        </span>
                    )}
                    {result.peers !== undefined && (
                        <span className="result-card__badge result-card__badge--peers">
                            ▼ {result.peers}
                        </span>
                    )}
                    {result.source && (
                        <span className="result-card__badge result-card__badge--source">
                            {result.source}
                        </span>
                    )}
                    {result.date && (
                        <span className="result-card__badge result-card__badge--date">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {result.date}
                        </span>
                    )}
                    {type === 'cached' && (
                        <span className="result-card__badge result-card__badge--cached">
                            ⚡ Na sua conta RD
                        </span>
                    )}
                    {type === 'cached' && result.rdInfo?.status && (
                        <span className="result-card__badge result-card__badge--status">
                            {result.rdInfo.status}
                        </span>
                    )}
                </div>
            </div>

            <div className="result-card__actions">
                {type === 'torrent' && (
                    <>
                        <button
                            className="result-card__action-btn result-card__action-btn--magnet"
                            onClick={handleOpenMagnet}
                            title="Abrir Magnet Link"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 14a6 6 0 0 1 6-6h4a6 6 0 0 1 0 12h-1" />
                                <path d="M20 10a6 6 0 0 1-6 6H10a6 6 0 0 1 0-12h1" />
                            </svg>
                            <span>Magnet</span>
                        </button>
                        <button
                            className="result-card__action-btn result-card__action-btn--copy"
                            onClick={handleCopyMagnet}
                            title="Copiar Magnet"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>Copiar</span>
                        </button>
                        {apiKey && (
                            <>
                                <button
                                    className={`result-card__action-btn result-card__action-btn--check ${checkedNoCache ? 'result-card__action-btn--no-cache' : ''}`}
                                    onClick={handleCheckCache}
                                    disabled={checking}
                                    title="Verificar Cache no Real-Debrid"
                                >
                                    {checking ? (
                                        <span className="result-card__spinner" />
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8" />
                                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                {checkedNoCache ? (
                                                    <path d="M14 8l-6 6M8 8l6 6" />
                                                ) : (
                                                    <line x1="8" y1="11" x2="14" y2="11" />
                                                )}
                                            </svg>
                                            <span>{checkedNoCache ? 'Sem Cache' : 'Verificar Cache'}</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    className={`result-card__action-btn result-card__action-btn--rd`}
                                    onClick={directDownloadUrl ? () => window.open(directDownloadUrl, '_blank') : handleSmartClick}
                                    disabled={adding}
                                    title={directDownloadUrl ? "Baixar Direto" : "Adicionar / Baixar no Real-Debrid"}
                                >
                                    {adding ? (
                                        <span className="result-card__spinner" />
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                {directDownloadUrl ? (
                                                    <>
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </>
                                                )}
                                            </svg>
                                            <span>{directDownloadUrl ? 'Download Direto' : 'Real-Debrid'}</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    className="result-card__action-btn result-card__action-btn--platform"
                                    onClick={() => window.open('https://real-debrid.com/torrents', '_blank')}
                                    title="Ir para o Real-Debrid"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                    <span>Ver no RD</span>
                                </button>
                            </>
                        )}
                    </>
                )}

                {type === 'cached' && apiKey && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="result-card__action-btn result-card__action-btn--download-direct"
                            onClick={() => {
                                setAdding(true);
                                handleSmartClick().finally(() => setAdding(false));
                            }}
                            disabled={adding}
                            title="Baixar de forma direta via Real-Debrid"
                        >
                            {adding ? (
                                <span className="result-card__spinner" />
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>Download Direto</span>
                                </>
                            )}
                        </button>
                        <button
                            className="result-card__action-btn result-card__action-btn--external"
                            onClick={() => window.open('https://real-debrid.com/torrents', '_blank')}
                            title="Abrir página de torrents do Real-Debrid"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            <span>Ver no RD</span>
                        </button>
                    </div>
                )}
            </div>

            {expandedFiles && expandedFiles.length > 0 && (
                <div className="result-card__files animate-fade-in">
                    <div className="result-card__files-header">
                        <h4>Arquivos Disponíveis ({expandedFiles.length})</h4>
                        <button
                            className="result-card__btn-download-all"
                            onClick={() => {
                                expandedFiles.forEach((file, index) => {
                                    setTimeout(() => {
                                        window.open(file.downloadUrl, '_blank');
                                    }, index * 200);
                                });
                                onToast?.('Iniciando múltiplos downloads (Permita os pop-ups!)', 'success');
                            }}
                        >
                            Baixar Todos (ZIP indisponível)
                        </button>
                    </div>
                    <ul className="result-card__files-list">
                        {expandedFiles.map(file => (
                            <li key={file.id} className="result-card__file-item">
                                <span className="result-card__file-name" title={file.filename}>
                                    {file.filename}
                                </span>
                                <div className="result-card__file-right">
                                    <span className="result-card__file-size">
                                        {formatSize(file.filesize)}
                                    </span>
                                    <button
                                        className="result-card__file-download"
                                        onClick={() => window.open(file.downloadUrl, '_blank')}
                                        title="Baixar arquivo individual"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
