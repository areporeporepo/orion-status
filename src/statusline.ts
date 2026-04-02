// src/statusline.ts
import { type ArtemisPosition, C, LAUNCH_TIME } from "./types.ts";
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

// Key mission milestones (approximate times from launch)
const MILESTONES = [
  { name: "TLI burn", hoursFromLaunch: 2 },
  { name: "outbound coast", hoursFromLaunch: 12 },
  { name: "lunar approach", hoursFromLaunch: 72 },
  { name: "closest approach", hoursFromLaunch: 100 },
  { name: "far side flyby", hoursFromLaunch: 106 },
  { name: "return coast", hoursFromLaunch: 150 },
  { name: "reentry", hoursFromLaunch: 226 },
  { name: "splashdown", hoursFromLaunch: 230 },
];

// Mission facts that rotate based on elapsed time — things people don't know
const FACTS = [
  "first humans past LEO since 1972",
  "Orion capsule named \"Integrity\"",
  "Victor Glover: first Black astronaut to deep space",
  "Christina Koch: first woman beyond LEO",
  "Jeremy Hansen: first Canadian to the Moon",
  "will travel 252,000mi — farthest humans have ever gone",
  "crew played cards before heading to the pad",
  "SLS is the most powerful rocket NASA has ever flown",
  "free-return trajectory — no engine needed to come home",
  "Orion heat shield hits 5,000°F on reentry",
  "60,000 solar cells power the spacecraft",
  "splashdown off San Diego, Navy recovery",
  "Reid Wiseman: oldest person to leave Earth orbit",
  "launched from Pad 39B — same pad as Apollo",
  "10-day mission around the Moon and back",
  "Artemis III will land on the Moon using SpaceX Starship",
];

function getNextMilestone(missionElapsedMs: number): string {
  const hoursElapsed = missionElapsedMs / 3_600_000;
  for (const m of MILESTONES) {
    if (m.hoursFromLaunch > hoursElapsed) {
      const hoursUntil = m.hoursFromLaunch - hoursElapsed;
      if (hoursUntil < 1) {
        const mins = Math.round(hoursUntil * 60);
        return `${m.name} in ${mins}m`;
      }
      return `${m.name} in ${Math.round(hoursUntil)}h`;
    }
  }
  return "mission complete";
}

function getFact(missionElapsedMs: number): string {
  // Rotate facts every ~10 minutes based on MET
  const index = Math.floor(missionElapsedMs / 600_000) % FACTS.length;
  return FACTS[index]!;
}

export function renderStatusline(pos: ArtemisPosition, _tick: number): string {
  const dist = formatDistance(pos.distanceEarthKm);
  const vel = pos.velocityKmS.toFixed(1);
  const met = formatMET(pos.missionElapsedMs);
  const phase = PHASE_LABELS[pos.phase] ?? pos.phase;
  const stale = pos.stale ? `${C.dim} ~${C.reset}` : "";
  const next = getNextMilestone(pos.missionElapsedMs);
  const fact = getFact(pos.missionElapsedMs);

  const trajectory = renderTrajectoryBar(pos.distanceEarthKm, pos.distanceMoonKm);

  const line1 = `${C.gold}🚀 ${dist}km${C.reset} ${C.cyan}${vel}km/s${C.reset} ${C.gray}MET ${met}${C.reset} ${C.green}${phase}${C.reset} ${C.yellow}▸${next}${C.reset}${stale}`;
  const line2 = `${trajectory}  ${C.dim}${fact}${C.reset}`;

  return `${line1}\n${line2}`;
}
