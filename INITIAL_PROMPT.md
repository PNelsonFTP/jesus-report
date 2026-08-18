# The Jesus Report — initial build prompt

Paste this entire file as the first message in a **new** Cursor Agent chat
whose workspace root is `/Users/paulnelson/Documents/Development/jesus-report`.

---

You are scaffolding **The Jesus Report**, a new standalone static news site.

## What this is

A dense, three-column wire-style homepage (classic newspaper aggregator
layout: masthead, lead story, trending, then category columns) for:

- Christianity and the Church
- Bible study, devotionals, and Scripture-related writing
- Missions, ministry, and service
- Christian-friendly and generally **hopeful / constructive** news
- Inspiration that a believer would be glad to open in the morning

Hard news that is negative (persecution, church scandal, disaster) is
**allowed** when it is real and relevant. This is not a filter bubble that
hides suffering. It **is** a place Christians can go first for faith-related
and faith-friendly headlines instead of a generic outrage feed.

**Public name:** The Jesus Report  
**Never use the word “Drudge”** (or “AI Drudge”) in the product name, UI,
repo, class names, comments, or localStorage keys.

## What this is not

- Not a fork, package, or folder inside the AI Drudge repo
- Not a redesign of AI Drudge
- Do **not** edit `/Users/paulnelson/Documents/Development/ai-drudge`
- You may **read** that repo as a reference implementation of the
  build-time RSS → static JSON → GitHub Pages pattern

## Architecture (non-negotiable)

Copy the **pattern**, not the branding:

```
GitHub Actions (hourly)
  fetch RSS/Atom/RDF (+ optional HTML scrapers) at build time
  route / score / group → public/data/*.json + public/feed.xml
  quality gate → vite build → GitHub Pages
Browser
  React SPA loads only our JSON (SWR + sessionStorage)
  localStorage for theme, bookmarks, read-later, mutes, read-state
```

Hard constraints:

- **All third-party fetching is build-time only.** Never scrape RSS from
  the browser or from Next.js / API routes at request time. That pattern
  OOMs and rate-limits.
- If fetch+scrape return **zero** articles, keep the previous
  `headlines.json` and exit 0 (site never goes blank).
- `vite.config.ts` `base: "/jesus-report/"` for GitHub Pages project site
  `https://<user>.github.io/jesus-report/`
- No user accounts. No secrets in the client. Optional Claude daily brief
  via `ANTHROPIC_API_KEY` at build time, with a curated fallback.
- TypeScript throughout. Vite 6 + React 19 + Tailwind v4 + `fast-xml-parser` 5.

Reference files in the AI Drudge repo (read-only): `README.md`,
`docs/DESIGN.md`, `scripts/build-data.ts`, `scripts/fetch-feeds.ts`,
`scripts/lib/router.ts`, `scripts/lib/score.ts`, `scripts/sources.ts`,
`src/App.tsx`, `.github/workflows/refresh.yml`.

## Visual direction

- Three-column desktop layout, single column + accordion on mobile
- Masthead: **THE JESUS REPORT** (serif or restrained display type — not
  Geist if network-flaky fonts are a risk; system / widely available fonts
  are fine for v1)
- Palette: paper / ink, with a single accent (deep crimson or warm gold).
  Light theme default; dark theme toggle
- Same *information density* as a wire homepage: many headlines, short
  source lines, hover preview, NEW badge for fresh items
- Do not build a modern “card grid magazine.” This should feel like a
  living newspaper front page.

Keep v1 features that readers already expect from this architecture:

- Search
- Bookmarks + read-later (snapshots so saved items survive refresh)
- Read-state dimming
- Mute source / category
- Trending (2+ distinct sources, freshness-gated)
- Lead story (<72h)
- LATEST chronological strip
- Daily brief (Claude if key present, else curated fallback)
- Feed Health panel
- Site Atom feed at `/jesus-report/feed.xml`

Skip for v1 unless asked: PWA, custom domain, analytics, accounts, comments.

## Category taxonomy (v1 — 12 sections)

Use these `CategoryId`s and homepage labels. Order = homepage order.

| id | Label | What belongs here |
|----|--------|-------------------|
| `scripture` | SCRIPTURE & STUDY | Bible study, commentaries, original-language notes, reading plans |
| `church` | CHURCH & MINISTRY | Denominations, pastors, congregational life, worship practice |
| `missions` | MISSIONS & SERVICE | Global mission, relief, prison, homelessness, adoption |
| `inspiration` | INSPIRATION | Devotionals, testimonies, encouragement, “good news” that is not fluff |
| `culture` | FAITH & CULTURE | Arts, books, film, family, education — Christian or constructive |
| `public_life` | PUBLIC LIFE | Religious liberty, policy, church-and-state, civic news that is faith-relevant |
| `world` | WORLD & PERSECUTION | International church, persecution, Holy Land, global Christianity |
| `theology` | THEOLOGY & APOLOGETICS | Doctrine, history, apologetics, thoughtful essays |
| `family` | FAMILY & LIFE | Marriage, parenting, youth, pro-life, caregiving |
| `music_arts` | WORSHIP & ARTS | Music, liturgy, sacred art (not celebrity gossip) |
| `positive` | HOPEFUL NEWS | Constructive general news a Christian reader would welcome |
| `podcasts` | TALKS & PODCASTS | Sermons / interviews **only if the feed has real episode titles and dates** |

