import type { CatKey, Lang } from './types';

// CPCB National AQI categories on PM2.5 (µg/m³) breakpoints.
export const CATS: { key: CatKey; max: number; en: string; hi: string; color: string; ink: string }[] = [
  { key: 'good', max: 30, en: 'Good', hi: 'अच्छा', color: '#2f9e44', ink: '#fff' },
  { key: 'satisfactory', max: 60, en: 'Satisfactory', hi: 'संतोषजनक', color: '#8cc63f', ink: '#111' },
  { key: 'moderate', max: 90, en: 'Moderate', hi: 'मध्यम', color: '#f2d43b', ink: '#111' },
  { key: 'poor', max: 120, en: 'Poor', hi: 'ख़राब', color: '#f08c2a', ink: '#111' },
  { key: 'very_poor', max: 250, en: 'Very Poor', hi: 'बहुत ख़राब', color: '#e03131', ink: '#fff' },
  { key: 'severe', max: Infinity, en: 'Severe', hi: 'गंभीर', color: '#9c1c4a', ink: '#fff' },
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
  [0, '#2f9e44', 0.06], [30, '#2f9e44', 0.12], [60, '#8cc63f', 0.22], [90, '#f2d43b', 0.32],
  [120, '#f08c2a', 0.42], [250, '#e03131', 0.55], [420, '#9c1c4a', 0.68],
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
