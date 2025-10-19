# 🧪 Requêtes de Test - Assemblage Intelligent

Copiez-collez ces requêtes dans Supabase SQL Editor pour tester le système.

---

## 1️⃣ Vérification de l'Enrichissement

### Statistiques globales
```sql
SELECT 
  COUNT(DISTINCT r.id) as recettes_enrichies,
  COUNT(*) as total_associations,
  COUNT(DISTINCT t.name) as types_tags_utilises
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id
JOIN tags t ON rt.tag_id = t.id;
```

**Attendu** : ~585 recettes, ≥1362 associations, 50-60 types de tags

---

### Répartition par type de tag
```sql
SELECT 
  CASE 
    WHEN t.name LIKE 'Arôme-%' THEN 'Familles Aromatiques'
    WHEN t.name LIKE 'Saveur-%' THEN 'Profils de Saveur'
    WHEN t.name LIKE 'Texture-%' THEN 'Profils de Texture'
    WHEN t.name LIKE 'Intensité-%' THEN 'Profils d''Intensité'
    WHEN t.name IN ('Française', 'Italienne', 'Asiatique', 'Chinoise', 'Japonaise', 'Thaïlandaise', 'Indienne', 'Mexicaine', 'Américaine', 'Orientale', 'Espagnole') THEN 'Cuisines'
    WHEN t.name IN ('Végétarien', 'Vegan', 'Sans Gluten', 'Sans Lactose') THEN 'Régimes'
    ELSE 'Autres'
  END as categorie,
  COUNT(*) as nb_associations
FROM recipe_tags rt
JOIN tags t ON rt.tag_id = t.id
GROUP BY categorie
ORDER BY nb_associations DESC;
```

---

## 2️⃣ Top Recettes Enrichies

### Les 20 recettes avec le plus de tags
```sql
SELECT 
  r.name,
  r.role,
  COUNT(*) as nb_tags,
  STRING_AGG(t.name, ', ' ORDER BY t.name) as tags
FROM recipes r
JOIN recipe_tags rt ON r.id = rt.recipe_id
JOIN tags t ON rt.tag_id = t.id
GROUP BY r.id, r.name, r.role
ORDER BY nb_tags DESC
LIMIT 20;
```

---

## 3️⃣ Food Pairing - Assemblages par Arômes

### Trouver des accompagnements pour "Bœuf bourguignon"
```sql
SELECT DISTINCT
  r2.name as accompagnement,
  STRING_AGG(DISTINCT t1.name, ', ') as aromes_communs,
  COUNT(DISTINCT t1.id) as nb_aromes_partages
FROM recipes r1
JOIN recipe_tags rt1 ON r1.id = rt1.recipe_id
JOIN tags t1 ON rt1.tag_id = t1.id
JOIN recipe_tags rt2 ON rt2.tag_id = t1.id AND rt2.recipe_id != r1.id
JOIN recipes r2 ON rt2.recipe_id = r2.id
WHERE r1.name ILIKE '%boeuf%bourguignon%'
  AND t1.name LIKE 'Arôme-%'
  AND r2.role = 'ACCOMPAGNEMENT'
GROUP BY r2.id, r2.name
ORDER BY nb_aromes_partages DESC
LIMIT 10;
```

---

### Trouver des accompagnements pour "Saumon grillé"
```sql
SELECT DISTINCT
  r2.name as accompagnement,
  STRING_AGG(DISTINCT t1.name, ', ') as aromes_communs
FROM recipes r1
JOIN recipe_tags rt1 ON r1.id = rt1.recipe_id
JOIN tags t1 ON rt1.tag_id = t1.id
JOIN recipe_tags rt2 ON rt2.tag_id = t1.id AND rt2.recipe_id != r1.id
JOIN recipes r2 ON rt2.recipe_id = r2.id
WHERE r1.name ILIKE '%saumon%'
  AND t1.name LIKE 'Arôme-%'
  AND r2.role = 'ACCOMPAGNEMENT'
GROUP BY r2.id, r2.name
LIMIT 10;
```

---

## 4️⃣ Règle d'Équilibre - Plats Riches → Accompagnements Légers

