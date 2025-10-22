# 🚀 Guide Rapide - Ajout de 50 Nouvelles Recettes (Batch 1)

**Date** : 20 octobre 2025  
**Objectif** : Passer de 611 à 661 recettes (+50 entrées)

---

## ✅ CE QUI A ÉTÉ FAIT

### Analyse des Blocs
- ✅ 20 blocs de recettes identifiés dans `supabase/`
- ✅ **6051 recettes uniques** disponibles (après élimination des doublons)
- ✅ 160 recettes extraites du **bloc1_entrees.txt**

### Fichier SQL Généré
📄 **`tools/add_recipes_batch1.sql`**
- 50 premières entrées du bloc1
- Anti-doublons automatique avec `ON CONFLICT (name) DO NOTHING`
- Description par défaut : "Entrée classique - À compléter"

---

## 🎯 ACTION À FAIRE MAINTENANT

### Étape 1 : Ouvrir Supabase SQL Editor

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Menu → **SQL Editor**

---

### Étape 2 : Exécuter le Batch 1

1. Ouvrir **`tools/add_recipes_batch1.sql`** dans VS Code
2. **Ctrl+A** (tout sélectionner)
3. **Ctrl+C** (copier)
4. Coller dans Supabase SQL Editor
5. Cliquer **Run** ▶️

**Durée** : ~5 secondes

---

### Étape 3 : Vérifier le Résultat

Le SQL affiche automatiquement un message :
```
message: "Batch 1 terminé"
nouvelles_recettes: XX
```

**Attendu** : Entre 40-50 nouvelles recettes (certaines peuvent déjà exister)

---

## 📊 Les 50 Recettes du Batch 1

### Salades Classiques Françaises (18)
1. Salade niçoise
2. Salade piémontaise
3. Salade de lentilles
4. Salade d'endives aux noix
5. Salade lyonnaise
6. Salade de pommes de terre
7. Salade de haricots verts
8. Salade de betteraves
9. Salade de tomates à l'échalote
10. Salade de carottes râpées
11. Céleri rémoulade
12. Salade de chou blanc
13. Salade de concombre à la crème
14. Salade de mache aux lardons
15. Salade de gésiers
16. Salade campagnarde
17. Salade d'asperges
18. Salade de chou-fleur

### Salades Composées (11)
19. Salade césar
20. Salade grecque
21. Salade italienne
22. Salade coleslaw
23. Salade Waldorf
24. Salade de quinoa aux légumes
25. Salade de pâtes
26. Salade de riz
27. Taboulé
28. Fattoush
29. Salade thaï

### Entrées Chaudes (10)
30. Œufs mimosa
31. Terrine de campagne
32. Pâté en croûte
33. Rillettes de porc
34. Mousse de foie
35. Escargots de Bourgogne
36. Cuisses de grenouille
37. Bouchée à la reine
38. Vol-au-vent
39. Croque-monsieur

### Tartines & Toasts (7)
40. Tartine de saumon fumé
41. Bruschetta
42. Crostini
43. Tartine d'avocat
44. Toast au foie gras
45. Tartare de saumon
46. Carpaccio de bœuf

### Entrées Froides (4)
47. Melon au jambon
48. Assiette de charcuterie
49. Assiette de fromage
50. Verrines diverses

---

## ⚠️ Gestion des Doublons

### Le SQL Est Intelligent ! 🧠

```sql
INSERT INTO recipes (name, role, description)
VALUES ('Salade niçoise', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;
```

- ✅ Si "Salade niçoise" existe déjà → **ignorée**
- ✅ Si nouvelle → **ajoutée**
- ✅ **Aucune erreur** dans tous les cas

---

## 🔍 Vérification Rapide

Après l'exécution, vérifiez le nombre total :

```sql
SELECT COUNT(*) as total_recettes FROM recipes;
```

**Avant** : 611 recettes  
**Après** : ~655-661 recettes (selon les doublons)

---

## 🚀 Prochaines Étapes

Une fois le Batch 1 validé :

1. **Batch 2** : 50 entrées supplémentaires (recettes 51-100 du bloc1)
2. **Batch 3** : 50 plats principaux (bloc2)
3. **Batch 4** : 50 desserts (bloc3)
4. ... jusqu'à 1000 recettes

**Rythme recommandé** : 1 batch par jour (pour vérifier la qualité)

---

## 📝 Notes

- Les descriptions sont par défaut "Entrée classique - À compléter"
- Vous pourrez enrichir les descriptions plus tard
- Les tags seront ajoutés après l'import de tous les batches

---

**Prêt à exécuter** : `tools/add_recipes_batch1.sql` ✅
