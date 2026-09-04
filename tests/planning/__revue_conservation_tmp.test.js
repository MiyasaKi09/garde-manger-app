import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { isBatchCandidate, recipePlanningProfile } from '@/lib/domain/planning/recipePlanningProfile'

const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
const recipes = getCanonicalRecipes({ servings: 2 })
const byCode = new Map(recipes.map((r) => [r.code, r]))
const semaine = (debut) => generateClosedLoopPlan({
  slots: buildWeekSlots(debut),
  recipes,
  inventoryLots: [],
  constraints: {
    allowShopping: true,
    targetByMeal: { dejeuner: TARGET, diner: TARGET },
    maxMinutesByMeal: { dejeuner: 120, diner: 240 },
    preferredActiveMinutes: 30,
  },
  beamWidth: 48,
})

describe('revue', () => {
  it('audite trois semaines', () => {
    const lignes = []
    for (const debut of ['2026-09-07', '2026-09-14', '2026-09-21']) {
      const plan = semaine(debut)
      const prods = plan.slots.filter((s) => s.production)
      lignes.push(`SEMAINE ${debut} status=${plan.status} slots=${plan.slots.length} productions=${prods.length}`)
      for (const s of prods) {
        const r = byCode.get(s.recipeCode)
        const p = r.conservationProfile
        lignes.push(`  ${s.recipeCode} ${r.family} | ${JSON.stringify(p)} | from=${s.production.availableFrom} useBy=${s.production.useBy} consumers=${(s.production.consumerSlotKeys || []).join(',')} nextWeek=${s.production.nextWeekPortions || 0}`)
        lignes.push(`     prose: ${(r.conservation || '').slice(0, 220)}`)
      }
      lignes.push(`  panbagnat SRC-017-D4 dans le plan : ${plan.slots.some((s) => s.recipeCode === 'SRC-017-D4')}`)
    }
    // statistiques corpus
    const cand = recipes.filter(isBatchCandidate)
    lignes.push(`\ncorpus publiable=${recipes.length} candidats batch=${cand.length}`)
    const froidNonDeclare = recipes.filter((r) => r.conservationProfile?.serveCold == null
      && /salade|taboul|carpaccio|gaspacho|gazpacho|rillette|tartare|terrine|vinaigrette|houmous|tapenade|rapees|crudite|sandwich|wrap/i.test(`${r.family} ${r.category || ''}`))
    lignes.push(`froid probable sans serve_cold déclaré : ${froidNonDeclare.length}`)
    lignes.push(froidNonDeclare.filter(isBatchCandidate).map((r) => `${r.code} ${r.family} (${r.conservationProfile?.fridgeHours}h, candidat batch)`).join('\n'))
    writeFileSync('/tmp/claude-0/-home-user-garde-manger-app/4641d636-b9e8-51d6-bd3f-504fefba62b7/scratchpad/rev/semaine.txt', lignes.join('\n'))
    expect(true).toBe(true)
  }, 120000)
})
