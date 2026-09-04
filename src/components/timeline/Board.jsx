import { useRef, useState } from 'react'
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAuth } from '../../contexts/AuthContext'
import { useTimelines } from '../../hooks/useTimelines'
import { useScenes } from '../../hooks/useScenes'
import { positionBetween } from '../../utils/ordering'
import { TimelineRow } from './TimelineRow'
import { LooseScenesPanel } from './LooseScenesPanel'

// Only same-type droppables are valid collision targets for a drag — without
// this, closestCenter can match a scene being dragged against a timeline row
// (or vice versa) since both are registered in the same DndContext.
function typeAwareCollision(args) {
  const activeType = args.active.data.current?.type
  const droppableContainers = args.droppableContainers.filter((container) => {
    const type = container.data.current?.type
    return type === activeType || (activeType === 'scene' && type === 'container')
  })
  return closestCenter({ ...args, droppableContainers })
}

// Resolves what a scene is currently hovering over into a destination
// timeline (null = Loose Scenes) and, if hovering another scene, that
// scene's id (used to find an insertion index).
function resolveDestFromOver(over, scenesList) {
  if (!over) return null
  if (over.data.current?.type === 'container') {
    return { timelineId: over.data.current.timelineId ?? null, overSceneId: null }
  }
  if (over.data.current?.type === 'scene') {
    const overScene = scenesList.find((scene) => scene.id === over.id)
    if (!overScene) return null
    return { timelineId: overScene.timeline_id ?? null, overSceneId: over.id }
  }
  return null
}

