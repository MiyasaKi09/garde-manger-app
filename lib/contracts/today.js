/**
 * Contrat de la vue « Aujourd'hui » (GET /api/today). Réf. plan PR 1, §9.13/§9.15.
 * Valide la forme finale attendue par la page pour éviter toute dérive.
 */
import { ContractError } from '@/lib/domain/errors'

const ARRAY_FIELDS = ['members', 'alerts', 'tasks', 'meals', 'leftovers', 'nutritionStatus', 'dataQuality']

export function assertTodayViewModel(value) {
  if (!value || typeof value !== 'object') {
    throw new ContractError('today_invalid', 'ViewModel Today invalide')
  }
  if (typeof value.date !== 'string' || !value.date) {
    throw new ContractError('today_invalid_date', 'today.date doit être une chaîne non vide')
  }
  for (const k of ARRAY_FIELDS) {
    if (!Array.isArray(value[k])) {
      throw new ContractError('today_field_not_array', `today.${k} doit être un tableau`, { field: k })
    }
  }
  if (!value.shopping || typeof value.shopping !== 'object' || !Array.isArray(value.shopping.items)) {
    throw new ContractError('today_shopping_invalid', 'today.shopping.items doit être un tableau')
  }
  if (typeof value.shopping.requiredCount !== 'number') {
    throw new ContractError('today_shopping_invalid', 'today.shopping.requiredCount doit être un nombre')
  }
  return value
}
