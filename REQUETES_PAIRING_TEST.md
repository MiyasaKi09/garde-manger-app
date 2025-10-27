# 🧪 Tests de l'API d'Assemblage Intelligent

**Date** : 27 octobre 2025  
**Endpoint** : `POST /api/recipes/suggestions`  
**Version** : 1.0

---

## 📋 Vue d'Ensemble

Cette documentation fournit des exemples de requêtes pour tester l'API d'assemblage intelligent de recettes.

**Algorithmes testés** :
1. 🧬 **Food Pairing** : Arômes partagés (30 points max)
2. ⚖️ **Équilibre** : Riche ↔ Léger (25 points max)
3. 🎭 **Contraste** : Textures opposées (20 points max)
4. 🌍 **Terroir** : Cuisine commune (15 points max)
5. 🍂 **Saison** : Bonus saisonnier (10 points max)

**Score total maximal** : 100 points

---

## 🧪 Tests avec Recettes Enrichies

### Test 1 : Entrecôte Grillée (ID: 142)

**Tags** : Arôme-Caramélisé, Asiatique, Barbecue, Été, Intensité-Moyen, Texture-Crémeux, Texture-Croquant, Végétarien

#### Requête POST

```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 142,
    "maxSuggestions": 5
  }'
```

#### Résultats Attendus

**Meilleurs accompagnements possibles** :
1. **Pâtes à la sauce tomate et basilic frais** (ID: 261)
   - Score attendu : ~35 points
   - Raisons :
     - ✅ Terroir : Pas de match (0 points)
     - ✅ Saison : Été commune (+10 points)
     - ✅ Food Pairing : Arôme-Épicé Frais vs Arôme-Caramélisé (0 points, pas de match)
     - ⚠️ Note : Score faible car peu de compatibilité

2. **Arancini siciliens** (ID: 79)
   - Score attendu : ~10 points
   - Raisons :
     - ✅ Saison : Pas de match saison explicite
     - ❌ Peu de compatibilité globale

**Filtres** :
```bash
# Filtre végétarien
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 142,
    "diet": "Végétarien",
    "maxSuggestions": 5
  }'
```

---

### Test 2 : One Pot Pasta Tomate-Basilic-Mozzarella (ID: 278)

**Tags** : Arôme-Épicé Frais, Été, Italienne, Japonaise, Saveur-Acide, Saveur-Herbacé, Vegan, Végétarien

#### Requête POST

```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 278,
    "maxSuggestions": 5
  }'
```

#### Résultats Attendus

**Meilleurs accompagnements** :
1. **Pâtes à la sauce tomate et basilic frais** (ID: 261)
   - Score attendu : ~50 points
   - Raisons :
     - ✅ Food Pairing : Arôme-Épicé Frais commun (+10 points)
     - ✅ Terroir : Italienne commune (+15 points)
     - ✅ Saison : Été commune (+10 points)
     - ✅ Saveur : Saveur-Acide et Saveur-Herbacé communes (bonus implicite)

2. **Koshari égyptien** (ID: 350)
   - Score attendu : ~35 points
   - Raisons :
     - ✅ Terroir : Italienne commune (+15 points)
     - ✅ Saison : Été commune (+10 points)
     - ✅ Saveur : Saveur-Acide commune

3. **Frites de polenta au parmesan** (ID: 320)
   - Score attendu : ~25 points
   - Raisons :
     - ✅ Terroir : Italienne commune (+15 points)
     - ❌ Pas de saison commune

---

### Test 3 : Shakshuka (ID: 38)

**Tags** : Été, Intensité-Intense, Intensité-Léger, Orientale, Saveur-Acide, Saveur-Épicé, Texture-Crémeux, Végétarien

#### Requête POST

```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 38,
    "maxSuggestions": 5
  }'
```

#### Résultats Attendus

**Note** : Plat Orientale, difficilement compatible avec accompagnements Italienne/Française dans la base.

**Meilleurs accompagnements possibles** :
1. **Pâtes à la sauce tomate** (ID: 261)
   - Score attendu : ~35 points
   - Raisons :
     - ✅ Saison : Été commune (+10 points)
     - ✅ Saveur : Saveur-Acide commune
     - ✅ Contraste : Texture-Crémeux commune (pas de contraste, 0 points)