### Trouver des accompagnements légers pour plats riches
```sql
-- Plats principaux riches
WITH plats_riches AS (
  SELECT DISTINCT r.id, r.name
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE r.role = 'PLAT_PRINCIPAL'
    AND t.name = 'Intensité-Riche'
),
-- Accompagnements légers
accompagnements_legers AS (
  SELECT DISTINCT r.id, r.name
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE r.role = 'ACCOMPAGNEMENT'
    AND t.name IN ('Intensité-Léger', 'Saveur-Acide')
)
SELECT 
  pr.name as plat_riche,
  al.name as accompagnement_leger
FROM plats_riches pr
CROSS JOIN accompagnements_legers al
LIMIT 20;
```

---

## 5️⃣ Règle de Contraste - Textures Opposées

### Plats crémeux → Accompagnements croquants
```sql
-- Plats crémeux
WITH plats_cremeux AS (
  SELECT DISTINCT r.id, r.name
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE t.name = 'Texture-Crémeux'
),
-- Accompagnements croquants
accompagnements_croquants AS (
  SELECT DISTINCT r.id, r.name
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE r.role = 'ACCOMPAGNEMENT'
    AND t.name = 'Texture-Croquant'
)
SELECT 
  pc.name as plat_cremeux,
  ac.name as accompagnement_croquant
FROM plats_cremeux pc
CROSS JOIN accompagnements_croquants ac
LIMIT 15;
```

---

## 6️⃣ Règle du Terroir - Même Cuisine

### Menu Italien complet
```sql
SELECT 
  r.role,
  r.name,
  STRING_AGG(DISTINCT t.name, ', ') FILTER (WHERE t.name NOT IN ('Italienne')) as autres_tags
FROM recipes r
JOIN recipe_tags rt ON r.id = rt.recipe_id
JOIN tags t ON rt.tag_id = t.id
WHERE r.id IN (
  SELECT DISTINCT r2.id
  FROM recipes r2
  JOIN recipe_tags rt2 ON r2.id = rt2.recipe_id
  JOIN tags t2 ON rt2.tag_id = t2.id
  WHERE t2.name = 'Italienne'
)
GROUP BY r.id, r.role, r.name
ORDER BY 
  CASE r.role
    WHEN 'ENTREE' THEN 1
    WHEN 'PLAT_PRINCIPAL' THEN 2
    WHEN 'ACCOMPAGNEMENT' THEN 3
    WHEN 'DESSERT' THEN 4
  END,
  r.name
LIMIT 20;
```

---

## 7️⃣ Suggestions Multi-Critères (Score Composite)

### Meilleurs accompagnements pour "Magret de canard"
```sql
WITH main_dish AS (
  SELECT r.id, r.name,
    ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name LIKE 'Arôme-%') as aromes,
    ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IN ('Française', 'Italienne', 'Asiatique', 'Chinoise', 'Japonaise', 'Thaïlandaise', 'Indienne', 'Mexicaine', 'Américaine', 'Orientale', 'Espagnole')) as cuisines,
    BOOL_OR(t.name = 'Intensité-Riche') as is_rich
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE r.name ILIKE '%magret%canard%'
  GROUP BY r.id, r.name
),
side_dishes AS (
  SELECT r.id, r.name,
    ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name LIKE 'Arôme-%') as aromes,
    ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IN ('Française', 'Italienne', 'Asiatique', 'Chinoise', 'Japonaise', 'Thaïlandaise', 'Indienne', 'Mexicaine', 'Américaine', 'Orientale', 'Espagnole')) as cuisines,
    BOOL_OR(t.name = 'Intensité-Léger') as is_light,
    BOOL_OR(t.name = 'Saveur-Acide') as is_acidic
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE r.role = 'ACCOMPAGNEMENT'
  GROUP BY r.id, r.name
)
SELECT 
  sd.name as accompagnement,
  -- Score Food Pairing (arômes communs)
  CARDINALITY(ARRAY(SELECT UNNEST(md.aromes) INTERSECT SELECT UNNEST(sd.aromes))) * 10 as score_food_pairing,
  -- Score Terroir (cuisine commune)
  CARDINALITY(ARRAY(SELECT UNNEST(md.cuisines) INTERSECT SELECT UNNEST(sd.cuisines))) * 15 as score_terroir,
  -- Score Équilibre
  CASE WHEN md.is_rich AND (sd.is_light OR sd.is_acidic) THEN 25 ELSE 0 END as score_equilibre,
  -- Score total
  CARDINALITY(ARRAY(SELECT UNNEST(md.aromes) INTERSECT SELECT UNNEST(sd.aromes))) * 10 +
  CARDINALITY(ARRAY(SELECT UNNEST(md.cuisines) INTERSECT SELECT UNNEST(sd.cuisines))) * 15 +
  CASE WHEN md.is_rich AND (sd.is_light OR sd.is_acidic) THEN 25 ELSE 0 END as score_total
FROM main_dish md
CROSS JOIN side_dishes sd
ORDER BY score_total DESC
LIMIT 10;
```

