import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCatholicChurchNews, isPersecutionStory } from "./editorial";

describe("isCatholicChurchNews", () => {
  it("drops pope and vatican headlines", () => {
    assert.equal(isCatholicChurchNews("Pope Leo arrives in France", null), true);
    assert.equal(isCatholicChurchNews("Highlights from the Vatican audience", null), true);
  });

  it("drops Catholic-institution headlines from other wires", () => {
    assert.equal(
      isCatholicChurchNews("DHS lifts freeze on a Catholic migrant charity", "Sister Norma Pimentel"),
      true,
    );
    assert.equal(isCatholicChurchNews("US bishops launch a pro-life campaign", null), true);
  });

  it("keeps persecution and disaster even when Catholics are mentioned", () => {
    assert.equal(
      isCatholicChurchNews("Gunmen killed Catholics and Protestants leaving church", null),
      false,
    );
    assert.equal(
      isCatholicChurchNews("Floods hit a Catholic village in Nepal", null),
      false,
    );
  });

  it("keeps a public religious-liberty ruling", () => {
    assert.equal(
      isCatholicChurchNews("Supreme Court backs religious liberty for a Catholic campus", null),
      false,
    );
  });

  it("leaves ordinary Protestant headlines alone", () => {
    assert.equal(isCatholicChurchNews("Texas should not define religion down", null), false);
  });
});

describe("isPersecutionStory", () => {
  it("matches violence and detention, not a protocol visit", () => {
    assert.equal(isPersecutionStory("Nigerian pastor killed on the way to church", null), true);
    assert.equal(isPersecutionStory("Patriarch visits Jerusalem", null), false);
  });
});
