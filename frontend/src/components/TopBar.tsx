import { CircleHelp, Layers } from 'lucide-react';
import { tr } from '../lib/ui';
import type { Dataset, Lang } from '../lib/types';

interface Props {
  dataset: Dataset;
  lang: Lang;
  layersOpen: boolean;
  onDataset: (d: Dataset) => void;
  onLang: (l: Lang) => void;
  onLayers: () => void;
}

export function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path d="M5 23c3.4 0 4.6-3.2 7.8-3.2S17 23 20 23s4.8-5.8 6.2-9.6" fill="none" stroke="#8dd6ff" strokeWidth="2.4"
            strokeLinecap="round" strokeDasharray="0.1 4.4" />
      <circle cx="5" cy="23" r="2.6" fill="#e03131" />
      <circle cx="26.2" cy="12.6" r="3.4" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function TopBar({ dataset, lang, layersOpen, onDataset, onLang, onLayers }: Props) {
  return (
    <header className="topbar">
      <a className="wordmark" href="/" aria-label="SmokePath home"><Mark /><span>SmokePath</span></a>
      <div className="pills" role="radiogroup" aria-label="Forecast">
        {(['live', 'replay'] as Dataset[]).map((d) => (
          <button key={d} role="radio" aria-checked={dataset === d} className="pill" onClick={() => onDataset(d)}>
            {d === 'live' && <i className="dot" aria-hidden />}
            {d === 'replay' ? <><span className="hide-sm">{tr('replay', lang)}</span><span className="show-sm">{tr('replayShort', lang)}</span></> : tr(d, lang)}
          </button>
        ))}
      </div>
      <span className="spacer" />
      <a className="btn btn-ghost btn-pill" href={lang === 'hi' ? '/how?lang=hi' : '/how'}>
        <CircleHelp aria-hidden /><span className="hide-sm">{lang === 'en' ? 'How to use' : 'कैसे इस्तेमाल करें'}</span>
      </a>
      <button className="btn btn-ghost btn-pill" aria-expanded={layersOpen} onClick={onLayers}>
        <Layers aria-hidden /><span className="hide-sm">{tr('layers', lang)}</span>
      </button>
      <button className="btn btn-pill" onClick={() => onLang(lang === 'en' ? 'hi' : 'en')} lang={lang === 'en' ? 'hi' : 'en'}
              aria-label={lang === 'en' ? 'हिंदी में देखें' : 'View in English'}>
        {lang === 'en' ? 'हिंदी' : 'English'}
      </button>
    </header>
  );
}
