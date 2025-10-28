# 🧪 GUIDE DE TEST - PHASE 2 : PLATS CUISINÉS

## 📋 Prérequis

Avant de commencer les tests, vérifier :

- ✅ Phase 1 appliquée et fonctionnelle
- ✅ Serveur de dev Next.js lancé (`npm run dev`)
- ✅ Connexion Supabase active
- ✅ Au moins quelques produits dans l'inventaire

---

## 🗄️ ÉTAPE 1 : Appliquer la migration SQL

### 1.1 Vérifier que la migration n'a pas déjà été appliquée

```bash
# Se connecter à la console Supabase
# Aller dans SQL Editor et exécuter :
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'cooked_dishes'
);
```

**Résultat attendu :**
- `false` = Table n'existe pas → Appliquer la migration
- `true` = Table existe déjà → Migration déjà appliquée ✅

### 1.2 Appliquer la migration

**Méthode 1 : Via Supabase Dashboard (Recommandé)**

1. Ouvrir Supabase Dashboard → SQL Editor
2. Créer une nouvelle query
3. Copier tout le contenu de `supabase/migrations/002_cooked_dishes.sql`
4. Exécuter ▶️

**Méthode 2 : Via CLI Supabase**

```bash
supabase db push
```

### 1.3 Vérifier que la migration a réussi

```sql
-- Tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cooked_dishes', 'cooked_dish_ingredients');

-- Devrait retourner 2 lignes :
-- cooked_dishes
-- cooked_dish_ingredients

-- Vues créées
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'cooked_dishes%';

-- Devrait retourner 2 lignes :
-- cooked_dishes_active
-- cooked_dishes_stats

-- Vérifier les triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('cooked_dishes');

-- Devrait afficher :
-- update_cooked_dishes_updated_at (BEFORE UPDATE)
-- mark_cooked_dish_consumed (BEFORE UPDATE)
```

---

## 🧪 ÉTAPE 2 : Tests API Backend

### 2.1 Préparer les données de test

**Vérifier que vous avez des produits dans l'inventaire :**

```sql
-- Voir les lots disponibles
SELECT 
  id,
  product_name,
  quantity_value,
  quantity_unit,
  location
FROM inventory_lots
WHERE user_id = 'VOTRE_USER_ID'
AND consumed_at IS NULL
LIMIT 10;
```

**Si vous n'avez pas de produits, en créer quelques-uns :**

```sql
-- Exemple : Ajouter des ingrédients pour une lasagne
INSERT INTO inventory_lots (
  user_id,
  product_id,
  product_name,
  quantity_value,
  quantity_unit,
  location,
  purchase_date,
  expiration_date
) VALUES
('VOTRE_USER_ID', gen_random_uuid(), 'Pâtes à lasagne', 500, 'g', 'pantry', CURRENT_DATE, CURRENT_DATE + 180),
('VOTRE_USER_ID', gen_random_uuid(), 'Sauce tomate', 400, 'g', 'fridge', CURRENT_DATE, CURRENT_DATE + 30),
('VOTRE_USER_ID', gen_random_uuid(), 'Viande hachée', 500, 'g', 'fridge', CURRENT_DATE, CURRENT_DATE + 3),
('VOTRE_USER_ID', gen_random_uuid(), 'Fromage râpé', 200, 'g', 'fridge', CURRENT_DATE, CURRENT_DATE + 20);
```

### 2.2 Test 1 : Créer un plat cuisiné

**Méthode : Via curl ou Postman**

```bash
# Remplacer YOUR_AUTH_TOKEN par votre token Supabase
curl -X POST http://localhost:3000/api/cooked-dishes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "name": "Lasagnes maison",
    "portionsCooked": 4,
    "storageMethod": "fridge",
    "notes": "Préparées ce midi",
    "ingredients": [
      {
        "lotId": "ID_LOT_PATES",
        "quantityUsed": 250,
        "unit": "g"
      },
      {
        "lotId": "ID_LOT_SAUCE",
        "quantityUsed": 400,
        "unit": "g"
      },
      {
        "lotId": "ID_LOT_VIANDE",
        "quantityUsed": 500,
        "unit": "g"
      },
      {
        "lotId": "ID_LOT_FROMAGE",
        "quantityUsed": 100,
        "unit": "g"
      }
    ]
  }'
```

