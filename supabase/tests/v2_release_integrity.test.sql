-- ============================================================================
-- Test — Intégrité des releases + immuabilité (fix F0, points 8, 9, 14)
-- Exécutable via `supabase db test`, psql, ou l'éditeur SQL. Lève une exception
-- si un invariant est violé. Nettoie ses propres données de test.
-- ============================================================================

-- 1. Immuabilité d'une version de recette publiée.
DO $$
DECLARE fam uuid; ver uuid; caught boolean;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,status)
    VALUES('__t_immut_fam','__t_immut_fam','candidate') RETURNING id INTO fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,servings,content_hash,publication_status)
    VALUES(fam,1,'t',2,'__t_immut_hash','published') RETURNING id INTO ver;

  caught := false;
  BEGIN UPDATE culinary.recipe_versions SET title='x' WHERE id=ver; EXCEPTION WHEN others THEN caught:=true; END;
  ASSERT caught, 'modif de contenu d''une version publiée doit être bloquée';

  caught := false;
  BEGIN DELETE FROM culinary.recipe_versions WHERE id=ver; EXCEPTION WHEN others THEN caught:=true; END;
  ASSERT caught, 'suppression d''une version publiée doit être bloquée';

  UPDATE culinary.recipe_versions SET publication_status='superseded' WHERE id=ver; -- transition autorisée
  DELETE FROM culinary.recipe_versions WHERE id=ver;
  DELETE FROM culinary.recipe_families WHERE id=fam;
END $$;

-- 2. Immuabilité totale d'un snapshot d'exécution.
DO $$
DECLARE fam uuid; ver uuid; ex uuid; caught boolean;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,status)
    VALUES('__t_exec_fam','__t_exec_fam','candidate') RETURNING id INTO fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,servings,content_hash,publication_status)
    VALUES(fam,1,'t',2,'__t_exec_hash','draft') RETURNING id INTO ver;
  INSERT INTO culinary.recipe_executions(recipe_version_id,selected_configuration,servings,
    exact_ingredients_snapshot,exact_steps_snapshot,nutrition_snapshot,transformation_plan_snapshot,
    source_lot_plan_snapshot,content_hash)
    VALUES(ver,'{}','2','[]','[]','{}','[]','[]','__t_exec_snap') RETURNING id INTO ex;

  caught := false;
  BEGIN UPDATE culinary.recipe_executions SET servings='4' WHERE id=ex; EXCEPTION WHEN others THEN caught:=true; END;
  ASSERT caught, 'modif d''un snapshot d''exécution doit être bloquée';

  -- nettoyage : le trigger bloque aussi la suppression → on désactive localement.
  ALTER TABLE culinary.recipe_executions DISABLE TRIGGER trg_recipe_executions_immutable;
  DELETE FROM culinary.recipe_executions WHERE id=ex;
  ALTER TABLE culinary.recipe_executions ENABLE TRIGGER trg_recipe_executions_immutable;
  DELETE FROM culinary.recipe_versions WHERE id=ver;
  DELETE FROM culinary.recipe_families WHERE id=fam;
END $$;

-- 3. Atomicité : aucune forme publiée en dehors d'une release publiée & active.
DO $$
DECLARE n int; a int;
BEGIN
  SELECT count(*) INTO n FROM catalog.food_forms ff
    JOIN ops.catalog_release_items ri ON ri.entity_id=ff.id AND ri.entity_table='food_forms'
    JOIN ops.catalog_releases r ON r.id=ri.release_id AND r.status<>'published'
   WHERE ff.status='published';
  ASSERT n = 0, format('%s forme(s) publiée(s) rattachée(s) à une release non publiée', n);

  -- F0 rétractée : confiance nutrition B conservée, identité ramenée à C.
  SELECT count(*) INTO a FROM catalog.food_nutrition_profiles
   WHERE data_version='2020-07-07' AND confidence_level='B';
  ASSERT a = 300, format('profils Ciqual attendus en B: 300, trouvé %s', a);
END $$;

SELECT 'v2_release_integrity.test.sql : OK' AS result;
