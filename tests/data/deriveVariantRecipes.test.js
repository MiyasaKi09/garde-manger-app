import { describe, expect, it } from 'vitest'
import { deriver } from '../../scripts/data/recipes/derive-variant-recipes.mjs'

/**
 * Base minimale mais réaliste : une omelette paysanne réduite à ce qui suffit
 * pour éprouver le moteur. Chaque cas ci-dessous correspond à une faute qu'un
 * delta mal écrit produirait, et qu'aucun autre contrôle de la chaîne ne verrait.
 */
const base = () => ({
  code: 'SRC-016',
  family: 'Omelette paysanne',
  cuisine_origin: 'France',
  identity_level: 'named_traditional_dish',
  category: 'plat aux œufs',
  status: 'candidate',
  confidence: 'B',
  servings: 4,
  prep_minutes: 15,
  cook_minutes: 20,
  difficulty: 'facile',
  sources: ['dossier:omelette-paysanne', 'marmiton.org'],
  techniques: ['sauter'],
  sensory: { profile: 'rustique' },
  conservation: { fridge_days: 1 },
  allergens: ['œuf'],
  variants: ['Version sans lardons', 'Version au comté'],
  ingredients: [
    { form: 'Œuf cru', quantity: 400, unit: 'g', role: 'protéine', optional: false },
    { form: 'Pomme de terre crue', quantity: 500, unit: 'g', role: 'féculent', optional: false },
    { form: 'Lardon fumé', quantity: 150, unit: 'g', role: 'protéine', optional: false },
    { form: 'Beurre doux', quantity: 20, unit: 'g', role: 'matière grasse', optional: false },
    { form: 'Jaune d’œuf cru', quantity: 18, unit: 'g', role: 'liaison', optional: false },
  ],
  steps: [
    { n: 1, instruction: 'Peler les pommes de terre et les tailler en dés réguliers.' },
    { n: 2, instruction: 'Faire rissoler les lardons à sec, puis ajouter les pommes de terre et le beurre.' },
    { n: 3, instruction: 'Battre les œufs, les verser sur la garniture et cuire à feu doux.' },
    { n: 4, instruction: 'Monter le jaune d’œuf cru en sauce, et tamiser dessus les jaunes des œufs durs.' },
  ],
})

const vocabulaire = {
  formes_employables: [
    { name: 'Œuf cru' }, { name: 'Pomme de terre crue' }, { name: 'Lardon fumé' },
    { name: 'Beurre doux' }, { name: 'Comté' }, { name: 'Oignon jaune cru' },
    { name: 'Jaune d’œuf cru' },
  ],
  formes_bloquees: [{ name: 'Bouquet garni', reason: 'proxy de confiance C' }],
}

const messages = (anomalies) => anomalies.join(' | ')

