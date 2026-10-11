import { useEffect, useRef, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { CATS } from '../lib/colors';
import { tr, type UiKey } from '../lib/ui';
import type { Lang } from '../lib/types';
import type { LayerToggles } from './MapView';

interface Props { layers: LayerToggles; lang: Lang; hasStations: boolean; onChange: (l: LayerToggles) => void; onClose: () => void }

const ROWS: { key: keyof LayerToggles; label: UiKey; sw: CSSProperties }[] = [
  { key: 'smoke', label: 'smoke', sw: { background: 'linear-gradient(90deg, transparent, #ffd6aa)' } },
  { key: 'wind', label: 'wind', sw: { background: 'linear-gradient(90deg, transparent, #96c8ff)' } },
  { key: 'fires', label: 'fires', sw: { background: '#ff6e1e' } },
  { key: 'schools', label: 'schools', sw: { background: '#e03131' } },
  { key: 'stations', label: 'stations', sw: { boxShadow: 'inset 0 0 0 1.5px #e8ecf2' } },
];

export function LayersMenu({ layers, lang, hasStations, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const id = window.setTimeout(() => document.addEventListener('mousedown', away), 0);
    document.addEventListener('keydown', esc);
    return () => { window.clearTimeout(id); document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <motion.div ref={ref} className="layers-pop" role="dialog" aria-label={tr('layers', lang)}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
      <div className="scale" aria-label="CPCB PM2.5 categories">
        {CATS.map((c) => (
          <span key={c.key} style={{ background: c.color, color: c.ink }} title={`${c.en} ≤ ${c.max === Infinity ? '∞' : c.max} µg/m³`}>
            {lang === 'en' ? c.en : c.hi}
          </span>
        ))}
      </div>
      <div className="toggles">
        <label>
          <input type="radio" name="pm" checked={layers.corrected} disabled={!hasStations}
                 onChange={() => onChange({ ...layers, corrected: true })} />
          {tr('corrected', lang)}
        </label>
        <label>
          <input type="radio" name="pm" checked={!layers.corrected} onChange={() => onChange({ ...layers, corrected: false })} />
          {tr('raw', lang)}
        </label>
        <hr />
        {ROWS.map((r) => (
          <label key={r.key}>
            <input type="checkbox" checked={layers[r.key]} onChange={(e) => onChange({ ...layers, [r.key]: e.target.checked })} />
            <i className="sw" style={r.sw} aria-hidden />
            {tr(r.label, lang)}
          </label>
        ))}
      </div>
    </motion.div>
  );
}
