import { forwardRef, useEffect, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import DropZone from './DropZone'
import EditableZones from './EditableZones'
import Charm from './Charm'
import { CHARM_SIZE } from '../../lib/charmZones'

const CrocBoard = forwardRef(function CrocBoard(
  { charms, placement, zones, setZones, debug = false, shoeShakeKey = 0 },
  ref,
) {
  const { setNodeRef: setBoardRef } = useDroppable({ id: 'board' })
  const imgRef = useRef(null)

  const setRefs = (el) => {
    setBoardRef(el)
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  // Replay a tiny shake on the shoe whenever the snap key changes. Web
  // Animations API lets us re-trigger the same animation as many times as
  // we like without React having to remount the <img>.
  useEffect(() => {
    if (debug || shoeShakeKey === 0) return
    const el = imgRef.current
    if (!el || typeof el.animate !== 'function') return
    el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-1.2px)', offset: 0.2 },
        { transform: 'translateX(0.9px)', offset: 0.5 },
        { transform: 'translateX(-0.4px)', offset: 0.8 },
        { transform: 'translateX(0)' },
      ],
      { duration: 200, easing: 'ease-out' },
    )
  }, [shoeShakeKey, debug])

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
        ref={imgRef}
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
                  'linear-gradient(to bottom, #000 50%, transparent 75%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, #000 50%, transparent 75%)',
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
              className={`absolute ${charm.justSnapped ? 'animate-charm-snap' : ''}`}
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
