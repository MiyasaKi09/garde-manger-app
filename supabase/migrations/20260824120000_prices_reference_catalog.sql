-- ============================================================================
-- Référentiel de prix en base — jeux de prix et prix par forme alimentaire
-- Contrat : data/prices/CONTRAT.md (v1.0.0) · schéma : data/prices/schema.json
-- ============================================================================
--
-- CE QUE CETTE MIGRATION POSE
-- ---------------------------
--   ops.source_datasets            + 4 colonnes de gouvernance de source
--   catalog.price_sets             le jeu de prix (l'en-tête du fichier JSON)
--   catalog.food_form_prices       une entrée par forme et par jeu
--   catalog.enforce_price_provenance()  la porte SQL, qui refuse comme refuse
--                                       le contrôleur, avec le même vocabulaire
--
-- POURQUOI LE SCHÉMA `catalog`, ET PAS `public`
-- ---------------------------------------------
-- Un prix de référence est une donnée de RÉFÉRENCE, pas une donnée de foyer :
-- il ne porte pas d'user_id, il est le même pour tout le monde, il est publié
-- par release et il se raccroche à ops.source_datasets exactement comme
-- food_nutrition_profiles ou food_storage_profiles. Le mettre dans `public`
-- l'aurait rangé au milieu des tables per-user, où la règle de lecture est
-- « mes lignes » et non « les lignes publiées » — deux régimes de sécurité
-- opposés dans une même table de tri.
--
-- Le piège connu du dépôt est que `catalog` n'est pas exposé par PostgREST : la
-- migration 20260731010000 a dû écrire une fonction SECURITY DEFINER pour lire
-- une seule colonne de `culinary`. La question à trancher est donc : QUI doit
-- lire cette table depuis le navigateur ? Réponse : personne. Le CONTRAT §9 dit
-- que le référentiel est importé AU BUILD (`data/prices/reference-fr.json`, un
-- import statique indexé une fois dans lib/domain/prices/priceCatalog.js),
-- comme le catalogue des formes dans canonicalCatalog.js. Le chemin de lecture
-- de l'application ne passe donc jamais par PostgREST, et la non-exposition de
-- `catalog` n'est pas un obstacle ici — c'est même la garantie qu'on ne
-- construira pas par accident un second chemin de lecture qui divergerait de
-- l'artefact servi.
--
-- Conséquence assumée : AUCUNE fonction SECURITY DEFINER de lecture n'est créée
-- ici. Une fonction exposée que personne n'appelle est une surface d'attaque
-- sans appelant ; le jour où un besoin réel de lecture client apparaît, il
-- s'écrira avec sa signature et son grant, en connaissance de cause.
--
-- POURQUOI DEUX TABLES
-- --------------------
-- `reference_date`, `derived_license`, `catalog_version` valent pour le JEU
-- entier. Les recopier sur 329 lignes ouvrirait la possibilité que deux entrées
-- du même jeu ne s'accordent pas sur la date à laquelle leurs prix sont ramenés
-- — or c'est cette date qui décide de la péremption (§5.3) et qui s'affiche à
-- côté de chaque montant (§7.1). Une seule ligne d'en-tête, une seule vérité.
--
-- COLONNES OU JSONB : LA RÈGLE SUIVIE ICI
-- ---------------------------------------
-- Colonne dédiée pour tout ce que le CALCUL lit ou qu'une contrainte doit
-- pouvoir vérifier (per_kg, edible_yield.value, confidence, les dates).
-- jsonb pour les blocs de pure traçabilité, réexportés tels quels vers le JSON
-- et jamais lus par une formule (`allowed_uses`, `reindexation`, la provenance
-- du rendement). `allowed_uses` est déjà jsonb sur ops.source_datasets : garder
-- la même forme évite une traduction de plus.
--
-- CE QUE CETTE MIGRATION NE FAIT PAS
-- ----------------------------------
-- Elle n'importe AUCUN prix. Pas un seul chiffre n'est écrit : le contrat §0
-- dit qu'un prix qu'on n'a pas su sourcer est absent, et une migration n'est
-- pas un endroit où l'on relève des cotations. La table naît vide, et une
-- couverture nulle est un état normal, pas une erreur.
--
-- IDEMPOTENCE : IF NOT EXISTS partout, contraintes gardées par pg_constraint.
-- ROLLBACK    : 20260824120000_prices_reference_catalog_rollback.sql
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- 1. GOUVERNANCE DES SOURCES — ops.source_datasets
-- ════════════════════════════════════════════════════════════════════════════
-- Le registre existant porte déjà la licence et les usages autorisés. Il lui
-- manque les trois champs sur lesquels repose le refus côté prix, et que
-- data/prices/sources.json porte de son côté : la date de vérification humaine
-- de la licence, le niveau de confiance maximum que la source accorde, et le
-- droit — ou l'interdiction — de porter un niveau de prix.
--
-- `may_source_price` arrive à false pour TOUTES les lignes existantes, et c'est
-- le bon défaut : aucune des sources déjà présentes (Ciqual, OFF, corpus
-- éditorial) ne cote de prix, et une source ne doit pas gagner ce droit par
-- omission. C'est l'INSEE qui rend ce champ nécessaire : il publie un rapport
-- entre deux dates, jamais un niveau, et fabriquer un prix depuis un indice
-- reviendrait à inventer le niveau en lui donnant l'apparence d'une statistique
-- publique (CONTRAT §5.2).

ALTER TABLE ops.source_datasets
  ADD COLUMN IF NOT EXISTS license_verified_on date,
  ADD COLUMN IF NOT EXISTS license_verified_by text,
  ADD COLUMN IF NOT EXISTS grants_confidence   text,
  ADD COLUMN IF NOT EXISTS may_source_price    boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'source_datasets_grants_confidence_check'
      AND conrelid = 'ops.source_datasets'::regclass
  ) THEN
    ALTER TABLE ops.source_datasets
      ADD CONSTRAINT source_datasets_grants_confidence_check
      CHECK (grants_confidence IS NULL OR grants_confidence IN ('A', 'B', 'C'));
  END IF;