2. **Macaroni and cheese américain** (ID: 276)
   - Score attendu : ~0 points
   - Raisons :
     - ❌ Pas de terroir commun
     - ❌ Pas de saison définie
     - ❌ Pas d'arômes partagés

**Recommandation** : Ce plat nécessiterait des accompagnements Orientaux (actuellement manquants dans la base).

---

### Test 4 : Pimientos de Padrón Grillés (ID: 71)

**Tags** : Arôme-Caramélisé, Barbecue, Espagnole, Été, Intensité-Moyen, Italienne, Texture-Croquant, Végétarien

#### Requête POST

```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 71,
    "maxSuggestions": 5
  }'
```

#### Résultats Attendus

**Meilleurs accompagnements** :
1. **Arancini siciliens** (ID: 79)
   - Score attendu : ~25 points
   - Raisons :
     - ✅ Terroir : Italienne commune (+15 points)
     - ❌ Pas de contraste texture (tous deux ont du croquant)

2. **Koshari égyptien** (ID: 350)
   - Score attendu : ~35 points
   - Raisons :
     - ✅ Terroir : Italienne commune (+15 points)
     - ✅ Saison : Été commune (+10 points)
     - ✅ Contraste : Texture-Croquant ↔ Texture-Crémeux (+20 points)

3. **Pâtes à la sauce tomate** (ID: 261)
   - Score attendu : ~45 points
   - Raisons :
     - ✅ Terroir : Italienne commune (+15 points)
     - ✅ Saison : Été commune (+10 points)
     - ✅ Contraste : Texture-Croquant ↔ Texture-Crémeux (+20 points)

---

## 🔬 Mode Debug : Analyse Détaillée

### Analyse d'un pairing spécifique

```bash
# Analyser le pairing entre Entrecôte (142) et Pâtes tomate (261)
curl "http://localhost:3000/api/recipes/suggestions?debug=true&main=142&side=261"
```

#### Réponse Attendue

```json
{
  "mode": "debug",
  "main": {
    "recipe": {
      "id": 142,
      "name": "Entrecôte grillée, sauce béarnaise"
    },
    "tags": ["Arôme-Caramélisé", "Asiatique", "Barbecue", "Été", ...]
  },
  "side": {
    "recipe": {
      "id": 261,
      "name": "Pâtes à la sauce tomate et basilic frais"
    },
    "tags": ["Arôme-Épicé Frais", "Été", "Italienne", ...]
  },
  "score": 10,
  "scorePercentage": 10,
  "reasons": [
    {
      "type": "season",
      "description": "Saison : Été",
      "score": 10
    }
  ],
  "details": {
    "foodPairing": {
      "score": 0,
      "sharedAromatics": []
    },
    "balance": {
      "score": 0,
      "balanced": false,
      "reason": null
    },
    "contrast": {
      "score": 0,
      "contrasts": []
    },
    "terroir": {
      "score": 0,
      "sharedCuisines": []
    },
    "season": {
      "score": 10,
      "season": "Été"
    }
  },
  "interpretation": {
    "excellent": false,
    "good": false,
    "acceptable": false,
    "poor": true
  }
}
```

---

## 🎯 Tests de Validation

### Validation 1 : Score Maximum Théorique

**Objectif** : Vérifier qu'aucun score ne dépasse 100 points

```sql
-- Après avoir généré toutes les suggestions, vérifier les scores
-- (Note: cette requête serait dans un test automatisé)
```

### Validation 2 : Filtres de Régime

**Test** : Vérifier que filtre `"diet": "Végétarien"` ne retourne QUE des végétariens

```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 142,
    "diet": "Végétarien",
    "maxSuggestions": 10
  }' | jq '.suggestions[].recipe.name'
```

**Vérification manuelle** : Toutes les recettes retournées doivent avoir le tag "Végétarien"

### Validation 3 : Cohérence des Raisons

**Test** : Vérifier que les raisons correspondent aux scores

```javascript
// Dans un test automatisé
suggestions.forEach(s => {
  const totalReasons = s.reasons.reduce((sum, r) => sum + r.score, 0);
  expect(totalReasons).toBe(s.score);
});
```

