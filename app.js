/**
 * app.js
 * ------
 * The shared namespace every other module hangs off of. This file must load
 * FIRST (see index.html script order) so that App.config, App.state, and
 * App.dom exist before any other module references them.
 *
 * Why a namespace object instead of ES modules (import/export)?
 * ES modules require the page to be served over http(s) — opening an
 * index.html with <script type="module"> directly via file:// fails in
 * most browsers due to CORS restrictions on module loading. Using plain
 * classic <script> tags plus one shared `App` object keeps this project
 * double-click-able: unzip it, open index.html, it just works.
 */
window.App = {
  config: {
    WPM: 200,                          // words-per-minute, for read-time estimates
    STORAGE_KEY: 'distill-documents',
    PDF_WORKER_SRC: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  },
  state: {
    docs: [],            // the document library
    memoryFallback: [],  // used if window.storage isn't available
    storageWorks: true,
    current: null,       // the currently open document
    activeKey: 'tldr'     // which format tab is active
  },
  dom: {}                // populated by main.js once the DOM is ready
};
