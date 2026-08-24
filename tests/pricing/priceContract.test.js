import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  controlerReferentiel,
  moisEntre,
  normaliserForme,
  AGE_MAX_AFFICHABLE,
  AGE_MAX_CONFIANCE_A,
} from '../../scripts/data/prices/check-price-provenance.mjs'

/**
 * Ces tests ne vérifient pas que le référentiel est juste — aucun test ne peut
 * le faire, puisqu'un prix inventé a la même tête qu'un prix relevé. Ils
 * verrouillent le CONTRÔLEUR : chacune des fautes que le contrat nomme doit être
 * attrapée, et une entrée conforme doit passer sans bruit.
 *
 * Le second point compte autant que le premier. Un contrôleur qui crie sur du
 * bon travail finit ignoré, et un contrôleur ignoré ne protège plus de rien —
 * c'est la leçon déjà tirée sur check-arbitration-arithmetic.mjs, dont la moitié
 * des règles ont dû être bornées après coup pour cette raison.
 */

const REGISTRE_REEL = JSON.parse(readFileSync(join(process.cwd(), 'data', 'prices', 'sources.json'), 'utf8'))

/**
 * Le registre des tests est le VRAI registre, avec les licences marquées comme
 * vérifiées. On ne le recopie pas : si quelqu'un abaisse le plafond de confiance
 * d'une source ou en désactive une, ces tests doivent le voir. Seule la date de
 * vérification est simulée, parce qu'elle est justement le geste humain que le
 * dépôt n'a pas encore posé.
 */
const sources = {
  ...REGISTRE_REEL,
  sources: REGISTRE_REEL.sources.map((source) => (
    source.enabled === true ? { ...source, license_verified_on: '2026-08-01' } : source
  )),
}
const sourceDuRegistre = (code) => sources.sources.find((source) => source.code === code)

/** Trois formes suffisent : une sans conversion, une à densité, une à la pièce. */
const formes = [
  { canonical_name: 'Oignon jaune cru', canonical_name_normalized: 'oignon jaune cru', category: 'legumes', conversion: {} },
  { canonical_name: "Huile d'olive vierge extra", canonical_name_normalized: 'huile d olive vierge extra', category: 'matieres_grasses', conversion: { density_g_per_ml: 0.92 } },
  { canonical_name: 'Œuf cru', canonical_name_normalized: 'oeuf cru', category: 'oeufs', conversion: { grams_per_unit: 50 } },
]

const provenanceDe = (code, patch = {}) => {
  const source = sourceDuRegistre(code)
  return {
    source_code: code,
    source_url: `https://exemple.invalid/${code}/page-lue`,
    license_code: source.license_code,
    license_url: source.license_url,
    allowed_uses: source.allowed_uses,
    retrieved_on: '2026-08-10',
    observed_on: '2026-07-31',
    source_record_key: 'ORAM-oignon-jaune-france-cat1',
    citation: 'Oignon jaune France cat. I, sac 5 kg — moyenne 12 mois 1,45 €/kg (D1 1,15 ; D9 1,9).',
    ...patch,
  }
}

/** Entrée de référence : un oignon relevé au RNM, agrégé sur douze mois, en A. */
const entreeValide = (patch = {}) => ({
  form: 'Oignon jaune cru',
  form_normalized: 'oignon jaune cru',
  category: 'legumes',
  observed: {
    basis: 'kg',
    low: 1.15,
    central: 1.45,
    high: 1.9,
    unit: 'EUR/kg',
    dispersion: 'd1_d9',
    aggregation: 'annual_mean',
    n_observations: 52,
    period_start: '2025-08-01',
    period_end: '2026-07-31',
  },
  per_kg: { low: 1.15, central: 1.45, high: 1.9, conversion: { kind: 'identity' } },
  edible_yield: { value: 1, known: false, note: 'Part comestible non sourcée : défaut 1,00, l’estimation est un minorant déclaré.' },
  confidence: 'A',
  confidence_reason: 'rnm_cotation_nationale_moyenne_12_mois',
  provenance: provenanceDe('rnm_franceagrimer'),
  reindexation: null,
  ...patch,
})

