# Requêtes SQL courantes - Basées sur votre vraie structure

## 🔍 **Recherche et affichage de produits**

### Recherche intelligente de produits (comme dans SmartAddForm)
```sql
-- Recherche principale sur canonical_foods (utilisée dans votre app)
SELECT 
    cf.id,
    cf.canonical_name,
    cf.category_id,
    cf.subcategory,
    cf.keywords,
    cf.primary_unit,
    cf.shelf_life_days_pantry,
    cf.shelf_life_days_fridge,
    cf.shelf_life_days_freezer,
    rc.name as category_name,
    rc.icon as category_icon
FROM canonical_foods cf
LEFT JOIN reference_categories rc ON cf.category_id = rc.id
WHERE cf.canonical_name ILIKE '%tomate%'
   OR cf.subcategory ILIKE '%tomate%'
   OR 'tomate' = ANY(cf.keywords)
ORDER BY 
    -- Score de pertinence
    CASE 
        WHEN LOWER(cf.canonical_name) = 'tomate' THEN 100
        WHEN LOWER(cf.canonical_name) LIKE 'tomate%' THEN 80
        WHEN LOWER(cf.canonical_name) LIKE '%tomate%' THEN 60
        ELSE 40
    END DESC,
    cf.canonical_name
LIMIT 10;
```

### Recherche avec aliases pour plus de résultats
```sql
-- Recherche étendue incluant les alias
WITH search_results AS (
    -- Recherche directe
    SELECT cf.id, cf.canonical_name, 'direct' as source, 100 as score
    FROM canonical_foods cf
    WHERE cf.canonical_name ILIKE '%pomme%'
    
    UNION ALL
    
    -- Recherche via alias
    SELECT cf.id, cf.canonical_name, 'alias' as source, 80 as score
    FROM canonical_foods cf
    JOIN product_aliases pa ON cf.id = pa.canonical_food_id
    WHERE pa.alias_name ILIKE '%pomme%'
    
    UNION ALL
    
    -- Recherche dans keywords
    SELECT cf.id, cf.canonical_name, 'keyword' as source, 60 as score
    FROM canonical_foods cf
    WHERE 'pomme' = ANY(cf.keywords)
)
SELECT DISTINCT 
    sr.id, 
    sr.canonical_name,
    MAX(sr.score) as best_score,
    cf.primary_unit,
    rc.icon
FROM search_results sr
JOIN canonical_foods cf ON sr.id = cf.id
LEFT JOIN reference_categories rc ON cf.category_id = rc.id
GROUP BY sr.id, sr.canonical_name, cf.primary_unit, rc.icon
ORDER BY best_score DESC, sr.canonical_name
LIMIT 10;
```

## 📦 **Gestion de l'inventaire**

### Vue complète de l'inventaire (comme votre vue pantry)
```sql
-- Inventaire complet avec statuts d'expiration
SELECT 
    il.id,
    il.qty_remaining,
    il.unit,
    il.storage_method,
    il.storage_place,
    il.expiration_date,
    il.acquired_on,
    
    -- Nom d'affichage selon la hiérarchie
    COALESCE(
        cf.canonical_name,
        cv.cultivar_name,
        dp.derived_name,
        gp.name,
        'Produit inconnu'
    ) as product_name,
    
    -- Catégorie et icône
    COALESCE(rc_cf.name, rc_gp.name) as category_name,
    COALESCE(rc_cf.icon, rc_gp.icon, '📦') as category_icon,
    
    -- Statut d'expiration
    CASE 
        WHEN il.expiration_date IS NULL THEN 'no_date'
        WHEN il.expiration_date < CURRENT_DATE THEN 'expired'
        WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'expires_soon'
        WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expires_this_week'
        ELSE 'good'
    END as expiration_status,
    
    -- Jours restants
    EXTRACT(days FROM il.expiration_date - CURRENT_DATE)::integer as days_until_expiration

FROM inventory_lots il
LEFT JOIN canonical_foods cf ON il.canonical_food_id = cf.id
LEFT JOIN cultivars cv ON il.cultivar_id = cv.id
LEFT JOIN derived_products dp ON il.derived_product_id = dp.id
LEFT JOIN generic_products gp ON il.generic_product_id = gp.id
LEFT JOIN reference_categories rc_cf ON cf.category_id = rc_cf.id
LEFT JOIN reference_categories rc_gp ON gp.category_id = rc_gp.id

WHERE il.qty_remaining > 0

ORDER BY 
    -- Prioriser les produits qui expirent
    CASE 
        WHEN il.expiration_date < CURRENT_DATE THEN 1
        WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 2
        WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 3
        ELSE 4
    END,
    il.expiration_date ASC NULLS LAST;
```

