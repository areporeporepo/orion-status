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
    const met = Math.max(0, Date.now() - LAUNCH_TIME.getTime());
    return {
      distanceEarthKm: 0,
      distanceMoonKm: 384_400,
      velocityKmS: 0,
      missionElapsedMs: met,
      phase: "earth_orbit",
      timestamp: new Date().toISOString(),
      crew: ["Wiseman", "Glover", "Koch", "Hansen"],
      stale: true,
    };
  }
}
