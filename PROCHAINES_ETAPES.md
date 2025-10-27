# 🎯 Prochaines Étapes - Feuille de Route

**Date** : 27 octobre 2025  
**Contexte** : Suite à la correction massive des calories (2980 UPDATE)

---

## ✅ Accomplissements Récents

### 27 octobre 2025 : Qualité des Données
- ✅ **2980 calories corrigées** automatiquement (88.6% de réduction des NULL)
- ✅ **Script import_ciqual.sh** corrigé définitivement
- ✅ **Formule d'Atwater** validée et documentée
- ✅ **Documentation complète** créée (5 nouveaux fichiers)

---

## 🚀 Prochaines Actions Prioritaires

### 1. Enrichissement des Recettes avec Tags ⚠️ EN COURS

**Statut actuel** :
- 253/585 recettes enrichies (43%)
- 361/1362 associations créées (26.5%)

**Action requise** :
```bash
# Exécuter dans Supabase SQL Editor
tools/enrichment_optimized.sql
```

**Fichiers** :
- [AIDE_RAPIDE.md](AIDE_RAPIDE.md) - Guide ultra-rapide
- [FICHIERS_A_EXECUTER.md](FICHIERS_A_EXECUTER.md) - Liste des fichiers
- [GUIDE_EXECUTION_SUPABASE.md](GUIDE_EXECUTION_SUPABASE.md) - Instructions détaillées

**Vérification** :
```sql
SELECT 
  COUNT(DISTINCT r.id) as recettes_enrichies,
  COUNT(*) as total_associations
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id;

-- Objectif : recettes_enrichies ≥ 585, total_associations ≥ 1362
```

**Priorité** : 🔴 HAUTE  
**Durée estimée** : 30 secondes  
**Bloquant pour** : API d'assemblage intelligent

---

### 2. Correction des Recettes Incomplètes

**Problème identifié** :
- 3 recettes avec <10 kcal/portion détectées
- Cause : ingrédients non liés à `canonical_foods`

