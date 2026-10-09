import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import CommandPalette, { type Command } from './components/CommandPalette';
import RouteCurtain from './components/RouteCurtain';
import Console from './components/Console';
import { usePageTransition } from './hooks/usePageTransition';
import { cwdFor } from './lib/shell';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import { getBlogPosts } from './data/blog';
import { EMAIL, GITHUB, LINKEDIN, SECTIONS, SOURCE } from './data/site';

function Shell() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { go, phase, command, timing } = usePageTransition();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      // Backtick drops the terminal down (the console input handles closing it itself).
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (e.key === '`' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setConsoleOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // New page starts at the top (before paint, so the enter animation isn't mid-scroll).
  // Skipped on first load so a refresh keeps the browser's restored position.
  const firstRoute = useRef(true);
  useLayoutEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const notify = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  };

  const goToSection = (id: string) => {
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (location.pathname === '/') {
      scroll();
    } else {
      navigate('/');
      setTimeout(scroll, 60);
    }
  };

  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  const copyEmail = () =>
    navigator.clipboard.writeText(EMAIL).then(
      () => notify('Email copied to clipboard'),
      () => (window.location.href = `mailto:${EMAIL}`),
    );

  const commands: Command[] = [
    ...SECTIONS.map((s) => ({ id: `go-${s.id}`, group: 'Go to', label: s.label, run: () => goToSection(s.id) })),
    { id: 'go-home', group: 'Go to', label: 'Home', keywords: 'top start', run: () => (location.pathname === '/' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : go('/')) },
    { id: 'go-blog', group: 'Go to', label: 'Blog', keywords: 'writing posts', run: () => go('/blog') },
    { id: 'go-contact-page', group: 'Go to', label: 'Send a message', keywords: 'contact form message hire', run: () => go('/contact') },
    ...getBlogPosts().map((p) => ({
      id: `post-${p.id}`,
      group: 'Read',
      label: p.title,
      keywords: p.tags.join(' '),
      run: () => go(`/blog/${p.id}`),
    })),
    {
      id: 'theme',
      group: 'Actions',
      label: `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`,
      hint: 'T',
      keywords: 'theme dark light',
      run: () => toggle({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
    },
    {
      id: 'copy-email',
      group: 'Actions',
      label: 'Copy email address',
      keywords: 'contact mail',
      run: copyEmail,
    },
    { id: 'terminal', group: 'Actions', label: 'Open terminal', hint: '`', keywords: 'shell console command line cli', run: () => setConsoleOpen(true) },
    { id: 'github', group: 'Links', label: 'GitHub', hint: '↗', run: () => open(GITHUB) },
    { id: 'linkedin', group: 'Links', label: 'LinkedIn', hint: '↗', run: () => open(LINKEDIN) },
    { id: 'source', group: 'Links', label: 'View this site’s source', hint: '↗', keywords: 'code repo', run: () => open(SOURCE) },
  ];

  return (
    <>
      <Cursor />
      <Nav theme={theme} toggleTheme={toggle} onOpenPalette={() => setPaletteOpen(true)} onOpenTerminal={() => setConsoleOpen(true)} />
      <main>
        {/* Keyed on the path so every navigation remounts and replays the enter animation. */}
        <div key={location.pathname} className="route-enter">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
      </main>
      <Footer />
      <RouteCurtain phase={phase} command={command} timing={timing} />
      <Console
        open={consoleOpen}
        cwd={cwdFor(location.pathname)}
        onClose={() => setConsoleOpen(false)}
        actions={{
          go,
          section: goToSection,
          theme,
          toggleTheme: () => toggle({ x: window.innerWidth / 2, y: 0 }),
          copyEmail: () => void copyEmail(),
        }}
      />
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      <div className={`toast ${toast ? 'is-visible' : ''}`} role="status">
        {toast}
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
