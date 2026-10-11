import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { catByKey } from '../../lib/colors';
import { tr } from '../../lib/ui';
import type { Advisory, Lang, Slot } from '../../lib/types';

const CODE: Record<Slot['mode'], [string, string]> = {
  outdoor: ['As planned', 'जैसा तय'],
  indoor: ['Indoors', 'अंदर'],
  light: ['Light activity only', 'केवल हल्की गतिविधि'],
  protect: ['Masks · gates open early', 'मास्क · गेट जल्दी'],
  moved: ['Moved', 'समय बदला'],
  moved_light: ['Moved · light only', 'समय बदला · हल्का'],
};
const WORK_CODE: Partial<Record<Slot['mode'], [string, string]>> = {
  protect: ['N95 + a sheltered break hourly', 'N95 + हर घंटे शेड में आराम'],
  light: ['Light work only', 'केवल हल्का काम'],
  indoor: ['Rest indoors', 'अंदर आराम'],
};

/** Times flip in place when the ticket's date changes (split-flap raise). */
function Flip({ value, k }: { value: string; k: string }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span key={k + value} className="flip"
                   initial={reduce ? false : { rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }}
                   exit={reduce ? undefined : { rotateX: 90, opacity: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

/** One status line per period, like a ticket's passenger list. Changed periods stay lit until they have been seen. */
export function StatusList({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const k = `${adv.school.id}-${adv.date}`;
  useEffect(() => {
    setSeen({});
    const id = window.setTimeout(() => setSeen(Object.fromEntries(adv.timetable.map((s) => [s.id, true]))), 6000);
    return () => window.clearTimeout(id);
  }, [k, adv.timetable]);

  const work = adv.profile === 'work';
  return (
    <section aria-label={tr(work ? 'plan' : 'timetable', lang)}>
      <h3 className="section-title">{tr(work ? 'plan' : 'timetable', lang)}</h3>
      <ol className="status">
        {adv.timetable.map((s) => {
          const changed = s.mode !== 'outdoor';
          const moved = s.mode === 'moved' || s.mode === 'moved_light';
          const c = catByKey(s.cat);
          const code = ((work && WORK_CODE[s.mode]) || CODE[s.mode])[lang === 'en' ? 0 : 1];
          return (
            <motion.li key={s.id} layout className={`${changed ? 'changed' : ''} ${changed && !seen[s.id] ? 'lit' : ''}`}
                       onMouseEnter={() => setSeen((x) => ({ ...x, [s.id]: true }))}
                       onFocus={() => setSeen((x) => ({ ...x, [s.id]: true }))} tabIndex={changed ? 0 : -1}>
              <span className="t">{moved ? <s>{s.start}</s> : <Flip value={s.start} k={k} />}</span>
              <span className="name">{lang === 'en' ? s.label_en : s.label_hi}</span>
              <span className="air" title={`${s.pm} µg/m³`}>
                <i className="cat-dot" style={{ background: c.color }} aria-hidden />{s.pm}
              </span>
              <span className="code">
                {code}
                {moved && (
                  <>
                    <span aria-hidden>→</span>
                    <b style={{ color: 'var(--snow)' }}><Flip value={s.new_start!} k={k} /></b>
                    <i className="cat-dot" style={{ background: catByKey(s.cat_new!).color }} aria-hidden />
                    <span>{s.pm_new}</span>
                  </>
                )}
              </span>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
