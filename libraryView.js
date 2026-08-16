/**
 * libraryView.js
 * --------------
 * Renders the home-screen library grid: one card per saved document, with
 * a badge, a word count, and dots showing which format tabs have already
 * been generated for it.
 */

function formatDots(doc){
  const keys = ['tldr','keyPoints','abstract','breakdown'];
  return keys.map(k => `<span class="fmt-dot ${doc.formats[k] ? 'done' : ''}"></span>`).join('');
}

function renderLibrary(){
  const dom = App.dom;
  dom.libGrid.innerHTML = '';
  dom.emptyNote.style.display = App.state.docs.length ? 'none' : 'block';

  App.state.docs.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'lib-card';
    const badge = doc.docType === 'reference'
      ? '<span class="badge ref">Reference</span>'
      : (doc.isAcademic ? '<span class="badge">Paper</span>' : '');
    card.innerHTML = `
      ${badge}
      <h3>${escapeHtml(doc.title)}</h3>
      <span class="meta">${doc.wordCount.toLocaleString()} words</span>
      <div class="fmt-dots">${formatDots(doc)}</div>
      <div class="actions">
        <button class="btn-small btn-open">Open</button>
        <button class="btn-small btn-del">Delete</button>
      </div>
    `;
    card.querySelector('.btn-open').addEventListener('click', () => openDocument(doc));
    card.querySelector('.btn-del').addEventListener('click', async () => {
      App.state.docs = App.state.docs.filter(d => d.id !== doc.id);
      await saveDocs();
      renderLibrary();
    });
    dom.libGrid.appendChild(card);
  });
}
