import { useState } from 'react'
import { CHARM_SIZE } from '../../lib/charmZones'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const round1 = (v) => Math.round(v * 10) / 10

export default function EditableZones({ zones, setZones, boardRef }) {
  const [activeId, setActiveId] = useState(null)

  function handlePointerDown(e, zoneId) {
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    setActiveId(zoneId)

    function update(ev) {
      const board = boardRef.current
      if (!board) return
      const rect = board.getBoundingClientRect()
      const x = clamp(((ev.clientX - rect.left) / rect.width) * 100, 0, 100)
      const y = clamp(((ev.clientY - rect.top) / rect.height) * 100, 0, 100)
      setZones((prev) =>
        prev.map((z) =>
          z.id === zoneId ? { ...z, x: round1(x), y: round1(y) } : z,
        ),
      )
    }

    function onMove(ev) {
      ev.preventDefault()
      update(ev)
    }
    function onUp(ev) {
      try {
        target.releasePointerCapture(ev.pointerId)
      } catch {}
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
      setActiveId(null)
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
    target.addEventListener('pointercancel', onUp)
  }

  return zones.map((z, i) => {
    const selected = activeId === z.id
    return (
      <div
        key={z.id}
        onPointerDown={(e) => handlePointerDown(e, z.id)}
        className="absolute select-none flex items-center justify-center font-semibold"
        style={{
          left: `${z.x}%`,
          top: `${z.y}%`,
          width: CHARM_SIZE,
          height: CHARM_SIZE,
          transform: 'translate(-50%, -50%)',
          borderRadius: '9999px',
          outline: selected
            ? '3px solid rgb(34,197,94)'
            : '2px dashed rgba(59,130,246,0.85)',
          background: 'rgba(59,130,246,0.18)',
          color: 'rgb(29,78,216)',
          fontSize: 12,
          cursor: selected ? 'grabbing' : 'grab',
          touchAction: 'none',
          zIndex: selected ? 30 : 20,
        }}
      >
        {i + 1}
      </div>
    )
  })
}
