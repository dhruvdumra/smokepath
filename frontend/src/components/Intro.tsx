import { SchoolSearch } from './SchoolSearch';
import { tr } from '../lib/ui';
import { istClock, istDay, utc } from '../lib/time';
import type { Bundle, Lang, School } from '../lib/types';

interface Props { schools: School[]; bundle: Bundle | null; lang: Lang; onSelect: (s: School, fly: boolean) => void }

export function Intro({ schools, bundle, lang, onSelect }: Props) {
  const issued = bundle ? utc(bundle.meta.t0) : null;
  return (
    <section className="intro">
      <SchoolSearch schools={schools} lang={lang} onSelect={onSelect} />

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
