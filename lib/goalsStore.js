/**
 * Stockage des objectifs nutritionnels en localStorage.
 * Simple et fiable — pas de migration Supabase nécessaire.
 * Format : { "Julien": { target_calories, target_protein_g, ... }, "Zoé": { ... } }
 */

const STORAGE_KEY = 'myko-nutrition-goals'

export function getGoals() {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function getPersonGoals(personName) {
  const all = getGoals()
  return all[personName] || null
}

export function saveGoals(goals) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

export function savePersonGoals(personName, data) {
  const all = getGoals()
  all[personName] = { ...data, updated_at: new Date().toISOString() }
  saveGoals(all)
}

export function getAllPersons() {
  return ['Julien', 'Zoé']
}
