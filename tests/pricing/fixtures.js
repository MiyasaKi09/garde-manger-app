/**
 * Fabriques de jeux de prix pour les tests de la couche de calcul.
 *
 * Les chiffres produits ici sont SYNTHÉTIQUES et n'ont aucune prétention à
 * décrire un marché : ils servent à vérifier une arithmétique, pas à chiffrer un
 * oignon. Ils portent d'ailleurs des citations marquées « FIXTURE » et ne sont
 * jamais versés dans data/prices/ — le contrôleur de provenance les refuserait,
 * et c'est exactement ce qu'on veut d'un chiffre non relevé.
 *
 * La couche de calcul est testée sur ces jeux plutôt que sur le référentiel réel
 * pour une raison de fond : au moment où elle est écrite, le référentiel est
 * partiel et bouge sous quatre agents. Un test qui dépendrait de son contenu
 * mesurerait leur avancement, pas la justesse du calcul.
 */

export function entree({
  form = 'Oignon jaune cru',
  formNormalized = 'oignon jaune cru',
  category = 'legumes',
  // `low` et `high` suivent `central` par défaut : sans cela, surcharger la
  // seule valeur centrale produirait une fourchette inversée que l'index
  // refuserait — un piège qui coûte une demi-heure à chaque nouveau test.
  central = 3,
  low = central * 0.8,
  high = central * 1.2,
  basis = 'kg',
  confidence = 'A',
  observedOn = '2026-07-31',
  yieldValue = 1,
  yieldKnown = false,
  conversion = { kind: 'identity' },
  nObservations = 12,
  sourceCode = 'rnm_franceagrimer',
  licenseCode = 'etalab-2.0',
  shareAlike = false,
  attributionRequired = true,
  // Échappatoire réservée aux tests qui veulent EXPRESSÉMENT une entrée
  // incohérente, pour vérifier que l'index la refuse.
  incoherenceVoulue = false,
} = {}) {
  if (!incoherenceVoulue && !(low <= central && central <= high)) {
    throw new Error(`fixture incoherente: ${low} / ${central} / ${high} — une fourchette inversee serait refusee par l'index, pas testee.`)
  }
  return {
    form,
    form_normalized: formNormalized,
    category,
    observed: {
      basis,
      low,
      central,
      high,
      unit: `EUR/${basis}`,
      dispersion: 'd1_d9',
      aggregation: 'annual_mean',
      n_observations: nObservations,
      period_start: '2025-08-01',
      period_end: '2026-07-31',
    },
    per_kg: { low, central, high, conversion },
    edible_yield: yieldKnown
      ? {
          value: yieldValue,
          known: true,
          note: 'FIXTURE — rendement déclaré connu pour les besoins du test.',
          provenance: {
            source_code: 'myko_reasoning',
            source_url: 'data/prices/CONTRAT.md',
            license_code: 'n/a',
            license_url: null,
            allowed_uses: { store_raw: false, redistribute: true, modify: true, attribution_required: false },
            retrieved_on: '2026-08-24',
            observed_on: '2026-08-24',
            citation: 'FIXTURE',
          },
        }
      : {
          value: yieldValue,
          known: false,
          note: 'FIXTURE — part comestible non sourcée, défaut 1,00 déclaré.',
        },
    confidence,
    confidence_reason: 'fixture_de_test',
    provenance: {
      source_code: sourceCode,
      source_url: 'https://example.invalid/fixture',
      license_code: licenseCode,
      license_url: 'https://example.invalid/licence',
      allowed_uses: {
        store_raw: true,
        redistribute: true,
        modify: true,
        attribution_required: attributionRequired,
        ...(shareAlike ? { share_alike: true } : {}),
      },
      retrieved_on: '2026-08-24',
      observed_on: observedOn,
      source_record_key: 'FIXTURE',
      citation: `FIXTURE — valeur centrale ${central}.`,
    },
    reindexation: null,
  }
}

export function jeu({
  entries = [],
  referenceDate = '2026-08-24',
  priceSetVersion = '2026.08-fixture',
  derivedLicense = 'etalab-2.0',
  schemaVersion = '1.0.0',
} = {}) {
  return {
    schema_version: schemaVersion,
    price_set_version: priceSetVersion,
    country: 'FR',
    currency: 'EUR',
    reference_date: referenceDate,
    derived_license: derivedLicense,
    catalog_version: 'v3-300-real-dishes',
    built_at: '2026-08-24',
    entries,
  }
}

/** Recette matérialisée minimale : seuls `servings` et `exactIngredients` sont lus. */
export function recette(ingredients, servings = 4) {
  return {
    code: 'FIXTURE-01',
    servings,
    exactIngredients: ingredients.map((ing) => ({
      name: ing.name,
      formNormalized: ing.formNormalized ?? null,
      grams: ing.grams,
      optional: Boolean(ing.optional),
    })),
  }
}
