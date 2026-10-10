import { catOf } from '../lib/colors';
import { tr } from '../lib/ui';
import type { Advisory, Lang } from '../lib/types';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 5); // 05:00-18:00

/** Bars = station-corrected forecast, ticks = raw CAMS, band = school or working hours. */
export function HourlyChart({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const work = adv.profile === 'work';
  const [bandStart, bandEnd] = work ? [8, 17] : [7, 14];
  const vals = HOURS.map((h) => adv.hourly[h]);
  const max = Math.max(150, ...vals.map((v) => Math.max(v.pm, v.raw))) * 1.08;
  const W = 340, H = 132, pad = 22, bw = (W - 8) / HOURS.length;
  const y = (v: number) => H - pad - (v / max) * (H - pad - 14);
  const x0 = 4 + (bandStart - HOURS[0]) * bw;
  const x1 = 4 + (bandEnd - HOURS[0]) * bw;
  const summary = vals.map((v, i) => `${HOURS[i]}:00 ${v.pm}`).join(', ');

  return (
    <figure className="chart">
      <figcaption>
        <span>{tr('hourly', lang)} (µg/m³)</span>
        <span className="legend-inline">
          <i className="sw-band" />{tr(work ? 'workHours' : 'schoolHours', lang)} <i className="sw-raw" />{tr('rawCams', lang)}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Hourly PM2.5: ${summary}`}>
        <rect x={x0} y={4} width={x1 - x0} height={H - pad - 4} className="band" rx={3} />
        {vals.map((v, i) => {
          const x = 4 + i * bw + 2;
          const c = catOf(v.pm);
          return (
            <g key={HOURS[i]}>
              <rect x={x} y={y(v.pm)} width={bw - 4} height={H - pad - y(v.pm)} fill={c.color} rx={2} />
              <line x1={x} x2={x + bw - 4} y1={y(v.raw)} y2={y(v.raw)} className="raw-tick" />
              {HOURS[i] >= bandStart && HOURS[i] < bandEnd && (
                <text x={x + (bw - 4) / 2} y={y(v.pm) - 4} className="bar-val">{v.pm}</text>
              )}
              {i % 2 === 0 && <text x={x + (bw - 4) / 2} y={H - 6} className="axis">{String(HOURS[i]).padStart(2, '0')}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
