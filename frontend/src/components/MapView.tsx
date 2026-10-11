import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { AttributionControl, NavigationControl, useControl, type MapRef } from 'react-map-gl/maplibre';
import { MapboxOverlay, type MapboxOverlayProps } from '@deck.gl/mapbox';
import { BitmapLayer, LineLayer, PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import type { PickingInfo } from '@deck.gl/core';
import { animate, useReducedMotion } from 'motion/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { heatBounds, heatImage, windArrows } from '../lib/grid';
import { rgb } from '../lib/colors';
import { utc } from '../lib/time';
import type { Bundle, School, Station } from '../lib/types';

export interface LayerToggles {
  heat: boolean; corrected: boolean; smoke: boolean; wind: boolean; fires: boolean; stations: boolean; schools: boolean;
}

/** The chosen place's smoke route, departure → arrival, with dated stops at the fire districts it passed. */
export interface Route { key: string; path: [number, number][]; stops: { pos: [number, number]; label: string }[] }

interface Props {
  bundle: Bundle;
  schools: School[];
  /** Corrected PM2.5 at each school at the current frame (same order as `schools`). */
  schoolPm: number[];
  frame: number;
  layers: LayerToggles;
  selected: School | null;
  route: Route | null;
  fit: { bounds: [[number, number], [number, number]]; padding: { top: number; right: number; bottom: number; left: number }; key: string } | null;
  siteMode: boolean;
  onSelect: (s: School) => void;
  onPickSite: (lat: number, lon: number) => void;
}

const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const TRIGGER = 120; // above Poor: the school's advisory changes the timetable
const SKY: [number, number, number] = [141, 214, 255];

function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

function tooltip({ object, layer }: PickingInfo) {
  if (!object || !layer) return null;
  const style = { background: '#10151c', color: '#ffffff', fontSize: '12.5px', borderRadius: '10px', padding: '8px 10px',
    border: '1px solid rgba(255,255,255,0.16)', fontFamily: 'Mona Sans, sans-serif', maxWidth: '260px' };
  if (layer.id === 'schools') return { text: `${(object as School).name}`, style };
  if (layer.id === 'stations') {
    const s = object as Station;
    return { text: `${s.name}\nMeasured ${s.obs_mean} µg/m³ · model ${s.cams_mean} → ×${s.ratio}`, style };
  }
  if (layer.id === 'fires') {
    const f = object as { frp: number; t: string };
    return { text: `VIIRS fire · ${f.frp} MW\n${f.t} UTC`, style };
  }
  return null;
}

export function MapView({ bundle, schools, schoolPm, frame, layers, selected, route, fit, siteMode, onSelect, onPickSite }: Props) {
  const mapRef = useRef<MapRef>(null);
  const reduce = useReducedMotion();
  const t0 = useMemo(() => utc(bundle.meta.t0).getTime(), [bundle]);
  const fires = useMemo(() => bundle.fires.map((f) => ({ ...f, rel: (utc(f.t).getTime() - t0) / 3600000 })), [bundle, t0]);
  const rel = frame - bundle.meta.t0_index; // hours relative to issue time
  const q = Math.round(frame * 4) / 4;
  const image = useMemo(() => heatImage(bundle, q, layers.corrected), [bundle, q, layers.corrected]);
  const wind = useMemo(() => (layers.wind ? windArrows(bundle, Math.round(frame)) : []), [bundle, frame, layers.wind]);
  const triggered = useMemo(() => schools.filter((_, i) => schoolPm[i] > TRIGGER), [schools, schoolPm]);
  const dim = !!selected;

  // Signature interaction: the route draws itself from the fires to the school when a ticket is issued.
  const [draw, setDraw] = useState(0);
  const trip = useMemo(() => (route ? [{ path: route.path, ts: route.path.map((_, i) => i) }] : []), [route]);
  useEffect(() => {
    if (!route) return;
    const end = route.path.length - 1;
    if (reduce) { setDraw(end); return; }
    setDraw(0);
    const c = animate(0, end, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: setDraw });
    return () => c.stop();
  }, [route, reduce]);

  // react-map-gl creates the map asynchronously; a fit requested before 'load' must wait for it.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const m = mapRef.current?.getMap();
    if (!fit || !m || !ready) return;
    m.resize();
    // Padding reserves room for the ticket and timeline; never let it exceed the canvas it is applied to.
    const { clientWidth: w, clientHeight: h } = m.getContainer();
    const sx = Math.min(1, (w * 0.6) / (fit.padding.left + fit.padding.right));
    const sy = Math.min(1, (h * 0.8) / (fit.padding.top + fit.padding.bottom));
    const p = fit.padding;
    m.fitBounds(fit.bounds, {
      padding: { top: p.top * sy, bottom: p.bottom * sy, left: p.left * sx, right: p.right * sx },
      duration: reduce ? 0 : 1100, maxZoom: 9,
    });
  }, [fit, reduce, ready]);

  const deckLayers = [
    layers.heat && new BitmapLayer({
      id: 'heat', image, bounds: heatBounds(bundle), opacity: dim ? 0.8 : 1,
      textureParameters: { minFilter: 'linear', magFilter: 'linear' },
    }),
    layers.wind && new LineLayer({
      id: 'wind', data: wind, getSourcePosition: (d) => d.s, getTargetPosition: (d) => d.t,
      getColor: [150, 200, 255, 150], widthUnits: 'pixels', getWidth: 1.2,
    }),
    layers.smoke && new TripsLayer({
      id: 'smoke', data: bundle.particles, currentTime: rel, trailLength: 10, fadeTrail: true,
      getPath: (d) => d.path, getTimestamps: (d) => d.ts,
      getColor: [255, 214, 170], opacity: dim ? 0.16 : 0.5, widthUnits: 'pixels',
      getWidth: (d) => 1.2 + Math.min(d.frp / 300, 3), capRounded: true, jointRounded: true,
    }),
    layers.fires && new ScatterplotLayer({
      id: 'fires', data: fires.filter((f) => f.rel <= rel && f.rel > rel - 24), pickable: true,
      getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels',
      getRadius: (d) => 1.6 + Math.min(Math.sqrt(d.frp) / 3, 4),
      getFillColor: (d) => [255, 110, 30, (dim ? 120 : 255) * Math.max(0.25, 1 - (rel - d.rel) / 24)],
      updateTriggers: { getFillColor: [rel, dim] },
    }),
    route && new PathLayer({
      id: 'route-base', data: [{ path: route.path }], getPath: (d) => d.path, getColor: [...SKY, 70],
      widthUnits: 'pixels', getWidth: 2, jointRounded: true, capRounded: true,
    }),
    route && new TripsLayer({
      id: 'route-draw', data: trip, currentTime: draw, trailLength: route.path.length, fadeTrail: false,
      getPath: (d) => d.path, getTimestamps: (d) => d.ts, getColor: [...SKY, 255],
      widthUnits: 'pixels', getWidth: 3.5, capRounded: true, jointRounded: true,
    }),
    route && new ScatterplotLayer({
      id: 'route-stops', data: route.stops, getPosition: (d) => d.pos, radiusUnits: 'pixels', getRadius: 5,
      getFillColor: [224, 49, 49, 255], stroked: true, getLineColor: [13, 17, 23, 255], lineWidthUnits: 'pixels', getLineWidth: 2,
    }),
    route && new TextLayer({
      id: 'route-labels', data: route.stops, getPosition: (d) => d.pos, getText: (d) => d.label,
      getSize: 12.5, getColor: [255, 255, 255, 235], fontFamily: 'Mona Sans, sans-serif', fontWeight: 600,
      getPixelOffset: [0, -16], background: true, getBackgroundColor: [13, 17, 23, 210], backgroundPadding: [6, 3],
      characterSet: 'auto',
    }),
    layers.stations && new ScatterplotLayer({
      id: 'stations', data: bundle.stations, pickable: true, stroked: true, filled: true, opacity: dim ? 0.4 : 1,
      getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels', getRadius: 3.5,
      getFillColor: [15, 19, 24, 160], getLineColor: [230, 236, 242, 130], lineWidthUnits: 'pixels', getLineWidth: 1,
    }),
    // Schools whose advisory is triggered at this hour get a ring: the plume switching timetables on.
    layers.schools && new ScatterplotLayer({
      id: 'triggered', data: triggered, getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels', getRadius: 6.5,
      stroked: true, filled: false, getLineColor: [255, 255, 255, dim ? 40 : 110], lineWidthUnits: 'pixels', getLineWidth: 1,
      updateTriggers: { getLineColor: dim },
    }),
    layers.schools && new ScatterplotLayer({
      id: 'schools', data: schools, pickable: true, autoHighlight: true, highlightColor: [255, 255, 255, 200],
      getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels', getRadius: 3.2,
      getFillColor: (_d, { index }) => [...rgb(schoolPm[index] ?? 0), dim ? 110 : 235] as [number, number, number, number],
      updateTriggers: { getFillColor: [schoolPm, dim] },
      onClick: ({ object }) => {
        if (object && !siteMode) onSelect(object as School);
        return !siteMode;
      },
    }),
    selected && new ScatterplotLayer({
      id: 'selected', data: [selected], getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels', getRadius: 10,
      stroked: true, filled: true, getFillColor: [255, 255, 255, 40], getLineColor: [255, 255, 255, 255],
      lineWidthUnits: 'pixels', getLineWidth: 2.5,
    }),
  ].filter(Boolean);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: 76.1, latitude: 29.7, zoom: 6.1 }}
      mapStyle={BASEMAP}
      attributionControl={false}
      style={{ position: 'absolute', inset: 0 }}
      cursor={siteMode ? 'crosshair' : undefined}
      onClick={(e) => siteMode && onPickSite(e.lngLat.lat, e.lngLat.lng)}
      onLoad={(e) => {
        setReady(true);
        if (import.meta.env.DEV) (window as unknown as { __spMap: unknown }).__spMap = e.target;
      }}
    >
      <DeckOverlay layers={deckLayers} getTooltip={tooltip} />
      <NavigationControl position="top-left" showCompass={false} />
      <AttributionControl position="top-left" compact customAttribution="CAMS · NOAA GFS · NASA FIRMS · OpenAQ/CPCB · © OpenStreetMap" />
    </Map>
  );
}