/** Entrée au litre : le cas où la conversion peut fausser le calcul en silence. */
const entreeHuile = (patch = {}) => ({
  form: "Huile d'olive vierge extra",
  form_normalized: 'huile d olive vierge extra',
  category: 'matieres_grasses',
  observed: {
    basis: 'l',
    low: 7.2,
    central: 8.5,
    high: 11.4,
    unit: 'EUR/l',
    dispersion: 'd1_d9',
    aggregation: 'monthly_mean',
    n_observations: 18,
    period_start: '2026-07-01',
    period_end: '2026-07-31',
  },
  // 8,5 ÷ 0,92 = 9,239… ; 7,2 ÷ 0,92 = 7,826… ; 11,4 ÷ 0,92 = 12,391…
  per_kg: { low: 7.83, central: 9.24, high: 12.39, conversion: { kind: 'density', factor: 0.92, from: 'catalog:huile d olive vierge extra' } },
  edible_yield: { value: 1, known: false, note: 'Rendement non renseigné.' },
  confidence: 'B',
  confidence_reason: 'open_prices_mediane_18_releves',
  provenance: provenanceDe('open_prices', {
    source_record_key: 'op-huile-olive-vierge-extra',
    citation: 'Huile d’olive vierge extra — 18 relevés en juillet 2026, médiane 8,5 €/l (D1 7,2 ; D9 11,4).',
  }),
  reindexation: null,
  ...patch,
})

const jeu = (entrees, patch = {}) => ({
  schema_version: '1.0.0',
  price_set_version: '2026.08',
  country: 'FR',
  currency: 'EUR',
  reference_date: '2026-08-01',
  // ODbL par défaut : Open Prices entre dans plusieurs cas de test, et sa
  // licence contamine le référentiel produit.
  derived_license: 'odbl-1.0',
  catalog_version: 'v3',
  built_at: '2026-08-24',
  entries: entrees,
  ...patch,
})

const controler = (entrees, patchJeu = {}) => controlerReferentiel(jeu(entrees, patchJeu), { sources, formes })
const codes = (entrees, patchJeu = {}) => controler(entrees, patchJeu).violations.map((violation) => violation.code)

// ── Le silence sur du bon travail ───────────────────────────────────────────

describe('une entrée conforme passe', () => {
  it('laisse passer un relevé RNM en A, sans une remarque', () => {
    const { violations, stats } = controler([entreeValide()])
    expect(violations).toEqual([])
    expect(stats.affichables).toBe(1)
  })

  it('laisse passer un relevé au litre dont la conversion par densité est juste', () => {
    expect(controler([entreeHuile()]).violations).toEqual([])
  })

  it('laisse passer un relevé à la pièce converti par la masse du catalogue', () => {
    // 0,35 € la pièce, 50 g la pièce → 0,35 ÷ 0,05 = 7,00 €/kg.
    const oeuf = entreeHuile({
      form: 'Œuf cru',
      form_normalized: 'oeuf cru',
      category: 'oeufs',
      observed: {
        basis: 'piece', low: 0.28, central: 0.35, high: 0.52, unit: 'EUR/piece',
        dispersion: 'd1_d9', aggregation: 'monthly_mean', n_observations: 22,
        period_start: '2026-07-01', period_end: '2026-07-31',
      },
      per_kg: { low: 5.6, central: 7, high: 10.4, conversion: { kind: 'grams_per_piece', factor: 50, from: 'catalog:oeuf cru' } },
      provenance: provenanceDe('open_prices', {
        source_record_key: 'op-oeuf-cru',
        citation: 'Œuf cru, boîte de 6 — 22 relevés juillet 2026, médiane 0,35 € la pièce (D1 0,28 ; D9 0,52).',
      }),
    })
    expect(controler([oeuf]).violations).toEqual([])
  })

  it('laisse passer une entrée en C : elle n’est pas affichée, elle n’est pas fautive', () => {
    // Une entrée en C est l'équivalent d'une absence — elle reste au fichier
    // pour la traçabilité et la file de revue. La refuser reviendrait à
    // encourager sa suppression, donc la perte de la trace.
    const vieille = entreeValide({
      confidence: 'C',
      confidence_reason: 'releve_perime_conserve_pour_tracabilite',
      provenance: provenanceDe('rnm_franceagrimer', { observed_on: '2023-01-15', retrieved_on: '2023-02-01' }),
    })
    const { violations, stats } = controler([vieille])
    expect(violations).toEqual([])
    expect(stats.affichables).toBe(0)
  })
})

// ── La source ───────────────────────────────────────────────────────────────

