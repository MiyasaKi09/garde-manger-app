# Migrations — Clarification des deux dossiers

## Deux dossiers de migration, deux rôles distincts

| Dossier | Contenu | Usage |
|---|---|---|
| `migrations/` (ce dossier) | Seeds de données historiques (ingrédients, recettes, archetypes…) appliqués manuellement au démarrage du projet | Reference uniquement — ne pas ré-exécuter sans audit préalable |
| `supabase/migrations/` | Migrations de schéma versionnées (tables, RLS, fonctions SQL) gérées par Supabase CLI | Source canonique du schéma — toute évolution structurelle passe par là |

Les fichiers dans ce dossier (`migrations/`) sont des seeds one-shot appliqués
manuellement via le SQL Editor de Supabase avant que le workflow CLI soit en place.
Ils ne sont pas idempotents dans le sens strict et ne doivent pas être rejoués sur
une base existante sans vérification.

Pour toute nouvelle migration de schéma, utiliser exclusivement `supabase/migrations/`.
