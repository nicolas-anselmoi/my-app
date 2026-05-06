import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CHARM_SIZE } from '../../lib/charmZones'

export default function Charm({ id, src, style, className = '' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    width: CHARM_SIZE,
    height: CHARM_SIZE,
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    zIndex: isDragging ? 50 : 1,
    ...style,
  }

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`select-none ${className}`}
      {...listeners}
      {...attributes}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="w-full h-full object-contain pointer-events-none drop-shadow-md"
      />
    </div>
  )
}
