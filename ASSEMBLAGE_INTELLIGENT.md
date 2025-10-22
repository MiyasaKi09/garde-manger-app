# 🧪 Système d'Assemblage Intelligent de Recettes

## Vue d'Ensemble

Ce système combine **gastronomie moléculaire** et **règles culinaires classiques** pour suggérer des assemblages de plats harmonieux et créatifs.

---

## 📊 Taxonomie des Tags

### 1. Tags de Base (45 tags)

#### Cuisines (11)
- Française, Italienne, Espagnole, Asiatique, Chinoise, Japonaise, Thaïlandaise, Indienne, Mexicaine, Américaine, Orientale

#### Régimes Alimentaires (4)
- Végétarien, Vegan, Sans Gluten, Sans Lactose

#### Saisons (4)
- Printemps, Été, Automne, Hiver

#### Occasions (5+)
- Petit-déjeuner, Apéritif, Barbecue, Fête, Pique-nique

#### Fonctionnels (15+)
- **Difficulté** : Facile, Moyen, Difficile
- **Temps** : Rapide, Long
- **Style** : Festif, Quotidien, Réconfortant, Économique, Luxe
- **Profil** : Healthy, Gourmand

---

### 2. Tags de Profils Gustatifs (50+ nouveaux tags)

#### Profils de Saveur (13)
Basés sur les 5 saveurs de base + saveurs complexes :

- **Saveur-Salé** : Plats dominés par le sel, fromages affinés, salaisons
- **Saveur-Sucré** : Desserts, miel, caramel, fruits
- **Saveur-Acide** : Citron, vinaigre, tomates, agrumes, vin blanc
- **Saveur-Amer** : Endives, cacao, café, pamplemousse
- **Saveur-Umami** : Parmesan, champignons, tomate concentrée, soja, miso
- **Saveur-Épicé** : Piment, poivre, curry, harissa
- **Saveur-Herbacé** : Basilic, persil, coriandre, menthe, herbes aromatiques
- **Saveur-Floral** : Rose, lavande, fleur d'oranger

#### Profils de Texture (5)
Pour règles de **contraste** :

- **Texture-Crémeux** : Sauces, veloutés, mousses, fondants
- **Texture-Croquant** : Grillé, caramélisé, chips, biscuits
- **Texture-Moelleux** : Tendre, soyeux
- **Texture-Ferme** : Al dente, dense
- **Texture-Liquide** : Soupes, bouillons, jus

#### Profils d'Intensité (4)
Pour règles d'**équilibre** :

- **Intensité-Léger** : Vapeur, poché, nature
- **Intensité-Moyen** : Sauté, grillé, rôti
- **Intensité-Riche** : Gras, crémeux, beurre, fromage, confit, frit
- **Intensité-Intense** : Fort, puissant, relevé, épicé

#### Familles Aromatiques (10)
Pour **Food Pairing** (gastronomie moléculaire) :

- **Arôme-Fruité** : Fraise, framboise, pomme, poire, fruits rouges
- **Arôme-Agrumes** : Citron, orange, pamplemousse, bergamote
- **Arôme-Floral** : Rose, violette, lavande, jasmin
- **Arôme-Végétal** : Herbes, vert, chlorophylle
- **Arôme-Terreux** : Champignon, truffe, betterave, sous-bois
- **Arôme-Marin** : Iodé, algue, coquillages, poisson
- **Arôme-Lacté** : Lait, crème, beurre, fromage frais
- **Arôme-Caramélisé** : Caramel, miel, torréfié, grillé
- **Arôme-Épicé Chaud** : Cannelle, clou de girofle, muscade
- **Arôme-Épicé Frais** : Menthe, basilic, coriandre, aneth

---

## 🧬 Règles d'Assemblage

### 1. Food Pairing (Gastronomie Moléculaire)

**Principe** : Ingrédients partageant des composés aromatiques → bon assemblage

**Exemples d'associations validées** :
- **Fraise + Basilic** → `Arôme-Fruité` + `Saveur-Herbacé`
- **Chocolat + Piment** → `Arôme-Caramélisé` + `Saveur-Épicé`
- **Tomate + Mozzarella** → `Arôme-Végétal` + `Arôme-Lacté`

