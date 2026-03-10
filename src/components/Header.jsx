import { useAuth, UserButton, SignInButton } from '@clerk/react';
import './Header.css';

export default function Header({ onSettingsClick, hasApiKey }) {
    const { isSignedIn } = useAuth();

    return (
        <header className="header">
            <div className="header__inner container">
                <div className="header__brand">
                    <h1 className="header__logo">
                        <span className="header__logo-real">Real</span>
                        <span className="header__logo-search">Search</span>
                    </h1>
                    <span className="header__tagline">Torrent search + Real-Debrid</span>
                </div>
                <div className="header__actions">
                    {isSignedIn && (
                        <button
                            id="settings-button"
                            className="header__settings-btn"
                            onClick={onSettingsClick}
                            title="Configurações"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            {hasApiKey && <span className="header__settings-dot" />}
                        </button>
                    )}

                    {!isSignedIn && (
                        <SignInButton mode="modal">
                            <button className="header__auth-btn">Entrar</button>
                        </SignInButton>
                    )}

                    {isSignedIn && (
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: 'header__user-avatar'
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