END $$;

COMMENT ON COLUMN ops.source_datasets.license_verified_on IS
  'Date à laquelle un humain a ouvert la page de licence et l''a lue. NULL = non
   vérifiée : toute entrée de prix qui s''en réclame est refusée
   (source_license_unverified). Une licence supposée n''est pas une licence
   connue, et le dépôt est public.';
COMMENT ON COLUMN ops.source_datasets.license_verified_by IS
  'Qui a fait la vérification. Le geste est humain et daté : ce champ existe
   pour qu''on puisse constater qu''il ne l''a pas été.';
COMMENT ON COLUMN ops.source_datasets.grants_confidence IS
  'MAXIMUM que cette source peut valoir (CONTRAT §4). Une entrée peut être moins
   bien notée que sa source ne le permet ; jamais mieux. NULL = la source
   n''accorde aucun niveau (cas de l''INSEE et des dérivations internes).';
COMMENT ON COLUMN ops.source_datasets.may_source_price IS
  'Droit de porter un NIVEAU de prix. false pour l''INSEE (indice = rapport, pas
   niveau) et pour myko_reasoning (dérivation, rien n''y est relevé).';


-- ── Le registre des sources de prix, miroir de data/prices/sources.json ─────
-- Les codes sont recopiés à l'identique pour que l'importateur puisse joindre
-- le registre JSON et le registre SQL sans table de traduction.
--
-- license_verified_on reste NULL ici, y compris pour les sources que le fichier
-- JSON déclare vérifiées : la vérification est un fait daté attaché à un geste,
-- pas une valeur qu'une migration recopie. L'importateur, qui lit sources.json
-- de toute façon, la reportera — et s'il ne le fait pas, la porte SQL refuse,
-- ce qui est le comportement voulu. ON CONFLICT DO NOTHING garantit qu'un
-- réapply n'écrase jamais une vérification déjà inscrite.

INSERT INTO ops.source_datasets
  (code, name, publisher, source_url, license_code, license_url, allowed_uses,
   update_strategy, enabled, grants_confidence, may_source_price)
VALUES
  ('rnm_franceagrimer',
   'Réseau des Nouvelles des Marchés (RNM)',
   'FranceAgriMer',
   'https://rnm.franceagrimer.fr/',
   'etalab-2.0',
   'https://www.etalab.gouv.fr/licence-ouverte-open-licence',
   '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":true}'::jsonb,
   'manual_versioned', true, 'A', true),

  ('observatoire_prix_marges',
   'Observatoire de la formation des prix et des marges des produits alimentaires',
   'FranceAgriMer — rapport annuel au Parlement',
   'https://observatoire-prixmarges.franceagrimer.fr/',
   'etalab-2.0',
   'https://www.etalab.gouv.fr/licence-ouverte-open-licence',
   '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":true}'::jsonb,
   'manual_versioned', true, 'A', true),

  ('open_prices',
   'Open Prices',
   'Open Food Facts',
   'https://prices.openfoodfacts.org/',
   'odbl-1.0',
   'https://opendatacommons.org/licenses/odbl/1-0/',
   '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":true,"share_alike":true}'::jsonb,
   'bulk_export_preferred', true, 'B', true),

  -- Réindexation seule. grants_confidence NULL + may_source_price false : une
  -- entrée dont la provenance serait l'INSEE est refusée par la porte SQL.
  ('insee_ipc',
   'Indice des prix à la consommation, par poste COICOP',
   'INSEE',
   'https://www.insee.fr/fr/statistiques?idprefixe=serie&categorie=indice-des-prix-a-la-consommation',
   'etalab-2.0',
   'https://www.etalab.gouv.fr/licence-ouverte-open-licence',
   '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":true}'::jsonb,
   'api_or_download', true, NULL, false),

  -- Ce n'est pas une source : rien n'y est relevé. Elle n'admet qu'un rendement
  -- comestible de 1,00 PAR NATURE du produit (une huile n'a pas de partie non
  -- comestible), et jamais le moindre prix.
  ('myko_reasoning',
   'Raisonnement interne documenté',
   'Myko (dérivation interne)',
   'data/prices/CONTRAT.md',
   'n/a', NULL,
   '{"store_raw":false,"redistribute":true,"modify":true,"attribution_required":false}'::jsonb,
   'n/a', true, NULL, false),

  -- Les deux exclusions sont inscrites en base, désactivées, POUR QUE LA
  -- QUESTION NE SE REPOSE PAS. Une exclusion qui n'est écrite nulle part est
  -- une exclusion qu'on redécouvre et qu'on re-débat tous les six mois.
  ('scraping_enseignes',
   'Extraction automatisée des sites d''enseignes',
   'n/a', 'n/a', 'aucune', NULL,
   '{"store_raw":false,"redistribute":false,"modify":false,"attribution_required":false}'::jsonb,
   'excluded', false, NULL, false),

  ('llm_estimation',
   'Estimation par un modèle de langage',
   'n/a', 'n/a', 'aucune', NULL,
   '{"store_raw":false,"redistribute":false,"modify":false,"attribution_required":false}'::jsonb,
   'excluded', false, NULL, false)
