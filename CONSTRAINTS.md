# The Jesus Report — architecture constraints

Copy these into the implementing conversation if the agent starts to drift.

## Hard rules

1. **Name:** The public name is **The Jesus Report**. Never use “Drudge,”
   “AI Drudge,” or “cyber-drudge” in the product title, repo name, UI copy,
   CSS class names, localStorage keys, or comments.
2. **Separate codebase.** This repo is standalone. Do not add files to
   `ai-drudge`. Do not make this a monorepo package of that project.
3. **Static site.** All third-party RSS/HTML/API fetching happens at
   **build time** (local script or GitHub Actions), never in the browser
   and never in a request-time server route.
4. **No blank refresh.** If a data build fetches zero articles, keep the
   previous `headlines.json` and exit 0 so the last good homepage still
   deploys.
5. **GitHub Pages project site** unless a custom domain is chosen later.
   Default `base` path: `/jesus-report/`.
6. **No user accounts.** Personalization (theme, bookmarks, mutes) is
   localStorage only.
7. **No secrets in the client.** Optional `ANTHROPIC_API_KEY` is an Actions
   secret used only at build time for a daily brief.
8. **Quality over volume.** Do not pad the homepage with stale, generic, or
   rage-bait wires. Prefer first-party ministry, church, Bible, and
   constructive news feeds. Probe every new feed URL (HTTP 200 + real
   RSS/Atom) before adding it.

## Editorial posture

- Center: Christianity, Scripture, church life, missions, and
  Christian-friendly / hopeful news.
- Do **not** ban hard news (persecution, scandal, disaster). Those items
  may appear when they are genuinely relevant.
- Do **not** turn the homepage into a culture-war firehose. Inspiration
  and discipleship should be first-class sections, not an afterthought.
- Neutral factual tone in generated briefs. No hype words. No invented
  verses, statistics, or quotes.

## Stack (match the proven pattern, new names)

Vite + React + TypeScript + Tailwind v4. Build scripts with `tsx`.
`fast-xml-parser` for RSS/Atom/RDF. Hourly GitHub Actions refresh.
Weekly feed audit. Site Atom feed at `/feed.xml`.
