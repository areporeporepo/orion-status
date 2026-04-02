export interface StateVector {
  epoch: Date;
  x: number; y: number; z: number;       // km
  vx: number; vy: number; vz: number;    // km/s
}

export function parseOEM(text: string): StateVector[] {
  const vectors: StateVector[] = [];
  const lines = text.split("\n");
  let inData = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "META_STOP") { inData = true; continue; }
    if (trimmed === "META_START" || trimmed === "COVARIANCE_START") { inData = false; continue; }
    if (!inData || trimmed === "" || trimmed.startsWith("COMMENT")) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 7) continue;

    const raw = parts[0]!;
    const epoch = new Date(raw.endsWith("Z") ? raw : raw + "Z");
    if (isNaN(epoch.getTime())) continue;

    vectors.push({
      epoch,
      x: parseFloat(parts[1]!), y: parseFloat(parts[2]!), z: parseFloat(parts[3]!),
      vx: parseFloat(parts[4]!), vy: parseFloat(parts[5]!), vz: parseFloat(parts[6]!),
    });
  }
  return vectors;
}

export function interpolateAt(vectors: StateVector[], at: Date): StateVector | null {
  if (vectors.length === 0) return null;
  const t = at.getTime();
  let closest = vectors[0]!;
  let minDelta = Math.abs(t - closest.epoch.getTime());
  for (const v of vectors) {
    const delta = Math.abs(t - v.epoch.getTime());
    if (delta < minDelta) { closest = v; minDelta = delta; }
  }
  return closest;
}