ON CONFLICT (code) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- 2. catalog.price_sets — l'en-tête du jeu de prix
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS catalog.price_sets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Version du CONTRAT contre lequel le jeu a été construit. Stockée et non
  -- contrainte à '1.0.0' : la base garde aussi les jeux anciens, et figer la
  -- version ici obligerait à migrer le schéma pour lire un fichier d'hier. Le
  -- refus de lire un jeu qui déclare une autre version appartient au
  -- contrôleur, qui applique les règles d'UNE version à la fois.
  schema_version      text NOT NULL,

  price_set_version   text NOT NULL UNIQUE,
  country             text NOT NULL DEFAULT 'FR',
  currency            text NOT NULL DEFAULT 'EUR',

  -- La date à laquelle TOUS les prix du jeu sont ramenés. C'est elle qui
  -- s'affiche à côté de chaque montant (§7.1) et par rapport à laquelle se
  -- calcule la péremption (§5.3).
  reference_date      date NOT NULL,

  -- Licence du référentiel PRODUIT, pas celle des sources. ODbL est à partage
  -- à l'identique : faire entrer Open Prices impose 'odbl-1.0' ici, et la
  -- porte SQL le vérifie entrée par entrée (share_alike_not_declared).
  derived_license     text NOT NULL,

  catalog_version     text NOT NULL,
  built_at            date NOT NULL,

  -- Empreinte du fichier data/prices/reference-fr.json d'où le jeu a été
  -- chargé. Métadonnée SQL, hors contrat JSON : l'export vers le fichier ne
  -- doit pas l'émettre (le schéma est additionalProperties:false).
  artifact_sha256     text,

  status              text NOT NULL DEFAULT 'candidate',
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  published_at        timestamptz,
  retracted_at        timestamptz,

  CONSTRAINT price_sets_country_check    CHECK (country ~ '^[A-Z]{2}$'),
  -- Une seule devise admise, et ce n'est pas une restriction paresseuse : les
  -- montants sont des `numeric` nus, et deux devises dans la même colonne
  -- finiraient par être additionnées sans que personne ne le voie. Élargir est
  -- un geste délibéré, qui passera par une migration et par la question du taux
  -- de change — lequel est lui-même une donnée à sourcer et à dater.
  CONSTRAINT price_sets_currency_eur_check CHECK (currency = 'EUR'),
  CONSTRAINT price_sets_status_check      CHECK (status IN ('candidate', 'published', 'retracted')),
  CONSTRAINT price_sets_built_after_ref   CHECK (built_at >= reference_date)
);

COMMENT ON TABLE catalog.price_sets IS
  'En-tête d''un jeu de prix (CONTRAT §10.1). Une ligne = un référentiel daté et
   licencié. Les entrées vivent dans catalog.food_form_prices.';

-- Un seul jeu publié par pays à la fois : la publication est un basculement,
-- pas une accumulation. Le même esprit que ops.catalog_releases.
CREATE UNIQUE INDEX IF NOT EXISTS uq_price_sets_published_per_country
  ON catalog.price_sets (country) WHERE status = 'published';


