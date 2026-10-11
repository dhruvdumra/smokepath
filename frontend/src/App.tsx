import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { MapView, type LayerToggles, type Route } from './components/MapView';
import { Timeline } from './components/Timeline';
import { TopBar } from './components/TopBar';
import { LayersMenu } from './components/LayersMenu';
import { Sheet } from './components/Sheet';
import { Ticket } from './components/ticket/Ticket';
import { useAdvisory, useBundle, useSchools } from './lib/data';
import { schoolValues } from './lib/grid';
import { istClock, istDay } from './lib/time';
import { tr } from './lib/ui';
import { useMedia } from './lib/useMedia';
import type { Advisory, Dataset, Lang, School } from './lib/types';

const params = new URLSearchParams(window.location.search);
const SITE_RE = /^site:(-?\d+\.\d+),(-?\d+\.\d+)$/;
const PEEK = 0.44; // phone: the sheet peeks at the route block

/** Outdoor work sites are places too: 'site:<lat>,<lon>' (same id format as the API and the Telegram bot). */
function siteFromId(id: string | null): School | null {
  const m = id?.match(SITE_RE);
  if (!m) return null;
  const lat = parseFloat(m[1]), lon = parseFloat(m[2]);
  return { id: id!, name: `Work site ${lat.toFixed(3)}°N ${lon.toFixed(3)}°E`, lat, lon, level: '', operator: '', addr: '' };
}

/** The advisory's back-trajectory as a forward route with dated stops at the fire districts it crossed. */
function routeOf(adv: Advisory | null, lang: Lang): Route | null {
  const smoke = adv?.smoke;
  if (!adv || !smoke || smoke.level === 'none' || smoke.path.length < 2) return null;
  const back = smoke.path; // hourly points from the arrival backwards
  const arrival = new Date(`${adv.date}T${smoke.hour}:00+05:30`).getTime();
  const stops = smoke.sources.slice(0, 3).map((s) => {
    const left = new Date(arrival - s.hours_before * 3600000);
    return { pos: back[Math.min(s.hours_before, back.length - 1)], label: `${s.district} · ${istDay(left, lang)} ${istClock(left)}` };
  });
  return { key: `${adv.school.id}-${adv.date}-${adv.dataset}`, path: [...back].reverse(), stops };
}

export default function App() {
  const phone = useMedia('(max-width: 860px)');
  const [dataset, setDataset] = useState<Dataset>(params.get('dataset') === 'replay' ? 'replay' : 'live');
  const [lang, setLang] = useState<Lang>(params.get('lang') === 'hi' ? 'hi' : 'en');
  const [placeId, setPlaceId] = useState<string | null>(params.get('school'));
  const [siteMode, setSiteMode] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
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

  // When a ticket is issued, move the map clock to its worst hour.
  useEffect(() => {
    if (!adv.data || !b) return;
    const start = new Date(`${b.meta.times[0]}:00Z`).getTime();
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

  // Every school's PM2.5 at the hour under the slider: dot colours, trigger rings and the live tally.
  const q = Math.round(frame * 4) / 4;
  const schoolPm = useMemo(
    () => (b && schools.data ? schoolValues(b, schools.data, q, layers.corrected) : []),
    [b, schools.data, q, layers.corrected],
  );
  const tally = schoolPm.filter((v) => v > 120).length;

  const route = useMemo(() => (showRoute ? routeOf(adv.data, lang) : null), [adv.data, lang, showRoute]);
  const fit = useMemo(() => {
    if (!place) return null;
    const pts: [number, number][] = route ? [...route.path, [place.lon, place.lat]] : [[place.lon - 0.18, place.lat - 0.12], [place.lon + 0.18, place.lat + 0.12]];
    const lons = pts.map((p) => p[0]), lats = pts.map((p) => p[1]);
    const padding = phone
      ? { top: 70, right: 24, bottom: Math.round(window.innerHeight * PEEK) + 80, left: 24 }
      : { top: 96, right: 408 + 56, bottom: 120, left: 72 };
    return { bounds: [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]] as [[number, number], [number, number]],
      padding, key: `${place.id}-${route?.key ?? 'none'}` };
  }, [place, route, phone]);

  const selectPlace = (s: School) => {
    setPlaceId(s.id);
    setSiteMode(false);
    setShowRoute(true);
    setSheetOpen(false);
  };
  const pickSite = (lat: number, lon: number) => selectPlace(siteFromId(`site:${lat.toFixed(4)},${lon.toFixed(4)}`)!);
  const calm = b && dataset === 'live' && Math.max(...b.schools.at_risk) === 0 && !place;

  const ticket = (
    <Ticket place={place} adv={adv.data} loading={adv.loading} error={adv.error} schools={schools.data ?? []} bundle={b}
            dates={b?.schools.dates ?? []} date={date} lang={lang} siteMode={siteMode} showRoute={showRoute}
            onSiteMode={setSiteMode} onSelect={selectPlace} onDate={setDate}
            onBack={() => { setPlaceId(null); setShowRoute(true); }} onToggleRoute={() => setShowRoute(!showRoute)} />
  );

  return (
    <div className="app" style={{ ['--peek' as string]: `${PEEK * 100}dvh` }}>
      <div className="map-layer">
        {b && schools.data && (
          <MapView bundle={b} schools={schools.data} schoolPm={schoolPm} frame={frame} layers={layers} selected={place}
                   route={route} fit={fit} siteMode={siteMode} onSelect={selectPlace} onPickSite={pickSite} />
        )}
        {bundle.loading && <div className="stage-msg" role="status">{tr('loading', lang)}</div>}
        {bundle.error && <div className="stage-msg" role="alert">Forecast unavailable: {bundle.error}</div>}
      </div>

      <TopBar dataset={dataset} lang={lang} layersOpen={layersOpen} onLayers={() => setLayersOpen(!layersOpen)}
              onDataset={(d) => { setDataset(d); setPlaying(false); }} onLang={setLang} />
      <AnimatePresence>
        {layersOpen && b && (
          <LayersMenu layers={layers} lang={lang} hasStations={b.stations.length > 0} onChange={setLayers} onClose={() => setLayersOpen(false)} />
        )}
      </AnimatePresence>

      {calm && !siteMode && (
        <button className="calm" onClick={() => setDataset('replay')}>
          {tr('calm', lang)}<span className="go">{tr('calmGo', lang)}<ArrowRight aria-hidden /></span>
        </button>
      )}
      {siteMode && <div className="site-hint" role="status">{tr('siteHint', lang)}</div>}

      {b && (
        <Timeline bundle={b} frame={frame} playing={playing} lang={lang} tally={tally} total={schools.data?.length ?? 0}
                  onFrame={setFrame} onTogglePlay={() => setPlaying(!playing)} />
      )}

      {phone ? (
        <Sheet open={sheetOpen} onOpen={setSheetOpen} peek={PEEK}>{ticket}</Sheet>
      ) : (
        <aside className="ticket-dock" aria-label="Smoke ticket">
          <div className="ticket">{ticket}</div>
        </aside>
      )}
    </div>
  );
}
