/**
 * Résolveur d'ingrédients — texte libre → entité de stock (canonical_food / archetype).
 *
 * 100 % déterministe, AUCUN appel API. Source de vérité unique partagée par :
 *   - app/api/recipes/link-ingredients          (backfill / liaison à la demande)
 *   - app/api/ai/recipe                          (liaison auto après génération)
 *   - app/api/ai/plan/generate                   (liste de courses + liaison)
 *
 * Principes :
 *   1. Normalisation cohérente des deux côtés (accents, œ/æ, pluriels, ligatures).
 *   2. Cible privilégiée = niveau CANONIQUE (aliment de base propre côté CIQUAL).
 *      Les archétypes (produits transformés) ne gagnent que sur un vrai match
 *      spécifique (couverture complète de leur nom).
 *   3. BIAIS STOCK : à qualité de match comparable, on relie en priorité à
 *      l'entité réellement présente dans l'inventaire de l'utilisateur. C'est ce
 *      qui garantit que l'ingrédient pointe « sur le bon produit du stock ».
 *   4. Repli sur le mot-clé de base (noun) en retirant les modificateurs
 *      (couleur, état, découpe…) quand aucun match plein n'existe.
 */

// ───────────────────────── Normalisation ─────────────────────────

const STOP = new Set([
  'de', 'du', 'des', 'd', 'l', 'la', 'le', 'les', 'a', 'au', 'aux', 'en',
  'et', 'ou', 'avec', 'sans', 'the', 'un', 'une',
])

const UNITS = new Set([
  'g', 'gr', 'kg', 'mg', 'ml', 'cl', 'l', 'cs', 'cc', 'cuillere', 'cuilleres',
  'cuillère', 'cuillères', 'pincee', 'pincée', 'sachet', 'sachets', 'boite',
  'boîte', 'boites', 'boîtes', 'tranche', 'tranches', 'gousse', 'gousses',
  'botte', 'bottes', 'brin', 'brins', 'feuille', 'feuilles', 'filet', 'filets',
  'pave', 'pavé', 'pièce', 'piece', 'pièces', 'pieces', 'verre', 'verres',
  'tasse', 'tasses', 'dose', 'doses', 'noix', 'demi',
])

// Modificateurs (couleur / état / découpe / qualité) — retirés pour le repli
// sur le mot-clé de base. Ne JAMAIS retirer un mot qui peut être l'aliment lui-même.
const MODIFIERS = new Set([
  'rouge', 'rouges', 'vert', 'verte', 'verts', 'vertes', 'jaune', 'jaunes',
  'blanc', 'blanche', 'blancs', 'blanches', 'noir', 'noire', 'noirs', 'noires',
  'frais', 'fraiche', 'fraiches', 'sec', 'seche', 'seches', 'secs',
  'fume', 'fumee', 'fumes', 'fumees', 'pele', 'pelee', 'peles', 'pelees',
  'concasse', 'concassee', 'concassees', 'emince', 'emincee', 'emincees',
  'hache', 'hachee', 'haches', 'hachees', 'rape', 'rapee', 'rapes', 'rapees',
  'cuit', 'cuite', 'cuits', 'cuites', 'cru', 'crue', 'crus', 'crues',
  'mur', 'mure', 'murs', 'mures', 'surgele', 'surgelee', 'surgeles', 'surgelees',
  'congele', 'congelee', 'egoutte', 'egouttee', 'egouttes', 'egouttees',
  'doux', 'douce', 'demi', 'entier', 'entiere', 'bio', 'nature', 'natures',
  'morceau', 'morceaux', 'lamelle', 'lamelles', 'des', 'rondelle', 'rondelles',
  'petit', 'petite', 'petits', 'petites', 'gros', 'grosse', 'grosses',
  'moyen', 'moyenne', 'extra', 'fin', 'fine', 'fins', 'fines',
  // modes de cuisson / préparation
  'vapeur', 'saute', 'sautee', 'sautes', 'sautees', 'fondu', 'fondue', 'fondus', 'fondues',
  'roti', 'rotie', 'rotis', 'roties', 'grille', 'grillee', 'grilles', 'grillees',
  'four', 'poele', 'poelee', 'ecrase', 'ecrasee', 'ecrases', 'ecrasees',
  'confit', 'confite', 'confits', 'confites', 'braise', 'mijote', 'laque', 'laquee',
  'pane', 'panee', 'gratine', 'gratinee', 'marine', 'marinee', 'vierge', 'cru', 'crue',
])

