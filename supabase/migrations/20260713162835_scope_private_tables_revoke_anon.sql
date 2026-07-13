-- Retire tout accès du rôle anon aux tables PRIVÉES (données utilisateur) — appliqué
-- en production, idempotent. Réf. plan directeur PR 1, §9.6.
--
-- La RLS bloquait déjà les lignes pour anon ; on supprime en plus l'exposition
-- table / Data-API (advisor pg_graphql_anon_table_exposed). Le rôle authenticated
-- conserve ses accès : l'app lit ses propres lignes via RLS.
--
-- NB : le verrouillage des écritures catalogue (policies myko_catalog_write
-- USING(true) sur authenticated) est traité séparément — il exige d'abord de
-- router les auto-créations de canoniques via service_role côté serveur, sinon
-- l'auto-création côté client casse.
do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and (
        exists (select 1 from information_schema.columns col
                where col.table_schema='public' and col.table_name=c.relname and col.column_name='user_id')
        or c.relname like 'nutrition_plan_%'
        or c.relname like 'plan_regen_%'
      )
  loop
    execute format('revoke all on public.%I from anon', t.relname);
  end loop;
end $$;
