# The Jesus Report — Design

Architecture, data flow, algorithms, and editorial rules.
Last updated: 2026-08-18.

## 1. System overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions (hourly)                           │
│  build:data → public/data/*.json + public/feed.xml                      │
│  build:check (quality gate) → vite build → deploy dist/ to Pages        │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     GitHub Pages (static hosting)                        │
│   https://pnelsonftp.github.io/jesus-report/                             │
│   ├── index.html + JS/CSS                                                │
│   ├── data/headlines-preview.json, headlines.json, brief.json            │
│   └── feed.xml                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     Browser (React SPA, no backend)                      │
│   Fetch JSON → session cache → 3-column wire layout                      │
│   localStorage: bookmarks, queue, mutes, read-state, theme               │
└──────────────────────────────────────────────────────────────────────────┘
```

**All network I/O to third-party feeds happens at build time, never in the
browser.** If fetch returns zero articles, the previous `headlines.json` is
kept and the process exits 0.

## 2. Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript 5.8 |
| Build | Vite 6, `base: "/jesus-report/"` |
| CSS | Tailwind v4 (`@tailwindcss/vite`) |
| XML | `fast-xml-parser` 5 (raised entity-expansion caps) |
| Hosting | GitHub Pages project site |
| CI | Actions: hourly refresh + weekly feed audit |

## 3. Build pipeline

### 3.1 Orchestration (`scripts/build-data.ts`)

1. `fetchAllFeeds()` — RSS / Atom / RDF
2. `buildCategories()` — route, score, age windows, trending, lead
3. Write minified `headlines.json` and `headlines-preview.json`
4. `buildSiteFeed()` → `public/feed.xml`
5. `generateBrief()` → `brief.json`
6. `churchYearLine()` — Western liturgical season, build-time only

No stock ticker. No Hacker News index. No HTML scrapers in v1.

### 3.2 Fetch (`scripts/fetch-feeds.ts`)

- Per-host pool, max 2 in flight
- 8s timeout, 3 attempts, rotating User-Agent
- Reject non-XML bodies (SPA / Cloudflare HTML)
- Cap 15 items per feed
- Date-only titles (e.g. “Tuesday, August 18, 2026”) are dropped
- Dedup by normalized URL, then by lowercased title
- Global sort: feed priority, then recency

### 3.3 Scoring (`scripts/lib/score.ts`)

```
finalScore = priorityScore    (critical 40 / high 25 / medium 12 / low 4)
           + recencyScore     (100 → 48h half-life, floor 2)
           + importanceScore  (0–30; recency-gated to <96h)
           + homeBonus        (6 when scored in the feed’s home category)
```

Pope, Vatican, and Catholic-institution headlines are removed before
scoring (`scripts/lib/editorial.ts`). A persecution, disaster, or public
religious-liberty ruling can stay even if it mentions Catholics. Hierarchy
words such as bishop are not importance boosts.

Recency still dominates: a fresh medium item outranks a three-day-old
critical one.

### 3.4 Routing (`scripts/lib/router.ts`)

1. Global cap: 6 articles per source per build
2. Home category, plus at most one specific keyword cross-file (aggregators
   in `KEYWORD_AGNOSTIC_SOURCES` stay home-only)
3. World & Persecution keeps persecution wires and persecution stories only
4. Hard age-window drop → score → starvation fill → story grouping →
   at most 2 items per source in the visible 10
5. Trending: ≥2 outlets, looser title match, under 72h (relax to 120h).
   If nothing clusters, the row shows up to 4 top stories from Scripture,
   church, missions, and persecution instead of sitting empty.
6. Lead story: highest score under 72h in Bible reading or devotion.
   Persecution stories stay in World & Persecution and do not lead the page.

### 3.5 Age windows

| Lane | Categories | Soft / hard days |
|------|------------|------------------|
| Fast | inspiration, public_life, church | 3 / 5 |
| Mid | missions, world, family, culture, music_arts | 7 / 10 |
| Slow | scripture, theology, podcasts | 14 / 21 |

### 3.6 Brief (`scripts/generate-brief.ts`)

With `ANTHROPIC_API_KEY`: Claude Sonnet, anti-hallucination prompt, cited
URLs must exist in the input. Without it: trending + one item each from
scripture / church-world / hopeful-service. Titles shorter than four words
are skipped.

### 3.7 Quality gate (`scripts/check-data.ts`)

Hard-fail: feed health <80%, any displayed item older than 30 days, or
more than half the sections empty. Warn: median age >96h, health <90%,
thin trending.

### 3.8 Feed validator (`scripts/validate-feeds.ts`)

`npm run validate:feeds` — HTTP, sniff, parse, item count, newest-item age
(STALE >60d), cross-host redirects. Weekly `feed-audit.yml` opens or
updates a `Feed audit:` issue.

## 4. Data contracts

`HeadlinesPayload` (`scripts/types.ts` ≡ `src/lib/types.ts`):

```ts
{
  generatedAt: string;
  totalCount: number;
  trending: TrendingStory[];
  categories: CategoryBucket[];
  feedStats: { source, ok, count }[];
  leadUrl?: string | null;
  churchYear?: { season: string; line: string };
  partial?: boolean;   // true on headlines-preview.json
}
```

### localStorage (`jesus-report:` prefix)

| Key | Purpose |
|-----|---------|
| `bookmarks` / `read-later` | Saved IDs |
| `article-snapshots` | Full copies so saves survive refresh |
| `muted-sources` / `muted-categories` | Hidden outlets / sections |
| `seen-articles` | Read-state LRU (cap 500) |
| `last-visit` | “N new since your last visit” |
| `theme` | `light` (default) or `dark` |
| `cache:*` | sessionStorage SWR copies |

## 5. Client

Header (search, bookmarks, queue, mutes, theme, church-year line) → Daily
Brief → Trending → Lead → LATEST strip → 3-column category grid.
Mobile: tap section headings to collapse.

First visit loads `headlines-preview.json`, then hydrates `headlines.json`.
Returning visits with a full session cache skip the preview.

## 6. Categories (homepage order)

| id | Label |
|----|--------|
| `scripture` | BIBLE READING & STUDY |
| `inspiration` | DEVOTION & ENCOURAGEMENT |
| `church` | FAITH & COMMUNITY |
| `family` | FAMILY & LIFE |
| `theology` | THEOLOGY & APOLOGETICS |
| `podcasts` | TALKS & PODCASTS |
| `missions` | MISSIONS & SERVICE |
| `culture` | FAITH & CULTURE |
| `music_arts` | WORSHIP & ARTS |
| `public_life` | PUBLIC LIFE |
| `world` | WORLD & PERSECUTION |

Sections with fewer than 4 stories are hidden until they fill.
Hopeful News (secular wires) is not on the homepage. See the comment
block at the top of `scripts/sources.ts` for skipped URLs.

## 7. Related

- [HANDOFF.md](./HANDOFF.md)
- [DEPLOY.md](./DEPLOY.md)
- [../README.md](../README.md)
