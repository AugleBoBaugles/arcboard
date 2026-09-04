import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SceneDetailModal } from './SceneDetailModal'

export function SceneCard({ scene, onUpdate, onDelete }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: scene.id, data: { type: 'scene' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function openDetail() {
    setDetailOpen(true)
  }

  // dnd-kit's own keyboard handling (from `listeners`) uses Space to pick up
  // and drop a card — call it through first, then handle Enter ourselves to
  // open the modal, so the two don't fight over the same key.
  function handleKeyDown(event) {
    listeners?.onKeyDown?.(event)
    if (event.key === 'Enter') {
      openDetail()
    }
  }

  return (
    // The drag activators (attributes/listeners) are on the whole card, not
    // a separate handle — draggable from anywhere. A plain click still opens
    // the detail modal because the PointerSensor requires the pointer to
    // move a few pixels before it counts as a drag (see Board.jsx); Delete
    // stops its own click from bubbling here, so it doesn't also pop it open.
    <div
      className="scene-card"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
      onClick={openDetail}
    >
      <span className="scene-card-status">{scene.status}</span>
      <h3>{scene.title}</h3>
      {scene.description && <p>{scene.description}</p>}
      <div className="scene-card-actions">
        <button
          type="button"
          className="link-button"
          onClick={(event) => {
            event.stopPropagation()
            if (window.confirm(`Delete scene "${scene.title}"?`)) {
              onDelete(scene.id)
            }
          }}
        >
          Delete
        </button>
      </div>
      {detailOpen && (
        <SceneDetailModal
          scene={scene}
          onUpdate={onUpdate}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  )
}
