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
 * Parse une mesure Ciqual sans transformer une absence ou une borne en valeur.
 *
 * La documentation Ciqual 2025 impose de ne jamais assimiler une valeur
 * manquante à zéro. « traces » signifie présent mais non quantifiable (ou
 * présumé très faible), tandis que « < x » est une borne supérieure et non une
 * estimation ponctuelle.
 *
 * @returns {{amount:number|null, status:string, upper_bound?:number}}
 *   status ∈ measured | trace | less_than | not_available
 */
export function parseCiqualValue(v) {
  if (v == null) return { amount: null, status: 'not_available' }
  if (typeof v === 'number') {
    return Number.isFinite(v) ? { amount: v, status: 'measured' } : { amount: null, status: 'not_available' }
  }
  const s = String(v).trim()
  if (s === '' || s === '-') return { amount: null, status: 'not_available' }
  if (/^traces$/i.test(s)) return { amount: null, status: 'trace' }
  // « < 0,01 » exprime uniquement une borne supérieure.
  const lt = s.match(/^<\s*([0-9]+(?:[.,][0-9]+)?)$/)
  if (lt) return { amount: null, status: 'less_than', upper_bound: toNumber(lt[1]) }
  const n = toNumber(s)
  return n == null ? { amount: null, status: 'not_available' } : { amount: n, status: 'measured' }
}

function toNumber(s) {
  const n = Number(String(s).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Frontière de mot qui tient les accents, faute de quoi le français passe à côté.
 *
 * `\b` de JavaScript ne connaît que `[A-Za-z0-9_]`. Une lettre accentuée n'en
 * fait pas partie, donc il n'existe AUCUNE frontière après elle : `/\bsurgelé\b/`
 * ne reconnaît jamais « surgelé ». Il reconnaît « surgelés » et « surgelée »,
 * dont la dernière lettre est ASCII — ce qui rend la panne invisible, puisque le
 * féminin et le pluriel marchent.
 *
 * Le coût était réel et silencieux : le seul surgelé du catalogue, « Petit pois
 * surgelé », ressortait avec `preservation_state: null`, c'est-à-dire
 * indistinguable d'un produit frais pour tout ce qui lit cet état
 * (catalog.food_forms via build-recipe-food-sql.mjs). Le même défaut frappait
 * « séché » (11 formes : thym, origan, piments, shiitaké…), « désossé » (2),
 * « appertisé » (1), ainsi que « grillé », « poêlé », « mixé », « lyophilisé »,
 * « déshydraté » — et « à l'étuvée », dont c'est la frontière GAUCHE qui ne
 * pouvait pas tomber, un « à » ne valant pas plus qu'un « é ».
 *
 * On remplace donc les deux frontières par un refus explicite de toute lettre
 * ou chiffre voisin, `\p{L}` couvrant les alphabets accentués.
 */
const DEBUT_DE_MOT = '(?<![\\p{L}\\p{N}_])'
const FIN_DE_MOT = '(?![\\p{L}\\p{N}_])'
const mot = (...variantes) => new RegExp(`${DEBUT_DE_MOT}(?:${variantes.join('|')})${FIN_DE_MOT}`, 'u')

/** Extrait le concept (1er segment avant virgule) + attributs d'état d'un libellé Ciqual. */
export function parseFoodName(label) {
  const full = String(label || '').trim()
  const segments = full.split(',').map((s) => s.trim()).filter(Boolean)
  const concept = segments[0] || full
  const rest = segments.slice(1).join(' ').toLowerCase()
  const hay = full.toLowerCase()

  const has = (re) => re.test(hay)
  let cooking_state = null
  if (has(mot('crue?s?'))) cooking_state = 'raw'
  else if (has(mot('cuite?s?', 'rôtie?s?', 'grillée?s?', 'bouillie?s?', 'frite?s?', 'poêlée?s?', "à l'étuvée", 'au four'))) cooking_state = 'cooked'

  let preservation_state = null
  if (has(mot('surgelée?s?', 'congelée?s?'))) preservation_state = 'frozen'
  else if (has(mot('appertisée?s?', 'conserve', 'en boîte'))) preservation_state = 'canned'
  else if (has(mot('séchée?s?', 'déshydratée?s?', 'lyophilisée?s?'))) preservation_state = 'dried'
  else if (has(mot('fraîche?s?', 'frais'))) preservation_state = 'fresh'

  let physical_state = null
  if (has(mot('poudre', 'moulue?'))) physical_state = 'powder'
  else if (has(mot('purée', 'mixée?'))) physical_state = 'puree'
  else if (has(mot('jus', 'liquide'))) physical_state = 'liquid'

  let bone_state = null
  if (has(mot('désossée?s?', 'sans os', 'filet', 'escalope'))) bone_state = 'boneless'
  else if (has(mot('avec os'))) bone_state = 'bone_in'

  let skin_state = null
  if (has(mot('sans peau'))) skin_state = 'skinless'
  else if (has(mot('avec peau'))) skin_state = 'with_skin'

  return { concept, rest, cooking_state, preservation_state, physical_state, bone_state, skin_state }
}