-- ════════════════════════════════════════════════════════════════════════════
-- 3. catalog.food_form_prices — une entrée par forme
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS catalog.food_form_prices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_set_id      uuid NOT NULL REFERENCES catalog.price_sets(id) ON DELETE CASCADE,

  -- La forme est la clé métier. Le FK est la vérité structurelle ; `form_label`
  -- et `form_normalized` en sont la RECOPIE, exactement comme le facteur de
  -- conversion est recopié du catalogue plutôt que ressaisi. On garde la copie
  -- parce que l'export JSON en a besoin (§10.2) et parce qu'elle permet de
  -- constater qu'un libellé de catalogue a changé sous un prix déjà relevé —
  -- le contrôleur refait la comparaison (form_label_mismatch,
  -- form_normalized_mismatch).
  food_form_id      uuid NOT NULL REFERENCES catalog.food_forms(id),
  form_label        text NOT NULL,
  form_normalized   text NOT NULL,
  category_code     text,

  -- ── observed : ce qui a été LU, dans sa base native, sans transformation ──
  observed_basis        text NOT NULL,
  observed_low          numeric(12,4) NOT NULL,
  observed_central      numeric(12,4) NOT NULL,
  observed_high         numeric(12,4) NOT NULL,
  observed_unit         text NOT NULL,
  observed_dispersion   text NOT NULL,
  observed_aggregation  text NOT NULL,
  observed_n            integer NOT NULL,
  observed_period_start date NOT NULL,
  observed_period_end   date NOT NULL,

  -- ── per_kg : LE PIVOT, en euros par kilogramme net acheté ────────────────
  -- Seul bloc que la couche de calcul lit. Matérialisé plutôt que recalculé :
  -- si la densité du catalogue change un jour, le contrôle échoue et quelqu'un
  -- tranche, au lieu que les deux valeurs dérivent en silence.
  per_kg_low        numeric(12,4) NOT NULL,
  per_kg_central    numeric(12,4) NOT NULL,
  per_kg_high       numeric(12,4) NOT NULL,
  conversion_kind   text NOT NULL,
  conversion_factor numeric(12,6),
  conversion_from   text,

  -- ── edible_yield : part réellement consommée de ce qu'on achète ──────────
  -- Défaut 1,00 DÉCLARÉ. Pas 0,85 « typique » : 0,85 serait un nombre inventé
  -- qui gonflerait silencieusement toutes les estimations. 1,00 est aussi une
  -- erreur, mais de sens connu — l'estimation est un MINORANT, et l'interface
  -- le dit (« hors pertes de parage »).
  edible_yield_value      numeric(6,4) NOT NULL DEFAULT 1,
  edible_yield_known      boolean NOT NULL DEFAULT false,
  edible_yield_note       text,
  edible_yield_provenance jsonb,

  -- ── confiance : ici, C ÉQUIVAUT À L'ABSENCE ──────────────────────────────
  -- Une entrée en C reste en base pour la traçabilité et la file de revue,
  -- mais la policy de lecture ne la rend pas et elle ne compte pas dans la
  -- couverture. Ce n'est pas une ligne « peu fiable » : c'est une ligne non
  -- chiffrée.
  confidence        text NOT NULL,
  confidence_reason text NOT NULL,

  -- ── provenance du prix ───────────────────────────────────────────────────
  source_dataset_id uuid NOT NULL REFERENCES ops.source_datasets(id),
  source_record_key text,
  source_url        text NOT NULL,
  license_code      text NOT NULL,
  license_url       text,
  allowed_uses      jsonb NOT NULL,
  -- Les deux dates ne disent pas la même chose et les confondre est la faute
  -- classique : un relevé de 2024 lu aujourd'hui reste un prix de 2024.
  observed_on       date NOT NULL,
  retrieved_on      date NOT NULL,
  citation          text NOT NULL,

  reindexation      jsonb,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- ── Cohérence interne, tout ce qu'une CHECK peut porter seule ────────────
  CONSTRAINT ffp_basis_check       CHECK (observed_basis IN ('kg', 'l', 'piece')),
  CONSTRAINT ffp_dispersion_check  CHECK (observed_dispersion IN ('d1_d9', 'quoted_range', 'min_max')),
  CONSTRAINT ffp_aggregation_check CHECK (observed_aggregation IN ('point', 'monthly_mean', 'annual_mean')),
  CONSTRAINT ffp_n_check           CHECK (observed_n >= 1),
  CONSTRAINT ffp_period_check      CHECK (observed_period_start <= observed_period_end),

  -- Un prix nul ou négatif n'existe pas. Zéro serait la façon la plus discrète
  -- d'écrire « je ne sais pas » — et le contrat interdit précisément d'écrire
  -- une ignorance sous la forme d'un nombre.
  CONSTRAINT ffp_observed_positive CHECK (observed_low > 0 AND observed_central > 0 AND observed_high > 0),
  CONSTRAINT ffp_observed_order    CHECK (observed_low <= observed_central AND observed_central <= observed_high),
  CONSTRAINT ffp_per_kg_positive   CHECK (per_kg_low > 0 AND per_kg_central > 0 AND per_kg_high > 0),
  CONSTRAINT ffp_per_kg_order      CHECK (per_kg_low <= per_kg_central AND per_kg_central <= per_kg_high),

  -- L'unité déclarée doit dire la même chose que la base. Deux champs qui se
  -- contredisent, c'est un des deux qui sera lu par erreur.
  CONSTRAINT ffp_unit_matches_basis CHECK (
    (observed_basis = 'kg'    AND observed_unit = 'EUR/kg')
    OR (observed_basis = 'l'     AND observed_unit = 'EUR/l')
    OR (observed_basis = 'piece' AND observed_unit = 'EUR/piece')
  ),

  -- La conversion est entièrement déterminée par la base (CONTRAT §1.2). Cette
  -- contrainte ferme la porte au cas le plus coûteux : une observation au litre
  -- convertie par identité, c'est-à-dire une densité supposée valoir 1,00. Sur
  -- une huile (0,92) l'erreur est de 8 % et personne ne la verrait.
  CONSTRAINT ffp_conversion_matches_basis CHECK (
    (observed_basis = 'kg'    AND conversion_kind = 'identity')
    OR (observed_basis = 'l'     AND conversion_kind = 'density')
    OR (observed_basis = 'piece' AND conversion_kind = 'grams_per_piece')
  ),

  -- Pas de facteur, pas de prix : le facteur est obligatoire dès qu'il y a
  -- conversion, et interdit quand il n'y en a pas. `conversion_from` porte sa
  -- provenance (catalog:<form_normalized>) : le facteur est RECOPIÉ du
  -- catalogue, jamais ressaisi, parce que deux vérités sur le même nombre
  -- finissent toujours par se contredire.
  CONSTRAINT ffp_conversion_factor_shape CHECK (
    (conversion_kind = 'identity'
       AND conversion_factor IS NULL AND conversion_from IS NULL)
    OR (conversion_kind <> 'identity'
       AND conversion_factor IS NOT NULL AND conversion_factor > 0
       AND conversion_from IS NOT NULL AND btrim(conversion_from) <> '')
  ),

  -- Le seul cas où l'arithmétique du pivot est EXACTE, donc vérifiable sans
  -- tolérance : l'identité. Pour la densité et la masse à la pièce, la division
  -- produit un arrondi dont la règle appartient au contrôleur ; la porte SQL
  -- s'en tient à un filet à grosses mailles (voir enforce_price_provenance).
  CONSTRAINT ffp_identity_is_exact CHECK (
    conversion_kind <> 'identity'
    OR (per_kg_low = observed_low AND per_kg_central = observed_central AND per_kg_high = observed_high)
  ),

  -- Le facteur porte sa provenance, et cette provenance est le catalogue. Un
  -- `from` qui ne commence pas par « catalog: » est un facteur ressaisi à la
  -- main, c'est-à-dire une seconde vérité sur un nombre qui en a déjà une. La
  -- forme visée n'est pas contrainte à être la forme de l'entrée : une variante
  -- peut légitimement emprunter la densité de sa forme parente.
  CONSTRAINT ffp_conversion_from_catalog CHECK (
    conversion_from IS NULL OR conversion_from LIKE 'catalog:%'
  ),

  CONSTRAINT ffp_yield_range CHECK (edible_yield_value > 0 AND edible_yield_value <= 1),

  -- Rendement inconnu ⇒ il vaut 1,00, et l'estimation est un minorant déclaré.
  CONSTRAINT ffp_yield_unknown_is_one CHECK (edible_yield_known OR edible_yield_value = 1),

  -- Un rendement connu est une donnée sourcée comme une autre. Sans provenance,
  -- le rendement deviendrait la porte de service par laquelle les nombres
  -- inventés rentrent : c'est le champ le plus facile à remplir « au jugé »,
  -- et le plus difficile à contredire ensuite.
  CONSTRAINT ffp_yield_known_needs_provenance CHECK (
    NOT edible_yield_known
    OR (edible_yield_provenance IS NOT NULL
        AND edible_yield_provenance ?& array['source_code','source_url','license_code',
                                             'allowed_uses','retrieved_on','observed_on','citation'])
  ),

  -- myko_reasoning n'admet QUE le rendement 1,00 par nature du produit. « Un
  -- oignon perd à peu près 10 % à l'épluchage » est exactement le nombre
  -- plausible et invérifiable que le §0 proscrit : un rendement < 1 exige une
  -- table publiée de parts comestibles.
  CONSTRAINT ffp_yield_reasoning_only_one CHECK (
    edible_yield_value = 1
    OR edible_yield_provenance->>'source_code' IS DISTINCT FROM 'myko_reasoning'
  ),

  CONSTRAINT ffp_confidence_check        CHECK (confidence IN ('A', 'B', 'C')),
  CONSTRAINT ffp_confidence_reason_check CHECK (btrim(confidence_reason) <> ''),

  -- Une confiance A sans clé d'enregistrement source est une confiance qu'on ne
  -- peut pas re-vérifier ligne à ligne.
  CONSTRAINT ffp_record_key_for_a CHECK (
    confidence <> 'A' OR (source_record_key IS NOT NULL AND btrim(source_record_key) <> '')
  ),

  CONSTRAINT ffp_dates_order CHECK (observed_on <= retrieved_on),

  -- La citation doit porter le chiffre lu dans sa phrase. La longueur est tout
  -- ce que SQL peut honnêtement vérifier ; que la valeur centrale y figure
  -- LITTÉRALEMENT est vérifié par le contrôleur (citation_omits_figure), qui
  -- sait lire le point comme la virgule décimale. Ne pas croire que cette
  -- CHECK garantit une citation utile : elle garantit seulement qu'il y a du
  -- texte.
  CONSTRAINT ffp_citation_check CHECK (length(btrim(citation)) >= 20),

  CONSTRAINT ffp_reindexation_shape CHECK (
    reindexation IS NULL
    OR (reindexation ?& array['coicop','index_source','index_series','from_period',
                              'from_value','to_period','to_value','factor']
        AND reindexation->>'index_source' = 'insee_ipc')
  )
);

