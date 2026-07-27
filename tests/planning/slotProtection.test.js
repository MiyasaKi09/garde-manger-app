import { describe, expect, it } from 'vitest'
import { slotProtectionState } from '@/lib/domain/planning/slotProtection'

// « Quand je change les repas de la semaine, tout ne change pas. Je voudrais
// que tout change tant que ce n'est pas coché comme mangé. »
//
// Une règle « servi dans moins de 48 h » gelait les créneaux imminents. Lancée
// un lundi soir, la régénération n'en recalculait que huit sur quatorze, et les
// six gelés échappaient aux règles de répétition — d'où le même plat au
// déjeuner et au dîner du même jour.

const slot = (overrides = {}) => ({
  id: 'slot-1', slot_key: '2026-07-27-dejeuner', meal_date: '2026-07-27',
  meal_type: 'dejeuner', status: 'planned', locked: false, ...overrides,
})

describe('slotProtectionState — ce qu’une régénération peut réécrire', () => {
  it('ne protège pas un repas imminent tant qu’il n’est pas mangé', () => {
    // Le dîner de ce soir : remplaçable jusqu'à ce qu'il soit coché.
    const state = slotProtectionState(slot({ meal_type: 'diner' }), [], [])
    expect(state).toMatchObject({ protected: false, consumed: false, locked: false, protection_reason: null })
  })

  it('protège un repas mangé', () => {
    for (const status of ['consumed', 'completed', 'cooked', 'skipped']) {
      expect(slotProtectionState(slot({ status }), [], [])).toMatchObject({
        protected: true, consumed: true, protection_reason: 'consumed',
      })
    }
  })

  it('protège un repas dont la préparation est faite', () => {
    // Le plat existe déjà : le remplacer reviendrait à jeter le travail.
    const done = [{ meal_plan_slot_id: 'slot-1', done: true }]
    expect(slotProtectionState(slot(), [], done)).toMatchObject({ protected: true, consumed: true })
    const workflow = [{ meal_plan_slot_id: 'slot-1', workflow_status: 'done' }]
    expect(slotProtectionState(slot(), [], workflow)).toMatchObject({ protected: true, consumed: true })
    // Une tâche d'un AUTRE créneau ne protège pas celui-ci.
    expect(slotProtectionState(slot(), [], [{ meal_plan_slot_id: 'slot-2', done: true }]).protected).toBe(false)
  })

  it('protège un repas explicitement épinglé, par le créneau ou par le repas', () => {
    expect(slotProtectionState(slot({ locked: true }), [], [])).toMatchObject({
      protected: true, locked: true, consumed: false, protection_reason: 'locked',
    })
    const lockedMeal = [{ meal_plan_slot_id: 'slot-1', locked: true }]
    expect(slotProtectionState(slot(), lockedMeal, [])).toMatchObject({ protected: true, locked: true })
  })

  it('libère toute une semaine dont rien n’est coché', () => {
    // Le cas signalé : quatorze créneaux principaux, aucun mangé, aucun épinglé
    // → quatorze recalculés, pas huit.
    const week = Array.from({ length: 7 }, (_, day) => ['dejeuner', 'diner'].map((mealType) => slot({
      id: `slot-${day}-${mealType}`,
      slot_key: `2026-07-2${7 + day}-${mealType}`,
      meal_date: `2026-07-${27 + day}`,
      meal_type: mealType,
    }))).flat()
    const free = week.filter((item) => !slotProtectionState(item, [], []).protected)
    expect(free).toHaveLength(14)
  })

  it('ne protège que les créneaux cochés quand une partie de la semaine est mangée', () => {
    const week = [
      slot({ id: 'a', status: 'consumed' }),
      slot({ id: 'b', meal_type: 'diner' }),
      slot({ id: 'c', meal_date: '2026-07-28', locked: true }),
      slot({ id: 'd', meal_date: '2026-07-28', meal_type: 'diner' }),
    ]
    const states = week.map((item) => slotProtectionState(item, [], []))
    expect(states.map((state) => state.protected)).toEqual([true, false, true, false])
    expect(states.map((state) => state.protection_reason)).toEqual(['consumed', null, 'locked', null])
  })
})
