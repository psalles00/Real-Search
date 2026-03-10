import './Loader.css';

export default function Loader() {
    return (
        <div className="loader">
            <div className="loader__cards">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="loader__card" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="loader__line loader__line--title" />
                        <div className="loader__line loader__line--meta" />
                        <div className="loader__line loader__line--short" />
                    </div>
                ))}
            </div>
            <p className="loader__text">Buscando torrents...</p>
        </div>
    );
}
