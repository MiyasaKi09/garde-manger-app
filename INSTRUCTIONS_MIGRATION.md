  # INSTRUCTIONS POUR EXÉCUTER LES MIGRATIONS

## ⚠️ IMPORTANT

Un **backup complet** a été créé dans `./backups/backup-2025-10-30T16-21-49-070Z/`

En cas de problème, tu peux restaurer la base de données.

---

## 🔧 ÉTAPE ACTUELLE: Ajouter parent_archetype_id

### Option 1: Via le Dashboard Supabase (RECOMMANDÉ)

1. Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet
3. Va dans **SQL Editor** (icône <>)
4. Clique sur **New Query**
5. Copie-colle le contenu du fichier `migrations/001-add-parent-archetype.sql`
6. Clique sur **Run** (ou Ctrl+Enter)
7. Vérifie que le résultat affiche : `total_archetypes: 289, with_parent: 0`

### Option 2: Via CLI Supabase (si installé)

```bash
supabase db execute -f migrations/001-add-parent-archetype.sql
```

### Option 3: Via psql (si connexion directe possible)

```bash
psql "$DATABASE_URL" < migrations/001-add-parent-archetype.sql
```

---

## ✅ Vérification

Une fois la migration exécutée, lance :

```bash
node check-db-structure.js
```

Tu devrais voir `parent_archetype_id` dans la liste des colonnes de la table `archetypes`.

---

## 📝 Prochaines étapes

Une fois cette migration réussie, reviens me dire "migration OK" et je continuerai avec :
1. Création des archetypes PARENT génériques
2. Création des cultivars
3. Etc.

---

## 🆘 En cas de problème

Si quelque chose ne fonctionne pas :
1. Note l'erreur exacte
2. Dis-moi et je t'aiderai à corriger
3. Si besoin, on peut restaurer le backup
