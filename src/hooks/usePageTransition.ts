import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type CurtainPhase = 'idle' | 'in' | 'out';

// All curtain timing lives here; RouteCurtain hands these to the CSS as custom properties.
// Total ≈ SWEEP_MS (in) + HOLD_MS + SWEEP_MS (out) ≈ 2.5s.
const BARS = 4;
const BAR_MS = 640; // one bar crossing the screen
const STAGGER_MS = 80; // delay between consecutive bars
const SWEEP_MS = BAR_MS + (BARS - 1) * STAGGER_MS;
const HOLD_MS = 700; // fully covered, command on screen

// The shell command "typed" while the screen is covered.
function commandFor(path: string) {
  if (path === '/') return 'cd ~';
  if (path.startsWith('/blog/')) return `cat blog/${path.slice('/blog/'.length)}.md`;
  return `cd ${path.slice(1)}`;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Covers the screen with ink bars, swaps the route underneath, then pulls the bars away.
// Internal <a> clicks anywhere on the page are routed through this automatically.
export function usePageTransition() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<CurtainPhase>('idle');
  const [command, setCommand] = useState('');
  const busy = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const go = useCallback(
    (to: string) => {
      const path = new URL(to, window.location.origin).pathname;
      if (path === window.location.pathname || busy.current) return;
      if (reducedMotion()) {
        navigate(to);
        return;
      }

      busy.current = true;
      setCommand(commandFor(path));
      setPhase('in');
      timers.current = [
        window.setTimeout(() => {
          navigate(to);
          setPhase('out');
        }, SWEEP_MS + HOLD_MS),
        window.setTimeout(() => {
          setPhase('idle');
          busy.current = false;
        }, SWEEP_MS * 2 + HOLD_MS),
      ];
    },
    [navigate],
  );

  // Capture phase runs before React Router's <Link> handler; once we preventDefault,
  // the Link skips its own navigation and we drive it instead.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest('a') : null;
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      // External links, and in-page anchors like #klystr, behave normally.
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      go(url.pathname + url.search + url.hash);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [go]);

  return { go, phase, command, timing: { bars: BARS, barMs: BAR_MS, staggerMs: STAGGER_MS } };
}
