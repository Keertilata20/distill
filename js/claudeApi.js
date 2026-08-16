/**
 * claudeApi.js
 * ------------
 * Everything that talks to the summary backend: the raw call wrapper, and
 * the prompt construction for each of the four format tabs.
 *
 * This calls /api/distill — our own serverless function (see api/distill.js)
 * — rather than api.anthropic.com directly. The browser can never safely
 * hold a real API key, so the key lives server-side and this file only
 * ever talks to our own domain.
 */

async function callClaude(prompt, maxTokens){
  try{
    const response = await fetch("/api/distill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, maxTokens: maxTokens || 200 })
    });
    const data = await response.json();
    return (data.content || []).map(b => b.text || "").join("").trim();
  }catch(e){
    console.error("Claude API error:", e);
    return null;
  }
}

function fullTextOf(doc){
  return doc.chunks.map(c => c.join(' ')).join('\n\n').slice(0, 6000);
}

async function generateBreakdown(doc){
  const fullText = fullTextOf(doc);
  let prompt;
  if(doc.docType === 'reference'){
    prompt = `Here is reference material (formulas, definitions, a cheat sheet, tables, or similar non-narrative content):\n\n"""${fullText}"""\n\nOrganize this into a clean reference list. Respond with ONLY valid JSON, no markdown fences, no preamble: an array like [{"title": "short label, max 6 words", "content": "the cleaned-up fact/formula/definition, max 40 words, plain text notation using ^ for exponents and sqrt() for roots"}]. Group closely related items together.`;
  } else {
    const parts = doc.chunks.map((c,i) => `--- Part ${i+1} ---\n${c.join(' ')}`).join('\n\n').slice(0, 8000);
    prompt = `Here is a document broken into parts:\n\n${parts}\n\nFor each part, in the same order, respond with ONLY valid JSON, no markdown fences, no preamble: an array like [{"title": "short heading for this part, max 6 words, use the document's own section heading if one is evident", "content": "1-2 sentence summary of this part, max 35 words"}].`;
  }
  const raw = await callClaude(prompt, 1200);
  try{
    const cleaned = (raw || '').replace(/```json|```/g, '').trim();
    const arr = JSON.parse(cleaned);
    return Array.isArray(arr) ? arr : [];
  }catch(e){
    return [{ title: 'Unavailable', content: "Couldn't organize this right now — try again." }];
  }
}

async function generateFormat(doc, key){
  if(doc.formats[key]) return doc.formats[key];
  const fullText = fullTextOf(doc);
  let result;
  if(key === 'tldr'){
    const prompt = `Summarize the following in 2-3 sentences (max 60 words), capturing the core gist. No preamble, just the summary:\n\n"""${fullText}"""`;
    result = (await callClaude(prompt, 150)) || "Couldn't generate this right now.";
  } else if(key === 'keyPoints'){
    const prompt = `List the 4-6 most important points from the following as plain lines, each starting with "- ", max 18 words per line. No preamble, no other text:\n\n"""${fullText}"""`;
    const raw = await callClaude(prompt, 260);
    result = (raw || '').split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
    if(result.length === 0) result = ["Couldn't generate this right now."];
  } else if(key === 'abstract'){
    const prompt = doc.isAcademic
      ? `Write a proper academic-style abstract (120-180 words) for the following, covering purpose, approach, and findings. No preamble, just the abstract:\n\n"""${fullText}"""`
      : `Write a clear one-paragraph summary (100-150 words) of the following. No preamble, just the summary:\n\n"""${fullText}"""`;
    result = (await callClaude(prompt, 320)) || "Couldn't generate this right now.";
  } else if(key === 'breakdown'){
    result = await generateBreakdown(doc);
  }
  doc.formats[key] = result;
  saveDocs();
  renderLibrary();
  return result;
}
