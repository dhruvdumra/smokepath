import { useState } from 'react';
import { catByKey, catLabel } from '../lib/colors';
import { tr } from '../lib/ui';
import type { Advisory, CatKey, Lang, Slot } from '../lib/types';

export function CatPill({ k, lang, pm }: { k: CatKey; lang: Lang; pm?: number }) {
  const c = catByKey(k);
  return (
    <span className="pill" style={{ background: c.color, color: c.ink }}>
      {catLabel(k, lang)}{pm != null && <b> {pm}</b>}
    </span>
  );
}

const MODE_TEXT: Record<Slot['mode'], [string, string]> = {
  outdoor: ['No change', 'कोई बदलाव नहीं'],
  indoor: ['Move indoors', 'अंदर करें'],
  light: ['Light activity only', 'केवल हल्की गतिविधि'],
  protect: ['Masks, gates open early', 'मास्क, गेट जल्दी खोलें'],
  moved: ['Moved', 'समय बदला'],
  moved_light: ['Moved, light only', 'समय बदला, हल्की गतिविधि'],
};

export function TimetableList({ adv, lang }: { adv: Advisory; lang: Lang }) {
  return (
    <ol className="slots">
      {adv.timetable.map((s) => {
        const changed = s.mode !== 'outdoor';
        const moved = s.mode === 'moved' || s.mode === 'moved_light';
        return (
          <li key={s.id} className={changed ? 'slot changed' : 'slot'}>
            <span className="slot-time">{s.start}</span>
            <span className="slot-name">{lang === 'en' ? s.label_en : s.label_hi}</span>
            <CatPill k={s.cat} lang={lang} pm={s.pm} />
            <span className={`slot-mode mode-${s.mode}`}>
              {MODE_TEXT[s.mode][lang === 'en' ? 0 : 1]}
              {moved && <> → <b>{s.new_start}</b> <CatPill k={s.cat_new!} lang={lang} pm={s.pm_new} /></>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Checklist({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const items = adv.actions.filter((a) => a.key !== 'smoke');
  return (
    <ul className="checklist">
      {items.map((a, i) => {
        const id = `${a.key}-${i}`;
        return (
          <li key={id} className={a.key === 'grap' ? 'grap' : ''}>
            <input type="checkbox" id={id} checked={!!done[id]} onChange={(e) => setDone({ ...done, [id]: e.target.checked })} />
            <label htmlFor={id} className={done[id] ? 'done' : ''}>{a[lang]}</label>
          </li>
        );
      })}
    </ul>
  );
}

export function SmokeWhy({ adv, lang, showPath, onTogglePath }: { adv: Advisory; lang: Lang; showPath: boolean; onTogglePath: () => void }) {
  const smoke = adv.smoke;
  const line = adv.actions.find((a) => a.key === 'smoke');
  return (
    <div className="why">
      <p>{line ? line[lang] : tr('noSmoke', lang)}</p>
      {smoke && smoke.sources.length > 0 && (
        <ul className="sources">
          {smoke.sources.map((s) => (
            <li key={s.district}>
              <span>{s.district}, {s.state}</span>
              <span className="muted">{s.count} fires · {Math.round(s.frp)} MW · ~{s.hours_before} h</span>
            </li>
          ))}
        </ul>
      )}
      {smoke && smoke.path.length > 1 && (
        <button className="btn btn-quiet" onClick={onTogglePath} aria-pressed={showPath}>
          {showPath ? tr('hidePath', lang) : tr('showPath', lang)}
        </button>
      )}
    </div>
  );
}

export function Method({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const c = adv.correction;
  const peak = adv.hourly[adv.worst.hour];
  const en = c.stations_used === 0
    ? `No ground stations were available for this run, so this is the raw CAMS model forecast (~45 km grid). CAMS often under-predicts Delhi smog, so treat it as a minimum.`
    : `CAMS predicted ${peak.raw} µg/m³ at ${String(adv.worst.hour).padStart(2, '0')}:00. ${c.stations_used} CPCB monitors read higher or lower than CAMS over the last 24 h, so we scale this school's forecast ×${c.ratio} (${c.stations_within_15km} monitors within 15 km). Confidence: ${c.confidence}. CAMS is a ~45 km grid: this is a school-level advisory, not a street-level measurement.`;
  const hi = c.stations_used === 0
    ? `इस रन में कोई ग्राउंड स्टेशन उपलब्ध नहीं था, इसलिए यह मूल CAMS पूर्वानुमान है (~45 किमी ग्रिड)। CAMS अक्सर दिल्ली के स्मॉग को कम आँकता है।`
    : `CAMS ने ${String(adv.worst.hour).padStart(2, '0')}:00 बजे ${peak.raw} µg/m³ बताया। पिछले 24 घंटों में ${c.stations_used} CPCB मॉनिटरों की तुलना से इस स्कूल का पूर्वानुमान ×${c.ratio} किया गया (15 किमी में ${c.stations_within_15km} मॉनिटर)। भरोसा: ${c.confidence}।`;
  const age = c.obs_age_h ?? 0;
  const staleEn = age > 24 ? ` Station readings are ~${Math.round(age / 24)} days old (OpenAQ's CPCB feed is delayed), so confidence is capped at medium.` : '';
  const staleHi = age > 24 ? ` स्टेशन डेटा ~${Math.round(age / 24)} दिन पुराना है (OpenAQ का CPCB फ़ीड देर से है), इसलिए भरोसा अधिकतम मध्यम।` : '';
  return <p className="method">{lang === 'en' ? en + staleEn : hi + staleHi}</p>;
}

export function ParentMessage({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  if (!adv.parent_message) return null;
  const text = adv.parent_message[lang];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the text is still selectable */
    }
  };
  return (
    <div className="parents">
      <p>{text}</p>
      <div className="row">
        <button className="btn" onClick={copy}>{copied ? tr('copied', lang) : tr('copy', lang)}</button>
        <a className="btn btn-quiet" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          {tr('whatsapp', lang)}
        </a>
      </div>
    </div>
  );
}
