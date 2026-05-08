// One-off processor: fetches each charm URL listed in charm-sets.json,
// removes its background, and writes a transparent PNG to public/charms/.
// Re-run after editing charm-sets.json (existing files are skipped unless
// you pass --force).
//
// Usage:
//   npm run process-charms          # only process missing files
//   npm run process-charms -- --force   # re-process everything

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { removeBackground } from '@imgly/background-removal-node'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const FORCE = process.argv.includes('--force')

const exists = async (p) => {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function main() {
  const config = JSON.parse(
    await readFile(join(__dirname, 'charm-sets.json'), 'utf-8'),
  )

  for (const set of config.sets) {
    const outDir = join(ROOT, 'public', 'charms', set.slug)
    await mkdir(outDir, { recursive: true })

    for (let i = 0; i < set.urls.length; i++) {
      const url = set.urls[i]
      const outPath = join(outDir, `${i + 1}.png`)
      const tag = `[${set.slug} ${i + 1}/${set.urls.length}]`

      if (!FORCE && (await exists(outPath))) {
        console.log(`${tag} skip — already exists`)
        continue
      }

      console.log(`${tag} fetching ${url}`)
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (charm-processor)',
          Accept: 'image/*',
        },
      })
      if (!res.ok) {
        console.error(`${tag} fetch failed: ${res.status}`)
        continue
      }
      const arrayBuffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const inputBlob = new Blob([arrayBuffer], { type: contentType })

      console.log(`${tag} removing background (${contentType})`)
      const cleaned = await removeBackground(inputBlob)
      const cleanedBuffer = Buffer.from(await cleaned.arrayBuffer())
      await writeFile(outPath, cleanedBuffer)
      console.log(`${tag} wrote ${outPath}`)
    }
  }

  console.log('All done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