### Ajouter un lot (comme dans SmartAddForm)
```sql
-- Insertion d'un nouveau lot basé sur canonical_food
INSERT INTO inventory_lots (
    canonical_food_id,
    qty_remaining,
    initial_qty,
    unit,
    storage_method,
    storage_place,
    expiration_date,
    acquired_on,
    source
) VALUES (
    287, -- ID de "pomme" dans canonical_foods
    1.5,
    1.5,
    'kg',
    'fridge',
    'Réfrigérateur',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE,
    'manual'
);
```

### Produits qui expirent bientôt
```sql
SELECT 
    COALESCE(cf.canonical_name, cv.cultivar_name, dp.derived_name, gp.name) as product_name,
    il.qty_remaining || ' ' || il.unit as quantity,
    il.storage_place,
    il.expiration_date,
    EXTRACT(days FROM il.expiration_date - CURRENT_DATE)::integer as days_left,
    COALESCE(rc_cf.icon, rc_gp.icon, '📦') as icon
    
FROM inventory_lots il
LEFT JOIN canonical_foods cf ON il.canonical_food_id = cf.id
LEFT JOIN cultivars cv ON il.cultivar_id = cv.id
LEFT JOIN derived_products dp ON il.derived_product_id = dp.id
LEFT JOIN generic_products gp ON il.generic_product_id = gp.id
LEFT JOIN reference_categories rc_cf ON cf.category_id = rc_cf.id
LEFT JOIN reference_categories rc_gp ON gp.category_id = rc_gp.id

WHERE il.qty_remaining > 0
  AND il.expiration_date <= CURRENT_DATE + INTERVAL '7 days'
  
ORDER BY il.expiration_date ASC;
```

## 🏷️ **Catégories et référentiels**

### Statistiques par catégorie
```sql
SELECT 
    rc.name as category,
    rc.icon,
    rc.typical_storage,
    rc.average_shelf_life_days,
    
    -- Nombre d'aliments canoniques
    COUNT(DISTINCT cf.id) as nb_canonical_foods,
    
    -- Nombre de lots en stock
    COUNT(DISTINCT il.id) as nb_lots_in_stock,
    
    -- Quantité totale en stock (approximative)
    SUM(CASE WHEN il.unit = 'g' THEN il.qty_remaining ELSE 0 END) as total_grams,
    SUM(CASE WHEN il.unit = 'kg' THEN il.qty_remaining ELSE 0 END) as total_kg,
    
    -- Lots qui expirent bientôt
    COUNT(CASE WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 1 END) as lots_expiring_soon

FROM reference_categories rc
LEFT JOIN canonical_foods cf ON rc.id = cf.category_id
LEFT JOIN inventory_lots il ON cf.id = il.canonical_food_id AND il.qty_remaining > 0

GROUP BY rc.id, rc.name, rc.icon, rc.typical_storage, rc.average_shelf_life_days
ORDER BY rc.sort_priority, rc.name;
```

