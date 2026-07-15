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

export async function listEditorialRecipes(supabase, {
  code = null,
  limit = 500,
  offset = 0,
  servings = null,
  quantityScale = 1,
} = {}) {
  if (!supabase) throw new Error('Client Supabase authentifié requis')

  const { data, error } = await supabase.rpc('get_editorial_recipe_catalog_v3', {
    p_code: code,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw new Error(`Catalogue recettes V3 indisponible: ${error.message}`)

  return materializeOperationalCatalog(data, { servings, quantityScale })
}

export async function getEditorialRecipe(supabase, code, options = {}) {
  const catalog = await listEditorialRecipes(supabase, { ...options, code, limit: 1, offset: 0 })
  const recipe = catalog.recipes[0] || null
  if (!recipe || options.includeComponents === false) return recipe

  const components = recipe.exactIngredients
    .map((ingredient) => ingredient.component)
    .filter((component, index, items) => component?.code && items.findIndex((item) => item?.code === component.code) === index)

  const subRecipes = {}
  await Promise.all(components.map(async (component) => {
    const required = Number(component.requiredQuantity)
    const declaredYield = Number(component.yieldQuantity)
    const quantityScale = required > 0 && declaredYield > 0 ? required / declaredYield : 1
    const childCatalog = await listEditorialRecipes(supabase, {
      code: component.code,
      limit: 1,
      quantityScale,
    })
    const child = childCatalog.recipes[0]
    if (child) subRecipes[component.code] = { ...child, requestedYield: component.requiredQuantity, requestedUnit: component.requiredUnit }
  }))

  return { ...recipe, subRecipes }
}

export async function getOperationalRecipe(supabase, code, options = {}) {
  const catalog = await listOperationalRecipes(supabase, { ...options, code, limit: 1, offset: 0 })
  return catalog.recipes[0] || null
}
