# 🧪 API d'Assemblage Intelligent - Documentation Rapide

**Date** : 27 octobre 2025  
**Version** : 1.0  
**Statut** : ✅ Implémenté et prêt pour tests

---

## 🎯 Vue d'Ensemble

L'API d'assemblage intelligent suggère des accompagnements harmonieux pour un plat principal en utilisant **4 algorithmes gastronomiques** :

1. 🧬 **Food Pairing** (30 points) - Arômes partagés (gastronomie moléculaire)
2. ⚖️ **Règle d'Équilibre** (25 points) - Riche ↔ Léger/Acide
3. 🎭 **Règle de Contraste** (20 points) - Textures opposées
4. 🌍 **Règle du Terroir** (15 points) - Cuisine commune
5. 🍂 **Bonus Saison** (10 points) - Saison commune

**Score maximum** : 100 points

---

## 🚀 Utilisation Rapide

### Endpoint Principal

```bash
POST /api/recipes/suggestions
```

**Requête** :
```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 142,
    "maxSuggestions": 5
  }'
```

**Réponse** :
```json
{
  "mainRecipe": {
    "id": 142,
    "name": "Plat principal"
  },
  "suggestions": [
    {
      "recipe": {
        "id": 261,
        "name": "Pâtes à la sauce tomate et basilic frais",
        "description": "...",
        "role": "ACCOMPAGNEMENT"
      },
      "score": 50,
      "scorePercentage": 50,
      "reasons": [
        {
          "type": "food_pairing",
          "description": "Arômes partagés : Arôme-Épicé Frais",
          "score": 10
        },
        {
          "type": "terroir",
          "description": "Cuisine commune : Italienne",
          "score": 15
        },
        {
          "type": "season",
          "description": "Saison : Été",
          "score": 10
        },
        {
          "type": "contrast",
          "description": "Contraste de textures : Texture-Croquant ↔ Texture-Crémeux",
          "score": 20
        }
      ],
      "tags": ["Arôme-Épicé Frais", "Été", "Italienne", ...]
    }
  ],
  "summary": {
    "totalCandidates": 47,
    "validSuggestions": 47,
    "returned": 5
  }
}
```

---

## 🔧 Paramètres

### Requis
- `mainRecipeId` (number) : ID du plat principal

### Optionnels
- `diet` (string) : Filtre régime - `"Végétarien"`, `"Vegan"`, `"Sans Gluten"`, `"Sans Lactose"`
- `season` (string) : Filtre saison - `"Printemps"`, `"Été"`, `"Automne"`, `"Hiver"`
- `maxSuggestions` (number) : Nombre max de suggestions (défaut: 5)

### Exemples avec Filtres

```bash
# Filtre végétarien
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 142,
    "diet": "Végétarien",
    "maxSuggestions": 5
  }'

# Filtre saison + régime
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "mainRecipeId": 278,
    "diet": "Vegan",
    "season": "Été",
    "maxSuggestions": 10
  }'
```

---

## 🔬 Mode Debug

### Analyser un Pairing Spécifique

```bash
GET /api/recipes/suggestions?debug=true&main={mainId}&side={sideId}
```

**Exemple** :
```bash
curl "http://localhost:3000/api/recipes/suggestions?debug=true&main=142&side=261"
```

