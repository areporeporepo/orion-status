// src/statusline.ts
import { type ArtemisPosition, C } from "./types.ts";
import { formatDistance, formatMET } from "./api.ts";
import { renderTrajectoryBar } from "./trajectory.ts";

const PHASE_LABELS: Record<string, string> = {
  earth_orbit: "orbit",
  transit_to_moon: "transit",
  lunar_flyby: "flyby",
  return_to_earth: "return",
  reentry: "reentry",
  complete: "splashdown",
};

export function renderStatusline(pos: ArtemisPosition, _tick: number): string {
  const dist = formatDistance(pos.distanceEarthKm);
  const vel = pos.velocityKmS.toFixed(1);
  const met = formatMET(pos.missionElapsedMs);
  const phase = PHASE_LABELS[pos.phase] ?? pos.phase;
  const stale = pos.stale ? `${C.dim} ~${C.reset}` : "";

  const trajectory = renderTrajectoryBar(pos.distanceEarthKm, pos.distanceMoonKm);

  const line1 = `${C.gold}🚀 ${dist}km${C.reset} ${C.cyan}${vel}km/s${C.reset} ${C.gray}MET ${met}${C.reset} ${C.green}${phase}${C.reset}${stale}`;
  const line2 = trajectory;

  return `${line1}\n${line2}`;
}
