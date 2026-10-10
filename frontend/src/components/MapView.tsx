import { useEffect, useMemo, useRef } from 'react';
import Map, { NavigationControl, useControl, type MapRef } from 'react-map-gl/maplibre';
import { MapboxOverlay, type MapboxOverlayProps } from '@deck.gl/mapbox';
import { BitmapLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import type { PickingInfo } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import { heatBounds, heatImage } from '../lib/grid';
import { rgb } from '../lib/colors';
import { utc } from '../lib/time';
import type { Bundle, School, Station } from '../lib/types';

export interface LayerToggles { heat: boolean; corrected: boolean; smoke: boolean; fires: boolean; stations: boolean; schools: boolean }

interface Props {
  bundle: Bundle;
  schools: School[];
  frame: number;
  dateIndex: number;
  layers: LayerToggles;
  selected: School | null;
  airPath: [number, number][] | null;
  focus: { lat: number; lon: number; zoom: number; key: number } | null;
  onSelect: (s: School) => void;
}

const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

function tooltip({ object, layer }: PickingInfo) {
  if (!object || !layer) return null;
  const style = { background: '#0f1318', color: '#e8ecf2', fontSize: '12px', borderRadius: '6px', padding: '8px 10px', maxWidth: '260px' };
  if (layer.id === 'schools') return { text: `${(object as School).name}\nclick for tomorrow's timetable`, style };
  if (layer.id === 'stations') {
    const s = object as Station;
    return { text: `${s.name}\nObserved avg ${s.obs_mean} µg/m³ vs CAMS ${s.cams_mean}\nCorrection ×${s.ratio}`, style };
  }
  if (layer.id === 'fires') {
    const f = object as { frp: number; t: string };
    return { text: `VIIRS fire, ${f.frp} MW\n${f.t} UTC`, style };
  }
  return null;
}

export function MapView({ bundle, schools, frame, dateIndex, layers, selected, airPath, focus, onSelect }: Props) {
  const mapRef = useRef<MapRef>(null);
  const t0 = useMemo(() => utc(bundle.meta.t0).getTime(), [bundle]);
  const fires = useMemo(() => bundle.fires.map((f) => ({ ...f, rel: (utc(f.t).getTime() - t0) / 3600000 })), [bundle, t0]);
  const rel = frame - bundle.meta.t0_index; // hours relative to issue time
  const q = Math.round(frame * 4) / 4;
  const image = useMemo(() => heatImage(bundle, q, layers.corrected), [bundle, q, layers.corrected]);
  const worst = bundle.schools.worst[dateIndex] ?? [];

  useEffect(() => {
    if (focus) mapRef.current?.flyTo({ center: [focus.lon, focus.lat], zoom: focus.zoom, duration: 1200 });
  }, [focus]);

  const deckLayers = [
    layers.heat && new BitmapLayer({
      id: 'heat', image, bounds: heatBounds(bundle),
      textureParameters: { minFilter: 'linear', magFilter: 'linear' },
    }),
    layers.smoke && new TripsLayer({
      id: 'smoke', data: bundle.particles, currentTime: rel, trailLength: 10, fadeTrail: true,
      getPath: (d) => d.path, getTimestamps: (d) => d.ts,
      getColor: [255, 214, 170], opacity: 0.5, widthUnits: 'pixels',
      getWidth: (d) => 1.2 + Math.min(d.frp / 300, 3), capRounded: true, jointRounded: true,
    }),
    layers.fires && new ScatterplotLayer({
      id: 'fires', data: fires.filter((f) => f.rel <= rel && f.rel > rel - 24), pickable: true,
      getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels',
      getRadius: (d) => 1.6 + Math.min(Math.sqrt(d.frp) / 3, 4),
      getFillColor: (d) => [255, 110, 30, 255 * Math.max(0.25, 1 - (rel - d.rel) / 24)],
      updateTriggers: { getFillColor: rel },
    }),
    airPath && new PathLayer({
      id: 'air-path', data: [{ path: airPath }], getPath: (d) => d.path, getColor: [255, 255, 255, 230],
      widthUnits: 'pixels', getWidth: 2.5, jointRounded: true,
    }),
    layers.stations && new ScatterplotLayer({
      id: 'stations', data: bundle.stations, pickable: true, stroked: true, filled: true,
      getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels', getRadius: 4.5,
      getFillColor: [15, 19, 24, 200], getLineColor: [230, 236, 242, 230], lineWidthUnits: 'pixels', getLineWidth: 1.5,
    }),
    layers.schools && new ScatterplotLayer({
      id: 'schools', data: schools, pickable: true, autoHighlight: true, highlightColor: [255, 255, 255, 200],
      getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels', getRadius: 3.2,
      getFillColor: (_d, { index }) => [...rgb(worst[index] ?? 0), 235] as [number, number, number, number],
      updateTriggers: { getFillColor: [dateIndex, bundle.meta.generated] },
      onClick: ({ object }) => object && onSelect(object as School),
    }),
    selected && new ScatterplotLayer({
      id: 'selected', data: [selected], getPosition: (d) => [d.lon, d.lat], radiusUnits: 'pixels', getRadius: 9,
      stroked: true, filled: false, getLineColor: [255, 255, 255, 255], lineWidthUnits: 'pixels', getLineWidth: 2.5,
    }),
  ].filter(Boolean);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: 76.3, latitude: 29.6, zoom: 6.1 }}
      mapStyle={BASEMAP}
      attributionControl={{ compact: true, customAttribution: 'CAMS · NOAA GFS · NASA FIRMS · OpenAQ/CPCB · © OpenStreetMap' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <DeckOverlay layers={deckLayers} getTooltip={tooltip} />
      <NavigationControl position="bottom-right" showCompass={false} />
    </Map>
  );
}
