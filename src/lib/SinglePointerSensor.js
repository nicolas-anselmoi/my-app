// dnd-kit's PointerSensor listens for pointermove/pointerup on the document
// without filtering by pointerId. When a 2nd finger touches the screen while
// dragging, its movements also update the drag, so the charm appears to jump
// between fingers. SinglePointerSensor wraps PointerSensor and ignores any
// pointer event whose pointerId doesn't match the one that started the drag.

import { PointerSensor } from '@dnd-kit/core'

export class SinglePointerSensor extends PointerSensor {
  handleMove(event) {
    if (
      event &&
      event.pointerId !== undefined &&
      event.pointerId !== this.props.event.pointerId
    ) {
      return
    }
    super.handleMove(event)
  }

  handleEnd(event) {
    if (
      event &&
      event.pointerId !== undefined &&
      event.pointerId !== this.props.event.pointerId
    ) {
      return
    }
    super.handleEnd()
  }

  handleCancel(event) {
    if (
      event &&
      event.pointerId !== undefined &&
      event.pointerId !== this.props.event.pointerId
    ) {
      return
    }
    super.handleCancel()
  }
}

SinglePointerSensor.activators = PointerSensor.activators
