import { useState } from 'react';
import { subscribeEmail } from '../lib/data';
import { tr } from '../lib/ui';
import type { Lang, School } from '../lib/types';

const BOT = import.meta.env.VITE_TELEGRAM_BOT as string | undefined;

const MSG: Record<string, [string, string]> = {
  sent: ['Check your inbox: AWS sent a one-time verification link. Click it and alerts will start.',
    'अपना इनबॉक्स देखें: AWS ने सत्यापन लिंक भेजा है। उस पर क्लिक करें, फिर अलर्ट शुरू होंगे।'],
  pending: ['Waiting for you to click the verification link AWS emailed you.', 'AWS के ईमेल में सत्यापन लिंक पर क्लिक करें।'],
  verified: ['Subscribed. You will get an email the evening before a bad-air school day.', 'सदस्यता हो गई। ख़राब हवा वाले दिन से पहले शाम को ईमेल मिलेगा।'],
  local: ['Saved (local dev mode).', 'सहेजा गया (लोकल)।'],
};

export function Subscribe({ school, lang }: { school: School; lang: Lang }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<{ busy: boolean; msg: string | null; error: boolean }>({ busy: false, msg: null, error: false });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ busy: true, msg: null, error: false });
    try {
      const r = await subscribeEmail(school.id, email, lang);
      setState({ busy: false, msg: (MSG[r.verification] ?? MSG.verified)[lang === 'en' ? 0 : 1], error: false });
    } catch (err) {
      setState({ busy: false, msg: (err as Error).message, error: true });
    }
  };

  return (
    <div className="subscribe">
      {BOT && (
        <a className="btn btn-primary" href={`https://t.me/${BOT}?start=${school.id}`} target="_blank" rel="noreferrer">
          {tr('telegram', lang)}
        </a>
      )}
      <form onSubmit={submit} className="email-form">
        <label htmlFor="sub-email" className="sr-only">Email</label>
        <input id="sub-email" type="email" required placeholder={tr('emailPh', lang)} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" disabled={state.busy}>{tr('emailBtn', lang)}</button>
      </form>
      {state.msg && <p className={state.error ? 'small error' : 'small muted'} role="status">{state.msg}</p>}
    </div>
  );
}
