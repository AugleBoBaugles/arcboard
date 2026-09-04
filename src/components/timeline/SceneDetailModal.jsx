import { useState } from 'react'
import { SCENE_STATUSES } from '../../utils/sceneFields'

export function SceneDetailModal({ scene, onUpdate, onClose }) {
  const [title, setTitle] = useState(scene.title ?? '')
  const [description, setDescription] = useState(scene.description ?? '')
  const [notes, setNotes] = useState(scene.notes ?? '')
  const [tone, setTone] = useState(scene.tone ?? '')
  const [status, setStatus] = useState(scene.status ?? 'idea')
  const [tagsText, setTagsText] = useState((scene.tags ?? []).join(', '))

  // This modal isn't rendered through a portal, so it's still a DOM child of
  // the scene card underneath it — a keydown here would otherwise bubble up
  // into the card's own onKeyDown (which treats Enter as "open the modal"),
  // fighting with the form's native submit-on-Enter. Stopping it here keeps
  // the two isolated; Escape is handled in the same place since it needs the
  // same containment.
  function handleKeyDown(event) {
    event.stopPropagation()
    if (event.key === 'Escape') onClose()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) return
    onUpdate(scene.id, {
      title: title.trim(),
      description,
      notes,
      tone: tone.trim() || null,
      status,
      tags: tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Scene details"
        onClick={(e) => e.stopPropagation()}
      >
        <form className="scene-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <label>
            Notes (continuity, dialogue)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>
          <label>
            Tone
            <input type="text" value={tone} onChange={(e) => setTone(e.target.value)} />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {SCENE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tags (comma-separated)
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </label>
          <div className="scene-form-actions">
            <button type="submit">Save</button>
            <button type="button" className="link-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
