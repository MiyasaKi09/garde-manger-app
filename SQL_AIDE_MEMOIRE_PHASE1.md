# Commandes SQL Utiles - Phase 1

## 🔍 Vérifications Rapides

### Vérifier que la migration a bien été exécutée
```sql
-- Vérifier les colonnes ajoutées
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'inventory_lots' 
  AND column_name IN ('is_opened', 'opened_at', 'adjusted_expiration_date')
ORDER BY column_name;
```

**Résultat attendu :**
| column_name | data_type | is_nullable | column_default |
|-------------|-----------|-------------|----------------|
| adjusted_expiration_date | date | YES | NULL |
| is_opened | boolean | YES | false |
| opened_at | timestamp with time zone | YES | NULL |

---

### Vérifier les index
```sql
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'inventory_lots'
  AND indexname LIKE '%opened%' OR indexname LIKE '%adjusted%';
```

**Résultat attendu :**
- `idx_inventory_lots_is_opened`
- `idx_inventory_lots_adjusted_exp`

---

### Vérifier la vue
```sql
SELECT 
  table_name, 
  view_definition
FROM information_schema.views
WHERE table_name = 'inventory_lots_with_effective_dlc';
```

---

## 📊 Requêtes d'Analyse

### Lister tous les produits ouverts
```sql
SELECT 
  id,
  product_type,
  product_id,
  qty_remaining,
  unit,
  storage_place,
  is_opened,
  opened_at,
  expiration_date AS dlc_originale,
  adjusted_expiration_date AS dlc_ajustee,
  COALESCE(adjusted_expiration_date, expiration_date) AS dlc_effective,
  -- Jours restants
  COALESCE(adjusted_expiration_date, expiration_date) - CURRENT_DATE AS jours_restants
FROM inventory_lots
WHERE is_opened = TRUE
ORDER BY adjusted_expiration_date ASC;
```

---

### Compter les produits ouverts par lieu de stockage
```sql
SELECT 
  storage_place,
  COUNT(*) AS nb_produits_ouverts,
  AVG(adjusted_expiration_date - CURRENT_DATE) AS jours_moyens_restants
FROM inventory_lots
WHERE is_opened = TRUE
GROUP BY storage_place
ORDER BY nb_produits_ouverts DESC;
```

---

### Produits ouverts qui expirent dans les 3 prochains jours
```sql
SELECT 
  id,
  product_type,
  product_id,
  qty_remaining,
  unit,
  storage_place,
  opened_at,
  adjusted_expiration_date,
  adjusted_expiration_date - CURRENT_DATE AS jours_restants
FROM inventory_lots
WHERE is_opened = TRUE
  AND adjusted_expiration_date IS NOT NULL
  AND adjusted_expiration_date <= CURRENT_DATE + INTERVAL '3 days'
ORDER BY adjusted_expiration_date ASC;
```

---

### Produits ouverts depuis plus de 7 jours
```sql
SELECT 
  id,
  product_type,
  product_id,
  qty_remaining,
  unit,
  storage_place,
  opened_at,
  CURRENT_DATE - DATE(opened_at) AS jours_depuis_ouverture,
  adjusted_expiration_date
FROM inventory_lots
WHERE is_opened = TRUE
  AND opened_at IS NOT NULL
  AND DATE(opened_at) <= CURRENT_DATE - INTERVAL '7 days'
ORDER BY opened_at ASC;
```

---

## 🧪 Requêtes de Test

### Créer un produit de test (Lait)
```sql
INSERT INTO inventory_lots (
  user_id, 
  product_type, 
  product_id, 
  qty_remaining, 
  unit, 
  storage_place, 
  expiration_date
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'canonical',
  (SELECT id FROM canonical_foods WHERE canonical_name ILIKE '%lait%' LIMIT 1),
  1,
  'L',
  'fridge',
  CURRENT_DATE + INTERVAL '10 days'
) RETURNING *;
```

---

