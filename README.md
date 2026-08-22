# Distill

Distill is a focused document summarizer. It accepts pasted text and common
document files, prepares the content in the browser, and uses Claude through a
server-side API route to produce several useful views of the same document.

## What works today

- Import `.txt`, `.md`, `.pdf`, and `.docx` files with click-to-browse or drag-and-drop.
- Paste an article, paper, report, reference sheet, or other text directly.
- Set an optional document title; otherwise Distill derives one from the content.
- Extract text from PDFs with PDF.js and DOCX files with Mammoth.
- Detect whether content is more likely to be narrative or reference material.
- Detect likely academic papers and common front matter such as title and authors.
- Split content into paragraphs/chunks and recognize likely section headings.
- Generate four on-demand Claude views:
  - **TL;DR** — a short 2–3 sentence gist.
  - **Key Points** — 4–6 important points.
  - **Summary / Abstract** — a general summary, or an academic-style abstract for detected papers.
  - **Breakdown / By Section / Key Facts** — section summaries for narrative documents, or organized facts/formulas for reference material.
- Cache generated views inside each saved document, so revisiting a generated tab does not call the API again.
- Browse saved documents from a library with word counts and completion indicators.
- Open, delete, and return to saved documents.
- Copy the active generated view to the clipboard.
- Show the extracted original text for verification.
- Warn when dense mathematical or chemical notation may have been reordered during PDF extraction.

## Current end-to-end flow

1. A user pastes text or selects a supported file.
2. The browser extracts the file into plain text.
3. Distill classifies the text, detects useful structure, and creates a document record.
4. The document is added to the library immediately.
5. A format tab calls `/api/distill` only when that format is opened for the first time.
6. The serverless function sends the prompt to Anthropic using the private
   `ANTHROPIC_API_KEY` environment variable.
7. The generated result is displayed and saved with the document.

## Running locally

The frontend can be opened as static HTML for inspecting the interface, but AI
generation requires the `/api/distill` serverless function. Use Vercel's local
development server:

```bash
npm install -g vercel
cp .env.example .env
# Edit .env and add your real ANTHROPIC_API_KEY
vercel dev
```

Open the local URL shown by Vercel, normally `http://localhost:3000`.

The project has no npm runtime dependencies. The browser loads PDF.js,
Mammoth, and the fonts from CDNs, so local development requires network access
for those assets as well as for the Anthropic request.

## Environment variables

Create `.env` locally from `.env.example`:

```env
ANTHROPIC_API_KEY=your_key_here
```

Never put the real key in frontend JavaScript or commit `.env`. The key is read
only by `api/distill.js` on the server.

## Deploying

The project is structured for Vercel:

- `index.html`, `css/`, and `js/` are the static frontend.
- `api/distill.js` is deployed as the `/api/distill` serverless endpoint.
- Add `ANTHROPIC_API_KEY` in the Vercel project environment variables.
- Redeploy after adding or changing the environment variable.

For the detailed first-time GitHub/Vercel checklist, see
[`DEPLOY.md`](DEPLOY.md).

## Project structure

```text
distill/
├── index.html          Frontend markup and CDN script references
├── css/styles.css      Application styling
├── js/
│   ├── app.js          Shared App configuration, state, and DOM namespace
│   ├── textAnalysis.js Classification, front matter, headings, and chunking
│   ├── fileExtract.js  PDF, DOCX, and plain-text extraction
│   ├── claudeApi.js    Prompts, API calls, and result caching
│   ├── storage.js      Library persistence with a fallback
│   ├── documents.js    Structured document creation
│   ├── libraryView.js  Saved-document grid
│   ├── documentView.js Format tabs, original text, and copy behavior
│   ├── uploadView.js   Upload, drag-and-drop, paste, and start actions
│   └── main.js         DOM collection and application bootstrap
├── api/distill.js      Server-side Anthropic proxy
├── package.json        Project metadata and Node version requirement
└── DEPLOY.md           Deployment instructions
```

The frontend intentionally uses classic scripts and a shared `window.App`
namespace instead of ES modules. This keeps the dependency order explicit and
allows the interface to be opened directly as static HTML, although the API
features still need a server that exposes `/api/distill`.

## Important limitations

- The browser sends only the first several thousand characters of a document to
  the summarizer. Very long documents are therefore summarized from a capped
  excerpt rather than the complete file.
- The API route caps prompts at 20,000 characters and generated responses at
  1,500 tokens. These are cost and safety limits, not a full long-document
  processing pipeline.
- PDF extraction rebuilds lines from glyph positions, which helps with columns
  and equations but cannot guarantee perfect reading order. Verify formulas,
  tables, figures, and quotes against the original.
- Classification, academic detection, heading detection, and front-matter
  extraction are heuristics and can be wrong for unusual documents.
- There is no authentication, rate limiting, or per-user quota on
  `/api/distill`. Do not share a public deployment without adding protection.
- In Claude's artifact environment, `window.storage` can persist the library.
  In a normal standalone deployment, the fallback is in memory, so documents
  disappear after a page reload. A database-backed storage layer is still
  needed for durable multi-user persistence.
- The app currently supports text extraction only; images, scanned PDFs, OCR,
  tables as structured data, annotations, and export files are not implemented.
- Generated summaries are not a substitute for checking the source when exact
  figures, formulas, quotations, or exam-safe details matter.

## Why the code is split this way

Each file owns one concern: text analysis and extraction are independent of the
DOM, `documents.js` constructs the document model, the view files render each
screen, and `main.js` only wires the application together. This makes the
current prototype easy to extend with persistent storage, authentication,
OCR, exports, or a more complete long-document pipeline.
