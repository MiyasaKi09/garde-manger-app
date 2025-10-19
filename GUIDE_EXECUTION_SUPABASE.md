# 🚀 Guide d'Exécution Manuelle - Enrichissement des Recettes

## Contexte
Vous allez enrichir **611 recettes** avec **1362 associations de tags** incluant :
- 11 cuisines (Française, Italienne, Japonaise...)
- 4 régimes (Végétarien, Vegan, Sans Gluten, Sans Lactose)
- 13 profils de saveur (Saveur-Salé, Saveur-Sucré, Saveur-Acide...)
- 5 textures (Texture-Crémeux, Texture-Croquant...)
- 4 intensités (Intensité-Léger, Intensité-Riche...)
- 10 familles aromatiques (Arôme-Fruité, Arôme-Agrumes...)

---

## 📋 Instructions Étape par Étape

### Étape 1 : Accéder à l'éditeur SQL Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **garde-manger-app**
3. Menu de gauche → **SQL Editor**
4. Cliquez sur **New Query** (nouvelle requête)

---

### Étape 2 : Vérifier que les tags sont créés ✅

Copiez-collez cette requête pour vérifier :

```sql
SELECT COUNT(*) as total_tags, 
       COUNT(*) FILTER (WHERE name LIKE 'Arôme-%') as aromes,
       COUNT(*) FILTER (WHERE name LIKE 'Saveur-%') as saveurs,
       COUNT(*) FILTER (WHERE name LIKE 'Texture-%') as textures,
       COUNT(*) FILTER (WHERE name LIKE 'Intensité-%') as intensites
FROM tags;
```

**Résultat attendu** :
- total_tags: ~77 (45 anciens + 32 nouveaux)
- aromes: 10
- saveurs: 7
- textures: 5
- intensites: 4

✅ Si les chiffres correspondent, passez à l'étape 3
❌ Si les chiffres sont trop bas, exécutez d'abord le fichier `tools/create_tags.sql` (voir Annexe A)

---

### Étape 3 : Enrichir les recettes

Vous avez **2 OPTIONS** :

---

#### **Option A : Fichier Unique (RECOMMANDÉ)**
🕐 **1 seule exécution** - ~30 secondes

**Fichier** : `tools/enrichment_optimized.sql` (221 KB, 8198 lignes)

**Procédure** :
1. Ouvrez le fichier `tools/enrichment_optimized.sql` dans VS Code
2. **Sélectionnez tout** (Ctrl+A ou Cmd+A)
3. **Copiez** (Ctrl+C ou Cmd+C)
4. Retournez sur Supabase SQL Editor
5. **Collez** dans l'éditeur SQL
6. Cliquez sur **Run** (ou F5)

⚠️ **Attention** : Le fichier fait 221 KB. Si Supabase limite la taille :
- Certains navigateurs peuvent ralentir pendant le collage
- Si timeout, utilisez l'Option B

---

#### **Option B : Fichiers Découpés (Si Option A échoue)**
🕐 **28 exécutions** - ~5 minutes total

**Fichiers** : `tools/batch_1_of_28.sql` à `tools/batch_28_of_28.sql`

