import { useEffect, useRef, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useSearchParams } from 'react-router-dom'
import CrocBoard from '../components/charm/CrocBoard'
import Drawer from '../components/charm/Drawer'
import UrlImport from '../components/charm/UrlImport'
import ZoneTuner from '../components/charm/ZoneTuner'
import { CHARM_ZONES, SNAP_THRESHOLD } from '../lib/charmZones'

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

export default function CharmDesigner() {
  const [charms, setCharms] = useState([])
  const [placement, setPlacement] = useState({})
  const boardRef = useRef(null)
  const [params] = useSearchParams()
  const debug = params.get('edit') === '1'

  // In edit mode, restore in-progress tuning from localStorage so refreshing
  // doesn't lose your work. In view mode, always use the canonical source.
  const [zones, setZones] = useState(() =>
    debug
      ? loadStoredZones() || CHARM_ZONES.map((z) => ({ ...z }))
      : CHARM_ZONES.map((z) => ({ ...z })),
  )

  useEffect(() => {
    if (!debug) return
    try {
      window.localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones))
    } catch {}
  }, [zones, debug])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  function addCharm(src) {
    setCharms((prev) => [...prev, { id: makeId(), src }])
  }

  function handleDragEnd(event) {
    const { active, over } = event
    const charmId = active.id

    if (!over) {
      setPlacement((p) => {
        const next = { ...p }
        delete next[charmId]
        return next
      })
      return
    }

    if (over.id === 'board') {
      const boardEl = boardRef.current
      if (!boardEl) return
      const boardRect = boardEl.getBoundingClientRect()
      const charmRect = active.rect.current.translated
      if (!charmRect) return
      setPlacement((p) => ({
        ...p,
        [charmId]: {
          kind: 'floating',
          x: charmRect.left - boardRect.left,
          y: charmRect.top - boardRect.top,
        },
      }))
      return
    }

    if (String(over.id).startsWith('zone-')) {
      const zoneId = over.id.slice('zone-'.length)
      const occupant = Object.entries(placement).find(
        ([cid, p]) => cid !== charmId && p?.kind === 'zone' && p.zoneId === zoneId,
      )
      if (occupant) return
      setPlacement((p) => ({ ...p, [charmId]: { kind: 'zone', zoneId } }))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={snapCollision}
      onDragEnd={handleDragEnd}
    >
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Charm Designer{debug && <span className="text-base font-normal text-blue-600 ml-2">— edit mode</span>}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div>
            <CrocBoard
              ref={boardRef}
              charms={charms}
              placement={placement}
              zones={zones}
              setZones={setZones}
              debug={debug}
            />
            {debug && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                Drag the numbered circles to position each hole. Changes persist in this browser.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {debug ? (
              <ZoneTuner zones={zones} setZones={setZones} />
            ) : (
              <>
                <UrlImport onAdd={addCharm} />
                <Drawer charms={charms} placement={placement} />
              </>
            )}
          </div>
        </div>
      </main>
    </DndContext>
  )
}
