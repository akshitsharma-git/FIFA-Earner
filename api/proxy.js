const fetch = require('node-fetch');

module.exports = async (req, res) => {
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const targetUrl = req.query.url;

  if (!targetUrl) return res.status(400).send('Missing ?url= parameter');

  
  let parsed;
  try {
    parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    return res.status(400).send('Invalid URL');
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Referer': `${parsed.origin}/`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': parsed.origin,
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    
    response.body.pipe(res);

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error: ' + err.message);
  }
};