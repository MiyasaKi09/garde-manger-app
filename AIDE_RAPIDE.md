# ⚡ AIDE RAPIDE - Enrichissement des Recettes

## 🎯 Situation Actuelle

Vous avez actuellement :
- ✅ **253 recettes** enrichies
- ✅ **361 associations** de tags
- ❌ **MANQUE 1001 associations** (objectif : 1362)

---

## 🚨 CE QU'IL FAUT FAIRE MAINTENANT

### Étape 1 : Ouvrir Supabase SQL Editor

URL : https://supabase.com/dashboard → Votre projet → **SQL Editor**

---

### Étape 2 : Exécuter le fichier d'enrichissement

**OPTION A - Fichier Unique (RECOMMANDÉ)** ⭐

1. Ouvrir le fichier **`tools/enrichment_optimized.sql`** dans VS Code
2. Sélectionner TOUT le contenu (Ctrl+A ou Cmd+A)
3. Copier (Ctrl+C ou Cmd+C)
4. Aller dans Supabase SQL Editor
5. Coller dans l'éditeur
6. Cliquer sur **Run** ▶️
7. Attendre ~30 secondes

**OPTION B - Si timeout (28 fichiers)**

Exécuter les fichiers un par un :
- `tools/batch_1_of_28.sql`
- `tools/batch_2_of_28.sql`
- ... jusqu'à ...
- `tools/batch_28_of_28.sql`

---

### Étape 3 : Vérifier le résultat

Copier-coller cette requête dans Supabase :

```sql
SELECT 
  COUNT(DISTINCT r.id) as recettes_enrichies,
  COUNT(*) as total_associations
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id;
```

**Résultat AVANT enrichissement** (actuellement) :
- recettes_enrichies: 253
- total_associations: 361

**Résultat APRÈS enrichissement** (attendu) :
- recettes_enrichies: ~585
- total_associations: ≥ 1362

---

## 📊 Ce qui sera ajouté

L'enrichissement ajoutera **~1001 nouvelles associations** :

- **Profils de Saveur** : Saveur-Salé, Saveur-Sucré, Saveur-Acide, Saveur-Amer, Saveur-Umami, Saveur-Épicé, Saveur-Herbacé
- **Textures** : Texture-Crémeux, Texture-Croquant, Texture-Moelleux, Texture-Ferme, Texture-Liquide
- **Intensités** : Intensité-Léger, Intensité-Moyen, Intensité-Riche, Intensité-Intense
- **Familles Aromatiques** : Arôme-Fruité, Arôme-Agrumes, Arôme-Floral, Arôme-Végétal, Arôme-Terreux, Arôme-Marin, Arôme-Lacté, Arôme-Caramélisé, Arôme-Épicé Chaud, Arôme-Épicé Frais
- **Plus** : Saisons, occasions, mots-clés fonctionnels

---

## 🆘 Problèmes Courants

### "Query too large" ou "Timeout"
→ Utilisez l'Option B (28 fichiers batch)

### "Duplicate key violation"
→ Normal ! Le SQL contient `ON CONFLICT DO NOTHING`. Continuez.

### Les nombres ne changent pas après exécution
→ Vérifiez dans Supabase qu'il n'y a pas eu d'erreur
→ Essayez l'Option B (batch par batch)

---

## 📚 Documentation Complète

- **FICHIERS_A_EXECUTER.md** - Instructions détaillées
- **GUIDE_EXECUTION_SUPABASE.md** - Guide pas-à-pas avec screenshots
- **REQUETES_TEST.md** - Requêtes de test après enrichissement
- **ASSEMBLAGE_INTELLIGENT.md** - Documentation théorique

---

**Date** : 19 octobre 2025  
**Statut** : ⚠️ Enrichissement incomplet - Action requise
