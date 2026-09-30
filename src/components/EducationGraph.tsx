import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { education, type Milestone } from '../data/education';

const LANE_X = [12, 36];
const NODE_OFFSET = 11; // node centre, measured from the top of its row (aligns with the hash line)
const STEP_MS = 420; // time to draw one commit's worth of graph

// Stable fake commit hash per milestone (FNV-1a).
function shortHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

function refKind(ref: string) {
  if (ref.startsWith('HEAD')) return 'head';
  if (ref.startsWith('tag:') || ref === 'root') return 'tag';
  return 'branch';
}

const laneOf = (m: Milestone) => (m.branch ? 1 : 0);

interface Segment {
  d: string;
  lane: number;
  dashed: boolean;
  delay: number;
  duration: number;
}

// Rows are newest-first; history is drawn bottom-up, so step 0 is the oldest commit.
function buildSegments(ys: number[]): Segment[] {
  const n = education.length;
  const step = (i: number) => n - 1 - i;
  const segments: Segment[] = [];

  // main lane: connect each main commit to the next main commit above it
  const main = education.map((m, i) => (laneOf(m) === 0 ? i : -1)).filter((i) => i >= 0);
  for (let k = 0; k < main.length - 1; k++) {
    const above = main[k];
    const below = main[k + 1];
    const x = LANE_X[0];
    segments.push({
      d: `M ${x} ${ys[below]} L ${x} ${ys[above]}`,
      lane: 0,
      dashed: Boolean(education[above].upcoming),
      delay: step(below) * STEP_MS,
      duration: (step(above) - step(below)) * STEP_MS,
    });
  }

  // side branches: fork from the main commit just below each run of branch commits
  for (let i = 0; i < n; i++) {
    if (laneOf(education[i]) !== 1 || (i > 0 && laneOf(education[i - 1]) === 1)) continue;
    let bottom = i;
    while (bottom + 1 < n && laneOf(education[bottom + 1]) === 1) bottom++;
    const fork = main.find((m) => m > bottom);
    const [x0, x1] = LANE_X;
    const top = ys[i];

    let d: string;
    let from: number;
    if (fork === undefined) {
      d = `M ${x1} ${ys[bottom]} L ${x1} ${top}`;
      from = bottom;
    } else {
      const yf = ys[fork];
      const bend = Math.max(yf - 40, top);
      d = `M ${x0} ${yf} C ${x0} ${yf - 22}, ${x1} ${yf - 18}, ${x1} ${bend} L ${x1} ${top}`;
      from = fork;
    }
    segments.push({
      d,
      lane: 1,
      dashed: false,
      delay: step(from) * STEP_MS,
      duration: (step(i) - step(from)) * STEP_MS,
    });
  }

  return segments;
}

export default function EducationGraph() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [geo, setGeo] = useState<{ height: number; ys: number[] } | null>(null);
  const [drawn, setDrawn] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  // Measure where each row's node sits; re-measure whenever text reflows.
  useEffect(() => {
    const wrap = wrapRef.current;
    const list = listRef.current;
    if (!wrap || !list) return;
    const observer = new ResizeObserver(() => {
      const rows = Array.from(list.children) as HTMLElement[];
      setGeo({ height: wrap.offsetHeight, ys: rows.map((r) => r.offsetTop + NODE_OFFSET) });
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  // Start drawing once the graph scrolls into view.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const n = education.length;
  const segments = geo ? buildSegments(geo.ys) : [];

  return (
    <div className="git-graph__shell">
      <div className="git-graph__cmd">
        <span className="git-graph__prompt">~/education $</span> git log --graph --decorate
        <span className="git-graph__caret" />
      </div>

      <div ref={wrapRef} className={`git-graph ${drawn ? 'is-drawn' : ''}`}>
        {geo && (
          <svg className="git-graph__svg" width={LANE_X[1] + 12} height={geo.height} aria-hidden="true">
            {segments.map((s, i) => {
              const style = { '--delay': `${s.delay}ms`, '--dur': `${s.duration}ms` } as CSSProperties;
              const cls = `git-graph__line git-graph__line--lane${s.lane}`;
              if (!s.dashed) {
                return <path key={i} d={s.d} pathLength={1} className={`${cls} git-graph__draw`} style={style} />;
              }
              // Dashed lines can't use the dash-offset trick themselves, so draw a mask instead.
              const maskId = `git-graph-mask-${i}`;
              return (
                <g key={i}>
                  <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height={geo.height}>
                    <path d={s.d} pathLength={1} className="git-graph__draw git-graph__mask-path" style={style} />
                  </mask>
                  <path d={s.d} className={`${cls} git-graph__line--dashed`} mask={`url(#${maskId})`} />
                </g>
              );
            })}

            {education.map((m, i) => {
              const cx = LANE_X[laneOf(m)];
              const cy = geo.ys[i];
              const style = { '--delay': `${(n - 1 - i) * STEP_MS}ms` } as CSSProperties;
              const cls = [
                'git-graph__node',
                `git-graph__node--lane${laneOf(m)}`,
                m.upcoming ? 'git-graph__node--upcoming' : '',
                active === i ? 'is-active' : '',
              ].join(' ');
              return (
                <g key={i} className={cls} style={style}>
                  {m.upcoming && <circle className="git-graph__pulse" cx={cx} cy={cy} r={6} />}
                  <circle className="git-graph__dot" cx={cx} cy={cy} r={m.upcoming ? 5 : 6} />
                </g>
              );
            })}
          </svg>
        )}

        <ol ref={listRef} className="git-graph__list">
          {education.map((m, i) => (
            <li
              key={m.title}
              className={`git-row ${active === i ? 'is-active' : ''}`}
              style={{ '--delay': `${(n - 1 - i) * STEP_MS}ms` } as CSSProperties}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <div className="git-row__line">
                <span className="git-row__hash">{shortHash(m.title + m.period)}</span>
                {m.refs?.map((ref) => (
                  <span key={ref} className={`git-ref git-ref--${refKind(ref)}`}>
                    {ref}
                  </span>
                ))}
              </div>
              <h3 className="git-row__title">{m.title}</h3>
              <p className="git-row__meta">
                {m.place} <span className="git-row__sep">·</span>{' '}
                <span className="git-row__period">{m.period}</span>
              </p>
              {m.detail && <p className="git-row__detail">{m.detail}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
