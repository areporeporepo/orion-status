export interface ArtemisPosition {
  distanceEarthKm: number;
  distanceMoonKm: number;
  velocityKmS: number;
  missionElapsedMs: number;
  phase: MissionPhase;
  timestamp: string;
  crew: string[];
  stale?: boolean;
  source?: string;
  // Orbital elements (computed from state vectors during earth_orbit/lunar_flyby)
  perigeeKm?: number;   // perigee altitude (km above surface)
  apogeeKm?: number;    // apogee altitude (km above surface)
  ascending?: boolean;   // true = climbing toward apogee, false = descending toward perigee
}

export type MissionPhase =
  // Pre-launch phases (Artemis III ground processing)
  | "pre_launch"
  | "ground_processing"
  | "rollout"
  | "wet_dress_rehearsal"
  | "final_countdown"
  // In-flight phases (kept for future missions / historical compatibility)
  | "earth_orbit"
  | "transit_to_moon"
  | "lunar_flyby"
  | "return_to_earth"
  | "reentry"
  | "complete";

export interface CachedData {
  data: ArtemisPosition;
  fetchedAt: number;
}

export const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  orange: "\x1b[38;5;208m",
  gold: "\x1b[38;5;178m",
  blue: "\x1b[38;5;75m",
  silver: "\x1b[38;5;245m",
} as const;

export const API_URL = "https://artemis-api.testa.workers.dev/position";
// CF Worker handles DSN (5s DO alarm) + Horizons (5min cron) merging
export const CACHE_PATH = "/tmp/orion-status-cache.json";
export const CACHE_TTL_MS = 55_000; // 55s — hold slightly under Horizons' 1min resolution so interpolation runs smooth

// Artemis II launch time (historical — mission completed 2026-04-10).
// Retained so api.ts and trajectory.ts continue to compile and so we can
// reference the prior mission for commemoration in the statusline.
export const LAUNCH_TIME = new Date("2026-04-01T22:35:00Z");

// Artemis III tentative launch target. NASA has NOT announced an exact date
// as of this commit — the mission was restructured in Feb 2026 to be a LEO/HEO
// rendezvous + docking demo with commercial HLS landers (no crewed lunar
// landing; that has slipped to Artemis IV). This placeholder MUST be updated
// once NASA publishes a confirmed L-0.
export const ARTEMIS_III_LAUNCH_TARGET = new Date("2027-09-01T00:00:00Z");

export const EARTH_MOON_DISTANCE_KM = 384_400;
