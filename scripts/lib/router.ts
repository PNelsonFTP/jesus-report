import type { Article, CategoryBucket, GroupedArticle, TrendingStory } from "../types";
import { AGE_WINDOWS, CATEGORIES, KEYWORDS, type CategoryId } from "../sources";
import { ageHours, finalScore, type ScoreCtx } from "./score";
import { groupStories } from "./groupStories";

// Aggregators stay in their home category only — their titles match too broadly.
export const KEYWORD_AGNOSTIC_SOURCES = new Set([
  "Good News Network",
  "Positive News",
  "Reasons to be Cheerful",
]);

export function isAggregatorSource(name: string): boolean {
  if (KEYWORD_AGNOSTIC_SOURCES.has(name)) return true;
  if (name.startsWith("HN:") || name.startsWith("GN:")) return true;
  if (name.includes("Google News")) return true;
  return false;
}

function toPlain(g: GroupedArticle): Article {
  const { related: _related, ...plain } = g;
  return plain;
}

export function pickTrendingLead(
  members: { article: GroupedArticle; score: number }[],
): GroupedArticle {
  if (members.length === 0) {
    throw new Error("pickTrendingLead: empty cluster");
  }
  const sorted = [...members].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const threshold = top.score * 0.9;
  const press = sorted.find((m) => !isAggregatorSource(m.article.source) && m.score >= threshold);
  const chosen = press?.article ?? top.article;
  const others = members.map((m) => m.article).filter((a) => a.url !== chosen.url);
  const seen = new Set<string>([chosen.url]);
  const related: Article[] = [];
  const add = (a: Article) => {
    if (seen.has(a.url)) return;
    seen.add(a.url);
    related.push(a);
  };
  for (const r of chosen.related) add(r);
  for (const o of others) {
    add(toPlain(o));
    for (const r of o.related) add(r);
  }
  return { ...chosen, related };
}

