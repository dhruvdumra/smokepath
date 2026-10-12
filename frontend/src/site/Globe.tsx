import { useEffect, useRef } from 'react';
import { geoDistance, geoEquirectangular, geoGraticule10, geoInterpolate, geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import landTopo from 'world-atlas/land-110m.json';

type LonLat = [number, number];

// Where the story happens: the Punjab–Haryana fire belt and the corridor its smoke takes into Delhi.
const DELHI: LonLat = [77.21, 28.61];
const FIRES: LonLat[] = [[75.84, 30.25], [75.17, 30.82], [75.88, 30.53], [74.95, 30.21], [75.4, 30.0], [76.39, 30.34], [76.4, 29.8], [75.03, 29.53], [74.6, 30.9], [75.86, 30.9]];
const SMOKE_FROM: LonLat = [75.4, 30.6];
const BELT = { lon: [73.6, 79.6], lat: [27.0, 32.6] };
const HOME: LonLat = [78.5, 23.5]; // view centre: India, tilted so the north sits high on the sphere

/** Land dots on an even lattice, found by sampling a pre-rendered equirectangular land mask (fast, no polygon tests). */
function landDots(step = 0.95): LonLat[] {
  const W = 1440, H = 720;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land);
  const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  geoPath(proj, ctx)(land);
  ctx.fill();
  const px = ctx.getImageData(0, 0, W, H).data;
  const out: LonLat[] = [];
  for (let lat = -78; lat <= 82; lat += step) {
    const dl = step / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
    for (let lon = -180; lon < 180; lon += dl) {
      const x = Math.floor(((lon + 180) / 360) * W), y = Math.floor(((90 - lat) / 180) * H);
      if (px[(y * W + x) * 4 + 3] > 128) out.push([lon, lat]);
    }
  }
  return out;
}

interface Props { callout: (pos: { x: number; y: number; visible: boolean }) => void }

export function Globe({ callout }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current!, box = wrap.current!;
    const ctx = el.getContext('2d')!;
    const dots = landDots();
    const inBelt = (p: LonLat) => p[0] >= BELT.lon[0] && p[0] <= BELT.lon[1] && p[1] >= BELT.lat[0] && p[1] <= BELT.lat[1];
    const belt = dots.filter(inBelt), rest = dots.filter((p) => !inBelt(p));
    const smoke = geoInterpolate(SMOKE_FROM, DELHI);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    let drag: { x: number; y: number; lon: number; lat: number } | null = null;
    let offset: LonLat = [0, 0];

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.clientWidth; h = box.clientHeight;
      el.width = w * dpr; el.height = h * dpr;
      el.style.width = `${w}px`; el.style.height = `${h}px`;
    };

    const draw = (t: number) => {
      const r = Math.min(w, h) * 0.43;
      const sway = reduce ? 0 : Math.sin(t / 9000) * 9;
      const centre: LonLat = [HOME[0] + offset[0] + sway, HOME[1] + offset[1]];
      const proj = geoOrthographic().rotate([-centre[0], -centre[1]]).scale(r).translate([w / 2, h / 2]).clipAngle(90);
      const path = geoPath(proj, ctx);
      const front = (p: LonLat) => geoDistance(p, centre) < Math.PI / 2 - 0.02;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // atmosphere and body
      const halo = ctx.createRadialGradient(w / 2, h / 2, r * 0.9, w / 2, h / 2, r * 1.22);
      halo.addColorStop(0, 'rgba(141, 214, 255, 0.10)');
      halo.addColorStop(1, 'rgba(141, 214, 255, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, r * 1.22, 0, Math.PI * 2); ctx.fill();
      const body = ctx.createRadialGradient(w / 2 - r * 0.3, h / 2 - r * 0.35, r * 0.1, w / 2, h / 2, r);
      body.addColorStop(0, '#15202b');
      body.addColorStop(1, '#0b1017');
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)'; ctx.lineWidth = 1; ctx.stroke();

      // wireframe
      ctx.beginPath(); path(geoGraticule10());
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)'; ctx.stroke();

      // land as dots, the smoke belt glowing warm
      const dot = (list: LonLat[], rad: number, style: string) => {
        ctx.beginPath();
        for (const p of list) {
          if (!front(p)) continue;
          const q = proj(p)!;
          ctx.moveTo(q[0] + rad, q[1]); ctx.arc(q[0], q[1], rad, 0, Math.PI * 2);
        }
        ctx.fillStyle = style; ctx.fill();
      };
      dot(rest, 1.05, 'rgba(190, 200, 194, 0.55)');
      dot(belt, 1.7, 'rgba(255, 140, 70, 0.9)');

      // fire clusters
      for (const f of FIRES) {
        if (!front(f)) continue;
        const q = proj(f)!;
        const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 9);
        g.addColorStop(0, 'rgba(255, 120, 40, 0.95)'); g.addColorStop(1, 'rgba(255, 120, 40, 0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], 9, 0, Math.PI * 2); ctx.fill();
      }

      // the smoke streak into Delhi, flowing
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const q = proj(smoke(i / 24))!;
        if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
      }
      ctx.strokeStyle = 'rgba(141, 214, 255, 0.95)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.setLineDash([3, 5]); ctx.lineDashOffset = reduce ? 0 : -t / 60; ctx.stroke(); ctx.setLineDash([]);

      // Delhi
      const d = proj(DELHI)!, dv = front(DELHI);
      if (dv) {
        const pulse = reduce ? 0 : (t / 1400) % 1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * (1 - pulse)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(d[0], d[1], 6 + pulse * 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d[0], d[1], 3.5, 0, Math.PI * 2); ctx.fill();
      }
      callout({ x: d[0], y: d[1], visible: dv });
    };

    const loop = (t: number) => { draw(t); if (!reduce && visible) raf = requestAnimationFrame(loop); };
    size();
    raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => { size(); draw(performance.now()); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    });
    io.observe(box);

    const down = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY, lon: offset[0], lat: offset[1] }; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      offset = [drag.lon - (e.clientX - drag.x) * 0.25, Math.max(-40, Math.min(40, drag.lat + (e.clientY - drag.y) * 0.25))];
      if (reduce) draw(performance.now());
    };
    const up = () => { drag = null; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
    };
  }, [callout]);

  return (
    <div ref={wrap} className="globe">
      <canvas ref={canvas} role="img" aria-label="Dotted globe turned to India: crop-fire clusters in Punjab glow, and a smoke trail runs into Delhi." />
    </div>
  );
}
