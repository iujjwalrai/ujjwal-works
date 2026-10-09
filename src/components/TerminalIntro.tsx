import { useEffect, useState } from 'react';
import { NOW, WHOAMI } from '../data/profile';

type Step = { kind: 'cmd' | 'out'; text: string };

const STEPS: Step[] = [
  { kind: 'cmd', text: 'whoami' },
  { kind: 'out', text: WHOAMI },
  { kind: 'cmd', text: 'cat now.txt' },
  { kind: 'out', text: NOW },
];

const KEYWORDS = /(queues|databases|2am|Django|Python|AWS)/;
const TOTAL = STEPS.reduce((n, s) => n + s.text.length, 0);
// Character offset at which each step begins.
const STARTS = STEPS.map((_, i) => STEPS.slice(0, i).reduce((n, s) => n + s.text.length, 0));
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Per-character delay: commands are "typed", output streams in faster.
const delayFor = (kind: Step['kind']) => (kind === 'cmd' ? 70 : 14);
const PAUSE = 380;

// Splits `text` into keyword / plain tokens, showing only the first `shown` characters.
// The untyped remainder still renders (invisibly) so the block never changes size,
// and the cursor sits right at the typing point.
function Typed({ text, shown, cursor }: { text: string; shown: number; cursor: boolean }) {
  const tokens = text.split(KEYWORDS);
  const offsets = tokens.map((_, i) => tokens.slice(0, i).join('').length);
  // The cursor goes in the first token that isn't fully typed (or the last one, once done).
  const cursorAt = cursor ? Math.max(0, tokens.findIndex((t, i) => shown < offsets[i] + t.length)) : -1;
  const cursorToken = cursor && shown >= text.length ? tokens.length - 1 : cursorAt;
  return (
    <>
      {tokens.map((token, i) => {
        const visible = Math.max(0, Math.min(token.length, shown - offsets[i]));
        const isKeyword = i % 2 === 1;
        return (
          <span key={i} className={isKeyword ? 'term__kw' : undefined}>
            {token.slice(0, visible)}
            {i === cursorToken && <span className="term__cursor" />}
            {visible < token.length && <span className="term__ghost">{token.slice(visible)}</span>}
          </span>
        );
      })}
    </>
  );
}

type WindowState = 'open' | 'min' | 'closing' | 'closed';

export default function TerminalIntro() {
  const [typed, setTyped] = useState(() => (reducedMotion() ? TOTAL : 0));
  const [run, setRun] = useState(0);
  const [win, setWin] = useState<WindowState>('open');

  useEffect(() => {
    if (reducedMotion()) return;
    let count = 0;
    let timer = 0;
    const tick = () => {
      count++;
      setTyped(count);
      if (count >= TOTAL) return;
      // Pause at step boundaries; otherwise use the current step's typing speed.
      const step = STARTS.findLastIndex((start) => start <= count);
      timer = window.setTimeout(tick, count === STARTS[step] ? PAUSE : delayFor(STEPS[step].kind));
    };
    timer = window.setTimeout(tick, run === 0 ? 600 : 250);
    return () => clearTimeout(timer);
  }, [run]);

  useEffect(() => {
    if (win !== 'closing') return;
    const timer = window.setTimeout(() => setWin('closed'), reducedMotion() ? 0 : 320);
    return () => clearTimeout(timer);
  }, [win]);

  const replay = () => {
    setTyped(reducedMotion() ? TOTAL : 0);
    setRun((r) => r + 1);
  };

  const reopen = () => {
    setWin('open');
    replay();
  };

  const done = typed >= TOTAL;
  const intro = STEPS.filter((s) => s.kind === 'out').map((s) => s.text).join(' ');

  if (win === 'closed') {
    return (
      <div className="term-dock-wrap">
        <p className="sr-only">{intro}</p>
        <button type="button" className="term-dock" onClick={reopen}>
          <span className="term-dock__icon" aria-hidden="true">&gt;_</span>
          Reopen terminal
        </button>
      </div>
    );
  }

  return (
    <div className={`term${win === 'min' ? ' term--min' : ''}${win === 'closing' ? ' term--closing' : ''}`}>
      <p className="sr-only">{intro}</p>
      <div className="term__bar">
        <div className="term__lights">
          <button type="button" className="term__light term__light--close" aria-label="Close terminal" title="Close" onClick={() => setWin('closing')}>
            <svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" /></svg>
          </button>
          <button type="button" className="term__light term__light--min" aria-label={win === 'min' ? 'Restore terminal' : 'Minimize terminal'} title={win === 'min' ? 'Restore' : 'Minimize'} onClick={() => setWin(win === 'min' ? 'open' : 'min')}>
            <svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.2 4h5.6" /></svg>
          </button>
          <button type="button" className="term__light term__light--zoom" aria-label="Replay intro" title="Replay" onClick={() => { setWin('open'); replay(); }}>
            <svg viewBox="0 0 8 8" aria-hidden="true"><path d="M4 1.2v5.6M1.2 4h5.6" /></svg>
          </button>
        </div>
        <em aria-hidden="true" onClick={() => win === 'min' && setWin('open')}>~/ujjwal — zsh</em>
      </div>
      <div className="term__collapse">
        <div>
        <div className="term__body" aria-hidden="true">
          {STEPS.map((step, i) => {
            const start = STARTS[i];
            const shown = Math.max(0, Math.min(step.text.length, typed - start));
            const active = !done && typed >= start && typed < start + step.text.length;
            // The cursor sits on the line being typed, and rests on the last one when done.
            const cursorHere = active || (done && i === STEPS.length - 1);
            const pending = typed < start;
            return (
              <p key={i} className={`term__line term__line--${step.kind}${pending ? ' term__ghost' : ''}`}>
                <span className="term__prompt">{step.kind === 'cmd' ? '~ $' : '>'}</span>
                <span className="term__text">
                  <Typed text={step.text} shown={shown} cursor={cursorHere} />
                </span>
              </p>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
