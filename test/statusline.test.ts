// test/statusline.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderStatusline } from "../src/statusline.ts";
import type { ArtemisPosition } from "../src/types.ts";

// renderStatusline now ignores live telemetry (Artemis II is complete) and is
// driven by wall-clock vs ARTEMIS_III_LAUNCH_TARGET. The mock only needs to
// satisfy the ArtemisPosition type.
const mockPosition: ArtemisPosition = {
  distanceEarthKm: 148302,
  distanceMoonKm: 236098,
  velocityKmS: 2.34,
  missionElapsedMs: 8073000,
  phase: "transit_to_moon",
  timestamp: "2026-04-02T00:49:00Z",
  crew: ["Wiseman", "Glover", "Koch", "Hansen"],
};

describe("statusline renderer", () => {
  it("renders single line", () => {
    const output = renderStatusline(mockPosition);
    const lines = output.split("\n");
    assert.equal(lines.length, 1);
  });
  it("includes the rocket emoji", () => {
    const output = renderStatusline(mockPosition);
    assert.ok(output.includes("🚀"));
  });
  it("labels the current mission as Artemis III", () => {
    const output = renderStatusline(mockPosition);
    assert.ok(output.includes("Artemis III"));
  });
  it("shows a T-minus or L-plus countdown", () => {
    const output = renderStatusline(mockPosition);
    assert.match(output, /T-|L\+/);
  });
  it("shows the next milestone with a ▸ marker", () => {
    const output = renderStatusline(mockPosition);
    assert.ok(output.includes("▸"));
  });
  it("keeps an Artemis II completion tag", () => {
    const output = renderStatusline(mockPosition);
    assert.ok(output.includes("Artemis II"));
    assert.ok(output.includes("2026-04-10"));
  });
});
