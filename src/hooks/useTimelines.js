import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Gets the user's first timeline, creating a default one if none exists yet.
// There's no "create timeline" UI in Step 1 — that arrives with multi-timeline support.
export function useTimelines(userId) {
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function getOrCreateDefaultTimeline() {
      setLoading(true)
      setError('')

      const { data: existing, error: selectError } = await supabase
        .from('timelines')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (selectError) {
        setError(selectError.message)
        setLoading(false)
        return
      }

      if (existing) {
        setTimeline(existing)
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
        setTimeline(created)
      }
      setLoading(false)
    }

    getOrCreateDefaultTimeline()

    return () => {
      cancelled = true
    }
  }, [userId])

  return { timeline, loading, error }
}
