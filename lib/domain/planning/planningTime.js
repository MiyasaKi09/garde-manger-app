export const DEFAULT_HOUSEHOLD_TIME_ZONE = 'Europe/Paris'

export function normalizeTimeZone(value, fallback = DEFAULT_HOUSEHOLD_TIME_ZONE) {
  const candidate = String(value || '').trim()
  if (!candidate) return fallback
  try {
    new Intl.DateTimeFormat('en', { timeZone: candidate }).format(new Date(0))
    return candidate
  } catch {
    return fallback
  }
}

export function resolveHouseholdTimeZone(user = {}, members = []) {
  const memberZone = (members || []).map((member) => (
    member?.preferences?.planning?.timezone || member?.preferences?.timezone
  )).find(Boolean)
  return normalizeTimeZone(
    user?.user_metadata?.timezone
      || user?.app_metadata?.timezone
      || memberZone,
  )
}

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
}

export function dateIsoInTimeZone(now = new Date(), timeZone = DEFAULT_HOUSEHOLD_TIME_ZONE) {
  const parts = zonedParts(now, normalizeTimeZone(timeZone))
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

/** Convertit une heure murale du foyer en instant UTC, DST compris. */
export function zonedDateTimeToUtc(dateIso, localTime, timeZone = DEFAULT_HOUSEHOLD_TIME_ZONE) {
  const zone = normalizeTimeZone(timeZone)
  const [year, month, day] = String(dateIso).split('-').map(Number)
  const [hour, minute, second = 0] = String(localTime).split(':').map(Number)
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  let instant = new Date(wallClockUtc)

  // Deux passages résolvent l'offset avant/après changement d'heure. Un
  // troisième stabilise aussi les zones dont le décalage n'est pas entier.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = zonedParts(instant, zone)
    const representedUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    const offsetMs = representedUtc - instant.getTime()
    const next = new Date(wallClockUtc - offsetMs)
    if (next.getTime() === instant.getTime()) break
    instant = next
  }
  return instant
}

export function nextMondayIsoInTimeZone(now = new Date(), timeZone = DEFAULT_HOUSEHOLD_TIME_ZONE) {
  const date = new Date(`${dateIsoInTimeZone(now, timeZone)}T00:00:00Z`)
  const day = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() + (day === 0 ? 1 : 8 - day))
  return date.toISOString().slice(0, 10)
}
