import { useEffect, useReducer } from 'react';

// A toy control loop: a deployment wants N replicas, a scheduler places pods on
// the least-loaded ready node, and killed or drained pods get replaced.

const CAPACITY = 4;
const TICK_MS = 450;
const MIN_REPLICAS = 1;
const MAX_REPLICAS = 12;

type PodStatus = 'pending' | 'starting' | 'running' | 'terminating';

interface Pod {
  id: string;
  node: number | null;
  status: PodStatus;
  since: number; // tick the pod entered its current status
  warned?: boolean;
}

interface LogLine {
  id: number;
  text: string;
  kind: 'info' | 'ok' | 'warn' | 'del';
}

interface State {
  tick: number;
  serial: number;
  replicas: number;
  nodes: { name: string; ready: boolean }[];
  pods: Pod[];
  log: LogLine[];
  logSerial: number;
}

type Action = { type: 'tick' } | { type: 'kill'; id: string } | { type: 'toggleNode'; index: number } | { type: 'scale'; delta: number };

// Deterministic pod suffix so the reducer stays pure.
const podName = (n: number) => `web-${((n * 2654435761) >>> 0).toString(16).slice(-5)}`;

function initialState(): State {
  const pods: Pod[] = Array.from({ length: 6 }, (_, i) => ({
    id: podName(i + 1),
    node: i % 3,
    status: 'running',
    since: 0,
  }));
  return {
    tick: 0,
    serial: 6,
    replicas: 6,
    nodes: [
      { name: 'node-a', ready: true },
      { name: 'node-b', ready: true },
      { name: 'node-c', ready: true },
    ],
    pods,
    log: [{ id: 0, text: 'deployment/web ready — 6/6 replicas', kind: 'ok' }],
    logSerial: 1,
  };
}

function withLog(state: State, text: string, kind: LogLine['kind']): State {
  const log = [...state.log, { id: state.logSerial, text, kind }].slice(-5);
  return { ...state, log, logSerial: state.logSerial + 1 };
}

const occupies = (p: Pod) => p.node !== null && p.status !== 'terminating';

function reconcile(prev: State): State {
  let s: State = { ...prev, tick: prev.tick + 1 };
  let changed = false;
  const t = s.tick;
  let pods = [...s.pods];

  // Finish terminations and start-ups.
  const before = pods.length;
  pods = pods.filter((p) => !(p.status === 'terminating' && t - p.since >= 2));
  if (pods.length !== before) changed = true;
  pods = pods.map((p) => {
    if (p.status === 'starting' && t - p.since >= 2) {
      changed = true;
      return { ...p, status: 'running', since: t };
    }
    return p;
  });

  // Keep the replica count: create one missing pod, or retire one extra, per tick.
  const live = pods.filter((p) => p.status !== 'terminating');
  if (live.length < s.replicas) {
    const id = podName(s.serial + 1);
    pods.push({ id, node: null, status: 'pending', since: t });
    s = withLog({ ...s, serial: s.serial + 1 }, `replicaset: created pod/${id}`, 'info');
    changed = true;
  } else if (live.length > s.replicas) {
    const victim = [...live].reverse().find((p) => p.status !== 'pending') ?? live[live.length - 1];
    pods = pods.map((p) => (p === victim ? { ...p, status: 'terminating', since: t } : p));
    s = withLog(s, `replicaset: scaled down pod/${victim.id}`, 'del');
    changed = true;
  }

  // Schedule the oldest pending pod onto the least-loaded ready node.
  const pendingIdx = pods.findIndex((p) => p.status === 'pending' && t - p.since >= 1);
  if (pendingIdx !== -1) {
    const load = s.nodes.map((_, i) => pods.filter((p) => p.node === i && occupies(p)).length);
    const candidates = s.nodes
      .map((n, i) => ({ i, ready: n.ready, load: load[i] }))
      .filter((n) => n.ready && n.load < CAPACITY)
      .sort((a, b) => a.load - b.load);
    const pod = pods[pendingIdx];
    if (candidates.length > 0) {
      const target = candidates[0].i;
      pods[pendingIdx] = { ...pod, node: target, status: 'starting', since: t };
      s = withLog(s, `scheduler: pod/${pod.id} → ${s.nodes[target].name}`, 'ok');
      changed = true;
    } else if (!pod.warned) {
      pods[pendingIdx] = { ...pod, warned: true };
      const ready = s.nodes.filter((n) => n.ready).length;
      s = withLog(s, `FailedScheduling: 0/${s.nodes.length} nodes available (${ready} ready, all full)`, 'warn');
      changed = true;
    }
  }

  // Idle cluster: skip the re-render. Anything mid-transition needs the clock to keep moving.
  const busy = prev.pods.some((p) => p.status !== 'running');
  return changed || busy ? { ...s, pods } : prev;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tick':
      return reconcile(state);

    case 'kill': {
      const pod = state.pods.find((p) => p.id === action.id);
      if (!pod || pod.status === 'terminating') return state;
      const pods = state.pods.map((p) => (p.id === action.id ? { ...p, status: 'terminating' as const, since: state.tick } : p));
      return withLog({ ...state, pods }, `kubectl delete pod/${pod.id}`, 'del');
    }

    case 'toggleNode': {
      const node = state.nodes[action.index];
      const nodes = state.nodes.map((n, i) => (i === action.index ? { ...n, ready: !n.ready } : n));
      if (node.ready) {
        // Cordon + drain: evict everything running there; the controller re-creates them elsewhere.
        const pods = state.pods.map((p) =>
          p.node === action.index && p.status !== 'terminating' ? { ...p, status: 'terminating' as const, since: state.tick } : p,
        );
        return withLog({ ...state, nodes, pods }, `kubectl drain ${node.name} — evicting pods`, 'warn');
      }
      return withLog({ ...state, nodes }, `kubectl uncordon ${node.name} — Ready`, 'ok');
    }

    case 'scale': {
      const replicas = Math.min(MAX_REPLICAS, Math.max(MIN_REPLICAS, state.replicas + action.delta));
      if (replicas === state.replicas) return state;
      return withLog({ ...state, replicas }, `kubectl scale deployment/web --replicas=${replicas}`, 'info');
    }
  }
}

