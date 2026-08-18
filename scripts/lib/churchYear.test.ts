import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adventSunday, churchYearLine, easterSunday } from "./churchYear";

describe("church year", () => {
  it("computes Easter 2026 as April 5", () => {
    const d = easterSunday(2026);
    assert.equal(d.toISOString().slice(0, 10), "2026-04-05");
  });

  it("places mid-August in Ordinary Time", () => {
    const y = churchYearLine(new Date("2026-08-18T12:00:00.000Z"));
    assert.equal(y.season, "Ordinary Time");
    assert.match(y.line, /Ordinary Time/);
  });

  it("places Christmas Day in Christmas", () => {
    const y = churchYearLine(new Date("2026-12-25T12:00:00.000Z"));
    assert.equal(y.season, "Christmas");
  });

  it("places Advent 1 in Advent", () => {
    const a = adventSunday(2026);
    const y = churchYearLine(new Date(a.getTime() + 12 * 3600 * 1000));
    assert.equal(y.season, "Advent");
  });
});