describe('la source', () => {
  it('refuse une entrée sans source', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { source_code: '' }) })]))
      .toContain('source_missing')
  })

  it('refuse une source absente du registre', () => {
    const codesVus = codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { source_code: 'super_marche_du_coin' }) })])
    expect(codesVus).toContain('source_unknown')
  })

  it('refuse une source exclue au registre — le scraping d’enseignes', () => {
    const entree = entreeValide({
      provenance: { ...provenanceDe('rnm_franceagrimer'), source_code: 'scraping_enseignes' },
    })
    expect(codes([entree])).toContain('source_disabled')
  })

  it('refuse une estimation par modèle de langage, quel que soit son habillage', () => {
    // C'est la tentation la plus facile du chantier : un modèle remplit les 329
    // formes en une minute, avec des fourchettes d'allure raisonnable et zéro
    // observation derrière. Le registre la nomme et la désactive pour que la
    // question ne se repose pas.
    const entree = entreeValide({
      confidence_reason: 'ordre_de_grandeur_raisonnable',
      provenance: { ...provenanceDe('rnm_franceagrimer'), source_code: 'llm_estimation' },
    })
    expect(codes([entree])).toContain('source_disabled')
  })

  it('refuse une source dont personne n’a lu la licence', () => {
    const registreNeuf = REGISTRE_REEL // license_verified_on y est null, comme livré
    const resultat = controlerReferentiel(jeu([entreeValide()]), { sources: registreNeuf, formes })
    expect(resultat.violations.map((violation) => violation.code)).toContain('source_license_unverified')
  })

  it('refuse l’INSEE comme source d’un prix : un indice est un rapport, pas un niveau', () => {
    const entree = entreeValide({
      provenance: { ...provenanceDe('rnm_franceagrimer'), source_code: 'insee_ipc' },
    })
    expect(codes([entree])).toContain('source_cannot_price')
  })

  it('refuse une licence qui ne correspond pas à celle du registre', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { license_code: 'cc0-1.0' }) })]))
      .toContain('license_mismatch')
  })

  it('refuse un référentiel qui ne déclare pas le partage à l’identique qu’ODbL lui impose', () => {
    expect(codes([entreeHuile()], { derived_license: 'etalab-2.0' })).toContain('share_alike_not_declared')
  })
})

// ── Les dates ───────────────────────────────────────────────────────────────

describe('les dates', () => {
  it('refuse une entrée sans date d’observation', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { observed_on: null }) })]))
      .toContain('date_missing')
  })

  it('refuse une entrée sans date de consultation', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { retrieved_on: null }) })]))
      .toContain('date_missing')
  })

  it('refuse une observation postérieure à sa lecture', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { observed_on: '2026-07-31', retrieved_on: '2026-01-05' }) })]))
      .toContain('date_inconsistent')
  })

  it(`refuse un prix affichable de plus de ${AGE_MAX_AFFICHABLE} mois`, () => {
    const perime = entreeValide({
      confidence: 'B',
      confidence_reason: 'rnm_forme_approchee',
      provenance: provenanceDe('rnm_franceagrimer', { observed_on: '2024-01-01', retrieved_on: '2024-01-10' }),
    })
    expect(codes([perime])).toContain('price_expired')
  })

  it(`exige la réindexation au-delà de ${AGE_MAX_CONFIANCE_A} mois`, () => {
    const ancien = entreeValide({
      confidence: 'B',
      confidence_reason: 'rnm_reindexe',
      provenance: provenanceDe('rnm_franceagrimer', { observed_on: '2025-02-01', retrieved_on: '2025-02-10' }),
    })
    expect(codes([ancien])).toContain('reindexation_required')
  })

  it('refuse un facteur de réindexation que ses propres indices contredisent', () => {
    const menteur = entreeValide({
      confidence: 'B',
      confidence_reason: 'rnm_reindexe',
      provenance: provenanceDe('rnm_franceagrimer', { observed_on: '2025-02-01', retrieved_on: '2025-02-10' }),
      per_kg: { low: 1.15, central: 1.45, high: 1.9, conversion: { kind: 'identity' } },
      reindexation: {
        coicop: '01.1.7',
        index_source: 'insee_ipc',
        index_series: '001763559',
        from_period: '2025-02',
        from_value: 118.4,
        to_period: '2026-08',
        to_value: 121.9,
        factor: 1.25, // 121,9 / 118,4 = 1,0296
      },
    })
    expect(codes([menteur])).toContain('reindexation_invalid')
  })

  it('accepte une réindexation exacte, et la répercute sur le pivot', () => {
    // Le pivot est la valeur RAMENÉE à la date de référence : l'arithmétique
    // vérifiée inclut donc le facteur. Sans cela, la réindexation pourrait être
    // déclarée sans jamais être appliquée.
    const facteur = 121.9 / 118.4
    const reindexe = entreeValide({
      confidence: 'B',
      confidence_reason: 'rnm_reindexe_ipc_01_1_7',
      provenance: provenanceDe('rnm_franceagrimer', { observed_on: '2025-02-01', retrieved_on: '2025-02-10' }),
      per_kg: {
        low: Number((1.15 * facteur).toFixed(2)),
        central: Number((1.45 * facteur).toFixed(2)),
        high: Number((1.9 * facteur).toFixed(2)),
        conversion: { kind: 'identity' },
      },
      reindexation: {
        coicop: '01.1.7',
        index_source: 'insee_ipc',
        index_series: '001763559',
        from_period: '2025-02',
        from_value: 118.4,
        to_period: '2026-08',
        to_value: 121.9,
        factor: Number(facteur.toFixed(4)),
      },
    })
    expect(controler([reindexe]).violations).toEqual([])
  })

  it('éteint un référentiel abandonné plutôt que de le laisser parler', () => {
    const resultat = controlerReferentiel(jeu([entreeValide()]), { sources, formes, aujourdhui: '2029-01-01' })
    expect(resultat.violations.map((violation) => violation.code)).toContain('price_set_expired')
  })
})

