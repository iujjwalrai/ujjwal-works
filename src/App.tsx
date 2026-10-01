import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import CommandPalette, { type Command } from './components/CommandPalette';
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const commands: Command[] = [
    ...SECTIONS.map((s) => ({ id: `go-${s.id}`, group: 'Go to', label: s.label, run: () => goToSection(s.id) })),
    { id: 'go-home', group: 'Go to', label: 'Home', keywords: 'top start', run: () => { navigate('/'); window.scrollTo({ top: 0 }); } },
    { id: 'go-blog', group: 'Go to', label: 'Blog', keywords: 'writing posts', run: () => navigate('/blog') },
    { id: 'go-contact-page', group: 'Go to', label: 'Send a message', keywords: 'contact form message hire', run: () => navigate('/contact') },
    ...getBlogPosts().map((p) => ({
      id: `post-${p.id}`,
      group: 'Read',
      label: p.title,
      keywords: p.tags.join(' '),
      run: () => navigate(`/blog/${p.id}`),
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
      run: () =>
        navigator.clipboard.writeText(EMAIL).then(
          () => notify('Email copied to clipboard'),
          () => (window.location.href = `mailto:${EMAIL}`),
        ),
    },
    { id: 'github', group: 'Links', label: 'GitHub', hint: '↗', run: () => open(GITHUB) },
    { id: 'linkedin', group: 'Links', label: 'LinkedIn', hint: '↗', run: () => open(LINKEDIN) },
    { id: 'source', group: 'Links', label: 'View this site’s source', hint: '↗', keywords: 'code repo', run: () => open(SOURCE) },
  ];

  return (
    <>
      <Cursor />
      <Nav theme={theme} toggleTheme={toggle} onOpenPalette={() => setPaletteOpen(true)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
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
