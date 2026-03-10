import ResultCard from './ResultCard';
import './ResultsSection.css';

export default function ResultsSection({ cachedResults, torrentResults, apiKey, onSmartRD, onManualCheck, onToast, sortBy, onSortChange }) {
    const totalResults = cachedResults.length + torrentResults.length;

    if (totalResults === 0) return null;

    return (
        <div className="results-section animate-fade-in-up">
            <div className="results-section__header">
                <div className="results-section__summary">
                    <span>{totalResults} resultado(s) encontrado(s)</span>
                </div>
                <div className="results-section__sort">
                    <label htmlFor="sort-select">Ordenar por:</label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="results-section__sort-select glass"
                    >
                        <option value="seeds">Seeders</option>
                        <option value="peers">Peers</option>
                        <option value="size">Tamanho</option>
                        <option value="date">Data</option>
                    </select>
                </div>
            </div>

            {cachedResults.length > 0 && (
                <div className="results-group">
                    <div className="results-group__header results-group__header--cached">
                        <div className="results-group__icon results-group__icon--cached">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2>Real-Debrid</h2>
                        <span className="results-group__count">{cachedResults.length}</span>
                    </div>
                    <div className="results-group__list">
                        {cachedResults.map((result, i) => (
                            <ResultCard
                                key={`cached-${result.hash || i}`}
                                result={result}
                                type="cached"
                                apiKey={apiKey}
                                onSmartRD={onSmartRD}
                                onManualCheck={onManualCheck}
                                onToast={onToast}
                            />
                        ))}
                    </div>
                </div>
            )}

            {torrentResults.length > 0 && (
                <div className="results-group">
                    <div className="results-group__header results-group__header--torrent">
                        <div className="results-group__icon results-group__icon--torrent">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <h2>Torrents</h2>
                        <span className="results-group__count">{torrentResults.length}</span>
                    </div>
                    <div className="results-group__list">
                        {torrentResults.map((result, i) => (
                            <ResultCard
                                key={`torrent-${result.hash || i}`}
                                result={result}
                                type="torrent"
                                apiKey={apiKey}
                                onSmartRD={onSmartRD}
                                onManualCheck={onManualCheck}
                                onToast={onToast}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
