# The Jesus Report

A dense, three-column wire homepage for Christianity, Scripture, church life,
missions, and hopeful news. Static site — no application server — refreshed
hourly by GitHub Actions and hosted on GitHub Pages.

**Public name:** The Jesus Report  
**Live:** https://pnelsonftp.github.io/jesus-report/  
**Subscribe:** https://pnelsonftp.github.io/jesus-report/feed.xml (Atom)  
**Local:** http://localhost:5173/jesus-report/

This is a standalone project. It is not a fork or package of any other site.

## Why this exists

All third-party RSS fetching happens **once per hour at build time**. The
browser only loads JSON that we wrote. That avoids request-time scraping,
memory blows, rate limits, and blank refresh pages.

If a refresh fetches zero articles, the previous `headlines.json` is kept and
the build exits 0 — the live homepage never goes blank.

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript |
| Build | Vite 6 (`base: "/jesus-report/"`) |
| CSS | Tailwind v4 |
| Feeds | `fast-xml-parser` 5, Node `fetch` in CI only |
| Hosting | GitHub Pages (project site) |
| Refresh | `.github/workflows/refresh.yml` — hourly cron at `:05` |
| Audit | `.github/workflows/feed-audit.yml` — Mondays 12:00 UTC |

## Local development

```bash
npm ci
npm run build:data     # Fetch ~46 feeds + brief (needs network)
npm run dev            # http://localhost:5173/jesus-report/
```

| Command | Purpose |
|---------|---------|
| `npm run build:data` | Fetch feeds → `public/data/*.json` + `public/feed.xml` |
| `npm run build:check` | Quality gate on generated data |
| `npm run validate:feeds` | Liveness / freshness / redirect audit |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | URL unwrap, trending-lead, church-year |
| `npm run build` | Production bundle to `dist/` |
| `npm run preview` | Serve `dist/` locally |

## How the hourly refresh works

1. GitHub Actions runs `.github/workflows/refresh.yml` every hour (`5 * * * *`),
   on every push to `main`, and on manual **Run workflow**.
2. It typechecks, fetches every feed, writes JSON + the site Atom feed, and
   runs the quality gate.
3. If the data files changed, Actions commits them back to `main`.
4. Vite builds the SPA and deploys `dist/` to GitHub Pages.

Manual refresh: GitHub → **Actions** → **Refresh and deploy** → **Run workflow**.

GitHub pauses cron on repos with 60 days of no pushes. The hourly data commit
usually keeps the schedule alive. If the header shows a stale “updated … ago”,
run the workflow by hand.

## Adding a feed

1. Probe first: HTTP 200, real RSS/Atom, newest item younger than 60 days.
2. Read the skipped-URL comment at the top of `scripts/sources.ts` so you do
   not re-add a dead host.
3. Add to `SOURCES`:
   ```ts
   { name: "My Source", url: "https://example.com/feed/", category: "church", priority: "medium" },
   ```
4. `npm run validate:feeds`
5. Keyword routing rules (same file) can place an article in extra sections.

## Optional daily brief

Set repo secret `ANTHROPIC_API_KEY` (Settings → Secrets and variables →
Actions). The hourly job then asks Claude for a 4–6 bullet brief grounded
**only** in fetched headlines. No key → curated fallback from trending and
category leads. The key never ships in the browser bundle.

## Editorial notes

- Hard news (persecution, scandal, disaster) is allowed when it is real.
- Inspiration and discipleship are first-class sections, not an afterthought.
- Catholic-institution feeds stay on the homepage but are scored lower so they
  do not own the lead story. See `scripts/lib/score.ts`.
- Generated copy must not invent verses, statistics, or quotes.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/README.md](./docs/README.md) | Doc index |
| [docs/DESIGN.md](./docs/DESIGN.md) | Architecture, scoring, data contracts |
| [docs/HANDOFF.md](./docs/HANDOFF.md) | Operations and troubleshooting |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | GitHub repo, Pages, cron, secrets |
| [CONSTRAINTS.md](./CONSTRAINTS.md) | Hard rules for later agent sessions |
