import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Relie les ingrédients (texte libre) des recettes générées aux entités
// d'inventaire (canonical_foods / archetypes). AUCUN appel Anthropic — pur
// code déterministe + Supabase. Écrit dans generated_recipe_ingredients.
// POST /api/recipes/link-ingredients  body: { recipe_id?: number, all?: true }

const STOP = new Set([
  'de', 'du', 'des', 'd', 'l', 'la', 'le', 'les', 'a', 'au', 'aux', 'en',
  'et', 'ou', 'avec', 'sans', 'the',
])
const UNITS = new Set([
  'g', 'gr', 'kg', 'mg', 'ml', 'cl', 'l', 'cs', 'cc', 'cuillere', 'cuilleres',
  'cuillère', 'cuillères', 'pincee', 'pincée', 'sachet', 'sachets', 'boite',
  'boîte', 'boites', 'boîtes', 'tranche', 'tranches', 'gousse', 'gousses',
  'botte', 'bottes', 'brin', 'brins', 'feuille', 'feuilles', 'filet', 'filets',
  'pave', 'pavé', 'pièce', 'piece', 'pièces', 'pieces', 'verre', 'verres',
  'tasse', 'tasses', 'dose', 'doses', 'noix', 'demi',
])

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-\s]+/g, ' ')
    .trim()
}

// "200 g lentilles vertes" / "1 boîte de pois chiches" → { quantity, unit, name }
function parseIngredient(raw) {
  if (raw && typeof raw === 'object') {
    return {
      raw_name: String(raw.name ?? raw.item ?? '').trim() || JSON.stringify(raw),
      quantity: raw.quantity != null ? Number(raw.quantity) : null,
      unit: raw.unit || null,
      notes: raw.notes || null,
    }
  }
  const s = String(raw || '').trim()
  const m = s.match(/^\s*(\d+(?:[.,]\d+)?)\s*([^\d\s]+)?\s*(?:de\s+|d['’]\s*)?(.+)$/i)
  if (m) {
    const qty = parseFloat(m[1].replace(',', '.'))
    let unit = (m[2] || '').trim() || null
    let name = m[3].trim()
    if (unit && !UNITS.has(normalize(unit))) {
      // pas une unité connue → ça fait partie du nom
      name = `${unit} ${name}`.trim()
      unit = null
    }
    return { raw_name: name || s, quantity: isNaN(qty) ? null : qty, unit, notes: null }
  }
  return { raw_name: s, quantity: null, unit: null, notes: null }
}

function tokens(str, dropUnits = false) {
  return normalize(str)
    .split(' ')
    .filter(Boolean)
    .map(t => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t)) // pluriel
    .filter(t => t && !STOP.has(t) && (!dropUnits || !UNITS.has(t)))
}

// Cherche la meilleure entité dont TOUS les mots sont dans l'ingrédient.
// La plus spécifique (le plus de mots) gagne ; égalité → moins de "bruit".
function bestMatch(ingTokens, pool) {
  const ingSet = new Set(ingTokens)
  let best = null
  for (const e of pool) {
    if (!e._tokens.length) continue
    const allIn = e._tokens.every(t => ingSet.has(t))
    if (!allIn) continue
    const spec = e._tokens.length
    if (!best || spec > best._spec ||
        (spec === best._spec && e._tokens.length < best._tokens.length)) {
      best = { ...e, _spec: spec }
    }
  }
  return best
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const { recipe_id, all } = body || {}
  if (!recipe_id && !all) {
    return NextResponse.json({ error: 'recipe_id ou all requis' }, { status: 400 })
  }

  // Recettes cibles
  let rq = supabase.from('generated_recipes').select('id,title,ingredients').eq('user_id', user.id)
  if (recipe_id) rq = rq.eq('id', recipe_id)
  const { data: recipes, error: rErr } = await rq
  if (rErr) return NextResponse.json({ error: 'Erreur lecture recettes' }, { status: 500 })
  if (!recipes?.length) return NextResponse.json({ error: 'Aucune recette' }, { status: 404 })

  // Catalogues d'entités (chargés une fois)
  const [{ data: cfs }, { data: archs }] = await Promise.all([
    supabase.from('canonical_foods').select('id,canonical_name'),
    supabase.from('archetypes').select('id,name'),
  ])
  const canonicalPool = (cfs || []).map(c => ({ id: c.id, _tokens: tokens(c.canonical_name) }))
  const archetypePool = (archs || []).map(a => ({ id: a.id, _tokens: tokens(a.name) }))

  let totalIng = 0, totalMatched = 0
  const perRecipe = []

  for (const r of recipes) {
    const list = Array.isArray(r.ingredients) ? r.ingredients : []
    const rows = []
    let matched = 0
    const unmatched = []

    for (const raw of list) {
      const p = parseIngredient(raw)
      const ingTokens = tokens(p.raw_name, true)
      totalIng++

      const cMatch = bestMatch(ingTokens, canonicalPool)
      const aMatch = cMatch ? null : bestMatch(ingTokens, archetypePool)

      let canonical_food_id = null, archetype_id = null, status = 'unmatched'
      if (cMatch) { canonical_food_id = cMatch.id; status = 'canonical'; matched++; totalMatched++ }
      else if (aMatch) { archetype_id = aMatch.id; status = 'archetype'; matched++; totalMatched++ }
      else unmatched.push(p.raw_name)

      rows.push({
        generated_recipe_id: r.id,
        raw_name: p.raw_name,
        quantity: p.quantity,
        unit: p.unit,
        notes: p.notes,
        canonical_food_id,
        archetype_id,
        match_status: status,
      })
    }

    // Idempotent : on remplace les liens de cette recette
    await supabase.from('generated_recipe_ingredients')
      .delete().eq('generated_recipe_id', r.id)
    if (rows.length) {
      const { error: insErr } = await supabase
        .from('generated_recipe_ingredients').insert(rows)
      if (insErr) {
        return NextResponse.json(
          { error: `Insertion échouée (recette ${r.id}): ${insErr.message}` },
          { status: 500 },
        )
      }
    }
    perRecipe.push({ recipe_id: r.id, title: r.title, total: list.length, matched, unmatched })
  }

  return NextResponse.json({
    recipes: perRecipe.length,
    ingredients_total: totalIng,
    ingredients_matched: totalMatched,
    match_rate: totalIng ? Math.round((totalMatched / totalIng) * 100) : 0,
    details: perRecipe,
  })
}
