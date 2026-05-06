// Approximate hole positions on public/croc.png as percentages (0–100).
// Pattern: 2 / 3 / 4 / 4 = 13. Tune in the UI with ?edit=1.
export const CHARM_ZONES = [
  { id: 'z1',  x: 40, y: 12 },
  { id: 'z2',  x: 52, y: 12 },
  { id: 'z3',  x: 32, y: 21 },
  { id: 'z4',  x: 44, y: 21 },
  { id: 'z5',  x: 56, y: 21 },
  { id: 'z6',  x: 26, y: 30 },
  { id: 'z7',  x: 38, y: 30 },
  { id: 'z8',  x: 50, y: 30 },
  { id: 'z9',  x: 62, y: 30 },
  { id: 'z10', x: 28, y: 39 },
  { id: 'z11', x: 41, y: 39 },
  { id: 'z12', x: 54, y: 39 },
  { id: 'z13', x: 66, y: 39 },
]

export const CHARM_SIZE = 56  // px on screen
export const SNAP_THRESHOLD = 60  // px from zone center to snap
