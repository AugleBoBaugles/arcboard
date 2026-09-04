import { useState } from 'react'
import { useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SceneList } from './SceneList'

export function TimelineRow({
  timeline,
  scenes,
  onRename,
  onDelete,
  onCreateScene,
  onUpdateScene,
  onDeleteScene,
}) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(timeline.name)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: timeline.id, data: { type: 'timeline' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function handleRenameSubmit(event) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onRename(timeline.id, trimmed)
    setRenaming(false)
  }

  return (
    <section className="timeline-row" ref={setNodeRef} style={style}>
      <div className="timeline-row-header">
        <div className="timeline-row-drag-handle" {...attributes} {...listeners}>
          ⠿
        </div>

        {renaming ? (
          <form className="scene-form" onSubmit={handleRenameSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
            <div className="scene-form-actions">
              <button type="submit">Save</button>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setName(timeline.name)
                  setRenaming(false)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <h2 className="timeline-row-name">{timeline.name}</h2>
        )}

        <div className="scene-card-actions">
          <button type="button" className="link-button" onClick={() => setRenaming(true)}>
            Rename
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              if (
                window.confirm(
                  `Delete timeline "${timeline.name}"? Its scenes will move to Loose Scenes.`,
                )
              ) {
                onDelete(timeline.id)
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <SceneList
        scenes={scenes}
        containerId={timeline.id}
        strategy={horizontalListSortingStrategy}
        onCreate={onCreateScene}
        onUpdate={onUpdateScene}
        onDelete={onDeleteScene}
      />
    </section>
  )
}