**Réponse** :
```json
{
  "mode": "debug",
  "main": {
    "recipe": { "id": 142, "name": "Entrecôte grillée" },
    "tags": ["Arôme-Caramélisé", "Asiatique", "Été", ...]
  },
  "side": {
    "recipe": { "id": 261, "name": "Pâtes tomate basilic" },
    "tags": ["Arôme-Épicé Frais", "Été", "Italienne", ...]
  },
  "score": 10,
  "scorePercentage": 10,
  "reasons": [
    { "type": "season", "description": "Saison : Été", "score": 10 }
  ],
  "details": {
    "foodPairing": { "score": 0, "sharedAromatics": [] },
    "balance": { "score": 0, "balanced": false },
    "contrast": { "score": 0, "contrasts": [] },
    "terroir": { "score": 0, "sharedCuisines": [] },
    "season": { "score": 10, "season": "Été" }
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

## 📊 Interprétation des Scores

| Score | Interprétation | Description |
|-------|---------------|-------------|
| 70-100 | 🟢 Excellent | Pairing hautement compatible, plusieurs règles activées |
| 50-69 | 🟡 Bon | Compatible, au moins 2 règles activées |
| 30-49 | 🟠 Acceptable | Pairing possible, au moins 1 règle activée |
| 0-29 | 🔴 Faible | Peu compatible, éviter ou tester prudemment |

---

## 🧪 Exemples de Tests

### Test 1 : Entrecôte Grillée (ID: 142)
**Tags** : Arôme-Caramélisé, Asiatique, Barbecue, Été, Intensité-Moyen, Texture-Crémeux, Texture-Croquant, Végétarien

```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 142, "maxSuggestions": 5}'
```

**Résultats attendus** :
- Accompagnements avec saison Été (+10 points)
- Peu de compatibilité terroir (tags Asiatique rares dans accompagnements)

---

### Test 2 : One Pot Pasta Tomate-Basilic (ID: 278)
**Tags** : Arôme-Épicé Frais, Été, Italienne, Japonaise, Saveur-Acide, Saveur-Herbacé, Vegan, Végétarien

```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 278, "maxSuggestions": 5}'
```

**Résultats attendus** :
- **Pâtes à la sauce tomate** (ID: 261) : ~50 points
  - Food Pairing : Arôme-Épicé Frais (+10)
  - Terroir : Italienne (+15)
  - Saison : Été (+10)
  - Contraste : Texture-Crémeux (+15-20)

---

### Test 3 : Shakshuka (ID: 38)
**Tags** : Été, Intensité-Intense, Intensité-Léger, Orientale, Saveur-Acide, Saveur-Épicé, Texture-Crémeux, Végétarien

```bash
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 38, "maxSuggestions": 5}'
```

**Note** : Plat Orientale → peu d'accompagnements compatibles dans la base actuelle (manque de recettes Orientales).

---

## 🛠️ Architecture Technique

### Fichiers Implémentés

1. **`lib/pairingService.js`** - Service de pairing
   - `suggestPairings(mainRecipeId, options)` - Fonction principale
   - `debugPairing(mainId, sideId)` - Analyse détaillée
   - 4 fonctions de scoring (Food Pairing, Équilibre, Contraste, Terroir)
   - Fonction de génération de raisons

2. **`app/api/recipes/suggestions/route.js`** - Endpoint API
   - `POST /api/recipes/suggestions` - Suggestions
   - `GET /api/recipes/suggestions?debug=true` - Mode debug
   - `GET /api/recipes/suggestions` - Documentation

### Dépendances

- `@supabase/supabase-js` - Client Supabase pour accès base de données
- `next` - Framework Next.js pour routes API

---

## 📚 Documentation Complète

- **[ASSEMBLAGE_INTELLIGENT.md](ASSEMBLAGE_INTELLIGENT.md)** - Spécifications théoriques détaillées
- **[REQUETES_PAIRING_TEST.md](REQUETES_PAIRING_TEST.md)** - Tests complets et validation
- **[STATUS.md](STATUS.md)** - Statut du projet
- **[PROCHAINES_ETAPES.md](PROCHAINES_ETAPES.md)** - Roadmap

---

## 🐛 Dépannage

### Erreur 404 : Recette Non Trouvée
```json
{
  "error": "Recette introuvable ou sans tags",
  "details": "Recette non trouvée: ...",
  "help": "Vérifiez que la recette existe et possède des tags gastronomiques"
}
```

**Solution** : Vérifier que la recette existe et a des tags dans `recipe_tags`.

---

### Aucune Suggestion Retournée
```json
{
  "suggestions": [],
  "summary": { ... }
}
```

**Causes possibles** :
- Plat principal avec tags très spécifiques (ex: Orientale uniquement)
- Filtres trop restrictifs (ex: Vegan + Hiver)
- Peu d'accompagnements dans la base de données

**Solution** : Élargir les critères ou enrichir la base avec plus de recettes.

---

### Scores Faibles (<30 points)

**Causes** :
- Peu de tags en commun entre plat et accompagnements
- Tags incompatibles (ex: cuisine différente, pas d'arômes partagés)

**Solution** : Normal pour certaines combinaisons. Le système est conçu pour rejeter les pairings incompatibles.

---

## ✅ Tests de Validation

### Checklist Fonctionnelle

- [ ] POST /api/recipes/suggestions retourne suggestions valides
- [ ] Scores entre 0 et 100
- [ ] Raisons cohérentes avec scores
- [ ] Suggestions triées par score décroissant
- [ ] Filtre `diet` fonctionne
- [ ] Filtre `season` fonctionne
- [ ] Mode debug retourne détails complets
- [ ] Temps de réponse <500ms (5 suggestions)

---

## 🚀 Prochaines Étapes

1. **Tests en Développement** : Lancer le serveur Next.js et tester les endpoints
2. **Affiner les Scores** : Ajuster les pondérations selon feedback
3. **Enrichir la Base** : Ajouter plus de recettes avec tags variés (Orientaux, Mexicains, etc.)
4. **Interface Utilisateur** : Créer composant React pour afficher suggestions
5. **Machine Learning** : Utiliser feedback utilisateurs pour améliorer algorithmes

---

**Auteur** : Copilot AI  
**Date** : 27 octobre 2025  
**Statut** : ✅ IMPLÉMENTÉ - Prêt pour tests et validation
