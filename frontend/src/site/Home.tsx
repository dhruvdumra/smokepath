import { useCallback, useRef, useState, type ReactNode } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { ArrowUpRight, Send } from 'lucide-react';
import { SchoolSearch } from '../components/SchoolSearch';
import { TicketRoute } from '../components/ticket/TicketRoute';
import { StatusList } from '../components/ticket/StatusList';
import { useSchools } from '../lib/data';
import { catOf } from '../lib/colors';
import { Arrivals } from './Arrivals';
import { Globe } from './Globe';
import { t } from './copy';
import { BOT, BOT_URL, BotQR, REPO, SiteFooter, SiteNav, href, useSiteLang } from './shared';
import type { Advisory } from '../lib/types';
import './site.css';
import './home.css';

const EASE = [0.32, 0.72, 0, 1] as const;

/** Content fades up out of a slight blur as it enters the viewport (instant under reduced motion). */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/** Pill CTA with its arrow nested in its own circle. */
export function Cta({ href: to, children, primary, external }: { href: string; children: ReactNode; primary?: boolean; external?: boolean }) {
  return (
    <a className={primary ? 'cta cta-primary' : 'cta'} href={to} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      <span>{children}</span>
      <span className="cta-ico"><ArrowUpRight strokeWidth={1.5} aria-hidden /></span>
    </a>
  );
}

export default function Home() {
  const [lang, setLang] = useSiteLang();
  const schools = useSchools();
  const [sample, setSample] = useState<Advisory | null>(null);
  const callout = useRef<HTMLDivElement>(null);
  const place = useCallback(({ x, y, visible }: { x: number; y: number; visible: boolean }) => {
    const el = callout.current;
    if (!el) return;
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    el.style.opacity = visible ? '1' : '0';
  }, []);

  const num = (v: number) => <b className="proof-num" style={{ color: catOf(v).color }}>{v}</b>;

  return (
    <MotionConfig reducedMotion="user">
      <div className="site home">
        <div className="grain" aria-hidden />
        <SiteNav lang={lang} onLang={setLang} current="home" />

        <main>
          <section className="h-hero">
            <div className="h-hero-copy">
              <Reveal><h1>{t('heroTitle', lang)}</h1></Reveal>
              <Reveal delay={0.08}><p className="lede">{t('heroSub', lang)}</p></Reveal>
              <Reveal delay={0.16} className="bezel h-search">
                <div className="bezel-core">
                  <SchoolSearch schools={schools.data ?? []} lang={lang}
                                onSelect={(s) => { location.href = href('/app', lang, { school: s.id }); }} />
                </div>
              </Reveal>
              <Reveal delay={0.24} className="h-links">
                <Cta href={href('/app', lang, { dataset: 'replay' })} primary>{t('heroReplay', lang)}</Cta>
                <a className="text-link" href={href('/how', lang)}>{t('heroHow', lang)}</a>
              </Reveal>
              <Reveal delay={0.3}><p className="h-meta">{t('heroMeta', lang)}</p></Reveal>
            </div>
            <div className="h-globe">
              <Globe callout={place} />
              <div ref={callout} className="g-callout" aria-hidden>
                <span className="g-leader" />
                <span className="g-card"><b>{t('callout1', lang)}</b><span>{t('callout2', lang)}</span></span>
              </div>
            </div>
          </section>

          <section className="h-board">
            <Reveal className="h-board-copy">
              <h2>{t('boardLead', lang)}</h2>
              <p>{t('boardLeadB', lang)}</p>
            </Reveal>
            <Reveal delay={0.1} className="bezel"><div className="bezel-core board-core"><Arrivals lang={lang} onSample={setSample} /></div></Reveal>
          </section>

          <section className="h-stack">
            <Reveal className="h-stack-copy">
              <h2>{t('stackTitle', lang)}</h2>
              <ol>
                <li>{t('stackA', lang)}</li>
                <li>{t('stackB', lang)}</li>
                <li>{t('stackC', lang)}</li>
              </ol>
              <Cta href={href('/app', lang, { dataset: 'replay', school: 'w341481077' })}>{lang === 'en' ? 'Open this ticket' : 'यह टिकट खोलें'}</Cta>
            </Reveal>
            <div className="cascade" aria-label="Sample artifacts from the 11 Nov 2025 replay">
              <Reveal className="bezel art art-ticket">
                <div className="bezel-core">
                  {sample ? <div className="ticket-inner"><TicketRoute adv={sample} lang={lang} /><StatusList adv={sample} lang={lang} /></div>
                    : <div className="skeleton" style={{ padding: 24 }}><div /><div /><div /></div>}
                </div>
              </Reveal>
              <Reveal delay={0.12} className="bezel art art-parents">
                <div className="bezel-core">
                  <span className="art-label">{t('parentsLabel', lang)}</span>
                  <p>{sample?.share_message?.[lang] ?? '…'}</p>
                </div>
              </Reveal>
              <Reveal delay={0.22} className="bezel art art-tg">
                <div className="bezel-core">
                  <span className="art-label"><Send strokeWidth={1.5} aria-hidden />{t('tgLabel', lang)}</span>
                  <p><b>{sample?.school.name ?? ''}</b></p>
                  <p>{sample?.headline[lang] ?? '…'}</p>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="h-proof">
            <Reveal>
              <p className="proof-line">{t('proofA', lang)} {num(90)}.</p>
              <p className="proof-line">{t('proofB', lang)} {num(281)}.</p>
              <p className="proof-line">{t('proofC', lang)} {num(255)}.</p>
            </Reveal>
            <Reveal delay={0.1} className="proof-foot">
              <p>{t('month', lang)}</p>
              <a className="text-link" href={`${REPO}#validation`} target="_blank" rel="noreferrer">{t('proofLink', lang)}</a>
            </Reveal>
          </section>

          <section className="h-tg" id="telegram">
            <Reveal className="bezel qr-bezel"><div className="bezel-core qr-core"><BotQR size={196} label={`@${BOT}`} /></div></Reveal>
            <Reveal delay={0.1} className="h-tg-copy">
              <h2>{t('scanTitle', lang)}</h2>
              <p>{t('tgBody', lang)}</p>
              <div className="h-links">
                <Cta href={BOT_URL} primary external>{t('tgOpen', lang)}</Cta>
                <a className="text-link" href={href('/how', lang) + '#poster'}>{t('tgPoster', lang)}</a>
              </div>
            </Reveal>
          </section>

          <section className="h-aws">
            <Reveal>
              <h2>{t('awsTitle', lang)}</h2>
              <ul className="aws-list">
                {['Lambda', 'EventBridge Scheduler', 'S3', 'CloudFront', 'API Gateway', 'DynamoDB', 'SES', 'Amazon Bedrock', 'AWS SAM'].map((s) => <li key={s}>{s}</li>)}
              </ul>
              <p className="aws-note">{t('awsBedrock', lang)}</p>
              <ul className="limits-list">
                <li>{t('limit1', lang)}</li>
                <li>{t('limit2', lang)}</li>
                <li>{t('limit3', lang)}</li>
              </ul>
            </Reveal>
          </section>
        </main>

        <SiteFooter lang={lang} />
      </div>
    </MotionConfig>
  );
}
