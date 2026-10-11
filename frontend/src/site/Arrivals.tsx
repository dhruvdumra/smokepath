import { useEffect, useState } from 'react';
import { catByKey, catLabel } from '../lib/colors';
import { t } from './copy';
import { href } from './shared';
import type { Advisory, Lang } from '../lib/types';

/** Real schools from the 11 Nov 2025 replay: a mix of government and private, across NCR. */
const BOARD = ['w341481077', 'w998316508', 'w43316275', 'n11696928200', 'w239637984', 'w1076871973', 'w158037035'];

interface Row { id: string; name: string; hour: number; from: string | null; adv: Advisory }

/** Some OpenStreetMap names are entered in capitals; show them in title case. */
function displayName(n: string) {
  return n === n.toUpperCase() ? n.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase()) : n;
}

/** The arrivals board: when the smoke reaches each school, ranked by time, read live from the replay forecast. */
export function Arrivals({ lang, onSample }: { lang: Lang; onSample?: (a: Advisory) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.all(BOARD.map((id) => fetch(`/api/advisory?school=${id}&dataset=replay&date=2025-11-11`).then((r) => (r.ok ? r.json() : null))))
      .then((list: (Advisory | null)[]) => {
        if (!live) return;
        const ok = list.filter(Boolean) as Advisory[];
        if (!ok.length) { setError(true); return; }
        const rs = ok.map((a) => {
          const smoke = a.smoke && a.smoke.level !== 'none' && a.smoke.sources.length ? a.smoke : null;
          return { id: a.school.id, name: displayName(a.school.name), hour: smoke ? parseInt(smoke.hour, 10) : a.worst.hour, from: smoke ? smoke.sources[0].district : null, adv: a };
        }).sort((x, y) => x.hour - y.hour || y.adv.worst.pm - x.adv.worst.pm);
        setRows(rs);
        const sample = rs.find((r) => r.id === BOARD[0]);
        if (sample) onSample?.(sample.adv);
      })
      .catch(() => live && setError(true));
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="board" aria-label={t('boardTitle', lang)}>
      <header className="board-head">
        <h2>{t('boardTitle', lang)}</h2>
        <p>{t('boardSub', lang)}</p>
      </header>
      <div className="board-cols" aria-hidden>
        <span>{t('colArr', lang)}</span><span>{t('colSchool', lang)}</span><span className="hide-narrow">{t('colFrom', lang)}</span>
        <span>{t('colAir', lang)}</span>
      </div>
      {error && <p className="board-msg">{t('boardError', lang)}</p>}
      {!rows && !error && (
        <ol className="board-rows" aria-busy="true">
          {BOARD.slice(0, 6).map((id) => <li key={id} className="board-row skeleton-row"><span /><span /><span /><span /></li>)}
        </ol>
      )}
      {rows && (
        <ol className="board-rows">
          {rows.map((r) => {
            const c = catByKey(r.adv.worst.cat);
            return (
              <li key={r.id}>
                <a className="board-row" href={href('/app', lang, { school: r.id, dataset: 'replay' })}>
                  <span className="b-time">{String(r.hour).padStart(2, '0')}:00</span>
                  <span className="b-name">{r.name}<small>{r.adv.changes ? t('colChanges', lang) + ': ' + r.adv.changes : ''}</small></span>
                  <span className="b-from hide-narrow">{r.from ?? t('local', lang)}</span>
                  <span className="cat-pill" style={{ background: c.color, color: c.ink }}>{catLabel(r.adv.worst.cat, lang)}<span className="v">{r.adv.worst.pm}</span></span>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
