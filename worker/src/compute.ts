import type { StateVector } from "./parser.ts";

const EARTH_MOON_DISTANCE_KM = 384_400;
const LAUNCH_TIME = new Date("2026-04-01T22:35:00Z");

export interface PositionData {
  distanceEarthKm: number;
  distanceMoonKm: number;
  velocityKmS: number;
  missionElapsedMs: number;
  phase: string;
  timestamp: string;
}

export function computePosition(sv: StateVector): PositionData {
  const distanceEarthKm = Math.sqrt(sv.x ** 2 + sv.y ** 2 + sv.z ** 2);
  const velocityKmS = Math.sqrt(sv.vx ** 2 + sv.vy ** 2 + sv.vz ** 2);
  const distanceMoonKm = Math.max(0, EARTH_MOON_DISTANCE_KM - distanceEarthKm);
  const missionElapsedMs = Math.max(0, sv.epoch.getTime() - LAUNCH_TIME.getTime());

  let phase = "earth_orbit";
  if (distanceEarthKm < 2000) phase = "earth_orbit";
  else if (distanceMoonKm < 10000) phase = "lunar_flyby";
  else if (distanceEarthKm < distanceMoonKm) phase = "transit_to_moon";
  else phase = "return_to_earth";
  if (missionElapsedMs > 10 * 24 * 60 * 60 * 1000) phase = "complete";

  return {
    distanceEarthKm: Math.round(distanceEarthKm),
    distanceMoonKm: Math.round(distanceMoonKm),
    velocityKmS: Math.round(velocityKmS * 100) / 100,
    missionElapsedMs, phase, timestamp: sv.epoch.toISOString(),
  };
}
