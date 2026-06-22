const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing URL');

  try {
    const parsed = new URL(targetUrl);
    const response = await fetch(targetUrl, {
      headers: {
        'Referer':    `${parsed.origin}/`,
        'Origin':     parsed.origin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });

    const data = await response.buffer();
    const ct = response.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'no-store');
    res.send(data);
  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message);
  }
};