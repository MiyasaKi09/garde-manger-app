/**
 * Calculs nutritionnels : BMR, TDEE, objectifs macros.
 * Basé sur la formule Mifflin-St Jeor.
 */

const ACTIVITY_FACTORS = {
  sedentary: 1.2,       // Bureau, peu d'exercice
  light: 1.375,         // Exercice léger 1-3j/sem
  moderate: 1.55,       // Exercice modéré 3-5j/sem
  active: 1.725,        // Exercice intense 6-7j/sem
  very_active: 1.9,     // Exercice très intense + métier physique
}

const ACTIVITY_LABELS = {
  sedentary: 'Sédentaire (bureau, peu d\'exercice)',
  light: 'Légèrement actif (1-3 jours/semaine)',
  moderate: 'Modérément actif (3-5 jours/semaine)',
  active: 'Très actif (6-7 jours/semaine)',
  very_active: 'Extrêmement actif (2x/jour ou métier physique)',
}

/**
 * BMR via Mifflin-St Jeor
 * Homme : 10 × poids(kg) + 6.25 × taille(cm) − 5 × âge − 5 (correction: +5 pour homme)
 * Femme : 10 × poids(kg) + 6.25 × taille(cm) − 5 × âge − 161
 */
export function calculateBMR(weight_kg, height_cm, age, sex) {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return sex === 'M' ? base + 5 : base - 161
}

/**
 * TDEE = BMR × facteur d'activité
 */
export function calculateTDEE(bmr, activityLevel) {
  const factor = ACTIVITY_FACTORS[activityLevel] || 1.55
  return bmr * factor
}

/**
 * Objectif calorique = TDEE - déficit
 * Déficit basé sur le rythme de perte de poids :
 * 0.5 kg/sem = ~550 kcal/jour de déficit
 * 1 kg/sem = ~1100 kcal/jour de déficit
 * Minimum : 1200 kcal femme, 1500 kcal homme
 */
export function calculateTargetCalories(tdee, weightLossRate, sex) {
  const deficitPerDay = (weightLossRate || 0) * 1100
  const target = tdee - deficitPerDay
  const minimum = sex === 'M' ? 1500 : 1200
  return Math.max(Math.round(target), minimum)
}

// ─── LA CIBLE PROTÉIQUE (livrable 1.3) ──────────────────────────────────────
//
// CE QUI ÉTAIT FAUX. La cible se calculait `poids_ACTUEL × 1,4 / 1,6 / 1,8`
// selon le rythme de perte, et `calculateFullProfile` passait `w` — le poids
// actuel — là où il fallait `tw`, le poids cible, qui ne servait qu'à estimer
// une durée. Les 216 g mesurés au §2.3 de `docs/PLAN_FINIR_MYKO.md` sont donc
// 1,8 g/kg du poids ACTUEL : une cible que le corpus ne peut servir qu'en
// doublant les portions, ce que le §2.3 mesure aussi (P5 à 1,86-2,00).
//
// CE QUE CE MODULE CALCULE MAINTENANT. `cible = coefficient × poids CIBLE`, le
// coefficient étant réglable par personne. Les kcal, elles, restent calculées
// par Mifflin-St Jeor sur le poids ACTUEL : c'est lui qui dépense l'énergie.
// Les deux grandeurs ne sortent pas du même poids, et c'est volontaire.
//
// POURQUOI UN ARGUMENT NOMMÉ PLUTÔT QUE POSITIONNEL. L'ancienne signature était
// `calculateMacros(targetCalories, weight_kg, weightLossRate)`. Deux poids
// existent dans l'appelant, ils ont le même type et la même unité, et rien
// dans l'appel ne disait lequel passer : c'est exactement ce qui a produit le
// défaut. Un objet nommé rend l'erreur impossible à commettre en silence.

/**
 * Bornes admissibles d'un coefficient protéique, en g/kg de poids cible.
 * Elles ne disent pas ce qui est souhaitable — elles écartent ce qui n'est pas
 * un coefficient (une saisie en grammes, un zéro, une valeur de bodybuilding
 * hors de toute recommandation).
 */
export const PROTEIN_COEFFICIENT_RANGE = Object.freeze({ min: 0.5, max: 3 })

/**
 * Défauts DOCUMENTÉS, retenus au §8 de `docs/PLAN_FINIR_MYKO.md` : 1,6 g/kg de
 * poids cible en perte, 1,4 en maintien. Ce sont des défauts, pas des valeurs
 * en dur : chaque personne règle le sien.
 *
 * MESURE AVANT DE FIGER, comme le §8 l'exige. P4 (jours à ≥ 85 % de la cible)
 * a été rejoué sur trois semaines consécutives, historique cumulé, corpus du
 * dépôt, protocole du §2.3 — le harnais est celui de
 * `tests/planning/rapportQualiteSemaine.test.js`. La table est consignée dans
 * `tests/nutrition/cibleProteique.test.js`, à côté du test qui la rejoue.
 *
 * AUCUN DÉFAUT POUR UNE PRISE DE POIDS. Le foyer n'en a pas déclaré, et un
 * coefficient inventé pour ce cas aurait la même tête qu'un coefficient décidé.
 * Une prise de poids retombe donc sur le défaut de maintien, et la personne
 * concernée règle le sien — ce que `coefficient_source` rend lisible.
 */
export const PROTEIN_COEFFICIENT_DEFAULTS = Object.freeze({
  loss: 1.6,
  maintenance: 1.4,
})

/**
 * Le coefficient effectivement employé, et D'OÙ il vient. La provenance voyage
 * avec la valeur : sans elle, un défaut et un réglage se ressemblent.
 *
 * @returns {{ coefficient: number, source: 'member'|'default_loss'|'default_maintenance' }}
 */