**Résultat attendu :**

```json
{
  "success": true,
  "dish": {
    "id": "uuid-du-plat",
    "name": "Lasagnes maison",
    "portions_cooked": 4,
    "portions_remaining": 4,
    "storage_method": "fridge",
    "cooked_at": "2025-10-27T...",
    "expiration_date": "2025-10-30T...",  // 3 jours plus tard
    "notes": "Préparées ce midi"
  }
}
```

**Vérifications :**

1. ✅ Le plat a été créé
2. ✅ DLC = cooked_at + 3 jours (stockage frigo)
3. ✅ portions_remaining = portions_cooked = 4

**Vérifier la déduction des ingrédients :**

```sql
SELECT 
  product_name,
  quantity_value,
  quantity_unit,
  quantity_value_before_deduction
FROM inventory_lots
WHERE id IN ('ID_LOT_PATES', 'ID_LOT_SAUCE', 'ID_LOT_VIANDE', 'ID_LOT_FROMAGE');
```

**Résultat attendu :**
- Pâtes : 500g → 250g (déduction de 250g)
- Sauce : 400g → 0g (déduction de 400g, lot consommé)
- Viande : 500g → 0g (déduction de 500g, lot consommé)
- Fromage : 200g → 100g (déduction de 100g)

### 2.3 Test 2 : Lister les plats

```bash
curl http://localhost:3000/api/cooked-dishes \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Résultat attendu :**

```json
{
  "dishes": [
    {
      "id": "uuid",
      "name": "Lasagnes maison",
      "portions_cooked": 4,
      "portions_remaining": 4,
      "storage_method": "fridge",
      "expiration_date": "2025-10-30T...",
      ...
    }
  ]
}
```

**Test avec filtre "expirant dans 3 jours" :**

```bash
curl "http://localhost:3000/api/cooked-dishes?expiringInDays=3" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 2.4 Test 3 : Consommer des portions

```bash
curl -X POST http://localhost:3000/api/cooked-dishes/ID_DU_PLAT/consume \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "portions": 2
  }'
```

**Résultat attendu :**

```json
{
  "success": true,
  "dish": {
    "id": "uuid",
    "portions_remaining": 2  // 4 - 2 = 2
  }
}
```

**Vérifier dans la base :**

```sql
SELECT 
  name,
  portions_cooked,
  portions_remaining,
  consumed_completely_at
FROM cooked_dishes
WHERE id = 'ID_DU_PLAT';
```

**Résultat attendu :**
- portions_cooked: 4
- portions_remaining: 2
- consumed_completely_at: NULL (pas encore fini)

**Test : Consommer toutes les portions restantes**

```bash
curl -X POST http://localhost:3000/api/cooked-dishes/ID_DU_PLAT/consume \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "portions": 2
  }'
```

**Vérifier :**

```sql
SELECT 
  portions_remaining,
  consumed_completely_at
FROM cooked_dishes
WHERE id = 'ID_DU_PLAT';
```

**Résultat attendu :**
- portions_remaining: 0
- consumed_completely_at: timestamp actuel ✅ (trigger automatique)

### 2.5 Test 4 : Congeler/Décongeler

**Créer un nouveau plat pour ce test :**

```bash
curl -X POST http://localhost:3000/api/cooked-dishes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "name": "Ragoût de bœuf",
    "portionsCooked": 6,
    "storageMethod": "fridge",
    "ingredients": []
  }'
```

**Noter l'expiration_date (devrait être dans 3 jours)**

**Congeler le plat :**

```bash
curl -X POST http://localhost:3000/api/cooked-dishes/ID_DU_PLAT/storage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "storageMethod": "freezer"
  }'
```

**Résultat attendu :**

