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
      img.data.set(ramp(v).map(Math.round), ((ny - 1 - iy) * nx + ix) * 4);
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
