import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, [role="button"], label, input, textarea, select, summary';

// A dot that tracks the pointer exactly, plus a ring that trails behind it with easing.
// The ring swells over clickable things and squeezes on press. Mouse/trackpad only.
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    root.classList.add('has-custom-cursor');

    let mouseX = -100;
    let mouseY = -100;
    let ringX = mouseX;
    let ringY = mouseY;
    let frame = 0;

    const tick = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      // Stop the loop once the ring has caught up; the next move restarts it.
      frame = Math.abs(mouseX - ringX) + Math.abs(mouseY - ringY) > 0.1 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      root.classList.add('cursor-visible');
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onOver = (e: PointerEvent) => {
      const hovering = e.target instanceof Element && e.target.closest(INTERACTIVE) !== null;
      root.classList.toggle('cursor-hover', hovering);
      // Over small coloured controls (terminal lights), keep the ring hollow so colours stay true.
      root.classList.toggle('cursor-quiet', e.target instanceof Element && e.target.closest('.term__lights') !== null);
    };
    const onDown = () => root.classList.add('cursor-down');
    const onUp = () => root.classList.remove('cursor-down');
    const onLeave = () => root.classList.remove('cursor-visible');

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      root.classList.remove('has-custom-cursor', 'cursor-visible', 'cursor-hover', 'cursor-quiet', 'cursor-down');
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <div className="cursor-ring__circle" />
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
