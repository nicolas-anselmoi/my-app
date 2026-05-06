export default async function handler(req, res) {
  const url = req.query?.url
  if (!url || typeof url !== 'string') {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Missing url query parameter' }))
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Invalid url' }))
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Only http(s) URLs are allowed' }))
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CharmFetcher/1.0)',
        Accept: 'image/*',
      },
    })

    if (!upstream.ok) {
      res.statusCode = upstream.status
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ error: `Upstream responded ${upstream.status}` }))
    }

    const contentType = upstream.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ error: `Not an image (${contentType})` }))
    }

    const buf = Buffer.from(await upstream.arrayBuffer())
    res.statusCode = 200
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(buf)
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message || 'Fetch failed' }))
  }
}
