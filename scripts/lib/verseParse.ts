// Pure parsers for daily-verse sources. No network I/O.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  nbsp: " ",
  copy: "\u00a9",
  ldquo: "\u201c",
  rdquo: "\u201d",
  lsquo: "\u2018",
  rsquo: "\u2019",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
};

export function decodeEntities(s: string): string {
  if (!s || !s.includes("&")) return s;
  return s.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (full, body: string) => {
    const lc = body.toLowerCase();
    if (lc in NAMED_ENTITIES) return NAMED_ENTITIES[lc];
    if (lc.startsWith("#x")) {
      const cp = parseInt(lc.slice(2), 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : full;
    }
    if (lc.startsWith("#")) {
      const cp = parseInt(lc.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : full;
    }
    return full;
  });
}

export function stripHtml(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlToText(html: string | undefined | null): string {
  return decodeEntities(stripHtml(html));
}

export function extractJsonObject(raw: string): unknown {
  const t = raw.trim();
  if (t.startsWith("{") || t.startsWith("[")) return JSON.parse(t);
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
  throw new Error("response is not JSON");
}

export function extractMeta(html: string, attr: string): string | null {
  const esc = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const a = new RegExp(
    `<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const b = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${esc}["']`,
    "i"
  );
  const m = a.exec(html) ?? b.exec(html);
  return m ? decodeEntities(m[1]).trim() : null;
}

export function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : null;
}

export function extractOdbKeyVerse(
  verseHtml: string,
  fallbackRef?: string | null
): { text: string; reference: string } | null {
  const links = [...verseHtml.matchAll(/<a\b[^>]*>([^<]+)<\/a>/gi)];
  const refFromLink = links.length > 0 ? htmlToText(links[links.length - 1][1]) : "";
  const reference = (refFromLink || fallbackRef || "").replace(/\s+/g, " ").trim();
  let text = htmlToText(verseHtml);
  if (reference && text.toLowerCase().endsWith(reference.toLowerCase())) {
    text = text.slice(0, -reference.length).trim();
  }
  if (!text || !reference) return null;
  return { text, reference };
}

export function utcYmd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function odbPermalink(dateMs: number, slug?: string | null): string {
  const ymd = utcYmd(dateMs);
  const [y, m, d] = ymd.split("-");
  return slug
    ? `https://odb.org/${y}/${m}/${d}/${slug}`
    : `https://odb.org/${y}/${m}/${d}`;
}

export function pickOdbItem<T extends { date: number }>(items: T[], now = new Date()): T | null {
  if (items.length === 0) return null;
  const today = now.toISOString().slice(0, 10);
  const dated = items
    .filter((it) => Number.isFinite(it.date))
    .map((it) => ({ it, ymd: utcYmd(it.date) }));
  const exact = dated.find((d) => d.ymd === today);
  if (exact) return exact.it;
  const past = dated.filter((d) => d.ymd <= today).sort((a, b) => a.ymd.localeCompare(b.ymd));
  return past.at(-1)?.it ?? null;
}

export function parseYouVersionMeta(
  title: string | null,
  ogDescription: string | null
): { text: string; reference: string } | null {
  const titleRef = title?.match(/Verse of the Day\s*[-–—]\s*(.+?)\s*[-–—]\s*Bible/i)?.[1]?.trim();
  const og = (ogDescription ?? "").trim();
  let reference = titleRef ?? "";
  let text = og;

  if (!reference) {
    const m = og.match(/^((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)?\s+\d+:\d+(?:-\d+)?)\s+/);
    if (m) {
      reference = m[1];
      text = og.slice(m[0].length);
    }
  } else if (text.toLowerCase().startsWith(reference.toLowerCase())) {
    text = text.slice(reference.length).trim();
  }

  text = text.replace(/^[“"']+|[”"']+$/g, "").trim();
  if (!text || !reference) return null;
  return { text, reference };
}

export interface BibleGatewayVotd {
  text: string;
  reference: string;
  url: string;
  version: string | null;
}

export function parseBibleGatewayJson(raw: string): BibleGatewayVotd | null {
  const parsed = extractJsonObject(raw) as { votd?: Record<string, unknown> };
  const v = parsed.votd;
  if (!v || typeof v !== "object") return null;
  const content = typeof v.content === "string" ? v.content : "";
  const encoded = typeof v.text === "string" ? v.text : "";
  const text = htmlToText(content || encoded);
  const reference = htmlToText(
    (typeof v.display_ref === "string" && v.display_ref) ||
      (typeof v.reference === "string" && v.reference) ||
      ""
  );
  const permalink = decodeEntities(
    typeof v.permalink === "string" ? v.permalink.replace(/\\\//g, "/") : ""
  );
  const version =
    (typeof v.version_id === "string" && v.version_id) ||
    (typeof v.version === "string" && v.version) ||
    null;
  if (!text || !reference || !permalink) return null;
  return { text, reference, url: permalink, version };
}
