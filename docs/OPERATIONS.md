# Opérations & sécurité — Myko

Réf. plan directeur « boucle fermée » PR 1. Ce document liste les **actions
manuelles** (non automatisables par migration) et l'**état de sécurité** après
PR 1. Voir aussi `docs/SECURITY_ACTIONS.md` et `docs/DATA_MODEL.md`.

## 1. Actions manuelles Supabase (dashboard) — à faire

Ces points sont signalés par les advisors et ne peuvent pas être corrigés par une
migration SQL :

- **Protection des mots de passe compromis** : Authentication → Policies →
  activer « Leaked password protection » (advisor `auth_leaked_password_protection`).
- **Mise à niveau PostgreSQL** : Settings → Infrastructure → upgrade (advisor
  `vulnerable_postgres_version`).
- **JWT & redirections** : vérifier la durée des JWT et la liste des URL de
  redirection autorisées.

Cocher ici une fois faits : `[ ] leaked-password  [ ] pg-upgrade  [ ] jwt/redirects`.

## 2. Sécurité corrigée en PR 1 (migrations versionnées)

- `security_definer_view` (2) → vues `cooked_dishes_active` / `cooked_dishes_stats`
  recréées en `security_invoker` (migration `..._security_harden_views_functions_grants`).
- `function_search_path_mutable` (8) → `SET search_path = public, pg_temp` sur les
  fonctions applicatives (même migration).
- Anciennes RPC `SECURITY DEFINER` : `EXECUTE` retiré à `anon`/`public` ;
  `is_allowed` / `consume_from_lot` / `open_one_unit` (inutilisées) retirées à
  `authenticated`.
- `anon` retiré de **toutes** les tables privées (user_id, `nutrition_plan_*`,
  `plan_regen_*`) — migration `..._scope_private_tables_revoke_anon`.

## 3. Sécurité — reste à faire (différé, plus risqué)

- **Verrou écritures catalogue** : les policies `myko_catalog_write USING(true)`
  autorisent encore `authenticated` à écrire le catalogue (canonical_foods,
  archetypes, recipes…). À verrouiller (`service_role` uniquement) **après** avoir
  routé l'auto-création de canoniques (`maybeCreateCanonical`) via un client
  `service_role` côté serveur, sinon l'auto-création casse.
- **RPC exposées restantes** : `split_containerized_lot` (appelée dans
  `app/pantry/page.js`) et `add_harvest_lot` (client + route) restent exécutables
  par `authenticated`. Les migrer vers des routes serveur (vérif `auth.uid()`,
  propriété du lot) puis révoquer `EXECUTE`.
- **`extension_in_public`** (`unaccent`, `pg_trgm`) : déplacer vers un schéma
  `extensions` dédié — attention aux appels `unaccent()` existants (RLS/fonctions).
- **`_backup_views`** : RLS activée sans policy — table de sauvegarde à supprimer
  ou à doter d'une policy.
- `pg_graphql_authenticated_table_exposed` : **par conception** — l'app lit ses
  propres lignes via le client `authenticated` sous RLS ; non bloquant.

## 4. Feature flags (`lib/featureFlags.js`)

Lus **côté serveur uniquement**, désactivés par défaut. Activer via variables
d'environnement (`1` / `true` / `on`) :

```
MYKO_CLOSED_LOOP_READS  MYKO_CLOSED_LOOP_WRITES  MYKO_TODAY_V2
MYKO_PLANNER_V2         MYKO_SHOPPING_V2         MYKO_FEEDBACK_V2
```

Ne jamais exposer l'objet de flags brut au client : passer par un ViewModel.
