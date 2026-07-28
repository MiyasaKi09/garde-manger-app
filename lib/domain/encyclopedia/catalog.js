export const LIVE_METRIC_BY_VOLUME = {
  V01: 'food_concepts',
  V02: 'techniques',
  V03: 'preparations',
  V04: 'sauces',
  V05: 'accompaniments',
  V06: 'desserts',
  V07: 'breakfasts',
  V08: 'snacks',
  V09: 'beverages',
  V10: 'recipe_families',
}

const asMetricObject = (value) => {
  if (Array.isArray(value)) return value[0] || null
  if (value && typeof value === 'object') return value
  return null
}

const asFiniteNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function buildEncyclopediaView(manifest, index, liveValue = null) {
  const live = asMetricObject(liveValue)
  const snapshotByCode = new Map(index.coverage.map((entry) => [entry.code, entry]))

  const volumes = manifest.volumes.map((volume) => {
    const snapshot = snapshotByCode.get(volume.code) || {}
    const liveMetric = LIVE_METRIC_BY_VOLUME[volume.code] || null
    const liveCount = liveMetric && live
      ? asFiniteNumber(live[liveMetric])
      : null
    const snapshotCount = asFiniteNumber(snapshot.current_entries)
    const currentEntries = liveCount ?? snapshotCount
    const target = asFiniteNumber(
      volume.target_metric?.target ?? volume.target_metric?.minimum,
    )
    const progressPercent = target && currentEntries != null
      ? Math.min(100, Math.round((currentEntries / target) * 100))
      : null

    return {
      ...volume,
      current_entries: currentEntries,
      snapshot_entries: snapshotCount,
      live_metric: liveMetric,
      metric_source: liveCount == null ? 'snapshot' : 'supabase',
      target,
      progress_percent: progressPercent,
    }
  })

  return {
    contract_version: manifest.edition.contract_version,
    edition: manifest.edition,
    data_status: live ? 'live' : 'snapshot',
    generated_summary: index.summary,
    live_summary: live
      ? {
          food_concepts: asFiniteNumber(live.food_concepts),
          food_forms: asFiniteNumber(live.food_forms),
          commercial_products: asFiniteNumber(live.commercial_products),
          recipe_families: asFiniteNumber(live.recipe_families),
          recipe_versions: asFiniteNumber(live.recipe_versions),
          planning_ready: asFiniteNumber(live.planning_ready),
        }
      : null,
    volumes,
  }
}
