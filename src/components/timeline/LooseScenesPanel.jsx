import { verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SceneList } from './SceneList'

// Persistent side panel (SPEC.md 2.6) — always visible so it's always a valid
// drag target, holding scenes with no timeline yet.
export function LooseScenesPanel({ scenes, onCreateScene, onUpdateScene, onDeleteScene }) {
  return (
    <aside className="loose-panel">
      <h2 className="timeline-row-name">Loose Scenes</h2>
      <SceneList
        scenes={scenes}
        containerId={null}
        strategy={verticalListSortingStrategy}
        orientation="vertical"
        onCreate={onCreateScene}
        onUpdate={onUpdateScene}
        onDelete={onDeleteScene}
      />
    </aside>
  )
}
