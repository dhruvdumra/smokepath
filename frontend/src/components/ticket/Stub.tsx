import { useState } from 'react';
import { Check, Copy, Send, MessageCircle } from 'lucide-react';
import { subscribeEmail } from '../../lib/data';
import { tr } from '../../lib/ui';
import type { Advisory, Lang } from '../../lib/types';

const BOT = import.meta.env.VITE_TELEGRAM_BOT as string | undefined;

const EMAIL_MSG: Record<string, [string, string]> = {
  sent: ['Check your inbox: AWS sent a one-time verification link. Click it and alerts start.', 'इनबॉक्स देखें: AWS ने सत्यापन लिंक भेजा है। उस पर क्लिक करें, फिर अलर्ट शुरू होंगे।'],
  pending: ['Waiting for you to click the verification link AWS emailed you.', 'AWS के ईमेल में सत्यापन लिंक पर क्लिक करें।'],
  verified: ["Subscribed. You'll get an email the evening before a bad-air day.", 'सदस्यता हो गई। ख़राब हवा वाले दिन से पहले शाम को ईमेल मिलेगा।'],
  local: ['Saved (local dev mode).', 'सहेजा गया (लोकल)।'],
};

/** The ticket stub: the message to forward, and the one green action on the screen. */
export function Stub({ adv, lang }: { adv: Advisory; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [state, setState] = useState<{ busy: boolean; msg: string | null; error: boolean }>({ busy: false, msg: null, error: false });
  const text = adv.share_message?.[lang];
  const work = adv.profile === 'work';

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the text is selectable */
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ busy: true, msg: null, error: false });
    try {
      const r = await subscribeEmail(adv.school.id, email, lang);
      setState({ busy: false, msg: (EMAIL_MSG[r.verification] ?? EMAIL_MSG.verified)[lang === 'en' ? 0 : 1], error: false });
    } catch (err) {
      setState({ busy: false, msg: (err as Error).message, error: true });
    }
  };

  return (
    <section className="stub" aria-label={tr(work ? 'workers' : 'parents', lang)}>
      {text && (
        <>
          <h3 className="section-title" style={{ margin: 0 }}>{tr(work ? 'workers' : 'parents', lang)}</h3>
          <p className="message">{text}</p>
          <div className="row">
            <button className="btn" onClick={copy}>{copied ? <Check aria-hidden /> : <Copy aria-hidden />}{copied ? tr('copied', lang) : tr('copy', lang)}</button>
            <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden />{tr('whatsapp', lang)}
            </a>
          </div>
        </>
      )}
      {BOT && (
        <a className="btn btn-primary" href={`https://t.me/${BOT}?start=${encodeURIComponent(adv.school.id)}`} target="_blank" rel="noreferrer">
          <Send aria-hidden />{tr('alerts', lang)}
        </a>
      )}
      {!showEmail ? (
        <button className="more" style={{ justifySelf: 'start' }} onClick={() => setShowEmail(true)}>{tr('orEmail', lang)}</button>
      ) : (
        <form onSubmit={submit} className="email-form">
          <label htmlFor="sub-email" className="sr-only">Email</label>
          <input id="sub-email" className="input" type="email" required autoFocus placeholder={tr('emailPh', lang)} value={email}
                 onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" style={{ height: 44 }} disabled={state.busy}>{tr('emailBtn', lang)}</button>
        </form>
      )}
      {state.msg && <p className={state.error ? 'status-msg error' : 'status-msg'} role="status">{state.msg}</p>}
    </section>
  );
}