// ── La citation ─────────────────────────────────────────────────────────────

describe('la citation', () => {
  it('refuse une entrée sans citation', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { citation: '' }) })]))
      .toContain('citation_missing')
  })

  it('refuse une citation trop courte pour porter un libellé et un chiffre', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { citation: 'oignon 1,45' }) })]))
      .toContain('citation_missing')
  })

  it('refuse une citation qui ne porte pas le chiffre lu', () => {
    // Le cas dangereux n'est pas la citation absente, c'est la citation
    // décorative : une phrase qui parle du bon produit sans jamais donner le
    // nombre, et qui donne donc l'apparence d'une source à un chiffre qui n'en
    // a pas.
    const decorative = entreeValide({
      provenance: provenanceDe('rnm_franceagrimer', {
        citation: 'Cotation RNM de l’oignon jaune France catégorie I, sac de 5 kg, moyenne sur douze mois.',
      }),
    })
    expect(codes([decorative])).toContain('citation_omits_figure')
  })

  it('accepte le point comme la virgule décimale', () => {
    const avecPoint = entreeValide({
      provenance: provenanceDe('rnm_franceagrimer', {
        citation: 'Oignon jaune France cat. I, sac 5 kg — moyenne 12 mois 1.45 EUR/kg (D1 1.15 ; D9 1.90).',
      }),
    })
    expect(controler([avecPoint]).violations).toEqual([])
  })

  it('refuse une citation restée à l’état de gabarit', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { citation: 'GABARIT NON RELEVÉ — à remplacer par la lecture réelle, 1,45 €/kg.' }) })]))
      .toContain('citation_is_placeholder')
  })
})

// ── La fourchette ───────────────────────────────────────────────────────────

describe('la fourchette', () => {
  it('refuse une fourchette inversée', () => {
    const inversee = entreeValide({
      observed: { ...entreeValide().observed, low: 1.9, high: 1.15 },
      per_kg: { low: 1.9, central: 1.45, high: 1.15, conversion: { kind: 'identity' } },
    })
    expect(codes([inversee])).toContain('range_inverted')
  })

  it('refuse une valeur centrale hors de ses propres bornes', () => {
    const dehors = entreeValide({
      observed: { ...entreeValide().observed, central: 2.6 },
      per_kg: { low: 1.15, central: 2.6, high: 1.9, conversion: { kind: 'identity' } },
      provenance: provenanceDe('rnm_franceagrimer', { citation: 'Oignon jaune France cat. I — moyenne 12 mois 2,6 €/kg (D1 1,15 ; D9 1,9).' }),
    })
    expect(codes([dehors])).toContain('range_inverted')
  })

  it('refuse un prix nul, qui est la façon la plus discrète d’écrire « je ne sais pas »', () => {
    const nul = entreeValide({
      observed: { ...entreeValide().observed, low: 0 },
      per_kg: { low: 0, central: 1.45, high: 1.9, conversion: { kind: 'identity' } },
    })
    expect(codes([nul])).toContain('range_inverted')
  })

  it('refuse une fourchette si large qu’elle mélange deux produits', () => {
    const melange = entreeValide({
      observed: { ...entreeValide().observed, low: 0.9, high: 19.5 },
      per_kg: { low: 0.9, central: 1.45, high: 19.5, conversion: { kind: 'identity' } },
    })
    expect(codes([melange])).toContain('range_implausible')
  })
})

