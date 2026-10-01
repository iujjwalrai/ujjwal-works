import { useEffect, useState } from 'react';

const TIME_ZONE = 'Asia/Kolkata';

// Seconds since midnight in IST, regardless of the viewer's own timezone.
function istSeconds() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get('hour') * 3600 + get('minute') * 60 + get('second');
}

const pad = (n: number) => String(n).padStart(2, '0');

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

// Analog IST clock pinned to the photo card's corner, with a "live from India" tag.
export default function LiveClock() {
  const [secs, setSecs] = useState(istSeconds);

  useEffect(() => {
    let timer = 0;
    // Re-sync on each whole second so the hand ticks in step with the real clock.
    const schedule = () => {
      timer = window.setTimeout(() => {
        setSecs(istSeconds());
        schedule();
      }, 1000 - (Date.now() % 1000));
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // Angles grow all day (only wrapping at midnight) so the second hand never spins backwards.
  const hour = secs / 120;
  const minute = secs / 10;
  const second = secs * 6;
  const label = `${pad(Math.floor(secs / 3600))}:${pad(Math.floor(secs / 60) % 60)}`;

  return (
    <div className="clock" role="img" aria-label={`Live from India, local time ${label} IST`}>
      <svg className="clock__face" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="clock__rim" cx="50" cy="50" r="47" />
        {TICKS.map((a) => (
          <line
            key={a}
            className={a % 90 === 0 ? 'clock__tick clock__tick--major' : 'clock__tick'}
            x1="50"
            y1="9"
            x2="50"
            y2={a % 90 === 0 ? 17 : 13}
            transform={`rotate(${a} 50 50)`}
          />
        ))}
        <line className="clock__hand clock__hand--hour" x1="50" y1="50" x2="50" y2="29" transform={`rotate(${hour} 50 50)`} />
        <line className="clock__hand clock__hand--min" x1="50" y1="50" x2="50" y2="15" transform={`rotate(${minute} 50 50)`} />
        <g className="clock__sec" style={{ transform: `rotate(${second}deg)` }}>
          <line x1="50" y1="61" x2="50" y2="12" />
          <circle cx="50" cy="50" r="3.5" />
        </g>
        <circle className="clock__pin" cx="50" cy="50" r="1.4" />
      </svg>
      <span className="clock__tag" aria-hidden="true">
        <span className="clock__live">
          <span className="wip__dot" />
          Live from India
        </span>
        <span className="clock__digital">
          {label}
          <span className="clock__secs">:{pad(secs % 60)}</span> IST
        </span>
      </span>
    </div>
  );
}
