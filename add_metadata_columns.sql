-- Script pour ajouter les métadonnées de conversion aux tables cultivars et archetypes
-- Ces colonnes permettront de gérer les conversions d'unités pour tous les types de produits

-- Ajouter les colonnes à la table cultivars
ALTER TABLE cultivars 
ADD COLUMN IF NOT EXISTS density_g_per_ml DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS grams_per_unit DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS primary_unit VARCHAR(20);

-- Ajouter les colonnes à la table archetypes  
ALTER TABLE archetypes
ADD COLUMN IF NOT EXISTS density_g_per_ml DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS grams_per_unit DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS primary_unit VARCHAR(20);

-- Ajouter des commentaires pour documenter l'usage
COMMENT ON COLUMN cultivars.density_g_per_ml IS 'Densité en grammes par ml pour les liquides (hérité du canonical si null)';
COMMENT ON COLUMN cultivars.grams_per_unit IS 'Poids en grammes par unité pour les solides comptables (hérité du canonical si null)';
COMMENT ON COLUMN cultivars.primary_unit IS 'Unité principale recommandée (hérité du canonical si null)';

COMMENT ON COLUMN archetypes.density_g_per_ml IS 'Densité en grammes par ml pour les liquides (hérité du canonical si null)';
COMMENT ON COLUMN archetypes.grams_per_unit IS 'Poids en grammes par unité pour les solides comptables (hérité du canonical si null)';
COMMENT ON COLUMN archetypes.primary_unit IS 'Unité principale recommandée (hérité du canonical si null)';

-- Exemples de données pour illustrer les différences possibles :

-- Pour les cultivars - exemples où ça peut différer du canonical
-- Les pommes peuvent avoir des poids très différents selon la variété
UPDATE cultivars SET 
  grams_per_unit = 180,
  primary_unit = 'u'
WHERE cultivar_name ILIKE '%granny smith%';

UPDATE cultivars SET 
  grams_per_unit = 120,
  primary_unit = 'u'  
WHERE cultivar_name ILIKE '%golden%';

UPDATE cultivars SET 
  grams_per_unit = 200,
  primary_unit = 'u'
WHERE cultivar_name ILIKE '%red delicious%';

-- Pour les tomates cerises vs tomates normales
UPDATE cultivars SET 
  grams_per_unit = 15,
  primary_unit = 'u'
WHERE cultivar_name ILIKE '%cerise%' OR cultivar_name ILIKE '%cherry%';

UPDATE cultivars SET 
  grams_per_unit = 150,
  primary_unit = 'u'
WHERE cultivar_name ILIKE '%beefsteak%' OR cultivar_name ILIKE '%coeur%';

-- Pour les archetypes - différences de préparation
-- Lait entier vs écrémé (densité légèrement différente)
UPDATE archetypes SET 
  density_g_per_ml = 1.035,
  primary_unit = 'ml'
WHERE archetype_name ILIKE '%lait entier%';

UPDATE archetypes SET 
  density_g_per_ml = 1.028,
  primary_unit = 'ml'  
WHERE archetype_name ILIKE '%lait écrémé%';

-- Farine selon le type (densités différentes)
UPDATE archetypes SET 
  density_g_per_ml = 0.50,
  primary_unit = 'g'
WHERE archetype_name ILIKE '%farine de blé%';

UPDATE archetypes SET 
  density_g_per_ml = 0.45,
  primary_unit = 'g'
WHERE archetype_name ILIKE '%farine de riz%';

-- Sucre selon le type
UPDATE archetypes SET 
  density_g_per_ml = 0.85,
  primary_unit = 'g'
WHERE archetype_name ILIKE '%sucre blanc%';

UPDATE archetypes SET 
  density_g_per_ml = 0.75,
  primary_unit = 'g'
WHERE archetype_name ILIKE '%sucre roux%';

-- Afficher un résumé des modifications
SELECT 'cultivars' as table_name, 
       COUNT(*) as total_rows,
       COUNT(grams_per_unit) as has_grams_per_unit,
       COUNT(density_g_per_ml) as has_density
FROM cultivars
UNION ALL
SELECT 'archetypes' as table_name,
       COUNT(*) as total_rows, 
       COUNT(grams_per_unit) as has_grams_per_unit,
       COUNT(density_g_per_ml) as has_density
FROM archetypes;