import { useState, useRef, useEffect } from 'react';
import './SearchBar.css';

export default function SearchBar({ onSearch, isLoading }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !isLoading) {
            let processedQuery = query.trim();

            // 4k -> 2160p
            processedQuery = processedQuery.replace(/\b4k\b/gi, '2160p');

            // Temporada X -> S?? (e.g., Temporada 2 -> S02)
            processedQuery = processedQuery.replace(/\btemporada\s+(\d+)\b/gi, (match, p1) => {
                const seasonNum = p1.padStart(2, '0');
                return `S${seasonNum}`;
            });

            // Pré Instalado -> Pre-Installed
            processedQuery = processedQuery.replace(/\bpré\s+instalado\b/gi, 'Pre-Installed');

            onSearch(processedQuery);
        }
    };

    return (
        <form className="search-bar" onSubmit={handleSubmit}>
            <div className="search-bar__wrapper glass">
                <svg
                    className="search-bar__icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    ref={inputRef}
                    id="search-input"
                    type="text"
                    className="search-bar__input"
                    placeholder="Buscar torrents..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isLoading}
                />
                <button
                    id="search-button"
                    type="submit"
                    className="search-bar__button"
                    disabled={!query.trim() || isLoading}
                >
                    {isLoading ? (
                        <span className="search-bar__spinner" />
                    ) : (
                        'Buscar'
                    )}
                </button>
            </div>
        </form>
    );
}
