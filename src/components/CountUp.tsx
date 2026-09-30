import { useLayoutEffect, useRef } from 'react';

// Counts the number inside a label like "1,000+", "Top 10" or "2nd" up from zero
// the first time it scrolls into view. Prefix/suffix text is kept as-is.
export default function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const match = value.match(/^(\D*)([\d,]+)(.*)$/);
    if (!el || !match || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/,/g, ''));
    const format = (n: number) => prefix + (digits.includes(',') ? n.toLocaleString('en-US') : n) + suffix;
    el.textContent = format(0);

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(2, -10 * t); // easeOutExpo
          el.textContent = format(t === 1 ? target : Math.round(target * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
  }, [value]);

  return <span ref={ref}>{value}</span>;
}
