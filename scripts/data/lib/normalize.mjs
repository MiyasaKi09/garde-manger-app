/**
 * Fabrique de données V2 — normalisation PURE (aucun I/O).
 * Réf. MYKO_DATA_FOUNDATION_V2 §5.5, §5.8. Testé par tests/data/normalize.test.js.
 */

/** Normalisation texte : minuscules, Unicode NFC, accents retirés pour la clé, espaces/ponctuation. */
export function normalizeName(raw) {
  if (raw == null) return ''
  return String(raw)
    .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae') // ligatures (œuf → oeuf) — NFD ne les décompose pas
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques (clé normalisée)
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Parse une valeur numérique Ciqual (virgule décimale française + marqueurs).
 * @returns {{amount:number|null, status:string}}
 *   status ∈ measured | trace | estimated | not_available
 */
export function parseCiqualValue(v) {
  if (v == null) return { amount: null, status: 'not_available' }
  if (typeof v === 'number') {
    return Number.isFinite(v) ? { amount: v, status: 'measured' } : { amount: null, status: 'not_available' }
  }
  const s = String(v).trim()
  if (s === '' || s === '-') return { amount: null, status: 'not_available' }
  if (/^traces$/i.test(s)) return { amount: 0, status: 'trace' }
  // "< 0,01" → borne de détection : valeur estimée = la borne.
  const lt = s.match(/^<\s*([0-9]+(?:[.,][0-9]+)?)$/)
  if (lt) return { amount: toNumber(lt[1]), status: 'estimated' }
  const n = toNumber(s)
  return n == null ? { amount: null, status: 'not_available' } : { amount: n, status: 'measured' }
}

function toNumber(s) {
  const n = Number(String(s).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Extrait le concept (1er segment avant virgule) + attributs d'état d'un libellé Ciqual. */
export function parseFoodName(label) {
  const full = String(label || '').trim()
  const segments = full.split(',').map((s) => s.trim()).filter(Boolean)
  const concept = segments[0] || full
  const rest = segments.slice(1).join(' ').toLowerCase()
  const hay = full.toLowerCase()

  const has = (re) => re.test(hay)
  let cooking_state = null
  if (has(/\bcrue?s?\b/)) cooking_state = 'raw'
  else if (has(/\bcuite?s?\b|\brôtie?s?\b|\bgrillée?s?\b|\bbouillie?s?\b|\bfrite?s?\b|\bpoêlée?s?\b|\bà l'étuvée\b|\bau four\b/)) cooking_state = 'cooked'

  let preservation_state = null
  if (has(/\bsurgelée?s?\b|\bcongelée?s?\b/)) preservation_state = 'frozen'
  else if (has(/\bappertisée?s?\b|\bconserve\b|\ben boîte\b/)) preservation_state = 'canned'
  else if (has(/\bséchée?s?\b|\bdéshydratée?s?\b|\blyophilisée?s?\b/)) preservation_state = 'dried'
  else if (has(/\bfraîche?s?\b|\bfrais\b/)) preservation_state = 'fresh'

  let physical_state = null
  if (has(/\bpoudre\b|\bmoulue?\b/)) physical_state = 'powder'
  else if (has(/\bpurée\b|\bmixée?\b/)) physical_state = 'puree'
  else if (has(/\bjus\b|\bliquide\b/)) physical_state = 'liquid'

  let bone_state = null
  if (has(/\bdésossée?s?\b|\bsans os\b|\bfilet\b|\bescalope\b/)) bone_state = 'boneless'
  else if (has(/\bavec os\b/)) bone_state = 'bone_in'

  let skin_state = null
  if (has(/\bsans peau\b/)) skin_state = 'skinless'
  else if (has(/\bavec peau\b/)) skin_state = 'with_skin'

  return { concept, rest, cooking_state, preservation_state, physical_state, bone_state, skin_state }
}
