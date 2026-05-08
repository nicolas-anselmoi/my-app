import { useEffect, useRef, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useSearchParams } from 'react-router-dom'
import CrocBoard from '../components/charm/CrocBoard'
import CartImport from '../components/charm/CartImport'
import ZoneTuner from '../components/charm/ZoneTuner'
import { CHARM_SIZE, CHARM_ZONES, SNAP_THRESHOLD } from '../lib/charmZones'
import { pickRandomSet } from '../lib/charmSets'
import { fetchAndCleanImage } from '../lib/removeCharmBg'

const ZONES_STORAGE_KEY = 'charm-zones-tuning'

let nextId = 1
const makeId = () => `charm-${nextId++}`

function snapCollision({ droppableContainers, collisionRect }) {
  if (!collisionRect) return []
  const cx = collisionRect.left + collisionRect.width / 2
  const cy = collisionRect.top + collisionRect.height / 2

  let bestZone = null
  let bestDist = SNAP_THRESHOLD
  for (const c of droppableContainers) {
    if (!String(c.id).startsWith('zone-')) continue
    const r = c.rect.current
    if (!r) continue
    const dist = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy)
    if (dist < bestDist) {
      bestDist = dist
      bestZone = c
    }
  }
  if (bestZone) return [{ id: bestZone.id }]

  const board = droppableContainers.find((c) => c.id === 'board')
  if (board) {
    const r = board.rect.current
    if (r && cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
      return [{ id: 'board' }]
    }
  }
  return []
}

function loadStoredZones() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ZONES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length !== CHARM_ZONES.length) return null
    return parsed
  } catch {
    return null
  }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Physics constants — tweak to taste.
const GRAVITY = 0.7         // px / frame²  (in 60fps frame units)
const RESTITUTION = 0.32    // bounciness on impact (0 = thud, 1 = perfect bounce)
const WALL_BOUNCE = 0.4
const AIR_FRICTION = 0.995
const SURFACE_FRICTION = 0.9
const SETTLE_SPEED = 0.25   // below this speed for several frames -> settled
const SETTLE_FRAMES = 8

// The bottom of the shoe fades out (see CrocBoard) and the UI overlay sits
// in that faded zone. Cap how far charms can fall so they rest above the UI.
const FLOOR_PCT = 0.75

