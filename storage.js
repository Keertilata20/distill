/**
 * storage.js
 * ----------
 * Persists the document library via window.storage (available when this
 * page runs inside a Claude.ai artifact). If that API isn't present —
 * e.g. running standalone outside Claude.ai — falls back to an in-memory
 * array so the app still works within a single session.
 */

async function loadDocs(){
  try{
    const res = await window.storage.get(App.config.STORAGE_KEY, false);
    App.state.docs = res && res.value ? JSON.parse(res.value) : [];
  }catch(e){
    App.state.storageWorks = false;
    App.state.docs = App.state.memoryFallback;
  }
  renderLibrary();
}

async function saveDocs(){
  if(App.state.storageWorks){
    try{
      await window.storage.set(App.config.STORAGE_KEY, JSON.stringify(App.state.docs), false);
      return;
    }catch(e){
      App.state.storageWorks = false;
    }
  }
  App.state.memoryFallback = App.state.docs;
}
