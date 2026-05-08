// Takes a Crocs cart share URL, extracts SKUs, and returns the public image
// URL for each one by hitting the VTEX product search API.
//
// GET /api/cart-charms?cartUrl=<urlencoded>

function send(res, code, body) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  const cartUrl = req.query?.cartUrl
  if (!cartUrl || typeof cartUrl !== 'string') {
    return send(res, 400, { error: 'Missing cartUrl query parameter' })
  }

  let parsed
  try {
    parsed = new URL(cartUrl)
  } catch {
    return send(res, 400, { error: 'Invalid cart URL' })
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return send(res, 400, { error: 'Only http(s) URLs are allowed' })
  }
  // Restrict to Crocs storefronts; this is what the lookup format supports.
  if (!/(^|\.)crocs\./i.test(parsed.host)) {
    return send(res, 400, { error: 'Only Crocs cart URLs are supported' })
  }

  const skus = parsed.searchParams.getAll('sku').filter(Boolean)
  if (skus.length === 0) {
    return send(res, 400, { error: 'No SKUs found in cart URL' })
  }

  const apiBase = `${parsed.protocol}//${parsed.host}/api/catalog_system/pub/products/search`

  const charms = []
  for (const sku of skus) {
    try {
      const apiUrl = `${apiBase}?fq=skuId:${encodeURIComponent(sku)}`
      const r = await fetch(apiUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; CharmStudio/1.0)',
        },
      })
      if (!r.ok) {
        console.warn(`SKU ${sku}: VTEX returned ${r.status}`)
        continue
      }
      const data = await r.json()
      const product = Array.isArray(data) ? data[0] : null
      if (!product) continue

      // Find the matching item (the API may return a product with several items).
      const item =
        product.items?.find((it) => String(it.itemId) === String(sku)) ||
        product.items?.[0]
      const imageUrl = item?.images?.[0]?.imageUrl
      if (!imageUrl) continue

      charms.push({
        sku,
        name: product.productName || item?.nameComplete || `Charm ${sku}`,
        imageUrl,
      })
    } catch (err) {
      console.error(`SKU ${sku} lookup failed:`, err?.message || err)
    }
  }

  if (charms.length === 0) {
    return send(res, 404, { error: 'No charms could be found for that cart' })
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify({ charms }))
}