**Exemples** :
- Recipe 8772 (Pommes noisettes) : 0.6 kcal/portion
- Recipe 533 (Tripes à la mode de Caen) : 0.8 kcal/portion
- Recipe 8968 (Tourin à l'ail) : 5.7 kcal/portion

**Action requise** :
```sql
-- Identifier toutes les recettes avec ingrédients non liés
SELECT 
    r.id AS recipe_id,
    r.name AS recette,
    COUNT(ri.id) AS nb_ingredients_totaux,
    COUNT(cf.id) AS nb_ingredients_lies,
    COUNT(ri.id) - COUNT(cf.id) AS nb_ingredients_non_lies
FROM recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
GROUP BY r.id, r.name
HAVING COUNT(ri.id) - COUNT(cf.id) > 0
ORDER BY nb_ingredients_non_lies DESC;
```

**Solution** :
1. Utiliser le script `tools/auto_link_nutrition.py`
2. Ou lier manuellement via interface admin

**Priorité** : 🟡 MOYENNE  
**Durée estimée** : 2-4 heures  
**Impact** : Amélioration qualité recettes

---

### 3. Enrichissement des 100 Aliments Restants

**Contexte** :
- 100 aliments ont encore `calories_kcal = NULL`
- Raison : données sources incomplètes (macronutriments manquants)

**Exemples** :
```
source_id '10000' : protéines=16.3g, glucides=NULL, lipides=3.5g
source_id '13172' : protéines=NULL, glucides=23.6g, lipides=8.93g
```

**Options** :

**Option A : Enrichissement manuel** (RECOMMANDÉ)
1. Consulter tables Ciqual officielles sur [ciqual.anses.fr](https://ciqual.anses.fr)
2. Compléter les macronutriments manquants dans CSV
3. Re-générer les UPDATE SQL
4. Exécuter les corrections

**Option B : Marquage explicite**
```sql
-- Marquer comme "non applicable" les aliments sans macros
UPDATE nutritional_data 
SET calories_kcal = 0 
WHERE source_id IN ('1024', '18064')  -- Aliments avec 0g macros
  AND calories_kcal IS NULL;
```

**Priorité** : 🟢 BASSE  
**Durée estimée** : 4-8 heures (recherche manuelle)  
**Impact** : Passage de 96.9% → 100% complétude

---

### 4. Implémentation API d'Assemblage Intelligent

**Contexte** :
Une fois l'enrichissement des tags terminé, implémenter l'API React pour :
- Food Pairing (gastronomie moléculaire)
- Règle d'Équilibre (plats riches ↔ accompagnements légers)
- Règle de Contraste (textures opposées)
- Règle du Terroir (cuisines régionales)

**Documentation** :
- [ASSEMBLAGE_INTELLIGENT.md](ASSEMBLAGE_INTELLIGENT.md) - Spécifications complètes
- [REQUETES_TEST.md](REQUETES_TEST.md) - Exemples de requêtes

**Endpoints à créer** :
```javascript
// API route: /api/recipes/suggestions
POST /api/recipes/suggestions
{
  "mainRecipeId": 123,
  "maxSuggestions": 5
}

// Réponse :
{
  "suggestions": [
    {
      "recipeId": 456,
      "recipeName": "Salade César",
      "score": 0.92,
      "reasons": ["food_pairing", "equilibre", "terroir"]
    }
  ]
}
```

**Priorité** : 🟡 MOYENNE  
**Durée estimée** : 1-2 jours  
**Dépend de** : Enrichissement tags terminé

---

### 5. Tests de Non-Régression Nutritionnelle

**Action requise** :
Créer une suite de tests automatisés pour vérifier :
- Aucune calorie négative
- Aucune calorie >1000 kcal (sauf huiles pures)
- Écart Atwater <10% pour tous les aliments

**Script à créer** :
```javascript
// tests/nutrition-regression.test.js
describe('Nutritional Data Quality', () => {
  test('No negative calories', async () => {
    const { data } = await supabase
      .from('nutritional_data')
      .select('source_id, calories_kcal')
      .lt('calories_kcal', 0);
    
    expect(data.length).toBe(0);
  });
  
  test('Atwater formula accuracy', async () => {
    const { data } = await supabase
      .from('nutritional_data')
      .select('source_id, calories_kcal, proteines_g, glucides_g, lipides_g')
      .not('calories_kcal', 'is', null);
    
    data.forEach(aliment => {
      const calculated = (aliment.proteines_g * 4) + 
                        (aliment.glucides_g * 4) + 
                        (aliment.lipides_g * 9);
      const diff = Math.abs(aliment.calories_kcal - calculated);
      const diffPct = diff / aliment.calories_kcal;
      
      expect(diffPct).toBeLessThan(0.10); // <10% écart
    });
  });
});
```

**Priorité** : 🟢 BASSE  
**Durée estimée** : 2-3 heures  
**Impact** : Prévention régressions futures

---

### 6. Monitoring et Alertes

**Action requise** :
Mettre en place un système de monitoring quotidien :

```sql
-- Créer une vue pour le dashboard de monitoring
CREATE OR REPLACE VIEW nutrition_health AS
SELECT 
    COUNT(*) FILTER (WHERE calories_kcal IS NULL) AS calories_null,
    COUNT(*) FILTER (WHERE calories_kcal < 0) AS calories_negatives,
    COUNT(*) FILTER (WHERE proteines_g IS NULL) AS proteines_null,
    ROUND(COUNT(*) FILTER (WHERE calories_kcal IS NOT NULL)::NUMERIC / COUNT(*) * 100, 2) AS pct_completude
FROM nutritional_data;

-- Requête d'alerte quotidienne
SELECT * FROM nutrition_health
WHERE calories_null > 150  -- Seuil d'alerte
   OR calories_negatives > 0;
```

**Automatisation** :
```javascript
// api/monitoring/nutrition-health
// Exécuter quotidiennement via cron job
export async function GET() {
  const { data } = await supabase
    .from('nutrition_health')
    .select('*')
    .single();
  
  if (data.calories_null > 150 || data.calories_negatives > 0) {
    // Envoyer alerte (email, Slack, etc.)
    await sendAlert({
      type: 'nutrition_degradation',
      data
    });
  }
  
  return Response.json(data);
}
```

**Priorité** : 🟡 MOYENNE  
**Durée estimée** : 3-4 heures  
**Impact** : Détection précoce de problèmes

---

## 📅 Timeline Suggérée

### Semaine 1 (Immédiat)
- ✅ Jour 1 : Correction calories (TERMINÉ)
- ⏳ Jour 2-3 : **Enrichissement tags** (ACTION IMMÉDIATE)
- ⏳ Jour 4-5 : Correction recettes incomplètes

### Semaine 2-3
- ⏳ Implémentation API assemblage intelligent
- ⏳ Tests de non-régression
- ⏳ Monitoring et alertes

### Semaine 4+ (Long terme)
- ⏳ Enrichissement 100 aliments restants
- ⏳ Optimisations performance
- ⏳ Déploiement production

---

## 🎯 Objectifs Mesurables

### Court terme (1 semaine)
- [x] Calories NULL : 880 → 100 (88.6% réduction) ✅ ATTEINT
- [ ] Tags enrichis : 361 → 1362 associations
- [ ] Recettes <10 kcal : 20 → <5

### Moyen terme (1 mois)
- [ ] API assemblage : 4 endpoints fonctionnels
- [ ] Tests automatisés : >80% couverture
- [ ] Monitoring : dashboard opérationnel

### Long terme (3 mois)
- [ ] Complétude nutrition : 96.9% → 100%
- [ ] Recettes complètes : 100% ingrédients liés
- [ ] Performance : <200ms temps réponse API

---

## 📚 Ressources

### Documentation
- [INDEX.md](INDEX.md) - Navigation complète
- [STATUS.md](STATUS.md) - État actuel
- [RAPPORT_CORRECTION_CALORIES_FINAL.md](RAPPORT_CORRECTION_CALORIES_FINAL.md) - Correction récente

### Outils
- [tools/](tools/) - Scripts SQL et Python
- [REQUETES_MONITORING_NUTRITION.md](REQUETES_MONITORING_NUTRITION.md) - Requêtes de monitoring

### Support
- [GUIDE_EXECUTION_SUPABASE.md](GUIDE_EXECUTION_SUPABASE.md) - Dépannage

---

## ✅ Checklist Rapide

### Cette semaine
- [ ] Lire [AIDE_RAPIDE.md](AIDE_RAPIDE.md)
- [ ] Exécuter `tools/enrichment_optimized.sql` dans Supabase
- [ ] Vérifier avec [REQUETES_TEST.md](REQUETES_TEST.md)
- [ ] Identifier recettes avec ingrédients non liés
- [ ] Planifier implémentation API assemblage

### Ce mois
- [ ] Implémenter API assemblage intelligent
- [ ] Créer tests de non-régression
- [ ] Mettre en place monitoring quotidien
- [ ] Démarrer enrichissement 100 aliments restants

### Ce trimestre
- [ ] Atteindre 100% complétude nutritionnelle
- [ ] Lier 100% des ingrédients de recettes
- [ ] Optimiser performances API
- [ ] Préparer déploiement production

---

**Auteur** : Copilot AI  
**Date** : 27 octobre 2025  
**Prochaine révision** : 3 novembre 2025  
**Statut** : 📋 EN COURS - Phase Enrichissement Tags
