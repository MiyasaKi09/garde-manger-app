# tools/archive — Scripts SQL supersédés

Ce dossier contient les variantes SQL déplacées ici lors de l'audit de juillet 2026
(migration 20260708). Ces fichiers sont conservés à titre de référence historique
et ne doivent PAS être ré-exécutés sur la base de production.

---

## Fonctions de calcul nutritionnel (archivées le 2026-07-08)

La source canonique est désormais :

```
supabase/migrations/20260708_nutrition_functions_consolidated.sql
```

| Fichier archivé | Raison |
|---|---|
| `create_nutrition_function.sql` | Version 1 sans process modifiers ni conversion d'unités |
| `create_nutrition_function_v2.sql` | Version 2 avec process modifiers, bug de nommage dans cooking_factors CTE (utilise `nutrient_name` comme alias alors que la colonne source s'appelle aussi `nutrient_name` → conflit de résolution) |
| `fix_function.sql` | Version debug sans exception handler — ne pas utiliser en prod |
| `fix_function_v2.sql` | Correction du bug de nommage (utilise `AS nutrient`), pas de conversion d'unités ; supersédée par la migration consolidée |
| `create_cache_function.sql` | Fonction `calculate_and_cache_nutrition` originale, sans conversion d'unités ni ingredients_hash |
| `create_nutrition_cache.sql` | Script d'initialisation du cache (table + triggers + wrapper `get_recipe_nutrition`). Le wrapper `get_recipe_nutrition` n'est pas réinstallé dans la migration consolidée car il n'était appelé nulle part dans l'application. |

---

## populate_archetype_overrides.sql (archivé le 2026-07-08)

Supersédé par :

```
supabase/migrations/20260610_archetype_nutrition_overrides.sql
```

### Dangers de ce fichier (ne pas ré-exécuter)

1. **TRUNCATE TABLE archetype_nutrition_overrides CASCADE** — supprime TOUS les
   overrides existants avant d'insérer. Si la migration 20260610 a été appliquée,
   ré-exécuter ce fichier effacerait les overrides basés sur les noms et ne garderait
   que les 7 lignes codées en dur de ce fichier.

2. **IDs d'archétypes codés en dur** (204, 205, 206, 207, 208, 209, 199, 237, 238…).
   Ces IDs ont pu changer lors des refontes taxonomiques documentées dans
   `migrations/014-018`. Les sous-requêtes `(SELECT id FROM nutritional_data WHERE
   source_id = '...' LIMIT 1)` sont robustes, mais les archetype_ids sont fragiles.

3. **Stratégie** : la migration 20260610 utilise des lookups par nom (`WHERE name = ...`)
   au lieu d'IDs codés en dur — c'est le bon pattern.