// Synonymes (gauche normalisé → nom canonique normalisé visé). Couvre les cas où
// le nom courant diffère du nom canonique CIQUAL. Étendre au besoin.
const SYNONYMS = {
  'patate': 'pomme de terre',
  'patates': 'pomme de terre',
  'pdt': 'pomme de terre',
  'yaourt': 'yaourt',
  'yogourt': 'yaourt',
  'yoghourt': 'yaourt',
  'oeuf': 'oeuf',
  'oeufs': 'oeuf',
  'steak': 'boeuf',
  'steaks': 'boeuf',
  'steak hache': 'boeuf',
  'escalope de volaille': 'poulet',
  'escalopes de volaille': 'poulet',
  'blanc de volaille': 'poulet',
  'filet de volaille': 'poulet',
  'pois chiche': 'pois chiche',
  'pois chiches': 'pois chiche',
}

// Abréviations / variétés à expandre AU NIVEAU TOKEN (avant matching), pour
// regrouper « PDT vapeur », « grenaille », « frites four », « HV »… proprement.
const ABBREV = {
  pdt: 'pomme de terre', pdts: 'pomme de terre',
  grenaille: 'pomme de terre', grenailles: 'pomme de terre',
  frite: 'pomme de terre', // "frites" → singularisé "frite"
  hv: 'haricot vert', // haricots verts dans les descriptions
}

/** Normalise une chaîne alimentaire (accents, ligatures, ponctuation). */
export function normalizeFood(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-\s]+/g, ' ')
    .trim()
}

/** Singularise grossièrement un token français (pluriels réguliers). */
function singularize(t) {
  if (t.length > 3 && t.endsWith('aux')) return t.slice(0, -3) + 'al' // chevaux→cheval
  if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1)
  return t
}

/** Tokens normalisés, sans mots vides ni (option) unités. */
export function tokenize(str, { dropUnits = false } = {}) {
  return normalizeFood(str)
    .split(' ')
    .filter(Boolean)
    .map(singularize)
    .filter(t => t && !STOP.has(t) && (!dropUnits || !UNITS.has(t)))
}

// ───────────────────────── Parsing ingrédient ─────────────────────────

// Unités reconnues en TÊTE de nom (abréviations Routine incluses : « c.à.s »,
// « càc »…) → forme canonique comprise par food_qty_to_grams (SQL) et units.js.
// Alternatives ordonnées du plus long au plus court pour éviter les coupures
// (« gr » avant « g »). La frontière (espace / fin / point) est vérifiée après
// coup pour ne pas mordre dans un aliment (« g » de « gingembre »…).
const LEADING_UNIT_PATTERNS = [
  [/^(?:cuill[èe]res?\s+[àa]\s+soupe|c\.?\s*[àa]\.?\s*s|càs|cas|cs)/i, 'c. à soupe'],
  [/^(?:cuill[èe]res?\s+[àa]\s+caf[ée]|c\.?\s*[àa]\.?\s*c|càc|cac|cc)/i, 'c. à café'],
  [/^(?:kilogrammes?|kilos?|kg)/i, 'kg'],
  [/^(?:milligrammes?|mg)/i, 'mg'],
  [/^(?:grammes?|gr|g)/i, 'g'],
  [/^(?:millilitres?|ml)/i, 'ml'],
  [/^(?:centilitres?|cl)/i, 'cl'],
  [/^(?:décilitres?|decilitres?|dl)/i, 'dl'],
  [/^(?:litres?|l)/i, 'l'],
  [/^(?:rouleaux?)/i, 'rouleau'],
  [/^(?:bocaux|bocal)/i, 'bocal'],
  [/^(?:bo[îi]tes?)/i, 'boîte'],
  [/^(?:sachets?)/i, 'sachet'],
  [/^(?:bouquets?)/i, 'bouquet'],
  [/^(?:bottes?)/i, 'botte'],
  [/^(?:morceaux?)/i, 'morceau'],
  [/^(?:cm)/i, 'cm'],
  [/^(?:pinc[ée]es?)/i, 'pincée'],
  [/^(?:gousses?)/i, 'gousse'],
  [/^(?:tranches?)/i, 'tranche'],
  [/^(?:feuilles?)/i, 'feuille'],
  [/^(?:branches?)/i, 'branche'],
  [/^(?:brins?)/i, 'brin'],
  [/^(?:tiges?)/i, 'tige'],
  [/^(?:b[âa]tonnets?|b[âa]tons?)/i, 'bâton'],
  [/^(?:bulbes?)/i, 'bulbe'],
  [/^(?:poign[ée]es?)/i, 'poignée'],
  [/^(?:verres?)/i, 'verre'],
  [/^(?:tasses?)/i, 'tasse'],
  [/^(?:doses?)/i, 'dose'],
  [/^(?:pi[èe]ces?|unit[ée]s?)/i, 'pièce'],
]

