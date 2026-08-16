/**
 * documentView.js
 * ---------------
 * The document detail screen: the four format tabs (TL;DR, Key Points,
 * Abstract/Summary, Breakdown), the loading state, the copy button, and
 * the collapsible original-text panel.
 */

function tabLabel(doc, key){
  if(key === 'abstract') return doc.isAcademic ? 'Abstract' : 'Summary';
  if(key === 'breakdown'){
    if(doc.docType === 'reference') return 'Key Facts';
    return doc.hasSections ? 'By Section' : 'Breakdown';
  }
  if(key === 'tldr') return 'TL;DR';
  if(key === 'keyPoints') return 'Key Points';
  return key;
}

function detectionCaption(doc){
  if(doc.docType === 'reference') return 'This looks like reference material — showing it as organized facts rather than a narrative summary.';
  if(doc.isAcademic) return 'This looks like a research paper — showing a proper abstract.';
  return '';
}

function loaderHtml(label){
  return `<div class="loader-row">
    <svg class="drop-loader loading" width="22" height="28" viewBox="0 0 40 52">
      <defs><clipPath id="dropClip"><path d="M20 2 C20 2 4 24 4 34 C4 43.9 11.2 50 20 50 C28.8 50 36 43.9 36 34 C36 24 20 2 20 2 Z"/></clipPath></defs>
      <path d="M20 2 C20 2 4 24 4 34 C4 43.9 11.2 50 20 50 C28.8 50 36 43.9 36 34 C36 24 20 2 20 2 Z" fill="none" stroke="var(--accent)" stroke-width="2"/>
      <rect class="drop-fill" x="2" y="52" width="36" height="0" clip-path="url(#dropClip)" fill="var(--accent)"/>
    </svg>
    <span>${escapeHtml(label)}</span>
  </div>`;
}

function renderFormatContent(doc, key, result){
  const dom = App.dom;
  if(key === 'tldr'){
    dom.contentBody.innerHTML = `<p class="tldr-text">${escapeHtml(result)}</p>`;
  } else if(key === 'keyPoints'){
    dom.contentBody.innerHTML = `<ul class="kp-list">${result.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`;
  } else if(key === 'abstract'){
    dom.contentBody.innerHTML = `<p class="abstract-text">${escapeHtml(result)}</p>`;
  } else if(key === 'breakdown'){
    dom.contentBody.innerHTML = `<div class="bd-grid">${result.map(e => `<div class="bd-card"><h4>${escapeHtml(e.title)}</h4><p>${escapeHtml(e.content)}</p></div>`).join('')}</div>`;
  }
}

async function showFormat(key){
  const dom = App.dom;
  App.state.activeKey = key;
  dom.tabBar.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.key === key));
  dom.contentLabel.textContent = tabLabel(App.state.current, key);
  dom.copyBtn.textContent = 'Copy';
  dom.copyBtn.classList.remove('copied');

  const cached = App.state.current.formats[key];
  if(cached){ renderFormatContent(App.state.current, key, cached); return; }

  dom.contentBody.innerHTML = loaderHtml('Distilling…');
  const result = await generateFormat(App.state.current, key);
  if(App.state.current && App.state.activeKey === key) renderFormatContent(App.state.current, key, result);
}

function openDocument(doc){
  const dom = App.dom;
  App.state.current = doc;
  dom.docTitle.textContent = doc.title;
  const estMin = Math.max(1, Math.round(doc.wordCount / App.config.WPM));
  dom.docMeta.textContent = `${doc.wordCount.toLocaleString()} words · ~${estMin} min read`;

  const caption = detectionCaption(doc);
  if(caption){ dom.docDetect.textContent = caption; dom.docDetect.style.display = 'block'; }
  else { dom.docDetect.style.display = 'none'; }
  dom.docCaution.style.display = doc.notationHeavy ? 'block' : 'none';

  dom.abstractTabBtn.textContent = tabLabel(doc, 'abstract');
  dom.breakdownTabBtn.textContent = tabLabel(doc, 'breakdown');

  if(doc.frontMatter){
    dom.fmBlock.style.display = 'block';
    dom.fmTitleText.textContent = doc.frontMatter.title || '';
    dom.fmAuthorsText.textContent = doc.frontMatter.authorLine || '';
  } else {
    dom.fmBlock.style.display = 'none';
  }
  dom.originalText.innerHTML = doc.chunks.flat().map(p => `<p>${escapeHtml(p)}</p>`).join('');
  dom.originalBox.style.display = 'none';
  dom.originalToggleBtn.textContent = 'Show original text';

  dom.homeView.classList.remove('active');
  dom.docView.classList.add('active');
  window.scrollTo({ top:0, behavior:'instant' });

  showFormat('tldr');
}

function closeDocument(){
  const dom = App.dom;
  dom.docView.classList.remove('active');
  dom.homeView.classList.add('active');
  App.state.current = null;
  renderLibrary();
}

function initDocumentView(){
  const dom = App.dom;

  dom.copyBtn.addEventListener('click', async () => {
    if(!App.state.current) return;
    const val = App.state.current.formats[App.state.activeKey];
    if(!val) return;
    let text;
    if(Array.isArray(val)){
      text = App.state.activeKey === 'breakdown'
        ? val.map(e => `${e.title}: ${e.content}`).join('\n')
        : val.map(p => '- ' + p).join('\n');
    } else {
      text = val;
    }
    try{
      await navigator.clipboard.writeText(text);
      dom.copyBtn.textContent = 'Copied!';
      dom.copyBtn.classList.add('copied');
      setTimeout(() => { dom.copyBtn.textContent = 'Copy'; dom.copyBtn.classList.remove('copied'); }, 1500);
    }catch(e){
      dom.copyBtn.textContent = "Couldn't copy";
    }
  });

  dom.tabBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if(!btn) return;
    showFormat(btn.dataset.key);
  });

  dom.originalToggleBtn.addEventListener('click', () => {
    const showing = dom.originalBox.style.display !== 'none';
    dom.originalBox.style.display = showing ? 'none' : 'block';
    dom.originalToggleBtn.textContent = showing ? 'Show original text' : 'Hide original text';
  });

  dom.backBtn.addEventListener('click', closeDocument);
}
