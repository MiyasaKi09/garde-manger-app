-- ============================================================================
-- La date de versement, vérifiée SUR UNE VRAIE BASE.
-- ============================================================================
-- Ce fichier existe pour la même raison que supabase/tests/contrat_operationnel.sql :
-- la phase 5 n'applique aucune migration à la main, donc la preuve que la
-- colonne existe ET qu'elle porte les bonnes valeurs doit se rejouer sur une
-- base, pas sur un JSON. Il est appelé deux fois par le job `db-tests` de
-- .github/workflows/ci.yml, et les deux passages ne prouvent pas la même chose :
--
--   — scénario A, après les chargeurs : la CHAÎNE DE PUBLICATION écrit la date
--     (`scripts/data/recipes/build-corpus-v3.mjs` lit `data/recipes/versements.json`).
--     Le SQL y est régénéré par `node scripts/data/...`, donc ce qui est
--     éprouvé est le code d'émission, pas un artefact commité ;
--   — scénario B, après `apply-migrations.sh` : les MIGRATIONS la portent
--     (20260919140000 pour la colonne et la projection, 20260919141000 pour les
--     valeurs sur une base déjà chargée par les tranches). C'est le chemin de
--     la production.
--
-- LE COMPTE ATTENDU VIENT DU REGISTRE, PAS D'ICI. La CI le calcule depuis
-- `data/recipes/versements.json` et le passe en `-v attendu=…` : un lot versé la
-- semaine prochaine fait bouger le registre, le chargeur et ce contrôle
-- ensemble, sans qu'on ait à revenir modifier ce fichier. Sans la variable, le
-- fichier refuse de tourner — c'est voulu : un contrôle qui se compare à un
-- nombre écrit en dur dans deux endroits finit par comparer deux mensonges.
--
--   USAGE :
--     attendu=$(node -e "const r=require('./data/recipes/versements.json'); \
--       console.log(r.versements.reduce((n, v) => n + v.codes.length, 0))")
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v attendu="$attendu" \
--       -f supabase/tests/date_versement.sql
--
-- Tout le fichier tient dans une transaction ANNULÉE à la fin : il ne laisse
-- rien derrière lui, ni la table d'attente, ni le jeton d'auth.
-- ============================================================================

BEGIN;

-- La RPC refuse un appel non authentifié ; le stub d'auth de la CI lit ce
-- réglage, et il est LOCAL à la transaction.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

-- psql n'interpole pas ses variables à l'intérieur d'un bloc DO (qui est une
-- chaîne entre dollars). On la fait donc descendre par une table temporaire,
-- que les blocs ci-dessous relisent.
CREATE TEMP TABLE attente_versement(codes_au_registre integer) ON COMMIT DROP;
INSERT INTO attente_versement VALUES (:attendu);

-- ── 1. Le schéma ────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM 1 FROM information_schema.columns
    WHERE table_schema = 'culinary' AND table_name = 'recipe_versions'
      AND column_name = 'corpus_poured_on' AND data_type = 'date';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[versement] culinary.recipe_versions.corpus_poured_on manque ou n''est pas une date (20260919140000)';
  END IF;

  PERFORM 1 FROM pg_constraint
    WHERE conname = 'recipe_versions_corpus_poured_on_check'
      AND conrelid = 'culinary.recipe_versions'::regclass;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[versement] la borne basse des dates de versement n''est pas contrainte';
  END IF;

  PERFORM 1 FROM pg_indexes
    WHERE schemaname = 'culinary' AND indexname = 'idx_recipe_versions_corpus_poured_on';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[versement] l''index partiel des dates de versement manque';
  END IF;
END $$;

-- ── 2. Les valeurs : ce que le registre déclare, la base le porte ───────────
DO $$
DECLARE
  attendu integer;
  datees integer;
  hors_bornes integer;
  futures integer;
BEGIN
  SELECT codes_au_registre INTO attendu FROM attente_versement;

  SELECT count(*) INTO datees
  FROM culinary.recipe_versions rv
  JOIN ops.source_datasets sd ON sd.id = rv.source_dataset_id
  WHERE sd.code = 'myko_editorial_v3' AND rv.corpus_poured_on IS NOT NULL;

  IF datees <> attendu THEN
    RAISE EXCEPTION '[versement] % recettes datées en base, % codes au registre (data/recipes/versements.json)',
      datees, attendu;
  END IF;

  -- Le seuil du plan (§5, phase 5) : un écran « Nouveautés » qui montre moins
  -- de trente recettes datées ne montre pas un lot, il montre un reste.
  IF datees < 30 THEN
    RAISE EXCEPTION '[versement] % recettes datées seulement : l''écran « Nouveautés » n''a pas de lot à montrer', datees;
  END IF;

  SELECT count(*) INTO hors_bornes
  FROM culinary.recipe_versions
  WHERE corpus_poured_on IS NOT NULL AND corpus_poured_on < DATE '2026-07-15';
  IF hors_bornes > 0 THEN
    RAISE EXCEPTION '[versement] % dates antérieures au premier corpus V3', hors_bornes;
  END IF;

  -- Une date future est un lot qui n'a pas eu lieu : l'écran l'afficherait
  -- comme une nouveauté de la semaine, et elle n'existerait pas.
  SELECT count(*) INTO futures
  FROM culinary.recipe_versions
  WHERE corpus_poured_on > (now() AT TIME ZONE 'UTC')::date;
  IF futures > 0 THEN
    RAISE EXCEPTION '[versement] % dates de versement dans le futur', futures;
  END IF;
END $$;

-- ── 3. La RPC éditoriale publie la date, et seulement là où elle existe ─────
DO $$
DECLARE
  attendu integer;
  charge jsonb;
  datees_servies integer;
  declare_poured integer;
