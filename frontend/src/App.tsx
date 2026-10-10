import { useEffect, useMemo, useState } from 'react';
import { MapView, type LayerToggles } from './components/MapView';
import { Timeline } from './components/Timeline';
import { Legend } from './components/Legend';
import { SchoolPanel } from './components/SchoolPanel';
import { Intro } from './components/Intro';
import { useAdvisory, useBundle, useSchools } from './lib/data';
import { sampleAt, schoolValues } from './lib/grid';
import { catOf } from './lib/colors';
import { utc } from './lib/time';
import { tr } from './lib/ui';
import type { Dataset, Lang, School } from './lib/types';

const params = new URLSearchParams(window.location.search);
const DELHI = { lat: 28.61, lon: 77.21 };
const SITE_RE = /^site:(-?\d+\.\d+),(-?\d+\.\d+)$/;

/** Outdoor work sites are places too: 'site:<lat>,<lon>' (same id format as the API and the Telegram bot). */
function siteFromId(id: string | null): School | null {
  const m = id?.match(SITE_RE);
  if (!m) return null;
  const lat = parseFloat(m[1]), lon = parseFloat(m[2]);
  return { id: id!, name: `Work site ${lat.toFixed(3)}°N ${lon.toFixed(3)}°E`, lat, lon, level: '', operator: '', addr: '' };
}

