# 📁 Fichiers à Exécuter dans Supabase SQL Editor

## Option A : FICHIER UNIQUE (RECOMMANDÉ) ⭐

**1 seul fichier** à exécuter (~30 secondes) :

```
📄 tools/enrichment_optimized.sql
   ↳ 8198 lignes, 221 KB
   ↳ 1362 associations de tags
   ↳ 585 recettes enrichies
```

### Comment faire :
1. Ouvrir `tools/enrichment_optimized.sql` dans VS Code
2. Tout sélectionner (Ctrl+A / Cmd+A)
3. Copier (Ctrl+C / Cmd+C)
4. Coller dans Supabase SQL Editor
5. Cliquer sur **Run** ▶️

---

## Option B : FICHIERS DÉCOUPÉS (Si timeout)

**28 fichiers** à exécuter un par un (~5 minutes) :

```
📄 tools/batch_1_of_28.sql   (50 associations)
📄 tools/batch_2_of_28.sql   (50 associations)
📄 tools/batch_3_of_28.sql   (50 associations)
...
📄 tools/batch_27_of_28.sql  (50 associations)
📄 tools/batch_28_of_28.sql  (12 associations)
```

### Comment faire :
Pour CHAQUE fichier :
1. Ouvrir le fichier
2. Tout sélectionner + Copier
3. Coller dans Supabase SQL Editor
4. Cliquer sur **Run** ▶️
5. Passer au suivant

---

## ✅ Vérification après exécution

Collez cette requête dans Supabase pour vérifier :

```sql
SELECT 
  COUNT(DISTINCT r.id) as recettes_enrichies,
  COUNT(*) as total_associations,
  COUNT(DISTINCT t.name) as types_tags
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id
JOIN tags t ON rt.tag_id = t.id;
```

**Résultat attendu** :
- recettes_enrichies: ~585
- total_associations: ≥ 1362
- types_tags: 50-60

⚠️ **IMPORTANT** : Si vous voyez seulement ~361 associations, c'est que l'enrichissement n'est PAS encore appliqué. Vous devez exécuter le fichier SQL complet !

---

## 📖 Documentation Complète

Voir **GUIDE_EXECUTION_SUPABASE.md** pour :
- Instructions détaillées étape par étape
- Requêtes de test d'assemblage intelligent
- Dépannage et troubleshooting
