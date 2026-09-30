import { useEffect, useState, type MouseEvent } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import EducationGraph from '../components/EducationGraph';
import Section from '../components/Section';

const EMAIL = 'iujjwalrai2005@gmail.com';
const GITHUB = 'https://github.com/iujjwalrai';
const LINKEDIN = 'https://linkedin.com/in/ujjwal-rai-1299b0292';

const projects = [
  {
    name: 'CodeLeet',
    kind: 'Online judge & DSA practice platform',
    description:
      'Docker-sandboxed code execution with enforced CPU and memory limits, Redis + BullMQ for async job processing, and results streamed back over WebSockets.',
    stats: [
      { value: '1,000+', label: 'concurrent submissions' },
      { value: '60%', label: 'lower perceived latency' },
    ],
    stack: ['React', 'Node.js', 'Docker', 'Redis', 'BullMQ', 'WebSockets', 'MongoDB'],
  },
  {
    name: 'ASCT',
    kind: 'Advocates Self Care Team — donation platform',
    description:
      'Full-stack donation platform with Razorpay payments, a Gemini-powered chatbot, real-time chat over Socket.io, and donation verification and grievance workflows.',
    stats: [
      { value: '100+', label: 'advocates served' },
    ],
    stack: ['React', 'Node.js', 'MongoDB', 'Socket.io', 'Razorpay', 'Cloudinary'],
  },
];

const stack = [
  { key: 'languages', items: ['Java', 'JavaScript', 'Python', 'C', 'SQL'] },
  { key: 'frameworks', items: ['React', 'Node.js', 'Express', 'Django'] },
  { key: 'databases', items: ['MongoDB', 'PostgreSQL', 'Redis'] },
  { key: 'tooling', items: ['Docker', 'Git', 'AWS', 'Linux', 'WebSockets', 'REST APIs'] },
];

const highlights = [
  { value: '2nd', title: 'DevQuest Hackathon, IIT Jodhpur', note: 'AI-powered Ayurvedic remedy app with OpenAI image analysis.' },
  { value: 'Top 10', title: 'Execute Hackathon, DTU', note: 'Out of 300+ competing teams.' },
  { value: '800+', title: 'DSA problems solved', note: 'Across LeetCode, CodeChef and Codeforces.' },
  { value: '1802', title: 'Peak LeetCode rating', note: 'CodeChef 1619 · Codeforces 1213.' },
  { value: 'Top 2%', title: 'JEE Main', note: 'Percentile, nationwide.' },
];

const Arrow = () => (
  <svg className="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 11 11 5M6 5h5v5" />
  </svg>
);

function LocalTime() {
  const format = () =>
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const [time, setTime] = useState(format);
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 15_000);
    return () => clearInterval(id);
  }, []);
  return <>{time} IST</>;
}

function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };
  return (
    <button type="button" className="copy-email" onClick={copy}>
      <span className="copy-email__addr">{EMAIL}</span>
      <span className="copy-email__action">{copied ? 'Copied ✓' : 'Copy'}</span>
    </button>
  );
}

