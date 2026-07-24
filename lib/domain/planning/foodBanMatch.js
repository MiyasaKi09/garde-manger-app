/**
 * Correspondance interdits alimentaires ↔ ingrédients, à FRONTIÈRES DE MOTS.
 *
 * Incident prod (24/07) : le matching naïf par sous-chaînes bannissait des
 * aliments sans rapport — « fruits de mer » ⊃ « fruit » interdisait TOUS les
 * fruits (donc toutes les collations), « veau »/« agneau » ⊃ « eau »
 * interdisaient l'eau, « veau » ⊂ « navet nouveau cru » interdisait le navet.
 * Résultat : « Contraintes alimentaires ou physiques non satisfaites » pour
 * chaque membre × chaque jour.
 *
 * Règle : un interdit correspond à un aliment si et seulement si la séquence
 * de MOTS de l'interdit apparaît d'un bloc (mots contigus) dans la séquence de
 * mots de l'aliment, avec tolérance singulier/pluriel (« s » final) mot à mot.
 *   - « thon »          matche « thon au naturel en conserve égoutté »
 *   - « épinards »      matche « épinard frais » (tolérance pluriel)
 *   - « fruits de mer » matche « fruits de mer surgelés »
 *   - « veau »          ne matche NI « eau » NI « navet nouveau cru »
 *   - « fruits de mer » ne matche PAS « fruit »
 * Jamais de correspondance « fragment » : un aliment dont le nom n'est qu'un
 * morceau de l'interdit (« mer », « fruit », « eau ») n'est pas banni — seul
 * le sens interdit → aliment est sûr (un interdit générique couvre toutes ses
 * formes spécifiques, l'inverse sur-bloquait tout le corpus).
 */

const foldBanText = (value) => String(value || '')
  .replace(/œ/gi, 'oe')
  .replace(/æ/gi, 'ae')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const wordsOf = (value) => foldBanText(value).split(' ').filter(Boolean)

// Dépluralisation française simple : « s » OU « x » final retiré quand le
// radical garde au moins 4 lettres — « poireaux » ≈ « poireau »,
// « choux » ≈ « chou », « épinards » ≈ « épinard », « œufs » ≈ « œuf ».
// Le seuil de radical évite les collisions courtes : « maïs » (plié « mais »,
// radical « mai » trop court) reste « mais » et ne matche pas « mai » ;
// « eau » ≠ « veau » et « fruit » ≠ « fruits de mer » restent garantis par les
// frontières de mots. Cette sémantique est MIROIR de la fonction SQL
// planning_food_ban_matches (garde-fou publish_canonical_final_demand_plan) :
// toute évolution doit être appliquée aux deux.
const depluralize = (word) => (word.length >= 5 && /[sx]$/.test(word) ? word.slice(0, -1) : word)

const sameWord = (left, right) => depluralize(left) === depluralize(right)

/**
 * Vrai si la séquence de mots `term` apparaît d'un bloc dans `value`.
 * Un interdit vide (après normalisation) ne matche jamais.
 */
export function banTermMatches(value, term) {
  const haystack = wordsOf(value)
  const needle = wordsOf(term)
  if (!needle.length || needle.length > haystack.length) return false
  for (let start = 0; start + needle.length <= haystack.length; start++) {
    let matched = true
    for (let offset = 0; offset < needle.length; offset++) {
      if (!sameWord(haystack[start + offset], needle[offset])) { matched = false; break }
    }
    if (matched) return true
  }
  return false
}

/** Vrai si l'aliment `value` tombe sous AU MOINS un des interdits `terms`. */
export function matchesBannedFood(value, terms = []) {
  return terms.some((term) => banTermMatches(value, term))
}
