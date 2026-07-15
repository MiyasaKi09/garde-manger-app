const signalKey = (item) => String(item?.s?.expiringName || 'sans-signal').trim().toLocaleLowerCase('fr-FR')

/**
 * Keeps the anti-waste area useful when one expiring ingredient matches many
 * recipes. Recommendations remain score-ordered, but a single signal cannot
 * monopolise the page.
 */
export function selectDiverseAntiWaste(items = [], { limit = 9, maxPerSignal = 3 } = {}) {
  const selected = []
  const signalCounts = new Map()

  for (const item of items) {
    if (selected.length >= limit) break
    const key = signalKey(item)
    const count = signalCounts.get(key) || 0
    if (count >= maxPerSignal) continue
    signalCounts.set(key, count + 1)
    selected.push(item)
  }

  return selected
}

export function limitRecipePreview(items = [], limit = 9) {
  return items.slice(0, Math.max(0, limit))
}
