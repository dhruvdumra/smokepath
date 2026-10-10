import { useMemo } from 'react';
import { istClock, istDay, utc } from '../lib/time';
import { tr } from '../lib/ui';
import type { Bundle, Lang } from '../lib/types';

interface Props {
  bundle: Bundle;
  frame: number;
  playing: boolean;
  lang: Lang;
  onFrame: (f: number) => void;
  onTogglePlay: () => void;
}

export function Timeline({ bundle, frame, playing, lang, onFrame, onTogglePlay }: Props) {
  const { times, t0_index } = bundle.meta;
  const n = times.length - 1;
  const start = utc(times[0]);
  const now = new Date(start.getTime() + frame * 3600000);
  const lead = Math.round(frame - t0_index);

  // IST midnights inside the window, as tick positions.
  const ticks = useMemo(() => {
    const out: { pct: number; label: string }[] = [];
    // Frames are on UTC :00, so IST midnight (UTC 18:30) falls half-way between two frames.
    for (let h = 0; h < n; h++) {
      const d = new Date(start.getTime() + (h + 0.5) * 3600000);
      if (istClock(d) === '00:00') out.push({ pct: ((h + 0.5) / n) * 100, label: istDay(d, lang) });
    }
    return out;
  }, [times, n, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const t0pct = (t0_index / n) * 100;
  return (
    <div className="timeline" role="group" aria-label="Forecast timeline">
      <button className="play" onClick={onTogglePlay} aria-label={playing ? tr('pause', lang) : tr('play', lang)}>
        {playing ? (
          <svg viewBox="0 0 16 16" aria-hidden><rect x="3" y="2" width="3.5" height="12" rx="1" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" /></svg>
        ) : (
          <svg viewBox="0 0 16 16" aria-hidden><path d="M4 2.5v11l9.5-5.5z" /></svg>
        )}
      </button>
      <div className="timeline-body">
        <div className="timeline-now">
          <strong>{istDay(now, lang)} · {istClock(now)} IST</strong>
          <span className={lead >= 0 ? 'lead lead-fc' : 'lead'}>
            {lead >= 0 ? `${tr('forecast', lang)} +${lead} h` : `${tr('past', lang)} ${lead} h`}
          </span>
        </div>
        <div className="track">
          <div className="track-past" style={{ width: `${t0pct}%` }} />
          <div className="track-t0" style={{ left: `${t0pct}%` }} title={tr('issued', lang)} />
          {ticks.map((t) => (
            <div key={t.pct} className="tick" style={{ left: `${t.pct}%` }}><span>{t.label}</span></div>
          ))}
          <input
            type="range" min={0} max={n} step={0.25} value={frame}
            onChange={(e) => onFrame(parseFloat(e.target.value))}
            aria-label="Time" aria-valuetext={`${istDay(now)} ${istClock(now)} IST`}
          />
        </div>
      </div>
    </div>
  );
}