### Lieux de stockage avec compteurs
```sql
SELECT 
    l.name as location,
    l.icon,
    l.sort_order,
    
    -- Comptage des lots par lieu
    COUNT(il.id) as nb_lots,
    
    -- Répartition par statut d'expiration
    COUNT(CASE 
        WHEN il.expiration_date IS NULL THEN 1 
    END) as no_expiration_date,
    
    COUNT(CASE 
        WHEN il.expiration_date < CURRENT_DATE THEN 1 
    END) as expired,
    
    COUNT(CASE 
        WHEN il.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days' THEN 1 
    END) as expires_soon,
    
    COUNT(CASE 
        WHEN il.expiration_date > CURRENT_DATE + INTERVAL '3 days' THEN 1 
    END) as good_condition

FROM locations l
LEFT JOIN inventory_lots il ON l.name = il.storage_place AND il.qty_remaining > 0

GROUP BY l.id, l.name, l.icon, l.sort_order
ORDER BY l.sort_order;
```

## 🍳 **Système de recettes**

### Recettes avec ingrédients disponibles
```sql
-- Recettes avec disponibilité des ingrédients
WITH recipe_ingredients_check AS (
    SELECT 
        r.id as recipe_id,
        r.title,
        ri.id as ingredient_id,
        
        -- Nom de l'ingrédient
        COALESCE(
            cf.canonical_name,
            cv.cultivar_name,
            dp.derived_name,
            gp.name
        ) as ingredient_name,
        
        ri.qty as needed_qty,
        ri.unit as needed_unit,
        
        -- Quantité disponible en stock
        SUM(il.qty_remaining) as available_qty,
        
        -- L'ingrédient est-il disponible ?
        CASE 
            WHEN SUM(il.qty_remaining) >= ri.qty THEN true
            ELSE false
        END as is_available
        
    FROM recipes r
    JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    LEFT JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
    LEFT JOIN cultivars cv ON ri.cultivar_id = cv.id
    LEFT JOIN derived_products dp ON ri.derived_product_id = dp.id
    LEFT JOIN generic_products gp ON ri.generic_product_id = gp.id
    
    -- Stock disponible pour cet ingrédient
    LEFT JOIN inventory_lots il ON (
        (ri.canonical_food_id IS NOT NULL AND il.canonical_food_id = ri.canonical_food_id)
        OR (ri.cultivar_id IS NOT NULL AND il.cultivar_id = ri.cultivar_id)
        OR (ri.derived_product_id IS NOT NULL AND il.derived_product_id = ri.derived_product_id)
        OR (ri.generic_product_id IS NOT NULL AND il.generic_product_id = ri.generic_product_id)
    ) AND il.qty_remaining > 0 AND ri.unit = il.unit
    
    GROUP BY r.id, r.title, ri.id, ri.qty, ri.unit, cf.canonical_name, cv.cultivar_name, dp.derived_name, gp.name
)
SELECT 
    recipe_id,
    title,
    COUNT(*) as total_ingredients,
    COUNT(CASE WHEN is_available THEN 1 END) as available_ingredients,
    
    -- Pourcentage d'ingrédients disponibles
    ROUND(
        COUNT(CASE WHEN is_available THEN 1 END) * 100.0 / COUNT(*), 
        1
    ) as availability_percent
    
FROM recipe_ingredients_check
GROUP BY recipe_id, title
ORDER BY availability_percent DESC, title;
```

### Utilisation d'ingrédients pour une recette
```sql
-- Consommer les ingrédients d'une recette (mise à jour des stocks)
WITH recipe_consumption AS (
    SELECT 
        ri.canonical_food_id,
        ri.cultivar_id,
        ri.derived_product_id,
        ri.generic_product_id,
        ri.qty as needed_qty,
        ri.unit
    FROM recipe_ingredients ri
    WHERE ri.recipe_id = 'uuid-de-la-recette'
)
-- Ici vous pourriez faire des UPDATE sur inventory_lots
-- pour réduire les quantités selon la consommation
SELECT * FROM recipe_consumption;
```

## 📊 **Analyses et statistiques**

