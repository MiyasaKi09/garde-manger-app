/**
 * Décision de conservation pure et déterministe.
 *
 * Les durées du catalogue ne sont pas des instructions de rangement : le fait
 * qu'un aliment puisse être congelé ne signifie pas qu'il a été acheté congelé.
 * Cette fonction choisit d'abord un lieu sûr, puis calcule la date à partir de
 * la meilleure source disponible (étiquette > politique > catalogue > règle
 * conservatrice). Elle ne transforme jamais une valeur inconnue en « 90 jours ».
 */

export const STORAGE_POLICY_VERSION = 'storage-v1-2026-07-13'

export const STORAGE_METHODS = ['pantry', 'fridge', 'freezer']

export const STORAGE_PLACES = {
  pantry: 'Garde-manger',
  fridge: 'Frigo',
  freezer: 'Congélateur',
}

const SHELF_FIELDS = {
  pantry: 'shelf_life_days_pantry',
  fridge: 'shelf_life_days_fridge',
  freezer: 'shelf_life_days_freezer',
}

const FROZEN_RE = /\b(surgel(?:e|é|ée|es|és|ées)?|congel(?:e|é|ée|es|és|ées)?|glace(?:e|é|ée)?)\b/i
const SHELF_STABLE_RE = /\b(conserve|bocal|bo[iî]te|s[ée]ch[ée]|d[ée]shydrat|uht|st[ée]rilis|appertis|poudre|farine|riz|p[aâ]tes?|semoule|quinoa|lentilles?|pois chiches?|haricots? secs?|sucre|sel|huile|vinaigre|[ée]pices?)\b/i
const RAW_POULTRY_RE = /\b(pintade|poulet|dinde|canard|oie|caille|volaille|supr[eê]mes?)\b/i
const RAW_MEAT_RE = /\b(viande|b[œo]uf|porc|veau|agneau|lapin|steak|escalope|saucisse|merguez|hach[ée])\b/i
const RAW_FISH_RE = /\b(poisson|saumon|cabillaud|merlu|dorade|truite|thon frais|crustac[ée]|crevette)\b/i
const CHILLED_RE = /\b(frais|fra[iî]che|r[ée]frig[ée]r|cr[eè]me|yaourt|skyr|fromage|beurre|lait pasteuris[ée]|jambon|charcuterie|lardons|bacon|œuf|oeuf)\b/i
const CHILLED_PRODUCE_RE = /\b(salade|laitue|concombre|courgette|aubergine|poivron|brocoli|chou|fenouil|navet|radis|carotte|poireau|champignon|[ée]pinard|haricot.?vert|asperge|c[ée]leri|betterave|endive|m[aâ]che|roquette|persil|coriandre|menthe|basilic|ciboulette|fraise|framboise|myrtille)\b/i
const CHILLED_CATEGORY_RE = /viande|poisson|produit frais|cr[ée]merie|laitier|fromage|charcuterie|surgel|fruits? et l[ée]gumes/i
const PANTRY_CATEGORY_RE = /[ée]picerie|boisson|conserve|boulangerie|condiment|f[ée]culent/i

export function normalizeStorageDays(value) {
  if (value === null || value === undefined || value === '') return null
  const days = Number(value)
  return Number.isFinite(days) && days >= 0 ? Math.trunc(days) : null
}

export function shelfLifeMap(record = {}) {
  return Object.fromEntries(
    STORAGE_METHODS.map(method => [method, normalizeStorageDays(record?.[SHELF_FIELDS[method]])])
  )
}

export function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

export function addDaysUtc(isoDate, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ''))
  if (!match || !Number.isFinite(Number(days))) return null
  const [, year, month, day] = match.map(Number)
  return new Date(Date.UTC(year, month - 1, day + Number(days))).toISOString().slice(0, 10)
}

export function normalizeIsoDate(value) {
  if (!value) return null
  const iso = String(value).slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
    ? iso
    : null
}

function textOf(name, category) {
  return `${name || ''} ${category || ''}`.trim().toLowerCase()
}

function isShelfStable(text) {
  return SHELF_STABLE_RE.test(text)
}

function isRawPoultry(text) {
  return RAW_POULTRY_RE.test(text) && !isShelfStable(text) && !/bouillon|fond|rillettes|p[aâ]t[ée]|terrine/i.test(text)
}

function highRiskKind(text) {
  if (isRawPoultry(text)) return 'poultry'
  if (RAW_FISH_RE.test(text) && !isShelfStable(text)) return 'fish'
  if (RAW_MEAT_RE.test(text) && !isShelfStable(text)) return 'meat'
  return null
}

