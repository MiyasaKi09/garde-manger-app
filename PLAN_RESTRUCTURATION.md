# PLAN DE RESTRUCTURATION DE LA BASE DE DONNÉES

## 📋 ÉTAT ACTUEL

**✅ Points positifs** :
- 227 canonical_foods bien définis
- 289 archetypes tous liés à un canonical
- Pas d'incohérences majeures
- Pas de doublons détectés

**❌ Problèmes** :
- Pas de hiérarchie parent/enfant dans archetypes
- Archetypes trop spécifiques (ex: "Lait entier UHT", "Lait demi-écrémé UHT")
- Pas de flexibilité pour les recettes
- 0 cultivars (alors qu'on en a besoin pour lait de chèvre, morue, etc.)
- 385 ingrédients manquants pour les recettes

## 🎯 OBJECTIF FINAL (Option B)

```
CANONICAL (lait = lait de vache par défaut)
  ├─ ARCHETYPE PARENT (crème - flexible)
  │   ├─ ARCHETYPE ENFANT (crème liquide - précis)
  │   └─ ARCHETYPE ENFANT (crème épaisse - précis)
  │
  └─ CULTIVAR (lait de chèvre - vraiment différent)
      └─ ARCHETYPE (fromage de chèvre)
          └─ PRODUCT (Chavroux - marque)
```

## 🛠️ ÉTAPES DE RESTRUCTURATION

### ÉTAPE 1 : Ajouter parent_archetype_id ⏱️ 5 min
**Action** : Migration SQL pour ajouter la colonne

```sql
ALTER TABLE archetypes
ADD COLUMN parent_archetype_id BIGINT REFERENCES archetypes(id);
```

**Résultat** : Structure prête pour la hiérarchie

---

### ÉTAPE 2 : Créer les archetypes PARENT génériques ⏱️ 30 min
**Action** : Insérer les archetypes parent pour permettre la flexibilité

**Liste des parents à créer** :

**Produits laitiers** (canonical: lait) :
- `lait` (parent) → accepte entier/demi-écrémé/écrémé
- `crème` (parent) → accepte liquide/épaisse/fouettée
- `fromage` (parent) → accepte tous fromages
- `fromage râpé` (parent) → accepte emmental/gruyère/comté râpés
- `beurre` (parent) → accepte doux/demi-sel/salé
- `yaourt` (parent) → accepte nature/sucré/grec

**Viandes** (canonical: bœuf, porc, veau, agneau, poulet) :
- `bœuf haché` (standalone - déjà OK)
- `steak de bœuf` (parent) → accepte entrecôte/bavette/faux-filet
- `bœuf en morceaux` (parent) → accepte gîte/paleron/joue
- `jambon` (parent) → accepte cru/cuit/blanc/serrano
- `lardons` (parent) → accepte fumés/nature
- `saucisse` (parent) → accepte Toulouse/Strasbourg/fumées

**Farines** (canonical: blé) :
- `farine de blé` (parent) → accepte T45/T55/T65/T00

**Pâtes** :
- `pâtes longues` (parent) → accepte spaghetti/linguine/tagliatelles
- `pâtes courtes` (parent) → accepte penne/fusilli/rigatoni

**Total** : ~30-40 archetypes parent à créer

---

### ÉTAPE 3 : Réorganiser les archetypes existants ⏱️ 1-2h
**Action** : Lier les archetypes existants aux nouveaux parents

**Exemples** :

```sql
-- Produits laitiers
UPDATE archetypes SET parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'lait' AND parent_archetype_id IS NULL)
WHERE name IN ('Lait entier UHT', 'Lait demi-écrémé UHT', 'Lait écrémé UHT', 'Lait entier frais', etc.);

UPDATE archetypes SET parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'crème' AND parent_archetype_id IS NULL)
WHERE name IN ('crème liquide', 'crème épaisse', 'crème fouettée', etc.);

-- Viandes
UPDATE archetypes SET parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'jambon' AND parent_archetype_id IS NULL)
WHERE name IN ('jambon cru', 'jambon cuit', 'jambon blanc', etc.);
```

**Défis** :
- Identifier tous les archetypes qui doivent être des enfants
- S'assurer de ne pas casser les liens recipe_ingredients existants
- Gérer les cas ambigus

---

### ÉTAPE 4 : Créer les cultivars nécessaires ⏱️ 30 min
**Action** : Créer les cultivars pour les vraies différences

**Liste des cultivars à créer** :

```sql
-- Lait
INSERT INTO cultivars (cultivar_name, canonical_food_id, notes) VALUES
('lait de chèvre', (SELECT id FROM canonical_foods WHERE canonical_name = 'lait'), 'Goût différent, fromages spécifiques'),
('lait de brebis', (SELECT id FROM canonical_foods WHERE canonical_name = 'lait'), 'Fromages spécifiques (Roquefort)');

-- Poisson
INSERT INTO cultivars (cultivar_name, canonical_food_id, notes) VALUES
('morue', (SELECT id FROM canonical_foods WHERE canonical_name = 'cabillaud'), 'Cabillaud salé et séché');

-- Viande (si nécessaire)
INSERT INTO cultivars (cultivar_name, canonical_food_id, notes) VALUES
('bœuf wagyu', (SELECT id FROM canonical_foods WHERE canonical_name = 'bœuf'), 'Persillage unique');
```

**Total** : ~5-10 cultivars essentiels

---

### ÉTAPE 5 : Créer les archetypes liés aux cultivars ⏱️ 30 min
**Action** : Créer les archetypes qui dépendent des cultivars

```sql
-- Fromages de chèvre
INSERT INTO archetypes (name, cultivar_id, process, primary_unit) VALUES
('fromage de chèvre', (SELECT id FROM cultivars WHERE cultivar_name = 'lait de chèvre'), 'fromage', 'g'),
('bûche de chèvre', (SELECT id FROM cultivars WHERE cultivar_name = 'lait de chèvre'), 'fromage', 'g'),
('crottin de chèvre', (SELECT id FROM cultivars WHERE cultivar_name = 'lait de chèvre'), 'fromage', 'g');

-- Avec hiérarchie
UPDATE archetypes SET parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'fromage de chèvre')
WHERE name IN ('bûche de chèvre', 'crottin de chèvre');

-- Morue
INSERT INTO archetypes (name, cultivar_id, process, primary_unit) VALUES
('morue dessalée', (SELECT id FROM cultivars WHERE cultivar_name = 'morue'), 'dessalage', 'g'),
('brandade de morue', (SELECT id FROM cultivars WHERE cultivar_name = 'morue'), 'transformation', 'g');
```

---

### ÉTAPE 6 : Classifier les 385 ingrédients manquants ⏱️ 2-3h
**Action** : Reprendre les 385 ingrédients avec la nouvelle logique

**Logique de classification** :

1. **Chercher si archetype parent existe**
   - Exemple : "crème liquide 30%" → existe déjà "crème liquide" (enfant de "crème")
   - Action : Rien à faire

2. **Sinon, créer archetype enfant si parent existe**
   - Exemple : "jambon serrano" → créer enfant de "jambon" (parent)
   - Action : INSERT avec parent_archetype_id

3. **Sinon, créer archetype parent + enfant**
   - Exemple : nouvelle catégorie complète
   - Action : INSERT parent puis enfant

4. **Ou créer canonical si vraiment nouveau**
   - Exemple : "tofu", "tempeh" (pas encore dans la DB)
   - Action : INSERT dans canonical_foods puis archetype

**Priorisation** :
- D'abord les ingrédients fréquents (Grand Marnier, porto, calvados)
- Puis les ingrédients de recettes existantes
- Enfin les rares

---

### ÉTAPE 7 : Vérifier et nettoyer ⏱️ 1h
**Actions** :

1. **Vérifier la cohérence** :
```sql
-- Tous les archetypes enfants ont un parent valide
SELECT * FROM archetypes a
WHERE parent_archetype_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM archetypes p WHERE p.id = a.parent_archetype_id);

-- Pas de cycles
-- (requête récursive pour détecter les cycles)

-- Tous recipe_ingredients pointent vers quelque chose de valide
SELECT COUNT(*) FROM recipe_ingredients
WHERE canonical_food_id IS NULL
AND archetype_id IS NULL
AND cultivar_id IS NULL
AND product_id IS NULL;
```

2. **Fusionner les doublons potentiels** :
   - Identifier les archetypes avec noms similaires
   - Décider de fusionner ou garder séparés
   - Mettre à jour recipe_ingredients si fusion

3. **Tester la recherche** :
   - "J'ai crème liquide" → trouve recettes avec "crème" ou "crème liquide"
   - "J'ai emmental" → trouve recettes avec "fromage" ou "emmental"

---

### ÉTAPE 8 : Ré-importer les ingrédients des recettes ⏱️ 30 min
**Action** : Relancer l'import avec la nouvelle structure

```bash
node import-recipe-ingredients.js
```

**Résultat attendu** :
- Beaucoup plus de matchs grâce aux archetypes parent
- Moins d'ingrédients "non trouvés"
- Recettes avec tous leurs ingrédients

---

## 📊 RÉSUMÉ DES CHANGEMENTS

| Élément | Avant | Après |
|---------|-------|-------|
| Canonical foods | 227 | ~240 (quelques ajouts) |
| Cultivars | 0 | ~10 (essentiels) |
| Archetypes | 289 | ~400-500 (parents + enfants + nouveaux) |
| Archetypes avec parent | 0 | ~300-400 |
| Recipe_ingredients | 1000 | ~4500 (avec nouveaux imports) |
| Ingrédients manquants | 385 | ~50-100 (rares/ambigus) |

## ⚠️ RISQUES ET PRÉCAUTIONS

**Risques** :
1. Casser les liens existants recipe_ingredients
2. Créer des doublons
3. Perdre des données
4. Cycles dans la hiérarchie parent/enfant

**Précautions** :
1. **BACKUP COMPLET** avant toute modification
2. Tester sur une copie de la DB d'abord
3. Procéder étape par étape avec vérifications
4. Garder un journal des modifications
5. Possibilité de rollback à chaque étape

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

```
1. BACKUP de la base de données ✅ CRITIQUE
2. Étape 1: Ajouter parent_archetype_id (sans risque)
3. Étape 2: Créer archetypes parent (sans risque)
4. Étape 4: Créer cultivars (sans risque)
5. Étape 5: Créer archetypes liés aux cultivars (sans risque)
6. Étape 3: Réorganiser archetypes existants (⚠️ avec précaution)
7. Étape 6: Classifier et insérer 385 ingrédients
8. Étape 7: Vérifier et nettoyer
9. Étape 8: Ré-importer les ingrédients des recettes
```

## 💡 ALTERNATIVE : APPROCHE INCRÉMENTALE

Si "tout revoir" est trop risqué, on peut faire **incrémental** :

1. Ajouter parent_archetype_id (non destructif)
2. Créer les nouveaux archetypes parent/enfant pour les 385 manquants
3. Les laisser coexister avec les anciens
4. Migrer progressivement les recettes vers la nouvelle structure
5. Nettoyer les anciens archetypes quand plus utilisés

**Avantage** : Moins de risque, réversible
**Inconvénient** : DB "mélangée" temporairement

---

## ❓ QUESTION POUR TOI

Quelle approche préfères-tu ?

**A) Restructuration complète** (1 semaine, risqué mais propre)
**B) Approche incrémentale** (plusieurs semaines, sûr mais DB mixte)
**C) Hybride** (restructurer les nouveaux, migrer progressivement les anciens)
