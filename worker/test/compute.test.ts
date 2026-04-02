import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computePosition } from "../src/compute.ts";

describe("compute", () => {
  it("computes distance from Earth", () => {
    const result = computePosition({
      epoch: new Date("2026-04-02T00:00:00Z"),
      x: 6700, y: 0, z: 0, vx: 0, vy: 7.8, vz: 0,
    });
    assert.equal(result.distanceEarthKm, 6700);
  });
  it("computes velocity magnitude", () => {
    const result = computePosition({
      epoch: new Date("2026-04-02T00:00:00Z"),
      x: 6700, y: 0, z: 0, vx: 3, vy: 4, vz: 0,
    });
    assert.equal(result.velocityKmS, 5);
  });
  it("determines earth_orbit phase for low altitude", () => {
    const result = computePosition({
      epoch: new Date("2026-04-02T00:00:00Z"),
      x: 400, y: 0, z: 0, vx: 0, vy: 7.8, vz: 0,
    });
    assert.equal(result.phase, "earth_orbit");
  });
  it("determines lunar_flyby phase near Moon", () => {
    const result = computePosition({
      epoch: new Date("2026-04-04T00:00:00Z"),
      x: 380000, y: 0, z: 0, vx: 0, vy: 1, vz: 0,
    });
    assert.equal(result.phase, "lunar_flyby");
  });
});