function matchingPolicies(policies, foodState, purchaseState) {
  return (policies || []).filter(policy => {
    const stateMatches = !policy.food_state || policy.food_state === 'any' || policy.food_state === foodState
    const purchaseMatches = !policy.purchase_state || policy.purchase_state === 'any' || policy.purchase_state === purchaseState
    return stateMatches && purchaseMatches && policy.active !== false
  })
}

function bestPolicy(policies, method) {
  return policies
    .filter(policy => policy.storage_method === method)
    .sort((a, b) => {
      const entitySpecificity = Number(Boolean(b.archetype_id)) - Number(Boolean(a.archetype_id))
      if (entitySpecificity) return entitySpecificity
      const suitability = { recommended: 3, allowed: 2, unknown: 1, forbidden: 0 }
      return (suitability[b.suitability] || 0) - (suitability[a.suitability] || 0)
    })[0] || null
}

function fallbackDays(text, method, riskKind) {
  if (method === 'freezer') return 180
  if (method === 'fridge') {
    if (riskKind === 'poultry') return 2
    if (riskKind === 'fish') return 2
    if (riskKind === 'meat') return 3
    if (/\b(lait pasteuris[ée]|cr[eè]me)\b/i.test(text)) return 7
    if (/\b(yaourt|skyr)\b/i.test(text)) return 21
    if (/\b(fromage|beurre)\b/i.test(text)) return 21
    if (/\b(œuf|oeuf)\b/i.test(text)) return 28
    if (CHILLED_PRODUCE_RE.test(text)) return 7
    return 7
  }
  if (method === 'pantry' && isShelfStable(text)) return 365
  return null
}

function dateDecision({ labelUseByDate, labelBestBeforeDate, acquiredOn, durationDays, durationSource }) {
  const useBy = normalizeIsoDate(labelUseByDate)
  const bestBefore = normalizeIsoDate(labelBestBeforeDate)
  if (useBy) {
    return { expirationDate: useBy, expiryKind: 'DLC', expirationSource: 'label_use_by' }
  }
  if (bestBefore) {
    return { expirationDate: bestBefore, expiryKind: 'DDM', expirationSource: 'label_best_before' }
  }
  return {
    expirationDate: durationDays > 0 ? addDaysUtc(acquiredOn, durationDays) : null,
    expiryKind: durationDays > 0 ? 'estimate' : 'unknown',
    expirationSource: durationDays > 0 ? durationSource : 'unknown',
  }
}

/**
 * @returns {{valid: boolean, method: string|null, place: string|null,
 *   shelfLifeDays: number|null, expirationDate: string|null,
 *   requiresConfirmation: boolean, forbiddenMethods: string[], reason: string}}
 */
