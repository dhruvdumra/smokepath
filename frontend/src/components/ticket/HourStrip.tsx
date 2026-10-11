import { catOf } from '../../lib/colors';
import { tr } from '../../lib/ui';
import type { Advisory, Lang } from '../../lib/types';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 5); // 05:00–18:00

/** The day on a visible hour grid: bars are the corrected forecast, dashes the raw model, the band the school day. */
export function HourStrip({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const work = adv.profile === 'work';
  const [b0, b1] = work ? [8, 17] : [7, 14];
  const vals = HOURS.map((h) => adv.hourly[h]);
  const max = Math.max(150, ...vals.map((v) => Math.max(v.pm, v.raw))) * 1.1;
  const W = 360, H = 92, base = H - 18, top = 14, cw = W / HOURS.length;
  const y = (v: number) => base - (v / max) * (base - top);
  const summary = vals.map((v, i) => `${HOURS[i]}:00 ${v.pm}`).join(', ');

  return (
    <figure className="strip">
      <figcaption className="strip-head">
        <span className="section-title" style={{ margin: 0 }}>{tr('hourly', lang)}</span>
        <span className="strip-key">
          <span><i className="key-band" />{tr(work ? 'workHours' : 'schoolHours', lang)}</span>
          <span><i className="key-raw" />{tr('rawCams', lang)}</span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`PM2.5 µg/m³ by hour: ${summary}`}>
        <rect className="band" x={(b0 - HOURS[0]) * cw} y={0} width={(b1 - b0) * cw} height={base} rx={4} />
        {HOURS.map((h, i) => <line key={h} className="grid-line" x1={i * cw} x2={i * cw} y1={0} y2={base} />)}
        <line className="grid-line" x1={0} x2={W} y1={base} y2={base} />
        {vals.map((v, i) => {
          const x = i * cw + 4;
          const w = cw - 8;
          const inBand = HOURS[i] >= b0 && HOURS[i] < b1;
          return (
            <g key={HOURS[i]}>
              <rect x={x} y={y(v.pm)} width={w} height={Math.max(base - y(v.pm), 1)} rx={3} fill={catOf(v.pm).color} />
              <line className="raw" x1={x - 1} x2={x + w + 1} y1={y(v.raw)} y2={y(v.raw)} />
              {inBand && <text className="val" x={x + w / 2} y={y(v.pm) - 4}>{v.pm}</text>}
              {i % 2 === 0 && <text x={i * cw + cw / 2} y={H - 4}>{String(HOURS[i]).padStart(2, '0')}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
