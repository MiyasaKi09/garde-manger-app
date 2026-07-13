/**
 * Repository foyer — accès Supabase (SERVEUR uniquement : à n'importer que depuis
 * des routes API / services serveur, jamais un Client Component). Réf. plan PR 1,
 * §9.10 / §9.14. Prend un client Supabase déjà authentifié (RLS de l'utilisateur).
 *
 * NB : le garde `import 'server-only'` sera ajouté quand la dépendance sera
 * installée ; en attendant, ne pas importer ce module côté client.
 */
import { buildMemberIndex } from './memberMapping'

/** Membres actifs et inactifs du foyer de l'utilisateur courant. */
export async function listMembers(supabase) {
  const { data, error } = await supabase
    .from('household_members')
    .select('id, name, member_type, portion_multiplier, active, preferences')
    .order('name', { ascending: true })
  if (error) throw new Error(`Lecture household_members : ${error.message}`)
  return data || []
}

/** Lignes de mapping des noms historiques → membre. */
export async function loadLegacyNameRows(supabase) {
  const { data, error } = await supabase
    .from('household_member_legacy_names')
    .select('household_member_id, normalized_name, raw_name')
  if (error) throw new Error(`Lecture household_member_legacy_names : ${error.message}`)
  return data || []
}

/** Index prêt à l'emploi { nom normalisé → household_member_id } pour l'utilisateur. */
export async function loadMemberIndex(supabase) {
  const rows = await loadLegacyNameRows(supabase)
  return buildMemberIndex(rows)
}
