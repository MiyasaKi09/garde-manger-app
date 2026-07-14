/**
 * Fabrique V2 — résolution de la catégorie Myko à partir des groupes Ciqual.
 * Réf. MYKO_DATA_FOUNDATION_V2 §3.4 (taxonomie limitée et stable).
 * La catégorie sert au rangement, pas à la vérité culinaire.
 */

// Codes = catalog.food_categories.code (migration v2_0003).
const CATS = new Set([
  'fruits', 'legumes', 'legumineuses', 'cereales_feculents', 'viandes', 'volailles',
  'poissons_fruits_de_mer', 'oeufs', 'produits_laitiers', 'matieres_grasses',
  'herbes_aromates', 'epices', 'condiments_sauces', 'boissons', 'produits_sucres',
  'produits_transformes', 'preparations_culinaires',
])

/** @returns {string|null} code catégorie, ou null si à exclure de F0 (infantile/indéfini). */
export function resolveCategory(grpNom, ssgrpNom = '', name = '') {
  const g = (grpNom || '').toLowerCase()
  const s = (ssgrpNom || '').toLowerCase()
  const n = (name || '').toLowerCase()
  const any = `${s} ${n}`

  if (!g || g === 'undefined' || /infantile/.test(g)) return null

  if (/mati.res grasses/.test(g)) return 'matieres_grasses'
  if (/produits sucr.s/.test(g) || /glaces et sorbets/.test(g)) return 'produits_sucres'
  if (/eaux et autres boissons/.test(g)) return 'boissons'
  if (/produits laitiers/.test(g)) return 'produits_laitiers'
  if (/produits c.r.aliers/.test(g)) return 'cereales_feculents'
  if (/entr.es et plats compos.s/.test(g)) return 'preparations_culinaires'

  if (/aides culinaires et ingr.dients divers/.test(g)) {
    if (/.pice|curry|poivre|piment|muscade|cannelle|cumin|paprika/.test(any)) return 'epices'
    if (/herbe|aromate|persil|basilic|thym|menthe|ciboulette|coriandre|aneth/.test(any)) return 'herbes_aromates'
    return 'condiments_sauces'
  }

  if (/viandes.*poissons|viandes, ..ufs/.test(g)) {
    // Ordre important : œufs puis charcuterie AVANT volailles/viandes (sinon "Œuf de
    // caille" → volailles, "Rillettes de canard" → volailles). Word boundaries pour
    // éviter les faux positifs de sous-chaîne (ex. "Baudroie" ne doit pas matcher "oie").
    if (/\b(..uf|..ufs|oeuf|oeufs)\b/.test(any)) return 'oeufs'
    if (/\b(charcuterie|saucisse|saucisson|jambon|p.t.|rillettes|lardon|lardons|salami|chorizo|merguez|andouille|boudin|foie gras|confit|terrine|mousse de|quenelle)\b/.test(any)) return 'produits_transformes'
    if (/\b(poisson|poissons|mer|crustac\w*|mollusque|coquillage|thon|saumon|cabillaud|lotte|baudroie|crevette|moule|hu.tre|calamar|seiche|hareng|maquereau|sardine|truite|bar|dorade|colin|lieu|merlu|sole|raie|anchois|espadon)\b/.test(any)) return 'poissons_fruits_de_mer'
    if (/\b(volaille|volailles|poulet|dinde|canard|pintade|chapon|oie|caille|dindon)\b/.test(any)) return 'volailles'
    return 'viandes'
  }

  if (/fruits, l.gumes|l.gumineuses|ol.agineux/.test(g)) {
    if (/\b(l.gumineuse|l.gumineuses|lentille|lentilles|pois chiche|pois chiches|haricot sec|haricots secs|f.ve|f.ves|soja|flageolet)\b/.test(any)) return 'legumineuses'
    if (/\b(ol.agineux|graine|graines|noix|amande|amandes|noisette|noisettes|pistache|pistaches|cajou|s.same|tournesol|cacahu.te|cacahu.tes)\b/.test(any)) return 'legumineuses'
    if (/\b(pomme de terre|pommes de terre|tubercule|tubercules|patate douce|manioc|igname)\b/.test(any)) return 'cereales_feculents'
    if (/\bfruit\w*\b/.test(s)) return 'fruits'
    if (/\bl.gume\w*\b/.test(s)) return 'legumes'
    return 'legumes'
  }

  return null
}

export function isKnownCategory(code) {
  return CATS.has(code)
}