export default function KlystrSim() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'tick' }), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const pending = state.pods.filter((p) => p.node === null);
  const running = state.pods.filter((p) => p.status === 'running').length;

  return (
    <div className="kube">
      <div className="kube__bar">
        <span className="kube__title">
          deployment/<strong>web</strong>
          <span className={`kube__health ${running === state.replicas ? 'is-ok' : ''}`}>
            {running}/{state.replicas} ready
          </span>
        </span>
        <div className="kube__scale" role="group" aria-label="Replicas">
          <button type="button" onClick={() => dispatch({ type: 'scale', delta: -1 })} aria-label="Scale down">−</button>
          <span>{state.replicas}</span>
          <button type="button" onClick={() => dispatch({ type: 'scale', delta: 1 })} aria-label="Scale up">+</button>
        </div>
      </div>

      <div className="kube__nodes">
        {state.nodes.map((node, i) => {
          const podsHere = state.pods.filter((p) => p.node === i);
          return (
            <div key={node.name} className={`kube__node ${node.ready ? '' : 'is-drained'}`}>
              <button
                type="button"
                className="kube__node-head"
                onClick={() => dispatch({ type: 'toggleNode', index: i })}
                title={node.ready ? `Drain ${node.name}` : `Uncordon ${node.name}`}
              >
                <span className="kube__led" />
                {node.name}
                <span className="kube__node-state">{node.ready ? 'Ready' : 'Drained'}</span>
              </button>
              <div className="kube__slots">
                {Array.from({ length: CAPACITY }, (_, slot) => {
                  const pod = podsHere[slot];
                  return pod ? (
                    <button
                      key={pod.id}
                      type="button"
                      className={`kube__pod is-${pod.status}`}
                      onClick={() => dispatch({ type: 'kill', id: pod.id })}
                      title={`${pod.id} · ${pod.status} — click to kill`}
                      aria-label={`Kill ${pod.id}`}
                    >
                      {pod.id.slice(-2)}
                    </button>
                  ) : (
                    <span key={`empty-${slot}`} className="kube__slot" />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="kube__pending">
        <span className="kube__label">pending</span>
        {pending.length === 0 ? (
          <span className="kube__none">—</span>
        ) : (
          pending.map((p) => (
            <span key={p.id} className="kube__chip">{p.id}</span>
          ))
        )}
      </div>

      <ol className="kube__log" aria-live="polite">
        {state.log.map((line) => (
          <li key={line.id} className={`kube__log-${line.kind}`}>{line.text}</li>
        ))}
      </ol>

      <p className="kube__hint">Toy simulation · click a pod to kill it, a node to drain it, ± to scale.</p>
    </div>
  );
}