describe('dérivation de variantes', () => {
  it('applique un retrait et réécrit l’étape qui en parlait', () => {
    const { recette, anomalies } = deriver(base(), {
      code: 'SRC-016-D1',
      base: 'SRC-016',
      family: 'Omelette paysanne sans lardons',
      variant_label: 'Version sans lardons',
      operations: [{ op: 'remove', form: 'Lardon fumé' }],
      steps: [{ op: 'replace', n: 2, instruction: 'Faire colorer les pommes de terre au beurre jusqu’à ce qu’elles soient tendres.' }],
    }, { vocabulaire })

    expect(anomalies).toEqual([])
    expect(recette.ingredients.map((i) => i.form)).not.toContain('Lardon fumé')
    expect(recette.derived_from).toBe('SRC-016')
    expect(recette.derivation.variant_label).toBe('Version sans lardons')
    expect(recette.steps.map((s) => s.n)).toEqual([1, 2, 3, 4])
  })

  // La faute qui a motivé tout ce contrôle : la nutrition est juste, le
  // vocabulaire est propre, et le plat demande de rissoler un ingrédient absent.
  it('refuse un retrait dont les étapes parlent encore', () => {
    const { anomalies } = deriver(base(), {
      code: 'SRC-016-D1',
      base: 'SRC-016',
      family: 'Omelette paysanne sans lardons',
      variant_label: 'Version sans lardons',
      operations: [{ op: 'remove', form: 'Lardon fumé' }],
    }, { vocabulaire })
    expect(messages(anomalies)).toMatch(/Lardon fumé.*étapes en parlent encore/)
  })

  it('refuse un ajout qu’aucune étape n’emploie', () => {
    const { anomalies } = deriver(base(), {
      code: 'SRC-016-D2',
      base: 'SRC-016',
      family: 'Omelette paysanne au comté',
      variant_label: 'Version au comté',
      operations: [{ op: 'add', form: 'Comté', quantity: 80, unit: 'g', role: 'fromage' }],
    }, { vocabulaire })
    expect(messages(anomalies)).toMatch(/Comté.*aucune étape ne l’emploie|Comté.*aucune étape ne l'emploie/)
  })

  // Un delta qui vise un ingrédient absent ne fait rien du tout : la « variante »
  // serait la copie exacte de sa base, sous un autre nom.
  it('refuse une opération qui vise un ingrédient absent de la base', () => {
    const { anomalies } = deriver(base(), {
      code: 'SRC-016-D3',
      base: 'SRC-016',
      family: 'Omelette paysanne aux oignons',
      variant_label: 'Version sans lardons',
      operations: [{ op: 'scale', form: 'Oignon jaune cru', factor: 2 }],
    }, { vocabulaire })
    expect(messages(anomalies)).toMatch(/vise « Oignon jaune cru », absent/)
  })

  it('refuse une étiquette que la base n’annonce pas', () => {
    const { anomalies } = deriver(base(), {
      code: 'SRC-016-D4',
      base: 'SRC-016',
      family: 'Omelette paysanne à la truffe',
      variant_label: 'Version à la truffe',
      operations: [{ op: 'remove', form: 'Lardon fumé' }],
      steps: [{ op: 'replace', n: 2, instruction: 'Colorer les pommes de terre au beurre.' }],
    }, { vocabulaire })
    expect(messages(anomalies)).toMatch(/ne figure pas parmi les variantes/)
  })

  it('refuse une forme ajoutée hors vocabulaire, et une forme bloquée', () => {
    const horsVocabulaire = deriver(base(), {
      code: 'SRC-016-D5',
      base: 'SRC-016',
      family: 'Omelette paysanne au fromage inventé',
      variant_label: 'Version au comté',
      operations: [{ op: 'add', form: 'Tomme inventée', quantity: 80, unit: 'g' }],
      steps: [{ op: 'insert', after: 2, instruction: 'Râper la tomme inventée sur la garniture.' }],
    }, { vocabulaire })
    expect(messages(horsVocabulaire.anomalies)).toMatch(/ne figure pas au vocabulaire employable/)

    const bloquee = deriver(base(), {
      code: 'SRC-016-D6',
      base: 'SRC-016',
      family: 'Omelette paysanne au bouquet garni',
      variant_label: 'Version au comté',
      operations: [{ op: 'add', form: 'Bouquet garni', quantity: 10, unit: 'g' }],
      steps: [{ op: 'insert', after: 2, instruction: 'Glisser le bouquet garni dans la poêle.' }],
    }, { vocabulaire })
    expect(messages(bloquee.anomalies)).toMatch(/bloquée au vocabulaire/)
  })

  it('refuse un delta qui ne change rien', () => {
    const { anomalies } = deriver(base(), {
      code: 'SRC-016-D7',
      base: 'SRC-016',
      family: 'Omelette paysanne bis',
      variant_label: 'Version au comté',
      operations: [],
    }, { vocabulaire })
    expect(messages(anomalies)).toMatch(/ne change rien/)
  })

  it('refuse un facteur d’échelle de 1 et une quantité inchangée', () => {
    const echelle = deriver(base(), {
      code: 'SRC-016-D8', base: 'SRC-016', family: 'Omelette paysanne x1',
      variant_label: 'Version au comté',
      operations: [{ op: 'scale', form: 'Œuf cru', factor: 1 }],
    }, { vocabulaire })
    expect(messages(echelle.anomalies)).toMatch(/facteur 1 ne change rien/)

    const quantite = deriver(base(), {
      code: 'SRC-016-D9', base: 'SRC-016', family: 'Omelette paysanne idem',
      variant_label: 'Version au comté',
      operations: [{ op: 'set', form: 'Œuf cru', quantity: 400 }],
    }, { vocabulaire })
    expect(messages(quantite.anomalies)).toMatch(/à sa valeur d’origine ne change rien|à sa valeur d'origine ne change rien/)
  })

  it('substitue en gardant la quantité de l’ingrédient remplacé', () => {
    const { recette, anomalies } = deriver(base(), {
      code: 'SRC-016-D10',
      base: 'SRC-016',
      family: 'Omelette paysanne au comté',
      variant_label: 'Version au comté',
      operations: [{ op: 'substitute', form: 'Lardon fumé', with: 'Comté', quantity: 120, role: 'fromage' }],
      steps: [{ op: 'replace', n: 2, instruction: 'Faire colorer les pommes de terre au beurre, puis parsemer le comté râpé hors du feu.' }],
    }, { vocabulaire })

    expect(anomalies).toEqual([])
    const comte = recette.ingredients.find((i) => i.form === 'Comté')
    expect(comte).toMatchObject({ quantity: 120, unit: 'g', role: 'fromage' })
    expect(recette.ingredients.map((i) => i.form)).not.toContain('Lardon fumé')
  })

  it('hérite de la base ce que le delta ne dit pas, et n’hérite jamais des variantes', () => {
    const { recette } = deriver(base(), {
      code: 'SRC-016-D11',
      base: 'SRC-016',
      family: 'Omelette paysanne sans lardons',
      variant_label: 'Version sans lardons',
      operations: [{ op: 'remove', form: 'Lardon fumé' }],
      steps: [{ op: 'replace', n: 2, instruction: 'Colorer les pommes de terre au beurre.' }],
    }, { vocabulaire })

    expect(recette.cuisine_origin).toBe('France')
    expect(recette.servings).toBe(4)
    expect(recette.allergens).toEqual(['œuf'])
    expect(recette.identity_level).toBe('documented_variation')
    // Une dérivée n'annonce pas de variantes : sinon on dériverait en cascade et
    // la parenté deviendrait un arbre que le planificateur ne saurait plus lire.
    expect(recette.variants).toEqual([])
  })

  // Un mot peut nommer deux choses : le jaune d'œuf CRU d'une sauce et les
  // jaunes DURS qu'on tamise sont tous deux « des jaunes ». Le contrôle ne sait
  // pas les distinguer ; le rédacteur le déclare, et doit dire pourquoi — sans
  // quoi la dérogation deviendrait le moyen le plus court de faire taire un
  // vrai signalement.
  it('accepte un homonyme déclaré avec sa raison, refuse la déclaration nue', () => {
    const delta = (homonymes) => ({
      code: 'SRC-016-D13',
      base: 'SRC-016',
      family: 'Omelette paysanne sans sauce',
      variant_label: 'Version sans lardons',
      operations: [{ op: 'remove', form: 'Jaune d\u2019œuf cru' }, { op: 'remove', form: 'Lardon fumé' }],
      steps: [
        { op: 'replace', n: 2, instruction: 'Colorer les pommes de terre au beurre jusqu\u2019à ce qu\u2019elles soient tendres.' },
        { op: 'replace', n: 4, instruction: 'Tamiser dessus les jaunes des œufs durs, sans autre sauce.' },
      ],
      ...(homonymes ? { homonymes } : {}),
    })

    const sansDeclaration = deriver(base(), delta(null), { vocabulaire })
    expect(messages(sansDeclaration.anomalies)).toMatch(/Jaune d\u2019œuf cru.*étapes en parlent encore/)

    const sansRaison = deriver(base(), delta([{ form: 'Jaune d\u2019œuf cru' }]), { vocabulaire })
    expect(messages(sansRaison.anomalies)).toMatch(/sans raison/)

    const declare = deriver(base(), delta([{
      form: 'Jaune d\u2019œuf cru',
      raison: 'Le jaune retiré est le jaune cru de la sauce ; les jaunes dont parle encore l\u2019étape sont ceux des œufs durs.',
    }]), { vocabulaire })
    expect(declare.anomalies).toEqual([])
  })

  it('refuse un homonyme déclaré pour une forme qui reste dans la recette', () => {
    const { anomalies } = deriver(base(), {
      code: 'SRC-016-D14',
      base: 'SRC-016',
      family: 'Omelette paysanne sans lardons bis',
      variant_label: 'Version sans lardons',
      operations: [{ op: 'remove', form: 'Lardon fumé' }],
      steps: [{ op: 'replace', n: 2, instruction: 'Colorer les pommes de terre au beurre.' }],
      homonymes: [{ form: 'Beurre doux', raison: 'sans objet' }],
    }, { vocabulaire })
    expect(messages(anomalies)).toMatch(/homonyme déclaré pour une forme qui n\u2019est pas retirée|homonyme déclaré pour une forme qui n'est pas retirée/)
  })

  it('renumérote les étapes après insertion et suppression', () => {
    const { recette, anomalies } = deriver(base(), {
      code: 'SRC-016-D12',
      base: 'SRC-016',
      family: 'Omelette paysanne au comté fondu',
      variant_label: 'Version au comté',
      operations: [{ op: 'add', form: 'Comté', quantity: 80, unit: 'g', role: 'fromage' }],
      steps: [{ op: 'insert', after: 3, instruction: 'Parsemer le comté râpé et couvrir deux minutes pour le faire fondre.' }],
    }, { vocabulaire })

    expect(anomalies).toEqual([])
    expect(recette.steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 5])
    expect(recette.steps[3].instruction).toMatch(/comté/i)
  })
})
