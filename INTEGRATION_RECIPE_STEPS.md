# ✅ Intégration recipe_steps - Instructions de Recette

## Modifications effectuées

La page de détail de recette ([app/recipes/[id]/page.js](app/recipes/[id]/page.js)) a été mise à jour pour utiliser la table **`recipe_steps`** au lieu du champ texte `instructions` de la table `recipes`.

### 🔧 Changements techniques

#### 1. Ajout du state `recipeSteps`
```javascript
const [recipeSteps, setRecipeSteps] = useState([]);
```

#### 2. Chargement des étapes depuis la base de données
Les étapes sont maintenant chargées depuis la table `recipe_steps`:
```javascript
const { data: steps } = await supabase
  .from('recipe_steps')
  .select('*')
  .eq('recipe_id', id)
  .order('step_no', { ascending: true });
```

#### 3. Affichage amélioré des instructions
- Numérotation automatique avec badges circulaires
- Affichage de la durée (⏱️) si disponible
- Affichage de la température (🌡️) si disponible
- Design modernisé et épuré

#### 4. Édition mise à jour
- Chargement des étapes depuis `recipe_steps` au lieu de parser le texte
- Ajout des champs température et unité de température
- Sauvegarde directe dans `recipe_steps` au lieu du champ texte

### 📊 Structure de recipe_steps

Les champs utilisés:
- `recipe_id`: ID de la recette
- `step_no`: Numéro de l'étape (ordre)
- `description`: Texte de l'étape
- `duration`: Durée en minutes (optionnel)
- `temperature`: Température (optionnel)
- `temperature_unit`: Unité de température (°C ou °F)
- `type`: Type d'étape (preparation, cooking, resting, assembly)

## 🧪 Comment tester

### Test 1: Vérifier l'affichage
1. Démarrer le serveur: `npm run dev`
2. Ouvrir une recette: `http://localhost:3000/recipes/9401`
3. Vérifier que les instructions s'affichent avec:
   - Numéros d'étapes dans des badges circulaires verts
   - Texte de description pour chaque étape
   - Durée et température si disponibles

### Test 2: Vérifier qu'il y a des données
Vérifiez dans la base de données:
```sql
SELECT recipe_id, step_no, description
FROM recipe_steps
WHERE recipe_id = 9401
ORDER BY step_no;
```

Si la table est vide, les instructions n'apparaîtront pas (c'est normal si les recettes ont été importées sans étapes).

### Test 3: Éditer une recette
1. Cliquer sur "📝 Modifier la recette"
2. Aller dans l'onglet "📋 Instructions"
3. Ajouter ou modifier des étapes
4. Sauvegarder
5. Vérifier que les étapes s'affichent correctement

## 🔄 Migration des données existantes

Si vos recettes ont des instructions dans le champ `instructions` de la table `recipes`, vous pouvez les migrer vers `recipe_steps` avec ce script SQL:

```sql
-- Script de migration instructions → recipe_steps
INSERT INTO recipe_steps (recipe_id, step_no, description, created_at)
SELECT
  r.id as recipe_id,
  ROW_NUMBER() OVER (PARTITION BY r.id ORDER BY r.id) as step_no,
  TRIM(UNNEST(string_to_array(r.instructions, E'\n\n'))) as description,
  NOW() as created_at
FROM recipes r
WHERE r.instructions IS NOT NULL
  AND r.instructions != ''
  AND NOT EXISTS (
    SELECT 1 FROM recipe_steps rs WHERE rs.recipe_id = r.id
  );
```

Ce script:
- Prend les instructions textuelles de la table `recipes`
- Les divise en étapes (séparées par double saut de ligne)
- Crée les entrées correspondantes dans `recipe_steps`
- Ne touche pas aux recettes qui ont déjà des étapes

## 📝 Exemple d'étapes pour la Salade niçoise

Si vous voulez ajouter des étapes pour la Salade niçoise (ID: 9401):

```sql
INSERT INTO recipe_steps (recipe_id, step_no, description, duration, type) VALUES
(9401, 1, 'Préparer les légumes : Laver la salade verte et bien l''égoutter. Couper les tomates en quartiers. Trancher finement les poivrons verts et les oignons rouges.', 10, 'preparation'),
(9401, 2, 'Cuire les œufs durs : Porter de l''eau à ébullition, y plonger les œufs et cuire 10 minutes. Rafraîchir sous l''eau froide puis écaler et couper en quartiers.', 10, 'cooking'),
(9401, 3, 'Préparer les pommes de terre : Cuire les pommes de terre à l''eau salée pendant 15-20 minutes jusqu''à ce qu''elles soient tendres. Laisser refroidir puis couper en rondelles.', 20, 'cooking'),
(9401, 4, 'Assembler la salade : Dans un grand saladier, disposer la salade verte comme base. Ajouter les tomates, les poivrons, les oignons rouges, les pommes de terre et les haricots verts cuits.', 5, 'assembly'),
(9401, 5, 'Ajouter le thon et les anchois : Émietter le thon au-dessus de la salade. Disposer les filets d''anchois. Ajouter les olives noires de Nice.', 3, 'assembly'),
(9401, 6, 'Disposer les œufs : Disposer harmonieusement les quartiers d''œufs durs sur le dessus de la salade.', 2, 'assembly'),
(9401, 7, 'Assaisonner : Arroser d''huile d''olive, de vinaigre de vin, saler et poivrer. Parsemer de basilic frais ciselé.', 2, 'preparation'),
(9401, 8, 'Servir : Servir immédiatement ou laisser reposer 10 minutes au frais pour que les saveurs se mélangent.', 10, 'resting');
```

## ✨ Résultat

Après ces modifications:
- ✅ Les instructions sont chargées depuis `recipe_steps`
- ✅ L'affichage est structuré et élégant
- ✅ L'édition permet de gérer les étapes individuellement
- ✅ Les informations complémentaires (durée, température) sont supportées
- ✅ La sauvegarde met à jour correctement `recipe_steps`

## 🐛 Dépannage

### Les instructions ne s'affichent pas
- Vérifiez que la table `recipe_steps` contient des données pour la recette
- Vérifiez les logs de la console du navigateur
- Essayez d'ajouter des étapes via l'interface d'édition

### Erreur lors de la sauvegarde
- Vérifiez que la table `recipe_steps` existe
- Vérifiez les permissions Supabase sur cette table
- Regardez les erreurs détaillées dans la console du navigateur

## 📚 Fichiers modifiés

- [app/recipes/[id]/page.js](app/recipes/[id]/page.js) - Page de détail de recette (lecture et édition)
