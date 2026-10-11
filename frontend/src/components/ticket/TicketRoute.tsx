import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { catByKey, catLabel } from '../../lib/colors';
import { dateLabel } from '../../lib/time';
import { tr } from '../../lib/ui';
import type { Advisory, Lang } from '../../lib/types';

/** The arrival hour counts in when a ticket is issued: the one number that moves. */
function CountIn({ hour, k }: { hour: number; k: string }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? hour : 0);
  useEffect(() => {
    if (reduce) { setV(hour); return; }
    const c = animate(0, hour, { duration: 0.7, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [hour, k, reduce]);
  return <>{String(v).padStart(2, '0')}:00</>;
}

export function TicketRoute({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const smoke = adv.smoke && adv.smoke.level !== 'none' && adv.smoke.sources.length ? adv.smoke : null;
  const worst = catByKey(adv.worst.cat);
  const hour = smoke ? parseInt(smoke.hour, 10) : adv.worst.hour;
  const places = smoke?.sources.slice(0, 3).map((s) => s.district) ?? [];
  const placeText = places.length > 1 ? `${places.slice(0, -1).join(', ')} & ${places[places.length - 1]}` : places[0];
  const leftAgo = smoke ? Math.max(...smoke.sources.map((s) => s.hours_before)) : 0;
  const work = adv.profile === 'work';
  const name = lang === 'hi' && adv.school.name_hi ? adv.school.name_hi : adv.school.name;

  return (
    <section className="route" aria-label="Smoke route">
      <div className="route-row">
        <div className="route-rail"><i className={smoke ? 'route-pin' : 'route-pin local'} /></div>
        <div>
          <div className="field-label">{tr('from', lang)}</div>
          <div className="field-value">
            {smoke ? (lang === 'en' ? `Crop fires near ${placeText}` : `${placeText} के पास पराली की आग`) : tr('localFrom', lang)}
          </div>
          <div className="field-note">
            {smoke ? tr('routeNote', lang, { n: smoke.fires, h: leftAgo }) : tr('localNote', lang)}
          </div>
        </div>
      </div>
      <div className="route-row">
        <div className="route-rail"><i className="route-pin to" /></div>
        <div>
          <div className="field-label">{tr('to', lang)}</div>
          <h2 className="field-value">{name}</h2>
          <div className="field-note">{dateLabel(adv.date, lang)}{work ? ` · ${tr('site', lang)}` : ''}</div>
        </div>
      </div>
      <div className="arrival">
        <div>
          <div className="field-label">{smoke ? tr('arrives', lang) : tr('peak', lang)}</div>
          <div className="arrival-time" aria-label={`${String(hour).padStart(2, '0')}:00`}>
            <CountIn hour={hour} k={`${adv.school.id}-${adv.date}`} />
          </div>
        </div>
        <div className="verdict">
          <span className="cat-pill" style={{ background: worst.color, color: worst.ink }}>
            {catLabel(adv.worst.cat, lang)}<span className="v">{adv.worst.pm}</span>
          </span>
          <span className="summary">
            {adv.changes ? <b>{tr('changes', lang, { n: adv.changes })}</b> : tr('noChanges', lang)}
          </span>
        </div>
      </div>
    </section>
  );
}
