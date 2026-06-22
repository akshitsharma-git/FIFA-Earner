const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const API = 'https://iptv-eldbert.xyz/iptv/channels.json';

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(API, r => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => resolve(d));
      }).on('error', reject);
    });

    const channels = JSON.parse(data);
    const match =
      channels.find(c => c.group === 'FIFA World Cup' && c.name.includes('DSports') && !c.name.includes('Plus')) ||
      channels.find(c => c.name.includes('DSports') && !c.name.includes('Plus') && c.status === 'active') ||
      channels.find(c => c.name.includes('DSports'));

    if (!match) return res.status(404).json({ error: 'Channel not found' });

    const encoded = encodeURIComponent(match.url);
    const base = `https://${req.headers.host}`;
    res.json({ url: `${base}/proxy?url=${encoded}` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};