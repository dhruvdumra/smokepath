import { HourlyChart } from './HourlyChart';
import { CatPill, Checklist, Method, ParentMessage, SmokeWhy, TimetableList } from './AdvisoryParts';
import { Subscribe } from './Subscribe';
import { dateLabel } from '../lib/time';
import { tr } from '../lib/ui';
import type { Advisory, Lang, School } from '../lib/types';

interface Props {
  school: School;
  adv: Advisory | null;
  loading: boolean;
  error: string | null;
  dates: string[];
  date: string | null;
  lang: Lang;
  showPath: boolean;
  onDate: (d: string) => void;
  onBack: () => void;
  onTogglePath: () => void;
}

export function SchoolPanel({ school, adv, loading, error, dates, date, lang, showPath, onDate, onBack, onTogglePath }: Props) {
  const current = adv?.date ?? date;
  return (
    <section className="school" aria-busy={loading}>
      <button className="link-back" onClick={onBack}>← {tr('back', lang)}</button>
      <h2>{lang === 'hi' && school.name_hi ? school.name_hi : school.name}</h2>
      {school.addr && <p className="muted small">{school.addr}</p>}

      <div className="tabs" role="tablist" aria-label="Date">
        {dates.map((d) => (
          <button key={d} role="tab" aria-selected={d === current} className={d === current ? 'tab on' : 'tab'} onClick={() => onDate(d)}>
            {dateLabel(d, lang)}
          </button>
        ))}
      </div>

      {error && <p className="error" role="alert">Could not load this school's forecast: {error}</p>}
      {loading && !adv && (
        <div className="skeleton" aria-label={tr('loading', lang)}><div /><div /><div /></div>
      )}

      {adv && (
        <div className={loading ? 'adv stale' : 'adv'}>
          <p className="headline"><CatPill k={adv.worst.cat} lang={lang} />{adv.headline[lang]}</p>
          <HourlyChart adv={adv} lang={lang} />

          <h3>{tr('timetable', lang)}</h3>
          <TimetableList adv={adv} lang={lang} />

          <h3>{tr('actions', lang)}</h3>
          <Checklist adv={adv} lang={lang} />

          {adv.parent_message && (
            <>
              <h3>{tr('parents', lang)}</h3>
              <ParentMessage adv={adv} lang={lang} />
            </>
          )}

          <h3>{tr('why', lang)}</h3>
          <SmokeWhy adv={adv} lang={lang} showPath={showPath} onTogglePath={onTogglePath} />

          <h3>{tr('method', lang)}</h3>
          <Method adv={adv} lang={lang} />

          <h3>{tr('subscribe', lang)}</h3>
          <Subscribe school={school} lang={lang} />
        </div>
      )}
    </section>
  );
}
