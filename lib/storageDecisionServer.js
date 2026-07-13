import { decideStorage } from '@/lib/storageDecision'

const STORAGE_FIELDS = [
  'shelf_life_days_pantry',
  'shelf_life_days_fridge',
  'shelf_life_days_freezer',
].join(', ')

/** Charge les faits de conservation sans faire de choix métier. */
export async function loadStorageFacts(supabase, archetypeId, canonicalFoodId) {
  let archetype = null
  let canonical = null

  if (archetypeId) {
    const { data, error } = await supabase
      .from('archetypes')
      .select(`id, name, canonical_food_id, storage_profile, expiry_kind, ${STORAGE_FIELDS}, canonical_food:canonical_foods(id, canonical_name, ${STORAGE_FIELDS})`)
      .eq('id', archetypeId)
      .maybeSingle()
    if (error) throw new Error(`Lecture conservation archétype : ${error.message}`)
    archetype = data
    canonical = data?.canonical_food ?? null
  }

  const effectiveCanonicalId = canonicalFoodId ?? archetype?.canonical_food_id ?? null
  if (!canonical && effectiveCanonicalId) {
    const { data, error } = await supabase
      .from('canonical_foods')
      .select(`id, canonical_name, ${STORAGE_FIELDS}`)
      .eq('id', effectiveCanonicalId)
      .maybeSingle()
    if (error) throw new Error(`Lecture conservation canonique : ${error.message}`)
    canonical = data
  }

  let policies = []
  const filters = []
  if (archetypeId) filters.push(`archetype_id.eq.${Number(archetypeId)}`)
  if (effectiveCanonicalId) filters.push(`canonical_food_id.eq.${Number(effectiveCanonicalId)}`)

  if (filters.length > 0) {
    const { data, error } = await supabase
      .from('food_storage_policies')
      .select('id, canonical_food_id, archetype_id, food_state, purchase_state, storage_method, suitability, duration_days, expiry_kind, source_type, source_ref, confidence, policy_version, reason, active')
      .or(filters.join(','))
      .eq('active', true)

    // Compatibilité pendant le déploiement : la migration peut précéder ou
    // suivre le code. Seule l'absence de la nouvelle table est tolérée.
    if (!error) policies = data || []
    else if (error.code !== '42P01' && error.code !== 'PGRST205') {
      throw new Error(`Lecture politiques de conservation : ${error.message}`)
    }
  }

  return { archetype, canonical, policies }
}

export async function buildStorageDecision(supabase, input) {
  const facts = await loadStorageFacts(
    supabase,
    input.archetypeId ?? null,
    input.canonicalFoodId ?? null,
  )

  return decideStorage({
    name: input.productName,
    category: input.category,
    purchaseState: input.purchaseState,
    foodState: input.foodState,
    explicitStorageMethod: input.storageMethod,
    labelUseByDate: input.useByDate,
    labelBestBeforeDate: input.bestBeforeDate,
    acquiredOn: input.acquiredOn,
    ...facts,
  })
}