// Feeds the cursor position to CSS so the card's glow follows the mouse.
const spotlight = (e: MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

export default function Home() {
  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef}>
      {/* Hero */}
      <section className="hero">
        <div className="wrap hero__grid">
          <div className="hero__content">
            <h1 className="hero__name">
              Ujjwal <em>Rai</em>
            </h1>
            <p className="hero__lede">
              Software engineer who enjoys the unglamorous parts — queues, databases, and the
              plumbing that keeps production quiet at 2am. Currently building backend features
              with Django, Python and AWS.
            </p>
            <div className="hero__actions">
              <a href={`mailto:${EMAIL}`} className="btn btn--solid">
                Get in touch
              </a>
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                GitHub <Arrow />
              </a>
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                LinkedIn <Arrow />
              </a>
            </div>
          </div>

          <figure className="hero__card">
            <img src="/ujjwal.jpg" alt="Ujjwal Rai" className="hero__photo" />
            <dl className="hero__facts">
              <div>
                <dt>Based in</dt>
                <dd>India · remote</dd>
              </div>
              <div>
                <dt>Local time</dt>
                <dd><LocalTime /></dd>
              </div>
              <div>
                <dt>Building</dt>
                <dd><a href="#klystr" className="hero__building">Klystr</a></dd>
              </div>
              <div>
                <dt>Studying</dt>
                <dd>CSE @ IIIT Kota ’27</dd>
              </div>
            </dl>
          </figure>
        </div>
      </section>

      <Section id="experience" index="01" kicker="Experience" title={<>Shipping <em>to prod</em></>}>
        <article className="xp">
          <div className="xp__top">
            <h3 className="xp__role">
              SWE Intern <span className="xp__at">@</span> <span className="xp__company">FischerJordan</span>
            </h3>
            <span className="xp__period">Aug 2026 — Now</span>
          </div>
          <p className="xp__where">Remote · New York, USA</p>
          <ul className="xp__points">
            <li>Building backend features with Django, Python and PostgreSQL — APIs, database models and production application workflows.</li>
            <li>Working on AWS RDS and S3 migration workflows, and tightened production monitoring with Sentry and Better Stack for incident alerting.</li>
          </ul>
          <p className="xp__stack">Django · Python · PostgreSQL · AWS · Sentry</p>
        </article>
      </Section>

      <Section id="education" index="02" kicker="Education" title={<>Commit <em>history</em></>}>
        <EducationGraph />
      </Section>

      <Section id="projects" index="03" kicker="Projects" title={<>Side quests <em>that shipped</em></>}>
        <div className="projects">
          <article id="klystr" className="project project--wip" onMouseMove={spotlight}>
            <div className="project__head">
              <span className="project__index">P.00</span>
              <h3 className="project__name">
                Klystr
                <span className="wip">
                  <span className="wip__dot" />
                  In progress
                </span>
              </h3>
              <p className="project__kind">A miniature Kubernetes</p>
            </div>
            <p className="project__desc">
              A container orchestrator built from the ground up — Kubernetes, but small enough to
              fit in your head.
            </p>
          </article>
          {projects.map((p, i) => (
            <article key={p.name} className="project" onMouseMove={spotlight}>
              <div className="project__head">
                <span className="project__index">P.{String(i + 1).padStart(2, '0')}</span>
                <h3 className="project__name">{p.name}</h3>
                <p className="project__kind">{p.kind}</p>
              </div>
              <p className="project__desc">{p.description}</p>
              <dl className="project__stats">
                {p.stats.map((s) => (
                  <div key={s.label}>
                    <dt>{s.value}</dt>
                    <dd>{s.label}</dd>
                  </div>
                ))}
              </dl>
              <p className="project__stack">{p.stack.join(' / ')}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="stack" index="04" kicker="Skills" title={<>Stack <em>trace</em></>}>
        <dl className="stack">
          {stack.map((row) => (
            <div key={row.key} className="stack__row">
              <dt>{row.key}</dt>
              <dd>
                {row.items.map((item) => (
                  <span key={item} className="stack__item">{item}</span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="highlights" index="05" kicker="Highlights" title={<>Achievements <em>unlocked</em></>}>
        <div className="stats">
          {highlights.map((h) => (
            <div key={h.title} className="stat">
              <p className="stat__value">{h.value}</p>
              <p className="stat__title">{h.title}</p>
              <p className="stat__note">{h.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact" index="06" kicker="Contact" title={<>Say <em>hello</em></>}>
        <div className="contact">
          <p className="contact__lede">
            Got a backend that needs building, a bug that needs hunting, or just want to talk
            systems? My inbox is open.
          </p>
          <CopyEmail />
          <div className="contact__links">
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub <Arrow /></a>
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">LinkedIn <Arrow /></a>
          </div>
        </div>
      </Section>
    </div>
  );
}
