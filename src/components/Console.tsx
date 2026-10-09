import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { complete, run, type LineKind, type ShellContext } from '../lib/shell';

interface Line {
  id: number;
  kind: LineKind;
  text: string;
  /** Prompt shown before a 'cmd' line, frozen at the time it ran. */
  prompt?: string;
}

interface ConsoleProps {
  open: boolean;
  cwd: string;
  onClose: () => void;
  /** Everything a command can do to the page; output/clear/history are handled here. */
  actions: Pick<ShellContext, 'go' | 'section' | 'toggleTheme' | 'copyEmail' | 'theme'>;
}

const BANNER: Omit<Line, 'id'>[] = [
  { kind: 'dim', text: 'ujjwal.works — zsh (sort of)' },
  { kind: 'dim', text: 'Type help to see what you can do. Esc or ` closes.' },
];

// A drop-down terminal (think Quake console) that drives the site with shell commands.
// Stays mounted while closed so the scrollback and history survive between opens.
export default function Console({ open, cwd, onClose, actions }: ConsoleProps) {
  const [lines, setLines] = useState<Line[]>(() => BANNER.map((l, i) => ({ ...l, id: i })));
  const [input, setInput] = useState('');
  const history = useRef<string[]>([]);
  const cursor = useRef(-1); // position while walking history; -1 = editing a fresh line
  const serial = useRef(BANNER.length);
  const timers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const prompt = `${cwd} $`;

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const push = (text: string, kind: LineKind = 'out', extra?: Partial<Line>) =>
    setLines((prev) => [...prev, { id: serial.current++, kind, text, ...extra }].slice(-300));

  const execute = (raw: string) => {
    push(raw, 'cmd', { prompt });
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (history.current[history.current.length - 1] !== trimmed) history.current.push(trimmed);
    cursor.current = -1;
    run(trimmed, {
      ...actions,
      cwd,
      print: push,
      clear: () => setLines([]),
      close: onClose,
      history: () => history.current,
      later: (ms, fn) => timers.current.push(window.setTimeout(fn, ms)),
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execute(input);
      setInput('');
    } else if (e.key === 'Escape' || e.key === '`') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const { value, options } = complete(input, cwd);
      if (options.length) {
        push(input, 'cmd', { prompt });
        push(options.join('  '), 'accent');
      }
      setInput(value);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      const next =
        e.key === 'ArrowUp'
          ? cursor.current === -1 ? h.length - 1 : Math.max(0, cursor.current - 1)
          : cursor.current === -1 ? -1 : cursor.current + 1;
      cursor.current = next >= h.length ? -1 : next;
      setInput(cursor.current === -1 ? '' : h[cursor.current]);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setLines([]);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      push(`${input}^C`, 'cmd', { prompt });
      setInput('');
    }
  };

  return (
    <>
      <div className={`console-scrim ${open ? 'is-open' : ''}`} onMouseDown={onClose} aria-hidden="true" />
      <div
        className={`console ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-label="Terminal"
        aria-hidden={!open}
        inert={!open}
        onMouseUp={() => {
          // Click anywhere to type — unless the user was selecting text to copy.
          if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
        }}
      >
        <div className="console__bar">
          <span className="console__title">~/ujjwal — zsh</span>
          <span className="console__keys">
            <kbd>tab</kbd> complete <kbd>↑</kbd> history <kbd>esc</kbd> close
          </span>
        </div>
        <div ref={bodyRef} className="console__body">
          {lines.map((line) => (
            <p key={line.id} className={`console__line console__line--${line.kind}`}>
              {line.kind === 'cmd' && <span className="console__prompt">{line.prompt} </span>}
              {line.text}
            </p>
          ))}
          <label className="console__input">
            <span className="console__prompt">{prompt}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                cursor.current = -1;
              }}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Command"
            />
          </label>
        </div>
      </div>
    </>
  );
}
