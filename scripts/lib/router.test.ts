import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAggregatorSource, pickTrendingLead } from "./router";
import type { GroupedArticle } from "../types";

function article(partial: Partial<GroupedArticle> & Pick<GroupedArticle, "title" | "url" | "source">): GroupedArticle {
  return {
    id: partial.id ?? partial.url,
    category: "church",
    priority: "high",
    publishedAt: "2026-08-18T12:00:00.000Z",
    publishedRaw: null,
    summary: null,
    collectedAt: "2026-08-18T12:00:00.000Z",
    related: [],
    ...partial,
  };
}

describe("trending lead quality", () => {
  it("treats good-news aggregators as aggregators", () => {
    assert.equal(isAggregatorSource("Good News Network"), true);
    assert.equal(isAggregatorSource("GN: Vatican"), true);
    assert.equal(isAggregatorSource("Religion News Service"), false);
  });

  it("prefers a first-party headline within 10% of the top aggregator score", () => {
    const agg = article({ title: "revival in kenya", url: "https://www.goodnewsnetwork.org/x", source: "Good News Network" });
    const press = article({
      title: "Kenyan churches report a season of revival",
      url: "https://religionnews.com/kenya-revival/",
      source: "Religion News Service",
    });
    const lead = pickTrendingLead([
      { article: agg, score: 100 },
      { article: press, score: 92 },
    ]);
    assert.equal(lead.source, "Religion News Service");
    assert.equal(lead.related.some((r) => r.source === "Good News Network"), true);
  });

  it("keeps the aggregator when no first-party alternative is close", () => {
    const agg = article({ title: "only on GNN", url: "https://www.goodnewsnetwork.org/y", source: "Good News Network" });
    const old = article({ title: "unrelated press", url: "https://example.com/old", source: "Religion News Service" });
    const lead = pickTrendingLead([
      { article: agg, score: 100 },
      { article: old, score: 50 },
    ]);
    assert.equal(lead.source, "Good News Network");
  });
});