BEGIN
  SELECT codes_au_registre INTO attendu FROM attente_versement;
  charge := public.get_editorial_recipe_catalog_v3(NULL, 500, 0);

  declare_poured := (charge -> 'metadata' ->> 'pouredCount')::integer;
  IF declare_poured IS DISTINCT FROM attendu THEN
    RAISE EXCEPTION '[versement] la RPC éditoriale déclare % recettes datées, le registre en porte %',
      declare_poured, attendu;
  END IF;

  IF (charge -> 'metadata' ->> 'latestPouredOn') IS NULL THEN
    RAISE EXCEPTION '[versement] la RPC éditoriale ne déclare aucune date de dernier versement';
  END IF;

  SELECT count(*) INTO datees_servies
  FROM jsonb_array_elements(charge -> 'recipes') e
  WHERE e ->> 'pouredOn' IS NOT NULL;

  -- Les recettes datées doivent tomber DANS la page servie, sinon l'écran ne
  -- les verrait jamais : la RPC éditoriale plafonne à 500 et ordonne par code.
  IF datees_servies <> attendu THEN
    RAISE EXCEPTION '[versement] % recettes datées dans la page servie, % attendues — le plafond de page les coupe',
      datees_servies, attendu;
  END IF;

  -- UNE ASSERTION RETIRÉE, ET DITE PLUTÔT QUE TUE : « au moins une recette
  -- servie n'a pas de date ». Elle était écrite, elle passait, et elle ne
  -- pouvait pas
  -- échouer : les deux contrôles ci-dessus imposent déjà que le nombre de
  -- recettes datées vaille celui du registre (48) et qu'elles tiennent dans la
  -- page servie (500). Un repli qui daterait tout ferait rougir le premier bien
  -- avant celui-là. Ce qu'il fallait vraiment garder — un repli côté
  -- JavaScript, qui fabriquerait une date que la base ne porte pas — ne se voit
  -- pas depuis le SQL : c'est tests/recipes/versement.test.js qui le tient, sur
  -- `operationalRecipeCards` et `materializeOperationalRecipe`.
END $$;

-- ── 4. Le résumé pour l'accueil dit la même chose que le catalogue ──────────
DO $$
DECLARE
  attendu integer;
  resume jsonb;
  catalogue jsonb;
  cles text[];
BEGIN
  SELECT codes_au_registre INTO attendu FROM attente_versement;
  resume := public.get_recipe_pour_summary_v3(NULL);
  catalogue := public.get_editorial_recipe_catalog_v3(NULL, 500, 0);

  IF (resume -> 'metadata' ->> 'pouredCount')::integer <> attendu THEN
    RAISE EXCEPTION '[versement] le résumé déclare % recettes datées, % attendues',
      (resume -> 'metadata' ->> 'pouredCount'), attendu;
  END IF;

  IF (resume -> 'metadata' ->> 'latestPouredOn')
     IS DISTINCT FROM (catalogue -> 'metadata' ->> 'latestPouredOn') THEN
    RAISE EXCEPTION '[versement] accueil et catalogue ne s''accordent pas sur la date du dernier lot (% contre %)',
      (resume -> 'metadata' ->> 'latestPouredOn'), (catalogue -> 'metadata' ->> 'latestPouredOn');
  END IF;

  -- Le dernier lot est TOUJOURS rendu, même s'il est plus vieux que la fenêtre
  -- par défaut de sept jours : un accueil qui n'affiche rien ne dit pas si le
  -- catalogue ne bouge plus ou si la fenêtre était trop étroite.
  IF jsonb_array_length(resume -> 'recipes') = 0 THEN
    RAISE EXCEPTION '[versement] le résumé ne rend aucune recette alors que la base en porte %', attendu;
  END IF;

  -- Il ne publie ni ingrédients ni étapes : c'est ce qui le rend assez léger
  -- pour l'accueil.
  SELECT array_agg(DISTINCT k ORDER BY k) INTO cles
  FROM jsonb_array_elements(resume -> 'recipes') e, jsonb_object_keys(e) k;
  IF cles <> ARRAY['code', 'cuisineOrigin', 'pouredOn', 'title'] THEN
    RAISE EXCEPTION '[versement] le résumé publie autre chose que code/titre/origine/date : %', cles;
  END IF;
END $$;

-- ── 5. Le planificateur ne voit pas la date, et c'est voulu ────────────────
-- Une nouveauté ne doit pas être servie plus souvent parce qu'elle est
-- nouvelle : la RPC opérationnelle — la seule porte du solveur — ne publie pas
-- ce champ.
DO $$
DECLARE charge jsonb;
BEGIN
  charge := public.get_operational_recipe_catalog_v3(NULL, 100, 0);
  PERFORM 1 FROM jsonb_array_elements(charge -> 'recipes') e
    WHERE e ? 'pouredOn' LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION '[versement] la RPC opérationnelle publie la date de versement : le solveur pourrait s''en servir';
  END IF;
END $$;

-- ── 6. Le résumé refuse un appel non authentifié ───────────────────────────
DO $$
DECLARE refuse boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM public.get_recipe_pour_summary_v3(NULL);
  EXCEPTION WHEN invalid_authorization_specification THEN
    refuse := true;
  END;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  IF NOT refuse THEN
    RAISE EXCEPTION '[versement] get_recipe_pour_summary_v3 répond sans authentification';
  END IF;
END $$;

SELECT '[versement] toutes les assertions passent — '
  || (SELECT count(*) FROM culinary.recipe_versions WHERE corpus_poured_on IS NOT NULL)
  || ' recettes datées, dernier lot le '
  || (SELECT max(corpus_poured_on) FROM culinary.recipe_versions) AS resultat;

ROLLBACK;
