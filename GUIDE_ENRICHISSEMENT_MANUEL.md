# 🚀 Guide d'Exécution - Enrichissement des Tags

**Date** : 27 octobre 2025  
**Action** : Enrichir 482 recettes restantes avec tags gastronomiques

---

## 📊 État Actuel

✅ **Progrès réalisé** :
- 396/878 recettes enrichies (45%)
- 1015 associations créées
- 75 tags disponibles

⚠️ **Manquant** :
- **482 recettes** non enrichies
- **~347 associations** à ajouter (objectif : 1362+)

---

## ⚡ MÉTHODE RECOMMANDÉE

### Étape 1 : Ouvrir Supabase SQL Editor

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Cliquer sur **SQL Editor** dans le menu latéral gauche
4. Cliquer sur **New query** (+ bouton)

---

### Étape 2 : Charger le Fichier d'Enrichissement

**Option A : Copier-Coller (RECOMMANDÉ si le fichier fait <10 MB)**

1. Ouvrir le fichier `/workspaces/garde-manger-app/tools/enrichment_optimized.sql` dans VS Code
2. Sélectionner **tout le contenu** (Ctrl+A / Cmd+A)
3. Copier (Ctrl+C / Cmd+C)
4. Retourner dans Supabase SQL Editor
5. Coller le contenu (Ctrl+V / Cmd+V)
6. Cliquer sur **RUN** (bouton vert en haut à droite)
7. Attendre la fin de l'exécution (~30-60 secondes)

**Option B : Import de fichier (si copier-coller échoue)**

Malheureusement, Supabase SQL Editor ne supporte pas l'import direct de fichiers SQL. Utilisez l'Option C.

**Option C : Exécution par sections (si timeout)**

Si le fichier complet cause un timeout, je vais créer 11 fichiers batch plus petits que vous pouvez exécuter un par un.

---

### Étape 3 : Vérifier le Résultat

Après l'exécution, copier-coller cette requête dans Supabase SQL Editor :

```sql
SELECT 
  COUNT(DISTINCT r.id) AS recettes_enrichies,
  COUNT(*) AS total_associations
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id;
```

**Résultat attendu** :
- `recettes_enrichies` : ≥ 585
- `total_associations` : ≥ 1362

**Résultat actuel** (avant exécution) :
- `recettes_enrichies` : 396
- `total_associations` : 1015

---

## 🛠️ Option C : Exécution par Batches

Si l'Option A cause un timeout, utilisons l'approche par batches.

### Batch disponibles (11 fichiers)

J'ai créé 11 fichiers dans `/tmp/` :
- `/tmp/enrich_clean_aa` (800 lignes)
- `/tmp/enrich_clean_ab` (800 lignes)
- `/tmp/enrich_clean_ac` (800 lignes)
- ... (jusqu'à `ak`)

### Comment exécuter un batch

**Pour chaque fichier** (aa, ab, ac, ..., ak) :

```bash
# Dans le terminal VS Code
cat /tmp/enrich_clean_aa
```

1. Copier la sortie
2. Aller dans Supabase SQL Editor
3. Coller le contenu
4. Cliquer sur **RUN**
5. Attendre la fin
6. Passer au batch suivant

**Note** : Chaque batch est indépendant et peut être exécuté séparément.

---

## 🧪 Test après Enrichissement

Une fois terminé, exécuter ces requêtes de test :

### 1. Vérification globale
```sql
SELECT 
  COUNT(DISTINCT r.id) AS recettes_enrichies,
  COUNT(*) AS total_associations
FROM recipe_tags rt
JOIN recipes r ON rt.recipe_id = r.id;
```

### 2. Recettes toujours non enrichies
```sql
SELECT COUNT(*) AS recettes_sans_tags
FROM recipes
WHERE id NOT IN (SELECT DISTINCT recipe_id FROM recipe_tags);
```
**Objectif** : <50 recettes

### 3. Répartition des tags par catégorie
```sql
SELECT 
  CASE 
    WHEN name LIKE 'Saveur-%' THEN 'Saveur'
    WHEN name LIKE 'Texture-%' THEN 'Texture'
    WHEN name LIKE 'Intensité-%' THEN 'Intensité'
    WHEN name LIKE 'Arôme-%' THEN 'Arôme'
    ELSE 'Autre'
  END AS categorie,
  COUNT(DISTINCT rt.recipe_id) AS nb_recettes
FROM tags t
JOIN recipe_tags rt ON rt.tag_id = t.id
GROUP BY categorie
ORDER BY nb_recettes DESC;
```

### 4. Top 10 recettes les plus taguées
```sql
SELECT 
  r.name AS recette,
  COUNT(rt.tag_id) AS nb_tags
FROM recipes r
JOIN recipe_tags rt ON rt.recipe_id = r.id
GROUP BY r.id, r.name
ORDER BY nb_tags DESC
LIMIT 10;
```

---

## 📝 Notes Importantes

### Pourquoi pas psql/terminal ?

- ❌ Le pooler PostgreSQL (`DATABASE_URL_TX`) ne fonctionne pas : "Tenant or user not found"
- ❌ La variable `DATABASE_URL` (directe) n'est pas définie dans `.env.local`
- ✅ L'interface Supabase SQL Editor fonctionne parfaitement

### Gestion des erreurs

Le fichier SQL contient `ON CONFLICT (recipe_id, tag_id) DO NOTHING`, donc :
- ✅ **Pas de problème** si vous exécutez le fichier plusieurs fois
- ✅ **Pas de doublons** créés
- ✅ **Idempotent** : peut être rejoué sans risque

### Si vous voyez "Duplicate key violation"

C'est **normal** ! Le SQL contient `ON CONFLICT DO NOTHING`. Continuez.

---

## 🎯 Objectifs après Enrichissement

| Métrique | Avant | Après | Objectif |
|----------|-------|-------|----------|
| Recettes enrichies | 396 | ≥585 | 100% (878) |
| Associations | 1015 | ≥1362 | 1500+ |
| Recettes sans tags | 482 | <50 | 0 |

---

## 🆘 Dépannage

### "Query timeout" ou "Request too large"

→ Utiliser l'Option C (batches de 800 lignes chacun)

### "Table recipe_tags doesn't exist"

→ Vérifier que vous êtes bien connecté à la bonne base de données

### "No rows affected"

→ Vérifier que les noms de recettes correspondent exactement (casse incluse)

---

## ✅ Checklist

- [ ] Ouvrir Supabase SQL Editor
- [ ] Charger `tools/enrichment_optimized.sql`
- [ ] Exécuter le fichier (ou les 11 batches si timeout)
- [ ] Vérifier le résultat avec les requêtes de test
- [ ] Confirmer : recettes_enrichies ≥ 585
- [ ] Confirmer : total_associations ≥ 1362

---

**Prochaine étape après enrichissement** : Implémentation de l'API d'assemblage intelligent  
**Voir** : `PROCHAINES_ETAPES.md` section "Implémentation API"

---

**Auteur** : Copilot AI  
**Date** : 27 octobre 2025  
**Durée estimée** : 2-5 minutes (selon méthode choisie)
