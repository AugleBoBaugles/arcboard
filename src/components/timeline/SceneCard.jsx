import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SceneForm } from './SceneForm'

export function SceneCard({ scene, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (editing) {
    return (
      <div className="scene-card" ref={setNodeRef} style={style}>
        <SceneForm
          initialValues={scene}
          onSubmit={(values) => {
            onUpdate(scene.id, values)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="scene-card" ref={setNodeRef} style={style}>
      <div className="scene-card-drag-handle" {...attributes} {...listeners}>
        ⠿
      </div>
      <span className="scene-card-status">{scene.status}</span>
      <h3>{scene.title}</h3>
      {scene.description && <p>{scene.description}</p>}
      <div className="scene-card-actions">
        <button type="button" className="link-button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            if (window.confirm(`Delete scene "${scene.title}"?`)) {
              onDelete(scene.id)
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
