import { useState, type MouseEvent } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import EducationGraph from '../components/EducationGraph';
import Section from '../components/Section';
import CountUp from '../components/CountUp';
import KlystrSim from '../components/KlystrSim';
import TerminalIntro from '../components/TerminalIntro';
import LiveClock from '../components/LiveClock';
import { EMAIL, GITHUB, LINKEDIN } from '../data/site';
import { KLYSTR, highlights, projects, stack } from '../data/profile';

const Arrow = () => (
  <svg className="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 11 11 5M6 5h5v5" />
  </svg>
);

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

// 3D tilt + glare for the photo card, driven by CSS variables.
const tilt = (e: MouseEvent<HTMLElement>) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty('--ry', `${x * 14}deg`);
  el.style.setProperty('--rx', `${-y * 12}deg`);
  el.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
  el.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
};

const untilt = (e: MouseEvent<HTMLElement>) => {
  for (const prop of ['--rx', '--ry', '--gx', '--gy']) e.currentTarget.style.removeProperty(prop);
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
            <TerminalIntro />
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

          <figure className="hero__card" onMouseMove={tilt} onMouseLeave={untilt}>
            <LiveClock />
            <img src="/ujjwal.jpg" alt="Ujjwal Rai" className="hero__photo" />
            <dl className="hero__facts">
              <div>
                <dt>Based in</dt>
                <dd>India · remote</dd>
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
                {KLYSTR.name}
                <span className="wip">
                  <span className="wip__dot" />
                  In progress
                </span>
              </h3>
              <p className="project__kind">{KLYSTR.kind}</p>
            </div>
            <p className="project__desc">{KLYSTR.description}</p>
            <KlystrSim />
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
                    <dt><CountUp value={s.value} /></dt>
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
              <p className="stat__value"><CountUp value={h.value} /></p>
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
