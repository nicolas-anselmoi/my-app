// The set definitions live in scripts/charm-sets.json so the offline
// processor and the runtime app share a single source of truth. The processor
// fetches each URL, removes the background, and writes the result to
// /public/charms/<slug>/<index>.png. The app loads those local PNGs.
//
// To edit sets: change scripts/charm-sets.json, then run
//   npm run process-charms
// (existing files are skipped; pass `-- --force` to re-process everything).

import config from '../../scripts/charm-sets.json'

export const CHARM_SETS = config.sets.map((set) => ({
  name: set.name,
  slug: set.slug,
  charms: set.urls.map((_, i) => `/charms/${set.slug}/${i + 1}.png`),
}))

export function pickRandomSet(excludingName) {
  const pool = excludingName
    ? CHARM_SETS.filter((s) => s.name !== excludingName)
    : CHARM_SETS
  if (pool.length === 0) return CHARM_SETS[0]
  return pool[Math.floor(Math.random() * pool.length)]
}
