import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Mark } from '../components/TopBar';
import { t } from './copy';
import type { Lang } from '../lib/types';

export const BOT = (import.meta.env.VITE_TELEGRAM_BOT as string | undefined) || 'coolgrid_bot';
export const BOT_URL = `https://t.me/${BOT}`;
export const REPO = 'https://github.com/dhruvdumra/smokepath';

/** Site pages read the language from ?lang=hi and carry it on every internal link. */
export function useSiteLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => (new URLSearchParams(location.search).get('lang') === 'hi' ? 'hi' : 'en'));
  useEffect(() => {
    document.documentElement.lang = lang;
    const q = new URLSearchParams(location.search);
    if (lang === 'hi') q.set('lang', 'hi'); else q.delete('lang');
    history.replaceState(null, '', `${location.pathname}${q.toString() ? `?${q}` : ''}${location.hash}`);
  }, [lang]);
  return [lang, setLang];
}

export function href(path: string, lang: Lang, extra?: Record<string, string>) {
  const q = new URLSearchParams(extra);
  if (lang === 'hi') q.set('lang', 'hi');
  const s = q.toString();
  return s ? `${path}${path.includes('?') ? '&' : '?'}${s}` : path;
}

export function SiteNav({ lang, onLang, current }: { lang: Lang; onLang: (l: Lang) => void; current: 'home' | 'how' }) {
  return (
    <header className="site-nav">
      <a className="wordmark" href={href('/', lang)} aria-label="SmokePath home"><Mark /><span>SmokePath</span></a>
      <nav aria-label="Site">
        <a href={href('/how', lang)} aria-current={current === 'how' ? 'page' : undefined}>{t('navHow', lang)}</a>
        <a href={BOT_URL} target="_blank" rel="noreferrer">{t('navBot', lang)}</a>
      </nav>
      <span className="spacer" />
      <button className="btn btn-pill" onClick={() => onLang(lang === 'en' ? 'hi' : 'en')}
              aria-label={lang === 'en' ? 'हिंदी में देखें' : 'View in English'}>{lang === 'en' ? 'हिंदी' : 'English'}</button>
      <a className="btn btn-pill nav-map" href={href('/app', lang)}>{t('navMap', lang)}</a>
    </header>
  );
}

export function SiteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="wordmark"><Mark /><span>SmokePath</span></div>
        <p>{t('footerAws', lang)}</p>
        <p>{t('footerData', lang)}</p>
        <nav aria-label="Footer">
          <a href={href('/app', lang)}>{t('navMap', lang)}</a>
          <a href={href('/how', lang)}>{t('navHow', lang)}</a>
          <a href={BOT_URL} target="_blank" rel="noreferrer">@{BOT}</a>
          <a href={REPO} target="_blank" rel="noreferrer">{t('footerCode', lang)}</a>
        </nav>
      </div>
    </footer>
  );
}

/** QR code for the bot, drawn as SVG from the bot URL (no image asset). */
export function BotQR({ size = 168, label }: { size?: number; label: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(BOT_URL, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0d1117', light: '#ffffff' } })
      .then(setSvg).catch(() => setSvg(''));
  }, []);
  return (
    <figure className="qr" style={{ width: size }}>
      <div className="qr-code" style={{ width: size, height: size }} role="img" aria-label={`QR code for ${BOT_URL}`}
           dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>{label}</figcaption>
    </figure>
  );
}
