import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { SceneCard } from './SceneCard'
import { SceneForm } from './SceneForm'
import { positionBetween } from '../../utils/ordering'

export function SceneList({ scenes, onCreate, onUpdate, onDelete, onReorder }) {
  const [adding, setAdding] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = scenes.findIndex((s) => s.id === active.id)
    const newIndex = scenes.findIndex((s) => s.id === over.id)
    const newOrder = arrayMove(scenes, oldIndex, newIndex)

    const movedIndex = newOrder.findIndex((s) => s.id === active.id)
    const prevPosition = newOrder[movedIndex - 1]?.position ?? null
    const nextPosition = newOrder[movedIndex + 1]?.position ?? null
    const newPosition = positionBetween(prevPosition, nextPosition)

    const updatedOrder = newOrder.map((scene) =>
      scene.id === active.id ? { ...scene, position: newPosition } : scene,
    )

    onReorder(active.id, newPosition, updatedOrder)
  }

  return (
    <div className="scene-list-wrapper">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={scenes.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="scene-list">
            {scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
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
      </DndContext>
    </div>
  )
}
