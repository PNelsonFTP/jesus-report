import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isGoogleNewsUrl,
  isHnDiscussionUrl,
  normalizeArticleUrl,
  stripGoogleNewsTitle,
  unwrapSync,
  urlFromHnDescription,
  urlFromQueryParam,
} from "./unwrapUrl";

describe("unwrapUrl", () => {
  it("detects Google News and HN discussion URLs", () => {
    assert.equal(isGoogleNewsUrl("https://news.google.com/rss/articles/CBMiabc"), true);
    assert.equal(isGoogleNewsUrl("https://religionnews.com/world/x"), false);
    assert.equal(isHnDiscussionUrl("https://news.ycombinator.com/item?id=123"), true);
    assert.equal(isHnDiscussionUrl("https://example.com/item?id=123"), false);
  });

  it("takes a url query param off a wrapper", () => {
    const wrapped =
      "https://news.google.com/rss/search?q=church&url=https://religionnews.com/world/story";
    assert.equal(urlFromQueryParam(wrapped), "https://religionnews.com/world/story");
    assert.equal(unwrapSync(wrapped), "https://religionnews.com/world/story");
  });

  it("extracts Article URL from an hnrss description", () => {
    const desc =
      '<p>Article URL: <a href="https://www.crossway.org/article">https://www.crossway.org/article</a></p><p>Comments URL: <a href="https://news.ycombinator.com/item?id=1">1</a></p>';
    assert.equal(urlFromHnDescription(desc), "https://www.crossway.org/article");
    assert.equal(
      unwrapSync("https://news.ycombinator.com/item?id=1", { description: desc }),
      "https://www.crossway.org/article",
    );
  });

  it("strips Google News publisher suffixes only", () => {
    assert.equal(
      stripGoogleNewsTitle("Vatican issues statement - Reuters", "Reuters"),
      "Vatican issues statement",
    );
    assert.equal(
      stripGoogleNewsTitle("Gospel - what we know", "Reuters"),
      "Gospel - what we know",
    );
  });

  it("drops tracking params", () => {
    assert.equal(
      normalizeArticleUrl("https://religionnews.com/world/x/?utm_source=gn&oc=5#frag"),
      "https://religionnews.com/world/x",
    );
  });
});