**Implémentation** :
```sql
-- Trouver des accompagnements avec profils aromatiques compatibles
SELECT r2.name AS accompagnement
FROM recipes r1
JOIN recipe_tags rt1 ON r1.id = rt1.recipe_id
JOIN tags t1 ON rt1.tag_id = t1.id
JOIN recipe_tags rt2 ON rt2.tag_id = t1.id AND rt2.recipe_id != r1.id
JOIN recipes r2 ON rt2.recipe_id = r2.id
WHERE r1.name = 'Plat principal'
  AND t1.name LIKE 'Arôme-%'
  AND r2.role = 'ACCOMPAGNEMENT';
```

---

### 2. Règle d'Équilibre

**Principe** : Plat riche → Accompagnement léger/acide

**Associations recommandées** :

| Plat Principal | Accompagnement |
|----------------|----------------|
| `Intensité-Riche` | `Intensité-Léger` + `Saveur-Acide` |
| `Intensité-Intense` | `Intensité-Léger` |
| Gras, crémeux | Acide, herbacé |

**Exemples** :
- **Bœuf Bourguignon** (`Intensité-Riche`) → **Pommes vapeur** (`Intensité-Léger`)
- **Fondue savoyarde** (`Intensité-Riche` + `Arôme-Lacté`) → **Salade verte** (`Intensité-Léger` + `Saveur-Acide`)

**Implémentation** :
```sql
-- Trouver accompagnements équilibrants pour plat riche
SELECT r2.name
FROM recipes r1
JOIN recipe_tags rt1 ON r1.id = rt1.recipe_id
JOIN tags t1 ON rt1.tag_id = t1.id
WHERE r1.name = 'Bœuf bourguignon'
  AND t1.name = 'Intensité-Riche'
  
-- Chercher accompagnements avec Intensité-Léger OU Saveur-Acide
AND EXISTS (
  SELECT 1 FROM recipe_tags rt2
  JOIN tags t2 ON rt2.tag_id = t2.id
  JOIN recipes r2 ON rt2.recipe_id = r2.id
  WHERE t2.name IN ('Intensité-Léger', 'Saveur-Acide')
    AND r2.role = 'ACCOMPAGNEMENT'
);
```

---

### 3. Règle de Contraste

**Principe** : Contraste de texture pour expérience culinaire riche

**Associations recommandées** :

| Texture Principale | Texture Contraste |
|--------------------|-------------------|
| `Texture-Crémeux` | `Texture-Croquant` |
| `Texture-Moelleux` | `Texture-Ferme` |
| `Texture-Liquide` | `Texture-Croquant` |

**Exemples** :
- **Velouté de potimarron** (`Texture-Crémeux` + `Texture-Liquide`) → **Croûtons grillés** (`Texture-Croquant`)
- **Poisson vapeur** (`Texture-Moelleux`) → **Légumes al dente** (`Texture-Ferme`)

**Implémentation** :
```sql
-- Matrice de contraste
WITH texture_contrasts AS (
  SELECT 'Texture-Crémeux' AS base, 'Texture-Croquant' AS contrast
  UNION ALL SELECT 'Texture-Moelleux', 'Texture-Ferme'
  UNION ALL SELECT 'Texture-Liquide', 'Texture-Croquant'
)
SELECT r2.name AS suggestion
FROM recipes r1
JOIN recipe_tags rt1 ON r1.id = rt1.recipe_id
JOIN tags t1 ON rt1.tag_id = t1.id
JOIN texture_contrasts tc ON t1.name = tc.base
JOIN tags t2 ON t2.name = tc.contrast
JOIN recipe_tags rt2 ON rt2.tag_id = t2.id
JOIN recipes r2 ON rt2.recipe_id = r2.id
WHERE r1.name = 'Velouté de potimarron'
  AND r2.role IN ('ACCOMPAGNEMENT', 'ENTREE');
```

---

### 4. Règle du Terroir

**Principe** : Plats d'une région → Accompagnements de la même région

**Implémentation** :
```sql
-- Assemblage par cuisine commune
SELECT r2.name
FROM recipes r1
JOIN recipe_tags rt1 ON r1.id = rt1.recipe_id
JOIN tags t1 ON rt1.tag_id = t1.id
JOIN recipe_tags rt2 ON rt2.tag_id = t1.id AND rt2.recipe_id != r1.id
JOIN recipes r2 ON rt2.recipe_id = r2.id
WHERE r1.name = 'Osso Bucco'
  AND t1.name = 'Italienne'  -- Cuisine commune
  AND r2.role = 'ACCOMPAGNEMENT';
  
-- Résultat attendu : Risotto, Polenta, Pâtes fraîches
```

