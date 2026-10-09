// Times a real fetch the way DevTools' network panel would, using only numbers the
// browser actually gives us.

export interface TracePhase {
  label: string;
  /** ms from the moment the request was made */
  start: number;
  end: number;
  note?: string;
}

export interface RequestTrace {
  /** HTTP status, or null when the request never got a response. */
  status: number | null;
  ok: boolean;
  total: number;
  phases: TracePhase[];
  /** Shown under the table — e.g. what the browser hides from us. */
  footnote?: string;
}

export async function tracedFetch<T>(url: string, init: RequestInit): Promise<{ data: T | null; trace: RequestTrace }> {
  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    const end = performance.now() - t0;
    return {
      data: null,
      trace: { status: null, ok: false, total: end, phases: [{ label: 'POST /inbox', start: 0, end, note: 'failed' }] },
    };
  }
  const tHeaders = performance.now() - t0;
  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    // Non-JSON body; the status code still tells the story.
  }
  const tBody = performance.now() - t0;

  // Resource Timing only breaks out DNS/TLS/TTFB when the server sends Timing-Allow-Origin.
  const entry = performance
    .getEntriesByName(url)
    .filter((e): e is PerformanceResourceTiming => e instanceof PerformanceResourceTiming && e.startTime >= t0 - 1)
    .at(-1);
  const detailed = entry !== undefined && entry.requestStart > 0;

  const phases: TracePhase[] = [];
  let footnote: string | undefined;
  if (detailed) {
    const rel = (t: number) => t - t0;
    const reused = entry.connectEnd - entry.domainLookupStart < 0.5;
    phases.push(
      {
        label: 'dns + tls',
        start: rel(entry.domainLookupStart),
        end: rel(entry.connectEnd),
        note: reused ? 'reused' : undefined,
      },
      { label: 'POST /inbox', start: rel(entry.requestStart), end: rel(entry.responseStart) },
    );
  } else {
    phases.push(
      { label: 'dns + tls', start: 0, end: 0, note: 'hidden by browser' },
      { label: 'POST /inbox', start: 0, end: tHeaders },
    );
    footnote = 'POST time includes the CORS preflight. The server sends no Timing-Allow-Origin, so the browser keeps DNS/TLS to itself.';
  }
  phases.push({ label: 'read body', start: detailed ? entry.responseStart - t0 : tHeaders, end: tBody });

  return { data, trace: { status: res.status, ok: res.ok, total: tBody, phases, footnote } };
}
