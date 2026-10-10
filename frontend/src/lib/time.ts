import type { Lang } from './types';

const IST_MS = 5.5 * 3600 * 1000;
const DAYS_HI = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

/** Naive-UTC ISO hour ("2024-11-12T06:00") -> Date. */
export function utc(iso: string) {
  return new Date(iso + ':00Z');
}

/** Shift to IST and read the UTC fields, which avoids depending on the viewer's own timezone. */
function ist(d: Date) {
  return new Date(d.getTime() + IST_MS);
}

export function istClock(d: Date) {
  const x = ist(d);
  return `${String(x.getUTCHours()).padStart(2, '0')}:${String(x.getUTCMinutes()).padStart(2, '0')}`;
}

export function istDay(d: Date, lang: Lang = 'en') {
  const x = ist(d);
  if (lang === 'hi') return `${DAYS_HI[x.getUTCDay()]}, ${x.getUTCDate()}/${x.getUTCMonth() + 1}`;
  return x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** 'YYYY-MM-DD' (an IST date) -> label. */
export function dateLabel(d: string, lang: Lang = 'en') {
  return istDay(new Date(d + 'T00:00:00+05:30'), lang);
}

export function hoursBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 3600000;
}