---

## 🎯 Algorithme de Suggestion d'Assemblage

### Étape 1 : Scoring Multi-Critères

Chaque paire plat principal ↔ accompagnement reçoit un score :

```python
def calculate_pairing_score(main_dish, side_dish):
    score = 0
    
    # 1. Food Pairing (30 points)
    common_aromatics = set(main.aromatic_tags) & set(side.aromatic_tags)
    score += len(common_aromatics) * 10
    
    # 2. Équilibre (25 points)
    if 'Intensité-Riche' in main.tags:
        if 'Intensité-Léger' in side.tags or 'Saveur-Acide' in side.tags:
            score += 25
    
    # 3. Contraste (20 points)
    texture_pairs = [
        ('Texture-Crémeux', 'Texture-Croquant'),
        ('Texture-Moelleux', 'Texture-Ferme'),
    ]
    for main_tex, side_tex in texture_pairs:
        if main_tex in main.tags and side_tex in side.tags:
            score += 20
    
    # 4. Terroir (15 points)
    common_cuisine = set(main.cuisine_tags) & set(side.cuisine_tags)
    score += len(common_cuisine) * 15
    
    # 5. Saison (10 points)
    common_season = set(main.season_tags) & set(side.season_tags)
    score += len(common_season) * 10
    
    return score
```

### Étape 2 : Filtrage

Appliquer des **filtres stricts** :
- Régime alimentaire utilisateur
- Allergies
- Ingrédients disponibles (inventaire)

### Étape 3 : Classement & Présentation

Trier par score décroissant et présenter top 5 avec explication :

```
🍽️ Bœuf Bourguignon (Intensité-Riche, Arôme-Terreux, Française)

Suggestions d'accompagnements :

1. ⭐ Pommes de terre vapeur (95/100)
   ✓ Équilibre : Léger pour contrebalancer le riche
   ✓ Terroir : Cuisine française classique
   ✓ Texture : Ferme pour contraster
   
2. ⭐ Tagliatelles fraîches (85/100)
   ✓ Équilibre : Neutre, absorbe la sauce
   ✓ Food Pairing : Arôme-Lacté compatible
   
3. ⭐ Gratin dauphinois (65/100)
   ⚠️ Attention : Tous deux riches, peut être lourd
   ✓ Terroir : Cuisine française régionale
```

---

## 📦 Utilisation dans l'Application

### API d'Assemblage

```javascript
// Endpoint : POST /api/recipes/suggest-pairing
{
  "mainDishId": 123,
  "filters": {
    "diet": "vegetarian",
    "season": "winter",
    "availableIngredients": [...]
  }
}

// Response
{
  "suggestions": [
    {
      "recipe": { id, name, description },
      "score": 95,
      "reasons": [
        { type: "balance", description: "Léger pour équilibrer" },
        { type: "terroir", description: "Même cuisine" }
      ]
    }
  ]
}
```

### Composant React

```jsx
function RecipePairingSuggestions({ recipeId }) {
  const { data } = usePairings(recipeId);
  
  return (
    <div className="pairing-suggestions">
      <h3>🍽️ Accompagnements suggérés</h3>
      {data.suggestions.map(s => (
        <PairingCard 
          recipe={s.recipe}
          score={s.score}
          reasons={s.reasons}
        />
      ))}
    </div>
  );
}
```

---

## 🚀 Prochaines Étapes

1. **Exécuter l'enrichissement** : `psql -f enrich_recipes_v3_complete.sql`
2. **Créer des vues SQL** pour assemblages fréquents
3. **Implémenter l'API** de suggestion
4. **Tester** avec vraies recettes
5. **Affiner** les scores avec feedback utilisateurs

---

## 📚 Références

- **Food Pairing** : https://www.foodpairing.com/
- **Gastronomie Moléculaire** : Hervé This
- **Règles Culinaires** : Auguste Escoffier, "Le Guide Culinaire"

---

**Date** : 19 octobre 2025  
**Version** : 3.0 - Système complet d'assemblage intelligent
