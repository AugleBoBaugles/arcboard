import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { SceneCard } from './SceneCard'
import { SceneForm } from './SceneForm'

// A single scene container — either one timeline's row or the Loose Scenes
// panel. Agnostic of which: the parent supplies containerId (null for Loose
// Scenes), the sort orientation, and an onCreate already bound to the right
// timeline. Drag-and-drop across containers is orchestrated one level up in
// Board.jsx (the single DndContext); this component just needs to register
// itself as a drop target so an empty container is still droppable.
export function SceneList({
  scenes,
  containerId,
  strategy,
  orientation = 'horizontal',
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [adding, setAdding] = useState(false)
  const { setNodeRef } = useDroppable({
    id: `container:${containerId ?? 'loose'}`,
    data: { type: 'container', timelineId: containerId ?? null },
  })

  const isVertical = orientation === 'vertical'
  const wrapperClassName = isVertical
    ? 'scene-list-wrapper scene-list-wrapper--vertical'
    : 'scene-list-wrapper'
  const listClassName = isVertical ? 'scene-list scene-list--vertical' : 'scene-list'

  return (
    <div className={wrapperClassName} ref={setNodeRef}>
      <SortableContext items={scenes.map((s) => s.id)} strategy={strategy}>
        <div className={listClassName}>
          {scenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
          {adding ? (
            <div className="scene-card scene-card-new">
              <SceneForm
                onSubmit={(values) => {
                  onCreate(values)
                  setAdding(false)
                }}
                onCancel={() => setAdding(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              className="add-scene-button"
              onClick={() => setAdding(true)}
            >
              + Add scene
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
