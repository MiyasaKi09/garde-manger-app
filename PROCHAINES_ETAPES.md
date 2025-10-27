# 🎯 Prochaines Étapes - Feuille de Route

**Date** : 27 octobre 2025  
**Contexte** : Suite à la correction massive des calories (2980 UPDATE)

---

## ✅ Accomplissements Récents

### 27 octobre 2025 : Qualité des Données + API d'Assemblage
- ✅ **2980 calories corrigées** automatiquement (88.6% de réduction des NULL)
- ✅ **Script import_ciqual.sh** corrigé définitivement
- ✅ **Formule d'Atwater** validée et documentée
- ✅ **Documentation complète** créée (8 nouveaux fichiers)
- ✅ **396 recettes enrichies** avec tags gastronomiques (45%)
- ✅ **API d'assemblage intelligent** implémentée avec 4 algorithmes
- ✅ **Service de pairing** créé (lib/pairingService.js)
- ✅ **Endpoint REST** déployé (POST /api/recipes/suggestions)

---

## 🚀 Prochaines Actions Prioritaires

### 1. ✅ API d'Assemblage Intelligent - IMPLÉMENTÉ

**Statut** : ✅ **COMPLÉTÉ** (27 octobre 2025)

**Fichiers créés** :
- ✅ `lib/pairingService.js` - Service avec 4 algorithmes (Food Pairing, Équilibre, Contraste, Terroir)
- ✅ `app/api/recipes/suggestions/route.js` - Endpoint API REST
- ✅ `REQUETES_PAIRING_TEST.md` - Documentation et tests complets

**Algorithmes implémentés** :
1. 🧬 **Food Pairing** (30 points) - Arômes partagés (gastronomie moléculaire)
2. ⚖️ **Règle d'Équilibre** (25 points) - Plat riche ↔ Accompagnement léger/acide
3. 🎭 **Règle de Contraste** (20 points) - Textures opposées (crémeux ↔ croquant)
4. 🌍 **Règle du Terroir** (15 points) - Cuisine commune (Française, Italienne, etc.)
5. 🍂 **Bonus Saison** (10 points) - Saison commune

**Utilisation** :
```bash
# Suggérer accompagnements pour une recette
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 142, "maxSuggestions": 5}'

# Mode debug : analyser pairing spécifique
curl "http://localhost:3000/api/recipes/suggestions?debug=true&main=142&side=261"
```

**Tests disponibles** : Voir `REQUETES_PAIRING_TEST.md` pour exemples complets

**Prochaine étape** : Tester l'API avec recettes réelles et affiner les scores

---

### 3. Correction des Recettes Incomplètes

**Statut actuel** :
- 396/878 recettes enrichies (45%)
- 1016 associations créées
- **482 recettes sans tags** (55%)

**Action requise** (OPTIONNEL) :
```bash
# Exécuter dans Supabase SQL Editor
tools/enrichment_optimized.sql
```

**Note** : L'API d'assemblage fonctionne déjà avec les 396 recettes enrichies actuelles.
L'enrichissement complet n'est PAS bloquant pour les tests et la validation.

**Fichiers** :
- [GUIDE_ENRICHISSEMENT_MANUEL.md](GUIDE_ENRICHISSEMENT_MANUEL.md) - Guide Supabase
- [REQUETES_TEST.md](REQUETES_TEST.md) - Requêtes de vérification

**Priorité** : � MOYENNE (non bloquant)  
**Durée estimée** : 30 secondes  
**Impact** : Augmentation qualité suggestions

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

### 4. Enrichissement des 100 Aliments Restants

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

### 5. Tests et Validation de l'API d'Assemblage

**Contexte** :
L'API d'assemblage intelligent est implémentée et prête à être testée.

**Documentation** :
- [ASSEMBLAGE_INTELLIGENT.md](ASSEMBLAGE_INTELLIGENT.md) - Spécifications théoriques complètes
- [REQUETES_PAIRING_TEST.md](REQUETES_PAIRING_TEST.md) - Tests pratiques et exemples

**Tests à effectuer** :
```bash
# Test 1 : Entrecôte grillée (ID: 142)
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 142, "maxSuggestions": 5}'

# Test 2 : One pot pasta (ID: 278)
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 278, "maxSuggestions": 5}'

# Test 3 : Mode debug
curl "http://localhost:3000/api/recipes/suggestions?debug=true&main=142&side=261"
```

**Validation** :
- [ ] Scores entre 0 et 100
- [ ] Raisons cohérentes avec scores
- [ ] Suggestions triées par score décroissant
- [ ] Filtres (diet, season) fonctionnent
- [ ] Mode debug affiche détails complets

**Priorité** : � HAUTE (API implémentée, besoin de validation)  
**Durée estimée** : 1-2 heures  
**Impact** : Validation système complet d'assemblage intelligent

---

### 6. Tests de Non-Régression Nutritionnelle

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

### 7. Monitoring et Alertes

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
