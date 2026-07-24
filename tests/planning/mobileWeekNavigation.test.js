import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

test('la navigation de semaine et l’action restent visibles sur mobile', () => {
  const page = readFileSync('app/planning/page.js', 'utf8')
  const css = readFileSync('app/planning/PlanningDashboard.css', 'utf8')

  assert.match(page, /planning-mobile-weekbar/)
  assert.match(page, /Semaine précédente/)
  assert.match(page, /Semaine suivante/)
  assert.match(page, /Préparer cette semaine/)
  assert.match(page, /Modifier cette semaine/)
  assert.match(css, /@media \(max-width: 880px\)[\s\S]*\.planning-mobile-weekbar[\s\S]*display: grid/)
  assert.match(css, /\.planning-mobile-week-arrow[\s\S]*height: 48px/)
  assert.match(css, /\.planning-mobile-week-action[\s\S]*min-height: 48px/)
})
