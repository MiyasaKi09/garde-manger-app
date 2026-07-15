import { materializeOperationalCatalog } from '@/lib/domain/recipes/operationalCatalog'

export async function listOperationalRecipes(supabase, {
  code = null,
  limit = 100,
  offset = 0,
  servings = null,
} = {}) {
  if (!supabase) throw new Error('Client Supabase authentifié requis')

  const { data, error } = await supabase.rpc('get_operational_recipe_catalog_v3', {
    p_code: code,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw new Error(`Catalogue recettes V3 indisponible: ${error.message}`)

  return materializeOperationalCatalog(data, { servings })
}

export async function getOperationalRecipe(supabase, code, options = {}) {
  const catalog = await listOperationalRecipes(supabase, { ...options, code, limit: 1, offset: 0 })
  return catalog.recipes[0] || null
}