COMMENT ON TABLE catalog.food_form_prices IS
  'Prix de référence par forme alimentaire (CONTRAT §10.2). Une forme absente
   est une forme NON COUVERTE : c''est un état normal, jamais une erreur. Une
   entrée en C est présente mais non chiffrée — elle ne se lit pas et ne compte
   pas dans la couverture.';

COMMENT ON COLUMN catalog.food_form_prices.per_kg_central IS
  'Le seul nombre que la couche de calcul lit. Euros par kilogramme NET ACHETÉ,
   emballage exclu. Coût = (grammes_forme / edible_yield_value / 1000) × per_kg.';

COMMENT ON COLUMN catalog.food_form_prices.observed_low IS
  '1er décile des observations retenues, dans la base native. Ce que la
   fourchette décrit est la DISPERSION constatée (géographie, enseigne, gamme),
   pas une segmentation par gamme — aucune source autorisée n''en publie — ni
   une incertitude de source — ni le RNM ni l''INSEE n''en publient.';

COMMENT ON COLUMN catalog.food_form_prices.edible_yield_value IS
  'Vit à terme dans catalog.food_forms.edible_yield_ratio : le rendement est une
   propriété de l''aliment, pas de son prix, et le loger ici oblige à le
   recopier dans chaque relevé successif de la même forme. Il est porté ici tant
   que la colonne du catalogue n''est renseignée pour aucune forme. Aucune
   contrainte ne force l''accord entre les deux aujourd''hui : la forcer
   empêcherait de remplir le catalogue indépendamment des relevés de prix.';