**Procédure** :
Pour CHAQUE fichier (batch_1, batch_2... jusqu'à batch_28) :

1. Ouvrez le fichier `tools/batch_X_of_28.sql` dans VS Code
2. Sélectionnez tout + Copiez
3. Collez dans Supabase SQL Editor
4. Cliquez sur **Run**
5. Attendez le message de succès
6. Passez au fichier suivant

💡 **Astuce** : Utilisez les raccourcis clavier pour aller plus vite !

---

### Étape 4 : Vérifier le résultat

Après l'exécution, vérifiez avec cette requête :

```sql
-- Statistiques d'enrichissement
SELECT 
  COUNT(DISTINCT r.id) as recettes_enrichies,
  COUNT(*) as total_associations,
  COUNT(DISTINCT t.name) as types_tags_utilises
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id
JOIN tags t ON rt.tag_id = t.id;
```

**Résultat attendu** :
- recettes_enrichies: ~585 (toutes les recettes ne reçoivent pas de tags)
- total_associations: **≥ 1362**
- types_tags_utilises: ~50-60

---

### Étape 5 : Tester les profils gustatifs

Testez que les profils sont bien assignés :

```sql
-- Top 10 des recettes avec le plus de tags
SELECT 
  r.name,
  r.role,
  COUNT(*) as nb_tags,
  STRING_AGG(t.name, ', ' ORDER BY t.name) as tags
FROM recipes r
JOIN recipe_tags rt ON r.id = rt.recipe_id
JOIN tags t ON rt.tag_id = t.id
GROUP BY r.id, r.name, r.role
ORDER BY nb_tags DESC
LIMIT 10;
```

---

### Étape 6 : Tester l'assemblage intelligent

Exemple : Trouver des accompagnements pour "Bœuf bourguignon" :

```sql
-- Suggestions d'accompagnements par Food Pairing (arômes communs)
SELECT DISTINCT
  r2.name as accompagnement,
  t1.name as arome_commun
FROM recipes r1
JOIN recipe_tags rt1 ON r1.id = rt1.recipe_id
JOIN tags t1 ON rt1.tag_id = t1.id
JOIN recipe_tags rt2 ON rt2.tag_id = t1.id AND rt2.recipe_id != r1.id
JOIN recipes r2 ON rt2.recipe_id = r2.id
WHERE r1.name ILIKE '%boeuf%bourguignon%'
  AND t1.name LIKE 'Arôme-%'
  AND r2.role = 'ACCOMPAGNEMENT'
LIMIT 10;
```

---

## 🎉 Félicitations !

Une fois l'étape 4 validée, votre système d'assemblage intelligent est **OPÉRATIONNEL** ! 

Vous pouvez maintenant :
- ✅ Suggérer des accompagnements basés sur Food Pairing
- ✅ Équilibrer les plats (riche ↔ acide/léger)
- ✅ Créer des contrastes de texture (crémeux ↔ croquant)
- ✅ Respecter le terroir (même cuisine)

---

## 📚 Annexes

### Annexe A : Création manuelle des tags (si nécessaire)

Si les tags n'ont pas été créés, exécutez ce SQL :

```sql
INSERT INTO tags (name) VALUES
('Arôme-Agrumes'),
('Arôme-Caramélisé'),
('Arôme-Floral'),
('Arôme-Fruité'),
('Arôme-Lacté'),
('Arôme-Marin'),
('Arôme-Terreux'),
('Arôme-Végétal'),
('Arôme-Épicé Chaud'),
('Arôme-Épicé Frais'),
('Intensité-Intense'),
('Intensité-Léger'),
('Intensité-Moyen'),
('Intensité-Riche'),
('Long'),
('Luxe'),
('Moyen'),
('Pique-nique'),
('Quotidien'),
('Saveur-Acide'),
('Saveur-Amer'),
('Saveur-Floral'),
('Saveur-Herbacé'),
('Saveur-Salé'),
('Saveur-Sucré'),
('Saveur-Umami'),
('Saveur-Épicé'),
('Texture-Croquant'),
('Texture-Crémeux'),
('Texture-Ferme'),
('Texture-Liquide'),
('Texture-Moelleux')
ON CONFLICT (name) DO NOTHING;
```

### Annexe B : Nettoyage (si besoin de recommencer)

Pour supprimer toutes les associations créées :

```sql
-- ATTENTION : Ceci supprime TOUTES les associations recipe_tags !
-- À n'utiliser que si vous voulez recommencer à zéro

BEGIN;
DELETE FROM recipe_tags;
COMMIT;
```

---

## 🆘 Dépannage

### Problème : "Timeout" ou "Query too large"
**Solution** : Utilisez l'Option B (28 fichiers découpés)

### Problème : "Duplicate key violation"
**Solution** : Normal ! Le SQL utilise `ON CONFLICT DO NOTHING`. Continuez.

### Problème : Certaines recettes n'ont pas de tags
**Solution** : Normal ! Seulement 585 recettes sur 611 correspondent aux critères de détection automatique.

---

**Date** : 19 octobre 2025  
**Version** : 3.0 - Système complet d'assemblage intelligent
