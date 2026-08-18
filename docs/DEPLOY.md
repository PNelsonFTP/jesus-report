# Deploy — GitHub Pages + hourly refresh

The Jesus Report is a **GitHub Pages project site**. There is no Vercel,
Netlify, or always-on server. GitHub Actions fetches feeds, builds the
static SPA, and publishes `dist/`.

## URLs

| What | URL |
|------|-----|
| Homepage | https://pnelsonftp.github.io/jesus-report/ |
| Site Atom feed | https://pnelsonftp.github.io/jesus-report/feed.xml |
| Repository | https://github.com/PNelsonFTP/jesus-report |

Vite `base` is `/jesus-report/`. If you rename the repo, change
`vite.config.ts` and `scripts/lib/emitFeed.ts` (`SITE_URL`) to match.

## First-time setup (already done for this repo)

1. Public GitHub repo `PNelsonFTP/jesus-report` on branch `main`.
2. **Settings → Pages → Source: GitHub Actions** (`build_type: workflow`).
3. Workflows:
   - `refresh.yml` — hourly at minute 5, plus push to `main`, plus manual.
   - `feed-audit.yml` — Mondays 12:00 UTC, plus manual. Does not block hourly.
4. Optional: **Settings → Secrets → Actions → `ANTHROPIC_API_KEY`**.

Pages for a public repo is free. A private repo needs a paid GitHub plan
for Pages.

## What the hourly job does

`.github/workflows/refresh.yml`:

```
checkout → npm ci → typecheck → build:data → build:check
  → commit public/data + feed.xml if changed
  → vite build → upload Pages artifact → deploy-pages
```

Permissions on that workflow: `contents: write` (data commit),
`pages: write` + `id-token: write` (OIDC deploy).

Concurrency group `refresh-deploy` cancels an in-flight run if a new one
starts, so a push does not pile up on the cron.

## Verify a deploy

1. **Actions** tab: latest **Refresh and deploy** is green.
2. Live header: “updated Xm ago”.
3. Footer: “N/M feeds OK” — click it for the Feed Health panel.

## Manual refresh

GitHub → Actions → **Refresh and deploy** → **Run workflow**.

Use this after adding feeds, or if cron looks dead.

## Cron gotchas

- GitHub can disable scheduled workflows after **60 days with no repo
  activity**. The hourly data commit normally counts as activity.
- Cron is UTC. `5 * * * *` is :05 past every hour.
- Actions-hosted IPs get 403/429 from some publishers. That is expected for
  a subset of feeds; the rest of the homepage still ships.

## Secrets

| Secret | Required? | Used where |
|--------|-----------|------------|
| `ANTHROPIC_API_KEY` | No | `build:data` only, Claude daily brief |
| Feed API keys | No | All sources are public RSS |

Never put the Anthropic key in client code, `vite.config.ts`, or committed
JSON.

## Changing hosting later

A custom domain is out of scope for v1. If you add one later:

1. Pages → Custom domain
2. Update `SITE_URL` in `scripts/lib/emitFeed.ts`
3. Keep or drop the `/jesus-report/` base path (custom domain usually
   wants `base: "/"`)

Do not fetch RSS from the browser or from a request-time API route.
