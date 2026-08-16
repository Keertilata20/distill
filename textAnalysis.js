/**
 * textAnalysis.js
 * ---------------
 * Pure text-processing functions: deciding whether a document is narrative
 * or reference material, pulling out title/author lines, detecting section
 * headings, and grouping paragraphs into chunks. Nothing here touches the
 * DOM or the network, so it's easy to test or reuse on its own.
 */

function classifyDocument(text){
  const sample = text.slice(0, 4000);
  const words = sample.split(/\s+/).filter(Boolean);
  const totalWords = words.length || 1;
  const lines = sample.split(/\n/).filter(l => l.trim().length > 0);

  const stopwords = ['the','is','and','of','to','a','in','that','it','was','for','on','are','as','with','his','they','be','at','one','have','this','from','or','had','by','not','but','what','some','we','can','out','other','were','all','there','when','up','use','your','how','an','each','which','do','their','if'];
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g,''));
  const stopwordRatio = lowerWords.filter(w => stopwords.includes(w)).length / totalWords;

  const symbolChars = (sample.match(/[=+×÷∫∑√^_{}\\$<>≤≥≈π∞∂∇%]/g) || []).length;
  const symbolDensity = symbolChars / sample.length;

  const codeIndicators = (sample.match(/\b(function|const|let|var|def|class|import|return)\b|=>|;\s*\n/g) || []).length;
  const codeDensity = codeIndicators / totalWords;

  const shortLineRatio = lines.filter(l => l.trim().split(/\s+/).length <= 6).length / (lines.length || 1);
  const avgWordsPerLine = totalWords / (lines.length || 1);

  let score = 0;
  if(stopwordRatio < 0.12) score += 2;
  if(symbolDensity > 0.02) score += 2;
  if(codeDensity > 0.03) score += 2;
  if(shortLineRatio > 0.5) score += 1;
  if(avgWordsPerLine < 6) score += 1;

  return score >= 3 ? 'reference' : 'narrative';
}

function detectNotationHeavy(text){
  const sample = text.slice(0, 6000);
  if(!sample) return false;
  const symbolChars = (sample.match(/[=+×÷∫∑√^_{}\\$<>≤≥≈π∞∂∇%→←↔]/g) || []).length;
  return (symbolChars / sample.length) > 0.012;
}

function extractFrontMatter(text){
  const lines = text.split('\n').map(l => l.trim());
  const nonEmpty = [];
  for(const l of lines){ if(l) nonEmpty.push(l); if(nonEmpty.length >= 16) break; }
  if(nonEmpty.length === 0) return { frontMatter: null, body: text };

  let title = null, authorLineIdx = -1;
  if(nonEmpty[0].split(/\s+/).length <= 16 && !/[.!?]$/.test(nonEmpty[0])){
    title = nonEmpty[0];
  }
  for(let i = 1; i < Math.min(nonEmpty.length, 10); i++){
    const line = nonEmpty[i];
    const rawWords = line.split(/\s+/).filter(Boolean);
    // ignore footnote/superscript markers (lone numbers, commas) when judging the line
    const words = rawWords.filter(w => !/^[\d,;]+$/.test(w));
    if(words.length > 25 || words.length < 2) continue;
    const capWords = words.filter(w => /^[A-Z][a-zA-Z.\-]*\d*$/.test(w));
    const capRatio = capWords.length / words.length;
    const hasNameSeparators = /,| and | & /i.test(line);
    const endsLikeSentence = /[.!?]$/.test(line) && !/\betal\.?$/i.test(line);
    if(capRatio > 0.55 && hasNameSeparators && !endsLikeSentence){ authorLineIdx = i; break; }
  }
  if(title === null && authorLineIdx === -1) return { frontMatter: null, body: text };

  const consumedLines = [];
  if(title) consumedLines.push(nonEmpty[0]);
  if(authorLineIdx > -1){
    consumedLines.push(nonEmpty[authorLineIdx]);
    const next = nonEmpty[authorLineIdx + 1];
    if(next && /university|institute|department|dept\.|college|@|lab(oratory)?/i.test(next) && next.split(/\s+/).length <= 30){
      consumedLines.push(next);
    }
  }
  let body = text;
  consumedLines.forEach(cl => { body = body.replace(cl, ''); });

  return {
    frontMatter: { title, authorLine: authorLineIdx > -1 ? nonEmpty[authorLineIdx] : null },
    body: body.trim()
  };
}

function splitParagraphs(text){
  let paras = text.split(/\n\s*\n/).map(p => p.trim().replace(/\s+/g,' ')).filter(p => p.length > 0);
  if(paras.length < 3){
    // likely flattened extraction (e.g. some PDFs) — regroup by sentences
    const sentences = text.replace(/\s+/g,' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/);
    paras = [];
    for(let i=0;i<sentences.length;i+=3){
      paras.push(sentences.slice(i,i+3).join(' '));
    }
    paras = paras.filter(p => p.trim().length > 0);
  }
  return paras;
}

function isHeadingLine(p){
  const t = p.trim();
  if(!t || t.length > 60) return false;
  const words = t.split(/\s+/);
  if(words.length > 8) return false;
  if(/[.!?]$/.test(t)) return false;
  const knownHeadings = /^(abstract|introduction|background|related work|literature review|methodology|methods|materials and methods|results?|discussion|conclusion(s)?|references|acknowledge?ments|appendix|future work)\b/i;
  if(knownHeadings.test(t)) return true;
  if(/^\d+(\.\d+)*\.?\s+[A-Z]/.test(t)) return true;
  const isTitleCase = t === t.toUpperCase() || /^([A-Z][a-zA-Z]*\s*){1,8}$/.test(t);
  return isTitleCase && words.length <= 6;
}

function detectAcademic(paragraphs, frontMatter){
  if(frontMatter && frontMatter.authorLine) return true;
  const headingsText = paragraphs.filter(isHeadingLine).join(' ').toLowerCase();
  return /abstract/.test(headingsText) && /(references|bibliography)/.test(headingsText);
}

function chunkParagraphsSimple(paragraphs){
  const targetChunks = Math.min(9, Math.max(3, Math.round(paragraphs.length / 2)));
  const chunkSize = Math.max(1, Math.ceil(paragraphs.length / targetChunks));
  const out = [];
  for(let i=0;i<paragraphs.length;i+=chunkSize){
    out.push(paragraphs.slice(i, i+chunkSize));
  }
  return out;
}

function buildNarrativeChunks(paragraphs){
  const hasHeadings = paragraphs.filter(isHeadingLine).length >= 2;
  if(!hasHeadings) return { chunks: chunkParagraphsSimple(paragraphs), hasHeadings:false };

  const maxPerChunk = 5;
  let groups = []; let currentGroup = [];
  paragraphs.forEach(p => {
    if(isHeadingLine(p) && currentGroup.length > 0){ groups.push(currentGroup); currentGroup = [p]; }
    else currentGroup.push(p);
  });
  if(currentGroup.length) groups.push(currentGroup);

  const refined = [];
  groups.forEach(g => {
    if(g.length <= maxPerChunk){ refined.push(g); return; }
    for(let i=0;i<g.length;i+=maxPerChunk){ refined.push(g.slice(i, i+maxPerChunk)); }
  });

  return refined.length >= 3 ? { chunks: refined, hasHeadings:true } : { chunks: chunkParagraphsSimple(paragraphs), hasHeadings:false };
}

function deriveTitle(text){
  const words = text.trim().split(/\s+/).slice(0, 7).join(' ');
  return words.length < text.trim().length ? words + '…' : words;
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}
