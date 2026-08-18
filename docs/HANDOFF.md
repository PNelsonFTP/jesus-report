# The Jesus Report — Handoff

Operations guide. Last updated: 2026-08-18.

## Quick reference

| Item | Value |
|------|-------|
| Public name | The Jesus Report |
| Live | https://pnelsonftp.github.io/jesus-report/ |
| Site feed | https://pnelsonftp.github.io/jesus-report/feed.xml |
| Repository | https://github.com/PNelsonFTP/jesus-report |
| Default branch | `main` |
| Local path | `/Users/paulnelson/Documents/Development/jesus-report` |
| Hourly workflow | `.github/workflows/refresh.yml` (`5 * * * *` UTC) |
| Weekly feed audit | `.github/workflows/feed-audit.yml` (Mondays 12:00 UTC) |
| Node (CI) | 22 |
| Optional secret | `ANTHROPIC_API_KEY` — Claude brief; fallback without it |

Pages source must be **GitHub Actions**, not “Deploy from a branch”.
Details: [DEPLOY.md](./DEPLOY.md).

## Local development

```bash
cd jesus-report
npm ci
npm run build:data
npm run dev
# → http://localhost:5173/jesus-report/
```

## Common tasks

### Add a feed

1. Confirm HTTP 200 + real RSS/Atom + newest item < 60 days.
2. Check the skipped list in `scripts/sources.ts`.
3. Append to `SOURCES` with a home `category` and `priority`.
4. `npm run validate:feeds && npm run build:data && npm run build:check`
5. Commit and push — the hourly workflow also picks it up.

### Fix a broken feed

`npm run validate:feeds` verdicts: `OK`, `STALE`, `EMPTY`, `NOT_FEED`,
`HTTP_xxx`, `TIMEOUT`, `PARSE_FAIL`. The **REDIRECTED** section lists
moved hosts — update `sources.ts` to the final URL.

The Monday audit workflow opens or updates a `Feed audit:` issue.

### Change homepage section order

Reorder `CATEGORIES` in `scripts/sources.ts`. Columns fill top-to-bottom,
left-to-right (`index % 3`).

### Catholic ranking

Catholic-institution sources are kept but medium/low plus a score dampen
in `scripts/lib/score.ts`. Do not delete those feeds to “fix” mix; retune
`CATHOLIC_SOURCE_PENALTY` or their `priority` instead.

## Troubleshooting

| Symptom | Action |
|---------|--------|
| Header “updated Xh ago” in red | Actions run failed or cron paused. Run **Refresh and deploy** by hand. |
| One section empty | Footer Feed Health panel; then `feedStats` in `headlines.json`. |
| One source floods a column | Already capped (6 site-wide, 2–5 per section). Check `enforceDiversity`. |
| Brief is just headlines | No `ANTHROPIC_API_KEY`, or the Claude call failed. Fallback is expected. |
| Local `tsc -b` / typecheck fails | `scripts/types.ts` and `src/lib/types.ts` must stay in sync. |

### Git conflicts with the hourly data commit

```bash
git checkout --theirs public/data/ public/feed.xml
git add public/data public/feed.xml
```

Pull before starting work; push promptly. For a large refactor, disable
the workflow in the GitHub UI until you merge.

## Rollback

1. Find the last good commit on `main`.
2. `git revert <bad-commit>` (coordinate with cron; disable the workflow
   if needed).
3. Push — Actions redeploys.
4. Data-only problems: reverting `public/data/` is enough.

## Weekly checklist

- [ ] Monday feed-audit green, or `sources.ts` updated from the issue
- [ ] Footer feed health: most of 46 OK
- [ ] Lead story + Daily Brief still relevant
- [ ] `headlines.json` not ballooning

## File map

| Area | Files |
|------|-------|
| Feeds, categories, keywords | `scripts/sources.ts` |
| Fetch / unwrap | `scripts/fetch-feeds.ts`, `scripts/lib/unwrapUrl.ts` |
| Score / route / group | `scripts/lib/score.ts`, `router.ts`, `groupStories.ts` |
| Site feed | `scripts/lib/emitFeed.ts` |
| Church year | `scripts/lib/churchYear.ts` |
| Homepage | `src/App.tsx` |
| Client persistence | `src/hooks/*` |
| CI | `.github/workflows/refresh.yml`, `feed-audit.yml` |