export default function CharmDesigner() {
  const [charms, setCharms] = useState([])
  const [placement, setPlacement] = useState({})
  const [activeSet, setActiveSet] = useState(null)
  const [cartBusy, setCartBusy] = useState(false)
  const [cartProgress, setCartProgress] = useState(null)
  const boardRef = useRef(null)
  const [params] = useSearchParams()
  const debug = params.get('edit') === '1'

  const [zones, setZones] = useState(() =>
    debug
      ? loadStoredZones() || CHARM_ZONES.map((z) => ({ ...z }))
      : CHARM_ZONES.map((z) => ({ ...z })),
  )

  // Refs that mirror state, so the rAF physics tick always sees current values.
  const charmsRef = useRef(charms)
  const placementRef = useRef(placement)
  const zonesRef = useRef(zones)
  charmsRef.current = charms
  placementRef.current = placement
  zonesRef.current = zones

  // charmId -> rAF handle for any in-flight gravity simulation.
  const fallTimersRef = useRef(new Map())

  useEffect(() => {
    if (!debug) return
    try {
      window.localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones))
    } catch {}
  }, [zones, debug])

  // Cancel all running fall simulations on unmount.
  useEffect(
    () => () => {
      for (const handle of fallTimersRef.current.values()) {
        cancelAnimationFrame(handle)
      }
      fallTimersRef.current.clear()
    },
    [],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // Top-left pixel positions of every other charm currently visible on the
  // board, used as obstacles for collision/physics. Reads from refs so callers
  // inside rAF ticks always see fresh state.
  function getObstacles(excludeId) {
    const board = boardRef.current
    if (!board) return []
    const rect = board.getBoundingClientRect()
    const out = []
    const currentCharms = charmsRef.current
    const currentPlacement = placementRef.current
    const currentZones = zonesRef.current
    for (const c of currentCharms) {
      if (c.id === excludeId) continue
      const p = currentPlacement[c.id]
      if (!p) continue
      if (p.kind === 'floating') {
        out.push({ x: p.x, y: p.y })
      } else if (p.kind === 'zone') {
        const z = currentZones.find((zz) => zz.id === p.zoneId)
        if (z) {
          out.push({
            x: (z.x / 100) * rect.width - CHARM_SIZE / 2,
            y: (z.y / 100) * rect.height - CHARM_SIZE / 2,
          })
        }
      }
    }
    return out
  }

  function cancelFall(charmId) {
    const handle = fallTimersRef.current.get(charmId)
    if (handle) {
      cancelAnimationFrame(handle)
      fallTimersRef.current.delete(charmId)
    }
  }

  // Animated gravity: charm falls from (startX, startY), bouncing off the
  // floor, walls, and any other charms it touches, until it comes to rest.
  function startFall(charmId, startX, startY, initialVx = 0, initialVy = 0) {
    cancelFall(charmId)

    let x = startX
    let y = startY
    let vx = initialVx
    let vy = initialVy
    let lastT = performance.now()
    let stillFrames = 0

    function tick(now) {
      const board = boardRef.current
      if (!board) {
        fallTimersRef.current.delete(charmId)
        return
      }
      const rect = board.getBoundingClientRect()
      const floor = rect.height * FLOOR_PCT - CHARM_SIZE
      const rightWall = rect.width - CHARM_SIZE

      // dt normalized to 60fps frames so physics feel consistent.
      const dt = Math.min((now - lastT) / (1000 / 60), 2.5)
      lastT = now

      vy += GRAVITY * dt
      x += vx * dt
      y += vy * dt

      let touchedSurface = false

      // Floor
      if (y >= floor) {
        y = floor
        if (vy > 0) vy = -vy * RESTITUTION
        vx *= SURFACE_FRICTION
        touchedSurface = true
      }

      // Walls
      if (x < 0) {
        x = 0
        if (vx < 0) vx = -vx * WALL_BOUNCE
      } else if (x > rightWall) {
        x = rightWall
        if (vx > 0) vx = -vx * WALL_BOUNCE
      }

      // Other charms — treat as circles of diameter CHARM_SIZE.
      const obstacles = getObstacles(charmId)
      for (const o of obstacles) {
        const dx = x - o.x
        const dy = y - o.y
        const dist = Math.hypot(dx, dy)
        if (dist < CHARM_SIZE) {
          const overlap = CHARM_SIZE - dist
          const nx = dist < 0.001 ? 0 : dx / dist
          const ny = dist < 0.001 ? -1 : dy / dist
          // Position correction
          x += nx * overlap
          y += ny * overlap
          // Velocity reflection along the normal, only if moving in
          const vn = vx * nx + vy * ny
          if (vn < 0) {
            const j = -(1 + RESTITUTION) * vn
            vx += j * nx
            vy += j * ny
          }
          // If we're sitting on top of another charm, treat that as a surface.
          if (ny < -0.5) touchedSurface = true
        }
      }

      // Air friction (light)
      vx *= AIR_FRICTION
      vy *= AIR_FRICTION

      // Push the new position to React state for this frame.
      setPlacement((p) => ({ ...p, [charmId]: { kind: 'floating', x, y } }))

      // Settle when nearly motionless and resting on something.
      const speed = Math.hypot(vx, vy)
      if (speed < SETTLE_SPEED && touchedSurface) {
        stillFrames++
        if (stillFrames > SETTLE_FRAMES) {
          fallTimersRef.current.delete(charmId)
          return
        }
      } else {
        stillFrames = 0
      }

      const handle = requestAnimationFrame(tick)
      fallTimersRef.current.set(charmId, handle)
    }

    const handle = requestAnimationFrame(tick)
    fallTimersRef.current.set(charmId, handle)
  }

  // Random horizontal spawn for fresh URL imports — drops from above.
  function topSpawn() {
    const board = boardRef.current
    if (!board) return null
    const rect = board.getBoundingClientRect()
    const xPct = 0.25 + Math.random() * 0.5
    const x = rect.width * xPct - CHARM_SIZE / 2
    const y = -CHARM_SIZE - 20
    return { x, y, boardRect: rect }
  }

  function addCharm(src) {
    const spawn = topSpawn()
    if (!spawn) return
    const id = makeId()
    setCharms((prev) => [...prev, { id, src }])
    setPlacement((p) => ({
      ...p,
      [id]: { kind: 'floating', x: spawn.x, y: spawn.y },
    }))
    // Let the state commit, then start the gravity simulation.
    requestAnimationFrame(() => startFall(id, spawn.x, spawn.y))
  }

  function spawnSet(set) {
    setActiveSet(set)
    set.charms.forEach((src, i) => {
      window.setTimeout(() => addCharm(src), i * 220)
    })
  }

  function clearBoard() {
    for (const handle of fallTimersRef.current.values()) {
      cancelAnimationFrame(handle)
    }
    fallTimersRef.current.clear()
    setCharms([])
    setPlacement({})
  }

  function shuffleSet() {
    clearBoard()
    const next = pickRandomSet(activeSet?.name)
    requestAnimationFrame(() => spawnSet(next))
  }

  // Pull SKUs out of a Crocs cart URL via the serverless function, then run
  // each product image through the existing fetch + bg-removal pipeline and
  // drop the cleaned charms onto the board as a "Custom" set.
  async function loadFromCart(cartUrl) {
    if (cartBusy) return
    setCartBusy(true)
    setCartProgress('Looking up cart…')
    clearBoard()
    setActiveSet({ name: 'Custom', slug: 'custom' })

    try {
      const res = await fetch(
        `/api/cart-charms?cartUrl=${encodeURIComponent(cartUrl)}`,
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || `Cart lookup failed (${res.status})`)
      }
      const list = body.charms || []
      if (list.length === 0) throw new Error('No charms found in that cart')

      setCartProgress(
        `Loading ${list.length} charm${list.length === 1 ? '' : 's'}… background removal can take a while.`,
      )

      let done = 0
      await Promise.all(
        list.map(async (item, i) => {
          try {
            const cleanedSrc = await fetchAndCleanImage(item.imageUrl)
            // Slight stagger so charms don't all spawn on the same frame.
            await new Promise((r) => setTimeout(r, i * 250))
            addCharm(cleanedSrc)
          } catch (err) {
            console.error(`Charm ${item.sku} failed:`, err)
          } finally {
            done++
            setCartProgress(`${done}/${list.length} charms ready`)
          }
        }),
      )
    } finally {
      setCartBusy(false)
      setCartProgress(null)
    }
  }

  // Drop a random set in once the board is mounted (unless we're already
  // loading a custom cart).
  useEffect(() => {
    if (debug) return
    if (charms.length > 0 || cartBusy) return
    const handle = requestAnimationFrame(() => spawnSet(pickRandomSet()))
    return () => cancelAnimationFrame(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debug])

  function handleDragStart(event) {
    cancelFall(event.active.id)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    const charmId = active.id

    // Snap to a free zone if released over one.
    if (over && String(over.id).startsWith('zone-')) {
      const zoneId = over.id.slice('zone-'.length)
      const occupant = Object.entries(placement).find(
        ([cid, p]) => cid !== charmId && p?.kind === 'zone' && p.zoneId === zoneId,
      )
      if (!occupant) {
        setPlacement((p) => ({ ...p, [charmId]: { kind: 'zone', zoneId } }))
        return
      }
      // Zone occupied -> fall through, gravity takes over.
    }

    // Otherwise: gravity. Start the fall from the release position.
    const board = boardRef.current
    if (!board) return
    const boardRect = board.getBoundingClientRect()
    const charmRect = active.rect.current.translated
    if (!charmRect) return
    const releaseX = charmRect.left - boardRect.left
    const releaseY = charmRect.top - boardRect.top
    setPlacement((p) => ({
      ...p,
      [charmId]: { kind: 'floating', x: releaseX, y: releaseY },
    }))
    startFall(charmId, releaseX, releaseY)
  }

  if (debug) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={snapCollision}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-extrabold mb-6">
            Charm Designer
            <span className="text-base font-normal text-blue-600 ml-2">
              — edit mode
            </span>
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div>
              <CrocBoard
                ref={boardRef}
                charms={charms}
                placement={placement}
                zones={zones}
                setZones={setZones}
                debug
              />
              <p className="mt-3 text-xs text-gray-500 text-center">
                Drag the numbered circles to position each hole. Changes
                persist in this browser.
              </p>
            </div>
            <ZoneTuner zones={zones} setZones={setZones} />
          </div>
        </main>
      </DndContext>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={snapCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main className="min-h-full flex flex-col items-center px-6 py-12 sm:py-16">
        <header className="text-center max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-mint-strong)] mb-3">
            Charm Studio
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight text-[var(--color-ink)]">
            Make it
            <span className="relative inline-block ml-3">
              <span className="relative z-10">your own</span>
              <span
                aria-hidden
                className="absolute inset-x-[-6px] bottom-1 sm:bottom-2 h-3 sm:h-4 rounded-full bg-[var(--color-coral)]/70 -z-0"
              />
            </span>
            .
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-600">
            Drop in a product image, then drag your new charm onto the shoe.
          </p>
        </header>

        <section className="relative w-full max-w-[560px]">
          <CrocBoard
            ref={boardRef}
            charms={charms}
            placement={placement}
            zones={zones}
            setZones={setZones}
          />

          {/* UI overlay sits in the faded bottom quarter of the shoe. */}
          <div className="absolute inset-x-0 bottom-[3%] sm:bottom-[5%] z-10 px-3 flex flex-col items-center gap-3">
            <button
              onClick={shuffleSet}
              disabled={cartBusy}
              className="px-7 py-3 rounded-full bg-[var(--color-ink)] text-white text-sm font-extrabold tracking-wide hover:bg-black active:scale-[0.98] transition shadow-[0_4px_18px_rgba(31,36,33,0.18)] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Shuffle charms
            </button>
            {activeSet && (
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">
                {activeSet.name} set
              </p>
            )}
            <CartImport
              onLoad={loadFromCart}
              busy={cartBusy}
              progress={cartProgress}
            />
          </div>
        </section>
      </main>
    </DndContext>
  )
}