export default function App() {
  const [dataset, setDataset] = useState<Dataset>(params.get('dataset') === 'replay' ? 'replay' : 'live');
  const [lang, setLang] = useState<Lang>(params.get('lang') === 'hi' ? 'hi' : 'en');
  const [placeId, setPlaceId] = useState<string | null>(params.get('school'));
  const [siteMode, setSiteMode] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showPath, setShowPath] = useState(false);
  const [focus, setFocus] = useState<{ lat: number; lon: number; zoom: number; key: number } | null>(null);
  const [layers, setLayers] = useState<LayerToggles>({
    heat: true, corrected: true, smoke: true, wind: false, fires: true, stations: true, schools: true,
  });

  const bundle = useBundle(dataset);
  const schools = useSchools();
  const b = bundle.data;
  const place = schools.data?.find((s) => s.id === placeId) ?? siteFromId(placeId);
  const adv = useAdvisory(placeId, dataset, date, b?.meta.generated);

  useEffect(() => {
    document.documentElement.lang = lang;
    const q = new URLSearchParams();
    if (placeId) q.set('school', placeId);
    if (dataset !== 'live') q.set('dataset', dataset);
    if (lang !== 'en') q.set('lang', lang);
    window.history.replaceState(null, '', q.toString() ? `?${q}` : window.location.pathname);
  }, [placeId, dataset, lang]);

  useEffect(() => {
    if (!b) return;
    setFrame(b.meta.t0_index);
    setDate(null);
    setLayers((l) => ({ ...l, corrected: b.stations.length > 0 }));
  }, [b]);

  // When an advisory arrives, move the map clock to that place's worst hour.
  useEffect(() => {
    if (!adv.data || !b) return;
    const start = utc(b.meta.times[0]).getTime();
    const target = new Date(`${adv.data.date}T00:00:00+05:30`).getTime() + adv.data.worst.hour * 3600000;
    const f = (target - start) / 3600000;
    if (f >= 0 && f <= b.meta.times.length - 1) setFrame(f);
  }, [adv.data, b]);

  useEffect(() => {
    if (!playing || !b) return;
    const n = b.meta.times.length - 1;
    const id = window.setInterval(() => setFrame((f) => (f + 0.25 > n ? 0 : f + 0.25)), 90);
    return () => window.clearInterval(id);
  }, [playing, b]);

  // Every school's PM2.5 at the hour under the slider: drives dot colours, trigger rings and the live counter.
  const q = Math.round(frame * 4) / 4;
  const schoolPm = useMemo(
    () => (b && schools.data ? schoolValues(b, schools.data, q, layers.corrected) : []),
    [b, schools.data, q, layers.corrected],
  );
  const triggeredNow = schoolPm.filter((v) => v > 120).length;

  const selectPlace = (s: School, fly = false) => {
    setPlaceId(s.id);
    setShowPath(false);
    setSiteMode(false);
    if (fly) setFocus({ lat: s.lat, lon: s.lon - 0.6, zoom: 7.6, key: Date.now() });
  };
  const pickSite = (lat: number, lon: number) => selectPlace(siteFromId(`site:${lat.toFixed(4)},${lon.toFixed(4)}`)!);

  const delhi = b ? sampleAt(b, DELHI.lat, DELHI.lon, frame, layers.corrected) : 0;
  const calm = b && dataset === 'live' && Math.max(...b.schools.at_risk) === 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>SmokePath</h1>
          <p>{tr('tagline', lang)}</p>
        </div>
        <div className="seg-group" role="radiogroup" aria-label="Dataset">
          {(['live', 'replay'] as Dataset[]).map((d) => (
            <button key={d} role="radio" aria-checked={dataset === d} className={dataset === d ? 'seg-btn on' : 'seg-btn'}
                    onClick={() => { setDataset(d); setPlaying(false); }}>
              {d === 'live' && <i className="live-dot" aria-hidden />}{tr(d, lang)}
            </button>
          ))}
        </div>
        <button className="btn btn-quiet lang" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} aria-label="Switch language">
          {lang === 'en' ? 'हिंदी' : 'English'}
        </button>
      </header>

      <main className="stage">
        {b && schools.data && (
          <MapView bundle={b} schools={schools.data} schoolPm={schoolPm} frame={frame} layers={layers}
                   selected={place} airPath={showPath && adv.data?.smoke ? adv.data.smoke.path : null}
                   focus={focus} siteMode={siteMode} onSelect={(s) => selectPlace(s)} onPickSite={pickSite} />
        )}
        {bundle.loading && <div className="stage-msg" role="status">{tr('loading', lang)}</div>}
        {bundle.error && <div className="stage-msg error" role="alert">Forecast unavailable: {bundle.error}</div>}
        {b && (
          <>
            <div className="stats" aria-live="polite">
              <div><strong>{b.meta.counts.fires_24h.toLocaleString('en-IN')}</strong><span>{tr('fires24', lang)}</span></div>
              <div>
                <strong style={{ color: triggeredNow ? catOf(250).color : undefined }}>
                  {triggeredNow}<small>/{schools.data?.length ?? '–'}</small>
                </strong>
                <span>{tr('atRiskNow', lang)}</span>
              </div>
              <div><strong style={{ color: catOf(delhi).color }}>{Math.round(delhi)}</strong><span>{tr('delhiNow', lang)} · µg/m³</span></div>
            </div>
            {siteMode && <div className="site-hint" role="status">{tr('siteHint', lang)}</div>}
            {calm && !siteMode && (
              <button className="calm" onClick={() => setDataset('replay')}>
                {lang === 'en' ? 'Air is calm today: early in the burning season. See a real smog day (11 Nov 2025) →'
                  : 'आज हवा शांत है। असली स्मॉग वाला दिन (11 नवंबर 2025) देखें →'}
              </button>
            )}
            <Legend layers={layers} lang={lang} hasStations={b.stations.length > 0} onChange={setLayers} />
            <Timeline bundle={b} frame={frame} playing={playing} lang={lang} onFrame={setFrame} onTogglePlay={() => setPlaying(!playing)} />
          </>
        )}
      </main>

      <aside className="panel">
        {place ? (
          <SchoolPanel school={place} adv={adv.data} loading={adv.loading} error={adv.error} lang={lang}
                       dates={b?.schools.dates ?? []} date={date} showPath={showPath}
                       onDate={setDate} onBack={() => { setPlaceId(null); setShowPath(false); }}
                       onTogglePath={() => setShowPath(!showPath)} />
        ) : (
          <Intro schools={schools.data ?? []} bundle={b} lang={lang} siteMode={siteMode}
                 onSiteMode={setSiteMode} onSelect={selectPlace} />
        )}
      </aside>
    </div>
  );
}
