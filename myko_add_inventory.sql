-- ============================================
-- SCRIPT: Ajout d'ingrédients dans l'inventaire pour tests
-- Description: Ajouter quelques lots d'ingrédients pour tester la disponibilité
-- ============================================

-- 1. Obtenir l'ID de l'utilisateur (remplace par ton vrai user_id)
-- SELECT auth.uid(); -- Exécute ceci pour obtenir ton user_id

-- 2. Ajouter des produits dans l'inventaire avec des lots
-- (Remplace 'USER_ID_ICI' par ton vrai user_id)

DO $$
DECLARE
    user_uuid UUID;
    location_uuid UUID;
    product_id INTEGER;
BEGIN
    -- Récupérer le premier utilisateur (adapter selon tes besoins)
    SELECT id INTO user_uuid FROM auth.users LIMIT 1;
    
    -- Récupérer ou créer un emplacement par défaut
    INSERT INTO storage_locations (name, type, user_id, created_at)
    VALUES ('Réfrigérateur principal', 'fridge', user_uuid, NOW())
    ON CONFLICT (name, user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO location_uuid;
    
    -- Si pas d'emplacement trouvé, en créer un nouveau
    IF location_uuid IS NULL THEN
        INSERT INTO storage_locations (name, type, user_id, created_at)
        VALUES ('Réfrigérateur principal', 'fridge', user_uuid, NOW())
        RETURNING id INTO location_uuid;
    END IF;

    -- Ajouter des produits et leurs lots d'inventaire
    
    -- Fruits rouges pour le smoothie
    INSERT INTO products (canonical_food_id, name, brand, user_id, created_at)
    SELECT cf.id, cf.name, 'Bio Marché', user_uuid, NOW()
    FROM canonical_foods cf 
    WHERE cf.name IN ('Myrtilles fraîches', 'Framboises fraîches', 'Fraises fraîches')
    ON CONFLICT (canonical_food_id, user_id) DO NOTHING;
    
    -- Ajouter des lots pour les fruits
    INSERT INTO inventory_lots (
        product_id, 
        location_id, 
        quantity_initial, 
        quantity_remaining, 
        unit, 
        purchase_date, 
        expiry_date, 
        price_per_unit,
        user_id,
        created_at
    )
    SELECT 
        p.id,
        location_uuid,
        500,  -- 500g de chaque
        CASE 
            WHEN cf.name = 'Myrtilles fraîches' THEN 450  -- Quelques myrtilles consommées
            WHEN cf.name = 'Framboises fraîches' THEN 200 -- Beaucoup de framboises consommées
            ELSE 500 -- Fraises entières
        END,
        'g',
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_DATE + INTERVAL '5 days',
        0.02,  -- 2 centimes par gramme
        user_uuid,
        NOW()
    FROM products p
    JOIN canonical_foods cf ON p.canonical_food_id = cf.id
    WHERE cf.name IN ('Myrtilles fraîches', 'Framboises fraîches', 'Fraises fraîches')
    ON CONFLICT DO NOTHING;
    
    -- Ingrédients secs (longue conservation)
    INSERT INTO products (canonical_food_id, name, brand, user_id, created_at)
    SELECT cf.id, cf.name, 'Marque Repère', user_uuid, NOW()
    FROM canonical_foods cf 
    WHERE cf.name IN ('Farine de blé T55', 'Sucre blanc', 'Flocons d''avoine', 'Quinoa blanc')
    ON CONFLICT (canonical_food_id, user_id) DO NOTHING;
    
    -- Lots pour ingrédients secs
    INSERT INTO inventory_lots (
        product_id, 
        location_id, 
        quantity_initial, 
        quantity_remaining, 
        unit, 
        purchase_date, 
        expiry_date, 
        price_per_unit,
        user_id,
        created_at
    )
    SELECT 
        p.id,
        location_uuid,
        1000,  -- 1kg de chaque
        CASE 
            WHEN cf.name = 'Farine de blé T55' THEN 800
            WHEN cf.name = 'Sucre blanc' THEN 900
            WHEN cf.name = 'Flocons d''avoine' THEN 600
            ELSE 1000
        END,
        'g',
        CURRENT_DATE - INTERVAL '1 week',
        CURRENT_DATE + INTERVAL '6 months',
        0.003,
        user_uuid,
        NOW()
    FROM products p
    JOIN canonical_foods cf ON p.canonical_food_id = cf.id
    WHERE cf.name IN ('Farine de blé T55', 'Sucre blanc', 'Flocons d''avoine', 'Quinoa blanc')
    ON CONFLICT DO NOTHING;
    
    -- Produits laitiers
    INSERT INTO products (canonical_food_id, name, brand, user_id, created_at)
    SELECT cf.id, cf.name, 'Lactalis', user_uuid, NOW()
    FROM canonical_foods cf 
    WHERE cf.name IN ('Lait entier', 'Beurre doux', 'Œufs de poule')
    ON CONFLICT (canonical_food_id, user_id) DO NOTHING;
    
    -- Lots produits laitiers
    INSERT INTO inventory_lots (
        product_id, 
        location_id, 
        quantity_initial, 
        quantity_remaining, 
        unit, 
        purchase_date, 
        expiry_date, 
        price_per_unit,
        user_id,
        created_at
    )
    SELECT 
        p.id,
        location_uuid,
        CASE 
            WHEN cf.name = 'Lait entier' THEN 1000
            WHEN cf.name = 'Beurre doux' THEN 250
            ELSE 12  -- œufs
        END,
        CASE 
            WHEN cf.name = 'Lait entier' THEN 600  -- Il reste 600ml
            WHEN cf.name = 'Beurre doux' THEN 100  -- Il reste 100g
            ELSE 8  -- Il reste 8 œufs
        END,
        CASE 
            WHEN cf.name = 'Œufs de poule' THEN 'unité'
            ELSE 'ml'
        END,
        CURRENT_DATE - INTERVAL '3 days',
        CASE 
            WHEN cf.name = 'Lait entier' THEN CURRENT_DATE + INTERVAL '4 days'
            WHEN cf.name = 'Beurre doux' THEN CURRENT_DATE + INTERVAL '2 weeks'
            ELSE CURRENT_DATE + INTERVAL '10 days'
        END,
        CASE 
            WHEN cf.name = 'Lait entier' THEN 0.0015
            WHEN cf.name = 'Beurre doux' THEN 0.02
            ELSE 0.25  -- 25 centimes par œuf
        END,
        user_uuid,
        NOW()
    FROM products p
    JOIN canonical_foods cf ON p.canonical_food_id = cf.id
    WHERE cf.name IN ('Lait entier', 'Beurre doux', 'Œufs de poule')
    ON CONFLICT DO NOTHING;

    -- Légumes et herbes (certains manquants pour créer de l'urgence)
    INSERT INTO products (canonical_food_id, name, brand, user_id, created_at)
    SELECT cf.id, cf.name, 'Producteur local', user_uuid, NOW()
    FROM canonical_foods cf 
    WHERE cf.name IN ('Tomates cerises', 'Oignon jaune', 'Ail')
    ON CONFLICT (canonical_food_id, user_id) DO NOTHING;
    
    -- Lots légumes (avec quelques ruptures pour tester le système)
    INSERT INTO inventory_lots (
        product_id, 
        location_id, 
        quantity_initial, 
        quantity_remaining, 
        unit, 
        purchase_date, 
        expiry_date, 
        price_per_unit,
        user_id,
        created_at
    )
    SELECT 
        p.id,
        location_uuid,
        CASE 
            WHEN cf.name = 'Tomates cerises' THEN 500
            WHEN cf.name = 'Oignon jaune' THEN 1000
            ELSE 100  -- Ail
        END,
        CASE 
            WHEN cf.name = 'Tomates cerises' THEN 200
            WHEN cf.name = 'Oignon jaune' THEN 800
            ELSE 50  -- Ail
        END,
        'g',
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_DATE + INTERVAL '7 days',
        CASE 
            WHEN cf.name = 'Tomates cerises' THEN 0.008
            WHEN cf.name = 'Oignon jaune' THEN 0.002
            ELSE 0.02
        END,
        user_uuid,
        NOW()
    FROM products p
    JOIN canonical_foods cf ON p.canonical_food_id = cf.id
    WHERE cf.name IN ('Tomates cerises', 'Oignon jaune', 'Ail')
    ON CONFLICT DO NOTHING;

END $$;