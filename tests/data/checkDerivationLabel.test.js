import { describe, expect, it } from 'vitest'
import { analyser } from '../../scripts/data/recipes/check-derivation-matches-label.mjs'

/**
 * Ce contrôle SIGNALE, il ne refuse pas. Sa valeur tient donc entièrement à son
 * silence : un contrôle qui crie à chaque ligne ne se lit plus. Chaque cas
 * ci-dessous est un faux positif qu'il a réellement produit sur le corpus, et
 * qu'il ne doit plus produire.
 */
const base = () => ({
  code: 'SRC-100',
  family: 'Plat témoin',
  servings: 4,
  ingredients: [
    { form: 'Oignon jaune cru', quantity: 250, unit: 'g', role: 'aromate' },
    { form: 'Tomate râpée', quantity: 500, unit: 'g', role: 'légume' },
    { form: 'Farine de blé T55', quantity: 50, unit: 'g', role: 'liant' },
    { form: 'Sauce soja', quantity: 60, unit: 'ml', role: 'assaisonnement' },
    { form: 'Parmesan affiné', quantity: 60, unit: 'g', role: 'fromage d’assaisonnement' },
    { form: 'Œuf cru', quantity: 4, unit: 'u', role: 'protéine' },
    { form: 'Pain d’épices', quantity: 40, unit: 'g', role: 'garniture' },
  ],
})

const derivation = (overrides) => ({
  code: 'SRC-100-D1', base: 'SRC-100', family: 'Plat témoin dérivé',
  variant_label: '', operations: [], steps: [], ...overrides,
})

describe('confrontation du delta à son étiquette', () => {
  it('signale une consigne que le delta ne tient pas', () => {
    const remarques = analyser(derivation({
      variant_label: 'Version douce : supprimer l’oignon jaune et allonger la cuisson.',
      operations: [{ op: 'scale', form: 'Tomate râpée', factor: 2 }],
    }), base())
    expect(remarques.join(' | ')).toMatch(/retrait sur « oignon/)
  })

  it('se tait quand la consigne est tenue', () => {
    const remarques = analyser(derivation({
      variant_label: 'Version douce : supprimer l’oignon jaune et allonger la cuisson.',
      operations: [{ op: 'remove', form: 'Oignon jaune cru' }],
    }), base())
    expect(remarques).toEqual([])
  })

  // « ajouter AUX oignons des tomates » ajoute les tomates : le complément
  // d'attribution nomme le destinataire, pas l'ingrédient ajouté.
  it('ne prend pas un complément d’attribution pour un ajout', () => {
    const remarques = analyser(derivation({
      variant_label: 'Ajouter aux oignons des tomates pelées concassées et laisser réduire une heure.',
      operations: [{ op: 'scale', form: 'Tomate râpée', factor: 1.5 }],
    }), base())
    expect(remarques).toEqual([])
  })

  // « avant d'ajouter la farine » situe un geste dans le temps.
  it('ne prend pas une subordonnée temporelle pour une consigne', () => {
    const remarques = analyser(derivation({
      variant_label: 'Faire blondir l’oignon dans le beurre avant d’ajouter la farine.',
      operations: [{ op: 'scale', form: 'Oignon jaune cru', factor: 1.5 }],
    }), base())
    expect(remarques).toEqual([])
  })

  // Le rôle se lit par son mot de tête : « fromage d'assaisonnement » est un fromage.
  it('ne traite pas un fromage comme un assaisonnement', () => {
    const remarques = analyser(derivation({
      variant_label: 'Version au parmesan.',
      operations: [{ op: 'set', form: 'Parmesan affiné', quantity: 90 }],
    }), base())
    expect(remarques).toEqual([])
  })

  // Un assaisonnement se juge par rapport à la dose de la base, pas dans l'absolu :
  // une base qui porte déjà 15 g de sauce soja par part n'est pas fautive parce
  // que sa variante en met 19.
  it('juge un assaisonnement à l’écart avec sa base, pas dans l’absolu', () => {
    const proche = analyser(derivation({
      variant_label: 'Un trait supplémentaire de sauce soja.',
      operations: [{ op: 'set', form: 'Sauce soja', quantity: 75 }],
    }), base())
    expect(proche).toEqual([])

    const lointain = analyser(derivation({
      variant_label: 'Version très salée.',
      operations: [{ op: 'set', form: 'Sauce soja', quantity: 250 }],
    }), base())
    expect(lointain.join(' | ')).toMatch(/gros écart/)
  })

  // Une pièce se compte, elle ne se pèse pas : un œuf pour quatre parts n'est
  // pas « trop peu pour se voir dans l'assiette ».
  it('ne compare pas une pièce à un seuil de masse', () => {
    const remarques = analyser(derivation({
      variant_label: 'Version panée.',
      operations: [{ op: 'set', form: 'Œuf cru', quantity: 1, unit: 'u' }],
    }), base())
    expect(remarques).toEqual([])
  })

  // Un aromate n'est pas un condiment : un oignon pour quatre parts fait 60 g
  // par personne, ce n'est pas une faute.
  it('ne condamne pas un oignon au barème d’une épice', () => {
    const remarques = analyser(derivation({
      variant_label: 'Version à l’oignon.',
      operations: [{ op: 'set', form: 'Oignon jaune cru', quantity: 200 }],
    }), base())
    expect(remarques).toEqual([])
  })

  it('signale une quantité qui n’a pas de sens à la portion', () => {
    const remarques = analyser(derivation({
      variant_label: 'Version copieuse.',
      operations: [{ op: 'set', form: 'Tomate râpée', quantity: 4000 }],
    }), base())
    expect(remarques.join(' | ')).toMatch(/à vérifier/)
  })
})
