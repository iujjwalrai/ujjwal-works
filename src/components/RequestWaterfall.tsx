import { useEffect, useState, type CSSProperties } from 'react';
import type { RequestTrace } from '../lib/requestTrace';

interface RequestWaterfallProps {
  /** performance.now() when the request went out; drives the live timer while pending. */
  startedAt: number;
  /** null while the request is still in flight. */
  trace: RequestTrace | null;
}

const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : n < 1 ? '<1 ms' : `${Math.round(n)} ms`);

// A DevTools-style network waterfall for the contact form's real request.
export default function RequestWaterfall({ startedAt, trace }: RequestWaterfallProps) {
  const [elapsed, setElapsed] = useState(0);

  // Tick a live timer until the response lands.
  useEffect(() => {
    if (trace) return;
    let frame = requestAnimationFrame(function tick() {
      setElapsed(performance.now() - startedAt);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [trace, startedAt]);

  const statusText = (status: number | null) => (status === null ? 'failed' : String(status));

  return (
    <div className={`waterfall ${trace ? (trace.ok ? 'is-ok' : 'is-err') : 'is-pending'}`} aria-live="polite">
      <div className="waterfall__row waterfall__row--head">
        <span>Name</span>
        <span>Status</span>
        <span>Time</span>
        <span>Waterfall</span>
      </div>

      {trace ? (
        trace.phases.map((p, i) => {
          const empty = p.end - p.start <= 0;
          const bar = {
            '--left': `${(p.start / trace.total) * 100}%`,
            '--width': `${((p.end - p.start) / trace.total) * 100}%`,
            '--delay': `${i * 120}ms`,
          } as CSSProperties;
          const isRequest = p.label.startsWith('POST');
          return (
            <div key={p.label} className="waterfall__row">
              <span className="waterfall__name">{p.label}</span>
              <span className={isRequest && !trace.ok ? 'waterfall__bad' : undefined}>
                {isRequest ? statusText(trace.status) : p.note ?? '✓'}
              </span>
              <span>{empty ? '—' : ms(p.end - p.start)}</span>
              <span className="waterfall__track">
                {!empty && <span className={`waterfall__bar waterfall__bar--${i}`} style={bar} />}
              </span>
            </div>
          );
        })
      ) : (
        <div className="waterfall__row">
          <span className="waterfall__name">POST /inbox</span>
          <span className="waterfall__pending">pending</span>
          <span>{ms(elapsed)}</span>
          <span className="waterfall__track">
            <span className="waterfall__bar waterfall__bar--live" />
          </span>
        </div>
      )}

      <p className="waterfall__total">
        {trace ? (
          <>
            <span className={trace.ok ? 'waterfall__good' : 'waterfall__bad'}>
              {trace.status === null ? 'network error' : `${trace.status} ${trace.ok ? 'OK' : 'error'}`}
            </span>
            {' · '}
            {ms(trace.total)} total
          </>
        ) : (
          <>sending… {ms(elapsed)}</>
        )}
      </p>
      {trace?.footnote && <p className="waterfall__note">{trace.footnote}</p>}
    </div>
  );
}
