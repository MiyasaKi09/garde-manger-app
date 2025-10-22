# 🔧 GUIDE : AJOUT DE LA CONTRAINTE UNIQUE SUR recipes.name

## 📋 Situation

Tu as essayé d'ajouter la contrainte UNIQUE sur `recipes.name` mais PostgreSQL a détecté **10 recettes en double**.

```
ERROR: 23505: could not create unique index "recipes_name_unique"
DETAIL: Key (name)=(Granola maison aux noix de pécan et sirop d'érable) is duplicated.
```

## 🔍 Analyse des doublons

### Recettes concernées

| Nom de la recette | IDs | Action |
|-------------------|-----|--------|
| Overnight porridge aux graines de chia et fruits rouges | 2, 13 | Garder 2, supprimer 13 |
| Porridge salé aux épinards, feta et œuf mollet | 3, 14 | Garder 3, supprimer 14 |
| Smoothie bowl tropical mangue-ananas-coco | 4, 15 | Garder 4, supprimer 15 |
| Smoothie bowl vert épinards, kiwi et banane | 5, 16 | Garder 5, supprimer 16 |
| Pudding de chia au lait de coco et coulis de mangue | 6, 17 | Garder 6, supprimer 17 |
| Granola maison aux noix de pécan et sirop d'érable | 7, 18 | Garder 7, supprimer 18 |
| Muesli Bircher aux pommes râpées et noisettes | 8, 19 | Garder 8, supprimer 19 |
| Pancakes américains fluffy au sirop d'érable | 9, 20 | Garder 9, supprimer 20 |
| Pancakes à la banane sans sucre ajouté | 10, 21 | Garder 10, supprimer 21 |
| Pancakes salés au saumon fumé et aneth | 11, 22 | Garder 11, supprimer 22 |

### Stratégie

- ✅ **Garder** : Les IDs 2-11 (les plus anciens)
- 🗑️ **Supprimer** : Les IDs 13-22 (les doublons)
- 🔄 **Migrer** : Les tags associés des doublons vers les originaux

## 🚀 PROCÉDURE COMPLÈTE

### ÉTAPE 1 : Nettoyer les doublons

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier : tools/clean_duplicates.sql
```

**Ce que fait ce script :**
1. ✅ Vérifie les dépendances (tags, ingrédients, instructions)
2. 🔄 Migre les tags des doublons vers les originaux
3. 🗑️ Supprime les associations dans `recipe_tags`
4. 🗑️ Supprime les recettes doublons (IDs 13-22)
5. ✅ Vérifie qu'il n'y a plus de doublons

**Résultat attendu :**
```
✅ Doublons supprimés avec succès !
recettes_uniques: 601
total_recettes: 601
```

### ÉTAPE 2 : Ajouter la contrainte UNIQUE

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier : tools/add_unique_constraint.sql
```

**Ce que fait ce script :**
1. ✅ Vérifie qu'il n'y a plus de doublons
2. ✅ Ajoute la contrainte `UNIQUE (name)` sur `recipes.name`
3. ✅ Confirme que la contrainte a été ajoutée

**Résultat attendu :**
```
✅ Contrainte ajoutée avec succès !
nombre_recettes: 601
```

### ÉTAPE 3 : Importer le batch 1

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier : tools/add_recipes_batch1.sql
```

**Ce que fait ce script :**
1. ✅ Insère 50 nouvelles entrées
2. ✅ Ignore automatiquement les doublons grâce à `ON CONFLICT (name) DO NOTHING`
3. ✅ Affiche le nombre de recettes insérées

**Résultat attendu :**
```
Batch 1 terminé
nouvelles_recettes: ~40-50
```

**Vérification finale :**
```sql
SELECT COUNT(*) FROM recipes;
-- Attendu : ~645-651 recettes
```

## 📊 Récapitulatif

| Étape | Fichier | Objectif | Résultat |
|-------|---------|----------|----------|
| 1️⃣ | `clean_duplicates.sql` | Supprimer 10 doublons | 611 → 601 recettes |
| 2️⃣ | `add_unique_constraint.sql` | Ajouter contrainte UNIQUE | Protection doublons ✅ |
| 3️⃣ | `add_recipes_batch1.sql` | Ajouter 50 entrées | 601 → ~645-651 recettes |

## ⚠️ Important

- **Ne saute PAS l'étape 1** : Les doublons empêchent l'ajout de la contrainte UNIQUE
- **Exécute les étapes dans l'ordre** : 1 → 2 → 3
- **Vérifie chaque étape** : Attends le message de succès avant de passer à la suivante

## 🎯 Prochaines étapes

Une fois le batch 1 importé avec succès :
1. ✅ Créer batch 2 (50 autres entrées du bloc1)
2. ✅ Créer batch 3 (50 plats du bloc2)
3. ✅ Continuer jusqu'à 1000 recettes
4. ✅ Enrichir les nouvelles recettes avec les profils gustatifs

---

**Prêt à commencer ?** 🚀

Ouvre Supabase SQL Editor et exécute `tools/clean_duplicates.sql` !
