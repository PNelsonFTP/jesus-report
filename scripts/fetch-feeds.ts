// Build-time RSS fetcher. Never runs in the browser.

import { XMLParser } from "fast-xml-parser";
import type { Article } from "./types";
import { type FeedSource, PRIORITY_WEIGHT, SOURCES } from "./sources";
import { extractDate } from "./lib/timeAgo";
import {
  isGoogleNewsUrl,
  resolveGoogleNewsUrls,
  stripGoogleNewsTitle,
  unwrapSync,
} from "./lib/unwrapUrl";

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: {
    enabled: true,
    maxEntitySize: 100000,
    maxTotalExpansions: 100000,
    maxExpandedLength: 1000000,
    maxEntityCount: 100000,
  },
});

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile Safari/605.1.15",
];

function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function stripHtml(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'",
  nbsp: " ", copy: "\u00a9", reg: "\u00ae", trade: "\u2122",
  mdash: "\u2014", ndash: "\u2013", hellip: "\u2026",
  lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d",
};

function decodeEntities(s: string): string {
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

function cleanText(s: string | undefined | null): string {
  return decodeEntities(stripHtml(s));
}

const WEEKDAY_DATE =
  /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4}$/;

function isDateOnlyTitle(title: string): boolean {
  const t = title.trim();
  return WEEKDAY_DATE.test(t) || /^\d{4}-\d{2}-\d{2}$/.test(t);
}

function firstStr(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && v.length && typeof v[0] === "string") return String(v[0]).trim();
    if (v && typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
      const t = (v as { "#text"?: unknown })["#text"];
      if (typeof t === "string") return t.trim();
    }
  }
  return null;
}

interface ParsedItem {
  title?: unknown;
  link?: unknown;
  comments?: unknown;
  source?: unknown;
  pubDate?: unknown;
  published?: unknown;
  updated?: unknown;
  date?: unknown;
  description?: unknown;
  summary?: unknown;
  content?: unknown;
  "content:encoded"?: unknown;
}

function publisherFromItem(item: ParsedItem): string | null {
  const src = item.source;
  if (typeof src === "string" && src.trim()) return src.trim();
  if (src && typeof src === "object") {
    const named = firstStr((src as { "#text"?: unknown })["#text"]);
    if (named) return named;
  }
  return null;
}

function rateLimitKey(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "substack.com" || host.endsWith(".substack.com")) return "substack.com";
    return host;
  } catch {
    return "unknown";
  }
}

class HostPool {
  private inflight = new Map<string, number>();
  private waiters = new Map<string, Array<() => void>>();
  constructor(private maxPerHost: number) {}

  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.acquire(key);
    try {
      return await fn();
    } finally {
      this.release(key);
    }
  }

  private acquire(key: string): Promise<void> {
    const n = this.inflight.get(key) ?? 0;
    if (n < this.maxPerHost) {
      this.inflight.set(key, n + 1);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const q = this.waiters.get(key) ?? [];
      q.push(resolve);
      this.waiters.set(key, q);
    });
  }

  private release(key: string): void {
    const q = this.waiters.get(key) ?? [];
    const next = q.shift();
    if (next) {
      this.waiters.set(key, q);
      next();
    } else {
      const n = (this.inflight.get(key) ?? 1) - 1;
      if (n <= 0) this.inflight.delete(key);
      else this.inflight.set(key, n);
    }
  }
}

const HOST_POOL = new HostPool(2);

function extractItems(json: Record<string, unknown>): ParsedItem[] {
  const rss = json?.rss as { channel?: { item?: ParsedItem | ParsedItem[] } } | undefined;
  if (rss?.channel) {
    const items = rss.channel.item;
    return Array.isArray(items) ? items : items ? [items] : [];
  }
  const feed = json?.feed as { entry?: ParsedItem | ParsedItem[] } | undefined;
  if (feed) {
    const entries = feed.entry;
    return Array.isArray(entries) ? entries : entries ? [entries] : [];
  }
  const rdf = (json?.["rdf:RDF"] ?? json?.rdf) as { item?: ParsedItem | ParsedItem[] } | undefined;
  if (rdf) {
    const items = rdf.item;
    return Array.isArray(items) ? items : items ? [items] : [];
  }
  return [];
}

function linkFromItem(item: ParsedItem): string | null {
  if (typeof item.link === "string") return item.link;
  if (Array.isArray(item.link)) {
    const href = item.link.find((l) => (l as { "@_href"?: string })?.["@_href"]) || item.link[0];
    if (typeof href === "string") return href;
    if (href && typeof href === "object" && "@_href" in href) return String((href as { "@_href": string })["@_href"]);
  }
  if (item.link && typeof item.link === "object" && "@_href" in (item.link as object)) {
    return String((item.link as { "@_href": string })["@_href"]);
  }
  if (typeof (item as { id?: unknown }).id === "string" && /^https?:\/\//.test((item as { id: string }).id)) {
    return (item as { id: string }).id;
  }
  return null;
}

async function fetchWithTimeout(url: string, ua: string, timeoutMs = 8000): Promise<{ body: string; contentType: string } | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": ua,
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      signal: ctl.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    return { body, contentType };
  } finally {
    clearTimeout(t);
  }
}

