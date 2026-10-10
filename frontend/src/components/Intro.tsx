import { useState } from 'react';
import { SchoolSearch } from './SchoolSearch';
import { tr } from '../lib/ui';
import { istClock, istDay, utc } from '../lib/time';
import type { Bundle, Lang, School } from '../lib/types';

interface Props {
  schools: School[]; bundle: Bundle | null; lang: Lang; siteMode: boolean;
  onSiteMode: (on: boolean) => void; onSelect: (s: School, fly: boolean) => void;
}

export function Intro({ schools, bundle, lang, siteMode, onSiteMode, onSelect }: Props) {
  const issued = bundle ? utc(bundle.meta.t0) : null;
  const [geoError, setGeoError] = useState<string | null>(null);
  const siteHere = () => {
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const id = `site:${p.coords.latitude.toFixed(4)},${p.coords.longitude.toFixed(4)}`;
        onSelect({ id, name: `Work site ${p.coords.latitude.toFixed(3)}°N ${p.coords.longitude.toFixed(3)}°E`,
          lat: p.coords.latitude, lon: p.coords.longitude, level: '', operator: '', addr: '' }, true);
      },
      () => setGeoError('Location permission denied; click the map instead.'),
      { timeout: 10000 },
    );
  };
  return (
    <section className="intro">
      <div className="mode" role="radiogroup" aria-label={tr('checkWhat', lang)}>
        {([false, true] as const).map((on) => (
          <button key={String(on)} role="radio" aria-checked={siteMode === on}
                  className={siteMode === on ? 'mode-btn on' : 'mode-btn'} onClick={() => onSiteMode(on)}>
            {tr(on ? 'checkSite' : 'checkSchool', lang)}
          </button>
        ))}
      </div>

      {siteMode ? (
        <div className="site-mode">
          <p>{tr('siteIntro', lang)}</p>
          <p className="muted small">{tr('siteHint', lang)}</p>
          <button className="btn" onClick={siteHere}>{tr('siteHere', lang)}</button>
          {geoError && <p className="muted small" role="status">{geoError}</p>}
        </div>
      ) : (
        <SchoolSearch schools={schools} lang={lang} onSelect={onSelect} />
      )}

      <h2>{tr('howTitle', lang)}</h2>
      <ol className="how">
        <li>{tr('how1', lang)}</li>
        <li>{tr('how2', lang)}</li>
        <li>{tr('how3', lang)}</li>
      </ol>

      <div className="note">
        <p>
          {lang === 'en'
            ? <>IITM's Decision Support System forecasts how much stubble burning adds to Delhi's air, for policymakers. SmokePath turns that kind of forecast into <b>tomorrow's timetable for one school</b>.</>
            : <>IITM का निर्णय सहायता तंत्र नीति-निर्माताओं के लिए बताता है कि पराली जलाने से दिल्ली की हवा कितनी बिगड़ती है। SmokePath उसी तरह के पूर्वानुमान को <b>एक स्कूल की कल की समय-सारणी</b> में बदलता है।</>}
        </p>
      </div>

      {bundle && issued && (
        <dl className="sources-list">
          <dt>{tr('issued', lang)}</dt><dd>{istDay(issued, lang)} · {istClock(issued)} IST</dd>
          <dt>PM2.5</dt><dd>{bundle.meta.sources.pm25}</dd>
          <dt>Correction</dt><dd>{bundle.meta.sources.stations === 'none' ? 'not available this run' : `${bundle.stations.length} stations · ${bundle.meta.sources.stations}`}</dd>
          <dt>Wind</dt><dd>{bundle.meta.sources.wind}, {bundle.meta.wind_level_hpa} hPa</dd>
          <dt>Fires</dt><dd>{bundle.meta.sources.fires}</dd>
        </dl>
      )}

      <p className="aws small muted">
        Built on AWS: Lambda · EventBridge Scheduler · S3 · CloudFront · API Gateway · DynamoDB · SES · SSM, with
        OpenAQ from the AWS Open Data Registry. Deployed with AWS SAM.
      </p>
    </section>
  );
}
