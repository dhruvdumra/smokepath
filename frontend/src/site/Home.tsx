import { useState } from 'react';
import { ArrowRight, Send } from 'lucide-react';
import { SchoolSearch } from '../components/SchoolSearch';
import { TicketRoute } from '../components/ticket/TicketRoute';
import { StatusList } from '../components/ticket/StatusList';
import { useSchools } from '../lib/data';
import { catOf } from '../lib/colors';
import { Arrivals } from './Arrivals';
import { t } from './copy';
import { BOT, BOT_URL, BotQR, REPO, SiteFooter, SiteNav, href, useSiteLang } from './shared';
import type { Advisory } from '../lib/types';
import './site.css';

const PROOF = [
  { key: 'measured', v: 281 },
  { key: 'rawModel', v: 90 },
  { key: 'ours', v: 255 },
] as const;

export default function Home() {
  const [lang, setLang] = useSiteLang();
  const schools = useSchools();
  const [sample, setSample] = useState<Advisory | null>(null);

  return (
    <div className="site">
      <SiteNav lang={lang} onLang={setLang} current="home" />

      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <h1>{t('heroTitle', lang)}</h1>
            <p className="lede">{t('heroSub', lang)}</p>
            <div className="hero-search">
              <span className="field-label">{t('heroFind', lang)}</span>
              <SchoolSearch schools={schools.data ?? []} lang={lang}
                            onSelect={(s) => { location.href = href('/app', lang, { school: s.id }); }} />
            </div>
            <a className="text-link" href={href('/app', lang, { dataset: 'replay' })}>
              {t('heroReplay', lang)}<ArrowRight aria-hidden />
            </a>
          </div>
          <Arrivals lang={lang} onSample={setSample} />
        </section>

        <section className="steps wrap" aria-labelledby="steps-title">
          <div>
            <h2 id="steps-title">{t('stepsTitle', lang)}</h2>
            <ol className="step-list">
              <li><h3>{t('step1', lang)}</h3><p>{t('step1b', lang)}</p></li>
              <li><h3>{t('step2', lang)}</h3><p>{t('step2b', lang)}</p></li>
              <li><h3>{t('step3', lang)}</h3><p>{t('step3b', lang)}</p></li>
            </ol>
          </div>
          <figure className="ticket-preview" aria-label="A real ticket from the 11 Nov 2025 replay">
            {sample ? (
              <div className="ticket-inner">
                <TicketRoute adv={sample} lang={lang} />
                <StatusList adv={sample} lang={lang} />
              </div>
            ) : <div className="skeleton" style={{ padding: 24 }}><div /><div /><div /></div>}
          </figure>
        </section>

        <section className="telegram wrap" id="telegram" aria-labelledby="tg-title">
          <div className="tg-copy">
            <h2 id="tg-title">{t('tgTitle', lang)}</h2>
            <p>{t('tgBody', lang)}</p>
            <div className="tg-actions">
              <BotQR label={t('tgScan', lang)} />
              <div className="tg-buttons">
                <a className="btn btn-primary" href={BOT_URL} target="_blank" rel="noreferrer"><Send aria-hidden />{t('tgOpen', lang)}</a>
                <span className="bot-handle">@{BOT}</span>
                <a className="text-link" href={href('/how', lang) + '#poster'}>{t('tgPoster', lang)}<ArrowRight aria-hidden /></a>
              </div>
            </div>
          </div>
          <div className="chat" aria-label="Sample Telegram conversation">
            <p className="bubble me">{t('chatYou', lang)}</p>
            <div className="bubble bot">
              {sample ? (
                <>
                  <strong>{sample.school.name}</strong>
                  <span>{sample.headline[lang]}</span>
                  <span className="mono-list">
                    {sample.timetable.slice(0, 4).map((s) => (
                      <span key={s.id}><i className="cat-dot" style={{ background: catOf(s.pm).color }} aria-hidden /> {s.start} {lang === 'en' ? s.label_en : s.label_hi}</span>
                    ))}
                  </span>
                </>
              ) : <span className="muted">…</span>}
            </div>
          </div>
        </section>

        <section className="proof wrap" aria-labelledby="proof-title">
          <h2 id="proof-title">{t('proofTitle', lang)}</h2>
          <p className="lede">{t('proofBody', lang)}</p>
          <dl className="bars">
            {PROOF.map((p) => (
              <div key={p.key} className="bar-row">
                <dt>{t(p.key, lang)}</dt>
                <dd>
                  <span className="bar" style={{ width: `${(p.v / 300) * 100}%`, background: catOf(p.v).color }} />
                  <span className="bar-v">{p.v} µg/m³</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="month">{t('month', lang)}</p>
          <a className="text-link" href={`${REPO}#validation`} target="_blank" rel="noreferrer">{t('proofLink', lang)}<ArrowRight aria-hidden /></a>
        </section>

        <section className="limits wrap" aria-labelledby="limits-title">
          <h2 id="limits-title">{t('limitsTitle', lang)}</h2>
          <ul>
            <li>{t('limit1', lang)}</li>
            <li>{t('limit2', lang)}</li>
            <li>{t('limit3', lang)}</li>
          </ul>
        </section>
      </main>

      <SiteFooter lang={lang} />
    </div>
  );
}
