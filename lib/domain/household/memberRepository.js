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

const MEMBER_COLS = 'id, name, member_type, portion_multiplier, active, preferences'

/** Crée un membre du foyer (RLS : user_id = auth.uid()). */
export async function createMember(supabase, userId, input = {}) {
  const name = String(input.name ?? '').trim()
  if (!name) { const e = new Error('household_member_name_missing'); e.code = 'validation'; throw e }
  const { data, error } = await supabase
    .from('household_members')
    .insert({
      user_id: userId,
      name,
      member_type: input.member_type ?? 'adult',
      portion_multiplier: input.portion_multiplier ?? 1,
      preferences: input.preferences ?? {},
      active: input.active ?? true,
    })
    .select(MEMBER_COLS)
    .single()
  if (error) throw new Error(`Création membre : ${error.message}`)
  return data
}

/** Met à jour un membre (champs autorisés uniquement). */
export async function updateMember(supabase, id, patch = {}) {
  const allowed = {}
  for (const k of ['name', 'member_type', 'portion_multiplier', 'active', 'preferences']) {
    if (k in patch) allowed[k] = patch[k]
  }
  if ('name' in allowed) {
    allowed.name = String(allowed.name ?? '').trim()
    if (!allowed.name) { const e = new Error('household_member_name_missing'); e.code = 'validation'; throw e }
  }
  const { data, error } = await supabase
    .from('household_members').update(allowed).eq('id', id).select(MEMBER_COLS).maybeSingle()
  if (error) throw new Error(`Mise à jour membre : ${error.message}`)
  return data
}

/** Désactive un membre (soft-delete : préserve les liens historiques member_id). */
export async function deactivateMember(supabase, id) {
  const { data, error } = await supabase
    .from('household_members').update({ active: false }).eq('id', id).select('id, active').maybeSingle()
  if (error) throw new Error(`Désactivation membre : ${error.message}`)
  return data
}
