import { useMemo } from 'react';
import { Pause, Play } from 'lucide-react';
import { catOf } from '../lib/colors';
import { istClock, istDay, utc } from '../lib/time';
import { tr } from '../lib/ui';
import type { Bundle, Lang } from '../lib/types';

interface Props {
  bundle: Bundle;
  frame: number;
  playing: boolean;
  lang: Lang;
  tally: number;
  total: number;
  onFrame: (f: number) => void;
  onTogglePlay: () => void;
}

export function Timeline({ bundle, frame, playing, lang, tally, total, onFrame, onTogglePlay }: Props) {
  const { times, t0_index } = bundle.meta;
  const n = times.length - 1;
  const start = utc(times[0]);
  const now = new Date(start.getTime() + frame * 3600000);
  const lead = Math.round(frame - t0_index);

  // IST midnights: frames sit on UTC :00, so IST midnight (UTC 18:30) falls between two frames.
  const ticks = useMemo(() => {
    const out: { pct: number; label: string }[] = [];
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
        {playing ? <Pause aria-hidden /> : <Play aria-hidden style={{ marginLeft: 2 }} />}
      </button>
      <div className="tl-body">
        <div className="tl-now">
          <strong>{istDay(now, lang)} · {istClock(now)}<span className="hide-sm"> IST</span></strong>
          <span className={lead >= 0 ? 'lead fc' : 'lead'}>{lead >= 0 ? tr('forecast', lang, { h: lead }) : tr('past', lang, { h: -lead })}</span>
        </div>
        <div className="track">
          <div className="track-past" style={{ width: `${t0pct}%` }} />
          <div className="track-t0" style={{ left: `${t0pct}%` }} />
          {ticks.map((t) => <div key={t.pct} className="tick" style={{ left: `${t.pct}%` }}><span>{t.label}</span></div>)}
          <input type="range" min={0} max={n} step={0.25} value={frame} onChange={(e) => onFrame(parseFloat(e.target.value))}
                 aria-label="Time" aria-valuetext={`${istDay(now)} ${istClock(now)} IST`} />
        </div>
      </div>
      <div className="tally" aria-live="polite">
        <strong>
          {tally > 0 && <i className="cat-dot" style={{ background: catOf(260).color, marginRight: 8, verticalAlign: 4 }} aria-hidden />}
          {tally.toLocaleString('en-IN')}<small>/{total.toLocaleString('en-IN')}</small>
        </strong>
        <span className="long">{tr('tallyNow', lang)}</span>
        <span className="short">{tr('tallyShort', lang)}</span>
      </div>
    </div>
  );
}
