// src/trajectory.ts
import { C } from "./types.ts";

const BAR_WIDTH = 24;

// Compute real moon phase from date using Conway's algorithm
function getMoonPhaseEmoji(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Simplified synodic month calculation
  // Known new moon: Jan 29, 2025 12:36 UTC
  const knownNew = new Date("2025-01-29T12:36:00Z").getTime();
  const synodicMonth = 29.53058867;
  const daysSince = (now.getTime() - knownNew) / 86_400_000;
  const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;

  // 8 phases, ~3.7 days each
  const phaseIndex = Math.floor((phase / synodicMonth) * 8) % 8;
  const emojis = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return emojis[phaseIndex]!;
}

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

  return `${C.blue}🌍${C.reset} ${dots} ${C.silver}${getMoonPhaseEmoji()}${C.reset}`;
}

export function renderCrewLine(crew: string[]): string {
  return `${C.gray}${crew.join(" · ")}${C.reset}`;
}
