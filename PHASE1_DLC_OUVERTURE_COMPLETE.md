# Phase 1 : DLC après Ouverture - Complète ✅

## Résumé

La Phase 1 permet de **suivre l'ouverture des produits** et **ajuster automatiquement leur date de péremption (DLC)** selon des règles métier définies par catégorie.

### Exemple d'usage :
- **Avant** : Vous achetez 1L de lait, DLC originale : 10 jours
- **Action** : Vous cliquez sur "📦 Ouvrir" 
- **Après** : Le système ajuste la DLC à **3 jours** (durée de conservation du lait ouvert au frigo)

---

## Architecture Complète

### 1. Base de Données

**Migration SQL** : `supabase/migrations/001_shelf_life_after_opening.sql`

#### Colonnes ajoutées à `inventory_lots` :
```sql
ALTER TABLE inventory_lots
  ADD COLUMN adjusted_expiration_date DATE,
  ADD COLUMN is_opened BOOLEAN DEFAULT FALSE,
  ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE;
```

#### Index créés :
```sql
CREATE INDEX idx_inventory_lots_adjusted_exp 
  ON inventory_lots(adjusted_expiration_date);

CREATE INDEX idx_inventory_lots_is_opened 
  ON inventory_lots(is_opened);
```

#### Trigger de validation :
```sql
CREATE OR REPLACE FUNCTION validate_adjusted_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.adjusted_expiration_date IS NOT NULL 
     AND NEW.expiration_date IS NOT NULL 
     AND NEW.adjusted_expiration_date > NEW.expiration_date 
  THEN
    RAISE EXCEPTION 'La DLC ajustée ne peut pas être postérieure à la DLC originale';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Vue facilitée :
```sql
CREATE VIEW inventory_lots_with_effective_dlc AS
SELECT 
  *,
  COALESCE(adjusted_expiration_date, expiration_date) AS effective_expiration_date
FROM inventory_lots;
```

---

### 2. Règles Métier

**Fichier** : `lib/shelfLifeRules.js`

#### Règles par catégorie (30+ catégories) :
```javascript
export const SHELF_LIFE_AFTER_OPENING = {
  Lait: { fridge: 3, freezer: 30, pantry: null },
  Yaourt: { fridge: 5, freezer: null, pantry: null },
  Fromage: { fridge: 7, freezer: 60, pantry: null },
  Jambon: { fridge: 4, freezer: 30, pantry: null },
  Confiture: { fridge: 30, freezer: null, pantry: 14 },
  Sauce: { fridge: 7, freezer: null, pantry: null },
  Jus: { fridge: 3, freezer: null, pantry: null },
  Huile: { fridge: 90, freezer: null, pantry: 90 },
  Soda: { fridge: 5, freezer: null, pantry: 3 },
  // ... 20+ autres catégories
  _default: { fridge: 3, freezer: 30, pantry: 2 }
};
```

#### Fonctions principales :

**1. Calculer la DLC ajustée**
```javascript
calculateAdjustedExpiration(category, storageMethod, openedAt, originalDLC)
```
- Prend en compte la catégorie du produit
- Applique les règles selon le mode de stockage (fridge/freezer/pantry)
- Vérifie que la DLC ajustée ne dépasse pas la DLC originale
- Retourne `null` si le produit ne se conserve pas dans ce mode de stockage

**2. Inférer la catégorie automatiquement**
```javascript
inferCategory(productName, canonicalCategory)
```
- Détecte la catégorie depuis le nom du produit
- Exemples : "Lait 1L" → "Lait", "Confiture de fraises" → "Confiture"

**3. Générer des messages utilisateur**
```javascript
getShelfLifeMessage(category, storageMethod, daysLeft)
```
- Retourne un message clair : "Ce lait se conserve 3 jours au frigo après ouverture"

---

### 3. Service de Gestion des Lots

**Fichier** : `lib/lotManagementService.js`

#### Fonctions principales :

**1. Ouvrir un produit**
```javascript
async openLot(lotId, userId)
```
**Logique** :
1. Récupère le lot avec joins (`canonical_foods`, `products_catalog`)
2. Vérifie si déjà ouvert (empêche les doublons)
3. Infère la catégorie du produit
4. Calcule la DLC ajustée via `shelfLifeRules`
5. Met à jour la base de données :
   - `is_opened = true`
   - `opened_at = NOW()`
   - `adjusted_expiration_date = [calculée]`
6. Retourne un objet avec le lot modifié + message de confirmation

**Retour** :
```javascript
{
  success: true,
  lot: { ...updatedLot },
  message: "Produit ouvert. Nouvelle DLC : 25/05/2024 (3 jours)",
  daysUntilExpiration: 3
}
```

**2. Fermer un produit (restaurer DLC originale)**
```javascript
async closeLot(lotId, userId)
```
- Remet `is_opened = false`
- Efface `opened_at` et `adjusted_expiration_date`

**3. Changer le mode de stockage**
```javascript
async changeStorageMethod(lotId, userId, newStorageMethod)
```
- Si le produit est ouvert, recalcule la DLC ajustée pour le nouveau mode
- Exemple : Déplacer du lait du frigo (3j) au congélateur (30j)

---

### 4. API REST

**Fichier** : `app/api/lots/manage/route.js`

#### Endpoints :

**POST /api/lots/manage**
```javascript
Body: {
  action: 'open' | 'close' | 'changeStorage',
  lotId: number,
  newStorageMethod?: string // Pour action=changeStorage
}
```

**Exemples** :
```bash
# Ouvrir un produit
curl -X POST /api/lots/manage \
  -H "Content-Type: application/json" \
  -d '{"action": "open", "lotId": 123}'

