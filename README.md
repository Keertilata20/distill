# Distill

A calm, focused document summary tool: bring a document, get it back as a
TL;DR, key points, an abstract/summary, and a breakdown — no reading
metaphors, no gamification, just the document distilled a few different ways.

## Running it locally

You need the Vercel CLI for local testing, since `/api/distill.js` is a
serverless function — it doesn't run just by opening `index.html` in a
browser.

```
npm install -g vercel
cp .env.example .env        # then edit .env and add your real ANTHROPIC_API_KEY
vercel dev
```

This serves the site with the API function live, usually at `http://localhost:3000`.

## Structure

```
distill/
├── index.html            markup only — no logic
├── package.json          minimal — no dependencies, just repo metadata
├── .gitignore             keeps .env and node_modules out of git
├── .env.example           template for the local API key file (no real key)
├── api/
│   └── distill.js         serverless function — the ONLY thing holding your real API key
├── css/
│   └── styles.css        every style, unchanged from the original build
└── js/
    ├── app.js             shared namespace: App.config, App.state, App.dom
    ├── textAnalysis.js     document classification, front-matter/heading
    │                        detection, paragraph chunking (pure functions)
    ├── fileExtract.js      pulls text out of PDF / DOCX / plain text files
    ├── claudeApi.js         calls our own /api/distill endpoint per format tab
    ├── storage.js           persistence (window.storage, with a fallback)
    ├── documents.js         turns raw text into a structured document object
    ├── libraryView.js       renders the home-screen document grid
    ├── documentView.js      renders the tabs / formats / original-text panel
    ├── uploadView.js        dropzone, file input, and paste-box wiring
    └── main.js               entry point — collects DOM refs, boots everything
```

## Why this structure

**One shared namespace instead of ES modules.** `<script type="module">`
requires the page to be served over http(s) — opening it via `file://`
fails in most browsers due to CORS restrictions on module loading. Using
classic scripts plus one `window.App` object (holding `config`, `state`,
and `dom`) keeps the project double-click-able while still avoiding global
variable collisions between files.

**Load order is the dependency graph.** Classic scripts execute top to
bottom and share one global scope, so `index.html` loads `app.js` first
(nothing else works without `App` existing) and `main.js` last (it's the
only file that automatically *does* anything — every other file just
defines functions and waits to be called). If you add a new module, slot
its `<script>` tag in wherever its dependencies are already loaded.

**Each file owns one concern:**
- `textAnalysis.js` and `fileExtract.js` are pure-ish utilities with no
  knowledge of the DOM — you could lift either into a different project
  unchanged.
- `documents.js` is the only place a document object gets constructed.
- `libraryView.js` and `documentView.js` each own one screen.
- `main.js` is intentionally thin — it wires things together and does
  nothing else, so it's the one file you'd read first to understand how
  the pieces connect.

## Known limitations

- PDF text extraction is reordered by glyph position (not file order) to
  reduce garbling around equations and multi-column layouts, but very
  dense math/chemical notation can still come out imperfect — the app
  flags this with a caution banner when it detects heavy notation.
- Front-matter (title/author) detection is heuristic, not guaranteed —
  unusual formatting may not separate cleanly.
- The document library is stored per-user via `window.storage`, which is
  specific to Claude.ai's artifact environment. Deployed standalone (as
  described above), that API won't exist, so the app automatically falls
  back to in-memory storage — your library persists for the browser tab's
  session but won't survive a page reload. If you want real persistence
  after deploying, swap `js/storage.js` for calls to a database (e.g.
  Vercel KV, Supabase, or similar) — everything else is already decoupled
  from *how* documents are stored.
- `/api/distill.js` has no authentication in front of it — see the
  "before you share the link" note above.
