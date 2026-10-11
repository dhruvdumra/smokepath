import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { tr } from '../../lib/ui';
import type { Advisory, Lang } from '../../lib/types';

const VALIDATION = 'https://github.com/dhruvdumra/smokepath#validation';

/** Honest about uncertainty: confidence, data age and limits, one tap away from the answer. */
export function Fineprint({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const c = adv.correction;
  const peak = adv.hourly[adv.worst.hour];
  const h = String(adv.worst.hour).padStart(2, '0');
  const days = (c.obs_age_h ?? 0) > 24 ? Math.round((c.obs_age_h ?? 0) / 24) : 0;
  const place = adv.profile === 'work' ? 'site' : 'school';

  const en = c.stations_used === 0
    ? 'No ground stations reported this run, so this is the raw model forecast (~45 km grid). It often under-predicts Delhi smog: treat it as a minimum.'
    : `The global model said ${peak.raw} µg/m³ at ${h}:00. ${c.stations_used} CPCB monitors read differently over the last day, so the forecast here is scaled ×${c.ratio} (${c.stations_within_15km} monitors within 15 km). It is a ${place}-level advisory on a ~45 km model grid, not a street-level reading.${days ? ` Station data is ~${days} days old (the OpenAQ feed is delayed).` : ''}`;
  const hi = c.stations_used === 0
    ? 'इस बार कोई ग्राउंड स्टेशन नहीं मिला, इसलिए यह मूल मॉडल पूर्वानुमान है (~45 किमी ग्रिड)। यह दिल्ली के स्मॉग को अक्सर कम आँकता है।'
    : `मॉडल ने ${h}:00 बजे ${peak.raw} µg/m³ बताया। ${c.stations_used} CPCB मॉनिटरों से तुलना कर यहाँ का पूर्वानुमान ×${c.ratio} किया गया (15 किमी में ${c.stations_within_15km} मॉनिटर)।${days ? ` स्टेशन डेटा ~${days} दिन पुराना है।` : ''}`;

  return (
    <section className="fineprint">
      <button className="more" aria-expanded={open} onClick={() => setOpen(!open)} style={{ justifySelf: 'start' }}>
        {tr('howSure', lang)} · <span className="mono" style={{ fontSize: 11.5 }}>{c.confidence}</span><ChevronDown aria-hidden />
      </button>
      {open && (
        <>
          <p>{lang === 'en' ? en : hi}</p>
          <a href={VALIDATION} target="_blank" rel="noreferrer">{tr('validated', lang)} →</a>
        </>
      )}
    </section>
  );
}