export function resolveProteinCoefficient({ proteinCoefficient, weightLossRate } = {}) {
  const declared = Number(proteinCoefficient)
  if (Number.isFinite(declared)
    && declared >= PROTEIN_COEFFICIENT_RANGE.min
    && declared <= PROTEIN_COEFFICIENT_RANGE.max) {
    return { coefficient: declared, source: 'member' }
  }
  const rate = Number(weightLossRate)
  const losing = Number.isFinite(rate) && rate > 0
  return {
    coefficient: losing ? PROTEIN_COEFFICIENT_DEFAULTS.loss : PROTEIN_COEFFICIENT_DEFAULTS.maintenance,
    source: losing ? 'default_loss' : 'default_maintenance',
  }
}

/**
 * Cible protéique journalière, et la RÈGLE qui l'a produite.
 *
 * `protein_g` vaut `null` quand le poids cible n'est pas déclaré. C'est le
 * point du livrable : l'ancienne version retombait sur le poids actuel
 * (`parseFloat(targetWeight) || w`), et une cible calculée sur le mauvais poids
 * ne se distingue plus d'une cible juste. L'absence se dit ; elle ne se comble
 * pas.
 *
 * La règle est rendue avec la valeur pour être VERSIONNÉE telle quelle dans
 * `nutrition_target_versions.rationale` : une cible sans sa règle ne se
 * recalcule pas, et ne se conteste pas.
 */
export function calculateProteinTarget({ targetWeightKg, proteinCoefficient, weightLossRate } = {}) {
  const { coefficient, source } = resolveProteinCoefficient({ proteinCoefficient, weightLossRate })
  const targetWeight = Number(targetWeightKg)
  const declared = Number.isFinite(targetWeight) && targetWeight > 0
  return {
    protein_g: declared ? Math.round(coefficient * targetWeight) : null,
    rule: {
      basis: 'target_weight',
      formula: 'target_protein_g = coefficient_g_per_kg × target_weight_kg',
      coefficient_g_per_kg: coefficient,
      coefficient_source: source,
      target_weight_kg: declared ? targetWeight : null,
      missing: declared ? [] : ['target_weight_kg'],
    },
  }
}

/**
 * Répartition macros recommandée
 * Protéines : coefficient × poids CIBLE (voir ci-dessus).
 * Lipides : 30% des calories.
 * Glucides : le reste.
 * Fibres : 14 g pour 1 000 kcal.
 *
 * Les glucides sont « le reste » : sans cible protéique, il n'y a pas de reste
 * à prendre, et ils valent `null` plutôt qu'un nombre dont personne ne pourrait
 * dire d'où il sort.
 */
export function calculateMacros({ targetCalories, targetWeightKg, weightLossRate, proteinCoefficient } = {}) {
  const kcal = Number(targetCalories) || 0
  const { protein_g, rule } = calculateProteinTarget({ targetWeightKg, proteinCoefficient, weightLossRate })

  // Lipides : 30% des calories (minimum sain pour les hormones)
  const fat_g = Math.round((kcal * 0.30) / 9)

  // Glucides : le reste
  const carbs_g = protein_g == null
    ? null
    : Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4))

  // Fibres : 14g pour 1000 kcal
  const fiber_g = Math.round((kcal / 1000) * 14)

  return { protein_g, carbs_g, fat_g, fiber_g, protein_rule: rule }
}

/**
 * Calcul complet depuis le profil.
 *
 * `targetWeight` n'est plus seulement une estimation de durée : c'est la base
 * de la cible protéique. `proteinCoefficient` est le réglage de la personne ;
 * absent, les défauts documentés s'appliquent et `protein_rule.coefficient_source`
 * le dit.
 */
export function calculateFullProfile({
  weight_kg, height_cm, age, sex, activityLevel, weightLossRate, targetWeight, proteinCoefficient,
}) {
  const w = parseFloat(weight_kg) || 70
  const h = parseFloat(height_cm) || 170
  const a = parseInt(age) || 30
  // Pas de repli sur le poids actuel : un poids cible absent reste absent.
  // `NaN > w` est faux, donc le rythme garde exactement le comportement
  // d'avant quand rien n'est déclaré.
  const tw = parseFloat(targetWeight)
  const wlr = parseFloat(weightLossRate) || 0

  const bmr = calculateBMR(w, h, a, sex)
  const tdee = calculateTDEE(bmr, activityLevel)

  // Si objectif de gain de poids
  const rate = tw > w ? -(wlr) : wlr
  // L'énergie reste calculée sur le poids ACTUEL : c'est lui qui dépense.
  const targetCalories = calculateTargetCalories(tdee, rate, sex)
  const macros = calculateMacros({
    targetCalories,
    targetWeightKg: tw,
    weightLossRate: rate,
    proteinCoefficient,
  })

  // Estimation durée
  const weeklyDeficit = rate * 1100 * 7
  const totalToLose = Number.isFinite(tw) ? Math.abs(w - tw) : null
  const weeksToGoal = weeklyDeficit > 0 && totalToLose != null
    ? Math.round((totalToLose * 7700) / weeklyDeficit)
    : null

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target_calories: targetCalories,
    target_protein_g: macros.protein_g,
    target_carbs_g: macros.carbs_g,
    target_fat_g: macros.fat_g,
    target_fiber_g: macros.fiber_g,
    // La règle voyage avec la cible : c'est elle qui sera versionnée.
    protein_rule: macros.protein_rule,
    weeks_to_goal: weeksToGoal,
  }
}

export { ACTIVITY_FACTORS, ACTIVITY_LABELS }