COMMENT ON COLUMN catalog.food_form_prices.reindexation IS
  'Obligatoire entre 12 et 24 mois d''âge (CONTRAT §5.2). L''INSEE fournit un
   RAPPORT entre deux dates : ce bloc VIEILLIT un prix relevé ailleurs, il n''en
   crée aucun.';

-- Une forme n'a qu'un prix par jeu, sous ses deux clés. La clé normalisée est
-- vérifiée séparément parce que c'est elle qui sert la jointure côté artefact :
-- deux libellés distincts qui se normalisent pareil produiraient deux prix pour
-- la même ligne de recette, et le dernier lu gagnerait silencieusement.
CREATE UNIQUE INDEX IF NOT EXISTS uq_food_form_prices_form
  ON catalog.food_form_prices (price_set_id, food_form_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_food_form_prices_normalized
  ON catalog.food_form_prices (price_set_id, form_normalized);

CREATE INDEX IF NOT EXISTS idx_food_form_prices_set_confidence
  ON catalog.food_form_prices (price_set_id, confidence);
CREATE INDEX IF NOT EXISTS idx_food_form_prices_source
  ON catalog.food_form_prices (source_dataset_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 4. LA PORTE SQL — catalog.enforce_price_provenance()
-- ════════════════════════════════════════════════════════════════════════════
--
-- POURQUOI UNE PORTE ICI ALORS QUE LE CONTRÔLEUR EXISTE DÉJÀ
-- ----------------------------------------------------------
-- check-price-provenance.mjs garde le FICHIER. Il ne garde pas la TABLE : un
-- INSERT en SQL, un import repris à la main, une reprise après incident
-- n'ouvrent jamais le fichier JSON. Le contrôleur et cette porte gardent deux
-- entrées différentes vers la même donnée, et le prix est précisément la donnée
-- qu'on ne relira plus une fois qu'elle sera multipliée par toutes les recettes
-- de la forme.
--
-- Elle parle EXACTEMENT le vocabulaire du contrôleur (source_disabled,
-- price_expired, confidence_unjustified…), pour qu'un refus se lise pareil quel
-- que soit le côté par lequel on est arrivé.
--
-- Ce qu'elle ne sait pas faire, et qu'il ne faut pas croire qu'elle fait :
-- détecter un chiffre inventé. Aucun programme ne le sait. Elle rend seulement
-- l'invention coûteuse, en exigeant que le chiffre soit retrouvable.
--
-- SECURITY DEFINER : elle doit lire ops.source_datasets, sur laquelle la RLS est
-- active sans policy (migration 0005). Un importateur en `data_publisher` n'y
-- verrait aucune ligne et la porte refuserait tout, y compris le légitime.

CREATE OR REPLACE FUNCTION catalog.enforce_price_provenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_set  catalog.price_sets%ROWTYPE;
  v_src  ops.source_datasets%ROWTYPE;
  v_rank_entry integer;
  v_rank_src   integer;
  v_factor     numeric;
  v_expected   numeric;
BEGIN
  SELECT * INTO v_set FROM catalog.price_sets WHERE id = NEW.price_set_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'price_set_missing : jeu de prix % introuvable', NEW.price_set_id;
  END IF;

  SELECT * INTO v_src FROM ops.source_datasets WHERE id = NEW.source_dataset_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'source_unknown : source % absente du registre ops.source_datasets',
      NEW.source_dataset_id;
  END IF;

  -- ── La source a-t-elle le droit d'être ici ? ──────────────────────────────
  IF NOT v_src.enabled THEN
    RAISE EXCEPTION 'source_disabled : la source % est désactivée dans le registre', v_src.code;
  END IF;

  IF v_src.license_verified_on IS NULL THEN
    RAISE EXCEPTION
      'source_license_unverified : la licence de % n''a pas été vérifiée (license_verified_on est NULL). Activer une source est un geste humain et daté.',
      v_src.code;
  END IF;

  IF NOT v_src.may_source_price THEN
    RAISE EXCEPTION
      'source_cannot_price : % ne peut pas porter un niveau de prix (un indice est un rapport, une dérivation n''est pas un relevé)',
      v_src.code;
  END IF;

  -- ── La licence recopiée dit-elle la même chose que le registre ? ──────────
  IF NEW.license_code IS DISTINCT FROM v_src.license_code
     OR NEW.license_url IS DISTINCT FROM v_src.license_url
     OR NEW.allowed_uses <> v_src.allowed_uses THEN
    RAISE EXCEPTION
      'license_mismatch : la licence portée par l''entrée diffère de celle du registre pour %', v_src.code;
  END IF;

  IF (NEW.allowed_uses->>'redistribute') IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION
      'redistribution_not_allowed : % n''autorise pas la redistribution, et le dépôt est public', v_src.code;
  END IF;

  -- ODbL est à partage à l'identique : la faire entrer impose sa licence au
  -- référentiel PRODUIT. Ce n'est pas un détail juridique lointain.
  IF (NEW.allowed_uses->>'share_alike') = 'true'
     AND v_set.derived_license IS DISTINCT FROM NEW.license_code THEN
    RAISE EXCEPTION
      'share_alike_not_declared : % impose % au jeu de prix, qui déclare %',
      v_src.code, NEW.license_code, v_set.derived_license;
  END IF;

  -- ── Les dates ─────────────────────────────────────────────────────────────
  IF NEW.observed_on > v_set.reference_date THEN
    RAISE EXCEPTION
      'date_inconsistent : observation du % postérieure à la date de référence du jeu (%)',
      NEW.observed_on, v_set.reference_date;
  END IF;

  -- Au-delà de 24 mois, la réindexation produit un nombre plausible et faux :
  -- un indice national porte une dérive d'ensemble, pas un choc propre à un
  -- produit (l'huile de tournesol a pris plus de 60 % en 2022 quand l'agrégat
  -- bougeait de quelques points). On préfère l'absence.
  IF NEW.confidence <> 'C'
     AND NEW.observed_on < (v_set.reference_date - INTERVAL '24 months') THEN
    RAISE EXCEPTION
      'price_expired : observation du % pour un jeu daté du % — au-delà de 24 mois, le prix n''est plus affichable (il reste admis en C, pour la traçabilité)',
      NEW.observed_on, v_set.reference_date;
  END IF;

  IF NEW.confidence <> 'C'
     AND NEW.observed_on < (v_set.reference_date - INTERVAL '12 months')
     AND NEW.reindexation IS NULL THEN
    RAISE EXCEPTION
      'reindexation_required : entre 12 et 24 mois, l''entrée doit porter sa réindexation INSEE (poste COICOP 01.1.x)';
  END IF;

  IF NEW.reindexation IS NOT NULL THEN
    v_factor := (NEW.reindexation->>'to_value')::numeric
                / nullif((NEW.reindexation->>'from_value')::numeric, 0);
    IF v_factor IS NULL
       OR abs(v_factor - (NEW.reindexation->>'factor')::numeric) > 0.0005 THEN
      RAISE EXCEPTION
        'reindexation_invalid : le facteur déclaré (%) ne vaut pas to_value/from_value (%)',
        NEW.reindexation->>'factor', v_factor;
    END IF;
  END IF;

  -- ── Le pivot dit-il à peu près ce que la conversion produirait ? ─────────
  -- Filet à GROSSES MAILLES, et c'est délibéré : 2 % laisse passer tous les
  -- arrondis d'écriture (un prix de 0,50 €/kg arrondi à deux décimales dérive
  -- déjà de 0,6 %) et attrape la seule faute qui compte vraiment — la
  -- conversion oubliée, ou le facteur appliqué à l'envers, qui déplacent le
  -- pivot de 8 % (huile) à 1000 % (pièce). L'arithmétique exacte, avec sa règle
  -- d'arrondi, reste au contrôleur : le fichier est le lieu où la précision se
  -- vérifie, la base est le lieu où l'absurde se refuse.
  IF NEW.conversion_kind <> 'identity' THEN
    v_expected := CASE NEW.conversion_kind
                    WHEN 'density'         THEN NEW.observed_central / NEW.conversion_factor
                    WHEN 'grams_per_piece' THEN NEW.observed_central / (NEW.conversion_factor / 1000)
                  END;
    IF v_expected IS NULL OR abs(NEW.per_kg_central - v_expected) > (0.02 * v_expected) THEN
      RAISE EXCEPTION
        'per_kg_arithmetic : per_kg_central vaut % alors que % ÷ % en produit environ %',
        NEW.per_kg_central, NEW.observed_central, NEW.conversion_factor, round(v_expected, 4);
    END IF;
  END IF;

  -- ── La confiance est un constat, pas une opinion ─────────────────────────
  v_rank_entry := CASE NEW.confidence WHEN 'A' THEN 3 WHEN 'B' THEN 2 ELSE 1 END;
  v_rank_src   := CASE v_src.grants_confidence WHEN 'A' THEN 3 WHEN 'B' THEN 2 WHEN 'C' THEN 1 ELSE 0 END;

  IF NEW.confidence <> 'C' AND v_rank_entry > v_rank_src THEN
    RAISE EXCEPTION
      'confidence_unjustified : % accorde au plus % (l''entrée réclame %)',
      v_src.code, coalesce(v_src.grants_confidence, 'aucun niveau'), NEW.confidence;
  END IF;

  -- A exige un agrégat déclaré, une dispersion en déciles et une observation de
  -- moins de 12 mois. Un point isolé n'est jamais A : il porte la date à
  -- laquelle il a été relevé, pas la période qu'il prétend représenter.
  IF NEW.confidence = 'A' THEN
    IF NEW.observed_aggregation = 'point' THEN
      RAISE EXCEPTION 'confidence_unjustified : A exige un agrégat mensuel ou annuel, pas un relevé ponctuel';
    END IF;
    IF NEW.observed_dispersion <> 'd1_d9' THEN
      RAISE EXCEPTION 'confidence_unjustified : A exige une dispersion en déciles (D1/D9)';
    END IF;
    IF NEW.observed_on < (v_set.reference_date - INTERVAL '12 months') THEN
      RAISE EXCEPTION 'confidence_unjustified : au-delà de 12 mois, la confiance est plafonnée à B';
    END IF;
  END IF;

  -- Une courgette de juillet n'est pas une courgette de janvier, et afficher
  -- l'une pour l'autre serait faux sans être détectable.
  IF NEW.observed_aggregation = 'point'
     AND NEW.category_code IN ('legumes', 'fruits', 'herbes_aromates')
     AND NEW.confidence <> 'C' THEN
    RAISE EXCEPTION
      'confidence_unjustified : un relevé ponctuel sur % est automatiquement C (saisonnalité)',
      NEW.category_code;
  END IF;

  -- ── Le rendement comestible ──────────────────────────────────────────────
  IF NEW.edible_yield_known AND NEW.edible_yield_provenance IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM ops.source_datasets s
      WHERE s.code = NEW.edible_yield_provenance->>'source_code'
        AND s.enabled
        AND s.license_verified_on IS NOT NULL
    ) THEN
      RAISE EXCEPTION
        'yield_invented : la provenance du rendement (%) n''est pas une source active à licence vérifiée',
        NEW.edible_yield_provenance->>'source_code';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION catalog.enforce_price_provenance() IS
  'Porte SQL du référentiel de prix. Elle REFUSE, elle ne signale pas, et elle
   parle le vocabulaire de scripts/data/prices/check-price-provenance.mjs.
   Elle ne sait pas détecter un chiffre inventé — aucun programme ne le sait —
   elle rend l''invention coûteuse en exigeant qu''il soit retrouvable.';

