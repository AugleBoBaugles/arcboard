import { useState } from 'react'

export function SceneForm({ initialValues, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description })
  }

  return (
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
      <div className="scene-form-actions">
        <button type="submit">Save</button>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
