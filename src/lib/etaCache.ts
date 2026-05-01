// Lightweight ETA cache + robust fallback so the UI feels stable even when OSRM is flaky.
// Cache lives in sessionStorage; rounded coords (~110m grid) keep keys stable across small jitters.

export interface EtaResult {
  km: number;
  min: number;
  source: 'osrm' | 'fallback' | 'cache';
}

const KEY = 'eta-cache-v1';
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const ROUND = 1000; // 3 decimals (~110m)

type Stored = Record<string, { km: number; min: number; t: number }>;

function read(): Stored {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function write(s: Stored) {
  try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { }
}
function makeKey(a: [number, number], b: [number, number]) {
  const r = (n: number) => Math.round(n * ROUND) / ROUND;
  return `${r(a[0])},${r(a[1])}->${r(b[0])},${r(b[1])}`;
}

// Haversine straight-line distance.
export function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Smarter fallback: roads are not straight; multiply by a detour factor that
// scales with distance, then estimate time using city/highway speed bands.
export function estimateFallback(a: [number, number], b: [number, number]): EtaResult {
  const straight = haversineKm(a, b);
  // Detour factor: ~1.35 in dense city, drops slightly for long trips.
  const detour = straight < 3 ? 1.4 : straight < 15 ? 1.3 : 1.2;
  const km = straight * detour;
  // Speed: 22 km/h short city, 35 km/h medium, 55 km/h long-distance.
  const speed = km < 3 ? 22 : km < 15 ? 35 : 55;
  const min = (km / speed) * 60;
  return { km, min, source: 'fallback' };
}

export async function getEta(
  a: [number, number],
  b: [number, number],
  signal?: AbortSignal,
): Promise<EtaResult> {
  const key = makeKey(a, b);
  const store = read();
  const hit = store[key];
  if (hit && Date.now() - hit.t < TTL_MS) {
    return { km: hit.km, min: hit.min, source: 'cache' };
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4500);
    const res = await fetch(url, { signal: signal ?? ctrl.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('osrm http');
    const j = await res.json();
    const r = j?.routes?.[0];
    if (!r) throw new Error('osrm empty');
    const km = r.distance / 1000;
    const min = r.duration / 60;
    store[key] = { km, min, t: Date.now() };
    // Trim if too big.
    const keys = Object.keys(store);
    if (keys.length > 200) {
      keys.sort((x, y) => store[x].t - store[y].t).slice(0, 50).forEach(k => delete store[k]);
    }
    write(store);
    return { km, min, source: 'osrm' };
  } catch {
    return estimateFallback(a, b);
  }
}