// ── L'unité et la conversion ────────────────────────────────────────────────

describe('l’unité et la conversion', () => {
  it('refuse une unité incohérente avec la base déclarée', () => {
    expect(codes([entreeValide({ observed: { ...entreeValide().observed, unit: 'EUR/l' } })]))
      .toContain('basis_incoherent_with_form')
  })

  it('refuse un relevé au litre sur une forme dont le catalogue ignore la densité', () => {
    // Le piège exact : l'oignon n'a pas de densité, et supposer 1,00 passerait
    // inaperçu. toGramsV2 refuse déjà « ml » sans densité côté nutrition ; la
    // couche prix hérite du même refus.
    const auLitre = entreeValide({
      observed: { ...entreeValide().observed, basis: 'l', unit: 'EUR/l' },
      per_kg: { low: 1.15, central: 1.45, high: 1.9, conversion: { kind: 'density', factor: 1, from: 'catalog:oignon jaune cru' } },
    })
    expect(codes([auLitre])).toContain('basis_incoherent_with_form')
  })

  it('refuse un facteur ressaisi qui contredit le catalogue', () => {
    // 0,91 est la densité réelle de l'huile d'olive, 0,92 celle que porte le
    // catalogue. Le contrôle ne tranche pas laquelle est juste : il refuse
    // qu'il y en ait deux, parce que deux vérités sur le même nombre finissent
    // toujours par se contredire au moment où plus personne ne regarde.
    const ressaisi = entreeHuile({
      per_kg: { low: 7.91, central: 9.34, high: 12.53, conversion: { kind: 'density', factor: 0.91, from: 'catalog:huile d olive vierge extra' } },
    })
    expect(codes([ressaisi])).toContain('conversion_factor_mismatch')
  })

  it('refuse un pivot que son observation ne donne pas', () => {
    const faux = entreeHuile({
      per_kg: { low: 7.83, central: 8.5, high: 12.39, conversion: { kind: 'density', factor: 0.92, from: 'catalog:huile d olive vierge extra' } },
    })
    expect(codes([faux])).toContain('per_kg_arithmetic')
  })

  it('tolère l’arrondi au centime sur la conversion', () => {
    expect(controler([entreeHuile()]).violations).toEqual([])
  })
})

// ── La confiance ────────────────────────────────────────────────────────────

describe('la confiance', () => {
  it('refuse une confiance sans justification', () => {
    expect(codes([entreeValide({ confidence_reason: '' })])).toContain('confidence_unjustified')
  })

  it('refuse un A posé sur un relevé ponctuel', () => {
    const ponctuel = entreeValide({
      category: 'produits_transformes',
      observed: { ...entreeValide().observed, aggregation: 'point', n_observations: 1 },
    })
    expect(codes([ponctuel])).toContain('confidence_unjustified')
  })

  it('refuse un A posé sur une plage de cotation sans déciles', () => {
    expect(codes([entreeValide({ observed: { ...entreeValide().observed, dispersion: 'quoted_range' } })]))
      .toContain('confidence_unjustified')
  })

  it('refuse un A dépassant le plafond que la source accorde', () => {
    // Open Prices est plafonné à B, définitivement : les contributions sont
    // volontaires, donc l'échantillon n'est représentatif de rien en
    // particulier, si soigneuse que soit chaque contribution isolée.
    expect(codes([entreeHuile({ confidence: 'A' })])).toContain('confidence_unjustified')
  })

  it('refuse un B appuyé sur moins de relevés que la source n’en exige', () => {
    const troisReleves = entreeHuile({
      observed: { ...entreeHuile().observed, n_observations: 3 },
    })
    expect(codes([troisReleves])).toContain('confidence_unjustified')
  })

  it('refuse un A sans identifiant de ligne dans la source', () => {
    expect(codes([entreeValide({ provenance: provenanceDe('rnm_franceagrimer', { source_record_key: '' }) })]))
      .toContain('confidence_unjustified')
  })

  it('refuse un relevé ponctuel affichable sur une catégorie saisonnière', () => {
    // Une courgette de juillet n'est pas une courgette de janvier, et l'écart
    // n'apparaît dans aucun contrôle de forme : c'est exactement le genre de
    // faute qu'on ne verrait jamais après coup.
    const enJuillet = entreeValide({
      confidence: 'B',
      confidence_reason: 'rnm_cotation_hebdomadaire',
      observed: { ...entreeValide().observed, aggregation: 'point', n_observations: 1 },
    })
    expect(codes([enJuillet])).toContain('confidence_unjustified')
  })
})

