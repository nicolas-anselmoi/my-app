import { useRef, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useSearchParams } from 'react-router-dom'
import CrocBoard from '../components/charm/CrocBoard'
import Drawer from '../components/charm/Drawer'
import UrlImport from '../components/charm/UrlImport'
import { CHARM_ZONES, SNAP_THRESHOLD } from '../lib/charmZones'

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

export default function CharmDesigner() {
  const [charms, setCharms] = useState([])
  const [placement, setPlacement] = useState({})
  const boardRef = useRef(null)
  const [params] = useSearchParams()
  const debug = params.get('edit') === '1'

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
      // Released outside any droppable -> back to drawer
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
      if (occupant) return // one-per-zone, reject
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Charm Designer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div>
            <CrocBoard
              ref={boardRef}
              charms={charms}
              placement={placement}
              debug={debug}
            />
            {debug && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                Edit mode: drop zones outlined in blue. {CHARM_ZONES.length} zones defined.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <UrlImport onAdd={addCharm} />
            <Drawer charms={charms} placement={placement} />
          </div>
        </div>
      </main>
    </DndContext>
  )
}
