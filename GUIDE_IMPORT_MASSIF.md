# 🚀 GUIDE : IMPORT MASSIF DE 7610 RECETTES

## 🎯 Objectif

Passer de **1042 recettes** à **~8652 recettes** en important toutes les recettes restantes des 20 blocs disponibles.

---

## 📊 Vue d'ensemble

| Métrique | Valeur |
|----------|--------|
| **Actuellement** | 1042 recettes |
| **À ajouter** | 7610 recettes |
| **Total final** | ~8652 recettes |
| **Fichiers MEGA** | 16 fichiers SQL |
| **Temps estimé** | ~8 minutes |

---

## 📦 Fichiers créés

| Fichier | Taille | Recettes | Status |
|---------|--------|----------|--------|
| `MEGA_1.sql` | 95 KB | ~500 | ⏳ À exécuter |
| `MEGA_2.sql` | 94 KB | ~500 | ⏳ À exécuter |
| `MEGA_3.sql` | 95 KB | ~500 | ⏳ À exécuter |
| `MEGA_4.sql` | 91 KB | ~500 | ⏳ À exécuter |
| `MEGA_5.sql` | 94 KB | ~500 | ⏳ À exécuter |
| `MEGA_6.sql` | 94 KB | ~500 | ⏳ À exécuter |
| `MEGA_7.sql` | 95 KB | ~500 | ⏳ À exécuter |
| `MEGA_8.sql` | 93 KB | ~500 | ⏳ À exécuter |
| `MEGA_9.sql` | 88 KB | ~510 | ⏳ À exécuter |
| `MEGA_10.sql` | 96 KB | ~500 | ⏳ À exécuter |
| `MEGA_11.sql` | 92 KB | ~500 | ⏳ À exécuter |
| `MEGA_12.sql` | 95 KB | ~500 | ⏳ À exécuter |
| `MEGA_13.sql` | 99 KB | ~500 | ⏳ À exécuter |
| `MEGA_14.sql` | 99 KB | ~500 | ⏳ À exécuter |
| `MEGA_15.sql` | 99 KB | ~500 | ⏳ À exécuter |
| `MEGA_16.sql` | 20 KB | ~100 | ⏳ À exécuter |

**Total** : 1.4 MB, 7610 recettes

---

## 🗂️ Contenu par catégorie

### Viandes & Volailles (800 recettes)
- Bloc 10 : 400 viandes rouges (bœuf, agneau, veau, porc)
- Bloc 9 : 400 volailles (poulet, canard, dinde, cailles)

### Plats principaux (2000 recettes)
- Bloc 11 : 400 plats uniques
- Bloc 12 : 400 streetfood (burgers, tacos, kebabs...)
- Bloc 15 : 400 plats mijotés (ragoûts, braisés...)
- Bloc 2 : 400 plats traditionnels français
- Bloc 3 : 400 plats européens

### Poissons & Oeufs (1200 recettes)
- Bloc 8 : 400 poissons et fruits de mer
- Bloc 13 : 400 oeufs et fromages
- Bloc 6 : 400 quiches et tartes

### Féculents & Légumes (800 recettes)
- Bloc 7 : 400 pâtes, riz et céréales
- Bloc 5 : 400 légumes

### Entrées (1210 recettes)
- Bloc 1 : 10 entrées restantes
- Bloc 14 : 400 soupes
- Bloc 4 : 400 soupes
- Bloc 19 : 400 tapas

### Accompagnements & Divers (1200 recettes)
- Bloc 16 : 400 garnitures
- Bloc 17 : 400 pains
- Bloc 18 : 400 sauces

### Desserts (400 recettes)
- Bloc 20 : 400 desserts

---

## 🚀 Procédure d'import (RECOMMANDÉE)

### Option 1 : Import séquentiel (Recommandé)

**Avantages** :
- ✅ Contrôle total sur la progression
- ✅ Facile de reprendre en cas d'erreur
- ✅ Vérification après chaque fichier

**Procédure** :

1. **Ouvrir Supabase** → SQL Editor

2. **Pour chaque fichier MEGA_X.sql** :
   ```sql
   -- Copier le contenu du fichier
   -- Coller dans l'éditeur SQL
   -- Cliquer sur Run ▶️
   -- Attendre ~30 secondes
   ```

3. **Vérifier après chaque import** :
   ```sql
   SELECT COUNT(*) as total FROM recipes;
   ```

4. **Progression attendue** :
   | Après | Total attendu |
   |-------|---------------|
   | MEGA 1 | ~1542 |
   | MEGA 2 | ~2042 |
   | MEGA 3 | ~2542 |
   | MEGA 4 | ~3042 |
   | MEGA 5 | ~3542 |
   | MEGA 6 | ~4042 |
   | MEGA 7 | ~4542 |
   | MEGA 8 | ~5042 |
   | MEGA 9 | ~5552 |
   | MEGA 10 | ~6052 |
   | MEGA 11 | ~6552 |
   | MEGA 12 | ~7052 |
   | MEGA 13 | ~7552 |
   | MEGA 14 | ~8052 |
   | MEGA 15 | ~8552 |
   | MEGA 16 | **~8652** ✅ |