// ── Le rendement comestible ─────────────────────────────────────────────────

describe('le rendement comestible', () => {
  it('refuse un rendement inventé', () => {
    // « Un oignon perd à peu près 10 % à l'épluchage » : plausible, invérifiable,
    // et il gonflerait silencieusement toutes les estimations.
    expect(codes([entreeValide({ edible_yield: { value: 0.85, known: false } })])).toContain('yield_invented')
  })

  it('refuse un rendement déclaré connu sans provenance', () => {
    expect(codes([entreeValide({ edible_yield: { value: 0.88, known: true } })])).toContain('yield_invented')
  })

  it('refuse un rendement inférieur à 1 adossé au raisonnement interne', () => {
    const raisonne = entreeValide({
      edible_yield: {
        value: 0.9,
        known: true,
        provenance: {
          source_code: 'myko_reasoning',
          source_url: 'data/prices/CONTRAT.md',
          license_code: 'n/a',
          license_url: null,
          allowed_uses: { store_raw: false, redistribute: true, modify: true, attribution_required: false },
          retrieved_on: '2026-08-24',
          observed_on: '2026-08-24',
          citation: 'Un oignon perd environ 10 % de sa masse à l’épluchage.',
        },
      },
    })
    expect(codes([raisonne])).toContain('yield_invented')
  })

  it('accepte un rendement de 1 qui l’est par nature du produit', () => {
    const huile = entreeHuile({
      edible_yield: {
        value: 1,
        known: true,
        note: 'Une huile est intégralement le produit acheté.',
        provenance: {
          source_code: 'myko_reasoning',
          source_url: 'data/prices/CONTRAT.md',
          license_code: 'n/a',
          license_url: null,
          allowed_uses: { store_raw: false, redistribute: true, modify: true, attribution_required: false },
          retrieved_on: '2026-08-24',
          observed_on: '2026-08-24',
          citation: 'Rendement 1,00 par nature du produit : une huile n’a pas de partie non comestible.',
        },
      },
    })
    expect(controler([huile]).violations).toEqual([])
  })

  it('refuse un rendement hors de ]0 ; 1]', () => {
    expect(codes([entreeValide({ edible_yield: { value: 1.2, known: true } })])).toContain('yield_out_of_range')
  })
})

// ── La forme et la structure ────────────────────────────────────────────────

describe('la forme et la structure du fichier', () => {
  it('refuse un prix qui ne se raccroche à aucune forme du catalogue', () => {
    expect(codes([entreeValide({ form: 'Oignon rouge cru', form_normalized: 'oignon rouge cru' })]))
      .toContain('form_unknown')
  })

  it('refuse une clé de jointure qui n’est pas la normalisation du libellé', () => {
    expect(codes([entreeValide({ form_normalized: 'oignon-jaune-cru' })]))
      .toEqual(expect.arrayContaining(['form_unknown', 'form_normalized_mismatch']))
    expect(normaliserForme("Huile d'olive vierge extra")).toBe('huile d olive vierge extra')
  })

  it('refuse deux prix pour la même forme', () => {
    expect(codes([entreeValide(), entreeValide()])).toContain('form_duplicate')
  })

  it('refuse un champ que personne n’a arbitré', () => {
    expect(codes([entreeValide({ prix_moyen_estime: 1.5 })])).toContain('unknown_field')
  })

  it('refuse un jeu qui déclare une autre version du contrat', () => {
    expect(codes([entreeValide()], { schema_version: '0.9.0' })).toContain('schema_version_mismatch')
  })

  it('refuse une devise autre que l’euro', () => {
    expect(codes([entreeValide()], { currency: 'CHF' })).toContain('currency_invalid')
  })
})