### Ouvrir manuellement un produit (pour tester le trigger)
```sql
-- Récupérer l'ID du produit de test
SELECT id FROM inventory_lots ORDER BY created_at DESC LIMIT 1;

-- Ouvrir le produit (ID = remplacer par l'ID récupéré)
UPDATE inventory_lots
SET 
  is_opened = TRUE,
  opened_at = NOW(),
  adjusted_expiration_date = CURRENT_DATE + INTERVAL '3 days' -- 3 jours pour du lait
WHERE id = [VOTRE_ID];
```

---

### Tester le trigger de validation
```sql
-- Ceci DOIT échouer (DLC ajustée > DLC originale)
UPDATE inventory_lots
SET adjusted_expiration_date = CURRENT_DATE + INTERVAL '20 days'
WHERE id = [VOTRE_ID]
  AND expiration_date = CURRENT_DATE + INTERVAL '10 days';
```

**Résultat attendu :**
```
ERROR: La DLC ajustée ne peut pas être postérieure à la DLC originale
```

---

### Fermer manuellement un produit
```sql
UPDATE inventory_lots
SET 
  is_opened = FALSE,
  opened_at = NULL,
  adjusted_expiration_date = NULL
WHERE id = [VOTRE_ID];
```

---

## 🔧 Maintenance

### Nettoyer les produits ouverts expirés
```sql
-- Lister d'abord (pour vérifier)
SELECT 
  id,
  product_type,
  product_id,
  adjusted_expiration_date
FROM inventory_lots
WHERE is_opened = TRUE
  AND adjusted_expiration_date < CURRENT_DATE;

-- Supprimer (si confirmé)
DELETE FROM inventory_lots
WHERE is_opened = TRUE
  AND adjusted_expiration_date < CURRENT_DATE;
```

---

### Réinitialiser tous les produits ouverts (pour tests)
```sql
UPDATE inventory_lots
SET 
  is_opened = FALSE,
  opened_at = NULL,
  adjusted_expiration_date = NULL
WHERE is_opened = TRUE;
```

---

### Statistiques globales
```sql
SELECT 
  COUNT(*) AS total_produits,
  COUNT(*) FILTER (WHERE is_opened = TRUE) AS produits_ouverts,
  COUNT(*) FILTER (WHERE is_opened = FALSE) AS produits_fermes,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE is_opened = TRUE) / NULLIF(COUNT(*), 0),
    2
  ) AS pourcentage_ouverts
FROM inventory_lots;
```

---

## 🗑️ Rollback (Annuler la migration)

### Méthode complète (dans l'ordre)
```sql
-- 1. Supprimer la vue
DROP VIEW IF EXISTS inventory_lots_with_effective_dlc;

-- 2. Supprimer le trigger
DROP TRIGGER IF EXISTS check_adjusted_expiration ON inventory_lots;

-- 3. Supprimer la fonction
DROP FUNCTION IF EXISTS validate_adjusted_expiration();

-- 4. Supprimer les index
DROP INDEX IF EXISTS idx_inventory_lots_adjusted_exp;
DROP INDEX IF EXISTS idx_inventory_lots_is_opened;

-- 5. Supprimer les colonnes
ALTER TABLE inventory_lots
  DROP COLUMN IF EXISTS adjusted_expiration_date,
  DROP COLUMN IF EXISTS is_opened,
  DROP COLUMN IF EXISTS opened_at;

-- 6. Vérifier
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'inventory_lots'
  AND column_name IN ('is_opened', 'opened_at', 'adjusted_expiration_date');
-- Doit retourner 0 lignes
```

⚠️ **Attention** : Cela supprimera **toutes les données** d'ouverture !

---

## 📈 Requêtes Avancées

### Analyse par catégorie (nécessite join avec canonical_foods)
```sql
SELECT 
  cf.canonical_name AS categorie,
  COUNT(*) AS nb_produits_ouverts,
  AVG(il.adjusted_expiration_date - CURRENT_DATE) AS jours_moyens_restants,
  MIN(il.adjusted_expiration_date) AS premiere_expiration,
  MAX(il.adjusted_expiration_date) AS derniere_expiration
FROM inventory_lots il
LEFT JOIN canonical_foods cf ON il.product_id = cf.id AND il.product_type = 'canonical'
WHERE il.is_opened = TRUE
  AND il.adjusted_expiration_date IS NOT NULL
GROUP BY cf.canonical_name
ORDER BY nb_produits_ouverts DESC;
```

