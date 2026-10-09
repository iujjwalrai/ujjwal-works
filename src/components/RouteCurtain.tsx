import type { CSSProperties } from 'react';
import type { CurtainPhase } from '../hooks/usePageTransition';

interface RouteCurtainProps {
  phase: CurtainPhase;
  command: string;
  timing: { bars: number; barMs: number; staggerMs: number };
}

// Full-screen bars that sweep in, show the "command" for the page being opened,
// then sweep out to reveal it.
export default function RouteCurtain({ phase, command, timing }: RouteCurtainProps) {
  if (phase === 'idle') return null;
  const { bars, barMs, staggerMs } = timing;
  const vars = { '--bars': bars, '--bar-ms': barMs, '--stagger-ms': staggerMs } as CSSProperties;

  return (
    <div className={`curtain curtain--${phase}`} style={vars} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="curtain__bar" style={{ '--i': i } as CSSProperties} />
      ))}
      <p className="curtain__cmd">
        <span className="curtain__prompt">~/ujjwal $</span>
        <span className="curtain__typed" style={{ '--n': command.length } as CSSProperties}>
          {command}
        </span>
        <span className="curtain__caret" />
      </p>
    </div>
  );
}
