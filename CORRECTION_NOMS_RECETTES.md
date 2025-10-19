# 🔧 CORRECTION APPLIQUÉE - Noms de Recettes

**Date** : 19 octobre 2025  
**Problème** : ❌ Noms de recettes avec numéros introuvables  
**Solution** : ✅ Numéros supprimés de tous les fichiers SQL

---

## 🚨 Problème Identifié

### Diagnostic dans Supabase
```
Résultats actuels :
- Total recettes : 611
- Recettes enrichies : 261 (au lieu de 585)
- Associations : 711 (au lieu de 1362)
- Tags créés : 75 ✅ (tous présents !)
```

### Cause Racine
Les fichiers SQL cherchaient des noms comme :
- ❌ `"595. Shawarma"`
- ❌ `"596. Manakish au zaatar (pizza libanaise)"`
- ❌ `"Bœuf bourguignon"` (n'existait pas avec accent)

Mais dans votre base Supabase, les recettes sont nommées :
- ✅ `"Shawarma"` (sans numéro)
- ✅ `"Manakish au zaatar (pizza libanaise)"` (sans numéro)
- ✅ `"Bœuf bourguignon"` (trouvé maintenant)

**Résultat** : La majorité des INSERT échouaient silencieusement à cause du `ON CONFLICT DO NOTHING`.

---

## ✅ Solution Appliquée

### Script de Correction
Fichier : `tools/fix_recipe_names.py`

**Modifications** :
```python
# Pattern : SELECT id FROM recipes WHERE name = '595. Shawarma'
# Devient : SELECT id FROM recipes WHERE name = 'Shawarma'

# Pattern : WHERE r.name = '595. Shawarma'
# Devient : WHERE r.name = 'Shawarma'
```

**Résultats** :
- ✅ **534 noms corrigés** dans `enrichment_optimized.sql`
- ✅ **28 fichiers batch** corrigés (`batch_1_of_28.sql` à `batch_28_of_28.sql`)

---

## 📊 Fichiers Mis à Jour

### Fichier Principal
- `tools/enrichment_optimized.sql` → **CORRIGÉ** (216 KB, plus léger)
- `tools/enrichment_optimized_OLD.sql` → Sauvegarde de l'ancien (221 KB)

### Fichiers Batch
Tous les 28 fichiers `batch_X_of_28.sql` → **CORRIGÉS**

---

## 🎯 PROCHAINE ÉTAPE

Maintenant que les fichiers sont corrigés, il faut **RÉEXÉCUTER l'enrichissement** :

### Option A : Fichier Unique (RECOMMANDÉ)

1. Ouvrir Supabase → SQL Editor
2. Ouvrir `tools/enrichment_optimized.sql` dans VS Code
3. Tout sélectionner + Copier
4. Coller dans Supabase
5. Cliquer **Run** ▶️

### Option B : Fichiers Batch (Si timeout)

Exécuter les 28 fichiers `batch_X_of_28.sql` un par un

---

## ✅ Vérification Attendue

Après exécution, cette requête devrait donner :

```sql
SELECT 
  COUNT(DISTINCT r.id) as recettes_enrichies,
  COUNT(*) as total_associations
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id;
```

**AVANT correction** (actuel) :
- recettes_enrichies: 261
- total_associations: 711

**APRÈS réexécution** (attendu) :
- recettes_enrichies: ~585
- total_associations: ≥ 1362

---

## 🔍 Exemples de Corrections

### Avant
```sql
-- 595. Shawarma
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '595. Shawarma'
)
```

### Après
```sql
-- Shawarma
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Shawarma'
)
```

---

**Date de correction** : 19 octobre 2025, 14:55 UTC  
**Statut** : ✅ Correction appliquée, prêt pour réexécution
