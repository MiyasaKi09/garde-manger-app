/**
 * Rapprochement des noms de personnes (person_name libre) → membre du foyer.
 * Domaine PUR (aucun accès réseau) — testable sans Supabase. Réf. plan PR 1, §9.10.
 *
 * `normalizeName` DOIT rester aligné avec la normalisation SQL utilisée par la
 * table household_member_legacy_names : lower(btrim(unaccent(name))) — minuscule,
 * sans accents, sans espaces de bord.
 */

/** Minuscule + suppression des accents + trim. */
export function normalizeName(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Construit un index { nom normalisé → household_member_id } à partir des lignes
 * de household_member_legacy_names (ou de tout objet { normalized_name?, raw_name?,
 * household_member_id }).
 */
export function buildMemberIndex(legacyRows = []) {
  const index = new Map()
  for (const row of legacyRows) {
    if (!row?.household_member_id) continue
    const key = row.normalized_name ? String(row.normalized_name) : normalizeName(row.raw_name)
    if (key) index.set(key, row.household_member_id)
  }
  return index
}

/** Résout un person_name en household_member_id via l'index, sinon null. */
export function resolveMemberId(personName, index) {
  if (!index || typeof index.get !== 'function') return null
  return index.get(normalizeName(personName)) ?? null
}
