import { useEffect, useId, useRef } from 'react';
import type { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: (origin: { x: number; y: number }) => void;
  className?: string;
}

// A sliding switch; the knob carries an icon that morphs sun ↔ moon.
// Also bound to the `T` key.
export default function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  const maskId = useId();
  const knobRef = useRef<HTMLSpanElement>(null);
  const isDark = theme === 'dark';

  const fire = () => {
    const r = knobRef.current?.getBoundingClientRect();
    onToggle(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth, y: 0 });
  };

  // Only the visible switch should react to the shortcut (there's one per breakpoint).
  const fireRef = useRef(fire);
  useEffect(() => {
    fireRef.current = fire;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 't' || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement;
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (!knobRef.current?.offsetParent) return;
      fireRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      title="Toggle theme (T)"
      className={`theme-switch ${isDark ? 'is-dark' : ''} ${className}`}
      onClick={fire}
    >
      <span ref={knobRef} className="theme-switch__knob">
        <svg viewBox="0 0 24 24" className={`theme-icon ${isDark ? 'theme-icon--moon' : 'theme-icon--sun'}`} aria-hidden="true">
          <mask id={maskId}>
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <circle className="theme-icon__cutout" cx="30" cy="-6" r="7" fill="black" />
          </mask>
          <g mask={`url(#${maskId})`}>
            <circle className="theme-icon__core" cx="12" cy="12" r="5" fill="currentColor" />
          </g>
          <g className="theme-icon__rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1.5" x2="12" y2="3.5" />
            <line x1="12" y1="20.5" x2="12" y2="22.5" />
            <line x1="1.5" y1="12" x2="3.5" y2="12" />
            <line x1="20.5" y1="12" x2="22.5" y2="12" />
            <line x1="4.6" y1="4.6" x2="6" y2="6" />
            <line x1="18" y1="18" x2="19.4" y2="19.4" />
            <line x1="4.6" y1="19.4" x2="6" y2="18" />
            <line x1="18" y1="6" x2="19.4" y2="4.6" />
          </g>
        </svg>
      </span>
    </button>
  );
}
