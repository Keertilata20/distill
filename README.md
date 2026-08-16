# Distill

A calm, focused document summary tool: bring a document, get it back as a
TL;DR, key points, an abstract/summary, and a breakdown — no reading
metaphors, no gamification, just the document distilled a few different ways.

## Running it

Open `index.html` directly — no build step, no server, no `npm install`.
Every script is a plain classic `<script src="...">` tag (not an ES module),
specifically so the whole thing works by double-clicking the file.

**Except:** summary generation calls `api.anthropic.com` directly from the
browser with no API key attached. That only succeeds when this page is
rendered inside Claude.ai's artifact environment, which proxies the request.
Opened anywhere else, every "Distill it" call will fail — uploading and
browsing the library still work fine, but the four format tabs won't
generate content. If you want this to work standalone, you'd need to add
your own backend (or a serverless function) that holds an API key and
proxies the request on the app's behalf.

## Structure

```
distill/
├── index.html            markup only — no logic
├── css/
│   └── styles.css        every style, unchanged from the original build
└── js/
    ├── app.js             shared namespace: App.config, App.state, App.dom
    ├── textAnalysis.js     document classification, front-matter/heading
    │                        detection, paragraph chunking (pure functions)
    ├── fileExtract.js      pulls text out of PDF / DOCX / plain text files
    ├── claudeApi.js         the API call + prompt construction per format tab
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
- The document library is stored per-user via `window.storage`; if that
  API isn't available in your environment, documents persist only for the
  current session.
