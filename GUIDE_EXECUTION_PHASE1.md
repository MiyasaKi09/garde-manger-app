# Guide d'Exécution - Phase 1 : DLC après Ouverture

## ✅ Pré-requis

- Accès au dashboard Supabase de votre projet
- Ou Supabase CLI installé et configuré
- Connexion au projet garde-manger-app

---

## Méthode 1 : Via Dashboard Supabase (Recommandé)

### Étape 1 : Ouvrir le SQL Editor

1. Connectez-vous à [https://supabase.com](https://supabase.com)
2. Sélectionnez votre projet **garde-manger-app**
3. Dans le menu latéral, cliquez sur **SQL Editor**

### Étape 2 : Copier la migration

1. Ouvrez le fichier `supabase/migrations/001_shelf_life_after_opening.sql`
2. Copiez **tout le contenu** (Ctrl+A puis Ctrl+C)

### Étape 3 : Exécuter la migration

1. Dans le SQL Editor, cliquez sur **New Query**
2. Collez le contenu de la migration (Ctrl+V)
3. Cliquez sur **Run** (ou F5)

### Étape 4 : Vérifier l'exécution

Vous devriez voir :

```
✅ ALTER TABLE
✅ CREATE INDEX (2x)
✅ CREATE FUNCTION
✅ CREATE TRIGGER
✅ CREATE VIEW
```

Si vous voyez des erreurs, lisez la section **Dépannage** ci-dessous.

### Étape 5 : Vérifier les colonnes

Exécutez cette requête pour confirmer :

```sql
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory_lots' 
  AND column_name IN ('is_opened', 'opened_at', 'adjusted_expiration_date')
ORDER BY column_name;
```

**Résultat attendu :**
```
| column_name              | data_type                   | is_nullable |
|--------------------------|----------------------------|-------------|
| adjusted_expiration_date | date                       | YES         |
| is_opened                | boolean                    | YES         |
| opened_at                | timestamp with time zone   | YES         |
```

### Étape 6 : Vérifier la vue

```sql
SELECT * FROM inventory_lots_with_effective_dlc LIMIT 5;
```

Vous devriez voir vos lots existants avec une colonne `effective_expiration_date` qui vaut :
- `adjusted_expiration_date` si le produit est ouvert
- `expiration_date` sinon

---

## Méthode 2 : Via Supabase CLI

### Étape 1 : Vérifier que vous êtes connecté

```bash
supabase status
```

Vous devriez voir votre projet connecté.

### Étape 2 : Appliquer la migration

```bash
supabase db push
```

Cela va détecter la nouvelle migration et l'appliquer.

### Étape 3 : Vérifier

```bash
supabase db diff
```

Si tout est bon, vous ne devriez voir **aucune différence**.

---

## Test de la Fonctionnalité

### Test 1 : Créer un produit de test (via SQL)

```sql
INSERT INTO inventory_lots (
  user_id, 
  product_type, 
  product_id, 
  qty_remaining, 
  unit, 
  storage_place, 
  expiration_date
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Prend le premier user
  'canonical',
  (SELECT id FROM canonical_foods WHERE canonical_name ILIKE '%lait%' LIMIT 1),
  1,
  'L',
  'fridge',
  CURRENT_DATE + INTERVAL '10 days'
) RETURNING *;
```

### Test 2 : Ouvrir le produit via l'API

1. Lancez l'application : `npm run dev`
2. Connectez-vous à votre compte
3. Allez sur `/pantry`
4. Trouvez le produit "Lait"
5. Cliquez sur **"📦 Ouvrir"**

### Test 3 : Vérifier en base

```sql
SELECT 
  id,
  user_id,
  product_type,
  qty_remaining,
  unit,
  storage_place,
  is_opened,
  opened_at,
  expiration_date,
  adjusted_expiration_date,
  COALESCE(adjusted_expiration_date, expiration_date) AS effective_dlc
FROM inventory_lots
WHERE is_opened = TRUE;
```

**Vous devriez voir :**
- `is_opened = true`
- `opened_at = [timestamp actuel]`
- `adjusted_expiration_date = [aujourd'hui + 3 jours]`
- `effective_dlc = adjusted_expiration_date`

### Test 4 : Vérifier l'UI

Sur la carte du produit, vous devriez voir :

1. **Badge vert** : "✅ Ouvert le 22/05/2024"
2. **DLC originale** : "30/05/2024"
3. **DLC ajustée** (en orange) : "→ 25/05/2024"
4. **Bouton "Ouvrir" a disparu** (déjà ouvert)

---

## Dépannage

### Erreur : "column already exists"

**Cause** : La migration a déjà été exécutée.

**Solution** :
1. Vérifiez si les colonnes existent :
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'inventory_lots' 
     AND column_name = 'is_opened';
   ```
2. Si elles existent, **ignorez l'erreur**, tout est déjà en place.

### Erreur : "relation does not exist"

**Cause** : La table `inventory_lots` n'existe pas ou a un nom différent.

**Solution** :
1. Listez les tables :
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
2. Vérifiez que `inventory_lots` existe.
3. Si elle a un nom différent, modifiez la migration.

### Erreur : "permission denied"

**Cause** : Votre utilisateur Supabase n'a pas les droits nécessaires.

**Solution** :
1. Utilisez le **service_role key** au lieu de l'**anon key**
2. Ou exécutez la migration via le **Dashboard** (plus sûr)

### Le bouton "Ouvrir" ne s'affiche pas

**Vérifications** :

1. **Migration exécutée ?**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'inventory_lots' AND column_name = 'is_opened';
   ```
   ✅ Doit retourner une ligne

2. **Produit déjà ouvert ?**
   ```sql
   SELECT id, is_opened FROM inventory_lots WHERE id = [VOTRE_LOT_ID];
   ```
   ✅ Si `is_opened = true`, c'est normal

3. **Prop onOpen passé ?**
   Ouvrez `app/pantry/page.js` et vérifiez ligne ~620 :
   ```jsx
   <ProductCard 
     ...
     onOpen={() => handleOpen(item.id)} // ← Doit être présent
   />
   ```

4. **CSS chargé ?**
   Inspectez l'élément dans DevTools, cherchez `.action-btn.open`

### La DLC ajustée est null

**Causes possibles** :

1. **Catégorie incompatible avec le stockage**
   - Ex : Soda au congélateur → `freezer: null` dans les règles
   - **Solution** : C'est normal, le produit ne se congèle pas bien

2. **Catégorie non reconnue**
   ```javascript
   // Dans lotManagementService.js, ajoutez un log :
   console.log('Catégorie inférée:', inferCategory(productName, canonicalCategory));
   ```
   - Si retourne `"_default"`, la catégorie n'a pas été détectée
   - **Solution** : Ajoutez la catégorie dans `shelfLifeRules.js`

3. **DLC originale null**
   - Si `expiration_date` est `null`, `adjusted_expiration_date` sera aussi `null`
   - **Solution** : Ajoutez une DLC originale au produit

### Erreur 401 lors de l'ouverture

**Cause** : Utilisateur non authentifié ou session expirée.

**Solution** :
1. Déconnectez-vous et reconnectez-vous
2. Vérifiez dans la console :
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User:', user);
   ```
3. Si `user` est `null`, le problème vient de l'authentification

---

## Rollback (Annuler la migration)

Si vous devez annuler la migration :

```sql
-- Supprimer la vue
DROP VIEW IF EXISTS inventory_lots_with_effective_dlc;

-- Supprimer le trigger
DROP TRIGGER IF EXISTS check_adjusted_expiration ON inventory_lots;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS validate_adjusted_expiration();

-- Supprimer les index
DROP INDEX IF EXISTS idx_inventory_lots_adjusted_exp;
DROP INDEX IF EXISTS idx_inventory_lots_is_opened;

-- Supprimer les colonnes
ALTER TABLE inventory_lots
  DROP COLUMN IF EXISTS adjusted_expiration_date,
  DROP COLUMN IF EXISTS is_opened,
  DROP COLUMN IF EXISTS opened_at;
```

⚠️ **Attention** : Cela supprimera **toutes les données** d'ouverture des produits !

---

## Prochaines Étapes

Une fois la Phase 1 testée et validée :

1. ✅ Tester l'ouverture de plusieurs produits de catégories différentes
2. ✅ Vérifier que les règles de DLC sont correctes (ex: Lait = 3j, Yaourt = 5j)
3. ✅ Tester le changement de stockage (frigo → congélateur)
4. 🚀 Passer à la **Phase 2** : Plats cuisinés
5. 🚀 Passer à la **Phase 3** : Planning intelligent

---

## Support

Si vous rencontrez des problèmes :

1. Consultez `PHASE1_DLC_OUVERTURE_COMPLETE.md` (documentation complète)
2. Vérifiez les logs de l'API dans la console DevTools (F12)
3. Vérifiez les logs Supabase dans le Dashboard → Logs
4. Vérifiez que tous les fichiers ont été créés/modifiés correctement

---

**Bonne chance ! 🚀**
