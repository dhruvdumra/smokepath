import type { CatKey, Lang } from './types';

// CPCB National AQI categories on PM2.5 (µg/m³) breakpoints, in the official CPCB category colours.
// Ink is the readable text colour on each fill (≥4.5:1).
export const CATS: { key: CatKey; max: number; en: string; hi: string; color: string; ink: string }[] = [
  { key: 'good', max: 30, en: 'Good', hi: 'अच्छा', color: '#00B050', ink: '#0d1117' },
  { key: 'satisfactory', max: 60, en: 'Satisfactory', hi: 'संतोषजनक', color: '#92D050', ink: '#0d1117' },
  { key: 'moderate', max: 90, en: 'Moderate', hi: 'मध्यम', color: '#FFFF00', ink: '#0d1117' },
  { key: 'poor', max: 120, en: 'Poor', hi: 'ख़राब', color: '#FF9900', ink: '#0d1117' },
  { key: 'very_poor', max: 250, en: 'Very Poor', hi: 'बहुत ख़राब', color: '#FF0000', ink: '#0d1117' },
  { key: 'severe', max: Infinity, en: 'Severe', hi: 'गंभीर', color: '#C00000', ink: '#ffffff' },
];

export function catOf(pm: number) {
  return CATS.find((c) => pm <= c.max) ?? CATS[CATS.length - 1];
}
export function catByKey(k: CatKey) {
  return CATS.find((c) => c.key === k)!;
}
export function catLabel(k: CatKey, lang: Lang) {
  const c = catByKey(k);
  return lang === 'en' ? c.en : c.hi;
}

function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgb(pm: number): [number, number, number] {
  return hex(catOf(pm).color);
}

// Continuous ramp for the gridded heat layer: colour follows CPCB bands, opacity grows with concentration.
const RAMP: [number, string, number][] = [
  [0, CATS[0].color, 0.06], [30, CATS[0].color, 0.12], [60, CATS[1].color, 0.2], [90, CATS[2].color, 0.28],
  [120, CATS[3].color, 0.38], [250, CATS[4].color, 0.5], [420, CATS[5].color, 0.62],
];
export function ramp(pm: number): [number, number, number, number] {
  if (pm <= RAMP[0][0]) return [...hex(RAMP[0][1]), RAMP[0][2] * 255] as [number, number, number, number];
  for (let i = 1; i < RAMP.length; i++) {
    const [v1, c1, a1] = RAMP[i];
    if (pm <= v1) {
      const [v0, c0, a0] = RAMP[i - 1];
      const t = (pm - v0) / (v1 - v0);
      const x = hex(c0), y = hex(c1);
      return [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t, (a0 + (a1 - a0) * t) * 255];
    }
  }
  const last = RAMP[RAMP.length - 1];
  return [...hex(last[1]), last[2] * 255] as [number, number, number, number];
}
