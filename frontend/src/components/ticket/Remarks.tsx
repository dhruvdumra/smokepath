import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { tr } from '../../lib/ui';
import type { Advisory, Lang } from '../../lib/types';

const SKIP = new Set(['smoke', 'grap', 'work_grap', 'all_clear']);
const FIRST = 3;

/** The principal's to-do list for tonight: three steps visible, the rest one tap away. GRAP sits apart as the featured card. */
export function Remarks({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [all, setAll] = useState(false);
  const grap = adv.actions.find((a) => a.key === 'grap' || a.key === 'work_grap');
  const items = adv.actions.filter((a) => !SKIP.has(a.key));
  const shown = all ? items : items.slice(0, FIRST);
  if (!items.length && !grap) return null;

  return (
    <section aria-label={tr('todo', lang)}>
      <h3 className="section-title">{tr('todo', lang)}</h3>
      {grap && (
        <div className="grap" role="note" style={{ marginBottom: 10 }}>
          <strong>{tr('grap', lang, { s: adv.grap_stage ?? '' })}</strong>
          {grap[lang]}
        </div>
      )}
      <ul className="remarks">
        {shown.map((a, i) => {
          const id = `${adv.school.id}-${a.key}-${i}`;
          return (
            <li key={id}>
              <input type="checkbox" id={id} checked={!!done[id]} onChange={(e) => setDone({ ...done, [id]: e.target.checked })} />
              <label htmlFor={id} className={done[id] ? 'done' : ''}>{a[lang]}</label>
            </li>
          );
        })}
      </ul>
      {items.length > FIRST && (
        <button className="more" aria-expanded={all} onClick={() => setAll(!all)}>
          {all ? tr('fewerSteps', lang) : tr('allSteps', lang, { n: items.length })}<ChevronDown aria-hidden />
        </button>
      )}
    </section>
  );
}
