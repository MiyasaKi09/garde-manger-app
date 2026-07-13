/**
 * Erreurs métier communes (domaine pur, sans dépendance réseau).
 * Réf. plan directeur PR 1, §9.13. Chaque erreur porte un `code` stable
 * (catalogue §35) exploitable par les routes API et les tests.
 */
export class DomainError extends Error {
  constructor(code, message, details) {
    super(message || code)
    this.name = 'DomainError'
    this.code = code
    this.details = details ?? null
  }
}
export class ContractError extends DomainError {
  constructor(code, message, details) { super(code, message, details); this.name = 'ContractError' }
}
export class ValidationError extends DomainError {
  constructor(code, message, details) { super(code, message, details); this.name = 'ValidationError' }
}
export class ConflictError extends DomainError {
  constructor(code, message, details) { super(code, message, details); this.name = 'ConflictError' }
}
export class NotFoundError extends DomainError {
  constructor(code, message, details) { super(code, message, details); this.name = 'NotFoundError' }
}
export class PermissionError extends DomainError {
  constructor(code, message, details) { super(code, message, details); this.name = 'PermissionError' }
}

/** Traduit une erreur domaine en statut HTTP pour les routes API. */
export function httpStatusForError(err) {
  if (err instanceof ValidationError || err instanceof ContractError) return 400
  if (err instanceof PermissionError) return 403
  if (err instanceof NotFoundError) return 404
  if (err instanceof ConflictError) return 409
  return 500
}
