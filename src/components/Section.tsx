import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  index: string;
  kicker: string;
  title: ReactNode;
  children: ReactNode;
}

// Two-column section: a sticky index on the left, content on the right.
export default function Section({ id, index, kicker, title, children }: SectionProps) {
  return (
    <section id={id} className="sec fade-in">
      <div className="wrap sec__grid">
        <header className="sec__head">
          <p className="sec__kicker">
            <span className="sec__index">{index}</span>
            <span className="sec__rule" />
            {kicker}
          </p>
          <h2 className="sec__title">{title}</h2>
        </header>
        <div className="sec__body">{children}</div>
      </div>
    </section>
  );
}