---

### Produits ouverts avec leur nom complet
```sql
SELECT 
  il.id,
  CASE
    WHEN il.product_type = 'canonical' THEN cf.canonical_name
    WHEN il.product_type = 'catalog' THEN pc.product_name
    ELSE 'Produit sans nom'
  END AS nom_produit,
  il.qty_remaining || ' ' || il.unit AS quantite,
  il.storage_place AS lieu,
  il.opened_at AS ouvert_le,
  il.expiration_date AS dlc_originale,
  il.adjusted_expiration_date AS dlc_ajustee,
  il.adjusted_expiration_date - CURRENT_DATE AS jours_restants
FROM inventory_lots il
LEFT JOIN canonical_foods cf ON il.product_id = cf.id AND il.product_type = 'canonical'
LEFT JOIN products_catalog pc ON il.product_id = pc.id AND il.product_type = 'catalog'
WHERE il.is_opened = TRUE
ORDER BY il.adjusted_expiration_date ASC;
```

---

### Historique d'ouverture par utilisateur
```sql
SELECT 
  u.email AS utilisateur,
  COUNT(*) AS nb_produits_ouverts,
  MIN(il.opened_at) AS premiere_ouverture,
  MAX(il.opened_at) AS derniere_ouverture
FROM inventory_lots il
JOIN auth.users u ON il.user_id = u.id
WHERE il.is_opened = TRUE
GROUP BY u.email
ORDER BY nb_produits_ouverts DESC;
```

---

## 🎯 Requêtes pour le Dashboard

### Widget "Produits Ouverts À Risque"
```sql
SELECT 
  COUNT(*) AS nb_produits_a_risque
FROM inventory_lots
WHERE is_opened = TRUE
  AND adjusted_expiration_date IS NOT NULL
  AND adjusted_expiration_date <= CURRENT_DATE + INTERVAL '3 days';
```

---

### Liste des produits à consommer en priorité
```sql
SELECT 
  id,
  CASE
    WHEN product_type = 'canonical' THEN (SELECT canonical_name FROM canonical_foods WHERE id = product_id)
    WHEN product_type = 'catalog' THEN (SELECT product_name FROM products_catalog WHERE id = product_id)
    ELSE 'Produit sans nom'
  END AS nom_produit,
  qty_remaining || ' ' || unit AS quantite,
  adjusted_expiration_date AS expire_le,
  adjusted_expiration_date - CURRENT_DATE AS jours_restants
FROM inventory_lots
WHERE is_opened = TRUE
  AND adjusted_expiration_date IS NOT NULL
  AND adjusted_expiration_date >= CURRENT_DATE
ORDER BY adjusted_expiration_date ASC
LIMIT 10;
```

---

## 💡 Astuces

### Utiliser la vue pour simplifier les requêtes
Au lieu de :
```sql
SELECT 
  COALESCE(adjusted_expiration_date, expiration_date) AS dlc_effective
FROM inventory_lots;
```

Utilisez :
```sql
SELECT effective_expiration_date FROM inventory_lots_with_effective_dlc;
```

---

### Forcer la réindexation (si performances dégradées)
```sql
REINDEX INDEX idx_inventory_lots_is_opened;
REINDEX INDEX idx_inventory_lots_adjusted_exp;
```

---

### Vérifier l'utilisation des index
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS nb_utilisations,
  idx_tup_read AS lignes_lues,
  idx_tup_fetch AS lignes_recuperees
FROM pg_stat_user_indexes
WHERE tablename = 'inventory_lots'
  AND (indexname LIKE '%opened%' OR indexname LIKE '%adjusted%')
ORDER BY idx_scan DESC;
```

---

**Aide-mémoire prêt à l'emploi ! 📋**