```json
{
  "success": true,
  "dish": {
    "storage_method": "freezer",
    "expiration_date": "2026-01-25T..."  // 90 jours plus tard
  }
}
```

**Vérifications :**

1. ✅ storage_method changé de "fridge" → "freezer"
2. ✅ expiration_date recalculée : +90 jours au lieu de +3 jours

**Décongeler :**

```bash
curl -X POST http://localhost:3000/api/cooked-dishes/ID_DU_PLAT/storage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "storageMethod": "fridge"
  }'
```

**Résultat attendu :**
- storage_method: "fridge"
- expiration_date: recalculée à +3 jours depuis maintenant

### 2.6 Test 5 : Supprimer un plat

```bash
curl -X DELETE http://localhost:3000/api/cooked-dishes/ID_DU_PLAT \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Résultat attendu :**

```json
{
  "success": true
}
```

**Vérifier suppression en cascade :**

```sql
-- Le plat est supprimé
SELECT * FROM cooked_dishes WHERE id = 'ID_DU_PLAT';
-- Résultat : 0 rows

-- Les ingrédients associés sont aussi supprimés (CASCADE)
SELECT * FROM cooked_dish_ingredients WHERE dish_id = 'ID_DU_PLAT';
-- Résultat : 0 rows
```

---

## 🎨 ÉTAPE 3 : Tests UI

### 3.1 Lancer le serveur de développement

```bash
npm run dev
```

### 3.2 Se connecter à l'application

1. Ouvrir http://localhost:3000
2. Se connecter avec votre compte
3. Aller dans **Garde-Manger** → Onglet **À Risque**

### 3.3 Vérifier l'affichage des plats

**Vous devriez voir :**

1. **Section "🥫 Ingrédients à Risque"**
   - Liste des ingrédients qui expirent bientôt

2. **Section "🍽️ Plats Cuisinés"** (nouvelle)
   - Cartes des plats créés
   - Filtres : "Tous" / "⚠️ À finir (3j)"
   - Pour chaque plat :
     - Nom + image (ou placeholder 🍽️)
     - Badge d'urgence (couleur selon jours restants)
     - Portions restantes avec barre de progression
     - Icône de stockage (❄️ frigo, 🧊 congélo, 🏠 comptoir)
     - Date de préparation et DLC
     - Boutons : "🍴 Manger", "❄️ Congeler" / "🔥 Décongeler", "🗑️"

### 3.4 Tests interactifs dans l'UI

**Test 1 : Consommer une portion**

1. Cliquer sur "🍴 Manger" sur un plat
2. ✅ Vérifier que portions_remaining décrémente
3. ✅ Vérifier que la barre de progression se met à jour
4. ✅ Si portions = 0, la carte devrait disparaître ou afficher "Entièrement consommé"

**Test 2 : Congeler un plat**

1. Cliquer sur "❄️ Congeler" sur un plat en mode "fridge"
2. ✅ Vérifier que l'icône passe de ❄️ à 🧊
3. ✅ Vérifier que la DLC affichée change (devrait être dans ~90 jours)
4. ✅ Vérifier que le badge d'urgence passe à "good" (vert)

**Test 3 : Décongeler un plat**

1. Cliquer sur "🔥 Décongeler" sur le plat congelé
2. ✅ Vérifier que l'icône repasse à ❄️
3. ✅ Vérifier que la DLC se recalcule (dans 3 jours)

**Test 4 : Supprimer un plat**

1. Cliquer sur "🗑️" sur un plat
2. ✅ Devrait afficher une confirmation
3. ✅ Une fois confirmé, la carte disparaît
4. ✅ Le compte de plats se met à jour

**Test 5 : Filtres**

1. Créer plusieurs plats avec des DLC différentes
2. Cliquer sur "⚠️ À finir (3j)"
3. ✅ Ne devrait afficher que les plats expirant dans les 3 prochains jours
4. Cliquer sur "Tous"
5. ✅ Tous les plats réapparaissent

### 3.5 Tests des états d'urgence

**Vérifier les couleurs de badge selon DLC :**

- **Vert (good)** : > 5 jours restants
- **Orange (warning)** : 3-5 jours restants
- **Rouge (urgent)** avec animation pulse : 1-2 jours restants
- **Rouge foncé (expired)** : Expiré (≤ 0 jours)

**Pour tester, modifier manuellement dans la DB :**

```sql
-- Plat qui expire demain (urgent)
UPDATE cooked_dishes 
SET expiration_date = CURRENT_DATE + 1
WHERE id = 'ID_PLAT';

