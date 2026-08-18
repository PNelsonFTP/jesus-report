import type { Article, Brief, CategoryBucket, TrendingStory } from "./types";
import { PRIORITY_WEIGHT } from "./sources";

export interface BriefContext {
  trending: TrendingStory[];
  categories: CategoryBucket[];
}

function pickTop(articles: Article[], n: number): Article[] {
  return [...articles]
    .sort((a, b) => {
      const p = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (p !== 0) return p;
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, n);
}

function fallback(articles: Article[], ctx: BriefContext | undefined): Brief {
  const cited: { title: string; url: string; source: string }[] = [];
  const seenUrls = new Set<string>();

  const add = (a: Article | TrendingStory["lead"]) => {
    if (seenUrls.has(a.url)) return;
    const words = a.title.trim().split(/\s+/).filter(Boolean);
    if (words.length < 4) return;
    seenUrls.add(a.url);
    cited.push({ title: a.title, url: a.url, source: a.source });
  };

  if (ctx?.trending && ctx.trending.length > 0) {
    add(ctx.trending[0].lead);
  }

  const mixOrder = [
    "scripture", "church", "world", "missions", "inspiration",
    "positive", "theology", "public_life", "family", "culture",
  ];
  if (ctx?.categories) {
    for (const id of mixOrder) {
      if (cited.length >= 6) break;
      const cat = ctx.categories.find((c) => c.id === id);
      if (cat && cat.articles.length > 0) add(cat.articles[0]);
    }
  }

  if (cited.length === 0) {
    for (const a of pickTop(articles, 5)) add(a);
  }

  const headline = cited.length > 0
    ? `Today in the Church: ${cited[0].title}`
    : "No headlines available";

  return {
    generatedAt: new Date().toISOString(),
    source: "fallback",
    headline,
    bullets: cited.map((c) => c.title),
    citedArticles: cited.slice(0, 6),
  };
}

const SYSTEM_PROMPT = `You are the editor of The Jesus Report, a faith-related news aggregator.
You will receive a JSON list of today's headlines (title, source, category, summary)
PLUS a list of trending stories (those covered by multiple outlets).

Your job: produce a 4-6 bullet "daily brief" that synthesizes the most important themes.

HARD RULES (violation = failure):
- ONLY reference articles present in the input. Do not invent stories.
- Do NOT invent verses, statistics, quotes, names, or dates that are not in the input.
- If Scripture is cited, the reference must appear in the source headline or summary.
- Each bullet must be one sentence, ~15-25 words.
- Be neutral and factual. No hype words. No sermonizing.
- Mix: include at least one Scripture/study item, one church/world item, and one
  hopeful/service item when those exist in the input.
- Prioritize themes covered by MULTIPLE sources. Do not let one loud feed dominate.

Respond as strict JSON: {"headline": str, "bullets": str[], "cited": [{"title","url","source"}]}
The "cited" array must contain 4-6 of the actual input articles that the brief references.`;

interface ClaudeResponse {
  content: { type: "text"; text: string }[];
}

export async function generateBrief(
  articles: Article[],
  ctx?: BriefContext
): Promise<Brief> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || articles.length === 0) {
    return fallback(articles, ctx);
  }

  const top = pickTop(articles, 60);
  const input = top.map((a) => ({
    title: a.title,
    source: a.source,
    category: a.category,
    summary: a.summary,
    url: a.url,
  }));
  const trendingInput = (ctx?.trending ?? []).map((t) => ({
    title: t.lead.title,
    sources: t.sources,
    sourceCount: t.sourceCount,
  }));

  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 30000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Today's headlines:\n\n${JSON.stringify(input, null, 2)}\n\nTrending (multi-source coverage):\n${JSON.stringify(trendingInput, null, 2)}`,
          },
        ],
      }),
      signal: ctl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      console.warn(`  Claude brief: HTTP ${res.status}, using fallback`);
      return fallback(articles, ctx);
    }

    const json = (await res.json()) as ClaudeResponse;
    const text = json.content?.find((b) => b.type === "text")?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn("  Claude brief: no JSON in response, using fallback");
      return fallback(articles, ctx);
    }
    const parsed = JSON.parse(match[0]) as {
      headline: string;
      bullets: string[];
      cited: { title: string; url: string; source: string }[];
    };

    const validUrls = new Set(input.map((a) => a.url));
    const cited = (parsed.cited || []).filter((c) => validUrls.has(c.url));

    return {
      generatedAt: new Date().toISOString(),
      source: "claude",
      headline: parsed.headline ?? "Daily Brief",
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 6) : [],
      citedArticles: cited,
    };
  } catch (e) {
    console.warn(`  Claude brief failed: ${e instanceof Error ? e.message : "unknown"}, using fallback`);
    return fallback(articles, ctx);
  }
}