-- L'exécution n'appartient qu'au moteur de trigger : personne n'appelle cette
-- fonction directement, et elle est SECURITY DEFINER.
REVOKE ALL ON FUNCTION catalog.enforce_price_provenance() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_food_form_prices_provenance ON catalog.food_form_prices;
CREATE TRIGGER trg_food_form_prices_provenance
  BEFORE INSERT OR UPDATE ON catalog.food_form_prices
  FOR EACH ROW EXECUTE FUNCTION catalog.enforce_price_provenance();


-- ════════════════════════════════════════════════════════════════════════════
-- 5. RLS ET GRANTS — aligné sur 20260714200005_v2_0005_rls_and_grants.sql
-- ════════════════════════════════════════════════════════════════════════════
-- Régime du catalogue, pas régime per-user : `anon` n'a rien, `authenticated`
-- lit les lignes PUBLIÉES, service_role et data_publisher écrivent.

ALTER TABLE catalog.price_sets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.food_form_prices ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON catalog.price_sets, catalog.food_form_prices FROM anon;

-- 0005 pose bien un ALTER DEFAULT PRIVILEGES sur le schéma `catalog`, mais il
-- ne vaut que pour les tables créées par le MÊME rôle : on accorde donc
-- explicitement, plutôt que de compter dessus.
GRANT SELECT ON catalog.price_sets, catalog.food_form_prices TO authenticated, data_reader;
GRANT SELECT, INSERT, UPDATE ON catalog.price_sets, catalog.food_form_prices TO data_publisher;