Do not add a generic “cyber threats” lane. Do not clone AI-lab or GPU
sections from the reference site.

## Scoring & freshness

Port the reference scoring idea, retuned:

- Recency dominates (exponential decay, ~48h half-life)
- Feed priority: first-party ministries / journals `high` or `critical`;
  good secondary `medium`; aggregators `low` if used at all
- Importance keywords should include: revival, missionary, translation,
  martyr, persecution, encyclical, synod, SBC, Vatican, gospel, scripture,
  church plant, seminary — **and** keep a recency gate so old posts cannot
  rank on keyword hits alone
- Per-category hard age windows (balanced):
  - Fast (3/5 days): `inspiration`, `positive`, `public_life`, `church`
  - Mid (7/10): `missions`, `world`, `family`, `culture`, `music_arts`
  - Slow (14/21): `scripture`, `theology`, `podcasts`
- Starvation-aware fill: prefer fewer fresh items over stale padding
- Trending: ≥2 sources and <72h (relax to 120h only to reach 4 clusters)
- Prefer a first-party / ministry headline as the trending lead when an
  aggregator member is only marginally higher-scored
- Global cap ~6 articles per source per build; per-feed cap 15 items

## Sources (quality-first — do not pad)

Start with a **small, probed** set (aim 40–70 feeds, not 170). Every URL
must be fetch-verified (HTTP 200 + real RSS/Atom + at least one item from
the last 60 days) before it goes in `scripts/sources.ts`.

Prefer first-party:

- Bible / study: Bible Project (if a real feed exists), Crossway, Desiring
  God, Ligonier, Gospel Coalition, Christianity Today, First Things,
  Mere Orthodoxy, Comment, Plough
- News: Religion News Service, Christian Post, CBN (if feed is real XML),
  World Magazine, Anglican Ink / Catholic News Agency / Baptist Press —
  **only after a live probe**
- Vatican / CT / evangelical / Orthodox mix so one tradition does not own
  the homepage
- Missions: IMB, SIM, Open Doors, Barnabas (probe; drop 403/HTML shells)
- Positive / constructive: one or two carefully chosen general “good news”
  feeds, not a dump of viral uplift blogs
- Devotionals: only if dated and not a 365-day reprint firehose

Skip unless a probe is excellent:

- Reddit, most Google News queries, rage-bait political wires
- Undated sermon-audio dumps
- Paywalled 403 feeds
- Duplicate coverage of the same hostname+path

Document skipped/dead URLs in a comment at the top of `sources.ts` so the
next session does not re-litigate them.

Optional v1 HTML scrapers **only** if there is no RSS and a listing page
has stable article cards (href + title). Do not scrape behind logins.

No stock ticker. If you want a small “today in the Church year” or
lectionary line in the header, that is welcome; keep it static or
build-time, not a client API.

## Daily brief

If `ANTHROPIC_API_KEY` is set, generate a 4–6 bullet brief grounded **only**
in fetched headlines. Rules:

- No invented verses, statistics, or quotes
- If Scripture is cited, the reference must appear in the source headline
  or summary
- Mix: at least one Scripture/study item, one church/world item, one
  hopeful/service item when those exist
- Fallback without a key: curated from trending + category leads, not
  three posts from one loud feed

## Repo & CI

- Package name: `jesus-report`
- Scripts: `dev`, `build`, `build:data`, `build:check`, `typecheck`,
  `validate:feeds`, `preview`
- Workflows:
  - `refresh.yml` — hourly cron + push to `main` + `workflow_dispatch`
  - `feed-audit.yml` — weekly, non-blocking on hourly
- Commit generated `public/data/*.json` and `public/feed.xml` from CI
- README: what the site is, local commands, how to add a feed
- `docs/DESIGN.md` + `docs/HANDOFF.md` (short) so the next session can
  operate it

## Implementation order

1. Scaffold Vite/React/TS/Tailwind in **this** folder
2. Port the data pipeline (fetch, score, route, group, quality gate) with
   new types/categories — new file names and copy, no leftover AI-lab
   constants
3. Probe and add the first source list
4. Build the homepage (masthead, brief, trending, lead, LATEST, columns)
5. Client features listed above
6. GitHub Actions + README + docs
7. `npm run typecheck` and a local `build:data` if network is available

When you are done, print:

- Live-dev URL (`http://localhost:5173/jesus-report/`)
- `SOURCES.length` and a short ADDED / SKIPPED table
- What still needs a GitHub repo + Pages enablement (do not invent a remote
  unless I ask)

Start implementing in `/Users/paulnelson/Documents/Development/jesus-report`.
Do not touch the AI Drudge project.
