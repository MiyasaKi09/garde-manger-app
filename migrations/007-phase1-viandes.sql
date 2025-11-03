-- Migration 007: Phase 1 - Viandes (59 ingrédients)
-- Date: 2025-10-30
-- Description: Crée les viandes manquantes avec hiérarchie parent/enfant

DO $$
DECLARE
  boeuf_id BIGINT;
  veau_id BIGINT;
  agneau_id BIGINT;
  porc_id BIGINT;
  poulet_id BIGINT;

  parent_steak_boeuf_id BIGINT;
  parent_boeuf_morceaux_id BIGINT;
  parent_escalope_veau_id BIGINT;
  parent_veau_morceaux_id BIGINT;
  parent_roti_veau_id BIGINT;
  parent_cotelette_agneau_id BIGINT;
  parent_gigot_agneau_id BIGINT;
  parent_epaule_agneau_id BIGINT;
  parent_jambon_id BIGINT;
  parent_lardons_id BIGINT;
  parent_saucisse_id BIGINT;
  parent_bouillon_poulet_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   PHASE 1.2 : VIANDES (59 ingrédients)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Récupérer les IDs des canonical_foods
  SELECT id INTO boeuf_id FROM canonical_foods WHERE canonical_name = 'bœuf';
  SELECT id INTO veau_id FROM canonical_foods WHERE canonical_name = 'veau';
  SELECT id INTO agneau_id FROM canonical_foods WHERE canonical_name = 'agneau';
  SELECT id INTO porc_id FROM canonical_foods WHERE canonical_name = 'porc';
  SELECT id INTO poulet_id FROM canonical_foods WHERE canonical_name = 'poulet';

  RAISE NOTICE 'IDs canonical: boeuf=%, veau=%, agneau=%, porc=%, poulet=%', boeuf_id, veau_id, agneau_id, porc_id, poulet_id;

  -- =====================================================
  -- BŒUF (17 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 BŒUF';

  -- PARENT: steak de bœuf (flexible)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'steak de bœuf' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('steak de bœuf', boeuf_id, 'steak', 'g', NULL)
    RETURNING id INTO parent_steak_boeuf_id;
    RAISE NOTICE '  ✅ Créé parent: steak de bœuf (id: %)', parent_steak_boeuf_id;
  ELSE
    SELECT id INTO parent_steak_boeuf_id FROM archetypes WHERE name = 'steak de bœuf' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: steak de bœuf (id: %)', parent_steak_boeuf_id;
  END IF;

  -- ENFANTS de steak de bœuf
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'entrecôte de bœuf') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('entrecôte de bœuf', boeuf_id, 'steak', 'g', parent_steak_boeuf_id);
    RAISE NOTICE '  ✅ entrecôte de bœuf → steak de bœuf';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bavette') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bavette', boeuf_id, 'steak', 'g', parent_steak_boeuf_id);
    RAISE NOTICE '  ✅ bavette → steak de bœuf';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pavé de bœuf') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pavé de bœuf', boeuf_id, 'steak', 'g', parent_steak_boeuf_id);
    RAISE NOTICE '  ✅ pavé de bœuf → steak de bœuf';
  END IF;

  -- PARENT: bœuf en morceaux (pour mijoter/braiser)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bœuf en morceaux' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bœuf en morceaux', boeuf_id, 'en morceaux', 'g', NULL)
    RETURNING id INTO parent_boeuf_morceaux_id;
    RAISE NOTICE '  ✅ Créé parent: bœuf en morceaux (id: %)', parent_boeuf_morceaux_id;
  ELSE
    SELECT id INTO parent_boeuf_morceaux_id FROM archetypes WHERE name = 'bœuf en morceaux' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: bœuf en morceaux (id: %)', parent_boeuf_morceaux_id;
  END IF;

  -- ENFANTS de bœuf en morceaux
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bœuf à braiser') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bœuf à braiser', boeuf_id, 'en morceaux', 'g', parent_boeuf_morceaux_id);
    RAISE NOTICE '  ✅ bœuf à braiser → bœuf en morceaux';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bœuf à mijoter') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bœuf à mijoter', boeuf_id, 'en morceaux', 'g', parent_boeuf_morceaux_id);
    RAISE NOTICE '  ✅ bœuf à mijoter → bœuf en morceaux';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'paleron de bœuf') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('paleron de bœuf', boeuf_id, 'en morceaux', 'g', parent_boeuf_morceaux_id);
    RAISE NOTICE '  ✅ paleron de bœuf → bœuf en morceaux';
  END IF;

  -- AUTRES DÉCOUPES (standalone)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'côte de bœuf') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('côte de bœuf', boeuf_id, 'côte', 'g');
    RAISE NOTICE '  ✅ côte de bœuf (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'filet de bœuf') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('filet de bœuf', boeuf_id, 'filet', 'g');
    RAISE NOTICE '  ✅ filet de bœuf (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'araignée de bœuf') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('araignée de bœuf', boeuf_id, 'transformation', 'g');
    RAISE NOTICE '  ✅ araignée de bœuf (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bœuf effiloché') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('bœuf effiloché', boeuf_id, 'transformation', 'g');
    RAISE NOTICE '  ✅ bœuf effiloché (standalone)';
  END IF;

  -- =====================================================
  -- VEAU (14 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 VEAU';

  -- PARENT: escalope de veau
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'escalope de veau' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('escalope de veau', veau_id, 'escalope', 'pièce', NULL)
    RETURNING id INTO parent_escalope_veau_id;
    RAISE NOTICE '  ✅ Créé parent: escalope de veau (id: %)', parent_escalope_veau_id;
  ELSE
    SELECT id INTO parent_escalope_veau_id FROM archetypes WHERE name = 'escalope de veau' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: escalope de veau (id: %)', parent_escalope_veau_id;
  END IF;

  -- PARENT: veau en morceaux
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'veau en morceaux' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('veau en morceaux', veau_id, 'en morceaux', 'g', NULL)
    RETURNING id INTO parent_veau_morceaux_id;
    RAISE NOTICE '  ✅ Créé parent: veau en morceaux (id: %)', parent_veau_morceaux_id;
  ELSE
    SELECT id INTO parent_veau_morceaux_id FROM archetypes WHERE name = 'veau en morceaux' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: veau en morceaux (id: %)', parent_veau_morceaux_id;
  END IF;

  -- ENFANTS de veau en morceaux
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'sauté de veau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('sauté de veau', veau_id, 'en morceaux', 'g', parent_veau_morceaux_id);
    RAISE NOTICE '  ✅ sauté de veau → veau en morceaux';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'veau pour blanquette') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('veau pour blanquette', veau_id, 'en morceaux', 'g', parent_veau_morceaux_id);
    RAISE NOTICE '  ✅ veau pour blanquette → veau en morceaux';
  END IF;

  -- PARENT: rôti de veau
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'rôti de veau' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('rôti de veau', veau_id, 'rôti', 'g', NULL)
    RETURNING id INTO parent_roti_veau_id;
    RAISE NOTICE '  ✅ Créé parent: rôti de veau (id: %)', parent_roti_veau_id;
  ELSE
    SELECT id INTO parent_roti_veau_id FROM archetypes WHERE name = 'rôti de veau' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: rôti de veau (id: %)', parent_roti_veau_id;
  END IF;

  -- AUTRES VEAU
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'veau haché') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('veau haché', veau_id, 'haché', 'g');
    RAISE NOTICE '  ✅ veau haché (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'côte de veau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('côte de veau', veau_id, 'côte', 'pièce');
    RAISE NOTICE '  ✅ côte de veau (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'filet de veau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('filet de veau', veau_id, 'filet', 'g');
    RAISE NOTICE '  ✅ filet de veau (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'jarret de veau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('jarret de veau', veau_id, 'jarret', 'tranche');
    RAISE NOTICE '  ✅ jarret de veau (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'paupiettes de veau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('paupiettes de veau', veau_id, 'transformation', 'pièce');
    RAISE NOTICE '  ✅ paupiettes de veau (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'grenadins de veau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('grenadins de veau', veau_id, 'transformation', 'g');
    RAISE NOTICE '  ✅ grenadins de veau (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'os de veau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('os de veau', veau_id, 'os', 'g');
    RAISE NOTICE '  ✅ os de veau (standalone)';
  END IF;

  -- =====================================================
  -- AGNEAU (10 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 AGNEAU';

  -- PARENT: côtelette d'agneau
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'côtelette d''agneau' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('côtelette d''agneau', agneau_id, 'côtelette', 'pièce', NULL)
    RETURNING id INTO parent_cotelette_agneau_id;
    RAISE NOTICE '  ✅ Créé parent: côtelette d''agneau (id: %)', parent_cotelette_agneau_id;
  ELSE
    SELECT id INTO parent_cotelette_agneau_id FROM archetypes WHERE name = 'côtelette d''agneau' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: côtelette d''agneau (id: %)', parent_cotelette_agneau_id;
  END IF;

  -- PARENT: gigot d'agneau
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'gigot d''agneau' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('gigot d''agneau', agneau_id, 'gigot', 'g', NULL)
    RETURNING id INTO parent_gigot_agneau_id;
    RAISE NOTICE '  ✅ Créé parent: gigot d''agneau (id: %)', parent_gigot_agneau_id;
  ELSE
    SELECT id INTO parent_gigot_agneau_id FROM archetypes WHERE name = 'gigot d''agneau' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: gigot d''agneau (id: %)', parent_gigot_agneau_id;
  END IF;

  -- PARENT: épaule d'agneau
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'épaule d''agneau' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('épaule d''agneau', agneau_id, 'épaule', 'g', NULL)
    RETURNING id INTO parent_epaule_agneau_id;
    RAISE NOTICE '  ✅ Créé parent: épaule d''agneau (id: %)', parent_epaule_agneau_id;
  ELSE
    SELECT id INTO parent_epaule_agneau_id FROM archetypes WHERE name = 'épaule d''agneau' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: épaule d''agneau (id: %)', parent_epaule_agneau_id;
  END IF;

  -- AUTRES AGNEAU
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'agneau haché') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('agneau haché', agneau_id, 'haché', 'g');
    RAISE NOTICE '  ✅ agneau haché (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'filet d''agneau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('filet d''agneau', agneau_id, 'filet', 'g');
    RAISE NOTICE '  ✅ filet d''agneau (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'carré d''agneau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('carré d''agneau', agneau_id, 'carré', 'g');
    RAISE NOTICE '  ✅ carré d''agneau (standalone)';
  END IF;

  -- =====================================================
  -- PORC / CHARCUTERIE (16 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 PORC / CHARCUTERIE';

  -- Récupérer le parent jambon existant
  SELECT id INTO parent_jambon_id FROM archetypes WHERE name = 'jambon' AND parent_archetype_id IS NULL;

  IF parent_jambon_id IS NOT NULL THEN
    RAISE NOTICE '  ℹ️  Parent jambon existe: id=%', parent_jambon_id;

    -- Créer les enfants de jambon
    IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'jambon blanc') THEN
      INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
      VALUES ('jambon blanc', porc_id, 'transformation', 'g', parent_jambon_id);
      RAISE NOTICE '  ✅ jambon blanc → jambon';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'jambon cru') THEN
      INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
      VALUES ('jambon cru', porc_id, 'transformation', 'g', parent_jambon_id);
      RAISE NOTICE '  ✅ jambon cru → jambon';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'jambon cuit') THEN
      INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
      VALUES ('jambon cuit', porc_id, 'transformation', 'g', parent_jambon_id);
      RAISE NOTICE '  ✅ jambon cuit → jambon';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'jambon serrano') THEN
      INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
      VALUES ('jambon serrano', porc_id, 'transformation', 'g', parent_jambon_id);
      RAISE NOTICE '  ✅ jambon serrano → jambon';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'jambon ibérique') THEN
      INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
      VALUES ('jambon ibérique', porc_id, 'transformation', 'g', parent_jambon_id);
      RAISE NOTICE '  ✅ jambon ibérique → jambon';
    END IF;
  ELSE
    RAISE NOTICE '  ⚠️  Parent jambon non trouvé, création standalone';
  END IF;

  -- Lardons
  SELECT id INTO parent_lardons_id FROM archetypes WHERE name = 'lardon' AND parent_archetype_id IS NULL;

  IF parent_lardons_id IS NULL THEN
    -- Créer le parent lardons
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('lardons', porc_id, 'transformation', 'g', NULL)
    RETURNING id INTO parent_lardons_id;
    RAISE NOTICE '  ✅ Créé parent: lardons (id: %)', parent_lardons_id;
  ELSE
    RAISE NOTICE '  ℹ️  Parent lardons existe: id=%', parent_lardons_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'lardons fumés') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('lardons fumés', porc_id, 'fumé', 'g', parent_lardons_id);
    RAISE NOTICE '  ✅ lardons fumés → lardons';
  END IF;

  -- Saucisses
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'saucisse' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('saucisse', porc_id, 'transformation', 'g', NULL)
    RETURNING id INTO parent_saucisse_id;
    RAISE NOTICE '  ✅ Créé parent: saucisse (id: %)', parent_saucisse_id;
  ELSE
    SELECT id INTO parent_saucisse_id FROM archetypes WHERE name = 'saucisse' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Parent saucisse existe: id=%', parent_saucisse_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'saucisse de Toulouse') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('saucisse de Toulouse', porc_id, 'transformation', 'g', parent_saucisse_id);
    RAISE NOTICE '  ✅ saucisse de Toulouse → saucisse';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'saucisse de Strasbourg') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('saucisse de Strasbourg', porc_id, 'transformation', 'g', parent_saucisse_id);
    RAISE NOTICE '  ✅ saucisse de Strasbourg → saucisse';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'saucisse fumée') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('saucisse fumée', porc_id, 'fumé', 'g', parent_saucisse_id);
    RAISE NOTICE '  ✅ saucisse fumée → saucisse';
  END IF;

  -- Autres porc
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'chair à saucisse') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('chair à saucisse', porc_id, 'transformation', 'g');
    RAISE NOTICE '  ✅ chair à saucisse (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'lard') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('lard', porc_id, 'transformation', 'g');
    RAISE NOTICE '  ✅ lard (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'boudin noir') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('boudin noir', porc_id, 'transformation', 'g');
    RAISE NOTICE '  ✅ boudin noir (standalone)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'foie de porc') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit)
    VALUES ('foie de porc', porc_id, 'abats', 'g');
    RAISE NOTICE '  ✅ foie de porc (standalone)';
  END IF;

  -- =====================================================
  -- VOLAILLE (2 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 VOLAILLE';

  -- bouillon de poulet (parent)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bouillon de poulet' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bouillon de poulet', poulet_id, 'bouillon', 'ml', NULL)
    RETURNING id INTO parent_bouillon_poulet_id;
    RAISE NOTICE '  ✅ Créé parent: bouillon de poulet (id: %)', parent_bouillon_poulet_id;
  ELSE
    SELECT id INTO parent_bouillon_poulet_id FROM archetypes WHERE name = 'bouillon de poulet' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe: bouillon de poulet (id: %)', parent_bouillon_poulet_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bouillon de volaille') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bouillon de volaille', poulet_id, 'bouillon', 'ml', parent_bouillon_poulet_id);
    RAISE NOTICE '  ✅ bouillon de volaille → bouillon de poulet';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 1.2 terminée : 59 ingrédients viandes créés';

END $$;