---

## 📊 Métriques de Qualité

### Couverture des Algorithmes

**Question** : Combien de pairings utilisent chaque règle ?

```sql
-- Après avoir collecté les statistiques d'utilisation
-- (Note: ceci serait implémenté dans un système de monitoring)
```

**Objectifs attendus** :
- 🧬 Food Pairing : ~30-40% des pairings (arômes moins fréquents)
- ⚖️ Équilibre : ~10-20% (recettes riches moins fréquentes)
- 🎭 Contraste : ~15-25% (textures bien représentées)
- 🌍 Terroir : ~60-70% (cuisines bien taggées)
- 🍂 Saison : ~40-50% (saisons bien représentées)

---

## 🚀 Tests de Performance

### Test 1 : Temps de Réponse

```bash
# Mesurer le temps de réponse pour une requête standard
time curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 142, "maxSuggestions": 5}'
```

**Objectif** : <500ms pour 5 suggestions

### Test 2 : Scalabilité

```bash
# Test avec maxSuggestions élevé
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 142, "maxSuggestions": 50}'
```

**Objectif** : <1s pour 50 suggestions

---

## 🐛 Tests de Cas Limites

### Cas 1 : Recette Sans Tags

```bash
# Tenter avec une recette sans tags (devrait retourner 404 ou suggestions vides)
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 9999}'
```

**Réponse attendue** : Erreur 404 avec message explicite

### Cas 2 : Aucun Accompagnement Compatible

```bash
# Recette avec tags très spécifiques (ex: Orientale uniquement)
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 38}'
```

**Réponse attendue** : `suggestions: []` avec message explicatif

### Cas 3 : Filtre Trop Restrictif

```bash
# Filtre Vegan + Saison spécifique = peu de résultats
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 278,
    "diet": "Vegan",
    "season": "Hiver",
    "maxSuggestions": 5
  }'
```

**Réponse attendue** : Peu ou pas de suggestions (acceptable)

---

## ✅ Checklist de Tests

### Tests Fonctionnels
- [ ] POST /api/recipes/suggestions retourne suggestions valides
- [ ] GET /api/recipes/suggestions retourne documentation
- [ ] Mode debug fonctionne avec `?debug=true&main=X&side=Y`
- [ ] Filtre `diet` fonctionne correctement
- [ ] Filtre `season` fonctionne correctement
- [ ] `maxSuggestions` limite correctement les résultats

### Tests de Qualité
- [ ] Scores entre 0 et 100
- [ ] Raisons cohérentes avec scores
- [ ] Suggestions triées par score décroissant
- [ ] Pas de doublons dans suggestions

### Tests de Performance
- [ ] Temps réponse <500ms (5 suggestions)
- [ ] Temps réponse <1s (50 suggestions)
- [ ] Pas d'erreurs mémoire avec grandes requêtes

### Tests de Robustesse
- [ ] Recette inexistante → erreur 404
- [ ] mainRecipeId invalide → erreur 400
- [ ] Aucun accompagnement → suggestions vides
- [ ] Filtres trop restrictifs → peu de résultats (acceptable)

---

## 📚 Prochaines Étapes

1. **Enrichir la base de données** : Ajouter plus de recettes avec tags Orientaux, Mexicains, etc.
2. **Affiner les scores** : Ajuster les pondérations (30/25/20/15/10) avec feedback utilisateurs
3. **Implémenter le feedback** : Permettre aux utilisateurs de noter les suggestions
4. **Machine Learning** : Utiliser les notes pour améliorer les algorithmes

---

## 🔗 Liens Utiles

- [ASSEMBLAGE_INTELLIGENT.md](ASSEMBLAGE_INTELLIGENT.md) - Spécifications complètes
- [lib/pairingService.js](lib/pairingService.js) - Implémentation des algorithmes
- [app/api/recipes/suggestions/route.js](app/api/recipes/suggestions/route.js) - Endpoint API

---

**Auteur** : Copilot AI  
**Date** : 27 octobre 2025  
**Statut** : 📋 DOCUMENTATION DE TESTS - Prêt pour validation
