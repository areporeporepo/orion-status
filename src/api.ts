// src/api.ts
import { readFileSync, writeFileSync } from "node:fs";
import {
  type ArtemisPosition,
  type CachedData,
  API_URL,
  CACHE_PATH,
  CACHE_TTL_MS,
  LAUNCH_TIME,
} from "./types.ts";

export function formatMET(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatDistance(km: number): string {
  return km.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function readCache(): CachedData | null {
  try {
    const raw = readFileSync(CACHE_PATH, "utf-8");
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;
    return { ...cached, data: { ...cached.data, stale: true } };
  } catch {
    return null;
  }
}

function writeCache(data: ArtemisPosition): void {
  try {
    const cached: CachedData = { data, fetchedAt: Date.now() };
    writeFileSync(CACHE_PATH, JSON.stringify(cached));
  } catch {}
}

// Approximate position from mission elapsed time when API is unavailable.
// Based on Artemis II free-return trajectory profile:
//   0-2h: LEO orbit raising (~200-2000km)
//   2-4h: TLI burn, accelerating to ~10km/s
//   4-96h: coast to Moon (~1.5km/s cruise)
//   96-110h: lunar flyby (closest ~128km from surface, ~252,000km from Earth)
//   110-226h: return coast
//   226-230h: reentry + splashdown
function estimatePosition(): ArtemisPosition {
  const met = Math.max(0, Date.now() - LAUNCH_TIME.getTime());
  const hours = met / 3_600_000;
  const MOON_DIST = 384_400;

  let distEarth: number;
  let velocity: number;
  let phase: string;

  if (hours < 2) {
    // LEO orbit raising
    distEarth = 200 + hours * 900;
    velocity = 7.8;
    phase = "earth_orbit";
  } else if (hours < 4) {
    // TLI burn + acceleration
    const t = (hours - 2) / 2;
    distEarth = 2000 + t * 20000;
    velocity = 7.8 + t * 3;
    phase = "transit_to_moon";
  } else if (hours < 96) {
    // Coast to Moon
    const t = (hours - 4) / 92;
    distEarth = 22000 + t * (MOON_DIST - 22000 - 10000);
    velocity = 1.5 - t * 0.5;
    phase = "transit_to_moon";
  } else if (hours < 110) {
    // Lunar flyby
    const t = (hours - 96) / 14;
    const closest = MOON_DIST - 130; // ~128km from lunar surface
    distEarth = closest + Math.abs(t - 0.5) * 20000;
    velocity = 1.0 + (1 - Math.abs(t - 0.5) * 2) * 1.5;
    phase = "lunar_flyby";
  } else if (hours < 226) {
    // Return coast
    const t = (hours - 110) / 116;
    distEarth = MOON_DIST * (1 - t);
    velocity = 1.0 + t * 2;
    phase = "return_to_earth";
  } else if (hours < 230) {
    // Reentry
    distEarth = Math.max(0, 2000 * (1 - (hours - 226) / 4));
    velocity = 11.0;
    phase = "reentry";
  } else {
    distEarth = 0;
    velocity = 0;
    phase = "complete";
  }

  return {
    distanceEarthKm: Math.round(distEarth),
    distanceMoonKm: Math.round(Math.max(0, MOON_DIST - distEarth)),
    velocityKmS: Math.round(velocity * 100) / 100,
    missionElapsedMs: met,
    phase: phase as any,
    timestamp: new Date().toISOString(),
    crew: ["Wiseman", "Glover", "Koch", "Hansen"],
  };
}

export async function fetchPosition(): Promise<ArtemisPosition> {
  const cached = readCache();
  if (cached && !cached.data.stale) return cached.data;

  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ArtemisPosition = await res.json();
    writeCache(data);
    return data;
  } catch {
    if (cached) return cached.data;
    return estimatePosition();
  }
}
