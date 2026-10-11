import { useState } from 'react';
import { HardHat, LocateFixed } from 'lucide-react';
import { SchoolSearch } from '../SchoolSearch';
import { tr } from '../../lib/ui';
import type { Bundle, Lang, School } from '../../lib/types';

interface Props {
  schools: School[]; bundle: Bundle | null; lang: Lang; siteMode: boolean;
  onSiteMode: (on: boolean) => void; onSelect: (s: School, fly: boolean) => void;
}

/** An unissued ticket: the fires are already departing; the visitor fills in TO. */
export function TicketIntro({ schools, bundle, lang, siteMode, onSiteMode, onSelect }: Props) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const fires = bundle?.meta.counts.fires_24h ?? 0;

  const siteHere = () => {
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lon } = p.coords;
        onSelect({ id: `site:${lat.toFixed(4)},${lon.toFixed(4)}`, name: `Work site ${lat.toFixed(3)}°N ${lon.toFixed(3)}°E`,
          lat, lon, level: '', operator: '', addr: '' }, true);
      },
      () => setGeoError('Location is blocked. Tap the map instead.'),
      { timeout: 10000 },
    );
  };

  return (
    <>
      <div>
        <h1 className="intro-title">{tr('introTitle', lang)}</h1>
        <p className="intro-sub">{tr('introSub', lang)}</p>
      </div>

      <section className="route" aria-label="Smoke route">
        <div className="route-row">
          <div className="route-rail"><i className="route-pin" /></div>
          <div>
            <div className="field-label">{tr('from', lang)}</div>
            <div className="field-value">{tr('firesFrom', lang)}</div>
            <div className="field-note">{tr('firesCount', lang, { n: fires.toLocaleString('en-IN') })}</div>
          </div>
        </div>
        <div className="route-row">
          <div className="route-rail"><i className="route-pin to" /></div>
          <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
            <div className="field-label">{tr('to', lang)}</div>
            <div className="pills" role="radiogroup" aria-label={tr('to', lang)} style={{ justifySelf: 'start' }}>
              <button role="radio" aria-checked={!siteMode} className="pill" onClick={() => onSiteMode(false)}>{tr('school', lang)}</button>
              <button role="radio" aria-checked={siteMode} className="pill" onClick={() => onSiteMode(true)}>
                <HardHat size={15} aria-hidden />{tr('site', lang)}
              </button>
            </div>
            {siteMode ? (
              <div style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
                <p className="hint">{tr('siteIntro', lang)}</p>
                <button className="btn" onClick={siteHere}><LocateFixed aria-hidden />{tr('siteHere', lang)}</button>
                {geoError && <p className="hint" role="status">{geoError}</p>}
              </div>
            ) : (
              <SchoolSearch schools={schools} lang={lang} onSelect={onSelect} />
            )}
          </div>
        </div>
        <div className="arrival">
          <div>
            <div className="field-label">{tr('arrives', lang)}</div>
            <div className="arrival-time" style={{ color: 'var(--fog)' }} aria-hidden>—</div>
          </div>
        </div>
      </section>

      <div className="perf" aria-hidden />
      <p className="fineprint">{tr('credit', lang)}</p>
    </>
  );
}
