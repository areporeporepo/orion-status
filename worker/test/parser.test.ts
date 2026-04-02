import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseOEM, interpolateAt } from "../src/parser.ts";

const SAMPLE_OEM = `CCSDS_OEM_VERS = 2.0
CREATION_DATE = 2026-04-01T23:00:00.000
ORIGINATOR = JSC

META_START
OBJECT_NAME = ORION
OBJECT_ID = 2026-001A
CENTER_NAME = EARTH
REF_FRAME = EME2000
TIME_SYSTEM = UTC
META_STOP

2026-04-01T23:00:00.000  6700.0  0.0  0.0  0.0  7.8  0.0
2026-04-01T23:04:00.000  6500.0  1800.0  0.0  -0.5  7.7  0.0
2026-04-01T23:08:00.000  6200.0  3500.0  0.0  -1.0  7.5  0.0
`;

describe("OEM parser", () => {
  it("parses state vectors from OEM text", () => {
    const vectors = parseOEM(SAMPLE_OEM);
    assert.equal(vectors.length, 3);
  });
  it("extracts correct position values", () => {
    const vectors = parseOEM(SAMPLE_OEM);
    assert.equal(vectors[0]!.x, 6700.0);
    assert.equal(vectors[0]!.vy, 7.8);
  });
  it("parses epoch as Date", () => {
    const vectors = parseOEM(SAMPLE_OEM);
    assert.equal(vectors[0]!.epoch.toISOString(), "2026-04-01T23:00:00.000Z");
  });
  it("interpolateAt finds closest vector", () => {
    const vectors = parseOEM(SAMPLE_OEM);
    const target = new Date("2026-04-01T23:05:00.000Z");
    const closest = interpolateAt(vectors, target);
    assert.ok(closest);
    assert.equal(closest.x, 6500.0);
  });
  it("handles empty input", () => {
    assert.equal(parseOEM("").length, 0);
  });
});