-- Un jeu se lit s'il est publié ET s'il a moins de 24 mois. Le second membre
-- est le §5.4 : passé ce délai, la fonctionnalité s'éteint entièrement plutôt
-- que de continuer à afficher des chiffres avec assurance. Le faire porter par
-- la policy, et pas seulement par l'interface, évite qu'un futur appelant
-- redécouvre la règle — ou l'oublie.
DROP POLICY IF EXISTS p_price_sets_read ON catalog.price_sets;
CREATE POLICY p_price_sets_read ON catalog.price_sets
  FOR SELECT TO authenticated USING (
    status = 'published'
    AND reference_date >= (current_date - INTERVAL '24 months')
  );

-- Une entrée se lit si son jeu se lit, si elle est en A ou B, et si elle n'est
-- pas périmée. C ÉQUIVAUT À L'ABSENCE : la faire disparaître ici, au niveau de
-- la ligne, garantit qu'aucun appelant ne pourra la compter dans une couverture
-- « en attendant de filtrer plus tard ».
DROP POLICY IF EXISTS p_food_form_prices_read ON catalog.food_form_prices;
CREATE POLICY p_food_form_prices_read ON catalog.food_form_prices
  FOR SELECT TO authenticated USING (
    confidence IN ('A', 'B')
    AND EXISTS (
      SELECT 1 FROM catalog.price_sets s
      WHERE s.id = food_form_prices.price_set_id
        AND s.status = 'published'
        AND s.reference_date >= (current_date - INTERVAL '24 months')
        AND food_form_prices.observed_on >= (s.reference_date - INTERVAL '24 months')
    )
  );
