/**
 * documents.js
 * ------------
 * The data layer: takes raw text and turns it into a structured document
 * object (classified, chunked, front-matter separated), then saves it to
 * the library. This is the one place a "document" gets constructed.
 */

async function createDocument(text, titleOverride){
  const docType = classifyDocument(text);
  let frontMatter = null;
  let bodyText = text;
  if(docType === 'narrative'){
    const fm = extractFrontMatter(text);
    frontMatter = fm.frontMatter;
    bodyText = fm.body;
  }

  const paragraphs = splitParagraphs(bodyText);
  if(paragraphs.length === 0) return null;

  const built = docType === 'narrative'
    ? buildNarrativeChunks(paragraphs)
    : { chunks: chunkParagraphsSimple(paragraphs), hasHeadings:false };

  const chunks = built.chunks;
  const wordCount = chunks.reduce((sum,c) => sum + c.join(' ').split(/\s+/).filter(Boolean).length, 0);
  const isAcademic = docType === 'narrative' && detectAcademic(paragraphs, frontMatter);
  const notationHeavy = docType === 'reference' || detectNotationHeavy(text);

  const doc = {
    id: 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
    title: (titleOverride && titleOverride.trim()) || (frontMatter && frontMatter.title) || deriveTitle(bodyText),
    createdAt: Date.now(),
    docType, isAcademic, hasSections: built.hasHeadings, notationHeavy,
    frontMatter, chunks, wordCount,
    formats: { tldr: null, keyPoints: null, abstract: null, breakdown: null }
  };

  App.state.docs.unshift(doc);
  await saveDocs();
  return doc;
}
