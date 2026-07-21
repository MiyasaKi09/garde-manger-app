import { describe, expect, it } from 'vitest'
import {
  dateIsoInTimeZone,
  nextMondayIsoInTimeZone,
  normalizeTimeZone,
  resolveHouseholdTimeZone,
  zonedDateTimeToUtc,
} from '@/lib/domain/planning/planningTime'

describe('horaires du planning dans le fuseau du foyer', () => {
  it('convertit les heures murales avec l’heure d’été et l’heure d’hiver', () => {
    expect(zonedDateTimeToUtc('2026-07-21', '12:30:00', 'Europe/Paris').toISOString())
      .toBe('2026-07-21T10:30:00.000Z')
    expect(zonedDateTimeToUtc('2026-12-21', '12:30:00', 'Europe/Paris').toISOString())
      .toBe('2026-12-21T11:30:00.000Z')
  })

  it('calcule le jour et le prochain lundi dans le fuseau du foyer', () => {
    const instant = new Date('2026-07-19T22:30:00.000Z')
    expect(dateIsoInTimeZone(instant, 'Europe/Paris')).toBe('2026-07-20')
    expect(nextMondayIsoInTimeZone(instant, 'Europe/Paris')).toBe('2026-07-27')
    expect(nextMondayIsoInTimeZone(instant, 'UTC')).toBe('2026-07-20')
  })

  it('lit le fuseau du compte ou des préférences sans accepter une zone invalide', () => {
    expect(resolveHouseholdTimeZone({ user_metadata: { timezone: 'America/Montreal' } }, [])).toBe('America/Montreal')
    expect(resolveHouseholdTimeZone({}, [{ preferences: { planning: { timezone: 'Europe/London' } } }])).toBe('Europe/London')
    expect(normalizeTimeZone('Fuseau/Invalide')).toBe('Europe/Paris')
  })
})
