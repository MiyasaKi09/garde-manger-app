# 🛠️ Dossier Tools - Scripts d'Enrichissement

Ce dossier contient les scripts pour enrichir les recettes avec des profils gustatifs.

---

## 📁 Structure

### 📄 Fichier Principal (À EXÉCUTER)

**`enrichment_optimized.sql`** (221 KB) ⭐
- Enrichissement complet de 585 recettes
- 1362 associations de tags
- Profils : Saveurs, Textures, Intensités, Arômes
- **C'EST CE FICHIER QU'IL FAUT EXÉCUTER DANS SUPABASE !**

---

### 📦 Fichiers Batch (Alternative)

Si `enrichment_optimized.sql` provoque un timeout :

- `batch_1_of_28.sql` à `batch_28_of_28.sql`
- Chaque fichier : ~50 associations
- Total : 28 fichiers à exécuter séquentiellement

---

### 🐍 Script Source

**`enrich_recipes_v3_complete.py`**
- Script Python qui a généré les fichiers SQL
- Conservé pour référence et régénération si besoin
- Basé sur gastronomie moléculaire + règles culinaires classiques

---

### 📚 Documentation

- **`GUIDE_IMPORT_RECETTES.md`** - Guide d'import initial des recettes
- **`RAPPORT_IMPORT.md`** - Rapport d'import (611 recettes importées)
- **`CLEANUP_PLAN.md`** - Plan de nettoyage appliqué (40 fichiers supprimés)

---

### 🔧 Utilitaires

**`schema_report.sql`**
- Génère un rapport du schéma de base de données
- Utilisé par la tâche VS Code "Exporter le schéma (rapport 6543)"

---

## 🚀 Comment Utiliser

### Méthode 1 : Fichier Unique (Recommandé)

1. Aller sur Supabase → SQL Editor
2. Ouvrir `enrichment_optimized.sql` dans VS Code
3. Tout sélectionner (Ctrl+A / Cmd+A)
4. Copier (Ctrl+C / Cmd+C)
5. Coller dans Supabase SQL Editor
6. Cliquer sur **Run** ▶️
7. Attendre ~30 secondes

### Méthode 2 : Fichiers Batch (Si timeout)

Pour chaque fichier `batch_X_of_28.sql` (X de 1 à 28) :
1. Ouvrir le fichier dans VS Code
2. Copier tout
3. Coller dans Supabase SQL Editor
4. Run ▶️
5. Passer au suivant

---

## ✅ Vérification

Après l'exécution, vérifiez avec cette requête :

```sql
SELECT 
  COUNT(DISTINCT r.id) as recettes_enrichies,
  COUNT(*) as total_associations
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id;
```

**Résultat attendu** :
- recettes_enrichies: ~585
- total_associations: ≥ 1362

---

## 📖 Documentation Complète

Voir à la racine du projet :
- **`FICHIERS_A_EXECUTER.md`** - Guide rapide
- **`GUIDE_EXECUTION_SUPABASE.md`** - Guide détaillé
- **`REQUETES_TEST.md`** - Requêtes de test après enrichissement
- **`ASSEMBLAGE_INTELLIGENT.md`** - Documentation théorique complète

---

**Date** : 19 octobre 2025  
**Version** : 3.0 - Nettoyé (40 fichiers obsolètes supprimés)