// ── Le gabarit livré avec le contrat ────────────────────────────────────────

describe('le gabarit du contrat', () => {
  it('est refusé s’il est versé tel quel', () => {
    // Le gabarit doit être copiable pour sa forme et inerte pour ses chiffres.
    // Ses entrées sont en C, ses citations portent le marqueur GABARIT, et les
    // licences de ses sources ne sont pas vérifiées : il ne peut donc ni
    // s'afficher, ni passer la CI.
    const gabarit = JSON.parse(readFileSync(join(process.cwd(), 'data', 'prices', 'exemple-gabarit.json'), 'utf8'))
    const catalogue = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'out', 'recipe-food-catalog.json'), 'utf8'))
    const resultat = controlerReferentiel(gabarit, { sources: REGISTRE_REEL, formes: catalogue.forms })
    expect(resultat.violations.map((violation) => violation.code)).toContain('citation_is_placeholder')
    expect(resultat.stats.affichables).toBe(0)
  })

  it('est par ailleurs structurellement juste : aucune faute de forme, d’unité ou d’arithmétique', () => {
    // Ce qui doit rester vrai du gabarit, c'est sa STRUCTURE — c'est elle que
    // cinq agents vont recopier. On vérifie donc que les seules violations qu'il
    // porte sont celles qui le rendent volontairement inerte.
    const gabarit = JSON.parse(readFileSync(join(process.cwd(), 'data', 'prices', 'exemple-gabarit.json'), 'utf8'))
    const catalogue = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'data', 'out', 'recipe-food-catalog.json'), 'utf8'))
    const resultat = controlerReferentiel(gabarit, { sources, formes: catalogue.forms })
    expect(resultat.violations.map((violation) => violation.code)).toEqual(['citation_is_placeholder', 'citation_is_placeholder'])
  })
})

// ── L'arithmétique des dates ────────────────────────────────────────────────

describe('l’écart en mois', () => {
  it('compte les mois révolus, sans passer par un objet Date', () => {
    // « 2026-07-31 » lu dans un fuseau à l'ouest de Greenwich devient le 30
    // juillet, et le décalage se propagerait jusque dans le verdict de
    // péremption d'une entrée à la limite (CLAUDE.md, piège 4).
    expect(moisEntre('2026-07-31', '2026-08-01')).toBe(0)
    expect(moisEntre('2025-08-01', '2026-08-01')).toBe(12)
    expect(moisEntre('2024-08-01', '2026-08-01')).toBe(24)
    expect(moisEntre('2024-07-31', '2026-08-01')).toBe(24)
    expect(moisEntre('2024-07-01', '2026-08-01')).toBe(25)
  })
})

// ── Le registre lui-même ────────────────────────────────────────────────────

describe('le registre des sources', () => {
  it('porte les quatre sources retenues, et aucune n’est utilisable avant lecture humaine de sa licence', () => {
    for (const code of ['rnm_franceagrimer', 'insee_ipc', 'observatoire_prix_marges', 'open_prices']) {
      const source = REGISTRE_REEL.sources.find((candidate) => candidate.code === code)
      expect(source, code).toBeTruthy()
      expect(source.license_code, code).toBeTruthy()
      expect(source.license_url, code).toBeTruthy()
      expect(source.license_verified_on, `${code} : activer une source est un geste humain et daté`).toBeNull()
    }
  })

  it('nomme et désactive ce qui est exclu, avec sa raison', () => {
    for (const code of ['scraping_enseignes', 'llm_estimation']) {
      const source = REGISTRE_REEL.sources.find((candidate) => candidate.code === code)
      expect(source, code).toBeTruthy()
      expect(source.enabled, code).toBe(false)
      expect(source.exclusion_reason, code).toBeTruthy()
    }
  })

  it('interdit à l’INSEE de porter un prix', () => {
    const insee = REGISTRE_REEL.sources.find((source) => source.code === 'insee_ipc')
    expect(insee.may_source_price).toBe(false)
    expect(insee.grants_confidence).toBeNull()
  })

  it('plafonne Open Prices à B', () => {
    const openPrices = REGISTRE_REEL.sources.find((source) => source.code === 'open_prices')
    expect(openPrices.grants_confidence).toBe('B')
    expect(openPrices.allowed_uses.share_alike).toBe(true)
  })
})
