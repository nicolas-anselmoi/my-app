import { useDroppable } from '@dnd-kit/core'
import { CHARM_SIZE } from '../../lib/charmZones'

export default function DropZone({ zone, occupied, debug }) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${zone.id}` })

  return (
    <div
      ref={setNodeRef}
      className="absolute rounded-full"
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: CHARM_SIZE,
        height: CHARM_SIZE,
        transform: 'translate(-50%, -50%)',
        outline: debug ? '2px dashed rgba(59,130,246,0.7)' : 'none',
        background: debug ? 'rgba(59,130,246,0.15)' : 'transparent',
        pointerEvents: occupied ? 'none' : 'auto',
      }}
    >
      {!debug && isOver && (
        <div
          className="absolute rounded-full"
          style={{
            inset: '26%',
            background: 'rgba(92,184,122,0.18)',
            border: '1.5px solid rgba(92,184,122,0.45)',
          }}
        />
      )}
    </div>
  )
}
