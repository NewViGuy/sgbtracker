// api/gold.js
// Scrapes RTGS 995 gold price (per 10g) from allindiabullion.com/gold-rate/maharashtra/mumbai
// Converts to per-gram and returns. Falls back to goldprice.today if scrape fails.

const https = require('https');
const zlib = require('zlib');

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept-Encoding': 'gzip, br, deflate',
        'Cache-Control': 'no-cache',
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const enc = res.headers['content-encoding'];
        const decomp = (b, cb) => {
          if (enc === 'gzip') zlib.gunzip(b, cb);
          else if (enc === 'br') zlib.brotliDecompress(b, cb);
          else if (enc === 'deflate') zlib.inflate(b, cb);
          else cb(null, b);
        };
        decomp(buf, (err, decoded) => {
          resolve({ body: (decoded || buf).toString('utf8'), status: res.statusCode });
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function parseIndianNumber(str) {
  // "1,61,546" → 161546
  return parseFloat(str.replace(/,/g, ''));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // ── Source 1: allindiabullion.com — RTGS 995 per 10g ──
  try {
    const r = await fetchUrl('https://allindiabullion.com/gold-rate/maharashtra/mumbai');

    if (r.status === 200 && r.body.length > 1000) {
      // The page renders the price in a block like:
      // RTGS 995  GOLD  ₹1,61,546
      // We match "RTGS 995" followed by price digits nearby
      const html = r.body;

      // Strategy: find "RTGS 995" then grab the next ₹X,XX,XXX number
      const rtgsIdx = html.indexOf('RTGS 995');
      if (rtgsIdx !== -1) {
        // Look in the next 300 chars for a price pattern
        const slice = html.slice(rtgsIdx, rtgsIdx + 400);
        // Match ₹1,XX,XXX or plain 1,XX,XXX (with or without rupee symbol)
        const priceMatch = slice.match(/[\u20B9₹]?\s*([\d]{1,2},[\d]{2},[\d]{3})/);
        if (priceMatch) {
          const per10g = parseIndianNumber(priceMatch[1]);
          if (per10g > 10000) {
            const perGram = per10g / 10;
            return res.status(200).json({
              success: true,
              pricePerGram: Math.round(perGram * 100) / 100,
              per10g,
              label: 'RTGS 995',
              source: 'allindiabullion.com (RTGS 995, Mumbai)',
              fetchedAt: new Date().toISOString(),
            });
          }
        }
      }
    }
    throw new Error('Could not parse RTGS 995 price from allindiabullion.com');
  } catch (e) {
    console.error('allindiabullion scrape failed:', e.message);
  }

  // ── Source 2: goldprice.today — INR/gram directly ──
  try {
    const r = await fetchUrl('https://goldprice.today/api.php?data=live');
    const data = JSON.parse(r.body);
    const gram = parseFloat(data?.INR?.gram);
    if (!isNaN(gram) && gram > 1000) {
      return res.status(200).json({
        success: true,
        pricePerGram: Math.round(gram * 100) / 100,
        source: 'goldprice.today (INR spot)',
        fetchedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error('goldprice.today fallback failed:', e.message);
  }

  // ── All failed ──
  return res.status(200).json({
    success: false,
    pricePerGram: null,
    source: 'unavailable',
    error: 'All gold price sources failed. Please enter manually.',
    fetchedAt: new Date().toISOString(),
  });
};
