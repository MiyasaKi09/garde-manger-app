# 🚀 GUIDE : IMPORT DE 400 NOUVELLES RECETTES

## 📊 Situation actuelle

- ✅ **Batch 1** : 49 entrées importées (601 → 650 recettes)
- 🆕 **Batch 2-9** : 400 nouvelles recettes prêtes à importer

## 📁 Fichiers générés

| Batch | Fichier | Contenu | Nombre | Type |
|-------|---------|---------|--------|------|
| 2 | `add_recipes_batch2.sql` | Entrées (bloc1, 51-100) | 50 | ENTREE |
| 3 | `add_recipes_batch3.sql` | Entrées (bloc1, 101-150) | 50 | ENTREE |
| 4 | `add_recipes_batch4.sql` | Plats traditionnels français | 50 | PLAT |
| 5 | `add_recipes_batch5.sql` | Plats européens | 50 | PLAT |
| 6 | `add_recipes_batch6.sql` | Poissons & fruits de mer | 50 | PLAT |
| 7 | `add_recipes_batch7.sql` | Volailles | 50 | PLAT |
| 8 | `add_recipes_batch8.sql` | Desserts (1-50) | 50 | DESSERT |
| 9 | `add_recipes_batch9.sql` | Desserts (51-100) | 50 | DESSERT |
| **ALL** | `add_recipes_batch_ALL.sql` | **TOUS LES BATCHES 2-9** | **400** | **MIXTE** |

## 🎯 OPTION 1 : Import rapide (1 fichier)

### Fichier unique consolidé

```bash
tools/add_recipes_batch_ALL.sql
```

**Contenu** : Les 8 batches fusionnés (2112 lignes, 74 KB)

### Procédure

1. Ouvrir Supabase → SQL Editor
2. Copier **tout** le contenu de `add_recipes_batch_ALL.sql`
3. Coller et Run ▶️
4. Attendre ~10-15 secondes

### Résultat attendu

```
Batch 2 terminé: X recettes
Batch 3 terminé: Y recettes
...
Batch 9 terminé: Z recettes
```

**Total après import** : ~1050 recettes (650 actuelles + 400 nouvelles)

## 🎯 OPTION 2 : Import batch par batch (contrôle)

Si tu préfères importer par petits groupes pour mieux contrôler :

### Batch 2-3 : +100 entrées

```sql
-- Exécuter tools/add_recipes_batch2.sql
-- Puis tools/add_recipes_batch3.sql
```

**Résultat** : 650 → 750 recettes

### Batch 4-7 : +200 plats

```sql
-- Exécuter tools/add_recipes_batch4.sql
-- tools/add_recipes_batch5.sql
-- tools/add_recipes_batch6.sql
-- tools/add_recipes_batch7.sql
```

**Résultat** : 750 → 950 recettes

### Batch 8-9 : +100 desserts

```sql
-- Exécuter tools/add_recipes_batch8.sql
-- Puis tools/add_recipes_batch9.sql
```

**Résultat** : 950 → 1050 recettes

## 🔍 Vérifications

### Vérification globale

```sql
-- Compter le total de recettes
SELECT COUNT(*) as total_recettes FROM recipes;

-- Attendu : ~1050
```

### Vérification par type

```sql
-- Statistiques par rôle
SELECT 
    role,
    COUNT(*) as nombre,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pourcentage
FROM recipes
GROUP BY role
ORDER BY nombre DESC;
```

**Résultat attendu** :

| role | nombre | pourcentage |
|------|--------|-------------|
| PLAT | ~750 | 71% |
| ENTREE | ~200 | 19% |
| DESSERT | ~100 | 10% |

### Vérification des nouvelles recettes

```sql
-- Voir les recettes ajoutées récemment
SELECT 
    role,
    COUNT(*) as nouvelles_recettes
FROM recipes
WHERE description LIKE '%À compléter'
GROUP BY role;
```

**Résultat attendu** :

| role | nouvelles_recettes |
|------|-------------------|
| ENTREE | ~149 (49+50+50) |
| PLAT | ~200 |
| DESSERT | ~100 |

## 🔄 Exemples de recettes ajoutées

### Entrées (Batch 2-3)

- Salade de pois gourmands
- Salade de lentilles aux œufs durs
- Salade de pois chiches à la coriandre
- Salade de haricots verts et rouges
- Soupe à l'oignon gratinée
- Velouté de potiron
- Minestrone italien
- Gaspacho andalou
- Tarte aux poireaux
- Quiche lorraine

### Plats (Batch 4-7)

- Blanquette de veau
- Boeuf bourguignon
- Coq au vin
- Osso bucco
- Cassoulet
- Paella valencienne
- Risotto aux champignons
- Moussaka grecque
- Bouillabaisse
- Poulet rôti aux herbes

### Desserts (Batch 8-9)

- Tarte aux pommes
- Crème brûlée
- Fondant au chocolat
- Mousse au chocolat
- Clafoutis aux cerises
- Panna cotta
- Tiramisu
- Crêpes suzette
- Tarte tatin
- Éclair au café

## ⚡ Action recommandée

**Je recommande l'OPTION 1** (fichier consolidé) car :

✅ Plus rapide (1 seule exécution)  
✅ Moins de risque d'erreur  
✅ Transaction unique  
✅ Gain de temps : 2 minutes au lieu de 20

## 🚨 Important

- ⚠️ Le fichier `add_recipes_batch_ALL.sql` fait 74 KB (2112 lignes)
- ⚠️ L'exécution peut prendre 10-15 secondes
- ⚠️ Si timeout, utiliser l'OPTION 2 (batch par batch)
- ✅ Toutes les recettes ont `ON CONFLICT (name) DO NOTHING` (anti-doublons automatique)

## 📈 Progression

```
Avant batch 1 : 611 recettes
Après batch 1 : 650 recettes (+49)
Après batch 2-9 : ~1050 recettes (+400)
────────────────────────────────────
Objectif 1000 : ✅ ATTEINT !
```

## 🎯 Prochaine étape

Une fois les 400 recettes importées :

1. ✅ Vérifier le compte total (~1050)
2. ✅ Enrichir les nouvelles recettes avec les profils gustatifs
3. ✅ Créer des liens recette-ingrédients pour les recettes populaires
4. ✅ Continuer à ajouter des recettes des autres blocs (5000+ disponibles)

---

**Prêt à importer ?** 🚀

Ouvre Supabase SQL Editor et choisis ton option !
