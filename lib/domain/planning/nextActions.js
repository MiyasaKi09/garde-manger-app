/**
 * nextActions.js — Actions du jour ordonnées (audit §13 niveau 1, lot P5).
 *
 * buildNextActions({ todayIso, slots, tasks, dependencies?, alerts? })
 *
 * Détermine la liste ordonnée des actions pratiques pour la journée courante :
 *   1. Sortir du congélateur (tâches defrost du jour)
 *   2. Préparer           (tâches prepare_recipe/prepare du jour + minutes actives)
 *   3. Réchauffer         (tâches reheat du jour, ou slots reheat sans tâche explicite)
 *   4. Manger en priorité (slots source='cooked_dish' du jour — reste à finir)
 *   5. Acheter            (shortages des slots du jour dont coverage < 1)
 *
 * Chaque action : { kind, label, minutes?, href? }
 * Le champ `totalActiveMinutes` agrège les minutes actives de cuisine (prepare + reheat).
 *
 * Structure attendue des paramètres :
 *   slots[] : { meal_date, source, preparation?, stock_summary?, dish_name? }
 *     - source : 'plan'|'canonical_v3'|'cooked_dish'|'planned_production'
 *     - preparation : { mode?, transformed_from? }
 *     - stock_summary : { coverage: number (0-1), shortages: [{ingredientName?, formNormalized?, grams?}] }
 *   tasks[] : { prep_date, task_type, duration_min?, prep_label?, task? }
 *     - task_type : 'defrost'|'prepare_recipe'|'prepare'|'reheat'|'freeze_dish'|'legacy'
 *
 * Aucune dépendance externe : module pur, entièrement déterministe.
 */

const PREPARE_TASK_TYPES = new Set(['prepare_recipe', 'prepare'])
const REHEAT_TASK_TYPES = new Set(['reheat'])
const DEFROST_TASK_TYPES = new Set(['defrost'])

/**
 * Construit la liste ordonnée des actions du jour.
 *
 * @param {object} params
 * @param {string}  params.todayIso     Date ISO du jour (ex. '2026-07-17')
 * @param {Array}   [params.slots]      Slots de planning (peuvent porter stock_summary)
 * @param {Array}   [params.tasks]      Tâches de préparation chargées pour la semaine
 * @param {Array}   [params.dependencies] Dépendances de tâches (optionnel, non utilisé v1)
 * @param {Array}   [params.alerts]     Alertes DLC/DDM (optionnel)
 * @returns {{ actions: Array<{kind: string, label: string, minutes?: number, href?: string|null}>, totalActiveMinutes: number }}
 */
