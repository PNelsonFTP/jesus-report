// Build-time daily verse fetch. Never runs in the browser.
// Stores only the key verse + reference + permalink — not devotion bodies.

import type { DailyVerse, VerseSourceId, VersesPayload } from "./types";
import {
  extractMeta,
  extractOdbKeyVerse,
  extractTitle,
  odbPermalink,
  parseBibleGatewayJson,
  parseYouVersionMeta,
  pickOdbItem,
} from "./lib/verseParse";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const SOURCE_ORDER: VerseSourceId[] = ["our-daily-bread", "bible-gateway", "youversion"];

interface OdbApiItem {
  date: number;
  title?: string;
  slug?: string;
  verse?: string;
  passage_reference?: string;
}

async function fetchText(
  url: string,
  accept: string,
  timeoutMs = 12000
): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: accept },
      signal: ctl.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 600)));
      }
    }
  }
  throw last instanceof Error ? last : new Error(`${label} failed`);
}

async function fetchOurDailyBread(nowIso: string): Promise<DailyVerse> {
  const raw = await withRetry("Our Daily Bread", () =>
    fetchText("https://api.experience.odb.org/devotionals/", "application/json")
  );
  const items = JSON.parse(raw) as OdbApiItem[];
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Our Daily Bread returned no devotionals");
  }
  const item = pickOdbItem(items);
  if (!item) throw new Error("Our Daily Bread had no item for today");
  const parsed = extractOdbKeyVerse(item.verse ?? "", item.passage_reference);
  if (!parsed) throw new Error("Our Daily Bread item had no key verse");
  return {
    id: "our-daily-bread",
    source: "Our Daily Bread",
    text: parsed.text,
    reference: parsed.reference,
    url: odbPermalink(item.date, item.slug),
    title: item.title?.trim() || null,
    fetchedAt: nowIso,
  };
}

async function fetchBibleGateway(nowIso: string): Promise<DailyVerse> {
  const raw = await withRetry("Bible Gateway", () =>
    fetchText("https://www.biblegateway.com/votd/get/?format=json", "application/json")
  );
  const parsed = parseBibleGatewayJson(raw);
  if (!parsed) throw new Error("Bible Gateway VOTD JSON was empty");
  return {
    id: "bible-gateway",
    source: "Bible Gateway",
    text: parsed.text,
    reference: parsed.reference,
    url: parsed.url,
    version: parsed.version,
    fetchedAt: nowIso,
  };
}

async function fetchYouVersion(nowIso: string): Promise<DailyVerse> {
  const html = await withRetry("YouVersion", () =>
    fetchText("https://www.bible.com/verse-of-the-day", "text/html")
  );
  const parsed = parseYouVersionMeta(
    extractTitle(html),
    extractMeta(html, "og:description")
  );
  if (!parsed) throw new Error("YouVersion page had no verse text");
  return {
    id: "youversion",
    source: "YouVersion",
    text: parsed.text,
    reference: parsed.reference,
    url: "https://www.bible.com/verse-of-the-day",
    fetchedAt: nowIso,
  };
}

function mergeVerses(
  fresh: Array<DailyVerse | null>,
  prev: VersesPayload | null,
  nowIso: string
): VersesPayload {
  const byId = new Map<VerseSourceId, DailyVerse>();
  for (const v of prev?.verses ?? []) byId.set(v.id, v);
  let replaced = 0;
  for (const v of fresh) {
    if (!v) continue;
    byId.set(v.id, v);
    replaced++;
  }
  const verses = SOURCE_ORDER.map((id) => byId.get(id)).filter((v): v is DailyVerse => !!v);
  if (replaced === 0 && prev && prev.verses.length > 0) return prev;
  return { generatedAt: nowIso, verses };
}

export async function fetchDailyVerses(prev: VersesPayload | null): Promise<VersesPayload> {
  const nowIso = new Date().toISOString();
  console.log("Fetching daily verses (Our Daily Bread, Bible Gateway, YouVersion)…");

  const results = await Promise.allSettled([
    fetchOurDailyBread(nowIso),
    fetchBibleGateway(nowIso),
    fetchYouVersion(nowIso),
  ]);

  const fresh: Array<DailyVerse | null> = results.map((r, i) => {
    const label = ["Our Daily Bread", "Bible Gateway", "YouVersion"][i];
    if (r.status === "fulfilled") {
      console.log(`  OK    ${label.padEnd(18)} ${r.value.reference}`);
      return r.value;
    }
    const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
    console.warn(`  FAIL  ${label.padEnd(18)} ${msg}`);
    return null;
  });

  const payload = mergeVerses(fresh, prev, nowIso);
  if (payload.verses.length === 0) {
    console.warn("No daily verses fetched — keeping previous verses.json if present.");
  }
  return payload;
}
