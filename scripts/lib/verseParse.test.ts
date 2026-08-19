import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractOdbKeyVerse,
  odbPermalink,
  parseBibleGatewayJson,
  parseYouVersionMeta,
  pickOdbItem,
} from "./verseParse";

describe("extractOdbKeyVerse", () => {
  it("takes the key verse text and the last scripture link", () => {
    const html =
      '<p>You, God, are awesome in your sanctuary. <a href="https://www.biblegateway.com/passage/?search=Psalm+68:35">Psalm 68:35</a></p>';
    assert.deepEqual(extractOdbKeyVerse(html), {
      text: "You, God, are awesome in your sanctuary.",
      reference: "Psalm 68:35",
    });
  });

  it("unwraps small-caps LORD spans", () => {
    const html =
      '<p>The <span style="font-variant-caps: small-caps">Lord</span> is good to those whose hope is in him. <a>Lamentations 3:25</a></p>';
    const got = extractOdbKeyVerse(html);
    assert.equal(got?.reference, "Lamentations 3:25");
    assert.equal(got?.text, "The Lord is good to those whose hope is in him.");
  });
});

describe("pickOdbItem", () => {
  const items = [
    { date: Date.parse("2026-08-18T00:00:00.000Z"), title: "yesterday" },
    { date: Date.parse("2026-08-19T00:00:00.000Z"), title: "today" },
    { date: Date.parse("2026-08-20T00:00:00.000Z"), title: "tomorrow" },
  ];

  it("prefers the UTC calendar day", () => {
    const got = pickOdbItem(items, new Date("2026-08-19T15:00:00.000Z"));
    assert.equal(got?.title, "today");
  });

  it("falls back to the latest past day", () => {
    const got = pickOdbItem(items.slice(0, 1), new Date("2026-08-19T15:00:00.000Z"));
    assert.equal(got?.title, "yesterday");
  });
});

describe("odbPermalink", () => {
  it("builds the dated odb.org URL", () => {
    assert.equal(
      odbPermalink(Date.parse("2026-08-19T00:00:00.000Z"), "awesome-god"),
      "https://odb.org/2026/08/19/awesome-god"
    );
  });
});

describe("parseYouVersionMeta", () => {
  it("uses the title reference and strips it from og:description", () => {
    const got = parseYouVersionMeta(
      "Verse of the Day - John 13:34 - Bible App",
      "John 13:34 “A new command I give you: Love one another. As I have loved you, so you must love one another.\""
    );
    assert.equal(got?.reference, "John 13:34");
    assert.equal(
      got?.text,
      "A new command I give you: Love one another. As I have loved you, so you must love one another."
    );
  });
});

describe("parseBibleGatewayJson", () => {
  it("reads the official VOTD JSON", () => {
    const raw = JSON.stringify({
      votd: {
        text: "&ldquo;Whoever has the Son has life.&rdquo;",
        content: "Whoever has the Son has life.",
        display_ref: "1 John 5:12",
        permalink: "https:\\/\\/www.biblegateway.com\\/passage\\/?search=1%20John%205%3A12&amp;version=NIV",
        version_id: "NIV",
      },
    });
    const got = parseBibleGatewayJson(raw);
    assert.equal(got?.text, "Whoever has the Son has life.");
    assert.equal(got?.reference, "1 John 5:12");
    assert.equal(got?.version, "NIV");
    assert.equal(
      got?.url,
      "https://www.biblegateway.com/passage/?search=1%20John%205%3A12&version=NIV"
    );
  });
});
