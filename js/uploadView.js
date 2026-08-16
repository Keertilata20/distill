/**
 * uploadView.js
 * -------------
 * The upload panel on the home screen: drag-and-drop, file browsing,
 * paste-in text, and the "Distill it" button that kicks off document
 * creation.
 */

function setStatus(msg, kind){
  const dom = App.dom;
  dom.uploadStatus.textContent = msg || '';
  dom.uploadStatus.className = 'upload-status' + (kind ? ' ' + kind : '');
}

async function handleFile(file){
  if(!file) return;
  setStatus('Reading ' + file.name + '…');
  try{
    const text = await extractTextFromFile(file);
    if(!text || text.trim().length < 20){
      setStatus("Couldn't find readable text in that file — try pasting instead.", 'err');
      return;
    }
    App.dom.pasteInput.value = text.trim();
    if(!App.dom.titleInput.value.trim()) App.dom.titleInput.value = file.name.replace(/\.[^.]+$/, '');
    setStatus('Loaded ' + file.name + ' — review below, then distill it.', 'ok');
  }catch(e){
    console.error(e);
    setStatus("Couldn't read that file — try pasting the text instead.", 'err');
  }
}

function initUploadView(){
  const dom = App.dom;

  dom.dropzone.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  ['dragenter','dragover'].forEach(evt => dom.dropzone.addEventListener(evt, (e) => {
    e.preventDefault(); dom.dropzone.classList.add('drag');
  }));
  ['dragleave','drop'].forEach(evt => dom.dropzone.addEventListener(evt, (e) => {
    e.preventDefault(); dom.dropzone.classList.remove('drag');
  }));
  dom.dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if(file) handleFile(file);
  });

  dom.startBtn.addEventListener('click', async () => {
    const text = dom.pasteInput.value.trim();
    if(!text){ setStatus('Paste some text or drop a file first.', 'err'); return; }
    dom.startBtn.disabled = true;
    setStatus('Preparing your document…');
    const doc = await createDocument(text, dom.titleInput.value);
    dom.startBtn.disabled = false;
    if(!doc){ setStatus("Couldn't parse that text — try a longer passage.", 'err'); return; }
    dom.pasteInput.value = ''; dom.titleInput.value = ''; setStatus('');
    openDocument(doc);
  });
}
