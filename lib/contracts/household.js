/**
 * Contrats foyer — validateurs explicites (sans dépendance lourde). Réf. plan
 * PR 1, §9.13. Lèvent une ContractError (code stable) en cas d'invalidité.
 */
import { ContractError } from '@/lib/domain/errors'

export function assertHouseholdMember(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string') {
    throw new ContractError('household_member_invalid', 'Membre du foyer invalide')
  }
  if (!value.name || !String(value.name).trim()) {
    throw new ContractError('household_member_name_missing', 'Nom du membre manquant')
  }
  return value
}
