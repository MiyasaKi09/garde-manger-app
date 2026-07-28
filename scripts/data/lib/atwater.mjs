/**
 * Comble la dernière macro manquante par fermeture énergétique d'Atwater.
 *
 * Dernier recours, employé seulement quand ni Ciqual ni USDA ne fournissent la
 * valeur. Il ne s'agit pas d'une analogie — déduire l'estragon frais du séché
 * par teneur en eau donne entre 0,59 et 1,21 g de lipides selon le rapport
 * retenu, soit un facteur deux d'incertitude. La fermeture énergétique, elle,
 * n'a qu'une inconnue et n'utilise que des valeurs mesurées du même aliment.
 *
 * Les FIBRES comptent. Ciqual applique les facteurs du règlement européen
 * 1169/2011, qui leur attribue 2 kcal/g, et son `carbohydrate_g` est le glucide
 * DISPONIBLE, fibres exclues. Les ignorer biaise lourdement la déduction dès
 * que l'aliment est fibreux — mesuré sur les 125 aliments du classeur à plus de
 * 10 g de fibres dont les cinq valeurs sont connues :
 *
 *   sans les fibres : biais moyen −13,5 %, erreur médiane 9,36 %
 *   avec les fibres : biais moyen  +3,6 %, erreur médiane 0,23 %
 *
 *   kcal = 4 × protéines + 4 × glucides + 9 × lipides + 2 × fibres
 *
 * Quand les fibres elles-mêmes sont inconnues, on retombe sur les trois termes
 * — et la formule enregistrée le dit, pour que la réserve reste lisible.
 *
 * Conditions strictes : exactement une macro manquante, les autres mesurées, et
 * un résultat physiquement plausible. Le résultat n'est JAMAIS présenté comme
 * une mesure : la forme porte `derived` avec sa formule.
 */
const FACTEURS_ATWATER = { protein_g: 4, carbohydrate_g: 4, fat_g: 9 }
const FACTEUR_FIBRES = 2

function comblerParAtwater(nutrition) {
  const champs = ['energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g']
  const manquants = champs.filter((champ) => !Number.isFinite(nutrition[champ]))
  if (manquants.length !== 1) return null
  const [manquant] = manquants

  const fibres = Number.isFinite(nutrition.fiber_g) ? nutrition.fiber_g : null
  const apportFibres = fibres === null ? 0 : fibres * FACTEUR_FIBRES
  const termeFibres = fibres === null ? '' : ` + ${FACTEUR_FIBRES}·fiber_g`

  if (manquant === 'energy_kcal') {
    const kcal = Object.entries(FACTEURS_ATWATER)
      .reduce((somme, [champ, facteur]) => somme + nutrition[champ] * facteur, apportFibres)
    return {
      champ: manquant,
      valeur: Math.round(kcal * 100) / 100,
      formule: `kcal = 4·protéines + 4·glucides + 9·lipides${termeFibres ? ' + 2·fibres' : ''}`,
    }
  }

  const facteur = FACTEURS_ATWATER[manquant]
  const autres = Object.entries(FACTEURS_ATWATER)
    .filter(([champ]) => champ !== manquant)
    .reduce((somme, [champ, poids]) => somme + nutrition[champ] * poids, apportFibres)
  const valeur = (nutrition.energy_kcal - autres) / facteur

  // Une valeur franchement négative signale une incohérence de la source, pas
  // une trace : la combler reviendrait à fabriquer un chiffre pour masquer un
  // défaut. Un résidu infime, lui, vient des arrondis de Ciqual — le
  // Saint-Pierre annonce 86,7 kcal quand ses macros en impliquent 86,8, d'où
  // −0,025 g de glucides. On ramène à zéro, mais on garde la valeur brute :
  // sans elle, l'identité d'Atwater ne se vérifierait plus et le lecteur ne
  // saurait pas d'où vient l'écart.
  if (!Number.isFinite(valeur) || valeur < -0.05) return null
  const arrondie = Math.round(Math.max(0, valeur) * 1000) / 1000
  return {
    champ: manquant,
    valeur: arrondie,
    ...(valeur < 0 ? { valeur_brute: Math.round(valeur * 1000) / 1000 } : {}),
    formule: `${manquant} = (kcal − ${Object.entries(FACTEURS_ATWATER).filter(([c]) => c !== manquant).map(([c, f]) => `${f}·${c}`).join(' − ')}${termeFibres.replace(' + ', ' − ')}) / ${facteur}`,
  }
}

export { comblerParAtwater, FACTEURS_ATWATER, FACTEUR_FIBRES }
