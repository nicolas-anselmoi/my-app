import { forwardRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import DropZone from './DropZone'
import EditableZones from './EditableZones'
import Charm from './Charm'
import { CHARM_SIZE } from '../../lib/charmZones'

const CrocBoard = forwardRef(function CrocBoard(
  { charms, placement, zones, setZones, debug = false },
  ref,
) {
  const { setNodeRef: setBoardRef } = useDroppable({ id: 'board' })

  const setRefs = (el) => {
    setBoardRef(el)
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  const placedOnZone = (zoneId) =>
    charms.find(
      (c) => placement[c.id]?.kind === 'zone' && placement[c.id].zoneId === zoneId,
    )

  const floatingCharms = charms.filter((c) => placement[c.id]?.kind === 'floating')

  return (
    <div
      ref={setRefs}
      className={
        debug
          ? 'relative w-full max-w-[520px] mx-auto rounded-2xl overflow-hidden'
          : 'relative h-full max-w-[520px] mx-auto rounded-2xl overflow-hidden aspect-[608/1357]'
      }
    >
      <img
        src="/croc.png"
        alt="Croc"
        draggable={false}
        className={
          debug
            ? 'block w-full h-auto select-none pointer-events-none'
            : 'block w-full h-full object-contain select-none pointer-events-none'
        }
        style={
          debug
            ? undefined
            : {
                maskImage:
                  'linear-gradient(to bottom, #000 50%, transparent 95%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, #000 50%, transparent 95%)',
              }
        }
      />

      {debug ? (
        <EditableZones zones={zones} setZones={setZones} boardRef={ref} />
      ) : (
        zones.map((zone) => (
          <DropZone
            key={zone.id}
            zone={zone}
            occupied={!!placedOnZone(zone.id)}
            debug={false}
          />
        ))
      )}

      {!debug &&
        zones.map((zone) => {
          const charm = placedOnZone(zone.id)
          if (!charm) return null
          return (
            <div
              key={`placed-${zone.id}`}
              className="absolute"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: CHARM_SIZE,
                height: CHARM_SIZE,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Charm id={charm.id} src={charm.src} />
            </div>
          )
        })}

      {!debug &&
        floatingCharms.map((c) => {
          const p = placement[c.id]
          return (
            <div
              key={`float-${c.id}`}
              className="absolute"
              style={{ left: p.x, top: p.y, width: CHARM_SIZE, height: CHARM_SIZE }}
            >
              <Charm id={c.id} src={c.src} />
            </div>
          )
        })}
    </div>
  )
})

export default CrocBoard
