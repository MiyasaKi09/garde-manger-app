# 🔧 Correction des Instructions - Salade Niçoise

## Problème identifié

La recette "Salade niçoise" (ID: 9401) **n'affiche pas d'instructions** sur la fiche recette.

### Cause
La table `recipes` possède bien une colonne `instructions`, mais cette recette a été importée **sans instructions** - le champ est NULL ou vide en base de données.

## Solution rapide 🚀

### Option 1: Via l'interface web (RECOMMANDÉ)

1. **Démarrez le serveur de développement** (si ce n'est pas déjà fait):
   ```bash
   npm run dev
   ```

2. **Ouvrez votre navigateur** et allez sur:
   ```
   http://localhost:3000/admin/fix-salade-nicoise
   ```

3. **Cliquez sur le bouton** "✨ Corriger les instructions"

4. **Vérifiez le résultat** en visitant:
   ```
   http://localhost:3000/recipes/9401
   ```

### Option 2: Via l'API directement

Si vous préférez utiliser curl ou un client HTTP:

```bash
curl -X POST http://localhost:3000/api/admin/fix-salade-nicoise
```

### Option 3: Via SQL (si vous avez accès direct à la base de données)

Exécutez le fichier SQL créé:

```bash
psql "$DATABASE_URL" -f fix-salade-nicoise-instructions.sql
```

## Instructions qui seront ajoutées

Les 8 étapes détaillées suivantes seront ajoutées:

1. Préparation des légumes (salade, tomates, poivrons, oignons)
2. Cuisson des œufs durs
3. Préparation des pommes de terre
4. Assemblage de la salade
5. Ajout du thon et des anchois
6. Disposition des œufs
7. Assaisonnement (huile d'olive, vinaigre, sel, poivre, basilic)
8. Service

## Fichiers créés

- ✅ [app/api/admin/fix-salade-nicoise/route.js](app/api/admin/fix-salade-nicoise/route.js) - Endpoint API
- ✅ [app/admin/fix-salade-nicoise/page.js](app/admin/fix-salade-nicoise/page.js) - Interface web
- ✅ [fix-salade-nicoise-instructions.sql](fix-salade-nicoise-instructions.sql) - Script SQL
- ✅ [fix-salade-nicoise.js](fix-salade-nicoise.js) - Script Node.js (nécessite Node 20+)

## Vérification après correction

Après avoir exécuté la correction, vérifiez que:

1. ✅ La page [/recipes/9401](http://localhost:3000/recipes/9401) affiche les instructions
2. ✅ La section "Instructions" contient 8 étapes numérotées
3. ✅ Les instructions sont complètes et lisibles

## Pour corriger d'autres recettes

Le même problème peut affecter d'autres recettes importées. Vous pouvez:

1. Vérifier quelles recettes n'ont pas d'instructions:
   ```sql
   SELECT id, name
   FROM recipes
   WHERE instructions IS NULL OR instructions = ''
   ORDER BY id;
   ```

2. Adapter le script pour d'autres recettes en modifiant l'ID et les instructions

## Notes techniques

- Le champ `instructions` accepte du texte long (TEXT)
- Les instructions sont numérotées et séparées par des doubles sauts de ligne
- Le champ `updated_at` est automatiquement mis à jour
- Le code de la page de recette ([app/recipes/[id]/page.js:1163](app/recipes/[id]/page.js#L1163)) affiche automatiquement les instructions si elles existent
