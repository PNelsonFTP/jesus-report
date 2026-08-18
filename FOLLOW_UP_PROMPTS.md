# Follow-up prompts (use after the initial build)

Use these in the **Jesus Report** conversation, not in AI Drudge.

---

## 1. Source expansion (after v1 is on screen)

```
Upgrade The Jesus Report sources from a quality-first pass.
Do not pad. Probe every URL (HTTP 200 + real RSS/Atom + newest item < 60 days).
Dedup by hostname + path. Prefer first-party ministry / journal / church
feeds over aggregators.

Focus the thin sections first: missions, scripture, world/persecution,
inspiration. Skip generic political wires and undated sermon dumps.

After edits, leave a comment block of ADDED / SKIPPED and print
SOURCES.length.
```

---

## 2. Deploy to GitHub Pages

```
Create the GitHub repo for this folder (jesus-report), push main, enable
GitHub Pages from Actions, and add ANTHROPIC_API_KEY as an optional Actions
secret if I have one. Confirm the live URL.
Do not change the AI Drudge repo.
```

---

## 3. Lectionary / Church year (optional)

```
Add a small build-time “today in the Church year” line under the masthead
(Western liturgical calendar is fine for v1). No client-side third-party
APIs. Keep it one line. Do not redesign the layout.
```

---

## 4. Visual polish (ask before any layout redesign)

```
Keep the three-column wire layout. Polish typography and the masthead for
The Jesus Report (paper/ink, crimson or gold accent). Do not change
information architecture unless I approve.
```