export function decideStorage({
  name,
  category = '',
  purchaseState = 'unknown',
  foodState = 'unknown',
  explicitStorageMethod = null,
  labelUseByDate = null,
  labelBestBeforeDate = null,
  acquiredOn = todayIso(),
  archetype = null,
  canonical = null,
  policies = [],
} = {}) {
  const text = textOf(name, category)
  const acquired = normalizeIsoDate(acquiredOn) || todayIso()
  const normalizedPurchaseState = FROZEN_RE.test(text) ? 'frozen' : purchaseState
  const riskKind = highRiskKind(text)
  const effectiveFoodState = riskKind ? 'raw' : foodState
  const applicablePolicies = matchingPolicies(policies, effectiveFoodState, normalizedPurchaseState)
  const archetypeDays = shelfLifeMap(archetype)
  const canonicalDays = shelfLifeMap(canonical)

  const forbidden = new Set()
  for (const method of STORAGE_METHODS) {
    const policy = bestPolicy(applicablePolicies, method)
    if (policy?.suitability === 'forbidden') forbidden.add(method)
    // Zéro signifie explicitement « interdit ». NULL reste « inconnu ».
    if (
      archetypeDays[method] === 0
      || (archetypeDays[method] === null && canonicalDays[method] === 0)
    ) forbidden.add(method)
  }
  if (riskKind) forbidden.add('pantry')

  if (explicitStorageMethod && !STORAGE_METHODS.includes(explicitStorageMethod)) {
    return invalidDecision('Mode de conservation invalide', forbidden)
  }
  if (explicitStorageMethod && forbidden.has(explicitStorageMethod)) {
    return invalidDecision(`${STORAGE_PLACES[explicitStorageMethod]} interdit pour ce produit`, forbidden)
  }

  let method = explicitStorageMethod
  let storageSource = explicitStorageMethod ? 'user_confirmation' : null
  let confidence = explicitStorageMethod ? 1 : 0
  let reason = explicitStorageMethod ? 'Lieu confirmé par vous' : ''

  if (!method && normalizedPurchaseState === 'frozen' && !forbidden.has('freezer')) {
    method = 'freezer'
    storageSource = 'purchase_state'
    confidence = 0.99
    reason = 'Produit acheté surgelé'
  }

  if (!method) {
    const recommended = applicablePolicies.filter(policy =>
      policy.suitability === 'recommended' && !forbidden.has(policy.storage_method)
    )
    if (recommended.length > 0) {
      method = recommended[0].storage_method
      storageSource = 'storage_policy'
      confidence = Number(recommended[0].confidence ?? 0.95)
      reason = recommended[0].reason || 'Politique de conservation vérifiée'
    }
  }

  if (!method && riskKind && !forbidden.has('fridge')) {
    method = 'fridge'
    storageSource = 'food_safety_rule'
    confidence = 0.98
    reason = riskKind === 'poultry'
      ? 'Volaille fraîche : conservation au réfrigérateur'
      : 'Produit animal frais : conservation au réfrigérateur'
  }

  if (!method) {
    const knownMethods = STORAGE_METHODS.filter(candidate => {
      if (forbidden.has(candidate)) return false
      return archetypeDays[candidate] > 0 || canonicalDays[candidate] > 0
    })
    if (knownMethods.length === 1) {
      method = knownMethods[0]
      storageSource = archetypeDays[method] > 0 ? 'archetype_catalog' : 'canonical_catalog'
      confidence = 0.9
      reason = 'Seul lieu compatible dans le catalogue'
    } else if (knownMethods.includes('fridge') && !knownMethods.includes('pantry')) {
      // Frigo + congélateur : le congélateur est une possibilité, pas le lieu
      // d'achat par défaut. C'est précisément le cas de la pintade.
      method = 'fridge'
      storageSource = 'catalog_default_chilled'
      confidence = 0.92
      reason = 'Produit frais pouvant aussi être congelé'
    }
  }

  if (!method && (CHILLED_RE.test(text) || CHILLED_PRODUCE_RE.test(text) || CHILLED_CATEGORY_RE.test(category))) {
    method = 'fridge'
    storageSource = 'category_rule'
    confidence = 0.78
    reason = 'Rayon frais ou produit réfrigéré'
  }
  if (!method && (isShelfStable(text) || PANTRY_CATEGORY_RE.test(category)) && !forbidden.has('pantry')) {
    method = 'pantry'
    storageSource = 'category_rule'
    confidence = isShelfStable(text) ? 0.88 : 0.72
    reason = 'Produit stable à température ambiante'
  }

  if (!method) {
    return {
      ...invalidDecision('Lieu de conservation à confirmer', forbidden),
      valid: true,
      requiresConfirmation: true,
    }
  }

  const policy = bestPolicy(applicablePolicies, method)
  let shelfLifeDays = normalizeStorageDays(policy?.duration_days)
  let durationSource = shelfLifeDays > 0 ? 'storage_policy' : null
  if (!(shelfLifeDays > 0) && archetypeDays[method] > 0) {
    shelfLifeDays = archetypeDays[method]
    durationSource = 'archetype_catalog'
  }
  if (!(shelfLifeDays > 0) && canonicalDays[method] > 0) {
    shelfLifeDays = canonicalDays[method]
    durationSource = 'canonical_catalog'
  }
  if (!(shelfLifeDays > 0)) {
    shelfLifeDays = fallbackDays(text, method, riskKind)
    durationSource = shelfLifeDays > 0 ? 'conservative_rule' : 'unknown'
  }

  const dates = dateDecision({
    labelUseByDate,
    labelBestBeforeDate,
    acquiredOn: acquired,
    durationDays: shelfLifeDays,
    durationSource,
  })

  return {
    valid: true,
    method,
    place: STORAGE_PLACES[method],
    shelfLifeDays: shelfLifeDays > 0 ? shelfLifeDays : null,
    expirationDate: dates.expirationDate,
    expiryKind: dates.expiryKind,
    storageSource,
    expirationSource: dates.expirationSource,
    confidence,
    policyVersion: policy?.policy_version || STORAGE_POLICY_VERSION,
    requiresConfirmation: false,
    needsReview: !dates.expirationDate || confidence < 0.75,
    forbiddenMethods: [...forbidden],
    reason,
  }
}

function invalidDecision(error, forbidden) {
  return {
    valid: false,
    method: null,
    place: null,
    shelfLifeDays: null,
    expirationDate: null,
    expiryKind: 'unknown',
    storageSource: 'unknown',
    expirationSource: 'unknown',
    confidence: 0,
    policyVersion: STORAGE_POLICY_VERSION,
    requiresConfirmation: true,
    needsReview: true,
    forbiddenMethods: [...forbidden],
    reason: error,
    error,
  }
}
