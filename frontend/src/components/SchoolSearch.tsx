import { useId, useMemo, useState } from 'react';
import { tr } from '../lib/ui';
import type { Lang, School } from '../lib/types';

interface Props { schools: School[]; lang: Lang; onSelect: (s: School, fly: boolean) => void }

export const QUICK_PICKS = ['w341481077', 'w998316508', 'n11696928200'];

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const x = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return 6371 * Math.hypot(x, y);
}

export function SchoolSearch({ schools, lang, onSelect }: Props) {
  const id = useId();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return schools
      .filter((x) => x.name.toLowerCase().includes(s) || (x.name_hi ?? '').includes(q.trim()))
      .sort((a, b) => Number(!a.name.toLowerCase().startsWith(s)) - Number(!b.name.toLowerCase().startsWith(s)))
      .slice(0, 8);
  }, [q, schools]);

  const pick = (s: School) => {
    setQ('');
    onSelect(s, true);
  };

  const locate = () => {
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        const me = { lat: p.coords.latitude, lon: p.coords.longitude };
        const best = schools.reduce((a, b) => (km(me, a) <= km(me, b) ? a : b));
        if (km(me, best) > 40) setGeoError('You seem to be outside Delhi NCR; search by name instead.');
        else pick(best);
      },
      () => {
        setLocating(false);
        setGeoError('Location permission denied; search by name instead.');
      },
      { timeout: 10000 },
    );
  };

  const picks = QUICK_PICKS.map((pid) => schools.find((s) => s.id === pid)).filter(Boolean) as School[];

  return (
    <div className="search">
      <label htmlFor={id} className="search-label">{tr('findTitle', lang)}</label>
      <div className="search-row">
        <input
          id={id} type="search" autoComplete="off" placeholder={tr('findHint', lang)} value={q}
          role="combobox" aria-expanded={results.length > 0} aria-controls={`${id}-list`}
          aria-activedescendant={results.length ? `${id}-opt-${active}` : undefined}
          onChange={(e) => { setQ(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === 'Enter' && results[active]) pick(results[active]);
            if (e.key === 'Escape') setQ('');
          }}
        />
        <button className="btn btn-quiet" onClick={locate} disabled={locating}>
          {locating ? tr('locating', lang) : tr('useLocation', lang)}
        </button>
      </div>
      {results.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="search-list">
          {results.map((s, i) => (
            <li key={s.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}
                className={i === active ? 'active' : ''} onMouseDown={() => pick(s)} onMouseEnter={() => setActive(i)}>
              <span>{s.name}</span>
              {s.addr && <small>{s.addr}</small>}
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && results.length === 0 && <p className="muted small">No school matches “{q}”.</p>}
      {geoError && <p className="muted small" role="status">{geoError}</p>}
      {picks.length > 0 && !q && (
        <p className="picks">
          <span className="muted small">{tr('tryThese', lang)}:</span>
          {picks.map((s) => <button key={s.id} className="chip" onClick={() => pick(s)}>{s.name}</button>)}
        </p>
      )}
    </div>
  );
}
