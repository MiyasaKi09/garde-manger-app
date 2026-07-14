-- Durcissement sécurité (advisors) — appliqué en production, idempotent.
-- Réf. plan directeur PR 1, §9.3–9.5.
--
-- Corrige : 2× security_definer_view, 8× function_search_path_mutable,
-- et retire l'exécution des anciennes RPC SECURITY DEFINER à anon/public
-- (+ authenticated pour celles non utilisées par l'app).
-- Conservé : authenticated EXECUTE sur split_containerized_lot et add_harvest_lot
-- (encore appelées par le client → migration vers route serveur dans une étape ultérieure).

begin;

-- 1) Vues : appliquer la RLS de l'appelant (corrige security_definer_view)
alter view public.cooked_dishes_active set (security_invoker = true);
alter view public.cooked_dishes_stats  set (security_invoker = true);

-- 2) Fonctions applicatives : figer le search_path (corrige function_search_path_mutable)
alter function public.calculate_recipe_nutrition(integer)                 set search_path = public, pg_temp;
alter function public.calculate_and_cache_nutrition(integer)              set search_path = public, pg_temp;
alter function public.consume_lots_fefo(jsonb)                            set search_path = public, pg_temp;
alter function public.auto_open_lot_on_partial_consumption()              set search_path = public, pg_temp;
alter function public.food_qty_to_grams(numeric, text, numeric, numeric)  set search_path = public, pg_temp;
alter function public.commit_cooking_session(jsonb)                       set search_path = public, pg_temp;
alter function public.undo_cooking_session(uuid)                          set search_path = public, pg_temp;
alter function public.replace_generated_recipe_ingredients(bigint, jsonb) set search_path = public, pg_temp;

-- 3) Anciennes RPC SECURITY DEFINER : retirer l'exécution à anon/public partout.
revoke execute on function public.is_allowed()                                                 from anon, public;
revoke execute on function public.add_harvest_lot(uuid, uuid, uuid, numeric, text, date, text) from anon, public;
revoke execute on function public.consume_from_lot(uuid, numeric)                              from anon, public;
revoke execute on function public.consume_from_lot(uuid, numeric, text)                        from anon, public;
revoke execute on function public.open_one_unit(text)                                          from anon, public;
revoke execute on function public.open_one_unit(uuid)                                          from anon, public;
revoke execute on function public.split_containerized_lot(uuid, numeric, character varying)    from anon, public;

-- 3b) RPC legacy NON utilisées par l'app : retirer aussi à authenticated (service_role garde l'accès).
revoke execute on function public.is_allowed()                          from authenticated;
revoke execute on function public.consume_from_lot(uuid, numeric)       from authenticated;
revoke execute on function public.consume_from_lot(uuid, numeric, text) from authenticated;
revoke execute on function public.open_one_unit(text)                   from authenticated;
revoke execute on function public.open_one_unit(uuid)                   from authenticated;

commit;
