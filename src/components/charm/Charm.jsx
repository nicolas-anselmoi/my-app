import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CHARM_SIZE } from '../../lib/charmZones'

export default function Charm({
  id,
  src,
  scale = 1,
  rotation = 0,
  style,
  className = '',
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id })

  // Layer the user's pinch/rotate on top of dnd-kit's drag translate.
  const dragTranslate = CSS.Translate.toString(transform) || ''
  const userTransform =
    scale !== 1 || rotation !== 0
      ? `scale(${scale}) rotate(${rotation}deg)`
      : ''
  const finalTransform =
    [dragTranslate, userTransform].filter(Boolean).join(' ') || undefined

  const dragStyle = {
    transform: finalTransform,
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