-- Plat expiré hier
UPDATE cooked_dishes 
SET expiration_date = CURRENT_DATE - 1
WHERE id = 'ID_PLAT';
```

Rafraîchir la page et vérifier les couleurs.

---

## 📊 ÉTAPE 4 : Tests des vues SQL

### 4.1 Vue cooked_dishes_active

```sql
-- Devrait lister uniquement les plats avec portions > 0
SELECT * FROM cooked_dishes_active;
```

### 4.2 Vue cooked_dishes_stats

```sql
-- Statistiques par utilisateur
SELECT * FROM cooked_dishes_stats 
WHERE user_id = 'VOTRE_USER_ID';
```

**Devrait retourner :**
- total_dishes: nombre total de plats créés
- active_dishes: plats avec portions > 0
- consumed_dishes: plats avec portions = 0
- total_portions_cooked: somme de toutes les portions préparées
- total_portions_remaining: somme des portions restantes

---

## ✅ CHECKLIST COMPLÈTE

### Backend ✅

- [ ] Migration appliquée sans erreur
- [ ] Tables créées (cooked_dishes, cooked_dish_ingredients)
- [ ] Vues créées (active, stats)
- [ ] Triggers fonctionnent (updated_at, consumed_completely_at)
- [ ] POST /api/cooked-dishes → Créer plat ✅
- [ ] Déduction automatique des ingrédients ✅
- [ ] GET /api/cooked-dishes → Lister plats ✅
- [ ] POST /consume → Consommer portions ✅
- [ ] POST /storage → Changer stockage + recalcul DLC ✅
- [ ] DELETE → Supprimer plat + cascade ✅
- [ ] Filtres (expiringInDays) fonctionnent ✅

### Frontend ✅

- [ ] CookedDishesManager s'affiche dans "À Risque"
- [ ] CookedDishCard affiche correctement les infos
- [ ] Badge d'urgence avec bonnes couleurs
- [ ] Barre de progression portions
- [ ] Bouton "Manger" décrémente portions
- [ ] Bouton "Congeler/Décongeler" change stockage
- [ ] DLC se recalcule au changement de stockage
- [ ] Bouton "Supprimer" fonctionne
- [ ] Filtres (Tous / À finir) fonctionnent
- [ ] États vides gérés (aucun plat)
- [ ] Loading states affichés
- [ ] Design glassmorphisme cohérent

---

## 🐛 Problèmes courants

### Erreur : "Table cooked_dishes does not exist"
→ La migration n'a pas été appliquée. Retourner à l'étape 1.

### Erreur : "unauthorized"
→ Vérifier que l'utilisateur est bien authentifié et que le token est valide.

### Les ingrédients ne se déduisent pas
→ Vérifier que les lotId existent et appartiennent au bon user.

### La DLC ne se recalcule pas
→ Vérifier `lib/shelfLifeRules.js` et la fonction `calculateCookedDishExpiration`.

### Les portions ne décrementent pas
→ Vérifier les logs API et le service `consumePortions`.

### L'UI ne s'affiche pas
→ Vérifier la console navigateur pour erreurs JavaScript.

---

## 📝 Notes de test

**Prenez des notes pendant vos tests :**

- [ ] Bugs trouvés :
- [ ] Améliorations UX :
- [ ] Fonctionnalités manquantes :
- [ ] Performance :

---

🎉 **Une fois tous les tests passés, Phase 2 est validée !**

Vous pourrez alors passer à **Phase 3 : Planning Intelligent** ou créer le **CreateDishForm** pour faciliter la création de plats.
