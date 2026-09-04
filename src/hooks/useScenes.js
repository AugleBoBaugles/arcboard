import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { positionAfter, positionBetween } from '../utils/ordering'

// Groups a flat scene list by timeline_id (null = Loose Scenes), each sorted by position.
function groupByTimeline(scenes) {
  const groups = new Map()
  for (const scene of scenes) {
    const key = scene.timeline_id ?? null
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(scene)
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.position - b.position)
  }
  return groups
}

// Fetches every scene belonging to the user (across all timelines, plus Loose
// Scenes) as one flat array — the single source of truth a cross-container
// drag needs so it can splice an item between groups live as it's dragged.
export function useScenes(userId) {
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function fetchScenes() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })

      if (cancelled) return

      if (error) {
        setError(error.message)
      } else {
        setScenes(data)
      }
      setLoading(false)
    }

    fetchScenes()

    return () => {
      cancelled = true
    }
  }, [userId])

  const grouped = useMemo(() => groupByTimeline(scenes), [scenes])
  const looseScenes = grouped.get(null) ?? []

  function scenesByTimeline(timelineId) {
    return grouped.get(timelineId) ?? []
  }

  async function createScene({ title, description, timelineId }) {
    const previous = scenes
    const group = grouped.get(timelineId ?? null) ?? []
    const lastPosition = group.at(-1)?.position ?? null
    const optimistic = {
      id: crypto.randomUUID(),
      timeline_id: timelineId ?? null,
      user_id: userId,
      title,
      description,
      position: positionAfter(lastPosition),
      tags: [],
      status: 'idea',
      notes: '',
      weight: null,
      color: null,
    }
    setScenes([...previous, optimistic])
    setError('')

    const { data, error } = await supabase
      .from('scenes')
      .insert({
        timeline_id: optimistic.timeline_id,
        user_id: userId,
        title,
        description,
        position: optimistic.position,
      })
      .select()
      .single()

    if (error) {
      setScenes(previous)
      setError(error.message)
      return
    }
    setScenes((current) =>
      current.map((scene) => (scene.id === optimistic.id ? data : scene)),
    )
  }

  async function updateScene(id, patch) {
    const previous = scenes
    setScenes((current) =>
      current.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)),
    )
    setError('')

    const { error } = await supabase.from('scenes').update(patch).eq('id', id)
    if (error) {
      setScenes(previous)
      setError(error.message)
    }
  }

  async function deleteScene(id) {
    const previous = scenes
    setScenes((current) => current.filter((scene) => scene.id !== id))
    setError('')

    const { error } = await supabase.from('scenes').delete().eq('id', id)
    if (error) {
      setScenes(previous)
      setError(error.message)
    }
  }

  // Local-only splice, no network call — used from onDragOver so a card
  // visually moves between containers as it's dragged, before the drop is
  // confirmed. destIndex is the position within the destination group's
  // current (already-live-spliced) order.
  function applyLiveMove(id, destTimelineId, destIndex) {
    setScenes((current) => {
      const moved = current.find((scene) => scene.id === id)
      if (!moved) return current
      const rest = current.filter((scene) => scene.id !== id)
      const destGroup = groupByTimeline(rest).get(destTimelineId ?? null) ?? []
      const updatedMoved = { ...moved, timeline_id: destTimelineId ?? null }
      destGroup.splice(destIndex, 0, updatedMoved)

      const otherScenes = rest.filter(
        (scene) => (scene.timeline_id ?? null) !== (destTimelineId ?? null),
      )
      return [...otherScenes, ...destGroup]
    })
  }

  // Used on drop: computes the real position from the destination group's
  // neighbors and persists both timeline_id and position together.
  async function moveScene(id, destTimelineId, destIndex) {
    const previous = scenes
    const destGroup = grouped.get(destTimelineId ?? null) ?? []
    const withoutMoved = destGroup.filter((scene) => scene.id !== id)
    const prevPosition = withoutMoved[destIndex - 1]?.position ?? null
    const nextPosition = withoutMoved[destIndex]?.position ?? null
    const newPosition = positionBetween(prevPosition, nextPosition)

    setScenes((current) =>
      current.map((scene) =>
        scene.id === id
          ? { ...scene, timeline_id: destTimelineId ?? null, position: newPosition }
          : scene,
      ),
    )
    setError('')

    const { error } = await supabase
      .from('scenes')
      .update({ timeline_id: destTimelineId ?? null, position: newPosition })
      .eq('id', id)
    if (error) {
      setScenes(previous)
      setError(error.message)
    }
  }

  // Local-only: mirrors the DB's `on delete set null` after a timeline is
  // deleted, so the Loose Scenes panel updates immediately without a refetch.
  function unassignScenesFromTimeline(timelineId) {
    setScenes((current) => {
      const moving = current
        .filter((scene) => scene.timeline_id === timelineId)
        .sort((a, b) => a.position - b.position)
      if (moving.length === 0) return current

      let lastLoosePosition = (grouped.get(null) ?? []).at(-1)?.position ?? null
      const movingIds = new Set(moving.map((scene) => scene.id))
      const reassigned = moving.map((scene) => {
        lastLoosePosition = positionAfter(lastLoosePosition)
        return { ...scene, timeline_id: null, position: lastLoosePosition }
      })

      return [
        ...current.filter((scene) => !movingIds.has(scene.id)),
        ...reassigned,
      ]
    })
  }

  // Restores a full snapshot taken before a drag started — used when a drag
  // is cancelled or dropped outside any valid target, so a live-spliced
  // (but never persisted) cross-container move doesn't stick in the UI.
  function restoreScenes(snapshot) {
    setScenes(snapshot)
  }

  return {
    scenes,
    scenesByTimeline,
    looseScenes,
    loading,
    error,
    createScene,
    updateScene,
    deleteScene,
    applyLiveMove,
    moveScene,
    unassignScenesFromTimeline,
    restoreScenes,
  }
}
