import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Route } from 'lucide-react';
import { TicketIntro } from './TicketIntro';
import { TicketRoute } from './TicketRoute';
import { HourStrip } from './HourStrip';
import { StatusList } from './StatusList';
import { Remarks } from './Remarks';
import { Stub } from './Stub';
import { Fineprint } from './Fineprint';
import { dateLabel } from '../../lib/time';
import { tr } from '../../lib/ui';
import type { Advisory, Bundle, Lang, School } from '../../lib/types';

interface Props {
  place: School | null;
  adv: Advisory | null;
  loading: boolean;
  error: string | null;
  schools: School[];
  bundle: Bundle | null;
  dates: string[];
  date: string | null;
  lang: Lang;
  siteMode: boolean;
  showRoute: boolean;
  onSiteMode: (on: boolean) => void;
  onSelect: (s: School, fly: boolean) => void;
  onDate: (d: string) => void;
  onBack: () => void;
  onToggleRoute: () => void;
}

// Content swaps instantly and the incoming ticket rises in; no exit choreography to wait on.
const enter = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

export function Ticket(p: Props) {
  const reduce = useReducedMotion();
  const anim = reduce ? {} : enter;
  const current = p.adv?.date ?? p.date;
  const hasRoute = !!p.adv?.smoke && p.adv.smoke.level !== 'none' && p.adv.smoke.path.length > 1;

  return (
    <div className="ticket-inner">
      <AnimatePresence initial={false}>
        {!p.place ? (
          <motion.div key="intro" {...anim} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} style={{ display: 'grid', gap: 20 }}>
            <TicketIntro schools={p.schools} bundle={p.bundle} lang={p.lang} siteMode={p.siteMode}
                         onSiteMode={p.onSiteMode} onSelect={p.onSelect} />
          </motion.div>
        ) : (
          <motion.div key={p.place.id} {...anim} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} style={{ display: 'grid', gap: 20 }}
                      aria-busy={p.loading}>
            <div className="ticket-head">
              <button className="btn btn-ghost" onClick={p.onBack}><ArrowLeft aria-hidden />{tr('back', p.lang)}</button>
              <div className="pills" role="tablist" aria-label="Date">
                {p.dates.map((d) => (
                  <button key={d} role="tab" aria-selected={d === current} className="pill" onClick={() => p.onDate(d)}>
                    {dateLabel(d, p.lang)}
                  </button>
                ))}
              </div>
            </div>

            {p.error && <p className="status-msg error" role="alert">Could not load this forecast: {p.error}</p>}
            {p.loading && !p.adv && <div className="skeleton" aria-label={tr('loading', p.lang)}><div /><div /><div /><div /></div>}

            {p.adv && (
              <div style={{ display: 'grid', gap: 20, opacity: p.loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
                <TicketRoute adv={p.adv} lang={p.lang} />
                {hasRoute && (
                  <button className="btn btn-ghost" style={{ justifySelf: 'start', marginTop: -10 }} aria-pressed={p.showRoute} onClick={p.onToggleRoute}>
                    <Route aria-hidden />{p.showRoute ? tr('hideRoute', p.lang) : tr('showRoute', p.lang)}
                  </button>
                )}
                <HourStrip adv={p.adv} lang={p.lang} />
                <StatusList adv={p.adv} lang={p.lang} />
                <Remarks adv={p.adv} lang={p.lang} />
                <div className="perf" aria-hidden />
                <Stub adv={p.adv} lang={p.lang} />
                <Fineprint adv={p.adv} lang={p.lang} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