### Option 2 : Import par groupes

Si tu veux aller plus vite, importe par groupes :

**Groupe A** : MEGA 1-5 (2500 recettes) → ~2 minutes  
**Groupe B** : MEGA 6-10 (2510 recettes) → ~2 minutes  
**Groupe C** : MEGA 11-15 (2500 recettes) → ~2 minutes  
**Groupe D** : MEGA 16 (100 recettes) → ~10 secondes  

---

## ⏱️ Temps estimé

| Fichier | Recettes | Temps |
|---------|----------|-------|
| MEGA 1-15 | ~500 chacun | ~30 sec |
| MEGA 16 | ~100 | ~10 sec |
| **Total** | **7610** | **~8 min** |

---

## 🔍 Vérifications

### Vérification globale

```sql
-- Compter le total
SELECT COUNT(*) as total_recettes FROM recipes;
-- Attendu : ~8652
```

### Vérification par type

```sql
-- Répartition par rôle
SELECT 
    role,
    COUNT(*) as nombre,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pourcentage
FROM recipes
GROUP BY role
ORDER BY nombre DESC;
```

**Résultat attendu** :
| Role | Nombre | % |
|------|--------|---|
| PLAT_PRINCIPAL | ~6500 | 75% |
| ENTREE | ~1500 | 17% |
| DESSERT | ~560 | 6% |
| ACCOMPAGNEMENT | ~450 | 5% |

### Vérification des nouvelles recettes

```sql
-- Compter les nouvelles recettes
SELECT COUNT(*) as nouvelles
FROM recipes
WHERE description LIKE '%À compléter';
-- Attendu : ~8051 (441 + 7610)
```

---

## ⚠️ Points d'attention

### Gestion des doublons

✅ **Tous les fichiers utilisent `ON CONFLICT (name) DO NOTHING`**

- Les doublons sont **automatiquement ignorés**
- Aucune erreur ne sera levée
- Le nombre final peut être légèrement inférieur (~8500 au lieu de 8652)

### Performance

- ⏱️ Chaque fichier MEGA prend **20-30 secondes**
- 💾 Les fichiers font **~90-100 KB** chacun
- ⚡ Supabase peut gérer sans problème

### En cas de timeout

Si Supabase timeout sur un fichier MEGA :

1. **Diviser en 2 parties** : Copier la première moitié du fichier
2. **Exécuter** la première partie
3. **Exécuter** la seconde partie
4. **Continuer** avec les fichiers suivants

---

## 📊 Récapitulatif de l'import

### Avant l'import

- ✅ 1042 recettes
- ✅ 549 enrichies avec tags (anciennes)
- ✅ 441 nouvelles à enrichir

### Après l'import

- 🎯 ~8652 recettes
- 🎯 549 enrichies (anciennes)
- 🎯 ~8103 à enrichir (nouvelles)

### Prochaine étape

Après l'import des 7610 recettes :

1. ✅ **Exécuter `enrich_new_recipes.sql`** pour les 441 déjà importées
2. 🔄 **Générer nouveau script d'enrichissement** pour les 7610 nouvelles
3. ✅ **Enrichir toutes les nouvelles recettes**

---

## 🎉 Résultat final attendu

```
📊 BASE DE DONNÉES ULTRA-COMPLÈTE

Total : ~8652 recettes
├─ Plats principaux : ~6500 (75%)
├─ Entrées : ~1500 (17%)
├─ Desserts : ~560 (6%)
└─ Accompagnements : ~450 (5%)

Couverture :
├─ Cuisine française : ✅ Complète
├─ Cuisine européenne : ✅ Complète
├─ Cuisine du monde : ✅ Large
├─ Streetfood : ✅ Complète
├─ Plats mijotés : ✅ Complète
├─ Poissons/Viandes : ✅ Complète
└─ Desserts : ✅ Très large

Utilisation potentielle :
✅ Planification de repas intelligente
✅ Suggestions basées sur ingrédients
✅ Recommandations personnalisées
✅ Assemblages gustatifs optimaux
✅ Gestion de stocks
✅ Nutrition et régimes spéciaux
```

---

## 🚀 Action immédiate

**Commence par MEGA_1.sql et progresse séquentiellement !**

1. Ouvrir Supabase SQL Editor
2. Copier `tools/add_recipes_MEGA_1.sql`
3. Coller et Run ▶️
4. Vérifier le compte
5. Passer à MEGA_2.sql

**Bon courage pour l'import !** 🎊

---

*Guide créé le 20 octobre 2025*  
*Fichiers générés : 16 fichiers MEGA*  
*Total : 7610 nouvelles recettes*