# Changer le stockage
curl -X POST /api/lots/manage \
  -H "Content-Type: application/json" \
  -d '{"action": "changeStorage", "lotId": 123, "newStorageMethod": "freezer"}'
```

**GET /api/lots/manage?lotId=123**
- Récupère les infos d'un lot avec sa DLC effective

**Authentification** : 
- Utilise `createRouteHandlerClient` de Supabase
- Vérifie que `user.id` correspond au `user_id` du lot

**Gestion des erreurs** :
- `400` : Paramètres manquants ou invalides
- `401` : Non authentifié
- `404` : Lot introuvable
- `500` : Erreur serveur

---

### 5. Interface Utilisateur

**Fichier modifié** : `app/pantry/components/PantryProductCard.jsx`

#### Modifications :

**1. Nouveau state**
```javascript
const [opening, setOpening] = useState(false);
```

**2. Nouveau prop**
```javascript
export default function PantryProductCard({ 
  item, 
  onConsume, 
  onEdit, 
  onDelete, 
  onUpdateQuantity, 
  onOpen // ← NOUVEAU
})
```

**3. Bouton "Ouvrir"** (affiché seulement si non ouvert)
```jsx
{!item.is_opened && onOpen && (
  <button 
    className="action-btn open"
    onClick={handleOpen}
    disabled={opening}
    title="Marquer comme ouvert (ajuste la date de péremption)"
  >
    {opening ? '⏳' : '📦'} {opening ? 'Ouverture...' : 'Ouvrir'}
  </button>
)}
```

**4. Affichage DLC ajustée**
```jsx
{item.expiration_date && (
  <div className="info-row">
    <span className="info-icon">🗓️</span>
    <span className="info-value">{formatDate(item.expiration_date)}</span>
    {item.is_opened && item.adjusted_expiration_date && (
      <span className="dlc-adjusted" title="DLC ajustée après ouverture">
        → {formatDate(item.adjusted_expiration_date)}
      </span>
    )}
  </div>
)}
```

**5. Badge "Ouvert"**
```jsx
{item.is_opened && (
  <div className="info-row">
    <span className="opened-badge">
      ✅ Ouvert le {formatDate(item.opened_at)}
    </span>
  </div>
)}
```

---

**Fichier modifié** : `app/pantry/page.js`

#### Fonction `handleOpen` ajoutée :
```javascript
async function handleOpen(lotId) {
  try {
    const response = await fetch('/api/lots/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'open', lotId }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || 'Erreur lors de l\'ouverture du produit');
      return;
    }

    if (result.success) {
      await loadPantryItems(); // Recharger pour afficher la DLC ajustée
      console.log('✅', result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'ouverture du produit');
  }
}
```

#### Passage du callback :
```jsx
<ProductCard 
  key={item.id} 
  item={item}
  onConsume={() => handleConsume(item.id)}
  onEdit={() => handleEdit(item.id)}
  onDelete={() => handleDeleteClick(item.id)}
  onUpdateQuantity={handleUpdateQuantity}
  onOpen={() => handleOpen(item.id)} // ← NOUVEAU
