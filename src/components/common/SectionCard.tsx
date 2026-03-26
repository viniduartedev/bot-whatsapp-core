import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  aside,
  children,
  className
}: SectionCardProps) {
  const classNames = ['section-card', className].filter(Boolean).join(' ');

  return (
    <section className={classNames}>
      <header className="section-card__header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {aside && <div className="section-card__aside">{aside}</div>}
      </header>
      <div className="section-card__body">{children}</div>
    </section>
  );
}
