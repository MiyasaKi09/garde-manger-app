// useStockCoverage.js
// Hook : charge la couverture stock d'un import et l'expose par meal id.
// Erreurs silencieuses (réseau, API non encore disponible) — retourne {} en cas d'échec.
'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'

/**
 * @param {string|null} importId  L'id de l'import de la semaine affichée.
 * @returns {{ coverageByMeal: Object.<string,{status,have,need,missing,staplesMissing,reason}>, summary: {full,partial,none,unknown}, loading: boolean }}
 */
export default function useStockCoverage(importId) {
  const [coverageByMeal, setCoverageByMeal] = useState({})
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!importId) {
      setCoverageByMeal({})
      setSummary({})
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    ;(async () => {
      try {
        const res = await authFetch(`/api/planning/${importId}/stock-coverage`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setCoverageByMeal(data.meals || {})
          setSummary(data.summary || {})
        }
      } catch {
        // Erreur silencieuse : l'endpoint peut ne pas encore être disponible.
        if (!cancelled) {
          setCoverageByMeal({})
          setSummary({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [importId])

  return { coverageByMeal, summary, loading }
}
