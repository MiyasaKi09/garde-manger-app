import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

// Ce fichier utilisait `node:test` : vitest le chargeait sans y trouver la
// moindre suite et échouait sur « No test suite found », laissant `npm test`
// rouge en permanence. Mêmes assertions, exprimées avec le runner du projet.
describe('planning mobile', () => {
  it('la navigation de semaine et l’action restent visibles sur mobile', () => {
    const page = readFileSync('app/planning/page.js', 'utf8')
    const css = readFileSync('app/planning/PlanningDashboard.css', 'utf8')

    expect(page).toMatch(/planning-mobile-weekbar/)
    expect(page).toMatch(/Semaine précédente/)
    expect(page).toMatch(/Semaine suivante/)
    expect(page).toMatch(/Préparer cette semaine/)
    expect(page).toMatch(/Modifier cette semaine/)
    expect(css).toMatch(/@media \(max-width: 880px\)[\s\S]*\.planning-mobile-weekbar[\s\S]*display: grid/)
    expect(css).toMatch(/\.planning-mobile-week-arrow[\s\S]*height: 48px/)
    expect(css).toMatch(/\.planning-mobile-week-action[\s\S]*min-height: 48px/)
  })
})
