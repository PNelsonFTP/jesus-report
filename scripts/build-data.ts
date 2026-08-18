import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fetchAllFeeds } from "./fetch-feeds";
import { generateBrief } from "./generate-brief";
import { buildCategories } from "./lib/router";
import { buildSiteFeed } from "./lib/emitFeed";
import { churchYearLine } from "./lib/churchYear";
import type { HeadlinesPayload } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../public/data");
const PUBLIC_DIR = resolve(__dirname, "../public");

async function readJsonIfExists<T>(path: string): Promise<T | null> {
  try {
    const txt = await readFile(path, "utf-8");
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

async function writeJsonMin(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data));
}

async function main() {
  const feedOut = await fetchAllFeeds();
  const allArticles = feedOut.articles;
  const allFeedStats = feedOut.feedStats;
  const churchYear = churchYearLine();

  if (allArticles.length === 0) {
    console.warn("No articles fetched — keeping previous headlines.json (graceful degradation).");
    const prev = await readJsonIfExists<HeadlinesPayload>(resolve(DATA_DIR, "headlines.json"));
    if (!prev) {
      await writeJsonMin(resolve(DATA_DIR, "headlines.json"), {
        generatedAt: new Date().toISOString(),
        totalCount: 0,
        trending: [],
        categories: [],
        feedStats: allFeedStats,
        churchYear,
      });
    }
    process.exit(0);
  }

  const { buckets: categories, trending, leadUrl } = buildCategories(allArticles);

  const payload: HeadlinesPayload = {
    generatedAt: new Date().toISOString(),
    totalCount: categories.reduce((n, b) => n + b.articles.length, 0),
    trending,
    categories,
    feedStats: allFeedStats,
    leadUrl,
    churchYear,
  };

  await writeJsonMin(resolve(DATA_DIR, "headlines.json"), payload);
  console.log(
    `Wrote headlines.json — ${payload.totalCount} grouped stories across ${categories.length} categories, ${trending.length} trending.`
  );

  const preview: HeadlinesPayload = {
    ...payload,
    partial: true,
    categories: payload.categories.map((c) => ({
      ...c,
      fullCount: c.articlesAll.length,
      articlesAll: [],
    })),
  };
  await writeJsonMin(resolve(DATA_DIR, "headlines-preview.json"), preview);
  console.log(`Wrote headlines-preview.json`);

  const siteFeed = buildSiteFeed(trending, categories, payload.generatedAt);
  await writeFile(resolve(PUBLIC_DIR, "feed.xml"), siteFeed);
  console.log("Wrote feed.xml");

  const brief = await generateBrief(allArticles, { trending, categories });
  await writeJsonMin(resolve(DATA_DIR, "brief.json"), brief);
  console.log(`Wrote brief.json — source: ${brief.source}, ${brief.bullets.length} bullets.`);

  console.log("Done.");
}

main().catch((e) => {
  console.error("build-data failed:", e);
  process.exit(1);
});
