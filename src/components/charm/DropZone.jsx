import { useDroppable } from '@dnd-kit/core'
import { CHARM_SIZE } from '../../lib/charmZones'

export default function DropZone({ zone, occupied, debug }) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${zone.id}` })

  const size = CHARM_SIZE
  return (
    <div
      ref={setNodeRef}
      className="absolute rounded-full"
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        outline: debug
          ? '2px dashed rgba(59,130,246,0.7)'
          : isOver
            ? '2px solid rgba(34,197,94,0.9)'
            : 'none',
        background: debug ? 'rgba(59,130,246,0.15)' : 'transparent',
        pointerEvents: occupied ? 'none' : 'auto',
      }}
    />
  )
}
