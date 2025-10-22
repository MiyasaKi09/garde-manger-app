# 🍳 Guide d'import des 600 recettes dans Supabase

## 📊 Résumé de l'avancement

✅ **Complété :**
- Connexion à Supabase établie
- Analyse de la structure de la base de données
- Script Python de parsing créé (`tools/import_recipes.py`)
- Fichier SQL complet généré (`tools/import_recipes.sql`)
- Vérification : **600 recettes valides** dans le fichier batch
- Test réussi : import de 10 recettes via pgsql_modify

## 📁 Fichiers générés

1. **`tools/import_recipes.py`** - Script Python principal
   - Parse le fichier `supabase/batch pour recette.txt`
   - Détecte automatiquement les cuisines, régimes, méthodes de cuisson
   - Génère des descriptions, temps de préparation, portions
   
2. **`tools/import_recipes.sql`** - Script SQL complet (2704 lignes)
   - 600 recettes à insérer
   - Tags automatiques (cuisines, régimes)
   - Instructions de base
   - Associations recipe_tags

3. **`tools/verify_recipes.py`** - Script de vérification
   - Confirme 600 recettes valides

## 🎯 Méthodes d'import disponibles

### Méthode 1 : Via l'interface PostgreSQL de VS Code (RECOMMANDÉ)

```bash
# 1. Ouvrir le fichier SQL
code tools/import_recipes.sql

# 2. Dans VS Code :
#    - Connectez-vous à votre base Supabase
#    - Sélectionnez tout le contenu (Ctrl+A)
#    - Exécutez le script (clic droit → "Execute Query")
```

### Méthode 2 : Via psql (ligne de commande)

```bash
# Assurez-vous que DATABASE_URL_TX est défini
source .env.local

# Exécuter le script
psql "$DATABASE_URL_TX" -f tools/import_recipes.sql
```

### Méthode 3 : Via l'interface Supabase

1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. SQL Editor
4. Copiez/collez le contenu de `tools/import_recipes.sql`
5. Exécutez

## 📈 Statistiques prévues

**Recettes par type :**
- Plats principaux : ~427
- Accompagnements : ~49
- Entrées : ~60
- Desserts : ~66

**Total : 602 recettes** (incluant 2 déjà présentes)

## 🏷️ Tags automatiques

Le script détecte et applique automatiquement :

**Cuisines :**
- Française (bourguignon, dauphinois, niçois, etc.)
- Italienne (pâtes, risotto, pizza, etc.)
- Espagnole (paella, tapas, gazpacho, etc.)
- Asiatique, Chinoise, Japonaise, Thaïlandaise
- Indienne (curry, masala, naan, etc.)
- Mexicaine (tacos, chili, guacamole, etc.)
- Orientale (tajine, couscous, houmous, etc.)
- Américaine (burger, barbecue, cheesecake, etc.)

**Régimes :**
- Végétarien (détection automatique)
- Vegan (tofu, seitan, tempeh)

**Méthodes de cuisson :**
- Cuisson au four
- Poêle / Sauté
- Mijotage
- Vapeur
- Grill/Barbecue
- Friture
- Sans cuisson

## 🔧 Structure de données

Chaque recette contient :
```sql
- name: Nom de la recette
- description: Description générée automatiquement
- prep_time_minutes: Temps de préparation (10-25 min)
- cook_time_minutes: Temps de cuisson (0-120 min)
- servings: Nombre de portions (2-8)
- cooking_method: Méthode de cuisson
- role: PLAT_PRINCIPAL | ACCOMPAGNEMENT | ENTREE | DESSERT
- is_scalable_to_main: true pour accompagnements
```

## ⚠️ Points d'attention

1. **Transaction BEGIN/COMMIT** : Le script utilise une transaction pour garantir l'atomicité
2. **RETURNING id** : Les IDs des recettes sont générés automatiquement
3. **ON CONFLICT DO NOTHING** : Évite les doublons de tags
4. **Tri des IDs** : Les recipe_tags utilisent les IDs générés

## 🚀 Prochaines étapes

Après l'import, vous pourrez :

1. **Ajouter des ingrédients** aux recettes
   - Via la table `recipe_ingredients`
   - Lien avec `canonical_foods` ou `archetypes`

2. **Compléter les instructions**
   - Actuellement 3 étapes génériques par recette
   - À enrichir manuellement ou via API

3. **Ajouter des images**
   - URLs d'images de recettes
   - Via Supabase Storage

4. **Créer des pairings**
   - Table `recipe_pairings`
   - Suggestions d'accompagnements

## 📝 Commandes utiles après l'import

```sql
-- Vérifier le nombre de recettes
SELECT COUNT(*) FROM recipes;

-- Recettes par cuisine
SELECT t.name, COUNT(*) 
FROM recipes r
JOIN recipe_tags rt ON r.id = rt.recipe_id
JOIN tags t ON rt.tag_id = t.id
WHERE t.name LIKE 'cuisine:%'
GROUP BY t.name
ORDER BY COUNT(*) DESC;

-- Recettes par rôle
SELECT role, COUNT(*) 
FROM recipes 
GROUP BY role;

-- Recettes les plus rapides
SELECT name, prep_time_minutes + cook_time_minutes as total_time
FROM recipes
ORDER BY total_time ASC
LIMIT 10;
```

## 🎉 Félicitations !

Une fois l'import terminé, vous aurez une base de données riche avec 600+ recettes prêtes à être utilisées dans votre application garde-manger !

---

**Créé le** : {{ current_date }}  
**Auteur** : GitHub Copilot  
**Version** : 1.0
