'use client'

import { useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'
import { supabase } from '@/lib/supabaseClient'

// Préchargement prédictif : une fois l'app au repos, on réchauffe en arrière-plan
// les données partagées les plus lourdes (le plan de la semaine, utilisé par
// Planning ET Courses) + les objectifs nutrition. Ainsi la 1ère navigation vers
// ces pages est instantanée, même si on n'est pas passé par l'accueil.
// S'appuie sur le cache de authFetch (dédupliqué + persisté) ; ne s'exécute
// qu'une fois par session et seulement si connecté.
let warmed = false

export default function CacheWarmer() {
  useEffect(() => {
    if (warmed) return
    warmed = true

    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        await Promise.allSettled([
          (async () => {
            const r = await authFetch('/api/planning/imports')
            const d = await r.json().catch(() => ({}))
            const latest = d?.imports?.[0]
            if (latest?.id) await authFetch(`/api/planning/imports/${latest.id}`)
          })(),
          authFetch('/api/nutrition/goals'),
        ])
      } catch { /* best-effort, silencieux */ }
    }

    const idle = (typeof window !== 'undefined' && window.requestIdleCallback)
      ? window.requestIdleCallback
      : (cb) => setTimeout(cb, 800)
    idle(() => { run() })
  }, [])

  return null
}
