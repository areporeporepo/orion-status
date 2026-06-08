import {
  type ArtemisPosition,
  type MissionPhase,
  C,
  ARTEMIS_III_LAUNCH_TARGET,
} from "./types.ts";

const PHASE_LABELS: Record<MissionPhase, string> = {
  // Pre-launch (Artemis III ground processing)
  pre_launch: "pre-launch",
  ground_processing: "ground ops",
  rollout: "rollout",
  wet_dress_rehearsal: "WDR",
  final_countdown: "T-0",
  // In-flight (retained for future missions)
  earth_orbit: "orbit",
  transit_to_moon: "transit",
  lunar_flyby: "flyby",
  return_to_earth: "return",
  reentry: "reentry",
  complete: "splashdown",
};

// Artemis III pre-launch milestones.
// All dates are TENTATIVE — NASA has not announced a hard L-0 schedule.
// Times are absolute UTC instants so we don't have to track "days from now"
// (which would shift on every render). Update these as NASA publishes the
// real ground-processing timeline.
interface Milestone {
  name: string;
  at: Date;
}

const MILESTONES: Milestone[] = [
  { name: "Artemis II: mission complete \u2713", at: new Date("2026-04-10T17:07:00-07:00") },
  { name: "SLS stacking review",                at: new Date("2026-11-15T00:00:00Z") },
  { name: "Orion + SLS mate",                   at: new Date("2027-02-15T00:00:00Z") },
  { name: "SLS rollout to pad 39B",             at: new Date("2027-08-01T00:00:00Z") },
  { name: "wet dress rehearsal",                at: new Date("2027-08-15T00:00:00Z") },
  { name: "flight readiness review",            at: new Date("2027-08-25T00:00:00Z") },
  { name: "L-24h: launch countdown starts",     at: new Date("2027-08-31T00:00:00Z") },
  { name: "T-0: LIFTOFF \uD83D\uDE80",          at: ARTEMIS_III_LAUNCH_TARGET },
  // Post-launch — Artemis III is a LEO/HEO rendezvous demo, NOT a lunar landing.
  { name: "Orion / HLS rendezvous demo",        at: new Date(ARTEMIS_III_LAUNCH_TARGET.getTime() + 1 * 86_400_000) },
];

function formatRemaining(ms: number): string {
  // Always positive; caller decides T- vs L+ prefix
  const abs = Math.max(0, ms);
  const totalMin = Math.floor(abs / 60_000);
  const totalHrs = Math.floor(totalMin / 60);
  const days = Math.floor(totalHrs / 24);
  const hours = totalHrs % 24;
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  const secs = Math.max(0, Math.floor(abs / 1000));
  return `${secs}s`;
}

function getNextMilestone(now: Date): string {
  const t = now.getTime();
  for (const m of MILESTONES) {
    if (m.at.getTime() > t) {
      return `${m.name} in ${formatRemaining(m.at.getTime() - t)}`;
    }
  }
  return "Artemis III flight in progress";
}

// Pre-launch T-minus / post-launch L+ countdown relative to ARTEMIS_III_LAUNCH_TARGET
function formatCountdown(now: Date): string {
  const deltaMs = ARTEMIS_III_LAUNCH_TARGET.getTime() - now.getTime();
  if (deltaMs > 0) return `T-${formatRemaining(deltaMs)}`;
  return `L+${formatRemaining(-deltaMs)}`;
}

export function renderStatusline(_pos: ArtemisPosition): string {
  // Note: we intentionally ignore most of `_pos`. Artemis II is complete and
  // there is no live telemetry for an Artemis III ground-processing vehicle.
  // The statusline is now driven entirely by wall-clock vs ARTEMIS_III_LAUNCH_TARGET.
  const now = new Date();
  const countdown = formatCountdown(now);
  const next = getNextMilestone(now);

  const label = `${C.gold}\uD83D\uDE80 Artemis III${C.reset}`;
  const tminus = `${C.cyan}${countdown}${C.reset}`;
  const milestone = `${C.yellow}\u25B8 ${next}${C.reset}`;
  const a2tag = `${C.dim}\u2713 Artemis II 2026-04-10${C.reset}`;

  return `${label}  ${tminus}  ${milestone}  ${a2tag}`;
}