export function buildNextActions({ todayIso, slots = [], tasks = [], dependencies = [], alerts = [] } = {}) {
  const today = String(todayIso || '')
  const actions = []
  let totalActiveMinutes = 0

  // ── 1. Sortir du congélateur ──────────────────────────────────────────────
  // Les tâches defrost planifiées pour aujourd'hui : l'utilisateur doit sortir
  // les plats congelés pour les repas du lendemain ou d'après.
  const defrostTasks = tasks.filter(t =>
    DEFROST_TASK_TYPES.has(t.task_type) &&
    String(t.prep_date || '') === today
  )
  for (const t of defrostTasks) {
    actions.push({
      kind: 'defrost',
      label: String(t.prep_label || t.task || 'Sortir du congélateur').trim(),
      minutes: Number(t.duration_min) > 0 ? Number(t.duration_min) : undefined,
      href: null,
    })
    // Les tâches de décongélation ne comptent pas dans le temps actif de cuisine
    // (DEFROST_TASK_MINUTES = 2 min, mais c'est du temps passif)
  }

  // ── 2. Préparer ───────────────────────────────────────────────────────────
  // Tâches de cuisson actives du jour.
  const prepareTasks = tasks.filter(t =>
    PREPARE_TASK_TYPES.has(t.task_type) &&
    String(t.prep_date || '') === today
  )
  for (const t of prepareTasks) {
    const minutes = Number(t.duration_min) > 0 ? Number(t.duration_min) : undefined
    actions.push({
      kind: 'prepare',
      label: String(t.prep_label || t.task || 'Préparer').trim(),
      minutes,
      href: null,
    })
    if (minutes) totalActiveMinutes += minutes
  }

  // ── 3. Réchauffer ─────────────────────────────────────────────────────────
  // D'abord depuis les tâches explicites de réchauffage.
  const reheatTasks = tasks.filter(t =>
    REHEAT_TASK_TYPES.has(t.task_type) &&
    String(t.prep_date || '') === today
  )
  const seenReheatLabels = new Set()
  for (const t of reheatTasks) {
    const label = String(t.prep_label || t.task || 'Réchauffer').trim()
    if (seenReheatLabels.has(label)) continue
    seenReheatLabels.add(label)
    const minutes = Number(t.duration_min) > 0 ? Number(t.duration_min) : undefined
    actions.push({ kind: 'reheat', label, minutes, href: null })
    if (minutes) totalActiveMinutes += minutes
  }

  // Fallback : slots à réchauffer du jour sans tâche reheat explicite
  // (source='planned_production' + preparation.mode='reheat')
  if (!reheatTasks.length) {
    const reheatSlots = slots.filter(s =>
      String(s.meal_date || '') === today &&
      (s.source === 'planned_production' || (s.preparation && s.preparation.mode === 'reheat'))
    )
    if (reheatSlots.length) {
      const names = [...new Set(reheatSlots.map(s => s.dish_name).filter(Boolean))]
      const label = names.length
        ? `Réchauffer : ${names.slice(0, 2).join(', ')}${names.length > 2 ? '…' : ''}`
        : `Réchauffer ${reheatSlots.length > 1 ? reheatSlots.length + ' plats' : 'le plat'}`
      actions.push({ kind: 'reheat', label, href: null })
    }
  }

  // ── 4. Manger en priorité (restes) ───────────────────────────────────────
  // Slots dont la source est un plat cuisiné existant (cooked_dish).
  // Ces créneaux épuisent un reste — priorité à les consommer ce soir.
  const leftoverSlots = slots.filter(s =>
    String(s.meal_date || '') === today &&
    s.source === 'cooked_dish'
  )
  // Déduplique par dish_name pour éviter d'afficher 2 fois le même reste
  const seenLeftovers = new Set()
  for (const s of leftoverSlots) {
    const dishName = String(s.dish_name || '').trim() || 'le reste'
    if (seenLeftovers.has(dishName)) continue
    seenLeftovers.add(dishName)
    actions.push({
      kind: 'eat_urgent',
      label: `Finir : ${dishName}`,
      href: null,
    })
  }

  // ── 5. Acheter ────────────────────────────────────────────────────────────
  // Shortages des slots du jour dont la couverture stock est incomplète.
  const shortageNames = new Set()
  for (const s of slots) {
    if (String(s.meal_date || '') !== today) continue
    const coverage = Number((s.stock_summary || {}).coverage ?? 1)
    if (!Number.isFinite(coverage) || coverage >= 1) continue

    const shortages = Array.isArray(s.stock_summary?.shortages) ? s.stock_summary.shortages : []
    if (shortages.length) {
      for (const item of shortages) {
        const name = String(
          item?.ingredientName || item?.formNormalized || item || ''
        ).trim()
        if (name) shortageNames.add(name)
      }
    } else {
      // Coverage < 1 mais pas de détail : indiquer générique
      shortageNames.add('ingrédients manquants')
    }
  }
  if (shortageNames.size) {
    const names = [...shortageNames]
    const preview = names.slice(0, 3).join(', ')
    const label = names.length > 3
      ? `Acheter : ${preview} et ${names.length - 3} autre${names.length - 3 > 1 ? 's' : ''}`
      : `Acheter : ${preview}`
    actions.push({ kind: 'buy', label, href: '/courses' })
  }

  return { actions, totalActiveMinutes }
}
