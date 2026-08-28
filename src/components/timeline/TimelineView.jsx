import { useAuth } from '../../contexts/AuthContext'
import { useTimelines } from '../../hooks/useTimelines'
import { useScenes } from '../../hooks/useScenes'
import { SceneList } from './SceneList'

export function TimelineView() {
  const { user } = useAuth()
  const { timeline, loading: timelineLoading, error: timelineError } =
    useTimelines(user.id)
  const {
    scenes,
    loading: scenesLoading,
    error: scenesError,
    createScene,
    updateScene,
    deleteScene,
    reorderScene,
  } = useScenes(timeline?.id, user.id)

  if (timelineLoading || (timeline && scenesLoading)) {
    return <div className="centered-message">Loading your board…</div>
  }

  const error = timelineError || scenesError

  return (
    <main className="board">
      <h1 className="timeline-name">{timeline?.name}</h1>
      {error && <p className="form-error">{error}</p>}
      <SceneList
        scenes={scenes}
        onCreate={createScene}
        onUpdate={updateScene}
        onDelete={deleteScene}
        onReorder={reorderScene}
      />
    </main>
  )
}
