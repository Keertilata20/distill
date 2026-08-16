/**
 * main.js
 * -------
 * The entry point. Loaded last (see index.html) so every function from the
 * other modules already exists by the time this runs. Its only jobs are:
 * grab every DOM element once into App.dom, wire up the two view modules,
 * and kick off loading the saved library.
 */

function collectDom(){
  const d = App.dom;
  const byId = (id) => document.getElementById(id);

  // Home view
  d.homeView = byId('homeView');
  d.dropzone = byId('dropzone');
  d.fileInput = byId('fileInput');
  d.pasteInput = byId('pasteInput');
  d.titleInput = byId('titleInput');
  d.startBtn = byId('startBtn');
  d.uploadStatus = byId('uploadStatus');
  d.libGrid = byId('libGrid');
  d.emptyNote = byId('emptyNote');

  // Document view
  d.docView = byId('docView');
  d.backBtn = byId('backBtn');
  d.docTitle = byId('docTitle');
  d.docMeta = byId('docMeta');
  d.docDetect = byId('docDetect');
  d.docCaution = byId('docCaution');
  d.tabBar = byId('tabBar');
  d.abstractTabBtn = byId('abstractTabBtn');
  d.breakdownTabBtn = byId('breakdownTabBtn');
  d.contentLabel = byId('contentLabel');
  d.contentBody = byId('contentBody');
  d.copyBtn = byId('copyBtn');
  d.originalToggleBtn = byId('originalToggleBtn');
  d.originalBox = byId('originalBox');
  d.fmBlock = byId('fmBlock');
  d.fmTitleText = byId('fmTitleText');
  d.fmAuthorsText = byId('fmAuthorsText');
  d.originalText = byId('originalText');
}

function init(){
  collectDom();

  if(window.pdfjsLib){
    pdfjsLib.GlobalWorkerOptions.workerSrc = App.config.PDF_WORKER_SRC;
  }

  initDocumentView();
  initUploadView();
  loadDocs();
}

document.addEventListener('DOMContentLoaded', init);
