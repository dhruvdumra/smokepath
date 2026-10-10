import { CATS } from '../lib/colors';
import { tr, type UiKey } from '../lib/ui';
import type { Lang } from '../lib/types';
import type { LayerToggles } from './MapView';

interface Props { layers: LayerToggles; lang: Lang; hasStations: boolean; onChange: (l: LayerToggles) => void }

const ROWS: { key: keyof LayerToggles; label: UiKey; swatch: string }[] = [
  { key: 'smoke', label: 'smoke', swatch: 'sw-smoke' },
  { key: 'fires', label: 'fires', swatch: 'sw-fire' },
  { key: 'schools', label: 'schools', swatch: 'sw-school' },
  { key: 'stations', label: 'stations', swatch: 'sw-station' },
];

export function Legend({ layers, lang, hasStations, onChange }: Props) {
  return (
    <div className="legend" aria-label={tr('layers', lang)}>
      <div className="scale" aria-label="PM2.5 categories (CPCB)">
        {CATS.map((c) => (
          <span key={c.key} style={{ background: c.color, color: c.ink }} title={`${c.en}: ≤${c.max === Infinity ? '∞' : c.max} µg/m³`}>
            {lang === 'en' ? c.en : c.hi}
          </span>
        ))}
      </div>
      <fieldset>
        <legend className="sr-only">{tr('layers', lang)}</legend>
        <label className="seg">
          <input type="radio" name="pm" checked={layers.corrected} disabled={!hasStations}
                 onChange={() => onChange({ ...layers, corrected: true })} />
          {tr('corrected', lang)}
        </label>
        <label className="seg">
          <input type="radio" name="pm" checked={!layers.corrected} onChange={() => onChange({ ...layers, corrected: false })} />
          {tr('raw', lang)}
        </label>
        {ROWS.map((r) => (
          <label key={r.key}>
            <input type="checkbox" checked={layers[r.key]} onChange={(e) => onChange({ ...layers, [r.key]: e.target.checked })} />
            <i className={`sw ${r.swatch}`} aria-hidden />
            {tr(r.label, lang)}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
