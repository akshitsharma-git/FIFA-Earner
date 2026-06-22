const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  try {
    // Step 1: Get live match from streamed.pk
    const matches = await fetch2('https://streamed.pk/api/matches/football');
    const match = matches.find(m => m.sources?.some(s => s.source === 'golf')) || matches[0];
    if (!match) throw new Error('No match');

    const golf = match.sources.find(s => s.source === 'golf');

    // Step 2: Fetch the embed page to extract m3u8 URL
    const embedHtml = await fetch2raw(
      `https://embed.st/embed/golf/${golf.id}/1`,
      { 'Referer': 'https://streamed.pk/' }
    );

    // Step 3: Extract m3u8 URL from the HTML/JS
    const m3u8Match = embedHtml.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/);
    if (!m3u8Match) throw new Error('No m3u8 found');

    const streamUrl = m3u8Match[0];
    const encoded = encodeURIComponent(streamUrl);
    const base = `https://${req.headers.host}`;

    res.json({
      url: `${base}/proxy?url=${encoded}`,
      match: match.title,
      raw: streamUrl
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function fetch2(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Referer': 'https://streamed.pk/',
        'Origin': 'https://streamed.pk',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers
      }
    }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { reject(new Error('Bad JSON: ' + d.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

function fetch2raw(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Referer': 'https://streamed.pk/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers
      }
    }, r => {
      // Follow redirect if needed
      if (r.statusCode === 301 || r.statusCode === 302) {
        return fetch2raw(r.headers.location, headers).then(resolve).catch(reject);
      }
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(d));
    }).on('error', reject);
  });
}