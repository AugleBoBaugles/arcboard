import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { positionAfter } from '../utils/ordering'

// Fetches every timeline the user has, ordered for vertical stacking. If the
// user has none yet (first run), creates a default one so the board isn't
// empty on first login.
export function useTimelines(userId) {
  const [timelines, setTimelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function fetchOrCreateDefault() {
      setLoading(true)
      setError('')

      const { data: existing, error: selectError } = await supabase
        .from('timelines')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })

      if (cancelled) return

      if (selectError) {
        setError(selectError.message)
        setLoading(false)
        return
      }

      if (existing.length > 0) {
        setTimelines(existing)
        setLoading(false)
        return
      }

      const { data: created, error: insertError } = await supabase
        .from('timelines')
        .insert({ user_id: userId, name: 'Main Timeline', position: 0 })
        .select()
        .single()

      if (cancelled) return

      if (insertError) {
        setError(insertError.message)
      } else {
        setTimelines([created])
      }
      setLoading(false)
    }

    fetchOrCreateDefault()

    return () => {
      cancelled = true
    }
  }, [userId])

  async function createTimeline(name) {
    const previous = timelines
    const lastPosition = timelines.at(-1)?.position ?? null
    const optimistic = {
      id: crypto.randomUUID(),
      user_id: userId,
      name,
      position: positionAfter(lastPosition),
    }
    setTimelines([...previous, optimistic])
    setError('')

    const { data, error } = await supabase
      .from('timelines')
      .insert({ user_id: userId, name, position: optimistic.position })
      .select()
      .single()

    if (error) {
      setTimelines(previous)
      setError(error.message)
      return
    }
    setTimelines((current) =>
      current.map((timeline) => (timeline.id === optimistic.id ? data : timeline)),
    )
  }

  async function renameTimeline(id, name) {
    const previous = timelines
    setTimelines((current) =>
      current.map((timeline) => (timeline.id === id ? { ...timeline, name } : timeline)),
    )
    setError('')

    const { error } = await supabase.from('timelines').update({ name }).eq('id', id)
    if (error) {
      setTimelines(previous)
      setError(error.message)
    }
  }

  async function deleteTimeline(id) {
    const previous = timelines
    setTimelines((current) => current.filter((timeline) => timeline.id !== id))
    setError('')

    const { error } = await supabase.from('timelines').delete().eq('id', id)
    if (error) {
      setTimelines(previous)
      setError(error.message)
    }
  }

  async function reorderTimeline(id, newPosition, newOrder) {
    const previous = timelines
    setTimelines(newOrder)
    setError('')

    const { error } = await supabase
      .from('timelines')
      .update({ position: newPosition })
      .eq('id', id)
    if (error) {
      setTimelines(previous)
      setError(error.message)
    }
  }

  return {
    timelines,
    loading,
    error,
    createTimeline,
    renameTimeline,
    deleteTimeline,
    reorderTimeline,
  }
}
