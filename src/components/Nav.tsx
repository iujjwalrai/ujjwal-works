import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import ScrambleText from './ScrambleText';
import ScrollProgress from './ScrollProgress';
import type { Theme } from '../hooks/useTheme';

interface NavProps {
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  onOpenPalette: () => void;
  onOpenTerminal: () => void;
}

const TerminalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 7 5 5-5 5M12 18h7" />
  </svg>
);

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

export default function Nav({ theme, toggleTheme, onOpenPalette, onOpenTerminal }: NavProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/blog', label: 'Blog' },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__logo" aria-label="Ujjwal Rai — home">
            <ScrambleText text="ujjwal rai" />
            <span className="nav__logo-dot">.</span>
          </Link>
          <div className="nav__links">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav__link ${isActive(link.to) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <button type="button" className="nav__cmdk" onClick={onOpenPalette} aria-label="Open command menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span>Search</span>
              <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>
            <button type="button" className="nav__cmdk nav__term" onClick={onOpenTerminal} title="Open terminal (`)">
              <TerminalIcon />
              <span>Terminal</span>
              <kbd>`</kbd>
            </button>
            <span className="nav__divider" aria-hidden="true" />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <div className="nav__mobile-actions">
            <button type="button" className="nav__cmdk nav__term" onClick={onOpenTerminal}>
              <TerminalIcon />
              <span>Terminal</span>
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              className="nav__hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <ScrollProgress />
      </nav>

      {/* Mobile menu */}
      <div
        className={`nav__mobile-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <div className={`nav__mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <button
          className="nav__mobile-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav__mobile-link ${isActive(link.to) ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          className="nav__mobile-link"
          onClick={() => {
            setMobileOpen(false);
            onOpenPalette();
          }}
        >
          Command menu
        </button>
        <button
          type="button"
          className="nav__mobile-link"
          onClick={() => {
            setMobileOpen(false);
            onOpenTerminal();
          }}
        >
          Terminal
        </button>
      </div>
    </>
  );
}