### Gaspillage alimentaire
```sql
-- Analyse du gaspillage (produits expirés)
SELECT 
    COALESCE(cf.canonical_name, cv.cultivar_name, dp.derived_name, gp.name) as product_name,
    COALESCE(rc_cf.name, rc_gp.name) as category,
    il.qty_remaining,
    il.unit,
    il.expiration_date,
    -EXTRACT(days FROM il.expiration_date - CURRENT_DATE)::integer as days_expired,
    
    -- Estimation de la valeur perdue (exemple)
    il.qty_remaining * 0.02 as estimated_loss_euros -- 2 centimes par gramme
    
FROM inventory_lots il
LEFT JOIN canonical_foods cf ON il.canonical_food_id = cf.id
LEFT JOIN cultivars cv ON il.cultivar_id = cv.id
LEFT JOIN derived_products dp ON il.derived_product_id = dp.id
LEFT JOIN generic_products gp ON il.generic_product_id = gp.id
LEFT JOIN reference_categories rc_cf ON cf.category_id = rc_cf.id
LEFT JOIN reference_categories rc_gp ON gp.category_id = rc_gp.id

WHERE il.expiration_date < CURRENT_DATE
  AND il.qty_remaining > 0

ORDER BY il.expiration_date DESC;
```

### Tendances d'achat par mois
```sql
SELECT 
    DATE_TRUNC('month', il.acquired_on) as month,
    COUNT(*) as nb_lots_acquired,
    COUNT(DISTINCT COALESCE(il.canonical_food_id, il.cultivar_id, il.derived_product_id, il.generic_product_id)) as unique_products,
    
    -- Top 3 des catégories ce mois
    STRING_AGG(
        DISTINCT COALESCE(rc_cf.name, rc_gp.name), 
        ', ' 
        ORDER BY COALESCE(rc_cf.name, rc_gp.name)
    ) as categories_purchased
    
FROM inventory_lots il
LEFT JOIN canonical_foods cf ON il.canonical_food_id = cf.id
LEFT JOIN generic_products gp ON il.generic_product_id = gp.id
LEFT JOIN reference_categories rc_cf ON cf.category_id = rc_cf.id
LEFT JOIN reference_categories rc_gp ON gp.category_id = rc_gp.id

WHERE il.acquired_on >= CURRENT_DATE - INTERVAL '12 months'

GROUP BY DATE_TRUNC('month', il.acquired_on)
ORDER BY month DESC;
```

## 🔧 **Maintenance et nettoyage**

### Nettoyage des lots vides et très expirés
```sql
-- Supprimer les lots vides ou très expirés (plus de 30 jours)
DELETE FROM inventory_lots 
WHERE (qty_remaining <= 0 OR qty_remaining IS NULL)
   OR (expiration_date < CURRENT_DATE - INTERVAL '30 days');
```

### Identifier les doublons potentiels
```sql
-- Lots similaires qui pourraient être regroupés
SELECT 
    il1.canonical_food_id,
    cf.canonical_name,
    il1.storage_place,
    il1.unit,
    COUNT(*) as nb_lots_similar,
    STRING_AGG(il1.id::text, ', ') as lot_ids,
    SUM(il1.qty_remaining) as total_quantity
    
FROM inventory_lots il1
JOIN canonical_foods cf ON il1.canonical_food_id = cf.id

WHERE il1.qty_remaining > 0

GROUP BY il1.canonical_food_id, cf.canonical_name, il1.storage_place, il1.unit
HAVING COUNT(*) > 1

ORDER BY nb_lots_similar DESC, total_quantity DESC;
```

### Vérification de l'intégrité des données
```sql
-- Vérifier les références orphelines
SELECT 
    'inventory_lots sans produit' as issue,
    COUNT(*) as count
FROM inventory_lots 
WHERE canonical_food_id IS NULL 
  AND cultivar_id IS NULL 
  AND derived_product_id IS NULL 
  AND generic_product_id IS NULL

UNION ALL

SELECT 
    'canonical_foods sans catégorie' as issue,
    COUNT(*)
FROM canonical_foods 
WHERE category_id IS NULL

UNION ALL

SELECT 
    'lots avec quantités négatives' as issue,
    COUNT(*)
FROM inventory_lots 
WHERE qty_remaining < 0 OR initial_qty <= 0;
```
