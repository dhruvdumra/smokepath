export type Dataset = 'live' | 'replay';
export type Lang = 'en' | 'hi';
export type CatKey = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very_poor' | 'severe';

export interface GridMeta { lat_min: number; lon_min: number; step: number; ny: number; nx: number }

export interface Station {
  id: number; name: string; lat: number; lon: number;
  ratio: number; hours: number; obs_mean: number; cams_mean: number;
}
export interface Fire { lat: number; lon: number; t: string; frp: number }
export interface Cluster { lat: number; lon: number; count: number; frp: number; district: string; state: string; last: string }
export interface Particle { path: [number, number][]; ts: number[]; frp: number; src: string }

export interface Bundle {
  meta: {
    mode: Dataset; t0: string; generated: string; grid: GridMeta; times: string[]; t0_index: number;
    wind_level_hpa: number;
    sources: Record<string, string>;
    counts: { fires_24h: number; stations_used: number; particles: number };
  };
  pm25: (number | null)[][];
  ratio: number[];
  stations: Station[];
  fires: Fire[];
  clusters: Cluster[];
  particles: Particle[];
  schools: { dates: string[]; worst: number[][]; pm24: number[][]; at_risk: number[] };
}

export interface School {
  id: string; name: string; name_hi?: string | null; lat: number; lon: number;
  level: string; operator: string; addr: string;
}

export interface Bilingual { en: string; hi: string }

export interface Slot {
  id: string; kind: string; label_en: string; label_hi: string; start: string; end: string;
  pm: number; cat: CatKey; mode: 'outdoor' | 'indoor' | 'light' | 'protect' | 'moved' | 'moved_light';
  new_start?: string; new_end?: string; pm_new?: number; cat_new?: CatKey;
}

export interface SmokeSource { district: string; state: string; count: number; frp: number; hours_before: number }

export interface Advisory {
  school: School; date: string; dataset: Dataset; dates: string[]; issued: string; t0: string; mode: Dataset;
  hourly: { hour: number; pm: number; raw: number }[];
  correction: { ratio: number; stations_within_15km: number; stations_used: number; confidence: 'high' | 'medium' | 'low'; obs_age_h: number | null };
  smoke: null | { level: 'high' | 'some' | 'none'; fires: number; frp: number; sources: SmokeSource[]; path: [number, number][]; hour: string };
  headline: Bilingual;
  parent_message: Bilingual | null;
  timetable: Slot[];
  actions: ({ key: string; priority: number } & Bilingual)[];
  worst: { hour: number; pm: number; cat: CatKey };
  cleanest: { hour: number; pm: number; cat: CatKey };
  pm24: number; aqi24: number; grap_stage: string | null; changes: number;
}