/**
 * Détecte une unité en tête de chaîne → { unit, rest } ou null.
 * L'unité doit être suivie d'un espace, d'un point d'abréviation ou de la fin —
 * jamais d'une autre lettre — pour ne pas tronquer un aliment.
 */
export function matchLeadingUnit(str) {
  const s = String(str || '').replace(/^\s+/, '')
  for (const [re, unit] of LEADING_UNIT_PATTERNS) {
    const m = s.match(re)
    if (!m) continue
    let after = s.slice(m[0].length)
    if (after.startsWith('.')) after = after.slice(1) // point d'abréviation
    if (after.length && !/^\s/.test(after)) continue   // collée à une lettre → faux positif
    return { unit, rest: after.replace(/^\s+/, '') }
  }
  return null
}

/** "200 g lentilles vertes" / { name, quantity, unit } → { raw_name, quantity, unit, notes } */
export function parseIngredient(raw) {
  let raw_name = ''
  let quantity = null
  let unit = null
  let notes = null

  if (raw && typeof raw === 'object') {
    raw_name = String(raw.name ?? raw.item ?? '').trim() || JSON.stringify(raw)
    quantity = raw.quantity != null && raw.quantity !== '' ? Number(raw.quantity) : null
    if (!Number.isFinite(quantity)) quantity = null
    unit = raw.unit ? String(raw.unit).trim() : null
    notes = raw.notes || null
  } else {
    const s = String(raw || '').trim()
    // Quantité en tête, le reste est le nom (+ éventuelle unité collée).
    const m = s.match(/^(\d+(?:[.,]\d+)?)\s*([\s\S]*)$/)
    if (m) {
      const n = parseFloat(m[1].replace(',', '.'))
      quantity = Number.isFinite(n) ? n : null
      raw_name = m[2].trim() || s
    } else {
      raw_name = s
    }
  }

  // Normalisation de l'unité : unité explicite, sinon unité « collée » en tête
  // de nom (« g chèvre », « c.à.s huile »…), sinon comptage en pièces.
  if (unit) {
    const mu = matchLeadingUnit(unit)
    if (mu && mu.rest === '') unit = mu.unit
  }
  if (!unit && raw_name) {
    const mu = matchLeadingUnit(raw_name)
    if (mu) { unit = mu.unit; raw_name = mu.rest || raw_name }
  }
  // Retirer un « de / d' » de liaison résiduel (« 1 rouleau de pâte »).
  raw_name = String(raw_name || '').replace(/^(?:de\s+|d['’]\s*)/i, '').trim()
  // Quantité présente mais aucune unité reconnue → l'ingrédient est compté en pièces
  // (« 3 courgettes », « 6 œufs »). food_qty_to_grams convertit via le poids unitaire.
  if (!unit && quantity != null && raw_name) unit = 'pièce'

  const fallbackName = typeof raw === 'string' ? raw.trim() : String(raw?.name ?? raw?.item ?? '').trim()
  return { raw_name: raw_name || fallbackName, quantity, unit: unit || null, notes }
}

// ───────────────── Auto-croissance du catalogue (conservateur) ─────────────────

// Mots qui ne doivent jamais devenir un canonique autonome :
// découpes, qualificatifs, génériques, non-aliments. Évite la pollution.
const BLOCKLIST_CREATE = new Set([
  // découpes / morceaux
  'steak', 'filet', 'escalope', 'pave', 'cuisse', 'dos', 'aiguillette', 'blanc',
  'morceau', 'tranche', 'lamelle', 'rondelle', 'cube', 'gigot', 'roti', 'cote',
  // qualificatifs / états
  'maison', 'nature', 'bio', 'option', 'frais', 'surgele', 'fine', 'moyenne',
  // génériques / catégories (trop vagues)
  'sauce', 'jus', 'fond', 'mix', 'melange', 'plat', 'portion', 'huile', 'huiles',
  'herbe', 'herbes', 'aromate', 'aromates', 'epice', 'epices', 'condiment',
  'condiments', 'graine', 'graines', 'garniture', 'accompagnement', 'feculent',
  'legume', 'legumes', 'viande', 'viandes', 'poisson', 'poissons', 'fruit', 'fruits',
  // non-aliments / artefacts
  'semaine', 'jour', 'midi', 'soir', 'eau',
])

/**
 * Mode CONSERVATEUR : propose un nom de canonique PROPRE à créer pour un
 * ingrédient non résolu, ou null si on ne doit rien créer. On ne crée que pour
 * un MOT UNIQUE propre (pas de quantité, marque, découpe, générique, synonyme).
 * Ex: « Tofu fumé » → "tofu", « Gochujang » → "gochujang", « Daikon » → "daikon",
 *     « Saumon frais qualité sashimi » → null (3 mots), « Steak » → null (découpe),
 *     « Herbes fraîches » → null (générique), « Pastis » → "pastis" (pas de "pasti").
 */
export function proposeCanonicalName(rawName) {
  const parsed = parseIngredient(rawName)
  // Retire le contenu entre parenthèses ("(pour le rougail)", marques…)
  const name = String(parsed.raw_name || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  if (SYNONYMS[normalizeFood(name)] != null) return null // doit se mapper ailleurs

  // Tokens SANS singularisation (évite "pastis" → "pasti").
  const toks = normalizeFood(name)
    .split(' ')
    .filter(Boolean)
    .filter(t => !STOP.has(t) && !UNITS.has(t) && !MODIFIERS.has(t) && !/^\d+$/.test(t))
  if (toks.length !== 1) return null              // conservateur : un seul mot
  const w = toks[0]
  const sing = singularize(w)
  if (w.length < 3) return null
  if (BLOCKLIST_CREATE.has(w) || BLOCKLIST_CREATE.has(sing)) return null
  if (SYNONYMS[w] != null || SYNONYMS[sing] != null) return null
  return w
}

// ───────────────────────── Index catalogue ─────────────────────────

/**
 * Construit l'index de résolution à partir des catalogues.
 * @param {object} p
 * @param {Array} p.canonicalFoods  [{ id, canonical_name, keywords? }]
 * @param {Array} p.archetypes      [{ id, name, canonical_food_id, is_default? }]
 * @param {Array} [p.cultivars]     [{ id, canonical_food_id, cultivar_name, synonyms? }]
 * @returns {Array} candidats { canonical_food_id, archetype_id, tier, labelTokens, specificity, is_default }
 */
export function buildCatalogIndex({ canonicalFoods = [], archetypes = [], cultivars = [] }) {
  const candidates = []

  for (const c of canonicalFoods) {
    const labels = [c.canonical_name, ...(Array.isArray(c.keywords) ? c.keywords : [])]
    for (const label of labels) {
      const labelTokens = tokenize(label)
      if (!labelTokens.length) continue
      candidates.push({
        canonical_food_id: c.id,
        archetype_id: null,
        tier: 'canonical',
        labelTokens,
        specificity: labelTokens.length,
        is_default: true, // un canonique est toujours une cible « propre »
      })
    }
  }

  for (const a of archetypes) {
    const labelTokens = tokenize(a.name)
    if (!labelTokens.length) continue
    candidates.push({
      canonical_food_id: a.canonical_food_id || null,
      archetype_id: a.id,
      tier: 'archetype',
      labelTokens,
      specificity: labelTokens.length,
      is_default: !!a.is_default,
    })
  }

  for (const cv of cultivars) {
    const labels = [cv.cultivar_name, ...(Array.isArray(cv.synonyms) ? cv.synonyms : [])]
    for (const label of labels) {
      const labelTokens = tokenize(label)
      if (!labelTokens.length) continue
      candidates.push({
        canonical_food_id: cv.canonical_food_id || null,
        archetype_id: null,
        tier: 'cultivar',
        labelTokens,
        specificity: labelTokens.length,
        is_default: false,
      })
    }
  }

  return candidates
}

/** Un candidat est-il présent dans le stock de l'utilisateur ? */
function isInStock(cand, stock) {
  if (!stock) return false
  if (cand.archetype_id && stock.archetypeIds?.has(cand.archetype_id)) return true
  if (cand.canonical_food_id && stock.canonicalIds?.has(cand.canonical_food_id)) return true
  return false
}

/**
 * Compare deux candidats tier-1 (couverture complète). Retourne true si `a` est
 * meilleur que `b`. Ordre : stock d'abord → plus spécifique → canonique → défaut
 * → moins de bruit.
 */
function better(a, b, stock) {
  const aStock = isInStock(a, stock), bStock = isInStock(b, stock)
  if (aStock !== bStock) return aStock
  if (a.specificity !== b.specificity) return a.specificity > b.specificity
  // À spécificité égale, préférer le canonique (cible générique stable)
  const aCanon = a.tier === 'canonical', bCanon = b.tier === 'canonical'
  if (aCanon !== bCanon) return aCanon
  if (a.is_default !== b.is_default) return a.is_default
  return a.labelTokens.length < b.labelTokens.length
}

// ───────────────────────── Résolution ─────────────────────────

/**
 * Résout des tokens d'ingrédient en une entité.
 * @returns {{canonical_food_id, archetype_id, match_status, confidence}}
 */
export function resolveTokens(ingTokensRaw, candidates, stock) {
  const ingTokens = ingTokensRaw.filter(Boolean)
  if (!ingTokens.length) return { canonical_food_id: null, archetype_id: null, match_status: 'unmatched', confidence: 0 }
  const ingSet = new Set(ingTokens)

  // Tier 1 : tous les tokens du candidat sont présents dans l'ingrédient.
  let best = null
  for (const cand of candidates) {
    if (cand.labelTokens.length > ingTokens.length + 1) continue // garde-fou perf
    if (!cand.labelTokens.every(t => ingSet.has(t))) continue
    if (!best || better(cand, best, stock)) best = cand
  }
  if (best) {
    const inStock = isInStock(best, stock)
    const isArch = best.tier === 'archetype'
    // Contrainte gri_not_both_entities : une ligne porte canonical_food_id OU
    // archetype_id, jamais les deux. Pour un archétype, on ne pose que l'archétype
    // (son canonique parent est retrouvé via la jointure côté lecture).
    return {
      canonical_food_id: isArch ? null : best.canonical_food_id,
      archetype_id: isArch ? best.archetype_id : null,
      match_status: inStock ? 'stock' : best.tier,
      confidence: inStock ? 0.95 : (best.tier === 'canonical' ? 0.85 : 0.8),
    }
  }

  // Tier 2 : repli mot-clé de base. On retire les modificateurs et on cherche un
  // canonique dont le nom (1 token) est présent dans l'ingrédient.
  const headTokens = ingTokens.filter(t => !MODIFIERS.has(t))
  const headSet = new Set(headTokens.length ? headTokens : ingTokens)
  let fallback = null
  for (const cand of candidates) {
    if (cand.tier === 'archetype') continue // repli vise le niveau de base
    if (cand.labelTokens.length !== 1) continue
    if (!headSet.has(cand.labelTokens[0])) continue
    if (!fallback || better(cand, fallback, stock)) fallback = cand
  }
  if (fallback) {
    const inStock = isInStock(fallback, stock)
    return {
      canonical_food_id: fallback.canonical_food_id,
      archetype_id: null,
      match_status: inStock ? 'stock' : 'canonical',
      confidence: inStock ? 0.7 : 0.55,
    }
  }

  return { canonical_food_id: null, archetype_id: null, match_status: 'unmatched', confidence: 0 }
}

/**
 * Résout un ingrédient brut (string ou objet) en entité + métadonnées de quantité.
 */
export function resolveIngredient(raw, { candidates, stock }) {
  const parsed = parseIngredient(raw)
  let nameForMatch = parsed.raw_name
  const synonymKey = normalizeFood(nameForMatch)
  if (SYNONYMS[synonymKey] != null) nameForMatch = SYNONYMS[synonymKey] || nameForMatch
  let ingTokens = tokenize(nameForMatch, { dropUnits: true })
  // Expansion des abréviations/variétés au niveau token (pdt → pomme de terre…)
  ingTokens = ingTokens.flatMap(t => (ABBREV[t] ? tokenize(ABBREV[t]) : [t]))
  let res = resolveTokens(ingTokens, candidates, stock)

  // Dernier repli : nom coupé par un retour ligne (artefact richText Excel /
  // JSON Routine), ex. « citro n », « oigno n », « échalot e ». On retente avec
  // les espaces internes supprimés ; n'accepte que si ça produit un match (ne
  // casse donc jamais un vrai multi-mots comme « pois chiche »).
  if (res.match_status === 'unmatched') {
    const collapsed = normalizeFood(nameForMatch).replace(/\s+/g, '')
    if (collapsed.length >= 3) {
      const retry = resolveTokens([collapsed], candidates, stock)
      if (retry.match_status !== 'unmatched') res = retry
    }
  }
  return { ...parsed, ...res }
}

// ───────────────────────── Accès données ─────────────────────────

/**
 * Charge les catalogues + le stock de l'utilisateur et construit l'index.
 * @returns {{candidates, stock}}
 */
export async function loadResolverData(supabase, userId) {
  const [{ data: cfs }, { data: archs }, { data: cvs }, stock] = await Promise.all([
    supabase.from('canonical_foods').select('id, canonical_name, keywords'),
    supabase.from('archetypes').select('id, name, canonical_food_id, is_default'),
    supabase.from('cultivars').select('id, canonical_food_id, cultivar_name, synonyms'),
    loadStock(supabase, userId),
  ])

  const candidates = buildCatalogIndex({
    canonicalFoods: cfs || [],
    archetypes: archs || [],
    cultivars: cvs || [],
  })

  // Index nom normalisé → id (dédup pour l'auto-création).
  const canonicalByNormName = new Map()
  for (const c of (cfs || [])) {
    const key = tokenize(c.canonical_name).join(' ')
    if (key && !canonicalByNormName.has(key)) canonicalByNormName.set(key, c.id)
  }

  return { candidates, stock, canonicalByNormName }
}

/**
 * Crée un canonique propre pour un ingrédient non résolu (mode conservateur), ou
 * retourne null. Met à jour l'index en mémoire pour réutilisation dans le lot.
 * Déterministe, sans API. Idempotent (dédup + repli sur l'existant en cas de course).
 */
export async function maybeCreateCanonical(supabase, rawName, ctx) {
  const w = proposeCanonicalName(rawName)
  if (!w) return null
  if (ctx.canonicalByNormName?.has(w)) return ctx.canonicalByNormName.get(w)

  const { data, error } = await supabase
    .from('canonical_foods')
    .insert({ canonical_name: w, primary_unit: 'g' })
    .select('id')
    .single()

  let id = data?.id || null
  if (error || !id) {
    // Contrainte unique / course : retomber sur l'existant.
    const { data: ex } = await supabase
      .from('canonical_foods').select('id').eq('canonical_name', w).limit(1)
    id = ex?.[0]?.id || null
  }
  if (!id) return null

  ctx.canonicalByNormName?.set(w, id)
  ctx.candidates?.push({
    canonical_food_id: id, archetype_id: null, tier: 'canonical',
    labelTokens: [w], specificity: 1, is_default: true,
  })
  return id
}

/** Ensembles des canonical/archetype présents dans l'inventaire (qty > 0). */
async function loadStock(supabase, userId) {
  const canonicalIds = new Set()
  const archetypeIds = new Set()
  if (!userId) return { canonicalIds, archetypeIds }

  // Vue résolue : chaque lot porte son canonical effectif (variantes incluses).
  const { data, error } = await supabase
    .from('inventory_lots_resolved')
    .select('resolved_canonical_food_id, resolved_archetype_id, qty_remaining')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)

  if (!error && data) {
    for (const lot of data) {
      if (lot.resolved_canonical_food_id) canonicalIds.add(lot.resolved_canonical_food_id)
      if (lot.resolved_archetype_id) archetypeIds.add(lot.resolved_archetype_id)
    }
    return { canonicalIds, archetypeIds }
  }

  // Repli si la vue est absente : table brute.
  const { data: raw } = await supabase
    .from('inventory_lots')
    .select('canonical_food_id, archetype_id, qty_remaining')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)
  for (const lot of (raw || [])) {
    if (lot.canonical_food_id) canonicalIds.add(lot.canonical_food_id)
    if (lot.archetype_id) archetypeIds.add(lot.archetype_id)
  }
  return { canonicalIds, archetypeIds }
}

// ───────────────────────── Écriture liaison ─────────────────────────

/**
 * Relie les ingrédients d'UNE recette générée et réécrit generated_recipe_ingredients.
 * Idempotent (delete + insert).
 * @returns {{total, matched, unmatched: string[]}}
 */
export async function linkRecipeIngredients(supabase, recipe, data, { autoCreate = true } = {}) {
  const { candidates, stock } = data
  const list = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const rows = []
  const unmatched = []
  let matched = 0
  let created = 0

  for (const raw of list) {
    const r = resolveIngredient(raw, { candidates, stock })
    let { canonical_food_id, archetype_id, match_status } = r

    // Auto-croissance conservatrice : si non résolu, créer un canonique propre.
    if (match_status === 'unmatched' && autoCreate) {
      const newId = await maybeCreateCanonical(supabase, r.raw_name, data)
      if (newId) { canonical_food_id = newId; archetype_id = null; match_status = 'canonical'; created++ }
    }

    if (match_status !== 'unmatched') matched++
    else unmatched.push(r.raw_name)
    rows.push({
      generated_recipe_id: recipe.id,
      raw_name: r.raw_name,
      quantity: r.quantity,
      unit: r.unit,
      notes: r.notes,
      canonical_food_id,
      archetype_id,
      match_status,
    })
  }

  await supabase.from('generated_recipe_ingredients').delete().eq('generated_recipe_id', recipe.id)
  if (rows.length) {
    const { error } = await supabase.from('generated_recipe_ingredients').insert(rows)
    if (error) throw new Error(`Insertion liaison échouée (recette ${recipe.id}): ${error.message}`)
  }
  return { total: list.length, matched, created, unmatched }
}

/**
 * Relie une ou toutes les recettes d'un utilisateur. Charge les données une fois.
 * @param {object} opts { recipeId?, all?, onlyUnlinked? }
 */
export async function linkRecipesForUser(supabase, userId, { recipeId, all, onlyUnlinked, autoCreate = true } = {}) {
  let rq = supabase.from('generated_recipes').select('id, title, ingredients').eq('user_id', userId)
  if (recipeId) rq = rq.eq('id', recipeId)
  const { data: recipes, error } = await rq
  if (error) throw new Error(`Lecture recettes: ${error.message}`)
  if (!recipes?.length) return { recipes: 0, ingredients_total: 0, ingredients_matched: 0, created: 0, match_rate: 0, details: [] }

  let targets = recipes
  if (onlyUnlinked) {
    const ids = recipes.map(r => r.id)
    const { data: existing } = await supabase
      .from('generated_recipe_ingredients')
      .select('generated_recipe_id')
      .in('generated_recipe_id', ids)
    const linkedSet = new Set((existing || []).map(e => e.generated_recipe_id))
    targets = recipes.filter(r => !linkedSet.has(r.id))
  }

  const data = await loadResolverData(supabase, userId)

  let totalIng = 0, totalMatched = 0, totalCreated = 0
  const details = []
  for (const recipe of targets) {
    const { total, matched, created, unmatched } = await linkRecipeIngredients(supabase, recipe, data, { autoCreate })
    totalIng += total
    totalMatched += matched
    totalCreated += created
    details.push({ recipe_id: recipe.id, title: recipe.title, total, matched, created, unmatched })
  }

  return {
    recipes: targets.length,
    ingredients_total: totalIng,
    ingredients_matched: totalMatched,
    created: totalCreated,
    match_rate: totalIng ? Math.round((totalMatched / totalIng) * 100) : 0,
    details,
  }
}