function routesFor(article: Article): Set<CategoryId> {
  const cats = new Set<CategoryId>([article.category]);
  if (KEYWORD_AGNOSTIC_SOURCES.has(article.source)) return cats;
  const hay = `${article.title} ${article.summary ?? ""}`.toLowerCase();
  for (const rule of KEYWORDS) {
    for (const kw of rule.match) {
      if (hay.includes(kw)) {
        cats.add(rule.routeTo);
        break;
      }
    }
  }
  return cats;
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","by","at","from",
  "is","are","was","were","be","been","as","it","its","this","that","these","those",
  "says","said","will","has","have","had","new","via","after","over","into",
  "you","your","i","we","our","they","their","he","she","his","her",
  "church","christian","god","jesus",
]);
function titleTokens(title: string): Set<string> {
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

interface ScoredArticle {
  article: Article;
  score: number;
}

function enforceDiversity<T extends { article: Article }>(
  scored: T[],
  capFirst = 6,
  maxPerSource = 2
): T[] {
  const head: T[] = [];
  const tail: T[] = [];
  const counts = new Map<string, number>();

  for (const item of scored) {
    const src = item.article.source;
    const n = counts.get(src) ?? 0;
    if (head.length < capFirst && n < maxPerSource) {
      head.push(item);
      counts.set(src, n + 1);
    } else {
      tail.push(item);
    }
  }
  return [...head, ...tail];
}

function starvationFill(
  scored: ScoredArticle[],
  softDays: number,
  hardDays: number,
  minItems: number,
  now: Date,
): ScoredArticle[] {
  const softHrs = softDays * 24;
  const hardHrs = hardDays * 24;

  const soft = scored.filter((s) => ageHours(s.article.publishedAt, now) <= softHrs);
  if (soft.length >= minItems) return soft;

  const middle = scored.filter((s) => {
    const h = ageHours(s.article.publishedAt, now);
    return h > softHrs && h <= hardHrs;
  });
  const need = minItems - soft.length;
  return [...soft, ...middle.slice(0, Math.max(0, need))];
}

export interface BuildCategoriesResult {
  buckets: CategoryBucket[];
  trending: TrendingStory[];
  leadUrl: string | null;
}

const GLOBAL_PER_SOURCE_CAP = 6;

export function buildCategories(articles: Article[]): BuildCategoriesResult {
  const now = new Date();

  const perSourceCount = new Map<string, number>();
  const sourceLimited = articles.filter((a) => {
    const n = perSourceCount.get(a.source) ?? 0;
    if (n >= GLOBAL_PER_SOURCE_CAP) return false;
    perSourceCount.set(a.source, n + 1);
    return true;
  });

  const routed = sourceLimited.map((a) => ({ article: a, cats: routesFor(a) }));
  const buckets: CategoryBucket[] = [];

  const storyCoverage = new Map<string, {
    members: { article: GroupedArticle; score: number }[];
    sources: Set<string>;
    categories: Set<CategoryId>;
    maxScore: number;
    title: string;
  }>();

  let leadCandidate: { url: string; score: number } | null = null;

  for (const meta of CATEGORIES) {
    const window = AGE_WINDOWS[meta.id];
    const inCat: ScoredArticle[] = [];
    for (const { article, cats } of routed) {
      if (!cats.has(meta.id)) continue;
      const ageH = ageHours(article.publishedAt, now);
      if (ageH > window.hardDays * 24) continue;
      const ctx: ScoreCtx = {
        now,
        forCategoryId: meta.id,
        isHomeCategory: article.category === meta.id,
      };
      inCat.push({ article, score: finalScore(article, ctx) });
    }

    if (inCat.length === 0) continue;

    inCat.sort((a, b) => b.score - a.score);
    const filled = starvationFill(inCat, window.softDays, window.hardDays, window.minItems, now);
    filled.sort((a, b) => b.score - a.score);

    const top = filled.slice(0, 25);
    const grouped: GroupedArticle[] = groupStories(top.map((s) => s.article));
    const scoreByTitle = new Map(top.map((s) => [s.article.title, s.score]));
    grouped.sort((a, b) => (scoreByTitle.get(b.title) ?? 0) - (scoreByTitle.get(a.title) ?? 0));

    const distinctSources = new Set(grouped.map((g) => g.source)).size;
    const maxPerSource = distinctSources <= 2 ? 5 : distinctSources <= 4 ? 4 : 3;
    const withScore = grouped.map((g) => ({
      article: g,
      score: scoreByTitle.get(g.title) ?? 0,
    }));
    const diversified = enforceDiversity(withScore, withScore.length, maxPerSource);
    const ordered = diversified.map((d) => d.article);

    buckets.push({
      id: meta.id,
      label: meta.label,
      articles: ordered.slice(0, 10),
      articlesAll: ordered.slice(0, 20),
      sourceCount: distinctSources,
    });

    for (const g of ordered.slice(0, 20)) {
      const allSources = new Set<string>([g.source, ...g.related.map((r) => r.source)]);
      const score = scoreByTitle.get(g.title) ?? 0;
      const ageH = ageHours(g.publishedAt, now);

      if (ageH <= 72 && (!leadCandidate || score > leadCandidate.score)) {
        leadCandidate = { url: g.url, score };
      }

      let existing = storyCoverage.get(g.url);
      if (!existing) {
        const gTok = titleTokens(g.title);
        for (const [, ev] of storyCoverage) {
          if (jaccard(gTok, titleTokens(ev.title)) >= 0.4) {
            existing = ev;
            break;
          }
        }
      }
      if (existing) {
        allSources.forEach((s) => existing!.sources.add(s));
        existing.categories.add(meta.id);
        existing.members.push({ article: g, score });
        if (score > existing.maxScore) existing.maxScore = score;
      } else {
        storyCoverage.set(g.url, {
          members: [{ article: g, score }],
          sources: allSources,
          categories: new Set([meta.id]),
          maxScore: score,
          title: g.title,
        });
      }
    }
  }

  const TRENDING_FRESH_H = 72;
  const TRENDING_RELAXED_H = 120;
  const TRENDING_MIN = 4;

  const withLead = [...storyCoverage.values()]
    .filter((s) => s.sources.size >= 2)
    .map((s) => {
      const lead = pickTrendingLead(s.members);
      const clusterAgeH = Math.min(
        ...s.members.map((m) => ageHours(m.article.publishedAt, now)),
      );
      return { ...s, lead, clusterAgeH };
    });

  let trending = withLead.filter((s) => s.clusterAgeH <= TRENDING_FRESH_H);
  if (trending.length < TRENDING_MIN) {
    trending = withLead.filter((s) => s.clusterAgeH <= TRENDING_RELAXED_H);
  }
  trending.sort((a, b) => {
    if (b.sources.size !== a.sources.size) return b.sources.size - a.sources.size;
    return b.maxScore - a.maxScore;
  });
  const trendingOut: TrendingStory[] = trending.slice(0, 12).map((s) => ({
    lead: s.lead,
    sources: [...s.sources],
    sourceCount: s.sources.size,
    categoryIds: [...s.categories],
  }));

  return { buckets, trending: trendingOut, leadUrl: leadCandidate?.url ?? null };
}