export function Board() {
  const { user } = useAuth()
  const {
    timelines,
    loading: timelinesLoading,
    error: timelinesError,
    createTimeline,
    renameTimeline,
    deleteTimeline,
    reorderTimeline,
  } = useTimelines(user.id)
  const {
    scenes,
    scenesByTimeline,
    looseScenes,
    loading: scenesLoading,
    error: scenesError,
    createScene,
    updateScene,
    deleteScene,
    applyLiveMove,
    moveScene,
    unassignScenesFromTimeline,
    restoreScenes,
  } = useScenes(user.id)

  const [addingTimeline, setAddingTimeline] = useState(false)
  const [newTimelineName, setNewTimelineName] = useState('')

  // Snapshot of `scenes` taken at drag start, and whether this drag ever
  // crossed a container boundary — both needed to make onDragEnd/onDragCancel
  // correct (see the two branches in handleDragEnd below).
  const dragSnapshotRef = useRef(null)
  const crossedContainerRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart() {
    dragSnapshotRef.current = scenes
    crossedContainerRef.current = false
  }

  // Live visual feedback as a scene crosses from one container into another.
  // Same-container hovering is left alone — dnd-kit's SortableContext already
  // animates that case via transforms, no state change needed until drop.
  function handleDragOver(event) {
    const { active, over } = event
    if (active.data.current?.type !== 'scene') return

    const dest = resolveDestFromOver(over, scenes)
    if (!dest) return

    const activeScene = scenes.find((scene) => scene.id === active.id)
    if (!activeScene) return
    const sourceTimelineId = activeScene.timeline_id ?? null
    if (sourceTimelineId === dest.timelineId) return

    const destGroup = dest.timelineId ? scenesByTimeline(dest.timelineId) : looseScenes
    const destIndex = dest.overSceneId
      ? Math.max(
          destGroup.findIndex((scene) => scene.id === dest.overSceneId),
          0,
        )
      : destGroup.length

    crossedContainerRef.current = true
    applyLiveMove(active.id, dest.timelineId, destIndex)
  }

  function handleDragEnd(event) {
    const { active, over } = event

    if (active.data.current?.type === 'timeline') {
      if (over && over.data.current?.type === 'timeline' && active.id !== over.id) {
        const oldIndex = timelines.findIndex((t) => t.id === active.id)
        const newIndex = timelines.findIndex((t) => t.id === over.id)
        const newOrder = arrayMove(timelines, oldIndex, newIndex)
        const movedIndex = newOrder.findIndex((t) => t.id === active.id)
        const prevPosition = newOrder[movedIndex - 1]?.position ?? null
        const nextPosition = newOrder[movedIndex + 1]?.position ?? null
        const newPosition = positionBetween(prevPosition, nextPosition)
        const updatedOrder = newOrder.map((t) =>
          t.id === active.id ? { ...t, position: newPosition } : t,
        )
        reorderTimeline(active.id, newPosition, updatedOrder)
      }
      return
    }

    if (active.data.current?.type !== 'scene') return

    if (!over) {
      if (dragSnapshotRef.current) restoreScenes(dragSnapshotRef.current)
      return
    }

    if (crossedContainerRef.current) {
      // onDragOver already spliced this scene into its final destination
      // group/order — just read that back and persist it.
      const activeScene = scenes.find((scene) => scene.id === active.id)
      if (!activeScene) return
      const destTimelineId = activeScene.timeline_id ?? null
      const destGroup = destTimelineId ? scenesByTimeline(destTimelineId) : looseScenes
      const destIndex = destGroup.findIndex((scene) => scene.id === active.id)
      moveScene(active.id, destTimelineId, destIndex)
      return
    }

    // Same-container reorder: never went through onDragOver, so compute the
    // new order here the same way Step 1's single-list drag did.
    const dest = resolveDestFromOver(over, scenes)
    if (!dest) return
    const group = dest.timelineId ? scenesByTimeline(dest.timelineId) : looseScenes
    const oldIndex = group.findIndex((scene) => scene.id === active.id)
    const newIndex = dest.overSceneId
      ? group.findIndex((scene) => scene.id === dest.overSceneId)
      : group.length - 1
    if (oldIndex === -1 || oldIndex === newIndex) return
    const newOrder = arrayMove(group, oldIndex, newIndex)
    const movedIndex = newOrder.findIndex((scene) => scene.id === active.id)
    moveScene(active.id, dest.timelineId, movedIndex)
  }

  function handleDragCancel() {
    if (dragSnapshotRef.current) restoreScenes(dragSnapshotRef.current)
  }

  async function handleDeleteTimeline(id) {
    await deleteTimeline(id)
    unassignScenesFromTimeline(id)
  }

  function handleCreateTimelineSubmit(event) {
    event.preventDefault()
    const trimmed = newTimelineName.trim()
    if (!trimmed) return
    createTimeline(trimmed)
    setNewTimelineName('')
    setAddingTimeline(false)
  }

  if (timelinesLoading || scenesLoading) {
    return <div className="centered-message">Loading your board…</div>
  }

  const error = timelinesError || scenesError

  return (
    <main className="board">
      {error && <p className="form-error">{error}</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={typeAwareCollision}
        // dnd-kit's drag auto-scroll was fighting the Loose Scenes panel
        // horizontally: a dragged card moves via CSS transform (not a DOM
        // reposition), and in most browsers a transformed element's
        // post-transform position still counts toward its ancestor's
        // scrollable area even when overflow is clipped — so dragging a card
        // away from the panel made it think it needed to scroll sideways to
        // "reveal" that phantom overflow. Zeroing the x threshold disables
        // horizontal auto-scroll specifically, without losing vertical
        // auto-scroll (useful once a timeline or the loose panel gets tall).
        autoScroll={{ threshold: { x: 0, y: 0.2 } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="board-layout">
          <div className="board-timelines">
            <SortableContext
              items={timelines.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {timelines.map((timeline) => (
                <TimelineRow
                  key={timeline.id}
                  timeline={timeline}
                  scenes={scenesByTimeline(timeline.id)}
                  onRename={renameTimeline}
                  onDelete={handleDeleteTimeline}
                  onCreateScene={(values) =>
                    createScene({ ...values, timelineId: timeline.id })
                  }
                  onUpdateScene={updateScene}
                  onDeleteScene={deleteScene}
                />
              ))}
            </SortableContext>

            {addingTimeline ? (
              <form className="scene-form" onSubmit={handleCreateTimelineSubmit}>
                <input
                  type="text"
                  value={newTimelineName}
                  onChange={(e) => setNewTimelineName(e.target.value)}
                  placeholder="Timeline name"
                  autoFocus
                  required
                />
                <div className="scene-form-actions">
                  <button type="submit">Save</button>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setNewTimelineName('')
                      setAddingTimeline(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="add-timeline-button"
                onClick={() => setAddingTimeline(true)}
              >
                + Add timeline
              </button>
            )}
          </div>

          <LooseScenesPanel
            scenes={looseScenes}
            onCreateScene={(values) => createScene({ ...values, timelineId: null })}
            onUpdateScene={updateScene}
            onDeleteScene={deleteScene}
          />
        </div>
      </DndContext>
    </main>
  )
}
