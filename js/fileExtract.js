/**
 * fileExtract.js
 * --------------
 * Turns an uploaded file into plain text. Depends on pdfjsLib and mammoth,
 * both loaded via CDN <script> tags in index.html's <head> — that's why
 * this file must load after those, but before uploadView.js which calls it.
 */

async function extractPdfText(arrayBuffer){
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for(let i=1;i<=pdf.numPages;i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Group glyphs into visual lines by y-position, then sort each line
    // left-to-right by x-position. PDF content streams don't always store
    // text in reading order (this is especially common around subscripts,
    // superscripts, and equations), so we rebuild reading order from
    // actual glyph position instead of trusting stream order.
    const lines = [];
    content.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      let line = lines.find(l => Math.abs(l.y - y) < 3);
      if(!line){ line = { y, items: [] }; lines.push(line); }
      line.items.push({ x, str: item.str });
    });
    lines.sort((a,b) => b.y - a.y);
    const pageLines = lines.map(l => {
      l.items.sort((a,b) => a.x - b.x);
      return l.items.map(it => it.str).join(' ').replace(/\s+/g,' ').trim();
    }).filter(Boolean);
    text += pageLines.join('\n') + '\n\n';
  }
  return text;
}

async function extractDocxText(arrayBuffer){
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromFile(file){
  const name = file.name.toLowerCase();
  if(name.endsWith('.pdf')) return extractPdfText(await file.arrayBuffer());
  if(name.endsWith('.docx')) return extractDocxText(await file.arrayBuffer());
  return file.text();
}