---

## 8️⃣ Analyse des Profils Gustatifs

### Recettes par famille aromatique
```sql
SELECT 
  t.name as famille_aromatique,
  COUNT(DISTINCT r.id) as nb_recettes,
  STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name) FILTER (WHERE random() < 0.1) as exemples
FROM tags t
JOIN recipe_tags rt ON t.id = rt.tag_id
JOIN recipes r ON rt.recipe_id = r.id
WHERE t.name LIKE 'Arôme-%'
GROUP BY t.name
ORDER BY nb_recettes DESC;
```

---

### Recettes végétariennes avec profils de saveur
```sql
SELECT 
  r.name,
  r.role,
  STRING_AGG(DISTINCT t.name, ', ') FILTER (WHERE t.name LIKE 'Saveur-%') as saveurs,
  STRING_AGG(DISTINCT t.name, ', ') FILTER (WHERE t.name LIKE 'Arôme-%') as aromes
FROM recipes r
JOIN recipe_tags rt ON r.id = rt.recipe_id
JOIN tags t ON rt.tag_id = t.id
WHERE r.id IN (
  SELECT r2.id FROM recipes r2
  JOIN recipe_tags rt2 ON r2.id = rt2.recipe_id
  JOIN tags t2 ON rt2.tag_id = t2.id
  WHERE t2.name = 'Végétarien'
)
GROUP BY r.id, r.name, r.role
HAVING COUNT(*) FILTER (WHERE t.name LIKE 'Saveur-%') > 0
ORDER BY r.role, r.name
LIMIT 30;
```

---

## 9️⃣ Création d'un Menu Équilibré

### Menu complet avec équilibre des intensités
```sql
-- Entrée légère + Plat principal + Accompagnement + Dessert
WITH entrees AS (
  SELECT DISTINCT r.id, r.name
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE r.role = 'ENTREE' AND t.name = 'Intensité-Léger'
  LIMIT 5
),
plats AS (
  SELECT DISTINCT r.id, r.name
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE r.role = 'PLAT_PRINCIPAL' AND t.name = 'Intensité-Riche'
  LIMIT 5
),
accompagnements AS (
  SELECT DISTINCT r.id, r.name
  FROM recipes r
  JOIN recipe_tags rt ON r.id = rt.recipe_id
  JOIN tags t ON rt.tag_id = t.id
  WHERE r.role = 'ACCOMPAGNEMENT' AND t.name IN ('Intensité-Léger', 'Saveur-Acide')
  LIMIT 5
),
desserts AS (
  SELECT DISTINCT r.id, r.name
  FROM recipes r
  WHERE r.role = 'DESSERT'
  LIMIT 5
)
SELECT 
  e.name as entree,
  p.name as plat_principal,
  a.name as accompagnement,
  d.name as dessert
FROM entrees e
CROSS JOIN plats p
CROSS JOIN accompagnements a
CROSS JOIN desserts d
LIMIT 10;
```

---

## 🎉 Si toutes ces requêtes fonctionnent...

**FÉLICITATIONS !** Votre système d'assemblage intelligent est opérationnel ! 🚀

Vous pouvez maintenant :
- ✅ Créer des suggestions d'accompagnements automatiques
- ✅ Générer des menus équilibrés
- ✅ Respecter les règles culinaires classiques
- ✅ Appliquer le Food Pairing moléculaire

---

**Date** : 19 octobre 2025  
**Version** : 3.0 - Tests d'assemblage intelligent
