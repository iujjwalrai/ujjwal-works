import { useState, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'light' || current === 'dark') return current;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a0b' : '#fafaf8');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // storage unavailable (private mode etc.) — theme still applies for this visit
    }
  }, [theme]);

  // `origin` is the viewport point the new theme ripples out from.
  const toggle = (origin?: { x: number; y: number }) => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!('startViewTransition' in document) || reduceMotion) {
      setTheme(next);
      return;
    }

    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? 0;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement;

    root.classList.add('theme-switching');
    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
    transition.finished.finally(() => root.classList.remove('theme-switching'));
  };

  return { theme, toggle };
}