function looksLikeFeed(body: string, contentType: string): boolean {
  const ct = contentType.split(";")[0].trim();
  if (ct.includes("xml") || ct.includes("rss") || ct.includes("atom")) return true;
  const head = body.slice(0, 600).trim();
  return /^<\?xml/.test(head) || /^<rss/.test(head) || /^<feed/.test(head) || /^<rdf/i.test(head);
}

async function fetchOneFeed(src: FeedSource): Promise<{ articles: Article[]; ok: boolean }> {
  let body: string | null = null;
  let contentType = "";
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3 && !body; attempt++) {
    const ua = USER_AGENTS[(attempt + src.url.length) % USER_AGENTS.length];
    if (attempt > 0) {
      const jitter = 400 + Math.floor(Math.random() * 600);
      await new Promise((r) => setTimeout(r, jitter));
    }
    try {
      const got = await fetchWithTimeout(src.url, ua);
      if (got) {
        body = got.body;
        contentType = got.contentType;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  if (!body) {
    console.warn(`  [skip] ${src.name}: ${lastErr instanceof Error ? lastErr.message : "fetch failed"}`);
    return { articles: [], ok: false };
  }

  if (!looksLikeFeed(body, contentType)) {
    console.warn(`  [skip] ${src.name}: not a feed (got ${contentType.split(";")[0] || "html"})`);
    return { articles: [], ok: false };
  }

  let json: Record<string, unknown>;
  try {
    json = PARSER.parse(body) as Record<string, unknown>;
  } catch {
    console.warn(`  [skip] ${src.name}: parse failed`);
    return { articles: [], ok: false };
  }

  const items = extractItems(json);
  const collectedAt = new Date().toISOString();
  const now = new Date();
  const out: Article[] = [];
  const ITEMS_PER_FEED_CAP = 15;
  const cappedItems = items.slice(0, ITEMS_PER_FEED_CAP);

  for (const item of cappedItems) {
    const rawTitle = cleanText(firstStr(item.title));
    const rawLink = linkFromItem(item);
    if (!rawTitle || !rawLink) continue;
    const descForUnwrap = firstStr(item.description, item.summary, item.content, item["content:encoded"]);
    const link = unwrapSync(rawLink, {
      description: descForUnwrap,
      comments: firstStr(item.comments),
    });

    const title = isGoogleNewsUrl(rawLink)
      ? stripGoogleNewsTitle(rawTitle, publisherFromItem(item))
      : rawTitle;
    if (isDateOnlyTitle(title)) continue;

    const rawDate = firstStr(item.pubDate, item.published, item.updated, item.date, (item as { "dc:date"?: unknown })["dc:date"]);
    const summarySrc = firstStr(item.description, item.summary, item.content, item["content:encoded"]);
    const summary = summarySrc
      ? cleanText(summarySrc).replace(/\s+/g, " ").trim().slice(0, 320)
      : null;

    out.push({
      id: hashId(link),
      title,
      url: link,
      source: src.name,
      category: src.category,
      priority: src.priority,
      publishedAt: extractDate(rawDate, now),
      publishedRaw: rawDate,
      summary,
      collectedAt,
    });
  }

  return { articles: out, ok: true };
}

export async function fetchAllFeeds(): Promise<{
  articles: Article[];
  feedStats: { source: string; ok: boolean; count: number }[];
}> {
  console.log(`Fetching ${SOURCES.length} feeds (2 concurrent per host)…`);
  const results = await Promise.all(
    SOURCES.map(async (src) => {
      const r = await HOST_POOL.run(rateLimitKey(src.url), () => fetchOneFeed(src));
      console.log(`  ${r.ok ? "OK" : "FAIL"}  ${src.name.padEnd(28)} ${r.articles.length} items`);
      return { src, ...r };
    })
  );

  const feedStats = results.map((r) => ({ source: r.src.name, ok: r.ok, count: r.articles.length }));
  let articles = results.flatMap((r) => r.articles);

  const gnUrls = articles.filter((a) => isGoogleNewsUrl(a.url)).map((a) => a.url);
  if (gnUrls.length > 0) {
    console.log(`Unwrapping ${gnUrls.length} Google News URLs…`);
    const resolved = await resolveGoogleNewsUrls(gnUrls);
    let hits = 0;
    articles = articles.map((a) => {
      const next = resolved.get(a.url);
      if (!next) return a;
      hits++;
      return { ...a, url: next, id: hashId(next) };
    });
    console.log(`  resolved ${hits}/${gnUrls.length} Google News URLs to publisher links`);
  }

  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  articles = articles.filter((a) => {
    const urlKey = a.url.replace(/[#?].*$/, "").replace(/\/$/, "");
    const titleKey = a.title.toLowerCase();
    if (seenUrl.has(urlKey) || seenTitle.has(titleKey)) return false;
    seenUrl.add(urlKey);
    seenTitle.add(titleKey);
    return true;
  });

  articles.sort((a, b) => {
    const p = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (p !== 0) return p;
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  console.log(`Total after dedup: ${articles.length}`);
  return { articles, feedStats };
}
