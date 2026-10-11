import { ramp } from './colors';
import type { Bundle } from './types';

function lerp(a: number | null, b: number | null, t: number) {
  if (a == null) return b ?? 0;
  if (b == null) return a;
  return a + (b - a) * t;
}

function frame(b: Bundle, f: number) {
  const i = Math.max(0, Math.min(Math.floor(f), b.pm25.length - 2));
  return { A: b.pm25[i], B: b.pm25[i + 1], t: Math.min(Math.max(f - i, 0), 1) };
}

/** PM2.5 grid at fractional frame f as an RGBA image (north row first), for a linear-filtered BitmapLayer. */
export function heatImage(b: Bundle, f: number, corrected: boolean): ImageData {
  const { nx, ny } = b.meta.grid;
  const { A, B, t } = frame(b, f);
  const img = new ImageData(nx, ny);
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const k = iy * nx + ix;
      const v = lerp(A[k], B[k], t) * (corrected ? b.ratio[k] : 1);
      // Feather the model domain into a soft ellipse so its edge never reads as a box on the map.
      const ex = (ix - (nx - 1) / 2) / ((nx - 1) / 2), ey = (iy - (ny - 1) / 2) / ((ny - 1) / 2);
      const d = Math.hypot(ex, ey);
      const fade = d <= 0.62 ? 1 : d >= 1.05 ? 0 : 1 - (d - 0.62) / 0.43;
      const c = ramp(v);
      c[3] *= fade * fade * (3 - 2 * fade);
      img.data.set(c.map(Math.round), ((ny - 1 - iy) * nx + ix) * 4);
    }
  }
  return img;
}

export function heatBounds(b: Bundle): [number, number, number, number] {
  const { lat_min, lon_min, step, ny, nx } = b.meta.grid;
  const h = step / 2;
  return [lon_min - h, lat_min - h, lon_min + step * (nx - 1) + h, lat_min + step * (ny - 1) + h];
}

/** Bilinear sample of the (optionally corrected) field at a point and fractional frame. */
export function sampleAt(b: Bundle, lat: number, lon: number, f: number, corrected: boolean) {
  const { lat_min, lon_min, step, ny, nx } = b.meta.grid;
  const { A, B, t } = frame(b, f);
  const fy = Math.min(Math.max((lat - lat_min) / step, 0), ny - 1.001);
  const fx = Math.min(Math.max((lon - lon_min) / step, 0), nx - 1.001);
  const y0 = Math.floor(fy), x0 = Math.floor(fx);
  const ty = fy - y0, tx = fx - x0;
  let acc = 0;
  for (const [dy, wy] of [[0, 1 - ty], [1, ty]]) {
    for (const [dx, wx] of [[0, 1 - tx], [1, tx]]) {
      const k = (y0 + dy) * nx + (x0 + dx);
      acc += wy * wx * lerp(A[k], B[k], t) * (corrected ? b.ratio[k] : 1);
    }
  }
  return acc;
}

export interface Segment { s: [number, number]; t: [number, number]; speed: number }

/** Wind arrows (shaft + two head strokes) at every grid node for fractional frame f; 0.04° per m/s. */
export function windArrows(b: Bundle, f: number): Segment[] {
  const { lat_min, lon_min, step, ny, nx } = b.meta.grid;
  const i = Math.max(0, Math.min(Math.floor(f), b.wind_u.length - 2));
  const t = Math.min(Math.max(f - i, 0), 1);
  const out: Segment[] = [];
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const k = iy * nx + ix;
      const u = lerp(b.wind_u[i][k], b.wind_u[i + 1][k], t);
      const v = lerp(b.wind_v[i][k], b.wind_v[i + 1][k], t);
      const speed = Math.hypot(u, v);
      if (speed < 0.3) continue;
      const lat = lat_min + iy * step, lon = lon_min + ix * step;
      const k2 = 0.04 / Math.cos((lat * Math.PI) / 180);
      const tip: [number, number] = [lon + u * k2, lat + v * 0.04];
      out.push({ s: [lon, lat], t: tip, speed });
      const ang = Math.atan2(v, u);
      const head = Math.min(speed * 0.012, 0.08);
      for (const d of [2.6, -2.6]) {
        out.push({ s: tip, t: [tip[0] + Math.cos(ang + d) * head * (k2 / 0.04), tip[1] + Math.sin(ang + d) * head], speed });
      }
    }
  }
  return out;
}

/** Corrected PM2.5 at every school for fractional frame f. */
export function schoolValues(b: Bundle, pts: { lat: number; lon: number }[], f: number, corrected: boolean) {
  return pts.map((p) => sampleAt(b, p.lat, p.lon, f, corrected));
}
