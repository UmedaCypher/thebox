import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { defineStrings, useStrings } from '../../i18n';
import s from './InfoPage.module.css';

const S = defineStrings({ toc: 'Sommaire' }, { toc: 'Contents' });

const slug = (text: string, i: number) =>
  `${i + 1}-${text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}`;

/**
 * Mise en page des pages de lecture (aide, à propos, presse, contact, légal) :
 * un en-tête éditorial, une colonne de lecture confortable et, pour les textes longs,
 * un sommaire qui suit la lecture.
 */
export default function InfoPage({ kicker, title, lead, notice, toc = false, aside, children }: {
  kicker: string; title: string; lead?: ReactNode; notice?: ReactNode; toc?: boolean; aside?: ReactNode; children: ReactNode;
}) {
  const t = useStrings(S);
  const body = useRef<HTMLDivElement>(null);
  const [heads, setHeads] = useState<{ id: string; text: string }[]>([]);
  const [active, setActive] = useState<string | null>(null);

  // Sommaire construit à partir des titres de section du texte.
  useLayoutEffect(() => {
    if (!toc || !body.current) return;
    const list = [...body.current.querySelectorAll('h2')].map((h, i) => {
      if (!h.id) h.id = slug(h.textContent ?? '', i);
      return { id: h.id, text: (h.textContent ?? '').replace(/^Article\s+\d+\s*:\s*/i, '') };
    });
    setHeads(list);
  }, [toc, children]);

  // Section en cours de lecture, mise en avant dans le sommaire.
  useEffect(() => {
    if (!heads.length) return;
    const obs = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-20% 0px -70% 0px' });
    heads.forEach(h => { const el = document.getElementById(h.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [heads]);

  const tocList = (
    <ol className={s.tocList}>
      {heads.map(h => <li key={h.id}><a href={`#${h.id}`} aria-current={active === h.id ? 'true' : undefined}>{h.text}</a></li>)}
    </ol>
  );

  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={s.kicker}>{kicker}</p>
        <h1 className={s.title}>{title}</h1>
        {lead && <p className={s.lead}>{lead}</p>}
        {notice && <p className={s.notice}>{notice}</p>}
      </header>

      <div className={s.layout} data-aside={Boolean((toc && heads.length) || aside)}>
        <div className={s.body} ref={body}>
          {toc && heads.length > 0 && (
            <details className={s.tocMobile}>
              <summary>{t.toc}</summary>
              {tocList}
            </details>
          )}
          {children}
        </div>
        {((toc && heads.length > 0) || aside) && (
          <aside className={s.aside}>
            {toc && heads.length > 0 && (
              <nav className={s.toc} aria-label={t.toc}>
                <p className={s.tocTitle}>{t.toc}</p>
                {tocList}
              </nav>
            )}
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
}
