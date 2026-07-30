import { describe, expect, it } from 'vitest'
import { computeWeekReadiness } from '@/lib/domain/planning/readiness'

// Règle d'affichage P0-7 : un plan `review_required` doit afficher sa grille
// avec ses repas, pas l'écran vide « Cette semaine n'est pas encore dressée ».
// Le moteur de `page.js` utilise `effectiveImportId` (selectedImportId ||
// lastGeneratedImportId) pour décider de la vue : dès qu'un importId est connu,
// la grille est rendue même si `readiness.ready` est faux.
//
// Ces tests vérifient les invariants de la couche domaine qui instruisent
// cette logique, sans rendre de composants React.

/**
 * Simule la logique de `page.js` : quel affichage choisir ?
 *
 * @param {string|null} effectiveImportId  ID de l'import (null = aucun plan)
 * @param {'idle'|'loading'|'ready'|'error'} weekStatus
 * @returns {'empty'|'loading'|'error'|'grid'}
 */
function planningView(effectiveImportId, weekStatus) {
  if (!effectiveImportId) return 'empty'
  if (weekStatus === 'loading') return 'loading'
  if (weekStatus === 'error') return 'error'
  return 'grid'
}

describe('affichage du planning — règle P0-7 (review_required)', () => {
  it('un plan review_required avec importId connu → grille (pas l\'écran vide)', () => {
    // Cas reproduit : import 59, statut review_required, 14 repas en base.
    // L'écran vide ne doit jamais s'afficher quand effectiveImportId est défini.
    expect(planningView('import-59', 'ready')).toBe('grid')
  })

  it('sans importId → écran vide (aucun plan généré pour cette semaine)', () => {
    expect(planningView(null, 'idle')).toBe('empty')
  })

  it('importId présent mais chargement en cours → spinner, pas écran vide', () => {
    expect(planningView('import-59', 'loading')).toBe('loading')
  })

  it('importId présent mais erreur réseau → état erreur, pas écran vide', () => {
    expect(planningView('import-59', 'error')).toBe('error')
  })

  it('readiness.ready=false pour review_required ne retire pas la grille', () => {
    // `readiness` est affiché dans la bannière, mais n'empêche pas la grille.
    const readiness = computeWeekReadiness({
      expectedMeals: 14,
      uniqueMealCount: 14,
      prepTaskCount: 7,
      planStatus: 'review_required',
    })
    expect(readiness.ready).toBe(false)
    expect(readiness.reason).toBe('review_required')
    // La vue reste `grid` car effectiveImportId existe — readiness n'est
    // pas une condition d'accès à la grille.
    expect(planningView('import-59', 'ready')).toBe('grid')
  })

  it('effectiveImportId = selectedImportId || lastGeneratedImportId', () => {
    // Sans import dans la liste (cache stale), le fallback sur
    // lastGeneratedImportId suffit pour déclencher l'affichage.
    const selectedImportId = null       // cache HTTP retourne l'ancienne liste
    const lastGeneratedImportId = 59    // import créé par le dernier POST
    const effectiveImportId = selectedImportId || lastGeneratedImportId
    expect(planningView(String(effectiveImportId), 'ready')).toBe('grid')
  })
})

describe('bannière review_required — contenu attendu', () => {
  it('review_required produit reason attendue pour la bannière', () => {
    const { reason } = computeWeekReadiness({
      expectedMeals: 14, uniqueMealCount: 14, prepTaskCount: 7, planStatus: 'review_required',
    })
    // La bannière affiche les issues quand reason === 'review_required'
    expect(reason).toBe('review_required')
  })

  it('plan complet publié : bannière absente (ready = true)', () => {
    const { ready, reason } = computeWeekReadiness({
      expectedMeals: 14, uniqueMealCount: 14, prepTaskCount: 7, planStatus: 'published',
    })
    expect(ready).toBe(true)
    expect(reason).toBeNull()
  })
})
