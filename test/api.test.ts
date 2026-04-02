// test/api.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatMET, formatDistance } from "../src/api.ts";

describe("api utilities", () => {
  it("formatMET formats milliseconds to hours and minutes", () => {
    assert.equal(formatMET(8073000), "2h 14m");
  });
  it("formatMET handles zero", () => {
    assert.equal(formatMET(0), "0h 0m");
  });
  it("formatMET handles days", () => {
    assert.equal(formatMET(90_000_000), "1d 1h 0m");
  });
  it("formatDistance adds commas", () => {
    assert.equal(formatDistance(148302), "148,302");
  });
  it("formatDistance handles small numbers", () => {
    assert.equal(formatDistance(42), "42");
  });
});
