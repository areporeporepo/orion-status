// src/trajectory.ts
import { C } from "./types.ts";

const BAR_WIDTH = 24;

export function renderTrajectoryBar(
  distanceEarthKm: number,
  distanceMoonKm: number,
): string {
  const total = distanceEarthKm + distanceMoonKm;
  const progress = total > 0 ? distanceEarthKm / total : 0;
  const pos = Math.round(progress * (BAR_WIDTH - 1));

  let dots = "";
  for (let i = 0; i < BAR_WIDTH; i++) {
    if (i === pos) {
      dots += `${C.gold}${C.bold}•${C.reset}`;
    } else {
      dots += `${C.gray}·${C.reset}`;
    }
  }

  return `${C.blue}🌍${C.reset} ${dots} ${C.silver}🌑${C.reset}`;
}

export function renderCrewLine(crew: string[]): string {
  return `${C.gray}${crew.join(" · ")}${C.reset}`;
}
