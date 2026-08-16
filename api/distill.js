/**
 * api/distill.js
 * ---------------
 * A Vercel serverless function (Node.js runtime — any .js file inside /api
 * is auto-deployed as an endpoint at /api/<filename>, no config needed).
 *
 * This exists for one reason: the browser can never hold a real Anthropic
 * API key — anyone could open dev tools or view-source and copy it out.
 * So the key lives here, as an environment variable on the server, and the
 * frontend calls THIS endpoint instead of api.anthropic.com directly. This
 * function is the only thing that talks to Anthropic.
 *
 * Required setup: in your Vercel project settings → Environment Variables,
 * add ANTHROPIC_API_KEY with your real key from console.anthropic.com.
 */

const MODEL = 'claude-sonnet-4-6';
const MAX_PROMPT_CHARS = 20000;   // sanity cap — a stray/huge request shouldn't run up your bill
const MAX_TOKENS_CAP = 1500;      // hard ceiling regardless of what the frontend asks for

module.exports = async (req, res) => {
  // Same-origin in production (frontend and this function share a domain),
  // but permissive CORS headers make local testing / other setups painless.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if(req.method === 'OPTIONS'){
    res.status(204).end();
    return;
  }
  if(req.method !== 'POST'){
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if(!process.env.ANTHROPIC_API_KEY){
    res.status(500).json({ error: 'Server is missing the ANTHROPIC_API_KEY environment variable.' });
    return;
  }

  const { prompt, maxTokens } = req.body || {};
  if(!prompt || typeof prompt !== 'string'){
    res.status(400).json({ error: 'Missing "prompt" string in request body.' });
    return;
  }
  if(prompt.length > MAX_PROMPT_CHARS){
    res.status(400).json({ error: `Prompt too long (max ${MAX_PROMPT_CHARS} characters).` });
    return;
  }

  try{
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(Number(maxTokens) || 200, MAX_TOKENS_CAP),
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  }catch(e){
    console.error('Anthropic API error:', e);
    res.status(500).json({ error: 'Upstream request to Anthropic failed.' });
  }
};
