import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { positionAfter } from '../utils/ordering'

export function useScenes(timelineId, userId) {
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!timelineId) return

    let cancelled = false

    async function fetchScenes() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('timeline_id', timelineId)
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
  }, [timelineId])

  async function createScene({ title, description }) {
    const previous = scenes
    const lastPosition = scenes.at(-1)?.position ?? null
    const optimistic = {
      id: crypto.randomUUID(),
      timeline_id: timelineId,
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
        timeline_id: timelineId,
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

  async function reorderScene(id, newPosition, newOrder) {
    const previous = scenes
    setScenes(newOrder)
    setError('')

    const { error } = await supabase
      .from('scenes')
      .update({ position: newPosition })
      .eq('id', id)
    if (error) {
      setScenes(previous)
      setError(error.message)
    }
  }

  return { scenes, loading, error, createScene, updateScene, deleteScene, reorderScene }
}
