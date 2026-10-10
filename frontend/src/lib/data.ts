import { useEffect, useState } from 'react';
import type { Advisory, Bundle, Dataset, School } from './types';

const BUNDLE_URL: Record<Dataset, string> = {
  live: '/data/live/latest.json',
  replay: '/data/replay/nov2025.json',
};

type Async<T> = { data: T | null; error: string | null; loading: boolean };

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((body as { error?: string }).error || `${r.status} ${r.statusText}`);
  return body as T;
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): Async<T> {
  const [state, set] = useState<Async<T>>({ data: null, error: null, loading: true });
  useEffect(() => {
    let live = true;
    set((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => live && set({ data, error: null, loading: false }),
      (e: Error) => live && set({ data: null, error: e.message, loading: false }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useBundle(dataset: Dataset) {
  return useAsync(() => getJson<Bundle>(BUNDLE_URL[dataset]), [dataset]);
}

export function useSchools() {
  return useAsync(async () => (await getJson<{ schools: School[] }>('/data/static/schools.json')).schools, []);
}

export function useAdvisory(school: string | null, dataset: Dataset, date: string | null, generated?: string) {
  return useAsync(async () => {
    if (!school) return null;
    const q = new URLSearchParams({ school, dataset });
    if (date) q.set('date', date);
    return getJson<Advisory>(`/api/advisory?${q}`);
  }, [school, dataset, date, generated]);
}

export function subscribeEmail(school: string, email: string, lang: string) {
  return getJson<{ ok: boolean; verification: string }>('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ school, email, lang }),
  });
}