/>
```

---

**Fichier modifié** : `app/pantry/pantry.css`

#### Styles ajoutés :

**1. Bouton "Ouvrir" (orange)**
```css
.action-btn.open:hover {
  background: rgba(255, 152, 0, 0.3);
  border-color: rgba(255, 152, 0, 0.5);
  color: #e65100;
}
```

**2. Badge "Ouvert"**
```css
.opened-badge {
  display: inline-block;
  background: rgba(102, 187, 106, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(102, 187, 106, 0.4);
  border-radius: 10px;
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2e7d32;
  animation: fadeIn 0.3s ease-in;
}
```

**3. DLC ajustée (orange avec animation pulse)**
```css
.dlc-adjusted {
  margin-left: 0.5rem;
  color: #ff6f00;
  font-weight: 600;
  font-size: 0.8rem;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 8px;
  padding: 0.2rem 0.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## Workflow Utilisateur

### Scénario 1 : Ouvrir un produit

1. **État initial** : Vous avez 1L de lait au frigo, DLC : 30/05/2024
2. **Action** : Cliquez sur "📦 Ouvrir"
3. **Backend** :
   - Appel API `/api/lots/manage` avec `action=open`
   - `lotManagementService.openLot()` est exécuté
   - Catégorie détectée : "Lait"
   - Règle appliquée : Lait au frigo = 3 jours après ouverture
   - DLC ajustée calculée : Aujourd'hui + 3 jours = 25/05/2024
   - Database update : `is_opened=true`, `opened_at=NOW()`, `adjusted_expiration_date=25/05/2024`
4. **Frontend** :
   - Rechargement de l'inventaire
   - Affichage du badge "✅ Ouvert le 22/05/2024"
   - Affichage de la DLC : "30/05/2024 → **25/05/2024**" (en orange avec animation)
   - Bouton "Ouvrir" disparaît (déjà ouvert)

### Scénario 2 : Déplacer un produit ouvert

1. **État** : Lait ouvert au frigo (DLC ajustée : 3 jours)
2. **Action** : Vous le déplacez au congélateur via "Modifier"
3. **Backend** :
   - Appel `lotManagementService.changeStorageMethod()`
   - Détecte que le produit est ouvert
   - Règle appliquée : Lait au freezer = 30 jours après ouverture
   - DLC ajustée recalculée : Aujourd'hui + 30 jours
4. **Frontend** :
   - DLC mise à jour automatiquement
   - Badge "Ouvert" reste affiché

### Scénario 3 : Fermer un produit (rare)

1. **État** : Produit marqué comme ouvert
2. **Action** : Appel API `/api/lots/manage` avec `action=close`
3. **Backend** :
   - `lotManagementService.closeLot()` restaure l'état original
   - `is_opened=false`, `opened_at=null`, `adjusted_expiration_date=null`
4. **Frontend** :
   - Badge "Ouvert" disparaît
   - DLC originale réaffichée
   - Bouton "Ouvrir" réapparaît

---

## Installation et Déploiement

### Étape 1 : Exécuter la migration SQL

```bash
# Via Supabase CLI
supabase db push

# OU via Dashboard Supabase
# Copier le contenu de supabase/migrations/001_shelf_life_after_opening.sql
# Coller dans SQL Editor et exécuter
```

### Étape 2 : Vérifier la migration

```sql
-- Vérifier les colonnes ajoutées
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory_lots' 
  AND column_name IN ('is_opened', 'opened_at', 'adjusted_expiration_date');

-- Vérifier la vue
SELECT * FROM inventory_lots_with_effective_dlc LIMIT 5;
```

### Étape 3 : Tester avec un produit

```sql
-- Créer un produit de test
INSERT INTO inventory_lots (
  user_id, 
  product_type, 
  product_id, 
  qty_remaining, 
  unit, 
  storage_place, 
  expiration_date
) VALUES (
  '[VOTRE_USER_ID]',
  'canonical',
  1, -- ID d'un produit existant dans canonical_foods
  1,
  'L',
  'fridge',
  CURRENT_DATE + INTERVAL '10 days'
);
```

### Étape 4 : Tester l'ouverture via UI

1. Ouvrez l'application → `/pantry`
2. Trouvez le produit de test
3. Cliquez sur "📦 Ouvrir"
4. Vérifiez :
   - Badge "✅ Ouvert le XX/XX/XXXX"
   - DLC ajustée affichée en orange
   - Bouton "Ouvrir" a disparu

### Étape 5 : Vérifier en base

```sql
SELECT 
  id,
  is_opened,
  opened_at,
  expiration_date,
  adjusted_expiration_date,
  COALESCE(adjusted_expiration_date, expiration_date) AS effective_dlc
FROM inventory_lots
WHERE is_opened = TRUE;
```

---

## Tests Recommandés

### Test 1 : Ouverture simple
- ✅ Créer un lot de lait
- ✅ Cliquer "Ouvrir"
- ✅ Vérifier DLC ajustée = J+3

### Test 2 : Catégories diverses
- ✅ Ouvrir du yaourt → J+5
- ✅ Ouvrir de la confiture → J+30
- ✅ Ouvrir du jambon → J+4
- ✅ Ouvrir un produit inconnu → J+3 (règle par défaut)

### Test 3 : Changement de stockage
- ✅ Ouvrir un produit au frigo
- ✅ Le déplacer au congélateur
- ✅ Vérifier que la DLC est recalculée

### Test 4 : Fermeture
- ✅ Ouvrir un produit
- ✅ Appeler `closeLot()` via API
- ✅ Vérifier que la DLC originale est restaurée

### Test 5 : Produits incompatibles
- ✅ Essayer de congeler un soda (règle : `freezer: null`)
- ✅ Vérifier que `adjusted_expiration_date` reste `null`

### Test 6 : Validation trigger
- ✅ Essayer de définir `adjusted_expiration_date` > `expiration_date`
- ✅ Vérifier que le trigger bloque la modification

---

## Dépannage

### Problème : Le bouton "Ouvrir" ne s'affiche pas

**Causes possibles** :
1. `item.is_opened === true` → Déjà ouvert
2. `onOpen` prop non passé → Vérifier `page.js`
3. CSS manquant → Vérifier `pantry.css`

**Solution** :
```javascript
console.log('item.is_opened:', item.is_opened);
console.log('onOpen prop:', !!onOpen);
```

### Problème : Erreur 401 lors de l'ouverture

**Cause** : Utilisateur non authentifié

**Solution** :
```javascript
// Vérifier l'auth dans la console
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);
```

### Problème : DLC ajustée = null après ouverture

**Causes possibles** :
1. Catégorie incompatible avec le stockage (ex: soda au congélateur)
2. DLC originale est `null`
3. Règle non trouvée

**Solution** :
```javascript
// Vérifier la logique dans lotManagementService.js
console.log('Category inférée:', inferredCategory);
console.log('Storage method:', lot.storage_place);
console.log('Règle appliquée:', SHELF_LIFE_AFTER_OPENING[category]);
```

### Problème : DLC ajustée > DLC originale

**Cause** : Bug dans `calculateAdjustedExpiration()`

**Solution** : Le trigger SQL devrait bloquer cela automatiquement. Vérifier les logs :
```sql
-- Logs du trigger
SELECT * FROM pg_stat_statements WHERE query LIKE '%validate_adjusted_expiration%';
```

---

## Prochaines Étapes (Phase 2 et 3)

### Phase 2 : Plats Cuisinés
- Créer tables `cooked_dishes` et `cooked_dish_ingredients`
- Service `cookedDishesService.js` pour créer/gérer les plats
- UI `CookedDishesManager.jsx` pour afficher les plats
- Intégration dans l'onglet "À Risque"

### Phase 3 : Planning Intelligent
- Service `planningService.js` pour détecter les restes
- Suggestions de repas basées sur les restes
- Priorités : Finir plats > Utiliser ingrédients > Nouvelles recettes

---

## Documentation Associée

- **Spécifications complètes** : `SPEC_SYSTEME_RESTES_COMPLET.md`
- **Intégration garde-manger** : `INTEGRATION_RESTES_GARDE_MANGER.md`
- **Migration SQL** : `supabase/migrations/001_shelf_life_after_opening.sql`

---

## Résumé des Fichiers Modifiés/Créés

| Fichier | Type | Statut |
|---------|------|--------|
| `supabase/migrations/001_shelf_life_after_opening.sql` | Migration | ✅ Créé |
| `lib/shelfLifeRules.js` | Service | ✅ Créé |
| `lib/lotManagementService.js` | Service | ✅ Créé |
| `app/api/lots/manage/route.js` | API | ✅ Créé |
| `app/pantry/components/PantryProductCard.jsx` | UI | ✅ Modifié |
| `app/pantry/page.js` | UI | ✅ Modifié |
| `app/pantry/pantry.css` | Style | ✅ Modifié |

---

**Phase 1 : COMPLÈTE ✅**

Prêt pour déploiement et tests utilisateur ! 🎉
