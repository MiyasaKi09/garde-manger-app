import { describe, expect, it } from 'vitest'
import { remarquesSurArbitrage } from '../../scripts/data/recipes/check-arbitration-arithmetic.mjs'

/**
 * Ce contrôle relit l'arbitrage canonique, qui est de la prose française. Chaque
 * cas ci-dessous est une phrase JUSTE que le contrôle a d'abord prise pour une
 * faute — un faux positif coûte plus cher qu'un silence, parce qu'un relecteur
 * qui apprend à ignorer les remarques n'en lit plus aucune.
 */
const recette = (arbitrage, parts = 6) => ({
  code: 'TEST-001',
  family: 'Plat témoin',
  servings: parts,
  canonical_arbitration: arbitrage,
})

describe('arithmétique d’un arbitrage', () => {
  it('signale une médiane que le total contredit', () => {
    const remarques = remarquesSurArbitrage(recette('Les deux la pèsent, médiane 72, soit 400 g pour six.'))
    expect(remarques).toHaveLength(1)
    expect(remarques[0]).toMatch(/« médiane 72 » × 6 parts fait 432/)
  })

  it('se tait quand la médiane et le total s’accordent', () => {
    expect(remarquesSurArbitrage(recette('Médiane 125 g par personne, soit 750 g pour six.'))).toEqual([])
  })

  // Arrondir un total vers un nombre rond est la pratique normale : 456 devient
  // 450, et crier là-dessus reviendrait à crier sur toutes les recettes.
  it('tolère l’arrondi vers un nombre rond', () => {
    expect(remarquesSurArbitrage(recette('Médiane 57 g par personne, soit 450 g pour huit.', 8))).toEqual([])
  })

  // En relatif seul, 1,8 g arrondi à 2 g serait un écart de 11 % : du bruit sur
  // une épice, et le genre de remarque qui décrédibilise les vraies.
  it('tolère l’arrondi au gramme sur une épice', () => {
    expect(remarquesSurArbitrage(recette('Médiane 0,3 g par personne, soit 2 g pour six.'))).toEqual([])
  })

  // « médiane 2 cuillerées, soit 30 g » est juste : deux cuillerées pèsent trente
  // grammes. Multiplier 2 par le nombre de parts n'aurait aucun sens.
  it('ignore une médiane exprimée en unité de comptage', () => {
    expect(remarquesSurArbitrage(recette('Les sources comptent en cuillerées : médiane 2 cuillerées, soit 30 g.', 4))).toEqual([])
    expect(remarquesSurArbitrage(recette('Médiane 3 gousses, soit 15 g pour six.'))).toEqual([])
  })

  // Un arbitrage qui s'écarte de la médiane et le DIT montre son travail : ce
  // n'est pas une incohérence, c'est une décision, et 40 × 4 fait bien 160.
  it('accepte un écart à la médiane que la phrase énonce', () => {
    expect(remarquesSurArbitrage(recette('La médiane est 45. On descend à 40 g, soit 160 g pour quatre.', 4))).toEqual([])
  })

  // Sans borne de proposition, le « soit » attrapé peut appartenir à une autre
  // phrase, et le contrôle compare deux chiffres qui ne parlent pas du même
  // ingrédient — c'est ainsi qu'il annonçait 275 % d'écart sur une phrase juste.
  it('ne franchit pas la frontière de proposition', () => {
    const deuxPhrases = 'La médiane globale de crème est 11,6 g par personne. Le beurre, lui, soit 30 g, se partage.'
    expect(remarquesSurArbitrage(recette(deuxPhrases, 4))).toEqual([])
  })

  it('ne s’applique pas sans nombre de parts', () => {
    expect(remarquesSurArbitrage({ ...recette('Médiane 72, soit 400 g.'), servings: null })).toEqual([])
  })
})

describe('décompte de sources d’un arbitrage', () => {
  it('signale un dénominateur qui dépasse le dossier', () => {
    const remarques = remarquesSurArbitrage(recette('Huit sources sur neuf portent le paprika.'), { total: 6 })
    expect(remarques).toHaveLength(1)
    expect(remarques[0]).toMatch(/« Huit sources sur neuf » alors que le dossier ne porte que 6 sources/)
  })

  it('se tait quand le dénominateur est le bon', () => {
    expect(remarquesSurArbitrage(recette('Six sources sur sept emploient le blanc.'), { total: 7 })).toEqual([])
  })

  // Un dénominateur PLUS PETIT que le dossier compte un sous-ensemble, et la
  // phrase le dit : « les trois sources qui portent le poivron » puis « rouge
  // dans deux sources sur trois », sur un dossier de quatre. C'est juste, et le
  // contrôle criait dessus — un vrai faux positif, trouvé sur REAL-295.
  it('accepte un dénominateur qui compte un sous-ensemble', () => {
    expect(remarquesSurArbitrage(recette('Le poivron est rouge dans deux sources sur trois.'), { total: 4 })).toEqual([])
  })

  // « six pages sur trois SITES » est une répartition, pas une fraction : six
  // pages réparties sur trois sites. Sans cette exception le contrôle criait sur
  // des phrases justes, et c'est précisément la tournure que la chaîne emploie
  // pour dire qu'une source est attestée largement.
  it('ne prend pas une répartition entre sites pour une fraction', () => {
    expect(remarquesSurArbitrage(recette('Le beurre est nommé par six pages sur trois sites.'), { total: 6 })).toEqual([])
    expect(remarquesSurArbitrage(recette('Trois pages sur deux sites le pèsent.'), { total: 6 })).toEqual([])
  })

  it('ne contrôle rien sans dossier de référence', () => {
    expect(remarquesSurArbitrage(recette('Huit sources sur neuf portent le paprika.'))).toEqual([])
  })
})
