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

/**
 * Répartition macros recommandée
 * Protéines : 1.6-2.2g/kg (plus haut si perte de poids pour préserver la masse musculaire)
 * Lipides : 25-30% des calories
 * Glucides : le reste
 */
export function calculateMacros(targetCalories, weight_kg, weightLossRate) {
  // Protéines : 1.4-1.8g/kg selon le déficit (pas 2g/kg qui est bodybuilding)
  const proteinPerKg = weightLossRate > 0.5 ? 1.8 : weightLossRate > 0 ? 1.6 : 1.4
  const protein_g = Math.round(weight_kg * proteinPerKg)

  // Lipides : 30% des calories (minimum sain pour les hormones)
  const fat_g = Math.round((targetCalories * 0.30) / 9)

  // Glucides : le reste
  const proteinCal = protein_g * 4
  const fatCal = fat_g * 9
  const carbs_g = Math.max(0, Math.round((targetCalories - proteinCal - fatCal) / 4))

  // Fibres : 14g pour 1000 kcal
  const fiber_g = Math.round((targetCalories / 1000) * 14)

  return { protein_g, carbs_g, fat_g, fiber_g }
}

/**
 * Calcul complet depuis le profil
 */
export function calculateFullProfile({ weight_kg, height_cm, age, sex, activityLevel, weightLossRate, targetWeight }) {
  const w = parseFloat(weight_kg) || 70
  const h = parseFloat(height_cm) || 170
  const a = parseInt(age) || 30
  const tw = parseFloat(targetWeight) || w
  const wlr = parseFloat(weightLossRate) || 0

  const bmr = calculateBMR(w, h, a, sex)
  const tdee = calculateTDEE(bmr, activityLevel)

  // Si objectif de gain de poids
  const rate = tw > w ? -(wlr) : wlr
  const targetCalories = calculateTargetCalories(tdee, rate, sex)
  const macros = calculateMacros(targetCalories, w, rate)

  // Estimation durée
  const weeklyDeficit = rate * 1100 * 7
  const totalToLose = Math.abs(w - tw)
  const weeksToGoal = weeklyDeficit > 0 ? Math.round((totalToLose * 7700) / weeklyDeficit) : null

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target_calories: targetCalories,
    target_protein_g: macros.protein_g,
    target_carbs_g: macros.carbs_g,
    target_fat_g: macros.fat_g,
    target_fiber_g: macros.fiber_g,
    weeks_to_goal: weeksToGoal,
  }
}

export { ACTIVITY_FACTORS, ACTIVITY_LABELS }
