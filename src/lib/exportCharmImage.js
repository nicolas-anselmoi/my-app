// Renders the current shoe + charms-in-zones to an offscreen canvas and
// returns a PNG blob with a transparent background. Mirrors the on-screen
// look: top half of the shoe solid, bottom faded out via the same gradient
// that the UI uses, and only zone-placed charms are drawn (floating charms
// are intentionally skipped).

import { CHARM_SIZE } from './charmZones'

const EXPORT_WIDTH = 1080
const REFERENCE_BOARD_WIDTH = 520 // CrocBoard's max-w; preserves charm:shoe ratio

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) =>
      reject(new Error(`Failed to load image: ${src} (${err?.type || 'error'})`))
    img.src = src
  })
}

export async function exportCharmImage({
  placement,
  charms,
  zones,
  crocSrc = '/croc.png',
}) {
  const placed = zones
    .map((zone) => {
      const entry = Object.entries(placement).find(
        ([, p]) => p?.kind === 'zone' && p.zoneId === zone.id,
      )
      if (!entry) return null
      const [charmId] = entry
      const charm = charms.find((c) => c.id === charmId)
      if (!charm) return null
      return { zone, charm }
    })
    .filter(Boolean)

  const croc = await loadImage(crocSrc)
  const charmImages = await Promise.all(
    placed.map(({ charm }) => loadImage(charm.src)),
  )

  const aspect = croc.naturalHeight / croc.naturalWidth
  const w = EXPORT_WIDTH
  const h = Math.round(w * aspect)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Shoe
  ctx.drawImage(croc, 0, 0, w, h)

  // Fade the bottom half exactly like the on-screen mask
  // (linear-gradient(to bottom, #000 50%, transparent 75%))
  const grad = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.75)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = grad
  ctx.fillRect(0, h * 0.5, w, h * 0.5)
  ctx.restore()

  // Charm size scales with the export canvas so the look matches the UI.
  const charmBaseSize = (CHARM_SIZE / REFERENCE_BOARD_WIDTH) * w

  placed.forEach(({ zone, charm }, i) => {
    const img = charmImages[i]
    if (!img) return
    const cx = (zone.x / 100) * w
    const cy = (zone.y / 100) * h
    const drawSize = charmBaseSize * (charm.scale ?? 1)
    ctx.save()
    ctx.translate(cx, cy)
    if (charm.rotation) {
      ctx.rotate((charm.rotation * Math.PI) / 180)
    }
    ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize)
    ctx.restore()
  })

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
    )
  })
}

// Hands a generated PNG to the user: Web Share API on supported devices
// (with file sharing), otherwise a plain download.
export async function shareOrDownload(blob, filename = 'my-croc.png') {
  const file = new File([blob], filename, { type: 'image/png' })
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: 'Make it your own',
        text: 'My custom Croc',
      })
      return 'shared'
    } catch (err) {
      // User cancelled or share failed -> fall through to download.
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
